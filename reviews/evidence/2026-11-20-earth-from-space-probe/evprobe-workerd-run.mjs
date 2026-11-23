/* Runs phase1/evprobe.js, as built, inside workerd (Cloudflare's open-source runtime) through Miniflare, with EUMETView replaced by
 * the fixtures. Shows that the file loads and runs as a Worker with no bindings and that it cannot be called over HTTP. It shows
 * NOTHING about memory capacity: local workerd enforces no 128 MB limit (workerd-local-spike-2026-11-20.md).
 *   node evprobe-workerd-run.mjs <path to miniflare's dist/src/index.js> */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P1 = path.resolve(HERE, '../../../phase1'), FX = path.join(P1, 'earthview-fixtures');
const { Miniflare, Response } = await import(pathToFileURL(process.argv[2]).href);
const SRC = fs.readFileSync(path.join(P1, 'evprobe.js'), 'utf8'), planOf = (await import(pathToFileURL(path.join(P1, 'evprobe.js')).href)).default.__probe.evprobePlan;
/* The probe acts only when the ACTUAL time is inside the slot it was scheduled for, and workerd uses the real clock. So for each case
 * this script finds a start time that puts a slot of the wanted kind at the present moment, and runs the file with ONLY its
 * PROBE_START line changed to that start (the one line that differs between builds). */
const T = '2026-11-19T11:00:00Z', SLOT = 600000;
const withStart = iso => { const out = SRC.replace(/^const PROBE_START = '[^']+';$/m, `const PROBE_START = '${iso}';`); if (out === SRC && !SRC.includes(`'${iso}'`)) throw new Error('start line not found'); return out; };
const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
async function one(label, want, sched = 0) { const nowSlot = Math.floor(Date.now() / SLOT) * SLOT; let k = -1, start = 0, slot = null;
  for (let c = 0; c < 72 && k < 0; c++) { const st = nowSlot - c * SLOT, s = planOf(st)[c]; if (want(s)) { k = c; start = st; slot = s; } }
  if (k < 0) return console.log(`| ${label} | no slot of this kind can be placed at the present time | | | | |`);
  const reqs = [], lines = [];
  const mf = new Miniflare({ modules: true, script: withStart(iso(start)), compatibilityDate: '2026-07-01',
    outboundService: async request => { const u = request.url; reqs.push(u);
      if (/GetCapabilities/.test(u)) return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${T}">x</Dimension></Layer></WMS_Capabilities>`, { headers: { 'content-type': 'text/xml' } });
      const isPic = /image\/jpeg/.test(u), size = Number((u.match(/width=(\d+)/) || [])[1]), f = isPic ? (size === 2048 ? 'day.jpg' : 'day-1536-derived.jpg') : 'day.png';
      return new Response(fs.readFileSync(path.join(FX, f)), { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${T.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); },
    handleRuntimeStdio(stdout, stderr) { let buf = ''; stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { lines.push(JSON.parse(l)); } catch (_) { if (l.trim()) lines.push({ raw: l }); } } }); stderr.on('data', d => { const x = String(d).trim(); if (x) lines.push({ stderr: x.slice(0, 200) }); }); } });
  await mf.ready; const w = await mf.getWorker();
  let http = ''; if (label === 'HTTP request') { try { const r = await mf.dispatchFetch('http://probe.invalid/'); http = r.status + ' ' + (await r.text()).slice(0, 60).replace(/\s+/g, ' '); } catch (e) { http = 'threw: ' + String(e).slice(0, 80); } }
  else { await w.scheduled({ scheduledTime: new Date(start + (k + sched) * SLOT), cron: '*/10 * * * *' }); await new Promise(r => setTimeout(r, 200)); }
  const d = lines.find(l => l.ev === 'done'), v = lines.filter(l => l.ev === 'validated'), first = lines.find(l => l.ev);
  console.log(`| ${label} | ${slot.excluded ? 'excluded' : `phase ${slot.phase}, ${slot.size} px${slot.ballast_mib ? ', ' + slot.ballast_mib + ' MiB' : ''}`} | ${reqs.length} | ${http || lines.map(l => l.ev || (l.stderr ? 'STDERR' : 'raw')).join(' ')} | ${d ? d.outcome : first ? first.ev + (first.why ? ': ' + first.why : '') : ''} | ${d && typeof d.ballast_ok === 'boolean' ? d.ballast_ok : ''} |`);
  await mf.dispose(); }
console.log('| Case | Slot placed at the present time | Requests | Lines | Outcome | Memory intact |\n|---|---|---|---|---|---|');
await one('HTTP request', s => !s.excluded && s.phase === 1);
for (const z of [2048, 1536]) await one(`phase 1, ${z}`, s => !s.excluded && s.phase === 1 && s.size === z);
for (const z of [2048, 1536]) await one(`phase 2, ${z}`, s => !s.excluded && s.phase === 2 && s.size === z);
for (const b of [16, 48, 96]) for (const z of [2048, 1536]) await one(`phase 3, ${z}, ${b} MiB`, s => !s.excluded && s.ballast_mib === b && s.size === z);
await one('tick for the slot twenty minutes ago, delivered now', s => !s.excluded && s.phase === 1 && s.n > 4, -2);
await one('tick for the slot twenty minutes ahead, delivered now', s => !s.excluded && s.phase === 1 && s.n > 4 && s.n < 30, 2);
await one('a slot from before the window (scheduled time), delivered now', s => !s.excluded && s.n === 0, -3);
await one('a slot from after the window (scheduled time), delivered now', s => !s.excluded && s.n === 69, 4);
await one('an excluded slot', s => !!s.excluded);
