// Earth from Space: LOCAL PREVIEW AND TEST FIXTURE ONLY. Nothing here reaches the network or any production system.
// One process serves (1) the site's own files from this checkout, (2) the REAL hub code (worker.js) for /snapshot/earthview/*,
// with storage and the run log held in memory, and (3) a stand-in for EUMETView that answers from the real frames in
// earthview-fixtures/ (00:00, 11:00 and 16:50 UTC on 19 Nov 2026). space.js is served with its hub address pointed at this process;
// the file on disk is not changed. The hub's clock is set by the control page and then runs forward in real time.
// Usage:  node phase1/earthview-preview.mjs [port]      then open http://127.0.0.1:<port>/__preview
// Control (GET): /__reset   /__clock?at=<ISO>   /__run?latest=<ISO>[&fault=<name>]   /__state   /__scene?name=<name>
//   faults: none, check503, checkdown, noheader, mismatch, xml, truncated, damaged, blank, http500, picdown (the next picture request for a stored frame fails once)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..'), FX = path.join(HERE, 'earthview-fixtures');
const port = +process.argv[2] || 8897, file = path.resolve(process.argv[3] || path.join(HERE, 'worker.js'));
const tmp = path.join(HERE, `.earthview-preview-${process.pid}.mjs`); fs.writeFileSync(tmp, fs.readFileSync(file, 'utf8'));
let W; try { W = await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); }
const RealDate = Date; let base = RealDate.parse('2026-11-19T00:25:00Z'), setAt = RealDate.now();
const hubNow = () => base + (RealDate.now() - setAt);
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(hubNow()); } static now() { return hubNow(); } };
const setClock = iso => { const t = RealDate.parse(iso); if (!Number.isFinite(t)) return false; base = t; setAt = RealDate.now(); return true; };
const FRAMES = { '2026-11-19T00:00:00Z': 'night', '2026-11-19T11:00:00Z': 'day', '2026-11-19T16:50:00Z': 'dusk' };
const RAW = Object.fromEntries(Object.values(FRAMES).flatMap(n => [[n + '.jpg', fs.readFileSync(path.join(FX, n + '.jpg'))], [n + '.png', fs.readFileSync(path.join(FX, n + '.png'))]]));
let store, runs, latest, fault, picDown, seq;
const reset = () => { store = new Map(); runs = []; latest = null; fault = 'none'; picDown = false; seq = 0; }; reset();
const realFetch = globalThis.fetch;
globalThis.fetch = async url => { const u = String(url);
  if (!u.includes('view.eumetsat.int')) return new Response('not available in the preview', { status: 503 });
  if (/GetCapabilities/.test(u)) { if (fault === 'checkdown') throw new Error('no answer (preview)'); if (fault === 'check503') return new Response('unavailable', { status: 503 });
    return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${latest}" units="ISO8601">x</Dimension></Layer></WMS_Capabilities>`, { status: 200, headers: { 'content-type': 'text/xml', age: '40' } }); }
  const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1], name = FRAMES[t];
  if (!name || fault === 'xml') return new Response('<?xml version="1.0"?><ServiceExceptionReport><ServiceException>Could not find a match for the requested time</ServiceException></ServiceExceptionReport>', { status: 200, headers: { 'content-type': 'text/xml;charset=UTF-8' } });
  if (fault === 'http500') return new Response('error', { status: 500 });
  let body = new Uint8Array(RAW[name + (isPic ? '.jpg' : '.png')]);
  if (isPic && fault === 'truncated') body = body.slice(0, body.length >> 1);
  if (isPic && (fault === 'damaged' || fault === 'blank')) { const sos = []; for (let i = 2; i < body.length - 1; i++) if (body[i] === 0xff && body[i + 1] === 0xda) sos.push(i);
    body = body.slice(); if (fault === 'damaged') for (let k = 0; k < 4000; k++) body[sos[0] + 300 + k] = k % 2 ? 0 : 0xff; else body.fill(0, sos[0] + 200, sos[0] + 40200); }
  const served = fault === 'mismatch' ? new RealDate(RealDate.parse(t) - 600000).toISOString() : t.replace('Z', '.000Z');
  const h = { 'content-type': isPic ? 'image/jpeg' : 'image/png' }; if (fault !== 'noheader') h.warning = `99 Nearest value used: time=${served} ISO8601 (mtg_fd:rgb_geocolour)`;
  return new Response(body, { status: 200, headers: h }); };
