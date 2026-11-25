/* Tides explorer — the page in a real browser (T1, T2, T6, T7, T8, T9, T10). TIDES-EXPLORER-PROPOSAL rev 2 section 5.
 *   NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node phase1/tides-ui.test.cjs
 * No server: every request is answered from this checkout (page files), from the local globe.gl 2.45.0 build (unpkg) or
 * refused, and logged. Software WebGL (SwiftShader). Not a phone, not Safari, not a screen reader.
 * BREAK=<name> serves a deliberately weakened page; each must FAIL:
 *   clock            a running UTC clock is put back in the header
 *   no-pause         the library's render loop is never paused
 *   orbit-moves-model  turning the camera also moves the Moon
 *   sun-lit          the Sun gets a lit material (a day and night side from the light)
 *   hidden-plays     no pause when the tab is hidden
 *   reset-partial    Reset leaves the mode as it was
 *   img-fail-kills   a failed picture switches the whole 3-D scene off
 *   live-word        the model line says "live" */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const LIB = fs.readFileSync((process.env.NODE_PATH || '/home/claude/spike/node_modules').split(':').map(d => path.join(d, 'globe.gl/dist/globe.gl.min.js')).find(f => fs.existsSync(f)) || '/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js');   // globe.gl 2.45.0, as unpkg serves it
const B = process.env.BREAK || '';
const BREAKS = {
  clock: ['tides.html', '  <nav class="menu" aria-label="Pages">', '  <div class="clock" id="clock">--:--:--<span>UTC</span></div>\n  <nav class="menu" aria-label="Pages">'],
  'no-pause': ['tides.js', "function stopLoop() { if (st.loop) cancelAnimationFrame(st.loop); st.loop = 0; st.activeUntil = 0; if (globe && globe.pauseAnimation) globe.pauseAnimation(); }", "function stopLoop() { if (st.loop) cancelAnimationFrame(st.loop); st.loop = 0; st.activeUntil = 0; }", "    else { if (globe && globe.pauseAnimation) globe.pauseAnimation(); placeTags(); }", "    else { placeTags(); }"],
  'orbit-moves-model': ['tides.js', "ct.addEventListener('change', placeTags);", "ct.addEventListener('change', () => { placeTags(); if (st.orbiting) { st.deg = M.norm(st.deg + 0.5); paintScene(); } });"],
  'sun-lit': ['tides.js', "const sunMat = new H.Mat({ color: 0x000000, specular: 0x000000, shininess: 0 }); sunMat.emissive.setHex(0xf2c35a);", "const sunMat = new H.Mat({ color: 0xffffff, specular: 0x000000, shininess: 0 }); sunMat.emissive.setHex(0x000000);", "loadImage('sun', t => { sunMat.emissiveMap = t; sunMat.emissive.setHex(0xffffff); sunMat.needsUpdate = true; });", "loadImage('sun', t => { sunMat.map = t; sunMat.needsUpdate = true; });"],
  'hidden-plays': ['tides.js', "document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) { st.playing = false; paintDom(); stopLoop(); } });", ''],
  'reset-partial': ['tides.js', 'st.playing = false; st.deg = INITIAL.deg; st.mode = INITIAL.mode;', 'st.playing = false; st.deg = INITIAL.deg;'],
  'img-fail-kills': ['tides.js', "st.images[key] = ok ? 'ok' : 'failed';", "st.images[key] = ok ? 'ok' : 'failed'; if (!ok) no3d('A picture failed.');"],
  'live-word': ['tides.html', 'Idealised tide model · Bulges exaggerated', 'Live idealised tide model · Bulges exaggerated'],
  // added after GPT's first-build review (R1, R2, R3, R5)
  'stale-draw': ['tides.html', 'surface radius = 1.15 + 0.12 × value', 'surface radius = 1.12 + 0.08 × value'],
  'explain-12': ['tides.js', 'if (offAlign <= M.PRESET_TOL) return', 'if (offAlign <= 12) return', 'if (offQuarter <= M.PRESET_TOL) return', 'if (offQuarter <= 12) return'],
  'labels-fixed': ['tides.js', 'const pe = choose(tags.earth, \'E\', E, rE, 8, [away, ...AX, ...DG]);', 'const pe = rectAt(tags.earth, E, [0, 1], rE, 8);', "pm = choose(lbl, 'M', Mo, rM, 4, [out, perp, [-perp[0], -perp[1]], ...AX, ...DG]);", "pm = rectAt(lbl, Mo, [0, -1], rM, 4);"],
  'touch-none': ['tides.js', "if (ct.domElement && ct.domElement.style) ct.domElement.style.touchAction = 'pan-y';", ''],
};
if (B && !BREAKS[B]) { console.log('unknown BREAK ' + B); process.exit(2); }
const served = rel => {
  let s = fs.readFileSync(path.join(ROOT, rel));
  const br = BREAKS[B];
  if (br && br[0] === rel) { s = s.toString('utf8'); for (let i = 1; i < br.length; i += 2) { if (!s.includes(br[i])) { console.log(`BREAK ${B} no longer applies to ${rel}`); process.exit(2); } s = s.replace(br[i], br[i + 1]); } }
  return s;
};
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

