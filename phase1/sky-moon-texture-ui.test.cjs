/* Mother Earth — Moon item 10a: the Moon's picture on the Sky zoom-out Moon (MOON-SKY-TEXTURE-PROPOSAL rev 1, GPT's rev 1 review
 * notes 1–6; Chad's D1–D6, 27 Nov 2026). Page side, preview.
 * Real index.html + app.js + sky.js + moonlight.js + skyscene.js and the real map and sunlight table, served locally (8899); real
 * globe.gl 2.45.0 (SwiftShader); hub routed to the committed scene and distances files; Playwright's clock fixes the date.
 * The Earth picture is a plain near-white PNG (as sky-zoom-ui's rendered-evidence checks), so the globe has a texture class.
 * Expected directions come from the scene and table files read HERE (not from the page), and an independent reference from
 * astronomy-engine (version and file hash printed). Close-camera views are TEST-ONLY views (the page never moves there).
 * Run:   node phase1/sky-moon-texture-ui.test.cjs   (serve the tree under test: python3 -m http.server 8899 --bind 127.0.0.1)
 * Needs: NODE_PATH with playwright (shim), pngjs, astronomy-engine and globe.gl 2.45.0 (SPIKE=/home/claude/spike by default).
 * Break: BREAK=<name> loads a weakened skyscene.js; the suite must FAIL on every one. A break whose pattern is missing stops the
 * suite (exit 2) and is never counted as caught.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const REPO = path.join(__dirname, '..'), BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const SPIKE = process.env.SPIKE || '/home/claude/spike';
const GLOBE_JS = fs.readFileSync(path.join(SPIKE, 'node_modules/globe.gl/dist/globe.gl.min.js'), 'utf8');
const { PNG } = require(path.join(SPIKE, 'node_modules/pngjs'));
const R1 = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-2026-11-R1.json'), 'utf8');
const SC = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8'), SCJ = JSON.parse(SC);
const MAPB = fs.readFileSync(path.join(REPO, 'assets/moon/lroc_color_2k.jpg'));
const MLB = fs.readFileSync(path.join(REPO, 'assets/moon/moon-light-2026-06-R1.json')), MLJ = JSON.parse(MLB);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const OUT = process.env.OUT || '/tmp/sky-moon-texture-out'; fs.mkdirSync(OUT, { recursive: true });

// OLD=<file>: run against another skyscene.js (the old-code control for R1: the candidate before the fix)
let JS = fs.readFileSync(process.env.OLD || path.join(REPO, 'skyscene.js'), 'utf8');
if (process.env.OLD) console.log('OLD skyscene.js: ' + process.env.OLD + ' sha256 ' + require('crypto').createHash('sha256').update(JS).digest('hex'));
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, want = k => !ONLY || ONLY.includes(k);
const BREAKS = {
  'no-pin': ["const b = await r.arrayBuffer(); if (await sha256(b) !== sha) throw new Error('pin'); return b; };", "const b = await r.arrayBuffer(); return b; };"],
  'no-rotation': ["const W = mul3(mul3(P, R), Lt), M4", "const W = mul3(P, Lt), M4"],
  'swap-fit': ["const A = tri(eS, sS), B = tri(eM, sM);", "const A = tri(sS, eS), B = tri(eM, sM);"],
  'mirror-lng': ["return [Math.cos(a) * Math.cos(o), Math.cos(a) * Math.sin(o), Math.sin(a)]; };\n    const moonP", "return [Math.cos(a) * Math.cos(o), -Math.cos(a) * Math.sin(o), Math.sin(a)]; };\n    const moonP"],
  'no-rollover-orient': ["positionMeshes(); applyMap(); $('zoom-scale')", "positionMeshes(); $('zoom-scale')"],
  'emissive-grey': ["mat.emissiveMap = mm.tex; mat.emissive && mat.emissive.setHex(0xffffff);", "mat.emissiveMap = mm.tex; mat.emissive && mat.emissive.setHex(0x9a9a9a);"],
  'blocking-entry': ["    loadMap();   // the Moon's picture: optional, in parallel, never waited for", "    await loadMap();"],
  'invented-orientation': ["if (!R) throw new Error('orientation');", "if (!R) { if (!mm.tex) { mm.tex = new mm.ready.Tex(mm.ready.img); mm.tex.needsUpdate = true; const mat = st.meshes.moon.material; mat.emissiveMap = mm.tex; mat.emissive.setHex(0xffffff); mat.needsUpdate = true; } mm.status = 'ok'; return; }"],
  'no-dispose': ["st.raf = 0; cancelMap();   // D6: the picture is disposed on exit", "st.raf = 0;"],
  'no-timeout': ["    mm.timer = setTimeout(() => { if (live() && mm.status !== 'ok') fail('timed out'); }, MAP_TIMEOUT_MS);\n", ""],
  'late-keep': ["      if (!live()) return;\n      mm.ctl = null; mm.ready =", "      mm.ctl = null; mm.ready ="],
  'no-colorspace': ["        if (mm.ready.space !== undefined) mm.tex.colorSpace = mm.ready.space;\n", ""],
  // R1 (GPT preview review, 27 Nov 2026): placement errors contained, the texture owned at once, upload errors not swallowed,
  // synchronous preparation past the limit refused
  'swallow-upload': ["if (r && typeof r.initTexture === 'function') r.initTexture(mm.tex);", "if (r && typeof r.initTexture === 'function') { try { r.initTexture(mm.tex); } catch (e) {} }"],
  'placement-uncontained': ["    } catch (e) { cancelMap('failed', placeWhy(e)); }\n  }", "    } catch (e) { throw e; }\n  }"],
  'late-own': ["        mm.tex = new mm.ready.Tex(mm.ready.img);           // owned at once: cancelMap disposes it on any later failure\n        if (mm.ready.space !== undefined) mm.tex.colorSpace = mm.ready.space;", "        const tex0 = new mm.ready.Tex(mm.ready.img);\n        if (mm.ready.space !== undefined) tex0.colorSpace = mm.ready.space; mm.tex = tex0;"],
  'no-sync-deadline': ["        if (performance.now() > mm.deadline) throw new Error('timed out');   // synchronous preparation that ran past the limit\n", ""],
  'cancel-on-scene-fail-off': ["    if (why) { cancelMap(); st.status = 'unavailable';", "    if (why) { st.status = 'unavailable';"],
};
const B = process.env.BREAK;
if (B && !(B in BREAKS)) { console.log('unknown break: ' + B); process.exit(2); }
if (B) { const [a, b] = BREAKS[B]; if (!JS.includes(a)) { console.log(`BREAK ${B}: pattern NOT found — not applied, suite stopped`); process.exit(2); } JS = JS.replace(a, b); console.log(`BREAK ${B} applied (pattern found)`); }

const EARTH_PNG = (() => { const im = new PNG({ width: 64, height: 32 }); for (let i = 0; i < 64 * 32; i++) { im.data.set([235, 245, 255, 255], 4 * i); } return PNG.sync.write(im); })();
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 30 min — failure, not a hang'); process.exit(1); }, 30 * 60e3);

// ---------- expectations computed here, from the files
const D = Math.PI / 180;
const vec = (lat, lng) => [Math.cos(lat * D) * Math.cos(lng * D), Math.cos(lat * D) * Math.sin(lng * D), Math.sin(lat * D)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = a => { const n = Math.hypot(...a); return a.map(v => v / n); }, ang = (a, b) => Math.atan2(Math.hypot(...cross(a, b)), dot(a, b)) / D;
const ecefFromThree = p => [p[2], p[0], p[1]], threeFromEcef = p => [p[1], p[2], p[0]];
const rowsOf = date => ({ moon: SCJ.bodies.moon.rows.find(r => r[0] === date), sun: SCJ.bodies.sun.rows.find(r => r[0] === date) });
const tableAt = date => { const i = (Date.parse(date + 'T00:00:00Z') - Date.parse(MLJ.time.start)) / (MLJ.time.step_s * 1000);
  return { e: [MLJ.earth_lon_lat_deg[2 * i + 1], MLJ.earth_lon_lat_deg[2 * i]], s: [MLJ.sun_lon_lat_deg[2 * i + 1], MLJ.sun_lon_lat_deg[2 * i]] }; };   // [lat, lng]
const expectDirs = date => { const r = rowsOf(date), moonP = vec(r.moon[1], r.moon[2]).map(v => v * r.moon[3]), sunP = vec(r.sun[1], r.sun[2]).map(v => v * r.sun[3]);
  return { eS: nrm(moonP.map(v => -v)), sS: nrm(sunP.map((v, i) => v - moonP[i])) }; };
let AE = null, AEinfo = null;
async function refRotation(date) {   // astronomy-engine: Moon-fixed (IAU) → EQJ → EQD → Earth-fixed (apparent sidereal time)
  if (!AE) { const p = require.resolve('astronomy-engine'), pkg = path.join(path.dirname(p), '..', 'package.json');
    AE = require(p); AEinfo = { version: JSON.parse(fs.readFileSync(fs.existsSync(pkg) ? pkg : path.join(path.dirname(p), 'package.json'))).version, file: p, sha256: sha(fs.readFileSync(p)) }; }
  const t = AE.MakeTime(new Date(date + 'T00:00:00Z')), ax = AE.RotationAxis(AE.Body.Moon, t);
  const Rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]], Rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
  const mm = (X, Y) => X.map(r => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0))), T = M => M[0].map((_, j) => M.map(r => r[j]));
  const M2J = mm(mm(Rz((90 + ax.ra * 15) * D), Rx((90 - ax.dec) * D)), Rz(ax.spin * D));
  return mm(Rz(-AE.SiderealTime(t) * 15 * D), mm(T(AE.Rotation_EQJ_EQD(t).rot), M2J));
}
const rotDiff = (R, Q) => { let tr = 0; for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) tr += R[i][k] * Q[i][k]; return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) / D; };   // angle of R·Qᵀ

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  // opts: date, viewport, dpr, map/table: {status, body, delay}, scene (text) + pin, earth (bool), decodeDelay (ms)
  const run = async (o = {}) => {
    const date = o.date || '2026-11-27';
    const ctx = await browser.newContext({ viewport: o.viewport || { width: 1280, height: 900 }, deviceScaleFactor: o.dpr || 1, reducedMotion: 'reduce' });
    const req = { map: 0, table: 0, scene: 0, aborted: [] };
    let js = JS; if (o.scene && o.scenePin !== false) js = js.replace(`const SHA = '${sha(SC)}';`, `const SHA = '${sha(o.scene)}';`);
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => o.earth === false ? r.abort() : r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: EARTH_PNG }));
    await ctx.route(BASE + '/skyscene.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: js }));
    const asset = (key, real, type) => async r => { req[key]++; const s = o[key] || {};
      if (s.delay) await new Promise(res => setTimeout(res, s.delay));
      try { await r.fulfill({ status: s.status || 200, contentType: type, body: s.body !== undefined ? s.body : real }); } catch (e) { /* aborted by the page */ } };
    await ctx.route(BASE + '/assets/moon/lroc_color_2k.jpg*', asset('map', MAPB, 'image/jpeg'));
    await ctx.route(BASE + '/assets/moon/moon-light-2026-06-R1.json*', asset('table', MLB, 'application/json'));
    await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname;
      if (p === '/catalogue/sky/sky-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: R1 });
      if (p === '/catalogue/sky/sky-scene-2026-11-R1') { req.scene++; const go = () => r.fulfill({ status: 200, contentType: 'application/json', body: o.scene || SC }).catch(() => {});
        return o.sceneDelay ? new Promise(res => setTimeout(() => res(go()), o.sceneDelay)) : go(); }
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
    page.on('requestfailed', rq => { if (/lroc_color|moon-light/.test(rq.url())) req.aborted.push(rq.url().split('/').pop() + ' ' + (rq.failure() || {}).errorText); });
    await page.addInitScript(d => {   // object-URL bookkeeping, and an optional slow picture decode
      window.__urls = { made: 0, revoked: 0 }; const mk = URL.createObjectURL, rv = URL.revokeObjectURL;
      URL.createObjectURL = function (b) { window.__urls.made++; return mk.call(URL, b); }; URL.revokeObjectURL = function (u) { window.__urls.revoked++; return rv.call(URL, u); };
      if (d) { const dec = HTMLImageElement.prototype.decode; HTMLImageElement.prototype.decode = function () { return new Promise(r => setTimeout(r, d)).then(() => dec.call(this)); }; }
    }, o.decodeDelay || 0);
    await page.clock.install({ time: new Date(date + 'T10:00:00Z') });
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ content: `
      window.__moon = () => { let m = null; ME.globe().scene().traverse(o => { if (o.__skyScene === 'moon') m = o; }); return m; };
      window.__mf = (lat, lng) => { const m = __moon(), a = lat * Math.PI / 180, o = lng * Math.PI / 180, X = Math.cos(a) * Math.cos(o), Y = Math.cos(a) * Math.sin(o), Z = Math.sin(a);
        return m.position.clone().set(X, Z, -Y).applyQuaternion(m.quaternion).toArray(); };
      window.__info = () => { const r = ME.globe().renderer(); return { textures: r.info.memory.textures, calls: r.info.render.calls }; };
      // R1 failure injection (TEST-ONLY): wraps the texture class the page takes from the Earth picture, the renderer's upload and
      // the Moon mesh's rotation call; every texture made through the wrapper is counted, and its dispose() too
      window.__inj = { ctor: false, cs: false, up: false, orient: false, upBusy: 0 }; window.__texLog = { made: 0, disposed: 0 };
      window.__arm = () => { const gm = ME.globe().globeMaterial(); if (!gm.map || gm.map.__armed) return !!(gm.map && gm.map.__armed);
        const Real = Object.getPrototypeOf(gm.map).constructor;
        function T(img) { if (__inj.ctor) throw new Error('injected constructor'); const t = new Real(img); __texLog.made++;
          const d = t.dispose.bind(t); t.dispose = () => { __texLog.disposed++; d(); };
          if (__inj.cs) Object.defineProperty(t, 'colorSpace', { configurable: true, get() { return ''; }, set() { throw new Error('injected colourSpace'); } });
          return t; }
        Object.defineProperty(gm.map, 'constructor', { value: T, configurable: true }); gm.map.__armed = true;
        const r = ME.globe().renderer(), it = r.initTexture.bind(r);
        r.initTexture = t => { if (__inj.up) throw new Error('injected upload'); if (__inj.upBusy) { const e = performance.now() + __inj.upBusy; while (performance.now() < e) {} } return it(t); };
        let p = ME.globe().scene(); while (p && !Object.prototype.hasOwnProperty.call(p, 'setRotationFromMatrix')) p = Object.getPrototypeOf(p);
        const sr = p.setRotationFromMatrix; p.setRotationFromMatrix = function (m) { if (__inj.orient && this.__skyScene === 'moon') throw new Error('injected orientation'); return sr.call(this, m); };
        return true; };` });
    await page.waitForFunction(() => window.ME && ME.globe && ME.globe() && ME.zoomState && ME.skyState, null, { timeout: 30000 });
    return { ctx, page, perr, req, date };
  };
  const cardOn = async page => { await page.click('#tgl-sky'); await page.waitForFunction(() => ME.skyState().status === 'ok', null, { timeout: 20000 }); };
  const openZoom = async (page, wantOpen = true) => { await page.click('#tgl-zoom');
    await page.waitForFunction(() => { const z = ME.zoomState(); return z.open && z.path || /unavailable|No computed/.test(z.msg); }, null, { timeout: 20000 });
    if (wantOpen) { await page.evaluate(() => new Promise(r => setTimeout(r, 450))); await page.evaluate(() => ME.zoomFrame()); } };
  const Z = page => page.evaluate(() => ME.zoomState());
  const waitMap = (page, want, ms = 15000) => page.waitForFunction(w => ME.zoomState().moonMap.status === w, want, { timeout: ms }).then(() => true, () => false);
  const words = page => page.evaluate(() => document.getElementById('zoom-moonmap').textContent);
  const grey = mm => !mm.mapOn && mm.emissive === 0x9a9a9a && !mm.tex;
  const shot = async (page, file) => { await page.waitForTimeout(200); await page.evaluate(() => ME.zoomFrame()); const z = await Z(page), it = z.last.items.find(i => i.k === 'moon'); await page.evaluate(() => { document.getElementById('zoom-svg').style.visibility = 'hidden'; });
    await page.waitForTimeout(300); const el = await page.$('#globe canvas'), bb = await el.boundingBox();
    const buf = await page.screenshot({ clip: { x: bb.x + it.x - 12, y: bb.y + it.y - 12, width: 24, height: 24 } }); fs.writeFileSync(path.join(OUT, file), buf);
    await page.evaluate(() => { document.getElementById('zoom-svg').style.visibility = ''; });
    const p = PNG.sync.read(buf); let n = 0, sum = 0, sq = 0; for (let i = 0; i < p.width * p.height; i++) { const l = (p.data[4 * i] + p.data[4 * i + 1] + p.data[4 * i + 2]) / 3; if (l > 40) { n++; sum += l; sq += l * l; } }
    return { lit_px: n, mean: n ? +(sum / n).toFixed(1) : null, sd: n ? +Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)).toFixed(1) : null, rpx: +it.rpx.toFixed(2), file }; };
  // TEST-ONLY close view: camera on the outward normal of a Moon-fixed point, 3 radii from the centre, looking at the centre
  const look = async (page, lat, lng) => { await page.evaluate(([lat, lng]) => { const m = __moon(), g = ME.globe(), cam = g.camera(), c = g.controls(), n = __mf(lat, lng);
    const p = m.position.clone().add(m.position.clone().set(...n).multiplyScalar(m.scale.x * 3));
    if (!c.__testHold) { c.__testHold = c.update; c.update = () => false; }   // TEST-ONLY: hold the camera (globe.gl's controls would re-aim it at Earth)
    cam.position.copy(p); cam.lookAt(m.position);
    document.getElementById('zoom-svg').style.visibility = 'hidden'; document.getElementById('zoom-ui').style.visibility = 'hidden'; }, [lat, lng]);
    await page.waitForTimeout(250);
    const el = await page.$('#globe canvas'), bb = await el.boundingBox(), w = 9;
    const p = PNG.sync.read(await page.screenshot({ clip: { x: bb.x + bb.width / 2 - (w - 1) / 2, y: bb.y + bb.height / 2 - (w - 1) / 2, width: w, height: w } }));
    let s = [0, 0, 0]; for (let i = 0; i < w * w; i++) for (let k = 0; k < 3; k++) s[k] += p.data[4 * i + k]; return s.map(v => v / (w * w)); };
  const lum = c => (c[0] + c[1] + c[2]) / 3;
  const srcAt = (page, lat, lng) => page.evaluate(async ([lat, lng]) => {   // the map's own pixels at a point (the reference for colour)
    const im = new Image(); im.src = 'assets/moon/lroc_color_2k.jpg?v=1'; await im.decode(); const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const cx = Math.round((lng + 180) / 360 * 2048), cy = Math.round((90 - lat) / 180 * 1024), d = x.getImageData(cx - 4, cy - 4, 9, 9).data;
    let s = [0, 0, 0]; for (let i = 0; i < 81; i++) for (let k = 0; k < 3; k++) s[k] += d[4 * i + k]; return s.map(v => v / 81); }, [lat, lng]);

  // ---------- 1. loads: none before entry; one of each on entry; the view opens with the grey Moon first, then the picture
  if (want('1')) {
    const { ctx, page, req, perr } = await run({ map: { delay: 1500 } });
    await page.waitForTimeout(600); await cardOn(page);
    ok('1a no map or table request on load or on switching the card on', req.map === 0 && req.table === 0, req);
    const t0 = Date.now(); await openZoom(page); const z0 = await Z(page);
    ok('1b the view opens (and frames) while the picture is still loading', z0.open && !!z0.path && z0.moonMap.status === 'loading' && grey(z0.moonMap), z0.moonMap);
    ok('1c entry reads the map and the table once each', req.map === 1 && req.table === 1, req);
    ok('1d loading words shown', /loading/.test(await words(page)), await words(page));
    ok('1e the picture is attached once ready', await waitMap(page, 'ok'));
    const z = await Z(page);
    ok('1f evenly lit picture: emissive map on, emissive white (D3, D4a)', z.moonMap.mapOn && z.moonMap.emissive === 0xffffff, z.moonMap);
    ok('1g orientation for the scene date', z.moonMap.rotDate === '2026-11-27' && z.date === '2026-11-27', z.moonMap);
    ok('1h the picture words name the source, "appearance only", the approximate calculated orientation and the size', /CGI Moon Kit/.test(await words(page)) && /appearance only/.test(await words(page)) && /approximate calculated orientation/.test(await words(page)) && /few pixels/.test(await words(page)));
    ok('1i object URL released after the texture is made', (await page.evaluate(() => __urls)).made === (await page.evaluate(() => __urls)).revoked && !z.moonMap.url, await page.evaluate(() => __urls));
    const tx = await page.evaluate(() => { const t = __moon().material.emissiveMap; return { mip: t.generateMipmaps, min: t.minFilter, space: t.colorSpace, earth: ME.globe().globeMaterial().map.colorSpace, w: t.image && t.image.naturalWidth }; });
    ok('1j mipmaps on, trilinear minification (a 3-px disc averages instead of shimmering)', tx.mip === true && tx.min === 1008, tx);
    ok('1k texture colour space copied from the Earth picture', tx.space === tx.earth, tx);
    console.log('measure: upload', z.moonMap.uploadMs, 'ms; ready after', z.moonMap.prepMs, 'ms (incl. a 1,500 ms routed delay); colour space', tx.space);
    ok('1l no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- 2. orientation by mathematics and against an independent reference, four dates (one near new Moon)
  const ORIENT = [];
  if (want('2')) for (const date of ['2026-11-27', '2026-12-24', '2027-02-21', '2027-07-10']) {
    const { ctx, page, perr } = await run({ date });
    await cardOn(page); await openZoom(page); const got = await waitMap(page, 'ok');
    const r = await page.evaluate(() => ({ mf: { e0: null }, moon: __moon().position.toArray(), X: __mf(0, 0), Y: __mf(0, 90), Zz: __mf(90, 0) }));
    const t = tableAt(date), x = expectDirs(date);
    const eW = await page.evaluate(([la, lo]) => __mf(la, lo), t.e), sW = await page.evaluate(([la, lo]) => __mf(la, lo), t.s);
    const eErr = ang(ecefFromThree(eW), x.eS), sErr = ang(ecefFromThree(sW), x.sS);
    const Rp = [0, 1, 2].map(i => [ecefFromThree(r.X)[i], ecefFromThree(r.Y)[i], ecefFromThree(r.Zz)[i]]);   // columns = Moon-fixed axes in Earth-fixed
    const ref = rotDiff(Rp, await refRotation(date)), phase = ang(x.eS, x.sS);
    ORIENT.push({ date, phase: +phase.toFixed(3), subEarth_deg: +eErr.toExponential(2), subSolar_deg: +sErr.toFixed(4), vs_reference_deg: +ref.toFixed(4) });
    ok(`2a ${date}: picture attached`, got);
    ok(`2b ${date}: the table's sub-Earth point faces Earth (≤ 0.01°)`, eErr <= 0.01, eErr);
    ok(`2c ${date}: the table's sub-solar point faces the Sun (true range) (≤ 0.3°)`, sErr <= 0.3, sErr);
    ok(`2d ${date}: agrees with astronomy-engine's IAU Moon orientation (≤ 0.3°)`, ref <= 0.3, ref);
    ok(`2e ${date}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }
  console.log('orientation', JSON.stringify(ORIENT)); console.log('astronomy-engine', JSON.stringify(AEinfo));

  // ---------- 3. on the picture (TEST-ONLY close views): named landmarks where their coordinates say, with mirrored controls;
  //            and the colour: the rendered centre against the map's own pixels at that point
  if (want('3')) {
    const { ctx, page, perr } = await run({});
    await cardOn(page); await openZoom(page); await waitMap(page, 'ok');
    await page.evaluate(() => ME.zoomGo(1));
    const L = {}; for (const [k, la, lo] of [['cri', 16.18, 59.10], ['criE', 16.18, 100], ['tycho', -43.30, -11.22], ['nub', -20.59, -17.29], ['ori', -19.87, -94.67], ['oriM', -19.87, 94.67], ['high', 5, 150]]) L[k] = lum(await look(page, la, lo));
    console.log('landmarks', JSON.stringify(Object.fromEntries(Object.entries(L).map(([k, v]) => [k, Math.round(v)]))));
    ok('3a Mare Crisium darker than the highlands at 100°E', L.cri < L.criE - 15, L);
    ok('3b Tycho brighter than Mare Nubium', L.tycho > L.nub + 15, L);
    ok('3c Mare Orientale darker than its mirrored longitude', L.ori < L.oriM - 15, L);
    const rend = await look(page, 5, 150), src = await srcAt(page, 5, 150), d = Math.max(...rend.map((v, i) => Math.abs(v - src[i])));
    console.log('colour at 5°N 150°E: rendered', rend.map(Math.round), 'map', src.map(Math.round));
    ok('3d rendered colour matches the map at that point within 12 levels (colour space and emissive white)', d <= 12, { rend, src });
    ok('3e no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- 4. real crops at stop B (DPR 1 and 2), textured and grey; framing unchanged by the picture
  const CROPS = [];
  if (want('4')) for (const [vw, dpr] of [[{ width: 1280, height: 900 }, 1], [{ width: 390, height: 844 }, 2]]) {
    const a = await run({ viewport: vw, dpr }); await cardOn(a.page); await openZoom(a.page); await waitMap(a.page, 'ok'); await a.page.evaluate(() => ME.zoomGo(1));
    const tex = await shot(a.page, `crop-B-${vw.width}x${dpr}-map.png`), pa = (await Z(a.page)).path, calls = (await a.page.evaluate(() => __info())).calls; await a.ctx.close();
    const b = await run({ viewport: vw, dpr, map: { status: 404, body: '' } }); await cardOn(b.page); await openZoom(b.page); await waitMap(b.page, 'failed'); await b.page.evaluate(() => ME.zoomGo(1));
    const gr = await shot(b.page, `crop-B-${vw.width}x${dpr}-grey.png`), pb = (await Z(b.page)).path, callsG = (await b.page.evaluate(() => __info())).calls; await b.ctx.close();
    CROPS.push({ viewport: `${vw.width}x${vw.height}`, dpr, map: tex, grey: gr, draw_calls: { map: calls, grey: callsG } });
    ok(`4a ${vw.width} DPR ${dpr}: the Moon is drawn in both crops`, tex.lit_px > 0 && gr.lit_px > 0, { tex, gr });
    // stops B and C and the box they are framed for; stop A is the camera at entry, which depends on when each page was entered
    // (rev 2: the whole-path comparison failed 3 times in about 45 runs, never with a framing change)
    const fr = P => JSON.stringify({ W: P.W, H: P.H, pt: P.pt, pb: P.pb, B: P.k[1], C: P.k[2] });
    ok(`4b ${vw.width} DPR ${dpr}: framing (stops B and C) identical with and without the picture`, fr(pa) === fr(pb), { a: fr(pa), b: fr(pb), A: [pa.k[0], pb.k[0]] });
    ok(`4c ${vw.width} DPR ${dpr}: draw calls per frame unchanged`, calls === callsG, { calls, callsG });
  }
  console.log('crops', JSON.stringify(CROPS));

  // ---------- 5. failures: grey Moon, failure words, the view still opens; siblings stopped; nothing kept
  if (want('5')) for (const [name, o, want] of [
    ['map 404', { map: { status: 404, body: '' } }, 'answered 404'],
    ['map wrong bytes (pin)', { map: { body: Buffer.concat([MAPB, Buffer.from([0])]) } }, 'pin'],
    ['table wrong bytes (pin)', { table: { body: Buffer.concat([MLB, Buffer.from(' ')]) } }, 'pin'],
    ['map slower than the limit', { map: { delay: 12000 } }, 'timed out'],
    ['decode slower than the limit', { decodeDelay: 12000 }, 'timed out'],
    ['no Earth picture on the globe (no texture class) within the limit', { earth: false }, 'timed out'],
    ['table fails after the map succeeded', { table: { status: 500, body: '', delay: 2500 } }, 'answered 500'],
  ]) {
    const { ctx, page, perr, req } = await run(o);
    await cardOn(page); const t0 = Date.now(); await openZoom(page); const opened = (await Z(page)).open, openMs = Date.now() - t0;
    const done = await waitMap(page, 'failed', 14000), z = await Z(page);
    ok(`5 ${name}: the view opened at once (${openMs} ms)`, opened && openMs < 5000, openMs);
    ok(`5 ${name}: grey Moon, failure recorded (${want})`, done && grey(z.moonMap) && String(z.moonMap.why).includes(want), z.moonMap);
    ok(`5 ${name}: failure words`, /could not be loaded/.test(await words(page)), await words(page));
    if (/slower|no Earth/.test(name)) { await page.waitForTimeout(3500); const z2 = await Z(page);
      ok(`5 ${name}: the late answer is discarded (nothing kept, nothing attached)`, grey(z2.moonMap) && !z2.moonMap.ready && !z2.moonMap.url && z2.moonMap.status === 'failed', z2.moonMap);
      const u = await page.evaluate(() => __urls); ok(`5 ${name}: every object URL revoked`, u.made === u.revoked, u); }
    if (name === 'map 404') { await page.waitForTimeout(300); ok('5 map 404: framing and controls unchanged (stops work)', await page.evaluate(() => { ME.zoomGo(2); return ME.zoomState().stop === 'C'; })); }
    ok(`5 ${name}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }
  if (want('5')) {   // the sibling is stopped when one fails: map fails at once, the table is held back 4 s
    const { ctx, page, req } = await run({ map: { status: 404, body: '' }, table: { delay: 4000 } });
    await cardOn(page); await openZoom(page); await waitMap(page, 'failed'); await page.waitForTimeout(500);
    ok('5 sibling download stopped when the other fails', req.aborted.some(a => /moon-light/.test(a)), req.aborted);
    await ctx.close();
  }

  // ---------- 6. degenerate geometry (crafted scene: the Sun straight behind the Moon) → grey, no invented orientation
  if (want('6')) {
    const sc = JSON.parse(SC), m = sc.bodies.moon.rows.find(r => r[0] === '2026-11-27'), s = sc.bodies.sun.rows.find(r => r[0] === '2026-11-27');
    s[1] = m[1]; s[2] = m[2]; const scene = JSON.stringify(sc);
    const { ctx, page, perr } = await run({ scene });
    await cardOn(page); await openZoom(page); const done = await waitMap(page, 'failed'), z = await Z(page);
    ok('6a degenerate geometry: grey Moon, "orientation" recorded, no texture kept', done && grey(z.moonMap) && z.moonMap.why === 'orientation' && !z.moonMap.ready, z.moonMap);
    const g = await page.evaluate(() => { const r = ME.zoomState().rows; return { nan: ME.zoomMoonRotation({ moon: [r.moon[0], NaN, 0, 1], sun: r.sun }), before: ME.zoomMoonRotation({ moon: ['2026-05-31', 1, 1, 400000], sun: ['2026-05-31', 1, 2, 1.5e8] }) }; });
    ok('6b the guarded fit refuses non-finite input and a date without a table sample', g.nan === null && g.before === null, g);
    ok('6c no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- 7. rollover while open: orientation moves with the positions in one update
  if (want('7')) {
    const { ctx, page, perr } = await run({});
    await cardOn(page); await openZoom(page); await waitMap(page, 'ok');
    await page.clock.setSystemTime(new Date('2026-11-28T00:00:30Z'));
    const r = await page.evaluate(() => { ME.zoomRollover(); const z = ME.zoomState(); return { date: z.date, rot: z.moonMap.rotDate, status: z.moonMap.status }; });
    ok('7a after midnight: scene date and orientation date change together', r.date === '2026-11-28' && r.rot === '2026-11-28' && r.status === 'ok', r);
    const t = tableAt('2026-11-28'), x = expectDirs('2026-11-28'), eW = await page.evaluate(([la, lo]) => __mf(la, lo), t.e);
    ok('7b the new date\'s sub-Earth point faces Earth', ang(ecefFromThree(eW), x.eS) <= 0.01);
    ok('7c no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- 8. Back, races and cleanup: disposal (D6), repeated entry, scene failure, no-position entry
  if (want('8')) {
    const { ctx, page, perr } = await run({});
    await cardOn(page);
    const cdp = await ctx.newCDPSession(page), heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize; };
    const heap0 = await heap();
    const base = (await page.evaluate(() => __info())).textures;
    await openZoom(page); await waitMap(page, 'ok'); const during = (await page.evaluate(() => __info())).textures;
    await page.click('#zoom-back'); await page.waitForTimeout(300);
    const z = await Z(page), after = (await page.evaluate(() => __info())).textures;
    ok('8a Back: grey material, no texture or image kept (D6)', grey(z.moonMap) && !z.moonMap.ready && !z.moonMap.url && z.moonMap.status === 'idle', z.moonMap);
    ok('8b Back: renderer texture count returns to its value before entry', during === base + 1 && after === base, { base, during, after });
    for (let i = 0; i < 4; i++) { await openZoom(page); await waitMap(page, 'ok'); await page.click('#zoom-back'); await page.waitForTimeout(200); }
    const after4 = (await page.evaluate(() => __info())).textures, u = await page.evaluate(() => __urls);
    ok('8c four more entries and exits: texture count back to baseline, object URLs balanced', after4 === base && u.made === u.revoked, { base, after4, u });
    const heap5 = await heap(); console.log('measure: JS heap (after GC) before the first entry', heap0, 'B; after 5 entries and exits', heap5, 'B; difference', heap5 - heap0, 'B');
    ok('8c2 JS heap after 5 entries and exits within 2 MB of its value before the first entry (decoded picture not retained by script)', heap5 - heap0 < 2e6, { heap0, heap5 });
    ok('8d no page errors', perr.length === 0, perr);
    await ctx.close();
  }
  if (want('8')) {   // Back while loading, then a late answer; re-entry gets its own load
    const { ctx, page, req } = await run({ map: { delay: 3000 } });
    await cardOn(page); await openZoom(page); await page.waitForTimeout(500); await page.click('#zoom-back');
    await page.waitForTimeout(3500); const z = await Z(page);
    ok('8e Back while loading: the late answer is not kept or attached', grey(z.moonMap) && !z.moonMap.ready && !z.moonMap.url && !z.moonMap.tex, z.moonMap);
    await openZoom(page); const got = await waitMap(page, 'ok', 15000), z2 = await Z(page), u = await page.evaluate(() => __urls);
    ok('8f re-entry loads again and attaches once, for the current date', got && z2.moonMap.rotDate === z2.date && req.map === 2, { mm: z2.moonMap, req });
    ok('8g object URLs balanced after the race', u.made === u.revoked, u);
    await ctx.close();
  }
  if (want('8')) {   // scene failure: the optional load is cancelled
    const { ctx, page } = await run({ scene: SC + ' ', scenePin: false });   // one extra byte: the scene pin refuses it
    await page.evaluate(() => {}); await cardOn(page); await openZoom(page, false); await page.waitForTimeout(2500);
    const z = await Z(page), u = await page.evaluate(() => __urls);
    ok('8h scene file refused: view not open, optional load cancelled, nothing kept', !z.open && z.moonMap.status === 'idle' && !z.moonMap.ready && !z.moonMap.url && u.made === u.revoked, { z: z.moonMap, msg: z.msg, u });
    await ctx.close();
  }
  if (want('8')) {   // a date without a sample: the existing "No computed position" state, the optional load cancelled
    const { ctx, page } = await run({ date: '2028-02-01' });
    await cardOn(page).catch(() => {}); await openZoom(page, false); await page.waitForTimeout(2500);
    const z = await Z(page), u = await page.evaluate(() => __urls);
    ok('8i no position for the date: optional load cancelled, nothing kept', /No computed position/.test(z.msg) && z.moonMap.status === 'idle' && !z.moonMap.ready && u.made === u.revoked, { mm: z.moonMap, msg: z.msg });
    await ctx.close();
  }

  // ---------- 9. blocking check: a slow picture never delays the view
  if (want('9')) {
    const { ctx, page } = await run({ map: { delay: 6000 } });
    await cardOn(page); const t0 = Date.now(); await page.click('#tgl-zoom');
    const opened = await page.waitForFunction(() => ME.zoomState().open && ME.zoomState().path, null, { timeout: 4000 }).then(() => true, () => false);
    ok('9a with a 6 s picture the view is open and framed within 4 s', opened, Date.now() - t0);
    await ctx.close();
  }

  // ---------- 10. R1 (GPT preview review): preparation, upload and orientation errors end in the failed state — grey, nothing kept,
  //            owned textures disposed, no uncaught error, controls usable — for both completion orderings and on rollover; a later
  //            close and re-entry succeeds. TEST-ONLY injections through the wrappers armed by __arm().
  const R1OUT = [];
  const r1Check = async (label, page, perr, wantWhy) => {
    const done = await waitMap(page, 'failed', 14000), z = await Z(page), tl = await page.evaluate(() => __texLog), u = await page.evaluate(() => __urls);
    R1OUT.push({ label, status: z.moonMap.status, why: z.moonMap.why, tex: tl, urls: u });
    ok(`10 ${label}: failed state, reason "${wantWhy}"`, done && String(z.moonMap.why).startsWith(wantWhy), z.moonMap);
    ok(`10 ${label}: grey Moon, nothing kept (no map, ready data, image or URL)`, grey(z.moonMap) && !z.moonMap.ready && !z.moonMap.url && !z.moonMap.tex, z.moonMap);
    ok(`10 ${label}: every texture made was disposed`, tl.made === tl.disposed, tl);
    ok(`10 ${label}: every object URL revoked`, u.made === u.revoked, u);
    ok(`10 ${label}: failure words`, /could not be loaded or placed/.test(await words(page)), await words(page));
    ok(`10 ${label}: view still open and its controls work`, z.open && await page.evaluate(() => { ME.zoomGo(2); const c = ME.zoomState().stop === 'C'; ME.zoomGo(1); return c && ME.zoomState().stop === 'B'; }));
    ok(`10 ${label}: no uncaught page error`, perr.length === 0, perr);
  };
  const retry = async (label, page, perr) => {
    await page.evaluate(() => { for (const k of ['ctor', 'cs', 'up', 'orient']) __inj[k] = false; __inj.upBusy = 0; });
    await page.click('#zoom-back'); await page.waitForTimeout(300); await openZoom(page); const got = await waitMap(page, 'ok', 15000), z = await Z(page);
    ok(`10 ${label}: after close and re-entry the picture is placed`, got && z.moonMap.mapOn && z.moonMap.rotDate === z.date, z.moonMap);
    await page.click('#zoom-back'); await page.waitForTimeout(300); const z2 = await Z(page), tl = await page.evaluate(() => __texLog), u = await page.evaluate(() => __urls);
    ok(`10 ${label}: after the retry and Back, everything released`, grey(z2.moonMap) && !z2.moonMap.ready && tl.made === tl.disposed && u.made === u.revoked, { mm: z2.moonMap, tl, u });
    ok(`10 ${label}: no uncaught page error after the retry`, perr.length === 0, perr);
  };
  if (want('10')) for (const [kind, why] of [['ctor', 'placement: injected constructor'], ['cs', 'placement: injected colourSpace'], ['up', 'placement: injected upload'], ['orient', 'placement: injected orientation']]) {
    for (const order of ['after-open', 'before-open']) {
      const o = order === 'after-open' ? { map: { delay: 1500 } } : { sceneDelay: 2500 };
      const { ctx, page, perr } = await run(o);
      await cardOn(page); await page.waitForFunction(() => __arm(), null, { timeout: 15000 });
      await page.evaluate(k => { __inj[k] = true; }, kind);
      await openZoom(page);
      const label = `${kind} error, assets ready ${order === 'after-open' ? 'after' : 'before'} the view opened`;
      await r1Check(label, page, perr, why);
      await retry(label, page, perr);
      await ctx.close();
    }
  }
  if (want('10')) {   // rollover: placement of the next date's orientation fails
    const { ctx, page, perr } = await run({});
    await cardOn(page); await page.waitForFunction(() => __arm(), null, { timeout: 15000 });
    await openZoom(page); await waitMap(page, 'ok');
    await page.evaluate(() => { __inj.orient = true; }); await page.clock.setSystemTime(new Date('2026-11-28T00:00:30Z'));
    await page.evaluate(() => { setTimeout(() => ME.zoomRollover(), 0); });   // as the page's own timer calls it: an escaping error is an uncaught page error
    await page.waitForTimeout(300); const z0 = await Z(page); ok('10 rollover: the scene still moves to the new date', z0.date === '2026-11-28', z0.date);
    await r1Check('orientation error on rollover', page, perr, 'placement: injected orientation');
    await retry('orientation error on rollover', page, perr);
    await ctx.close();
  }
  if (want('10')) {   // synchronous preparation that runs past the whole-load limit: refused after it returns
    const { ctx, page, perr } = await run({ map: { delay: 8800 } });
    await cardOn(page); await page.waitForFunction(() => __arm(), null, { timeout: 15000 });
    await page.evaluate(() => { __inj.upBusy = 2500; });
    await openZoom(page);
    await r1Check('upload running past the limit', page, perr, 'timed out');
    await retry('upload running past the limit', page, perr);
    await ctx.close();
  }
  if (R1OUT.length) console.log('r1', JSON.stringify(R1OUT));

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ r1: R1OUT, orientation: ORIENT, crops: CROPS, astronomy_engine: AEinfo, break: B || null, pass, fail, failed }, null, 1));
  await browser.close(); clearTimeout(wd);
  console.log(`\n${fail ? 'FAILED' : 'PASSED'}  ${pass} passed, ${fail} failed${B ? `  (BREAK ${B})` : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
