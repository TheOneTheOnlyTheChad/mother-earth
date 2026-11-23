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
 *   GET /snapshot/<layer>   latest full snapshot (records + cells). opensky (0.6.18): built on an explicit schema; records are [lat, lng] only,
 *                           rounded to 0.01°, served only while AIRCRAFT_POSITIONS=1 and the snapshot is under 3 h old; no-store; no dated copy
 *   POST /admin/aircraft/clear-positions?key=…  (0.6.18) remove positions from the one stored copy (rollback)
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
 *   GET /snapshot/skycraft/meta, /snapshot/skycraft/<id> (0.6.12) Parker Solar Probe hub snapshot from NASA/JPL Horizons (pointer + current/previous)
 *   GET /catalogue/skycraft/<revision> (0.6.12) the two dated spacecraft examples (LRO June 2026, Parker Dec 2024), pinned
 *   GET /snapshot/sunface/meta, /snapshot/sunface/<id>/sun.jpg (0.6.13) NASA/SDO HMI continuum picture of the Sun, hourly (pointer + current/previous)
 *   GET /admin/probe/sunface?key=ADMIN_KEY (0.6.13) exactly ONE request for that picture; stores nothing
 *   GET /snapshot/wind/meta, /snapshot/wind/grid/<sha256>.i16 (0.6.16) modelled wind at three heights from NOAA/NCEP GFS (manifest + the
 *                           current and previous revision's grids). Scheduled job gated by WIND_ENABLED=1; /admin/run/wind runs it once.
 *   GET /admin/probe/skycraft?key=ADMIN_KEY (0.6.12) exactly ONE Horizons request with the application User-Agent; stores nothing
 *   POST /admin/probe/earthview  (0.6.21, Stage B) key in the Authorization header ONLY ("Bearer <ADMIN_KEY>"); no query string accepted.
 *                           ONE no-store validation of the newest GeoColour frame in this isolate: at most 3 upstream requests, a
 *                           150 s whole-run deadline, nothing stored. Runs only while EARTHVIEW_ENABLED is unset.
 *   GET|POST /admin/earthview/<status|hold|recover|sweep|release> (0.6.20) Earth from Space storage. GET is a dry run that
 *                           writes nothing; POST with apply=1 acts (recover and sweep also need plan=<id> from the dry run).
 *                           0.6.22: key in the Authorization header ONLY ("Bearer <ADMIN_KEY>"); a request with key= in its URL is refused (400).
 *   POST /admin/run/earthview (0.6.22) one manual collection. Key in the Authorization header ONLY; no query string. Runs only while
 *                           EARTHVIEW_ENABLED is "manual" or "1". The other /admin/run/<job> routes are unchanged.
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
const COLLECTOR_VERSION = '0.6.23';
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
/* Aircraft (0.6.18, aircraft-dots-rc rev 2). The only per-aircraft values this hub ever stores or serves for the opensky layer are a
 * latitude and a longitude (basis: OpenSky ticket #837506, 17 Nov 2026; terms §3(i): no aircraft identifiers in anything published).
 *   - EXPLICIT SCHEMA. Nothing an uploader sends is copied through. aircraftProject() builds every stored and served object from
 *     nothing, key by key, nested objects included, with typed values; every sentence in the file is the hub's own text. A key
 *     this function does not name cannot reach storage or a reader, wherever in the upload it sits.
 *   - Positions are OFF unless the plain variable AIRCRAFT_POSITIONS is "1". Off: uploads are stored without records and
 *     /snapshot/opensky serves none. Removing the variable stops positions being served at once (the route reads it on every request).
 *   - EXPIRY AT THE HUB. /snapshot/opensky serves positions only while the snapshot's own time is less than three hours old; after
 *     that the same file is served without them. Both aircraft routes answer no-store, so no cache outlives that decision.
 *   - No history: the dated copy under snapshots/ never holds records for this layer; the one stored copy of positions is
 *     latest/opensky.json, overwritten by the next upload, and POST /admin/aircraft/clear-positions removes them from it. */
const AIRCRAFT_LAYER = 'opensky', AIRCRAFT_FIELDS = ['lat', 'lng'], AIRCRAFT_STEP_DEG = 0.01, AIRCRAFT_MAX_AGE_S = 3 * 3600, AIRCRAFT_MAX_RECORDS = 60000;
const AIRCRAFT_COUNT_KEYS = ['state_vectors', 'counted', 'without_position', 'position_older_than_cutoff', 'position_time_missing', 'duplicate_addresses', 'on_ground'];
const AIRCRAFT_TEXT = {
  quantity: s => `aircraft in one OpenSky Network state snapshot whose position was reported no more than ${s} s before the snapshot time, counted per 4-degree cell at that last reported position. Heard only where a volunteer receiver is in range: a cell with no count is not an empty sky.`,
  policyCounts: 'counts per cell only: no aircraft identifiers, callsigns, positions or tracks are stored or published',
  policyPositions: `rounded positions without identifiers: one latitude and longitude per counted aircraft, rounded to ${AIRCRAFT_STEP_DEG} degree and ordered by position; no aircraft identifier, callsign, country, altitude, speed, heading, on-ground flag, per-aircraft time or track is stored or published; each snapshot replaces the last; positions are served for three hours from the snapshot time`,
  cadence: 'about 10 requests a day while the collecting computer is awake', citation: 'The OpenSky Network, https://opensky-network.org' };
const aircraftOn = env => !!env && env.AIRCRAFT_POSITIONS === '1';
function aircraftFieldsOk(f) { return Array.isArray(f) && (f.length === 0 || (f.length === AIRCRAFT_FIELDS.length && f.every((x, i) => x === AIRCRAFT_FIELDS[i]))); }
function aircraftRowOk(r) {
  if (!Array.isArray(r) || r.length !== 2) return false; const la = r[0], lo = r[1], k = Math.round(1 / AIRCRAFT_STEP_DEG);
  return typeof la === 'number' && typeof lo === 'number' && Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180
    && Math.abs(la * k - Math.round(la * k)) <= 1e-6 && Math.abs(lo * k - Math.round(lo * k)) <= 1e-6;
}
/* A fixed phrase for a failed collection. The collector's own note is free text, so it is matched, never copied. */
function aircraftDownNote(note) {
  const n = String(note || ''); let m;
  if ((m = /states refused \(HTTP (\d{3})\)/.exec(n))) return 'OpenSky states request refused (HTTP ' + m[1] + ')';
  if ((m = /token refused \(HTTP (\d{3})\)/.exec(n))) return 'OpenSky token request refused (HTTP ' + m[1] + ')';
  if (/not set/.test(n)) return 'collector credentials not set';
  if (/no states array or time/.test(n)) return 'OpenSky response not readable';
  if (/Timeout|timed out|AbortError|aborted/i.test(n)) return 'request timed out';
  if (/fetch failed/.test(n)) return 'request failed';
  return 'collection failed';
}
/* The whole aircraft file, rebuilt from nothing. `withRecords` false, a field list that is not exactly lat,lng, or a single row
 * that is not a rounded latitude and longitude: no records at all. Returns a new object; the input is never stored. */
function aircraftProject(e, withRecords) {
  e = e && typeof e === 'object' ? e : {};
  const iso = v => (typeof v === 'string' && Number.isFinite(Date.parse(v))) ? new Date(Date.parse(v)).toISOString() : null;
  const nat = v => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e9) ? v : null;
  const ver = v => (typeof v === 'string' && /^(?:(?:mac|pi)-)?\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) ? v : 'unknown';                       // a version number, or nothing
  const agent = v => (typeof v === 'string' && /^(?:mother-earth-(?:mac|pi)-|hub )\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) ? v : 'unknown';   // our own collectors' names, or nothing
  const status = ['ok', 'degraded', 'down'].includes(e.source_status) ? e.source_status : 'down';
  const cut = (typeof e.position_age_cutoff_s === 'number' && e.position_age_cutoff_s > 0 && e.position_age_cutoff_s <= 3600) ? e.position_age_cutoff_s : null;
  const stale = (typeof e.stale_after_s === 'number' && e.stale_after_s > 0) ? Math.min(e.stale_after_s, AIRCRAFT_MAX_AGE_S) : AIRCRAFT_MAX_AGE_S;
  const cells = {};
  if (e.cells && typeof e.cells === 'object' && !Array.isArray(e.cells)) for (const id of Object.keys(e.cells)) {
    const m = /^(\d{1,2})_(\d{1,2})$/.exec(id), c = e.cells[id];
    if (!m || +m[1] >= 180 / CELL_DEG || +m[2] >= 360 / CELL_DEG || !c || nat(c.count) === null) continue;
    const g = c.coverage && ['adequate', 'partial', 'unknown'].includes(c.coverage.grade) ? c.coverage.grade : 'unknown';
    cells[m[1] + '_' + m[2]] = { count: c.count, coverage: { grade: g, evidence: c.coverage && c.coverage.evidence === 'volunteer_receivers_only' ? 'volunteer_receivers_only' : 'unspecified' } };
  }
  let records = [];
  if (withRecords && status !== 'down' && aircraftFieldsOk(e.record_fields) && e.record_fields.length === 2 && Array.isArray(e.records) && e.records.length <= AIRCRAFT_MAX_RECORDS && e.records.every(aircraftRowOk)) records = e.records.map(r => [r[0], r[1]]);
  const out = { schema_version: SCHEMA_VERSION, collector_version: ver(e.collector_version), layer: AIRCRAFT_LAYER,
    window_start: iso(e.window_start), window_end: iso(e.window_end), retrieved_at: iso(e.retrieved_at), scheduled_for: iso(e.scheduled_for),
    source_status: status, interruptions: [], stale_after_s: stale, cells,
    record_format: 'rows', record_fields: records.length ? AIRCRAFT_FIELDS.slice() : [], records,
    coverage_default: { grade: 'partial', evidence: 'volunteer_receivers_only' },
    quantity: AIRCRAFT_TEXT.quantity(cut === null ? 'a stated number of' : cut), position_age_cutoff_s: cut };
  if (e.counts && typeof e.counts === 'object' && !Array.isArray(e.counts)) { out.counts = {}; for (const k of AIRCRAFT_COUNT_KEYS) out.counts[k] = nat(e.counts[k]); }
  if (records.length) out.position_precision_deg = AIRCRAFT_STEP_DEG;
  out.records_policy = records.length ? AIRCRAFT_TEXT.policyPositions : AIRCRAFT_TEXT.policyCounts;
  out.credits_remaining = nat(e.credits_remaining); out.cadence = AIRCRAFT_TEXT.cadence; out.citation = AIRCRAFT_TEXT.citation;
  if (status === 'down') out.note = aircraftDownNote(e.note);
  if (iso(e.received_at)) out.received_at = iso(e.received_at);
  if (typeof e.ingested_from === 'string') out.ingested_from = agent(e.ingested_from);
  return out;
}
const aircraftNoRecords = e => { const c = { ...e }; delete c.records; delete c.record_fields; delete c.record_format; delete c.position_precision_deg; c.records_policy = AIRCRAFT_TEXT.policyCounts; return c; };
/* GET /snapshot/opensky and /cells/opensky. The stored file is projected again on the way out, so a file written by an earlier
 * hub version is held to the same schema. `positions` says what was done: published | none | withheld_off | withheld_expired. */
async function aircraftRoute(env, kind) {
  const NS = { 'Cache-Control': 'no-store' };
  const o = await env.R2.get((kind === 'snapshot' ? 'latest/' : 'latest-cells/') + AIRCRAFT_LAYER + '.json');
  if (!o) return json({ error: 'no snapshot yet', layer: AIRCRAFT_LAYER }, 404, NS);
  let stored; try { stored = JSON.parse(await o.text()); } catch (_) { return json({ error: 'stored aircraft file is not readable', layer: AIRCRAFT_LAYER }, 503, NS); }
  if (kind === 'cells') return json(aircraftNoRecords(aircraftProject(stored, false)), 200, NS);
  const full = aircraftProject(stored, true), had = full.records.length > 0;
  const t = Date.parse(full.window_end), expired = !Number.isFinite(t) || Date.now() - t >= AIRCRAFT_MAX_AGE_S * 1e3 || t > Date.now();   // no readable time, or ANY time later than the hub's clock, is not served either (no allowance; it clears itself once the clock passes it)
  const state = !had ? 'none' : !aircraftOn(env) ? 'withheld_off' : expired ? 'withheld_expired' : 'published';
  const out = state === 'published' ? full : aircraftProject(stored, false);
  out.positions = state; out.positions_max_age_s = AIRCRAFT_MAX_AGE_S;
  return json(out, 200, NS);
}
/* POST /admin/aircraft/clear-positions?key=…  Removes positions from the one stored copy. For a rollback: remove AIRCRAFT_POSITIONS
 * (serving stops at once), then call this so nothing is left in storage. Safe to repeat. */
async function aircraftClear(req, env, url) {
  const NS = { 'Cache-Control': 'no-store' };
  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403, NS);
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, NS);
  const cur = await getJson(env, `latest/${AIRCRAFT_LAYER}.json`);
  if (!cur) return json({ ok: true, cleared: 0, note: 'no stored aircraft file' }, 200, NS);
  const had = Array.isArray(cur.records) ? cur.records.length : 0;
  await putJson(env, `latest/${AIRCRAFT_LAYER}.json`, aircraftProject(cur, false));
  return json({ ok: true, cleared: had, positions_variable_on: aircraftOn(env) }, 200, NS);
}
async function writeSnapshot(env, layer, scheduledMs, envelope) {
  const stamp = isoMinute(scheduledMs);
  if (layer === AIRCRAFT_LAYER) envelope = aircraftProject(envelope, aircraftOn(env));   // explicit schema; no records unless positions are switched on
  const cellsOnly = layer === AIRCRAFT_LAYER ? aircraftNoRecords(envelope) : { ...envelope, records: undefined, record_fields: undefined, record_format: undefined };
  const dated = await putJson(env, `snapshots/${layer}/${stamp}.json`, layer === AIRCRAFT_LAYER ? cellsOnly : envelope, { retrieved_at: String(envelope.retrieved_at) });   // retrieved_at lets a listing order snapshots by full timestamp
  await putJson(env, `cells/${layer}/${stamp}.json`, cellsOnly);
  const latest = await putJson(env, `latest/${layer}.json`, envelope);
  const full = layer === AIRCRAFT_LAYER ? latest : dated;   // bytes reported for the run: the file that holds the records
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
/* ---- SHIPS PUBLICATION RULE (0.6.19, 18 Nov 2026; docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md rev 2.1, Parts B and C) ----------
 * One rule for both writers (the Mac's upload through /ingest/ships and the hub's own fallback sample):
 *  - ELIGIBLE sample: status ok or degraded, and NOT overlong. An ordinary low-flow sample is eligible. An overlong sample never is.
 *    A down attempt is not a sample.
 *  - RETAINED sample: the last eligible sample published. latest/ships.json (records) and latest-cells/ships.json (counts) keep it
 *    exactly as published: its cells, records, retrieved_at, window and run time. An attempt never renews its three-hour life:
 *    everything that judges freshness (the page, /place, the fallback's "is the Mac stale" test) reads the sample's own retrieved_at.
 *  - An INELIGIBLE attempt (a failure, or an overlong sample) never becomes latest. It is archived and logged with its true
 *    status, and the counts file gains last_attempt { run, at, status, reason, [elapsed_s, window_s], collected_by, consecutive }.
 *    It never writes the records file.
 *  - Nothing eligible to retain, or the retained sample is three hours old or more: the counts file becomes a down-shaped
 *    envelope with a fixed phrase (and the same last_attempt). An expired sample is not brought back by a later attempt.
 *  - ORDER is by RUN time (scheduled_for), never by arrival. With S retained and L the recorded last_attempt:
 *      an ineligible attempt is applied only if it is later than S and later than L (else archived and logged only);
 *      an eligible sample later than S and later than L replaces S and the attempt note goes;
 *      an eligible sample later than S but older than L becomes the retained sample and L is KEPT (consecutive set to 1);
 *      an eligible sample older than the published one is archived only.
 *  - RECORDS AND COUNTS: both writes are conditional on what was read (etag, or create-only). Records first, then counts.
 *    A writer that loses re-reads once and applies the same rule; if it loses again it stops, logs publish_conflict and changes
 *    nothing more. A writer interrupted between its two writes leaves records newer than counts: every reader checks that both
 *    name the same run and withholds records until they do; the next ships write of any kind completes that sample's counts
 *    (shipsRepair): a failure, an overlong sample, or an eligible upload that is archived only. A conflict that stops a write,
 *    or a repair, is written on that run's collector_runs row beside the attempt's own status and note.
 *  - PUBLIC TEXT is a fixed phrase. The raw note stays in collector_runs and the dated per-run object (no public route). */
const SHIPS_PUB = { rec: 'latest/ships.json', cells: 'latest-cells/ships.json' };
const SHIPS_COLLECTOR_PHRASES = ['websocket error before connection', 'websocket error after connection', 'connection closed before confirmation', 'no subscription confirmation within the window', 'connect timeout (15 s)', 'collector error'];   // collector mac-0.3.5's own fixed phrases
const SHIPS_PHRASE = { collector: 'collector reported a failure', fallback: 'cloud fallback failed', overlong: 'latest sample ran past its window and is not shown' };
const shipsEligible = e => !!(e && typeof e === 'object' && (e.source_status === 'ok' || e.source_status === 'degraded') && e.overlong_sample !== true && e.cells && e.retrieved_at && e.scheduled_for);
const shipsCellsOnly = e => { const c = { ...e, records: undefined, record_fields: undefined, record_format: undefined }; delete c.last_attempt; return c; };
const shipsExpired = (e, nowMs) => !((nowMs - Date.parse(e.retrieved_at)) / 1000 < (e.stale_after_s || STALE_AFTER_S.ships));
/** The counts file for eligible sample E, given the attempt note L already recorded: L stays only if it is LATER than E. */
const shipsCellsFor = (E, L) => ({ ...shipsCellsOnly(E), ...(L && L.run && L.run > E.scheduled_for ? { last_attempt: { ...L, consecutive: 1 } } : {}) });
const shipsCondPut = async (env, key, body, etag, meta) => !!(await env.R2.put(key, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, ...(meta ? { customMetadata: meta } : {}), onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } }));
async function shipsReadCells(env) {
  const o = await env.R2.get(SHIPS_PUB.cells); if (!o) return { etag: null, cur: null };
  let cur = null; try { cur = JSON.parse(await o.text()); } catch (_) { cur = null; }
  return { etag: o.etag, cur: cur && typeof cur === 'object' ? cur : null };
}
/** What the records file is, without reading its body when it carries our metadata (a file written before 0.6.19 is read once). */
async function shipsRecHead(env) {
  const h = await env.R2.head(SHIPS_PUB.rec); if (!h) return { etag: null, absent: true };
  const m = h.customMetadata || {};
  if (m.run && m.retrieved_at) return { etag: h.etag, run: m.run, retrieved_at: m.retrieved_at, eligible: m.eligible === '1' };
  let j = null; try { j = await getJson(env, SHIPS_PUB.rec); } catch (_) { j = null; }
  return { etag: h.etag, run: (j && (j.scheduled_for || j.retrieved_at)) || '', retrieved_at: (j && j.retrieved_at) || '', eligible: shipsEligible(j) };
}
const shipsStamp = async (env, scheduledMs, e, full) => {   // the dated per-run objects: the archive and the hourly aggregation read these; no public route serves them
  const stamp = isoMinute(scheduledMs); let bytes = 0;
  if (full) bytes = await putJson(env, `snapshots/ships/${stamp}.json`, e, { retrieved_at: String(e.retrieved_at) });
  await putJson(env, `cells/ships/${stamp}.json`, { ...e, records: undefined, record_fields: undefined, record_format: undefined });
  return bytes;
};
/** REPAIR (contract 7a): an interrupted writer left the records file naming a later eligible sample than the counts file.
 *  Complete that sample's counts, conditionally, keeping a last_attempt that is later than it. Every ships write that does not
 *  itself replace both files runs this first: a failure, an overlong sample, and an eligible upload that is only archived.
 *  Returns 'none' (nothing to repair), 'repaired', 'publish_conflict' (the counts changed twice under it) or 'error'. */
async function shipsRepair(env) {
  try {
    for (let t = 0; t < 2; t++) {
      const c = await shipsReadCells(env), cur = c.cur, rec = await shipsRecHead(env);
      if (rec.absent || !rec.eligible || !rec.retrieved_at || (cur && rec.retrieved_at === cur.retrieved_at) || !(rec.run > ((cur && cur.scheduled_for) || ''))) return 'none';
      const E = await getJson(env, SHIPS_PUB.rec);
      if (!shipsEligible(E) || E.retrieved_at !== rec.retrieved_at) continue;   // the records file was replaced while we looked: look again
      if (await shipsCondPut(env, SHIPS_PUB.cells, shipsCellsFor(E, cur && cur.last_attempt), c.etag)) return 'repaired';
    }
    console.log('shipsRepair: counts changed twice while repairing; left alone');
    return 'publish_conflict';
  } catch (err) { console.log('shipsRepair failed', String(err).slice(0, 160)); return 'error'; }
}
const shipsRepairNote = r => (r && r !== 'none' ? '; counts repair: ' + r : '');
/** An eligible sample: records first, then counts, both conditional. Returns { published, bytes, [latest_run], [repair], [conflict] }. */
async function shipsPublishEligible(env, scheduledMs, e) {
  if (!shipsEligible(e)) return { published: 'refused: not an eligible sample', bytes: 0, conflict: true };   // callers route failures and overlong samples elsewhere; this is the second lock
  const bytes = await shipsStamp(env, scheduledMs, e, true), run = e.scheduled_for;
  const meta = { run, retrieved_at: String(e.retrieved_at), eligible: '1' };
  try {
    for (let round = 0; round < 2; round++) {
      const rec = await shipsRecHead(env);
      const mine = !rec.absent && rec.retrieved_at === e.retrieved_at && rec.run === run;
      if (!rec.absent && !mine && rec.run && rec.run >= run) { const repair = await shipsRepair(env); return { published: 'archive only (older than latest)', bytes, latest_run: rec.run, repair }; }   // archived only: still a ships write, so it completes an interrupted sample's counts (GPT hold 1, 18 Nov)
      if (!mine && !(await shipsCondPut(env, SHIPS_PUB.rec, e, rec.absent ? null : rec.etag, meta))) continue;   // lost the records write: read again
      for (let t = 0; t < 2; t++) {
        const c = await shipsReadCells(env), S = shipsEligible(c.cur) ? c.cur : null;
        if (S && S.scheduled_for > run) return { published: 'archive only (older than latest)', bytes, latest_run: S.scheduled_for };   // a newer sample was published meanwhile (it also replaced our records)
        if (S && S.scheduled_for === run && S.retrieved_at === e.retrieved_at) return { published: 'latest', bytes };
        if (await shipsCondPut(env, SHIPS_PUB.cells, shipsCellsFor(e, c.cur && c.cur.last_attempt), c.etag)) return { published: 'latest', bytes };
      }
      return { published: 'publish_conflict (records written, counts contended; records are withheld by readers until the next ships write)', bytes, conflict: true };
    }
    return { published: 'publish_conflict (records contended; nothing changed)', bytes, conflict: true };
  } catch (err) { console.log('shipsPublishEligible failed', String(err).slice(0, 160)); return { published: 'publish_error', bytes, conflict: true }; }
}
/** An ineligible attempt (a failure, or an overlong sample): one conditional write of the counts file, after completing an
 *  interrupted sample's counts if the records file is ahead of them. a = { status, reason, note, elapsed_s?, window_s?, collected_by }. */
async function shipsRecordAttempt(env, scheduledMs, a, info) {
  const run = new Date(scheduledMs).toISOString(), at = nowIso();   // "at" is captured once, on entry: when the hub recorded the attempt (not the run time, not the failure time)
  try {
    const repair = await shipsRepair(env);   // an interrupted writer left records newer than counts: finish its sample first, then apply this attempt to the result
    if (info) info.repair = repair;
    for (let round = 0; round < 2; round++) {
      const c = await shipsReadCells(env), cur = c.cur;
      const S = shipsEligible(cur) ? cur : null, L = cur && cur.last_attempt;
      const stored = [cur && cur.scheduled_for, L && L.run].filter(Boolean).sort().pop();
      if (stored && stored >= run) return 'left: not later than what is published';
      const la = { run, at, status: a.status, reason: a.reason, ...(Number.isFinite(a.elapsed_s) ? { elapsed_s: a.elapsed_s } : {}), ...(Number.isFinite(a.window_s) ? { window_s: a.window_s } : {}),
        collected_by: a.collected_by || null, consecutive: ((L && L.consecutive) || 0) + 1 };
      const keep = !!(S && !shipsExpired(S, Date.now()));
      const body = keep ? { ...S, last_attempt: la }
        : { ...envelope('ships', scheduledMs, null, null, 'down', {}, [], [], { note: a.note, reason: a.reason }), records: undefined, last_attempt: la };
      if (await shipsCondPut(env, SHIPS_PUB.cells, body, c.etag)) return keep ? 'kept last sample' : 'down envelope';
    }
    console.log('shipsRecordAttempt: counts changed twice while writing; left alone');
    return 'left: publish_conflict';
  } catch (err) { console.log('shipsRecordAttempt failed', String(err).slice(0, 160)); return 'left: write failed'; }
}
/** A failed ships attempt from either writer: logged and archived with the raw note, published as a fixed phrase. */
async function shipsFailed(env, scheduledMs, rawNote, phrase, collectedBy, http) {
  try { await shipsStamp(env, scheduledMs, { ...envelope('ships', scheduledMs, null, null, 'down', {}, [], [], { note: rawNote }) }, false); } catch (err) { console.log('shipsFailed per-run record failed', String(err).slice(0, 120)); }
  const info = {}, outcome = await shipsRecordAttempt(env, scheduledMs, { status: 'down', reason: phrase, note: phrase, collected_by: collectedBy }, info);
  await logRun(env, 'ships', scheduledMs, 'down', http || 0, 0, 0, shipsLogNote(rawNote, outcome, info));   // logged AFTER the publication step, so a conflict is on the row (GPT hold 2, 18 Nov); status and raw note unchanged
  return outcome;
}
/** The collector_runs note: the attempt's own note first, then what publication did when it did not apply the attempt, and any repair. */
const shipsLogNote = (note, outcome, info) => String(note || '').slice(0, 380) + (/^left: /.test(outcome) ? ' [publication ' + outcome + ']' : '') + (info && info.repair && info.repair !== 'none' ? ' [counts repair: ' + info.repair + ']' : '');
/** An overlong sample from either writer: archived whole and logged with its own status; never published as current. */
async function shipsOverlong(env, scheduledMs, e, logNote) {
  const bytes = await shipsStamp(env, scheduledMs, e, true);
  const info = {}, outcome = await shipsRecordAttempt(env, scheduledMs, { status: e.source_status, reason: 'sample_overlong', note: SHIPS_PHRASE.overlong, elapsed_s: e.elapsed_wall_s, window_s: e.window_s, collected_by: e.collected_by || e.ingested_from || null }, info);
  await logRun(env, 'ships', scheduledMs, e.source_status, 200, e.records.length, bytes, shipsLogNote(logNote, outcome, info));
  return { outcome, bytes };
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
  catch (e) { await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status: 'down', reason: String(e).slice(0, 160) }); await shipsFailed(env, scheduledMs, 'cloud fallback: ' + String(e).slice(0, 160), SHIPS_PHRASE.fallback, 'cloud hub (fallback)', 0); return 'ships-fallback:down'; }
  const flowingS = Math.max(0, L.socketS - L.gapS), upFrac = Math.max(0, Math.min(1, flowingS / SF.windowS));
  if (!L.confirmed || !L.messages) { await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status: 'down', reason: L.sourceError || 'no messages', close: L.closeInfo }); await shipsFailed(env, scheduledMs, 'cloud fallback: ' + (L.sourceError || 'no subscription confirmation or no messages'), SHIPS_PHRASE.fallback, 'cloud hub (fallback)', L.upgradeStatus); return 'ships-fallback:down'; }
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
  // 0.6.19: the one ships publication rule (above). An overlong fallback sample is archived and recorded as an attempt; an
  // eligible one is published unless a newer sample (the Mac's) is already there.
  let bytes, published = true, how = '';
  if (overlong) { const o = await shipsOverlong(env, scheduledMs, e, `cloud fallback (not published: overlong sample) messages=${L.messages} vessels=${L.rows.length} flowing=${flowingS.toFixed(1)}s`); bytes = o.bytes; published = false; how = ', not published: overlong'; }
  else {
    const r = await shipsPublishEligible(env, scheduledMs, e); bytes = r.bytes; published = r.published === 'latest';
    how = published ? '' : r.conflict ? ', ' + r.published.split(' (')[0] : ', archive only';
    await logRun(env, layer, scheduledMs, status, 200, L.rows.length, bytes, `cloud fallback${published ? '' : r.conflict ? ' (' + r.published.split(' (')[0] + ')' : ' (archive only: newer home sample' + shipsRepairNote(r.repair) + ')'} messages=${L.messages} vessels=${L.rows.length} flowing=${flowingS.toFixed(1)}s`);
  }
  await putJson(env, SF.stateKey, { started_at: new Date(now).toISOString(), status, published, vessels: L.rows.length, messages: L.messages });
  return `ships-fallback:${status} (${L.rows.length} vessels${how})`;
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
export { SHIPS_PUB, SHIPS_PHRASE, SHIPS_COLLECTOR_PHRASES, shipsEligible, shipsCellsFor, shipsPublishEligible, shipsRecordAttempt, shipsRepair };
export { AIRCRAFT_LAYER, AIRCRAFT_FIELDS, AIRCRAFT_MAX_AGE_S, AIRCRAFT_TEXT, aircraftFieldsOk, aircraftRowOk, aircraftProject, aircraftDownNote, aircraftRoute, validateEnvelope, writeSnapshot };
export { WIND, GRIBWIND, windNoteRelevant, windSeenMerge, runWind, windCandidates, windObject, windRanges, windPtr, windUpdate, windFail, windFetchRange, collectWind, windRoute };
export { SUNFACE, sunStamp, sunFetch, sunPtr, sunUpdate, sunFail, collectSunface, sunProbe, sunRoute };
export { SKYCRAFT, CRAFT_REVISIONS, hzUrl, hzParse, hzSegmentOf, hzFitThrough, craftStudyEpochs, collectSkycraft, craftProbe, craftSnapRoute, craftCatRoute };
export { EARTHVIEW, evLatest, evKeyOf, evJpegScans, evDecode, evPng, evCompare, evFetch, collectEarthView, evRoute, evGuard, evAdmin, evCleanup, EvStop, EV_STOP, EV_JPEG, DUSTRGB, dustLatest, dustKeyOf, jpegCheck, pngInfo, pngAlpha, dustServed, dustFetch, dustFail, dustPtr, dustUpdate, dustInflate, dustBody, collectDustRgb, dustRoute, JOBS, OCEANHEAT_REVISIONS, OCEANHEAT_CURRENT, OCEANHEAT_CACHE_OK, oceanHeatPin, oceanHeatRoute, oceanHeatFile, SKY_REVISIONS, SKY_CURRENT, skyPin, skyRoute, skyCatalogue, ARTS, artsSnapshot, TIMELINE, TIMELINE_REVISIONS, TIMELINE_LEGACY, TIMELINE_CURRENT, timelinePin, timelineRoute, timelineCatalogue, kpStatus, KP, shipsReason, collectSwpc, collectUsgs, fvProbeR2, fvFetchToRaw, cellId, fvWork, fvRegister, fvProcess, fvDownForInput, fvDownNoInput, fvCheckpointNew, fvPlaceSection, FV, FVSQL, fvOrder, fvCas, fvWriter, fvLines, fvHasher, collectFirmsV2, fvPublish, fvPlaceFirms, fvPlace, fvBoundedGunzip, fvCheckpointCandidate, firmsParse, firmsRowProblem, checkpointCoverage, backfillCoverage, FIRMS_MAX_PARSE_BYTES, orbBuild, orbClassify, ORB_CLASSES, hourlyBatch, SHIPS_LOOKBACK_H, driftBuild, csvFields, collectDrifters, PLASTIC, plDay, unzipText, odvSamples, plasticValidate, plasticVerify, collectPlastic, versionParts, stripVolatile, firesDaily, cellAreaKm2, validCell, histCheckpointsDue, histCheckpointOne, listSnapshots, historyState, archiveHealth, HIST_GRACE_MS, HEALTH, health, healthDeadline, EVH, evhKind, evhConfig, evhEvaluate, healthNote, redactText, redactStatus, tAt, histVersion, histQuakes, histDrifters, histSeaIce, histOrbital, HIST, PLACE, placeCache, EVB, evbSeen, evProbeValidate, evProbeOnce, evProbeRoute, evMark, evAdmit, evManualGate, evValidationBegin, evValidated, runEarthViewLogged, evAuth, EV_ADMIN_ACTIONS, EV_WINDOW_MAX_MS };

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
  checks: { runs: ['usgs', 'firms', 'earthview'], publication: ['usgs', 'firms'], archive: HIST.checkpointLayers, coverage: HIST.checkpointLayers, trial: ['earthview'] },   // 0.6.23: runs/earthview, trial/earthview
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
/* ---- 0.6.23: Earth from Space trial health (EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL rev 3.1) ----
 * GET|HEAD /health/runs/earthview   503 while a scheduled time of the current trial is overdue (no end-of-run row), or the gate is
 *                                   off during the trial, or the configuration or the rows cannot be read.
 * GET|HEAD /health/trial/earthview  503 once the trial's rows show stop condition 3 (a storage stop), 6 (three adjacent settled
 *                                   slots each holding a validation refusal) or 8 (six adjacent settled slots, none with a current
 *                                   frame, at least one showing the source listing a newer one), or a row this code cannot read.
 * A TRIAL is the pair EARTHVIEW_FROM / EARTHVIEW_UNTIL; its SLOTS are the ten-minute marks FROM <= s < UNTIL, the same scheduled
 * times evAdmit selects. The health request's own clock decides only which slots are DUE (now >= s + 20 min); it changes nothing
 * about admission and is not a deadline for admitted work. Everything is derived on each request from collector_runs: nothing is
 * written, nothing is fetched, no collection runs. So a TRIAL finding stays until the window variables are removed (closeout), and a
 * later good run does not clear it; an overdue slot on the runs check clears when its end-of-run row arrives. A row whose finish
 * time is more than HEALTH_SKEW_MS (5 min) after the request's clock, or whose start or finish time cannot be parsed, fails both. What this cannot know is said in the proposal (sections 3.1, 3.5, 3.6, 7): it keeps no history
 * of the gate; a manual run exactly on a mark looks like that slot's run; rows finished after UNTIL + 24 h are not read.
 * Public answers carry fixed reason codes, times and counts only: never a run note. */
