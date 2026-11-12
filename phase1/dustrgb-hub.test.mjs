/* Dust RGB hub job and routes (hub 0.6.11; DUST-RGB-LAYER-PROPOSAL rev 5 §3, §3a, §8).
 * The real worker.js runs against a fake R2 (put/get/head/list/delete, with switchable faults), a recording D1 and a stubbed
 * EUMETView. Nothing here reaches the network.
 * Run: node --no-warnings phase1/dustrgb-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored no-type-check no-readback no-mismatch keep-all move-on-fail any-frame mask-any generic-down refetch-same pointer-early no-timeout */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const u = env.DUSTRGB_ENABLED !== '1' ?", 'const u = false ?'],
  'no-type-check': ["  if (type !== spec.type) return { ok: false, reason: what + ' not an image', http: 200, detail: type };", ''],
  'no-readback': ['    if (!back || back.byteLength !== x.f.bytes || await sha256Bytes(back) !== x.f.sha256) return dustFail', '    if (false) return dustFail'],
  'no-mismatch': ["if (f.served && f.served !== T) return dustFail(env, ms, what + ' served time differs'", "if (false) return dustFail(env, ms, what + ' served time differs'"],
  'keep-all': ['if (!keep.some(d => o.key.startsWith(d))) await env.R2.delete(o.key);', ';'],
  'move-on-fail': ['const body = cur && cur.frame ? { ...cur, last_attempt } :', 'const body = false ? { ...cur, last_attempt } :'],
  'any-frame': ['const fr = [cur.frame, cur.previous].find(f => f && f.id === p[2]);', 'const fr = cur.frame;'],
  'mask-any': ['if (!d || d.w !== spec.w || d.h !== spec.h || !d.alpha || !d.complete)', 'if (!d)'],
  'no-timeout': [", signal: AbortSignal.timeout(DUSTRGB.TIMEOUT_MS) }", ' }'],
  'generic-down': ["    else if (layer === 'dustrgb') { try { await dustFail(env, ms, 'internal error', 0, note); } catch (_) {} }", ''],
  'refetch-same': ['if (cur && cur.frame && cur.frame.requested_time === T) {', 'if (false) {'],
  'pointer-early': ["  const dir = DUSTRGB.PREFIX + dustKeyOf(T) + '/';", "  const dir = DUSTRGB.PREFIX + dustKeyOf(T) + '/';\n  await putJson(env, DUSTRGB.POINTER, { schema: 1, layer: 'dustrgb', frame: { id: dustKeyOf(T), requested_time: T, picture: { file: 'picture.jpg', key: dir + 'picture.jpg' }, mask: { file: 'mask.png', key: dir + 'mask.png' } }, previous: null, last_attempt: null });"],
};
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) { const b = BREAKS[BREAK]; if (!b || !src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); }
const tmp = path.join(os.tmpdir(), `worker-dust-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);

let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');

// ---------- synthetic files (the hub checks signature, dimensions and completeness; it does not decode pixels)
const jpeg = (w, h, salt = 0, tail = true) => Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, salt & 255, (salt >> 8) & 255, 0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, ...(tail ? [0xff, 0xd9] : [0x00, 0x00])]);
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const png = (w, h, colour = 6, salt = 0, iend = true) => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...u32(13), 0x49, 0x48, 0x44, 0x52, ...u32(w), ...u32(h), 8, colour, 0, 0, 0, 0, 0, 0, 0,
  ...u32(2), 0x49, 0x44, 0x41, 0x54, salt & 255, 7, 0, 0, 0, 0, ...(iend ? [...u32(0), 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0] : [])]);
const caps = t => `<WMS_Capabilities><Capability><Layer><Layer queryable="1"><Name>rgb_dust</Name><Title>Dust RGB - MTG-I - 0 degree</Title><Dimension name="time" default="${t}" units="ISO8601">2024-10-22T00:40:00.000Z/${t.replace('Z', '.000Z')}/PT10M</Dimension></Layer></Layer></Capability></WMS_Capabilities>`;

// ---------- fakes
function world() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, latest: '2026-11-12T16:50:00Z', capStatus: 200, capBody: null, pic: null, mask: null, warn: undefined, picWarn: undefined, putFail: null, corruptRead: null, throwFetch: false, throwOn: null, signals: [] };
  const R2 = {
    async put(key, body, opts = {}) { if (w.putFail && key.endsWith(w.putFail)) throw new Error('R2 put failed (test)'); const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body.buffer ? body.buffer.slice(body.byteOffset || 0, (body.byteOffset || 0) + body.byteLength) : body); store.set(key, { buf, opts }); return { key }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.endsWith(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 3] ^= 0xff; }
      return { body: buf, httpEtag: '"x"', customMetadata: o.opts.customMetadata, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, customMetadata: o.opts.customMetadata } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
    async delete(key) { store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], status: a[3], http: a[4], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, DUSTRGB_ENABLED: '1' };
  w.fetch = async (url, init) => { const u = String(url); if (!u.includes('view.eumetsat.int')) throw new Error('unexpected fetch ' + u);
    reqs.push(u); w.signals.push(!!(init && init.signal)); if (w.throwFetch) throw new Error('network down (test)');
    if (w.throwOn && w.throwOn.test(u)) throw new Error('The operation was aborted due to timeout (test)');
    if (/GetCapabilities/.test(u)) return new Response(w.capBody !== null ? w.capBody : caps(w.latest), { status: w.capStatus, headers: { 'content-type': 'text/xml' } });
    const isPic = /image\/jpeg/.test(u); const t = (u.match(/time=([^&]+)/) || [])[1];
    const spec = isPic ? (w.pic || { body: jpeg(2048, 2048, Date.parse(t) / 6e5), type: 'image/jpeg', status: 200 }) : (w.mask || { body: png(160, 160, 6, Date.parse(t) / 6e5), type: 'image/png', status: 200 });
    const h = { 'content-type': spec.type }; const wv = isPic && w.picWarn !== undefined ? w.picWarn : w.warn; if (wv !== undefined) h.warning = wv === 'echo' ? `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_dust)` : wv;
    return new Response(spec.body, { status: spec.status || 200, headers: h }); };
  return w;
}
const realFetch = globalThis.fetch;
const use = w => { globalThis.fetch = w.fetch; };
const at = h => Date.UTC(2026, 10, 12, h, 7, 0);
const pointer = async w => { const o = await w.env.R2.get(W.DUSTRGB.POINTER); return o ? o.json() : null; };
const route = (w, p) => W.default.fetch(new Request('https://hub.test' + p), w.env, { waitUntil() { } });
const imgReqs = w => w.reqs.filter(u => /GetMap/.test(u));

// ---------- pure helpers
ok('dustLatest: reads the layer default time and normalises it', W.dustLatest(caps('2026-11-12T16:50:00Z')) === '2026-11-12T16:50:00Z' && W.dustLatest(caps('2026-11-12T16:50:00.000Z')) === '2026-11-12T16:50:00Z');
ok('dustLatest: refuses an off-grid, malformed or missing time', W.dustLatest(caps('2026-11-12T16:53:00Z')) === null && W.dustLatest(caps('yesterday')) === null && W.dustLatest('<x/>') === null);
ok('dustKeyOf: frame id', W.dustKeyOf('2026-11-12T16:50:00Z') === '20261112T1650Z');
ok('jpegSize / pngInfo: read the synthetic files; reject junk', JSON.stringify(W.jpegSize(jpeg(2048, 2048))) === '{"h":2048,"w":2048}' && W.jpegSize(new Uint8Array([1, 2, 3, 4])) === null && W.pngInfo(png(160, 160)).alpha === true && W.pngInfo(png(160, 160, 2)).alpha === false && W.pngInfo(png(160, 160, 6, 0, false)).complete === false && W.pngInfo(new Uint8Array(60)) === null);
ok('dustServed: reads the time a Warning header names', W.dustServed('99 Nearest value used: time=2026-11-12T16:50:00.000Z ISO8601 (mtg_fd:rgb_dust)') === '2026-11-12T16:50:00Z' && W.dustServed(null) === null);
ok('version is at least 0.6.11', (() => { const v = src.match(/const COLLECTOR_VERSION = '(\d+)\.(\d+)\.(\d+)'/).slice(1).map(Number); return v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 11); })());

// ---------- A. the gate and the schedule (through the real hourly job)
{ const w = world(); use(w); delete w.env.DUSTRGB_ENABLED;
  const r = await W.JOBS.hourly(w.env, at(6), false);
  ok('A gate off at 06:07 UTC: no request to EUMETSAT at all, nothing stored', w.reqs.length === 0 && !(await pointer(w)) && /not scheduled/.test(r.dustrgb), [w.reqs, r.dustrgb]); }
{ const w = world(); use(w);
  const r7 = await W.JOBS.hourly(w.env, at(7), false);
  ok('A gate on at 07:07 UTC: skipped, no request', w.reqs.length === 0 && /skipped/.test(r7.dustrgb), r7.dustrgb);
  const r6 = await W.JOBS.hourly(w.env, at(6), false);
  ok('A gate on at 06:07 UTC: runs and publishes', r6.dustrgb === 'dustrgb:ran' && (await pointer(w)).frame.requested_time === '2026-11-12T16:50:00Z' && w.reqs.length === 3, r6.dustrgb);
  const w2 = world(); use(w2); const r18 = await W.JOBS.hourly(w2.env, at(18), false);
  ok('A gate on at 18:07 UTC: runs', r18.dustrgb === 'dustrgb:ran' && !!(await pointer(w2)).frame, r18.dustrgb); }

// ---------- B. a good run
{ const w = world(); use(w);
  await W.JOBS.dustrgb(w.env, at(6)); const p = await pointer(w), f = p.frame;
  ok('B three upstream requests: the list, one picture, one mask, each image by the exact advertised time', w.reqs.length === 3 && /GetCapabilities/.test(w.reqs[0]) && imgReqs(w).every(u => u.includes('time=2026-11-12T16:50:00Z') && u.includes('bbox=-80,-80,80,80')) && /image\/jpeg&width=2048&height=2048/.test(w.reqs[1]) && /image\/png&transparent=true&width=160&height=160/.test(w.reqs[2]), w.reqs);
  ok('B pointer: frame id, requested time, box, both files with bytes and sha256', f.id === '20261112T1650Z' && f.requested_time === '2026-11-12T16:50:00Z' && f.box.south === -80 && f.box.east === 80 && f.picture.bytes === 29 && f.picture.w === 2048 && f.mask.w === 160 && /^[0-9a-f]{64}$/.test(f.picture.sha256) && /^[0-9a-f]{64}$/.test(f.mask.sha256), f);
  ok('B header absent (as from a real Worker): served_time null, and the basis says "requested time only"', f.served_time === null && f.served_time_source === null && /requested time only/.test(f.time_basis) && f.picture.warning_header_present === false, f);
  ok('B stored files are exactly what was fetched, under keys that name the frame', sha(w.store.get('dustrgb/frames/20261112T1650Z/picture.jpg').buf) === f.picture.sha256 && sha(w.store.get('dustrgb/frames/20261112T1650Z/mask.png').buf) === f.mask.sha256);
  ok('B source and cadence recorded', p.source.collection === 'EO:EUM:DAT:0869' && p.source.licence === 'CC BY 4.0' && p.cadence.runs_utc.join() === '6,18' && p.last_attempt === null);
  ok('B run logged ok, noting the header was absent', w.runs.length === 1 && w.runs[0].layer === 'dustrgb' && w.runs[0].status === 'ok' && /served-time header absent \(picture\), absent \(mask\)/.test(w.runs[0].note), w.runs);
  ok('B nothing written to the observation paths (latest/, latest-cells/, snapshots/)', ![...w.store.keys()].some(k => /^(latest|latest-cells|snapshots|cells|raw)\//.test(k)), [...w.store.keys()]);
  // routes
  let r = await route(w, '/snapshot/dustrgb/meta'), j = await r.json();
  ok('B meta route: 200, no-store, the frame, no storage keys exposed', r.status === 200 && r.headers.get('cache-control') === 'no-store' && j.frame.id === f.id && j.frame.picture.path === '/snapshot/dustrgb/20261112T1650Z/picture.jpg' && !JSON.stringify(j).includes('"key"') && typeof j.now === 'string', j);
  r = await route(w, j.frame.picture.path); const pb = new Uint8Array(await r.arrayBuffer());
  ok('B picture route: the stored bytes, image/jpeg, long cache, CORS open', r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && /immutable/.test(r.headers.get('cache-control')) && r.headers.get('access-control-allow-origin') === '*' && sha(pb) === f.picture.sha256);
  r = await route(w, j.frame.mask.path);
  ok('B mask route: image/png, the stored bytes', r.status === 200 && r.headers.get('content-type') === 'image/png' && sha(new Uint8Array(await r.arrayBuffer())) === f.mask.sha256);
  r = await route(w, '/snapshot/dustrgb/20200101T0000Z/picture.jpg');
  ok('B file route: a frame id that is neither current nor previous → 404, no-store', r.status === 404 && r.headers.get('cache-control') === 'no-store');
  r = await route(w, '/snapshot/dustrgb/20261112T1650Z/other.bin'); ok('B file route: an unknown file name → 404', r.status === 404);
  w.corruptRead = 'picture.jpg'; r = await route(w, j.frame.picture.path); w.corruptRead = null;
  ok('B file route: stored bytes that no longer match the pointer → 503 integrity, never served', r.status === 503 && (await r.json()).reason === 'integrity');
  r = await route(w, '/snapshot/dustrgb'); ok('B /snapshot/dustrgb alone is not the generic layer route (no envelope served)', r.status === 404);
  // C. unchanged
  const n = w.reqs.length; const out = await W.JOBS.dustrgb(w.env, at(18));
  ok('C same latest frame at the next run: one request (the list), no image request, logged ok "unchanged"', w.reqs.length === n + 1 && w.runs[1].status === 'ok' && /unchanged/.test(w.runs[1].note), [w.reqs.slice(n), out]);
  // D. new frame, then another: grace period, then lean storage
  w.latest = '2026-11-13T05:50:00Z'; await W.JOBS.dustrgb(w.env, at(6) + 864e5); let p2 = await pointer(w);
  ok('D a newer frame: pointer moves, the previous pair is named and still stored', p2.frame.id === '20261113T0550Z' && p2.previous.id === '20261112T1650Z' && w.store.has('dustrgb/frames/20261112T1650Z/picture.jpg') && w.store.has('dustrgb/frames/20261112T1650Z/mask.png'), p2);
  r = await route(w, '/snapshot/dustrgb/20261112T1650Z/picture.jpg'); ok('D grace: a reader holding the older pointer still gets the previous picture', r.status === 200 && sha(new Uint8Array(await r.arrayBuffer())) === f.picture.sha256);
  r = await route(w, '/snapshot/dustrgb/20261112T1650Z/mask.png'); ok('D grace: and its matching mask', r.status === 200 && sha(new Uint8Array(await r.arrayBuffer())) === f.mask.sha256);
  w.latest = '2026-11-13T17:50:00Z'; await W.JOBS.dustrgb(w.env, at(18) + 864e5); p2 = await pointer(w);
  const keys = [...w.store.keys()].filter(k => k.startsWith('dustrgb/frames/')).sort();
  ok('D after the next run only two pairs remain (current and previous); the oldest is deleted', keys.join() === ['dustrgb/frames/20261113T0550Z/mask.png', 'dustrgb/frames/20261113T0550Z/picture.jpg', 'dustrgb/frames/20261113T1750Z/mask.png', 'dustrgb/frames/20261113T1750Z/picture.jpg'].join(), keys);
  r = await route(w, '/snapshot/dustrgb/20261112T1650Z/picture.jpg'); ok('D the deleted frame is no longer served', r.status === 404); }

// ---------- E. failures: nothing published, pointer and files unchanged, fixed public reason
const failing = async (name, mut, reason, extra) => {
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const before = await pointer(w), keysBefore = [...w.store.keys()].sort().join();
  w.latest = '2026-11-12T18:00:00Z'; mut(w); const out = await W.JOBS.dustrgb(w.env, at(18)); const after = await pointer(w);
  ok(`E ${name}: frame unchanged, last_attempt recorded with the fixed reason "${reason}"`, JSON.stringify(after.frame) === JSON.stringify(before.frame) && after.last_attempt && after.last_attempt.reason === reason && after.last_attempt.status === 'down' && after.last_attempt.consecutive_failures === 1 && after.last_attempt.run === new Date(at(18)).toISOString(), [out, after.last_attempt]);
  ok(`E ${name}: logged down; the raw detail stays in the run note, not in the pointer`, w.runs.at(-1).status === 'down' && w.runs.at(-1).note.startsWith(reason) && !JSON.stringify(after).includes('(test)'), w.runs.at(-1));
  const r = await route(w, '/snapshot/dustrgb/meta'), j = await r.json();
  ok(`E ${name}: meta still serves the previous good frame with its original times`, j.frame.id === before.frame.id && j.frame.fetched_at === before.frame.fetched_at && j.last_attempt.reason === reason);
  if (extra) await extra(w, before, keysBefore); return w; };
await failing('frame list HTTP 500', w => { w.capStatus = 500; }, 'frame list http error', async w => ok('E frame list HTTP 500: no image request', imgReqs(w).length === 2));
await failing('frame list unreadable', w => { w.capBody = '<html>maintenance</html>'; }, 'frame list unreadable');
await failing('picture answered with HTTP 200 + XML error', w => { w.pic = { body: '<ServiceExceptionReport/>', type: 'text/xml;charset=UTF-8' }; }, 'picture not an image', async (w, b, kb) => ok('E XML error: no file written for the new frame', [...w.store.keys()].sort().join() === kb));
await failing('picture HTTP 503', w => { w.pic = { body: 'no', type: 'text/plain', status: 503 }; }, 'picture http error');
await failing('picture wrong dimensions', w => { w.pic = { body: jpeg(1024, 1024), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('picture truncated (no end marker)', w => { w.pic = { body: jpeg(2048, 2048, 1, false), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('bad mask: not a PNG', w => { w.mask = { body: jpeg(160, 160), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: no transparency', w => { w.mask = { body: png(160, 160, 2), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: wrong size', w => { w.mask = { body: png(320, 320), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: truncated', w => { w.mask = { body: png(160, 160, 6, 0, false), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: XML error', w => { w.mask = { body: '<ServiceExceptionReport/>', type: 'text/xml' }; }, 'mask not an image');
await failing('served-time header names another frame (picture)', w => { w.picWarn = '99 Nearest value used: time=2026-11-12T17:50:00.000Z ISO8601 (mtg_fd:rgb_dust)'; }, 'picture served time differs');
await failing('served-time header names another frame (mask)', w => { w.warn = '99 Nearest value used: time=2026-11-12T17:50:00.000Z ISO8601 (mtg_fd:rgb_dust)'; w.picWarn = 'echo'; }, 'mask served time differs');
{ // partial write: the picture is stored, the mask write fails → pointer unchanged; the orphan is cleaned by the next good run
  const w = await failing('partial write (mask put fails)', w => { w.putFail = 'mask.png'; }, 'mask write failed', async w => ok('E partial write: the orphan picture exists but is not served (its frame is not in the pointer)', w.store.has('dustrgb/frames/20261112T1800Z/picture.jpg') && (await route(w, '/snapshot/dustrgb/20261112T1800Z/picture.jpg')).status === 404));
  w.putFail = null; w.latest = '2026-11-13T05:50:00Z'; await W.JOBS.dustrgb(w.env, at(6) + 864e5); const p = await pointer(w);
  ok('E after a partial write, the next good run publishes, clears last_attempt and removes the orphan', p.frame.id === '20261113T0550Z' && p.last_attempt === null && !w.store.has('dustrgb/frames/20261112T1800Z/picture.jpg'), [...w.store.keys()]); }
await failing('picture request times out', w => { w.throwOn = /image\/jpeg/; }, 'picture request failed', async (w, b, kb) => ok('E picture times out: nothing written; no mask request follows', [...w.store.keys()].sort().join() === kb && imgReqs(w).length === 3, imgReqs(w)));
await failing('mask request times out', w => { w.throwOn = /image\/png/; }, 'mask request failed');
{ const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); ok('E both image requests carry a time limit (an abort signal); the limit is 90 s', imgReqs(w).length === 2 && w.signals.slice(-2).every(Boolean) && W.DUSTRGB.TIMEOUT_MS === 90000, w.signals); }
await failing('read-back differs (picture)', w => { w.corruptRead = 'picture.jpg'; }, 'picture read-back differs');
await failing('read-back differs (mask)', w => { w.corruptRead = 'mask.png'; }, 'mask read-back differs');
{ // an uncaught throw goes through guarded(): never the generic writeDown
  const w = await failing('uncaught error (network throws)', w => { w.throwFetch = true; }, 'internal error');
  ok('E uncaught error: no generic down envelope written (no latest/ or latest-cells/ object)', ![...w.store.keys()].some(k => /^(latest|latest-cells)\//.test(k)), [...w.store.keys()]); }
{ const w = world(); use(w); w.capStatus = 502; await W.JOBS.dustrgb(w.env, at(6)); const p = await pointer(w); const j = await (await route(w, '/snapshot/dustrgb/meta')).json();
  ok('E first run ever fails: pointer has no frame, only the attempt; meta says so', p.frame === null && p.last_attempt.reason === 'frame list http error' && j.frame === null && j.last_attempt.consecutive_failures === 1, p);
  w.capStatus = 500; await W.JOBS.dustrgb(w.env, at(18)); ok('E consecutive failures count up', (await pointer(w)).last_attempt.consecutive_failures === 2);
  w.capStatus = 200; await W.JOBS.dustrgb(w.env, at(6) + 864e5); ok('E then a good run publishes and clears the attempt', (await pointer(w)).frame.id === '20261112T1650Z' && (await pointer(w)).last_attempt === null); }
{ const w = world(); use(w); const j = await (await route(w, '/snapshot/dustrgb/meta')).json(); ok('meta before any run: frame null, 200', j.frame === null && j.last_attempt === null); }

// ---------- F. the served-time header, if it ever arrives
{ const w = world(); use(w); w.warn = 'echo'; await W.JOBS.dustrgb(w.env, at(6)); const f = (await pointer(w)).frame;
  ok('F header present and agreeing on both files: served_time recorded with its source', f.served_time === '2026-11-12T16:50:00Z' && f.served_time_source === 'server Warning header' && /served time named by the server/.test(f.time_basis) && f.picture.warning_header_present === true && /header present \(picture\), present \(mask\)/.test(w.runs[0].note), f); }
{ const w = world(); use(w); w.picWarn = 'echo'; await W.JOBS.dustrgb(w.env, at(6)); const f = (await pointer(w)).frame;
  ok('F header on only one file: published, but served_time stays null (counted as absent, not as a mismatch)', f && f.served_time === null && f.picture.warning_header_present === true && f.mask.warning_header_present === false, f); }
{ // success after failure keeps nothing stale
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); w.capStatus = 500; await W.JOBS.dustrgb(w.env, at(18)); w.capStatus = 200; await W.JOBS.dustrgb(w.env, at(6) + 864e5);
  ok('an unchanged-frame run after a failure clears last_attempt', (await pointer(w)).last_attempt === null); }

globalThis.fetch = realFetch;
console.log(`dustrgb-hub: ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
