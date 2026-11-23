/* Earth from Space, Stage B probe: POST /admin/probe/earthview (EARTH-FROM-SPACE-STAGE-B-PROPOSAL rev 2).
 * The real worker.js is run through its own fetch handler. EVERY binding that can write is a spy that records any call at all
 * (R2 bucket, D1 database), as are the cache API and ctx.waitUntil. EUMETView is stubbed; nothing reaches the network.
 * Fixtures are REAL frames (earthview-fixtures/).
 * Run: node --no-warnings phase1/earthview-probe.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   get-ok query-accepted key-from-query no-auth bare-key-ok gate-not-checked gate-only-one no-latch latch-not-released
 *   manual-ignores-gate route-writes-bucket route-writes-db error-path-writes env-passed header-one-side header-not-strict
 *   no-deadline no-deadline-check picture-retry logs-key cacheable no-scans-check no-compare counts-not-kept */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), FX = path.join(HERE, 'earthview-fixtures');
const BREAK = process.env.BREAK || '';
// The span GPT accepted at 3c7598b ran from "/* ---- Storage records, guards and recovery" up to evRoute (sha256 cbe5dc6f…1ef6 as one piece).
// 0.6.22 adds validation counting inside evCollect, so the span is asserted in three parts, each against the text of 0.6.21 (559f2e4):
//   A  records, guards, state, failure report (up to collectEarthView): byte for byte
//   C  collectEarthView and evCollect: byte for byte ONCE the 0.6.22 additions are taken back out (the test removes exactly: the x
//      parameter threaded through two signatures and one call, one added line before step 4, one added line after it, and the
//      seven "return vFail(" that were "return evFail(")
//   B  pointer shape, cleanup, runEarthView, hold/recover/sweep/release (up to evRoute): byte for byte
const SPAN_A_SHA = 'aec1c2d6df390386eb67e3e2ee1febdfc5b6309ffac6ccba5114e1e4bf630dd3', SPAN_B_SHA = '13b2c17e66652484edecdca4d6ead2df46eab36628f8d5eb2999b8511510b9d1', SPAN_C_OLD_SHA = 'f026f233f6058425598967af63de449c86768da4ef0e4707cd896de850f5ce10';
const V_BEGIN = "  const vFail = (...a) => { evValidated(x, false); return evFail(...a); }; evValidationBegin(x);   // 0.6.22: counts only (EVB); see evValidationBegin\n", V_END = "  evValidated(x, true);\n";
const BREAKS = {
  'get-ok': ["  if (req.method !== 'POST') return no(405, 'POST only');\n  if (url.search)", "  if (url.search)"],
  'query-accepted': ["  if (url.search) return no(400, 'no query string is accepted');\n", ""],
  'key-from-query': [["  if (url.search) return no(400, 'no query string is accepted');\n", ""], ["req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  if (env.EARTHVIEW_ENABLED !== undefined)", "(req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY && url.searchParams.get('key') !== env.ADMIN_KEY)) return no(403, 'forbidden');\n  if (env.EARTHVIEW_ENABLED !== undefined)"]],
  'no-auth': ["  if (!env.ADMIN_KEY || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  if (env.EARTHVIEW_ENABLED !== undefined)", "  if (env.EARTHVIEW_ENABLED !== undefined)"],
  'bare-key-ok': ["req.headers.get('authorization') !== 'Bearer ' + env.ADMIN_KEY) return no(403, 'forbidden');\n  if (env.EARTHVIEW_ENABLED !== undefined)", "(req.headers.get('authorization') || '').replace(/^Bearer /, '') !== env.ADMIN_KEY) return no(403, 'forbidden');\n  if (env.EARTHVIEW_ENABLED !== undefined)"],
  'gate-not-checked': ["  if (env.EARTHVIEW_ENABLED !== undefined) return no(409, 'collection is on (EARTHVIEW_ENABLED is set)');\n", ""],
  'gate-only-one': ["  if (env.EARTHVIEW_ENABLED !== undefined) return no(409,", "  if (env.EARTHVIEW_ENABLED === '1') return no(409,"],
  'no-latch': ["  if (EVB.busy) return no(409, 'busy');\n", ""],
  'latch-not-released': ["  finally { EVB.busy = false; }\n}", "  finally { }\n}"],
  'manual-ignores-gate': ["{ const why = evManualGate(env); return why ?", "{ const why = null; return why ?"],
  'route-writes-bucket': ["  try { return json(await evProbeOnce(), 200, NS); }", "  try { const o = await evProbeOnce(); try { await env.R2.put('earthview/probe-last.json', JSON.stringify(o)); } catch (_) {} return json(o, 200, NS); }"],
  'route-writes-db': ["  try { return json(await evProbeOnce(), 200, NS); }", "  try { const o = await evProbeOnce(); try { await logRun(env, 'earthview', Date.now(), 'ok', 200, 0, 0, 'probe ' + o.outcome); } catch (_) {} return json(o, 200, NS); }"],
  'error-path-writes': ["  catch (e) { return json({ layer: 'earthview', probe: 'stage-b', outcome: 'internal error',", "  catch (e) { try { await evFail(env, Date.now(), 'internal error', 0, 'probe'); } catch (_) {} return json({ layer: 'earthview', probe: 'stage-b', outcome: 'internal error',"],
  'env-passed': [["async function evProbeOnce() {", "async function evProbeOnce(env) {"], ["  try { return json(await evProbeOnce(), 200, NS); }", "  try { return json(await evProbeOnce(env), 200, NS); }"]],
  'header-one-side': ["  out.header_ok = pic.served === T && chk.served === T;", "  out.header_ok = pic.served === T;"],
  'header-not-strict': ["  if (!out.header_ok) return end('served time not confirmed');\n", ""],
  'no-deadline': ["limit = own => Math.max(1, Math.min(own, left()));", "limit = own => own;"],
  'no-deadline-check': ["  const late = () => { if (left() > 0) return false; out.deadline_hit = true; return true; };", "  const late = () => false;"],
  'picture-retry': ["  out.requests_made++; const pic = await evFetch('picture', picUrl, P, limit(EARTHVIEW.TIMEOUT_MS)); out.picture = side(pic, P);", "  out.requests_made++; let pic = await evFetch('picture', picUrl, P, limit(EARTHVIEW.TIMEOUT_MS)); if (!pic.ok) pic = await evFetch('picture', picUrl, P, limit(EARTHVIEW.TIMEOUT_MS)); out.picture = side(pic, P);"],
  'logs-key': ["  EVB.busy = true;\n  try { return json(await evProbeOnce(), 200, NS); }", "  EVB.busy = true; console.log('probe called', JSON.stringify(Object.fromEntries(req.headers)));\n  try { return json(await evProbeOnce(), 200, NS); }"],
  'cacheable': ["  try { return json(await evProbeOnce(), 200, NS); }", "  try { return json(await evProbeOnce(), 200); }"],
  'no-scans-check': ["  if (!sc.complete) return no(`scans incomplete: ${sc.missing} coefficient positions not delivered at full precision in ${sc.scans} scans`);\n  const png = await evPng(new Uint8Array(chkBuf), C.w * C.h);\n  if (!png || png.w !== C.w || png.h !== C.h) return { ok: false, reason: 'check image failed validation'", "  const png = await evPng(new Uint8Array(chkBuf), C.w * C.h);\n  if (!png || png.w !== C.w || png.h !== C.h) return { ok: false, reason: 'check image failed validation'"],
  'no-compare': ["  if (!cmp.ok) return { ...cmp, ok: false, reason: 'picture failed validation', detail: cmp.reason, progressive: sc.progressive, scans: sc.scans };\n  return { ...cmp, ok: true, reason: null, progressive: sc.progressive, scans: sc.scans };\n}\n/** One observation.", "  return { ...cmp, ok: true, reason: null, progressive: sc.progressive, scans: sc.scans };\n}\n/** One observation."],
  'counts-not-kept': ["  EVB.validations++; EVB.last_attempt = attempt;\n", ""],
};
const baseSrc = fs.readFileSync(process.env.WORKER || path.join(HERE, 'worker.js'), 'utf8');
const patch = (src, parts, name) => { for (const b of Array.isArray(parts[0]) ? parts : [parts]) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + name); process.exit(1); } src = src.replace(b[0], b[1]); } return src; };
let src = baseSrc;
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); } src = patch(src, BREAKS[BREAK], BREAK); }
let nMod = 0;
/** a fresh copy of the Worker module: its own isolate counters and latch */
const load = async (s = src) => { const tmp = path.join(os.tmpdir(), `worker-evb-${process.pid}-${nMod++}.mjs`); fs.writeFileSync(tmp, s); try { return await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); } };
// variants of the file under test, for outcomes that cannot be reached through the stubbed service
const VARIANT = {
  compareThrows: ["  const cmp = evCompare(dec, png);\n  if (!cmp.ok) return { ...cmp, ok: false, reason: 'picture failed validation', detail: cmp.reason, progressive: sc.progressive, scans: sc.scans };", "  const cmp = (() => { throw new Error('decoder gave up (test)'); })();\n  if (!cmp.ok) return { ...cmp, ok: false, reason: 'picture failed validation', detail: cmp.reason, progressive: sc.progressive, scans: sc.scans };"],
  onceThrows: ["  say('start', { hub: COLLECTOR_VERSION, size: P.w, deadline_ms: EVB.DEADLINE_MS, isolate_state: isolate });", "  say('start', { hub: COLLECTOR_VERSION, size: P.w, deadline_ms: EVB.DEADLINE_MS, isolate_state: isolate }); throw new Error('unexpected (test)');"],
};
const realLog = console.log.bind(console);
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { realLog('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; realLog(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 700) : ''}`); } };
// ---------- movable clock
const RealDate = Date; let offset = 0;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } };
const advance = ms => { offset += ms; };
// ---------- every AbortSignal.timeout the Worker asks for is recorded
const timeouts = [], realTimeout = AbortSignal.timeout.bind(AbortSignal); AbortSignal.timeout = ms => { timeouts.push(ms); return realTimeout(Math.min(ms, 2 ** 31 - 1)); };
// ---------- fixtures: real frames, made distinct per frame time
const RAW = Object.fromEntries(['day', 'night', 'dusk'].flatMap(n => [[n + '.jpg', fs.readFileSync(path.join(FX, n + '.jpg'))], [n + '.png', fs.readFileSync(path.join(FX, n + '.png'))]]));
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'latin1'); Buffer.from(data).copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const jpg = (salt = 0, base = 'day') => { const b = RAW[base + '.jpg']; return new Uint8Array(Buffer.concat([b.subarray(0, 2), Buffer.from([0xff, 0xfe, 0x00, 0x06, salt & 255, (salt >> 8) & 255, (salt >> 16) & 255, (salt >> 24) & 255]), b.subarray(2)])); };
const png = (salt = 0, base = 'day') => { const b = RAW[base + '.png']; return new Uint8Array(Buffer.concat([b.subarray(0, b.length - 12), chunk('tEXt', Buffer.from('frame\0' + salt)), b.subarray(b.length - 12)])); };
const G = jpg(1), SOS = (() => { const o = []; for (let i = 2; i < G.length - 1; i++) if (G[i] === 0xff && G[i + 1] === 0xda) o.push(i); return o; })();
const DAMAGED = {
  'cut in half': G.slice(0, G.length >> 1), 'end marker missing': G.slice(0, G.length - 2), 'bytes after the end marker': Uint8Array.from([...G, 1, 2, 3]),
  'five of ten scans, then an end marker': Uint8Array.from([...G.slice(0, SOS[5]), 0xff, 0xd9]),
  'first scan zeroed (decodes, blank)': (() => { const b = G.slice(); b.fill(0, SOS[0] + 200, SOS[0] + 40200); return b; })(),
  'a real but 256 px JPEG': new Uint8Array(fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/picture-a.jpg'))),
};
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const layer = t => `<Layer queryable="1"><Name>mtg_fd:rgb_geocolour</Name>${t ? `<Dimension name="time" default="${t}" units="ISO8601" nearestValue="1">2024-09-23T00:00:00.000Z/${t.replace('Z', '.000Z')}/PT10M</Dimension>` : ''}</Layer>`;
const caps = t => `<WMS_Capabilities><Capability><Layer><Title>mtg_fd</Title>${layer(t)}</Layer></Capability></WMS_Capabilities>`;
// ---------- the world: spies on every binding, a stubbed service, captured log lines
const KEY = 'test-admin-key-7f3a';
function world(W, o = {}) {
  const w = { W, calls: [], reqs: [], logs: [], deferred: [], latest: '2026-11-19T11:00:00Z', base: 'day', cap: null, pic: null, chk: null, picWarn: 'echo', chkWarn: 'echo', onReq: null, ...o };
  const rec = name => new Proxy(function () { }, { get: (_, m) => m === 'then' ? undefined : rec(name + '.' + String(m)), apply: (_, __, a) => { w.calls.push(name); return rec(name + '()'); } });
  w.env = { R2: rec('R2'), DB: rec('DB'), ADMIN_KEY: KEY };
  w.ctx = { waitUntil(p) { w.deferred.push(p); }, passThroughOnException() { w.calls.push('ctx.passThroughOnException'); } };
  w.fetch = async (url, init = {}) => { const u = String(url), n = w.reqs.length; w.reqs.push({ u, headers: { ...(init.headers || {}) }, timeout: timeouts[timeouts.length - 1] });
    if (!u.includes('view.eumetsat.int')) throw new Error('unexpected fetch ' + u);
    if (w.onReq) await w.onReq(n, u);
    if (/GetCapabilities/.test(u)) { const c = w.cap || {}; if (c.throw) throw new Error('network down (test)'); return new Response(c.body !== undefined ? c.body : caps(w.latest), { status: c.status || 200, headers: { 'content-type': 'text/xml' } }); }
    const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1], salt = Date.parse(t) / 6e5;
    const spec = { ...(isPic ? { body: jpg(salt, w.base), type: 'image/jpeg' } : { body: png(salt, w.base), type: 'image/png' }), ...((isPic ? w.pic : w.chk) || {}) };
    if (spec.throw) throw new Error('The operation was aborted due to timeout (test)');
    const h = { 'content-type': spec.type }, wv = isPic ? w.picWarn : w.chkWarn;
    if (wv) h.warning = wv === 'echo' ? `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` : wv;
    return new Response(spec.body, { status: spec.status || 200, headers: h }); };
  return w;
}
const use = w => { globalThis.fetch = w.fetch; globalThis.caches = new Proxy({}, { get: (_, m) => { w.calls.push('caches.' + String(m)); return new Proxy(function () { }, { get: () => async () => undefined, apply: async () => undefined }); } }); console.log = (...a) => { w.logs.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); }; };
/** one call to the hub's own fetch handler */
const call = async (w, { method = 'POST', path: p = '/admin/probe/earthview', headers = { authorization: 'Bearer ' + KEY }, body } = {}) => { use(w);
  const r = await w.W.default.fetch(new Request('https://hub.test' + p, { method, headers, body }), w.env, w.ctx); await Promise.allSettled(w.deferred);
  let j = null; try { j = await r.clone().json(); } catch (_) { } return { http: r.status, cache: r.headers.get('cache-control'), j }; };
