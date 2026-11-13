/* Dust RGB imagery — page suite (DUST-RGB-LAYER-PROPOSAL rev 5 §5, §8; branch dustrgb-rc).
 * The real page files are served by the suite's own static server; the hub is a fixture whose pointer and files the tests
 * control (same shapes the real hub produces — see dustrgb-hub.test.mjs). EUMETSAT is never contacted by the page.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/dustrgb-ui.test.cjs
 * BREAK=<name> weakens the served dustrgb.js; each must fail:
 *   eager refresh-when-off no-verify swap-early late-paint keep-forever refetch-same clear-on-fail hidden-refresh frame-word no-mask no-outline fetch-when-old no-wait no-fallback fallback-silent fallback-old refetch-bad old-wording body-uncaught */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const http = require('http'); const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'); const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 10 min'); process.exit(1); }, 10 * 60e3);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

const BREAKS = {
  'eager': [['  paint();\n})();', '  paint(); const iv = setInterval(() => { if (ME.globe && ME.globe()) { clearInterval(iv); setOn(true); } }, 50);\n})();']],
  'refresh-when-off': [['    if (!st.on || st.loading) return;', '    if (st.loading) return;']],
  'no-verify': [["    if (b.byteLength !== f.bytes || await hex(b) !== f.sha256) throw fileErr('a frame file did not match its fingerprint', true);", '']],
  'swap-early': [['      let built, err = null;\n      try { built = await prepare(f, gen); }', '      let built, err = null; if (st.frame) { st.frame = f; paint(); }\n      try { built = await prepare(f, gen); }']],
  'late-paint': [['if (gen !== st.gen) return null;', '', 'all'], ['const late = () => gen !== st.gen || !st.on;', 'const late = () => false;'], ['    } finally { if (gen === st.gen) { st.loading = false; paint(); } }', '    } finally { st.loading = false; paint(); }']],
  'keep-forever': [["    if (st.frame && grade(st.frame) === 'unknown') clearFrame(", "    if (false) clearFrame("]],
  'refetch-same': [['      if (st.frame && st.frame.id === f.id) { st.refreshFailed = false; return; }', '']],
  'clear-on-fail': [['if (st.frame) st.refreshFailed = true; else {', 'destroy(); st.frame = null; {', 'all']],
  'hidden-refresh': [['st.timer = setInterval(() => { if (!document.hidden) refresh(false); }, DR.REFRESH_MS);', 'st.timer = setInterval(() => { refresh(false); }, DR.REFRESH_MS);']],
  'frame-word': [["${f.served_time ? 'Frame' : 'Frame requested'}", 'Frame']],
  'no-mask': [["    c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0, N, N);        // keep", '    // keep']],
  'no-outline': [["    c.globalCompositeOperation = 'source-over'; c.drawImage(ring, 0, 0);", "    c.globalCompositeOperation = 'source-over';"]],
  'no-wait': [['if (Date.now() - t0 > DR.BUILD_WAIT_MS) break;', 'break;']],
  'no-fallback': [["const prev = err.file && meta.previous && meta.previous.id !== f.id ? { box: f.box, served_time: null, ...meta.previous } : null;", 'const prev = null;']],
  'fallback-silent': [["      if (st.fallback) bits.push('The latest frame could not be shown; this is the previous one.');\n", '']],
  'fallback-old': [["      if (prev && grade(prev) !== 'unknown') {", '      if (prev) {']],
  'refetch-bad': [['      if (err.bad) st.badId = f.id;\n', '']],
  'old-wording': [['m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;', 'm < 60 ? `${m} min old` : `${Math.floor(m / 60)} h old`;']],
  'body-uncaught': [["    let b; try { b = await r.arrayBuffer(); } catch (e) { throw fileErr('a frame file could not be loaded', false); }", '    let b = await r.arrayBuffer();']],
  'fetch-when-old': [["      if (grade(f) === 'unknown') {", '      if (false) {']],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const served = file => { let t = fs.readFileSync(path.join(ROOT, file), 'utf8'); if (BREAK && file === 'dustrgb.js') for (const [a, b, all] of BREAKS[BREAK]) { const u = all ? t.split(a).join(b) : t.replace(a, b); if (u === t) { console.log('FAIL  break did not apply: ' + BREAK + ' / ' + a.slice(0, 50)); process.exit(1); } t = u; } return t; };

// ---------- fixtures: two pictures, one disc-shaped mask
const PIC = { a: fs.readFileSync(path.join(__dirname, 'dustrgb-fixtures/picture-a.jpg')), b: fs.readFileSync(path.join(__dirname, 'dustrgb-fixtures/picture-b.jpg')) };
// a picture with every marker in place (tables, frame size, scan header, end marker) whose compressed data is ruined: it passes the hub's structure check and no browser can decode it
PIC.bad = (() => { const b = Buffer.from(PIC.a); let i = 2; while (b[i + 1] !== 0xda) i += 2 + ((b[i + 2] << 8) | b[i + 3]); b.fill(0x55, i + 40, b.length - 2); return b; })();
const MASK = (() => { const p = new PNG({ width: 160, height: 160 }); for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const i = (y * 160 + x) * 4, inside = Math.hypot(x - 79.5, y - 79.5) <= 72; p.data[i] = 90; p.data[i + 1] = 90; p.data[i + 2] = 200; p.data[i + 3] = inside ? 255 : 0; } return PNG.sync.write(p); })();
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();
const frame = (t, pic, extra = {}) => { const id = t.replace(/[-:]/g, '').replace(/00Z$/, 'Z') + '-' + sha(Buffer.from(sha(PIC[pic]) + ':' + sha(MASK))).slice(0, 16); /* the hub's pair id: time + a fingerprint of both files */ return { id, requested_time: t, served_time: null, served_time_source: null, time_basis: 'requested time only', fetched_at: t, box: { south: -80, west: -80, north: 80, east: 80 }, crs: 'EPSG:4326',
  picture: { file: 'picture.jpg', path: `/snapshot/dustrgb/${id}/picture.jpg`, type: 'image/jpeg', bytes: PIC[pic].length, sha256: sha(PIC[pic]), w: 2048, h: 2048 },
  mask: { file: 'mask.png', path: `/snapshot/dustrgb/${id}/mask.png`, type: 'image/png', bytes: MASK.length, sha256: sha(MASK), w: 160, h: 160 }, _pic: pic, ...extra }; };
