// Earth from Space — builds the two THROWAWAY Workers of reviews/2026-11-23-earth-from-space-alert-test-plan.md (rev 1.2).
//
//   node --no-warnings phase1/evh-fixture/build.mjs alert <T0>   [outDir]   -> evh-alert-worker.js   (plan sections 2 to 6; NO bindings)
//   node --no-warnings phase1/evh-fixture/build.mjs d1    <B>    [outDir]   -> evh-d1-worker.js, seed-schema.sql, seed-S1.sql ... seed-S0.sql,
//                                                                              seed-clear.sql                (plan section 7; ONE binding: DB)
//
// T0 and B are UTC times on a ten-minute mark, written exactly as 2026-11-26T08:00:00Z.
//
// Neither Worker is the hub. Nothing here deploys, creates or contacts anything: this script only reads phase1/worker.js and
// phase1/schema.sql and writes files. The health code is COPIED from phase1/worker.js, byte for byte, by the rules in SPANS below;
// the build stops if a span is not found exactly once. Everything else in the output is fixture and is marked as such.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WORKER_PATH = path.join(HERE, '..', 'worker.js');
export const SCHEMA_PATH = path.join(HERE, '..', 'schema.sql');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

/** What is copied from the hub, in the order it is written out. `line`: one whole line starting with this text.
 * `block`: from the line starting with this text to the first later line that is exactly "}". */
export const SPANS = [
  { name: 'COLLECTOR_VERSION', line: 'const COLLECTOR_VERSION = ' },
  { name: 'CORS', line: 'const CORS = ' },
  { name: 'json', block: 'function json(obj, status = 200, extra = {}) {' },
  { name: 'redactText', block: 'function redactText(env, s, tokens = true) {' },
  { name: 'healthNote', line: 'function healthNote(env, s) ' },
  { name: 'HEALTH_SKEW_MS', line: 'const HEALTH_SKEW_MS = ' },
  { name: 'EV_STOP', line: 'const EV_STOP = ' },
  { name: 'EV_WINDOW_MAX_MS', line: 'const EV_WINDOW_MAX_MS = ' },
  { name: 'evMark', block: 'function evMark(v) {' },
  { name: 'EVH', line: 'const EVH = ' },
  { name: 'EVH_POST_CHECK', line: 'const EVH_POST_CHECK = ' },
  { name: 'EVH_FETCH_FAIL', line: 'const EVH_FETCH_FAIL = ' },
  { name: 'evhKind', block: 'function evhKind(row) {' },
  { name: 'evhConfig', block: 'function evhConfig(env) {' },
  { name: 'evhEvaluate', block: 'async function evhEvaluate(env, nowMs) {' },
  { name: 'evhSafe', line: 'const evhSafe = ' },
  { name: 'healthEvRuns', line: 'const healthEvRuns = ' },
  { name: 'healthEvTrial', line: 'const healthEvTrial = ' },
  { name: 'health', block: 'async function health(req, env, check, layer) {' },
];

/** The copied spans, each the exact text of the source (no trailing newline). Throws unless each is found exactly once. */
export function extractSpans(src) {
  const lines = src.split('\n');
  return SPANS.map(sp => {
    const head = sp.line || sp.block;
    const hits = []; lines.forEach((l, i) => { if (l.startsWith(head)) hits.push(i); });
    if (hits.length !== 1) throw new Error(`span ${sp.name}: found ${hits.length} times, need exactly 1`);
    let end = hits[0];
    if (sp.block) { end = lines.indexOf('}', hits[0] + 1); if (end < 0) throw new Error(`span ${sp.name}: no closing line`); }
    const text = lines.slice(hits[0], end + 1).join('\n');
    if (!src.includes(text)) throw new Error(`span ${sp.name}: not a contiguous part of the source`);
    return { name: sp.name, text, first_line: hits[0] + 1, last_line: end + 1 };
  });
}
/** The one query the health code makes, read out of the copied evhEvaluate so the fixtures cannot hold a different one. */
export function productionSql(spans) {
  const m = /env\.DB\.prepare\('([^']+)'\)/g, t = spans.find(s => s.name === 'evhEvaluate').text, all = [...t.matchAll(m)];
  if (all.length !== 1) throw new Error(`expected exactly one query in evhEvaluate, found ${all.length}`);
  return all[0][1];
}
export function mark(v, what) {
  if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(v)) throw new Error(`${what} must be a UTC ten-minute mark written like 2026-11-26T08:00:00Z`);
  const t = Date.parse(v);
  if (Number.isNaN(t) || new Date(t).toISOString() !== v.replace(/Z$/, '.000Z')) throw new Error(`${what} is not a real time`);
  return t;
}