const lines = w => w.logs.map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(l => l && l.probe === 'earthview-stage-b');
const untouched = w => w.calls.length === 0 && w.deferred.length === 0;
const W0 = await load();

// ===== A. Who may call it: POST, key in the Authorization header, no query string. Refusals do nothing at all.
{ const refusals = [
    ['A1 GET is refused', { method: 'GET' }, 405], ['A2 PUT is refused', { method: 'PUT' }, 405], ['A3 DELETE is refused', { method: 'DELETE' }, 405],
    ['A4 a query string is refused even with the right header', { path: '/admin/probe/earthview?x=1' }, 400],
    ['A5 the key in the URL is refused (with no header)', { path: '/admin/probe/earthview?key=' + KEY, headers: {} }, 400],
    ['A6 the key in the URL is refused (with the right header too)', { path: '/admin/probe/earthview?key=' + KEY }, 400],
    ['A7 no Authorization header', { headers: {} }, 403], ['A8 a wrong key', { headers: { authorization: 'Bearer wrong' } }, 403],
    ['A9 the bare key without "Bearer"', { headers: { authorization: KEY } }, 403], ['A10 the key in another header', { headers: { 'x-admin-key': KEY } }, 403],
    ['A11 the key in the body', { headers: {}, body: JSON.stringify({ key: KEY }) }, 403] ];
  for (const [name, o, want] of refusals) { const w = world(W0), r = await call(w, o);
    ok(name + `: ${want}, no upstream request, no binding touched, nothing logged by the probe, not cacheable`, r.http === want && w.reqs.length === 0 && untouched(w) && lines(w).length === 0 && r.cache === 'no-store', { http: r.http, reqs: w.reqs.length, calls: w.calls, cache: r.cache }); }
  { const w = world(W0); delete w.env.ADMIN_KEY; const r = await call(w, { headers: { authorization: 'Bearer undefined' } }); ok('A12 with no admin key configured nothing is accepted', r.http === 403 && w.reqs.length === 0 && untouched(w), r); }
  { const w = world(W0); delete w.env.ADMIN_KEY; const r = await call(w, { headers: { authorization: 'Bearer ' } }); ok('A13 with no admin key configured an empty bearer is refused', r.http === 403 && w.reqs.length === 0, r); }
  { const w = world(W0), r = await call(w, { path: '/admin/probe/earthview/extra' }); ok('A14 a longer path is not this route and makes no upstream request', r.http !== 200 && w.reqs.length === 0 && untouched(w), r); }
}

