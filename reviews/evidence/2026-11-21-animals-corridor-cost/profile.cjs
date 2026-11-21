/* Corridor switch-on: bounded CPU profile (Chrome's sampling profiler over CDP) with a nothing-on control,
 * and uninstrumented long-task readings. Runs the real page from a working tree with the real globe library.
 * Usage: NODE_PATH=... node profile.cjs <repo root> <out.json> [min|full]
 *   full = unminified globe.gl build (readable function names) for attribution; min = the build the page uses, for timing.
 * Nothing is added to the page's drawing: no gl.finish, no pixel reads, no scene traversal. The page gets one
 * PerformanceObserver for 'longtask' (and 'long-animation-frame'), installed before the page's scripts. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.argv[2], OUT = process.argv[3], BUILD = process.argv[4] || 'full', RUNS = +(process.env.RUNS || 5);
const GDIR = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist')).find(f => fs.existsSync(f));
const GLOBE_JS = fs.readFileSync(path.join(GDIR, BUILD === 'min' ? 'globe.gl.min.js' : 'globe.gl.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, s) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); s.end(fs.readFileSync(p)); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function summarise(profile, urlNames) {            // self time per function, and inclusive time under chosen ancestors
  const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map(); let total = 0; const dt = profile.timeDeltas, sm = profile.samples;
  for (let i = 0; i < sm.length; i++) { const d = (dt[i] || 0) / 1000; self.set(sm[i], (self.get(sm[i]) || 0) + d); total += d; }
  const name = n => { const c = n.callFrame, u = c.url ? c.url.split('/').pop().split('?')[0] : ''; return `${c.functionName || '(anonymous)'}${u ? ' @' + u + ':' + (c.lineNumber + 1) : ''}`; };
  const bySelf = new Map(), incl = new Map();
  for (const [id, ms] of self) { const n = nodes.get(id), k = name(n); bySelf.set(k, (bySelf.get(k) || 0) + ms);
    const seen = new Set(); for (let p = id; p != null; p = parent.get(p)) { const k2 = name(nodes.get(p)); if (!seen.has(k2)) { seen.add(k2); incl.set(k2, (incl.get(k2) || 0) + ms); } } }
  const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 45).map(([k, v]) => [k, Math.round(v * 10) / 10]);
  return { total_ms: Math.round(total), self_top: top(bySelf), inclusive_top: top(incl) };
}

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(BASE)) return r.continue(); if (/unpkg\.com\/globe\.gl/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: GLOBE_JS }); return r.abort(); });
  await ctx.addInitScript(() => { window.__LT = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__LT.push({ t: e.entryType, s: e.startTime, d: e.duration }); }).observe({ entryTypes: ['longtask', 'long-animation-frame'] }); } catch (_) { try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__LT.push({ t: e.entryType, s: e.startTime, d: e.duration }); }).observe({ entryTypes: ['longtask'] }); } catch (_) { } } });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.ME && ME.corridor && ME.corridor.state().facts === 'ready' && ME.animalsGlobe && ME.animalsGlobe.raw && ME.animalsGlobe.raw() && ME.animalsGlobe.state().backdrop !== 'none' && ME.animalsGlobe.state().backdrop !== 'loading', null, { timeout: 120000 });
  await sleep(1500);
  const out = { build: BUILD, started: new Date().toISOString(), ua: await page.evaluate(() => navigator.userAgent), backdrop: await page.evaluate(() => ME.animalsGlobe.state().backdrop), runs: [], errs };
  const shown = () => page.waitForFunction(() => ME.corridor.state().status === 'shown', null, { timeout: 120000 });
  const press = () => page.evaluate(() => { const t0 = performance.now(); document.getElementById('cor-tgl').click(); return t0; });
  const after = (t0) => page.evaluate(async t0 => { const raf = () => new Promise(r => requestAnimationFrame(r)); await raf(); await raf(); const t2 = performance.now(); await new Promise(r => setTimeout(r, 400)); const lt = window.__LT.filter(e => e.s + e.d > t0 && e.s < t2 + 400); const g = ME.animalsGlobe.raw(); let verts = 0, meshes = 0; g.scene().traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position && o.parent && o.__globeObjType === undefined) { } }); return { t2: t2 - t0, tasks: lt.map(e => ({ type: e.t, start: Math.round(e.s - t0), ms: Math.round(e.d) })) }; }, t0);
  // warm: fetch, verify, decode once; then off
  await press(); await shown(); await sleep(800); await press(); await sleep(800);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  // control: nothing on, same length of window as a switch-on run
  if (process.env.PROFILE !== '0') { await cdp.send('Profiler.start'); const t0 = await page.evaluate(() => performance.now()); await sleep(2500); const { profile } = await cdp.send('Profiler.stop'); const lt = await page.evaluate(t0 => window.__LT.filter(e => e.s > t0).map(e => ({ type: e.t, ms: Math.round(e.d) })), t0); out.control = { window_ms: 2500, tasks: lt, profile: summarise(profile) }; }
  for (let i = 0; i < RUNS; i++) { const prof = process.env.PROFILE !== '0' && i === 0;
    if (prof) await cdp.send('Profiler.start');
    const t0 = await press(); await shown(); const a = await after(t0);
    const run = { run: i + 1, profiled: prof, to_second_frame_ms: Math.round(a.t2), tasks: a.tasks, longest_task_ms: Math.max(0, ...a.tasks.filter(t => t.type === 'longtask').map(t => t.ms)) };
    if (prof) { const { profile } = await cdp.send('Profiler.stop'); run.profile = summarise(profile); fs.writeFileSync(OUT.replace(/\.json$/, '') + '.cpuprofile', JSON.stringify(profile)); }
    out.runs.push(run); await sleep(500); await press(); await sleep(900); }
  out.mesh = await page.evaluate(async () => { document.getElementById('cor-tgl').click(); await new Promise(r => setTimeout(r, 1500)); const g = ME.animalsGlobe.raw(), rows = []; g.scene().traverse(o => { const p = o.geometry && o.geometry.attributes && o.geometry.attributes.position; if (p && p.count > 2000) rows.push({ type: o.type, mat: o.material && (Array.isArray(o.material) ? o.material.map(m => m.type + (m.visible === false ? '(hidden)' : '') + (m.transparent ? '(transparent)' : '')).join('|') : o.material.type), verts: p.count, index: o.geometry.index ? o.geometry.index.count : null, groups: (o.geometry.groups || []).map(x => x.count) }); }); return rows; });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); await browser.close(); srv.close();
  console.log(JSON.stringify({ build: out.build, backdrop: out.backdrop, control_tasks: out.control && out.control.tasks, runs: out.runs.map(r => ({ run: r.run, profiled: r.profiled, t2: r.to_second_frame_ms, longest: r.longest_task_ms, tasks: r.tasks })), mesh: out.mesh, errs }, null, 0));
})().catch(e => { console.log('FAIL', e); process.exit(1); });
