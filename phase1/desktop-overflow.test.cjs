/*
 * Desktop header/page overflow (5 Nov 2026).
 * Cause on main: body.world is a grid with an implicit auto column, so the header's min-content
 * (nowrap title + nowrap promise + clock + menu) set the page width. With the real webfonts that is
 * 1,186.6 px, so every desktop width 1,101–1,186 overflowed — and body.world has overflow:hidden, so the
 * Menu button sat off-screen and the right column was clipped. With fallback fonts (webfonts blocked)
 * it was 1,287.6 px, which is the "8 px at 1280" seen in the container.
 * Fix: explicit minmax(0,1fr) column; the promise wraps to at most two lines instead of being nowrap.
 *
 * Run: node phase1/desktop-overflow.test.cjs [base-url]
 *   needs a static server on the repo (default 127.0.0.1:8899) and, in /home/claude/spike,
 *   @fontsource/ibm-plex-mono@5 + @fontsource/barlow-condensed@5 (the real faces, served in place of Google Fonts).
 * Hub requests are aborted: this tests layout only.
 */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info ? JSON.stringify(info) : ''); } };
(async () => {
  const b = await chromium.launch();
  for (const fonts of ['real', 'fallback']) for (const w of [721, 760, 761, 900, 901, 1101, 1139, 1140, 1186, 1199, 1200, 1279, 1280, 1365, 1366, 1440, 1920]) {   // both sides of 760/761, 900/901, 1199/1200, 1279/1280 and 1365/1366
    const tag = `${fonts} ${w}`;
    const p = await b.newPage({ viewport: { width: w, height: 860 } });
    await p.route(/fonts\.googleapis/, r => fonts === 'real' ? r.fulfill({ contentType: 'text/css', body: CSS }) : r.abort());
    await p.route(/workers\.dev|unpkg|gibs|jsdelivr/, r => r.abort());
    await p.goto(BASE + '/index.html').catch(() => {});
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const R = s => document.querySelector(s).getBoundingClientRect();
      const po = document.querySelector('.top .promise'), pr = po.querySelector('span') || po, mb = R('.menu>button'), utc = document.querySelector('.top .clock span');
      const hit = document.elementFromPoint(mb.left + mb.width / 2, mb.top + mb.height / 2);
      return { loaded: [...document.fonts].filter(f => f.status === 'loaded').length, sw: document.documentElement.scrollWidth, W: innerWidth,
        header: R('header.top').width, headerH: R('header.top').height, rightCol: R('.col.right').right, menuRight: mb.right, menuHit: !!hit && !!hit.closest('.menu'),
        promiseCut: pr.scrollHeight > pr.clientHeight + 1 || pr.scrollWidth > pr.clientWidth + 1, promiseLines: Math.round(pr.getBoundingClientRect().height / parseFloat(getComputedStyle(pr).lineHeight)),
        promiseText: pr.textContent.trim(), promiseShown: getComputedStyle(po).display !== 'none' && getComputedStyle(pr).display !== 'none', promiseFont: getComputedStyle(pr).fontSize,
        utcShown: getComputedStyle(utc).display !== 'none' && utc.getBoundingClientRect().width > 0 && utc.textContent.trim() === 'UTC', clockRight: R('.top .clock').right, menuLeft: mb.left };
    });
    ok(`${tag}: fonts as intended`, fonts === 'real' ? m.loaded >= 4 : m.loaded === 0, m);
    ok(`${tag}: no horizontal overflow`, m.sw <= m.W, m);
    ok(`${tag}: header and stage no wider than the window`, m.header <= m.W + 0.5 && m.rightCol <= m.W + 0.5, m);
    ok(`${tag}: Menu on screen and clickable`, m.menuRight <= m.W && m.menuHit, m);
    // Six tabs since tides-nav-rc (25 Nov 2026); the promise is now shown only where its two full lines fit (container query), checked
    // with both fonts by phase1/tides-nav.test.cjs. Five tabs (Animals added, 19 Nov 2026): below 1200 px the promise is hidden, never shrunk or cut; from 1200 px it is shown in full at 11 px. (With four tabs the line was 1140 px.)
    if (w < 1200) ok(`${tag}: promise hidden (too tight beside the tabs)`, !m.promiseShown, m);
    else { ok(`${tag}: promise ${fonts === 'real' ? 'shown in full' : 'whole or not shown'} (≤ 2 lines, nothing cut)`, (fonts === 'real' ? m.promiseShown : true) && (!m.promiseShown || (!m.promiseCut && m.promiseLines <= 2)), m);   // fallback fonts: shown only where two full lines fit
      ok(`${tag}: promise at 11 px`, m.promiseFont === '11px', m); }
    ok(`${tag}: clock keeps its UTC label, clear of the Menu button`, m.utcShown && m.clockRight <= m.menuLeft + 0.5, m);
    ok(`${tag}: header height unchanged (56 px)`, Math.abs(m.headerH - 56) < 0.5, m);
    ok(`${tag}: promise wording verbatim`, m.promiseText === 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.', m.promiseText);
    await p.close();
  }
  await b.close();
  console.log(`desktop-overflow: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