// ===== B. A complete observation
let firstAttempt = null;
{ const W = await load(), w = world(W), t = w.latest, r = await call(w), j = r.j, L = lines(w);
  firstAttempt = j && j.attempt;
  ok('B1 answers 200, no-store, outcome validated', r.http === 200 && r.cache === 'no-store' && j.outcome === 'validated', { http: r.http, cache: r.cache, outcome: j && j.outcome });
  ok('B2 exactly three upstream requests, in order: frame list, 2,048 px JPEG, 256 px PNG, both for the newest listed time', w.reqs.length === 3 && j.requests_made === 3 && /GetCapabilities/.test(w.reqs[0].u) && /width=2048&height=2048&format=image\/jpeg/.test(w.reqs[1].u) && w.reqs[1].u.endsWith('&time=' + t) && /width=256&height=256&format=image\/png&transparent=true/.test(w.reqs[2].u) && w.reqs[2].u.endsWith('&time=' + t), w.reqs.map(q => q.u.slice(-90)));
  ok('B3 upstream requests carry the hub User-Agent and nothing else: no key, no Authorization', w.reqs.every(q => Object.keys(q.headers).join() === 'User-Agent' && /^mother-earth-collector\/0\.6\.24 /.test(q.headers['User-Agent'])) && !JSON.stringify(w.reqs).includes(KEY), w.reqs.map(q => q.headers));
  ok('B4 NO binding was touched: bucket, database, cache, deferred work', untouched(w), { calls: w.calls, deferred: w.deferred.length });
  ok('B5 the answer names the frame, both responses and their hashes', j.frame_time === t && j.size === 2048 && j.header_ok === true && j.picture.ok && j.check.ok && j.picture.sha256 === sha(jpg(Date.parse(t) / 6e5)) && j.check.sha256 === sha(png(Date.parse(t) / 6e5)) && j.picture.header_names === t && j.check.header_names === t && j.picture.type === 'image/jpeg' && j.check.type === 'image/png' && j.picture.bytes > 100000, j);
  ok('B6 validation figures, with its own start and end', j.validation.ok === true && j.validation.agreement > 0.85 && j.validation.scans >= 1 && typeof j.validation.started_at === 'string' && j.validation.ended_at >= j.validation.started_at && Number.isFinite(j.validation.wall_ms) && j.started_at <= j.validation.started_at && j.validation.ended_at <= j.ended_at, j.validation);
  ok('B7 run start, end, deadline and build are stated', j.deadline_ms === 150000 && j.deadline_hit === false && j.build === W.EVB.BUILD && j.hub === '0.6.24' && /^[0-9a-f]{12}$/.test(j.attempt) && Number.isFinite(j.wall_ms), j);
  ok('B8 log lines: start, fetched, validate-begin, validated, done, each with the attempt, build and isolate', L.map(l => l.ev).join() === 'start,fetched,validate-begin,validated,done' && L.every(l => l.attempt === j.attempt && l.build === j.build && l.isolate === j.isolate.id && typeof l.at === 'string'), L.map(l => [l.ev, l.attempt, l.isolate]));
  ok('B9 no log line and no part of the answer contains the key or the word Bearer', !w.logs.join('\n').includes(KEY) && !/bearer/i.test(w.logs.join('\n')) && !JSON.stringify(j).includes(KEY), w.logs);
  ok('B10 the done line agrees with the answer', (() => { const d = L[L.length - 1]; return d.outcome === j.outcome && d.requests_made === 3 && d.header_ok === true && d.frame_time === t && d.deadline_hit === false; })(), L[L.length - 1]);
  ok('B11 isolate report on the first call: named, no validation before it', /^[0-9a-f]{8}$/.test(j.isolate.id) && j.isolate.validations_before === 0 && j.isolate.previous_attempt === null && j.isolate.requests_served === 1 && j.isolate.scheduled_runs === 0 && j.isolate.age_ms >= 0, j.isolate);
  ok('B12 each request got a time limit no longer than its own: 30 s list, 90 s pictures', w.reqs[0].timeout <= 30000 && w.reqs[0].timeout > 29000 && w.reqs[1].timeout <= 90000 && w.reqs[2].timeout <= 90000, w.reqs.map(q => q.timeout));
  // a second call in the same isolate, after other traffic
  await W.default.fetch(new Request('https://hub.test/nothing-here'), w.env, w.ctx); await W.default.scheduled({ cron: 'not a cron', scheduledTime: Date.now() }, w.env, w.ctx);
  const w2 = world(W, { latest: '2026-11-19T11:10:00Z', base: 'night' }), r2 = await call(w2);
  ok('B13 a second call in the same isolate says so: same isolate id, one validation before, the previous attempt, the traffic in between', r2.j.outcome === 'validated' && r2.j.isolate.id === j.isolate.id && r2.j.isolate.validations_before === 1 && r2.j.isolate.previous_attempt === j.attempt && r2.j.isolate.requests_served === 3 && r2.j.isolate.scheduled_runs === 1 && r2.j.attempt !== j.attempt, r2.j.isolate);
  ok('B14 the second call also touched no binding', untouched(w2), w2.calls);
  const w3 = world(W, { latest: '2026-11-19T11:20:00Z', base: 'dusk' }), r3 = await call(w3); ok('B15 a dusk frame validates too', r3.j.outcome === 'validated' && untouched(w3), r3.j.validation);
}

