/* Earth from Space: hub collector and routes (EARTH-FROM-SPACE-PROPOSAL rev 2; GPT's review of 19 Nov 2026).
 * The real worker.js runs against a fake R2 (conditional puts, deletes counted), a recording D1, a movable clock and a stubbed
 * EUMETView. Nothing reaches the network; only Node's standard library is used. Fixtures are REAL frames (earthview-fixtures/).
 * Run: node --no-warnings phase1/earthview-hub.test.mjs
 * FAST=1 remembers full decodes per input (for the many break runs); the default run does not.
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored no-header-ok mismatch-ok check-header-skipped scans-any trailing-ok decode-error-ignored no-compare pointer-on-fail
 *   no-grace delete-idle no-cas overwrite no-readback serve-any generic-down delay-on-failed-check older-over-newer type-any
 *   key-reused counter-not-past-listed claim-ignores-mark serve-pending cleanup-own-view no-second-pointer-read serve-marked
 *   no-hold-guard creates-when-missing recreates-lost-list epochs-not-compared no-marker-guard no-role-guard no-inventory
 *   inventory-unstable-view inventory-one-pass inventory-first-page-only pending-called-missing marked-called-missing
 *   adopted-called-missing no-fence no-random recover-keeps-key recover-pointer-unconditional recover-unverified
 *   recover-without-hold recover-any-plan recover-list-before-inventory recover-deletes dry-run-applies release-unchecked
 *   cleanup-pointer-unfenced admin-open manual-ignores-gate
 *   (0.6.22, section V) validation-snapshot-at-start refusal-not-counted pass-not-counted counted-at-begin no-run-end-line */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import zlib from 'node:zlib'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), FX = path.join(HERE, 'earthview-fixtures');
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const e = !adm.admit ?", 'const e = false ?'],
  'manual-ignores-gate': ["{ const why = evManualGate(env); return why ?", "{ const why = null; return why ?"],
  'no-header-ok': ["    if (!f.served) return evFail(env, ms, 'served time not confirmed'", "    if (false) return evFail(env, ms, 'served time not confirmed'"],
  'mismatch-ok': ["    if (f.served !== T) return evFail(env, ms, 'served a different frame'", "    if (false) return evFail(env, ms, 'served a different frame'"],
  'check-header-skipped': ["  for (const [what, f] of [['picture', pic], ['check image', chk]]) {\n    if (!f.served)", "  for (const [what, f] of [['picture', pic]]) {\n    if (!f.served)"],
  'scans-any': ["  if (!sc.complete) return vFail(", '  if (false) return vFail('],
  'trailing-ok': ["  if (i !== u8.length) return bad('bytes after the end marker');", ''],
  'decode-error-ignored': ["  if (dec.error) return vFail(env, ms, 'picture failed validation', 200, 'decode: ' + dec.error, T, check);", ''],
  'no-compare': ["  if (!cmp.ok) return vFail(env, ms, 'picture failed validation'", "  if (false) return vFail(env, ms, 'picture failed validation'"],
  'pointer-on-fail': ["  await logRun(env, 'earthview', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));", "  try { await env.R2.put(EARTHVIEW.POINTER, JSON.stringify(evPointer('e20260101T000000Z-0000000000000000'))); } catch (_) {}\n  await logRun(env, 'earthview', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));"],
  'no-grace': ['nowMs - Date.parse(x.left_at) >= EARTHVIEW.GRACE_S * 1000 &&', 'nowMs - Date.parse(x.left_at) >= 0 &&'],
  'delete-idle': ["    await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, 'nothing newer: '", "    try { const h = await getJson(env, EARTHVIEW.HELD); for (const x of (h && h.items) || []) if (Date.now() - Date.parse(x.published_at) > EARTHVIEW.GRACE_S * 1000) await env.R2.delete(x.key); } catch (_) {}\n    await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, 'nothing newer: '"],
  'no-cas': ["    const r = await evPutJson(env, key, body, etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' });\n    if (r !== null) return { cur, body, wrote: true };", "    await evPutJson(env, key, body, undefined);\n    return { cur, body, wrote: true };"],
  'serve-any': ["  if (buf.byteLength !== x.bytes || (x.sha256 ? sha !== x.sha256 : sha.slice(0, 16) !== p[2].split('-')[1])) return none(503, 'integrity');", ''],
  'generic-down': ["    else if (layer === 'earthview') { try { await evFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // never the generic writeDown", ''],
  'delay-on-failed-check': ["{ ok: false, at: checkAt, reason: 'http error', http: r.status }", "{ ok: true, at: checkAt, newest: null }"],
  'older-over-newer': ['c => (c.frame && c.frame.source_frame_time >= T) ? null : { ...evPointer(epoch), frame, previous: c.frame || null }', 'c => ({ ...evPointer(epoch), frame, previous: c.frame || null })'],
  'key-reused': ["gen = Math.max(1, Number(h.next_gen) || 1, ...h.items.map(x => (Number(x.gen) || 0) + 1));", "gen = 1;"],
  'counter-not-past-listed': ["gen = Math.max(1, Number(h.next_gen) || 1, ...h.items.map(x => (Number(x.gen) || 0) + 1));", "gen = Math.max(1, Number(h.next_gen) || 1);"],
  'overwrite': [[", onlyIf: { etagDoesNotMatch: '*' } }); } catch (e) { return evFail(env, ms, 'picture write failed'", " }); } catch (e) { return evFail(env, ms, 'picture write failed'"], ["  if (put === null) return evFail(env, ms, 'picture key already in use', 200, key, T, check);\n", '']],
  'no-readback': ["  if (await stored() !== 'same') return evFail(env, ms, 'picture read-back differs', 200, key, T, check);\n", ''],
  'claim-ignores-mark': ["claimed = !!x && !x.deleting; if (!claimed) return null;", "claimed = true;"],
  // ---- guards, fence, recovery (review of readiness rev 2)
  'no-hold-guard': ["  if (!opt.ignoreHold && await env.R2.head(EARTHVIEW.HOLD)) throw new EvStop(EV_STOP.HELD, null);", ""],
  'creates-when-missing': ["    if (P.cur === null && H.cur === null) throw new EvStop(EV_STOP.UNSET, 'no pointer and no list');", "    if (P.cur === null && H.cur === null) { const e = evNewEpoch(); await evPutJson(env, EARTHVIEW.EPOCHS + e + '.json', { epoch: e }); await evPutJson(env, EARTHVIEW.POINTER, evPointer(e)); await evPutJson(env, EARTHVIEW.HELD, { schema: 3, epoch: e, next_gen: 1, items: [] }); return read(); }"],
  'recreates-lost-list': ["    if (!P.cur || !H.cur || !Array.isArray(H.cur.items)) throw repair(", "    if (P.cur && H.cur === null) { await evPutJson(env, EARTHVIEW.HELD, { schema: 3, epoch: P.cur.epoch, next_gen: 1, items: [] }); return read(); }\n    if (!P.cur || !H.cur || !Array.isArray(H.cur.items)) throw repair("],
  'epochs-not-compared': ["    if (!evEpochOk(P.cur.epoch) || H.cur.epoch !== P.cur.epoch) throw repair(", "    if (!evEpochOk(P.cur.epoch)) throw repair("],
  'no-marker-guard': ["  if (!await env.R2.head(EARTHVIEW.EPOCHS + epoch + '.json')) throw repair('no marker for epoch ' + epoch);", ""],
  'no-role-guard': ["  if (role(v.P, v.H, prefix)) {", "  if (false) {"],
  'no-inventory': ["    if (!r.unlisted.length && !r.missing.length) verdict = 'clean';", "    if (true) verdict = 'clean';"],
  'inventory-unstable-view': ["    if (!b || b.etag !== a.etag) return null;   // overtaken: not a finding\n", ""],
  'inventory-one-pass': ["else if (first && first.sig === r.sig) verdict = 'mismatch'; else first = r; }", "else { first = r; verdict = 'mismatch'; } }"],
  'inventory-first-page-only': ["    if (!r.truncated) return out; cursor = r.cursor; }", "    return out; }"],
  'pending-called-missing': ["!i.deleting && !i.pending && !stored.has(i.key)).map(i => i.key);", "!i.deleting && !stored.has(i.key)).map(i => i.key);"],
  'marked-called-missing': ["!i.deleting && !i.pending && !stored.has(i.key)).map(i => i.key);", "!i.pending && !stored.has(i.key)).map(i => i.key);"],
  'adopted-called-missing': ["a.cur.items.filter(i => String(i.key).startsWith(prefix) && !i.deleting", "a.cur.items.filter(i => !i.deleting"],
  'no-fence': ["const evFence = (epoch, change) => cur => { if (!cur || cur.epoch !== epoch) throw new EvStop(EV_STOP.CHANGED, 'the record is no longer stamped ' + epoch); return change(cur); };", "const evFence = (epoch, change) => cur => change(cur);"],
  'no-random': ["rand = evHex(12); let gen = 0;", "rand = '0'.repeat(24); let gen = 0;"],
  'recover-keeps-key': ["      made[k.role] = { ...f, id, recovered_from: f.id, picture: { ...f.picture, key, path: `/snapshot/earthview/${id}/picture.jpg` } };", "      made[k.role] = f;"],
  'recover-pointer-unconditional': ["{ ...evPointer(epoch), frame, previous, recovered_at: at }, s.P.etag ? { etagMatches: s.P.etag } : { etagDoesNotMatch: '*' });", "{ ...evPointer(epoch), frame, previous, recovered_at: at }, undefined);"],
  'recover-unverified': ["if (!why && (buf.byteLength !== f.picture.bytes || await sha256Bytes(buf) !== f.picture.sha256)) why = 'differs from the record';", ""],
  'recover-without-hold': ["    if (!s.hold.etag) return out({ plan, plan_id, refused: 'no hold: hold first' }, 409);\n    if (planGiven !== plan_id) return out({ plan, plan_id, refused: 'what was found does not give the plan id that was passed; read the dry run again' }, 409);\n    const steps = [], epoch = evNewEpoch();", "    if (planGiven !== plan_id) return out({ plan, plan_id, refused: 'what was found does not give the plan id that was passed; read the dry run again' }, 409);\n    const steps = [], epoch = evNewEpoch();"],
  'recover-any-plan': ["    if (planGiven !== plan_id) return out({ plan, plan_id, refused: 'what was found does not give the plan id that was passed; read the dry run again' }, 409);\n    const steps = [], epoch = evNewEpoch();", "    const steps = [], epoch = evNewEpoch();"],
  'recover-list-before-inventory': ["    const objs = await evListAll(env, EARTHVIEW.PREFIX), inRole = new Map(", "    const objs = s.objects.concat(Object.values(made).map(f => ({ key: f.picture.key, size: f.picture.bytes }))), inRole = new Map("],
  'recover-deletes': ["    steps.push('R4 pointer installed');", "    steps.push('R4 pointer installed'); for (const k of s.keep) await env.R2.delete(k.frame.picture.key);"],
  'dry-run-applies': ["try { const r = await evAdmin(env, p[2], req.method === 'POST' && url.searchParams.get('apply') === '1',", "try { const r = await evAdmin(env, p[2], true,"],
  'release-unchecked': ["    if (why) return out({ refused: why }, 409);\n    if (!apply) return out({ would: 'remove the hold' });", "    if (!apply) return out({ would: 'remove the hold' });"],
  'cleanup-pointer-unfenced': ["  const pointer = async () => evFence(epoch, c => c)((await evGet(env, EARTHVIEW.POINTER)).cur);", "  const pointer = async () => (await evGet(env, EARTHVIEW.POINTER)).cur;"],
  'admin-open': ["      const refuse = evAuth(req, env, url, ['GET', 'POST']); if (refuse) return refuse;\n", ""],
  'serve-pending': ["&& !i.deleting && !i.pending).map(", "&& !i.deleting).map("],
  'cleanup-own-view': ["  const live = liveOf(await pointer()), at = nowIso(), nowMs = Date.parse(at);", "  const live = new Set(), at = nowIso(), nowMs = Date.parse(at);"],
  'no-second-pointer-read': ["  const live2 = liveOf(await pointer()), gone = [], spared = [];", "  const live2 = new Set(), gone = [], spared = [];"],
  'serve-marked': ["&& !i.deleting && !i.pending).map(", "&& !i.pending).map("],
  'validation-snapshot-at-start': [["function evValidationBegin(x) { if (x) x.validations_before = EVB.validations; }", "function evValidationBegin(x) { }"], ["  const x = { exec: evHex(6), validations_before: null, validated: null },", "  const x = { exec: evHex(6), validations_before: EVB.validations, validated: null },"]],
  'refusal-not-counted': ["  const vFail = (...a) => { evValidated(x, false); return evFail(...a); }; evValidationBegin(x);", "  const vFail = (...a) => { if (x) x.validated = false; return evFail(...a); }; evValidationBegin(x);"],
  'pass-not-counted': ["function evValidated(x, ok) { EVB.validations++; if (x) x.validated = ok; }", "function evValidated(x, ok) { if (!ok) EVB.validations++; if (x) x.validated = ok; }"],
  'counted-at-begin': [["function evValidationBegin(x) { if (x) x.validations_before = EVB.validations; }", "function evValidationBegin(x) { if (x) x.validations_before = EVB.validations; EVB.validations++; }"], ["function evValidated(x, ok) { EVB.validations++; if (x) x.validated = ok; }", "function evValidated(x, ok) { if (x) x.validated = ok; }"]],
  'no-run-end-line': ["  console.log(JSON.stringify({ earthview: 'run-end', exec: x.exec, trigger, run: at, isolate: i && i.isolate, validations_before: x.validations_before, validated: x.validated, result }));\n", ""],
  'type-any': ["  if (type !== spec.type) return { ok: false, reason: what + ' not a picture', http: 200, detail: type };   // EUMETView answers a bad time with HTTP 200 and XML", ''],
};
let src = fs.readFileSync(process.env.WORKER || path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); } const parts = Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]];   // a break may have several parts; EVERY part must apply
  for (const b of parts) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); } }
// FAST=1 (used for the break runs, which are many): the full JPEG decode, a pure function of its input, is remembered per input (last 12).
// The default run does not do this and exercises the file exactly as it is.
if (process.env.FAST) { const head = "function evDecode(u8) {\n  try {"; if (src.split(head).length !== 2) { console.log('FAIL  FAST could not be applied'); process.exit(1); }
  src = src.replace(head, "const __memo = new Map();\nfunction evDecode(u8) { let k = 2166136261; for (let i = 0; i < u8.length; i++) k = Math.imul(k ^ u8[i], 16777619) >>> 0; k = u8.length + ':' + k; if (__memo.has(k)) return __memo.get(k); const r = __evDecode(u8); if (!r.error) { __memo.set(k, r); if (__memo.size > 12) __memo.delete(__memo.keys().next().value); } return r; }\nfunction __evDecode(u8) {\n  try {"); }