const EVH = { SLOT_MS: 600e3, ALLOW_MS: 1200e3, HORIZON_MS: 24 * 3600e3, ROW_LIMIT: 2000, LIST_MAX: 20, C6_RUN: 3, C8_RUN: 6 };
const EVH_POST_CHECK = ['served time not confirmed', 'served a different frame', 'picture write failed', 'picture key already in use', 'picture read-back differs', 'stored copy is being removed'];
const EVH_FETCH_FAIL = /^(picture|check image) (request failed|http error|not a picture|size out of range)$/;
/** What one collector_runs row of the earthview layer establishes, from its status and the FIXED phrase its note starts with. */
function evhKind(row) {
  const note = typeof row.note === 'string' ? row.note : '', reason = note.split(' — ')[0];
  if (row.status === 'ok') {
    if (Number(row.records) === 1 && note.startsWith('frame ')) return 'published';
    if (Number(row.records) === 0 && note.startsWith('nothing newer: ')) return 'nothing_newer';
    if (Number(row.records) === 0 && note.startsWith('superseded: ')) return 'superseded';
    return 'unrecognised';
  }
  if (row.status !== 'down') return 'unrecognised';
  if (reason === EV_STOP.REPAIR || reason === EV_STOP.CHANGED || reason === EV_STOP.BUSY) return 'storage_stop';
  if (reason === EV_STOP.HELD || reason === EV_STOP.UNSET) return 'guard_refused';
  if (reason === 'source check failed') return 'source_check_failed';
  if (reason === 'picture failed validation' || reason === 'check image failed validation') return 'validation_refused';
  if (EVH_POST_CHECK.includes(reason) || EVH_FETCH_FAIL.test(reason)) return 'post_check_failure';
  if (reason === 'internal error') return 'internal_error';
  return 'unrecognised';
}
/** The trial's configuration, in order of precedence (proposal 3.5 rows 1 to 4). Reads env only. */
function evhConfig(env) {
  const g = env.EARTHVIEW_ENABLED, gate = g === undefined ? 'unset' : g === 'manual' ? 'manual' : g === '1' ? '1' : 'unknown';
  if (gate === 'unknown') return { gate, fail: 'gate_unknown_value' };
  const hasF = env.EARTHVIEW_FROM !== undefined, hasU = env.EARTHVIEW_UNTIL !== undefined;
  if (!hasF && !hasU) return gate === '1' ? { gate, fail: 'gate_on_without_window' } : { gate, none: true };
  const from = evMark(env.EARTHVIEW_FROM), until = evMark(env.EARTHVIEW_UNTIL);
  if (from === null || until === null || until <= from || until - from > EV_WINDOW_MAX_MS) return { gate, fail: 'window_not_readable' };
  return { gate, from, until };
}
/** Both verdicts for the current trial at nowMs. Pure apart from ONE bounded, indexed read of collector_runs. Throws nothing. */
async function evhEvaluate(env, nowMs) {
  const iso = ms => new Date(ms).toISOString(), c = evhConfig(env);
  const both = (code, state, facts) => ({ runs: { healthy: false, reasons: [code], facts: { state, ...facts } }, trial: { healthy: false, reasons: [code], facts: { state, ...facts } } });
  if (c.fail) return both(c.fail, { gate_unknown_value: 'gate has an unknown value', gate_on_without_window: 'gate is 1 with no window', window_not_readable: 'window not readable' }[c.fail], { gate: c.gate });
  if (c.none) { const f = { state: 'no trial configured', gate: c.gate }; return { runs: { healthy: true, reasons: [], facts: f }, trial: { healthy: true, reasons: [], facts: f } }; }
  const { from, until, gate } = c, on = gate === '1', nSlots = (until - from) / EVH.SLOT_MS, last = until - EVH.SLOT_MS + EVH.ALLOW_MS;
  const base = { gate, from: iso(from), until: iso(until), slots: nSlots, allow_s: EVH.ALLOW_MS / 1000 };
  if (nowMs < from) {
    const f = { state: on ? 'armed' : 'window set but gate is not 1', ...base };
    return { runs: { healthy: on, reasons: on ? [] : ['not_collecting'], facts: f }, trial: { healthy: true, reasons: [], facts: f } };
  }
  // The rows of this trial: finished inside [FROM, UNTIL + 24 h), oldest first, through the (layer, finished_at) index, bounded.
  let rows;
  try {
    const r = await env.DB.prepare('SELECT started_at, finished_at, status, records, note FROM collector_runs WHERE layer = ? AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?')
      .bind('earthview', iso(from), iso(until + EVH.HORIZON_MS), EVH.ROW_LIMIT).all();
    rows = r && r.results;
    if (!Array.isArray(rows)) throw new Error('no result list');
  } catch (_) { return both('rows_unreadable', 'rows unreadable', base); }
  if (rows.length >= EVH.ROW_LIMIT) return both('too_many_rows', 'too many rows to evaluate', { ...base, rows_read: rows.length });
  // Per slot: flags that are true if ANY of its rows says so. A good row never removes a bad flag; evidence that the held frame
  // was current counts only from a row finished at or before the slot's due time.
  const slot = Array.from({ length: nSlots }, () => ({ rows: 0, refused: false, storage_stop: false, newer_listed: false, current: false, unrecognised: false }));
  let outside = 0;
  for (const row of rows) {
    const s = Date.parse(row.started_at), f = Date.parse(row.finished_at);
    if (!Number.isFinite(f) || f > nowMs + HEALTH_SKEW_MS) return both('rows_unreadable', 'rows unreadable', base);
    if (!Number.isFinite(s)) return both('rows_unreadable', 'rows unreadable', base);   // cannot be assigned to a slot or excluded from one
    if (s < from || s >= until || (s - from) % EVH.SLOT_MS !== 0) { outside++; continue; }
    const x = slot[(s - from) / EVH.SLOT_MS], k = evhKind(row); x.rows++;
    if (k === 'unrecognised') x.unrecognised = true;
    if (k === 'storage_stop') x.storage_stop = true;
    if (k === 'validation_refused') x.refused = true;
    if (k === 'validation_refused' || k === 'post_check_failure') x.newer_listed = true;
    if ((k === 'published' || k === 'superseded' || k === 'nothing_newer') && f <= s + EVH.ALLOW_MS) x.current = true;
  }
  const at = i => iso(from + i * EVH.SLOT_MS);
  let settled = 0; while (settled < nSlots && nowMs >= from + settled * EVH.SLOT_MS + EVH.ALLOW_MS) settled++;   // due at equality
  const overdue = [], complete = slot.filter(x => x.rows > 0).length;
  for (let i = 0; i < settled; i++) if (!slot[i].rows) overdue.push(at(i));
  // trial findings. c3 and unrecognised: any slot of the trial, settled or not. c6 and c8: settled slots only, in scheduled order.
  const findings = [];
  slot.forEach((x, i) => { if (x.storage_stop) findings.push({ code: 'storage_stop', slot: at(i) }); if (x.unrecognised) findings.push({ code: 'unrecognised_outcome', slot: at(i) }); });
  for (let i = 0; i + EVH.C6_RUN <= settled; i++) if (slot.slice(i, i + EVH.C6_RUN).every(x => x.refused)) { findings.push({ code: 'three_slots_refused', slot: at(i) }); break; }
  for (let i = 0; i + EVH.C8_RUN <= settled; i++) { const w = slot.slice(i, i + EVH.C8_RUN); if (w.every(x => !x.current) && w.some(x => x.newer_listed)) { findings.push({ code: 'six_slots_without_a_current_frame', slot: at(i) }); break; } }
  const runsReasons = [];
  if (!on && nowMs < last) runsReasons.push('not_collecting');
  if (overdue.length) runsReasons.push('completion_missing');
  const trialReasons = [...new Set(findings.map(x => x.code))];
  const ended = nowMs >= last, clean = !overdue.length && !findings.length;
  const state = ended ? (clean ? 'trial complete, nothing outstanding' : 'trial ended with outstanding findings')
    : !on ? 'trial window set but not collecting' : nowMs < from + EVH.ALLOW_MS ? 'starting' : 'active';
  const facts = { state, ...base, settled, complete, overdue: overdue.length, overdue_slots: overdue.slice(0, EVH.LIST_MAX), findings: findings.slice(0, EVH.LIST_MAX), rows_read: rows.length, rows_outside_slots: outside };
  return { runs: { healthy: !runsReasons.length, reasons: runsReasons, facts }, trial: { healthy: !trialReasons.length, reasons: trialReasons, facts } };
}
/** Never lets an exception's text reach a public answer: anything unexpected is the fixed code rows_unreadable, failing. */
const evhSafe = async (env, nowMs, which) => { try { return (await evhEvaluate(env, nowMs))[which]; } catch (_) { return { healthy: false, reasons: ['rows_unreadable'], facts: { state: 'rows unreadable' } }; } };
const healthEvRuns = (env, _layer, nowMs) => evhSafe(env, nowMs, 'runs');
const healthEvTrial = (env, _layer, nowMs) => evhSafe(env, nowMs, 'trial');
async function health(req, env, check, layer) {
  const fn = layer === 'earthview' ? { runs: healthEvRuns, trial: healthEvTrial }[check]   // 0.6.23
    : { runs: healthRuns, publication: healthPublication, archive: healthArchive, coverage: healthCoverage }[check];
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
// 0.6.15: a counts envelope the collector published as down is answered as down — never as a pairing mismatch. Both down writers
// (writeDown, fvDownForInput) publish `cells: {}`, so the old test (`&& !cells.cells`) never fired. The answer carries the envelope's
// own metadata and note, no cell count and no records. It is applied to the FIRST counts read and again to the FINAL counts
// envelope after a pairing re-read, in the ordinary path and in the FIRMS lines/1 path (a collector can write down between reads).
const placeDown = (layer, cells) => ({ ...placeMeta(layer, cells), state: 'down' });
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
  if (cells.source_status === 'down') return placeDown(layer, cells);
  if (layer === 'firms') {
    const h = await env.R2.head('latest/firms.json');
    if (h && h.customMetadata && h.customMetadata.format === 'lines/1') return fvPlaceSection(env, id, cells);
    if (h && h.size > FV.legacyMaxJson) return { ...placeMeta(layer, cells), state: 'withheld', why: `the published records file (${h.size} bytes) is over the bounded-read limit`, cell: (cells.cells && cells.cells[id]) || null };
    if (cells.run_id) return { ...placeMeta(layer, cells), state: 'withheld', why: 'counts carry a run id and the records do not: not from the same collector run', cell: (cells.cells && cells.cells[id]) || null };
  }
  let rec = await placeRecords(env, layer);
  if (rec && rec.retrieved_at !== cells.retrieved_at) {   // a collector wrote between the two reads: re-read both once
    const again = await getJson(env, `latest-cells/${layer}.json`); if (again) cells = again;
    if (cells.source_status === 'down') return placeDown(layer, cells);   // the FINAL counts are down: say so, before any pairing answer
    rec = await placeRecords(env, layer);
  }
  const base = placeMeta(layer, cells);   // from the FINAL cells file — never from a superseded first read
  const cell = cells.cells ? cells.cells[id] : undefined;
  if (!rec || rec.retrieved_at !== cells.retrieved_at) {
    return { ...base, state: 'withheld', why: `records and counts are not from the same collector run (records ${rec ? rec.retrieved_at : 'unreadable'}, counts ${cells.retrieved_at})`, cell: cell || null, records_run_ref: rec ? runRef(layer, rec.retrieved_at) : null };
  }
  // 0.6.8 buoys: counts kept from the last good run after a failed update (last_attempt). Judged on the FINAL counts envelope,
  // after the pairing re-read above. Past the layer's own limit the fallback is withheld here, so no page can keep listing it.
  const la = (layer === 'drifters' || layer === 'ships') && cells.last_attempt ? cells.last_attempt : null;   // 0.6.19: ships keeps its last eligible sample the same way
  if (la && (Date.now() - Date.parse(cells.retrieved_at)) / 1000 > (cells.stale_after_s || STALE_AFTER_S[layer])) {
    return { ...base, state: 'withheld', why: `the latest ${layer === 'ships' ? 'sample was not usable and the last usable sample' : 'update failed and the last successful update'} is over ${Math.round((cells.stale_after_s || STALE_AFTER_S[layer]) / 3600)} h old`, last_attempt: la, cell: null, records_run_ref: runRef(layer, rec.retrieved_at) };
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
  if (rec && !rec.busy && !same(rec, cells)) { const again = await getJson(env, 'latest-cells/firms.json'); if (again) cells = again;
    if (cells.source_status === 'down') return placeDown('firms', cells);   // the FINAL counts are down: no pairing answer, no second record scan
    rec = await scan(); }
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
  RUN_HOURS_UTC: [6, 18], TIMEOUT_MS: 90000, LIST_TIMEOUT_MS: 30000, POINTER: 'dustrgb/current.json', PREFIX: 'dustrgb/frames/',
  CACHE_FILE: 'public, max-age=86400, immutable',
  SOURCE: { product: 'Dust RGB - MTG - 0 degree', collection: 'EO:EUM:DAT:0869', catalogue: 'https://user.eumetsat.int/catalogue/EO:EUM:DAT:0869', licence: 'CC BY 4.0',
    licence_url: 'https://creativecommons.org/licenses/by/4.0/', credit: 'Contains modified EUMETSAT Meteosat data', service: 'EUMETView WMS, layer mtg_fd:rgb_dust' },
};
/** Latest advertised time of the dust layer from a GetCapabilities document, as YYYY-MM-DDTHH:MM:00Z on the 10-minute grid; else null.
 * Only the dust layer's own element is read: from its <Name> to the next layer boundary. A time on a sibling layer is never used. */
function dustLatest(xml) {
  const s = String(xml), n = /<Name>\s*(?:mtg_fd:)?rgb_dust\s*<\/Name>/.exec(s);
  if (!n) return null;
  const rest = s.slice(n.index + n[0].length), end = rest.search(/<\/Layer>|<Layer\b/), own = end < 0 ? rest : rest.slice(0, end);
  let def = null;
  for (const d of own.matchAll(/<Dimension\b([^>]*)>/g)) { if (!/\bname="time"/.test(d[1])) continue; const m = /\bdefault="([^"]+)"/.exec(d[1]); def = m ? m[1] : null; break; }
  if (!def) return null;
  const t = def.replace(/\.000Z$/, 'Z');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(t) || Number.isNaN(Date.parse(t))) return null;
  return t;
}
const dustKeyOf = t => t.replace(/[-:]/g, '').replace(/00Z$/, 'Z');   // 2026-11-12T16:50:00Z -> 20261112T1650Z
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
/** Walks a JPEG's segments up to the first scan. Returns { w, h, dqt, dht, sos, eoi } or null. A structure check only: the compressed
 * picture data is NOT decoded (a Worker has no image decoder, and JPEG carries no checksum), so damage inside the scan is not detected here. */
function jpegCheck(u8) {
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null;
  const out = { w: 0, h: 0, dqt: 0, dht: 0, sos: false, eoi: u8[u8.length - 2] === 0xff && u8[u8.length - 1] === 0xd9 };
  let i = 2;
  while (i + 4 <= u8.length) {
    if (u8[i] !== 0xff) return null;
    const k = u8[i + 1];
    if (k === 0xff) { i++; continue; }
    if (k >= 0xd0 && k <= 0xd9) { i += 2; continue; }
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2 || i + 2 + len > u8.length) return null;
    if (k === 0xdb) out.dqt++;
    else if (k === 0xc4) out.dht++;
    else if (k >= 0xc0 && k <= 0xcf && k !== 0xc8 && k !== 0xcc) { if (len < 8) return null; out.h = (u8[i + 5] << 8) | u8[i + 6]; out.w = (u8[i + 7] << 8) | u8[i + 8]; }
    else if (k === 0xda) { out.sos = true; return out; }
    i += 2 + len;
  }
  return out;
}
/** Inflates zlib data to EXACTLY `expect` bytes. Reads the output in pieces and stops (cancelling the stream) the moment more than
 * `expect` bytes have appeared, so a small file that expands enormously costs at most one extra piece. { data|null, read }. */
async function dustInflate(parts, expect) {
  const out = new Uint8Array(expect); let read = 0, reader = null;
  try { reader = new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break;
      if (read + value.length > expect) { read += value.length; try { await reader.cancel(); } catch (_) {} return { data: null, read }; }
      out.set(value, read); read += value.length; }
  } catch (_) { return { data: null, read }; }
  return { data: read === expect ? out : null, read };
}
/** Reads a response body but never more than `max` bytes: a declared length over the limit is refused before reading, and an
 * undeclared one is cut off (the stream cancelled) as soon as it passes the limit. { buf } or { over:true, read } or { error }. */
async function dustBody(r, max) {
  const declared = Number(r.headers.get('content-length')); if (declared > max) { try { await r.body.cancel(); } catch (_) {} return { over: true, read: 0 }; }
  const chunks = []; let read = 0;
  try { const reader = r.body.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; read += value.length;
      if (read > max) { try { await reader.cancel(); } catch (_) {} return { over: true, read }; }
      chunks.push(value); }
  } catch (e) { return { error: String(e).slice(0, 160), read }; }
  const u8 = new Uint8Array(read); let o = 0; for (const c of chunks) { u8.set(c, o); o += c.length; }
  return { buf: u8.buffer };
}
const DUST_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
/** Fully decodes a PNG's alpha: every chunk checksum verified, the image data inflated (zlib's own checksum included), every row
 * unfiltered. Returns { w, h, colour, opaque, transparent, partial, centre, corners:[4 alphas] } or null if anything is wrong or the
 * form is one this reader does not handle (interlaced; anything but 8/16-bit RGBA or grey+alpha, or an 8-bit palette with tRNS). */
async function pngAlpha(u8, maxPixels = 1 << 20) {
  const info = pngInfo(u8); if (!info || !info.complete || !info.alpha) return null;
  if (info.w * info.h > maxPixels) return null;   // never decode an image larger than the caller expects
  const u32 = i => ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]) >>> 0;
  const { w, h, colour } = info, depth = u8[24];
  if (u8[26] !== 0 || u8[27] !== 0 || u8[28] !== 0 || !w || !h) return null;
  const ch = { 6: 4, 4: 2, 3: 1 }[colour]; if (!ch || (colour === 3 ? depth !== 8 : depth !== 8 && depth !== 16)) return null;
  const parts = []; let trns = null;
  for (let i = 8; i + 12 <= u8.length;) { const len = u32(i), end = i + 12 + len; if (end > u8.length) return null;
    let c = 0xffffffff; for (let j = i + 4; j < i + 8 + len; j++) c = DUST_CRC[(c ^ u8[j]) & 0xff] ^ (c >>> 8);
    if (((c ^ 0xffffffff) >>> 0) !== u32(i + 8 + len)) return null;
    const type = String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]);
    if (type === 'IDAT') parts.push(u8.subarray(i + 8, i + 8 + len)); else if (type === 'tRNS') trns = u8.subarray(i + 8, i + 8 + len);
    i = end; }
  if (!parts.length) return null;
  const bpp = ch * depth / 8, stride = w * bpp;
  const raw = (await dustInflate(parts, h * (stride + 1))).data; if (!raw) return null;   // inflation stops as soon as it passes the size the header promises
  for (let y = 0; y < h; y++) { const r = y * (stride + 1), f = raw[r], cur = r + 1, up = cur - (stride + 1);
    if (f > 4) return null;
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? raw[cur + x - bpp] : 0, b = y ? raw[up + x] : 0, c = (y && x >= bpp) ? raw[up + x - bpp] : 0;
      let add = 0; if (f === 1) add = a; else if (f === 2) add = b; else if (f === 3) add = (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      raw[cur + x] = (raw[cur + x] + add) & 0xff; } }
  const alphaAt = (x, y) => { const o = y * (stride + 1) + 1 + x * bpp; return colour === 3 ? (trns && raw[o] < trns.length ? trns[raw[o]] : 255) : raw[o + (ch - 1) * depth / 8]; };
  let opaque = 0, transparent = 0, partial = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = alphaAt(x, y); if (a === 255) opaque++; else if (a === 0) transparent++; else partial++; }
  return { w, h, colour, opaque, transparent, partial, centre: alphaAt(w >> 1, h >> 1), corners: [alphaAt(0, 0), alphaAt(w - 1, 0), alphaAt(0, h - 1), alphaAt(w - 1, h - 1)] };
}
const dustServed = w => { const m = /time=(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.\d+)?Z/.exec(w || ''); return m ? m[1] + 'Z' : null; };
/** One file from EUMETView, validated. Returns { ok, buf, bytes, sha256, served, warn } or { ok:false, reason, http }. Reasons are fixed phrases (public). */
async function dustFetch(what, url, spec) {
  let r;
  try { r = await fetch(url, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(DUSTRGB.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: what + ' request failed', http: 0, detail: String(e).slice(0, 160) }; }
  if (r.status !== 200) return { ok: false, reason: what + ' http error', http: r.status };
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== spec.type) return { ok: false, reason: what + ' not an image', http: 200, detail: type };   // EUMETView answers a bad TIME with HTTP 200 + XML
  const got = await dustBody(r, spec.maxBytes);   // the size limit is enforced WHILE reading, not after
  if (got.error) return { ok: false, reason: what + ' request failed', http: 200, detail: got.error };   // cut off or timed out mid-body
  if (got.over) return { ok: false, reason: what + ' size out of range', http: 200, detail: 'over ' + spec.maxBytes + ' B (stopped at ' + got.read + ')' };
  const buf = got.buf, u8 = new Uint8Array(buf);
  if (!buf.byteLength) return { ok: false, reason: what + ' size out of range', http: 200, detail: '0' };
  let alpha = null;
  if (spec.type === 'image/jpeg') { const d = jpegCheck(u8); if (!d || d.w !== spec.w || d.h !== spec.h || !d.dqt || !d.sos || !d.eoi) return { ok: false, reason: what + ' not a valid image', http: 200, detail: JSON.stringify(d) }; }
  else { const i = pngInfo(u8); if (!i || i.w !== spec.w || i.h !== spec.h || !i.alpha || !i.complete) return { ok: false, reason: what + ' not a valid image', http: 200, detail: JSON.stringify(i) };
    const d = await pngAlpha(u8, spec.w * spec.h);   // the mask is decoded in full before it can be published
    if (!d) return { ok: false, reason: what + ' does not decode', http: 200 };
    if (!d.opaque || d.centre !== 255 || d.corners.some(a => a !== 0)) return { ok: false, reason: what + ' is not a footprint', http: 200, detail: JSON.stringify(d) };   // Earth's disc in this box: opaque centre, clear corners
    alpha = { opaque: d.opaque, transparent: d.transparent, partial: d.partial }; }
  const warn = r.headers.get('warning');
  return { ok: true, buf, bytes: buf.byteLength, sha256: await sha256Bytes(buf), warn_present: warn !== null, served: dustServed(warn), alpha };
}
const dustEmpty = () => ({ schema: 1, layer: 'dustrgb', frame: null, previous: null, last_attempt: null, cadence: { runs_utc: DUSTRGB.RUN_HOURS_UTC }, source: DUSTRGB.SOURCE, collector_version: COLLECTOR_VERSION });
/** The pointer and its etag; when there is no pointer yet, an empty body and etag null. Reads only: nothing is ever written here. */
async function dustPtr(env) {
  const o = await env.R2.get(DUSTRGB.POINTER);
  return o ? { cur: await o.json(), etag: o.etag } : { cur: dustEmpty(), etag: null };
}
/** Read–change–write of the pointer that cannot overwrite another run's update. EVERY pointer write is conditional:
 * on the etag that was read (onlyIf.etagMatches), or, when no pointer existed at the read, on there still being none
 * (onlyIf.etagDoesNotMatch '*' — create-only, the form already used for FIRMS and checked on the production bucket by fvProbeR2).
 * A refused write returns null; the run then reads again and decides again.
 * change(cur) returns the new body, or null to leave the pointer alone. Returns { cur, body, wrote }. */
async function dustUpdate(env, change) {
  for (let i = 0; i < 5; i++) {
    const { cur, etag } = await dustPtr(env), body = change(cur);
    if (body === null) return { cur, body: null, wrote: false };
    const r = await env.R2.put(DUSTRGB.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });
    if (r !== null) return { cur, body, wrote: true };
  }
  throw new Error('dustrgb pointer kept changing; gave up after 5 tries');
}
const dustBrief = f => ({ id: f.id, requested_time: f.requested_time, served_time: f.served_time || null, box: f.box, crs: f.crs, picture: f.picture, mask: f.mask });   // everything a page needs to draw the previous pair by itself
/** A failed run never moves the frame: the pointer keeps its pairs and gains last_attempt. The public reason is a fixed phrase; detail stays in collector_runs. */
async function dustFail(env, ms, reason, http, detail) {
  const failed_at = nowIso();
  try { await dustUpdate(env, cur => ({ ...cur, last_attempt: { run: new Date(ms).toISOString(), failed_at, status: 'down', http: http || 0, reason, consecutive_failures: ((cur.last_attempt && cur.last_attempt.consecutive_failures) || 0) + 1 } })); } catch (_) {}
  await logRun(env, 'dustrgb', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));
  return 'dustrgb:down ' + reason;
}
async function collectDustRgb(env, ms) {
  let cap; try { cap = await fetchText(DUSTRGB.CAP, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(DUSTRGB.LIST_TIMEOUT_MS) }); } catch (e) { return dustFail(env, ms, 'frame list request failed', 0, String(e).slice(0, 160)); }
  if (cap.status !== 200) return dustFail(env, ms, 'frame list http error', cap.status);
  const T = dustLatest(cap.text);
  if (!T) return dustFail(env, ms, 'frame list unreadable', 200, 'no advertised time for ' + DUSTRGB.LAYER);
  const { cur } = await dustPtr(env);
  if (cur.frame && T <= cur.frame.requested_time) {   // nothing newer (the same time, or an older one advertised again): no image request, nothing rewritten
    if (cur.last_attempt) await dustUpdate(env, c => c.last_attempt ? { ...c, last_attempt: null } : null);
    const note = T === cur.frame.requested_time ? 'unchanged: ' + T : `not newer: ${T} advertised, ${cur.frame.requested_time} held and kept`;
    await logRun(env, 'dustrgb', ms, 'ok', 200, 0, 0, note);
    return 'dustrgb:' + note;
  }
  const q = `&time=${T}`;
  const pic = await dustFetch('picture', `${DUSTRGB.MAP}&format=image/jpeg&width=${DUSTRGB.PICTURE.w}&height=${DUSTRGB.PICTURE.h}${q}`, { ...DUSTRGB.PICTURE, type: 'image/jpeg' });
  if (!pic.ok) return dustFail(env, ms, pic.reason, pic.http, pic.detail);
  const mask = await dustFetch('mask', `${DUSTRGB.MAP}&format=image/png&transparent=true&width=${DUSTRGB.MASK.w}&height=${DUSTRGB.MASK.h}${q}`, { ...DUSTRGB.MASK, type: 'image/png' });
  if (!mask.ok) return dustFail(env, ms, mask.reason, mask.http, mask.detail);
  // the served-time header does not normally reach a Worker; if it ever does and disagrees, refuse the frame
  for (const [what, f] of [['picture', pic], ['mask', mask]]) if (f.served && f.served !== T) return dustFail(env, ms, what + ' served time differs', 200, `asked ${T}, server named ${f.served}`);
  const served = pic.served && mask.served ? pic.served : null;
  // The pair's id names its CONTENT (the time plus a fingerprint of both files). A different picture or mask for the same time is a
  // different id, key and URL, so nothing already published can change underneath a reader.
  const id = dustKeyOf(T) + '-' + (await sha256Bytes(new TextEncoder().encode(pic.sha256 + ':' + mask.sha256).buffer)).slice(0, 16);
  const dir = DUSTRGB.PREFIX + id + '/';
  const files = { picture: { name: 'picture.jpg', type: 'image/jpeg', f: pic, ...{ w: DUSTRGB.PICTURE.w, h: DUSTRGB.PICTURE.h } }, mask: { name: 'mask.png', type: 'image/png', f: mask, ...{ w: DUSTRGB.MASK.w, h: DUSTRGB.MASK.h } } };
  const out = {};
  const same = async key => { let b = null; try { const o = await env.R2.get(key); b = o ? await o.arrayBuffer() : null; } catch (_) { return 'unreadable'; } return !b ? 'absent' : (b.byteLength === files[key.endsWith('.jpg') ? 'picture' : 'mask'].f.bytes && await sha256Bytes(b) === files[key.endsWith('.jpg') ? 'picture' : 'mask'].f.sha256) ? 'same' : 'differs'; };
  for (const [k, x] of Object.entries(files)) {   // write once, then read back: the pointer moves only if both stored files are exactly what was validated
    const key = dir + x.name, had = await same(key);
    if (had === 'differs' || had === 'unreadable') return dustFail(env, ms, k + ' stored copy differs', 200, key);   // never overwrite a stored file
    if (had === 'absent') {
      try { await env.R2.put(key, x.f.buf, { httpMetadata: { contentType: x.type }, customMetadata: { sha256: x.f.sha256, requested_time: T } }); } catch (e) { return dustFail(env, ms, k + ' write failed', 200, String(e).slice(0, 160)); }
      if (await same(key) !== 'same') return dustFail(env, ms, k + ' read-back differs', 200, key);
    }
    out[k] = { file: x.name, key, path: `/snapshot/dustrgb/${id}/${x.name}`, type: x.type, bytes: x.f.bytes, sha256: x.f.sha256, w: x.w, h: x.h, warning_header_present: x.f.warn_present, ...(x.f.alpha ? { alpha: x.f.alpha } : {}) };
  }
  const frame = { id, requested_time: T, served_time: served, served_time_source: served ? 'server Warning header' : null,
    time_basis: served ? 'served time named by the server' : 'requested time only: the server can substitute the nearest frame and did not say which frame it served',
    checked: 'mask decoded in full; picture structure only (not decoded)',
    fetched_at: nowIso(), run: new Date(ms).toISOString(), box: DUSTRGB.BOX, crs: 'EPSG:4326', picture: out.picture, mask: out.mask };
  // move the pointer only if no other run has published this time or a later one meanwhile
  const up = await dustUpdate(env, c => (c.frame && c.frame.requested_time >= T) ? null : { ...dustEmpty(), frame, previous: c.frame ? dustBrief(c.frame) : null });
  if (!up.wrote) { await logRun(env, 'dustrgb', ms, 'ok', 200, 0, 0, `superseded: another run published ${up.cur.frame.requested_time} first; ${T} not published`); return 'dustrgb:superseded ' + T; }
  // Nothing is deleted. A run cannot yet prove that a file it would delete is not being published by another run (an older orphan
  // can be reused), so every stored pair stays; about 0.75 MB per publication. Cleanup is a separate, later change.
  await logRun(env, 'dustrgb', ms, 'ok', 200, 1, pic.bytes + mask.bytes, `frame ${T} as ${id}; served-time header ${pic.warn_present ? 'present' : 'absent'} (picture), ${mask.warn_present ? 'present' : 'absent'} (mask)`);
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

