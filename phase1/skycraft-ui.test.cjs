/* Mother Earth — Moon and Sun spacecraft pages and the Sky links (MOON-AND-SUN-BUILD-PROPOSAL rev 2.1 §2, §5).
 * Real moon.html / sun.html / craft.js and real index.html + skyscene.js served locally (8899); real globe.gl (SwiftShader).
 * The hub is routed: dated examples = the committed catalogue files; the Parker snapshot = what the REAL worker.js publishes
 * (phase1/skycraft-fixture.mjs). Expected marker positions and distances are computed HERE from the catalogue numbers, not read
 * back from the page.
 * Run: (python3 -m http.server 8899 --bind 127.0.0.1 &) ; NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/skycraft-ui.test.cjs
 * BREAK=<name> serves a weakened craft.js or skyscene.js; each must fail:
 *   no-pin nearest-sample hub-any-time edge-shown no-snap-hash push-history lro-today wrong-axis no-far no-break controls-shown
 *   example-default-hub link-no-time link-always no-reopen no-focus keep-return back-always round-stop */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const REPO = path.join(__dirname, '..'), BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const BREAK = process.env.BREAK || '';
const CRAFT_BREAKS = {
  'no-pin': ["      if (await sha256(buf) !== CFG.sha) return 'the dated example failed its integrity check';\n", ''],
  'nearest-sample': ["const indexOf = (d, ms) => { if (!d || ms < d.start || ms > d.end || (ms - d.start) % d.step) return -1; const i = (ms - d.start) / d.step;", "const indexOf = (d, ms) => { if (!d || ms < d.start || ms > d.end) return -1; const i = Math.round((ms - d.start) / d.step);"],
  'hub-any-time': ["const indexOf = (d, ms) => { if (!d || ms < d.start || ms > d.end || (ms - d.start) % d.step) return -1;", "const indexOf = (d, ms) => { if (!d) return -1; if (d.kind === 'hub') return Math.max(0, Math.min(d.n - 1, Math.round((ms - d.start) / d.step))); if (ms < d.start || ms > d.end || (ms - d.start) % d.step) return -1;"],
  'edge-shown': ["      d.ok = S.segment_of.map(i => i >= 0);", "      d.ok = null;"],
  'no-snap-hash': ["          if (await sha256(buf) !== ref.sha256) continue;\n", ''],
  'push-history': ["history.replaceState(history.state, '', u); } catch (_) {} }", "history.pushState(history.state, '', u); } catch (_) {} }"],
  'lro-today': ["    if (!CFG.hub) return;\n", ''],
  'wrong-axis': ["for (let k = 0; k < 3; k++) d.P[3 * i + k] = V[k][0] * x + V[k][1] * y + V[k][2] * z;", "for (let k = 0; k < 3; k++) d.P[3 * i + k] = V[0][k] * x + V[1][k] * y + V[2][k] * z;"],
  'no-far': ["    const behind = i => d.P[3 * i + 2] < 0 && Math.hypot(d.P[3 * i], d.P[3 * i + 1]) < d.R;", "    const behind = i => false;"],
  'no-break': ["      if (d.ok && !d.ok[i]) { cur = null; continue; }", "      if (d.ok && !d.ok[i]) { continue; }"],
  'controls-shown': ["$('craft-controls').hidden = !has;", "$('craft-controls').hidden = false;"],
  'example-default-hub': ["    if (raw === null) { if (st.example) { st.active = st.example; st.i = st.example.def; st.t = st.example.start + st.i * st.example.step; } }", "    if (raw === null) { const d = st.today || st.example; if (d) { st.active = d; st.i = d === st.example ? d.def : 24; st.t = d.start + st.i * d.step; } }"],
  'back-always': ["      if (from) { ev.preventDefault(); history.back(); }", "      ev.preventDefault(); history.back();"],
};
const SKY_BREAKS = {
  'link-no-time': ["a.href = show[b] ? `${b}.html?t=${st.date}T00%3A00%3A00Z` : `${b}.html`;", "a.href = `${b}.html`;"],
  'link-always': ["show = { moon: on && (st.free || st.s >= 0.5), sun: on && (st.sunShown || (!st.free && st.s > 1)) };", "show = { moon: on, sun: on };"],
  'no-reopen': ["  window.addEventListener('pageshow', () => { comeBack(); });", ''],
  'no-focus': ["    const a = $(rec.link); if (a && !a.hidden) a.focus();", ''],
  'round-stop': ["const rec = { stop: body === 'sun' ? 2 : (st.free ? 1 : Math.max(1, Math.round(st.s))), link: EXPLORE[body], rev: REV };", "const rec = { stop: st.free ? (body === 'moon' ? 1 : 2) : Math.round(st.s), link: EXPLORE[body], rev: REV };"],
  'keep-return': ["    links(); forget();   // closed by the visitor", "    links();   // closed by the visitor"],
};
let CRAFT = fs.readFileSync(path.join(REPO, 'craft.js'), 'utf8'), SKY = fs.readFileSync(path.join(REPO, 'skyscene.js'), 'utf8');
if (BREAK) { const b = CRAFT_BREAKS[BREAK] || SKY_BREAKS[BREAK]; if (!b) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  if (BREAK in CRAFT_BREAKS) { if (!CRAFT.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } CRAFT = CRAFT.replace(b[0], b[1]); }
  else { if (!SKY.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } SKY = SKY.replace(b[0], b[1]); } }
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 600) : ''}`); } };
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const CAT = { moon: fs.readFileSync(path.join(REPO, 'phase1/skycraft/catalogue/craft-moon-2026-06-R1.json')), sun: fs.readFileSync(path.join(REPO, 'phase1/skycraft/catalogue/craft-sun-2024-12-R1.json')) };
const CJ = { moon: JSON.parse(CAT.moon), sun: JSON.parse(CAT.sun) };
const fixture = (...a) => JSON.parse(cp.execFileSync('node', ['--no-warnings', path.join(REPO, 'phase1/skycraft-fixture.mjs'), ...a], { encoding: 'utf8' }));
const FX = fixture('2026-11-13T05:07:00Z'), FXEDGE = fixture('2026-11-13T05:07:00Z', 'edge=2026-11-14T00:00:00Z');
const SNAP = JSON.parse(Buffer.from(FX.snapshot, 'base64').toString());
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const R1 = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-2026-11-R1.json'), 'utf8'), SC = fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8');
// independent expectations from the file's own numbers
const proj = (j, i) => { const r = j.xyz_km.slice(3 * i, 3 * i + 3), V = j.frame.view.rows; return V.map(row => row[0] * r[0] + row[1] * r[1] + row[2] * r[2]); };
const dist = (j, i) => Math.hypot(...j.xyz_km.slice(3 * i, 3 * i + 3));
const kmText = v => Math.round(v).toLocaleString('en-GB') + ' km';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (url, o = {}) => {
    const ctx = o.ctx || await browser.newContext({ viewport: o.viewport || { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const hits = [];
    if (!o.ctx) {
      await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
      await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
      await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
      await ctx.route(BASE + '/craft.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: CRAFT }));
      await ctx.route(BASE + '/skyscene.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SKY }));
      await ctx.route(HUB + '/**', r => { const p = new URL(r.request().url()).pathname; hits.push(p); const J = (status, body) => r.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body });
        const fx = o.fx || FX;
        if (p === '/catalogue/skycraft/craft-moon-2026-06-R1') return J(200, o.moonCat || CAT.moon);
        if (p === '/catalogue/skycraft/craft-sun-2024-12-R1') return o.sunCat === null ? J(503, '{}') : J(200, o.sunCat || CAT.sun);
        if (p === '/snapshot/skycraft/meta') return o.meta === null ? J(503, '{}') : J(200, o.meta || fx.meta);
        if (p.startsWith('/snapshot/skycraft/')) return J(200, o.snapBody || Buffer.from(fx.snapshot, 'base64'));
        if (p === '/catalogue/sky/sky-2026-11-R1') return J(200, R1);
        if (p === '/catalogue/sky/sky-scene-2026-11-R1') return J(200, SC);
        return J(404, '{}'); });
    }
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
    if (o.time) await page.clock.install({ time: new Date(o.time) });
    await page.goto(BASE + '/' + url, { waitUntil: 'domcontentloaded' });
    if (!o.noWait) await page.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 });
    return { ctx, page, perr, hits };
  };
  const S = page => page.evaluate(() => ({ s: ME.craftState(), state: document.getElementById('craft-state').textContent, read: document.getElementById('craft-read').innerText, scale: document.getElementById('craft-scale').innerText,
    unavail: document.getElementById('craft-unavail').innerText, search: location.search, hist: history.length, svg: document.getElementById('craft-svg').innerHTML,
    shown: Object.fromEntries(['craft-stage', 'craft-controls', 'craft-unavail'].map(id => [id, !!document.getElementById(id).offsetParent])), over: document.documentElement.scrollWidth - innerWidth,
    missions: document.getElementById('craft-missions').innerText.length, sources: document.getElementById('craft-sources').innerText.length, focus: document.activeElement && document.activeElement.id }));
  const markerKm = v => { const sc = v.s.geo.scale_km_per_px; return [(v.s.geo.marker[0] - 300) * sc, (300 - v.s.geo.marker[1]) * sc]; };

  // ---------- 1. Moon, direct visit: the dated example
  { const { ctx, page, perr, hits } = await open('moon.html'); const v = await S(page), i = 720, j = CJ.moon, P = proj(j, i), mk = markerKm(v), r = dist(j, i);
    ok('1 direct visit opens the dated example at its default time, labelled historical', v.s.kind === 'example' && v.s.i === i && v.s.t === '2026-06-10T12:00:00Z' && /^Historical snapshot — 10 Jun 2026, 12:00 UTC\.$/.test(v.state), v.state);
    ok('1 no time is added to the address by a direct visit', v.search === '');
    ok('1 the marker is where the file\'s numbers and view matrix put it (independent projection)', Math.abs(mk[0] - P[0]) < 3 && Math.abs(mk[1] - P[1]) < 3, [mk, P]);
    ok('1 body and path share one scale: Moon radius drawn = 1737.4 km at that scale', Math.abs(v.s.geo.bodyPx * v.s.geo.scale_km_per_px - 1737.4) < 1 && v.s.geo.enlarged === 1, v.s.geo);
    ok('1 distances are the file\'s (independent): centre and above-surface by subtraction', v.read.includes(kmText(r)) && v.read.includes(kmText(r - 1737.4)) && /our subtraction/.test(v.read), v.read);
    ok('1 evidence line: Calculated position · source · time', /Calculated position · NASA\/GSFC FDF definitive trajectory \(NASA PDS\) · 10 Jun 2026, 12:00 UTC/.test(v.read), v.read);
    ok('1 classification in the provider\'s words', /Definitive trajectory/.test(v.read) && /Regular Definitive LRO Spacecraft trajectory/.test(v.read));
    ok('1 view direction, scale and marker enlargement are stated; path window given with its own start and end', /face-on to LRO's orbit plane/.test(v.scale) && /marker is enlarged/.test(v.scale) && /Path shown: 10 Jun 2026, 10:00 UTC to 10 Jun 2026, 14:00 UTC, one point every 1 min/.test(v.scale), v.scale);
    ok('1 the Moon page makes no request for a current position', hits.every(h => !h.startsWith('/snapshot/')) && hits.length === 1, hits);
    ok('1 no page error; no horizontal overflow', perr.length === 0 && v.over <= 0, [perr, v.over]);
    // keyboard: the slider
    await page.focus('#craft-range'); const h0 = v.hist; await page.keyboard.press('ArrowRight'); const a = await S(page);
    ok('1 ArrowRight on the slider selects the next sample; marker, label and address move together', a.s.i === 721 && a.s.t === '2026-06-10T12:01:00Z' && a.search === '?t=2026-06-10T12%3A01%3A00Z' && /12:01 UTC/.test(a.state) && /12:01 UTC/.test(a.read) && a.svg !== v.svg, [a.s.t, a.search]);
    ok('1 selecting a sample does not add a history entry', a.hist === h0, [h0, a.hist]);
    await page.click('#craft-prev'); await page.click('#craft-prev'); const b = await S(page);
    ok('1 the earlier/later buttons step one sample', b.s.i === 719 && b.hist === h0);
    await ctx.close(); }
  // ---------- 2. Moon: times
  for (const [t, want] of [['2026-06-10T11:45:00Z', 705], ['2026-06-10T00:00:00Z', 0], ['2026-06-11T00:00:00Z', 1440]]) {
    const { ctx, page } = await open('moon.html?t=' + encodeURIComponent(t)); const v = await S(page);
    ok(`2 covered time ${t} opens at that exact sample`, v.s.kind === 'example' && v.s.i === want && v.s.t === t && v.shown['craft-stage'], [v.s.i, v.state]);
    if (want === 0) ok('2 at the first sample "earlier" is disabled; path clipped to the covered interval', await page.$eval('#craft-prev', e => e.disabled) && /Path shown: 10 Jun 2026, 00:00 UTC to 10 Jun 2026, 02:00 UTC/.test(v.scale), v.scale);
    if (want === 1440) ok('2 at the last sample "later" is disabled', await page.$eval('#craft-next', e => e.disabled) && /to 11 Jun 2026, 00:00 UTC/.test(v.scale), v.scale);
    await ctx.close(); }
  for (const [t, why] of [['2026-06-10T11:45:30Z', 'between samples'], ['2026-06-09T23:59:00Z', 'one sample before the start'], ['2026-06-11T00:01:00Z', 'one sample after the end'], ['2026-11-13T00:00:00Z', 'the current Sky date']]) {
    const { ctx, page, hits } = await open('moon.html?t=' + encodeURIComponent(t)); const v = await S(page);
    ok(`2 ${why}: nothing drawn, the requested time stays visible, the example is offered`, v.s.kind === null && v.svg === '' && /^Position unavailable for this time\.$/.test(v.state) && v.unavail.includes('Requested time:') && /View a dated example/.test(v.unavail) && v.s.t === t, [v.state, v.unavail]);
    ok(`2 ${why}: drawing and time controls are not rendered; mission and sources still are`, !v.shown['craft-stage'] && !v.shown['craft-controls'] && v.shown['craft-unavail'] && v.missions > 100 && v.sources > 100, v.shown);
    if (why === 'the current Sky date') { ok('2 today: says why LRO has no position, and no current position was requested', /not been checked/.test(v.unavail) && hits.every(h => !h.startsWith('/snapshot/')), [v.unavail, hits]);
      const h0 = v.hist; await page.click('#craft-example'); const a = await S(page);
      ok('2 "View a dated example" opens the example explicitly, updates the address in place, and moves focus to the time control', a.s.kind === 'example' && a.s.t === '2026-06-10T12:00:00Z' && a.search === '?t=2026-06-10T12%3A00%3A00Z' && a.hist === h0 && a.focus === 'craft-range', [a.s, a.search, a.hist, a.focus]); }
    await ctx.close(); }
  { const { ctx, page } = await open('moon.html?t=yesterday'); const v = await S(page);
    ok('2 an unreadable time says so and draws nothing', v.svg === '' && /could not be read/.test(v.unavail) && v.unavail.includes('yesterday'), v.unavail); await ctx.close(); }
  // ---------- 3. Sun: the dated example
  { const { ctx, page, perr } = await open('sun.html'); const v = await S(page), j = CJ.sun, i = 360, P = proj(j, i), mk = markerKm(v), r = dist(j, i);
    ok('3 direct visit opens the December 2024 example even though a current read exists', v.s.kind === 'example' && v.s.t === '2024-12-24T12:00:00Z' && v.s.hasToday && /^Historical snapshot/.test(v.state), v.s);
    ok('3 marker = independent projection of the file\'s numbers', Math.abs(mk[0] - P[0]) / r < 0.01 && Math.abs(mk[1] - P[1]) / r < 0.01, [mk, P]);
    ok('3 NASA\'s reported closest approach is attributed to NASA; the closest sample is labelled separately', /Closest approach, as reported\s*NASA: about 3\.8 million miles \(6\.1 million km\)/.test(v.read) && /Closest sample in this snapshot\s*24 Dec 2024, 11:40 UTC: 6,166,864 km/.test(v.read) && /cannot give the exact time/.test(v.read), v.read);
    ok('3 classification: Horizons\' own words and the named segment', /Within the tracking-data fit/.test(v.read) && /Fit to post-launch tracking data through 2026-Sep-29/.test(v.read) && /spp_nom_20180812_20251001_v041_RO8/.test(v.read));
    ok('3 height above the surface is our subtraction from 695,700 km', v.read.includes(kmText(r - 695700)) && /695,700 km/.test(v.read));
    ok('3 no page error, no overflow', perr.length === 0 && v.over <= 0, perr); await ctx.close(); }
  // ---------- 4. Sun: the hub's current read
  { const { ctx, page, perr } = await open('sun.html?t=2026-11-13T00%3A00%3A00Z'); const v = await S(page), i = 24, P = proj(SNAP, i), mk = markerKm(v), r = dist(SNAP, i);
    ok('4 the Sky time opens on the hub\'s read at that exact sample, labelled predicted', v.s.kind === 'hub' && v.s.i === i && /^Predicted position — 13 Nov 2026, 00:00 UTC\.$/.test(v.state) && /Predicted position · NASA\/JPL Horizons · 13 Nov 2026, 00:00 UTC/.test(v.read), [v.s, v.state]);
    ok('4 marker = independent projection of the snapshot\'s numbers', Math.abs(mk[0] - P[0]) / r < 0.01 && Math.abs(mk[1] - P[1]) / r < 0.01, [mk, P]);
    ok('4 classification from the same response: reference planning trajectory, segment, sheet date; retrieval time shown separately', /Reference planning trajectory\./.test(v.read) && /spp_pred_20260930_20270217_od268_v001/.test(v.read) && /Data sheet revised Nov 03, 2026/.test(v.read) && /Read by the hub\s*13 Nov 2026, 05:07 UTC/.test(v.read), v.read);
    ok('4 the enlarged Sun is disclosed', v.s.geo.enlarged > 1 && new RegExp(`The Sun is drawn ${v.s.geo.enlarged.toFixed(1)}× larger`).test(v.scale), v.scale);
    ok('4 no page error', perr.length === 0, perr); await ctx.close(); }
  for (const [t, why] of [['2026-11-13T00:30:00Z', 'between the hub\'s hourly samples'], ['2026-11-21T00:00:00Z', 'after the hub\'s read ends'], ['2026-11-11T23:00:00Z', 'before it starts']]) {
    const { ctx, page } = await open('sun.html?t=' + encodeURIComponent(t)); const v = await S(page);
    ok(`4 ${why}: unavailable, nothing drawn`, v.s.kind === null && v.svg === '' && /^Position unavailable for this time\.$/.test(v.state) && /View a dated example/.test(v.unavail), v.state); await ctx.close(); }
  { // a sample at a trajectory-segment change is withheld: not selectable, and the line breaks there
    const { ctx, page } = await open('sun.html?t=2026-11-14T00%3A00%3A00Z', { fx: FXEDGE }); const v = await S(page);
    ok('4 edge: the sample at a segment change is unavailable', v.s.kind === null && v.svg === '', v.state);
    await page.goto(BASE + '/sun.html?t=2026-11-13T23%3A00%3A00Z'); await page.waitForFunction(() => ME.craftState().status === 'ready'); const a = await S(page);
    ok('4 edge: the path is drawn as two runs with a gap, and says so', a.s.geo.runs === 2 && (a.svg.match(/<polyline/g) || []).length === 2 && /line breaks where a sample is withheld/.test(a.scale), [a.s.geo.runs, a.scale]);
    await page.click('#craft-next'); const b = await S(page);
    ok('4 edge: stepping later skips the withheld sample', b.s.t === '2026-11-14T01:00:00Z', b.s.t); await ctx.close(); }
  { const { ctx, page } = await open('sun.html?t=2026-11-13T00%3A00%3A00Z', { meta: null }); const v = await S(page);
    ok('4 hub read unavailable: no position for today, said plainly; the example still works', v.s.kind === null && /latest read could not be loaded/.test(v.unavail) && v.s.hasExample, v.unavail);
    await page.click('#craft-example'); ok('4 …and the example opens from there', (await S(page)).s.kind === 'example'); await ctx.close(); }
  { const bad = Buffer.from(FX.snapshot, 'base64'); const k = bad.indexOf(Buffer.from('"xyz_km":[')) + 12; bad[k] = bad[k] === 0x31 ? 0x32 : 0x31;
    const { ctx, page } = await open('sun.html?t=2026-11-13T00%3A00%3A00Z', { snapBody: bad }); const v = await S(page);
    ok('4 a snapshot that does not match the pointer\'s hash is not drawn', v.s.kind === null && !v.s.hasToday && v.svg === '', v.s); await ctx.close(); }
  { // far side: a hand-made snapshot whose path passes behind the Sun (toward the viewer = +row 3 of the view matrix)
    const V = SNAP.frame.view.rows, snap = JSON.parse(JSON.stringify(SNAP)), R = 695700, mk = (sx, sy, d) => [0, 1, 2].map(k => V[0][k] * sx + V[1][k] * sy + V[2][k] * d).map(Math.round);
    snap.xyz_km = []; for (let i = 0; i < snap.time.n; i++) { const sx = (i - 24) * 0.2 * R; snap.xyz_km.push(...mk(sx, 0.1 * R, -3 * R)); }
    const body = Buffer.from(JSON.stringify(snap)), meta = JSON.parse(FX.meta); meta.current.sha256 = sha(body); meta.current.bytes = body.length;
    const { ctx, page } = await open('sun.html?t=2026-11-13T00%3A00%3A00Z', { snapBody: body, meta: JSON.stringify(meta) }); const v = await S(page);
    ok('4 behind the body: the hidden stretch is dashed, the marker hollow, and the words say so', v.s.kind === 'hub' && v.s.geo.far === true && /class="cp far"/.test(v.svg) && /class="cm far"/.test(v.svg) && /behind the Sun from this viewpoint/.test(v.scale) && v.s.geo.runs === 3, [v.s.geo, v.scale]); await ctx.close(); }
  // ---------- 5. a bad example file: page stays readable, nothing drawn
  { const bad = Buffer.from(CAT.moon); bad[bad.length - 40] = bad[bad.length - 40] === 0x31 ? 0x32 : 0x31;
    const { ctx, page, perr } = await open('moon.html', { moonCat: bad }); const v = await S(page);
    ok('5 altered example: geometry withheld with the reason; mission and sources readable', v.svg === '' && /^Geometry unavailable\.$/.test(v.state) && /integrity check/.test(v.unavail) && v.missions > 100 && v.sources > 100 && perr.length === 0, [v.state, v.unavail]); await ctx.close(); }
  { const { ctx, page } = await open('sun.html', { sunCat: null }); const v = await S(page);
    ok('5 example missing (Sun): geometry withheld on a direct visit', v.svg === '' && /could not be loaded/.test(v.unavail), v.unavail);
    await page.goto(BASE + '/sun.html?t=2026-11-13T00%3A00%3A00Z'); await page.waitForFunction(() => ME.craftState().status === 'ready');
    ok('5 …but the hub\'s read still shows for a time it covers', (await S(page)).s.kind === 'hub'); await ctx.close(); }
  // ---------- 6. phone widths
  for (const w of [360, 390]) for (const url of ['moon.html', 'sun.html?t=2026-11-13T00%3A00%3A00Z', 'moon.html?t=2026-11-13T00%3A00%3A00Z']) {
    const { ctx, page } = await open(url, { viewport: { width: w, height: 800 } }); const v = await S(page);
    const small = await page.evaluate(() => [...document.querySelectorAll('#craft-main button, #craft-main a#craft-back, #craft-range')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.id));
    ok(`6 ${w}px ${url}: no horizontal overflow; controls at least 40 px tall`, v.over <= 0 && small.length === 0, [v.over, small]); await ctx.close(); }
  // ---------- 7. Back to Earth on a direct visit is a plain link
  { const { ctx, page } = await open('moon.html'); await page.click('#craft-back'); await page.waitForURL(BASE + '/index.html');
    ok('7 direct visit: Back to Earth goes to the globe page', page.url() === BASE + '/index.html'); await ctx.close(); }
  // ---------- 8. from the Sky view and back
  { const { ctx, page, perr } = await open('index.html', { time: '2026-11-13T10:00:00Z', noWait: true });
    await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState, null, { timeout: 30000 });
    const vis = id => page.$eval('#' + id, e => !e.hidden && !!e.offsetParent);
    ok('8 before the view opens no Explore link is shown', !(await vis('zoom-moon')) && !(await vis('zoom-sun')));
    await page.click('#tgl-sky'); await page.click('#tgl-zoom'); await page.waitForFunction(() => ME.zoomState().open && ME.zoomState().path, null, { timeout: 30000 });
    ok('8 at the Earth stop neither link is shown', !(await vis('zoom-moon')) && !(await vis('zoom-sun')), await page.evaluate(() => ME.zoomState().stop));
    await page.click('#zoom-b'); await page.waitForFunction(() => !document.getElementById('zoom-moon').hidden);
    ok('8 at the Moon stop: Explore the Moon only, carrying the scene\'s displayed time', (await vis('zoom-moon')) && !(await vis('zoom-sun')) && (await page.$eval('#zoom-moon', e => e.getAttribute('href'))) === 'moon.html?t=2026-11-13T00%3A00%3A00Z', await page.$eval('#zoom-moon', e => e.getAttribute('href')));
    await page.click('#zoom-c'); await page.waitForFunction(() => !document.getElementById('zoom-sun').hidden);
    ok('8 at the Sun stop: both links, same time', (await vis('zoom-moon')) && (await vis('zoom-sun')) && (await page.$eval('#zoom-sun', e => e.getAttribute('href'))) === 'sun.html?t=2026-11-13T00%3A00%3A00Z');
    ok('8 the links are ordinary anchors, reachable by keyboard', await page.evaluate(() => ['zoom-moon', 'zoom-sun'].every(id => { const e = document.getElementById(id); return e.tagName === 'A' && e.tabIndex === 0; })));
    const box = async id => page.$eval('#' + id, e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
    const lm = await box('zoom-moon'), bk = await box('zoom-back'), over = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    ok('8 the links do not cover the Back to Earth button', !over(lm, bk) && !over(await box('zoom-sun'), bk), [lm, bk]);
    // leave from the Sun stop to the Sun page
    await page.click('#zoom-sun'); await page.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 });
    const v = await S(page);
    ok('8 the Sun page opens on the Sky time with the hub\'s read', v.s.kind === 'hub' && v.s.t === '2026-11-13T00:00:00Z', v.s);
    await page.click('#craft-back'); await page.waitForURL(BASE + '/index.html');
    await page.waitForFunction(() => window.ME && ME.zoomState && ME.zoomState().open && ME.zoomState().path && document.activeElement && document.activeElement.id === 'zoom-sun', null, { timeout: 40000 }).catch(() => {});
    const z = await page.evaluate(() => ({ z: ME.zoomState && ME.zoomState(), focus: document.activeElement && document.activeElement.id, hist: history.length }));
    ok('8 Back to Earth returns to the Sky view, reopened at the Sun stop, focus on the Explore link', z.z && z.z.open && z.z.stop === 'C' && z.focus === 'zoom-sun', [z.z && z.z.stop, z.z && z.z.open, z.focus]);
    // GPT, 13 Nov: between the Moon and Sun stops the Sun link is already shown while the nearer stop is still the Moon.
    // Leaving from there must come back to a stop that shows the link that was used.
    await page.click('#zoom-b'); await page.waitForFunction(() => ME.zoomState().stop === 'B');
    { const bb = await (await page.$('#globe canvas')).boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      for (let i = 0; i < 12; i++) { const p = await page.evaluate(() => ME.zoomState().s); if (p > 1.1 && p < 1.45) break; await page.mouse.wheel(0, 100); await page.waitForTimeout(80); } }
    const mid = await page.evaluate(() => ({ s: ME.zoomState().s, stop: ME.zoomState().stop, sun: !document.getElementById('zoom-sun').hidden }));
    ok('8 between stops: past the Moon stop the Sun link is shown while the nearer stop is still the Moon', mid.s > 1.1 && mid.s < 1.45 && mid.stop === 'B' && mid.sun, mid);
    await page.click('#zoom-sun'); await page.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 });
    await page.goBack(); await page.waitForURL(BASE + '/index.html');
    await page.waitForFunction(() => window.ME && ME.zoomState && ME.zoomState().open && ME.zoomState().path && document.activeElement && document.activeElement.id === 'zoom-sun', null, { timeout: 40000 }).catch(() => {});
    const zm = await page.evaluate(() => ({ z: ME.zoomState && ME.zoomState(), focus: document.activeElement && document.activeElement.id, sunShown: !document.getElementById('zoom-sun').hidden }));
    ok('8 between stops: Back reopens at the Sun stop, where the Sun link is shown and focused', zm.z && zm.z.open && zm.z.stop === 'C' && zm.sunShown && zm.focus === 'zoom-sun', [zm.z && zm.z.stop, zm.sunShown, zm.focus]);
    // again by the browser's Back button, from the Moon stop
    await page.click('#zoom-b'); await page.waitForFunction(() => ME.zoomState().stop === 'B');
    await page.click('#zoom-moon'); await page.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 15000 });
    const m = await S(page);
    ok('8 the Moon page from Sky shows "unavailable" for the Sky time and offers the example', m.s.kind === null && m.s.t === '2026-11-13T00:00:00Z' && /View a dated example/.test(m.unavail), m.state);
    await page.click('#craft-example'); await page.goBack(); await page.waitForURL(BASE + '/index.html');
    await page.waitForFunction(() => window.ME && ME.zoomState && ME.zoomState().open && ME.zoomState().path && document.activeElement && document.activeElement.id === 'zoom-moon', null, { timeout: 40000 }).catch(() => {});
    const z2 = await page.evaluate(() => ({ z: ME.zoomState && ME.zoomState(), focus: document.activeElement && document.activeElement.id }));
    ok('8 browser Back (one press, after choosing the example) reopens Sky at the Moon stop with focus on its link', z2.z && z2.z.open && z2.z.stop === 'B' && z2.focus === 'zoom-moon', [z2.z && z2.z.stop, z2.focus]);
    // closing the view forgets the return: a reload does not reopen it
    await page.click('#zoom-back'); await page.waitForFunction(() => !ME.zoomState().open);
    const snapGlobe = await page.evaluate(() => ({ layers: document.body.classList.contains('sky-zoom'), state: history.state && history.state.skyReturn }));
    ok('8 Sky\'s own Back to Earth closes the view and restores the globe as before', !snapGlobe.layers && !snapGlobe.state, snapGlobe);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState, null, { timeout: 30000 }); await page.waitForTimeout(2500);
    ok('8 after closing the view a reload does not reopen it', !(await page.evaluate(() => ME.zoomState().open)));
    ok('8 no page error across the round trips', perr.length === 0, perr);
    await ctx.close(); }
  { // a new-tab style visit (no Sky origin in this tab's history): Back to Earth must not call history.back()
    const { ctx, page } = await open('sun.html?t=2026-11-13T00%3A00%3A00Z'); await page.evaluate(() => sessionStorage.removeItem('me.sky.out'));
    await page.click('#craft-back'); await page.waitForURL(BASE + '/index.html'); ok('8 without a Sky origin, Back to Earth is a plain link to the globe', page.url() === BASE + '/index.html'); await ctx.close(); }
  // ---------- 9. the globe page still loads its orbital card (rev 1's regression ask)
  { const { ctx, page } = await open('index.html', { time: '2026-11-13T10:00:00Z', noWait: true }); await page.waitForFunction(() => window.ME && ME.globe && ME.zoomState, null, { timeout: 30000 });
    ok('9 Earth page: Orbital objects card and Sky controls present', await page.evaluate(() => !!document.getElementById('card-orb') && !!document.getElementById('tgl-zoom') && !!document.getElementById('zoom-explore'))); await ctx.close(); }
  await browser.close();
  console.log(`${fail ? 'FAIL' : 'PASS'}  skycraft-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