// ===== C. Every other outcome: reported, nothing touched, never more than three requests, and the next call still works
{ const W = await load();
  const cases = [
    ['C1 frame list: no answer', { cap: { throw: true } }, 'fetch failed', 1, j => j.list.ok === false && j.list.reason === 'no answer' && j.frame_time === null],
    ['C2 frame list: HTTP 503', { cap: { status: 503 } }, 'fetch failed', 1, j => j.list.http === 503],
    ['C3 frame list: unreadable', { cap: { body: '<html>maintenance</html>' } }, 'fetch failed', 1, j => j.list.reason === 'frame list unreadable'],
    ['C4 frame list: the layer has no time', { cap: { body: caps(null) } }, 'fetch failed', 1, j => j.list.ok === false],
    ['C5 picture: HTTP 503', { pic: { status: 503 } }, 'fetch failed', 2, j => j.picture.ok === false && j.picture.http === 503 && j.check === null],
    ['C6 picture: an XML error page with HTTP 200', { pic: { body: '<ServiceExceptionReport/>', type: 'text/xml' } }, 'fetch failed', 2, j => j.picture.reason === 'picture not a picture' && j.picture.detail === 'text/xml'],
    ['C7 picture: over the size limit', { pic: { body: new Uint8Array(3 * 1024 * 1024 + 1) } }, 'fetch failed', 2, j => j.picture.reason === 'picture size out of range'],
    ['C8 picture: empty', { pic: { body: new Uint8Array(0) } }, 'fetch failed', 2, j => j.picture.ok === false],
    ['C9 picture: request times out', { pic: { throw: true } }, 'fetch failed', 2, j => j.picture.reason === 'picture request failed'],
    ['C10 check image: HTTP 503 (as in Stage A)', { chk: { status: 503 } }, 'fetch failed', 3, j => j.picture.ok === true && j.check.ok === false && j.check.http === 503 && j.validation === null && j.header_ok === null],
    ['C11 check image: text/xml with HTTP 200 (as in Stage A)', { chk: { body: '<ServiceExceptionReport/>', type: 'text/xml' } }, 'fetch failed', 3, j => j.check.reason === 'check image not a picture' && j.validation === null],
    ['C12 check image: request times out', { chk: { throw: true } }, 'fetch failed', 3, j => j.check.reason === 'check image request failed'],
    ['C13 picture: no served-time header', { picWarn: null }, 'served time not confirmed', 3, j => j.header_ok === false && j.picture.header_present === false && j.validation === null],
    ['C14 check image: no served-time header', { chkWarn: null }, 'served time not confirmed', 3, j => j.header_ok === false && j.check.header_present === false && j.validation === null],
    ['C15 picture: header names another time', { picWarn: '99 Nearest value used: time=2026-11-19T10:50:00.000Z ISO8601 (mtg_fd:rgb_geocolour)' }, 'served time not confirmed', 3, j => j.picture.header_names === '2026-11-19T10:50:00Z' && j.validation === null],
    ['C16 check image: header names another time', { chkWarn: '99 Nearest value used: time=2026-11-19T10:50:00.000Z ISO8601 (mtg_fd:rgb_geocolour)' }, 'served time not confirmed', 3, j => j.check.header_names === '2026-11-19T10:50:00Z' && j.validation === null],
    ['C17 picture: header present but names no time', { picWarn: '199 something else' }, 'served time not confirmed', 3, j => j.picture.header_present === true && j.picture.header_names === null],
    ...Object.entries(DAMAGED).map(([n, body], i) => [`C${18 + i} damaged picture, ${n}: refused`, { pic: { body } }, 'validation refused', 3, j => j.validation.ok === false && j.validation.reason === 'picture failed validation' && typeof j.validation.started_at === 'string']),
    ['C24 check image that is not the check image (a JPEG sent as PNG): refused', { chk: { body: jpg(5) } }, 'validation refused', 3, j => j.validation.reason === 'check image failed validation'],
    ['C25 a picture of another frame under the right header (night picture, day check): refused', { pic: { body: jpg(3, 'night') } }, 'validation refused', 3, j => j.validation.ok === false && j.validation.detail === 'picture does not match the check image'],
  ];
  for (const [name, o, want, nReq, more] of cases) { const w = world(W, o), r = await call(w), j = r.j || {}, L = lines(w), d = L[L.length - 1] || {};
    ok(name + `: outcome "${want}", ${nReq} request${nReq > 1 ? 's' : ''}, no binding touched`, r.http === 200 && r.cache === 'no-store' && j.outcome === want && w.reqs.length === nReq && j.requests_made === nReq && untouched(w) && more(j) && L[0].ev === 'start' && d.ev === 'done' && d.outcome === want && j.deadline_hit === false && !w.logs.join('\n').includes(KEY), { http: r.http, outcome: j.outcome, reqs: w.reqs.length, calls: w.calls, list: j.list, picture: j.picture, check: j.check, validation: j.validation });
    ok(name + ': the latch is free afterwards', W.EVB.busy === false, W.EVB); }
  { const w = world(W), r = await call(w); ok('C26 after every failure above, a sound frame still validates in the same isolate', r.j.outcome === 'validated' && untouched(w), r.j.outcome); }
}
{ const W = await load(patch(src, VARIANT.compareThrows, 'variant compareThrows')), w = world(W), r = await call(w), j = r.j;
  ok('C27 the comparison throws: reported as a refusal "validation threw", three requests, no binding touched, latch free', r.http === 200 && j.outcome === 'validation refused' && j.validation.reason === 'validation threw' && /decoder gave up/.test(j.validation.detail) && w.reqs.length === 3 && untouched(w) && W.EVB.busy === false, { j, calls: w.calls }); }
{ const W = await load(patch(src, VARIANT.onceThrows, 'variant onceThrows')), w = world(W), r = await call(w);
  ok('C28 an unexpected error inside the observation: 500 "internal error", no-store, NO binding touched (no failure record is written), latch free', r.http === 500 && r.cache === 'no-store' && r.j.outcome === 'internal error' && untouched(w) && w.reqs.length === 0 && W.EVB.busy === false, { r, calls: w.calls });
  const r2 = await call(world(W)); ok('C29 and the route answers again afterwards (not stuck busy)', r2.http === 500, r2.http); }