const copiedBlock = (spans, srcSha, srcBytes) => [
  `/* ======================= COPIED, byte for byte, from phase1/worker.js =======================`,
  ` * source sha256 ${srcSha}, ${srcBytes} bytes. ${spans.length} spans; each is a contiguous part of that file.`,
  ` * ${spans.map(s => `${s.name} (${s.first_line}${s.last_line !== s.first_line ? '-' + s.last_line : ''})`).join(', ')}`,
  ` * health() also names four handlers of other layers that are NOT copied. They are reached only for a layer other than`,
  ` * earthview, and the fixture router below never passes one. ========================================================== */`,
  ...spans.map(s => s.text),
  `/* ======================= end of the copied code ======================= */`,
].join('\n');

const ROUTER_COMMON = `
/* FIXTURE. The router. Only these two exact paths, by GET or HEAD, reach the copied health(). Everything else is answered here. */
const FX_PATHS = { '/health/runs/earthview': ['runs', 'earthview'], '/health/trial/earthview': ['trial', 'earthview'] };
const FX_NOSTORE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' };
function fxRoute(req) {
  let p; try { p = new URL(req.url).pathname; } catch (_) { p = ''; }
  const hit = Object.prototype.hasOwnProperty.call(FX_PATHS, p) ? FX_PATHS[p] : null;
  if (!hit) return { res: new Response(req.method === 'HEAD' ? null : JSON.stringify({ error: 'not found' }), { status: 404, headers: FX_NOSTORE }) };
  if (req.method !== 'GET' && req.method !== 'HEAD') return { res: new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: { ...FX_NOSTORE, Allow: 'GET, HEAD' } }) };
  return { hit };
}`;

