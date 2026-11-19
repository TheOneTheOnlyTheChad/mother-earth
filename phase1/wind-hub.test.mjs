/* Wind hub job and routes (hub 0.6.17; GLOBAL-WIND-BUILD-PROPOSAL rev 2, §11 governs).
 * The real worker.js runs against a fake R2 (etags, conditional puts, switchable faults), a recording D1 and a stubbed NOAA mirror.
 * Nothing here reaches the network and nothing outside Node's standard library is used.
 * The GRIB2 messages are written by this file's own encoder (template 5.3, second-order differencing, the real 1440 x 721 grid), so
 * each test run can have its own values. The decoder's agreement with ecCodes on REAL NOAA bytes is the gate record
 * (docs/research/GLOBAL-WIND-GATE-2026-11-16.md); set WIND_REAL_DIR to a folder holding msg0..msg5.grib2 and ref-meta.json of that
 * run to repeat the summary check here.
 * Run: node --no-warnings phase1/wind-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored manual-gated no-range-check no-etag-check no-length-check no-readback grid-overwrite run-keys no-cas
 *   create-unconditional late-run-wins move-on-fail any-grid no-integrity wind-first skip-run-check poll-when-held no-timeout
 *   generic-down decoder-drift accept-nonfinite note-unordered clear-newer-note seen-in-note late-note-kept plain-ran clear-on-first-read seen-late row-own-seen range-cf0 range-no-setting */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const x = env.WIND_ENABLED !== '1' ?", 'const x = false ?'],
  'manual-gated': ["  wind: async (env, ms) => runWind(env, ms),", "  wind: async (env, ms) => env.WIND_ENABLED !== '1' ? 'wind:not scheduled' : runWind(env, ms),"],
  'no-range-check': ["if (res.status !== 206 || cr !== `bytes ${r.start}-${r.end}/${total}` || cl !== r.len || et !== etag) {", 'if (res.status !== 206 && res.status !== 200) {'],
  'no-etag-check': ['|| cl !== r.len || et !== etag) {', '|| cl !== r.len) {'],
  'no-length-check': ["  if (buf.length !== r.len) return { ok: false, reason: 'field body length differs', http: 206, detail: `${buf.length} of ${r.len}` };\n", ''],
  'no-readback': ["      had = await stored();                                 // read back whether this run or another one created it", "      had = 'same';"],
  'grid-overwrite': ["    if (had === 'absent') {\n      try { await env.R2.put(key, buf, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { sha256: sha, run, level: WIND.LEVELS[i].id }, onlyIf: { etagDoesNotMatch: '*' } }); }", "    {\n      try { await env.R2.put(key, buf, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { sha256: sha, run, level: WIND.LEVELS[i].id } }); }"],
  'run-keys': ["const buf = grids[i].buffer, sha = await sha256Bytes(buf), key = WIND.GRIDS + sha + '.i16';", "const buf = grids[i].buffer, sha = await sha256Bytes(buf), key = WIND.GRIDS + run + '-' + WIND.LEVELS[i].id + '.i16';"],
  'no-cas': ["    const r = await env.R2.put(WIND.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });", "    const r = await env.R2.put(WIND.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? undefined : { etagDoesNotMatch: '*' } });"],
  'create-unconditional': ["    const r = await env.R2.put(WIND.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });", "    const r = await env.R2.put(WIND.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : undefined });"],
  'late-run-wins': ['  const up = await windUpdate(env, c => { if (c.current && c.current.run >= run) return null;', '  const up = await windUpdate(env, c => { if (false) return null;'],
  'move-on-fail': ["    return { ...cur, seen: keepSeen, last_attempt: { started, failed_at, status: 'down',", "    return { ...cur, current: null, seen: keepSeen, last_attempt: { started, failed_at, status: 'down',"],
  'any-grid': ['  const x = [cur.current, cur.previous].filter(Boolean).flatMap(r => r.levels).find(l => l.sha256 === m[1]);\n  if (!x) return none(404, \'not found\');', "  const x = { key: WIND.GRIDS + m[1] + '.i16', bytes: WIND.GRID_BYTES, sha256: m[1] };"],
  'no-integrity': ["  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');\n  return new Response(buf, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': WIND.CACHE_FILE,", "  return new Response(buf, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': WIND.CACHE_FILE,"],
  'wind-first': null,
  'skip-run-check': ['dec = GRIBWIND.decode(got.buf); GRIBWIND.checkField(dec, GRIBWIND.WIND_FIELDS[f], cycle); }', 'dec = GRIBWIND.decode(got.buf); }'],
  'poll-when-held': ['    if (held && c <= held) break;                          // nothing newer can be found from here on: no request\n', ''],
  'no-timeout': ["Range: `bytes=${r.start}-${r.end}` }, cache: 'no-store', signal: AbortSignal.timeout(WIND.TIMEOUT_MS) });", "Range: `bytes=${r.start}-${r.end}` }, cache: 'no-store' });"],
  'generic-down': ["    else if (layer === 'wind') { try { await windFail(env, ms, 'internal error', 0, note); } catch (_) {} }   // 0.6.16: never the generic writeDown\n", ''],
  'note-unordered': ["    const record = windNoteRelevant(note, cur.current) && (!la || la.started <= started);", '    const record = true;'],
  'clear-newer-note': ["c => c.last_attempt && c.last_attempt.started <= started ? { ...c, last_attempt: null } : null);", "c => c.last_attempt ? { ...c, last_attempt: null, seen: null } : null);"],
  'seen-in-note': ["return { ...windEmpty(), current, previous: brief(c.current), seen: c.seen && c.seen.run > run ? c.seen : null,", "return { ...windEmpty(), current: { ...current, times: { ...current.times, index_first_seen: seen.index_first_seen } }, previous: brief(c.current), seen: c.seen && c.seen.run > run ? c.seen : null,"],
  'late-note-kept': ["last_attempt: windNoteRelevant(c.last_attempt, current) ? c.last_attempt : null }; });", "last_attempt: c.last_attempt }; });"],
  'plain-ran': ["async function runWind(env, ms) { let r = null; const g = await guarded(env, 'wind', ms, async (e, m) => { r = await collectWind(e, m); }); return r || g; }", "async function runWind(env, ms) { return guarded(env, 'wind', ms, collectWind); }"],
  'clear-on-first-read': ["    await windUpdate(env, c => c.last_attempt && c.last_attempt.started <= started ? { ...c, last_attempt: null } : null);", "    if (cur.last_attempt) await windUpdate(env, c => c.last_attempt && c.last_attempt.started <= started ? { ...c, last_attempt: null } : null);"],
  'seen-late': ["    const held2 = up.wrote ? up.body.seen : up.cur.seen; if (held2 && held2.run === run) seen = held2; }", "    const held2 = up.wrote ? up.body.seen : up.cur.seen; if (held2 && held2.run === run) seen = held2; if (up.wrote) await windUpdate(env, c => ({ ...c, seen: up.cur.seen || null })); }"],
  'range-cf0': ["Range: `bytes=${r.start}-${r.end}` }, cache: 'no-store', signal:", "Range: `bytes=${r.start}-${r.end}` }, cf: { cacheTtl: 0 }, signal:"],
  'range-no-setting': ["Range: `bytes=${r.start}-${r.end}` }, cache: 'no-store', signal:", "Range: `bytes=${r.start}-${r.end}` }, signal:"],
  'row-own-seen': ["`run ${run} published; index first seen ${up.body.current.times.index_first_seen};", "`run ${run} published; index first seen ${seen.index_first_seen};"],
  'decoder-drift': ["  if (!Number.isFinite(R)) no('packing reference value is not a finite number');\n  if (Math.abs(E) > 30)", "  if (Math.abs(E) > 30)"],
  'accept-nonfinite': ["    if (!(Math.abs(v) <= maxAbs)) no(Number.isFinite(v) ? `decoded value ${v} at point ${n} is beyond ${maxAbs}` : `decoded value at point ${n} is not a finite number`);\n", ''],
};
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const PRISTINE = src;
if (BREAK) {
  if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  if (BREAK === 'wind-first') { const a = '    const b = await hourlyBatch(env, ms);\n', i = src.indexOf(a), m = /    const x = env\.WIND_ENABLED[^\n]*\n/.exec(src);
    if (i < 0 || !m || m.index < i) { console.log('FAIL  break did not apply: wind-first'); process.exit(1); }
    src = src.replace(m[0], '').replace(a, m[0] + a); }
  else { const b = BREAKS[BREAK]; if (!src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); }
}
const tmp = path.join(os.tmpdir(), `worker-wind-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 600) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b.buffer ? new Uint8Array(b.buffer, b.byteOffset || 0, b.byteLength) : b)).digest('hex');

// ---------- a GRIB2 writer for the test (grid template 3.0, product 4.0, data 5.3 with second-order differencing)
const NI = 1440, NJ = 721, NP = NI * NJ;
const FIELDS = [[2, 103, 10], [3, 103, 10], [2, 100, 25000], [3, 100, 25000], [2, 100, 1000], [3, 100, 1000]];
function grib({ f, run, values, fcst = 0, D = 1, mut = null }) {
  const [number, sType, sVal] = FIELDS[f];
  const X = new Int32Array(NP); let mn = Infinity; for (let n = 0; n < NP; n++) { const v = Math.round(values(n) * 10 ** D); X[n] = v; if (v < mn) mn = v; }
  for (let n = 0; n < NP; n++) X[n] -= mn;
  const e = new Float64Array(NP); let minsd = Infinity;
  for (let n = 2; n < NP; n++) { const d = X[n] - 2 * X[n - 1] + X[n - 2]; e[n] = d; if (d < minsd) minsd = d; }
  for (let n = 2; n < NP; n++) e[n] -= minsd;
  const L = 64, NG = Math.ceil(NP / L), gref = new Int32Array(NG), gw = new Uint8Array(NG); let maxRef = 0, maxW = 0;
  for (let g = 0; g < NG; g++) { let lo = Infinity, hi = -Infinity; for (let n = g * L; n < Math.min(NP, g * L + L); n++) { if (e[n] < lo) lo = e[n]; if (e[n] > hi) hi = e[n]; }
    gref[g] = lo; gw[g] = hi === lo ? 0 : Math.floor(Math.log2(hi - lo)) + 1; if (lo > maxRef) maxRef = lo; if (gw[g] > maxW) maxW = gw[g]; }
  const bitsOf = v => v === 0 ? 1 : Math.floor(Math.log2(v)) + 1, nbits = bitsOf(maxRef), bitsW = bitsOf(maxW), bitsL = 1, lastL = NP - (NG - 1) * L, nOct = 3;
  const bytes = []; let acc = 0, nb = 0;
  const wr = (v, n) => { for (let i = n - 1; i >= 0; i--) { acc = (acc << 1) | ((Math.floor(v / 2 ** i)) & 1); if (++nb === 8) { bytes.push(acc); acc = 0; nb = 0; } } };
  const align = () => { if (nb) { bytes.push(acc << (8 - nb)); acc = 0; nb = 0; } };
  const sm = (v, n) => v < 0 ? 2 ** (n * 8 - 1) + (-v) : v;
  wr(sm(X[0], nOct), 24); wr(sm(X[1], nOct), 24); wr(sm(minsd, nOct), 24);
  for (let g = 0; g < NG; g++) wr(gref[g], nbits); align();
  for (let g = 0; g < NG; g++) wr(gw[g], bitsW); align();
  for (let g = 0; g < NG; g++) wr(0, bitsL); align();
  for (let g = 0; g < NG; g++) { const w = gw[g]; if (w) for (let n = g * L; n < Math.min(NP, g * L + L); n++) wr(e[n] - gref[g], w); } align();
  const s7 = Buffer.alloc(5 + bytes.length); s7.writeUInt32BE(s7.length, 0); s7[4] = 7; Buffer.from(bytes).copy(s7, 5);
  const s1 = Buffer.alloc(21); s1.writeUInt32BE(21, 0); s1[4] = 1; s1.writeUInt16BE(7, 5); s1[9] = 2; s1[10] = 1; s1[11] = 1;
  s1.writeUInt16BE(+run.slice(0, 4), 12); s1[14] = +run.slice(4, 6); s1[15] = +run.slice(6, 8); s1[16] = +run.slice(8); s1[20] = 1;
  const s3 = Buffer.alloc(72); s3.writeUInt32BE(72, 0); s3[4] = 3; s3.writeUInt32BE(NP, 6); s3[14] = 6; s3.writeUInt32BE(NI, 30); s3.writeUInt32BE(NJ, 34);
  s3.writeUInt32BE(0xFFFFFFFF, 42); s3.writeUInt32BE(90000000, 46); s3.writeUInt32BE(0, 50); s3[54] = 48; s3.writeUInt32BE((0x80000000 + 90000000) >>> 0, 55); s3.writeUInt32BE(359750000, 59); s3.writeUInt32BE(250000, 63); s3.writeUInt32BE(250000, 67);
  const s4 = Buffer.alloc(34); s4.writeUInt32BE(34, 0); s4[4] = 4; s4[9] = 2; s4[10] = number; s4[11] = 2; s4[17] = 1; s4.writeUInt32BE(fcst, 18); s4[22] = sType; s4.writeUInt32BE(sVal, 24); s4[28] = 255;
  const s5 = Buffer.alloc(49); s5.writeUInt32BE(49, 0); s5[4] = 5; s5.writeUInt32BE(NP, 5); s5.writeUInt16BE(3, 9); s5.writeFloatBE(mn, 11); s5.writeUInt16BE(D, 17); s5[19] = nbits; s5[21] = 1;
  s5.writeUInt32BE(NG, 31); s5[36] = bitsW; s5.writeUInt32BE(L, 37); s5[41] = 1; s5.writeUInt32BE(lastL, 42); s5[46] = bitsL; s5[47] = 2; s5[48] = nOct;
  const s6 = Buffer.from([0, 0, 0, 6, 6, 255]);
  const parts = [s1, s3, s4, s5, s6, s7]; if (mut) mut({ s1, s3, s4, s5, s6, s7 });
  const total = 16 + parts.reduce((a, p) => a + p.length, 0) + 4, s0 = Buffer.alloc(16); s0.write('GRIB', 0, 'latin1'); s0[7] = 2; s0.writeUInt32BE(total, 12);
  return new Uint8Array(Buffer.concat([s0, ...parts, Buffer.from('7777', 'latin1')]));
}
/** smooth, distinct fields per run and per field; values land on 0.1 m/s steps after rounding */
const fieldFn = (seed, f) => n => { const j = Math.floor(n / NI), i = n % NI, lat = (90 - j * 0.25) * Math.PI / 180, lon = i * 0.25 * Math.PI / 180;
  return (f % 2 === 0 ? 1 : -0.6) * (8 + 3 * (f >> 1)) * Math.cos(lat) * (1 + 0.4 * Math.sin(3 * lon + seed + f)) + 2 * Math.sin(5 * lat + seed) + ((seed * 7 + f) % 5) * 0.3; };
const MSGS = new Map();
function runMsgs(run, seed, opt = {}) { const k = run + ':' + seed + ':' + (opt.tag || ''); if (!MSGS.has(k)) MSGS.set(k, FIELDS.map((_, f) => grib({ f, run: opt.label && opt.label[f] ? opt.label[f] : run, values: fieldFn(seed, f), fcst: opt.fcst && opt.fcst[f] || 0, mut: opt.mut && opt.mut[f] }))); return MSGS.get(k); }
/** what the hub should produce from six messages, computed here independently of worker.js */
function expectGrids(run, seed) { return [0, 1, 2].map(lv => { const g = new Int16Array(360 * 181 * 2); for (const c of [0, 1]) { const fn = fieldFn(seed, lv * 2 + c);
  for (let j = 0; j < 181; j++) for (let i = 0; i < 360; i++) g[(j * 360 + i) * 2 + c] = Math.round(Math.round(fn(j * 4 * NI + i * 4) * 10) / 10 * 10); } return g; }); }
const NAMES = [['UGRD', '10 m above ground'], ['VGRD', '10 m above ground'], ['UGRD', '250 mb'], ['VGRD', '250 mb'], ['UGRD', '10 mb'], ['VGRD', '10 mb']];
/** a mirror object: junk, then the six messages in a shuffled index order with decoy lines between, then more junk */
function mirrorObject(run, msgs, { drop = -1, dup = -1 } = {}) {
  const order = [4, 5, 2, 3, 0, 1], chunks = [], lines = []; let off = 0, n = 1;
  const add = (buf, v, lev, what = 'anl') => { lines.push(`${n++}:${off}:d=${run}:${v}:${lev}:${what}:`); chunks.push(Buffer.from(buf)); off += buf.length; };
  add(Buffer.alloc(1000, 1), 'PRMSL', 'mean sea level'); add(Buffer.alloc(700, 2), 'UGRD', '10 m above ground', '3 hour fcst'); add(Buffer.alloc(500, 3), 'UGRD', '100 m above ground');
  for (const f of order) { if (f === drop) continue; add(msgs[f], ...NAMES[f]); if (f === dup) add(msgs[f], ...NAMES[f]); add(Buffer.alloc(300, 9), 'TMP', NAMES[f][1]); }
  add(Buffer.alloc(2000, 4), 'HGT', '0C isotherm');
  const body = Buffer.concat(chunks);
  return { body, idx: lines.join('\n') + '\n', etag: '"' + crypto.createHash('md5').update(body).digest('hex') + '"', modified: 'Mon, 16 Nov 2026 03:48:31 GMT' };
}

// ---------- fakes
const STATS = { pointerPuts: 0, unconditionalPointerPuts: 0, deletes: 0, gridPuts: 0, unconditionalGridPuts: 0 };
function world() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, order: [], mirror: new Map(), putFail: null, corruptRead: null, throwOn: null, signals: [], conflicts: 0, onPointerPut: null, onGridPut: null, onFetch: null, puts: [], fault: null, idxStatus: null };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.startsWith(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body.buffer, body.byteOffset || 0, body.byteLength));
      if (key === W.WIND.POINTER) { STATS.pointerPuts++; if (!opts.onlyIf) STATS.unconditionalPointerPuts++; if (w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); } }
      if (key.startsWith(W.WIND.GRIDS)) { STATS.gridPuts++; if (!opts.onlyIf) STATS.unconditionalGridPuts++; if (w.onGridPut) { const f = w.onGridPut; w.onGridPut = null; await f(key); } }
      if (opts.onlyIf) { const had = store.get(key); const refused = opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches); if (refused) { w.conflicts++; return null; } }
      w.puts.push(key); store.set(key, { buf, opts, etag: etagOf(buf) }); return { key, etag: etagOf(buf) }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.startsWith(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 3] ^= 0xff; }
      return { body: buf, etag: o.etag, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; },
    async delete(key) { STATS.deletes++; store.delete(key); },
  };
  const DB = { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) { runs.push({ layer: a[0], status: a[3], http: a[4], records: a[5], bytes: a[6], note: a[7] }); w.order.push('run:' + a[0]); } if (/INSERT INTO batch_runs/.test(sql)) w.order.push('batch'); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
  w.env = { R2, DB, WIND_ENABLED: '1', ADMIN_KEY: 'k-test' };
  w.publish = (run, seed, opt) => { const m = mirrorObject(run, runMsgs(run, seed, opt), opt); w.mirror.set(run, m); return m; };
  w.fetch = async (url, init = {}) => { const u = String(url);
    if (!u.startsWith(W.WIND.HOST)) { w.order.push('other'); throw new Error('unexpected fetch ' + u); }
    w.order.push('wind'); const range = init.headers && init.headers.Range, kind = u.endsWith('.idx') ? 'idx' : init.method === 'HEAD' ? 'head' : 'range';
    reqs.push({ u, kind, range, cf: init.cf, cache: init.cache, ua: init.headers && init.headers['User-Agent'] }); w.signals.push(!!init.signal);
    if (w.throwOn && w.throwOn === kind) throw new Error('The operation was aborted due to timeout (test)');
    if (w.onFetch) await w.onFetch(kind, u);
    const run = /gfs\.(\d{8})\/(\d\d)\//.exec(u), m = run && w.mirror.get(run[1] + run[2]);
    let pulled = false; const body = b => new ReadableStream({ pull(c) { pulled = true; c.enqueue(new Uint8Array(b)); c.close(); } }, { highWaterMark: 0 });   // nothing is produced until the body is actually read
    const res = (status, headers, b) => { const r = b === null ? new Response(null, { status, headers }) : new Response(body(b), { status, headers }); r.__pulled = () => pulled; w.last = r; return r; };
    if (kind === 'idx') { if (w.idxStatus) return res(w.idxStatus, { 'content-length': '10' }, Buffer.from('error page')); if (!m) return res(404, { 'content-length': '9' }, Buffer.from('not found'));
      const t = Buffer.from(w.fault === 'idx-huge' ? 'x'.repeat(300000) : m.idx); return res(200, { 'content-length': String(t.length) }, t); }
    if (!m) return res(404, {}, Buffer.from('nf'));
    if (kind === 'head') return res(w.fault === 'head-500' ? 500 : 200, { 'content-length': String(m.body.length), etag: m.etag, 'last-modified': m.modified }, null);
    const [s, e] = range.slice(6).split('-').map(Number), part = m.body.subarray(s, e + 1), H = { 'content-range': `bytes ${s}-${e}/${m.body.length}`, 'content-length': String(part.length), etag: m.etag };
    if (w.fault === 'full-200') return res(200, { 'content-length': String(m.body.length), etag: m.etag }, m.body);
    if (w.fault === 'wrong-range') return res(206, { ...H, 'content-range': `bytes 0-${part.length - 1}/${m.body.length}` }, m.body.subarray(0, part.length));
    if (w.fault === 'etag-changed') return res(206, { ...H, etag: '"replaced"' }, part);
    if (w.fault === 'short-header') return res(206, { ...H, 'content-length': String(part.length - 5) }, part.subarray(0, part.length - 5));
    if (w.fault === 'short-body') return res(206, H, part.subarray(0, part.length - 7));
    return res(206, H, part); };
  return w;
}
const realFetch = globalThis.fetch; const use = w => { globalThis.fetch = w.fetch; };
const at = (d, h, m = 7) => Date.UTC(2026, 10, d, h, m);
const manifest = async w => { const o = await w.env.R2.get(W.WIND.POINTER); return o ? o.json() : null; };
const gridKeys = w => [...w.store.keys()].filter(k => k.startsWith(W.WIND.GRIDS)).sort();
const windRuns = w => w.runs.filter(r => r.layer === 'wind');
const call = async (w, pathname) => W.default.fetch(new Request('https://hub.test' + pathname), w.env, { waitUntil() {} });

// ---------- 0. the embedded decoder is the reviewed file
{ const g = fs.readFileSync(path.join(HERE, 'gribwind.mjs'), 'utf8').replace(/^export /gm, '').replace(/\n+$/, '');
  const a = PRISTINE.indexOf('const GRIBWIND = (() => {\n'), b = PRISTINE.indexOf('\nreturn { decode, checkField, decodeWindBatch, GribRefused, WIND_FIELDS, GFS_0P25, MAX_ABS_MS };');
  ok('0 worker.js carries phase1/gribwind.mjs unchanged (the word "export" removed)', a > 0 && b > a && PRISTINE.slice(a + 'const GRIBWIND = (() => {\n'.length, b) === g);
  const research = path.join(HERE, '../docs/research/global-wind-gate/gribwind.mjs');
  ok('0 phase1/gribwind.mjs is the gate-reviewed decoder rev 2, byte for byte', fs.existsSync(research) && sha(fs.readFileSync(research)) === sha(fs.readFileSync(path.join(HERE, 'gribwind.mjs'))) && sha(fs.readFileSync(research)).startsWith('f1bd75e650d1'));
  // decoder-drift and accept-nonfinite weaken the embedded copy; this behavioural check catches them without comparing text
  const m = runMsgs('2026111600', 1)[0], bad = Buffer.from(m); let o = 16; while (bad[o + 4] !== 5) o += bad.readUInt32BE(o); bad.set([0x7f, 0xc0, 0, 0], o + 11);
  let refused = false; try { W.GRIBWIND.decode(new Uint8Array(bad)); } catch (e) { refused = e instanceof W.GRIBWIND.GribRefused; }
  ok('0 the embedded decoder refuses a not-a-number packing reference', refused);
  const d = W.GRIBWIND.decode(m); let worst = 0; const fn = fieldFn(1, 0); for (let n = 0; n < NP; n += 997) worst = Math.max(worst, Math.abs(d.values[n] - Math.round(fn(n) * 10) / 10));
  ok('0 the test writer and the decoder agree on a field (sampled every 997th point)', worst < 1e-9 && d.values.length === NP, worst); }

// ---------- A. the gate and the two paths
{ const w = world(); use(w); delete w.env.WIND_ENABLED; const RNOW = W.windCandidates(Date.now())[1]; w.publish(RNOW, 1);   // the admin route runs at the real clock: use a run it can find
  const r = await W.JOBS.hourly(w.env, at(16, 6), false);
  ok('A flag unset, scheduled hour: zero NOAA requests, nothing stored, no run row', w.reqs.length === 0 && !(await manifest(w)) && gridKeys(w).length === 0 && windRuns(w).length === 0 && /not scheduled \(WIND_ENABLED unset\)/.test(r.wind), [w.reqs.length, r.wind]);
  const res = await call(w, '/admin/run/wind'); ok('A manual path without the admin key: 403, zero requests', res.status === 403 && w.reqs.length === 0, res.status);
  const res2 = await call(w, '/admin/run/wind?key=wrong'); ok('A manual path with a wrong key: 403, zero requests', res2.status === 403 && w.reqs.length === 0);
  const res3 = await call(w, '/admin/run/wind?key=k-test'), j3 = await res3.json(), m = await manifest(w);
  ok('A manual path with the admin key and the flag unset: runs once and publishes', res3.status === 200 && j3.result === 'wind:published ' + RNOW && m && m.current.run === RNOW && gridKeys(w).length === 3, j3);
  // the admin route runs at the real clock, so newer runs that are not on the test mirror are each looked for once (404) first
  ok('A that manual run went to one host: index lookups, then 1 object check and 6 ranges', w.reqs.filter(q => q.kind === 'range').length === 6 && w.reqs.filter(q => q.kind === 'head').length === 1 && w.reqs.filter(q => q.kind === 'idx').length >= 1 && w.reqs.every(q => q.u.startsWith(W.WIND.HOST)), w.reqs.map(q => q.kind));
  const before = w.reqs.length; const r2 = await W.JOBS.hourly(w.env, at(16, 7), false);
  ok('A flag still unset after a manual publication: the next scheduled hour makes zero requests', w.reqs.length === before && /not scheduled/.test(r2.wind)); }
{ const w = world(); use(w); w.publish('2026111600', 1);
  const rm = await W.JOBS.hourly(w.env, at(16, 6), true);
  ok('A flag on, MANUAL hourly run: wind skipped, no request', w.reqs.length === 0 && /skipped \(manual hourly run\)/.test(rm.wind), rm.wind);
  w.order.length = 0; const r = await W.JOBS.hourly(w.env, at(16, 6), false);
  ok('A flag on, scheduled hour: runs and publishes, and the result says which run', r.wind === 'wind:published 2026111600' && (await manifest(w)).current.run === '2026111600', r.wind);
  const first = w.order.indexOf('wind'), others = w.order.map((x, i) => [x, i]).filter(([x]) => x === 'other' || (x.startsWith('run:') && x !== 'run:wind'));
  ok('A order: the hourly batch and every other request and run record are done BEFORE the first NOAA request', first > 0 && w.order.includes('batch') && w.order.indexOf('batch') < first && others.every(([, i]) => i < first), { first, batch: w.order.indexOf('batch') }); }

// ---------- B. one clean publication
{ const w = world(); use(w); const mo = w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  const m = await manifest(w), c = m.current, exp = expectGrids('2026111600', 1), keys = gridKeys(w);
  ok('B manifest: schema, layer, run, valid time, forecast hour 0', m.schema === 1 && m.layer === 'wind' && c.run === '2026111600' && c.run_time === '2026-11-16T00:00:00Z' && c.valid_time === '2026-11-16T00:00:00Z' && c.forecast_hour === 0 && m.previous === null && m.last_attempt === null, c);
  ok('B three levels in order, each 260,640 bytes', c.levels.map(l => l.id).join() === 'near-ground,250hPa,10hPa' && c.levels.every(l => l.bytes === 260640));
  ok('B each grid is stored under its own SHA-256 and hashes to it', c.levels.every(l => l.key === W.WIND.GRIDS + l.sha256 + '.i16' && sha(w.store.get(l.key).buf) === l.sha256) && keys.length === 3);
  ok('B the stored grids equal the grids computed independently in this file', c.levels.every((l, i) => l.sha256 === sha(exp[i])), c.levels.map((l, i) => [l.sha256.slice(0, 8), sha(exp[i]).slice(0, 8)]));
  ok('B six message records with hashes of the fetched bytes', c.messages.length === 6 && c.messages.every((x, f) => x.key === W.GRIBWIND.WIND_FIELDS[f].key && x.sha256 === sha(runMsgs('2026111600', 1)[f])));
  ok('B source: object, size, ETag, index hash, credit and the modified-data statement', c.source.object === 'gfs.20261116/00/atmos/gfs.t00z.pgrb2.0p25.f000' && c.source.object_bytes === mo.body.length && c.source.object_etag === mo.etag && c.source.index_sha256 === sha(Buffer.from(mo.idx)) && c.source.credit === 'NOAA/NCEP GFS' && /sampled from the 0\.25 degree grid .* quantised to 0\.1 m\/s\. Not original, unaltered NOAA data/.test(c.source.modified), c.source);
  ok('B grid description: reduction, encoding, order', /whole degree/.test(c.grid.reduction) && c.grid.encoding.scale_m_s === 0.1 && c.grid.display.w === 360 && c.grid.display.h === 181 && c.grid.encoding.per_cell.join() === 'u eastward,v northward');
  const t = c.times; ok('B three times logged, in order: index first seen <= fields fetched <= published', t.index_first_seen && t.fields_fetched && t.published && t.index_first_seen <= t.fields_fetched && t.fields_fetched <= t.published, t);
  const row = windRuns(w).pop(); ok('B run row: ok, 3 records, bytes, and a note carrying the three times and the request count', row.status === 'ok' && row.records === 3 && row.bytes === runMsgs('2026111600', 1).reduce((a, x) => a + x.length, 0) && /run 2026111600 published; index first seen .*; fields fetched .*; published .*; 8 requests/.test(row.note), row);
  ok('B every request carried a timeout signal', w.signals.length === 8 && w.signals.every(Boolean), w.signals);
  // 0.6.17 (range probe, 16 Nov): a range download must bypass Cloudflare's cache; the cf setting gave headers and no body on the live hub
  { const rg = w.reqs.filter(q => q.kind === 'range'), rest = w.reqs.filter(q => q.kind !== 'range');
    ok('B the six range downloads send cache: no-store and no cf setting', rg.length === 6 && rg.every(q => q.cache === 'no-store' && q.cf === undefined), rg.map(q => ({ cache: q.cache, cf: q.cf })));
    ok('B the index request and the object check keep their setting (cf cacheTtl 0, no cache option)', rest.length === 2 && rest.every(q => q.cf && q.cf.cacheTtl === 0 && q.cache === undefined), rest.map(q => ({ kind: q.kind, cache: q.cache, cf: q.cf })));
    ok('B every request carries the collector User-Agent', w.reqs.every(q => q.ua === 'mother-earth-collector/0.6.20 (open project; github.com/TheOneTheOnlyTheChad)'), w.reqs.map(q => q.ua)); }
  ok('B the grid writes were create-only and the manifest write conditional', STATS.unconditionalGridPuts === 0 && STATS.unconditionalPointerPuts === 0, STATS);
  // same hour again: nothing newer
  const n0 = w.reqs.length; await W.collectWind(w.env, at(16, 5));
  ok('B next hour, same run held and nothing newer can exist yet: no request at all, nothing rewritten', w.reqs.length === n0 + 0 && windRuns(w).pop().status === 'ok' && /no newer run on the mirror: 2026111600 held and kept; 0 request/.test(windRuns(w).pop().note), [w.reqs.length - n0, windRuns(w).pop().note]);
  const n1 = w.reqs.length; await W.collectWind(w.env, at(16, 8));
  ok('B at 08:07 the 06 run is looked for once (404) and the search stops at the held run', w.reqs.length === n1 + 1 && w.reqs[n1].kind === 'idx' && /t06z/.test(w.reqs[n1].u) && (await manifest(w)).current.run === '2026111600', w.reqs.slice(n1).map(q => q.u.slice(-40)));
  // next run arrives
  w.publish('2026111606', 2); await W.collectWind(w.env, at(16, 10)); const m2 = await manifest(w);
  ok('B the next run publishes; current and previous are both in the manifest', m2.current.run === '2026111606' && m2.previous && m2.previous.run === '2026111600' && m2.previous.levels.length === 3 && gridKeys(w).length === 6 && STATS.deletes === 0, [m2.current.run, m2.previous && m2.previous.run]);
  ok('B the previous revision\'s grid objects were not touched', c.levels.every(l => sha(w.store.get(l.key).buf) === l.sha256));
  // routes
  const meta = await (await call(w, '/snapshot/wind/meta')).json();
  ok('B /snapshot/wind/meta: both revisions, no storage keys, a clock', meta.current.run === '2026111606' && meta.previous.run === '2026111600' && meta.now && meta.current.levels.every(l => l.key === undefined && /^\/snapshot\/wind\/grid\/[0-9a-f]{64}\.i16$/.test(l.path)), meta.current.levels[0]);
  const g = await call(w, meta.current.levels[1].path), gb = Buffer.from(await g.arrayBuffer());
  ok('B a current grid is served: bytes, type, immutable cache, ETag', g.status === 200 && sha(gb) === meta.current.levels[1].sha256 && g.headers.get('content-type') === 'application/octet-stream' && /immutable/.test(g.headers.get('cache-control')) && g.headers.get('access-control-allow-origin') === '*');
  ok('B a previous grid is served', (await call(w, meta.previous.levels[0].path)).status === 200);
  w.publish('2026111612', 3); await W.collectWind(w.env, at(16, 16)); const aged = meta.previous.levels[0];
  ok('B a grid that has aged out of the manifest is refused (404) though its object is still stored', (await call(w, aged.path)).status === 404 && w.store.has(W.WIND.GRIDS + aged.sha256 + '.i16'));
  ok('B a hash never published is refused without a storage read of it', (await call(w, '/snapshot/wind/grid/' + 'ab'.repeat(32) + '.i16')).status === 404);
  for (const bad of ['/snapshot/wind/grid/short.i16', '/snapshot/wind/grid/' + 'AB'.repeat(32) + '.i16', '/snapshot/wind/grid', '/snapshot/wind/x/y/z', '/snapshot/wind/2026111612/near-ground.i16']) ok('B malformed path refused: ' + bad, (await call(w, bad)).status === 404);
  const cur = (await manifest(w)).current.levels[2]; w.corruptRead = W.WIND.GRIDS + cur.sha256;
  ok('B a stored grid whose bytes no longer hash to its name is not served (503 integrity)', (await call(w, cur.path)).status === 503); w.corruptRead = null; }
{ const w = world(); use(w); const meta = await (await call(w, '/snapshot/wind/meta')).json();
  ok('B /snapshot/wind/meta before any publication: an empty manifest, not an error', meta.current === null && meta.previous === null && meta.layer === 'wind' && meta.source.credit === 'NOAA/NCEP GFS'); }

// ---------- C. responses refused before the body is read
for (const [fault, why] of [['full-200', 'a full 200 in place of a range'], ['wrong-range', 'a 206 for a different range'], ['etag-changed', 'a 206 from a replaced object'], ['short-header', 'a 206 with a shorter declared length']]) {
  const w = world(); use(w); w.publish('2026111600', 1); w.fault = fault; await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok(`C ${why}: the run fails as "field response refused"`, row.status === 'down' && /^field response refused/.test(row.note), row);
  ok(`C ${why}: the body was never read`, w.last.__pulled() === false);
  ok(`C ${why}: nothing published, no grid stored, one range request only`, !(await manifest(w)).current && gridKeys(w).length === 0 && w.reqs.filter(q => q.kind === 'range').length === 1); }
{ const w = world(); use(w); w.publish('2026111600', 1); w.fault = 'short-body'; await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok('C a body shorter than its headers said: refused, nothing published', row.status === 'down' && /field body (length differs|unreadable)/.test(row.note) && !(await manifest(w)).current, row); }

// ---------- D. upstream failures and recovery
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); const good = (await manifest(w)).current;
  w.publish('2026111606', 2); w.throwOn = 'range'; await W.collectWind(w.env, at(16, 10)); let m = await manifest(w);
  ok('D a hung field request: down, the last good revision is still current', windRuns(w).pop().status === 'down' && /field request failed/.test(windRuns(w).pop().note) && !!m.current && m.current.run === '2026111600' && m.current.levels[0].sha256 === good.levels[0].sha256, windRuns(w).pop());
  ok('D the failure is on the manifest as last_attempt with its run, and the sighting of that run\'s index is recorded apart from it', m.last_attempt && m.last_attempt.status === 'down' && m.last_attempt.reason === 'field request failed' && m.last_attempt.run === '2026111606' && m.last_attempt.consecutive_failures === 1 && m.seen && m.seen.run === '2026111606' && !!m.seen.index_first_seen, [m.last_attempt, m.seen]);
  const seen = m.seen.index_first_seen; await new Promise(r => setTimeout(r, 15)); await W.collectWind(w.env, at(16, 11)); m = await manifest(w);
  ok('D a second failure counts up and keeps the FIRST index-seen time', m.last_attempt.consecutive_failures === 2 && m.seen.index_first_seen === seen, [m.last_attempt, m.seen]);
  const rj = await W.JOBS.wind(w.env, at(16, 11, 30)); ok('D a handled failure is reported by the job as down with its reason, never as a plain "ran"', rj === 'wind:down field request failed', rj);
  w.throwOn = null; await W.collectWind(w.env, at(16, 12)); m = await manifest(w);
  ok('D the next complete run recovers: published, last_attempt cleared, index-first-seen is the earliest sighting', m.current.run === '2026111606' && m.last_attempt === null && m.seen === null && m.current.times.index_first_seen === seen && m.previous.run === '2026111600', [m.current.run, m.current.times.index_first_seen, seen]); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  // 06 and 12 never arrive; 18 does
  w.publish('2026111618', 4); await W.collectWind(w.env, at(16, 22)); const m = await manifest(w);
  ok('D missed runs are passed over: the newest available run is published', m.current.run === '2026111618' && m.previous.run === '2026111600', m.current.run); }
{ const w = world(); use(w); w.throwOn = 'idx'; await W.collectWind(w.env, at(16, 4));
  ok('D index request fails: down "index request failed", nothing stored but the attempt', windRuns(w).pop().status === 'down' && /^index request failed/.test(windRuns(w).pop().note) && !(await manifest(w)).current); }
{ const w = world(); use(w); w.idxStatus = 503; await W.collectWind(w.env, at(16, 4));
  ok('D index answers 503: down "index http error" (not treated as not-yet-there)', windRuns(w).pop().status === 'down' && /^index http error/.test(windRuns(w).pop().note) && w.reqs.length === 1, windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1); w.fault = 'idx-huge'; await W.collectWind(w.env, at(16, 4));
  ok('D an oversized index is refused before it is read', windRuns(w).pop().status === 'down' && /^index http error/.test(windRuns(w).pop().note) && w.last.__pulled() === false); }
{ const w = world(); use(w); w.publish('2026111600', 1); w.fault = 'head-500'; await W.collectWind(w.env, at(16, 4));
  ok('D object check answers 500: down, no range request', windRuns(w).pop().status === 'down' && /^object http error/.test(windRuns(w).pop().note) && w.reqs.filter(q => q.kind === 'range').length === 0); }
{ const w = world(); use(w); await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok('D nothing on the mirror at all: four index requests, an ok row saying so, nothing stored', w.reqs.length === 4 && row.status === 'ok' && /no run found on the mirror; 4 request/.test(row.note) && !(await manifest(w)), row); }
{ const w = world(); use(w); const boom = new Error('boom'); w.env.R2.get = async () => { throw boom; }; const r = await W.JOBS.wind(w.env, at(16, 4));
  ok('D an unexpected throw is recorded as a wind failure, never through the generic writer', /wind:threw/.test(r) && windRuns(w).some(x => x.status === 'down' && /internal error/.test(x.note)) && ![...w.store.keys()].some(k => /^latest\/|^snapshots\//.test(k)), [r, windRuns(w)]); }

// ---------- E. the index and the six fields
{ const w = world(); use(w); w.publish('2026111600', 1, { drop: 3 }); await W.collectWind(w.env, at(16, 4));
  ok('E a field missing from the index: "index unreadable", zero range requests', /^index unreadable — 2026111600 VGRD 250 mb: 0 index lines/.test(windRuns(w).pop().note) && w.reqs.filter(q => q.kind === 'range').length === 0, windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1, { dup: 4 }); await W.collectWind(w.env, at(16, 4));
  ok('E a field listed twice in the index: refused', /^index unreadable — 2026111600 UGRD 10 mb: 2 index lines/.test(windRuns(w).pop().note), windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1, { tag: 'lab', label: { 3: '2026111518' } }); await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok('E one message labelled as another run: refused by the decoder rules, nothing published', row.status === 'down' && /^field refused by the decoder — 2026111600 v250: v250: run is 2026-11-15 18:0/.test(row.note) && !(await manifest(w)).current && gridKeys(w).length === 0, row); }
{ const w = world(); use(w); w.publish('2026111600', 1, { tag: 'fc', fcst: { 5: 3 } }); await W.collectWind(w.env, at(16, 4));
  ok('E one message that is a 3-hour forecast: refused', /field refused by the decoder .* forecast time 3, expected 0/.test(windRuns(w).pop().note), windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1, { tag: 'nan', mut: { 2: s => s.s5.set([0x7f, 0xc0, 0, 0], 11) } }); await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok('E a not-a-number packing reference in one message: refused, nothing published', row.status === 'down' && /packing reference value is not a finite number/.test(row.note) && !(await manifest(w)).current, row); }
{ const w = world(); use(w); w.publish('2026111600', 1, { tag: 'big', mut: { 0: s => s.s5.writeFloatBE(1e6, 11) } }); await W.collectWind(w.env, at(16, 4)); const row = windRuns(w).pop();
  ok('E a finite but absurd wind in one message: refused, nothing published', row.status === 'down' && /is beyond 500/.test(row.note) && !(await manifest(w)).current, row); }
{ const w = world(); use(w); w.publish('2026111600', 1, { tag: 't50', mut: { 1: s => s.s5.writeUInt16BE(0, 9) } }); await W.collectWind(w.env, at(16, 4));
  ok('E a message in another packing (5.0): a clear named failure', /data template 5\.0 not supported/.test(windRuns(w).pop().note), windRuns(w).pop()); }

// ---------- F. storage: immutable grids, the manifest as the only commit point
{ const w = world(); use(w); w.publish('2026111600', 1); w.putFail = W.WIND.GRIDS; await W.collectWind(w.env, at(16, 4));
  ok('F a grid write that throws: down "grid write failed", manifest not moved', /^grid write failed/.test(windRuns(w).pop().note) && !(await manifest(w)).current, windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1); w.corruptRead = W.WIND.GRIDS; await W.collectWind(w.env, at(16, 4));
  ok('F a grid that reads back differently: down "grid stored copy differs", manifest not moved', /^grid stored copy differs/.test(windRuns(w).pop().note) && !(await manifest(w)).current, windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1); const exp = expectGrids('2026111600', 1), key = W.WIND.GRIDS + sha(exp[0]) + '.i16';
  await w.env.R2.put(key, Buffer.alloc(260640, 7));   // something else is already stored under the name this run will compute
  const before = sha(w.store.get(key).buf); await W.collectWind(w.env, at(16, 4));
  ok('F an existing object with a different hash under a grid\'s name: the run fails and the object is NOT overwritten', /^grid stored copy differs/.test(windRuns(w).pop().note) && sha(w.store.get(key).buf) === before && !(await manifest(w)).current, windRuns(w).pop()); }
{ const w = world(); use(w); w.publish('2026111600', 1); const exp = expectGrids('2026111600', 1);
  for (const g of exp) await w.env.R2.put(W.WIND.GRIDS + sha(g) + '.i16', Buffer.from(g.buffer));   // an earlier, interrupted run left all three grids and no manifest
  const puts0 = w.puts.length; await W.collectWind(w.env, at(16, 4)); const m = await manifest(w);
  ok('F grids left by an interrupted run are reused after their hashes are checked; only the manifest is written (the sighting, then the commit)', m.current.run === '2026111600' && w.puts.slice(puts0).join() === [W.WIND.POINTER, W.WIND.POINTER].join(), w.puts.slice(puts0)); }
{ const w = world(); use(w); w.publish('2026111600', 1);
  // two attempts on the same run overlap: the second creates a grid while the first is about to
  w.onGridPut = async key => { const exp = expectGrids('2026111600', 1); const g = exp.find(x => key.endsWith(sha(x) + '.i16')); w.store.set(key, { buf: Buffer.from(g.buffer), opts: {}, etag: 'other' }); };
  await W.collectWind(w.env, at(16, 4)); const m = await manifest(w);
  ok('F two attempts on one run overlap on a grid: the create-only write is refused, the stored bytes are verified and used', m.current.run === '2026111600' && w.conflicts === 1 && m.current.levels.every(l => sha(w.store.get(l.key).buf) === l.sha256), [w.conflicts, m.current && m.current.run]); }
{ const w = world(); use(w); w.publish('2026111600', 1); w.publish('2026111606', 2);
  // an older run (00) finishes late: while it is about to write the manifest, the 06 run publishes
  w.onPointerPut = async () => { const w2fetch = globalThis.fetch; await W.collectWind(w.env, at(16, 10)); globalThis.fetch = w2fetch; };
  const hold = w.mirror.get('2026111606'); w.mirror.delete('2026111606');            // the late run started before 06 was out
  const p = W.collectWind(w.env, at(16, 5)); w.mirror.set('2026111606', hold); await p; const m = await manifest(w);
  ok('F an older run that finishes late never replaces a newer one', m.current.run === '2026111606' && (!m.previous || m.previous.run !== '2026111606'), [m.current.run, m.previous && m.previous.run]);
  ok('F the late run says it was superseded', windRuns(w).some(r => /superseded: 2026111606 is published; 2026111600 not published/.test(r.note)), windRuns(w).map(r => r.note)); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // the conditional write is lost to an unrelated manifest change (a failure note), and the candidate is still newer
  w.onPointerPut = async () => { await W.windFail(w.env, at(16, 9), 'index request failed', 0, 'test'); };
  await W.collectWind(w.env, at(16, 10)); const m = await manifest(w);
  ok('F a lost conditional write with a still-newer candidate: re-read, then advanced', m.current.run === '2026111606' && m.previous.run === '2026111600' && w.conflicts >= 1 && m.last_attempt === null, [m.current.run, w.conflicts]); }
{ const w = world(); use(w); w.publish('2026111600', 1);
  // first manifest: another run creates it between this run's read and its write
  w.onPointerPut = async () => { await w.env.R2.put(W.WIND.POINTER, JSON.stringify({ schema: 1, layer: 'wind', current: { run: '2026111606', levels: [], times: {} }, previous: null, last_attempt: null }), { onlyIf: { etagDoesNotMatch: '*' } }); };
  await W.collectWind(w.env, at(16, 4)); const m = await manifest(w);
  ok('F the first manifest is create-only: a manifest created meanwhile is not overwritten', m.current.run === '2026111606', m.current.run); }
// ---------- H. status ordering when runs overlap (GPT's stage 2 review): both completion orders
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // an EARLIER-started run is part-way through 06 when a LATER-started run publishes 06; then the earlier one fails
  let done = false; w.onFetch = async kind => { if (kind !== 'range' || done) return; done = true; await W.collectWind(w.env, at(16, 11)); w.throwOn = 'range'; };
  const r = await W.collectWind(w.env, at(16, 10)); w.onFetch = null; w.throwOn = null; const m = await manifest(w);
  ok('H older run fails AFTER a newer-started run published the same run: the page gets no "did not complete" note', r === 'wind:down field request failed' && m.current.run === '2026111606' && m.last_attempt === null, [r, m.last_attempt]);
  ok('H that failure is still in the run rows, marked as not noted on the manifest', windRuns(w).some(x => x.status === 'down' && /field request failed .*\(not noted on the manifest: a newer result is already there\)/.test(x.note)), windRuns(w).map(x => x.note));
  ok('H and the published revision is untouched (grids hash to their names)', m.current.levels.every(l => sha(w.store.get(l.key).buf) === l.sha256) && m.previous.run === '2026111600'); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // the other order: the earlier run fails first (noted), then the later one publishes
  w.throwOn = 'range'; await W.collectWind(w.env, at(16, 10)); w.throwOn = null; const m1 = await manifest(w);
  await W.collectWind(w.env, at(16, 11)); const m2 = await manifest(w);
  ok('H the other order: a failure is noted, then the newer result clears it', m1.last_attempt && m1.last_attempt.status === 'down' && m2.last_attempt === null && m2.current.run === '2026111606', [m1.last_attempt, m2.last_attempt]); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  // an anonymous failure (the index could not be asked for) from an attempt that started BEFORE the published revision's own run started
  await W.windFail(w.env, at(16, 3), 'index request failed', 0, 'late report'); const m = await manifest(w);
  ok('H a failure note from an attempt that started before the published revision is not put on the manifest', m.last_attempt === null && windRuns(w).pop().status === 'down', m.last_attempt); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  // an OLDER scan is asking whether 06 exists (it does not yet); meanwhile a LATER-started run finds 06 and fails on it; then the older scan ends cleanly
  let done = false; w.onFetch = async kind => { if (kind !== 'idx' || done) return; done = true; const hold = w.onFetch; w.onFetch = null;
    w.publish('2026111606', 2); w.throwOn = 'range'; await W.collectWind(w.env, at(16, 11)); w.throwOn = null; w.mirror.delete('2026111606'); };
  const r = await W.collectWind(w.env, at(16, 10)); const m = await manifest(w);
  ok('H an older scan that finds nothing new does NOT erase a newer failure', /^wind:no newer run on the mirror/.test(r) && m.last_attempt && m.last_attempt.status === 'down' && m.last_attempt.run === '2026111606' && m.last_attempt.started === new Date(at(16, 11)).toISOString(), [r, m.last_attempt]);
  ok('H nor the time that run\'s index was first seen', m.seen && m.seen.run === '2026111606' && !!m.seen.index_first_seen, m.seen);
  const first = m.seen.index_first_seen; w.publish('2026111606', 2); await new Promise(x => setTimeout(x, 15)); await W.collectWind(w.env, at(16, 12)); const m2 = await manifest(w);
  ok('H when that run is finally published it carries the FIRST sighting, and the note and the sighting are cleared', m2.current.run === '2026111606' && m2.current.times.index_first_seen === first && m2.last_attempt === null && m2.seen === null, [m2.current.times, first]); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  // the other order: a clean scan first, then a later failure
  await W.collectWind(w.env, at(16, 5)); w.idxStatus = 503; await W.collectWind(w.env, at(16, 10)); w.idxStatus = null; let m = await manifest(w);
  ok('H the other order: after a clean scan, a later failure is noted', m.last_attempt && m.last_attempt.reason === 'index http error', m.last_attempt);
  await W.collectWind(w.env, at(16, 11)); m = await manifest(w);
  ok('H and a LATER clean scan clears an earlier failure note', m.last_attempt === null && m.current.run === '2026111600', m.last_attempt);
  w.idxStatus = 503; await W.collectWind(w.env, at(16, 14)); w.idxStatus = null; await W.collectWind(w.env, at(16, 13)); m = await manifest(w);
  ok('H but an EARLIER-started clean scan does not', m.last_attempt && m.last_attempt.started === new Date(at(16, 14)).toISOString(), m.last_attempt); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // this run has already read the manifest when another attempt records an EARLIER sighting of the same run
  const early = '2026-11-16T09:40:00.000Z'; let done = false;
  w.onFetch = async kind => { if (kind !== 'idx' || done) return; done = true; await W.windUpdate(w.env, c => ({ ...c, seen: { run: '2026111606', index_first_seen: early } })); };
  await W.collectWind(w.env, at(16, 10)); const m = await manifest(w);
  ok('H the published revision carries the EARLIEST sighting on the manifest at commit time, not only this run\'s own', m.current.run === '2026111606' && m.current.times.index_first_seen === early && m.seen === null, m.current.times); }
// ----- GPT's re-review of rev 2
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4));
  // a LATER-started scan reads the manifest (no note), and while it waits on the index an EARLIER-started attempt notes a failure
  let done = false; w.onFetch = async kind => { if (kind !== 'idx' || done) return; done = true; await W.windFail(w.env, at(16, 10), 'index request failed', 0, 'earlier attempt'); };
  const mid = []; const r = await W.collectWind(w.env, at(16, 11)); const m = await manifest(w);
  ok('H a later clean scan clears an earlier failure even if the note was written while the scan was waiting', /^wind:no newer run/.test(r) && m.last_attempt === null && windRuns(w).some(x => x.status === 'down' && /earlier attempt/.test(x.note) && !/not noted/.test(x.note)), [r, m.last_attempt]); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // the sighting must be on the manifest before the object check and before any field request
  const at_ = {}; w.onFetch = async kind => { if (!at_[kind]) at_[kind] = (await manifest(w)).seen; };
  w.throwOn = 'range'; await W.collectWind(w.env, at(16, 10)); w.throwOn = null; w.onFetch = null; const m = await manifest(w);
  ok('H the sighting is written as soon as the index is accepted: it is already there at the object check', at_.head && at_.head.run === '2026111606' && !!at_.head.index_first_seen && at_.idx === null, at_);
  ok('H so a run cut short at its first field request has not lost it', m.seen && m.seen.run === '2026111606' && !!at_.head && m.seen.index_first_seen === at_.head.index_first_seen && m.current.run === '2026111600', m.seen); }
{ const w = world(); use(w); w.publish('2026111600', 1); await W.collectWind(w.env, at(16, 4)); w.publish('2026111606', 2);
  // another attempt records an EARLIER sighting after this run wrote its own: the published revision and the run row must agree on the committed value
  const early = '2026-11-16T09:40:00.000Z'; let done = false;
  w.onFetch = async kind => { if (kind !== 'range' || done) return; done = true; await W.windUpdate(w.env, c => ({ ...c, seen: { run: '2026111606', index_first_seen: early } })); };
  await W.collectWind(w.env, at(16, 10)); const m = await manifest(w), row = windRuns(w).pop();
  ok('H the run row logs the sighting from the COMMITTED revision, so the two records agree', m.current.times.index_first_seen === early && row.note.includes('index first seen ' + early + ';'), [m.current.times.index_first_seen, row.note]); }
{ ok('H ordering rule: a note naming a run is ordered by run; one naming none by when its attempt started', W.windNoteRelevant({ run: '2026111606', started: 'a' }, { run: '2026111600', started: 'z' }) && !W.windNoteRelevant({ run: '2026111600', started: 'z' }, { run: '2026111600', started: 'a' }) && W.windNoteRelevant({ run: null, started: '2026-11-16T11' }, { run: '2026111600', started: '2026-11-16T10' }) && !W.windNoteRelevant({ run: null, started: '2026-11-16T09' }, { run: '2026111600', started: '2026-11-16T10' }) && W.windNoteRelevant({ run: null, started: 'x' }, null));
  const S = W.windSeenMerge; ok('H sighting rule: a newer run replaces; the same run keeps the earlier time; an older run never replaces', S(null, { run: 'b', index_first_seen: '2' }).run === 'b' && S({ run: 'b', index_first_seen: '2' }, { run: 'b', index_first_seen: '1' }).index_first_seen === '1' && S({ run: 'b', index_first_seen: '1' }, { run: 'b', index_first_seen: '2' }).index_first_seen === '1' && S({ run: 'b', index_first_seen: '5' }, { run: 'a', index_first_seen: '1' }).run === 'b' && S({ run: 'a', index_first_seen: '1' }, { run: 'b', index_first_seen: '9' }).run === 'b'); }
ok('F across this whole file: no unconditional manifest write, no unconditional grid write by the hub, no delete', STATS.unconditionalPointerPuts === 0 && STATS.deletes === 0 && STATS.pointerPuts > 10, STATS);

// ---------- G. real NOAA bytes, when a folder is given
if (process.env.WIND_REAL_DIR) { const dir = process.env.WIND_REAL_DIR, meta = JSON.parse(fs.readFileSync(path.join(dir, 'ref-meta.json'), 'utf8'));
  for (let i = 0; i < 6; i++) { const b = new Uint8Array(fs.readFileSync(path.join(dir, `msg${i}.grib2`))), d = W.GRIBWIND.decode(b); let mn = Infinity, mx = -Infinity, sum = 0; for (const v of d.values) { if (v < mn) mn = v; if (v > mx) mx = v; sum += v; }
    ok(`G real message ${i}: hash, and min, max and mean equal the saved ecCodes figures`, sha(b) === meta[i].sha256 && Math.abs(mn - meta[i].min) < 1e-9 && Math.abs(mx - meta[i].max) < 1e-9 && Math.abs(sum / d.values.length - meta[i].mean) < 1e-9, [mn, mx]); }
} else console.log('note  section G (real NOAA bytes) not run: set WIND_REAL_DIR');

globalThis.fetch = realFetch;
console.log(`${fail ? 'FAILED' : 'ok'}  wind-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
