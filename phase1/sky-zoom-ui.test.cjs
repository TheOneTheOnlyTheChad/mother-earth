/* Mother Earth — Sky zoom-out view, page side (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §11 checks 5–17, 19, 21, 22).
 * Real index.html + app.js + sky.js + skyscene.js served locally (8899); real globe.gl 2.45.0 (SwiftShader); hub routed to the
 * committed R1 and scene files (and to faulty variants); Playwright's clock fixes the date. Expected directions for check 6 come
 * from astronomy-engine in this test (not from the scene file).
 * Run:   node phase1/sky-zoom-ui.test.cjs     (needs `python3 -m http.server 8899 --bind 127.0.0.1` in the repo and /home/claude/spike)
 * Break: BREAK=<name> loads a weakened skyscene.js; the suite must FAIL on every one (names in BREAKS below).
 * 14 Nov 2026 (SKY-DISTANCE-ZOOM-FIX-PROPOSAL rev 2): the path is driven by ctrl+wheel, pinch and the Zoom buttons; a plain
 *   wheel is the page's. New: zoom after a drag (both directions, every stop and between) returns to the path; rendered
 *   evidence (canvas pixels with the SVG overlay hidden, and an independent frustum test incl. the far plane); resize and
 *   rotation; a lifted finger after a pinch is not a drag; tags only on drawable bodies.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const REPO = path.join(__dirname, '..'), BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const R1 = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-2026-11-R1.json'), 'utf8');
const SC = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8');
const SCJ = JSON.parse(SC);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
let JS = fs.readFileSync(path.join(REPO, 'skyscene.js'), 'utf8');
const BREAKS = {
  'no-pin-check': ["if (await sha256(buf) !== SHA) reason = 'integrity check failed';", "/* (break) */"],
  'schema-off': ["  function schema(j) {\n", "  function schema(j) { return true;\n"],
  'no-pair-check': ["    if (!reason && !paired(j)) reason = 'it does not match the distances card';\n", ""],
  'antipode': ["    const at = (lat, lng, altR) => { const c = g.getCoords(lat, lng, altR); return [c.x, c.y, c.z]; };", "    const at = (lat, lng, altR) => { const c = g.getCoords(-lat, lng + 180, altR); return [c.x, c.y, c.z]; };"],
  'swap-axes': ["    const at = (lat, lng, altR) => { const c = g.getCoords(lat, lng, altR); return [c.x, c.y, c.z]; };", "    const at = (lat, lng, altR) => { const c = g.getCoords(lng / 2, lat * 2, altR); return [c.x, c.y, c.z]; };"],
  'mirror-lng': ["    const at = (lat, lng, altR) => { const c = g.getCoords(lat, lng, altR); return [c.x, c.y, c.z]; };", "    const at = (lat, lng, altR) => { const c = g.getCoords(lat, -lng, altR); return [c.x, c.y, c.z]; };"],
  'nearest-day': ["  const rowsFor = date => { const m = st.index.moon.get(date), s = st.index.sun.get(date); return m && s ? { moon: m, sun: s } : null; };",
    "  const rowsFor = date => { const r = b => st.file.bodies[b].rows.reduce((a, x) => Math.abs(Date.parse(x[0]) - Date.parse(date)) < Math.abs(Date.parse(a[0]) - Date.parse(date)) ? x : a); return { moon: r('moon'), sun: r('sun') }; };"],
  'eager': ["  // read-only aids for tests and the console", "  load();\n  // read-only aids for tests and the console"],
  'no-restore-layers': ["    for (const [o, v] of sv.layers) o.visible = v;\n", ""],
  'no-restore-near': ["    cam.near = sv.near; cam.updateProjectionMatrix();\n", ""],
  'no-restore-focus': ["    const back = $('tgl-zoom'); if (back) back.focus();", ""],
  'no-scale-label': ["  function scaleLine() { return st.sunShown || (!st.free && st.s > 1) ? TXT.C : TXT.B; }", "  function scaleLine() { return st.sunShown ? '' : TXT.B; }"],
  'stale-text': ["    writeText(); writeStrip(); if (!st.raf) loop();", "    writeStrip(); if (!st.raf) loop();"],
  'animate-always': ["  function goStop(n) { if (!st.open || !st.path) return; st.placing = true; setS(n); st.placing = false; }",
    "  function goStop(n) { if (!st.open || !st.path) return; setTimeout(() => { st.placing = true; setS(n); st.placing = false; }, 400); }"],
  'fixed-distance': ["      if (!best || z < best.d) best = { u, d: z, tgt };", "      if (!best) best = { u, d: 40 * list[0].r, tgt };"],
  'fixed-direction': ["    for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), t = g * i; if (Math.abs(y) < 0.97) out.push([Math.cos(t) * r, y, Math.sin(t) * r]); }", "    out.push([0.6, 0.0, 0.8]);"],
  'tags-same-side': ["        if (tags.some(t => overlaps(t, box)) || rings.some(r => r.k !== it.k && overlaps(r, box))) continue; pick = box; break; }", "        pick = box; break; }"],
  'sun-400-full-labels': ["  const SUN_SCENE_R = 200;", "  const SUN_SCENE_R = 400;"],
  'strip-over-scene': ["    const pt = $('zoom-bar').offsetHeight + 8, pb = $('zoom-strip').offsetHeight + 8;", "    const pt = $('zoom-bar').offsetHeight + 8, pb = 0;"],
  'near-default': ["    if (Math.abs(near - cam.near) > 1e-9) { cam.near = near; cam.updateProjectionMatrix(); }", "    /* (break) near plane never changed */"],
  'near-by-distance': ["let m = Infinity; for (const b of list) { const z = V.dot(V.sub(b.pos, cp), fv) - b.r; if (z > 0) m = Math.min(m, z); }",
    "let m = Infinity; for (const b of list) { const z = V.len(V.sub(b.pos, cp)) - b.r; if (z > 0) m = Math.min(m, z); }"],
  'split-update': ["    st.meshes.moon.visible = true; st.meshes.geo = bodiesFor(rows); positionMeshes();", "    st.meshes.moon.visible = true;"],
  'no-occlusion-check': ["        if (t > 0 && t < it.dist && V.len(V.sub(w, V.mul(dir, t))) < b.r) it.occludedBy = o.k; } }", "      } }"],
  'endpoint-only': ["    st.placing = true; setS(st.s + dir * STEP, 'keep'); st.placing = false; announce();", "    st.placing = true; setS(Math.max(0, Math.min(2, Math.round(st.s) + dir)), 'keep'); st.placing = false; announce();"],
  'target-by-s': ["    const v = { u: slerp(a.u, b.u, w), d, t: lerp(a.t, b.t, w) };\n    if (t <= 0 || t >= 1 || earthSafe(v)) return v;", "    const v = { u: slerp(a.u, b.u, t), d, t: lerp(a.t, b.t, t) };\n    return v;"],
  'no-containment': ["    if (t <= 0 || t >= 1 || earthSafe(v)) return v;", "    return v;"],
  'pinch-off': ["      if (H.pts.size === 2 && H.pinch0) {", "      if (false) {"],
  // 14 Nov 2026 (zoom fix)
  'free-zoom-old': ["    const STEP = 0.08 * k;\n    st.placing = true; setS(st.s + dir * STEP, 'keep');",
    "    const STEP = 0.08 * k;\n    if (st.free) { const g = ME.globe(), cam = g.camera(), t = g.controls().target, f = Math.exp(dir * STEP * 4);\n      const off = V.mul([cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z], f);\n      st.placing = true; cam.position.set(t.x + off[0], t.y + off[1], t.z + off[2]); g.controls().update(); st.placing = false; return; }\n    st.placing = true; setS(st.s + dir * STEP, 'keep');"],
  'plain-wheel-zooms': ["if (!e.ctrlKey) return; e.preventDefault();", "e.preventDefault();"],
  'no-resize-reframe': ["    H.ro.observe($('globe')); H.ro.observe($('zoom-strip'));", ""],
  'tags-not-frustum': ["const shown = items.filter(it => it.drawable)", "const shown = items"],
  'pinch-leaves-drag': ["      if (H.pinched || H.pts.size >= 2) {", "      if (H.pts.size >= 2) {"],
  'buttons-off': ["  $('zoom-out').addEventListener('click', () => step(1, BTN_STEP));", ""],
  'resize-keeps-sheet': ["    const sheet = $('sheet'); if (sheet && !sheet.classList.contains('collapsed') && getComputedStyle($('sheet-btn')).display !== 'none') { st.saved.sheetWasOpen = true; $('sheet-btn').click(); return; }", ""],
  'strip-40': null,   // style.css served with the strip's old 40% cap (the explanation then cannot be framed above)
};
// sun-400-full-labels also widens the tag model (rev 2.1 §4.3)
const B = process.env.BREAK;
if (B && !(B in BREAKS)) throw new Error('unknown break: ' + B);
if (B && BREAKS[B]) { const [a, b] = BREAKS[B]; if (!JS.includes(a)) throw new Error('break anchor missing: ' + B); JS = JS.replace(a, b);
  if (B === 'sun-400-full-labels') JS = JS.replace('const TAG = { w: 56, h: 18 }', 'const TAG = { w: 150, h: 34 }'); }

