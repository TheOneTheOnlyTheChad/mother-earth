/* Earth from Space: the two THROWAWAY Workers of the alert test plan rev 1.2 (reviews/2026-11-23-earth-from-space-alert-test-plan.md).
 *   A. the build: what is copied from phase1/worker.js is copied byte for byte, and nothing else differs between two builds
 *   B. the alert-test Worker (plan 2 to 6, no bindings): its timetable, its router, HEAD and GET, no outbound request, no env read
 *   C. the D1 measurement Worker (plan 7, one binding): the four row sets in a REAL SQLite database (node:sqlite) built from
 *      phase1/schema.sql, the recorder, and that its answer equals the REAL hub's answer apart from the added headers
 *   D. deliberate breaks of the fixtures' own rules, each of which must be caught
 * Nothing reaches the network or any account. The clock is controlled. The REAL worker.js is driven through its own fetch route
 * as the reference. node:sqlite is not D1: it gives no rows_read figure. This suite fixes verdicts and rows RETURNED, and the
 * plumbing of the measurement headers. The rows-read figures exist only after the live measurement.
 * Run:  node --no-warnings phase1/evh-fixture.test.mjs */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SPANS, extractSpans, productionSql, buildAlert, buildD1, rowSets, schemaStatements, mark, D1_ADDED_HEADERS, WORKER_PATH, SCHEMA_PATH } from './evh-fixture/build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(WORKER_PATH, 'utf8'), SCHEMA = fs.readFileSync(SCHEMA_PATH, 'utf8');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const TMP = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'evhfx-'));
let pass = 0, fail = 0, seq = 0;
const ok = (cond, what, detail = '') => { if (cond) { pass++; console.log('ok    ' + what); } else { fail++; console.log('FAIL  ' + what + (detail ? '  -> ' + detail : '')); } };
const eq = (a, b, what) => ok(JSON.stringify(a) === JSON.stringify(b), what, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const load = async text => { const f = path.join(TMP, `w${++seq}.mjs`); fs.writeFileSync(f, text); return (await import(pathToFileURL(f).href)).default; };
const REAL_NOW = Date.now.bind(Date);
const at = async (ms, fn) => { Date.now = () => ms; try { return await fn(); } finally { Date.now = REAL_NOW; } };
const m = 60e3, h = 3600e3;
const T0text = '2026-11-26T08:00:00Z', T0 = Date.parse(T0text);
const Btext = '2026-11-27T09:30:00Z', B = Date.parse(Btext);
let outbound = 0; const realFetch = globalThis.fetch; globalThis.fetch = async () => { outbound++; throw new Error('the fixture made an outbound request'); };
let envReads = 0; const noEnv = new Proxy({}, { get(_, k) { if (typeof k === 'string') envReads++; return undefined; }, has() { envReads++; return false; }, ownKeys() { envReads++; return []; } });
const hdrs = res => Object.fromEntries([...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]).sort());
const call = async (worker, ms, p, method = 'GET', env = noEnv) => at(ms, async () => {
  const res = await worker.fetch(new Request('https://fixture.test' + p, { method }), env, {});
  const text = await res.text(); let body = null; try { body = text ? JSON.parse(text) : null; } catch (_) {}
  return { status: res.status, headers: hdrs(res), text, body };
});
const RUNS = '/health/runs/earthview', TRIAL = '/health/trial/earthview';

