/* Mother Earth — one kind of switch for every map layer (layer-switches-rc; Bare Earth proposal rev 2, stage B).
 * What it proves: every control that puts a layer on the globe is the same labelled switch (a button with role="switch",
 * aria-checked, a visible box and a text label); the six layers that used a pressed-button card header (earthquakes, fires,
 * ships, forest, buoys, microplastic) are switches now; a switch works by click and by keyboard; an off card is not dimmed at all (readings, times, warnings and links keep full contrast);
 * each switch is described by its card's short evidence line; every layer is off at load (Bare Earth, bare-earth-rc).
 * What it does NOT prove: anything drawn on the globe (the hub is routed to 404, so every layer fails safely).
 * Needs: python3 -m http.server 8899 --bind 127.0.0.1 running in the clone.
 * Run: node phase1/layer-switches-ui.test.cjs     Breaks: BREAK=pressed|no-role|dim-card|no-label|describe-reading */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8899', BREAK = process.env.BREAK || '';
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL ', name, info === undefined ? '' : JSON.stringify(info).slice(0, 500)); } };
const CARD = ['usgs', 'firms', 'ships', 'forest', 'drifters', 'plastic'];
const CORE = ['usgs', 'firms', 'ships', 'forest'];
// every control that draws a layer on the globe: [selector, on at load in this stage]
const ALL = [...CARD.map(k => [`#tgl-${k}`, false]),   // Bare Earth (bare-earth-rc): nothing is on at load
  ['#tgl-night', false], ['#tgl-oh', false], ['#tgl-dustrgb', false], ['#tgl-wind', false],
  ['#tgl-air', false], ['#tgl-airdots', false], ['#tgl-nl', false], ['#orb-tgls [data-g="payload"]', false], ['#orb-tgls [data-g="rocket_body"]', false], ['#orb-tgls [data-g="debris"]', false]];
