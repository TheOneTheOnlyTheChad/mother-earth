/* Moon globe (moon.html, moonglobe.js) — real globe.gl 2.45.0 under SwiftShader.
 *  A. the globe shows the map point it says it shows (synthetic map with coloured patches at known places)
 *  B. evenly lit, opens on the near side, readout and controls
 *  C. failure states leave the page usable
 *  D. the REAL map file: pinned bytes, and named landmarks where their published coordinates say
 *     (settles east/west and north/south, which the source page does not state)
 * Run: node phase1/moon-globe.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=lit|far|sign|mirror|flip must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const crypto = require('crypto'); const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const TEX = path.join(ROOT, 'assets/moon/lroc_color_2k.jpg');
const PIN = { sha256: '@@SHA@@', bytes: 457942, w: 2048, h: 1024 };
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
// synthetic map: patches at known selenographic places (lat, east longitude)
const PATCH = [['red', 0, 0, [255, 0, 0]], ['green', 0, 90, [0, 255, 0]], ['blue', 45, -90, [0, 0, 255]], ['white', -20.4, 129.1, [255, 255, 255]], ['yellow', -60, -30, [255, 255, 0]]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: opt.w || 1000, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => opt.noLib ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonglobe.js*', async r => { let s = fs.readFileSync(path.join(ROOT, 'moonglobe.js'), 'utf8');
      if (BREAK === 'lit') s = s.replace('globe.lights(amb);', '');
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
    await p.goto(BASE + '/moon.html'); return { ctx, p };
  };
  const centre = async p => { const el = p.locator('#mg-globe'); const bb = await el.boundingBox(); const shot = await p.screenshot({ clip: { x: bb.x + bb.width / 2 - 3, y: bb.y + bb.height / 2 - 3, width: 6, height: 6 } });
    return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = 6; c.height = 6; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, 6, 6).data; let s = [0, 0, 0]; for (let k = 0; k < d.length; k += 4) { s[0] += d[k]; s[1] += d[k + 1]; s[2] += d[k + 2]; } return s.map(v => Math.round(v / 36)); }, shot.toString('base64')); };
  const near = (a, b2, tol = 40) => a.every((v, k) => Math.abs(v - b2[k]) <= tol);

  // ---- A + B
  { const { ctx, p } = await mk({ synthetic: true });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {});
    ok('globe starts', await p.locator('#mg-globe[data-ready="1"]').count() === 1);
    await p.waitForTimeout(1500);
    ok('status says how to use it', (await p.textContent('#mg-state')) === 'The Moon · drag to turn');
    ok('opens on the near side, centre 0° 0°', /^Centre of view: 0° 0° · near side \(faces Earth\)$/.test(await p.textContent('#mg-read')), await p.textContent('#mg-read'));
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
    ok('Far side button', /^Centre of view: 0° 180°[EW] · far side \(never faces Earth\)$/.test(await p.textContent('#mg-read')), await p.textContent('#mg-read'));
    await p.click('#mg-near'); await p.waitForTimeout(300);
    ok('Near side button', /^Centre of view: 0° 0° · near side/.test(await p.textContent('#mg-read')));
    await p.focus('#mg-globe'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp');
    ok('arrow keys turn it; east and north are labelled', (await p.textContent('#mg-read')) === 'Centre of view: 10°N 20°E · near side (faces Earth)', await p.textContent('#mg-read'));
    for (let k = 0; k < 9; k++) await p.keyboard.press('ArrowLeft');
    ok('west is labelled, far side past 90°', (await p.textContent('#mg-read')) === 'Centre of view: 10°N 70°W · near side (faces Earth)', await p.textContent('#mg-read'));
    for (let k = 0; k < 3; k++) await p.keyboard.press('ArrowLeft');
    ok('past 90° reads far side', (await p.textContent('#mg-read')) === 'Centre of view: 10°N 100°W · far side (never faces Earth)', await p.textContent('#mg-read'));
    // drag
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
    ok('globe is focusable and named', await p.getAttribute('#mg-globe', 'tabindex') === '0' && /arrow keys/.test(await p.getAttribute('#mg-globe', 'aria-label')));
    await ctx.close(); }
  // phone width
  { const { ctx, p } = await mk({ synthetic: true, w: 390 }); await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 20000 }).catch(() => {});
    const bb = await p.locator('#mg-globe').boundingBox();
    ok('phone: globe square within the window', bb && bb.width <= 390 && Math.abs(bb.width - bb.height) < 2, bb);
    ok('phone: no sideways overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('phone: buttons at least 40 px tall', (await p.locator('#mg-near').boundingBox()).height >= 40);
    await ctx.close(); }
  // ---- C
  { const { ctx, p } = await mk({ noLib: true }); await p.waitForTimeout(1500);
    ok('no library: says unavailable, and why', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /did not load/.test(await p.textContent('#mg-why')));
    ok('no library: globe box and buttons hidden', !(await p.isVisible('#mg-globe')) && !(await p.isVisible('#mg-ctl')));
    ok('no library: spacecraft section still on the page', await p.isVisible('#craft-view'));
    await ctx.close(); }
  { const { ctx, p } = await mk({ noTex: true }); await p.waitForTimeout(1500);
    ok('no map: says unavailable', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /map did not load/.test(await p.textContent('#mg-why')));
    await ctx.close(); }
  // ---- D: the real file
  if (!fs.existsSync(TEX)) ok('real map file present (assets/moon/lroc_color_2k.jpg)', false);
  else { const buf = fs.readFileSync(TEX);
    ok('real map: pinned sha256 and size', crypto.createHash('sha256').update(buf).digest('hex') === PIN.sha256 && buf.length === PIN.bytes, { bytes: buf.length });
    const ctx = await b.newContext(); const p = await ctx.newPage(); await p.goto(BASE + '/sources.html').catch(() => {});
    const r = await p.evaluate(async ({ b64, BREAK }) => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
      const lum = (lat, lng, rad = 1.2) => { let x = (lng + 180) / 360 * c.width, y = (90 - lat) / 180 * c.height; if (BREAK === 'mirror') x = c.width - x; if (BREAK === 'flip') y = c.height - y; const n = Math.max(2, Math.round(rad / 360 * c.width)); const d = g.getImageData(Math.round(x - n), Math.round(y - n), 2 * n, 2 * n).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += .2126 * d[k] + .7152 * d[k + 1] + .0722 * d[k + 2]; return s / (d.length / 4); };
      return { w: c.width, h: c.height, tsio: lum(-20.4, 129.1, .8), tsioM: lum(-20.4, -129.1, .8), ori: lum(-19.4, -92.8), oriM: lum(-19.4, 92.8), cri: lum(17.0, 59.1, 2), criE: lum(17.0, 100, 2), imb: lum(32.8, -15.6, 3), imbS: lum(-32.8, -15.6, 3), mos: lum(27.3, 147.9, 1.5), mosM: lum(27.3, -147.9, 1.5), tycho: lum(-43.3, -11.4, .6), nub: lum(-21.3, -16.6, 2) }; }, { b64: buf.toString('base64'), BREAK });
    ok('real map: 2048 × 1024', r.w === PIN.w && r.h === PIN.h, r);
    // published coordinates: IAU Gazetteer of Planetary Nomenclature (feature centres)
    ok('Tsiolkovskiy (20.4°S 129.1°E): dark floor, bright at the mirrored longitude', r.tsio < r.tsioM - 15, r);
    ok('Mare Orientale (19.4°S 92.8°W): dark, bright at the mirrored longitude', r.ori < r.oriM - 15, r);
    ok('Mare Moscoviense (27.3°N 147.9°E): dark, bright at the mirrored longitude', r.mos < r.mosM - 15, r);
    ok('Mare Crisium (17.0°N 59.1°E): darker than the highlands to its east', r.cri < r.criE - 15, r);
    ok('Mare Imbrium (32.8°N 15.6°W): dark in the north, bright at the same longitude in the south', r.imb < r.imbS - 15, r);
    ok('Tycho (43.3°S 11.4°W): brighter than Mare Nubium to its north', r.tycho > r.nub + 15, r);
    await ctx.close(); }
  await b.close();
  console.log(`moon-globe: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
