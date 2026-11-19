/* Mother Earth — Bare Earth at load, the first-view line and the Layers panel (bare-earth-rc; proposal rev 2, stage A).
 * What it proves, on the REAL index.html (read from disk here, so the core-on test server cannot change it): no map layer is on
 * at load; "Choose layers to explore." and a Layers button are visible at desktop and phone widths; the panel lists every
 * map-layer switch once, grouped; a row presses the layer's own switch and mirrors it; the line goes when anything is on and
 * comes back when everything is off; "Switch everything off" does that; Escape closes the panel and returns focus.
 * What it does NOT prove: that reading cards keep their numbers while a layer is off, or that nothing is drawn with real data
 * (the hub is routed to 404 here: see the review packet for the live-data check).
 * Section G (smoke-key-hint-rc, 18 Nov 2026): at 721–1100 px the first-view line is a plain row directly under the globe and covers
 * nothing (it sat over the credits: GPT's smoke of the live page); both sides of the 720/721 and 1100/1101 boundaries, line shown and hidden.
 * Run: node phase1/bare-earth-ui.test.cjs (any server on 8899 serving the repo)   Breaks: BREAK=start-on|hint-stays|no-mirror|row-direct|phone-hint|tablet-hint|narrow-desktop-hint */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8899', BREAK = process.env.BREAK || '', ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL ', name, info === undefined ? '' : JSON.stringify(info).slice(0, 500)); } };
const must = (body, a) => { if (!body.includes(a)) { console.log('FAIL  break target not found: ' + a.slice(0, 60)); process.exit(1); } return body; };
const serve = f => { let body = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (f === 'index.html' && BREAK === 'start-on') body = must(body, 'const START_ON = [];').replace('const START_ON = [];', "const START_ON = ['usgs'];");
  if (f === 'layers.js' && BREAK === 'hint-stays') body = must(body, 'if (hint && hint.hidden !== (n > 0)) hint.hidden = n > 0;').replace('if (hint && hint.hidden !== (n > 0)) hint.hidden = n > 0;', 'if (hint) hint.hidden = false;');
  if (f === 'layers.js' && BREAK === 'no-mirror') body = must(body, "if (r.getAttribute('aria-checked') !== String(c)) r.setAttribute('aria-checked', String(c));").replace("if (r.getAttribute('aria-checked') !== String(c)) r.setAttribute('aria-checked', String(c));", '');
  if (f === 'layers.js' && BREAK === 'row-direct') body = must(body, 't.click(); sync(); });').replace('t.click(); sync(); });', "r.setAttribute('aria-checked', 'true'); });");
  if (f === 'style.css' && BREAK === 'phone-hint') body = must(body, '.bare-hint{top:auto;bottom:calc(52% + 8px);').replace('.bare-hint{top:auto;bottom:calc(52% + 8px);', '.bare-hint{bottom:auto;top:118px;');
  if (f === 'style.css' && BREAK === 'narrow-desktop-hint') body = must(body, '  .bare-hint{top:64px}\n').replace('  .bare-hint{top:64px}\n', '');   // main: the centred line reaches the Layers button at 1101–1160 px
  if (f === 'style.css' && BREAK === 'tablet-hint') body = must(body, '.bare-hint{position:static;order:1;align-self:center;transform:none;margin:8px 0 0}').replace('.bare-hint{position:static;order:1;align-self:center;transform:none;margin:8px 0 0}', '');   // main's rule: absolute, 64 px from the bottom of the whole column
  return body; };
const SW = ['#tgl-usgs', '#tgl-firms', '#tgl-ships', '#tgl-forest', '#tgl-drifters', '#tgl-plastic', '#tgl-air', '#tgl-airdots', '#tgl-nl', '#tgl-dustrgb', '#tgl-oh', '#tgl-wind', '#tgl-night',
  '#orb-tgls [data-g="payload"]', '#orb-tgls [data-g="rocket_body"]', '#orb-tgls [data-g="debris"]', '#tgl-journey'];
