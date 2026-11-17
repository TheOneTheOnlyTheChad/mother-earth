#!/usr/bin/env node
/* Mother Earth — Cape Town observation station, A1: "Aircraft seen by our Cape Town receiver" (PRIVATE preview, 17 Nov 2026).
 * A tiny local server for this Mac only. It listens on 127.0.0.1 (never the network), serves one page, and reads the Pi's own
 * readsb aircraft JSON over the home network on the page's behalf. Nothing is uploaded, stored or sent anywhere else.
 *   Start:  node ~/mother-earth/cape-town/preview.mjs        Open:  http://localhost:8787        Stop: Ctrl+C
 *   PI_URL=http://<pi>:8080/data/aircraft.json to point at a different address. PORT=8787.
 * Test states (the page shows a SIMULATED banner): http://localhost:8787/?sim=zero | ?sim=stale | ?sim=down
 *   zero  = the real feed with every position removed      stale = the first reading, frozen      down = the receiver not answering
 * Balloon replay (private): http://localhost:8787/balloon — one archived radiosonde flight saved by fetch-flight.mjs; nothing is fetched here.
 * No dependencies. Needs Node 18+. */
import http from 'node:http'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import path from 'node:path';
const PI_URL = process.env.PI_URL || 'http://adsb-feeder.local:8080/data/aircraft.json';
const PORT = Number(process.env.PORT || 8787), HOST = '127.0.0.1', TIMEOUT_MS = 4000;
const HERE = path.dirname(fileURLToPath(import.meta.url)), PAGE = path.join(HERE, 'preview.html');
const BALLOON = process.env.BALLOON_DIR || path.join(HERE, 'balloon'), BALLOON_PAGE = path.join(HERE, 'balloon.html'), FLIGHT = (process.env.FLIGHT || '55126368').replace(/[^A-Za-z0-9-]/g, '');
let frozen = null;
async function readPi() {
  const r = await fetch(PI_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error('the receiver answered HTTP ' + r.status);
  const j = await r.json();
  if (!j || typeof j.now !== 'number' || !Array.isArray(j.aircraft)) throw new Error('the receiver answered, but not with aircraft JSON');
  return j;
}
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body); };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') return send(res, 405, '{"error":"GET only"}');
  if (u.pathname === '/') { try { return send(res, 200, fs.readFileSync(PAGE), 'text/html'); } catch (e) { return send(res, 500, 'preview.html is missing next to preview.mjs', 'text/plain'); } }
  // Balloon replay: the page, and the one saved flight with its record of where it came from. Read from disk only.
  if (u.pathname === '/balloon') { try { return send(res, 200, fs.readFileSync(BALLOON_PAGE), 'text/html'); } catch (e) { return send(res, 500, 'balloon.html is missing next to preview.mjs', 'text/plain'); } }
  if (u.pathname === '/balloon/flight.json') {
    try {
      const frames = JSON.parse(fs.readFileSync(path.join(BALLOON, `flight-${FLIGHT}.raw.json`), 'utf8'));
      let meta = null; try { meta = JSON.parse(fs.readFileSync(path.join(BALLOON, `flight-${FLIGHT}.meta.json`), 'utf8')); } catch (_) {}
      return send(res, 200, JSON.stringify({ serial: FLIGHT, meta, frames }));
    } catch (e) { return send(res, 404, JSON.stringify({ error: `no saved flight ${FLIGHT} yet: run fetch-flight.mjs once` })); }
  }
  if (u.pathname === '/aircraft.json') {
    const sim = u.searchParams.get('sim') || '';
    if (sim === 'down') return send(res, 502, JSON.stringify({ error: 'SIMULATED: the receiver is not answering', simulated: 'down' }));
    try {
      let j;
      if (sim === 'stale') { if (!frozen) frozen = await readPi(); j = frozen; } else j = await readPi();
      if (sim === 'zero') j = { ...j, aircraft: j.aircraft.map(a => { const b = { ...a }; for (const k of ['lat', 'lon', 'seen_pos', 'r_dst', 'r_dir', 'nic', 'rc']) delete b[k]; return b; }) };
      return send(res, 200, JSON.stringify({ fetched_at_ms: Date.now(), simulated: sim || null, source: 'readsb aircraft.json on our own receiver (local network)', data: j }));
    } catch (e) { return send(res, 502, JSON.stringify({ error: String(e && e.name === 'TimeoutError' ? 'no answer from the receiver within ' + TIMEOUT_MS / 1000 + ' s' : (e && e.cause && e.cause.code) || (e && e.message) || e).slice(0, 200) })); }
  }
  send(res, 404, '{"error":"not found"}');
});
server.listen(PORT, HOST, () => console.log(`Cape Town receiver preview: http://localhost:${PORT}   balloon replay: http://localhost:${PORT}/balloon   (this Mac only; reading ${PI_URL}; Ctrl+C to stop)`));
