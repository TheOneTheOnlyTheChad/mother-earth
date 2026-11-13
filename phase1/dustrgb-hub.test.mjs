/* Dust RGB hub job and routes (hub 0.6.11; DUST-RGB-LAYER-PROPOSAL rev 5 §3, §3a, §8; GPT review of 13 Nov 2026).
 * The real worker.js runs against a fake R2 (put/get/list/delete with etags, conditional puts, upload times and switchable faults),
 * a recording D1 and a stubbed EUMETView. Nothing here reaches the network and nothing outside Node's standard library is used.
 * Success fixtures are REAL images: dustrgb-fixtures/hub-picture.jpg (2048 x 2048 JPEG) and hub-mask.png (160 x 160 RGBA, written by
 * this file's own encoder: WRITE_FIXTURES=1). The page suite checks that a browser decodes both.
 * Run: node --no-warnings phase1/dustrgb-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored no-type-check no-readback no-mismatch keep-all move-on-fail any-frame mask-any generic-down refetch-same pointer-early
 *   no-timeout time-keys refetch-older overwrite no-cas clean-young no-decode no-footprint unscoped no-list-timeout dust-first jpeg-sof-only */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import zlib from 'node:zlib'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const u = env.DUSTRGB_ENABLED !== '1' ?", 'const u = false ?'],
  'no-type-check': ["  if (type !== spec.type) return { ok: false, reason: what + ' not an image', http: 200, detail: type };", ''],
  'no-readback': ["      if (await same(key) !== 'same') return dustFail(env, ms, k + ' read-back differs', 200, key);", ''],
  'no-mismatch': ["if (f.served && f.served !== T) return dustFail(env, ms, what + ' served time differs'", "if (false) return dustFail(env, ms, what + ' served time differs'"],
  'keep-all': ['if (!keep.some(d => o.key.startsWith(d)) && o.uploaded && now - new Date(o.uploaded).getTime() > DUSTRGB.CLEAN_AFTER_MS) await env.R2.delete(o.key);', ';'],
  'move-on-fail': ["dustUpdate(env, cur => ({ ...cur, last_attempt: {", "dustUpdate(env, cur => ({ ...cur, frame: null, last_attempt: {"],
  'any-frame': ['const fr = [cur.frame, cur.previous].find(f => f && f.id === p[2]);', 'const fr = cur.frame;'],
  'mask-any': ['if (!i || i.w !== spec.w || i.h !== spec.h || !i.alpha || !i.complete)', 'if (!i)'],
  'no-timeout': [", signal: AbortSignal.timeout(DUSTRGB.TIMEOUT_MS) }", ' }'],
  'generic-down': ["    else if (layer === 'dustrgb') { try { await dustFail(env, ms, 'internal error', 0, note); } catch (_) {} }", ''],
  'refetch-same': ['if (cur.frame && T <= cur.frame.requested_time) {', 'if (cur.frame && T < cur.frame.requested_time) {'],
  'pointer-early': ["  const dir = DUSTRGB.PREFIX + id + '/';", "  const dir = DUSTRGB.PREFIX + id + '/';\n  await env.R2.put(DUSTRGB.POINTER, JSON.stringify({ schema: 1, layer: 'dustrgb', frame: { id, requested_time: T, picture: { file: 'picture.jpg', key: dir + 'picture.jpg' }, mask: { file: 'mask.png', key: dir + 'mask.png' } }, previous: null, last_attempt: null }));"],
  // GPT review, finding 1
  'time-keys': ["const id = dustKeyOf(T) + '-' + (await sha256Bytes(new TextEncoder().encode(pic.sha256 + ':' + mask.sha256).buffer)).slice(0, 16);", 'const id = dustKeyOf(T);'],
  'refetch-older': ['if (cur.frame && T <= cur.frame.requested_time) {', 'if (cur.frame && T === cur.frame.requested_time) {'],
  'overwrite': ["    if (had === 'differs' || had === 'unreadable') return dustFail(env, ms, k + ' stored copy differs', 200, key);   // never overwrite a stored file\n    if (had === 'absent') {", '    {'],
  'no-cas': [", onlyIf: { etagMatches: etag } });\n    if (r !== null) return", ' });\n    if (r !== null) return'],
  'clean-young': [' && o.uploaded && now - new Date(o.uploaded).getTime() > DUSTRGB.CLEAN_AFTER_MS) await env.R2.delete(o.key);', ') await env.R2.delete(o.key);'],
  // finding 2
  'no-decode': ["    if (!d) return { ok: false, reason: what + ' does not decode', http: 200 };", "    if (!d) { alpha = {}; } else"],
  'no-footprint': ['if (!d.opaque || d.centre !== 255 || d.corners.some(a => a !== 0))', 'if (false)'],
  'jpeg-sof-only': ['if (!d || d.w !== spec.w || d.h !== spec.h || !d.dqt || !d.sos || !d.eoi)', 'if (!d || d.w !== spec.w || d.h !== spec.h || !d.eoi)'],
  // finding 3
  'unscoped': ["end = rest.search(/<\\/Layer>|<Layer\\b/), own = end < 0 ? rest : rest.slice(0, end);", 'end = -1, own = rest;'],
  'no-list-timeout': [", signal: AbortSignal.timeout(DUSTRGB.LIST_TIMEOUT_MS) }", ' }'],
  'dust-first': null,   // applied below: move the dust line back in front of hourlyBatch
};
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) {
  if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  if (BREAK === 'dust-first') { const a = '    const b = await hourlyBatch(env, ms);\n', i = src.indexOf(a), m = /    const u = env\.DUSTRGB_ENABLED[^\n]*\n/.exec(src);
    if (i < 0 || !m || m.index < i) { console.log('FAIL  break did not apply: dust-first'); process.exit(1); }
    src = src.replace(m[0], '').replace(a, m[0] + a); }
  else { const b = BREAKS[BREAK]; if (!src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); }
}
const tmp = path.join(os.tmpdir(), `worker-dust-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);

for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const pairId = (t, pic, mask) => W.dustKeyOf(t) + '-' + sha(Buffer.from(sha(pic) + ':' + sha(mask))).slice(0, 16);
const ID = /^\d{8}T\d{4}Z-[0-9a-f]{16}$/;

// ---------- fixtures
// picture: a real JPEG; a comment segment after the start marker makes each one distinct without touching the image
const BASE_JPEG = fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/hub-picture.jpg'));
const SMALL_JPEG = fs.readFileSync(path.join(HERE, 'dustrgb-fixtures/picture-a.jpg'));   // a real 256 x 256 JPEG
const jpeg = (salt = 0, base = BASE_JPEG) => new Uint8Array(Buffer.concat([base.subarray(0, 2), Buffer.from([0xff, 0xfe, 0x00, 0x06, salt & 255, (salt >> 8) & 255, (salt >> 16) & 255, (salt >> 24) & 255]), base.subarray(2)]));
const sosAt = u8 => { let i = 2; while (i + 4 <= u8.length) { if (u8[i + 1] === 0xda) return i; i += 2 + ((u8[i + 2] << 8) | u8[i + 3]); } return -1; };
const jpegDamagedScan = () => { const b = Buffer.from(jpeg(7)); const s = sosAt(b) + 2000; b.fill(0x55, s, s + 6000); return new Uint8Array(b); };   // structure intact, picture data ruined
const jpegNoScan = () => { const b = Buffer.from(jpeg(8)); return new Uint8Array(Buffer.concat([b.subarray(0, sosAt(b)), Buffer.from([0xff, 0xd9])])); };   // headers and size, no picture data at all
const jpegHeaderOnly = () => Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 1, 2, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x08, 0x00, 0x08, 0x00, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);   // the previous suite's "success" picture
// mask: a real PNG from this file's encoder (all five row filters, valid checksums)
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'latin1'); Buffer.from(data).copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const disc = (x, y, w, h) => Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) <= w * 0.48 ? 255 : 0;
function png({ w = 160, h = 160, colour = 6, alpha = disc, salt = 0, filters = true, iend = true, breakCrc = false, breakZlib = false, interlace = 0 } = {}) {
  const ch = { 6: 4, 2: 3, 4: 2, 3: 1 }[colour], stride = w * ch, rows = [];
  for (let y = 0; y < h; y++) { const r = Buffer.alloc(stride); for (let x = 0; x < w; x++) { const a = alpha(x, y, w, h), o = x * ch;
    if (colour === 6) { r[o] = (x * 3 + salt) & 255; r[o + 1] = (y * 5) & 255; r[o + 2] = 200; r[o + 3] = a; } else if (colour === 2) { r[o] = x & 255; r[o + 1] = y & 255; r[o + 2] = 9; } else if (colour === 4) { r[o] = (x + y) & 255; r[o + 1] = a; } else r[o] = a === 255 ? 1 : a === 0 ? 0 : 2; }
    rows.push(r); }
  const out = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { const f = filters ? y % 5 : 0, cur = rows[y], up = y ? rows[y - 1] : null, o = y * (stride + 1); out[o] = f;
    for (let x = 0; x < stride; x++) { const a = x >= ch ? cur[x - ch] : 0, b = up ? up[x] : 0, c = up && x >= ch ? up[x - ch] : 0; let p = 0;
      if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[o + 1 + x] = (cur[x] - p) & 255; } }
  let z = zlib.deflateSync(out); if (breakZlib) { z = Buffer.from(z); z[z.length >> 1] ^= 0x5a; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = colour; ihdr[12] = interlace;
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr)];
  if (colour === 3) { parts.push(chunk('PLTE', Buffer.from([0, 0, 0, 255, 255, 255, 90, 90, 90]))); parts.push(chunk('tRNS', Buffer.from([0, 255, 128]))); }
  parts.push(chunk('tEXt', Buffer.from('salt\0' + salt))); parts.push(chunk('IDAT', z.subarray(0, z.length >> 1))); parts.push(chunk('IDAT', z.subarray(z.length >> 1)));   // two IDAT chunks, as real encoders may write
  if (iend) parts.push(chunk('IEND', Buffer.alloc(0)));
  const b = Buffer.concat(parts); if (breakCrc) b[b.length - 40] ^= 0x01;
  return new Uint8Array(b);
}
const MASK_FILE = path.join(HERE, 'dustrgb-fixtures/hub-mask.png');
if (process.env.WRITE_FIXTURES === '1') { fs.writeFileSync(MASK_FILE, png()); console.log('wrote ' + MASK_FILE); process.exit(0); }
const BASE_MASK = fs.readFileSync(MASK_FILE);
/** the committed mask with one extra text chunk before IEND: a distinct, still valid file per frame */
const mask = (salt = 0) => new Uint8Array(Buffer.concat([BASE_MASK.subarray(0, BASE_MASK.length - 12), chunk('tEXt', Buffer.from('frame\0' + salt)), BASE_MASK.subarray(BASE_MASK.length - 12)]));
const dustLayer = (t, name = 'rgb_dust') => `<Layer queryable="1"><Name>${name}</Name><Title>x</Title>${t ? `<Dimension name="time" default="${t}" units="ISO8601">2024-10-22T00:40:00.000Z/${t.replace('Z', '.000Z')}/PT10M</Dimension>` : ''}</Layer>`;
const caps = t => `<WMS_Capabilities><Capability><Layer><Title>mtg_fd</Title>${dustLayer(t)}</Layer></Capability></WMS_Capabilities>`;

// ---------- fakes
function world() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, order: [], latest: '2026-11-12T16:50:00Z', capStatus: 200, capBody: null, pic: null, mask: null, warn: undefined, picWarn: undefined, putFail: null, corruptRead: null, throwFetch: false, throwOn: null, signals: [],
    conflicts: 0, onPointerPut: null, onFetch: null, puts: [], pageSize: 0, brokenResponse: null };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.endsWith(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body.buffer ? body.buffer.slice(body.byteOffset || 0, (body.byteOffset || 0) + body.byteLength) : body);
      if (opts.onlyIf) { if (key === W.DUSTRGB.POINTER && w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); }
        const had = store.get(key); if (!had || had.etag !== opts.onlyIf.etagMatches) { w.conflicts++; return null; } }
      w.puts.push(key); store.set(key, { buf, opts, etag: etagOf(buf), uploaded: new Date() }); return { key, etag: etagOf(buf) }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.endsWith(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 3] ^= 0xff; }
      return { body: buf, etag: o.etag, httpEtag: '"' + o.etag + '"', uploaded: o.uploaded, customMetadata: o.opts.customMetadata, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag, uploaded: o.uploaded, customMetadata: o.opts.customMetadata } : null; },
    async list({ prefix = '', cursor } = {}) { const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key, uploaded: store.get(key).uploaded }));
      if (!w.pageSize) return { objects: all, truncated: false }; const from = cursor ? Number(cursor) : 0, page = all.slice(from, from + w.pageSize), more = from + w.pageSize < all.length;
      return { objects: page, truncated: more, ...(more ? { cursor: String(from + w.pageSize) } : {}) }; },
    async delete(key) { store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) { runs.push({ layer: a[0], status: a[3], http: a[4], note: a[7] }); w.order.push('run:' + a[0]); } if (/INSERT INTO batch_runs/.test(sql)) w.order.push('batch'); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, DUSTRGB_ENABLED: '1' };
  w.age = ms => { for (const o of store.values()) o.uploaded = new Date(o.uploaded.getTime() - ms); };   // make everything stored so far look older
  w.fetch = async (url, init) => { const u = String(url); if (!u.includes('view.eumetsat.int')) { w.order.push('other'); throw new Error('unexpected fetch ' + u); }
    w.order.push('dust'); reqs.push(u); w.signals.push(!!(init && init.signal)); if (w.throwFetch) throw new Error('network down (test)');
    if (w.throwOn && w.throwOn.test(u)) throw new Error('The operation was aborted due to timeout (test)');
    if (w.onFetch) await w.onFetch(u);
    if (/GetCapabilities/.test(u)) return new Response(w.capBody !== null ? w.capBody : caps(w.latest), { status: w.capStatus, headers: { 'content-type': 'text/xml' } });
    const isPic = /image\/jpeg/.test(u); const t = (u.match(/time=([^&]+)/) || [])[1];
    if (w.brokenResponse && isPic) return { status: 200 };   // not a Response at all: provokes an uncaught error inside the job
    const spec = isPic ? (w.pic || { body: jpeg(Date.parse(t) / 6e5), type: 'image/jpeg', status: 200 }) : (w.mask || { body: mask(Date.parse(t) / 6e5), type: 'image/png', status: 200 });
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
const frameKeys = w => [...w.store.keys()].filter(k => k.startsWith('dustrgb/frames/')).sort();
const readable = async (w, f) => { const a = await route(w, f.picture.path), b = await route(w, f.mask.path); return a.status === 200 && b.status === 200 && sha(new Uint8Array(await a.arrayBuffer())) === f.picture.sha256 && sha(new Uint8Array(await b.arrayBuffer())) === f.mask.sha256; };
const TA = '2026-11-12T16:50:00Z', TB = '2026-11-13T05:50:00Z', TC = '2026-11-13T17:50:00Z';

// ---------- pure helpers
ok('dustLatest: reads the layer default time and normalises it', W.dustLatest(caps(TA)) === TA && W.dustLatest(caps('2026-11-12T16:50:00.000Z')) === TA);
ok('dustLatest: refuses an off-grid, malformed or missing time', W.dustLatest(caps('2026-11-12T16:53:00Z')) === null && W.dustLatest(caps('yesterday')) === null && W.dustLatest('<x/>') === null);
ok('dustLatest: attribute order does not matter; a namespaced name is accepted', W.dustLatest(`<Layer><Name>mtg_fd:rgb_dust</Name><Dimension units="ISO8601" default="${TA}" name="time">x</Dimension></Layer>`) === TA);
{ // GPT review 3: the dust layer has no time of its own; a sibling does
  const sibling = `<WMS_Capabilities><Capability><Layer><Title>mtg_fd</Title>${dustLayer(null)}${dustLayer('2026-11-12T18:00:00Z', 'rgb_ash')}</Layer></Capability></WMS_Capabilities>`;
  ok('dustLatest: a time on a SIBLING layer is never taken when the dust layer has none', W.dustLatest(sibling) === null, W.dustLatest(sibling));
  const before = `<WMS_Capabilities><Capability><Layer>${dustLayer('2026-11-12T18:00:00Z', 'rgb_ash')}${dustLayer(TA)}${dustLayer('2026-11-12T19:00:00Z', 'rgb_fog')}</Layer></Capability></WMS_Capabilities>`;
  ok('dustLatest: between two siblings with other times, the dust layer\'s own time is read', W.dustLatest(before) === TA, W.dustLatest(before));
  const other = `<Layer>${dustLayer(TA, 'rgb_dust_old')}</Layer>`; ok('dustLatest: a layer whose name merely starts with rgb_dust is not the dust layer', W.dustLatest(other) === null);
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); w.capBody = sibling; await W.JOBS.dustrgb(w.env, at(18)); const p = await pointer(w);
  ok('dustLatest: through the job — sibling-only time → "frame list unreadable", no image request, frame kept', p.last_attempt && p.last_attempt.reason === 'frame list unreadable' && p.frame.requested_time === TA && imgReqs(w).length === 2, p.last_attempt); }
ok('dustKeyOf: time part of a frame id', W.dustKeyOf(TA) === '20261112T1650Z');
{ const good = W.jpegCheck(jpeg(1)), small = W.jpegCheck(new Uint8Array(SMALL_JPEG));
  ok('jpegCheck: the real fixture — 2048 x 2048, quantisation tables, a scan, an end marker', good && good.w === 2048 && good.h === 2048 && good.dqt > 0 && good.sos === true && good.eoi === true, good);
  ok('jpegCheck: a real 256-pixel JPEG reads as 256; junk, a headers-only file and a file with no scan are told apart', small.w === 256 && W.jpegCheck(new Uint8Array([1, 2, 3, 4])) === null && W.jpegCheck(jpegHeaderOnly()).sos === false && W.jpegCheck(jpegHeaderOnly()).dqt === 0 && W.jpegCheck(jpegNoScan()).sos === false, [small, W.jpegCheck(jpegHeaderOnly())]); }
{ const a = await W.pngAlpha(new Uint8Array(BASE_MASK)); const n = 160 * 160;
  let want = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (disc(x, y, 160, 160)) want++;
  ok('pngAlpha: the committed mask decodes in full — every pixel counted, opaque centre, clear corners', a && a.w === 160 && a.h === 160 && a.opaque === want && a.transparent === n - want && a.partial === 0 && a.centre === 255 && a.corners.join() === '0,0,0,0', a);
  ok('pngAlpha: the committed mask is what this file\'s encoder writes (same pixels), and Node\'s own zlib inflates it', JSON.stringify(await W.pngAlpha(png())) === JSON.stringify(a) && (() => { const idat = []; for (let i = 8; i < BASE_MASK.length;) { const len = BASE_MASK.readUInt32BE(i); if (BASE_MASK.toString('latin1', i + 4, i + 8) === 'IDAT') idat.push(BASE_MASK.subarray(i + 8, i + 8 + len)); i += 12 + len; } return zlib.inflateSync(Buffer.concat(idat)).length === 160 * (160 * 4 + 1); })());
  const nf = await W.pngAlpha(png({ filters: false })); ok('pngAlpha: all five row filters are undone correctly (same counts with and without filtering)', nf && nf.opaque === a.opaque && nf.transparent === a.transparent);
  const ga = await W.pngAlpha(png({ colour: 4 })), pal = await W.pngAlpha(png({ colour: 3, alpha: (x, y, w, h) => (x === 5 && y === 80) ? 128 : disc(x, y, w, h) }));
  ok('pngAlpha: grey+alpha and palette+tRNS masks decode too (partial alpha is counted)', ga && ga.opaque === a.opaque && pal && pal.partial === 1 && pal.opaque === a.opaque - 1, [ga, pal]);
  ok('pngAlpha: refuses a bad chunk checksum, damaged image data, a missing end, RGB without alpha, interlaced, and junk', await W.pngAlpha(png({ breakCrc: true })) === null && await W.pngAlpha(png({ breakZlib: true })) === null && await W.pngAlpha(png({ iend: false })) === null && await W.pngAlpha(png({ colour: 2 })) === null && await W.pngAlpha(png({ interlace: 1 })) === null && await W.pngAlpha(new Uint8Array(80)) === null);
  ok('pngInfo: header facts', W.pngInfo(png()).alpha === true && W.pngInfo(png({ colour: 2 })).alpha === false && W.pngInfo(png({ iend: false })).complete === false && W.pngInfo(new Uint8Array(60)) === null); }
ok('dustServed: reads the time a Warning header names', W.dustServed('99 Nearest value used: time=2026-11-12T16:50:00.000Z ISO8601 (mtg_fd:rgb_dust)') === TA && W.dustServed(null) === null);
ok('version is at least 0.6.11', (() => { const v = src.match(/const COLLECTOR_VERSION = '(\d+)\.(\d+)\.(\d+)'/).slice(1).map(Number); return v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 11); })());

// ---------- A. the gate and the schedule (through the real hourly job)
{ const w = world(); use(w); delete w.env.DUSTRGB_ENABLED;
  const r = await W.JOBS.hourly(w.env, at(6), false);
  ok('A gate off at 06:07 UTC: no request to EUMETSAT at all, nothing stored', w.reqs.length === 0 && !(await pointer(w)) && /not scheduled/.test(r.dustrgb), [w.reqs, r.dustrgb]); }
{ const w = world(); use(w);
  const r7 = await W.JOBS.hourly(w.env, at(7), false);
  ok('A gate on at 07:07 UTC: skipped, no request', w.reqs.length === 0 && /skipped/.test(r7.dustrgb), r7.dustrgb);
  w.order.length = 0; const r6 = await W.JOBS.hourly(w.env, at(6), false);
  ok('A gate on at 06:07 UTC: runs and publishes', r6.dustrgb === 'dustrgb:ran' && (await pointer(w)).frame.requested_time === TA && w.reqs.length === 3, r6.dustrgb);
  // GPT review 3: nothing else in the hourly job waits on Dust
  const firstDust = w.order.indexOf('dust'), others = w.order.map((x, i) => [x, i]).filter(([x]) => x !== 'dust' && x !== 'run:dustrgb');
  ok('A order: the hourly batch has finished (its record is written), and every other request and run record is done, BEFORE the first EUMETSAT request', firstDust > 0 && w.order.includes('batch') && w.order.indexOf('batch') < firstDust && others.every(([, i]) => i < firstDust), { firstDust, batch: w.order.indexOf('batch'), tail: w.order.slice(-6) });
  ok('A the hourly result still reports the batch alongside dust', 'batch' in r6 && 'dustrgb' in r6);
  const w2 = world(); use(w2); const r18 = await W.JOBS.hourly(w2.env, at(18), false);
  ok('A gate on at 18:07 UTC: runs', r18.dustrgb === 'dustrgb:ran' && !!(await pointer(w2)).frame, r18.dustrgb); }

// ---------- B. a good run
{ const w = world(); use(w);
  await W.JOBS.dustrgb(w.env, at(6)); const p = await pointer(w), f = p.frame;
  const picA = jpeg(Date.parse(TA) / 6e5), maskA = mask(Date.parse(TA) / 6e5), idA = pairId(TA, picA, maskA);
  ok('B three upstream requests: the list, one picture, one mask, each image by the exact advertised time', w.reqs.length === 3 && /GetCapabilities/.test(w.reqs[0]) && imgReqs(w).every(u => u.includes('time=' + TA) && u.includes('bbox=-80,-80,80,80')) && /image\/jpeg&width=2048&height=2048/.test(w.reqs[1]) && /image\/png&transparent=true&width=160&height=160/.test(w.reqs[2]), w.reqs);
  ok('B frame id = the time plus a fingerprint of BOTH files', ID.test(f.id) && f.id === idA, [f.id, idA]);
  ok('B pointer: requested time, box, both files with bytes and sha256', f.requested_time === TA && f.box.south === -80 && f.box.east === 80 && f.picture.bytes === picA.length && f.picture.w === 2048 && f.mask.w === 160 && f.picture.sha256 === sha(picA) && f.mask.sha256 === sha(maskA), f);
  ok('B pointer says what was checked: mask decoded, picture structure only; mask pixel counts recorded', /mask decoded in full; picture structure only/.test(f.checked) && f.mask.alpha.opaque > 0 && f.mask.alpha.transparent > 0 && f.mask.alpha.partial === 0, f);
  ok('B header absent (as from a real Worker): served_time null, and the basis says "requested time only"', f.served_time === null && f.served_time_source === null && /requested time only/.test(f.time_basis) && f.picture.warning_header_present === false, f);
  ok('B stored files are exactly what was fetched, under keys and URLs that name the pair', sha(w.store.get(`dustrgb/frames/${idA}/picture.jpg`).buf) === f.picture.sha256 && sha(w.store.get(`dustrgb/frames/${idA}/mask.png`).buf) === f.mask.sha256 && f.picture.path === `/snapshot/dustrgb/${idA}/picture.jpg` && f.mask.path === `/snapshot/dustrgb/${idA}/mask.png`);
  ok('B source and cadence recorded', p.source.collection === 'EO:EUM:DAT:0869' && p.source.licence === 'CC BY 4.0' && p.cadence.runs_utc.join() === '6,18' && p.last_attempt === null);
  ok('B run logged ok, noting the pair id and that the header was absent', w.runs.length === 1 && w.runs[0].layer === 'dustrgb' && w.runs[0].status === 'ok' && w.runs[0].note.includes(idA) && /served-time header absent \(picture\), absent \(mask\)/.test(w.runs[0].note), w.runs);
  ok('B nothing written to the observation paths (latest/, latest-cells/, snapshots/)', ![...w.store.keys()].some(k => /^(latest|latest-cells|snapshots|cells|raw)\//.test(k)), [...w.store.keys()]);
  // routes
  let r = await route(w, '/snapshot/dustrgb/meta'), j = await r.json();
  ok('B meta route: 200, no-store, the frame, no storage keys exposed', r.status === 200 && r.headers.get('cache-control') === 'no-store' && j.frame.id === f.id && j.frame.picture.path === f.picture.path && !JSON.stringify(j).includes('"key"') && typeof j.now === 'string', j);
  r = await route(w, j.frame.picture.path); const pb = new Uint8Array(await r.arrayBuffer());
  ok('B picture route: the stored bytes, image/jpeg, long cache, CORS open', r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && /immutable/.test(r.headers.get('cache-control')) && r.headers.get('access-control-allow-origin') === '*' && sha(pb) === f.picture.sha256);
  r = await route(w, j.frame.mask.path);
  ok('B mask route: image/png, the stored bytes', r.status === 200 && r.headers.get('content-type') === 'image/png' && sha(new Uint8Array(await r.arrayBuffer())) === f.mask.sha256);
  r = await route(w, '/snapshot/dustrgb/20200101T0000Z-0123456789abcdef/picture.jpg');
  ok('B file route: a pair id that is neither current nor previous → 404, no-store', r.status === 404 && r.headers.get('cache-control') === 'no-store');
  r = await route(w, '/snapshot/dustrgb/20261112T1650Z/picture.jpg'); ok('B file route: the time alone (no fingerprint) is not an address → 404', r.status === 404);
  r = await route(w, `/snapshot/dustrgb/${idA}/other.bin`); ok('B file route: an unknown file name → 404', r.status === 404);
  w.corruptRead = 'picture.jpg'; r = await route(w, j.frame.picture.path); w.corruptRead = null;
  ok('B file route: stored bytes that no longer match the pointer → 503 integrity, never served', r.status === 503 && (await r.json()).reason === 'integrity');
  r = await route(w, '/snapshot/dustrgb'); ok('B /snapshot/dustrgb alone is not the generic layer route (no envelope served)', r.status === 404);
  // C. unchanged
  const n = w.reqs.length, np = w.puts.length; const out = await W.JOBS.dustrgb(w.env, at(18));
  ok('C same latest frame at the next run: one request (the list), no image request, nothing written, logged ok "unchanged"', w.reqs.length === n + 1 && w.puts.length === np && w.runs[1].status === 'ok' && /unchanged/.test(w.runs[1].note), [w.reqs.slice(n), out, w.puts.slice(np)]);
  // D. new frame, then another: grace period, then lean storage
  w.latest = TB; await W.JOBS.dustrgb(w.env, at(6) + 864e5); let p2 = await pointer(w); const fB = p2.frame;
  ok('D a newer frame: pointer moves, the previous pair is named and still stored', fB.requested_time === TB && p2.previous.id === idA && w.store.has(`dustrgb/frames/${idA}/picture.jpg`) && w.store.has(`dustrgb/frames/${idA}/mask.png`), p2);
  ok('D grace: a reader holding the older pointer still gets the previous picture and its matching mask', await readable(w, f));
  w.latest = TC; await W.JOBS.dustrgb(w.env, at(18) + 864e5); p2 = await pointer(w);
  ok('D one run later the oldest pair is out of the pointer and no longer served, but its files are NOT deleted while young', p2.frame.requested_time === TC && p2.previous.id === fB.id && (await route(w, f.picture.path)).status === 404 && w.store.has(`dustrgb/frames/${idA}/picture.jpg`), frameKeys(w));
  w.age(3 * 3600e3); w.pageSize = 2; await W.dustClean(w.env);
  ok('D once older than two hours the unreferenced pair is deleted (the listing is read page by page); current and previous stay', frameKeys(w).join() === [p2.frame.id, fB.id].sort().flatMap(i => [`dustrgb/frames/${i}/mask.png`, `dustrgb/frames/${i}/picture.jpg`]).join() && await readable(w, p2.frame) && await readable(w, fB), frameKeys(w)); }

// ---------- G. GPT review 1: published addresses never change underneath a reader
{ // the reproduced bug: A, then B, then EUMETSAT advertises A again with different picture bytes and the mask write fails
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame;
  w.latest = TB; await W.JOBS.dustrgb(w.env, at(18)); const pAB = await pointer(w), fB = pAB.frame;
  const bytesBefore = Object.fromEntries(frameKeys(w).map(k => [k, sha(w.store.get(k).buf)])), n = w.reqs.length, np = w.puts.length;
  w.latest = TA; w.pic = { body: jpeg(424242), type: 'image/jpeg' }; w.putFail = 'mask.png';
  const out = await W.JOBS.dustrgb(w.env, at(6) + 864e5); const after = await pointer(w);
  ok('G an OLDER time advertised again: no image request, nothing written, logged ok "not newer"', w.reqs.length === n + 1 && w.puts.length === np && w.runs.at(-1).status === 'ok' && /not newer: 2026-11-12T16:50:00Z advertised, 2026-11-13T05:50:00Z held and kept/.test(w.runs.at(-1).note), [out, w.reqs.slice(n), w.puts.slice(np)]);
  ok('G the pointer is untouched (B current, A previous) and no stored byte changed', JSON.stringify(after) === JSON.stringify(pAB) && JSON.stringify(Object.fromEntries(frameKeys(w).map(k => [k, sha(w.store.get(k).buf)]))) === JSON.stringify(bytesBefore));
  ok('G BOTH published pairs are still readable: A\'s picture answers 200 with its original bytes (it was 503 integrity)', await readable(w, fA) && await readable(w, fB), [(await route(w, fA.picture.path)).status, (await route(w, fB.picture.path)).status]); }
{ // a failed write for a NEWER time leaves both published pairs readable
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame; w.latest = TB; await W.JOBS.dustrgb(w.env, at(18)); const fB = (await pointer(w)).frame;
  w.latest = TC; w.putFail = 'mask.png'; await W.JOBS.dustrgb(w.env, at(6) + 864e5); let p1 = await pointer(w); w.putFail = null;
  ok('G newer frame, mask write fails after the picture was stored: pointer still B current / A previous, and BOTH pairs still readable', p1.frame.id === fB.id && p1.previous.id === fA.id && p1.last_attempt.reason === 'mask write failed' && await readable(w, fA) && await readable(w, fB), p1.last_attempt);
  { const x = world(); use(x); await W.JOBS.dustrgb(x.env, at(6)); const xA = (await pointer(x)).frame; x.latest = TB; await W.JOBS.dustrgb(x.env, at(18)); const xB = (await pointer(x)).frame;
    x.latest = TC; x.putFail = 'picture.jpg'; await W.JOBS.dustrgb(x.env, at(6) + 864e5); const px = await pointer(x);
    ok('G newer frame, picture write fails: pointer still B current / A previous, and BOTH pairs still readable', px.frame.id === xB.id && px.previous.id === xA.id && px.last_attempt.reason === 'picture write failed' && await readable(x, xA) && await readable(x, xB), px.last_attempt); use(w); }
  // the same time offered again with DIFFERENT bytes after that failure: a different id, the orphan is not touched
  const orphan = frameKeys(w).filter(k => !k.includes(fA.id) && !k.includes(fB.id)), orphanSha = orphan.map(k => sha(w.store.get(k).buf)).join();
  w.pic = { body: jpeg(555), type: 'image/jpeg' }; await W.JOBS.dustrgb(w.env, at(18) + 864e5); const p = await pointer(w);
  ok('G the same time with different picture bytes is a DIFFERENT pair id; the earlier orphan file keeps its bytes', orphan.length === 1 && p.frame.requested_time === TC && !orphan[0].includes(p.frame.id) && p.frame.id.startsWith('20261113T1750Z-') && w.store.has(orphan[0]) && orphan.map(k => sha(w.store.get(k).buf)).join() === orphanSha && await readable(w, p.frame) && await readable(w, fB), [orphan, p.frame.id]); }
{ // never overwrite: a stored file at the pair's own key that does not match is left exactly as it is
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); w.latest = TB;
  const idB = pairId(TB, jpeg(Date.parse(TB) / 6e5), mask(Date.parse(TB) / 6e5)), key = `dustrgb/frames/${idB}/picture.jpg`;
  await w.env.R2.put(key, Buffer.from('something else already stored here')); const n = w.puts.length;
  await W.JOBS.dustrgb(w.env, at(18)); const p = await pointer(w);
  ok('G a different file already stored at the pair\'s key: the run fails "picture stored copy differs" and does NOT overwrite it', p.last_attempt && p.last_attempt.reason === 'picture stored copy differs' && w.store.get(key).buf.toString() === 'something else already stored here' && !w.puts.slice(n).some(k => k.startsWith('dustrgb/frames/')) && p.frame.requested_time === TA, [p.last_attempt, w.puts.slice(n)]);
  // and an identical file already there (an earlier run got that far) is reused, not rewritten
  const w2 = world(); use(w2); const idA = pairId(TA, jpeg(Date.parse(TA) / 6e5), mask(Date.parse(TA) / 6e5)); await w2.env.R2.put(`dustrgb/frames/${idA}/picture.jpg`, Buffer.from(jpeg(Date.parse(TA) / 6e5))); const n2 = w2.puts.length;
  await W.JOBS.dustrgb(w2.env, at(6)); const p2 = await pointer(w2);
  ok('G an identical file already stored is reused without a second write; the pair publishes', p2.frame && p2.frame.id === idA && w2.puts.slice(n2).filter(k => k.endsWith('picture.jpg')).length === 0 && w2.puts.slice(n2).filter(k => k.endsWith('mask.png')).length === 1 && await readable(w2, p2.frame), w2.puts.slice(n2)); }

// ---------- H. GPT review 1: a manual run overlapping a scheduled run
{ // both runs fetch the same new time; the inner one finishes first
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame; w.latest = TB; let inner = null;
  w.onFetch = async u => { if (/image\/jpeg/.test(u) && !inner) { inner = 'started'; inner = await W.JOBS.dustrgb(w.env, at(18) + 5000); } };
  await W.JOBS.dustrgb(w.env, at(18)); w.onFetch = null; const p = await pointer(w);
  ok('H two overlapping runs for the same time: one publication (B current, A previous), the other logs "superseded", both pairs readable', p.frame.requested_time === TB && p.previous.id === fA.id && p.last_attempt === null && w.runs.filter(r => /^frame /.test(r.note)).length === 2 && w.runs.filter(r => /^superseded/.test(r.note) && r.status === 'ok').length === 1 && await readable(w, p.frame) && await readable(w, fA), w.runs.map(r => r.note)); }
{ // the outer run holds the OLDER time; the inner publishes a newer one first → the outer must not move the pointer back
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame; w.latest = TB; let done = false;
  w.onFetch = async u => { if (/image\/jpeg/.test(u) && !done) { done = true; w.latest = TC; await W.JOBS.dustrgb(w.env, at(18) + 5000); } };
  await W.JOBS.dustrgb(w.env, at(18)); w.onFetch = null; const p = await pointer(w);
  ok('H the slower run holding an older time does not move the pointer back: C current, A previous, both readable', p.frame.requested_time === TC && p.previous.id === fA.id && /^superseded: another run published 2026-11-13T17:50:00Z first; 2026-11-13T05:50:00Z not published/.test(w.runs.at(-1).note) && await readable(w, p.frame) && await readable(w, fA), [p.frame.requested_time, w.runs.at(-1)]); }
{ // the pointer changes between this run's read and its write (the exact race): the conditional write refuses, the run re-reads
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame; w.latest = TC; let fB = null;
  w.onPointerPut = async () => { const save = w.latest; w.latest = TB; await W.JOBS.dustrgb(w.env, at(18) + 5000); w.latest = save; fB = (await pointer(w)).frame; };
  await W.JOBS.dustrgb(w.env, at(18)); const p = await pointer(w);
  ok('H pointer changed mid-write: the conditional write is refused once, then the run publishes on top of the other run\'s result (C current, B previous)', w.conflicts === 1 && fB && fB.requested_time === TB && p.frame.requested_time === TC && p.previous.id === fB.id, { conflicts: w.conflicts, frame: p.frame.requested_time, prev: p.previous && p.previous.id });
  ok('H after that race every pair the pointer names is readable (the other run\'s cleanup did not delete this run\'s fresh files)', await readable(w, p.frame) && await readable(w, fB), frameKeys(w));
  ok('H A, no longer named, is not served; its files wait for the age limit', (await route(w, fA.picture.path)).status === 404 && w.store.has(`dustrgb/frames/${fA.id}/picture.jpg`)); }
{ // a failure record written while another run publishes must not undo the publication
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); w.latest = TB;
  w.onPointerPut = async () => { await W.JOBS.dustrgb(w.env, at(18) + 5000); };   // the other run publishes B while this one is recording a failure
  await W.dustFail(w.env, at(18), 'picture http error', 503); const p = await pointer(w);
  ok('H a failed run recording its attempt cannot overwrite a publication made in between: B stays current, the attempt is added', w.conflicts === 1 && p.frame.requested_time === TB && p.last_attempt && p.last_attempt.reason === 'picture http error', [w.conflicts, p.frame.requested_time, p.last_attempt]); }

// ---------- E. failures: nothing published, pointer and files unchanged, fixed public reason
const failing = async (name, mut, reason, extra) => {
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const before = await pointer(w), keysBefore = [...w.store.keys()].sort().join();
  w.latest = '2026-11-12T18:00:00Z'; mut(w); const out = await W.JOBS.dustrgb(w.env, at(18)); const after = await pointer(w);
  ok(`E ${name}: frame unchanged, last_attempt recorded with the fixed reason "${reason}"`, JSON.stringify(after.frame) === JSON.stringify(before.frame) && after.last_attempt && after.last_attempt.reason === reason && after.last_attempt.status === 'down' && after.last_attempt.consecutive_failures === 1 && after.last_attempt.run === new Date(at(18)).toISOString(), [out, after.last_attempt]);
  ok(`E ${name}: logged down; the raw detail stays in the run note, not in the pointer`, w.runs.at(-1).status === 'down' && w.runs.at(-1).note.startsWith(reason) && !JSON.stringify(after).includes('(test)'), w.runs.at(-1));
  w.corruptRead = null; const r = await route(w, '/snapshot/dustrgb/meta'), j = await r.json();
  ok(`E ${name}: meta still serves the previous good frame with its original times, and it is readable`, j.frame.id === before.frame.id && j.frame.fetched_at === before.frame.fetched_at && j.last_attempt.reason === reason && await readable(w, before.frame));
  if (extra) await extra(w, before, keysBefore); return w; };
await failing('frame list HTTP 500', w => { w.capStatus = 500; }, 'frame list http error', async w => ok('E frame list HTTP 500: no image request', imgReqs(w).length === 2));
await failing('frame list unreadable', w => { w.capBody = '<html>maintenance</html>'; }, 'frame list unreadable');
await failing('frame list request times out', w => { w.throwOn = /GetCapabilities/; }, 'frame list request failed', async w => ok('E frame list times out: no image request follows', imgReqs(w).length === 2));
{ const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); ok('E the frame-list request carries its own time limit (an abort signal); the limit is 30 s', w.signals[0] === true && W.DUSTRGB.LIST_TIMEOUT_MS === 30000, w.signals); }
await failing('picture answered with HTTP 200 + XML error', w => { w.pic = { body: '<ServiceExceptionReport/>', type: 'text/xml;charset=UTF-8' }; }, 'picture not an image', async (w, b, kb) => ok('E XML error: no file written for the new frame', [...w.store.keys()].sort().join() === kb));
await failing('picture HTTP 503', w => { w.pic = { body: 'no', type: 'text/plain', status: 503 }; }, 'picture http error');
await failing('picture wrong dimensions (a real 256-pixel JPEG)', w => { w.pic = { body: jpeg(1, SMALL_JPEG), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('picture truncated (no end marker)', w => { w.pic = { body: jpeg(1).slice(0, -2), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('picture with headers and the right size but no picture data (no scan)', w => { w.pic = { body: jpegNoScan(), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('picture that is only a header (the old suite\'s "success" file)', w => { w.pic = { body: jpegHeaderOnly(), type: 'image/jpeg' }; }, 'picture not a valid image');
await failing('bad mask: not a PNG', w => { w.mask = { body: jpeg(3, SMALL_JPEG), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: no transparency', w => { w.mask = { body: png({ colour: 2 }), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: wrong size', w => { w.mask = { body: png({ w: 320, h: 320 }), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: truncated', w => { w.mask = { body: png({ iend: false }), type: 'image/png' }; }, 'mask not a valid image');
await failing('bad mask: XML error', w => { w.mask = { body: '<ServiceExceptionReport/>', type: 'text/xml' }; }, 'mask not an image');
// GPT review 2: files that pass every structural check and still do not decode
await failing('corrupt mask: right signature, size, alpha type and end marker, but the image data is damaged', w => { w.mask = { body: png({ breakZlib: true }), type: 'image/png' }; }, 'mask does not decode', async (w, b, kb) => ok('E corrupt mask: nothing written', [...w.store.keys()].sort().join() === kb));
await failing('corrupt mask: a chunk checksum is wrong', w => { w.mask = { body: png({ breakCrc: true }), type: 'image/png' }; }, 'mask does not decode');
await failing('mask that decodes but is opaque everywhere (no footprint edge)', w => { w.mask = { body: png({ alpha: () => 255 }), type: 'image/png' }; }, 'mask is not a footprint');
await failing('mask that decodes but is transparent everywhere', w => { w.mask = { body: png({ alpha: () => 0 }), type: 'image/png' }; }, 'mask is not a footprint');
await failing('served-time header names another frame (picture)', w => { w.picWarn = '99 Nearest value used: time=2026-11-12T17:50:00.000Z ISO8601 (mtg_fd:rgb_dust)'; }, 'picture served time differs');
await failing('served-time header names another frame (mask)', w => { w.warn = '99 Nearest value used: time=2026-11-12T17:50:00.000Z ISO8601 (mtg_fd:rgb_dust)'; w.picWarn = 'echo'; }, 'mask served time differs');
{ // partial write: the picture is stored, the mask write fails → pointer unchanged; the orphan is never served and goes once it is old
  const T2 = '2026-11-12T18:00:00Z', orphanId = pairId(T2, jpeg(Date.parse(T2) / 6e5), mask(Date.parse(T2) / 6e5));
  const w = await failing('partial write (mask put fails)', w => { w.putFail = 'mask.png'; }, 'mask write failed', async w => ok('E partial write: the orphan picture exists but is not served (its pair is not in the pointer)', w.store.has(`dustrgb/frames/${orphanId}/picture.jpg`) && (await route(w, `/snapshot/dustrgb/${orphanId}/picture.jpg`)).status === 404));
  w.putFail = null; w.latest = TB; w.age(3 * 3600e3); await W.JOBS.dustrgb(w.env, at(6) + 864e5); const p = await pointer(w);
  ok('E after a partial write, the next good run publishes, clears last_attempt and removes the (now old) orphan', p.frame.requested_time === TB && p.last_attempt === null && !w.store.has(`dustrgb/frames/${orphanId}/picture.jpg`), [...w.store.keys()]); }
await failing('picture request times out', w => { w.throwOn = /image\/jpeg/; }, 'picture request failed', async (w, b, kb) => ok('E picture times out: nothing written; no mask request follows', [...w.store.keys()].sort().join() === kb && imgReqs(w).length === 3, imgReqs(w)));
await failing('mask request times out', w => { w.throwOn = /image\/png/; }, 'mask request failed');
{ const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); ok('E both image requests carry a time limit (an abort signal); the limit is 90 s', imgReqs(w).length === 2 && w.signals.slice(-2).every(Boolean) && W.DUSTRGB.TIMEOUT_MS === 90000, w.signals); }
await failing('read-back differs (picture)', w => { w.corruptRead = 'picture.jpg'; }, 'picture read-back differs');
await failing('read-back differs (mask)', w => { w.corruptRead = 'mask.png'; }, 'mask read-back differs');
{ // an uncaught throw goes through guarded(): never the generic writeDown
  const w = await failing('uncaught error inside the job', w => { w.brokenResponse = true; }, 'internal error');
  ok('E uncaught error: no generic down envelope written (no latest/ or latest-cells/ object)', ![...w.store.keys()].some(k => /^(latest|latest-cells)\//.test(k)), [...w.store.keys()]); }
{ const w = world(); use(w); w.capStatus = 502; await W.JOBS.dustrgb(w.env, at(6)); const p = await pointer(w); const j = await (await route(w, '/snapshot/dustrgb/meta')).json();
  ok('E first run ever fails: pointer has no frame, only the attempt; meta says so', p.frame === null && p.last_attempt.reason === 'frame list http error' && j.frame === null && j.last_attempt.consecutive_failures === 1, p);
  w.capStatus = 500; await W.JOBS.dustrgb(w.env, at(18)); ok('E consecutive failures count up', (await pointer(w)).last_attempt.consecutive_failures === 2);
  w.capStatus = 200; await W.JOBS.dustrgb(w.env, at(6) + 864e5); ok('E then a good run publishes and clears the attempt', (await pointer(w)).frame.requested_time === TA && (await pointer(w)).last_attempt === null); }
{ const w = world(); use(w); const j = await (await route(w, '/snapshot/dustrgb/meta')).json(); ok('meta before any run: frame null, 200, and reading it stores nothing', j.frame === null && j.last_attempt === null && w.store.size === 0); }
{ // GPT review 2, stated limit: a picture whose structure is intact but whose compressed data is ruined IS published by the hub
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); const fA = (await pointer(w)).frame; w.latest = TB; w.pic = { body: jpegDamagedScan(), type: 'image/jpeg' };
  await W.JOBS.dustrgb(w.env, at(18)); const p = await pointer(w);
  ok('KNOWN LIMIT picture with intact structure and ruined picture data: the hub cannot tell and publishes it — but the good pair is kept as "previous" and stays readable for the page to fall back on', p.frame.requested_time === TB && p.previous.id === fA.id && await readable(w, fA) && /picture structure only/.test(p.frame.checked), [p.frame.requested_time, p.previous && p.previous.id]); }

// ---------- F. the served-time header, if it ever arrives
{ const w = world(); use(w); w.warn = 'echo'; await W.JOBS.dustrgb(w.env, at(6)); const f = (await pointer(w)).frame;
  ok('F header present and agreeing on both files: served_time recorded with its source', f.served_time === TA && f.served_time_source === 'server Warning header' && /served time named by the server/.test(f.time_basis) && f.picture.warning_header_present === true && /header present \(picture\), present \(mask\)/.test(w.runs[0].note), f); }
{ const w = world(); use(w); w.picWarn = 'echo'; await W.JOBS.dustrgb(w.env, at(6)); const f = (await pointer(w)).frame;
  ok('F header on only one file: published, but served_time stays null (counted as absent, not as a mismatch)', f && f.served_time === null && f.picture.warning_header_present === true && f.mask.warning_header_present === false, f); }
{ // success after failure keeps nothing stale
  const w = world(); use(w); await W.JOBS.dustrgb(w.env, at(6)); w.capStatus = 500; await W.JOBS.dustrgb(w.env, at(18)); w.capStatus = 200; await W.JOBS.dustrgb(w.env, at(6) + 864e5);
  ok('an unchanged-frame run after a failure clears last_attempt', (await pointer(w)).last_attempt === null); }

globalThis.fetch = realFetch;
console.log(`dustrgb-hub: ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
