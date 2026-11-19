/* Balloon replay — local suite. A synthetic flight in SondeHub's frame format is saved where the helper looks; the real
 * preview.mjs and balloon.html are run. No network. Run: NODE_PATH=/opt/npm-tools/node_modules node balloon.test.cjs */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs'); const os = require('os');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log('FAIL  ' + n + (got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 600) : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.parse('2026-11-16T23:42:17Z');
// Synthetic flight: up at 6 m/s from 200 m to 27,200 m drifting due EAST at 20 m/s (72 km/h, wind FROM the west), a 90 s gap
// at 10 km, then down at 30 m/s to 9,200 m drifting due NORTH at 10 m/s. One reading every 2 s; strings, as SondeHub sends them.
function flight() {
  const f = []; let t = 0, lat = -33.976, lon = 18.597, alt = 200; const mLat = 1 / 110574, mLon = 1 / (111320 * Math.cos(33.976 * Math.PI / 180));
  const push = up => f.push({ datetime: new Date(T0 + t * 1000).toISOString().replace('.000Z', '.000000Z'), lat: String(lat.toFixed(5)), lon: String(lon.toFixed(5)), alt: String(alt.toFixed(1)),
    temp: String((15 - alt / 150).toFixed(1)), humidity: String(Math.max(0, 60 - alt / 500).toFixed(1)), serial: 'TESTSONDE', type: 'iMet-54', frequency: 404.0, uploader_callsign: up, uploader_position: '0,0' });
  while (alt < 27200) { if (!(alt > 10000 && alt < 10540)) { push('ST1'); if (alt % 600 === 200) push('ST2'); } t += 2; alt += 12; lon += 40 * mLon; }
  const top = { t, alt };
  while (alt > 9200) { push('ST1'); t += 2; alt -= 60; lat += 20 * mLat; }
  f.push({ datetime: 'not a date', lat: '1', lon: '1', alt: '1' }, { datetime: new Date(T0).toISOString(), lat: '0', lon: '0', alt: '5' }, { datetime: new Date(T0 + 5000).toISOString(), lat: null, lon: '18', alt: '5' });
  f.reverse();   // out of order on purpose
  return { frames: f, top };
}
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'balloon-')); const { frames, top } = flight();
  const start = () => spawn(process.execPath, [path.join(__dirname, 'preview.mjs')], { env: { ...process.env, PORT: '18790', BALLOON_DIR: dir, FLIGHT: 'TESTSONDE', PI_URL: 'http://127.0.0.1:9/none' } });
  let srv = start(); await sleep(700);
  const browser = await chromium.launch(); const page = await browser.newPage(); const S = () => page.evaluate(() => window.BR.state());
  await page.goto('http://127.0.0.1:18790/balloon'); await sleep(800); let s = await S();
  ok('no saved flight: says so, draws nothing', s.ready === 'failed' && /No flight to show/.test(s.title) && /run fetch-flight\.mjs once/.test(s.facts) && s.polylines === 0, s);
  fs.writeFileSync(path.join(dir, 'flight-TESTSONDE.raw.json'), JSON.stringify(frames));
  fs.writeFileSync(path.join(dir, 'flight-TESTSONDE.meta.json'), JSON.stringify({ serial: 'TESTSONDE', source: 'SondeHub open archive (S3 sondehub-history)', retrieved_at: '2026-11-17T07:00:00.000Z', sha256: 'abcdef0123456789' }));
  await page.goto('http://127.0.0.1:18790/balloon'); await sleep(900); s = await S();
  await page.evaluate(f => { window.__frames = f; }, frames);
  const upN = Math.round((27200 - 200) / 12) - 45, dupes = frames.filter(f => f.uploader_callsign === 'ST2').length;
  ok('flight loads; duplicates and unusable readings are left out and counted', s.ready === 'ok' && s.n === frames.length - 3 - dupes && new RegExp(dupes + ' repeated reading').test(s.credit) && /3 unusable readings/.test(s.credit), [s.n, frames.length, dupes, s.credit.slice(0, 400)]);
  ok('readings are put in time order (first received is the lowest, at the start time)', /2026-11-16 23:42:17 UTC/.test(s.title) && /First received at 200 m/.test(s.facts), [s.title, s.facts]);
  ok('highest and last received points are stated', /highest received 27,200 m/.test(s.facts) && /last received at 9,2\d\d m on the way down/.test(s.facts), s.facts);
  ok('the gap is counted and breaks the line (up path in two pieces, down in one)', /1 gap of more than 30 s/.test(s.facts) && s.polylines === 3, [s.facts, s.polylines]);
  ok('two receivers counted, no callsign shown', /Heard by 2 volunteer receivers/.test(s.facts) && !/ST1|ST2/.test(await page.content()), s.facts);
  ok('first and last points are labelled as received points, not launch or landing', s.mapLabels.some(t => /first point received .* \(not the launch\)/.test(t)) && s.mapLabels.some(t => /last point received .* \(not the landing\)/.test(t)) && s.mapLabels.some(t => /highest point received/.test(t)), s.mapLabels);
  const html = await page.content();
  ok('the page says neither end is the launch or landing', /Neither is the launch or the landing/.test(html));
  ok('temperature and humidity are labelled uncalibrated in the readout, on both charts and in the note', /uncalibrated/.test(s.read.Temperature) && /uncalibrated/.test(s.read.Humidity) && (await page.evaluate(() => [...document.querySelectorAll('#ptemp text, #phum text')].filter(t => t.textContent === 'uncalibrated').length)) === 2 && /Temperature and humidity are uncalibrated/.test(html), [s.read, (html.match(/uncalibrated/g) || []).length]);
  ok('credit: SondeHub, CC BY-SA 2.0 with its link, the single archived copy, the changes made, ShareAlike', /SondeHub Radiosonde Telemetry/.test(s.credit) && /CC BY-SA 2\.0/.test(s.credit) && /creativecommons\.org\/licenses\/by-sa\/2\.0\//.test(html) && /One archived copy, retrieved 2026-11-17 07:00:00 UTC/.test(s.credit) && /Changes made by Mother Earth/.test(s.credit) && /must carry the same licence/.test(s.credit), s.credit);
  ok('slider starts at the first received point on the way up', s.phase === 'up' && s.i === 0 && s.slider.min === '200' && s.slider.max === '27200' && s.slider.text === '200 m', s.slider);
  const set = async v => { await page.evaluate(v => { const e = document.getElementById('alt'); e.value = String(v); e.dispatchEvent(new Event('input')); }, v); return S(); };
  s = await set(5000);
  ok('slider at 5,000 m: the reading there (time, altitude, position east of the start, temperature, humidity)', /5,00\d m \(GPS\)/.test(s.read.Altitude) && /23:55:3\d UTC/.test(s.read.Time) && /33\.976°S, 18\.7\d\d°E/.test(s.read.Position) && /-18\.\d °C/.test(s.read.Temperature) && /50\.\d %/.test(s.read.Humidity), s.read);
  ok('wind estimate on the way up: about 72 km/h from the west, labelled as an estimate from GPS drift over 60 s', /about 7[123] km\/h from the west \(27\d°\) — from GPS drift over 60 s/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  const m1 = s.marker; s = await set(20000);
  ok('the marker moves along the path with the slider', s.marker[0] !== m1[0] && /20,00\d m/.test(s.slider.text), [m1, s.marker]);
  s = await set(10000);
  ok('at the edge of the gap the wind window stops at the gap (shorter span, or none)', /over (2\d|30) s|no estimate here/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  s = await set(200);
  ok('at the first received point the window is one-sided (30 s)', /from GPS drift over 30 s/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  ok('the wind note documents the window and that it is not a measurement', /Wind is an estimate, not a measurement/.test(s.windnote) && /within 30 seconds either side/.test(s.windnote) && /shorter than 20 seconds or crosses a gap/.test(s.windnote), s.windnote);
  await page.check('input[name=phase][value=down]'); s = await S();
  ok('on the way down: slider spans the received descent, starting at the top', s.phase === 'down' && s.slider.max === '27200' && Number(s.slider.min) >= 9200 && Number(s.slider.min) < 9300 && (s.i === s.top + 1 || s.i === s.top), [s.slider, s.i, s.top]);
  s = await set(15000);
  ok('on the way down at 15,000 m: wind about 36 km/h from the south, part of flight says down', /about 3[567] km\/h from the south \(18\d°\)/.test(s.read['Wind (estimate)']) && s.read['Part of flight'] === 'on the way down' && /1[45],\d\d\d m/.test(s.read.Altitude), s.read);
  // ---- wind is withheld across the change from rising to falling (19 Nov) ----
  s = await set(27200);
  ok('way down, at the top: no wind estimate, and the readout says why', /^no estimate here: the window around this reading runs across the highest point received, where the balloon stopped rising and began to fall$/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  await page.check('input[name=phase][value=up]'); s = await set(27200);
  ok('way up, at the top: no wind estimate either', /runs across the highest point received/.test(s.read['Wind (estimate)']) && s.i === s.top, [s.read['Wind (estimate)'], s.i, s.top]);
  s = await set(27200 - 12 * 14);     // 28 s below the top on the way up: the 30 s window still reaches past the top
  ok('way up, 28 s before the top: still withheld (the window reaches past the top)', /runs across the highest point received/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  s = await set(27200 - 12 * 15);     // 30 s below: the window ends at the top itself, all of it on the way up
  ok('way up, 30 s before the top: the window ends at the top and an estimate is given (about 72 km/h from the west)', /about 7[123] km\/h from the west/.test(s.read['Wind (estimate)']), s.read['Wind (estimate)']);
  { const w = await page.evaluate(() => { const B = window.BR, F = B.prepare(window.__frames), H = B.cfg.WIND_HALF_S * 1000, tr = F.tr, T = tr[F.top].t, out = { wrong: [], n: 0, at: [], top: F.top, edgeUp: null, edgeDown: null };
      for (let i = 0; i < tr.length; i++) { const got = B.wind(F, i), before = tr.some((q, j) => j < F.top && tr[i].t - q.t <= H && tr[i].t - q.t >= 0) || i < F.top, after = tr.some((q, j) => j > F.top && q.t - tr[i].t <= H && q.t - tr[i].t >= 0) || i > F.top;
        // independent rule: withheld exactly when a reading before the top and a reading after it both lie within 30 s of this one
        const pre = tr.some((q, j) => j < F.top && Math.abs(q.t - tr[i].t) <= H), post = tr.some((q, j) => j > F.top && Math.abs(q.t - tr[i].t) <= H), want = pre && post;
        if ((got.none === 'transition') !== want) out.wrong.push(i); if (got.none === 'transition') { out.n++; out.at.push(i - F.top); } }
      out.edgeUp = B.wind(F, F.top - 15); out.edgeDown = B.wind(F, F.top + 15); return out; });
    ok('pure: withheld exactly for the readings within 30 s of the top on both sides (29 readings at 2 s cadence), nowhere else', w.wrong.length === 0 && w.n === 29 && Math.min(...w.at) === -14 && Math.max(...w.at) === 14, w);
    ok('pure: the first readings outside that span have one-phase windows (up: from the west; down: from the south)', !w.edgeUp.none && Math.abs(w.edgeUp.from - 270) < 2 && !w.edgeDown.none && Math.abs(w.edgeDown.from - 180) < 2, [w.edgeUp, w.edgeDown]); }
  ok('the wind note explains why nothing is shown around the highest point', /No estimate is given around the highest point received either/.test(s.windnote) && /readings from both the way up and the way down/.test(s.windnote) && /would not be a wind/.test(s.windnote), s.windnote);
  // ---- map labels keep clear of the path (19 Nov) ----
  const geom = () => page.evaluate(() => { const svg = document.getElementById('map'), inf = 1.5;
    const boxes = [...svg.querySelectorAll('text.lab')].map(t => { const b = t.getBBox(); return { id: t.dataset.for || t.textContent.slice(0, 12), x0: b.x - inf, x1: b.x + b.width + inf, y0: b.y - inf, y1: b.y + b.height + inf }; });
    const segs = []; for (const pl of svg.querySelectorAll('polyline')) { const pts = pl.getAttribute('points').trim().split(/\s+/).map(q => q.split(',').map(Number)); for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]); }
    const hit = (r, p, q) => { for (let k = 0; k <= 20; k++) { const x = p[0] + (q[0] - p[0]) * k / 20, y = p[1] + (q[1] - p[1]) * k / 20; if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return true; } return false; };   // sampled, independent of the page's own test
    const over = (r, q) => r.x0 < q.x1 && q.x0 < r.x1 && r.y0 < q.y1 && q.y0 < r.y1;
    return { n: boxes.length, crossed: boxes.map(b => [b.id, segs.filter(g => hit(b, g[0], g[1])).length]), pairs: boxes.flatMap((b, i) => boxes.slice(i + 1).filter(c => over(b, c)).map(c => b.id + '+' + c.id)),
      outside: boxes.filter(b => b.x0 < 0 || b.y0 < 0 || b.x1 > 560 || b.y1 > 560).map(b => b.id), leads: svg.querySelectorAll('line.lead').length, est: (window.BR.labels ? window.BR.labels() : []).map(L => [L.id, Math.round(L.r.x1 - L.r.x0), L.d, L.hits]), real: boxes.map(b => [b.id, Math.round(b.x1 - b.x0 - 2 * inf)]) }; });
  let g = await geom(); if (process.env.SHOTS) await (await page.$('#map')).screenshot({ path: path.join(process.env.SHOTS, 'balloon-map.png') });
  ok('map: three labels, none lying over the drawn path (boxes the browser really drew)', g.n === 3 && g.crossed.every(c => c[1] === 0), g);
  ok('map: no label covers another, and none leaves the map', g.pairs.length === 0 && g.outside.length === 0, g);
  ok('map: the estimated label sizes used for placement are not smaller than the drawn text', g.est.every(e => { const r = g.real.find(x => x[0] === e[0]); return r && e[1] >= r[1]; }), [g.est, g.real]);
  await page.check('input[name=phase][value=down]'); await set(15000); const g2 = await geom();
  ok('map: placement does not change with the slider or the part of flight', JSON.stringify(g2.est) === JSON.stringify(g.est), [g.est, g2.est]);
  { const pc = await page.evaluate(() => { const B = window.BR, W = 560, mk = (x, y, id) => ({ id, x, y, lines: ['first point received · 200 m ', '(not the launch)'] });
      const line = (x0, y0, x1, y1, n = 60) => Array.from({ length: n }, (_, i) => [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n], [x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (i + 1) / n]]);
      const side = L => (L.r.x0 >= L.x ? 'E' : L.r.x1 <= L.x ? 'W' : '') + (L.r.y0 >= L.y ? 'S' : L.r.y1 <= L.y ? 'N' : '');
      const east = B.place([mk(280, 280, 'a')], line(280, 280, 540, 280), W, [])[0], west = B.place([mk(280, 280, 'a')], line(280, 280, 20, 280), W, [])[0];
      const corner = B.place([mk(20, 540, 'a')], line(20, 540, 400, 300), W, [])[0];
      const starOf = len => { const o = []; for (let k = 0; k < 16; k++) o.push(...line(280, 280, 280 + len * Math.cos(k * Math.PI / 8), 280 + len * Math.sin(k * Math.PI / 8))); return o; };
      const crowded = B.place([mk(280, 280, 'a')], starOf(60), W, [])[0], full = B.place([mk(280, 280, 'a')], starOf(270), W, [])[0];
      const two = B.place([mk(280, 280, 'a'), mk(284, 284, 'b')], [], W, []);
      const again = JSON.stringify(B.place([mk(280, 280, 'a')], line(280, 280, 540, 280), W, [])[0]) === JSON.stringify(east);
      return { full: [full.hits, full.r.x0 >= 2 && full.r.x1 <= W - 2 && full.r.y0 >= 2 && full.r.y1 <= W - 2, !!full.lead], east: [side(east), east.hits], west: [side(west), west.hits], corner: [corner.hits, corner.r.x0 >= 2 && corner.r.y1 <= W - 2], crowded: [crowded.hits, !!crowded.lead, crowded.d], twoApart: !(two[0].r.x0 < two[1].r.x1 && two[1].r.x0 < two[0].r.x1 && two[0].r.y0 < two[1].r.y1 && two[1].r.y0 < two[0].r.y1), again,
        cross: [B.crosses({ x0: 0, x1: 10, y0: 0, y1: 10 }, [-5, 5], [15, 5]), B.crosses({ x0: 0, x1: 10, y0: 0, y1: 10 }, [-5, -5], [15, -1]), B.crosses({ x0: 0, x1: 10, y0: 0, y1: 10 }, [3, 3], [4, 4]), B.crosses({ x0: 0, x1: 10, y0: 0, y1: 10 }, [12, -2], [-2, 12])] }; });
    ok('place: a path leaving east puts the label clear of it, not due east; a path leaving west, not due west', pc.east[1] === 0 && pc.east[0] !== 'E' && pc.west[1] === 0 && pc.west[0] !== 'W', pc);
    ok('place: a marker in the corner keeps its label inside the map and off the path', pc.corner[0] === 0 && pc.corner[1] === true, pc.corner);
    ok('place: with short path pieces leaving in sixteen directions the label moves out past them and gets a leader line', pc.crowded[0] === 0 && pc.crowded[1] === true && pc.crowded[2] >= 20, pc.crowded);
    ok('place: when no clear spot exists (the path fills the map) the label still stays inside the map, with a leader line; some overlap remains', pc.full[0] > 0 && pc.full[1] === true && pc.full[2] === true, pc.full);
    ok('place: two markers almost on top of each other get labels that do not cover each other', pc.twoApart === true, pc);
    ok('place: the same input gives the same placement', pc.again === true);
    ok('crosses: through, miss, inside, and corner-cutting segments', pc.cross[0] === true && pc.cross[1] === false && pc.cross[2] === true && pc.cross[3] === true, pc.cross); }
  { // control: the reviewed page before this change (d540c5d), same saved flight
    const { execFileSync } = require('child_process'); const old = fs.mkdtempSync(path.join(os.tmpdir(), 'balloon-old-'));
    for (const f of ['preview.mjs', 'balloon.html']) fs.writeFileSync(path.join(old, f), execFileSync('git', ['show', 'd540c5d:station/cape-town/' + f], { cwd: __dirname, maxBuffer: 1 << 24 }));
    const so = spawn(process.execPath, [path.join(old, 'preview.mjs')], { env: { ...process.env, PORT: '18791', BALLOON_DIR: dir, FLIGHT: 'TESTSONDE', PI_URL: 'http://127.0.0.1:9/none' } }); await sleep(700);
    const keep = page; const p2 = await browser.newPage(); await p2.goto('http://127.0.0.1:18791/balloon'); await sleep(900);
    const oc = await p2.evaluate(() => { const svg = document.getElementById('map'), boxes = [...svg.querySelectorAll('text.lab')].map(t => t.getBBox()); let n = 0;
      for (const pl of svg.querySelectorAll('polyline')) for (const q of pl.getAttribute('points').trim().split(/\s+/).map(q => q.split(',').map(Number))) if (boxes.some(b => q[0] > b.x && q[0] < b.x + b.width && q[1] > b.y && q[1] < b.y + b.height)) n++;
      const e = document.getElementById('alt'); e.value = e.max; e.dispatchEvent(new Event('input')); return { pathPointsUnderLabels: n, windAtTop: window.BR.state().read['Wind (estimate)'] }; });
    ok('control (old page, same flight): labels lie over the path, and a wind figure is shown at the top', oc.pathPointsUnderLabels > 0 && /^about \d+ km\/h/.test(oc.windAtTop), oc);
    await p2.close(); so.kill(); fs.rmSync(old, { recursive: true, force: true }); }
  ok('profiles are drawn for the way up and the way down', s.tempLines >= 3 && s.humLines >= 3, [s.tempLines, s.humLines]);
  // pure functions
  const u = await page.evaluate(() => { const F = window.BR.prepare([{ datetime: '2026-01-01T00:00:00Z', lat: '1', lon: '1', alt: '5' }]); const G = window.BR.prepare(null); return [F.ok, F.why, G.ok]; });
  ok('a flight with fewer than two usable frames is refused', u[0] === false && /fewer than two/.test(u[1]) && u[2] === false, u);
  fs.writeFileSync(path.join(dir, 'flight-TESTSONDE.raw.json'), '{"not":"frames"}'); await page.goto('http://127.0.0.1:18790/balloon'); await sleep(800); s = await S();
  ok('a saved file that is not a list of frames: refused, nothing drawn', s.ready === 'failed' && s.polylines === 0, s);
  const r = await fetch('http://127.0.0.1:18790/balloon/flight.json'); const j = await r.json();
  ok('the helper serves only the one saved flight and reads no network for it', r.status === 200 && j.serial === 'TESTSONDE', j.serial);
  const r2 = await fetch('http://127.0.0.1:18790/balloon/../preview.mjs'); ok('no other file is served', r2.status === 404 || !/import http/.test(await r2.text()), r2.status);
  srv.kill(); await browser.close(); fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\nballoon-replay: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