const tmp = path.join(os.tmpdir(), `worker-ev-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
// 0.6.22: the collector's two log lines per run are collected here instead of being printed among the results
const EVLOG = []; { const out = console.log.bind(console); console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('{"earthview"')) EVLOG.push(JSON.parse(a[0])); else if (typeof a[0] === 'string' && a[0].startsWith('{"probe"')) { } else out(...a); }; }
let nFresh = 0; /** another copy of the same file under test: its own isolate counters (section V) */
const fresh = async () => { const t = path.join(os.tmpdir(), `worker-ev-${process.pid}-v${nFresh++}.mjs`); fs.writeFileSync(t, src); try { return await import(pathToFileURL(t).href); } finally { fs.unlinkSync(t); } };
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 700) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
// ---------- movable clock (the collector reads Date for every stamp)
const RealDate = Date; let offset = 0;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } };
const setNow = ms => { offset = ms - RealDate.now(); };
// ---------- fixtures: real frames; a comment segment (JPEG) or a text chunk (PNG) makes each frame's files distinct
const RAW = Object.fromEntries(['day', 'night', 'dusk'].flatMap(n => [[n + '.jpg', fs.readFileSync(path.join(FX, n + '.jpg'))], [n + '.png', fs.readFileSync(path.join(FX, n + '.png'))]]));
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'latin1'); Buffer.from(data).copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const jpg = (salt = 0, base = 'day') => { const b = RAW[base + '.jpg']; return new Uint8Array(Buffer.concat([b.subarray(0, 2), Buffer.from([0xff, 0xfe, 0x00, 0x06, salt & 255, (salt >> 8) & 255, (salt >> 16) & 255, (salt >> 24) & 255]), b.subarray(2)])); };
const png = (salt = 0, base = 'day') => { const b = RAW[base + '.png']; return new Uint8Array(Buffer.concat([b.subarray(0, b.length - 12), chunk('tEXt', Buffer.from('frame\0' + salt)), b.subarray(b.length - 12)])); };
const sosList = u8 => { const o = []; for (let i = 2; i < u8.length - 1; i++) if (u8[i] === 0xff && u8[i + 1] === 0xda) o.push(i); return o; };
const G = jpg(1), SOS = sosList(G);
const DAMAGED = {
  'cut in half': G.slice(0, G.length >> 1), 'end marker missing': G.slice(0, G.length - 2), 'bytes after the end marker': Uint8Array.from([...G, 1, 2, 3]),
  'first scan only, then an end marker': Uint8Array.from([...G.slice(0, SOS[1]), 0xff, 0xd9]), 'five of ten scans, then an end marker': Uint8Array.from([...G.slice(0, SOS[5]), 0xff, 0xd9]),
  'scan data replaced (decoder must refuse)': (() => { const b = G.slice(); for (let k = 0; k < 4000; k++) b[SOS[0] + 300 + k] = k % 2 ? 0x00 : 0xff; return b; })(),
  'first scan zeroed (decodes, blank)': (() => { const b = G.slice(); b.fill(0, SOS[0] + 200, SOS[0] + 40200); return b; })(),
  'a real but 256 px JPEG': new Uint8Array(fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/picture-a.jpg'))),
};
/** a synthetic RGBA check image from this file's own encoder: alpha from a function, colour flat */
function mkPng(alpha, { w = 256, h = 256, breakCrc = false } = {}) {
  const stride = w * 4, out = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { out[y * (stride + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (stride + 1) + 1 + x * 4; out[o] = 90; out[o + 1] = 110; out[o + 2] = 120; out[o + 3] = alpha(x, y, w, h); } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const b = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(out)), chunk('IEND', Buffer.alloc(0))]);
  if (breakCrc) b[b.length - 30] ^= 1; return new Uint8Array(b);
}
const discOf = f => (x, y, w, h) => Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) <= w * f ? 255 : 0;
const layer = t => `<Layer queryable="1"><Name>mtg_fd:rgb_geocolour</Name><Title>Geo Colour RGB - MTG-I - 0 degree</Title>${t ? `<Dimension name="time" default="${t}" units="ISO8601" nearestValue="1">2024-09-23T00:00:00.000Z/${t.replace('Z', '.000Z')}/PT10M</Dimension>` : ''}</Layer>`;
const caps = t => `<WMS_Capabilities><Capability><Layer><Title>mtg_fd</Title><Layer><Name>mtg_fd:rgb_dust</Name><Dimension name="time" default="2030-01-01T00:00:00Z">x</Dimension></Layer>${layer(t)}</Layer></Capability></WMS_Capabilities>`;
// ---------- fakes
function world0() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, order: [], latest: '2026-11-19T11:00:00Z', capStatus: 200, capBody: null, capThrow: false, capAge: '77', pic: null, chk: null, warn: 'echo', picWarn: undefined, chkWarn: undefined, base: 'day',
    once: [], deleteFail: false, putFail: null, corruptRead: null, onPointerPut: null, brokenResponse: false, deletes: [], puts: [], unconditional: [], conflicts: 0, lists: [], pageSize: 1000 };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  /** one-shot hooks: w.once.push({ op, key (suffix), fn }) runs fn before the first matching storage call, then is spent */
  w.fire = async (op, key) => { const i = w.once.findIndex(h => h.op === op && key.endsWith(h.key)); if (i < 0) return; if (w.once[i].skip > 0) { w.once[i].skip--; return; } const [h] = w.once.splice(i, 1); await h.fn(); };   // skip: n lets the first n matching calls pass
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.endsWith(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body.buffer ? body.buffer.slice(body.byteOffset || 0, (body.byteOffset || 0) + body.byteLength) : body);
      if (key === W.EARTHVIEW.POINTER && w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); }
      await w.fire('put', key);
      if (!opts.onlyIf) w.unconditional.push(key);
      if (opts.onlyIf) { const had = store.get(key); const refused = opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches); if (refused) { w.conflicts++; return null; } }
      w.puts.push(key); store.set(key, { buf, opts, etag: etagOf(buf) }); return { key, etag: etagOf(buf) }; },
    async get(key) { await w.fire('get', key); const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.endsWith(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 30] ^= 0xff; }
      return { body: buf, etag: o.etag, customMetadata: o.opts.customMetadata, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { await w.fire('head', key); const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '', cursor, limit = 1000 } = {}) { await w.fire('list', prefix); w.lists.push(prefix); const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort(), from = cursor ? Number(cursor) : 0, page = all.slice(from, from + Math.min(limit, w.pageSize));
      return { objects: page.map(key => ({ key, size: store.get(key).buf.length })), truncated: from + page.length < all.length, cursor: String(from + page.length) }; },
    async delete(key) { await w.fire('delete', key); if (w.deleteFail) throw new Error('R2 delete failed (test)'); w.deletes.push(key); store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) { runs.push({ layer: a[0], status: a[3], http: a[4], note: a[7] }); w.order.push('run:' + a[0]); } return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: '2026-11-18T12:00:00Z', EARTHVIEW_UNTIL: '2026-11-20T12:00:00Z', ADMIN_KEY: 'k' };   // 0.6.22: the scheduled path needs the admission window too
  w.fetch = async (url, init) => { const u = String(url);
    if (!u.includes('view.eumetsat.int')) { w.order.push('other'); throw new Error('unexpected fetch ' + u); }
    w.order.push('eumetsat'); reqs.push(u);
    if (/GetCapabilities/.test(u)) { if (w.capThrow) throw new Error('network down (test)'); return new Response(w.capBody !== null ? w.capBody : caps(w.latest), { status: w.capStatus, headers: { 'content-type': 'text/xml', ...(w.capAge !== null ? { age: w.capAge } : {}) } }); }
    const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1], salt = Date.parse(t) / 6e5;
    if (w.brokenResponse && isPic) return { status: 200 };
    const spec = isPic ? (w.pic || { body: jpg(salt, w.base), type: 'image/jpeg' }) : (w.chk || { body: png(salt, w.base), type: 'image/png' });
    if (spec.throw) throw new Error('The operation was aborted due to timeout (test)');
    const h = { 'content-type': spec.type }; const wv = isPic ? (w.picWarn !== undefined ? w.picWarn : w.warn) : (w.chkWarn !== undefined ? w.chkWarn : w.warn);
    if (wv !== null && wv !== undefined) h.warning = wv === 'echo' ? `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` : wv;
    return new Response(spec.body, { status: spec.status || 200, headers: h }); };
  return w;
}
const use = w => { globalThis.fetch = w.fetch; };
/** runs fn with the random source returning one repeated byte */
const fixedRandom = async (byte, fn) => { const wc = globalThis.crypto; Object.defineProperty(wc, 'getRandomValues', { value: b => b.fill(byte), configurable: true, writable: true }); try { return await fn(); } finally { delete wc.getRandomValues; } };
/** /admin/earthview/<action>: a dry run unless apply; returns the JSON body with .http */
const AUTH = { Authorization: 'Bearer k' };
const admin = async (w, action, { apply = false, plan = null } = {}) => { const r = await W.default.fetch(new Request(`https://hub.test/admin/earthview/${action}?${apply ? 'apply=1' : ''}${plan ? '&plan=' + plan : ''}`, { method: apply ? 'POST' : 'GET', headers: AUTH }), w.env, { waitUntil() { } }); return { http: r.status, ...(await r.json()) }; };
/** hold, recover (with the dry run's plan id), sweep if anything is unlisted, release */
const recover = async w => { await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'), r = await admin(w, 'recover', { apply: true, plan: d.plan_id }); return { d, r }; };
const release = async w => { const sw = await admin(w, 'sweep'); if (sw.plan && sw.plan.add.length) await admin(w, 'sweep', { apply: true, plan: sw.plan_id }); return admin(w, 'release', { apply: true }); };
/** a world whose storage has been set up the only way it can be: hold, recover (first start), release. Counters start clean. */
const world = async () => { const w = world0(); use(w); const { r } = await recover(w), rel = await release(w); if (r.result !== 'recovered' || rel.result !== 'released') throw new Error('set-up failed: ' + JSON.stringify([r, rel]));
  w.puts.length = 0; w.deletes.length = 0; w.unconditional.length = 0; w.lists.length = 0; w.conflicts = 0; w.order.length = 0; return w; };
const T0 = Date.UTC(2026, 10, 19, 11, 21, 0), MIN = 60000;
const ptr = async w => { const o = await w.env.R2.get(W.EARTHVIEW.POINTER); return o ? o.json() : null; };
const state = async w => { const o = await w.env.R2.get(W.EARTHVIEW.STATE); return o ? o.json() : null; };
const held = async w => { const o = await w.env.R2.get(W.EARTHVIEW.HELD); return o ? (await o.json()).items : []; };
const frames = w => [...w.store.keys()].filter(k => k.startsWith('earthview/frames/')).sort();
const route = (w, p) => W.default.fetch(new Request('https://hub.test' + p), w.env, { waitUntil() { } });
/** 0.6.22: the manual run is a POST with the key in the Authorization header and no query string */
const runRoute = w => W.default.fetch(new Request('https://hub.test/admin/run/earthview', { method: 'POST', headers: AUTH }), w.env, { waitUntil() { } });
const run = async (w, ms) => { use(w); setNow(ms); return W.JOBS.earthview(w.env, ms); };
const maps = w => w.reqs.filter(u => /GetMap/.test(u));
const tAdd = (t, min) => new Date(Date.parse(t) + min * MIN).toISOString().replace('.000Z', 'Z');

// ===== A. gate and schedule
{ const w = await world(); delete w.env.EARTHVIEW_ENABLED; use(w); setNow(T0); const r = await W.JOBS.five(w.env, T0);
  ok('A1 flag unset: the five-minute job makes no EUMETSAT request and writes nothing', /earthview:not scheduled/.test(r) && !w.reqs.length && !w.puts.some(k => /^earthview/.test(k)), [r, w.reqs.length, w.puts]);
  { const n0 = w.runs.length, g0 = w.store.size, p0 = w.puts.length; w.order.length = 0; const m = await W.JOBS.earthview(w.env, T0), rr = await (await runRoute(w)).json();
    ok('A1b flag unset: the MANUAL job and /admin/run/earthview do not run either: no request, no write, no run-log row (0.6.21)', m === 'earthview:not run (EARTHVIEW_ENABLED unset)' && rr.result === m && !w.reqs.length && w.puts.length === p0 && !w.deletes.length && w.runs.length === n0 && w.store.size === g0 && !w.order.length, [m, rr, w.reqs.length, w.puts, w.runs.length - n0, w.order]); }
  const w2 = await world(); use(w2); const at4 = Date.UTC(2026, 10, 19, 11, 24, 0), at5 = Date.UTC(2026, 10, 19, 11, 25, 0);
  setNow(at5); const r5 = await W.JOBS.five(w2.env, at5); ok('A2 flag set, minute 25: skipped (every ten minutes)', /earthview:skipped/.test(r5) && !w2.reqs.length, r5);
  setNow(at4); const r4 = await W.JOBS.five(w2.env, at4); ok('A3 flag set, minute 24: runs, and after the earthquake collector', /earthview:published/.test(r4) && w2.order.indexOf('other') >= 0 && w2.order.indexOf('other') < w2.order.indexOf('eumetsat'), [r4, w2.order.slice(0, 4)]); }
// ===== B. a first frame
const wB = await world(); const rB = await run(wB, T0);
{ const p = await ptr(wB), s = await state(wB), h = await held(wB), m = maps(wB), f = p && p.frame;
  ok('B1 published, by its own word', rB === 'earthview:published 2026-11-19T11:00:00Z', rB);
  ok('B2 exactly one capabilities read, one picture and one check image', wB.reqs.length === 3 && m.length === 2, wB.reqs.length);
  const want = 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_geocolour&styles=&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000';
  ok('B3 the picture request is the pinned one, with the explicit frame time', m[0] === want + '&width=2048&height=2048&format=image/jpeg&bgcolor=0x0B1016&time=2026-11-19T11:00:00Z', m[0]);
  ok('B4 the check image request differs only in size, format and transparency', m[1] === want + '&width=256&height=256&format=image/png&transparent=true&time=2026-11-19T11:00:00Z', m[1]);
  ok('B5 the frame records the source frame time, the served time and the whole request', f && f.source_frame_time === '2026-11-19T11:00:00Z' && f.served_time === f.source_frame_time && f.request.crs === 'EPSG:900003' && f.request.crs_definition === '+proj=geos +h=35785831.0 +lon_0=0' && f.request.bbox.join() === '-5500000,-5500000,5500000,5500000' && f.request.bgcolor === '0x0B1016' && f.request.width === 2048 && f.request.time === f.source_frame_time, f && f.request);
  ok('B6 no scan start or end is recorded or implied', f && !/scan_start|scan_end|observ/i.test(JSON.stringify(f)), f && Object.keys(f));
  ok('B7 the checks record a full decode, ten complete scans and the comparison', f && f.checks.decoded === true && f.checks.progressive === true && f.checks.scans === 10 && f.checks.agreement > 0.9 && f.checks.surround_share_background === 1 && f.checks.check_opaque_on_frame_edge === 0, f && f.checks);
  ok('B8 the stored picture is byte for byte what was fetched', frames(wB).length === 1 && sha(wB.store.get(frames(wB)[0]).buf) === f.picture.sha256 && new RegExp('^20261119T1100Z-' + f.picture.sha256.slice(0, 16) + '-g1-[0-9a-f]{24}$').test(f.id) && f.picture.key === 'earthview/frames/' + p.epoch + '/' + f.id + '/picture.jpg', [f.id, frames(wB)]);
  ok('B9 the check image is not stored', ![...wB.store.keys()].some(k => /\.png$/.test(k)), [...wB.store.keys()]);
  ok('B10 state: source check succeeded (with the cache age) and the collection was published, kept apart from the frame', s && s.source_check.ok === true && s.source_check.newest === '2026-11-19T11:00:00Z' && s.source_check.cache_age_s === 77 && s.collection.outcome === 'published' && !('source_check' in p) && !('collection' in p), s);
  ok('B11 the held list knows the picture, still in its role', h.length === 1 && h[0].id === f.id && h[0].left_at === null && h[0].key === f.picture.key, h);
  ok('B12 every write was conditional', wB.unconditional.length === 0, wB.unconditional);
  ok('B13 one run row, ok', wB.runs.length === 1 && wB.runs[0].status === 'ok' && /frame 2026-11-19T11:00:00Z/.test(wB.runs[0].note), wB.runs);
  const mr = await route(wB, '/snapshot/earthview/meta'), mj = await mr.json();
  ok('B14 meta: frame, state, source and limits; no storage key; not cached', mr.status === 200 && mr.headers.get('cache-control') === 'no-store' && mj.frame.id === f.id && mj.frame.picture.key === undefined && mj.source_check.ok === true && mj.collection.outcome === 'published' && mj.limits.provisional === true && mj.source.collection === 'EO:EUM:DAT:0913' && /NASA Black Marble/.test(mj.source.night_background) && typeof mj.now === 'string' && !/earthview\/frames/.test(JSON.stringify(mj)), mj);
  const pr = await route(wB, mj.frame.picture.path), pb = Buffer.from(await pr.arrayBuffer());
  ok('B15 the picture is served unchanged, as an immutable JPEG', pr.status === 200 && pr.headers.get('content-type') === 'image/jpeg' && /immutable/.test(pr.headers.get('cache-control')) && sha(pb) === f.picture.sha256, [pr.status, pb.length]); }
// ===== C. nothing newer
{ const before = wB.store.get(W.EARTHVIEW.POINTER).etag, n = wB.reqs.length; const r = await run(wB, T0 + 10 * MIN), s = await state(wB);
  ok('C1 the same frame listed again: one capabilities read, no picture request', r === 'earthview:nothing newer 2026-11-19T11:00:00Z' && wB.reqs.length === n + 1, [r, wB.reqs.length - n]);
  ok('C2 the frame record is untouched; the state says nothing newer after a successful check', wB.store.get(W.EARTHVIEW.POINTER).etag === before && s.collection.outcome === 'nothing newer' && s.source_check.ok === true && s.run === new Date(T0 + 10 * MIN).toISOString(), s);
  wB.latest = '2026-11-19T10:50:00Z'; const r2 = await run(wB, T0 + 20 * MIN);
  ok('C3 an OLDER frame listed later is never fetched or published', /nothing newer/.test(r2) && (await ptr(wB)).frame.source_frame_time === '2026-11-19T11:00:00Z' && maps(wB).length === 2, r2); }
// ===== D. a newer frame
{ wB.latest = '2026-11-19T11:10:00Z'; const first = (await ptr(wB)).frame; const r = await run(wB, T0 + 30 * MIN), p = await ptr(wB), h = await held(wB);
  ok('D1 newer frame published; the earlier one becomes previous, whole', /published 2026-11-19T11:10/.test(r) && p.frame.source_frame_time === '2026-11-19T11:10:00Z' && p.previous.id === first.id && p.previous.picture.sha256 === first.picture.sha256, r);
  ok('D2 both pictures held, both in role, nothing deleted', h.length === 2 && h.every(x => x.left_at === null) && frames(wB).length === 2 && !wB.deletes.length, h);
  const old = await route(wB, first.picture.path); ok('D3 the previous picture is still served', old.status === 200, old.status); }
// ===== E. served time: strict
const strict = async (name, set, reason) => { const w = await world(); await run(w, T0); const before = await ptr(w), n = frames(w).length; w.latest = '2026-11-19T11:10:00Z'; set(w); const r = await run(w, T0 + 10 * MIN), p = await ptr(w), s = await state(w);
  ok(`E ${name}: nothing published`, r === 'earthview:down ' + reason && p.frame.id === before.frame.id && frames(w).length === n, [r, p.frame.source_frame_time, frames(w).length]);
  ok(`E ${name}: the outcome is recorded against the frame that was asked for, and the source check still stands as successful`, s.collection.outcome === 'failed' && s.collection.reason === reason && s.collection.frame_time === '2026-11-19T11:10:00Z' && s.source_check.ok === true && s.source_check.newest === '2026-11-19T11:10:00Z', s);
  ok(`E ${name}: no requested time appears anywhere as a frame time`, !/11:10/.test(JSON.stringify(p)), null); return w; };
await strict('no Warning header on either response', w => { w.warn = null; }, 'served time not confirmed');
await strict('header on the picture only', w => { w.chkWarn = null; }, 'served time not confirmed');
await strict('header on the check image only', w => { w.picWarn = null; }, 'served time not confirmed');
await strict('header present but naming no time', w => { w.warn = '199 Miscellaneous warning'; }, 'served time not confirmed');
await strict('the picture is a different (older) frame', w => { w.picWarn = '99 Nearest value used: time=2026-11-19T11:00:00.000Z ISO8601 (mtg_fd:rgb_geocolour)'; }, 'served a different frame');
await strict('the check image is a different frame', w => { w.chkWarn = '99 Nearest value used: time=2026-11-19T11:20:00.000Z ISO8601 (mtg_fd:rgb_geocolour)'; }, 'served a different frame');
{ const w = await world(); w.warn = null; const r = await run(w, T0), p = await ptr(w);
  ok('E first run with no header: no frame at all, and meta says so', /served time not confirmed/.test(r) && (!p || !p.frame) && !frames(w).length, r);
  const mj = await (await route(w, '/snapshot/earthview/meta')).json(); ok('E meta with nothing verified: frame null, the failed outcome shown', mj.frame === null && mj.collection.reason === 'served time not confirmed', mj.collection); }
// ===== F. responses that are not pictures
const refuse = async (name, set, re, also) => { const w = await world(); await run(w, T0); const before = (await ptr(w)).frame.id; w.latest = '2026-11-19T11:10:00Z'; set(w); const r = await run(w, T0 + 10 * MIN), p = await ptr(w);
  ok(`${name}: refused, last good frame kept`, re.test(r) && p.frame.id === before && frames(w).length === 1 && !w.deletes.length, r); if (also) await also(w, r); return w; };
await refuse('F1 HTTP 200 with an XML error document', w => { w.pic = { body: '<?xml version="1.0"?><ServiceExceptionReport/>', type: 'text/xml;charset=UTF-8' }; }, /picture not a picture/);
await refuse('F2 HTTP 500', w => { w.pic = { body: 'no', type: 'text/plain', status: 500 }; }, /picture http error/);
await refuse('F3 no answer (timeout)', w => { w.pic = { throw: true }; }, /picture request failed/);
await refuse('F4 a picture over the size limit', w => { w.pic = { body: new Uint8Array(W.EARTHVIEW.PICTURE.maxBytes + 10), type: 'image/jpeg' }; }, /picture size out of range/);
await refuse('F5 an empty body', w => { w.pic = { body: new Uint8Array(0), type: 'image/jpeg' }; }, /picture size out of range/);
await refuse('F6 the check image is XML', w => { w.chk = { body: '<x/>', type: 'text/xml' }; }, /check image not a picture/);
// ===== G. the delivered picture itself
for (const [name, body] of Object.entries(DAMAGED)) await refuse('G picture ' + name, w => { w.pic = { body, type: 'image/jpeg' }; }, /picture failed validation/, async w => { const note = w.runs[w.runs.length - 1].note;
  if (/first scan only|five of ten/.test(name)) ok('G ' + name + ': refused for incomplete scans, not by luck', /scans incomplete: 192 coefficient positions/.test(note), note);
  if (/decoder must refuse/.test(name)) ok('G ' + name + ': refused by the decode itself', /decode: /.test(note), note);
  if (/blank/.test(name)) ok('G ' + name + ': refused as blank or not matching', /blank inside the disk|does not match the check image/.test(note), note);
  if (/256 px/.test(name)) ok('G ' + name + ': refused for its size', /size 256x256/.test(note), note); });
await refuse('G the picture and the check image are of different frames (day against night)', w => { w.chk = { body: png(3, 'night'), type: 'image/png' }; }, /picture failed validation/, async w => ok('G … refused because they do not match', /does not match the check image/.test(w.runs[w.runs.length - 1].note), w.runs[w.runs.length - 1].note));
await refuse('G check image with a damaged checksum', w => { w.chk = { body: mkPng(discOf(0.47), { breakCrc: true }), type: 'image/png' }; }, /check image failed validation/);
await refuse('G check image of the wrong size', w => { w.chk = { body: mkPng(discOf(0.47), { w: 160, h: 160 }), type: 'image/png' }; }, /check image failed validation/);
await refuse('G check image whose disk is much smaller (the picture has Earth where the surround should be)', w => { w.chk = { body: mkPng(discOf(0.30)), type: 'image/png' }; }, /picture failed validation/, async w => ok('G … refused for the surround', /surround is not the background colour/.test(w.runs[w.runs.length - 1].note), w.runs[w.runs.length - 1].note));
await refuse('G check image whose disk reaches the frame edge', w => { w.chk = { body: mkPng(discOf(0.52)), type: 'image/png' }; }, /picture failed validation/, async w => ok('G … refused for the edge', /disk touches the frame edge/.test(w.runs[w.runs.length - 1].note), w.runs[w.runs.length - 1].note));
await refuse('G check image fully transparent', w => { w.chk = { body: mkPng(() => 0), type: 'image/png' }; }, /picture failed validation/);
for (const base of ['night', 'dusk']) { const w = await world(); w.base = base; const r = await run(w, T0), f = (await ptr(w)).frame; ok(`G a real ${base} frame passes every check`, /published/.test(r) && f.checks.agreement > 0.9, [r, f && f.checks]); }
{ // pure: the structure walk
  const s = W.evJpegScans(RAW['day.jpg']); ok('G walk: a real frame is progressive, 2048 square, ten scans, complete', s.ok && s.progressive && s.w === 2048 && s.h === 2048 && s.scans === 10 && s.complete && s.missing === 0, s);
  const b = W.evJpegScans(new Uint8Array(fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/picture-a.jpg')))); ok('G walk: a baseline JPEG with one full scan counts as complete', b.ok && b.complete, b);
  ok('G walk: not a JPEG', W.evJpegScans(new TextEncoder().encode('<xml/>')).ok === false); }
// ===== H. the source check itself fails
const checkFail = async (name, set) => { const w = await world(); await run(w, T0); const before = (await ptr(w)).frame.id; set(w); const r = await run(w, T0 + 10 * MIN), s = await state(w), p = await ptr(w), mj = await (await route(w, '/snapshot/earthview/meta')).json();
  ok(`H ${name}: recorded as a failed CHECK, with no newest frame claimed`, r === 'earthview:down source check failed' && s.source_check.ok === false && !('newest' in s.source_check) && s.collection.outcome === 'failed' && s.collection.frame_time === null, s);
  ok(`H ${name}: the frame is kept and still served; meta carries the failed check`, p.frame.id === before && mj.frame.id === before && mj.source_check.ok === false && maps(w).length === 2, mj.source_check); };
await checkFail('capabilities HTTP 503', w => { w.capStatus = 503; });
await checkFail('capabilities unreachable', w => { w.capThrow = true; });
await checkFail('capabilities without this layer', w => { w.capBody = '<WMS_Capabilities><Layer><Name>mtg_fd:rgb_dust</Name><Dimension name="time" default="2026-11-19T11:10:00Z">x</Dimension></Layer></WMS_Capabilities>'; });
await checkFail('a time off the ten-minute grid', w => { w.capBody = caps('2026-11-19T11:13:00Z'); });
ok('H pure: the newest time is read from this layer only', W.evLatest(caps('2026-11-19T11:00:00Z')) === '2026-11-19T11:00:00Z' && W.evLatest(caps(null)) === null);
// ===== I. order and concurrency
{ const w = await world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; const w2env = w.env;
  w.onPointerPut = async () => { // another run publishes 11:20 while this one is about to write 11:10
    const o = await w2env.R2.get(W.EARTHVIEW.POINTER), cur = await o.json(); const f = { ...cur.frame, id: 'x', source_frame_time: '2026-11-19T11:20:00Z' };
    await w2env.R2.put(W.EARTHVIEW.POINTER, JSON.stringify({ ...cur, frame: f, previous: cur.frame }), { onlyIf: { etagMatches: o.etag } }); };
  const r = await run(w, T0 + 10 * MIN), p = await ptr(w), s = await state(w);
  ok('I1 a run that loses the race does not put an older frame over a newer one', r === 'earthview:superseded 2026-11-19T11:10:00Z' && p.frame.source_frame_time === '2026-11-19T11:20:00Z', [r, p.frame.source_frame_time]);
  ok('I2 and says so in the state', s.collection.outcome === 'superseded', s.collection);
  const sBefore = await state(w); use(w); setNow(T0 + 5 * MIN); w.capStatus = 503; await W.collectEarthView(w.env, T0 + 5 * MIN); const sAfter = await state(w);
  ok('I3 a run that STARTED earlier never replaces a later run\'s state', sAfter.run === sBefore.run && sAfter.collection.outcome === 'superseded', sAfter); }
// ===== J. keeping the last good picture: cleanup only after a newer verified frame, with a grace period
{ const w = await world(); const pub = async (t, at) => { w.latest = t; w.capStatus = 200; w.warn = 'echo'; return run(w, at); };
  await pub('2026-11-19T11:00:00Z', T0); await pub('2026-11-19T11:10:00Z', T0 + 10 * MIN); await pub('2026-11-19T11:20:00Z', T0 + 20 * MIN);
  let h = await held(w); const id1 = h[0].id, id2 = h[1].id, id3 = h[2].id, key1 = h[0].key;
  ok('J1 three frames: the first has left its role and its grace period started at that publication; nothing deleted', h.length === 3 && h[0].left_at.startsWith('2026-11-19T11:41:00') && h[1].left_at === null && h[2].left_at === null && !w.deletes.length && frames(w).length === 3, h);
  const r1 = await route(w, `/snapshot/earthview/${id1}/picture.jpg`); ok('J2 a reader still showing the first frame can reload it during the grace period', r1.status === 200 && sha(Buffer.from(await r1.arrayBuffer())).startsWith(id1.split('-')[1]), r1.status);
  // a long outage: 48 hours of failed checks, failed pictures and idle runs
  w.capStatus = 503; for (let k = 1; k <= 12; k++) await run(w, T0 + 20 * MIN + k * 4 * 60 * MIN);
  w.capStatus = 200; w.latest = '2026-11-19T11:30:00Z'; w.warn = null; for (let k = 0; k < 3; k++) await run(w, T0 + 49 * 60 * MIN + k * 10 * MIN);
  w.warn = 'echo'; w.latest = '2026-11-19T11:20:00Z'; await run(w, T0 + 50 * 60 * MIN);
  const p = await ptr(w);
  ok('J3 after 48 hours with no new verified frame NOTHING is deleted, although every picture is older than the grace period', !w.deletes.length && frames(w).length === 3 && p.frame.id === id3 && p.previous.id === id2, [w.deletes, frames(w).length]);
  ok('J4 current and previous are still served after the outage', (await route(w, p.frame.picture.path)).status === 200 && (await route(w, p.previous.picture.path)).status === 200);
  // a newer verified frame arrives: only now may the long-departed first picture go
  await pub('2026-11-21T13:00:00Z', T0 + 50 * 60 * MIN + 10 * MIN); h = await held(w);
  ok('J5 the next verified publication deletes exactly the picture that left its role over 24 hours ago', w.deletes.length === 1 && w.deletes[0] === key1 && !h.some(x => x.id === id1), [w.deletes, h.map(x => x.id)]);
  ok('J6 the frame that has only just left its role is kept and its grace period starts now', h.some(x => x.id === id2 && x.left_at.startsWith('2026-11-21T13:31:00')) && w.store.has(h.find(x => x.id === id2).key), h);
  ok('J7 current and previous are never on the delete list', !w.deletes.includes((await ptr(w)).frame.picture.key) && !w.deletes.includes((await ptr(w)).previous.picture.key));
  const gone = await route(w, `/snapshot/earthview/${id1}/picture.jpg`); ok('J8 a deleted picture answers 404, not another picture', gone.status === 404, gone.status);
  await pub('2026-11-21T13:10:00Z', T0 + 50 * 60 * MIN + 20 * MIN); ok('J9 ten minutes later: nothing more deleted (inside the grace period)', w.deletes.length === 1, w.deletes);
  await pub('2026-11-22T14:00:00Z', T0 + 75 * 60 * MIN); ok('J10 a day later: the next two are deleted, in a publishing run', w.deletes.length === 3 && frames(w).length === 3, [w.deletes.length, frames(w).length]);
  ok('J11 every stored picture is on the held list', (await held(w)).map(x => x.key).sort().join() === frames(w).join(), [frames(w), (await held(w)).map(x => x.key)]); }
// ===== K. failures inside the job, storage faults, serving
{ const w = await world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; w.brokenResponse = true; const r = await run(w, T0 + 10 * MIN), s = await state(w);
  ok('K1 an unexpected error inside the job: recorded as internal error, no generic "down" file, frame kept', /earthview:(down internal error|threw)/.test(r) && s.collection.reason === 'internal error' && ![...w.store.keys()].some(k => /^latest/.test(k)) && (await ptr(w)).frame.source_frame_time === '2026-11-19T11:00:00Z', [r, s.collection, [...w.store.keys()]]); }
{ const w = await world(); w.putFail = 'picture.jpg'; const r = await run(w, T0), h = await held(w); ok('K2 the picture cannot be stored: nothing published', /picture write failed/.test(r) && !(await ptr(w) || {}).frame, r);
  ok('K2 its entry stays pending (number taken, no object) and is not served', h.length === 1 && !!h[0].pending && (await route(w, '/snapshot/earthview/' + h[0].id + '/picture.jpg')).status === 404, h);
  w.putFail = null; const r2 = await run(w, T0 + 10 * MIN), p = await ptr(w); ok('K2 the next run takes the next number and publishes', /published/.test(r2) && /-g2-[0-9a-f]{24}$/.test(p.frame.id) && w.store.has(p.frame.picture.key), [r2, p.frame && p.frame.id]); }
{ const w = await world(); w.corruptRead = 'picture.jpg'; const r = await run(w, T0); ok('K3 the stored picture reads back differently: nothing published', /read-back differs/.test(r) && !(await ptr(w) || {}).frame, r); }
{ const w = await world(); await run(w, T0); const f = (await ptr(w)).frame; w.corruptRead = 'picture.jpg'; const pr = await route(w, f.picture.path);
  ok('K4 a stored picture that no longer matches is not served', pr.status === 503 && (await pr.json()).reason === 'integrity', pr.status);
  w.corruptRead = null; ok('K5 unknown or malformed picture addresses answer 404', (await route(w, '/snapshot/earthview/20261119T1100Z-0000000000000000-g7-000000000000000000000000/picture.jpg')).status === 404 && (await route(w, '/snapshot/earthview/' + f.id.replace(/-[0-9a-f]{24}$/, '') + '/picture.jpg')).status === 404 && (await route(w, '/snapshot/earthview/' + f.id.replace(/-g\d+-[0-9a-f]{24}$/, '') + '/picture.jpg')).status === 404 && (await route(w, '/snapshot/earthview/' + f.id + '/mask.png')).status === 404 && (await route(w, '/snapshot/earthview/..%2f..%2fcurrent.json/picture.jpg')).status === 404); }
{ // create-only: with the random source made to repeat, a run is given a key that already holds an object (planted after the guards, as a second run with the same draw would)
  const w = await world(), epoch = (await ptr(w)).epoch, key = 'earthview/frames/' + epoch + '/' + W.evKeyOf('2026-11-19T11:00:00Z') + '-' + sha(jpg(Date.parse('2026-11-19T11:00:00Z') / 6e5)).slice(0, 16) + '-g1-' + '07'.repeat(12) + '/picture.jpg';
  w.once.push({ op: 'put', key: 'picture.jpg', fn: async () => { w.store.set(key, { buf: Buffer.from('something else'), opts: {}, etag: 'x' }); } });
  const r = await fixedRandom(7, () => run(w, T0)); ok('K6 an object already at the key a run was given is never replaced, and nothing is published', r === 'earthview:down picture key already in use' && w.store.get(key).buf.toString() === 'something else' && !(await ptr(w) || {}).frame, r);
  w.store.delete(key); const r2 = await run(w, T0 + 10 * MIN), p = await ptr(w); ok('K6 the next run takes the next number, draws its own value and publishes under its own key', /published/.test(r2) && /-g2-[0-9a-f]{24}$/.test(p.frame.id) && p.frame.picture.key !== key, [r2, p.frame && p.frame.id]); }
{ // one key, one writer: the same frame with the same bytes, stored by three runs, is three keys; numbers never repeat, even after entries are removed
  const w = await world(); w.putFail = 'current.json'; await run(w, T0); await run(w, T0 + 10 * MIN); w.putFail = null; const r = await run(w, T0 + 20 * MIN), h = await held(w), o = await (await w.env.R2.get(W.EARTHVIEW.HELD)).json();
  ok('K9 three runs for the same frame and bytes store three objects under three keys; only the third is published', /published/.test(r) && frames(w).length === 3 && new Set(frames(w)).size === 3 && h.map(x => x.gen).join() === '1,2,3' && /-g3-[0-9a-f]{24}$/.test((await ptr(w)).frame.id) && o.next_gen === 4, [frames(w), h.map(x => x.gen), o.next_gen]);
  ok('K9 the two unpublished ones stay listed; the publishing run\'s cleanup started their grace period', h.filter(x => x.left_at).map(x => x.gen).join() === '1,2' && h[2].left_at === null && !w.deletes.length, h.map(x => [x.gen, x.left_at]));
  const hh = await w.env.R2.get(W.EARTHVIEW.HELD), body = await hh.json(); body.next_gen = 1; await w.env.R2.put(W.EARTHVIEW.HELD, JSON.stringify(body), { onlyIf: { etagMatches: hh.etag } });
  w.latest = '2026-11-19T11:10:00Z'; await run(w, T0 + 30 * MIN); ok('K9 a counter that was set back is taken past every number still listed', /-g4-[0-9a-f]{24}$/.test((await ptr(w)).frame.id), (await ptr(w)).frame.id); }
{ const mj = await (await route(world0(), '/snapshot/earthview/meta')).json(); ok('K7 meta before anything exists: empty, not an error, and says collection is off or on', mj.frame === null && mj.previous === null && mj.source_check === null && mj.collecting === true, mj);
  const m2 = await (await route(await world(), '/snapshot/earthview/meta')).json(); ok('K7 meta on storage that is set up and empty: the same', m2.frame === null && m2.previous === null && m2.collection === null, m2); }
{ const w = await world(); const r = await run(w, T0); ok('K8 the Dust collector\'s storage is untouched by this job', ![...w.store.keys()].some(k => /^dustrgb/.test(k)) && /published/.test(r)); }
// ===== L. publication against overlapping cleanup (GPT's review of ef33a18, finding 1)
// Set-up for each case: 11:00 is current. A run for 11:30 stores its picture and is interrupted before the pointer moves, leaving an
// UNPUBLISHED CANDIDATE. The source list then steps back to 11:10, which is published; its cleanup starts the candidate's grace
// period. More than 24 hours pass with nothing new. Then two runs overlap: A for 11:30 again (same bytes, so the same stored object)
// and B for 11:20, whose cleanup finds the candidate out of role and past its grace period.
const raceWorld = async () => { const w = await world(); await run(w, T0);
  w.latest = '2026-11-19T11:30:00Z'; w.putFail = 'current.json'; await run(w, T0 + 10 * MIN); w.putFail = null;
  const cand = frames(w).find(k => /T1130Z/.test(k)); w.latest = '2026-11-19T11:10:00Z'; await run(w, T0 + 20 * MIN);
  return { w, cand, later: T0 + 30 * 60 * MIN }; };
const bRun = async (w, at, latest) => { const keep = w.latest; w.latest = latest; setNow(at); const r = await W.collectEarthView(w.env, at); w.latest = keep; return r; };
const sound = async (w, name) => { const p = await ptr(w), h = await held(w), has = k => w.store.has(k);
  ok(`${name}: the current frame's picture exists and is served`, p.frame && has(p.frame.picture.key) && (await route(w, p.frame.picture.path)).status === 200, [p.frame && p.frame.id, p.frame && has(p.frame.picture.key)]);
  ok(`${name}: the previous frame's picture exists and is served`, !p.previous || (has(p.previous.picture.key) && (await route(w, p.previous.picture.path)).status === 200), p.previous && p.previous.id);
  ok(`${name}: every stored picture is on the held list and every unmarked entry has its picture`, frames(w).every(k => h.some(x => x.key === k)) && h.filter(x => !x.deleting).every(x => has(x.key)), [frames(w), h.map(x => [x.id, !!x.deleting])]); return p; };
{ const { w, cand } = await raceWorld(); const h = await held(w), c = h.find(x => x.key === cand);
  ok('L0 set-up: an unpublished 11:30 candidate is stored, on the held list, out of role, its grace period begun; 11:10 is current', !!cand && w.store.has(cand) && c && !!c.left_at && (await ptr(w)).frame.source_frame_time === '2026-11-19T11:10:00Z' && (await state(w)).collection.outcome === 'published', [cand, c]); }
{ // L1: GPT's first reproduction (review of ef33a18). B runs whole (publishes 11:20, cleanup deletes the aged candidate) while A is collecting 11:30 again.
  const { w, cand, later } = await raceWorld(); w.latest = '2026-11-19T11:30:00Z'; let b = null;
  w.once.push({ op: 'get', key: 'held.json', skip: 2, fn: async () => { b = await bRun(w, later + 1000, '2026-11-19T11:20:00Z'); } });   // A's third read of the list: the one that takes its number (the guards read it twice)
  const a = await run(w, later), p = await sound(w, 'L1');
  ok('L1 B published 11:20 and its cleanup removed the aged candidate', /published 2026-11-19T11:20/.test(b) && w.deletes.includes(cand), [b, w.deletes]);
  ok('L1 A published 11:30 under a key of its own; the retired key was not written again', a === 'earthview:published 2026-11-19T11:30:00Z' && p.frame.source_frame_time === '2026-11-19T11:30:00Z' && p.previous.source_frame_time === '2026-11-19T11:20:00Z' && p.frame.picture.key !== cand && !w.store.has(cand), [a, p.frame.picture.key]); }
{ // L2: B runs whole exactly at A's first write to the list: A's write is refused (the list changed), A reads again and takes the next number.
  const { w, cand, later } = await raceWorld(); w.latest = '2026-11-19T11:30:00Z'; let b = null;
  w.once.push({ op: 'put', key: 'held.json', fn: async () => { b = await bRun(w, later + 1000, '2026-11-19T11:20:00Z'); } });
  const a = await run(w, later), p = await sound(w, 'L2');
  ok('L2 the same outcome when B lands exactly on A\'s write to the list; A and B hold different numbers', /published 2026-11-19T11:20/.test(b) && w.deletes.includes(cand) && /published 2026-11-19T11:30/.test(a) && p.frame.source_frame_time === '2026-11-19T11:30:00Z' && w.conflicts > 0 && p.frame.id.split('-g')[1] !== p.previous.id.split('-g')[1], [a, b, w.conflicts, p.frame.id, p.previous.id]); }
{ // L3: A has stored and claimed its picture; B runs whole (cleanup included) before A's pointer write.
  const { w, cand, later } = await raceWorld(); w.latest = '2026-11-19T11:30:00Z'; let b = null;
  w.once.push({ op: 'get', key: 'current.json', fn: async () => {} });   // A's own first pointer read passes untouched
  w.once.push({ op: 'put', key: 'current.json', fn: async () => { b = await bRun(w, later + 1000, '2026-11-19T11:20:00Z'); } });
  const a = await run(w, later), p = await sound(w, 'L3');
  ok('L3 a claimed picture survives an overlapping cleanup; only the old candidate is deleted', /published 2026-11-19T11:20/.test(b) && w.deletes.join() === cand && /published 2026-11-19T11:30/.test(a) && p.frame.source_frame_time === '2026-11-19T11:30:00Z', [a, b, w.deletes]); }
{ // L4: B has MARKED the old candidate and is about to delete it when A runs whole for the same frame and bytes.
  const { w, cand, later } = await raceWorld(); let a = null;
  w.once.push({ op: 'delete', key: 'picture.jpg', fn: async () => { a = await bRun(w, later + 1000, '2026-11-19T11:30:00Z'); } });
  const b = await bRun(w, later, '2026-11-19T11:20:00Z'), p = await sound(w, 'L4');
  ok('L4 A publishes under its own key while the old one is being deleted; B\'s delete then removes only the old key', a === 'earthview:published 2026-11-19T11:30:00Z' && /published/.test(b) && p.frame.source_frame_time === '2026-11-19T11:30:00Z' && p.frame.picture.key !== cand && !w.store.has(cand) && w.deletes.every(k => k === cand), [a, b, w.deletes, p.frame.picture.key]); }
{ // L5: a cleanup's delete fails after its mark. The mark stands; the next cleanup finishes.
  const { w, cand, later } = await raceWorld(); w.deleteFail = true; const b = await bRun(w, later, '2026-11-19T11:20:00Z'); w.deleteFail = false;
  const h = await held(w); ok('L5 a failed delete leaves the candidate marked and still stored; the publication stands', /published/.test(b) && h.some(x => x.key === cand && x.deleting) && w.store.has(cand), h.map(x => [x.id, x.deleting]));
  const gone = await route(w, '/snapshot/earthview/' + h.find(x => x.key === cand).id + '/picture.jpg'); ok('L5 a marked picture is not served', gone.status === 404, gone.status);
  w.latest = '2026-11-19T11:30:00Z'; const a = await run(w, later + 10 * MIN), p = await sound(w, 'L5 after the next publication');
  ok('L5 a run for the same frame publishes under its own key, and its cleanup finishes the old deletion and removes the entry', /published 2026-11-19T11:30/.test(a) && p.frame.picture.key !== cand && w.deletes.includes(cand) && !w.store.has(cand) && !(await held(w)).some(x => x.key === cand), [a, w.deletes]); }
{ // L5b: the delete succeeds but the list update that removes the entry fails. A marked entry with no object remains; the next cleanup removes it.
  const { w, cand, later } = await raceWorld(); w.once.push({ op: 'delete', key: 'picture.jpg', fn: async () => { w.putFail = 'held.json'; } });
  const b = await bRun(w, later, '2026-11-19T11:20:00Z'); w.putFail = null; const h = await held(w);
  ok('L5b after a failed list update: object gone, entry still marked, publication stands, nothing unmarked lacks its object', /published/.test(b) && !w.store.has(cand) && h.some(x => x.key === cand && x.deleting), h.map(x => [x.id, x.deleting])); await sound(w, 'L5b');
  w.latest = '2026-11-19T11:30:00Z'; const a = await run(w, later + 10 * MIN); await sound(w, 'L5b after the next publication');
  ok('L5b the next cleanup deletes again (harmless) and removes the entry', /published/.test(a) && !(await held(w)).some(x => x.key === cand) && w.deletes.filter(k => k === cand).length === 2, w.deletes); }
{ // L5c: the claim. An entry marked for deletion before its own run claims it (possible only if that run stood still for the whole grace period; forced here by hand) is not published.
  const w = await world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z';
  w.once.push({ op: 'get', key: 'picture.jpg', fn: async () => { const o = await w.env.R2.get(W.EARTHVIEW.HELD), h = await o.json(); h.items = h.items.map(x => x.pending ? { ...x, deleting: '2026-11-19T11:30:00.000Z' } : x); await w.env.R2.put(W.EARTHVIEW.HELD, JSON.stringify(h), { onlyIf: { etagMatches: o.etag } }); } });
  const r = await run(w, T0 + 10 * MIN), p = await ptr(w);
  ok('L5c a run whose entry was marked before its claim publishes nothing and says why', r === 'earthview:down stored copy is being removed' && p.frame.source_frame_time === '2026-11-19T11:00:00Z', [r, p.frame.source_frame_time]); }
{ // L6: cleanup reads the pointer itself. A run whose own view of "previous" is out of date must not start a grace period on a live picture, nor delete one.
  const w = await world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; await run(w, T0 + 10 * MIN); const first = (await ptr(w)).previous;
  // age the first frame's entry by hand as an interrupted earlier cleanup could have, then publish: it is PREVIOUS, so it must be kept and its grace period cleared
  const o = await w.env.R2.get(W.EARTHVIEW.HELD), hh = await o.json(); hh.items = hh.items.map(x => x.id === first.id ? { ...x, left_at: '2026-11-01T00:00:00.000Z' } : x); await w.env.R2.put(W.EARTHVIEW.HELD, JSON.stringify(hh), { onlyIf: { etagMatches: o.etag } });
  w.latest = '2026-11-19T11:00:00Z'; await run(w, T0 + 20 * MIN);   // an idle run: nothing may change
  ok('L6 an idle run never cleans, whatever the list says', !w.deletes.length && w.store.has(first.picture.key));
  const w2 = await world(); await run(w2, T0); const f0 = (await ptr(w2)).frame; const o2 = await w2.env.R2.get(W.EARTHVIEW.HELD), h2 = await o2.json(); h2.items[0].left_at = '2026-11-01T00:00:00.000Z'; await w2.env.R2.put(W.EARTHVIEW.HELD, JSON.stringify(h2), { onlyIf: { etagMatches: o2.etag } });
  w2.latest = '2026-11-19T11:10:00Z'; await run(w2, T0 + 10 * MIN); const h3 = await held(w2);
  ok('L6 a picture that is previous is never deleted, even with a grace period long run out on the list; the stale mark is cleared', !w2.deletes.length && w2.store.has(f0.picture.key) && h3.find(x => x.id === f0.id).left_at === null, [w2.deletes, h3.map(x => [x.id, x.left_at])]); }
{ // L7: defence in depth. The protocol cannot put a mark on a live picture; if one is there anyway (written here by hand), the guards stop the next run, and a cleanup that meets it clears it and deletes nothing.
  const w = await world(); await run(w, T0); const f0 = (await ptr(w)).frame, epoch = (await ptr(w)).epoch; const o = await w.env.R2.get(W.EARTHVIEW.HELD), h = await o.json(); h.items[0].deleting = '2026-11-19T11:21:30.000Z'; h.items[0].left_at = '2026-11-01T00:00:00.000Z'; await w.env.R2.put(W.EARTHVIEW.HELD, JSON.stringify(h), { onlyIf: { etagMatches: o.etag } });
  w.latest = '2026-11-19T11:10:00Z'; const r = await run(w, T0 + 10 * MIN);
  ok('L7 a mark found on the current picture stops the run for repair; nothing is deleted or published', r === 'earthview:down storage record needs repair' && !w.deletes.length && (await ptr(w)).frame.id === f0.id && /current picture is marked for deletion/.test(w.runs[w.runs.length - 1].note), [r, w.runs[w.runs.length - 1].note]);
  setNow(T0 + 11 * MIN); const n = await W.evCleanup(w.env, epoch), h2 = await held(w);
  ok('L7 a cleanup that meets the mark clears it and keeps the picture', n === 0 && !w.deletes.length && w.store.has(f0.picture.key) && !h2.find(x => x.id === f0.id).deleting && h2.find(x => x.id === f0.id).left_at === null, [w.deletes, h2.map(x => [x.id, x.deleting, x.left_at])]); await sound(w, 'L7'); }
{ // L8: GPT's three-collector reproduction (review of b588071), as supplied. One assertion is adapted and marked: under the repair A does
  // not restore the old key (GPT's text asserted w.store.has(cand)); it publishes 11:40 under a key of its own and the old key stays gone.
  const w = await world();
  await run(w, T0);
  w.latest = '2026-11-19T11:40:00Z';
  w.putFail = 'current.json';
  await run(w, T0 + 10 * MIN);
  w.putFail = null;
  const cand = frames(w).find(k => /T1140Z/.test(k));
  w.latest = '2026-11-19T11:10:00Z';
  await run(w, T0 + 20 * MIN);
  const later = T0 + 30 * 60 * MIN;
  w.once.push({
    op: 'delete', key: cand,
    fn: async () => {
      const c = await bRun(w, later + 1000, '2026-11-19T11:30:00Z');
      ok('L8 C publishes and completes marked deletion', /published/.test(c) && !w.store.has(cand) && !(await held(w)).some(x => x.key === cand), [c, w.deletes]);
      const a = await bRun(w, later + 2000, '2026-11-19T11:40:00Z'), pa = await ptr(w);
      ok('L8 A publishes 11:40 before B resumes its delete (ADAPTED: under its own key; the old key is not restored)', /published/.test(a) && pa.frame.source_frame_time === '2026-11-19T11:40:00Z' && pa.frame.picture.key !== cand && w.store.has(pa.frame.picture.key) && !w.store.has(cand), [a, pa.frame.picture.key]);
    }
  });
  await bRun(w, later, '2026-11-19T11:20:00Z');
  const p = await sound(w, 'L8 overlapping cleanup owners');
  ok('L8 after B resumes: 11:40 is current, its picture exists and is served, and the old key was deleted twice to no effect', p.frame.source_frame_time === '2026-11-19T11:40:00Z' && w.store.has(p.frame.picture.key) && w.deletes.filter(k => k === cand).length === 2 && w.deletes.every(k => k === cand), [w.deletes, p.frame.picture.key]); }
// =====================================================================================================================
// M to P: storage guards, recovery and fencing (GPT's review of readiness rev 2, 20 Nov 2026)
// =====================================================================================================================
const snap = w => new Map([...w.store].map(([k, v]) => [k, sha(v.buf)]));
const changedSince = (w, before, allow = k => k === W.EARTHVIEW.STATE) => { const now = snap(w); return [...new Set([...before.keys(), ...now.keys()])].filter(k => !allow(k) && before.get(k) !== now.get(k)); };
const lastNote = w => w.runs.length ? w.runs[w.runs.length - 1].note : null;
const pubs = async (w, n) => { for (let i = 0; i < n; i++) { w.latest = tAdd('2026-11-19T11:00:00Z', 10 * i); await run(w, T0 + i * 10 * MIN); } return w; };
const three = async () => pubs(await world(), 3);
const rewrite = async (w, key, f) => { const o = await w.env.R2.get(key), b = await o.json(); f(b); await w.env.R2.put(key, JSON.stringify(b), { onlyIf: { etagMatches: o.etag } }); };
/** asserts that the next run stops with a fixed phrase, asks the source nothing, deletes nothing and changes nothing but the page's state record */
const stops = async (name, w, reason, noteRe, at = T0 + 90 * MIN) => { const before = snap(w), n = w.reqs.length, d = w.deletes.length; const r = await run(w, at), changed = changedSince(w, before), s = await state(w);
  ok(`${name}: the run stops with "${reason}"`, r === 'earthview:down ' + reason, r);
  ok(`${name}: no request to the source, nothing deleted, and no pointer, list, marker or picture created or changed`, w.reqs.length === n && w.deletes.length === d && !changed.length, [w.reqs.length - n, changed]);
  ok(`${name}: the page's state record shows a failed collection with that phrase; the run log has the finding`, s.collection.outcome === 'failed' && s.collection.reason === reason && (!noteRe || noteRe.test(lastNote(w))), [s.collection, lastNote(w)]); };
/** a pause point: push g.hook(...) on w.once; await g.reached; later g.open() */
const gate = () => { let reach, open; const reached = new Promise(r => { reach = r; }), opened = new Promise(r => { open = r; });
  return { reached: Promise.race([reached, new Promise((_, j) => setTimeout(() => j(new Error('pause point never reached')), 5000))]), open, hook: (op, key, skip = 0) => ({ op, key, skip, fn: async () => { reach(); await opened; } }) }; };
const served = async (w, f) => { if (!f) return null; const r = await route(w, f.picture.path); return r.status === 200 && sha(Buffer.from(await r.arrayBuffer())) === f.picture.sha256; };
const soundR = async (w, name) => { const p = await ptr(w), h = await held(w);
  ok(`${name}: the current and previous pictures exist under this epoch, are on the list in role, and are served unchanged`, [p.frame, p.previous].filter(Boolean).every(f => f.picture.key.startsWith('earthview/frames/' + p.epoch + '/') && w.store.has(f.picture.key) && h.some(x => x.key === f.picture.key && !x.deleting && !x.pending && x.left_at === null)) && await served(w, p.frame) !== false && await served(w, p.previous) !== false, [p.frame && p.frame.id, p.previous && p.previous.id]); return p; };

// ===== M. guards at the start of every run
{ const w = world0(); await stops('M1 storage never set up', w, 'storage is not set up');
  ok('M1 the collector did not create a pointer, a list, a marker or a hold', ![...w.store.keys()].some(k => k !== W.EARTHVIEW.STATE), [...w.store.keys()]);
  const r2 = await run(w, T0 + 100 * MIN); ok('M1 and does not on the next run either', r2 === 'earthview:down storage is not set up' && [...w.store.keys()].join() === W.EARTHVIEW.STATE, [...w.store.keys()]); }
{ const w = await three(); await admin(w, 'hold', { apply: true });
  await stops('M2 hold, manual job', w, 'collection is held');
  use(w); const at4 = Date.UTC(2026, 10, 19, 13, 4, 0); setNow(at4); const n = w.reqs.length, r5 = await W.JOBS.five(w.env, at4);
  ok('M2 hold, scheduled job: stopped the same way, no request to the source', /earthview:down collection is held/.test(r5) && !w.reqs.slice(n).some(u => /eumetsat/.test(u)), r5);
  const ar = await (await runRoute(w)).json(); ok('M2 hold, the admin run route: stopped the same way', ar.result === 'earthview:down collection is held', ar);
  const rel = await release(w); w.latest = '2026-11-19T11:30:00Z'; const r = await run(w, T0 + 120 * MIN); ok('M2 after release the next run publishes', rel.result === 'released' && /published 2026-11-19T11:30/.test(r), [rel, r]); }
{ const w = await three(); w.store.delete(W.EARTHVIEW.HELD); await stops('M3 the list is gone', w, 'storage record needs repair', /list missing/);
  ok('M3 the list was not recreated and no number was taken', !w.store.has(W.EARTHVIEW.HELD) && frames(w).length === 3);
  const w2 = await three(); w2.store.delete(W.EARTHVIEW.POINTER); await stops('M3 the pointer is gone', w2, 'storage record needs repair', /pointer missing/);
  const w3 = await three(); w3.store.set(W.EARTHVIEW.HELD, { buf: Buffer.from('{not json'), opts: {}, etag: 'bad' }); await stops('M3 the list does not parse', w3, 'storage record needs repair', /list unreadable/);
  const w4 = await three(); w4.store.delete(W.EARTHVIEW.HELD); w4.store.delete(W.EARTHVIEW.POINTER); await stops('M3 pointer and list both gone, pictures and markers left', w4, 'storage is not set up');
  ok('M3 … and nothing is created over the pictures that remain', !w4.store.has(W.EARTHVIEW.HELD) && !w4.store.has(W.EARTHVIEW.POINTER) && frames(w4).length === 3); }
{ const w = await three(); await rewrite(w, W.EARTHVIEW.HELD, h => { h.epoch = 'e20200101T000000Z-0000000000000000'; }); await stops('M4 the list carries another epoch', w, 'storage record needs repair', /epochs differ/);
  const w2 = await three(), e = (await ptr(w2)).epoch; w2.store.delete(W.EARTHVIEW.EPOCHS + e + '.json'); await stops('M4 the epoch has no marker', w2, 'storage record needs repair', /no marker for epoch/); }
{ const w = await three(), p = await ptr(w); await rewrite(w, W.EARTHVIEW.HELD, h => { h.items = h.items.map(x => x.id === p.previous.id ? { ...x, pending: 'x' } : x); }); await stops('M5 the previous picture is pending on the list', w, 'storage record needs repair', /previous picture is still pending/);
  const w2 = await three(), p2 = await ptr(w2); await rewrite(w2, W.EARTHVIEW.POINTER, c => { c.frame.picture.key = 'earthview/frames/e20200101T000000Z-0000000000000000/' + c.frame.id + '/picture.jpg'; }); await stops('M5 the current picture is outside this epoch', w2, 'storage record needs repair', /current picture is outside this epoch/); }
{ const w = await three(), e = (await ptr(w)).epoch, stray = 'earthview/frames/' + e + '/zz-stray/picture.jpg'; w.store.set(stray, { buf: Buffer.from('x'), opts: {}, etag: 's' }); w.lists.length = 0;
  await stops('M6 a stored picture the list does not know', w, 'storage record needs repair', /1 stored picture\(s\) not on the list, 0 listed picture\(s\) not stored/);
  ok('M6 the mismatch was confirmed by a second complete pass before it was called repair', w.lists.filter(x => x === 'earthview/frames/' + e + '/').length === 2, w.lists);
  const w2 = await three(), h = await held(w2); w2.store.delete(h[0].key); await stops('M6 a claimed, unmarked entry whose picture is gone', w2, 'storage record needs repair', /0 stored picture\(s\) not on the list, 1 listed picture\(s\) not stored/); }
{ // M7: legitimate states are never reported. Pending without a picture: K2. Marked without a picture: L5b. A picture adopted by a recovery (another epoch's key) that an old delete has since removed: here.
  const w = await three(); await recover(w); const adopted = (await held(w)).filter(x => x.recovered && x.left_at); w.store.delete(adopted[0].key);
  const rel = await release(w); w.latest = '2026-11-19T11:30:00Z'; const r = await run(w, T0 + 60 * MIN);
  ok('M7 an adopted picture removed by an old delete is not a finding: release passes and the next run publishes', adopted.length === 3 && rel.result === 'released' && /published 2026-11-19T11:30/.test(r), [adopted.length, rel, r]); }
{ // M8: GPT's case. A reads the list; B reserves, stores, claims and publishes; A then lists the objects. B's picture must not be called unlisted.
  const w = await world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; let b = null; w.lists.length = 0;
  w.once.push({ op: 'list', key: '/', fn: async () => { b = await bRun(w, T0 + 10 * MIN + 1000, '2026-11-19T11:10:00Z'); } });
  const a = await run(w, T0 + 10 * MIN);
  ok('M8 a picture stored by another run between the list read and the listing is not a finding; the overtaken pass is repeated', /published 2026-11-19T11:10/.test(b) && a === 'earthview:nothing newer 2026-11-19T11:10:00Z' && !w.runs.some(x => /repair|busy/.test(x.note)), [a, b, w.runs.map(x => x.note)]); await sound(w, 'M8'); }
{ // M9: passes that keep being overtaken end as "storage busy", not as repair
  const w = await three(); for (let i = 0; i < 4; i++) w.once.push({ op: 'list', key: '/', fn: async () => rewrite(w, W.EARTHVIEW.HELD, h => { h.touched = (h.touched || 0) + 1; }) });
  w.latest = '2026-11-19T11:30:00Z'; const n = w.reqs.length, r = await run(w, T0 + 60 * MIN), s = await state(w);
  ok('M9 an inventory overtaken four times: "storage busy", no source request, nothing published, nothing called broken', r === 'earthview:down storage busy' && w.reqs.length === n && s.collection.reason === 'storage busy' && /the list kept changing/.test(lastNote(w)) && (await ptr(w)).frame.source_frame_time === '2026-11-19T11:20:00Z', [r, lastNote(w)]);
  const r2 = await run(w, T0 + 70 * MIN); ok('M9 the next run, undisturbed, publishes', /published 2026-11-19T11:30/.test(r2), r2); }
{ // M10: the listing is read to its last page
  const w = await world(); w.pageSize = 2; await pubs(w, 5); const e = (await ptr(w)).epoch;
  ok('M10 five pictures over three pages: every run passes the inventory and publishes', frames(w).length === 5 && (await ptr(w)).frame.source_frame_time === '2026-11-19T11:40:00Z' && !w.runs.some(x => x.status !== 'ok'), w.runs.map(x => x.note));
  w.store.set('earthview/frames/' + e + '/zz-stray/picture.jpg', { buf: Buffer.from('x'), opts: {}, etag: 's' }); await stops('M10 an unlisted picture on the last page is found', w, 'storage record needs repair', /1 stored picture\(s\) not on the list/); }

// ===== N. hold, recover, sweep, release
{ // N1: the first start is a recovery on empty storage
  const w = world0(); use(w); const st = await admin(w, 'status');
  ok('N1 status on empty storage: nothing there, guards say not set up, nothing written', st.http === 200 && st.seen.pointer === 'missing' && st.seen.list === 'missing' && st.seen.guards.startsWith('storage is not set up') && !w.store.size, st.seen);
  const d = await admin(w, 'recover'); ok('N1 dry run: a first start; writes nothing', d.plan.mode === 'first start' && !d.applied && !w.store.size, d);
  const noHold = await admin(w, 'recover', { apply: true, plan: d.plan_id }); ok('N1 recover without a hold is refused and writes nothing', noHold.http === 409 && /no hold/.test(noHold.refused) && !w.store.size, noHold);
  const hd = await admin(w, 'hold', { apply: true }), d2 = await admin(w, 'recover'), wrong = await admin(w, 'recover', { apply: true, plan: '0000000000000000' });
  ok('N1 hold writes one record; recover with the wrong plan id is refused', hd.result === 'held' && [...w.store.keys()].join() === W.EARTHVIEW.HOLD && wrong.http === 409 && w.store.size === 1, [hd, wrong.refused]);
  const r = await admin(w, 'recover', { apply: true, plan: d2.plan_id }), p = await ptr(w), hh = await (await w.env.R2.get(W.EARTHVIEW.HELD)).json();
  ok('N1 recover: an empty pointer and list under one new epoch, with its marker; guards pass', r.result === 'recovered' && r.guards_after === 'pass' && p.frame === null && p.epoch === hh.epoch && /^e\d{8}T\d{6}Z-[0-9a-f]{16}$/.test(p.epoch) && w.store.has(W.EARTHVIEW.EPOCHS + p.epoch + '.json') && hh.items.length === 0 && w.unconditional.length === 0, [r, p]);
  const held1 = await run(w, T0); const rel = await admin(w, 'release', { apply: true }), r1 = await run(w, T0 + 10 * MIN);
  ok('N1 still held until released; then the first frame is published', held1 === 'earthview:down collection is held' && rel.result === 'released' && !w.store.has(W.EARTHVIEW.HOLD) && /published/.test(r1), [held1, rel, r1]); }
{ // N2: every dry run writes nothing, whatever is passed; and the admin key is required
  const w = await three(); await admin(w, 'hold', { apply: true }); w.store.delete(W.EARTHVIEW.HELD); const d = await admin(w, 'recover'), before = snap(w), out = [];
  for (const a of ['status', 'hold', 'recover', 'sweep', 'release', 'nonsense']) { const r = await W.default.fetch(new Request(`https://hub.test/admin/earthview/${a}?apply=1&plan=${d.plan_id}`, { headers: AUTH }), w.env, { waitUntil() { } }); out.push(r.status); }
  const noApply = await W.default.fetch(new Request(`https://hub.test/admin/earthview/recover?plan=${d.plan_id}`, { method: 'POST', headers: AUTH }), w.env, { waitUntil() { } });
  ok('N2 GET with apply=1 and the right plan id, and POST without apply=1: nothing is written by any action', !changedSince(w, before, () => false).length && noApply.status === 200 && !(await noApply.json()).applied, [out, changedSince(w, before, () => false)]);
  const nk = await W.default.fetch(new Request(`https://hub.test/admin/earthview/recover?apply=1&plan=${d.plan_id}`, { method: 'POST' }), w.env, { waitUntil() { } }), bad = await W.default.fetch(new Request(`https://hub.test/admin/earthview/release?apply=1`, { method: 'POST', headers: { Authorization: 'Bearer nope' } }), w.env, { waitUntil() { } });
  ok('N2 without the admin key: 403 and nothing written', nk.status === 403 && bad.status === 403 && !changedSince(w, before, () => false).length, [nk.status, bad.status]); }
{ // N3: the list is lost. Recovery keeps current and previous under NEW keys, adopts every other picture out of role, deletes nothing.
  const w = await three(), before = await ptr(w), oldKeys = frames(w); w.store.delete(W.EARTHVIEW.HELD);
  const { d, r } = await recover(w), p = await ptr(w), h = await held(w);
  ok('N3 the plan keeps current and previous and says so before anything is written', d.plan.mode === 'recovery' && d.plan.keep.map(k => k.role).join() === 'current,previous' && d.plan.not_kept.length === 0, d.plan);
  ok('N3 recovered: same two frames, new ids and keys under a new epoch, bytes unchanged', r.result === 'recovered' && r.guards_after === 'pass' && p.epoch !== before.epoch && p.frame.source_frame_time === before.frame.source_frame_time && p.previous.source_frame_time === before.previous.source_frame_time && p.frame.picture.sha256 === before.frame.picture.sha256 && p.frame.id !== before.frame.id && p.frame.recovered_from === before.frame.id && !oldKeys.includes(p.frame.picture.key) && !oldKeys.includes(p.previous.picture.key), [r, p.frame.id]);
  ok('N3 nothing was deleted; the three old pictures are on the new list, out of role, their grace period starting now', !w.deletes.length && oldKeys.every(k => w.store.has(k)) && h.length === 5 && oldKeys.every(k => h.some(x => x.key === k && x.left_at && x.recovered)) && w.unconditional.length === 0, [w.deletes, h.map(x => [x.key.slice(-50, -12), x.left_at])]);
  await soundR(w, 'N3');
  const oldPic = await route(w, before.frame.picture.path); ok('N3 a reader still showing the old address can reload it during the grace period', oldPic.status === 200 && sha(Buffer.from(await oldPic.arrayBuffer())) === before.frame.picture.sha256, oldPic.status);
  const rel = await release(w); w.latest = '2026-11-19T11:30:00Z'; const r2 = await run(w, T0 + 60 * MIN), p2 = await ptr(w);
  ok('N3 after release the next frame is published under the new epoch, and the recovered current becomes previous', rel.result === 'released' && /published 2026-11-19T11:30/.test(r2) && p2.epoch === p.epoch && p2.frame.picture.key.startsWith('earthview/frames/' + p.epoch + '/') && /-g3-/.test(p2.frame.id) && p2.previous.id === p.frame.id, [rel, r2, p2.frame.id]); }
// N4: GPT's counterexample 1. K0 and K were previous and current; a consistent copy of pointer and list is saved. Publications move past
// them; a cleanup marks both and is paused just before its first delete. The saved records are put back together (the pictures stored
// since are gone too, so no guard objects). Recovery runs. The paused cleanup then carries out both deletes.
const pendingDeleteWorld = async () => { const w = await world(); await pubs(w, 2); const S = { p: w.store.get(W.EARTHVIEW.POINTER), h: w.store.get(W.EARTHVIEW.HELD) }, saved = await ptr(w), K = saved.frame.picture.key, K0 = saved.previous.picture.key;
  w.latest = '2026-11-19T11:20:00Z'; await run(w, T0 + 20 * MIN); w.latest = '2026-11-19T11:30:00Z'; await run(w, T0 + 30 * MIN);
  const restore = () => { w.store.set(W.EARTHVIEW.POINTER, S.p); w.store.set(W.EARTHVIEW.HELD, S.h); for (const k of frames(w)) if (k !== K && k !== K0) w.store.delete(k); };
  return { w, saved, K, K0, restore, later: T0 + 30 * 60 * MIN }; };
{ const { w, saved, K, K0, restore, later } = await pendingDeleteWorld(); let rec = null, guardsBefore = null, rel = null;
  w.once.push({ op: 'delete', key: 'picture.jpg', fn: async () => { restore(); guardsBefore = (await admin(w, 'status')).seen.guards; rec = await recover(w); rel = await release(w); } });
  const b = await bRun(w, later, '2026-11-19T11:40:00Z'), p = await soundR(w, 'N4 after the old deletes resumed');
  ok('N4 set-up: the restore passes every guard (it is not detected), and recovery keeps both frames', guardsBefore === 'pass' && rec.r.result === 'recovered' && rec.d.plan.keep.length === 2 && rel.result === 'released', [guardsBefore, rec && rec.r, rel]);
  ok('N4 the paused cleanup then deleted both restored keys', /published/.test(b) && w.deletes.includes(K) && w.deletes.includes(K0) && !w.store.has(K) && !w.store.has(K0), [b, w.deletes]);
  ok('N4 the recovered current and previous are the saved frames, under keys the old deletes could not reach, and both are still served', p.frame.source_frame_time === saved.frame.source_frame_time && p.previous.source_frame_time === saved.previous.source_frame_time && p.frame.picture.key !== K && p.previous.picture.key !== K0 && await served(w, p.frame) === true && await served(w, p.previous) === true, [p.frame.picture.key, p.previous.picture.key]);
  ok('N4 the old cleanup could not write the recovered list', /cleanup stopped: storage changed during the run/.test(lastNote(w)) && (await (await w.env.R2.get(W.EARTHVIEW.HELD)).json()).epoch === p.epoch, lastNote(w));
  w.latest = '2026-11-19T11:40:00Z'; const r = await run(w, later + 10 * MIN); await soundR(w, 'N4 after the next publication'); ok('N4 the next run publishes normally', /published 2026-11-19T11:40/.test(r), r); }
{ // N5a: a kept picture disappears between the dry run and the apply (an old delete lands): the apply refuses; nothing is installed
  const { w, K, restore } = await pendingDeleteWorld(); restore(); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'), before = snap(w); w.store.delete(K);
  const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }); before.delete(K);
  ok('N5a the current picture deleted after the dry run: the apply is refused and writes nothing', r.http === 409 && /plan id/.test(r.refused) && !changedSince(w, before, () => false).length, [r.refused, changedSince(w, before, () => false)]);
  const d2 = await admin(w, 'recover'), r2 = await admin(w, 'recover', { apply: true, plan: d2.plan_id }), p = await ptr(w);
  ok('N5a the new dry run says the current picture is missing; recovery then keeps the previous one as the newest it can verify', d2.plan.not_kept.length === 1 && d2.plan.not_kept[0].role === 'current' && d2.plan.not_kept[0].why === 'missing' && r2.result === 'recovered' && p.frame.source_frame_time === '2026-11-19T11:00:00Z' && p.previous === null && await served(w, p.frame) === true, [d2.plan.not_kept, r2.result]); }
{ // N5b: the old delete lands DURING the apply, after the pictures were read and verified: the copies are written from memory
  const { w, saved, K, K0, restore } = await pendingDeleteWorld(); restore(); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover');
  w.once.push({ op: 'put', key: '.json', fn: async () => { w.store.delete(K); w.store.delete(K0); } });   // at R2 (the marker): both originals vanish
  const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }), p = await soundR(w, 'N5b');
  ok('N5b both originals deleted during the apply: recovery completes from the verified bytes and both frames are served', r.result === 'recovered' && p.frame.source_frame_time === saved.frame.source_frame_time && await served(w, p.frame) === true && await served(w, p.previous) === true && !w.store.has(K), [r.result, r.steps]); }
{ // N6: recovery fails before the pointer is installed. Nothing live has changed; it is run again, whole.
  const w = await three(), before0 = await ptr(w); w.store.delete(W.EARTHVIEW.HELD); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'), before = snap(w);
  w.putFail = 'current.json'; const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }); w.putFail = null; const ch = changedSince(w, before, () => false), st = await admin(w, 'status');
  ok('N6 a failure at the pointer write: the pointer is untouched, the list is still missing, the only new objects are the marker and two unlisted copies', r.http === 500 && (await ptr(w)).frame.id === before0.frame.id && !w.store.has(W.EARTHVIEW.HELD) && ch.length === 3 && ch.filter(k => /^earthview\/epochs\//.test(k)).length === 1 && ch.filter(k => /picture\.jpg$/.test(k)).length === 2, [r, ch]);
  ok('N6 the guards still say repair, and a run is still held', /^storage record needs repair/.test(st.seen.guards) && await run(w, T0 + 60 * MIN) === 'earthview:down collection is held', st.seen.guards);
  const d2 = await admin(w, 'recover'), r2 = await admin(w, 'recover', { apply: true, plan: d2.plan_id }), h = await held(w); await soundR(w, 'N6 second attempt');
  ok('N6 recovery run again: complete; the first attempt\'s copies are adopted out of role; nothing was deleted', d2.plan_id !== d.plan_id && r2.result === 'recovered' && r2.guards_after === 'pass' && h.length === 7 && h.filter(x => x.left_at === null).length === 2 && !w.deletes.length, [r2.result, h.length]); }
{ // N6b: the list write fails after the pointer was installed: the records disagree; every run stays stopped; recovery is run again
  const w = await three(); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'), oldEpoch = (await ptr(w)).epoch; w.putFail = 'held.json';
  const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }); w.putFail = null; const p = await ptr(w), st = await admin(w, 'status');
  ok('N6b after a failed list write: the pointer is recovery\'s (new keys, served), the list is still the old epoch\'s, the guards say the epochs differ', r.http === 500 && p.epoch !== oldEpoch && await served(w, p.frame) === true && st.seen.list_epoch === oldEpoch && /epochs differ/.test(st.seen.guards), [r, st.seen]);
  const relTry = await admin(w, 'release', { apply: true }); ok('N6b release is refused in that state', relTry.http === 409 && /guards/.test(relTry.refused) && w.store.has(W.EARTHVIEW.HOLD), relTry);
  const { r: r2 } = await recover(w); await soundR(w, 'N6b second attempt'); const rel = await release(w); ok('N6b recovery run again, whole: complete, then released', r2.result === 'recovered' && r2.guards_after === 'pass' && rel.result === 'released' && !w.deletes.filter(k => /picture/.test(k)).length, [r2, rel]); }
{ // N7: a stored picture that no longer matches its record is not kept
  const w = await three(), b = await ptr(w); w.store.get(b.frame.picture.key).buf = Buffer.from('not the picture'); const { d, r } = await recover(w), p = await ptr(w);
  ok('N7 an altered current picture: the plan says it differs; recovery keeps only the previous frame, as the newest it can verify', d.plan.not_kept.length === 1 && d.plan.not_kept[0].role === 'current' && /differs/.test(d.plan.not_kept[0].why) && r.result === 'recovered' && p.frame.source_frame_time === b.previous.source_frame_time && p.previous === null && await served(w, p.frame) === true, [d.plan.not_kept, r]);
  const w2 = await three(), b2 = await ptr(w2); w2.store.delete(b2.frame.picture.key); w2.store.delete(b2.previous.picture.key); const x = await recover(w2), p2 = await ptr(w2);
  ok('N7 both pictures gone: recovery installs an empty pointer and says which were not kept', x.r.result === 'recovered' && p2.frame === null && p2.previous === null && x.r.not_kept.length === 2, x.r); }
{ // N8: the apply acts only on what the dry run saw
  const w = await three(); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'); w.store.set('earthview/frames/e20200101T000000Z-0000000000000000/x/picture.jpg', { buf: Buffer.from('x'), opts: {}, etag: 'x' }); const before = snap(w);
  const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }); ok('N8 storage changed since the dry run: refused, nothing written', r.http === 409 && !changedSince(w, before, () => false).length, r.refused); }
{ // N9: sweep and release
  const w = await three(); const notHeld = await admin(w, 'release', { apply: true }); ok('N9 release when not held: refused', notHeld.http === 409 && /not held/.test(notHeld.refused), notHeld);
  await recover(w); const stray = 'earthview/frames/e20200101T000000Z-0000000000000000/20261119T1150Z-0123456789abcdef-g9-' + 'ab'.repeat(12) + '/picture.jpg'; w.store.set(stray, { buf: Buffer.from('late'), opts: {}, etag: 'l' });
  const st = await admin(w, 'status'), rel0 = await admin(w, 'release', { apply: true });
  ok('N9 a picture stored under an old epoch after recovery: the guards do not look there, and release refuses until it is swept', st.seen.guards === 'pass' && st.seen.unlisted_objects === 1 && rel0.http === 409 && /sweep first/.test(rel0.refused) && w.store.has(W.EARTHVIEW.HOLD), [st.seen, rel0]);
  const sd = await admin(w, 'sweep'), bad = await admin(w, 'sweep', { apply: true, plan: 'ffffffffffffffff' }), sa = await admin(w, 'sweep', { apply: true, plan: sd.plan_id }), h = await held(w);
  ok('N9 sweep: the dry run names it, a wrong plan id is refused, the apply lists it out of role; nothing deleted', sd.plan.add.join() === stray && !sd.applied && bad.http === 409 && sa.result === 'added 1' && h.some(x => x.key === stray && x.left_at && x.swept) && w.store.has(stray), [sd.plan, bad.refused, sa]);
  const again = await admin(w, 'sweep'), rel = await admin(w, 'release', { apply: true }); ok('N9 a second sweep finds nothing; release now passes and removes only the hold', again.plan.add.length === 0 && rel.result === 'released' && !w.store.has(W.EARTHVIEW.HOLD) && w.deletes.join() === W.EARTHVIEW.HOLD, [again.plan, rel, w.deletes]); }

