/**
 * MOTHER EARTH — Phase 1, step 1 collector Worker
 * Spec: SPEC-v0.3.md (§3 activity/coverage/freshness, §4 architecture, §5 data model, §10 acceptance)
 *
 * One Worker, three jobs, dispatched by cron string:
 *   "* /5 * * * *"  (every 5 min)  → USGS, SWPC, OpenSky world pull
 *   "* * * * *"     (every 1 min)  → OpenSky bbox pull, budget-gated (auto-degrades; §4.3)
 *   "* /15 * * * *" (every 15 min) → FIRMS world/1
 *   "7 * * * *"     (hourly, :07)  → aggregate previous hour from R2 cell files into D1
 *
 * HTTP (viewers only read; §4.2):
 *   GET /snapshot/<layer>   latest full snapshot (records + cells)
 *   GET /cells/<layer>      latest cells-only file (small)
 *   GET /status             last runs per layer + OpenSky spend today
 *   GET /admin/run/<job>?key=ADMIN_KEY   run a job now (jobs: five, minute, firms, hourly)
 *
 * Bindings (set in dashboard → Worker → Settings → Bindings):
 *   R2  = R2 bucket binding        DB = D1 database binding
 * Secrets: OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET, FIRMS_MAP_KEY, ADMIN_KEY
 * Plain vars (optional): OPENSKY_BBOX = "lamin,lomin,lamax,lomax"  (default southern Africa)
 *                        FIRMS_REGION = "west,south,east,north"   (default: world; set only if the Free plan's CPU limit forces it)
 *
 * Deviations from v0.3 to be recorded as a v0.4 diff (reasons in GUIDE-step1.md §6):
 *   D1  one Worker instead of one per layer (packaging only; same code path, fewer dashboard steps)
 *   D2  hourly aggregation (:07) instead of nightly 02:00 — a nightly run would read ~700 R2 files
 *       and parse them inside one invocation's CPU budget (10 ms on Free, 30 s on Paid). Hourly reads
 *       ~15 files. The aggregates are identical; raw snapshots stay the asset and remain re-derivable.
 *   D3  records stored as rows with a declared field list (record_format:'rows') rather than one
 *       object per record — same data model (§5), ~3× less CPU and bytes.
 *   D7  CPU is the binding constraint, not subrequests (R2/D1 calls count against a 1,000 limit).
 *       Measured in a sandbox: FIRMS world/1 (~10 MB, 120k rows) ≈ 250 ms CPU; OpenSky world ≈ 37 ms;
 *       USGS/SWPC < 1 ms. The Free plan's 10 ms will not run FIRMS world and probably not OpenSky
 *       world. GUIDE-step1.md §5 measures this on Cloudflare's own hardware before any decision.
 *   D4  OpenSky hourly quantity = mean (and max) of "unique aircraft per cell per 5-min snapshot"
 *       over the hour — the per-interval quantity §5 names, bucketed. Not occupancy.
 *   D5  USGS cells carry count (M2.5+) and count_m45 (M4.5+). USGS documents global completeness
 *       at M4.5, not M2.5, so the M4.5+ quantity is the one that can be graded adequate.
 *   D6  Zeros are NOT materialised as D1 rows (would exceed the 100k writes/day budget).
 *       layer_hourly records which cells were adequate for the hour; an adequate cell with no
 *       cell_hourly row IS a zero. This is the "coverage record" §4.2 relies on.
 */

const SCHEMA_VERSION = 1;
const COLLECTOR_VERSION = '0.1.4';
const CELL_DEG = 4;                       // §4.2: stay at 4° until needed
const OPENSKY_DAILY_CREDITS = 4000;       // §4.3
const OPENSKY_SOFT = 0.80, OPENSKY_HARD = 0.95;
const WORLD_COST_DEFAULT = 4;
const STALE_AFTER_S = { usgs: 900, swpc: 900, opensky: 600, firms: 2400, co2: 2 * 3600, seaice: 8 * 3600 }; // §3.3 collector freshness (co2: daily product, collected hourly)
const FIRMS_MAX_PARSE_BYTES = 4 * 1024 * 1024;  // guard: beyond this, keep raw only. Measured 30 Oct 2026: 1.3 MB ≈ 15 ms CPU on the Free plan (soft 10 ms)

const URLS = {
  usgs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
  swpc: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  opensky: 'https://opensky-network.org/api/states/all',
  openskyToken: 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
  co2Daily: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv',
  co2Weekly: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_weekly_mlo.csv',
  seaice: (h) => `https://noaadata.apps.nsidc.org/NOAA/G02135/${h}/daily/data/${h === 'north' ? 'N' : 'S'}_seaice_extent_daily_v4.0.csv`,
  seaiceClim: (h) => `https://noaadata.apps.nsidc.org/NOAA/G02135/${h}/daily/data/${h === 'north' ? 'N' : 'S'}_seaice_extent_climatology_1981-2010_v4.0.csv`,
  firms: (key, region) => `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_NOAA20_NRT/${region || 'world'}/1`,  // region = "west,south,east,north"
};

const UA = 'mother-earth-collector/' + COLLECTOR_VERSION + ' (open project; github.com/TheOneTheOnlyTheChad)';

// ---------------------------------------------------------------- helpers

function cellId(lat, lng) {
  const r = Math.max(0, Math.min(Math.floor(180 / CELL_DEG) - 1, Math.floor((lat + 90) / CELL_DEG)));
  const c = Math.max(0, Math.min(Math.floor(360 / CELL_DEG) - 1, Math.floor((lng + 180) / CELL_DEG)));
  return r + '_' + c;
}
function isoMinute(ms) { return new Date(ms).toISOString().slice(0, 16).replace(':', '-') + 'Z'; } // 2026-10-30T08-05Z
function hourKey(ms) { return new Date(ms).toISOString().slice(0, 13); }                           // 2026-10-30T08
function dayKey(ms) { return new Date(ms).toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }

async function fetchText(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers || {}) } });
  const text = await r.text();
  return { status: r.status, ok: r.ok, text, headers: r.headers };
}

async function putJson(env, key, obj) {
  const body = JSON.stringify(obj);
  await env.R2.put(key, body, { httpMetadata: { contentType: 'application/json' } });
  return body.length;
}
async function getJson(env, key) {
  const o = await env.R2.get(key);
  return o ? await o.json() : null;
}

