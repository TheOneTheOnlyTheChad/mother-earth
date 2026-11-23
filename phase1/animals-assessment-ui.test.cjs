/* Mother Earth — Animals page, conservation assessment blocks (animals-assessment-rc; ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF rev 1
 * with GPT's three clarifications of 22 Nov 2026).
 * The REAL page files in Chromium, served by this suite's own server, with the committed assessment file.
 * INDEPENDENT EXPECTATIONS: the sentences in WANT below are typed here from the reviewed evidence record
 * (reviews/2026-11-22-animals-assessment-evidence.md section 2), not read from the assessment file the page uses. A wrong
 * category, identifier, date or scope that is correctly built and pinned fails section 2.
 * Fixtures: a changed assessment file is re-pinned in the served script (harness substitution, stated here), so the page's
 * own rules are what is tested, not the checksum; 6a serves changed bytes WITHOUT re-pinning, to test the checksum.
 * The reader's clock is fixed per check with Playwright's clock, so "overdue" is tested against known dates.
 * What it does NOT prove: that the Red List still says this today (that is the six-monthly check, done by a person); a real
 * phone; Safari; a screen reader; print. The journeys, census and corridor have their own suites, rerun on the same tree.
 * Breaks: BREAK=<name> edits one served file; the suite must then FAIL at the check named in EXPECT ("BREAK CAUGHT").
 * Needs npm playwright (with Chromium) and globe.gl@2.45.0 through NODE_PATH (or ME_GLOBE_JS for the library file).
 * Run: NODE_PATH=<node_modules> node --no-warnings phase1/animals-assessment-ui.test.cjs      SECTIONS=2,4 runs parts. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const GLOBE_PATH = process.env.ME_GLOBE_JS || (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('FAIL  globe.gl@2.45.0 not found: set ME_GLOBE_JS or put the package on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '';
const ONLY = (process.env.SECTIONS || '').split(',').filter(Boolean).map(Number), want = n => !ONLY.length || ONLY.includes(n);
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 1800)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 15 min'); process.exit(1); }, 15 * 60e3);

const JS = 'animals-assessment.js', FILE = 'assessments-R1.json';
const REAL = fs.readFileSync(path.join(ROOT, 'assets/animals', FILE)), REALJ = JSON.parse(REAL), PIN = sha(REAL);
const Z = 'zebra-botswana-Z3866', SH = 'white-shark-sa-118845', WH = 'false-killer-whale-hawaii-98364', AL = 'waved-albatross-galapagos-3275-30662', PE = 'african-penguin-census';
const CARDS = [Z, SH, WH, AL, PE];
// ---------- typed from the reviewed evidence record; the check date and edition are that record's too
const TAIL = ' Red List edition 2026-1. Checked by Mother Earth on 22 November 2026.';
const WANT = {
  [Z]: { cat: 'Extinction-risk category: Near Threatened. IUCN Red List, global assessment of plains zebra (Equus quagga), assessed 20 June 2016. Published 2016.' + TAIL,
    cite: 'Citation: King, S.R.B. & Moehlman, P.D. 2016. Equus quagga. The IUCN Red List of Threatened Species 2016: e.T41013A45172424. https://dx.doi.org/10.2305/IUCN.UK.2016-2.RLTS.T41013A45172424.en. Accessed on 22 November 2026. Assessment page.',
    page: 'https://www.iucnredlist.org/species/41013/45172424', years: [2007, 2008],
    unit: 'This is not about the animal shown. The assessment covers the species worldwide; the journey is one collared zebra tracked in northern Botswana, 2007 to 2008.' },
  [SH]: { cat: 'Extinction-risk category: Vulnerable. IUCN Red List, global assessment of white shark (Carcharodon carcharias), assessed 7 November 2018. This version published 2022, an amended version of the 2019 assessment.' + TAIL,
    cite: 'Citation: Rigby, C.L., Barreto, R., Carlson, J., Fernando, D., Fordham, S., Francis, M.P., Herman, K., Jabado, R.W., Jones, G.C.A., Liu, K.M., Lowe, C.G, Marshall, A., Pacoureau, N., Romanov, E., Sherley, R.B. & Winker, H. 2022. Carcharodon carcharias (amended version of 2019 assessment). The IUCN Red List of Threatened Species 2022: e.T3855A212629880. https://dx.doi.org/10.2305/IUCN.UK.2022-1.RLTS.T3855A212629880.en. Accessed on 22 November 2026. Assessment page.',
    page: 'https://www.iucnredlist.org/species/3855/212629880', years: [2012, 2013],
    unit: 'This is not about the animal shown. The assessment covers the species worldwide; the journey is one tagged shark tracked in the waters off South Africa and southern Mozambique, 2012 to 2013.' },
  [WH]: { cat: 'Extinction-risk category: Near Threatened. IUCN Red List, global assessment of false killer whale (Pseudorca crassidens), assessed 23 July 2018. Published 2018; errata version published in 2019.' + TAIL,
    cite: 'Citation: Baird, R.W. 2018. Pseudorca crassidens (errata version published in 2019). The IUCN Red List of Threatened Species 2018: e.T18596A145357488. https://dx.doi.org/10.2305/IUCN.UK.2018-2.RLTS.T18596A145357488.en. Accessed on 22 November 2026. Assessment page.',
    page: 'https://www.iucnredlist.org/species/18596/145357488', years: [2013, 2014],
    unit: 'This is not about the animal shown. The assessment covers the species worldwide; the journey is one tagged whale tracked in Hawaiian waters and the North Pacific to the east, 2013 to 2014. No assessment of this animal’s own stock was verified for this card.' },
  [AL]: { cat: 'Extinction-risk category: Critically Endangered. IUCN Red List, global assessment of waved albatross (Phoebastria irrorata), assessed 7 August 2018. Published 2018.' + TAIL,
    cite: 'Citation: BirdLife International 2018. Phoebastria irrorata. The IUCN Red List of Threatened Species 2018: e.T22698320A132641638. https://dx.doi.org/10.2305/IUCN.UK.2018-2.RLTS.T22698320A132641638.en. Accessed on 22 November 2026. Assessment page.',
    page: 'https://www.iucnredlist.org/species/22698320/132641638', years: [2008, 2008],
    unit: 'This is not about the animal shown. The assessment covers the species worldwide; the journey is one tagged bird tracked in the Galápagos and the eastern Pacific, 2008.' },
  [PE]: { cat: 'Extinction-risk category: Critically Endangered. IUCN Red List, global assessment of African penguin (Spheniscus demersus), assessed 4 July 2024. Published 2024.' + TAIL,
    cite: 'Citation: BirdLife International 2024. Spheniscus demersus. The IUCN Red List of Threatened Species 2024: e.T22697810A256021744. https://dx.doi.org/10.2305/IUCN.UK.2024-2.RLTS.T22697810A256021744.en. Accessed on 22 November 2026. Assessment page.',
    page: 'https://www.iucnredlist.org/species/22697810/256021744',
    unit: 'The assessment covers the species as a whole at its date. The charts above are counts of occupied nest sites at named colonies, 1979 to 2019, from a different source.' } };
const TREND = 'Population trend: not shown here; see the assessment.';
const CATWORDS = /Least Concern|Near Threatened|Vulnerable|Endangered|Extinct|Data Deficient/;
const FORBID = /decreas|increas|\bstable\b|criteria|A2bd|A2d|B2ab|A3bce|green status|Europe|Mediterranean|regional|subpopulation|recover|no assessment (of|for) .* exists|does not exist/i;

const BREAKS = {
  'wrong-assessment-date': 'DATA',   // a different date in the file, built and pinned correctly: as if a Green Status date had been typed in. Only the independent expectations can see it.
  'wrong-category': 'DATA',
  'whale-this-version-2018': [JS, "return `Published ${r.published_year}; errata version published in ${v.year}.`;", "return `This version published ${r.published_year}.`;"],
  'failed-advances-check-date': [JS, "Checked by Mother Earth on ${day(r.last_successful_check)}.`);", "Checked by Mother Earth on ${day(r.last_attempt.date)}.`);"],
  'suppressed-shows-category': [JS, "    if (r.status === 'suppressed') return na(box, 'Not available. ' + r.suppressed_reason, 'suppressed');", "    if (false) return;"],
  'trend-shown': [JS, "trend: 'Population trend: not shown here; see the assessment.'", "trend: 'Population trend: decreasing.'"],
  'regional-shown': [JS, "if (r.scope !== 'global' || !A.CATEGORIES.includes(r.category)) return false;", "if (!A.CATEGORIES.includes(r.category)) return false;"],
  'claims-no-stock-assessment': [JS, "own stock was verified for this card.'", "own stock exists.'"],
  'no-pin-check': [JS, "if (await hex(buf) !== A.SHA256) throw 0; ", ""],
  'no-shape-check': [JS, "    if (!wellFormed(r)) return na(box, A.T.malformed, 'malformed');\n", ""],
  'overdue-hides-failed': [JS, "    if (today > r.next_check_due) { notices.push('overdue');", "    else if (today > r.next_check_due) { notices.push('overdue');"],
  'never-overdue': [JS, "if (today > r.next_check_due) {", "if (false) {"],
  'failed-not-said': [JS, "if (r.last_attempt.result === 'failed') {", "if (false) {"],
  'contacts-red-list': [JS, "  load();\n})();", "  fetch('https://www.iucnredlist.org/species/41013/45172424').catch(() => { }); load();\n})();"],
  'accessed-from-failed-attempt': [JS, "`. Accessed on ${day(r.last_successful_check)}. `", "`. Accessed on ${day(r.last_attempt.date)}. `"],
  'accessed-from-readers-clock': [JS, "`. Accessed on ${day(r.last_successful_check)}. `", "`. Accessed on ${day(today)}. `"],
  'imported-accessed-kept': [JS, " || /ccessed/.test(r.citation)) return false;", ") return false;"],
  'colour-badge': [JS, "const cat = el('p', 'as-cat');", "const cat = el('p', 'as-cat'); cat.style.backgroundColor = 'rgb(200, 30, 30)';"],
};
const EXPECT = { 'wrong-assessment-date': '2a', 'wrong-category': '2a', 'whale-this-version-2018': '2a', 'failed-advances-check-date': '4b', 'suppressed-shows-category': '5a', 'trend-shown': '2d', 'regional-shown': '6c',
  'claims-no-stock-assessment': '2c', 'no-pin-check': '6a', 'no-shape-check': '6b', 'overdue-hides-failed': '4e', 'never-overdue': '4c', 'failed-not-said': '4a', 'contacts-red-list': '7a', 'colour-badge': '2e', 'accessed-from-failed-attempt': '4f', 'accessed-from-readers-clock': '2b', 'imported-accessed-kept': '6g' };
if (BREAK && !(BREAKS[BREAK] && EXPECT[BREAK])) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }

/** a changed assessment file (harness fixture) */
const fx = mutate => { const d = JSON.parse(JSON.stringify(REALJ)); mutate(d); return Buffer.from(JSON.stringify(d)); };
const rec = (d, card) => d.records.find(r => r.card === card);
const DATA_BREAK = BREAK === 'wrong-assessment-date' ? fx(d => { rec(d, SH).assessed = '2021-03-31'; }) : BREAK === 'wrong-category' ? fx(d => { rec(d, AL).category = 'Endangered'; }) : null;

