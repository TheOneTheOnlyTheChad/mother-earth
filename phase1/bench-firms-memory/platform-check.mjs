// Local platform checks for the FIRMS memory design rev 6 (§16 step 2): the R2/stream behaviours the design relies on, run in
// workerd (Miniflare 4.20260730.0, local R2 simulator). LOCAL evidence only — production R2 is a different implementation.
// Usage (from a dir with miniflare installed): node <repo>/phase1/bench-firms-memory/platform-check.mjs
import { Miniflare } from 'miniflare';

const script = `
export default { async fetch(req, env) {
  const R = env.R2, out = {};
  const put = async (k, v, o) => { const r = await R.put(k, v, o); return r ? r.etag : null; };
  // 1. create-only: etagDoesNotMatch "*" when absent → written; when present → null (not stored)
  out.createAbsent = await put('k1', 'a', { onlyIf: { etagDoesNotMatch: '*' } }) !== null;
  out.createPresent = await put('k1', 'b', { onlyIf: { etagDoesNotMatch: '*' } }) === null;
  out.createKeptOriginal = (await (await R.get('k1')).text()) === 'a';
  // 1b. the same via a Headers object (If-None-Match: *)
  out.headersCreatePresent = await put('k1', 'c', { onlyIf: new Headers({ 'If-None-Match': '*' }) }) === null;
  // 2. CAS: etagMatches stale → null; current → written
  const e1 = (await R.head('k1')).etag; await put('k1', 'd');
  out.casStale = await put('k1', 'e', { onlyIf: { etagMatches: e1 } }) === null;
  out.casCurrent = await put('k1', 'f', { onlyIf: { etagMatches: (await R.head('k1')).etag } }) !== null;
  // 3. stream copy: put(key, R2ObjectBody.body) — known length?
  await put('src', 'x'.repeat(6 * 1024 * 1024 + 7));
  try { const o = await R.get('src'); await R.put('copy', o.body); out.objectBodyCopy = (await R.head('copy')).size === 6 * 1024 * 1024 + 7; } catch (e) { out.objectBodyCopy = 'threw: ' + String(e).slice(0, 120); }
  // 4. a TransformStream readable (unknown length) → must throw
  try { const ts = new TransformStream(); const w = ts.writable.getWriter(); w.write(new TextEncoder().encode('abc')); w.close(); await R.put('ts', ts.readable); out.unknownLengthRejected = false; } catch (e) { out.unknownLengthRejected = true; }
  // 5. FixedLengthStream with a declared length → accepted
  try { const fl = new FixedLengthStream(5); const w = fl.writable.getWriter(); w.write(new TextEncoder().encode('hello')); w.close(); await R.put('fl', fl.readable); out.fixedLength = (await (await R.get('fl')).text()) === 'hello'; } catch (e) { out.fixedLength = 'threw: ' + String(e).slice(0, 120); }
  // 6. multipart: 5 MiB parts + small last part; a 1 MiB non-last part must be refused
  const P = 5 * 1024 * 1024; const mp = await R.createMultipartUpload('mp', { customMetadata: { run_id: 'r' } });
  const p1 = await mp.uploadPart(1, new Uint8Array(P).fill(65)); const p2 = await mp.uploadPart(2, new Uint8Array(10).fill(66));
  const done = await mp.complete([p1, p2]); out.multipart = done.size === P + 10; out.multipartMeta = (await R.head('mp')).customMetadata.run_id === 'r';
  try { const bad = await R.createMultipartUpload('bad'); const q1 = await bad.uploadPart(1, new Uint8Array(1024 * 1024)); const q2 = await bad.uploadPart(2, new Uint8Array(10)); await bad.complete([q1, q2]); out.smallPartRefused = false; } catch (e) { out.smallPartRefused = true; }
  // 6b. conditional complete? (onlyIf is not on complete — check whether a key being overwritten by complete is unconditional)
  out.multipartOverwrites = true;   // documented: complete() has no onlyIf → multipart is used only for per-attempt unique keys
  // 7. abort leaves nothing
  const ab = await R.createMultipartUpload('ab'); await ab.uploadPart(1, new Uint8Array(P)); await ab.abort(); out.abortLeavesNothing = (await R.head('ab')) === null;
  // 8. gzip a stored object through CompressionStream into bounded parts, then read back decompressed = original
  const src = await R.get('src'); const gz = src.body.pipeThrough(new CompressionStream('gzip')); const chunks = []; const rd = gz.getReader(); let n = 0;
  for (;;) { const { value, done } = await rd.read(); if (done) break; chunks.push(value); n += value.length; }
  const all = new Uint8Array(n); let off = 0; for (const c of chunks) { all.set(c, off); off += c.length; }
  await R.put('gz', all, { httpMetadata: { contentEncoding: 'gzip' } });
  const back = await new Response((await R.get('gz')).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  out.gzipRoundTrip = back.byteLength === 6 * 1024 * 1024 + 7;
  // 9. range read
  const rg = await R.get('src', { range: { offset: 10, length: 5 } }); out.rangeRead = (await rg.text()).length === 5;
  // 10. TextDecoderStream line splitting across chunk boundaries
  const enc = new TextEncoder(); const rs = new ReadableStream({ start(c) { c.enqueue(enc.encode('ab\\ncd')); c.enqueue(enc.encode('ef\\ngh\\n')); c.close(); } });
  const r2 = rs.pipeThrough(new TextDecoderStream()).getReader(); let carry = '', lines = [];
  for (;;) { const { value, done } = await r2.read(); if (done) break; const parts = (carry + value).split('\\n'); carry = parts.pop(); lines.push(...parts); }
  out.lineSplit = JSON.stringify(lines) === JSON.stringify(['ab', 'cdef', 'gh']) && carry === '';
  return Response.json(out);
} };`;
const mf = new Miniflare({ modules: true, script, compatibilityDate: '2026-07-30', r2Buckets: ['R2'] });
const res = await (await mf.dispatchFetch('http://x/')).json();
console.log(JSON.stringify(res, null, 1));
await mf.dispose();
const must = ['createAbsent', 'createPresent', 'createKeptOriginal', 'headersCreatePresent', 'casStale', 'casCurrent', 'objectBodyCopy', 'unknownLengthRejected', 'fixedLength', 'multipart', 'multipartMeta', 'smallPartRefused', 'abortLeavesNothing', 'gzipRoundTrip', 'rangeRead', 'lineSplit'];
const bad = must.filter(k => res[k] !== true);
console.log(bad.length ? 'NOT AS ASSUMED: ' + bad.join(', ') : 'all ' + must.length + ' behaviours as the design assumes (LOCAL simulator)');
process.exit(bad.length ? 1 : 0);
