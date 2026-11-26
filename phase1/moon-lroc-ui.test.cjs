/* Moon LROC regional detail (moon.html, moonlroc.js, moonlroc.css) — real globe.gl 2.45.0 under SwiftShader.
 * MOON-LROC-REGION-PROPOSAL rev 2.1 §6 and §9, with GPT's closure notes.
 *  A. off by default: no LROC request, nothing on the globe, panel hidden
 *  B. switching on: the globe turns to the site through the ordinary view call; the locator sits at the site's screen position, ignores
 *     pointer events, and is labelled as a locator, not a footprint; only the area picture (and its mask) is requested
 *  C. panel facts: caption (date, image, spacing, "not a measured reflectance", credit), alt text, ground-distance scale bar that
 *     resizes with the picture; footprint box, pointer and no-data overlay placed from SOURCE.json geometry
 *  D. lazy views, late results dropped (view switched, switched off), failure + Retry, timeout, wrong-size picture
 *  E. switching off: camera and zoom unchanged, Earth view not reopened, locator removed, focus to the button
 *  F. locator hidden past the limb and on the far side; hidden in the Earth view and back afterwards; detail on from the Earth view
 *     leaves it and keeps "Lit as now"; height mode kept; clicks pass through to the height readout; LRO path independent
 *  G. keyboard; narrow 360/390/721 px; served assets equal SOURCE.json; appearance map unchanged; WebGL draw calls per frame unchanged
 * Run: node phase1/moon-lroc-ui.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=turn|late|offlate|pe|novis|earthloc|fp|ptr|bar|nd|retry|offcam|eager|size must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/moon/lroc/SOURCE.json'), 'utf8'));
const MOONSRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/moon/SOURCE.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 400) : ''); } };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SITE = { lat: 0.67416, lng: 23.47314 };
let brkSeen = false;
function patchJs(s) {
  const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); brkSeen = true; };
  if (BREAK === 'turn') B('if (MG() && MG().point) MG().point(SITE.lat, SITE.lng);', '');
  if (BREAK === 'late') B('if (tok !== S.tok || !S.on || S.view !== view) return;', 'if (!S.on) return;');
  if (BREAK === 'offlate') B('if (tok !== S.tok || !S.on || S.view !== view) return;', 'if (tok !== S.tok && S.view !== view) return;');
  if (BREAK === 'novis') B("el.style.visibility = S.locVisible ? 'visible' : 'hidden';", "el.style.visibility = 'visible';");
  if (BREAK === 'earthloc') B('S.earth = earthView(); S.locVisible = vis && !S.earth;', 'S.earth = false; S.locVisible = vis;');
  if (BREAK === 'fp') B('left: FP.x * 100', 'left: (FP.x + 0.02) * 100');
  if (BREAK === 'ptr') B("left: PTR.x * 100 + '%', top: PTR.y * 100 + '%'", "left: PTR.y * 100 + 3 + '%', top: PTR.x * 100 + '%'");
  if (BREAK === 'bar') B("bar.style.width = px.toFixed(1) + 'px';", "bar.style.width = '100px';");
  if (BREAK === 'nd') B('nd.hidden = !a;', 'nd.hidden = a;');
  if (BREAK === 'retry') B("retry.hidden = state !== 'failed';", 'retry.hidden = true;');
  if (BREAK === 'offcam') B("setState('off', ''); img.removeAttribute('src');", "setState('off', ''); if (MG() && MG().point) MG().point(0, 0); img.removeAttribute('src');");
  if (BREAK === 'eager') B('S.earth = earthView(); locLine(); load(S.view);', "S.earth = earthView(); locLine(); preload(V.site.url); load(S.view);");
  if (BREAK === 'size') B("(w && (im.naturalWidth !== w || im.naturalHeight !== h)) ? rej('the picture was not the expected size') : res(im)", 'res(im)');
  return s;
}
function patchCss(s) {
  if (BREAK === 'pe') { const a = 'pointer-events:none;box-sizing:border-box}'; if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, 'pointer-events:auto;box-sizing:border-box}'); brkSeen = true; }
  return s;
}

let br = null;
(async () => {
  br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await br.newContext({ viewport: { width: opt.w || 1000, height: opt.h || 900 }, reducedMotion: 'reduce' });
    const hits = { area: 0, mask: 0, site: 0 };
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonlroc.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'moonlroc.js'), 'utf8'); s = patchJs(s);
      if (opt.timeout) s = s.replace('const TIMEOUT_MS = 20000;', `const TIMEOUT_MS = ${opt.timeout};`);
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    await ctx.route('**/moonlroc.css*', r => r.fulfill({ status: 200, contentType: 'text/css', body: patchCss(fs.readFileSync(path.join(ROOT, 'moonlroc.css'), 'utf8')) }));
    const asset = (key, file) => ctx.route(`**/assets/moon/lroc/${file}*`, async r => { hits[key]++;
      const o = (opt.assets || {})[key] || {};
      if (o.delay) await new Promise(res => setTimeout(res, o.delay));
      if (o.hang) return;
      if (o.status) return r.fulfill({ status: o.status, body: '' }).catch(() => {});
      const body = fs.readFileSync(path.join(ROOT, 'assets/moon/lroc', o.swap || file));
      r.fulfill({ status: 200, contentType: file.endsWith('png') ? 'image/png' : 'image/jpeg', headers: { 'cache-control': 'no-store' }, body }).catch(() => {}); });
    await asset('area', 'a11-area-4m.jpg'); await asset('mask', 'a11-area-4m-mask.png'); await asset('site', 'a11-site-0p5m.jpg');
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html'); await p.waitForFunction(() => document.getElementById('mg-globe').dataset.ready === '1', null, { timeout: 30000 });
    await p.waitForTimeout(300);
    return { ctx, p, hits, errs, close: () => ctx.close() };
  };
  const st = p => p.evaluate(() => MoonLroc.state());
  const waitState = (p, s, t = 20000) => p.waitForFunction(s => MoonLroc.state().state === s, s, { timeout: t });
  const ringBox = p => p.evaluate(() => { const r = document.querySelector('.mgl-ring'); if (!r) return null; const b = r.getBoundingClientRect(), g = document.getElementById('mg-globe').getBoundingClientRect();
    const cs = getComputedStyle(r); return { x: b.x + b.width / 2 - g.x, y: b.y + b.height / 2 - g.y, w: b.width, disp: cs.display === 'none' || cs.visibility === 'hidden' ? 'none' : 'shown', pe: getComputedStyle(r).pointerEvents, cx: b.x + b.width / 2, cy: b.y + b.height / 2 }; });
  const near = (a, b, t) => Math.abs(a - b) <= t;

  // ---------- A
  { const T = await mk();
    const s = await st(T.p);
    ok('A1 off by default', !s.on && s.state === 'off' && await T.p.getAttribute('#mg-lroc', 'aria-pressed') === 'false');
    ok('A2 panel and locator line hidden', await T.p.evaluate(() => document.getElementById('mg-lroc-panel').hidden && document.getElementById('mg-lroc-loc').hidden));
    ok('A3 no LROC request while off', T.hits.area + T.hits.mask + T.hits.site === 0, T.hits);
    ok('A4 nothing in the globe HTML layer', await T.p.evaluate(() => !document.querySelector('.mgl-ring')));
    // ---------- B
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown'); await T.p.waitForTimeout(300);
    const v = await T.p.evaluate(() => MoonGlobe.view());
    ok('B1 globe turned to the site', near(v.lat, SITE.lat, 1e-6) && near(v.lng, SITE.lng, 1e-6), v);
    const rb = await ringBox(T.p), scr = await T.p.evaluate(s => MoonGlobe.screen(s.lat, s.lng), SITE);
    ok('B2 locator at the site screen position (within 2 px)', rb && near(rb.x, scr.x, 2) && near(rb.y, scr.y, 2) && rb.disp !== 'none', { rb, scr });
    ok('B3 locator fixed 14 px and ignores pointer events', rb && rb.w === 14 && rb.pe === 'none', rb);
    const loc = await T.p.textContent('#mg-lroc-loc');
    ok('B4 locator line says locator, not footprint, and the globe scale', /locator for the Apollo 11 site/.test(loc) && /not the image’s footprint/.test(loc) && /about 5 km a pixel/.test(loc), loc);
    ok('B5 only the area picture and its mask requested', T.hits.area === 1 && T.hits.mask >= 1 && T.hits.site === 0, T.hits);
    ok('B6 button pressed and renamed', await T.p.getAttribute('#mg-lroc', 'aria-pressed') === 'true' && /Hide/.test(await T.p.textContent('#mg-lroc')));
    // ---------- C (area)
    const cap = await T.p.textContent('#mg-lroc-cap');
    ok('C1 caption: image, date, times, PDS, averaged 4 m, not reflectance, credit', ['M150368601', '22 January 2011', '20:48:53–20:49:11 UTC', 'from the PDS', 'averaged to 4 m', 'at least 2 of 4', 'not a measured reflectance', 'NASA/GSFC/Arizona State University'].every(k => cap.includes(k)), cap);
    ok('C2 alt text names the area and the no-data strips', /Apollo 11 landing area/.test(await T.p.getAttribute('#mg-lroc-img', 'alt')) && /no image data/.test(await T.p.getAttribute('#mg-lroc-img', 'alt')));
    const geo = await T.p.evaluate(() => { const i = document.getElementById('mg-lroc-img').getBoundingClientRect(), f = document.getElementById('mg-lroc-fp').getBoundingClientRect(), n = document.getElementById('mg-lroc-nd');
      return { iw: i.width, ih: i.height, fx: (f.x - i.x) / i.width, fy: (f.y - i.y) / i.height, fw: f.width / i.width, fh: f.height / i.height, nd: !n.hidden && getComputedStyle(n).display !== 'none',
        mask: getComputedStyle(n).maskImage || getComputedStyle(n).webkitMaskImage, bar: parseFloat(document.getElementById('mg-lroc-bar').style.width), barl: document.getElementById('mg-lroc-barl').textContent }; });
    const F = SRC.geometry.site_footprint_in_area;
    ok('C3 footprint box placed from SOURCE.json geometry (within 1 px)', near(geo.fx * geo.iw, F.x * geo.iw, 1) && near(geo.fy * geo.ih, F.y * geo.ih, 1) && near(geo.fw * geo.iw, F.w * geo.iw, 1.5) && near(geo.fh * geo.ih, F.h * geo.ih, 1.5), { geo, F });
    ok('C4 no-data hatch shown, masked by the lossless PNG', geo.nd && /a11-area-4m-mask\.png/.test(geo.mask), geo);
    ok('C5 scale bar: 1 km at the picture’s own scale (within 0.5 px)', geo.barl === '1 km' && near(geo.bar, 1000 / (SRC.geometry.area_ground_m.width / geo.iw), 0.5), geo);
    ok('C6 pointer option hidden in the area view', await T.p.evaluate(() => document.getElementById('mg-lroc-ptr-l').hidden && document.getElementById('mg-lroc-arrow').hidden));
    await T.p.setViewportSize({ width: 600, height: 900 }); await T.p.waitForTimeout(400);
    const g2 = await T.p.evaluate(() => ({ iw: document.getElementById('mg-lroc-img').getBoundingClientRect().width, bar: parseFloat(document.getElementById('mg-lroc-bar').style.width) }));
    ok('C7 scale bar resizes with the picture', g2.iw < geo.iw && near(g2.bar, 1000 / (4220 / g2.iw), 0.5), { g2, geo });
    await T.p.setViewportSize({ width: 1000, height: 900 }); await T.p.waitForTimeout(300);
    // ---------- C (site)
    await T.p.check('input[name="mg-lroc-view"][value="site"]'); await T.p.waitForFunction(() => MoonLroc.state().view === 'site' && MoonLroc.state().state === 'shown');
    ok('C8 site picture requested only when chosen', T.hits.site === 1, T.hits);
    const cap2 = await T.p.textContent('#mg-lroc-cap');
    ok('C9 site caption: native 0.5 m spacing and screen caveat', /native pixel spacing of 0\.5 m/.test(cap2) && /depends on your screen/.test(cap2), cap2);
    ok('C10 site view: no hatch, no footprint box, pointer option shown, arrow hidden until chosen', await T.p.evaluate(() => document.getElementById('mg-lroc-nd').hidden && document.getElementById('mg-lroc-fp').hidden && !document.getElementById('mg-lroc-ptr-l').hidden && document.getElementById('mg-lroc-arrow').hidden));
    await T.p.check('#mg-lroc-ptr'); await T.p.waitForTimeout(150);
    const pg = await T.p.evaluate(() => { const i = document.getElementById('mg-lroc-img').getBoundingClientRect(), a = document.getElementById('mg-lroc-arrow').getBoundingClientRect(); return { x: (a.x - i.x) / i.width, y: (a.y - i.y) / i.height, iw: i.width, vis: !document.getElementById('mg-lroc-arrow').hidden, bar: parseFloat(document.getElementById('mg-lroc-bar').style.width), barl: document.getElementById('mg-lroc-barl').textContent }; });
    const P = SRC.geometry.pointer_in_site;
    ok('C11 pointer at the published LM position (within 1 px)', pg.vis && near(pg.x * pg.iw, P.x * pg.iw, 1) && near(pg.y * pg.iw, P.y * pg.iw, 1), { pg, P });
    ok('C12 site scale bar: 100 m (within 0.5 px)', pg.barl === '100 m' && near(pg.bar, 100 / (512 / pg.iw), 0.5), pg);
    // ---------- E: off
    await T.p.click('#mg-north'); const before = await T.p.evaluate(() => MoonGlobe.view());
    await T.p.click('#mg-lroc'); await T.p.waitForTimeout(300);
    const after = await T.p.evaluate(() => MoonGlobe.view()), s2 = await st(T.p);
    ok('E1 off: camera and zoom unchanged', near(after.lat, before.lat, 1e-9) && near(after.lng, before.lng, 1e-9) && near(after.altitude, before.altitude, 1e-9), { before, after });
    ok('E2 off: panel hidden, locator removed, state off', !s2.on && s2.state === 'off' && await T.p.evaluate(() => document.getElementById('mg-lroc-panel').hidden && !document.querySelector('.mgl-ring')));
    ok('E3 off: focus on the button', await T.p.evaluate(() => document.activeElement && document.activeElement.id === 'mg-lroc'));
    ok('A5 no page errors', T.errs.length === 0, T.errs);
    // ---------- G: served bytes and the appearance map
    const served = await T.p.evaluate(async () => { const h = async u => { const b = await (await fetch(u, { cache: 'no-store' })).arrayBuffer(); return [b.byteLength, [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('')]; };
      return { area: await h('assets/moon/lroc/a11-area-4m.jpg'), site: await h('assets/moon/lroc/a11-site-0p5m.jpg'), mask: await h('assets/moon/lroc/a11-area-4m-mask.png'), moon: await h('assets/moon/lroc_color_2k.jpg') }; });
    ok('G1 served LROC files equal SOURCE.json', served.area[1] === SRC.files['a11-area-4m.jpg'].sha256 && served.site[1] === SRC.files['a11-site-0p5m.jpg'].sha256 && served.mask[1] === SRC.files['a11-area-4m-mask.png'].sha256, served);
    ok('G2 appearance map unchanged', served.moon[1] === MOONSRC.sha256 && served.moon[0] === MOONSRC.bytes, served.moon);
    await T.close(); }

  // ---------- D: late results, failure, retry, timeout, wrong size
  { const T = await mk({ assets: { site: { delay: 1500 } } });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown');
    await T.p.check('input[name="mg-lroc-view"][value="site"]'); await T.p.waitForTimeout(200);
    await T.p.check('input[name="mg-lroc-view"][value="area"]'); await waitState(T.p, 'shown'); await T.p.waitForTimeout(1800);
    const s = await st(T.p);
    ok('D1 a late site picture is dropped after switching back to area', s.view === 'area' && /a11-area-4m/.test(s.shown) && /a11-area-4m/.test(await T.p.getAttribute('#mg-lroc-img', 'src')), s);
    await T.close(); }
  { // a fresh page, so no earlier load of the site picture can answer from the browser's image cache
    const T = await mk({ assets: { site: { delay: 1500 } } });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown');
    await T.p.check('input[name="mg-lroc-view"][value="site"]'); await T.p.waitForTimeout(200);
    const mid = await st(T.p);
    await T.p.click('#mg-lroc'); await T.p.waitForTimeout(1800);
    const s2 = await st(T.p);
    ok('D2 switched off during a load (still loading at the click): the late picture never reopens the panel', mid.state === 'loading' && mid.view === 'site' && T.hits.site === 1 && !s2.on && s2.state === 'off'
      && await T.p.evaluate(() => document.getElementById('mg-lroc-panel').hidden && !document.getElementById('mg-lroc-img').getAttribute('src')), { mid, s2, hits: T.hits });
    await T.close(); }
  { const T = await mk({ assets: { area: { status: 404 } } });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'failed');
    const txt = await T.p.textContent('#mg-lroc-state'), rb = await ringBox(T.p);
    ok('D3 failure: plain message, Retry shown, figure hidden, locator kept', /Detailed image unavailable/.test(txt) && await T.p.isVisible('#mg-lroc-retry') && await T.p.evaluate(() => document.getElementById('mg-lroc-fig').hidden) && rb && rb.disp !== 'none', { txt, rb });
    await T.ctx.unroute('**/assets/moon/lroc/a11-area-4m.jpg*');
    await T.ctx.route('**/assets/moon/lroc/a11-area-4m.jpg*', r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(path.join(ROOT, 'assets/moon/lroc/a11-area-4m.jpg')) }));
    if (await T.p.isVisible('#mg-lroc-retry')) { await T.p.focus('#mg-lroc-retry'); await T.p.keyboard.press('Enter'); await waitState(T.p, 'shown').catch(() => {}); }
    ok('D4 Retry (keyboard) loads the picture', (await st(T.p)).state === 'shown' && !(await T.p.isVisible('#mg-lroc-retry')));
    await T.close(); }
  { const T = await mk({ timeout: 1200, assets: { area: { hang: true } } });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'failed', 5000);
    ok('D5 timeout ends in a failure with Retry', /took too long/.test(await T.p.textContent('#mg-lroc-state')) && await T.p.isVisible('#mg-lroc-retry'));
    await T.close(); }
  { const T = await mk({ assets: { area: { swap: 'a11-site-0p5m.jpg' } } });
    await T.p.click('#mg-lroc'); await T.p.waitForFunction(() => MoonLroc.state().state !== 'loading', null, { timeout: 20000 }).catch(() => {});
    ok('D6 a picture of the wrong size is refused', (await st(T.p)).state === 'failed' && /not the expected size/.test(await T.p.textContent('#mg-lroc-state')), await st(T.p));
    await T.close(); }

  // ---------- F: occlusion, Earth view, Lit, height, click-through, LRO path
  { const T = await mk();
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown'); await T.p.waitForTimeout(200);
    const vis = async () => { await T.p.waitForTimeout(250); const r = await ringBox(T.p); return r && r.disp !== 'none'; };
    await T.p.click('#mg-far'); ok('F1 locator hidden with the far side in view', !(await vis()));
    await T.p.click('#mg-near'); ok('F2 locator back with the near side in view', await vis());
    // from the ordinary camera (altitude 2.2: 3.2 Moon radii out) the visible limb is acos(1/3.2) = 71.8° from the view centre
    const limb = await T.p.evaluate(() => Math.acos(100 / MoonGlobe.globe().camera().position.length()) * 180 / Math.PI);
    await T.p.evaluate(s => MoonGlobe.point(s.lat, s.lng - 85), SITE); ok(`F3 locator hidden 85° from the centre (limb ${limb.toFixed(1)}°)`, !(await vis()));
    await T.p.evaluate(s => MoonGlobe.point(s.lat, s.lng - 60), SITE); ok(`F4 locator shown 60° from the centre (limb ${limb.toFixed(1)}°)`, await vis());
    // Lit as now + Earth view
    await T.p.click('#mg-near');
    await T.p.click('#mg-lit'); await T.p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 20000 });
    await T.p.click('#mg-earth'); await T.p.waitForFunction(() => MoonGlobe.light().earthView);
    await T.p.waitForTimeout(300);
    ok('F5 Earth view: locator hidden, panel stays open, line says so', !(await vis()) && !(await T.p.evaluate(() => document.getElementById('mg-lroc-panel').hidden)) && /Locator hidden in the Earth view/.test(await T.p.textContent('#mg-lroc-loc')));
    ok('F6 Earth view kept (camera left alone)', await T.p.evaluate(() => MoonGlobe.light().earthView));
    await T.p.click('#mg-near'); await T.p.waitForTimeout(300);
    ok('F7 back to the ordinary view: locator shown, line restored', !(await T.p.evaluate(() => MoonGlobe.light().earthView)) && await vis() && /Ring: locator/.test(await T.p.textContent('#mg-lroc-loc')));
    // switch on from the Earth view
    await T.p.click('#mg-lroc'); await T.p.waitForTimeout(200);
    await T.p.click('#mg-earth'); await T.p.waitForFunction(() => MoonGlobe.light().earthView);
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown'); await T.p.waitForTimeout(300);
    const L = await T.p.evaluate(() => MoonGlobe.light());
    ok('F8 switching on from the Earth view leaves it, keeps "Lit as now", shows the locator', !L.earthView && L.on && await vis(), { earth: L.earthView, on: L.on });
    await T.p.click('#mg-lit'); await T.p.waitForFunction(() => !MoonGlobe.light().on);
    // height mode kept; clicks pass through
    await T.p.click('#mg-lroc'); await T.p.waitForTimeout(150);
    await T.p.click('#mg-height'); await T.p.waitForFunction(() => document.getElementById('mg-height').getAttribute('aria-pressed') === 'true' && MoonScience.state().active === 'height', null, { timeout: 30000 });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown'); await T.p.waitForTimeout(300);
    ok('F9 height mode kept when the detail opens', await T.p.evaluate(() => MoonScience.state().active === 'height' && document.getElementById('mg-height').getAttribute('aria-pressed') === 'true'));
    await T.p.evaluate(() => document.getElementById('mg-globe').scrollIntoView({ block: 'center' })); await T.p.waitForTimeout(300);
    const rb = await ringBox(T.p);
    const under = await T.p.evaluate(r => { const e = document.elementFromPoint(r.cx, r.cy); return e ? (e.className && e.className.baseVal !== undefined ? 'svg' : e.className || e.tagName) : null; }, rb);
    ok('F10 the locator is not the element under its own centre (click-through)', under !== 'mgl-ring', under);
    await T.p.evaluate(() => { document.getElementById('mg-height-read').textContent = ''; });
    await T.p.mouse.click(rb.cx, rb.cy); await T.p.waitForTimeout(400);
    const hr = await T.p.textContent('#mg-height-read');
    const mm = hr.match(/^([\d.]+)°N, ([\d.]+)°E \(clicked\): .* m relative to/);
    ok('F11 a click on the locator reaches the height readout (at the site, within 0.5°)', !!mm && near(+mm[1], SITE.lat, 0.5) && near(+mm[2], SITE.lng, 0.5), hr);
    await T.p.click('#mg-height'); await T.p.waitForFunction(() => MoonScience.state().active !== 'height', null, { timeout: 20000 });
    // LRO path independent
    await T.p.click('#mg-lro'); await T.p.waitForTimeout(300);
    ok('F12 LRO path on with the detail: locator still present', await T.p.evaluate(() => MoonGlobe.lro().on) && !!(await ringBox(T.p)));
    await T.p.click('#mg-lroc'); await T.p.waitForTimeout(200);
    ok('F13 detail off leaves the LRO path setting alone', await T.p.evaluate(() => MoonGlobe.lro().on) && !(await ringBox(T.p)));
    ok('F14 no page errors', T.errs.length === 0, T.errs);
    await T.close(); }

  // ---------- G: keyboard, narrow layouts, draw calls
  { const T = await mk();
    await T.p.focus('#mg-lroc'); await T.p.keyboard.press('Enter'); await waitState(T.p, 'shown');
    await T.p.focus('input[name="mg-lroc-view"][value="area"]'); await T.p.keyboard.press('ArrowRight');
    await T.p.waitForFunction(() => MoonLroc.state().view === 'site' && MoonLroc.state().state === 'shown');
    await T.p.focus('#mg-lroc-ptr'); await T.p.keyboard.press('Space'); await T.p.waitForTimeout(150);
    ok('G3 keyboard: button, view radios and pointer checkbox work', (await st(T.p)).view === 'site' && await T.p.evaluate(() => !document.getElementById('mg-lroc-arrow').hidden));
    // WebGL draw calls per rendered frame, detail on vs off (the locator is HTML, not a WebGL draw)
    const calls = async () => T.p.evaluate(() => new Promise(res => { const r = MoonGlobe.globe().renderer(); const seen = []; let n = 0;
      const tick = () => { seen.push(r.info.render.calls); if (++n < 20) requestAnimationFrame(tick); else res(Math.max(...seen)); }; requestAnimationFrame(tick); }));
    const on = await calls(); await T.p.click('#mg-lroc'); await T.p.waitForTimeout(300); const off = await calls();
    ok('G4 WebGL draw calls per frame: detail on equals off', on === off, { on, off });
    console.log('measure: WebGL draw calls per frame, detail on', on, 'off', off);
    await T.close(); }
  for (const w of [360, 390, 721]) {
    const T = await mk({ w, h: 800 });
    await T.p.click('#mg-lroc'); await waitState(T.p, 'shown');
    const m = await T.p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, img: document.getElementById('mg-lroc-img').getBoundingClientRect().width }));
    ok(`G5 ${w} px: no sideways overflow; picture fits`, m.sw <= m.iw && m.img <= m.iw && m.img > 200, m);
    await T.close();
  }
  if (BREAK && !brkSeen) { console.log('SETUP FAIL: break pattern not applied: ' + BREAK); process.exitCode = 2; }
  else if (BREAK) console.log('BREAK applied (pattern found): ' + BREAK);
  console.log(`moon-lroc-ui: ${pass} passed, ${fail} failed`);
  await br.close();
  if (fail) process.exitCode = 1;
})().catch(async e => { console.log('SETUP FAIL', e && e.message); console.log(`moon-lroc-ui (stopped early): ${pass} passed, ${fail} failed`); process.exitCode = 2; try { if (br) await br.close(); } catch (_) { } });