// ---------- server. S.fx = a re-pinned fixture body; S.raw = a body served WITHOUT re-pinning; S.status = an HTTP error
const S = { fx: null, raw: null, status: 0, log: [] };
const reset = () => Object.assign(S, { fx: DATA_BREAK, raw: null, status: 0, log: [] });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream' };
function served(f) { let t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const E = BREAK && BREAKS[BREAK]; if (Array.isArray(E) && E[0] === f) { for (let k = 1; k < E.length; k += 2) { if (t.split(E[k]).length !== 2) { console.log('FAIL  edit did not apply: ' + BREAK + ' #' + k); process.exit(1); } t = t.replace(E[k], E[k + 1]); } }
  if (f === JS) { if (t.split(PIN).length !== 2) { console.log('FAIL  pinned checksum not found in ' + f); process.exit(1); } if (S.fx) t = t.replace(PIN, sha(S.fx)); }
  return t; }
const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0]), f = p.replace(/^\//, '') || 'index.html';
  const send = (code, type, body) => { s.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); s.end(body); };
  if (p === '/assets/animals/' + FILE) { S.log.push(FILE); if (S.status) return send(S.status, 'text/plain', 'no'); return send(200, 'application/json', S.raw || S.fx || REAL); }
  if (!fs.existsSync(path.join(ROOT, f)) || fs.statSync(path.join(ROOT, f)).isDirectory()) return send(404, 'text/plain', '');
  const ext = path.extname(f); if (TYPES[ext] && ext !== '.json' && ext !== '.bin') return send(200, TYPES[ext], served(f));
  send(200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(path.join(ROOT, f)));
});
let BASE;
async function open(browser, now = '2026-11-23T10:00:00Z', vp = { width: 1280, height: 860 }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' }), outside = [];
  await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/*iucnredlist.org/**', r => { outside.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.clock.setFixedTime(new Date(now));
  await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.animalsAssessment && ME.animalsAssessment.state().status !== 'loading', null, { timeout: 30000 });
  await page.waitForTimeout(120);
  return { ctx, page, errs, outside };
}
const read = page => page.evaluate(() => ({ status: ME.animalsAssessment.state().status, cards: ME.animalsAssessment.state().cards,
  blocks: [...document.querySelectorAll('[data-assess]')].map(b => { const t = c => { const e = b.querySelector(c); return e ? e.textContent : null; };
    return { card: b.dataset.assess, state: b.dataset.state, notices: b.dataset.notices, text: b.textContent, cat: t('.as-cat'), cite: t('.as-cite'), unit: t('.as-unit'), trend: t('.as-trend'), failed: t('.as-failed'), overdue: t('.as-overdue'),
      links: [...b.querySelectorAll('a')].map(a => [a.textContent, a.href, a.target, a.rel]), italics: [...b.querySelectorAll('i')].map(i => i.textContent), paras: b.querySelectorAll('p').length,
      pictures: b.querySelectorAll('img,svg,canvas,[style]').length, bg: [...b.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)'),
      colours: [...new Set([...b.querySelectorAll('p,b,i')].map(e => getComputedStyle(e).color))], over: b.scrollWidth - b.clientWidth,
      inCorridor: !!b.closest('#cor-panel'), inCensus: !!b.closest('#an-census'), afterCensus: !!(b.closest('section') && b.closest('section').previousElementSibling && b.closest('section').previousElementSibling.id === 'an-census'), heading: (() => { let e = b.previousElementSibling; return e ? e.tagName + ':' + e.textContent : null; })() }; }) }));
const by = (r, card) => r.blocks.find(b => b.card === card);

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    // ---------- 1. the committed file, the day after its check
    if (want(1)) { reset(); const o = await open(browser), r = await read(o.page);
      ok('1a the page reaches "ready" with no page error and exactly five assessment blocks, one per reviewed card', r.status === 'ready' && o.errs.length === 0 && r.blocks.length === 5 && CARDS.every(c => by(r, c)), [r.status, o.errs, r.blocks.map(b => b.card)]);
      ok('1b every block is shown, with no notice, and holds four paragraphs: category, citation, what is shown, trend line', r.blocks.every(b => b.state === 'shown' && b.notices === '' && b.paras === 4 && !b.failed && !b.overdue), r.blocks.map(b => [b.card, b.state, b.notices, b.paras]));
      ok('1c the four journey blocks sit under "Conservation assessment" on their cards; the penguin block has its own heading in its own section straight after the census section, not inside it (the census card still shows nothing but its counts); none is in the corridor panel', r.blocks.every(b => (b.card === PE ? b.heading === 'H3:African penguin: conservation assessment' && !b.inCensus && b.afterCensus : b.heading === 'H5:Conservation assessment') && !b.inCorridor), r.blocks.map(b => [b.card, b.heading, b.inCorridor]));
      await o.ctx.close(); }
    // ---------- 2. the words, against expectations typed from the evidence record
    if (want(2)) { reset(); const o = await open(browser), r = await read(o.page);
      for (const c of CARDS) { const b = by(r, c) || {};
        ok(`2a ${c}: the category sentence is the reviewed category, species, assessment date, publication wording, edition and check date, word for word`, b.cat === WANT[c].cat, b.cat);
        ok(`2b ${c}: the citation is the reviewed one, with a link to its DOI and a link to its own assessment page, ending with exactly one "Accessed on" date, which is our successful check (22 November 2026)`, b.cite === WANT[c].cite && ((b.text || '').match(/Accessed on/g) || []).length === 1 && / Accessed on 22 November 2026\. Assessment page\.$/.test(b.cite || '') && b.links && b.links.length === 2 && b.links[0][1] === WANT[c].cite.match(/https:\S+\.en/)[0] && b.links[1][1] === WANT[c].page && b.links.every(l => l[2] === '_blank' && l[3] === 'noopener'), [b.cite, b.links]);
        ok(`2c ${c}: the "what is shown" sentence is as reviewed`, b.unit === WANT[c].unit, b.unit);
        ok(`2d ${c}: the trend line says trend is not shown, and nothing in the block gives a trend, criteria, a regional or Green Status value, or says a stock assessment does not exist`, b.trend === TREND && !FORBID.test(b.text || ''), [b.trend, (b.text || '').match(FORBID)]);
        ok(`2e ${c}: words only: no picture, no inline style, no background colour, one text colour, the species name in italics`, b.pictures === 0 && b.bg && b.bg.length === 0 && b.colours.length === 1 && b.italics.length === 1 && WANT[c].cat.includes(`(${b.italics[0]})`), [b.pictures, b.bg, b.colours, b.italics]); }
      ok('2f only the false killer whale block carries the "own stock was not verified" sentence', CARDS.filter(c => /own stock/.test(by(r, c).text)).join() === WH);
      const yrs = {}; for (const [c, f] of [[Z, 'zebra-botswana'], [SH, 'white-shark-sa'], [WH, 'false-killer-whale-hawaii'], [AL, 'waved-albatross-galapagos']]) { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/animals', f + '-R1.manifest.json'))).journeys[0]; yrs[c] = [new Date(j.first_fix_s * 1000).getUTCFullYear(), new Date(j.last_fix_s * 1000).getUTCFullYear()]; }
      ok('2g the years in each journey sentence are the years of that journey\'s first and last displayed fix, read here from its manifest', [Z, SH, WH, AL].every(c => yrs[c][0] === WANT[c].years[0] && yrs[c][1] === WANT[c].years[1]), yrs);
      await o.ctx.close(); }
    // ---------- 4. check states (fixtures, re-pinned; clock fixed)
    if (want(4)) {
      { reset(); S.fx = fx(d => { rec(d, Z).last_attempt = { date: '2027-03-01', result: 'failed' }; }); const o = await open(browser, '2027-03-02T10:00:00Z'), r = await read(o.page), b = by(r, Z);
        ok('4a latest check failed: the category is still shown, with the notice naming the failed attempt\'s own date, and no overdue notice', b.state === 'shown' && b.notices === 'failed' && b.failed === 'The latest check on 1 March 2027 could not be completed.' && !b.overdue && CATWORDS.test(b.cat || ''), [b.state, b.notices, b.failed, b.overdue]);
        ok('4b after a failed attempt the "Checked by Mother Earth on" date is still the last SUCCESSFUL check, 22 November 2026', b.cat === WANT[Z].cat, b.cat);
        ok('4f after a failed attempt the citation still ends "Accessed on 22 November 2026", once: the failed attempt\'s date is not an access date', b.cite === WANT[Z].cite && (b.text.match(/Accessed on/g) || []).length === 1, b.cite);
        ok('4a the other four blocks carry no notice', CARDS.filter(c => c !== Z).every(c => by(r, c).notices === '' && by(r, c).state === 'shown'));
        await o.ctx.close(); }
      { reset(); const o = await open(browser, '2027-05-23T00:30:00Z'), r = await read(o.page);
        ok('4c overdue: the day after the due date every block keeps its category and adds "This record’s check is overdue. It was due on 22 May 2027."', r.blocks.every(b => b.state === 'shown' && b.notices === 'overdue' && b.overdue === 'This record’s check is overdue. It was due on 22 May 2027.' && b.cat === WANT[b.card].cat && b.cite === WANT[b.card].cite), r.blocks.map(b => [b.card, b.notices, b.overdue]));
        await o.ctx.close(); }
      { reset(); const o = await open(browser, '2027-05-22T23:30:00Z'), r = await read(o.page);
        ok('4d on the due date itself (UTC) nothing is overdue', r.blocks.every(b => b.state === 'shown' && b.notices === '' && !b.overdue), r.blocks.map(b => [b.card, b.notices]));
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { rec(d, PE).last_attempt = { date: '2027-05-30', result: 'failed' }; }); const o = await open(browser, '2027-06-01T10:00:00Z'), r = await read(o.page), b = by(r, PE);
        ok('4e failed AND overdue: both notices are shown, neither hides the other, and the successful-check date has not moved', b.state === 'shown' && b.notices === 'failed overdue' && b.failed === 'The latest check on 30 May 2027 could not be completed.' && /It was due on 22 May 2027\.$/.test(b.overdue || '') && b.cat === WANT[PE].cat && b.cite === WANT[PE].cite, [b.notices, b.failed, b.overdue, b.cat]);
        await o.ctx.close(); } }
    // ---------- 5. suppression
    if (want(5)) { const WHY = 'The assessment was replaced and the new one has not been reviewed.';
      { reset(); S.fx = fx(d => { Object.assign(rec(d, SH), { status: 'suppressed', suppressed_reason: WHY }); }); const o = await open(browser), r = await read(o.page), b = by(r, SH);
        ok('5a a suppressed record shows no category, whatever its check dates: the block reads "Not available." and the reason, and nothing else', b.state === 'unavailable' && b.text === 'Not available. ' + WHY && !CATWORDS.test(b.text) && b.links.length === 0 && r.cards[SH].why === 'suppressed', [b.state, b.text]);
        ok('5b the other four blocks are unaffected', CARDS.filter(c => c !== SH).every(c => by(r, c).cat === WANT[c].cat));
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { Object.assign(rec(d, SH), { status: 'suppressed', suppressed_reason: WHY, last_attempt: { date: '2027-05-30', result: 'failed' } }); }); const o = await open(browser, '2027-06-01T10:00:00Z'), r = await read(o.page), b = by(r, SH);
        ok('5c suppressed, failed and overdue together: still no category and no notice; suppression comes first', b.state === 'unavailable' && b.text === 'Not available. ' + WHY && b.notices === '' && !b.failed && !b.overdue, [b.text, b.notices]);
        await o.ctx.close(); } }
    // ---------- 6. a file that cannot be used
    if (want(6)) {
      { reset(); S.raw = fx(d => { rec(d, Z).category = 'Least Concern'; }); const o = await open(browser), r = await read(o.page);
        const rest = await o.page.evaluate(async () => { for (let i = 0; i < 100 && ME.census.state().status === 'loading'; i++) await new Promise(r => setTimeout(r, 100)); return { census: ME.census.state().status, facts: [...document.querySelectorAll('.an-study [data-f="facts"]')].filter(t => !t.hidden).length, pop: [...document.querySelectorAll('[data-f="pop"]')].length }; });
        ok('6a a file that is not the pinned file (one changed category, checksum left alone): all five blocks read "Not available. The assessment record could not be verified." and no category appears', r.status === 'unverified' && r.blocks.length === 5 && r.blocks.every(b => b.state === 'unavailable' && b.text === 'Not available. The assessment record could not be verified.' && !CATWORDS.test(b.text)), [r.status, r.blocks.map(b => b.text)]);
        ok('6a the rest of the page is unaffected: no page error, the census is ready, the four study cards are filled', o.errs.length === 0 && rest.census === 'ready' && rest.facts === 4 && rest.pop === 4, [o.errs, rest]);
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { rec(d, AL).category = 'CR'; }); const o = await open(browser), r = await read(o.page), b = by(r, AL);
        ok('6b a malformed record in a correctly pinned file (a category code, not the word): that block reads "Not available" with no category; the other four are shown', b.state === 'unavailable' && /^Not available\. This card’s assessment record could not be verified\.$/.test(b.text) && CARDS.filter(c => c !== AL).every(c => by(r, c).cat === WANT[c].cat), [b.state, b.text]);
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { rec(d, WH).scope = 'Europe'; rec(d, WH).category = 'Data Deficient'; }); const o = await open(browser), r = await read(o.page), b = by(r, WH);
        ok('6c a record whose scope is not global is never shown, even correctly pinned: no regional category can reach a card', b.state === 'unavailable' && !CATWORDS.test(b.text) && !/Europe/.test(b.text), [b.state, b.text]);
        await o.ctx.close(); }
      { reset(); S.status = 500; const o = await open(browser), r = await read(o.page);
        ok('6d the file cannot be loaded (HTTP 500): all five read "Not available. The assessment record could not be loaded.", with no page error', r.status === 'failed' && o.errs.length === 0 && r.blocks.every(b => b.text === 'Not available. The assessment record could not be loaded.'), [r.status, r.blocks.map(b => b.text)]);
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { d.records = d.records.filter(x => x.card !== PE); d.records.push(JSON.parse(JSON.stringify(rec(d, Z)))); }); const o = await open(browser), r = await read(o.page);
        ok('6e a card with no record, and a card with two records, each read "Not available. No assessment record is filed for this card."; the rest are shown', by(r, PE).text === 'Not available. No assessment record is filed for this card.' && by(r, Z).text === by(r, PE).text && [SH, WH, AL].every(c => by(r, c).cat === WANT[c].cat), [by(r, PE).text, by(r, Z).text]);
        await o.ctx.close(); }
      { reset(); S.fx = fx(d => { rec(d, SH).citation += ' Accessed on 19 November 2026.'; }); const o = await open(browser), r = await read(o.page), b = by(r, SH);
        ok('6g a record whose citation carries a typed-in "Accessed" date (the website\'s own stale date) is not shown, even correctly pinned; the other four are shown with one access date each', b.state === 'unavailable' && !/Accessed/.test(b.text) && CARDS.filter(c => c !== SH).every(c => by(r, c).cite === WANT[c].cite), [b.state, b.text]);
        await o.ctx.close(); }
      { reset(); S.raw = Buffer.from('{not json'); const o = await open(browser), r = await read(o.page);
        ok('6f a file that is not JSON: all five "could not be verified", no page error', r.status === 'unverified' && o.errs.length === 0 && r.blocks.every(b => /could not be verified\.$/.test(b.text)), [r.status, o.errs]);
        await o.ctx.close(); } }
    // ---------- 7. what the page does not do
    if (want(7)) { reset(); const o = await open(browser), r = await read(o.page);
      ok('7a the page makes no request to iucnredlist.org, and asks this site for the assessment file exactly once', o.outside.length === 0 && S.log.length === 1, [o.outside, S.log]);
      const cor = await o.page.evaluate(() => ({ blocks: document.querySelectorAll('#cor-panel [data-assess], #cor-panel .an-assess').length, text: /Extinction-risk|Red List/.test(document.getElementById('cor-panel').textContent), deer: /mule deer/i.test([...document.querySelectorAll('[data-assess]')].map(b => b.textContent).join(' ')) }));
      ok('7b the corridor panel has no assessment block and no Red List wording; no block mentions mule deer', cor.blocks === 0 && !cor.text && !cor.deer, cor);
      await o.ctx.close();
      const n = await open(browser, '2026-11-23T10:00:00Z', { width: 360, height: 740 }), rn = await read(n.page);
      ok('7c at 360 px wide every block is shown and none is wider than its box', rn.blocks.every(b => b.state === 'shown' && b.over <= 1), rn.blocks.map(b => [b.card, b.over]));
      await n.ctx.close(); }
  } catch (e) { fail++; console.log('FAIL  suite error: ' + (e && e.stack || e).toString().slice(0, 900)); }
  await browser.close(); srv.close(); clearTimeout(wd);
  if (BREAK) { const hit = failed.some(n => n.startsWith(EXPECT[BREAK])); console.log(hit ? `BREAK CAUGHT  ${BREAK} (at "${EXPECT[BREAK]}"; ${fail} checks failed)` : `BREAK MISSED  ${BREAK}: expected a failure at "${EXPECT[BREAK]}"; failed: ${failed.slice(0, 6).join(' | ') || 'none'}`); process.exit(hit ? 0 : 1); }
  console.log(`\nanimals-assessment-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