// ============================================================ A. the build
const deployed = JSON.parse(fs.readFileSync(path.join(HERE, 'DEPLOYED-HUB.json'), 'utf8')).deployed;
ok(sha(SRC) === deployed.worker_sha256, 'A1 phase1/worker.js is the recorded deployed hub (' + deployed.version + ')');
const spans = extractSpans(SRC), SQL = productionSql(spans);
eq(spans.map(s => s.name), SPANS.map(s => s.name), 'A2 every listed span is found once, in the listed order');
ok(spans.every(s => SRC.includes(s.text)), 'A3 every span is a contiguous part of worker.js');
const alertText = buildAlert(SRC, T0text), d1Text = buildD1(SRC, Btext);
ok(spans.every(s => alertText.includes(s.text) && d1Text.includes(s.text)), 'A4 both built files hold every span byte for byte');
ok(alertText.includes(`source sha256 ${sha(SRC)}`) && d1Text.includes(`source sha256 ${sha(SRC)}`), 'A5 both built files name the source hash');
ok(SQL === 'SELECT started_at, finished_at, status, records, note FROM collector_runs WHERE layer = ? AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?', 'A6 the query read out of the copied code is the reviewed one');
{ // a changed byte in the source changes the output; a span that is missing or doubled stops the build
  const tampered = SRC.replace('ALLOW_MS: 1200e3', 'ALLOW_MS: 1201e3');
  ok(tampered !== SRC && !extractSpans(tampered).every(s => SRC.includes(s.text)), 'A7 a span built from a changed source is not a part of the real worker.js');
  let threw = 0; try { buildAlert(SRC.replace('async function health(req, env, check, layer) {', 'async function healthX(req, env, check, layer) {'), T0text); } catch (_) { threw++; }
  try { buildAlert(SRC + '\nconst CORS = 1;\n', T0text); } catch (_) { threw++; }
  ok(threw === 2, 'A8 a missing span and a doubled span each stop the build');
}
{ const diff = (a, b) => { const x = a.split('\n'), y = b.split('\n'); return x.length !== y.length ? ['length'] : x.map((l, i) => (l === y[i] ? null : l.split(' ').slice(0, 2).join(' '))).filter(Boolean); };
  eq(diff(alertText, buildAlert(SRC, '2026-11-27T08:00:00Z')), ['const FX_T0'], 'A9 two alert builds a day apart differ only in the FX_T0 line');
  eq(diff(d1Text, buildD1(SRC, '2026-11-28T09:30:00Z')), ['const FX_B', 'const FX_WINDOW'], 'A10 two D1 builds a day apart differ only in the FX_B line and the window derived from it');
  ok(buildAlert(SRC, T0text) === alertText && buildD1(SRC, Btext) === d1Text, 'A11 the build is repeatable'); }
{ // every committed built file is exactly what the build gives for its times: neither the examples nor a live build can go stale unnoticed
  const filesFor = (kind, when) => { if (kind === 'alert') return { 'evh-alert-worker.js': buildAlert(SRC, when) };
    const rs = rowSets(when), o = { 'evh-d1-worker.js': buildD1(SRC, when), 'seed-schema.sql': schemaStatements(SCHEMA).join('\n') + '\n', 'seed-clear.sql': rs.clear + '\n' };
    for (const [k, v] of Object.entries(rs.sets)) o[`seed-${k}.sql`] = `-- ${k}: ${v.what}. ${v.rows_in_table} rows in the table, ${v.rows_in_read_range} in the read range.\n` + v.sql.join('\n') + '\n';
    o['expected.json'] = JSON.stringify({ B: when, window: rs.window, sets: Object.fromEntries(Object.entries(rs.sets).map(([k, v]) => [k, { what: v.what, rows_in_table: v.rows_in_table, rows_in_read_range: v.rows_in_read_range, expect: v.expect }])) }, null, 2) + '\n';
    return o; };
  const held = (dir, builds) => { const want = Object.assign({}, ...builds.map(([k, w]) => filesFor(k, w))), have = fs.readdirSync(dir).filter(f => f !== 'BUILD.json').sort();
    return JSON.stringify(have) === JSON.stringify(Object.keys(want).sort()) && have.every(f => fs.readFileSync(path.join(dir, f), 'utf8') === want[f]); };
  const FX = path.join(HERE, 'evh-fixture');
  ok(held(path.join(FX, 'example'), [['alert', T0text], ['d1', Btext]]), 'A13 every file in phase1/evh-fixture/example/ is exactly what the build gives for T0 ' + T0text + ' and B ' + Btext + ', and no other file is there');
  const live = path.join(FX, 'live'), dirs = fs.existsSync(live) ? fs.readdirSync(live).sort() : [];
  for (const d of dirs) { const b = JSON.parse(fs.readFileSync(path.join(live, d, 'BUILD.json'), 'utf8'));
    ok(b.source_sha256 === sha(SRC) && held(path.join(live, d), [[b.kind, b.when]]) && Object.entries(b.files).every(([f, x]) => sha(fs.readFileSync(path.join(live, d, f), 'utf8')) === x.sha256),
      `A14 live build ${d}: every file is what the build gives for ${b.kind} ${b.when} from this worker.js, and its hashes are those recorded in BUILD.json`); } }
{ let bad = 0; for (const v of ['2026-11-26T08:05:00Z', '2026-11-26T08:00:00.000Z', '2026-11-26 08:00:00Z', '2026-02-30T08:00:00Z', '', undefined]) { try { mark(v, 'T0'); } catch (_) { bad++; } }
  ok(bad === 6, 'A12 a time that is not an exact ten-minute mark is refused'); }

