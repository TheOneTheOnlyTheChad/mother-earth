/* Screenshots of the Arts card for review (local server + hub routed to the generated file). Not a test.
 * Run: node phase1/arts/shots.cjs <out dir>
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const FILE = fs.readFileSync(path.join(__dirname, 'met-R1-e394878.json'), 'utf8');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const RUN = new Date(Date.now() - 60e3).toISOString();
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [tag, vp] of [['1280', { width: 1280, height: 900 }], ['390', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname;
      if (p === '/snapshot/arts') return r.fulfill({ status: 200, contentType: 'application/json', body: FILE });
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', index: null }) }); });
    const page = await ctx.newPage();
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.arts, null, { timeout: 30000 }); await page.waitForTimeout(1500);
    const card = page.locator('#card-arts');
    await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: path.join(OUT, `arts-off-${tag}.png`) });
    await page.click('#tgl-arts'); await page.waitForFunction(() => ME.arts.state().status === 'ok');
    await page.click('#arts-b-IRN'); await page.waitForTimeout(300);
    await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: path.join(OUT, `arts-on-IRN-open-${tag}.png`) });
    await ctx.close();
  }
  await browser.close();
})();