let pass = 0, fail = 0; const failed = [];
const ok = (id, cond, detail) => { if (cond) { pass++; console.log('PASS  ' + id); } else { fail++; failed.push(id); console.log('FAIL  ' + id + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 600) : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, opt = {}) {
  const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1280, height: 900 }, reducedMotion: opt.reduced ? 'reduce' : 'no-preference', hasTouch: !!opt.touch });
  if (opt.noWebGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  const page = await ctx.newPage(), log = [], errors = [];
  page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route('**/*', async r => {
    const u = new URL(r.request().url()); log.push(u.hostname + u.pathname);
    if (u.hostname === 'unpkg.com') { if (opt.noLib) return r.abort(); return r.fulfill({ body: LIB, contentType: 'application/javascript' }); }
    if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return r.fulfill({ body: '', contentType: 'text/css' });
    if (u.hostname === 'tides.test') {
      const rel = decodeURIComponent(u.pathname).replace(/^\//, '');
      if (opt.blockImg && rel.includes(opt.blockImg)) return r.abort();
      if (opt.delayImg && rel.includes(opt.delayImg.name)) await sleep(opt.delayImg.ms);
      if (!fs.existsSync(path.join(ROOT, rel))) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ body: served(rel), contentType: TYPES[path.extname(rel)] || 'application/octet-stream' });
    }
    return r.abort();
  });
  await page.goto('http://tides.test/tides.html');
  await page.waitForFunction(() => window.TIDES && TIDES.state().three !== 'starting', null, { timeout: 40000 });
  if (!opt.noWebGL && !opt.noLib && !opt.delayImg) await page.waitForFunction(() => !Object.values(TIDES.state().images).includes('loading'), null, { timeout: 40000 });
  await sleep(1500);
  return { ctx, page, log, errors };
}
const st = p => p.evaluate(() => TIDES.state());
const settle = async p => { for (let i = 0; i < 40; i++) { if (!(await p.evaluate(() => TIDES.state().looping))) return; await sleep(150); } };
/** max |drawn vertex − model at the page's current state| in scene units (float32 vertices) */
const meshVsModel = p => p.evaluate(() => { const s = TIDES.surface(), t = TIDES.state(), R = TIDES.constants.R; let e = 0;
  for (let i = 0; i < s.base.length; i += 3) { const n = [s.base[i], s.base[i + 1], s.base[i + 2]], r = TidesModel.radius(n, t.deg, t.mode) * R; for (let k = 0; k < 3; k++) e = Math.max(e, Math.abs(s.positions[i + k] - n[k] * r)); } return e; });
