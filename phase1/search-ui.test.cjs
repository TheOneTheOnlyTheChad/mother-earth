/* Mother Earth — limited search: browser-level tests (thread 5, 2 Nov 2026).
 * Serves the clone locally, routes the hub to run-labelled fixtures, swaps in a globe.gl test
 * double that records every camera move, and drives the page's OWN 5-minute refresh with
 * Playwright's clock so the stale-result path is exercised through production code, not a hook.
 *
 * Asserts: no camera movement before a selection · results only after submission · a result
 * refused when its own basis moves (run replaced, freshness lapsed) · a switched-off layer still searched,
 * its rows saying so, and choosing one switching the layer on through its own switch (bare-search-rc) · one layer
 * refreshing invalidating only that layer's results · observation vs receipt vs sample end kept
 * apart · the agreed wordings · keyboard · reduced motion · no-WebGL · one scrolling surface.
 *
 * Needs: python3 -m http.server 8899 --bind 127.0.0.1  running in the clone.
 */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8899';
const ME_REFRESH_MS = 5 * 60e3 + 1000;   // the page's own polling interval, driven through Playwright's clock
const HUB = 'https://mother-earth.chadoberholzer.workers.dev';

let pass = 0, fail = 0;
const BREAK = process.env.BREAK || '';   // BREAK=pools-on|no-switch|search-switches|no-off-note (bare sections only)
const brk = (body, a, b) => { if (!body.includes(a)) { console.log('FAIL  break target not found: ' + a.slice(0, 60)); process.exit(1); } return body.replace(a, b); };
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };

const PAGE_NOW = Date.UTC(2026, 10, 2, 6, 0, 0);          // the page's clock for every test
const at = (h, m, s = 0) => new Date(Date.UTC(2026, 10, 2, h, m, s)).toISOString().replace(/\.\d+Z$/, 'Z');
const RUN_A = at(5, 50), RUN_B = at(5, 58);                // two collector runs of the same layer

const quakeSnap = (run, titles) => ({
  layer: 'usgs', retrieved_at: run, source_generated_at: run, source_age_s: 1, stale_after_s: 900,
  quantity: 'one earthquake above M2.5', record_format: 'rows',
  record_fields: ['lat', 'lng', 'mag', 'mag_type', 'depth_km', 'title', 'src', 'observed_at'],
  records: titles.map((t, i) => [-33.9 + i * 0.01, 18.4 + i * 0.01, 4 + i * 0.5, 'mb', 10 + i, t, '', at(5, 40, i)]),
});
const quakeCells = (run, n) => ({
  layer: 'usgs', retrieved_at: run, source_generated_at: run, source_age_s: 1, stale_after_s: 900,
  quantity: 'one earthquake above M2.5',
  cells: { '14_49': { count: n, coverage: { grade: 'adequate', evidence: 'collector observed throughout the window', observed_fraction: 1 } } },
});
const shipSnap = run => ({
  layer: 'ships', retrieved_at: run, stale_after_s: 10800, window_s: 60, window_end: run,
  class_a: 2, class_b: 0, socket_connected_s: 59, messages_flowing_s: 58, elapsed_wall_s: 61,
  quantity: 'one vessel identity in the sample', record_format: 'rows',
  record_fields: ['lat', 'lng', 'mmsi', 'name', 'class', 'sog_kn', 'observed_at', 'received_at'],
  // second vessel deliberately has NO source observation time: it must be labelled, never filled from window_end
  records: [[-33.95, 18.45, '219018123', 'MAERSK CHILE', 'A', 12.5, at(5, 49, 50), at(5, 49, 51)],
            [-33.96, 18.46, '636092111', 'NO TIME SHIP', 'A', 0, null, at(5, 49, 52)]],
});
const shipCells = run => ({
  layer: 'ships', retrieved_at: run, stale_after_s: 10800, window_s: 60, window_end: run, class_a: 2, class_b: 0,
  quantity: 'one vessel identity in the sample',
  cells: { '14_49': { count: 2, coverage: { grade: 'adequate', evidence: 'collector sampled throughout', observed_fraction: 1 } } },
});
const fireSnap = run => ({
  layer: 'firms', retrieved_at: run, stale_after_s: 1800, raw_bytes: 5000, scope: 'world',
  quantity: 'one VIIRS detection per pass', record_format: 'rows',
  record_fields: ['lat', 'lng', 'frp_mw', 'confidence', 'daynight', 'satellite', 'observed_at'],
  records: [[-33.80, 18.60, 12, 'n', 'D', 'N20', at(5, 30)]],
});
const fireCells = run => ({
  layer: 'firms', retrieved_at: run, stale_after_s: 1800, raw_bytes: 5000, scope: 'world',
  quantity: 'one VIIRS detection per pass',
  cells: { '14_49': { count: 1, coverage: { grade: 'partial', evidence: 'pass schedule not yet wired' } } },
});
const idle = l => ({ layer: l, retrieved_at: at(5, 55), stale_after_s: 10800, cells: {}, quantity: 'index',
  sweep: { answered: 0, cells_total: 559, oldest_queried_at: at(5, 55) }, index: null });