// ============================================================ B. the alert-test Worker
const alertW = await load(alertText);
/** What plan 2.2 says each address answers at a clock time. */
const expected = ms => ({
  runs: ms >= T0 + 50 * m && ms < T0 + 100 * m ? 503 : 200,
  trial: ms >= T0 + 120 * m + 15e3 && ms < T0 + 170 * m ? 503 : 200,
});
/** Number of disagreements with the timetable, over every boundary and a five-minute sweep. Used again by the breaks. */
async function timetableFaults(worker) {
  let faults = 0;
  const times = []; for (let t = T0 - 60 * m; t <= T0 + 240 * m; t += 5 * m) times.push(t);
  for (const b of [T0 + 50 * m, T0 + 100 * m, T0 + 120 * m, T0 + 120 * m + 15e3, T0 + 170 * m]) times.push(b - 1, b, b + 1);
  for (const t of times) {
    let r, tr; try { r = await call(worker, t, RUNS); tr = await call(worker, t, TRIAL); } catch (_) { faults++; continue; }
    const e = expected(t); if (r.status !== e.runs) faults++; if (tr.status !== e.trial) faults++;
  }
  return faults;
}
eq(await timetableFaults(alertW), 0, 'B1 the timetable of plan 2.2 at every boundary (1 ms before, at, 1 ms after) and every five minutes from T0 - 60 to T0 + 240');
{ const a = await call(alertW, T0 + 50 * m - 1, RUNS), b = await call(alertW, T0 + 50 * m, RUNS);
  ok(a.status === 200 && a.body.facts.state === 'active' && b.status === 503 && b.body.reasons.join() === 'completion_missing' && b.body.facts.overdue_slots.join() === new Date(T0 + 30 * m).toISOString(), 'B2 runs turns 503 completion_missing at T0 + 50 min exactly, for slot A only');
  const c = await call(alertW, T0 + 100 * m - 1, RUNS), d = await call(alertW, T0 + 100 * m, RUNS);
  ok(c.status === 503 && d.status === 200 && d.body.facts.overdue === 0, 'B3 runs recovers at T0 + 100 min exactly, when slot A\'s row arrives');
  const e = await call(alertW, T0 + 120 * m + 15e3 - 1, TRIAL), f = await call(alertW, T0 + 120 * m + 15e3, TRIAL), g = await call(alertW, T0 + 120 * m + 15e3, RUNS);
  ok(e.status === 200 && f.status === 503 && f.body.reasons.join() === 'storage_stop' && f.body.facts.findings[0].slot === new Date(T0 + 120 * m).toISOString() && g.status === 200, 'B4 trial turns 503 storage_stop at T0 + 120 min 15 s exactly; runs is unaffected');
  const i = await call(alertW, T0 + 170 * m - 1, TRIAL), j = await call(alertW, T0 + 170 * m, TRIAL), k = await call(alertW, T0 + 170 * m, RUNS);
  ok(i.status === 503 && j.status === 200 && j.body.facts.state === 'no trial configured' && j.body.facts.gate === 'manual' && k.body.facts.state === 'no trial configured', 'B5 the simulated closeout at T0 + 170 min: both 200 "no trial configured", gate manual');
  ok((T0 + 170 * m) - (T0 + 120 * m + 15e3) === 49 * m + 45e3 && (T0 + 100 * m) - (T0 + 50 * m) === 50 * m, 'B6 the runs 503 lasts 50 min; the trial 503 lasts 49 min 45 s'); }
{ const n = async ms => (await call(alertW, ms, RUNS)).body.facts.rows_read;
  eq([await n(T0 - 30 * m), await n(T0 + 50 * m), await n(T0 + 100 * m), await n(T0 + 170 * m - 1)], [261, 268, 274, 281], 'B7 rows returned to the evaluation: 261 at T0 - 30 min, 268 at the first Down, 274 at the runs recovery, 281 just before closeout (never 288)');
  const b = (await call(alertW, T0 + 60 * m, RUNS)).body;
  ok(b.check === 'runs/earthview' && b.collector_version === deployed.version && b.facts.slots === 288 && b.verdict === 'failing' && b.checked_at === new Date(T0 + 60 * m).toISOString(), 'B8 the answer is the production shape: check, verdict, checked_at, collector_version, 288 slots'); }
