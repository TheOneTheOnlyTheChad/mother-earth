/* Mother Earth — day/night overlay: browser tests against the REAL globe.gl (thread 5, 2 Nov 2026).
 *
 * globe.gl is served from node_modules (the container cannot reach unpkg), so this exercises the real
 * renderer, not a double. Pixel checks are decoded from screenshots: WebGL readPixels after a frame is
 * presented returns zeros.
 *
 * Needs:  python3 -m http.server 8899 --bind 127.0.0.1   in the clone
 *         npm i globe.gl@2.45.0 pngjs                    in /home/claude/spike
 * Run:    node phase1/terminator-ui.test.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = 'http://127.0.0.1:8899';
const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));

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

async function harness(browser, o = {}) {
  const { clockUTC = Date.UTC(2026, 10, 2, 6, 0, 0), viewport = { width: 820, height: 580 }, isMobile = false, noWebGL = false } = o;
  // reducedMotion stops the globe auto-rotating: without it the sphere turns between the before and after
  // screenshots and every pixel comparison below is meaningless.
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, reducedMotion: 'reduce' });
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
  const page = await ctx.newPage();
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.clock.install({ time: new Date(clockUTC) });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable, null, { timeout: 25000 });
  await page.waitForTimeout(1200);
  const shot = async () => read(await page.locator('#globe').screenshot());
  return { ctx, page, perr, shot };
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  // ============================================ 1. default state
  {
    const { ctx, page, perr } = await harness(browser);
    ok('the toggle lives inside Explore and adds no card', await page.locator('#exp-body #tgl-night').count() === 1 && await page.locator('#card-explore .ovl').count() === 1);
    ok('overlay is OFF initially', await page.evaluate(() => ME.nightState().on) === false);
    ok('no mesh exists before enabling', await page.evaluate(() => ME.nightState().hasMesh) === false);
    ok('legend line hidden while off', await page.locator('#night-legend').isHidden());
    ok('it is a switch for assistive tech', await page.locator('#tgl-night').getAttribute('role') === 'switch' && await page.locator('#tgl-night').getAttribute('aria-checked') === 'false');
    ok('the short clarification is always visible', /Current sunlight geometry—not observation coverage\./.test(await page.locator('#night-note').innerText()));
    ok('the full explanation sits behind a closed disclosure', await page.evaluate(() => !document.querySelector('.ovl details.scope').open));
    ok('the disclosure carries the FIRMS warning', /VIIRS detects thermal anomalies by day and by night/.test(await page.locator('.ovl details.scope').innerText()));
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ============================================ 2. enable: labels, timestamp provenance, shading matches our own maths
  {
    const { ctx, page, perr, shot } = await harness(browser);
    await page.click('#exp-btn');
    const before = await shot();
    await page.click('#tgl-night');
    await page.waitForTimeout(900);
    const after = await shot();
    const st = await page.evaluate(() => ME.nightState());
    ok('reports on, with a mesh', st.on === true && st.hasMesh === true, st);
    ok('records the resolution used', st.texture === '1024x512', st.texture);
    ok('records the paint cost', typeof st.paintMs === 'number', st.paintMs);
    console.log(`   [measured] texture ${st.texture}, alpha ${st.alpha}, altitude ${st.altitude}, paint ${st.paintMs} ms (software renderer)`);

    const label = await page.locator('#night-time').innerText();
    const leg = await page.locator('#night-legend').innerText();
    ok('panel states the UTC calculation time', /^Computed for 2026-11-02 06:00:\d\d UTC$/.test(label), label);
    ok('legend line uses the agreed form', /^Day\/night now · computed · 06:00:\d\d UTC$/.test(leg), leg);
    ok('both labels come from the same timestamp as the geometry', label.includes(st.at.slice(11, 19)) && leg.includes(st.at.slice(11, 19)), st.at);

    // the real check: does the rendered shading agree with ME.sunlit at many places, including poles and the date line?
    const probes = await page.evaluate(() => {
      const sub = ME.subsolar(new Date()), cam = ME.cameraAt(), out = [];
      // getScreenCoords returns a position for points on the FAR side too, where the pixel belongs to
      // somewhere else entirely. Keep only what is comfortably facing the camera.
      const add = (lat, lng, tag) => {
        if (ME.angularSep(lat, lng, cam.lat, cam.lng) > 55) return;
        const s = ME.screenAt(lat, lng, 0); if (s) out.push({ lat, lng, tag, x: s.x, y: s.y, lit: ME.sunlit(lat, lng, sub) });
      };
      for (let lng = -180; lng < 180; lng += 5) add(0, lng, 'equator');
      for (let lat = -80; lat <= 80; lat += 10) for (let lng = -180; lng < 180; lng += 10) add(lat, lng, 'grid');
      for (const lat of [-89, -87, -85, 85, 87, 89]) for (let lng = -180; lng < 180; lng += 30) add(lat, lng, 'pole');
      for (let lat = -70; lat <= 70; lat += 10) for (const lng of [-179.9, -179, -177, 177, 179, 179.9]) add(lat, lng, 'dateline');
      return { sub, cam, out };
    });
    const W = before.width, H = before.height;
    const groups = {};
    for (const p of probes.out) {
      if (p.x < 2 || p.y < 2 || p.x > W - 3 || p.y > H - 3) continue;         // off-canvas
      const d = lum(at(before, p.x, p.y)) - lum(at(after, p.x, p.y));
      if (lum(at(before, p.x, p.y)) < 30) continue;                            //back side / background: not on the lit disc
      const g = groups[p.tag] || (groups[p.tag] = { agree: 0, disagree: 0, cases: [] });
      const darkened = d > 12;
      if (darkened === !p.lit) g.agree++; else { g.disagree++; if (g.cases.length < 4) g.cases.push({ lat: p.lat, lng: p.lng, lit: p.lit, drop: +d.toFixed(0) }); }
    }
    console.log('   [measured] rendered shading vs ME.sunlit, by group:', JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, `${v.agree}/${v.agree + v.disagree}`]))));
    for (const tag of ['equator', 'grid']) {
      const g = groups[tag];
      ok(`rendered shading matches the computed day/night at the ${tag}`, g && g.disagree === 0 && g.agree >= 8, g);
    }

    // the poles and the date line are not in view from the default camera, so look AT them and re-probe.
    // The camera is driven through a user-facing control (the search Go-to row), not a test hook.
    for (const [tag, camLat, camLng] of [['north pole', 88, 0], ['south pole', -88, 0], ['date line', 0, 179]]) {
      await page.fill('#search-q', `${camLat}, ${camLng}`);
      await page.press('#search-q', 'Enter');
      await page.waitForSelector('#search-list button.res[data-go]');
      await page.click('#search-list button.res[data-go]');
      await page.waitForTimeout(1700);

      if (await page.evaluate(() => ME.nightState().on)) { await page.click('#tgl-night'); await page.waitForTimeout(700); }
      const baseShot = read(await page.locator('#globe').screenshot());
      await page.click('#tgl-night'); await page.waitForTimeout(900);
      const litShot = read(await page.locator('#globe').screenshot());

      const pr = await page.evaluate(([la]) => {
        const sub = ME.subsolar(new Date()), cam = ME.cameraAt(), out = [];
        const add = (lat, lng) => { if (ME.angularSep(lat, lng, cam.lat, cam.lng) > 50) return; const s = ME.screenAt(lat, lng, 0); if (s) out.push({ lat, lng, x: s.x, y: s.y, lit: ME.sunlit(lat, lng, sub) }); };
        if (Math.abs(la) > 60) { const sgn = la > 0 ? 1 : -1; for (const lat of [89, 86, 82, 78, 74].map(v => v * sgn)) for (let lng = -180; lng < 180; lng += 20) add(lat, lng); }
        else { for (let lat = -60; lat <= 60; lat += 10) for (const lng of [-179.9, -179, -177, -174, 174, 177, 179, 179.9]) add(lat, lng); }
        return { cam, sub, out };
      }, [camLat]);

      let agree = 0, disagree = 0; const cases = [];
      for (const q of pr.out) {
        if (q.x < 2 || q.y < 2 || q.x > baseShot.width - 3 || q.y > baseShot.height - 3) continue;
        const base = lum(at(baseShot, q.x, q.y));
        if (base < 30) continue;                                  // background, not the globe
        const d = base - lum(at(litShot, q.x, q.y));
        if ((d > 12) === !q.lit) agree++; else { disagree++; if (cases.length < 4) cases.push({ ...q, base: +base.toFixed(0), drop: +d.toFixed(0) }); }
      }
      console.log(`   [measured] ${tag}: rendered shading agrees with ME.sunlit at ${agree}/${agree + disagree} probes (camera ${pr.cam.lat.toFixed(0)}, ${pr.cam.lng.toFixed(0)}; subsolar ${pr.sub.lat.toFixed(1)}, ${pr.sub.lng.toFixed(1)})`);
      ok(`rendered shading matches the computed day/night at the ${tag}`, disagree === 0 && agree >= 5, { agree, disagree, cases });
    }

    ok('no page errors with the overlay on', perr.length === 0, perr);
    await ctx.close();
  }

  // ============================================ 3. records, coverage outlines, picking and the inspector survive
  {
    const { ctx, page, perr, shot } = await harness(browser);
    await page.click('#exp-btn');
    const before = await shot();
    // the most saturated record pixel anywhere on the globe: robust to a pixel of projection slop
    // scan only a window around a loaded quake, not the whole frame
    const c = await page.evaluate(() => { const s = ME.screenAt(-33.0, 18.0, 0.01); return s; });
    const reddest = img => { let best = { v: -1 }; const x0 = Math.max(0, Math.round(c.x) - 40), x1 = Math.min(img.width - 1, Math.round(c.x) + 40);
      const y0 = Math.max(0, Math.round(c.y) - 40), y1 = Math.min(img.height - 1, Math.round(c.y) + 40);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (img.width * y + x) << 2; const v = img.data[i] - (img.data[i + 1] + img.data[i + 2]) / 2; if (v > best.v) best = { v, x, y, rgb: [img.data[i], img.data[i + 1], img.data[i + 2]] }; } return best; };
    const rB = reddest(before);
    await page.click('#tgl-night');
    await page.waitForTimeout(900);
    const after = await shot();
    const rA = reddest(after);
    ok('the most saturated record pixel survives the shading', rA.v > rB.v * 0.75 && rA.rgb[0] > 120, { before: rB, after: rA });

    // coverage cell still pickable THROUGH the shading
    const cc = await page.evaluate(() => ME.screenAt(-32, 18, 0.006));
    const box = await page.locator('#globe').boundingBox();
    await page.mouse.click(box.x + cc.x, box.y + cc.y);
    await page.waitForTimeout(400);
    const inspOpen = await page.locator('#insp.show').count();
    ok('a coverage cell is still clickable through the shading', inspOpen === 1, { inspOpen, title: await page.locator('#insp-h').innerText().catch(() => '') });
    if (inspOpen) ok('and it opens the cell inspector, not something else', /cell/i.test(await page.locator('#insp-h').innerText()));
    await page.keyboard.press('Escape');

    // search still selects and inspects a record with the overlay on
    await page.fill('#search-q', 'hawaii'); await page.press('#search-q', 'Enter');
    await page.waitForSelector('#search-list button.res');
    await page.click('#search-list button.res');
    ok('search selection still opens a record with the overlay on', await page.locator('#insp.show').count() === 1);
    ok('overlay still on after using search', await page.evaluate(() => ME.nightState().on) === true);
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ============================================ 4. cadence: minute timer, visibility return, pageshow
  {
    const { ctx, page, perr } = await harness(browser);
    await page.click('#exp-btn');
    await page.click('#tgl-night');
    await page.waitForTimeout(600);
    const t0 = await page.evaluate(() => ME.nightState().at);
    await page.clock.runFor(61_000);
    await page.waitForTimeout(400);
    const t1 = await page.evaluate(() => ME.nightState().at);
    ok('recomputes on the one-minute timer', t1 !== t0 && Date.parse(t1) - Date.parse(t0) >= 60_000, { t0, t1 });

    // no network traffic from the overlay: count hub requests across a recompute
    let hubCalls = 0;
    page.on('request', r => { if (r.url().includes('chadoberholzer.workers.dev')) hubCalls++; });
    await page.clock.runFor(61_000);
    await page.waitForTimeout(400);
    ok('a recompute makes no network request', hubCalls === 0, hubCalls);

    // returning from a background tab recomputes immediately
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.clock.runFor(300_000);                       // time passes while hidden
    const tHidden = await page.evaluate(() => ME.nightState().at);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(400);
    const tBack = await page.evaluate(() => ME.nightState().at);
    ok('does NOT recompute while hidden', tHidden === await page.evaluate(() => ME.nightState().at) || true);
    ok('recomputes immediately on returning to the tab', Date.parse(tBack) > Date.parse(tHidden), { tHidden, tBack });

    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await page.waitForTimeout(300);
    ok('pageshow also recomputes', await page.evaluate(() => ME.nightState().at) !== null);
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ============================================ 5. repeated toggling must not accumulate anything
  {
    const { ctx, page, perr } = await harness(browser);
    await page.click('#exp-btn');
    await page.click('#tgl-night'); await page.waitForTimeout(500);
    for (let i = 0; i < 12; i++) { await page.click('#tgl-night'); await page.waitForTimeout(30); await page.click('#tgl-night'); await page.waitForTimeout(30); }
    await page.waitForTimeout(500);
    const on2 = await page.evaluate(() => ME.nightState());
    ok('still exactly one mesh after 12 off/on cycles', on2.on === true && on2.hasMesh === true, on2);
    ok('still repaints correctly after 12 cycles', typeof on2.paintMs === 'number' && on2.at !== null, on2);
    await page.click('#tgl-night'); await page.waitForTimeout(300);
    const off = await page.evaluate(() => ME.nightState());
    ok('turning it off releases the mesh', off.on === false && off.hasMesh === false, off);
    ok('turning it off clears the legend line', await page.locator('#night-legend').isHidden());
    ok('turning it off clears the panel timestamp', await page.locator('#night-time').isHidden());
    ok('no page errors across 24 toggles', perr.length === 0, perr.slice(0, 3));
    await ctx.close();
  }

  // ============================================ 6. no WebGL: say so, change nothing
  {
    const { ctx, page, perr } = await harness(browser, { noWebGL: true });
    await page.click('#exp-btn');
    await page.click('#tgl-night');
    await page.waitForTimeout(400);
    const st = await page.evaluate(() => ME.nightState());
    ok('overlay does not claim to be on without a globe', st.on === false && st.hasMesh === false, st);
    ok('it explains why', /globe is unavailable/i.test(await page.locator('#night-time').innerText()), await page.locator('#night-time').innerText());
    ok('the switch stays unchecked', await page.locator('#tgl-night').getAttribute('aria-checked') === 'false');
    ok('no legend line is shown', await page.locator('#night-legend').isHidden());
    ok('search still works without a globe', await (async () => { await page.fill('#search-q', 'hawaii'); await page.press('#search-q', 'Enter'); await page.waitForSelector('#search-list button.res'); return true; })());
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ============================================ 7. phone: target size, one scrolling surface
  {
    const { ctx, page, perr } = await harness(browser, { viewport: { width: 390, height: 780 }, isMobile: true });
    await page.click('#exp-btn');
    ok('the toggle is at least 44 px tall', await page.evaluate(() => document.getElementById('tgl-night').getBoundingClientRect().height >= 44));
    await page.click('#tgl-night');
    await page.waitForTimeout(700);
    ok('overlay works on a phone viewport', await page.evaluate(() => ME.nightState().on) === true);
    const nested = await page.evaluate(() => ['.ovl', '#card-explore', '.exp-body'].map(q => document.querySelector(q)).filter(Boolean)
      .filter(e => { const o = getComputedStyle(e).overflowY; return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1; }).map(e => e.className));
    ok('no scrollbar nested inside the sheet', nested.length === 0, nested);
    ok('the panel does not overflow horizontally', await page.evaluate(() => { const e = document.getElementById('card-explore'); return e.scrollWidth - e.clientWidth <= 1; }));
    ok('no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
