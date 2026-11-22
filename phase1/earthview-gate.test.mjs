/* Earth from Space, hub 0.6.22: the three-state gate, the admission window, the key in a header, and the per-invocation snapshot
 * (EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL rev 2.2; GPT's closure of 22 Nov 2026).
 * The real worker.js is driven through its OWN handlers: default.scheduled (the five-minute trigger) and default.fetch.
 * Every case gets a fresh copy of the module, so the isolate counters start at zero. R2 and D1 are spies that record every call;
 * EUMETView and USGS are stubbed; nothing reaches the network. Storage is left EMPTY on purpose: an admitted collector run then
 * stops at its first guard ("storage is not set up") after reading earthview/ records and writing a run-log row, which is all this
 * suite needs to tell "admitted" from "refused". What an admitted run goes on to do is the hub suite's subject.
 * "Refused" is asserted as ZERO Earth from Space work: no request to EUMETView, no R2 call on an earthview/ key, no earthview
 * run-log row, no run-start line; while the trigger's other collector (earthquakes) does exactly what it does with the gate unset.
 * Run: node --no-warnings phase1/earthview-gate.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   manual-admits-scheduled unknown-admits no-window-check from-not-checked until-not-checked until-inclusive from-exclusive
 *   window-uses-clock no-max-window inverted-ok lax-mark off-mark-ok manual-any-value manual-needs-one probe-with-manual
 *   key-in-url-ok key-compared-first header-optional bare-key-ok get-runs run-query-ok admin-any-method unknown-action-reads
 *   unknown-param-ok prefix-path-ok snapshot-after-count snapshot-live cron-tally-live cron-not-tallied start-line-late same-exec */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  // ---- gate
  'manual-admits-scheduled': ["  if (g !== '1') return { admit: false,", "  if (g !== '1' && g !== 'manual') return { admit: false,"],
  'unknown-admits': ["  if (g !== '1') return { admit: false,", "  if (g === undefined || g === 'manual') return { admit: false,"],
  'manual-any-value': ["const evManualGate = env => env.EARTHVIEW_ENABLED === '1' || env.EARTHVIEW_ENABLED === 'manual' ? null :", "const evManualGate = env => env.EARTHVIEW_ENABLED !== undefined ? null :"],
  'manual-needs-one': ["const evManualGate = env => env.EARTHVIEW_ENABLED === '1' || env.EARTHVIEW_ENABLED === 'manual' ? null :", "const evManualGate = env => env.EARTHVIEW_ENABLED === '1' ? null :"],
  'probe-with-manual': ["  if (env.EARTHVIEW_ENABLED !== undefined) return no(409,", "  if (env.EARTHVIEW_ENABLED === '1') return no(409,"],
  // ---- window
  'no-window-check': ["  const from = evMark(env.EARTHVIEW_FROM), until = evMark(env.EARTHVIEW_UNTIL);\n", "  return { admit: true };\n  const from = evMark(env.EARTHVIEW_FROM), until = evMark(env.EARTHVIEW_UNTIL);\n"],
  'from-not-checked': ["  if (ms < from) return { admit: false, why: 'before the window' };\n", ""],
  'until-not-checked': ["  if (ms >= until) return { admit: false, why: 'after the window' };\n", ""],
  'until-inclusive': ["  if (ms >= until) return", "  if (ms > until + 300000) return"],
  'from-exclusive': ["  if (ms < from) return", "  if (ms < from + 600000) return"],
  'window-uses-clock': ["    const adm = evAdmit(env, ms);", "    const adm = evAdmit(env, Date.now());"],
  'no-max-window': ["  if (until - from > EV_WINDOW_MAX_MS) return { admit: false, why: 'window longer than 48 hours' };\n", ""],
  'inverted-ok': ["  if (until <= from) return { admit: false, why: 'window empty or inverted' };\n", ""],
  'lax-mark': ["  if (typeof v !== 'string' || !/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d0:00Z$/.test(v)) return null;\n  const t = Date.parse(v);\n  return Number.isNaN(t) || new Date(t).toISOString() !== v.replace(/Z$/, '.000Z') ? null : t;", "  const t = Date.parse(v);\n  return Number.isNaN(t) ? null : t;"],
  'off-mark-ok': ["!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d0:00Z$/.test(v)", "!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ$/.test(v)"],
  // ---- key and routes
  'key-in-url-ok': ["  if (url.searchParams.has('key')) return no(400, 'the key is not accepted in the URL; send it in the Authorization header');\n", ""],
  'key-compared-first': [["  if (url.searchParams.has('key')) return no(400, 'the key is not accepted in the URL; send it in the Authorization header');\n", ""], ["  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  return null;\n}", "  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  if (url.searchParams.has('key')) return no(400, 'the key is not accepted in the URL; send it in the Authorization header');\n  return null;\n}"]],
  'header-optional': ["  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  return null;\n}", "  if (!env.ADMIN_KEY || (req.headers.get('authorization') !== null && req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY)) return no(403, 'forbidden');\n  return null;\n}"],
  'bare-key-ok': ["  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  return null;\n}", "  if (!env.ADMIN_KEY || (req.headers.get('authorization') || '').replace(/^Bearer /, '') !== env.ADMIN_KEY) return no(403, 'forbidden');\n  return null;\n}"],
  'get-runs': ["      const refuse = evAuth(req, env, url, ['POST']); if (refuse) return refuse;", "      const refuse = evAuth(req, env, url, ['GET', 'POST']); if (refuse) return refuse;"],
  'run-query-ok': ["      if (url.search) return json({ layer: 'earthview', error: 'no query string is accepted' }, 400, NS);\n      const t0 = Date.now();", "      const t0 = Date.now();"],
  'admin-any-method': ["      const refuse = evAuth(req, env, url, ['GET', 'POST']); if (refuse) return refuse;", "      const refuse = evAuth(req, env, url, ['GET', 'POST', 'PUT', 'DELETE']); if (refuse) return refuse;"],
  'unknown-action-reads': ["      if (p.length !== 3 || !EV_ADMIN_ACTIONS.includes(p[2])) return json({ layer: 'earthview', error: 'unknown action', actions: EV_ADMIN_ACTIONS }, 404, NS);\n", "      if (p.length !== 3) return json({ layer: 'earthview', error: 'unknown action', actions: EV_ADMIN_ACTIONS }, 404, NS);\n"],
  'unknown-param-ok': ["      for (const k of url.searchParams.keys()) if (k !== 'apply' && k !== 'plan') return json({ layer: 'earthview', error: 'unknown parameter' }, 400, NS);\n", ""],
  'prefix-path-ok': [["      if (p.length !== 3 || !EV_ADMIN_ACTIONS.includes(p[2])) return json(", "      if (!EV_ADMIN_ACTIONS.includes(p[2])) return json("], ["      if (p.length !== 3) return json({ layer: 'earthview', error: 'not found' }, 404, NS);\n", ""]],
  // ---- snapshot and log lines
  'snapshot-after-count': ["    scheduled_before: EVB.scheduled, fetches_before: EVB.fetches, crons_before: Object.freeze({ ...EVB.crons }) });\n  if (kind === 'fetch') EVB.fetches++; else { EVB.scheduled++; EVB.crons[c] = (EVB.crons[c] || 0) + 1; }\n  return snap;",
    "    scheduled_before: 0, fetches_before: 0, crons_before: null });\n  if (kind === 'fetch') EVB.fetches++; else { EVB.scheduled++; EVB.crons[c] = (EVB.crons[c] || 0) + 1; }\n  return Object.freeze({ ...snap, scheduled_before: EVB.scheduled, fetches_before: EVB.fetches, crons_before: Object.freeze({ ...EVB.crons }) });"],
  'snapshot-live': ["isolate: i && i.isolate, isolate_age_ms: i && i.isolate_age_ms, scheduled_before: i && i.scheduled_before, crons_before: i && i.crons_before, fetches_before: i && i.fetches_before }));", "isolate: i && i.isolate, isolate_age_ms: i && i.isolate_age_ms, scheduled_before: i && EVB.scheduled - (trigger === 'scheduled' ? 1 : 0), crons_before: i && i.crons_before, fetches_before: i && EVB.fetches - (trigger === 'manual' ? 1 : 0) }));"],
  'cron-tally-live': ["crons_before: Object.freeze({ ...EVB.crons }) });", "crons_before: EVB.crons });"],
  'cron-not-tallied': ["else { EVB.scheduled++; EVB.crons[c] = (EVB.crons[c] || 0) + 1; }", "else { EVB.scheduled++; }"],
  'start-line-late': [["  console.log(JSON.stringify({ earthview: 'run-start', exec: x.exec,", "  const __start = () => console.log(JSON.stringify({ earthview: 'run-start', exec: x.exec,"], ["fetches_before: i && i.fetches_before }));\n  let r = null; const g = await guarded(env, 'earthview', ms, async (e, m) => { r = await collectEarthView(e, m, x); });", "fetches_before: i && i.fetches_before }));\n  let r = null; const g = await guarded(env, 'earthview', ms, async (e, m) => { r = await collectEarthView(e, m, x); }); __start();"]],
  'same-exec': ["  const x = { exec: evHex(6), validations_before: null, validated: null }, at = new Date(ms).toISOString(), i = inv || null;", "  const x = { exec: crypto.randomUUID ? 'x' + String(ms) : 'x', validations_before: null, validated: null }, at = new Date(ms).toISOString(), i = inv || null;"],
};
const baseSrc = fs.readFileSync(process.env.WORKER || path.join(HERE, 'worker.js'), 'utf8');
let src = baseSrc;
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  for (const b of Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]]) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); } }
let nMod = 0;
const load = async () => { const tmp = path.join(os.tmpdir(), `worker-evg-${process.pid}-${nMod++}.mjs`); fs.writeFileSync(tmp, src); try { return await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); } };
const realLog = console.log.bind(console);
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { realLog('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; realLog(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 900) : ''}`); } };
// ---------- movable clock
const RealDate = Date; let offset = 0;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } };
const setNow = ms => { offset = ms - RealDate.now(); };
// ---------- everything the Worker logs
const LOG = []; console.log = (...a) => { LOG.push(a); };
const evLines = (from = 0) => LOG.slice(from).filter(a => typeof a[0] === 'string' && a[0].startsWith('{"earthview"')).map(a => JSON.parse(a[0]));
const jobLines = (from = 0) => LOG.slice(from).filter(a => a[0] === 'five').map(a => String(a[1]));
// ---------- a world: spies on the bucket and the database, stubs for the two services the five-minute trigger calls
const KEY = 'test-key-not-a-real-one', AUTH = { Authorization: 'Bearer ' + KEY };
function world(env = {}) {
  const store = new Map(), ops = [], runs = [], ev = [], other = [];
  const w = { store, ops, runs, ev, other, holdOther: null };
  const R2 = {
    async put(key, body, opts = {}) { ops.push(['put', key]); if (opts.onlyIf) { const had = store.get(key); if (opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches)) return null; }
      const buf = Buffer.from(typeof body === 'string' ? body : body.buffer ? body.buffer : body), etag = crypto.createHash('md5').update(buf).digest('hex'); store.set(key, { buf, etag, opts }); return { key, etag }; },
    async get(key) { ops.push(['get', key]); const o = store.get(key); if (!o) return null; return { body: o.buf, etag: o.etag, customMetadata: o.opts.customMetadata, async arrayBuffer() { return o.buf.buffer.slice(o.buf.byteOffset, o.buf.byteOffset + o.buf.byteLength); }, async json() { return JSON.parse(o.buf.toString('utf8')); }, async text() { return o.buf.toString('utf8'); } }; },
    async head(key) { ops.push(['head', key]); const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '' } = {}) { ops.push(['list', prefix]); const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort(); return { objects: all.map(key => ({ key, size: store.get(key).buf.length })), truncated: false }; },
    async delete(key) { ops.push(['delete', key]); store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], status: a[3], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, ADMIN_KEY: KEY, ...env };
  w.fetch = async url => { const u = String(url);
    if (u.includes('view.eumetsat.int')) { ev.push(u); return new Response('unavailable (test)', { status: 503 }); }
    other.push(u); if (w.holdOther) await w.holdOther;
    return new Response('unavailable (test)', { status: 503 }); };
  /** every trace of Earth from Space work, of any kind */
  w.evWork = () => ({ requests: ev.length, r2: ops.filter(o => String(o[1]).startsWith('earthview')).length, rows: runs.filter(r => r.layer === 'earthview').length });
  /** what the rest of the trigger did: R2 calls outside earthview/ and run-log rows of other layers */
  w.otherWork = () => JSON.stringify([ops.filter(o => !String(o[1]).startsWith('earthview')).map(o => [o[0], String(o[1]).replace(/\d{4}-\d\d-\d\dT\d\d-\d\dZ/, '<slot>')]), runs.filter(r => r.layer !== 'earthview').map(r => [r.layer, r.status]), other.length]);
  return w;
}
const use = w => { globalThis.fetch = w.fetch; };
const none = w => { const e = w.evWork(); return e.requests === 0 && e.r2 === 0 && e.rows === 0; };
const CTX = { waitUntil() { } };
const FIVE = '*/5 * * * *';
const tick = async (W, w, ms, cron = FIVE) => { use(w); const n = LOG.length; await W.default.scheduled({ cron, scheduledTime: ms }, w.env, CTX); return { job: jobLines(n)[0] || null, lines: evLines(n) }; };
const post = async (W, w, p, { method = 'POST', headers = AUTH } = {}) => { use(w); const n = LOG.length; const r = await W.default.fetch(new Request('https://hub.test' + p, { method, headers }), w.env, CTX); let j = null; try { j = await r.json(); } catch (_) { } return { http: r.status, j, lines: evLines(n), cache: r.headers.get('cache-control') }; };
const iso = ms => new RealDate(ms).toISOString().replace('.000Z', 'Z');
const at = (h, m, s = 8, d = 24) => RealDate.UTC(2026, 10, d, h, m, s);   // scheduled times carry :08, as seen on this account on 21 Nov
const FROM = '2026-11-24T06:00:00Z', UNTIL = '2026-11-26T06:00:00Z', WIN = { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: UNTIL };
const admitted = t => /earthview:down storage is not set up/.test(t.job || '') && t.lines.length === 2 && t.lines[0].earthview === 'run-start' && t.lines[1].earthview === 'run-end';
const refused = (t, why) => (t.job || '').includes('earthview:not scheduled (' + why + ')') && t.lines.length === 0;

