/* Header with five tabs (Earth from Space added) and with six (the parked Animals branch adds one), on every page, with the real
 * fonts and with fallback fonts (Google Fonts blocked). The tab list is a parameter: "six" inserts an Animals tab before Moon.
 * Checks: no sideways page scroll; Menu on screen and clickable; the tab row fits its place, or scrolls inside itself with the
 * current tab fully in view; Earth from Space is second, named in full for assistive technology, shown short where tight;
 * World View's promise line is shown whole (at most two lines) or not at all; header height; the clock keeps its UTC label.
 * Run: node phase1/header-tabs.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899; fonts as desktop-overflow)
 * BREAK=no-scroll|no-short|no-fit|no-current|no-name  each weakens the page's CSS or script in the browser and must fail. */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899', BREAK = process.env.BREAK || '';
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
const CSS_BREAKS = { 'no-scroll': '.tabs{overflow:visible!important;flex:0 0 auto!important;min-width:auto!important}', 'no-short': '.tabs a .tfull{display:inline!important}.tabs a .tshort{display:none!important}', 'no-fit': '.top .promise.fit>span{display:-webkit-box!important}' };
if (BREAK && !(BREAK in CSS_BREAKS) && !['no-current', 'no-name'].includes(BREAK)) { console.log('FAIL unknown break ' + BREAK); process.exit(1); }
let pass = 0, fail = 0; const ok = (name, cond, info) => { if (cond) pass++; else { fail++; if (fail <= 25) console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 420) : ''); } };
const ALL = [320, 360, 390, 420, 480, 600, 720, 721, 800, 899, 900, 1024, 1139, 1140, 1279, 1280, 1366, 1440, 1600, 1920], SOME = [320, 390, 720, 721, 900, 1280];
const PAGES = [['index.html', 'earth', ALL], ['space.html', 'space', ALL], ['timeline.html', 'timeline', SOME], ['moon.html', 'moon', SOME], ['sun.html', 'sun', SOME], ['sources.html', null, SOME]];
(async () => {
  const b = await chromium.launch();
  for (const fonts of ['real', 'fallback']) for (const tabs of ['five', 'six']) for (const [file, view, widths] of PAGES) for (const w of widths) {
    const tag = `${fonts} ${tabs} ${file} ${w}`; const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.route(/fonts\.googleapis/, r => fonts === 'real' ? r.fulfill({ contentType: 'text/css', body: CSS }) : r.abort());
    await p.route(/workers\.dev|unpkg|gibs|jsdelivr|eumetsat/, r => r.abort());
    if (BREAK === 'no-current') await p.route(/\/(craft|space|timeline)\.js/, async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace("if (t && t.scrollWidth > t.clientWidth) t.scrollLeft +=", "if (false) t.scrollLeft +=") }); });
    await p.addInitScript(o => {
      // the sixth tab is put in as the markup is parsed, before any page script runs, as it would be if it were in the file
      if (o.six) { const mo = new MutationObserver(() => { const m = document.querySelector('.tabs [data-view=moon]'); if (!m) return; mo.disconnect(); const a = document.createElement('a'); a.href = 'animals.html'; a.dataset.view = 'animals'; a.textContent = 'Animals'; m.parentElement.insertBefore(a, m); }); mo.observe(document, { childList: true, subtree: true }); }
      document.addEventListener('DOMContentLoaded', () => {
      if (o.css) { const s = document.createElement('style'); s.textContent = o.css; document.head.appendChild(s); }
      if (o.noName) document.querySelector('.tabs [data-view=space]').removeAttribute('aria-label'); }); }, { six: tabs === 'six', css: CSS_BREAKS[BREAK] || '', noName: BREAK === 'no-name' });
    await p.goto(`${BASE}/${file}`).catch(() => {}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(350);
    const m = await p.evaluate(() => { const R = e => e.getBoundingClientRect(), q = s => document.querySelector(s), t = q('.tabs'), tr = R(t), mb = R(q('.menu>button')), as = [...t.querySelectorAll('a')], cur = t.querySelector('[aria-current="page"]');
      const hit = document.elementFromPoint(Math.min(innerWidth - 1, mb.left + mb.width / 2), mb.top + mb.height / 2), sp = t.querySelector('[data-view=space]'), vis = e => !!e && getComputedStyle(e).display !== 'none' && R(e).width > 0;
      const pr = q('.top .promise'), ps = pr.querySelector('span') || pr, pShown = getComputedStyle(pr).display !== 'none' && vis(ps), utc = q('.top .clock span'), lh = parseFloat(getComputedStyle(ps).lineHeight);
      return { loaded: [...document.fonts].filter(f => f.status === 'loaded').length, sw: document.documentElement.scrollWidth, W: innerWidth, menuRight: mb.right, menuHit: !!hit && !!hit.closest('.menu'), headerH: R(q('header.top')).height,
        n: as.length, second: as[1] && as[1].dataset.view, name: sp.getAttribute('aria-label') || sp.textContent.trim(), label: [...sp.querySelectorAll('span')].filter(vis).map(e => e.textContent).join('|'), href: sp.getAttribute('href'),
        fits: t.scrollWidth <= t.clientWidth + 1, tabsRight: tr.right, tabsLeft: tr.left, curIn: cur ? R(cur).left >= tr.left - 1 && R(cur).right <= tr.right + 1 : null, curView: cur ? cur.dataset.view : null, tabH: Math.min(...as.map(a => R(a).height)), clipped: as.filter(a => a.scrollWidth > a.clientWidth + 1).length,
        pShown, pCut: pShown && (ps.scrollHeight > ps.clientHeight + 1 || ps.scrollWidth > ps.clientWidth + 1), pLines: pShown ? Math.round(R(ps).height / lh) : 0, utc: vis(utc) && utc.textContent.trim() === 'UTC', clockRight: R(q('.top .clock')).right, menuLeft: mb.left,
        menuItems: [...document.querySelectorAll('#menu-list a')].map(a => a.getAttribute('href')) }; });
    ok(`${tag}: fonts as intended`, fonts === 'real' ? m.loaded >= 3 : m.loaded === 0, m.loaded);
    ok(`${tag}: no sideways page scroll`, m.sw <= m.W, [m.sw, m.W]);
    ok(`${tag}: Menu on screen and clickable`, m.menuRight <= m.W + 0.5 && m.menuHit, [m.menuRight, m.menuHit]);
    ok(`${tag}: ${tabs} tabs, Earth from Space second, linked to space.html`, m.n === (tabs === 'six' ? 6 : 5) && m.second === 'space' && m.href === 'space.html', [m.n, m.second]);
    ok(`${tag}: its name is "Earth from Space" whatever the label shows`, m.name === 'Earth from Space', m.name);
    ok(`${tag}: label is "${w >= 900 ? 'Earth from Space' : 'From Space'}"`, m.label === (w >= 900 ? 'Earth from Space' : 'From Space'), m.label);
    ok(`${tag}: the tab row stays inside the header, and no tab’s own text is clipped`, m.tabsLeft >= -0.5 && m.tabsRight <= m.W + 0.5 && m.clipped === 0, [m.tabsLeft, m.tabsRight, m.clipped]);
    if (fonts === 'real') ok(`${tag}: with the real fonts every tab fits without scrolling`, m.fits, m);
    if (view) ok(`${tag}: the current tab (${view}) is fully in view`, m.curView === view && m.curIn === true, [m.curView, m.curIn, m.fits]);
    ok(`${tag}: tabs keep their height`, m.tabH >= (w <= 720 ? 44 : 36) - 0.5, m.tabH);
    ok(`${tag}: header height`, Math.abs(m.headerH - (w <= 720 ? 94 : 56)) < 0.6, m.headerH);
    ok(`${tag}: Menu lists Earth from Space second`, m.menuItems[1] === 'space.html' && m.menuItems.length === 6, m.menuItems);
    if (file === 'index.html') { ok(`${tag}: promise is whole (at most two lines) or absent, never cut`, !m.pShown || (!m.pCut && m.pLines <= 2), [m.pShown, m.pCut, m.pLines]);
      if (w < 1140) ok(`${tag}: promise not shown below 1140 px`, !m.pShown, m.pShown);
      else if (fonts === 'real') ok(`${tag}: with the real fonts the promise is shown from 1140 px, with five tabs and with six`, m.pShown, m); }
    if (w > 720) ok(`${tag}: clock keeps its UTC label, clear of the Menu`, m.utc && m.clockRight <= m.menuLeft + 0.5, [m.utc, m.clockRight, m.menuLeft]);
    await p.close();
  }
  await b.close(); console.log(`header-tabs${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
