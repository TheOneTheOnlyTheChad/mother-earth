/* Mother Earth — orbital layers: bounded browser suite (thread 9, 3 Nov 2026).
 *
 * Real globe.gl 2.45.0 and real satellite.js 6.0.2 (served from node_modules at the pinned versions), real SwiftShader
 * WebGL, real timers. The hub is routed: observation layers get small fixtures; orbital gets a classified element file
 * built by the hub's OWN orbBuild (worker.js) from a GP-shaped file with the real 3 Nov 13:42 class mix (32,509 objects:
 * payload 18,954 · rocket body 2,205 · debris 10,118 · unknown type 1,232), and a meta shaped exactly as collector 0.3.0
 * writes it. Tests the page's behaviour and failure paths — not Space-Track, not the live hub.
 *
 * Needs:  python3 -m http.server 8899 --bind 127.0.0.1   in the clone
 *         cd /home/claude/spike && npm i globe.gl@2.45.0 satellite.js@6.0.2
 *         node /home/claude/fixtures/build-orbital-fixture.mjs   (writes orbital.csv + orbital-meta.json)
 * Run:    node phase1/orbital-browser.test.cjs <fixture dir> [BREAK=<name>]
 * BREAK serves a deliberately broken page (string edits below) — the suite must FAIL for each one.
 */
const { chromium } = require('playwright');
const fs = require('fs'); const crypto = require('crypto');
const satellite = require('/home/claude/spike/node_modules/satellite.js');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const DIR = process.argv[2] || '/home/claude/fixtures';
const CSV = fs.readFileSync(DIR + '/orbital.csv', 'utf8');
const META = JSON.parse(fs.readFileSync(DIR + '/orbital-meta.json', 'utf8'));
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const BREAK = (process.argv.find(a => a.startsWith('BREAK=')) || '').slice(6);

// Deliberate breaks: each is a small, plausible coding mistake. [file, find, replace]
const BREAKS = {
  'off-keeps-markers': ['index.html', "const l = orb.layers[id]; if (l) { l.visible = false; l.geometry.setDrawRange(0, 0); }", "const l = orb.layers[id];"],
  'draws-all-groups':  ['index.html', "if (!l || !orb.on.has(gid)) continue;", "if (!l) continue;"],
  'worker-all-groups': ['index.html', "groups: [...orb.on] });", "groups: orb.groupIds });"],
  'timers-left-running': ['index.html', "if (!orb.on.size) { orbStopTimers(); orb.at = null; }", "if (!orb.on.size) { orb.at = null; }"],
  'no-checksum':       ['app.js', "if ((await ME.sha256Hex(csv)) !== meta.elements.sha256) return 'the element file does not match its published checksum", "if (false) return 'the element file does not match its published checksum"],
  'unknown-drawn':     ['app.js', "NOT_DRAWN_BY_TYPE: ['unknown_type'],", "NOT_DRAWN_BY_TYPE: [],"],
  'fail-touches-pairs':['index.html', "orb.on.clear(); orb.last = {}; orb.at = null; orb.busy = false; orb.why = 'Orbital layers not shown: ' + why + '.';", "orb.on.clear(); orb.last = {}; orb.at = null; orb.busy = false; orb.why = 'Orbital layers not shown: ' + why + '.'; for (const k in state) delete state[k];"],
};
if (BREAK && !BREAKS[BREAK]) { console.log('unknown BREAK', BREAK, Object.keys(BREAKS)); process.exit(2); }
const served = f => { let s = fs.readFileSync(__dirname + '/../' + f, 'utf8'); if (BREAK && BREAKS[BREAK][0] === f) { if (!s.includes(BREAKS[BREAK][1])) { console.log('BREAK target not found — break is stale'); process.exit(2); } s = s.replace(BREAKS[BREAK][1], BREAKS[BREAK][2]); } return s; };