for (const [name, p] of [['runs', RUNS], ['trial', TRIAL]]) for (const [label, ms] of [['200', T0 - 10 * m], ['503', name === 'runs' ? T0 + 60 * m : T0 + 130 * m]]) {
  const g = await call(alertW, ms, p, 'GET'), hd = await call(alertW, ms, p, 'HEAD');
  const strip = x => { const y = { ...x }; delete y['content-length']; return y; };
  ok(String(g.status) === label && hd.status === g.status && hd.text === '' && JSON.stringify(strip(hd.headers)) === JSON.stringify(strip(g.headers)) && g.headers['cache-control'] === 'no-store, max-age=0' && g.headers['x-health'] === (label === '200' ? 'ok' : 'failing'),
    `B9 ${name} ${label}: HEAD and GET give the same status and headers, no-store, X-Health; HEAD has no body`);
}
// the reference: the REAL hub's own fetch route, with an independent stand-in for the same made-up rows
const { default: hub } = await import(pathToFileURL(WORKER_PATH).href);
function referenceEnv(ms) {
  const iso = t => new Date(t).toISOString(), FROM = T0 - 44 * h, UNTIL = T0 + 4 * h, rows = [];
  for (let s = FROM; s < UNTIL; s += 10 * m) rows.push(s === T0 + 120 * m ? { started_at: iso(s), finished_at: iso(s + 15e3), status: 'down', records: 0, note: 'storage busy' }
    : { started_at: iso(s), finished_at: iso(s === T0 + 30 * m ? T0 + 100 * m : s + 15e3), status: 'ok', records: 0, note: 'nothing newer: fixture frame' });
  const DB = { prepare: () => ({ bind: (layer, ge, lt, limit) => ({ all: async () => ({ results: rows.filter(r => layer === 'earthview' && r.finished_at >= ge && r.finished_at < lt && Date.parse(r.finished_at) <= Date.now()).sort((a, b) => (a.finished_at < b.finished_at ? -1 : 1)).slice(0, limit) }) }) }) };
  return ms >= T0 + 170 * m ? { EARTHVIEW_ENABLED: 'manual', DB } : { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: iso(FROM).replace('.000Z', 'Z'), EARTHVIEW_UNTIL: iso(UNTIL).replace('.000Z', 'Z'), DB };
}
{ let same = 0, n = 0;
  for (const ms of [T0 - 60 * m, T0 - 1, T0 + 49 * m, T0 + 50 * m, T0 + 75 * m, T0 + 100 * m, T0 + 110 * m, T0 + 120 * m + 15e3, T0 + 150 * m, T0 + 169 * m, T0 + 170 * m, T0 + 300 * m])
    for (const p of [RUNS, TRIAL]) for (const method of ['GET', 'HEAD']) {
      n++; const a = await call(alertW, ms, p, method), b = await call(hub, ms, p, method, referenceEnv(ms));
      if (a.status === b.status && a.text === b.text && JSON.stringify(a.headers) === JSON.stringify(b.headers)) same++;
    }
  ok(same === n && n === 48, `B10 the fixture's answer equals the REAL hub's own route (status, body, every header) at 12 clock times, both addresses, GET and HEAD (${same} of ${n})`); }
const WRONG = ['/', '/health', '/health/', '/health/runs', '/health/runs/', '/health/runs/usgs', '/health/runs/firms', '/health/trial/usgs', '/health/coverage/earthview', '/health/publication/usgs', '/health/archive/earthview',
  '/health/runs/earthview/', '/health//runs/earthview', '//health/runs/earthview', '/health/runs/earthview/x', '/health/runs/earthviewx', '/HEALTH/runs/earthview', '/health/Runs/earthview', '/health/runs/earthview%2F', '/health/runs%2Fearthview', '/status', '/admin/run/earthview', '/health/runs/__proto__', '/health/constructor/earthview'];
