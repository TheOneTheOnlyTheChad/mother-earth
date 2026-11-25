/* Mother Earth — Organic-soil emissions (modelled): fixture preview (soil-preview-rc, 25 Nov 2026).
 * Proposal: docs/concepts/NATURE-CONTEXT-SOIL-PROPOSAL.md rev 3 (§1 row, §1b optional globe layer); Chad's S1–S4 of 25 Nov 2026.
 * Reference contract: docs/research/soil-c1/soil_reference.py (GPT rev 2 recheck R2-1). The page must reproduce it.
 *
 * Part A (no browser): soil.js in a VM with Node's WebCrypto. fmt, cell text and layer classes against the Python reference for every
 *   fixture cell and period; whole-table validation (GPT's three reproductions and 18 mutations); the pinned fingerprint; the fixture
 *   subset rule (a cell outside the fixture is never "no organic soil").
 * Part B (Chromium + SwiftShader, served by this suite): every non-local request intercepted; hub paths answered from small fixtures
 *   or 404; anything else aborted and listed. Bare start, switching on, drained/burned, colours by class, the selected-cell outline,
 *   the inspector, the place panel with the layer off, the hub-error path, a tampered table, Sources, keyboard, 360 px.
 * Controls: OLD=1 serves main's page files (git show origin/main:<file>) — the soil checks must fail there.
 *   BREAK=no-hash | sparse-first | zero-positive | combined | no-outline | subset-nosoil | load-at-start | no-incomplete | bins-shifted |
 *         zero-drops-coverage | unknown-counts | no-soilview | alpha-only   each must fail.
 * Round 2 (GPT preview review, 25 Nov: P2, H1–H3): A13, B19–B23; palette and key wording in B2–B4.
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/soil-ui.test.cjs
 * Needs /home/claude/spike/node_modules with globe.gl@2.45.0 and @fontsource/{ibm-plex-mono,barlow-condensed} (as the other page suites).
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const http = require('http'); const cp = require('child_process'); const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const PORT = 8907, BASE = `http://127.0.0.1:${PORT}`, HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const SPIKE = '/home/claude/spike/node_modules/';
const GLOBE_JS = fs.readFileSync(SPIKE + 'globe.gl/dist/globe.gl.min.js', 'utf8');
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${SPIKE}@fontsource/${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const FONTS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('\n');
const BREAK = process.env.BREAK || '', OLD = process.env.OLD === '1';
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n.split(' ')[0]); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 8 min — failure, not a hang'); process.exit(1); }, 8 * 60e3);

const TABLE = 'assets/soil/g4-soil-fixture-v1.0.1.json';
const read = f => { if (!OLD) return fs.readFileSync(path.join(ROOT, f), 'utf8'); try { return cp.execFileSync('git', ['show', 'origin/main:' + f], { cwd: ROOT, maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (_) { return ''; } };
const served = { 'index.html': read('index.html'), 'sources.html': read('sources.html'), 'soil.js': read('soil.js') };
{ const rep = (f, a, b) => { const was = served[f]; served[f] = served[f].replace(a, b); if (served[f] === was) { console.log(`FAIL  break ${BREAK} did not apply`); process.exit(1); } };
  if (BREAK === 'no-hash') rep('soil.js', "if (hex(await crypto.subtle.digest('SHA-256', buf)) !== S.SHA256) throw", "if (false) throw");
  if (BREAK === 'sparse-first') rep('soil.js', "if (!ready()) return { kind: 'unavailable', text: st.status", "if (!ready() && false) return { kind: 'unavailable', text: st.status");
  if (BREAK === 'zero-positive') rep('soil.js', "if (s.state === 'zero') return { zero: true, incomplete: p.coverage === 'incomplete' };", "if (s.state === 'zero') return { bin: 0, incomplete: false };");
  if (BREAK === 'zero-drops-coverage') rep('soil.js', "if (s.state === 'zero') return { zero: true, incomplete: p.coverage === 'incomplete' };", "if (s.state === 'zero') return { zero: true, incomplete: false };");
  if (BREAK === 'unknown-counts') rep('soil.js', "what = 'unknown — no estimate for any part of this cell'; unknownCells++; }", "what = 'unknown — no estimate for any part of this cell'; drawnCells++; }");
  if (BREAK === 'no-soilview') rep('index.html', "$('insp').classList.add('soilview');", "");
  if (BREAK === 'alpha-only') rep('soil.js', "const fillFor = i => rgba(S.RAMP[i], S.OPACITY);", "const fillFor = i => rgba(S.RAMP[3], [0.16, 0.26, 0.38, 0.50, 0.64, 0.80][i]);");
  if (BREAK === 'combined') rep('soil.js', "parts.push(rec.has_mapped_organic_soil ?", "parts.push(`total ≈ ${fmt((p.drained.Mg || 0) + (p.burned.Mg || 0), 't CO₂e per year')}`); parts.push(rec.has_mapped_organic_soil ?");
  if (BREAK === 'no-outline') rep('soil.js', "if (st.on && st.sel && inDomain(st.sel)) out.push(", "if (false) out.push(");
  if (BREAK === 'subset-nosoil') rep('soil.js', "const inSubset = id => !st.table.meta.fixture ||", "const inSubset = id => true ||");
  if (BREAK === 'load-at-start') rep('soil.js', "    paint();\n  }\n  if (document.readyState", "    paint(); loadTable();\n  }\n  if (document.readyState");
  if (BREAK === 'no-incomplete') rep('soil.js', "if (p.coverage === 'incomplete') parts.push(", "if (false) parts.push(");
  if (BREAK === 'bins-shifted') rep('soil.js', "BINS: [0, 1e3, 1e4, 1e5, 1e6, 1e7, Infinity],", "BINS: [0, 1e2, 1e3, 1e4, 1e5, 1e6, Infinity],");
}
const RAW = fs.readFileSync(path.join(ROOT, TABLE)); const FIX = JSON.parse(RAW);
const SUB = FIX.meta.fixture.subset_cells, PERIODS = ['2001_2005', '2006_2010', '2011_2015', '2016_2020', '2021_2024'];

// ---------------- Part A: soil.js in a VM, against the Python reference
async function A() {
  if (!served['soil.js']) { ok('A0 soil.js exists on the page', false); return; }
  const mkS = () => {
    const ctx = { window: {}, document: { readyState: 'complete', getElementById: () => null, querySelectorAll: () => [], addEventListener: () => { } },
      crypto: globalThis.crypto, TextDecoder, console, fetch: async u => ({ ok: true, arrayBuffer: async () => { const b = (mkS.bytes || RAW); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } }) };
    ctx.window.crypto = ctx.crypto; vm.createContext(ctx); vm.runInContext(served['soil.js'], ctx); return ctx.window.ME.soil;
  };
  const S = mkS(); await S.ensure();
  ok('A1 the pinned fixture loads and validates', S.test.state().status === 'ok', S.test.state());
  // Python reference for the same fixture: values text (subset cells only), classes and fmt
  const ref = JSON.parse(cp.execFileSync('python3', ['-I', '-c', `
import sys, json; sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'docs/research/soil-c1'))})
import soil_reference as R
t = json.load(open(${JSON.stringify(path.join(ROOT, TABLE))}))
sub = t['meta']['fixture']['subset_cells']
nums = sorted({r['organic_km2'] for r in t['cells'].values()} | {q[c]['Mg'] for r in t['cells'].values() for q in r['periods'].values() for c in ('drained','burned') if q[c]['Mg'] is not None} | {q['incomplete_source_footprint_km2'] for r in t['cells'].values() for q in r['periods'].values()} | {0.0, 0.004, 0.0099, 0.01, 0.0105, 9.94, 9.95, 9.96, 99.5, 999.9, 1e9})
print(json.dumps(dict(
  fmt={repr(x): R.fmt(x, 'u') for x in nums},
  text={f'{c}|{p}': R.display(t, c, p) for c in sub for p in R.PERIODS},
  cls={f'{c}|{k}|{p}': (lambda v: v if isinstance(v, str) else list(v))(R.layer_class(t, c, k, p)) for c in sub for k in ('drained', 'burned') for p in R.PERIODS})))
`], { maxBuffer: 64e6 }).toString());
  const fbad = Object.entries(ref.fmt).filter(([x, y]) => S.test.fmt(Number(x), 'u') !== y);
  ok(`A2 fmt equals the reference for ${Object.keys(ref.fmt).length} values (every stored number in the fixture and the rounding edges)`, !fbad.length, fbad.slice(0, 5).map(([x, y]) => [x, y, S.test.fmt(Number(x), 'u')]));
  const tbad = Object.entries(ref.text).filter(([k, y]) => { const [c, p] = k.split('|'), j = S.test.cellText(c, p); return j.kind === 'values' || j.kind === 'no-soil' ? j.text !== y : !/^unknown/.test(y); });
  ok(`A3 cell text equals the reference for every fixture cell and period (${Object.keys(ref.text).length})`, !tbad.length, tbad.slice(0, 3).map(([k, y]) => [k, y, S.test.cellText(...k.split('|')).text]));
  const cbad = Object.entries(ref.cls).filter(([k, y]) => { const [c, comp, per] = k.split('|'), j = S.test.cellClass(c, comp, per); return JSON.stringify(typeof j === 'string' ? j : j.zero ? ['zero', j.incomplete] : ['bin', j.bin, j.incomplete]) !== JSON.stringify(y); });
  ok(`A4 layer class equals the reference for every fixture cell, both components, every period (${Object.keys(ref.cls).length})`, !cbad.length, cbad.slice(0, 5).map(([k, y]) => [k, y, S.test.cellClass(...k.split('|'))]));
  // GPT R2-1 reproductions and mutations: each makes the table unavailable
  const clone = () => JSON.parse(RAW);
  ok('A5 empty meta and cells is not a table (R2-1)', S.test.validate({ meta: {}, cells: {} }) !== null);
  ok('A5 an unsupported period on a cell with no record is unknown, not "no soil" (R2-1)', /^unknown/.test(S.test.cellText('14_49', '1999_2000').text) && S.test.cellText('14_49').text === 'no organic soil mapped in this cell by this model');
  const muts = {
    'positive with -1 (R2-1)': t => { t.cells['22_70'].periods['2021_2024'].drained.Mg = -1; },
    'wrong version': t => { t.meta.version = '1.0.2'; }, 'wrong grid': t => { t.meta.grid.rows = 46; }, 'period missing from meta': t => { delete t.meta.totals['2021_2024']; },
    'sparse rule missing': t => { delete t.meta.sparse_rule; }, 'cell outside the domain': t => { t.cells['45_0'] = t.cells['22_70']; },
    'non-canonical id': t => { t.cells['022_70'] = t.cells['22_70']; delete t.cells['22_70']; }, 'flag disagrees': t => { t.cells['31_78'].organic_km2 = 0; },
    'boolean area': t => { t.cells['31_78'].organic_km2 = true; }, 'string Mg': t => { t.cells['22_70'].periods['2021_2024'].burned.Mg = '5'; },
    'period missing in a record': t => { delete t.cells['22_70'].periods['2001_2005']; }, 'zero with a value': t => { t.cells['13_27'].periods['2021_2024'].drained.Mg = 5; },
    'positive with 0': t => { t.cells['22_70'].periods['2021_2024'].burned.Mg = 0; }, 'unknown under complete coverage': t => { Object.assign(t.cells['22_70'].periods['2021_2024'].burned, { state: 'unknown', Mg: null }); },
    'complete with a footprint': t => { t.cells['22_70'].periods['2021_2024'].incomplete_source_footprint_km2 = 1; }, 'incomplete without a footprint': t => { t.cells['38_39'].periods['2011_2015'].incomplete_source_footprint_km2 = 0; },
    'unknown coverage word': t => { t.cells['22_70'].periods['2021_2024'].coverage = 'partial'; }, 'record outside the fixture subset': t => { t.cells['0_0'] = t.cells['22_70']; },
    'duplicate subset id': t => { t.meta.fixture.subset_cells.push('22_70'); },
  };
  const mbad = Object.entries(muts).filter(([, f]) => { const t = clone(); f(t); return S.test.validate(t) === null; }).map(([k]) => k);
  ok(`A6 ${Object.keys(muts).length} malformed tables are each refused`, !mbad.length, mbad);
  ok('A7 the real fixture validates', S.test.validate(clone()) === null, S.test.validate(clone()));
  // fingerprint: a table one byte different is not used, and nothing is read as zero or "no soil"
  mkS.bytes = Buffer.from(RAW.toString().replace('"organic_km2":', '"organic_km2" :')); const T2 = mkS(); await T2.ensure(); mkS.bytes = null;
  ok('A8 a table that is not the pinned bytes is unavailable everywhere (valid JSON, same content, one space added)', T2.test.state().status === 'unavailable' && /pinned/.test(T2.test.state().why) && /^unknown/.test(T2.test.cellText('14_49').text) && T2.test.cellClass('22_70') === 'unavailable', T2.test.state());
  // fixture subset: outside is unknown, never "no organic soil"
  ok('A9 a cell outside the fixture is unknown (not "no organic soil"); 14_49 inside it is "no organic soil mapped"', S.test.cellText('10_10').kind === 'outside' && !/no organic soil mapped/.test(S.test.cellText('10_10').text) && S.test.cellClass('10_10') === 'outside' && S.test.cellClass('14_49') === 'no-soil');
  const all = SUB.flatMap(c => PERIODS.map(p => S.test.cellText(c, p).text)).join('\n');
  ok('A10 no combined total, no positive shown as 0, the neutral zero sentence', !/total ≈/.test(all) && !/(drained|burned) ≈ 0 /.test(all) && /0 assigned by this model in this period; this does not establish zero real-world emissions/.test(all));
  ok('A11 38_39 2011–15 and 2016–20 carry the incomplete-coverage wording; 2021–24 does not', /source raster cells covering about 10 km² within this 4° cell have missing estimates\. Values sum the available raster cells/.test(S.test.cellText('38_39', '2011_2015').text) && /about 6\.5 km²/.test(S.test.cellText('38_39', '2016_2020').text) && !/incomplete/.test(S.test.cellText('38_39').text));
  { const z = S.test.cellClass('38_39', 'burned', '2011_2015'), d = S.test.cellClass('38_39', 'drained', '2011_2015');
    ok('A13 a model zero keeps its incomplete coverage, like a value (GPT preview review H1; checked directly, not via the reference)', !!z && z.zero === true && z.incomplete === true && d.incomplete === true && d.bin === 4 && S.test.cellClass('13_27', 'drained').zero === true && S.test.cellClass('13_27', 'drained').incomplete === false, { z, d }); }
  ok('A12 31_78 small area is shown as a positive (GPT H1 regression)', /mapped organic soil ≈ 0\.044 km²/.test(S.test.cellText('31_78').text));
}

// ---------------- Part B: the page
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  if (served[p] !== undefined) { if (served[p] === '' && OLD) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'application/javascript' : 'text/html' }); return res.end(served[p]); }
  if (p === TABLE && tamper) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(tamper); }
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let tamper = null, placeDown = false;
const placeOf = id => { const [r, c] = id.split('_').map(Number); return { cell: { id, ref: 'g4', south: r * 4 - 90, north: r * 4 - 86, west: c * 4 - 180, east: c * 4 - 176, area_km2: 1000 }, statement: 'fixture', layers: {}, not_place_based: {}, generated_at: '2026-11-25T08:00:00Z', collector_version: 'fixture' }; };
async function B() {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const aborted = [], tableReqs = [];
  const open = async (page0, viewport = { width: 1280, height: 860 }) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await ctx.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.origin === BASE) { if (u.pathname === '/' + TABLE) tableReqs.push(u.pathname); return route.continue(); }
      if (u.host === 'unpkg.com' && /globe\.gl/.test(u.pathname)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS });
      if (u.host === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: FONTS });
      if (u.origin === HUB) {
        const pl = /^\/place\/g4\/(\w+)$/.exec(u.pathname);
        if (pl && !placeDown) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(placeOf(pl[1])) });
        if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'mother-earth', version: '0.6.25' }) });
        return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      }
      aborted.push(u.host + u.pathname.slice(0, 40)); return route.abort();
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/' + page0, { waitUntil: 'domcontentloaded' });
    return { ctx, page, perr };
  };
  const panelRows = page => page.evaluate(() => [...document.querySelectorAll('#insp-dl dt')].map(dt => [dt.textContent, dt.nextElementSibling ? dt.nextElementSibling.textContent : '']));
  const rowT = (rows, re) => (rows.find(r => re.test(r[0])) || [null, ''])[1];
  const waitPlace = page => page.waitForFunction(() => { const dt = document.querySelector('#insp-dl dt'); return dt && !/Loading/.test(dt.textContent) && !/loading the soil table/.test(document.getElementById('insp-dl').textContent); }, null, { timeout: 15000 }).catch(() => { });
  const polys = page => page.evaluate(() => window.ME && ME.globe ? ME.globe().polygonsData().filter(p => /^soil/.test(p.layer)).map(p => ({ layer: p.layer, id: p.id, fill: p.fill, stroke: p.stroke, alt: p.alt || null })) : null);

  let { ctx, page, perr } = await open('index.html');
  try { await page.waitForFunction(() => window.ME && ME.globe && ME.globe().polygonsData, null, { timeout: 30000 }); } catch (_) { }
  await page.waitForTimeout(1500);
  const start = await page.evaluate(() => ({ tgl: document.getElementById('tgl-soil') && document.getElementById('tgl-soil').getAttribute('aria-checked'), s: (document.getElementById('s-soil') || {}).textContent, o: (document.getElementById('o-soil') || {}).textContent, ev: (document.querySelector('#card-soil .ev') || {}).textContent, key: ME.keyState ? ME.keyState().drawn : null }));
  ok('B1 bare start: the soil card exists, labelled Modelled, off, nothing requested, nothing drawn', start.tgl === 'false' && start.s === 'off' && start.ev === 'Modelled' && tableReqs.length === 0 && !(start.key || []).includes('soil'), { start, tableReqs });
  await page.click('#tgl-soil');
  await page.waitForFunction(() => document.getElementById('s-soil').textContent !== 'loading', null, { timeout: 10000 }).catch(() => { });
  let P = await polys(page) || [];
  const on1 = await page.evaluate(() => ({ s: document.getElementById('s-soil').textContent, o: document.getElementById('o-soil').textContent, key: ME.keyState().drawn, leg: ME.legendState().line, radios: [...document.querySelectorAll('#soil-comp button')].map(b => b.dataset.comp + '=' + b.getAttribute('aria-checked')).join(), keybox: document.getElementById('soil-key').textContent }));
  const lay = await page.evaluate(() => ME.layers ? ME.layers.state() : null);
  ok('B2 the Layers list counts it: one row under Analysed and modelled, "1 on", the first-view hint gone', !!lay && lay.n === 1 && lay.on.join() === 'Organic-soil emissions (modelled)' && lay.hint === false && /1 on/.test(lay.label), lay);
  const exp = FIX.cells, drawnD = Object.keys(exp).filter(id => exp[id].has_mapped_organic_soil);
  ok('B2 on: one table request; every fixture record with mapped soil drawn (drained), and nothing else', tableReqs.length === 1 && P.filter(p => p.layer === 'soil').length === drawnD.length && P.every(p => p.layer !== 'soil' || exp[p.id]), { reqs: tableReqs.length, drawn: P.filter(p => p.layer === 'soil').length, want: drawnD.length });
  ok('B2 card, key and legend: on, drained checked, the scale with its states, the Key counts the layer once, the legend line names it', on1.s === 'on' && on1.o.includes(`Drained organic soils · 2021–2024 average · ${P.filter(p => p.layer === 'soil').length} cells drawn (preview fixture: 82 of 4,050 cells)`) && on1.radios === 'drained=true,burned=false' && on1.key.filter(k => k === 'soil').length === 1 && /Organic-soil emissions \(modelled, 2021–2024, whole 4° cells\)/.test(on1.leg) && /10,000,000 or more/.test(on1.keybox) && /hollow: 0 assigned by this model/.test(on1.keybox) && /more than 0, below 1,000/.test(on1.keybox) && /violet outline: incomplete model coverage — filled, a sum over the available raster cells; hollow, a 0 over them/.test(on1.keybox) && /not in the fixture/.test(on1.keybox), on1);
  const fillOf = (id, layer = 'soil') => (P.find(p => p.layer === layer && p.id === id) || {}).fill;
  const RAMP = ['106,57,19', '146,85,18', '183,118,31', '212,152,56', '232,189,109', '247,227,176'], bin = v => [1e3, 1e4, 1e5, 1e6, 1e7, Infinity].findIndex(b => v < b);
  const wrongFill = drawnD.filter(id => { const s = exp[id].periods['2021_2024'].drained; const want = s.state === 'zero' ? 'rgba(0,0,0,0)' : `rgba(${RAMP[bin(s.Mg)]},0.88)`; return fillOf(id) !== want; });
  ok('B3 colours by fixed decade bins (drained); model zeros hollow, never sharing a fill with a value', !wrongFill.length && fillOf('22_70') === 'rgba(247,227,176,0.88)', wrongFill.slice(0, 5).map(id => [id, fillOf(id)]));
  await page.click('#soil-comp button[data-comp="burned"]'); await page.waitForTimeout(300); P = await polys(page);
  const wrongB = drawnD.filter(id => { const s = exp[id].periods['2021_2024'].burned; const want = s.state === 'zero' ? 'rgba(0,0,0,0)' : `rgba(${RAMP[bin(s.Mg)]},0.88)`; return fillOf(id) !== want; });
  const zeroB = drawnD.filter(id => exp[id].periods['2021_2024'].burned.state === 'zero');
  ok('B4 burned: colours follow burned values; its zero cells are hollow outlines; the radios follow', !wrongB.length && zeroB.length > 20 && zeroB.every(id => (P.find(p => p.id === id && p.layer === 'soil') || {}).stroke === 'rgba(212,152,56,1)') && await page.evaluate(() => document.querySelector('#soil-comp button[data-comp="burned"]').getAttribute('aria-checked')) === 'true', { wrongB: wrongB.slice(0, 5), zeroB: zeroB.length });
  // keyboard: an arrow key moves the choice and the focus
  await page.focus('#soil-comp button[data-comp="burned"]'); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200);
  ok('B5 keyboard: an arrow key switches back to drained and moves focus', await page.evaluate(() => document.activeElement && document.activeElement.dataset.comp === 'drained' && document.querySelector('#soil-comp button[data-comp="drained"]').getAttribute('aria-checked') === 'true'));
  // the inspector from a soil cell, with the selected-cell outline
  await page.evaluate(() => ME.openCell('soil', '22_70')); await page.waitForTimeout(300);
  let rows = await panelRows(page); P = await polys(page);
  const h = await page.evaluate(() => document.getElementById('insp-h').textContent);
  ok('B6 inspector: whole-cell wording, the modelled values, what the colour shows, the source; the selected cell outlined in white above the cells', h === 'Organic-soil emissions (modelled) · cell 22_70' && /^4° cell 22_70 · 2°S–2°N, 100°E–104°E — a whole-cell total, outlined on the globe; not a value at the point you clicked$/.test(rowT(rows, /^Selected/)) && /^modelled, not measured · 2021–2024 average · drained ≈ 310,000,000 t CO₂e per year · burned ≈ 4,600,000 t CO₂e per year · mapped organic soil ≈ 80,000 km²/.test(rowT(rows, /^Modelled values/)) && /colours compare cell totals, not emissions per km²/.test(rowT(rows, /^Shown on the globe/)) && /doi:10\.5281\/zenodo\.22137130 · CC BY 4\.0/.test(rowT(rows, /^Source/)) && P.some(p => p.layer === 'soil-sel' && p.id === '22_70' && p.stroke === 'rgba(255,255,255,1)' && p.alt > 0.006), { h, rows: rows.slice(0, 4), sel: P.filter(p => p.layer === 'soil-sel') });
  ok('B6 the row: caveats beside the values, no combined total, the periods behind a closed disclosure with the period warning', await page.evaluate(() => { const d = document.querySelector('#insp-dl details.soilper'); const t = document.getElementById('insp-dl').textContent; return !!d && !d.open && /Show all reporting periods/.test(d.querySelector('summary').textContent) && /Differences between periods must not be interpreted as measured local change/.test(d.textContent) && /Substantial model uncertainty; local uncertainty is not quantified/.test(t) && /Totals for the whole 4° cell, not this point and not per hectare/.test(t) && !/total ≈/.test(t); }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); P = await polys(page);
  ok('B7 closing removes the outline; the layer stays drawn', !P.some(p => p.layer === 'soil-sel') && P.some(p => p.layer === 'soil'));
  // switch off: nothing drawn, Key drops it
  await page.click('#tgl-soil'); await page.waitForTimeout(300); P = await polys(page);
  ok('B8 off: nothing drawn, the Key and legend drop it', P.length === 0 && !(await page.evaluate(() => ME.keyState().drawn)).includes('soil'));
  await ctx.close();

  // place panel with the layer OFF: the table is read for the row only; the layer stays off; the cell is outlined
  ({ ctx, page, perr } = await open('index.html')); const reqs0 = tableReqs.length;
  try { await page.waitForFunction(() => window.ME && ME.openPlace && ME.globe, null, { timeout: 30000 }); } catch (_) { }
  await page.evaluate(() => ME.openPlace('38_39')); await waitPlace(page);
  rows = await panelRows(page); P = await polys(page);
  const order = rows.map(r => r[0]); const iF = order.findIndex(x => /^Forest disturbance/.test(x)), iS = order.indexOf('Organic-soil emissions (modelled) · whole containing 4° cell');
  ok('B9 place panel, layer off: the soil row right after forest; the table read once for it; the layer stays off; nothing is drawn on the globe (the place view stays read-only)', iS > 0 && iS === iF + 1 && tableReqs.length === reqs0 + 1 && await page.evaluate(() => document.getElementById('tgl-soil').getAttribute('aria-checked')) === 'false' && P.length === 0, { order, reqs: tableReqs.length - reqs0, P });
  const r38 = rowT(rows, /^Organic-soil emissions/);
  ok('B9 38_39: 2021–24 complete; the 2011–15 row inside the disclosure carries the incomplete-coverage footprint', /^modelled, not measured · 2021–2024 average · drained: 0 assigned by this model in this period; this does not establish zero real-world emissions · burned ≈ 44,000 t CO₂e per year · mapped organic soil ≈ 21,000 km² Totals/.test(r38) && !/^[^·]*·[^·]*·[^·]*·[^·]*· incomplete/.test(r38) && /2011–2015 · drained ≈ 1,800,000 t CO₂e per year · burned: 0 assigned by this model in this period; this does not establish zero real-world emissions · mapped organic soil ≈ 21,000 km² · incomplete model coverage: source raster cells covering about 10 km² within this 4° cell have missing estimates\. Values sum the available raster cells/.test(r38), r38);
  await page.keyboard.press('Escape'); await page.click('#tgl-soil'); await page.waitForFunction(() => document.getElementById('s-soil').textContent === 'on', null, { timeout: 10000 }).catch(() => { });
  await page.evaluate(() => ME.openPlace('22_70')); await waitPlace(page); P = await polys(page);
  ok('B9 place panel, layer on: the selected cell is outlined in white above the soil cells; closing removes it', P.some(p => p.layer === 'soil-sel' && p.id === '22_70' && p.alt > 0.006), P.filter(p => p.layer === 'soil-sel'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); P = await polys(page);
  ok('B9 …and the outline goes with the panel', !P.some(p => p.layer === 'soil-sel') && P.some(p => p.layer === 'soil'));
  await page.click('#tgl-soil'); await page.waitForTimeout(200);
  await page.evaluate(() => ME.openPlace('10_10')); await waitPlace(page); rows = await panelRows(page);
  ok('B10 a cell outside the fixture: unknown, not "no organic soil", and says it is the preview fixture', /^unknown — this cell is not in the preview's fixture/.test(rowT(rows, /^Organic-soil emissions/)) && /preview fixture/.test(rowT(rows, /^Organic-soil emissions/)), rowT(rows, /^Organic-soil emissions/));
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page); rows = await panelRows(page);
  ok('B11 Cape Town 14_49 (in the fixture, no record): no organic soil mapped', rowT(rows, /^Organic-soil emissions/) === 'no organic soil mapped in this cell by this model', rowT(rows, /^Organic-soil emissions/));
  placeDown = true; await page.evaluate(() => ME.openPlace('22_70')); await waitPlace(page); rows = await panelRows(page); placeDown = false;
  ok('B12 hub unreadable for the place: the page-owned soil row is still shown beside the unknown hub row', /^Unknown$/.test(rows[0] && rows[0][0]) && /drained ≈ 310,000,000/.test(rowT(rows, /^Organic-soil emissions/)), rows.map(r => r[0]));
  ok('B13 no page errors on World View', perr.length === 0, perr);
  await ctx.close();

  // a tampered table: unavailable everywhere, nothing drawn, never zero
  tamper = RAW.toString().replace('"organic_km2":', '"organic_km2" :');
  ({ ctx, page, perr } = await open('index.html'));
  try { await page.waitForFunction(() => window.ME && ME.openPlace && ME.globe, null, { timeout: 30000 }); } catch (_) { }
  await page.click('#tgl-soil'); await page.waitForFunction(() => document.getElementById('s-soil').textContent !== 'loading', null, { timeout: 10000 }).catch(() => { });
  P = await polys(page); const tam = await page.evaluate(() => ({ s: document.getElementById('s-soil').textContent, o: document.getElementById('o-soil').textContent }));
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page); rows = await panelRows(page);
  ok('B14 tampered table: card unknown with the reason, nothing drawn, the row unknown (never "no organic soil", never 0)', tam.s === 'unknown' && /not the pinned version/.test(tam.o) && P.filter(p => p.layer === 'soil').length === 0 && /^unknown — the soil table is not available/.test(rowT(rows, /^Organic-soil emissions/)), { tam, row: rowT(rows, /^Organic-soil emissions/) });
  tamper = null; await ctx.close();

  // synthetic tables (test-only: the suite serves them and sets the page's pin to their hash; nothing in soil.js changes)
  const synth = mutate => { const t = JSON.parse(RAW); mutate(t); return JSON.stringify(t); };
  const sha = txt => require('crypto').createHash('sha256').update(Buffer.from(txt)).digest('hex');
  const openSynth = async txt => { tamper = txt; const o = await open('index.html'); try { await o.page.waitForFunction(() => window.ME && ME.soil && ME.globe, null, { timeout: 30000 }); } catch (_) { }
    await o.page.evaluate(h => { ME.soil.SHA256 = h; }, sha(txt)); await o.page.click('#tgl-soil');
    await o.page.waitForFunction(() => document.getElementById('s-soil').textContent !== 'loading', null, { timeout: 10000 }).catch(() => { }); return o; };
  const NONE = { coverage: 'none', incomplete_source_footprint_km2: 169000, drained: { Mg: null, state: 'unknown' }, burned: { Mg: null, state: 'unknown' } };
  // (1) partial zero and partial value: 38_39's 2011–15 record placed in 2021–24 (SYNTHETIC: 38_39 is complete in 2021–24 in v1.0.1)
  ({ ctx, page, perr } = await openSynth(synth(t => { t.cells['38_39'].periods['2021_2024'] = t.cells['38_39'].periods['2011_2015']; })));
  P = await polys(page); let c38 = P.find(p => p.layer === 'soil' && p.id === '38_39');
  ok('B19 synthetic partial value (drained): the class fill with the violet incomplete outline', !!c38 && c38.fill === 'rgba(232,189,109,0.88)' && c38.stroke === 'rgba(186,140,255,1)', c38);
  await page.click('#soil-comp button[data-comp="burned"]'); await page.waitForTimeout(300); P = await polys(page); c38 = P.find(p => p.layer === 'soil' && p.id === '38_39');
  const zc = P.find(p => p.layer === 'soil' && p.id === '13_27');
  ok('B19 synthetic partial zero (burned): hollow with the violet incomplete outline, unlike a complete zero (hollow, ochre outline) (GPT preview review H1)', !!c38 && c38.fill === 'rgba(0,0,0,0)' && c38.stroke === 'rgba(186,140,255,1)' && !!zc && zc.fill === 'rgba(0,0,0,0)' && zc.stroke === 'rgba(212,152,56,1)', { c38, zc });
  await ctx.close();
  // (2) unknown-only: one record, coverage none in 2021–24 → outlined as unknown, NOT counted by the Key
  ({ ctx, page, perr } = await openSynth(synth(t => { const r = t.cells['22_70']; r.periods['2021_2024'] = NONE; t.cells = { '22_70': r }; })));
  P = await polys(page); let ks = await page.evaluate(() => ({ key: ME.keyState().drawn, o: document.getElementById('o-soil').textContent, leg: ME.legendState().line }));
  ok('B20 unknown-only: one red unknown outline drawn, the Key and legend do not count the layer, the card says so (GPT preview review H2)', P.filter(p => p.layer === 'soil').length === 1 && P[0].stroke === 'rgba(255,90,60,.95)' && !ks.key.includes('soil') && !/Organic-soil emissions \(modelled/.test(ks.leg) && /0 cells drawn and 1 outlined as unknown/.test(ks.o), { P, ks });
  await ctx.close();
  // (3) mixed known and unknown: the Key counts the layer once
  ({ ctx, page, perr } = await openSynth(synth(t => { t.cells['22_70'].periods['2021_2024'] = NONE; })));
  ks = await page.evaluate(() => ({ key: ME.keyState().drawn, o: document.getElementById('o-soil').textContent }));
  ok('B21 mixed known and unknown: the Key counts the layer once; the card names both counts', ks.key.filter(k => k === 'soil').length === 1 && /cells drawn and 1 outlined as unknown/.test(ks.o), ks);
  await ctx.close(); tamper = null;
  // inspector readability (GPT preview review H3): stacked rows, the figures get the panel's width
  ({ ctx, page, perr } = await open('index.html'));
  try { await page.waitForFunction(() => window.ME && ME.globe, null, { timeout: 30000 }); } catch (_) { }
  await page.click('#tgl-soil'); await page.waitForFunction(() => document.getElementById('s-soil').textContent === 'on', null, { timeout: 10000 }).catch(() => { });
  const widths = async id => { await page.evaluate(i => ME.openCell('soil', i), id); await page.waitForTimeout(250); await page.evaluate(() => { const d = document.querySelector('#insp-dl details.soilper'); if (d) d.open = true; });
    return page.evaluate(() => { const ins = document.getElementById('insp').getBoundingClientRect().width, dds = [...document.querySelectorAll('#insp-dl dd')]; const m = dds.find((d, i) => document.querySelectorAll('#insp-dl dt')[i].textContent === 'Modelled values');
      return { cls: document.getElementById('insp').className, ins: Math.round(ins), dd: m ? Math.round(m.getBoundingClientRect().width) : 0, h: document.getElementById('insp-h').textContent }; }); };
  const wPos = await widths('22_70'), wZero = await widths('13_27');
  ok('B22 soil inspector rows are stacked: the values column uses at least 85% of the panel (positive and zero cells, periods open); the heading keeps "modelled"', /soilview/.test(wPos.cls) && wPos.dd >= 0.85 * (wPos.ins - 32) && wZero.dd >= 0.85 * (wZero.ins - 32) && /^Organic-soil emissions \(modelled\) · cell 22_70$/.test(wPos.h), { wPos, wZero });
  await page.keyboard.press('Escape'); await page.evaluate(() => ME.openPlace('22_70')); await waitPlace(page);
  ok('B22 …and only the soil inspector: the place view does not carry the soil class', !/soilview/.test(await page.evaluate(() => document.getElementById('insp').className)));
  await ctx.close();
  ({ ctx, page, perr } = await open('index.html', { width: 360, height: 780 }));
  try { await page.waitForFunction(() => window.ME && ME.globe, null, { timeout: 30000 }); } catch (_) { }
  await page.evaluate(() => document.getElementById('tgl-soil').click()); await page.waitForFunction(() => document.getElementById('s-soil').textContent === 'on', null, { timeout: 10000 }).catch(() => { });
  const wPhone = await widths('22_70');
  ok('B23 360 px: the soil inspector is stacked and its values use the panel width', /soilview/.test(wPhone.cls) && wPhone.dd >= 0.85 * (wPhone.ins - 32), wPhone);
  await ctx.close();

  // phone width: no horizontal overflow with the layer on and the key open
  ({ ctx, page, perr } = await open('index.html', { width: 360, height: 780 }));
  try { await page.waitForFunction(() => window.ME && ME.globe, null, { timeout: 30000 }); } catch (_) { }
  await page.evaluate(() => document.getElementById('tgl-soil').click()); await page.waitForFunction(() => document.getElementById('s-soil').textContent === 'on', null, { timeout: 10000 }).catch(() => { });
  await page.evaluate(() => { const d = document.getElementById('soil-scope'); if (d) d.open = true; });
  const over = await page.evaluate(() => [...document.querySelectorAll('#card-soil, #card-soil *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.id || e.className || e.tagName).slice(0, 5));
  ok('B15 360 px: nothing in the soil card overflows the viewport', over.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), over);
  await ctx.close();

  // Sources
  ({ ctx, page, perr } = await open('sources.html'));
  const src = await page.evaluate(() => { const h = document.getElementById('soil'); let t = ''; for (let e = h && h.nextElementSibling; e && e.tagName !== 'H2'; e = e.nextElementSibling) t += e.textContent + '\n'; return { h: h && h.textContent, t, toc: [...document.querySelectorAll('nav.toc a')].filter(a => a.getAttribute('href') === '#soil').length }; });
  ok('B16 Sources: one section and one shortcut; citation, DOI, licence, modelled, whole-cell, separate components, our changes, the table difference, zero and missing, limits, the scenario bounds, version check, the preview fixture', src.toc === 1 && /modelled, optional layer; preview/.test(src.h || '') && ['10.5281/zenodo.22137130', 'CC BY 4.0', 'Modelled, not measured', 'whole 4° cell', 'never added together', 'not the publishers\' own figures', 'about 0.07% higher for drainage', 'not proof of no emission', 'incomplete model coverage', '1.50–3.97', '0.7–4.5', 'not probabilistic intervals', 'last checked 25 Nov 2026', 'fixture'].every(x => src.t.includes(x)), { h: src.h, toc: src.toc, missing: ['10.5281/zenodo.22137130', 'CC BY 4.0', 'Modelled, not measured', 'whole 4° cell', 'never added together', 'not the publishers\' own figures', 'about 0.07% higher for drainage', 'not proof of no emission', 'incomplete model coverage', '1.50–3.97', '0.7–4.5', 'not probabilistic intervals', 'last checked 25 Nov 2026', 'fixture'].filter(x => !src.t.includes(x)) });
  ok('B17 Sources: no page errors', perr.length === 0, perr);
  await ctx.close();
  ok('B18 isolation: nothing left the suite except answered fixtures (no Zenodo, no WRI)', !aborted.some(a => /zenodo|wri\.org|frontiersin/.test(a)), aborted);
  console.log(`isolation: ${aborted.length} other requests aborted (${[...new Set(aborted.map(a => a.split('/')[0]))].join(', ') || 'none'})`);
  await browser.close(); server.close();
}

(async () => {
  try { await A(); } catch (e) { ok('A! part A ran', false, String(e && e.stack || e).slice(0, 500)); }
  try { await B(); } catch (e) { ok('B! part B ran', false, String(e && e.stack || e).slice(0, 500)); }
  clearTimeout(wd);
  console.log(`\nsoil-ui${OLD ? ' (OLD=1: main\'s files)' : ''}${BREAK ? ` (BREAK=${BREAK})` : ''}: ${pass} passed, ${fail} failed${failed.length ? ' — ' + [...new Set(failed)].join(' ') : ''}`);
  process.exit(fail ? 1 : 0);
})();
