/* Mother Earth — Ocean Heat preview (OCEAN-HEAT-PROPOSAL rev 4.2 §8). Real globe.gl 2.45.0 (SwiftShader), hub routed to
 * fixtures, GIBS = a uniform dark-ocean PNG. Runs against the REAL snapshot (data/ocean-heat/oh-2026-11-09-R1) and a
 * synthetic SEAM fixture (phase1/ocean-heat/build_fixture.py; the harness pins its manifest in the served oceanheat.js).
 * Expected tap values come from phase1/ocean-heat/expected-taps.json (exact integer sums from NOAA's native files, Mac
 * packet C4d) — never from the page. Rounding rule reimplemented here from the manifest's documented rule.
 * Release rev 3 (OCEAN-HEAT-RELEASE-PROPOSAL rev 2): the snapshot is served by the hub, so the four files come from an EXPLICIT
 *      local folder (OH_SNAPSHOT_DIR), hash-checked against the Worker pins at setup, and are answered at the hub path
 *      /catalogue/oceanheat/<rev>/<file> with the Worker's headers. The release branch carries no data/ocean-heat/ (asserted).
 *      Section G: the page's pinned fetches carry no forced revalidation; a hub 503 says unavailable; and, in a context with
 *      NO request routing, the real Worker (in node, mock R2) is cached by Chromium for its 24 h lifetime.
 * Run: OH_SNAPSHOT_DIR=/path/to/oh-2026-11-09-R1 NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node phase1/oceanheat-ui.test.cjs
 *      (8899 server in the repo; /home/claude/spike with globe.gl@2.45.0 + pngjs; python3 + numpy for the fixture)
 * Code breaks (each must make this suite fail): BREAK=no-wrap|linear|nearest-water|paint-noncontrib|p2-any-water|
 *      tile-shift|no-hash|no-gen|same-unavailable-text|round-lookup|phone-p1|small-limit|p2-tile-x0|no-cache-kept
 * Rev 2 (11 Nov, GPT's preview review): phone-sized viewports default to P2; texture limits handled explicitly
 *      (P1 1 or 2 tiles, P2 1 or 2 tiles, below 1800 px unavailable); lighter no-data checker. Sections F (limits) and
 *      C [P2 ×2] added; A5 and E updated.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const ROOT = path.join(__dirname, '..'), BREAK = process.env.BREAK || '';
const EXP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ocean-heat/expected-taps.json'), 'utf8'));
const SNAP = process.env.OH_SNAPSHOT_DIR;
if (!SNAP || !fs.existsSync(SNAP)) { console.log('FAIL  setup: OH_SNAPSHOT_DIR unset or missing: ' + SNAP); process.exit(1); }
const OH_REV = 'oh-2026-11-09-R1', OH_PATH = `/catalogue/oceanheat/${OH_REV}/`, OH_NAMES = ['manifest.json', 'mask.bin.z', 'v025.bin.z', 'v050.bin.z'];
const sha256 = b => require('crypto').createHash('sha256').update(b).digest('hex');
let OH_PINS = null, WORKER = null;   // filled at setup from the REAL worker.js (copied to .mjs and imported)
const FIXDIR = '/tmp/claude-0/-home-claude/32477202-b637-51bb-86c4-956cd7b98c69/scratchpad/oh-test-fixtures';
const fixture = (name, args = []) => { const d = path.join(FIXDIR, name); return { dir: d, sha: execFileSync('python3', [path.join(__dirname, 'ocean-heat/build_fixture.py'), d, ...args]).toString().trim() }; };
const SEAM = fixture('seam'), BADDATE = fixture('baddate', ['--date', '2026-11-08']), BADGRID = fixture('badgrid', ['--rows-v050', '359']);
const ocean = new PNG({ width: 64, height: 32 }); for (let i = 0; i < ocean.data.length; i += 4) { ocean.data[i] = 16; ocean.data[i + 1] = 35; ocean.data[i + 2] = 58; ocean.data[i + 3] = 255; }
const OCEAN_PNG = PNG.sync.write(ocean);
const RUN = new Date(Date.now() - 60e3).toISOString();
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 20 min — failure, not a hang'); process.exit(1); }, 20 * 60e3);

// ---------- expected text, computed here (rule: nearest hundredth of the exact integer mean, ties away from zero; then one decimal, ties away)
const rha = (num, den) => Math.sign(num) * Math.floor((2 * Math.abs(num) + den) / (2 * den));
function expectText(e, res) {
  const b = e[String(res)];
  if (e.native_code === 'land') return ['Land — no sea temperature'];
  if (e.native_code === 'ice') return ['Sea ice — no temperature difference shown'];
  if (e.native_code === 'no-normal') return ['No 1991–2020 normal for this location and day of year'];
  const a100 = rha(b.sum_anom, b.n), s100 = rha(b.sum_sst, b.n), at = rha(a100, 10), stt = rha(s100, 10);
  const one = t => (t < 0 ? '−' : '') + (Math.abs(t) / 10).toFixed(1);
  const diff = at === 0 ? '0.0 °C, about the same as usual' : `${at > 0 ? '+' : '−'}${(Math.abs(at) / 10).toFixed(1)} °C ${at > 0 ? 'warmer' : 'cooler'} than usual`;
  const others = b.N - b.n;
  const cells = `${b.n} of ${b.N} source cells contributed to this average${others && b.land === others ? ` (the other ${others} are land)` : others ? ` (${others} others` : ''}`;
  return [`${one(stt)} °C`, diff, cells, `${res}° square`];
}

// ---------- served-source breaks
function breakJs(src) {
  const b = (from, to) => { if (!src.includes(from)) { console.log('BREAK pattern not found: ' + from.slice(0, 80)); process.exit(2); } src = src.split(from).join(to); };
  switch (BREAK) {
    case 'no-wrap': b('col: Math.floor(wrapLng(lng) / res) % cols', 'col: Math.floor((lng + 180) / res)'); break;
    case 'linear': b('const NEAREST = 1003;', 'const NEAREST = 1006;'); break;
    case 'nearest-water': b("if (code === 1) return [head, ['Here', 'Land — no sea temperature'], credit];", "if (code === 1) return rowsAt(lat - 0.3, lng - 0.3);"); break;
    case 'paint-noncontrib': b('u32[r * W + x] = code === 0 ? bc[', 'u32[r * W + x] = (code === 0 || bc[br * V.cols + ((c / k) | 0)]) ? bc['); break;
    case 'p2-any-water': b('if (a === 0 && b === 0 && d === 0 && e === 0) v =', 'if (a === 0 || b === 0 || d === 0 || e === 0) v ='); break;
    case 'tile-shift': b('const cv = paintTile(t * W, W, H,', 'const cv = paintTile(t * W + (t ? 1 : 0), W, H,'); break;
    case 'no-hash': b('if (got !== wantSha) throw', 'if (false) throw'); break;
    case 'no-gen': b("if (why === 'superseded' || gen !== st.gen || !st.on) return;", "if (why === 'superseded') return;"); b("if (gen !== st.gen) return 'superseded';", ''); break;
    case 'same-unavailable-text': b("if (code === 2) return [head, ['Here', 'No 1991–2020 normal for this location and day of year'], method, credit];", "if (code === 2) return [head, ['Here', 'Sea ice — no temperature difference shown'], method, credit];"); break;
    case 'phone-p1': b('const p1 = o.forcePath ? o.forcePath === \'P1\' : (p1ok && !st.phone);', 'const p1 = o.forcePath ? o.forcePath === \'P1\' : p1ok;'); break;
    case 'small-limit': b('if (mt < MIN_TEX) throw', 'if (false) throw'); break;
    case 'p2-tile-x0': b('const r = 2 * tr, c = 2 * (x0 + tc),', 'const r = 2 * tr, c = 2 * tc,'); break;
    case 'no-cache-kept': b('const r = await fetch(OH.BASE + name);', "const r = await fetch(OH.BASE + name, { cache: 'no-cache' });"); break;
    case 'round-lookup': b('row: Math.max(0, Math.min(Math.floor((90 - lat) / res), rows - 1)),', 'row: Math.max(0, Math.min(Math.round((90 - lat) / res), rows - 1)),'); break;
  }
  return src;
}

(async () => {
  // ---------- setup: the explicit local folder, hash-checked against the REAL Worker pins; no copy in the branch
  { const os = require('os'), { pathToFileURL } = require('url'); const d = fs.mkdtempSync(path.join(os.tmpdir(), 'oh-ui-'));
    fs.writeFileSync(path.join(d, 'worker.mjs'), fs.readFileSync(path.join(ROOT, 'phase1/worker.js'), 'utf8'));
    WORKER = await import(pathToFileURL(path.join(d, 'worker.mjs')).href); OH_PINS = WORKER.OCEANHEAT_REVISIONS[OH_REV].files; }
  for (const n of OH_NAMES) { const p = path.join(SNAP, n); const b = fs.existsSync(p) ? fs.readFileSync(p) : null;
    if (!b || b.length !== OH_PINS[n].bytes || sha256(b) !== OH_PINS[n].sha256) { console.log(`FAIL  setup: ${n} in OH_SNAPSHOT_DIR does not match the Worker pin`); process.exit(1); } }
  ok('S setup: the four files in OH_SNAPSHOT_DIR match the Worker pins (length + sha256)', true);
  ok('S setup: the release branch carries no data/ocean-heat/ copy', !fs.existsSync(path.join(ROOT, 'data', 'ocean-heat')));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  // mode: { snap: dir, pin: sha | null, tamper: 'mask' | null }
  const run = async (viewport, mode = {}) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = [];
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: OCEAN_PNG }));
    await ctx.route(BASE + '/**', route => {
      const p = new URL(route.request().url()).pathname;
      if (p === '/oceanheat.js') {
        let src = fs.readFileSync(path.join(ROOT, 'oceanheat.js'), 'utf8');
        if (mode.pin) src = src.replace(/MANIFEST_SHA256: '[0-9a-f]{64}'/, `MANIFEST_SHA256: '${mode.pin}'`);
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: breakJs(src) });
      }
      route.continue();
    });
    await ctx.route(HUB + '/**', route => {
      const p = new URL(route.request().url()).pathname;
      if (p.startsWith('/catalogue/oceanheat/')) {   // the hub route, answered with the Worker's headers from the local folder
        hits.push(p); const nm = p.split('/').pop(), dir = mode.snap || SNAP;
        if (mode.hub503 === nm) return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ kind: 'catalogue', catalogue: 'oceanheat', status: 'unavailable', reason: 'integrity' }) });
        let body = fs.readFileSync(path.join(dir, nm));
        if (mode.tamper === nm) { body = Buffer.from(body); body[body.length - 1] ^= 0xff; }
        return route.fulfill({ status: 200, contentType: nm.endsWith('.json') ? 'application/json' : 'application/octet-stream', headers: { 'Cache-Control': 'public, max-age=86400, immutable', 'Access-Control-Allow-Origin': '*', 'ETag': '"' + sha256(body) + '"' }, body });
      }
      const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['q1', -34.9, 18.9, 10, 3.1, 'mb', RUN, 't', '']] }
        : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { [cellOf(-34.4125, 18.4125)]: { count: 1, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
        : p.startsWith('/snapshot/orbital') || p.startsWith('/elements') || p.startsWith('/place') ? null
        : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
      if (!body) return route.fulfill({ status: 404, body: '{}' });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.oceanHeat && ME.globe && ME.globe() && ME.renderState && ME.renderState(), null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    return { ctx, page, hits, perr };
  };
  const enable = async (page, opts) => {
    await page.evaluate(o => { if (o) ME.oceanHeat.options(o); }, opts || null);
    await page.click('#tgl-oh');
    await page.waitForFunction(() => /ready|unavailable/.test(ME.oceanHeat.state().status) || (!ME.oceanHeat.state().on && ME.oceanHeat.state().why), null, { timeout: 120000 });
    return page.evaluate(() => ME.oceanHeat.state());
  };
  const rowsText = (page, lat, lng) => page.evaluate(([a, b]) => { const r = ME.oceanHeat.rowsAt(a, b); return r ? r.map(x => x[1]).join(' | ') : null; }, [lat, lng]);
  const texPx = (page, x, y, tile = 0) => page.evaluate(([x, y, t]) => { const m = ME.oceanHeat.meshes()[t]; const cv = m.material.map.image; return [...cv.getContext('2d').getImageData(x, y, 1, 1).data]; }, [x, y, tile]);
  async function rendered(page, pts, view) {   // sample the RENDERED canvas at projected points (3×3 mean)
    await page.evaluate(v => { const g = ME.globe(); g.controls().autoRotate = false; g.pointOfView(v, 0); }, view);
    await page.waitForTimeout(1200);
    const at = await page.evaluate(ps => { const el = document.getElementById('globe').getBoundingClientRect(); return ps.map(([a, b]) => { const s = ME.screenAt(a, b, 0); return { x: Math.round(s.x), y: Math.round(s.y), w: el.width, h: el.height }; }); }, pts);
    const shot = PNG.sync.read(await page.locator('#globe').screenshot());
    return at.map(({ x, y }) => { let r = 0, g = 0, b = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((y + dy) * shot.width + (x + dx)) * 4; r += shot.data[i]; g += shot.data[i + 1]; b += shot.data[i + 2]; } return [r / 9, g / 9, b / 9].map(Math.round); });
  }
  const isBlue = c => c[2] > 100 && c[2] > c[0] + 50, isOrange = c => c[0] > 140 && c[0] > c[2] + 70, isPale = c => Math.min(...c) > 150 && Math.abs(c[0] - c[2]) < 45;

  // ================= A. real snapshot, default path
  let { ctx, page, hits, perr } = await run({ width: 1280, height: 860 });
  let s = await page.evaluate(() => ME.oceanHeat.state());
  ok('A1 off on load: status off, no meshes, legend and key hidden', s.status === 'off' && s.meshes === 0 && await page.evaluate(() => document.getElementById('oh-legend').hidden && document.getElementById('oh-key').hidden), s);
  ok('A1 off on load: ZERO snapshot requests', hits.length === 0, hits);
  const keyN0 = await page.evaluate(() => document.getElementById('key-n').textContent);
  s = await enable(page);
  ok('A2 enable → ready', s.status === 'ready', s);
  const want = s.path === 'P1' ? ['manifest.json', 'mask.bin.z', 'v025.bin.z'] : ['manifest.json', 'mask.bin.z', 'v050.bin.z'];
  ok(`A2 requests are exactly the manifest, the mask and one value file (${s.path}, ${s.valueRes}°)`, JSON.stringify(hits.map(h => h.split('/').pop()).sort()) === JSON.stringify(want.slice().sort()), hits);
  ok('A2 every snapshot request goes to the hub route ' + OH_PATH, hits.length === 3 && hits.every(h => h.startsWith(OH_PATH)), hits);
  ok('A2 path rule (desktop 1280 px, not phone-sized): P1 with 0.25° when MAX_TEXTURE_SIZE ≥ 3600 (1 texture at ≥ 7200, else 2 tiles)', s.phone === false && (s.maxTex >= 3600 ? (s.path === 'P1' && s.valueRes === 0.25 && s.tiles === (s.maxTex >= 7200 ? 1 : 2)) : s.path === 'P2'), s);
  ok('A2 legend and card key shown; date line names the source and the UTC day', await page.evaluate(() => !document.getElementById('oh-legend').hidden && /Dated snapshot · NOAA Coral Reef Watch · 9 Nov 2026 \(UTC day\)/.test(document.getElementById('oh-status').innerText) && /1991–2020 normal/.test(document.getElementById('oh-key').innerText)));
  ok('A2 Key counts ocean heat as one layer', await page.evaluate(k => document.getElementById('key-n').textContent !== k, keyN0));
  ok('A2 texture filtering is NEAREST on every mesh, no mipmaps', await page.evaluate(() => ME.oceanHeat.meshes().every(m => m.material.map.magFilter === 1003 && m.material.map.minFilter === 1003 && m.material.map.generateMipmaps === false)));
  ok('A2 overlay is never a pick target', await page.evaluate(() => ME.oceanHeat.meshes().every(m => { const hits = []; m.raycast({}, hits); return hits.length === 0; })));
  console.log(`      measured (headless SwiftShader, not a real GPU): ${JSON.stringify({ path: s.path, valueRes: s.valueRes, tiles: s.tiles, maxTex: s.maxTex, texture: s.texture, bytes: s.bytes, timings: s.timings })}`);

  // taps: every table point (rowsAt is the same function the inspector uses)
  for (const [nm, e] of Object.entries(EXP)) { if (nm.startsWith('_')) continue;
    const got = await rowsText(page, e.point[0], e.point[1]), w = expectText(e, s.valueRes);
    ok(`A3 tap ${nm} (${e.point}) at ${s.valueRes}°: ${w.join(' / ')}`, got && w.every(x => got.includes(x)), got); }
  // edges: deliberate lookup tests
  const seamW = await rowsText(page, -17.125, -179.9125);
  ok('A4 exactly +180° and exactly −180° both resolve to column 0 (Seam W\'s square)', (await rowsText(page, -17.125, 180)) === seamW && (await rowsText(page, -17.125, -180)) === seamW, { seamW });
  ok('A4 (0, −140) on an edge → the block south and east = Open Pacific\'s', (await rowsText(page, 0, -140)) === (await rowsText(page, -0.125, -139.875)));
  ok('A4 (50, −6) → Off Cornwall\'s square; (43, −69) → Gulf of Maine\'s', (await rowsText(page, 50, -6)) === (await rowsText(page, 49.875, -5.875)) && (await rowsText(page, 43, -69)) === (await rowsText(page, 42.875, -68.875)));
  ok('A4 lookup function: lat −90 → last row (clamped); lng 540 wraps to col 0', await page.evaluate(() => { const c = ME.ohLookup.cellAt(-90, 540, 0.05, 3600, 7200); return c.row === 3599 && c.col === 0; }));
  ok('A4 exact square indices: +180° and −180° → the same row and column 0 at every grid; ±179.9125° → their written-out columns',
    await page.evaluate(() => [[0.05, 3600, 7200], [0.25, 720, 1440], [0.5, 360, 720]].every(([res, R, C]) => { const p = ME.ohLookup.cellAt(-17.125, 180, res, R, C), m = ME.ohLookup.cellAt(-17.125, -180, res, R, C), e = ME.ohLookup.cellAt(-17.125, 179.9125, res, R, C), w = ME.ohLookup.cellAt(-17.125, -179.9125, res, R, C);
      // expected columns written out per grid: −179.9125 → floor(0.0875/res); +179.9125 → floor(359.9125/res)
      const wc = { 0.05: 1, 0.25: 0, 0.5: 0 }[res], ec = { 0.05: 7198, 0.25: 1439, 0.5: 719 }[res];
      return p.col === 0 && m.col === 0 && p.row === m.row && p.row === w.row && w.col === wc && e.col === ec && e.row === w.row; })));
  ok('A4 sea ice and no-normal read differently', (await rowsText(page, -70.125, -39.875)) !== (await rowsText(page, 71.575, -58.175)));
  // texture level (P1 native texels): land inside a contributing block is clear; ice is the no-data fill
  if (s.path === 'P1' && s.tiles === 1) {
    const land = await texPx(page, 3968, 2480), ice = await texPx(page, Math.floor((180 - 39.875) / 0.05), Math.floor((90 + 70.125) / 0.05));
    ok('A5 texel: Cape Peninsula land (row 2480, col 3968) is transparent even inside a contributing square', land[3] === 0, land);
    ok('A5 texel: Weddell Sea ice is the no-data checker [128,140,160] / [100,112,130] at alpha 220, never a class colour', ice[3] === 220 && (JSON.stringify(ice.slice(0, 3)) === '[128,140,160]' || JSON.stringify(ice.slice(0, 3)) === '[100,112,130]'), ice);
  }
  // rendered no-data: Weddell Sea (daylit in November) reads dark, not near-normal pale
  { const [c] = await rendered(page, [[-70.125, -39.875]], { lat: -70, lng: -40, altitude: 0.6 });
    ok('A5 rendered: Weddell Sea ice shows the slate no-data fill (blue-tinged grey, lighter than the dark ocean, not near-normal pale)', c[2] > c[0] + 10 && c[2] > 90 && Math.max(...c) < 200 && !isPale(c), c); }
  // real taps through the page's own handlers
  await page.evaluate(() => ME.globe().pointOfView({ lat: 49.9, lng: -5.9, altitude: 0.25 }, 0)); await page.waitForTimeout(1000);
  { const p = await page.evaluate(() => ME.screenAt(49.875, -5.875, 0)), el = await page.locator('#globe').boundingBox();
    await page.mouse.click(el.x + p.x, el.y + p.y); await page.waitForTimeout(1200);
    const t = await page.evaluate(() => document.getElementById('insp').classList.contains('show') ? document.getElementById('insp-dl').innerText : null);
    const w = expectText(EXP['Off Cornwall'], s.valueRes);
    ok('A6 real globe tap off Cornwall: the inspector shows Ocean heat here with the expected values', t && /Ocean heat here/.test(t) && w.slice(0, 2).every(x => t.includes(x)), t && t.slice(0, 600));
    await page.keyboard.press('Escape'); }
  await page.evaluate(() => ME.globe().pointOfView({ lat: -34.4, lng: 18.4, altitude: 0.25 }, 0)); await page.waitForTimeout(1200);
  { const p = await page.evaluate(() => ME.screenAt(-34.4125, 18.4125, 0.006)), el = await page.locator('#globe').boundingBox();
    await page.mouse.click(el.x + p.x, el.y + p.y); await page.waitForTimeout(1200);
    const t = await page.evaluate(() => document.getElementById('insp').classList.contains('show') ? { h: document.getElementById('insp-h').textContent, dl: document.getElementById('insp-dl').innerText } : null);
    const w = expectText(EXP['Atlantic off Cape Point'], s.valueRes);
    ok('A6 real polygon tap (earthquake coverage cell) carries the tap coordinates (globe.gl 2.45.0): cell view + Ocean heat here', t && /cell/i.test(t.h) && /Ocean heat here/.test(t.dl) && w.slice(0, 2).every(x => t.dl.includes(x)), t);
    await page.keyboard.press('Escape'); }
  // off, and the switch-off race
  await page.click('#tgl-oh'); await page.waitForTimeout(400); s = await page.evaluate(() => ME.oceanHeat.state());
  ok('A7 off: no meshes left in the scene, legend and key hidden', s.meshes === 0 && await page.evaluate(() => { let n = 0; ME.globe().scene().traverse(o => { if (o.__oceanHeat) n++; }); return n === 0 && document.getElementById('oh-legend').hidden && document.getElementById('oh-key').hidden; }), s);
  await page.evaluate(() => { ME.oceanHeat.setOn(true); ME.oceanHeat.setOn(false); }); await page.waitForTimeout(6000);
  s = await page.evaluate(() => ME.oceanHeat.state());
  ok('A7 switched off while loading: the late load never draws', s.status === 'off' && s.meshes === 0 && await page.evaluate(() => { let n = 0; ME.globe().scene().traverse(o => { if (o.__oceanHeat) n++; }); return n === 0; }), s);
  ok('A8 no page errors', perr.length === 0, perr);
  await ctx.close();

  // ================= B. real snapshot, P2 forced (0.5° values, 0.1° texels)
  ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }));
  s = await enable(page, { forcePath: 'P2' });
  ok('B1 P2 ready on 0.5° values; requests manifest + mask + v050 only', s.status === 'ready' && s.path === 'P2' && s.valueRes === 0.5 && JSON.stringify(hits.map(h => h.split('/').pop()).sort()) === JSON.stringify(['manifest.json', 'mask.bin.z', 'v050.bin.z']), { s, hits });
  for (const [nm, e] of Object.entries(EXP)) { if (nm.startsWith('_')) continue;
    const got = await rowsText(page, e.point[0], e.point[1]), w = expectText(e, 0.5);
    ok(`B2 tap ${nm} at 0.5°: ${w.join(' / ')}`, got && w.every(x => got.includes(x)), got); }
  { const mixed = await texPx(page, 1984, 1240), water = await texPx(page, 1980, 1244);
    ok('B3 P2 texel over Cape Peninsula coast (texel row 1240, col 1984) is the mixed style, not a class colour', mixed[3] === 140 && mixed[0] === 138, mixed);
    ok('B3 P2 all-water texel in the same 0.5° block carries the block colour (class of −0.08 °C = near normal)', water[3] === 230 && water[0] === 242, water); }
  ok('B4 no page errors', perr.length === 0, perr);
  await ctx.close();

  // ================= C. seam fixture — orientation on the RENDERED globe, P1 (1 and 2 tiles) and P2
  for (const opts of [{ forcePath: 'P1', forceTiles: 1 }, { forcePath: 'P1', forceTiles: 2 }, { forcePath: 'P2' }, { forcePath: 'P2', forceTiles: 2 }]) {
    const tag = `${opts.forcePath}${opts.forceTiles ? ' ×' + opts.forceTiles : ''}`;
    ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }, { snap: SEAM.dir, pin: SEAM.sha }));
    s = await enable(page, opts);
    ok(`C1 [${tag}] seam fixture ready`, s.status === 'ready' && s.path === opts.forcePath && (!opts.forceTiles || s.tiles === opts.forceTiles), s);
    let [w, e] = await rendered(page, [[0, -179.75], [0, 179.75]], { lat: 0, lng: 180, altitude: 0.35 });
    ok(`C2 [${tag}] rendered: blue just EAST of the line at −179.75°, orange just WEST at +179.75°`, isBlue(w) && isOrange(e), { at_m179_75: w, at_p179_75: e });
    const [jw, je] = await rendered(page, [[0, -0.25], [0, 0.25]], { lat: 0, lng: 0, altitude: 0.35 });
    ok(`C2 [${tag}] rendered: the 0° join — near-normal pale at −0.25°, orange at +0.25°`, isPale(jw) && isOrange(je), { jw, je });
    ok(`C3 [${tag}] taps either side of the seam: −179.75 → −2.5 cooler, +179.75 → +2.5 warmer, exactly ±180 → −2.5`,
      /−2\.5 °C cooler/.test(await rowsText(page, 0, -179.75)) && /\+2\.5 °C warmer/.test(await rowsText(page, 0, 179.75)) && /−2\.5 °C cooler/.test(await rowsText(page, 0, 180)) && /−2\.5 °C cooler/.test(await rowsText(page, 0, -180)));
    if (opts.forcePath === 'P2' && opts.forceTiles === 2) {
      // P2 tiles are 1800 texels wide; texel 1799 = native 3598–3599 (pale water), tile 1 texel 0 = native 3600–3601 (3601 is land → mixed), texel 1 = native 3602–3603 (orange)
      const t0last = await texPx(page, 1799, 900, 0), t1first = await texPx(page, 0, 900, 1), t1second = await texPx(page, 1, 900, 1);
      ok('C4 [P2 ×2] tile join: tile 0 last texel pale water, tile 1 texel 0 mixed (land at native col 3601), texel 1 orange water',
        t0last[0] === 242 && t0last[3] === 230 && t1first[0] === 138 && t1first[3] === 140 && t1second[0] === 217 && t1second[3] === 230, { t0last, t1first, t1second });
    }
    if (opts.forcePath === 'P1' && opts.forceTiles === 2) {
      const t0last = await texPx(page, 3599, 1800, 0), t1first = await texPx(page, 0, 1800, 1), t1second = await texPx(page, 1, 1800, 1);
      ok('C4 [P1 ×2] tile join: tile 0 last texel = col 3599 (near-normal pale), tile 1 texel 0 = col 3600 (orange water), texel 1 = col 3601 (land, clear)',
        t0last[0] === 242 && t0last[2] === 235 && t0last[3] === 230 && t1first[0] === 217 && t1first[2] === 1 && t1first[3] === 230 && t1second[3] === 0, { t0last, t1first, t1second });
    }
    // sensitivity: a correctly painted texture mounted backwards must FAIL the rendered check
    await page.evaluate(() => ME.oceanHeat.meshes().forEach(m => { m.scale.x *= -1; }));
    [w, e] = await rendered(page, [[0, -179.75], [0, 179.75]], { lat: 0, lng: 180, altitude: 0.35 });
    ok(`C5 [${tag}] a mirrored mesh is caught (the rendered check no longer passes)`, !(isBlue(w) && isOrange(e)), { w, e });
    await page.evaluate(() => ME.oceanHeat.meshes().forEach(m => { m.scale.x *= -1; m.rotation.y += Math.PI; }));
    [w, e] = await rendered(page, [[0, -179.75], [0, 179.75]], { lat: 0, lng: 180, altitude: 0.35 });
    ok(`C5 [${tag}] a π-rotated mesh is caught (the rendered check no longer passes)`, !(isBlue(w) && isOrange(e)), { w, e });
    ok(`C6 [${tag}] no page errors`, perr.length === 0, perr);
    await ctx.close();
  }

  // ================= D. rejected snapshots: nothing drawn, a reason shown
  for (const [tag, mode, why] of [['tampered mask bytes', { tamper: 'mask.bin.z' }, /mask\.bin\.z failed its check/],
    ['manifest not the pinned one', { snap: SEAM.dir }, /manifest\.json failed its check/],
    ['wrong data date (pinned)', { snap: BADDATE.dir, pin: BADDATE.sha }, /expected oh-2026-11-09-R1 \/ 2026-11-09/],
    ['wrong value grid (pinned, P2)', { snap: BADGRID.dir, pin: BADGRID.sha, p2: true }, /value grid does not match/]]) {
    ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }, mode));
    s = await enable(page, mode.p2 ? { forcePath: 'P2' } : null);
    const msg = await page.evaluate(() => document.getElementById('oh-status').innerText);
    ok(`D [${tag}] rejected: nothing drawn, toggle off, reason shown`, s.status === 'unavailable' && s.meshes === 0 && !s.on && why.test(msg), { s, msg });
    await ctx.close();
  }

  // ================= E. phone width
  ({ ctx, page, hits, perr } = await run({ width: 390, height: 844 }));
  { const t = await page.evaluate(() => { const b = document.getElementById('tgl-oh'); b.scrollIntoView(); const r = b.getBoundingClientRect(); return { h: r.height, w: r.width }; });
    s = await enable(page);
    ok('E phone 390 px: phone-sized → P2 by default (0.5° values, 3600 × 1800 texture, ~25 MiB), requests manifest + mask + v050 only',
      s.phone === true && s.path === 'P2' && s.valueRes === 0.5 && s.texture === '3600x1800' && JSON.stringify(hits.map(h => h.split('/').pop()).sort()) === JSON.stringify(['manifest.json', 'mask.bin.z', 'v050.bin.z']), { s, hits });
    { const e = EXP['Off Cornwall'], got = await rowsText(page, e.point[0], e.point[1]), w = expectText(e, 0.5);
      ok('E phone tap off Cornwall at 0.5°: ' + w.join(' / '), got && w.every(x => got.includes(x)), got); }
    const fit = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.getElementById('oh-key').getBoundingClientRect().right <= window.innerWidth + 1);
    ok('E phone 390 px: toggle ≥ 44 px tall, layer ready, key fits, no horizontal scroll', t.h >= 44 && s.status === 'ready' && fit, { t, s: s.status, fit });
    ok('E no page errors', perr.length === 0, perr); }
  await ctx.close();

  // ================= F. texture limits and the phone rule (real snapshot, desktop viewport, limits simulated through the test aid)
  ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }));
  const relay = async (opts) => { await page.evaluate(() => ME.oceanHeat.setOn(false)); hits.length = 0;
    await page.evaluate(o => ME.oceanHeat.options(Object.assign({ forcePath: null, forceTiles: null, forceMaxTex: null, forcePhone: null }, o)), opts);
    return enable(page); };
  const files = () => JSON.stringify(hits.map(h => h.split('/').pop()).sort());
  s = await relay({ forceMaxTex: 4096 });
  ok('F1 limit 4096 (desktop): P1 as 2 tiles of 3600 × 3600, 0.25° values', s.status === 'ready' && s.path === 'P1' && s.tiles === 2 && s.texture === '3600x3600' && s.valueRes === 0.25, s);
  { const e = EXP['Seam E (+179.9)'], got = await rowsText(page, e.point[0], e.point[1]); ok('F1 tap Seam E on the tiled P1', got && expectText(e, 0.25).every(x => got.includes(x)), got); }
  s = await relay({ forceMaxTex: 2048 });
  ok('F2 limit 2048 (desktop): P2 as 2 tiles of 1800 × 1800, 0.5° values, v050 fetched', s.status === 'ready' && s.path === 'P2' && s.tiles === 2 && s.texture === '1800x1800' && s.valueRes === 0.5 && /v050/.test(files()), { s, hits });
  { const mixed = await texPx(page, 1984 - 1800, 1240, 1), water = await texPx(page, 1980 - 1800, 1244, 1);
    ok('F2 P2 ×2: the Cape Peninsula coast texel (col 1984) sits in tile 1 at col 184 and is still the mixed style; its water neighbour is the block colour', mixed[3] === 140 && mixed[0] === 138 && water[3] === 230 && water[0] === 242, { mixed, water }); }
  s = await relay({ forceMaxTex: 3600 });
  ok('F3 limit 3600 exactly (desktop): P1 as 2 tiles', s.status === 'ready' && s.path === 'P1' && s.tiles === 2, s);
  s = await relay({ forceMaxTex: 1024 });
  const msg = await page.evaluate(() => document.getElementById('oh-status').innerText);
  ok('F4 limit 1024: unavailable with its own reason, nothing drawn, no mask or value file fetched', s.status === 'unavailable' && s.meshes === 0 && !s.on && /1024 px/.test(msg) && /1800 px/.test(msg) && files() === JSON.stringify(['manifest.json']), { s, msg, hits });
  s = await relay({ forceMaxTex: 1799 });
  ok('F4 limit 1799 (one below a P2 tile): unavailable', s.status === 'unavailable' && s.meshes === 0, s);
  s = await relay({ forceMaxTex: 1800 });
  ok('F5 limit 1800 exactly: P2 as 2 tiles', s.status === 'ready' && s.path === 'P2' && s.tiles === 2, s);
  s = await relay({ forcePhone: true });
  ok('F6 phone-sized on a large-limit renderer: P2, 1 texture of 3600 × 1800', s.status === 'ready' && s.phone === true && s.path === 'P2' && s.tiles === 1 && s.texture === '3600x1800', s);
  s = await relay({ forcePhone: true, forceMaxTex: 2048 });
  ok('F6 phone-sized with limit 2048: P2 as 2 tiles', s.status === 'ready' && s.path === 'P2' && s.tiles === 2, s);
  s = await relay({ forcePhone: false, forceMaxTex: 16384 });
  ok('F7 not phone-sized, limit 16384: P1, 1 texture of 7200 × 3600', s.status === 'ready' && s.path === 'P1' && s.tiles === 1 && s.texture === '7200x3600', s);
  ok('F8 no page errors', perr.length === 0, perr);
  await ctx.close();

  // ================= G. release: pinned fetches may be cached; a hub 503 draws nothing; the real Worker is cached by the browser
  ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }));
  await page.evaluate(() => { const f = window.fetch; window.__ohInits = []; window.fetch = function (u, init) { if (/\/catalogue\/oceanheat\//.test(String(u))) window.__ohInits.push(init === undefined ? null : JSON.parse(JSON.stringify(init))); return f.apply(this, arguments); }; });
  s = await enable(page);
  { const inits = await page.evaluate(() => window.__ohInits);
    ok('G1 the page\'s pinned fetches carry no cache override (no forced revalidation; the hub\'s 24 h lifetime applies)', s.status === 'ready' && inits.length === 3 && inits.every(x => x === null || x.cache === undefined || x.cache === 'default'), inits); }
  await ctx.close();
  ({ ctx, page, hits, perr } = await run({ width: 1280, height: 860 }, { hub503: 'v025.bin.z' }));
  s = await enable(page);
  { const msg = await page.evaluate(() => document.getElementById('oh-status').innerText);
    ok('G2 hub 503 for a value file: unavailable with its reason, nothing drawn, toggle off', s.status === 'unavailable' && s.meshes === 0 && !s.on && /v025\.bin\.z: HTTP 503/.test(msg) && /Nothing is drawn/.test(msg), { s, msg }); }
  await ctx.close();
  { // G3: no request routing in this context (Playwright routing disables the HTTP cache) — the REAL Worker behind a local server
    const http = require('http'); let served = 0;
    const objects = Object.fromEntries(OH_NAMES.map(n => [OH_PINS[n].key, fs.readFileSync(path.join(SNAP, n))]));
    const env = { R2: { get: async k => { const b = objects[k]; return b ? { arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) } : null; } }, DB: { prepare() { const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } } };
    const srv = http.createServer(async (req, res) => {
      if (req.url === '/t.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<!doctype html><title>t</title>'); }
      served++; const r = await WORKER.default.fetch(new Request('http://127.0.0.1' + req.url), env);
      const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
    });
    await new Promise(r => srv.listen(8897, '127.0.0.1', r));
    const c2 = await browser.newContext(); const p2 = await c2.newPage();
    await p2.goto('http://127.0.0.1:8897/t.html');
    const out = await p2.evaluate(async (base) => { const sha = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
      const one = async n => { const r = await fetch(base + n); return { s: r.status, cc: r.headers.get('Cache-Control'), ce: r.headers.get('Content-Encoding'), sha: await sha(await r.arrayBuffer()) }; };
      const a = await one('v025.bin.z'), b = await one('v025.bin.z');
      const bad = await fetch(base + 'nope.bin'); const c = { s: bad.status, cc: bad.headers.get('Cache-Control') };
      return { a, b, c }; }, '/catalogue/oceanheat/oh-2026-11-09-R1/');
    const servedAfterTwo = served - 1;   // minus the 404
    ok('G3 real Worker over HTTP: v025 200, immutable 24 h, no Content-Encoding, bytes = pin', out.a.s === 200 && out.a.cc === 'public, max-age=86400, immutable' && out.a.ce === null && out.a.sha === OH_PINS['v025.bin.z'].sha256, out);
    ok('G3 Chromium reuses the cached response: the second fetch never reaches the hub', out.b.s === 200 && out.b.sha === out.a.sha && servedAfterTwo === 1, { served, out });
    ok('G3 a 404 from the route is no-store', out.c.s === 404 && out.c.cc === 'no-store', out.c);
    await c2.close(); await new Promise(r => srv.close(r));
  }

  await browser.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed${BREAK ? `  (BREAK=${BREAK})` : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness error: ' + e.stack); process.exit(1); });