// baseline: what the five-minute trigger's other collector does when Earth from Space is off
let BASE; { const W = await load(), w = world(); setNow(at(7, 10)); await tick(W, w, at(7, 10)); BASE = w.otherWork(); if (process.env.SHOW) realLog(BASE); ok('0 baseline: with the gate unset the earthquake collector runs (one request, one run-log row) and nothing of Earth from Space happens', w.other.length === 1 && w.runs.some(r => r.layer === 'usgs') && none(w), [w.other.length, w.runs, w.evWork()]); }

// ===== G. The three-state gate, through the real handlers
for (const [label, g] of [['unset', undefined], ['"manual"', 'manual'], ['"0"', '0'], ['""', ''], ['"yes"', 'yes'], ['"true"', 'true'], ['"MANUAL"', 'MANUAL'], ['" 1"', ' 1'], ['"1 "', '1 '], ['"01"', '01']]) {
  const W = await load(), w = world({ EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: UNTIL }); if (g !== undefined) w.env.EARTHVIEW_ENABLED = g; setNow(at(7, 10));
  const t = await tick(W, w, at(7, 10));
  ok(`G1 gate ${label}, a valid window, a tick inside it: the scheduled path does not run`, /earthview:not scheduled \(/.test(t.job || '') && t.lines.length === 0 && none(w), [t.job, w.evWork()]);
  ok(`G2 gate ${label}: the trigger's other collector did exactly what it does with Earth from Space off`, w.otherWork() === BASE, w.otherWork());
  if (g !== 'manual') { const w2 = world(); if (g !== undefined) w2.env.EARTHVIEW_ENABLED = g; const r = await post(W, w2, '/admin/run/earthview');
    ok(`G3 gate ${label}: the manual run is refused, with no Earth from Space work`, r.http === 200 && /^earthview:not run \(/.test(r.j.result) && r.lines.length === 0 && none(w2) && r.cache === 'no-store', [r, w2.evWork()]); }
  if (g !== undefined) { const w3 = world(); w3.env.EARTHVIEW_ENABLED = g; const r = await post(W, w3, '/admin/probe/earthview', { headers: { authorization: 'Bearer ' + KEY } });
    ok(`G4 gate ${label}: the Stage B probe refuses (409), no request`, r.http === 409 && none(w3), [r.http, r.j, w3.evWork()]); }
}
{ const W = await load(), w = world({ EARTHVIEW_ENABLED: 'manual' }); setNow(at(7, 21));
  const r = await post(W, w, '/admin/run/earthview');
  ok('G5 gate "manual": the manual run IS admitted (it reaches the collector, which stops at "storage is not set up")', r.http === 200 && r.j.result === 'earthview:down storage is not set up' && r.lines.length === 2 && r.lines[0].trigger === 'manual' && r.lines[0].scheduled_time === null && w.evWork().r2 > 0, [r, w.evWork()]);
  ok('G5 a guard stop makes no request to EUMETView', w.ev.length === 0, w.ev);
  const t = await tick(W, w, at(7, 30)); ok('G6 gate "manual": the scheduled path still does not run', refused(t, 'EARTHVIEW_ENABLED is manual'), t); }
{ const W = await load(), w = world({ ...WIN }); setNow(at(7, 10));
  const t = await tick(W, w, at(7, 10)); ok('G7 gate "1" and a tick inside the window: the scheduled path IS admitted', admitted(t) && t.lines[0].trigger === 'scheduled' && t.lines[0].scheduled_time === iso(at(7, 10)).replace('Z', '.000Z'), t);
  ok('G7 and the other collector did exactly its usual work', w.otherWork() === BASE, w.otherWork());
  const r = await post(W, w, '/admin/run/earthview'); ok('G8 gate "1": the manual run is admitted too, whatever the window says', r.j.result === 'earthview:down storage is not set up' && r.lines.length === 2, r);
  const t5 = await tick(W, w, at(7, 15)); ok('G9 gate "1", minute 15: skipped by the ten-minute cadence, no Earth from Space work in that tick', /earthview:skipped \(every ten minutes\)/.test(t5.job) && t5.lines.length === 0, t5); }
{ const W = await load(), w = world({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: '2026-11-24T00:00:00Z', EARTHVIEW_UNTIL: '2026-11-24T06:00:00Z' }); setNow(at(7, 21));
  const r = await post(W, w, '/admin/run/earthview'); ok('G10 gate "1" with the window already over: the manual run is still admitted (the window governs the scheduled path only)', r.j.result === 'earthview:down storage is not set up', r); }

// ===== W. The admission window, through the real scheduled handler
{ const W = await load();
  const cases = [
    ['the tick before FROM (05:50:08)', at(5, 50), false, 'before the window'], ['one second before FROM', RealDate.UTC(2026, 10, 24, 5, 59, 59), false, 'before the window'],
    ['exactly FROM', RealDate.UTC(2026, 10, 24, 6, 0, 0), true], ['the first slot (06:00:08)', at(6, 0), true], ['mid-window', at(18, 40, 8, 25), true],
    ['the last slot (05:50:08 on the 26th)', at(5, 50, 8, 26), true], ['one millisecond before UNTIL', RealDate.UTC(2026, 10, 26, 6, 0, 0) - 1, false, null],
    ['exactly UNTIL', RealDate.UTC(2026, 10, 26, 6, 0, 0), false, 'after the window'], ['the first tick after UNTIL (06:00:08)', at(6, 0, 8, 26), false, 'after the window'], ['a day later', at(6, 0, 8, 27), false, 'after the window'],
  ];
  for (const [name, ms, admit, why] of cases) { const w = world({ ...WIN }); setNow(ms + 1500); const t = await tick(W, w, ms);
    if (why === null) ok(`W1 ${name}: minute 59 is inside the window but off the ten-minute cadence, so nothing runs`, /earthview:skipped/.test(t.job) && t.lines.length === 0 && none(w), t);
    else ok(`W1 ${name}: ${admit ? 'admitted' : 'refused, "' + why + '", no Earth from Space work'}`, admit ? admitted(t) : refused(t, why) && none(w) && w.otherWork() === BASE, [t.job, t.lines.length, w.evWork()]); }
  // late and early delivery: the boundary is the trigger's SCHEDULED time, not the clock when it runs
  { const w = world({ ...WIN }), ms = at(5, 50, 8, 26); setNow(RealDate.UTC(2026, 10, 26, 7, 30, 0)); const t = await tick(W, w, ms);
    ok('W2 the last slot delivered 100 minutes late, after UNTIL by the clock: still admitted (the window selects scheduled times; it is not a deadline)', admitted(t), t); }
  { const w = world({ ...WIN }), ms = at(6, 0, 8, 26); setNow(RealDate.UTC(2026, 10, 26, 5, 58, 0)); const t = await tick(W, w, ms);
    ok('W3 a trigger scheduled just after UNTIL but run while the clock is still before it: refused', refused(t, 'after the window') && none(w), t); }
  { const w = world({ ...WIN }), ms = at(5, 50); setNow(RealDate.UTC(2026, 10, 24, 6, 20, 0)); const t = await tick(W, w, ms);
    ok('W4 a trigger scheduled before FROM but delivered after it: refused', refused(t, 'before the window') && none(w), t); }
  { const w = world({ ...WIN }), ms = at(6, 0); setNow(RealDate.UTC(2026, 10, 24, 5, 59, 0)); const t = await tick(W, w, ms);
    ok('W5 the first slot run while the clock still reads before FROM: admitted', admitted(t), t); }
  // malformed windows: every one fails closed
  const bad = [
    ['FROM missing', { EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'], ['UNTIL missing', { EARTHVIEW_FROM: FROM }, 'window not set or not readable'], ['both missing', {}, 'window not set or not readable'],
    ['UNTIL empty', { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '' }, 'window not set or not readable'], ['FROM not a date', { EARTHVIEW_FROM: 'soon', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'],
    ['FROM without the Z', { EARTHVIEW_FROM: '2026-11-24T06:00:00', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'], ['FROM with an offset', { EARTHVIEW_FROM: '2026-11-24T08:00:00+02:00', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'],
    ['FROM with milliseconds', { EARTHVIEW_FROM: '2026-11-24T06:00:00.000Z', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'], ['FROM off the ten-minute mark', { EARTHVIEW_FROM: '2026-11-24T06:05:00Z', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'],
    ['UNTIL with seconds', { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-26T06:00:08Z' }, 'window not set or not readable'], ['a date only', { EARTHVIEW_FROM: '2026-11-24', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'],
    ['a number of milliseconds', { EARTHVIEW_FROM: String(RealDate.UTC(2026, 10, 24, 6)), EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'], ['a date that does not exist (31 Nov)', { EARTHVIEW_FROM: '2026-11-31T06:00:00Z', EARTHVIEW_UNTIL: '2026-12-02T06:00:00Z' }, 'window not set or not readable'],
    ['hour 24', { EARTHVIEW_FROM: '2026-11-24T24:00:00Z', EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'], ['surrounding space', { EARTHVIEW_FROM: ' ' + FROM, EARTHVIEW_UNTIL: UNTIL }, 'window not set or not readable'],
    ['UNTIL equal to FROM', { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: FROM }, 'window empty or inverted'], ['UNTIL before FROM', { EARTHVIEW_FROM: UNTIL, EARTHVIEW_UNTIL: FROM }, 'window empty or inverted'],
    ['48 hours and ten minutes', { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-26T06:10:00Z' }, 'window longer than 48 hours'], ['a year', { EARTHVIEW_FROM: '2026-01-01T00:00:00Z', EARTHVIEW_UNTIL: '2027-01-01T00:00:00Z' }, 'window longer than 48 hours'],
  ];
  for (const [name, env, why] of bad) { const w = world({ EARTHVIEW_ENABLED: '1', ...env }), ms = /31 Nov/.test(name) ? RealDate.UTC(2026, 11, 1, 12, 0, 8) : /a year/.test(name) ? at(7, 10) : /UNTIL before FROM/.test(name) ? at(7, 10, 8, 25) : at(7, 10); setNow(ms); const t = await tick(W, w, ms);
    ok(`W6 gate "1", ${name}: refused ("${why}"), no Earth from Space work, the other collector as usual`, refused(t, why) && none(w) && w.otherWork() === BASE, [t.job, w.evWork()]); }
  { const w = world({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: UNTIL }), t = await tick(W, w, at(7, 10)); ok('W7 exactly 48 hours is accepted', admitted(t), t); }
  ok('W8 evMark reads only the one exact form', W.evMark(FROM) === RealDate.UTC(2026, 10, 24, 6) && [undefined, null, 1, '', '2026-11-24T06:00:00z', '2026-11-24 06:00:00Z', '2026-13-01T00:00:00Z', '2026-02-30T00:00:00Z'].every(v => W.evMark(v) === null), [W.evMark(FROM)]);
  ok('W9 evAdmit with no usable scheduled time refuses', [undefined, null, NaN, Infinity, '1795500608000'].every(v => W.evAdmit({ ...WIN }, v).admit === false), null);
}
// 49 hours of five-minute triggers around the window: exactly 288 are admitted, each a distinct scheduled time
{ const W = await load(), w = world({ ...WIN }), start = RealDate.UTC(2026, 10, 24, 5, 30, 8); let n = 0; const seen = new Set(), execs = new Set(), outside = [];
  for (let k = 0; k < 49 * 12; k++) { const ms = start + k * 300000; setNow(ms + 900); const t = await tick(W, w, ms);
    if (t.lines.length) { n++; seen.add(t.lines[0].scheduled_time); execs.add(t.lines[0].exec); if (ms < RealDate.UTC(2026, 10, 24, 6) || ms >= RealDate.UTC(2026, 10, 26, 6)) outside.push(iso(ms)); } }
  ok('W10 588 triggers across 49 hours: exactly 288 picture runs admitted, 288 distinct scheduled times, 288 distinct execution ids, none outside the window', n === 288 && seen.size === 288 && execs.size === 288 && outside.length === 0, [n, seen.size, execs.size, outside]);
  ok('W10 and the earthquake collector ran on all 588', w.runs.filter(r => r.layer === 'usgs').length === 588, w.runs.filter(r => r.layer === 'usgs').length); }
// the same thing with the trigger scheduled on the minute (:00), in case the account's offset changes
{ const W = await load(), w = world({ ...WIN }), start = RealDate.UTC(2026, 10, 24, 5, 30, 0); let n = 0;
  for (let k = 0; k < 49 * 12; k++) { const ms = start + k * 300000; setNow(ms + 900); const t = await tick(W, w, ms); if (t.lines.length) n++; }
  ok('W11 with triggers scheduled at second :00 instead of :08: still exactly 288', n === 288, n); }

// ===== D. A scheduled time delivered twice: the window does not deduplicate; the two executions can be told apart
{ const W = await load(), w = world({ ...WIN }), ms = at(7, 10); setNow(ms + 1000); const a = await tick(W, w, ms); setNow(ms + 4000); const b = await tick(W, w, ms);
  ok('D1 the same scheduled time delivered twice: BOTH are admitted (the window is not an exactly-once mechanism)', admitted(a) && admitted(b), [a.job, b.job]);
  ok('D2 the two executions have the same scheduled_time and different exec ids, on both of their lines', a.lines[0].scheduled_time === b.lines[0].scheduled_time && a.lines[0].exec !== b.lines[0].exec && a.lines[1].exec === a.lines[0].exec && b.lines[1].exec === b.lines[0].exec && /^[0-9a-f]{12}$/.test(a.lines[0].exec), [a.lines, b.lines]);
  ok('D3 the second execution reports the first as an earlier scheduled invocation of the same cron', a.lines[0].scheduled_before === 0 && b.lines[0].scheduled_before === 1 && b.lines[0].crons_before[FIVE] === 1, [a.lines[0], b.lines[0]]); }

// ===== A. The key in the Authorization header only
{ const W = await load();
  const calls = [];
  const go = async (name, p, o, want, check) => { const w = world({ EARTHVIEW_ENABLED: 'manual' }); const r = await post(W, w, p, o); const noStore = w.ops.length === 0 && w.runs.length === 0 && w.ev.length === 0 && r.lines.length === 0; calls.push(name);
    ok(`A ${name}: ${want}${check === 'touches' ? '' : ', and nothing is read, written, requested or logged'}`, r.http === want && (check === 'touches' ? true : noStore) && r.cache === 'no-store', [r.http, r.j, w.ops.slice(0, 4), r.lines.length]); return { r, w }; };
  // the manual run
  await go('run: GET with the right header', '/admin/run/earthview', { method: 'GET' }, 405);
  await go('run: PUT', '/admin/run/earthview', { method: 'PUT' }, 405);
  await go('run: POST with no header', '/admin/run/earthview', { headers: {} }, 403);
  await go('run: POST with a wrong key', '/admin/run/earthview', { headers: { Authorization: 'Bearer nope' } }, 403);
  await go('run: POST with the bare key, no "Bearer "', '/admin/run/earthview', { headers: { Authorization: KEY } }, 403);
  await go('run: POST with "Basic"', '/admin/run/earthview', { headers: { Authorization: 'Basic ' + KEY } }, 403);
  await go('run: POST with the key in the URL and no header', '/admin/run/earthview?key=' + KEY, { headers: {} }, 400);
  await go('run: POST with the key in the URL AND the right header', '/admin/run/earthview?key=' + KEY, {}, 400);
  await go('run: POST with a WRONG key in the URL and the right header', '/admin/run/earthview?key=nope', {}, 400);
  await go('run: POST with the right header and any other query string', '/admin/run/earthview?x=1', {}, 400);
  await go('run: POST to a longer path', '/admin/run/earthview/now', {}, 404);
  { const { r, w } = await go('run: POST with the right header', '/admin/run/earthview', {}, 200, 'touches'); ok('A run: the right call reaches the collector', r.j.result === 'earthview:down storage is not set up' && r.lines.length === 2 && w.evWork().r2 > 0, r); }
  // the storage admin routes
  for (const a of ['status', 'hold', 'recover', 'sweep', 'release']) {
    await go(`${a}: GET with no header`, '/admin/earthview/' + a, { method: 'GET', headers: {} }, 403);
    await go(`${a}: GET with the key in the URL`, '/admin/earthview/' + a + '?key=' + KEY, { method: 'GET', headers: {} }, 400);
    await go(`${a}: POST apply=1 with the key in the URL and the right header`, '/admin/earthview/' + a + '?apply=1&key=' + KEY, {}, 400);
    await go(`${a}: PUT`, '/admin/earthview/' + a, { method: 'PUT' }, 405);
    await go(`${a}: DELETE`, '/admin/earthview/' + a, { method: 'DELETE' }, 405);
    await go(`${a}: an unknown parameter`, '/admin/earthview/' + a + '?force=1', { method: 'GET' }, 400);
    await go(`${a}: a longer path`, '/admin/earthview/' + a + '/x', { method: 'GET' }, 404);
    { const { r, w } = await go(`${a}: GET with the right header (a dry run; sweep and release answer 409 on empty storage)`, '/admin/earthview/' + a, { method: 'GET' }, a === 'release' || a === 'sweep' ? 409 : 200, 'touches'); ok(`A ${a}: the right call reaches the storage code and a dry run writes nothing`, w.ops.some(o => o[0] !== 'put' && String(o[1]).startsWith('earthview')) && !w.ops.some(o => o[0] === 'put' || o[0] === 'delete') && r.j.applied === false, [r.j, w.ops.length]); }
  }
  await go('an unknown action, right header', '/admin/earthview/wipe', { method: 'GET' }, 404);
  await go('an unknown action, no header', '/admin/earthview/wipe', { method: 'GET', headers: {} }, 404);
  await go('the bare /admin/earthview', '/admin/earthview', { method: 'GET' }, 404);
  await go('a prefix of an action', '/admin/earthview/stat', { method: 'GET' }, 404);
  await go('an action with a suffix', '/admin/earthview/statusx', { method: 'GET' }, 404);
  // nothing above ever printed the key
  ok('A no log line of any kind contains the test key', !LOG.some(a => a.some(x => String(x).includes(KEY))), null);
  ok('A the other /admin/run/<job> routes are unchanged: the generic route still answers a job it does not know by the old rule (403 without ?key=)', await (async () => { const w = world(); use(w); const r = await W.default.fetch(new Request('https://hub.test/admin/run/nonsense'), w.env, CTX); return r.status === 403; })(), null);
}

// ===== L. The snapshot: "before" means before this invocation began, and stays what it was
{ const W = await load(), w = world({ ...WIN }); setNow(at(7, 10));
  const t1 = await tick(W, w, at(7, 10));
  ok('L1 the first invocation in an isolate reports nothing before it: 0 scheduled, 0 fetches, an empty per-cron tally, an isolate id, an age, its cron and the hub version', t1.lines[0].scheduled_before === 0 && t1.lines[0].fetches_before === 0 && JSON.stringify(t1.lines[0].crons_before) === '{}' && /^[0-9a-f]{8}$/.test(t1.lines[0].isolate) && t1.lines[0].isolate_age_ms >= 0 && t1.lines[0].cron === FIVE && t1.lines[0].hub === '0.6.22', t1.lines[0]);
  use(w); await W.default.fetch(new Request('https://hub.test/health'), w.env, CTX); await W.default.fetch(new Request('https://hub.test/health'), w.env, CTX);
  await W.default.scheduled({ cron: '7 * * * *', scheduledTime: at(7, 7, 59) }, { ...w.env, R2: w.env.R2, DB: w.env.DB }, CTX).catch(() => { });
  await W.default.scheduled({ cron: '*/15 * * * *', scheduledTime: at(7, 15, 40) }, w.env, CTX).catch(() => { });
  const t2 = await tick(W, w, at(7, 20));
  ok('L2 a later run reports the earlier invocations by kind: 3 scheduled (one each of */5, hourly, */15), 2 fetches', t2.lines[0].scheduled_before === 3 && t2.lines[0].fetches_before === 2 && t2.lines[0].crons_before[FIVE] === 1 && t2.lines[0].crons_before['7 * * * *'] === 1 && t2.lines[0].crons_before['*/15 * * * *'] === 1 && Object.keys(t2.lines[0].crons_before).length === 3, t2.lines[0]);
  ok('L3 the current invocation is never counted as earlier (the live counter is one more than the line says)', W.EVB.scheduled === t2.lines[0].scheduled_before + 1 && W.EVB.crons[FIVE] === t2.lines[0].crons_before[FIVE] + 1, [W.EVB.scheduled, W.EVB.crons, t2.lines[0]]);
  ok('L4 both lines of a run carry the same exec and isolate; run-end carries the result', t2.lines[1].exec === t2.lines[0].exec && t2.lines[1].isolate === t2.lines[0].isolate && t2.lines[1].result === 'earthview:down storage is not set up' && t2.lines[1].validations_before === null && t2.lines[1].validated === null, t2.lines);
  ok('L5 the snapshot object is frozen, tally included', (() => { const s = W.evbSeen('fetch'); return Object.isFrozen(s) && Object.isFrozen(s.crons_before); })(), null);
}
// A starts, A awaits, B starts, A resumes: A's "before" values are unchanged
{ const W = await load(), w = world({ ...WIN }); setNow(at(8, 0)); use(w);
  let release; w.holdOther = new Promise(r => { release = r; });
  const n = LOG.length, A = W.default.scheduled({ cron: FIVE, scheduledTime: at(8, 0) }, w.env, CTX);   // A is now waiting on the earthquake request
  await new Promise(r => setTimeout(r, 20));
  ok('L6 A is in flight and has not reached its picture run yet', evLines(n).length === 0 && w.other.length === 1 && W.EVB.scheduled === 1, [evLines(n).length, w.other.length]);
  const hold = w.holdOther; w.holdOther = null;
  await W.default.fetch(new Request('https://hub.test/health'), w.env, CTX);                                    // B1: a visitor's request
  await W.default.scheduled({ cron: '7 * * * *', scheduledTime: at(8, 7, 59) }, w.env, CTX).catch(() => { });   // B2: the hourly job starts and finishes
  ok('L6 B has started and been counted while A waits', W.EVB.scheduled === 2 && W.EVB.fetches === 1 && W.EVB.crons['7 * * * *'] === 1, [W.EVB.scheduled, W.EVB.fetches, W.EVB.crons]);
  release(); await hold; await A;
  const la = evLines(n).filter(l => l.earthview === 'run-start' && l.scheduled_time === iso(at(8, 0)).replace('Z', '.000Z'))[0];
  ok('L7 A resumes and writes its run-start line: its "before" values are those of A\'s own entry (0, 0, empty tally), not the live counters', !!la && la.scheduled_before === 0 && la.fetches_before === 0 && JSON.stringify(la.crons_before) === '{}', la);
}
// the run-start line exists before anything of the run is awaited (so it survives an invocation ended during the decode)
{ const W = await load(), w = world({ EARTHVIEW_ENABLED: 'manual' }); setNow(at(9, 21)); use(w);
  let seenAtFirstStorageCall = null; const get = w.env.R2.get, head = w.env.R2.head; const mark = () => { if (seenAtFirstStorageCall === null) seenAtFirstStorageCall = evLines(n0).filter(l => l.earthview === 'run-start').length; };
  const n0 = LOG.length; w.env.R2.get = async k => { mark(); return get(k); }; w.env.R2.head = async k => { mark(); return head(k); };
  await post(W, w, '/admin/run/earthview');
  ok('L8 run-start is already written when the run makes its first storage call', seenAtFirstStorageCall === 1, seenAtFirstStorageCall); }

console.log = realLog;
console.log(`\nearthview-gate${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
