// Test fixture only: the REAL hub code (a worker.js file) behind a local HTTP port, with OSMC stubbed, R2/D1 in memory and a
// controllable clock, so the browser suite reads responses the hub itself produced. Used by osmc-reliability-ui.test.cjs.
// Usage: node phase1/osmc-reliability-fixture-hub.mjs <port> [path/to/worker.js]
// Control (GET):  /__now?at=<ISO>            set the hub clock
//                 /__run?kind=<good|http_error|fetch_failed|refused|partial>[&sched=<ISO>]   one run at the current clock: the scheduled :07 job
//                                             for that scheduled time, or a manual run when sched is omitted
//                 /__del?key=<r2 key>         remove an object        /__reqs  public requests seen        /__reset  empty everything
// Everything else is answered by the Worker's own fetch().
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const port = +process.argv[2] || 8898, file = path.resolve(process.argv[3] || path.join(HERE, 'worker.js'));
const tmp = path.join(HERE, `.osmc-fixture-${process.pid}.mjs`); fs.writeFileSync(tmp, fs.readFileSync(file, 'utf8'));
let worker; try { worker = (await import(pathToFileURL(tmp).href)).default; } finally { fs.unlinkSync(tmp); }

let NOW = Date.parse('2026-11-10T15:08:15.000Z');
{ const R = Date; globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const H = 3600e3, HEAD = ['platform_code,platform_type,country,time,latitude,longitude,sst', ',,,UTC,degrees_north,degrees_east,Deg C'];
const csv = n => [...HEAD, ...Array.from({ length: n }, (_, i) => `${900000 + i},DRIFTING BUOYS,UNKNOWN,${new Date(NOW - H).toISOString().slice(0, 19)}Z,${(-60 + (i * 7.3) % 120).toFixed(4)},${(-179 + (i * 13.7) % 358).toFixed(4)},${(5 + i % 25).toFixed(2)}`)].join('\n') + '\n';
const KINDS = { good: () => new Response(csv(1300), { status: 200 }), partial: () => new Response(csv(1310), { status: 200 }), http_error: () => new Response('x', { status: 522 }),
  fetch_failed: () => { throw new Error('connection reset'); }, refused: () => new Response('<html>x</html>', { status: 200 }) };
let next = KINDS.good;
globalThis.fetch = async (url) => String(url).includes('osmc.noaa.gov') ? next() : new Response('stub', { status: 503 });

const enc = new TextEncoder(), dec = new TextDecoder();
let m, seq, failPut, reqs;
const reset = () => { m = new Map(); seq = 0; failPut = null; reqs = []; }; reset();
const obj = (k, v) => ({ key: k, size: v.b.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new Date(v.up), customMetadata: {}, httpMetadata: {} });
const R2 = {
  async put(k, value, o = {}) { if (failPut && failPut(k, o)) throw new Error('forced put failure ' + k); const cur = m.get(k), c = o.onlyIf;
    if (c && c.etagDoesNotMatch === '*' && cur) return null; if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
    const v = { b: enc.encode(String(value)), etag: 'e' + (++seq), up: NOW }; m.set(k, v); return obj(k, v); },
  async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
  async get(k) { const v = m.get(k); if (!v) return null; return { ...obj(k, v), body: new Blob([v.b]).stream(), async text() { return dec.decode(v.b); }, async json() { return JSON.parse(dec.decode(v.b)); } }; },
  async delete(k) { m.delete(k); }, async list() { return { objects: [], truncated: false }; },
};
const stmt = () => { const x = () => ({ async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: () => x(), ...x() }; };
const env = { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', DRIFTERS_ENABLED: '1' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' }); res.end(body); };
  try {
    if (u.pathname === '/__now') { NOW = Date.parse(u.searchParams.get('at')); return send(200, JSON.stringify({ now: new Date(NOW).toISOString() })); }
    if (u.pathname === '/__reset') { reset(); return send(200, '{}'); }
    if (u.pathname === '/__reqs') return send(200, JSON.stringify(reqs));
    if (u.pathname === '/__del') { m.delete(u.searchParams.get('key')); return send(200, '{}'); }
    if (u.pathname === '/__run') { const kind = u.searchParams.get('kind'); next = KINDS[kind] || KINDS.good;
      failPut = kind === 'partial' ? (k, o) => k === 'latest-cells/drifters.json' && !o.onlyIf : null;
      const log = console.log; console.log = () => { };
      const sched = u.searchParams.get('sched');
      try { if (sched) await worker.scheduled({ cron: '7 * * * *', scheduledTime: Date.parse(sched) }, env, { waitUntil() { } }); else await worker.fetch(new Request('https://hub/admin/run/drifters?key=k'), env); }
      finally { console.log = log; failPut = null; next = KINDS.good; }
      const c = m.get('latest-cells/drifters.json'); return send(200, c ? dec.decode(c.b) : 'null'); }
    reqs.push(u.pathname + u.search);
    const r = await worker.fetch(new Request('https://hub' + u.pathname + u.search), env);
    send(r.status, await r.text(), r.headers.get('Content-Type') || 'application/json');
  } catch (e) { send(500, JSON.stringify({ error: String(e) })); }
}).listen(port, '127.0.0.1', () => process.stdout.write('fixture hub on ' + port + '\n'));
