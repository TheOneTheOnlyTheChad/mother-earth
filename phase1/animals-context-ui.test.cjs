/* Mother Earth — Animals page, historical regional land context on the zebra card (C1a; ANIMALS-JOURNEY-CONTEXT build brief rev 1.2
 * §3 and §4). The REAL page files in Chromium, served by this suite's own server, with the committed context file.
 * Expected wording and figures are worked out HERE from the context file, by this file's own code, separately from the page's.
 * Fixtures: a changed context file is served with the pin in the served script replaced by the fixture's checksum (harness
 * substitution, stated here), so the page's STRUCTURE checks are what refuse it, not the checksum. Fixture "wrong-pin" is served
 * WITHOUT that substitution, so there the checksum is what refuses it.
 * What it does NOT prove: a real phone; a screen reader (roles and names are read from the page, not heard); print.
 * Breaks: BREAK=<name> edits the served animals-context.js; the suite must then FAIL at the check named in EXPECT ("BREAK CAUGHT").
 * Needs npm playwright (with Chromium) and globe.gl@2.45.0 through NODE_PATH (or ME_GLOBE_JS for the library file).
 * Run: NODE_PATH=<node_modules> node --no-warnings phase1/animals-context-ui.test.cjs */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const GLOBE_PATH = process.env.ME_GLOBE_JS || (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('FAIL  globe.gl@2.45.0 not found: set ME_GLOBE_JS or put the package on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) { pass++; console.log(`PASS  ${n}`); } else { fail++; failed.push(n.split(' ')[0]); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 1200)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 10 min'); process.exit(1); }, 10 * 60e3);

const JS = 'animals-context.js', CTX = 'assets/animals/zebra-botswana-Z3866-context-R1.json';
const PIN = '6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e';
const BREAKS = {
  'no-pin-check': [JS, "if (await hex(buf) !== want.sha256) throw new Unverified('the file does not match its pinned checksum');", ''],
  'no-sum-check': [JS, "need(mo.reduce((s, m) => s + m.count, 0) === f.count, 'the monthly rows do not sum to the total');", ''],
  'no-closing-check': [JS, "need(d.closing === C.CLOSING, 'the required closing sentence is missing or changed');", ''],
  'no-interval-check': [JS, "need(f.interval_utc.from === j.first_fix_utc.slice(0, 16) + 'Z' && f.interval_utc.to === j.last_fix_utc.slice(0, 16) + 'Z', 'the fire interval is not the journey rounded down to whole minutes');", ''],
  'unknown-as-no-gaps': [JS, "cl.textContent = 'Coverage unknown: the provider\\'s missing-data table could not be read for this period.';", "cl.textContent = \"No dates are listed in the provider's missing-data table for this period.\";"],
  'incomplete-shows-total': [JS, "if (cov.state === 'incomplete') fl.append(`Incomplete:", "if (false) fl.append(`Incomplete:"],
  'zero-as-number': [JS, "else if (f.count === 0) fl.append(`no detections in the record ${span}`);", ''],
  'months-open': [JS, "det.dataset.c = 'months';", "det.dataset.c = 'months'; det.open = true;"],
  'eager-load': [JS, "if (typeof IntersectionObserver === 'function') {", "if (false) {"],
  'mismatch-dropped': [JS, "ll.append(mm, ' A relative indicator", "ll.append(' A relative indicator"],
  'nodata-hidden': [JS, "if (l.union.nodata_km2 > 0) ll.append(", "if (false) ll.append("],
  'gaps-not-marked': [JS, "(inMonth ? ` (includes", "(false ? ` (includes"],
};
const EXPECT = { 'no-pin-check': '2a', 'no-sum-check': '2c', 'no-closing-check': '2d', 'no-interval-check': '2k', 'unknown-as-no-gaps': '2f', 'incomplete-shows-total': '2g',
  'zero-as-number': '2h', 'months-open': '1d', 'eager-load': '1a', 'mismatch-dropped': '1f', 'nodata-hidden': '2j', 'gaps-not-marked': '2i' };
if (BREAK && !(BREAKS[BREAK] && EXPECT[BREAK])) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }

