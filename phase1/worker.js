/**
 * MOTHER EARTH — Phase 1, step 1 collector Worker
 * Spec: SPEC-v0.3.md (§3 activity/coverage/freshness, §4 architecture, §5 data model, §10 acceptance)
 *
 * One Worker, three jobs, dispatched by cron string:
 *   "* /5 * * * *"  (every 5 min)  → USGS, OpenSky world pull
 *   "* * * * *"     (every 1 min)  → OpenSky bbox pull, budget-gated (auto-degrades; §4.3)
 *   "* /15 * * * *" (every 15 min) → FIRMS world/1  (day_range=1 = the CURRENT UTC DATE, not "last 24 h": the file
 *                                      empties at 00:00 UTC and refills as NRT processing lands, ~2–3 h behind; confirmed 1 Nov 2026)
 *   "7 * * * *"     (hourly, :07)  → aggregate previous hour from R2 cell files into D1
 *
 * HTTP (viewers only read; §4.2):
 *   GET /snapshot/<layer>   latest full snapshot (records + cells)
 *   GET /cells/<layer>      latest cells-only file (small)
 *   GET /status             last runs per layer + OpenSky spend today
 *   GET /admin/run/<job>?key=ADMIN_KEY   run a job now (jobs: five, minute, firms, forest, hourly)
 *
 * Bindings (set in dashboard → Worker → Settings → Bindings):
 *   R2  = R2 bucket binding        DB = D1 database binding
 * Secrets: OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET, FIRMS_MAP_KEY, ADMIN_KEY, INGEST_KEY (external collectors; ingest is disabled until set)
 * Plain vars (optional): OPENSKY_ENABLED = "1" to run the OpenSky pulls (parked 31 Oct 2026: Cloudflare egress 522 + public site must feed; unset = skip silently)
*                        OPENSKY_BBOX = "lamin,lomin,lamax,lomax"  (default southern Africa)
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
const COLLECTOR_VERSION = '0.2.1';
const CELL_DEG = 4;                       // §4.2: stay at 4° until needed
const OPENSKY_DAILY_CREDITS = 4000;       // §4.3
const OPENSKY_SOFT = 0.80, OPENSKY_HARD = 0.95;
const WORLD_COST_DEFAULT = 4;
const STALE_AFTER_S = { usgs: 900, swpc: 2 * 3600, opensky: 600, firms: 2400, co2: 2 * 3600, seaice: 8 * 3600, mock: 600, ships: 3 * 3600, lightning: 900, forest: 4 * 3600 }; // §3.3 collector freshness (co2: daily product, collected hourly)
const FIRMS_DAY_BOUNDARY_H = 4;             // before 04:00 UTC an empty FIRMS file is the day boundary, not an outage (measured 1 Nov 2026: first rows at 04:00)
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
  forest: 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query/json',   // 307 → dated version (daily); fetch follows it
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
  // day_range=1 is "today (UTC)": the file is legitimately empty for the first hours after 00:00 UTC while NRT processing
  // catches up (measured 1 Nov 2026: header-only 02:15–03:45 UTC, 507 rows at 04:00). Either way an empty file is unknown, never zero.
  if (parsed.rows.length === 0) {
    const utcHour = new Date().getUTCHours();
    const why = utcHour < FIRMS_DAY_BOUNDARY_H ? `no detections processed yet for today (UTC): FIRMS day_range=1 resets at 00:00 UTC and NRT runs ~2–3 h behind (header only, ${res.text.length} bytes)` : `empty response (header only, ${res.text.length} bytes) at ${utcHour}:xx UTC: not a validated zero`;
    return writeDown(env, layer, scheduledMs, why, res.status);
  }
  // Coverage (§3.2 FIRMS): adequacy needs the pass schedule, not wired in step 1 → partial, and cloud is
  // invisible in the CSV (§9.4). The evidence string says both.
  for (const id in parsed.cells) parsed.cells[id].coverage = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
  const dayStart = new Date(scheduledMs); dayStart.setUTCHours(0, 0, 0, 0);   // window = today (UTC) so far, which is what day_range=1 returns
  const e = envelope(layer, scheduledMs, dayStart.toISOString(), nowIso(), 'ok', parsed.cells, parsed.fields, parsed.rows,
    { by_hour: parsed.byHour, raw: `raw/firms/${stamp}.csv`, raw_bytes: res.text.length, scope: region ? 'region ' + region : 'world',
      coverage_default: { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 },
      window_rule: 'today (UTC) so far: FIRMS day_range=1 returns the current UTC date only; resets at 00:00 UTC; NRT processing lands ~2–3 h after the pass',
      quantity: 'VIIRS NOAA-20 NRT thermal detections so far today (UTC), per cell (detections per pass, not a fire census)' });
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

// ---------------------------------------------------------------- Global Forest Watch integrated deforestation alerts (GLAD-L + GLAD-S2 + RADD)

/* Counts of 10 m alert pixels published in the last FOREST_WINDOW_DAYS, per 4° cell, grouped by GFW's confidence
 * (nominal | high | highest — as delivered 1 Nov 2026; the how-to says low/nominal/high). We never pull the pixels.
 * Measured 1 Nov 2026 (Mac, gfw-timing.sh): one 4° cell is 2–25 s cold and hits a 30 s gateway cap (HTTP 504) on
 * roughly half of cold queries; GFW caches the finished result, so the same query answers in 2–11 s on the next ask.
 * Hence the sweep: every 30 min take FOREST_PER_RUN cells (retries first), 30 s limit each, sequentially (kind to GFW);
 * a timeout marks the cell pending and it is re-asked next run. 559 tropical land cells (land mask, 1 Nov 2026) → a full
 * sweep ≈ 2 days, inside the 7-day window. Coverage is 'partial' for every cell in phase 1 (no per-cell observation-
 * opportunity record; cloud and alert-system coverage vary) and 'unknown' outside 30°N–30°S (outside the systems).
 * REGISTER.md: CC BY 4.0; cite "Integrated Deforestation Alerts", UMD/GLAD and WUR, via Global Nature Watch; not for area
 * or trend; detection date ≠ clearing date. State lives in R2 state/forest.json (cursor + latest per cell); each completed
 * cell query is also a row in D1 forest_daily (the phase-3 baseline). */