async function routerFaults(worker, env = noEnv) {
  let faults = 0;
  for (const p of WRONG) for (const method of ['GET', 'HEAD', 'POST']) { try { const r = await call(worker, T0, p + (method === 'POST' ? '' : '?x=1'), method, env); if (r.status !== 404 || r.headers['cache-control'] !== 'no-store, max-age=0') faults++; } catch (_) { faults++; } }
  for (const p of [RUNS, TRIAL]) for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) { try { const r = await call(worker, T0, p, method, env); if (r.status !== 405 || r.headers.allow !== 'GET, HEAD' || r.headers['cache-control'] !== 'no-store, max-age=0') faults++; } catch (_) { faults++; } }
  return faults;
}
eq(await routerFaults(alertW), 0, `B11 the router: ${WRONG.length} wrong paths (other layers, other checks, separators, case, encodings) by GET, HEAD and POST are 404; any other method on a right path is 405; none throws; all no-store`);
{ const a = await call(alertW, T0 + 60 * m, RUNS), b = await call(alertW, T0 + 60 * m, RUNS + '?t=123');
  ok(a.status === b.status && a.text === b.text, 'B12 a query string on a right path changes nothing (as on the hub)'); }
ok(outbound === 0, 'B13 the alert Worker made no outbound request in any case above');
ok(envReads === 0, 'B14 the alert Worker read nothing from its env in any case above (it has no bindings to read)');

// ============================================================ C. the D1 measurement Worker
const d1W = await load(d1Text), RS = rowSets(Btext), SCHEMA_ST = schemaStatements(SCHEMA);
ok(SCHEMA_ST.length === 3 && SCHEMA_ST.every(s => SCHEMA.replace(/--.*$/gm, '').replace(/\s+/g, ' ').includes(s.replace(/;$/, ''))), 'C1 the table and its two indexes are the statements of phase1/schema.sql');
/** A D1-shaped binding over node:sqlite. `meta` is what this stand-in claims D1 returned; real figures come only from real D1. */
function d1Over(db, { meta = { rows_read: 4321, rows_written: 0, duration: 0.25, served_by: 'stand-in' }, spy = null } = {}) {
  return { prepare(sql) { const st = db.prepare(sql); const bound = args => ({ bind: (...a) => bound(a), all: async () => { if (spy) spy.push({ sql, args }); const out = { results: st.all(...args) }; if (meta) out.meta = meta; return out; } }); return bound([]); } };
}
function seeded(name) { const db = new DatabaseSync(':memory:'); for (const s of SCHEMA_ST) db.exec(s); if (name) for (const s of RS.sets[name].sql) db.exec(s); return db; }
const winEnv = () => { const mm = /const FX_WINDOW = (\{[^}]+\});/.exec(d1Text); return Function('return ' + mm[1])(); };
eq(winEnv(), { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: new Date(B - 49 * h).toISOString().replace('.000Z', 'Z'), EARTHVIEW_UNTIL: new Date(B - 1 * h).toISOString().replace('.000Z', 'Z') }, 'C2 the window is FROM = B - 49 h, UNTIL = B - 1 h, gate 1');
for (const [name, set] of Object.entries(RS.sets)) {
  const db = seeded(name), e = set.expect, env = { DB: d1Over(db) };
  const total = db.prepare('SELECT COUNT(*) AS n FROM collector_runs').get().n;
  const inRange = db.prepare("SELECT COUNT(*) AS n FROM collector_runs WHERE layer = 'earthview' AND finished_at >= ? AND finished_at < ?").get(RS.window.from, RS.window.read_range_end).n;
  ok(total === set.rows_in_table && inRange === set.rows_in_read_range, `C3 ${name} seeds ${set.rows_in_table} rows, ${set.rows_in_read_range} in the read range`, `${total}, ${inRange}`);
  let good = 0, n = 0;
  for (const ms of [B - 50 * m, B, B + 6 * h, B + 30 * h]) {
    const r = await call(d1W, ms, RUNS, 'GET', env), t = await call(d1W, ms, TRIAL, 'GET', env); n++;
    const fine = r.status === e.runs && t.status === e.trial && r.body.facts.state === e.state && t.body.facts.state === e.state && r.body.facts.rows_read === e.rows_returned
      && r.headers['x-evd1-rows-returned'] === String(e.rows_returned) && r.headers['x-evd1-queries'] === '1' && r.headers['x-evd1-rows-read'] === '4321'
      && (e.complete === undefined || (r.body.facts.complete === e.complete && r.body.facts.rows_outside_slots === e.rows_outside_slots && r.body.facts.overdue === 0 && r.body.facts.findings.length === 0))
      && (e.reasons === undefined || (r.body.reasons.join() === e.reasons.join() && t.body.reasons.join() === e.reasons.join()));
    if (fine) good++;
  }
  ok(good === n, `C4 ${name}: runs ${e.runs}, trial ${e.trial}, "${e.state}", ${e.rows_returned} rows returned, at B - 50 min, B, B + 6 h and B + 30 h (${good} of ${n})`);
  db.close();
}
{ const db = seeded('S1'), env = { DB: d1Over(db) };
  const before = await call(d1W, B - 50 * m - 1, RUNS, 'GET', env);
  ok(before.body.facts.state === 'active', 'C5 one millisecond before B - 50 min the trial has not ended: the measurement is valid only from B - 50 min on, as expected.json says');
  eq(RS.window.valid_for_clock_from, new Date(B - 50 * m).toISOString(), 'C6 expected.json states that bound');
  const plan = db.prepare('EXPLAIN QUERY PLAN ' + SQL).all('earthview', RS.window.from, RS.window.read_range_end, 2000).map(r => r.detail).join(' | ');
  ok(/USING INDEX collector_runs_layer_finished/.test(plan) && !/TEMP B-TREE/.test(plan) && !/SCAN/.test(plan), 'C7 SQLite answers the production query through the (layer, finished_at) index, with no scan and no sort step', plan);
  db.close(); }
