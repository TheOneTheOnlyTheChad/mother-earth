/* "Lit as now" on the Moon globe (MOON-LIT-AS-NOW-PROPOSAL rev 2.1, §3 and §10) — real moon.html, craft.js, moonlight.js, moonglobe.js and
 * globe.gl 2.45.0 under SwiftShader. The device clock is shifted, not frozen (timers stay real). Expected values are computed HERE from the
 * committed table at on-grid instants (no interpolation code shared with the page).
 *  A. off by default; opening view unchanged
 *  B. on: readout, direction given to the shader, at a crescent, a quarter, a gibbous and a seam instant
 *  C. the day/night mask, independent of the map: ±0.5°, ±1°, ±2° and the line itself, eight places around the line (pole and seam included)
 *  D. the rendered globe: the same surface points, lit capture against an evenly lit capture at the same camera pose
 *  E. Earth view: camera distance after settle and after resize, disc size kept, centred on the sub-Earth point (also as the clock ticks),
 *     share of disc pixels on the day side of the mask's 50% contour within 2 points of the calculated phase; ordinary camera recorded;
 *     exit by drag (first input works), by buttons, by switching off, by fallback
 *  F. two clocks: both-on line, each time beside its own control, neither moves the other; minute boundary; tab return; focus kept
 *  G. clock jumps and fallbacks: valid jump followed, out of range → evenly lit → back; missing / altered table; no arithmetic file;
 *     no shader patch; no clock; no WebGL
 * Run: (python3 -m http.server 8899 --bind 127.0.0.1 &) ; node --no-warnings phase1/moon-lit.test.cjs [A-G letters to run]
 * BREAK=sun5|sunflip|nearcam|nocentre|noexit|keepfov|keeplit|nosha|nocover|notick|onbydefault|bothalways|edgewide|nopatchcheck|tworeads must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev', BREAK = process.env.BREAK || '', ONLY = (process.argv[2] || 'ABCDEFG');
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const R1B = fs.readFileSync(path.join(ROOT, 'phase1/skycraft/catalogue/craft-moon-2026-06-R1.json'));
const CATB = fs.readFileSync(path.join(ROOT, 'assets/moon/moon-light-2026-06-R1.json')), CAT = JSON.parse(CATB);
const BREAKS = {   // [file, from, to]
  sun5: ['moonglobe.js', "const d = meshDir(lit.cur.sunLL.lat, lit.cur.sunLL.lng);", "const d = meshDir(lit.cur.sunLL.lat, lit.cur.sunLL.lng + 5);"],
  sunflip: ['moonglobe.js', "const d = meshDir(lit.cur.sunLL.lat, lit.cur.sunLL.lng);", "const d = meshDir(lit.cur.sunLL.lat, -lit.cur.sunLL.lng);"],
  nearcam: ['moonglobe.js', "const EARTH_RADII = 100;", "const EARTH_RADII = 3.2;"],
  nocentre: ['moonglobe.js', "if (lit.state === 'on' && lit.earth) { globe.pointOfView(", "if (false) { globe.pointOfView("],
  noexit: ['moonglobe.js', "globe.controls().addEventListener('start', () => { if (lit.earth) leaveEarth(); });", ""],
  keepfov: ['moonglobe.js', "lit.earth = false; cam.fov = lit.cam0.fov;", "lit.earth = false;"],
  keeplit: ['moonglobe.js', "lit.uni.mgOn.value = on ? 1 : 0; }", "if (on) lit.uni.mgOn.value = 1; }"],
  nosha: ['moonglobe.js', "      if (h !== ML.T.sha) return 'the sunlight table failed its integrity check';\n", ""],
  nocover: ['moonglobe.js', "    if (!ML.covered(ms)) {", "    if (false) {"],
  notick: ['moonglobe.js', "if (lit.on && !lit.timer) lit.timer = setInterval(", "if (false) lit.timer = setInterval("],
  onbydefault: ['moonglobe.js', "const lit = { on: false,", "const lit = { on: true,"],
  bothalways: ['moonglobe.js', "const h = !(lit.state === 'on' && ov.on && ov.drawn);", "const h = !(lit.state === 'on');"],
  tworeads: ['moonglobe.js', "lit.minute = ML ? ML.minute(now) : NaN;", "lit.minute = ML ? ML.minute(Date.now()) : NaN;"],
  nopatchcheck: ['moonglobe.js', "if (pr && pr.length) { lit.why = 'this device could not apply the shading.'; return; }", ""],
  edgewide: ['moonlight.js', "var EDGE_DEG = 1,", "var EDGE_DEG = 3,"],
};
const SRC = { 'moonglobe.js': fs.readFileSync(path.join(ROOT, 'moonglobe.js'), 'utf8'), 'moonlight.js': fs.readFileSync(path.join(ROOT, 'moonlight.js'), 'utf8') };
if (BREAK) { const b = BREAKS[BREAK]; if (!b || !SRC[b[0]].includes(b[1])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } SRC[b[0]] = SRC[b[0]].replace(b[1], b[2]); }
let pass = 0, fail = 0; const notes = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
// ---- expectations from the table (own arithmetic)
const D = Math.PI / 180, T0 = Date.UTC(2026, 5, 1), STEP = 6 * 3600e3, N = 2317, FLOOR = 0.12, ALT = 2.2;
const vec = (lat, lng) => [Math.cos(lat * D) * Math.cos(lng * D), Math.cos(lat * D) * Math.sin(lng * D), Math.sin(lat * D)];
const ll = u => ({ lat: Math.atan2(u[2], Math.hypot(u[0], u[1])) / D, lng: Math.atan2(u[1], u[0]) / D });
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = v => { const n = Math.hypot(...v); return v.map(c => c / n); }, ang = (a, b) => Math.atan2(Math.hypot(...cross(a, b)), dot(a, b)) / D;
const grid = i => { const s = { lng: CAT.sun_lon_lat_deg[2 * i], lat: CAT.sun_lon_lat_deg[2 * i + 1] }, e = { lng: CAT.earth_lon_lat_deg[2 * i], lat: CAT.earth_lon_lat_deg[2 * i + 1] };
  return { i, ms: T0 + i * STEP, sun: s, earth: e, lit: (1 + dot(vec(s.lat, s.lng), vec(e.lat, e.lng))) / 2 }; };
const from = Math.round((Date.UTC(2026, 10, 15) - T0) / STEP);
const find = f => { for (let i = from; i < N; i++) { const g = grid(i); if (f(g)) return g; } throw new Error('no instant'); };
const CRES = find(g => g.lit > 0.2 && g.lit < 0.3), QUART = find(g => g.lit > 0.47 && g.lit < 0.53), GIBB = find(g => g.lit > 0.72 && g.lit < 0.8), SEAM = find(g => Math.abs(g.sun.lng - 90) < 1.5);
const WHEN = [['crescent', CRES], ['quarter', QUART], ['gibbous', GIBB], ['seam', SEAM]];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], p2 = n => String(n).padStart(2, '0');
const stamp = ms => { const d = new Date(ms); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
const d1 = (v, a, b) => Math.abs(v).toFixed(1) + '°' + (v >= 0 ? a : b), place = q => d1(q.lat, 'N', 'S') + ' ' + d1(q.lng, 'E', 'W');
/** A surface point whose Sun elevation is e degrees, at azimuth az around the day–night line (az 90 is the northern end). */
const probe = (g, az, e) => { const s = vec(g.sun.lat, g.sun.lng), a = unit(cross([0, 0, 1], s)), b = cross(s, a), q0 = a.map((c, k) => Math.cos(az * D) * c + Math.sin(az * D) * b[k]);
  return ll(q0.map((c, k) => Math.cos(e * D) * c + Math.sin(e * D) * s[k])); };