const FOREST_WINDOW_DAYS = 7;
const FOREST_PER_RUN = 6;
const FOREST_TIMEOUT_MS = 30000;
const FOREST_ORIGIN = 'https://theonetheonlythechad.github.io';
const FOREST_CITATION = 'Source: "Integrated Deforestation Alerts". UMD/GLAD and WUR, accessed through Global Nature Watch on [date]';
// 4° cells between 30°N and 30°S with any land (global-land-mask, 16×16 samples per cell, 1 Nov 2026): 559 of 1,350
const FOREST_CELLS = '15_8 15_17 15_27 15_28 15_29 15_30 15_31 15_32 15_48 15_49 15_50 15_51 15_52 15_53 15_73 15_74 15_75 15_76 15_77 15_78 15_79 15_80 15_81 15_82 15_83 16_6 16_27 16_28 16_29 16_30 16_31 16_32 16_33 16_34 16_48 16_49 16_50 16_51 16_52 16_53 16_55 16_56 16_73 16_74 16_75 16_76 16_77 16_78 16_79 16_80 16_81 16_82 16_83 16_86 17_2 17_27 17_28 17_29 17_30 17_31 17_32 17_33 17_34 17_35 17_47 17_48 17_49 17_50 17_51 17_52 17_53 17_54 17_55 17_56 17_57 17_58 17_59 17_73 17_74 17_75 17_76 17_77 17_78 17_79 17_80 17_81 17_82 17_86 17_87 17_89 18_0 18_1 18_7 18_25 18_26 18_27 18_28 18_29 18_30 18_31 18_32 18_33 18_34 18_35 18_47 18_48 18_49 18_50 18_51 18_52 18_53 18_54 18_55 18_56 18_57 18_75 18_76 18_77 18_78 18_79 18_80 18_81 18_86 18_87 18_89 19_1 19_2 19_25 19_26 19_27 19_28 19_29 19_30 19_31 19_32 19_33 19_34 19_35 19_48 19_49 19_50 19_51 19_52 19_53 19_54 19_55 19_56 19_57 19_75 19_76 19_77 19_78 19_79 19_80 19_82 19_83 19_85 19_86 20_9 20_24 20_25 20_26 20_27 20_28 20_29 20_30 20_31 20_32 20_33 20_34 20_35 20_36 20_48 20_49 20_50 20_51 20_52 20_53 20_54 20_71 20_72 20_73 20_74 20_75 20_76 20_77 20_78 20_79 20_80 20_81 20_82 20_83 20_84 20_85 20_86 21_6 21_24 21_25 21_26 21_27 21_28 21_29 21_30 21_31 21_32 21_33 21_34 21_35 21_36 21_47 21_48 21_49 21_50 21_51 21_52 21_53 21_54 21_55 21_58 21_69 21_70 21_71 21_72 21_73 21_74 21_75 21_76 21_77 21_78 21_79 21_80 21_81 21_82 21_83 22_22 22_24 22_25 22_26 22_27 22_28 22_29 22_30 22_31 22_32 22_33 22_46 22_47 22_48 22_49 22_50 22_51 22_52 22_53 22_54 22_55 22_56 22_69 22_70 22_71 22_72 22_73 22_74 22_75 22_76 22_77 22_78 22_79 22_82 23_25 23_26 23_27 23_28 23_29 23_30 23_31 23_32 23_42 23_43 23_44 23_45 23_46 23_47 23_48 23_49 23_50 23_51 23_52 23_53 23_54 23_55 23_56 23_57 23_68 23_69 23_70 23_72 23_73 23_74 23_76 23_77 23_87 24_23 24_24 24_25 24_26 24_27 24_28 24_29 24_30 24_41 24_42 24_43 24_44 24_45 24_46 24_47 24_48 24_49 24_50 24_51 24_52 24_53 24_54 24_55 24_56 24_57 24_64 24_65 24_68 24_69 24_70 24_71 24_74 24_75 24_76 24_78 24_82 25_22 25_23 25_24 25_26 25_27 25_28 25_29 25_30 25_40 25_41 25_42 25_43 25_44 25_45 25_46 25_47 25_48 25_49 25_50 25_51 25_52 25_53 25_54 25_55 25_56 25_57 25_58 25_63 25_64 25_65 25_68 25_69 25_70 25_71 25_72 25_74 25_75 25_76 25_81 26_19 26_20 26_21 26_22 26_23 26_24 26_25 26_27 26_29 26_38 26_39 26_40 26_41 26_42 26_43 26_44 26_45 26_46 26_47 26_48 26_49 26_50 26_51 26_52 26_53 26_54 26_55 26_56 26_57 26_58 26_63 26_64 26_65 26_68 26_69 26_70 26_71 26_72 26_74 26_75 26_81 27_4 27_5 27_6 27_18 27_19 27_20 27_21 27_22 27_23 27_24 27_25 27_26 27_27 27_28 27_40 27_41 27_42 27_43 27_44 27_45 27_46 27_47 27_48 27_49 27_50 27_51 27_52 27_53 27_54 27_55 27_56 27_57 27_58 27_59 27_62 27_63 27_64 27_65 27_66 27_67 27_68 27_69 27_70 27_71 27_72 27_73 27_75 28_5 28_16 28_17 28_18 28_19 28_20 28_23 28_24 28_25 28_26 28_40 28_41 28_42 28_43 28_44 28_45 28_46 28_47 28_48 28_49 28_50 28_51 28_52 28_53 28_54 28_55 28_56 28_57 28_58 28_59 28_60 28_61 28_62 28_63 28_64 28_65 28_66 28_67 28_68 28_69 28_70 28_71 28_72 28_73 28_74 28_75 28_76 29_16 29_17 29_18 29_19 29_20 29_21 29_22 29_23 29_24 29_25 29_40 29_41 29_42 29_43 29_44 29_45 29_46 29_47 29_48 29_49 29_50 29_51 29_52 29_53 29_54 29_55 29_56 29_57 29_58 29_59 29_60 29_61 29_62 29_63 29_64 29_65 29_66 29_67 29_68 29_69 29_70 29_71 29_72 29_73 29_74 29_75 29_76 29_77'.split(' ');

