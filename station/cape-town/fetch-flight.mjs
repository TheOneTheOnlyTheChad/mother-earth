#!/usr/bin/env node
/* Mother Earth — Cape Town observation station: ONE archived copy of one radiosonde flight, for the private balloon replay.
 * Downloads SondeHub's telemetry for a single serial once, saves it unchanged next to this script, and never asks again:
 * if the saved copy exists the script does nothing. No schedule, no polling.
 *   node ~/mother-earth/cape-town/fetch-flight.mjs            (serial 55126368 by default)
 * Source: SondeHub Radiosonde Telemetry (sondehub.org), licence CC BY-SA 2.0. Tries the open archive first, then the API.
 * Saved: balloon/flight-<serial>.raw.json (the frames exactly as received) and balloon/flight-<serial>.meta.json. */
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const SERIAL = (process.argv[2] || '55126368').replace(/[^A-Za-z0-9-]/g, '');
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'balloon'), RAW = path.join(DIR, `flight-${SERIAL}.raw.json`), META = path.join(DIR, `flight-${SERIAL}.meta.json`);
if (fs.existsSync(RAW)) { console.log(`already saved: ${RAW} (not downloading again)`); process.exit(0); }
const SOURCES = [
  { name: 'SondeHub open archive (S3 sondehub-history)', url: `https://sondehub-history.s3.amazonaws.com/serial/${SERIAL}.json.gz`, gz: true },
  { name: 'SondeHub API', url: `https://api.v2.sondehub.org/sonde/${SERIAL}`, gz: false },
];
const tried = [];
for (const s of SOURCES) {
  try {
    const r = await fetch(s.url, { headers: { 'User-Agent': 'mother-earth-private-replay (one flight, once)' }, signal: AbortSignal.timeout(60000) });
    if (!r.ok) { tried.push(`${s.name}: HTTP ${r.status}`); continue; }
    let buf = Buffer.from(await r.arrayBuffer());
    if (s.gz && buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
    const frames = JSON.parse(buf.toString('utf8'));
    if (!Array.isArray(frames) || frames.length < 10 || !frames.every(f => f && typeof f === 'object')) { tried.push(`${s.name}: not a list of frames`); continue; }
    fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(RAW, buf);
    fs.writeFileSync(META, JSON.stringify({ serial: SERIAL, source: s.name, url: s.url, retrieved_at: new Date().toISOString(), frames: frames.length, bytes: buf.length,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'), tried_first: tried,
      licence: 'CC BY-SA 2.0', licence_url: 'https://creativecommons.org/licenses/by-sa/2.0/', credit: 'SondeHub Radiosonde Telemetry, https://sondehub.org (received by volunteer radiosonde_auto_rx stations)' }, null, 1));
    console.log(`saved ${frames.length} frames from ${s.name}: ${RAW}`); process.exit(0);
  } catch (e) { tried.push(`${s.name}: ${String(e && e.message || e).slice(0, 120)}`); }
}
console.error('could not download the flight:\n  ' + tried.join('\n  ')); process.exit(1);