const brk = (file, body) => {
  if (file === 'index.html') {
    if (BREAK === 'pressed') body = body.replace('id="tgl-ships" data-layer="ships" role="switch" aria-checked="false"', 'id="tgl-ships" data-layer="ships" aria-pressed="false"');
    if (BREAK === 'no-role') body = body.replace('id="tgl-forest" data-layer="forest" role="switch"', 'id="tgl-forest" data-layer="forest"');
    if (BREAK === 'no-label') body = body.replace('<span class="t">Fire detections — show on the globe</span>', '<span class="t"></span>');
  }
  if (file === 'style.css' && BREAK === 'dim-card') body += '\n.card.off{opacity:.5}\n';
  if (file === 'index.html' && BREAK === 'describe-reading') body = body.replace('aria-describedby="ev-usgs"', 'aria-describedby="o-usgs"');
  return body;
};
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 390, h: 844, tag: 'phone 390' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage(); page.setDefaultTimeout(3000);
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.route(/workers\.dev|unpkg\.com|gibs\.earthdata|fonts\.g/, r => r.fulfill({ status: 404, body: '' }));
    await page.route(/127\.0\.0\.1:8899\/(index\.html|style\.css)/, async r => { const f = /index\.html/.test(r.request().url()) ? 'index.html' : 'style.css';
      r.fulfill({ status: 200, contentType: f === 'index.html' ? 'text/html' : 'text/css', body: brk(f, fs.readFileSync(path.join(__dirname, '..', f), 'utf8')) }); });
    await page.goto(BASE + '/index.html'); await page.waitForTimeout(900);
    const t = vp.tag;
    const info = await page.evaluate(sels => sels.map(([sel]) => { const b = document.querySelector(sel); if (!b) return { sel, missing: true };
      const box = b.querySelector('.box'), lab = b.querySelector('.t');
      return { sel, tag: b.tagName, type: b.getAttribute('type'), role: b.getAttribute('role'), checked: b.getAttribute('aria-checked'), pressed: b.getAttribute('aria-pressed'), cls: b.className,
        box: !!box, boxHidden: box && box.getAttribute('aria-hidden'), label: lab ? lab.textContent.trim() : '', name: (b.getAttribute('aria-label') || b.textContent).trim() }; }), ALL);
    ok(`${t}: every map-layer control exists`, info.every(x => !x.missing), info.filter(x => x.missing).map(x => x.sel));
    ok(`${t}: every one is a <button type="button"> with role="switch" and aria-checked true or false`, info.every(x => x.tag === 'BUTTON' && x.type === 'button' && x.role === 'switch' && (x.checked === 'true' || x.checked === 'false')), info.filter(x => x.role !== 'switch' || !/^(true|false)$/.test(x.checked || '')).map(x => [x.sel, x.role, x.checked]));
    ok(`${t}: none carries aria-pressed (a switch is not a pressed button)`, info.every(x => x.pressed === null), info.filter(x => x.pressed !== null).map(x => x.sel));
    ok(`${t}: every one has the same look: class ovl-tgl, a box hidden from assistive technology, a text label`, info.every(x => /\bovl-tgl\b/.test(x.cls) && x.box && x.boxHidden === 'true' && x.label.length > 3), info.filter(x => !(/\bovl-tgl\b/.test(x.cls) && x.box && x.label.length > 3)).map(x => [x.sel, x.cls, x.label]));
    ok(`${t}: defaults: every map layer off at load (Bare Earth)`, info.every((x, i) => x.checked === String(ALL[i][1])), info.map(x => [x.sel, x.checked]));
    ok(`${t}: no layer control anywhere on the page still uses aria-pressed with data-layer`, await page.locator('[data-layer][aria-pressed]').count() === 0);
    for (const k of CARD) {
      const lab = await page.locator(`#tgl-${k} .t`).textContent(), name = await page.locator(`#card-${k} .head .name`).textContent();
      ok(`${t} ${k}: the label names the layer and says what the switch does`, / — show on the globe$/.test(lab) && lab.toLowerCase().startsWith(name.replace(/ — dated$/, '').toLowerCase().slice(0, 8)), [lab, name]);
      const d = await page.evaluate(k => { const b = document.getElementById('tgl-' + k), id = b.getAttribute('aria-describedby'), el = id && document.getElementById(id); return { id, cls: el && el.className, text: el ? el.textContent.replace(/\s+/g, ' ').trim() : null, inCard: !!el && el.closest('.card') === b.closest('.card') }; }, k);
      ok(`${t} ${k}: the switch is described by its own card's evidence line (short, starts with the evidence label), not by the changing reading`, d.id === 'ev-' + k && d.cls === 'evl' && d.inCard && /^Observed\s+\S/.test(d.text) && d.text.length <= 110, d);
      ok(`${t} ${k}: the card keeps its name and state word in a plain heading row, not inside the switch`, await page.locator(`#card-${k} .head #s-${k}`).count() === 1 && await page.locator(`#tgl-${k} #s-${k}`).count() === 0);
    }
    if (vp.tag === 'phone 390') { const open = page.locator('#sheet-toggle, #readings-toggle, .sheet-h'); if (await open.count()) await open.first().click().catch(() => { }); await page.waitForTimeout(300); }
    // click and keyboard, on a core layer and an optional one
    for (const k of ['usgs', 'drifters']) {
      const b = page.locator(`#tgl-${k}`), was = await b.getAttribute('aria-checked');
      await b.scrollIntoViewIfNeeded(); await b.click(); await page.waitForTimeout(150);
      const st1 = await page.evaluate(k => ({ c: document.getElementById('tgl-' + k).getAttribute('aria-checked'), off: document.getElementById('card-' + k).classList.contains('off'), on: window.ME.renderState ? null : null }), k);
      ok(`${t} ${k}: a click flips the switch and the card's off state together`, st1.c === String(was !== 'true') && st1.off === (st1.c === 'false'), st1);
      await b.focus(); await page.keyboard.press('Space'); await page.waitForTimeout(150);
      const c2 = await b.getAttribute('aria-checked');
      ok(`${t} ${k}: Space on the focused switch flips it back`, c2 === was, [was, c2]);
      await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      ok(`${t} ${k}: Enter flips it too`, (await b.getAttribute('aria-checked')) === String(was !== 'true'));
      if ((await b.getAttribute('aria-checked')) !== was) { await b.click(); await page.waitForTimeout(100); }
    }
    // an off card is dimmed; its switch is not
    await page.locator('#tgl-forest').scrollIntoViewIfNeeded();   // forest is off at load
    const dim = await page.evaluate(() => { const card = document.getElementById('card-forest'), o = el => { let v = 1; for (let e = el; e; e = e.parentElement) v *= parseFloat(getComputedStyle(e).opacity); return v; };
      return { off: card.classList.contains('off'), sw: o(document.getElementById('tgl-forest')), value: o(card.querySelector('.value')), head: o(card.querySelector('.head')), min: document.getElementById('tgl-forest').getBoundingClientRect().height }; });
    const parts = await page.evaluate(() => { const card = document.getElementById('card-forest'), o = el => { let v = 1; for (let e = el; e; e = e.parentElement) v *= parseFloat(getComputedStyle(e).opacity); return v; };
      return [...card.querySelectorAll('.head, .name, .state, .ovl-tgl, .evl, .value, .obs, .src, .cav, a, summary')].map(el => [el.className || el.tagName, o(el)]); });
    ok(`${t}: an off layer's card is not dimmed: heading, switch, evidence line, value, reading, source, caveat and links all at full opacity`, dim.off && dim.sw === 1 && dim.value === 1 && dim.head === 1 && parts.length >= 8 && parts.every(x => x[1] === 1), parts.filter(x => x[1] !== 1));
    ok(`${t}: off is still shown without dimming: the switch is unchecked and the card's dot is hollow`, await page.evaluate(() => { const c = document.getElementById('card-forest'), p = getComputedStyle(c.querySelector('.pip')); return document.getElementById('tgl-forest').getAttribute('aria-checked') === 'false' && (p.backgroundColor === 'rgba(0, 0, 0, 0)' || p.backgroundColor === 'transparent'); }));
    ok(`${t}: the switch is at least 44 px tall (touch target)`, dim.min >= 44, dim.min);
    ok(`${t}: no page errors`, errors.length === 0, errors.slice(0, 3));
    await ctx.close();
  }
  await browser.close();
  console.log(`\nlayer-switches-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite crashed: ' + String(e).slice(0, 300)); process.exit(1); });