// ===== O. earlier runs against a recovery: after it, and BETWEEN its writes (GPT's review, point 3)
// oldRun starts a run that will stop at a pause point; recovery (or part of it) happens; the run is let go.
const twoWorld = async () => pubs(await world(), 2);
const startOld = async (w, g, hook, how = 'job') => { w.once.push(hook); w.latest = '2026-11-19T11:20:00Z'; use(w); setNow(T0 + 20 * MIN);
  const pr = how === 'job' ? W.collectEarthView(w.env, T0 + 20 * MIN) : how === 'scheduled' ? W.JOBS.five(w.env, Date.UTC(2026, 10, 19, 11, 44, 0)) : runRoute(w).then(r => r.json()).then(j => j.result);
  await g.reached; return { pr }; };   // wrapped: returning the promise itself from an async function would wait for the run
for (const how of ['job', 'scheduled', 'manual route']) { // O1: paused before it takes a number; recovery completes; it resumes
  const w = await twoWorld(), g = gate(), { pr: pa } = await startOld(w, g, g.hook('get', 'held.json', 2), how); if (how === 'scheduled') setNow(Date.UTC(2026, 10, 19, 11, 44, 0));
  const { r } = await recover(w), after = snap(w); g.open(); const a = await pa;
  ok(`O1 (${how}) a run paused before taking its number, resumed after recovery: stops, and writes nothing to the pointer, the list or the pictures`, r.result === 'recovered' && /earthview:down storage changed during the run/.test(a) && !changedSince(w, after).length, [a, changedSince(w, after)]); }
{ // O2: paused before its picture write
  const w = await twoWorld(), g = gate(), { pr: pa } = await startOld(w, g, g.hook('put', 'picture.jpg')), oldEpoch = (await ptr(w)).epoch; const { r } = await recover(w), after = snap(w); g.open(); const a = await pa, ch = changedSince(w, after), p = await soundR(w, 'O2');
  ok('O2 a run paused before its picture write, resumed after recovery: its picture lands under the OLD epoch, unlisted; it stops at its claim; pointer and list are recovery\'s', r.result === 'recovered' && /storage changed during the run/.test(a) && ch.length === 1 && ch[0].startsWith('earthview/frames/' + oldEpoch + '/') && p.frame.source_frame_time === '2026-11-19T11:10:00Z', [a, ch]);
  const st = await admin(w, 'status'), rel = await release(w), h = await held(w); ok('O2 the guards pass (they do not look under old epochs); the sweep adopts the late picture out of role; release passes', st.seen.guards === 'pass' && st.seen.unlisted_objects === 1 && rel.result === 'released' && h.some(x => x.key === ch[0] && x.left_at && x.swept), [st.seen, rel]); }
{ // O3: paused before its pointer write (number taken, picture stored, claimed)
  const w = await twoWorld(), g = gate(), { pr: pa } = await startOld(w, g, g.hook('put', 'current.json')); const { r } = await recover(w), after = snap(w); g.open(); const a = await pa, p = await soundR(w, 'O3'), h = await held(w);
  ok('O3 a run paused before its pointer write, resumed after recovery: it cannot publish; its stored picture was adopted out of role by recovery', r.result === 'recovered' && /storage changed during the run/.test(a) && !changedSince(w, after).length && p.frame.source_frame_time === '2026-11-19T11:10:00Z' && h.filter(x => x.left_at).length === 3, [a, h.length]); }
{ // O4: BEFORE R4. An earlier run publishes while recovery is between its copies and its pointer write: legitimate; recovery must not install over it
  const w = await twoWorld(), gA = gate(), gR = gate(), { pr: pa } = await startOld(w, gA, gA.hook('put', 'current.json')); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover');
  w.once.push(gR.hook('put', 'current.json')); const prm = admin(w, 'recover', { apply: true, plan: d.plan_id }); await gR.reached;   // recovery stands at R4, its copies written
  gA.open(); const a = await pa; gR.open(); const r = await prm, p = await ptr(w);
  ok('O4 an earlier run publishes between recovery\'s copies and its pointer write: recovery refuses; the pointer and list are the earlier run\'s, untouched', /published 2026-11-19T11:20/.test(a) && r.http === 409 && /pointer changed during recovery/.test(r.refused) && p.frame.source_frame_time === '2026-11-19T11:20:00Z' && (await (await w.env.R2.get(W.EARTHVIEW.HELD)).json()).epoch === p.epoch, [a, r.refused]);
  const d2 = await admin(w, 'recover'), r2 = await admin(w, 'recover', { apply: true, plan: d2.plan_id }), p2 = await soundR(w, 'O4 second attempt');
  ok('O4 recovery read again and applied: keeps the frame that run published', r2.result === 'recovered' && p2.frame.source_frame_time === '2026-11-19T11:20:00Z' && p2.previous.source_frame_time === '2026-11-19T11:10:00Z', r2); }
{ // O5: BETWEEN R4 AND R5 (pointer new, list old). An earlier run that had claimed tries to publish.
  const w = await twoWorld(), gA = gate(), gR = gate(), { pr: pa } = await startOld(w, gA, gA.hook('put', 'current.json')); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover');
  w.once.push(gR.hook('put', 'held.json')); const prm = admin(w, 'recover', { apply: true, plan: d.plan_id }); await gR.reached;   // recovery stands at R5: pointer installed, list not yet
  const mid = await ptr(w), midList = await (await w.env.R2.get(W.EARTHVIEW.HELD)).json(); gA.open(); const a = await pa, afterA = await ptr(w); gR.open(); const r = await prm, p = await soundR(w, 'O5');
  ok('O5 in the gap the pointer already carries the new epoch and the list the old one', mid.epoch !== midList.epoch && mid.frame.source_frame_time === '2026-11-19T11:10:00Z', [mid.epoch, midList.epoch]);
  ok('O5 an earlier run resumed in that gap cannot publish: the pointer write is the fence', /storage changed during the run/.test(a) && afterA.frame.id === mid.frame.id && r.result === 'recovered' && r.guards_after === 'pass' && p.frame.id === mid.frame.id, [a, r]); }
{ // O6: BETWEEN R4 AND R5. An earlier run that had NOT yet taken a number: the old list still accepts it; it is stopped at the pointer.
  const w = await twoWorld(), gA = gate(), gR = gate(), { pr: pa } = await startOld(w, gA, gA.hook('get', 'held.json', 2)), oldEpoch = (await ptr(w)).epoch; await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover');
  w.once.push(gR.hook('put', 'held.json')); const prm = admin(w, 'recover', { apply: true, plan: d.plan_id }); await gR.reached; const mid = await ptr(w);
  gA.open(); const a = await pa; const stray = frames(w).filter(k => /T1120Z/.test(k)); gR.open(); const r = await prm, p = await soundR(w, 'O6'), hh = await (await w.env.R2.get(W.EARTHVIEW.HELD)).json();
  ok('O6 it took a number and stored a picture under the old epoch, then was stopped at the pointer', /storage changed during the run/.test(a) && stray.length === 1 && stray[0].startsWith('earthview/frames/' + oldEpoch + '/') && p.frame.id === mid.frame.id, [a, stray]);
  ok('O6 recovery\'s list write met the changed list, read again and installed its own list; the late picture is unlisted until the sweep', r.result === 'recovered' && hh.epoch === p.epoch && w.conflicts > 0 && !hh.items.some(x => x.key === stray[0]) && r.guards_after === 'pass', [r, w.conflicts]);
  const rel = await release(w); ok('O6 sweep adopts it; release passes', rel.result === 'released' && (await held(w)).some(x => x.key === stray[0] && x.swept), rel); }
{ // O7: BETWEEN R4 AND R5. An earlier cleanup paused just before its delete resumes in the gap.
  const { w, cand, later } = await raceWorld(), gA = gate(), gR = gate(); w.once.push(gA.hook('delete', 'picture.jpg')); const pb = bRun(w, later, '2026-11-19T11:20:00Z'); await gA.reached;
  await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'); w.once.push(gR.hook('put', 'held.json')); const prm = admin(w, 'recover', { apply: true, plan: d.plan_id }); await gR.reached; const mid = await ptr(w);
  gA.open(); const b = await pb; gR.open(); const r = await prm, p = await soundR(w, 'O7');
  ok('O7 the old cleanup deleted only the key it had marked; the recovered pictures are untouched and served', /published/.test(b) && w.deletes.filter(k => /picture/.test(k)).join() === cand && r.result === 'recovered' && p.frame.id === mid.frame.id && p.frame.source_frame_time === '2026-11-19T11:20:00Z', [b, w.deletes, r]);
  const rel = await release(w); w.latest = '2026-11-19T11:30:00Z'; const n = await run(w, later + 10 * MIN); ok('O7 released; the next run publishes (the adopted entry whose picture the old delete removed is not a finding)', rel.result === 'released' && /published 2026-11-19T11:30/.test(n), [rel, n]); }
{ // O8: an earlier cleanup paused before its FIRST pointer read resumes after the pointer was re-stamped: it marks nothing and deletes nothing
  const { w, cand, later } = await raceWorld(), gA = gate(), gR = gate(); w.once.push(gA.hook('get', 'current.json', 3)); const pb = bRun(w, later, '2026-11-19T11:20:00Z'); await gA.reached;
  await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'); w.once.push(gR.hook('put', 'held.json')); const prm = admin(w, 'recover', { apply: true, plan: d.plan_id }); await gR.reached; const listBefore = sha(w.store.get(W.EARTHVIEW.HELD).buf);
  gA.open(); const b = await pb; const listAfter = sha(w.store.get(W.EARTHVIEW.HELD).buf); gR.open(); const r = await prm; await soundR(w, 'O8');
  ok('O8 the old cleanup stops at its pointer read: no mark, no delete, the list untouched by it; its own publication (made before) stands in the run log', /published/.test(b) && /cleanup stopped: storage changed during the run/.test(w.runs.find(x => /frame 2026-11-19T11:20/.test(x.note)).note) && listBefore === listAfter && !w.deletes.filter(k => /picture/.test(k)).length && w.store.has(cand) && r.result === 'recovered', [b, w.deletes]); }
{ // O9: recovery's inventory is taken AFTER its pointer write, so a picture an earlier run finished storing just before the fence is adopted by recovery itself
  const w = await twoWorld(); await admin(w, 'hold', { apply: true }); const d = await admin(w, 'recover'), late = 'earthview/frames/' + (await ptr(w)).epoch + '/20261119T1120Z-0123456789abcdef-g3-' + 'cd'.repeat(12) + '/picture.jpg';
  w.once.push({ op: 'put', key: 'current.json', fn: async () => { w.store.set(late, { buf: Buffer.from('late'), opts: {}, etag: 'l' }); } });
  const r = await admin(w, 'recover', { apply: true, plan: d.plan_id }), h = await held(w), sw = await admin(w, 'sweep');
  ok('O9 a picture stored between recovery\'s read and its pointer write is on recovery\'s list, out of role; the sweep has nothing to add', r.result === 'recovered' && h.some(x => x.key === late && x.left_at) && sw.plan.add.length === 0, [r.result, sw.plan]); }

