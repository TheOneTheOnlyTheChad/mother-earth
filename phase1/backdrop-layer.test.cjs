/* GIBS backdrop layer (8 Nov 2026): the page requests NOAA-21 true colour for ME.IMG_DAY, and every place that names the
 * imagery says NOAA-21 and the date (desktop label, phone chip, phone Key sentence, Sources). The fire detections stay
 * labelled NOAA-20 (a different satellite). On phones the chip must show "not live" un-clipped.
 * Run: node --no-warnings phase1/backdrop-layer.test.cjs   (8899 server + /home/claude/spike, as the other suites) */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const WANT = 'VIIRS_NOAA21_CorrectedReflectance_TrueColor';
// The public page loads IBM Plex Mono + Barlow Condensed; serve the real faces (as desktop-overflow does) so chip widths are real.
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const FONT_CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 4 min'); process.exit(1); }, 4 * 60e3);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (path, viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' }); const gibs = [];
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => { gibs.push(r.request().url()); r.abort(); });
    await ctx.route(HUB + '/**', r => r.fulfill({ status: 503, body: '{}' }));
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2500); return { ctx, page, gibs, perr };
  };

  // ---- desktop World View
  { const { ctx, page, gibs, perr } = await open('/index.html', { width: 1280, height: 860 });
    const r = await page.evaluate(() => ({ day: ME.IMG_DAY, label: ME.IMG_LABEL, layer: ME.IMG_LAYER, long: document.querySelector('.img-long').textContent,
      full: document.getElementById('img-full').textContent, firms: document.getElementById('m-firms').textContent }));
    ok('desktop: exactly one GIBS request', gibs.length === 1, gibs);
    const u = gibs[0] ? new URL(gibs[0]) : null;
    ok('desktop: GIBS request asks for NOAA-21 true colour', u && u.searchParams.get('LAYERS') === WANT, u && u.searchParams.get('LAYERS'));
    ok('desktop: GIBS request date = ME.IMG_DAY', u && u.searchParams.get('TIME') === r.day, [u && u.searchParams.get('TIME'), r.day]);
    ok('desktop: request format unchanged (EPSG:4326 2048×1024 jpeg)', u && u.searchParams.get('CRS') === 'EPSG:4326' && u.searchParams.get('WIDTH') === '2048' && u.searchParams.get('HEIGHT') === '1024' && u.searchParams.get('FORMAT') === 'image/jpeg');
    ok('desktop: label names VIIRS NOAA-21, the date and "not live"', /VIIRS NOAA-21/.test(r.long) && r.long.includes(r.label) && /not live/.test(r.long), r.long);
    ok('desktop: no imagery text still says NOAA-20', !/NOAA-20/.test(r.long) && !/NOAA-20/.test(r.full), [r.long, r.full]);
    // GPT review 8 Nov: no "previous day" (now − 36 h can be two days back), no categorical cause of dark areas
    const BAD = /previous day|polar night|not missing data|gaps in the satellite/i;
    ok('desktop: label says "dated, not live" and makes no categorical claim about dark areas', /dated, not live/.test(r.long) && !BAD.test(r.long) && /cause of gaps not established/.test(r.long), r.long);
    const help = await page.evaluate(() => document.body.innerText);
    ok('desktop: day/night help text no longer says the imagery is "from a previous day"', !/from a previous day/i.test(help));
    ok('desktop: fire detections still labelled NOAA-20 (different satellite, unchanged)', /VIIRS NOAA-20/.test(r.firms), r.firms);
    ok('desktop: no page errors', perr.length === 0, perr);
    await ctx.close(); }

  // ---- phones: chip shows date · NOAA-21 · not live, un-clipped; Key sentence carries it
  for (const [w, h] of [[360, 780], [390, 844], [430, 932]]) {
    const { ctx, page, perr } = await open('/index.html', { width: w, height: h });
    const c = await page.evaluate(() => { const d = document.getElementById('imgdate'), s = d.querySelector('.img-short');
      return { shown: getComputedStyle(s).display !== 'none', text: s.textContent, clipped: d.scrollWidth > d.clientWidth + 1, need: d.scrollWidth, have: d.clientWidth,
        font: getComputedStyle(d).fontFamily, plex: document.fonts.check('10px "IBM Plex Mono"'), full: document.getElementById('img-full').textContent }; });
    ok(`${w}px: chip visible with date, NOAA-21 and "not live"`, c.shown && /\d\d \w{3}/.test(c.text) && /NOAA-21/.test(c.text) && /not live/.test(c.text), c.text);
    ok(`${w}px: chip not clipped (no ellipsis)`, !c.clipped, c);
    ok(`${w}px: Key sentence names VIIRS NOAA-21`, /VIIRS NOAA-21/.test(c.full) && /not live/.test(c.full), c.full);
    ok(`${w}px: no page errors`, perr.length === 0, perr);
    await ctx.close(); }

  // ---- Sources & Details
  { const { ctx, page, perr } = await open('/sources.html', { width: 1280, height: 860 });
    const t = await page.evaluate(() => document.body.innerText);
    ok('sources: imagery credit names VIIRS NOAA-21', /NASA GIBS, VIIRS NOAA-21 true colour/.test(t), (t.match(/Imagery[^\n]{0,120}/) || [''])[0]);
    const tier = await page.evaluate(() => ME.TIER.gibs), row = await page.evaluate(() => (ME.rules(ME.readings()).find(x => x.section === 'imagery') || {}).v || '');
    ok('sources: imagery tier = "imagery (dated; not live)"', tier === 'imagery (dated; not live)', tier);
    ok('sources: imagery explanation is qualified (may reflect…; cause not established; fires use NOAA-20 separately)', /Dark areas may reflect insufficient sunlight or unavailable imagery; the cause of individual gaps has not been established/.test(row) && /Fire detections use NOAA-20 separately/.test(row) && /VIIRS NOAA-21/.test(row) && !/previous day|polar night|not missing data|gaps in the satellite/i.test(row), row);
    ok('sources: no "previous day" anywhere on the page', !/previous day/i.test(t));
    ok('sources: no page errors', perr.length === 0, perr);
    await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`backdrop-layer: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed', e); process.exit(1); });
