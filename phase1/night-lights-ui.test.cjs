/* Night lights — page suite (NIGHT-LIGHTS-PROPOSAL rev 2 §9.5; GPT's two build details, 15 Nov 2026; branch night-lights-rc).
 * The real page files are served by the suite's own static server, with the real globe.gl 2.45.0 (SwiftShader). NASA GIBS
 * is a fixture the tests control: the two colour keys and the Saipan and Tinian frames are the responses recorded from GIBS
 * on 15 Nov 2026 (phase1/night-lights/recorded-gibs-2026-11-15.json); whole-globe frames and the three-state box are made
 * here from NASA's own key colours. The real GIBS path is a separate live check (reviews/2026-11-15-night-lights-rc.md).
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/night-lights-ui.test.cjs
 * BREAK=<name> weakens the served nightlights.js; each must make this suite fail:
 *   eager date-mismatch no-restore nodata-dark panel-own-state value-when-withheld fail-as-arriving stale-kept power-word total-shown
 */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http'); const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'); const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 12 min'); process.exit(1); }, 12 * 60e3);

const BREAKS = {
  'eager': [['  paint();\n})();', '  paint(); const iv = setInterval(() => { if (ME.globe && ME.globe()) { clearInterval(iv); setOn(true); } }, 50);\n})();']],
  'date-mismatch': [["    st.date = pick.date; st.status = 'ready';", "    st.date = results[0].date; st.status = 'ready';"]],
  'no-restore': [["    try { const g = ME.globe && ME.globe(); if (g && st.prevUrl != null) g.globeImageUrl(st.prevUrl); } catch (_) { }", '']],
  'nodata-dark': [["if (v[i] >= 0) continue; const p = ((x >> 3) + (y >> 3)) & 1 ? b : a; d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; }", "if (v[i] >= 0) continue; d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }"]],
  'panel-own-state': [["    if (okA) drawPanel(cmpEl('cv-a'), res.a, res.states || res.one, res.w, res.h);", "    if (okA) drawPanel(cmpEl('cv-a'), res.a, classifyOne(res.a.light, res.a.clear, NL.THRESH_H), res.w, res.h);"]],
  'value-when-withheld': [["        : s === NOREL ? `${where} · No reliable comparison: clear-sky confidence is below 0.95, or absent, on at least one night. No light value is shown.`", "        : s === NOREL ? `${where} · No reliable comparison · ${dayText(c.a.date)}: ${lightText(c.a.light[i])} ${NL.UNITS}`"]],
  'fail-as-arriving': [["    if (pick.fail) return stop(failText(pick.fail, 'Night lights'));", "    if (pick.fail) return stop(`No complete night frame yet: ${dayText(pick.fail.date)} is still arriving. Nothing is drawn.`);"]],
  'stale-kept': [["if (out) { out.hidden = true; out.innerHTML = ''; } st.cmp = null;", "st.cmp = null;"]],
  'power-word': [["R2: 'Light as measured at the satellite.", "R2: 'Light as measured at the satellite, a sign of power."]],
  'total-shown': [["Usable on both: <b>${pct(t.both, t.n)}</b> — of the area in view</div>`;", "Usable on both: <b>${pct(t.both, t.n)}</b> — of the area in view · total light ${res.a.light.reduce((s, v) => s + Math.max(0, v), 0) / 10}</div>`;"]],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const served = file => { let t = fs.readFileSync(path.join(ROOT, file), 'utf8'); if (BREAK && file === 'nightlights.js') for (const [a, b] of BREAKS[BREAK]) { if (t.split(a).length !== 2) { console.log('FAIL  break did not apply exactly once: ' + BREAK + ' / ' + a.slice(0, 50)); process.exit(1); } t = t.replace(a, b); } return t; };

// ---------- fixtures
const REC = JSON.parse(fs.readFileSync(path.join(__dirname, 'night-lights/recorded-gibs-2026-11-15.json'), 'utf8'));
const KEYS = Object.fromEntries(Object.entries(REC.colormaps).map(([k, v]) => [k + '.xml', Buffer.from(v.b64, 'base64')]));
const NLL = (() => { const ME = { $: () => null, esc: s => String(s) }; new Function('window', 'document', fs.readFileSync(path.join(ROOT, 'nightlights.js'), 'utf8'))({ ME }, {}); return ME.nlLogic; })();   // the page's own key parser, to pick fixture colours by value
const LK = NLL.parseKey(KEYS['VIIRS_DayNightBand_At_Sensor_Radiance.xml'].toString(), 10), CK = NLL.parseKey(KEYS['VIIRS_Clear_Sky_Confidence.xml'].toString(), 100);
const inv = m => new Map([...m.entries()].map(([rgb, v]) => [v, rgb.split(',').map(Number)]));
const LIGHT = inv(LK), CLEAR = inv(CK);   // value -> [r,g,b]
const make = (w, h, fn) => { const p = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y), i = (y * w + x) * 4; if (!c) { p.data[i + 3] = 0; continue; } p.data[i] = c[0]; p.data[i + 1] = c[1]; p.data[i + 2] = c[2]; p.data[i + 3] = 255; } return PNG.sync.write(p); };
const BACKDROP = make(64, 32, () => [10, 30, 60]);
const cache = new Map(), memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
// whole-globe light frames: 'complete' = measured everywhere except south of 60°S (no night pass in November), with one lit
// block; 'filling' = the eastern half has not arrived
const globalPng = (kind, w, h) => memo(kind + w, () => make(w, h, (x, y) => { const lat = 90 - (y + .5) / h * 180, lng = -180 + (x + .5) / w * 360;
  if (lat < -60) return null; if (kind === 'filling' && lng > 0) return null;
  return lat > 10 && lat < 12 && lng > 20 && lng < 22 ? LIGHT.get(382) : LIGHT.get(0); }));
