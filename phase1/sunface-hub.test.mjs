/* Sun face hub job, probe and routes (hub 0.6.13; MOON-SUN-GLOBES-PROPOSAL rev 2.3 §3.2).
 * The real worker.js runs against a fake R2 (etags, conditional puts), a recording D1 and a stubbed SDO. Standard library only; no network.
 * Run: node --no-warnings phase1/sunface-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored manual-hourly same-bytes-renews loose-stamp future-ok not-newer-ok move-on-fail no-cas no-readback any-image
 *   no-integrity probe-stores probe-two generic-down no-ua retry any-size any-dims observed-invented
 *   no-calendar skew-ok replay-ok replay-previous-only no-seen-marker */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const w = env.SUNFACE_ENABLED !== '1' ?", 'const w = false ?'],
  'manual-hourly': [": !manual ? await guarded(env, 'sunface', ms, collectSunface) : 'sunface:skipped (manual hourly run)';", ": await guarded(env, 'sunface', ms, collectSunface);"],
  'same-bytes-renews': ["  if (before.image && before.image.sha256 === f.sha256) {", "  if (false) {"],
  'loose-stamp': ["  if (typeof header !== 'string') return null;\n  const h = header.trim();", "  if (typeof header !== 'string') return { iso: new Date(nowMs).toISOString().replace(/\\.\\d+Z/, 'Z'), ms: nowMs };\n  const h = header.trim();"],
  'no-calendar': ["  if (!Number.isFinite(ms) || new Date(ms).toUTCString() !== h) return null;", "  if (!Number.isFinite(ms)) return null;"],
  'replay-ok': ["  if (replay) return sunFail(", "  if (false) return sunFail("],
  'replay-previous-only': [" || (await env.R2.head(seenKey)) !== null;", ";"],
  'no-seen-marker': ["  try { await env.R2.put(seenKey,", "  try { if (false) await env.R2.put(seenKey,"],
  'future-ok': ["  if (ms > nowMs) return null;\n", ''],
  'skew-ok': ["  if (ms > nowMs) return null;", "  if (ms - nowMs > 120000) return null;"],
  'not-newer-ok': ["  const older = cur => cur.image && Date.parse(cur.image.file_updated) >= stamp.ms;", "  const older = cur => false;"],
  'move-on-fail': ["sunUpdate(env, cur => ({ ...cur, last_attempt: { run:", "sunUpdate(env, cur => ({ ...cur, image: null, last_attempt: { run:"],
  'no-cas': ["    const r = await env.R2.put(SUNFACE.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });", "    const r = await env.R2.put(SUNFACE.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' } });"],
  'no-readback': ["  if (!bb || bb.byteLength !== f.bytes || await sha256Bytes(bb) !== f.sha256) return sunFail(env, ms, 'down', 'stored copy does not read back', 200, key);", ''],
  'any-image': ["  const x = [cur.image, cur.previous].find(f => f && f.id === p[2] && f.file === p[3]);\n  if (!x) return none(404, 'not found');", "  const x = [cur.image, cur.previous].find(f => f && f.id === p[2] && f.file === p[3]) || { key: SUNFACE.PREFIX + p[2] + '/' + p[3], bytes: -1 };"],
  'no-integrity': ["  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');\n  return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': SUNFACE.CACHE_FILE,", "  return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': SUNFACE.CACHE_FILE,"],
  'probe-stores': ["  const t0 = Date.now(), f = await sunFetch(), now = Date.now();", "  const t0 = Date.now(), f = await sunFetch(), now = Date.now(); if (f.ok) await env.R2.put(SUNFACE.PREFIX + 'probe/' + SUNFACE.FILE, f.buf);"],
  'probe-two': ["  const t0 = Date.now(), f = await sunFetch(), now = Date.now();", "  const t0 = Date.now(), f = await sunFetch(), now = Date.now(); await sunFetch();"],
  'generic-down': ["    else if (layer === 'sunface') { try { await sunFail(env, ms, 'down', 'internal error', 0, note); } catch (_) {} }   // 0.6.13: never the generic writeDown\n", ''],
  'no-ua': ["fetch(SUNFACE.URL, { headers: { 'User-Agent': SUNFACE.UA }, cf:", "fetch(SUNFACE.URL, { cf:"],
  'retry': ["  if (r.status !== 200) return { ok: false, reason: 'http error', http: r.status };\n  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();\n  if (type !== 'image/jpeg')", "  if (r.status !== 200) { r = await fetch(SUNFACE.URL, { headers: { 'User-Agent': SUNFACE.UA } }); if (r.status !== 200) return { ok: false, reason: 'http error', http: r.status }; }\n  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();\n  if (type !== 'image/jpeg')"],
  'any-size': ["  if (buf.byteLength < SUNFACE.MIN_BYTES) return { ok: false, reason: 'size out of range', http: 200, detail: String(buf.byteLength) };", ''],
  'any-dims': ["  if (!d || d.w !== SUNFACE.W || d.h !== SUNFACE.H || !d.dqt || !d.sos || !d.eoi)", "  if (!d || !d.dqt || !d.sos || !d.eoi)"],
  'observed-invented': ["    observed_at: null, file_updated: stamp.iso, retrieved_at,", "    observed_at: stamp.iso, file_updated: stamp.iso, retrieved_at,"],
};
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) {
  if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  const b = BREAKS[BREAK]; if (!src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]);
  if (BREAK === 'probe-stores') src = src.replace('async function sunProbe() {', 'async function sunProbe(env) {').replace('return json(await sunProbe(), 200', 'return json(await sunProbe(env), 200');
}
const tmp = path.join(os.tmpdir(), `worker-sun-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const S = W.SUNFACE;

/** A structurally valid JPEG (SOI, DQT, SOF0 with the given size, DHT, SOS, scan bytes, EOI). Not a decodable picture; the hub does not decode. */
function jpeg(seed, { w = 1024, h = 1024, size = 60000, eoi = true } = {}) {
  const seg = (m, body) => Buffer.concat([Buffer.from([0xff, m, (body.length + 2) >> 8, (body.length + 2) & 255]), body]);
  const head = Buffer.concat([Buffer.from([0xff, 0xd8]), seg(0xdb, Buffer.alloc(65, 1)), seg(0xc0, Buffer.from([8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 0, 3, 0x11, 0])), seg(0xc4, Buffer.alloc(20, 2)), seg(0xda, Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0]))]);
  const scan = Buffer.alloc(Math.max(0, size - head.length - 2)); let x = seed * 2654435761 >>> 0; for (let i = 0; i < scan.length; i++) { x = (x * 1664525 + 1013904223) >>> 0; scan[i] = (x >>> 24) % 255; }
  return Buffer.concat([head, scan, eoi ? Buffer.from([0xff, 0xd9]) : Buffer.from([0, 0])]);
}
const httpDate = ms => new Date(ms).toUTCString();
function world() {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, status: 200, type: 'image/jpeg', body: jpeg(1), lm: httpDate(Date.now() - 20 * 60000), pointerPuts: [], conflicts: 0, putFail: null, corruptRead: null, onPointerPut: null, throwFetch: false };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.includes(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);
      if (key === S.POINTER) { w.pointerPuts.push(opts.onlyIf || null); if (w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); } }
      if (opts.onlyIf) { const had = store.get(key); const refused = opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches); if (refused) { w.conflicts++; return null; } }
      store.set(key, { buf, etag: etagOf(buf) }); return { key, etag: etagOf(buf) }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.includes(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 3] ^= 0xff; }
      return { etag: o.etag, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; },
    async delete(key) { store.delete(key); },
  };
  const stmt = sql => ({ bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], status: a[3], http: a[4], records: a[5], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } });
  w.env = { R2, DB: { prepare: stmt, async batch() { return []; } }, SUNFACE_ENABLED: '1', ADMIN_KEY: 'k' };
  w.fetch = async (url, init) => { const u = String(url);
    if (u !== S.URL) throw new Error('unexpected fetch ' + u);
    reqs.push({ u, ua: init && init.headers && init.headers['User-Agent'], signal: !!(init && init.signal) });
    if (w.throwFetch) throw new Error('network down (test)');
    if (w.status !== 200) return new Response('no', { status: w.status });
    const h = { 'content-type': w.type, date: httpDate(Date.now()) }; if (w.lm !== null) h['last-modified'] = w.lm;
    return new Response(w.body, { status: 200, headers: h }); };
  w.ptr = () => store.has(S.POINTER) ? JSON.parse(store.get(S.POINTER).buf.toString()) : null;
  w.keys = p => [...store.keys()].filter(k => k.startsWith(p)).sort();
  w.sun = () => runs.filter(r => r.layer === 'sunface');
  return w;
}
const realFetch = globalThis.fetch, use = w => { globalThis.fetch = w.fetch; return w; };
const get = async (w, p) => { const r = await W.default.fetch(new Request('https://hub.test' + p), w.env); const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch (_) {} return { status: r.status, j, buf, h: r.headers }; };
const run = (w, ms = Date.now()) => W.JOBS.sunface(w.env, ms);
const ago = min => httpDate(Date.now() - min * 60000);
const isoOf = hd => new Date(Date.parse(hd)).toISOString().replace('.000Z', 'Z');

// ---------- A. gate and schedule
{ const w = use(world()); delete w.env.SUNFACE_ENABLED; const out = await W.JOBS.hourly(w.env, Date.now(), false);
  ok('A gate unset: no request at all', w.reqs.length === 0 && /not scheduled/.test(out.sunface), out.sunface);
  ok('A gate unset: nothing stored under sunface/', w.keys('sunface/').length === 0); }
{ const w = use(world()); const out = await W.JOBS.hourly(w.env, Date.now(), false);
  ok('A gate set, scheduled hour: exactly one request', w.reqs.length === 1, { n: w.reqs.length, out: out.sunface });
  ok('A it ran every hour (no hour filter): a second scheduled run asks again', (await W.JOBS.hourly(w.env, Date.now() + 3600000, false), w.reqs.length === 2)); }
{ const w = use(world()); const out = await W.JOBS.hourly(w.env, Date.now(), true);
  ok('A manual hourly run does not fetch the Sun', w.reqs.length === 0 && /skipped \(manual hourly run\)/.test(out.sunface), out.sunface); }
{ const w = use(world()); delete w.env.SUNFACE_ENABLED; const r = await get(w, '/admin/run/sunface?key=k');
  ok('A /admin/run/sunface runs with the gate unset (manual), one request', r.status === 200 && w.reqs.length === 1 && !!w.ptr().image, { s: r.status, n: w.reqs.length });
  ok('A /admin/run/sunface needs the key', (await get(w, '/admin/run/sunface')).status === 403 && w.reqs.length === 1); }

// ---------- B. first publication
{ const w = use(world()); const lm = w.lm, t0 = Date.now(); await run(w); const p = w.ptr(), im = p.image;
  ok('B request carries the application User-Agent and a timeout', w.reqs[0].ua === S.UA && /mother-earth-collector\/0\.6\.13 /.test(S.UA) && w.reqs[0].signal, w.reqs[0]);
  ok('B pointer names an image', !!im && im.sha256 === sha(w.body) && im.bytes === w.body.length && im.w === 1024 && im.h === 1024, im);
  ok('B three times kept apart: observed_at null, file_updated = Last-Modified, retrieved_at = hub clock', im.observed_at === null && im.file_updated === isoOf(lm) && Date.parse(im.retrieved_at) >= t0 && im.last_modified_header === lm, im);
  ok('B id is file-updated time + hash prefix', im.id === isoOf(lm).replace(/[-:]/g, '') + '-' + sha(w.body).slice(0, 16), im.id);
  ok('B stored bytes are the fetched bytes, unchanged', sha(w.store.get(im.key).buf) === sha(w.body));
  ok('B pointer carries the age limit for the page, cadence and credit', p.age_limit_s === 10800 && p.cadence === 'hourly' && /NASA\/SDO and the AIA, EVE, and HMI science teams/.test(p.source.credit), p);
  ok('B previous null, last_attempt null, last_checked set', p.previous === null && p.last_attempt === null && !!p.last_checked);
  ok('B run logged ok, one record', w.sun().length === 1 && w.sun()[0].status === 'ok' && w.sun()[0].records === 1 && /observation time not known/.test(w.sun()[0].note), w.sun());
  ok('B first pointer write is create-only', w.pointerPuts[0] && w.pointerPuts[0].etagDoesNotMatch === '*', w.pointerPuts);
  const meta = await get(w, '/snapshot/sunface/meta');
  ok('B meta: 200, no-store, storage key not exposed, hub clock included', meta.status === 200 && meta.h.get('cache-control') === 'no-store' && meta.j.image.key === undefined && !!meta.j.now && meta.j.image.path === `/snapshot/sunface/${im.id}/sun.jpg`, meta.j);
  const file = await get(w, im.path);
  ok('B file: exact bytes, image/jpeg, immutable, ETag = sha256, CORS', file.status === 200 && sha(file.buf) === im.sha256 && file.h.get('content-type') === 'image/jpeg' && /immutable/.test(file.h.get('cache-control')) && file.h.get('etag') === '"' + im.sha256 + '"' && file.h.get('access-control-allow-origin') === '*', { s: file.status });
  ok('B nothing written outside sunface/', [...w.store.keys()].every(k => k.startsWith('sunface/')), [...w.store.keys()]);
  const mark = w.store.get(S.SEEN + im.sha256 + '.json');
  ok('B a seen-marker records the published bytes and their original file-updated time', !!mark && JSON.parse(mark.buf.toString()).file_updated === im.file_updated && JSON.parse(mark.buf.toString()).id === im.id, mark && mark.buf.toString()); }

// ---------- C. identical bytes never renew a picture
{ const w = use(world()); w.lm = ago(100); await run(w); const a = w.ptr();
  await new Promise(r => setTimeout(r, 15)); w.lm = ago(1); await run(w); const b = w.ptr();   // same bytes, a newer Last-Modified header
  ok('C same bytes with a newer header: image id and file_updated unchanged', b.image.id === a.image.id && b.image.file_updated === a.image.file_updated && b.image.retrieved_at === a.image.retrieved_at, { a: a.image, b: b.image });
  ok('C only last_checked moved', b.last_checked > a.last_checked && JSON.stringify({ ...b, last_checked: 0 }) === JSON.stringify({ ...a, last_checked: 0 }), b);
  ok('C no second stored image', w.keys(S.PREFIX).length === 1, w.keys(S.PREFIX));
  ok('C logged ok as unchanged, zero records', w.sun()[1].status === 'ok' && w.sun()[1].records === 0 && /^unchanged: same bytes/.test(w.sun()[1].note), w.sun()[1]);
  w.lm = null; await run(w); const c = w.ptr();   // same bytes, no header at all: still just "unchanged"
  ok('C same bytes with no Last-Modified: still unchanged, not a failure', c.image.id === a.image.id && c.last_attempt === null && w.sun()[2].status === 'ok', c); }

// ---------- D. replacement, previous kept, older dropped
{ const w = use(world()); w.lm = ago(90); await run(w); const a = w.ptr().image;
  w.body = jpeg(2); w.lm = ago(30); await run(w); const p2 = w.ptr();
  ok('D new bytes with a newer time: published; the old image becomes previous', p2.image.sha256 === sha(w.body) && p2.previous && p2.previous.id === a.id && p2.image.file_updated === isoOf(w.lm), p2);
  ok('D previous image still served', (await get(w, a.path)).status === 200);
  w.body = jpeg(3); w.lm = ago(2); await run(w); const p3 = w.ptr();
  ok('D third image: first is no longer served (404), second is', (await get(w, a.path)).status === 404 && (await get(w, p2.image.path)).status === 200 && (await get(w, p3.image.path)).status === 200); }

// ---------- E. no trustworthy timestamp, no publication; a valid picture stays
for (const [name, lm, reason] of [['missing', null, 'no trustworthy timestamp'], ['not an HTTP date', '2026-11-14 03:00:00', 'no trustworthy timestamp'], ['ISO form', new Date(Date.now() - 600000).toISOString(), 'no trustworthy timestamp'],
  ['ten minutes in the future', httpDate(Date.now() + 600000), 'no trustworthy timestamp'], ['one minute in the future (no tolerance)', httpDate(Date.now() + 60000), 'no trustworthy timestamp'],
  ['31 Feb (not a calendar date)', 'Tue, 31 Feb 2026 03:30:05 GMT', 'no trustworthy timestamp'], ['wrong weekday', httpDate(Date.now() - 600000).replace(/^[A-Z][a-z]{2}/, d => d === 'Mon' ? 'Tue' : 'Mon'), 'no trustworthy timestamp'], ['empty', '', 'no trustworthy timestamp']]) {
  const w = use(world()); w.lm = ago(60); await run(w); const a = w.ptr();
  w.body = jpeg(7); w.lm = lm; await run(w); const b = w.ptr();
  ok(`E Last-Modified ${name}: replacement rejected, current image untouched`, b.image.id === a.image.id && b.image.file_updated === a.image.file_updated && b.previous === null, b.image);
  ok(`E ${name}: last_attempt says rejected, with the fixed reason`, b.last_attempt && b.last_attempt.status === 'rejected' && b.last_attempt.reason === reason && b.last_attempt.consecutive_failures === 1, b.last_attempt);
  ok(`E ${name}: the rejected bytes were not stored`, w.keys(S.PREFIX).length === 1, w.keys(S.PREFIX));
  ok(`E ${name}: logged down with "rejected:"`, w.sun()[1].status === 'down' && /^rejected: /.test(w.sun()[1].note), w.sun()[1]);
  const fresh = use(world()); fresh.lm = lm; await run(fresh);
  ok(`E ${name}, no image yet: nothing published at all`, fresh.ptr().image === null && fresh.keys(S.PREFIX).length === 0 && fresh.ptr().last_attempt.status === 'rejected', fresh.ptr()); }
for (const [name, mins] of [['equal', 60], ['older', 75]]) {
  const w = use(world()); const lm0 = ago(60); w.lm = lm0; await run(w); const a = w.ptr();
  w.body = jpeg(8); w.lm = name === 'equal' ? lm0 : ago(mins); await run(w); const b = w.ptr();
  ok(`E different bytes with an ${name} time: rejected, current kept`, b.image.id === a.image.id && b.last_attempt.status === 'rejected' && b.last_attempt.reason === 'timestamp not newer than the current image' && w.keys(S.PREFIX).length === 1, b); }
// replay: bytes that were published before come back under a fresh header (GPT: A -> B -> A)
{ const w = use(world()); const A = jpeg(21), B = jpeg(22), C = jpeg(23);
  w.body = A; w.lm = ago(120); await run(w); const a = w.ptr().image;
  w.body = B; w.lm = ago(60); await run(w); const pb = w.ptr();
  w.body = A; w.lm = ago(2); await run(w); const p = w.ptr();
  ok('E replay A→B→A with a fresh header: A is not published again; B stays current', p.image.id === pb.image.id && p.image.sha256 === sha(B), p.image);
  ok('E replay: A remains previous with its ORIGINAL time', p.previous.id === a.id && p.previous.file_updated === a.file_updated, p.previous);
  ok('E replay: recorded as rejected "picture already published earlier"; nothing new stored', p.last_attempt.status === 'rejected' && p.last_attempt.reason === 'picture already published earlier' && w.keys(S.PREFIX).length === 2, { la: p.last_attempt, keys: w.keys(S.PREFIX) });
  w.body = C; w.lm = ago(1); await run(w);
  ok('E after the replay a genuinely new picture still publishes', w.ptr().image.sha256 === sha(C) && w.ptr().previous.sha256 === sha(B) && w.ptr().last_attempt === null, w.ptr().image);
  await new Promise(r => setTimeout(r, 1100)); w.body = A; w.lm = httpDate(Date.now() - 500); await run(w); const q = w.ptr();
  ok('E replay two images back (A→B→C→A): still rejected', q.image.sha256 === sha(C) && q.last_attempt.reason === 'picture already published earlier' && w.keys(S.PREFIX).length === 3, { img: q.image.id, la: q.last_attempt });
  w.body = B; w.lm = httpDate(Date.now() - 400); await run(w);
  ok('E replay of the previous image (C current, B previous → B): rejected', w.ptr().image.sha256 === sha(C) && w.ptr().last_attempt.reason === 'picture already published earlier' && w.ptr().last_attempt.consecutive_failures === 2, w.ptr().last_attempt); }
{ const w = use(world()); const A = jpeg(31), B = jpeg(32); w.body = A; w.lm = ago(120); await run(w); w.body = B; w.lm = ago(60); await run(w);
  for (const k of w.keys(S.SEEN)) w.store.delete(k);   // markers lost: the previous-image check must still hold by itself
  w.body = A; w.lm = ago(2); await run(w);
  ok('E replay of the previous image is rejected even with the markers gone', w.ptr().image.sha256 === sha(B) && w.ptr().last_attempt.reason === 'picture already published earlier', w.ptr().last_attempt); }
{ const w = use(world()); w.lm = ago(60); await run(w); w.body = jpeg(9); w.lm = null; await run(w); await run(w);
  ok('E failures count up', w.ptr().last_attempt.consecutive_failures === 2, w.ptr().last_attempt);
  w.lm = ago(5); await run(w);
  ok('E a good run clears last_attempt', w.ptr().last_attempt === null && w.ptr().image.sha256 === sha(w.body)); }

// ---------- F. bad answers: one request, no retry, image untouched
for (const [name, mut, reason, http] of [
  ['HTTP 503', w => { w.status = 503; }, 'http error', 503], ['HTTP 404', w => { w.status = 404; }, 'http error', 404],
  ['HTML instead of an image', w => { w.type = 'text/html'; }, 'not an image', 200], ['wrong size 512', w => { w.body = jpeg(4, { w: 512, h: 512 }); }, 'not a valid image', 200],
  ['cut short (no end marker)', w => { w.body = jpeg(4, { eoi: false }); }, 'not a valid image', 200], ['not a JPEG', w => { w.body = Buffer.alloc(60000, 7); }, 'not a valid image', 200],
  ['too small', w => { w.body = jpeg(4, { size: 5000 }); }, 'size out of range', 200], ['too big', w => { w.body = jpeg(4, { size: 2 * 1024 * 1024 + 500 }); }, 'size out of range', 200],
  ['network error', w => { w.throwFetch = true; }, 'request failed', 0]]) {
  const w = use(world()); w.lm = ago(60); await run(w); const a = w.ptr(); const n0 = w.reqs.length;
  mut(w); w.lm = ago(5); await run(w); const b = w.ptr();
  ok(`F ${name}: exactly one request, no retry`, w.reqs.length === n0 + 1, w.reqs.length - n0);
  ok(`F ${name}: image untouched, last_attempt down "${reason}"`, b.image.id === a.image.id && b.image.file_updated === a.image.file_updated && b.last_attempt.status === 'down' && b.last_attempt.reason === reason && b.last_attempt.http === http, b.last_attempt);
  ok(`F ${name}: nothing new stored; old image still served`, w.keys(S.PREFIX).length === 1 && (await get(w, a.image.path)).status === 200); }

// ---------- G. storage and concurrency
{ const w = use(world()); w.lm = ago(60); await run(w); const a = w.ptr();
  w.body = jpeg(5); w.lm = ago(5); w.corruptRead = S.PREFIX; await run(w); w.corruptRead = null; const b = w.ptr();
  ok('G stored copy does not read back: not published', b.image.id === a.image.id && b.last_attempt.reason === 'stored copy does not read back', b); }
{ const w = use(world()); w.lm = ago(60); await run(w);
  w.body = jpeg(6); w.lm = ago(20);
  const rival = { id: 'rival', file: 'sun.jpg', key: S.PREFIX + 'rival/sun.jpg', sha256: 'f'.repeat(64), bytes: 1, file_updated: isoOf(ago(3)), observed_at: null, retrieved_at: new Date().toISOString() };
  w.onPointerPut = async () => { const cur = w.ptr(); const buf = Buffer.from(JSON.stringify({ ...cur, image: rival, previous: cur.image })); w.store.set(S.POINTER, { buf, etag: crypto.createHash('md5').update(buf).digest('hex') }); };
  await run(w); const p = w.ptr();
  ok('G another run published a newer image mid-write: this run does not overwrite it', p.image.id === 'rival' && w.conflicts >= 1, { id: p.image.id, conflicts: w.conflicts });
  ok('G …and is logged as superseded, not as a failure', /^superseded/.test(w.sun().at(-1).note) && w.sun().at(-1).status === 'ok', w.sun().at(-1));
  ok('G every pointer write was conditional', w.pointerPuts.every(o => o && (o.etagMatches || o.etagDoesNotMatch === '*')), w.pointerPuts); }
{ const w = use(world()); w.lm = ago(60); await run(w); const a = w.ptr(); w.body = jpeg(11); w.lm = ago(5); w.putFail = S.PREFIX; await run(w); w.putFail = null; const b = w.ptr();
  ok('G an uncaught storage error is recorded as "internal error"; image untouched', b.image.id === a.image.id && b.last_attempt && b.last_attempt.reason === 'internal error' && b.last_attempt.status === 'down', b.last_attempt);
  ok('G …and no generic snapshot or cells object appears', [...w.store.keys()].every(k => k.startsWith('sunface/')), [...w.store.keys()]); }

// ---------- H. routes
{ const w = use(world()); const m0 = await get(w, '/snapshot/sunface/meta');
  ok('H no pointer yet: meta 200 with image null and the age limit', m0.status === 200 && m0.j.image === null && m0.j.age_limit_s === 10800, m0.j);
  ok('H no pointer yet: a file path is 404', (await get(w, '/snapshot/sunface/x/sun.jpg')).status === 404);
  w.lm = ago(30); await run(w); const im = w.ptr().image;
  ok('H unknown id → 404', (await get(w, '/snapshot/sunface/20260101T000000Z-0000000000000000/sun.jpg')).status === 404);
  ok('H wrong file name → 404', (await get(w, `/snapshot/sunface/${im.id}/other.jpg`)).status === 404);
  ok('H extra path part → 404', (await get(w, `/snapshot/sunface/${im.id}/sun.jpg/x`)).status === 404);
  w.store.set(S.PREFIX + 'stray/sun.jpg', { buf: jpeg(12), etag: 'e' });
  ok('H an object in storage that the pointer does not name is not served', (await get(w, '/snapshot/sunface/stray/sun.jpg')).status === 404);
  w.corruptRead = S.PREFIX; const bad = await get(w, im.path); w.corruptRead = null;
  ok('H stored bytes that do not match the pointer → 503 integrity, no bytes', bad.status === 503 && bad.j.reason === 'integrity', { s: bad.status, j: bad.j });
  w.store.delete(im.key); ok('H missing object → 503 missing', (await get(w, im.path)).status === 503); }

// ---------- I. probe
{ const w = use(world()); w.lm = ago(12); const r = await get(w, '/admin/probe/sunface?key=k');
  ok('I probe: exactly one request', w.reqs.length === 1, w.reqs.length);
  ok('I probe: stores nothing, logs nothing', w.store.size === 0 && w.runs.length === 0, { keys: [...w.store.keys()], runs: w.runs });
  ok('I probe: reports what the time rules need', r.status === 200 && r.j.ok === true && r.j.http === 200 && r.j.bytes === w.body.length && r.j.sha256 === sha(w.body) && r.j.last_modified_header === w.lm && r.j.file_updated === isoOf(w.lm) && r.j.timestamp_trustworthy === true && Math.abs(r.j.file_age_s - 720) < 5 && r.j.observed_at === null && r.j.stored === false && r.j.published === false && !!r.j.date_header, r.j);
  ok('I probe: says the User-Agent receipt is not verified', /not verified/.test(r.j.user_agent_receipt) && r.j.user_agent_set === S.UA);
  ok('I probe needs the key', (await get(w, '/admin/probe/sunface')).status === 403 && (await get(w, '/admin/probe/sunface?key=no')).status === 403 && w.reqs.length === 1);
  const w2 = use(world()); w2.lm = null; const r2 = await get(w2, '/admin/probe/sunface?key=k');
  ok('I probe with no Last-Modified: reports untrustworthy', r2.j.ok === true && r2.j.timestamp_trustworthy === false && r2.j.file_updated === null, r2.j);
  const w3 = use(world()); w3.status = 403; const r3 = await get(w3, '/admin/probe/sunface?key=k');
  ok('I probe when SDO refuses: reports it, one request', r3.j.ok === false && r3.j.http === 403 && w3.reqs.length === 1, r3.j); }

// ---------- J. the stamp rule by itself
{ const now = Date.UTC(2026, 10, 14, 4, 0, 0);
  ok('J a plain HTTP date parses to an ISO time', W.sunStamp('Sat, 14 Nov 2026 03:30:05 GMT', now).iso === '2026-11-14T03:30:05Z');
  for (const bad of [null, undefined, '', 'yesterday', '14 Nov 2026 03:30:05 GMT', 'Sat, 14 Nov 2026 03:30:05 +0200', 'Sat, 14 Nov 2026 03:30:05', '2026-11-14T03:30:05Z', 1794000000,
    'Sat, 14 Nov 2026 04:00:01 GMT' /* one second after retrieval */, 'Sat, 14 Nov 2026 04:02:00 GMT', 'Tue, 31 Feb 2026 03:30:05 GMT', 'Mon, 30 Feb 2026 03:30:05 GMT', 'Fri, 14 Nov 2026 03:30:05 GMT' /* wrong weekday */,
    'Sat, 14 Nov 2026 24:00:00 GMT', 'Sat, 14 Nov 2026 03:60:05 GMT', 'Sat, 14 Nov 2026 03:30:61 GMT', 'Sat, 14 Foo 2026 03:30:05 GMT', 'Sun, 29 Feb 2026 03:30:05 GMT' /* 2026 is not a leap year */])
    ok('J rejected: ' + JSON.stringify(bad), W.sunStamp(bad, now) === null, W.sunStamp(bad, now));
  ok('J exactly the retrieval instant is accepted', W.sunStamp('Sat, 14 Nov 2026 04:00:00 GMT', now) !== null);
  ok('J a real leap day is accepted', (W.sunStamp('Tue, 29 Feb 2028 03:30:05 GMT', Date.UTC(2028, 2, 1)) || {}).iso === '2028-02-29T03:30:05Z'); }

globalThis.fetch = realFetch;
console.log(`${fail ? 'FAIL' : 'PASS'}  sunface-hub: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
