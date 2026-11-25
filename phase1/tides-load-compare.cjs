/* Tides: loading cost against the Moon page (proposal T10; GPT's first-build review R5). A measuring tool, not a pass/fail suite.
 *   NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node phase1/tides-load-compare.cjs [runs]
 * Each run is a NEW browser context (cold cache). Every request is answered from this checkout or the local globe.gl 2.45.0
 * build, with no added latency; the hub, fonts and any other host are refused at once. So the timings measure the browser's own
 * work (parsing, decoding pictures, building the 3-D scene) on this machine, not a network. Bytes are the exact sizes of the
 * files each page asked for (wire sizes are not measured: there is no network). Software WebGL (SwiftShader).
 * Readiness:
 *   tides.html  the 3-D scene is built and all three pictures have finished (window.TIDES state: three 'ok', no image 'loading')
 *   moon.html   the Moon globe is built with its map (#mg-globe data-ready="1", set by moonglobe.js after the map has loaded)
 * Prints one JSON object. */
const fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), RUNS = Number(process.argv[2]) || 5;
const LIBF = (process.env.NODE_PATH || '/home/claude/spike/node_modules').split(':').map(d => path.join(d, 'globe.gl/dist/globe.gl.min.js')).find(f => fs.existsSync(f));
const LIB = fs.readFileSync(LIBF);
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const READY = {
  'tides.html': () => !!(window.TIDES && TIDES.state().three === 'ok' && !Object.values(TIDES.state().images).includes('loading')),
  'moon.html': () => { const g = document.getElementById('mg-globe'); return !!(g && g.dataset.ready === '1'); },
};
async function once(browser, page) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }), p = await ctx.newPage();
  const files = {}; let refused = 0;
  await p.route('**/*', r => { const u = new URL(r.request().url());
    if (u.hostname === 'unpkg.com') { files['unpkg:globe.gl.min.js'] = LIB.length; return r.fulfill({ body: LIB, contentType: 'application/javascript' }); }
    if (u.hostname === 'load.test') { const rel = decodeURIComponent(u.pathname).replace(/^\//, ''), f = path.join(ROOT, rel);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) { const b = fs.readFileSync(f); files[rel] = b.length; return r.fulfill({ body: b, contentType: TYPES[path.extname(rel)] || 'application/octet-stream' }); }
      return r.fulfill({ status: 404, body: '' }); }
    refused++; return r.abort(); });
  await p.goto('http://load.test/' + page);
  await p.waitForFunction(READY[page], null, { timeout: 60000, polling: 25 });
  const t = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { ready_ms: Math.round(performance.now()), dcl_ms: Math.round(n.domContentLoadedEventEnd), load_ms: Math.round(n.loadEventEnd) }; });
  await ctx.close();
  const img = Object.entries(files).filter(([k]) => /\.(jpg|png)$/.test(k));
  return Object.assign(t, { refused, bytes_total: Object.values(files).reduce((a, b) => a + b, 0), bytes_images: img.reduce((a, [, b]) => a + b, 0), images: Object.fromEntries(img), files: Object.keys(files).length });
}
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = { 'tides.html': [], 'moon.html': [] };
  for (let i = 0; i < RUNS; i++) for (const pg of (i % 2 ? ['moon.html', 'tides.html'] : ['tides.html', 'moon.html'])) res[pg].push(await once(browser, pg));
  await browser.close();
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const out = { measured_utc: new Date().toISOString(), machine: os.cpus()[0].model + ' × ' + os.cpus().length + ', ' + Math.round(os.totalmem() / 2 ** 30) + ' GB, ' + os.platform(), renderer: 'Chromium headless, SwiftShader (software WebGL)', viewport: '1280×900', cache: 'cold (new context each run)', network: 'none: local files, no latency; other hosts refused', runs: RUNS };
  for (const pg in res) { const r = res[pg]; out[pg] = { ready_ms_median: med(r.map(x => x.ready_ms)), ready_ms_all: r.map(x => x.ready_ms), dcl_ms_median: med(r.map(x => x.dcl_ms)), load_ms_median: med(r.map(x => x.load_ms)), bytes_total: r[0].bytes_total, bytes_images: r[0].bytes_images, images: r[0].images, files: r[0].files, requests_refused: r[0].refused }; }
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
