/*
 * Timeline explorer — travelling through time (docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md rev 2.1 §3, stage 1).
 * The page is the real timeline.html / timeline.js / style.css from this checkout; the hub route is answered from the
 * committed catalogue file (or a fixture whose sha256 is written into the served page). Positions are checked against
 * ages computed here from the catalogue, never against the page's own report.
 *
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/timeline-travel-ui.test.cjs [base-url]
 *   needs a static server on the repo (default http://127.0.0.1:8899).
 * Breaks (each must make the suite fail): BREAK=nonlinear|no-clamp|pan-pushes|state-clobber|no-restore|wheel-always|
 *   zoom-always|zoom-outer-only|no-clip|requests|resize-moves-window|bad-state-accepted|nav-pushes|plans-focusable|new-sentence|chart-under-how|
 *   restore-reveals|stale-status|no-win-memory|no-unload-save
 * OLD=1 serves the three page files from commit a44e31d instead (the control: the suite must fail on the page before this work).
 * PERF=1 adds the timing section (figures are printed, never judged here).
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const ROOT = path.resolve(__dirname, '..');
const BREAK = process.env.BREAK || '', OLD = !!process.env.OLD, PERF = !!process.env.PERF;
const OLD_COMMIT = 'a44e31d';   // main before this work (a fixed commit: "main" moves at the merge)
const rd = f => OLD ? execFileSync('git', ['show', OLD_COMMIT + ':' + f], { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8') : fs.readFileSync(path.join(ROOT, f), 'utf8');
const REV = JSON.parse(fs.readFileSync(path.join(ROOT, 'phase1/timeline/BUILD.json'), 'utf8')).catalogue_revision;
const CAT = fs.readFileSync(path.join(ROOT, 'phase1/timeline/catalogue/' + REV + '.json'));
const C = JSON.parse(CAT.toString('utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SHA = sha(CAT);
const HTML0 = rd('timeline.html'), JS0 = rd('timeline.js'), CSS0 = rd('style.css');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info === undefined ? '' : JSON.stringify(info).slice(0, 500)); } };
const must = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('break anchor not found exactly once: ' + a.slice(0, 70)); return s.replace(a, b); };
const JS = (() => {
  if (BREAK === 'nonlinear') return must(JS0, "  const s = a - b, px = v => (a - v) / s * laneW;\n  const e = m.ext;", "  const s = a - b, px = v => Math.sqrt(Math.max(0, (a - v) / s)) * laneW;\n  const e = m.ext;");
  if (BREAK === 'no-clamp') return must(JS0, "  return { a: r6(o), b: r6(o - s) };", "  return { a: r6(a), b: r6(b) };");
  if (BREAK === 'pan-pushes') return must(JS0, "try { history.replaceState({ ...(st || {}), k, win: [view.a, view.b] }, '', location.href);", "try { history.pushState({ ...(st || {}), k, win: [view.a, view.b] }, '', location.href);");
  if (BREAK === 'state-clobber') return must(JS0, "try { history.replaceState({ ...(st || {}), k, win: [view.a, view.b] }, '', location.href);", "try { history.replaceState({ k, win: [view.a, view.b] }, '', location.href);");
  if (BREAK === 'no-restore') return must(JS0, "  restoreWin(st);                                         // each history entry restores its own window", '');
  if (BREAK === 'wheel-always') return must(JS0, "    if (!wheelOn) return;                                               // not activated: the page scrolls as usual", '');
  if (BREAK === 'zoom-always') return must(JS0, "  return alone === ids.size ? tgt : null;", "  return tgt;");
  // the rule GPT found wanting (rev 2 of the build record): only the outermost separation is asked about
  if (BREAK === 'zoom-outer-only') return must(JS0, "  return alone === ids.size ? tgt : null;", "  return sep / MIN_SPAN * laneW >= CLUSTER_PX ? tgt : null;");
  // GPT's H1: restoring a history entry re-centres on the story's mark
  if (BREAK === 'restore-reveals') return must(JS0, "show(st.entry, st.x, !validWin(st.win));", "show(st.entry, st.x, true);");
  if (BREAK === 'stale-status') return must(JS0, "  if (!m || inView(m) || document.activeElement !== E.xpl) lostId = null;", "  if (!m) lostId = null;");
  if (BREAK === 'no-win-memory') return must(JS0, "  const m = st.k ? winMem.get(st.k) : null, w =", "  const m = null, w =");
  if (BREAK === 'no-unload-save') return must(JS0, "addEventListener('beforeunload', saveNow);\naddEventListener('pagehide', saveNow);", "");
  if (BREAK === 'no-clip') return must(JS0, "(e.from - e.to) / s * laneW >= TRUE_PX && e.from > b && e.to < a) {", "(e.from - e.to) / s * laneW >= TRUE_PX && m.ma <= a && m.ma >= b) {");
  if (BREAK === 'requests') return must(JS0, "  view = v;\n  if (E) render();", "  view = v; fetch(location.pathname + '?again=' + Math.random()).catch(() => {});\n  if (E) render();");
  if (BREAK === 'resize-moves-window') return must(JS0, "Math.abs(E.track.clientWidth - laneW) >= 1) render(); }).observe(axis);", "Math.abs(E.track.clientWidth - laneW) >= 1) { view = clampWin(view.a * 0.9, view.b); render(); } }).observe(axis);");
  if (BREAK === 'bad-state-accepted') return must(JS0, "const validWin = w => !!lim && Array.isArray(w) && w.length === 2 && isNum(w[0]) && isNum(w[1])\n  && w[1] >= 0 && w[0] <= lim.O && w[0] - w[1] >= MIN_SPAN - 1e-9;", "const validWin = w => !!lim && Array.isArray(w) && w.length === 2 && isNum(w[0]) && isNum(w[1]);");
  if (BREAK === 'nav-pushes') return must(JS0, "  swap({ entry: id, x, opener, oid: (a && a.id) || null, direct: cur.direct, k: cur.k,", "  put({ entry: id, x, opener, oid: (a && a.id) || null, direct: cur.direct, k: cur.k,");
  if (BREAK === 'plans-focusable') return must(JS0, '`<span class="plans">Not on the timeline yet:', '`<span class="plans" tabindex="0">Not on the timeline yet:');
  return JS0;
})();
const HTML = (() => {
  if (BREAK === 'new-sentence') return must(HTML0, '<h4 class="gh" id="e-big5-end-permian-g-how">How we know</h4>', '<h4 class="gh" id="e-big5-end-permian-g-how">How we know</h4><p>It was the largest of the five.</p>');
  if (BREAK === 'chart-under-how') return must(HTML0, '<section class="grp" data-grp="chart" aria-labelledby="e-big5-end-permian-g-chart">', '<section class="grp" data-grp="how" aria-labelledby="e-big5-end-permian-g-chart">');
  return HTML0;
})();
const ID = { o: 'e-big5-end-ordovician', ff: 'e-big5-frasnian-famennian', p: 'e-big5-end-permian', t: 'e-big5-end-triassic', k: 'e-big5-end-cretaceous', pl: 'e-pliny-ep-6-16' };
const O = C.chart.overview.ma, W = C.chart.window.ma, MIN = 1;

// ---- ages computed here, from the catalogue: where each entry is plotted, and the extent the catalogue states for it
function plotted(e) {
  const ax = e.claims.filter(k => k.axis), g = t => (ax.find(k => k.claim_type === t) || {}).when;
  let w;
  if ((w = g('extinction_interval_approx'))) return { id: e.id, ma: (w.from_ma + w.to_ma) / 2, ext: [w.from_ma, w.to_ma] };
  if ((w = g('boundary_age_range_modelled'))) return { id: e.id, ma: w.mid_ma, ext: [w.from_ma, w.to_ma] };
  if ((w = g('extinction_onset_estimate'))) return { id: e.id, ma: w.ma, ext: w.pm ? [w.ma + w.pm, w.ma - w.pm] : null };
  if ((w = g('extinction_horizon_approx'))) return { id: e.id, ma: w.ma, ext: null };
  if ((w = g('dated_event_age'))) return { id: e.id, ma: w.ma, ext: null };
  throw new Error('no rule for ' + e.id);
}
// what must be on screen for a window [a, b] on a track of width tw: null = not drawn
function expect(pl, a, b, tw) {
  const s = a - b, x = v => (a - v) / s * tw;
  if (pl.ext && (pl.ext[0] - pl.ext[1]) / s * tw >= 4 && pl.ext[0] > b && pl.ext[1] < a) return { bar: [x(Math.min(pl.ext[0], a)), x(Math.max(pl.ext[1], b))], clipL: pl.ext[0] > a, clipR: pl.ext[1] < b };
  if (pl.ma > a || pl.ma < b) return null;
  return { x: x(pl.ma) };
}

const HUB = /mother-earth\.chadoberholzer\.workers\.dev\/catalogue\/timeline/;
const serve = body => r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body });
async function ctx(b, { cat = CAT, html = HTML, viewport = { width: 1280, height: 860 }, js = true, extra = {} } = {}) {
  const c = await b.newContext({ viewport, javaScriptEnabled: js, ...extra });
  await c.route(/fonts\.googleapis|unpkg|gibs|jsdelivr|thelatinlibrary|doi\.org|stratigraphy|creativecommons/, r => r.abort());
  await c.route(HUB, serve(cat));
  await c.route(/timeline\.js/, r => r.fulfill({ contentType: 'application/javascript', body: JS }));
  await c.route(/style\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS0 }));
  const h = cat === CAT ? html : html.replace(`data-catalogue-sha="${SHA}"`, `data-catalogue-sha="${sha(cat)}"`);
  await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: h }));
  return c;
}
const settle = p => p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending', null, { timeout: 20000 }).catch(() => {});
const open = async (c, hash = '') => { const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(String(e))); await p.goto(BASE + '/timeline.html' + hash); await settle(p); await p.waitForTimeout(80); return p; };
const view = p => p.evaluate(() => window.TL_AXIS && window.TL_AXIS.view);
const near = (x, y, tol = 1e-6) => Math.abs(x - y) <= tol;
const sameWin = (v, w, tol = 1e-6) => !!v && !!w && near(v[0], w[0], tol) && near(v[1], w[1], tol);
// put a window into the current history entry's state and reload: the page must restore it (this is also the reload path)
const setWin = async (p, win) => { await p.evaluate(w => history.replaceState({ ...(history.state || {}), win: w }, '', location.href), win); await p.reload(); await settle(p); await p.waitForTimeout(80); };
const snap = p => p.evaluate(() => {
  const T = document.querySelector('#xpl .track').getBoundingClientRect();
  const r = el => { const q = el.getBoundingClientRect(); return [q.left - T.left, q.right - T.left]; };
  return { tw: T.width, win: document.getElementById('tl-win').textContent,
    marks: [...document.querySelectorAll('#xpl .track > a.mk')].map(a => ({ id: a.dataset.entry, cx: (r(a)[0] + r(a)[1]) / 2, g: r(a.querySelector('.g')), cls: a.className, label: a.getAttribute('aria-label') })),
    clustered: [...document.querySelectorAll('#xpl .track .cl')].map(c => ({ has: c.dataset.has.split(' '), n: c.querySelector('button').textContent, cx: (r(c)[0] + r(c)[1]) / 2, zoom: !!c.querySelector('[data-zoomto]') })),
    ticks: [...document.querySelectorAll('#xpl .scale .tk')].map(t => { const q = r(t); return { v: parseFloat(t.firstChild.textContent), x: t.classList.contains('last') ? q[1] : t.classList.contains('first') ? q[0] : (q[0] + q[1]) / 2 }; }),
    bands: [...document.querySelectorAll('#xpl .bands .band')].map(b => ({ t: b.querySelector('b').textContent, e: r(b), clip: b.querySelector('b').scrollWidth > b.querySelector('b').clientWidth + 1 })),
    empty: !!document.querySelector('#xpl .nomk'), sw: document.documentElement.scrollWidth, iw: innerWidth };
});
// every drawn mark is where the catalogue's ages put it, and nothing outside the window is drawn
function checkPositions(name, s, a, b, cat = C) {
  const pls = cat.entries.map(plotted), single = Object.fromEntries(s.marks.map(m => [m.id, m])), inCl = new Set(s.clustered.flatMap(c => c.has));
  const bad = [];
  for (const pl of pls) {
    const ex = expect(pl, a, b, s.tw), m = single[pl.id];
    if (!ex) { if (m || inCl.has(pl.id)) bad.push([pl.id, 'drawn outside the window']); continue; }
    if (!m) { if (!inCl.has(pl.id)) bad.push([pl.id, 'missing']); continue; }
    if (ex.bar) { if (Math.abs(m.g[0] - ex.bar[0]) > 1.5 || Math.abs(m.g[1] - Math.max(ex.bar[1], ex.bar[0] + 2)) > 1.5) bad.push([pl.id, 'bar', m.g, ex.bar]);
      if (/clipl/.test(m.cls) !== ex.clipL || /clipr/.test(m.cls) !== ex.clipR) bad.push([pl.id, 'clip flags', m.cls]); }
    else if (Math.abs(m.cx - ex.x) > 1.5) bad.push([pl.id, 'x', m.cx, ex.x]);
  }
  ok(`${name}: every mark sits at its catalogue age on a linear scale; none drawn outside the window`, bad.length === 0, bad);
  const tb = s.ticks.filter(t => Math.abs(t.x - (a - t.v) / (a - b) * s.tw) > 1.5 || t.v > a + 1e-9 || t.v < b - 1e-9);
  ok(`${name}: every tick is at its own value, inside the window`, s.ticks.length >= 2 && tb.length === 0, tb);
}

(async () => {
  const b = await chromium.launch();

  // ---------- A. linear placement at five windows, after resize, and what the window line says
  {
    const c = await ctx(b), p = await open(c);
    let s = await snap(p);
    ok('A landing: the window is the pinned 538.8–0 Ma', sameWin(await view(p), [W, 0]) && s.win === 'Showing 538.8 to 0 Ma (million years ago). Span 538.8 million years. Older on the left.', s.win);
    checkPositions('A landing', s, W, 0);
    ok('A landing: twelve bands, none clipped, no page overflow', s.bands.length === 12 && s.bands.every(x => !x.clip) && s.sw <= s.iw, [s.bands.length, s.sw, s.iw]);
    for (const win of [[O, 0], [400, 300], [372.6, 371.4], [252.3, 251.3]]) {
      await setWin(p, win); s = await snap(p);
      ok(`A ${win}: reload restores the stored window exactly`, sameWin(await view(p), win), await view(p));
      checkPositions(`A ${win}`, s, win[0], win[1]);
      const pc = C.chart.periods.filter(q => q.begin.ma > win[1] && q.end.ma < win[0]);
      const be = s.bands.map((x, i) => Math.abs(x.e[0] - (win[0] - Math.min(pc[i].begin.ma, win[0])) / (win[0] - win[1]) * s.tw) > 1.5 || Math.abs(x.e[1] - (win[0] - Math.max(pc[i].end.ma, win[1])) / (win[0] - win[1]) * s.tw) > 1.5);
      ok(`A ${win}: the bands that intersect the window, clipped to it, none with a clipped label`, s.bands.length === pc.length && !be.some(Boolean) && s.bands.every(x => !x.clip), [s.bands.length, pc.length]);
    }
    await setWin(p, [O, 0]); s = await snap(p);
    ok('A whole Earth: says the older part has no bands and no reviewed entries; draws no band there', /Older than ~538\.8 Ma this release has no period bands and no reviewed entries\./.test(s.win) && s.bands.every(x => x.e[0] >= (O - W) / O * s.tw - 1.5) && await p.evaluate(() => !!document.querySelector('#xpl .noband')), s.win);
    await setWin(p, [372.6, 371.4]); s = await snap(p);
    const ff = s.marks.find(m => m.id === ID.ff);
    ok('A 372.6–371.4: the modelled range is drawn to scale as a modelled bar and keeps its label', !!ff && /mk-modelled/.test(ff.cls) && /mk-true/.test(ff.cls) && /Modelled boundary-age range: 371\.93–371\.78 Ma/.test(ff.label), ff);
    await setWin(p, [252.3, 251.3]); s = await snap(p);
    const pm = s.marks.find(m => m.id === ID.p);
    ok('A 252.3–251.3: the stated ± margin is drawn to scale as a whisker, still labelled with the source value', !!pm && /mk-measured/.test(pm.cls) && /mk-true/.test(pm.cls) && /251\.941 ± 0\.037 Ma/.test(pm.label), pm);
    // resize: pixels change, the age window does not
    await setWin(p, [400, 300]); const before = await snap(p);
    await p.setViewportSize({ width: 900, height: 860 }); await p.waitForTimeout(250);
    s = await snap(p);
    ok('A resize: the track width changed and the age window did not', Math.abs(s.tw - before.tw) > 100 && sameWin(await view(p), [400, 300]) && sameWin(await p.evaluate(() => history.state.win), [400, 300]), [before.tw, s.tw, await view(p)]);
    checkPositions('A after resize', s, 400, 300);
    ok('A: no page errors', p.errs.length === 0, p.errs);
    await c.close();
  }

  // ---------- B. buttons, presets, clamps, anchored zoom, a seeded run of 200 operations
  {
    const c = await ctx(b), p = await open(c);
    const click = sel => p.evaluate(s => document.querySelector(s).click(), sel);
    const dis = sel => p.evaluate(s => document.querySelector(s).getAttribute('aria-disabled'), sel);
    ok('B landing: Newer is marked unavailable and does nothing', (await dis('[data-act="newer"]')) === 'true' && (await click('[data-act="newer"]'), sameWin(await view(p), [W, 0])));
    await click('[data-act="in"]');
    ok('B zoom in: half the span about the middle', sameWin(await view(p), [W * 0.75, W * 0.25]), await view(p));
    await click('[data-act="older"]');
    ok('B older: a quarter of the span towards the past', sameWin(await view(p), [W * 0.75 + W / 8, W * 0.25 + W / 8]), await view(p));
    for (let i = 0; i < 14; i++) await click('[data-act="in"]');
    let v = await view(p);
    ok('B narrowest: zooming in stops at 1 Ma and Zoom in is marked unavailable', near(v[0] - v[1], MIN) && (await dis('[data-act="in"]')) === 'true', v);
    for (let i = 0; i < 16; i++) await click('[data-act="out"]');
    v = await view(p);
    ok('B widest: zooming out stops at the whole span; Older, Newer and Zoom out unavailable; Whole Earth pressed', sameWin(v, [O, 0]) && (await dis('[data-act="out"]')) === 'true' && (await dis('[data-act="older"]')) === 'true'
      && (await p.evaluate(() => document.querySelector('[data-preset="earth"]').getAttribute('aria-pressed'))) === 'true', v);
    await click('[data-preset="complex"]');
    ok('B preset Complex life = the landing window; Reset view returns to it', sameWin(await view(p), [W, 0]) && (await click('[data-act="in"]'), await click('[data-act="reset"]'), sameWin(await view(p), [W, 0])));
    // wheel zoom keeps the age under the pointer where it is
    await setWin(p, [400, 200]);
    const T = await p.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { l: r.left, w: r.width, y: r.top + 80 }; });
    await p.mouse.click(T.l + T.w * 0.3, T.y); await p.waitForTimeout(60);
    await p.mouse.move(T.l + T.w * 0.3, T.y); await p.mouse.wheel(0, -300); await p.waitForTimeout(120);
    v = await view(p);
    ok('B wheel: zoomed in, and the age under the pointer (340 Ma) stayed under it', v[0] - v[1] < 199 && near(v[0] - 0.3 * (v[0] - v[1]), 340, 1.5 / T.w * 200), v);   // within 1.5 px: wheel events carry whole-pixel positions
    // seeded run: 200 operations, every resulting window valid
    await setWin(p, [W, 0]);
    const views = await p.evaluate(() => { let s = 20261123; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const x = document.getElementById('xpl'), out = [], sels = ['[data-act="older"]', '[data-act="newer"]', '[data-act="in"]', '[data-act="out"]', '[data-act="in"]', '[data-act="in"]', '[data-preset="earth"]', '[data-preset="complex"]', '[data-act="reset"]'];
      x.click();   // wheel on
      for (let i = 0; i < 200; i++) { const k = Math.floor(rnd() * 13);
        if (k < 9) document.querySelector(sels[k]).click();
        else if (k < 11) { const r = x.getBoundingClientRect(); x.dispatchEvent(new WheelEvent('wheel', { deltaY: (rnd() - 0.5) * 4000, clientX: r.left + rnd() * r.width, clientY: r.top + 50, bubbles: true, cancelable: true })); }
        else { x.focus(); x.dispatchEvent(new KeyboardEvent('keydown', { key: ['ArrowLeft', 'ArrowRight', '+', '-'][Math.floor(rnd() * 4)], bubbles: true, cancelable: true })); }
        out.push([...window.TL_AXIS.view, document.querySelectorAll('#xpl .track a.mk').length]); }
      return out; });
    const pls = C.entries.map(plotted), tw = (await snap(p)).tw;
    const badv = views.filter(([a, bb]) => !(isFinite(a) && isFinite(bb) && bb >= 0 && a <= O && a - bb >= MIN - 1e-9 && a - bb <= O + 1e-9));
    const badn = views.filter(([a, bb, n]) => n !== pls.filter(q => expect(q, a, bb, tw)).length);
    ok('B seeded 200 operations: never an inverted, empty or out-of-range window', views.length === 200 && badv.length === 0, badv.slice(0, 3));
    ok('B seeded 200 operations: after each, exactly the entries inside the window are on screen', badn.length === 0, badn.slice(0, 3));
    ok('B seeded run reached both limits', views.some(([a, bb]) => near(a - bb, MIN)) && views.some(([a, bb]) => a === O && bb === 0));
    ok('B: no page errors', p.errs.length === 0, p.errs);
    await c.close();
  }

  // ---------- C. the wheel belongs to the page until the explorer is activated; Esc and leaving release it
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 600 } }), p = await open(c);
    await p.evaluate(() => document.getElementById('xpl').scrollIntoView({ block: 'center' })); await p.waitForTimeout(80);
    const T = await p.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + 90 }; });
    const y0 = await p.evaluate(() => scrollY);
    await p.mouse.move(T.x, T.y); await p.mouse.wheel(0, 240); await p.waitForTimeout(200);
    ok('C not activated: the wheel scrolls the page and the window stays', sameWin(await view(p), [W, 0]) && (await p.evaluate(() => scrollY)) > y0, [await view(p), y0, await p.evaluate(() => scrollY)]);
    await p.evaluate(() => document.getElementById('xpl').scrollIntoView({ block: 'center' })); await p.waitForTimeout(80);
    const T2 = await p.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + 90 }; });
    ok('C the hint says how to turn wheel zoom on', /Click the timeline, or press Enter on it, to zoom with the mouse wheel/.test(await p.textContent('#tl-whint')));
    await p.mouse.click(T2.x, T2.y); await p.waitForTimeout(60);
    const y1 = await p.evaluate(() => scrollY);
    await p.mouse.wheel(0, 240); await p.waitForTimeout(200);
    let v = await view(p);
    ok('C activated by a click on the timeline: the wheel zooms, the page does not scroll, and the hint says how to release', (await p.evaluate(() => window.TL_AXIS.wheel)) === true && !sameWin(v, [W, 0]) && (await p.evaluate(() => scrollY)) === y1 && (await p.textContent('#tl-whint')) === 'Wheel zoom is on while the pointer is over the timeline. Press Esc, or click or Tab somewhere else, to turn it off.', [v, y1]);
    // the pointer leaving is NOT a release: over the rest of the page the wheel scrolls the page; back over the timeline it zooms again
    const vOn = await view(p), hd = await p.evaluate(() => { const r = document.getElementById('tl-heading').getBoundingClientRect(); return { x: r.left + 40, y: Math.max(70, r.top + 5) }; });
    await p.mouse.move(hd.x, hd.y); const y2 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 120); await p.waitForTimeout(200);
    ok('C pointer moved off the timeline: the wheel scrolls the page, the window stays, wheel zoom is still on', sameWin(await view(p), vOn) && (await p.evaluate(() => scrollY)) !== y2 && (await p.evaluate(() => window.TL_AXIS.wheel)) === true, [await view(p), y2, await p.evaluate(() => scrollY)]);
    await p.evaluate(() => document.getElementById('xpl').scrollIntoView({ block: 'center' })); await p.waitForTimeout(80);
    const T3 = await p.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + 90 }; });
    await p.mouse.move(T3.x, T3.y); await p.mouse.wheel(0, -240); await p.waitForTimeout(200);
    ok('C pointer back over the timeline: the wheel zooms again without a new click', !sameWin(await view(p), vOn) && (await p.evaluate(() => window.TL_AXIS.wheel)) === true, await view(p));
    const ld = await p.evaluate(() => { const r = document.querySelector('.axiswrap .coverage').getBoundingClientRect(); return { x: r.left + 30, y: r.top + 5 }; });
    await p.mouse.click(ld.x, ld.y); await p.waitForTimeout(80);
    ok('C a click somewhere else turns wheel zoom off', (await p.evaluate(() => window.TL_AXIS.wheel)) === false);
    await p.evaluate(() => document.getElementById('xpl').focus()); await p.keyboard.press('Enter'); await p.waitForTimeout(40);
    await p.keyboard.press('Escape'); await p.waitForTimeout(60);
    ok('C Esc releases the wheel', (await p.evaluate(() => window.TL_AXIS.wheel)) === false);
    // with a story open: the first Esc releases the wheel and the story stays open
    await p.evaluate(() => document.querySelector('[data-act="reset"]').click()); await p.waitForTimeout(60);
    await p.click(`#xpl a.mk[data-entry="${ID.k}"]`); await p.waitForTimeout(250);
    await p.evaluate(() => document.getElementById('xpl').focus()); await p.keyboard.press('Enter'); await p.waitForTimeout(60);
    ok('C Enter on the explorer turns wheel zoom on', (await p.evaluate(() => window.TL_AXIS.wheel)) === true);
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    ok('C Esc with a story open: wheel released, story still open', (await p.evaluate(() => window.TL_AXIS.wheel)) === false && await p.evaluate(() => !document.getElementById('detail').hidden));
    await p.keyboard.press('Enter'); await p.waitForTimeout(40);
    await p.focus('#tl-changes-link'); await p.waitForTimeout(60);
    ok('C leaving the explorer releases the wheel', (await p.evaluate(() => window.TL_AXIS.wheel)) === false);
    await c.close();
  }

  // ---------- D. pointer: a drag pans and opens nothing; a click opens; hover and focus open nothing
  {
    const c = await ctx(b), p = await open(c);
    const at = id => p.evaluate(i => { const r = document.querySelector(`#xpl a.mk[data-entry="${i}"] .gw`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, id);
    const isOpen = () => p.evaluate(() => !document.getElementById('detail').hidden || location.hash !== '');
    let m = await at(ID.p); const tw = (await snap(p)).tw;
    await p.mouse.move(m.x, m.y); await p.waitForTimeout(150);
    ok('D hover over a mark opens nothing', !(await isOpen()));
    await p.focus(`#xpl a.mk[data-entry="${ID.p}"]`); await p.waitForTimeout(100);
    ok('D focus on a mark opens nothing', !(await isOpen()));
    await p.mouse.down(); await p.mouse.move(m.x + 20, m.y, { steps: 3 }); await p.mouse.move(m.x + 120, m.y, { steps: 6 }); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(200);
    let v = await view(p);
    ok('D a 120 px drag that starts on a mark pans by exactly that much of the window and opens no story', !(await isOpen()) && near(v[0], Math.min(O, W + 120 / tw * W), 0.05) && near(v[0] - v[1], W), v);
    ok('D the drag added no history entry and the window is saved in the current one', sameWin(await p.evaluate(() => history.state && history.state.win), v));
    await p.evaluate(() => document.querySelector('[data-act="reset"]').click()); await p.waitForTimeout(80);
    m = await at(ID.p);
    await p.mouse.move(m.x, m.y); await p.mouse.down(); await p.mouse.move(m.x + 3, m.y); await p.mouse.up(); await p.waitForTimeout(250);
    ok('D a press that moves 3 px is a click: the story opens and the window did not move', (await p.evaluate(i => !document.getElementById('detail').hidden && location.hash === '#' + i, ID.p)));
    await p.goBack(); await p.waitForTimeout(200);
    // cancelled pointer: the drag ends where it is, later moves do nothing, nothing opens
    const r = await p.evaluate(() => { const x = document.getElementById('xpl'), q = x.getBoundingClientRect(), y = q.top + 40, ev = (t, cx) => x.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: cx, clientY: y, bubbles: true, cancelable: true }));
      ev('pointerdown', q.left + 300); ev('pointermove', q.left + 380); return new Promise(res => requestAnimationFrame(() => { const mid = [...window.TL_AXIS.view]; ev('pointercancel', q.left + 380); ev('pointermove', q.left + 600);
        requestAnimationFrame(() => res({ mid, end: [...window.TL_AXIS.view], open: !document.getElementById('detail').hidden })); })); });
    ok('D pointercancel ends the drag: the window stays where it was and later moves do nothing', r.mid[0] > W && sameWin(r.mid, r.end) && !r.open, r);
    ok('D: no page errors', p.errs.length === 0, p.errs);
    await c.close();
  }

  // ---------- E. history: pan and zoom add no entries; each entry keeps and restores its own window; bad stored state
  for (const [w, h] of [[1280, 860], [390, 844]]) {
    const c = await ctx(b, { viewport: { width: w, height: h } }), p = await open(c);
    const click = sel => p.evaluate(s => document.querySelector(s).click(), sel);
    const st = () => p.evaluate(() => ({ len: history.length, s: history.state, hash: location.hash, open: !document.getElementById('detail').hidden, act: document.activeElement.id || (document.activeElement.dataset && document.activeElement.dataset.entry) || document.activeElement.tagName }));
    const len0 = (await st()).len;
    for (const s of ['in', 'older', 'in', 'newer', 'out', 'in', 'newer', 'newer', 'in', 'newer']) await click(`[data-act="${s}"]`);
    let s = await st(); const X = await view(p);
    ok(`E ${w}: ten pan and zoom steps add no history entry; the window is in the current entry's state`, s.len === len0 && sameWin(s.s && s.s.win, X), [s.len, len0, s.s]);
    await p.focus(`#xpl a.mk[data-entry="${ID.t}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    s = await st();
    ok(`E ${w}: opening a story adds one entry whose state has the entry, its keys and the window`, s.len === len0 + 1 && s.s.entry === ID.t && s.s.k > 0 && 'p' in s.s && sameWin(s.s.win, X) && s.hash === '#' + ID.t && s.act === ID.t + '-h', s);
    if (w > 720) {   // the explorer is still usable beside the panel
      await click('[data-act="newer"]'); await click('[data-act="in"]'); await p.waitForTimeout(80);
      s = await st(); const Y = await view(p);
      ok(`E ${w}: panning with the story open keeps entry, k, p and opener in the state and adds no entry`, s.len === len0 + 1 && s.s.entry === ID.t && s.s.k > 0 && s.s.opener === 'mark' && sameWin(s.s.win, Y) && !sameWin(Y, X), s);
      await p.goBack(); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: Back closes the story and restores the window it was opened from`, !s.open && sameWin(await view(p), X) && s.hash === '', [await view(p), X, s]);
      await p.goForward(); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: Forward reopens the story with the window it was left with`, s.open && s.hash === '#' + ID.t && sameWin(await view(p), Y), [await view(p), Y]);
      await p.reload(); await settle(p); await p.waitForTimeout(150); s = await st();
      ok(`E ${w}: reload keeps the story open with its window`, s.open && sameWin(await view(p), Y) && s.act === ID.t + '-h', [await view(p), s]);
      // entry -> What changed -> Back -> Forward -> Back
      await p.click(`#d-body a[data-change]`); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: the "Changed in" jump keeps the window in its own entry`, !!s.s.change && sameWin(s.s.win, Y) && s.len === len0 + 2, s);
      await click('[data-act="out"]'); await p.waitForTimeout(60); const Z = await view(p);
      await p.goBack(); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: Back from the record reopens the story with the story's window, focus on the link used`, s.open && sameWin(await view(p), Y) && /-chg-/.test(s.act), [await view(p), s.act]);
      await p.goForward(); await p.waitForTimeout(250);
      ok(`E ${w}: Forward to the record restores the record's window`, sameWin(await view(p), Z), [await view(p), Z]);
      await p.goBack(); await p.waitForTimeout(200);
      await p.click('#d-close'); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: Close returns to the opening window and to the mark`, !s.open && sameWin(await view(p), X) && s.act === ID.t, [await view(p), s.act]);
    } else {
      await p.focus('#d-handle'); await p.keyboard.press('Enter'); await p.waitForTimeout(250); s = await st();
      ok(`E ${w}: Close on the sheet returns to the opening window and to the mark (or its cluster)`, !s.open && sameWin(await view(p), X), [await view(p), s.act]);
    }
    // stored state that must be refused: the landing window is used
    for (const [nm, bad] of [['missing', undefined], ['a string', 'x'], ['strings inside', ['400', '300']], ['inverted', [300, 400]], ['older than the whole span', [5000, 0]], ['newer than today', [10, -5]], ['narrower than the limit', [100, 99.5]], ['not finite', [Infinity, 0]], ['three numbers', [400, 300, 200]]]) {
      await p.goto(BASE + '/timeline.html'); await settle(p);
      await p.evaluate(bw => history.replaceState(bw === null ? {} : { win: bw }, '', location.href), bad === undefined ? null : bad); await p.reload(); await settle(p); await p.waitForTimeout(60);
      ok(`E ${w}: stored window refused (${nm}) → landing window, explorer on`, sameWin(await view(p), [W, 0]) && (await p.evaluate(() => window.TL_AXIS.state)) === 'on', await view(p));
    }
    ok(`E ${w}: no page errors`, p.errs.length === 0, p.errs);
    await c.close();
  }
  { // direct links: the stated default; Pliny leaves the explorer alone; a fragment never carries a window
    const c = await ctx(b);
    let p = await open(c, '#' + ID.ff);
    ok('E direct link: story open, heading focused, landing window, mark selected', await p.evaluate(i => !document.getElementById('detail').hidden && document.activeElement.id === i + '-h' && !!document.querySelector(`#xpl a.mk.sel[data-entry="${i}"][aria-current="true"]`), ID.ff) && sameWin(await view(p), [W, 0]));
    await p.close(); p = await open(c, '#' + ID.pl);
    ok('E direct link to Pliny: story open, explorer at its default, no mark selected, no entry navigation', await p.evaluate(() => !document.getElementById('detail').hidden && !document.querySelector('#xpl a.mk.sel') && document.getElementById('d-nav').hidden) && sameWin(await view(p), [W, 0]));
    await c.close();
  }

  // ---------- F. clusters keep their list at every zoom; "Zoom to these" only when it can separate them
  {
    const c = await ctx(b), p = await open(c);
    await p.evaluate(() => document.querySelector('[data-preset="earth"]').click()); await p.waitForTimeout(100);
    let s = await snap(p);
    const cl = s.clustered.find(x => x.has.includes(ID.p));
    ok('F whole Earth: end-Permian and end-Triassic share one control with a list and "Zoom to these"', !!cl && cl.has.includes(ID.t) && cl.zoom, s.clustered);
    await p.click(`#xpl .cl[data-has~="${ID.p}"] > button`); await p.waitForTimeout(100);
    ok('F the list opens in place, inside the page, with both entries', await p.evaluate(i => { const ul = document.querySelector(`#xpl .cl[data-has~="${i}"] ul`), r = ul.getBoundingClientRect(); return !ul.hidden && ul.querySelectorAll('a.mk').length === 2 && r.left >= 0 && r.right <= innerWidth; }, ID.p));
    await p.click(`#xpl .cl[data-has~="${ID.p}"] [data-zoomto]`); await p.waitForTimeout(150);
    s = await snap(p); const v = await view(p);
    ok('F "Zoom to these": the two are now separate marks, both inside the window, and focus is on one of them', s.marks.some(m => m.id === ID.p) && s.marks.some(m => m.id === ID.t) && v[0] < 300 && await p.evaluate(() => !!document.activeElement.closest('#xpl .track')), [v, s.marks.map(m => m.id)]);
    checkPositions('F after zoom-to', s, v[0], v[1]);
    await c.close();
    // coincident and near-coincident members: still one control at the narrowest window, list usable, no zoom offered
    for (const [nm, ma] of [['coincident', 251.941], ['0.005 Ma apart', 251.946]]) {
      const J = JSON.parse(CAT.toString('utf8')); J.entries[3].claims[0].when.ma = ma; const fx = Buffer.from(JSON.stringify(J));
      const c2 = await ctx(b, { cat: fx }), p2 = await open(c2);
      const seen = [];
      for (const win of [[W, 0], [300, 200], [255, 249], [252.5, 251.5]]) { await setWin(p2, win); const q = await snap(p2); const k = q.clustered.find(x => x.has.includes(ID.p) && x.has.includes(ID.t)); seen.push([win, !!k, k && k.zoom]); }
      ok(`F ${nm}: one control at every zoom, down to the narrowest window`, seen.every(x => x[1]), seen);
      ok(`F ${nm}: "Zoom to these" is never offered, at any zoom, for members that can never stand apart`, seen.every(x => !x[2]), seen);
      await p2.click(`#xpl .cl[data-has~="${ID.t}"] > button`); await p2.waitForTimeout(80);
      await p2.click(`#xpl .cl ul a.mk[data-entry="${ID.t}"]`); await p2.waitForTimeout(250);
      ok(`F ${nm}: at the narrowest window each member still opens from the list`, await p2.evaluate(i => !document.getElementById('detail').hidden && location.hash === '#' + i, ID.t));
      await p2.goBack(); await p2.waitForTimeout(200);
      ok(`F ${nm}: Back returns focus to the cluster`, await p2.evaluate(() => !!document.activeElement.closest('#xpl .cl')));
      await c2.close();
    }
  }

  // ---------- F2. "Zoom to these" is judged in its real target window, member by member (GPT review of rev 2, H2)
  {
    const fx = mut => { const J = JSON.parse(CAT.toString('utf8')); mut(J); return { J, buf: Buffer.from(JSON.stringify(J)) }; };
    const point = (J, i, ma) => { const w = J.entries[i].claims[0].when; if ('from_ma' in w) { w.from_ma = ma; w.to_ma = ma; } else w.ma = ma; };
    for (const [nm, mut] of [['two at one age plus one 0.03 Ma away', J => { point(J, 3, 251.941); point(J, 0, 251.971); }], ['two 0.0005 Ma apart plus one 0.03 Ma away', J => { point(J, 3, 251.9415); point(J, 0, 251.971); }]]) {
      const { buf } = fx(mut), c = await ctx(b, { cat: buf }), p = await open(c), seen = [];
      for (const win of [[O, 0], [W, 0], [300, 200], [255, 249], [252.5, 251.5]]) { await setWin(p, win); const q = await snap(p);
        for (const k of q.clustered.filter(x => x.has.includes(ID.p))) seen.push([win, k.has.length, k.zoom]); }
      ok(`F2 ${nm}: the pair that can never separate is in a cluster at every zoom`, seen.length === 5 && seen.every(x => x[1] >= 2), seen);
      ok(`F2 ${nm}: "Zoom to these" is not offered while a member could not stand alone in its target window`, seen.every(x => !x[2]), seen);
      await setWin(p, [W, 0]); await p.click(`#xpl .cl[data-has~="${ID.p}"] > button`); await p.waitForTimeout(80);
      const list = await p.evaluate(i => [...document.querySelectorAll(`#xpl .cl[data-has~="${i}"] ul a.mk`)].map(a => a.dataset.entry), ID.p);
      ok(`F2 ${nm}: the list still holds every member and each is a link`, list.length === 3 && [ID.o, ID.p, ID.t].every(i => list.includes(i)), list);
      await c.close();
    }
    { // three that CAN all stand apart: offered, and after it each is its own mark
      const { J, buf } = fx(J => { point(J, 0, 300); }), c = await ctx(b, { cat: buf }), p = await open(c);
      await setWin(p, [O, 0]); let q = await snap(p); const k = q.clustered.find(x => x.has.includes(ID.p));
      ok('F2 three separable members (300, 251.9, 201.5 Ma) share a control at whole Earth and "Zoom to these" is offered', !!k && k.has.length === 3 && k.zoom, q.clustered);
      await p.click(`#xpl .cl[data-has~="${ID.p}"] > button`); await p.click(`#xpl .cl[data-has~="${ID.p}"] [data-zoomto]`); await p.waitForTimeout(150);
      q = await snap(p); const v = await view(p);
      ok('F2 after "Zoom to these" all three are separate marks inside the window', [ID.o, ID.p, ID.t].every(i => q.marks.some(m => m.id === i)) && !q.clustered.some(x => x.has.some(i => [ID.o, ID.p, ID.t].includes(i))), [v, q.marks.map(m => m.id), q.clustered]);
      checkPositions('F2 after zoom-to', q, v[0], v[1], J);
      await c.close();
    }
  }

  // ---------- E2. a saved window wins over the story's mark (GPT review of rev 2, H1) and the paths around it
  {
    const c = await ctx(b), p = await open(c);
    const click = sel => p.evaluate(s => document.querySelector(s).click(), sel);
    const st = () => p.evaluate(() => ({ len: history.length, s: history.state, hash: location.hash, open: !document.getElementById('detail').hidden, act: document.activeElement.id || (document.activeElement.dataset && document.activeElement.dataset.entry) || document.activeElement.tagName,
      sheet: document.getElementById('detail').classList.contains('tlsheet'), nav: !document.getElementById('d-nav').hidden, sel: (document.querySelector('#xpl a.mk.sel') || { dataset: {} }).dataset.entry || null }));
    await click('[data-act="reset"]'); await click('[data-act="in"]'); await click('[data-act="older"]');
    const X = await view(p);
    await p.click(`#xpl a.mk[data-entry="${ID.p}"]`); await p.waitForTimeout(250);
    await click('[data-act="in"]'); await p.waitForTimeout(80);
    const Y = await view(p); let s = await st();
    ok('E2 GPT\'s steps: 471.45–202.05, story open, Zoom in → 404.1–269.4 with the story still open and its mark outside the window', sameWin(X, [471.45, 202.05]) && sameWin(Y, [404.1, 269.4]) && s.open && s.s.entry === ID.p && sameWin(s.s.win, Y) && Y[1] > 251.941, [X, Y, s.s]);
    await p.goBack(); await p.waitForTimeout(250);
    ok('E2 Back restores 471.45–202.05', sameWin(await view(p), X) && !(await st()).open, await view(p));
    await p.goForward(); await p.waitForTimeout(250); s = await st();
    ok('E2 Forward restores the saved 404.1–269.4 exactly: the window is not re-centred on the story\'s mark', s.open && s.hash === '#' + ID.p && sameWin(await view(p), Y) && sameWin(s.s.win, Y), [await view(p), s.s.win]);
    await p.reload(); await settle(p); await p.waitForTimeout(150); s = await st();
    ok('E2 reload with that saved window: story open, window still 404.1–269.4', s.open && sameWin(await view(p), Y) && sameWin(s.s.win, Y) && s.act === ID.p + '-h', [await view(p), s]);
    // an explicit open of an entry outside the window still reveals it, at the same scale
    await p.goBack(); await p.waitForTimeout(250); await setWin(p, [150, 100]);
    await p.click(`#card-${ID.p} .ctitle a`); await p.waitForTimeout(250); let v = await view(p);
    ok('E2 an explicit open of an entry outside the window brings its mark in, span unchanged', near(v[0] - v[1], 50) && v[0] >= 251.941 && v[1] <= 251.941 && (await st()).sel === ID.p, v);
    await p.goBack(); await p.waitForTimeout(250);
    ok('E2 Back from that restores 150–100', sameWin(await view(p), [150, 100]), await view(p));
    // the change-record round trip with a saved window that excludes the story's mark
    await setWin(p, [W, 0]); await p.click(`#xpl a.mk[data-entry="${ID.t}"]`); await p.waitForTimeout(250);
    await click('[data-act="in"]'); await click('[data-act="older"]'); await click('[data-act="in"]'); await p.waitForTimeout(80);
    const Z = await view(p);
    await p.click('#d-body a[data-change]'); await p.waitForTimeout(250); s = await st();
    ok('E2 story with its mark outside the window → "Changed in": the record\'s entry carries the same window', Z[1] > 201.5 && !!s.s.change && sameWin(s.s.win, Z), [Z, s.s]);
    await click('[data-act="older"]'); await p.waitForTimeout(60); const Z2 = await view(p);
    await p.goBack(); await p.waitForTimeout(250); s = await st();
    ok('E2 Back from the record: story reopens with its own saved window, not re-centred, focus on the link used', s.open && s.s.entry === ID.t && sameWin(await view(p), Z) && /-chg-/.test(s.act), [await view(p), Z, s.act]);
    await p.goForward(); await p.waitForTimeout(250);
    ok('E2 Forward to the record restores the record\'s window', sameWin(await view(p), Z2), [await view(p), Z2]);
    // resize with a change record current, then with a story current: pixels change, the age window does not
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    ok('E2 resize 1280 → 390 on a change record: same age window, saved state unchanged', sameWin(await view(p), Z2) && sameWin(await p.evaluate(() => history.state.win), Z2), await view(p));
    await p.goBack(); await p.waitForTimeout(300); s = await st();
    ok('E2 at 390 Back from the record reopens the story as a sheet with the story\'s window', s.open && s.sheet && sameWin(await view(p), Z), [await view(p), s.sheet]);
    await p.setViewportSize({ width: 1280, height: 860 }); await p.waitForTimeout(300); s = await st();
    ok('E2 resize 390 → 1280 with the story open: it becomes the side panel, same age window', s.open && !s.sheet && sameWin(await view(p), Z) && sameWin(s.s.win, Z), [await view(p), s.sheet]);
    await p.goBack(); await p.waitForTimeout(250);
    ok('E2 Back closes it and restores the landing window', sameWin(await view(p), [W, 0]) && !(await st()).open, await view(p));
    // input that saves 200 ms later (keys, wheel), then Back or reload at once
    await p.click(`#xpl a.mk[data-entry="${ID.k}"]`); await p.waitForTimeout(250);
    const r1 = await p.evaluate(() => { const x = document.getElementById('xpl'); x.focus(); x.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true })); const v = [...window.TL_AXIS.view], saved = history.state.win; history.back(); return { v, saved }; });
    await p.waitForTimeout(250);
    ok('E2 key zoom then Back in the same instant: the window had not reached the state yet, and Back still restores the landing window', !sameWin(r1.v, r1.saved) && sameWin(await view(p), [W, 0]), r1);
    await p.goForward(); await p.waitForTimeout(250); s = await st();
    ok('E2 Forward then returns to the window the key press made, and writes it into the state', s.open && sameWin(await view(p), r1.v) && sameWin(s.s.win, r1.v), [await view(p), r1.v, s.s.win]);
    const r2 = await p.evaluate(() => { const x = document.getElementById('xpl'); x.click(); const q = x.getBoundingClientRect(); x.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, clientX: q.left + q.width / 2, clientY: q.top + 60, bubbles: true, cancelable: true })); const v = [...window.TL_AXIS.view], saved = history.state.win; location.reload(); return { v, saved }; });
    await p.waitForTimeout(400); await settle(p); await p.waitForTimeout(150);
    ok('E2 wheel zoom then reload in the same instant: the reloaded page has the zoomed window', !sameWin(r2.v, r2.saved) && sameWin(await view(p), r2.v) && (await st()).open, [r2, await view(p)]);
    // a plotted entry, then Pliny (no axis age), then a plotted entry again, all in one history entry
    await p.goto(BASE + '/timeline.html'); await settle(p); await click('[data-act="in"]'); const P0 = await view(p), len = (await st()).len;
    await p.click(`#xpl a.mk[data-entry="${ID.p}"]`); await p.waitForTimeout(250);
    await p.click(`#card-${ID.pl} .ctitle a`); await p.waitForTimeout(250); s = await st();
    ok('E2 story open → Pliny from its card: same history entry, window kept, no mark selected, no entry navigation, heading focused', s.len === len + 1 && s.s.entry === ID.pl && sameWin(s.s.win, P0) && sameWin(await view(p), P0) && s.sel === null && !s.nav && s.act === ID.pl + '-h', s);
    await p.click(`#xpl a.mk[data-entry="${ID.t}"]`); await p.waitForTimeout(250); s = await st();
    ok('E2 Pliny → a plotted entry from its mark: same history entry, mark selected, navigation back', s.len === len + 1 && s.s.entry === ID.t && s.sel === ID.t && s.nav && sameWin(await view(p), P0), s);
    await p.goBack(); await p.waitForTimeout(250); s = await st();
    ok('E2 Back closes it: window restored, focus on the control last used (the end-Triassic mark)', !s.open && sameWin(await view(p), P0) && s.act === ID.t, s);
    ok('E2: no page errors', p.errs.length === 0, p.errs);
    await c.close();
    // phone: the full change-record chain, with the window checked at every step
    const c2 = await ctx(b, { viewport: { width: 390, height: 844 } }), p2 = await open(c2);
    const st2 = () => p2.evaluate(() => ({ s: history.state, open: !document.getElementById('detail').hidden, act: document.activeElement.id || document.activeElement.tagName, inert: document.getElementById('tl-main').inert }));
    await p2.evaluate(() => { document.querySelector('[data-act="in"]').click(); document.querySelector('[data-act="newer"]').click(); }); const M = await view(p2);
    await p2.click(`#xpl a.mk[data-entry="${ID.t}"]`); await p2.waitForTimeout(300);
    await p2.click('#d-body a[data-change]'); await p2.waitForTimeout(300); let q = await st2();
    ok('E2 390: "Changed in" closes the sheet, focuses the record, keeps the window', !q.open && !q.inert && /^change-/.test(q.act) && !!q.s.change && sameWin(await view(p2), M), q);
    await p2.goBack(); await p2.waitForTimeout(300); q = await st2();
    ok('E2 390: Back reopens the sheet with focus on the link used, same window', q.open && /-chg-/.test(q.act) && sameWin(await view(p2), M), q);
    await p2.goForward(); await p2.waitForTimeout(300); q = await st2();
    ok('E2 390: Forward returns to the record, sheet closed, same window', !q.open && /^change-/.test(q.act) && sameWin(await view(p2), M), q);
    await p2.click('#change-' + REV + '-1-open'); await p2.waitForTimeout(300); q = await st2();
    ok('E2 390: "Open the entry" from the record opens the story', q.open && q.s.entry === ID.t && sameWin(await view(p2), M), q);
    await p2.goBack(); await p2.waitForTimeout(300); q = await st2();
    ok('E2 390: Back returns to the record with focus on "Open the entry"', !q.open && q.act === 'change-' + REV + '-1-open' && sameWin(await view(p2), M), q);
    ok('E2 390: no page errors', p2.errs.length === 0, p2.errs);
    await c2.close();
  }

  // ---------- E3. the "outside this view" status is true or empty (GPT review of rev 2, H3)
  {
    const c = await ctx(b), p = await open(c);
    const stat = () => p.evaluate(() => ({ t: document.getElementById('tl-xstat').textContent, role: document.getElementById('tl-xstat').getAttribute('role'), act: document.activeElement.id || (document.activeElement.dataset && document.activeElement.dataset.entry) || document.activeElement.tagName }));
    const lose = () => p.evaluate(i => { const x = document.getElementById('xpl'); x.focus(); x.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      document.querySelector(`#xpl a.mk[data-entry="${i}"]`).focus(); const q = x.getBoundingClientRect();
      for (let n = 0; n < 6; n++) x.dispatchEvent(new WheelEvent('wheel', { deltaY: -600, clientX: q.left + 20, clientY: q.top + 60, bubbles: true, cancelable: true })); return [...window.TL_AXIS.view]; }, ID.k);
    let v = await lose(), s = await stat();
    ok('E3 a focused mark leaves the window: focus goes to the explorer and the status line names it', v[1] > 66.02 && s.act === 'xpl' && s.t === 'End-Cretaceous mass extinction is outside this view.' && s.role === 'status', [v, s]);
    await p.evaluate(() => { const x = document.getElementById('xpl'); for (let n = 0; n < 12; n++) x.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true, cancelable: true })); });
    s = await stat(); v = await view(p);
    ok('E3 the mark is back in the window (zoomed out by keyboard, focus still on the explorer): the status line is empty', v[1] <= 66.02 && v[0] >= 66.02 && s.act === 'xpl' && s.t === '', [v, s]);
    await p.evaluate(() => document.querySelector('[data-act="reset"]').click()); await lose();
    ok('E3 lost again …', (await stat()).t !== '');
    await p.click('[data-act="reset"]'); await p.waitForTimeout(60); s = await stat();
    ok('E3 … then Reset view: empty', s.t === '' && sameWin(await view(p), [W, 0]), s);
    await lose(); await p.click(`#card-${ID.t} .ctitle a`); await p.waitForTimeout(250); s = await stat();
    ok('E3 lost, then another story is opened: empty', s.t === '' && s.act === ID.t + '-h', s);
    await p.click('#d-body a[data-change]'); await p.waitForTimeout(250);
    ok('E3 still empty on the change record', (await stat()).t === '');
    await c.close();
  }

  // ---------- G. an interval that crosses the window edge is drawn clipped, marked as continuing, with its real ends in text
  {
    const J = JSON.parse(CAT.toString('utf8')); J.entries[0].claims[0].when.to_ma = 425; J.entries[0].claims[0].when_text = '~445–425 Ma'; const fx = Buffer.from(JSON.stringify(J));
    const c = await ctx(b, { cat: fx }), p = await open(c);
    for (const [win, l, r, txt] of [[[440, 430], true, true, 'both sides'], [[450, 436], false, true, 'the newer side'], [[434, 420], true, false, 'the older side'], [[460, 420], false, false, null]]) {
      await setWin(p, win); const s = await snap(p), m = s.marks.find(x => x.id === ID.o);
      checkPositions(`G ${win}`, s, win[0], win[1], J);
      ok(`G ${win}: drawn although its midpoint (435) ${win[0] >= 435 && win[1] <= 435 ? 'is inside' : 'is outside'}; clip marks ${l ? 'older ' : ''}${r ? 'newer' : ''}; real ends in its label`, !!m && /clipl/.test(m.cls) === l && /clipr/.test(m.cls) === r
        && /~445–425 Ma/.test(m.label) && (txt ? m.label.includes('Continues beyond this view on ' + txt) : !/Continues/.test(m.label)), m);
    }
    await setWin(p, [424, 400]);
    ok('G 424–400: an interval wholly outside the window is not drawn', !(await snap(p)).marks.some(x => x.id === ID.o));
    await c.close();
  }

  // ---------- H. empty window; dense fixture (200 entries)
  {
    const c = await ctx(b), p = await open(c);
    await setWin(p, [150, 100]);
    let s = await snap(p);
    ok('H empty window: says "No reviewed entries in this range" and offers the nearest entries', s.empty && s.marks.length === 0 && /No reviewed entries in this range\./.test(await p.textContent('#xpl .nomk')));
    await p.click('#xpl .nomk button'); await p.waitForTimeout(120);
    s = await snap(p); const v = await view(p);
    ok('H "Go to the nearest entries": same span, an entry now in view, focus kept inside the explorer', near(v[0] - v[1], 50) && s.marks.length >= 1 && !s.empty && await p.evaluate(() => !!document.activeElement.closest('#xpl')), [v, s.marks.length]);
    await c.close();
    // 200 entries: every one reachable, positions still true, no overflow
    const J = JSON.parse(CAT.toString('utf8')); let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const base = J.entries[2]; J.entries = []; let arts = '';
    for (let i = 0; i < 200; i++) { const e = JSON.parse(JSON.stringify(base)); e.id = 'e-fx-' + i; e.title = 'Fixture entry ' + i; e.short = 'F' + i; e.revisions = [];
      e.claims[0].when.ma = Math.round(rnd() * 5300000) / 10000 + 2; J.entries.push(e);
      arts += `<article class="entry ep" id="${e.id}" aria-labelledby="${e.id}-h"><h3 class="eh" id="${e.id}-h" tabindex="-1">${e.title}</h3></article>`; }
    J.changes = J.changes.filter(x => false); J.shelf.forEach(x => { x.revisions = []; });
    const fx = Buffer.from(JSON.stringify(J)), html = HTML.replace('<section id="entries" class="entries" aria-label="Entries in full">', '<section id="entries" class="entries" aria-label="Entries in full">' + arts);
    for (const [w, h] of [[1280, 860], [390, 844]]) {
      const c2 = await ctx(b, { cat: fx, html, viewport: { width: w, height: h } }), p2 = await open(c2);
      s = await snap(p2);
      const reach = new Set([...s.marks.map(m => m.id), ...s.clustered.flatMap(x => x.has)]);
      ok(`H dense ${w}: explorer on; all 200 entries are a mark or in a cluster list; no page overflow`, (await p2.evaluate(() => window.TL_AXIS.state)) === 'on' && reach.size === 200 && s.sw <= s.iw, [await p2.evaluate(() => window.TL_AXIS), reach.size, s.sw, s.iw]);
      checkPositions(`H dense ${w}`, s, W, 0, J);
      ok(`H dense ${w}: every cluster count equals its list`, s.clustered.every(x => +x.n === x.has.length) && s.clustered.length > 5 && Math.max(...s.clustered.map(x => x.has.length)) <= 60, [s.clustered.length, Math.max(...s.clustered.map(x => x.has.length))]);
      if (PERF && w === 1280) await perf(p2, '200-entry fixture, 1280×860');
      await c2.close();
    }
  }

  // ---------- I. no request of any kind on pan, zoom or selection
  {
    const c = await ctx(b), p = await open(c);
    await p.waitForTimeout(600);
    const reqs = []; p.on('request', r => reqs.push(r.url()));
    for (const s of ['in', 'older', 'out', 'newer']) await p.evaluate(a => document.querySelector(`[data-act="${a}"]`).click(), s);
    await p.evaluate(() => document.querySelector('[data-preset="earth"]').click());
    await p.evaluate(() => document.querySelector('[data-preset="complex"]').click());
    await p.click(`#xpl a.mk[data-entry="${ID.k}"]`); await p.waitForTimeout(200);
    await p.click('#d-older'); await p.waitForTimeout(150);
    await p.click('#d-close'); await p.waitForTimeout(200);
    const T = await p.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { x: r.left + 300, y: r.top + 90 }; });
    await p.mouse.move(T.x, T.y); await p.mouse.down(); await p.mouse.move(T.x + 150, T.y, { steps: 5 }); await p.mouse.up();
    await p.mouse.click(T.x, T.y); await p.mouse.wheel(0, -400); await p.waitForTimeout(500);
    ok('I after load: pan, zoom, presets, drag, wheel, opening, switching and closing a story make zero requests', reqs.length === 0, reqs);
    await c.close();
  }

  // ---------- J. the story: existing claims regrouped, nothing added; older / newer plotted entry
  {
    const c = await ctx(b, { js: false }), p = await open(c);
    const arts = await p.evaluate(() => [...document.querySelectorAll('article.entry.ep')].map(a => ({ id: a.id, scope: (a.querySelector(':scope > .scope') || {}).textContent || null,
      top: [...a.children].map(x => x.tagName + (x.dataset.grp ? ':' + x.dataset.grp : x.className ? '.' + x.className : '')),
      groups: [...a.querySelectorAll(':scope > section.grp')].map(g => ({ k: g.dataset.grp, h: g.querySelector(':scope > h4').textContent, kids: [...g.children].map(x => x.tagName + (x.className ? '.' + x.className.split(' ').join('.') : '')),
        claims: [...g.querySelectorAll(':scope > section.claim')].map(s => ({ id: s.id, type: s.dataset.claimType, h: s.querySelector('h5').textContent, val: (s.querySelector('.cval') || {}).textContent || null,
          ps: [...s.querySelectorAll(':scope > p:not(.cval):not(.srcnote)')].map(x => x.textContent), src: [...s.querySelectorAll('.srcnote a')].map(x => x.getAttribute('href')) })) })) })));
    const HEAD = { how: 'How we know', context: 'Context and limits', chart: 'Chart reference', review: 'Review and changes' }, grp = t => t === 'chart_boundary' ? 'chart' : t === 'context' ? 'context' : 'how';
    const bad = [];
    for (const e of C.entries) { const a = arts.find(x => x.id === e.id); if (!a) { bad.push([e.id, 'missing']); continue; }
      if (a.top.some(t => !/^(H3\.eh|P\.scope|SECTION:(how|context|chart|review))$/.test(t))) bad.push([e.id, 'something outside the groups', a.top]);
      if ((a.scope || null) !== (e.scope || null)) bad.push([e.id, 'scope']);
      const want = ['how', 'context', 'chart'].filter(k => e.claims.some(q => grp(q.claim_type) === k)).concat('review');
      if (a.groups.map(g => g.k).join() !== want.join() || a.groups.some(g => g.h !== HEAD[g.k])) bad.push([e.id, 'groups', a.groups.map(g => [g.k, g.h])]);
      const flat = a.groups.flatMap(g => g.claims.map(q => ({ ...q, g: g.k })));
      e.claims.forEach((q, n) => { const s = flat[n];
        if (!s || s.id !== `${e.id}-c${n}` || s.type !== q.claim_type || s.h !== q.label || s.g !== grp(q.claim_type) || (s.val || null) !== (q.when_text || null)) return bad.push([e.id, n, 'claim identity, label, value or group', s]);
        const exp = [q.text].concat(q.assumptions ? ['Assumes: ' + q.assumptions.join('; ') + '.'] : []);
        if (s.ps.join('|') !== exp.join('|')) bad.push([e.id, n, 'claim text', s.ps]);
        const urls = [q.source, q.also].filter(Boolean).map(x => x.url);
        if (s.src.join() !== urls.join()) bad.push([e.id, n, 'source link beside the claim', s.src]); });
      if (flat.length !== e.claims.length) bad.push([e.id, 'claim count']);
      for (const g of a.groups) if (g.k !== 'review' && g.kids.some(k => !/^(H4\.gh|SECTION\.es\.claim)$/.test(k))) bad.push([e.id, g.k, 'something other than its claims', g.kids]);
      const rv = a.groups.find(g => g.k === 'review'); if (!rv || rv.kids.some(k => !/^(H4\.gh|SECTION\.es\.earlier|P\.rev)$/.test(k))) bad.push([e.id, 'review group', rv && rv.kids]); }
    ok('J (JavaScript off) every claim keeps its id, label, value, text and source link, under its heading; the chart boundary is alone under "Chart reference"; nothing else is in the story', bad.length === 0, bad);
    await c.close();
    const c2 = await ctx(b), p2 = await open(c2);
    const nav = () => p2.evaluate(() => ({ hidden: document.getElementById('d-nav').hidden, o: document.getElementById('d-older').getAttribute('aria-disabled'), n: document.getElementById('d-newer').getAttribute('aria-disabled'),
      msg: document.getElementById('d-navmsg').textContent, wide: !document.getElementById('d-wide').hidden, hash: location.hash, len: history.length, entry: history.state && history.state.entry, pos: document.getElementById('d-pos').textContent,
      labels: [document.getElementById('d-older').getAttribute('aria-label'), document.getElementById('d-newer').getAttribute('aria-label')] }));
    await p2.click(`#xpl a.mk[data-entry="${ID.p}"]`); await p2.waitForTimeout(250);
    let n = await nav(); const len = n.len;
    ok('J story open: older and newer plotted entry are offered and named as navigation on this view', !n.hidden && n.o === 'false' && n.n === 'false' && n.msg === '' && n.labels.join('|') === 'Older plotted entry on this view|Newer plotted entry on this view', n);
    await p2.click('#d-older'); await p2.waitForTimeout(200); n = await nav();
    ok('J older: the Frasnian–Famennian story replaces it in the same history entry, and is announced', n.hash === '#' + ID.ff && n.entry === ID.ff && n.len === len && /Frasnian–Famennian/.test(n.pos) && await p2.evaluate(i => !!document.querySelector(`#d-body #${i}`) && !!document.querySelector(`#xpl a.mk.sel[data-entry="${i}"]`), ID.ff), n);
    await p2.click('#d-older'); await p2.waitForTimeout(200); n = await nav();
    ok('J at the oldest: Older is unavailable and the panel says there are no older plotted entries', n.hash === '#' + ID.o && n.o === 'true' && /^No older plotted entries on the timeline\.$/.test(n.msg) && !n.wide, n);
    await p2.goBack(); await p2.waitForTimeout(200);
    ok('J Back after two switches closes the story (one history entry in all) and focus goes to the mark now shown', await p2.evaluate(i => document.getElementById('detail').hidden && location.hash === '' && document.activeElement.dataset.entry === i, ID.o));
    // a window with one entry: no neighbours in this view; the wider look is a separate, explicit action
    await setWin(p2, [252.3, 251.3]);
    await p2.click(`#xpl a.mk[data-entry="${ID.p}"]`); await p2.waitForTimeout(250); n = await nav();
    ok('J one entry in view: both directions unavailable, "No other plotted entries in this view.", and "Look in the whole timeline" offered', n.o === 'true' && n.n === 'true' && n.msg === 'No other plotted entries in this view.' && n.wide, n);
    await p2.click('#d-wide'); await p2.waitForTimeout(100); n = await nav();
    ok('J after "Look in the whole timeline": both neighbours are offered', n.o === 'false' && n.n === 'false' && !n.wide, n);
    await p2.click('#d-newer'); await p2.waitForTimeout(250); n = await nav(); const v = await view(p2);
    ok('J newer (whole timeline): end-Triassic opens, its mark is brought into view at the same scale', n.hash === '#' + ID.t && near(v[0] - v[1], 1) && v[0] >= 201.5 && v[1] <= 201.5, [n.hash, v]);
    ok('J: no page errors', p2.errs.length === 0, p2.errs);
    await c2.close();
  }

  // ---------- K. layout and input: widths, enlarged text, text spacing, touch, reduced motion, coverage plans
  for (const [w, h, extra, nm] of [[360, 740, {}, '360'], [390, 844, {}, '390'], [768, 1024, {}, '768'], [1024, 768, {}, '1024'], [1280, 860, {}, '1280'], [640, 430, { deviceScaleFactor: 2 }, '1280 at 200% zoom'], [1280, 500, {}, '1280×500 (short)']]) {
    const c = await ctx(b, { viewport: { width: w, height: h }, extra }), p = await open(c);
    const m = async () => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, small: [...document.querySelectorAll('#axis .tbar button, #axis .tbar a')].filter(x => x.getBoundingClientRect().height < 44 || x.getBoundingClientRect().width < 44).length,
      clipped: [...document.querySelectorAll('#axis .tbar button, #axis .tbar a, #axis .plans, #tl-win, #tl-whint')].filter(x => x.scrollWidth > x.clientWidth + 1).length, tw: document.querySelector('#xpl .track').getBoundingClientRect().width }));
    let r = await m();
    ok(`K ${nm}: no page overflow; toolbar targets at least 44 px; no clipped control or text`, r.sw <= r.iw && r.small === 0 && r.clipped === 0, r);
    await p.click(`#xpl a.mk[data-entry="${ID.k}"], #xpl .cl > button`); await p.waitForTimeout(150);
    if (!(await p.evaluate(() => !document.getElementById('detail').hidden))) { await p.click(`#xpl .cl ul a.mk`); }
    await p.waitForTimeout(300); r = await m();
    ok(`K ${nm}: with a story open, no page overflow; ${w > 720 ? 'the explorer keeps at least 300 px of plotting width' : 'the sheet covers the page'}`, r.sw <= r.iw && (w > 720 ? r.tw >= 300 : await p.evaluate(() => document.getElementById('detail').getAttribute('aria-modal') === 'true')), r);
    const s = await snap(p), v = await view(p); if (w > 720) checkPositions(`K ${nm} story open`, s, v[0], v[1]);
    await c.close();
  }
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } }), p = await open(c);
    await p.addStyleTag({ content: '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}' }); await p.setViewportSize({ width: 391, height: 844 }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bandClip: [...document.querySelectorAll('#xpl .band b')].filter(x => x.scrollWidth > x.clientWidth + 1).length,
      clipped: [...document.querySelectorAll('#axis .tbar button, #axis .tbar a')].filter(x => x.scrollWidth > x.clientWidth + 1).length }));
    ok('K 390 with WCAG text spacing: no page overflow, no clipped control or band label', r.sw <= r.iw && r.bandClip === 0 && r.clipped === 0, r);
    const plans = await p.evaluate(() => { const e = document.querySelector('#axis .plans'); return { text: e.textContent, stops: e.querySelectorAll('a,button,[tabindex],input').length + (e.hasAttribute('tabindex') ? 1 : 0), tag: e.tagName, role: e.getAttribute('role') }; });
    ok('K coverage plans: plain text in the catalogue\'s words, not controls, no Tab stop', plans.text === 'Not on the timeline yet: Human relatives (no entries yet) · Human history (no dated entries on the axis yet)' && plans.stops === 0 && plans.tag === 'SPAN' && !plans.role, plans);
    await c.close();
    const c2 = await ctx(b, { extra: { reducedMotion: 'reduce' } }), p2 = await open(c2);
    ok('K reduced motion: nothing in the explorer animates', await p2.evaluate(() => [...document.querySelectorAll('#axis, #axis *')].every(x => { const s = getComputedStyle(x); return (s.transitionDuration || '0s').split(',').every(d => parseFloat(d) === 0) && s.animationName === 'none'; })));
    await c2.close();
    // touch-enabled browser context (not a real device): a horizontal drag pans, a tap opens
    const c3 = await ctx(b, { viewport: { width: 390, height: 844 }, extra: { hasTouch: true, isMobile: true } }), p3 = await open(c3);
    await p3.evaluate(() => document.getElementById('xpl').scrollIntoView({ block: 'center' })); await p3.waitForTimeout(100);
    const T = await p3.evaluate(() => { const r = document.querySelector('#xpl .track').getBoundingClientRect(); return { x: r.left + 120, y: r.top + 90, w: r.width }; });
    const cdp = await c3.newCDPSession(p3), tp = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: T.y }] });
    await tp('touchStart', T.x); for (let i = 1; i <= 6; i++) { await tp('touchMove', T.x + i * 15); await p3.waitForTimeout(20); } await tp('touchEnd'); await p3.waitForTimeout(250);
    let v = await view(p3);
    ok('K touch context: a 90 px horizontal drag pans towards the past and opens nothing', v[0] > W + 50 && near(v[0] - v[1], W) && await p3.evaluate(() => document.getElementById('detail').hidden), v);
    await p3.evaluate(() => document.querySelector('[data-act="reset"]').click()); await p3.waitForTimeout(100);
    const mk = await p3.evaluate(i => { const r = document.querySelector(`#xpl a.mk[data-entry="${i}"] .gw`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, ID.k);
    await p3.touchscreen.tap(mk.x, mk.y); await p3.waitForTimeout(300);
    ok('K touch context: a tap on a mark opens its story in the sheet', await p3.evaluate(i => !document.getElementById('detail').hidden && location.hash === '#' + i && document.getElementById('detail').classList.contains('tlsheet'), ID.k));
    await c3.close();
  }

  // ---------- L. the catalogue is byte-identical and the generator agrees with the page
  ok('L catalogue file unchanged: sha256 2f39aa30…0356', SHA === '2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356', SHA);
  if (!OLD) { let out = ''; try { out = execFileSync('python3', [path.join(ROOT, 'phase1/timeline/build_timeline.py'), '--check'], { cwd: ROOT }).toString(); } catch (e) { out = 'FAILED ' + (e.stdout || '') + (e.stderr || ''); }
    ok('L build_timeline.py --check passes (page, catalogue and script build agree)', /match the generator output/.test(out), out.slice(0, 300)); }

  if (PERF) { const c = await ctx(b), p = await open(c); await perf(p, 'five entries, 1280×860, story closed');
    await p.click(`#xpl a.mk[data-entry="${ID.k}"]`); await p.waitForTimeout(400); await perf(p, 'five entries, 1280×860, story open'); await c.close();
    const c2 = await ctx(b, { viewport: { width: 390, height: 844 } }), p2 = await open(c2); await perf(p2, 'five entries, 390×844'); await c2.close(); }

  await b.close();
  console.log(`timeline-travel-ui: ${pass} pass, ${fail} fail${BREAK ? ' (BREAK=' + BREAK + ')' : ''}${OLD ? ' (OLD: main\'s page)' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL suite threw', String(e && e.stack || e).slice(0, 600)); console.log(`timeline-travel-ui: ${pass} pass, ${fail + 1} fail (threw)`); process.exit(1); });

// timing: one zoom step and one pan step by the page's own buttons. "work" = click() returning (the handler redraws
// synchronously); "visual" = the same start to the second animation frame after it. 20 warm-up, 200 samples, 3 runs.
async function perf(p, label) {
  for (let run = 1; run <= 3; run++) {
    const r = await p.evaluate(async () => { const q = s => document.querySelector(s), seq = ['in', 'older', 'out', 'newer'], work = [], vis = [];
      const raf2 = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      for (let i = 0; i < 220; i++) { const b = q(`[data-act="${seq[i % 4]}"]`), t0 = performance.now(); b.click(); const t1 = performance.now(); await raf2(); const t2 = performance.now(); if (i >= 20) { work.push(t1 - t0); vis.push(t2 - t0); } }
      const st = a => { a.sort((x, y) => x - y); return { median: +a[Math.floor(a.length / 2)].toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2), max: +a[a.length - 1].toFixed(2) }; };
      q('[data-act="reset"]').click(); return { work: st(work), visual: st(vis) }; });
    console.log(`PERF ${label} run ${run}: script+redraw ms ${JSON.stringify(r.work)} · to second frame ms ${JSON.stringify(r.visual)}`);
  }
}