(async () => {
  ok('index.html on disk: START_ON is empty (bare at load)', (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/const START_ON = \[\];/g) || []).length === 1);
  const browser = await chromium.launch();
  for (const vp of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 1000, h: 800, tag: 'tablet 1000' }, { w: 800, h: 1100, tag: 'tablet 800' }, { w: 390, h: 844, tag: 'phone 390' }, { w: 360, h: 640, tag: 'phone 360' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage(); page.setDefaultTimeout(3000);
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.route(/workers\.dev|unpkg\.com|gibs\.earthdata|fonts\.g/, r => r.fulfill({ status: 404, body: '' }));
    await page.route(/127\.0\.0\.1:8899\/(index\.html|layers\.js|style\.css)(\?.*)?$/, r => { const u = r.request().url(), f = /layers\.js/.test(u) ? 'layers.js' : /style\.css/.test(u) ? 'style.css' : 'index.html';
      r.fulfill({ status: 200, contentType: f === 'index.html' ? 'text/html' : f === 'style.css' ? 'text/css' : 'text/javascript', body: serve(f) }); });
    await page.goto(BASE + '/index.html'); await page.waitForTimeout(900);
    const t = vp.tag, S = () => page.evaluate(() => window.ME.layers.state());
    const sw = () => page.evaluate(sels => sels.map(s => { const b = document.querySelector(s); return b ? b.getAttribute('aria-checked') : 'missing'; }), SW);
    ok(`${t}: no map layer is on at load (all 17 switches unchecked)`, (await sw()).every(c => c === 'false'), await sw());
    ok(`${t}: the four core cards are in their off state at load`, await page.evaluate(() => ['usgs', 'firms', 'ships', 'forest'].every(k => document.getElementById('card-' + k).classList.contains('off'))));
    ok(`${t}: the key counts nothing drawn`, await page.evaluate(() => window.ME.keyState().drawn.length === 0));
    let s = await S();
    ok(`${t}: the Layers button reads "Layers · none on"`, /^Layers · none on$/.test(s.label) && s.n === 0, s.label);
    const vis = await page.evaluate(() => { const r = id => { const e = document.getElementById(id), b = e.getBoundingClientRect(), cs = getComputedStyle(e); return { hidden: e.hidden, x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, btm: b.bottom, shown: cs.display !== 'none' && cs.visibility !== 'hidden', text: e.textContent.replace(/\s+/g, ' ').trim() }; };
      const top = id => { const e = document.getElementById(id), b = e.getBoundingClientRect(); const at = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!at && (at === e || e.contains(at)); };
      return { globe: r('globe'), hint: r('bare-hint'), btn: r('layers-btn'), hb: r('layers-open-hint'), hintTop: top('layers-open-hint'), btnTop: top('layers-btn'), vw: innerWidth, vh: innerHeight }; });
    ok(`${t}: "Choose layers to explore." is shown, inside the viewport`, !vis.hint.hidden && vis.hint.shown && /^Choose layers to explore\. Layers$/.test(vis.hint.text) && vis.hint.x >= 0 && vis.hint.r <= vis.vw && vis.hint.y >= 0 && vis.hint.btm <= vis.vh, vis.hint);
    ok(`${t}: the Layers button is shown, inside the viewport, at least 44 px tall, and not covered`, vis.btn.shown && vis.btn.x >= 0 && vis.btn.r <= vis.vw && vis.btn.y >= 0 && vis.btn.btm <= vis.vh && vis.btn.h >= 44 && vis.btnTop, vis.btn);
    const clash = await page.evaluate(() => { const hit = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      const R = id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.hidden) return null; return e.getBoundingClientRect(); };
      const L = R('layers-btn'), H = R('bare-hint'); return ['imgdate', 'key-btn', 'persist', 'zoom-in', 'zoom-out'].filter(id => { const r = R(id); return r && r.width > 0 && ((L && hit(L, r)) || (H && hit(H, r))); }); });
    ok(`${t}: the Layers button and the first-view line do not sit over the imagery label, the Key button or the zoom buttons`, clash.length === 0, clash);
    const phone = vp.w <= 720;
    if (phone) {   // phone: the line sits below the sphere (which spans about 59% of the globe box height at the phone camera distance) and has no button of its own
      ok(`${t}: the first-view line sits below the globe, inside the globe box`, vis.hint.y >= vis.globe.y + vis.globe.h * 0.82 && vis.hint.btm <= vis.globe.btm, [vis.hint.y, vis.hint.btm, vis.globe.y, vis.globe.h]);
      ok(`${t}: the first-view line has no button of its own (the Layers button is the single way in)`, vis.hb.w === 0 && vis.hb.h === 0, vis.hb);
    } else ok(`${t}: the button in the first-view line is at least 44 px tall and not covered`, vis.hb.h >= 44 && vis.hintTop, vis.hb);
    ok(`${t}: the panel is closed at load`, s.open === false && await page.locator('#layers-panel').isHidden());
    await page.locator(phone ? '#layers-btn' : '#layers-open-hint').click(); await page.waitForTimeout(150); s = await S();
    ok(`${t}: the ${phone ? 'Layers button' : 'button in the line'} opens the panel`, s.open && await page.locator('#layers-panel').isVisible() && (await page.locator('#layers-btn').getAttribute('aria-expanded')) === 'true');
    ok(`${t}: the panel lists every map-layer switch once (17: the animal journey added 19 Nov 2026), each a role="switch" button, all unchecked`, s.rows.length === 17 && s.rows.every(r => r[1] === 'false') && await page.locator('#layers-list [role="switch"]').count() === 17 && new Set(await page.evaluate(() => window.ME.layers.rows.map(r => r[1]))).size === 17, s.rows.length);
    ok(`${t}: every row points at a switch that exists on the page`, await page.evaluate(() => window.ME.layers.rows.every(r => document.querySelector(r[1]) && document.querySelector(r[1]).getAttribute('role') === 'switch')));
    ok(`${t}: rows are grouped under Observed, Analysed and modelled, Computed`, (await page.locator('#layers-list .lp-g').allTextContents()).join('|') === 'Observed|Analysed and modelled|Computed');
    ok(`${t}: the panel says choices are not saved`, /starts bare each time/.test(await page.locator('#layers-note').textContent()) && /not saved/.test(await page.locator('#layers-note').textContent()));
    const box = await page.locator('#layers-panel').boundingBox();
    ok(`${t}: the panel is inside the viewport`, box && box.x >= 0 && box.x + box.width <= vp.w + 0.5 && box.y >= 0 && box.y + box.height <= vp.h + 0.5, box);
    ok(`${t}: focus moves into the panel when it opens`, await page.evaluate(() => document.getElementById('layers-list').contains(document.activeElement)));
    await page.locator('#layers-list [data-for="#tgl-usgs"]').click(); await page.waitForTimeout(200); s = await S();
    const real = await page.evaluate(() => ({ c: document.getElementById('tgl-usgs').getAttribute('aria-checked'), off: document.getElementById('card-usgs').classList.contains('off') }));
    ok(`${t}: a row presses the layer's own switch (Earthquakes on, its card no longer off)`, real.c === 'true' && real.off === false, real);
    ok(`${t}: the row mirrors the switch, the button counts 1 on, the first-view line is gone`, s.rows[0][1] === 'true' && s.n === 1 && /^Layers · 1 on$/.test(s.label) && s.hint === false && await page.locator('#bare-hint').isHidden(), [s.rows[0], s.label, s.hint]);
    await page.evaluate(() => document.getElementById('tgl-drifters').click()); await page.waitForTimeout(200); s = await S();
    ok(`${t}: a switch pressed on its own card shows in the panel too`, s.rows.find(r => r[0] === 'Drifting buoys')[1] === 'true' && s.n === 2, s.rows.filter(r => r[1] === 'true'));
    await page.locator('#layers-off').click(); await page.waitForTimeout(250); s = await S();
    ok(`${t}: "Switch everything off" leaves every switch off, and the first-view line returns`, (await sw()).every(c => c === 'false') && s.n === 0 && s.hint === true && /none on/.test(s.label) && s.rows.every(r => r[1] === 'false'), [await sw(), s.label]);
    await page.keyboard.press('Escape'); await page.waitForTimeout(150); s = await S();
    ok(`${t}: Escape closes the panel and returns focus to the Layers button`, s.open === false && await page.evaluate(() => document.activeElement === document.getElementById('layers-btn')) && (await page.locator('#layers-btn').getAttribute('aria-expanded')) === 'false');
    await page.locator('#layers-btn').click(); await page.waitForTimeout(150);
    ok(`${t}: the Layers button opens the panel as well`, (await S()).open === true);
    await page.locator('#layers-close').click(); await page.waitForTimeout(100);
    ok(`${t}: Close closes it`, (await S()).open === false);
    ok(`${t}: nothing was stored in the browser`, await page.evaluate(() => { try { return localStorage.length === 0 && sessionStorage.length === 0; } catch (e) { return true; } }));
    ok(`${t}: no page errors`, errors.length === 0, errors.slice(0, 3));
    await ctx.close();
  }
  // ===== G. the first-view line covers nothing at tablet widths, and takes no room when hidden
  for (const [w, h] of [[720, 800], [721, 800], [900, 800], [1024, 768], [1100, 800], [1101, 800], [1150, 800], [1279, 800], [1280, 800], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage(); page.setDefaultTimeout(3000);
    await page.route(/workers\.dev|unpkg\.com|gibs\.earthdata|fonts\.g/, r => r.fulfill({ status: 404, body: '' }));
    await page.route(/127\.0\.0\.1:8899\/(index\.html|layers\.js|style\.css)(\?.*)?$/, r => { const u = r.request().url(), f = /layers\.js/.test(u) ? 'layers.js' : /style\.css/.test(u) ? 'style.css' : 'index.html';
      r.fulfill({ status: 200, contentType: f === 'index.html' ? 'text/html' : f === 'style.css' ? 'text/css' : 'text/javascript', body: serve(f) }); });
    await page.goto(BASE + '/index.html'); await page.waitForTimeout(900);
    const t = `G ${w}×${h}`, tablet = w >= 721 && w <= 1100;
    const geo = () => page.evaluate(() => { const hit = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      const R = e => { if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.hidden) return null; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? { left: b.left, right: b.right, top: b.top, bottom: b.bottom } : null; };
      const H = R(document.getElementById('bare-hint')), els = { credits: document.querySelector('#credits'), legend: document.getElementById('legend'), imgdate: document.getElementById('imgdate'), 'layers-btn': document.getElementById('layers-btn') };
      const rects = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, R(e)]));
      return { hint: H, rects, over: H ? Object.keys(rects).filter(k => rects[k] && hit(H, rects[k])) : [], globe: R(document.getElementById('globe')), sw: document.documentElement.scrollWidth, vw: innerWidth }; });
    let g = await geo();
    ok(`${t}: the first-view line is shown`, !!g.hint, g);
    ok(`${t}: shown, it does not sit over the credits, the legend, the imagery label or the Layers button`, g.hint && g.over.length === 0, { over: g.over, hint: g.hint, credits: g.rects.credits });
    if (tablet) { ok(`${t}: the credits are on the page at this width (so the check above means something)`, !!g.rects.credits, g.rects);
      ok(`${t}: the line is a row directly under the globe and above the imagery label`, g.hint && g.globe && g.rects.imgdate && g.hint.top >= g.globe.bottom && g.hint.top - g.globe.bottom <= 12 && g.hint.bottom <= g.rects.imgdate.top, [g.globe, g.hint, g.rects.imgdate]); }
    ok(`${t}: no page-level horizontal overflow`, g.sw <= g.vw, [g.sw, g.vw]);
    const gap0 = g.globe && g.rects.imgdate ? g.rects.imgdate.top - g.globe.bottom : null;
    await page.evaluate(() => document.getElementById('tgl-usgs').click()); await page.waitForTimeout(250); g = await geo();
    ok(`${t}: with a layer on the line is hidden`, g.hint === null && await page.locator('#bare-hint').isHidden(), g.hint);
    if (tablet) ok(`${t}: hidden, it takes no room: the imagery label sits 8 px under the globe, closer than with the line shown`, g.globe && g.rects.imgdate && Math.abs(g.rects.imgdate.top - g.globe.bottom - 8) < 1 && gap0 > g.rects.imgdate.top - g.globe.bottom, [gap0, g.globe, g.rects.imgdate]);
    await page.evaluate(() => document.getElementById('tgl-usgs').click()); await page.waitForTimeout(250); g = await geo();
    ok(`${t}: everything off again: the line is back and still covers nothing`, g.hint && g.over.length === 0, { over: g.over });
    await ctx.close();
  }
  await browser.close();
  console.log(`\nbare-earth-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite crashed: ' + String(e).slice(0, 300)); process.exit(1); });
