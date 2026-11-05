/* "What Mother Earth keeps" follows what the hub REPORTS it retains (GET / → history: {enabled, since}), so the public wording
 * changes when retention changes — not before, not after a trial. Three hub states: off, on (with since), unreadable.
 * Checks Sources & Details (#kept rows + state line + comparison table) and World View (cell inspector "Comparison" row).
 * Run: node --no-warnings phase1/kept-ui.test.cjs   (8899 server + /home/claude/spike, as the other suites) */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 4 min'); process.exit(1); }, 4 * 60e3);
const RUN = new Date(Date.now() - 60e3).toISOString();
const usgs = { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['q1', -33.9, 18.4, 10, 3.1, 'ml', RUN, 'M 3.1', '']], cells: { '14_49': { count: 1, coverage: { grade: 'partial', evidence: 'e', observed_fraction: 1 } } } };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (path, root) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', route => { const p = new URL(route.request().url()).pathname;
      if (p === '/') return root === 'down' ? route.fulfill({ status: 503, body: '{}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'x', history: root }) });
      if (p === '/snapshot/usgs' || p === '/cells/usgs') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usgs) });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null }) }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); return { ctx, page, perr };
  };
  const sources = async root => { const { ctx, page, perr } = await open('/sources.html', root);
    await page.waitForFunction(() => !/reading the hub/.test(document.getElementById('kept-state').textContent), null, { timeout: 20000 });
    const r = await page.evaluate(() => ({ state: document.getElementById('kept-state').textContent, on: [...document.querySelectorAll('#t-kept .hist-on')].filter(x => !x.hidden).length, off: [...document.querySelectorAll('#t-kept .hist-off')].filter(x => !x.hidden).length, cmp: document.getElementById('t-cmp').textContent }));
    await ctx.close(); return { ...r, perr }; };
  let r = await sources({ enabled: false });
  ok('off: state line says off (reported by the hub); no history row shown; "current file only" row shown', /History retention: off \(reported by the hub\)/.test(r.state) && r.on === 0 && r.off === 1, r);
  ok('off: comparison table keeps the base wording', /hourly per-cell counts kept since 30 Oct 2026/.test(r.cmp) && !/every revision/.test(r.cmp), r.cmp.slice(0, 300));
  r = await sources({ enabled: true, since: '2026-11-06T08:00:00.000Z' });
  ok('on: state line says on with the first retained record time; all 7 history rows shown; the "current file only" base row hidden', /History retention: on .*2026-11-06 08:00 UTC/.test(r.state) && r.on === 7 && r.off === 0, r);
  ok('on: comparison wording names what is now kept and since when', /every revision of every event we receive/.test(r.cmp) && /history retention since 2026-11-06/.test(r.cmp), r.cmp.slice(0, 400));
  r = await sources('down');
  ok('hub unreadable: says so; history rows NOT shown (never claims retention it cannot confirm)', /could not be read/.test(r.state) && r.on === 0, r);
  ok('sources: no page errors', r.perr.length === 0, r.perr);
  // World View: cell inspector Comparison row
  for (const [root, re, name] of [[{ enabled: false }, /none of ours shown yet — hourly per-cell counts kept since 30 Oct 2026$/, 'off'], [{ enabled: true, since: '2026-11-06T08:00:00.000Z' }, /every revision of every event we receive.*history retention since 2026-11-06/, 'on']]) {
    const { ctx, page, perr } = await open('/index.html', root);
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.HISTORY !== null, null, { timeout: 30000 });
    await page.evaluate(() => ME.openCell('usgs', '14_49')); await page.waitForTimeout(200);
    const cmp = await page.evaluate(() => { const dt = [...document.querySelectorAll('#insp-dl dt')].find(d => d.textContent === 'Comparison'); return dt ? dt.nextElementSibling.textContent : null; });
    ok(`World View (${name}): the cell's Comparison row follows the hub's history state`, re.test(cmp || ''), cmp);
    ok(`World View (${name}): no page errors`, perr.length === 0, perr); await ctx.close();
  }
  await browser.close(); clearTimeout(wd); console.log(`\nkept-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
