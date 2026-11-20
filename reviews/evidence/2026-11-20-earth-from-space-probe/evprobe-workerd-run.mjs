/* Runs phase1/evprobe.js, as built, inside workerd (Cloudflare's open-source runtime) through Miniflare, with EUMETView replaced by
 * the fixtures. Shows that the file loads and runs as a Worker with no bindings and that it cannot be called over HTTP. It shows
 * NOTHING about memory capacity: local workerd enforces no 128 MB limit (workerd-local-spike-2026-11-20.md).
 *   node evprobe-workerd-run.mjs <path to miniflare's dist/src/index.js> */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P1 = path.resolve(HERE, '../../../phase1'), FX = path.join(P1, 'earthview-fixtures');
const { Miniflare, Response } = await import(pathToFileURL(process.argv[2]).href);
const src = fs.readFileSync(path.join(P1, 'evprobe.js'), 'utf8'), START = Date.parse(/^const PROBE_START = '([^']+)'/m.exec(src)[1]);
const plan = (await import(pathToFileURL(path.join(P1, 'evprobe.js')).href)).default.__probe.evprobePlan(START);
const T = '2026-11-19T11:00:00Z', reqs = [], lines = [];
const mf = new Miniflare({ modules: true, script: src, compatibilityDate: '2026-07-01',
  outboundService: async request => { const u = request.url; reqs.push(u);
    if (/GetCapabilities/.test(u)) return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${T}">x</Dimension></Layer></WMS_Capabilities>`, { headers: { 'content-type': 'text/xml' } });
    const isPic = /image\/jpeg/.test(u), size = Number((u.match(/width=(\d+)/) || [])[1]), f = isPic ? (size === 2048 ? 'day.jpg' : 'day-1536-derived.jpg') : 'day.png';
    return new Response(fs.readFileSync(path.join(FX, f)), { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${T.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); },
  handleRuntimeStdio(stdout, stderr) { let buf = ''; stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { lines.push(JSON.parse(l)); } catch (_) { if (l.trim()) lines.push({ raw: l }); } } }); stderr.on('data', d => { const s = String(d).trim(); if (s) lines.push({ stderr: s.slice(0, 300) }); }); } });
await mf.ready; const w = await mf.getWorker();
let http = null; try { const r = await mf.dispatchFetch('http://probe.invalid/'); http = r.status + ' ' + (await r.text()).slice(0, 120).replace(/\s+/g, ' '); } catch (e) { http = 'threw: ' + String(e).slice(0, 160); }
console.log('HTTP request to the Worker ->', http);
const pick = [plan.find(s => s.phase === 1 && s.size === 2048), plan.find(s => s.phase === 1 && s.size === 1536), plan.find(s => s.phase === 2 && s.size === 2048), plan.find(s => s.phase === 2 && s.size === 1536),
  ...[16, 48, 96].flatMap(b => [2048, 1536].map(z => plan.find(s => s.ballast_mib === b && s.size === z))), plan.find(s => s.excluded), { k: -3, at: 'before the window' }, { k: 75, at: 'after the window' }];
console.log('| Slot | Phase | Size | Ballast MiB | Requests | Lines | Outcome | Validation wall ms | Memory intact |\n|---|---|---|---|---|---|---|---|---|');
for (const s of pick) { const n0 = reqs.length, l0 = lines.length; await w.scheduled({ scheduledTime: new Date(START + s.k * 600000), cron: '*/10 * * * *' }); await new Promise(r => setTimeout(r, 150));
  const L = lines.slice(l0), d = L.find(l => l.ev === 'done'), v = L.filter(l => l.ev === 'validated');
  console.log(`| ${s.k} | ${s.phase || '—'} | ${s.size || '—'} | ${s.ballast_mib || ''} | ${reqs.length - n0} | ${L.map(l => l.ev || (l.stderr ? 'STDERR' : 'raw')).join(' ')} | ${d ? d.outcome : (L[0] && L[0].ev) || 'no line'} | ${v.map(x => x.wall_ms).join(', ')} | ${d && d.ballast_ok !== null && d.ballast_ok !== undefined ? d.ballast_ok : ''} |`); }
const bad = lines.filter(l => l.raw || l.stderr); if (bad.length) console.log('other output:', JSON.stringify(bad.slice(0, 5)));
await mf.dispose();