/* ---------- Earth from Space (EUMETSAT "GeoColour RGB - MTG - 0 degree", EO:EUM:DAT:0913) — EARTH-FROM-SPACE-PROPOSAL rev 2
 * Every ten minutes the hub reads which frames EUMETView lists and, when a newer one is listed, asks for that exact frame time:
 * one 2048 x 2048 JPEG in the geostationary projection EUMETView's own viewer defines (EPSG:900003, "+proj=geos +h=35785831.0
 * +lon_0=0"), surround painted in the page's background colour by the service, and one 256 x 256 transparent PNG of the same view.
 * A frame is PUBLISHED ONLY IF, for both responses, the server's Warning header names a served time equal to the time asked for.
 * A different time, or no header, publishes nothing: the pointer does not move and no requested time is ever shown as a frame time.
 * The delivered JPEG itself is decoded in full here (EV_JPEG, below) and checked, and compared coarsely with the decoded PNG.
 * Storage: earthview/current.json (frame and previous; every write conditional and fenced by an epoch), earthview/state.json (the
 * last source check and the last collection outcome, kept apart from the frame; for the page only), earthview/held.json (every
 * stored picture and when it stopped being current or previous). A picture is deleted ONLY in a run that has just published a newer
 * verified frame, and only when it is neither current nor previous and left that role at least GRACE_S ago. A failed or idle run
 * deletes nothing. Every stored picture has a key holding 96 random bits drawn by its own run, so no restore of any record can make
 * a later run write an old key, and a late or repeated delete cannot reach a newer picture. The collector never creates or repairs
 * the pointer or the list: /admin/earthview/{status,hold,recover,sweep,release} does, under a hold (see "Storage records, guards
 * and recovery" below).
 * Gate (0.6.22, three states; any other value refuses everything): EARTHVIEW_ENABLED absent = only the Stage B probe may run;
 * "manual" = only the manual POST /admin/run/earthview; "1" = the manual run, and the scheduled path for trigger times inside the
 * admission window EARTHVIEW_FROM <= scheduled time < EARTHVIEW_UNTIL (evAdmit, below the Stage B probe). A refusal makes no
 * request and reads or writes nothing under earthview/.
 * Outside LAYERS, cells, history, health and the generic writeDown. Licence: CC BY 4.0; credit EUMETSAT and NASA (catalogue). */
const EARTHVIEW = {
  CAP: 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetCapabilities&version=1.3.0&namespace=mtg_fd',
  MAP: 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_geocolour&styles=&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000',
  LAYER: 'rgb_geocolour', CRS: 'EPSG:900003', CRS_DEFINITION: '+proj=geos +h=35785831.0 +lon_0=0', BBOX: [-5500000, -5500000, 5500000, 5500000],
  BGCOLOR: '0x0B1016', BG: [11, 16, 22],
  PICTURE: { w: 2048, h: 2048, maxBytes: 3 * 1024 * 1024, type: 'image/jpeg' }, CHECK: { w: 256, h: 256, maxBytes: 1024 * 1024, type: 'image/png' },
  // Validation limits. Each is relative to the SAME run's check image or to the colour that was asked for; none is a fixed disk size.
  // Set from the fixtures named in the review packet (three real frames and the damaged set); provisional until more frames are seen.
  LIMITS: { BG_TOLERANCE: 16, SURROUND_SHARE_MIN: 0.98, DISK_LUMA_SD_MIN: 12, AGREEMENT_MIN: 0.85, DISK_SAMPLES_MIN: 2000, SURROUND_SAMPLES_MIN: 500 },
  DECODE: { maxResolutionInMP: 5, maxMemoryUsageInMB: 96 },
  EVERY_MIN: 10, TIMEOUT_MS: 90000, LIST_TIMEOUT_MS: 30000, GRACE_S: 86400,
  POINTER: 'earthview/current.json', STATE: 'earthview/state.json', HELD: 'earthview/held.json', PREFIX: 'earthview/frames/',
  HOLD: 'earthview/hold.json', EPOCHS: 'earthview/epochs/', LIST_PAGE: 1000, LIST_PAGES_MAX: 20, INVENTORY_TRIES: 4,
  CACHE_FILE: 'public, max-age=86400, immutable',
  WAITING_LIMIT_S: 2700,   // provisional: after this long with nothing newer listed, the page says so plainly. Not a delay bound.
  SOURCE: { product: 'GeoColour RGB - MTG - 0 degree', collection: 'EO:EUM:DAT:0913', catalogue: 'https://user.eumetsat.int/catalogue/EO:EUM:DAT:0913', licence: 'CC BY 4.0',
    licence_url: 'https://creativecommons.org/licenses/by/4.0/', credit: 'Contains modified EUMETSAT Meteosat data', night_background: 'NASA Black Marble (a static layer; not current city lights)',
    service: 'EUMETView WMS, layer mtg_fd:rgb_geocolour', satellite: 'Meteosat Third Generation', instrument: 'Flexible Combined Imager (FCI)' },
};
/** Newest advertised time of the GeoColour layer from a GetCapabilities document, on the 10-minute grid; else null. Only that layer's own element is read. */
function evLatest(xml) {
  const s = String(xml), n = /<Name>\s*(?:mtg_fd:)?rgb_geocolour\s*<\/Name>/.exec(s);
  if (!n) return null;
  const rest = s.slice(n.index + n[0].length), end = rest.search(/<\/Layer>|<Layer\b/), own = end < 0 ? rest : rest.slice(0, end);
  let def = null;
  for (const d of own.matchAll(/<Dimension\b([^>]*)>/g)) { if (!/\bname="time"/.test(d[1])) continue; const m = /\bdefault="([^"]+)"/.exec(d[1]); def = m ? m[1] : null; break; }
  if (!def) return null;
  const t = def.replace(/\.000Z$/, 'Z');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(t) || Number.isNaN(Date.parse(t))) return null;
  return t;
}
const evKeyOf = t => t.replace(/[-:]/g, '').replace(/00Z$/, 'Z');
/** Walks EVERY segment of a JPEG, scans included, to its end. Reports the frame type and size, each scan's coefficient range and
 * precision, whether the file ends exactly at its end marker, and whether the scans between them deliver every coefficient of every
 * component at full precision (a progressive file cut short after an early scan still has valid syntax; this is what catches it).
 * Returns { ok:false, reason } or { ok:true, progressive, w, h, components, scans, complete, missing }. Not a decode. */
function evJpegScans(u8) {
  const bad = reason => ({ ok: false, reason });
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return bad('no start marker');
  let i = 2, frame = null, scans = 0, ended = false; const cov = new Map();
  while (i + 1 < u8.length) {
    if (u8[i] !== 0xff) return bad('segment out of step at ' + i);
    const k = u8[i + 1];
    if (k === 0xff) { i++; continue; }
    if (k === 0xd9) { ended = true; i += 2; break; }
    if (k === 0xd8 || (k >= 0xd0 && k <= 0xd7) || k === 0x01) { i += 2; continue; }
    if (i + 4 > u8.length) return bad('cut inside a segment header');
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2 || i + 2 + len > u8.length) return bad('segment runs past the end');
    if (k >= 0xc0 && k <= 0xcf && k !== 0xc4 && k !== 0xc8 && k !== 0xcc) {
      if (frame) return bad('more than one frame');
      const n = u8[i + 9]; if (len < 8 + 3 * n || !n) return bad('frame header too short');
      frame = { type: k, progressive: k === 0xc2, h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8], ids: [] };
      for (let c = 0; c < n; c++) { const id = u8[i + 10 + 3 * c]; frame.ids.push(id); cov.set(id, { dc: -1, ac: new Int8Array(64).fill(-1) }); }
      if (k !== 0xc0 && k !== 0xc1 && k !== 0xc2) return bad('frame type not handled');
      i += 2 + len; continue;
    }
    if (k === 0xda) {
      if (!frame) return bad('scan before frame');
      const ns = u8[i + 4]; if (len !== 6 + 2 * ns || !ns) return bad('scan header size');
      const ss = u8[i + 5 + 2 * ns], se = u8[i + 6 + 2 * ns], al = u8[i + 7 + 2 * ns] & 15;
      if (se > 63 || ss > se) return bad('scan range');
      for (let c = 0; c < ns; c++) { const cv = cov.get(u8[i + 5 + 2 * c]); if (!cv) return bad('scan names an unknown component');
        const low = frame.progressive ? al : 0;
        for (let z = ss; z <= se; z++) { if (z === 0) { if (cv.dc < 0 || low < cv.dc) cv.dc = low; } else if (cv.ac[z] < 0 || low < cv.ac[z]) cv.ac[z] = low; } }
      scans++; i += 2 + len;
      for (;;) {   // entropy-coded data runs to the next real marker (FF followed by anything but 00 or a restart marker)
        const j = u8.indexOf(0xff, i); if (j < 0 || j + 1 >= u8.length) return bad('scan data runs past the end');
        const m = u8[j + 1]; if (m === 0x00 || (m >= 0xd0 && m <= 0xd7)) { i = j + 2; continue; }
        if (m === 0xff) { i = j + 1; continue; }
        i = j; break;
      }
      continue;
    }
    i += 2 + len;
  }
  if (!frame) return bad('no frame header');
  if (!ended) return bad('no end marker');
  if (i !== u8.length) return bad('bytes after the end marker');
  if (!scans) return bad('no scan');
  let missing = 0; for (const cv of cov.values()) { if (cv.dc !== 0) missing++; for (let z = 1; z < 64; z++) if (cv.ac[z] !== 0) missing++; }
  return { ok: true, progressive: frame.progressive, w: frame.w, h: frame.h, components: frame.ids.length, scans, complete: missing === 0, missing };
}
/** Decodes the whole JPEG with the decoder carried below (strict: a damaged scan throws). Returns the three component planes as the
 * file stores them (luma at full size, colour at half), or { error }. The colour conversion to RGB is not run: the checks read the
 * planes directly, which roughly halves the memory a decode needs. */
function evDecode(u8) {
  try {
    const d = new EV_JPEG(); d.opts = { tolerantDecoding: false, formatAsRGBA: false, useTArray: true, colorTransform: undefined, ...EARTHVIEW.DECODE };
    EV_JPEG.resetMaxMemoryUsage(EARTHVIEW.DECODE.maxMemoryUsageInMB * 1024 * 1024);
    d.parse(u8);
    if (!d.components || d.components.length !== 3) return { error: 'not a three-component picture' };
    return { w: d.width, h: d.height, planes: d.components.map(c => ({ lines: c.lines, sx: c.scaleX, sy: c.scaleY })) };
  } catch (e) { return { error: String((e && e.message) || e).slice(0, 120) }; }
}
/** Fully decodes an 8-bit RGBA PNG: every chunk checksum verified, the data inflated to exactly the size the header promises, every
 * row unfiltered. Returns { w, h, rgba } or null for anything wrong or any other form (interlaced, palette, 16-bit). */
async function evPng(u8, maxPixels) {
  const info = pngInfo(u8); if (!info || !info.complete || info.colour !== 6 || u8[24] !== 8 || u8[26] !== 0 || u8[27] !== 0 || u8[28] !== 0) return null;
  const { w, h } = info; if (!w || !h || w * h > maxPixels) return null;
  const u32 = i => ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]) >>> 0, parts = [];
  for (let i = 8; i + 12 <= u8.length;) { const len = u32(i), end = i + 12 + len; if (end > u8.length) return null;
    let c = 0xffffffff; for (let j = i + 4; j < i + 8 + len; j++) c = DUST_CRC[(c ^ u8[j]) & 0xff] ^ (c >>> 8);
    if (((c ^ 0xffffffff) >>> 0) !== u32(i + 8 + len)) return null;
    if (String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]) === 'IDAT') parts.push(u8.subarray(i + 8, i + 8 + len));
    i = end; }
  if (!parts.length) return null;
  const stride = w * 4, raw = (await dustInflate(parts, h * (stride + 1))).data; if (!raw) return null;
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) { const r = y * (stride + 1), f = raw[r], cur = r + 1, up = cur - (stride + 1); if (f > 4) return null;
    for (let x = 0; x < stride; x++) { const a = x >= 4 ? raw[cur + x - 4] : 0, b = y ? raw[up + x] : 0, c = (y && x >= 4) ? raw[up + x - 4] : 0;
      let add = 0; if (f === 1) add = a; else if (f === 2) add = b; else if (f === 3) add = (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      raw[cur + x] = (raw[cur + x] + add) & 0xff; }
    rgba.set(raw.subarray(cur, cur + stride), y * stride); }
  return { w, h, rgba };
}
/** Compares the decoded picture with the decoded check image of the same request. The check image's transparency says where the
 * disk is IN THIS RUN; nothing here assumes a disk size. Measures: (1) where the check image is clear, the picture must be the
 * background colour that was asked for; (2) inside the disk the picture must not be flat; (3) block by block, the picture's
 * brightness must follow the check image's. Returns the measurements and { ok, reason }. */
function evCompare(dec, png, L = EARTHVIEW.LIMITS, bg = EARTHVIEW.BG) {
  const n = png.w, step = dec.w / n; if (png.w !== png.h || dec.w !== dec.h || step !== Math.floor(step)) return { ok: false, reason: 'sizes do not correspond' };
  const [Y, Cb, Cr] = dec.planes, A = (x, y) => png.rgba[(y * n + x) * 4 + 3];
  const inner = (x, y, v) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) { if (v !== 0) return false; continue; } if (A(xx, yy) !== v) return false; } return true; };
  let edgeOpaque = 0; for (let k = 0; k < n; k++) { if (A(k, 0)) edgeOpaque++; if (A(k, n - 1)) edgeOpaque++; if (A(0, k)) edgeOpaque++; if (A(n - 1, k)) edgeOpaque++; }
  let sN = 0, sIn = 0, sWorst = 0, dN = 0, sp = 0, sj = 0, spp = 0, sjj = 0, spj = 0, opaque = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const a = A(x, y); if (a === 255) opaque++;
    const px = Math.floor((x + 0.5) * step), py = Math.floor((y + 0.5) * step);
    if (a === 0 && inner(x, y, 0)) {   // well inside the surround: the picture must show the colour that was asked for
      const yy = Y.lines[py][px], cb = Cb.lines[Math.floor(py * Cb.sy)][Math.floor(px * Cb.sx)] - 128, cr = Cr.lines[Math.floor(py * Cr.sy)][Math.floor(px * Cr.sx)] - 128;
      const d = Math.max(Math.abs(yy + 1.402 * cr - bg[0]), Math.abs(yy - 0.3441363 * cb - 0.71413636 * cr - bg[1]), Math.abs(yy + 1.772 * cb - bg[2]));
      sN++; if (d <= L.BG_TOLERANCE) sIn++; if (d > sWorst) sWorst = d;
    } else if (a === 255 && inner(x, y, 255)) {   // well inside the disk: block mean brightness of the picture against the check image's pixel
      let m = 0; const x0 = x * step, y0 = y * step; for (let v = 0; v < step; v++) { const row = Y.lines[y0 + v]; for (let u = 0; u < step; u++) m += row[x0 + u]; } m /= step * step;
      const o = (y * n + x) * 4, p = 0.299 * png.rgba[o] + 0.587 * png.rgba[o + 1] + 0.114 * png.rgba[o + 2];
      dN++; sp += p; sj += m; spp += p * p; sjj += m * m; spj += p * m;
    }
  }
  const sd = dN ? Math.sqrt(Math.max(0, sjj / dN - (sj / dN) ** 2)) : 0, sdP = dN ? Math.sqrt(Math.max(0, spp / dN - (sp / dN) ** 2)) : 0;
  const agreement = dN && sd > 0 && sdP > 0 ? (spj / dN - (sp / dN) * (sj / dN)) / (sd * sdP) : 0;
  const m = { check_opaque_share: +(opaque / (n * n)).toFixed(4), check_opaque_on_frame_edge: edgeOpaque, surround_samples: sN, surround_share_background: sN ? +(sIn / sN).toFixed(4) : 0, surround_worst_difference: +sWorst.toFixed(1),
    disk_samples: dN, disk_brightness_spread: +sd.toFixed(1), agreement: +agreement.toFixed(4) };
  const fail = edgeOpaque ? 'disk touches the frame edge' : dN < L.DISK_SAMPLES_MIN ? 'check image shows no disk' : sN < L.SURROUND_SAMPLES_MIN ? 'check image shows no surround'
    : m.surround_share_background < L.SURROUND_SHARE_MIN ? 'surround is not the background colour' : sd < L.DISK_LUMA_SD_MIN ? 'picture is blank inside the disk' : agreement < L.AGREEMENT_MIN ? 'picture does not match the check image' : null;
  return { ok: !fail, reason: fail, ...m };
}
/** One response from EUMETView, read with a size limit. { ok, buf, bytes, sha256, warn_present, served } or { ok:false, reason, http, detail }. Reasons are fixed phrases (public). */
async function evFetch(what, url, spec, timeoutMs = EARTHVIEW.TIMEOUT_MS) {   // timeoutMs: only the Stage B probe passes one (its whole-run deadline); the collector's limit is unchanged
  let r;
  try { r = await fetch(url, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(timeoutMs) }); } catch (e) { return { ok: false, reason: what + ' request failed', http: 0, detail: String(e).slice(0, 160) }; }
  if (r.status !== 200) return { ok: false, reason: what + ' http error', http: r.status };
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== spec.type) return { ok: false, reason: what + ' not a picture', http: 200, detail: type };   // EUMETView answers a bad time with HTTP 200 and XML
  const got = await dustBody(r, spec.maxBytes);
  if (got.error) return { ok: false, reason: what + ' request failed', http: 200, detail: got.error };
  if (got.over || !got.buf.byteLength) return { ok: false, reason: what + ' size out of range', http: 200, detail: got.over ? 'over ' + spec.maxBytes : '0' };
  const warn = r.headers.get('warning');
  return { ok: true, buf: got.buf, bytes: got.buf.byteLength, sha256: await sha256Bytes(got.buf), warn_present: warn !== null, served: dustServed(warn) };
}
/* ---- Storage records, guards and recovery (review of readiness rev 2, 20 Nov 2026) ----
 * RECORDS. earthview/current.json (the pointer: frame, previous), earthview/held.json (the list: every stored picture), both stamped
 * with an EPOCH; earthview/epochs/<epoch>.json (a create-only marker per epoch); earthview/hold.json (present = no run may start).
 * earthview/state.json (last source check, last outcome) is for the page only: NO guard reads it, so a failure report cannot
 * destroy evidence a guard uses, and a failed write to it is not a safety failure.
 * THE COLLECTOR NEVER CREATES THE POINTER OR THE LIST. They are created only by evRecover (admin, under a hold), for a first start
 * and for a repair alike. A run that finds either missing stops. There is no counter that could silently restart.
 * KEYS. earthview/frames/<epoch>/<time>-<sha16>-g<n>-<24 hex>/picture.jpg. The 24 hex digits are 96 random bits drawn by the run;
 * the write is create-only. No restore of any record can make a later run issue an old key again, short of drawing the same value.
 * A STOP is an EvStop: the run stores nothing more, deletes nothing, publishes nothing and reports one fixed phrase. */
class EvStop extends Error { constructor(reason, detail) { super(reason); this.reason = reason; this.detail = detail || null; } }
const EV_STOP = { HELD: 'collection is held', UNSET: 'storage is not set up', REPAIR: 'storage record needs repair', BUSY: 'storage busy', CHANGED: 'storage changed during the run' };
const evHex = n => { const b = new Uint8Array(n); crypto.getRandomValues(b); let s = ''; for (const x of b) s += x.toString(16).padStart(2, '0'); return s; };
const evEpochOk = e => typeof e === 'string' && /^e\d{8}T\d{6}Z-[0-9a-f]{16}$/.test(e);
const evNewEpoch = () => 'e' + nowIso().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') + '-' + evHex(8);
const evIdOk = id => typeof id === 'string' && /^\d{8}T\d{4}Z-[0-9a-f]{16}-g\d{1,12}-[0-9a-f]{24}$/.test(id);
const evPutJson = (env, key, body, onlyIf) => env.R2.put(key, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf });
/** One record as stored: { cur, etag }. cur is null when there is no object and undefined when the object does not parse. */
async function evGet(env, key) { const o = await env.R2.get(key); if (!o) return { cur: null, etag: null }; let cur; try { cur = await o.json(); } catch (_) { cur = undefined; } return { cur: cur === null ? undefined : cur, etag: o.etag }; }
/** Read, change, write of one small record; every write is conditional on what was read (or on there being nothing). change(cur)
 * returns the new body, or null to leave it, or throws EvStop. It runs again on EVERY retry, against what was just read, so a
 * fence inside it is checked again each time. */
async function evUpdate(env, key, change) {
  for (let i = 0; i < 5; i++) {
    const { cur, etag } = await evGet(env, key), body = change(cur);
    if (body === null) return { cur, body: null, wrote: false };
    const r = await evPutJson(env, key, body, etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' });
    if (r !== null) return { cur, body, wrote: true };
  }
  throw new EvStop(EV_STOP.BUSY, 'record kept changing; gave up after 5 tries: ' + key);
}
/** THE FENCE. Wraps a change so that it applies only to a record still stamped with the epoch this run started under. Recovery
 * changes the epoch; from then on every write by an earlier run, scheduled or manual, however long it has been going, stops here. */
const evFence = (epoch, change) => cur => { if (!cur || cur.epoch !== epoch) throw new EvStop(EV_STOP.CHANGED, 'the record is no longer stamped ' + epoch); return change(cur); };
/** Every object under a prefix, all pages. */
async function evListAll(env, prefix) {
  const out = []; let cursor;
  for (let i = 0; i < EARTHVIEW.LIST_PAGES_MAX; i++) { const r = await env.R2.list({ prefix, cursor, limit: EARTHVIEW.LIST_PAGE });
    for (const o of r.objects) out.push({ key: o.key, size: o.size });
    if (!r.truncated) return out; cursor = r.cursor; }
  throw new EvStop(EV_STOP.REPAIR, 'more than ' + EARTHVIEW.LIST_PAGES_MAX + ' pages of objects under ' + prefix);
}
/** GUARDS, at the start of every run (scheduled or manual) before any request or write. Returns { epoch } or throws EvStop.
 *  G0 a hold record exists                                   -> "collection is held"
 *  G1 neither pointer nor list exists                        -> "storage is not set up" (first start, or everything lost: a person decides)
 *     one of them is missing or unreadable                   -> "storage record needs repair"
 *  G2 the epochs differ, or the epoch has no marker          -> repair
 *  G4 the pointer names a picture that is outside this epoch, not on the list, marked or pending -> repair (confirmed on a second read)
 *  G5 INVENTORY against a STABLE view: the list is read, every page of this epoch's prefix is listed, the list's version is read
 *     again. If it changed, the pass is discarded and repeated. A mismatch (a stored picture not on the list; or a claimed, unmarked
 *     entry of this epoch with no picture) must be found by TWO stable passes before it is called repair. Passes that keep being
 *     overtaken end as "storage busy": this run collects nothing, and nothing is said to be broken.
 * G5 is a consistency check. It does not detect every restore: one after which the records and the stored pictures agree passes.
 * Pending entries without a picture and marked entries without a picture are legitimate and never reported. Entries whose key is
 * outside this epoch's prefix (pictures adopted by a recovery) are not checked: an old delete may still remove them, harmlessly. */
async function evGuard(env, opt = {}) {
  const repair = d => new EvStop(EV_STOP.REPAIR, d);
  if (!opt.ignoreHold && await env.R2.head(EARTHVIEW.HOLD)) throw new EvStop(EV_STOP.HELD, null);
  // Pointer first, then list: a frame the pointer names was claimed on the list before the pointer was written.
  const read = async () => { const P = await evGet(env, EARTHVIEW.POINTER), H = await evGet(env, EARTHVIEW.HELD);
    if (P.cur === null && H.cur === null) throw new EvStop(EV_STOP.UNSET, 'no pointer and no list');
    if (!P.cur || !H.cur || !Array.isArray(H.cur.items)) throw repair(`pointer ${P.cur === null ? 'missing' : P.cur ? 'present' : 'unreadable'}, list ${H.cur === null ? 'missing' : H.cur && Array.isArray(H.cur.items) ? 'present' : 'unreadable'}`);
    if (!evEpochOk(P.cur.epoch) || H.cur.epoch !== P.cur.epoch) throw repair(`epochs differ: pointer ${String(P.cur.epoch).slice(0, 40)}, list ${String(H.cur.epoch).slice(0, 40)}`);
    return { P: P.cur, H: H.cur }; };
  const role = (P, H, prefix) => { for (const [name, f] of [['current', P.frame], ['previous', P.previous]]) { if (!f) continue;
    if (!f.picture || !String(f.picture.key).startsWith(prefix)) return name + ' picture is outside this epoch';
    const x = H.items.find(i => i.id === f.id);
    if (!x || x.key !== f.picture.key) return name + ' picture is not on the list';
    if (x.deleting) return name + ' picture is marked for deletion'; if (x.pending) return name + ' picture is still pending on the list'; } return null; };
  let v = await read(); const epoch = v.P.epoch, prefix = EARTHVIEW.PREFIX + epoch + '/';
  if (!await env.R2.head(EARTHVIEW.EPOCHS + epoch + '.json')) throw repair('no marker for epoch ' + epoch);
  if (role(v.P, v.H, prefix)) { v = await read(); if (v.P.epoch !== epoch) throw new EvStop(EV_STOP.CHANGED, 'epoch changed during the guards'); const again = role(v.P, v.H, prefix); if (again) throw repair(again); }
  const pass = async () => { const a = await evGet(env, EARTHVIEW.HELD);
    if (!a.cur || a.cur.epoch !== epoch || !Array.isArray(a.cur.items)) throw new EvStop(EV_STOP.CHANGED, 'the list changed epoch or became unreadable during the inventory');
    const objs = await evListAll(env, prefix), b = await env.R2.head(EARTHVIEW.HELD);
    if (!b || b.etag !== a.etag) return null;   // overtaken: not a finding
    const stored = new Set(objs.map(o => o.key)), listed = new Set(a.cur.items.map(i => i.key));
    const unlisted = objs.filter(o => !listed.has(o.key)).map(o => o.key), missing = a.cur.items.filter(i => String(i.key).startsWith(prefix) && !i.deleting && !i.pending && !stored.has(i.key)).map(i => i.key);
    return { unlisted, missing, sig: JSON.stringify([unlisted, missing]) }; };
  let first = null, verdict = null;
  for (let t = 0; t < EARTHVIEW.INVENTORY_TRIES && !verdict; t++) { const r = await pass(); if (!r) continue;
    if (!r.unlisted.length && !r.missing.length) verdict = 'clean'; else if (first && first.sig === r.sig) verdict = 'mismatch'; else first = r; }
  if (!verdict) throw new EvStop(EV_STOP.BUSY, first ? 'a mismatch was seen once and could not be confirmed against a stable view' : 'the list kept changing during the inventory');
  if (verdict === 'mismatch') throw repair(`inventory: ${first.unlisted.length} stored picture(s) not on the list, ${first.missing.length} listed picture(s) not stored; ` + [...first.unlisted, ...first.missing].slice(0, 3).join(' '));
  return { epoch };
}
const evStateEmpty = () => ({ schema: 1, layer: 'earthview', run: null, source_check: null, collection: null });
/** Records the last source check and the last collection outcome, for the page. Ordered by run time: a run that started earlier
 * never replaces a later run's record. Not a safety record (no guard reads it); a failure to write it is deliberately not fatal. */
async function evState(env, ms, patch) {
  const run = new Date(ms).toISOString();
  try { await evUpdate(env, EARTHVIEW.STATE, c => { const cur = c || evStateEmpty(); return (cur.run && cur.run > run) ? null : { ...cur, ...patch(cur), run, collector_version: COLLECTOR_VERSION }; }); } catch (_) {}
}
/** A failed collection: nothing published, the pointer and the list untouched, the outcome recorded with a fixed public phrase; detail goes to collector_runs only. */
async function evFail(env, ms, reason, http, detail, T, check) {
  const at = nowIso();
  await evState(env, ms, cur => ({ ...(check ? { source_check: check } : {}), collection: { outcome: 'failed', frame_time: T || null, reason, http: http || 0, at,
    consecutive_failures: ((cur.collection && cur.collection.outcome === 'failed' && cur.collection.consecutive_failures) || 0) + 1 } }));
  await logRun(env, 'earthview', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));
  return 'earthview:down ' + reason;
}
async function collectEarthView(env, ms, x) {
  let T = null, check = null;
  try { return await evCollect(env, ms, v => { T = v.T; check = v.check; }, x); }
  catch (e) { if (e instanceof EvStop) return evFail(env, ms, e.reason, 0, e.detail, T, check); throw e; }
}
async function evCollect(env, ms, note, x) {
  // 0. Guards: hold, records present, epochs agree, pointer pictures in role, inventory. A stop here makes no request to the source.
  const { epoch } = await evGuard(env);
  // 1. Source check: which frames does the service list? A failure here is recorded as a failed CHECK, never as a delay at the source.
  let r; const checkAt = nowIso();
  try { r = await fetch(EARTHVIEW.CAP, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(EARTHVIEW.LIST_TIMEOUT_MS) }); } catch (e) { return evFail(env, ms, 'source check failed', 0, String(e).slice(0, 160), null, { ok: false, at: checkAt, reason: 'no answer' }); }
  if (r.status !== 200) { try { await r.body.cancel(); } catch (_) {} return evFail(env, ms, 'source check failed', r.status, null, null, { ok: false, at: checkAt, reason: 'http error', http: r.status }); }
  let xml; try { xml = await r.text(); } catch (e) { return evFail(env, ms, 'source check failed', 200, String(e).slice(0, 160), null, { ok: false, at: checkAt, reason: 'unreadable' }); }
  const T = evLatest(xml);
  if (!T) return evFail(env, ms, 'source check failed', 200, 'no advertised time for ' + EARTHVIEW.LAYER, null, { ok: false, at: checkAt, reason: 'frame list unreadable' });
  const age = Number(r.headers.get('age')), check = { ok: true, at: checkAt, newest: T, cache_age_s: Number.isFinite(age) && r.headers.get('age') !== null ? age : null };
  note({ T, check });
  const cur = evFence(epoch, c => c)((await evGet(env, EARTHVIEW.POINTER)).cur);
  if (cur.frame && T <= cur.frame.source_frame_time) {   // nothing newer listed: no picture request, the pointer untouched
    await evState(env, ms, () => ({ source_check: check, collection: { outcome: 'nothing newer', frame_time: T, at: nowIso() } }));
    await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, 'nothing newer: ' + T + ' listed, ' + cur.frame.source_frame_time + ' held');
    return 'earthview:nothing newer ' + T;
  }
  // 2. The delivered picture and the check image, for exactly that time
  const q = `&time=${T}`, P = EARTHVIEW.PICTURE, C = EARTHVIEW.CHECK;
  const picUrl = `${EARTHVIEW.MAP}&width=${P.w}&height=${P.h}&format=image/jpeg&bgcolor=${EARTHVIEW.BGCOLOR}${q}`, chkUrl = `${EARTHVIEW.MAP}&width=${C.w}&height=${C.h}&format=image/png&transparent=true${q}`;
  const pic = await evFetch('picture', picUrl, P); if (!pic.ok) return evFail(env, ms, pic.reason, pic.http, pic.detail, T, check);
  const chk = await evFetch('check image', chkUrl, C); if (!chk.ok) return evFail(env, ms, chk.reason, chk.http, chk.detail, T, check);
  // 3. Served time: strict. A different frame is refused; no statement of the served time is refused too.
  for (const [what, f] of [['picture', pic], ['check image', chk]]) {
    if (!f.served) return evFail(env, ms, 'served time not confirmed', 200, what + ': ' + (f.warn_present ? 'header present but names no time' : 'no Warning header'), T, check);
    if (f.served !== T) return evFail(env, ms, 'served a different frame', 200, `${what}: asked ${T}, server named ${f.served}`, T, check);
  }
  // 4. The delivered picture itself: structure to the last byte, every scan present, then a full decode
  const vFail = (...a) => { evValidated(x, false); return evFail(...a); }; evValidationBegin(x);   // 0.6.22: counts only (EVB); see evValidationBegin
  const u8 = new Uint8Array(pic.buf), sc = evJpegScans(u8);
  if (!sc.ok) return vFail(env, ms, 'picture failed validation', 200, 'structure: ' + sc.reason, T, check);
  if (sc.w !== P.w || sc.h !== P.h || sc.components !== 3) return vFail(env, ms, 'picture failed validation', 200, `size ${sc.w}x${sc.h}, ${sc.components} components`, T, check);
  if (!sc.complete) return vFail(env, ms, 'picture failed validation', 200, `scans incomplete: ${sc.missing} coefficient positions not delivered at full precision in ${sc.scans} scans`, T, check);
  const png = await evPng(new Uint8Array(chk.buf), C.w * C.h);
  if (!png || png.w !== C.w || png.h !== C.h) return vFail(env, ms, 'check image failed validation', 200, 'does not decode as ' + C.w + 'x' + C.h + ' RGBA', T, check);
  const dec = evDecode(u8);
  if (dec.error) return vFail(env, ms, 'picture failed validation', 200, 'decode: ' + dec.error, T, check);
  if (dec.w !== P.w || dec.h !== P.h) return vFail(env, ms, 'picture failed validation', 200, `decoded size ${dec.w}x${dec.h}`, T, check);
  const cmp = evCompare(dec, png);
  if (!cmp.ok) return vFail(env, ms, 'picture failed validation', 200, cmp.reason + ' ' + JSON.stringify(cmp), T, check);
  evValidated(x, true);
  // 5. A KEY NO OTHER RUN HAS HAD OR WILL HAVE. The run draws 96 random bits; the key holds them, beside the epoch and a number
  //    from the list. In one fenced conditional write the run takes the number and lists its picture as "pending" under that key,
  //    so an entry always exists before its object does. Only this run writes the key, once, create-only; once its object is
  //    deleted nothing writes that key again: a retry of the same frame with the same bytes draws a new value. So a cleanup that
  //    deletes a key late, twice, or from an out-of-date view of the list can only delete what was already condemned.
  const published_at = nowIso(), runStamp = new Date(ms).toISOString(), rand = evHex(12); let gen = 0;
  const idOf = g => evKeyOf(T) + '-' + pic.sha256.slice(0, 16) + '-g' + g + '-' + rand, keyOf = g => `${EARTHVIEW.PREFIX}${epoch}/${idOf(g)}/picture.jpg`;
  await evUpdate(env, EARTHVIEW.HELD, evFence(epoch, h => { gen = Math.max(1, Number(h.next_gen) || 1, ...h.items.map(x => (Number(x.gen) || 0) + 1));
    return { ...h, next_gen: gen + 1, items: [...h.items, { id: idOf(gen), gen, key: keyOf(gen), bytes: pic.bytes, source_frame_time: T, published_at, left_at: null, pending: runStamp }] }; }));
  const id = idOf(gen), key = keyOf(gen);
  const stored = async () => { let b = null; try { const o = await env.R2.get(key); b = o ? await o.arrayBuffer() : null; } catch (_) { return 'unreadable'; } return !b ? 'absent' : (b.byteLength === pic.bytes && await sha256Bytes(b) === pic.sha256) ? 'same' : 'differs'; };
  // 5b. Store it, create-only (an object already at this key is never replaced), and read it back
  let put; try { put = await env.R2.put(key, pic.buf, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { sha256: pic.sha256, source_frame_time: T }, onlyIf: { etagDoesNotMatch: '*' } }); } catch (e) { return evFail(env, ms, 'picture write failed', 200, String(e).slice(0, 160), T, check); }
  if (put === null) return evFail(env, ms, 'picture key already in use', 200, key, T, check);
  if (await stored() !== 'same') return evFail(env, ms, 'picture read-back differs', 200, key, T, check);
  const frame = { id, source_frame_time: T, served_time: T, time_basis: 'the server named this frame time on both responses (Warning header)', first_listed_seen_at: checkAt, fetched_at: published_at, run: runStamp,
    request: { service: 'WMS 1.3.0 GetMap', layer: 'mtg_fd:' + EARTHVIEW.LAYER, crs: EARTHVIEW.CRS, crs_definition: EARTHVIEW.CRS_DEFINITION, bbox: EARTHVIEW.BBOX, width: P.w, height: P.h, format: 'image/jpeg', bgcolor: EARTHVIEW.BGCOLOR, time: T },
    picture: { file: 'picture.jpg', key, path: `/snapshot/earthview/${id}/picture.jpg`, type: 'image/jpeg', bytes: pic.bytes, sha256: pic.sha256, w: P.w, h: P.h },
    checks: { decoded: true, progressive: sc.progressive, scans: sc.scans, check_image_sha256: chk.sha256, ...cmp, ok: undefined, reason: undefined } };
  // 6. CLAIM (fenced): the entry stops being pending. The write refuses if the entry is missing or marked for deletion (which would
  //    need this run to have been stopped for the whole grace period); the pointer is written only after it succeeds.
  let claimed = false;
  await evUpdate(env, EARTHVIEW.HELD, evFence(epoch, h => { const x = h.items.find(i => i.key === key); claimed = !!x && !x.deleting; if (!claimed) return null;
    return { ...h, items: h.items.map(i => i.key === key ? { ...i, pending: undefined, left_at: null, claimed_at: nowIso() } : i) }; }));
  if (!claimed) return evFail(env, ms, 'stored copy is being removed', 200, key + ' is no longer listed, or is marked for deletion; not published', T, check);
  // 7. PUBLISH (fenced): move the pointer only if it is still this epoch's and no run has published this time or a later one meanwhile
  const up = await evUpdate(env, EARTHVIEW.POINTER, evFence(epoch, c => (c.frame && c.frame.source_frame_time >= T) ? null : { ...evPointer(epoch), frame, previous: c.frame || null }));
  if (!up.wrote) { await evState(env, ms, () => ({ source_check: check, collection: { outcome: 'superseded', frame_time: T, at: nowIso() } })); await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, `superseded: ${up.cur.frame.source_frame_time} was published first; ${T} not published`); return 'earthview:superseded ' + T; }
  await evState(env, ms, () => ({ source_check: check, collection: { outcome: 'published', frame_time: T, at: published_at } }));
  // 8. Cleanup, only here: a newer verified frame has just been published. Its failure never undoes the publication.
  let deleted = 0, cleanupNote = ''; try { deleted = await evCleanup(env, epoch); } catch (e) { cleanupNote = '; cleanup stopped: ' + String((e && e.reason) || e).slice(0, 80); }
  await logRun(env, 'earthview', ms, 'ok', 200, 1, pic.bytes, `frame ${T} as ${id}; agreement ${cmp.agreement}; ${deleted} old picture(s) deleted${cleanupNote}`);
  return 'earthview:published ' + T;
}
const evPointer = epoch => ({ schema: 2, layer: 'earthview', epoch, frame: null, previous: null, collector_version: COLLECTOR_VERSION });
/** Removes pictures that are neither current nor previous and left that role at least GRACE_S ago. Called only by a run that has
 * just published a newer verified frame. Any number of cleanups may overlap, stop half way, or act on an out-of-date view.
 * WHY NO CLEANUP DELETES A PICTURE THE POINTER NAMES OR MAY COME TO NAME (within what the collector itself can do):
 *  1. One key, one writer, one life. A key holds 96 random bits drawn by its run (collector step 5). Only that run writes the key,
 *     once, create-only. After its object is deleted nothing writes that key again: no path in this file stores to a key it did
 *     not just make, and recovery copies to keys it has just made too.
 *  2. An entry enters the pointer only through its own run, straight after that run's claim (step 6), or through a recovery, which
 *     makes a new entry under a new key. An entry never re-enters.
 *  3. An entry is marked "deleting" only by a fenced conditional write whose own view shows it absent from the pointer just read
 *     and at least GRACE_S past the moment a cleanup first saw it out of role. Its own run's claim refuses a marked entry.
 *  4. Therefore deleting a marked entry's key is safe whenever it happens and however often, as far as any run can arrange.
 *  5. A delete that fails leaves the mark; a list update that fails after the delete leaves a marked entry with no object. The next
 *     cleanup finds the mark, deletes again (harmless) and removes the entry. Marked entries are not served.
 *  6. Current and previous are read from the pointer here, twice, each time with the epoch checked; the second read guards a state
 *     rules 1 to 3 do not produce.
 * WHAT RULES 1 TO 4 DO NOT COVER: someone outside the collector putting back an OLDER POINTER that names a key whose delete is
 * already pending. No check here can stop that delete. evRecover is the answer: it never keeps a restored key; it copies the
 * verified pictures to new keys before it installs a pointer, so a pending delete can only reach the old copies.
 * Rests on: R2 conditional puts behaving as probed on the production bucket; crypto.getRandomValues being unpredictable; and no
 * run pausing for the whole grace period between its claim and its pointer write. */