const BUDGET_MS = 10 * 60e3;
const watchdog = setTimeout(() => { console.log(`\nFAIL  suite exceeded its ${BUDGET_MS / 1000}s budget — treated as a failure, not a hang`); process.exit(1); }, BUDGET_MS);
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const T0 = Date.now(); const mark = t => console.log(`   [${((Date.now() - T0) / 1000).toFixed(0)}s] ${t}`);
const RUN = '2026-11-03T13:50:00Z';
const GROUP_OF = { active: 'payload', inactive: 'payload', payload_status_unknown: 'payload', payload_unmatched: 'payload', payload_status_unavailable: 'payload', rocket_body: 'rocket_body', debris: 'debris', unknown_type: null };
const META_COUNT = { payload: 18954, rocket_body: 2205, debris: 10118 };

async function harness(browser, o = {}) {
  const { viewport = { width: 1280, height: 860 }, isMobile = false, orbital = {} } = o;
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, reducedMotion: 'reduce' });
  const hits = { meta: 0, csv: 0, status: 0, satjs: 0, spacetrack: 0, celestrak: 0 };
  const cur = { metaStatus: 200, meta: META, csvBody: CSV, csvHeader: META.elements.sha256, blockSatjs: false, lastRun: { layer: 'orbital', started_at: '2026-11-03T13:41:05.000Z', status: 'ok', note: 'published' }, ...orbital };
  for (const f of ['index.html', 'app.js']) await ctx.route(BASE + '/' + f + '*', r => r.fulfill({ status: 200, contentType: f.endsWith('.js') ? 'application/javascript' : 'text/html', body: served(f) }));
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => { hits.satjs++; return cur.blockSatjs ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }); });
  await ctx.route('**/space-track.org/**', r => { hits.spacetrack++; return r.abort(); });
  await ctx.route('**/celestrak.org/**', r => { hits.celestrak++; return r.abort(); });
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
  await ctx.route(HUB + '/**', route => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/snapshot/orbital') { hits.meta++; return cur.metaStatus !== 200 ? route.fulfill({ status: cur.metaStatus, contentType: 'application/json', body: '{"error":"no snapshot yet"}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cur.meta) }); }
    if (p === '/elements/orbital') { hits.csv++; return route.fulfill({ status: 200, contentType: 'text/csv', body: cur.csvBody, headers: cur.csvHeader ? { 'X-Elements-SHA256': cur.csvHeader, 'Access-Control-Expose-Headers': 'X-Elements-SHA256' } : {} }); }
    if (p === '/status') { hits.status++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ last_runs: [cur.lastRun] }) }); }
    if (p === '/snapshot/satellites' || p === '/elements/satellites') { hits.satOld = (hits.satOld || 0) + 1; return route.fulfill({ status: 404, body: '{}' }); }
    const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) }
      : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
      : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await ctx.newPage();
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.orbState && ME.pairState, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  return { ctx, page, perr, hits, cur };
}
const st = page => page.evaluate(() => ME.orbState());
const btn = g => `#orb-tgls [data-g="${g}"]`;
async function turn(page, g, on, timeout = 90000) {
  await page.click(btn(g));
  if (on) await page.waitForFunction(g => { const s = ME.orbState(); return (s.on.includes(g) && s.last[g]) || (!s.busy && s.why); }, g, { timeout });
  else await page.waitForFunction(g => !ME.orbState().on.includes(g), g, { timeout: 5000 });
  await page.waitForTimeout(150);
  return st(page);
}
const waitPassAll = (page, groups) => page.waitForFunction(gs => { const s = ME.orbState(); return gs.every(g => s.last[g] && s.last[g].at === s.at); }, groups, { timeout: 30000 });

