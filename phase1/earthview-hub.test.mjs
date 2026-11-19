/* Earth from Space: hub collector and routes (EARTH-FROM-SPACE-PROPOSAL rev 2; GPT's review of 19 Nov 2026).
 * The real worker.js runs against a fake R2 (conditional puts, deletes counted), a recording D1, a movable clock and a stubbed
 * EUMETView. Nothing reaches the network; only Node's standard library is used. Fixtures are REAL frames (earthview-fixtures/).
 * Run: node --no-warnings phase1/earthview-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored no-header-ok mismatch-ok check-header-skipped scans-any trailing-ok decode-error-ignored no-compare pointer-on-fail
 *   no-grace delete-idle no-cas overwrite no-readback serve-any generic-down delay-on-failed-check older-over-newer type-any */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import zlib from 'node:zlib'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), FX = path.join(HERE, 'earthview-fixtures');
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const e = env.EARTHVIEW_ENABLED !== '1' ?", 'const e = false ?'],
  'no-header-ok': ["    if (!f.served) return evFail(env, ms, 'served time not confirmed'", "    if (false) return evFail(env, ms, 'served time not confirmed'"],
  'mismatch-ok': ["    if (f.served !== T) return evFail(env, ms, 'served a different frame'", "    if (false) return evFail(env, ms, 'served a different frame'"],
  'check-header-skipped': ["  for (const [what, f] of [['picture', pic], ['check image', chk]]) {\n    if (!f.served)", "  for (const [what, f] of [['picture', pic]]) {\n    if (!f.served)"],
  'scans-any': ["  if (!sc.complete) return evFail(", '  if (false) return evFail('],
  'trailing-ok': ["  if (i !== u8.length) return bad('bytes after the end marker');", ''],
  'decode-error-ignored': ["  if (dec.error) return evFail(env, ms, 'picture failed validation', 200, 'decode: ' + dec.error, T, check);", ''],
  'no-compare': ["  if (!cmp.ok) return evFail(env, ms, 'picture failed validation'", "  if (false) return evFail(env, ms, 'picture failed validation'"],
  'pointer-on-fail': ["  await logRun(env, 'earthview', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));", "  try { await env.R2.put(EARTHVIEW.POINTER, JSON.stringify(evEmpty())); } catch (_) {}\n  await logRun(env, 'earthview', ms, 'down', http || 0, 0, 0, reason + (detail ? ' — ' + detail : ''));"],
  'no-grace': ['nowMs - Date.parse(x.left_at) >= EARTHVIEW.GRACE_S * 1000 &&', 'nowMs - Date.parse(x.left_at) >= 0 &&'],
  'delete-idle': ["    await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, 'nothing newer: '", "    try { const h = await getJson(env, EARTHVIEW.HELD); for (const x of (h && h.items) || []) if (Date.now() - Date.parse(x.published_at) > EARTHVIEW.GRACE_S * 1000) await env.R2.delete(x.key); } catch (_) {}\n    await logRun(env, 'earthview', ms, 'ok', 200, 0, 0, 'nothing newer: '"],
  'no-cas': ["    const r = await env.R2.put(key, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });\n    if (r !== null) return { cur, body, wrote: true };\n  }\n  throw new Error('earthview record kept changing", "    const r = await env.R2.put(key, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' } });\n    if (r !== null) return { cur, body, wrote: true };\n  }\n  throw new Error('earthview record kept changing"],
  'overwrite': ["  if (had === 'differs' || had === 'unreadable') return evFail(env, ms, 'stored copy differs', 200, key, T, check);\n  if (had === 'absent') {\n    try { await env.R2.put(key, pic.buf, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { sha256: pic.sha256, source_frame_time: T }, onlyIf: { etagDoesNotMatch: '*' } });", "  {\n    try { await env.R2.put(key, pic.buf, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { sha256: pic.sha256, source_frame_time: T } });"],
  'no-readback': ["    if (await stored() !== 'same') return evFail(env, ms, 'picture read-back differs', 200, key, T, check);", ''],
  'serve-any': ["  if (buf.byteLength !== x.bytes || (x.sha256 ? sha !== x.sha256 : sha.slice(0, 16) !== p[2].slice(-16))) return none(503, 'integrity');", ''],
  'generic-down': ["    else if (layer === 'earthview') { try { await evFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // never the generic writeDown", ''],
  'delay-on-failed-check': ["{ ok: false, at: checkAt, reason: 'http error', http: r.status }", "{ ok: true, at: checkAt, newest: null }"],
  'older-over-newer': ['c => (c.frame && c.frame.source_frame_time >= T) ? null : { ...evEmpty(), frame, previous: c.frame || null }', 'c => ({ ...evEmpty(), frame, previous: c.frame || null })'],
  'type-any': ["  if (type !== spec.type) return { ok: false, reason: what + ' not a picture', http: 200, detail: type };   // EUMETView answers a bad time with HTTP 200 and XML", ''],
};
let src = fs.readFileSync(process.env.WORKER || path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); } const b = BREAKS[BREAK]; if (!src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); }
const tmp = path.join(os.tmpdir(), `worker-ev-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
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
function world() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, order: [], latest: '2026-11-19T11:00:00Z', capStatus: 200, capBody: null, capThrow: false, capAge: '77', pic: null, chk: null, warn: 'echo', picWarn: undefined, chkWarn: undefined, base: 'day',
    putFail: null, corruptRead: null, onPointerPut: null, brokenResponse: false, deletes: [], puts: [], unconditional: [], conflicts: 0 };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.endsWith(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body.buffer ? body.buffer.slice(body.byteOffset || 0, (body.byteOffset || 0) + body.byteLength) : body);
      if (key === W.EARTHVIEW.POINTER && w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); }
      if (!opts.onlyIf) w.unconditional.push(key);
      if (opts.onlyIf) { const had = store.get(key); const refused = opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches); if (refused) { w.conflicts++; return null; } }
      w.puts.push(key); store.set(key, { buf, opts, etag: etagOf(buf) }); return { key, etag: etagOf(buf) }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.endsWith(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 30] ^= 0xff; }
      return { body: buf, etag: o.etag, customMetadata: o.opts.customMetadata, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; },
    async delete(key) { w.deletes.push(key); store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) { runs.push({ layer: a[0], status: a[3], http: a[4], note: a[7] }); w.order.push('run:' + a[0]); } return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, EARTHVIEW_ENABLED: '1' };
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
const T0 = Date.UTC(2026, 10, 19, 11, 21, 0), MIN = 60000;
const ptr = async w => { const o = await w.env.R2.get(W.EARTHVIEW.POINTER); return o ? o.json() : null; };
const state = async w => { const o = await w.env.R2.get(W.EARTHVIEW.STATE); return o ? o.json() : null; };
const held = async w => { const o = await w.env.R2.get(W.EARTHVIEW.HELD); return o ? (await o.json()).items : []; };
const frames = w => [...w.store.keys()].filter(k => k.startsWith('earthview/frames/')).sort();
const route = (w, p) => W.default.fetch(new Request('https://hub.test' + p), w.env, { waitUntil() { } });
const run = async (w, ms) => { use(w); setNow(ms); return W.JOBS.earthview(w.env, ms); };
const maps = w => w.reqs.filter(u => /GetMap/.test(u));
const tAdd = (t, min) => new Date(Date.parse(t) + min * MIN).toISOString().replace('.000Z', 'Z');

// ===== A. gate and schedule
{ const w = world(); delete w.env.EARTHVIEW_ENABLED; use(w); setNow(T0); const r = await W.JOBS.five(w.env, T0);
  ok('A1 flag unset: the five-minute job makes no EUMETSAT request and writes nothing', /earthview:not scheduled/.test(r) && !w.reqs.length && !w.puts.some(k => /^earthview/.test(k)), [r, w.reqs.length, w.puts]);
  const w2 = world(); use(w2); const at4 = Date.UTC(2026, 10, 19, 11, 24, 0), at5 = Date.UTC(2026, 10, 19, 11, 25, 0);
  setNow(at5); const r5 = await W.JOBS.five(w2.env, at5); ok('A2 flag set, minute 25: skipped (every ten minutes)', /earthview:skipped/.test(r5) && !w2.reqs.length, r5);
  setNow(at4); const r4 = await W.JOBS.five(w2.env, at4); ok('A3 flag set, minute 24: runs, and after the earthquake collector', /earthview:published/.test(r4) && w2.order.indexOf('other') >= 0 && w2.order.indexOf('other') < w2.order.indexOf('eumetsat'), [r4, w2.order.slice(0, 4)]); }
// ===== B. a first frame
const wB = world(); const rB = await run(wB, T0);
{ const p = await ptr(wB), s = await state(wB), h = await held(wB), m = maps(wB), f = p && p.frame;
  ok('B1 published, by its own word', rB === 'earthview:published 2026-11-19T11:00:00Z', rB);
  ok('B2 exactly one capabilities read, one picture and one check image', wB.reqs.length === 3 && m.length === 2, wB.reqs.length);
  const want = 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_geocolour&styles=&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000';
  ok('B3 the picture request is the pinned one, with the explicit frame time', m[0] === want + '&width=2048&height=2048&format=image/jpeg&bgcolor=0x0B1016&time=2026-11-19T11:00:00Z', m[0]);
  ok('B4 the check image request differs only in size, format and transparency', m[1] === want + '&width=256&height=256&format=image/png&transparent=true&time=2026-11-19T11:00:00Z', m[1]);
  ok('B5 the frame records the source frame time, the served time and the whole request', f && f.source_frame_time === '2026-11-19T11:00:00Z' && f.served_time === f.source_frame_time && f.request.crs === 'EPSG:900003' && f.request.crs_definition === '+proj=geos +h=35785831.0 +lon_0=0' && f.request.bbox.join() === '-5500000,-5500000,5500000,5500000' && f.request.bgcolor === '0x0B1016' && f.request.width === 2048 && f.request.time === f.source_frame_time, f && f.request);
  ok('B6 no scan start or end is recorded or implied', f && !/scan_start|scan_end|observ/i.test(JSON.stringify(f)), f && Object.keys(f));
  ok('B7 the checks record a full decode, ten complete scans and the comparison', f && f.checks.decoded === true && f.checks.progressive === true && f.checks.scans === 10 && f.checks.agreement > 0.9 && f.checks.surround_share_background === 1 && f.checks.check_opaque_on_frame_edge === 0, f && f.checks);
  ok('B8 the stored picture is byte for byte what was fetched', frames(wB).length === 1 && sha(wB.store.get(frames(wB)[0]).buf) === f.picture.sha256 && f.id.endsWith(f.picture.sha256.slice(0, 16)), frames(wB));
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
const strict = async (name, set, reason) => { const w = world(); await run(w, T0); const before = await ptr(w), n = frames(w).length; w.latest = '2026-11-19T11:10:00Z'; set(w); const r = await run(w, T0 + 10 * MIN), p = await ptr(w), s = await state(w);
  ok(`E ${name}: nothing published`, r === 'earthview:down ' + reason && p.frame.id === before.frame.id && frames(w).length === n, [r, p.frame.source_frame_time, frames(w).length]);
  ok(`E ${name}: the outcome is recorded against the frame that was asked for, and the source check still stands as successful`, s.collection.outcome === 'failed' && s.collection.reason === reason && s.collection.frame_time === '2026-11-19T11:10:00Z' && s.source_check.ok === true && s.source_check.newest === '2026-11-19T11:10:00Z', s);
  ok(`E ${name}: no requested time appears anywhere as a frame time`, !/11:10/.test(JSON.stringify(p)), null); return w; };
await strict('no Warning header on either response', w => { w.warn = null; }, 'served time not confirmed');
await strict('header on the picture only', w => { w.chkWarn = null; }, 'served time not confirmed');
await strict('header on the check image only', w => { w.picWarn = null; }, 'served time not confirmed');
await strict('header present but naming no time', w => { w.warn = '199 Miscellaneous warning'; }, 'served time not confirmed');
await strict('the picture is a different (older) frame', w => { w.picWarn = '99 Nearest value used: time=2026-11-19T11:00:00.000Z ISO8601 (mtg_fd:rgb_geocolour)'; }, 'served a different frame');
await strict('the check image is a different frame', w => { w.chkWarn = '99 Nearest value used: time=2026-11-19T11:20:00.000Z ISO8601 (mtg_fd:rgb_geocolour)'; }, 'served a different frame');
{ const w = world(); w.warn = null; const r = await run(w, T0), p = await ptr(w);
  ok('E first run with no header: no frame at all, and meta says so', /served time not confirmed/.test(r) && (!p || !p.frame) && !frames(w).length, r);
  const mj = await (await route(w, '/snapshot/earthview/meta')).json(); ok('E meta with nothing verified: frame null, the failed outcome shown', mj.frame === null && mj.collection.reason === 'served time not confirmed', mj.collection); }
// ===== F. responses that are not pictures
const refuse = async (name, set, re, also) => { const w = world(); await run(w, T0); const before = (await ptr(w)).frame.id; w.latest = '2026-11-19T11:10:00Z'; set(w); const r = await run(w, T0 + 10 * MIN), p = await ptr(w);
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
for (const base of ['night', 'dusk']) { const w = world(); w.base = base; const r = await run(w, T0), f = (await ptr(w)).frame; ok(`G a real ${base} frame passes every check`, /published/.test(r) && f.checks.agreement > 0.9, [r, f && f.checks]); }
{ // pure: the structure walk
  const s = W.evJpegScans(RAW['day.jpg']); ok('G walk: a real frame is progressive, 2048 square, ten scans, complete', s.ok && s.progressive && s.w === 2048 && s.h === 2048 && s.scans === 10 && s.complete && s.missing === 0, s);
  const b = W.evJpegScans(new Uint8Array(fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/picture-a.jpg')))); ok('G walk: a baseline JPEG with one full scan counts as complete', b.ok && b.complete, b);
  ok('G walk: not a JPEG', W.evJpegScans(new TextEncoder().encode('<xml/>')).ok === false); }
// ===== H. the source check itself fails
const checkFail = async (name, set) => { const w = world(); await run(w, T0); const before = (await ptr(w)).frame.id; set(w); const r = await run(w, T0 + 10 * MIN), s = await state(w), p = await ptr(w), mj = await (await route(w, '/snapshot/earthview/meta')).json();
  ok(`H ${name}: recorded as a failed CHECK, with no newest frame claimed`, r === 'earthview:down source check failed' && s.source_check.ok === false && !('newest' in s.source_check) && s.collection.outcome === 'failed' && s.collection.frame_time === null, s);
  ok(`H ${name}: the frame is kept and still served; meta carries the failed check`, p.frame.id === before && mj.frame.id === before && mj.source_check.ok === false && maps(w).length === 2, mj.source_check); };
await checkFail('capabilities HTTP 503', w => { w.capStatus = 503; });
await checkFail('capabilities unreachable', w => { w.capThrow = true; });
await checkFail('capabilities without this layer', w => { w.capBody = '<WMS_Capabilities><Layer><Name>mtg_fd:rgb_dust</Name><Dimension name="time" default="2026-11-19T11:10:00Z">x</Dimension></Layer></WMS_Capabilities>'; });
await checkFail('a time off the ten-minute grid', w => { w.capBody = caps('2026-11-19T11:13:00Z'); });
ok('H pure: the newest time is read from this layer only', W.evLatest(caps('2026-11-19T11:00:00Z')) === '2026-11-19T11:00:00Z' && W.evLatest(caps(null)) === null);
// ===== I. order and concurrency
{ const w = world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; const w2env = w.env;
  w.onPointerPut = async () => { // another run publishes 11:20 while this one is about to write 11:10
    const o = await w2env.R2.get(W.EARTHVIEW.POINTER), cur = await o.json(); const f = { ...cur.frame, id: 'x', source_frame_time: '2026-11-19T11:20:00Z' };
    await w2env.R2.put(W.EARTHVIEW.POINTER, JSON.stringify({ ...cur, frame: f, previous: cur.frame }), { onlyIf: { etagMatches: o.etag } }); };
  const r = await run(w, T0 + 10 * MIN), p = await ptr(w), s = await state(w);
  ok('I1 a run that loses the race does not put an older frame over a newer one', r === 'earthview:superseded 2026-11-19T11:10:00Z' && p.frame.source_frame_time === '2026-11-19T11:20:00Z', [r, p.frame.source_frame_time]);
  ok('I2 and says so in the state', s.collection.outcome === 'superseded', s.collection);
  const sBefore = await state(w); use(w); setNow(T0 + 5 * MIN); w.capStatus = 503; await W.collectEarthView(w.env, T0 + 5 * MIN); const sAfter = await state(w);
  ok('I3 a run that STARTED earlier never replaces a later run\'s state', sAfter.run === sBefore.run && sAfter.collection.outcome === 'superseded', sAfter); }
// ===== J. keeping the last good picture: cleanup only after a newer verified frame, with a grace period
{ const w = world(); const pub = async (t, at) => { w.latest = t; w.capStatus = 200; w.warn = 'echo'; return run(w, at); };
  await pub('2026-11-19T11:00:00Z', T0); await pub('2026-11-19T11:10:00Z', T0 + 10 * MIN); await pub('2026-11-19T11:20:00Z', T0 + 20 * MIN);
  let h = await held(w); const id1 = h[0].id, id2 = h[1].id, id3 = h[2].id, key1 = h[0].key;
  ok('J1 three frames: the first has left its role and its grace period started at that publication; nothing deleted', h.length === 3 && h[0].left_at === h[2].published_at && h[0].left_at.startsWith('2026-11-19T11:41:00') && h[1].left_at === null && h[2].left_at === null && !w.deletes.length && frames(w).length === 3, h);
  const r1 = await route(w, `/snapshot/earthview/${id1}/picture.jpg`); ok('J2 a reader still showing the first frame can reload it during the grace period', r1.status === 200 && sha(Buffer.from(await r1.arrayBuffer())).startsWith(id1.slice(-16)), r1.status);
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
  ok('J6 the frame that has only just left its role is kept and its grace period starts now', h.some(x => x.id === id2 && x.left_at === h[h.length - 1].published_at && x.left_at.startsWith('2026-11-21T13:31:00')) && w.store.has(h.find(x => x.id === id2).key), h);
  ok('J7 current and previous are never on the delete list', !w.deletes.includes((await ptr(w)).frame.picture.key) && !w.deletes.includes((await ptr(w)).previous.picture.key));
  const gone = await route(w, `/snapshot/earthview/${id1}/picture.jpg`); ok('J8 a deleted picture answers 404, not another picture', gone.status === 404, gone.status);
  await pub('2026-11-21T13:10:00Z', T0 + 50 * 60 * MIN + 20 * MIN); ok('J9 ten minutes later: nothing more deleted (inside the grace period)', w.deletes.length === 1, w.deletes);
  await pub('2026-11-22T14:00:00Z', T0 + 75 * 60 * MIN); ok('J10 a day later: the next two are deleted, in a publishing run', w.deletes.length === 3 && frames(w).length === 3, [w.deletes.length, frames(w).length]);
  ok('J11 every stored picture is on the held list', (await held(w)).map(x => x.key).sort().join() === frames(w).join(), [frames(w), (await held(w)).map(x => x.key)]); }
// ===== K. failures inside the job, storage faults, serving
{ const w = world(); await run(w, T0); w.latest = '2026-11-19T11:10:00Z'; w.brokenResponse = true; const r = await run(w, T0 + 10 * MIN), s = await state(w);
  ok('K1 an unexpected error inside the job: recorded as internal error, no generic "down" file, frame kept', /earthview:(down internal error|threw)/.test(r) && s.collection.reason === 'internal error' && ![...w.store.keys()].some(k => /^latest/.test(k)) && (await ptr(w)).frame.source_frame_time === '2026-11-19T11:00:00Z', [r, s.collection, [...w.store.keys()]]); }
{ const w = world(); w.putFail = 'picture.jpg'; const r = await run(w, T0); ok('K2 the picture cannot be stored: nothing published', /picture write failed/.test(r) && !(await ptr(w) || {}).frame, r); }
{ const w = world(); w.corruptRead = 'picture.jpg'; const r = await run(w, T0); ok('K3 the stored picture reads back differently: nothing published', /read-back differs/.test(r) && !(await ptr(w) || {}).frame, r); }
{ const w = world(); await run(w, T0); const f = (await ptr(w)).frame; w.corruptRead = 'picture.jpg'; const pr = await route(w, f.picture.path);
  ok('K4 a stored picture that no longer matches is not served', pr.status === 503 && (await pr.json()).reason === 'integrity', pr.status);
  w.corruptRead = null; ok('K5 unknown or malformed picture addresses answer 404', (await route(w, '/snapshot/earthview/20261119T1100Z-0000000000000000/picture.jpg')).status === 404 && (await route(w, '/snapshot/earthview/' + f.id + '/mask.png')).status === 404 && (await route(w, '/snapshot/earthview/..%2f..%2fcurrent.json/picture.jpg')).status === 404); }
{ const w = world(); const key = 'earthview/frames/' + W.evKeyOf('2026-11-19T11:00:00Z') + '-' + sha(jpg(Date.parse('2026-11-19T11:00:00Z') / 6e5)).slice(0, 16) + '/picture.jpg'; await w.env.R2.put(key, Buffer.from('something else'), {});
  const r = await run(w, T0); ok('K6 a different object already at the picture\'s address is never overwritten', /stored copy differs/.test(r) && w.store.get(key).buf.toString() === 'something else', r); }
{ const mj = await (await route(world(), '/snapshot/earthview/meta')).json(); ok('K7 meta before anything exists: empty, not an error, and says collection is off or on', mj.frame === null && mj.previous === null && mj.source_check === null && mj.collecting === true, mj); }
{ const w = world(); const r = await run(w, T0); ok('K8 the Dust collector\'s storage is untouched by this job', ![...w.store.keys()].some(k => /^dustrgb/.test(k)) && /published/.test(r)); }
console.log(`\nearthview-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