async function evCleanup(env, epoch) {
  const liveOf = p => new Set([p && p.frame && p.frame.id, p && p.previous && p.previous.id].filter(Boolean));
  const pointer = async () => evFence(epoch, c => c)((await evGet(env, EARTHVIEW.POINTER)).cur);
  const live = liveOf(await pointer()), at = nowIso(), nowMs = Date.parse(at);
  const h = await evUpdate(env, EARTHVIEW.HELD, evFence(epoch, hh => ({ ...hh, items: hh.items.map(x => x.deleting ? x : live.has(x.id) ? { ...x, left_at: null }
    : !x.left_at ? { ...x, left_at: at } : (nowMs - Date.parse(x.left_at) >= EARTHVIEW.GRACE_S * 1000 && String(x.key).startsWith(EARTHVIEW.PREFIX)) ? { ...x, deleting: at } : x) })));
  const marked = h.body.items.filter(x => x.deleting); if (!marked.length) return 0;
  const live2 = liveOf(await pointer()), gone = [], spared = [];
  for (const x of marked) { if (live2.has(x.id)) { spared.push(x.key); continue; } try { await env.R2.delete(x.key); gone.push(x.key); } catch (_) {} }
  if (gone.length || spared.length) await evUpdate(env, EARTHVIEW.HELD, evFence(epoch, hh => ({ ...hh, items: hh.items.filter(x => !(x.deleting && gone.includes(x.key))).map(x => x.deleting && spared.includes(x.key) ? { ...x, deleting: undefined, left_at: null } : x) })));
  return gone.length;
}
async function runEarthView(env, ms) { let r = null; const g = await guarded(env, 'earthview', ms, async (e, m) => { r = await collectEarthView(e, m); }); return r || g; }
/* ---- Hold, recover, sweep, release: /admin/earthview/<action> (admin key). Every action is a DRY RUN that writes nothing unless it
 * is a POST with apply=1; recover and sweep also need plan=<id> from a dry run, and refuse if what they find no longer gives that
 * id. ORDER OF A RECOVERY (also the first start), and what holds in every gap:
 *   hold    writes earthview/hold.json, create-only. From then on no NEW run starts (guard G0), scheduled or manual. Runs already
 *           going are not stopped by it; nothing below assumes they have ended, however long they last.
 *   recover R1 reads the pointer, the list and every object; reads the current and previous pictures WHOLE and checks each against
 *              the size and hash the pointer records. One that is missing or differs is not kept (the plan says so, by role).
 *           R2 makes a new epoch and writes its marker, create-only (the plan is in it).
 *           R3 writes each kept picture's bytes, from memory, to a NEW key under the new epoch; reads each back.
 *              [until here nothing live has changed; an earlier run can still publish, and if one does, R4 refuses]
 *           R4 THE FENCE ON PUBLICATION: one conditional write of the pointer, on the exact version R1 read: new epoch, the kept
 *              frames under their new keys. If the pointer changed since R1, nothing is installed and recovery ends ("pointer
 *              changed"); it is NOT retried against a pointer the plan never saw. After R4 the page is served from the new keys,
 *              and no earlier run can publish: its pointer write meets the new epoch and stops.
 *              [gap R4..R5: the list still carries the old epoch. Earlier runs can still take a number, store and claim on it; they
 *               stop at the pointer. An earlier cleanup stops at its pointer read; one already past it deletes only keys it had
 *               marked, none of which the new pointer names. New runs: held, and G2 stops them too.]
 *           R5 lists every object under earthview/frames/ and writes the list: new epoch, the kept pictures in role, EVERY other
 *              object out of role with its grace period starting now. The new body does not depend on the old one, so a conflict
 *              is simply retried (5 times). After R5 no earlier run can write the list either.
 *              [if R5 cannot be written the records disagree: G2 keeps every run stopped; recover is run again, whole]
 *           R6 reads back: epochs agree, both kept pictures present, in role and matching.
 *           Recovery DELETES NOTHING. A failed recovery is never resumed: it is run again from R1 with a new epoch; what the failed
 *           one left (its marker, its copies) is unlisted until the next R5 adopts the copies as out-of-role pictures.
 *   sweep   adds any object under earthview/frames/ that the list does not know, out of role (a picture an earlier run finished
 *           storing after R5). May be repeated.
 *   release refuses unless: a hold exists; every guard passes (stable inventory included); a sweep would add nothing; the current
 *           and previous pictures read back whole and match. Then it removes the hold.
 * WHAT AN EARLIER RUN CAN STILL DO AFTER A RECOVERY, for as long as it lives: finish storing a picture under the OLD epoch's prefix
 * (unlisted; a leak until a sweep adopts it; the guards do not look there), and carry out a delete it had already decided (an old
 * key). Neither can reach a picture the recovered pointer names. */
async function evSurvey(env) {
  const hold = await evGet(env, EARTHVIEW.HOLD), P = await evGet(env, EARTHVIEW.POINTER), H = await evGet(env, EARTHVIEW.HELD);
  const objects = await evListAll(env, EARTHVIEW.PREFIX), markers = await evListAll(env, EARTHVIEW.EPOCHS);
  const keep = [], drop = [];
  for (const [role, f] of [['current', P.cur && P.cur.frame], ['previous', P.cur && P.cur.previous]]) { if (!f) continue;
    let buf = null, why = null; try { const o = f.picture && f.picture.key ? await env.R2.get(f.picture.key) : null; buf = o ? await o.arrayBuffer() : null; } catch (_) { why = 'unreadable'; }
    if (!why && !buf) why = 'missing'; if (!why && (buf.byteLength !== f.picture.bytes || await sha256Bytes(buf) !== f.picture.sha256)) why = 'differs from the record';
    if (why) drop.push({ role, id: f.id, source_frame_time: f.source_frame_time, why }); else keep.push({ role, frame: f, buf }); }
  const listed = new Set(((H.cur && Array.isArray(H.cur.items)) ? H.cur.items : []).map(i => i.key));
  return { hold, P, H, objects, markers, keep, drop, unlisted: objects.filter(o => !listed.has(o.key)) };
}
const evPlanId = async plan => (await sha256Bytes(new TextEncoder().encode(JSON.stringify(plan)))).slice(0, 16);
async function evAdmin(env, action, apply, planGiven) {
  const s = await evSurvey(env), at = nowIso(), rec = x => x.cur === null ? 'missing' : x.cur ? 'present' : 'unreadable';
  let guards = 'pass'; try { await evGuard(env, { ignoreHold: true }); } catch (e) { if (!(e instanceof EvStop)) throw e; guards = e.reason + (e.detail ? ': ' + e.detail : ''); }
  const seen = { hold: s.hold.cur ? s.hold.cur : s.hold.cur === null ? null : 'unreadable', pointer: rec(s.P), pointer_epoch: (s.P.cur && s.P.cur.epoch) || null, list: rec(s.H), list_epoch: (s.H.cur && s.H.cur.epoch) || null,
    list_entries: s.H.cur && Array.isArray(s.H.cur.items) ? s.H.cur.items.length : null, objects: s.objects.length, epoch_markers: s.markers.length, unlisted_objects: s.unlisted.length, guards,
    current: (s.P.cur && s.P.cur.frame && s.P.cur.frame.source_frame_time) || null, previous: (s.P.cur && s.P.cur.previous && s.P.cur.previous.source_frame_time) || null };
  const out = (extra, status = 200) => ({ status, body: { layer: 'earthview', action, applied: false, at, seen, ...extra } });
  if (action === 'status') return out({});
  if (action === 'hold') {
    if (s.hold.etag) return out({ result: 'already held' });
    if (!apply) return out({ would: 'write the hold record' });
    const r = await evPutJson(env, EARTHVIEW.HOLD, { schema: 1, layer: 'earthview', held_at: at, collector_version: COLLECTOR_VERSION }, { etagDoesNotMatch: '*' });
    return out({ applied: r !== null, result: r !== null ? 'held' : 'already held' });
  }
  if (action === 'recover') {
    const first = !s.P.etag && !s.H.etag && !s.objects.length && !s.markers.length;
    const kept = s.keep.map(k => ({ role: k.role, from_id: k.frame.id, source_frame_time: k.frame.source_frame_time, sha256: k.frame.picture.sha256, bytes: k.frame.picture.bytes }));
    const plan = { action, mode: first ? 'first start' : 'recovery', pointer_version: s.P.etag, list_version: s.H.etag, keep: kept, not_kept: s.drop, objects: s.objects.length };
    const plan_id = await evPlanId(plan);
    if (!apply) return out({ plan, plan_id, would: first ? 'create an empty pointer and list under a new epoch' : 'copy the kept pictures to new keys, install a pointer and a list under a new epoch; delete nothing' });
    if (!s.hold.etag) return out({ plan, plan_id, refused: 'no hold: hold first' }, 409);
    if (planGiven !== plan_id) return out({ plan, plan_id, refused: 'what was found does not give the plan id that was passed; read the dry run again' }, 409);
    const steps = [], epoch = evNewEpoch();
    // R2 marker
    if (await evPutJson(env, EARTHVIEW.EPOCHS + epoch + '.json', { schema: 1, layer: 'earthview', epoch, started_at: at, plan_id, plan, collector_version: COLLECTOR_VERSION }, { etagDoesNotMatch: '*' }) === null) return out({ plan_id, steps, refused: 'epoch marker already exists; run again' }, 500);
    steps.push('R2 marker ' + epoch);
    // R3 copies under new keys, from the bytes already verified in memory
    const made = {};
    for (const [n, k] of s.keep.entries()) { const f = k.frame, id = `${evKeyOf(f.source_frame_time)}-${f.picture.sha256.slice(0, 16)}-g${n + 1}-${evHex(12)}`, key = `${EARTHVIEW.PREFIX}${epoch}/${id}/picture.jpg`;
      const put = await env.R2.put(key, k.buf, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { sha256: f.picture.sha256, source_frame_time: f.source_frame_time }, onlyIf: { etagDoesNotMatch: '*' } });
      if (put === null) return out({ plan_id, epoch, steps, refused: 'a copy key was already in use; nothing installed; run again' }, 500);
      const o = await env.R2.get(key), back = o ? await o.arrayBuffer() : null;
      if (!back || back.byteLength !== f.picture.bytes || await sha256Bytes(back) !== f.picture.sha256) return out({ plan_id, epoch, steps, refused: 'a copy did not read back; nothing installed; run again' }, 500);
      made[k.role] = { ...f, id, recovered_from: f.id, picture: { ...f.picture, key, path: `/snapshot/earthview/${id}/picture.jpg` } }; steps.push(`R3 ${k.role} copied to ${id}`); }
    // R4 the fence on publication: the pointer, on exactly the version R1 read. Never retried.
    const frame = made.current || made.previous || null, previous = made.current ? (made.previous || null) : null;
    const pr = await evPutJson(env, EARTHVIEW.POINTER, { ...evPointer(epoch), frame, previous, recovered_at: at }, s.P.etag ? { etagMatches: s.P.etag } : { etagDoesNotMatch: '*' });
    if (pr === null) return out({ plan_id, epoch, steps, refused: 'pointer changed during recovery; nothing was installed; read the dry run again' }, 409);
    steps.push('R4 pointer installed');
    // R5 the list, from an inventory taken AFTER the fence
    const objs = await evListAll(env, EARTHVIEW.PREFIX), inRole = new Map([frame, previous].filter(Boolean).map((f, i) => [f.picture.key, { f, gen: i + 1 }]));
    const items = objs.map(o => { const r = inRole.get(o.key), id = (o.key.slice(0, -'/picture.jpg'.length).split('/').pop());
      return r ? { id: r.f.id, gen: r.gen, key: o.key, bytes: r.f.picture.bytes, source_frame_time: r.f.source_frame_time, published_at: at, left_at: null, claimed_at: at, recovered: true }
        : { id: o.key.endsWith('/picture.jpg') && evIdOk(id) ? id : null, gen: 0, key: o.key, bytes: o.size, source_frame_time: null, published_at: null, left_at: at, recovered: true }; });
    const body = { schema: 3, layer: 'earthview', epoch, next_gen: inRole.size + 1, recovered_at: at, items }; let wrote = false;
    for (let i = 0; i < 5 && !wrote; i++) { const h = await evGet(env, EARTHVIEW.HELD); wrote = await evPutJson(env, EARTHVIEW.HELD, body, h.etag ? { etagMatches: h.etag } : { etagDoesNotMatch: '*' }) !== null; }
    if (!wrote) return out({ plan_id, epoch, steps, applied: true, refused: 'the list could not be written; the records disagree and every run stays stopped; run recover again' }, 500);
    steps.push(`R5 list written with ${items.length} picture(s), ${inRole.size} in role`);
    // R6 read back
    let verified = 'pass'; try { await evGuard(env, { ignoreHold: true }); } catch (e) { if (!(e instanceof EvStop)) throw e; verified = e.reason + (e.detail ? ': ' + e.detail : ''); }
    return out({ plan_id, epoch, steps, applied: true, result: 'recovered', guards_after: verified, kept: [frame, previous].filter(Boolean).map(f => ({ id: f.id, source_frame_time: f.source_frame_time })), not_kept: s.drop, still: 'held; sweep, then release' });
  }
  if (action === 'sweep') {
    if (!s.H.cur || !evEpochOk(s.H.cur.epoch)) return out({ refused: 'no readable list: recover first' }, 409);
    const plan = { action, epoch: s.H.cur.epoch, list_version: s.H.etag, add: s.unlisted.map(o => o.key) }, plan_id = await evPlanId(plan);
    if (!apply) return out({ plan, plan_id, would: `add ${plan.add.length} picture(s) to the list, out of role` });
    if (!s.hold.etag) return out({ plan, plan_id, refused: 'no hold: hold first' }, 409);
    if (planGiven !== plan_id) return out({ plan, plan_id, refused: 'what was found does not give the plan id that was passed; read the dry run again' }, 409);
    let added = 0; await evUpdate(env, EARTHVIEW.HELD, evFence(plan.epoch, h => { const have = new Set(h.items.map(i => i.key)), add = s.unlisted.filter(o => !have.has(o.key)); added = add.length; if (!added) return null;
      return { ...h, items: [...h.items, ...add.map(o => { const id = o.key.slice(0, -'/picture.jpg'.length).split('/').pop(); return { id: o.key.endsWith('/picture.jpg') && evIdOk(id) ? id : null, gen: 0, key: o.key, bytes: o.size, source_frame_time: null, published_at: null, left_at: at, swept: true }; })] }; }));
    return out({ plan_id, applied: added > 0, result: `added ${added}` });
  }
  if (action === 'release') {
    const why = !s.hold.etag ? 'not held' : guards !== 'pass' ? 'guards: ' + guards : s.unlisted.length ? `${s.unlisted.length} stored picture(s) are not on the list: sweep first` : s.drop.length ? `${s.drop[0].role} picture is ${s.drop[0].why}` : null;
    if (why) return out({ refused: why }, 409);
    if (!apply) return out({ would: 'remove the hold' });
    await env.R2.delete(EARTHVIEW.HOLD);
    return out({ applied: true, result: 'released' });
  }
  return out({ refused: 'unknown action', actions: ['status', 'hold', 'recover', 'sweep', 'release'] }, 404);
}
/** GET /snapshot/earthview/meta and /snapshot/earthview/<frame id>/picture.jpg. A picture is served for any frame still on the held
 * list (current, previous, or inside its grace period), and only if the stored bytes match what was recorded at publication. */
