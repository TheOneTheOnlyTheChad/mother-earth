/* Layout at in-between widths — PREVIEW (15 Nov 2026, branch widths-preview-rc; docs/concepts/INTERMEDIATE-WIDTHS-PROPOSAL.md
 * rev 2, §6 governing).
 *   A  721–1100 px: header and globe stay in view; every layer switch can be reached, used, and its result seen on the globe
 *      without scrolling back; a control focused by keyboard is never under the pinned globe; a swipe on the cards scrolls the page.
 *   D  1101–1279 px: the credits move to the foot of the right-hand column; the globe gets that height back; exactly one
 *      credits block is visible at every width, text unchanged.
 * Real page with the real fonts; hub answers are fixtures. "Main" = index.html and style.css from `git show main:`, served to a
 * second context, so every before/after number is measured in the same run.
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules:/home/claude/node_modules node --no-warnings phase1/widths-preview-ui.test.cjs
 * OUT=<dir> also writes before/after screenshots there.  BREAK=no-sticky | no-scroll-padding | both-credits | no-move | header-scrolls | short-screens   each must fail. */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const FONTS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
const BREAK = process.env.BREAK || '', OUT = process.env.OUT || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const note = s => console.log('NOTE  ' + s);
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 14 min'); process.exit(1); }, 14 * 60e3);
const git = f => cp.execSync(`git show main:${f}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();
const FILES = { branch: { index: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), css: fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8') }, main: { index: git('index.html'), css: git('style.css') } };
{ const rep = (k, a, b) => { const before = FILES.branch[k]; FILES.branch[k] = FILES.branch[k].split(a).join(b); if (FILES.branch[k] === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'no-sticky') rep('css', 'body.world #globe{position:sticky;top:var(--header);', 'body.world #globe{position:relative;');
  if (BREAK === 'no-scroll-padding') rep('css', 'scroll-padding-top:calc(var(--header) + var(--gh) + 12px)', 'scroll-padding-top:0');
  if (BREAK === 'both-credits') rep('css', 'body.world .centre>.credits{display:none}', '');
  if (BREAK === 'no-move') rep('index', "document.querySelector('#sheet-scroll .col.right').append(c);", "$('sheet-scroll').append(c);");
  if (BREAK === 'short-screens') rep('css', '@media (min-width:721px) and (max-width:1100px) and (min-height:660px){', '@media (min-width:721px) and (max-width:1100px){');
  if (BREAK === 'header-scrolls') rep('css', 'body.world .top{position:sticky;top:0;z-index:40;', 'body.world .top{'); }
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const iso = ms => new Date(Date.now() - ms).toISOString(), GOOD = iso(3 * 3600e3), NOW = iso(60e3);
const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
const mk = (layer, fields, recs, extra = {}) => { const cells = {}; const a = fields.indexOf('lat'), b = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[a], r[b]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; } return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra }), cells: env0(layer, { cells, ...extra }) }; };
const L = {
  usgs: mk('usgs', ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', ''], ['q2', 35.6, 139.7, 30, 4.8, 'mb', GOOD, 'M 4.8 - Japan', '']], { source_generated_at: NOW, source_age_s: 40, stale_after_s: 900 }),
  firms: mk('firms', ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], [[-33.5, 18.9, GOOD, 'n', 5.8, 'N20', 'D'], [-12.3, 30.2, GOOD, 'h', 41.2, 'N20', 'D']], { scope: 'world', raw_bytes: 5000, stale_after_s: 2400 }),
  ships: mk('ships', ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'], [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', GOOD, NOW]], { window_s: 60, class_a: 1, class_b: 0, socket_connected_s: 60, collected_by: 'mac' }),
  drifters: mk('drifters', ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], [['1301', -34.2, 17.1, GOOD, 16.4, 'DRIFTING BUOYS (GENERIC)', 'ZA'], ['1302', -10.1, -20.3, GOOD, 25.1, 'DRIFTING BUOYS (GENERIC)', 'US']], { stale_after_s: 14400 }),
  plastic: mk('plastic', ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'], [['OE-1', 43.2, 7.4, '2023-06-02', 0.41, 'reproduced', null, 'manta', 0.33, 0]], { stale_after_s: 259200, window_start: '2011-05-01', window_end: '2024-10-23' }),
};
const FOREST = env0('forest', { cells: { '22_46': { count: 12, confidence: { nominal: 9, high: 3, highest: 0 }, since: '2026-11-08', queried_at: NOW, version: 'v1', coverage: cov } }, sweep: { answered: 559, cells_total: 559, oldest_queried_at: GOOD } });
const SWITCHES = ['usgs', 'firms', 'ships', 'forest', 'drifters', 'plastic'];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (which, w, h, opt = {}) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: !!opt.touch });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: FONTS }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: FILES[which].index }));
    await ctx.route(BASE + '/style.css*', r => r.fulfill({ status: 200, contentType: 'text/css', body: FILES[which].css }));
    await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p); if (m && L[m[2]]) return j(m[1] === 'cells' ? L[m[2]].cells : L[m[2]].snap);
      if (m && m[2] === 'forest') return j(FOREST);
      if (m) return j(env0(m[2], { cells: {}, index: null, record_fields: [], records: [] }));
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } }); route.fulfill({ status: 404, body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ['usgs', 'ships', 'firms'].every(k => ME.pairState(k)[k].usable) && ME.renderState && ME.renderState(), null, { timeout: 40000 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
    return { ctx, page, perr };
  };
  const shot = async (page, name) => { if (OUT) { fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, name + '.png') }); } };
  // geometry of the things that matter, in viewport coordinates
  const geo = page => page.evaluate(() => { const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height), w: Math.round(b.width) }; };
    const q = s => document.querySelector(s), shown = e => !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0;
    const cr = [...document.querySelectorAll('.credits')];
    return { vw: innerWidth, vh: innerHeight, scrollY: Math.round(scrollY), docW: document.documentElement.scrollWidth, header: r(q('.top')), globe: r(q('#globe')), legend: r(q('#legend')), colL: r(q('.col.left')), colR: r(q('.col.right')),
      credits: cr.map(e => ({ id: e.id || 'copy', shown: shown(e), rect: r(e), text: e.textContent.replace(/\s+/g, ' ').trim(), inRight: !!e.closest('.col.right') })) }; });
  const visGlobe = g => Math.max(0, Math.min(g.globe.bottom, g.vh) - Math.max(g.globe.top, 0));

  // =========================================================== A. 721–1100 px
  for (const [w, h] of [[768, 1024], [820, 1180], [1024, 768], [1100, 800]]) {
    const tag = `A ${w}×${h}`;
    const M = await open('main', w, h), mg = await geo(M.page); await shot(M.page, `before-${w}x${h}-top`);
    await M.page.evaluate(() => document.querySelector('button.tgl[data-layer="drifters"]').scrollIntoView({ block: 'center' })); await M.page.waitForTimeout(200); const mg2 = await geo(M.page); await shot(M.page, `before-${w}x${h}-at-buoys-switch`); await M.ctx.close();
    const { ctx, page, perr } = await open('branch', w, h); const g0 = await geo(page); await shot(page, `after-${w}x${h}-top`);
    note(`${tag}: globe ${mg.globe.h} px on main → ${g0.globe.h} px pinned; room below header and globe for the page: ${g0.vh - g0.header.h - g0.globe.h} px (main: globe scrolls away; ${visGlobe(mg2)} px of it on screen at the buoys switch)`);
    ok(`${tag}: at scroll 0 the globe sits directly under the header`, g0.header.top === 0 && Math.abs(g0.globe.top - g0.header.bottom) <= 1, g0);
    ok(`${tag}: pinned globe is at least 300 px tall and leaves at least 300 px for the page beneath`, g0.globe.h >= 300 && g0.vh - g0.globe.bottom >= 300, { globe: g0.globe.h, below: g0.vh - g0.globe.bottom });
    ok(`${tag}: no sideways scroll`, g0.docW <= g0.vw, [g0.docW, g0.vw]);
    ok(`${tag}: exactly one credits block is shown, with main's text`, g0.credits.filter(c => c.shown).length === 1 && g0.credits.find(c => c.shown).text === mg.credits.find(c => c.shown).text, g0.credits.map(c => [c.id, c.shown]));
    let shift = 0; const innerH = h;
    // every switch: reach it, use it with a real click, see the result drawn, all with the globe on screen
    for (const k of SWITCHES) {
      const before = await page.evaluate(k => { const b = document.querySelector(`button.tgl[data-layer="${k}"]`); b.scrollIntoView({ block: 'nearest' }); return { pressed: b.getAttribute('aria-pressed'), drawn: ME.legendState ? JSON.stringify(ME.legendState()) : '', rs: JSON.stringify(ME.renderState()) }; }, k);
      await page.waitForTimeout(150);
      const at = await page.evaluate(k => { const b = document.querySelector(`button.tgl[data-layer="${k}"]`), r = b.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + r.height / 2, hit: !!hit && (hit === b || b.contains(hit)) }; }, k);
      const g = await geo(page);
      ok(`${tag} switch ${k}: reached with the header and globe still pinned (globe ${visGlobe(g)} px on screen)`, g.header.top === 0 && Math.abs(g.globe.top - g.header.bottom) <= 1 && visGlobe(g) >= 300, { header: g.header, globe: g.globe });
      ok(`${tag} switch ${k}: fully on screen below the globe and not covered`, at.top >= g.globe.bottom - 0.5 && at.bottom <= g.vh + 0.5 && at.hit, { at, globeBottom: g.globe.bottom });
      await page.mouse.click(at.x, at.y);
      await page.waitForFunction(([k, was]) => document.querySelector(`button.tgl[data-layer="${k}"]`).getAttribute('aria-pressed') !== was && !['loading'].includes((document.getElementById('s-' + k) || {}).textContent), [k, before.pressed], { timeout: 15000 }).catch(() => { });
      await page.waitForTimeout(700);
      const after = await page.evaluate(k => { const b = document.querySelector(`button.tgl[data-layer="${k}"]`), r = b.getBoundingClientRect(), g = document.getElementById('globe').getBoundingClientRect(); return { pressed: b.getAttribute('aria-pressed'), rs: JSON.stringify(ME.renderState()), still: r.top >= g.bottom - 0.5 && r.bottom <= innerHeight + 0.5, top: Math.round(r.top), bottom: Math.round(r.bottom), gb: Math.round(g.bottom), y: Math.round(scrollY) }; }, k);
      const g2 = await geo(page);
      ok(`${tag} switch ${k}: a real click changes the switch and what is drawn on the globe, with the globe and the switch both still on screen`, after.pressed !== before.pressed && after.rs !== before.rs && visGlobe(g2) >= 300 && Math.abs(g2.globe.top - g2.header.bottom) <= 1 && after.bottom > after.gb + 8 && after.top < innerH - 8, { before: before.rs, after: after.rs, pressed: [before.pressed, after.pressed], after: [after.top, after.bottom, after.gb, after.y], at: [at.top, at.bottom, g.scrollY] });
      shift = Math.max(shift, Math.abs(after.top - Math.round(at.top)));   // the legend above the cards changes height when a layer is switched, which can move the cards by a line
      if (k === 'drifters') await shot(page, `after-${w}x${h}-at-buoys-switch`);
    }
    note(`${tag}: largest movement of a switch under the pointer when it was used: ${shift} px`);
    // the inspector opens over the pinned globe wherever the page is scrolled
    await page.evaluate(() => ME.openPlace('14_49')); await page.waitForFunction(() => document.getElementById('insp').classList.contains('show'), null, { timeout: 10000 }).catch(() => { }); await page.waitForTimeout(400);
    const ins = await page.evaluate(() => { const b = document.getElementById('insp').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, shown: document.getElementById('insp').classList.contains('show') }; }), gi = await geo(page);
    ok(`${tag}: with the page scrolled to the last switch, the place panel opens inside the pinned globe's box`, ins.shown && gi.scrollY > 100 && ins.top >= gi.globe.top - 0.5 && ins.bottom <= gi.globe.bottom + 0.5 && ins.left >= gi.globe.left - 0.5 && ins.right <= gi.globe.right + 0.5, { ins, globe: gi.globe, y: gi.scrollY });
    await page.keyboard.press('Escape');
    // the zoom-out view's overlay covers exactly the pinned globe (CSS box only; the view itself is exercised by sky-zoom-ui)
    const zr = await page.evaluate(() => { const z = document.getElementById('zoom-ui'); z.hidden = false; const b = z.getBoundingClientRect(), G = document.getElementById('globe'), g = G.getBoundingClientRect(); z.hidden = true; return [b.top - g.top, b.bottom - g.bottom, b.left - (g.left + G.clientLeft), b.right - (g.left + G.clientLeft + G.clientWidth)].map(Math.round); });   // the globe's drawing area: its box without the side gutters
    ok(`${tag}: the zoom-out overlay's box is the pinned globe's box`, zr.every(d => Math.abs(d) <= 1), zr);
    // keyboard: walk every focusable control forwards, then backwards; a focused control in the cards is never under the header or globe
    await page.evaluate(() => { scrollTo(0, 0); document.querySelector('.top a, .top button').focus(); });
    const walk = async key => { let n = 0, bad = []; const seen = new Set();
      for (let i = 0; i < 400; i++) { await page.keyboard.press(key); const s = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const b = e.getBoundingClientRect(), g = document.getElementById('globe').getBoundingClientRect(), inCol = !!e.closest('.col');
          const hit = document.elementFromPoint(Math.min(Math.max(b.left + b.width / 2, 1), innerWidth - 1), b.top + Math.min(b.height / 2, 12));
          if (!e.__w) e.__w = ++window.__wn || (window.__wn = 1); return { uid: e.__w, id: (e.id || e.dataset.layer || e.dataset.g || e.className || e.tagName) + '', inCol, top: Math.round(b.top), bottom: Math.round(b.bottom), globeBottom: Math.round(g.bottom), vh: innerHeight, hit: !!hit && (hit === e || e.contains(hit) || hit.contains(e)), tall: b.height > innerHeight - g.bottom }; });
        if (!s) break; if (seen.has(s.uid)) break; seen.add(s.uid);   // back where the walk started: every control has been visited once
        if (s.inCol) { n++; if (!(s.top >= s.globeBottom - 1 && (s.tall || s.bottom <= s.vh + 1) && s.hit)) bad.push(s); } }
      return { n, bad }; };
    const fw = await walk('Tab'); ok(`${tag}: Tab through ${fw.n} controls in the cards — none is ever under the pinned header or globe`, fw.n >= 20 && fw.bad.length === 0, fw.bad.slice(0, 4));
    const bw = await walk('Shift+Tab'); ok(`${tag}: Shift+Tab back through ${bw.n} controls — none is ever under the pinned header or globe`, bw.n >= 20 && bw.bad.length === 0, bw.bad.slice(0, 4));
    ok(`${tag}: no page error`, !perr.length, perr); await ctx.close();
    // touch: a swipe that starts on the cards scrolls the page; a swipe on the globe turns the globe (reported, unchanged from main)
    { const { ctx, page } = await open('branch', w, h, { touch: true }); const cdp = await ctx.newCDPSession(page); const g = await geo(page);
      const tp = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });   // a finger drag, as a phone or tablet sends it
      const swipe = async (x, y, dy) => { await tp('touchStart', [{ x, y }]); for (let d = -10; d >= dy; d -= 25) { await tp('touchMove', [{ x, y: y + d }]); await page.waitForTimeout(16); } await tp('touchEnd', []); await page.waitForTimeout(350); return page.evaluate(() => Math.round(scrollY)); };
      const y1 = await swipe(Math.round(g.vw / 2), g.vh - 80, -260);
      ok(`${tag}: a touch swipe starting on the area below the globe scrolls the page (${y1} px)`, y1 >= 150, y1);
      const y2 = await swipe(Math.round(g.vw / 2), g.vh - 80, -260); const g3 = await geo(page);
      ok(`${tag}: a second swipe scrolls further and the globe is still pinned`, y2 > y1 + 100 && Math.abs(g3.globe.top - g3.header.bottom) <= 1 && g3.header.top === 0, { y1, y2, globe: g3.globe });
      const y3 = await swipe(Math.round(g.vw / 2), g3.globe.top + Math.round(g3.globe.h / 2), -200);
      note(`${tag}: a swipe that starts ON the globe moved the page by ${y3 - y2} px (the globe takes the gesture to turn, as on main); ${g3.vh - g3.globe.bottom} px of every screen is outside the globe`);
      await ctx.close(); }
  }

  // =========================================================== D. 1101–1279 px
  for (const [w, h] of [[1101, 800], [1180, 820], [1279, 720]]) {
    const tag = `D ${w}×${h}`;
    const M = await open('main', w, h), mg = await geo(M.page); await shot(M.page, `before-${w}x${h}`); await M.ctx.close();
    const { ctx, page, perr } = await open('branch', w, h); const g = await geo(page); await shot(page, `after-${w}x${h}`);
    const mc = mg.credits.find(c => c.shown), bc = g.credits.filter(c => c.shown);
    note(`${tag}: globe ${mg.globe.h} → ${g.globe.h} px (+${g.globe.h - mg.globe.h}); credits were ${mc.rect.h} px under the globe`);
    ok(`${tag}: the globe gains at least 150 px of height`, g.globe.h - mg.globe.h >= 150, [mg.globe.h, g.globe.h]);
    ok(`${tag}: exactly one credits block is shown, in the right-hand column, with main's text`, bc.length === 1 && bc[0].inRight && bc[0].text === mc.text, g.credits.map(c => [c.id, c.shown, c.inRight]));
    const pos = await page.evaluate(() => { const col = document.querySelector('.col.right'), c = col.querySelector('.credits.m'); if (!c) return { missing: true }; const b = c.getBoundingClientRect(), cb = col.getBoundingClientRect(); const inView0 = b.top < cb.bottom; col.scrollTop = col.scrollHeight; const b2 = c.getBoundingClientRect();
      return { inView0, scrollNeeded: Math.max(0, Math.round(b.bottom - cb.bottom)), colH: Math.round(cb.height), contentH: col.scrollHeight, afterTop: Math.round(b2.top), afterBottom: Math.round(b2.bottom), colBottom: Math.round(cb.bottom), last: col.lastElementChild === c }; });
    note(`${tag}: credits are the last thing in the right-hand column; ${pos.inView0 ? 'partly on screen when the page opens' : 'NOT on screen when the page opens'}; ${pos.scrollNeeded} px of scrolling in that column brings them fully into view (column ${pos.colH} px tall, content ${pos.contentH} px)`);
    ok(`${tag}: credits are the last item of the right-hand column and fully visible once that column is scrolled to its end`, pos.last && pos.afterBottom <= pos.colBottom + 1 && pos.afterTop >= g.colR.top - 1, pos);
    ok(`${tag}: no sideways scroll; columns and header where main has them`, g.docW <= g.vw && JSON.stringify([g.header, g.colL, g.colR]) === JSON.stringify([mg.header, mg.colL, mg.colR]), [g.colL, mg.colL]);
    await shot(page, `after-${w}x${h}-right-column-end`);
    ok(`${tag}: no page error`, !perr.length, perr); await ctx.close();
  }

  // =========================================================== outside the two ranges: nothing moves
  for (const [w, h] of [[390, 844], [720, 900], [1280, 800], [1440, 900], [780, 360], [844, 390], [932, 430], [1024, 600], [1100, 659]]) {   // the last five: in the 721–1100 width range but under 660 px tall (phones held sideways, small laptops) — not pinned
    const M = await open('main', w, h), mg = await geo(M.page); await M.ctx.close();
    const { ctx, page, perr } = await open('branch', w, h); const g = await geo(page);
    const pick = x => JSON.stringify([x.header, x.globe, x.legend, x.colL, x.colR, x.docW, x.credits.filter(c => c.shown).map(c => [c.rect, c.text])]);
    ok(`${w}×${h}: header, globe, legend, columns and the visible credits block are exactly where main has them`, pick(g) === pick(mg), { branch: [g.globe, g.credits.filter(c => c.shown).map(c => c.rect)], main: [mg.globe, mg.credits.filter(c => c.shown).map(c => c.rect)] });
    ok(`${w}×${h}: exactly one credits block is shown`, g.credits.filter(c => c.shown).length === 1, g.credits.map(c => [c.id, c.shown]));
    ok(`${w}×${h}: no page error`, !perr.length, perr); await ctx.close();
  }
  // the height edge: pinned from 660 px tall (an iPad held sideways shows about 700 px in Safari)
  { const { ctx, page } = await open('branch', 1024, 660); await page.evaluate(() => document.querySelector('button.tgl[data-layer="plastic"]').scrollIntoView({ block: 'nearest' })); await page.waitForTimeout(200); const g2 = await geo(page);
    ok('1024×660: pinned, with at least 300 px of globe and 300 px of page beneath it', g2.header.top === 0 && Math.abs(g2.globe.top - g2.header.bottom) <= 1 && g2.globe.h >= 300 && g2.vh - g2.globe.bottom >= 300 && g2.scrollY > 100, { globe: g2.globe, y: g2.scrollY, vh: g2.vh }); await ctx.close(); }
  // the two edges of each range
  for (const [w, h] of [[721, 900], [1100, 900], [1101, 900], [1279, 900]]) { const { ctx, page } = await open('branch', w, h); const g = await geo(page);
    ok(`${w}×${h}: exactly one credits block is shown; no sideways scroll`, g.credits.filter(c => c.shown).length === 1 && g.docW <= g.vw, [g.credits.map(c => [c.id, c.shown]), g.docW]); await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`widths-preview-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
