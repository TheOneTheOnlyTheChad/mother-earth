/* Moon globe (moon.html, moonglobe.js) — real globe.gl 2.45.0 under SwiftShader.
 *  A. the globe shows the map point it says it shows (synthetic map with coloured patches at known places)
 *  B. evenly lit, opens on the near side, readout and controls
 *  C. failure states leave the page usable; a stalled library never holds up the spacecraft drawing
 *  D. the REAL map file: pinned bytes, and named landmarks where their published coordinates say
 *     (settles east/west and north/south, which the source page does not state)
 * Run: node phase1/moon-globe.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=lit|far|sign|mirror|flip|wait|late|glide|zoomreset|wheel must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const crypto = require('crypto'); const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const TEX = path.join(ROOT, 'assets/moon/lroc_color_2k.jpg');
const PIN = { sha256: 'f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170', bytes: 457942, w: 2048, h: 1024 };
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
// synthetic map: patches at known selenographic places (lat, east longitude)
const PATCH = [['red', 0, 0, [255, 0, 0]], ['green', 0, 90, [0, 255, 0]], ['blue', 45, -90, [0, 0, 255]], ['white', -20.4, 129.1, [255, 255, 255]], ['yellow', -60, -30, [255, 255, 0]]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: opt.w || 1000, height: 900 }, reducedMotion: opt.motion ? 'no-preference' : 'reduce' });
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', async r => { if (opt.noLib) return r.abort(); if (opt.stall) { await new Promise(res => setTimeout(res, opt.stall)); } r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }).catch(() => {}); });
    await ctx.route('**/moonglobe.js*', async r => { let s = fs.readFileSync(path.join(ROOT, 'moonglobe.js'), 'utf8');
      if (BREAK === 'lit') s = s.replace('globe.lights(amb);', '');
      if (BREAK === 'wait') s = s.replace('LIB_WAIT_MS = 12000', 'LIB_WAIT_MS = 600000');
      if (BREAK === 'late') s = s.replace('if (dead || globe || !libOk || !texOk) return;', 'if (globe || !libOk || !texOk) return;');
      if (BREAK === 'glide') s = s.replace('}, 0); show(); };\n  const go =', '}, 600); setTimeout(show, 650); };\n  const go =');
      if (BREAK === 'zoomreset') s = s.replace('set(v.lat + dlat, v.lng + dlng, alt())', 'set(v.lat + dlat, v.lng + dlng, ALT())');
      if (BREAK === 'wheel') s = s.replace("if (!e.ctrlKey) e.stopPropagation();", '');
      if (BREAK === 'far') s = s.replace('go(0, 180)', 'go(0, 0)');
      if (BREAK === 'sign') s = s.replace("fmt(lng, 'E', 'W')", "fmt(lng, 'W', 'E')");
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    const p = await ctx.newPage();
    if (opt.synthetic) {
      const png = await p.evaluate(({ PATCH, BREAK }) => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#404040'; g.fillRect(0, 0, 1024, 512);
        for (const [, lat, lng, rgb] of PATCH) { let x = (lng + 180) / 360 * 1024, y = (90 - lat) / 180 * 512; if (BREAK === 'mirror') x = 1024 - x; if (BREAK === 'flip') y = 512 - y; g.fillStyle = `rgb(${rgb})`; g.fillRect(x - 28, y - 28, 56, 56); }
        return c.toDataURL('image/png').split(',')[1]; }, { PATCH, BREAK });
      await ctx.route('**/assets/moon/lroc_color_2k.jpg*', r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(png, 'base64') }));
    }
    if (opt.noTex) await ctx.route('**/assets/moon/lroc_color_2k.jpg*', r => r.fulfill({ status: 404, body: '' }));
    await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' }); return { ctx, p };
  };
  const centre = async p => { const el = p.locator('#mg-globe'); const bb = await el.boundingBox(); const shot = await p.screenshot({ clip: { x: bb.x + bb.width / 2 - 3, y: bb.y + bb.height / 2 - 3, width: 6, height: 6 } });
    return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = 6; c.height = 6; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, 6, 6).data; let s = [0, 0, 0]; for (let k = 0; k < d.length; k += 4) { s[0] += d[k]; s[1] += d[k + 1]; s[2] += d[k + 2]; } return s.map(v => Math.round(v / 36)); }, shot.toString('base64')); };
  const near = (a, b2, tol = 40) => a.every((v, k) => Math.abs(v - b2[k]) <= tol);

  // ---- A + B
  { const { ctx, p } = await mk({ synthetic: true });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {});
    ok('globe starts', await p.locator('#mg-globe[data-ready="1"]').count() === 1);
    await p.waitForTimeout(1500);
    ok('status says how to use it', (await p.textContent('#mg-state')) === 'The Moon · drag to turn, or use the buttons');
    ok('opens on the near side, centre 0° 0°', /^Centre of view: 0° 0° · near side$/.test(await p.textContent('#mg-read')), await p.textContent('#mg-read'));
    ok('ambient light only (evenly lit)', JSON.stringify(await p.evaluate(() => MoonGlobe.lights())) === '["AmbientLight"]', await p.evaluate(() => MoonGlobe.lights()));
    for (const [name, lat, lng, rgb] of PATCH) { await p.evaluate(([la, ln]) => MoonGlobe.point(la, ln), [lat, lng]); await p.waitForTimeout(500);
      const c = await centre(p); ok(`map point ${lat},${lng} is at the centre when the view says so (${name})`, near(c, rgb), c); }
    // evenly lit: the same grey at the centre and well off-centre
    await p.evaluate(() => MoonGlobe.point(30, 40)); await p.waitForTimeout(500);
    const bb = await p.locator('#mg-globe').boundingBox(); const px = async (fx, fy) => { const s = await p.screenshot({ clip: { x: bb.x + bb.width * fx, y: bb.y + bb.height * fy, width: 2, height: 2 } }); return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = 2; c.height = 2; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3); }, s.toString('base64')); };
    const mid = await px(.5, .5), off = await px(.5, .3), off2 = await px(.3, .5);
    ok('same brightness at centre and toward the edge', Math.abs(mid[0] - off[0]) <= 6 && Math.abs(mid[0] - off2[0]) <= 6 && mid[0] > 40, { mid, off, off2 });
    ok('outside the sphere is background', near(await px(.03, .03), [5, 7, 11], 6));
    // controls
    await p.click('#mg-far'); await p.waitForTimeout(300);
    ok('Far side button', /^Centre of view: 0° 180°[EW] · far side$/.test(await p.textContent('#mg-read')), await p.textContent('#mg-read'));
    await p.click('#mg-near'); await p.waitForTimeout(300);
    ok('Near side button', /^Centre of view: 0° 0° · near side/.test(await p.textContent('#mg-read')));
    await p.click('#mg-east'); await p.click('#mg-east'); await p.click('#mg-north');
    ok('East and North buttons turn it 15° a press; east and north are labelled', (await p.textContent('#mg-read')) === 'Centre of view: 15°N 30°E · near side', await p.textContent('#mg-read'));
    for (let k = 0; k < 7; k++) await p.click('#mg-west');
    ok('West button; west is labelled', (await p.textContent('#mg-read')) === 'Centre of view: 15°N 75°W · near side', await p.textContent('#mg-read'));
    await p.click('#mg-west'); await p.click('#mg-west');
    ok('past 90° reads far side', (await p.textContent('#mg-read')) === 'Centre of view: 15°N 105°W · far side', await p.textContent('#mg-read'));
    await p.click('#mg-south'); await p.click('#mg-south');
    ok('South button; south is labelled', (await p.textContent('#mg-read')) === 'Centre of view: 15°S 105°W · far side', await p.textContent('#mg-read'));
    for (let k = 0; k < 8; k++) await p.click('#mg-south');
    ok('cannot be turned over the pole (stops at 85°)', (await p.textContent('#mg-read')) === 'Centre of view: 85°S 105°W · far side', await p.textContent('#mg-read'));
    await p.focus('#mg-near'); for (let k = 0; k < 5; k++) await p.keyboard.press('Tab');
    ok('all six buttons reachable by Tab, in order', await p.evaluate(() => document.activeElement.id) === 'mg-south');
    await p.keyboard.press('Enter');
    ok('buttons work from the keyboard', (await p.textContent('#mg-read')) === 'Centre of view: 85°S 105°W · far side');
    ok('never says "never faces Earth"', !/never faces/.test(await p.textContent('#moon-globe')));
    // drag
    await p.click('#mg-near'); await p.waitForTimeout(200); await p.locator('#mg-globe').scrollIntoViewIfNeeded(); { const b2 = await p.locator('#mg-globe').boundingBox(); bb.x = b2.x; bb.y = b2.y; }
    const before = await p.evaluate(() => MoonGlobe.view().lng); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
    ok('dragging turns the globe', Math.abs((await p.evaluate(() => MoonGlobe.view().lng)) - before) > 5);
    // page furniture
    const txt = await p.textContent('#moon-globe');
    ok('says it is not how the Moon is lit today', /not how the Moon is lit today/.test(txt));
    ok('says the map is tuned for looks, not measurement', /tuned for looks, not measurement/.test(txt));
    ok('says sizes are not comparable and the spacecraft is not on this globe', /Sizes are not comparable/.test(txt) && /spacecraft is not shown on this globe/.test(txt));
    ok('credit line present in sources', /NASA’s Scientific Visualization Studio/.test(await p.textContent('#craft-sources')));
    ok('spacecraft drawing still present', await p.locator('#craft-view').count() === 1);
    ok('no sideways overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('globe box is an image with a name; not an application, not a tab stop', await p.getAttribute('#mg-globe', 'role') === 'img' && await p.getAttribute('#mg-globe', 'aria-label') === 'Globe of the Moon' && await p.getAttribute('#mg-globe', 'tabindex') === null);
    ok('no blocking library tag in the page', await p.evaluate(() => ![...document.querySelectorAll('script[src*="unpkg"]')].some(x => !x.async)));
    await ctx.close(); }
  // ---- motion allowed (the default for most visitors): buttons are instant, nothing is lost, readout matches the view
  { const { ctx, p } = await mk({ synthetic: true, motion: true });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(800);
    ok('motion allowed: page really has motion allowed', await p.evaluate(() => !matchMedia('(prefers-reduced-motion:reduce)').matches));
    await p.evaluate(() => { document.getElementById('mg-far').click(); document.getElementById('mg-north').click(); });   // same task: as quick as a press can be
    const now = { read: await p.textContent('#mg-read'), v: await p.evaluate(() => MoonGlobe.view()) };
    ok('Far side then North at once: readout is 15°N on the far side immediately', /^Centre of view: 15°N 180°[EW] · far side$/.test(now.read), now);
    ok('…and the globe itself is there (lat 15, lon ±180)', Math.abs(now.v.lat - 15) < .01 && Math.abs(Math.abs(now.v.lng) - 180) < .01, now);
    await p.waitForTimeout(1200);
    const later = { read: await p.textContent('#mg-read'), v: await p.evaluate(() => MoonGlobe.view()) };
    ok('…and both still say so a second later (no glide finishing elsewhere)', /^Centre of view: 15°N 180°[EW] · far side$/.test(later.read) && Math.abs(later.v.lat - 15) < .01 && Math.abs(Math.abs(later.v.lng) - 180) < .01, later);
    await p.click('#mg-far'); await p.click('#mg-north'); await p.click('#mg-near'); await p.click('#mg-east'); await p.waitForTimeout(900);
    ok('real clicks in quick succession: Far, North, Near, East ends at 0° 15°E', (await p.textContent('#mg-read')) === 'Centre of view: 0° 15°E · near side' && Math.abs((await p.evaluate(() => MoonGlobe.view())).lng - 15) < .01, await p.textContent('#mg-read'));
    await ctx.close(); }
  // ---- zoom stays inside the box
  { const { ctx, p } = await mk({ synthetic: true });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(800);
    const A = () => p.evaluate(() => MoonGlobe.view().altitude), box = () => p.locator('#mg-globe').boundingBox();
    const corner = async () => { const sh = await p.locator('#mg-globe').screenshot(); return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return [...g.getImageData(Math.round(c.width * .04), Math.round(c.height * .04), 1, 1).data].slice(0, 3); }, sh.toString('base64')); };
    const b0 = await box(), a0 = await A();
    ok('opens with the whole Moon in the box (altitude 2.2; corner is background)', Math.abs(a0 - 2.2) < .01 && near(await corner(), [5, 7, 11], 6), { a0 });
    await p.click('#mg-zin'); const a1 = await A();
    ok('Zoom in moves the camera closer', Math.abs(a1 - 1.65) < .01, { a1 });
    await p.click('#mg-east'); await p.click('#mg-far');
    ok('turning and Near/Far keep the zoom', Math.abs((await A()) - 1.65) < .01, { a: await A() });
    for (let k = 0; k < 8; k++) await p.click('#mg-zin'); await p.waitForTimeout(500);
    const b1 = await box();
    ok('closest look stops at altitude 0.5', Math.abs((await A()) - .5) < .01, { a: await A() });
    ok('the box did not change size or place; the Moon grew inside it (corner now shows the Moon)', Math.abs(b1.width - b0.width) < .5 && Math.abs(b1.height - b0.height) < .5 && Math.abs(b1.x - b0.x) < .5 && !near(await corner(), [5, 7, 11], 6), { b0, b1, c: await corner() });
    ok('no sideways overflow when zoomed in', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (let k = 0; k < 9; k++) await p.click('#mg-zout');
    ok('Zoom out stops at the whole Moon (2.2)', Math.abs((await A()) - 2.2) < .01, { a: await A() });
    // wheel: pinch on a trackpad arrives as ctrl+wheel and zooms the globe; a plain wheel scrolls the page
    await p.locator('#mg-globe').scrollIntoViewIfNeeded(); const bb = await box(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 240); await p.waitForTimeout(400);
    ok('plain wheel over the globe scrolls the page and leaves the zoom alone', (await p.evaluate(() => scrollY)) > y0 && Math.abs((await A()) - 2.2) < .01, { y0, y1: await p.evaluate(() => scrollY), a: await A() });
    await p.evaluate(() => scrollTo(0, 0)); await p.locator('#mg-globe').scrollIntoViewIfNeeded(); const bb2 = await box(); await p.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
    const y2 = await p.evaluate(() => scrollY); await p.keyboard.down('Control'); await p.mouse.wheel(0, -300); await p.keyboard.up('Control'); await p.waitForTimeout(600);
    const a2 = await A();
    ok('ctrl+wheel (trackpad pinch) over the globe zooms the Moon inside the box, page does not scroll', a2 < 2.15 && a2 >= .5 - .01 && (await p.evaluate(() => scrollY)) === y2, { a2, y2, y3: await p.evaluate(() => scrollY) });
    ok('page says how to zoom and why it blurs', /Pinch, or use Zoom in and Zoom out/.test(await p.textContent('#moon-globe')) && /about 5 km to a pixel/.test(await p.textContent('#moon-globe')));
    await ctx.close(); }
  // phone width
  { const { ctx, p } = await mk({ synthetic: true, w: 390 }); await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {});
    const bb = await p.locator('#mg-globe').boundingBox();
    ok('phone: globe square within the window', bb && bb.width <= 390 && Math.abs(bb.width - bb.height) < 2, bb);
    ok('phone: no sideways overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('phone: buttons at least 40 px tall', (await p.locator('#mg-near').boundingBox()).height >= 40 && (await p.locator('#mg-south').boundingBox()).height >= 40);
    ok('phone: a strip beside the globe is left for scrolling the page (≥ 30 px each side)', bb.x >= 30 && 390 - (bb.x + bb.width) >= 30, bb);
    await ctx.close(); }
  // ---- C
  { const { ctx, p } = await mk({ noLib: true }); await p.waitForTimeout(1500);
    ok('no library: says unavailable, and why', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /did not load/.test(await p.textContent('#mg-why')));
    ok('no library: globe box and buttons hidden', !(await p.isVisible('#mg-globe')) && !(await p.isVisible('#mg-ctl')));
    ok('no library: spacecraft section still on the page', await p.isVisible('#craft-view'));
    await ctx.close(); }
  // library stalls: the spacecraft drawing must not wait for it, and the globe must give up within its limit
  { const t0 = Date.now(); const { ctx, p } = await mk({ stall: 40000 });
    await p.waitForFunction(() => { const st = document.getElementById('craft-state'); return st && st.textContent !== 'loading…'; }, null, { timeout: 8000 }).catch(() => {});
    const early = await p.evaluate(() => ({ craft: document.getElementById('craft-state').textContent, svgKids: document.getElementById('craft-svg').childElementCount, stageShown: !document.getElementById('craft-stage').hidden || !document.getElementById('craft-unavail').hidden, mg: document.getElementById('mg-state').textContent }));
    ok('library pending: spacecraft section has finished loading', early.craft !== 'loading…' && early.stageShown, early);
    ok('library pending: globe still says loading (not yet at its limit)', early.mg === 'loading…' && Date.now() - t0 < 11000, { early, ms: Date.now() - t0 });
    await p.waitForFunction(() => document.getElementById('mg-state').textContent !== 'loading…', null, { timeout: 16000 }).catch(() => {});
    const ms = Date.now() - t0;
    ok('library pending: globe gives up at about 12 s and says why', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /did not arrive within 12 seconds/.test(await p.textContent('#mg-why')) && ms >= 11500 && ms < 16000, { ms, why: await p.textContent('#mg-why') });
    ok('library pending: globe box and buttons hidden after giving up', !(await p.isVisible('#mg-globe')) && !(await p.isVisible('#mg-ctl')));
    await ctx.close(); }
  // library arrives after the limit: the failure state stands (no half-started globe)
  { const { ctx, p } = await mk({ stall: 14000 }); await p.waitForTimeout(17000);
    ok('late library: failure state stands', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && !(await p.isVisible('#mg-globe')) && await p.locator('#mg-globe canvas').count() === 0, await p.textContent('#mg-state'));
    await ctx.close(); }
  { const { ctx, p } = await mk({ noTex: true }); await p.waitForTimeout(1500);
    ok('no map: says unavailable', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /map did not load/.test(await p.textContent('#mg-why')));
    await ctx.close(); }
  // ---- D: the real file
  if (!fs.existsSync(TEX)) ok('real map file present (assets/moon/lroc_color_2k.jpg)', false);
  else { const buf = fs.readFileSync(TEX);
    ok('real map: pinned sha256 and size', crypto.createHash('sha256').update(buf).digest('hex') === PIN.sha256 && buf.length === PIN.bytes, { bytes: buf.length });
    const ctx = await b.newContext(); const p = await ctx.newPage(); await p.goto(BASE + '/sources.html').catch(() => {});
    ok('Sources page has the Moon globe section with source, caveat and credit', await p.evaluate(() => { const h = document.getElementById('moonglobe'); if (!h) return false; let t = '', n = h.nextElementSibling; while (n && n.tagName !== 'H2') { t += n.textContent + ' '; n = n.nextElementSibling; } return /CGI Moon Kit/.test(t) && /tuned for appearance rather than science/.test(t) && /served unchanged from this site/.test(t) && /Credit\. NASA's Scientific Visualization Studio/.test(t) && /not how the Moon is lit today/.test(t); }));
    const r = await p.evaluate(async ({ b64, BREAK }) => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
      const lum = (lat, lng, rad = 1.2) => { let x = (lng + 180) / 360 * c.width, y = (90 - lat) / 180 * c.height; if (BREAK === 'mirror') x = c.width - x; if (BREAK === 'flip') y = c.height - y; const n = Math.max(2, Math.round(rad / 360 * c.width)); const d = g.getImageData(Math.round(x - n), Math.round(y - n), 2 * n, 2 * n).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += .2126 * d[k] + .7152 * d[k + 1] + .0722 * d[k + 2]; return s / (d.length / 4); };
      return { w: c.width, h: c.height, tsio: lum(-20.38, 128.97, .8), tsioM: lum(-20.38, -128.97, .8), ori: lum(-19.87, -94.67), oriM: lum(-19.87, 94.67), cri: lum(16.18, 59.10, 2), criE: lum(16.18, 100, 2), imb: lum(34.72, -14.91, 3), imbS: lum(-34.72, -14.91, 3), mos: lum(27.28, 148.12, 1.5), mosM: lum(27.28, -148.12, 1.5), tycho: lum(-43.30, -11.22, .6), nub: lum(-20.59, -17.29, 2) }; }, { b64: buf.toString('base64'), BREAK });
    ok('real map: 2048 × 1024', r.w === PIN.w && r.h === PIN.h, r);
    // Centre coordinates: USGS/IAU Gazetteer of Planetary Nomenclature (planetarynames.wr.usgs.gov), planetographic, +East, ±180;
    // read 13 Nov 2026: features 6108, 3685, 3682, 3671, 3678, 6163 and Mare Nubium. Sampling radius in degrees is ours.
    ok('Tsiolkovskiy (20.38°S 128.97°E): dark floor, bright at the mirrored longitude', r.tsio < r.tsioM - 15, r);
    ok('Mare Orientale (19.87°S 94.67°W): dark, bright at the mirrored longitude', r.ori < r.oriM - 15, r);
    ok('Mare Moscoviense (27.28°N 148.12°E): dark, bright at the mirrored longitude', r.mos < r.mosM - 15, r);
    ok('Mare Crisium (16.18°N 59.10°E): darker than the highlands at 100°E', r.cri < r.criE - 15, r);
    ok('Mare Imbrium (34.72°N 14.91°W): dark in the north, bright at the same longitude in the south', r.imb < r.imbS - 15, r);
    ok('Tycho (43.30°S 11.22°W): brighter than Mare Nubium (20.59°S 17.29°W)', r.tycho > r.nub + 15, r);
    console.log('landmarks', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v)]))));
    await ctx.close(); }
  await b.close();
  console.log(`moon-globe: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