for (const name of ['S1', 'S2', 'S3', 'S0']) { // equal to the REAL hub's answer, apart from the added headers
  const db = seeded(name); let same = 0, n = 0;
  for (const p of [RUNS, TRIAL]) for (const method of ['GET', 'HEAD']) {
    n++; const a = await call(d1W, B, p, method, { DB: d1Over(db) }), b = await call(hub, B, p, method, { ...winEnv(), DB: d1Over(db) });
    const rest = Object.fromEntries(Object.entries(a.headers).filter(([k]) => !D1_ADDED_HEADERS.includes(k)));
    const added = Object.keys(a.headers).filter(k => !(k in b.headers)).sort();
    if (a.status === b.status && a.text === b.text && JSON.stringify(rest) === JSON.stringify(b.headers) && JSON.stringify(added) === JSON.stringify([...D1_ADDED_HEADERS].sort())
      && a.headers['x-evd1-queries'] === '1' && a.headers['x-evd1-rows-read'] === '4321') same++;
  }
  ok(same === n, `C8 ${name}: status, body and every original header equal the REAL hub's own route; only the ${D1_ADDED_HEADERS.length} measurement headers are added; HEAD evaluates too and carries them (${same} of ${n})`);
  db.close();
}
{ const db = seeded('S1'), spy = [], spy2 = [];
  await call(d1W, B, RUNS, 'GET', { DB: d1Over(db, { spy }) }); await call(hub, B, RUNS, 'GET', { ...winEnv(), DB: d1Over(db, { spy: spy2 }) });
  ok(spy.length === 1 && spy[0].sql === SQL && JSON.stringify(spy) === JSON.stringify(spy2) && JSON.stringify(spy[0].args) === JSON.stringify(['earthview', RS.window.from, RS.window.read_range_end, 2000]),
    'C9 the recorder passes the query and its four bound values to the database unchanged: the same as the REAL hub sends');
  const meta = { rows_read: 777, rows_written: 0, duration: 1.5, changes: 0, last_row_id: 0 };
  const r = await call(d1W, B, TRIAL, 'HEAD', { DB: d1Over(db, { meta }) });
  ok(r.headers['x-evd1-rows-read'] === '777' && r.headers['x-evd1-sql-duration-ms'] === '1.5' && r.headers['x-evd1-rows-written'] === '0' && r.headers['x-evd1-meta'] === JSON.stringify(meta), 'C10 the headers carry what the database returned with the result, as returned');
  const none = await call(d1W, B, RUNS, 'GET', { DB: d1Over(db, { meta: null }) });
  ok(none.status === 200 && none.headers['x-evd1-rows-read'] === 'unavailable' && none.headers['x-evd1-meta'] === 'unavailable' && none.headers['x-evd1-rows-returned'] === '288', 'C11 with no rows_read in the result the header says "unavailable": no figure is made up');
  const dead = await call(d1W, B, RUNS, 'GET', { DB: { prepare() { throw new Error('boom SECRETSECRETSECRETSECRETSECRETSECRET'); } } });
  ok(dead.status === 503 && dead.body.reasons.join() === 'rows_unreadable' && !dead.text.includes('boom') && dead.headers['x-evd1-queries'] === '0', 'C12 a database that fails gives the production 503 rows_unreadable, with none of the error text');
  const empty = seeded(null), z = await call(d1W, B, RUNS, 'GET', { DB: d1Over(empty) });
  ok(z.status === 503 && z.body.reasons.join() === 'completion_missing' && z.body.facts.overdue === 288, 'C13 an empty table (between two row sets) answers 503 with 288 overdue: a forgotten seed cannot pass for a clean set');
  let touched = 0; const counting = { prepare() { touched++; throw new Error('x'); } };
  eq(await routerFaults(d1W, { DB: counting }), 0, 'C14 the D1 Worker\'s router: the same wrong paths and methods are 404 and 405, none throws');
  ok(touched === 0, 'C15 a wrong path or method never touches the database');
  db.close(); empty.close(); }