const TA = '2026-11-12T16:50:00Z', TB = '2026-11-13T05:50:00Z';
const H = 3600e3, T0 = Date.parse(TA);

async function setup(browser, hub, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 860 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/gibs.earthdata.nasa.gov/**', async r => { if (opts.backdrop === 'never') return r.abort(); if (opts.backdrop) await opts.backdrop; r.fulfill({ status: 200, contentType: 'image/png', body: BACKDROP }); });
  await ctx.route('**/*.eumetsat.int/**', r => { hub.eumetsat.push(r.request().url()); r.abort(); });
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(b) });
    if (p.startsWith('/snapshot/dustrgb')) { hub.reqs.push(p);
      if (p === '/snapshot/dustrgb/meta') { if (hub.metaStatus !== 200) return j({ status: 'unavailable' }, hub.metaStatus); const strip = f => f && Object.fromEntries(Object.entries(f).filter(([k]) => k !== '_pic')); const body = { schema: 1, layer: 'dustrgb', frame: strip(hub.frame), previous: strip(hub.previous), last_attempt: hub.lastAttempt, cadence: { runs_utc: [6, 18] }, now: NOW }; if (hub.afterMeta) { const f = hub.afterMeta; hub.afterMeta = null; f(); } return j(body); }
      const m = /^\/snapshot\/dustrgb\/([^/]+)\/(picture\.jpg|mask\.png)$/.exec(p); const f = m && [hub.frame, hub.previous].find(x => x && x.id === m[1]);
      if (!f) return j({ status: 'unavailable', reason: 'not found' }, 404);
      if (m[2] === 'picture.jpg' && hub.holdPicture) await hub.holdPicture;
      const fault = hub.fault[m[2]]; if (fault === 404) return j({ status: 'unavailable' }, 404);
      let body = m[2] === 'picture.jpg' ? Buffer.from(PIC[f._pic]) : Buffer.from(MASK);
      if (fault === 'tamper') body[body.length >> 1] ^= 0xff;
      if (fault === 'junk') body = Buffer.from('not an image at all');
      const ff = hub.frameFault[f.id]; if (ff === 404) return j({ status: 'unavailable' }, 404); if (ff === 'tamper') body[body.length >> 1] ^= 0xff;
      return route.fulfill({ status: 200, contentType: m[2] === 'picture.jpg' ? 'image/jpeg' : 'image/png', headers: { 'access-control-allow-origin': '*' }, body }); }
    if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
    j({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }); });
  // opts.bodyFail: the page's fetch of any URL containing this text gets a 200 image response whose body breaks off after a few bytes (until window.__bodyFailOff is set)
  if (opts.bodyFail) await ctx.addInitScript(part => { const real = window.fetch; window.__bodyFails = 0; window.fetch = function (u, init) { if (String(u).includes(part) && !window.__bodyFailOff) { window.__bodyFails++;
    return Promise.resolve(new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(32)); c.error(new TypeError('network error (test)')); } }), { status: 200, headers: { 'content-type': 'image/jpeg' } })); } return real.call(this, u, init); }; }, opts.bodyFail);
  if (opts.noWebGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.loadedAt && ME.dustRgb, null, { timeout: 30000 });
  if (!opts.noWebGL && !opts.backdrop) await page.waitForFunction(() => { const g = ME.globe && ME.globe(); if (!g) return false; let ok = false; g.scene().traverse(o => { if (o.isMesh && o.material === g.globeMaterial() && o.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });   // the globe has finished building
  return { ctx, page, errs };
}
const newHub = () => ({ reqs: [], eumetsat: [], frame: frame(TA, 'a'), previous: null, lastAttempt: null, metaStatus: 200, fault: {}, frameFault: {}, holdPicture: null, afterMeta: null });
const st = page => page.evaluate(() => ME.dustRgb.state());
const setNow = (page, ms) => page.evaluate(t => { ME.dustRgb.opts.now = () => t; }, ms);
const on = async page => { await page.click('#tgl-dustrgb'); await page.waitForFunction(() => !ME.dustRgb.state().loading && ME.dustRgb.state().status !== 'loading', null, { timeout: 20000 }); };
const refresh = page => page.evaluate(() => ME.dustRgb.refresh());
const tex = page => page.evaluate(() => { const c = ME.dustRgb.texture(); if (!c) return null; const g = c.getContext('2d'), N = c.width; const px = (x, y) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data];
  let ringY = -1; for (let y = 0; y < N / 4; y++) { const d = px(N / 2, y); if (d[3] > 150 && d[0] > 180 && d[1] > 180 && d[2] > 180) { ringY = y; break; } }
  return { N, centre: px(N / 2, N / 2), corner: px(3, 3), ringY, firstOpaqueY: (() => { for (let y = 0; y < N / 2; y++) if (px(N / 2, y)[3] > 0) return y; return -1; })() }; });
const files = hub => hub.reqs.filter(p => /picture|mask/.test(p));
let BASE;

(async () => {
  const srv = http.createServer((q, r) => { const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html'; const full = path.join(ROOT, f);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { r.writeHead(404); return r.end(); }
    const type = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' }[f.split('.').pop()] || 'application/octet-stream';
    r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); r.end(/\.(js|html|css)$/.test(f) ? served(f) : fs.readFileSync(full)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ===== A. off on load; B. on
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    let s = await st(page);
    ok('A load: layer off, no request to the hub for dustrgb, none to EUMETSAT', hub.reqs.length === 0 && hub.eumetsat.length === 0 && s.on === false && s.stateWord === 'off' && s.meshes === 0, [hub.reqs, s]);
    ok('A card: name, Observed tag, a switch, "false-colour infrared composite", "Updated twice daily"', await page.$eval('#card-dustrgb', c => /Dust RGB imagery/.test(c.querySelector('.ovl-h').textContent) && !!c.querySelector('.ev.obs') && c.querySelector('#tgl-dustrgb').getAttribute('role') === 'switch' && /false-colour infrared composite/.test(c.textContent) && /Updated twice daily/.test(c.textContent)));
    ok('A card explains "Frame requested" and the coverage in GPT\'s wording', await page.$eval('#dustrgb-scope', d => /can return the nearest available frame instead, and does not tell us when it has/.test(d.textContent) && /Shows the part of Earth visible to Meteosat from 0°\. Detail decreases toward the edge\./.test(d.textContent) && /Airborne dust can appear pink or magenta\. Clouds, moisture and the surface also affect the colours/.test(d.textContent)));
    ok('A credit in the footer names EUMETSAT, the product and CC BY 4.0', await page.$eval('#credits', f => /contains modified EUMETSAT Meteosat data 2026 \(Dust RGB - MTG - 0 degree, CC BY 4\.0\)/.test(f.textContent)));
    await setNow(page, T0 + 5 * H + 20 * 60e3); await on(page); s = await st(page);
    ok('B on: exactly three hub requests — the pointer, one picture, one mask', JSON.stringify(hub.reqs) === JSON.stringify(['/snapshot/dustrgb/meta', hub.frame.picture.path, hub.frame.mask.path]), hub.reqs);
    ok('B on: the page never contacts EUMETSAT', hub.eumetsat.length === 0, hub.eumetsat);
    ok('B label: "Frame requested: 12 Nov, 16:50 UTC (5 h ago)"', s.label === 'Frame requested: 12 Nov, 16:50 UTC (5 h ago)', s.label);
    ok('B second line: satellite and cadence; no failure text', s.extra === 'Meteosat (MTG) at 0° · Updated twice daily.', s.extra);
    ok('B state: current, switch checked, one mesh in the scene', s.stateWord === 'current' && s.grade === 'current' && s.meshes === 1 && s.inScene === 1 && await page.$eval('#tgl-dustrgb', b => b.getAttribute('aria-checked') === 'true'), s);
    const t = await tex(page);
    ok('B texture: the picture inside the footprint (centre is the picture\'s colour, opaque)', t && t.centre[3] === 255 && t.centre[0] > 150 && t.centre[1] < 110 && t.centre[2] > 110, t);
    ok('B texture: outside the footprint is fully transparent (the corner), not painted', t && t.corner[3] === 0, t);
    ok('B texture: a thin outline runs along the footprint edge (white ring just inside it)', t && t.ringY >= 0 && t.ringY - t.firstOpaqueY <= t.N * 0.02, t);
    ok('B mesh covers the frame box only (160° of longitude and latitude), and is never a pick target', await page.evaluate(() => { const g = ME.globe(); let m = null; g.scene().traverse(o => { if (o.__dustRgb) m = o; }); const p = m.geometry.parameters; return Math.abs(p.phiLength - Math.PI * 2 * 160 / 360) < 1e-6 && Math.abs(p.thetaLength - Math.PI * 160 / 180) < 1e-6 && Math.abs(p.thetaStart - Math.PI * 10 / 180) < 1e-6 && m.material.transparent === true && m.material.opacity < 1; }));
    // ---- C. age states from a faked clock
    await setNow(page, T0 + 59 * 60e3); await page.evaluate(() => ME.dustRgb.ageTick()); ok('C age under an hour is shown in minutes, in brackets after the requested time', (await st(page)).label.endsWith('(59 min ago)'));
    await setNow(page, T0 + 13.9 * H); await page.evaluate(() => ME.dustRgb.ageTick()); s = await st(page); ok('C 13.9 h: still current', s.stateWord === 'current' && s.label.endsWith('(13 h ago)'), s);
    await setNow(page, T0 + 14.5 * H); await page.evaluate(() => ME.dustRgb.ageTick()); s = await st(page); ok('C 14.5 h: stale, still shown with its age', s.stateWord === 'stale' && s.meshes === 1 && s.label.endsWith('(14 h ago)'), s);
    await setNow(page, T0 + 24.2 * H); await page.evaluate(() => ME.dustRgb.ageTick()); s = await st(page);
    ok('C past 24 h: cleared — nothing painted, state unknown, the card says why', s.stateWord === 'unknown' && s.meshes === 0 && s.label === null && /more than 24 hours old and has been cleared\. Nothing is drawn\./.test(s.off || ''), s);
    ok('A–C no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== C2. a frame already older than 24 h is never fetched
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 30 * H); await on(page); const s = await st(page);
    ok('C2 newest frame older than 24 h: only the pointer is requested; nothing painted; state unknown', JSON.stringify(hub.reqs) === '["/snapshot/dustrgb/meta"]' && s.meshes === 0 && s.stateWord === 'unknown' && /more than 24 hours ago/.test(s.off || ''), [hub.reqs, s]); await ctx.close(); }

  // ===== B2. if the hub ever records a served time, the label says "Frame"
  { const hub = newHub(); hub.frame = frame(TA, 'a', { served_time: TA, served_time_source: 'server Warning header' }); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 2 * H); await on(page);
    ok('B2 served time known: "Frame: 12 Nov, 16:50 UTC (2 h ago)"', (await st(page)).label === 'Frame: 12 Nov, 16:50 UTC (2 h ago)', (await st(page)).label); await ctx.close(); }

  // ===== D. a failed FIRST load leaves the globe clear
  for (const [name, mut, re] of [
    ['hub pointer HTTP 500', h => { h.metaStatus = 500; }, /could not be loaded/],
    ['hub has no frame yet', h => { h.frame = null; }, /no Dust RGB frame yet/],
    ['picture 404', h => { h.fault['picture.jpg'] = 404; }, /could not be loaded/],
    ['picture bytes do not match the fingerprint', h => { h.fault['picture.jpg'] = 'tamper'; }, /did not match its fingerprint/],
    ['mask bytes do not match the fingerprint', h => { h.fault['mask.png'] = 'tamper'; }, /did not match its fingerprint/],
    ['mask is not an image', h => { h.fault['mask.png'] = 'junk'; }, /did not match its fingerprint|could not be decoded/]]) {
    const hub = newHub(); mut(hub); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 2 * H); await on(page); const s = await st(page);
    ok(`D first load fails (${name}): nothing painted, state unknown, reason shown with "Nothing is drawn."`, s.meshes === 0 && s.frameId === null && s.label === null && s.stateWord === 'unknown' && re.test(s.off || '') && /Nothing is drawn\./.test(s.off || '') && errs.length === 0, [s, errs]); await ctx.close(); }

  // ===== E. refresh: time and picture change together; F. failed refresh keeps the frame; G. off in flight
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 2 * H); await on(page);
    const tA = await tex(page);
    let n = hub.reqs.length; await refresh(page);
    ok('E refresh with the same frame: one pointer request, no file fetched again', JSON.stringify(hub.reqs.slice(n)) === '["/snapshot/dustrgb/meta"]', hub.reqs.slice(n));
    // a newer frame arrives; its picture is held back
    let release; hub.holdPicture = new Promise(r => { release = r; }); hub.previous = hub.frame; hub.frame = frame(TB, 'b'); await setNow(page, Date.parse(TB) + 1 * H);
    n = hub.reqs.length; const pending = refresh(page); await page.waitForTimeout(700);
    let s = await st(page);
    ok('E while the newer frame is still loading: the old frame, its own time and its mesh are all still shown', String(s.frameId).startsWith('20261112T1650Z-') && /^Frame requested: 12 Nov, 16:50 UTC/.test(s.label) && s.meshes === 1 && (await tex(page)).centre.join() === tA.centre.join(), s);
    release(); hub.holdPicture = null; await pending; await page.waitForFunction(() => !ME.dustRgb.state().loading); s = await st(page); const tB = await tex(page);
    ok('E after it loads: label, frame and texture have all changed together; exactly one mesh', String(s.frameId).startsWith('20261113T0550Z-') && s.label === 'Frame requested: 13 Nov, 05:50 UTC (1 h ago)' && s.meshes === 1 && s.inScene === 1 && tB.centre[1] > 120 && tB.centre[0] < 100, [s, tB]);
    ok('E the refresh fetched the new pair once: pointer, picture, mask', JSON.stringify(hub.reqs.slice(n)) === JSON.stringify(['/snapshot/dustrgb/meta', hub.frame.picture.path, hub.frame.mask.path]), hub.reqs.slice(n));
    ok('E only one dust mesh exists in the scene (the old one was removed and disposed)', await page.evaluate(() => { let k = 0; ME.globe().scene().traverse(o => { if (o.__dustRgb) k++; }); return k; }) === 1);
    // F. failed refresh, pointer unreachable
    hub.metaStatus = 503; await refresh(page); s = await st(page);
    ok('F refresh fails (hub unreachable): the frame stays with its ORIGINAL time; "Refresh unavailable." is shown', String(s.frameId).startsWith('20261113T0550Z-') && /^Frame requested: 13 Nov, 05:50 UTC/.test(s.label) && s.meshes === 1 && /Refresh unavailable\./.test(s.extra) && s.refreshFailed === true, s);
    hub.metaStatus = 200; await refresh(page); s = await st(page); ok('F a later good refresh removes "Refresh unavailable."', !/Refresh unavailable/.test(s.extra) && s.refreshFailed === false, s);
    // F2. a newer frame whose picture cannot be loaded
    const TC = '2026-11-13T17:50:00Z'; hub.previous = hub.frame; hub.frame = frame(TC, 'a'); hub.fault['picture.jpg'] = 'tamper'; await setNow(page, Date.parse(TC) + 0.5 * H); await refresh(page); s = await st(page);
    ok('F refresh fails (new picture does not match): the existing frame and its original time are kept, marked "Refresh unavailable."', String(s.frameId).startsWith('20261113T0550Z-') && /^Frame requested: 13 Nov, 05:50 UTC \(12 h ago\)/.test(s.label) && s.meshes === 1 && /Refresh unavailable\./.test(s.extra) && (await tex(page)).centre.join() === tB.centre.join(), s);
    // the hub reports its own failed run
    hub.fault = {}; hub.frame = hub.previous; hub.previous = null; hub.lastAttempt = { run: '2026-11-13T18:07:00.000Z', failed_at: '2026-11-13T18:07:12.000Z', status: 'down', http: 502, reason: 'frame list http error', consecutive_failures: 1 }; await refresh(page); s = await st(page);
    ok('F the hub\'s own failed run is shown at once beside the retained frame: "Latest update failed at 18:07 UTC."', /Latest update failed at 18:07 UTC\./.test(s.extra) && s.meshes === 1 && !/502|frame list/.test(s.extra), s);
    // retained frame passes 24 h while refreshes keep failing → cleared
    hub.metaStatus = 503; await refresh(page); await setNow(page, Date.parse(TB) + 24.5 * H); await page.evaluate(() => ME.dustRgb.ageTick()); s = await st(page);
    ok('F a retained frame that passes 24 h is cleared: nothing painted, state unknown', s.meshes === 0 && s.stateWord === 'unknown' && s.label === null && await page.evaluate(() => { let k = 0; ME.globe().scene().traverse(o => { if (o.__dustRgb) k++; }); return k; }) === 0, s);
    ok('E–F no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== G. switched off while an image is in flight: a late response never paints
  { const hub = newHub(); let release; hub.holdPicture = new Promise(r => { release = r; }); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, T0 + 2 * H);
    await page.click('#tgl-dustrgb'); await page.waitForFunction(() => ME.dustRgb.state().requests.length >= 2, null, { timeout: 10000 });
    await page.click('#tgl-dustrgb'); let s = await st(page);
    ok('G off while the picture is in flight: state off at once, nothing painted', s.on === false && s.stateWord === 'off' && s.meshes === 0, s);
    release(); await page.waitForTimeout(1200); s = await st(page);
    ok('G the late response never paints: still off, no mesh in the scene, no frame label', s.on === false && s.meshes === 0 && s.label === null && s.frameId === null && await page.evaluate(() => { let k = 0; ME.globe().scene().traverse(o => { if (o.__dustRgb) k++; }); return k; }) === 0 && /^Off\./.test(s.off || ''), s);
    const n = hub.reqs.length; await refresh(page); await page.waitForTimeout(300);
    ok('G while off, a refresh makes no request', hub.reqs.length === n, hub.reqs.slice(n));
    hub.holdPicture = null; await on(page); s = await st(page);
    ok('G switching on again afterwards works normally', s.meshes === 1 && String(s.frameId).startsWith('20261112T1650Z-'), s);
    await page.click('#tgl-dustrgb'); s = await st(page);
    ok('G switching off removes the mesh and the time line', s.meshes === 0 && s.label === null && await page.evaluate(() => { let k = 0; ME.globe().scene().traverse(o => { if (o.__dustRgb) k++; }); return k; }) === 0, s);
    ok('G no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== H. a reader loading across the hub's swap still gets a matching pair (the grace period)
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, Date.parse(TB) + 0.2 * H);
    // the page reads the pointer (frame A); before it asks for the files the hub publishes B and keeps A as "previous"
    hub.afterMeta = () => { hub.previous = hub.frame; hub.frame = frame(TB, 'b'); };
    await on(page); const s = await st(page), t = await tex(page);
    ok('H across a swap: the page asked for frame A\'s files after the hub had moved on, and painted A\'s matching picture and mask', String(s.frameId).startsWith('20261112T1650Z-') && s.meshes === 1 && files(hub).every(p => p.includes('20261112T1650Z')) && t.centre[0] > 150 && t.centre[1] < 110 && t.corner[3] === 0, [s, files(hub), t]);
    await refresh(page); ok('H the next refresh moves to frame B', String((await st(page)).frameId).startsWith('20261113T0550Z-')); await ctx.close(); }

  // ===== I. hidden tab: no refresh requests
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 2 * H); await page.evaluate(() => { ME.dustRgb.config.REFRESH_MS = 250; }); await on(page);
    let n = hub.reqs.length; const t0 = Date.now(); while (hub.reqs.length - n < 3 && Date.now() - t0 < 20000) await page.waitForTimeout(100);   // however slow the machine, see three timer checks
    const visible = hub.reqs.length - n, took = Date.now() - t0;
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); }); await page.waitForTimeout(Math.max(400, took));
    n = hub.reqs.length; await page.waitForTimeout(Math.max(1300, took * 2)); const hidden = hub.reqs.length - n;
    ok('I while visible the timer checks the pointer; while the tab is hidden it makes no request', visible >= 3 && hidden === 0, { visible, hidden });
    await page.click('#tgl-dustrgb'); n = hub.reqs.length; await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); }); await page.waitForTimeout(900);
    ok('I after switching off the timer is gone: no further requests', hub.reqs.length === n, hub.reqs.slice(n)); await ctx.close(); }

  // ===== M. the globe's own picture arrives late (it can take tens of seconds on a slow line): the layer waits for it
  { const hub = newHub(); let release; const { ctx, page, errs } = await setup(browser, hub, { backdrop: new Promise(r => { release = r; }) }); await setNow(page, T0 + 2 * H);
    await page.waitForFunction(() => ME.globe && ME.globe(), null, { timeout: 30000 }); await page.click('#tgl-dustrgb'); await page.waitForTimeout(2500); let s = await st(page);
    ok('M backdrop not loaded yet: the layer is still loading (no error, nothing painted)', s.on === true && s.stateWord === 'loading' && s.meshes === 0 && /Loading the latest frame/.test(s.off || ''), s);
    release(); await page.waitForFunction(() => ME.dustRgb.state().meshes === 1, null, { timeout: 20000 }).catch(() => {}); s = await st(page);
    ok('M once the backdrop arrives the frame is painted, with its label', s.meshes === 1 && s.stateWord === 'current' && /^Frame requested: 12 Nov, 16:50 UTC/.test(s.label || '') && errs.length === 0, [s, errs]); await ctx.close(); }
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub, { backdrop: 'never' }); await setNow(page, T0 + 2 * H); await page.waitForFunction(() => ME.globe && ME.globe(), null, { timeout: 30000 });
    await page.evaluate(() => { ME.dustRgb.config.BUILD_WAIT_MS = 1500; }); await page.click('#tgl-dustrgb'); await page.waitForFunction(() => ME.dustRgb.state().status === 'unknown', null, { timeout: 20000 }).catch(() => {}); const s = await st(page);
    ok('M backdrop never arrives: after the wait the card says so plainly; nothing painted; no error', s.meshes === 0 && s.stateWord === 'unknown' && /globe has not finished loading its own picture/.test(s.off || '') && /Nothing is drawn\./.test(s.off || '') && errs.length === 0, [s, errs]); await ctx.close(); }

  // ===== N. GPT review 2: the newest pair cannot be used, the hub still holds the previous one
  { const hub = newHub(); hub.previous = frame(TA, 'a'); hub.frame = frame(TB, 'bad'); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, Date.parse(TB) + 2 * H); await on(page); let s = await st(page);
    ok('N newest picture has the right fingerprint but does not decode: a first-time visitor is shown the PREVIOUS pair, under its own time', s.meshes === 1 && s.frameId === hub.previous.id && s.label === 'Frame requested: 12 Nov, 16:50 UTC (15 h ago)' && s.stateWord === 'stale' && s.fallback === true && errs.length === 0, [s, errs]);
    ok('N the card says so plainly', /The latest frame could not be shown; this is the previous one\./.test(s.extra) && !/Refresh unavailable/.test(s.extra), s.extra);
    const t = await tex(page); ok('N what is drawn is the previous pair\'s own picture, cut to its mask', t.centre[0] > 150 && t.centre[1] < 110 && t.corner[3] === 0, t);
    let n = hub.reqs.length; await refresh(page); await refresh(page);
    ok('N the unusable pair is not downloaded again on later refreshes (pointer only)', JSON.stringify(hub.reqs.slice(n)) === '["/snapshot/dustrgb/meta","/snapshot/dustrgb/meta"]' && (await st(page)).frameId === hub.previous.id, hub.reqs.slice(n));
    const TD = '2026-11-13T17:50:00Z'; hub.previous = hub.frame; hub.frame = frame(TD, 'b'); await setNow(page, Date.parse(TD) + 1 * H); await refresh(page); s = await st(page);
    ok('N when a good newer frame arrives it replaces the fallback and the note goes', s.frameId === hub.frame.id && s.fallback === false && !/previous one/.test(s.extra) && s.label === 'Frame requested: 13 Nov, 17:50 UTC (1 h ago)', s);
    await ctx.close(); }
  for (const [name, fault] of [['is missing (404)', 404], ['does not match its fingerprint', 'tamper']]) {
    const hub = newHub(); hub.previous = frame(TA, 'a'); hub.frame = frame(TB, 'b'); hub.frameFault[hub.frame.id] = fault; const { ctx, page } = await setup(browser, hub); await setNow(page, Date.parse(TB) + 1 * H); await on(page); const s = await st(page);
    ok(`N newest pair ${name}: the previous pair is shown with the note`, s.meshes === 1 && s.frameId === hub.previous.id && s.fallback === true && /previous one/.test(s.extra), s); await ctx.close(); }
  { const hub = newHub(); hub.previous = frame(TA, 'a'); hub.frame = frame(TB, 'bad'); const { ctx, page } = await setup(browser, hub); await setNow(page, T0 + 25 * H); await on(page); const s = await st(page);
    ok('N a previous pair older than 24 h is NOT used as a fallback: nothing drawn, not even fetched', s.meshes === 0 && s.stateWord === 'unknown' && /could not be decoded/.test(s.off || '') && !hub.reqs.some(p => p.includes(hub.previous.id)), [s, hub.reqs]); await ctx.close(); }
  { const hub = newHub(); hub.previous = frame(TA, 'bad'); hub.frame = frame(TB, 'bad'); const { ctx, page, errs } = await setup(browser, hub); await setNow(page, Date.parse(TB) + 1 * H); await on(page); const s = await st(page);
    ok('N both pairs unusable: nothing drawn, state unknown, reason shown, no error', s.meshes === 0 && s.stateWord === 'unknown' && /Nothing is drawn\./.test(s.off || '') && errs.length === 0, [s, errs]); await ctx.close(); }
  { // GPT review of round 2: the picture response STARTS (200, image/jpeg) and then the body read fails
    const hub = newHub(); hub.previous = frame(TA, 'a'); hub.frame = frame(TB, 'b'); const { ctx, page, errs } = await setup(browser, hub, { bodyFail: hub.frame.id + '/picture.jpg' }); await setNow(page, Date.parse(TB) + 1 * H); await on(page); let s = await st(page);
    ok('N first load, newest picture\'s body breaks off after the response began: the previous pair is shown with the note (it used to show nothing)', await page.evaluate(() => window.__bodyFails) === 1 && s.meshes === 1 && s.frameId === hub.previous.id && s.fallback === true && /previous one/.test(s.extra) && /^Frame requested: 12 Nov, 16:50 UTC/.test(s.label) && errs.length === 0, [s, errs]);
    await refresh(page); s = await st(page);
    ok('N that failure is retryable: the next refresh tries the newest pair again (and, still failing, keeps the previous pair)', await page.evaluate(() => window.__bodyFails) === 2 && s.frameId === hub.previous.id && s.meshes === 1, [await page.evaluate(() => window.__bodyFails), s.frameId]);
    await page.evaluate(() => { window.__bodyFailOff = true; }); await refresh(page); s = await st(page);
    ok('N once the body arrives whole, the newest pair replaces the fallback and the notes go', s.frameId === hub.frame.id && s.fallback === false && s.refreshFailed === false && s.extra === 'Meteosat (MTG) at 0° · Updated twice daily.', s); await ctx.close(); }
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub, { bodyFail: '/picture.jpg' }); await setNow(page, T0 + 2 * H); await on(page); const s = await st(page);
    ok('N body breaks off and there is no previous pair: nothing drawn, plain reason, no page error', s.meshes === 0 && s.stateWord === 'unknown' && /could not be loaded/.test(s.off || '') && /Nothing is drawn\./.test(s.off || '') && errs.length === 0, [s, errs]); await ctx.close(); }
  { // the hub suite's success fixtures are real images: a browser decodes both
    const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' });
    const r = await page.evaluate(async () => { const out = {}; for (const [k, u] of [['pic', '/phase1/dustrgb-fixtures/hub-picture.jpg'], ['mask', '/phase1/dustrgb-fixtures/hub-mask.png']]) { const bm = await createImageBitmap(await (await fetch(u)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0); out[k] = { w: bm.width, h: bm.height, centre: [...g.getImageData(bm.width >> 1, bm.height >> 1, 1, 1).data], corner: [...g.getImageData(0, 0, 1, 1).data] }; } return out; });
    ok('N the hub suite\'s success fixtures decode in a browser: picture 2048 x 2048; mask 160 x 160 with an opaque centre and a clear corner', r.pic.w === 2048 && r.pic.h === 2048 && r.pic.centre[3] === 255 && r.mask.w === 160 && r.mask.h === 160 && r.mask.centre[3] === 255 && r.mask.corner[3] === 0, r); await ctx.close(); }

  // ===== J. phone width uses the smaller texture; K. no WebGL; L. Sources
  { const hub = newHub(); const { ctx, page } = await setup(browser, hub, { viewport: { width: 390, height: 844 } }); await setNow(page, T0 + 2 * H);
    await page.evaluate(() => { const b = document.getElementById('tgl-dustrgb'); b.scrollIntoView(); b.click(); }); await page.waitForFunction(() => !ME.dustRgb.state().loading && ME.dustRgb.state().status !== 'loading');
    const t = await tex(page); ok('J phone width: painted from a 1024-pixel texture', t && t.N === 1024 && (await st(page)).meshes === 1, t); await ctx.close(); }
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub, { noWebGL: true }); await page.evaluate(() => document.getElementById('tgl-dustrgb').click()); await page.waitForTimeout(500); const s = await st(page);
    ok('K no WebGL: the card says the layer needs the 3-D globe; no request is made; no error', s.on === false && /needs the 3-D globe/.test(s.off || '') && hub.reqs.length === 0 && errs.length === 0, [s, hub.reqs, errs]); await ctx.close(); }
  { const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' });
    ok('L Sources: a Dust RGB section with the product link, CC BY 4.0, "Frame requested" explained, and no claim of confirmation', await page.evaluate(() => { const h = document.getElementById('dustrgb'); if (!h) return false; let t = '', n = h.nextElementSibling; while (n && n.tagName !== 'H2') { t += n.textContent + '\n'; n = n.nextElementSibling; }
      return /EO:EUM:DAT:0869/.test(t) && /CC BY 4\.0/.test(t) && /Contains modified EUMETSAT Meteosat data 2026/.test(t) && /makes no claim that the served frame was confirmed/.test(t) && /not shown after 24/.test(t) && /EUMETSAT does not endorse/.test(t); })); await ctx.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`dustrgb-ui: ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + (e && e.stack || e)); process.exit(1); });