// one globe.gl double for every context: records camera moves WITH their duration argument
const GLOBE_DOUBLE = ({ noWebGL }) => {
  window.__calls = { pov: [], points: [], rings: [], polys: [] };
  window.__mk = () => {
    const g = new Proxy(function () { return g; }, {
      get: (_, k) => {
        if (k === 'pointOfView') return (v, d) => { window.__calls.pov.push({ v, d }); return g; };
        if (k === 'pointsData') return d => { if (d) window.__calls.points.push(d.length); return g; };
        if (k === 'ringsData') return d => { if (d) window.__calls.rings.push(d.length); return g; };
        if (k === 'polygonsData') return d => { if (d) window.__calls.polys.push(d.length); return g; };
        if (k === 'controls') return () => ({ autoRotate: false, autoRotateSpeed: 0, addEventListener() { } });
        return () => g;
      }, apply: () => g,
    });
    return g;
  };
  if (noWebGL) {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : real.call(this, t, ...a); };
  }
};

async function harness(browser, opts = {}) {
  const { noWebGL = false, reducedMotion, viewport = { width: 1400, height: 900 }, isMobile = false, quakeTitles, clock = true, bare = false } = opts;
  const ctx = await browser.newContext({ viewport, reducedMotion, isMobile, hasTouch: isMobile });
  const st = { runs: { usgs: RUN_A, ships: RUN_A, firms: RUN_A },
               titles: quakeTitles || ['14 km SSW of Volcano, Hawaii', '8 km N of Santiago, Chile'] };

  await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.Globe=function(){return window.__mk()}' }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(8) }));
  await ctx.route(HUB + '/**', route => {
    const p = new URL(route.request().url()).pathname;
    const body = p === '/snapshot/usgs' ? quakeSnap(st.runs.usgs, st.titles)
      : p === '/cells/usgs' ? quakeCells(st.runs.usgs, st.titles.length)
      : p === '/snapshot/ships' ? shipSnap(st.runs.ships)
      : p === '/cells/ships' ? shipCells(st.runs.ships)
      : p === '/snapshot/firms' ? fireSnap(st.runs.firms)
      : p === '/cells/firms' ? fireCells(st.runs.firms)
      : idle(p.split('/').pop());
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  // bare: serve index.html as it is on disk (nothing drawn at load), whatever the test server does to START_ON
  if (bare) await ctx.route(/127\.0\.0\.1:8899\/index\.html(\?.*)?$/, r => { let body = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
    if (BREAK === 'pools-on') body = brk(body, ".filter(l => usable(l) && ME.freshness(l).grade !== 'unknown')", ".filter(l => on[l] && usable(l) && ME.freshness(l).grade !== 'unknown')");
    if (BREAK === 'no-switch') body = brk(body, "if (sw) sw.click();", "");
    if (BREAK === 'search-switches') body = brk(body, "  sres = r;\n", "  sres = r; for (const l of r.searched) if (!on[l]) $('tgl-' + l).click();\n");
    if (BREAK === 'no-off-note') body = brk(body, "!on[h.layer] ? `<span class=\"ro\">", "false ? `<span class=\"ro\">");
    r.fulfill({ status: 200, contentType: 'text/html', body }); });
  await ctx.addInitScript(GLOBE_DOUBLE, { noWebGL });

  const page = await ctx.newPage();
  if (clock) await page.clock.install({ time: new Date(PAGE_NOW) });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.pairState('ships').ships.usable, null, { timeout: 20000 });
  const search = async q => { await page.fill('#search-q', q); await page.press('#search-q', 'Enter'); };
  const rows = () => page.evaluate(() => [...document.querySelectorAll('#search-list button.res')].map(b => ({
    layer: b.querySelector('.rl') ? b.querySelector('.rl').textContent : '', dead: b.classList.contains('dead'),
    text: b.innerText.replace(/\n+/g, ' | '), i: b.dataset.i, go: !!b.dataset.go })));
  const povs = () => page.evaluate(() => window.__calls.pov);
  return { ctx, page, st, search, rows, povs };
}

(async () => {
  const browser = await chromium.launch();

  // ------------------------------------------------- 1. one panel, closed, results only on submit
  {
    const { ctx, page, search, povs } = await harness(browser);
    ok('Explore panel replaces the Find card',
      await page.locator('#card-explore').count() === 1 && await page.locator('#card-find').count() === 0);
    ok('closed on load', await page.locator('#exp-body').isHidden() && await page.locator('#exp-btn').getAttribute('aria-expanded') === 'false');
    ok('both snapshot-jump buttons are inside it',
      await page.locator('#exp-body #find-usgs').count() === 1 && await page.locator('#exp-body #find-firms').count() === 1);
    ok('no results and no status before submission',
      await page.locator('#search-list li').count() === 0 && (await page.locator('#search-status').innerText()).trim() === '');
    await page.click('#exp-btn');
    ok('opening focuses the input', await page.evaluate(() => document.activeElement.id) === 'search-q');
    ok('input is 16px so phones do not zoom on focus',
      await page.evaluate(() => getComputedStyle(document.getElementById('search-q')).fontSize) === '16px');
    ok('the input has a real label, not just a placeholder',
      await page.evaluate(() => { const l = document.querySelector('label[for="search-q"]'); return !!l && /Search loaded records or coordinates/.test(l.textContent); }));
    ok('the latitude-first hint is visible without opening anything',
      /latitude first/i.test(await page.locator('#search-hint').innerText()));
    ok('long scope text is behind a closed disclosure', await page.evaluate(() => !document.querySelector('details.scope').open));
    const before = (await povs()).length;
    await page.fill('#search-q', 'volcano');
    ok('typing produces no results and no camera movement',
      await page.locator('#search-list li').count() === 0 && (await povs()).length === before);
    await page.press('#search-q', 'Enter');
    await page.waitForSelector('#search-list button.res');
    ok('submission shows the match', await page.locator('#search-list button.res').count() === 1);
    ok('submission alone moves no camera', (await povs()).length === before);
    const s = await page.locator('#search-status').innerText();
    ok('status gives matches, records considered and layers searched',
      /1 match in \d+ loaded records/.test(s) && /searched: earthquakes, ships/.test(s), s);
    ok('fires are never listed as text-searchable', !/searched:[^|]*fire/i.test(s), s);
    const row = (await page.locator('#search-list button.res').first().innerText()).replace(/\n+/g, ' | ');
    ok('row carries layer, identity, match, observation time, state and run',
      /earthquakes/i.test(row) && /M4\.0/.test(row) && /Volcano/.test(row) && /observed 2026-11-02 05:40 UTC/.test(row) && /current/i.test(row) && /run 05:50 UTC/i.test(row), row);
    ok('the highlight covers the matched substring only',
      (await page.evaluate(() => document.querySelector('#search-list mark').textContent)).toLowerCase() === 'volcano');
    // live-data finding: a vessel matched on its own name must not print that name twice
    await search('MAERSK');
    await page.waitForSelector('#search-list button.res');
    const shipRow = (await page.locator('#search-list button.res').first().innerText()).replace(/\n+/g, ' | ');
    ok('a vessel matched on its name shows that name once, with the highlight in the title',
      (shipRow.match(/MAERSK CHILE/g) || []).length === 1 && /maersk/i.test(await page.evaluate(() => document.querySelector('#search-list mark').textContent)), shipRow);
    await search('636092111');
    await page.waitForSelector('#search-list button.res');
    const mmsiRow = (await page.locator('#search-list button.res').first().innerText()).replace(/\n+/g, ' | ');
    ok('a named vessel matched on its MMSI still shows both name and MMSI',
      /NO TIME SHIP/.test(mmsiRow) && /636092111/.test(mmsiRow), mmsiRow);
    await search('volcano');
    await page.waitForSelector('#search-list button.res');
    const qRow = (await page.locator('#search-list button.res').first().innerText()).replace(/\n+/g, ' | ');
    ok('an earthquake keeps magnitude and description as separate lines',
      /M4\.0/.test(qRow) && /14 km SSW of Volcano/.test(qRow), qRow);
    const notes = await page.locator('#search-notes').innerText();
    ok('a layer with no searchable text is named with its reason',
      /Fire detections: not searched — publishes no text to search/.test(notes), notes);
    ok('the scope disclaimer is not repeated on each row', !/does not establish/i.test(row), row);
    await ctx.close();
  }

  // ------------------------------------------------- 2. selection reuses the existing inspector
  {
    const { ctx, page, search, povs } = await harness(browser);
    await page.click('#exp-btn'); await search('volcano');
    await page.waitForSelector('#search-list button.res');
    const n0 = (await povs()).length;
    await page.click('#search-list button.res');
    const p = await povs();
    ok('selection moves the camera exactly once', p.length === n0 + 1, p.length - n0);
    const last = p[p.length - 1];
    ok('camera goes to the record, not the cell', Math.abs(last.v.lat + 33.9) < 1e-6 && Math.abs(last.v.lng - 18.4) < 1e-6, last.v);
    ok('animation duration is used when motion is allowed', last.d === 1200, last.d);
    ok('the record inspector opens', await page.locator('#insp.show').count() === 1);
    ok('it is the one-record inspector, not a cell total', /one record/i.test(await page.locator('#insp-h').innerText()));
    const dl = await page.locator('#insp-dl').innerText();
    ok('inspector rows render from record_fields (the live-envelope lesson)',
      /Magnitude/.test(dl) && /Place/.test(dl) && /Depth/.test(dl) && /This run/.test(dl), dl.slice(0, 160));
    await page.keyboard.press('Escape');
    ok('closing restores focus to the result button', await page.evaluate(() => document.activeElement.classList.contains('res')));
    await ctx.close();
  }

  // ------------------------------------------------- 3. coordinates
  {
    const { ctx, page, search, rows, povs } = await harness(browser);
    await page.click('#exp-btn'); await search('-33.92, 18.42');
    await page.waitForSelector('#search-list button.res');
    const r = await rows();
    ok('a Go-to row is offered first', r[0].go && /33\.920° S, 18\.420° E/i.test(r[0].text), r[0]);
    ok('Go-to says plainly that it opens no record', /no record is opened/i.test(r[0].text), r[0].text);
    let s = await page.locator('#search-status').innerText();
    ok('status states the radius and the ordering', /within 250 km, nearest first/.test(s), s);
    const kms = await page.evaluate(() => [...document.querySelectorAll('#search-list button.res .rw')]
      .map(e => (e.textContent.match(/([\d,]+) km away/) || [])[1]).filter(Boolean).map(x => +x.replace(/,/g, '')));
    ok('records are listed nearest first', kms.length >= 3 && kms.every((k, i) => i === 0 || k >= kms[i - 1]), kms);
    ok('every listed record is inside the radius', kms.every(k => k <= 250), kms);
    ok('fires DO take part in a coordinate search', r.some(x => /fire/i.test(x.layer)), r.map(x => x.layer));
    const notes = await page.locator('#search-notes').innerText();
    ok('the radius is stated as a choice for this box, not a coverage boundary',
      /250 km is a search radius chosen for this box, not a coverage boundary/.test(notes), notes);
    ok('the radius is never justified through the 4° grid', !/4°|cell grid|adjacent cell|half a cell/i.test(notes + s), notes);
    const all = r.map(x => x.text).join(' || ');
    ok('a missing source observation time is labelled, never filled from the sample end',
      /source observation time not supplied/.test(all), all);
    ok('ship rows show receipt time distinctly from observation time',
      /received 2026-11-02 05:49:5\d UTC/.test(all) && /observed 2026-11-02 05:49 UTC/.test(all), all);
    ok('no row shows the sample end as the observation time', !/observed 2026-11-02 05:50 UTC/.test(all), all);
    ok('the sample end is stated once, below the list', /sample ending 05:50 UTC/.test(notes), notes);

    await search('60, -40');
    await page.waitForFunction(() => /No matching loaded records within/.test(document.getElementById('search-status').textContent));
    s = await page.locator('#search-status').innerText();
    ok('the agreed empty-coordinate wording is used exactly',
      /No matching loaded records within 250 km; this does not establish absence\./.test(s), s);
    ok('Go-to is still offered with nothing nearby', await page.locator('#search-list button.res').count() === 1);
    ok('no cell-outline explanation is offered anywhere',
      !/cell outline/i.test(s + await page.locator('#search-notes').innerText()));
    const n0 = (await povs()).length;
    await page.click('#search-list button.res');
    const p = await povs();
    ok('Go-to moves the view', p.length === n0 + 1);
    ok('Go-to opens no inspector', await page.locator('#insp.show').count() === 0);
    ok('Go-to says what it did', /Moved the view/.test(await page.locator('#search-status').innerText()));

    // leading decimals must reach the globe as the place the user typed, not ten times it
    await search('.5, .5');
    await page.waitForFunction(() => /0\.500° N, 0\.500° E/.test(document.getElementById('search-status').textContent));
    ok('".5, .5" is shown as half a degree, not five degrees',
      /0\.500° N, 0\.500° E/.test(await page.locator('#search-status').innerText())
      && !/5\.000° N/.test(await page.locator('#search-status').innerText()));
    const nGo = (await povs()).length;
    await page.locator('#search-list button.res[data-go]').click();
    const goPov = (await povs()).slice(-1)[0];
    ok('and the camera is sent to 0.5, 0.5 — not 5, 5',
      (await povs()).length === nGo + 1 && goPov.v.lat === 0.5 && goPov.v.lng === 0.5, goPov.v);
    await search('-.5, 3');
    await page.waitForFunction(() => /0\.500° S/.test(document.getElementById('search-status').textContent));
    ok('"-.5, 3" stays in the southern hemisphere',
      /0\.500° S, 3\.000° E/.test(await page.locator('#search-status').innerText()));

    for (const [q, re] of [['95, 0', /outside −90 to 90/], ['0, 181', /outside −180 to 180/],
                           ['18.42E, 33.92S', /longitude first/i], ['-33.92S, 18.42E', /ambiguous/i],
                           ['1.2.3, 4', /1\.2\.3 is not a number/], ['--5, 3', /--5 is not a number/],
                           ['+-5, 3', /\+-5 is not a number/], ['5..5, 3', /5\.\.5 is not a number/]]) {
      await search(q);
      const st2 = await page.locator('#search-status').innerText();
      ok(`"${q}" refused with its reason and no results`,
        re.test(st2) && await page.locator('#search-list li').count() === 0, st2);
    }
    await search('33.92');
    ok('a lone number is searched as text and offers the coordinate order',
      /No matching loaded records/.test(await page.locator('#search-status').innerText())
      && /latitude first/i.test(await page.locator('#search-status').innerText()));
    await ctx.close();
  }

  // ------------------------------------------------- 4. a run is replaced: that layer's results die, others live
  {
    const { ctx, page, st, search, rows, povs } = await harness(browser);
    await page.click('#exp-btn');
    await search('a');                                     // refused: too short
    ok('a one-character query is refused with a reason',
      /at least 2 characters/.test(await page.locator('#search-status').innerText()));
    await search('ship');                                  // matches NO TIME SHIP (ships) only
    await page.waitForSelector('#search-list button.res');
    await search('o');                                     // noop guard
    await search('-33.92, 18.42');                          // coordinate search spans usgs + ships + firms
    await page.waitForSelector('#search-list button.res');
    const before = await rows();
    ok('results span more than one layer', new Set(before.filter(r => !r.go).map(r => r.layer)).size >= 2, before.map(r => r.layer));
    ok('nothing is dead to begin with', before.every(r => !r.dead), before);
    const povBefore = (await povs()).length;

    st.runs.usgs = RUN_B;                                   // ONLY earthquakes move on
    await page.clock.fastForward(ME_REFRESH_MS);   // fastForward, not runFor: runFor fires every intermediate animation frame and the software renderer then redraws the globe thousands of times
    await page.waitForFunction(run => window.ME && ME.pairState('usgs').usgs.cells === run, RUN_B, { timeout: 20000 });
    await page.waitForFunction(() => ME.searchState() && ME.searchState().dead.some(Boolean), null, { timeout: 20000 });

    const after = await rows();
    const q = after.filter(r => /earthquake/i.test(r.layer)), other = after.filter(r => !r.go && !/earthquake/i.test(r.layer));
    ok('the refreshed layer\'s results are invalidated', q.length > 0 && q.every(r => r.dead), q);
    ok('the layers that did NOT refresh keep working', other.length > 0 && other.every(r => !r.dead), other);
    ok('a dead row names both runs and says what to do',
      q.length > 0 && /found in the 05:50 UTC run; the page now shows the 05:58 UTC run — search again/.test(q[0].text), (q[0]||{}).text);
    ok('a dead row is marked for assistive tech',
      await page.locator('#search-list button.res.dead').first().getAttribute('aria-disabled') === 'true');

    await page.locator('#search-list button.res.dead').first().click({ force: true });   // aria-disabled blocks a normal click; force it to prove the handler also refuses
    ok('clicking a dead row moves no camera', (await povs()).length === povBefore);
    ok('clicking a dead row opens no inspector', await page.locator('#insp.show').count() === 0);
    ok('clicking a dead row explains the refusal',
      /Not opened — found in the 05:50 UTC run/.test(await page.locator('#search-status').innerText()),
      await page.locator('#search-status').innerText());

    const liveBtn = page.locator('#search-list button.res:not(.dead):not([data-go])').first();
    await liveBtn.click();
    ok('a surviving result from another layer still opens', await page.locator('#insp.show').count() === 1);
    ok('and it moved the camera', (await povs()).length === povBefore + 1);
    await ctx.close();
  }

  // ------------------------------------------------- 5. a switched-off layer: rows stay usable and say so; choosing one switches it on
  {
    const { ctx, page, search, rows, povs } = await harness(browser);
    await page.click('#exp-btn'); await search('-33.92, 18.42');
    await page.waitForSelector('#search-list button.res');
    await page.evaluate(() => document.querySelector('[data-layer="ships"]').click());
    await page.waitForFunction(() => ME.searchState().off.some(Boolean));
    let r = await rows();
    const ship = x => /ship/i.test(x.layer);
    ok('switching a layer off does not kill its results', r.some(ship) && r.every(x => !x.dead), r);
    ok('a switched-off layer\'s rows say the layer is off and what choosing does', r.filter(ship).every(x => /layer off — choosing this switches Ships on/.test(x.text)), r.filter(ship).map(x => x.text));
    ok('other layers\' rows carry no such line', r.filter(x => !x.go && !ship(x)).every(x => !/layer off/.test(x.text)), r);
    const n = (await povs()).length;
    await page.locator('#search-list button.res', { hasText: 'Ships' }).first().click();
    await page.waitForSelector('#insp.show');
    ok('choosing it switches the layer on through its own switch', await page.getAttribute('#tgl-ships', 'aria-checked') === 'true' && await page.evaluate(() => !document.getElementById('card-ships').classList.contains('off')));
    ok('…moves the view once and opens the record', (await povs()).length === n + 1 && await page.locator('#insp.show').count() === 1);
    ok('…and says that it switched the layer on', /Switched Ships on to show this result\./.test(await page.innerText('#search-status')), await page.innerText('#search-status'));
    r = await rows();
    ok('once on, the rows drop the "layer off" line', r.every(x => !/layer off/.test(x.text)), r);
    await ctx.close();
  }

  // ------------------------------------------------- 5b. bare start (index.html as on disk): hidden layers are searched; searching switches nothing on
  {
    const { ctx, page, search, rows, povs } = await harness(browser, { bare: true });
    const sw = () => page.evaluate(() => ['usgs', 'firms', 'ships', 'forest'].map(k => document.getElementById('tgl-' + k).getAttribute('aria-checked')).join());
    ok('bare: no core layer is on at load', await sw() === 'false,false,false,false', await sw());
    await page.click('#exp-btn'); await search('Volcano');
    await page.waitForFunction(() => ME.searchState());
    let r = await rows(), st = await page.evaluate(() => ME.searchState());
    ok('bare: a text query finds the earthquake although its layer is off', st.total === 1 && st.searched.includes('usgs') && r.length === 1 && /Volcano/.test(r[0].text) && !r[0].dead, [st, r]);
    ok('bare: the row says the layer is off and what choosing does', /layer off — choosing this switches Earthquakes on/.test(r[0].text), r[0] && r[0].text);
    ok('bare: the notes do not say a layer was left out for being hidden', !/layer hidden/.test(await page.innerText('#search-notes')), await page.innerText('#search-notes'));
    ok('bare: searching alone switches nothing on and moves nothing', await sw() === 'false,false,false,false' && (await povs()).length <= 1 && await page.evaluate(() => ME.keyState().drawn.length === 0), [await sw(), (await povs()).length]);
    const n = (await povs()).length;
    await page.locator('#search-list button.res').first().click();
    await page.waitForSelector('#insp.show');
    ok('bare: choosing the result switches Earthquakes on and nothing else', await sw() === 'true,false,false,false', await sw());
    ok('bare: …the Layers button counts one on and the first-view line is gone', await page.evaluate(() => ME.layers.state().n === 1 && document.getElementById('bare-hint').hidden));
    ok('bare: …the view moves once and the record opens', (await povs()).length === n + 1);
    ok('bare: …and the status says the layer was switched on', /Switched Earthquakes on to show this result\./.test(await page.innerText('#search-status')), await page.innerText('#search-status'));
    // coordinate search on a second bare page: ships and fires near the point are listed from hidden layers
    await page.evaluate(() => document.getElementById('tgl-usgs').click());
    await search('-33.92, 18.42'); await page.waitForFunction(() => ME.searchState() && ME.searchState().kind === 'coord');
    r = await rows(); st = await page.evaluate(() => ME.searchState());
    ok('bare: a coordinate query lists nearby records from every hidden record layer', ['usgs', 'ships', 'firms'].every(l => st.searched.includes(l)) && r.filter(x => !x.go).length >= 2 && r.filter(x => !x.go).every(x => /layer off/.test(x.text) && !x.dead), [st.searched, r.map(x => x.text)]);
    await page.locator('#search-list button.res[data-go]').click();
    ok('bare: "Go to" moves the view and switches nothing on', await sw() === 'false,false,false,false' && /No record was opened/.test(await page.innerText('#search-status')), await sw());
    await ctx.close();
  }

  // ------------------------------------------------- 6. keyboard
  {
    const { ctx, page, search } = await harness(browser);
    await page.click('#exp-btn'); await search('km');
    await page.waitForSelector('#search-list button.res');
    await page.press('#search-q', 'ArrowDown');
    ok('ArrowDown from the input enters the list', await page.evaluate(() => document.activeElement.classList.contains('res')));
    await page.keyboard.press('ArrowDown');
    ok('ArrowDown moves down', await page.evaluate(() => document.activeElement.dataset.i) === '1');
    await page.keyboard.press('ArrowUp');
    ok('ArrowUp moves up', await page.evaluate(() => document.activeElement.dataset.i) === '0');
    await page.keyboard.press('ArrowUp');
    ok('ArrowUp from the first row returns to the input', await page.evaluate(() => document.activeElement.id) === 'search-q');
    await page.press('#search-q', 'ArrowDown');
    await page.keyboard.press('Escape');
    ok('Escape in the list returns focus to the input', await page.evaluate(() => document.activeElement.id) === 'search-q');
    await page.keyboard.press('Escape');
    ok('Escape in a filled input clears the query and the results',
      await page.evaluate(() => document.getElementById('search-q').value) === ''
      && await page.locator('#search-list li').count() === 0
      && (await page.locator('#search-status').innerText()).trim() === '');
    await search('volcano');
    await page.waitForSelector('#search-list button.res');
    await page.press('#search-q', 'ArrowDown');
    await page.keyboard.press('Enter');
    ok('Enter on a row opens the inspector', await page.locator('#insp.show').count() === 1);
    await page.keyboard.press('Escape');
    ok('Escape with the inspector open closes the inspector and leaves the search alone',
      await page.locator('#insp.show').count() === 0 && await page.evaluate(() => document.getElementById('search-q').value) === 'volcano');
    await ctx.close();
  }

  // ------------------------------------------------- 7. reduced motion
  {
    const { ctx, page, search, povs } = await harness(browser, { reducedMotion: 'reduce' });
    await page.click('#exp-btn'); await search('volcano');
    await page.waitForSelector('#search-list button.res');
    const n0 = (await povs()).length;
    await page.click('#search-list button.res');
    const p = await povs();
    ok('reduced motion moves the camera instantly', p.length === n0 + 1 && p[p.length - 1].d === 0, p.slice(-1));
    await ctx.close();
  }

  // ------------------------------------------------- 8. no WebGL
  {
    const { ctx, page, search, povs } = await harness(browser, { noWebGL: true });
    ok('the plain-language WebGL fallback is shown', await page.locator('.globe-fail').count() === 1);
    await page.click('#exp-btn'); await search('volcano');
    await page.waitForSelector('#search-list button.res');
    ok('search still works with no globe', await page.locator('#search-list button.res').count() === 1);
    await page.click('#search-list button.res');
    ok('selecting opens the inspector and does not throw', await page.locator('#insp.show').count() === 1);
    ok('no camera call reaches a real globe when WebGL is missing', (await povs()).length === 0, await povs());
    ok('selecting without a globe says the view did not move, and the record is open',
      /globe is unavailable/i.test(await page.locator('#search-status').innerText())
      && /did not move/i.test(await page.locator('#search-status').innerText()),
      await page.locator('#search-status').innerText());

    // Go to: must NOT report a movement it cannot perform
    await search('-33.92, 18.42');
    await page.waitForSelector('#search-list button.res[data-go]');
    const go = page.locator('#search-list button.res[data-go]');
    ok('the Go-to row says up front that the globe is unavailable',
      /globe is unavailable/i.test(await go.innerText()), (await go.innerText()).replace(/\n+/g, ' | '));
    ok('the Go-to row is marked unavailable for assistive tech', await go.getAttribute('aria-disabled') === 'true');
    await go.click({ force: true });
    const st = await page.locator('#search-status').innerText();
    ok('clicking Go-to never claims the view moved', !/moved the view/i.test(st), st);
    ok('clicking Go-to explains that the globe is unavailable', /globe is unavailable/i.test(st), st);
    ok('and it still points at the records that can be opened', /can still be opened/i.test(st), st);
    ok('no camera call was made', (await povs()).length === 0);
    // record search and inspection stay usable
    const recRows = page.locator('#search-list button.res:not([data-go])');
    ok('records near the coordinate are still listed without a globe', await recRows.count() >= 2, await recRows.count());
    const recBtn = recRows.first();
    await recBtn.click();
    ok('and a record still opens in the inspector', await page.locator('#insp.show').count() === 1);
    await ctx.close();
  }

  // ------------------------------------------------- 9. phone: cap, true total, one scrolling surface
  {
    const titles = Array.from({ length: 30 }, (_, i) => `Volcano site ${i}, Hawaii`);
    const { ctx, page, search } = await harness(browser, { viewport: { width: 390, height: 844 }, isMobile: true, quakeTitles: titles });
    await page.click('#exp-btn'); await search('volcano');
    await page.waitForSelector('#search-list button.res');
    ok('capped at 12 rows', await page.locator('#search-list button.res').count() === 12);
    const s = await page.locator('#search-status').innerText();
    ok('the true total is stated alongside the cap', /30 matches/.test(s) && /showing the first 12/.test(s), s);
    const nested = await page.evaluate(() => ['#search-list', '#search-results', '.exp-body', '#card-explore', '.rnotes']
      .map(q => document.querySelector(q)).filter(Boolean)
      .filter(e => { const o = getComputedStyle(e).overflowY; return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1; })
      .map(e => e.id || e.className));
    ok('no scrollbar nested inside the sheet scroller', nested.length === 0, nested);
    ok('every row is at least 44 px tall',
      await page.evaluate(() => [...document.querySelectorAll('#search-list button.res')].filter(b => b.getBoundingClientRect().height < 44).length) === 0);
    ok('the input is at least 44 px tall',
      await page.evaluate(() => document.getElementById('search-q').getBoundingClientRect().height >= 44));
    ok('the panel does not overflow horizontally',
      await page.evaluate(() => { const e = document.getElementById('card-explore'); return e.scrollWidth - e.clientWidth <= 1; }));
    ok('the sheet itself is the scroller',
      await page.evaluate(() => { const e = document.getElementById('sheet-scroll'); return getComputedStyle(e).overflowY === 'auto'; }));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