const R2 = {
  async put(k, v, o = {}) { const cur = store.get(k), c = o.onlyIf; if (c && c.etagDoesNotMatch === '*' && cur) return null; if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
    const b = typeof v === 'string' ? Buffer.from(v) : Buffer.from(v.buffer ? v.buffer.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength) : v); const e = { b, etag: 'e' + (++seq) }; store.set(k, e); return { key: k, etag: e.etag }; },
  async get(k) { const e = store.get(k); if (!e) return null; return { etag: e.etag, async arrayBuffer() { return e.b.buffer.slice(e.b.byteOffset, e.b.byteOffset + e.b.byteLength); }, async json() { return JSON.parse(e.b.toString('utf8')); }, async text() { return e.b.toString('utf8'); } }; },
  async head(k) { const e = store.get(k); return e ? { size: e.b.length, etag: e.etag } : null; }, async delete(k) { store.delete(k); }, async list() { return { objects: [...store.keys()].map(key => ({ key })), truncated: false }; },
};
const stmt = sql => { const x = a => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], at: a[1], status: a[3], http: a[4], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };
const env = { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'preview', EARTHVIEW_ENABLED: '1' };
const runOnce = async (l, f) => { if (l) latest = l; fault = f || 'none'; try { return await W.JOBS.earthview(env, hubNow()); } finally { fault = 'none'; } };
// Scenes: each is a short script of clock settings and collector runs, so a reviewer can put the page in a known state with one click.
const SCENES = {
  'empty': { say: 'Nothing collected yet', do: async () => { reset(); setClock('2026-11-19T00:25:00Z'); } },
  'first-night': { say: 'One verified frame (00:00, night side over Africa); it is the newest listed', do: async () => { reset(); setClock('2026-11-19T00:25:00Z'); await runOnce('2026-11-19T00:00:00Z'); } },
  'newer-day': { say: 'A newer verified frame arrives (11:00, day). A page already open keeps its picture and offers the new one', do: async () => { setClock('2026-11-19T11:25:00Z'); await runOnce('2026-11-19T11:00:00Z'); } },
  'check-failed': { say: 'The hub cannot read the source’s frame list', do: async () => { setClock(new RealDate(hubNow() + 600000).toISOString()); await runOnce(null, 'check503'); } },
  'no-header': { say: '16:50 is listed, but the service does not confirm the served time: not published', do: async () => { setClock('2026-11-19T17:15:00Z'); await runOnce('2026-11-19T16:50:00Z', 'noheader'); } },
  'different-frame': { say: '16:50 is listed, but the service says it served 16:40: not published', do: async () => { setClock('2026-11-19T17:15:00Z'); await runOnce('2026-11-19T16:50:00Z', 'mismatch'); } },
  'damaged-picture': { say: '16:50 is listed, but the picture received is damaged: not published', do: async () => { setClock('2026-11-19T17:15:00Z'); await runOnce('2026-11-19T16:50:00Z', 'damaged'); } },
  'dusk-published': { say: '16:50 collected and verified (the day–night line crossing Africa)', do: async () => { setClock('2026-11-19T17:25:00Z'); await runOnce('2026-11-19T16:50:00Z'); } },
  'nothing-newer': { say: 'An hour later the source still lists the same frame', do: async () => { setClock(new RealDate(hubNow() + 3600000).toISOString()); await runOnce(); } },
  'checks-stopped': { say: '40 minutes pass with no source check at all', do: async () => { setClock(new RealDate(hubNow() + 2400000).toISOString()); } },
  'picture-unreachable': { say: 'The next request for a picture fails once (then use Try again on the page)', do: async () => { picDown = true; } },
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const page = () => `<!doctype html><meta charset="utf-8"><title>Earth from Space · local preview</title><style>body{font:15px/1.5 system-ui;max-width:760px;margin:24px auto;padding:0 16px;background:#0b1016;color:#d6dde8}a{color:#ffb347}button{font:inherit;padding:8px 12px;margin:4px 0;cursor:pointer}li{margin:6px 0}code{background:#1a222e;padding:1px 5px}</style>
<h1>Earth from Space · local preview</h1><p><b>Fixture preview. Not live.</b> The pictures are three real EUMETSAT GeoColour frames from 19 Nov 2026 (00:00, 11:00, 16:50 UTC), served by a stand-in on this computer. The hub code is the real <code>worker.js</code> with storage in memory. Nothing here contacts EUMETSAT or Cloudflare. The hub’s clock is set by the buttons below, so ages on the page are counted from that clock, not from today.</p>
<p><a href="/space.html" target="ev">Open the page</a> (keep it open in its own tab, then press buttons here; the page re-reads within a minute, or reload it).</p>
<ol>${Object.entries(SCENES).map(([k, v]) => `<li><button onclick="fetch('/__scene?name=${k}').then(r=>r.json()).then(j=>{document.getElementById('o').textContent=JSON.stringify(j,null,1)})">${k}</button> ${v.say}</li>`).join('')}</ol>
<p>Suggested order: empty → first-night → (open the page) → newer-day → check-failed → no-header → different-frame → damaged-picture → dusk-published → nothing-newer → checks-stopped.</p><pre id="o"></pre>`;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), send = (code, body, type = 'application/json', extra = {}) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra }); res.end(body); };
  try {
    const stateOf = async () => ({ hub_clock: new RealDate(hubNow()).toISOString(), listed: latest, pointer: store.has(W.EARTHVIEW.POINTER) ? JSON.parse(store.get(W.EARTHVIEW.POINTER).b) : null, state: store.has(W.EARTHVIEW.STATE) ? JSON.parse(store.get(W.EARTHVIEW.STATE).b) : null, held: store.has(W.EARTHVIEW.HELD) ? JSON.parse(store.get(W.EARTHVIEW.HELD).b) : null, last_run: runs[runs.length - 1] || null });
    if (u.pathname === '/__preview') return send(200, page(), TYPES['.html']);
    if (u.pathname === '/__reset') { reset(); return send(200, '{"ok":true}'); }
    if (u.pathname === '/__clock') return send(setClock(u.searchParams.get('at')) ? 200 : 400, JSON.stringify({ hub_clock: new RealDate(hubNow()).toISOString() }));
    if (u.pathname === '/__run') { const r = await runOnce(u.searchParams.get('latest'), u.searchParams.get('fault')); return send(200, JSON.stringify({ result: r, ...(await stateOf()) })); }
    if (u.pathname === '/__picdown') { picDown = true; return send(200, '{"ok":true}'); }
    if (u.pathname === '/__scene') { const s = SCENES[u.searchParams.get('name')]; if (!s) return send(404, '{"error":"no such scene"}'); await s.do(); const st = await stateOf(); return send(200, JSON.stringify({ scene: u.searchParams.get('name'), result: st.last_run && st.last_run.note, hub_clock: st.hub_clock, frame: st.pointer && st.pointer.frame && st.pointer.frame.source_frame_time, source_check: st.state && st.state.source_check, collection: st.state && st.state.collection })); }
    if (u.pathname === '/__state') return send(200, JSON.stringify(await stateOf()));
    if (u.pathname.startsWith('/snapshot/earthview/')) {
      if (picDown && u.pathname.endsWith('picture.jpg')) { picDown = false; return send(503, '{"reason":"preview: forced failure"}'); }
      const r = await W.default.fetch(new Request('https://hub.preview' + u.pathname), env, { waitUntil() { } }); const b = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { ...Object.fromEntries(r.headers), 'Access-Control-Allow-Origin': '*', ...(u.pathname.endsWith('picture.jpg') ? {} : { 'Cache-Control': 'no-store' }) }); return res.end(b); }
    let p = decodeURIComponent(u.pathname); if (p === '/') p = '/index.html';
    const f = path.normalize(path.join(ROOT, p)); if (!f.startsWith(ROOT + path.sep) || /(^|\/)\./.test(p) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return send(404, 'not found', 'text/plain');
    let body = fs.readFileSync(f);
    if (p === '/space.js') { const s = body.toString('utf8'), a = "const HUB = 'https://mother-earth.chadoberholzer.workers.dev';"; if (!s.includes(a)) return send(500, 'space.js: hub address line not found', 'text/plain'); body = Buffer.from(s.replace(a, "const HUB = '';   // LOCAL PREVIEW: this process")); }
    return send(200, body, TYPES[path.extname(f)] || 'application/octet-stream');
  } catch (e) { send(500, JSON.stringify({ error: String(e && e.stack || e) })); }
}).listen(port, '127.0.0.1', () => console.log(`Earth from Space local preview: http://127.0.0.1:${port}/__preview   (fixtures only; Ctrl+C to stop)`));
void realFetch;
