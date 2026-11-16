/* Wind by height — page suite (GLOBAL-WIND-BUILD-PROPOSAL rev 2, §4 and §11; branch wind-rc).
 * The real page files are served by the suite's own static server; the hub is a fixture whose manifest and grids the tests
 * control (the shapes worker.js produces — see wind-hub.test.mjs). NOAA is never contacted by the page.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/wind-ui.test.cjs
 * BREAK=<name> weakens the served wind.js; each must fail:
 *   eager no-verify swap-early late-paint keep-forever wrong-from no-recover new-rev-on-switch refetch-cached refresh-when-off
 *   no-hatch calm-bearing pole-bearing smooth fetched-age no-modified-words tap-when-off silent-level-fail refresh-back bad-input-wiped */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const http = require('http'); const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'); const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 10 min'); process.exit(1); }, 10 * 60e3);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAKS = {
  'eager': [['  paint();\n})();', '  paint(); const iv = setInterval(() => { if (ME.globe && ME.globe()) { clearInterval(iv); setOn(true); } }, 50);\n})();']],
  'no-verify': [["    if (b.byteLength !== WD.BYTES || b.byteLength !== l.bytes || await hex(b) !== l.sha256) throw fileErr('the wind file did not match its fingerprint');", '']],
  'swap-early': [["    const gen = st.gen, seq = ++st.seq; st.want = levelId; st.loading = true; paint();", "    const gen = st.gen, seq = ++st.seq; st.want = levelId; st.loading = true; if (st.rev) st.level = levelId; paint();"]],
  'late-paint': [['    const late = () => gen !== st.gen || seq !== st.seq || !st.on;', '    const late = () => false;'], ['    } finally { if (gen === st.gen && seq === st.seq) { st.loading = false; st.want = null; paint(); } }', '    } finally { st.loading = false; st.want = null; paint(); }']],
  'keep-forever': [['  const tooOld = rev => ageMs(rev) >= WD.HIDE_AFTER_H * 3600e3;', '  const tooOld = rev => false;']],
  'wrong-from': [['const to = (Math.atan2(ue, vn) * 180 / Math.PI + 360) % 360, from = (to + 180) % 360;', 'const to = (Math.atan2(ue, vn) * 180 / Math.PI + 360) % 360, from = to;']],
  'no-recover': [['      if (err && err.gone) {', '      if (false) {']],
  'new-rev-on-switch': [['      let target = rev || st.rev, meta = null;', '      let target = rev, meta = null;']],
  'refetch-cached': [['    if (st.cache.has(l.sha256)) return st.cache.get(l.sha256);\n', '']],
  'refresh-when-off': [['    if (!st.on || st.loading) return;\n    const gen = st.gen;\n    let meta;', '    if (st.loading) return;\n    const gen = st.gen;\n    let meta;']],
  'no-hatch': [["      if (!c) { d[o + 3] = 0; missing.push([j, k]); continue; }", "      if (!c) { d[o] = 27; d[o + 1] = 42; d[o + 2] = 74; d[o + 3] = 255; continue; }"]],
  'calm-bearing': [['pole = j === 0 || j === WD.H - 1, calm = kmh < WD.CALM_KMH;', 'pole = j === 0 || j === WD.H - 1, calm = false;']],
  'pole-bearing': [['const pole = j === 0 || j === WD.H - 1, calm', 'const pole = false, calm']],
  'smooth': [['    c.imageSmoothingEnabled = false;', '    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";']],
  'fetched-age': [['  const ageMs = rev => now() - Date.parse(rev.valid_time);', '  const ageMs = rev => now() - Date.parse(rev.times.published);']],
  'no-modified-words': [[' NOAA/NCEP GFS, sampled to 1° and quantised by Mother Earth.', '']],
  'tap-when-off': [['(lat, lng) => { if (st.on && st.rev) select(lat, lng); }', '(lat, lng) => { select(lat, lng); }']],
  'silent-level-fail': [['else st.note = `${LV(levelId).label} could not be loaded: ${err.message || err}. Still showing ${LV(st.level).label}.`;', 'else st.note = null;']],
  'bad-input-wiped': [["      if (st.badInput) { rd.textContent = 'Enter a latitude from −90 to 90 and a longitude from −180 to 180.'; rd.dataset.kind = ''; }   // kept by every repaint until a valid point is chosen\n      else if (st.sel) {", '      if (st.sel) {']],
  'refresh-back': [['    if (st.rev && c.run < st.rev.run) return paint();        // never go back to an older run\n', '']],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const served = file => { let t = fs.readFileSync(path.join(ROOT, file), 'utf8'); if (BREAK && file === 'wind.js') for (const [a, b] of BREAKS[BREAK]) { const u = t.replace(a, b); if (u === t) { console.log('FAIL  break did not apply: ' + BREAK + ' / ' + a.slice(0, 60)); process.exit(1); } t = u; } return t; };

// ---------- fixtures: grids with known cells
const W = 360, Hh = 181, MISSING = -32768;
function grid(fill, cells = []) { const b = Buffer.alloc(W * Hh * 4); for (let k = 0; k < W * Hh; k++) { b.writeInt16LE(fill[0], k * 4); b.writeInt16LE(fill[1], k * 4 + 2); }
  for (const [lat, lon, u, v] of cells) { const k = (90 - lat) * W + ((lon + 360) % 360); b.writeInt16LE(u, k * 4); b.writeInt16LE(v, k * 4 + 2); } return b; }
const POLES = (u, v) => { const c = []; for (let lon = 0; lon < 360; lon++) { c.push([90, lon, u, v]); c.push([-90, lon, u, v]); } return c; };
// near ground: 5 m/s eastward (18 km/h from west) everywhere, with: a calm cell, a missing cell, the gate's real Cape Town vector, a cell at 180°, and the poles
const NG_A = grid([50, 0], [[0, 10, 1, 1], [10, 20, MISSING, MISSING], [-34, 18, -45, 110], [20, 180, 0, 300], ...POLES(30, 40)]);
const JET_A = grid([400, 0]);            // 144 km/h from west
const STRAT_A = grid([0, -200]);         // 72 km/h from north
const NG_B = grid([0, 100]);             // next run: 36 km/h from south
const JET_B = grid([0, 600]);            // 216 km/h from south
const STRAT_B = grid([-100, 0]);         // 36 km/h from east
const NG_C = grid([70, 70]);             // ~35.6 km/h from south-west
const JET_C = grid([-500, 0]);           // 180 km/h from east
const STRAT_C = grid([0, 50]);
const rev = (run, bufs) => { const iso = `${run.slice(0, 4)}-${run.slice(4, 6)}-${run.slice(6, 8)}T${run.slice(8)}:00:00Z`;
  return { run, run_time: iso, valid_time: iso, forecast_hour: 0, times: { index_first_seen: iso, fields_fetched: iso, published: new Date(Date.parse(iso) + 4 * 3600e3).toISOString() },
    source: { credit: 'NOAA/NCEP GFS' }, levels: ['near-ground', '250hPa', '10hPa'].map((id, i) => ({ id, file: sha(bufs[i]) + '.i16', path: `/snapshot/wind/grid/${sha(bufs[i])}.i16`, bytes: bufs[i].length, sha256: sha(bufs[i]), _buf: bufs[i] })) }; };
const RA = rev('2026111600', [NG_A, JET_A, STRAT_A]), RB = rev('2026111606', [NG_B, JET_B, STRAT_B]), RC = rev('2026111612', [NG_C, JET_C, STRAT_C]);
const T0 = Date.parse(RA.valid_time), H = 3600e3;
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();
const newHub = () => ({ reqs: [], noaa: [], cur: RA, prev: null, lastAttempt: null, metaStatus: 200, fault: {}, hold: {} });
let BASE;
async function setup(browser, hub, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: BACKDROP }));
  await ctx.route('**/*.amazonaws.com/**', r => { hub.noaa.push(r.request().url()); r.abort(); });
  await ctx.route('**/*.noaa.gov/**', r => { hub.noaa.push(r.request().url()); r.abort(); });
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(b) });
    if (p.startsWith('/snapshot/wind')) { hub.reqs.push(p);
      if (p === '/snapshot/wind/meta') { if (hub.metaStatus !== 200) return j({ status: 'unavailable' }, hub.metaStatus); const strip = r => r && { ...r, levels: r.levels.map(l => ({ ...l, _buf: undefined })) };
        return j({ schema: 1, layer: 'wind', current: strip(hub.cur), previous: strip(hub.prev), last_attempt: hub.lastAttempt, source: { credit: 'NOAA/NCEP GFS' }, now: NOW }); }
      const m = /^\/snapshot\/wind\/grid\/([0-9a-f]{64})\.i16$/.exec(p); const l = m && [hub.cur, hub.prev].filter(Boolean).flatMap(r => r.levels).find(x => x.sha256 === m[1]);
      if (!l) return j({ status: 'unavailable', reason: 'not found' }, 404);
      if (hub.hold[l.sha256]) await hub.hold[l.sha256];
      const f = hub.fault[l.sha256]; if (f === 503) return j({ status: 'unavailable' }, 503);
      const body = Buffer.from(l._buf); if (f === 'tamper') body[1000] ^= 0x01;
      return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: { 'access-control-allow-origin': '*' }, body: f === 'short' ? body.subarray(0, 1000) : body }); }
    if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
    j({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }); });
  if (opts.noWebGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.loadedAt && ME.wind, null, { timeout: 30000 });
  if (!opts.noWebGL) await page.waitForFunction(() => { const g = ME.globe && ME.globe(); if (!g) return false; let ok = false; g.scene().traverse(o => { if (o.isMesh && o.material === g.globeMaterial() && o.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });
  return { ctx, page, errs };
}
const st = page => page.evaluate(() => ME.wind.state());
const setNow = (page, ms) => page.evaluate(t => { ME.wind.opts.now = () => t; }, ms);
const idle = page => page.waitForFunction(() => !ME.wind.state().loading, null, { timeout: 20000 });
const on = async page => { await page.click('#tgl-wind'); await idle(page); };
const level = async (page, id) => { await page.click(`#wind-levels button[data-level="${id}"]`); await idle(page); };
const grids = hub => hub.reqs.filter(p => p.includes('/grid/'));
/** colour of the picture at one model cell's centre, and probes around an arrow at that point */
const px = (page, lat, lon) => page.evaluate(([lat, lon]) => { const c = ME.wind.texture(); if (!c) return null; const g = c.getContext('2d'), p = c.__wind.px, x = Math.round((lon + 180) * p), y = Math.round((90 - lat) * p);
  const at = (dx, dy) => [...g.getImageData(Math.min(c.width - 1, Math.max(0, x + dx)), Math.min(c.height - 1, Math.max(0, y + dy)), 1, 1).data]; const L = ME.wind.config.ARROW_LEN * p;
  return { centre: at(0, 0), off: at(3, 3), east: at(Math.round(L / 2 - 2), 0), west: at(-Math.round(L / 2 - 2), 0), north: at(0, -Math.round(L / 2 - 2)), south: at(0, Math.round(L / 2 - 2)), drawn: c.__wind, w: c.width, h: c.height }; }, [lat, lon]);
const rgbOf = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const same = (a, b) => a && Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3 && Math.abs(a[2] - b[2]) < 3;
const white = a => a && a[0] > 170 && a[1] > 170 && a[2] > 170 && Math.max(a[0], a[1], a[2]) - Math.min(a[0], a[1], a[2]) < 40;   // the arrow's light stroke (anti-aliased over its dark edge), never a scale colour
const read = async (page, lat, lon) => { await page.evaluate(([a, b]) => ME.wind.select(a, b), [lat, lon]); return (await st(page)).read; };

(async () => {
  const srv = http.createServer((q, r) => { const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html'; const full = path.join(ROOT, f);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { r.writeHead(404); return r.end(); }
    const type = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' }[f.split('.').pop()] || 'application/octet-stream';
    r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); r.end(/\.(js|html|css)$/.test(f) ? served(f) : fs.readFileSync(full)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const SCALE = await (async () => { const { ctx, page } = await setup(browser, newHub()); const s = await page.evaluate(() => ME.wind.config.SCALE); await ctx.close(); return s; })();
  const colourFor = kmh => { let k = 0; SCALE.forEach(([v], i) => { if (kmh >= v) k = i; }); return rgbOf(SCALE[k][1]); };

  // ===== A. off on load
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); let s = await st(page);
    ok('A load: layer off, no request to the hub for wind, none to NOAA, nothing drawn', hub.reqs.length === 0 && hub.noaa.length === 0 && s.on === false && s.stateWord === 'off' && s.meshes === 0, [hub.reqs, s.stateWord]);
    ok('A card: name, a Modelled tag (dashed, not Observed), a switch, three height buttons disabled while off', await page.$eval('#card-wind', c => /Wind by height/.test(c.querySelector('.ovl-h').textContent) && c.querySelector('.ev.comp').textContent === 'Modelled' && !c.querySelector('.ev.obs') && c.querySelector('#tgl-wind').getAttribute('role') === 'switch' && [...c.querySelectorAll('#wind-levels button')].map(b => b.textContent + ':' + b.disabled).join() === 'Near ground:true,Jet-stream height:true,Stratosphere:true' && c.querySelector('#wind-levels').getAttribute('role') === 'radiogroup'));
    ok('A the card says what it is: modelled not measured, frozen moment, coarse, changed by Mother Earth', await page.$eval('#wind-scope', d => /Modelled, not measured/.test(d.textContent) && /global coverage does not mean wind was measured at every place/.test(d.textContent) && /Nothing here moves the model forward, forecasts, or shows where a parcel of air will travel/.test(d.textContent) && /It is not original, unaltered NOAA data/.test(d.textContent) && /their true height varies/.test(d.textContent)));
    ok('A the words "measured" and "observed" are never used as a claim, and "current wind" never appears', await page.$eval('#card-wind', c => !/current wind|observed wind|measured wind/i.test(c.textContent)));
    ok('A key: one band per scale step, the unit, "one scale for all three heights", and a no-value swatch', await page.$eval('#wind-key', (k, n) => k.querySelectorAll('.b:not(.m)').length === n && /km\/h · one scale for all three heights \(provisional\)/.test(k.textContent) && /no model value/.test(k.textContent) && /400\+/.test(k.textContent), SCALE.length));
    await page.evaluate(() => ME.taps.forEach(f => f(10, 10))); s = await st(page);
    ok('A a tap on the globe while the layer is off selects nothing and requests nothing', s.sel === null && hub.reqs.length === 0, s.sel);
    await page.evaluate(() => ME.wind.refresh()); await page.evaluate(() => ME.wind.ageTick());
    ok('A refresh and age ticks while off: still no request', hub.reqs.length === 0, hub.reqs);
    ok('A no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== B. on: one manifest, one grid, everything labelled
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    await page.waitForFunction(async () => { const a = JSON.stringify(ME.globe().pointOfView()); await new Promise(r => setTimeout(r, 400)); return a === JSON.stringify(ME.globe().pointOfView()); }, null, { timeout: 30000 });   // the page's own opening camera move has finished
    const pov0 = await page.evaluate(() => ME.globe().pointOfView()), img0 = await page.evaluate(() => ME.globe().globeImageUrl());
    await setNow(page, T0 + 5 * H + 20 * 60e3); await on(page); let s = await st(page);
    ok('B on: exactly the manifest and ONE grid (near ground) were requested', hub.reqs.join() === ['/snapshot/wind/meta', RA.levels[0].path].join(), hub.reqs);
    ok('B state loaded, one sheet in the scene, near ground checked and only it', s.stateWord === 'loaded' && s.inScene === 1 && s.checked.join() === 'near-ground' && s.run === '2026111600', s);
    ok('B the line names the model, that it is modelled, the valid time and the age from VALID time', /^Modelled wind · NOAA GFS · Valid at 16 Nov 2026, 00:00 UTC \(5 h ago\)/.test(s.label) && /Near ground — 10 m above the model’s surface/.test(s.label), s.label);
    ok('B the note says not a measurement, not a forecast, and that Mother Earth changed the data', /not a measurement, not a forecast/.test(s.extra) && /NOAA\/NCEP GFS, sampled to 1° and quantised by Mother Earth/.test(s.extra), s.extra);
    ok('B the globe\'s own picture and camera were not touched', JSON.stringify(await page.evaluate(() => ME.globe().pointOfView())) === JSON.stringify(pov0) && await page.evaluate(() => ME.globe().globeImageUrl()) === img0);
    // picture: colour per cell
    let p = await px(page, 42, -103);
    ok('B an ordinary cell (18 km/h) has the scale colour for 18 km/h', same(p.off, colourFor(18)) && same(p.centre, colourFor(18)), [p.off, colourFor(18)]);
    p = await px(page, 0, 10); ok('B the calm cell has the lowest band\'s colour and a dot, not an arrow', same(p.off, colourFor(0)) && white(p.centre) && !white(p.east) && !white(p.north), p);
    p = await px(page, 10, 20); ok('B the missing cell is a hatch: opaque, dark, and not any colour on the scale', p.off[3] > 200 && p.off[0] < 80 && !SCALE.some(([, c]) => same(p.off, rgbOf(c))) && p.drawn.missing === 1, p);
    p = await px(page, 20, 180); const q = await px(page, 20, -180);
    const edges = await page.evaluate(() => { const c = ME.wind.texture(), g = c.getContext('2d'), p = c.__wind.px; return [[...g.getImageData(3, 70 * p + 3, 1, 1).data], [...g.getImageData(c.width - 4, 70 * p + 3, 1, 1).data]]; });
    ok('B the cell at 180° is drawn at both edges of the picture (the seam wraps)', edges.every(x => same(x, colourFor(108))) && same(q.off, colourFor(108)), [edges, q.off]);
    p = await px(page, 0, 0); ok('B an eastward wind draws an arrow lying east-west (white at both ends east and west, none north or south)', white(p.centre) && white(p.east) && white(p.west) && !white(p.north) && !white(p.south), p);
    ok('B arrows are thinned and drawn; one calm dot', p.drawn.arrows > 500 && p.drawn.arrows < 2600 && p.drawn.dots === 1 && p.w === 2880 && p.h === 1440, p.drawn);
    // ===== C. point reading
    ok('C before any point: an instruction, no value', /Tap the globe, or enter a latitude and longitude/.test(s.read));
    ok('C Cape Town cell (the gate\'s real vector): from south 158°, 43 km/h, with level, cell and valid time', await read(page, -34.2, 18.4) === 'From south (158°), 43 km/h · Near ground · model cell 34°S 18°E · valid 16 Nov 2026, 00:00 UTC', (await st(page)).read);
    ok('C an eastward vector reads "From west (270°)"', /^From west \(270°\), 18 km\/h · Near ground · model cell 40°N 100°W/.test(await read(page, 40, -100)), (await st(page)).read);
    ok('C calm: no bearing', /^Calm \(under 1 km\/h\)\. · Near ground · model cell 0° 10°E/.test(await read(page, 0, 10)) && (await st(page)).readKind === 'calm', (await st(page)).read);
    ok('C missing: "No model value here."', /^No model value here\. · Near ground · model cell 10°N 20°E/.test(await read(page, 10, 20)) && (await st(page)).readKind === 'missing', (await st(page)).read);
    ok('C exact north pole: speed only, no bearing', /^18 km\/h\. No compass bearing at the pole\. · Near ground · model cell 90°N/.test(await read(page, 90, 33)) && (await st(page)).readKind === 'pole', (await st(page)).read);
    ok('C exact south pole: speed only', /^18 km\/h\. No compass bearing at the pole\./.test(await read(page, -90, -120)), (await st(page)).read);
    ok('C a point reads the NEAREST whole-degree cell (39.6°N reads the 40°N cell; 39.4°N the 39°N cell)', /model cell 40°N 100°W/.test(await read(page, 39.6, -100.4)) && /model cell 39°N 100°W/.test(await read(page, 39.4, -100.4)));
    ok('C longitude 180 and −180 are the same cell', /model cell 20°N 180°/.test(await read(page, 20, 180)) && /^From south \(180°\), 108 km\/h/.test(await read(page, 20, -180)), (await st(page)).read);
    await page.fill('#wind-lat', '-34'); await page.fill('#wind-lng', '18'); await page.click('#wind-go');
    ok('C typed latitude and longitude with the Read button give the same reading', /^From south \(158°\), 43 km\/h/.test((await st(page)).read));
    await page.fill('#wind-lat', '95'); await page.click('#wind-go');
    ok('C an impossible latitude is refused in words', /Enter a latitude from −90 to 90/.test((await st(page)).read), (await st(page)).read);
    await page.evaluate(() => ME.wind.ageTick());
    ok('C that message survives a repaint (the 30-second age tick)', /Enter a latitude from −90 to 90/.test((await st(page)).read), (await st(page)).read);
    await page.fill('#wind-lat', '12'); await page.fill('#wind-lng', '77'); await page.focus('#wind-lng'); await page.keyboard.press('Enter');
    ok('C Enter in a field reads the point', /model cell 12°N 77°E/.test((await st(page)).read));
    await page.evaluate(() => ME.taps.forEach(f => f(-34.2, 18.4)));
    ok('C a tap on the globe selects that point and fills the fields', /^From south \(158°\), 43 km\/h/.test((await st(page)).read) && await page.inputValue('#wind-lat') === '-34' && await page.inputValue('#wind-lng') === '18');
    ok('C the colour at a cell is the scale colour of the very number the reading gives', same((await px(page, -34, 18)).off, colourFor(42.8)), (await px(page, -34, 18)).off);

    // ===== D. switching height
    const povD = await page.evaluate(() => ME.globe().pointOfView()); const n0 = hub.reqs.length;
    await level(page, '250hPa'); s = await st(page);
    ok('D jet-stream height: ONE more request (that grid), no second manifest', hub.reqs.slice(n0).join() === RA.levels[1].path, hub.reqs.slice(n0));
    ok('D sheet, control, line and reading moved together', s.checked.join() === '250hPa' && /Jet-stream height — 250 hPa, roughly 10–11 km/.test(s.label) && /^From west \(270°\), 144 km\/h · Jet-stream height · model cell 34°S 18°E/.test(s.read) && s.inScene === 1 && s.meshes === 1, s);
    ok('D the camera, the selected point and the model time did not change', JSON.stringify(await page.evaluate(() => ME.globe().pointOfView())) === JSON.stringify(povD) && s.sel.lat === -34.2 && s.run === '2026111600' && /Valid at 16 Nov 2026, 00:00 UTC/.test(s.label));
    ok('D the picture is the jet level\'s (144 km/h colour)', same((await px(page, 42, -103)).off, colourFor(144)));
    const n1 = hub.reqs.length; await level(page, 'near-ground'); s = await st(page);
    ok('D back to near ground: no request at all (kept in memory), all labels back together', hub.reqs.length === n1 && s.checked.join() === 'near-ground' && /^From south \(158°\), 43 km\/h · Near ground/.test(s.read), [hub.reqs.slice(n1), s.read]);
    // a level that fails
    hub.fault[RA.levels[2].sha256] = 'tamper'; await level(page, '10hPa'); s = await st(page);
    ok('D a height whose file fails its fingerprint: the previous height stays under its own label', s.checked.join() === 'near-ground' && /Near ground —/.test(s.label) && /Near ground/.test(s.read) && s.meshes === 1 && same((await px(page, 42, -103)).off, colourFor(18)), s);
    ok('D and the card names the height that failed', /Stratosphere could not be loaded: the wind file did not match its fingerprint\. Still showing Near ground\./.test(s.extra), s.extra);
    hub.fault = {};
    // a slow level, then a different choice: the late answer is dropped
    let release; hub.hold[RA.levels[2].sha256] = new Promise(r => { release = r; });
    await page.click('#wind-levels button[data-level="10hPa"]'); await page.waitForFunction(() => ME.wind.state().want === '10hPa');
    s = await st(page);
    ok('D while a height is loading: the previous sheet, its control and its line all stay; the requested one is marked pending', s.checked.join() === 'near-ground' && /Near ground —/.test(s.label) && /Near ground/.test(s.read) && await page.$eval('#wind-levels button[data-level="10hPa"]', b => b.classList.contains('pending')), s);
    await page.click('#wind-levels button[data-level="250hPa"]'); await idle(page); release(); await page.waitForTimeout(400); s = await st(page);
    ok('D a late answer for a superseded choice is dropped: jet-stream height is shown and labelled', s.checked.join() === '250hPa' && /Jet-stream height —/.test(s.label) && /144 km\/h · Jet-stream height/.test(s.read) && same((await px(page, 42, -103)).off, colourFor(144)) && s.meshes === 1, s);
    hub.hold = {};
    hub.fault = {}; await level(page, '10hPa'); s = await st(page);
    ok('D once it loads, the note goes and the stratosphere is shown: from north, 72 km/h', s.checked.join() === '10hPa' && !/could not be loaded/.test(s.extra) && /^From north \(0°\), 72 km\/h · Stratosphere/.test(s.read), s);
    let p2 = await px(page, 0, 0); ok('D a southward wind draws an arrow lying north-south', white(p2.centre) && white(p2.north) && white(p2.south) && !white(p2.east) && !white(p2.west), p2);
    // keyboard
    await page.focus('#wind-levels button[data-level="10hPa"]'); await page.keyboard.press('ArrowLeft'); await idle(page); s = await st(page);
    ok('D keyboard: an arrow key in the height group moves and selects', s.checked.join() === '250hPa' && await page.evaluate(() => document.activeElement.dataset.level) === '250hPa', s.checked);
    ok('D no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== E. a newer revision: kept on a height switch, taken on refresh, never mixed
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 8 * H); await on(page); await read(page, 40, -100);
    hub.cur = RB; hub.prev = RA; const n0 = hub.reqs.length;
    await level(page, '250hPa'); let s = await st(page);
    ok('E the hub has a newer run; switching height keeps the run already shown (its grid is still served)', s.run === '2026111600' && /Valid at 16 Nov 2026, 00:00 UTC/.test(s.label) && /144 km\/h · Jet-stream height/.test(s.read) && hub.reqs.slice(n0).join() === RA.levels[1].path, [s.run, hub.reqs.slice(n0)]);
    await page.evaluate(() => ME.wind.refresh()); await idle(page); s = await st(page);
    ok('E on refresh the new run arrives as one step: sheet, valid time and reading are all the new run\'s', s.run === '2026111606' && /Valid at 16 Nov 2026, 06:00 UTC \(2 h ago\)/.test(s.label) && /^From south \(180°\), 216 km\/h · Jet-stream height · model cell 40°N 100°W · valid 16 Nov 2026, 06:00 UTC/.test(s.read) && s.checked.join() === '250hPa' && same((await px(page, 42, -103)).off, colourFor(216)), s);
    const n1 = hub.reqs.length; await page.evaluate(() => ME.wind.refresh()); await idle(page);
    ok('E a refresh with nothing newer asks for the manifest only', hub.reqs.slice(n1).join() === '/snapshot/wind/meta', hub.reqs.slice(n1));
    hub.cur = RA; hub.prev = null; await page.evaluate(() => ME.wind.refresh()); await idle(page); s = await st(page);
    ok('E a manifest that names an OLDER run never takes the page back', s.run === '2026111606', s.run);
    // refresh fails while something is shown
    hub.metaStatus = 503; await page.evaluate(() => ME.wind.refresh()); await idle(page); s = await st(page);
    ok('E a failed refresh keeps the field shown, with its own time, and says "Refresh unavailable."', s.run === '2026111606' && s.meshes === 1 && /Refresh unavailable\./.test(s.extra), s.extra);
    ok('E no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== F. the revision shown has aged out of the hub
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 14 * H); await on(page); await read(page, 40, -100);
    hub.cur = RC; hub.prev = RB; const n0 = hub.reqs.length;                      // run A is no longer served
    await level(page, '250hPa'); const s = await st(page);
    ok('F the grid of an aged-out run is refused; the manifest is read again and the page moves to the current run', hub.reqs.slice(n0).join() === [RA.levels[1].path, '/snapshot/wind/meta', RC.levels[1].path].join(), hub.reqs.slice(n0));
    ok('F sheet, control, valid time and reading all belong to the SAME new run and height', s.run === '2026111612' && s.checked.join() === '250hPa' && /Valid at 16 Nov 2026, 12:00 UTC/.test(s.label) && /Jet-stream height —/.test(s.label) && /^From east \(90°\), 180 km\/h · Jet-stream height · model cell 40°N 100°W · valid 16 Nov 2026, 12:00 UTC/.test(s.read) && same((await px(page, 42, -103)).off, colourFor(180)) && s.meshes === 1, s);
    ok('F no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== G. age from valid time; the 24-hour limit
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 23 * H + 59 * 60e3); await on(page); let s = await st(page);
    ok('G at 23 h 59 min from the valid time the field is shown with its age, and no "stale" label is invented', s.meshes === 1 && /\(23 h ago\)/.test(s.label) && s.stateWord === 'loaded' && !/stale/i.test(s.label + s.extra), s.label);
    await setNow(page, T0 + 24 * H); await page.evaluate(() => ME.wind.ageTick()); s = await st(page);
    ok('G at 24 h the sheet is cleared and the card says why; no value remains readable', s.meshes === 0 && s.stateWord === 'unknown' && /valid at 16 Nov 2026, 00:00 UTC, more than 24 hours ago, and has been cleared\. Nothing is drawn\./.test(s.off) && s.read === '' && s.checked.length === 0, s);
    ok('G no page error', errs.length === 0, errs); await ctx.close(); }
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 30 * H); await on(page); const s = await st(page);
    ok('G switching on when the newest field is 30 h old: no grid is fetched, nothing drawn, and the reason is given', grids(hub).length === 0 && s.meshes === 0 && s.stateWord === 'unknown' && /The newest model field is valid at 16 Nov 2026, 00:00 UTC, more than 24 hours ago\. Nothing is drawn\./.test(s.off), s.off); await ctx.close(); }
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 10 * H); await on(page);
    await setNow(page, T0 + 25 * H); await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(300); const s = await st(page);
    ok('G when the tab comes back after the limit has passed, the age is rechecked and the sheet cleared', s.meshes === 0 && s.stateWord === 'unknown', s); await ctx.close(); }
  { // published late: the age still runs from the valid time, not from publication
    const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 9 * H); await on(page); const s = await st(page);
    ok('G the age shown is from the valid time (9 h), not from when the hub published it (5 h)', /\(9 h ago\)/.test(s.label), s.label); await ctx.close(); }

  // ===== H. off; failures on first load
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 5 * H); await on(page);
    await page.click('#tgl-wind'); let s = await st(page);
    ok('H off: the sheet is removed, the heights are disabled, nothing is checked', s.on === false && s.meshes === 0 && s.stateWord === 'off' && s.checked.length === 0 && await page.$$eval('#wind-levels button', b => b.every(x => x.disabled)), s);
    const n0 = hub.reqs.length; await page.evaluate(() => ME.wind.refresh()); await page.waitForTimeout(200);
    ok('H off: a refresh asks for nothing', hub.reqs.length === n0, hub.reqs.slice(n0));
    let release; hub.hold[RA.levels[0].sha256] = new Promise(r => { release = r; });
    await page.click('#tgl-wind'); await page.waitForFunction(() => ME.wind.state().requests.length >= 4); await page.click('#tgl-wind'); release(); await page.waitForTimeout(500); s = await st(page);
    ok('H switched off while loading: the late answer paints nothing', s.on === false && s.meshes === 0 && s.label === null, s);
    ok('H no page error', errs.length === 0, errs); await ctx.close(); }
  { const hub = newHub(); hub.metaStatus = 503; const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 5 * H); await on(page); const s = await st(page);
    ok('H the hub does not answer on first load: nothing drawn, unknown, the reason in words', s.meshes === 0 && s.stateWord === 'unknown' && /The wind field could not be loaded: the hub did not answer \(HTTP 503\)\. Nothing is drawn\./.test(s.off), s.off); await ctx.close(); }
  { const hub = newHub(); hub.cur = null; const { ctx, page } = await setup(browser, hub); await on(page); const s = await st(page);
    ok('H the hub has no revision yet: says so, draws nothing', s.meshes === 0 && /The hub has no wind revision yet\. Nothing is drawn\./.test(s.off), s.off); await ctx.close(); }
  for (const [f, why] of [['tamper', 'one changed byte'], ['short', 'a short file'], [503, 'a 503']]) { const hub = newHub(); hub.fault[RA.levels[0].sha256] = f; const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 5 * H); await on(page); const s = await st(page);
    ok(`H first grid with ${why}: nothing drawn, unknown, a reason`, s.meshes === 0 && s.stateWord === 'unknown' && /The wind field could not be loaded: the wind file (did not match its fingerprint|could not be loaded)\. Nothing is drawn\./.test(s.off), s.off); await ctx.close(); }
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub, { noWebGL: true }); await page.click('#tgl-wind'); await page.waitForTimeout(300); const s = await st(page);
    ok('H no 3-D globe in this browser: the layer stays off, says why, asks the hub for nothing', s.on === false && /needs the 3-D globe/.test(s.off) && hub.reqs.length === 0, s.off); await ctx.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`${fail ? 'FAILED' : 'ok'}  wind-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