/** The alert-test Worker (plan sections 2 to 6). No bindings: it never reads its env argument. */
export function buildAlert(src, T0text) {
  mark(T0text, 'T0');
  const spans = extractSpans(src), sql = productionSql(spans);
  return `// THROWAWAY TEST WORKER "mother-earth-evhtest". NOT THE HUB. Built by phase1/evh-fixture/build.mjs; do not edit by hand.
// Plan: reviews/2026-11-23-earth-from-space-alert-test-plan.md rev 1.2, sections 2 to 6. NO bindings, no cron, no route, no secret.
// It answers /health/runs/earthview and /health/trial/earthview from MADE-UP run records, by the clock. Everything else is 404.
const FX_T0 = '${T0text}';   // the only line that differs between two builds
/* FIXTURE. HEALTH.checks holds only the two entries used. */
const HEALTH = { checks: { runs: ['earthview'], trial: ['earthview'] } };
${copiedBlock(spans, sha256(src), Buffer.byteLength(src))}

/* FIXTURE from here on. The made-up trial (plan 2.2): FROM = T0 - 44 h, UNTIL = T0 + 4 h, 288 slots, one good row per slot finished
 * 15 s after its mark, except slot A (T0 + 30 min: its good row finishes at T0 + 100 min) and slot B (T0 + 120 min: a storage stop).
 * Simulated closeout at T0 + 170 min: from then on there is no window and the gate is manual. */
const FX_SQL = ${JSON.stringify(sql)};   // the production query, read out of the copied code by the build
const FX = (() => { const t0 = Date.parse(FX_T0), m = 60e3, h = 3600e3; return { T0: t0, FROM: t0 - 44 * h, UNTIL: t0 + 4 * h, A: t0 + 30 * m, A_FIN: t0 + 100 * m, B: t0 + 120 * m, CLOSE: t0 + 170 * m }; })();
const fxIso = ms => new Date(ms).toISOString(), fxMark = ms => fxIso(ms).replace('.000Z', 'Z');
const FX_ROWS = (() => {
  const rows = [];
  for (let s = FX.FROM; s < FX.UNTIL; s += 600e3) {
    if (s === FX.B) rows.push({ layer: 'earthview', started_at: fxIso(s), finished_at: fxIso(s + 15e3), status: 'down', records: 0, note: 'storage busy' });
    else rows.push({ layer: 'earthview', started_at: fxIso(s), finished_at: fxIso(s === FX.A ? FX.A_FIN : s + 15e3), status: 'ok', records: 0, note: 'nothing newer: fixture frame' });
  }
  return rows.sort((a, b) => (a.finished_at < b.finished_at ? -1 : a.finished_at > b.finished_at ? 1 : 0));
})();
/* The stand-in for env.DB. It answers ONLY the production query, applies that query's own bounds (layer, finished_at range, order,
 * limit), and adds ONE rule of its own: a row is returned only once the clock has reached its finished_at. */
function fxDb() {
  return { prepare(sql) {
    if (sql !== FX_SQL) throw new Error('fixture: unexpected query');
    return { bind(layer, ge, lt, limit) { return { async all() {
      const now = Date.now();
      return { results: FX_ROWS.filter(r => r.layer === layer && r.finished_at >= ge && r.finished_at < lt && Date.parse(r.finished_at) <= now).slice(0, limit)
        .map(r => ({ started_at: r.started_at, finished_at: r.finished_at, status: r.status, records: r.records, note: r.note })) };
    } }; } };
  } };
}
/* The env handed to the copied code. Decided by the clock; the Worker's real env is never read. */
function fxEnv(nowMs) {
  return nowMs >= FX.CLOSE ? { EARTHVIEW_ENABLED: 'manual', DB: fxDb() }
    : { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: fxMark(FX.FROM), EARTHVIEW_UNTIL: fxMark(FX.UNTIL), DB: fxDb() };
}
${ROUTER_COMMON}
export default { async fetch(req) { const r = fxRoute(req); return r.res || health(req, fxEnv(Date.now()), r.hit[0], r.hit[1]); } };
`;
}

/** The D1 measurement Worker (plan section 7). One binding: DB, a throwaway D1 database. */
export function buildD1(src, Btext) {
  const B = mark(Btext, 'B'), h = 3600e3, iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
  const spans = extractSpans(src);
  return `// THROWAWAY MEASUREMENT WORKER "mother-earth-evd1". NOT THE HUB. Built by phase1/evh-fixture/build.mjs; do not edit by hand.
// Plan: reviews/2026-11-23-earth-from-space-alert-test-plan.md rev 1.2, section 7. ONE binding: DB -> the throwaway D1 database
// "mother-earth-evd1test". No R2, no secret, no cron, no route. It answers the two health paths from that database through the
// copied health code, and adds measurement headers. Everything else is 404.
const FX_B = '${Btext}';   // the only line that differs between two builds, apart from the two window values derived from it
/* FIXTURE. HEALTH.checks holds only the two entries used. */
const HEALTH = { checks: { runs: ['earthview'], trial: ['earthview'] } };
${copiedBlock(spans, sha256(src), Buffer.byteLength(src))}

/* FIXTURE from here on. One made-up trial that ended before the measurement: FROM = B - 49 h, UNTIL = B - 1 h (288 slots).
 * Its last slot is due at B - 50 min, so for any clock after that the trial has ended and its verdict depends on the rows only. */
const FX_WINDOW = { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: '${iso(B - 49 * h)}', EARTHVIEW_UNTIL: '${iso(B - 1 * h)}' };
/* The recorder. It passes prepare, bind and all straight to D1, unchanged, and keeps what D1 returned WITH the result (its meta)
 * before the copied code drops it. It changes no query, no bound value and no result. */
function fxRecorder(db, log) {
  const wrap = st => ({ bind: (...a) => wrap(st.bind(...a)), all: async (...a) => { const r = await st.all(...a); log.push({ meta: (r && r.meta) || null, returned: r && Array.isArray(r.results) ? r.results.length : null }); return r; } });
  return { prepare: sql => wrap(db.prepare(sql)) };
}
const fxNum = v => (typeof v === 'number' && Number.isFinite(v) ? String(v) : 'unavailable');
function fxMeasured(res, log) {
  const hd = new Headers(res.headers), q = log[0] || null, meta = q && q.meta;
  hd.set('X-Evd1-Queries', String(log.length));
  hd.set('X-Evd1-Rows-Read', fxNum(meta && meta.rows_read));
  hd.set('X-Evd1-Rows-Written', fxNum(meta && meta.rows_written));
  hd.set('X-Evd1-Rows-Returned', fxNum(q && q.returned));
  hd.set('X-Evd1-Sql-Duration-Ms', fxNum(meta && (meta.duration !== undefined ? meta.duration : meta.sql_duration_ms)));
  hd.set('X-Evd1-Meta', meta ? JSON.stringify(meta).slice(0, 900) : 'unavailable');
  hd.set('Access-Control-Expose-Headers', 'X-Health, X-Evd1-Queries, X-Evd1-Rows-Read, X-Evd1-Rows-Written, X-Evd1-Rows-Returned, X-Evd1-Sql-Duration-Ms, X-Evd1-Meta');
  return new Response(res.body, { status: res.status, headers: hd });
}
${ROUTER_COMMON}
export default { async fetch(req, env) {
  const r = fxRoute(req); if (r.res) return r.res;
  const log = [], res = await health(req, { ...FX_WINDOW, DB: fxRecorder(env.DB, log) }, r.hit[0], r.hit[1]);
  return fxMeasured(res, log);
} };
`;
}

