/* Moon item 10a assessment (docs only): how large the Moon is drawn in the CURRENT Sky zoom-out view, unchanged main.
 * Real index.html + app.js + sky.js + skyscene.js served locally on 8899; real globe.gl 2.45.0 (SwiftShader); hub routed to the
 * committed R1 and scene files (as phase1/sky-zoom-ui.test.cjs does); Playwright's clock fixes the date. Reads ME.zoomState().last
 * (the page's own projected radius, rpx) at stops A, B and C, and an independent radius from the camera and mesh scale.
 * Run: (cd <repo> && python3 -m http.server 8899 --bind 127.0.0.1) &  node sky-moon-size.cjs <repo>
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = process.argv[2], BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const R1 = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-2026-11-R1.json'), 'utf8');
const SC = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8');
const VIEWS = process.env.VIEWS ? JSON.parse(process.env.VIEWS) : [[360, 740], [390, 844], [721, 900], [1280, 900], [1920, 1080]];
const DATES = (process.env.DATES || '2026-11-27').split(',');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const out = [];
  for (const date of DATES) for (const [w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', deviceScaleFactor: +(process.env.DPR || 1) });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname;
      if (p === '/catalogue/sky/sky-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: R1 });
      if (p === '/catalogue/sky/sky-scene-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: SC });
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.clock.install({ time: new Date(date + 'T10:00:00Z') });
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState && ME.skyState, null, { timeout: 30000 });
    await page.click('#tgl-sky'); await page.waitForFunction(() => ME.skyState().status === 'ok', null, { timeout: 20000 });
    await page.click('#tgl-zoom');
    await page.waitForFunction(() => { const z = ME.zoomState(); return z.open && z.path || /unavailable|No computed/.test(z.msg); }, null, { timeout: 20000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 450)));
    const row = { date, w, h, stops: {} };
    for (const n of [0, 1, 2]) {
      row.stops['ABC'[n]] = await page.evaluate(n => { ME.zoomGo(n); ME.zoomFrame(); const z = ME.zoomState(), L = z.last;
        const g = ME.globe(), cam = g.camera(), el = g.renderer().domElement, Hc = el.clientHeight; let m = null;
        g.scene().traverse(o => { if (o.__skyScene === 'moon') m = o; });
        const vc = m.position.clone().sub(cam.position).normalize(), ve = m.position.clone().normalize(), view_vs_earthline_deg = +(Math.acos(Math.max(-1, Math.min(1, vc.dot(ve)))) * 180 / Math.PI).toFixed(1);
        const d = cam.position.distanceTo(m.position), indep = m.scale.x / d / Math.tan(cam.fov * Math.PI / 360) * (Hc / 2);
        const it = L.items.find(i => i.k === 'moon'), e = L.items.find(i => i.k === 'earth');
        return { moon_rpx_page: it ? +it.rpx.toFixed(2) : null, moon_rpx_indep: +indep.toFixed(2), moon_inFrame: it ? it.inFrame : null,
          moon_drawable: it ? it.drawable : null, earth_rpx: e ? +e.rpx.toFixed(2) : null, canvas: [el.clientWidth, Hc], dpr: devicePixelRatio, renderer_pixel_ratio: g.renderer().getPixelRatio(), view_vs_earthline_deg,
          cam_basis_three: (() => { const e = cam.matrixWorld.elements; return { right: [e[0], e[1], e[2]], up: [e[4], e[5], e[6]], back: [e[8], e[9], e[10]] }; })(),
          cam_to_moon_three: vc.toArray(), moon_three: m.position.toArray(), moon_screen: it ? [it.x, it.y] : null }; }, n);
    }
    if (process.env.SHOT) { await page.evaluate(() => { ME.zoomGo(1); ME.zoomFrame(); document.getElementById('zoom-svg').style.visibility = 'hidden'; });
      await page.waitForTimeout(400); const b = row.stops.B.moon_screen, el = await page.$('#globe canvas'), bb = await el.boundingBox();
      await page.screenshot({ path: `shot-${date}-${w}x${process.env.DPR || 1}.png`, clip: { x: bb.x + b[0] - 24, y: bb.y + b[1] - 24, width: 48, height: 48 } }); }
    row.errors = perr; out.push(row); console.log(JSON.stringify(row)); await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(process.env.OUT || 'sky-moon-size.json', JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
