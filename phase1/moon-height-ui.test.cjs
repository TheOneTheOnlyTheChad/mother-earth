/* Moon height layer (moon.html, moonsci.js, the moonglobe.js hook) — real globe.gl 2.45.0 under SwiftShader.
 *  A. lossless: every decoded value in the page equals the build's integers; named cells against the PDS float
 *  B. texture and click mapping: landmarks, both sides of 0/360 and 180, cell boundaries, near the north pole; colour under
 *     the click matches the texture's colour for that point; withheld cap visible as grey stripes
 *  C. state contract (proposal rev 2.1 §4.3): unchanged while loading, success, switch off, failures, late answers, LRO untouched
 *  D. network and rendering: no requests while off, one per file on first use, none later; idle draw calls height off/on
 *  E. keyboard, narrow layout, behaviour with height never used
 * Run: LOLA_SRC=<dir with ldem_4_float.img> node phase1/moon-height-ui.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=be|late|nolock|norestore|early|nocache|row|col|noraw|nopin|nofirst|norevoke must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SRC = path.join(process.env.LOLA_SRC || '', 'ldem_4_float.img');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
const GZ = fs.readFileSync(path.join(ROOT, 'assets/moon/lola/ldem4-m-R1.i16.gz')), RAW = zlib.gunzipSync(GZ);
const EXP = new Int16Array(RAW.length / 2); for (let i = 0; i < EXP.length; i++) EXP[i] = RAW.readInt16LE(2 * i);
const FLOAT = fs.existsSync(SRC) ? new Float32Array(fs.readFileSync(SRC).buffer.slice(0)) : null;
const TEX = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'assets/moon/lola/ldem4-colour-R1.png')));
const texAt = (lat, lng) => { const x = Math.min(2047, Math.floor((((lng + 180) % 360 + 360) % 360) / 360 * 2048)), y = Math.min(1023, Math.floor((90 - lat) / 180 * 1024)); const k = 4 * (y * 2048 + x); return [TEX.data[k], TEX.data[k + 1], TEX.data[k + 2]]; };
const idx = (lat, lng) => Math.min(719, Math.max(0, Math.floor((90 - lat) * 4))) * 1440 + Math.floor((((lng % 360) + 360) % 360) * 4) % 1440;
const near = (a, b, tol = 30) => a.every((v, k) => Math.abs(v - b[k]) <= tol);

(async () => {
  ok('source float file present (LOLA_SRC)', !!FLOAT, SRC);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: opt.w || 1000, height: opt.h || 900 }, reducedMotion: 'reduce' });
    const hits = { grid: 0, tex: 0 };
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonsci.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'moonsci.js'), 'utf8');
      const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); };   // a break that matches nothing must not pass silently
      if (BREAK === 'be') B('dv.getInt16(2 * i, true)', 'dv.getInt16(2 * i, false)');
      if (BREAK === 'late') B('if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }', '');
      if (BREAK === 'nolock') B('h.lock(true);', '');
      if (BREAK === 'norestore') B('if (MS.saved && MS.saved.on) h.litRestore(true);', '');
      if (BREAK === 'early') B('const tok = ++MS.tok, ctl = new AbortController();', 'MG().litOff(); const tok = ++MS.tok, ctl = new AbortController();');
      if (BREAK === 'nocache') { B('H.grid ? Promise.resolve(H.grid) : first(loadGrid(ctl.signal))', 'first(loadGrid(ctl.signal))'); B('H.texUrl ? Promise.resolve(H.texUrl) : first(loadTex(ctl.signal))', 'first(loadTex(ctl.signal))'); }
      if (BREAK === 'row') B('Math.floor((90 - lat) * 4)', 'Math.round((90 - lat) * 4)');
      if (BREAK === 'col') B('Math.floor((((lng % 360) + 360) % 360) * 4) % HCOLS', 'Math.floor((((lng + 180) % 360 + 360) % 360) * 4) % HCOLS');
      if (BREAK === 'noraw') B('return buf;   // a server', "throw new Why('not gzip');   // a server");
      if (BREAK === 'nofirst') B('if (!firstErr) firstErr = e; ctl.abort(); throw e;', 'if (!firstErr) firstErr = e; throw e;');
      if (BREAK === 'norevoke') B('if (madeTex) { URL.revokeObjectURL(madeTex); H.revoked++; }', '');
      if (BREAK === 'nopin') B('if (raw.byteLength !== HF.grid.rawBytes || await hex(raw) !== HF.grid.rawSha) throw', 'if (false) throw');
      if (BREAK && !globalThis.__brkLogged) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): ' + BREAK); }
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    await ctx.route('**/assets/moon/lola/ldem4-m-R1.i16.gz*', async r => { hits.grid++;
      if (opt.gridDelay) await new Promise(res => setTimeout(res, opt.gridDelay));
      if (opt.gridHang) return;   // never answers
      if (opt.grid404) return r.fulfill({ status: 404, body: '' });
      let body = GZ; if (opt.gridRaw) body = RAW; if (opt.gridBad) { body = Buffer.from(opt.gridRaw ? RAW : GZ); body[body.length >> 1] ^= 1; } if (opt.gridShort) body = GZ.subarray(0, GZ.length - 10);
      r.fulfill({ status: 200, contentType: 'application/octet-stream', body }); });
    const PNGB = fs.readFileSync(path.join(ROOT, 'assets/moon/lola/ldem4-colour-R1.png'));
    await ctx.route('**/assets/moon/lola/ldem4-colour-R1.png*', async r => { hits.tex++;
      if (opt.texDelay) await new Promise(res => setTimeout(res, opt.texDelay));
      if (opt.texHang) return;
      if (opt.tex404) return r.fulfill({ status: 404, body: '' }).catch(() => {});
      let body = PNGB; if (opt.texBad) { body = Buffer.from(PNGB); body[body.length >> 1] ^= 1; }
      r.fulfill({ status: 200, contentType: 'image/png', body }).catch(() => {}); });
    // object-URL accounting: every URL made and revoked on the page
    await ctx.addInitScript(() => { window.__u = { made: [], revoked: [] }; const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = mk(b); window.__u.made.push(u); return u; }; URL.revokeObjectURL = u => { window.__u.revoked.push(u); rv(u); }; });
    if (opt.noDecode) await ctx.addInitScript(() => { HTMLImageElement.prototype.decode = function () { return Promise.reject(new Error('decode')); }; });
    if (opt.noDS) await ctx.addInitScript(() => { delete window.DecompressionStream; });
    if (opt.noAbort) await ctx.addInitScript(() => { AbortController.prototype.abort = function () {}; });   // a response that arrives anyway
    if (opt.count) await ctx.addInitScript(() => { window.__c = { draw: 0 }; for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue;
      for (const m of ['drawElements', 'drawArrays']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { window.__c.draw++; return o.apply(this, a); }; } } });
    const p = await ctx.newPage(); await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 }); await p.waitForTimeout(1200);
    return { ctx, p, hits };
  };
  const attr = (p, sel, a) => p.evaluate(([sel, a]) => { const e = document.querySelector(sel); return e ? e.getAttribute(a) : null; }, [sel, a]);
  const text = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent : null; }, sel);
  const hidden = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return !e || e.hidden || getComputedStyle(e).display === 'none'; }, sel);
  const press = (p, sel) => p.evaluate(sel => document.querySelector(sel).click(), sel);
  const toGlobe = p => p.evaluate(() => document.getElementById('mg-globe').scrollIntoView({ block: 'center' }));
  const live = p => p.evaluate(() => window.__u.made.filter(u => !window.__u.revoked.includes(u)).length);
  const texUrl = p => p.evaluate(() => MoonGlobe.globe().globeImageUrl());
  const hstate = p => p.evaluate(() => MoonHeight.state());
  const waitPhase = (p, ph, t = 20000) => p.waitForFunction(ph => MoonHeight.state().phase === ph, ph, { timeout: t }).then(() => true, () => false);
  const centreRGB = async (p, x, y) => { const s = await p.screenshot({ clip: { x: x - 2, y: y - 2, width: 4, height: 4 } }); const png = PNG.sync.read(s); const k = 4 * (1 * 4 + 1); return [png.data[k], png.data[k + 1], png.data[k + 2]]; };

  // ---- E (part) + A + D (network)
  { const { ctx, p, hits } = await mk();
    ok('E height off at start: picture texture, legend hidden, button off', /lroc_color_2k/.test(await texUrl(p)) && await hidden(p, '#mg-height-leg') && (await attr(p, '#mg-height', 'aria-pressed')) === 'false');
    ok('D no height requests while off', hits.grid === 0 && hits.tex === 0, hits);
    await press(p, '#mg-height'); ok('A height switches on', await waitPhase(p, 'on'));
    ok('D one request per file on first use', hits.grid === 1 && hits.tex === 1, hits);
    ok('B texture is the height picture (blob of the checked file)', /^blob:/.test(await texUrl(p)), await texUrl(p));
    // A: every value
    let diff = 0, first = -1;
    for (let s = 0; s < EXP.length; s += 86400) { const got = await p.evaluate(([s, n]) => Array.from(MoonHeight.grid().subarray(s, s + n)), [s, 86400]);
      for (let k = 0; k < got.length; k++) if (got[k] !== EXP[s + k]) { diff++; if (first < 0) first = s + k; } }
    ok('A all 1,036,800 decoded values equal the build file (explicit little-endian)', diff === 0, { diff, first });
    ok('A withheld marker exactly on rows 0-1 (2,880 cells)', (() => { let n = 0, wrong = 0; for (let i = 0; i < EXP.length; i++) { if (EXP[i] === -32768) { n++; if (i >= 2880) wrong++; } } return n === 2880 && wrong === 0; })());
    if (FLOAT) { let worst = 0; for (let i = 2880; i < EXP.length; i++) worst = Math.max(worst, Math.abs(EXP[i] - FLOAT[i] * 1000)); ok('A every kept cell within 0.5 m of the PDS float', worst <= 0.5 + 1e-6, worst);
      const named = [['highest', 5.4125, 201.3665, 10504], ['lowest', -70.4, 187.6, -8879], ['first kept row', 89.49, 100, null], ['zero-metre cell', null, null, 0]];
      for (const [n, la, lo, want] of named) { if (la === null) { const i = EXP.findIndex((v, k) => k >= 2880 && v === 0); const got = await p.evaluate(i => MoonHeight.grid()[i], i); ok('A named: ' + n, got === 0 && Math.abs(FLOAT[i] * 1000) <= 0.5, { got, f: FLOAT[i] }); continue; }
        const got = await p.evaluate(([a, o]) => MoonHeight.value(a, o), [la, lo]), i = idx(la, lo);
        ok('A named: ' + n, got === Math.round(FLOAT[i] * 1000) && (want === null || got === want), { got, f: FLOAT[i] * 1000 }); }
      const neg = EXP.findIndex((v, k) => k >= 2880 && v < 0); ok('A named: a negative cell', (await p.evaluate(i => MoonHeight.grid()[i], neg)) === Math.round(FLOAT[neg] * 1000));
      ok('A named: withheld (89.9N)', (await p.evaluate(() => MoonHeight.value(89.9, 10))) === -32768);
      let rnd = 0; for (let k = 0; k < 50; k++) { const i = 2880 + ((k * 7919 * 131) % (EXP.length - 2880)); if ((await p.evaluate(i => MoonHeight.grid()[i], i)) !== Math.round(FLOAT[i] * 1000)) rnd++; } ok('A 50 spread cells equal the PDS float rounded', rnd === 0, rnd); }
    // later toggles: no requests
    await press(p, '#mg-height'); await waitPhase(p, 'off'); await press(p, '#mg-height'); await waitPhase(p, 'on'); await press(p, '#mg-height'); await waitPhase(p, 'off');
    ok('D no requests on later toggles', hits.grid === 1 && hits.tex === 1, hits);
    await ctx.close(); }

  // ---- B: click mapping and colour under the click
  { const { ctx, p } = await mk();
    await press(p, '#mg-height'); await waitPhase(p, 'on'); await p.evaluate(() => MoonGlobe.point(0, 0)); await toGlobe(p); await p.waitForTimeout(400);
    const pts = [['highest point', 5.4125, 201.3665], ['Antoniadi low', -70.4, 187.6], ['west of 0/360 seam', 0.1, -0.1], ['east of 0/360 seam', 0.1, 0.1],
      ['west of 180', 10.1, 179.9], ['east of 180', 10.1, -179.9], ['just inside cell NE of 10N 20E', 10.02, 20.02], ['just inside cell SW of 10N 20E', 9.98, 19.98],
      ['mid-latitude far side', -40.3, 150.6], ['south polar', -84.6, 33.3]];
    // zoomed in (altitude 0.5: about 0.1 deg per screen pixel at the centre). The readout must give the cell containing the point
    // the click landed on (reported in data-lat/lng), that point must be within 0.25 deg of the aim, and the colour on screen there
    // must be the texture's colour for that point.
    for (let k = 0; k < 8; k++) await press(p, '#mg-zin');
    for (const [name, la, lo] of pts) {
      await p.evaluate(([a, o]) => MoonGlobe.point(a, o), [Math.max(-80, Math.min(80, la)), lo]); await toGlobe(p); await p.waitForTimeout(350);
      const sc = await p.evaluate(([a, o]) => { const s = MoonGlobe.screen(a, o), r = document.getElementById('mg-globe').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, [la, lo]);
      const before = (await attr(p, '#mg-height-read', 'data-lat')) + ',' + (await attr(p, '#mg-height-read', 'data-lng'));
      await p.mouse.click(sc.x, sc.y); await p.waitForTimeout(250);
      const v = await attr(p, '#mg-height-read', 'data-value'), cl = +(await attr(p, '#mg-height-read', 'data-lat')), cg = +(await attr(p, '#mg-height-read', 'data-lng'));
      const dAng = Math.hypot(cl - la, ((((cg - lo) % 360) + 540) % 360 - 180) * Math.cos(la * Math.PI / 180));
      ok(`B click registers at once (no stale position): ${name}`, v !== null && cl + ',' + cg !== before && dAng <= 0.25, { cl, cg, la, lo, dAng });
      ok(`B readout = value of the cell containing the clicked point: ${name}`, v !== null && +v === EXP[idx(cl, cg)], { v, want: EXP[idx(cl, cg)] });
      const rgb = await centreRGB(p, sc.x, sc.y); ok(`B screen colour at the click is within 36 per channel of the saved texture's colour at the clicked point (visual registration at this scope, not proof of unfiltered per-cell rendering): ${name}`, near(rgb, texAt(cl, cg), 36), { rgb, tex: texAt(cl, cg) }); }
    // cell boundaries without the screen: the page's own lookup on both sides of 10N/20E, 0/360 and 180 against the build file
    for (const [la, lo] of [[10.0001, 20.0001], [9.9999, 19.9999], [10.0, 20.0], [0.1, 359.9999], [0.1, 0.0001], [0.1, 179.9999], [0.1, 180.0001], [0.1, -0.0001], [89.5001, 5], [89.4999, 5], [-89.9999, 5]]) {
      const got = await p.evaluate(([a, o]) => MoonHeight.value(a, o), [la, lo]); ok(`B lookup at ${la}, ${lo} = build cell`, got === EXP[idx(la, lo)], { got, want: EXP[idx(la, lo)] }); }
    // withheld cap: view near the north pole, zoomed in; the stripes are on screen; readout gives the withheld sentence
    await p.evaluate(() => MoonGlobe.point(85, 0)); await toGlobe(p); for (let k = 0; k < 6; k++) { await press(p, '#mg-zin'); } await p.waitForTimeout(400);
    const capPts = []; for (const lo of [0, 60, 120, 180, 240, 300]) capPts.push(await p.evaluate(lo => { const s = MoonGlobe.screen(89.8, lo), r = document.getElementById('mg-globe').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, lo));
    let greys = 0; for (const c of capPts) { const [r, g, bb] = await centreRGB(p, c.x, c.y); if (Math.abs(r - g) < 14 && Math.abs(g - bb) < 14 && r > 60 && r < 170) greys++; }
    ok('B withheld cap visible as neutral grey at 89.8N (≥ 5 of 6 longitudes; polygon on top)', greys >= 5, greys);
    await p.mouse.click(capPts[0].x, capPts[0].y); await p.waitForTimeout(250);
    ok('B readout in the cap: withheld sentence, no value', /Values north of 89\.5°N are withheld because inconsistencies were found in the source products\./.test(await text(p, '#mg-height-read')) && (await attr(p, '#mg-height-read', 'data-value')) === '-32768');
    ok('B legend has the withheld swatch and wording', /Withheld \(north of 89\.5°N\)/.test(await text(p, '#mg-height-leg')));
    ok('B readout never says altitude / sea level / above the surface; the legend says what it is not', !/altitude|sea level|above the surface/i.test(await text(p, '#mg-height-read'))
      && /not above “sea level” or the local surface/.test(await text(p, '#mg-height-leg')) && !/altitude/i.test(await text(p, '#mg-height-leg')));
    await ctx.close(); }

  // ---- C: state contract
  { const { ctx, p } = await mk({ gridDelay: 2500 });
    await press(p, '#mg-lit'); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {});
    await press(p, '#mg-earth'); await p.waitForTimeout(300);
    const before = await p.evaluate(() => MoonGlobe.light());
    ok('C setup: lit on and Earth view on', before.on && before.earthView, before);
    await press(p, '#mg-height'); await p.waitForTimeout(800);
    const mid = await p.evaluate(() => ({ L: MoonGlobe.light(), url: MoonGlobe.globe().globeImageUrl(), dis: document.getElementById('mg-lit').disabled }));
    ok('C while loading: nothing in the view changes (lit, Earth view, uniform, camera, texture, buttons)', (await hstate(p)).phase === 'loading' && mid.L.on && mid.L.earthView && mid.L.uniform.on === 1
      && Math.abs(mid.L.cam.dist - before.cam.dist) <= 0.005 * before.cam.dist && mid.L.cam.fov === before.cam.fov && /lroc_color_2k/.test(mid.url) && !mid.dis, { mid, before: before.cam });
    ok('C success', await waitPhase(p, 'on'));
    const on = await p.evaluate(() => ({ L: MoonGlobe.light(), lit: document.getElementById('mg-lit').disabled, earthHidden: document.getElementById('mg-earth').hidden }));
    ok('C on: Earth view left, lit off, uniform off, lighting buttons disabled', !on.L.earthView && !on.L.on && on.L.uniform.on === 0 && on.lit, on);
    await p.click('#mg-lit', { force: true, timeout: 3000 }).catch(() => {}); await p.waitForTimeout(300); ok('C on: a press on the disabled "Lit as now" does nothing', !(await p.evaluate(() => MoonGlobe.light().on)));
    await press(p, '#mg-height'); await waitPhase(p, 'off'); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {});
    const off = await p.evaluate(() => ({ L: MoonGlobe.light(), url: MoonGlobe.globe().globeImageUrl(), lit: document.getElementById('mg-lit').disabled, earth: document.getElementById('mg-earth') }));
    const offE = await p.evaluate(() => ({ dis: document.getElementById('mg-earth').disabled, hidden: document.getElementById('mg-earth').hidden }));
    ok('C off: picture back, lit restored for the current minute, buttons enabled', /lroc_color_2k/.test(off.url) && off.L.on && off.L.state === 'on' && off.L.uniform.on === 1 && !off.lit
      && Math.abs(off.L.minute - Math.floor(Date.now() / 60000) * 60000) <= 60000, off.L);
    ok('C off: Earth view not reopened; its button available; readout says so', !off.L.earthView && !offE.dis && !offE.hidden && /Earth view was closed while height was shown/.test(await text(p, '#mg-height-read')), offE);
    await ctx.close(); }
  for (const noAbort of [false, true]) { // late answer after switching off (with abort working, and with an answer that arrives anyway: the token decides)
    const { ctx, p } = await mk({ gridDelay: 3000, noAbort });
    await press(p, '#mg-height'); await p.waitForTimeout(300); await press(p, '#mg-height'); await p.waitForTimeout(4500);
    const s = await hstate(p);
    ok(`C rapid toggle${noAbort ? ' (answer arrives despite the abort)' : ''}: a late answer does not switch height on`, s.phase === 'off' && !s.on && /lroc_color_2k/.test(await texUrl(p)) && !(await p.evaluate(() => document.getElementById('mg-lit').disabled)), s);
    await ctx.close(); }
  for (const [name, opt, re] of [['404', { grid404: true }, /HTTP 404/], ['bad hash (compressed)', { gridBad: true }, /integrity/], ['short file', { gridShort: true }, /integrity/],
    ['bad hash (already decompressed)', { gridRaw: true, gridBad: true }, /integrity/], ['no DecompressionStream', { noDS: true }, /newer browser/], ['timeout', { gridHang: true }, /too long/],
    ['texture 404', { tex404: true }, /HTTP 404/], ['texture bad hash', { texBad: true }, /picture failed its integrity/], ['texture timeout', { texHang: true }, /too long/],
    ['texture decode failure', { noDecode: true }, /could not be decoded/], ['texture ok, grid 404 (texture made then dropped)', { grid404: true, texDelay: 0 }, /HTTP 404/]]) {
    const { ctx, p } = await mk(opt);
    await press(p, '#mg-lit'); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {});
    const b4 = await p.evaluate(() => MoonGlobe.light());
    await press(p, '#mg-height'); await waitPhase(p, 'off', 20000); await p.waitForTimeout(200);
    const af = await p.evaluate(() => MoonGlobe.light()), t = await text(p, '#mg-height-read');
    ok(`C failure (${name}): nothing changes, reason given`, af.on === b4.on && af.uniform.on === b4.uniform.on && /lroc_color_2k/.test(await texUrl(p)) && !(await p.evaluate(() => document.getElementById('mg-lit').disabled))
      && re.test(t) && /could not be loaded/.test(t) && (await attr(p, '#mg-height', 'aria-pressed')) === 'false', { t, af: af.on });
    if (opt.grid404) await p.waitForTimeout(1500);   // let the texture finish, then it must have been dropped
    ok(`C failure (${name}): no object URL left behind`, (await live(p)) === 0, await p.evaluate(() => window.__u));
    await ctx.close(); }
  { // cancelled while the grid is still loading but after the texture arrived: the texture URL made by that attempt is revoked
    const { ctx, p } = await mk({ gridDelay: 3000 });
    await press(p, '#mg-height'); await p.waitForTimeout(1200); await press(p, '#mg-height'); await p.waitForTimeout(3000);
    const u = await p.evaluate(() => window.__u);
    ok('C cleanup: a cancelled attempt leaves no object URL (texture made, then revoked)', u.made.length >= 1 && (await live(p)) === 0 && (await hstate(p)).phase === 'off', u);
    await press(p, '#mg-height'); ok('C cleanup: a later attempt still succeeds', await waitPhase(p, 'on'));
    ok('C cleanup: success keeps exactly one object URL (the cached texture)', (await live(p)) === 1);
    await press(p, '#mg-height'); await waitPhase(p, 'off'); await press(p, '#mg-height'); await waitPhase(p, 'on');
    ok('C cleanup: later toggles make no new object URL', (await live(p)) === 1 && (await p.evaluate(() => window.__u.made.length)) === u.made.length + 1);
    await ctx.close(); }
  { // the grid fails at once while the texture is still on its way: the texture request is aborted, not left running
    const { ctx, p } = await mk({ grid404: true, texDelay: 4000 }); const failed = [];
    p.on('requestfailed', rq => { if (/ldem4-colour-R1\.png/.test(rq.url())) failed.push(rq.failure() && rq.failure().errorText); });
    await press(p, '#mg-height'); await waitPhase(p, 'off', 8000); await p.waitForTimeout(800);
    const t = await text(p, '#mg-height-read');
    ok('C first failure aborts the sibling: texture request cancelled, the grid\'s reason shown, nothing changed', failed.some(e => /ABORTED/i.test(e || '')) && /HTTP 404/.test(t) && /lroc_color_2k/.test(await texUrl(p)), { failed, t });
    await p.waitForTimeout(3800); ok('C first failure: no object URL afterwards', (await live(p)) === 0);
    await ctx.close(); }
  { const { ctx, p } = await mk({ gridRaw: true });   // a server that already removed the gzip layer
    await press(p, '#mg-height'); ok('C already-decompressed answer accepted on its own pin', await waitPhase(p, 'on'));
    { const g = await p.evaluate(() => MoonHeight.grid() ? Array.from(MoonHeight.grid().subarray(400000, 400100)) : []); ok('C already-decompressed values equal the build', g.length === 100 && g.every((v, k) => v === EXP[400000 + k])); }
    await ctx.close(); }
  { // LRO overlay untouched
    const { ctx, p } = await mk();
    await press(p, '#mg-lro'); await p.waitForTimeout(1500); const l0 = await p.evaluate(() => MoonGlobe.lro());
    await press(p, '#mg-height'); await waitPhase(p, 'on'); const l1 = await p.evaluate(() => MoonGlobe.lro());
    await press(p, '#mg-height'); await waitPhase(p, 'off'); const l2 = await p.evaluate(() => MoonGlobe.lro());
    ok('C LRO overlay state identical before, during and after height', JSON.stringify(l0) === JSON.stringify(l1) && JSON.stringify(l1) === JSON.stringify(l2), [l0, l1, l2]);
    await ctx.close(); }

  // ---- D rendering (measured; reported, and held to the baseline's order)
  { const { ctx, p } = await mk({ count: true });
    await p.waitForTimeout(2000); let a = await p.evaluate(() => window.__c.draw); await p.waitForTimeout(5000); const offDraws = (await p.evaluate(() => window.__c.draw)) - a;
    await press(p, '#mg-height'); await waitPhase(p, 'on'); await p.waitForTimeout(2000);
    a = await p.evaluate(() => window.__c.draw); await p.waitForTimeout(5000); const onDraws = (await p.evaluate(() => window.__c.draw)) - a;
    console.log(`MEASURED idle 5 s draw calls: height off ${offDraws}, height on ${onDraws}`);
    // the texture swap adds nothing; the grey withheld cap (one polygon, top only) adds about one small draw per frame
    ok('D height on: at most one extra draw per frame over off (≤ 2.25 × off + 20)', onDraws <= 2.25 * offDraws + 20, { offDraws, onDraws });
    await ctx.close(); }

  // ---- E keyboard and narrow layout
  { const { ctx, p } = await mk();
    await p.focus('#mg-height'); await p.keyboard.press('Enter'); ok('E keyboard: Enter switches height on', await waitPhase(p, 'on'));
    ok('E keyboard: focus stays on the button', await p.evaluate(() => document.activeElement && document.activeElement.id === 'mg-height'));
    await p.evaluate(() => MoonGlobe.point(5.4125, -158.6335)); await p.focus('#mg-height-centre'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const v = await attr(p, '#mg-height-read', 'data-value'), pov = await p.evaluate(() => MoonGlobe.view());
    ok('E keyboard: "Read height at centre" reads the centre cell', v !== null && +v === EXP[idx(pov.lat, pov.lng)], { v, pov });
    ok('E readout region is polite live', (await attr(p, '#mg-height-read', 'aria-live')) === 'polite');
    await ctx.close(); }
  for (const w of [360, 390, 721]) { const { ctx, p } = await mk({ w, h: 800 });
    await press(p, '#mg-height'); await waitPhase(p, 'on'); await p.waitForTimeout(300);
    const o = await p.evaluate(() => { const W = document.documentElement.clientWidth; let worst = 0, who = '';
      for (const el of document.querySelectorAll('#moon-globe *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 0.5 && r.right - W > worst) { worst = r.right - W; who = el.id || el.className || el.tagName; } }
      const tw = document.createTreeWalker(document.getElementById('moon-globe'), NodeFilter.SHOW_TEXT); let n; const rg = document.createRange();
      while ((n = tw.nextNode())) { rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.right > W + 0.5 && r.right - W > worst) { worst = r.right - W; who = 'text: ' + n.textContent.slice(0, 30); } }
      return { worst, who, sw: document.documentElement.scrollWidth, W }; });
    ok(`E narrow ${w} px: nothing past the right edge with height on`, o.worst === 0 && o.sw <= o.W, o);
    await ctx.close(); }

  await b.close();
  console.log(`moon-height-ui: ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