async function evRoute(env, p) {
  const none = (status, reason) => json({ layer: 'earthview', status: 'unavailable', reason }, status, { 'Cache-Control': 'no-store' });
  if (p.length === 3 && p[2] === 'meta') {
    let cur, st; try { cur = await getJson(env, EARTHVIEW.POINTER); st = await getJson(env, EARTHVIEW.STATE); } catch (e) { return none(503, 'unreadable'); }
    const strip = f => f ? { ...f, picture: f.picture && { ...f.picture, key: undefined } } : null;
    return json({ schema: 1, layer: 'earthview', frame: strip(cur && cur.frame), previous: strip(cur && cur.previous), source_check: (st && st.source_check) || null, collection: (st && st.collection) || null,
      limits: { waiting_s: EARTHVIEW.WAITING_LIMIT_S, provisional: true }, cadence_min: EARTHVIEW.EVERY_MIN, source: EARTHVIEW.SOURCE, collecting: env.EARTHVIEW_ENABLED === '1', now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (p.length !== 4 || p[3] !== 'picture.jpg' || !evIdOk(p[2])) return none(404, 'not found');
  let cur, held; try { cur = await getJson(env, EARTHVIEW.POINTER); held = await getJson(env, EARTHVIEW.HELD); } catch (e) { return none(503, 'unreadable'); }
  const fr = cur && [cur.frame, cur.previous].find(f => f && f.id === p[2]);
  const x = fr ? fr.picture : held && (held.items || []).filter(i => i.id === p[2] && !i.deleting && !i.pending).map(i => ({ key: i.key, bytes: i.bytes, sha256: null }))[0];
  if (!x) return none(404, 'not found');
  let buf; try { const o = await env.R2.get(x.key); buf = o ? await o.arrayBuffer() : null; } catch (e) { return none(503, 'unreadable'); }
  if (!buf) return none(503, 'missing');
  const sha = await sha256Bytes(buf);
  if (buf.byteLength !== x.bytes || (x.sha256 ? sha !== x.sha256 : sha.slice(0, 16) !== p[2].split('-')[1])) return none(503, 'integrity');
  return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': EARTHVIEW.CACHE_FILE, 'ETag': '"' + sha + '"', ...CORS } });
}
/* The JPEG decoder carried for Earth from Space: jpeg-js 0.4.4, lib/decoder.js (https://github.com/jpeg-js/jpeg-js), the JpegImage
 * class only, unmodified; the package's own decode() wrapper and its colour conversion are not used. Its licence notice follows. */
const EV_JPEG = (() => {
/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
   Copyright 2011 notmasteryet

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
// - The JFIF specification can be found in the JPEG File Interchange Format
//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
//   in PostScript Level 2, Technical Note #5116
//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

var JpegImage = (function jpegImage() {
  "use strict";
  var dctZigZag = new Int32Array([
     0,
     1,  8,
    16,  9,  2,
     3, 10, 17, 24,
    32, 25, 18, 11, 4,
     5, 12, 19, 26, 33, 40,
    48, 41, 34, 27, 20, 13,  6,
     7, 14, 21, 28, 35, 42, 49, 56,
    57, 50, 43, 36, 29, 22, 15,
    23, 30, 37, 44, 51, 58,
    59, 52, 45, 38, 31,
    39, 46, 53, 60,
    61, 54, 47,
    55, 62,
    63
  ]);

  var dctCos1  =  4017   // cos(pi/16)
  var dctSin1  =   799   // sin(pi/16)
  var dctCos3  =  3406   // cos(3*pi/16)
  var dctSin3  =  2276   // sin(3*pi/16)
  var dctCos6  =  1567   // cos(6*pi/16)
  var dctSin6  =  3784   // sin(6*pi/16)
  var dctSqrt2 =  5793   // sqrt(2)
  var dctSqrt1d2 = 2896  // sqrt(2) / 2

  function constructor() {
  }

  function buildHuffmanTable(codeLengths, values) {
    var k = 0, code = [], i, j, length = 16;
    while (length > 0 && !codeLengths[length - 1])
      length--;
    code.push({children: [], index: 0});
    var p = code[0], q;
    for (i = 0; i < length; i++) {
      for (j = 0; j < codeLengths[i]; j++) {
        p = code.pop();
        p.children[p.index] = values[k];
        while (p.index > 0) {
          if (code.length === 0)
            throw new Error('Could not recreate Huffman Table');
          p = code.pop();
        }
        p.index++;
        code.push(p);
        while (code.length <= i) {
          code.push(q = {children: [], index: 0});
          p.children[p.index] = q.children;
          p = q;
        }
        k++;
      }
      if (i + 1 < length) {
        // p here points to last code
        code.push(q = {children: [], index: 0});
        p.children[p.index] = q.children;
        p = q;
      }
    }
    return code[0].children;
  }

  function decodeScan(data, offset,
                      frame, components, resetInterval,
                      spectralStart, spectralEnd,
                      successivePrev, successive, opts) {
    var precision = frame.precision;
    var samplesPerLine = frame.samplesPerLine;
    var scanLines = frame.scanLines;
    var mcusPerLine = frame.mcusPerLine;
    var progressive = frame.progressive;
    var maxH = frame.maxH, maxV = frame.maxV;

    var startOffset = offset, bitsData = 0, bitsCount = 0;
    function readBit() {
      if (bitsCount > 0) {
        bitsCount--;
        return (bitsData >> bitsCount) & 1;
      }
      bitsData = data[offset++];
      if (bitsData == 0xFF) {
        var nextByte = data[offset++];
        if (nextByte) {
          throw new Error("unexpected marker: " + ((bitsData << 8) | nextByte).toString(16));
        }
        // unstuff 0
      }
      bitsCount = 7;
      return bitsData >>> 7;
    }
    function decodeHuffman(tree) {
      var node = tree, bit;
      while ((bit = readBit()) !== null) {
        node = node[bit];
        if (typeof node === 'number')
          return node;
        if (typeof node !== 'object')
          throw new Error("invalid huffman sequence");
      }
      return null;
    }
    function receive(length) {
      var n = 0;
      while (length > 0) {
        var bit = readBit();
        if (bit === null) return;
        n = (n << 1) | bit;
        length--;
      }
      return n;
    }
    function receiveAndExtend(length) {
      var n = receive(length);
      if (n >= 1 << (length - 1))
        return n;
      return n + (-1 << length) + 1;
    }
    function decodeBaseline(component, zz) {
      var t = decodeHuffman(component.huffmanTableDC);
      var diff = t === 0 ? 0 : receiveAndExtend(t);
      zz[0]= (component.pred += diff);
      var k = 1;
      while (k < 64) {
        var rs = decodeHuffman(component.huffmanTableAC);
        var s = rs & 15, r = rs >> 4;
        if (s === 0) {
          if (r < 15)
            break;
          k += 16;
          continue;
        }
        k += r;
        var z = dctZigZag[k];
        zz[z] = receiveAndExtend(s);
        k++;
      }
    }
    function decodeDCFirst(component, zz) {
      var t = decodeHuffman(component.huffmanTableDC);
      var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
      zz[0] = (component.pred += diff);
    }
    function decodeDCSuccessive(component, zz) {
      zz[0] |= readBit() << successive;
    }
    var eobrun = 0;
    function decodeACFirst(component, zz) {
      if (eobrun > 0) {
        eobrun--;
        return;
      }
      var k = spectralStart, e = spectralEnd;
      while (k <= e) {
        var rs = decodeHuffman(component.huffmanTableAC);
        var s = rs & 15, r = rs >> 4;
        if (s === 0) {
          if (r < 15) {
            eobrun = receive(r) + (1 << r) - 1;
            break;
          }
          k += 16;
          continue;
        }
        k += r;
        var z = dctZigZag[k];
        zz[z] = receiveAndExtend(s) * (1 << successive);
        k++;
      }
    }
    var successiveACState = 0, successiveACNextValue;
    function decodeACSuccessive(component, zz) {
      var k = spectralStart, e = spectralEnd, r = 0;
      while (k <= e) {
        var z = dctZigZag[k];
        var direction = zz[z] < 0 ? -1 : 1;
        switch (successiveACState) {
        case 0: // initial state
          var rs = decodeHuffman(component.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r);
              successiveACState = 4;
            } else {
              r = 16;
              successiveACState = 1;
            }
          } else {
            if (s !== 1)
              throw new Error("invalid ACn encoding");
            successiveACNextValue = receiveAndExtend(s);
            successiveACState = r ? 2 : 3;
          }
          continue;
        case 1: // skipping r zero items
        case 2:
          if (zz[z])
            zz[z] += (readBit() << successive) * direction;
          else {
            r--;
            if (r === 0)
              successiveACState = successiveACState == 2 ? 3 : 0;
          }
          break;
        case 3: // set value for a zero item
          if (zz[z])
            zz[z] += (readBit() << successive) * direction;
          else {
            zz[z] = successiveACNextValue << successive;
            successiveACState = 0;
          }
          break;
        case 4: // eob
          if (zz[z])
            zz[z] += (readBit() << successive) * direction;
          break;
        }
        k++;
      }
      if (successiveACState === 4) {
        eobrun--;
        if (eobrun === 0)
          successiveACState = 0;
      }
    }
    function decodeMcu(component, decode, mcu, row, col) {
      var mcuRow = (mcu / mcusPerLine) | 0;
      var mcuCol = mcu % mcusPerLine;
      var blockRow = mcuRow * component.v + row;
      var blockCol = mcuCol * component.h + col;
      // If the block is missing and we're in tolerant mode, just skip it.
      if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
        return;
      decode(component, component.blocks[blockRow][blockCol]);
    }
    function decodeBlock(component, decode, mcu) {
      var blockRow = (mcu / component.blocksPerLine) | 0;
      var blockCol = mcu % component.blocksPerLine;
      // If the block is missing and we're in tolerant mode, just skip it.
      if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
        return;
      decode(component, component.blocks[blockRow][blockCol]);
    }

    var componentsLength = components.length;
    var component, i, j, k, n;
    var decodeFn;
    if (progressive) {
      if (spectralStart === 0)
        decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
      else
        decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
    } else {
      decodeFn = decodeBaseline;
    }

    var mcu = 0, marker;
    var mcuExpected;
    if (componentsLength == 1) {
      mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
    } else {
      mcuExpected = mcusPerLine * frame.mcusPerColumn;
    }
    if (!resetInterval) resetInterval = mcuExpected;

    var h, v;
    while (mcu < mcuExpected) {
      // reset interval stuff
      for (i = 0; i < componentsLength; i++)
        components[i].pred = 0;
      eobrun = 0;

      if (componentsLength == 1) {
        component = components[0];
        for (n = 0; n < resetInterval; n++) {
          decodeBlock(component, decodeFn, mcu);
          mcu++;
        }
      } else {
        for (n = 0; n < resetInterval; n++) {
          for (i = 0; i < componentsLength; i++) {
            component = components[i];
            h = component.h;
            v = component.v;
            for (j = 0; j < v; j++) {
              for (k = 0; k < h; k++) {
                decodeMcu(component, decodeFn, mcu, j, k);
              }
            }
          }
          mcu++;

          // If we've reached our expected MCU's, stop decoding
          if (mcu === mcuExpected) break;
        }
      }

      if (mcu === mcuExpected) {
        // Skip trailing bytes at the end of the scan - until we reach the next marker
        do {
          if (data[offset] === 0xFF) {
            if (data[offset + 1] !== 0x00) {
              break;
            }
          }
          offset += 1;
        } while (offset < data.length - 2);
      }

      // find marker
      bitsCount = 0;
      marker = (data[offset] << 8) | data[offset + 1];
      if (marker < 0xFF00) {
        throw new Error("marker was not found");
      }

      if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
        offset += 2;
      }
      else
        break;
    }

    return offset - startOffset;
  }

  function buildComponentData(frame, component) {
    var lines = [];
    var blocksPerLine = component.blocksPerLine;
    var blocksPerColumn = component.blocksPerColumn;
    var samplesPerLine = blocksPerLine << 3;
    // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
    var R = new Int32Array(64), r = new Uint8Array(64);

    // A port of poppler's IDCT method which in turn is taken from:
    //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
    //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
    //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
    //   988-991.
    function quantizeAndInverse(zz, dataOut, dataIn) {
      var qt = component.quantizationTable;
      var v0, v1, v2, v3, v4, v5, v6, v7, t;
      var p = dataIn;
      var i;

      // dequant
      for (i = 0; i < 64; i++)
        p[i] = zz[i] * qt[i];

      // inverse DCT on rows
      for (i = 0; i < 8; ++i) {
        var row = 8 * i;

        // check for all-zero AC coefficients
        if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
            p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
            p[7 + row] == 0) {
          t = (dctSqrt2 * p[0 + row] + 512) >> 10;
          p[0 + row] = t;
          p[1 + row] = t;
          p[2 + row] = t;
          p[3 + row] = t;
          p[4 + row] = t;
          p[5 + row] = t;
          p[6 + row] = t;
          p[7 + row] = t;
          continue;
        }

        // stage 4
        v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
        v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
        v2 = p[2 + row];
        v3 = p[6 + row];
        v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
        v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
        v5 = p[3 + row] << 4;
        v6 = p[5 + row] << 4;

        // stage 3
        t = (v0 - v1+ 1) >> 1;
        v0 = (v0 + v1 + 1) >> 1;
        v1 = t;
        t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
        v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
        v3 = t;
        t = (v4 - v6 + 1) >> 1;
        v4 = (v4 + v6 + 1) >> 1;
        v6 = t;
        t = (v7 + v5 + 1) >> 1;
        v5 = (v7 - v5 + 1) >> 1;
        v7 = t;

        // stage 2
        t = (v0 - v3 + 1) >> 1;
        v0 = (v0 + v3 + 1) >> 1;
        v3 = t;
        t = (v1 - v2 + 1) >> 1;
        v1 = (v1 + v2 + 1) >> 1;
        v2 = t;
        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
        v7 = t;
        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
        v6 = t;

        // stage 1
        p[0 + row] = v0 + v7;
        p[7 + row] = v0 - v7;
        p[1 + row] = v1 + v6;
        p[6 + row] = v1 - v6;
        p[2 + row] = v2 + v5;
        p[5 + row] = v2 - v5;
        p[3 + row] = v3 + v4;
        p[4 + row] = v3 - v4;
      }

      // inverse DCT on columns
      for (i = 0; i < 8; ++i) {
        var col = i;

        // check for all-zero AC coefficients
        if (p[1*8 + col] == 0 && p[2*8 + col] == 0 && p[3*8 + col] == 0 &&
            p[4*8 + col] == 0 && p[5*8 + col] == 0 && p[6*8 + col] == 0 &&
            p[7*8 + col] == 0) {
          t = (dctSqrt2 * dataIn[i+0] + 8192) >> 14;
          p[0*8 + col] = t;
          p[1*8 + col] = t;
          p[2*8 + col] = t;
          p[3*8 + col] = t;
          p[4*8 + col] = t;
          p[5*8 + col] = t;
          p[6*8 + col] = t;
          p[7*8 + col] = t;
          continue;
        }

        // stage 4
        v0 = (dctSqrt2 * p[0*8 + col] + 2048) >> 12;
        v1 = (dctSqrt2 * p[4*8 + col] + 2048) >> 12;
        v2 = p[2*8 + col];
        v3 = p[6*8 + col];
        v4 = (dctSqrt1d2 * (p[1*8 + col] - p[7*8 + col]) + 2048) >> 12;
        v7 = (dctSqrt1d2 * (p[1*8 + col] + p[7*8 + col]) + 2048) >> 12;
        v5 = p[3*8 + col];
        v6 = p[5*8 + col];

        // stage 3
        t = (v0 - v1 + 1) >> 1;
        v0 = (v0 + v1 + 1) >> 1;
        v1 = t;
        t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
        v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
        v3 = t;
        t = (v4 - v6 + 1) >> 1;
        v4 = (v4 + v6 + 1) >> 1;
        v6 = t;
        t = (v7 + v5 + 1) >> 1;
        v5 = (v7 - v5 + 1) >> 1;
        v7 = t;

        // stage 2
        t = (v0 - v3 + 1) >> 1;
        v0 = (v0 + v3 + 1) >> 1;
        v3 = t;
        t = (v1 - v2 + 1) >> 1;
        v1 = (v1 + v2 + 1) >> 1;
        v2 = t;
        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
        v7 = t;
        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
        v6 = t;

        // stage 1
        p[0*8 + col] = v0 + v7;
        p[7*8 + col] = v0 - v7;
        p[1*8 + col] = v1 + v6;
        p[6*8 + col] = v1 - v6;
        p[2*8 + col] = v2 + v5;
        p[5*8 + col] = v2 - v5;
        p[3*8 + col] = v3 + v4;
        p[4*8 + col] = v3 - v4;
      }

      // convert to 8-bit integers
      for (i = 0; i < 64; ++i) {
        var sample = 128 + ((p[i] + 8) >> 4);
        dataOut[i] = sample < 0 ? 0 : sample > 0xFF ? 0xFF : sample;
      }
    }

    requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);

    var i, j;
    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
      var scanLine = blockRow << 3;
      for (i = 0; i < 8; i++)
        lines.push(new Uint8Array(samplesPerLine));
      for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
        quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);

        var offset = 0, sample = blockCol << 3;
        for (j = 0; j < 8; j++) {
          var line = lines[scanLine + j];
          for (i = 0; i < 8; i++)
            line[sample + i] = r[offset++];
        }
      }
    }
    return lines;
  }

  function clampTo8bit(a) {
    return a < 0 ? 0 : a > 255 ? 255 : a;
  }

  constructor.prototype = {
    load: function load(path) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", path, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = (function() {
        // TODO catch parse error
        var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
        this.parse(data);
        if (this.onload)
          this.onload();
      }).bind(this);
      xhr.send(null);
    },
    parse: function parse(data) {
      var maxResolutionInPixels = this.opts.maxResolutionInMP * 1000 * 1000;
      var offset = 0, length = data.length;
      function readUint16() {
        var value = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        return value;
      }
      function readDataBlock() {
        var length = readUint16();
        var array = data.subarray(offset, offset + length - 2);
        offset += array.length;
        return array;
      }
      function prepareComponents(frame) {
        // According to the JPEG standard, the sampling factor must be between 1 and 4
        // See https://github.com/libjpeg-turbo/libjpeg-turbo/blob/9abeff46d87bd201a952e276f3e4339556a403a3/libjpeg.txt#L1138-L1146
        var maxH = 1, maxV = 1;
        var component, componentId;
        for (componentId in frame.components) {
          if (frame.components.hasOwnProperty(componentId)) {
            component = frame.components[componentId];
            if (maxH < component.h) maxH = component.h;
            if (maxV < component.v) maxV = component.v;
          }
        }
        var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
        var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
        for (componentId in frame.components) {
          if (frame.components.hasOwnProperty(componentId)) {
            component = frame.components[componentId];
            var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
            var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines  / 8) * component.v / maxV);
            var blocksPerLineForMcu = mcusPerLine * component.h;
            var blocksPerColumnForMcu = mcusPerColumn * component.v;
            var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
            var blocks = [];

            // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
            requestMemoryAllocation(blocksToAllocate * 256);

            for (var i = 0; i < blocksPerColumnForMcu; i++) {
              var row = [];
              for (var j = 0; j < blocksPerLineForMcu; j++)
                row.push(new Int32Array(64));
              blocks.push(row);
            }
            component.blocksPerLine = blocksPerLine;
            component.blocksPerColumn = blocksPerColumn;
            component.blocks = blocks;
          }
        }
        frame.maxH = maxH;
        frame.maxV = maxV;
        frame.mcusPerLine = mcusPerLine;
        frame.mcusPerColumn = mcusPerColumn;
      }
      var jfif = null;
      var adobe = null;
      var pixels = null;
      var frame, resetInterval;
      var quantizationTables = [], frames = [];
      var huffmanTablesAC = [], huffmanTablesDC = [];
      var fileMarker = readUint16();
      var malformedDataOffset = -1;
      this.comments = [];
      if (fileMarker != 0xFFD8) { // SOI (Start of Image)
        throw new Error("SOI not found");
      }

      fileMarker = readUint16();
      while (fileMarker != 0xFFD9) { // EOI (End of image)
        var i, j, l;
        switch(fileMarker) {
          case 0xFF00: break;
          case 0xFFE0: // APP0 (Application Specific)
          case 0xFFE1: // APP1
          case 0xFFE2: // APP2
          case 0xFFE3: // APP3
          case 0xFFE4: // APP4
          case 0xFFE5: // APP5
          case 0xFFE6: // APP6
          case 0xFFE7: // APP7
          case 0xFFE8: // APP8
          case 0xFFE9: // APP9
          case 0xFFEA: // APP10
          case 0xFFEB: // APP11
          case 0xFFEC: // APP12
          case 0xFFED: // APP13
          case 0xFFEE: // APP14
          case 0xFFEF: // APP15
          case 0xFFFE: // COM (Comment)
            var appData = readDataBlock();

            if (fileMarker === 0xFFFE) {
              var comment = String.fromCharCode.apply(null, appData);
              this.comments.push(comment);
            }

            if (fileMarker === 0xFFE0) {
              if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                jfif = {
                  version: { major: appData[5], minor: appData[6] },
                  densityUnits: appData[7],
                  xDensity: (appData[8] << 8) | appData[9],
                  yDensity: (appData[10] << 8) | appData[11],
                  thumbWidth: appData[12],
                  thumbHeight: appData[13],
                  thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                };
              }
            }
            // TODO APP1 - Exif
            if (fileMarker === 0xFFE1) {
              if (appData[0] === 0x45 &&
                appData[1] === 0x78 &&
                appData[2] === 0x69 &&
                appData[3] === 0x66 &&
                appData[4] === 0) { // 'EXIF\x00'
                this.exifBuffer = appData.subarray(5, appData.length);
              }
            }

            if (fileMarker === 0xFFEE) {
              if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                adobe = {
                  version: appData[6],
                  flags0: (appData[7] << 8) | appData[8],
                  flags1: (appData[9] << 8) | appData[10],
                  transformCode: appData[11]
                };
              }
            }
            break;

          case 0xFFDB: // DQT (Define Quantization Tables)
            var quantizationTablesLength = readUint16();
            var quantizationTablesEnd = quantizationTablesLength + offset - 2;
            while (offset < quantizationTablesEnd) {
              var quantizationTableSpec = data[offset++];
              requestMemoryAllocation(64 * 4);
              var tableData = new Int32Array(64);
              if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                for (j = 0; j < 64; j++) {
                  var z = dctZigZag[j];
                  tableData[z] = data[offset++];
                }
              } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                for (j = 0; j < 64; j++) {
                  var z = dctZigZag[j];
                  tableData[z] = readUint16();
                }
              } else
                throw new Error("DQT: invalid table spec");
              quantizationTables[quantizationTableSpec & 15] = tableData;
            }
            break;

          case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
          case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
          case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
            readUint16(); // skip data length
            frame = {};
            frame.extended = (fileMarker === 0xFFC1);
            frame.progressive = (fileMarker === 0xFFC2);
            frame.precision = data[offset++];
            frame.scanLines = readUint16();
            frame.samplesPerLine = readUint16();
            frame.components = {};
            frame.componentsOrder = [];

            var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
            if (pixelsInFrame > maxResolutionInPixels) {
              var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
              throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
            }

            var componentsCount = data[offset++], componentId;
            var maxH = 0, maxV = 0;
            for (i = 0; i < componentsCount; i++) {
              componentId = data[offset];
              var h = data[offset + 1] >> 4;
              var v = data[offset + 1] & 15;
              var qId = data[offset + 2];

              if ( h <= 0 || v <= 0 ) {
                throw new Error('Invalid sampling factor, expected values above 0');
              }

              frame.componentsOrder.push(componentId);
              frame.components[componentId] = {
                h: h,
                v: v,
                quantizationIdx: qId
              };
              offset += 3;
            }
            prepareComponents(frame);
            frames.push(frame);
            break;

          case 0xFFC4: // DHT (Define Huffman Tables)
            var huffmanLength = readUint16();
            for (i = 2; i < huffmanLength;) {
              var huffmanTableSpec = data[offset++];
              var codeLengths = new Uint8Array(16);
              var codeLengthSum = 0;
              for (j = 0; j < 16; j++, offset++) {
                codeLengthSum += (codeLengths[j] = data[offset]);
              }
              requestMemoryAllocation(16 + codeLengthSum);
              var huffmanValues = new Uint8Array(codeLengthSum);
              for (j = 0; j < codeLengthSum; j++, offset++)
                huffmanValues[j] = data[offset];
              i += 17 + codeLengthSum;

              ((huffmanTableSpec >> 4) === 0 ?
                huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
                buildHuffmanTable(codeLengths, huffmanValues);
            }
            break;

          case 0xFFDD: // DRI (Define Restart Interval)
            readUint16(); // skip data length
            resetInterval = readUint16();
            break;

          case 0xFFDC: // Number of Lines marker
            readUint16() // skip data length
            readUint16() // Ignore this data since it represents the image height
            break;
            
          case 0xFFDA: // SOS (Start of Scan)
            var scanLength = readUint16();
            var selectorsCount = data[offset++];
            var components = [], component;
            for (i = 0; i < selectorsCount; i++) {
              component = frame.components[data[offset++]];
              var tableSpec = data[offset++];
              component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
              component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
              components.push(component);
            }
            var spectralStart = data[offset++];
            var spectralEnd = data[offset++];
            var successiveApproximation = data[offset++];
            var processed = decodeScan(data, offset,
              frame, components, resetInterval,
              spectralStart, spectralEnd,
              successiveApproximation >> 4, successiveApproximation & 15, this.opts);
            offset += processed;
            break;

          case 0xFFFF: // Fill bytes
            if (data[offset] !== 0xFF) { // Avoid skipping a valid marker.
              offset--;
            }
            break;
          default:
            if (data[offset - 3] == 0xFF &&
                data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
              // could be incorrect encoding -- last 0xFF byte of the previous
              // block was eaten by the encoder
              offset -= 3;
              break;
            }
            else if (fileMarker === 0xE0 || fileMarker == 0xE1) {
              // Recover from malformed APP1 markers popular in some phone models.
              // See https://github.com/eugeneware/jpeg-js/issues/82
              if (malformedDataOffset !== -1) {
                throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
              }
              malformedDataOffset = offset - 1;
              const nextOffset = readUint16();
              if (data[offset + nextOffset - 2] === 0xFF) {
                offset += nextOffset - 2;
                break;
              }
            }
            throw new Error("unknown JPEG marker " + fileMarker.toString(16));
        }
        fileMarker = readUint16();
      }
      if (frames.length != 1)
        throw new Error("only single frame JPEGs supported");

      // set each frame's components quantization table
      for (var i = 0; i < frames.length; i++) {
        var cp = frames[i].components;
        for (var j in cp) {
          cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
          delete cp[j].quantizationIdx;
        }
      }

      this.width = frame.samplesPerLine;
      this.height = frame.scanLines;
      this.jfif = jfif;
      this.adobe = adobe;
      this.components = [];
      for (var i = 0; i < frame.componentsOrder.length; i++) {
        var component = frame.components[frame.componentsOrder[i]];
        this.components.push({
          lines: buildComponentData(frame, component),
          scaleX: component.h / frame.maxH,
          scaleY: component.v / frame.maxV
        });
      }
    },
    getData: function getData(width, height) {
      var scaleX = this.width / width, scaleY = this.height / height;

      var component1, component2, component3, component4;
      var component1Line, component2Line, component3Line, component4Line;
      var x, y;
      var offset = 0;
      var Y, Cb, Cr, K, C, M, Ye, R, G, B;
      var colorTransform;
      var dataLength = width * height * this.components.length;
      requestMemoryAllocation(dataLength);
      var data = new Uint8Array(dataLength);
      switch (this.components.length) {
        case 1:
          component1 = this.components[0];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];

              data[offset++] = Y;
            }
          }
          break;
        case 2:
          // PDF might compress two component data in custom colorspace
          component1 = this.components[0];
          component2 = this.components[1];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];
              data[offset++] = Y;
              Y = component2Line[0 | (x * component2.scaleX * scaleX)];
              data[offset++] = Y;
            }
          }
          break;
        case 3:
          // The default transform for three components is true
          colorTransform = true;
          // The adobe transform marker overrides any previous setting
          if (this.adobe && this.adobe.transformCode)
            colorTransform = true;
          else if (typeof this.opts.colorTransform !== 'undefined')
            colorTransform = !!this.opts.colorTransform;

          component1 = this.components[0];
          component2 = this.components[1];
          component3 = this.components[2];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              if (!colorTransform) {
                R = component1Line[0 | (x * component1.scaleX * scaleX)];
                G = component2Line[0 | (x * component2.scaleX * scaleX)];
                B = component3Line[0 | (x * component3.scaleX * scaleX)];
              } else {
                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

                R = clampTo8bit(Y + 1.402 * (Cr - 128));
                G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                B = clampTo8bit(Y + 1.772 * (Cb - 128));
              }

              data[offset++] = R;
              data[offset++] = G;
              data[offset++] = B;
            }
          }
          break;
        case 4:
          if (!this.adobe)
            throw new Error('Unsupported color mode (4 components)');
          // The default transform for four components is false
          colorTransform = false;
          // The adobe transform marker overrides any previous setting
          if (this.adobe && this.adobe.transformCode)
            colorTransform = true;
          else if (typeof this.opts.colorTransform !== 'undefined')
            colorTransform = !!this.opts.colorTransform;

          component1 = this.components[0];
          component2 = this.components[1];
          component3 = this.components[2];
          component4 = this.components[3];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
            component4Line = component4.lines[0 | (y * component4.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              if (!colorTransform) {
                C = component1Line[0 | (x * component1.scaleX * scaleX)];
                M = component2Line[0 | (x * component2.scaleX * scaleX)];
                Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
                K = component4Line[0 | (x * component4.scaleX * scaleX)];
              } else {
                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
                K = component4Line[0 | (x * component4.scaleX * scaleX)];

                C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
              }
              data[offset++] = 255-C;
              data[offset++] = 255-M;
              data[offset++] = 255-Ye;
              data[offset++] = 255-K;
            }
          }
          break;
        default:
          throw new Error('Unsupported color mode');
      }
      return data;
    },
    copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
      var width = imageData.width, height = imageData.height;
      var imageDataArray = imageData.data;
      var data = this.getData(width, height);
      var i = 0, j = 0, x, y;
      var Y, K, C, M, R, G, B;
      switch (this.components.length) {
        case 1:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              Y = data[i++];

              imageDataArray[j++] = Y;
              imageDataArray[j++] = Y;
              imageDataArray[j++] = Y;
              if (formatAsRGBA) {
                imageDataArray[j++] = 255;
              }
            }
          }
          break;
        case 3:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              R = data[i++];
              G = data[i++];
              B = data[i++];

              imageDataArray[j++] = R;
              imageDataArray[j++] = G;
              imageDataArray[j++] = B;
              if (formatAsRGBA) {
                imageDataArray[j++] = 255;
              }
            }
          }
          break;
        case 4:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              C = data[i++];
              M = data[i++];
              Y = data[i++];
              K = data[i++];

              R = 255 - clampTo8bit(C * (1 - K / 255) + K);
              G = 255 - clampTo8bit(M * (1 - K / 255) + K);
              B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

              imageDataArray[j++] = R;
              imageDataArray[j++] = G;
              imageDataArray[j++] = B;
              if (formatAsRGBA) {
                imageDataArray[j++] = 255;
              }
            }
          }
          break;
        default:
          throw new Error('Unsupported color mode');
      }
    }
  };


  // We cap the amount of memory used by jpeg-js to avoid unexpected OOMs from untrusted content.
  var totalBytesAllocated = 0;
  var maxMemoryUsageBytes = 0;
  function requestMemoryAllocation(increaseAmount = 0) {
    var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
    if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
      var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
      throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
    }

    totalBytesAllocated = totalMemoryImpactBytes;
  }

  constructor.resetMaxMemoryUsage = function (maxMemoryUsageBytes_) {
    totalBytesAllocated = 0;
    maxMemoryUsageBytes = maxMemoryUsageBytes_;
  };

  constructor.getBytesAllocated = function () {
    return totalBytesAllocated;
  };

  constructor.requestMemoryAllocation = requestMemoryAllocation;

  return constructor;
})();
return JpegImage;
})();

/* ---------- Wind by height (NOAA/NCEP GFS, 0.25 degree, analysis hour f000) — 0.6.16, GLOBAL-WIND-BUILD-PROPOSAL rev 2 (§11 governs)
 * Each scheduled hour the hub looks for the newest GFS run whose f000 index exists on NOAA's open-data mirror. If that run is newer
 * than the published one it fetches six messages by byte range (u and v at 10 m above ground, 250 hPa and 10 hPa), from ONE host,
 * refusing every response before its body is read unless it is 206 with the exact range, length and the object's ETag. Each message
 * is decoded by the narrow decoder below, one field at a time, and sampled at whole degrees into three 360 x 181 grids
 * (two little-endian int16 per cell: u east, v north, 0.1 m/s). Any refusal is a named failure; nothing is repaired or guessed.
 * Publication: each grid is stored once under a key that IS its SHA-256 (create-only), read back and hashed; only then does the
 * manifest (wind/current.json, holding current AND previous) move, by a conditional write. A lost conditional write is re-read and
 * the run advances only if it is still newer. An older run that finishes late never replaces a newer one. Nothing is deleted.
 * Status on the manifest is ordered too (GPT's stage 2 review): last_attempt is a failure note, kept only while it is about something
 * newer than what is published and never replaced by a run that started earlier; `seen` records when a run's index was first found
 * and is kept apart from it, so clearing a failure never loses that time.
 * Gate: WIND_ENABLED=1 for the SCHEDULED path (absent = zero NOAA requests, nothing written). /admin/run/wind (admin key) runs the
 * collector once whatever the flag says. Outside LAYERS, cells, history, health and the generic writeDown.
 * Terms (read 16 Nov 2026, Registry of Open Data on AWS, noaa-gfs-bdp-pds): open to the public; attribution requested; no implied
 * endorsement; modified data must not be presented as original, unaltered NOAA data. These grids are modified and say so. */
// >>> gribwind.mjs — copied from phase1/gribwind.mjs with the word "export" removed; the wind-hub suite checks the two match
const GRIBWIND = (() => {
// Candidate narrow GRIB2 decoder for the six GFS wind messages (gate test, 16 Nov 2026).
// Supports ONLY: edition 2, one field per message, grid template 3.0 (regular lat/lon), scanning mode 0,
// Earth-relative components, product template 4.0, data template 5.3 (complex packing, spatial differencing order 2),
// no bitmap, no missing-value management, floating-point original values. Anything else throws GribRefused.
// Rev 2 (16 Nov, GPT's review): the grid must be exactly the expected global grid; sizes and group counts are bounded
// before anything is allocated; non-finite packing numbers and non-finite or implausible output are refused;
// decodeWindBatch() requires exactly the six expected fields from one run.
class GribRefused extends Error { constructor(m) { super(m); this.name = 'GribRefused'; } }
const no = (m) => { throw new GribRefused(m); };
const u8 = (b, o) => b[o];
const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const u32 = (b, o) => ((b[o] * 16777216) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]);
const sm = (v, bits) => { const s = 2 ** (bits - 1); return v >= s ? -(v - s) : v; };   // sign-and-magnitude
const s16 = (b, o) => sm(u16(b, o), 16);
const s32 = (b, o) => sm(u32(b, o), 32);
const f32 = (b, o) => new DataView(b.buffer, b.byteOffset + o, 4).getFloat32(0, false);

const GFS_0P25 = { ni: 1440, nj: 721, la1: 90, lo1: 0, la2: -90, lo2: 359.75, di: 0.25, dj: 0.25 };
const MAX_ABS_MS = 500;   // no wind component on Earth approaches this; a larger value means corrupt input

function decode(msg, grid = GFS_0P25, maxAbs = MAX_ABS_MS) {
  if (!(msg instanceof Uint8Array)) no('input is not bytes');
  if (msg.length < 16 + 21 + 4) no('too short for a GRIB2 message');
  if (!(msg[0] === 71 && msg[1] === 82 && msg[2] === 73 && msg[3] === 66)) no('does not start with GRIB');
  if (msg[7] !== 2) no('edition ' + msg[7] + ' not supported');
  const hi = u32(msg, 8), total = u32(msg, 12);
  if (hi !== 0) no('message length over 4 GB');
  if (total !== msg.length) no(`declared length ${total} but ${msg.length} bytes given`);
  if (!(msg[total - 4] === 55 && msg[total - 3] === 55 && msg[total - 2] === 55 && msg[total - 1] === 55)) no('does not end with 7777');
  const discipline = msg[6];
  const sec = {}; let o = 16;
  while (o < total - 4) {
    if (o + 5 > total - 4) no('section header runs past the end');
    const len = u32(msg, o), num = msg[o + 4];
    if (len < 5 || o + len > total - 4) no(`section ${num} length ${len} runs past the end`);
    if (num < 1 || num > 7) no('unknown section ' + num);
    if (num === 2) { o += len; continue; }               // local use: ignored
    if (sec[num]) no(`section ${num} appears twice (more than one field in the message)`);
    sec[num] = msg.subarray(o, o + len); o += len;
  }
  if (o !== total - 4) no('sections do not fill the message');
  for (const n of [1, 3, 4, 5, 6, 7]) if (!sec[n]) no('section ' + n + ' missing');
  const s1 = sec[1], s3 = sec[3], s4 = sec[4], s5 = sec[5], s6 = sec[6], s7 = sec[7];
  // Section 1: reference time
  if (s1.length < 21) no('section 1 too short');
  const ref = { significance: s1[11], year: u16(s1, 12), month: s1[14], day: s1[15], hour: s1[16], minute: s1[17], second: s1[18] };
  // Section 3: grid
  if (s3.length < 72) no('section 3 too short');
  if (s3[5] !== 0) no('grid definition source ' + s3[5]);
  if (s3[10] !== 0) no('quasi-regular grid not supported');
  if (u16(s3, 12) !== 0) no('grid template 3.' + u16(s3, 12) + ' not supported');
  const npts = u32(s3, 6), ni = u32(s3, 30), nj = u32(s3, 34);
  const basic = u32(s3, 38), sub = u32(s3, 42);
  if (!((basic === 0) && (sub === 0 || sub === 0xFFFFFFFF))) no('non-standard basic angle');
  const la1 = s32(s3, 46) / 1e6, lo1 = u32(s3, 50) / 1e6, flags = s3[54], la2 = s32(s3, 55) / 1e6, lo2 = u32(s3, 59) / 1e6;
  const di = u32(s3, 63) / 1e6, dj = u32(s3, 67) / 1e6, scan = s3[71];
  if (scan !== 0) no('scanning mode ' + scan + ' not supported (only 0: west to east, north to south, rows)');
  if (flags & 0x08) no('wind components are grid-relative, not Earth-relative');
  if ((flags & 0x30) !== 0x30) no('direction increments not given');
  for (const [k, v] of Object.entries({ ni, nj, la1, lo1, la2, lo2, di, dj })) if (v !== grid[k]) no(`grid ${k} is ${v}, expected ${grid[k]}`);
  if (npts !== grid.ni * grid.nj) no('number of grid points is ' + npts + ', expected ' + grid.ni * grid.nj);
  // Section 4: product
  if (s4.length < 34) no('section 4 too short');
  if (u16(s4, 5) !== 0) no('hybrid coordinate list present');
  if (u16(s4, 7) !== 0) no('product template 4.' + u16(s4, 7) + ' not supported');
  const prod = { discipline, category: s4[9], number: s4[10], process: s4[11], timeUnit: s4[17], forecastTime: u32(s4, 18),
    surfaceType: s4[22], surfaceScale: s4[23], surfaceValue: u32(s4, 24), surface2Type: s4[28] };
  // Section 5: packing
  if (s5.length < 49) no('section 5 too short for template 5.3');
  const nvals = u32(s5, 5), drt = u16(s5, 9);
  if (drt !== 3) no('data template 5.' + drt + ' not supported (only 5.3)');
  if (nvals !== npts) no('number of packed values differs from grid points');
  const R = f32(s5, 11), E = s16(s5, 15), D = s16(s5, 17), nbits = s5[19], origType = s5[20], split = s5[21], miss = s5[22];
  if (!Number.isFinite(R)) no('packing reference value is not a finite number');
  if (Math.abs(E) > 30) no('binary scale factor ' + E + ' out of range');
  if (D < 0 || D > 6) no('decimal scale factor ' + D + ' out of range');
  if (origType !== 0) no('original field type ' + origType + ' not supported');
  if (split !== 1) no('group splitting method ' + split + ' not supported');
  if (miss !== 0) no('missing-value management ' + miss + ' not supported');
  const NG = u32(s5, 31), refW = s5[35], bitsW = s5[36], refL = u32(s5, 37), incL = s5[41], lastL = u32(s5, 42), bitsL = s5[46], order = s5[47], nOct = s5[48];
  if (order !== 2) no('spatial differencing order ' + order + ' not supported (only 2)');
  if (nOct < 1 || nOct > 4) no('extra descriptor size ' + nOct);
  if (nbits > 32 || bitsW > 32 || bitsL > 32) no('field width over 32 bits');
  if (NG < 1 || NG > npts) no('group count out of range');
  if (lastL < 1 || lastL > npts || incL < 1) no('group length fields out of range');
  // every group needs its reference, width and length fields inside section 7: checked before any array is made
  if (5 + 3 * nOct + Math.ceil(NG * nbits / 8) + Math.ceil(NG * bitsW / 8) + Math.ceil(NG * bitsL / 8) > s7.length) no('group count does not fit in the data section');
  // Section 6: bitmap
  if (s6.length < 6) no('section 6 too short');
  if (s6[5] !== 255) no('bitmap indicator ' + s6[5] + ' not supported (only 255: none)');
  // Section 7: data
  const d = s7, dl = d.length; let p = 5;
  const need = (n) => { if (p + n > dl) no('data section ends early'); };
  const rdS = () => { need(nOct); let v = 0; for (let i = 0; i < nOct; i++) v = v * 256 + d[p + i]; p += nOct; return sm(v, 8 * nOct); };
  const ival1 = rdS(), ival2 = rdS(), minsd = rdS();
  let bit = p * 8; const endBit = dl * 8;
  const rd = (n) => {                                   // read n bits (0..32), big-endian
    if (n === 0) return 0;
    if (bit + n > endBit) no('data section ends early');
    let v = 0, left = n;
    while (left > 0) {
      const byte = d[bit >> 3], off = bit & 7, take = Math.min(8 - off, left);
      v = v * (1 << take) + ((byte >> (8 - off - take)) & ((1 << take) - 1));
      bit += take; left -= take;
    }
    return v;
  };
  const align = () => { bit = (bit + 7) & ~7; };
  const gref = new Int32Array(NG), gwid = new Uint8Array(NG), glen = new Int32Array(NG);
  for (let g = 0; g < NG; g++) gref[g] = rd(nbits); align();
  for (let g = 0; g < NG; g++) { const w = refW + rd(bitsW); if (w > 32) no('group width over 32'); gwid[g] = w; } align();
  let sum = 0;
  for (let g = 0; g < NG; g++) { const L = refL + rd(bitsL) * incL; glen[g] = L; sum += L; } align();
  sum += lastL - glen[NG - 1]; glen[NG - 1] = lastL;
  if (sum !== nvals) no(`group lengths add to ${sum}, expected ${nvals}`);
  const x = new Float64Array(nvals); let k = 0;
  for (let g = 0; g < NG; g++) {
    const w = gwid[g], L = glen[g], r = gref[g];
    if (w === 0) { for (let i = 0; i < L; i++) x[k++] = r; }
    else { if (bit + w * L > endBit) no('data section ends early'); for (let i = 0; i < L; i++) x[k++] = r + rd(w); }
  }
  if (k !== nvals) no('value count mismatch');
  if (endBit - bit >= 8 * 2) no('unread bytes at the end of the data section');
  // undo second-order differencing
  x[0] = ival1; x[1] = ival2;
  for (let n = 2; n < nvals; n++) x[n] = x[n] + minsd + 2 * x[n - 1] - x[n - 2];
  const be = 2 ** E, dd = 10 ** (-D), out = new Float64Array(nvals);
  for (let n = 0; n < nvals; n++) {
    const v = (R + x[n] * be) * dd;
    if (!(Math.abs(v) <= maxAbs)) no(Number.isFinite(v) ? `decoded value ${v} at point ${n} is beyond ${maxAbs}` : `decoded value at point ${n} is not a finite number`);
    out[n] = v;
  }
  return { ref, prod, grid: { ni, nj, la1, lo1, la2, lo2, di, dj, scan, flags }, packing: { template: 3, order, R, E, D, nbits, NG }, values: out };
}

// The six fields the wind layer needs, in order. surfaceType 103 = height above ground (m), 100 = isobaric (Pa).
const WIND_FIELDS = [
  { key: 'u10m', number: 2, surfaceType: 103, surfaceValue: 10 }, { key: 'v10m', number: 3, surfaceType: 103, surfaceValue: 10 },
  { key: 'u250', number: 2, surfaceType: 100, surfaceValue: 25000 }, { key: 'v250', number: 3, surfaceType: 100, surfaceValue: 25000 },
  { key: 'u10', number: 2, surfaceType: 100, surfaceValue: 1000 }, { key: 'v10', number: 3, surfaceType: 100, surfaceValue: 1000 },
];
// Checks one decoded message is the wanted field of the wanted run. cycle = { year, month, day, hour } (UTC).
function checkField(r, want, cycle) {
  const p = r.prod, t = r.ref;
  if (p.discipline !== 0 || p.category !== 2 || p.number !== want.number) no(`${want.key}: parameter is ${p.discipline}.${p.category}.${p.number}`);
  if (p.surfaceType !== want.surfaceType || p.surfaceScale !== 0 || p.surfaceValue !== want.surfaceValue || p.surface2Type !== 255) no(`${want.key}: level is type ${p.surfaceType} value ${p.surfaceValue}`);
  if (p.forecastTime !== 0) no(`${want.key}: forecast time ${p.forecastTime}, expected 0`);
  if (t.significance !== 1) no(`${want.key}: reference time significance ${t.significance}`);
  if (t.year !== cycle.year || t.month !== cycle.month || t.day !== cycle.day || t.hour !== cycle.hour || t.minute !== 0 || t.second !== 0) no(`${want.key}: run is ${t.year}-${t.month}-${t.day} ${t.hour}:${t.minute}, expected ${cycle.year}-${cycle.month}-${cycle.day} ${cycle.hour}:00`);
}
// Exactly six messages, in WIND_FIELDS order, all from one run. Calls use(i, decoded) for each, one at a time, so the
// caller can keep only what it needs. Refuses the whole batch on any failure.
function decodeWindBatch(msgs, cycle, use) {
  if (!Array.isArray(msgs) || msgs.length !== WIND_FIELDS.length) no(`batch has ${Array.isArray(msgs) ? msgs.length : 'no'} messages, expected ${WIND_FIELDS.length}`);
  for (let i = 0; i < WIND_FIELDS.length; i++) { const r = decode(msgs[i]); checkField(r, WIND_FIELDS[i], cycle); use(i, r); }
}
return { decode, checkField, decodeWindBatch, GribRefused, WIND_FIELDS, GFS_0P25, MAX_ABS_MS };
})();
// <<< gribwind.mjs
const WIND = {
  HOST: 'https://noaa-gfs-bdp-pds.s3.amazonaws.com/', LOOKBACK_RUNS: 4, TIMEOUT_MS: 30000, MAX_IDX: 200 * 1024, MAX_MSG: 3 * 1024 * 1024,
  POINTER: 'wind/current.json', GRIDS: 'wind/grids/', W: 360, H: 181, STEP: 4, MISSING: -32768, GRID_BYTES: 360 * 181 * 4,
  CACHE_FILE: 'public, max-age=86400, immutable',
  IDX: [['UGRD', '10 m above ground'], ['VGRD', '10 m above ground'], ['UGRD', '250 mb'], ['VGRD', '250 mb'], ['UGRD', '10 mb'], ['VGRD', '10 mb']],
  LEVELS: [{ id: 'near-ground', gfs_level: '10 m above ground' }, { id: '250hPa', gfs_level: '250 hPa' }, { id: '10hPa', gfs_level: '10 hPa' }],
  SOURCE: { model: 'NOAA/NCEP Global Forecast System (GFS)', product: '0.25 degree pressure GRIB2, analysis hour f000', credit: 'NOAA/NCEP GFS',
    mirror: 'NOAA Open Data Dissemination (NODD) on AWS, bucket noaa-gfs-bdp-pds', terms: 'https://registry.opendata.aws/noaa-gfs-bdp-pds/',
    modified: 'Modified by Mother Earth: sampled from the 0.25 degree grid at whole degrees to 1 degree and quantised to 0.1 m/s. Not original, unaltered NOAA data.' },
};
const windEmpty = () => ({ schema: 1, layer: 'wind', current: null, previous: null, last_attempt: null, seen: null, source: WIND.SOURCE, collector_version: COLLECTOR_VERSION });
/** Is a failure note (a = { started, run }) still about something newer than the published revision? A note that names a run is
 * ordered by that run; one that names none (the index could not even be asked for) is ordered by when its attempt started. */
