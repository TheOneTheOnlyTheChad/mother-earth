/*
 * Timeline deep-time axis (TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §1–§5). The hub route is answered by Playwright
 * from the committed catalogue file (with CORS headers), or failed on purpose for each §4a case. CORS itself is checked in the live RC
 * (GitHub Pages origin → Worker): Playwright-fulfilled responses are not subject to CORS.
 *
 * Run: node phase1/timeline-axis.test.cjs [base-url]   (static server on the repo, default http://127.0.0.1:8899)
 * Breaks (each must make the suite fail): BREAK=no-hash-check|no-build-check|no-validate|focusable-empties|no-timeout
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const ROOT = path.resolve(__dirname, '..');
const BREAK = process.env.BREAK || '';
const CAT = fs.readFileSync(path.join(ROOT, 'phase1/timeline/catalogue/tl-2026-11-R1.json'));
const HTML = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8');
const JS0 = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SHA = sha(CAT);
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info === undefined ? '' : JSON.stringify(info).slice(0, 400)); } };
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('break anchor missing: ' + a.slice(0, 60)); return s.replace(a, b); };
const JS = (() => {
  if (BREAK === 'no-hash-check') return must(JS0, "if (sha !== wrap.dataset.catalogueSha) return off('revision mismatch');", '');
  if (BREAK === 'no-build-check') return must(JS0, "if (wrap.dataset.build !== BUILD) return off('build');", '');
  if (BREAK === 'no-validate') return must(JS0, "const bad = validate(c); if (bad) return off('validation: ' + bad);", '');
  if (BREAK === 'focusable-empties') return must(JS0, '`<div class="lr empty">', '`<div class="lr empty" tabindex="0">');
  if (BREAK === 'no-timeout') return must(JS0, 'const TIMEOUT_MS = 10000;', 'const TIMEOUT_MS = 600000;');
  return JS0;
})();
const ID = { o: 'e-big5-end-ordovician', ff: 'e-big5-frasnian-famennian', p: 'e-big5-end-permian', t: 'e-big5-end-triassic', k: 'e-big5-end-cretaceous' };

// page variants: the real page, or one whose embedded hash / revision / build is changed
const page = (o = {}) => {
  let h = HTML;
  if (o.sha) h = h.replace(`data-catalogue-sha="${SHA}"`, `data-catalogue-sha="${o.sha}"`);
  if (o.rev) h = h.replace('data-catalogue-rev="tl-2026-11-R1"', `data-catalogue-rev="${o.rev}"`);
  if (o.build) h = h.replace(/data-build="\d+"/, `data-build="${o.build}"`);
  return h;
};
// hub behaviours
const HUB = /mother-earth\.chadoberholzer\.workers\.dev\/catalogue\/timeline/;
const serve = (body, extra = {}) => r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', ...extra.headers }, body });
async function ctx(b, { hub = serve(CAT), html = null, viewport = { width: 1280, height: 860 }, js = true } = {}) {
  const c = await b.newContext({ viewport, javaScriptEnabled: js });
  await c.route(/fonts\.googleapis|unpkg|gibs|jsdelivr|thelatinlibrary|doi\.org|stratigraphy|creativecommons/, r => r.abort());
  await c.route(HUB, hub);
  await c.route(/timeline\.js/, r => r.fulfill({ contentType: 'application/javascript', body: JS }));
  if (html) await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: html }));
  return c;
}
const settle = p => p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending', null, { timeout: 20000 });
const axisInfo = p => p.evaluate(() => {
  const ax = document.getElementById('axis'), off = document.getElementById('axis-off');
  return { state: window.TL_AXIS.state, reason: window.TL_AXIS.reason, axisHidden: ax.hidden, offShown: !off.hidden && !!off.offsetParent,
    marks: [...document.querySelectorAll('#axis a.mk')].map(a => ({ id: a.dataset.entry, cls: a.className, x: a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2, label: a.getAttribute('aria-label') })),
    listCards: document.querySelectorAll('#dated .card').length, sw: document.documentElement.scrollWidth, iw: innerWidth };
});

(async () => {
  const b = await chromium.launch();

  // ---------- A. axis on: shapes, order, labels, lanes, overflow
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [1280, 860]]) {
    const c = await ctx(b, { viewport: { width: w, height: h } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html'); await settle(p);
    const a = await axisInfo(p);
    ok(`${w}: axis on`, a.state === 'on' && !a.axisHidden && !a.offShown, a);
    ok(`${w}: no horizontal overflow`, a.sw <= a.iw, [a.sw, a.iw]);
    ok(`${w}: five marks, oldest on the left`, a.marks.length === 5 && a.marks.map(m => m.id).join() === [ID.o, ID.ff, ID.p, ID.t, ID.k].join() && a.marks.every((m, i) => !i || m.x > a.marks[i - 1].x), a.marks.map(m => [m.id, Math.round(m.x)]));
    const e = await p.evaluate(() => { const em = document.querySelector('#axis .empties'); return { h: em.getBoundingClientRect().height, rows: em.querySelectorAll('.lr.empty').length,
      text: [...em.querySelectorAll('.lr.empty')].map(r => r.textContent.trim()), focusables: em.querySelectorAll('a,button,[tabindex],input').length }; });
    ok(`${w}: three empty lanes, zero Tab stops`, e.rows === 3 && e.focusables === 0, e);
    ok(`${w}: empty lane wording`, e.text.join('|') === 'Earth systems and life · No entries yet|Human relatives · No entries yet|Human history · No dated entries on the axis yet', e.text);
    if (w === 390) ok('390×844: three empty rows ≤ 96 CSS px together', e.h <= 96, e.h);
    if (w === 390) {
      // larger text: rows wrap and grow, no clipping, no horizontal scroll
      await p.addStyleTag({ content: 'body.tl .axis .lr.empty{font-size:26px !important;line-height:34px !important}' });
      const g = await p.evaluate(() => { const rows = [...document.querySelectorAll('#axis .lr.empty')];
        return { clipped: rows.some(r => r.scrollWidth > r.clientWidth + 1 || r.scrollHeight > r.clientHeight + 1), h: document.querySelector('#axis .empties').getBoundingClientRect().height, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
      ok('390 larger text: empty rows wrap and grow without clipping or horizontal scroll', !g.clipped && g.h > e.h && g.sw <= g.iw, g);
    }
    if (w === 1280) {
      const cls = Object.fromEntries(a.marks.map(m => [m.id, m.cls]));
      ok('shape: end-Ordovician = approximate interval', /mk-int-approx/.test(cls[ID.o]), cls[ID.o]);
      ok('shape: Frasnian–Famennian = modelled range glyph + bound marker', /mk-modelled/.test(cls[ID.ff]) && /mk-bound/.test(cls[ID.ff]), cls[ID.ff]);
      ok('shape: end-Permian = measured point', /mk-measured/.test(cls[ID.p]), cls[ID.p]);
      ok('shape: end-Triassic = approximate point', /mk-approx\b/.test(cls[ID.t]) && !/int-approx/.test(cls[ID.t]), cls[ID.t]);
      ok('shape: end-Cretaceous = point (no uncertainty) tied to the dated impact', /mk-point/.test(cls[ID.k]) && /mk-tied/.test(cls[ID.k]), cls[ID.k]);
      const shapes = new Set(a.marks.map(m => m.cls.split(' ').filter(x => x.startsWith('mk-')).sort().join(' ')));
      ok('every shape is drawn distinctly (five different classes)', shapes.size === 5, [...shapes]);
      const L = Object.fromEntries(a.marks.map(m => [m.id, m.label]));
      ok('label: F–F names both claim types with their values', /Boundary age: no older than 372\.4 Ma/.test(L[ID.ff]) && /Modelled boundary-age range: 371\.93–371\.78 Ma/.test(L[ID.ff]), L[ID.ff]);
      ok('label: end-Permian onset with stated uncertainty', /Estimated extinction onset: 251\.941 ± 0\.037 Ma/.test(L[ID.p]), L[ID.p]);
      ok('label: end-Cretaceous impact age + placement tied', /Impact age: 66\.02 Ma/.test(L[ID.k]) && /Extinction placed at the dated impact/.test(L[ID.k]), L[ID.k]);
      ok('label: end-Ordovician approximate interval', /Approximate extinction interval: ~445–443 Ma/.test(L[ID.o]), L[ID.o]);
      const d = await p.evaluate(() => ({ pliny: !!document.querySelector('#axis [data-entry="e-pliny-ep-6-16"]'), ov: !!document.querySelector('#axis .ovwin'),
        win: document.querySelector('#axis .win').textContent, bands: document.querySelectorAll('#axis .band').length, cb: document.querySelectorAll('#axis .cb').length,
        key: document.querySelector('#axis .key').textContent, lanesHidden: getComputedStyle(document.querySelector('.lanes')).display === 'none' }));
      ok('Pliny is never on the axis', !d.pliny);
      ok('overview strip with the explorable window marked; window line says "this release"', d.ov && /This release: the last ~538\.8 million years/.test(d.win), d.win);
      ok('12 period bands from the chart; 5 chart-boundary lines', d.bands === 12 && d.cb === 5, [d.bands, d.cb]);
      ok('key explains every glyph', ['uncertainty stated', 'uncertainty not stated', 'placed at a dated event', 'approximate interval', 'modelled range', 'no older than'].every(s => d.key.includes(s)), d.key);
      ok('static lane list hidden once the axis is drawn (one view, not two)', d.lanesHidden);
    }
    await c.close();
  }

  // ---------- B. keyboard and panel from a mark; Back/Forward; focus return
  for (const [w, h] of [[1280, 860], [390, 844]]) {
    const c = await ctx(b, { viewport: { width: w, height: h } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html'); await settle(p);
    await p.focus('#axis a.mk[data-entry="' + ID.p + '"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    let s = await p.evaluate(() => ({ open: !document.getElementById('detail').hidden, hash: location.hash, active: document.activeElement.id, role: document.getElementById('detail').getAttribute('role') }));
    ok(`${w}: Enter on a mark opens its entry (heading focused)`, s.open && s.hash === '#' + ID.p && s.active === ID.p + '-h' && s.role === (w <= 720 ? 'dialog' : 'region'), s);
    const types = await p.evaluate(id => [...document.querySelectorAll(`#d-body #${id} section.claim`)].map(x => x.dataset.claimType), ID.p);
    ok(`${w}: the open entry shows the onset, the context items and the chart boundary separately`, types.join() === 'extinction_onset_estimate,context,context,chart_boundary', types);
    await p.goBack(); await p.waitForTimeout(150);
    s = await p.evaluate(() => ({ open: !document.getElementById('detail').hidden, act: document.activeElement.dataset ? document.activeElement.dataset.entry : null, cls: document.activeElement.className }));
    ok(`${w}: Back closes and returns focus to the mark`, !s.open && s.act === 'e-big5-end-permian' && /\bmk\b/.test(s.cls), s);
    await p.goForward(); await p.waitForTimeout(150);
    ok(`${w}: Forward reopens`, await p.evaluate(() => !document.getElementById('detail').hidden && location.hash === '#e-big5-end-permian'));
    await p.click('#d-close'); await p.waitForTimeout(150);
    ok(`${w}: Close returns focus to the mark`, await p.evaluate(() => document.activeElement.dataset.entry === 'e-big5-end-permian' && document.activeElement.classList.contains('mk')));
    // keyboard order: marks are reachable with Tab; nothing in the empty lanes takes focus
    await p.focus('#axis-h').catch(() => {}); await p.evaluate(() => document.getElementById('axis-h').setAttribute('tabindex', '-1')); await p.focus('#axis-h');
    const seen = [];
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); seen.push(await p.evaluate(() => (document.activeElement.dataset && document.activeElement.dataset.entry) || document.activeElement.className || document.activeElement.tagName)); }
    ok(`${w}: Tab reaches the five marks in order`, seen.slice(0, 5).join() === [ID.o, ID.ff, ID.p, ID.t, ID.k].join(), seen);
    await c.close();
  }

  // ---------- C. §4a failures: the list stays usable, the axis is not drawn
  const cases = [
    ['404 (old hub)', { hub: r => r.fulfill({ status: 404, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"error":"unknown"}' }) }, /http 404/],
    ['503 unavailable', { hub: r => r.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"status":"unavailable"}' }) }, /http 503/],
    ['network error', { hub: r => r.abort() }, /network/],
    // CORS is not enforced on Playwright-fulfilled responses, so the real CORS check is the live RC from the GitHub Pages origin against the Worker (§4a)
    ['different revision served (one byte changed)', { hub: serve(Buffer.from(CAT.toString('utf8').replace('"tl-2026-11-R1"', '"tl-2026-11-R2"'))) }, /revision mismatch/],
    ['page expects another revision', { html: page({ sha: 'a'.repeat(64) }) }, /revision mismatch/],
    ['HTML and script from different builds', { html: page({ build: '202601010000' }) }, /^build$/],
  ];
  const bad1 = Buffer.from('{"catalogue":"timeline",'); cases.push(['hash matches but not parseable', { hub: serve(bad1), html: page({ sha: sha(bad1) }) }, /parse/]);
  const J = JSON.parse(CAT.toString('utf8')); J.claim_labels.context = 'Background';
  const bad2 = Buffer.from(JSON.stringify(J)); cases.push(['hash matches but fails validation (a label changed)', { hub: serve(bad2), html: page({ sha: sha(bad2) }) }, /validation: claim labels/]);
  const J3 = JSON.parse(CAT.toString('utf8')); J3.entries[2].claims[0].when.ma = 9999;
  const bad3 = Buffer.from(JSON.stringify(J3)); cases.push(['hash matches but a value is outside the window', { hub: serve(bad3), html: page({ sha: sha(bad3) }) }, /validation: outside window/]);
  const J4 = JSON.parse(CAT.toString('utf8')); J4.shelf[0].axis = true;
  const bad4 = Buffer.from(JSON.stringify(J4)); cases.push(['hash matches but Pliny marked for the axis', { hub: serve(bad4), html: page({ sha: sha(bad4) }) }, /validation: shelf/]);
  for (const [name, o, why] of cases) {
    const c = await ctx(b, o); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html'); await settle(p);
    const a = await axisInfo(p);
    ok(`fallback — ${name}: axis off, message shown, list usable`, a.state === 'off' && why.test(a.reason) && a.axisHidden && a.offShown && a.marks.length === 0 && a.listCards === 5, [a.state, a.reason, a.offShown, a.listCards]);
    await c.close();
  }
  { // timeout: the hub never answers
    const c = await ctx(b, { hub: () => {} }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html');
    await p.waitForTimeout(11000);
    const a = await axisInfo(p);
    ok('fallback — request times out (10 s): axis off, list usable', a.state === 'off' && a.reason === 'timeout' && a.offShown && a.listCards === 5, [a.state, a.reason]);
    await c.close();
  }

  // ---------- D. direct links (§4b)
  {
    // axis ready
    const c = await ctx(b); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html#' + ID.ff); await settle(p); await p.waitForTimeout(100);
    let s = await p.evaluate(() => ({ open: !document.getElementById('detail').hidden, active: document.activeElement.id }));
    ok('direct link (axis ready): entry open, heading focused', s.open && s.active === ID.ff + '-h', s);
    await p.click('#d-close'); await p.waitForTimeout(150);
    ok('direct link (axis ready): Close focuses the mark', await p.evaluate(id => document.activeElement.dataset.entry === id && document.activeElement.classList.contains('mk'), ID.ff));
    await c.close();
  }
  {
    // axis unavailable
    const c = await ctx(b, { hub: r => r.abort() }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html#' + ID.k); await settle(p); await p.waitForTimeout(100);
    let s = await p.evaluate(() => ({ open: !document.getElementById('detail').hidden, active: document.activeElement.id, state: window.TL_AXIS.state }));
    ok('direct link (axis unavailable): the pre-rendered entry still opens', s.open && s.active === ID.k + '-h' && s.state === 'off', s);
    await p.click('#d-close'); await p.waitForTimeout(150);
    ok('direct link (axis unavailable): Close focuses the card title', await p.evaluate(id => document.activeElement.closest('#card-' + id) !== null, ID.k));
    await c.close();
  }
  {
    // catalogue still loading
    let release; const gate = new Promise(r => { release = r; });
    const c = await ctx(b, { hub: async r => { await gate; return serve(CAT)(r); } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html#' + ID.t); await p.waitForTimeout(300);
    let s = await p.evaluate(() => ({ open: !document.getElementById('detail').hidden, active: document.activeElement.id, state: window.TL_AXIS.state }));
    ok('direct link (catalogue loading): entry open before the axis exists', s.open && s.active === ID.t + '-h' && s.state === 'pending', s);
    release(); await settle(p);
    ok('direct link (catalogue loading): entry stays open while the axis arrives', await p.evaluate(() => !document.getElementById('detail').hidden && window.TL_AXIS.state === 'on'));
    await c.close();
  }
  {
    // clustered: a fixture moves the end-Triassic value next to the end-Permian one
    const J5 = JSON.parse(CAT.toString('utf8')); J5.entries[3].claims[0].when.ma = 251.0;
    const fx = Buffer.from(JSON.stringify(J5));
    const c = await ctx(b, { hub: serve(fx), html: page({ sha: sha(fx) }), viewport: { width: 390, height: 844 } }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html'); await settle(p);
    const cl = await p.evaluate(() => [...document.querySelectorAll('#axis .cl')].map(x => ({ has: x.dataset.has, n: x.querySelector('button').textContent })));
    ok('cluster (fixture): two close marks share one control; positions not shifted apart', cl.length === 1 && cl[0].n === '2' && /end-permian/.test(cl[0].has) && /end-triassic/.test(cl[0].has), cl);
    await p.goto(BASE + '/timeline.html#' + ID.t); await settle(p); await p.waitForTimeout(100);
    ok('direct link (clustered): entry open', await p.evaluate(id => !document.getElementById('detail').hidden && document.activeElement.id === id + '-h', ID.t));
    await p.click('#d-close'); await p.waitForTimeout(150);
    ok('direct link (clustered): Close focuses the cluster control', await p.evaluate(() => !!document.activeElement.closest('.cl') && document.activeElement.tagName === 'BUTTON'));
    await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    const first = await p.evaluate(() => ({ exp: document.querySelector('#axis .cl button').getAttribute('aria-expanded'), act: document.activeElement.dataset.entry }));
    ok('cluster opens in place and focuses its first entry', first.exp === 'true' && !!first.act, first);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok('cluster entry opens the panel', await p.evaluate(() => !document.getElementById('detail').hidden));
    await p.goBack(); await p.waitForTimeout(150);
    ok('Back returns focus to the cluster entry that opened it', await p.evaluate(() => !!document.activeElement.closest('.cl') && document.activeElement.classList.contains('mk')));
    await c.close();
    // pulses fixture: the renderer refuses no shape it does not know, and a pulses claim type is not accepted in this release
    const J6 = JSON.parse(CAT.toString('utf8')); J6.entries[0].claims[0].when = { type: 'pulses', items: [{ ma: 445 }, { ma: 444 }] };
    const fx6 = Buffer.from(JSON.stringify(J6));
    const c6 = await ctx(b, { hub: serve(fx6), html: page({ sha: sha(fx6) }) }); const p6 = await c6.newPage();
    await p6.goto(BASE + '/timeline.html'); await settle(p6);
    const a6 = await axisInfo(p6);
    ok('pulses fixture: an undated-pulse shape is refused (no numeric pulse marks in this release); list stays usable', a6.state === 'off' && /claim time/.test(a6.reason) && a6.listCards === 5, [a6.state, a6.reason]);
    await c6.close();
  }

  // ---------- E. JavaScript off: list names all four lanes; every claim type pre-rendered with its label
  {
    const c = await ctx(b, { js: false }); const p = await c.newPage();
    await p.goto(BASE + '/timeline.html');
    const m = await p.evaluate(() => ({ lanes: [...document.querySelectorAll('.lanes .lane')].map(l => l.textContent.trim()),
      claims: [...document.querySelectorAll('article.entry.ep section.claim')].map(s => [s.dataset.claimType, s.querySelector('h4').textContent]),
      eps: [...document.querySelectorAll('article.entry.ep')].map(a => a.id), noscript: document.querySelector('noscript') !== null,
      permalinks: [...document.querySelectorAll('#dated .card .ctitle a')].map(a => a.getAttribute('href')) }));
    ok('no-JS: four lanes named, three "no entries yet"', m.lanes.length === 4 && m.lanes.filter(l => /No (dated )?entries/.test(l)).length === 3, m.lanes);
    ok('no-JS: five episode entries pre-rendered', m.eps.join() === [ID.o, ID.ff, ID.p, ID.t, ID.k].join(), m.eps);
    const want = { extinction_interval_approx: 'Approximate extinction interval', boundary_age_bound: 'Boundary age: no older than', boundary_age_range_modelled: 'Modelled boundary-age range',
      extinction_onset_estimate: 'Estimated extinction onset', extinction_horizon_approx: 'Approximate age of the extinction horizon', dated_event_age: 'Impact age',
      extinction_placement_tied: 'Extinction placed at the dated impact (synchrony evidence cited)', chart_boundary: 'ICS chart boundary (v2026-06)', context: 'Context' };
    ok('no-JS: every claim carries its own fixed label', m.claims.length > 0 && m.claims.every(([t, l]) => want[t] === l) && Object.keys(want).every(t => m.claims.some(([x]) => x === t)), m.claims);
    ok('no-JS: permalinks point at the pre-rendered entries', m.permalinks.join() === [ID.o, ID.ff, ID.p, ID.t, ID.k].map(i => '#' + i).join(), m.permalinks);
    await p.goto(BASE + '/timeline.html#' + ID.p);
    ok('no-JS: a permalink lands on its entry', await p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight; }, ID.p));
    await c.close();
  }

  await b.close();
  console.log(`timeline-axis: ${pass} pass, ${fail} fail${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
})();
