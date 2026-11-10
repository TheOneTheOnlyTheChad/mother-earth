/* Mother Earth — "The Sky on Two Clocks" card, page side (SKY-TWO-CLOCKS-PROPOSAL rev 3 §7, §8 checks 1–5).
 * Real index.html + app.js + sky.js served locally (8899); hub routed to the generated catalogue
 * phase1/sky/catalogue/sky-2026-11-R1.json and to fault fixtures; real globe.gl 2.45.0 (SwiftShader); Playwright's clock
 * fixes the time; browser timezones vary. Accessibility checks use the accessibility tree (roles, names, states) — NOT
 * what a screen reader announces.
 * Run:   node phase1/sky-ui.test.cjs        (needs `python3 -m http.server 8899 --bind 127.0.0.1` in the repo and /home/claude/spike)
 * Break: BREAK=local-date | extrema-full-bundle | no-recompute | diff-in-rr-mode | rr-fallback | nearest-sample | skip-schema |
 *              merge-gap-states | no-key-activation | hide-text-equivalent | label-swap | eager | no-time-check |
 *              tilde-required | flag-sentence-always | caveat-always | no-flag-agreement      → each must FAIL
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const FILE = fs.readFileSync(path.join(__dirname, 'sky/catalogue/sky-2026-11-R1.json'), 'utf8');
const J = JSON.parse(FILE);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
let SKY_JS = fs.readFileSync(path.join(__dirname, '..', 'sky.js'), 'utf8');
let INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const BREAKS = {
  'local-date': ["const utcToday = () => new Date(Date.now()).toISOString().slice(0, 10);", "const utcToday = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };"],
  'extrema-full-bundle': ["    const pts = s.days.filter(p => p.v != null);\n    if (!pts.length) return null;", "    const all = st.cat.bodies[s.body].rows.map(r => ({ d: r[0], v: r[1] })); const pts = all;\n    if (!pts.length) return null;"],
  'no-recompute': ["  setInterval(() => { if (st.on && st.status === 'ok') render(); }, ME.REFRESH_MS);\n  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.on && st.status === 'ok') render(); });", "  // (break) no recompute"],
  'diff-in-rr-mode': ["      const dir = direction(s.row[2]);", "      const prev = st.index[s.body].get(addDays(s.today, -1)); const dir = prev ? (s.row[1] < prev[1] ? 'Getting closer at sample time' : 'Getting farther at sample time') : null;"],
  'rr-fallback': ["      const dir = direction(s.row[2]);", "      const prev = st.index[s.body].get(addDays(s.today, -1)); const dir = direction(s.row[2]) || (prev ? (s.row[1] < prev[1] ? 'Closer than yesterday' : 'Farther than yesterday') : null);"],
  'nearest-sample': ["    const r = idx.get(today) || null;", "    let r = idx.get(today) || null; for (let k = 1; !r && k < 3; k++) r = idx.get(addDays(today, k)) || idx.get(addDays(today, -k)) || null;"],
  'skip-schema': ["    if (!reason && !schema(j)) reason = 'invalid';", "    // (break) schema check removed"],
  'merge-gap-states': ["    const outside = today < cov.start || today > cov.end;", "    const outside = false;"],
  'no-key-activation': ["  $('tgl-sky').addEventListener('click', () => setOn(!st.on));", "  $('tgl-sky').addEventListener('click', e => { if (e.detail === 0) return; setOn(!st.on); }); $('sky-tabs').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) e.stopImmediatePropagation(); }, true); $('sky-tabs').addEventListener('click', e => { if (e.detail === 0) e.stopImmediatePropagation(); }, true);"],
  'hide-text-equivalent': ["<div class=\"sky-te\">${esc(textEq(s))}</div>", "<div class=\"sky-te\" aria-hidden=\"true\">${esc(textEq(s))}</div>"],
  'no-time-check': ["    if (!t || !(t.horizons_ut_tilde_from === null || iso(t.horizons_ut_tilde_from)) || !iso(t.first_date_affected_by_unresolved_leap_second)) return false;", "    // (break) time fields not validated"],
  'tilde-required': ["!(t.horizons_ut_tilde_from === null || iso(t.horizons_ut_tilde_from))", "!iso(t.horizons_ut_tilde_from)"],
  'flag-sentence-always': ["    if (t.horizons_ut_tilde_from) out.push(", "    out.push("],
  'caveat-always': ["    if (f <= st.cat.coverage.end) out.push(", "    out.push("],
  'no-flag-agreement': ["    for (const b of ['moon', 'sun']) { const f = j.bodies[b].rows.find(r => r[3] === 'UT~'); if ((f ? f[0] : null) !== t.horizons_ut_tilde_from) return false; }", "    // (break) flag start not compared with the rows"],
  'eager': ["  $('tgl-sky').addEventListener('click', () => setOn(!st.on));", "  $('tgl-sky').addEventListener('click', () => setOn(!st.on)); setOn(true);"],
};
const B = process.env.BREAK;
if (B === 'label-swap') { const a = '<span class="ev obs">Measured</span> Lunar recession'; if (!INDEX.includes(a)) throw new Error('anchor'); INDEX = INDEX.replace(a, '<span class="ev comp">Estimated</span> Lunar recession'); }
else if (B) { const [a, b] = BREAKS[B]; if (!SKY_JS.includes(a)) throw new Error('break anchor missing: ' + B); SKY_JS = SKY_JS.replace(a, b); }

let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 400)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 9 min — failure, not a hang'); process.exit(1); }, 9 * 60e3);

const mutate = f => { const j = JSON.parse(FILE); f(j); return JSON.stringify(j); };
const dropRow = (body, date) => mutate(j => { j.bodies[body].rows = j.bodies[body].rows.filter(r => r[0] !== date); });
const setRR = (body, date, v) => mutate(j => { j.bodies[body].rows.find(r => r[0] === date)[2] = v; });
const row = (body, date) => J.bodies[body].rows.find(r => r[0] === date);
const RUN = '2026-11-10T08:00:00Z';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  // body: catalogue text the hub returns; status: hub status; pinOverride: page pin (for "malformed with a matching hash")
  const run = async ({ time, tz = 'Africa/Johannesburg', viewport = { width: 1280, height: 900 }, body = FILE, status = 200, pinOverride = null, abort = false }) => {
    const ctx = await browser.newContext({ viewport, timezoneId: tz, reducedMotion: 'reduce' });
    const hits = [];
    let js = SKY_JS; if (pinOverride) js = js.replace(`const SHA = '${sha(FILE)}';`, `const SHA = '${pinOverride}';`);
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(/ssd\.jpl\.nasa\.gov|ssd-api\.jpl/, r => { hits.push('JPL:' + r.request().url()); r.abort(); });
    await ctx.route(BASE + '/sky.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: js }));
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: INDEX }));
    await ctx.route(HUB + '/**', async route => {
      const p = new URL(route.request().url()).pathname; hits.push(p);
      if (p.startsWith('/catalogue/sky')) {
        if (abort) return route.abort();
        return route.fulfill({ status, contentType: 'application/json', body: status === 200 ? body : JSON.stringify({ kind: 'catalogue', catalogue: 'sky', status: 'unavailable', reason: 'missing' }) });
      }
      const b = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['x', 10, 10, 10, 5, 'mb', RUN, 't', '']] }
        : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '25_47': { count: 1, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
        : p.startsWith('/snapshot/orbital') || p.startsWith('/elements') ? null
        : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
      if (!b) return route.fulfill({ status: 404, body: '{}' });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.clock.install({ time: new Date(time) });
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.skyState, null, { timeout: 30000 });
    return { ctx, page, perr, hits };
  };
  const on = async page => { await page.click('#tgl-sky'); await page.waitForFunction(() => ['ok', 'unavailable'].includes(ME.skyState().status), null, { timeout: 20000 }); };
  const R = page => page.evaluate(() => {
    const rd = b => { const el = document.getElementById('sky-' + b); const q = s => el.querySelector(s);
      return { hidden: el.hidden, today: q('.sky-val') && q('.sky-val').dataset.today, val: q('.sky-val') && q('.sky-val').textContent, ts: q('.sky-ts') && q('.sky-ts').textContent,
        dir: q('.sky-dir') ? q('.sky-dir').textContent : null, last: q('.sky-last') ? q('.sky-last').textContent : null, te: q('.sky-te') && q('.sky-te').textContent,
        marker: !!q('.sky-tdot'), ex: el.querySelectorAll('.sky-ex').length, lo: q('svg') && +q('svg').dataset.lo, hi: q('svg') && +q('svg').dataset.hi, na: !!q('.sky-na') }; };
    return { s: ME.skyState(), o: document.getElementById('o-sky').textContent, moon: rd('moon'), sun: rd('sun'), time: document.getElementById('sky-time').textContent };
  });
  const fmtKm = v => Math.round(v).toLocaleString('en-GB') + ' km', fmtM = v => (v / 1e6).toFixed(1) + ' million km';

  // ---------- off on load: nothing fetched; never Horizons
  {
    const { ctx, page, hits, perr } = await run({ time: '2026-11-10T10:00:00Z' });
    await page.waitForTimeout(800);
    ok('off on load: no catalogue request, body hidden, switch off', !hits.some(h => h.startsWith('/catalogue/sky')) && await page.evaluate(() => document.getElementById('sky-body').hidden && document.getElementById('tgl-sky').getAttribute('aria-checked') === 'false'), hits);
    await on(page);
    ok('switch on → exactly one request, to this page\'s own revision', hits.filter(h => h.startsWith('/catalogue/sky')).join() === '/catalogue/sky/sky-2026-11-R1', hits);
    ok('the page never calls Horizons', !hits.some(h => h.startsWith('JPL:')));
    ok('Sky group: heading "Sky" covers Orbital objects and this card, in that order, Met card outside it', await page.evaluate(() => { const g = document.getElementById('sky-group'); const kids = [...g.children].map(c => c.id); return g.getAttribute('role') === 'group' && g.getAttribute('aria-labelledby') === 'sky-h' && document.getElementById('sky-h').textContent === 'Sky' && kids.join() === 'sky-h,card-orb,card-sky' && g.nextElementSibling.id === 'card-arts'; }));
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- check 1: UTC date, rollover, charts
  for (const tz of ['Pacific/Kiritimati', 'Africa/Johannesburg', 'America/Los_Angeles']) {
    const { ctx, page, perr } = await run({ time: '2027-01-03T23:59:30Z', tz });
    await on(page);
    let r = await R(page);
    const m3 = row('moon', '2027-01-03'), s3 = row('sun', '2027-01-03');
    ok(`${tz}: before 00:00Z both rows show 3 Jan (UTC), values = the export`, r.moon.today === '2027-01-03' && r.sun.today === '2027-01-03' && r.moon.val.includes(fmtKm(m3[1])) && r.sun.val.includes(fmtM(s3[1])) && /00:00 UTC, 3 Jan 2027/.test(r.moon.ts) && /00:00 UTC, 3 Jan 2027/.test(r.sun.ts), [r.moon, r.sun]);
    ok(`${tz}: markers present on both charts; independent scales (Moon ~10^5 km, Sun ~10^8 km)`, r.moon.marker && r.sun.marker && r.moon.hi < 5e5 && r.sun.lo > 1e8, [r.moon.lo, r.moon.hi, r.sun.lo, r.sun.hi]);
    await page.clock.fastForward(60e3);   // past midnight, before the 5-minute tick
    r = await R(page);
    const stillOld = r.moon.today === '2027-01-03';
    await page.clock.fastForward(5 * 60e3);   // the refresh tick
    r = await R(page);
    const m4 = row('moon', '2027-01-04');
    ok(`${tz}: just after 00:00Z still 3 Jan (no tick yet); after the tick both rows show 4 Jan`, stillOld && r.moon.today === '2027-01-04' && r.sun.today === '2027-01-04' && r.moon.val.includes(fmtKm(m4[1])), [r.moon.today, r.sun.today]);
    ok(`${tz}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }
  { // recompute on card open and on visibility return (no tick needed)
    const { ctx, page } = await run({ time: '2027-01-03T23:59:50Z' });
    await on(page);
    await page.clock.setSystemTime(new Date('2027-01-04T00:00:20Z'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    let r = await R(page);
    ok('visibility return after 00:00Z → 4 Jan immediately', r.moon.today === '2027-01-04', r.moon.today);
    await page.clock.setSystemTime(new Date('2027-01-05T00:00:20Z'));
    await page.click('#tgl-sky'); await page.click('#tgl-sky'); await page.waitForFunction(() => ME.skyState().status === 'ok');
    r = await R(page);
    ok('switch off/on after 00:00Z → recomputed (5 Jan)', r.moon.today === '2027-01-05', r.moon.today);
    await ctx.close();
  }
  { // solar extrema = min/max of the DISPLAYED samples (bundle-wide extremes lie outside this window)
    const { ctx, page } = await run({ time: '2026-07-01T12:00:00Z' });
    await on(page);
    const r = await R(page);
    const win = []; for (let i = -182; i <= 182; i++) { const d = new Date(Date.UTC(2026, 6, 1 + i)).toISOString().slice(0, 10); const x = row('sun', d); if (x) win.push(x); }
    const mn = win.reduce((a, b) => b[1] < a[1] ? b : a), mx = win.reduce((a, b) => b[1] > a[1] ? b : a);
    const nice = d => `${+d.slice(8, 10)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
    ok('Sun: closest/farthest = extremes of the displayed window, labelled as samples', r.sun.ex === 2 && r.sun.te.includes(`closest sample ${fmtM(mn[1])} on ${nice(mn[0])}`) && r.sun.te.includes(`farthest sample ${fmtM(mx[1])} on ${nice(mx[0])}`), [r.sun.te, mn, mx]);
    ok('window before coverage start is named as outside the calculated range (not as gaps)', /outside the calculated range/.test(r.sun.te) && !/gaps/.test(r.sun.te), r.sun.te);
    await ctx.close();
  }

  // ---------- check 2: direction (range-rate mode)
  {
    const { ctx, page } = await run({ time: '2026-11-14T06:00:00Z' });   // real after-apogee day: RR < 0, today > yesterday
    await on(page);
    const r = await R(page), t = row('moon', '2026-11-14'), y = row('moon', '2026-11-13');
    ok('fixture is a real after-apogee day (RR < 0, farther than yesterday)', t[2] < 0 && t[1] > y[1], [t, y]);
    ok('RR mode → "Getting closer at sample time"', r.moon.dir === 'Getting closer at sample time', r.moon.dir);
    ok('Details says the direction comes from the range rate', await page.evaluate(() => /range rate at 00:00 UTC/.test(document.getElementById('sky-scope').textContent)));
    await ctx.close();
  }
  for (const [label, body, want] of [['RR = 0 → neutral wording', setRR('moon', '2026-11-14', 0), 'Neither closer nor farther at sample time'], ['RR missing → no label (no fallback)', setRR('moon', '2026-11-14', null), null]]) {
    const { ctx, page } = await run({ time: '2026-11-14T06:00:00Z', body, pinOverride: sha(body) });
    await on(page);
    const r = await R(page);
    ok(label, r.s.status === 'ok' && r.moon.dir === want, [r.s, r.moon.dir]);
    await ctx.close();
  }

  // ---------- check 3: missing day, coverage, load failures
  {
    const body = dropRow('moon', '2026-11-10');
    const { ctx, page } = await run({ time: '2026-11-10T12:00:00Z', body, pinOverride: sha(body) });
    await on(page);
    const r = await R(page), y = row('moon', '2026-11-09'), s = row('sun', '2026-11-10');
    ok('Moon missing today → only the Moon row unavailable ("no sample for this date"), last available shown separately', r.moon.na && /no sample for this date/.test(r.moon.val) && r.moon.last && r.moon.last.includes(fmtKm(y[1])) && /9 Nov 2026/.test(r.moon.last), r.moon);
    ok('no Moon marker, no Moon direction, gap named; Sun row normal', !r.moon.marker && r.moon.dir === null && /gaps/.test(r.moon.te) && !r.sun.na && r.sun.val.includes(fmtM(s[1])) && r.sun.marker, [r.moon, r.sun.val]);
    ok('the neighbouring day is never shown as today (rendered value is not 9 or 11 Nov)', !r.moon.val.includes(fmtKm(y[1])) && !r.moon.val.includes(fmtKm(row('moon', '2026-11-11')[1])), r.moon.val);
    await ctx.close();
  }
  for (const [time, label] of [['2026-05-20T12:00:00Z', 'before coverage'], ['2028-01-05T12:00:00Z', 'after coverage (expired)']]) {
    const { ctx, page } = await run({ time });
    await on(page);
    const r = await R(page);
    ok(`${label}: both rows "outside the calculated range", distinct from a missing day; no markers`, r.moon.na && r.sun.na && /outside the calculated range/.test(r.moon.val) && !/no sample for this date/.test(r.moon.val) && !r.moon.marker && !r.sun.marker, [r.moon.val, r.sun.val]);
    ok(`${label}: last available shown only when one exists`, label.startsWith('before') ? r.moon.last === null : /31 Dec 2027/.test(r.moon.last), r.moon.last);
    await ctx.close();
  }
  const deepReadable = async page => { await page.click('#sky-tab-deep'); return page.evaluate(() => !document.getElementById('sky-deep').hidden && /3\.8 cm a year/.test(document.getElementById('sky-deep').textContent) && /roughly a centimetre a year/.test(document.getElementById('sky-deep').textContent)); };
  for (const [label, opts] of [['hub 503 missing', { status: 503 }], ['network failure', { abort: true }], ['one changed byte (page hash check)', { body: FILE.replace('"sky-2026-11-R1"', '"sky-2026-11-R2"') }],
    ['catalogue without its time block (matching hash) is rejected before rendering', (() => { const b = mutate(j => { delete j.time; }); return { body: b, pinOverride: sha(b) }; })()],
    ['time field not a date (matching hash) is rejected before rendering', (() => { const b = mutate(j => { j.time.first_date_affected_by_unresolved_leap_second = 'July'; }); return { body: b, pinOverride: sha(b) }; })()],
    ['flag start null while rows carry UT~ (matching hash) is rejected', (() => { const b = mutate(j => { j.time.horizons_ut_tilde_from = null; }); return { body: b, pinOverride: sha(b) }; })()],
    ['flag start disagrees with the rows (matching hash) is rejected', (() => { const b = mutate(j => { j.time.horizons_ut_tilde_from = '2027-02-05'; }); return { body: b, pinOverride: sha(b) }; })()],
    ['malformed data with a matching hash reaches the schema check', (() => { const b = mutate(j => { j.bodies.moon.rows[3][1] = 'oops'; }); return { body: b, pinOverride: sha(b) }; })()]]) {
    const { ctx, page, perr } = await run({ time: '2026-11-10T12:00:00Z', ...opts });
    await on(page);
    const r = await R(page);
    ok(`${label} → Now unavailable, no rows drawn`, r.s.status === 'unavailable' && /Distances unavailable/.test(r.o) && r.moon.hidden && r.sun.hidden, [r.s, r.o]);
    ok(`${label} → Deep Time fully readable`, await deepReadable(page));
    ok(`${label} → no page errors`, perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- time-scale note (Horizons flag vs July uncertainty)
  {
    const { ctx, page } = await run({ time: '2027-03-01T12:00:00Z' });
    await on(page);
    const r = await R(page);
    ok('Details separates the Horizons flag (4 Feb 2027) from the July leap-second uncertainty (1 Jul 2027)', /From 4 Feb 2027, Horizons marks the times as estimates/.test(r.time) && /samples from 1 Jul 2027 would be off by one second/.test(r.time), r.time);
    ok('a UT~ day is flagged next to its timestamp', /time estimated/.test(r.moon.ts), r.moon.ts);
    ok('R1 note text unchanged by the all-UTC rule', r.time === 'Samples are at 00:00 UTC. From 4 Feb 2027, Horizons marks the times as estimates because future leap seconds are not yet known. A leap second at the end of June 2027 has not been decided; if one is added, samples from 1 Jul 2027 would be off by one second until the next refresh.', r.time);
    await ctx.close();
  }
  // all-UTC catalogues (GPT, 10 Nov, rehearsal T1): no UT~ rows, horizons_ut_tilde_from null → valid; the Horizons flag sentence is omitted;
  // the leap-second caveat stays only while the coverage reaches the first affected date
  const allUtc = (lo, hi) => mutate(j => { for (const b of ['moon', 'sun']) j.bodies[b].rows = j.bodies[b].rows.filter(r => r[0] >= lo && r[0] <= hi).map(r => [r[0], r[1], r[2], 'UTC']);
    j.coverage.start = lo; j.coverage.end = hi; j.coverage.samples_per_body = j.bodies.moon.rows.length; j.time.horizons_ut_tilde_from = null; });
  for (const [label, lo, hi, when, want] of [
    ['T1-shaped window (10–24 Nov 2026): note is the sample time only', '2026-11-10', '2026-11-24', '2026-11-12T06:00:00Z', 'Samples are at 00:00 UTC.'],
    ['all-UTC flags over the full R1 coverage: no Horizons sentence, July caveat kept', '2026-06-01', '2027-12-31', '2027-03-01T06:00:00Z', 'Samples are at 00:00 UTC. A leap second at the end of June 2027 has not been decided; if one is added, samples from 1 Jul 2027 would be off by one second until the next refresh.']]) {
    const body = allUtc(lo, hi);
    const { ctx, page, perr } = await run({ time: when, body, pinOverride: sha(body) });
    await on(page);
    const r = await R(page), d = when.slice(0, 10), m = row('moon', d);
    ok(`${label} → card renders (status ok, today's real value)`, r.s.status === 'ok' && r.moon.today === d && r.moon.val.includes(fmtKm(m[1])), [r.s, r.moon.val]);
    ok(`${label} → note`, r.time === want, r.time);
    ok(`${label} → no "time estimated" flag next to the timestamp; no page errors`, !/time estimated/.test(r.moon.ts) && !/time estimated/.test(r.sun.ts) && perr.length === 0, [r.moon.ts, perr]);
    await ctx.close();
  }

  // ---------- check 4: phone and keyboard
  {
    const { ctx, page, perr } = await run({ time: '2026-11-10T12:00:00Z', viewport: { width: 390, height: 844 } });
    await page.waitForTimeout(500);
    const base = await page.evaluate(() => ({ g: document.getElementById('globe').getBoundingClientRect().height }));
    await page.focus('#tgl-sky'); await page.keyboard.press('Space');
    await page.waitForFunction(() => ME.skyState().status === 'ok', null, { timeout: 20000 }).catch(() => { });
    ok('Space on the switch turns it on', await page.evaluate(() => document.getElementById('tgl-sky').getAttribute('aria-checked') === 'true' && ME.skyState().status === 'ok'));
    const lay = async () => page.evaluate(() => { const g = document.getElementById('globe').getBoundingClientRect(), sh = document.getElementById('sheet').getBoundingClientRect();
      return { hscroll: document.documentElement.scrollWidth > innerWidth, globeH: g.height, globeVisible: Math.max(0, Math.min(g.bottom, sh.top) - Math.max(g.top, 0)) };
    });
    let l = await lay();
    ok('390×844, Now open: no horizontal overflow; globe still visible above the Readings sheet', !l.hscroll && l.globeVisible > 150, l);
    await page.focus('#sky-tab-now'); await page.keyboard.press('ArrowRight');
    ok('ArrowRight moves to Deep Time (selected, focused, panel shown)', await page.evaluate(() => document.getElementById('sky-tab-deep').getAttribute('aria-selected') === 'true' && document.activeElement.id === 'sky-tab-deep' && !document.getElementById('sky-deep').hidden && document.getElementById('sky-now').hidden));
    l = await lay();
    ok('390×844, Deep Time open: no horizontal overflow; globe still visible', !l.hscroll && l.globeVisible > 150, l);
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
    ok('ArrowLeft + Enter → back to Now', await page.evaluate(() => document.getElementById('sky-tab-now').getAttribute('aria-selected') === 'true' && !document.getElementById('sky-now').hidden));
    await page.focus('#sky-tab-deep'); await page.keyboard.press('Enter');
    ok('Enter on a focused tab activates it', await page.evaluate(() => document.getElementById('sky-tab-deep').getAttribute('aria-selected') === 'true'));
    await page.click('#sky-tab-now');
    const a11y = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('#sky-tabs [role=tab]')].map(t => [t.textContent, t.getAttribute('aria-selected'), t.getAttribute('aria-controls')]);
      const te = [...document.querySelectorAll('.sky-te')].map(e => ({ text: e.textContent, hidden: !!e.closest('[aria-hidden=true]'), vis: e.getBoundingClientRect().height > 0 }));
      return { tabs, te, list: document.getElementById('sky-tabs').getAttribute('role'), panels: ['sky-now', 'sky-deep'].map(id => document.getElementById(id).getAttribute('role')) };
    });
    ok('tablist/tab/tabpanel roles, aria-selected and aria-controls correct', a11y.list === 'tablist' && a11y.panels.join() === 'tabpanel,tabpanel' && a11y.tabs.map(t => t.join('|')).join() === 'Now|true|sky-now,Deep Time|false|sky-deep', a11y);
    ok('text equivalents visible and in the accessibility tree (not aria-hidden), values in words', a11y.te.length === 2 && a11y.te.every(t => !t.hidden && t.vis && /Shown:/.test(t.text) && /km/.test(t.text)), a11y.te);
    const snap = await page.locator('#card-sky').ariaSnapshot();
    ok('accessibility tree: switch, tabs and the Moon text equivalent are exposed', /switch "Show the two clocks"/.test(snap) && /tab "Now"/.test(snap) && /tab "Deep Time"/.test(snap) && /Shown:/.test(snap), snap.slice(0, 600));
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- check 5: public labels distinct
  {
    const { ctx, page } = await run({ time: '2026-11-10T12:00:00Z' });
    await on(page);
    const lab = await page.evaluate(() => ({ head: document.querySelector('#card-sky .ovl-h .ev').textContent, deep: [...document.querySelectorAll('.sky-deep-h')].map(h => h.textContent.trim()), attr: document.querySelector('#sky-now .src').textContent }));
    ok('labels: card Computed; Deep Time "Measured Lunar recession" and "Estimated Widening from solar mass loss"', lab.head === 'Computed' && lab.deep[0] === 'Measured Lunar recession' && lab.deep[1] === 'Estimated Widening from solar mass loss', lab);
    ok('attribution "Calculated orbital distances · NASA/JPL Horizons"', lab.attr === 'Calculated orbital distances · NASA/JPL Horizons', lab.attr);
    ok('Deep Time wording: estimated widening attributed to Mercury\'s orbit; no "angular momentum"; no precise eclipse date on the card', await page.evaluate(() => { const t = document.getElementById('card-sky').textContent; return /estimated from changes in Mercury's orbit consistent with solar mass loss/.test(t) && !/angular momentum/i.test(t) && !/650/.test(t) && /hundreds of millions of years/.test(t); }));
    await ctx.close();
  }

  clearTimeout(wd); await browser.close();
  console.log(`sky-ui: ${pass} passed, ${fail} failed${B ? ` (BREAK=${B})` : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness error', e); process.exit(1); });
