/* Mother Earth — Sky zoom-out view, page side (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §11 checks 5–17, 19, 21, 22).
 * Real index.html + app.js + sky.js + skyscene.js served locally (8899); real globe.gl 2.45.0 (SwiftShader); hub routed to the
 * committed R1 and scene files (and to faulty variants); Playwright's clock fixes the date. Expected directions for check 6 come
 * from astronomy-engine in this test (not from the scene file).
 * Run:   node phase1/sky-zoom-ui.test.cjs     (needs `python3 -m http.server 8899 --bind 127.0.0.1` in the repo and /home/claude/spike)
 * Break: BREAK=<name> loads a weakened skyscene.js; the suite must FAIL on every one (names in BREAKS below).
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
  'fixed-direction': ["      if (!best || z < best.d) best = { u, d: z, tgt };", "      if (!best) best = { u: [0.6, 0.0, 0.8], d: z, tgt };"],
  'tags-same-side': ["        if (tags.some(t => overlaps(t, box)) || rings.some(r => r.k !== it.k && overlaps(r, box))) continue; pick = box; break; }", "        pick = box; break; }"],
  'sun-400-full-labels': ["  const SUN_SCENE_R = 200;", "  const SUN_SCENE_R = 400;"],
  'strip-over-scene': ["    const pt = $('zoom-bar').offsetHeight + 8, pb = $('zoom-strip').offsetHeight + 8;", "    const pt = $('zoom-bar').offsetHeight + 8, pb = 0;"],
  'near-default': ["    if (Math.abs(near - cam.near) > 1e-9) { cam.near = near; cam.updateProjectionMatrix(); }", "    /* (break) near plane never changed */"],
  'near-by-distance': ["let m = Infinity; for (const b of list) { const z = V.dot(V.sub(b.pos, cp), fv) - b.r; if (z > 0) m = Math.min(m, z); }",
    "let m = Infinity; for (const b of list) { const z = V.len(V.sub(b.pos, cp)) - b.r; if (z > 0) m = Math.min(m, z); }"],
  'split-update': ["    st.meshes.moon.visible = true; st.meshes.geo = bodiesFor(rows); positionMeshes();", "    st.meshes.moon.visible = true;"],
  'no-occlusion-check': ["        if (t > 0 && t < it.dist && V.len(V.sub(w, V.mul(dir, t))) < b.r) it.occludedBy = o.k; } }", "      } }"],
  'endpoint-only': ["    st.placing = true; setS(st.s + dir * STEP, 'keep'); st.placing = false; announce();", "    st.placing = true; setS(Math.max(0, Math.min(2, Math.round(st.s) + dir)), 'keep'); st.placing = false; announce();"],
  'pinch-off': ["      if (H.pts.size === 2 && H.pinch0) {", "      if (false) {"],
};
// sun-400-full-labels also widens the tag model (rev 2.1 §4.3)
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!JS.includes(a)) throw new Error('break anchor missing: ' + B); JS = JS.replace(a, b);
  if (B === 'sun-400-full-labels') JS = JS.replace('const TAG = { w: 56, h: 18 }', 'const TAG = { w: 150, h: 34 }'); }

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
  const run = async ({ time = '2026-11-10T10:00:00Z', viewport = { width: 1280, height: 900 }, scene = SC, pin = null, r1 = R1, hasTouch = false }) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch });
    const hits = [];
    let js = JS; if (pin) js = js.replace(`const SHA = '${sha(SC)}';`, `const SHA = '${pin}';`);
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/skyscene.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: js }));
    await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname; hits.push(p);
      if (p === '/catalogue/sky/sky-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: r1 });
      if (p === '/catalogue/sky/sky-scene-2026-11-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: scene });
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
    await page.clock.install({ time: new Date(time) });
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState && ME.skyState, null, { timeout: 30000 });
    return { ctx, page, perr, hits };
  };
  const cardOn = async page => { await page.click('#tgl-sky'); await page.waitForFunction(() => ME.skyState().status === 'ok', null, { timeout: 20000 }); };
  const openZoom = async page => { await page.click('#tgl-zoom');
    await page.waitForFunction(() => { const z = ME.zoomState(); return z.open && z.path || /unavailable|No computed/.test(z.msg); }, null, { timeout: 20000 });
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
    ok(`${label}: no two tags overlap; no tag over another body's ring`, tags.every((t, i) => tags.every((u, k) => k === i || !ov(t, u)) && items.every((it, k) => k === i || !ov(t, ringBox(it)))));
    ok(`${label}: no body hides another (check 21)`, items.every(i => !i.occludedBy), items.map(i => [i.k, i.occludedBy]));
    ok(`${label}: strip and stop bar cover no marker or tag`, items.every(i => !ov(ringBox(i), L.strip) && !ov(ringBox(i), L.bar)) && tags.every(t => !ov(t, L.strip) && !ov(t, L.bar)), { strip: L.strip, bar: L.bar });
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
      const same = ['target', 'near', 'minD', 'maxD', 'zoom', 'auto', 'damp', 'vis', 'sheet', 'kids'].filter(k => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
      ok(`check 9 cycle ${i + 1}: camera, target, zoom limits, near plane, auto-rotate, damping, every object's visibility, sheet restored; focus returned`,
        same.length === 0 && Math.hypot(...after.pos.map((v, k) => v - before.pos[k])) < 1e-6 * Math.hypot(...before.pos) + 1e-6 && f === focusId, { diff: same, f });
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
  for (const kind of ['wheel', 'pinch']) {
    const { ctx, page } = await run({ viewport: kind === 'pinch' ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: kind === 'pinch' });
    await cardOn(page); await openZoom(page);
    const box = await page.evaluate(() => { const r = ME.globe().renderer().domElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const doStep = async dir => {
      if (kind === 'wheel') { await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, dir * 100); }
      else await page.evaluate(({ x, y, dir }) => { const el = ME.globe().renderer().domElement, ev = (t, id, px) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: px, clientY: y, bubbles: true }));
        ev('pointerdown', 1, x - 60); ev('pointerdown', 2, x + 60); const d = dir > 0 ? 0.7 : 1.4; ev('pointermove', 1, x - 60 * d); ev('pointermove', 2, x + 60 * d); ev('pointerup', 1, x - 60 * d); ev('pointerup', 2, x + 60 * d); }, { ...box, dir });
      await page.waitForTimeout(30);
    };
    const seen = new Set(); let bad = [], steps = 0, sMax = 0;
    for (const dir of [...Array(40).fill(1), ...Array(40).fill(-1)]) {
      await doStep(dir); steps++;
      const z = await Z(page), L = z.last; sMax = Math.max(sMax, z.s); seen.add(Math.round(z.s * 4) / 4);
      const drawn = L.items.filter(i => i.inFrame);
      const nearOk = L.near >= 0.05 && L.near <= Math.max(0.05, 0.2 * L.minForwardDepth) + 1e-6;
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
    const z = await Z(page), L = z.last;
    ok('check 16 free orbit: dragging makes the view free, near plane still by forward depth, nothing clipped', z.free && L.near <= Math.max(0.05, 0.2 * L.minForwardDepth) + 1e-6 && L.near >= 0.05, { free: z.free, near: L.near, m: L.minForwardDepth });
    ok('Re-frame button shown while free', await page.evaluate(() => !document.getElementById('zoom-reframe').hidden));
    await page.click('#zoom-reframe');
    ok('Re-frame returns to the path at stop C', !(await Z(page)).free && (await Z(page)).stop === 'C');
    await page.click('#zoom-back'); await page.waitForTimeout(300);
    ok('check 16: near plane restored to globe.gl\'s 0.05 on exit', await page.evaluate(() => ME.globe().camera().near) === 0.05);
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
