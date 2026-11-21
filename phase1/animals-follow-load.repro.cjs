/* Mother Earth — a second timing probe (Stage 4 r2), not a test suite. It repeats the exact sequence after which the page
 * suite once reported a 31 s page load: desktop page with the corridor and the zebra journey on, journey go-to, a drag,
 * context closed, then a phone-width page opened at once. Prints, for each repeat, how long the previous context took to close
 * and the next page's times; for any next page slower than 5 s, each request's arrival time. Nothing is asserted.
 * Run: NODE_PATH=<...> node --no-warnings phase1/animals-follow-load.repro.cjs   REPS=8 (default) */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), GLOBE_PATH = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('globe.gl not found on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8'), REPS = +(process.env.REPS || 8), T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }; let log = [], t0 = 0;
const srv = http.createServer((q, s) => { log.push([Date.now() - t0, q.url.slice(0, 50)]); const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, ''), full = path.join(ROOT, f); if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); s.end(fs.readFileSync(full)); });
(async () => { await new Promise(r => srv.listen(0, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:' + srv.address().port + '/animals.html';
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async vp => { const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' }); await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS })); await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' })); await ctx.route('**/*.nasa.gov/**', r => r.abort());
    const page = await ctx.newPage(); t0 = Date.now(); log = []; const o = {}; await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 180000 }); o.dcl = Date.now() - t0; await page.waitForFunction(() => window.ME && ME.corridor && ME.corridor.state().facts !== 'loading', null, { timeout: 180000 }); o.record = Date.now() - t0; return { ctx, page, o, reqs: log.slice() }; };
  for (let i = 0; i < REPS; i++) { const withCorridor = process.env.CONTROL ? false : true; const a = await open({ width: 1280, height: 860 });
    if (withCorridor) { await a.page.click('#cor-tgl'); await a.page.waitForFunction(() => ME.corridor.state().status === 'shown', null, { timeout: 120000 }); }
    await a.page.click('#tgl-zebra-botswana-Z3866'); await a.page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 120000 }); await a.page.click('#replay-goto'); await a.page.waitForTimeout(500);
    const box = await a.page.locator('#an-globe').boundingBox(); await a.page.mouse.move(box.x + 200, box.y + 200); await a.page.mouse.down(); await a.page.mouse.move(box.x + 230, box.y + 205, { steps: 3 }); await a.page.mouse.up(); await a.page.waitForTimeout(500);
    const tc = Date.now(); await a.ctx.close(); const closeMs = Date.now() - tc; const b = await open({ width: 390, height: 740 });
    console.log(JSON.stringify({ rep: i, corridor: withCorridor, firstPage: a.o, closeMs, nextPage: b.o, ...(b.o.dcl > 5000 ? { requests: b.reqs } : {}) })); await b.ctx.close(); }
  await browser.close(); srv.close(); process.exit(0); })().catch(e => { console.log('could not run: ' + (e && e.stack || e)); process.exit(1); });