// Independent reference in Node: per group, what ONE pass at time `at` should report.
const REFS = {};
function reference(at) {
  if (REFS[at]) return REFS[at];
  const L = CSV.trim().split('\n'); const h = L[0].split(','); const iC = h.indexOf('CLASS');
  const NUM = new Set(['MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'EPHEMERIS_TYPE', 'NORAD_CAT_ID', 'ELEMENT_SET_NO', 'REV_AT_EPOCH', 'BSTAR', 'MEAN_MOTION_DOT', 'MEAN_MOTION_DDOT']);
  const t = Date.parse(at), d = new Date(t), gm = satellite.gstime(d), out = {};
  for (let i = 1; i < L.length; i++) {
    const c = L[i].split(','); const g = GROUP_OF[c[iC]]; if (!g) continue;
    const r = out[g] || (out[g] = { rows: 0, drawn: 0, stale: 0, beyond: 0, first: null }); r.rows++;
    const o = {}; h.forEach((k, j) => { if (k !== 'CLASS') o[k] = NUM.has(k) ? +c[j] : c[j]; });
    // Same definition as the page's worker: stale is counted over objects whose elements initialise (an init failure is
    // counted as failed, never as stale). Counting all rows made this suite pass only while no init-failed object was
    // past 3 days — i.e. only near the fixture's 3 Nov reference instant (found 5 Nov, thread 15).
    let p = null; try { const s = satellite.json2satrec(o); if (s && !s.error) { if (t - Date.parse(o.EPOCH + 'Z') > 3 * 86400e3) r.stale++; const pv = satellite.propagate(s, d); p = pv && pv.position; } } catch (_) { }
    if (!p || typeof p !== 'object' || !isFinite(p.x)) continue;
    const q = satellite.eciToGeodetic(p, gm); r.drawn++; if (q.height > 35786) r.beyond++;
    if (!r.first) r.first = { lat: q.latitude * 180 / Math.PI, lng: q.longitude * 180 / Math.PI, alt: q.height / 6371 };
  }
  return REFS[at] = out;
}
const close = (a, b) => a && b && a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);

(async () => {
  console.log(BREAK ? `== BREAK=${BREAK} (this run must FAIL) ==` : '== orbital browser suite ==');
  ok('fixture is the real class mix', JSON.stringify([META.counts.payload_status_unavailable, META.counts.rocket_body, META.counts.debris, META.counts.unknown_type]) === '[18954,2205,10118,1232]' && META.elements.rows === 32509 && sha(CSV) === META.elements.sha256, META.counts);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ---------------------------------------------------------------- A. the normal path
  {
    const { ctx, page, perr, hits } = await harness(browser);
    let s = await st(page);
    const labels = await page.$$eval('#orb-tgls [data-g]', bs => bs.map(b => [b.dataset.g, b.textContent.trim(), b.getAttribute('aria-checked')]));
    ok('A1 three toggles while status is pending: Payloads · Rocket bodies · Debris, all off', JSON.stringify(labels) === JSON.stringify([['payload', 'Payloads', 'false'], ['rocket_body', 'Rocket bodies', 'false'], ['debris', 'Debris', 'false']]), labels);
    ok('A1 fresh load: no layer, no worker, no timers', !s.on.length && !Object.keys(s.layers).length && !s.worker && !s.timer && !s.metaTimer, s);
    ok('A1 fresh load: zero orbital requests (meta, status, CSV, orbit library)', hits.meta === 0 && hits.csv === 0 && hits.status === 0 && hits.satjs === 0 && s.requests === 0, hits);
    ok('A1 fresh load: no lines, no legend', await page.locator('#orb-lines').isHidden() && await page.locator('#orb-legend').isHidden());
    ok('A1 the old Satellites toggle is gone and its hub files are never read', await page.locator('#tgl-sat').count() === 0 && !hits.satOld, hits);
    const pairBefore = await page.evaluate(() => JSON.stringify(ME.pairState()));

    // each toggle alone
    for (const g of ['payload', 'rocket_body', 'debris']) {
      s = await turn(page, g, true); mark(g + ' on');
      const others = ['payload', 'rocket_body', 'debris'].filter(x => x !== g);
      const ref = reference(s.last[g].at)[g];
      ok(`B ${g} alone: on, visible, timers running`, s.on.join() === g && s.layers[g].visible && s.timer && s.metaTimer, s);
      ok(`B ${g} alone: the other two hidden with nothing drawn`, others.every(x => s.layers[x].visible === false && s.layers[x].drawRange === 0), s.layers);
      ok(`B ${g} alone: only its own pass exists`, Object.keys(s.last).join() === g, Object.keys(s.last));
      ok(`B ${g} alone: the worker computed only this group (no work for layers that are off)`, s.passGroups.join() === g, s.passGroups);
      ok(`B ${g} alone: rows = meta count for the group (${META_COUNT[g]})`, s.last[g].rows === META_COUNT[g], s.last[g]);
      ok(`B ${g} alone: drawn = meta count − propagation failures (independent reference, same instant)`, s.last[g].drawn === ref.drawn && s.layers[g].drawRange === ref.drawn && s.last[g].rows - s.last[g].failed === ref.drawn, { page: s.last[g], ref });
      ok(`B ${g} alone: stale and beyond-GEO counts match the reference`, s.last[g].stale === ref.stale && s.last[g].beyond === ref.beyond, { page: s.last[g], ref });
      const v0 = await page.evaluate(g => ME.orbVertex(g, 0), g), c0 = await page.evaluate(f => { const c = ME.coordsAt(f.lat, f.lng, f.alt); return [c.x, c.y, c.z]; }, ref.first);
      ok(`B ${g} alone: first marker sits where globe.gl places the reference position`, close(v0, c0), { v0, c0 });
      ok(`B ${g} alone: one visible particle object of three`, s.particleObjects.n === 3 && s.particleObjects.v === 1, s.particleObjects);
      const txt = await page.locator('#orb-lines').innerText();
      const label = { payload: 'Payloads', rocket_body: 'Rocket bodies', debris: 'Debris' }[g];
      ok(`B ${g} alone: its line is shown, the others' are not`, txt.includes(`${label}: ${META_COUNT[g].toLocaleString('en-US')} in the file`) && others.every(x => !txt.includes({ payload: 'Payloads:', rocket_body: 'Rocket bodies:', debris: 'Debris:' }[x])), txt.slice(0, 400));
      const lgt = await page.locator('#orb-legend').innerText(), LBL = { payload: 'Payloads', rocket_body: 'Rocket bodies', debris: 'Debris' };
      ok(`B ${g} alone: legend names only this layer`, lgt.includes(label) && others.every(x => !lgt.includes(LBL[x])), lgt);
      s = await turn(page, g, false);
      ok(`B ${g} off: hidden, nothing drawn, timers stopped, objects kept`, !s.on.length && s.layers[g].visible === false && s.layers[g].drawRange === 0 && !s.timer && !s.metaTimer && s.particleObjects.n === 3 && s.particleObjects.v === 0, s);
    }
    ok('B the element file was read ONCE for all three toggles', hits.csv === 1 && hits.meta === 1, hits);
    ok('B Space-Track and CelesTrak never contacted', hits.spacetrack === 0 && hits.celestrak === 0, hits);
    const txtAll = await (async () => { await turn(page, 'payload', true); return page.locator('#orb-lines').innerText(); })();
    ok('B disclosures shown: computed not observed, not to scale, completeness unverified, counted-not-drawn, size floor', /not observed/.test(txtAll) && /not to physical scale/.test(txtAll) && /Completeness unverified/.test(txtAll) && /1,232 objects are counted but not drawn/.test(txtAll) && /ESA Space Environment Report 2025/.test(txtAll), txtAll);
    ok('B status pending: no payload is called active or inactive', !/\bActive satellites\b|\bInactive satellites\b/.test(txtAll) && /not established/.test(txtAll), txtAll);
    ok('B colours: each layer its own', await page.evaluate(() => { const l = ME.orbState().layers; return new Set(Object.values(l).map(x => x.colour)).size === 3; }));

    // combinations
    s = await turn(page, 'debris', true); await waitPassAll(page, ['payload', 'debris']); s = await st(page);
    ok('C payloads + debris: both visible, rocket bodies hidden', s.layers.payload.visible && s.layers.debris.visible && !s.layers.rocket_body.visible && s.layers.rocket_body.drawRange === 0 && s.particleObjects.v === 2, s.layers);
    ok('C payloads + debris: each layer drawn from its own group', s.layers.payload.drawRange === reference(s.last.payload.at).payload.drawn && s.layers.debris.drawRange === reference(s.last.debris.at).debris.drawn, s.last);
    s = await turn(page, 'payload', false); await page.waitForTimeout(2600); s = await st(page);
    ok('C payloads off while debris stays: debris keeps updating, payloads stay hidden', s.on.join() === 'debris' && s.layers.debris.visible && !s.layers.payload.visible && s.layers.payload.drawRange === 0 && s.timer && !s.last.payload, s);
    // race: a pass is already in flight when a layer is switched off — that pass must not re-show it
    s = await turn(page, 'payload', true); await waitPassAll(page, ['payload', 'debris']);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); document.querySelector('#orb-tgls [data-g="payload"]').click(); });
      await page.waitForTimeout(1200); s = await st(page);
      ok(`C race ${i + 1}: payloads switched off while their pass was in flight stay hidden`, !s.on.includes('payload') && !s.layers.payload.visible && s.layers.payload.drawRange === 0 && s.particleObjects.v === 1, { on: s.on, layers: s.layers });
      if (i < 4) { s = await turn(page, 'payload', true); }
    }
    s = await turn(page, 'rocket_body', true);
    ok('C rocket bodies + debris', s.layers.rocket_body.visible && s.layers.debris.visible && !s.layers.payload.visible && s.particleObjects.v === 2, s.layers);
    s = await turn(page, 'payload', true); await waitPassAll(page, ['payload', 'rocket_body', 'debris']); s = await st(page);
    const refAll = reference(s.at);
    ok('D all three on: three visible objects, each = its group', s.particleObjects.v === 3 && ['payload', 'rocket_body', 'debris'].every(g => s.layers[g].visible && s.layers[g].drawRange === refAll[g].drawn), { layers: s.layers, ref: Object.fromEntries(Object.entries(refAll).map(([k, v]) => [k, v.drawn])) });
    ok('D all three on: drawn + not drawn + counted-not-drawn = rows in the file', ['payload', 'rocket_body', 'debris'].reduce((a, g) => a + s.last[g].rows, 0) + META.counts.unknown_type === META.elements.rows);
    ok('D all three on: one pass time across the three layers', ['payload', 'rocket_body', 'debris'].every(g => s.last[g].at === s.at));
    ok('D the observation layers are untouched by the orbital layers', await page.evaluate(() => JSON.stringify(ME.pairState())) === pairBefore);
    const t1 = (await st(page)).seq; await page.waitForTimeout(4500);
    ok('D ~2 s cadence while on', (await st(page)).seq - t1 >= 2, { t1, t2: (await st(page)).seq });

    // hidden tab
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const h0 = await st(page); await page.waitForTimeout(4500); const h1 = await st(page);
    ok('E hidden tab: no propagation while hidden', h1.seq === h0.seq && h1.hiddenSkips > h0.hiddenSkips, { h0: h0.seq, h1: h1.seq });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(500);
    ok('E back in view: recomputes immediately', (await st(page)).seq > h1.seq);

    // all off
    for (const g of ['payload', 'rocket_body', 'debris']) await turn(page, g, false);
    const off0 = await st(page); const req0 = { ...hits }; await page.waitForTimeout(5000); const off1 = await st(page);
    ok('F all off: nothing visible, timers stopped, objects kept', off1.particleObjects.v === 0 && off1.particleObjects.n === 3 && !off1.timer && !off1.metaTimer && Object.values(off1.layers).every(l => !l.visible && l.drawRange === 0), off1);
    ok('F all off: no propagation and no requests afterwards', off1.seq === off0.seq && JSON.stringify(hits) === JSON.stringify(req0) && !off1.inflight, { s0: off0.seq, s1: off1.seq, hits, req0 });
    ok('F all off: legend and lines gone', await page.locator('#orb-legend').isHidden() && await page.locator('#orb-lines').isHidden());

    // rapid toggling
    for (let i = 0; i < 20; i++) { await page.click(btn(['payload', 'rocket_body', 'debris'][i % 3])); await page.waitForTimeout(60); }
    await page.waitForFunction(() => !ME.orbState().busy, null, { timeout: 10000 }); await page.waitForTimeout(2500);
    let r = await st(page);
    ok('G 20 rapid toggles: still exactly three particle objects; visible = toggles on', r.particleObjects.n === 3 && r.particleObjects.v === r.on.length && Object.entries(r.layers).every(([g, l]) => l.visible === r.on.includes(g)), r);
    for (const g of [...r.on]) await turn(page, g, false);
    r = await st(page);
    ok('G after rapid toggles, all off: timers stopped, CSV not re-read', !r.timer && r.particleObjects.v === 0 && hits.csv === 1, { r, hits });
    ok('A page errors: none', perr.length === 0, perr);

    // reload
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.orbState); await page.waitForTimeout(800);
    const rl = await st(page);
    const lbl = await page.$$eval('#orb-tgls [data-g]', bs => bs.map(b => b.getAttribute('aria-checked')));
    ok('H reload: all off, no worker, no layers, no new orbital requests', lbl.every(x => x === 'false') && !rl.worker && !Object.keys(rl.layers).length && rl.requests === 0 && hits.csv === 1, { lbl, rl, hits });
    await ctx.close();
  }

  // ---------------------------------------------------------------- I. failure paths: toggle resets, reason shown, nothing else touched
  const failures = [
    ['hub 404 (no file yet)', { metaStatus: 404 }, /no orbital element file yet/],
    ['hub 500', { metaStatus: 500 }, /did not answer \(HTTP 500\)/],
    ['checksum mismatch (body altered)', { csvBody: CSV.replace(/\n(.)/, '\nX$1') }, /does not match its published checksum/],
    ['checksum header differs', { csvHeader: 'b'.repeat(64) }, /checksum header differs/],
    ['meta counts do not add up', { meta: { ...META, counts: { ...META.counts, debris: 1 } } }, /counts do not add up/],
    ['orbit library blocked (worker error)', { blockSatjs: true }, /orbit library could not be loaded/],
  ];
  for (const [name, orbital, re] of failures) {
    const { ctx, page, perr, hits } = await harness(browser, { orbital });
    const pairBefore = await page.evaluate(() => JSON.stringify(ME.pairState()));
    const s = await turn(page, 'debris', true, 60000);
    ok(`I ${name}: toggle reset, every orbital layer off`, !s.on.length && !s.busy && !s.timer && Object.values(s.layers).every(l => !l.visible), s);
    ok(`I ${name}: plain reason shown`, re.test(s.why || '') && re.test(await page.locator('#orb-lines').innerText()), s.why);
    ok(`I ${name}: observation layers untouched`, await page.evaluate(() => JSON.stringify(ME.pairState())) === pairBefore);
    ok(`I ${name}: buttons all report off`, (await page.$$eval('#orb-tgls [data-g]', bs => bs.map(b => b.getAttribute('aria-checked')))).every(x => x === 'false'));
    ok(`I ${name}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }

  // ---------------------------------------------------------------- J. refresh failed: previous file shown with its own time, failure stated
  {
    const { ctx, page } = await harness(browser, { orbital: { lastRun: { layer: 'orbital', started_at: '2026-11-03T15:41:04.000Z', status: 'down', note: 'GP HTTP 500' } } });
    await turn(page, 'rocket_body', true);
    const txt = await page.locator('#orb-lines').innerText();
    ok('J refresh failed: says so, and keeps the original retrieval time', /Latest refresh 2026-11-03 15:41 UTC failed \(down\); showing the previous file, retrieved 2026-11-03 13:42 UTC/.test(txt), txt.slice(0, 300));
    ok('J refresh failed: the layer still draws', (await st(page)).layers.rocket_body.visible);
    await ctx.close();
  }

  // ---------------------------------------------------------------- K. phone width
  {
    const { ctx, page } = await harness(browser, { viewport: { width: 390, height: 844 }, isMobile: true });
    const sheet = page.locator('#sheet-btn'); if (await sheet.count() && await sheet.getAttribute('aria-expanded') === 'false') await sheet.click();
    await page.locator(btn('debris')).scrollIntoViewIfNeeded();
    const h = await page.$$eval('#orb-tgls [data-g]', bs => bs.map(b => b.getBoundingClientRect().height));
    ok('K phone: three toggles, each ≥ 44 px tall', h.length === 3 && h.every(x => x >= 44), h);
    await turn(page, 'debris', true);
    ok('K phone: legend line visible with the layer on', await page.locator((await page.locator('#ps-orb').count()) ? '#ps-orb' : '#orb-legend').isVisible());   // mobile pass: the persistent line beside the closed Key
    ok('K phone: no horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await ctx.close();
  }

  await browser.close(); clearTimeout(watchdog);
  console.log(`\n${pass} passed, ${fail} failed${BREAK ? `  (BREAK=${BREAK})` : ''}  · ${((Date.now() - T0) / 1000).toFixed(0)} s`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness error:', e); process.exit(1); });
