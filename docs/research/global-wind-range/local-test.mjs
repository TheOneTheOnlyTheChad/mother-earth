// Local test of the built probe against a fake mirror. Usage: node local-test.mjs <key>
// Checks who causes upstream requests, and that a complete body and a stalled body are each reported as such.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const key = process.argv[2]; let upstream = [], stallCf = false; let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const LEN = 959100, body = new Uint8Array(LEN).map((_, i) => (i * 31 + 7) & 255);
const src = readFileSync('./range-probe-worker.mjs', 'utf8');
const patched = src.replace(/const BODY_SHA256 = '[0-9a-f]{64}'/, `const BODY_SHA256 = '${createHash('sha256').update(body).digest('hex')}'`).replace('const TIMEOUT_MS = 30000', 'const TIMEOUT_MS = 1500');
if (patched === src || !patched.includes('TIMEOUT_MS = 1500')) throw new Error('test patch did not apply');
globalThis.fetch = async (url, opt = {}) => { const mode = opt.cf ? 'cf0' : opt.cache === 'no-store' ? 'nostore' : 'plain'; upstream.push((opt.method || 'GET') + ':' + mode + ':' + (opt.headers.Range || '-') + ':' + opt.headers['User-Agent']);
  const h = { 'content-length': '497550596', etag: '"9db02525a99a3da5703e33e26f82a9d0"' };
  if (opt.method === 'HEAD') return new Response(null, { status: 200, headers: h });
  const hh = { 'content-range': 'bytes 410321002-411280101/497550596', 'content-length': String(LEN), etag: h.etag };
  if (stallCf && mode === 'cf0') { let sent = false; return new Response(new ReadableStream({ pull(c) { if (!sent) { sent = true; c.enqueue(body.slice(0, 65536)); return; } return new Promise((_, rej) => opt.signal.addEventListener('abort', () => rej(opt.signal.reason))); } }, { highWaterMark: 0 }), { status: 206, headers: hh }); }
  return new Response(body, { status: 206, headers: hh }); };
const w = (await import('data:text/javascript;base64,' + Buffer.from(patched).toString('base64'))).default;
const call = async (headers, url = 'https://probe.example/', method = 'GET') => { upstream = []; const r = await w.fetch(new Request(url, { method, headers })); return { status: r.status, j: await r.json(), up: upstream.slice() }; };
let r;
r = await call({}); ok('no key: 404, no upstream', r.status === 404 && r.up.length === 0);
r = await call({ 'x-probe-key': 'a'.repeat(64), 'x-probe-sequence': 'A' }); ok('wrong key: 404, no upstream', r.status === 404 && r.up.length === 0);
r = await call({ 'x-probe-key': src.match(/KEY_SHA256 = '([0-9a-f]{64})'/)[1], 'x-probe-sequence': 'A' }); ok('key hash sent as key: 404, no upstream', r.status === 404 && r.up.length === 0);
r = await call({ 'x-probe-key': key }); ok('right key, no sequence: 400, no upstream', r.status === 400 && r.up.length === 0);
r = await call({ 'x-probe-key': key, 'x-probe-sequence': 'Z' }); ok('right key, unknown sequence: 400, no upstream', r.status === 400 && r.up.length === 0);
r = await call({ 'x-probe-key': key, 'x-probe-sequence': 'A' }, 'https://probe.example/?x=1'); ok('right key, query string: 404, no upstream', r.status === 404 && r.up.length === 0);
r = await call({ 'x-probe-key': key, 'x-probe-sequence': 'A' }, 'https://probe.example/', 'POST'); ok('right key, POST: 404, no upstream', r.status === 404 && r.up.length === 0);
const UA = 'mother-earth-collector/0.6.16 (open project; github.com/TheOneTheOnlyTheChad)', RG = 'bytes=410321002-411280101';
for (const [L, want] of [['A', ['GET:cf0', 'GET:plain']], ['B', ['GET:plain', 'GET:cf0']], ['C', ['GET:nostore']], ['D', ['HEAD:cf0', 'GET:cf0']], ['E', ['HEAD:cf0', 'GET:plain']]]) {
  r = await call({ 'x-probe-key': key, 'x-probe-sequence': L });
  const exp = want.map((x) => x + ':' + (x.startsWith('HEAD') ? '-' : RG) + ':' + UA);
  ok(`sequence ${L}: exactly the planned requests, same User-Agent and range`, r.status === 200 && JSON.stringify(r.up) === JSON.stringify(exp), r.up.map((x) => x.split(':').slice(0, 2).join(':')).join(', '));
  ok(`sequence ${L}: every range step complete with the expected hash`, r.j.steps.filter((s) => s.method === 'GET').every((s) => s.outcome === 'complete' && s.bytes_received === LEN && s.sha256_matches_browser_read === true));
}
stallCf = true; const keep = setInterval(() => {}, 200);   // Node's timeout signal does not keep the process alive on its own
r = await call({ 'x-probe-key': key, 'x-probe-sequence': 'A' });
ok('stalled cf0 body: reported as not finished, with the bytes that arrived', r.j.steps[0].outcome === 'body not finished' && r.j.steps[0].bytes_received === 65536 && /Timeout/.test(r.j.steps[0].error), JSON.stringify({ o: r.j.steps[0].outcome, b: r.j.steps[0].bytes_received, e: r.j.steps[0].error }));
ok('stalled cf0 body: the plain step after it still completes', r.j.steps[1].outcome === 'complete');
clearInterval(keep);
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