// ===== D. One deadline for the whole run: 150 s from the start
{ const W = await load();
  { const w = world(W); w.onReq = async n => { if (n === 0) advance(100000); }; const r = await call(w), j = r.j;
    ok('D1 after a 100 s frame list, the picture request is given only the 50 s that are left', j.outcome === 'validated' && w.reqs[0].timeout === 30000 && w.reqs[1].timeout <= 50000 && w.reqs[1].timeout > 49000 && w.reqs[2].timeout <= 50000, w.reqs.map(q => q.timeout)); }
  { const w = world(W); w.onReq = async n => { if (n === 0) advance(151000); }; const r = await call(w), j = r.j;
    ok('D2 the deadline passes during the frame list: outcome "deadline", one request, no picture asked for, nothing touched', j.outcome === 'deadline' && j.deadline_hit === true && w.reqs.length === 1 && j.requests_made === 1 && j.picture === null && untouched(w), j); }
  { const w = world(W); w.onReq = async n => { if (n === 1) advance(151000); }; const r = await call(w), j = r.j;
    ok('D3 the deadline passes during the picture: outcome "deadline", two requests, the check image is never asked for, no validation', j.outcome === 'deadline' && j.deadline_hit === true && w.reqs.length === 2 && j.picture.ok === true && j.check === null && j.validation === null && untouched(w), j); }
  { const w = world(W); w.onReq = async n => { if (n === 2) advance(151000); }; const r = await call(w), j = r.j;
    ok('D4 the deadline passes during the check image: outcome "deadline", three requests, no validation started', j.outcome === 'deadline' && j.deadline_hit === true && w.reqs.length === 3 && j.validation === null && !lines(w).some(l => l.ev === 'validate-begin') && untouched(w), j); }
  { const w = world(W, { pic: { throw: true } }); w.onReq = async n => { if (n === 1) advance(151000); }; const r = await call(w), j = r.j;
    ok('D5 a request that fails as the deadline passes is reported as "deadline", not as a fetch failure', j.outcome === 'deadline' && j.deadline_hit === true && j.picture.ok === false && w.reqs.length === 2, j); }
  { const w = world(W); w.onReq = async n => { if (n === 0) advance(149990); }; const r = await call(w);
    ok('D6 with almost no time left a request still gets a positive limit, never zero or negative', w.reqs.slice(1).every(q => q.timeout >= 1), w.reqs.map(q => q.timeout)); }
  ok('D7 the latch is free after every deadline case', W.EVB.busy === false);
}