// the three-state box (0.5° about 0, 0), 120 × 120: rows 0–39 usable on both; rows 40–79 a valid DARK pixel on the first date
// and transparent on the second (GPT's fixture); rows 80–119 light on both, confidence 0.94 on the second date
const TRI = { box: '-0.25,-0.25,0.25,0.25', a: '2026-05-01', b: '2026-05-02' };
const triPng = (layer, date) => memo('tri' + layer + date, () => make(120, 120, (x, y) => {
  if (layer === 'light') return date === TRI.a ? (y < 40 ? LIGHT.get(100) : y < 80 ? LIGHT.get(0) : LIGHT.get(50)) : (y < 40 ? LIGHT.get(10) : y < 80 ? null : LIGHT.get(50));
  return date === TRI.b && y >= 80 ? CLEAR.get(94) : CLEAR.get(100); }));
const RECBOX = '14.85,145.45,15.35,145.95', recPng = k => Buffer.from(REC.frames[k].b64, 'base64');
const T_NOW = Date.parse('2026-11-15T16:00:00Z');

const newGibs = () => ({ reqs: [], global: { '2026-11-15': 'filling', '2026-11-14': 'complete', '2026-11-13': 'complete', '2026-11-12': 'complete' }, fault: {}, hold: null, keyFault: null });
async function setup(browser, gibs, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/*.eumetsat.int/**', r => r.abort());
  await ctx.route('**/gibs.earthdata.nasa.gov/**', async route => {
    const u = new URL(route.request().url()), q = u.searchParams, cors = { 'access-control-allow-origin': '*' };
    if (u.pathname.startsWith('/colormaps/')) { gibs.reqs.push('key:' + u.pathname.split('/').pop()); const n = u.pathname.split('/').pop();
      if (gibs.keyFault) return route.fulfill({ status: gibs.keyFault, headers: cors, body: 'no' });
      return KEYS[n] ? route.fulfill({ status: 200, contentType: 'text/xml', headers: cors, body: KEYS[n] }) : route.fulfill({ status: 404, headers: cors, body: '' }); }
    const layer = q.get('LAYERS') || '';
    if (!/DayNightBand_At_Sensor_Radiance|Clear_Sky_Confidence_Night/.test(layer)) return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: BACKDROP });   // the true-colour backdrop
    const kind = /Radiance/.test(layer) ? 'light' : 'clear', date = q.get('TIME'), box = q.get('BBOX'), w = +q.get('WIDTH'), h = +q.get('HEIGHT');
    const tag = `${kind}:${date}:${box}:${w}x${h}`; if (route.request().method() === 'GET') gibs.reqs.push(tag);
    if (gibs.hold) await gibs.hold;
    const f = gibs.fault[`${kind}:${date}`] || gibs.fault[date];
    if (f === 'abort') return route.abort();
    if (f === 'xml') return route.fulfill({ status: 200, contentType: 'text/xml', headers: cors, body: '<ServiceExceptionReport/>' });
    if (typeof f === 'number') return route.fulfill({ status: f, headers: cors, body: 'no' });
    const png = (() => {
      if (box === '-90,-180,90,180') return kind === 'light' && gibs.global[date] ? globalPng(gibs.global[date], w, h) : null;
      if (box === RECBOX && REC.frames[`${date}/${kind === 'light' ? 'rad' : 'csc'}`]) return recPng(`${date}/${kind === 'light' ? 'rad' : 'csc'}`);
      if (box === TRI.box && (date === TRI.a || date === TRI.b)) return triPng(kind, date);
      return null; })();
    if (!png) return route.fulfill({ status: 404, headers: cors, body: 'no fixture' });
    return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: png }); });
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(b) });
    if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
    if (/^\/(snapshot\/dustrgb|catalogue)\//.test(p)) return j({ status: 'unavailable' }, 404);
    j({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }); });
  // a read the browser blocks: the page's normal fetch is refused (as CORS refuses it) while a no-cors fetch still reaches the server.
  // Playwright adds permissive CORS headers to fulfilled routes, so this cannot be done from the route. Set window.__blockRead to a URL part.
  await ctx.addInitScript(() => { const real = window.fetch; window.fetch = function (u, init) { const b = window.__blockRead; if (b && String(u).includes(b)) return init && init.mode === 'no-cors' ? Promise.resolve(new Response(null)) : Promise.reject(new TypeError('Failed to fetch')); return real.call(this, u, init); }; });
  if (opts.noWebGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.loadedAt && ME.nightLights, null, { timeout: 30000 });
  if (!opts.noWebGL) await page.waitForFunction(() => { const g = ME.globe && ME.globe(); if (!g) return false; let ok = false; g.scene().traverse(o => { if (o.isMesh && o.material === g.globeMaterial() && o.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });
  await page.evaluate(t => ME.nightLights.options({ now: t }), T_NOW);
  await page.evaluate(() => { for (const d of document.querySelectorAll('#card-nl details')) d.open = true; const c = document.getElementById('card-nl'); let e = c; while (e) { if (e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } });
  return { ctx, page, errs };
}
const st = page => page.evaluate(() => ME.nightLights.state());
const nl = gibs => gibs.reqs.slice();
const toggle = async page => { await page.evaluate(() => document.getElementById('tgl-nl').click()); await page.waitForFunction(() => ME.nightLights.state().status !== 'loading', null, { timeout: 30000 }); };
const txt = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim());
const backdrop = page => page.evaluate(() => ME.globe().globeImageUrl());
const texPx = (page, pts) => page.evaluate(async pts => { const u = ME.globe().globeImageUrl(), bm = await createImageBitmap(await (await fetch(u)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
  return { w: bm.width, h: bm.height, px: pts.map(([lat, lng]) => [...g.getImageData(Math.floor((lng + 180) / 360 * bm.width), Math.floor((90 - lat) / 180 * bm.height), 1, 1).data]) }; }, pts);
const fillCmp = (page, v) => page.evaluate(v => { for (const [k, x] of Object.entries(v)) document.getElementById('nl-' + k).value = String(x); }, v);
const runCmp = async page => { await page.evaluate(() => document.getElementById('nl-go').click()); await page.waitForFunction(() => document.getElementById('nl-go').getAttribute('aria-busy') !== 'true' && (!document.getElementById('nl-out').hidden || !document.getElementById('nl-msg').hidden), null, { timeout: 30000 }); };
const panelPx = (page, id, pts) => page.evaluate(([id, pts]) => { const c = document.getElementById('nl-cv-' + id); if (!c) return null; const g = c.getContext('2d'); return { w: c.width, h: c.height, px: pts.map(([x, y]) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3)) }; }, [id, pts]);
const clickPx = (page, id, sx, sy, w = 120) => page.evaluate(([id, sx, sy, w]) => { const c = document.getElementById('nl-cv-' + id), r = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (sx + .5) / w * r.width, clientY: r.top + (sy + .5) / w * r.height })); return document.getElementById('nl-read').textContent; }, [id, sx, sy, w]);
const shot = async (page, name, sel) => { if (!process.env.SHOTS) return; const f = path.join(process.env.SHOTS, name + '.png'); if (sel) { const e = await page.$(sel); await e.scrollIntoViewIfNeeded(); await e.screenshot({ path: f }); } else await page.screenshot({ path: f }); };   // SHOTS=<dir>: pictures for the review packet; never part of a check
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const NODATA = NLL.NL.NODATA, NOREL = NLL.NL.NOREL, isIn = (c, set) => set.some(s => same(s, c));
const RECFORM = { lat: '15.10', lng: '145.70', span: '0.5' };
let BASE;

(async () => {
  const srv = http.createServer((q, r) => { const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html'; const full = path.join(ROOT, f);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { r.writeHead(404); return r.end(); }
    const type = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' }[f.split('.').pop()] || 'application/octet-stream';
    r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); r.end(/\.(js|html|css)$/.test(f) ? served(f) : fs.readFileSync(full)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ===== A. fresh load; B. on (newest still arriving); off
  { const gibs = newGibs(); const { ctx, page, errs } = await setup(browser, gibs);
    await page.waitForTimeout(600);
    let s = await st(page); const url0 = await backdrop(page), img0 = await page.$eval('#imgdate', e => e.innerHTML), key0 = await page.evaluate(() => ME.keyState().drawn.length);
    ok('A load: layer off; no night-light, cloud or key request; backdrop is the true-colour picture', nl(gibs).length === 0 && s.on === false && s.status === 'off' && s.backdrop === 'unchanged' && /CorrectedReflectance_TrueColor/.test(url0), [nl(gibs), s.status, url0]);
    ok('A card: name, Observed tag, a switch that is off, state "off"', await page.$eval('#card-nl', c => /Night lights/.test(c.querySelector('.ovl-h').textContent) && !!c.querySelector('.ev.obs') && c.querySelector('#tgl-nl').getAttribute('role') === 'switch' && c.querySelector('#tgl-nl').getAttribute('aria-checked') === 'false' && c.querySelector('#s-nl').textContent === 'off'));
    const card = await txt(page, '#card-nl');
    ok('A card carries the as-measured line, the latest-date rule, the no-data rule and NASA\'s local-scale caveat', /Light as measured at the satellite\. Moonlight, cloud, fires, lightning, boats and the viewing angle all change it\./.test(card) && /no more than 1% missing/.test(card) && /drawn as a pattern, never as dark/.test(card) && /NASA: not for tactical decisions or local-scale conditions\./.test(card), card.slice(0, 300));
    ok('A light, not power: the card never says outage, blackout or power', !/outage|blackout|power/i.test(card), (card.match(/.{20}(outage|blackout|power).{20}/i) || [])[0]);
    ok('A compare form: two dates preset, both inside the layer\'s range, a place preset from the globe view, no result shown', await page.evaluate(() => { const v = id => document.getElementById('nl-' + id).value; const a = v('a'), b = v('b'), t = new Date().toISOString().slice(0, 10); return /^\d{4}-\d\d-\d\d$/.test(a) && a < b && b < t && a >= '2024-03-25' && document.getElementById('nl-a').min === '2024-03-25' && Number.isFinite(parseFloat(v('lat'))) && Number.isFinite(parseFloat(v('lng'))) && document.getElementById('nl-out').hidden; }));
    await toggle(page); s = await st(page);
    ok('B on: the key, then the newest date, then the one before it, then the full frame for the chosen date — nothing else', same(nl(gibs), ['key:VIIRS_DayNightBand_At_Sensor_Radiance.xml', 'light:2026-11-15:-90,-180,90,180:512x256', 'light:2026-11-14:-90,-180,90,180:512x256', 'light:2026-11-14:-90,-180,90,180:2048x1024']), nl(gibs));
    ok('B the rule picks 14 Nov; 15 Nov is still arriving (half its 30°S–30°N band missing)', s.on && s.status === 'ready' && s.date === '2026-11-14' && same(s.arriving, ['2026-11-15']) && s.probes[0].missing === 0.5 && s.probes[1].missing === 0 && s.missing === 0, s);
    const status = await txt(page, '#nl-status');
    ok('B card: "Showing 14 Nov 2026 (UTC)", source, and "15 Nov 2026 is still arriving. Showing 14 Nov 2026."', /^Showing 14 Nov 2026 \(UTC\) · NASA GIBS, VIIRS NOAA-20/.test(status) && /15 Nov 2026 is still arriving\. Showing 14 Nov 2026\./.test(status) && /Light as measured at the satellite/.test(status), status);
    ok('B the date on the card is the date in the full-frame request', nl(gibs).filter(r => /2048x1024/.test(r)).every(r => r.split(':')[1] === s.date) && status.includes('14 Nov 2026'));
    ok('B switch checked, state "on"; the backdrop is now the night-light picture', await page.$eval('#tgl-nl', b => b.getAttribute('aria-checked') === 'true') && await txt(page, '#s-nl') === 'on' && /^blob:/.test(await backdrop(page)) && s.backdrop === 'night lights');
    const img = await txt(page, '#imgdate');
    ok('B the imagery line on the globe names night lights, its date and the pattern', /Imagery: night lights 14 Nov 2026 \(NASA GIBS, VIIRS NOAA-20\) — light measured at night on that UTC date, not live · patterned areas: no data/.test(img), img);
    const t = await texPx(page, [[11, 21], [0, -100], [-80, 10], [-80, 10.2], [-89, 100]]);
    ok('B picture: 2048 × 1024; the lit block is white; dark measured light stays NASA\'s darkest grey', t.w === 2048 && t.h === 1024 && same(t.px[0], [255, 255, 255, 255]) && same(t.px[1], [7, 7, 7, 255]), t);
    ok('B picture: no data south of 60°S is the no-data pattern, opaque — never black, never the dark grey', [t.px[2], t.px[4]].every(p => p[3] === 255 && isIn(p.slice(0, 3), NODATA)), t.px);
    const lg = await txt(page, '#nl-legend');
    ok('B legend: source, date, the published scale ending "38.2 or more", the no-data pattern named', await page.$eval('#nl-legend', e => !e.hidden) && /Night lights · NASA GIBS, VIIRS NOAA-20 · 14 Nov 2026 \(UTC\)/.test(lg) && /Light measured, nW\/\(cm² sr\)/.test(lg) && /38\.2 or more/.test(lg) && /No data: no night pass, or the frame has not arrived/.test(lg) && await page.$$eval('#nl-legend .nl-sw', e => e.length) === 8, lg);
    ok('B legend swatches are NASA\'s own greys (0 → 7,7,7; 38.2 → white)', await page.$$eval('#nl-legend .nl-scale .nl-sw', e => [e[0].style.background, e[e.length - 1].style.background]).then(a => /rgb\(7, 7, 7\)/.test(a[0]) && /rgb\(255, 255, 255\)/.test(a[1])));
    await page.waitForTimeout(process.env.SHOTS ? 2500 : 0); await shot(page, 'B-globe-on');
    const k1 = await page.evaluate(() => ME.keyState());
    ok('B "Key · N layers" counts night lights as one', k1.drawn.includes('nightlights') && k1.drawn.length === key0 + 1 && /night lights as one/.test(await txt(page, '#key-def')), k1);
    const before = nl(gibs).length; await toggle(page); s = await st(page);
    ok('B off: the true-colour picture is back, the imagery line is exactly as it was, legend hidden, Key count back, no request made', await backdrop(page) === url0 && await page.$eval('#imgdate', e => e.innerHTML) === img0 && await page.$eval('#nl-legend', e => e.hidden) && (await page.evaluate(() => ME.keyState().drawn.length)) === key0 && nl(gibs).length === before && s.status === 'off' && s.date === null, [await backdrop(page), s]);
    ok('B no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // ===== C. newest complete; D. two newest arriving; E. none complete
  { const gibs = newGibs(); gibs.global['2026-11-15'] = 'complete'; const { ctx, page } = await setup(browser, gibs);
    await toggle(page); const s = await st(page), status = await txt(page, '#nl-status');
    ok('C newest complete: 15 Nov is shown; one probe and one full frame; no "still arriving" sentence', s.date === '2026-11-15' && s.arriving.length === 0 && nl(gibs).filter(r => r.startsWith('light:')).length === 2 && /^Showing 15 Nov 2026 \(UTC\)/.test(status) && !/arriving/.test(status), [s, status]);
    await ctx.close(); }
  { const gibs = newGibs(); gibs.global['2026-11-14'] = 'filling'; const { ctx, page } = await setup(browser, gibs);
    await toggle(page); const s = await st(page), status = await txt(page, '#nl-status');
    ok('D two newest still arriving: 13 Nov is shown and both are named', s.date === '2026-11-13' && same(s.arriving, ['2026-11-15', '2026-11-14']) && /15 Nov 2026 and 14 Nov 2026 are still arriving\. Showing 13 Nov 2026\./.test(status), [s, status]);
    await ctx.close(); }
  { const gibs = newGibs(); for (const d of Object.keys(gibs.global)) gibs.global[d] = 'filling'; const { ctx, page } = await setup(browser, gibs);
    const url0 = await backdrop(page); await toggle(page); const s = await st(page), status = await txt(page, '#nl-status');
    ok('E no complete frame in four dates: says so, names them as still arriving, draws nothing, switch back off', s.on === false && s.status === 'unavailable' && /^No complete night frame yet: 15 Nov 2026, 14 Nov 2026, 13 Nov 2026, 12 Nov 2026 are still arriving\. Nothing is drawn\.$/.test(status) && await backdrop(page) === url0 && await page.$eval('#tgl-nl', b => b.getAttribute('aria-checked') === 'false') && nl(gibs).filter(r => /2048/.test(r)).length === 0, [s.status, status]);
    await ctx.close(); }

  // ===== F. a failed request is a failure, never "still arriving"; G. blocked pixel access; H. off while loading
  for (const [f, want] of [[503, /^Night lights could not be loaded: NASA GIBS answered HTTP 503 for 15 Nov 2026\. Nothing is drawn\.$/], ['abort', /^Night lights could not be loaded: NASA GIBS did not answer for 15 Nov 2026\. Nothing is drawn\.$/], ['xml', /^Night lights could not be loaded: NASA GIBS answered without a picture for 15 Nov 2026\. Nothing is drawn\.$/]]) {
    const gibs = newGibs(); gibs.fault['2026-11-15'] = f; const { ctx, page } = await setup(browser, gibs);
    const url0 = await backdrop(page); await toggle(page); const s = await st(page), status = await txt(page, '#nl-status');
    ok(`F failed request (${f}): its own failure message, not "arriving"; no fallback to an older date; nothing drawn`, want.test(status) && !/arriving/.test(status) && s.status === 'unavailable' && s.on === false && await backdrop(page) === url0 && nl(gibs).filter(r => /2026-11-14/.test(r)).length === 0, [status, nl(gibs)]);
    await ctx.close(); }
  { const gibs = newGibs(); gibs.fault['2026-11-14'] = 500; const { ctx, page } = await setup(browser, gibs);
    await toggle(page); const status = await txt(page, '#nl-status');
    ok('F a failure behind an arriving date is still a failure (for 14 Nov), not a third date', /NASA GIBS answered HTTP 500 for 14 Nov 2026/.test(status) && nl(gibs).filter(r => /2026-11-13/.test(r)).length === 0, [status, nl(gibs)]);
    await ctx.close(); }
  { const gibs = newGibs(); gibs.keyFault = 503; const { ctx, page } = await setup(browser, gibs);
    await toggle(page); const status = await txt(page, '#nl-status');
    ok('F NASA\'s key cannot be loaded: says so; no picture is requested or guessed', /NASA's key for the picture could not be loaded/.test(status) && nl(gibs).filter(r => r.startsWith('light:')).length === 0, [status, nl(gibs)]);
    await ctx.close(); }
  { const gibs = newGibs(); const { ctx, page } = await setup(browser, gibs);
    const url0 = await backdrop(page); await page.evaluate(() => { window.__blockRead = 'TIME=2026-11-15'; }); await toggle(page); const s = await st(page), status = await txt(page, '#nl-status');
    ok('G the browser blocks reading the picture: the blocked message, nothing drawn', /^Night lights cannot be shown: this browser blocked reading the picture's values, so missing areas could not be told from dark ones\. Nothing is drawn\.$/.test(status) && s.status === 'unavailable' && await backdrop(page) === url0, [status]);
    await ctx.close(); }
  { const gibs = newGibs(); let release; gibs.hold = new Promise(r => release = r); const { ctx, page } = await setup(browser, gibs);
    const url0 = await backdrop(page);
    await page.evaluate(() => document.getElementById('tgl-nl').click()); await page.waitForFunction(() => ME.nightLights.state().status === 'loading');
    ok('H while loading: "Finding the newest complete night frame…", switch busy', /Finding the newest complete night frame/.test(await txt(page, '#nl-status')) && await page.$eval('#tgl-nl', b => b.getAttribute('aria-busy') === 'true'));
    await page.evaluate(() => document.getElementById('tgl-nl').click()); release(); gibs.hold = null; await page.waitForTimeout(1500); const s = await st(page);
    ok('H switched off while loading: never draws, backdrop untouched, state off', s.status === 'off' && s.on === false && await backdrop(page) === url0 && s.backdrop === 'unchanged', s);
    await ctx.close(); }

  // ===== J. the recorded Saipan and Tinian pair through the page
  { const gibs = newGibs(); const { ctx, page, errs } = await setup(browser, gibs);
    await fillCmp(page, { ...RECFORM, a: '2026-04-20', b: '2026-03-19' });   // entered the wrong way round on purpose: the earlier night is always first
    await runCmp(page);
    const r = nl(gibs), frames = r.filter(x => !x.startsWith('key:'));
    ok('J requests: both keys and exactly four pictures — light and clear-sky for each night', r.filter(x => x.startsWith('key:')).length === 2 && frames.length === 4 && ['light:2026-03-19', 'clear:2026-03-19', 'light:2026-04-20', 'clear:2026-04-20'].every(p => frames.some(f => f.startsWith(p))), r);
    ok('J alignment at the request: all four use the same box and the same pixel grid (south,west,north,east; 120 × 120)', frames.every(f => f.endsWith(`:${RECBOX}:120x120`)), frames);
    ok('J no whole-globe request is made by a comparison, and the globe layer stays off', !r.some(x => /-90,-180/.test(x)) && (await st(page)).on === false);
    const out = await txt(page, '#nl-out');
    ok('J captions: the earlier night first, each with its UTC date', same(await page.$$eval('#nl-out figcaption', e => e.map(x => x.textContent)), ['19 Mar 2026 (UTC)', '20 Apr 2026 (UTC)']));
    const sh = await txt(page, '#nl-shares');
    ok('J the three shares, of the area in view', sh === 'Readable on 19 Mar 2026: 57% · Readable on 20 Apr 2026: 92% · Usable on both: 50% — of the area in view', sh);
    const res = await page.evaluate(() => { const c = ME.nightLights.result(), t = c.tally; return { t, la: [...c.a.light], lb: [...c.b.light], st: [...c.states], w: c.w, box: c.box }; });
    ok('J shares equal the counts: 8,273 and 13,208 readable, 7,258 usable on both, of 14,400; usable on both is the smallest', res.t.readA === 8273 && res.t.readB === 13208 && res.t.both === 7258 && res.t.n === 14400 && res.t.both <= Math.min(res.t.readA, res.t.readB) && res.t.noData === 0, res.t);
    const slice = (l, b) => { let t = 0; const B = res.box, x0 = Math.floor((b.w - B.w) / 0.5 * 120), x1 = Math.ceil((b.e - B.w) / 0.5 * 120), y0 = Math.floor((B.n - b.n) / 0.5 * 120), y1 = Math.ceil((B.n - b.s) / 0.5 * 120); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) t += Math.max(0, l[y * 120 + x]); return t; };
    const SAIPAN = { s: 15.09, n: 15.30, w: 145.68, e: 145.84 };
    ok('J fixture (harness only): what the page decoded gives the recorded Saipan totals, 2,854.1 and 769.9', slice(res.la, SAIPAN) === 28541 && slice(res.lb, SAIPAN) === 7699, [slice(res.la, SAIPAN), slice(res.lb, SAIPAN)]);
    ok('J no radiance total, percentage change or difference is printed; light, not power', !/2,?85\d|76\d\.\d|770|total|less light|more light|difference|change/i.test(sh + ' ' + (await txt(page, '#nl-out .nl-where'))) && !/outage|blackout|power/i.test(out), out.slice(0, 200));
    ok('J the threshold is labelled as a preview choice; the as-measured line and NASA\'s local-scale caveat travel with the result', /Preview threshold: clear-sky confidence 0\.95 or more on both nights\. Chosen for this preview; not a NASA standard\./.test(out) && /Light as measured at the satellite/.test(out) && /NASA: not for tactical decisions or local-scale conditions\./.test(out));
    ok('J key: the same fixed scale on both, white is 38.2 or more, both patterns named', /the same fixed scale on both pictures · white is 38\.2 or more/.test(out) && /No reliable comparison/.test(out) && /No data/.test(out) && await page.$$eval('#nl-out .nl-p-norel, #nl-out .nl-p-nodata', e => e.length) === 2);
    // pixels: pick a usable bright one, a usable pair at the top of the scale, and a withheld one, from the decoded result
    const iTop = res.la.findIndex((v, i) => v === 382 && res.st[i] === 0), iUse = res.la.findIndex((v, i) => v >= 50 && v < 382 && res.st[i] === 0), iNo = res.st.findIndex(x => x === 1);
    const xy = i => [i % 120, (i / 120) | 0], grey = t => LIGHT.get(t);
    const pa = await panelPx(page, 'a', [iUse, iTop, iNo].map(i => xy(i).map(v => v * 3 + 1))), pb = await panelPx(page, 'b', [iUse, iTop, iNo].map(i => xy(i).map(v => v * 3 + 1)));
    ok('J panels are 360 × 360 (each source pixel a 3 × 3 block)', pa.w === 360 && pa.h === 360 && pb.w === 360);
    ok('J a usable pixel is drawn with NASA\'s own grey for its value, on each night', same(pa.px[0], grey(res.la[iUse])) && same(pb.px[0], grey(res.lb[iUse])) && same(pa.px[1], [255, 255, 255]), [pa.px, pb.px, res.la[iUse], res.lb[iUse]]);
    ok('J a withheld pixel is the "No reliable comparison" stripe on BOTH panels, never a grey', isIn(pa.px[2], NOREL) && isIn(pb.px[2], NOREL) && same(pa.px[2], pb.px[2]), [pa.px[2], pb.px[2]]);
    let rd = await clickPx(page, 'a', ...xy(iUse));
    ok('J tap a usable pixel: place, both dates with their values and unit, "usable on both nights"', new RegExp(`^15\\.\\d{3}° N, 145\\.\\d{3}° E · 19 Mar 2026: ${(res.la[iUse] / 10).toFixed(1)} nW/\\(cm² sr\\) · 20 Apr 2026: ${(res.lb[iUse] / 10).toFixed(1)} nW/\\(cm² sr\\) · usable on both nights$`).test(rd), rd);
    rd = await clickPx(page, 'b', ...xy(iTop));
    ok('J a pixel at the top of the scale reads "38.2 or more"', /19 Mar 2026: 38\.2 or more nW\/\(cm² sr\)/.test(rd), rd);
    rd = await clickPx(page, 'a', ...xy(iNo));
    ok('J tap a withheld pixel: "No reliable comparison", and no light value at all', /No reliable comparison: clear-sky confidence is below 0\.95, or absent, on at least one night\. No light value is shown\.$/.test(rd) && !/nW|\d\.\d (nW|or more)/.test(rd.replace(/15\.\d{3}° N, 145\.\d{3}° E/, '')), rd);
    ok('J the marker sits on the same pixel of both panels', await page.evaluate(() => { const a = document.getElementById('nl-mk-a'), b = document.getElementById('nl-mk-b'); return !a.hidden && !b.hidden && a.style.left === b.style.left && a.style.top === b.style.top; }));
    await page.focus('#nl-cv-a'); const before = await txt(page, '#nl-read'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
    ok('J keyboard: the picture takes focus and the arrow keys read the next pixel', await page.evaluate(() => document.activeElement.id === 'nl-cv-a') && (await txt(page, '#nl-read')) !== before);
    ok('J each picture has a text name with its date and box', await page.$eval('#nl-cv-a', c => c.getAttribute('role') === 'img' && /Night lights, 19 Mar 2026, 14\.85° N to 15\.35° N, 145\.45° E to 145\.95° E/.test(c.getAttribute('aria-label'))));
    await shot(page, 'J-compare-saipan', '#card-nl');
    // ===== K. 15 April: light measured, zero clear-sky confidence
    await fillCmp(page, { ...RECFORM, a: '2026-04-15', b: '2026-04-20' }); await runCmp(page);
    const shK = await txt(page, '#nl-shares'), pk = await panelPx(page, 'a', [[10, 10], [181, 200], [300, 55], [359, 359], [0, 359]]), pk2 = await panelPx(page, 'b', [[10, 10], [181, 200], [300, 55]]);
    ok('K 15 April against 20 April: nothing readable on 15 April, nothing usable on both', shK === 'Readable on 15 Apr 2026: 0% · Readable on 20 Apr 2026: 92% · Usable on both: 0% — of the area in view', shK);
    ok('K the whole view is "No reliable comparison" on both panels', pk.px.every(p => isIn(p, NOREL)) && pk2.px.every(p => isIn(p, NOREL)), [pk.px, pk2.px]);
    rd = await clickPx(page, 'b', 60, 60);
    ok('K no light value is readable anywhere, although 20 April measured light there', /No reliable comparison/.test(rd) && !/nW/.test(rd), rd);
    ok('J/K no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // ===== L. three states in one view (GPT's fixture); M. one date fails; stale content; N. blocked
  { const gibs = newGibs(); const { ctx, page, errs } = await setup(browser, gibs);
    await fillCmp(page, { lat: '0', lng: '0', span: '0.5', a: TRI.a, b: TRI.b }); await runCmp(page);
    const sh = await txt(page, '#nl-shares'), t = (await st(page)).compare.tally;
    ok('L counts: readable 14,400 and 4,800; usable on both 4,800; no data 4,800; no reliable 4,800', t.readA === 14400 && t.readB === 4800 && t.both === 4800 && t.noData === 4800 && t.noRel === 4800 && t.n === 14400, t);
    ok('L printed shares equal the counts', sh === 'Readable on 1 May 2026: 100% · Readable on 2 May 2026: 33% · Usable on both: 33% — of the area in view', sh);
    const pts = [[100, 50], [100, 180], [100, 300]], pa = await panelPx(page, 'a', pts), pb = await panelPx(page, 'b', pts);
    ok('L usable rows: the measured light on each night', same(pa.px[0], LIGHT.get(100)) && same(pb.px[0], LIGHT.get(10)), [pa.px[0], pb.px[0]]);
    ok('L GPT fixture: a valid dark pixel on the first night with a transparent one on the second is "No data" on BOTH panels — not the dark grey on the first', isIn(pa.px[1], NODATA) && isIn(pb.px[1], NODATA) && !same(pa.px[1], LIGHT.get(0)), [pa.px[1], pb.px[1]]);
    ok('L light on both with confidence 0.94 on one night: "No reliable comparison" on both panels', isIn(pa.px[2], NOREL) && isIn(pb.px[2], NOREL), [pa.px[2], pb.px[2]]);
    const rowA = await page.evaluate(() => { const g = document.getElementById('nl-cv-a').getContext('2d'); const row = y => { const d = g.getImageData(0, y, 48, 1).data, s = []; for (let x = 0; x < 48; x++) s.push(d[x * 4]); return s; }; return { nodata: row(180), norel: row(300) }; });
    const runs = a => { const r = []; let n = 1; for (let i = 1; i < a.length; i++) { if (a[i] === a[i - 1]) n++; else { r.push(n); n = 1; } } return r.slice(1); };
    ok('L the two patterns differ in shape, not only colour: checker runs of 4, stripe runs of 3', runs(rowA.nodata).every(n => n === 4) && runs(rowA.norel).every(n => n === 3) && runs(rowA.nodata).length > 4 && runs(rowA.norel).length > 4, [runs(rowA.nodata), runs(rowA.norel)]);
    ok('L neither pattern uses a colour of the light scale', [...NODATA, ...NOREL].every(c => !(c[0] === c[1] && c[1] === c[2])));
    await shot(page, 'L-three-states', '#nl-out');
    let rd = await clickPx(page, 'a', 60, 60);
    ok('L tap the no-data rows: "No data on at least one night", no light value — although the first night measured 0.0 there', /No data on at least one night: no night pass, or the frame has not arrived\. No light value is shown\.$/.test(rd) && !/nW/.test(rd), rd);
    // M. one date fails
    gibs.fault['light:' + TRI.b] = 503; await runCmp(page);
    const outM = await txt(page, '#nl-out'), shM = await txt(page, '#nl-shares');
    ok('M one night fails: its own message in its own place; the other night is drawn', /The 2 May 2026 frame could not be loaded: NASA GIBS answered HTTP 503\. Nothing is drawn for it\./.test(outM) && await page.$('#nl-cv-a') !== null && await page.$('#nl-cv-b') === null, outM.slice(0, 300));
    ok('M one night fails: only that night\'s readable share; no "usable on both"; no comparison made', shM === 'Readable on 1 May 2026: 100% of the area in view · The 2 May 2026 frame could not be loaded, so no comparison is made.' && !/Usable on both/.test(outM), shM);
    const pm = await panelPx(page, 'a', [[100, 50], [100, 180]]);
    ok('M the loaded night stands on its own: its measured dark pixels are drawn as measured (nothing borrowed from the earlier answer)', same(pm.px[0], LIGHT.get(100)) && same(pm.px[1], LIGHT.get(0)), pm.px);
    rd = await clickPx(page, 'a', 60, 60);
    ok('M a tap on the loaded night says no comparison is made', /1 May 2026: 0\.0 nW\/\(cm² sr\) · readable on this night; the other night could not be loaded, so no comparison is made$/.test(rd), rd);
    // stale content: start another comparison and look while it is still loading
    delete gibs.fault['light:' + TRI.b]; let release; gibs.hold = new Promise(r => release = r);
    await page.evaluate(() => document.getElementById('nl-go').click()); await page.waitForFunction(() => document.getElementById('nl-go').getAttribute('aria-busy') === 'true');
    ok('M while a new comparison loads, nothing from the earlier answer stays on screen', await page.evaluate(() => { const o = document.getElementById('nl-out'); return o.hidden && o.innerHTML === '' && !document.getElementById('nl-cv-a') && /Loading the two nights from NASA GIBS/.test(document.getElementById('nl-msg').textContent); }));
    release(); gibs.hold = null; await page.waitForFunction(() => !document.getElementById('nl-out').hidden, null, { timeout: 30000 });
    ok('M after it loads: both nights and the three shares again', (await txt(page, '#nl-shares')).startsWith('Readable on 1 May 2026: 100% · Readable on 2 May 2026: 33% · Usable on both: 33%'));
    // N. blocked
    await page.evaluate(d => { window.__blockRead = 'Clear_Sky_Confidence_Night&STYLES=&CRS=EPSG:4326&BBOX=-0.25,-0.25,0.25,0.25&WIDTH=120&HEIGHT=120&FORMAT=image/png&TRANSPARENT=TRUE&TIME=' + d; }, TRI.a); await runCmp(page); const outN = await txt(page, '#nl-out');
    ok('N the browser blocks reading a picture: says so, shows no shares and no picture', outN === "This browser blocked reading the pictures' values, so nothing can be compared. No shares are shown." && await page.$('#nl-shares') === null && await page.$('#nl-out canvas') === null, outN);
    await page.evaluate(() => { window.__blockRead = null; }); gibs.fault = { ['light:' + TRI.a]: 'abort', ['light:' + TRI.b]: 'abort' }; await runCmp(page);
    ok('N both nights fail: one failure message, nothing drawn', /^Neither night could be loaded: NASA GIBS did not answer\. Nothing is drawn\.$/.test(await txt(page, '#nl-out')));
    ok('L/M/N no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // ===== O. dates and places outside the range are refused before any request
  { const gibs = newGibs(); const { ctx, page } = await setup(browser, gibs);
    const tryIt = async v => { await fillCmp(page, { ...RECFORM, a: '2026-03-19', b: '2026-04-20', ...v }); await runCmp(page); return txt(page, '#nl-msg'); };
    const RANGE = 'Night lights are held from 25 Mar 2024 to 15 Nov 2026 (UTC dates). Choose two dates in that range.';
    ok('O a date before the layer starts is refused with the range', await tryIt({ a: '2024-03-24' }) === RANGE);
    ok('O a date after today (UTC) is refused with the range', await tryIt({ b: '2026-11-16' }) === RANGE);
    ok('O an empty date is refused with the range', await tryIt({ a: '' }) === RANGE);
    ok('O the same night twice is refused', await tryIt({ a: '2026-04-20' }) === 'Choose two different nights.');
    ok('O a latitude off the map is refused', await tryIt({ lat: '95' }) === 'Give a latitude from −90 to 90 and a longitude from −180 to 180.');
    ok('O none of those made a request, and no result is shown', nl(gibs).length === 0 && await page.$eval('#nl-out', e => e.hidden), nl(gibs));
    ok('O today (UTC) is allowed: a frame still arriving shows as no data rather than being refused', await page.evaluate(() => { document.getElementById('nl-b').value = '2026-11-15'; document.getElementById('nl-a').value = '2026-04-20'; document.getElementById('nl-lat').value = '15.10'; return true; }) && (await (async () => { await runCmp(page); return nl(gibs).some(r => /2026-11-15/.test(r)); })()));
    await ctx.close(); }

  // ===== P. without WebGL; Q. phone width
  { const gibs = newGibs(); const { ctx, page, errs } = await setup(browser, gibs, { noWebGL: true });
    await toggle(page); const status = await txt(page, '#nl-status');
    ok('P no 3-D globe: the layer says so, asks NASA for nothing, and points to the comparison', /Night lights on the globe needs the 3-D globe, which is not available in this browser\. Nothing is drawn\. The comparison below still works\./.test(status) && nl(gibs).length === 0 && await page.$eval('#tgl-nl', b => b.getAttribute('aria-checked') === 'false'), [status, nl(gibs)]);
    await page.evaluate(() => document.getElementById('nl-here').click());
    ok('P "Use the centre of the globe view" without a globe says there is no view to read', /The globe is unavailable in this browser, so there is no view to read\. Type a latitude and longitude instead\./.test(await txt(page, '#nl-msg')));
    await fillCmp(page, { ...RECFORM, a: '2026-03-19', b: '2026-04-20' }); await runCmp(page);
    ok('P the comparison works without WebGL: dates, shares, caveats and source are all there', (await txt(page, '#nl-shares')).startsWith('Readable on 19 Mar 2026: 57%') && /Preview threshold/.test(await txt(page, '#nl-out')) && /NASA GIBS/.test(await txt(page, '#card-nl')));
    ok('P no page errors without WebGL', errs.length === 0, errs);
    await ctx.close(); }
  { const gibs = newGibs(); const { ctx, page, errs } = await setup(browser, gibs, { viewport: { width: 390, height: 844 } });
    await fillCmp(page, { ...RECFORM, a: '2026-03-19', b: '2026-04-20' }); await runCmp(page);
    const m = await page.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const ctl = [...document.querySelectorAll('#nl-form input, #nl-form select, #nl-form button')].map(e => Math.round(e.getBoundingClientRect().height));
      return { ctl, tgl: Math.round(r('#tgl-nl').height), docW: document.documentElement.scrollWidth, vw: innerWidth, cvA: r('#nl-cv-a').width, cardR: r('#card-nl').right, outR: Math.max(...[...document.querySelectorAll('#nl-out *')].map(e => e.getBoundingClientRect().right)) }; });
    ok('Q 390 px: every control is at least 44 px tall', m.ctl.every(h => h >= 44) && m.tgl >= 44, m);
    ok('Q 390 px: nothing overflows sideways; the pictures fit inside the card', m.docW <= m.vw && m.outR <= m.cardR + 1 && m.cvA > 100 && m.cvA <= 360, m);
    await shot(page, 'Q-phone-compare');
    ok('Q 390 px: shares and dates are in the page text', (await txt(page, '#nl-shares')).includes('Usable on both: 50%') && (await txt(page, '#nl-out')).includes('19 Mar 2026 (UTC)'));
    await toggle(page);
    ok('Q 390 px: the layer switches on and the short imagery label names night lights', (await st(page)).status === 'ready' && /Night lights 14 Nov/.test(await page.$eval('#imgdate .img-short', e => e.textContent)), await txt(page, '#imgdate'));
    ok('Q no page errors at 390 px', errs.length === 0, errs);
    await ctx.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`\nnight-lights ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite crashed: ' + (e && e.stack || e)); process.exit(1); });
