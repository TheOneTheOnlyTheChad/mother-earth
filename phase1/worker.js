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
 *   GET /admin/probe/spacetrack?key=ADMIN_KEY   ONE bounded Space-Track check (0.2.3; 0.2.4 also stages the GP body privately at staging/spacetrack-gp.csv; not scheduled)
 *   GET /admin/probe/orbital-build?key=ADMIN_KEY  run the orbital build on the staged copy (0.2.4; no upstream request, writes nothing)
 *   GET /admin/probe/r2-conditional?key=ADMIN_KEY  (0.6.0) the R2 behaviours FIRMS v2 relies on, checked on this bucket; probe/ keys only, deleted after
 *   GET /snapshot/orbital, /elements/orbital   orbital meta + classified element CSV (0.3.0; job gated by ORBITAL_ENABLED=1, odd UTC hours at :41)
 *   GET /catalogue/timeline (0.6.3) the FIXED Timeline catalogue (deep-time build proposal rev 1.1 §4): served from R2 ref/timeline/ only if
 *                           the complete stored file hashes to its pin's fileSha256 and validates; else 503 unavailable. Not a collector.
 *                           0.6.4: this legacy URL is pinned to TIMELINE_LEGACY (tl-2026-11-R1) permanently, never to "current".
 *   GET /catalogue/timeline/<revision> (0.6.4; TIMELINE-CATALOGUE-REVISIONS-PROPOSAL rev 1.1) that exact published revision, same rules;
 *                           an id not in TIMELINE_REVISIONS (exact key match) → 404 without any R2 read.
 *   GET /catalogue/sky/<revision> (0.6.5; SKY-TWO-CLOCKS-PROPOSAL rev 3 §5a) the FIXED Sky catalogue (Moon/Sun daily distances, NASA/JPL
 *                           Horizons): versioned only — an id not in SKY_REVISIONS (exact key match), a malformed path or the bare
 *                           /catalogue/sky → 404 without any R2 read; a known revision whose stored bytes are missing or fail the pin → 503.
 *   GET /catalogue/oceanheat/<revision>/<file> (0.6.7; OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §2) one file of a FIXED Ocean Heat snapshot
 *                           (NOAA Coral Reef Watch, dated): both segments must be exact keys in OCEANHEAT_REVISIONS, else 404 with no
 *                           R2 read; served byte for byte only if the stored length and sha256 match the pin, else 503 (no-store).
 *   GET /snapshot/arts      (0.6.2) the FIXED Met catalogue snapshot (Arts release proposal rev 2.1): served from R2 ref/arts/ only if the complete
 *                           stored file hashes to ARTS.fileSha256 and its snapshot_id = ARTS.recordsSha256; else 503 unavailable. Not a collector.
 *
 * Bindings (set in dashboard → Worker → Settings → Bindings):
 *   R2  = R2 bucket binding        DB = D1 database binding
 * Secrets: OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET, FIRMS_MAP_KEY, ADMIN_KEY, INGEST_KEY (external collectors; ingest is disabled until set)
 *          SPACETRACK_USER, SPACETRACK_PASS (Chad's Space-Track login; used only by /admin/probe/spacetrack)
 * Plain vars (optional): OPENSKY_ENABLED = "1" to run the OpenSky pulls (parked 31 Oct 2026: Cloudflare egress 522 + public site must feed; unset = skip silently)
*                        OPENSKY_BBOX = "lamin,lomin,lamax,lomax"  (default southern Africa)
 *                        FIRMS_REGION = "west,south,east,north"   (default: world; set only if the Free plan's CPU limit forces it)
 *                        FIRMS_PIPELINE = "v2"  (0.6.0) streaming FIRMS pipeline with D1 run state (FIRMS v2 section; needs the firms_* tables); unset = legacy
 *                        FIRMS_CREATE_ONLY = "verified"  (0.6.0) allow v2 to CREATE latest/ or latest-cells/ when absent — set only after
 *                                         /admin/probe/r2-conditional reports all_as_designed on this bucket
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
const COLLECTOR_VERSION = '0.6.11';
const CELL_DEG = 4;                       // §4.2: stay at 4° until needed
const OPENSKY_DAILY_CREDITS = 4000;       // §4.3
const OPENSKY_SOFT = 0.80, OPENSKY_HARD = 0.95;
const WORLD_COST_DEFAULT = 4;
const STALE_AFTER_S = { usgs: 900, swpc: 2 * 3600, opensky: 600, firms: 2400, co2: 2 * 3600, seaice: 8 * 3600, mock: 600, ships: 3 * 3600, lightning: 900, forest: 4 * 3600, satellites: 26 * 3600, orbital: 8 * 3600, drifters: 4 * 3600, plastic: 72 * 3600 }; // §3.3 collector freshness (co2: daily product, collected hourly)
const FIRMS_DAY_BOUNDARY_H = 4;             // before 04:00 UTC an empty FIRMS file is the day boundary, not an outage (measured 1 Nov 2026: first rows at 04:00)
/* FIRMS resource guard: beyond this, keep raw only (D14 wording). 4 MB (30 Oct, Free-plan CPU) tripped daily from 3 Nov (5.3 MB by
 * 5 Nov evening). On Paid the binding limit is MEMORY: 128 MB per isolate, shared by concurrent requests (Cloudflare limits page,
 * read 6 Nov). Chosen from a pass/fail bench in workerd 2026-07-30 under a TOTAL-heap cap (--max-heap-size), natural GC, the real
 * 5 Nov file + scale-ups of its own rows, 6 scenarios incl. a resident /place index, collect + checkpoint overlap and two collects,
 * 2 runs each (phase1/bench-firms-memory/): 8 MiB passes every scenario at an 80 MB cap (48 MB headroom); 12 MiB fails the
 * two-collect case at 128 MB. Larger files need allocation reductions first (proposed in reviews/2026-11-06-firms-guard.md §3). */
const FIRMS_MAX_PARSE_BYTES = 8 * 1024 * 1024;

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
  drifters: (since) => `https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.csv?platform_code,platform_type,country,time,latitude,longitude,sst&time%3E=${since}&platform_type=~%22DRIFTING%20BUOYS.*%22&orderByMax(%22platform_code,time%22)`,   // latest fix per buoy, last 24 h (CC0)
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

async function putJson(env, key, obj, meta) {
  const body = JSON.stringify(obj);
  await env.R2.put(key, body, { httpMetadata: { contentType: 'application/json' }, ...(meta ? { customMetadata: meta } : {}) });
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
  const full = await putJson(env, `snapshots/${layer}/${stamp}.json`, envelope, { retrieved_at: String(envelope.retrieved_at) });   // retrieved_at lets a listing order snapshots by full timestamp
  await putJson(env, `cells/${layer}/${stamp}.json`, cellsOnly);
  await putJson(env, `latest/${layer}.json`, envelope);
  await putJson(env, `latest-cells/${layer}.json`, cellsOnly);
  if (HIST.checkpointLayers.includes(layer)) await hist(env, layer + '-checkpoint', () => histCheckpointsDue(env, layer, Date.now()));   // after publishing; no mutable state (see histCheckpointsDue)
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
  // A closed day's checkpoint must not wait for this layer's next SUCCESS (5 Nov: firms down 15:45→02:15, checkpoint written only at 02:16).
  if (HIST.checkpointLayers.includes(layer)) await hist(env, layer + '-checkpoint', () => histCheckpointsDue(env, layer, Date.now()));
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
  const statusReason = fresh ? null : !Number.isFinite(ageS)
    ? { code: 'feed_age_unknown', rule: 'our feed-age limit cannot be applied: the feed gave no usable generation time', reference: 'feed generated time (metadata.generated)', limit_s: 600 }
    : { code: 'feed_not_refreshed', rule: 'our feed-age limit', reference: 'feed generated time (metadata.generated)', limit_s: 600, age_s: Math.round(ageS) };
  const e = envelope(layer, scheduledMs, new Date(Date.now() - 86400e3).toISOString(), nowIso(), status, cells, fields, rows,
    { source_generated_at: generated ? new Date(generated).toISOString() : null, source_age_s: ageS, status_reason: statusReason,
      coverage_default: { grade, evidence, observed_fraction: fresh ? 1 : 0 },
      quantity: 'earthquakes M2.5+ in the last 24 h (count) and M4.5+ (count_m45), deduplicated by USGS id' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await hist(env, 'usgs-revisions', () => histQuakes(env, j.features, e.retrieved_at));
  await logRun(env, layer, scheduledMs, status, res.status, rows.length, bytes, 'generated_age_s=' + Math.round(ageS || -1));
}

// ---------------------------------------------------------------- SWPC Kp

// Kp status (0.6.1, 8 Nov 2026 — reviews/2026-11-08-kp-degraded-finding.md). Each Kp value covers a 3-hour interval and its
// time_tag is the interval START (measured: values first reach us 3.13 h after time_tag, 31 of 33; 4.13 h for 2). The old
// "< 4 h from time_tag" rule marked ~2 of every 3 hourly runs degraded during 4–8 Nov (ages 4.13–6.13 h, before the next value).
// PROVISIONAL candidate policy (not a source deadline): degraded once the newest value is >= 7.5 h past its interval start,
// i.e. the next value is overdue. With hourly polling a missing value is first flagged ~2 h after it was due (~8.13 h).
// Reference point: time_tag (interval start). Invalid or future time_tags are degraded with their own reason, never 'ok'.
const KP = { intervalS: 3 * 3600, lateAfterS: 7.5 * 3600, futureSkewS: 300 };
// Cloud ships reason (0.6.1 rev 3). The measured values are published UNROUNDED: a reason exists to explain the condition, and
// rounding 75.04 s to 75 or 0.8999 to 0.9 would publish a number that contradicts it (GPT, 8 Nov). The page formats them.
function shipsReason(wallS, upFrac, windowS, overlong) {
  if (!overlong && upFrac >= 0.9) return null;
  return overlong
    ? { code: 'sample_overlong', rule: 'our sampling standard: elapsed time over 1.25 × the window', elapsed_s: wallS, window_s: windowS, limit_s: 1.25 * windowS, also_low_flow: upFrac < 0.9 }
    : { code: 'sample_flow_below_standard', rule: 'our sampling standard: messages flowing for at least 90% of the window (inferred from arrival gaps)', fraction: upFrac, window_s: windowS };
}
function kpStatus(timeTag, nowMs) {
  const t = typeof timeTag === 'string' ? Date.parse(timeTag) : NaN;
  if (!Number.isFinite(t)) return { status: 'degraded', reason: { code: 'time_tag_invalid', rule: 'source timestamp unusable', reference: 'interval start (time_tag)' } };
  const ageS = (nowMs - t) / 1000;
  if (ageS < -KP.futureSkewS) return { status: 'degraded', age_s: ageS, reason: { code: 'time_tag_in_future', rule: 'source timestamp later than our clock', reference: 'interval start (time_tag)', age_s: Math.round(ageS) } };
  if (ageS >= KP.lateAfterS) return { status: 'degraded', age_s: ageS, reason: { code: 'observation_older_than_limit', rule: 'our observation-age limit (provisional)', reference: 'interval start (time_tag)', limit_s: KP.lateAfterS, age_s: Math.round(ageS) } };
  return { status: 'ok', age_s: ageS, reason: null };
}

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
  const ks = kpStatus(timeTag, Date.now());
  const ageS = Number.isFinite(ks.age_s) ? ks.age_s : null;
  const status = ks.status;
  const intervalEnd = Number.isFinite(Date.parse(timeTag)) ? new Date(Date.parse(timeTag) + KP.intervalS * 1000).toISOString() : null;
  const fields = ['time_tag', 'kp', 'a_running', 'station_count'];
  const e = envelope(layer, scheduledMs, rows[0] ? rows[0][0] : null, timeTag, status, {}, fields, rows,
    { index: { name: 'planetary K-index', value: kp, time_tag: timeTag, interval_start: timeTag, interval_end: intervalEnd, source_age_s: ageS, age_reference: 'interval start (time_tag)' }, map_layer: false,
      status_reason: ks.reason,
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

/** Content check of the fields we use, from the values seen in real files (6 Nov: 125,294 rows over 3 files, no empty value in any
 * column; acq_time "0" and FRP "0" are genuine). Returns a reason or null. Genuine zeros pass; an EMPTY FRP is a legitimate missing
 * value (published as null, never 0); an empty required field (e.g. a cut-off final "D") is refused. */
function firmsRowProblem(c, iLat, iLng, iDate, iTime, iConf, iFrp, iSat, iDn) {
  const lat = c[iLat], lng = c[iLng], d = c[iDate], t = c[iTime];
  if (lat === '' || !Number.isFinite(+lat) || Math.abs(+lat) > 90) return `latitude "${lat}"`;
  if (lng === '' || !Number.isFinite(+lng) || Math.abs(+lng) > 180) return `longitude "${lng}"`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return `acq_date "${d}"`;
  if (!/^\d{1,4}$/.test(t || '') || +t % 100 > 59 || +t > 2359) return `acq_time "${t}"`;
  if (iConf >= 0 && !/^([nlh]|\d{1,3})$/.test(c[iConf] || '')) return `confidence "${c[iConf]}"`;
  if (iFrp >= 0 && c[iFrp] !== '' && !(Number.isFinite(+c[iFrp]) && +c[iFrp] >= 0)) return `frp "${c[iFrp]}"`;
  if (iSat >= 0 && !c[iSat]) return 'satellite empty';
  if (iDn >= 0 && !/^[DN]$/.test(c[iDn] || '')) return `daynight "${c[iDn]}"`;
  return null;
}

/** Lean CSV scan: only the columns we need. Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight */
function firmsParse(text) {
  // 0.6.0 fix (7 Nov, found by the monitoring thread): FIRMS's post-midnight header-only file has NO trailing newline (122 B). indexOf
  // gave -1, the header was cut by one character and then re-read as data "line 2" → run down as "malformed" every night. A text with
  // no newline is header-only: 0 rows → the existing empty-day path.
  const nl0 = text.indexOf('\n'), nl = nl0 < 0 ? text.length : nl0;
  const header = text.slice(0, nl).trim().split(',');
  const ix = (n) => header.indexOf(n);
  const iLat = ix('latitude'), iLng = ix('longitude'), iDate = ix('acq_date'), iTime = ix('acq_time'), iConf = ix('confidence'), iFrp = ix('frp'), iSat = ix('satellite'), iDn = ix('daynight');
  if (iLat < 0 || iLng < 0 || iDate < 0 || iTime < 0) throw new Error('unexpected FIRMS header: ' + header.join(','));
  const fields = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'];
  const nCols = header.length;   // every real row has exactly the header's field count (checked 6 Nov on 3 real files, 0 exceptions; no quoting)
  const rows = []; const cells = {}; const byHour = {}; let lineNo = 1;
  let pos = nl + 1; const len = text.length;
  while (pos < len) {
    let end = text.indexOf('\n', pos); if (end < 0) end = len;
    const line = text.slice(pos, end); pos = end + 1; lineNo++;
    if (!line) continue;
    const c = line.split(',');
    // Refuse the whole response on a malformed row — never publish a partial day. These checks catch MOST cuts (field count, then the
    // content of every field we use), not all: a cut exactly between rows passes, and so would a cut inside a numeric field if FIRMS ever
    // put one last. Passing them is NOT proof of a complete download (FIRMS sends no row count or length).
    if (c.length !== nCols) throw new Error(`truncated or malformed response: line ${lineNo} has ${c.length} fields, header has ${nCols}`);
    const bad = firmsRowProblem(c, iLat, iLng, iDate, iTime, iConf, iFrp, iSat, iDn);
    if (bad) throw new Error(`truncated or malformed response: line ${lineNo} ${bad}`);
    const lat = +c[iLat], lng = +c[iLng];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const t = c[iTime].padStart(4, '0');
    const observedAt = c[iDate] + 'T' + t.slice(0, 2) + ':' + t.slice(2) + ':00Z';
    const fv = iFrp < 0 || c[iFrp] === undefined || c[iFrp].trim() === '' ? null : +c[iFrp];   // a missing FRP is null (not provided), never 0 (found 5 Nov: +'' === 0)
    rows.push([lat, lng, observedAt, c[iConf], Number.isFinite(fv) ? fv : null, c[iSat], c[iDn]]);
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

// ---------------------------------------------------------------- FIRMS v2 (0.6.0, design rev 6: docs/FIRMS-MEMORY-DESIGN.md)
/* Streaming FIRMS pipeline with D1 run state. OFF unless FIRMS_PIPELINE = 'v2' (a variable: switching it on is a production step).
 * Memory: no stage holds the whole file — raw and snapshot are written in ≤ 5 MiB parts, parsing is line by line, the checkpoint
 * streams the snapshot through gzip, /place scans keeping 8 rows. State: firms_settings / firms_identity / firms_inputs /
 * firms_attempts / firms_outputs (schema.sql). SQL below = docs/design-checks/firms-state.sql.mjs (checked by firms-v2.test.mjs). */
const FV = {
  part: 5 * 1024 * 1024, maxLine: 4096, leaseMs: 15 * 60e3, expireMs: 36 * 3600e3, legacyMaxJson: 12 * 1024 * 1024,
  fetchMs: 180e3,   // whole FIRMS download (headers + body); a stalled body is aborted, never waited on forever (bench: a reset with Content-Length hung locally)
  placeScans: 2, placeWaitMs: 2000, placeCacheBytes: 256 * 1024, downStampTries: 3,
  legacyKey: /^snapshots\/firms\/\d{4}-\d\d-\d\dT\d\d-\d\dZ\.json$/, latest: 'latest/firms.json', cells: 'latest-cells/firms.json',
  boundary: 'no detections processed yet for today',
};
const FVSQL = {
  CLAIM: `INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
  SELECT ?1, COALESCE(MAX(a.attempt), 0) + 1, ?2, ?3, ?4, ?5 FROM firms_attempts a WHERE a.run_id = ?1
  HAVING COALESCE(MAX(a.attempt), 0) < 3
     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1 AND b.finished_at IS NULL AND b.lease_until > ?4)
     AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = ?1)`,
  CLAIM_COUNT: `UPDATE firms_inputs SET attempts_used = attempts_used + 1
  WHERE run_id = ?1 AND EXISTS (SELECT 1 FROM firms_attempts WHERE token = ?2)`,
  COMMIT: `INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records,
    aux_key, aux_bytes, format, completed_at)
  SELECT a.run_id, a.attempt, a.token, i.retrieved_at, substr(i.retrieved_at, 1, 10), ?2, ?3, ?4, ?5, ?6, ?7, 'lines/1', ?8
  FROM firms_attempts a JOIN firms_inputs i ON i.run_id = a.run_id
  WHERE a.token = ?1 AND a.finished_at IS NULL
    AND a.attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = a.run_id)
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = a.run_id)`,
  COMMIT_DONE: `UPDATE firms_inputs SET state = 'done' WHERE run_id = (SELECT run_id FROM firms_outputs WHERE token = ?1)`,
  FAIL_FENCE: `UPDATE firms_attempts SET finished_at = ?2, outcome = 'failed', note = ?3
  WHERE token = ?1 AND finished_at IS NULL
    AND attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = firms_attempts.run_id)
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = firms_attempts.run_id)`,
  FAIL_STALE: `UPDATE firms_attempts SET finished_at = ?2, outcome = 'fenced-failure', note = ?3 WHERE token = ?1 AND finished_at IS NULL`,
  PUBLISH_CLAIM: `UPDATE firms_outputs SET publish_attempts = publish_attempts + 1
  WHERE run_id = ?1 AND publish_state = 'pending' AND publish_attempts < 3`,
  PUBLISHED: `UPDATE firms_outputs SET latest_at = COALESCE(latest_at, ?2), cells_at = ?3,
  publish_state = CASE WHEN ?3 IS NOT NULL THEN 'published' ELSE publish_state END WHERE run_id = ?1`,
  SWEEP_INPUTS_SUPERSEDED: `UPDATE firms_inputs SET state = 'superseded' WHERE state = 'ready' AND attempts_used < 3 AND retrieved_at < ?1`,
  SWEEP_INPUTS_EXPIRED: `UPDATE firms_inputs SET state = 'expired' WHERE state = 'ready' AND attempts_used < 3 AND retrieved_at < ?1`,
  SWEEP_OUTPUTS_SUPERSEDED: `UPDATE firms_outputs SET publish_state = 'superseded' WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at < ?1`,
  SWEEP_OUTPUTS_EXPIRED: `UPDATE firms_outputs SET publish_state = 'expired' WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at < ?1`,
  FIND_UNPROCESSED: `SELECT i.run_id, i.retrieved_at FROM firms_inputs i
  WHERE i.state = 'ready' AND i.attempts_used < 3 AND i.retrieved_at > ?1
  ORDER BY i.retrieved_at DESC LIMIT 1`,
  FIND_UNPUBLISHED: `SELECT run_id, retrieved_at FROM firms_outputs
  WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at >= ?1 ORDER BY retrieved_at DESC LIMIT 1`,
  CHECKPOINT_INPUT: `SELECT run_id, snapshot_key, aux_key, retrieved_at FROM firms_outputs WHERE day = ?1 ORDER BY retrieved_at DESC, run_id DESC LIMIT 1`,
  IDENTITY: `INSERT OR IGNORE INTO firms_identity (retrieved_at, run_id, kind, actual_at) VALUES (?1, ?2, ?3, ?4)`,
  CUTOVER: `INSERT OR IGNORE INTO firms_settings (key, value) VALUES ('format_cutover_at', ?1)`,
  INPUT: `INSERT INTO firms_inputs (run_id, raw_key, scheduled_at, retrieved_at, bytes, sha256, content_length, created_at, collector_version)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
};
const fvRand = () => [...crypto.getRandomValues(new Uint8Array(6))].map(b => b.toString(16).padStart(2, '0')).join('');
const fvBody = o => (o && o.body && typeof o.body.getReader === 'function') ? o.body : new Blob([o && o.body !== undefined ? o.body : '']).stream();
/** Incremental SHA-256: crypto.DigestStream on Workers; a small pure-JS fallback elsewhere (tests in Node). */
function fvHasher() {
  if (typeof crypto !== 'undefined' && typeof crypto.DigestStream === 'function') {
    const ds = new crypto.DigestStream('SHA-256'), w = ds.getWriter();
    return { async update(u8) { await w.write(u8); }, async hex() { await w.close(); return [...new Uint8Array(await ds.digest)].map(b => b.toString(16).padStart(2, '0')).join(''); } };
  }
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), W = new Uint32Array(64), buf = new Uint8Array(64); let bl = 0, len = 0;
  const block = b => { for (let i = 0; i < 16; i++) W[i] = (b[i*4] << 24) | (b[i*4+1] << 16) | (b[i*4+2] << 8) | b[i*4+3];
    for (let i = 16; i < 64; i++) { const x = W[i-15], y = W[i-2]; W[i] = (((x>>>7)|(x<<25)) ^ ((x>>>18)|(x<<14)) ^ (x>>>3)) + W[i-16] + (((y>>>17)|(y<<15)) ^ ((y>>>19)|(y<<13)) ^ (y>>>10)) + W[i-7]; }
    let [a, b2, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) { const t1 = h + (((e>>>6)|(e<<26)) ^ ((e>>>11)|(e<<21)) ^ ((e>>>25)|(e<<7))) + ((e & f) ^ (~e & g)) + K[i] + W[i] | 0;
      const t2 = (((a>>>2)|(a<<30)) ^ ((a>>>13)|(a<<19)) ^ ((a>>>22)|(a<<10))) + ((a & b2) ^ (a & c) ^ (b2 & c)) | 0; h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b2; b2 = a; a = t1 + t2 | 0; }
    H[0] += a; H[1] += b2; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h; };
  return { async update(u8) { len += u8.length; let i = 0; while (i < u8.length) { const n = Math.min(64 - bl, u8.length - i); buf.set(u8.subarray(i, i + n), bl); bl += n; i += n; if (bl === 64) { block(buf); bl = 0; } } },
    async hex() { const bits = len * 8; buf[bl++] = 0x80; if (bl > 56) { buf.fill(0, bl); block(buf); bl = 0; } buf.fill(0, bl, 56);
      const hi = Math.floor(bits / 2 ** 32), lo = bits >>> 0; buf[56] = hi >>> 24; buf[57] = hi >>> 16; buf[58] = hi >>> 8; buf[59] = hi; buf[60] = lo >>> 24; buf[61] = lo >>> 16; buf[62] = lo >>> 8; buf[63] = lo; block(buf);
      return [...H].map(x => (x >>> 0).toString(16).padStart(8, '0')).join(''); } };
}
/** Write bytes to `key` holding at most ONE part (5 MiB) in memory. Ends within the first part → one put; else multipart, aborted on error. */
function fvWriter(env, key, putOpts = {}) {
  let buf = new Uint8Array(FV.part), n = 0, mpu = null, parts = [], bytes = 0, full = false, open = false; const h = fvHasher();   // open: a multipart upload neither completed nor aborted
  const flush = async () => { if (!mpu) { mpu = await env.R2.createMultipartUpload(key, putOpts); open = true; } parts.push(await mpu.uploadPart(parts.length + 1, buf.slice(0, n))); n = 0; full = false; };

  const abort = async () => { buf = null; if (mpu && open) { open = false; try { await mpu.abort(); } catch (_) {} } };
  const guard = async fn => { try { return await fn(); } catch (e) { await abort(); throw e; } };   // rev-6 build fix (GPT G5): never leave an upload open
  return {
    async write(u8) { return guard(async () => {
      await h.update(u8); bytes += u8.length; let i = 0;
      while (i < u8.length) { if (full) await flush(); const k = Math.min(FV.part - n, u8.length - i); buf.set(u8.subarray(i, i + k), n); n += k; i += k; if (n === FV.part) full = true; }
    }); },
    async close() { return guard(async () => {
      const sha256 = await h.hex();
      if (!mpu) { await env.R2.put(key, buf.slice(0, n), putOpts); buf = null; return { bytes, sha256, multipart: false }; }
      parts.push(await mpu.uploadPart(parts.length + 1, buf.slice(0, n))); buf = null; await mpu.complete(parts); open = false; return { bytes, sha256, multipart: true, parts: parts.length };
    }); },
    abort,
    get uploadOpen() { return open; },
  };
}
/** A text sink over fvWriter that batches small strings into ~64 KiB encodes (bounded). */
function fvTextSink(w) {
  const enc = new TextEncoder(); let pend = [], pl = 0;
  const out = async () => { if (pl) { const s = pend.join(''); pend = []; pl = 0; await w.write(enc.encode(s)); } };
  return { async line(s) { if (s.length + 1 > FV.maxLine) throw new Error(`line too long for lines/1 (${s.length} chars > ${FV.maxLine - 1})`); pend.push(s, '\n'); pl += s.length + 1; if (pl >= 65536) await out(); }, flush: out };
}
/** Lines of a byte stream, each ≤ FV.maxLine, carry bounded; throws on a longer line. */
async function* fvLines(stream) {
  const rd = stream.pipeThrough(new TextDecoderStream()).getReader(); let carry = '';
  for (;;) { const { value, done } = await rd.read(); if (done) break;
    let s = carry + value, p = 0, q;
    while ((q = s.indexOf('\n', p)) >= 0) { const ln = s.slice(p, q); if (ln.length > FV.maxLine) throw new Error(`line longer than ${FV.maxLine} chars`); yield ln; p = q + 1; }
    carry = s.slice(p); if (carry.length > FV.maxLine) throw new Error(`line longer than ${FV.maxLine} chars`); }
  if (carry) yield carry;
}
// ---- ordering (§5)
function fvOrder(head, me) {
  if (!head) return 'absent';
  const md = head.customMetadata || {};
  if (!md.run_id) return new Date(head.uploaded).getTime() < Date.parse(me.retrieved_at) ? 'older' : 'uncertain';
  if (md.run_id !== me.run_id) return md.retrieved_at > me.retrieved_at ? 'newer' : 'older';
  if (md.status === me.status) return me.status === 'ok' && md.token !== me.token ? 'mismatch' : 'ours';
  return md.status === 'down' && me.status === 'ok' ? 'older' : 'newer';
}
async function fvCas(env, key, makeBody, me, contentType = 'application/json') {
  for (let round = 0; round < 3; round++) {
    const h = await env.R2.head(key), o = fvOrder(h, me);
    if (o === 'ours') return 'ours';
    if (o === 'newer' || o === 'uncertain' || o === 'mismatch') return o;
    if (o === 'absent' && env.FIRMS_CREATE_ONLY !== 'verified') return 'refused-absent';   // §5: create-only only once verified on production R2
    const meta = { run_id: me.run_id, retrieved_at: me.retrieved_at, status: me.status, token: me.token || '', format: me.format || 'cells' };
    const res = await env.R2.put(key, await makeBody(), { onlyIf: o === 'absent' ? { etagDoesNotMatch: '*' } : { etagMatches: h.etag }, customMetadata: meta, httpMetadata: { contentType } });
    if (res) return 'written';
  }
  return 'contended';
}
// ---- envelope pieces (same fields as collectFirms; lines/1 order: header → record_fields → records → cells → by_hour)
const FV_COVERAGE = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
function fvHeader(scheduledMs, retrievedAt, rawKey, rawBytes, scope, runId) {
  const dayStart = new Date(scheduledMs); dayStart.setUTCHours(0, 0, 0, 0);
  return { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer: 'firms', window_start: dayStart.toISOString(), window_end: retrievedAt, retrieved_at: retrievedAt,
    scheduled_for: new Date(scheduledMs).toISOString(), source_status: 'ok', interruptions: [], stale_after_s: STALE_AFTER_S.firms, record_format: 'rows',
    raw: rawKey, raw_bytes: rawBytes, scope, coverage_default: FV_COVERAGE,
    window_rule: 'today (UTC) so far: FIRMS day_range=1 returns the current UTC date only; resets at 00:00 UTC; NRT processing lands ~2–3 h after the pass',
    quantity: 'VIIRS NOAA-20 NRT thermal detections so far today (UTC), per cell (detections per pass, not a fire census)', run_id: runId, format: 'lines/1' };
}
// ---- step A + registration
async function fvFetchToRaw(env, scheduledMs) {
  const region = (env.FIRMS_REGION || '').trim() || null;
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(new Error(`download timed out after ${FV.fetchMs / 1000} s`)), FV.fetchMs);
  try { return await fvFetchBody(env, scheduledMs, region, ac.signal); } finally { clearTimeout(timer); }
}
async function fvFetchBody(env, scheduledMs, region, signal) {
  let r; try { r = await fetch(URLS.firms(env.FIRMS_MAP_KEY, region), { headers: { 'User-Agent': UA }, signal }); } catch (e) { return { down: 'fetch failed: ' + e, http: 0 }; }
  if (!r.ok) { const t = (await r.text()).slice(0, 100); return { down: 'http ' + r.status + ' ' + t, http: r.status }; }
  const runId = isoMinute(scheduledMs) + '-' + Date.now() + '-' + fvRand(), rawKey = `raw/firms/${runId}.csv`;
  const w = fvWriter(env, rawKey, { httpMetadata: { contentType: 'text/csv' } }); const rd = r.body.getReader(); let first = null;
  try { for (;;) { const { value, done } = await rd.read(); if (done) break; if (!first) first = new TextDecoder().decode(value.subarray(0, 32)); await w.write(value); } }
  catch (e) { await w.abort(); return { down: 'fetch failed: ' + e, http: r.status }; }
  if (first && (first.startsWith('Invalid') || first.startsWith('<'))) { await w.abort(); return { down: 'http ' + r.status + ' ' + first.slice(0, 100), http: r.status }; }
  const res = await w.close(); const retrievedAt = nowIso();
  const head = await env.R2.head(rawKey); if (!head || head.size !== res.bytes) return { down: 'raw upload size mismatch', http: r.status };
  const cl = Number(r.headers.get('content-length')); const contentLength = Number.isFinite(cl) && cl > 0 ? cl : null;
  if (contentLength !== null && contentLength !== res.bytes) return { down: `truncated response: ${res.bytes} bytes of Content-Length ${contentLength}`, http: r.status, rawKey };
  return { runId, rawKey, retrievedAt, bytes: res.bytes, sha256: res.sha256, contentLength, http: r.status, scope: region ? 'region ' + region : 'world' };
}
async function fvRegister(env, scheduledMs, a) {
  try { await env.DB.batch([
    env.DB.prepare(FVSQL.CUTOVER).bind(a.retrievedAt),
    env.DB.prepare(FVSQL.IDENTITY).bind(a.retrievedAt, a.runId, 'input', a.retrievedAt),
    env.DB.prepare(FVSQL.INPUT).bind(a.runId, a.rawKey, new Date(scheduledMs).toISOString(), a.retrievedAt, a.bytes, a.sha256, a.contentLength, nowIso(), COLLECTOR_VERSION),
  ]);
  // IDENTITY is INSERT OR IGNORE (shared with down runs): confirm the identity row is OURS — a collision must abandon, never re-stamp
  const own = await env.DB.prepare('SELECT run_id FROM firms_identity WHERE retrieved_at = ?').bind(a.retrievedAt).first();
  if (!own || own.run_id !== a.runId) return 'identity taken by ' + (own ? own.run_id : 'nothing');
  return true; } catch (e) { return String(e); }   // INPUT's FK / UNIQUE fails on a collision → the whole batch rolls back
}
// ---- step B: raw → lines/1 snapshot + sidecar (per-attempt immutable keys) → commit fence
async function fvProcess(env, runId, token, attempt, scope) {
  const inp = await env.DB.prepare('SELECT raw_key, retrieved_at, scheduled_at, bytes FROM firms_inputs WHERE run_id = ?').bind(runId).first();
  const scheduledMs = Date.parse(inp.scheduled_at);
  const raw = await env.R2.get(inp.raw_key); if (!raw) throw new Error('raw input expired: ' + inp.raw_key);
  const snapKey = `snapshots/firms/${runId}-a${attempt}-${token}.json`, auxKey = `snapshots/firms-aux/${runId}-a${attempt}-${token}.json`;
  const meta = { run_id: runId, retrieved_at: inp.retrieved_at, token, format: 'lines/1' };
  const w = fvWriter(env, snapKey, { httpMetadata: { contentType: 'application/json' }, customMetadata: meta }); const out = fvTextSink(w);
  const cells = {}, byHour = {}, agg = {}; let records = 0, lastObs = null, header = null, nCols = 0, ix = null, lineNo = 0;
  try {
    const hdr = fvHeader(scheduledMs, inp.retrieved_at, inp.raw_key, inp.bytes, scope, runId);
    await out.line('{'); for (const [k, v] of Object.entries(hdr)) await out.line(JSON.stringify(k) + ':' + JSON.stringify(v) + ',');
    await out.line('"record_fields":' + JSON.stringify(['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight']) + ',');
    await out.line('"records":[');
    let prev = null;
    for await (const line of fvLines(fvBody(raw))) {
      lineNo++;
      if (!header) { header = line.trim().split(','); nCols = header.length; const f = n => header.indexOf(n);
        ix = { lat: f('latitude'), lng: f('longitude'), date: f('acq_date'), time: f('acq_time'), conf: f('confidence'), frp: f('frp'), sat: f('satellite'), dn: f('daynight') };
        if (ix.lat < 0 || ix.lng < 0 || ix.date < 0 || ix.time < 0) throw new Error('unexpected FIRMS header: ' + header.join(','));
        continue; }
      if (!line) continue;
      const c = line.split(',');
      if (c.length !== nCols) throw new Error(`truncated or malformed response: line ${lineNo} has ${c.length} fields, header has ${nCols}`);
      const bad = firmsRowProblem(c, ix.lat, ix.lng, ix.date, ix.time, ix.conf, ix.frp, ix.sat, ix.dn); if (bad) throw new Error(`truncated or malformed response: line ${lineNo} ${bad}`);
      const lat = +c[ix.lat], lng = +c[ix.lng]; if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const t = c[ix.time].padStart(4, '0'), obs = c[ix.date] + 'T' + t.slice(0, 2) + ':' + t.slice(2) + ':00Z';
      const fv = ix.frp < 0 || c[ix.frp] === undefined || c[ix.frp].trim() === '' ? null : +c[ix.frp];
      const row = [lat, lng, obs, c[ix.conf], Number.isFinite(fv) ? fv : null, c[ix.sat], c[ix.dn]];
      if (prev !== null) await out.line(prev + ','); prev = JSON.stringify(row); records++;
      const id = cellId(lat, lng); (cells[id] || (cells[id] = { count: 0 })).count++;
      const hb = byHour[obs.slice(0, 13)] || (byHour[obs.slice(0, 13)] = {}); hb[id] = (hb[id] || 0) + 1;
      const g = agg[id] || (agg[id] = { n: 0, frpSum: null, frpMax: null, frpN: 0, day: 0, night: 0 }); g.n++;
      if (typeof row[4] === 'number') { g.frpSum = (g.frpSum ?? 0) + row[4]; g.frpN++; g.frpMax = g.frpMax === null ? row[4] : Math.max(g.frpMax, row[4]); }
      if (row[6] === 'D') g.day++; else if (row[6] === 'N') g.night++;
      if (!lastObs || obs > lastObs) lastObs = obs;
    }
    if (!header) throw new Error('empty response (no header)');
    if (prev !== null) await out.line(prev);
    await out.line('],');
    for (const id in cells) cells[id].coverage = FV_COVERAGE;
    const cellIds = Object.keys(cells); await out.line('"cells":{');
    for (let k = 0; k < cellIds.length; k++) await out.line(JSON.stringify(cellIds[k]) + ':' + JSON.stringify(cells[cellIds[k]]) + (k < cellIds.length - 1 ? ',' : ''));
    await out.line('},'); const hours = Object.keys(byHour); await out.line('"by_hour":{');
    for (let k = 0; k < hours.length; k++) { await out.line(JSON.stringify(hours[k]) + ':{'); const ids = Object.keys(byHour[hours[k]]);
      for (let m = 0; m < ids.length; m++) await out.line(JSON.stringify(ids[m]) + ':' + byHour[hours[k]][ids[m]] + (m < ids.length - 1 ? ',' : ''));
      await out.line('}' + (k < hours.length - 1 ? ',' : '')); }
    await out.line('}'); await out.line('}'); await out.flush();
  } catch (e) { await w.abort(); throw e; }
  if (records === 0) { await w.abort(); return { empty: true }; }
  const s = await w.close();
  const aux = JSON.stringify({ run_id: runId, token, attempt, retrieved_at: inp.retrieved_at, records, last_observation_at: lastObs, by_cell: agg, cells, by_hour: byHour, scheduled_for: new Date(scheduledMs).toISOString(), raw: inp.raw_key, raw_bytes: inp.bytes, scope });
  await env.R2.put(auxKey, aux, { httpMetadata: { contentType: 'application/json' }, customMetadata: meta });
  const hs = await env.R2.head(snapKey), ha = await env.R2.head(auxKey);
  if (!hs || hs.size !== s.bytes || !ha) throw new Error('snapshot/sidecar size check failed');
  const r = await env.DB.batch([env.DB.prepare(FVSQL.COMMIT).bind(token, snapKey, s.bytes, s.sha256, records, auxKey, ha.size, nowIso()), env.DB.prepare(FVSQL.COMMIT_DONE).bind(token)]);
  const committed = r[0] && r[0].meta && r[0].meta.changes === 1;
  await env.DB.prepare("UPDATE firms_attempts SET finished_at = ?, outcome = ? WHERE token = ? AND finished_at IS NULL").bind(nowIso(), committed ? 'committed' : 'fenced', token).run();
  return { committed, records, snapKey, bytes: s.bytes };
}
// ---- step C: publication (§5)
function fvCellsEnvelope(aux, status, extra = {}) {
  return { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer: 'firms', window_start: aux.window_start || null, window_end: aux.retrieved_at, retrieved_at: aux.retrieved_at,
    scheduled_for: aux.scheduled_for, source_status: status, interruptions: [], stale_after_s: STALE_AFTER_S.firms, cells: aux.cells || {}, by_hour: aux.by_hour,
    raw: aux.raw, raw_bytes: aux.raw_bytes, scope: aux.scope, coverage_default: FV_COVERAGE, run_id: aux.run_id, ...extra };
}
async function fvPublish(env, runId) {
  const out = await env.DB.prepare('SELECT * FROM firms_outputs WHERE run_id = ?').bind(runId).first(); if (!out) return 'no-output';
  const c = await env.DB.prepare(FVSQL.PUBLISH_CLAIM).bind(runId).run(); if (!c.meta || c.meta.changes !== 1) return 'publish-bound';
  const me = { run_id: runId, retrieved_at: out.retrieved_at, status: 'ok', token: out.token, format: 'lines/1' };
  try { await fvSnapshotCheck(env, out); } catch (e) { await logRun(env, 'firms:recovery', Date.now(), 'down', 0, 0, 0, String(e).slice(0, 300)); return 'stop:snapshot-mismatch'; }
  const aux = await fvAuxFor(env, out, 'publication');   // validated against the commit, or rebuilt from the committed snapshot — BEFORE anything is published
  const r1 = await fvCas(env, FV.latest, async () => fvBody(await env.R2.get(out.snapshot_key)), me);
  if (r1 === 'newer') { await env.DB.prepare("UPDATE firms_outputs SET publish_state = 'superseded' WHERE run_id = ? AND publish_state = 'pending'").bind(runId).run(); return 'stop:newer'; }
  if (r1 !== 'written' && r1 !== 'ours') return 'stop:' + r1;
  await env.DB.prepare(FVSQL.PUBLISHED).bind(runId, nowIso(), null).run();
  const dayStart = new Date(aux.scheduled_for); dayStart.setUTCHours(0, 0, 0, 0); aux.window_start = dayStart.toISOString();
  const cellsEnv = fvCellsEnvelope(aux, 'ok', { quantity: 'VIIRS NOAA-20 NRT thermal detections so far today (UTC), per cell (detections per pass, not a fire census)', window_rule: 'today (UTC) so far: FIRMS day_range=1 returns the current UTC date only; resets at 00:00 UTC; NRT processing lands ~2–3 h after the pass' });
  const r2 = await fvCas(env, FV.cells, async () => JSON.stringify(cellsEnv), { ...me, format: 'cells' });
  if (r2 !== 'written' && r2 !== 'ours') return 'cells:' + r2;
  await putJson(env, `cells/firms/${runId}.json`, cellsEnv);   // per-run archive, as today (cells/ 2-day rule)
  await env.DB.prepare(FVSQL.PUBLISHED).bind(runId, nowIso(), nowIso()).run();
  return r1 === 'ours' && r2 === 'ours' ? 'reconciled-only' : 'published';
}
// ---- down files: input failures (§2.6, fenced, input identity) and no-input runs (§2.5, own identity, +1 ms ≤ 3)
async function fvDownForInput(env, runId, token, note) {
  const fenced = await env.DB.prepare(FVSQL.FAIL_FENCE).bind(token, nowIso(), note.slice(0, 300)).run();
  if (!fenced.meta || fenced.meta.changes !== 1) { await env.DB.prepare(FVSQL.FAIL_STALE).bind(token, nowIso(), note.slice(0, 300)).run(); return 'fenced: no public down'; }
  const inp = await env.DB.prepare('SELECT retrieved_at FROM firms_inputs WHERE run_id = ?').bind(runId).first();
  const env2 = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer: 'firms', window_start: null, window_end: null, retrieved_at: inp.retrieved_at, failed_at: nowIso(),
    scheduled_for: null, source_status: 'down', interruptions: [], stale_after_s: STALE_AFTER_S.firms, cells: {}, note, run_id: runId };
  return 'down:' + await fvCas(env, FV.cells, async () => JSON.stringify(env2), { run_id: runId, retrieved_at: inp.retrieved_at, status: 'down', token });
}
async function fvDownNoInput(env, scheduledMs, note) {
  const actual = nowIso(), runId = 'down-' + isoMinute(scheduledMs) + '-' + fvRand(); let stamp = null;
  for (let k = 0, t = Date.parse(actual); k < FV.downStampTries; k++, t++) {
    const r = await env.DB.prepare(FVSQL.IDENTITY).bind(new Date(t).toISOString(), runId, 'down', actual).run();
    if (r.meta && r.meta.changes === 1) { stamp = new Date(t).toISOString(); break; } }
  if (!stamp) return 'identity refused';
  const env2 = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer: 'firms', window_start: null, window_end: null, retrieved_at: stamp, failed_at: actual,
    scheduled_for: new Date(scheduledMs).toISOString(), source_status: 'down', interruptions: [], stale_after_s: STALE_AFTER_S.firms, cells: {}, note, run_id: runId };
  return 'down:' + await fvCas(env, FV.cells, async () => JSON.stringify(env2), { run_id: runId, retrieved_at: stamp, status: 'down' });
}
async function fvCurrent(env) {
  const h = await env.R2.head(FV.latest); if (!h) return '1970-01-01T00:00:00.000Z';
  return (h.customMetadata && h.customMetadata.retrieved_at) || new Date(h.uploaded).toISOString();
}
/** Claim and process one input; publish if committed; failure path fenced. Returns a short result string. */
async function fvWork(env, runId, scope) {
  const token = fvRand() + fvRand(), now = Date.now();
  const cl = await env.DB.batch([env.DB.prepare(FVSQL.CLAIM).bind(runId, token, 'firms@' + nowIso(), new Date(now).toISOString(), new Date(now + FV.leaseMs).toISOString()), env.DB.prepare(FVSQL.CLAIM_COUNT).bind(runId, token)]);
  if (!cl[0] || !cl[0].meta || cl[0].meta.changes !== 1) return { r: 'claim lost' };
  const at = await env.DB.prepare('SELECT attempt FROM firms_attempts WHERE token = ?').bind(token).first();
  let p;
  try { p = await fvProcess(env, runId, token, at.attempt, scope); }
  catch (e) { const why = String(e).slice(0, 300); return { r: await fvDownForInput(env, runId, token, why), failed: why }; }
  if (p.empty) { const why = new Date().getUTCHours() < FIRMS_DAY_BOUNDARY_H ? `${FV.boundary} (UTC): FIRMS day_range=1 resets at 00:00 UTC and NRT runs ~2–3 h behind (header only)` : `empty response (header only) at ${new Date().getUTCHours()}:xx UTC: not a validated zero`;
    const r = await fvDownForInput(env, runId, token, why); return { r, failed: why, empty: true }; }
  if (!p.committed) return { r: 'fenced' };
  // a publication error leaves the output pending for discovery's repair (§6); it is never reported as a down counts file
  try { return { r: await fvPublish(env, runId), records: p.records, bytes: p.bytes }; } catch (e) { return { r: 'publication error (pending repair): ' + String(e).slice(0, 160) }; }
}
/** The FIRMS job (v2): sweeps → one piece of unfinished work → fetch → register → process → publish. Logs collector_runs as before. */
async function collectFirmsV2(env, scheduledMs) {
  const t = await collectFirmsV2Run(env, scheduledMs);
  return t + '; ' + await hist(env, 'firms-checkpoint', () => histCheckpointsDue(env, 'firms', Date.now()));
}
async function collectFirmsV2Run(env, scheduledMs) {
  const layer = 'firms', trace = [];
  const cur = await fvCurrent(env), exp = new Date(Date.now() - FV.expireMs).toISOString();
  await env.DB.batch([env.DB.prepare(FVSQL.SWEEP_INPUTS_EXPIRED).bind(exp), env.DB.prepare(FVSQL.SWEEP_OUTPUTS_EXPIRED).bind(exp), env.DB.prepare(FVSQL.SWEEP_INPUTS_SUPERSEDED).bind(cur), env.DB.prepare(FVSQL.SWEEP_OUTPUTS_SUPERSEDED).bind(cur)]);
  const pub = await env.DB.prepare(FVSQL.FIND_UNPUBLISHED).bind(cur).first();
  if (pub) { let r; try { r = await fvPublish(env, pub.run_id); } catch (e) { r = 'publication error (pending repair): ' + String(e).slice(0, 160); } trace.push('repair ' + pub.run_id + ': ' + r);
    if (r === 'published' || r === 'reconciled-only') { const o = await env.DB.prepare('SELECT records, snapshot_bytes FROM firms_outputs WHERE run_id = ?').bind(pub.run_id).first(); await logRun(env, layer, scheduledMs, 'ok', 200, o.records, o.snapshot_bytes, `repair run=${pub.run_id}`); }
    else await logRun(env, 'firms:recovery', scheduledMs, 'down', 0, 0, 0, `repair run=${pub.run_id} ${r}`); }
  else { const inp = await env.DB.prepare(FVSQL.FIND_UNPROCESSED).bind(cur).first();
    if (inp && await env.R2.head((await env.DB.prepare('SELECT raw_key FROM firms_inputs WHERE run_id = ?').bind(inp.run_id).first()).raw_key)) {
      const w = await fvWork(env, inp.run_id, (env.FIRMS_REGION || '').trim() ? 'region ' + env.FIRMS_REGION.trim() : 'world'); trace.push('retry ' + inp.run_id + ': ' + w.r);
      if (w.r === 'published' || w.r === 'reconciled-only') await logRun(env, layer, scheduledMs, 'ok', 200, w.records, w.bytes, `retry run=${inp.run_id}`);
      else await logRun(env, 'firms:recovery', scheduledMs, 'down', 0, 0, 0, `retry run=${inp.run_id} ${w.failed || w.r}`); } }
  // the run's own fetch
  if (!env.FIRMS_MAP_KEY) { await logRun(env, layer, scheduledMs, 'down', 0, 0, 0, 'no FIRMS key set'); trace.push(await fvDownNoInput(env, scheduledMs, 'no FIRMS key set')); return trace.join('; '); }
  const a = await fvFetchToRaw(env, scheduledMs);
  if (a.down) { await logRun(env, layer, scheduledMs, 'down', a.http || 0, 0, 0, a.down); trace.push(await fvDownNoInput(env, scheduledMs, a.down)); return trace.join('; '); }
  if (a.bytes > FIRMS_MAX_PARSE_BYTES) { const why = `raw archived; processing skipped: resource guard (${a.bytes} bytes > ${FIRMS_MAX_PARSE_BYTES})`;
    await logRun(env, layer, scheduledMs, 'down', a.http, 0, 0, why); trace.push(await fvDownNoInput(env, scheduledMs, why)); return trace.join('; '); }
  const reg = await fvRegister(env, scheduledMs, a);
  if (reg !== true) { await logRun(env, layer, scheduledMs, 'down', a.http, 0, 0, 'identity collision: ' + String(reg).slice(0, 120)); trace.push('identity refused'); return trace.join('; '); }
  const w = await fvWork(env, a.runId, a.scope); trace.push('run ' + a.runId + ': ' + w.r);
  if (w.failed) await logRun(env, layer, scheduledMs, 'down', a.http, 0, 0, w.failed);
  else if (w.r === 'published' || w.r === 'reconciled-only') await logRun(env, layer, scheduledMs, 'ok', a.http, w.records, w.bytes, 'raw_bytes=' + a.bytes + ' run=' + a.runId);
  else await logRun(env, layer, scheduledMs, 'down', a.http, 0, 0, 'publication ' + w.r + ' run=' + a.runId);
  return trace.join('; ');
}
// ---- step D: checkpoint input selection for firms (§7, §9) and the streaming new-format checkpoint
/* Checkpoint input (design §7, §9; build fixes after GPT's production review, G1/G2):
 *  - Unreadable state is an ERROR, never "nothing there": a failed D1 read propagates, so hist() logs the failure and the day stays
 *    due (no gap, no marker) until a later run reads it. The one tolerated case: the firms_* tables do not exist while v2 is off
 *    (then no committed output can exist).
 *  - Legacy eligibility = legacy key format + its retrieval time; the format cutover is NOT a filter any more. A legacy object
 *    written after the cutover is a complete legacy publication (rollback: FIRMS_PIPELINE unset; or an old isolate across the
 *    deploy), and the day's input is the latest publication of either kind. format_cutover_at is still written (audit). */
/** Has v2 ever been active here? Until it has, the checkpoint/backfill run EXACTLY the legacy code (deploying 0.6.0 with v2 off changes
 * nothing about the daily archive). After it has — including after a rollback — the v2 selection is used, so mixed days are right.
 * Unreadable state is an error (defer), except a missing table (schema not applied → v2 cannot have run). */
async function fvEverRan(env) {
  if (env.FIRMS_PIPELINE === 'v2') return true;
  try { return !!(await env.DB.prepare("SELECT value FROM firms_settings WHERE key = 'format_cutover_at'").first()); }
  catch (e) { if (/no such table/i.test(String(e))) return false; throw new Error('v2 state read failed; checkpoint deferred: ' + String(e).slice(0, 160)); }
}
async function fvCheckpointCandidate(env, day, legacySnaps) {
  let newer = null;
  try { newer = await env.DB.prepare(FVSQL.CHECKPOINT_INPUT).bind(day).first(); }
  catch (e) { if (!(env.FIRMS_PIPELINE !== 'v2' && /no such table/i.test(String(e)))) throw new Error('committed-output read failed; checkpoint deferred: ' + String(e).slice(0, 160)); }
  const legacy = legacySnaps.filter(x => FV.legacyKey.test(x.key) && x.retrieved_at.slice(0, 10) === day)
    .sort((a, b) => a.retrieved_at < b.retrieved_at ? -1 : a.retrieved_at > b.retrieved_at ? 1 : a.key < b.key ? -1 : 1).pop() || null;
  if (newer && (!legacy || newer.retrieved_at > legacy.retrieved_at)) return { kind: 'new', out: newer };
  return legacy ? { kind: 'legacy', snap: legacy } : null;
}
async function fvCheckpointNew(env, day, sel) {
  const done = await env.DB.prepare("SELECT 1 AS x FROM archive_checkpoints WHERE layer = 'firms' AND day = ?").bind(day).first(); if (done) return 'already done';
  const out = await env.DB.prepare('SELECT * FROM firms_outputs WHERE run_id = ?').bind(sel.run_id).first();   // the full committed row (sizes, hash, token)
  if (!out) throw new Error('committed output vanished: ' + sel.run_id);
  await fvSnapshotCheck(env, out);
  const aux = await fvAuxFor(env, out, 'checkpoint');
  const key = `${HIST.checkpoints}firms/${day}.json.gz`, ref = runRef('firms', out.retrieved_at);
  const cov = await checkpointCoverage(env, 'firms', day, out.retrieved_at, null, null, Date.now(), true, aux.last_observation_at || null);
  const w = fvWriter(env, key, { httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' }, customMetadata: { cutoff: out.retrieved_at, run_ref: ref, collector_version: COLLECTOR_VERSION, source_key: out.snapshot_key,
    input_status: cov.input_status, failed_runs_after_cutoff: String(cov.failed_runs_after_cutoff), last_observation_at: String(cov.last_observation_at), input_age_at_day_end_s: String(cov.input_age_at_day_end_s), format: 'lines/1' } });
  const hr = fvHashing();   // the snapshot bytes are hashed on the way through and must equal the committed hash
  try { const rd = fvBody(await env.R2.get(out.snapshot_key)).pipeThrough(hr.stream).pipeThrough(new CompressionStream('gzip')).getReader();
    for (;;) { const { value, done: d } = await rd.read(); if (d) break; await w.write(value); } }
  catch (e) { await w.abort(); throw e; }
  const g = await w.close();
  const got = await hr.result();
  if (got.bytes !== out.snapshot_bytes || got.sha256 !== out.snapshot_sha256) { try { await env.R2.delete(key); } catch (_) {} throw new Error(`snapshot ${out.snapshot_key} does not match its committed hash/size (${got.bytes} B); checkpoint refused`); }
  const stmts = Object.entries(aux.by_cell).map(([id, c]) => env.DB.prepare('INSERT OR IGNORE INTO fires_daily (cell_id, day, detections, frp_sum_mw, frp_max_mw, frp_n, day_n, night_n, cutoff, run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, day, c.n, c.frpSum === null ? null : Math.round(c.frpSum * 10) / 10, c.frpMax, c.frpN, c.day, c.night, out.retrieved_at, ref, COLLECTOR_VERSION));
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  await writeCoverage(env, cov);
  await env.DB.prepare('INSERT OR IGNORE INTO archive_checkpoints (layer, day, cutoff, r2_key, bytes, records, run_ref, collector_version, source_key) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind('firms', day, out.retrieved_at, key, g.bytes, out.records, ref, COLLECTOR_VERSION, out.snapshot_key).run();   // the COMMITTED count
  return aux.rebuilt ? 'done (sidecar rebuilt from the committed snapshot)' : 'done';
}
/** A passthrough stream that counts and hashes the bytes it carries (bounded: one chunk at a time). */
function fvHashing() {
  const h = fvHasher(); let bytes = 0;
  return { stream: new TransformStream({ async transform(c, ctl) { await h.update(c); bytes += c.length; ctl.enqueue(c); } }), result: async () => ({ bytes, sha256: await h.hex() }) };
}
/** The committed snapshot object must be the one the commit recorded: size and the attempt's own token/run in its metadata. */
async function fvSnapshotCheck(env, out) {
  const h = await env.R2.head(out.snapshot_key), md = (h && h.customMetadata) || {};
  if (!h || h.size !== out.snapshot_bytes || md.run_id !== out.run_id || md.token !== out.token || md.retrieved_at !== out.retrieved_at)
    throw new Error(`snapshot object for ${out.run_id} does not match the committed output (size ${h ? h.size : 'missing'} / token / run); refused`);
}
/** The sidecar is trusted only if it is THIS committed attempt's and internally consistent; otherwise it is rebuilt from the committed
 * snapshot (streamed, hash-checked). Nothing downstream ever uses an unvalidated sidecar. */
function fvAuxProblem(aux, out, size) {
  if (!aux) return 'missing';
  if (size !== out.aux_bytes) return `size ${size} ≠ committed ${out.aux_bytes}`;
  for (const k of ['run_id', 'token', 'attempt', 'retrieved_at', 'records']) if (aux[k] !== out[k]) return `${k} ${JSON.stringify(aux[k])} ≠ committed ${JSON.stringify(out[k])}`;
  const sum = o => Object.values(o || {}).reduce((a, v) => a + (typeof v === 'number' ? v : v && typeof v.n === 'number' ? v.n : v && typeof v.count === 'number' ? v.count : NaN), 0);
  if (sum(aux.by_cell) !== out.records) return 'by_cell does not sum to the committed records';
  if (sum(aux.cells) !== out.records) return 'cells do not sum to the committed records';
  if (Object.values(aux.by_hour || {}).reduce((a, h) => a + sum(h), 0) !== out.records) return 'by_hour does not sum to the committed records';
  return null;
}
async function fvAuxFor(env, out, purpose) {
  const o = await env.R2.get(out.aux_key); let aux = null; try { aux = o ? await o.json() : null; } catch (_) {}
  const why = fvAuxProblem(aux, out, o ? o.size : -1);
  if (!why) return aux;
  const rebuilt = await fvAuxFromSnapshot(env, out);
  await logRun(env, 'firms:recovery', Date.now(), 'ok', 0, out.records, 0, `${purpose}: sidecar of ${out.run_id} rejected (${why}); rebuilt from the committed snapshot`);
  return rebuilt;
}
/** Rebuild the sidecar from the committed lines/1 snapshot: same maps as step B, hash and size checked against the commit. */
async function fvAuxFromSnapshot(env, out) {
  const o = await env.R2.get(out.snapshot_key); if (!o) throw new Error('committed snapshot missing: ' + out.snapshot_key);
  const hr = fvHashing(), hdr = {}; let fields = null, inRec = false, records = 0, lastObs = null; const agg = {}, cells = {}, byHour = {};
  for await (const line of fvLines(fvBody(o).pipeThrough(hr.stream))) {
    if (inRec === false) {
      if (line === '"records":[') { inRec = true; continue; }
      if (line.startsWith('"record_fields":')) { fields = JSON.parse(line.slice(16, -1)); continue; }
      const m = /^("[a-z_]+"):(.*),$/.exec(line); if (m) { try { hdr[JSON.parse(m[1])] = JSON.parse(m[2]); } catch (_) {} }
      continue;
    }
    if (line === '],') { inRec = null; continue; }   // past the records: keep reading (unparsed) so the hash covers every byte
    if (inRec === null) continue;
    const r = JSON.parse(line.endsWith(',') ? line.slice(0, -1) : line), f = n => fields.indexOf(n);
    const lat = r[f('lat')], lng = r[f('lng')], obs = r[f('observed_at')], frp = r[f('frp_mw')], dn = r[f('daynight')];
    const id = cellId(lat, lng); records++;
    (cells[id] || (cells[id] = { count: 0, coverage: FV_COVERAGE })).count++;
    const hb = byHour[obs.slice(0, 13)] || (byHour[obs.slice(0, 13)] = {}); hb[id] = (hb[id] || 0) + 1;
    const g = agg[id] || (agg[id] = { n: 0, frpSum: null, frpMax: null, frpN: 0, day: 0, night: 0 }); g.n++;
    if (typeof frp === 'number') { g.frpSum = (g.frpSum ?? 0) + frp; g.frpN++; g.frpMax = g.frpMax === null ? frp : Math.max(g.frpMax, frp); }
    if (dn === 'D') g.day++; else if (dn === 'N') g.night++;
    if (!lastObs || obs > lastObs) lastObs = obs;
  }
  const got = await hr.result();
  if (got.bytes !== out.snapshot_bytes || got.sha256 !== out.snapshot_sha256) throw new Error(`snapshot ${out.snapshot_key} does not match its committed hash/size; sidecar not rebuilt`);
  if (records !== out.records) throw new Error(`snapshot ${out.snapshot_key} holds ${records} records, the commit says ${out.records}; refused`);
  return { run_id: out.run_id, token: out.token, attempt: out.attempt, retrieved_at: out.retrieved_at, records, last_observation_at: lastObs, by_cell: agg, cells, by_hour: byHour,
    scheduled_for: hdr.scheduled_for, raw: hdr.raw, raw_bytes: hdr.raw_bytes, scope: hdr.scope, rebuilt: true };
}
/** Decompress an R2 object, counting bytes; null as soon as the output passes `limit` (nothing parsed). Handles an object a runtime
 * already served decoded (not gzip). */
async function fvBoundedGunzip(env, key, limit) {
  const o = await env.R2.get(key); if (!o) return null;
  const head = new Uint8Array(await (await env.R2.get(key, { range: { offset: 0, length: 2 } })).arrayBuffer());
  const gz = head[0] === 0x1f && head[1] === 0x8b;
  const rd = (gz ? fvBody(o).pipeThrough(new DecompressionStream('gzip')) : fvBody(o)).getReader(); const dec = new TextDecoder(); let n = 0, out = '';
  for (;;) { const { value, done } = await rd.read(); if (done) break; n += value.length; if (n > limit) { try { await rd.cancel(); } catch (_) {} return null; } out += dec.decode(value, { stream: true }); }
  return out + dec.decode();
}
/** Production check of the R2 semantics v2 depends on (design §5, §3), run once by hand before FIRMS_CREATE_ONLY=verified.
 * Uses fresh keys under probe/firms-v2/<random>/ only; every key written is deleted at the end (deletes and aborts are free). */
async function fvProbeR2(env) {
  const base = 'probe/firms-v2/' + fvRand() + '/', out = { base, at: nowIso() }, keys = [], uploads = [];   // uploads: every multipart this probe started
  const put = async (k, v, o) => { keys.push(base + k); const r = await env.R2.put(base + k, v, o); return r ? r.etag : null; };
  try {
    out.createAbsent = await put('a', 'one', { onlyIf: { etagDoesNotMatch: '*' } }) !== null;
    out.createPresent = await put('a', 'two', { onlyIf: { etagDoesNotMatch: '*' } }) === null;
    out.createKeptOriginal = (await (await env.R2.get(base + 'a')).text()) === 'one';
    const e1 = (await env.R2.head(base + 'a')).etag; await put('a', 'three');
    out.casStale = await put('a', 'four', { onlyIf: { etagMatches: e1 } }) === null;
    out.casCurrent = await put('a', 'five', { onlyIf: { etagMatches: (await env.R2.head(base + 'a')).etag } }) !== null;
    await put('src', new Uint8Array(FV.part + 7).fill(65));
    await put('copy', (await env.R2.get(base + 'src')).body); out.objectBodyCopy = (await env.R2.head(base + 'copy')).size === FV.part + 7;
    const w = fvWriter(env, base + 'mp', { customMetadata: { run_id: 'probe' } }); keys.push(base + 'mp'); uploads.push({ abort: () => w.abort(), isOpen: () => w.uploadOpen });
    await w.write(new Uint8Array(FV.part + 10).fill(66)); const r = await w.close();
    const hm = await env.R2.head(base + 'mp'); out.multipart = r.multipart === true && hm.size === FV.part + 10 && hm.customMetadata.run_id === 'probe';
    keys.push(base + 'ab'); const ab = await env.R2.createMultipartUpload(base + 'ab'); let abOpen = true; uploads.push({ abort: async () => { if (abOpen) { abOpen = false; await ab.abort(); } }, isOpen: () => abOpen });
    await ab.uploadPart(1, new Uint8Array(FV.part)); abOpen = false; await ab.abort(); out.abortLeavesNothing = (await env.R2.head(base + 'ab')) === null;
  } finally {
    // abort every upload still open (an empty object listing does NOT show open uploads), then delete every completed object
    for (const u of uploads) if (u.isOpen()) try { await u.abort(); } catch (_) {}
    out.uploads_open_after = uploads.filter(u => u.isOpen()).length;
    for (const k of [...new Set(keys)]) try { await env.R2.delete(k); } catch (_) {}
    out.cleaned = out.uploads_open_after === 0 && (await env.R2.list({ prefix: base })).objects.length === 0;
  }
  const must = ['createAbsent', 'createPresent', 'createKeptOriginal', 'casStale', 'casCurrent', 'objectBodyCopy', 'multipart', 'abortLeavesNothing', 'cleaned'];
  out.all_as_designed = must.every(k => out[k] === true); return out;
}
// ---- step E: /place firms section over a lines/1 latest/ (8 rows + count; byte-capped cache; scan cap)
const fvPlace = { scans: 0, cache: new Map(), bytes: 0 };
async function fvPlaceFirms(env, id, cellsEnv) {
  const h = await env.R2.head(FV.latest); if (!h) return null;
  const ck = h.etag + '|' + id, hit = fvPlace.cache.get(ck); if (hit) { fvPlace.cache.delete(ck); fvPlace.cache.set(ck, hit); return hit.v; }
  const t0 = Date.now(); while (fvPlace.scans >= FV.placeScans) { if (Date.now() - t0 > FV.placeWaitMs) return { busy: true }; await new Promise(r => setTimeout(r, 50)); }
  fvPlace.scans++;
  try {
    const o = await env.R2.get(FV.latest); if (!o || o.etag !== h.etag) return { changed: true };
    let fields = null, retrievedAt = null, runId = null, inRec = false, count = 0, iLat = 0, iLng = 1, iT = 2; const top = [];
    for await (const line of fvLines(fvBody(o))) {
      if (!inRec) {
        if (line.startsWith('"retrieved_at":')) retrievedAt = JSON.parse(line.slice(15, -1));
        else if (line.startsWith('"run_id":')) runId = JSON.parse(line.slice(9, -1));
        else if (line.startsWith('"record_fields":')) { fields = JSON.parse(line.slice(16, -1)); iLat = fields.indexOf('lat'); iLng = fields.indexOf('lng'); iT = fields.indexOf('observed_at'); }
        else if (line === '"records":[') inRec = true;
        continue; }
      if (line === '],') break;
      const r = JSON.parse(line.endsWith(',') ? line.slice(0, -1) : line);
      if (cellId(r[iLat], r[iLng]) !== id) continue;
      count++; const k = String(r[iT]);
      // keep the 8 newest; ties keep file order (= today's stable sort)
      let pos = top.length; while (pos > 0 && String(top[pos - 1][iT]) < k) pos--;
      if (pos < PLACE.listMax) { top.splice(pos, 0, r); if (top.length > PLACE.listMax) top.pop(); }
    }
    const v = { fields, retrieved_at: retrievedAt, run_id: runId, records: top, count };
    const sz = JSON.stringify(v).length; fvPlace.cache.set(ck, { v, sz }); fvPlace.bytes += sz;
    while (fvPlace.bytes > FV.placeCacheBytes && fvPlace.cache.size) { const [k0, e0] = fvPlace.cache.entries().next().value; fvPlace.cache.delete(k0); fvPlace.bytes -= e0.sz; }
    return v;
  } finally { fvPlace.scans--; }
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
  const statusReason = status === 'ok' ? null : { code: 'observation_older_than_limit', rule: 'our observation-age limit', reference: 'latest daily value date', limit_s: 7 * 86400, age_s: Math.round(ageS) };
  const weekStart = `${lw[0]}-${lw[1].padStart(2, '0')}-${lw[2].padStart(2, '0')}`;
  const num = x => (Number.isFinite(+x) && +x > 0 ? +x : null);
  const e = envelope(layer, scheduledMs, dRows[Math.max(0, dRows.length - 366)][0], last[0], status, {}, ['date', 'ppm'], dRows.slice(-366),
    { index: { name: 'CO2, Mauna Loa Observatory', value: last[1], unit: 'ppm', date: last[0], source_age_s: ageS, preliminary: true }, status_reason: statusReason,
      comparison: { basis: 'source-provided: NOAA GML weekly file, same week 1 year ago (365 days) and 10 years ago (3,653 days), week starting ' + weekStart,
        week_average: num(lw[4]), days_in_week: +lw[5], one_year_ago: num(lw[6]), ten_years_ago: num(lw[7]), increase_since_1800: num(lw[8]) },
      map_layer: false, source_notes: notes, citation: 'Lan, X., Tans, P. and Thoning, K.W.: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements. NOAA GML, gml.noaa.gov/ccgg/trends/',
      quantity: 'daily mean CO2 mole fraction (ppm) at Mauna Loa, Hawaii — one station, not a map layer; recent months preliminary' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  try { await env.DB.prepare('INSERT OR IGNORE INTO co2_daily (date, ppm, retrieved_at) VALUES (?,?,?)').bind(last[0], last[1], nowIso()).run(); } catch (err) { console.log('co2 insert', String(err)); }
  await hist(env, 'co2-version', () => histVersion(env, layer, e));
  await logRun(env, layer, scheduledMs, status, 200, dRows.length, bytes, `ppm=${last[1]} date=${last[0]} 1y=${lw[6]} 10y=${lw[7]}`);
}

// ---------------------------------------------------------------- NSIDC Sea Ice Index (G02135 v4) — index per hemisphere, not a map layer

/* Daily sea-ice extent (10^6 km²) for each hemisphere from NSIDC's NOAA mirror (open; no login), with NSIDC's own
*  1981–2010 climatology for the same day of year. Updated once a day (~14:20 UTC, measured 30 Oct 2026); collected at
*  03/09/15/21 UTC on the hourly job. Daily files are ~1.9 MB with 48 years of rows → tail-parsed. */
function doyOf(dateStr) { const d = Date.parse(dateStr + 'T00:00:00Z'); return Math.floor((d - Date.UTC(new Date(d).getUTCFullYear(), 0, 1)) / 86400e3) + 1; }

// NSIDC's required citation (2025 form, CITATION tab of nsidc.org/data/g02135/versions/4, read 4 Nov 2026; REGISTER).
// NSIDC's placeholders filled by us: the subset used, and the access date = the UTC date the files were actually fetched
// (MM-DD-YYYY, NSIDC's form). A failed run never rewrites latest/seaice.json, so a served older snapshot keeps its own date.
function nsidcCitation(ms) {
  const [y, m, d] = new Date(ms).toISOString().slice(0, 10).split('-');
  return 'Fetterer, F., Knowles, K., Meier, W. N., Savoie, M., Windnagel, A. K. & Stafford, T. (2025). Sea Ice Index. (G02135, Version 4). [Data Set]. Boulder, Colorado USA. National Snow and Ice Data Center. https://doi.org/10.7265/a98x-0f50. Daily sea-ice extent, Northern and Southern Hemispheres, and the 1981–2010 daily climatology. Date Accessed ' + `${m}-${d}-${y}.`;
}

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
  const fetchedMs = Date.now();   // after both hemispheres' fetches = the actual retrieval; same moment as the envelope's retrieved_at
  const n = out.north, s = out.south;
  const ageS = (Date.now() - Date.parse(n.date + 'T00:00:00Z')) / 1000;
  const status = ageS < 5 * 86400 ? 'ok' : 'degraded';                     // daily product with ~1 day latency; > 5 days behind is late
  const statusReason = status === 'ok' ? null : { code: 'observation_older_than_limit', rule: 'our observation-age limit', reference: 'latest daily value date (northern hemisphere)', limit_s: 5 * 86400, age_s: Math.round(ageS) };
  const recs = n.last_366.map((r, i) => [r[0], r[1], (s.last_366[i] || [])[1] ?? null]);
  delete n.last_366; delete s.last_366;
  const e = envelope(layer, scheduledMs, recs[0][0], n.date, status, {}, ['date', 'north_extent', 'south_extent'], recs,
    { index: { name: 'sea-ice extent, NSIDC Sea Ice Index v4', north: n, south: s, source_age_s: ageS }, status_reason: statusReason,
      comparison: { basis: 'source-provided baseline: NSIDC 1981–2010 daily climatology for the same day of year (average and percentiles). The subtraction (today minus average) is computed by this collector; the baseline is NSIDC\'s.' },
      map_layer: false, source_notes: notes,
      citation: nsidcCitation(fetchedMs),
      quantity: 'daily sea-ice extent per hemisphere, million km² (area of ocean with ≥15% ice concentration, passive microwave) — one number per hemisphere, not a map layer' });
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await hist(env, 'seaice-version', () => histVersion(env, layer, e)); await hist(env, 'seaice-daily', () => histSeaIce(env, e));
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
  const downs = files.filter(x => x.f.source_status === 'down').length;
  /* FOUR outcomes, kept apart on purpose — collapsing any pair of them loses something a later comparison needs:
   *   absent    nothing was received for the hour; nobody asked the source. The ONLY value that licenses
   *             reading the hour as never-asked, so nothing else may be written as 'absent'.
   *   down      every attempt that reached us reported the source itself as failed (writeDown also stores a
   *             cells file, so these DO appear in `files` — they must not be re-labelled 'degraded').
   *   degraded  attempts arrived but none were usable, or fewer were usable than expected.
   *   ok        at least `expected` usable samples.                                                            */
  const status = usable >= expected ? 'ok'
    : usable > 0 ? 'degraded'
    : received === 0 ? 'absent'
    : downs === received ? 'down'
    : 'degraded';
  const rejected = files.filter(x => x.f.source_status !== 'ok').map(x => ({ sample: x.key.slice(-22, -5), status: x.f.source_status, socket_connected_s: x.f.socket_connected_s ?? null, messages_flowing_s_inferred: x.f.messages_flowing_s ?? x.f.receiving_s ?? null, elapsed_wall_s: x.f.wall_s ?? null, overlong: x.f.overlong_sample ?? null }));
  await layerHourly(env, layer, hour, expected, usable, status, 'none', JSON.stringify({ rule: 'mean of per-sample unique vessels; sampled, not continuous', received, usable, down: downs, rejected, ...meta }).slice(0, 1500));
  const changed = ok.length ? await upsertChanged(env, layer, { [hour]: incoming }) : 0;
  return { files: received, ok: usable, status, rejected: rejected.length, cells: Object.keys(incoming).length, changed };
}

/* Late ships samples (found 3 Nov 2026, hour 2026-11-02T22): ingest files a sample under the hour it was SCHEDULED for, but a
 * sample suspended by host sleep can arrive after that hour's :07 batch. Nothing re-read the hour, so the sample was counted
 * nowhere and the hour said 'absent' (never asked) although it had been asked. Each batch therefore looks back over the
 * previous SHIPS_LOOKBACK_H hours and re-aggregates an hour ONLY when one of its cells files was uploaded after that hour's
 * layer_hourly row was last written (or the hour has no row). aggregateShips is idempotent, so a re-run writes the same
 * verdict the first run would have written had the file been there. Bounded: one R2 list + one D1 read per hour looked at.
 * A sample later than the lookback is repaired with /admin/reaggregate (R2 keeps cells/ for 48 h). */
const SHIPS_LOOKBACK_H = 6;
async function reaggregateLateShips(env, hourMs) {
  const redone = [];
  for (let k = 1; k <= SHIPS_LOOKBACK_H; k++) {
    const hMs = hourMs - k * 3600e3, hour = hourKey(hMs);
    const listed = await env.R2.list({ prefix: `cells/ships/${hour}` });
    const objs = listed.objects || [];
    if (!objs.length) continue;                                         // nothing received for that hour: the existing record stands
    const row = await env.DB.prepare('SELECT updated_at FROM layer_hourly WHERE layer = ? AND hour_utc = ?').bind('ships', hour).first();
    const written = row && Date.parse(row.updated_at);
    const late = objs.filter(o => !written || (o.uploaded && new Date(o.uploaded).getTime() > written));
    if (!late.length) continue;
    const r = await aggregateShips(env, hMs);
    redone.push({ hour, late: late.length, status: r.status, ok: r.ok, files: r.files });
  }
  return redone;
}

async function hourlyBatch(env, scheduledMs) {
  const started = Date.now();
  const hourMs = Math.floor((scheduledMs - 3600e3) / 3600e3) * 3600e3;    // previous full hour
  const out = {};
  if (env.OPENSKY_ENABLED === '1') { try { out.opensky = await aggregateOpensky(env, hourMs); } catch (e) { out.opensky = 'error ' + e; } } else out.opensky = 'parked';
  try { out.ships = await aggregateShips(env, hourMs); } catch (e) { out.ships = 'error ' + e; }
  try { out.ships_late = await reaggregateLateShips(env, hourMs); } catch (e) { out.ships_late = 'error ' + e; }
  try { out.usgs = await aggregateUsgs(env, hourMs); } catch (e) { out.usgs = 'error ' + e; }
  try { out.firms = await aggregateFirms(env, hourMs); } catch (e) { out.firms = 'error ' + e; }
  await env.DB.prepare('INSERT INTO batch_runs (hour_utc, started_at, finished_at, result) VALUES (?,?,?,?)')
    .bind(hourKey(hourMs), new Date(started).toISOString(), nowIso(), JSON.stringify(out).slice(0, 2000)).run();
  return out;
}

// ---------------------------------------------------------------- Drifting buoys — NOAA OSMC (GTS), CC0
/* Latest reported fix per drifting buoy in the last 24 h, from NOAA's Observing System Monitoring Center ERDDAP
 * (OSMC_flattened = observations relayed over the WMO GTS; dataset licence CC0 1.0, read 3 Nov 2026).
 * ONE request (~100 KB, ~1,300 rows measured 3 Nov), server-side orderByMax → one row per buoy.
 * Validation before anything is published: exact header + units line, 7 fields per row, valid time and position,
 * unique buoy id, no fix stamped in the future (> 5 min after retrieval — 10 buoys on 3 Nov), at least 200 buoys
 * and at least 50 % of the previous valid count. A refused row is counted, never drawn. Any failure → writeDown,
 * and the previous valid snapshot keeps its own times. Storage (Chad, 3 Nov): one current snapshot only —
 * latest/drifters.json + latest-cells/drifters.json; no snapshots/ or cells/ history for this layer. */
const DRIFT = { header: 'platform_code,platform_type,country,time,latitude,longitude,sst', units: ',,,UTC,degrees_north,degrees_east,Deg C',
  minRows: 200, minFrac: 0.5, futureSlackMs: 5 * 60e3, windowMs: 24 * 3600e3, sstMin: -3, sstMax: 40 };
/** One CSV line → fields, honouring "quoted, fields" (ERDDAP quotes strings that contain commas). Pure. */
function csvFields(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
}
/** Validate + build the drifters envelope parts from the OSMC CSV. Pure; tested in drifters-hub.test.mjs. */
function driftBuild(text, retrievedMs, prevCount) {
  const L = text.replace(/\r/g, '').split('\n'); while (L.length && L[L.length - 1] === '') L.pop();
  if (L[0] !== DRIFT.header) return { problem: 'unexpected header' };
  if (L[1] !== DRIFT.units) return { problem: 'unexpected units line' };
  const refused = { future: 0, bad_time: 0, bad_position: 0, field_count: 0, duplicate: 0, too_old: 0 };
  const seen = new Set(), rows = [], cells = {}; let sstOut = 0, newest = null;
  for (let i = 2; i < L.length; i++) {
    const c = csvFields(L[i]); if (c.length !== 7) { refused.field_count++; continue; }
    const [id, type, country, time, la, lo, sst] = c; const t = Date.parse(time); const lat = +la, lng = +lo;
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(time) || !Number.isFinite(t)) { refused.bad_time++; continue; }
    if (t > retrievedMs + DRIFT.futureSlackMs) { refused.future++; continue; }
    if (t < retrievedMs - DRIFT.windowMs - 3600e3) { refused.too_old++; continue; }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || la === '' || lo === '') { refused.bad_position++; continue; }
    if (!id || seen.has(id)) { refused.duplicate++; continue; }
    seen.add(id);
    let s = sst === '' || sst === 'NaN' ? null : +sst; if (s !== null && (!Number.isFinite(s) || s < DRIFT.sstMin || s > DRIFT.sstMax)) { s = null; sstOut++; }
    rows.push([id, lat, lng, new Date(t).toISOString(), s, type, country || null]);
    const cid = cellId(lat, lng); (cells[cid] || (cells[cid] = { count: 0 })).count++;
    if (!newest || t > newest) newest = t;
  }
  if (rows.length < DRIFT.minRows) return { problem: `too few buoys (${rows.length} < ${DRIFT.minRows})`, refused };
  if (prevCount && rows.length < prevCount * DRIFT.minFrac) return { problem: `buoy count fell to ${rows.length} from ${prevCount} (below ${DRIFT.minFrac * 100} %)`, refused };
  return { rows, cells, refused, sst_out_of_range: sstOut, newest: newest && new Date(newest).toISOString() };
}
/* A failed buoy run (0.6.8, docs/concepts/OSMC-RELIABILITY-PROPOSAL.md rev 2.1). Buoys never reach the generic writeDown.
 *  - The run is ALWAYS logged (collector_runs row + the private per-run object cells/drifters/<minute>.json, raw note kept;
 *    no public route serves that object), whether or not latest-cells is written.
 *  - latest-cells/drifters.json: if it holds a good run's counts, they are rewritten UNCHANGED plus a last_attempt block
 *    (retrieved_at, cells, source_status, scheduled_for … stay the good run's). latest/drifters.json is never touched here.
 *    The hub does not claim a matched pair: the page and /place check the pair at read time, as before.
 *  - Nothing good to keep (key absent, unreadable, or an empty down envelope): an empty down envelope with a fixed-phrase note.
 *  - EVERY write here is conditional (etag of what was read, or create-only when absent), re-read once on a lost race.
 *  - Attempts are ordered by RUN timestamp (scheduled_for / last_attempt.run), never by retrieved_at or failed_at: if what is
 *    stored comes from this run or a later one, nothing is written. failed_at is for display only.
 *  - The raw error text never goes into latest-cells (reason is one of four fixed codes).
 *  - failed_at is the time this handler was entered. Stored counts that cannot be read are left alone; stored counts that
 *    read but are not JSON count as nothing good to keep. */
const DRIFT_REASONS = { fetch_failed: 'request failed', http_error: 'http error', refused_by_checks: 'response refused by our checks', internal_error: 'internal error' };
async function driftFail(env, scheduledMs, reason, note, http) {
  const layer = 'drifters', run = new Date(scheduledMs).toISOString();
  const failedAt = nowIso();   // captured ONCE on entry, before any await: the log write, the per-run object and a retry must not move it
  if (!DRIFT_REASONS[reason]) reason = 'internal_error';
  await logRun(env, layer, scheduledMs, 'down', http || 0, 0, 0, note);   // logRun swallows its own errors
  const down = (extra) => { const e = envelope(layer, scheduledMs, null, null, 'down', {}, [], [], extra); return { ...e, records: undefined }; };
  try { await putJson(env, `cells/${layer}/${isoMinute(scheduledMs)}.json`, down({ note })); } catch (e) { console.log('driftFail per-run record failed', String(e).slice(0, 120)); }
  const key = `latest-cells/${layer}.json`;
  try {
    for (let round = 0; round < 2; round++) {
      const o = await env.R2.get(key); let cur = null;
      if (o) {
        let text;   // a body that cannot be READ is not evidence about its content: leave the stored object alone
        try { text = await o.text(); } catch (e) { console.log('driftFail: stored counts could not be read; left alone', String(e).slice(0, 120)); return 'left: stored counts unreadable'; }
        try { cur = JSON.parse(text); } catch (_) { cur = null; }   // read fine but not JSON: nothing good to keep → replaced conditionally below
        if (cur === null || typeof cur !== 'object') cur = null;
      }
      if (cur) {
        const stored = [cur.scheduled_for, cur.last_attempt && cur.last_attempt.run].filter(Boolean).sort().pop();
        if (stored && stored >= run) return 'left: stored data is from this run or a later one';
      }
      const good = !!(cur && cur.source_status && cur.source_status !== 'down' && cur.cells && cur.retrieved_at);
      const body = good
        ? { ...cur, last_attempt: { run, failed_at: failedAt, status: 'down', http: http || null, reason, consecutive_failures: ((cur.last_attempt && cur.last_attempt.consecutive_failures) || 0) + 1 } }
        : down({ note: DRIFT_REASONS[reason] + (reason === 'http_error' && http ? ' ' + http : ''), reason });
      const res = await env.R2.put(key, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: o ? { etagMatches: o.etag } : { etagDoesNotMatch: '*' } });
      if (res) return good ? 'kept last good counts' : 'down envelope';
    }
    console.log('driftFail: latest-cells changed twice while writing; left alone');
    return 'left: contended';
  } catch (e) { console.log('driftFail write failed', String(e).slice(0, 120)); return 'left: write failed'; }
}
async function collectDrifters(env, scheduledMs) {
  const layer = 'drifters', retrievedMs = Date.now();
  const since = new Date(retrievedMs - DRIFT.windowMs).toISOString().slice(0, 19) + 'Z';
  let res;
  try { res = await fetchText(URLS.drifters(since)); } catch (e) { return driftFail(env, scheduledMs, 'fetch_failed', 'fetch failed: ' + e, 0); }
  if (!res.ok) return driftFail(env, scheduledMs, 'http_error', 'http ' + res.status, res.status);
  const prev = await getJson(env, `latest/${layer}.json`);
  const b = driftBuild(res.text, retrievedMs, prev && prev.records && prev.records.length);
  if (b.problem) return driftFail(env, scheduledMs, 'refused_by_checks', 'refused: ' + b.problem + (b.refused ? ' ' + JSON.stringify(b.refused) : ''), res.status);
  const grade = 'partial', evidence = 'buoy_positions_only;sparse_platforms;gts_relay';
  for (const id in b.cells) b.cells[id].coverage = { grade, evidence, observed_fraction: null };
  const fields = ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'];
  const e = envelope(layer, scheduledMs, since, b.newest, 'ok', b.cells, fields, b.rows, {
    coverage_default: { grade, evidence, observed_fraction: null },
    quantity: 'drifting buoys with a reported fix in the last 24 h (latest fix per buoy)',
    refused: b.refused, sst_out_of_range: b.sst_out_of_range,
    source: { name: 'NOAA OSMC ERDDAP — OSMC_flattened (GTS)', url: 'https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.html', licence: 'CC0 1.0' },
    citation: 'NOAA Observing System Monitoring Center (OSMC), OSMC_flattened observations from the WMO GTS; drifting buoys.',
    map_layer: true,
  });
  const cellsOnly = { ...e, records: undefined, record_fields: undefined, record_format: undefined };
  const bytes = await putJson(env, `latest/${layer}.json`, e);       // one current snapshot (records)
  await putJson(env, `latest-cells/${layer}.json`, cellsOnly);        // and its counts — same run, same retrieved_at
  await hist(env, 'drifter-fixes', () => histDrifters(env, e));
  const r = b.refused; const refusedN = Object.values(r).reduce((a, x) => a + x, 0);
  await logRun(env, layer, scheduledMs, 'ok', res.status, b.rows.length, bytes, `buoys=${b.rows.length} refused=${refusedN} ${JSON.stringify(r)} newest=${b.newest}`);
}

// ---------------------------------------------------------------- Microplastic samples — dated (0.4.0)
/* Oceaneye surface manta-net samples as PUBLISHED BY NOAA NCEI (Marine Microplastics, Accession 0276422; compiled product
 * CC0), shown as dated samples — never current positions. Research: reviews/2026-11-04-ocean-plastic-export.md (§8–10).
 * Each run: (1) page NOAA's current layer at 1,000 rows and require retrieved = NOAA's own count; validate every row;
 * (2) re-check every record from scratch against Oceaneye's original file (SEANOE 10.17882/86630, CC BY 4.0), held once
 * in R2 and pinned to its SHA-256 — nothing from an earlier check is carried over, so a changed NOAA date, position or
 * value can never keep an old "reproduced"; a changed original file pauses every check until reviewed.
 * Storage: one current snapshot (latest/plastic.json + latest-cells/plastic.json) and the pinned original (ref/). */
const PLASTIC = {
  service: 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Ocean_Surface_Microplastics_(PS)/FeatureServer/0',
  where: 'NCEI_Accession_No=276422', accession: 276422,
  fields: 'UniqueID,Date__MM_DD_YYYY_,Latitude__degree_,Longitude_degree_,Microplastics_measurement,Unit,Medium,Sampling_Method,Mesh_size__mm_,Water_Sample_Depth__m_,NCEI_Accession_No',
  page: 1000, minRows: 1000, minFrac: 0.9, maxPages: 10,
  zipUrl: 'https://www.seanoe.org/data/00754/86630/data/94022.zip', zipKey: 'ref/oceaneye-seanoe-94022.zip',
  zipSha256: '89f1018bfaad7d23d014144b65e0bbd566b1681d35edd0b18c4cbb7c5c40c424', zipBytes: 96249,
  tol: 0.005, netWidthM: 0.6, everyMs: 20 * 3600e3, sameTowDeg: 0.01, samePlaceDeg: 0.001,
  SIZE: { 'SDN:H03::H0300008': '1-5 mm', 'SDN:H03::H0300009': '5-25 mm', 'SDN:H03::H0300010': '0.3-5 mm', 'SDN:H03::H0300011': '0.1-0.5 mm' },
};
/** NOAA stores a date-only value as US local midnight (05:00/06:00 UTC, measured 4 Nov 2026); +12 h names the day. Pure. */
function plDay(ms) { return new Date(ms + 12 * 3600e3).toISOString().slice(0, 10); }
async function sha256Bytes(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
/** Minimal zip reader (stored + deflate entries, local headers). Returns [{name, text}] (latin1 for stored, utf-8 for deflated). */
async function unzipText(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); const out = []; let p = 0;
  while (p + 30 <= u8.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true), flags = dv.getUint16(p + 6, true), cs = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), el = dv.getUint16(p + 28, true);
    if (flags & 8) throw new Error('zip uses data descriptors (unsupported)');
    const name = new TextDecoder().decode(u8.subarray(p + 30, p + 30 + nl)); const s = p + 30 + nl + el; const data = u8.subarray(s, s + cs);
    let text; if (method === 0) text = new TextDecoder('latin1').decode(data);
    else if (method === 8) text = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    else throw new Error('zip method ' + method + ' unsupported');
    out.push({ name, text }); p = s + cs;
  }
  if (!out.length) throw new Error('not a zip file');
  return out;
}
/** SeaDataNet ODV microlitter files → one entry per sample, sea only (lake/river files excluded). Pure. */
function odvSamples(files) {
  const all = []; const lakesRivers = [];
  for (const f of files) {
    if (/Lakes|Rivers/i.test(f.name)) { lakesRivers.push(f.name); continue; }
    const L = f.text.split(/\r?\n/).filter(l => l && !l.startsWith('//')); if (!L.length) continue;
    const H = L[0].split('\t'); const ix = n => H.findIndex(h => h.startsWith(n));
    const I = { id: ix('SampleID'), dist: ix('SamplingEffort'), net: ix('Net_opening'), dmax: ix('MaximumObservationDepth'), sz: ix('Microlitter_Size'), cnt: ix('Microlitter_Count'), t: ix('YYYY-MM-DD'), lon: ix('Longitude'), lat: ix('Latitude'), et: ix('ENDX8601'), elon: ix('ENDXXLON'), elat: ix('ENDXXLAT'), prot: ix('SAMPPROT'), cruise: ix('Cruise'), mesh: ix('Mesh_size') };
    // the end-time column is absent from 4 of the 30 files (measured 4 Nov 2026) — optional; every other column is required
    if (Object.entries(I).some(([k, i]) => i < 0 && k !== 'et')) throw new Error('unexpected ODV header in ' + f.name);
    let cur = null; const by = {};
    for (const l of L.slice(1)) {
      const c = l.split('\t'); if (c[I.t]) cur = { cruise: c[I.cruise], t: c[I.t], lat: +c[I.lat], lon: +c[I.lon] };
      if (!cur) continue;
      const id = c[I.id]; const num = v => v === '' || v === undefined ? null : +v;
      const s = by[id] || (by[id] = { file: f.name, cruise: cur.cruise, sample: id, start: cur.t.slice(0, 16), start_pos: [cur.lat, cur.lon],
        end: I.et >= 0 && c[I.et] ? c[I.et] : null, end_pos: num(c[I.elat]) === null ? null : [+c[I.elat], +c[I.elon]], distance_km: num(c[I.dist]), net_cm: num(c[I.net]),
        depth_max_m: num(c[I.dmax]), mesh_um: num(c[I.mesh]), distance_method: ((c[I.prot] || '').match(/Distance measurement method:\s*([^,]+)/) || [])[1] || null, counts: {} });
      const k = PLASTIC.SIZE[c[I.sz]] || c[I.sz]; s.counts[k] = (s.counts[k] || 0) + (+c[I.cnt]);
    }
    all.push(...Object.values(by));
  }
  // the same sample filed in two regional files (3 found, 4 Nov 2026): merge when identical apart from file and a blank method
  const key = s => JSON.stringify({ ...s, file: 0, distance_method: 0 }); const merged = new Map(); const kept = [];
  for (const s of all) {
    const k = key(s), m = merged.get(k);
    if (m) { m.also_in_file = s.file; if (m.distance_method !== s.distance_method) { m.method_note = `distance method ${m.distance_method || 'blank'} in ${m.file}, ${s.distance_method || 'blank'} in ${s.file}`; m.distance_method = m.distance_method || s.distance_method; } continue; }
    merged.set(k, s); kept.push(s);
  }
  return { samples: kept, entries: all.length, lakes_rivers_files: lakesRivers.length };
}
/** Validate NOAA's rows; refused rows are counted, never drawn. Pure. */
function plasticValidate(features, retrievedMs) {
  const refused = { bad_id: 0, duplicate: 0, bad_date: 0, bad_position: 0, bad_value: 0, wrong_unit: 0, wrong_medium: 0, wrong_accession: 0 };
  const seen = new Set(), rows = [];
  for (const f of features) {
    const a = f && f.attributes || {};
    if (!/^0276422-\d{7}$/.test(String(a.UniqueID || ''))) { refused.bad_id++; continue; }
    if (seen.has(a.UniqueID)) { refused.duplicate++; continue; }
    if (a.NCEI_Accession_No !== PLASTIC.accession) { refused.wrong_accession++; continue; }
    if (a.Unit !== 'pieces/m3') { refused.wrong_unit++; continue; }
    if (a.Medium !== 'Ocean water') { refused.wrong_medium++; continue; }
    const t = a.Date__MM_DD_YYYY_; if (!Number.isFinite(t) || t < Date.UTC(1972, 0, 1) || t > retrievedMs) { refused.bad_date++; continue; }
    const lat = a.Latitude__degree_, lng = a.Longitude_degree_;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) { refused.bad_position++; continue; }
    const v = a.Microplastics_measurement; if (!Number.isFinite(v) || v < 0) { refused.bad_value++; continue; }
    seen.add(a.UniqueID);
    rows.push({ id: a.UniqueID, lat, lng, day: plDay(t), value: v, method: a.Sampling_Method || null, mesh_mm: Number.isFinite(a.Mesh_size__mm_) ? a.Mesh_size__mm_ : null, depth_m: Number.isFinite(a.Water_Sample_Depth__m_) ? a.Water_Sample_Depth__m_ : null });
  }
  return { rows, refused };
}
/** Re-check every NOAA row against the original samples, from scratch. Pure; real-data result 4 Nov 2026: 647 / 11 / 1. */
function plasticVerify(rows, samples) {
  const byDay = new Map(); for (const r of rows) (byDay.get(r.day) || byDay.set(r.day, []).get(r.day)).push(r);
  const claims = new Map();   // NOAA id → [{status, sample, computed}]
  const unclaimed = [];
  for (const s of samples) {
    const micro = '1-5 mm' in s.counts ? '1-5 mm' : '0.3-5 mm' in s.counts ? '0.3-5 mm' : null;
    const n = micro ? s.counts[micro] : null;
    const vol = s.distance_km > 0 && s.net_cm > 0 && s.depth_max_m > 0 ? s.distance_km * 1000 * (s.net_cm / 100) * s.depth_max_m : null;
    const computed = vol && n !== null ? n / vol : null;
    const agrees = v => computed !== null && ((v === 0 && n === 0) || (v > 0 && Math.abs(computed - v) / v < PLASTIC.tol));
    const day = s.start.slice(0, 10);
    const same = (byDay.get(day) || []).filter(r => Math.abs(r.lat - s.start_pos[0]) < PLASTIC.sameTowDeg && Math.abs(r.lng - s.start_pos[1]) < PLASTIC.sameTowDeg);
    let hit = null, status;
    if (same.length === 1) { hit = same[0]; status = agrees(hit.value) ? 'reproduced' : 'not_reproduced'; }
    else if (same.length > 1) { unclaimed.push({ sample: s.sample, why: 'several NOAA rows on the same day and place' }); continue; }
    else {
      const c = rows.filter(r => Math.abs(r.lat - s.start_pos[0]) < PLASTIC.samePlaceDeg && Math.abs(r.lng - s.start_pos[1]) < PLASTIC.samePlaceDeg && agrees(r.value));
      if (c.length !== 1) { unclaimed.push({ sample: s.sample, why: c.length ? 'several possible NOAA rows' : 'no NOAA row found' }); continue; }
      hit = c[0]; status = 'possible_date_conflict';
    }
    const orig = { sample: s.sample, file: s.file, also_in_file: s.also_in_file || null, method_note: s.method_note || null, cruise: s.cruise,
      start: s.start, end: s.end, start_pos: s.start_pos, end_pos: s.end_pos,
      distance_m: s.distance_km === null ? null : Math.round(s.distance_km * 10000) / 10, distance_method: s.distance_method,
      net_width_m: s.net_cm === null ? null : s.net_cm / 100, depth_m: s.depth_max_m, mesh_um: s.mesh_um,
      size_class: micro, count: n, count_5_25mm: s.counts['5-25 mm'] ?? null, computed: computed === null ? null : +computed.toPrecision(7),
      checked_against: { date: hit.day, lat: hit.lat, lng: hit.lng, value: hit.value }, tolerance: PLASTIC.tol };
    if (status === 'possible_date_conflict') orig.end_date_matches_noaa = !!(s.end && s.end.slice(0, 10) === hit.day);
    (claims.get(hit.id) || claims.set(hit.id, []).get(hit.id)).push({ status, orig });
  }
  const out = new Map(); const counts = { reproduced: 0, not_reproduced: 0, possible_date_conflict: 0, ambiguous: 0, no_original: 0 };
  for (const r of rows) {
    const c = claims.get(r.id);
    if (!c) { out.set(r.id, { check: 'no_original', original: null }); counts.no_original++; continue; }
    if (c.length > 1) { out.set(r.id, { check: 'ambiguous', original: null }); counts.ambiguous++; continue; }
    out.set(r.id, { check: c[0].status, original: c[0].orig }); counts[c[0].status]++;
  }
  return { byId: out, counts, unclaimed };
}
async function plasticOriginal(env) {
  // the pinned original: from R2 if held, else ONE download, kept only when the hash matches
  let o = await env.R2.get(PLASTIC.zipKey), buf = o ? new Uint8Array(await o.arrayBuffer()) : null, fetched = false;
  if (!buf) {
    const r = await fetch(PLASTIC.zipUrl, { headers: { 'User-Agent': UA } });
    if (!r.ok) return { problem: 'original file: http ' + r.status };
    buf = new Uint8Array(await r.arrayBuffer()); fetched = true;
  }
  const sha = await sha256Bytes(buf);
  if (sha !== PLASTIC.zipSha256) return { problem: `original file changed (sha256 ${sha.slice(0, 12)}…, pinned ${PLASTIC.zipSha256.slice(0, 12)}…): checks paused until reviewed` };
  if (fetched) await env.R2.put(PLASTIC.zipKey, buf, { httpMetadata: { contentType: 'application/zip' } });
  return { files: await unzipText(buf), sha, fetched };
}
async function collectPlastic(env, scheduledMs) {
  const layer = 'plastic', retrievedMs = Date.now();
  const q = p => `${PLASTIC.service}/query?f=json&where=${encodeURIComponent(PLASTIC.where)}&${p}`;
  let meta, count, features = [], pages = 0;
  try {
    meta = await (await fetch(PLASTIC.service + '?f=json', { headers: { 'User-Agent': UA } })).json();
    const cj = await (await fetch(q('returnCountOnly=true'), { headers: { 'User-Agent': UA } })).json();
    count = cj && cj.count;
    if (!Number.isInteger(count)) return writeDown(env, layer, scheduledMs, 'count query gave no count', 200);
    for (let off = 0; pages < PLASTIC.maxPages; off += PLASTIC.page) {
      const j = await (await fetch(q(`outFields=${PLASTIC.fields}&orderByFields=ObjectId&returnGeometry=false&resultOffset=${off}&resultRecordCount=${PLASTIC.page}`), { headers: { 'User-Agent': UA } })).json();
      pages++;
      if (!j || j.error || !Array.isArray(j.features)) return writeDown(env, layer, scheduledMs, 'page ' + pages + ': ' + JSON.stringify(j && j.error || 'no features').slice(0, 160), 200);
      features.push(...j.features);
      if (!j.exceededTransferLimit) break;
    }
  } catch (e) { return writeDown(env, layer, scheduledMs, 'fetch failed: ' + e, 0); }
  if (features.length !== count) return writeDown(env, layer, scheduledMs, `refused: retrieved ${features.length} rows, NOAA reports ${count}`, 200);
  const v = plasticValidate(features, retrievedMs);
  const prev = await getJson(env, `latest-cells/${layer}.json`); const prevN = prev && prev.rows_published;
  if (v.rows.length < PLASTIC.minRows) return writeDown(env, layer, scheduledMs, `refused: ${v.rows.length} valid rows < ${PLASTIC.minRows} ${JSON.stringify(v.refused)}`, 200);
  if (prevN && v.rows.length < prevN * PLASTIC.minFrac) return writeDown(env, layer, scheduledMs, `refused: ${v.rows.length} rows, previously ${prevN} (below ${PLASTIC.minFrac * 100} %)`, 200);
  let ver, origNote = null;
  try { const o = await plasticOriginal(env); if (o.problem) origNote = o.problem; else { const od = odvSamples(o.files); ver = { ...plasticVerify(v.rows, od.samples), sea_samples: od.samples.length, entries: od.entries, lakes_rivers_files: od.lakes_rivers_files, fetched: o.fetched }; } }
  catch (e) { origNote = 'original file unreadable: ' + String(e).slice(0, 120); }
  const cells = {}; const recs = [];
  const grade = 'partial', evidence = 'dated_samples;one_programme_routes;not_current;tow_start_positions';
  for (const r of v.rows) {
    const chk = ver ? ver.byId.get(r.id) : { check: 'original_unavailable', original: null };
    recs.push([r.id, r.lat, r.lng, r.day, r.value, chk.check, chk.original, r.method, r.mesh_mm, r.depth_m]);
    const cid = cellId(r.lat, r.lng); (cells[cid] || (cells[cid] = { count: 0, coverage: { grade, evidence, observed_fraction: null } })).count++;
  }
  const days = v.rows.map(r => r.day).sort();
  const fields = ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'];
  const e = envelope(layer, scheduledMs, days[0], days[days.length - 1], 'ok', cells, fields, recs, {
    coverage_default: { grade, evidence, observed_fraction: null },
    quantity: 'dated surface microplastic samples (pieces/m³, < 5 mm) as published by NOAA NCEI — one marker per sample at its tow-start location; not current positions',
    rows_published: v.rows.length, noaa_count: count, pages, refused: v.refused,
    source: { name: 'NOAA NCEI Marine Microplastics — Ocean Surface (Professional Science), Accession 0276422 (Oceaneye Association)', url: PLASTIC.service, filter: PLASTIC.where, data_last_edit: meta && meta.editingInfo ? new Date(meta.editingInfo.dataLastEditDate).toISOString() : null, licence: 'CC0 (NCEI compiled product)' },
    verification: ver ? { status: 'checked', rule: 'count in the < 5 mm class ÷ (tow distance [km] × 1,000 m/km × net width [m] × sampled depth [m]); reproduced = within 0.5 % of the published value (zero = zero); recomputed from scratch on every run',
      original: { name: "Oceaneye's microlitter data 2011-2020 (SEANOE)", doi: '10.17882/86630', file: '94022.zip', sha256: PLASTIC.zipSha256, licence: 'CC BY 4.0', sea_samples: ver.sea_samples, entries: ver.entries, lakes_rivers_files_excluded: ver.lakes_rivers_files },
      counts: ver.counts, unclaimed: ver.unclaimed } : { status: 'unavailable', reason: origNote },
    citation: 'NOAA NCEI Marine Microplastics: Nyadjro, E., et al. (2018), The NOAA NCEI Global Marine Microplastics Data Collection (1972-present), NOAA National Centers for Environmental Information, https://www.ncei.noaa.gov/archive/accession/NCEI-Marine-Microplastics; Nyadjro, E. S., et al. (2023), Scientific Data 10, https://doi.org/10.1038/s41597-023-02632-y. Dataset: Faure, F., Saini, C., Potter, G., Galgani, F., de Alencastro, L. F., Hagmann, P. (2023), NCEI Accession 0276422. Original counts: Hagmann, P., Potter, G. (2022), Oceaneye\'s microlitter data 2011-2020, SEANOE, https://doi.org/10.17882/86630 (CC BY 4.0).',
    map_layer: true,
  });
  const cellsOnly = { ...e, records: undefined, record_fields: undefined, record_format: undefined };
  const bytes = await putJson(env, `latest/${layer}.json`, e);
  await putJson(env, `latest-cells/${layer}.json`, cellsOnly);
  await hist(env, 'plastic-version', () => histVersion(env, layer, e));
  const rf = Object.values(v.refused).reduce((a, x) => a + x, 0);
  await logRun(env, layer, scheduledMs, 'ok', 200, v.rows.length, bytes, `rows=${v.rows.length}/${count} refused=${rf} checks=${ver ? JSON.stringify(ver.counts) : 'unavailable: ' + origNote}`);
}
async function plasticDue(env, ms, manual) {
  if (manual) return true;
  const prev = await getJson(env, 'latest-cells/plastic.json');
  return !prev || !prev.retrieved_at || ms - Date.parse(prev.retrieved_at) > PLASTIC.everyMs;
}

// ---------------------------------------------------------------- Ships from the Worker — PRIVATE probe (0.3.3)
/* Question (Chad, 3 Nov 2026): on Workers Paid, can the hub take the ships sample itself instead of the Mac?
 * ONE bounded listen to aisstream.io from the Worker, measured and stored privately: nothing published, no latest/,
 * no cells/, no page change, not in JOBS, no cron. Same subscription as collector-mac (world box, Class A + B).
 * Guards before any connection: AISSTREAM_KEY secret set; no earlier probe in the last 10 min (claimed first).
 * Wall time is bounded by the window + 15 s; CPU is read afterwards from the invocation log. Result (no key) in
 * state/ships-probe.json, readable with &last=1. The Mac collector keeps running; if both listen at once on one
 * key, whether aisstream allows that is itself unknown — the result records the overlap risk, it does not assume it. */
const SP = { stateKey: 'state/ships-probe.json', minGapMs: 10 * 60e3, url: 'https://stream.aisstream.io/v0/stream',
  CLASS: { PositionReport: 'A', StandardClassBPositionReport: 'B', ExtendedClassBPositionReport: 'B' } };
async function probeShips(env, nowMs, windowS) {
  if (!env.AISSTREAM_KEY) return { refused: 'AISSTREAM_KEY secret is not set' };
  const last = await getJson(env, SP.stateKey);
  if (last && last.started_at && nowMs - Date.parse(last.started_at) < SP.minGapMs) return { refused: 'a probe ran less than 10 minutes ago', last_started_at: last.started_at };
  const out = { started_at: new Date(nowMs).toISOString(), window_s: windowS, collector_version: COLLECTOR_VERSION };
  await putJson(env, SP.stateKey, { ...out, status: 'claimed' });                 // claimed BEFORE connecting
  const t0 = Date.now(); let ws;
  try {
    const r = await fetch(SP.url, { headers: { Upgrade: 'websocket', 'User-Agent': UA } });
    out.upgrade_status = r.status; out.connect_ms = Date.now() - t0;
    ws = r.webSocket;
    if (!ws) { out.status = 'down'; out.reason = 'no websocket (HTTP ' + r.status + ')'; out.body = (await r.text().catch(() => '')).slice(0, 200); await putJson(env, SP.stateKey, out); return out; }
  } catch (e) { out.status = 'down'; out.reason = 'connect failed: ' + String(e).slice(0, 160); out.connect_ms = Date.now() - t0; await putJson(env, SP.stateKey, out); return out; }
  ws.accept();
  const vessels = new Map(); let messages = 0, parseErrors = 0, confirmed = false, firstMsgMs = null, lastMsgMs = null, closeInfo = null, bytes = 0, maxGapS = 0, errorMsg = null, handlerErrors = 0, firstHandlerError = null;
  const frameTypes = {}; const pending = new Set(); const dec = new TextDecoder();
  /* Frame shapes differ between runtimes (3 Nov 2026: the first live probe threw on every frame). Accept every shape the
   * WebSocket API allows and record which one arrived, so the next test is built from the real one. */
  const toText = async d => typeof d === 'string' ? d : d instanceof ArrayBuffer ? dec.decode(new Uint8Array(d))
    : ArrayBuffer.isView(d) ? dec.decode(new Uint8Array(d.buffer, d.byteOffset, d.byteLength))
    : d && typeof d.arrayBuffer === 'function' ? dec.decode(new Uint8Array(await d.arrayBuffer())) : String(d);
  await new Promise(resolve => {
    const done = () => { clearTimeout(timer); clearTimeout(hard); resolve(); };
    const timer = setTimeout(() => { try { ws.close(1000, 'window done'); } catch (_) {} done(); }, windowS * 1000);
    const hard = setTimeout(() => { try { ws.close(4000, 'hard stop'); } catch (_) {} done(); }, (windowS + 15) * 1000);
    const onFrame = async ev => {
      const now = Date.now(); const tag = typeof ev.data === 'string' ? 'string' : Object.prototype.toString.call(ev.data); frameTypes[tag] = (frameTypes[tag] || 0) + 1;
      const txt = await toText(ev.data); bytes += txt.length;
      let m; try { m = JSON.parse(txt); } catch (_) { parseErrors++; return; }
      if (m.MessageType === 'SubscriptionConfirmation') { confirmed = true; return; }
      if (m.error) { errorMsg = String(m.error).slice(0, 200); return; }
      const cls = SP.CLASS[m.MessageType]; if (!cls) return;
      if (firstMsgMs === null) firstMsgMs = now - t0;
      if (lastMsgMs !== null) maxGapS = Math.max(maxGapS, (now - lastMsgMs) / 1000);
      lastMsgMs = now; messages++;
      const md = m.MetaData || {}; const mmsi = String(md.MMSI ?? '');
      if (mmsi) vessels.set(mmsi, cls);
    };
    ws.addEventListener('message', ev => { const p = onFrame(ev).catch(e => { handlerErrors++; if (!firstHandlerError) firstHandlerError = String(e).slice(0, 160); }); pending.add(p); p.finally(() => pending.delete(p)); });
    ws.addEventListener('close', ev => { closeInfo = { code: ev.code, reason: String(ev.reason || '').slice(0, 120) }; done(); });
    ws.addEventListener('error', ev => { errorMsg = errorMsg || 'socket error: ' + String((ev && ev.message) || 'no detail'); });
    ws.send(JSON.stringify({ APIKey: env.AISSTREAM_KEY, BoundingBoxes: [[[-90, -180], [90, 180]]], FilterMessageTypes: Object.keys(SP.CLASS) }));
  });
  await Promise.allSettled([...pending]);
  const vals = [...vessels.values()];
  Object.assign(out, { frame_types: frameTypes, handler_errors: handlerErrors, first_handler_error: firstHandlerError, finished_at: nowIso(), wall_s: (Date.now() - t0) / 1000, confirmed, messages, vessels: vessels.size,
    class_a: vals.filter(v => v === 'A').length, class_b: vals.filter(v => v === 'B').length, bytes, parse_errors: parseErrors,
    first_message_s: firstMsgMs === null ? null : firstMsgMs / 1000, max_gap_s: maxGapS, close: closeInfo, source_error: errorMsg,
    status: messages > 0 && confirmed ? 'ok' : messages > 0 ? 'degraded' : 'down',
    note: 'private measurement only; nothing published; CPU from the invocation log' });
  await putJson(env, SP.stateKey, out);
  return out;
}

// ---------------------------------------------------------------- Ships — cloud FALLBACK sample (0.3.5)
/* Chad, 3 Nov 2026: the home Mac stays the primary ships collector; the hub samples ONLY when no Mac sample has arrived
 * recently (Mac asleep, off, away). Rides the every-15-min FIRMS tick. Gates, all before connecting: SHIPS_FALLBACK=1 and
 * AISSTREAM_KEY set; latest ships sample older than SF.macStaleMs; no fallback attempt in the last SF.minGapMs (claimed
 * first). One 60 s listen, same subscription and envelope shape as collector-mac, so the page and the hourly
 * aggregation treat it like any other sample — but `collected_by` says it was the cloud hub, and the page says so.
 * Measured 3 Nov 2026 (one probe, 17:45 UTC): the cloud connection heard 1,873 vessels in 60 s against the Mac's
 * 3,408 at 17:19 — a difference that is stated on the card, not hidden. A Mac upload landing during the listen wins:
 * the hub's sample is archived only, never published over a newer one. */
const SF = { macStaleMs: 40 * 60e3, minGapMs: 25 * 60e3, stateKey: 'state/ships-fallback.json', windowS: 60, url: 'wss://stream.aisstream.io/v0/stream',
  CLASS: { PositionReport: 'A', StandardClassBPositionReport: 'B', ExtendedClassBPositionReport: 'B' } };
async function aisListen(env, windowS) {
  const t0 = Date.now(); const r = await fetch('https://stream.aisstream.io/v0/stream', { headers: { Upgrade: 'websocket', 'User-Agent': UA } });
  const ws = r.webSocket; if (!ws) throw new Error('no websocket (HTTP ' + r.status + ')');
  ws.accept();
  const dec = new TextDecoder(); const vessels = new Map(); const pending = new Set();
  let messages = 0, parseErrors = 0, handlerErrors = 0, confirmed = false, connectedAt = Date.now(), lastMsg = null, gapS = 0, closeInfo = null, sourceError = null, noSourceTime = 0, olderIgnored = 0;
  const toText = async d => typeof d === 'string' ? d : d instanceof ArrayBuffer ? dec.decode(new Uint8Array(d)) : ArrayBuffer.isView(d) ? dec.decode(new Uint8Array(d.buffer, d.byteOffset, d.byteLength)) : d && typeof d.arrayBuffer === 'function' ? dec.decode(new Uint8Array(await d.arrayBuffer())) : String(d);
  const onFrame = async ev => {
    const txt = await toText(ev.data); let m; try { m = JSON.parse(txt); } catch (_) { parseErrors++; return; }
    if (m.MessageType === 'SubscriptionConfirmation') { confirmed = true; return; }
    if (m.error) { sourceError = String(m.error).slice(0, 200); return; }
    const cls = SF.CLASS[m.MessageType]; if (!cls) return;
    const now = Date.now(); if (lastMsg && now - lastMsg > 10e3) gapS += (now - lastMsg) / 1000; lastMsg = now; messages++;
    const md = m.MetaData || {}; const pr = (m.Message || {})[m.MessageType] || {};
    const lat = Number(pr.Latitude ?? md.Latitude ?? md.latitude), lng = Number(pr.Longitude ?? md.Longitude ?? md.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    const mmsi = String(md.MMSI ?? pr.UserID ?? ''); if (!mmsi) return;
    const tUtc = md.time_utc ? new Date(String(md.time_utc).replace(' +0000 UTC', 'Z').replace(' ', 'T')) : null;
    const observedAt = tUtc && !isNaN(tUtc) ? tUtc.toISOString() : null; if (!observedAt) noSourceTime++;
    const prev = vessels.get(mmsi); if (prev && prev[3] && observedAt && Date.parse(observedAt) < Date.parse(prev[3])) { olderIgnored++; return; }
    vessels.set(mmsi, [mmsi, lat, lng, observedAt, nowIso(), pr.Sog ?? null, pr.Cog ?? null, pr.TrueHeading ?? null, pr.NavigationalStatus ?? null, cls, String(md.ShipName || '').trim().slice(0, 40)]);
  };
  await new Promise(resolve => {
    const done = () => { clearTimeout(timer); clearTimeout(hard); resolve(); };
    const timer = setTimeout(() => { try { ws.close(1000, 'window done'); } catch (_) {} done(); }, windowS * 1000);
    const hard = setTimeout(() => { try { ws.close(4000, 'hard stop'); } catch (_) {} done(); }, (windowS + 15) * 1000);
    ws.addEventListener('message', ev => { const p = onFrame(ev).catch(() => { handlerErrors++; }); pending.add(p); p.finally(() => pending.delete(p)); });
    ws.addEventListener('close', ev => { closeInfo = { code: ev.code, reason: String(ev.reason || '').slice(0, 120) }; done(); });
    ws.send(JSON.stringify({ APIKey: env.AISSTREAM_KEY, BoundingBoxes: [[[-90, -180], [90, 180]]], FilterMessageTypes: Object.keys(SF.CLASS) }));
  });
  await Promise.allSettled([...pending]);
  const end = Date.now(); if (lastMsg && end - lastMsg > 10e3) gapS += (end - lastMsg) / 1000;
  const socketS = (end - connectedAt) / 1000;
  return { rows: [...vessels.values()], messages, parseErrors, handlerErrors, confirmed, socketS, gapS, wallS: (end - t0) / 1000, closeInfo, sourceError, noSourceTime, olderIgnored, upgradeStatus: r.status };
}
async function collectShipsFallback(env, scheduledMs) {
  if (env.SHIPS_FALLBACK !== '1') return 'ships-fallback:off (SHIPS_FALLBACK unset)';
  if (!env.AISSTREAM_KEY) return 'ships-fallback:off (AISSTREAM_KEY unset)';
  const now = Date.now(); const latest = await getJson(env, 'latest/ships.json');
  const ageMs = latest && latest.retrieved_at ? now - Date.parse(latest.retrieved_at) : Infinity;
  if (ageMs < SF.macStaleMs) return `ships-fallback:not needed (latest sample ${Math.round(ageMs / 60e3)} min old, by ${latest.collected_by || latest.collector_version || 'unknown'})`;
  const st = await getJson(env, SF.stateKey);
  if (st && st.started_at && now - Date.parse(st.started_at) < SF.minGapMs) return 'ships-fallback:waiting (last attempt ' + st.started_at + ')';
  await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status: 'claimed', latest_age_min: Number.isFinite(ageMs) ? Math.round(ageMs / 60e3) : null });
  const layer = 'ships';
  let L;
  try { L = await aisListen(env, SF.windowS); }
  catch (e) { await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status: 'down', reason: String(e).slice(0, 160) }); await writeDown(env, layer, scheduledMs, 'cloud fallback: ' + String(e).slice(0, 160), 0); return 'ships-fallback:down'; }
  const flowingS = Math.max(0, L.socketS - L.gapS), upFrac = Math.max(0, Math.min(1, flowingS / SF.windowS));
  if (!L.confirmed || !L.messages) { await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status: 'down', reason: L.sourceError || 'no messages', close: L.closeInfo }); await writeDown(env, layer, scheduledMs, 'cloud fallback: ' + (L.sourceError || 'no subscription confirmation or no messages'), L.upgradeStatus); return 'ships-fallback:down'; }
  const overlong = L.wallS > 1.25 * SF.windowS;
  const status = upFrac >= 0.9 && !overlong ? 'ok' : 'degraded';
  const statusReason = shipsReason(L.wallS, upFrac, SF.windowS, overlong);
  const fields = ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'];
  const cov = { grade: 'partial', evidence: 'messages_flowing_inferred_from_arrival_gaps;not_a_measure_of_reception;not_geographic_coverage;receipt_history_pending;terrestrial_ais_only;cloud_fallback_connection', observed_fraction: upFrac };
  const cells = {}; for (const r of L.rows) { const id = cellId(r[1], r[2]); (cells[id] || (cells[id] = { count: 0, coverage: { ...cov } })).count++; }
  const rowsA = L.rows.filter(r => r[9] === 'A').length;
  const e = envelope(layer, scheduledMs, new Date(now).toISOString(), nowIso(), status, cells, fields, L.rows, {
    coverage_default: cov,
    quantity: `vessel identities (MMSI) with a Class A or B position report received during a ${SF.windowS} s AIS sample, per cell; latest received position per vessel — terrestrial AIS, so open ocean is not covered; a silent cell is not an empty cell; positions between samples unknown`,
    collected_by: 'cloud hub (fallback: no home sample in the last 40 min)', status_reason: statusReason,
    scope: 'world', window_s: SF.windowS, socket_connected_s: Math.round(L.socketS * 10) / 10, message_gap_s: Math.round(L.gapS * 10) / 10,
    elapsed_wall_s: Math.round(L.wallS * 10) / 10, messages_flowing_s: Math.round(flowingS * 10) / 10, connection_fraction_of_sample: upFrac,
    messages: L.messages, class_a: rowsA, class_b: L.rows.length - rowsA, records_without_source_time: L.noSourceTime, older_reports_ignored: L.olderIgnored,
    parse_errors: L.parseErrors, handler_errors: L.handlerErrors, close: L.closeInfo, overlong_sample: overlong,
    sampling: 'cloud fallback: one 60 s sample when no home sample has arrived for 40 min; at most one attempt per 25 min',
    stale_after_s: 3 * 3600, citation: 'AIS data via aisstream.io (aisstream.io; free API, server-side use only)' });
  e.received_at = nowIso(); e.ingested_from = 'hub ' + COLLECTOR_VERSION;
  const cur = await getJson(env, 'latest/ships.json');
  let bytes, published = true;
  if (cur && cur.retrieved_at && Date.parse(cur.retrieved_at) > Date.parse(e.retrieved_at)) {   // a Mac sample landed meanwhile: it wins
    const stamp = isoMinute(scheduledMs); published = false;
    bytes = await putJson(env, `snapshots/${layer}/${stamp}.json`, e);
    await putJson(env, `cells/${layer}/${stamp}.json`, { ...e, records: undefined, record_fields: undefined, record_format: undefined });
  } else bytes = await writeSnapshot(env, layer, scheduledMs, e);
  await logRun(env, layer, scheduledMs, status, 200, L.rows.length, bytes, `cloud fallback${published ? '' : ' (archive only: newer home sample)'} messages=${L.messages} vessels=${L.rows.length} flowing=${flowingS.toFixed(1)}s`);
  await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status, published, vessels: L.rows.length, messages: L.messages });
  return `ships-fallback:${status} (${L.rows.length} vessels${published ? '' : ', archive only'})`;
}

// ---------------------------------------------------------------- CelesTrak GP — satellites (MODEL tier: element sets for propagation, not observations)

/* CelesTrak "active" GP element sets (OMM-keyword CSV). The hub stores the file as received and validated; the page
*  propagates it. Viewers never touch CelesTrak. Request strategy (REGISTER, CelesTrak row): at most one stamp check per
*  slot, a data request only when CelesTrak's "Current as of" stamp is newer than the stamp of our last successful download,
*  one attempt, no retries inside a slot; any non-200 or failed validation is recorded and the previous valid file is kept
*  with its own times. Scheduled only when env.SATELLITES_ENABLED === '1' (odd UTC hours on the :07 job ≈ 43 min after
*  CelesTrak's even-hour refresh); /admin/run/satellites runs it once by hand under the same rules. */
const SAT = {
  stampUrl: 'https://celestrak.org/NORAD/elements/',
  dataUrl: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=csv',
  header: 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT',
  minRows: 1000, minFractionOfPrevious: 0.8, maxBytes: 8 * 1024 * 1024, sampleLines: 200,
  stateKey: 'state/satellites.json', csvPrefix: 'latest/satellites-elements-', metaKey: 'latest/satellites.json',   // ONE current validated file: latest/satellites-elements-<sha12>.csv
};
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

/** "Current as of 2026 Nov 02 14:24:24 UTC" → ISO, or null. Pure; tested in satellites-hub.test.mjs. */
function parseCelestrakStamp(html) {
  const m = /Current as of\s+(\d{4})\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+UTC/.exec(html || '');
  if (!m || !(m[2] in MONTHS)) return null;
  return new Date(Date.UTC(+m[1], MONTHS[m[2]], +m[3], +m[4], +m[5], +m[6])).toISOString();
}

/** Structural validation of the GP CSV, cheap enough for a Worker: exact header, complete final line, row count against
 *  floors, and a field-count check on evenly spaced sample lines (not every line — stated as a sample in the result). */
function validateGpCsv(text, previousRows) {
  const problems = [];
  if (typeof text !== 'string' || !text.length) return { ok: false, rows: 0, problems: ['empty body'] };
  if (text.length > SAT.maxBytes) problems.push(`body ${text.length} B exceeds ${SAT.maxBytes} B`);
  const firstNl = text.indexOf('\n');
  const header = (firstNl < 0 ? text : text.slice(0, firstNl)).replace(/\r$/, '');
  if (header !== SAT.header) problems.push('unexpected header: ' + header.slice(0, 120));
  if (!text.endsWith('\n')) problems.push('final line incomplete (no trailing newline)');
  const starts = [];
  for (let i = firstNl; i >= 0 && i < text.length - 1; i = text.indexOf('\n', i + 1)) starts.push(i + 1);
  const rows = starts.length;
  if (rows < SAT.minRows) problems.push(`only ${rows} rows (floor ${SAT.minRows})`);
  if (previousRows && rows < previousRows * SAT.minFractionOfPrevious) problems.push(`only ${rows} rows vs previous valid ${previousRows} (floor ${Math.round(SAT.minFractionOfPrevious * 100)} %)`);
  let sampled = 0, badFields = 0;
  const step = Math.max(1, Math.floor(rows / SAT.sampleLines));
  for (let k = 0; k < rows; k += step) {
    const s = starts[k], e = text.indexOf('\n', s), line = text.slice(s, e < 0 ? text.length : e).replace(/\r$/, '');
    sampled++; if (line.split(',').length !== 17 || !/^\d{4}-\d{2}-\d{2}T/.test(line.split(',')[2] || '')) badFields++;
  }
  if (badFields) problems.push(`${badFields} of ${sampled} sampled lines malformed`);
  return { ok: problems.length === 0, rows, sampled_lines: sampled, problems };
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function collectSatellites(env, scheduledMs) {
  const layer = 'satellites', started = Date.now();
  const state = (await getJson(env, SAT.stateKey)) || {};
  const attempt = { at: nowIso(), scheduled_for: new Date(scheduledMs).toISOString() };
  const record = async (status, http, note, extra = {}) => {
    const next = { ...state, last_attempt: { ...attempt, status, http, note, ...extra } };
    await putJson(env, SAT.stateKey, next);
    await logRun(env, layer, started, status, http, extra.rows || 0, extra.bytes || 0, note);
    return `${status}: ${note}`;
  };
  // 1. stamp check (one request)
  let st;
  try { st = await fetchText(SAT.stampUrl); } catch (e) { return record('down', 0, 'stamp fetch failed: ' + String(e).slice(0, 160)); }
  if (st.status !== 200) return record('down', st.status, 'stamp page HTTP ' + st.status + ': ' + st.text.slice(0, 300));
  const stamp = parseCelestrakStamp(st.text);
  if (!stamp) return record('down', 200, 'stamp not found on ' + SAT.stampUrl);
  attempt.source_stamp = stamp;
  if (state.last_success && state.last_success.source_stamp && stamp <= state.last_success.source_stamp)
    return record('ok', 200, `no newer data (stamp ${stamp}; last success stamp ${state.last_success.source_stamp}); no data request made`, { data_request: false });
  // 2. data request (one attempt)
  let d;
  try { d = await fetchText(SAT.dataUrl); } catch (e) { return record('down', 0, 'data fetch failed: ' + String(e).slice(0, 160), { data_request: true }); }
  if (d.status !== 200) return record('down', d.status, `data HTTP ${d.status}: ${d.text.slice(0, 600)}`, { data_request: true });
  // 3. validate before publishing anything
  const v = validateGpCsv(d.text, state.last_success && state.last_success.rows);
  if (!v.ok) return record('down', 200, 'validation failed: ' + v.problems.join('; ').slice(0, 400), { data_request: true, rows: v.rows, bytes: d.text.length });
  const sha = await sha256Hex(d.text);
  const retrievedAt = nowIso();
  // 4. publish (MVP storage: one current validated snapshot). New CSV under its own key → meta pointing at it →
  //    only then delete the previous CSV. A reader always finds the CSV its meta describes; a failure before the meta
  //    write leaves the previous meta + CSV serving with their original times (the orphan new key is removed).
  const prevMeta = await getJson(env, SAT.metaKey);
  const csvKey = SAT.csvPrefix + sha.slice(0, 12) + '.csv';
  await env.R2.put(csvKey, d.text, { httpMetadata: { contentType: 'text/csv; charset=utf-8' }, customMetadata: { sha256: sha, retrieved_at: retrievedAt, source_stamp: stamp } });
  const meta = {
    schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer, tier: 'model',
    retrieved_at: retrievedAt, source_stamp: stamp, source_status: 'ok', stale_after_s: STALE_AFTER_S[layer],
    elements: { path: '/elements/satellites', key: csvKey, format: 'OMM-keyword CSV (CelesTrak GP)', rows: v.rows, bytes: d.text.length, sha256: sha, header: SAT.header },
    validation: { structural: 'header exact; final line complete; row floors passed', sampled_lines: v.sampled_lines, completeness: 'not established — the response carries no row count or checksum' },
    source: { name: 'CelesTrak', url: SAT.dataUrl, group: 'active', origin: 'US Space Force 18th/19th Space Defense Squadrons, via Space-Track.org' },
    quantity: 'general-perturbations mean element sets for propagation (SGP4); positions drawn from them are computed, not observed',
    map_layer: true,
  };
  try { await putJson(env, SAT.metaKey, meta); }
  catch (e) { try { if (!prevMeta || prevMeta.elements.key !== csvKey) await env.R2.delete(csvKey); } catch (_) {} return record('down', 200, 'publication failed (meta write): ' + String(e).slice(0, 160), { data_request: true }); }
  if (prevMeta && prevMeta.elements && prevMeta.elements.key && prevMeta.elements.key !== csvKey) { try { await env.R2.delete(prevMeta.elements.key); } catch (e) { console.log('satellites: previous CSV not deleted', String(e)); } }
  state.last_success = { at: retrievedAt, source_stamp: stamp, rows: v.rows, bytes: d.text.length, sha256: sha };
  return record('ok', 200, `published ${v.rows} element sets, ${d.text.length} B, stamp ${stamp}`, { data_request: true, rows: v.rows, bytes: d.text.length });
}

// ---------------------------------------------------------------- Space-Track probe (0.2.3) — one bounded check, by hand only

/* Answers one question: can this Worker reach space-track.org, log in with Chad's account, and receive the GP query?
*  Not a collector: not in JOBS, no cron, nothing published, no element data stored. Guards, all checked BEFORE any
*  network call: admin key; both secrets present; UTC minute inside Space-Track's off-peak advice (10–20 min either
*  side of :00/:30 ⇒ minutes 10–20 or 40–50); no earlier probe attempt in the last 60 min (any outcome — GP ≤ 1/hour).
*  Requests: login (POST ajaxauth/login) → ONE GP query (Space-Track's documented recommended query, CSV) → logout.
*  No retries. 0.2.4: the body is read once as bytes (no per-byte JS work) and staged privately at staging/spacetrack-gp.csv
*  (never served; no public pointer moves). The result, never the credentials or cookies, is kept in
*  state/spacetrack-probe.json and returned. */
const ST = {
  base: 'https://www.space-track.org',
  // 0.2.5: /predicates/ (documented REST predicate: comma-separated list of predicates to return) — only the 17 propagation
  // columns + OBJECT_TYPE that orbBuild needs. Same population filter as Space-Track's recommended query.
  gpPath: '/basicspacedata/query/class/gp/decay_date/null-val/epoch/%3Enow-10/predicates/OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT,OBJECT_TYPE/emptyresult/show/format/csv',
  stateKey: 'state/spacetrack-probe.json', stagingKey: 'staging/spacetrack-gp.csv', minGapMs: 60 * 60e3, maxBytes: 64 * 1024 * 1024,
};
function stOffPeak(ms) { const m = new Date(ms).getUTCMinutes(); return (m >= 10 && m <= 20) || (m >= 40 && m <= 50); }
function stCookies(headers) {
  const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  return list.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
}
async function probeSpacetrack(env, nowMs) {
  if (!env.SPACETRACK_USER || !env.SPACETRACK_PASS) return { refused: 'SPACETRACK_USER / SPACETRACK_PASS not set — no request made' };
  if (!stOffPeak(nowMs)) return { refused: `UTC minute ${new Date(nowMs).getUTCMinutes()} is outside the off-peak windows (minutes 10–20, 40–50) — no request made` };
  const prev = await getJson(env, ST.stateKey);
  if (prev && prev.at && nowMs - Date.parse(prev.at) < ST.minGapMs) return { refused: `an earlier probe ran at ${prev.at} (< 60 min ago) — no request made`, previous: prev };
  const out = { at: new Date(nowMs).toISOString(), collector_version: COLLECTOR_VERSION, query: ST.gpPath, steps: {} };
  await putJson(env, ST.stateKey, { ...out, status: 'started' });   // claim the hour before the first request, so a crash cannot allow a second one
  const t0 = Date.now();
  let cookie = '';
  try {
    const body = new URLSearchParams({ identity: env.SPACETRACK_USER, password: env.SPACETRACK_PASS });
    const r = await fetch(ST.base + '/ajaxauth/login', { method: 'POST', body, redirect: 'manual', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' } });
    const txt = (await r.text()).slice(0, 200);
    cookie = stCookies(r.headers);
    const failed = /"Login"\s*:\s*"Failed"/i.test(txt);
    out.steps.login = { http: r.status, ms: Date.now() - t0, session_cookie: cookie ? 'received' : 'none', body: failed ? txt : (txt ? '(non-empty, not shown)' : '(empty)') };
    out.auth = !failed && r.status === 200 && !!cookie;
  } catch (e) { out.steps.login = { error: String(e).slice(0, 200), ms: Date.now() - t0 }; out.auth = false; }
  if (out.auth) {
    const t1 = Date.now();
    try {
      const r = await fetch(ST.base + ST.gpPath, { headers: { 'User-Agent': UA, Cookie: cookie } });
      // 0.2.4: no per-byte work in JS. Body read once as bytes and staged PRIVATELY in R2 (never served, no public
      // pointer moves); only the first 400 bytes are decoded, for the header.
      const buf = await r.arrayBuffer();
      const head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(400, buf.byteLength)));
      const firstLine = head.split('\n')[0].replace(/\r$/, '');
      out.steps.gp = { http: r.status, ms: Date.now() - t1, content_type: r.headers.get('content-type'), content_length: r.headers.get('content-length'),
        bytes: buf.byteLength, header: firstLine.slice(0, 300), empty_body: buf.byteLength === 0, no_results_marker: /NO RESULTS RETURNED/.test(head),
        truncated_at_cap: buf.byteLength > ST.maxBytes };
      if (r.status === 200 && buf.byteLength > 0 && buf.byteLength <= ST.maxBytes) {
        const t2 = Date.now();
        await env.R2.put(ST.stagingKey, buf, { httpMetadata: { contentType: 'text/csv; charset=utf-8' }, customMetadata: { retrieved_at: out.at, bytes: String(buf.byteLength) } });
        out.steps.staged = { key: ST.stagingKey, ms: Date.now() - t2, note: 'private staging copy; not served; no public pointer changed' };
      }
    } catch (e) { out.steps.gp = { error: String(e).slice(0, 200), ms: Date.now() - t1 }; }
    try { const r = await fetch(ST.base + '/ajaxauth/logout', { headers: { 'User-Agent': UA, Cookie: cookie } }); await r.text(); out.steps.logout = { http: r.status }; }
    catch (e) { out.steps.logout = { error: String(e).slice(0, 120) }; }
  }
  const gp = out.steps.gp || {};
  out.status = !out.auth ? 'auth_or_reach_failed' : gp.http === 200 && gp.bytes > 0 && !gp.truncated_at_cap && out.steps.staged ? 'ok' : 'gp_failed';
  out.wall_ms = Date.now() - t0;
  await putJson(env, ST.stateKey, out);
  return out;
}

// ---------------------------------------------------------------- Orbital (Space-Track GP) — pure parse/validate/classify (offline-tested; NOT wired to any job yet)

/* Input: Space-Track GP CSV (unquoted header, every field quoted, LF line ends, no field contains '","' — measured 3 Nov).
*  Output: a compact CSV with the 17 CelesTrak GP columns the page already propagates + CLASS, and counts.
*  Classes (SPEC-orbital-layers): by OBJECT_TYPE first; payloads split by CelesTrak OPS_STATUS_CODE only when a status
*  map is supplied and fresh, otherwise every payload is 'payload_status_unavailable' (never guessed). Unknown status
*  never becomes inactive. Truncation that ends on a complete row is NOT detectable from the body (no row count or
*  Content-Length from Space-Track); the row floors are the only guard against it, and the meta says so. */
const ORB = {
  out: ['OBJECT_NAME','OBJECT_ID','EPOCH','MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','EPHEMERIS_TYPE','CLASSIFICATION_TYPE','NORAD_CAT_ID','ELEMENT_SET_NO','REV_AT_EPOCH','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'],
  types: { 'PAYLOAD': 1, 'ROCKET BODY': 1, 'DEBRIS': 1, 'UNKNOWN': 1, 'TBA': 1 },
  active: { '+': 1, 'P': 1, 'B': 1, 'S': 1, 'X': 1 },
  minRows: 20000, minFractionOfPrevious: 0.9,
};
const ORB_CLASSES = ['active', 'inactive', 'rocket_body', 'debris', 'unknown_type', 'payload_status_unknown', 'payload_unmatched', 'payload_status_unavailable'];

function orbClassify(type, status) {   // status: undefined = no map; null = no match in the map; string = code ('' = blank)
  if (type === 'ROCKET BODY') return 'rocket_body';
  if (type === 'DEBRIS') return 'debris';
  if (type !== 'PAYLOAD') return 'unknown_type';
  if (status === undefined) return 'payload_status_unavailable';
  if (status === null) return 'payload_unmatched';
  if (ORB.active[status]) return 'active';
  if (status === '-') return 'inactive';
  return 'payload_status_unknown';   // '', '?', 'D' or anything else: counted, never folded into inactive
}

/** text → { ok, problems, rows, counts, csv }. statusMap: Map<norad string, code> or null. Pure. */
function orbBuild(text, statusMap, previousRows) {
  const problems = [];
  if (typeof text !== 'string' || !text.length) return { ok: false, rows: 0, problems: ['empty body'] };
  if (!text.endsWith('\n')) problems.push('final line incomplete (no trailing newline)');
  const nl = text.indexOf('\n');
  const head = text.slice(0, nl).replace(/\r$/, '').split(',');
  const col = Object.fromEntries(head.map((h, i) => [h, i]));
  const need = [...ORB.out, 'OBJECT_TYPE'];
  const missing = need.filter(h => !(h in col));
  if (missing.length) return { ok: false, rows: 0, problems: ['header missing ' + missing.join(',')] };
  const idx = ORB.out.map(h => col[h]), iType = col.OBJECT_TYPE, iNorad = col.NORAD_CAT_ID, iEpoch = col.EPOCH, nf = head.length;
  const counts = Object.fromEntries(ORB_CLASSES.map(c => [c, 0]));
  const seen = new Set(); const out = [ORB.out.join(',') + ',CLASS'];
  let rows = 0, badShape = 0, badEpoch = 0, badType = 0, dup = 0, comma = 0;
  for (let s = nl + 1; s < text.length; ) {
    let e = text.indexOf('\n', s); if (e < 0) e = text.length;
    let line = text.slice(s, e); s = e + 1;
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line) continue;
    rows++;
    if (line[0] !== '"' || line[line.length - 1] !== '"') { badShape++; continue; }
    const f = line.slice(1, -1).split('","');
    if (f.length !== nf) { badShape++; continue; }
    const type = f[iType], norad = f[iNorad];
    if (!ORB.types[type]) badType++;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(f[iEpoch])) badEpoch++;
    if (seen.has(norad)) dup++; seen.add(norad);
    const vals = idx.map(i => f[i]);
    for (const v of vals) if (v.indexOf(',') >= 0) { comma++; break; }
    const cls = orbClassify(type, statusMap ? (statusMap.has(norad) ? statusMap.get(norad) : null) : undefined);
    counts[cls]++;
    out.push(vals.join(',') + ',' + cls);
  }
  if (badShape) problems.push(`${badShape} rows not ${nf} quoted fields`);
  if (badType) problems.push(`${badType} rows with an unexpected OBJECT_TYPE`);
  if (badEpoch) problems.push(`${badEpoch} rows with a malformed EPOCH`);
  if (dup) problems.push(`${dup} duplicate NORAD_CAT_ID`);
  if (comma) problems.push(`${comma} output values contain a comma`);
  if (rows < ORB.minRows) problems.push(`only ${rows} rows (floor ${ORB.minRows})`);
  if (previousRows && rows < previousRows * ORB.minFractionOfPrevious) problems.push(`only ${rows} rows vs previous valid ${previousRows} (floor ${Math.round(ORB.minFractionOfPrevious * 100)} %)`);
  return { ok: problems.length === 0, rows, counts, problems, csv: problems.length ? null : out.join('\n') + '\n' };
}
export { DUSTRGB, dustLatest, dustKeyOf, jpegSize, pngInfo, dustServed, dustFetch, dustFail, collectDustRgb, dustRoute, JOBS, OCEANHEAT_REVISIONS, OCEANHEAT_CURRENT, OCEANHEAT_CACHE_OK, oceanHeatPin, oceanHeatRoute, oceanHeatFile, SKY_REVISIONS, SKY_CURRENT, skyPin, skyRoute, skyCatalogue, ARTS, artsSnapshot, TIMELINE, TIMELINE_REVISIONS, TIMELINE_LEGACY, TIMELINE_CURRENT, timelinePin, timelineRoute, timelineCatalogue, kpStatus, KP, shipsReason, collectSwpc, collectUsgs, fvProbeR2, fvFetchToRaw, cellId, fvWork, fvRegister, fvProcess, fvDownForInput, fvDownNoInput, fvCheckpointNew, fvPlaceSection, FV, FVSQL, fvOrder, fvCas, fvWriter, fvLines, fvHasher, collectFirmsV2, fvPublish, fvPlaceFirms, fvPlace, fvBoundedGunzip, fvCheckpointCandidate, firmsParse, firmsRowProblem, checkpointCoverage, backfillCoverage, FIRMS_MAX_PARSE_BYTES, orbBuild, orbClassify, ORB_CLASSES, hourlyBatch, SHIPS_LOOKBACK_H, driftBuild, csvFields, collectDrifters, PLASTIC, plDay, unzipText, odvSamples, plasticValidate, plasticVerify, collectPlastic, versionParts, stripVolatile, firesDaily, cellAreaKm2, validCell, histCheckpointsDue, histCheckpointOne, listSnapshots, historyState, archiveHealth, HIST_GRACE_MS, HEALTH, health, healthDeadline, healthNote, redactText, redactStatus, tAt, histVersion, histQuakes, histDrifters, histSeaIce, histOrbital, HIST, PLACE, placeCache };

// ---------------------------------------------------------------- Orbital job (0.3.0) — Space-Track GP → validated, classified element file

/* Two-hourly, on the forest cron's :41 tick in ODD UTC hours (Space-Track: GP ≤ 1/hour at a random minute away from
*  :00/:30), only when env.ORBITAL_ENABLED === '1'. One attempt per slot: login → ONE trimmed GP request (ST.gpPath,
*  18 columns) → logout. No retries. Shares the ≥ 60-min guard with the probe (state/spacetrack-probe.json) so the two
*  can never exceed one GP request an hour between them.
*  Storage rule (MVP): validate + build → new CSV under its own key → meta pointing at it → only then delete the previous
*  CSV. Any failure (login, HTTP, empty, validation, publication) is recorded and the previous meta + CSV keep serving
*  with their original times; an orphan from a failed meta write is deleted. Nothing is written before validation.
*  Payload operational status (CelesTrak SATCAT) is PENDING: no status map is used, every payload is
*  'payload_status_unavailable'. Completeness is UNVERIFIED and the meta says so. */
const ORBF = { metaKey: 'latest/orbital.json', csvPrefix: 'latest/orbital-elements-', stateKey: 'state/orbital.json' };
async function collectOrbital(env, scheduledMs, manual) {
  const layer = 'orbital', started = Date.now();
  const state = (await getJson(env, ORBF.stateKey)) || {};
  const probe = await getJson(env, ST.stateKey);
  const record = async (status, http, note, extra = {}) => {
    await putJson(env, ORBF.stateKey, { ...state, last_attempt: { at: new Date(started).toISOString(), scheduled_for: new Date(scheduledMs).toISOString(), manual: !!manual, status, http, note, ...extra } });
    await logRun(env, layer, started, status, http, extra.rows || 0, extra.bytes || 0, note);
    return `${status}: ${note}`;
  };
  if (!env.SPACETRACK_USER || !env.SPACETRACK_PASS) return record('down', 0, 'SPACETRACK_USER / SPACETRACK_PASS not set — no request made');
  if (!stOffPeak(started)) return record('down', 0, `UTC minute ${new Date(started).getUTCMinutes()} outside off-peak windows — no request made`);
  const lastGp = [state.last_attempt && state.last_attempt.gp_request ? state.last_attempt.at : null, probe && probe.at].filter(Boolean).map(Date.parse);
  if (lastGp.some(t => started - t < ST.minGapMs)) return record('down', 0, 'a GP request was made < 60 min ago — no request made');
  // 1. login
  let cookie = '';
  try {
    const r = await fetch(ST.base + '/ajaxauth/login', { method: 'POST', body: new URLSearchParams({ identity: env.SPACETRACK_USER, password: env.SPACETRACK_PASS }), redirect: 'manual', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' } });
    const txt = (await r.text()).slice(0, 200); cookie = stCookies(r.headers);
    if (r.status !== 200 || !cookie || /"Login"\s*:\s*"Failed"/i.test(txt)) return record('down', r.status, 'login failed: HTTP ' + r.status + (/"Login"/.test(txt) ? ' ' + txt : ''));
  } catch (e) { return record('down', 0, 'login fetch failed: ' + String(e).slice(0, 160)); }
  // 2. ONE GP request
  let text = '', http = 0;
  try {
    const r = await fetch(ST.base + ST.gpPath, { headers: { 'User-Agent': UA, Cookie: cookie } });
    http = r.status; text = await r.text();
  } catch (e) { text = ''; http = 0; state.gp_error = String(e).slice(0, 160); }
  try { const r = await fetch(ST.base + '/ajaxauth/logout', { headers: { 'User-Agent': UA, Cookie: cookie } }); await r.text(); } catch (_) {}
  if (http !== 200) return record('down', http, 'GP HTTP ' + http + (state.gp_error ? ' ' + state.gp_error : ''), { gp_request: true });
  if (!text.length) return record('down', 200, 'GP empty body', { gp_request: true });
  // 3. validate + build (nothing written before this passes)
  const prevRows = state.last_success && state.last_success.rows;
  const b = orbBuild(text, null, prevRows);
  if (!b.ok) return record('down', 200, 'validation failed: ' + b.problems.join('; ').slice(0, 400), { gp_request: true, rows: b.rows, bytes: text.length });
  const sha = await sha256Hex(b.csv);
  const retrievedAt = new Date(started).toISOString();
  // 4. publish: CSV → meta → delete previous CSV
  const prevMeta = await getJson(env, ORBF.metaKey);
  const csvKey = ORBF.csvPrefix + sha.slice(0, 12) + '.csv';
  try { await env.R2.put(csvKey, b.csv, { httpMetadata: { contentType: 'text/csv; charset=utf-8' }, customMetadata: { sha256: sha, retrieved_at: retrievedAt } }); }
  catch (e) { return record('down', 200, 'publication failed (csv write): ' + String(e).slice(0, 160), { gp_request: true }); }
  const meta = {
    schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer, tier: 'model', retrieved_at: retrievedAt, source_status: 'ok', stale_after_s: STALE_AFTER_S[layer],
    elements: { path: '/elements/orbital', key: csvKey, rows: b.rows, bytes: b.csv.length, sha256: sha, columns: ORB.out.concat('CLASS'), source_bytes: text.length },
    counts: b.counts,
    classification: { by: 'OBJECT_TYPE first (Space-Track GP)', payload_status: 'pending — CelesTrak SATCAT operational status not used yet; every payload is payload_status_unavailable', classes: ORB_CLASSES },
    validation: { checks: 'every row: 18 quoted fields, OBJECT_TYPE known, EPOCH ISO, NORAD unique; final newline; rows >= ' + ORB.minRows + ' and >= ' + Math.round(ORB.minFractionOfPrevious * 100) + ' % of the previous valid file',
      completeness: 'unverified — Space-Track returns no row count or Content-Length for CSV; a response cut cleanly between rows above the floors would pass' },
    source: { name: 'Space-Track.org', query: ST.gpPath, filter: 'not decayed, epoch within 10 days (Space-Track recommended); older elements filtered upstream, outside these counts',
      origin: 'US Space Force 18th/19th Space Defense Squadrons', citation: 'Space-Track.org (www.space-track.org)' },
    quantity: 'general-perturbations mean element sets for propagation (SGP4); positions drawn from them are computed, not observed',
    map_layer: true,
  };
  try { await putJson(env, ORBF.metaKey, meta); }
  catch (e) { try { if (!prevMeta || prevMeta.elements.key !== csvKey) await env.R2.delete(csvKey); } catch (_) {} return record('down', 200, 'publication failed (meta write): ' + String(e).slice(0, 160), { gp_request: true }); }
  if (prevMeta && prevMeta.elements && prevMeta.elements.key && prevMeta.elements.key !== csvKey) { try { await env.R2.delete(prevMeta.elements.key); } catch (e) { console.log('orbital: previous CSV not deleted', String(e)); } }
  await hist(env, 'orbital-version', () => histVersion(env, layer, meta)); await hist(env, 'orbital-population', () => histOrbital(env, meta));
  state.last_success = { at: retrievedAt, rows: b.rows, bytes: b.csv.length, sha256: sha };
  const c = b.counts;
  return record('ok', 200, `published ${b.rows} objects (payload ${c.payload_status_unavailable + c.active + c.inactive + c.payload_status_unknown + c.payload_unmatched}, rocket body ${c.rocket_body}, debris ${c.debris}, unknown type ${c.unknown_type}), ${b.csv.length} B from ${text.length} B`, { gp_request: true, rows: b.rows, bytes: b.csv.length });
}

// ---------------------------------------------------------------- History (0.5.0) — OFF unless HISTORY_ENABLED=1
/* Proposal rev 2 (reviews/2026-11-05-place-view-and-history.md). Nothing here runs unless the Worker variable
 * HISTORY_ENABLED is exactly '1' (Chad's go). Every step is wrapped: a history failure never stops or changes publishing.
 * Three kinds of retention, kept apart:
 *  - VERSIONS (small layers + plastic): an object is kept only when the source DATA or our PROCESSING/CHECK results
 *    changed; a repeat retrieval of the same content only updates that version's retrieval log (count, last time, run).
 *  - CHECKPOINTS (firms, usgs): when the UTC day changes, the last published snapshot of the previous day is kept,
 *    labelled with its actual cutoff (its own retrieved_at). Intermediate versions of a day are NOT kept.
 *  - MEASUREMENTS (D1): quake revisions (append-only on USGS `updated`), fires per cell per day (as of the last pull of
 *    that day), drifter fixes (sampled hourly; identical buoy+time+values repeats ignored, corrections kept),
 *    sea-ice values per data date (corrections kept), orbital population per published element file.
 * Every kept row/object carries run_ref (<layer>@<retrieved_at>) and the collector version. Ships: aggregates only. */
const HIST = { versions: 'archive/versions/', checkpoints: 'archive/checkpoints/', checkpointLayers: ['firms', 'usgs'],
  volatile: new Set(['retrieved_at', 'scheduled_for', 'source_age_s', 'collector_version', 'schema_version', 'stale_after_s', 'window_end', 'citation', 'interruptions', 'raw', 'raw_bytes', 'fetched']) };
const histOn = env => env.HISTORY_ENABLED === '1';
const runRef = (layer, retrievedAt) => layer + '@' + retrievedAt;
async function gzipText(text) { return new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); }
/** Drop fields that change on every retrieval without the content changing (times, versions, our own fetch metadata). Pure. */
function stripVolatile(x) {
  if (Array.isArray(x)) return x.map(stripVolatile);
  if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) if (!HIST.volatile.has(k)) o[k] = stripVolatile(x[k]); return o; }
  return x;
}
/** Split an envelope into the source's data and our processing results, per layer. Pure; tested in history-hub.test.mjs. */
function versionParts(layer, e) {
  if (layer === 'plastic') {
    const f = e.record_fields || [], D = ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'method', 'mesh_mm', 'depth_m'].map(k => f.indexOf(k)), P = ['id', 'check', 'original'].map(k => f.indexOf(k));
    return { data: { rows: (e.records || []).map(r => D.map(i => r[i])), noaa_count: e.noaa_count, data_last_edit: e.source && e.source.data_last_edit },
      proc: { checks: (e.records || []).map(r => P.map(i => r[i])), verification: stripVolatile(e.verification || null), refused: e.refused || null } };
  }
  if (layer === 'orbital') return { data: { sha256: e.elements && e.elements.sha256, rows: e.elements && e.elements.rows }, proc: stripVolatile({ counts: e.counts, classification: e.classification }) };
  const { records, cells, ...rest } = e;
  return { data: { records: records || null }, proc: stripVolatile({ cells: cells || null, ...rest }) };
}
async function histVersion(env, layer, e) {
  const { data, proc } = versionParts(layer, e);
  const dh = await sha256Hex(JSON.stringify(data)), ph = await sha256Hex(JSON.stringify(proc));
  const at = e.retrieved_at, ref = runRef(layer, at);
  const cur = await env.DB.prepare('SELECT id, data_hash, proc_hash FROM archive_versions WHERE layer = ? ORDER BY id DESC LIMIT 1').bind(layer).first();
  if (cur && cur.data_hash === dh && cur.proc_hash === ph) {
    await env.DB.prepare('UPDATE archive_versions SET last_retrieved_at = ?, last_run_ref = ?, retrievals = retrievals + 1 WHERE id = ?').bind(at, ref, cur.id).run();
    return 'repeat';
  }
  const change = !cur ? 'first' : (cur.data_hash !== dh && cur.proc_hash !== ph) ? 'data+processing' : cur.data_hash !== dh ? 'data' : 'processing';
  const key = `${HIST.versions}${layer}/${at.replace(/[:.]/g, '-')}-${dh.slice(0, 12)}-${ph.slice(0, 12)}.json.gz`;
  const gz = await gzipText(JSON.stringify(e));
  await env.R2.put(key, gz, { httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' }, customMetadata: { data_hash: dh, proc_hash: ph, run_ref: ref, collector_version: COLLECTOR_VERSION, change } });
  await env.DB.prepare('INSERT INTO archive_versions (layer, data_hash, proc_hash, change, r2_key, bytes, first_retrieved_at, last_retrieved_at, retrievals, first_run_ref, last_run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?,1,?,?,?)')
    .bind(layer, dh, ph, change, key, gz.length, at, at, ref, ref, COLLECTOR_VERSION).run();
  return change;
}
/** Fires per cell for one UTC day, from the last snapshot published for that day. Pure. */
function firesDaily(e) {
  const f = e.record_fields || [], iLat = f.indexOf('lat'), iLng = f.indexOf('lng'), iFrp = f.indexOf('frp_mw'), iDn = f.indexOf('daynight');
  const by = {};
  for (const r of e.records || []) {
    const id = cellId(r[iLat], r[iLng]); const c = by[id] || (by[id] = { n: 0, frpSum: null, frpMax: null, frpN: 0, day: 0, night: 0 });
    c.n++; const v = r[iFrp];
    // sum and max cover ONLY detections with a valid FRP (frpN of them); none valid → null (not provided), never 0; a reported 0 stays 0
    if (typeof v === 'number' && Number.isFinite(v)) { c.frpSum = (c.frpSum ?? 0) + v; c.frpN++; c.frpMax = c.frpMax === null ? v : Math.max(c.frpMax, v); }
    if (r[iDn] === 'D') c.day++; else if (r[iDn] === 'N') c.night++;
  }
  return by;
}
/** Daily checkpoints (firms, usgs) — STATELESS and safe under overlapping runs (rev 5, after GPT's re-check).
 * There is no mutable pointer to roll back. Durable facts only, all in D1 and all written idempotently:
 *   history_activity(layer, day)       — "history ran for this layer on this UTC day" (INSERT OR IGNORE, every run)
 *   archive_checkpoints(layer, day)    — the completion marker, written LAST
 *   archive_gaps(layer, day)           — a day that cannot be completed, with the reason
 * A day D is due when history ran on D, D is CLOSED (now ≥ end of D + grace), and it has neither a marker nor a gap.
 * Its input is chosen afresh every attempt: list the retained snapshots/<layer>/ objects (kept 2 days) and take the one
 * whose FULL retrieved_at is the latest on D — so a failed write, a late run with an earlier timestamp, or an overlapping
 * run cannot point it at the wrong file. Two overlapping attempts choose the same input and write the same bytes/rows.
 * Completed work is recognised first (marker), so an expired input never turns a finished day into "lost". */
const HIST_GRACE_MS = 30 * 60e3;   // a closed day gets 30 min for any in-flight run of that day to finish publishing
async function listSnapshots(env, layer) {
  const out = []; let cursor;
  do {
    const r = await env.R2.list({ prefix: `snapshots/${layer}/`, cursor, include: ['customMetadata'] });
    for (const o of r.objects || []) {
      let at = o.customMetadata && o.customMetadata.retrieved_at;
      if (!at && !(layer === 'firms' && o.size > FV.legacyMaxJson)) { const g = await env.R2.get(o.key); if (g) { try { at = (await g.json()).retrieved_at; } catch (_) {} } }   // objects written before 0.5.0 carry no metadata (firms: never parsed above L_json)
      if (at) out.push({ key: o.key, retrieved_at: at, size: o.size });
    }
    cursor = r.truncated ? r.cursor : undefined;
  } while (cursor);
  return out;
}
const CHECKPOINT_CADENCE_S = { firms: 900, usgs: 300 };   // scheduled cadence; a cutoff older than 2 × cadence + 5 min at day end is stale
/** What a checkpoint's input covered. Pure apart from one collector_runs read. Never rewrites the checkpoint. */
async function checkpointCoverage(env, layer, day, cutoff, records, fields, nowMs, withCheckpoint, lastObsKnown) {
  const dayEnd = Date.parse(day + 'T00:00:00Z') + 86400e3, iObs = (fields || []).indexOf('observed_at');
  let lastObs = lastObsKnown === undefined ? null : lastObsKnown;   // v2: from the sidecar / checkpoint metadata, never by parsing the records
  if (lastObsKnown === undefined && iObs >= 0) for (const r of records || []) { const o = r[iObs]; if (typeof o === 'string' && (!lastObs || o > lastObs)) lastObs = o; }
  /* Which failures belong after the selected snapshot (rev 2, GPT 6 Nov). Two clocks, never compared with each other:
   *   collector_runs.started_at  = the run's SCHEDULED time  → decides the DAY a run belongs to (its slot): [day start, day end)
   *   collector_runs.finished_at = when the run actually ended → compared with the snapshot's retrieval time (also an actual time)
   * A failure belongs after the snapshot when it ended after the snapshot was retrieved — including a run scheduled earlier that
   * overlapped and failed later, and a day-D run that failed after midnight. Conservative: such a failure is disclosed, not hidden. */
  const fails = (await env.DB.prepare("SELECT started_at, finished_at, note FROM collector_runs WHERE layer = ? AND status != 'ok' AND started_at >= ? AND started_at < ? AND finished_at > ? ORDER BY finished_at")
    .bind(layer, day + 'T00:00:00.000Z', new Date(dayEnd).toISOString(), cutoff).all()).results || [];
  const reasons = [...new Set(fails.map(f => String(f.note || '').replace(/\(\d+ bytes > \d+\)/, '(size > limit)').replace(/\d+ bytes/, 'N bytes').slice(0, 120)))].slice(0, 5);
  const age = Math.round((dayEnd - Date.parse(cutoff)) / 1000), cad = CHECKPOINT_CADENCE_S[layer] || 3600;
  return { layer, day, cutoff, last_observation_at: lastObs, input_age_at_day_end_s: age, failed_runs_after_cutoff: fails.length,
    failure_first_at: fails.length ? fails[0].finished_at : null, failure_last_at: fails.length ? fails[fails.length - 1].finished_at : null,   // actual end times
    failure_reasons: reasons, input_status: fails.length || age > 2 * cad + 300 ? 'stale' : 'current',
    assessed_at: new Date(nowMs).toISOString(), assessed_with_checkpoint: withCheckpoint ? 1 : 0 };
}
async function writeCoverage(env, c) {
  await env.DB.prepare('INSERT OR IGNORE INTO archive_checkpoint_coverage (layer, day, cutoff, last_observation_at, input_age_at_day_end_s, failed_runs_after_cutoff, failure_first_at, failure_last_at, failure_reasons, input_status, assessed_at, assessed_with_checkpoint, collector_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(c.layer, c.day, c.cutoff, c.last_observation_at, c.input_age_at_day_end_s, c.failed_runs_after_cutoff, c.failure_first_at, c.failure_last_at, JSON.stringify(c.failure_reasons), c.input_status, c.assessed_at, c.assessed_with_checkpoint, COLLECTOR_VERSION).run();
}
/** Checkpoints completed before 0.5.2 (or whose coverage write failed) get a coverage row assessed afterwards — labelled as such. */
async function backfillCoverage(env, layer, nowMs) {
  const miss = (await env.DB.prepare('SELECT c.day, c.cutoff, c.r2_key FROM archive_checkpoints c WHERE c.layer = ? AND NOT EXISTS (SELECT 1 FROM archive_checkpoint_coverage v WHERE v.layer = c.layer AND v.day = c.day) ORDER BY c.day LIMIT 3').bind(layer).all()).results || [];
  for (const m of miss) {
    if (layer === 'firms' && await fvEverRan(env)) {   // v2 rule (design §9): never an unbounded parse
      const h = await env.R2.head(m.r2_key); if (!h) continue;
      if (h.customMetadata && h.customMetadata.format === 'lines/1') { const lo = h.customMetadata.last_observation_at;
        await writeCoverage(env, await checkpointCoverage(env, layer, m.day, m.cutoff, null, null, nowMs, false, lo && lo !== 'null' ? lo : null)); continue; }
      const text = await fvBoundedGunzip(env, m.r2_key, FV.legacyMaxJson);
      if (text === null) { await logRun(env, 'history:firms-checkpoint', nowMs, 'down', 0, 0, 0, `coverage backfill refused for ${m.day}: legacy checkpoint over ${FV.legacyMaxJson} bytes decompressed`); continue; }
      const prev = JSON.parse(text);
      await writeCoverage(env, await checkpointCoverage(env, layer, m.day, m.cutoff, prev.records, prev.record_fields, nowMs, false)); continue;
    }
    const o = await env.R2.get(m.r2_key); if (!o) continue;
    const raw = await o.arrayBuffer(); let text;
    try { text = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); } catch (_) { text = new TextDecoder().decode(raw); }   // stored gzip-encoded; a runtime may already have decoded it
    const prev = JSON.parse(text);
    await writeCoverage(env, await checkpointCoverage(env, layer, m.day, m.cutoff, prev.records, prev.record_fields, nowMs, false));
  }
  return miss.length;
}
async function histCheckpointOne(env, layer, day, chosen) {
  const done = await env.DB.prepare('SELECT 1 AS x FROM archive_checkpoints WHERE layer = ? AND day = ?').bind(layer, day).first();
  if (done) return 'already done';   // completed work is recognised before anything else
  const o = await env.R2.get(chosen.key);
  if (!o) return 'source_gone';
  const text = await o.text(); const prev = JSON.parse(text);
  if (prev.retrieved_at !== chosen.retrieved_at) throw new Error('snapshot changed under us: ' + chosen.key);
  const key = `${HIST.checkpoints}${layer}/${day}.json.gz`; const gz = await gzipText(text); const ref = runRef(layer, prev.retrieved_at);
  const cov = await checkpointCoverage(env, layer, day, prev.retrieved_at, prev.records, prev.record_fields, Date.now(), true);
  await env.R2.put(key, gz, { httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' }, customMetadata: { cutoff: prev.retrieved_at, window_start: String(prev.window_start), window_end: String(prev.window_end), run_ref: ref, collector_version: String(prev.collector_version), source_key: chosen.key,
    input_status: cov.input_status, failed_runs_after_cutoff: String(cov.failed_runs_after_cutoff), last_observation_at: String(cov.last_observation_at), input_age_at_day_end_s: String(cov.input_age_at_day_end_s) } });
  if (layer === 'firms' && prev.source_status === 'ok') {
    const by = firesDaily(prev);
    const stmts = Object.entries(by).map(([id, c]) => env.DB.prepare('INSERT OR IGNORE INTO fires_daily (cell_id, day, detections, frp_sum_mw, frp_max_mw, frp_n, day_n, night_n, cutoff, run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, day, c.n, c.frpSum === null ? null : Math.round(c.frpSum * 10) / 10, c.frpMax, c.frpN, c.day, c.night, prev.retrieved_at, ref, String(prev.collector_version)));
    for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  }
  await writeCoverage(env, cov);   // what the input covered — before the marker, so a completed checkpoint always has it (else backfilled, labelled)
  await env.DB.prepare('INSERT OR IGNORE INTO archive_checkpoints (layer, day, cutoff, r2_key, bytes, records, run_ref, collector_version, source_key) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(layer, day, prev.retrieved_at, key, gz.length, (prev.records || []).length, ref, String(prev.collector_version), chosen.key).run();   // completion marker, last
  return 'done';
}
async function histCheckpointsDue(env, layer, nowMs) {
  const today = dayKey(nowMs);
  await env.DB.prepare('INSERT OR IGNORE INTO history_activity (layer, day, first_seen) VALUES (?,?,?)').bind(layer, today, new Date(nowMs).toISOString()).run();
  const due = (await env.DB.prepare('SELECT a.day FROM history_activity a WHERE a.layer = ? AND a.day < ? AND NOT EXISTS (SELECT 1 FROM archive_checkpoints c WHERE c.layer = a.layer AND c.day = a.day) AND NOT EXISTS (SELECT 1 FROM archive_gaps g WHERE g.layer = a.layer AND g.day = a.day) ORDER BY a.day').bind(layer, today).all()).results
    .map(r => r.day).filter(d => nowMs >= Date.parse(d + 'T00:00:00Z') + 86400e3 + HIST_GRACE_MS);
  const back = await backfillCoverage(env, layer, nowMs);
  if (!due.length) return back ? 'coverage backfilled:' + back : 'nothing due';
  const snaps = await listSnapshots(env, layer); const out = [];
  for (const d of due) {
    let r;
    if (layer === 'firms' && await fvEverRan(env)) {   // v2 (design §7, §9) — only once v2 is on or has ever registered an input: the latest of {committed output, eligible legacy snapshot}; legacy only within L_json
      const cand = await fvCheckpointCandidate(env, d, snaps);
      if (!cand) r = 'source_gone';
      else if (cand.kind === 'new') r = await fvCheckpointNew(env, d, cand.out);
      else { const sz = cand.snap.size;   // from the listing (sizes only)
        if (sz > FV.legacyMaxJson) {
          await env.DB.prepare('INSERT OR IGNORE INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').bind(layer, d, `the day's legacy snapshot is ${sz} bytes, over the bounded-read limit (${FV.legacyMaxJson}); refused, not parsed`, new Date(nowMs).toISOString()).run();
          r = 'gap'; out.push(d + ':' + r); continue; }
        r = await histCheckpointOne(env, layer, d, cand.snap); }
    } else {
    const c = snaps.filter(x => x.retrieved_at.slice(0, 10) === d).sort((a, b) => a.retrieved_at < b.retrieved_at ? -1 : a.retrieved_at > b.retrieved_at ? 1 : a.key < b.key ? -1 : 1);
    r = c.length ? await histCheckpointOne(env, layer, d, c[c.length - 1]) : 'source_gone';
    }
    if (r === 'source_gone') {
      const doneNow = await env.DB.prepare('SELECT 1 AS x FROM archive_checkpoints WHERE layer = ? AND day = ?').bind(layer, d).first();
      if (doneNow) r = 'already done';
      else {
        const reason = nowMs - (Date.parse(d + 'T00:00:00Z') + 86400e3) >= 86400e3
          ? 'the retained snapshots for this day expired (2-day storage rule) before a checkpoint completed'
          : 'no retained snapshot carries a retrieval time on this UTC day';
        await env.DB.prepare('INSERT OR IGNORE INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').bind(layer, d, reason, new Date(nowMs).toISOString()).run();
        r = 'gap';
      }
    }
    out.push(d + ':' + r);
  }
  return out.join(',');
}
async function histQuakes(env, features, retrievedAt) {
  const ref = runRef('usgs', retrievedAt);
  const stmts = (features || []).filter(f => f && f.id && f.geometry && f.properties && Number.isFinite(f.properties.updated)).map(f => {
    const p = f.properties, [lng, lat, depth] = f.geometry.coordinates;
    return env.DB.prepare('INSERT OR IGNORE INTO quake_revisions (usgs_id, source_updated, received_at, observed_at, lat, lng, depth_km, mag, mag_type, place, status, run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(f.id, new Date(p.updated).toISOString(), retrievedAt, new Date(p.time).toISOString(), lat, lng, depth ?? null, p.mag ?? null, p.magType || null, p.place || null, p.status || null, ref, COLLECTOR_VERSION);
  });
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  return stmts.length;
}
async function histDrifters(env, e) {
  const f = e.record_fields, ix = k => f.indexOf(k), ref = runRef('drifters', e.retrieved_at);
  const stmts = (e.records || []).map(r => { const sst = r[ix('sst_c')];
    return env.DB.prepare('INSERT OR IGNORE INTO drifter_fixes (buoy_id, fix_time, lat, lng, sst_key, sst_c, first_received_at, run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(String(r[ix('id')]), r[ix('observed_at')], r[ix('lat')], r[ix('lng')], sst === null || sst === undefined ? 'na' : String(sst), sst ?? null, e.retrieved_at, ref, COLLECTOR_VERSION); });
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  return stmts.length;
}
async function histSeaIce(env, e) {
  const ref = runRef('seaice', e.retrieved_at), ix = e.index || {};
  const rows = [['north', ix.north], ['south', ix.south]].filter(([, h]) => h && h.date && Number.isFinite(h.value));
  await env.DB.batch(rows.map(([hemi, h]) => env.DB.prepare('INSERT OR IGNORE INTO seaice_daily (hemisphere, data_date, extent_mkm2, clim_average_mkm2, first_received_at, run_ref, collector_version) VALUES (?,?,?,?,?,?,?)')
    .bind(hemi, h.date, h.value, h.climatology_1981_2010 ? h.climatology_1981_2010.average : null, e.retrieved_at, ref, COLLECTOR_VERSION)));
  return rows.length;
}
async function histOrbital(env, meta) {
  await env.DB.prepare('INSERT OR IGNORE INTO orbital_population (elements_sha256, first_retrieved_at, rows, counts_json, query, filter, run_ref, collector_version) VALUES (?,?,?,?,?,?,?,?)')
    .bind(meta.elements.sha256, meta.retrieved_at, meta.elements.rows, JSON.stringify(meta.counts), meta.source.query, meta.source.filter, runRef('orbital', meta.retrieved_at), COLLECTOR_VERSION).run();
}
/** Run one history step; never throws into the collector. */
async function hist(env, label, fn) {
  if (!histOn(env)) return label + ':off';
  try { const r = await fn(); return label + ':' + r; }
  catch (e) { console.log('history', label, 'failed', String(e)); try { await logRun(env, 'history:' + label, Date.now(), 'down', 0, 0, 0, String(e).slice(0, 300)); } catch (_) {} return label + ':failed ' + String(e).slice(0, 80); }
}

/** What the hub reports about history — two separate facts (rev 5):
 *  collecting: is NEW history being collected right now (HISTORY_ENABLED=1)?
 *  retained:   what history already exists, per layer (first/last), whether or not collection is on now.
 * Switching collection off does not delete anything; an unreadable database is reported as unknown, never as "none". */
const HIST_RANGES = {   // [table, column, extra filter] — first and last are read as two single-value index lookups (one MIN, one MAX)
  usgs: ['quake_revisions', 'received_at', 'received_at', ''], firms: ['fires_daily', 'day', 'day', ''],
  drifters: ['drifter_fixes', 'first_received_at', 'first_received_at', ''], seaice: ['seaice_daily', 'first_received_at', 'first_received_at', ''],
  orbital: ['orbital_population', 'first_retrieved_at', 'first_retrieved_at', ''],
  co2: ['archive_versions', 'first_retrieved_at', 'last_retrieved_at', "WHERE layer = 'co2'"], plastic: ['archive_versions', 'first_retrieved_at', 'last_retrieved_at', "WHERE layer = 'plastic'"],
};
async function historyState(env) {
  const collecting = histOn(env);
  try {
    const keys = Object.keys(HIST_RANGES);
    const r = await env.DB.batch(keys.flatMap(k => { const [t, cf, cl, w] = HIST_RANGES[k]; return [env.DB.prepare(`SELECT MIN(${cf}) AS f FROM ${t} ${w}`), env.DB.prepare(`SELECT MAX(${cl}) AS l FROM ${t} ${w}`)]; }));
    const retained = {}; let first = null, last = null;
    keys.forEach((k, i) => { const x = { f: ((r[2 * i] && r[2 * i].results && r[2 * i].results[0]) || {}).f, l: ((r[2 * i + 1] && r[2 * i + 1].results && r[2 * i + 1].results[0]) || {}).l };
      retained[k] = x.f ? { first: x.f, last: x.l } : null;
      if (x.f && (!first || x.f < first)) first = x.f; if (x.l && (!last || x.l > last)) last = x.l; });
    return { collecting, enabled: collecting, retained: first ? { exists: true, first, last, layers: retained } : { exists: false }, since: first };
  } catch (e) {
    if (/no such table/i.test(String(e))) return { collecting, enabled: collecting, retained: { exists: false, note: 'history tables not created' }, since: null };
    return { collecting, enabled: collecting, retained: { exists: null, problem: 'history records unreadable: ' + String(e).slice(0, 120) }, since: null };
  }
}
/** Archive health for /status: pending (closed, not completed) days, recorded gaps, last completed checkpoint, recent history failures. */
async function archiveHealth(env, nowMs) {
  try {
    const today = dayKey(nowMs);
    const r = await env.DB.batch([
      env.DB.prepare('SELECT a.layer, a.day FROM history_activity a WHERE a.day < ? AND NOT EXISTS (SELECT 1 FROM archive_checkpoints c WHERE c.layer = a.layer AND c.day = a.day) AND NOT EXISTS (SELECT 1 FROM archive_gaps g WHERE g.layer = a.layer AND g.day = a.day) ORDER BY a.day').bind(today),
      env.DB.prepare('SELECT layer, day, reason, detected_at FROM archive_gaps ORDER BY day DESC LIMIT 20'),
      env.DB.prepare('SELECT layer, MAX(day) AS day, MAX(cutoff) AS cutoff FROM archive_checkpoints GROUP BY layer'),
      env.DB.prepare("SELECT layer, started_at, note FROM collector_runs WHERE layer LIKE 'history:%' AND status = 'down' ORDER BY id DESC LIMIT 10"),
      env.DB.prepare('SELECT v.layer, v.day, v.cutoff, v.last_observation_at, v.input_age_at_day_end_s, v.failed_runs_after_cutoff, v.failure_first_at, v.failure_last_at, v.failure_reasons, v.input_status, v.assessed_at, v.assessed_with_checkpoint FROM archive_checkpoint_coverage v WHERE v.day = (SELECT MAX(day) FROM archive_checkpoint_coverage w WHERE w.layer = v.layer)'),
      ...HIST.checkpointLayers.flatMap(l => [
        env.DB.prepare("SELECT started_at, finished_at FROM collector_runs WHERE layer = ? AND status = 'ok' ORDER BY finished_at DESC LIMIT 1").bind(l),
        env.DB.prepare('SELECT started_at, finished_at, status, note FROM collector_runs WHERE layer = ? ORDER BY finished_at DESC LIMIT 1').bind(l),
        env.DB.prepare("SELECT COUNT(*) AS n, MIN(started_at) AS since_scheduled, MIN(finished_at) AS since_finished FROM collector_runs WHERE layer = ? AND status != 'ok' AND finished_at > COALESCE((SELECT MAX(finished_at) FROM collector_runs WHERE layer = ? AND status = 'ok'), '')").bind(l, l),
      ]),
    ]);
    const res = i => (r[i] && r[i].results) || [];
    const cov = Object.fromEntries(res(4).map(c => [c.layer, { ...c, failure_reasons: (() => { try { return JSON.parse(c.failure_reasons || '[]'); } catch (_) { return []; } })(), assessed_with_checkpoint: !!c.assessed_with_checkpoint }]));
    const collection = {};
    HIST.checkpointLayers.forEach((l, i) => { const ok = res(5 + 3 * i)[0], last = res(6 + 3 * i)[0], f = res(7 + 3 * i)[0] || {};
      collection[l] = { last_successful_run: ok ? { scheduled_at: ok.started_at, finished_at: ok.finished_at, age_s: Math.round((nowMs - Date.parse(ok.finished_at)) / 1000) } : null,
        latest_run: last ? { scheduled_at: last.started_at, finished_at: last.finished_at, status: last.status, note: String(last.note || '').slice(0, 160) } : null,
        failing: f.n ? { since_scheduled: f.since_scheduled, since_finished: f.since_finished, runs: f.n } : null }; });   // streak = failures that ENDED after the last success ended
    return { pending: res(0).map(x => ({ layer: x.layer, day: x.day, hours_since_day_closed: Math.round((nowMs - Date.parse(x.day + 'T00:00:00Z') - 86400e3) / 36e5 * 10) / 10 })),
      gaps: res(1), last_completed: res(2).map(x => ({ ...x, coverage: cov[x.layer] && cov[x.layer].day === x.day ? cov[x.layer] : null })), recent_failures: res(3), collection,
      note: 'a completed checkpoint means the day was archived, not that collection covered it: see last_completed[].coverage (input_status, failed_runs_after_cutoff) and collection',
      retry_window: 'inputs are the retained snapshots (2-day storage rule); a day not completed within that window is recorded as a gap' };
  } catch (e) { return /no such table/i.test(String(e)) ? { note: 'history tables not created' } : { problem: 'unreadable: ' + String(e).slice(0, 120) }; }
}

// ---------------------------------------------------------------- Health (0.5.3): GET|HEAD /health/<check>/<layer>
/* For an EXTERNAL monitor (UptimeRobot Free, branch hub-health, 6 Nov 2026). The verdict is the HTTP STATUS CODE:
 * 200 = healthy, 503 = failing, 404 = no such check — so a plain HTTP monitor works on any plan (its default request is
 * HEAD, which gets the same status with no body). Rules:
 *   - FAIL CLOSED: an exception, a missing table, no rows, an unparsable time or a missing published file is a 503, never a 200.
 *   - READ-ONLY and cheap: indexed D1 lookups + one R2 head() (metadata only, no body). No upstream request, no write.
 *   - no-store on every answer; the body carries checked_at so a cached copy would show its age.
 *   - nothing secret: notes are cut to 160 chars and every secret-length env value is redacted from them; no admin route.
 * One check per URL, so an incident already open on one cannot hide a new failure of another kind (one monitor each).
 * Collection freshness (runs complete), publication freshness (a validated snapshot reached latest/), checkpoint completion,
 * and checkpoint coverage are separate checks. Observation age / source latency are NOT pass/fail here (see the review). */
const HEALTH = {
  cadenceS: { usgs: 300, firms: 900 },   // the scheduled slots: */5 (five) and */15 (firms)
  missedSlots: 3, marginS: 300,          // overdue = 3 consecutive slots without the thing + 5 min for an in-flight run
  checkpointOverdueS: 2 * 3600,          // a closed day is due at end + 30 min (HIST_GRACE_MS); failing from end + 2 h
  newGapS: 24 * 3600,                    // a gap counts as a NEW incident for 24 h after it was recorded; it stays listed after that
  checks: { runs: ['usgs', 'firms'], publication: ['usgs', 'firms'], archive: HIST.checkpointLayers, coverage: HIST.checkpointLayers },
  boundaryNote: 'no detections processed yet for today',   // collectFirms' expected-empty note before FIRMS_DAY_BOUNDARY_H
};
const healthAllowS = layer => HEALTH.missedSlots * HEALTH.cadenceS[layer] + HEALTH.marginS;
/** Remove secrets from text: every env string of 16+ chars (all the secrets); with `tokens`, also any 32+ char token. No cut. */
function redactText(env, s, tokens = true) {
  let t = String(s == null ? '' : s);
  for (const v of Object.values(env || {})) if (typeof v === 'string' && v.length >= 16) t = t.split(v).join('[redacted]');
  return tokens ? t.replace(/[A-Za-z0-9_\-]{32,}/g, '[redacted]') : t;
}
/** Cut a run note for a public health answer: redacted, 160 chars. */
function healthNote(env, s) { return redactText(env, s).slice(0, 160); }
/** /status (0.5.3, rev 2): free-text fields (note, reason, failure_reasons) get the full redaction; every other string loses
 * secret values only (keys, hashes and times stay intact). Lengths unchanged otherwise. */
function redactStatus(env, x, key) {
  if (Array.isArray(x)) return x.map(v => redactStatus(env, v, key));
  if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x)) o[k] = redactStatus(env, x[k], k); return o; }
  if (typeof x === 'string') return redactText(env, x, ['note', 'reason', 'failure_reasons'].includes(key));
  return x;
}
const HEALTH_SKEW_MS = 5 * 60e3;   // a recorded time more than 5 min after "now" is corrupt evidence, never fresh evidence
/** A time from health evidence: unparsable or in the future → throw (the check answers 503 "health data unreadable"). */
function tAt(s, nowMs, what) {
  const v = s instanceof Date ? s.getTime() : Date.parse(s);
  if (!Number.isFinite(v)) throw new Error(`unparsable time in health data (${what}): ` + String(s).slice(0, 40));
  if (v > nowMs + HEALTH_SKEW_MS) throw new Error(`time in the future in health data (${what}): ` + new Date(v).toISOString());
  return v;
}
/** FIRMS only: the day_range=1 file is legitimately empty from 00:00 until ~FIRMS_DAY_BOUNDARY_H UTC (collectFirms logs those runs
 * with HEALTH.boundaryNote). A publication deadline that falls inside that window is counted instead from the window's LAST slot
 * (03:45 UTC), as if that slot had published — the same moment the "last acceptable run" rule reaches, so the two agree. Pure. */
function healthDeadline(layer, pubMs) {
  const allow = healthAllowS(layer) * 1000; let due = pubMs + allow;
  if (layer === 'firms') { const d0 = Date.parse(dayKey(due) + 'T00:00:00Z'), bEnd = d0 + FIRMS_DAY_BOUNDARY_H * 3600e3;
    if (due >= d0 && due < bEnd) due = bEnd - HEALTH.cadenceS.firms * 1000 + allow; }
  return due;
}
async function healthRuns(env, layer, nowMs) {
  const last = await env.DB.prepare('SELECT started_at, finished_at, status, note FROM collector_runs WHERE layer = ? ORDER BY finished_at DESC LIMIT 1').bind(layer).first();
  if (!last) return { healthy: false, reasons: [`no ${layer} run has ever been recorded`] };
  const age = Math.round((nowMs - tAt(last.finished_at, nowMs, 'latest run finished_at')) / 1000), allow = healthAllowS(layer);
  const facts = { latest_run: { scheduled_at: last.started_at, finished_at: last.finished_at, status: last.status, note: healthNote(env, last.note) }, age_s: age, allow_s: allow };
  return age > allow ? { healthy: false, reasons: [`no ${layer} run has completed for ${age} s (allowed ${allow} s = ${HEALTH.missedSlots} scheduled slots + ${HEALTH.marginS} s): scheduling stopped or every run is dying before it is logged`], facts } : { healthy: true, reasons: [], facts };
}
async function healthPublication(env, layer, nowMs) {
  const [okR, lastR, accR] = await env.DB.batch([
    env.DB.prepare("SELECT started_at, finished_at, records, note FROM collector_runs WHERE layer = ? AND status = 'ok' ORDER BY finished_at DESC LIMIT 1").bind(layer),
    env.DB.prepare('SELECT started_at, finished_at, status, note FROM collector_runs WHERE layer = ? ORDER BY finished_at DESC LIMIT 1').bind(layer),
    env.DB.prepare("SELECT finished_at FROM collector_runs WHERE layer = ? AND (status = 'ok' OR (status = 'down' AND note LIKE ?)) ORDER BY finished_at DESC LIMIT 1").bind(layer, HEALTH.boundaryNote + '%'),
  ]);
  const ok = okR.results && okR.results[0], last = lastR.results && lastR.results[0], acc = accR.results && accR.results[0];
  const head = await env.R2.head(`latest/${layer}.json`);   // the file the page actually reads: metadata only
  const reasons = [], allow = healthAllowS(layer);
  if (!ok) reasons.push(`no successful ${layer} publication has ever been logged`);
  if (!head) reasons.push(`latest/${layer}.json is missing: nothing is published`);
  if (!ok || !head) return { healthy: false, reasons, facts: { latest_run: last ? { finished_at: last.finished_at, status: last.status, note: healthNote(env, last.note) } : null } };
  const logMs = tAt(ok.finished_at, nowMs, 'last ok run finished_at'), fileMs = tAt(head.uploaded, nowMs, 'published file uploaded');
  if (last) tAt(last.finished_at, nowMs, 'latest run finished_at'); if (acc) tAt(acc.finished_at, nowMs, 'last acceptable run finished_at');
  const pubMs = Math.min(logMs, fileMs);   // conservative: the older of "the log says ok" and "the file was written"
  /* 0.6.0 (GPT G4): a v2 publication is complete when its COUNTS land (firms_outputs.cells_at), which may be one run after the records
   * (discovery repair). The run log is compared with that completion time, not with the records upload; the publication's AGE still
   * comes from the records upload (pubMs above), so a repair never makes stale data look fresh. */
  const md = (head && head.customMetadata) || {}; let cmpMs = fileMs, pair = null;
  if (layer === 'firms' && md.format === 'lines/1' && md.run_id) {
    const o = await env.DB.prepare('SELECT latest_at, cells_at, publish_state FROM firms_outputs WHERE run_id = ?').bind(md.run_id).first();
    pair = { run_id: md.run_id, records_published_at: o ? o.latest_at : null, counts_published_at: o ? o.cells_at : null };
    if (!o || !o.cells_at) reasons.push(`the records of run ${md.run_id} are published but its counts are not complete yet (publication pending repair)`);
    else cmpMs = tAt(o.cells_at, nowMs, 'publication completed (cells_at)');
    if (!String(ok.note || '').includes('run=' + md.run_id)) reasons.push(`the latest successful run log is not for the published run ${md.run_id} (log note: ${healthNote(env, ok.note)})`);
  }
  // rev 2 (GPT P5): a resource-guard skip AFTER the last publication keeps this check failing until a new publication —
  // a later run of another kind (e.g. an HTTP 500) must not close the guard incident.
  const guard = await env.DB.prepare("SELECT finished_at FROM collector_runs WHERE layer = ? AND status != 'ok' AND finished_at > ? AND note LIKE '%resource guard%' ORDER BY finished_at DESC LIMIT 1").bind(layer, ok.finished_at).first();
  const due = healthDeadline(layer, pubMs);
  const facts = { last_publication: { logged_ok_finished_at: ok.finished_at, file_uploaded_at: new Date(fileMs).toISOString(), records: ok.records, age_s: Math.round((nowMs - pubMs) / 1000) },
    overdue_from: new Date(due).toISOString(), allow_s: allow, guard_skip_since_publication: guard ? guard.finished_at : null, ...(pair ? { v2_publication: pair } : {}),
    latest_run: last ? { scheduled_at: last.started_at, finished_at: last.finished_at, status: last.status, note: healthNote(env, last.note) } : null };
  if (Math.abs(logMs - cmpMs) > 10 * 60e3) reasons.push(`the run log and the published file disagree by ${Math.round(Math.abs(logMs - cmpMs) / 1000)} s (log ${ok.finished_at}, ${pair ? 'publication completed ' + new Date(cmpMs).toISOString() : 'file ' + facts.last_publication.file_uploaded_at})`);
  if (guard) reasons.push(`a run was skipped by the resource guard at ${guard.finished_at} and nothing has been published since: the source answered but was not processed`);
  if (nowMs > due) reasons.push(`no ${layer} publication since ${new Date(pubMs).toISOString()} (overdue from ${facts.overdue_from})` + (last && last.status !== 'ok' ? `; latest run ${last.status}: ${healthNote(env, last.note)}` : ''));
  else if (!acc || nowMs - tAt(acc.finished_at, nowMs, 'last acceptable run') > allow * 1000) reasons.push(`no ${layer} run has ended with a publication or an expected empty file for over ${allow} s` + (last ? `; latest run ${last.status}: ${healthNote(env, last.note)}` : ''));
  return { healthy: !reasons.length, reasons, facts };
}
// rev 2 (GPT P3): independent evidence that history is ESTABLISHED for a layer before yesterday — any one of these is enough.
// A hub that has none of them is indistinguishable from a new installation (stated limit: if all of them are lost together, too).
const HEALTH_EST = {
  firms: "SELECT (SELECT 1 FROM archive_checkpoints WHERE layer = ?1 AND day < ?2 LIMIT 1) AS cp, (SELECT 1 FROM archive_gaps WHERE layer = ?1 AND day < ?2 LIMIT 1) AS gp, (SELECT 1 FROM history_activity WHERE layer = ?1 AND day < ?2 LIMIT 1) AS ha, (SELECT 1 FROM fires_daily WHERE day < ?2 LIMIT 1) AS data",
  usgs: "SELECT (SELECT 1 FROM archive_checkpoints WHERE layer = ?1 AND day < ?2 LIMIT 1) AS cp, (SELECT 1 FROM archive_gaps WHERE layer = ?1 AND day < ?2 LIMIT 1) AS gp, (SELECT 1 FROM history_activity WHERE layer = ?1 AND day < ?2 LIMIT 1) AS ha, (SELECT 1 FROM quake_revisions WHERE received_at < ?2 LIMIT 1) AS data",
};
async function healthArchive(env, layer, nowMs) {
  if (!histOn(env)) return { healthy: false, reasons: ['history collection is off (HISTORY_ENABLED is not 1): pause this monitor if that is intended'] };
  const today = dayKey(nowMs), y = dayKey(nowMs - 86400e3), since = new Date(nowMs - HEALTH.newGapS * 1000).toISOString();
  const [pendR, recentR, listR, yR, estR] = await env.DB.batch([
    env.DB.prepare('SELECT a.day FROM history_activity a WHERE a.layer = ? AND a.day < ? AND NOT EXISTS (SELECT 1 FROM archive_checkpoints c WHERE c.layer = a.layer AND c.day = a.day) AND NOT EXISTS (SELECT 1 FROM archive_gaps g WHERE g.layer = a.layer AND g.day = a.day) ORDER BY a.day').bind(layer, today),
    // rev 2 (GPT P2): recent incidents are found by WHEN they were recorded, for any day — not from the 5-row display list
    env.DB.prepare('SELECT day, reason, detected_at FROM archive_gaps WHERE layer = ? AND (detected_at >= ? OR detected_at IS NULL OR length(detected_at) < 20) ORDER BY day').bind(layer, since),
    env.DB.prepare('SELECT day, reason, detected_at FROM archive_gaps WHERE layer = ? ORDER BY day DESC LIMIT 5').bind(layer),
    env.DB.prepare('SELECT (SELECT 1 FROM history_activity WHERE layer = ?1 AND day = ?2) AS ran, (SELECT 1 FROM archive_checkpoints WHERE layer = ?1 AND day = ?2) AS done, (SELECT 1 FROM archive_gaps WHERE layer = ?1 AND day = ?2) AS gap').bind(layer, y),
    env.DB.prepare(HEALTH_EST[layer]).bind(layer, y),
  ]);
  const pend = (pendR.results || []).map(r => r.day), recent = recentR.results || [], gaps = listR.results || [], yy = (yR.results || [])[0] || {}, est = (estR.results || [])[0] || {};
  const established = !!(est.cp || est.gp || est.ha || est.data);
  const reasons = [], dayClosedS = Math.round((nowMs - Date.parse(today + 'T00:00:00Z')) / 1000);
  for (const d of pend) { const late = Math.round((nowMs - Date.parse(d + 'T00:00:00Z') - 86400e3) / 1000);
    if (late > HEALTH.checkpointOverdueS) reasons.push(`${layer} checkpoint for ${d} is not complete ${(late / 3600).toFixed(1)} h after the day closed (failing from ${HEALTH.checkpointOverdueS / 3600} h)`); }
  for (const g of recent) { tAt(g.detected_at, nowMs, 'gap detected_at'); reasons.push(`new archive gap: ${layer} ${g.day} — ${healthNote(env, g.reason)} (recorded ${g.detected_at})`); }
  // rev 2 (GPT P3): on an established hub, yesterday must be COMPLETE or a recorded gap by 2 h after midnight — judged from the
  // checkpoint and gap tables themselves, so it does not depend on the activity record that makes a day "due".
  if (established && !yy.done && !yy.gap && !pend.includes(y) && dayClosedS > HEALTH.checkpointOverdueS)
    reasons.push(`${layer} ${y} has neither a checkpoint nor a recorded gap ${(dayClosedS / 3600).toFixed(1)} h after it closed, and no activity record makes it due: it would be missed silently`);
  return { healthy: !reasons.length, reasons, facts: { pending: pend, established_before_yesterday: established, evidence: { checkpoints: !!est.cp, gaps: !!est.gp, activity: !!est.ha, data_rows: !!est.data },
    yesterday: { day: y, history_ran: !!yy.ran, checkpoint: !!yy.done, gap: !!yy.gap }, recent_gaps: recent.map(g => ({ ...g, reason: healthNote(env, g.reason) })), recorded_gaps: gaps.map(g => ({ ...g, reason: healthNote(env, g.reason) })),
    gap_alert_window_s: HEALTH.newGapS, note: 'a gap stays listed here and in /status for good; it fails this check only for 24 h after it was recorded' } };
}
async function healthCoverage(env, layer, nowMs) {
  const y = dayKey(nowMs - 86400e3);
  const [covR, cpR] = await env.DB.batch([
    env.DB.prepare('SELECT day, cutoff, input_status, failed_runs_after_cutoff, failure_reasons, input_age_at_day_end_s, assessed_at, assessed_with_checkpoint FROM archive_checkpoint_coverage WHERE layer = ? AND day = ?').bind(layer, y),
    env.DB.prepare('SELECT cutoff FROM archive_checkpoints WHERE layer = ? AND day = ?').bind(layer, y),
  ]);
  const c = (covR.results || [])[0], cp = (cpR.results || [])[0];
  if (!cp) return { healthy: true, reasons: [], facts: { day: y, state: 'not assessed yet: the checkpoint for this day is not complete (the archive check covers that)' } };
  if (!c) return { healthy: false, reasons: [`${layer} checkpoint for ${y} is complete but has no coverage record (it is written before the marker, so this should not happen)`], facts: { day: y } };
  // rev 2 (GPT P1, P6): the evidence must be readable, self-consistent and about THIS checkpoint before "current" can mean healthy.
  const bad = [];
  let why = null; try { why = JSON.parse(c.failure_reasons || '[]'); } catch (_) {} if (!Array.isArray(why)) bad.push('failure_reasons is not a readable list');
  for (const [k, v] of [['cutoff', c.cutoff], ['assessed_at', c.assessed_at]]) { try { tAt(v, nowMs, k); } catch (e) { bad.push(String(e.message)); } }
  try { tAt(cp.cutoff, nowMs, 'checkpoint cutoff'); } catch (e) { bad.push(String(e.message)); }
  if (c.cutoff !== cp.cutoff) bad.push(`coverage cutoff ${String(c.cutoff).slice(0, 40)} is not the checkpoint's cutoff ${String(cp.cutoff).slice(0, 40)}`);
  if (!['current', 'stale'].includes(c.input_status)) bad.push(`input_status "${String(c.input_status).slice(0, 20)}" is not current|stale`);
  if (!Number.isInteger(c.failed_runs_after_cutoff) || c.failed_runs_after_cutoff < 0) bad.push('failed_runs_after_cutoff is not a count');
  else if (c.input_status === 'current' && c.failed_runs_after_cutoff > 0) bad.push(`input_status "current" contradicts ${c.failed_runs_after_cutoff} failed runs after the cutoff`);
  const facts = { day: y, cutoff: c.cutoff, checkpoint_cutoff: cp.cutoff, input_status: c.input_status, failed_runs_after_cutoff: c.failed_runs_after_cutoff, input_age_at_day_end_s: c.input_age_at_day_end_s,
    failure_reasons: Array.isArray(why) ? why.map(r => healthNote(env, r)) : null, assessed_at: c.assessed_at, assessed_with_checkpoint: !!c.assessed_with_checkpoint };
  if (bad.length) return { healthy: false, reasons: bad.map(b => `${layer} coverage for ${y} is unreadable or does not match its checkpoint: ${healthNote(env, b)}`), facts };
  if (c.input_status === 'current') return { healthy: true, reasons: [], facts };
  return { healthy: false, reasons: [`${layer} checkpoint for ${y} was built from a ${c.input_status} input (cutoff ${c.cutoff}; ${c.failed_runs_after_cutoff} failed runs after it)`], facts };
}
async function health(req, env, check, layer) {
  const fn = { runs: healthRuns, publication: healthPublication, archive: healthArchive, coverage: healthCoverage }[check];
  const nowMs = Date.now(), hdr = { 'Cache-Control': 'no-store, max-age=0' };
  const known = fn && (HEALTH.checks[check] || []).includes(layer);
  let out;
  if (!known) out = { status: 404, body: { error: 'no such health check', checks: Object.entries(HEALTH.checks).flatMap(([k, ls]) => ls.map(l => `/health/${k}/${l}`)) } };
  else {
    let r; try { r = await fn(env, layer, nowMs); } catch (e) { r = { healthy: false, reasons: ['health data unreadable: ' + healthNote(env, String(e && e.message || e))] }; }
    out = { status: r.healthy ? 200 : 503, body: { check: `${check}/${layer}`, healthy: r.healthy, verdict: r.healthy ? 'ok' : 'failing', reasons: r.reasons, checked_at: new Date(nowMs).toISOString(), collector_version: COLLECTOR_VERSION, facts: r.facts || null } };
  }
  if (req.method === 'HEAD') return new Response(null, { status: out.status, headers: { 'Content-Type': 'application/json', ...CORS, ...hdr, 'X-Health': out.body.verdict || 'unknown-check' } });
  return json(out.body, out.status, { ...hdr, 'X-Health': out.body.verdict || 'unknown-check' });
}

// ---------------------------------------------------------------- Place view (0.5.0): GET /place/g4/<row>_<col>
/* Everything the hub holds for one 4° cell, one section per layer, each from ONE collector run (records and counts
 * paired on retrieved_at, re-read once, else withheld). Optional layers (drifters, plastic) are returned only when named
 * in ?layers= — the page asks for them only while that layer is on, or after the visitor presses "Load" for this place.
 * Read-only: no writes, no upstream requests. Collection evidence from D1 is labelled as such — never as coverage. */
const PLACE = {
  record: ['usgs', 'firms', 'ships'], optional: ['drifters', 'plastic'], listMax: 8,
  notPlace: { swpc: 'one planetary index for the whole Earth', co2: 'one station (Mauna Loa) — a background indicator, not a value for this place', seaice: 'one number per hemisphere', orbital: 'objects in orbit pass over every place; positions are computed, not tied to a cell', daynight: 'computed for the whole globe from the clock' },
  hourly: ['usgs', 'firms', 'ships'],
};
const placeCache = {};   // per isolate: { [layer]: { etag, byCell } } — the record index is rebuilt only when the file changes
function cellAreaKm2(id) { const b = cellBounds(id), R = 6371.0088, rad = Math.PI / 180; return Math.round(R * R * (b.e - b.w) * rad * Math.abs(Math.sin(b.n * rad) - Math.sin(b.s * rad))); }
function validCell(id) { const m = /^(\d{1,2})_(\d{1,2})$/.exec(id || ''); return !!m && +m[1] >= 0 && +m[1] < 180 / CELL_DEG && +m[2] >= 0 && +m[2] < 360 / CELL_DEG; }
async function placeRecords(env, layer) {
  const o = await env.R2.get(`latest/${layer}.json`); if (!o) return null;
  const c = placeCache[layer];
  if (c && c.etag && c.etag === o.httpEtag) { if (o.body && o.body.cancel) try { o.body.cancel(); } catch (_) {} return c; }
  const snap = await o.json(); const f = snap.record_fields || [], iLat = f.indexOf('lat'), iLng = f.indexOf('lng');
  const byCell = {}; for (const r of snap.records || []) { const id = cellId(r[iLat], r[iLng]); (byCell[id] || (byCell[id] = [])).push(r); }
  const entry = { etag: o.httpEtag, retrieved_at: snap.retrieved_at, fields: f, byCell }; placeCache[layer] = entry; return entry;
}
function placeMeta(layer, cells) {   // section metadata, always built from the cells file the section's data came from
  return { layer, retrieved_at: cells.retrieved_at, run_ref: runRef(layer, cells.retrieved_at), collector_version: cells.collector_version, source_status: cells.source_status, stale_after_s: cells.stale_after_s,
    window_start: cells.window_start, window_end: cells.window_end, quantity: cells.quantity || null, coverage_default: cells.coverage_default || null, coverage_note: cells.coverage_note || null, note: cells.note || null };
}
async function placeSection(env, layer, id) {
  let cells = await getJson(env, `latest-cells/${layer}.json`);
  if (!cells) return { layer, state: 'unavailable', note: 'no snapshot published yet' };
  if (layer === 'forest') {
    const base = placeMeta(layer, cells);
    if (!FOREST_CELLS.includes(id)) return { ...base, state: 'not_covered', why: 'outside the swept tropical land cells (alert systems run between 30°N and 30°S only)' };
    const c = cells.cells && cells.cells[id];
    if (!c) return { ...base, state: 'pending', why: 'in the sweep, not answered yet' };
    return { ...base, state: 'ok', cell: c };
  }
  if (cells.source_status === 'down' && !cells.cells) return { ...placeMeta(layer, cells), state: 'down' };
  if (layer === 'firms') {
    const h = await env.R2.head('latest/firms.json');
    if (h && h.customMetadata && h.customMetadata.format === 'lines/1') return fvPlaceSection(env, id, cells);
    if (h && h.size > FV.legacyMaxJson) return { ...placeMeta(layer, cells), state: 'withheld', why: `the published records file (${h.size} bytes) is over the bounded-read limit`, cell: (cells.cells && cells.cells[id]) || null };
    if (cells.run_id) return { ...placeMeta(layer, cells), state: 'withheld', why: 'counts carry a run id and the records do not: not from the same collector run', cell: (cells.cells && cells.cells[id]) || null };
  }
  let rec = await placeRecords(env, layer);
  if (rec && rec.retrieved_at !== cells.retrieved_at) {   // a collector wrote between the two reads: re-read both once
    const again = await getJson(env, `latest-cells/${layer}.json`); if (again) cells = again; rec = await placeRecords(env, layer);
  }
  const base = placeMeta(layer, cells);   // from the FINAL cells file — never from a superseded first read
  const cell = cells.cells ? cells.cells[id] : undefined;
  if (!rec || rec.retrieved_at !== cells.retrieved_at) {
    return { ...base, state: 'withheld', why: `records and counts are not from the same collector run (records ${rec ? rec.retrieved_at : 'unreadable'}, counts ${cells.retrieved_at})`, cell: cell || null, records_run_ref: rec ? runRef(layer, rec.retrieved_at) : null };
  }
  // 0.6.8 buoys: counts kept from the last good run after a failed update (last_attempt). Judged on the FINAL counts envelope,
  // after the pairing re-read above. Past the layer's own limit the fallback is withheld here, so no page can keep listing it.
  const la = layer === 'drifters' && cells.last_attempt ? cells.last_attempt : null;
  if (la && (Date.now() - Date.parse(cells.retrieved_at)) / 1000 > (cells.stale_after_s || STALE_AFTER_S.drifters)) {
    return { ...base, state: 'withheld', why: `the latest update failed and the last successful update is over ${Math.round((cells.stale_after_s || STALE_AFTER_S.drifters) / 3600)} h old`, last_attempt: la, cell: null, records_run_ref: runRef(layer, rec.retrieved_at) };
  }
  const recs = rec.byCell[id] || [];
  const iT = rec.fields.indexOf('observed_at') >= 0 ? rec.fields.indexOf('observed_at') : rec.fields.indexOf('sampled_on');
  const sorted = recs.slice().sort((a, b) => String(b[iT]).localeCompare(String(a[iT])));
  return { ...base, state: recs.length ? 'ok' : 'no_records', count: recs.length, cell: cell || null, record_fields: rec.fields, records_run_ref: runRef(layer, rec.retrieved_at),
    records: layer === 'plastic' ? sorted : sorted.slice(0, PLACE.listMax), records_total: recs.length, ...(la ? { last_attempt: la } : {}) };
}
/** /place firms over a lines/1 latest/: same answer shape; paired by run_id AND retrieved_at, re-read once, else withheld. */
async function fvPlaceSection(env, id, cells) {
  const scan = async () => { try { return await fvPlaceFirms(env, id); } catch (e) { return { error: String(e).slice(0, 120) }; } };
  let rec = await scan();
  const same = (r, c) => r && r.retrieved_at === c.retrieved_at && r.run_id && r.run_id === c.run_id;
  if (rec && !rec.busy && !same(rec, cells)) { const again = await getJson(env, 'latest-cells/firms.json'); if (again) cells = again; rec = await scan(); }
  const base = placeMeta('firms', cells), cell = cells.cells ? cells.cells[id] : undefined;
  if (rec && rec.busy) return { ...base, state: 'busy', why: 'too many concurrent record scans; counts are shown, records are not', cell: cell || null };
  if (!rec || rec.changed || !same(rec, cells)) return { ...base, state: 'withheld', why: `records and counts are not from the same collector run (records ${rec && rec.retrieved_at ? rec.retrieved_at + ' ' + (rec.run_id || 'no run id') : 'unreadable'}, counts ${cells.retrieved_at} ${cells.run_id || 'no run id'})`, cell: cell || null, records_run_ref: rec && rec.retrieved_at ? runRef('firms', rec.retrieved_at) : null };
  return { ...base, state: rec.count ? 'ok' : 'no_records', count: rec.count, cell: cell || null, record_fields: rec.fields, records_run_ref: runRef('firms', rec.retrieved_at), records: rec.records, records_total: rec.count };
}
async function placeCollection(env, id, nowMs) {
  // Every query is bounded: window sums read at most 168 rows per layer (primary-key range), start dates read one row from an index.
  const h24 = hourKey(nowMs - 24 * 3600e3), h7 = hourKey(nowMs - 7 * 86400e3), cur = hourKey(nowMs);
  const q = [];
  for (const l of PLACE.hourly) {
    q.push(env.DB.prepare('SELECT MIN(hour_utc) AS retention_start FROM layer_hourly WHERE layer = ?').bind(l));
    q.push(env.DB.prepare('SELECT SUM(CASE WHEN hour_utc >= ? THEN 1 ELSE 0 END) AS agg24, SUM(CASE WHEN hour_utc >= ? AND snapshots_ok > 0 THEN 1 ELSE 0 END) AS ran24, COUNT(*) AS agg7, SUM(CASE WHEN snapshots_ok > 0 THEN 1 ELSE 0 END) AS ran7 FROM layer_hourly WHERE layer = ? AND hour_utc >= ? AND hour_utc < ?').bind(h24, h24, l, h7, cur));
    q.push(env.DB.prepare('SELECT MIN(hour_utc) AS first_report FROM cell_hourly WHERE layer = ? AND cell_id = ?').bind(l, id));
    q.push(env.DB.prepare('SELECT SUM(CASE WHEN hour_utc >= ? THEN 1 ELSE 0 END) AS rep24, COUNT(*) AS rep7 FROM cell_hourly WHERE layer = ? AND cell_id = ? AND hour_utc >= ? AND hour_utc < ?').bind(h24, l, id, h7, cur));
    q.push(env.DB.prepare('SELECT MIN(hour_utc) AS cell_table_start FROM cell_hourly WHERE layer = ?').bind(l));
  }
  q.push(env.DB.prepare('SELECT MIN(date) AS first_query, MAX(date) AS last_query, COUNT(*) AS queries FROM forest_daily WHERE cell_id = ?').bind(id));
  const r = await env.DB.batch(q); const row = i => (r[i] && r[i].results && r[i].results[0]) || {};
  const out = {}, N = 5;
  PLACE.hourly.forEach((l, k) => { const a = row(N * k), b = row(N * k + 1), c = row(N * k + 2), d = row(N * k + 3), e = row(N * k + 4);
    out[l] = { collection_ran: { last_24h: { hours_with_a_usable_sample: b.ran24 || 0, hours_aggregated: b.agg24 || 0, hours: 24 }, last_7d: { hours_with_a_usable_sample: b.ran7 || 0, hours_aggregated: b.agg7 || 0, hours: 168 }, retention_start: a.retention_start || null },
      records_reached_us_here: { last_24h_hours: d.rep24 || 0, last_7d_hours: d.rep7 || 0, first_report_retained: c.first_report || null, retention_start: e.cell_table_start || null } }; });
  const f = row(N * PLACE.hourly.length); out.forest = { queries_retained: f.queries || 0, first_query: f.first_query || null, last_query: f.last_query || null };
  return out;
}
async function place(env, url, id) {
  if (!validCell(id)) return json({ error: 'cell id must be <row>_<col> on the 4° grid (row 0–44, col 0–89)' }, 400);
  const want = (url.searchParams.get('layers') || '').split(',').map(s => s.trim()).filter(l => PLACE.optional.includes(l));
  const nowMs = Date.now(); const b = cellBounds(id);
  const layers = {};
  for (const l of [...PLACE.record, 'forest']) { try { layers[l] = await placeSection(env, l, id); } catch (e) { layers[l] = { layer: l, state: 'unavailable', note: 'read failed: ' + String(e).slice(0, 120) }; } }
  for (const l of PLACE.optional) {
    if (!want.includes(l)) { layers[l] = { layer: l, state: 'off_not_requested' }; continue; }
    try { layers[l] = await placeSection(env, l, id); } catch (e) { layers[l] = { layer: l, state: 'unavailable', note: 'read failed: ' + String(e).slice(0, 120) }; }
  }
  let collection = null, collectionNote = null;
  try { collection = await placeCollection(env, id, nowMs); } catch (e) { collectionNote = 'collection records unreadable: ' + String(e).slice(0, 120); }
  return json({ schema: 'place/1', grid: 'g4', cell: { id, ref: 'g4:' + id, west: b.w, south: b.s, east: b.e, north: b.n, area_km2: cellAreaKm2(id) },
    generated_at: new Date(nowMs).toISOString(), collector_version: COLLECTOR_VERSION,
    statement: 'Listed together because they share this 4° cell. Nothing here states a connection between them.',
    layers, not_place_based: PLACE.notPlace, collection, collection_note: collectionNote,
    collection_meaning: 'collection_ran = our collector produced a usable sample in that hour (all places at once); records_reached_us_here = hours in which at least one record for this cell reached us. Neither is the source\'s geographic coverage. retention_start = the first hour we retain for that layer; first_report_retained = the first retained hour with a record for this cell.' });
}

// ---------------------------------------------------------------- dispatch

/** Run a collector so that an unexpected throw is recorded as a 'down' run and never takes the others with it. */
/* ---------- Dust RGB imagery (EUMETSAT MTG FCI, 0 degree) — 0.6.11, DUST-RGB-LAYER-PROPOSAL rev 5
 * Twice a day the hub asks EUMETView for the latest ADVERTISED frame: one picture (JPEG) and one footprint mask (small transparent
 * PNG), validates both, writes them under keys that name the frame and never change, and only then moves the pointer
 * (dustrgb/current.json). The previous pair is kept for one run so a reader holding the older pointer can finish loading.
 * Frame time: the hub can state only the time it REQUESTED. EUMETSAT's server can substitute the nearest frame and the header that
 * names the served frame (Warning) does not reach a Worker (GPT's probe, 12 Nov 2026). served_time stays null unless that header
 * ever arrives; if it arrives and disagrees, the run fails. Outside LAYERS, cells, history, health and the generic writeDown.
 * Product: EO:EUM:DAT:0869, CC BY 4.0. Gate: DUSTRGB_ENABLED=1 (absent = no request at all). */
const DUSTRGB = {
  CAP: 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetCapabilities&version=1.3.0&namespace=mtg_fd',
  MAP: 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_dust&styles=&crs=EPSG:4326&bbox=-80,-80,80,80',
  LAYER: 'rgb_dust', BOX: { south: -80, west: -80, north: 80, east: 80 },
  PICTURE: { w: 2048, h: 2048, maxBytes: 4 * 1024 * 1024 }, MASK: { w: 160, h: 160, maxBytes: 512 * 1024 },
  RUN_HOURS_UTC: [6, 18], TIMEOUT_MS: 90000, POINTER: 'dustrgb/current.json', PREFIX: 'dustrgb/frames/',
  CACHE_FILE: 'public, max-age=86400, immutable',
  SOURCE: { product: 'Dust RGB - MTG - 0 degree', collection: 'EO:EUM:DAT:0869', catalogue: 'https://user.eumetsat.int/catalogue/EO:EUM:DAT:0869', licence: 'CC BY 4.0',
    licence_url: 'https://creativecommons.org/licenses/by/4.0/', credit: 'Contains modified EUMETSAT Meteosat data', service: 'EUMETView WMS, layer mtg_fd:rgb_dust' },
};
/** Latest advertised time of the dust layer from a GetCapabilities document, as YYYY-MM-DDTHH:MM:00Z on the 10-minute grid; else null. */
function dustLatest(xml) {
  const m = String(xml).match(/<Name>(?:mtg_fd:)?rgb_dust<\/Name>[\s\S]*?<Dimension\b[^>]*\bname="time"[^>]*\bdefault="([^"]+)"/);
  if (!m) return null;
  const t = m[1].replace(/\.000Z$/, 'Z');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(t) || Number.isNaN(Date.parse(t))) return null;
  return t;
}
const dustKeyOf = t => t.replace(/[-:]/g, '').replace(/00Z$/, 'Z');   // 2026-11-12T16:50:00Z -> 20261112T1650Z
/** Width and height from a JPEG's first start-of-frame marker, or null (bad signature, truncated, no frame). */
function jpegSize(u8) {
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < u8.length) {
    if (u8[i] !== 0xff) return null;
    const k = u8[i + 1];
    if (k === 0xff) { i++; continue; }
    if (k >= 0xd0 && k <= 0xd9) { i += 2; continue; }
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2) return null;
    if (k >= 0xc0 && k <= 0xcf && k !== 0xc4 && k !== 0xc8 && k !== 0xcc) return { h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8] };
    i += 2 + len;
  }
  return null;
}
/** Width, height and colour type from a PNG's IHDR, plus whether it can carry transparency (RGBA, grey+alpha, or a palette with tRNS) and ends with IEND; or null. */
function pngInfo(u8) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (u8.length < 45 || sig.some((b, i) => u8[i] !== b)) return null;
  const u32 = i => ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]) >>> 0;
  if (u32(8) !== 13 || String.fromCharCode(u8[12], u8[13], u8[14], u8[15]) !== 'IHDR') return null;
  const w = u32(16), h = u32(20), colour = u8[25];
  let i = 8, trns = false, iend = false;
  while (i + 12 <= u8.length) { const len = u32(i), type = String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]);
    if (type === 'tRNS') trns = true;
    if (type === 'IEND') { iend = i + 12 === u8.length; break; }
    i += 12 + len; }
  return { w, h, colour, alpha: colour === 6 || colour === 4 || trns, complete: iend };
}
const dustServed = w => { const m = /time=(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.\d+)?Z/.exec(w || ''); return m ? m[1] + 'Z' : null; };
/** One file from EUMETView, validated. Returns { ok, buf, bytes, sha256, served, warn } or { ok:false, reason, http }. Reasons are fixed phrases (public). */
async function dustFetch(what, url, spec) {
  let r;
  try { r = await fetch(url, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(DUSTRGB.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: what + ' request failed', http: 0, detail: String(e).slice(0, 160) }; }
  if (r.status !== 200) return { ok: false, reason: what + ' http error', http: r.status };
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== spec.type) return { ok: false, reason: what + ' not an image', http: 200, detail: type };   // EUMETView answers a bad TIME with HTTP 200 + XML
  let buf; try { buf = await r.arrayBuffer(); } catch (e) { return { ok: false, reason: what + ' request failed', http: 200, detail: String(e).slice(0, 160) }; }   // cut off or timed out mid-body
  const u8 = new Uint8Array(buf);
  if (!buf.byteLength || buf.byteLength > spec.maxBytes) return { ok: false, reason: what + ' size out of range', http: 200, detail: String(buf.byteLength) };
  if (spec.type === 'image/jpeg') { const d = jpegSize(u8); if (!d || d.w !== spec.w || d.h !== spec.h || u8[u8.length - 2] !== 0xff || u8[u8.length - 1] !== 0xd9) return { ok: false, reason: what + ' not a valid image', http: 200, detail: JSON.stringify(d) }; }
  else { const d = pngInfo(u8); if (!d || d.w !== spec.w || d.h !== spec.h || !d.alpha || !d.complete) return { ok: false, reason: what + ' not a valid image', http: 200, detail: JSON.stringify(d) }; }
  const warn = r.headers.get('warning');
  return { ok: true, buf, bytes: buf.byteLength, sha256: await sha256Bytes(buf), warn_present: warn !== null, served: dustServed(warn) };
}
/** A failed run never moves the frame: the pointer keeps its pair and gains last_attempt. The public reason is a fixed phrase; detail stays in collector_runs. */
async function dustFail(env, ms, reason, http, detail) {
  const failed_at = nowIso();
  let cur = null; try { cur = await getJson(env, DUSTRGB.POINTER); } catch (_) {}
  const prevFails = cur && cur.last_attempt ? (cur.last_attempt.consecutive_failures || 0) : 0;
  const last_attempt = { run: new Date(ms).toISOString(), failed_at, status: 'down', http: http || 0, reason, consecutive_failures: prevFails + 1 };
  const body = cur && cur.frame ? { ...cur, last_attempt } : { schema: 1, layer: 'dustrgb', frame: null, previous: null, last_attempt, cadence: { runs_utc: DUSTRGB.RUN_HOURS_UTC }, source: DUSTRGB.SOURCE, collector_version: COLLECTOR_VERSION };
  try { await putJson(env, DUSTRGB.POINTER, body); } catch (_) {}
  await logRun(env, 'dustrgb', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));
  return 'dustrgb:down ' + reason;
}
async function collectDustRgb(env, ms) {
  const cap = await fetchText(DUSTRGB.CAP, { cf: { cacheTtl: 0 } });
  if (cap.status !== 200) return dustFail(env, ms, 'frame list http error', cap.status);
  const T = dustLatest(cap.text);
  if (!T) return dustFail(env, ms, 'frame list unreadable', 200, 'no advertised time for ' + DUSTRGB.LAYER);
  const cur = await getJson(env, DUSTRGB.POINTER);
  if (cur && cur.frame && cur.frame.requested_time === T) {   // nothing newer: no image request
    if (cur.last_attempt) await putJson(env, DUSTRGB.POINTER, { ...cur, last_attempt: null });
    await logRun(env, 'dustrgb', ms, 'ok', 200, 0, 0, 'unchanged: ' + T);
    return 'dustrgb:unchanged ' + T;
  }
  const q = `&time=${T}`;
  const pic = await dustFetch('picture', `${DUSTRGB.MAP}&format=image/jpeg&width=${DUSTRGB.PICTURE.w}&height=${DUSTRGB.PICTURE.h}${q}`, { ...DUSTRGB.PICTURE, type: 'image/jpeg' });
  if (!pic.ok) return dustFail(env, ms, pic.reason, pic.http, pic.detail);
  const mask = await dustFetch('mask', `${DUSTRGB.MAP}&format=image/png&transparent=true&width=${DUSTRGB.MASK.w}&height=${DUSTRGB.MASK.h}${q}`, { ...DUSTRGB.MASK, type: 'image/png' });
  if (!mask.ok) return dustFail(env, ms, mask.reason, mask.http, mask.detail);
  // the served-time header does not normally reach a Worker; if it ever does and disagrees, refuse the frame
  for (const [what, f] of [['picture', pic], ['mask', mask]]) if (f.served && f.served !== T) return dustFail(env, ms, what + ' served time differs', 200, `asked ${T}, server named ${f.served}`);
  const served = pic.served && mask.served ? pic.served : null;
  const dir = DUSTRGB.PREFIX + dustKeyOf(T) + '/';
  const files = { picture: { name: 'picture.jpg', type: 'image/jpeg', f: pic, ...{ w: DUSTRGB.PICTURE.w, h: DUSTRGB.PICTURE.h } }, mask: { name: 'mask.png', type: 'image/png', f: mask, ...{ w: DUSTRGB.MASK.w, h: DUSTRGB.MASK.h } } };
  const out = {};
  for (const [k, x] of Object.entries(files)) {   // write, then read back: the pointer moves only if both stored files are exactly what was validated
    const key = dir + x.name;
    try { await env.R2.put(key, x.f.buf, { httpMetadata: { contentType: x.type }, customMetadata: { sha256: x.f.sha256, requested_time: T } }); } catch (e) { return dustFail(env, ms, k + ' write failed', 200, String(e).slice(0, 160)); }
    let back = null; try { const o = await env.R2.get(key); back = o ? await o.arrayBuffer() : null; } catch (_) {}
    if (!back || back.byteLength !== x.f.bytes || await sha256Bytes(back) !== x.f.sha256) return dustFail(env, ms, k + ' read-back differs', 200, key);
    out[k] = { file: x.name, key, path: `/snapshot/dustrgb/${dustKeyOf(T)}/${x.name}`, type: x.type, bytes: x.f.bytes, sha256: x.f.sha256, w: x.w, h: x.h, warning_header_present: x.f.warn_present };
  }
  const frame = { id: dustKeyOf(T), requested_time: T, served_time: served, served_time_source: served ? 'server Warning header' : null,
    time_basis: served ? 'served time named by the server' : 'requested time only: the server can substitute the nearest frame and did not say which frame it served',
    fetched_at: nowIso(), run: new Date(ms).toISOString(), box: DUSTRGB.BOX, crs: 'EPSG:4326', picture: out.picture, mask: out.mask };
  const previous = cur && cur.frame ? { id: cur.frame.id, requested_time: cur.frame.requested_time, picture: cur.frame.picture, mask: cur.frame.mask } : null;
  await putJson(env, DUSTRGB.POINTER, { schema: 1, layer: 'dustrgb', frame, previous, last_attempt: null, cadence: { runs_utc: DUSTRGB.RUN_HOURS_UTC }, source: DUSTRGB.SOURCE, collector_version: COLLECTOR_VERSION });
  // lean storage: keep the current pair and the previous pair (one run of grace); everything else under the prefix goes, orphans of failed runs included
  try { const keep = [dir, previous ? DUSTRGB.PREFIX + previous.id + '/' : null].filter(Boolean);
    const l = await env.R2.list({ prefix: DUSTRGB.PREFIX }); for (const o of l.objects) if (!keep.some(d => o.key.startsWith(d))) await env.R2.delete(o.key); } catch (e) { console.log('dustrgb cleanup failed', String(e)); }
  await logRun(env, 'dustrgb', ms, 'ok', 200, 1, pic.bytes + mask.bytes, `frame ${T}; served-time header ${pic.warn_present ? 'present' : 'absent'} (picture), ${mask.warn_present ? 'present' : 'absent'} (mask)`);
  return 'dustrgb:published ' + T;
}
/** GET /snapshot/dustrgb/meta and /snapshot/dustrgb/<frame id>/<picture.jpg|mask.png>. Files are served only for the current or previous frame, and only if the stored bytes match the pointer. */
async function dustRoute(env, p) {
  const none = (status, reason) => json({ layer: 'dustrgb', status: 'unavailable', reason }, status, { 'Cache-Control': 'no-store' });
  let cur; try { cur = await getJson(env, DUSTRGB.POINTER); } catch (e) { return none(503, 'unreadable'); }
  if (p.length === 3 && p[2] === 'meta') {
    if (!cur) return json({ schema: 1, layer: 'dustrgb', frame: null, previous: null, last_attempt: null, now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
    const strip = f => f ? { ...f, picture: f.picture && { ...f.picture, key: undefined }, mask: f.mask && { ...f.mask, key: undefined } } : f;
    return json({ ...cur, frame: strip(cur.frame), previous: strip(cur.previous), now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (p.length !== 4 || !cur) return none(404, 'not found');
  const fr = [cur.frame, cur.previous].find(f => f && f.id === p[2]);
  const x = fr && [fr.picture, fr.mask].find(f => f && f.file === p[3]);
  if (!x) return none(404, 'not found');
  let buf; try { const o = await env.R2.get(x.key); buf = o ? await o.arrayBuffer() : null; } catch (e) { return none(503, 'unreadable'); }
  if (!buf) return none(503, 'missing');
  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');
  return new Response(buf, { headers: { 'Content-Type': x.type, 'Cache-Control': DUSTRGB.CACHE_FILE, 'ETag': '"' + x.sha256 + '"', ...CORS } });
}

async function guarded(env, layer, ms, fn) {
  try { await fn(env, ms); return layer + ':ran'; }
  catch (e) {
    const note = 'uncaught: ' + String(e).slice(0, 200);
    if (layer === 'firms' && env.FIRMS_PIPELINE === 'v2') { try { await logRun(env, layer, ms, 'down', 0, 0, 0, note); await fvDownNoInput(env, ms, note); } catch (_) {} }   // v2 never calls the unconditional writeDown
    else if (layer === 'drifters') { try { await driftFail(env, ms, 'internal_error', note, 0); } catch (_) {} }
    else if (layer === 'dustrgb') { try { await dustFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // 0.6.11: never the generic writeDown (no cells, no envelope)   // 0.6.8: buoys never call the unconditional writeDown
    else try { await writeDown(env, layer, ms, note, 0); } catch (_) {}
    return layer + ':threw ' + String(e).slice(0, 80); }
}

const JOBS = {
  five: async (env, ms) => (await Promise.all([
    guarded(env, 'usgs', ms, collectUsgs),
    env.OPENSKY_ENABLED === '1' ? guarded(env, 'opensky', ms, collectOpenskyWorld) : 'opensky:parked',
  ])).join('; '),
  minute: async (env, ms) => env.OPENSKY_ENABLED === '1' ? guarded(env, 'opensky-bbox', ms, collectOpenskyBbox) : 'opensky-bbox:parked (disable the * * * * * trigger)',
  firms: async (env, ms) => { const f = await guarded(env, 'firms', ms, env.FIRMS_PIPELINE === 'v2' ? collectFirmsV2 : collectFirms); let s; try { s = await collectShipsFallback(env, ms); } catch (e) { s = 'ships-fallback:threw ' + String(e).slice(0, 80); } return f + '; ' + s; },
  'ships-fallback': async (env, ms) => collectShipsFallback(env, ms),   // manual: /admin/run/ships-fallback (same gates)
  forest: async (env, ms) => {
    const f = await guarded(env, 'forest', ms, collectForest);
    const d = new Date(ms);   // orbital rides the :41 tick in odd UTC hours (two-hourly, off-peak for Space-Track)
    const o = env.ORBITAL_ENABLED !== '1' ? 'orbital:not scheduled (ORBITAL_ENABLED unset)' : (d.getUTCHours() % 2 === 1 && d.getUTCMinutes() === 41) ? await guarded(env, 'orbital', ms, collectOrbital) : 'orbital:skipped (odd UTC hours at :41 only)';
    return f + '; ' + o;
  },
  orbital: async (env, ms) => guarded(env, 'orbital', ms, (e, m) => collectOrbital(e, m, true)),   // manual: /admin/run/orbital (same guards)
  satellites: async (env, ms) => guarded(env, 'satellites', ms, collectSatellites),
  plastic: async (env, ms) => guarded(env, 'plastic', ms, collectPlastic),   // manual: /admin/run/plastic (no gate)
  dustrgb: async (env, ms) => guarded(env, 'dustrgb', ms, collectDustRgb),   // manual: /admin/run/dustrgb (admin key; ignores the gate and the hour, as plastic does)
  drifters: async (env, ms) => guarded(env, 'drifters', ms, collectDrifters),   // manual: /admin/run/drifters (no gate: one ~100 KB request)   // manual: /admin/run/satellites (same stamp gate)
  hourly: async (env, ms, manual) => {
    const k = await guarded(env, 'swpc', ms, collectSwpc);          // Kp is a 3-hourly product; hourly matches NWS's "know your refresh frequency" (REGISTER.md)
    const c = await guarded(env, 'co2', ms, collectCo2);
    const hr = new Date(ms).getUTCHours();
    const i = (manual || hr % 6 === 3) ? await guarded(env, 'seaice', ms, collectSeaIce) : 'seaice:skipped (runs 03/09/15/21 UTC)';   // NSIDC updates once a day
    const s = env.SATELLITES_ENABLED !== '1' ? 'satellites:not scheduled (SATELLITES_ENABLED unset)' : (!manual && hr % 2 === 1) ? await guarded(env, 'satellites', ms, collectSatellites) : 'satellites:skipped (odd UTC hours only)';
    const d = env.DRIFTERS_ENABLED !== '1' ? 'drifters:not scheduled (DRIFTERS_ENABLED unset)' : await guarded(env, 'drifters', ms, collectDrifters);
    const p = env.PLASTIC_ENABLED !== '1' ? 'plastic:not scheduled (PLASTIC_ENABLED unset)' : (await plasticDue(env, ms, false)) ? await guarded(env, 'plastic', ms, collectPlastic) : 'plastic:skipped (refreshed within 20 h)';
    const u = env.DUSTRGB_ENABLED !== '1' ? 'dustrgb:not scheduled (DUSTRGB_ENABLED unset)' : (!manual && DUSTRGB.RUN_HOURS_UTC.includes(hr)) ? await guarded(env, 'dustrgb', ms, collectDustRgb) : 'dustrgb:skipped (runs 06 and 18 UTC)';
    const b = await hourlyBatch(env, ms);
    return { swpc: k, co2: c, seaice: i, satellites: s, drifters: d, plastic: p, dustrgb: u, batch: b };
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
const LAYERS = ['usgs', 'swpc', 'opensky', 'opensky-bbox', 'firms', 'co2', 'seaice', 'mock', 'ships', 'lightning', 'forest', 'satellites', 'orbital', 'drifters', 'plastic'];   // GET-readable; ships/lightning arrive via /ingest (D11)
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

/* Repair ONE hour of ships aggregation from the objects still in R2 (added 1 Nov 2026 after hours 12/13 UTC were
 * written 'absent' although samples had been received and stored).
 *   - POST only, admin key required. Default is a read-only PREVIEW; nothing is written without ?apply=1.
 *   - Touches one layer and one hour. Never calls hourlyBatch, so no other layer and no other hour is recomputed.
 *   - Idempotent: layerHourly upserts on (layer, hour_utc) and upsertChanged upserts on (layer, cell_id, hour_utc),
 *     so running it twice converges and the second run reports 0 cell rows changed.
 *   - EVIDENCE RULE. An empty or short R2 listing cannot tell expiry from "nobody ever collected", so the listing is
 *     cross-checked against collector_runs — an independent record, written at ingest, of every attempt the hub
 *     received in that hour. We refuse unless the retained objects account for every logged attempt. History is never
 *     overwritten from a set that might be partial. */
async function reaggregate(req, env, url, layer) {
  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403, { 'Cache-Control': 'no-store' });
  if (layer !== 'ships') return json({ error: 'only ships re-aggregation is implemented', layer }, 400);
  const hour = url.searchParams.get('hour') || '';
  if (!/^\d{4}-\d\d-\d\dT\d\d$/.test(hour)) return json({ error: 'hour must look like 2026-11-01T12 (UTC)' }, 400);
  const hourMs = Date.parse(hour + ':00:00Z');
  if (!Number.isFinite(hourMs)) return json({ error: 'hour is not a valid UTC hour', hour }, 400);
  const apply = url.searchParams.get('apply') === '1';

  const listed = await env.R2.list({ prefix: `cells/${layer}/${hour}` });
  const objects = (listed.objects || []).map(o => ({ key: o.key, uploaded: o.uploaded && new Date(o.uploaded).toISOString(), size: o.size }));
  const from = new Date(hourMs).toISOString(), to = new Date(hourMs + 3600e3).toISOString();
  const logged = await env.DB.prepare('SELECT started_at, status, records, note FROM collector_runs WHERE layer = ? AND started_at >= ? AND started_at < ? ORDER BY started_at')
    .bind(layer, from, to).all();
  const attempts = (logged.results || []);
  const before = await env.DB.prepare('SELECT snapshots_expected, snapshots_ok, source_status, note, updated_at FROM layer_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
  const cellRowsBefore = await env.DB.prepare('SELECT COUNT(*) AS n FROM cell_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
  const evidence = { objects_retained: objects.length, attempts_logged: attempts.length, attempts, objects,
    oldest_object_uploaded: objects.length ? objects.map(o => o.uploaded).sort()[0] : null };

  if (!objects.length && !attempts.length) return json({ refused: 'no evidence of any attempt in this hour — nothing was received and nothing was retained, so the existing record stands', hour, evidence, before }, 409, { 'Cache-Control': 'no-store' });
  if (!objects.length) return json({ refused: 'objects for this hour are gone but attempts were logged — the retained set cannot reconstruct the hour', hour, evidence, before }, 409, { 'Cache-Control': 'no-store' });
  if (objects.length < attempts.length) return json({ refused: 'retained objects do not account for every logged attempt — repairing from a partial set would overwrite history with less than it already holds', hour, evidence, before }, 409, { 'Cache-Control': 'no-store' });

  if (!apply) {
    // Preview: read exactly what the aggregation would read, report the verdict, write nothing.
    const files = [];
    for (const o of objects) { const f = await getJson(env, o.key); if (f) files.push({ key: o.key, source_status: f.source_status, cells: Object.keys(f.cells || {}).length, overlong: f.overlong_sample ?? null, socket_connected_s: f.socket_connected_s ?? null, elapsed_wall_s: f.wall_s ?? null }); }
    const usable = files.filter(f => f.source_status === 'ok').length, downs = files.filter(f => f.source_status === 'down').length;
    const would = usable >= 2 ? 'ok' : usable > 0 ? 'degraded' : files.length === 0 ? 'absent' : downs === files.length ? 'down' : 'degraded';
    return json({ preview: true, hour, layer, evidence, files, before, cell_rows_before: cellRowsBefore && cellRowsBefore.n,
      would_write: { snapshots_ok: usable, source_status: would }, apply_with: 'POST the same URL with &apply=1' }, 200, { 'Cache-Control': 'no-store' });
  }

  const result = await aggregateShips(env, hourMs);
  const after = await env.DB.prepare('SELECT snapshots_expected, snapshots_ok, source_status, note, updated_at FROM layer_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
  const cellRowsAfter = await env.DB.prepare('SELECT COUNT(*) AS n FROM cell_hourly WHERE layer = ? AND hour_utc = ?').bind(layer, hour).first();
  return json({ applied: true, hour, layer, evidence, before, after, cell_rows_before: cellRowsBefore && cellRowsBefore.n, cell_rows_after: cellRowsAfter && cellRowsAfter.n, result }, 200, { 'Cache-Control': 'no-store' });
}


// ===== Arts (the Met) — fixed catalogue snapshot (0.6.2; Arts release proposal rev 2.1 §4.1) =====
// Not a collector and not a layer in LAYERS: no cron, no collector_runs rows, no freshness grade (no stale_after_s),
// no /status collection, no /health check, no history. The file is generated once (phase1/arts/build_arts_snapshot.py)
// and pinned here by two hashes: fileSha256 = the complete stored bytes (provenance, dates, limitations, records);
// recordsSha256 = the 479 records (= the file's snapshot_id). Nothing partial is ever served: any failure is a 503.
const ARTS = {
  key: 'ref/arts/met-R1-e394878.json',
  fileSha256: '221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644',
  recordsSha256: '067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2',
  objects: 479, countries: 25,
};
/** Serve the pinned Arts file byte for byte, or 503 {status:'unavailable', reason}. reason: missing | unreadable | integrity | invalid. */
async function artsSnapshot(env, pin = ARTS) {
  const no = reason => json({ kind: 'catalogue_snapshot', layer: 'arts', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });
  let o;
  try { o = await env.R2.get(pin.key); } catch (e) { return no('unreadable'); }
  if (!o) return no('missing');
  let buf;
  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }
  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');                     // the WHOLE file, not just the records
  let j;
  try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }
  if (!j || j.kind !== 'catalogue_snapshot' || j.layer !== 'arts' || !Array.isArray(j.records) || !j.counts) return no('invalid');
  if (j.snapshot_id !== pin.recordsSha256) return no('integrity');
  if (j.records.length !== pin.objects || j.counts.objects !== pin.objects || j.counts.countries !== pin.countries) return no('invalid');
  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'ETag': '"' + pin.fileSha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
}

// ===== Timeline catalogue (0.6.3; TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §4) =====
// Same rules as Arts: outside LAYERS, cron, D1, /status collection, /health and history; generated once
// (phase1/timeline/build_timeline.py) and pinned by the complete file's sha256. Nothing partial is ever served.
// 0.6.4 (TIMELINE-CATALOGUE-REVISIONS-PROPOSAL rev 1.1): published revisions are IMMUTABLE — a pin (key, sha256, bytes)
// never changes once published; changed bytes get a new revision id AND a new object key. Old pins and objects stay so
// older pages can still fetch the bytes they expect (ref/ has no lifecycle rule). Removing one is a separate approval.
const TIMELINE_REVISIONS = Object.freeze({
  'tl-2026-11-R1': Object.freeze({
    key: 'ref/timeline/tl-2026-11-R1.json',
    revision: 'tl-2026-11-R1',
    fileSha256: '096ae648479b744f458cdf5d042667c6a6262114ee63252cf132c41f99050fbe',
    bytes: 15656,
  }),
  // 0.6.9 (TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1): schema 2 — change records, per-entry evidence_reviewed, release block.
  'tl-2026-11-R2': Object.freeze({
    key: 'ref/timeline/tl-2026-11-R2.json',
    revision: 'tl-2026-11-R2',
    fileSha256: '2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356',
    bytes: 18120,
  }),
});
const TIMELINE_LEGACY = 'tl-2026-11-R1';    // what the unversioned /catalogue/timeline serves — permanently (pages built before 0.6.4 expect it)
const TIMELINE_CURRENT = 'tl-2026-11-R2';   // discovery metadata only; no route serves "current" implicitly
const TIMELINE = TIMELINE_REVISIONS[TIMELINE_LEGACY];   // = the legacy pin (kept for the 0.6.3 name)
/** The pin for an exact revision id, or null. Own-property lookup only: no pattern-built R2 keys, so no path tricks. */
function timelinePin(rev, table = TIMELINE_REVISIONS) {
  return typeof rev === 'string' && Object.prototype.hasOwnProperty.call(table, rev) ? table[rev] : null;
}
/** Route /catalogue/timeline[/<revision>] on the RAW pathname (the shared parser drops empty segments, so it is not used here).
 *  Exactly '/catalogue/timeline' or '/catalogue/timeline/' (one trailing slash, as 0.6.3) → TIMELINE_LEGACY;
 *  exactly '/catalogue/timeline/<one non-empty segment>' → that pin; anything else (repeated or leading separators,
 *  a trailing slash after a revision, extra segments) or an unknown id → 404, no R2 read. */
async function timelineRoute(env, rawPath, table = TIMELINE_REVISIONS, legacy = TIMELINE_LEGACY) {
  if (rawPath === '/catalogue/timeline' || rawPath === '/catalogue/timeline/') return timelineCatalogue(env, table[legacy]);
  const m = typeof rawPath === 'string' ? rawPath.match(/^\/catalogue\/timeline\/([^/]+)$/) : null;
  let rev = null;
  if (m) { try { rev = decodeURIComponent(m[1]); } catch (e) { rev = null; } }
  const pin = timelinePin(rev, table);
  if (!pin) return json({ kind: 'catalogue', catalogue: 'timeline', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });
  return timelineCatalogue(env, pin);
}
/** Serve the pinned Timeline catalogue byte for byte, or 503 {status:'unavailable', reason}. reason: missing | unreadable | integrity | invalid. */
async function timelineCatalogue(env, pin = TIMELINE) {
  const no = reason => json({ kind: 'catalogue', catalogue: 'timeline', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });
  let o;
  try { o = await env.R2.get(pin.key); } catch (e) { return no('unreadable'); }
  if (!o) return no('missing');
  let buf;
  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }
  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');                     // the WHOLE catalogue file (timeline)
  let j;
  try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }
  if (!j || j.catalogue !== 'timeline' || j.catalogue_revision !== pin.revision || !Array.isArray(j.entries) || !Array.isArray(j.shelf) || !j.chart) return no('invalid');
  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'ETag': '"' + pin.fileSha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
}

// ===== Sky catalogue (0.6.5; SKY-TWO-CLOCKS-PROPOSAL rev 3 §5a; T3 compatibility contract) =====
// Same rules as the Timeline revisions: outside LAYERS, cron, D1, /status collection, /health and history; generated once
// (phase1/sky/build_sky.py) from hand-taken Horizons exports and pinned by the complete file's sha256. Revisions are
// IMMUTABLE: a refresh gets a new revision id and a new object key; old pins and objects stay. There is no unversioned URL.
const SKY_REVISIONS = Object.freeze({
  'sky-2026-11-R1': Object.freeze({
    key: 'ref/sky/sky-2026-11-R1.json',
    revision: 'sky-2026-11-R1',
    fileSha256: 'f851f16438415bc1e05b392e3e1616052b6347c637ee5ea98df307052058368a',
    bytes: 71925,
  }),
  // 0.6.6 (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §7): the zoom-out SCENE file, built by phase1/sky/build_scene.py from the same raw
  // exports as R1 and paired with it (pairs_with = R1 + its sha256; the page refuses any other pair). Same envelope rules.
  'sky-scene-2026-11-R1': Object.freeze({
    key: 'ref/sky/sky-scene-2026-11-R1.json',
    revision: 'sky-scene-2026-11-R1',
    fileSha256: 'd4605c3d4abc2c022aef6d5df4d2e92f7c29a01c583b43fa7efdbbaf9901ae29',
    bytes: 67778,
  }),
});
const SKY_CURRENT = 'sky-2026-11-R1';   // discovery metadata only; no route serves "current" implicitly
const SKY_SCENE_CURRENT = 'sky-scene-2026-11-R1';   // discovery metadata only (0.6.6)
function skyPin(rev, table = SKY_REVISIONS) {
  return typeof rev === 'string' && Object.prototype.hasOwnProperty.call(table, rev) ? table[rev] : null;
}
/** Route /catalogue/sky/<revision> on the RAW pathname: exactly one non-empty segment after /catalogue/sky/; anything
 *  else (bare /catalogue/sky, repeated or leading separators, trailing slash, extra segments) or an unknown id → 404, no R2 read. */
async function skyRoute(env, rawPath, table = SKY_REVISIONS) {
  const m = typeof rawPath === 'string' ? rawPath.match(/^\/catalogue\/sky\/([^/]+)$/) : null;
  let rev = null;
  if (m) { try { rev = decodeURIComponent(m[1]); } catch (e) { rev = null; } }
  const pin = skyPin(rev, table);
  if (!pin) return json({ kind: 'catalogue', catalogue: 'sky', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });
  return skyCatalogue(env, pin);
}
/** Serve the pinned Sky catalogue byte for byte, or 503 {status:'unavailable', reason}. reason: missing | unreadable | integrity | invalid. */
async function skyCatalogue(env, pin) {
  const no = reason => json({ kind: 'catalogue', catalogue: 'sky', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });
  let o;
  try { o = await env.R2.get(pin.key); } catch (e) { return no('unreadable'); }
  if (!o) return no('missing');
  let buf;
  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }
  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');
  let j;
  try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }
  const ok = b => b && Array.isArray(b.rows) && b.rows.length > 0;
  if (!j || j.catalogue !== 'sky' || j.catalogue_revision !== pin.revision || !j.bodies || !ok(j.bodies.moon) || !ok(j.bodies.sun) || !j.coverage) return no('invalid');
  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'ETag': '"' + pin.fileSha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
}

// ===== Ocean Heat snapshot files (0.6.7; OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §2) =====
// Same rules as Sky / Timeline: outside LAYERS, cron, D1, /status collection, /health and history. A revision is IMMUTABLE: any byte
// change gets a new revision id, a new R2 prefix and new pins here and in the page. The Worker checks length and sha256 only; it never
// parses or alters the files. The build-time check (phase1/ocean-heat/check_release_pins.mjs) ties these pins to the manifest and the
// page. The .bin.z files are zlib streams the page inflates itself: served as application/octet-stream with NO Content-Encoding.
const OCEANHEAT_REVISIONS = Object.freeze({
  'oh-2026-11-09-R1': Object.freeze({
    revision: 'oh-2026-11-09-R1',
    files: Object.freeze({
      'manifest.json': Object.freeze({ key: 'ref/oceanheat/oh-2026-11-09-R1/manifest.json', sha256: 'dcc3467428e38e76966508d10078d322b8d724ed784de3266ae0b62354f5af1b', bytes: 4585, type: 'application/json' }),
      'mask.bin.z': Object.freeze({ key: 'ref/oceanheat/oh-2026-11-09-R1/mask.bin.z', sha256: '349fc0237d35443864ce58bebc221d19672440d14604e24a86df595ced10bb9c', bytes: 137652, type: 'application/octet-stream' }),
      'v025.bin.z': Object.freeze({ key: 'ref/oceanheat/oh-2026-11-09-R1/v025.bin.z', sha256: '3e66d63c816b01c561a038f757fdc5628ec1be96857232f8ed62b8dac2be1ae0', bytes: 1081272, type: 'application/octet-stream' }),
      'v050.bin.z': Object.freeze({ key: 'ref/oceanheat/oh-2026-11-09-R1/v050.bin.z', sha256: 'be418c11f7f7903c11bdd7e33454502fa95c5a58a564d606f8f4fdfbcc00c725', bytes: 323176, type: 'application/octet-stream' }),
    }),
  }),
});
const OCEANHEAT_CURRENT = 'oh-2026-11-09-R1';   // discovery metadata only; no route serves "current" implicitly
const OCEANHEAT_CACHE_OK = 'public, max-age=86400, immutable';   // verified 200s only (Q1); 404 and 503 are no-store
function oceanHeatPin(rev, file, table = OCEANHEAT_REVISIONS) {
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  return own(table, rev) && own(table[rev].files, file) ? table[rev].files[file] : null;
}
/** Route /catalogue/oceanheat/<revision>/<file> on the RAW pathname: exactly two non-empty segments, each matched LITERALLY (never
 *  percent-decoded) against an exact key; anything else (bare, partial, extra segment, trailing slash, repeated separators, any
 *  percent-encoded spelling such as %2F or %6danifest.json, unknown id or file) → 404, no R2 read. */
async function oceanHeatRoute(env, rawPath, table = OCEANHEAT_REVISIONS) {
  const m = typeof rawPath === 'string' ? rawPath.match(/^\/catalogue\/oceanheat\/([^/]+)\/([^/]+)$/) : null;
  const pin = m ? oceanHeatPin(m[1], m[2], table) : null;
  if (!pin) return json({ kind: 'catalogue', catalogue: 'oceanheat', status: 'unknown revision or file' }, 404, { 'Cache-Control': 'no-store' });
  return oceanHeatFile(env, pin);
}
/** Serve one pinned file byte for byte, or 503 {status:'unavailable', reason}. reason: missing | unreadable | size | integrity. */
async function oceanHeatFile(env, pin) {
  const no = reason => json({ kind: 'catalogue', catalogue: 'oceanheat', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });
  let o;
  try { o = await env.R2.get(pin.key); } catch (e) { return no('unreadable'); }
  if (!o) return no('missing');
  let buf;
  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }
  if (buf.byteLength !== pin.bytes) return no('size');
  if (await sha256Bytes(buf) !== pin.sha256) return no('integrity');
  return new Response(buf, { headers: { 'Content-Type': pin.type, 'Cache-Control': OCEANHEAT_CACHE_OK, 'ETag': '"' + pin.sha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
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
    if (p[0] === 'admin' && p[1] === 'reaggregate') {
      if (req.method !== 'POST') return json({ error: 'POST only (this can write history)' }, 405);
      return reaggregate(req, env, url, p[2] || '');
    }
    if (p[0] === 'health') {   // 0.5.3: external monitor checks; HEAD is the UptimeRobot HTTP monitor's default request
      if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'GET or HEAD only' }, 405, { 'Cache-Control': 'no-store' });
      return health(req, env, p[1] || '', p[2] || '');
    }
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405);

    if (p[0] === 'snapshot' && p[1] === 'dustrgb') return dustRoute(env, p);   // 0.6.11: pointer + the current and previous frame files; outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'arts' && p.length === 2) return artsSnapshot(env);   // 0.6.2: fixed catalogue, outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'timeline') return timelineRoute(env, url.pathname);   // 0.6.3 legacy URL (pinned to R1) + 0.6.4 /<revision>; outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'sky') return skyRoute(env, url.pathname);   // 0.6.5 versioned only; outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'oceanheat') return oceanHeatRoute(env, url.pathname);   // 0.6.7 versioned files only; outside LAYERS

    if (p[0] === 'snapshot' || p[0] === 'cells') {
      const layer = p[1];
      if (!LAYERS.includes(layer)) return json({ error: 'unknown layer', layers: LAYERS }, 404);
      const key = (p[0] === 'snapshot' ? 'latest/' : 'latest-cells/') + layer + '.json';
      const o = await env.R2.get(key);
      if (!o) return json({ error: 'no snapshot yet', layer }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'ETag': o.httpEtag, ...CORS } });
    }

    if (p[0] === 'elements' && p[1] === 'orbital') {   // the validated, classified orbital element file; served as stored
      const m = await getJson(env, ORBF.metaKey);
      const o = m && m.elements && m.elements.key ? await env.R2.get(m.elements.key) : null;
      if (!o) return json({ error: 'no element file yet', layer: 'orbital' }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'public, max-age=600', 'ETag': o.httpEtag, 'X-Elements-SHA256': (o.customMetadata && o.customMetadata.sha256) || '', 'Access-Control-Expose-Headers': 'ETag, X-Elements-SHA256', ...CORS } });
    }

    if (p[0] === 'elements' && p[1] === 'satellites') {   // the validated GP CSV the page propagates; served as stored
      const m = await getJson(env, SAT.metaKey);
      const o = m && m.elements && m.elements.key ? await env.R2.get(m.elements.key) : null;
      if (!o) return json({ error: 'no element file yet', layer: 'satellites' }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'public, max-age=600', 'ETag': o.httpEtag, 'X-Elements-SHA256': (o.customMetadata && o.customMetadata.sha256) || '', 'Access-Control-Expose-Headers': 'ETag, X-Elements-SHA256', ...CORS } });
    }

    if (p[0] === 'place' && p[1] === 'g4') return place(env, url, p[2] || '');

    if (p[0] === 'status') {
      const runs = await env.DB.prepare('SELECT layer, started_at, status, http_status, records, bytes FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)').all();   // 0.6.10: run notes stay in D1, not public (STATUS-RUN-NOTES-PROPOSAL rev 2)
      const spend = await env.DB.prepare('SELECT * FROM opensky_spend WHERE day = ?').bind(dayKey(Date.now())).first();
      const batch = await env.DB.prepare('SELECT * FROM batch_runs ORDER BY id DESC LIMIT 1').first();
      return json(redactStatus(env, { now: nowIso(), collector_version: COLLECTOR_VERSION, schema_version: SCHEMA_VERSION, cell_deg: CELL_DEG, stale_after_s: STALE_AFTER_S, last_runs: runs.results, opensky_spend_today: spend, last_batch: batch, history: await historyState(env), archive_health: await archiveHealth(env, Date.now()) }), 200, { 'Cache-Control': 'no-store' });   // 0.5.3: notes redacted
    }

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'r2-conditional') {   // 0.6.0: the R2 behaviours FIRMS v2 relies on, on THIS bucket; writes only probe/ keys, deletes them
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      try { return json(await fvProbeR2(env), 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ error: String(e).slice(0, 200) }, 500, { 'Cache-Control': 'no-store' }); }
    }

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'ships') {   // 0.3.3: private Worker listen to aisstream; publishes nothing
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      if (url.searchParams.get('last') === '1') return json({ last: await getJson(env, SP.stateKey) }, 200, { 'Cache-Control': 'no-store' });
      const w = Math.min(90, Math.max(10, Number(url.searchParams.get('window') || 60)));
      try { return json(await probeShips(env, Date.now(), w), 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ error: String(e).slice(0, 200) }, 500, { 'Cache-Control': 'no-store' }); }
    }

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'spacetrack') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      if (url.searchParams.get('last') === '1') return json({ last: await getJson(env, ST.stateKey) }, 200, { 'Cache-Control': 'no-store' });
      try { return json(await probeSpacetrack(env, Date.now()), 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ error: String(e).slice(0, 200) }, 500, { 'Cache-Control': 'no-store' }); }
    }

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'orbital-build') {   // 0.2.4: run orbBuild on the staged GP copy; no upstream request, writes nothing
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      const o = await env.R2.get(ST.stagingKey);
      if (!o) return json({ error: 'no staged GP copy' }, 404);
      const t0 = Date.now(); const text = await o.text(); const tRead = Date.now() - t0;
      const r = orbBuild(text, null, null);
      return json({ staged_bytes: text.length, read_ms: tRead, ok: r.ok, rows: r.rows, counts: r.counts, problems: r.problems, out_bytes: r.csv ? r.csv.length : 0, wall_ms: Date.now() - t0,
        note: 'CPU for this request is in the Worker invocation log; nothing was written' }, 200, { 'Cache-Control': 'no-store' });
    }

    if (p[0] === 'admin' && p[1] === 'run') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      const job = p[2];
      if (!JOBS[job]) return json({ error: 'unknown job', jobs: Object.keys(JOBS) }, 404);
      const t0 = Date.now();
      try { const r = await JOBS[job](env, Date.now(), true); return json({ job, result: r, wall_ms: Date.now() - t0 }, 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ job, error: String(e), wall_ms: Date.now() - t0 }, 500, { 'Cache-Control': 'no-store' }); }
    }

    return json({ name: 'Mother Earth collector', version: COLLECTOR_VERSION, history: await historyState(env), endpoints: ['/snapshot/<layer>', '/cells/<layer>', '/place/g4/<row>_<col>', '/elements/satellites', '/elements/orbital', '/status', '/health/<check>/<layer>', '/snapshot/arts', '/catalogue/timeline', '/catalogue/timeline/<revision>', '/catalogue/sky/<revision>', '/catalogue/oceanheat/<revision>/<file>', '/snapshot/dustrgb/meta', '/snapshot/dustrgb/<frame>/<file>'], layers: LAYERS, catalogues: { arts: { path: '/snapshot/arts', kind: 'fixed catalogue snapshot', source_date: '2026-11-02' }, timeline: { path: '/catalogue/timeline', kind: 'fixed catalogue', revision: TIMELINE_LEGACY, current: TIMELINE_CURRENT, versioned_path: '/catalogue/timeline/<revision>', revisions: Object.keys(TIMELINE_REVISIONS) }, sky: { kind: 'fixed catalogue', versioned_path: '/catalogue/sky/<revision>', current: SKY_CURRENT, scene: SKY_SCENE_CURRENT, revisions: Object.keys(SKY_REVISIONS) }, oceanheat: { kind: 'fixed snapshot files', versioned_path: '/catalogue/oceanheat/<revision>/<file>', current: OCEANHEAT_CURRENT, revisions: Object.keys(OCEANHEAT_REVISIONS) } },
      promise: 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.' });
  },
};