// ===== E. One at a time in an isolate
{ const W = await load(), w = world(W); let release; const gate = new Promise(r => { release = r; }); w.onReq = async n => { if (n === 1) await gate; };
  use(w); const p1 = W.default.fetch(new Request('https://hub.test/admin/probe/earthview', { method: 'POST', headers: { authorization: 'Bearer ' + KEY } }), w.env, w.ctx);
  await new Promise(r => setTimeout(r, 30));
  ok('E1 while one observation is waiting on the service, the isolate is marked busy with two requests made', W.EVB.busy === true && w.reqs.length === 2, { busy: W.EVB.busy, reqs: w.reqs.length });
  const r2 = await W.default.fetch(new Request('https://hub.test/admin/probe/earthview', { method: 'POST', headers: { authorization: 'Bearer ' + KEY } }), w.env, w.ctx), j2 = await r2.json();
  ok('E2 a second call meanwhile: 409 "busy", no request, no validation, no binding touched', r2.status === 409 && j2.error === 'busy' && w.reqs.length === 2 && untouched(w) && r2.headers.get('cache-control') === 'no-store', { s: r2.status, j2, reqs: w.reqs.length });
  // F. collection is excluded while the probe is in flight
  const m1 = await W.JOBS.earthview(w.env, Date.now()), rr = await W.default.fetch(new Request('https://hub.test/admin/run/earthview', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY } }), w.env, w.ctx), m2 = await rr.json();
  ok('F1 probe in flight, gate unset: the manual collector job does not run: no request, no validation, no bucket or database call', m1 === 'earthview:not run (EARTHVIEW_ENABLED unset)' && w.reqs.length === 2 && untouched(w), { m1, reqs: w.reqs.length, calls: w.calls });
  ok('F2 probe in flight, gate unset: /admin/run/earthview answers the same and does nothing', rr.status === 200 && m2.result === 'earthview:not run (EARTHVIEW_ENABLED unset)' && w.reqs.length === 2 && untouched(w), { m2, calls: w.calls });
  release(); const j1 = await (await p1).json();
  ok('E3 the first observation then completes normally with three requests in all', j1.outcome === 'validated' && w.reqs.length === 3 && untouched(w) && W.EVB.busy === false, { o: j1.outcome, reqs: w.reqs.length });
  const w3 = world(W), r3 = await call(w3); ok('E4 and a later call is accepted', r3.j.outcome === 'validated' && r3.j.isolate.validations_before === 1, r3.j.isolate);
}
// ===== F. Collection is excluded while the gate is unset, probe idle
{ const W = await load(), w = world(W); use(w);
  const m1 = await W.JOBS.earthview(w.env, Date.now()), rr = await W.default.fetch(new Request('https://hub.test/admin/run/earthview', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY } }), w.env, w.ctx), m2 = await rr.json();
  ok('F3 probe idle, gate unset: the manual job does not run and touches nothing', m1 === 'earthview:not run (EARTHVIEW_ENABLED unset)' && w.reqs.length === 0 && untouched(w), { m1, calls: w.calls });
  ok('F4 probe idle, gate unset: /admin/run/earthview does not run and touches nothing', m2.result === 'earthview:not run (EARTHVIEW_ENABLED unset)' && w.reqs.length === 0 && untouched(w), { m2, calls: w.calls });
  for (const v of ['0', '', 'yes', 'true']) { const wv = world(W); wv.env.EARTHVIEW_ENABLED = v; use(wv); const m = await W.JOBS.earthview(wv.env, Date.now());
    ok(`F5 gate set to ${JSON.stringify(v)} (neither "manual" nor "1"): the manual job still does not run`, m === 'earthview:not run (EARTHVIEW_ENABLED has an unknown value)' && wv.reqs.length === 0 && untouched(wv), m);
    const r = await call(wv); ok(`F6 gate set to ${JSON.stringify(v)}: the probe refuses too (409), so a half-set gate runs nothing`, r.http === 409 && wv.reqs.length === 0 && untouched(wv), r); }
  { const wv = world(W); wv.env.EARTHVIEW_ENABLED = '1'; const r = await call(wv);
    ok('F7 gate on: the probe refuses with 409 "collection is on", no request, nothing touched', r.http === 409 && /collection is on/.test(r.j.error) && wv.reqs.length === 0 && untouched(wv) && lines(wv).length === 0, r); }
  { const wv = world(W); wv.env.EARTHVIEW_ENABLED = 'manual'; const r = await call(wv);
    ok('F7b gate "manual" (0.6.22): the probe refuses with 409, no request, nothing touched', r.http === 409 && /collection is on/.test(r.j.error) && wv.reqs.length === 0 && untouched(wv) && lines(wv).length === 0, r); }
  { const five = baseSrc.split("const e = !adm.admit ? 'earthview:not scheduled (' + adm.why + ')' : ").length - 1;
    ok('F8 the scheduled path keeps its own refusal ahead of the collector (covered by the hub suite, case A1)', five === 1, five); }
}