const windNoteRelevant = (a, current) => !!a && (!current || (a.run ? a.run > current.run : !current.started || a.started > current.started));
/** The first sighting of a run's index: a newer run replaces an older one; for the same run the EARLIER time is kept. */
const windSeenMerge = (have, s) => !s ? (have || null) : (!have || s.run > have.run) ? s : (s.run === have.run && s.index_first_seen < have.index_first_seen) ? s : have;
/** 'YYYYMMDDHH' of the GFS runs whose named time is not after ms, newest first. */
function windCandidates(ms, n = WIND.LOOKBACK_RUNS) {
  const out = []; let t = Math.floor(ms / 21600000) * 21600000;
  for (let i = 0; i < n; i++, t -= 21600000) { const d = new Date(t); out.push(d.toISOString().slice(0, 13).replace(/[-T]/g, '')); }
  return out;
}
const windObject = run => `gfs.${run.slice(0, 8)}/${run.slice(8)}/atmos/gfs.t${run.slice(8)}z.pgrb2.0p25.f000`;
const windRunIso = run => `${run.slice(0, 4)}-${run.slice(4, 6)}-${run.slice(6, 8)}T${run.slice(8)}:00:00Z`;
/** The six byte ranges from an index file, in WIND.IDX order; throws GribRefused if any field is absent, repeated or out of bounds. */
function windRanges(idxText, total) {
  const lines = String(idxText).trim().split('\n').map(l => l.split(':'));
  return WIND.IDX.map(([v, lev]) => {
    const hits = []; lines.forEach((l, i) => { if (l[3] === v && l[4] === lev && l[5] === 'anl') hits.push(i); });
    if (hits.length !== 1) throw new GRIBWIND.GribRefused(`${v} ${lev}: ${hits.length} index lines`);
    const i = hits[0], start = Number(lines[i][1]), end = (i + 1 < lines.length ? Number(lines[i + 1][1]) : total) - 1, len = end - start + 1;
    if (!(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && len > 0 && len <= WIND.MAX_MSG && end < total)) throw new GRIBWIND.GribRefused(`${v} ${lev}: range ${start}-${end} not acceptable`);
    return { start, end, len };
  });
}
async function windPtr(env) {
  const o = await env.R2.get(WIND.POINTER);
  return o ? { cur: await o.json(), etag: o.etag } : { cur: windEmpty(), etag: null };
}
/** Read-change-write of the manifest. EVERY write is conditional: on the etag read, or create-only when none existed. A refused
 * write (null) is read again and decided again. change(cur) returns the new body, or null to leave the manifest alone. */
async function windUpdate(env, change) {
  for (let i = 0; i < 5; i++) {
    const { cur, etag } = await windPtr(env), body = change(cur);
    if (body === null) return { cur, body: null, wrote: false };
    const r = await env.R2.put(WIND.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });
    if (r !== null) return { cur, body, wrote: true };
  }
  throw new Error('wind manifest kept changing; gave up after 5 tries');
}
/** A failed run never moves the revisions. It leaves a note (last_attempt) ONLY if the note is still about something newer than
 * what is published and no later-started attempt has already written one; either way the run row records the failure. The public
 * reason is a fixed phrase; detail stays in collector_runs. seen = { run, index_first_seen } when the run's index had been found. */
async function windFail(env, ms, reason, http, detail, seen) {
  const failed_at = nowIso(), started = new Date(ms).toISOString(), note = { started, run: seen ? seen.run : null };
  let recorded = false;
  try { const up = await windUpdate(env, cur => {
    const la = cur.last_attempt, keepSeen = seen && (!cur.current || seen.run > cur.current.run) ? windSeenMerge(cur.seen, seen) : (cur.seen || null);
    const record = windNoteRelevant(note, cur.current) && (!la || la.started <= started);
    if (!record) return JSON.stringify(keepSeen) === JSON.stringify(cur.seen || null) ? null : { ...cur, seen: keepSeen };
    return { ...cur, seen: keepSeen, last_attempt: { started, failed_at, status: 'down', http: http || 0, reason, run: note.run, consecutive_failures: ((la && la.consecutive_failures) || 0) + 1 } }; });
    recorded = !!(up.wrote && up.body.last_attempt && up.body.last_attempt.started === started); } catch (_) {}
  await logRun(env, 'wind', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : '') + (recorded ? '' : ' (not noted on the manifest: a newer result is already there)'));
  return 'wind:down ' + reason;
}
/** One range request. The response is refused BEFORE its body is read unless it is 206 with the exact Content-Range, length and ETag. */
async function windFetchRange(url, r, total, etag) {
  // 0.6.17: cache: 'no-store', NOT cf: { cacheTtl: 0 }. With the cf setting a byte-range request to this mirror got its 206 headers and
  // then no body at all (two live runs and the range probe, 16 Nov: docs/research/global-wind-range/README.md). Range downloads only.
  let res; try { res = await fetch(url, { headers: { 'User-Agent': UA, Range: `bytes=${r.start}-${r.end}` }, cache: 'no-store', signal: AbortSignal.timeout(WIND.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: 'field request failed', http: 0, detail: String(e).slice(0, 120) }; }
  const cr = res.headers.get('content-range'), cl = Number(res.headers.get('content-length')), et = res.headers.get('etag');
  if (res.status !== 206 || cr !== `bytes ${r.start}-${r.end}/${total}` || cl !== r.len || et !== etag) {
    try { if (res.body) await res.body.cancel(); } catch (_) {}
    return { ok: false, reason: 'field response refused', http: res.status, detail: `content-range ${cr}, length ${cl}, etag ${et}` };
  }
  let buf; try { buf = new Uint8Array(await res.arrayBuffer()); } catch (e) { return { ok: false, reason: 'field body unreadable', http: 206, detail: String(e).slice(0, 120) }; }
  if (buf.length !== r.len) return { ok: false, reason: 'field body length differs', http: 206, detail: `${buf.length} of ${r.len}` };
  return { ok: true, buf };
}
async function collectWind(env, ms) {
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) return windFail(env, ms, 'internal error', 0, 'platform is not little-endian');
  const { cur } = await windPtr(env), held = cur.current ? cur.current.run : null;
  let run = null, idx = null, requests = 0;
  for (const c of windCandidates(ms)) {
    if (held && c <= held) break;                          // nothing newer can be found from here on: no request
    let r; try { r = await fetch(WIND.HOST + windObject(c) + '.idx', { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(WIND.TIMEOUT_MS) }); requests++; } catch (e) { return windFail(env, ms, 'index request failed', 0, c + ' ' + String(e).slice(0, 120)); }
    if (r.status === 404) { try { if (r.body) await r.body.cancel(); } catch (_) {} continue; }   // that run is not on the mirror yet
    const il = Number(r.headers.get('content-length'));
    if (r.status !== 200 || !(il > 0 && il <= WIND.MAX_IDX)) { try { if (r.body) await r.body.cancel(); } catch (_) {} return windFail(env, ms, 'index http error', r.status, `${c} length ${il}`); }
    idx = await r.text(); run = c; break;
  }
  if (!run) {
    // a clean scan clears an EARLIER failure note only; a note from an attempt that started later stays, and `seen` is never touched
    const started = new Date(ms).toISOString();
    // decided against the manifest AS IT IS NOW, inside the conditional update: a note written while this scan was waiting is seen too
    await windUpdate(env, c => c.last_attempt && c.last_attempt.started <= started ? { ...c, last_attempt: null } : null);
    const note = held ? `no newer run on the mirror: ${held} held and kept` : 'no run found on the mirror';
    await logRun(env, 'wind', ms, 'ok', 200, 0, 0, `${note}; ${requests} request(s)`);
    return 'wind:' + note;
  }
  // The sighting goes on the manifest NOW, as soon as the index is accepted and before any field is asked for, so an invocation that
  // is cut short cannot lose it. What this run carries from here on is the value the manifest holds (the earliest sighting of this run).
  let seen = { run, index_first_seen: nowIso() };
  { const up = await windUpdate(env, c => { const k = !c.current || run > c.current.run ? windSeenMerge(c.seen, seen) : (c.seen || null); return JSON.stringify(k) === JSON.stringify(c.seen || null) ? null : { ...c, seen: k }; });
    const held2 = up.wrote ? up.body.seen : up.cur.seen; if (held2 && held2.run === run) seen = held2; }
  const fail = (reason, http, detail) => windFail(env, ms, reason, http, `${run} ${detail || ''}`.trim(), seen);
  const url = WIND.HOST + windObject(run), cycle = { year: +run.slice(0, 4), month: +run.slice(4, 6), day: +run.slice(6, 8), hour: +run.slice(8) };
  let hd; try { hd = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(WIND.TIMEOUT_MS) }); requests++; } catch (e) { return fail('object request failed', 0, String(e).slice(0, 120)); }
  const total = Number(hd.headers.get('content-length')), etag = hd.headers.get('etag');
  if (hd.status !== 200 || !(total > 0) || !etag) return fail('object http error', hd.status, `length ${total}`);
  let ranges; try { ranges = windRanges(idx, total); } catch (e) { return fail('index unreadable', 200, String(e.message).slice(0, 160)); }
  const grids = WIND.LEVELS.map(() => new Int16Array(WIND.W * WIND.H * 2)), messages = []; let bytes = 0;
  for (let f = 0; f < 6; f++) {
    const got = await windFetchRange(url, ranges[f], total, etag); requests++;
    if (!got.ok) return fail(got.reason, got.http, `${GRIBWIND.WIND_FIELDS[f].key} ${got.detail || ''}`);
    let dec;
    try { dec = GRIBWIND.decode(got.buf); GRIBWIND.checkField(dec, GRIBWIND.WIND_FIELDS[f], cycle); }
    catch (e) { if (e instanceof GRIBWIND.GribRefused) return fail('field refused by the decoder', 200, `${GRIBWIND.WIND_FIELDS[f].key}: ${String(e.message).slice(0, 140)}`); throw e; }
    const g = grids[f >> 1], c = f & 1, v = dec.values, NI = GRIBWIND.GFS_0P25.ni;
    for (let j = 0; j < WIND.H; j++) for (let k = 0; k < WIND.W; k++) g[(j * WIND.W + k) * 2 + c] = Math.round(v[j * WIND.STEP * NI + k * WIND.STEP] * 10);
    messages.push({ key: GRIBWIND.WIND_FIELDS[f].key, range: `${ranges[f].start}-${ranges[f].end}`, bytes: ranges[f].len, sha256: await sha256Bytes(got.buf.buffer) });
    bytes += ranges[f].len;
  }
  const fields_fetched = nowIso();
  // grids: content-addressed and create-only; an existing object is used only if its bytes hash to its name
  const levels = [];
  for (let i = 0; i < WIND.LEVELS.length; i++) {
    const buf = grids[i].buffer, sha = await sha256Bytes(buf), key = WIND.GRIDS + sha + '.i16';
    if (buf.byteLength !== WIND.GRID_BYTES) return fail('internal error', 200, 'grid size ' + buf.byteLength);
    const stored = async () => { let b = null; try { const o = await env.R2.get(key); b = o ? await o.arrayBuffer() : null; } catch (_) { return 'unreadable'; } return !b ? 'absent' : (b.byteLength === WIND.GRID_BYTES && await sha256Bytes(b) === sha) ? 'same' : 'differs'; };
    let had = await stored();
    if (had === 'absent') {
      try { await env.R2.put(key, buf, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { sha256: sha, run, level: WIND.LEVELS[i].id }, onlyIf: { etagDoesNotMatch: '*' } }); } catch (e) { return fail('grid write failed', 200, String(e).slice(0, 120)); }
      had = await stored();                                 // read back whether this run or another one created it
    }
    if (had !== 'same') return fail(had === 'absent' ? 'grid read-back missing' : 'grid stored copy differs', 200, key);
    levels.push({ ...WIND.LEVELS[i], file: sha + '.i16', key, path: `/snapshot/wind/grid/${sha}.i16`, bytes: WIND.GRID_BYTES, sha256: sha });
  }
  const rev = { run, run_time: windRunIso(run), valid_time: windRunIso(run), forecast_hour: 0, levels, messages,
    source: { ...WIND.SOURCE, host: WIND.HOST, object: windObject(run), object_bytes: total, object_etag: etag, object_last_modified: hd.headers.get('last-modified') || null, index_sha256: await sha256Bytes(new TextEncoder().encode(idx).buffer) },
    grid: { source: 'regular lat/lon 0.25 degree, 1440 x 721', display: { w: WIND.W, h: WIND.H, lat0: 90, lon0: 0, step_deg: 1, order: 'rows north to south, columns west to east from 0 degrees east' },
      reduction: 'model value at each whole degree (every fourth point each way); no averaging', encoding: { type: 'int16 little-endian', per_cell: ['u eastward', 'v northward'], scale_m_s: 0.1, missing: WIND.MISSING } },
    times: { index_first_seen: seen.index_first_seen, fields_fetched, published: null }, started: new Date(ms).toISOString() };
  // the manifest is the single commit point: it advances only if no other run has published this run or a newer one meanwhile
  const brief = c => c && ({ run: c.run, run_time: c.run_time, valid_time: c.valid_time, levels: c.levels, source: c.source, grid: c.grid, times: c.times });
  const up = await windUpdate(env, c => { if (c.current && c.current.run >= run) return null;
    const first = windSeenMerge(c.seen && c.seen.run === run ? c.seen : null, seen).index_first_seen;      // the earliest sighting of this run, whoever made it
    const current = { ...rev, times: { index_first_seen: first, fields_fetched, published: nowIso() } };
    return { ...windEmpty(), current, previous: brief(c.current), seen: c.seen && c.seen.run > run ? c.seen : null, last_attempt: windNoteRelevant(c.last_attempt, current) ? c.last_attempt : null }; });
  if (!up.wrote) { await logRun(env, 'wind', ms, 'ok', 200, 0, bytes, `superseded: ${up.cur.current.run} is published; ${run} not published; ${requests} requests`); return 'wind:superseded ' + run; }
  await logRun(env, 'wind', ms, 'ok', 200, 3, bytes, `run ${run} published; index first seen ${up.body.current.times.index_first_seen}; fields fetched ${fields_fetched}; published ${up.body.current.times.published}; ${requests} requests`);
  return 'wind:published ' + run;
}
/** GET /snapshot/wind/meta and /snapshot/wind/grid/<sha256>.i16. A grid is served only if the manifest's current or previous revision
 * names it, and only if the stored bytes hash to that name. */