function cellBounds(id) { const [r, c] = id.split('_').map(Number); const s = -90 + r * CELL_DEG, w = -180 + c * CELL_DEG; return { w, s, e: w + CELL_DEG, n: s + CELL_DEG }; }

async function forestQuery(env, id, since) {
  const b = cellBounds(id);
  const body = JSON.stringify({
    sql: `SELECT gfw_integrated_alerts__confidence, COUNT(*) AS n FROM results WHERE gfw_integrated_alerts__date >= '${since}' GROUP BY gfw_integrated_alerts__confidence`,
    geometry: { type: 'Polygon', coordinates: [[[b.w, b.s], [b.e, b.s], [b.e, b.n], [b.w, b.n], [b.w, b.s]]] },
  });
  const t0 = Date.now();
  try {
    const r = await fetch(URLS.forest, { method: 'POST', body, redirect: 'follow', signal: AbortSignal.timeout(FOREST_TIMEOUT_MS),
      headers: { 'User-Agent': UA, 'x-api-key': env.GFW_API_KEY, 'Origin': FOREST_ORIGIN, 'Content-Type': 'application/json' } });
    const text = await r.text();
    const ms = Date.now() - t0;
    if (r.status === 504) return { pending: true, http: 504, ms };                   // GFW gateway cap; result is being cached server-side
    if (!r.ok) return { error: `http ${r.status} ${text.slice(0, 120)}`, http: r.status, ms };
    const j = JSON.parse(text);
    const counts = { nominal: 0, high: 0, highest: 0 };
    for (const row of j.data || []) counts[row.gfw_integrated_alerts__confidence] = +row.n || +row.count || 0;   // keys as delivered; unknown labels are kept and surface in the snapshot
    return { ok: true, counts, http: r.status, ms, version: (r.url.match(/\/(v\d{8})\//) || [])[1] || 'latest' };
  } catch (e) {
    const ms = Date.now() - t0;
    if (String(e).includes('Timeout') || String(e).includes('abort')) return { pending: true, http: 0, ms };
    return { error: String(e).slice(0, 160), http: 0, ms };
  }
}

async function collectForest(env, scheduledMs) {
  const layer = 'forest';
  if (!env.GFW_API_KEY) return writeDown(env, layer, scheduledMs, 'no GFW_API_KEY set', 0);
  const st = (await getJson(env, 'state/forest.json')) || { cursor: 0, cells: {}, pending: [] };
  const since = dayKey(scheduledMs - FOREST_WINDOW_DAYS * 86400e3);
  const today = dayKey(scheduledMs);
  // this run's cells: pending retries first, then the next FOREST_PER_RUN from the cursor
  const todo = [];
  for (const id of st.pending || []) if (todo.length < FOREST_PER_RUN) todo.push(id);
  while (todo.length < FOREST_PER_RUN) { todo.push(FOREST_CELLS[st.cursor % FOREST_CELLS.length]); st.cursor = (st.cursor + 1) % FOREST_CELLS.length; }
  const stillPending = []; const notes = []; let okN = 0, errN = 0, version = null; const d1 = [];
  for (const id of todo) {                                                              // sequential on purpose: one query at a time against GFW
    const r = await forestQuery(env, id, st.cells[id] && st.cells[id].pending_since ? st.cells[id].pending_since : since);
    if (r.pending) { stillPending.push(id); st.cells[id] = { ...(st.cells[id] || {}), pending_since: (st.cells[id] && st.cells[id].pending_since) || since, pending_at: nowIso() }; notes.push(`${id}:pending ${r.ms}ms`); continue; }
    if (r.error) { errN++; st.cells[id] = { ...(st.cells[id] || {}), last_error: r.error, error_at: nowIso() }; notes.push(`${id}:error ${r.error.slice(0, 60)}`); continue; }
    okN++; version = r.version;
    const total = r.counts.nominal + r.counts.high + r.counts.highest;
    const usedSince = (st.cells[id] && st.cells[id].pending_since) || since;
    st.cells[id] = { count: total, confidence: r.counts, since: usedSince, queried_at: nowIso(), ms: r.ms, version: r.version };
    d1.push([id, today, usedSince, r.counts.nominal, r.counts.high, r.counts.highest, r.version]);
    notes.push(`${id}:${total} ${r.ms}ms`);
  }
  st.pending = stillPending;
  st.last_run = nowIso(); st.ok_runs = (st.ok_runs || 0) + (okN ? 1 : 0); st.version = version || st.version;
  await putJson(env, 'state/forest.json', st);
  if (d1.length) { try { await env.DB.batch(d1.map(r => env.DB.prepare('INSERT OR REPLACE INTO forest_daily (cell_id, date, since, nominal, high, highest, version, retrieved_at) VALUES (?,?,?,?,?,?,?,?)').bind(...r, nowIso()))); } catch (e) { console.log('forest_daily insert', String(e)); } }
  // envelope: every cell that has ever answered, with its own since/queried_at; coverage partial everywhere (phase 1)
  const cells = {}; const rows = []; let queriedToday = 0, oldest = null;
  for (const id in st.cells) {
    const c = st.cells[id]; if (c.count === undefined) continue;
    cells[id] = { count: c.count, confidence: c.confidence, since: c.since, queried_at: c.queried_at, version: c.version,
      coverage: { grade: 'partial', evidence: 'no_per_cell_observation_opportunity;cloud_and_system_coverage_vary;sweep_' + c.queried_at.slice(0, 10), observed_fraction: null } };
    const b = cellBounds(id);
    rows.push([id, b.w, b.s, b.e, b.n, c.confidence.nominal, c.confidence.high, c.confidence.highest, c.since, c.queried_at, c.version]);
    if (c.queried_at.slice(0, 10) === today) queriedToday++;
    if (!oldest || c.queried_at < oldest) oldest = c.queried_at;
  }
  const answered = Object.keys(cells).length;
  const status = okN ? 'ok' : (stillPending.length === todo.length ? 'degraded' : 'down');
  const e = envelope(layer, scheduledMs, since, today, status, cells, ['cell_id', 'west', 'south', 'east', 'north', 'nominal', 'high', 'highest', 'since', 'queried_at', 'version'], rows,
    { quantity: `10 m alert pixels published in the last ${FOREST_WINDOW_DAYS} days per 4° cell, by GFW confidence (nominal | high | highest) — counts of pixels, never hectares or trends; detection date ≠ clearing date`,
      window_days: FOREST_WINDOW_DAYS, cell_window_note: 'each cell carries its own since/queried_at; the sweep takes ~2 days',
      sweep: { cells_total: FOREST_CELLS.length, answered, queried_today: queriedToday, oldest_queried_at: oldest, pending: stillPending.length, per_run: FOREST_PER_RUN, cursor: st.cursor, this_run: notes },
      coverage_note: 'alert systems operate between 30°N and 30°S only; cells outside are unknown by definition, not zero. Within: partial — cloud and system coverage vary; counts can fall when low-confidence alerts are retracted (GLAD after 180 days, RADD after 90).',
      source_version: st.version, citation: FOREST_CITATION.replace('[date]', today),
      attribution: 'powered by Resource Watch / Global Nature Watch (WRI) — CC BY 4.0', map_layer: true });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await logRun(env, layer, scheduledMs, status, okN ? 200 : (stillPending.length ? 504 : 0), okN, bytes, `ok=${okN} pending=${stillPending.length} err=${errN} answered=${answered}/${FOREST_CELLS.length} cursor=${st.cursor} ${notes.join(' ')}`.slice(0, 500));
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

/* Ships hour H (ingested samples, irregular cadence): list the hour's cells files (1 R2 list), mean/max unique vessels per cell over ok samples.
 * Keeps the sampling metadata a later comparison needs: which samples, window length, connection fraction — not just counts (review round 4). */
async function aggregateShips(env, hourMs) {
  const layer = 'ships';
  const hour = hourKey(hourMs);
  const listed = await env.R2.list({ prefix: `cells/${layer}/${hour}` });
  const files = [];
  for (const o of listed.objects || []) { const f = await getJson(env, o.key); if (f) files.push({ key: o.key, f }); }
  const ok = files.filter(x => x.f.source_status === 'ok');
  const sums = {}, maxes = {};
  for (const { f } of ok) for (const id in f.cells) { sums[id] = (sums[id] || 0) + f.cells[id].count; maxes[id] = Math.max(maxes[id] || 0, f.cells[id].count); }
  const expected = 2;                                                   // 30-min cadence while the home collector is available
  const frac = Math.min(1, ok.length / expected);
  const incoming = {};
  for (const id in sums) incoming[id] = { count: Math.round(sums[id] / ok.length * 100) / 100, count_max: maxes[id], coverage: 'partial', observed_fraction: frac, extra: null };   // partial: terrestrial AIS, receipt history pending
  const meta = { window_s: ok.map(x => x.f.window_s), samples: ok.map(x => x.key.slice(-22, -5)), connection_fraction: ok.map(x => x.f.connection_fraction_of_sample ?? (x.f.coverage_default && x.f.coverage_default.observed_fraction)), class_a: ok.map(x => x.f.class_a), class_b: ok.map(x => x.f.class_b), collector: ok.map(x => x.f.collector_version) };
  /* D9, tightened 1 Nov 2026 after hours 12 and 13 UTC were recorded 'absent' although two and one sample had been received
   * and stored: a sample that ARRIVED but did not meet the quality bar is not "nobody sampled". The two must stay
   * distinguishable, because 'absent' is the only value that licenses reading the hour as never-asked.
   *   no file for the hour at all      -> absent
   *   files received, none usable      -> degraded (received > 0, usable = 0)
   *   some usable, fewer than expected -> degraded
   *   usable >= expected               -> ok                                                                              */
  const received = files.length, usable = ok.length;
  const status = usable >= expected ? 'ok' : (received ? 'degraded' : 'absent');
  const rejected = files.filter(x => x.f.source_status !== 'ok').map(x => ({ sample: x.key.slice(-22, -5), status: x.f.source_status, receiving_s: x.f.receiving_s ?? null, wall_s: x.f.wall_s ?? null }));
  await layerHourly(env, layer, hour, expected, usable, status, 'none', JSON.stringify({ rule: 'mean of per-sample unique vessels; sampled, not continuous', received, usable, rejected, ...meta }).slice(0, 1500));
  const changed = ok.length ? await upsertChanged(env, layer, { [hour]: incoming }) : 0;
  return { files: received, ok: usable, status, rejected: rejected.length, cells: Object.keys(incoming).length, changed };
}

async function hourlyBatch(env, scheduledMs) {
  const started = Date.now();
  const hourMs = Math.floor((scheduledMs - 3600e3) / 3600e3) * 3600e3;    // previous full hour
  const out = {};
  if (env.OPENSKY_ENABLED === '1') { try { out.opensky = await aggregateOpensky(env, hourMs); } catch (e) { out.opensky = 'error ' + e; } } else out.opensky = 'parked';
  try { out.ships = await aggregateShips(env, hourMs); } catch (e) { out.ships = 'error ' + e; }
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
    guarded(env, 'usgs', ms, collectUsgs),
    env.OPENSKY_ENABLED === '1' ? guarded(env, 'opensky', ms, collectOpenskyWorld) : 'opensky:parked',
  ])).join('; '),
  minute: async (env, ms) => env.OPENSKY_ENABLED === '1' ? guarded(env, 'opensky-bbox', ms, collectOpenskyBbox) : 'opensky-bbox:parked (disable the * * * * * trigger)',
  firms: async (env, ms) => guarded(env, 'firms', ms, collectFirms),
  forest: async (env, ms) => guarded(env, 'forest', ms, collectForest),
  hourly: async (env, ms, manual) => {
    const k = await guarded(env, 'swpc', ms, collectSwpc);          // Kp is a 3-hourly product; hourly matches NWS's "know your refresh frequency" (REGISTER.md)
    const c = await guarded(env, 'co2', ms, collectCo2);
    const hr = new Date(ms).getUTCHours();
    const i = (manual || hr % 6 === 3) ? await guarded(env, 'seaice', ms, collectSeaIce) : 'seaice:skipped (runs 03/09/15/21 UTC)';   // NSIDC updates once a day
    const b = await hourlyBatch(env, ms);
    return { swpc: k, co2: c, seaice: i, batch: b };
  },
};

function jobForCron(cron) {
  const c = cron.replace(/\s+/g, ' ').trim();
  if (c === '*/5 * * * *') return 'five';
  if (c === '* * * * *') return 'minute';
  if (c === '*/15 * * * *') return 'firms';
  if (c === '11,41 * * * *') return 'forest';
  if (/^\d+ \* \* \* \*$/.test(c)) return 'hourly';
  return null;
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
const LAYERS = ['usgs', 'swpc', 'opensky', 'opensky-bbox', 'firms', 'co2', 'seaice', 'mock', 'ships', 'lightning', 'forest'];   // GET-readable; ships/lightning arrive via /ingest (D11)
const INGEST_LAYERS = ['mock', 'opensky', 'ships', 'lightning'];   // D11: external collectors (Mac/Pi) publish these through /ingest
const INGEST_MAX_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------- /ingest (D11): validate, then publish like any collector

/* Returns null if the body is a publishable §5 envelope for `layer`, else a reason string. The hub never repairs a bad envelope. */
function validateEnvelope(e, layer) {
  if (!e || typeof e !== 'object') return 'body is not an object';
  if (e.schema_version !== SCHEMA_VERSION) return 'schema_version must be ' + SCHEMA_VERSION;
  if (e.layer !== layer) return 'layer in body (' + e.layer + ') does not match path (' + layer + ')';
  for (const k of ['retrieved_at', 'scheduled_for']) if (!e[k] || !Number.isFinite(Date.parse(e[k]))) return k + ' missing or not ISO-8601';
  if (Math.abs(Date.now() - Date.parse(e.retrieved_at)) > 6 * 3600e3) return 'retrieved_at is more than 6 h from now';
  if (!['ok', 'degraded', 'down'].includes(e.source_status)) return 'source_status must be ok|degraded|down';
  if (typeof e.collector_version !== 'string') return 'collector_version missing';
  if (!e.cells || typeof e.cells !== 'object' || Array.isArray(e.cells)) return 'cells must be an object';
  for (const id in e.cells) {
    const m = /^(\d{1,2})_(\d{1,2})$/.exec(id);
    if (!m || +m[1] >= 180 / CELL_DEG || +m[2] >= 360 / CELL_DEG) return 'bad cell id ' + id + ' (rows 0-' + (180 / CELL_DEG - 1) + ', cols 0-' + (360 / CELL_DEG - 1) + ')';
    const c = e.cells[id];
    if (!c || !Number.isFinite(c.count)) return 'cell ' + id + ' has no numeric count';
    if (!c.coverage || !['adequate', 'partial', 'unknown'].includes(c.coverage.grade) || typeof c.coverage.evidence !== 'string') return 'cell ' + id + ' coverage must be {grade: adequate|partial|unknown, evidence: string}';
  }
  if (e.source_status !== 'down') {
    if (e.record_format !== 'rows' || !Array.isArray(e.record_fields) || !Array.isArray(e.records)) return "record_format must be 'rows' with record_fields[] and records[]";
    for (const r of e.records) if (!Array.isArray(r) || r.length !== e.record_fields.length) return 'every record must have exactly ' + e.record_fields.length + ' fields';
    if (typeof e.quantity !== 'string') return 'quantity (what one count means) is required';
  }
  return null;
}

async function ingest(req, env, layer) {
  if (!env.INGEST_KEY) return json({ error: 'ingest not enabled (INGEST_KEY unset)' }, 503, { 'Cache-Control': 'no-store' });
  const auth = req.headers.get('Authorization') || '';
  if (auth !== 'Bearer ' + env.INGEST_KEY) return json({ error: 'forbidden' }, 403, { 'Cache-Control': 'no-store' });
  if (!INGEST_LAYERS.includes(layer)) return json({ error: 'layer not ingestable', layers: INGEST_LAYERS }, 404);
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > INGEST_MAX_BYTES) return json({ error: 'body too large', max_bytes: INGEST_MAX_BYTES }, 413);
  let e;
  try { e = await req.json(); } catch (_) { return json({ error: 'body is not JSON' }, 400); }
  const why = validateEnvelope(e, layer);
  if (why) return json({ error: 'invalid envelope', why }, 422, { 'Cache-Control': 'no-store' });
  const scheduledMs = Date.parse(e.scheduled_for);
  e.received_at = nowIso();                                          // third timestamp: observed (window_end) / retrieved_at / received_at
  e.ingested_from = (req.headers.get('User-Agent') || '').slice(0, 120);
  e.stale_after_s = e.stale_after_s || STALE_AFTER_S[layer] || 900;
  if (e.source_status === 'down') {
    await writeDown(env, layer, scheduledMs, 'ingested down: ' + (e.note || ''), 0);
    return json({ ok: true, layer, published: 'cells only (down)', snapshot: isoMinute(scheduledMs) }, 200, { 'Cache-Control': 'no-store' });
  }
  // Ordering guard (review round 4): an upload older than what latest/ already holds is archived but must not become "latest".
  const cur = await getJson(env, `latest-cells/${layer}.json`);
  if (cur && cur.retrieved_at && Date.parse(cur.retrieved_at) > Date.parse(e.retrieved_at)) {
    const stamp = isoMinute(scheduledMs);
    const bytes = await putJson(env, `snapshots/${layer}/${stamp}.json`, e);
    await putJson(env, `cells/${layer}/${stamp}.json`, { ...e, records: undefined, record_fields: undefined, record_format: undefined });
    await logRun(env, layer, scheduledMs, e.source_status, 200, e.records.length, bytes, 'ingested (archive only: older than latest ' + cur.retrieved_at + ') from ' + e.ingested_from);
    return json({ ok: true, layer, snapshot: stamp, published: 'archive only (older than latest)', latest_retrieved_at: cur.retrieved_at }, 200, { 'Cache-Control': 'no-store' });
  }
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);    // same path as internal collectors: snapshot, cells, latest, latest-cells
  await logRun(env, layer, scheduledMs, e.source_status, 200, e.records.length, bytes, 'ingested from ' + e.ingested_from + ' v' + e.collector_version);
  return json({ ok: true, layer, snapshot: isoMinute(scheduledMs), records: e.records.length, cells: Object.keys(e.cells).length, bytes }, 200, { 'Cache-Control': 'no-store' });
}

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
    const p = url.pathname.split('/').filter(Boolean);
    if (p[0] === 'ingest') {
      if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
      return ingest(req, env, p[1] || '');
    }
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405);

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

    /* Repair one hour's aggregation from the objects still in R2 (added 1 Nov 2026 for the hours 12/13 defect).
     * Refuses when the hour's evidence has expired: cells/ is deleted after 2 days (D12), and an hour that can no longer
     * be rebuilt from what was retained stays exactly as it was recorded. We do not reconstruct history we cannot read. */
    if (p[0] === 'admin' && p[1] === 'reaggregate') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      const layer = p[2] || '';
      if (layer !== 'ships') return json({ error: 'only ships re-aggregation is implemented', layer }, 400);
      const hour = url.searchParams.get('hour') || '';
      if (!/^\d{4}-\d\d-\d\dT\d\d$/.test(hour)) return json({ error: "hour must look like 2026-11-01T12 (UTC)" }, 400);
      const hourMs = Date.parse(hour + ':00:00Z');
      if (!Number.isFinite(hourMs)) return json({ error: 'hour is not a valid UTC hour', hour }, 400);
      const listed = await env.R2.list({ prefix: `cells/${layer}/${hour}` });
      const found = (listed.objects || []).map(o => o.key);
      if (!found.length) return json({ error: 'no retained objects for that hour — history is not repaired without evidence', hour, note: 'cells/ objects are deleted 2 days after they are written (D12 lifecycle)' }, 409, { 'Cache-Control': 'no-store' });
      const before = await env.DB.prepare('SELECT snapshots_expected, snapshots_ok, source_status, note FROM layer_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
      const result = await aggregateShips(env, hourMs);
      const after = await env.DB.prepare('SELECT snapshots_expected, snapshots_ok, source_status, note FROM layer_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
      return json({ reaggregated: hour, layer, objects: found, before, after, result }, 200, { 'Cache-Control': 'no-store' });
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
