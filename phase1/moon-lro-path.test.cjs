/* LRO's dated path on the Moon globe (MOON-LRO-DATED-PATH-PROPOSAL rev 2) — real moon.html, craft.js, moonglobe.js and globe.gl 2.45.0
 * under SwiftShader; the hub's dated example = the committed R1 file; the overlay = the committed Moon-fixed catalogue.
 * Expected values are computed HERE from the catalogue numbers, not read back from the page.
 *  A. off by default; toggle; readout words; the diagram's minute and window
 *  B. rendered geometry: vertex radii = catalogue radii, every drawn segment clears the sphere, marker at its altitude
 *  C. time: steps, both endpoints, the link to the controls, invalid / off-grid / out-of-range / current times, back to the example
 *  D. occlusion (marker hidden behind the Moon, words say so) and a limb view (path drawn above the surface)
 *  E. failure: missing file, altered file, no globe library, no WebGL — the globe and the drawing stay usable on their own inputs
 *  F. the conversion: cardinal axes, the seam, high latitude
 *  G. the REAL map on the rendered globe: a fiducial put by the path's own conversion lands on each named feature within 1°
 * Run: (python3 -m http.server 8899 --bind 127.0.0.1 &) ; node --no-warnings phase1/moon-lro-path.test.cjs
 * BREAK=lngsign|lng180|latflip|alt0|nowindow|stale|nosha|keepold must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const BASE = process.argv[2] || 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev', BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const R1B = fs.readFileSync(path.join(ROOT, 'phase1/skycraft/catalogue/craft-moon-2026-06-R1.json')), R1 = JSON.parse(R1B);
const MEB = fs.readFileSync(path.join(ROOT, 'assets/moon/craft-moon-me-2026-06-R1.json')), ME = JSON.parse(MEB);
const BREAKS = {
  lngsign: ["lng: Math.atan2(y, x) * 180 / Math.PI,", "lng: -Math.atan2(y, x) * 180 / Math.PI,"],
  lng180: ["lng: Math.atan2(y, x) * 180 / Math.PI,", "lng: Math.atan2(y, x) * 180 / Math.PI + 180,"],
  latflip: ["lat: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI,", "lat: -Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI,"],
  alt0: ["pts.push([q.lat, q.lng, q.alt]);", "pts.push([q.lat, q.lng, 0.002]);"],
  nowindow: ["for (let i = s.lo; i <= s.hi; i++)", "for (let i = 0; i < LRO.n; i++)"],
  stale: ["document.addEventListener('me:craft-select', ev => { ov.sel = ev.detail; if (ov.on) drawOverlay(); });", "document.addEventListener('me:craft-select', ev => { if (!ov.sel) ov.sel = ev.detail; if (ov.on) drawOverlay(); });"],
  nosha: ["      if (h !== LRO.sha) return 'the file failed its integrity check';\n", ''],
  keepold: ["      clearOverlay();\n      lread.innerHTML = 'No dated position", "      lread.innerHTML = 'No dated position"],
};
let MG = fs.readFileSync(path.join(ROOT, 'moonglobe.js'), 'utf8');
if (BREAK) { const b = BREAKS[BREAK]; if (!b || !MG.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } MG = MG.replace(b[0], b[1]); }
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
// expectations from the catalogues
const xyz = (j, i) => j.xyz_km.slice(3 * i, 3 * i + 3);
const meLL = i => { const [x, y, z] = xyz(ME, i), r = Math.hypot(x, y, z); return { lat: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, lng: Math.atan2(y, x) * 180 / Math.PI, alt: r / 1737.4 - 1, km: r - 1737.4 }; };
const r1km = i => Math.hypot(...xyz(R1, i)) - 1737.4;
// landmark centres: USGS/IAU Gazetteer of Planetary Nomenclature (as pinned in moon-globe.test.cjs), +East, ±180
const MARKS = [['Tycho', -43.30, -11.22], ['Mare Crisium', 16.18, 59.10], ['Mare Imbrium', 34.72, -14.91], ['Mare Orientale', -19.87, -94.67], ['Mare Moscoviense', 27.28, 148.12], ['Tsiolkovskiy', -20.38, 128.97]];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (q = '', o = {}) => {
    const ctx = await b.newContext({ viewport: o.vp || { width: 1100, height: 1400 }, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.googleapis/, r => r.abort());
    await ctx.route(HUB + '/**', r => { const u = new URL(r.request().url());
      if (u.pathname === '/catalogue/skycraft/craft-moon-2026-06-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: R1B });
      return r.fulfill({ status: 404, body: '' }); });
    await ctx.route('**/unpkg.com/globe.gl**', r => o.noLib ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonglobe.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: MG }));
    if (o.me) await ctx.route('**/assets/moon/craft-moon-me-2026-06-R1.json*', o.me);
    if (o.noGL) await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html' + q, { waitUntil: 'domcontentloaded' });
    if (!o.noLib && !o.noGL) await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 }).catch(() => {});
    return { ctx, p, errs };
  };
  const lro = p => p.evaluate(() => MoonGlobe.lro());
  const text = async p => (await p.textContent('#mg-lro-read')) || '';
  const geom = p => p.evaluate(() => {   // what three.js actually holds for the path and the marker
    const g = MoonGlobe.globe(), out = { lines: [], marks: [] };
    g.scene().traverse(o => {
      if ((o.type === 'Line' || o.type === 'Line2') && o.geometry && o.geometry.attributes.position) { const a = o.geometry.attributes.position.array, v = []; for (let k = 0; k < a.length; k += 3) v.push([a[k], a[k + 1], a[k + 2]]); out.lines.push(v); }
    });
    for (const d of g.labelsData()) { const c = g.getCoords(d.lat, d.lng, d.alt); out.marks.push(Math.hypot(c.x, c.y, c.z)); }
    return out; });
  const px = async (p, x, y) => { const s = await p.screenshot({ clip: { x: x - 1, y: y - 1, width: 3, height: 3 } });
    return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = 3; c.height = 3; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(1, 1, 1, 1).data; return [d[0], d[1], d[2]]; }, s.toString('base64')); };
  const yellow = c => c[0] > 180 && c[1] > 140 && c[0] - c[2] > 60;   // #ffd27a, allowing for edge blending
  const screenOf = (p, lat, lng, alt) => p.evaluate(([la, ln, al]) => { const g = MoonGlobe.globe(), s = g.getScreenCoords(la, ln, al), r = document.getElementById('mg-globe').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, [lat, lng, alt]);

  // ---- A. default, toggle, words, minute and window
  { const { ctx, p, errs } = await mk();
    ok('globe starts', await p.locator('#mg-globe[data-ready="1"]').count() === 1);
    ok('off by default: button not pressed, nothing drawn, no readout', (await p.getAttribute('#mg-lro', 'aria-pressed')) === 'false' && !(await lro(p)).drawn && await p.locator('#mg-lro-read').isHidden(), await lro(p));
    ok('nothing on the globe by default', (await geom(p)).lines.length === 0 && (await geom(p)).marks.length === 0);
    await p.click('#mg-lro'); await p.waitForTimeout(800);
    const L = await lro(p);
    ok('toggle on: pressed, loaded, drawn', (await p.getAttribute('#mg-lro', 'aria-pressed')) === 'true' && L.loaded && !!L.drawn, L);
    ok('opens at the example default 10 June 12:00 (sample 720) with the diagram’s window 600–840', L.drawn && L.drawn.i === 720 && L.drawn.lo === 600 && L.drawn.hi === 840 && L.drawn.pts === 241, L.drawn);
    const cs = await p.evaluate(() => ME.craftState());
    ok('the globe follows the diagram’s own sample and window', L.drawn && cs.i === L.drawn.i && cs.geo.lo === L.drawn.lo && cs.geo.hi === L.drawn.hi, { cs: cs.i, geo: cs.geo });
    const m = meLL(720), t = await text(p);
    ok('readout: label, source, UTC minute', t.includes('Dated LRO example · 10–11 June 2026 UTC') && t.includes('Calculated from NASA/GSFC’s definitive trajectory · 10 Jun 12:00 UTC'), t);
    ok('readout: altitude above the reference sphere, from the Moon-fixed file', (await p.textContent('#mg-lro-alt')) === `${m.km.toFixed(1)} km above the reference sphere`, await p.textContent('#mg-lro-alt'));
    ok('the Moon-fixed altitude equals the drawing’s own (J2000) altitude for the same minute', Math.abs(m.km - r1km(720)) < 0.002, [m.km, r1km(720)]);
    ok('readout: actual UTC bounds of the path', t.includes('Path shown: 10 Jun 10:00 to 10 Jun 14:00 UTC'), t);
    ok('readout: flight path, not a ground track; marker enlarged', /flight path above a spherical Moon \(radius 1,737\.4 km\), not a track on the ground; the marker is enlarged/.test(t), t);
    ok('marker at the selected sample’s Moon-fixed place', L.drawn && Math.abs(L.drawn.marker.lat - m.lat) < 1e-9 && Math.abs(L.drawn.marker.lng - m.lng) < 1e-9, L.drawn && L.drawn.marker);
    // B. rendered geometry
    const G = await geom(p);
    ok('one flight path and one marker', G.lines.length === 1 && G.marks.length === 1, { lines: G.lines.length, marks: G.marks.length });
    const V = G.lines[0] || [];
    ok('the path has exactly the window’s native samples (no interpolation)', V.length === 241, V.length);
    let worst = 0; V.forEach((v, k) => { const want = 100 * (1 + meLL(600 + k).alt); worst = Math.max(worst, Math.abs(Math.hypot(...v) - want)); });
    ok('every rendered vertex sits at its catalogue radius (globe units, 100 = 1,737.4 km)', V.length && worst < 1e-3, worst);
    let clear = Infinity; for (let k = 0; k + 1 < V.length; k++) { const a = V[k], d = V[k + 1].map((c, j) => c - a[j]), tt = Math.max(0, Math.min(1, -(a[0] * d[0] + a[1] * d[1] + a[2] * d[2]) / (d[0] ** 2 + d[1] ** 2 + d[2] ** 2))); clear = Math.min(clear, Math.hypot(...a.map((c, j) => c + tt * d[j]))); }
    ok('every rendered segment clears the sphere (radius 100)', clear > 100 + 3.5, clear);
    ok('marker drawn at its altitude', Math.abs(G.marks[0] - 100 * (1 + m.alt)) < 1e-6, G.marks[0]);
    // the window moves with the diagram, the view does not
    const v0 = await p.evaluate(() => MoonGlobe.view());
    await p.click('#craft-next'); await p.waitForTimeout(300);
    let L2 = await lro(p);
    ok('Next in the drawing moves the globe marker to 12:01 and the window with it', L2.drawn && L2.drawn.i === 721 && L2.drawn.lo === 601 && L2.drawn.hi === 841 && (await p.textContent('#mg-lro-t')) === '10 Jun 12:01 UTC', L2.drawn);
    ok('the view direction is kept as the time changes', JSON.stringify(await p.evaluate(() => MoonGlobe.view())) === JSON.stringify(v0));
    await p.click('#craft-prev'); await p.click('#craft-prev'); await p.waitForTimeout(300); L2 = await lro(p);
    ok('Previous twice: 11:59', L2.drawn && L2.drawn.i === 719 && (await p.textContent('#mg-lro-t')) === '10 Jun 11:59 UTC', L2.drawn);
    await p.click('#mg-lro-time'); await p.waitForTimeout(200);
    ok('“change the time” takes focus to the drawing’s time control', await p.evaluate(() => document.activeElement && document.activeElement.id) === 'craft-range');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); L2 = await lro(p);
    ok('keyboard on the time control moves the globe marker', L2.drawn && L2.drawn.i === 720, L2.drawn);
    // toggle off, resize, keyboard toggle
    await p.click('#mg-lro'); await p.waitForTimeout(200);
    ok('toggle off: nothing drawn, readout hidden, not pressed', (await geom(p)).lines.length === 0 && (await geom(p)).marks.length === 0 && await p.locator('#mg-lro-read').isHidden() && (await p.getAttribute('#mg-lro', 'aria-pressed')) === 'false');
    await p.focus('#mg-lro'); await p.keyboard.press('Space'); await p.waitForTimeout(300);
    ok('keyboard (Space) turns it on', (await p.getAttribute('#mg-lro', 'aria-pressed')) === 'true' && !!(await lro(p)).drawn);
    await p.setViewportSize({ width: 390, height: 1200 }); await p.waitForTimeout(800);
    ok('resize to a phone width keeps the overlay and its geometry', !!(await lro(p)).drawn && (await geom(p)).lines[0].length === 241);
    ok('no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // ---- C. endpoints and unsupported times
  for (const [q, i, lo, hi, label] of [['?t=2026-06-10T00:00:00Z', 0, 0, 120, '10 Jun 00:00'], ['?t=2026-06-11T00:00:00Z', 1440, 1320, 1440, '11 Jun 00:00']]) {
    const { ctx, p } = await mk(q); await p.click('#mg-lro'); await p.waitForTimeout(600); const L = await lro(p);
    ok(`endpoint ${q}: sample ${i}, window clipped to ${lo}–${hi}`, L.drawn && L.drawn.i === i && L.drawn.lo === lo && L.drawn.hi === hi && (await p.textContent('#mg-lro-t')) === label + ' UTC', L.drawn);
    await ctx.close(); }
  for (const q of ['?t=2026-06-10T12:00:30Z', '?t=2026-07-01T00:00:00Z', '?t=2026-06-09T23:59:00Z', '?t=garbage', '?t=' + new Date(Date.UTC(2026, 10, 14, 12)).toISOString().slice(0, 19) + 'Z']) {
    const { ctx, p } = await mk(q); await p.click('#mg-lro'); await p.waitForTimeout(600);
    ok(`unsupported time ${q}: nothing on the globe, says so`, !(await lro(p)).drawn && (await geom(p)).lines.length === 0 && (await geom(p)).marks.length === 0 && /No dated position on the globe for this time/.test(await text(p)), await text(p));
    if (q === '?t=2026-07-01T00:00:00Z') {
      ok('the requested time is kept in the link', new URL(p.url()).searchParams.get('t') === '2026-07-01T00:00:00Z');
      await p.click('#craft-example'); await p.waitForTimeout(500); const L = await lro(p);
      ok('“View a dated example” brings the path back at 12:00', L.drawn && L.drawn.i === 720 && new URL(p.url()).searchParams.get('t') === '2026-06-10T12:00:00Z', L.drawn);
      // and an unsupported time chosen AFTER drawing clears it at once
      await p.evaluate(() => { history.replaceState(null, '', '?t=2026-07-01T00:00:00Z'); document.dispatchEvent(new CustomEvent('me:craft-select', { detail: null })); });
      ok('a selection that ends clears the overlay immediately', !(await lro(p)).drawn && (await geom(p)).marks.length === 0);
    }
    await ctx.close(); }

  // ---- D. occlusion and limb
  { const { ctx, p } = await mk(); await p.click('#mg-lro'); await p.waitForTimeout(600);
    const m = meLL(720);
    await p.evaluate(([la, ln]) => MoonGlobe.point(la, ln), [m.lat, m.lng]); await p.waitForTimeout(800);
    let L = await lro(p); let s = await screenOf(p, m.lat, m.lng, m.alt);
    ok('facing the marker: drawn and not behind', L.drawn && !L.drawn.behind && !/behind the Moon/.test(await text(p)), L.drawn);
    ok('facing the marker: the marker’s pixel is the marker colour', yellow(await px(p, s.x, s.y)), await px(p, s.x, s.y));
    await p.evaluate(([la, ln]) => MoonGlobe.point(-la, ln + 180), [m.lat, m.lng]); await p.waitForTimeout(800);
    L = await lro(p);
    ok('from the opposite side: behind, and the words say so; UTC and altitude still given', L.drawn && L.drawn.behind && /At this time LRO is behind the Moon from this view/.test(await text(p)) && /10 Jun 12:00 UTC/.test(await text(p)) && /km above the reference sphere/.test(await text(p)), await text(p));
    s = await screenOf(p, m.lat, m.lng, m.alt);
    ok('from the opposite side: the marker is hidden by the sphere (no marker colour where it projects)', !yellow(await px(p, s.x, s.y)), await px(p, s.x, s.y));
    // limb: view centre 90° from the marker, along its meridian
    await p.evaluate(([la, ln]) => MoonGlobe.point(0, ln + 90), [m.lat, m.lng]); await p.waitForTimeout(800);
    s = await screenOf(p, m.lat, m.lng, m.alt); const s0 = await screenOf(p, m.lat, m.lng, 0);
    const discR = await p.evaluate(() => { const g = MoonGlobe.globe(), v = g.pointOfView(), a = g.getScreenCoords(v.lat, v.lng + 90, 0), c = g.getScreenCoords(v.lat, v.lng, 0); return Math.hypot(a.x - c.x, a.y - c.y); });
    const dm = Math.hypot(s.x - s.cx, s.y - s.cy);
    ok('limb view: the marker projects outside the disc (above the surface)', dm > discR + 2 && dm > Math.hypot(s0.x - s.cx, s0.y - s.cy) + 2, { dm, discR });
    ok('limb view: the marker is drawn there', yellow(await px(p, s.x, s.y)), await px(p, s.x, s.y));
    await p.screenshot({ path: '/tmp/lro-limb.png', clip: await p.locator('#mg-globe').boundingBox() });
    await ctx.close(); }

  // ---- E. failure paths
  { const { ctx, p } = await mk('', { me: r => r.fulfill({ status: 404, body: '' }) }); await p.click('#mg-lro'); await p.waitForTimeout(800);
    ok('missing file: “Dated path unavailable on the globe”, globe and drawing still usable', /^Dated path unavailable on the globe — the file could not be loaded/.test(await text(p)) && await p.locator('#mg-globe[data-ready="1"]').count() === 1 && /^Historical snapshot/.test(await p.textContent('#craft-state')) && (await geom(p)).marks.length === 0, await text(p));
    await ctx.close(); }
  { const bad = Buffer.from(MEB); bad[bad.length - 10] = bad[bad.length - 10] === 0x31 ? 0x32 : 0x31;
    const { ctx, p } = await mk('', { me: r => r.fulfill({ status: 200, contentType: 'application/json', body: bad }) }); await p.click('#mg-lro'); await p.waitForTimeout(800);
    ok('altered file: refused on its hash, nothing drawn', /failed its integrity check/.test(await text(p)) && (await geom(p)).marks.length === 0, await text(p));
    await ctx.close(); }
  { const { ctx, p } = await mk('', { noLib: true }); await p.waitForTimeout(2500);
    ok('no globe library: globe unavailable, drawing unaffected', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /^Historical snapshot/.test(await p.textContent('#craft-state')));
    await ctx.close(); }
  { const { ctx, p } = await mk('', { noGL: true }); await p.waitForTimeout(1500);
    ok('no WebGL: the drawing remains the fallback', (await p.textContent('#mg-state')) === 'Moon globe unavailable' && /^Historical snapshot/.test(await p.textContent('#craft-state')) && await p.locator('#craft-svg circle.cm').count() === 1);
    await ctx.close(); }

  // ---- F. the conversion
  { const { ctx, p } = await mk();
    const c = await p.evaluate(() => [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [-1, 1e-9, 0], [-1, -1e-9, 0], [Math.cos(85 * Math.PI / 180), 0, Math.sin(85 * Math.PI / 180)]].map(v => MoonGlobe.toGlobe(v[0] * 1800, v[1] * 1800, v[2] * 1800)));
    const near = (a, b2) => Math.abs(a - b2) < 1e-9;
    ok('+x → 0°N 0°E', near(c[0].lat, 0) && near(c[0].lng, 0)); ok('+y → 90°E', near(c[1].lng, 90)); ok('−x → 180°', near(Math.abs(c[2].lng), 180)); ok('−y → 90°W', near(c[3].lng, -90));
    ok('+z → 90°N, −z → 90°S', near(c[4].lat, 90) && near(c[5].lat, -90));
    ok('seam: just north and south of the −x axis give +180 and −180', c[6].lng > 179.999 && c[7].lng < -179.999);
    ok('high latitude 85°N', near(c[8].lat, 85) && near(c[8].lng, 0));
    ok('altitude in globe radii and km', near(c[0].alt, 1800 / 1737.4 - 1) && Math.abs(c[0].km - 62.6) < 1e-9);
    // catalogue round trip: the page's conversion of every sample equals this file's numbers
    const all = await p.evaluate(j => { let w = 0; for (let i = 0; i < 1441; i++) { const q = MoonGlobe.toGlobe(j[3 * i], j[3 * i + 1], j[3 * i + 2]); w = Math.max(w, Math.abs(q.lat - Math.atan2(j[3 * i + 2], Math.hypot(j[3 * i], j[3 * i + 1])) * 180 / Math.PI)); } return w; }, ME.xyz_km);
    ok('the page converts all 1,441 samples as expected', all < 1e-12, all);
    await ctx.close(); }

  // ---- G. the real map on the rendered globe: fiducial through the path's conversion vs the feature found in the drawn texture
  { const { ctx, p } = await mk('', { vp: { width: 1100, height: 1100 } });
    const box = await p.locator('#mg-globe').boundingBox();
    const shot = async () => (await p.screenshot({ clip: box })).toString('base64');
    for (const [name, lat, lng] of MARKS) {
      await p.evaluate(([la, ln]) => { MoonGlobe.globe().labelsData([]); MoonGlobe.globe().pointOfView({ lat: la, lng: ln, altitude: 0.9 }, 0); }, [lat, lng]); await p.waitForTimeout(700);
      const plain = await shot();
      await p.evaluate(([la, ln]) => { const k = Math.PI / 180, R = 1737.4, q = MoonGlobe.toGlobe(R * Math.cos(la * k) * Math.cos(ln * k), R * Math.cos(la * k) * Math.sin(ln * k), R * Math.sin(la * k));
        MoonGlobe.globe().labelsData([q]).labelLat('lat').labelLng('lng').labelAltitude(() => 0).labelText(() => '').labelDotRadius(0.25).labelColor(() => '#ff00ff').labelsTransitionDuration(0); }, [lat, lng]); await p.waitForTimeout(700);
      const fid = await shot();
      const r = await p.evaluate(async ({ plain, fid, lat, lng }) => {
        const load = async src => { const i = new Image(); i.src = src; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data }; };
        const A = await load('data:image/png;base64,' + plain), B = await load('data:image/png;base64,' + fid), T = await load('assets/moon/lroc_color_2k.jpg?v=1');
        const dpr = A.w / document.getElementById('mg-globe').clientWidth;
        // 1. fiducial centroid (magenta difference)
        let sx = 0, sy = 0, n = 0; for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) { const k = 4 * (y * A.w + x); if (Math.abs(B.d[k] - A.d[k]) + Math.abs(B.d[k + 1] - A.d[k + 1]) + Math.abs(B.d[k + 2] - A.d[k + 2]) > 120) { sx += x; sy += y; n++; } }
        if (!n) return { err: 'no fiducial' }; const F = [sx / n / dpr, sy / n / dpr];
        // 2. expected picture of the texture around the landmark, built from the globe's own screen → lat/lng mapping
        const g = MoonGlobe.globe(), L = g.getScreenCoords(lat, lng, 0), H = 60, lum = (d, k) => .2126 * d[k] + .7152 * d[k + 1] + .0722 * d[k + 2];
        const E = new Float64Array((2 * H + 1) ** 2); let e = 0;
        for (let dy = -H; dy <= H; dy++) for (let dx = -H; dx <= H; dx++) { const q = g.toGlobeCoords(L.x + dx, L.y + dy); let v = NaN;
          if (q) { const tx = Math.min(T.w - 1, Math.max(0, Math.floor((q.lng + 180) / 360 * T.w))), ty = Math.min(T.h - 1, Math.max(0, Math.floor((90 - q.lat) / 180 * T.h))); v = lum(T.d, 4 * (ty * T.w + tx)); }
          E[e++] = v; }
        // 3. find the shift of the drawn picture (plain frame) that matches it best: normalised cross-correlation, ±25 px
        const at = (x, y) => { const X = Math.round(x * dpr), Y = Math.round(y * dpr); return X < 0 || Y < 0 || X >= A.w || Y >= A.h ? NaN : lum(A.d, 4 * (Y * A.w + X)); };
        let best = { c: -2 };
        for (let oy = -25; oy <= 25; oy++) for (let ox = -25; ox <= 25; ox++) { let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, m = 0; e = 0;
          for (let dy = -H; dy <= H; dy += 2) for (let dx = -H; dx <= H; dx += 2) { const ev = E[(dy + H) * (2 * H + 1) + (dx + H)]; const av = at(L.x + dx + ox, L.y + dy + oy); if (isNaN(ev) || isNaN(av)) continue; sa += ev; sb += av; saa += ev * ev; sbb += av * av; sab += ev * av; m++; }
          const c = (sab - sa * sb / m) / Math.sqrt((saa - sa * sa / m) * (sbb - sb * sb / m)); if (c > best.c) best = { c, ox, oy }; }
        const feature = [L.x + best.ox, L.y + best.oy];
        // 4. pixels per degree here, from the globe's projection
        const a = g.getScreenCoords(lat + 0.5, lng, 0), b2 = g.getScreenCoords(lat - 0.5, lng, 0), ppd = Math.hypot(a.x - b2.x, a.y - b2.y);
        const off = Math.hypot(F[0] - feature[0], F[1] - feature[1]) / ppd;
        return { F, feature, corr: best.c, shift: [best.ox, best.oy], ppd, off_deg: off };
      }, { plain, fid, lat, lng });
      ok(`${name} (${lat}, ${lng}): the fiducial from the path’s conversion lands on the drawn feature within 1°`, !r.err && r.off_deg <= 1 && r.corr > 0.5, r);
      console.log('landmark', name, JSON.stringify({ off_deg: r.off_deg && +r.off_deg.toFixed(3), corr: r.corr && +r.corr.toFixed(3), shift: r.shift, ppd: r.ppd && +r.ppd.toFixed(2) }));
    }
    await ctx.close(); }

  await b.close();
  console.log(`moon-lro-path: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