async function windRoute(env, p) {
  const none = (status, reason) => json({ layer: 'wind', status: 'unavailable', reason }, status, { 'Cache-Control': 'no-store' });
  let cur; try { cur = await getJson(env, WIND.POINTER); } catch (e) { return none(503, 'unreadable'); }
  if (p.length === 3 && p[2] === 'meta') {
    const strip = r => r ? { ...r, levels: r.levels.map(l => ({ ...l, key: undefined })) } : r;
    const c = cur || windEmpty();
    return json({ ...c, current: strip(c.current), previous: strip(c.previous), now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
  }
  const m = p.length === 4 && p[2] === 'grid' ? /^([0-9a-f]{64})\.i16$/.exec(p[3]) : null;
  if (!m || !cur) return none(404, 'not found');
  const x = [cur.current, cur.previous].filter(Boolean).flatMap(r => r.levels).find(l => l.sha256 === m[1]);
  if (!x) return none(404, 'not found');
  let buf; try { const o = await env.R2.get(x.key); buf = o ? await o.arrayBuffer() : null; } catch (e) { return none(503, 'unreadable'); }
  if (!buf) return none(503, 'missing');
  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');
  return new Response(buf, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': WIND.CACHE_FILE, 'ETag': '"' + x.sha256 + '"', ...CORS } });
}

/* ---------- Sky spacecraft (0.6.12; docs/concepts/MOON-AND-SUN-BUILD-PROPOSAL.md rev 2.1) ----------
 * Once a day the hub asks NASA/JPL Horizons for (1) Parker Solar Probe, Sun-centred ICRF vectors, hourly, from yesterday 00:00 UTC
 * to +7 days, and (2) LRO, Moon-centred, at the forward-study epochs. Each response carries the object's data sheet AND the
 * vectors, so the provider's own description of the trajectory solution is read from the same response as the coordinates.
 * Parker: validated, stored under a key that names its content, then the pointer moves (conditional write). A failed run never
 * moves the pointer. LRO: stored for the prediction study only; NOTHING about LRO is published or served.
 * JPL fair use (read 13 Nov 2026): one request at a time, application User-Agent with contact, cache and reuse, back off on
 * failure (no retry inside a run), check the API version. The browser never calls Horizons.
 * Gate: SKYCRAFT_ENABLED=1 (absent = no request at all). Outside LAYERS, cells, history, health and the generic writeDown. */
const SKYCRAFT = {
  API: 'https://ssd.jpl.nasa.gov/api/horizons.api', API_VERSION: '1.2',
  UA: 'mother-earth-collector/' + COLLECTOR_VERSION + ' (+https://github.com/TheOneTheOnlyTheChad/mother-earth; contact: issues at that address)',
  RUN_HOUR_UTC: 5, TIMEOUT_MS: 30000, MAX_BYTES: 512 * 1024, LOCK_STALE_MS: 10 * 60 * 1000,
  POINTER: 'skycraft/current.json', SNAP: 'skycraft/snap/', RAW: 'skycraft/raw/', STUDY: 'skycraft/study/lro/', LOCK: 'skycraft/lock.json',
  CACHE_FILE: 'public, max-age=86400, immutable',
  PARKER: { command: '-96', center: '500@10', target: 'Parker Solar Probe (spacecraft) (-96)', centre: 'Sun (10)', back_days: 1, ahead_days: 7, step_s: 3600, band_km: [5.5e6, 1.7e8] },
  LRO: { command: '-85', center: '500@301', target: 'LRO (spacecraft) (-85)', centre: 'Moon (301)', leads_days: [0, 1, 3, 7, 14, 21, 30, 37, 45, 60], instants_utc: ['12:00', '12:30', '13:00', '13:30'] },
  // ICRF → the Sun page's view axes (screen right, screen up, toward the viewer). The SAME numbers as the dated example's
  // frame.view.rows, written by phase1/skycraft/build_examples.py; skycraft-hub.test.mjs fails if they ever differ.
  VIEW_SUN: [[0.2458856779, 0.889314294858, 0.385564934046], [-0.961545555883, 0.17358023217, 0.212838076859], [0.122353493472, -0.423072083648, 0.897797101061]],
  SUN_R_KM: 695700,
  SOURCE: { provider: 'NASA/JPL Solar System Dynamics (Horizons)', url: 'https://ssd.jpl.nasa.gov/horizons/', credit: 'Predicted position · NASA/JPL Horizons' },
};
const HZ_MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const hzStamp = ms => { const d = new Date(ms).toISOString(); return d.slice(0, 10) + ' ' + d.slice(11, 16); };   // 2026-11-13 00:00
const hzQ = v => encodeURIComponent(v).replace(/%2C/g, ',');
/** The Horizons request for vectors plus the data sheet. times = { start, stop, step_m } (ms, ms, minutes) or { list: [ms…] }. */
function hzUrl(spec, times) {
  const q = { format: 'json', COMMAND: `'${spec.command}'`, OBJ_DATA: "'YES'", MAKE_EPHEM: "'YES'", EPHEM_TYPE: "'VECTORS'", CENTER: `'${spec.center}'`, REF_PLANE: "'FRAME'", REF_SYSTEM: "'ICRF'",
    VEC_CORR: "'NONE'", TIME_TYPE: "'UT'", CSV_FORMAT: "'NO'", VEC_TABLE: "'2'", OUT_UNITS: "'KM-S'" };
  if (times.list) q.TLIST = times.list.map(ms => `'${hzStamp(ms)}'`).join(',');
  else { q.START_TIME = `'${hzStamp(times.start)}'`; q.STOP_TIME = `'${hzStamp(times.stop)}'`; q.STEP_SIZE = `'${times.step_m} m'`; }
  return SKYCRAFT.API + '?' + Object.entries(q).map(([k, v]) => k + '=' + hzQ(v)).join('&');
}
/** ONE request to Horizons, body size enforced. { ok, http, text, bytes, sha256 } or { ok:false, reason, http, detail }. Never retried here. */
async function hzFetch(url) {
  let r; try { r = await fetch(url, { headers: { 'User-Agent': SKYCRAFT.UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(SKYCRAFT.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: 'request failed', http: 0, detail: String(e).slice(0, 160) }; }
  if (r.status !== 200) { try { await r.body.cancel(); } catch (_) {} return { ok: false, reason: 'http error', http: r.status }; }
  let buf; try { buf = await r.arrayBuffer(); } catch (e) { return { ok: false, reason: 'request failed', http: 200, detail: String(e).slice(0, 160) }; }
  if (!buf.byteLength || buf.byteLength > SKYCRAFT.MAX_BYTES) return { ok: false, reason: 'size out of range', http: 200, detail: String(buf.byteLength) };
  let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return { ok: false, reason: 'response unreadable', http: 200 }; }
  return { ok: true, http: 200, text, buf, bytes: buf.byteLength, sha256: await sha256Bytes(buf) };
}
const hzDate = t => { const m = /^(\d{4})[- ]([A-Za-z]{3})[- ](\d\d) (\d\d):(\d\d)$/.exec(t.trim()); return m && m[2].toLowerCase() in HZ_MON ? Date.UTC(+m[1], HZ_MON[m[2].toLowerCase()], +m[3], +m[4], +m[5]) : NaN; };
/** Parse one Horizons JSON answer: API version, header identity, the data sheet's trajectory statement and table, and the vector rows.
 * { ok, version, target_source, revised, statement, table:[{name,start,end,start_tdb_ms,end_tdb_ms}], rows:[{ms,p:[x,y,z]}] } or { ok:false, reason, detail }. Reasons are fixed phrases. */
function hzParse(text, spec) {
  let j; try { j = JSON.parse(text); } catch (e) { return { ok: false, reason: 'response unreadable' }; }
  const ver = j && j.signature && j.signature.version;
  if (ver !== SKYCRAFT.API_VERSION) return { ok: false, reason: 'api version changed', detail: String(ver) };
  const t = j.result; if (typeof t !== 'string') return { ok: false, reason: 'response unreadable', detail: String(j.error || '').slice(0, 120) };
  const line = re => { const m = re.exec(t); return m ? m[1].replace(/\s+/g, ' ').trim() : null; };
  const target = line(/^Target body name: (.*)$/m), centre = line(/^Center body name: (.*)$/m);
  if (!target || !target.startsWith(spec.target) || !centre || !centre.startsWith(spec.centre)) return { ok: false, reason: 'wrong object in response', detail: `${target} / ${centre}` };
  for (const need of ['Reference frame : ICRF', 'Output units    : KM-S', 'Output type     : GEOMETRIC cartesian states', 'Center-site name: BODY CENTER']) if (!t.includes(need)) return { ok: false, reason: 'unexpected response settings', detail: need };
  const a = t.indexOf('$$SOE'), b = t.indexOf('$$EOE');
  if (a < 0 || b < a) return { ok: false, reason: 'no vector table in response' };
  const L = t.slice(a + 5, b).split('\n').map(x => x.trim()).filter(Boolean), rows = [];
  if (!L.length || L.length % 3) return { ok: false, reason: 'vector table unreadable', detail: String(L.length) };
  for (let i = 0; i < L.length; i += 3) {
    const e = /= A\.D\. (\d{4}-[A-Za-z]{3}-\d\d \d\d:\d\d):00\.0000 UTC$/.exec(L[i]), p = /^X =\s*(\S+)\s+Y =\s*(\S+)\s+Z =\s*(\S+)$/.exec(L[i + 1]);
    const ms = e ? hzDate(e[1]) : NaN, v = p ? [+p[1], +p[2], +p[3]] : null;
    if (!Number.isFinite(ms) || !v || v.some(x => !Number.isFinite(x)) || !/^VX=/.test(L[i + 2])) return { ok: false, reason: 'vector table unreadable', detail: L[i].slice(0, 80) };
    rows.push({ ms, p: v });
  }
  const k = t.indexOf('SPACECRAFT TRAJECTORY'), end = k < 0 ? -1 : t.indexOf('*****', k);
  if (k < 0 || end < 0) return { ok: false, reason: 'data sheet unreadable', detail: 'no trajectory section' };
  const block = t.slice(k, end).split('\n'), hdr = block.findIndex(x => /^\s*(Trajectory name|Name)\s+Start/.test(x));
  if (hdr < 1) return { ok: false, reason: 'data sheet unreadable', detail: 'no trajectory table' };
  const statement = block.slice(1, hdr).join(' ').replace(/\s+/g, ' ').trim(), table = [];
  for (const x of block.slice(hdr + 2)) { if (!x.trim()) continue;
    const m = /^\s*(.+?)\s{2,}(\d{4}[- ][A-Za-z]{3}[- ]\d\d \d\d:\d\d)\s+(\d{4}[- ][A-Za-z]{3}[- ]\d\d \d\d:\d\d)\s*$/.exec(x), s0 = m ? hzDate(m[2]) : NaN, s1 = m ? hzDate(m[3]) : NaN;
    if (!m || !Number.isFinite(s0) || !Number.isFinite(s1) || s1 <= s0) return { ok: false, reason: 'data sheet unreadable', detail: x.slice(0, 80) };
    table.push({ name: m[1], start: m[2], end: m[3], start_tdb_ms: s0, end_tdb_ms: s1 }); }
  if (!statement || !table.length) return { ok: false, reason: 'data sheet unreadable', detail: 'empty statement or table' };
  const target_source = line(/^Target body name: .*\{source: ([^}]*)\}/m), revised = line(/^\s*Revised:\s*(\w{3} \d\d, \d{4})/m);
  if (!target_source || !revised) return { ok: false, reason: 'no source tag or data sheet revision in response', detail: `${target_source} / ${revised}` };   // provenance is accepted only with both (GPT, 13 Nov 2026)
  return { ok: true, version: ver, target, centre, target_source, revised, statement, table, rows };
}
/** Which named trajectory segment holds a UTC instant (the table is in TDB: UTC + 69.184 s). −1 when none, more than one, or within two minutes of a segment edge. */
function hzSegmentOf(ms, table) {
  const tdb = ms + 69184, hit = table.map((s, i) => (tdb >= s.start_tdb_ms && tdb < s.end_tdb_ms) ? i : -1).filter(i => i >= 0);
  if (hit.length !== 1) return -1;
  const s = table[hit[0]];
  return (tdb - s.start_tdb_ms < 120000 || s.end_tdb_ms - tdb < 120000) ? -1 : hit[0];
}
/** Parker's data sheet states one tracking-fit date for the whole table. Returns its end (ms, end of that UTC day) or null when the sentence is not the one we know. */
function hzFitThrough(statement) {
  const m = /Fit to post-launch tracking data through (\d{4})-([A-Za-z]{3})-(\d\d)\. Reference planning trajectory for subsequent times\./.exec(statement || '');
  return m && m[2].toLowerCase() in HZ_MON ? Date.UTC(+m[1], HZ_MON[m[2].toLowerCase()], +m[3]) + 86400000 : null;
}
const craftDay = ms => Date.UTC(new Date(ms).getUTCFullYear(), new Date(ms).getUTCMonth(), new Date(ms).getUTCDate());
/** The LRO forward-study epochs for a capture on UTC day D: D 00:00 (the Sky sample, usually already past) and four fixed instants on each lead day. */
function craftStudyEpochs(ms) {
  const d0 = craftDay(ms), out = [{ ms: d0, lead_days: 0, instant: '00:00' }];
  for (const lead of SKYCRAFT.LRO.leads_days) for (const hm of SKYCRAFT.LRO.instants_utc) out.push({ ms: d0 + lead * 86400000 + (+hm.slice(0, 2)) * 3600000 + (+hm.slice(3)) * 60000, lead_days: lead, instant: hm });
  return out;
}
const craftEmpty = () => ({ schema: 1, layer: 'skycraft', current: null, previous: null, last_attempt: null, cadence: { run_hour_utc: SKYCRAFT.RUN_HOUR_UTC }, source: SKYCRAFT.SOURCE, collector_version: COLLECTOR_VERSION });
async function craftPtr(env) { const o = await env.R2.get(SKYCRAFT.POINTER); return o ? { cur: await o.json(), etag: o.etag } : { cur: craftEmpty(), etag: null }; }
/** Read–change–write of the pointer; EVERY write is conditional (the etag read, or create-only when none existed). As dustUpdate. */
async function craftUpdate(env, change) {
  for (let i = 0; i < 5; i++) {
    const { cur, etag } = await craftPtr(env), body = change(cur);
    if (body === null) return { cur, body: null, wrote: false };
    const r = await env.R2.put(SKYCRAFT.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });
    if (r !== null) return { cur, body, wrote: true };
  }
  throw new Error('skycraft pointer kept changing; gave up after 5 tries');
}
/** One upstream conversation at a time across scheduled runs, manual runs and the probe: a lock object written create-only.
 * A released lock, or one older than ten minutes, is taken over by compare-and-swap on its etag. Returns { etag } or null. */
async function craftLock(env, who) {
  const body = JSON.stringify({ who, token: crypto.randomUUID(), at: nowIso() }), meta = { httpMetadata: { contentType: 'application/json' } };
  let r = await env.R2.put(SKYCRAFT.LOCK, body, { ...meta, onlyIf: { etagDoesNotMatch: '*' } });
  if (r === null) {
    const o = await env.R2.get(SKYCRAFT.LOCK); if (!o) return null;
    let held = null; try { held = await o.json(); } catch (_) {}
    if (held && !held.released && Date.now() - Date.parse(held.at) < SKYCRAFT.LOCK_STALE_MS) return null;
    r = await env.R2.put(SKYCRAFT.LOCK, body, { ...meta, onlyIf: { etagMatches: o.etag } });
    if (r === null) return null;
  }
  return { etag: r.etag };
}
/** Release ONLY a lock this run still holds: a conditional overwrite on the etag this run wrote. Nothing is deleted, so a run
 * whose lock expired and was taken over cannot release its successor's lock (GPT, 13 Nov 2026). */
async function craftUnlock(env, lock) {
  try { await env.R2.put(SKYCRAFT.LOCK, JSON.stringify({ released: true, at: nowIso() }), { httpMetadata: { contentType: 'application/json' }, onlyIf: { etagMatches: lock.etag } }); } catch (_) {}
}
async function craftHolds(env, lock) { try { const o = await env.R2.head(SKYCRAFT.LOCK); return !!o && o.etag === lock.etag; } catch (_) { return false; } }
/** A failed run never moves the snapshot: the pointer keeps current/previous and gains last_attempt (fixed public phrase; detail stays in collector_runs). */
async function craftFail(env, ms, reason, http, detail) {
  const failed_at = nowIso();
  try { await craftUpdate(env, cur => ({ ...cur, last_attempt: { run: new Date(ms).toISOString(), failed_at, status: 'down', http: http || 0, reason, consecutive_failures: ((cur.last_attempt && cur.last_attempt.consecutive_failures) || 0) + 1 } })); } catch (_) {}
  await logRun(env, 'skycraft', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));
  return 'skycraft:down ' + reason;
}
/** Store bytes once under a key that names them, then read back. 'same' | 'stored' | a fixed failure phrase. Never overwrites. */
async function craftStore(env, key, buf, sha, type) {
  const same = async () => { let b = null; try { const o = await env.R2.get(key); b = o ? await o.arrayBuffer() : null; } catch (_) { return 'unreadable'; } return !b ? 'absent' : (b.byteLength === buf.byteLength && await sha256Bytes(b) === sha) ? 'same' : 'differs'; };
  const had = await same();
  if (had === 'same') return 'same';
  if (had !== 'absent') return 'stored copy differs';
  try { await env.R2.put(key, buf, { httpMetadata: { contentType: type }, customMetadata: { sha256: sha } }); } catch (e) { return 'write failed'; }
  return (await same()) === 'same' ? 'stored' : 'read-back differs';
}
async function collectSkycraft(env, ms) {
  const lock = await craftLock(env, 'run ' + new Date(ms).toISOString());
  if (!lock) { await logRun(env, 'skycraft', ms, 'ok', 0, 0, 0, 'skipped: another Horizons conversation holds the lock; no request made'); return 'skycraft:busy'; }
  try { return await craftRun(env, ms, lock); } finally { await craftUnlock(env, lock); }
}
/** Two independent outcomes, one request at a time: Parker (published) then the LRO study capture (stored, never published).
 * A Parker-specific failure (a 4xx answer, an unreadable or invalid answer, a storage or publication failure) does not cancel the
 * LRO capture. A failure that points at an upstream outage or rate limit (no answer, HTTP 429, HTTP 5xx) backs off the whole run. */
async function craftRun(env, ms, lock) {
  // neither part can take the other down: anything either one throws becomes that part's own outcome
  let pk; try { pk = await craftParker(env, ms); } catch (e) { pk = { ok: false, reason: 'parker internal error', http: 0, detail: String(e).slice(0, 160), backoff: false }; }
  const study = pk.backoff ? 'not attempted: backing off after ' + pk.reason
    : !await craftHolds(env, lock) ? 'not attempted: this run no longer holds the lock'
    : await craftStudy(env, ms).catch(e => 'failed: internal error — ' + String(e).slice(0, 120));
  if (!pk.ok) return (await craftFail(env, ms, pk.reason, pk.http, (pk.detail ? pk.detail + '; ' : '') + 'lro study ' + study)) + '; lro study ' + study;
  await logRun(env, 'skycraft', ms, study.startsWith('stored') ? 'ok' : 'degraded', 200, pk.n, pk.bytes, pk.note + '; lro study ' + study);
  return 'skycraft:' + (pk.wrote ? 'published ' : 'superseded ') + pk.id + '; lro study ' + study;
}
/** Request 1. { ok:true, id, wrote, n, bytes, note } or { ok:false, reason, http, detail, backoff }. */
async function craftParker(env, ms) {
  const P = SKYCRAFT.PARKER, day = craftDay(ms), start = day - P.back_days * 86400000, stop = day + P.ahead_days * 86400000, n = (stop - start) / (P.step_s * 1000) + 1;
  const bad = (reason, http, detail, backoff = false) => ({ ok: false, reason, http, detail, backoff });
  const got = await hzFetch(hzUrl(P, { start, stop, step_m: P.step_s / 60 })), retrieved_at = nowIso();
  if (!got.ok) return bad('parker ' + got.reason, got.http, got.detail, got.http === 0 || got.http === 429 || got.http >= 500);
  const z = hzParse(got.text, P);
  if (!z.ok) return bad('parker ' + z.reason, 200, z.detail);
  if (z.rows.length !== n || z.rows.some((r, i) => r.ms !== start + i * P.step_s * 1000)) return bad('parker returned times differ from the request', 200, `${z.rows.length} rows`);
  const dist = z.rows.map(r => Math.hypot(...r.p));
  if (dist.some(d => !(d >= P.band_km[0] && d <= P.band_km[1]))) return bad('parker distance out of range', 200, `${Math.min(...dist)}..${Math.max(...dist)} km`);
  const fit = hzFitThrough(z.statement);
  if (fit === null) return bad('parker data sheet statement not recognised', 200, z.statement.slice(0, 160));
  const seg = z.rows.map(r => hzSegmentOf(r.ms, z.table));
  if (seg.every(i => i < 0)) return bad('parker no sample inside a named trajectory segment', 200);
  const stamp = retrieved_at.replace(/[-:]/g, '').slice(0, 15) + 'Z', rawKey = `${SKYCRAFT.RAW}${stamp}-parker.json`;
  const sr = await craftStore(env, rawKey, got.buf, got.sha256, 'application/json');
  if (sr !== 'same' && sr !== 'stored') return bad('parker raw ' + sr, 200, rawKey);
  const used = [...new Set(seg.filter(i => i >= 0))].sort((a, b) => a - b), withheld = seg.filter(i => i < 0).length;
  const snap = { schema: 1, layer: 'skycraft', kind: 'hub snapshot', body: 'sun', mission: { id: 'psp', name: 'Parker Solar Probe', naif_id: -96 },
    retrieved_at, run: new Date(ms).toISOString(),
    time: { standard: 'UTC', start: new Date(start).toISOString().slice(0, 19) + 'Z', end: new Date(stop).toISOString().slice(0, 19) + 'Z', step_s: P.step_s, n },
    frame: { native: 'ICRF, Sun-centred, geometric states (NASA/JPL Horizons)', units: 'km', view: { rows: SKYCRAFT.VIEW_SUN, row_meaning: ['screen right', 'screen up', 'toward the viewer'], description: "Viewed from above the Sun's north pole, looking down on its equator." } },
    body_radius_km: SKYCRAFT.SUN_R_KM,
    solution: { same_response_as_vectors: true, api_version: z.version, target: z.target, target_source: z.target_source, data_sheet_revised: z.revised, statement: z.statement, fit_through_utc: new Date(fit - 86400000).toISOString().slice(0, 10),
      segments: used.map(i => ({ index: i, name: z.table[i].name, start_tdb: z.table[i].start, end_tdb: z.table[i].end })),
      // per sample: the index of its named segment, or −1 = withheld (no segment, more than one segment listed for that time, or within
      // two minutes of a segment edge), and whether it lies inside the tracking fit
      segment_of: seg, within_tracking_fit: z.rows.map(r => r.ms < fit), withheld_samples: withheld },
    source: { ...SKYCRAFT.SOURCE, response_bytes: got.bytes, response_sha256: got.sha256, user_agent: SKYCRAFT.UA },
    modifications: 'Positions rounded to 1 km. Velocities not carried.',
    xyz_km: z.rows.flatMap(r => r.p.map(Math.round)) };
  const body = new TextEncoder().encode(JSON.stringify(snap)).buffer, sha = await sha256Bytes(body), id = stamp + '-' + sha.slice(0, 16), key = SKYCRAFT.SNAP + id + '.json';
  const ss = await craftStore(env, key, body, sha, 'application/json');
  if (ss !== 'same' && ss !== 'stored') return bad('snapshot ' + ss, 200, key);
  const brief = { id, key, path: '/snapshot/skycraft/' + id, bytes: body.byteLength, sha256: sha, retrieved_at, covers: { start: snap.time.start, end: snap.time.end, step_s: P.step_s }, withheld_samples: withheld, raw: { key: rawKey, sha256: got.sha256, bytes: got.bytes } };
  // a pointer that cannot be read or written is a Parker outcome like any other: the last good snapshot stays current and the LRO capture still runs (GPT, 13 Nov 2026)
  let up; try { up = await craftUpdate(env, c => (c.current && c.current.retrieved_at >= retrieved_at) ? null : { ...craftEmpty(), current: brief, previous: c.current || null }); }
  catch (e) { return bad('parker pointer update failed', 200, String(e).slice(0, 160)); }
  return { ok: true, id, wrote: up.wrote, n, bytes: got.bytes, note: `${up.wrote ? 'published' : 'superseded'} ${id}; sheet revised ${z.revised}; segments ${used.map(i => z.table[i].name).join(', ')}; ${withheld} of ${n} samples withheld` };
}
/** The LRO capture for the forward study: raw answer plus a small index (target epochs, signed lead from the actual retrieval, data sheet). Publishes nothing. */
async function craftStudy(env, ms) {
  const epochs = craftStudyEpochs(ms), got = await hzFetch(hzUrl(SKYCRAFT.LRO, { list: epochs.map(e => e.ms) })), retrieved_at = nowIso(), stamp = retrieved_at.replace(/[-:]/g, '').slice(0, 15) + 'Z';
  if (!got.ok) return 'failed: ' + got.reason + (got.http ? ' ' + got.http : '');
  const z = hzParse(got.text, SKYCRAFT.LRO);
  if (!z.ok) return 'failed: ' + z.reason;
  if (z.rows.length !== epochs.length || z.rows.some((r, i) => r.ms !== epochs[i].ms)) return 'failed: returned times differ from the request';
  const rawKey = `${SKYCRAFT.STUDY}${stamp}-raw.json`, sr = await craftStore(env, rawKey, got.buf, got.sha256, 'application/json');
  if (sr !== 'same' && sr !== 'stored') return 'failed: raw ' + sr;
  const got_ms = Date.parse(retrieved_at);
  const idx = { schema: 1, study: 'lro-forward', retrieved_at, capture_day: new Date(craftDay(ms)).toISOString().slice(0, 10), api_version: z.version, target: z.target, target_source: z.target_source,
    data_sheet_revised: z.revised, statement: z.statement, table: z.table.map(s => ({ name: s.name, start_tdb: s.start, end_tdb: s.end })),
    // signed_lead_s < 0: the instant was already past at retrieval (not a forward forecast)
    epochs: epochs.map((e, i) => ({ utc: new Date(e.ms).toISOString().slice(0, 19) + 'Z', lead_days: e.lead_days, instant: e.instant, signed_lead_s: Math.round((e.ms - got_ms) / 1000), forward: e.ms > got_ms, segment: (z.table[hzSegmentOf(e.ms, z.table)] || {}).name || null, xyz_km: z.rows[i].p })),
    raw: { key: rawKey, sha256: got.sha256, bytes: got.bytes }, frame: 'ICRF, Moon-centred, geometric', published: false };
  const b = new TextEncoder().encode(JSON.stringify(idx)).buffer, ir = await craftStore(env, `${SKYCRAFT.STUDY}${stamp}-index.json`, b, await sha256Bytes(b), 'application/json');
  return (ir === 'same' || ir === 'stored') ? `stored ${epochs.length} epochs` : 'failed: index ' + ir;
}
/** /admin/probe/skycraft — EXACTLY ONE upstream request (Parker's data sheet only, no vectors), with the application User-Agent. Stores and publishes nothing. */
async function craftProbe(env) {
  const lock = await craftLock(env, 'probe');
  if (!lock) return { probe: 'skycraft', made_request: false, reason: 'another Horizons conversation holds the lock' };
  try {
    const url = SKYCRAFT.API + "?format=json&COMMAND='-96'&OBJ_DATA='YES'&MAKE_EPHEM='NO'", t0 = Date.now();
    let r, text = '', err = null;
    try { r = await fetch(url, { headers: { 'User-Agent': SKYCRAFT.UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(SKYCRAFT.TIMEOUT_MS) }); text = await r.text(); } catch (e) { err = String(e).slice(0, 200); }
    let ver = null, revised = null; try { const j = JSON.parse(text); ver = j.signature && j.signature.version; revised = (/Revised:\s*(\w{3} \d\d, \d{4})/.exec(j.result || '') || [])[1] || null; } catch (_) {}
    return { probe: 'skycraft', made_request: true, upstream_requests: 1, url, user_agent_set: SKYCRAFT.UA, user_agent_receipt: 'not verified: this is the header the hub set on its request; the upstream does not echo it', http: r ? r.status : 0, error: err, ms: Date.now() - t0, bytes: text.length,
      sha256: text ? await sha256Bytes(new TextEncoder().encode(text).buffer) : null, api_version: ver, expected_api_version: SKYCRAFT.API_VERSION, data_sheet_revised: revised,
      content_type: r ? r.headers.get('content-type') : null, stored: false, published: false, at: nowIso() };
  } finally { await craftUnlock(env, lock); }
}
/** GET /snapshot/skycraft/meta and /snapshot/skycraft/<id>. A snapshot is served only if it is the current or previous one AND its stored bytes match the pointer. */
async function craftSnapRoute(env, p) {
  const none = (status, reason) => json({ layer: 'skycraft', status: 'unavailable', reason }, status, { 'Cache-Control': 'no-store' });
  let cur; try { cur = await getJson(env, SKYCRAFT.POINTER); } catch (e) { return none(503, 'unreadable'); }
  if (p.length === 3 && p[2] === 'meta') {
    const strip = f => f ? { ...f, key: undefined, raw: f.raw && { sha256: f.raw.sha256, bytes: f.raw.bytes } } : f;
    if (!cur) return json({ schema: 1, layer: 'skycraft', current: null, previous: null, last_attempt: null, now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
    return json({ ...cur, current: strip(cur.current), previous: strip(cur.previous), now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (p.length !== 3 || !cur) return none(404, 'not found');
  const x = [cur.current, cur.previous].find(f => f && f.id === p[2]);
  if (!x) return none(404, 'not found');
  let buf; try { const o = await env.R2.get(x.key); buf = o ? await o.arrayBuffer() : null; } catch (e) { return none(503, 'unreadable'); }
  if (!buf) return none(503, 'missing');
  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');
  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': SKYCRAFT.CACHE_FILE, 'ETag': '"' + x.sha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
}
/** The two DATED EXAMPLES (fixed files built by phase1/skycraft/build_examples.py), pinned like the Sky catalogue. */
const CRAFT_REVISIONS = Object.freeze({
  'craft-moon-2026-06-R1': Object.freeze({ key: 'ref/skycraft/craft-moon-2026-06-R1.json', revision: 'craft-moon-2026-06-R1', fileSha256: 'e747aa7a58a71a5e2a11253b2d063fcfc80809d8d86291ce6dce8220d1d05ebb', bytes: 41681 }),
  'craft-sun-2024-12-R1': Object.freeze({ key: 'ref/skycraft/craft-sun-2024-12-R1.json', revision: 'craft-sun-2024-12-R1', fileSha256: '5934263214741a21b11019fa55d326a5b0524274c3104a6a768fca4fd3149500', bytes: 26074 }),
});
/** GET /catalogue/skycraft/<revision>: exactly one segment, a pinned id, the complete stored file matching its pin; else 404 (no R2 read) or 503. */
async function craftCatRoute(env, rawPath, table = CRAFT_REVISIONS) {
  const m = typeof rawPath === 'string' ? rawPath.match(/^\/catalogue\/skycraft\/([^/]+)$/) : null;
  const pin = m && Object.prototype.hasOwnProperty.call(table, m[1]) ? table[m[1]] : null;   // matched literally: no percent-decoding
  if (!pin) return json({ kind: 'catalogue', catalogue: 'skycraft', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });
  const no = reason => json({ kind: 'catalogue', catalogue: 'skycraft', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });
  let buf; try { const o = await env.R2.get(pin.key); if (!o) return no('missing'); buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }
  if (buf.byteLength !== pin.bytes || await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');
  let j; try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }
  if (!j || j.catalogue !== 'skycraft' || j.catalogue_revision !== pin.revision || !j.time || !Array.isArray(j.xyz_km) || j.xyz_km.length !== 3 * j.time.n) return no('invalid');
  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': SKYCRAFT.CACHE_FILE, 'ETag': '"' + pin.fileSha256 + '"', 'Access-Control-Expose-Headers': 'ETag', ...CORS } });
}

/* ---------- Sun face (0.6.13): one NASA/SDO picture of the Sun's Earth-facing side, fetched once an hour (MOON-SUN-GLOBES-PROPOSAL rev 2.3 §3.2)
 * One file: the HMI continuum "latest" image, 1024 px. Stored unchanged; the page reads the hub, never SDO.
 * THREE TIMES, never merged:
 *   observed_at   when the Sun was observed. NOT KNOWN to the hub (no machine-readable source verified) — always null in this version.
 *   file_updated  the Last-Modified header SDO sent with the file. This is what the page shows ("File updated at …") and what the
 *                 three-hour age limit is counted from. The page evaluates the age, at display time.
 *   retrieved_at  when the hub fetched it.
 * RULES
 *   - identical bytes (same sha256 as the current image): the image and ITS ORIGINAL timestamps stay; only last_checked moves.
 *     Refetching the same picture can never make it look newer.
 *   - no trustworthy timestamp, no publication: Last-Modified missing, not a real calendar date in the HTTP form, later than the
 *     hub's retrieval time (no tolerance), or not newer than the current image's, and the fetched image is REJECTED.
 *     The current image stays and expires on its own clock.
 *   - no replay: bytes this hub has already recorded (the previous image, or any earlier one) are never published again under a
 *     different time. The record is a marker at sunface/seen/<sha256>.json, written BEFORE publication; if it cannot be written,
 *     nothing is published. An unfinished publication may be completed later only with the same file-updated time.
 *   - a failed or rejected run never moves the image; the pointer gains last_attempt.
 * Outside LAYERS, cells, history, health and the generic writeDown. Gate: SUNFACE_ENABLED=1 (absent = no request at all). */
const SUNFACE = {
  URL: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIIC.jpg', W: 1024, H: 1024, MAX_BYTES: 2 * 1024 * 1024, MIN_BYTES: 20000,
  TIMEOUT_MS: 30000, POINTER: 'sunface/current.json', PREFIX: 'sunface/images/', FILE: 'sun.jpg', CACHE_FILE: 'public, max-age=86400, immutable',
  SEEN: 'sunface/seen/',
  AGE_LIMIT_S: 3 * 3600,    // published for the page, which applies it; the hub does not expire anything
  UA: 'mother-earth-collector/' + COLLECTOR_VERSION + ' (+https://github.com/TheOneTheOnlyTheChad/mother-earth; contact: issues at that address)',
  SOURCE: { product: 'SDO/HMI continuum, colourised ("latest" browse image, 1024 px)', provider: 'NASA Solar Dynamics Observatory', page: 'https://sdo.gsfc.nasa.gov/data/',
    credit: 'Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams.', file: 'latest_1024_HMIIC.jpg' },
};
/** A Last-Modified header as { iso, ms }, or null when it is missing, not in the HTTP date form, not a real calendar date
 * (31 Feb, a wrong weekday), or later than nowMs (the hub's retrieval time; no tolerance). */
function sunStamp(header, nowMs) {
  if (typeof header !== 'string') return null;
  const h = header.trim();
  if (!/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(h)) return null;   // the HTTP date form only; nothing looser
  const ms = Date.parse(h);
  if (!Number.isFinite(ms) || new Date(ms).toUTCString() !== h) return null;   // must read back identically: Date.parse turns "31 Feb" into 3 Mar and ignores the weekday
  if (ms > nowMs) return null;
  return { iso: new Date(ms).toISOString().replace('.000Z', 'Z'), ms };
}
/** One GET of the image, validated. { ok, buf, bytes, sha256, last_modified, date, etag } or { ok:false, reason, http, detail }. Reasons are fixed phrases (public). */
async function sunFetch() {
  let r;
  try { r = await fetch(SUNFACE.URL, { headers: { 'User-Agent': SUNFACE.UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(SUNFACE.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: 'request failed', http: 0, detail: String(e).slice(0, 160) }; }
  if (r.status !== 200) return { ok: false, reason: 'http error', http: r.status };
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'image/jpeg') return { ok: false, reason: 'not an image', http: 200, detail: type };
  const got = await dustBody(r, SUNFACE.MAX_BYTES);
  if (got.error) return { ok: false, reason: 'request failed', http: 200, detail: got.error };
  if (got.over) return { ok: false, reason: 'size out of range', http: 200, detail: 'over ' + SUNFACE.MAX_BYTES + ' B (stopped at ' + got.read + ')' };
  const buf = got.buf;
  if (buf.byteLength < SUNFACE.MIN_BYTES) return { ok: false, reason: 'size out of range', http: 200, detail: String(buf.byteLength) };
  const d = jpegCheck(new Uint8Array(buf));
  if (!d || d.w !== SUNFACE.W || d.h !== SUNFACE.H || !d.dqt || !d.sos || !d.eoi) return { ok: false, reason: 'not a valid image', http: 200, detail: JSON.stringify(d) };
  return { ok: true, buf, bytes: buf.byteLength, sha256: await sha256Bytes(buf), last_modified: r.headers.get('last-modified'), date: r.headers.get('date'), etag: r.headers.get('etag') };
}
const sunEmpty = () => ({ schema: 1, layer: 'sunface', image: null, previous: null, last_checked: null, last_attempt: null, age_limit_s: SUNFACE.AGE_LIMIT_S, cadence: 'hourly', source: SUNFACE.SOURCE, collector_version: COLLECTOR_VERSION });
async function sunPtr(env) { const o = await env.R2.get(SUNFACE.POINTER); return o ? { cur: await o.json(), etag: o.etag } : { cur: sunEmpty(), etag: null }; }
/** Read–change–write of the pointer; every write is conditional on what was read (as dustUpdate). change(cur) → new body, or null to leave it. */
async function sunUpdate(env, change) {
  for (let i = 0; i < 5; i++) {
    const { cur, etag } = await sunPtr(env), body = change(cur);
    if (body === null) return { cur, body: null, wrote: false };
    const r = await env.R2.put(SUNFACE.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });
    if (r !== null) return { cur, body, wrote: true };
  }
  throw new Error('sunface pointer kept changing; gave up after 5 tries');
}
/** A failed or rejected run: the image is untouched; last_attempt records it. status is 'down' (no usable answer) or 'rejected' (an image came, but it may not be published). */
async function sunFail(env, ms, status, reason, http, detail) {
  const failed_at = nowIso();
  try { await sunUpdate(env, cur => ({ ...cur, last_attempt: { run: new Date(ms).toISOString(), failed_at, status, http: http || 0, reason, consecutive_failures: ((cur.last_attempt && cur.last_attempt.consecutive_failures) || 0) + 1 } })); } catch (_) {}
  await logRun(env, 'sunface', ms, 'down', http || 0, 0, 0, (status === 'rejected' ? 'rejected: ' : '') + reason + (detail ? ' — ' + detail : ''));
  return 'sunface:' + status + ' ' + reason;
}
async function collectSunface(env, ms) {
  const f = await sunFetch();
  if (!f.ok) return sunFail(env, ms, 'down', f.reason, f.http, f.detail);
  const retrievedMs = Date.now(), retrieved_at = nowIso();
  let before = (await sunPtr(env)).cur;
  // identical bytes: nothing about the image changes, whatever headers came with it
  if (before.image && before.image.sha256 === f.sha256) {
    const up = await sunUpdate(env, cur => (cur.image && cur.image.sha256 === f.sha256) ? { ...cur, last_checked: retrieved_at, last_attempt: null, collector_version: COLLECTOR_VERSION } : null);
    if (up.wrote) { await logRun(env, 'sunface', ms, 'ok', 200, 0, 0, `unchanged: same bytes as ${before.image.id}; its file-updated time ${before.image.file_updated} kept`); return 'sunface:unchanged'; }
    // the pointer moved to another image meanwhile: judge this fetch against what is there NOW, not against the stale read
    before = up.cur;
  }
  // replay: bytes already recorded once must not come back as a new picture under a different time
  if (before.previous && before.previous.sha256 === f.sha256) return sunFail(env, ms, 'rejected', 'picture already published earlier', 200, 'sha256 ' + f.sha256.slice(0, 16) + ' is the previous image; Last-Modified now ' + JSON.stringify(f.last_modified));
  const seenKey = SUNFACE.SEEN + f.sha256 + '.json';
  let mark = null; { const o = await env.R2.get(seenKey); if (o) { mark = await o.json(); if (!mark || mark.sha256 !== f.sha256) throw new Error('seen marker does not describe these bytes'); } }   // an unreadable or foreign marker throws: the run fails and nothing is published
  const stamp = sunStamp(f.last_modified, retrievedMs);
  // a marker with the SAME file-updated time is an earlier attempt at this very publication that did not finish; any other time is a replay
  if (mark && (!stamp || mark.file_updated !== stamp.iso)) return sunFail(env, ms, 'rejected', 'picture already published earlier', 200, 'sha256 ' + f.sha256.slice(0, 16) + ' recorded with file-updated ' + mark.file_updated + '; Last-Modified now ' + JSON.stringify(f.last_modified));
  if (!stamp) return sunFail(env, ms, 'rejected', 'no trustworthy timestamp', 200, 'Last-Modified: ' + JSON.stringify(f.last_modified));
  const id = stamp.iso.replace(/[-:]/g, '').replace('Z', 'Z') + '-' + f.sha256.slice(0, 16);
  const key = SUNFACE.PREFIX + id + '/' + SUNFACE.FILE;
  const image = { id, file: SUNFACE.FILE, key, path: `/snapshot/sunface/${id}/${SUNFACE.FILE}`, type: 'image/jpeg', bytes: f.bytes, sha256: f.sha256, w: SUNFACE.W, h: SUNFACE.H,
    observed_at: null, file_updated: stamp.iso, retrieved_at, source_url: SUNFACE.URL, last_modified_header: f.last_modified, run: new Date(ms).toISOString() };
  // newer-than-current is decided against the pointer as it is at write time, inside the conditional update
  const older = cur => cur.image && Date.parse(cur.image.file_updated) >= stamp.ms;
  if (older(before)) return sunFail(env, ms, 'rejected', 'timestamp not newer than the current image', 200, `${stamp.iso} vs ${before.image.file_updated} (different bytes)`);
  // HISTORY FIRST. The replay record is written before anything can be published, and a failure here stops the run:
  // an image never reaches the pointer without its marker, so it cannot later age out of the current/previous pair unrecorded.
  // The outgoing current image is recorded again here as well (create-only, so a marker that exists is left alone).
  // record() returns the marker that now stands for those bytes: ours if the create-only write won, otherwise the one that was
  // already there (or that another run wrote between our lookup above and this write), read back and checked to be about the same bytes.
  const record = async (sha, rec) => {
    const k = SUNFACE.SEEN + sha + '.json';
    const r = await env.R2.put(k, JSON.stringify(rec), { httpMetadata: { contentType: 'application/json' }, onlyIf: { etagDoesNotMatch: '*' } });
    if (r !== null) return rec;
    const o = await env.R2.get(k); if (!o) throw new Error('marker neither written nor present');
    const m = await o.json(); if (!m || m.sha256 !== sha || typeof m.file_updated !== 'string') throw new Error('existing marker does not describe these bytes');
    return m;
  };
  let standing;
  try {
    standing = await record(f.sha256, { sha256: f.sha256, id, file_updated: stamp.iso, recorded_at: retrieved_at });
    if (before.image) await record(before.image.sha256, { sha256: before.image.sha256, id: before.image.id, file_updated: before.image.file_updated, recorded_at: retrieved_at, backfilled: true });
  } catch (e) { return sunFail(env, ms, 'down', 'history record could not be written', 200, String(e).slice(0, 160)); }
  // THE MARKER DECIDES. If the marker that stands for these bytes carries another file-updated time (it lost a race, or was there all along),
  // this fetch is a replay under a new time and is refused. Only an identical time may go on (resuming an unfinished publication).
  if (standing.file_updated !== stamp.iso) return sunFail(env, ms, 'rejected', 'picture already published earlier', 200, 'sha256 ' + f.sha256.slice(0, 16) + ' is recorded with file-updated ' + standing.file_updated + '; this fetch says ' + stamp.iso);
  await env.R2.put(key, f.buf, { httpMetadata: { contentType: 'image/jpeg' } });
  const back = await env.R2.get(key), bb = back ? await back.arrayBuffer() : null;
  if (!bb || bb.byteLength !== f.bytes || await sha256Bytes(bb) !== f.sha256) return sunFail(env, ms, 'down', 'stored copy does not read back', 200, key);
  const strip = x => x ? { ...x } : null;
  const up = await sunUpdate(env, cur => (older(cur) || (cur.image && cur.image.sha256 === f.sha256) || (cur.previous && cur.previous.sha256 === f.sha256)) ? null : { ...sunEmpty(), image, previous: strip(cur.image), last_checked: retrieved_at, last_attempt: null });
  if (!up.wrote) { await logRun(env, 'sunface', ms, 'ok', 200, 0, 0, `superseded: another run published first; ${id} not published`); return 'sunface:superseded'; }
  await logRun(env, 'sunface', ms, 'ok', 200, 1, f.bytes, `image ${id}; file updated ${stamp.iso}; observation time not known`);
  return 'sunface:published ' + id;
}
/* ---- Stage B probe: POST /admin/probe/earthview (0.6.21; EARTH-FROM-SPACE-STAGE-B-PROPOSAL rev 2) ----
 * ONE validation of the newest GeoColour frame inside this isolate, with the collector's own decode and comparison, and NOTHING stored.
 * - evProbeOnce() is given no env: it has no handle on the bucket, the database or a secret. The route reads env only for the key and the gate.
 * - It calls none of evState, evFail, evUpdate, evCollect, evCleanup, evGuard, evAdmin, logRun or guarded, and uses no cache.
 * - At most 3 upstream requests (frame list, picture, check image), no retry, one deadline for the whole run (EVB.DEADLINE_MS).
 * - Runs only while EARTHVIEW_ENABLED is unset; with it unset neither the scheduled nor the manual collector runs (JOBS above).
 * - One at a time PER ISOLATE (EVB.busy). The latch cannot see another isolate and is not a cap on upstream requests.
 * - In memory only, lost with the isolate: the latch and the counters below. Log lines carry no header and no key. */
const EVB = { DEADLINE_MS: 150000, BUILD: 'stage-b-1', id: null, born: null, fetches: 0, scheduled: 0, crons: {}, validations: 0, last_attempt: null, busy: false };
/** Called once per invocation of either handler, as its FIRST statement: names the isolate on its first request and counts what it
 * has served. 0.6.22: returns a frozen SNAPSHOT of the counts as they stood BEFORE this invocation was added, taken here, before any
 * await. "Before" values are read from this snapshot and never from the live counters later (another invocation may have begun
 * while this one awaited). crons_before is a copy of the per-cron tally of scheduled invocations begun earlier in this isolate. */
function evbSeen(kind, cron) {
  if (EVB.id === null) { EVB.id = evHex(4); EVB.born = Date.now(); }
  const c = kind === 'scheduled' ? (cron === undefined || cron === null ? 'unknown' : String(cron)) : null;
  const snap = Object.freeze({ kind: kind === 'fetch' ? 'fetch' : 'scheduled', cron: c, isolate: EVB.id, isolate_age_ms: Date.now() - EVB.born,
    scheduled_before: EVB.scheduled, fetches_before: EVB.fetches, crons_before: Object.freeze({ ...EVB.crons }) });
  if (kind === 'fetch') EVB.fetches++; else { EVB.scheduled++; EVB.crons[c] = (EVB.crons[c] || 0) + 1; }
  return snap;
}
/* ---- 0.6.22: admission of collector runs, the key in a header, and two log lines per run (STORAGE-TO-RELEASE proposal rev 2.2) ---- */
const EV_WINDOW_MAX_MS = 48 * 3600 * 1000;
/** A UTC time on a ten-minute mark, written exactly as 2026-11-24T06:00:00Z; anything else is null. */
function evMark(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(v)) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) || new Date(t).toISOString() !== v.replace(/Z$/, '.000Z') ? null : t;
}
/** May the SCHEDULED path run the collector for the trigger whose scheduled time is ms? { admit: true } or { admit: false, why }.
 * Admits only with the gate at "1" and a readable window FROM <= ms < UNTIL of at most 48 hours. It selects scheduled TIMES: it is
 * not a wall-clock deadline (an admitted trigger delivered late still runs), it does not deduplicate a time delivered twice, and it
 * does not count requests. Everything else fails closed. Reads env only. */
function evAdmit(env, ms) {
  const g = env.EARTHVIEW_ENABLED;
  if (g !== '1') return { admit: false, why: g === undefined ? 'EARTHVIEW_ENABLED unset' : g === 'manual' ? 'EARTHVIEW_ENABLED is manual' : 'EARTHVIEW_ENABLED has an unknown value' };
  const from = evMark(env.EARTHVIEW_FROM), until = evMark(env.EARTHVIEW_UNTIL);
  if (from === null || until === null) return { admit: false, why: 'window not set or not readable' };
  if (until <= from) return { admit: false, why: 'window empty or inverted' };
  if (until - from > EV_WINDOW_MAX_MS) return { admit: false, why: 'window longer than 48 hours' };
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return { admit: false, why: 'no scheduled time' };
  if (ms < from) return { admit: false, why: 'before the window' };
  if (ms >= until) return { admit: false, why: 'after the window' };
  return { admit: true };
}
/** May the MANUAL run go ahead? Only with the gate at "manual" or "1". */
const evManualGate = env => env.EARTHVIEW_ENABLED === '1' || env.EARTHVIEW_ENABLED === 'manual' ? null : env.EARTHVIEW_ENABLED === undefined ? 'EARTHVIEW_ENABLED unset' : 'EARTHVIEW_ENABLED has an unknown value';
/** Validation counting for the collector (called from evCollect step 4). Begin: the count of validations COMPLETED in this isolate is
 * copied onto the run's own record at the statement before its validation starts; nothing is awaited in between. End: the count is
 * incremented when the validation returns, pass or refuse. Counts only: neither changes what the collector decides or stores. */
function evValidationBegin(x) { if (x) x.validations_before = EVB.validations; }
function evValidated(x, ok) { EVB.validations++; if (x) x.validated = ok; }
/** One collector run with its two log lines. "run-start" is written before anything is fetched, so it exists even if Cloudflare ends
 * the invocation during the decode; "run-end" carries validations_before and the result. exec is drawn per execution, so two
 * executions of the same scheduled time have different records. Writes nothing to storage itself. */
async function runEarthViewLogged(env, ms, trigger, inv) {
  const x = { exec: evHex(6), validations_before: null, validated: null }, at = new Date(ms).toISOString(), i = inv || null;
  console.log(JSON.stringify({ earthview: 'run-start', exec: x.exec, trigger, scheduled_time: trigger === 'scheduled' ? at : null, run: at, hub: COLLECTOR_VERSION, cron: i && i.cron,
    isolate: i && i.isolate, isolate_age_ms: i && i.isolate_age_ms, scheduled_before: i && i.scheduled_before, crons_before: i && i.crons_before, fetches_before: i && i.fetches_before }));
  let r = null; const g = await guarded(env, 'earthview', ms, async (e, m) => { r = await collectEarthView(e, m, x); });
  const result = r || g;
  console.log(JSON.stringify({ earthview: 'run-end', exec: x.exec, trigger, run: at, isolate: i && i.isolate, validations_before: x.validations_before, validated: x.validated, result }));
  return result;
}
/** The key in the Authorization header only, for the Earth from Space admin routes and the manual run. A Response to refuse with,
 * else null. Order: method, then a key in the URL (refused before any comparison), then the header. Reads nothing but env.ADMIN_KEY. */
function evAuth(req, env, url, methods) {
  const no = (status, error) => json({ layer: 'earthview', error }, status, { 'Cache-Control': 'no-store' });
  if (!methods.includes(req.method)) return no(405, methods.join(' or ') + ' only');
  if (url.searchParams.has('key')) return no(400, 'the key is not accepted in the URL; send it in the Authorization header');
  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');
  return null;
}
const EV_ADMIN_ACTIONS = ['status', 'hold', 'recover', 'sweep', 'release'];
/** The collector's validation of one delivered picture against its check image (steps 4 and 5 of evCollect), with no storage step. */
async function evProbeValidate(picBuf, chkBuf) {
  const P = EARTHVIEW.PICTURE, C = EARTHVIEW.CHECK, u8 = new Uint8Array(picBuf), sc = evJpegScans(u8), no = detail => ({ ok: false, reason: 'picture failed validation', detail });
  if (!sc.ok) return no('structure: ' + sc.reason);
  if (sc.w !== P.w || sc.h !== P.h || sc.components !== 3) return no(`size ${sc.w}x${sc.h}, ${sc.components} components`);
  if (!sc.complete) return no(`scans incomplete: ${sc.missing} coefficient positions not delivered at full precision in ${sc.scans} scans`);
  const png = await evPng(new Uint8Array(chkBuf), C.w * C.h);
  if (!png || png.w !== C.w || png.h !== C.h) return { ok: false, reason: 'check image failed validation', detail: 'does not decode as ' + C.w + 'x' + C.h + ' RGBA' };
  const dec = evDecode(u8);
  if (dec.error) return no('decode: ' + dec.error);
  if (dec.w !== P.w || dec.h !== P.h) return no(`decoded size ${dec.w}x${dec.h}`);
  const cmp = evCompare(dec, png);
  if (!cmp.ok) return { ...cmp, ok: false, reason: 'picture failed validation', detail: cmp.reason, progressive: sc.progressive, scans: sc.scans };
  return { ...cmp, ok: true, reason: null, progressive: sc.progressive, scans: sc.scans };
}
/** One observation. No env. Outcomes: validated | validation refused | served time not confirmed | fetch failed | deadline. */
async function evProbeOnce() {
  const t0 = Date.now(), dl = t0 + EVB.DEADLINE_MS, attempt = evHex(6), P = EARTHVIEW.PICTURE, C = EARTHVIEW.CHECK, iso = ms => new Date(ms).toISOString();
  const left = () => dl - Date.now(), limit = own => Math.max(1, Math.min(own, left()));
  const isolate = { id: EVB.id, started_at: EVB.born === null ? null : iso(EVB.born), age_ms: EVB.born === null ? null : t0 - EVB.born, requests_served: EVB.fetches, scheduled_runs: EVB.scheduled, validations_before: EVB.validations, previous_attempt: EVB.last_attempt };
  const say = (ev, o) => console.log(JSON.stringify({ probe: 'earthview-stage-b', attempt, build: EVB.BUILD, isolate: EVB.id, ev, at: nowIso(), ...o }));
  const out = { schema: 1, layer: 'earthview', probe: 'stage-b', attempt, build: EVB.BUILD, hub: COLLECTOR_VERSION, size: P.w, started_at: iso(t0), deadline_ms: EVB.DEADLINE_MS, isolate,
    requests_made: 0, frame_time: null, list: null, picture: null, check: null, header_ok: null, validation: null, deadline_hit: false, outcome: null, ended_at: null, wall_ms: null };
  const late = () => { if (left() > 0) return false; out.deadline_hit = true; return true; };
  const end = outcome => { const t = Date.now(); late(); out.outcome = outcome; out.ended_at = iso(t); out.wall_ms = t - t0;
    say('done', { outcome, frame_time: out.frame_time, header_ok: out.header_ok, requests_made: out.requests_made, deadline_hit: out.deadline_hit, wall_ms: out.wall_ms }); return out; };
  const failed = () => end(late() ? 'deadline' : 'fetch failed');
  say('start', { hub: COLLECTOR_VERSION, size: P.w, deadline_ms: EVB.DEADLINE_MS, isolate_state: isolate });
  // 1. The frame list: which time is newest?
  let xml = null; out.requests_made++;
  try { const r = await fetch(EARTHVIEW.CAP, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(limit(EARTHVIEW.LIST_TIMEOUT_MS)) });
    if (r.status !== 200) { try { await r.body.cancel(); } catch (_) {} out.list = { ok: false, reason: 'http error', http: r.status }; } else xml = await r.text(); }
  catch (e) { out.list = { ok: false, reason: 'no answer', detail: String(e).slice(0, 160) }; }
  if (out.list) return failed();
  const T = evLatest(xml);
  if (!T) { out.list = { ok: false, reason: 'frame list unreadable' }; return failed(); }
  out.list = { ok: true, newest: T }; out.frame_time = T;
  if (late()) return end('deadline');
  // 2. The delivered picture and the check image for exactly that time (the collector's own addresses and reader)
  const q = `&time=${T}`, picUrl = `${EARTHVIEW.MAP}&width=${P.w}&height=${P.h}&format=image/jpeg&bgcolor=${EARTHVIEW.BGCOLOR}${q}`, chkUrl = `${EARTHVIEW.MAP}&width=${C.w}&height=${C.h}&format=image/png&transparent=true${q}`;
  const side = (f, spec) => f.ok ? { ok: true, http: 200, type: spec.type, bytes: f.bytes, sha256: f.sha256, header_present: f.warn_present, header_names: f.served } : { ok: false, reason: f.reason, http: f.http, detail: f.detail || null };
  out.requests_made++; const pic = await evFetch('picture', picUrl, P, limit(EARTHVIEW.TIMEOUT_MS)); out.picture = side(pic, P);
  if (!pic.ok) return failed();
  if (late()) return end('deadline');
  out.requests_made++; const chk = await evFetch('check image', chkUrl, C, limit(EARTHVIEW.TIMEOUT_MS)); out.check = side(chk, C);
  if (!chk.ok) return failed();
  // 3. Served time: strict, on both responses
  out.header_ok = pic.served === T && chk.served === T;
  say('fetched', { frame_time: T, header_ok: out.header_ok, picture: out.picture, check: out.check });
  if (!out.header_ok) return end('served time not confirmed');
  if (late()) return end('deadline');
  // 4. The validation itself, timed
  const v0 = Date.now(); say('validate-begin', { frame_time: T });
  let v; try { v = await evProbeValidate(pic.buf, chk.buf); } catch (e) { v = { ok: false, reason: 'validation threw', detail: String((e && e.message) || e).slice(0, 160) }; }
  const v1 = Date.now(); out.validation = { ...v, started_at: iso(v0), ended_at: iso(v1), wall_ms: v1 - v0 };
  EVB.validations++; EVB.last_attempt = attempt;
  say('validated', { frame_time: T, ...out.validation });
  return end(v.ok ? 'validated' : 'validation refused');
}
/** The route. Anything but a POST with the key in the Authorization header and no query string is refused before anything is done. */
async function evProbeRoute(req, env, url) {
  const NS = { 'Cache-Control': 'no-store' }, no = (status, error) => json({ layer: 'earthview', probe: 'stage-b', error }, status, NS);
  if (req.method !== 'POST') return no(405, 'POST only');
  if (url.search) return no(400, 'no query string is accepted');
  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');
  if (env.EARTHVIEW_ENABLED !== undefined) return no(409, 'collection is on (EARTHVIEW_ENABLED is set)');
  if (EVB.busy) return no(409, 'busy');
  EVB.busy = true;
  try { return json(await evProbeOnce(), 200, NS); }
  catch (e) { return json({ layer: 'earthview', probe: 'stage-b', outcome: 'internal error', detail: String((e && e.message) || e).slice(0, 200) }, 500, NS); }
  finally { EVB.busy = false; }
}

/** /admin/probe/sunface — EXACTLY ONE upstream request (the image). Stores and publishes nothing. Reports what the projection and the time rules need. */
async function sunProbe() {
  const t0 = Date.now(), f = await sunFetch(), now = Date.now();
  const stamp = f.ok ? sunStamp(f.last_modified, now) : null;
  return { probe: 'sunface', made_request: true, upstream_requests: 1, url: SUNFACE.URL, user_agent_set: SUNFACE.UA, user_agent_receipt: 'not verified: this is the header the hub set on its request; the upstream does not echo it',
    ok: f.ok, http: f.ok ? 200 : f.http, reason: f.ok ? null : f.reason, detail: f.ok ? null : (f.detail || null), ms: now - t0,
    bytes: f.ok ? f.bytes : null, sha256: f.ok ? f.sha256 : null, jpeg: f.ok ? { w: SUNFACE.W, h: SUNFACE.H, structure: 'checked' } : null,
    last_modified_header: f.ok ? f.last_modified : null, date_header: f.ok ? f.date : null, etag_header: f.ok ? f.etag : null,
    file_updated: stamp ? stamp.iso : null, file_age_s: stamp ? Math.round((now - stamp.ms) / 1000) : null, timestamp_trustworthy: !!stamp,
    observed_at: null, observed_at_note: 'not known to the hub', stored: false, published: false, at: nowIso() };
}
/** GET /snapshot/sunface/meta and /snapshot/sunface/<id>/sun.jpg. A file is served only for the current or previous image, and only if the stored bytes match the pointer. */
async function sunRoute(env, p) {
  const none = (status, reason) => json({ layer: 'sunface', status: 'unavailable', reason }, status, { 'Cache-Control': 'no-store' });
  let cur; try { cur = await getJson(env, SUNFACE.POINTER); } catch (e) { return none(503, 'unreadable'); }
  if (p.length === 3 && p[2] === 'meta') {
    const strip = x => x ? { ...x, key: undefined } : x;
    const body = cur ? { ...cur, image: strip(cur.image), previous: strip(cur.previous) } : { schema: 1, layer: 'sunface', image: null, previous: null, last_checked: null, last_attempt: null, age_limit_s: SUNFACE.AGE_LIMIT_S };
    return json({ ...body, now: nowIso() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (p.length !== 4 || !cur) return none(404, 'not found');
  const x = [cur.image, cur.previous].find(f => f && f.id === p[2] && f.file === p[3]);
  if (!x) return none(404, 'not found');
  let buf; try { const o = await env.R2.get(x.key); buf = o ? await o.arrayBuffer() : null; } catch (e) { return none(503, 'unreadable'); }
  if (!buf) return none(503, 'missing');
  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');
  return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': SUNFACE.CACHE_FILE, 'ETag': '"' + x.sha256 + '"', ...CORS } });
}
async function guarded(env, layer, ms, fn) {
  try { await fn(env, ms); return layer + ':ran'; }
  catch (e) {
    const note = 'uncaught: ' + String(e).slice(0, 200);
    if (layer === 'firms' && env.FIRMS_PIPELINE === 'v2') { try { await logRun(env, layer, ms, 'down', 0, 0, 0, note); await fvDownNoInput(env, ms, note); } catch (_) {} }   // v2 never calls the unconditional writeDown
    else if (layer === 'drifters') { try { await driftFail(env, ms, 'internal_error', note, 0); } catch (_) {} }
    else if (layer === 'dustrgb') { try { await dustFail(env, ms, 'internal error', 0, note); } catch (_) {} }
    else if (layer === 'earthview') { try { await evFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // never the generic writeDown
    else if (layer === 'wind') { try { await windFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // 0.6.16: never the generic writeDown
    else if (layer === 'sunface') { try { await sunFail(env, ms, 'down', 'internal error', 0, note); } catch (_) {} }   // 0.6.13: never the generic writeDown
    else if (layer === 'skycraft') { try { await craftFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // 0.6.12: never the generic writeDown   // 0.6.11: never the generic writeDown (no cells, no envelope)   // 0.6.8: buoys never call the unconditional writeDown
    else try { await writeDown(env, layer, ms, note, 0); } catch (_) {}
    return layer + ':threw ' + String(e).slice(0, 80); }
}

/** The wind collector under the guard, answering with the collector's own result ("wind:published <run>", "wind:down <reason>", …)
 * so that a handled failure is never reported as a plain "ran". */
async function runWind(env, ms) { let r = null; const g = await guarded(env, 'wind', ms, async (e, m) => { r = await collectWind(e, m); }); return r || g; }
const JOBS = {
  five: async (env, ms, _manual, inv) => {
    const a = (await Promise.all([
      guarded(env, 'usgs', ms, collectUsgs),
      env.OPENSKY_ENABLED === '1' ? guarded(env, 'opensky', ms, collectOpenskyWorld) : 'opensky:parked',
    ])).join('; ');
    // Earth from Space rides this trigger every other tick (ten minutes), awaited AFTER the collectors above have finished.
    // 0.6.22: admitted only by evAdmit (gate "1" and the trigger's scheduled time inside the window). Not admitted: no request, nothing read or written.
    const adm = evAdmit(env, ms);
    const e = !adm.admit ? 'earthview:not scheduled (' + adm.why + ')' : (new Date(ms).getUTCMinutes() % EARTHVIEW.EVERY_MIN) < 5 ? await runEarthViewLogged(env, ms, 'scheduled', inv) : 'earthview:skipped (every ten minutes)';
    return a + '; ' + e;
  },
  // manual: POST /admin/run/earthview (key in the Authorization header). Refused unless the gate is "manual" or "1" (0.6.22), BEFORE the
  // collector and its run-log wrapper: no request, no validation, nothing read or written. With the gate unset nothing collects (Stage B relies on it).
  earthview: async (env, ms, _manual, inv) => { const why = evManualGate(env); return why ? 'earthview:not run (' + why + ')' : runEarthViewLogged(env, ms, 'manual', inv); },
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
  sunface: async (env, ms) => guarded(env, 'sunface', ms, collectSunface),   // manual: /admin/run/sunface (admin key; ignores the gate; one upstream request)
  skycraft: async (env, ms) => guarded(env, 'skycraft', ms, collectSkycraft),   // manual: /admin/run/skycraft (admin key; ignores the gate and the hour; two upstream requests, one at a time)
  wind: async (env, ms) => runWind(env, ms),   // manual: /admin/run/wind (admin key; ignores the gate; runs the collector once). The result is the collector's own word: published, down, superseded or nothing newer.
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
    const b = await hourlyBatch(env, ms);
    // Dust runs LAST: its picture can take over half a minute, and nothing else in the hourly job may wait on it
    const u = env.DUSTRGB_ENABLED !== '1' ? 'dustrgb:not scheduled (DUSTRGB_ENABLED unset)' : (!manual && DUSTRGB.RUN_HOURS_UTC.includes(hr)) ? await guarded(env, 'dustrgb', ms, collectDustRgb) : 'dustrgb:skipped (runs 06 and 18 UTC)';
    // Sky spacecraft: once a day, after everything else (two small Horizons requests, one at a time)
    const v = env.SKYCRAFT_ENABLED !== '1' ? 'skycraft:not scheduled (SKYCRAFT_ENABLED unset)' : (!manual && hr === SKYCRAFT.RUN_HOUR_UTC) ? await guarded(env, 'skycraft', ms, collectSkycraft) : 'skycraft:skipped (runs 05 UTC)';
    // Sun face: every scheduled hour, last of all (one ~200 KB request); never on a manual hourly run
    const w = env.SUNFACE_ENABLED !== '1' ? 'sunface:not scheduled (SUNFACE_ENABLED unset)' : !manual ? await guarded(env, 'sunface', ms, collectSunface) : 'sunface:skipped (manual hourly run)';
    // Wind: every scheduled hour, after everything else; never on a manual hourly run. With the flag unset: no request, nothing written.
    const x = env.WIND_ENABLED !== '1' ? 'wind:not scheduled (WIND_ENABLED unset)' : !manual ? await runWind(env, ms) : 'wind:skipped (manual hourly run)';
    return { swpc: k, co2: c, seaice: i, satellites: s, drifters: d, plastic: p, dustrgb: u, skycraft: v, sunface: w, wind: x, batch: b };
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
    if (layer === AIRCRAFT_LAYER) {   // 0.6.18: latitude and longitude only, rounded; nothing else about an aircraft is accepted
      if (!aircraftFieldsOk(e.record_fields)) return 'aircraft records may carry lat,lng only (record_fields must be [] or ["lat","lng"])';
      if (e.record_fields.length === 0 && e.records.length) return 'aircraft records present without record_fields';
      if (e.records.length > AIRCRAFT_MAX_RECORDS) return 'too many aircraft records';
      for (const r of e.records) {
        if (!Array.isArray(r) || r.length !== 2 || typeof r[0] !== 'number' || typeof r[1] !== 'number' || !Number.isFinite(r[0]) || !Number.isFinite(r[1]) || r[0] < -90 || r[0] > 90 || r[1] < -180 || r[1] > 180) return 'aircraft record is not a latitude and longitude';
        if (!aircraftRowOk(r)) return 'aircraft positions must be rounded to ' + AIRCRAFT_STEP_DEG + ' degree';
      }
    }
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
  const sentRecords = Array.isArray(e.records) ? e.records.length : 0;
  if (layer === AIRCRAFT_LAYER) e = aircraftProject(e, aircraftOn(env));   // 0.6.18: from here on only the hub's own schema exists; nothing else the uploader sent is kept
  e.received_at = nowIso();                                          // third timestamp: observed (window_end) / retrieved_at / received_at
  e.ingested_from = layer === AIRCRAFT_LAYER ? aircraftProject({ ingested_from: req.headers.get('User-Agent') || '' }, false).ingested_from : (req.headers.get('User-Agent') || '').slice(0, 120);
  e.stale_after_s = e.stale_after_s || STALE_AFTER_S[layer] || 900;
  if (layer === 'ships') {   // 0.6.19: ships has its own publication rule (SHIPS PUBLICATION RULE): a failure or an overlong sample never replaces the last eligible sample
    const stamp = isoMinute(scheduledMs), H = { 'Cache-Control': 'no-store' };
    if (e.source_status === 'down') {
      const raw = String(e.note || ''), phrase = SHIPS_COLLECTOR_PHRASES.includes(raw) ? raw : SHIPS_PHRASE.collector;
      const outcome = await shipsFailed(env, scheduledMs, 'ingested down: ' + raw, phrase, e.ingested_from, 0);
      return json({ ok: true, layer, published: outcome === 'kept last sample' ? 'failure recorded; last sample kept' : outcome === 'down envelope' ? 'cells only (down)' : outcome, snapshot: stamp }, 200, H);
    }
    if (e.overlong_sample === true) {
      const o = await shipsOverlong(env, scheduledMs, e, 'ingested (not published: overlong sample) from ' + e.ingested_from + ' v' + e.collector_version);
      return json({ ok: true, layer, snapshot: stamp, records: e.records.length, cells: Object.keys(e.cells).length, bytes: o.bytes, published: 'not published: overlong sample' + (o.outcome === 'kept last sample' ? '; last sample kept' : o.outcome === 'down envelope' ? '; nothing to keep' : '; ' + o.outcome) }, 200, H);
    }
    const r = await shipsPublishEligible(env, scheduledMs, e);
    await logRun(env, layer, scheduledMs, e.source_status, 200, e.records.length, r.bytes, (r.published === 'latest' ? 'ingested from ' : 'ingested (' + r.published.split(' (')[0] + (r.latest_run ? ': older than latest ' + r.latest_run : '') + shipsRepairNote(r.repair) + ') from ') + e.ingested_from + ' v' + e.collector_version);
    return json({ ok: true, layer, snapshot: stamp, records: e.records.length, cells: Object.keys(e.cells).length, bytes: r.bytes, ...(r.published === 'latest' ? {} : { published: r.published }), ...(r.repair && r.repair !== 'none' ? { counts_repair: r.repair } : {}) }, 200, H);
  }
  if (e.source_status === 'down') {
    await writeDown(env, layer, scheduledMs, 'ingested down: ' + (layer === AIRCRAFT_LAYER ? e.note : (e.note || '')), 0);
    return json({ ok: true, layer, published: 'cells only (down)', snapshot: isoMinute(scheduledMs) }, 200, { 'Cache-Control': 'no-store' });
  }
  // Ordering guard (review round 4): an upload older than what latest/ already holds is archived but must not become "latest".
  const cur = await getJson(env, `latest-cells/${layer}.json`);
  if (cur && cur.retrieved_at && Date.parse(cur.retrieved_at) > Date.parse(e.retrieved_at)) {
    const stamp = isoMinute(scheduledMs);
    const noRecords = layer === AIRCRAFT_LAYER ? aircraftNoRecords(e) : { ...e, records: undefined, record_fields: undefined, record_format: undefined };
    const bytes = await putJson(env, `snapshots/${layer}/${stamp}.json`, layer === AIRCRAFT_LAYER ? noRecords : e);   // aircraft: no dated copy of positions
    await putJson(env, `cells/${layer}/${stamp}.json`, noRecords);
    await logRun(env, layer, scheduledMs, e.source_status, 200, e.records.length, bytes, 'ingested (archive only: older than latest ' + cur.retrieved_at + ') from ' + e.ingested_from);
    return json({ ok: true, layer, snapshot: stamp, published: 'archive only (older than latest)', latest_retrieved_at: cur.retrieved_at }, 200, { 'Cache-Control': 'no-store' });
  }
  const bytes = await writeSnapshot(env, layer, scheduledMs, e);    // same path as internal collectors: snapshot, cells, latest, latest-cells
  await logRun(env, layer, scheduledMs, e.source_status, 200, e.records.length, bytes, 'ingested from ' + e.ingested_from + ' v' + e.collector_version);
  return json({ ok: true, layer, snapshot: isoMinute(scheduledMs), records: e.records.length, cells: Object.keys(e.cells).length, bytes,
    ...(layer === AIRCRAFT_LAYER ? { positions: e.records.length ? 'stored' : sentRecords ? 'not stored (AIRCRAFT_POSITIONS is not 1)' : 'none sent' } : {}) }, 200, { 'Cache-Control': 'no-store' });
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
    const inv = evbSeen('scheduled', event.cron);   // 0.6.22: the snapshot is taken here, first, before any await
    const job = jobForCron(event.cron);
    if (!job) { console.log('unknown cron', event.cron); return; }
    const p = JOBS[job](env, event.scheduledTime, undefined, inv).then(r => console.log(job, typeof r === 'string' ? r : JSON.stringify(r))).catch(e => console.log(job, 'failed', String(e)));
    ctx.waitUntil(p);
    return p;
  },

  async fetch(req, env) {
    const inv = evbSeen('fetch');   // 0.6.22: snapshot first, before any await
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const p = url.pathname.split('/').filter(Boolean);
    if (p[0] === 'ingest') {
      if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
      return ingest(req, env, p[1] || '');
    }
    if (p[0] === 'admin' && p[1] === 'aircraft' && p[2] === 'clear-positions') return aircraftClear(req, env, url);   // 0.6.18
    if (p[0] === 'admin' && p[1] === 'reaggregate') {
      if (req.method !== 'POST') return json({ error: 'POST only (this can write history)' }, 405);
      return reaggregate(req, env, url, p[2] || '');
    }
    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'earthview' && p.length === 3) return evProbeRoute(req, env, url);   // 0.6.21 Stage B: POST, key in a header, nothing stored
    if (p[0] === 'admin' && p[1] === 'earthview') {   // Earth from Space storage: status, hold, recover, sweep, release. A dry run unless POST with apply=1.
      // 0.6.22: exact path and a known action, then method, then the key (header only), all BEFORE anything is read from storage.
      const NS = { 'Cache-Control': 'no-store' };
      if (p.length !== 3 || !EV_ADMIN_ACTIONS.includes(p[2])) return json({ layer: 'earthview', error: 'unknown action', actions: EV_ADMIN_ACTIONS }, 404, NS);
      const refuse = evAuth(req, env, url, ['GET', 'POST']); if (refuse) return refuse;
      for (const k of url.searchParams.keys()) if (k !== 'apply' && k !== 'plan') return json({ layer: 'earthview', error: 'unknown parameter' }, 400, NS);
      try { const r = await evAdmin(env, p[2], req.method === 'POST' && url.searchParams.get('apply') === '1', url.searchParams.get('plan')); return json(r.body, r.status, NS); }
      catch (e) { return json({ layer: 'earthview', action: p[2], applied: false, refused: e instanceof EvStop ? e.reason : 'internal error', detail: String((e && e.detail) || e).slice(0, 300) }, e instanceof EvStop ? 409 : 500, NS); }
    }
    if (p[0] === 'admin' && p[1] === 'run' && p[2] === 'earthview') {   // 0.6.22: the manual collector run. POST, key in a header, no query string.
      const NS = { 'Cache-Control': 'no-store' };
      if (p.length !== 3) return json({ layer: 'earthview', error: 'not found' }, 404, NS);
      const refuse = evAuth(req, env, url, ['POST']); if (refuse) return refuse;
      if (url.search) return json({ layer: 'earthview', error: 'no query string is accepted' }, 400, NS);
      const t0 = Date.now();
      try { const r = await JOBS.earthview(env, t0, true, inv); return json({ job: 'earthview', result: r, wall_ms: Date.now() - t0 }, 200, NS); }
      catch (e) { return json({ job: 'earthview', error: String(e).slice(0, 300), wall_ms: Date.now() - t0 }, 500, NS); }
    }
    if (p[0] === 'health') {   // 0.5.3: external monitor checks; HEAD is the UptimeRobot HTTP monitor's default request
      if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'GET or HEAD only' }, 405, { 'Cache-Control': 'no-store' });
      return health(req, env, p[1] || '', p[2] || '');
    }
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405);

    if (p[0] === 'snapshot' && p[1] === 'wind') return windRoute(env, p);   // 0.6.16: manifest + the current and previous revision's grids; outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'earthview') return evRoute(env, p);   // Earth from Space: record plus held pictures; outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'dustrgb') return dustRoute(env, p);   // 0.6.11: pointer + the current and previous frame files; outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'arts' && p.length === 2) return artsSnapshot(env);   // 0.6.2: fixed catalogue, outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'timeline') return timelineRoute(env, url.pathname);   // 0.6.3 legacy URL (pinned to R1) + 0.6.4 /<revision>; outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'sunface') return sunRoute(env, p);   // 0.6.13: the Sun's Earth-facing side (pointer + current/previous image); outside LAYERS
    if (p[0] === 'snapshot' && p[1] === 'skycraft') return craftSnapRoute(env, p);   // 0.6.12: Parker hub snapshot (pointer + current/previous); outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'skycraft') return craftCatRoute(env, url.pathname);   // 0.6.12: the two dated examples, pinned
    if (p[0] === 'catalogue' && p[1] === 'sky') return skyRoute(env, url.pathname);   // 0.6.5 versioned only; outside LAYERS
    if (p[0] === 'catalogue' && p[1] === 'oceanheat') return oceanHeatRoute(env, url.pathname);   // 0.6.7 versioned files only; outside LAYERS

    if (p[0] === 'snapshot' || p[0] === 'cells') {
      const layer = p[1];
      if (!LAYERS.includes(layer)) return json({ error: 'unknown layer', layers: LAYERS }, 404);
      if (layer === AIRCRAFT_LAYER) return aircraftRoute(env, p[0]);   // 0.6.18: explicit schema, expiry at the hub, no-store
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

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'sunface') {   // 0.6.13: exactly one request for the SDO image; stores and publishes nothing
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      return json(await sunProbe(), 200, { 'Cache-Control': 'no-store' });
    }

    if (p[0] === 'admin' && p[1] === 'probe' && p[2] === 'skycraft') {   // 0.6.12: exactly one Horizons request (data sheet only); stores and publishes nothing
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      return json(await craftProbe(env), 200, { 'Cache-Control': 'no-store' });
    }

    if (p[0] === 'admin' && p[1] === 'run') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
      const job = p[2];
      if (!JOBS[job]) return json({ error: 'unknown job', jobs: Object.keys(JOBS) }, 404);
      const t0 = Date.now();
      try { const r = await JOBS[job](env, Date.now(), true); return json({ job, result: r, wall_ms: Date.now() - t0 }, 200, { 'Cache-Control': 'no-store' }); }
      catch (e) { return json({ job, error: String(e), wall_ms: Date.now() - t0 }, 500, { 'Cache-Control': 'no-store' }); }
    }

    return json({ name: 'Mother Earth collector', version: COLLECTOR_VERSION, history: await historyState(env), endpoints: ['/snapshot/<layer>', '/cells/<layer>', '/place/g4/<row>_<col>', '/elements/satellites', '/elements/orbital', '/status', '/health/<check>/<layer>', '/snapshot/arts', '/catalogue/timeline', '/catalogue/timeline/<revision>', '/catalogue/sky/<revision>', '/catalogue/skycraft/<revision>', '/snapshot/skycraft/meta', '/catalogue/oceanheat/<revision>/<file>', '/snapshot/dustrgb/meta', '/snapshot/dustrgb/<frame>/<file>'], layers: LAYERS, catalogues: { arts: { path: '/snapshot/arts', kind: 'fixed catalogue snapshot', source_date: '2026-11-02' }, timeline: { path: '/catalogue/timeline', kind: 'fixed catalogue', revision: TIMELINE_LEGACY, current: TIMELINE_CURRENT, versioned_path: '/catalogue/timeline/<revision>', revisions: Object.keys(TIMELINE_REVISIONS) }, sky: { kind: 'fixed catalogue', versioned_path: '/catalogue/sky/<revision>', current: SKY_CURRENT, scene: SKY_SCENE_CURRENT, revisions: Object.keys(SKY_REVISIONS) }, oceanheat: { kind: 'fixed snapshot files', versioned_path: '/catalogue/oceanheat/<revision>/<file>', current: OCEANHEAT_CURRENT, revisions: Object.keys(OCEANHEAT_REVISIONS) } },
      promise: 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.' });
  },
};