// ===== P. restores, and what key uniqueness rests on
{ // P1: the list is put back to an earlier version and the picture stored since is gone, so the counter issues a number a retired key had. The key is still new.
  const w = await world(); await run(w, T0); const S = { p: w.store.get(W.EARTHVIEW.POINTER), h: w.store.get(W.EARTHVIEW.HELD) };
  w.latest = '2026-11-19T11:10:00Z'; w.putFail = 'current.json'; await run(w, T0 + 10 * MIN); w.putFail = null; const X = frames(w).find(k => /T1110Z/.test(k));
  w.store.set(W.EARTHVIEW.POINTER, S.p); w.store.set(W.EARTHVIEW.HELD, S.h); w.store.delete(X);
  const r = await run(w, T0 + 20 * MIN), p = await ptr(w), pics = w.puts.filter(k => /picture\.jpg$/.test(k));
  ok('P1 set-up: the restore is not detected, and the same frame, bytes and number come round again', /published 2026-11-19T11:10/.test(r) && /-g2-/.test(X) && /-g2-/.test(p.frame.id), [r, X, p.frame.id]);
  ok('P1 the new key is not the retired key; no key was ever written twice', p.frame.picture.key !== X && !w.store.has(X) && new Set(pics).size === pics.length, pics); }
{ // P2: a restore of pointer and list together, with a picture stored since still there: the inventory finds it
  const w = await world(); await run(w, T0); const S = { p: w.store.get(W.EARTHVIEW.POINTER), h: w.store.get(W.EARTHVIEW.HELD) }; w.latest = '2026-11-19T11:10:00Z'; await run(w, T0 + 10 * MIN);
  w.store.set(W.EARTHVIEW.POINTER, S.p); w.store.set(W.EARTHVIEW.HELD, S.h); await stops('P2 pointer and list restored together, a later picture still stored', w, 'storage record needs repair', /1 stored picture\(s\) not on the list/); }
{ // P3: the list alone put back
  const w = await world(); await run(w, T0); const S = w.store.get(W.EARTHVIEW.HELD); w.latest = '2026-11-19T11:10:00Z'; await run(w, T0 + 10 * MIN); w.store.set(W.EARTHVIEW.HELD, S);
  await stops('P3 the list alone restored to an earlier version', w, 'storage record needs repair', /current picture is not on the list/); }
{ // P4: THE STATED LIMIT. An undetected restore of an older pointer whose pictures have deletes pending, and NO recovery before the deletes land.
  const { w, K, K0, restore, later } = await pendingDeleteWorld(); w.once.push({ op: 'delete', key: 'picture.jpg', fn: async () => { restore(); } });
  await bRun(w, later, '2026-11-19T11:40:00Z'); const p = await ptr(w), cur = await route(w, p.frame.picture.path);
  ok('P4 the restored pointer names pictures the pending deletes then removed: the address answers 503 "missing", never another picture', !w.store.has(K) && !w.store.has(K0) && cur.status === 503 && (await cur.json()).reason === 'missing', cur.status);
  await stops('P4 the next run', w, 'storage record needs repair', /listed picture\(s\) not stored/, later + 10 * MIN);
  const { d, r } = await recover(w), rel = await release(w); w.latest = '2026-11-19T11:40:00Z'; const n = await run(w, later + 20 * MIN);
  ok('P4 recovery says neither picture can be kept, installs an empty pointer, and the next run publishes', d.plan.not_kept.length === 2 && r.result === 'recovered' && rel.result === 'released' && /published 2026-11-19T11:40/.test(n), [d.plan.not_kept, n]); await soundR(w, 'P4 after'); }