ok(outbound === 0, 'C16 the D1 Worker made no outbound request in any case above');

// ============================================================ D. breaks of the fixtures' own rules
const mustChange = (text, from, to) => { if (!text.includes(from)) throw new Error('break not applicable: ' + from); return text.replace(from, to); };
for (const [name, from, to] of [
  ['the arrival rule off', ' && Date.parse(r.finished_at) <= now', ''],
  ['closeout never', 'CLOSE: t0 + 170 * m', 'CLOSE: t0 + 1e7 * m'],
  ['closeout ten minutes early', 'CLOSE: t0 + 170 * m', 'CLOSE: t0 + 160 * m'],
  ['slot A on the wrong mark', 'A: t0 + 30 * m,', 'A: t0 + 40 * m,'],
  ['slot A never completes', 'A_FIN: t0 + 100 * m', 'A_FIN: t0 + 1e7 * m'],
  ['slot B on the wrong mark', 'B: t0 + 120 * m', 'B: t0 + 130 * m'],
  ['the storage stop written as a good row', "status: 'down', records: 0, note: 'storage busy'", "status: 'ok', records: 0, note: 'nothing newer: fixture frame'"],
  ['the window one slot short', 'UNTIL: t0 + 4 * h', 'UNTIL: t0 + 110 * m'],
]) ok(await timetableFaults(await load(mustChange(alertText, from, to))) > 0, `D alert: ${name} is caught by the timetable`);
ok(await routerFaults(await load(mustChange(alertText, "const FX_PATHS = { '/health/runs/earthview': ['runs', 'earthview'],", "const FX_PATHS = { '/health/runs/earthview': ['runs', 'earthview'], '/health/runs/usgs': ['runs', 'usgs'],"))) > 0, 'D alert: a router that lets another layer through is caught (the copied health() throws there: its other handlers are not copied)');
ok(await routerFaults(await load(mustChange(alertText, "  if (req.method !== 'GET' && req.method !== 'HEAD') return", "  if (false) return"))) > 0, 'D alert: a router that lets any method through is caught');
{ const db = seeded('S1');
  const drift = async text => { const w = await load(text), spy = []; const a = await call(w, B, RUNS, 'GET', { DB: d1Over(db, { spy }) }), b = await call(hub, B, RUNS, 'GET', { ...winEnv(), DB: d1Over(db) });
    return a.status !== b.status || a.text !== b.text || spy.length !== 1 || JSON.stringify(spy[0].args) !== JSON.stringify(['earthview', RS.window.from, RS.window.read_range_end, 2000]) || a.headers['x-evd1-rows-read'] !== '4321' || a.headers['x-evd1-rows-returned'] !== '288'; };
  ok(!(await drift(d1Text)), 'D d1: the unbroken build passes the check the breaks are measured by');
  for (const [name, from, to] of [
    ['a recorder that changes a bound value', 'bind: (...a) => wrap(st.bind(...a))', 'bind: (...a) => wrap(st.bind(...a.slice(0, 3), 5))'],
    ['a recorder that drops the meta', 'log.push({ meta: (r && r.meta) || null,', 'log.push({ meta: null,'],
    ['a recorder that changes the result', 'return r; } });', 'return { results: r.results.slice(1), meta: r.meta }; } });'],
    ['a window on another day', "EARTHVIEW_FROM: '", "EARTHVIEW_FROM: '2020-01-01T00:00:00Z', X: '"],
    ['a made-up rows-read figure', "hd.set('X-Evd1-Rows-Read', fxNum(meta && meta.rows_read));", "hd.set('X-Evd1-Rows-Read', '288');"],
  ]) ok(await drift(mustChange(d1Text, from, to)), `D d1: ${name} is caught`);
  db.close(); }

globalThis.fetch = realFetch;
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`evh-fixture: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