/** The measurement headers the D1 Worker adds; everything else in its answer must equal the plain health answer. */
export const D1_ADDED_HEADERS = ['x-evd1-queries', 'x-evd1-rows-read', 'x-evd1-rows-written', 'x-evd1-rows-returned', 'x-evd1-sql-duration-ms', 'x-evd1-meta', 'access-control-expose-headers'];

/** The collector_runs table and its two indexes: the exact statements of phase1/schema.sql. */
export function schemaStatements(schemaSrc) {
  const noComments = schemaSrc.split('\n').map(l => l.replace(/--.*$/, '')).join('\n');
  const st = noComments.split(';').map(s => s.trim()).filter(s => /\bcollector_runs\b/.test(s) && /^CREATE (TABLE|INDEX)/.test(s));
  if (st.length !== 3) throw new Error(`expected the collector_runs table and two indexes in schema.sql, found ${st.length} statements`);
  return st.map(s => s.replace(/\s+/g, ' ') + ';');
}

/** The four row sets (plan 7.2), as SQL that builds the rows inside the database. Each file is a few statements. */
export function rowSets(Btext) {
  const B = mark(Btext, 'B'), from = (B - 49 * 3600e3) / 1000, until = (B - 3600e3) / 1000;
  const t = e => `strftime('%Y-%m-%dT%H:%M:%fZ', ${e}, 'unixepoch')`;
  const ins = 'INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note)';
  const seq = (n, name = 'n') => `WITH RECURSIVE ${name}(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM ${name} WHERE i < ${n - 1})`;
  // one good row per slot, finished 15 s after its mark
  const good = `${seq(288)} ${ins} SELECT 'earthview', ${t(`${from} + i * 600`)}, ${t(`${from} + i * 600 + 15`)}, 'ok', 200, 0, 0, 'nothing newer: fixture frame' FROM n;`;
  // repeats: k further good rows per slot, finished 16 s, 17 s ... after the mark
  const repeats = k => `${seq(288)}, r(j) AS (SELECT 1 UNION ALL SELECT j + 1 FROM r WHERE j < ${k}) ${ins} SELECT 'earthview', ${t(`${from} + i * 600`)}, ${t(`${from} + i * 600 + 15 + j`)}, 'ok', 200, 0, 0, 'nothing newer: fixture repeat' FROM n, r;`;
  // stray rows: started five minutes off a mark, so they belong to no slot; finished inside the read range
  const stray = n => `${seq(n)} ${ins} SELECT 'earthview', ${t(`${from} + 300 + i * 600`)}, ${t(`${from} + 300 + i * 600 + 15`)}, 'ok', 200, 0, 0, 'nothing newer: fixture stray' FROM n;`;
  // other layers' rows across the same two days, and earthview rows that finished BEFORE the read range
  const other = `${seq(5000)} ${ins} SELECT CASE i % 5 WHEN 0 THEN 'usgs' WHEN 1 THEN 'firms' WHEN 2 THEN 'ships' WHEN 3 THEN 'swpc' ELSE 'wind' END, ${t(`${from} + i * 34`)}, ${t(`${from} + i * 34 + 3`)}, 'ok', 200, 10, 1000, 'fixture: another layer' FROM n;`;
  const before = `${seq(600)} ${ins} SELECT 'earthview', ${t(`${from} - 600 * (i + 1)`)}, ${t(`${from} - 600 * (i + 1) + 15`)}, 'ok', 200, 0, 0, 'nothing newer: fixture, before the range' FROM n;`;
  const facts = (rows, returned, extra = {}) => ({ rows_in_table: rows, rows_in_read_range: returned, ...extra });
  return {
    window: { from: new Date(from * 1000).toISOString(), until: new Date(until * 1000).toISOString(), read_range_end: new Date((until + 86400) * 1000).toISOString(), valid_for_clock_from: new Date(B - 50 * 60e3).toISOString() },
    clear: 'DELETE FROM collector_runs;',
    sets: {
      S1: { what: 'a completed normal trial: 288 slots, one good row each', sql: [good], ...facts(288, 288),
        expect: { runs: 200, trial: 200, state: 'trial complete, nothing outstanding', rows_returned: 288, complete: 288, rows_outside_slots: 0 } },
      S2: { what: 'repeat-heavy: 288 slots with 6 rows each (1,728) and 172 stray rows, 1,900 in the read range', sql: [good, repeats(5), stray(172)], ...facts(1900, 1900),
        expect: { runs: 200, trial: 200, state: 'trial complete, nothing outstanding', rows_returned: 1900, complete: 288, rows_outside_slots: 172 } },
      S3: { what: 'at the cap: 288 slots with 7 rows each, 2,016 in the read range', sql: [good, repeats(6)], ...facts(2016, 2016),
        expect: { runs: 503, trial: 503, state: 'too many rows to evaluate', rows_returned: 2000, reasons: ['too_many_rows'] } },
      S0: { what: 'S1 with 5,000 rows of five other layers and 600 earthview rows finished before the read range', sql: [good, other, before], ...facts(5888, 288),
        expect: { runs: 200, trial: 200, state: 'trial complete, nothing outstanding', rows_returned: 288, complete: 288, rows_outside_slots: 0 } },
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, when, outArg] = process.argv.slice(2);
  if (!['alert', 'd1'].includes(kind) || !when) { console.error('usage: build.mjs alert <T0> [outDir]   |   build.mjs d1 <B> [outDir]'); process.exit(2); }
  const out = path.resolve(outArg || '.'), src = fs.readFileSync(WORKER_PATH, 'utf8');
  fs.mkdirSync(out, { recursive: true });
  const write = (name, text) => { fs.writeFileSync(path.join(out, name), text); console.log(`${name}  ${Buffer.byteLength(text)} bytes  sha256 ${sha256(text)}`); };
  console.log(`source phase1/worker.js  ${Buffer.byteLength(src)} bytes  sha256 ${sha256(src)}`);
  if (kind === 'alert') write('evh-alert-worker.js', buildAlert(src, when));
  else {
    write('evh-d1-worker.js', buildD1(src, when));
    const rs = rowSets(when);
    write('seed-schema.sql', schemaStatements(fs.readFileSync(SCHEMA_PATH, 'utf8')).join('\n') + '\n');
    write('seed-clear.sql', rs.clear + '\n');
    for (const [k, v] of Object.entries(rs.sets)) write(`seed-${k}.sql`, `-- ${k}: ${v.what}. ${v.rows_in_table} rows in the table, ${v.rows_in_read_range} in the read range.\n` + v.sql.join('\n') + '\n');
    write('expected.json', JSON.stringify({ B: when, window: rs.window, sets: Object.fromEntries(Object.entries(rs.sets).map(([k, v]) => [k, { what: v.what, rows_in_table: v.rows_in_table, rows_in_read_range: v.rows_in_read_range, expect: v.expect }])) }, null, 2) + '\n');
  }
}
