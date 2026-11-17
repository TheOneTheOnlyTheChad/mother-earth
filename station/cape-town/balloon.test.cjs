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
