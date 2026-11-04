/* Mother Earth — UX round 1 structure suite (4 Nov 2026).
 * What it proves: the page STRUCTURE the UX spec asks for — evidence labels, the optional-layers group,
 * Explore's contents, what stays visible, the storage wording and the removed "only computed" claim.
 * What it does NOT prove: data rendering, inspector contents with live records, or that external source
 * links resolve (those are checked on the live page). The hub is routed to 404, so every layer fails safely.
 * Needs: python3 -m http.server 8899 --bind 127.0.0.1 running in the clone.
 * Run: node phase1/ux-round1.test.cjs   (run it against main's build to see it fail) */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8899';
let pass = 0, fail = 0;
// probes that read '' / null when an element is missing, so an old build reports FAILs instead of timing out
const T = async l => (await l.count()) ? (await l.first().textContent()) : '';
const A = async (l, a) => (await l.count()) ? l.first().getAttribute(a) : null;
const B = async l => (await l.count()) ? l.first().boundingBox() : null;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL ', name, info === undefined ? '' : JSON.stringify(info)); } };

(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 390, h: 844, tag: 'phone 390' }, { w: 360, h: 780, tag: 'phone 360' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage(); page.setDefaultTimeout(2000);
    await page.route(/workers\.dev|unpkg\.com|gibs\.earthdata|fonts\.g/, r => r.fulfill({ status: 404, body: '' }));
    await page.goto(BASE + '/index.html'); await page.waitForTimeout(800);
    const t = vp.tag;

    if (vp.tag === 'desktop') {
      // §7 evidence labels: every observation card carries a text label; computed context says Computed; nothing says Projected
      for (const id of ['usgs', 'firms', 'ships', 'forest', 'drifters', 'swpc', 'co2', 'seaice'])
        ok(`${id}: Observed label with a qualifier`, /^Observed\s+\S/.test((await T(page.locator(`#card-${id} .evl`))).trim()));
      ok('forest qualifier says source-interpreted, not ground-verified', /satellite-derived alerts.*not ground-verified/.test(await T(page.locator('#card-forest .evl'))));
      ok('orbital labelled Computed, from published orbital elements', /Computed/.test(await T(page.locator('#orb-h'))) && /calculated from published orbital elements/.test(await T(page.locator('#card-orb .evl'))));
      ok('day/night labelled Computed', /Computed/.test(await T(page.locator('.opt-night .ovl-h'))));
      ok('no Projected label anywhere', !/Projected/i.test(await T(page.locator('body'))));
      // §6 one optional group, three independent controls, no group toggle
      const g = page.locator('#card-optional');
      ok('optional group holds drifters, day/night and orbital', await g.locator('#card-drifters').count() === 1 && await g.locator('#tgl-night').count() === 1 && await g.locator('#card-orb').count() === 1);
      ok('no group toggle', await g.locator(':scope > button, .opt-head button').count() === 0);
      ok('every optional control off on load', await A(page.locator('#card-drifters button.tgl'), 'aria-pressed') === 'false' && await A(page.locator('#tgl-night'), 'aria-checked') === 'false' && (await page.locator('#orb-tgls [aria-checked="true"]').count()) === 0);
      ok('core layers still on by default', (await page.locator('#card-usgs button.tgl, #card-firms button.tgl, #card-ships button.tgl, #card-forest button.tgl').evaluateAll(bs => bs.every(b => b.getAttribute('aria-pressed') === 'true'))));
      // §4 Explore: search, scope, two jump buttons; no overlays; sits after the core cards, before the optional group in reading order
      ok('Explore keeps search, scope and both jump buttons, no overlays', await page.locator('#card-explore #search-form').count() === 1 && await page.locator('#card-explore #find-usgs, #card-explore #find-firms').count() === 2 && await page.locator('#card-explore .ovl').count() === 0);
      const order = await page.evaluate(() => { const a = ['card-forest', 'card-explore', 'card-optional'].map(id => document.getElementById(id)); return a.every(Boolean) ? a.map((e, i) => i === 0 || (a[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) > 0) : [false]; });
      ok('reading order: core cards → Explore → optional layers', order.every(Boolean));
      // §4 attribution: full current text stays visible (placement question unresolved), and not over the globe
      const cred = page.locator('#credits');
      ok('credits visible with the LANCE acknowledgment', await cred.isVisible() && /We acknowledge the use of data and\/or imagery from NASA's Land, Atmosphere Near real-time Capability/.test(await T(cred)));
      const gb = await B(page.locator('#globe')), cb = await B(cred);
      ok('credits sit below the globe, not over it', !!(gb && cb) && cb.y >= gb.y + gb.height - 1, { globeBottom: gb.y + gb.height, creditsTop: cb.y });
      // FIRMS: NASA's local-scale line is a condition of the register row — must be visible, not behind a disclosure
      ok('FIRMS NASA caveat visible without a click', await page.locator('#card-firms .cav').isVisible() && /not for tactical or local-scale decisions/.test(await T(page.locator('#card-firms .cav'))));
      // legend: swatches visible, coverage key behind a closed disclosure
      ok('legend coverage key collapsed by default', (await page.locator('#legend details.covkey').count()) === 1 && await page.locator('#legend details.covkey').evaluate(d => !d.open));
      ok('no horizontal scroll (desktop)', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))   // +1: sub-pixel rounding, same tolerance as drifters-ui (main measures 391 at 390 too);
    } else {
      ok(`${t}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))   // +1: sub-pixel rounding, same tolerance as drifters-ui (main measures 391 at 390 too);
      if (await page.locator('#sheet-scroll .credits.m').count()) await page.locator('#sheet-scroll .credits.m').scrollIntoViewIfNeeded();
      ok(`${t}: acknowledgment reachable at the end of the readings sheet`, await page.locator('#sheet-scroll .credits.m').isVisible() && /LANCE/.test(await T(page.locator('#sheet-scroll .credits.m'))));
      const small = await page.locator('button.tgl, .ovl-tgl, #exp-btn').evaluateAll(bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).length);
      ok(`${t}: every switch at least 44 px tall`, small === 0, small);
    }
    await ctx.close();
  }
  // §10 storage wording + the computed-exclusivity defect, on Sources & Details
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } }); const page = await ctx.newPage();
    await page.route(/workers\.dev|fonts\.g/, r => r.fulfill({ status: 404, body: '' }));
    await page.goto(BASE + '/sources.html'); await page.waitForTimeout(800);
    const txt = await T(page.locator('body'));
    ok('"What Mother Earth keeps" section present', await page.locator('#kept').count() === 1 && /None of it is shown on this site yet/.test(txt));
    ok('kept rows say "no end date set" and the 2-day raw window', /no end date set/.test(txt) && /2 days, then deleted/.test(txt));
    ok('drifters, orbital and sea ice listed as current file only', /Drifting buoys, orbital objects, sea ice/.test(txt));
    ok('day/night no longer claimed as the only computed thing', !/only thing on this page that is computed/.test(txt));
    ok('no "baselines accumulate" phrasing left', !/baselines? accumulat/i.test(txt));
    await ctx.close();
  }
  await browser.close();
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