async function logRun(env, layer, startedMs, status, http, records, bytes, note) {
  try {
    await env.DB.prepare(
      'INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(layer, new Date(startedMs).toISOString(), nowIso(), status, http, records, bytes, (note || '').slice(0, 500)).run();
  } catch (e) { console.log('logRun failed', layer, String(e)); }
}

/** Write the §5 envelope: full snapshot + small cells file + latest pointers. */
async function writeSnapshot(env, layer, scheduledMs, envelope) {
  const stamp = isoMinute(scheduledMs);
  const cellsOnly = { ...envelope, records: undefined, record_fields: undefined, record_format: undefined };
  const full = await putJson(env, `snapshots/${layer}/${stamp}.json`, envelope);
  await putJson(env, `cells/${layer}/${stamp}.json`, cellsOnly);
  await putJson(env, `latest/${layer}.json`, envelope);
  await putJson(env, `latest-cells/${layer}.json`, cellsOnly);
  return full;
}

function envelope(layer, scheduledMs, windowStart, windowEnd, sourceStatus, cells, fields, rows, extra = {}) {
  return {
    schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION,
    layer, window_start: windowStart, window_end: windowEnd, retrieved_at: nowIso(),
    scheduled_for: new Date(scheduledMs).toISOString(),
    source_status: sourceStatus,          // 'ok' | 'degraded' | 'down'
    interruptions: [],
    stale_after_s: STALE_AFTER_S[layer],
    cells,                                // { cell_id: { count, coverage:{grade, evidence, observed_fraction} } }
    record_format: 'rows', record_fields: fields, records: rows,
    ...extra,
  };
}

/** A down/failed run still writes a cells file so the hour's coverage is recorded as unknown (§10.1). */
async function writeDown(env, layer, scheduledMs, note, http) {
  const e = envelope(layer, scheduledMs, null, null, 'down', {}, [], [], { note });
  await putJson(env, `cells/${layer}/${isoMinute(scheduledMs)}.json`, { ...e, records: undefined });
  await putJson(env, `latest-cells/${layer}.json`, { ...e, records: undefined });
  // latest/<layer>.json is NOT overwritten: viewer keeps the last good snapshot, and its retrieved_at
  // ages past stale_after → layer Unknown (§3.3). The cells file above carries the 'down' status.
  await logRun(env, layer, scheduledMs, 'down', http || 0, 0, 0, note);
}

// ---------------------------------------------------------------- USGS

async function collectUsgs(env, scheduledMs) {
  const layer = 'usgs';
  let res;
  try { res = await fetchText(URLS.usgs); } catch (e) { return writeDown(env, layer, scheduledMs, 'fetch failed: ' + e, 0); }
  if (!res.ok) return writeDown(env, layer, scheduledMs, 'http ' + res.status, res.status);
  let j;
  try { j = JSON.parse(res.text); } catch (e) { return writeDown(env, layer, scheduledMs, 'bad json', res.status); }

  const generated = j.metadata && j.metadata.generated;          // §3.4 health signal
  const ageS = generated ? (Date.now() - generated) / 1000 : null;
  const fresh = ageS !== null && ageS < 600;                      // §3.2: feed generated within 10 min
  const fields = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'];
  const rows = []; const cells = {};
  for (const f of j.features || []) {
    const c = f.geometry && f.geometry.coordinates; const p = f.properties || {};
    if (!c) continue;
    const [lng, lat, depth] = c;
    rows.push([f.id, lat, lng, depth, p.mag, p.magType || null, new Date(p.time).toISOString(), p.title || '', p.url || '']);
    const id = cellId(lat, lng);
    const cell = cells[id] || (cells[id] = { count: 0, count_m45: 0, ids: [] });
    cell.count++; if (p.mag >= 4.5) cell.count_m45++; cell.ids.push([f.id, new Date(p.time).toISOString(), p.mag]);
  }
  // Coverage (§3.2): M2.5 completeness is not global and no map is wired yet → partial for count;
  // M4.5+ is documented globally complete → count_m45 is the comparison-eligible quantity (D5).
  const grade = fresh ? 'partial' : 'unknown';
  const evidence = fresh ? 'feed_fresh;m2.5_completeness_map_pending;m4.5_global_complete' : 'feed_stale_' + Math.round(ageS || -1) + 's';
  for (const id in cells) cells[id].coverage = { grade, evidence, observed_fraction: fresh ? 1 : 0 };
  const status = fresh ? 'ok' : 'degraded';
  const e = envelope(layer, scheduledMs, new Date(Date.now() - 86400e3).toISOString(), nowIso(), status, cells, fields, rows,
    { source_generated_at: generated ? new Date(generated).toISOString() : null, source_age_s: ageS,
      coverage_default: { grade, evidence, observed_fraction: fresh ? 1 : 0 },
      quantity: 'earthquakes M2.5+ in the last 24 h (count) and M4.5+ (count_m45), deduplicated by USGS id' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await logRun(env, layer, scheduledMs, status, res.status, rows.length, bytes, 'generated_age_s=' + Math.round(ageS || -1));
}

// ---------------------------------------------------------------- SWPC Kp

async function collectSwpc(env, scheduledMs) {
  const layer = 'swpc';
  let res;
  try { res = await fetchText(URLS.swpc); } catch (e) { return writeDown(env, layer, scheduledMs, 'fetch failed: ' + e, 0); }
  if (!res.ok) return writeDown(env, layer, scheduledMs, 'http ' + res.status, res.status);
  let j;
  try { j = JSON.parse(res.text); } catch (e) { return writeDown(env, layer, scheduledMs, 'bad json', res.status); }
  // Sample check (30 Oct 2026): the feed is an array of objects {time_tag, Kp, a_running, station_count}.
  // Older documentation described an array of arrays with a header row; both shapes are accepted.
  const norm = (t) => (typeof t === 'string' ? t.replace(' ', 'T').replace(/Z?$/, 'Z') : null);
  let rows = [];
  if (Array.isArray(j)) {
    if (j.length && Array.isArray(j[0])) {
      rows = j.slice(1).filter(r => Array.isArray(r) && typeof r[0] === 'string').map(r => [norm(r[0]), Number(r[1]), r[2] !== undefined ? Number(r[2]) : null, r[3] !== undefined ? Number(r[3]) : null]);
    } else {
      rows = j.filter(r => r && typeof r === 'object' && r.time_tag).map(r => [norm(r.time_tag), Number(r.Kp ?? r.kp), r.a_running !== undefined ? Number(r.a_running) : null, r.station_count !== undefined ? Number(r.station_count) : null]);
    }
  }
  if (!rows.length) return writeDown(env, layer, scheduledMs, 'unexpected SWPC shape: ' + res.text.slice(0, 80), res.status);
  const last = rows[rows.length - 1];
  const timeTag = last[0];                                               // §3.4 health: last row time_tag
  const kp = Number.isFinite(last[1]) ? last[1] : null;
  const ageS = timeTag ? (Date.now() - Date.parse(timeTag)) / 1000 : null;
  const status = ageS !== null && ageS < 4 * 3600 ? 'ok' : 'degraded';   // Kp is 3-hourly; > 4 h is late
  const fields = ['time_tag', 'kp', 'a_running', 'station_count'];
  const e = envelope(layer, scheduledMs, rows[0] ? rows[0][0] : null, timeTag, status, {}, fields, rows,
    { index: { name: 'planetary K-index', value: kp, time_tag: timeTag, source_age_s: ageS }, map_layer: false,
      quantity: 'NOAA planetary Kp, 3-hourly index (not a map layer)' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  // Index goes straight to D1 when a new 3-hour value appears (8 writes/day) — no hourly batch needed.
  if (timeTag && kp !== null) {
    try {
      await env.DB.prepare('INSERT OR IGNORE INTO kp_index (time_tag, kp, retrieved_at) VALUES (?,?,?)').bind(timeTag, kp, nowIso()).run();
    } catch (err) { console.log('kp insert', String(err)); }
  }
  await logRun(env, layer, scheduledMs, status, res.status, rows.length, bytes, 'kp=' + kp + ' age_s=' + Math.round(ageS || -1));
}

// ---------------------------------------------------------------- OpenSky

async function openskyToken(env) {
  const cached = await getJson(env, 'state/opensky_token.json');
  if (cached && cached.expires_at && Date.parse(cached.expires_at) - Date.now() > 60e3) return cached.access_token;
  const form = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.OPENSKY_CLIENT_ID, client_secret: env.OPENSKY_CLIENT_SECRET });
  const r = await fetch(URLS.openskyToken, { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA } });
  if (!r.ok) throw new Error('token http ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  const expires = new Date(Date.now() + (Number(j.expires_in || 1800) * 1000)).toISOString();
  await putJson(env, 'state/opensky_token.json', { access_token: j.access_token, expires_at: expires });
  return j.access_token;
}

async function openskySpendRow(env, day) {
  const row = await env.DB.prepare('SELECT * FROM opensky_spend WHERE day = ?').bind(day).first();
  return row || { day, credits_used: 0, last_remaining: null, world_cost: null, bbox_cost: null, last_bbox_at: null, world_pulls: 0, bbox_pulls: 0, skipped: 0 };
}

/**
 * Atomic-ish spend update: counters are SQL increments (pass deltas), measured values only replace
 * when non-null. The world pull (:00,:05,…) and the bbox tick never run in the same minute (see
 * collectOpenskyBbox), so the X-Rate-Limit-Remaining delta between consecutive calls is one call's cost.
 */
async function saveSpend(env, day, d /* {credits_used?, last_remaining?, world_cost?, bbox_cost?, last_bbox_at?, world_pulls?, bbox_pulls?, skipped?} */) {
  await env.DB.prepare(
    `INSERT INTO opensky_spend (day, credits_used, last_remaining, world_cost, bbox_cost, last_bbox_at, world_pulls, bbox_pulls, skipped, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(day) DO UPDATE SET
       credits_used = COALESCE(excluded.credits_used, credits_used),
       last_remaining = COALESCE(excluded.last_remaining, last_remaining),
       world_cost = COALESCE(excluded.world_cost, world_cost),
       bbox_cost = COALESCE(excluded.bbox_cost, bbox_cost),
       last_bbox_at = COALESCE(excluded.last_bbox_at, last_bbox_at),
       world_pulls = world_pulls + excluded.world_pulls,
       bbox_pulls = bbox_pulls + excluded.bbox_pulls,
       skipped = skipped + excluded.skipped,
       updated_at = excluded.updated_at`
  ).bind(day, d.credits_used ?? null, d.last_remaining ?? null, d.world_cost ?? null, d.bbox_cost ?? null, d.last_bbox_at ?? null,
    d.world_pulls || 0, d.bbox_pulls || 0, d.skipped || 0, nowIso()).run();
}

/** Pull states, build cells. kind = 'world' | 'bbox'. Returns {res, rows, cells, time, remaining}. */
async function openskyPull(env, kind, bbox) {
  const token = await openskyToken(env);
  const url = kind === 'bbox'
    ? `${URLS.opensky}?lamin=${bbox[0]}&lomin=${bbox[1]}&lamax=${bbox[2]}&lomax=${bbox[3]}`
    : URLS.opensky;
  const res = await fetchText(url, { headers: { Authorization: 'Bearer ' + token } });
  const remaining = Number(res.headers.get('X-Rate-Limit-Remaining'));
  return { res, remaining: Number.isFinite(remaining) ? remaining : null, url };
}

function openskyParse(text, receiptCells, runOk) {
  const j = JSON.parse(text);
  const fields = ['icao24', 'lat', 'lng', 'observed_at', 'last_contact', 'callsign', 'origin_country', 'baro_alt_m', 'on_ground', 'velocity_ms', 'track_deg', 'position_source', 'category'];
  const rows = []; const cells = {};
  const seen = new Set();
  for (const s of j.states || []) {
    if (s[5] == null || s[6] == null) continue;           // no position
    if (seen.has(s[0])) continue; seen.add(s[0]);         // dedup by icao24 (§6.2)
    rows.push([s[0], s[6], s[5], s[3] ? new Date(s[3] * 1000).toISOString() : null, s[4] ? new Date(s[4] * 1000).toISOString() : null,
      (s[1] || '').trim(), s[2], s[7], !!s[8], s[9], s[10], s[16], s[17]]);
    const id = cellId(s[6], s[5]);
    (cells[id] || (cells[id] = { count: 0 })).count++;
  }
  // Coverage (§3.2 OpenSky): adequate = run ok with advancing time AND cell has receipt history (phase-1
  // proxy for the receiver coverage map — spec §12 Q1). Cells never seen = partial. Run failed = unknown.
  for (const id in cells) {
    const adequate = runOk && receiptCells.has(id);
    cells[id].coverage = { grade: adequate ? 'adequate' : 'partial', evidence: adequate ? 'run_ok;receipt_history' : (runOk ? 'run_ok;no_receipt_history' : 'time_not_advancing'), observed_fraction: 1 };
  }
  return { fields, rows, cells, time: j.time };
}

async function receiptSet(env, layer) {
  try {
    const r = await env.DB.prepare('SELECT cell_id FROM cell_receipts WHERE layer = ?').bind(layer).all();
    return new Set((r.results || []).map(x => x.cell_id));
  } catch (e) { return new Set(); }
}

async function collectOpenskyWorld(env, scheduledMs) {
  const layer = 'opensky';
  if (!env.OPENSKY_CLIENT_ID || !env.OPENSKY_CLIENT_SECRET) return writeDown(env, layer, scheduledMs, 'no OpenSky secrets set', 0);
  const day = dayKey(scheduledMs);
  const spend = await openskySpendRow(env, day);
  if (spend.credits_used >= OPENSKY_HARD * OPENSKY_DAILY_CREDITS) {           // §4.3 hard stop
    await saveSpend(env, day, { skipped: 1 });
    return writeDown(env, layer, scheduledMs, 'hard stop: credits_used=' + spend.credits_used, 0);
  }
  let pull;
  try { pull = await openskyPull(env, 'world'); } catch (e) { return writeDown(env, layer, scheduledMs, 'pull failed: ' + e, 0); }
  const { res, remaining } = pull;
  if (res.status === 429) { await saveSpend(env, day, { skipped: 1 }); return writeDown(env, layer, scheduledMs, '429 rate limited; backing off', 429); }
  if (!res.ok) return writeDown(env, layer, scheduledMs, 'http ' + res.status + ' ' + res.text.slice(0, 120), res.status);

  // Measure world cost from the header when available (§4.3: measured, not assumed).
  const measuredCost = (remaining !== null && spend.last_remaining !== null && spend.last_remaining > remaining) ? spend.last_remaining - remaining : null;
  const creditsUsed = remaining !== null ? OPENSKY_DAILY_CREDITS - remaining : spend.credits_used + (spend.world_cost || WORLD_COST_DEFAULT);
  const spendDelta = { credits_used: creditsUsed, last_remaining: remaining, world_cost: measuredCost, world_pulls: 1 };
  spend.world_cost = measuredCost || spend.world_cost;

  const prev = await getJson(env, 'latest-cells/opensky.json');
  const receipts = await receiptSet(env, layer);
  let parsed;
  try { parsed = openskyParse(res.text, receipts, true); } catch (e) { await saveSpend(env, day, spendDelta); return writeDown(env, layer, scheduledMs, 'bad json', res.status); }
  const advancing = !(prev && prev.source_time && prev.source_time === parsed.time);   // §3.4 health: time advancing
  if (!advancing) for (const id in parsed.cells) parsed.cells[id].coverage = { grade: 'unknown', evidence: 'http_200_time_not_advancing', observed_fraction: 0 };
  const status = advancing ? 'ok' : 'degraded';
  const e = envelope(layer, scheduledMs, new Date(parsed.time * 1000).toISOString(), new Date(parsed.time * 1000).toISOString(), status, parsed.cells, parsed.fields, parsed.rows,
    { source_time: parsed.time, position_ttl_s: 300, scope: 'world', credits_remaining: remaining,
      coverage_default: { grade: 'partial', evidence: 'no_receipt_history', observed_fraction: 1 },
      quantity: 'unique aircraft (by icao24) with a position, per cell, per 5-minute snapshot' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await saveSpend(env, day, spendDelta);
  await logRun(env, layer, scheduledMs, status, res.status, parsed.rows.length, bytes, `remaining=${remaining} world_cost=${spend.world_cost} time=${parsed.time}`);
}

/** Budget-gated bbox pull, called every minute. Cadence lengthens automatically past 80% (§4.3). */
async function collectOpenskyBbox(env, scheduledMs) {
  const layer = 'opensky-bbox';
  if (!env.OPENSKY_CLIENT_ID || !env.OPENSKY_CLIENT_SECRET) return;
  const minute = new Date(scheduledMs).getUTCMinutes();
  if (minute % 5 === 0) return;                                                    // world pull owns these minutes; never race it
  const bbox = (env.OPENSKY_BBOX || '-35.5,15,-21,34').split(',').map(Number);   // southern Africa, ~276 sq° → expect 3 credits
  const day = dayKey(scheduledMs);
  const spend = await openskySpendRow(env, day);
  const used = spend.credits_used;
  const minuteOfDay = Math.floor((scheduledMs - Date.parse(day + 'T00:00:00Z')) / 60000);
  const minutesLeft = Math.max(1, 1440 - minuteOfDay);
  const worldCost = spend.world_cost || WORLD_COST_DEFAULT;
  const bboxCost = spend.bbox_cost || 4;                                           // assume worst until measured
  const reserveForWorld = Math.ceil(minutesLeft / 5) * worldCost;
  const soft = OPENSKY_SOFT * OPENSKY_DAILY_CREDITS;
  const availableForBbox = soft - used - reserveForWorld;
  let decision, interval = null;
  if (used >= OPENSKY_HARD * OPENSKY_DAILY_CREDITS) decision = 'hard_stop';
  else if (availableForBbox < bboxCost) decision = 'soft_budget_exhausted';
  else {
    interval = Math.max(1, Math.ceil(bboxCost * minutesLeft / availableForBbox));   // minutes between bbox pulls
    const since = spend.last_bbox_at ? (scheduledMs - Date.parse(spend.last_bbox_at)) / 60000 : Infinity;
    decision = since + 0.5 >= interval ? 'pull' : 'wait';
  }
  if (decision !== 'pull') {
    if (decision !== 'wait') { await saveSpend(env, day, { skipped: 1 }); await logRun(env, layer, scheduledMs, 'skipped', 0, 0, 0, decision + ` used=${used} interval=${interval}`); }
    return;
  }
  let pull;
  try { pull = await openskyPull(env, 'bbox', bbox); } catch (e) { return logRun(env, layer, scheduledMs, 'down', 0, 0, 0, 'pull failed: ' + e); }
  const { res, remaining } = pull;
  if (res.status === 429) { await saveSpend(env, day, { skipped: 1, last_bbox_at: nowIso() }); return logRun(env, layer, scheduledMs, 'down', 429, 0, 0, '429; backoff'); }
  if (!res.ok) return logRun(env, layer, scheduledMs, 'down', res.status, 0, 0, res.text.slice(0, 120));
  const measuredCost = (remaining !== null && spend.last_remaining !== null && spend.last_remaining > remaining) ? spend.last_remaining - remaining : null;  // measured
  const spendDelta = { credits_used: remaining !== null ? OPENSKY_DAILY_CREDITS - remaining : used + bboxCost, last_remaining: remaining, bbox_cost: measuredCost, last_bbox_at: nowIso(), bbox_pulls: 1 };
  const receipts = await receiptSet(env, 'opensky');
  let parsed;
  try { parsed = openskyParse(res.text, receipts, true); } catch (e) { await saveSpend(env, day, spendDelta); return logRun(env, layer, scheduledMs, 'down', res.status, 0, 0, 'bad json'); }
  const e = envelope(layer, scheduledMs, new Date(parsed.time * 1000).toISOString(), new Date(parsed.time * 1000).toISOString(), 'ok', parsed.cells, parsed.fields, parsed.rows,
    { source_time: parsed.time, position_ttl_s: 300, scope: 'bbox', bbox, credits_remaining: remaining, cadence_min: interval,
      quantity: 'unique aircraft (by icao24) with a position, per cell, per bbox snapshot' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await saveSpend(env, day, spendDelta);
  await logRun(env, layer, scheduledMs, 'ok', res.status, parsed.rows.length, bytes, `remaining=${remaining} bbox_cost=${measuredCost ?? spend.bbox_cost} interval_min=${interval}`);
}

// ---------------------------------------------------------------- FIRMS

/** Lean CSV scan: only the columns we need. Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight */
function firmsParse(text) {
  const nl = text.indexOf('\n');
  const header = text.slice(0, nl).trim().split(',');
  const ix = (n) => header.indexOf(n);
  const iLat = ix('latitude'), iLng = ix('longitude'), iDate = ix('acq_date'), iTime = ix('acq_time'), iConf = ix('confidence'), iFrp = ix('frp'), iSat = ix('satellite'), iDn = ix('daynight');
  if (iLat < 0 || iLng < 0 || iDate < 0 || iTime < 0) throw new Error('unexpected FIRMS header: ' + header.join(','));
  const fields = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'];
  const rows = []; const cells = {}; const byHour = {};
  let pos = nl + 1; const len = text.length;
  while (pos < len) {
    let end = text.indexOf('\n', pos); if (end < 0) end = len;
    const line = text.slice(pos, end); pos = end + 1;
    if (!line) continue;
    const c = line.split(',');
    const lat = +c[iLat], lng = +c[iLng];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const t = c[iTime].padStart(4, '0');
    const observedAt = c[iDate] + 'T' + t.slice(0, 2) + ':' + t.slice(2) + ':00Z';
    rows.push([lat, lng, observedAt, c[iConf], +c[iFrp], c[iSat], c[iDn]]);
    const id = cellId(lat, lng);
    (cells[id] || (cells[id] = { count: 0 })).count++;
    const h = observedAt.slice(0, 13);
    const hb = byHour[h] || (byHour[h] = {});
    hb[id] = (hb[id] || 0) + 1;
  }
  return { fields, rows, cells, byHour };
}

async function collectFirms(env, scheduledMs) {
  const layer = 'firms';
  if (!env.FIRMS_MAP_KEY) return writeDown(env, layer, scheduledMs, 'no FIRMS key set', 0);
  let res;
  const region = (env.FIRMS_REGION || '').trim() || null;   // optional fallback for the Free plan's CPU limit; scope is recorded in the snapshot
  try { res = await fetchText(URLS.firms(env.FIRMS_MAP_KEY, region)); } catch (e) { return writeDown(env, layer, scheduledMs, 'fetch failed: ' + e, 0); }
  if (!res.ok || res.text.startsWith('Invalid') || res.text.startsWith('<')) return writeDown(env, layer, scheduledMs, 'http ' + res.status + ' ' + res.text.slice(0, 100), res.status);
  const stamp = isoMinute(scheduledMs);
  await env.R2.put(`raw/firms/${stamp}.csv`, res.text, { httpMetadata: { contentType: 'text/csv' } });  // raw is the asset (§4.2)
  if (res.text.length > FIRMS_MAX_PARSE_BYTES) {
    return writeDown(env, layer, scheduledMs, `raw archived; processing skipped: resource guard (${res.text.length} bytes > ${FIRMS_MAX_PARSE_BYTES})`, res.status);  // D14: not 'source down' — the source answered
  }
  let parsed;
  try { parsed = firmsParse(res.text); } catch (e) { return writeDown(env, layer, scheduledMs, String(e), res.status); }
  // Coverage (§3.2 FIRMS): adequacy needs the pass schedule, not wired in step 1 → partial, and cloud is
  // invisible in the CSV (§9.4). The evidence string says both.
  for (const id in parsed.cells) parsed.cells[id].coverage = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
  const e = envelope(layer, scheduledMs, new Date(scheduledMs - 86400e3).toISOString(), nowIso(), 'ok', parsed.cells, parsed.fields, parsed.rows,
    { by_hour: parsed.byHour, raw: `raw/firms/${stamp}.csv`, raw_bytes: res.text.length, scope: region ? 'region ' + region : 'world',
      coverage_default: { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 },
      quantity: 'VIIRS NOAA-20 NRT thermal detections in the last 24 h, per cell (detections per pass, not a fire census)' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await logRun(env, layer, scheduledMs, 'ok', res.status, parsed.rows.length, bytes, 'raw_bytes=' + res.text.length);
}


/* Last ~n lines of a big text file without splitting the whole thing (bytesPerLine is an over-estimate; never under). */
function tail(t, n, bytesPerLine = 40) { return t.slice(Math.max(0, t.lastIndexOf('\n', t.length - n * bytesPerLine) + 1)); }

// ---------------------------------------------------------------- NOAA GML CO2 (Mauna Loa) — index, not a map layer

/** Daily Mauna Loa CO2 (ppm) plus NOAA's own weekly comparison columns (1 yr ago, 10 yr ago, since 1800).
 *  Terms live in the file header ("made freely available… please include relevant citation"); recent months are
 *  preliminary, and the header says so — both are carried into the envelope. Collected hourly on the :07 job. */
async function collectCo2(env, scheduledMs) {
  const layer = 'co2';
  let d, w;
  try { d = await fetchText(URLS.co2Daily); w = await fetchText(URLS.co2Weekly); } catch (e) { return writeDown(env, layer, scheduledMs, 'fetch failed: ' + e, 0); }
  if (!d.ok || !w.ok) return writeDown(env, layer, scheduledMs, `http daily=${d.status} weekly=${w.status}`, d.ok ? w.status : d.status);
  const notes = w.text.slice(0, 8192).split('\n').filter(l => l.startsWith('#')).map(l => l.replace(/^#\s?/, '')).filter(Boolean);
  // Parse only the tail: the daily file holds every day since 1974 (433 KB); parsing it all measured 113 ms CPU (P99, 30 Oct 2026). The page needs one year.
  const dRows = tail(d.text, 420).split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split(',').map(x => x.trim()))
    .filter(c => c.length >= 5 && Number.isFinite(+c[4]) && +c[4] > 0)
    .map(c => [`${c[0]}-${c[1].padStart(2, '0')}-${c[2].padStart(2, '0')}`, +c[4]]);
  const wRows = tail(w.text, 60).split('\n').filter(l => l && !l.startsWith('#') && !/^year/i.test(l)).map(l => l.split(',').map(x => x.trim()))
    .filter(c => c.length >= 9 && Number.isFinite(+c[4]) && +c[4] > 0);
  if (!dRows.length || !wRows.length) return writeDown(env, layer, scheduledMs, 'unexpected CO2 file shape', 200);
  const last = dRows[dRows.length - 1], lw = wRows[wRows.length - 1];
  const ageS = (Date.now() - Date.parse(last[0] + 'T00:00:00Z')) / 1000;
  const status = ageS < 7 * 86400 ? 'ok' : 'degraded';                      // daily product; > 7 days behind is late
  const weekStart = `${lw[0]}-${lw[1].padStart(2, '0')}-${lw[2].padStart(2, '0')}`;
  const num = x => (Number.isFinite(+x) && +x > 0 ? +x : null);
  const e = envelope(layer, scheduledMs, dRows[Math.max(0, dRows.length - 366)][0], last[0], status, {}, ['date', 'ppm'], dRows.slice(-366),
    { index: { name: 'CO2, Mauna Loa Observatory', value: last[1], unit: 'ppm', date: last[0], source_age_s: ageS, preliminary: true },
      comparison: { basis: 'source-provided: NOAA GML weekly file, same week 1 year ago (365 days) and 10 years ago (3,653 days), week starting ' + weekStart,
        week_average: num(lw[4]), days_in_week: +lw[5], one_year_ago: num(lw[6]), ten_years_ago: num(lw[7]), increase_since_1800: num(lw[8]) },
      map_layer: false, source_notes: notes, citation: 'Lan, X., Tans, P. and Thoning, K.W.: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements. NOAA GML, gml.noaa.gov/ccgg/trends/',
      quantity: 'daily mean CO2 mole fraction (ppm) at Mauna Loa, Hawaii — one station, not a map layer; recent months preliminary' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  try { await env.DB.prepare('INSERT OR IGNORE INTO co2_daily (date, ppm, retrieved_at) VALUES (?,?,?)').bind(last[0], last[1], nowIso()).run(); } catch (err) { console.log('co2 insert', String(err)); }
  await logRun(env, layer, scheduledMs, status, 200, dRows.length, bytes, `ppm=${last[1]} date=${last[0]} 1y=${lw[6]} 10y=${lw[7]}`);
}

// ---------------------------------------------------------------- NSIDC Sea Ice Index (G02135 v4) — index per hemisphere, not a map layer

/* Daily sea-ice extent (10^6 km²) for each hemisphere from NSIDC's NOAA mirror (open; no login), with NSIDC's own
*  1981–2010 climatology for the same day of year. Updated once a day (~14:20 UTC, measured 30 Oct 2026); collected at
*  03/09/15/21 UTC on the hourly job. Daily files are ~1.9 MB with 48 years of rows → tail-parsed. */
function doyOf(dateStr) { const d = Date.parse(dateStr + 'T00:00:00Z'); return Math.floor((d - Date.UTC(new Date(d).getUTCFullYear(), 0, 1)) / 86400e3) + 1; }

async function collectSeaIce(env, scheduledMs) {
  const layer = 'seaice';
  const out = {}; const notes = [];
  for (const h of ['north', 'south']) {
    let d, c;
    try { d = await fetchText(URLS.seaice(h)); c = await fetchText(URLS.seaiceClim(h)); } catch (e) { return writeDown(env, layer, scheduledMs, h + ' fetch failed: ' + e, 0); }
    if (!d.ok || !c.ok) return writeDown(env, layer, scheduledMs, `${h} http daily=${d.status} clim=${c.status}`, d.ok ? c.status : d.status);
    // daily: "Year, Month, Day, Extent, Missing, Source Data" — the last column is a quoted list that contains commas; take the first five fields only
    const rows = tail(d.text, 400, 260).split('\n').map(l => l.split(',').slice(0, 5).map(x => x.trim()))
      .filter(f => f.length === 5 && /^\d{4}$/.test(f[0]) && Number.isFinite(+f[3]) && +f[3] > 0)
      .map(f => [`${f[0]}-${f[1].padStart(2, '0')}-${f[2].padStart(2, '0')}`, +f[3], +f[4]]);
    if (!rows.length) return writeDown(env, layer, scheduledMs, h + ': unexpected daily file shape', 200);
    const last = rows[rows.length - 1];
    // climatology: "DOY, Average Extent, Std Deviation, 10th, 25th, 50th, 75th, 90th" (34 KB; parsed whole)
    const doy = doyOf(last[0]);
    const clim = c.text.split('\n').map(l => l.split(',').map(x => x.trim())).find(f => f.length >= 8 && +f[0] === doy);
    const header = d.text.slice(0, 400).split('\n').slice(0, 2).join(' ');
    notes.push(h + ': ' + header.slice(0, 200));
    out[h] = { value: last[1], unit: '10^6 km^2', date: last[0], missing_area: last[2], day_of_year: doy,
      climatology_1981_2010: clim ? { average: +clim[1], std: +clim[2], p10: +clim[3], p25: +clim[4], p50: +clim[5], p75: +clim[6], p90: +clim[7] } : null,
      difference_from_average: clim ? Math.round((last[1] - +clim[1]) * 1000) / 1000 : null,
      last_366: rows.slice(-366) };
  }
  const n = out.north, s = out.south;
  const ageS = (Date.now() - Date.parse(n.date + 'T00:00:00Z')) / 1000;
  const status = ageS < 5 * 86400 ? 'ok' : 'degraded';                     // daily product with ~1 day latency; > 5 days behind is late
  const recs = n.last_366.map((r, i) => [r[0], r[1], (s.last_366[i] || [])[1] ?? null]);
  delete n.last_366; delete s.last_366;
  const e = envelope(layer, scheduledMs, recs[0][0], n.date, status, {}, ['date', 'north_extent', 'south_extent'], recs,
    { index: { name: 'sea-ice extent, NSIDC Sea Ice Index v4', north: n, south: s, source_age_s: ageS },
      comparison: { basis: 'source-provided baseline: NSIDC 1981–2010 daily climatology for the same day of year (average and percentiles). The subtraction (today minus average) is computed by this collector; the baseline is NSIDC\'s.' },
      map_layer: false, source_notes: notes,
      citation: 'Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. Boulder, Colorado USA. NSIDC: National Snow and Ice Data Center. https://nsidc.org/data/g02135',
      quantity: 'daily sea-ice extent per hemisphere, million km² (area of ocean with ≥15% ice concentration, passive microwave) — one number per hemisphere, not a map layer' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await logRun(env, layer, scheduledMs, status, 200, recs.length, bytes, `N=${n.value} S=${s.value} date=${n.date} dN=${n.difference_from_average} dS=${s.difference_from_average}`);
}

// ---------------------------------------------------------------- hourly aggregation → D1 (D2, D6)

const BATCH_SIZE = 300;   // statements per D1 batch (one subrequest each; D1's limit is 100 bound params *per statement*)

/** Upsert only rows that differ. byHour = { hour_utc: { cell_id: {count, count_max, coverage, observed_fraction, extra} } }. One SELECT + ≤ few batches. */
async function upsertChanged(env, layer, byHour) {
  const hours = Object.keys(byHour).filter(h => Object.keys(byHour[h]).length);
  if (!hours.length) return 0;
  const existing = await env.DB.prepare(
    `SELECT hour_utc, cell_id, count, count_max, coverage, observed_fraction FROM cell_hourly WHERE layer = ? AND hour_utc IN (${hours.map(() => '?').join(',')})`
  ).bind(layer, ...hours).all();
  const have = {}; for (const r of existing.results || []) have[r.hour_utc + '|' + r.cell_id] = r;
  const stmts = []; let changed = 0;
  for (const hour of hours) for (const id in byHour[hour]) {
    const v = byHour[hour][id]; const h = have[hour + '|' + id];
    if (h && h.count === v.count && h.count_max === v.count_max && h.coverage === v.coverage && h.observed_fraction === v.observed_fraction) continue;
    changed++;
    stmts.push(env.DB.prepare(
      `INSERT INTO cell_hourly (layer, cell_id, hour_utc, count, count_max, coverage, observed_fraction, extra, updated_at) VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(layer, cell_id, hour_utc) DO UPDATE SET count=excluded.count, count_max=excluded.count_max, coverage=excluded.coverage,
       observed_fraction=excluded.observed_fraction, extra=excluded.extra, updated_at=excluded.updated_at`
    ).bind(layer, id, hour, v.count, v.count_max, v.coverage, v.observed_fraction, v.extra ? JSON.stringify(v.extra) : null, nowIso()));
  }
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  return changed;
}

/** How many runs of a layer in hour H were ok, from collector_runs (1 subrequest instead of 12 R2 reads). */
async function okRunsInHour(env, layer, hourMs) {
  const from = new Date(hourMs).toISOString(), to = new Date(hourMs + 3600e3).toISOString();
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM collector_runs WHERE layer = ? AND status = 'ok' AND started_at >= ? AND started_at < ?").bind(layer, from, to).first();
  return r ? Number(r.n) : 0;
}

async function layerHourly(env, layer, hour, expected, ok, status, adequateCells, note) {
  await env.DB.prepare(
    `INSERT INTO layer_hourly (layer, hour_utc, snapshots_expected, snapshots_ok, source_status, adequate_cells, note, updated_at) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(layer, hour_utc) DO UPDATE SET snapshots_expected=excluded.snapshots_expected, snapshots_ok=excluded.snapshots_ok, source_status=excluded.source_status,
     adequate_cells=excluded.adequate_cells, note=excluded.note, updated_at=excluded.updated_at`
  ).bind(layer, hour, expected, ok, status, adequateCells, note, nowIso()).run();
}

/** OpenSky hour H: 12 cells files → mean/max unique-per-snapshot per cell. Subrequests: 12 R2 + ~4 D1 + batches. */
async function aggregateOpensky(env, hourMs) {
  const layer = 'opensky';
  const files = [];
  for (let m = 0; m < 60; m += 5) files.push(await getJson(env, `cells/${layer}/${isoMinute(hourMs + m * 60000)}.json`));
  const okFiles = files.filter(f => f && f.source_status === 'ok');
  const present = files.filter(Boolean).length;
  const hour = hourKey(hourMs);
  const sums = {}, maxes = {}, grades = {};
  for (const f of okFiles) for (const id in f.cells) {
    sums[id] = (sums[id] || 0) + f.cells[id].count; maxes[id] = Math.max(maxes[id] || 0, f.cells[id].count);
    grades[id] = grades[id] || f.cells[id].coverage.grade;
  }
  const frac = okFiles.length / 12;
  const incoming = {};
  for (const id in sums) incoming[id] = {
    count: Math.round(sums[id] / okFiles.length * 100) / 100, count_max: maxes[id],
    coverage: frac >= 0.9 ? grades[id] : 'partial', observed_fraction: frac, extra: null,   // §3.1: adequate only if observed ≥90% of the window
  };
  const receipts = await receiptSet(env, layer);
  const adequate = Object.keys(incoming).filter(id => incoming[id].coverage === 'adequate');
  await layerHourly(env, layer, hour, 12, okFiles.length, okFiles.length === 12 ? 'ok' : (okFiles.length ? 'degraded' : 'down'), JSON.stringify(adequate), `mean of per-snapshot unique aircraft; present=${present}`);
  const changed = await upsertChanged(env, layer, { [hour]: incoming });
  // Receipt history: cells seen with count>0 in an ok snapshot (write only new cells).
  const newReceipts = Object.keys(sums).filter(id => !receipts.has(id));
  if (newReceipts.length) {
    const stmts = newReceipts.map(id => env.DB.prepare('INSERT OR IGNORE INTO cell_receipts (layer, cell_id, first_seen, last_seen) VALUES (?,?,?,?)').bind(layer, id, hour, hour));
    for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  }
  return { present, ok: okFiles.length, cells: Object.keys(incoming).length, changed, new_receipts: newReceipts.length };
}

/** USGS hour H: the feed is a rolling 24 h list, so the last ok snapshot of the hour holds every event the hour's
 *  snapshots held (minus revisions). Events are bucketed by event time; the trailing 6 event-hours are rewritten
 *  because quakes are reported with latency. Subrequests: 1 R2 + 3 D1 + batches. */
async function aggregateUsgs(env, hourMs) {
  const layer = 'usgs';
  const hour = hourKey(hourMs);
  const okRuns = await okRunsInHour(env, layer, hourMs);
  let f = null;
  for (let m = 55; m >= 0 && !f; m -= 5) { const g = await getJson(env, `cells/${layer}/${isoMinute(hourMs + m * 60000)}.json`); if (g && g.source_status === 'ok') f = g; }
  if (!f) { await layerHourly(env, layer, hour, 12, okRuns, 'down', 'none', 'no ok snapshot in hour'); return { ok: okRuns, events: 0, changed: 0 }; }
  const byHour = {};
  for (const id in f.cells) for (const [, t, mag] of (f.cells[id].ids || [])) {
    const h = t.slice(0, 13); if (Date.parse(h + ':00:00Z') < hourMs - 5 * 3600e3 || Date.parse(h + ':00:00Z') > hourMs) continue;
    const b = byHour[h] || (byHour[h] = {}); const c = b[id] || (b[id] = { count: 0, count_m45: 0 }); c.count++; if (mag >= 4.5) c.count_m45++;
  }
  const inc = {};
  for (const h in byHour) { inc[h] = {}; for (const id in byHour[h]) inc[h][id] = { count: byHour[h][id].count, count_max: byHour[h][id].count_m45, coverage: 'partial', observed_fraction: okRuns / 12, extra: { count_m45: byHour[h][id].count_m45 } }; }
  const changed = await upsertChanged(env, layer, inc);
  await layerHourly(env, layer, hour, 12, okRuns, okRuns === 12 ? 'ok' : (okRuns ? 'degraded' : 'down'), 'none', 'count=M2.5+, count_max column holds M4.5+; adequacy map pending');
  return { ok: okRuns, events: Object.values(byHour).reduce((n, b) => n + Object.values(b).reduce((m, c) => m + c.count, 0), 0), changed };
}

/** FIRMS: the latest 24-h pull is authoritative for every acq-hour it covers; detections arrive with up to ~3 h latency,
 *  so the trailing 8 hours are rewritten (changed rows only). Subrequests: 1 R2 + 3 D1 + batches. */
async function aggregateFirms(env, hourMs) {
  const f = await getJson(env, 'latest-cells/firms.json');
  const hour = hourKey(hourMs);
  const okRuns = await okRunsInHour(env, 'firms', hourMs);
  if (!f || f.source_status !== 'ok' || !f.by_hour) { await layerHourly(env, 'firms', hour, 4, okRuns, 'down', 'none', 'no usable latest FIRMS snapshot'); return { ok: false }; }
  const inc = {}; let rowsSeen = 0;
  for (let k = 0; k < 8; k++) {
    const h = hourKey(hourMs - k * 3600e3); const b = f.by_hour[h] || {}; inc[h] = {};
    for (const id in b) { inc[h][id] = { count: b[id], count_max: b[id], coverage: 'partial', observed_fraction: 1, extra: null }; rowsSeen++; }
  }
  const changed = await upsertChanged(env, 'firms', inc);
  await layerHourly(env, 'firms', hour, 4, okRuns, okRuns ? 'ok' : 'down', 'none', `from ${f.scheduled_for}; pass schedule pending; cloud may hide`);
  return { ok: true, runs_ok: okRuns, rows_seen: rowsSeen, changed };
}

async function hourlyBatch(env, scheduledMs) {
  const started = Date.now();
  const hourMs = Math.floor((scheduledMs - 3600e3) / 3600e3) * 3600e3;    // previous full hour
  const out = {};
  try { out.opensky = await aggregateOpensky(env, hourMs); } catch (e) { out.opensky = 'error ' + e; }
  try { out.usgs = await aggregateUsgs(env, hourMs); } catch (e) { out.usgs = 'error ' + e; }
  try { out.firms = await aggregateFirms(env, hourMs); } catch (e) { out.firms = 'error ' + e; }
  await env.DB.prepare('INSERT INTO batch_runs (hour_utc, started_at, finished_at, result) VALUES (?,?,?,?)')
    .bind(hourKey(hourMs), new Date(started).toISOString(), nowIso(), JSON.stringify(out).slice(0, 2000)).run();
  return out;
}

// ---------------------------------------------------------------- dispatch

/** Run a collector so that an unexpected throw is recorded as a 'down' run and never takes the others with it. */
async function guarded(env, layer, ms, fn) {
  try { await fn(env, ms); return layer + ':ran'; }
  catch (e) { try { await writeDown(env, layer, ms, 'uncaught: ' + String(e).slice(0, 200), 0); } catch (_) {} return layer + ':threw ' + String(e).slice(0, 80); }
}

const JOBS = {
  five: async (env, ms) => (await Promise.all([
    guarded(env, 'usgs', ms, collectUsgs), guarded(env, 'swpc', ms, collectSwpc), guarded(env, 'opensky', ms, collectOpenskyWorld),
  ])).join('; '),
  minute: async (env, ms) => guarded(env, 'opensky-bbox', ms, collectOpenskyBbox),
  firms: async (env, ms) => guarded(env, 'firms', ms, collectFirms),
  hourly: async (env, ms, manual) => {
    const c = await guarded(env, 'co2', ms, collectCo2);
    const hr = new Date(ms).getUTCHours();
    const i = (manual || hr % 6 === 3) ? await guarded(env, 'seaice', ms, collectSeaIce) : 'seaice:skipped (runs 03/09/15/21 UTC)';   // NSIDC updates once a day
    const b = await hourlyBatch(env, ms);
    return { co2: c, seaice: i, batch: b };
  },
};

function jobForCron(cron) {
  const c = cron.replace(/\s+/g, ' ').trim();
  if (c === '*/5 * * * *') return 'five';
  if (c === '* * * * *') return 'minute';
  if (c === '*/15 * * * *') return 'firms';
  if (/^\d+ \* \* \* \*$/.test(c)) return 'hourly';
  return null;
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const LAYERS = ['usgs', 'swpc', 'opensky', 'opensky-bbox', 'firms', 'co2', 'seaice'];

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...CORS, ...extra } });
}

export default {
  async scheduled(event, env, ctx) {
    const job = jobForCron(event.cron);
    if (!job) { console.log('unknown cron', event.cron); return; }
    const p = JOBS[job](env, event.scheduledTime).then(r => console.log(job, typeof r === 'string' ? r : JSON.stringify(r))).catch(e => console.log(job, 'failed', String(e)));
    ctx.waitUntil(p);
    return p;
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405);
    const p = url.pathname.split('/').filter(Boolean);

    if (p[0] === 'snapshot' || p[0] === 'cells') {
      const layer = p[1];
      if (!LAYERS.includes(layer)) return json({ error: 'unknown layer', layers: LAYERS }, 404);
      const key = (p[0] === 'snapshot' ? 'latest/' : 'latest-cells/') + layer + '.json';
      const o = await env.R2.get(key);
      if (!o) return json({ error: 'no snapshot yet', layer }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'ETag': o.httpEtag, ...CORS } });
    }

    if (p[0] === 'status') {
      const runs = await env.DB.prepare('SELECT layer, started_at, status, http_status, records, bytes, note FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)').all();
      const spend = await env.DB.prepare('SELECT * FROM opensky_spend WHERE day = ?').bind(dayKey(Date.now())).first();
      const batch = await env.DB.prepare('SELECT * FROM batch_runs ORDER BY id DESC LIMIT 1').first();
      return json({ now: nowIso(), collector_version: COLLECTOR_VERSION, schema_version: SCHEMA_VERSION, cell_deg: CELL_DEG, stale_after_s: STALE_AFTER_S, last_runs: runs.results, opensky_spend_today: spend, last_batch: batch }, 200, { 'Cache-Control': 'no-store' });
    }

    if (p[0] === 'admin' && p[1] === 'run') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      const job = p[2];
      if (!JOBS[job]) return json({ error: 'unknown job', jobs: Object.keys(JOBS) }, 404);
      const t0 = Date.now();
      try { const r = await JOBS[job](env, Date.now(), true); return json({ job, result: r, wall_ms: Date.now() - t0 }, 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ job, error: String(e), wall_ms: Date.now() - t0 }, 500, { 'Cache-Control': 'no-store' }); }
    }

    return json({ name: 'Mother Earth collector', version: COLLECTOR_VERSION, endpoints: ['/snapshot/<layer>', '/cells/<layer>', '/status'], layers: LAYERS,
      promise: 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.' });
  },
};
