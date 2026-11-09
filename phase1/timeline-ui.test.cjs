/*
 * Timeline page — one entry (Pliny, Letters 6.16). Proposal: docs/concepts/TIMELINE-ENTRY-BUILD-PROPOSAL.md rev 2, §7.
 *
 * Run: node phase1/timeline-ui.test.cjs [base-url]
 *   needs a static server on the repo (default http://127.0.0.1:8899). Hub, unpkg, GIBS and Google Fonts are aborted:
 *   this tests the Timeline page, its history/focus behaviour and the header tabs, not live data.
 * Breaks (each must make the suite fail): BREAK=no-focus-return|close-keeps-fragment|shortcut-fragment|no-inert|
 *   axis-79|inline-passage|script-only|no-aria-current|whole-card
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const ROOT = path.resolve(__dirname, '..');
const BREAK = process.env.BREAK || '';
const ID = 'e-pliny-ep-6-16';
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info === undefined ? '' : JSON.stringify(info)); } };

// ---------- deliberate breaks, served in place of the real files
const JS = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8');
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('break anchor missing: ' + a.slice(0, 60)); return s.replace(a, b); };
function brokenJs() {
  if (BREAK === 'no-focus-return') return must(JS, '(focusEl || pageHeading()).focus();', 'pageHeading().focus();');
  if (BREAK === 'close-keeps-fragment') return must(JS, "history.replaceState(null, '', location.pathname + location.search);   // clears the fragment", '');
  if (BREAK === 'shortcut-fragment') return must(JS, "history.pushState({ entry: id, x, opener: a.dataset.opener || 'title', k }, '', '#' + id);", "history.pushState({ entry: id, x, opener: a.dataset.opener || 'title', k }, '', '#' + id + (x ? '-' + x : ''));");
  if (BREAK === 'no-inert') return must(JS, 'others().forEach(n => { n.inert = phone; });', 'others().forEach(n => { n.inert = false; });');
  if (BREAK === 'whole-card') return JS + "\ndocument.querySelectorAll('.card').forEach(c => c.addEventListener('click', ev => { if (!ev.target.closest('a')) c.querySelector('.ctitle a').click(); }));";
  return null;
}
function brokenHtml() {
  if (BREAK === 'axis-79') return must(HTML, '<p class="note">Entries are placed at the precision their sources support. There are none yet.</p>',
    '<ul class="cards"><li class="card">Cloud reported over the Bay of Naples · 79 CE</li></ul>');
  if (BREAK === 'inline-passage') return must(HTML, '<p class="dline">24 August (Julian) · year unstated</p>', '<p class="dline">24 August (Julian) · year unstated</p><blockquote lang="la">nonum Kal. Septembres hora fere septima</blockquote>');
  if (BREAK === 'script-only') return HTML.replace(/<section id="entries"[\s\S]*?<\/section>\n  <!-- TIMELINE:END -->/, '<section id="entries" class="entries"></section>\n  <!-- TIMELINE:END -->');
  if (BREAK === 'no-aria-current') return must(HTML, '<a href="timeline.html" data-view="timeline" aria-current="page">', '<a href="timeline.html" data-view="timeline">');
  return null;
}
const BJ = brokenJs(), BH = brokenHtml();

async function ctx(b, o = {}) {
  const c = await b.newContext(o);
  await c.route(/fonts\.googleapis|workers\.dev|unpkg|gibs|jsdelivr|thelatinlibrary|doi\.org/, r => r.abort());
  if (BJ) await c.route(/timeline\.js/, r => r.fulfill({ contentType: 'application/javascript', body: BJ }));
  if (BH) await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: BH }));
  return c;
}
const W = { 1280: 860, 900: 860, 390: 844 };
const OPENERS = {
  title: `#card-${ID} .ctitle a`,
  julian: `#card-${ID} a.sc[data-x="conv"]`,
  debated: `#card-${ID} a.sc[data-x="debate"]`,
};
const XFOR = { title: null, julian: 'conv', debated: 'debate' };
const st = p => p.evaluate(id => {
  const d = document.getElementById('detail'), a = document.activeElement;
  const xp = s => { const b = document.querySelector(`#${id}-${s} .xbtn`); return b ? b.getAttribute('aria-expanded') : null; };
  return { open: !!d && !d.hidden, role: d && d.getAttribute('role'), modal: d && d.getAttribute('aria-modal'), hash: location.hash,
    state: history.state, active: a && (a.id || (a.dataset && a.dataset.opener) || a.className || a.tagName), activeOpener: a && a.dataset ? a.dataset.opener || null : null,
    conv: xp('conv'), debate: xp('debate'), mainInert: document.querySelector('main').inert, headerInert: document.querySelector('header').inert,
    locked: document.documentElement.classList.contains('locked'), sw: document.documentElement.scrollWidth, iw: innerWidth };
}, ID);

(async () => {
  const b = await chromium.launch();

  // ---------- 1. JavaScript off: everything is in the HTML
  {
    const c = await ctx(b, { javaScriptEnabled: false }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html');
    const m = await p.evaluate(id => {
      const t = s => (document.querySelector(s) || {}).textContent || '';
      const src = document.querySelector(`#${id} a.readsrc`);
      return { h2: t('#tl-heading'), shelf: t('#shelf-h'), card: t(`#card-${id} .dline`), entry: !!document.getElementById(id), heading: t(`#${id}-h`),
        src: src && src.getAttribute('href'), srcnote: [...document.querySelectorAll(`#${id} .srcnote`)].map(n => n.textContent).join(' '),
        convHref: (document.querySelector(`#card-${id} a.sc[data-x="conv"]`) || {}).getAttribute?.('href'), conv: t(`#${id}-conv`), debate: t(`#${id}-debate`),
        evidence: t(`#${id}-evidence`), visible: !!(document.getElementById(id) || {}).offsetParent, body: document.body.textContent };
    }, ID);
    ok('no-JS: page heading', m.h2.trim() === 'Timeline', m.h2);
    ok('no-JS: shelf heading with count (1)', /Dates without a year\s*\(1\)/.test(m.shelf), m.shelf);
    ok('no-JS: card date line verbatim', m.card.replace(/\s+/g, ' ').trim() === '24 August (Julian) · year unstated', m.card);
    ok('no-JS: entry pre-rendered and visible at its anchor', m.entry && m.visible);
    ok('no-JS: source link = Latin Library Book 6 page (no fragment)', m.src === 'https://www.thelatinlibrary.com/pliny.ep6.html', m.src);
    ok('no-JS: Letter 6.16 and §§4–5, §22 beside the link', /Letter 6\.16, §§4–5 and §22/.test(m.srcnote), m.srcnote);
    ok('no-JS: no jump promised', /does not jump to the letter/.test(m.srcnote));
    ok('no-JS: retrieval date and full hash', /9 Nov 2026, 14:00:36 UTC/.test(m.srcnote) && m.srcnote.includes('b59e819a2793d7e8a7ddfeb5ce716619acbb88390615ba2530e28d3aafcfe281'), m.srcnote);
    ok('no-JS: hash identifies the checked copy; live page can change', /identifies the copy we checked/.test(m.srcnote) && /live page can change/.test(m.srcnote));
    ok('no-JS: conversion in static HTML (1 September as day one)', /1 September as day one/.test(m.conv) && /our conversion of the checked page/.test(m.conv), m.conv);
    ok('no-JS: shortcut anchors to a plain section', m.convHref === `#${ID}-conv`, m.convHref);
    ok('no-JS: scholarly note with authors and DOI', /D’Auria, De Micco &amp;|D’Auria, De Micco & Di Pasquale/.test(m.debate) && m.debate.includes('10.5194/egusphere-egu21-16222') && /Not adjudicated by Mother Earth/.test(m.debate), m.debate);
    ok('no-JS: licence as reported by OpenAlex, publisher not verified', /as reported by OpenAlex/.test(m.debate) && /not yet verified/.test(m.debate));
    ok('no-JS: one historical account', /One historical account/.test(m.evidence));
    ok('no-JS: no inline Latin', !/\bKal(?:endas|\.)|Septembres|\bhora\b/i.test(m.body));
    await c.close();
  }

  // ---------- header tabs on every page
  {
    const c = await ctx(b); const p = await c.newPage();
    for (const [pg, want] of [['timeline.html', 'timeline'], ['index.html', 'earth'], ['sources.html', null]]) {
      await p.goto(BASE + '/' + pg).catch(() => {});
      const t = await p.evaluate(() => [...document.querySelectorAll('nav.tabs a')].map(a => [a.dataset.view, a.getAttribute('aria-current'), a.getAttribute('href')]));
      ok(`tabs: ${pg} has Earth now · Timeline`, t.length === 2 && t[0][2] === 'index.html' && t[1][2] === 'timeline.html', t);
      ok(`tabs: ${pg} aria-current`, want ? t.filter(x => x[1] === 'page').map(x => x[0]).join() === want : t.every(x => !x[1]), t);
      const menu = await p.evaluate(() => [...document.querySelectorAll('#menu-list a')].map(a => a.dataset.page).join());
      ok(`menu: ${pg} lists World View · Timeline · Sources`, menu === 'world,timeline,sources', menu);
    }
    await c.close();
  }

  // ---------- 2–3. openers × widths × close paths, Back, Forward
  for (const w of [1280, 900, 390]) {
    const phone = w <= 720;
    for (const [name, sel] of Object.entries(OPENERS)) {
      for (const how of ['close', 'esc', 'back']) {
        const tag = `${w} ${name} ${how}`;
        const c = await ctx(b, { viewport: { width: w, height: W[w] } }); const p = await c.newPage();
        await p.goto(BASE + '/timeline.html');
        await p.focus(sel); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
        let s = await st(p);
        ok(`${tag}: opens`, s.open, s);
        ok(`${tag}: one fragment`, s.hash === '#' + ID, s.hash);
        ok(`${tag}: expander in history state`, s.state && s.state.x === XFOR[name] && s.state.opener === name, s.state);
        ok(`${tag}: right expander open`, s.conv === String(XFOR[name] === 'conv') && s.debate === String(XFOR[name] === 'debate'), [s.conv, s.debate]);
        ok(`${tag}: focus on detail heading`, s.active === ID + '-h', s.active);
        ok(`${tag}: surface`, phone ? s.role === 'dialog' && s.modal === 'true' : s.role === 'region' && s.modal === null, [s.role, s.modal]);
        if (how === 'close') {   // the three items are one action each; Read the passage is a direct link
          const one = await p.evaluate(id => { const r = {}; for (const x of ['conv', 'debate']) { const btn = document.querySelector(`#${id}-${x} .xbtn`); const was = btn.getAttribute('aria-expanded'); btn.click(); r[x] = [was, btn.getAttribute('aria-expanded'), !document.getElementById(`${id}-${x}-b`).hidden]; }
            const a = document.querySelector(`#detail a.readsrc`); r.src = a && a.getAttribute('href'); r.srcVisible = !!(a && a.offsetParent); return r; }, ID);
          ok(`${tag}: How we converted = one action`, one.conv[1] !== one.conv[0], one.conv);
          ok(`${tag}: See the debate = one action`, one.debate[1] !== one.debate[0], one.debate);
          ok(`${tag}: Read the passage = one direct link, visible`, one.src === 'https://www.thelatinlibrary.com/pliny.ep6.html' && one.srcVisible, one);
        }
        if (phone && how === 'close') {   // modal sheet: inert background, scroll lock, focus trapped
          ok(`${tag}: background inert`, s.mainInert && s.headerInert, s);
          ok(`${tag}: scroll locked`, s.locked);
          let inside = true;
          for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); inside = inside && await p.evaluate(() => document.getElementById('detail').contains(document.activeElement)); }
          for (let i = 0; i < 6; i++) { await p.keyboard.press('Shift+Tab'); inside = inside && await p.evaluate(() => document.getElementById('detail').contains(document.activeElement)); }
          ok(`${tag}: Tab and Shift+Tab stay inside the sheet`, inside);
        }
        if (how === 'close') { if (phone) { await p.focus('#d-handle'); await p.keyboard.press('Enter'); } else await p.click('#d-close'); }
        if (how === 'esc') await p.keyboard.press('Escape');
        if (how === 'back') await p.goBack();
        await p.waitForTimeout(120);
        s = await st(p);
        ok(`${tag}: closed`, !s.open, s);
        ok(`${tag}: focus back on the exact opener`, s.activeOpener === name, s.active);
        ok(`${tag}: fragment cleared`, s.hash === '', s.hash);
        ok(`${tag}: inert and scroll lock removed`, !s.mainInert && !s.headerInert && !s.locked, s);
        if (how === 'back') {
          await p.goForward(); await p.waitForTimeout(120);
          s = await st(p);
          ok(`${tag}: Forward reopens with the stored expander`, s.open && s.conv === String(XFOR[name] === 'conv') && s.debate === String(XFOR[name] === 'debate'), s);
          ok(`${tag}: Forward focuses the detail heading`, s.active === ID + '-h', s.active);
          await p.keyboard.press('Escape'); await p.waitForTimeout(120);
          s = await st(p);
          ok(`${tag}: close after Forward returns focus to the opener`, !s.open && s.activeOpener === name, s.active);
        }
        await c.close();
      }
    }
  }

  // ---------- 4. direct link
  for (const w of [1280, 390]) {
    const c = await ctx(b, { viewport: { width: w, height: W[w] } }); const p = await c.newPage();
    await p.goto(`${BASE}/timeline.html#${ID}`); await p.waitForTimeout(120);
    let s = await st(p);
    ok(`direct ${w}: opens on load`, s.open, s);
    ok(`direct ${w}: focus on detail heading`, s.active === ID + '-h', s.active);
    ok(`direct ${w}: state marked direct`, s.state && s.state.direct === true, s.state);
    await p.click('#d-close'); await p.waitForTimeout(100);
    s = await st(p);
    ok(`direct ${w}: Close clears the fragment`, s.hash === '' && !s.open, s);
    ok(`direct ${w}: Close focuses the shelf card title`, s.activeOpener === 'title', s.active);
    // card not rendered → page heading
    await p.goto(`${BASE}/timeline.html#${ID}`); await p.waitForTimeout(100);
    await p.evaluate(id => { document.getElementById('card-' + id).style.display = 'none'; }, ID);
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    s = await st(p);
    ok(`direct ${w}: card not rendered → page heading`, s.active === 'tl-heading' && s.hash === '', s.active);
    // a shared no-JS section anchor folds into the one fragment
    await p.goto(`${BASE}/timeline.html#${ID}-debate`); await p.waitForTimeout(120);
    s = await st(p);
    ok(`direct ${w}: #…-debate folds into the one fragment with its expander`, s.open && s.hash === '#' + ID && s.debate === 'true', s);
    await c.close();
  }

  // ---------- 5. Back with a real prior history entry
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
    await p.goto(BASE + '/index.html').catch(() => {});
    await p.goto(`${BASE}/timeline.html#${ID}`); await p.waitForTimeout(120);
    ok('real history: direct link open', (await st(p)).open);
    await p.goBack().catch(() => {}); await p.waitForTimeout(200);
    ok('real history: Back after a direct link returns to the previous page', p.url().endsWith('/index.html'), p.url());
    await p.goto(BASE + '/index.html').catch(() => {});
    await p.goto(BASE + '/timeline.html');
    await p.click(OPENERS.title); await p.waitForTimeout(80);
    await p.goBack(); await p.waitForTimeout(150);
    ok('real history: first Back closes the panel and stays on the page', p.url().endsWith('/timeline.html') && !(await st(p)).open, p.url());
    await p.goBack().catch(() => {}); await p.waitForTimeout(200);
    ok('real history: second Back returns to the previous page', p.url().endsWith('/index.html'), p.url());
    await c.close();
  }

  // ---------- 7–8. placement and wording; 9. requests; whole card not a click target
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
    const reqs = []; p.on('request', r => reqs.push(r.url()));
    await p.goto(BASE + '/timeline.html');
    const m = await p.evaluate(id => {
      const dated = document.getElementById('dated');
      const all = (document.querySelector('main').textContent + ' ' + document.getElementById(id).textContent);
      const clone = document.querySelector('main').cloneNode(true); clone.querySelectorAll(`[id="${id}-debate"], code.hash`).forEach(n => n.remove());
      const outsideNote = clone.textContent;
      return { datedHead: document.getElementById('dated-h').textContent, datedCards: dated.querySelectorAll('.card,li').length, shelfCards: document.querySelectorAll('#shelf .card').length,
        card: document.getElementById('card-' + id).textContent, outside79: /\b79\b/.test(outsideNote), noteHas79: /\bAD 79\b/.test(document.getElementById(id + '-debate').textContent), all };
    }, ID);
    ok('placement: Dated entries (0), nothing on the axis', /\(0\)/.test(m.datedHead) && m.datedCards === 0, m);
    ok('placement: one card on the shelf', m.shelfCards === 1);
    ok('placement: no 79 outside the attributed note', !m.outside79 && m.noteHas79, m.card);
    for (const s of ['Misenum — as Pliny states (§4).', 'Bay of Naples — our present-day reference.', 'Our model: Roman hours divided daylight', 'Modern clock time: unset',
      'without saying which details are which (§22)', 'One historical account', 'Year: not stated by this source', 'Not adjudicated by Mother Earth.', 'The scholarly note is not counted as evidence'])
      ok(`wording: "${s}"`, m.all.includes(s));
    // interactions, then requests
    await p.click(`#card-${ID} .chip`); await p.waitForTimeout(80);
    ok('whole card is not one click target', !(await st(p)).open);
    await p.click(OPENERS.debated); await p.waitForTimeout(80); await p.click('#d-close'); await p.waitForTimeout(80);
    const bad = reqs.filter(u => !u.startsWith(BASE) && !/fonts\.googleapis/.test(u));
    ok('requests: only this site (and the font stylesheet)', bad.length === 0, bad);
    ok('requests: no fetch of data on the Timeline page', reqs.filter(u => u.startsWith(BASE)).every(u => /timeline\.(html|js)|style\.css|\/$/.test(u)), reqs);
    const p2 = await c.newPage(); const r2 = []; p2.on('request', r => r2.push(r.url()));
    await p2.goto(BASE + '/index.html').catch(() => {}); await p2.waitForTimeout(500);
    ok('globe page requests nothing from the Timeline', !r2.some(u => /timeline|thelatinlibrary|doi\.org/.test(u)), r2.filter(u => /timeline/.test(u)));
    await c.close();
  }

  // ---------- 10. layout: no horizontal page scroll, closed and open
  for (const w of [360, 390, 430, 721, 800, 1024, 1100, 1280]) {
    const c = await ctx(b, { viewport: { width: w, height: 860 } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html');
    let s = await st(p); ok(`layout ${w}: no page overflow (closed)`, s.sw <= s.iw, [s.sw, s.iw]);
    await p.click(OPENERS.title); await p.waitForTimeout(250);
    s = await st(p); ok(`layout ${w}: no page overflow (open)`, s.sw <= s.iw, [s.sw, s.iw]);
    const r = await p.evaluate(id => { const d = document.getElementById('detail').getBoundingClientRect(); const card = document.getElementById('card-' + id).getBoundingClientRect();
      return { dl: d.left, dr: d.right, dt: d.top, db: d.bottom, cr: card.right, cl: card.left, ih: innerHeight, iw: innerWidth }; }, ID);
    if (w > 720) ok(`layout ${w}: panel and card both fully visible, side by side`, r.dr <= r.iw + 0.5 && r.cr <= r.dl + 0.5 && r.cl >= 0, r);
    else ok(`layout ${w}: sheet at full height`, r.db >= r.ih - 0.5 && r.dt <= 16 && r.dl <= 0.5 && r.dr >= r.iw - 0.5, r);
    if (w === 1100 || w === 721) ok(`layout ${w}: tablet panel width min(420px, 50vw)`, Math.abs((r.dr - r.dl) - Math.min(420, w / 2)) < 1.5, r.dr - r.dl);
    await c.close();
  }

  // ---------- 12. accessibility tree (names, roles, states only)
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html');
    ok('a11y: shelf heading with count', await p.getByRole('heading', { name: /Dates without a year \(1\)/ }).count() === 1);
    ok('a11y: card title is a link with the entry name', await p.getByRole('link', { name: 'Cloud reported over the Bay of Naples, noticed at Misenum' }).count() === 1);
    ok('a11y: shortcuts named', await p.getByRole('link', { name: '24 August (Julian): how we converted' }).count() === 1 && await p.getByRole('link', { name: 'Date debated: see the scholarly note' }).count() === 1);
    await p.click(OPENERS.title); await p.waitForTimeout(80);
    ok('a11y: panel is a region named by the entry', await p.getByRole('region', { name: 'Cloud reported over the Bay of Naples, noticed at Misenum' }).count() === 1);
    ok('a11y: expanders are buttons with collapsed state', await p.getByRole('button', { name: /How we converted/, expanded: false }).count() === 1 && await p.getByRole('button', { name: /Scholarly note on the date/, expanded: false }).count() === 1);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(100);
    ok('a11y: on phone the sheet is a dialog named by the entry', await p.getByRole('dialog', { name: 'Cloud reported over the Bay of Naples, noticed at Misenum' }).count() === 1);
    ok('a11y: the handle is a named button', await p.getByRole('button', { name: 'Close', exact: true }).count() === 2);
    await c.close();
  }
  await b.close();

  // ---------- 11. generator
  try { execFileSync('python3', [path.join(ROOT, 'phase1/timeline/build_timeline.py'), '--check'], { stdio: 'pipe' }); ok('generator: timeline.html = generator output', true); }
  catch (e) { ok('generator: timeline.html = generator output', false, String(e.stdout)); }
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tl-')), 'timeline.html');
  fs.writeFileSync(tmp, HTML.replace('year unstated</p>', 'year unstated (edited)</p>'));
  let edited = false; try { execFileSync('python3', [path.join(ROOT, 'phase1/timeline/build_timeline.py'), '--check', '--page', tmp], { stdio: 'pipe' }); } catch { edited = true; }
  ok('generator: a hand-edited copy fails the check', edited);

  console.log(`timeline-ui: ${pass} pass, ${fail} fail${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