// three.js SphereGeometry with a longitude-latitude image: column u = (lng + 180) / 360 → x = −cos(2πu)·cos(lat), y = sin(lat), z = sin(2πu)·cos(lat)
const meshXyz = q => [-Math.cos((q.lng + 180) * D) * Math.cos(q.lat * D), Math.sin(q.lat * D), Math.sin((q.lng + 180) * D) * Math.cos(q.lat * D)];
const AZ = [0, 45, 90, 135, 180, 225, 270, 315], OFFS = [-2, -1, -0.5, 0, 0.5, 1, 2], WANT = { '-2': 0, '-1': 0, '-0.5': 0.25, '0': 0.5, '0.5': 0.75, '1': 1, '2': 1 };
const CLOCK = t => { const RD = Date; let off = t - RD.now(), nan = false, queue = []; class DD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return queue.length ? queue.shift() : nan ? NaN : RD.now() + off; } }
  window.Date = DD; window.__setClock = ms => { nan = false; off = ms - RD.now(); }; window.__noClock = () => { nan = true; };   /* Date.now() only: that is what the lighting reads; the header's own clock is left alone */ window.__nextReads = a => { queue = a.slice(); }; };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (t, o = {}) => {
    const ctx = await b.newContext({ viewport: o.vp || { width: 1100, height: 1400 }, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
    await ctx.addInitScript(CLOCK, t);
    await ctx.route(/fonts\.googleapis/, r => r.abort());
    await ctx.route(HUB + '/**', r => new URL(r.request().url()).pathname === '/catalogue/skycraft/craft-moon-2026-06-R1' ? r.fulfill({ status: 200, contentType: 'application/json', body: R1B }) : r.fulfill({ status: 404, body: '' }));
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: o.lib || GLOBE_JS }));
    await ctx.route('**/moonglobe.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: o.mg || SRC['moonglobe.js'] }));
    await ctx.route('**/moonlight.js*', r => o.noML ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: SRC['moonlight.js'] }));
    if (o.table) await ctx.route('**/assets/moon/moon-light-2026-06-R1.json*', o.table);
    if (o.noGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html' + (o.q || ''), { waitUntil: 'domcontentloaded' });
    if (!o.noGL) await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(600);
    return { ctx, p, errs };
  };
  const L = p => p.evaluate(() => MoonGlobe.light());
  const settle = (p, st) => p.waitForFunction(s => { const l = MoonGlobe.light(); return s ? l.state === s : (l.state !== 'loading'); }, st || null, { timeout: 15000 }).catch(() => {});
  const litOn = async p => { await p.click('#mg-lit'); await settle(p); await p.waitForTimeout(250); };
  const jump = async (p, ms) => { await p.evaluate(t => { window.__setClock(t); document.dispatchEvent(new Event('visibilitychange')); }, ms); await p.waitForTimeout(250); };
  const shot = async p => { await p.waitForTimeout(220); return PNG.sync.read(await p.locator('#mg-globe').screenshot()); };
  const lum = (img, x, y) => { let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy; if (X < 0 || Y < 0 || X >= img.width || Y >= img.height) continue; const k = (Y * img.width + X) * 4; s += (img.data[k] + img.data[k + 1] + img.data[k + 2]) / 3; n++; } return n ? s / n : NaN; };
  /** Disc pixels (from the evenly lit capture) and the share of them on the day side of the mask's 50% contour (lit / even ≥ (1 + floor) / 2). */
  const phaseOf = (even, lit) => { let disc = 0, day = 0; for (let k = 0; k < even.data.length; k += 4) { const px = (k / 4) % even.width, py = Math.floor(k / 4 / even.width); if (px < 4 || py < 4 || px > even.width - 5 || py > even.height - 5) continue;   // the box's own border is not the Moon
      const e = (even.data[k] + even.data[k + 1] + even.data[k + 2]) / 3; if (e < 24) continue; disc++; if ((lit.data[k] + lit.data[k + 1] + lit.data[k + 2]) / 3 / e >= (1 + FLOOR) / 2) day++; } return { disc, share: day / disc }; };
  const pair = async p => { await p.evaluate(() => MoonGlobe.shade(false)); const even = await shot(p); await p.evaluate(() => MoonGlobe.shade(true)); const lit = await shot(p); return { even, lit }; };

  if (ONLY.includes('A')) { const { ctx, p, errs } = await mk(CRES.ms + 20000);
    const s = await p.evaluate(() => ({ l: MoonGlobe.light(), lights: MoonGlobe.lights(), v: MoonGlobe.view(), pressed: document.getElementById('mg-lit').getAttribute('aria-pressed'), txt: document.getElementById('mg-lit').textContent,
      earthHidden: document.getElementById('mg-earth').hidden, readHidden: document.getElementById('mg-lit-read').hidden, bothHidden: document.getElementById('mg-both').hidden, fetched: performance.getEntriesByType('resource').some(e => /moon-light/.test(e.name)) }));
    ok('A1 off by default: not pressed, labelled "Lit as now"', s.pressed === 'false' && s.txt === 'Lit as now' && s.l.on === false && s.l.state === 'off', s);
    ok('A2 off: the shader is told nothing is lit by direction (evenly lit)', s.l.uniform && s.l.uniform.on === 0, s.l.uniform);
    ok('A3 off: ambient light only, opening view on the near side at the ordinary distance', JSON.stringify(s.lights) === '["AmbientLight"]' && Math.abs(s.v.lat) < 1e-6 && Math.abs(s.v.lng) < 1e-6 && Math.abs(s.v.altitude - ALT) < 1e-6, s);
    ok('A4 off: Earth-view button, readout and both-on line hidden', s.earthHidden && s.readHidden && s.bothHidden, s);
    ok('A5 off: the sunlight table is not fetched until asked for', s.fetched === false);
    const even = await shot(p); await litOn(p); const lit = await shot(p); const ph = phaseOf(even, lit);
    ok('A6 on: part of the disc goes to the night floor, part stays as it was', ph.share > 0.02 && ph.share < 0.98, ph);
    await p.click('#mg-lit'); await p.waitForTimeout(200); const again = await shot(p); let diff = 0; for (let k = 0; k < even.data.length; k += 4) if (Math.abs(even.data[k] - again.data[k]) > 3) diff++;
    ok('A7 off again: the picture is the evenly lit one', diff < even.width * even.height * 0.001 && (await L(p)).uniform.on === 0, diff);
    ok('A8 no page errors', errs.length === 0, errs); await ctx.close(); }

  if (/[BCD]/.test(ONLY)) for (const [name, g] of WHEN) { const { ctx, p, errs } = await mk(g.ms + 20000); await litOn(p); const l = await L(p);
    if (ONLY.includes('B')) {
      ok(`B1 ${name}: on, for the device clock's minute`, l.state === 'on' && l.cur && l.cur.ms === g.ms, l);
      ok(`B2 ${name}: sub-solar and sub-Earth points are the table's`, l.cur && ang(vec(l.cur.sun.lat, l.cur.sun.lng), vec(g.sun.lat, g.sun.lng)) < 1e-6 && ang(vec(l.cur.earth.lat, l.cur.earth.lng), vec(g.earth.lat, g.earth.lng)) < 1e-6 && Math.abs(l.cur.lit - g.lit) < 1e-9, l.cur);
      ok(`B3 ${name}: the direction given to the shader is the sub-solar point`, l.uniform.on === 1 && ang(l.uniform.xyz, meshXyz(g.sun)) < 1e-6 && l.patch === true, l.uniform);
      const t = await p.evaluate(() => ({ r: document.getElementById('mg-lit-read').innerText, pressed: document.getElementById('mg-lit').getAttribute('aria-pressed'), earthHidden: document.getElementById('mg-earth').hidden, ds: document.getElementById('mg-globe').dataset.lit, live: document.getElementById('mg-lit-read').getAttribute('aria-live') }));
      ok(`B4 ${name}: readout time and label`, t.r.includes(`Sunlight calculated for ${stamp(g.ms)} UTC · device clock`) && /COMPUTED|Computed/.test(t.r), t.r);
      ok(`B5 ${name}: readout places and lit share`, t.r.includes(`Sun overhead at ${place(g.sun)} · Earth overhead at ${place(g.earth)}`) && t.r.includes(`${(100 * g.lit).toFixed(1)}% of the Earth-facing disc is lit`), t.r);
      ok(`B6 ${name}: the limits are said`, t.r.includes('Calculated, not observed') && t.r.includes('no crater shadows, no earthshine, no eclipses') && t.r.includes('Night side shown faintly as a display aid; this is not earthshine') && t.r.includes('JPL DE440 via NAIF'), t.r);
      ok(`B6a ${name}: close view says whose percentage it is`, t.r.includes('The percentage is for the view from Earth’s centre. The close view can show a different lit share.') && !t.r.includes('Earth view:'), t.r);
      ok(`B7 ${name}: pressed; Earth-view button offered; readout does not interrupt a screen reader each minute`, t.pressed === 'true' && !t.earthHidden && t.ds === 'on' && t.live === 'off', t); }
    const pts = []; for (const az of AZ) for (const e of OFFS) pts.push({ az, e, ...probe(g, az, e) });
    if (ONLY.includes('C')) {
      const got = await p.evaluate(P => { const s = MoonGlobe.light().cur.sun, u = MoonLight.vec(s.lat, s.lng); return P.map(q => MoonLight.maskAt(q.lat, q.lng, u)); }, pts);
      const bad = pts.map((q, k) => ({ ...q, got: got[k] })).filter(q => Math.abs(q.got - WANT[String(q.e)]) > 0.002);
      ok(`C1 ${name}: mask at ±0.5°, ±1°, ±2° and on the line, eight places (${pts.length} probes)`, bad.length === 0, bad.slice(0, 4));
      const half = await p.evaluate(P => { const s = MoonGlobe.light().cur.sun, u = MoonLight.vec(s.lat, s.lng); return P.map(q => [MoonLight.maskAt(q.a.lat, q.a.lng, u), MoonLight.maskAt(q.b.lat, q.b.lng, u)]); }, AZ.map(az => ({ a: probe(g, az, -0.1), b: probe(g, az, 0.1) })));
      ok(`C2 ${name}: the half value lies within 0.1° of the calculated line`, half.every(([a, c]) => a < 0.5 && c > 0.5 && a >= 0.44 && c <= 0.56), half);
      ok(`C3 ${name}: probes reach within 2° of a pole`, pts.some(q => Math.abs(q.lat) > 88), Math.max(...pts.map(q => Math.abs(q.lat))));
      if (name === 'seam') ok('C4 seam: probes lie on both sides of the ±180° meridian', pts.some(q => q.lng > 177) && pts.some(q => q.lng < -177), [g.sun.lng]); }
    if (ONLY.includes('D')) {
      for (let k = 0; k < 6; k++) await p.click('#mg-zin'); await p.waitForTimeout(150); let worst = [], seen = 0;
      for (const az of AZ) { const c = probe(g, az, 0); await p.evaluate(q => MoonGlobe.point(q.lat, q.lng), c); const { even, lit } = await pair(p);
        const xy = await p.evaluate(P => P.map(q => MoonGlobe.screen(q.lat, q.lng)), pts.filter(q => q.az === az));
        pts.filter(q => q.az === az).forEach((q, k) => { const e = lum(even, xy[k].x, xy[k].y), r = lum(lit, xy[k].x, xy[k].y) / e, want = FLOOR + (1 - FLOOR) * WANT[String(q.e)], tol = Math.abs(q.e) >= 1 ? 0.06 : 0.13; if (!(e > 24)) return; seen++;
          if (!(Math.abs(r - want) <= tol)) worst.push({ az, e: q.e, ratio: +r.toFixed(3), want: +want.toFixed(3) }); }); }
      ok(`D1 ${name}: rendered surface points against the evenly lit capture at the same pose (${seen} points)`, worst.length === 0 && seen >= 50, worst.slice(0, 5)); }
    ok(`${name}: no page errors`, errs.length === 0, errs); await ctx.close(); }

  if (ONLY.includes('E')) { for (const [name, g] of WHEN.slice(0, 3)) { const { ctx, p, errs } = await mk(g.ms + 20000); await litOn(p);
      const o = await pair(p), ord = phaseOf(o.even, o.lit);   // ordinary close camera, looking at the sub-Earth point
      await p.evaluate(q => MoonGlobe.point(q.lat, q.lng), g.earth); const o2 = await pair(p), ord2 = phaseOf(o2.even, o2.lit);
      await p.click('#mg-earth'); await p.waitForTimeout(500); const s = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view(), pressed: document.getElementById('mg-earth').getAttribute('aria-pressed'), note: !document.getElementById('mg-lit-ev').hidden, txt: document.getElementById('mg-lit-ev').textContent, closeHidden: document.getElementById('mg-lit-close').hidden }));
      ok(`E1 ${name}: Earth view on, note shown`, s.l.earthView && s.pressed === 'true' && s.note && s.txt.includes('Earth view: centred on Earth using the same calculated UTC minute.') && s.txt.includes('From the Earth’s centre, Moon’s north up — not how it is tilted in your sky') && s.closeHidden, s);
      ok(`E2 ${name}: camera at 100 Moon radii after the controls settle`, Math.abs(s.l.cam.dist - 10000) < 1, s.l.cam);
      ok(`E3 ${name}: centred on the sub-Earth point`, ang(vec(s.v.lat, s.v.lng), vec(g.earth.lat, g.earth.lng)) < 1e-4, s.v);
      const e = await pair(p), ph = phaseOf(e.even, e.lit);
      ok(`E4 ${name}: the disc keeps its size (within 1.5% in area)`, Math.abs(ph.disc / ord2.disc - 1) < 0.015, [ph.disc, ord2.disc]);
      ok(`E5 ${name}: day share of disc pixels within 2 points of the calculated ${(100 * g.lit).toFixed(1)}%`, Math.abs(ph.share - g.lit) <= 0.02, ph);
      notes.push(`${name}: calculated ${(100 * g.lit).toFixed(2)}% · Earth view ${(100 * ph.share).toFixed(2)}% · ordinary camera at the sub-Earth point ${(100 * ord2.share).toFixed(2)}% · ordinary camera, opening view ${(100 * ord.share).toFixed(2)}%`);
      if (name !== 'quarter') ok(`E6 ${name}: the ordinary camera misses that gate (why the distant view exists)`, Math.abs(ord2.share - g.lit) > 0.02, ord2);
      if (name === 'crescent') {
        await p.setViewportSize({ width: 1000, height: 1300 }); await p.waitForTimeout(500); const r = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view() })); const e2 = await pair(p), ph2 = phaseOf(e2.even, e2.lit);
        ok('E7 after a resize: still 100 radii, still centred, phase still within 2 points', Math.abs(r.l.cam.dist - 10000) < 1 && r.l.earthView && ang(vec(r.v.lat, r.v.lng), vec(g.earth.lat, g.earth.lng)) < 1e-4 && Math.abs(ph2.share - g.lit) <= 0.02, [r.l.cam, ph2]);
        await p.setViewportSize({ width: 700, height: 1300 }); await p.waitForTimeout(500); const e3 = await pair(p), ph3 = phaseOf(e3.even, e3.lit); const r3 = await L(p);
        await p.click('#mg-earth'); await p.waitForTimeout(300); await p.evaluate(q => MoonGlobe.point(q.lat, q.lng), g.earth); const o3 = await pair(p), ord3 = phaseOf(o3.even, o3.lit);
        ok('E8 phone width: 100 radii, disc the size of the phone’s ordinary view, phase within 2 points', Math.abs(r3.cam.dist - 10000) < 1 && Math.abs(ph3.disc / ord3.disc - 1) < 0.015 && Math.abs(ph3.share - g.lit) <= 0.02, [r3.cam, ph3, ord3]);
        await p.setViewportSize({ width: 1100, height: 1400 }); await p.waitForTimeout(400); await p.click('#mg-earth'); await p.waitForTimeout(300);
        // the clock ticks while the Earth view is on: stays centred on the NEW sub-Earth point
        const nx = grid(g.i + 1); await p.evaluate(t => window.__setClock(t), nx.ms - 900); await p.waitForTimeout(2200); const t = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view() }));
        ok('E9 a minute boundary passes by itself while in the Earth view: recalculated', t.l.cur && t.l.cur.ms === nx.ms && t.l.earthView, t.l.cur);
        ok('E10 … and the view is centred on the new sub-Earth point', ang(vec(t.v.lat, t.v.lng), vec(nx.earth.lat, nx.earth.lng)) < 1e-4 && ang(vec(nx.earth.lat, nx.earth.lng), vec(g.earth.lat, g.earth.lng)) > 0.05 && Math.abs(t.l.cam.dist - 10000) < 1, [t.v, nx.earth]);
        // exit by a drag: the first input turns the globe at the ordinary distance
        const box = await p.locator('#mg-globe').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2; const before = await p.evaluate(() => MoonGlobe.view());
        await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 70, cy, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300); const d = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view(), pressed: document.getElementById('mg-earth').getAttribute('aria-pressed'), note: !document.getElementById('mg-lit-ev').hidden }));
        ok('E11 a drag leaves the Earth view: ordinary field of view, distance and limits', !d.l.earthView && Math.abs(d.l.cam.fov - 50) < 1e-9 && Math.abs(d.l.cam.dist - 320) < 0.5 && Math.abs(d.l.cam.maxDistance - 320) < 1e-6 && d.pressed === 'false' && !d.note, d.l.cam);
        ok('E12 … and that same first drag turned the globe', Math.abs(d.v.lng - before.lng) > 5 && Math.abs(d.v.altitude - ALT) < 0.01, [before, d.v]);
        ok('E13 lighting stays on after leaving the Earth view, and the close-view sentence is back', d.l.state === 'on' && d.l.uniform.on === 1 && (await p.evaluate(() => !document.getElementById('mg-lit-close').hidden)));
        await p.waitForTimeout(2500);   // let the drag's own momentum die away before reading button results
        for (const [btn, chk, what] of [['#mg-near', v => Math.abs(v.lat) < 0.02 && Math.abs(v.lng) < 0.02 && Math.abs(v.altitude - ALT) < 1e-6, 'Near side'], ['#mg-zin', v => Math.abs(v.altitude - ALT * 0.75) < 1e-6, 'Zoom in'], ['#mg-east', v => Math.abs(v.altitude - ALT) < 1e-6, 'East']]) {
          await p.evaluate(() => MoonGlobe.point(0, 0)); await p.click('#mg-zout'); await p.click('#mg-zout'); await p.click('#mg-earth'); await p.waitForTimeout(250); const inE = (await L(p)).earthView; await p.click(btn); await p.waitForTimeout(250); const x = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view() }));
          ok(`E14 ${what} leaves the Earth view and acts at once`, inE && !x.l.earthView && Math.abs(x.l.cam.fov - 50) < 1e-9 && chk(x.v), [x.v, x.l.cam]); }
        await p.click('#mg-zout'); await p.click('#mg-earth'); await p.waitForTimeout(250); await p.click('#mg-lit'); await p.waitForTimeout(250); const off = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view(), hidden: document.getElementById('mg-earth').hidden }));
        ok('E15 switching the lighting off leaves the Earth view and restores the camera', !off.l.earthView && off.l.state === 'off' && Math.abs(off.l.cam.fov - 50) < 1e-9 && Math.abs(off.l.cam.dist - 320) < 0.5 && off.hidden, off.l.cam);
        await p.click('#mg-lit'); await settle(p, 'on'); await p.click('#mg-earth'); await p.waitForTimeout(250); await jump(p, Date.UTC(2029, 0, 1)); const fb = await L(p);
        ok('E16 a fallback while in the Earth view restores the camera too', fb.state === 'unavailable' && !fb.earthView && Math.abs(fb.cam.fov - 50) < 1e-9 && Math.abs(fb.cam.dist - 320) < 0.5, fb);
        const b2 = await p.evaluate(() => MoonGlobe.view()); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 60, cy, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(250); const a2 = await p.evaluate(() => MoonGlobe.view());
        ok('E17 … and the globe still turns', Math.abs(a2.lng - b2.lng) > 5, [b2, a2]); }
      ok(`E ${name}: no page errors`, errs.length === 0, errs); await ctx.close(); }
    { const { ctx, p } = await mk(GIBB.ms + 20000, { motion: true }); await litOn(p); await p.click('#mg-earth'); await p.waitForTimeout(600); const s = await p.evaluate(() => ({ l: MoonGlobe.light(), v: MoonGlobe.view() }));
      ok('E18 with motion allowed: Earth view at 100 radii, centred', s.l.earthView && Math.abs(s.l.cam.dist - 10000) < 1 && ang(vec(s.v.lat, s.v.lng), vec(GIBB.earth.lat, GIBB.earth.lng)) < 1e-4, s); await ctx.close(); } }

  if (ONLY.includes('F')) { const g = QUART; const { ctx, p, errs } = await mk(g.ms + 20000);
    const state = () => p.evaluate(() => ({ both: !document.getElementById('mg-both').hidden, bothTxt: document.getElementById('mg-both').textContent, lro: (document.getElementById('mg-lro-t') || {}).textContent, lit: (document.getElementById('mg-lit-t') || {}).textContent,
      lroIn: !!document.querySelector('#mg-lro-read #mg-lro-t'), litIn: !!document.querySelector('#mg-lit-read #mg-lit-t'), order: [...document.querySelectorAll('#mg-ctl, #mg-lit-read, #mg-both, #mg-lro-read')].map(e => e.id), l: MoonGlobe.light(), o: MoonGlobe.lro() }));
    await litOn(p); let s = await state(); ok('F1 lighting alone: no both-on line', !s.both && s.l.state === 'on', s);
    await p.click('#mg-lro'); await p.waitForFunction(() => MoonGlobe.lro().drawn, null, { timeout: 15000 }).catch(() => {}); s = await state();
    ok('F2 both displayed: the line is shown, in these words', s.both && s.bothTxt === 'Lighting uses the current UTC minute. The LRO path is a dated example from 10–11 June 2026.', s);
    ok('F3 each time sits in its own readout', s.lroIn && s.litIn && s.lro === '10 Jun 12:00 UTC' && s.lit === stamp(g.ms) && JSON.stringify(s.order) === '["mg-ctl","mg-lit-read","mg-both","mg-lro-read"]', s);
    await p.focus('#craft-next'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); let s2 = await state();
    ok('F4 changing the LRO minute does not change the lighting time', s2.lro === '10 Jun 12:01 UTC' && s2.lit === s.lit && s2.l.cur.ms === g.ms, s2);
    await p.focus('#mg-lro-time'); await p.evaluate(t => window.__setClock(t), g.ms + 59200); await p.waitForTimeout(2200); const s3 = await state(); const foc = await p.evaluate(() => document.activeElement && document.activeElement.id);
    ok('F5 the minute boundary recalculates by itself', s3.lit === stamp(g.ms + 60000) && s3.l.cur.ms === g.ms + 60000, s3.lit);
    ok('F6 a lighting tick does not change the LRO time', s3.lro === '10 Jun 12:01 UTC' && s3.o.drawn && s3.o.drawn.i === 721, s3.lro);
    ok('F7 focus is kept through the tick', foc === 'mg-lro-time', foc);
    await p.focus('#mg-lit'); await jump(p, g.ms + 5 * 3600e3 + 7000); const s4 = await state(); const foc2 = await p.evaluate(() => document.activeElement && document.activeElement.id);
    ok('F8 coming back to the tab recalculates at once', s4.l.cur && s4.l.cur.ms === g.ms + 5 * 3600e3 && s4.lit === stamp(g.ms + 5 * 3600e3) && foc2 === 'mg-lit', s4.lit);
    // GPT round 1: a minute boundary falling INSIDE one recalculation. The next two clock reads are forced to straddle it: 59.999 s, then the new minute.
    const A = g.ms + 9 * 3600e3, B = A + 60000; await p.evaluate(([a, b]) => { window.__setClock(b + 5); window.__nextReads([a + 59999, b + 1]); document.dispatchEvent(new Event('visibilitychange')); }, [A, B]);
    const s5 = await L(p); ok('F8a boundary inside one recalculation: the minute recorded is the minute drawn (one clock read)', s5.cur && s5.cur.ms === A && s5.minute === A, [s5.cur && s5.cur.ms, s5.minute, A]);
    await p.waitForTimeout(1600); const s6 = await state(); ok('F8b … and the new minute is on screen within two heartbeats, not a minute later', s6.l.cur.ms === B && s6.lit === stamp(B) && s6.l.minute === B, [s6.lit, stamp(B)]);
    await p.click('#mg-lro'); await p.waitForTimeout(200); ok('F9 LRO off: line gone, lighting stays', !(await state()).both && (await L(p)).state === 'on');
    await p.click('#mg-lro'); await p.waitForTimeout(300); await p.click('#mg-lit'); await p.waitForTimeout(200); s = await state(); ok('F10 lighting off: line gone, LRO stays', !s.both && s.o.drawn && s.l.state === 'off', s);
    await p.click('#mg-lit'); await settle(p, 'on'); await jump(p, Date.UTC(2029, 0, 1)); s = await state(); ok('F11 lighting unavailable: no both-on line (no lighting is displayed)', !s.both && s.l.state === 'unavailable' && s.o.drawn, s);
    ok('F: no page errors', errs.length === 0, errs); await ctx.close(); }

  if (ONLY.includes('G')) {
    { const g = CRES; const { ctx, p, errs } = await mk(g.ms + 20000); await litOn(p); const even0 = (await pair(p)).even;
      const later = grid(g.i + 400); await jump(p, later.ms + 30000); let l = await L(p);
      ok('G1 a jump to another valid time is followed', l.state === 'on' && l.cur.ms === later.ms && ang(l.uniform.xyz, meshXyz(later.sun)) < 1e-6, l.cur);
      await jump(p, g.ms + 30000); l = await L(p); ok('G2 a jump backwards to a valid time is followed', l.state === 'on' && l.cur.ms === g.ms, l.cur);
      for (const [what, t] of [['after the table', Date.UTC(2028, 0, 1, 0, 1)], ['before the table', Date.UTC(2026, 4, 31, 23, 59)]]) {
        await jump(p, t); l = await L(p); const u = await p.evaluate(() => ({ btn: document.getElementById('mg-lit').textContent, pressed: document.getElementById('mg-lit').getAttribute('aria-pressed'), r: document.getElementById('mg-lit-read').innerText, earthHidden: document.getElementById('mg-earth').hidden }));
        ok(`G3 ${what}: unavailable, shader told to light evenly`, l.state === 'unavailable' && l.uniform.on === 0 && l.cur === null, l);
        ok(`G4 ${what}: button and reason`, u.btn === 'Lit as now unavailable' && u.r.includes('Lit as now unavailable') && u.r.includes('our sunlight table covers 1 Jun 2026 to 1 Jan 2028 UTC') && u.r.includes(stamp(Math.floor(t / 60000) * 60000)) && u.r.includes('evenly lit') && u.earthHidden, u);
        const pic = await shot(p); let diff = 0; for (let k = 0; k < pic.data.length; k += 4) if (Math.abs(pic.data[k] - even0.data[k]) > 3) diff++;
        ok(`G5 ${what}: the picture is the evenly lit one`, diff < pic.width * pic.height * 0.001, diff);
        await jump(p, g.ms + 30000); l = await L(p); ok(`G6 ${what}: a corrected clock brings the lighting back by itself`, l.state === 'on' && l.cur.ms === g.ms && l.uniform.on === 1 && (await p.evaluate(() => document.getElementById('mg-lit').textContent)) === 'Lit as now', l); }
      ok('G7 the last covered minute is lit', (await jump(p, Date.UTC(2028, 0, 1, 0, 0, 30)), (await L(p)).state) === 'on');
      await p.evaluate(() => { window.__noClock(); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(250); l = await L(p);
      ok('G8 no valid clock: evenly lit, reason given', l.state === 'unavailable' && l.uniform.on === 0 && /clock gives no valid time/.test(l.why), l);
      await jump(p, g.ms + 30000); ok('G9 … and recovers when the clock is valid again', (await L(p)).state === 'on');
      ok('G: no page errors', errs.length === 0, errs); await ctx.close(); }
    const bad = Buffer.from(CATB); bad[bad.length - 40] ^= 1;
    for (const [what, table, why] of [['missing table', r => r.fulfill({ status: 404, body: '' }), 'could not be loaded'], ['altered table', r => r.fulfill({ status: 200, contentType: 'application/json', body: bad }), 'failed its integrity check'], ['table request fails', r => r.abort(), 'could not be loaded']]) {
      const { ctx, p, errs } = await mk(CRES.ms + 20000, { table }); const even = await shot(p); await litOn(p); const l = await L(p); const pic = await shot(p); let diff = 0; for (let k = 0; k < pic.data.length; k += 4) if (Math.abs(pic.data[k] - even.data[k]) > 3) diff++;
      ok(`G10 ${what}: unavailable with the reason, evenly lit`, l.state === 'unavailable' && l.why.includes(why) && l.uniform.on === 0 && diff < pic.width * pic.height * 0.001, [l.why, diff]);
      await p.click('#mg-lro'); await p.waitForFunction(() => MoonGlobe.lro().drawn, null, { timeout: 15000 }).catch(() => {}); await p.click('#mg-far'); const o = await p.evaluate(() => ({ d: !!MoonGlobe.lro().drawn, v: MoonGlobe.view(), craft: ME.craftState().status }));
      ok(`G11 ${what}: the globe, the LRO path and the drawing still work`, o.d && Math.abs(Math.abs(o.v.lng) - 180) < 1e-6 && o.craft === 'ready', o);
      ok(`G12 ${what}: no page errors`, errs.length === 0, errs); await ctx.close(); }
    { const { ctx, p, errs } = await mk(CRES.ms + 20000, { noML: true }); await p.click('#mg-lit'); await p.waitForTimeout(600); const l = await L(p);
      ok('G13 arithmetic file missing: unavailable, globe unaffected', l.state === 'unavailable' && /did not load/.test(l.why) && (await p.evaluate(() => document.getElementById('mg-globe').dataset.ready)) === '1', l); ok('G14 … no page errors', errs.length === 0, errs); await ctx.close(); }
    { const { ctx, p, errs } = await mk(CRES.ms + 20000, { mg: SRC['moonglobe.js'].replace("const v0 = '#include <begin_vertex>'", "const v0 = '#include <not_in_this_library>'") }); const even = await shot(p); await litOn(p); await p.waitForTimeout(1300); const l = await L(p); const pic = await shot(p); let diff = 0; for (let k = 0; k < pic.data.length; k += 4) if (Math.abs(pic.data[k] - even.data[k]) > 3) diff++;
      ok('G15 the shading cannot be put into this library’s material: unavailable with the reason, evenly lit, never an unlit "on"', l.state === 'unavailable' && /could not apply the shading/.test(l.why) && l.uniform.on === 0 && diff < pic.width * pic.height * 0.001, l); ok('G15b … no page errors', errs.length === 0, errs); await ctx.close(); }
    { const { ctx, p, errs } = await mk(CRES.ms + 20000, { noGL: true }); await p.click('#mg-lit').catch(() => {}); await p.waitForTimeout(500); const s = await p.evaluate(() => ({ st: document.getElementById('mg-state').textContent, ctlHidden: document.getElementById('mg-ctl').hidden, craft: ME.craftState().status }));
      ok('G16 no WebGL: globe unavailable as before, controls hidden, drawing ready', s.st === 'Moon globe unavailable' && s.ctlHidden && s.craft === 'ready', s); ok('G17 … no page errors', errs.length === 0, errs); await ctx.close(); } }

  await b.close(); for (const n of notes) console.log('      ' + n);
  console.log(`moon-lit${BREAK ? ' [BREAK=' + BREAK + ']' : ''}${ONLY !== 'ABCDEFG' ? ' [' + ONLY + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