// ===== H. Static checks (supplementary to the tests above)
{ const cut = (from, to) => { const a = src.indexOf(from), b = src.indexOf(to, a + 1); return a >= 0 && b > a ? src.slice(a, b) : ''; };
  const once = cut('async function evProbeOnce(', '/** The route. Anything but a POST'), val = cut('async function evProbeValidate(', '/** One observation. No env.'), routeSrc = cut('async function evProbeRoute(', '/** /admin/probe/sunface');
  ok('H1 the observation and the validation are found in the file', once.length > 500 && val.length > 300 && routeSrc.length > 300, [once.length, val.length, routeSrc.length]);
  ok('H2 neither names env', !/\benv\b/.test(once) && !/\benv\b/.test(val), [/\benv\b/.test(once), /\benv\b/.test(val)]);
  const banned = /\b(evState|evFail|evUpdate|evCollect|collectEarthView|runEarthView|evCleanup|evGuard|evAdmin|evPutJson|evGet|logRun|guarded|writeDown|writeSnapshot|getJson|caches|waitUntil)\b/;
  ok('H3 the observation, the validation and the route call no storage, run-log, guard, cache or deferred-work function', !banned.test(once) && !banned.test(val) && !banned.test(routeSrc), [once.match(banned), val.match(banned), routeSrc.match(banned)]);
  ok('H4 the route reads env only for the key and the gate', (routeSrc.match(/env\.[A-Za-z0-9_]+/g) || []).every(x => x === 'env.ADMIN_KEY' || x === 'env.EARTHVIEW_ENABLED'), routeSrc.match(/env\.[A-Za-z0-9_]+/g));
  ok('H5 the observation makes its requests in exactly three places and has no loop', (once.match(/\bfetch\(|evFetch\(/g) || []).length === 3 && !/\b(for|while)\s*\(/.test(once), once.match(/\bfetch\(|evFetch\(/g));
  { const a = baseSrc.indexOf('/* ---- Storage records, guards and recovery'), c = baseSrc.indexOf('async function collectEarthView(env, ms'), p = baseSrc.indexOf('const evPointer = epoch'), r = baseSrc.indexOf('async function evRoute(env, p) {');
    const A = baseSrc.slice(a, c), C = baseSrc.slice(c, p), B = baseSrc.slice(p, r), once = (t, x) => t.split(x).length === 2;
    ok('H6a records, guards, state and failure report are byte for byte those of 0.6.21', a > 0 && c > a && sha(A) === SPAN_A_SHA, sha(A));
    ok('H6b cleanup, hold, recover, sweep and release are byte for byte those of 0.6.21', p > c && r > p && sha(B) === SPAN_B_SHA, sha(B));
    const back = C.replace('async function collectEarthView(env, ms, x) {', 'async function collectEarthView(env, ms) {').replace('v => { T = v.T; check = v.check; }, x); }', 'v => { T = v.T; check = v.check; }); }').replace('async function evCollect(env, ms, note, x) {', 'async function evCollect(env, ms, note) {').replace(V_BEGIN, '').replace(V_END, '').split('return vFail(').join('return evFail(');
    ok('H6c the collector is that of 0.6.21 once exactly the 0.6.22 counting additions are removed (one begin line, one end line, seven vFail, the x parameter)', once(C, V_BEGIN) && once(C, V_END) && C.split('return vFail(').length === 8 && sha(back) === SPAN_C_OLD_SHA, [once(C, V_BEGIN), once(C, V_END), C.split('return vFail(').length - 1, sha(back)]); }
}
realLog(`\n${fail ? 'FAILED' : 'PASSED'}: ${pass} passed, ${fail} failed${BREAK ? '  (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
