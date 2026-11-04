/* Mother Earth — mobile pass (thread 13, 4 Nov 2026). Phones (<= 720 px): the legend sits behind a "Key · N layers"
 * button; persistent disclosures (dated plastic samples, day/night, orbital) stay visible while it is closed; the imagery
 * chip is one line with the date and "not live", the full imagery sentence (with year) inside the Key. Landscape phones
 * (> 720 px wide) and desktop keep the existing layouts.
 * Measures how much of the globe's disc the overlays cover, base and "everything on" (plastic + drifters + day/night +
 * all three orbital categories), and asserts the behaviour. MODE=before runs the measurements only (for the old build).
 * Run: node phase1/mobile-pass.test.cjs [base-url]   (needs a static server on the repo, /home/claude/spike deps and
 *      /home/claude/fixtures/orbital.csv + orbital-meta.json from phase1/orbital-fixture.build.mjs)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const BEFORE = process.env.MODE === 'before';
const OUT = process.env.SHOTS || null;   // directory for screenshots
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const CSV = fs.readFileSync('/home/claude/fixtures/orbital.csv', 'utf8');
const META = JSON.parse(fs.readFileSync('/home/claude/fixtures/orbital-meta.json', 'utf8'));
// small mid-blue PNG as the imagery skin (the day/night overlay refuses to draw without a globe texture)
const EARTH_PNG = (() => { const { PNG } = require('/home/claude/spike/node_modules/pngjs'); const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 30; p.data[i + 1] = 60; p.data[i + 2] = 110; p.data[i + 3] = 255; } return PNG.sync.write(p); })();
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const RUN = new Date(Date.now() - 60e3).toISOString(), PRUN = new Date(Date.now() - 600e3).toISOString();
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const PREC = [['0276422-0000001', 42.75, 4.13, '2011-08-31', 0.5, 'no_original', null, 'Manta net', 0.33, 0], ['0276422-0001000', -20.5, 57.5, '2024-10-23', 0.2, 'no_original', null, 'Manta net', 0.33, 0]];
const cellsOf = (recs, grade) => { const c = {}; for (const r of recs) { const k = cellOf(r[1], r[2]); (c[k] = c[k] || { count: 0, coverage: { grade, evidence: 'e', observed_fraction: null } }).count++; } return c; };
const pEnv = rec => ({ layer: 'plastic', retrieved_at: PRUN, window_start: '2011-08-31', window_end: '2024-10-23', stale_after_s: 259200, source_status: 'ok', quantity: 'dated surface microplastic samples', cells: cellsOf(PREC, 'partial'),
  verification: { status: 'checked', counts: { reproduced: 0, not_reproduced: 0, possible_date_conflict: 0, ambiguous: 0, no_original: 2 } },
  ...(rec ? { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'], records: PREC } : {}) });
const FIX = new Date(Date.now() - 3600e3).toISOString();
const BUOYS = [['1101570', -34.2, 18.1, FIX, 17.2, 'drifting buoy', 'ZA'], ['4402501', 10.5, -40.2, FIX, 26.1, 'drifting buoy', 'US']];
const dEnv = rec => ({ layer: 'drifters', retrieved_at: RUN, window_start: FIX, window_end: FIX, stale_after_s: 14400, source_status: 'ok', quantity: 'drifting buoys', cells: cellsOf(BUOYS, 'partial'), refused: {},
  ...(rec ? { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], records: BUOYS } : {}) });

let pass = 0, fail = 0; const ok = (n, c, got) => { if (BEFORE) return; if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 8 min — failure, not a hang'); process.exit(1); }, 8 * 60e3);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport, o = {}) => {
    const isMobile = viewport.width <= 720;
    const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: EARTH_PNG }));   // a real texture: the day/night overlay needs one
    await ctx.route(HUB + '/**', route => {
      const p = new URL(route.request().url()).pathname;
      const J = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      if (p === '/cells/plastic') return J(pEnv(false));
      if (p === '/snapshot/plastic') return o.plastic500 ? route.fulfill({ status: 500, body: '{}' }) : J(pEnv(true));
      if (p === '/cells/drifters') return J(dEnv(false));
      if (p === '/snapshot/drifters') return J(dEnv(true));
      if (p === '/snapshot/orbital') return J(META);
      if (p === '/elements/orbital') return route.fulfill({ status: 200, contentType: 'text/csv', body: CSV, headers: { 'X-Elements-SHA256': META.elements.sha256, 'Access-Control-Expose-Headers': 'X-Elements-SHA256' } });
      if (p === '/status') return J({ last_runs: [{ layer: 'orbital', started_at: new Date(Date.now() - 1800e3).toISOString(), status: 'ok', note: 'published' }] });
      if (p === '/snapshot/usgs') return J({ layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) });
      if (p === '/cells/usgs') return J({ layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } });
      if (p.startsWith('/snapshot/') || p.startsWith('/cells/')) return J({ layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null });
      return route.fulfill({ status: 404, body: '{}' });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    return { ctx, page, perr };
  };
  // share of the globe's visible disc covered by any overlay positioned on top of the globe
  const M = page => page.evaluate(() => {
    const vis = id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { id, abs: cs.position === 'absolute', x: b.x, y: b.y, w: b.width, h: b.height } : null; };
    const g = vis('globe'), boxes = ['legend', 'imgdate', 'key-btn'].map(vis).filter(b => b && b.abs);
    // the persist strip is a transparent container: what covers the globe is each visible disclosure inside it
    const ps = vis('persist'); if (ps && ps.abs) for (const c of document.getElementById('persist').children) { const r = c.getBoundingClientRect(); if (!c.hidden && r.width) boxes.push({ id: 'persist:' + c.id, abs: true, x: r.x, y: r.y, w: r.width, h: r.height }); }
    // the drawn sphere: globe.gl centres it in the canvas; screen radius from the camera (fov 50°, distance = (1 + altitude) radii):
    // r = (H/2) / tan(25°) / sqrt((1+alt)^2 - 1). Checked against a screenshot at 390x844 (≈121 px vs ≈125 px drawn).
    const pov = ME.cameraAt ? ME.cameraAt() : null, alt = pov ? pov.altitude : 2.5;
    const cx = g.x + g.w / 2, cy = g.y + g.h / 2, R = (g.h / 2) / Math.tan(25 * Math.PI / 180) / Math.sqrt((1 + alt) ** 2 - 1); let n = 0, c = 0;
    for (let x = g.x; x < g.x + g.w; x += 2) for (let y = g.y; y < g.y + g.h; y += 2) { if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue; n++; if (boxes.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) c++; }
    return { disc: +(100 * c / n).toFixed(1), discR: Math.round(R), boxes: Object.fromEntries(boxes.map(b => [b.id, `${Math.round(b.w)}×${Math.round(b.h)}`])), hscroll: document.documentElement.scrollWidth > innerWidth };
  });
  const allOn = async page => {
    for (const sel of ['[data-layer="plastic"]', '[data-layer="drifters"]']) { await page.click(sel); await page.waitForTimeout(600); }
    await page.click('#tgl-night'); await page.waitForTimeout(800);
    for (const g of ['payload', 'rocket_body', 'debris']) {   // a switch is ignored while the orbital file is still loading (aria-busy)
      await page.waitForFunction(() => [...document.querySelectorAll('#orb-tgls [data-g]')].every(b => b.getAttribute('aria-busy') !== 'true'), null, { timeout: 60000 });
      await page.click(`#orb-tgls [data-g="${g}"]`); await page.waitForTimeout(300); }
    await page.waitForFunction(() => [...document.querySelectorAll('#orb-tgls [data-g]')].every(b => b.getAttribute('aria-checked') === 'true'), null, { timeout: 60000 }).catch(() => { });
    await page.waitForFunction(() => document.getElementById('orb-legend') && !document.getElementById('orb-legend').hidden, null, { timeout: 60000 }).catch(() => { });
    await page.waitForTimeout(1500);
  };
  const shot = async (page, name) => { if (OUT) await page.screenshot({ path: `${OUT}/${BEFORE ? 'before' : 'after'}-${name}.png` }); };
  const results = [];

  // ---------- portrait phones: measurements (+ assertions on the new build)
  for (const vp of [{ width: 360, height: 640 }, { width: 360, height: 780 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
    const tag = `${vp.width}x${vp.height}`;
    const { ctx, page, perr } = await run(vp);
    const m0 = await M(page); results.push([tag + ' load', m0]); await shot(page, tag + '-load');
    if (!BEFORE) {
      const k = await page.evaluate(() => { const b = document.getElementById('key-btn').getBoundingClientRect(); return { ...ME.keyState(), w: b.width, h: b.height, exp: document.getElementById('key-btn').getAttribute('aria-expanded'), legendShown: getComputedStyle(document.getElementById('legend')).display !== 'none',
        imgShort: getComputedStyle(document.querySelector('.img-short')).display !== 'none' ? document.querySelector('.img-short').textContent : null } });
      ok(`${tag}: Key closed on load, aria-expanded=false`, !k.open && k.exp === 'false' && !k.legendShown, k);
      ok(`${tag}: Key touch target >= 44x44`, k.w >= 44 && k.h >= 44, k);
      ok(`${tag}: imagery chip shows date + "not live"`, k.imgShort && /\d\d \w{3}/.test(k.imgShort) && /not live/.test(k.imgShort), k.imgShort);
      ok(`${tag}: label counts drawn layers only (no indices, no optional layers off)`, k.drawn.every(x => !['swpc', 'co2', 'seaice', 'plastic', 'drifters', 'daynight'].includes(x)) && k.label.includes(k.drawn.length + ' layer'), k);
      ok(`${tag}: no persistent disclosure at load`, k.persist.length === 0, k);
      ok(`${tag}: base load covers < 8% of the disc`, m0.disc < 8, m0);
    }
    await allOn(page);
    const m1 = await M(page); results.push([tag + ' everything on', m1]); await shot(page, tag + '-all');
    if (vp.width <= 720) {   // the same, with the Readings sheet collapsed (how the globe is looked at on a phone)
      await page.click('#sheet-btn'); await page.waitForTimeout(500);
      const mc = await M(page); results.push([tag + ' everything on, sheet down', mc]); await shot(page, tag + '-all-sheetdown');
      if (!BEFORE) ok(`${tag}: sheet down → disclosures sit above the collapsed sheet`, await page.evaluate(() => [...document.getElementById('persist').children].filter(c => !c.hidden).every(c => c.getBoundingClientRect().bottom <= document.getElementById('sheet').getBoundingClientRect().top + 1)));
      await page.click('#sheet-btn'); await page.waitForTimeout(500);
    }
    if (!BEFORE) {
      const k = await page.evaluate(() => ME.keyState());
      ok(`${tag}: everything on → plastic, drifters, day/night and all three orbital categories counted`, ['plastic', 'drifters', 'daynight', 'orbital:payload', 'orbital:rocket_body', 'orbital:debris'].every(x => k.drawn.includes(x)) && k.label.includes(k.drawn.length + ' layers'), k);
      ok(`${tag}: everything on → plastic, day/night and orbital disclosures visible with the Key closed`, !k.open && ['ps-plastic', 'ps-night', 'ps-orb'].every(x => k.persist.includes(x)), k);
      const t = await page.evaluate(() => ({ p: document.querySelector('#ps-plastic summary').textContent, n: document.getElementById('ps-night').textContent, o: document.getElementById('ps-orb').textContent }));
      ok(`${tag}: plastic disclosure reads "Dated samples · 2011–2024"`, t.p === 'Dated samples · 2011–2024', t);
      ok(`${tag}: orbital disclosure keeps "computed" and "not to scale"`, /computed/.test(t.o) && /not to scale/.test(t.o), t);
      ok(`${tag}: day/night disclosure keeps "computed" + time`, /computed · \d\d:\d\d:\d\d UTC/.test(t.n), t);
      // open the Key by keyboard
      await page.focus('#key-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      const o = await page.evaluate(() => { const L = document.getElementById('legend'), r = L.getBoundingClientRect(), g = document.getElementById('globe').getBoundingClientRect(), sh = document.getElementById('sheet').getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 40), hit = document.elementFromPoint(cx, cy);
        return { open: ME.keyState().open, exp: document.getElementById('key-btn').getAttribute('aria-expanded'), top: r.top, bottom: r.bottom, sheetTop: sh.top, vh: innerHeight, scrollable: L.scrollHeight > L.clientHeight, overflow: getComputedStyle(L).overflowY, inGlobe: document.getElementById('globe').contains(L), hitInLegend: L.contains(hit), img: document.getElementById('img-full').textContent, def: !!document.getElementById('key-def').offsetParent };
      });
      ok(`${tag}: Enter opens the Key (aria-expanded=true)`, o.open && o.exp === 'true', o);
      ok(`${tag}: opened Key fits above the readings sheet and inside the screen`, o.top >= 0 && o.bottom <= o.sheetTop + 1 && o.bottom <= o.vh, o);
      ok(`${tag}: opened Key scrolls inside itself when long (no page or globe drag)`, !o.scrollable || o.overflow === 'auto', o);
      ok(`${tag}: Key is not part of the globe; touches on it land on the Key`, !o.inGlobe && o.hitInLegend, o);
      ok(`${tag}: opened Key carries the full imagery sentence with the year`, /\d\d \w{3} 20\d\d/.test(o.img) && /not live/.test(o.img) && /NASA GIBS/.test(o.img), o.img);
      ok(`${tag}: opened Key explains what N counts`, o.def, o);
      if (o.scrollable) { await page.evaluate(() => { const L = document.getElementById('legend'); L.scrollTop = L.scrollHeight; }); }
      await shot(page, tag + '-key-open');
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      const e = await page.evaluate(() => ({ open: ME.keyState().open, focus: document.activeElement && document.activeElement.id }));
      ok(`${tag}: Escape closes the Key and returns focus to it`, !e.open && e.focus === 'key-btn', e);
      await page.keyboard.press(' '); await page.waitForTimeout(100);
      ok(`${tag}: Space toggles the Key`, await page.evaluate(() => ME.keyState().open));
      // Key vs inspector: opening either closes the other; both close buttons reachable
      await page.evaluate(k => ME.openCell('plastic', k), cellOf(42.75, 4.13)); await page.waitForTimeout(200);
      const i1 = await page.evaluate(() => { const x = document.getElementById('insp-x').getBoundingClientRect(), kb = document.getElementById('key-btn').getBoundingClientRect();
        return { insp: document.getElementById('insp').classList.contains('show'), key: ME.keyState().open, xHit: document.elementFromPoint(x.x + x.width / 2, x.y + x.height / 2) === document.getElementById('insp-x'),
          kHit: document.elementFromPoint(kb.x + kb.width / 2, kb.y + kb.height / 2) === document.getElementById('key-btn') || document.getElementById('key-btn').contains(document.elementFromPoint(kb.x + kb.width / 2, kb.y + kb.height / 2)),
          sheetHit: (() => { const sb = document.getElementById('sheet-btn').getBoundingClientRect(), h = document.elementFromPoint(sb.x + sb.width / 2, sb.y + sb.height / 2); return document.getElementById('sheet-btn').contains(h); })(),
          inspBottom: document.getElementById('insp').getBoundingClientRect().bottom, sheetTop: document.getElementById('sheet').getBoundingClientRect().top }; });
      ok(`${tag}: with a record open, the Readings button stays reachable (inspector ends above the sheet)`, i1.sheetHit && i1.inspBottom <= i1.sheetTop + 1, i1);
      ok(`${tag}: opening a record closes the Key; inspector close and Key button both reachable`, i1.insp && !i1.key && i1.xHit && i1.kHit, i1);
      await shot(page, tag + '-inspector');
      await page.click('#key-btn'); await page.waitForTimeout(150);
      const i2 = await page.evaluate(() => ({ insp: document.getElementById('insp').classList.contains('show'), key: ME.keyState().open }));
      ok(`${tag}: opening the Key closes the inspector`, i2.key && !i2.insp, i2);
      await page.click('#key-btn'); await page.waitForTimeout(100);
      ok(`${tag}: Key closes by its button`, !(await page.evaluate(() => ME.keyState().open)));
      // target: <= 8 % with every persistent disclosure. Where the globe is too small for that (360 px, Readings open),
      // the disclosures keep their words and size and the measured figure is reported instead (Chad, 4 Nov)
      const rd = await page.evaluate(() => [...document.getElementById('persist').children].filter(c => !c.hidden).map(c => { const t = c.querySelector('summary') || c; return { fs: parseFloat(getComputedStyle(c).fontSize), cut: t.scrollWidth > t.clientWidth + 1 }; }));
      ok(`${tag}: disclosures readable (>= 10.5 px, not truncated)`, rd.every(x => x.fs >= 10.5 && !x.cut), rd);
      if (vp.width >= 390) ok(`${tag}: everything on, Readings open, covers <= 8% of the disc`, m1.disc <= 8, m1);
      else console.log(`REPORT ${tag}: everything on, Readings open: ${m1.disc} % of the disc (target 8 %; disclosures kept readable)`);
      ok(`${tag}: no horizontal scroll`, !m0.hscroll && !m1.hscroll, [m0, m1]);
      ok(`${tag}: no page errors`, perr.length === 0, perr);
    }
    await ctx.close();
  }

  // ---------- counting rule: a layer that failed to load is not counted
  if (!BEFORE) {
    const { ctx, page } = await run({ width: 390, height: 844 }, { plastic500: true });
    await page.click('[data-layer="plastic"]'); await page.waitForTimeout(1500);
    const k = await page.evaluate(() => ME.keyState());
    ok('plastic on but its records failed → not counted, no "Dated samples" disclosure', !k.drawn.includes('plastic') && !k.persist.includes('ps-plastic'), k);
    await ctx.close();
  }

  // ---------- landscape phones and desktop: existing layouts kept
  for (const vp of [{ width: 780, height: 360 }, { width: 844, height: 390 }, { width: 932, height: 430 }, { width: 1280, height: 860 }]) {
    const tag = `${vp.width}x${vp.height}`;
    const { ctx, page, perr } = await run(vp);
    await allOn(page);
    const m = await M(page); results.push([tag + ' everything on', m]); await shot(page, tag + '-all');
    if (!BEFORE) {
      const s = await page.evaluate(() => ({ key: getComputedStyle(document.getElementById('key-btn')).display, persist: getComputedStyle(document.getElementById('persist')).display, legend: getComputedStyle(document.getElementById('legend')).display,
        long: getComputedStyle(document.querySelector('.img-long')).display, short: getComputedStyle(document.querySelector('.img-short')).display, orb: !document.getElementById('orb-legend').hidden, plasticLeg: !document.getElementById('leg-plastic').hidden }));
      ok(`${tag}: no Key button / persist strip; full legend and imagery text as before`, s.key === 'none' && s.persist === 'none' && s.legend !== 'none' && s.long !== 'none' && s.short === 'none' && s.orb && s.plasticLeg, s);
      if (vp.width < 1100) ok(`${tag}: no horizontal scroll`, !m.hscroll, m);   // 1280: an 8 px overflow exists on main too (header/stage/right column) — separate item, not this pass
      // inspector closable in landscape with everything on
      await page.evaluate(k => ME.openCell('plastic', k), cellOf(42.75, 4.13)); await page.waitForTimeout(200);
      const x = await page.evaluate(() => { const b = document.getElementById('insp-x').getBoundingClientRect(); return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === document.getElementById('insp-x'); });
      ok(`${tag}: inspector close button reachable`, x);
      const lc = await page.evaluate(() => { const reach = el => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return el.contains(h); };
        return { plasticToggle: reach(document.querySelector('[data-layer="plastic"]')), nightToggle: reach(document.getElementById('tgl-night')), orbToggle: reach(document.querySelector('#orb-tgls [data-g="debris"]')), covkey: reach(document.querySelector('.legend details.covkey > summary')) }; });
      ok(`${tag}: with the inspector open, layer toggles and the legend's coverage key are reachable (scroll the page)`, Object.values(lc).every(Boolean), lc);
      await page.keyboard.press('Escape');
      ok(`${tag}: no page errors`, perr.length === 0, perr);
    }
    await ctx.close();
  }

  console.log('\n' + (BEFORE ? 'BEFORE (main)' : 'AFTER (branch)') + ' — share of the globe disc covered by overlays');
  for (const [k, v] of results) console.log('  ' + k.padEnd(26), String(v.disc).padStart(5) + ' %', ' ', JSON.stringify(v.boxes));
  if (!BEFORE) console.log(`\n${pass} passed, ${fail} failed`);
  clearTimeout(wd); await browser.close(); process.exit(fail ? 1 : 0);
})();
