/* Mother Earth — Nature context Stage 1 (nature-context-rc, 24 Nov 2026): the forest wording on every page surface, from saved data only.
 * Proposal: docs/concepts/NATURE-CONTEXT-PROPOSAL.md rev 2 (§3), with GPT's rev 2 review requirements
 * (reviews/2026-11-24-nature-context-proposal-rev2-gpt-review.md §1–§4).
 *
 * Part A (no browser): ME.placeRows / ME.forest* from the served app.js, fixtures F1–F17 plus GPT's additions (A1–A5), a fixed clock.
 * Part B (Chromium + SwiftShader, served by this suite; no server needed): World View and Sources with EVERY non-local request
 *   intercepted. Hub paths are answered from fixtures; anything else is aborted and listed. The place panel, the cell inspector,
 *   the card, the report, the rules list and the Sources Measures table; layers are not switched on by opening the panel;
 *   keyboard; no horizontal overflow at 360 px.
 * Controls: OLD=1 serves main's page files (git show origin/main:<file>) — the new checks must fail there.
 *   BREAK=published | queries | never-old | ge-limit | hub-quantity | stale-is-failure | unknown-in-total | skew-fresh | no-escape |
 *         card-old | common-interval | since-from-envelope   each must fail.
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/nature-context-ui.test.cjs
 * Needs /home/claude/spike/node_modules with globe.gl@2.45.0 and @fontsource/{ibm-plex-mono,barlow-condensed} (as the other page suites).
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const http = require('http'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const PORT = 8898, BASE = `http://127.0.0.1:${PORT}`, HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const SPIKE = '/home/claude/spike/node_modules/';
const GLOBE_JS = fs.readFileSync(SPIKE + 'globe.gl/dist/globe.gl.min.js', 'utf8');
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${SPIKE}@fontsource/${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const FONTS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('\n');
const BREAK = process.env.BREAK || '', OLD = process.env.OLD === '1';
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n.split(' ')[0]); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 8 min — failure, not a hang'); process.exit(1); }, 8 * 60e3);

// ---- the files served: this tree, or main's (OLD=1), with one break applied
const coreOn = h => h.replace("const START_ON = [];", "const START_ON = ['usgs', 'firms', 'ships', 'forest'];");   // forest drawn at load, as the older page suites
const read = f => OLD ? cp.execFileSync('git', ['show', 'origin/main:' + f], { cwd: ROOT, maxBuffer: 64e6 }).toString() : fs.readFileSync(path.join(ROOT, f), 'utf8');
const served = { 'index.html': coreOn(read('index.html')), 'app.js': read('app.js'), 'sources.html': read('sources.html') };
{ const rep = (f, a, b) => { const was = served[f]; served[f] = served[f].replace(a, b); if (served[f] === was) { console.log(`FAIL  break ${BREAK} did not apply`); process.exit(1); } };
  if (BREAK === 'published') rep('app.js', "text: `first detected on or after ${d}`", "text: `published in the 7 days from ${d}`");
  if (BREAK === 'queries') rep('app.js', "daily snapshot${+C.forest.queries_retained === 1 ? '' : 's'} of this cell retained", "queries of this cell retained");
  if (BREAK === 'never-old') rep('app.js', 'const old = s > ME.FOREST_AGE_LIMIT_S;', 'const old = false;');
  if (BREAK === 'ge-limit') rep('app.js', 'const old = s > ME.FOREST_AGE_LIMIT_S;', 'const old = s >= ME.FOREST_AGE_LIMIT_S;');
  if (BREAK === 'hub-quantity') rep('app.js', 'quantity: fo ? ME.FOREST_QUANTITY : null,', 'quantity: fo && fo.quantity,');
  if (BREAK === 'stale-is-failure') rep('app.js', "const run = st.source_status === 'down' ?", "const run = (st.source_status === 'down' || stale) ?");
  if (BREAK === 'unknown-in-total') rep('app.js', 'const total = missing.length ? null : ME.FOREST_KNOWN.reduce((a, k) => a + known[k], 0);', 'const total = missing.length ? null : ME.FOREST_KNOWN.reduce((a, k) => a + known[k], 0) + unknown.reduce((a, [, v]) => a + (v || 0), 0);');
  if (BREAK === 'skew-fresh') rep('app.js', 'if (s < -ME.FOREST_SKEW_S) return', 'if (false) return');
  if (BREAK === 'no-escape') rep('app.js', "`unrecognised category '${esc(k)}'", "`unrecognised category '${k}'");
  if (BREAK === 'card-old') rep('index.html', "<small>alert pixels (10 m) · first detected in each cell's own window</small>", '<small>alert pixels (10 m) · published in the last 7 days</small>');
  if (BREAK === 'common-interval') rep('app.js', 'not one common period and not a trend', 'in the last 7 days');
  if (BREAK === 'since-from-envelope') rep('app.js', 'ME.forestSince = c => { const v = c && c.since;', 'ME.forestSince = c => { const v = (c && c.since) || "2026-11-17";');
}

// ---- fixed clock and fixtures in the live hub's shapes (live values from the 24 Nov 2026 reads, research notes §2–§3)
const T = Date.parse('2026-11-24T07:10:00Z'), at = ms => new Date(T - ms).toISOString(), D = 86400e3;
const cov = { grade: 'partial', evidence: 'no_per_cell_observation_opportunity;cloud_and_system_coverage_vary', observed_fraction: null };
const cell = (count, conf, since, queried, version, extra = {}) => ({ count, confidence: conf, since, queried_at: queried, version, coverage: cov, ...extra });
const C = {
  F1: cell(199592, { nominal: 198963, high: 95, highest: 534 }, '2026-11-16', '2026-11-23T09:42:21.677Z', 'v20261123'),
  F2: cell(0, { nominal: 0, high: 0, highest: 0 }, '2026-11-15', '2026-11-22T17:42:05.563Z', 'v20261122'),
  F4: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-13', at(4 * D - 1e3), 'v20261120'),
  F5: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-13', at(4 * D), 'v20261120'),
  F6: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-13', at(4 * D + 1e3), 'v20261120'),
  F7m: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-16', undefined, 'v20261123'),
  F7b: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-16', 'yesterday', 'v20261123'),
  F7c: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-16', '2026-02-31T09:00:00Z', 'v20261123'),
  F8a: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-17', at(-299e3), 'v20261123'),
  F8b: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-17', at(-300e3), 'v20261123'),
  F8c: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-17', at(-301e3), 'v20261123'),
  F9m: cell(10, { nominal: 10, high: 0, highest: 0 }, undefined, at(3600e3), 'v20261123'),
  F9b: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-31', at(3600e3), 'v20261123'),
  F10: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-16', at(3600e3), 'latest'),
  F11: cell(10, { nominal: 7, high: 2, highest: 1, '<b>low</b>': 4, spare: 0 }, '2026-11-16', at(3600e3), 'v20261123'),
  F11z: cell(0, { nominal: 0, high: 0, highest: 0, low: 6 }, '2026-11-16', at(3600e3), 'v20261123'),
  F11m: cell(5, { nominal: 5, high: 0 }, '2026-11-16', at(3600e3), 'v20261123'),
  F14: cell(42, { nominal: 40, high: 2, highest: 0 }, '2026-11-01', '2026-11-21T09:00:00Z', 'v20261121'),
  F15: cell(10, { nominal: 10, high: 0, highest: 0 }, '2026-11-14', at(5 * D), 'v20261119'),
};
const ENV = (extra = {}) => ({ layer: 'forest', retrieved_at: at(25 * 60e3), run_ref: 'forest@x', collector_version: '0.6.24', source_status: 'ok', stale_after_s: 14400,
  window_start: '2026-11-17', window_end: '2026-11-24', quantity: '10 m alert pixels published in the last 7 days per 4° cell, by GFW confidence (nominal | high | highest) — counts of pixels, never hectares or trends; detection date ≠ clearing date',
  coverage_default: null, coverage_note: 'alert systems operate between 30°N and 30°S only', note: null, ...extra });
const placeOf = (id, forest, extra = {}) => ({ schema: 'place/1', grid: 'g4', cell: { id, ref: 'g4:' + id, west: -64, south: -6, east: -60, north: -2, area_km2: 197000 },
  statement: 'Listed together because they share this 4° cell. Nothing here states a connection between them.', generated_at: at(5e3), collector_version: '0.6.24',
  layers: { usgs: { layer: 'usgs', state: 'no_records', count: 0, retrieved_at: at(60e3), stale_after_s: 900 }, firms: { layer: 'firms', state: 'no_records', count: 0, retrieved_at: at(60e3), stale_after_s: 2400, source_status: 'ok' },
    ships: { layer: 'ships', state: 'no_records', count: 0, retrieved_at: at(60e3), stale_after_s: 10800 }, forest, drifters: { layer: 'drifters', state: 'off_not_requested' }, plastic: { layer: 'plastic', state: 'off_not_requested' }, ...(extra.layers || {}) },
  collection: { forest: { queries_retained: 12, first_query: '2026-11-02', last_query: '2026-11-23' }, ...(extra.collection || {}) }, not_place_based: { swpc: 'one planetary index for the whole Earth' } });
const fs1 = (c, extra = {}) => ({ ...ENV(extra), state: 'ok', cell: c });

// ---- Part A: pure rows
const A = () => {
  const ctx = { ME: null }; global.window = global; global.document = {}; delete global.ME;
  try { new Function(served['app.js'])(); } catch (e) { ok('A0 app.js loads', false, String(e)); return; }
  const dec = h => String(h).replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const rowsOf = (P, now = T) => { try { return ME.placeRows(P, now); } catch (e) { return [['ERROR', String(e)]]; } };
  const fr = (P, now) => { const r = rowsOf(P, now).find(x => /^Forest disturbance/.test(x[0])); return r ? { label: r[0], html: r[1], text: dec(r[1]) } : { label: null, html: '', text: '' }; };
  const coll = P => { const r = rowsOf(P).find(x => x[0] === 'Collection · Forest disturbance'); return r ? dec(r[1]) : ''; };
  const noFixed = t => !/\b7 days\b|7–10|\bpublished\b/.test(t);
  // F1 ok
  let r = fr(placeOf('21_29', fs1(C.F1)));
  ok('F1 the row names its scope: containing 4° cell', r.label === 'Forest disturbance · containing 4° cell', r.label);
  ok('F1 count, start date, version, query time and age, groups, coverage', /^199,592 alert pixels \(10 m\), first detected on or after 2026-11-16, as held in version v20261123, queried 2026-11-23 09:42 UTC \(21\.5 h ago\) · nominal 198,963 · high 95 · highest 534 · coverage partial/.test(r.text), r.text);
  ok('F1 caveats: pixels not hectares, first detection ≠ clearing, confidence can change, change time not supplied', /pixels, not hectares or a trend; first detection is not the date of clearing; confidence can rise, or an alert can be removed, after this query; when confidence changed is not supplied by the source/.test(r.text), r.text);
  ok('F1 no fixed window, no end date, no "published"', noFixed(r.text) && !/ to 2026-11-2[34]\b/.test(r.text), r.text);
  ok('F1 no age warning at 21.5 h', !/older than 4 days/.test(r.text), r.text);
  // F2 valid zero, partial coverage
  r = fr(placeOf('15_49', fs1(C.F2)));
  ok('F2 a valid zero is the source\'s, inside the monitored masks, not proof, coverage stays partial', /^0 \(source-reported zero\) alert pixels \(10 m\), first detected on or after 2026-11-15, as held in version v20261122/.test(r.text) && /no matching alert pixel was returned within the contributing systems' monitored tree-cover and forest masks for this filter\. Not proof that nothing was disturbed, and not complete monitoring of the cell/.test(r.text) && /coverage partial/.test(r.text), r.text);
  // F3 outside coverage (Cape Town's cell)
  r = fr(placeOf('14_49', { ...ENV(), state: 'not_covered', why: 'outside the swept tropical land cells (alert systems run between 30°N and 30°S only)' }));
  ok('F3 outside coverage: not covered, latitude alone is not forest, never zero', /^not covered — the alert systems run between 30°N and 30°S; within that band, latitude alone does not make a cell monitored forest/.test(r.text) && !/\b0\b/.test(r.text.split('·')[0]), r.text);
  // F4–F6 the four-day edge (strictly more than)
  ok('F4 4 days − 1 s: no warning', !/older than 4 days/.test(fr(placeOf('x', fs1(C.F4))).text), fr(placeOf('x', fs1(C.F4))).text);
  ok('F5 exactly 4 days: no warning', !/older than 4 days/.test(fr(placeOf('x', fs1(C.F5))).text) && /\(4\.0 days ago\)/.test(fr(placeOf('x', fs1(C.F5))).text), fr(placeOf('x', fs1(C.F5))).text);
  ok('F6 4 days + 1 s: warning, actual age and query time shown', /\(4\.0 days ago\) · older than 4 days: this cell was last queried /.test(fr(placeOf('x', fs1(C.F6))).text), fr(placeOf('x', fs1(C.F6))).text);
  // F7 missing / malformed / impossible query time: kept distinct, never fresh
  ok('F7 missing query time', /query time not recorded/.test(fr(placeOf('x', fs1(C.F7m))).text) && !/ago/.test(fr(placeOf('x', fs1(C.F7m))).text), fr(placeOf('x', fs1(C.F7m))).text);
  ok('F7 malformed query time', /query time unreadable/.test(fr(placeOf('x', fs1(C.F7b))).text) && !/ago/.test(fr(placeOf('x', fs1(C.F7b))).text), fr(placeOf('x', fs1(C.F7b))).text);
  ok('F7 impossible calendar day (31 February)', /query time is not a real calendar day/.test(fr(placeOf('x', fs1(C.F7c))).text) && !/ago/.test(fr(placeOf('x', fs1(C.F7c))).text), fr(placeOf('x', fs1(C.F7c))).text);
  // F8 / A4 future skew: just below, exactly at, just beyond 5 min
  ok('F8 ahead by 299 s: ahead within tolerance, no age, no negative "ago"', /ahead of this page's clock by 299 s, within the 5-minute tolerance; no age is claimed/.test(fr(placeOf('x', fs1(C.F8a))).text) && !/ago|-299/.test(fr(placeOf('x', fs1(C.F8a))).text), fr(placeOf('x', fs1(C.F8a))).text);
  ok('F8 ahead by exactly 300 s: still within tolerance', /ahead of this page's clock by 300 s, within the 5-minute tolerance/.test(fr(placeOf('x', fs1(C.F8b))).text), fr(placeOf('x', fs1(C.F8b))).text);
  ok('F8 ahead by 301 s: query time unknown', /query time unknown: .* is more than 5 minutes ahead of this page's clock/.test(fr(placeOf('x', fs1(C.F8c))).text) && !/ago/.test(fr(placeOf('x', fs1(C.F8c))).text), fr(placeOf('x', fs1(C.F8c))).text);
  // F9 / F10 provenance unknown, never filled from the envelope
  ok('F9 missing since: not recorded, not the envelope\'s 2026-11-17', /first-detection start date not recorded/.test(fr(placeOf('x', fs1(C.F9m))).text) && !/2026-11-17|2026-11-24/.test(fr(placeOf('x', fs1(C.F9m))).text.split(', queried')[0]), fr(placeOf('x', fs1(C.F9m))).text);
  ok('F9 impossible since (31 November): unreadable', /first-detection start date unreadable/.test(fr(placeOf('x', fs1(C.F9b))).text), fr(placeOf('x', fs1(C.F9b))).text);
  ok('F10 version "latest": not resolved, no date made from it', /dataset version not resolved/.test(fr(placeOf('x', fs1(C.F10))).text) && !/as held in version latest/.test(fr(placeOf('x', fs1(C.F10))).text), fr(placeOf('x', fs1(C.F10))).text);
  // F11 unknown categories: listed, escaped, kept out of the total; a zero-valued one listed too; missing known value never 0
  r = fr(placeOf('x', fs1(C.F11)));
  ok('F11 unknown categories listed (non-zero and zero) and total qualified', /^10 alert pixels \(10 m\) across the three known categories; the unrecognised categories are listed separately and not included/.test(r.text) && /unrecognised category '<b>low<\/b>': 4/.test(r.text) && /unrecognised category 'spare': 0/.test(r.text), r.text);
  ok('F11 a provider key is escaped, never markup', r.html.includes("'&lt;b&gt;low&lt;/b&gt;'") && !r.html.includes('<b>low</b>'), r.html);
  r = fr(placeOf('x', fs1(C.F11z)));
  ok('F11 zero known with a non-zero unknown: no "nothing returned" claim', /^0 \(source-reported zero\) alert pixels \(10 m\) across the three known categories/.test(r.text) && !/no matching alert pixel was returned/.test(r.text), r.text);
  r = fr(placeOf('x', fs1(C.F11m)));
  ok('F11 a known group missing: highest "not provided", no total, not 0', /^count not available \(highest not provided\)/.test(r.text) && /highest not provided/.test(r.text) && !/highest 0/.test(r.text), r.text);
  // F12 cell present, run down: value and time kept; failure stated
  r = fr(placeOf('x', fs1(C.F1, { source_status: 'down' })));
  ok('F12 run down with a retained cell: cell kept with its own time; the failure is stated', /^199,592 alert pixels/.test(r.text) && /queried 2026-11-23 09:42 UTC/.test(r.text) && /the latest forest run \(2026-11-24 06:45 UTC\) did not succeed; this cell's value is from its own query/.test(r.text), r.text);
  // A1 stale envelope with status ok: old, not a failure
  r = fr(placeOf('x', fs1(C.F1, { retrieved_at: at(6 * 3600e3) })));
  ok('A1 stale envelope, status ok: "last recorded run … older than its refresh limit", never "did not succeed"', /the layer's last recorded run was 2026-11-24 01:10 UTC, older than its refresh limit; this cell is judged by its own query time/.test(r.text) && !/did not succeed/.test(r.text), r.text);
  // F13 down, no cell
  r = fr(placeOf('x', { ...ENV({ source_status: 'down' }), state: 'down', note: 'no GFW_API_KEY set' }));
  ok('F13 down with no cell: unknown, never zero', /^unknown — no GFW_API_KEY set/.test(r.text) && !/\b0\b/.test(r.text.split('·')[0]), r.text);
  // F14 prolonged retry then answered: its own since, no fixed window
  r = fr(placeOf('x', fs1(C.F14)));
  ok('F14 a 20-day window prints its own since; no "7 days" claimed for the cell', /first detected on or after 2026-11-01, as held in version v20261121/.test(r.text) && noFixed(r.text), r.text);
  // F15 fresh envelope, old cell
  r = fr(placeOf('x', fs1(C.F15)));
  ok('F15 fresh envelope, old cell: cell warning shown, layer not called stale', /older than 4 days/.test(r.text) && !/refresh limit|did not succeed/.test(r.text), r.text);
  // A3 pending: no count, no time invented
  r = fr(placeOf('x', { ...ENV(), state: 'pending', why: 'in the sweep, not answered yet' }));
  ok('A3 pending: unknown, no count, no query or first-asked time invented', /^unknown — in the sweep, not answered yet \(no count, no query time\)/.test(r.text) && !/\b0\b|queried|first asked/.test(r.text.replace(/layer run [^·]*/, '')), r.text);
  // A5 collection: daily snapshots, not queries
  const cl = coll(placeOf('x', fs1(C.F1), { collection: { forest: { queries_retained: 1, first_query: '2026-11-23', last_query: '2026-11-23' } } }));
  ok('A5 collection: one daily snapshot (several same-day queries are one row), no pixel history', /^1 daily snapshot of this cell retained, 2026-11-23 to 2026-11-23 \(at most one per UTC day: the day's latest answered query; not every query, and no pixel history\)/.test(cl), cl);
  ok('A5 collection: plural', /^12 daily snapshots of this cell retained, 2026-11-02 to 2026-11-23/.test(coll(placeOf('x', fs1(C.F1)))), coll(placeOf('x', fs1(C.F1))));
  // A2 mixed-cell summary, with an unresolved version and an unknown category
  try {
    const S = ME.forestSummary({ a: C.F1, b: C.F2, c: C.F10, d: C.F11, e: C.F11m });
    ok('A2 summary: sum of complete cells only, versions listed with counts, unresolved named, qualifiers', S.n === 199592 + 0 + 10 + 10 && S.counted === 4 && S.cells === 5 && S.versionText === 'v20261122 (1), v20261123 (3); version not resolved for 1 cell' && /1 cell carries an unrecognised confidence category, not included/.test(S.qualifier) && /1 cell without a complete count, not included/.test(S.qualifier), S);
  } catch (e) { ok('A2 summary', false, String(e)); }
};

// ---- Part B: the pages in a browser, every request intercepted
const cellsEnv = () => ({ ...ENV(), schema_version: 1, scheduled_for: at(25 * 60e3), interruptions: [], record_format: 'rows', record_fields: [], records: [],
  sweep: { cells_total: 559, answered: 5, queried_today: 1, oldest_queried_at: C.F15.queried_at, pending: 0, per_run: 6, cursor: 5 }, source_version: 'v20261123', citation: 'Source: "Integrated Deforestation Alerts". UMD/GLAD and WUR, accessed through Global Nature Watch on 2026-11-24',
  attribution: 'powered by Resource Watch / Global Nature Watch (WRI) — CC BY 4.0', map_layer: true,
  cells: { '21_29': C.F1, '15_49': C.F2, '20_30': C.F10, '22_29': C.F11, '20_29': C.F15 } });
const genericEnv = layer => ({ schema_version: 1, layer, collector_version: '0.6.24', retrieved_at: at(60e3), scheduled_for: at(60e3), window_start: at(3600e3), window_end: at(60e3), source_status: 'ok', interruptions: [], stale_after_s: 10800, cells: {}, record_format: 'rows', record_fields: ['lat', 'lng', 'observed_at'], records: [], quantity: 'q' });
const PLACES = { '21_29': () => placeOf('21_29', fs1(C.F1)), '20_29': () => placeOf('20_29', fs1(C.F15)), '14_49': () => placeOf('14_49', { ...ENV(), state: 'not_covered', why: 'x' }), '20_31': () => placeOf('20_31', { ...ENV(), state: 'pending', why: 'in the sweep, not answered yet' }), '22_29': () => placeOf('22_29', fs1(C.F11)) };

const server = http.createServer((req, res) => {   // this suite's own server: the three page files from `served`, everything else from disk
  const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  if (served[p] !== undefined) { res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'application/javascript' : 'text/html' }); return res.end(served[p]); }
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const B = async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const aborted = [], hubPaths = [], unknownHub = [];
  const open = async (page0, viewport = { width: 1280, height: 860 }) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await ctx.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.origin === BASE) return route.continue();
      if (u.host === 'unpkg.com' && /globe\.gl/.test(u.pathname)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS });
      if (u.host === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: FONTS });
      if (u.origin === HUB) {
        const p = u.pathname; hubPaths.push(p + u.search);
        const pl = /^\/place\/g4\/(\w+)$/.exec(p);
        if (pl) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify((PLACES[pl[1]] || (() => placeOf(pl[1], { ...ENV(), state: 'not_covered', why: 'x' })))()) });
        if (p === '/') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'mother-earth', version: '0.6.24' }) });
        if (p === '/cells/forest' || p === '/snapshot/forest') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cellsEnv()) });
        const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
        if (m) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(genericEnv(m[2])) });
        unknownHub.push(p); return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      }
      aborted.push(u.host + u.pathname.slice(0, 40)); return route.abort();   // nothing else leaves the suite
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.clock.setFixedTime(new Date(T));
    await page.goto(BASE + '/' + page0, { waitUntil: 'domcontentloaded' });
    return { ctx, page, perr };
  };
  const panelRows = page => page.evaluate(() => [...document.querySelectorAll('#insp-dl dt')].map(dt => [dt.textContent, dt.nextElementSibling ? dt.nextElementSibling.textContent : '']));
  const rowT = (rows, re) => (rows.find(r => re.test(r[0])) || [null, ''])[1];
  const waitPlace = page => page.waitForFunction(() => { const dt = document.querySelector('#insp-dl dt'); return dt && !/Loading/.test(dt.textContent); }, null, { timeout: 15000 });

  // ---- World View, desktop
  let { ctx, page, perr } = await open('index.html');
  try { await page.waitForFunction(() => window.ME && document.getElementById('v-forest') && document.getElementById('v-forest').textContent !== '–', null, { timeout: 30000 }); } catch (_) { }
  const card = await page.evaluate(() => ({ v: document.getElementById('v-forest').textContent, small: document.querySelector('#card-forest .value small').textContent, o: document.getElementById('o-forest').textContent }));
  ok('B1 card: page-owned unit, no "published in the last 7 days"', card.small === "alert pixels (10 m) · first detected in each cell's own window", card);
  ok('B1 card: the total is the sum of complete cells; versions listed with counts, the unresolved cell and the unknown category named', card.v === (199592 + 10 + 10 + 10).toLocaleString('en') && /5 of 559 tropical land cells answered, each with its own first-detection date and query time; dataset versions v20261119 \(1\), v20261122 \(1\), v20261123 \(2\); version not resolved for 1 cell; 1 cell carries an unrecognised confidence category, not included/.test(card.o), card);
  const tglBefore = await page.evaluate(() => [...document.querySelectorAll('button.tgl, .ovl-tgl')].map(b => (b.id || b.dataset.layer) + '=' + b.getAttribute('aria-checked')).join(','));
  const renderBefore = await page.evaluate(() => JSON.stringify(ME.renderState ? ME.renderState() : null));
  // place panel: F1
  await page.evaluate(() => ME.openPlace('21_29')); await waitPlace(page);
  let rows = await panelRows(page), f = rowT(rows, /^Forest disturbance/);
  ok('B2 panel: forest row label and corrected wording on the page', rows.some(r => r[0] === 'Forest disturbance · containing 4° cell') && /^199,592 alert pixels \(10 m\), first detected on or after 2026-11-16, as held in version v20261123, queried 2026-11-23 09:42 UTC \(21\.5 h ago\)/.test(f) && !/published|7 days/.test(f), f);
  ok('B2 panel: collection line counts daily snapshots', /^12 daily snapshots of this cell retained, 2026-11-02 to 2026-11-23 \(at most one per UTC day/.test(rowT(rows, /^Collection · Forest/)), rowT(rows, /^Collection · Forest/));
  ok('B2 panel: no "queries of this cell retained" anywhere', !/queries of this cell retained/.test(rows.map(r => r[1]).join(' ')));
  // old cell (F15) on the page clock
  await page.evaluate(() => ME.openPlace('20_29')); await waitPlace(page); rows = await panelRows(page);
  ok('B3 panel: a cell queried 5 days before the page clock carries the warning; the 25-min-old layer is not called stale', /\(5\.0 days ago\) · older than 4 days/.test(rowT(rows, /^Forest disturbance/)) && !/refresh limit|stale/.test(rowT(rows, /^Forest disturbance/)), rowT(rows, /^Forest disturbance/));
  // unknown category (F11) on the page: escaped
  await page.evaluate(() => ME.openPlace('22_29')); await waitPlace(page);
  const h11 = await page.evaluate(() => document.getElementById('insp-dl').innerHTML);
  ok('B4 panel: a provider key reaches the page as text, not markup', /unrecognised category '&lt;b&gt;low&lt;\/b&gt;': 4/.test(h11) && !/<b>low<\/b>/.test(h11), h11.slice(0, 400));
  // pending: nothing switched on
  await page.evaluate(() => ME.openPlace('20_31')); await waitPlace(page); rows = await panelRows(page);
  ok('B5 pending: unknown, no count, no time', /^unknown — in the sweep, not answered yet \(no count, no query time\)/.test(rowT(rows, /^Forest disturbance/)), rowT(rows, /^Forest disturbance/));
  // Cape Town
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page); rows = await panelRows(page);
  ok('B5 Cape Town\'s cell: not covered, page-owned wording', /^not covered — the alert systems run between 30°N and 30°S/.test(rowT(rows, /^Forest disturbance/)), rowT(rows, /^Forest disturbance/));
  const tglAfter = await page.evaluate(() => [...document.querySelectorAll('button.tgl, .ovl-tgl')].map(b => (b.id || b.dataset.layer) + '=' + b.getAttribute('aria-checked')).join(','));
  const renderAfter = await page.evaluate(() => JSON.stringify(ME.renderState ? ME.renderState() : null));
  ok('B5 opening the panel five times switched no layer and changed no globe data', tglBefore === tglAfter && tglBefore.length > 20 && renderBefore === renderAfter, { tglBefore, tglAfter });
  // keyboard: Escape closes; the close button takes focus
  await page.focus('#insp-x'); const fx = await page.evaluate(() => document.activeElement && document.activeElement.id);
  await page.keyboard.press('Escape'); const shut = await page.evaluate(() => !document.getElementById('insp').classList.contains('show'));
  ok('B6 keyboard: the panel close button takes focus and Escape closes the panel', fx === 'insp-x' && shut, { fx, shut });
  // the cell inspector
  const opened = await page.evaluate(() => ME.openCell('forest', '22_29')); await page.waitForTimeout(150); rows = await panelRows(page);
  ok('B7 cell inspector: page-owned Quantity, not the hub\'s "published" string', opened && /^10 m alert pixels first detected on or after each cell's own date, as held in the dataset version named for that cell/.test(rowT(rows, /^Quantity$/)) && !/published/.test(rows.map(r => r[1]).join(' ')), { opened, q: rowT(rows, /^Quantity$/) });
  ok('B7 cell inspector: Queried row has age, own since and version; groups list the unrecognised key as excluded', /^queried .* \(60 min ago\) · first detected on or after 2026-11-16 · as held in version v20261123$/.test(rowT(rows, /^Queried$/)) && /unrecognised category '<b>low<\/b>': 4 · unrecognised category 'spare': 0 \(not included in the total\)/.test(rowT(rows, /^By confidence$/)), [rowT(rows, /^Queried$/), rowT(rows, /^By confidence$/)]);
  ok('B7 cell inspector: Cell total has no fixed window', /^10 alert pixels \(10 m\), first detected on or after this cell's own date \(see Queried\)$/.test(rowT(rows, /^Cell total$/)), rowT(rows, /^Cell total$/));
  ok('B8 no page errors on World View', perr.length === 0, perr);
  await ctx.close();

  // ---- 360 px: the panel's text stays inside the viewport
  ({ ctx, page, perr } = await open('index.html', { width: 360, height: 780 }));
  try { await page.waitForFunction(() => window.ME && ME.openPlace, null, { timeout: 30000 }); } catch (_) { }
  for (const id of ['21_29', '22_29']) {
    await page.evaluate(i => ME.openPlace(i), id); await waitPlace(page); await page.waitForTimeout(150);
    const o = await page.evaluate(() => { const vw = document.documentElement.clientWidth, out = []; const w = document.createTreeWalker(document.getElementById('insp'), NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) { if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) out.push([n.textContent.slice(0, 40), Math.round(r.left), Math.round(r.right)]); }
      return { vw, sw: document.scrollingElement.scrollWidth, out: out.slice(0, 5) }; });
    ok(`B9 360 px, cell ${id}: no text node outside the viewport, no horizontal scroll`, o.out.length === 0 && o.sw <= o.vw, o);
  }
  await ctx.close();

  // ---- Sources: report, Measures table, rules list, forest paragraph
  ({ ctx, page, perr } = await open('sources.html'));
  try { await page.waitForFunction(() => /forest-disturbance|forest disturbance/i.test(document.getElementById('report-text').textContent), null, { timeout: 30000 }); } catch (_) { }
  const S = await page.evaluate(() => ({ rep: document.getElementById('report-text').textContent, measures: [...document.querySelectorAll('#t-measures tr')].map(tr => tr.textContent).find(t => /Forest disturbance/.test(t)) || '',
    windows: [...document.querySelectorAll('#t-windows tr')].map(tr => tr.textContent).find(t => /Forest disturbance/.test(t)) || '', limits: (document.getElementById('limits-body') || {}).textContent || '', body: document.body.textContent }));
  ok('B10 report: a sum across cells with their own dates, versions listed, not one common period', /forest-disturbance alert pixels summed across 5 cells, each counted from its own first-detection date at its own query time \(dataset versions v20261119 \(1\), v20261122 \(1\), v20261123 \(2\); version not resolved for 1 cell; 1 cell carries an unrecognised confidence category, not included\); not one common period and not a trend/.test(S.rep), S.rep.slice(0, 900));
  ok('B11 Sources Measures: page-owned forest Quantity', /^Forest disturbance10 m alert pixels first detected on or after each cell's own date/.test(S.measures), S.measures);
  ok('B11 Sources Windows: own date per cell, no common period; cadence says retries lengthen the sweep', /each cell from its own first-detection date .* no common period across cells/.test(S.windows) && /retries lengthen it/.test(S.windows), S.windows);
  ok('B12 Sources forest paragraph: first detected, no "published in the 7 days", the 4-day mark explained', /Counts are 10 m alert pixels first detected on or after each cell's own start date \(the integrated layer keeps each pixel's earliest detection date\)/.test(S.limits) && !/published in the 7 days/.test(S.limits) && /marked older/.test(S.limits), S.limits.slice(S.limits.indexOf('Forest disturbance'), S.limits.indexOf('Forest disturbance') + 700));
  ok('B12 nowhere on Sources: "published in the last 7 days" or "published in the 7 days"', !/published in the (last )?7 days/.test(S.body), (S.body.match(/.{60}published in the (last )?7 days.{20}/) || [''])[0]);
  ok('B13 no page errors on Sources', perr.length === 0, perr);
  await ctx.close();

  // ---- isolation (GPT rev 2 review §4): nothing left this suite; no GNW request at all; place requests only for the cells opened
  ok('B14 saved data only: no request reached any provider (every non-local request answered from fixtures or aborted); none to Global Nature Watch', !aborted.some(a => /globalforestwatch|globalnaturewatch|wri\.org/.test(a)), aborted);
  ok('B14 the hub was asked only for fixture paths (no unknown hub path)', unknownHub.length === 0, unknownHub);
  ok('B14 place requests: exactly the five cells opened at desktop and the two at 360 px', JSON.stringify(hubPaths.filter(p => p.startsWith('/place/'))) === JSON.stringify(['/place/g4/21_29', '/place/g4/20_29', '/place/g4/22_29', '/place/g4/20_31', '/place/g4/14_49', '/place/g4/21_29', '/place/g4/22_29']), hubPaths.filter(p => p.startsWith('/place/')));
  console.log(`isolation: ${hubPaths.length} hub requests answered from fixtures; ${aborted.length} other requests aborted (${[...new Set(aborted.map(a => a.split('/')[0]))].join(', ') || 'none'}); 0 reached the network`);
  await browser.close(); server.close();
};

(async () => {
  try { A(); } catch (e) { ok('A crashed', false, String(e)); }
  try { await B(); } catch (e) { ok('B crashed', false, String(e).slice(0, 400)); try { server.close(); } catch (_) { } }
  clearTimeout(wd);
  console.log(`\nnature-context-ui${OLD ? ' (OLD=1: main\'s page files)' : ''}${BREAK ? ` (BREAK=${BREAK})` : ''}: ${pass} passed, ${fail} failed${fail ? ' — ' + [...new Set(failed)].join(' ') : ''}`);
  process.exit(fail ? 1 : 0);
})();