// ===== V. 0.6.22: validation counting and the run-end line (each case on a fresh copy of the file, so the isolate's counters start at zero)
{ const setUp = async (X, w) => { use(w); const f = (a, q, m) => X.default.fetch(new Request(`https://hub.test/admin/earthview/${a}${q}`, { method: m, headers: AUTH }), w.env, { waitUntil() { } }).then(r => r.json());
    await f('hold', '?apply=1', 'POST'); const d = await f('recover', '', 'GET'); const r = await f('recover', '?apply=1&plan=' + d.plan_id, 'POST'), rel = await f('release', '?apply=1', 'POST'); if (r.result !== 'recovered' || rel.result !== 'released') throw new Error('V set-up failed'); };
  const manual = async (X, w, ms) => { use(w); setNow(ms); const n = EVLOG.length, r = await X.JOBS.earthview(w.env, ms, true, X.evbSeen('fetch')); return { r, lines: EVLOG.slice(n) }; };
  { const X = await fresh(), w = world0(); await setUp(X, w);
    const a = await manual(X, w, T0);
    ok('V1 a run that validates and publishes: run-start then run-end with the same exec; validations_before 0 (none completed in this isolate), validated true', /published/.test(a.r) && a.lines.length === 2 && a.lines[0].earthview === 'run-start' && a.lines[1].earthview === 'run-end' && a.lines[0].exec === a.lines[1].exec && a.lines[1].validations_before === 0 && a.lines[1].validated === true && a.lines[1].result === a.r && X.EVB.validations === 1, [a, X.EVB.validations]);
    const b = await manual(X, w, T0 + 10 * MIN);
    ok('V2 nothing newer listed: the run never starts a validation, so validations_before and validated are null and the count does not move', /nothing newer/.test(b.r) && b.lines[1].validations_before === null && b.lines[1].validated === null && X.EVB.validations === 1, [b, X.EVB.validations]);
    w.latest = '2026-11-19T11:10:00Z'; w.pic = { body: DAMAGED['five of ten scans, then an end marker'], type: 'image/jpeg' };
    const c = await manual(X, w, T0 + 20 * MIN); w.pic = null;
    ok('V3 a REFUSED validation is a completed validation: validated false, validations_before 1, and the count moves to 2', /picture failed validation/.test(c.r) && c.lines[1].validations_before === 1 && c.lines[1].validated === false && X.EVB.validations === 2, [c, X.EVB.validations]);
    w.chk = { body: mkPng(discOf(0.2)), type: 'image/png' };
    const d = await manual(X, w, T0 + 30 * MIN); w.chk = null;
    ok('V4 a refusal at the comparison (the last validation step) counts too: validations_before 2, count 3', /failed validation/.test(d.r) && d.lines[1].validations_before === 2 && d.lines[1].validated === false && X.EVB.validations === 3, [d, X.EVB.validations]);
    const e = await manual(X, w, T0 + 40 * MIN);
    ok('V5 the next good run reports the three earlier validations, passes and refusals alike', /published/.test(e.r) && e.lines[1].validations_before === 3 && e.lines[1].validated === true && X.EVB.validations === 4, [e, X.EVB.validations]);
    w.warn = null; w.latest = '2026-11-19T11:20:00Z'; const f = await manual(X, w, T0 + 50 * MIN); w.warn = 'echo';
    ok('V6 a run stopped BEFORE validation (no served-time header) does not count as a validation', /served time not confirmed/.test(f.r) && f.lines[1].validations_before === null && X.EVB.validations === 4, [f, X.EVB.validations]); }
  // the snapshot is taken immediately before the run's own validation, not when the run starts
  { const X = await fresh(), w1 = world0(), w2 = world0(); await setUp(X, w1); await setUp(X, w2);
    let release; const gate = new Promise(r => { release = r; }); const f1 = w1.fetch;
    const held = async (url, init) => { const r = await f1(url, init); if (/image\/png/.test(String(url))) await gate; return r; };   // run 1 waits with its check image in hand
    setNow(T0); const n = EVLOG.length; globalThis.fetch = held; const p1 = X.JOBS.earthview(w1.env, T0, true, X.evbSeen('fetch'));
    await new Promise(r => setTimeout(r, 400));
    ok('V7 run 1 has started (run-start written) and is waiting before its validation; nothing has been validated yet', EVLOG.slice(n).filter(l => l.earthview === 'run-start').length === 1 && X.EVB.validations === 0, [EVLOG.slice(n).length, X.EVB.validations]);
    use(w2); const r2 = await X.JOBS.earthview(w2.env, T0, true, X.evbSeen('fetch'));
    ok('V7 meanwhile run 2, in the same isolate, validates and publishes', /published/.test(r2) && X.EVB.validations === 1, [r2, X.EVB.validations]);
    release(); const r1 = await p1; const ends = EVLOG.slice(n).filter(l => l.earthview === 'run-end');
    ok('V8 run 1 then validates: its validations_before is 1, the count at the moment its own validation began, not the 0 of when it started', /published/.test(r1) && ends.length === 2 && ends[0].validations_before === 0 && ends[1].validations_before === 1 && X.EVB.validations === 2, [ends, X.EVB.validations]); }
  // a validation that has BEGUN but not finished is not a completed one
  { const X = await fresh(), w1 = world0(), w2 = world0(); await setUp(X, w1); await setUp(X, w2);
    const RealDS = globalThis.DecompressionStream; let gateDS = null, release;
    globalThis.DecompressionStream = class { constructor(f) { const ds = new RealDS(f), g = gateDS; this.writable = ds.writable; this.readable = g ? ds.readable.pipeThrough(new TransformStream({ async start() { await g; } })) : ds.readable; } };
    try { gateDS = new Promise(r => { release = r; }); use(w1); setNow(T0); const n = EVLOG.length, p1 = X.JOBS.earthview(w1.env, T0, true, X.evbSeen('fetch'));
      await new Promise(r => setTimeout(r, 500)); gateDS = null;   // run 1 is now inside its validation, waiting on the check image's inflate
      ok('V11 run 1 is inside its validation (both images fetched, nothing stored yet) and the completed count is still 0', w1.reqs.length === 3 && !w1.puts.some(k => /picture\.jpg$/.test(k)) && X.EVB.validations === 0, [w1.reqs.length, w1.puts, X.EVB.validations]);
      use(w2); const r2 = await X.JOBS.earthview(w2.env, T0, true, X.evbSeen('fetch')); const e2 = EVLOG.slice(n).filter(l => l.earthview === 'run-end')[0];
      ok('V11 run 2 validates meanwhile: its validations_before is 0, because run 1 has begun a validation but not completed it', /published/.test(r2) && e2.validations_before === 0 && X.EVB.validations === 1, [r2, e2, X.EVB.validations]);
      release(); const r1 = await p1, e1 = EVLOG.slice(n).filter(l => l.earthview === 'run-end')[1];
      ok('V12 run 1 completes: its own validations_before stays the 0 it recorded when it began, and the count is now 2', /published/.test(r1) && e1.validations_before === 0 && e1.validated === true && X.EVB.validations === 2, [r1, e1, X.EVB.validations]);
    } finally { globalThis.DecompressionStream = RealDS; } }
  // a probe validation and a collector validation share the one count
  { const X = await fresh(), wp = world0(); delete wp.env.EARTHVIEW_ENABLED; use(wp); setNow(T0);
    const pr = await (await X.default.fetch(new Request('https://hub.test/admin/probe/earthview', { method: 'POST', headers: AUTH }), wp.env, { waitUntil() { } })).json();
    const w = world0(); await setUp(X, w); const a = await manual(X, w, T0);
    ok('V9 after one Stage B probe validation in this isolate, the collector run reports validations_before 1', pr.outcome === 'validated' && /published/.test(a.r) && a.lines[1].validations_before === 1, [pr.outcome, a.lines[1]]); }
  // collectEarthView called without a run record (as the older sections of this suite do) still works and still counts
  { const X = await fresh(), w = world0(); await setUp(X, w); use(w); setNow(T0); const r = await X.collectEarthView(w.env, T0);
    ok('V10 the collector called with no run record: publishes as before, and the validation is counted', /published/.test(r) && X.EVB.validations === 1, [r, X.EVB.validations]); }
}
console.log(`\nearthview-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
