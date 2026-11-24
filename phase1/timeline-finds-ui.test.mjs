/*
 * Timeline: dated finds on the "Humans and human relatives" lane, in a real browser
 * (docs/concepts/TIMELINE-HUMAN-RELATIVES-BUILD-PROPOSAL.md rev 1; GPT's review of 24 Nov 2026).
 * Workspace Chromium (Playwright) against the preview helper built from the REHEARSAL source phase1/timeline/rehearsal-finds/
 * (catalogue tl-2026-11-T2, schema 4, never published). The page, script, stylesheet and catalogue are the helper's; nothing
 * is mocked except where a check says so (a mutated catalogue, an older page or script).
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/timeline-finds-ui.test.mjs
 * Breaks, each of which must make a named check fail:
 *   BREAK=join-bar | limit-as-point | limit-as-bar | pm-dropped | open-side-fit | chevron-scales | datum-unchecked | values-unchecked |
 *         midpoint-as-age | finds-clustered | no-finds-validate | min-span | ka-always | coarse-ticks | offscreen-text | no-bring |
 *         hit-area | row-order
 * Control: OLD=1 serves main's timeline.js instead; the suite must fail.
 * MEASURE=1 prints the drawn widths (figures are printed, never judged, beyond the checks below).
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { build, serve } from './timeline/preview.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), BREAK = process.env.BREAK || '', OLD = process.env.OLD === '1';
const sha = b => createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0; const ok = (name, cond, info) => { if (cond) { pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (info !== undefined ? '  → ' + JSON.stringify(info).slice(0, 600) : '')); } };
process.on('uncaughtException', e => { console.log('FAIL the suite ran to its end  → ' + String(e && e.message).split('\n')[0]); console.log(`timeline-finds-ui: ${pass} pass, ${fail + 1} fail (stopped early)`); process.exit(1); });
process.on('unhandledRejection', e => { throw e; });
const REV = 'tl-2026-11-T2', R3 = 'tl-2026-11-R3', PORT = 8796, B = `http://127.0.0.1:${PORT}`, ST = 'with-image';
const RH = path.join(ROOT, 'phase1/timeline/rehearsal-finds');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-finds-ui-'));
const rep = build(path.join(TMP, 'preview'), PORT, { rehearsal: RH }); const server = serve(path.join(TMP, 'preview'), PORT, rep, () => {}); await new Promise(r => server.once('listening', r));
const SRC = JSON.parse(fs.readFileSync(path.join(RH, 'finds.json'), 'utf8'));
const IDS = ['f-dinaledi-chamber', 'f-omo-1', 'f-xiahe-2', 'f-la-ferrassie-bone'];
const NOTE = 'Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact.';
const git = f => execFileSync('git', ['-C', ROOT, 'show', 'main:' + f], { maxBuffer: 1 << 26 }).toString();
const HUB_LINE = "const HUB = 'https://mother-earth.chadoberholzer.workers.dev';", HUB = `const HUB = '${B}/${ST}/hub';`;
const must = (t, a, b) => { if (t.split(a).length !== 2) throw new Error('break anchor missing: ' + a.slice(0, 60)); return t.replace(a, b); };
const brokenJs = js => {
  switch (BREAK) {
    case 'join-bar': return must(js, 'return `<div class="frow" data-find=', 'return `<i class="fjoin"></i><div class="frow" data-find=');
    case 'limit-as-point': return must(js, 'const ext = lim_ ? { from: w.ref_ma + w.ref_pm, to: w.ref_ma - w.ref_pm } :', 'const ext = lim_ ? null :');
    case 'limit-as-bar': return must(js, "shape: lim_ ? 'f-limit' :", "shape: lim_ ? 'f-bracket' :");
    case 'pm-dropped': return must(js, "k.label.slice(1) + ': ') + k.when_text,", "k.label.slice(1) + ': ') + (lim_ ? 'the layer is dated 233,000 years ago' : k.when_text),");
    case 'open-side-fit': return must(js, 'const e = m.ext, need =', "const e = m.kind === 'limit' ? { from: m.ext.from + 0.5, to: m.ext.to } : m.ext, need =");
    case 'chevron-scales': return must(js, '`<i class="fch"></i>`', '`<i class="fch" style="width:${(g.w / 3).toFixed(1)}px"></i>`');
    case 'datum-unchecked': return must(js, 'w.datum_ce !== 1950 || ', '');
    case 'values-unchecked': return must(js, 'same = (ma, v) => isNum(v) && Math.abs(ma * per - v) < 1e-9;', 'same = () => true;');
    case 'midpoint-as-age': return must(js, 'label: `${e.title}. Attributed to ${e.attributed_to.name}. ${k.label}: ${k.when_text}.` };', "label: `${e.title}. About ${Math.round((lim_ ? w.ref_ma : (w.from_ma + w.to_ma) / 2) * 1e6).toLocaleString('en-US')} years ago.` };");
    case 'finds-clustered': return must(js, "MAIN = MARKS.filter(m => m.lane !== 'relatives');", 'MAIN = MARKS;');
    case 'no-finds-validate': return must(js, 'function findsBad(c) {', 'function findsBad(c) { return null;');
    case 'min-span': return must(js, 'MIN_SPAN = FINDS.length ? MIN_SPAN_FINDS : 1;', 'MIN_SPAN = FINDS.length ? 0.001 : 1;');
    case 'ka-always': return must(js, 'const ka = FINDS.length > 0 && s < KA_BELOW,', 'const ka = FINDS.length > 0,');
    case 'coarse-ticks': return must(js, '(ka ? KA_STEPS : TICK_STEPS).find(', 'TICK_STEPS.find(');
    case 'offscreen-text': return must(js, "'Its dated layer is newer than this view; the find is older than that layer, by an unknown amount.'", "'Newer than this view.'");
    case 'no-bring': return must(js, "const fg = t.closest('[data-find-go]'); if (fg) {", 'const fg = null; if (fg) {');
    case 'row-order': return must(js, ".sort((x, y) => y.key - x.key || (x.id < y.id ? -1 : 1));", ".sort((x, y) => x.key - y.key || (x.id < y.id ? -1 : 1));");
    case '': case 'hit-area': return js;
    default: throw new Error('unknown BREAK ' + BREAK);
  }
};
const brokenCss = css => BREAK === 'hit-area' ? must(css, 'body.tl .axis .xpl .fmk{top:0;height:32px;min-width:44px;', 'body.tl .axis .xpl .fmk{top:0;height:32px;min-width:4px;') : css;

const browser = await chromium.launch();
async function open({ w = 1280, h = 900, js = true, hash = '', mutate = null, page: pageBody = null, script = null, catalogue = null, state = null } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js });
  const reqs = [], errs = [];
  await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  if (BREAK || script || OLD) await c.route(/timeline\.js/, async r => { const body = script || (OLD ? git('timeline.js').replace(HUB_LINE, HUB) : brokenJs(await (await fetch(r.request().url())).text())); r.fulfill({ contentType: 'application/javascript', body }); });
  if (BREAK === 'hit-area') await c.route(/style\.css/, async r => r.fulfill({ contentType: 'text/css', body: brokenCss(await (await fetch(r.request().url())).text()) }));
  if (mutate) {   // a catalogue changed by the fixture, with the page's pin moved to the changed bytes, so only validation can refuse it
    const o = JSON.parse(await (await fetch(`${B}/${ST}/hub/catalogue/timeline/${REV}`)).text()); mutate(o);
    const body = Buffer.from(JSON.stringify(o)); const pg = (await (await fetch(`${B}/${ST}/timeline.html`)).text()).replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(body)}"`);
    await c.route(/hub\/catalogue\/timeline/, r => r.fulfill({ contentType: 'application/json', body })); await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: pg }));
  }
  if (catalogue) await c.route(/hub\/catalogue\/timeline/, r => r.fulfill({ contentType: 'application/json', body: catalogue }));
  if (pageBody) await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: pageBody }));
  const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('request', r => reqs.push(r.url()));
  if (state) { await p.goto(`${B}/${ST}/timeline.html`, { waitUntil: 'load' }); await p.evaluate(s => history.replaceState(s, '', location.href), state); await p.reload({ waitUntil: 'load' }); }
  else await p.goto(`${B}/${ST}/timeline.html${hash}`, { waitUntil: 'load' });
  if (js) await p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending');
  await p.waitForTimeout(250);
  const axis = js ? await p.evaluate(() => window.TL_AXIS.state + (window.TL_AXIS.reason ? ':' + window.TL_AXIS.reason : '')) : 'no-js';
  return { c, p, reqs, errs, axis };
}
const setWin = async (p, a, b) => { await p.evaluate(([a, b]) => { history.replaceState({ ...(history.state || {}), k: (history.state && history.state.k) || 9001, win: [a, b] }, '', location.href); }, [a, b]); await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending'); await p.waitForTimeout(200); };
const view = p => p.evaluate(() => window.TL_AXIS.view);
const near = (x, y, t = 1) => Math.abs(x - y) <= t;
// what the finds lane shows: per row, the link (hit area), the glyph (drawn extent), the tick and the open chevron
const rows = p => p.evaluate(() => { const ft = document.querySelector('#xpl .ftrack'); if (!ft) return null; const L = ft.getBoundingClientRect();
  const r = e => { const q = e.getBoundingClientRect(); return { l: +(q.left - L.left).toFixed(2), r: +(q.right - L.left).toFixed(2), w: +q.width.toFixed(2), t: +q.top.toFixed(1), b: +q.bottom.toFixed(1) }; };
  return { W: ft.clientWidth, kids: [...ft.children].map(e => e.tagName + '.' + e.className), rows: [...ft.querySelectorAll('.frow')].map(row => { const a = row.querySelector('a.fmk');
    return { id: row.dataset.find, box: r(row), cap: row.querySelector('.fcap').textContent, off: row.querySelector('.foff') ? row.querySelector('.foff').textContent : null, go: !!row.querySelector('.fgo'),
      n: row.querySelectorAll('a').length, cls: a ? a.className : null, label: a ? a.getAttribute('aria-label') : null, hit: a ? r(a) : null, g: a ? r(a.querySelector('.g')) : null,
      tick: a && a.querySelector('.ftk') ? r(a.querySelector('.ftk')) : null, chev: a && a.querySelector('.fch') ? r(a.querySelector('.fch')) : null }; }) }; });
// the same, with the rows looked up by find (so a check about one find reads that find's row whatever the order drawn)
const rowsBy = async p => { const R = await rows(p); R.rows = IDS.map(i => R.rows.find(r => r.id === i) || { id: i, cls: null, box: {}, cap: '', label: '' }); return R; };
const pxOf = (W, a, b, ma) => (a - ma) / (a - b) * W;

for (const [w, h] of [[1280, 900], [390, 844]]) {
  const L = `${w}`;
  // ---------- A. the page draws the lane from the rehearsal catalogue
  const T = await open({ w, h }); const p = T.p;
  ok(`A ${L}: the explorer draws from the rehearsal catalogue (schema 4) with no page error`, T.axis === 'on' && T.errs.length === 0, [T.axis, T.errs]);
  if (T.axis !== 'on') { await T.c.close(); continue; }
  ok(`A ${L}: banner "Rehearsal ${REV}: not published"`, (await p.textContent('#rehearsal-banner')).includes(`Rehearsal ${REV}: not published`));
  const lane = await p.evaluate(() => { const f = document.querySelector('#xpl .lr.fl'), m = document.querySelector('#xpl .lr.act:not(.fl)'); return { fl: f && f.getAttribute('aria-label'), ln: f && f.querySelector('.ln').textContent, note: f && f.querySelector('.fnote').textContent, main: m && m.getAttribute('aria-label'), plans: document.querySelector('.plans').textContent }; });
  ok(`A ${L}: the lane is "Humans and human relatives (4 finds)", the extinctions lane still counts its own five`, lane.fl === 'Humans and human relatives (4 finds)' && lane.main === 'Mass extinctions (5 entries)', lane);
  ok(`A ${L}: the lane's fixed sentence is on the lane, word for word`, lane.note === NOTE, lane.note);
  ok(`A ${L}: the lane is no longer listed as "not on the timeline yet"`, !/relatives/i.test(lane.plans), lane.plans);
  // ---------- B. landing view: four rows, four separate links, nothing between them
  let R = await rows(p); const ORDER = R.rows.map(r => r.id);
  ok(`B ${L}: the lane holds exactly four rows and nothing else (no element joins two finds)`, R.kids.length === 4 && R.kids.every(k => k === 'DIV.frow'), R.kids);
  ok(`B ${L}: rows are in a fixed order, by each find's finite age, oldest first`, JSON.stringify(ORDER) === JSON.stringify(IDS), ORDER);
  ok(`B ${L}: rows do not overlap each other`, R.rows.every((r, i) => i === 0 || r.box.t >= R.rows[i - 1].box.b - 0.5), R.rows.map(r => [r.box.t, r.box.b]));
  const anchors = await p.evaluate(ids => ids.map(i => document.querySelectorAll(`#axis a.mk[data-entry="${i}"]`).length), IDS);
  ok(`B ${L}: every find has exactly one link of its own in the explorer, and none sits inside a cluster or on the extinctions track`, anchors.every(n => n === 1) && R.rows.every(r => r.n === 1) && (await p.evaluate(() => document.querySelectorAll('#xpl .track a.mk[data-entry^="f-"], #xpl .cl a[data-entry^="f-"]').length)) === 0, [anchors, R.rows.map(r => r.n)]);
  ok(`B ${L}: the extinctions track still shows its five entries (marks or cluster members)`, (await p.evaluate(() => new Set([...document.querySelectorAll('#xpl .track a.mk')].map(a => a.dataset.entry)).size)) === 5);
  const mids = ['285,500', '40,000', '41,250'];
  ok(`B ${L}: each link's spoken name carries the title, the attribution, the claim's label and its date in words; no midpoint is ever printed`, R.rows.every((r, i) => { const f = SRC.finds[i]; return r.label.startsWith(f.title + '. Attributed to ' + f.attributed_to.name + '. ') && !mids.some(m => r.label.includes(m) || r.cap.includes(m)); }), R.rows.map(r => r.label));
  // ---------- C. the "Last 400,000 years" view
  await p.click('[data-preset="recent"]'); await p.waitForTimeout(250); R = await rowsBy(p);
  ok(`C ${L}: "Last 400,000 years" shows 0.4 to 0 Ma and is marked pressed`, JSON.stringify(await view(p)) === '[0.4,0]' && (await p.getAttribute('[data-preset="recent"]', 'aria-pressed')) === 'true', await view(p));
  const W = R.W, k = W / 400;   // pixels per thousand years in this view
  const want = { 'f-dinaledi-chamber': 99 * k, 'f-omo-1': 44 * k, 'f-xiahe-2': 16 * k };
  ok(`C ${L}: the Dinaledi bracket, the Omo eruption band and the Xiahe bracket are drawn to scale (glyph widths ${R.rows.slice(0, 3).map(r => r.g.w).join(', ')} px in a ${W} px lane)`, R.rows.slice(0, 3).every(r => / mk-true/.test(r.cls) && near(r.g.w, want[r.id], 1.2)), [W, want, R.rows.map(r => [r.cls, r.g.w])]);
  ok(`C ${L}: their ends sit at their stated ages (Dinaledi 335 and 236, Xiahe 48 and 32 thousand years)`, near(R.rows[0].g.l, pxOf(W, 0.4, 0, 0.335), 1.2) && near(R.rows[0].g.r, pxOf(W, 0.4, 0, 0.236), 1.2) && near(R.rows[2].g.l, pxOf(W, 0.4, 0, 0.048), 1.2) && near(R.rows[2].g.r, pxOf(W, 0.4, 0, 0.032), 1.2), [R.rows[0].g, R.rows[2].g]);
  ok(`C ${L}: the La Ferrassie date, too narrow to draw to scale here, is a mark at its place with its own glyph`, / mk-f-cal/.test(R.rows[3].cls) && !/ mk-true/.test(R.rows[3].cls) && near((R.rows[3].hit.l + R.rows[3].hit.r) / 2, pxOf(W, 0.4, 0, 0.04125), 1.2), R.rows[3]);
  ok(`C ${L}: every find's link is at least 44 px wide and 24 px high whatever its glyph's width (hit area ≠ glyph)`, R.rows.every(r => r.hit.w >= 43.5 && r.hit.b - r.hit.t >= 24) && R.rows[3].g.w < 20, R.rows.map(r => [r.hit.w, r.g.w]));
  const sc = await p.evaluate(() => ({ ticks: [...document.querySelectorAll('#xpl .scale .tk')].map(e => e.textContent), unit: (document.querySelector('#xpl .scale .tku') || {}).textContent || null, win: document.getElementById('tl-win').textContent, sw: document.documentElement.scrollWidth, iw: innerWidth }));
  ok(`C ${L}: ticks are in thousands of years (${sc.ticks.join(' ')}), the unit is written once, and the sentence above says the same in years`, sc.ticks.length >= 2 && sc.ticks.every(t => /^[\d,]+$/.test(t)) && new Set(sc.ticks).size === sc.ticks.length && sc.ticks.includes('0') && sc.unit === 'thousand years ago' && sc.win === 'Showing 400,000 to 0 years ago. Span 400,000 years. Older on the left.', sc);
  ok(`C ${L}: no sideways overflow`, sc.sw <= sc.iw, [sc.sw, sc.iw]);
  ok(`C ${L}: the extinctions lane, empty in this range, says so for its own lane only`, /No entries on this lane in this range\./.test(await p.evaluate(() => (document.querySelector('#xpl .track .nomk') || { textContent: '' }).textContent)));
  if (process.env.MEASURE) console.log(`MEASURE ${L} window 0.4 Ma, lane ${W} px: ` + R.rows.map(r => `${r.id} glyph ${r.g.w} hit ${r.hit.w}`).join(' · '));
  // ---------- D. the limit (Omo I): a tick at the dated layer, a band for that layer's own ±, an open ‹ of fixed length
  const omo = R.rows[1];
  ok(`D ${L}: Omo I is drawn as a limit: its own glyph class, a tick and an open chevron`, / mk-f-limit/.test(omo.cls) && !!omo.tick && !!omo.chev, omo);
  ok(`D ${L}: the band is the dated layer's ± (211 to 255 thousand years) and the tick is at the layer's age (233)`, near(omo.g.l, pxOf(W, 0.4, 0, 0.255), 1.2) && near(omo.g.r, pxOf(W, 0.4, 0, 0.211), 1.2) && near((omo.tick.l + omo.tick.r) / 2, pxOf(W, 0.4, 0, 0.233), 1.2), [omo.g, omo.tick]);
  ok(`D ${L}: the chevron sits wholly on the older side of the band and ends in nothing`, !!omo.chev && omo.chev.r <= omo.g.l + 0.5 && omo.chev.l >= 0, [omo.chev, omo.g]);
  ok(`D ${L}: the caption says, in words and without the panel, that the layer is dated 233,000 ± 22,000 years (2σ), that the find is older, and that the older limit is unknown`, /^Omo I · older than a dated layer above it; the layer is dated 233,000 ± 22,000 years ago \(2σ\); older limit unknown$/.test(omo.cap), omo.cap);
  ok(`D ${L}: its spoken name says the same`, /Older than a dated layer above it: the layer is dated 233,000 ± 22,000 years ago \(2σ\); older limit unknown\.$/.test(omo.label), omo.label);
  await setWin(p, 0.3, 0.1); const o2 = (await rowsBy(p)).rows[1];
  ok(`D ${L}: at another zoom the band is wider but the chevron is the same size in pixels (it has no length in years)`, !!o2.chev && !!omo.chev && o2.g.w > omo.g.w * 1.5 && near(o2.chev.w, omo.chev.w, 0.6), [omo.chev, o2.chev, omo.g, o2.g]);
  await setWin(p, 0.24, 0.04); const o3 = (await rowsBy(p)).rows[1];
  ok(`D ${L}: band cut by the older edge of the view: marked as continuing (‹), tick still at 233, and no chevron drawn inside the cut`, / clipl/.test(o3.cls) && !o3.chev && !!o3.tick && near((o3.tick.l + o3.tick.r) / 2, pxOf(W, 0.24, 0.04, 0.233), 1.2), o3);
  await setWin(p, 0.3, 0.225); const o4 = (await rowsBy(p)).rows[1];
  ok(`D ${L}: band cut by the newer edge: marked as continuing (›), chevron still open on the older side`, / clipr/.test(o4.cls) && !!o4.chev && !!o4.tick, o4);
  await setWin(p, 0.5, 0.3); const o5 = (await rowsBy(p)).rows[1];
  ok(`D ${L}: view older than the dated layer: no mark, and the row says the find is older than that layer by an unknown amount (never "not in this range")`, o5.cls === null && o5.off === 'Its dated layer is newer than this view; the find is older than that layer, by an unknown amount.' && o5.go, o5);
  await setWin(p, 0.2, 0); const o6 = (await rowsBy(p)).rows[1];
  ok(`D ${L}: view newer than the dated layer: no mark, the row says its dated layer is older than this view, and offers "Bring into view"`, o6.cls === null && o6.off === 'Its dated layer is older than this view.' && o6.go, o6);
  await p.click('.frow[data-find="f-omo-1"] .fgo'); await p.waitForTimeout(250);
  const v6 = await view(p), f6 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.entry);
  ok(`D ${L}: "Bring into view" frames the dated layer's finite ± at the same span (0.333 to 0.133 Ma); the unknown older side adds nothing; focus goes to the find`, near(v6[0], 0.333, 0.0005) && near(v6[1], 0.133, 0.0005) && f6 === 'f-omo-1', [v6, f6]);
  // ---------- E. the narrowest window
  await setWin(p, 0.05, 0); R = await rowsBy(p); const k5 = R.W / 50;
  ok(`E ${L}: at the narrowest window (50,000 years) the La Ferrassie date is drawn at its true ends (${R.rows[3].g.w} px for 900 years)`, / mk-true/.test(R.rows[3].cls) && near(R.rows[3].g.w, 0.9 * k5, 1.2) && near(R.rows[3].g.l, pxOf(R.W, 0.05, 0, 0.0417), 1.2), R.rows[3]);
  ok(`E ${L}: the Xiahe layer bracket, which contains that date in time, is on its own row and neither hides the other`, / mk-true/.test(R.rows[2].cls) && near(R.rows[2].g.w, 16 * k5, 1.5) && R.rows[2].box.b <= R.rows[3].box.t + 0.5, [R.rows[2].g, R.rows[3].g]);
  ok(`E ${L}: Zoom in is unavailable at the limit and a click does not change the window`, (await p.getAttribute('[data-act="in"]', 'aria-disabled')) === 'true' && (await p.click('[data-act="in"]', { force: true }), JSON.stringify(await view(p)) === '[0.05,0]'), await view(p));
  const t5 = await p.evaluate(() => [...document.querySelectorAll('#xpl .scale .tk')].map(e => e.textContent));
  ok(`E ${L}: ticks at the narrowest window are finer than 100,000 years and distinct (${t5.join(' ')})`, t5.length >= 2 && new Set(t5).size === t5.length && t5.every(t => /^\d+$/.test(t) && +t <= 50), t5);
  if (process.env.MEASURE) console.log(`MEASURE ${L} window 0.05 Ma, lane ${R.W} px: ` + R.rows.filter(r => r.g).map(r => `${r.id} glyph ${r.g.w} hit ${r.hit.w}`).join(' · '));
  await setWin(p, 0.03, 0);
  ok(`E ${L}: a stored window narrower than the limit is refused: the landing view`, JSON.stringify(await view(p)) === '[538.8,0]', await view(p));
  // ---------- J. tick units either side of 2 million years
  for (const [a, mode] of [[2.2, 'Ma'], [2, 'Ma'], [1.9, 'ka'], [1, 'ka']]) { await setWin(p, a, 0);
    const s = await p.evaluate(() => ({ ticks: [...document.querySelectorAll('#xpl .scale .tk')].map(e => e.textContent), unit: (document.querySelector('#xpl .scale .tku') || {}).textContent || null, win: document.getElementById('tl-win').textContent }));
    ok(`J ${L}: a ${a} Ma window is ticked in ${mode === 'Ma' ? 'Ma' : 'thousands of years'}, labels distinct, and the sentence above agrees`, s.ticks.length >= 2 && new Set(s.ticks).size === s.ticks.length && (mode === 'Ma' ? s.unit === null && / Ma$/.test(s.ticks[0]) && /million years ago/.test(s.win) : s.unit === 'thousand years ago' && s.ticks.every(t => /^[\d,]+$/.test(t)) && / years ago\. Span /.test(s.win) && !/Ma/.test(s.win)), s); }
  // ---------- F. each find opens on its own, with its own history entry, and comes back to its own link
  await setWin(p, 0.4, 0);
  for (const f of SRC.finds) {
    const k0 = await p.evaluate(() => (history.state && history.state.k) || null);
    await p.click(`#xpl .ftrack a.mk[data-entry="${f.id}"]`); await p.waitForTimeout(250);
    const s = await p.evaluate(id => { const d = document.getElementById('detail'), a = document.getElementById(id); return { open: !d.hidden && d.contains(a), focus: document.activeElement.id, hash: location.hash, k: history.state && history.state.k, st: history.state && history.state.entry,
      attr: a.querySelector('#' + id + '-attr').textContent, claims: [...a.querySelectorAll('section.claim')].map(c => [c.id.slice(id.length + 1), c.querySelector('h5').textContent, [...c.querySelectorAll(':scope > p:not(.srcnote):not(.cval):not(.fnot)')].map(q => q.textContent).join(' ')]), val: (a.querySelector('.cval') || {}).textContent, not: (a.querySelector('.fnot') || {}).textContent,
      cur: (document.querySelector('#xpl .ftrack a.mk[aria-current="true"]') || { dataset: {} }).dataset.entry, sw: document.documentElement.scrollWidth, iw: innerWidth }; }, f.id);
    const ax = f.claims.find(c => c.axis);
    ok(`F ${L} ${f.short}: its link opens its own entry, focus on the heading, a history entry of its own, and its mark is the selected one`, s.open && s.focus === f.id + '-h' && s.hash === '#' + f.id && s.k && s.k !== k0 && s.st === f.id && s.cur === f.id, s);
    ok(`F ${L} ${f.short}: the panel shows every claim of the source file in order, each under its fixed label, with the source's own notation and what it means`, JSON.stringify(s.claims.map(c => [c[0], c[2]])) === JSON.stringify(f.claims.map(c => [c.id, c.text])) && s.not.includes('As the source writes it: ' + ax.source_notation + '. ' + ax.confidence) && s.attr.startsWith('Attributed to ' + f.attributed_to.name + ' '), s);
    ok(`F ${L} ${f.short}: no sideways overflow with the panel open`, s.sw <= s.iw, [s.sw, s.iw]);
    await p.goBack(); await p.waitForTimeout(250);
    const b = await p.evaluate(() => ({ k: (history.state && history.state.k) || null, open: !document.getElementById('detail').hidden, act: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.entry, hash: location.hash }));
    ok(`F ${L} ${f.short}: Back returns to the entry it left, closes the find, and focus returns to that find's own link`, !b.open && b.act === f.id && b.hash === '' && b.k === k0, [b, k0]);
    await p.goForward(); await p.waitForTimeout(250);
    ok(`F ${L} ${f.short}: Forward reopens the same entry`, await p.evaluate(id => !document.getElementById('detail').hidden && document.getElementById('detail').contains(document.getElementById(id)) && location.hash === '#' + id, f.id));
    await p.goBack(); await p.waitForTimeout(200);
  }
  await p.focus(`#xpl .ftrack a.mk[data-entry="f-xiahe-2"]`); await p.setViewportSize({ width: w - 40, height: h }); await p.waitForTimeout(350);
  ok(`F ${L}: after a redraw (the window resized) focus is still on the same find's link`, (await p.evaluate(() => document.activeElement && document.activeElement.dataset.entry)) === 'f-xiahe-2');
  ok(`F ${L}: the finds can be reached by Tab, in row order, each one stop`, await (async () => { await p.focus('#xpl'); const seen = []; for (let i = 0; i < 12 && seen.length < 4; i++) { await p.keyboard.press('Tab'); const id = await p.evaluate(() => { const a = document.activeElement; return a && a.closest('.ftrack') && a.dataset.entry; }); if (id) seen.push(id); } return JSON.stringify(seen) === JSON.stringify(IDS); })());
  ok(`${L}: nothing was requested from any other host`, T.reqs.every(u => u.startsWith(B) || /fonts\.(googleapis|gstatic)/.test(u)), T.reqs.filter(u => !u.startsWith(B)).slice(0, 3));
  ok(`${L}: no page error in the whole run`, T.errs.length === 0, T.errs);
  await T.c.close();
  // ---------- K. a direct link to a find
  for (const id of ['f-omo-1', 'f-la-ferrassie-bone']) { const D = await open({ w, h, hash: '#' + id });
    ok(`K ${L}: a direct link to ${id} opens it on the "Last 400,000 years" view, where all four finds are`, D.axis === 'on' && JSON.stringify(await view(D.p)) === '[0.4,0]' && await D.p.evaluate(i => !document.getElementById('detail').hidden && document.getElementById('detail').contains(document.getElementById(i)), id), [D.axis, D.axis === 'on' ? await view(D.p) : null]); await D.c.close(); }
}

// ---------- G. with JavaScript off the four finds are in the page, complete
{ const N = await open({ js: false });
  const g = await N.p.evaluate(() => ({ cards: [...document.querySelectorAll('#finds .card.find .ctitle')].map(e => e.textContent), note: document.getElementById('finds-note').textContent, arts: [...document.querySelectorAll('article.entry.find')].map(a => ({ id: a.id, n: a.querySelectorAll('section.claim').length, vis: a.getClientRects().length > 0, attr: a.querySelector('.fattr').textContent })), lanes: [...document.querySelectorAll('.lanes .lane')].map(e => e.textContent) }));
  ok('G no JavaScript: the lane sentence, four find cards and four complete, visible entries are in the page', g.note === NOTE && JSON.stringify(g.cards) === JSON.stringify(SRC.finds.map(f => f.title)) && g.arts.length === 4 && g.arts.every((a, i) => a.vis && a.n === SRC.finds[i].claims.length), g);
  ok('G no JavaScript: the lane list counts them', g.lanes.includes('Humans and human relatives (4)'), g.lanes);
  await N.c.close(); }

// ---------- H. a malformed find is refused by the page (the catalogue's hash is pinned to the changed bytes, so only validation can refuse it)
const F = (o, i) => o.entries.find(e => e.id === IDS[i]), AX = (o, i) => F(o, i).claims.find(k => k.axis);
const BAD = [
  ['a limit pointing the other way', o => { AX(o, 1).when.side = 'younger'; }],
  ['a limit with no uncertainty', o => { AX(o, 1).when.ref_pm = 0; }],
  ['a limit whose uncertainty is text', o => { AX(o, 1).when.ref_pm = '0.022'; }],
  ['a limit with a negative uncertainty', o => { AX(o, 1).when.ref_pm = -0.022; }],
  ['a limit whose reference is null', o => { AX(o, 1).when.ref_ma = null; }],
  ['a limit whose ± reaches below zero', o => { AX(o, 1).when.ref_pm = 0.3; AX(o, 1).source_values.pm = 300; }],
  ['a limit given an older end', o => { AX(o, 1).when.from_ma = 0.5; }],
  ['a limit with an unknown sigma', o => { AX(o, 1).when.sigma = 3; }],
  ['a bracket with its ends reversed', o => { const w = AX(o, 0).when; [w.from_ma, w.to_ma] = [w.to_ma, w.from_ma]; const s = AX(o, 0).source_values; [s.from, s.to] = [s.to, s.from]; }],
  ['a bracket older than the chart', o => { AX(o, 0).when.from_ma = 5000; AX(o, 0).source_values.from = 5000000; }],
  ['stored ages that are not the source values', o => { AX(o, 0).when.from_ma = 0.336; }],
  ['a source unit this build does not know', o => { AX(o, 0).source_units = 'Ma'; AX(o, 0).source_values.unit = 'Ma'; }],
  ['a calibrated date counted from another year', o => { AX(o, 3).when.datum_ce = 2026; }],
  ['a calibration curve this build does not know', o => { AX(o, 3).when.curve = 'IntCal13'; }],
  ['a probability of zero', o => { AX(o, 3).when.probability = 0; }],
  ['a probability that is not the notation\'s', o => { AX(o, 3).when.probability = 68.2; }],
  ['a radiocarbon measurement with no uncertainty', o => { AX(o, 3).when.c14_pm = 0; }],
  ['a date with no source notation', o => { delete AX(o, 2).source_notation; }],
  ['a date with no stated confidence', o => { AX(o, 2).confidence = ' '; }],
  ['two axis claims on one find', o => { F(o, 0).claims.push(JSON.parse(JSON.stringify(AX(o, 0)))); }],
  ['a find with no "what was dated"', o => { const f = F(o, 2); f.claims = f.claims.filter(k => k.claim_type !== 'dated_material'); }],
  ['a find with an empty association', o => { F(o, 2).claims.find(k => k.claim_type === 'find_association').text = ''; }],
  ['a find with no site', o => { F(o, 0).find.site = ''; }],
  ['an attribution basis this build does not know', o => { F(o, 2).attributed_to.basis = 'guess'; }],
  ['an attribution that is not the one on the page', o => { F(o, 2).attributed_to.name = 'Homo longi'; }],
  ['a group identifier used as the specimen', o => { F(o, 1).find.specimen = 'Q15978631'; }],
  ['a find carrying an account', o => { F(o, 0).story = o.entries.find(e => e.story).story; }],
  ['a find claim on the extinctions lane', o => { o.entries.find(e => e.lane === 'extinctions').claims.push(JSON.parse(JSON.stringify(AX(o, 0)))); }],
  ['a changed lane sentence', o => { o.find_note = o.find_note.replace('do not show', 'show'); }],
  ['a find moved to another lane', o => { F(o, 0).lane = 'history'; }],
];
{ const C = await open({}); ok('H control: the same route with an unchanged catalogue draws the explorer', C.axis === 'on', C.axis); await C.c.close(); }
for (const [name, mut] of BAD) { const X = await open({ mutate: mut });
  const s = await X.p.evaluate(() => ({ cards: document.querySelectorAll('.card.ep').length, off: !document.getElementById('axis-off').hidden, marks: document.querySelectorAll('#axis a.mk').length }));
  ok(`H refused by the page: ${name} (${X.axis})`, /^off:validation: /.test(X.axis) && s.cards === 9 && s.off && s.marks === 0, [X.axis, s]); await X.c.close(); }

// ---------- I. old and new pages, scripts and catalogues
{ const T2 = Buffer.from(await (await fetch(`${B}/${ST}/hub/catalogue/timeline/${REV}`)).text()), R3B = fs.readFileSync(path.join(ROOT, 'phase1/timeline/catalogue', R3 + '.json'));
  const newPage = await (await fetch(`${B}/${ST}/timeline.html`)).text(), newJs = await (await fetch(`${B}/${ST}/timeline.js`)).text();
  const oldPage = git('timeline.html'), oldJs = git('timeline.js').replace(HUB_LINE, HUB);
  const oldBuild = /data-build="(\d+)"/.exec(oldPage)[1], newBuild = /data-build="(\d+)"/.exec(newPage)[1];
  const st = p => p.evaluate(() => ({ cards: document.querySelectorAll('.card').length, off: !document.getElementById('axis-off').hidden }));
  let X = await open({ page: oldPage, script: oldJs, catalogue: R3B });
  ok('I the released page and script (main) with the released catalogue still draw the explorer here', X.axis === 'on', X.axis);
  await X.p.evaluate(() => history.replaceState({ k: 77, win: [0.05, 0] }, '', location.href)); await X.p.reload({ waitUntil: 'load' }); await X.p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending'); await X.p.waitForTimeout(200);
  ok('I a 50,000-year window saved by the new page is refused by the released script: its landing view', JSON.stringify(await view(X.p)) === '[538.8,0]', await view(X.p)); await X.c.close();
  // the released page and script, handed the schema-4 catalogue with the revision and hash pins moved to it: only the script's own checks stand in the way
  X = await open({ page: oldPage.replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(T2)}"`).replace(`data-catalogue-rev="${R3}"`, `data-catalogue-rev="${REV}"`), script: oldJs, catalogue: T2 });
  ok(`I the released script refuses the schema-4 catalogue even when its revision and hash are pinned (${X.axis}); the list stays`, /^off:/.test(X.axis) && (await st(X.p)).off, X.axis); await X.c.close();
  X = await open({ page: oldPage.replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(T2)}"`).replace(`data-catalogue-rev="${R3}"`, `data-catalogue-rev="${REV}"`).replace(`data-build="${oldBuild}"`, `data-build="${newBuild}"`), script: newJs, catalogue: T2 });
  ok(`I this script with the released page (schema 3, build key aligned) refuses the schema-4 catalogue (${X.axis})`, /^off:/.test(X.axis), X.axis); await X.c.close();
  X = await open({ page: newPage.replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(R3B)}"`).replace(`data-catalogue-rev="${REV}"`, `data-catalogue-rev="${R3}"`), catalogue: R3B });
  ok(`I the new page, built for schema 4, refuses the schema-3 catalogue even when pinned (${X.axis}); its list stays`, /^off:/.test(X.axis) && (await st(X.p)).off, X.axis); await X.c.close();
  X = await open({ page: newPage, script: oldJs });
  ok(`I the new page with the released script (another build key) leaves the list as the only view (${X.axis})`, X.axis === 'off:build', X.axis); await X.c.close();
  X = await open({ page: oldPage.replace(`data-build="${oldBuild}"`, `data-build="${newBuild}"`), script: newJs, catalogue: R3B });
  const v = X.axis === 'on' ? await X.p.evaluate(() => ({ ft: !!document.querySelector('#xpl .ftrack'), recent: !!document.querySelector('[data-preset="recent"]'), hasf: document.getElementById('xpl').className, nomk: null })) : null;
  ok('I this script with the released page and catalogue (build key aligned) draws the explorer exactly as before: no finds lane, no extra view button', X.axis === 'on' && v && !v.ft && !v.recent && v.hasf === 'xpl', [X.axis, v]);
  if (X.axis === 'on') { await X.p.evaluate(() => history.replaceState({ k: 78, win: [0.05, 0] }, '', location.href)); await X.p.reload({ waitUntil: 'load' }); await X.p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending'); await X.p.waitForTimeout(200);
    ok('I there, with no finds, the narrowest window is still 1 Ma: a stored 50,000-year window is refused', JSON.stringify(await view(X.p)) === '[538.8,0]', await view(X.p)); }
  await X.c.close(); }

await browser.close(); server.close();
console.log(`timeline-finds-ui: ${pass} pass, ${fail} fail` + (BREAK ? ` (BREAK=${BREAK})` : '') + (OLD ? ' (OLD=1)' : ''));
process.exit(fail ? 1 : 0);
