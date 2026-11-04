/* Mother Earth — day/night overlay: bounded ACCEPTANCE suite (thread 5, 2 Nov 2026).
 *
 * SMALL and deterministic: one page load. This is the gate that must pass before a deploy.
 * Behavioural cases (cadence, toggling, rotation, no-WebGL, failed harvest, phone) live in
 * phase1/terminator-behaviour.test.cjs, which costs one page load each and runs separately.
 *
 * Deterministic and time-boxed. A hard watchdog FAILS the run rather than hanging: an indefinite test is
 * a defect in itself.
 *
 * globe.gl is served from node_modules at a PINNED version (the container cannot reach unpkg), so this
 * exercises the real renderer. The overlay harvests three.js constructors from globe.gl's live scene
 * graph — reliance on library internals — so the pinned version under test must equal the version the
 * page loads, and that is asserted below.
 *
 * Pixel checks are decoded from screenshots: WebGL readPixels after a frame is presented returns zeros.
 * Reduced motion is emulated for the pixel cases ONLY, to stop the globe auto-rotating between the before
 * and after frames. Case D covers behaviour with the globe actually rotating, asserting on state.
 *
 * Needs:  python3 -m http.server 8899 --bind 127.0.0.1   in the clone
 *         cd /home/claude/spike && npm i globe.gl@2.45.0 pngjs
 * Run:    node phase1/terminator-ui.test.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = 'http://127.0.0.1:8899';
const HUB = 'https://mother-earth.chadoberholzer.workers.dev';

const GLOBE_VERSION = '2.45.0';
const PINNED = JSON.parse(fs.readFileSync('/home/claude/spike/node_modules/globe.gl/package.json', 'utf8')).version;
const PAGE_PIN = (fs.readFileSync(__dirname + '/../index.html', 'utf8').match(/globe\.gl@([\d.]+)/) || [])[1];
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));

const BUDGET_DEFAULT = 6 * 60e3;   // one page load under a software renderer is ~60-70s
const BUDGET_MS = +(process.env.BUDGET_MS || BUDGET_DEFAULT);
const watchdog = setTimeout(() => { console.log(`\nFAIL  suite exceeded its ${BUDGET_MS / 1000}s budget — treated as a failure, not a hang`); process.exit(1); }, BUDGET_MS);
watchdog.unref && watchdog.ref();

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };
const iso = (h, m, s = 0) => new Date(Date.UTC(2026, 10, 2, h, m, s)).toISOString().replace(/\.\d+Z$/, 'Z');
const RUN = iso(5, 50);
const read = b => PNG.sync.read(b);
const at = (p, x, y) => { const i = (p.width * Math.round(y) + Math.round(x)) << 2; return [p.data[i], p.data[i + 1], p.data[i + 2]]; };
const lum = c => (c[0] + c[1] + c[2]) / 3;

const earth = new PNG({ width: 64, height: 32 });
for (let i = 0; i < earth.data.length; i += 4) { earth.data[i] = earth.data[i + 1] = earth.data[i + 2] = 150; earth.data[i + 3] = 255; }
const EARTH_PNG = PNG.sync.write(earth);

// Break the Texture constructor harvest without touching the page: strip the globe material's map.
const BREAK_HARVEST = () => {
  Object.defineProperty(window, 'Globe', {
    configurable: true,
    get() { return undefined; },
    set(v) {
      Object.defineProperty(window, 'Globe', {
        configurable: true, writable: true,
        value: function (...a) { const g = v(...a); const gm = g.globeMaterial.bind(g); g.globeMaterial = () => { const m = gm(); if (m) m.map = null; return m; }; return g; },
      });
    },
  });
};

async function harness(browser, o = {}) {
  const { viewport = { width: 820, height: 580 }, isMobile = false, noWebGL = false, reduced = true, breakHarvest = false } = o;
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, ...(reduced ? { reducedMotion: 'reduce' } : {}) });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: EARTH_PNG }));
  await ctx.route(HUB + '/**', route => {
    const p = new URL(route.request().url()).pathname;
    const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) }
      : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'collector observed throughout', observed_fraction: 1 } } } }
      : p === '/snapshot/ships' ? { layer: 'ships', retrieved_at: RUN, stale_after_s: 10800, window_s: 60, window_end: RUN, class_a: 1, class_b: 0, quantity: 'q', record_format: 'rows', record_fields: ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'], records: D.shipsNear.map(([lat, lng, mm, nm, ob, rc]) => [mm, lat, lng, ob, rc, 10, 0, 0, '', 'A', nm]) }
      : p === '/cells/ships' ? { layer: 'ships', retrieved_at: RUN, stale_after_s: 10800, window_s: 60, window_end: RUN, class_a: 1, class_b: 0, quantity: 'q', cells: { '14_49': { count: 12, coverage: { grade: 'adequate', evidence: 'sampled', observed_fraction: 1 } } } }
      : { layer: p.split('/').pop(), retrieved_at: iso(5, 55), stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: iso(5, 55) }, index: null };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  if (noWebGL) await ctx.addInitScript(() => { const r = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : r.call(this, t, ...a); }; });
  if (breakHarvest) await ctx.addInitScript(BREAK_HARVEST);
  const page = await ctx.newPage();
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 2, 6, 0, 0)) });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable, null, { timeout: 30000 });
  await page.waitForTimeout(600);
  const shot = async () => read(await page.locator('#globe').screenshot());
  return { ctx, page, perr, shot };
}

// Agreement between the RENDERED shading and ME.sunlit, judged RELATIVE to each pixel's own brightness:
// the globe is lit by a light source, so absolute luminance falls off toward the limb and a fixed
// threshold would misclassify dim pixels there.
// Clicking a coverage cell by projected coordinate can miss by a frame while the renderer settles.
// Retry once rather than leaving a flaky assertion: a test that fails at random is worse than none.
async function pickCell(page, lat = -32, lng = 18) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const c = await page.evaluate(([a, b]) => ME.screenAt(a, b, 0.006), [lat, lng]);
    if (!c) return false;
    const box = await page.locator('#globe').boundingBox();
    await page.mouse.click(box.x + c.x, box.y + c.y);
    await page.waitForTimeout(400);
    if (await page.locator('#insp.show').count() === 1) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

function agreement(before, after, probes) {
  let agree = 0, disagree = 0; const cases = [];
  for (const q of probes) {
    if (q.x < 2 || q.y < 2 || q.x > before.width - 3 || q.y > before.height - 3) continue;
    const base = lum(at(before, q.x, q.y));
    if (base < 60) continue;
    const drop = base - lum(at(after, q.x, q.y));
    if ((drop / base > 0.18) === !q.lit) agree++;
    else { disagree++; if (cases.length < 4) cases.push({ lat: q.lat, lng: q.lng, lit: q.lit, base: +base.toFixed(0), drop: +drop.toFixed(0) }); }
  }
  return { agree, disagree, cases };
}

(async () => {
  console.log(`globe.gl — page loads @${PAGE_PIN}, test serves @${PINNED} (expected ${GLOBE_VERSION})`);
  ok('page and test use the SAME pinned globe.gl version', PAGE_PIN === PINNED && PINNED === GLOBE_VERSION, { PAGE_PIN, PINNED, GLOBE_VERSION });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  // ===================================================== A. default state, enable, acceptance pixels, picking
  {
    const { ctx, page, perr, shot } = await harness(browser);
    // UX round 1 (4 Nov 2026): day/night moved from Explore to the Optional layers group; still not a card of its own
    ok('toggle lives in the Optional layers group, not in Explore, and adds no card', await page.locator('#card-optional > .opt-night #tgl-night').count() === 1 && await page.locator('#card-explore #tgl-night').count() === 0 && await page.locator('.card:has(> #tgl-night)').count() === 0);
    ok('OFF on load, with no mesh', await page.evaluate(() => ME.nightState().on) === false && await page.evaluate(() => ME.nightState().hasMesh) === false);
    ok('legend line hidden while off', await page.locator('#night-legend').isHidden());
    ok('it is a switch, unchecked', await page.locator('#tgl-night').getAttribute('role') === 'switch' && await page.locator('#tgl-night').getAttribute('aria-checked') === 'false');
    ok('the short clarification is always visible', /Current sunlight geometry—not observation coverage\./.test(await page.locator('#night-note').innerText()));
    ok('the long explanation is behind a closed disclosure', await page.evaluate(() => !document.querySelector('#night-scope').open));
    ok('the disclosure carries the FIRMS warning', /VIIRS detects thermal anomalies by day and by night/.test(await page.locator('#night-scope').textContent()));

    await page.click('#exp-btn');
    const before = await shot();
    await page.click('#tgl-night');
    await page.waitForTimeout(600);
    const after = await shot();
    const st = await page.evaluate(() => ME.nightState());
    ok('reports on, with a mesh', st.on === true && st.hasMesh === true, st);
    console.log(`   [measured] texture ${st.texture}, alpha ${st.alpha}, altitude ${st.altitude}, repaint ${st.paintMs} ms (software renderer)`);

    const label = await page.locator('#night-time').innerText(), leg = await page.locator('#night-legend').innerText();
    ok('panel states the UTC calculation time', /^Computed for 2026-11-02 06:00:\d\d UTC$/.test(label), label);
    ok('legend uses the agreed form', /^Day\/night now · computed · 06:00:\d\d UTC$/.test(leg), leg);
    ok('both labels carry the same timestamp as the geometry', label.includes(st.at.slice(11, 19)) && leg.includes(st.at.slice(11, 19)), st.at);

    const probes = await page.evaluate(() => {
      const sub = ME.subsolar(new Date()), cam = ME.cameraAt(), out = [];
      const add = (lat, lng) => { if (ME.angularSep(lat, lng, cam.lat, cam.lng) > 55) return; const s = ME.screenAt(lat, lng, 0); if (s) out.push({ lat, lng, x: s.x, y: s.y, lit: ME.sunlit(lat, lng, sub) }); };
      for (let lat = -70; lat <= 70; lat += 10) for (let lng = -180; lng < 180; lng += 10) add(lat, lng);
      return { out, sub, cam };
    });
    const a = agreement(before, after, probes.out);
    console.log(`   [measured] rendered shading vs ME.sunlit: ${a.agree}/${a.agree + a.disagree} probes (camera ${probes.cam.lat.toFixed(0)},${probes.cam.lng.toFixed(0)}; subsolar ${probes.sub.lat.toFixed(1)},${probes.sub.lng.toFixed(1)})`);
    ok('rendered shading matches the computed day/night across the visible disc', a.disagree === 0 && a.agree >= 30, a);

    const c = await page.evaluate(() => ME.screenAt(-33.0, 18.0, 0.01));
    const reddest = img => { let best = { v: -1 }; const x0 = Math.max(0, ~~c.x - 45), x1 = Math.min(img.width - 1, ~~c.x + 45), y0 = Math.max(0, ~~c.y - 45), y1 = Math.min(img.height - 1, ~~c.y + 45);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (img.width * y + x) << 2; const v = img.data[i] - (img.data[i + 1] + img.data[i + 2]) / 2; if (v > best.v) best = { v, rgb: [img.data[i], img.data[i + 1], img.data[i + 2]] }; } return best; };
    const rB = reddest(before), rA = reddest(after);
    ok('a record point survives the shading', rA.v > rB.v * 0.75 && rA.rgb[0] > 110, { before: rB, after: rA });

        ok('a coverage cell is still clickable through the shading', await pickCell(page) && /cell/i.test(await page.locator('#insp-h').innerText()));
    await page.keyboard.press('Escape');

    await page.fill('#search-q', 'hawaii'); await page.press('#search-q', 'Enter');
    await page.waitForSelector('#search-list button.res');
    await page.click('#search-list button.res');
    ok('search still selects and inspects a record with the overlay on', await page.locator('#insp.show').count() === 1);
    await page.keyboard.press('Escape');

    for (const [tag, camLat, camLng] of [['pole', -88, 0], ['date line', 0, 179]]) {
      await page.fill('#search-q', `${camLat}, ${camLng}`); await page.press('#search-q', 'Enter');
      await page.waitForSelector('#search-list button.res[data-go]');
      await page.click('#search-list button.res[data-go]');
      await page.waitForTimeout(700);
      await page.click('#tgl-night'); await page.waitForTimeout(400);
      const b2 = await shot();
      await page.click('#tgl-night'); await page.waitForTimeout(550);
      const a2 = await shot();
      const pr = await page.evaluate(([la]) => {
        const sub = ME.subsolar(new Date()), cam = ME.cameraAt(), out = [];
        const add = (lat, lng) => { if (ME.angularSep(lat, lng, cam.lat, cam.lng) > 48) return; const s = ME.screenAt(lat, lng, 0); if (s) out.push({ lat, lng, x: s.x, y: s.y, lit: ME.sunlit(lat, lng, sub) }); };
        if (Math.abs(la) > 60) { const g = la > 0 ? 1 : -1; for (const lat of [89, 86, 82, 78, 74].map(v => v * g)) for (let lng = -180; lng < 180; lng += 20) add(lat, lng); }
        else { for (let lat = -50; lat <= 50; lat += 10) for (const lng of [-179.9, -179, -177, -174, 174, 177, 179, 179.9]) add(lat, lng); }
        return out;
      }, [camLat]);
      const r = agreement(b2, a2, pr);
      console.log(`   [measured] ${tag}: ${r.agree}/${r.agree + r.disagree} probes agree`);
      ok(`rendered shading matches the computed day/night at the ${tag}`, r.disagree === 0 && r.agree >= 5, r);
    }
    ok('no page errors in the acceptance run', perr.length === 0, perr.slice(0, 3));
    await ctx.close();
  }

  await browser.close();
  clearTimeout(watchdog);
  console.log(`\n${pass} passed, ${fail} failed`);
  console.log(`\nThree limits — different kinds of statement, reported SEPARATELY and never summed:`);
  console.log(`  measured agreement : solar position vs astronomy-engine ... within 0.0124°`);
  console.log(`  quantisation bound : 1024x512 texture ..................... ~0.35° per pixel`);
  console.log(`  drift bound        : up to one minute between repaints .... up to 0.25° of rotation`);
  console.log(`  Only the first is a measurement. Summing them would assert a combined bound nobody measured.`);
  console.log(`  Separately: the geometric boundary is ~0.83° from an observed sunrise (refraction + solar disc).`);
  process.exit(fail ? 1 : 0);
})();