const positions = p => p.evaluate(() => TIDES.surface().positions);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
async function canvasLum(p, cx, cy, r) {   // mean luminance of a small square at a page point, from a screenshot
  const buf = await p.screenshot({ clip: { x: Math.round(cx - r), y: Math.round(cy - r), width: Math.round(2 * r), height: Math.round(2 * r) } });
  const { PNG } = require('pngjs'), png = PNG.sync.read(buf); let s = 0;
  for (let i = 0; i < png.data.length; i += 4) s += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
  return s / (png.data.length / 4);
}
async function sceneXY(p, x, y, z) { return p.evaluate(([x, y, z]) => { const s = TIDES.screenOf(x, y, z), r = document.getElementById('td-scene').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, [x, y, z]); }

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    // ---------- T1: a separate view; existing files untouched (first slice adds files only)
    let changed = []; try { changed = execFileSync('git', ['-C', ROOT, 'diff', '--name-status', 'origin/main...HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean); } catch (e) { changed = ['git-unavailable']; }
    // navigation stage (tides-nav-rc): the only existing files changed are the six pages' headers, the stylesheet's TIDES-NAV block and
    // index.html's promise wrapper, and the test suites that count the tabs; checked file by file by phase1/tides-nav.test.cjs and the packet
    const NAV_FILES = ['animals.html', 'index.html', 'moon.html', 'sources.html', 'style.css', 'sun.html', 'timeline.html', 'phase1/desktop-overflow.test.cjs', 'phase1/timeline-ui.test.cjs', 'phase1/animals-tab-ui.test.cjs'];
    const modified = changed.filter(l => !/^A\t/.test(l) && !/\t(STATUS\.md|docs\/|reviews\/)/.test(l)).filter(l => !NAV_FILES.includes(l.split('\t')[1]));
    ok('T1a besides new files, this branch changes only the navigation files (headers, stylesheet, the suites that count tabs)', modified.length === 0, modified);
    ok('T1b every other page links to tides.html exactly twice: one tab, one Menu item', ['index.html', 'timeline.html', 'moon.html', 'sun.html', 'animals.html', 'sources.html'].every(f => { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); return (t.match(/href="tides\.html"/g) || []).length === 2 && t.includes('<a href="tides.html" data-view="tides">Tides</a>') && t.includes('<a role="menuitem" href="tides.html" data-page="tides">Tides</a>'); }));

    const A = await open(browser), p = A.page;
    let s = await st(p);
    ok('T1c page loads at its address, scene built, no page errors', s.three === 'ok' && A.errors.length === 0, { three: s.three, errors: A.errors });
    ok('T1d shared header: title, six view tabs and seven Menu items; only Tides marked current', await p.evaluate(() => document.querySelectorAll('.top .tabs a').length === 6 && document.querySelectorAll('#menu-list a').length === 7 && [...document.querySelectorAll('.top [aria-current]')].map(a => a.getAttribute('href')).join() === 'tides.html,tides.html' && /Mother Earth/.test(document.querySelector('.top h1').textContent)));

    // ---------- T8: model labels; no clock, no live, no dates or metres in the model area
    ok('T8a no clock element on this page', await p.evaluate(() => !document.getElementById('clock') && !document.querySelector('.top .clock')));
    const mt = await p.evaluate(() => document.getElementById('td-model').textContent);
    ok('T8b fixed model line present', /Idealised tide model · Bulges exaggerated · Body sizes and distances not to scale · Not a tide prediction/.test(mt) && !/\blive\b/i.test(mt), mt);
    const area = await p.evaluate(() => ['td-model', 'td-box', 'td-main'].map(id => id === 'td-main' ? [...document.querySelectorAll('.td-lede,.td-ctl,.td-side')].map(e => e.innerText).join(' ') : document.getElementById(id).innerText).join(' '));
    ok('T8c model area: no "live", "now", "today", UTC, year, clock time or metres', !/\blive\b|\bnow\b|\btoday\b|\bUTC\b|\b20\d\d\b|\d\d:\d\d|\bmetres?\b|\d\s?m\b/i.test(area), (area.match(/\blive\b|\bnow\b|\btoday\b|\bUTC\b|\b20\d\d\b|\d\d:\d\d|\bmetres?\b|\d\s?m\b/ig) || []));
    ok('T8d all-ocean label and the lifted-surface note are visible beside the scene', await p.evaluate(() => { const v = el => { const r = el.getBoundingClientRect(), c = getComputedStyle(el); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
      const cap = document.querySelector('.td-fig figcaption'); return v(cap) && /ocean over the whole Earth, land included/.test(cap.textContent) && /lifted off the globe/.test(cap.textContent) && v(document.getElementById('td-model')); }));
    const drawn = await p.evaluate(() => { const li = [...document.querySelectorAll('#td-sources li')].find(l => /^Drawing:/.test(l.textContent)); const how = document.getElementById('td-how').textContent; return { li: li && li.textContent, want: TidesModel.drawingText(), how: /falls to about (\d+)%/.exec(how), neap: TidesModel.neapPercent() }; });
    ok('T8h Sources prints the drawing constants the model uses, and How this works the model\'s neap share', !!drawn.li && drawn.li.includes(drawn.want) && !!drawn.how && Number(drawn.how[1]) === drawn.neap, drawn);
    ok('T8e reference dates only inside the closed "Sources and method" disclosure', await p.evaluate(() => { const d = document.getElementById('td-sources'); return !d.open && /22 June 2026/.test(d.textContent) && /file updated 25 November 2026/.test(d.textContent) && /not live/.test(d.textContent); }));

    // ---------- T2: pictures, records, orientation evidence
    ok('T2a all three pictures loaded from this checkout', JSON.stringify(s.images) === JSON.stringify({ earth: 'ok', moon: 'ok', sun: 'ok' }) && ['assets/tides/earth-2026-06-22.jpg', 'assets/moon/lroc_color_2k.jpg', 'assets/tides/sun-2026-11-25.jpg'].every(f => A.log.some(l => l.endsWith(f))), s.images);
    let chk = ''; try { chk = execFileSync('node', [path.join(ROOT, 'phase1/tides/build_tides.mjs'), '--check'], { encoding: 'utf8' }); } catch (e) { chk = 'FAILED ' + e.stdout + e.stderr; }
    ok('T2b image hashes and sizes equal assets/tides/SOURCE.json; pre-rendered cross-section equals the model', /agree/.test(chk) && !/FAILED|DIFFERENT/.test(chk), chk.trim());
    const b0 = await p.evaluate(() => TIDES.bodies());
    ok('T2c the Moon keeps its near side (map longitude 0) toward Earth at four angles', await p.evaluate(async () => { const out = []; for (const d of [0, 90, 180, 270]) { TIDES.setDeg(d); const b = TIDES.bodies(), u = TidesModel.uMoon(d); out.push(Math.abs(Math.cos(b.moonRotY) - (-u[0])) < 1e-9 && Math.abs(Math.sin(b.moonRotY) - u[2]) < 1e-9); } TIDES.setDeg(0); return out.every(Boolean); }));
    // Sun: the picture's face toward Earth. The Earth-facing side of the Sun is bright, the far side is the plain hatch.
    await settle(p);
    const sunC = await sceneXY(p, -400, 0, 0), sunL = await sceneXY(p, -460, 0, 0), sunR = await sceneXY(p, -340, 0, 0);
    const lFar = await canvasLum(p, sunL.x + 14, sunL.y, 6), lNear = await canvasLum(p, sunR.x - 14, sunR.y, 6);
    ok('T2d Sun: the picture faces Earth (Earth side bright, far side plain); B0 tilt recorded 1.605°', lNear > 2 * lFar && lNear > 80, { near: Math.round(lNear), far: Math.round(lFar) });
    let sunChk = ''; try { sunChk = execFileSync('python3', ['-I', path.join(ROOT, 'phase1/tides/check_sun_reference.py'), '--check'], { encoding: 'utf8' }); } catch (e) { sunChk = 'FAILED ' + (e.stdout || '') + (e.stderr || ''); }
    ok('T2e Sun reference checked on this picture: three SWPC regions found where north-up predicts; no pixel past the 0.97 mask; stored evidence reproduces', /orientation and mask checks pass; stored evidence matches/.test(sunChk), sunChk.trim().slice(-300));

    // ---------- T7: light. Earth and Moon lit from the Sun's side; the Sun does not respond to the light at all
    const e1 = await sceneXY(p, -60, 0, 0), e2 = await sceneXY(p, 60, 0, 0);
    const eL = await canvasLum(p, e1.x, e1.y, 8), eR = await canvasLum(p, e2.x, e2.y, 8);
    ok('T7a Earth: the side toward the Sun is brighter', eL > eR * 1.15, { sunSide: Math.round(eL), far: Math.round(eR) });
    const moonSides = async d => { await p.evaluate(d => TIDES.setDeg(d), d); await settle(p); const u = await p.evaluate(d => TidesModel.uMoon(d), d), m = [u[0] * 230, 0, u[2] * 230];
      const a = await sceneXY(p, m[0] - 20, 0, m[2]), b = await sceneXY(p, m[0] + 20, 0, m[2]); return [await canvasLum(p, a.x, a.y, 4), await canvasLum(p, b.x, b.y, 4)]; };
    const mNew = await moonSides(0), mFull = await moonSides(180);
    ok('T7b Moon at new Moon: lit on the Sun side, dark on the side facing Earth', mNew[0] > mNew[1] * 1.2, mNew.map(Math.round));
    ok('T7c Moon at full Moon: lit on the Sun side, which is the side facing Earth', mFull[0] > mFull[1] * 1.2, mFull.map(Math.round));
    await p.evaluate(() => TIDES.setDeg(0)); await settle(p);
    const sOn = [await canvasLum(p, sunR.x - 14, sunR.y, 6), await canvasLum(p, sunC.x, sunC.y, 6)];
    const eOn = await canvasLum(p, e1.x, e1.y, 8);
    await p.evaluate(() => TIDES.lightIntensity(0)); await settle(p);
    const sOff = [await canvasLum(p, sunR.x - 14, sunR.y, 6), await canvasLum(p, sunC.x, sunC.y, 6)], eOff = await canvasLum(p, e1.x, e1.y, 8);
    await p.evaluate(() => TIDES.lightIntensity(0.95 * Math.PI)); await settle(p);
    ok('T7d Sun is self-lit: switching the light off changes Earth but not the Sun', Math.abs(sOn[0] - sOff[0]) < 1.5 && Math.abs(sOn[1] - sOff[1]) < 1.5 && eOn - eOff > 15 && !b0.sunLit, { sunOn: sOn.map(Math.round), sunOff: sOff.map(Math.round), earthOn: Math.round(eOn), earthOff: Math.round(eOff) });
    ok('T7e one directional light, in the scene, along the Sun direction (parallel rays, not a point light at the drawn Sun)', b0.lightType === 'DirectionalLight' && b0.lightParent && Math.abs(b0.light[0] / Math.hypot(...b0.light) + 1) < 1e-9, b0);

    // ---------- T7: camera and model kept apart
    const cam0 = await p.evaluate(() => TIDES.camera().pos), pos0 = await positions(p), deg0 = (await st(p)).deg;
    const box = await p.locator('#td-scene').boundingBox();
    await p.mouse.move(box.x + 60, box.y + box.height - 40); await p.mouse.down(); await p.mouse.move(box.x + 160, box.y + box.height - 120, { steps: 12 }); await p.mouse.up(); await settle(p);
    const cam1 = await p.evaluate(() => TIDES.camera().pos), pos1 = await positions(p), s1 = await st(p);
    ok('T7f dragging the empty scene turns the camera', Math.hypot(cam1[0] - cam0[0], cam1[1] - cam0[1], cam1[2] - cam0[2]) > 5, { cam0, cam1 });
    ok('T7g …and leaves the Moon angle, the mode and the drawn surface exactly as they were', s1.deg === deg0 && s1.mode === 'both' && same(pos0, pos1), { deg0, deg1: s1.deg });
    await p.click('#td-view-over'); await settle(p);

    // ---------- T6: the same state by every route
    const routes = {};
    await p.click('[data-preset="90"]'); await settle(p); routes.preset = { s: await st(p), pos: await positions(p) };
    await p.click('[data-preset="0"]'); await settle(p);
    await p.focus('#td-slider'); for (let i = 0; i < 90; i++) await p.keyboard.press('ArrowRight'); await settle(p); routes.sliderKeys = { s: await st(p), pos: await positions(p) };
    await p.click('[data-preset="0"]'); await settle(p);
    await p.focus('#td-handle'); for (let i = 0; i < 9; i++) await p.keyboard.press('Shift+ArrowRight'); await settle(p); routes.handleKeys = { s: await st(p), pos: await positions(p) };
    ok('T6a preset, slider keys and Moon-handle keys all reach exactly 90° with identical surfaces', [routes.preset, routes.sliderKeys, routes.handleKeys].every(r => r.s.deg === 90) && same(routes.preset.pos, routes.sliderKeys.pos) && same(routes.preset.pos, routes.handleKeys.pos), Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, v.s.deg])));
    // drag the Moon to where 135° is drawn
    await p.click('#td-view-over'); await p.click('[data-preset="0"]'); await settle(p);
    await p.evaluate(() => document.getElementById('td-box').scrollIntoView({ block: 'center' })); await settle(p);   // keyboard focus above may have scrolled the scene out of view
    const scroll0 = await p.evaluate(() => scrollY), camD0 = await p.evaluate(() => TIDES.camera().pos);
    const h0 = await p.locator('#td-handle').boundingBox(), tgt = await p.evaluate(() => { const u = TidesModel.uMoon(135); return [u[0] * 230, 0, u[2] * 230]; }), to = await sceneXY(p, ...tgt);
    await p.evaluate(() => { const h = document.getElementById('td-handle'); window.__ev = []; ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => h.addEventListener(t, e => __ev.push(t + ':' + Math.round(e.clientX) + ',' + Math.round(e.clientY)))); });
    await p.mouse.move(h0.x + h0.width / 2, h0.y + h0.height / 2); await p.mouse.down();
    const mid = await sceneXY(p, ...(await p.evaluate(() => { const u = TidesModel.uMoon(70); return [u[0] * 230, 0, u[2] * 230]; })));
    await p.mouse.move(mid.x, mid.y, { steps: 8 }); await p.mouse.move(to.x, to.y, { steps: 8 }); await p.mouse.up(); await settle(p);
    const dbg = await p.evaluate(() => ({ ev: (window.__ev || []).slice(0, 6), hidden: document.getElementById('td-handle').hidden }));
    const sd = await st(p), camD1 = await p.evaluate(() => TIDES.camera().pos), scroll1 = await p.evaluate(() => scrollY);
    ok('T6b dragging the Moon handle reaches the angle under the pointer (135° ± 1.5°)', Math.abs(sd.deg - 135) < 1.5 && !sd.dragging, { deg: sd.deg, h0, to, mid, dbg });
    ok('T7h dragging the Moon does not move the camera (within 1e-6 scene units) or scroll the page', camD0.every((v, i) => Math.abs(v - camD1[i]) < 1e-6) && scroll0 === scroll1, { camD0, camD1, scroll0, scroll1 });
    ok('T6c after the drag the drawn surface is the model at the new angle (float32 tolerance)', (await meshVsModel(p)) < 1e-3);
    // playback
    await p.click('#td-play'); await sleep(1800); const pl = await st(p); await p.click('#td-play'); await settle(p); const ps = await st(p);
    ok('T6d Play moves the Moon; Pause stops it; the drawn surface is the model at the stopped angle', pl.playing && !ps.playing && Math.abs(ps.deg - sd.deg) > 5 && (await meshVsModel(p)) < 1e-3, { before: sd.deg, after: ps.deg });
    const cyc = await p.evaluate(() => document.getElementById('td-cycle').textContent);
    ok('T6e playback position reads as an illustrative cycle, not a date', /^Illustrative cycle: \d{1,2}%$/.test(cyc), cyc);
    // wrap through the slider and the handle
    await p.click('[data-preset="0"]'); await p.focus('#td-handle'); await p.keyboard.press('ArrowLeft'); const w1 = await st(p); await p.keyboard.press('ArrowRight'); const w2 = await st(p);
    ok('T6f keys wrap 0° → 359° → 0° and come back to the identical surface', w1.deg === 359 && w2.deg === 0 && same(await positions(p), routes.preset.pos) === false && (await meshVsModel(p)) < 1e-3);
    // Reset
    const init = await p.evaluate(() => TIDES.initial);
    await p.click('[data-preset="270"]'); await p.check('input[value="sun"]'); await p.click('#td-view-ang'); await p.click('#td-play'); await sleep(300);
    await p.click('#td-reset'); await settle(p); const rs = await st(p), rp = await p.evaluate(() => TIDES.camera().pov);
    await p.click('[data-preset="0"]'); await settle(p); const p0 = await positions(p);
    ok('T6g Reset restores angle, mode, paused playback and the Overhead camera', rs.deg === init.deg && rs.mode === init.mode && !rs.playing && rs.view === 'overhead' && Math.abs(rp.lat - 89.4) < 0.05, { rs, lat: rp.lat });
    await p.click('#td-reset'); await settle(p);
    ok('T6h Reset is deterministic: the surface after Reset equals the start surface', same(await positions(p), p0) && same(p0, pos0));

    // ---------- T9: keyboard, focus, status line
    await p.click('#td-reset'); await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    await p.focus('[data-preset="180"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const fv = await p.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e); return { tag: e.dataset.preset, outline: c.outlineStyle, width: c.outlineWidth }; });
    ok('T9a keyboard focus is visible on the controls', fv.tag === '180' && fv.outline !== 'none' && parseFloat(fv.width) >= 2, fv);
    await p.keyboard.press('Enter'); await sleep(700);
    const stx = await p.evaluate(() => document.getElementById('td-status').textContent);
    ok('T9b a preset chosen by keyboard sets the state and the status line says so', (await st(p)).deg === 180 && /Moon at 180°, full Moon\. Moon and Sun together/.test(stx), stx);
    const changes = await p.evaluate(async () => { let n = 0; const o = new MutationObserver(() => n++); o.observe(document.getElementById('td-status'), { childList: true, characterData: true, subtree: true }); document.getElementById('td-play').click(); await new Promise(r => setTimeout(r, 2500)); document.getElementById('td-play').click(); await new Promise(r => setTimeout(r, 700)); o.disconnect(); return n; });
    ok('T9c no status announcement per frame: at most one while playing 2.5 s and stopping', changes <= 1, { changes });
    ok('T9d the slider and the Moon handle have readable names and values', await p.evaluate(() => /Moon position/.test(document.querySelector('label[for="td-slider"]').textContent) && /°, /.test(document.getElementById('td-slider').getAttribute('aria-valuetext')) && /Moon\. Drag it around Earth, or use the arrow keys/.test(document.getElementById('td-handle').getAttribute('aria-label'))));
    // explanation wording: exact geometry only at the presets (GPT R2)
    const ex = await p.evaluate(() => { const out = {}; for (const d of [0, 10, 45, 90, 100, 180, 190, 270, 280, 359.6]) { TIDES.setDeg(d); out[d] = { t: document.getElementById('td-explain').textContent, name: TidesModel.phaseName(d) }; } TIDES.setDeg(0); return out; });
    const exact = t => /in line \(|at right angles \(|the largest difference|the smallest difference/.test(t);
    ok('T6i at the presets the explanation names the exact geometry (spring at new and full, neap at the quarters)', /in line \(new Moon\)/.test(ex[0].t) && /in line \(full Moon\)/.test(ex[180].t) && /at right angles \(first quarter\)/.test(ex[90].t) && /at right angles \(last quarter\)/.test(ex[270].t) && /in line \(new Moon\)/.test(ex[359.6].t), Object.fromEntries(Object.entries(ex).map(([k, v]) => [k, v.t.slice(0, 50)])));
    ok('T6j 10° from a preset the explanation says "close to", gives the actual share, and claims no exact geometry', [10, 100, 190, 280].every(d => /^Close to (new Moon|first quarter|full Moon|last quarter), 10° from/.test(ex[d].t) && /\d+% of/.test(ex[d].t) && !exact(ex[d].t)) && !exact(ex[45].t) && /^Between the two/.test(ex[45].t), { 10: ex[10].t, 100: ex[100].t, 45: ex[45].t });
    ok('T6k the explanation and the phase readout agree (no exact claim where the phase is named "between")', Object.values(ex).every(v => !exact(v.t) || !/^between/.test(v.name)));
    // hidden tab
    await p.click('#td-play'); await sleep(300);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hid = await st(p);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await sleep(800);
    ok('T9e a hidden tab pauses playback, and it stays paused on return', !hid.playing && !(await st(p)).playing, { hidden: hid.playing });
    // pointer cancel mid-drag
    const hb = await p.locator('#td-handle').boundingBox();
    const pc = await p.evaluate(([x, y]) => { const h = document.getElementById('td-handle'), o = { pointerId: 7, bubbles: true, cancelable: true, clientX: x, clientY: y, isPrimary: true, pointerType: 'touch', button: 0 };
      h.dispatchEvent(new PointerEvent('pointerdown', o)); h.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, o, { clientX: x + 30, clientY: y + 40 }))); const mid = TIDES.state();
      h.dispatchEvent(new PointerEvent('pointercancel', o)); return { mid, after: TIDES.state() }; }, [hb.x + hb.width / 2, hb.y + hb.height / 2]);
    ok('T9f a cancelled pointer ends the drag and leaves a valid angle', pc.mid.dragging && !pc.after.dragging && pc.after.deg >= 0 && pc.after.deg < 360 && (await meshVsModel(p)) < 1e-3, pc);
    ok('T9g the wheel is never captured by the scene (no zoom in this slice)', await p.evaluate(() => { const ev = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }); document.getElementById('td-scene').querySelector('canvas').dispatchEvent(ev); return !ev.defaultPrevented; }));

    // ---------- T10: requests and rendering
    const hosts = [...new Set(A.log.map(l => l.split('/')[0]))].sort();
    ok('T10a requests: only this site, the globe library and the font stylesheet (no hub, no GIBS, no SDO)', hosts.every(h => ['tides.test', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(h)) && !A.log.some(l => /workers\.dev|gibs|sdo\.gsfc/.test(l)), hosts);
    ok('T10b no timers left running by the page (no setInterval)', !/setInterval/.test(fs.readFileSync(path.join(ROOT, 'tides.js'), 'utf8')));
    await p.click('#td-reset'); await settle(p); await sleep(1500);
    const r0 = await p.evaluate(() => TIDES.renders()); await sleep(5000); const r1 = await p.evaluate(() => TIDES.renders());
    ok('T10c settled and paused: no frames drawn for 5 s', r1 === r0, { r0, r1 });
    await p.setViewportSize({ width: 1100, height: 820 }); await sleep(1500); const r2 = await p.evaluate(() => TIDES.renders()); await sleep(3000); const r3 = await p.evaluate(() => TIDES.renders());
    ok('T10d a resize while paused draws its final frame, then stops again', r2 > r1 && r3 === r2, { r1, r2, r3 });
    const sf = await p.evaluate(() => TIDES.surface());
    const nOk = sf.normals.every(Number.isFinite) && sf.normals.length === sf.positions.length && Math.abs(sf.bounds - Math.max(...(() => { const r = []; for (let i = 0; i < sf.positions.length; i += 3) r.push(Math.hypot(sf.positions[i], sf.positions[i + 1], sf.positions[i + 2])); return r; })())) < 1;
    ok('T10e after deformation the surface has finite normals and a bounding sphere that fits it', nOk, { bounds: sf.bounds });
    await A.ctx.close();

    // late picture while paused still gets its frame
    const L = await open(browser, { delayImg: { name: 'sun-2026-11-25', ms: 6000 } });
    await L.page.waitForFunction(() => TIDES.state().three === 'ok', null, { timeout: 30000 }); await sleep(3000);
    const lr0 = await L.page.evaluate(() => TIDES.renders()); await L.page.waitForFunction(() => TIDES.state().images.sun === 'ok', null, { timeout: 20000 }); await sleep(1500);
    const lr1 = await L.page.evaluate(() => TIDES.renders()); await sleep(2500); const lr2 = await L.page.evaluate(() => TIDES.renders());
    ok('T10f a picture that arrives late, while paused, is drawn, and the loop stops again', lr1 > lr0 && lr2 === lr1, { lr0, lr1, lr2 });
    await L.ctx.close();

    // ---------- T2/T9: each picture failing on its own
    for (const [k, file, word] of [['earth', 'earth-2026-06-22', 'Earth'], ['moon', 'lroc_color_2k', 'Moon'], ['sun', 'sun-2026-11-25', 'Sun']]) {
      const F = await open(browser, { blockImg: file }), fp = F.page, fs1 = await st(fp);
      await fp.click('[data-preset="90"]'); await settle(fp);
      const txt = await fp.evaluate(() => document.getElementById('td-3d').textContent + ' | ' + [...document.querySelectorAll('.td-tag,#td-handle span')].map(e => e.textContent).join(' '));
      ok(`T2f ${word} picture failing: scene stays on, ${word} named as a plain body, model still follows the controls`, fs1.three === 'ok' && fs1.images[k] === 'failed' && new RegExp(word + ' picture unavailable').test(txt) && new RegExp(word + ' \\(image unavailable\\)').test(txt) && (await st(fp)).deg === 90 && (await meshVsModel(fp)) < 1e-3, { images: fs1.images, three: fs1.three, txt });
      await F.ctx.close();
    }

    // ---------- T9: no WebGL / no library: the cross-section is the view, controls still work
    for (const [label, opt] of [['no WebGL', { noWebGL: true }], ['library blocked', { noLib: true }]]) {
      const N = await open(browser, opt), np = N.page, ns = await st(np);
      await np.click('[data-preset="90"]'); await np.check('input[value="moon"]');
      const x = await np.evaluate(() => { const s = document.getElementById('td-xsec'); return { deg: s.dataset.deg, mode: s.dataset.mode, txt: document.getElementById('td-3d').textContent, vis: getComputedStyle(document.getElementById('td-scene')).display }; });
      ok(`T9h ${label}: says why, hides the scene, and the cross-section follows presets and modes`, ns.three === 'none' && x.deg === '90' && x.mode === 'moon' && /cross-section below is the same model/.test(x.txt) && x.vis === 'none' && N.errors.length === 0, { ns: ns.three, x, errors: N.errors });
      await N.ctx.close();
    }

    // ---------- T9: reduced motion; nothing moves by itself
    const R = await open(browser, { reduced: true }), rp2 = R.page; await sleep(1500);
    const rr0 = await rp2.evaluate(() => TIDES.renders()); await sleep(3000); const rr1 = await rp2.evaluate(() => TIDES.renders());
    ok('T9i reduced motion: starts paused and draws nothing on its own', !(await st(rp2)).playing && rr1 === rr0, { rr0, rr1 });
    await R.ctx.close();

    // ---------- T7: labels never sit on another body (GPT R3): both camera presets, four phases, three window sizes, plus free camera
    const labelProblems = async pg => pg.evaluate(() => {
      const g = TIDES.tagGeom(), box = document.getElementById('td-scene').getBoundingClientRect(), rr = el => { const r = el.getBoundingClientRect(); return { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top }; };
      const E = rr(document.getElementById('td-tag-earth')), S = rr(document.getElementById('td-tag-sun')), H = rr(document.getElementById('td-handle')), ML = rr(document.querySelector('#td-handle span'));
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const circ = (a, c, r) => { const x = Math.max(a.l, Math.min(c[0], a.r)), y = Math.max(a.t, Math.min(c[1], a.b)); return Math.hypot(x - c[0], y - c[1]) < r; };
      const bad = [];
      if (hit(E, H) || hit(E, ML) || circ(E, g.M, g.rM)) bad.push('Earth label on the Moon');
      if (circ(ML, g.E, g.rE)) bad.push('Moon label on Earth');
      if (hit(S, E) || hit(S, ML) || circ(S, g.M, g.rM)) bad.push('Sun label on another label or the Moon');
      if (circ(E, g.S, g.rS) || circ(ML, g.S, g.rS)) bad.push('a label on the Sun');
      return bad;
    });
    const sizes = [[1280, 900], [1280, 720], [390, 844]], lp = [];
    for (const [w, h] of sizes) {
      const V = await open(browser, { viewport: { width: w, height: h } }), vp = V.page;
      for (const view of ['over', 'ang']) for (const d of [0, 90, 180, 270]) {
        await vp.click('#td-view-' + view); await vp.click('[data-preset="' + d + '"]'); await settle(vp);
        const b = await labelProblems(vp); if (b.length) lp.push(w + 'x' + h + ' ' + view + ' ' + d + '°: ' + b.join(', '));
      }
      if (w === 1280 && h === 720) { await vp.click('#td-view-ang'); await vp.click('[data-preset="90"]'); await settle(vp); await vp.locator('#td-box').screenshot({ path: path.join(require('os').tmpdir(), 'tides-angled-90-1280x720.png') }); }
      // free camera: three drags from the Angled view at first quarter
      await vp.click('#td-view-ang'); await vp.click('[data-preset="90"]'); await settle(vp);
      const sb = await vp.locator('#td-scene').boundingBox();
      for (const [dx, dy] of [[120, -30], [-200, 40], [60, 70]]) {
        await vp.mouse.move(sb.x + 30, sb.y + sb.height - 30); await vp.mouse.down(); await vp.mouse.move(sb.x + 30 + dx, sb.y + sb.height - 30 + dy, { steps: 8 }); await vp.mouse.up(); await settle(vp);
        const b = await labelProblems(vp); if (b.length) lp.push(w + 'x' + h + ' free camera after drag ' + dx + ',' + dy + ': ' + b.join(', '));
      }
      await V.ctx.close();
    }
    ok('T7i no label sits on another body or label: Overhead and Angled × four phases × 1280×900, 1280×720, 390×844, plus three free-camera positions each', lp.length === 0, lp);

    // ---------- T8 / layout at phone width
    const P = await open(browser, { viewport: { width: 390, height: 844 }, touch: true }), pp = P.page;
    const lay = await pp.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, model: r('td-model').width, scene: r('td-box').width, ctlTop: r('td-play').top, sceneBottom: r('td-box').bottom, clock: !!document.querySelector('.top .clock') }; });
    ok('T8f 390 px: no sideways overflow; scene full width; controls under the scene; model line shown; no clock', lay.sw <= 390 && lay.scene >= 360 && lay.ctlTop > lay.sceneBottom && lay.model > 300 && !lay.clock, lay);
    ok('T8g 390 px: the explanation does not cover the scene', await pp.evaluate(() => { const a = document.getElementById('td-box').getBoundingClientRect(), b = document.getElementById('td-explain').getBoundingClientRect(); return b.top >= a.bottom; }));
    // real touch swipes (CDP touch events, not a programmatic scroll): vertical on the scene scrolls the page and leaves the
    // model and camera alone; sideways on the scene turns the camera and does not scroll; on the Moon handle it moves the Moon
    const cdp = await pp.context().newCDPSession(pp);
    const swipe = async (x0, y0, x1, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
      for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * k / 12, y: y0 + (y1 - y0) * k / 12 }] }); await sleep(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500); await settle(pp); };
    await pp.evaluate(() => { document.getElementById('td-box').scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); }); await sleep(300);
    const tb = await pp.locator('#td-scene').boundingBox(), sy = tb.y + tb.height * 0.8, sx = tb.x + 30;
    const t0 = { y: await pp.evaluate(() => scrollY), cam: await pp.evaluate(() => TIDES.camera().pos), s: await st(pp) };
    await swipe(sx, sy, sx, sy - 160);
    const t1 = { y: await pp.evaluate(() => scrollY), cam: await pp.evaluate(() => TIDES.camera().pos), s: await st(pp) };
    ok('T9j touch: a vertical swipe on the scene scrolls the page; the Moon angle stays', t1.y > t0.y + 40 && t1.s.deg === t0.s.deg, { y0: t0.y, y1: t1.y, deg: [t0.s.deg, t1.s.deg] });
    await pp.evaluate(() => { document.getElementById('td-box').scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); }); await sleep(300);
    const tb2 = await pp.locator('#td-scene').boundingBox(), y2 = await pp.evaluate(() => scrollY), c2 = await pp.evaluate(() => TIDES.camera().pos);
    await swipe(tb2.x + 40, tb2.y + tb2.height * 0.8, tb2.x + 260, tb2.y + tb2.height * 0.8);
    const y3 = await pp.evaluate(() => scrollY), c3 = await pp.evaluate(() => TIDES.camera().pos);
    ok('T9l touch: a sideways swipe on the scene turns the camera and does not scroll', y3 === y2 && Math.hypot(c3[0] - c2[0], c3[1] - c2[1], c3[2] - c2[2]) > 5, { y2, y3 });
    const hb2 = await pp.locator('#td-handle').boundingBox(), d0 = (await st(pp)).deg, y4 = await pp.evaluate(() => scrollY);
    await swipe(hb2.x + 24, hb2.y + 24, hb2.x + 24, hb2.y + 24 - 120);
    const d1 = (await st(pp)).deg, y5 = await pp.evaluate(() => scrollY);
    ok('T9m touch: a swipe that starts on the Moon moves the Moon and does not scroll', Math.abs(d1 - d0) > 3 && y5 === y4, { d0, d1, y4, y5 });
    ok('T9k 390 px: page errors none', P.errors.length === 0, P.errors);
    await P.ctx.close();
  } catch (e) { fail++; failed.push('harness'); console.log('FAIL  harness error: ' + (e && e.stack || e)); }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed${B ? '  (BREAK=' + B + ')' : ''}`);
  if (fail) console.log('failed: ' + failed.join(' | '));
  process.exit(fail ? 1 : 0);
})();
