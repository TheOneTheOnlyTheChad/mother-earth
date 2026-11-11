/* Fires card copy for the expected daily FIRMS reset (11 Nov 2026, branch fires-wording-rc).
 * When the hub reports the fires run as down with the note "no detections processed yet for today (UTC)…" (header-only file early
 * in the UTC day), the Fires card says "Today’s detections aren’t available yet." — state stays UNKNOWN, the count stays "–",
 * records stay withheld and nothing is drawn. Every other down note keeps "collector reported down: <note>".
 * Scope: the Fires card only. ME.freshness, the summary report and Sources are unchanged.
 * The down notes are taken from phase1/worker.js itself (the template literals in collectFirms), not hand-written, so the page's
 * pattern is tied to what the hub actually publishes.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/fires-wording-ui.test.cjs
 *      (8899 static server on the repo root). BREAK=match-all | never-match | loose-prefix weakens the served page; each must fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 5 min'); process.exit(1); }, 5 * 60e3);
const COPY = 'Today’s detections aren’t available yet.';

// ---- the hub's own notes, read from worker.js
const W = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
const m = W.match(/const why = utcHour < FIRMS_DAY_BOUNDARY_H \? `([^`]+)` : `([^`]+)`;/);
ok('worker.js: the two header-only notes are where this test expects them', !!m);
const fill = t => t.replace('${res.text.length}', '122').replace('${utcHour}', '9');
const NOTE_BOUNDARY = fill(m ? m[1] : ''), NOTE_EMPTY_LATER = fill(m ? m[2] : '');
ok('worker.js boundary note starts "no detections processed yet for today (UTC)"', /^no detections processed yet for today \(UTC\)/.test(NOTE_BOUNDARY), NOTE_BOUNDARY);
ok('worker.js later-in-the-day empty note is a different sentence', /^empty response \(header only, 122 bytes\) at 9:xx UTC: not a validated zero$/.test(NOTE_EMPTY_LATER), NOTE_EMPTY_LATER);
ok('worker.js still throws "truncated or malformed response: line …" on a bad row', W.includes('`truncated or malformed response: line ${lineNo} has ${c.length} fields, header has ${nCols}`'));
const NOTE_MALFORMED = 'Error: truncated or malformed response: line 2 has 3 fields, header has 14';   // String(e) of that throw, as writeDown receives it
const NOTE_GUARD = 'raw archived; processing skipped: resource guard (9000000 bytes > 8388608)';
const NOTE_FETCH = 'TypeError: fetch failed';

// ---- fixtures: what the hub serves. writeDown() rewrites /cells (status down + note) and leaves /snapshot at the last good run.
const iso = ms => new Date(Date.now() - ms).toISOString();
const GOOD = iso(3 * 3600e3), NOW = iso(60e3);
const FIELDS = ['lat', 'lng', 'frp_mw', 'confidence', 'daynight', 'satellite', 'observed_at'];
const RECS = [[-33.80, 18.60, 5.8, 'n', 'D', 'N20', GOOD], [-33.81, 18.61, 2.3, 'n', 'D', 'N20', GOOD]];
const cov = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
const base = { schema_version: 1, layer: 'firms', scheduled_for: NOW, interruptions: [], stale_after_s: 1800, record_format: 'rows' };
const goodSnap = at => ({ ...base, retrieved_at: at, source_status: 'ok', scope: 'world', raw_bytes: 5000, quantity: 'one VIIRS detection per pass', cells: { '14_49': { count: 2, coverage: cov } }, record_fields: FIELDS, records: RECS });
const goodCells = at => ({ ...goodSnap(at), records: undefined });
const DOWN_AT = iso(30e3);   // a down run has its own time, never the last good run's
const downCells = note => ({ ...base, retrieved_at: DOWN_AT, window_start: null, window_end: null, source_status: 'down', cells: {}, record_fields: [], note });   // envelope(layer, …, 'down', {}, [], [], { note }) without records
let cells = downCells(NOTE_BOUNDARY), snap = goodSnap(GOOD);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
  await ctx.route(HUB + '/**', route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (p === '/cells/firms') return j(cells);
    if (p === '/snapshot/firms') return j(snap);
    if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
    j({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }); });
  if (BREAK) await ctx.route(BASE + '/index.html', async route => { let h = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'); const before = h;
    if (BREAK === 'match-all') h = h.replace('FIRMS_NOT_YET.test(s.note || \'\')', 'true');                       // every down run gets the calm sentence
    if (BREAK === 'never-match') h = h.replace('FIRMS_NOT_YET.test(s.note || \'\')', 'false');                    // the change is not there (= main's behaviour)
    if (BREAK === 'loose-prefix') h = h.replace('/^no detections processed yet for today \\(UTC\\)/', '/header only/');   // also swallows the later-in-the-day empty file
    if (h === before) { console.log('FAIL  break did not apply'); process.exit(1); }
    route.fulfill({ status: 200, contentType: 'text/html', body: h }); });
  // the page's own scheduled refresh (tick) — sky.js and skyscene.js also run 5-minute intervals, so filter by name
  await ctx.addInitScript(() => { const si = window.setInterval; window.__refresh = []; window.setInterval = function (fn, ms, ...a) { if (fn && fn.name === 'tick') window.__refresh.push(fn); return si.call(this, fn, ms, ...a); }; });
  const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  const loaded = async () => { await page.waitForFunction(() => window.ME && ME.loadedAt && window.__refresh.length === 1 && / · retrieved /.test(document.getElementById('m-firms').textContent), null, { timeout: 30000 }); await page.waitForTimeout(800); };
  const tick = () => page.evaluate(async () => { await window.__refresh[0](); });   // one real scheduled refresh
  await loaded();
  const read = () => page.evaluate(() => { const t = id => document.getElementById(id); const p = t('p-firms');
    return { state: t('s-firms').textContent, cls: t('s-firms').className, title: t('s-firms').title, value: t('v-firms').textContent, meta: t('m-firms').textContent, bold: (t('m-firms').querySelector('b') || {}).textContent || '',
      withheld: p.hidden ? '' : p.textContent, fresh: ME.freshness('firms'), report: ME.report(ME.readings()).text, pair: ME.pairState('firms').firms,
      drawn: (ME.renderState() || { points: -1 }).points, quakeMeta: t('m-usgs').textContent }; });

  // ---- A. header-only file early in the UTC day
  let r = await read();
  ok('A header-only: the card says "Today’s detections aren’t available yet."', r.bold === COPY && r.meta.includes(' · ' + COPY), r.meta);
  ok('A header-only: no "collector reported down", no FIRMS day_range/NRT detail, no byte count on the card', !/collector reported down|day_range|NRT|header only|122 bytes/.test(r.meta), r.meta);
  ok('A header-only: state word stays UNKNOWN (class bad)', r.state === 'unknown' && /\bbad\b/.test(r.cls), [r.state, r.cls]);
  ok('A header-only: the state tooltip carries the same sentence', r.title === COPY, r.title);
  ok('A header-only: the count stays "–" (never 0)', r.value === '–', r.value);
  ok('A header-only: records still withheld (the pair rule), and said so on the card', r.pair.usable === false && /^Records withheld:/.test(r.withheld), [r.pair, r.withheld]);
  ok('A header-only: no fire record is drawn', r.drawn === 0, r.drawn);
  ok('A header-only: the card still names the source and the retrieval', /^NASA FIRMS · VIIRS NOAA-20 · .* · retrieved /.test(r.meta), r.meta);
  ok('A scope: ME.freshness is unchanged (grade unknown, full hub note kept)', r.fresh.grade === 'unknown' && r.fresh.why === 'collector reported down: ' + NOTE_BOUNDARY, r.fresh);
  ok('A scope: the summary report keeps its existing wording', r.report.includes('collector reported down: no detections processed yet for today (UTC)') && !r.report.includes(COPY), r.report.slice(0, 400));
  ok('A scope: another card is untouched', !r.quakeMeta.includes(COPY), r.quakeMeta);

  // ---- B. genuine failures keep the existing wording
  for (const [name, note] of [['B1 processing error (malformed row)', NOTE_MALFORMED], ['B2 resource guard', NOTE_GUARD], ['B3 fetch failure', NOTE_FETCH], ['B4 empty file later in the day', NOTE_EMPTY_LATER], ['B5 down with no note', undefined]]) {
    cells = downCells(note); await page.reload({ waitUntil: 'domcontentloaded' }); await loaded();
    r = await read();
    ok(`${name}: existing wording "collector reported down: <note>"`, r.bold === 'collector reported down: ' + (note || ''), r.meta);
    ok(`${name}: the new sentence is absent (card and tooltip)`, !r.meta.includes(COPY) && r.title !== COPY, [r.meta, r.title]);
    ok(`${name}: UNKNOWN, "–", records withheld`, r.state === 'unknown' && r.value === '–' && r.pair.usable === false, [r.state, r.value, r.pair]);
  }

  // ---- C. hub unreachable for this layer (no snapshot at all): existing wording
  cells = null; await ctx.route(HUB + '/cells/firms', route => cells ? route.fallback() : route.fulfill({ status: 503, body: 'x' }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await loaded(); r = await read();
  ok('C no snapshot from the hub: existing wording, new sentence absent', r.bold === 'no snapshot from the hub' && !r.meta.includes(COPY) && r.title !== COPY, [r.meta, r.title]);

  // ---- D. the day's first rows arrive: the sentence goes, the card is current again
  cells = goodCells(NOW); snap = goodSnap(NOW); await page.reload({ waitUntil: 'domcontentloaded' });
  await loaded(); r = await read();
  ok('D rows arrived: card current, count 2, no sentence, tooltip is the ordinary reason', r.state === 'current' && r.value === '2' && !r.meta.includes(COPY) && r.title !== COPY && r.withheld === '', r);

  // ---- E. inside one open page: ok → header-only → ok (the tooltip must not stick)
  cells = downCells(NOTE_BOUNDARY); snap = goodSnap(NOW);
  await tick(); r = await read();
  ok('E same page, ok → header-only on a scheduled refresh: sentence shown, UNKNOWN, records withheld, nothing drawn', r.bold === COPY && r.state === 'unknown' && r.title === COPY && r.value === '–' && r.pair.usable === false && r.drawn === 0, r);
  cells = goodCells(NOW); await tick(); r = await read();
  ok('E same page, header-only → ok: sentence and tooltip gone, records back', !r.meta.includes(COPY) && r.title !== COPY && r.state === 'current' && r.value === '2' && r.pair.usable === true, r);

  ok('no page errors', perr.length === 0, perr);
  await browser.close(); clearTimeout(wd); console.log(`\nfires-wording-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