const REAL = fs.readFileSync(path.join(ROOT, CTX)), D = JSON.parse(REAL);
// ---------- expectations, worked out here
const nf = x => Number(x).toLocaleString('en-GB'), nf1 = x => Number(x).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDay = s => `${+s.slice(8, 10)} ${MONTH[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
const CLOSING = 'These are regional observations. They do not show where the zebra went, what it encountered or how it was affected.';
const MISMATCH = 'Mapped tree-cover loss in the calendar years 2007 and 2008; these years extend beyond the recorded journey.';
const LANCE = "We acknowledge the use of data and/or imagery from NASA's Land, Atmosphere Near real-time Capability for Earth observations (LANCE) (https://earthdata.nasa.gov/lance), part of NASA's Earth Science Data and Information System (ESDIS).";

// ---------- server. S.ctx = { body, status, pin } overrides the context file and (if pin) the served script's pin
const S = { ctx: null, log: [] };
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.png': 'image/png' };
function served(f) { let t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (f === JS) { if (BREAK) { const [, from, to] = BREAKS[BREAK]; if (!t.includes(from)) { console.log('FAIL  break text not found: ' + BREAK); process.exit(1); } t = t.replace(from, to); }
    if (S.ctx && S.ctx.pin) t = t.replace(PIN, S.ctx.pin); }
  return t; }
const srv = http.createServer((q, s) => {
  const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'; S.log.push(f);
  const send = (code, type, body) => { s.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); s.end(body); };
  if (f === CTX && S.ctx) return S.ctx.status ? send(S.ctx.status, 'text/plain', 'no') : send(200, 'application/json', S.ctx.body);
  const full = path.join(ROOT, f); if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(404, 'text/plain', 'not found');
  const ext = path.extname(f); if (['.html', '.js', '.css'].includes(ext)) return send(200, TYPES[ext], served(f));
  send(200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(full));
});
let BASE;
async function open(browser, vp = { width: 1280, height: 860 }) {
  const ctx = await browser.newContext({ viewport: vp });
  await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
  const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  S.log = []; await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' });
  return { ctx, page, errs };
}
const fixture = (mutate, opts = {}) => { const d = JSON.parse(JSON.stringify(D)); mutate(d); const body = Buffer.from(JSON.stringify(d, null, 1)); return { body, pin: opts.noPin ? null : sha(body) }; };
const BOX = '#zebra-botswana-Z3866-context';
async function show(page) { await page.locator(BOX).scrollIntoViewIfNeeded(); await page.waitForFunction(s => { const b = document.querySelector(s); return b && b.dataset.state || /could not be loaded/.test(b.textContent); }, BOX, { timeout: 15000 }).catch(() => { }); }
const read = page => page.evaluate(s => { const b = document.querySelector(s), q = c => b.querySelector(`[data-c="${c}"]`);
  const det = q('months'), rows = det ? [...det.querySelectorAll('tbody tr')].map(r => [r.querySelector('th').textContent, r.querySelector('td').textContent]) : null;
  return { state: b.dataset.state || '', why: b.dataset.why || '', status: q('state').textContent, bodyHidden: q('body').hidden, text: q('body').textContent, fires: q('fires') ? q('fires').textContent : null,
    coverage: q('coverage') ? q('coverage').textContent : null, months: !!det, monthsOpen: det ? det.open : null, rows, total: det ? det.querySelector('tfoot td').textContent : null,
    loss: q('loss') ? q('loss').textContent : null, lossPara: q('loss') ? q('loss').parentElement.textContent : null, mismatchInLoss: !!(q('loss') && q('mismatch') && q('loss').parentElement.contains(q('mismatch'))),
    closing: q('closing') ? q('closing').textContent : null, sources: q('sources') ? q('sources').textContent : null, links: [...b.querySelectorAll('a')].map(a => [a.textContent, a.href]),
    lines: [...b.querySelectorAll('.an-ctx-line')].map(p => p.textContent), how: q('how') ? q('how').textContent : null, howOpen: q('how') ? q('how').open : null,
    heading: b.querySelector('h5').textContent, labelled: b.getAttribute('aria-labelledby') === b.querySelector('h5').id, live: q('state').getAttribute('aria-live') }; }, BOX);

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  try {
    ok(`0 the committed context file is the pinned one (${PIN.slice(0, 12)}…) and the served script carries that pin`, sha(REAL) === PIN && fs.readFileSync(path.join(ROOT, JS), 'utf8').includes(PIN));
    // ----- 1. the real file
    { const { ctx, page, errs } = await open(browser); await page.waitForTimeout(1500);
      const early = S.log.filter(f => f === CTX).length, inView = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top < innerHeight + 200, BOX);
      ok('1a the context file is not requested while the block is off screen, and is requested once it comes on screen', !inView && early === 0, { early, inView });
      await show(page); const r = await read(page); const asked = S.log.filter(f => f === CTX).length;
      ok('1a (cont.) requested exactly once; the block is verified against the pin', asked === 1 && r.state === 'verified' && !r.bodyHidden && r.status === 'Context file verified against its checksum.', { asked, state: r.state, why: r.why, status: r.status });
      ok('1b heading, labelling and live state', r.heading === 'Historical regional land context' && r.labelled && r.live === 'polite');
      const j = D.journey, b = D.region.bounds, f = D.fires;
      const wantLines = [`Recorded journey: ${longDay(j.first_fix_utc)} to ${longDay(j.last_fix_utc)} (UTC).`,
        `Area used for this context: two 4° grid cells, ${b.west}–${b.east}° E, ${-b.north}–${-b.south}° S, about ${nf(Math.round(D.region.area_km2_hub_grid / 100) * 100)} km². This is far larger than the area the zebra used.`];
      ok('1c the journey period (25 October 2007 to 22 October 2008) and the area (20–28° E, 18–22° S, about 371,700 km², far larger than the zebra used) are stated', r.lines[0] === wantLines[0] && r.lines[1] === wantLines[1] && wantLines[0].includes('25 October 2007 to 22 October 2008') && wantLines[1].includes('371,700'), r.lines.slice(0, 2));
      ok('1c the fire line: label with collection and file version, 21,744, the minute interval, Terra and Aqua, all confidence levels, not a count of fires, cloud hides some; coverage: no dates listed',
        r.fires === nf(f.count) && f.count === 21744 && r.lines[2].startsWith('Presumed vegetation-fire detections (NASA FIRMS; MODIS Collection 6 standard processing, file version 6.03): 21,744 from 25 Oct 2007 08:01 to 22 Oct 2008 23:00 UTC in that area, Terra and Aqua, all confidence levels. A detection marks a satellite pixel with an active fire; it is not a count of fires, and cloud hides some.')
        && r.coverage === "No dates are listed in the provider's missing-data table for this period.", { fires: r.fires, line: r.lines[2], coverage: r.coverage });
      const wantRows = f.by_month.map((m, i) => [m.label + (m.part_month ? (i === 0 ? `, part-month from ${m.from_utc.slice(11, 16)}` : `, part-month to ${m.to_utc.slice(11, 16)}`) : ''), nf(m.count)]);
      ok('1d the monthly table is a closed disclosure of 13 rows; first "25–31 Oct 2007, part-month from 08:01", last "1–22 Oct 2008, part-month to 23:00"; every count as in the file; total row 21,744',
        r.months && r.monthsOpen === false && r.rows.length === 13 && JSON.stringify(r.rows) === JSON.stringify(wantRows) && r.rows[0][0] === '25–31 Oct 2007, part-month from 08:01' && r.rows[12][0] === '1–22 Oct 2008, part-month to 23:00' && r.total === '21,744', { open: r.monthsOpen, rows: r.rows });
      ok('1e the monthly rows, worked out here, sum to the total', f.by_month.reduce((s, m) => s + m.count, 0) === f.count);
      const ha = D.loss.years.reduce((s, y) => s + D.loss.union.loss_ha[y], 0);
      ok('1f the loss value (about 245.0 ha; 2007 145.1, 2008 99.9) sits in one sentence with the calendar-year wording, the 30 % threshold and the relative-indicator caution',
        r.loss === `about ${nf1(ha)} ha` && r.loss === 'about 245.0 ha' && r.mismatchInLoss && r.lossPara.includes('(2007: 145.1 ha; 2008: 99.9 ha), where tree cover in 2000 was at least 30 %. ' + MISMATCH + ' A relative indicator, not a measured total; years before 2011 use an older method.') && !/No data for/.test(r.lossPara), r.lossPara);
      ok('1g the closing sentence is present, exactly, and is the last thing in the block', r.closing === CLOSING && r.text.endsWith(CLOSING));
      ok('1h sources: NASA FIRMS (MODIS) with the LANCE acknowledgement verbatim, the Hansen credit, CC BY 4.0 linked, and the local-scale caveat',
        r.sources.includes(LANCE) && r.sources.includes('Source: Hansen/UMD/Google/USGS/NASA') && r.sources.includes('Not for local-scale or tactical decisions.') && r.links.some(([t, h]) => t === 'CC BY 4.0' && h === 'https://creativecommons.org/licenses/by/4.0/') && r.links.some(([t, h]) => t === 'NASA FIRMS (MODIS)' && h === 'https://firms.modaps.eosdis.nasa.gov/'), r.sources);
      const how = r.how || '';
      ok('1i "How these figures were made" is closed and states: per-cell and per-satellite counts, what was left out, the ellipsoid and grid areas, pixels left out, no data, every caution',
        r.howOpen === false && how.includes('20–24° E 15,520, 24–28° E 6,224') && how.includes('Aqua 13,240, Terra 8,504') && how.includes('Left out: 3 detections of other types (type 2: 3), 22 outside the period, 2 outside the two cells; identical rows dropped: 0.')
        && how.includes('WGS84 ellipsoid (each cell 185,321.0 km²)') && how.includes('grid sphere (185,861 km² each)') && how.includes('10,374 in 20–24° E, 78,528 in 24–28° E') && how.includes('no data 0.0 km²') && D.loss.cautions.every(c => how.includes(c)) && how.includes('the line at 24° E belongs to the eastern cell'), how.slice(0, 600));
      ok('1j the zebra card\'s study facts are still filled and verified (the block changes nothing else)', await page.evaluate(() => document.querySelector('#zebra-botswana-Z3866 [data-f="state"]').textContent === 'Study file verified against its checksum.'));
      ok('1k no page errors', errs.length === 0, errs);
      // keyboard: the monthly disclosure opens with Enter on its summary
      await page.focus(`${BOX} [data-c="months"] summary`); await page.keyboard.press('Enter');
      ok('1l the monthly disclosure opens from the keyboard and shows its table', await page.evaluate(s => { const d = document.querySelector(s + ' [data-c="months"]'); return d.open && d.querySelector('table').getBoundingClientRect().height > 100; }, BOX));
      await ctx.close(); }
    // ----- 1m. narrow screen
    { const { ctx, page, errs } = await open(browser, { width: 390, height: 844 }); await show(page);
      await page.evaluate(s => { document.querySelectorAll(s + ' details').forEach(d => d.open = true); }, BOX); await page.waitForTimeout(200);
      const w = await page.evaluate(s => { const b = document.querySelector(s); return { box: b.scrollWidth <= b.clientWidth + 1, page: document.documentElement.scrollWidth <= innerWidth + 1, state: b.dataset.state }; }, BOX);
      ok('1m at 390 px the block, with both disclosures open, does not overflow sideways', w.box && w.page && w.state === 'verified' && errs.length === 0, w);
      await ctx.close(); }
    // ----- 2. fixtures
    const run = async (name, fx, check) => { S.ctx = fx; const { ctx, page } = await open(browser); await show(page); const r = await read(page); S.ctx = null; await ctx.close(); check(r); };
    const refusedNoFigure = r => r.state === 'unverified' && r.bodyHidden && r.text === '' && r.status === 'The regional context could not be verified. No figure is shown.';
    await run('2a', fixture(d => { d.fires.count += 0; d.builder.version = 'X'; }, { noPin: true }), r => ok('2a a file that does not match the pin is refused and no figure is shown', refusedNoFigure(r) && /pinned checksum/.test(r.why), r.why));
    await run('2b', { status: 500 }, r => ok('2b a failed request says it could not be loaded and shows no figure', r.bodyHidden && r.text === '' && r.status === 'The regional context could not be loaded. No figure is shown.', r.status));
    await run('2c', fixture(d => { d.fires.by_month[5].count += 1; }), r => ok('2c monthly rows that do not sum to the total are refused', refusedNoFigure(r) && /sum to the total/.test(r.why), r.why));
    await run('2d', fixture(d => { d.closing = 'These are regional observations.'; }), r => ok('2d a changed closing sentence is refused', refusedNoFigure(r) && /closing/.test(r.why), r.why));
    await run('2e', fixture(d => { delete d.loss.mismatch; }), r => ok('2e a loss record without the calendar-year wording is refused', refusedNoFigure(r) && /calendar-year/.test(r.why), r.why));
    await run('2f', fixture(d => { d.fires.coverage.state = 'unknown'; }), r => ok('2f unknown coverage says "Coverage unknown", never "No dates are listed"; the total is still shown',
      r.state === 'verified' && r.coverage.startsWith('Coverage unknown') && !/No dates are listed/.test(r.text) && r.fires === '21,744', { cov: r.coverage, why: r.why }));
    await run('2g', fixture(d => { d.fires.coverage.state = 'incomplete'; d.fires.count = null; d.fires.by_month.forEach(m => m.count = null); }), r => ok('2g an incomplete record says "Incomplete", shows no total, no monthly table and no per-cell counts',
      r.state === 'verified' && /Incomplete: the fire record for this period could not be fully read, so no total is shown/.test(r.lines[2]) && r.fires === null && !r.months && !/21,744|15,520|13,240/.test(r.text), { line: r.lines[2], why: r.why }));
    await run('2h', fixture(d => { d.fires.count = 0; d.fires.by_month.forEach(m => m.count = 0); d.fires.by_cell = { '17_50': 0, '17_51': 0 }; d.fires.by_satellite = { Aqua: 0, Terra: 0 }; }),
      r => ok('2h a valid zero reads "no detections in the record", not as a number, and differs from no data', r.state === 'verified' && r.fires === null && /: no detections in the record from 25 Oct 2007 08:01/.test(r.lines[2]) && !/could not/.test(r.text) && r.coverage.startsWith('No dates are listed'), { line: r.lines[2], why: r.why }));
    await run('2i', fixture(d => { d.fires.coverage.gap_days_listed_in_interval = ['2008-03-04', '2008-03-05']; }), r => ok('2i listed missing dates are named in the coverage line and marked on their month',
      r.state === 'verified' && r.coverage === "The provider's missing-data table lists 2 dates in this period (2008-03-04, 2008-03-05); detections on them may be missing." && r.rows[5][1] === '13 (includes 2 dates listed as missing)' && r.rows.filter(x => /listed as missing/.test(x[1])).length === 1, { cov: r.coverage, row: r.rows && r.rows[5], why: r.why }));
    await run('2j', fixture(d => { d.loss.union.nodata_km2 = 12.3; d.loss.by_cell['17_50'].nodata_km2 = 12.3; }), r => ok('2j a no-data area is stated beside the loss value and never counted as zero loss',
      r.state === 'verified' && r.lossPara.includes('No data for about 12.3 km² of the area; it is not counted as zero loss.'), { para: r.lossPara, why: r.why }));
    await run('2k', fixture(d => { d.fires.interval_utc.from = '2007-10-25T08:00Z'; d.fires.by_month[0].from_utc = '2007-10-25T08:00Z'; }), r => ok('2k a fire interval that is not the journey rounded down to whole minutes is refused', refusedNoFigure(r) && /rounded down/.test(r.why), r.why));
    await run('2l', fixture(d => { d.loss.by_cell['17_51'].loss_ha['2008'] += 5; }), r => ok('2l per-cell loss that does not add up to the total is refused', refusedNoFigure(r) && /add up/.test(r.why), r.why));
    await run('2m', fixture(d => { d.fires.by_month[0].part_month = false; }), r => ok('2m a first row not marked as a part-month is refused', refusedNoFigure(r) && /part-months/.test(r.why), r.why));
    await run('2n', fixture(d => { d.loss.provenance.credit = 'Hansen'; }), r => ok('2n a missing Hansen credit is refused', refusedNoFigure(r) && /credit/.test(r.why), r.why));
  } catch (e) { fail++; failed.push('crash'); console.log('FAIL  crashed: ' + (e && e.stack || e)); }
  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (BREAK) { const caught = failed.includes(EXPECT[BREAK]); console.log(caught ? `BREAK CAUGHT  ${BREAK} at ${EXPECT[BREAK]}` : `BREAK MISSED  ${BREAK} (expected ${EXPECT[BREAK]}; failed: ${failed.join(', ') || 'none'})`); process.exit(caught ? 0 : 1); }
  process.exit(fail ? 1 : 0);
})();