const EARTH_PNG = (() => { const P = require('/home/claude/spike/node_modules/pngjs').PNG, im = new P({ width: 64, height: 32 });
  for (let i = 0; i < 64 * 32; i++) { im.data[4 * i] = 235; im.data[4 * i + 1] = 245; im.data[4 * i + 2] = 255; im.data[4 * i + 3] = 255; } return P.sync.write(im); })();
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 25 min — failure, not a hang'); process.exit(1); }, 25 * 60e3);

let A = null;
const expected = async (body, date) => {   // astronomy-engine: geocentric, geometric, of-date, apparent sidereal → Earth-fixed unit vector
  A = A || await import('/home/claude/spike/node_modules/astronomy-engine/esm/astronomy.js');
  const t = A.MakeTime(new Date(date + 'T00:00:00Z')), v = body === 'sun' ? A.GeoVector(A.Body.Sun, t, false) : A.GeoMoon(t);
  const e = A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(t), v)), lat = e.dec * Math.PI / 180, lng = (e.ra * 15 - A.SiderealTime(t) * 15) * Math.PI / 180;
  return [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)];
};
const angle = (a, b) => { const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return Math.atan2(Math.hypot(...c), d) * 180 / Math.PI; };
const unitEcefFromThree = p => { const r = Math.hypot(...p); return [p[2] / r, p[0] / r, p[1] / r]; };   // three (x,y,z) = ECEF (y,z,x)

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async ({ time = '2026-11-10T10:00:00Z', viewport = { width: 1280, height: 900 }, scene = SC, pin = null, r1 = R1, hasTouch = false, earth = false }) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch });
    const hits = [];
    let js = JS; if (pin) js = js.replace(`const SHA = '${sha(SC)}';`, `const SHA = '${pin}';`);
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    // earth: true → a plain near-white Earth image instead of no imagery (a black, untextured Earth is invisible on the dark page,
    // so the rendered-evidence checks need one); every other check keeps the original no-imagery set-up
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => earth ? r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: EARTH_PNG }) : r.abort());
    await ctx.route(BASE + '/skyscene.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: js }));
    if (B === 'strip-40') await ctx.route(BASE + '/style.css*', r => r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(path.join(REPO, 'style.css'), 'utf8').replace('max-height:30%;overflow:auto', 'max-height:40%;overflow:auto') }));
    await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname; hits.push(p);
      if (p === '/catalogue/sky/sky-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: r1 });
      if (p === '/catalogue/sky/sky-scene-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: scene });
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
    await page.clock.install({ time: new Date(time) });
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    // INDEPENDENT near-plane expectation (not the page's own report): forward depth from the camera's actual world direction to
    // the drawn meshes' actual positions/scales (Earth: globe radius x 1.2, the rule's atmosphere margin); hidden meshes skipped
    await page.addScriptTag({ content: `window.__expectNear = () => { const g = ME.globe(), cam = g.camera(), f = cam.getWorldDirection(cam.position.clone()), c = cam.position;
      const bodies = [{ p: [0, 0, 0], r: g.getGlobeRadius() * 1.2 }]; g.scene().traverse(o => { if (o.__skyScene && o.visible) bodies.push({ p: [o.position.x, o.position.y, o.position.z], r: o.scale.x }); });
      let m = Infinity; for (const b of bodies) { const z = (b.p[0] - c.x) * f.x + (b.p[1] - c.y) * f.y + (b.p[2] - c.z) * f.z - b.r; if (z > 0) m = Math.min(m, z); }
      return { expected: Math.max(0.05, isFinite(m) ? 0.2 * m : 0.05), actual: cam.near }; };` });
    await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState && ME.skyState, null, { timeout: 30000 });
    return { ctx, page, perr, hits };
  };
  const cardOn = async page => { await page.click('#tgl-sky'); await page.waitForFunction(() => ME.skyState().status === 'ok', null, { timeout: 20000 }); };
  const openZoom = async page => { await page.click('#tgl-zoom');
    await page.waitForFunction(() => { const z = ME.zoomState(); return z.open && z.path || /unavailable|No computed/.test(z.msg); }, null, { timeout: 20000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 450)));   // the readings sheet's transition can resize the globe after entry; the view re-frames for it
    await page.evaluate(() => ME.zoomFrame()); };
  const Z = page => page.evaluate(() => { ME.zoomFrame(); return ME.zoomState(); });
  const snap = page => page.evaluate(() => { const g = ME.globe(), cam = g.camera(), c = g.controls(), vis = [];
    g.scene().traverse(o => vis.push(o.visible));
    return { pos: cam.position.toArray().map(v => +v.toFixed(6)), target: c.target.toArray(), near: cam.near, minD: c.minDistance, maxD: c.maxDistance, zoom: c.enableZoom,
      auto: c.autoRotate, damp: c.enableDamping, vis: vis.join(''), sheet: document.getElementById('sheet').className, kids: g.scene().children.length }; });
  const sceneMeshes = page => page.evaluate(() => { let n = 0; ME.globe().scene().traverse(o => { if (o.__skyScene) n++; }); return n; });

  // ---------- check 8: off on load, zero scene requests until entry; then exactly one
  {
    const { ctx, page, hits, perr } = await run({});
    await page.waitForTimeout(500);
    await cardOn(page);
    ok('check 8: no scene request on load or on switching the card on', !hits.includes('/catalogue/sky/sky-scene-2026-11-R1'), hits.filter(h => h.startsWith('/catalogue')));
    await openZoom(page);
    ok('check 8: entry makes exactly one scene request', hits.filter(h => h === '/catalogue/sky/sky-scene-2026-11-R1').length === 1, hits.filter(h => h.startsWith('/catalogue')));
    ok('view open on 10 Nov 2026', (await Z(page)).open && (await Z(page)).date === '2026-11-10');
    ok('no page errors (check 8 run)', perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- check 5 + 19: wrong sha / schema / content / pair → nothing drawn, says why
  for (const [name, opts, want] of [
    ['wrong bytes (sha mismatch)', { scene: SC.replace('"schema":1', '"schema":1 ') }, /integrity/],
    ['schema: wrong content field (pin adjusted to match)', (() => { const s = JSON.stringify({ ...SCJ, content: 'catalogue' }); return { scene: s, pin: sha(s) }; })(), /invalid/],
    ['schema: a row with five fields missing one (pin adjusted)', (() => { const j = JSON.parse(SC); j.bodies.moon.rows[3] = j.bodies.moon.rows[3].slice(0, 4); const s = JSON.stringify(j); return { scene: s, pin: sha(s) }; })(), /invalid/],
    ['check 19: pairs_with names another card file (pin adjusted)', (() => { const j = JSON.parse(SC); j.pairs_with.fileSha256 = '0'.repeat(64); const s = JSON.stringify(j); return { scene: s, pin: sha(s) }; })(), /does not match the distances card/],
  ]) {
    const { ctx, page } = await run(opts);
    await cardOn(page); await openZoom(page);
    const z = await Z(page);
    ok(`check 5/19: ${name} → view not opened, reason named, nothing drawn`, !z.open && want.test(z.msg) && await sceneMeshes(page) === 0 && await page.evaluate(() => document.getElementById('zoom-ui').hidden), z.msg);
    await ctx.close();
  }

  // ---------- check 7: date without a row → no view, message, zero draws
  {
    const { ctx, page } = await run({ time: '2028-01-05T12:00:00Z' });
    await cardOn(page); await openZoom(page);
    const z = await Z(page);
    ok('check 7: out-of-coverage date → "No computed position for today", nothing drawn', !z.open && /No computed position for today \(5 Jan 2028\)/.test(z.msg) && await sceneMeshes(page) === 0, z.msg);
    await ctx.close();
  }

  // ---------- check 6: signed 3D direction of the drawn bodies vs astronomy-engine; incl. near-opposite and near-conjunction dates
  for (const date of ['2026-11-10', '2027-02-21', '2026-09-11', '2027-12-28']) {
    const { ctx, page } = await run({ time: date + 'T06:00:00Z' });
    await cardOn(page); await openZoom(page);
    await page.evaluate(() => ME.zoomGo(2)); const z = await Z(page);
    for (const b of ['moon', 'sun']) {
      const got = unitEcefFromThree(z.meshWorld[b]), want = await expected(b, date), a = angle(got, want);
      ok(`check 6: ${date} ${b}: drawn direction within 0.01° of astronomy-engine, same side (dot > 0)`, a <= 0.01 && got[0] * want[0] + got[1] * want[1] + got[2] * want[2] > 0, { a });
    }
    await ctx.close();
  }

  // ---------- checks 14, 15, 21, 10, 11: framing on the rendered viewport, per canvas and date
  const DATES = ['2026-11-10', '2027-02-21', '2026-09-11', '2027-12-28', '2027-02-28', '2027-04-02', '2026-06-27', '2027-12-06'];
  const CANV = [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 1280, height: 900 }];
  const inside = (b, W, H, pad = 0) => b.x >= pad && b.y >= pad && b.x + b.w <= W - pad && b.y + b.h <= H - pad;
  const ov = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const frameChecks = (z, stop, label) => {
    const L = z.last, want = stop === 'B' ? ['earth', 'moon'] : ['earth', 'moon', 'sun'];
    const items = want.map(k => L.items.find(i => i.k === k)), tags = want.map(k => L.tags.find(t => t.k === k));
    const ringBox = it => { const r = Math.max(6, it.rpx + 4); return { x: it.x - r, y: it.y - r, w: 2 * r, h: 2 * r }; };
    ok(`${label}: every intended body drawn, in frame, with its tag inside the canvas`, items.every(i => i && i.inFrame) && tags.every(t => t && !t.forced && inside(t, L.W, L.H)), { items: L.items.map(i => [i.k, Math.round(i.x), Math.round(i.y), i.inFrame]), tags: L.tags });
    const all = items.every(Boolean) && tags.every(Boolean);   // a missing body or tag fails every check below (never a crash)
    ok(`${label}: no two tags overlap; no tag over another body's ring`, all && tags.every((t, i) => tags.every((u, k) => k === i || !ov(t, u)) && items.every((it, k) => k === i || !ov(t, ringBox(it)))));
    ok(`${label}: no body hides another (check 21)`, all && items.every(i => !i.occludedBy), items.map(i => i && [i.k, i.occludedBy]));
    ok(`${label}: strip and stop bar cover no marker or tag`, all && items.every(i => !ov(ringBox(i), L.strip) && !ov(ringBox(i), L.bar)) && tags.every(t => !ov(t, L.strip) && !ov(t, L.bar)), { strip: L.strip, bar: L.bar });
    ok(`${label}: scale line matches what is drawn (check 10)`, L.scale === (stop === 'C' ? 'Earth and Moon to scale. Sun drawn closer and resized. Labels show actual distances.' : 'Earth and Moon to scale. Labels show actual distances.'), L.scale);
  };
  for (const vp of CANV) for (const date of DATES) {
    const { ctx, page, perr } = await run({ time: date + 'T06:00:00Z', viewport: vp });
    await cardOn(page); await openZoom(page);
    const lbl = `${vp.width}x${vp.height} ${date}`;
    if (!(await Z(page)).open) { ok(`${lbl}: view opens`, false, (await Z(page)).msg); await ctx.close(); continue; }
    await page.evaluate(() => ME.zoomGo(1)); frameChecks(await Z(page), 'B', `check 14 stop B ${lbl}`);
    await page.evaluate(() => ME.zoomGo(2)); const zc = await Z(page); frameChecks(zc, 'C', `check 15 stop C ${lbl}`);
    if (date === '2026-11-10' || date === '2027-12-28') {
      const t = await page.evaluate(() => document.getElementById('zoom-text').textContent), r = zc.rows;
      const dms = (v, p, n) => `${Math.abs(v).toFixed(2)}° ${v < 0 ? n : p}`;
      ok(`check 11 ${lbl}: text equivalent states the date, both distances and both points beneath, matching the drawn rows`,
        t.includes(`00:00 UTC, ${+date.slice(8)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+date.slice(5, 7) - 1]} ${date.slice(0, 4)}`)
        && t.includes(Math.round(r.moon[3]).toLocaleString('en-GB') + ' km') && t.includes((r.sun[3] / 1e6).toFixed(1) + ' million km')
        && t.includes(dms(r.moon[1], 'N', 'S')) && t.includes(dms(r.sun[2], 'E', 'W')) && r.moon[0] === date, t.slice(0, 300));
      const ovf = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      ok(`check 12 ${lbl}: no horizontal overflow with the view open`, !ovf);
    }
    ok(`${lbl}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }

  // ---------- check 9: 5 entry/exit cycles restore everything; check 13: stop jumps are immediate (reduced motion)
  {
    const { ctx, page } = await run({ viewport: { width: 390, height: 844 } });
    // wait for globe.gl to finish building the scene (it grows from 2 to ~27 objects in the first seconds), then let it settle
    await page.waitForFunction(() => { let n = 0; ME.globe().scene().traverse(() => n++); return n > 20; }, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => ME.pointView(-10, 25));
    await cardOn(page);
    // switch day/night on for some cycles so a time-dependent layer is present
    for (let i = 0; i < 5; i++) {
      if (i === 2) await page.evaluate(() => document.getElementById('tgl-night').click());
      await page.waitForTimeout(200);
      const before = await snap(page), focusId = 'tgl-zoom';
      await page.evaluate(() => document.getElementById('tgl-zoom').scrollIntoView());
      await openZoom(page);
      const inView = await snap(page);
      await page.evaluate(i => ME.zoomGo([1, 2, 0, 2, 1][i]), i);
      const z = await Z(page), want = z.path.k[[1, 2, 0, 2, 1][i]], cam = (await snap(page)).pos;
      const tgt = want.t, p = [tgt[0] + want.u[0] * want.d, tgt[1] + want.u[1] * want.d, tgt[2] + want.u[2] * want.d];
      ok(`check 13 cycle ${i + 1}: stop reached immediately (no animated transition)`, Math.hypot(cam[0] - p[0], cam[1] - p[1], cam[2] - p[2]) < 1e-3 * want.d, { cam, p });
      ok(`check 9 cycle ${i + 1}: layers hidden in the view (visibility changed), sheet collapsed on phone`, inView.vis !== before.vis && /collapsed/.test(inView.sheet));
      await page.click('#zoom-back'); await page.waitForTimeout(400);
      const after = await snap(page), f = await page.evaluate(() => document.activeElement && document.activeElement.id);
      // target compared within 1e-9 units (globe radius = 100): OrbitControls adds ~2.6e-14 per entry/exit cycle after the restore
      // (floating-point noise, ~1e-13 km); every other field exactly
      const same = ['near', 'minD', 'maxD', 'zoom', 'auto', 'damp', 'vis', 'sheet', 'kids'].filter(k => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
        .concat(Math.hypot(...after.target.map((v, k) => v - before.target[k])) > 1e-9 ? ['target'] : []);
      ok(`check 9 cycle ${i + 1}: camera, target, zoom limits, near plane, auto-rotate, damping, every object's visibility, sheet restored; focus returned`,
        same.length === 0 && Math.hypot(...after.pos.map((v, k) => v - before.pos[k])) < 1e-6 * Math.hypot(...before.pos) + 1e-6 && f === focusId, { diff: same, f, tb: before.target, ta: after.target });
    }
    await ctx.close();
  }

  // ---------- check 17: rollover while open — one update, never mixed
  {
    const { ctx, page } = await run({ time: '2026-11-10T23:59:00Z' });
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(2));
    const before = await Z(page);
    await page.clock.runFor(120e3); await page.evaluate(() => ME.zoomRollover());
    const after = await Z(page), t = await page.evaluate(() => document.getElementById('zoom-text').textContent + '|' + document.getElementById('zoom-when').textContent);
    const r11 = SCJ.bodies.moon.rows.find(r => r[0] === '2026-11-11');
    const want = await page.evaluate(r => { const c = ME.globe().getCoords(r[1], r[2], r[3] / 6378.137 - 1); return [c.x, c.y, c.z]; }, r11);
    ok('check 17: after midnight UTC the date, rows, drawn Moon and both text places all move to 11 Nov together',
      before.date === '2026-11-10' && after.date === '2026-11-11' && after.rows.moon[0] === '2026-11-11' && after.rows.sun[0] === '2026-11-11'
      && Math.hypot(...after.meshWorld.moon.map((v, k) => v - want[k])) < 1e-6 && /11 Nov 2026/.test(t) && !/10 Nov 2026/.test(t), { d: after.date, t: t.slice(0, 200) });
    await ctx.close();
  }

  // ---------- check 16 + 22: wheel sequence and pinch sequence A→B→C→A; near plane by forward depth, no clipping; free orbit
  for (const kind of ['ctrl+wheel', 'pinch', 'buttons']) {
    const { ctx, page } = await run({ viewport: kind === 'pinch' ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: kind === 'pinch' });
    await cardOn(page); await openZoom(page);
    const box = await page.evaluate(() => { const r = ME.globe().renderer().domElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const doStep = async dir => {
      if (kind === 'ctrl+wheel') { await page.mouse.move(box.x, box.y); await page.keyboard.down('Control'); await page.mouse.wheel(0, dir * 100); await page.keyboard.up('Control'); }
      else if (kind === 'buttons') await page.click(dir > 0 ? '#zoom-out' : '#zoom-in');
      else await page.evaluate(({ x, y, dir }) => { const el = ME.globe().renderer().domElement, ev = (t, id, px) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: px, clientY: y, bubbles: true }));
        ev('pointerdown', 1, x - 60); ev('pointerdown', 2, x + 60); const d = dir > 0 ? 0.7 : 1.4; ev('pointermove', 1, x - 60 * d); ev('pointermove', 2, x + 60 * d); ev('pointerup', 1, x - 60 * d); ev('pointerup', 2, x + 60 * d); }, { ...box, dir });
      await page.waitForTimeout(30);
    };
    const seen = new Set(); let bad = [], steps = 0, sMax = 0;
    for (const dir of [...Array(40).fill(1), ...Array(40).fill(-1)]) {
      await doStep(dir); steps++;
      const z = await Z(page), L = z.last; sMax = Math.max(sMax, z.s); seen.add(Math.round(z.s * 4) / 4);
      const drawn = L.items.filter(i => i.inFrame);
      const xn = await page.evaluate(() => window.__expectNear()), nearOk = Math.abs(xn.actual - xn.expected) <= 1e-6 * Math.max(1, xn.expected);   // the camera's near vs an independent forward-depth computation
      const noClip = L.items.every(i => i.k === 'sun' && !L.sunShown || i.inFrame === false || i.dist - 0 > L.near);
      const tagsOk = drawn.every(i => L.tags.some(t => t.k === i.k));
      const scaleOk = L.scale === (L.sunShown ? 'Earth and Moon to scale. Sun drawn closer and resized. Labels show actual distances.' : 'Earth and Moon to scale. Labels show actual distances.');
      if (!(nearOk && noClip && tagsOk && scaleOk && L.items.every(i => !i.occludedBy))) bad.push({ s: +z.s.toFixed(2), nearOk, noClip, tagsOk, scaleOk });
    }
    ok(`check 22 ${kind}: one continuous sequence reaches stop C (s = 2) and passes through intermediate positions`, sMax >= 2 - 1e-9 && seen.size >= 8, { sMax, seen: [...seen].sort() });
    ok(`check 22 ${kind}: back to stop A (s = 0) at the end`, (await Z(page)).s === 0, (await Z(page)).s);
    ok(`check 16/22 ${kind}: at every step the near plane follows forward depth, nothing clipped, tags on every body in frame, scale line right, no occlusion`, bad.length === 0, bad.slice(0, 5));
    await ctx.close();
  }
  {   // free orbit: a mouse drag rotates the view (free); near plane still follows forward depth; Re-frame returns to the path
    const { ctx, page } = await run({});
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(2));
    const c = await page.evaluate(() => { const r = ME.globe().renderer().domElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(c.x, c.y); await page.mouse.down(); for (let i = 1; i <= 10; i++) { await page.mouse.move(c.x + i * 15, c.y + i * 5); await page.waitForTimeout(20); } await page.mouse.up();
    const z = await Z(page), L = z.last, xn = await page.evaluate(() => window.__expectNear());
    ok('check 16 free orbit (independent forward depth): dragging makes the view free, near plane exactly the forward-depth rule (and > the default at stop C)', z.free && Math.abs(xn.actual - xn.expected) <= 1e-6 * xn.expected && xn.actual > 1, { free: z.free, xn });
    ok('Re-frame button shown while free', await page.evaluate(() => !document.getElementById('zoom-reframe').hidden));
    await page.click('#zoom-reframe');
    ok('Re-frame returns to the path at stop C', !(await Z(page)).free && (await Z(page)).stop === 'C');
    await page.click('#zoom-back'); await page.waitForTimeout(300);
    ok('check 16: near plane restored to globe.gl\'s 0.05 on exit', await page.evaluate(() => ME.globe().camera().near) === 0.05);
    await ctx.close();
  }

  // ---------- 14 Nov 2026 zoom fix (SKY-DISTANCE-ZOOM-FIX-PROPOSAL rev 2)
  // Independent evidence, not the page's own report: (1) a frustum test from the camera's matrices and the meshes actually in
  // the scene (near AND far planes); (2) canvas pixels with the SVG overlay hidden, at each tagged body's projected position.
  const PNG = require('/home/claude/spike/node_modules/pngjs').PNG;
  const evidence = async page => {
    const geo = await page.evaluate(() => { ME.zoomFrame(); const g = ME.globe(), cam = g.camera(); cam.updateMatrixWorld();
      const V3 = cam.position.constructor, el = g.renderer().domElement, r = el.getBoundingClientRect(), out = [];
      const bodies = [{ k: 'earth', p: [0, 0, 0], r: g.getGlobeRadius() }]; g.scene().traverse(o => { if (o.__skyScene && o.visible) bodies.push({ k: o.__skyScene, p: o.position.toArray(), r: o.scale.x }); });
      for (const b of bodies) {
        const v = new V3(...b.p).applyMatrix4(cam.matrixWorldInverse), z = -v.z;          // camera space, looking down -z
        const inDepth = z + b.r > cam.near && z - b.r < cam.far;
        const tv = Math.tan(cam.fov * Math.PI / 360), th = tv * cam.aspect, zz = Math.max(z, cam.near);
        const inSide = Math.abs(v.x) - b.r <= th * zz && Math.abs(v.y) - b.r <= tv * zz;
        const sp = new V3(...b.p).project(cam), x = (sp.x + 1) / 2 * r.width, y = (1 - sp.y) / 2 * r.height;
        const rpx = z > 0 ? b.r / z / tv * (r.height / 2) : 0;
        out.push({ k: b.k, z, far: cam.far, near: cam.near, frustum: inDepth && inSide, x, y, rpx });
      }
      const L = ME.zoomState().last; return { bodies: out, tags: L.tags.map(t => t.k), W: r.width, H: r.height, rect: { x: r.left, y: r.top } }; });
    // pixels: the page as the visitor sees it (HTML bar and strip included) with the SVG overlay hidden, then again with ONE body's
    // mesh hidden; the body counts as drawn where the two differ inside its projected disc (so a body under the strip, clipped by
    // a plane or off the canvas counts 0)
    const grab = async () => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      return PNG.sync.read(await page.screenshot({ clip: { x: geo.rect.x, y: geo.rect.y, width: geo.W, height: geo.H } })); };
    // hidden by scale, not by .visible (the view sets the Sun's .visible every frame)
    const hide = (k, v) => page.evaluate(({ k, v }) => { const g = ME.globe(), gm = g.globeMaterial();
      g.scene().traverse(o => { if (k === 'earth' ? o.isMesh && (Array.isArray(o.material) ? o.material[0] : o.material) === gm : o.__skyScene === k) {
        if (!v) { o.__s = o.scale.clone(); o.scale.setScalar(1e-9); } else if (o.__s) { o.scale.copy(o.__s); delete o.__s; } } }); }, { k, v });
    await page.evaluate(() => { document.getElementById('zoom-svg').style.visibility = 'hidden'; });
    const base = await grab(), sc = base.width / geo.W;
    for (const b of geo.bodies) { b.pixels = 0; if (!(b.z > 0)) continue;
      await hide(b.k, false); const off = await grab(); await hide(b.k, true);
      const rr = Math.max(2.5, Math.min(b.rpx, 40)) * sc, cx = b.x * sc, cy = b.y * sc;
      for (let y = Math.floor(cy - rr); y <= Math.ceil(cy + rr); y++) for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) {
        if (x < 0 || y < 0 || x >= base.width || y >= base.height || Math.hypot(x - cx, y - cy) > rr) continue;
        const i = (base.width * y + x) << 2; if (Math.abs(base.data[i] - off.data[i]) + Math.abs(base.data[i + 1] - off.data[i + 1]) + Math.abs(base.data[i + 2] - off.data[i + 2]) > 12) b.pixels++; } }
    await page.evaluate(() => { document.getElementById('zoom-svg').style.visibility = ''; });
    return geo;
  };
  // Earth drawn (frustum + pixels) and every tagged body drawable (frustum) and drawn (pixels)
  // atStop: every tagged body also has pixels. Between stops a tagged body must be drawable (inside the frustum); it may sit under
  // the stop bar or the strip while the camera travels (proposal rev 2: bodies may move into or out of view between stops)
  const drawnOk = (g, atStop = true) => { const e = g.bodies.find(b => b.k === 'earth');
    return e.frustum && e.pixels > 0 && g.tags.every(k => { const b = g.bodies.find(x => x.k === k); return b && b.frustum && (!atStop || b.pixels > 0); }); };
  const centre = page => page.evaluate(() => { const r = ME.globe().renderer().domElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const drag = async (page, c) => { await page.mouse.move(c.x, c.y); await page.mouse.down(); for (let i = 1; i <= 10; i++) { await page.mouse.move(c.x + i * 12, c.y + i * 4); await page.waitForTimeout(15); } await page.mouse.up(); };
  const ctrlWheel = async (page, c, dy) => { await page.mouse.move(c.x, c.y); await page.keyboard.down('Control'); await page.mouse.wheel(0, dy); await page.keyboard.up('Control'); await page.waitForTimeout(20); };

  // the stops themselves: rendered evidence (desktop and both phones; strip open and closed)
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }, { width: 900, height: 700 }]) {
    const { ctx, page } = await run({ viewport: vp, earth: true });
    await cardOn(page); await openZoom(page);
    const bad = [], overNote = [];
    for (const n of [0, 1, 2]) for (const how of ['closed', 'open']) {
      await page.evaluate(how => { document.querySelector('.zoom-how').open = how === 'open'; }, how); await page.waitForTimeout(200);   // the strip grows; the view re-frames for it
      await page.evaluate(n => ME.zoomGo(n), n);
      const zz = await Z(page); if (!zz.open) { bad.push({ n, how, err: 'view closed' }); continue; }
      const over = !!zz.path.stripOver; if (how === 'open') overNote.push(`${n}:${over ? 'kept framing (does not fit above the open strip)' : 're-framed above the open strip'}`);
      const g = await evidence(page), want = n === 0 ? [] : n === 1 ? ['moon'] : ['moon', 'sun'];
      if (over) { bad.push({ n, how, err: 'the stops were not re-framed above the open explanation (strip capped at 30% of the box)' }); continue; }
      if (!drawnOk(g) || !want.every(k => g.tags.includes(k))) bad.push({ n, how, tags: g.tags, b: g.bodies.map(b => [b.k, b.frustum, b.pixels]) });
    }
    await page.evaluate(() => { document.querySelector('.zoom-how').open = false; });
    console.log(`  note rendered stops ${vp.width}x${vp.height}, explanation open: ${overNote.join('; ')}`);
    ok(`rendered stops ${vp.width}x${vp.height}: with "How this is drawn" closed and open (re-framed above it), Earth drawn at every stop (canvas pixels, SVG hidden; frustum incl. far plane); at + Moon / + Sun the expected bodies are tagged, drawable and drawn`, bad.length === 0, bad);
    await ctx.close();
  }

  // zoom after a drag: both directions, from each stop and between stops; desktop by ctrl+wheel, phone by pinch and buttons
  for (const [vp, how] of [[{ width: 1280, height: 900 }, 'ctrl+wheel'], [{ width: 390, height: 844 }, 'pinch'], [{ width: 360, height: 640 }, 'buttons']]) {
    const { ctx, page } = await run({ viewport: vp, hasTouch: how === 'pinch', earth: true });
    await cardOn(page); await openZoom(page);
    const c = await centre(page), bad = [];
    const zoom = async dir => {
      if (how === 'ctrl+wheel') return ctrlWheel(page, c, dir * 100);
      if (how === 'buttons') { await page.click(dir > 0 ? '#zoom-out' : '#zoom-in'); return page.waitForTimeout(20); }
      await page.evaluate(({ x, y, dir }) => { const el = ME.globe().renderer().domElement, ev = (t, id, px) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: px, clientY: y, bubbles: true }));
        ev('pointerdown', 11, x - 60); ev('pointerdown', 12, x + 60); const d = dir > 0 ? 0.7 : 1.4; ev('pointermove', 11, x - 60 * d); ev('pointermove', 12, x + 60 * d); ev('pointerup', 11, x - 60 * d); ev('pointerup', 12, x + 60 * d); }, { ...c, dir });
      await page.waitForTimeout(20);
    };
    for (const s0 of [0, 0.5, 1, 1.5, 2]) for (const dir of [-1, 1]) {
      await page.evaluate(s0 => { ME.zoomGo(Math.round(s0)); if (s0 !== Math.round(s0)) { const d = s0 - Math.round(s0); for (let i = 0; i < 25; i++) ME.zoomStep(Math.sign(d), Math.abs(d) / 0.08 / 25); } }, s0);
      const sHeld = (await Z(page)).s;
      if (how === 'pinch') await page.evaluate(() => { const g = ME.globe(), c = g.controls(); const cam = g.camera(), t = c.target, v = cam.position.clone().sub(t);   // a one-finger turn of the view, as OrbitControls would apply it
          v.applyAxisAngle(cam.up, 0.6); cam.position.copy(t).add(v); c.update(); });
      else await drag(page, c);
      const z0 = await Z(page); if (!z0.free) { bad.push({ s0, dir, err: 'drag did not make the view free' }); continue; }
      await zoom(dir);
      const z1 = await Z(page), g1 = await evidence(page);
      if (z1.free || !(dir > 0 ? z1.s >= sHeld - 1e-9 : z1.s <= sHeld + 1e-9) || Math.abs(z1.s - sHeld) > 0.25 || !drawnOk(g1, [0, 1, 2].includes(z1.s))) bad.push({ s0, dir, step: 1, sHeld, s: z1.s, free: z1.free, b: g1.bodies.map(b => [b.k, b.frustum, b.pixels]), tags: g1.tags });
      for (let i = 0; i < (how === 'pinch' ? 80 : 30); i++) await zoom(dir);
      const z2 = await Z(page), g2 = await evidence(page);
      if (z2.free || z2.s !== (dir > 0 ? 2 : 0) || !drawnOk(g2)) bad.push({ s0, dir, step: 31, s: z2.s, free: z2.free, b: g2.bodies.map(b => [b.k, b.frustum, b.pixels]), tags: g2.tags });
    }
    ok(`zoom after a drag (${how}, ${vp.width}x${vp.height}): from each stop and between stops, the FIRST zoom in either direction returns to the path at the held position ± one step (also outward at an end), 30 more clamp at Earth / + Sun; Earth drawn throughout, tagged bodies drawn (independent frustum incl. far plane + canvas pixels)`, bad.length === 0, bad.slice(0, 4));
    await ctx.close();
  }

  // the reproduced failures, on purpose: the old free zoom (break free-zoom-old) must fail the check above; and a body outside
  // the far plane must lose its tag even when its centre projects on screen
  {
    const { ctx, page } = await run({});
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(2));
    const r = await page.evaluate(() => { const cam = ME.globe().camera(), far0 = cam.far, s = ME.zoomState().geo.sun, cp = cam.position, d = Math.hypot(s[0] - cp.x, s[1] - cp.y, s[2] - cp.z);
      cam.far = d * 0.5; cam.updateProjectionMatrix(); ME.zoomFrame(); const L = ME.zoomState().last, it = L.items.find(i => i.k === 'sun');
      const out = { inFrame: it.inFrame, tagged: L.tags.some(t => t.k === 'sun'), ring: !!document.querySelector('#zoom-svg .zr-sun') };
      cam.far = far0; cam.updateProjectionMatrix(); ME.zoomFrame(); return out; });
    ok('tags only on drawable bodies: a Sun beyond the far plane, its centre still on screen, gets no tag and no ring', r.inFrame && !r.tagged && !r.ring, r);
    await ctx.close();
  }

  // plain wheel: not the view's. The path does not move, the event is not prevented, and the page scrolls where it can
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { ctx, page } = await run({ viewport: vp });
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(1));
    await page.evaluate(() => { window.__wheelPrevented = []; addEventListener('wheel', e => window.__wheelPrevented.push(e.defaultPrevented), { passive: true }); });
    const c = await centre(page), s0 = (await Z(page)).s, y0 = await page.evaluate(() => scrollY);
    const canScroll = await page.evaluate(() => { const e = document.scrollingElement, o = [document.documentElement, document.body].map(x => getComputedStyle(x).overflowY);
      return e.scrollHeight > e.clientHeight + 1 && !o.includes('hidden'); });   // the Earth page's body is overflow:hidden at these sizes, so the page cannot scroll
    await page.mouse.move(c.x, c.y); for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); }
    const z = await Z(page), y1 = await page.evaluate(() => scrollY), prev = await page.evaluate(() => window.__wheelPrevented);
    ok(`plain wheel ${vp.width}x${vp.height}: the view's progress is unchanged and the wheel is not prevented${canScroll ? '; the page scrolled' : ' (this page does not scroll at this size)'}`,
      z.s === s0 && !z.free && prev.length > 0 && prev.every(p => !p) && (!canScroll || y1 > y0), { s0, s: z.s, free: z.free, prev, y0, y1, canScroll });
    await ctx.close();
  }

  // a pinch whose first finger lifts first: the finger left on the screen is not a drag (no free orbit, camera on the path)
  {
    const { ctx, page } = await run({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(1));
    const c = await centre(page);
    const r = await page.evaluate(({ x, y }) => { const el = ME.globe().renderer().domElement, ev = (t, id, px, py) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', isPrimary: id === 21, clientX: px, clientY: py, bubbles: true }));
      ev('pointerdown', 21, x - 60, y); ev('pointerdown', 22, x + 60, y); ev('pointermove', 21, x - 45, y); ev('pointermove', 22, x + 45, y);
      ev('pointerup', 21, x - 45, y);                                          // first finger up, second still down
      const g = ME.globe(), cam = g.camera(), t = g.controls().target, v = cam.position.clone().sub(t); v.applyAxisAngle(cam.up, 0.5); cam.position.copy(t).add(v); g.controls().update();   // the remaining finger turns the view
      const mid = ME.zoomState(); ev('pointercancel', 22, x + 80, y);         // then the gesture is cancelled
      const end = ME.zoomState(); return { midFree: mid.free, endFree: end.free, s: end.s }; }, c);
    ok('pinch, one finger lifted, the other moves then is cancelled: never free orbit, the view stays on the path', !r.midFree && !r.endFree, r);
    // a fresh one-finger drag afterwards is a drag again
    await page.evaluate(({ x, y }) => { const el = ME.globe().renderer().domElement; el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 31, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
      const g = ME.globe(), cam = g.camera(), t = g.controls().target, v = cam.position.clone().sub(t); v.applyAxisAngle(cam.up, 0.5); cam.position.copy(t).add(v); g.controls().update();
      el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 31, pointerType: 'touch', clientX: x, clientY: y, bubbles: true })); }, c);
    ok('after the gesture ends, a new one-finger turn is free orbit again', (await Z(page)).free);
    await ctx.close();
  }

  // resize and rotation while open: the stops are re-framed for the new box, progress kept, entry view kept; also from free orbit
  {
    const { ctx, page } = await run({ viewport: { width: 390, height: 844 }, hasTouch: true, earth: true });
    await cardOn(page); await openZoom(page);
    const k0 = await page.evaluate(() => JSON.stringify(ME.zoomState().path.k[0]));
    const bad = [];
    for (const [n, vp, free] of [[1, { width: 844, height: 390 }, false], [2, { width: 390, height: 844 }, false], [2, { width: 1280, height: 900 }, true], [1, { width: 360, height: 640 }, false]]) {
      await page.evaluate(n => ME.zoomGo(n), n);
      if (free) await page.evaluate(() => { const g = ME.globe(), c = g.controls(), cam = g.camera(), t = c.target, v = cam.position.clone().sub(t); v.applyAxisAngle(cam.up, 0.6); cam.position.copy(t).add(v); c.update(); });
      await page.setViewportSize(vp); await page.waitForTimeout(700);
      const z = await Z(page), L = z.last, g = await evidence(page), want = n === 1 ? ['moon'] : ['moon', 'sun'];
      const clear = L.tags.every(t => !t.forced) && L.items.filter(i => want.includes(i.k) || i.k === 'earth').every(i => i.inFrame);
      if (!z.open || z.s !== n || z.free || z.path.W !== L.W || z.path.H !== L.H || JSON.stringify(z.path.k[0]) !== k0 || !clear || !drawnOk(g) || !want.every(k => g.tags.includes(k)))
        bad.push({ n, vp, free, open: z.open, s: z.s, isFree: z.free, path: z.path && [z.path.W, z.path.H], last: [L.W, L.H], k0same: z.path && JSON.stringify(z.path.k[0]) === k0, clear, tags: g.tags });
    }
    ok('resize / rotation while open (390x844 → 844x390 → 390x844 → 1280x900 from free orbit → 360x640): framing rebuilt for the new box, same stop, back on the path, entry view (stop A) unchanged, bodies tagged, drawn and clear', bad.length === 0, bad);
    await page.click('#zoom-a'); await page.click('#zoom-back'); await page.waitForTimeout(300);
    ok('after resizes, Back to Earth still restores the near plane', await page.evaluate(() => ME.globe().camera().near) === 0.05);
    await ctx.close();
  }

  {   // opened on a desktop-width window, then narrowed into the phone layout: the readings sheet is collapsed as on entry, the
      // view stays open at the same stop; widened again; closing restores the sheet as it was on entry
    const { ctx, page } = await run({ viewport: { width: 1280, height: 900 }, earth: true });
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(2));
    const sheetBefore = await page.evaluate(() => document.getElementById('sheet').className);
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(900);
    const z1 = await Z(page), g1 = z1.open ? await evidence(page) : null, sheetPhone = await page.evaluate(() => document.getElementById('sheet').className);
    await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(900);
    const z2 = await Z(page);
    await page.click('#zoom-back'); await page.waitForTimeout(400);
    const sheetAfter = await page.evaluate(() => document.getElementById('sheet').className);
    ok('desktop → phone width while open: view stays open at + Sun, the readings sheet collapsed as on entry, bodies tagged and drawn; back to desktop still open; exit leaves the sheet as before entry',
      z1.open && z1.s === 2 && g1 && drawnOk(g1) && ['moon', 'sun'].every(k => g1.tags.includes(k)) && /collapsed/.test(sheetPhone) && z2.open && z2.s === 2 && sheetAfter === sheetBefore, { sheetPhone, z1: [z1.open, z1.s, z1.msg], tags: g1 && g1.tags, z2: [z2.open, z2.s], sheetBefore, sheetAfter });
    await ctx.close();
  }

  // ---------- tag placement rule itself: two markers side by side (30 px apart) must get non-overlapping tags (checks 14, 15)
  {
    const { ctx, page } = await run({});
    await page.waitForFunction(() => ME.zoomPlaceTags);
    const r = await page.evaluate(() => { const items = [{ k: 'moon', x: 200, y: 200, rpx: 2, inFrame: true }, { k: 'sun', x: 230, y: 200, rpx: 2, inFrame: true }, { k: 'earth', x: 200, y: 260, rpx: 3, inFrame: true }];
      const { tags, rings } = ME.zoomPlaceTags(items, 800, 600); return { tags, rings }; });
    const ov = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const clash = r.tags.some((t, i) => r.tags.some((u, k) => k !== i && ov(t, u))) || r.tags.some(t => r.rings.some(g => g.k !== t.k && ov(t, g)));
    ok('tag rule: markers 30 px apart get tags that overlap neither each other nor another ring', !clash && r.tags.every(t => !t.forced), r);
    await ctx.close();
  }

  // ---------- intermediate frames (GPT smoke test, 10 Nov): Earth stays in frame at EVERY position of the pull-back,
  // A → B → C and back, in steps of 0.02, on phone and desktop canvases and on four dates (incl. near-opposite / near-conjunction)
  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 1280, height: 900 }]) for (const date of ['2026-11-10', '2027-02-21', '2026-09-11', '2027-12-28']) {
    const { ctx, page } = await run({ time: date + 'T06:00:00Z', viewport: vp });
    await cardOn(page); await openZoom(page);
    const res = await page.evaluate(() => { const out = { n: 0, lost: [], covered: [], sMax: 0 };
      const ov = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const look = () => { ME.zoomFrame(); const z = ME.zoomState(), L = z.last, e = L.items.find(i => i.k === 'earth'), r = Math.max(6, e.rpx + 4), box = { x: e.x - r, y: e.y - r, w: 2 * r, h: 2 * r };
        out.n++; out.sMax = Math.max(out.sMax, z.s); const xn = window.__expectNear(); if (Math.abs(xn.actual - xn.expected) > 1e-6 * Math.max(1, xn.expected)) out.nearBad = (out.nearBad || 0) + 1;
        const inBox = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
        if (!(e.x >= 0 && e.x <= L.W && e.y >= 0 && e.y <= L.H)) out.lost.push(+z.s.toFixed(2));
        else if (inBox(e, L.strip) || inBox(e, L.bar)) out.covered.push(+z.s.toFixed(2)); };   // Earth's centre must not be hidden
      look(); for (let i = 0; i < 100; i++) { ME.zoomStep(1, 0.25); look(); } for (let i = 0; i < 100; i++) { ME.zoomStep(-1, 0.25); look(); }
      return out; });
    ok(`intermediate frames ${vp.width}x${vp.height} ${date}: Earth in frame at every one of ${res.n} positions A→C→A (steps of 0.02), its centre never under the strip or stop bar; near plane = independent forward-depth rule at each`, res.lost.length === 0 && res.covered.length === 0 && res.sMax >= 2 - 1e-9 && res.n === 201 && !res.nearBad, { lost: res.lost.slice(0, 8), covered: res.covered.slice(0, 8), sMax: res.sMax, nearBad: res.nearBad });
    await ctx.close();
  }

  // ---------- check 21: the occlusion detector itself — camera put behind Earth on the Earth→Sun line must report the Sun hidden
  {
    const { ctx, page } = await run({});
    await cardOn(page); await openZoom(page); await page.evaluate(() => ME.zoomGo(2));
    const occ = await page.evaluate(() => { const g = ME.globe(), cam = g.camera(), s = ME.zoomState().geo.sun, n = Math.hypot(...s), u = s.map(v => -v / n);
      cam.position.set(u[0] * 3000, u[1] * 3000, u[2] * 3000); cam.lookAt(0, 0, 0); ME.zoomFrame(); const it = ME.zoomState().last.items.find(i => i.k === 'sun'); return it && it.occludedBy; });
    ok('check 21: a drawn Sun directly behind Earth is reported as hidden by Earth', occ === 'earth', occ);
    await ctx.close();
  }

  clearTimeout(wd); await browser.close();
  console.log(`sky-zoom-ui: ${pass} passed, ${fail} failed${B ? ` (BREAK=${B})` : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ', e && e.stack || e); process.exit(1); });
