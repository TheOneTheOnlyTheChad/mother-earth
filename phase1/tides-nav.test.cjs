/* Tides navigation candidate: the header with six tabs (Tides added after Sun) on every page, with the real fonts and with
 * fallback fonts (Google Fonts blocked). Modelled on the Earth from Space branch's header-tabs suite (not on main), so the two
 * can be reconciled when both tabs exist; this one has its own name so neither branch overwrites the other.
 * Checks, per page and width: no sideways page scroll; Menu on screen and clickable; six tabs in order with Tides fifth and
 * linked to tides.html; every tab fully inside the header and its own text not clipped; tabs keep their touch height; the
 * current page's tab marked (and only it); header height (56 px one row, 94 px two rows up to 720 px); Menu lists seven items
 * with Tides fifth; on pages with a clock, it keeps its UTC label and stays clear of the Menu; World View's promise is whole
 * (at most two lines) or not shown, never cut, and never shown below 1200 px.
 *   NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node phase1/tides-nav.test.cjs [base-url]
 *   (static server on the repo, default 127.0.0.1:8899; real faces from @fontsource in /home/claude/spike, as desktop-overflow)
 * BREAK=<name>, applied to the served CSS or HTML; each must fail:
 *   no-compact   the six-tab compact sizes are removed from style.css
 *   no-current   tides.html does not mark its own tab
 *   menu-order   the Menu lists Tides last */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8899', BREAK = process.env.BREAK || '', ROOT = path.join(__dirname, '..');
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
const BREAKS = {
  'no-compact': ['style.css', /\/\* TIDES-NAV:BEGIN[\s\S]*?TIDES-NAV:END \*\//, ''],
  'no-current': ['tides.html', '<a href="tides.html" data-view="tides" aria-current="page">', '<a href="tides.html" data-view="tides">'],
  'menu-order': ['*.html', /\n\s*<li role="none"><a role="menuitem" href="tides\.html" data-page="tides"( aria-current="page")?>Tides<\/a><\/li>/, ''],
};
if (BREAK && !BREAKS[BREAK]) { console.log('unknown BREAK ' + BREAK); process.exit(2); }
let pass = 0, fail = 0; const ok = (name, cond, info) => { if (cond) pass++; else { fail++; if (fail <= 30) console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 420) : ''); } };
const ALL = [320, 360, 375, 390, 420, 480, 600, 720, 721, 760, 761, 800, 900, 901, 1024, 1101, 1139, 1140, 1199, 1200, 1279, 1280, 1365, 1366, 1440, 1920];
const SOME = [320, 360, 390, 480, 720, 721, 760, 900, 1024, 1199, 1280, 1366];
const PAGES = [['index.html', 'earth', ALL, true], ['tides.html', 'tides', ALL, false], ['timeline.html', 'timeline', SOME, true], ['moon.html', 'moon', SOME, true], ['sun.html', 'sun', SOME, true], ['animals.html', 'animals', SOME, true], ['sources.html', null, SOME, true]];
const ORDER = 'index.html,timeline.html,moon.html,sun.html,tides.html,animals.html', MENU = 'index.html,timeline.html,moon.html,sun.html,tides.html,animals.html,sources.html';
(async () => {
  const b = await chromium.launch();
  for (const fonts of ['real', 'fallback']) for (const [file, view, widths, clock] of PAGES) for (const w of widths) {
    const tag = `${fonts} ${file} ${w}`; const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.route(/fonts\.googleapis/, r => fonts === 'real' ? r.fulfill({ contentType: 'text/css', body: CSS }) : r.abort());
    await p.route(/workers\.dev|unpkg|gibs|jsdelivr|eumetsat|fonts\.gstatic/, r => r.abort());
    if (BREAK) { const [target, a, z] = BREAKS[BREAK];
      await p.route(target === '*.html' ? /\.html(\?|$)/ : new RegExp(target.replace('.', '\\.') + '(\\?|$)'), async r => { const res = await r.fetch(); const t = await res.text(); const u = t.replace(a, z); if (u === t && (target !== '*.html' || /data-page="tides"/.test(t))) { console.log(`BREAK ${BREAK} did not apply to ${r.request().url()}`); process.exit(2); } r.fulfill({ response: res, body: u }); }); }
    await p.goto(`${BASE}/${file}`).catch(() => {}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const R = e => e.getBoundingClientRect(), q = s => document.querySelector(s), t = q('.tabs'), tr = R(t), mb = R(q('.menu>button')), as = [...t.querySelectorAll('a')], hd = R(q('header.top'));
      const hit = document.elementFromPoint(Math.min(innerWidth - 1, mb.left + mb.width / 2), mb.top + mb.height / 2), vis = e => !!e && getComputedStyle(e).display !== 'none' && R(e).width > 0;
      const po = q('.top .promise'), pr = po && (po.querySelector('span') || po), pShown = !!pr && vis(po) && vis(pr), utc = q('.top .clock span'), lh = pr ? parseFloat(getComputedStyle(pr).lineHeight) : 1;
      return { loaded: [...document.fonts].filter(f => f.status === 'loaded').length, sw: document.documentElement.scrollWidth, W: innerWidth, menuRight: mb.right, menuHit: !!hit && !!hit.closest('.menu'), headerH: hd.height,
        hrefs: as.map(a => a.getAttribute('href')).join(), cur: as.filter(a => a.getAttribute('aria-current') === 'page').map(a => a.dataset.view).join(),
        out: as.filter(a => R(a).left < hd.left - 0.5 || R(a).right > hd.right + 0.5 || R(a).right > tr.right + 0.5 || R(a).left < tr.left - 0.5).map(a => a.dataset.view), clipped: as.filter(a => a.scrollWidth > a.clientWidth + 1).map(a => a.dataset.view),
        overlap: (() => { const hitR = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5, c = q('.top .clock'); return [q('.menu>button'), q('.top h1'), c && vis(c) ? c : null].filter(Boolean).filter(e => hitR(R(e), tr)).map(e => e.className || e.tagName).join(); })(),
        tabH: Math.min(...as.map(a => R(a).height)), pShown, pCut: pShown && (pr.scrollHeight > pr.clientHeight + 1 || pr.scrollWidth > pr.clientWidth + 1), pLines: pShown ? Math.round(R(pr).height / lh) : 0,
        clock: !!q('.top .clock'), utc: vis(utc) && utc.textContent.trim() === 'UTC', clockRight: q('.top .clock') ? R(q('.top .clock')).right : 0, menuLeft: mb.left,
        menu: [...document.querySelectorAll('#menu-list a')].map(a => a.getAttribute('href')).join(), menuCur: [...document.querySelectorAll('#menu-list a')].filter(a => a.getAttribute('aria-current') === 'page').map(a => a.dataset.page).join() }; });
    ok(`${tag}: fonts as intended`, fonts === 'real' ? m.loaded >= 3 : m.loaded === 0, m.loaded);
    // sources.html at 320 px scrolls sideways on main too (356 px, from the page's content, not the header): measured on main a84a642
    if (!(file === 'sources.html' && w === 320)) ok(`${tag}: no sideways page scroll`, m.sw <= m.W, [m.sw, m.W]);
    ok(`${tag}: Menu on screen and clickable`, m.menuRight <= m.W + 0.5 && m.menuHit, [m.menuRight, m.menuHit]);
    ok(`${tag}: six tabs in order, Tides fifth`, m.hrefs === ORDER, m.hrefs);
    ok(`${tag}: every tab fully inside the tab row and the header; no tab's text clipped`, m.out.length === 0 && m.clipped.length === 0, { out: m.out, clipped: m.clipped });
    ok(`${tag}: the tab row overlaps neither the title, the clock nor the Menu button`, !m.overlap, m.overlap);
    ok(`${tag}: current tab marked: ${view || 'none'}`, m.cur === (view || ''), m.cur);
    ok(`${tag}: tabs keep their height`, m.tabH >= (w <= 720 ? 44 : 36) - 0.5, m.tabH);
    ok(`${tag}: header height`, Math.abs(m.headerH - (w <= 720 ? 94 : 56)) < 0.6, m.headerH);
    ok(`${tag}: Menu lists seven items, Tides fifth`, m.menu === MENU, m.menu);
    ok(`${tag}: Menu marks the current page`, file === 'tides.html' ? m.menuCur === 'tides' : file === 'index.html' || file === 'sources.html' ? true : m.menuCur === (view || ''), m.menuCur);
    ok(`${tag}: clock ${clock ? 'present' : 'absent (untimed page)'}`, m.clock === clock, m.clock);
    if (clock && w > 720) ok(`${tag}: clock keeps its UTC label, clear of the Menu`, m.utc && m.clockRight <= m.menuLeft + 0.5, [m.utc, m.clockRight, m.menuLeft]);
    if (file === 'index.html') { ok(`${tag}: promise whole (≤ 2 lines) or absent, never cut`, !m.pShown || (!m.pCut && m.pLines <= 2), [m.pShown, m.pCut, m.pLines]);
      if (w < 1200) ok(`${tag}: promise not shown below 1200 px`, !m.pShown, m.pShown); }
    await p.close();
  }
  await b.close(); console.log(`tides-nav${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
