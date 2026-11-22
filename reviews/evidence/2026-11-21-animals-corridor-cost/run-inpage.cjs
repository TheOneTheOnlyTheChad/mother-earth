/* Runs an in-page script (the same file the Mac runs) on a working tree in the workspace's software-renderer Chromium. Usage: node run-inpage.cjs <root> <script.js> <resultVar> */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.argv[2], SCRIPT = fs.readFileSync(process.argv[3], 'utf8'), VAR = process.argv[4];
const GDIR = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist')).find(f => fs.existsSync(f)), GLOBE_JS = fs.readFileSync(path.join(GDIR, 'globe.gl.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); s.end(fs.readFileSync(p)); });
(async () => { await new Promise(r => srv.listen(0, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(BASE)) return r.continue(); if (/unpkg\.com\/globe\.gl/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: GLOBE_JS }); return r.abort(); });
  const page = await ctx.newPage(); await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.corridor && ME.corridor.state().facts === 'ready' && ME.animalsGlobe && ME.animalsGlobe.raw() && !['none', 'loading'].includes(ME.animalsGlobe.state().backdrop), null, { timeout: 120000 }); await page.waitForTimeout(1500);
  await page.evaluate(SCRIPT); await page.waitForFunction(v => window[v] && window[v].done, VAR, { timeout: 600000 });
  console.log(JSON.stringify(await page.evaluate(v => window[v], VAR))); await browser.close(); srv.close(); })().catch(e => { console.log('FAIL', e); process.exit(1); });
