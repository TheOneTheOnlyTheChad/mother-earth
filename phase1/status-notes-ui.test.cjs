/* Mother Earth — hub 0.6.10 /status without run notes: the UNCHANGED globe page against both hubs (STATUS-RUN-NOTES-PROPOSAL rev 2 §5.2).
 *
 * The page files (index.html, app.js) are served from the clone as they are. /status is answered by the REAL hub code, run
 * in-process over a real SQLite D1 (schema.sql) seeded with an orbital run row that carries a marker note:
 *   - candidate: phase1/worker.js (0.6.10; last_runs carry no note)
 *   - control:   worker.js at 143f531 (0.6.9, live today; its orbital row DOES return the note — asserted, so the control is real)
 * The orbital snapshot and element file are the orbital-browser fixtures (built by the hub's own orbBuild), as in that suite.
 * Two cases, each on both hubs, with the rendered orbital panel text compared:
 *   A. missing snapshot (/snapshot/orbital 404) + a failed orbital run → the usual unavailable message
 *   B. usable snapshot + a NEWER failed orbital run → the previous-file freshness line
 *
 * Needs:  python3 -m http.server 8899 --bind 127.0.0.1   in the clone
 *         /home/claude/spike: npm i globe.gl@2.45.0 satellite.js@6.0.2 ;  node phase1/orbital-fixture.build.mjs
 *         git history back to 143f531 (git fetch --depth=10 origin main)
 * Run:    NODE_PATH=/opt/npm-tools/node_modules node phase1/status-notes-ui.test.cjs [fixture dir]
 */
const { chromium } = require('playwright');
const fs = require('fs'); const os = require('os'); const path = require('path'); const { execFileSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite'); const { pathToFileURL } = require('url');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const DIR = process.argv[2] || '/home/claude/fixtures';
const CSV = fs.readFileSync(DIR + '/orbital.csv', 'utf8');
const META = JSON.parse(fs.readFileSync(DIR + '/orbital-meta.json', 'utf8'));
const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const RUN = '2026-11-03T13:50:00Z', CALC_AT = '2026-11-03T13:50:00.000Z';
const MARK = 'MKR-orbital-a1';
const ORB_ROW = ['orbital', '2026-11-03T15:41:04.000Z', '2026-11-03T15:41:20.000Z', 'down', 500, 0, 0, MARK + ' GP HTTP 500'];

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 400)}` : ''}`); } };
setTimeout(() => { console.log('FAIL  suite exceeded its 8 min budget'); process.exit(1); }, 8 * 60e3);

async function loadWorker(src, tag) {
  const f = path.join(os.tmpdir(), `status-notes-ui-${tag}-${process.pid}.mjs`); fs.writeFileSync(f, src);
  try { return (await import(pathToFileURL(f).href)).default; } finally { fs.unlinkSync(f); }
}
function hubEnv() {
  const db = new DatabaseSync(':memory:'); db.exec(SCHEMA);
  db.prepare('INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)').run(...ORB_ROW);
  const prep = sql => { const mk = args => ({ sql,
    async run() { db.prepare(sql).run(...args); return { meta: {} }; }, async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args).map(x => ({ ...x })) }; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const DB = { prepare: prep, async batch(st) { const o = []; for (const s of st) o.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : (await s.run(), { results: [] })); return o; } };
  const R2 = { async get() { return null; }, async head() { return null; }, async put() { return {}; }, async delete() {}, async list() { return { objects: [], truncated: false }; } };
  return { DB, R2, ADMIN_KEY: 'admin-key-0123456789abcdef' };
}

async function run(browser, worker, metaStatus) {
  const env = hubEnv(); const statusBodies = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(start => { const R = Date, off = start - R.now(); class F extends R { constructor(...a) { if (a.length === 0) super(R.now() + off); else super(...a); } static now() { return R.now() + off; } } globalThis.Date = F; }, Date.parse(CALC_AT));
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }));
  for (const h of ['**/space-track.org/**', '**/celestrak.org/**', '**/gibs.earthdata.nasa.gov/**']) await ctx.route(h, r => r.abort());
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(HUB + '/**', async route => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/status') {   // the REAL hub code answers
      const r = await worker.fetch(new Request('https://hub/status'), env); const body = await r.text(); statusBodies.push(body);
      return route.fulfill({ status: r.status, contentType: 'application/json', body, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    if (p === '/snapshot/orbital') return metaStatus !== 200 ? route.fulfill({ status: metaStatus, contentType: 'application/json', body: '{"error":"no snapshot yet"}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(META) });
    if (p === '/elements/orbital') return route.fulfill({ status: 200, contentType: 'text/csv', body: CSV, headers: { 'X-Elements-SHA256': META.elements.sha256, 'Access-Control-Expose-Headers': 'X-Elements-SHA256' } });
    if (p === '/snapshot/satellites' || p === '/elements/satellites') return route.fulfill({ status: 404, body: '{}' });
    const body = { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.orbState, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.click('#orb-tgls [data-g="rocket_body"]');
  await page.waitForFunction(() => { const s = ME.orbState(); return (s.on.includes('rocket_body') && s.last.rocket_body) || (!s.busy && s.why); }, null, { timeout: 90000 });
  await page.waitForTimeout(300);
  const lines = await page.locator('#orb-lines').innerText();
  const card = await page.locator('#card-orb').innerText();
  const domHasMark = await page.evaluate(m => document.documentElement.outerHTML.includes(m), MARK);
  const s = await page.evaluate(() => { const x = ME.orbState(); return { why: x.why, drawn: !!(x.layers.rocket_body && x.layers.rocket_body.visible) }; });
  await ctx.close();
  return { lines, card, domHasMark, statusBodies, perr, ...s };
}

(async () => {
  const cand = await loadWorker(fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8'), 'cand');
  const ctrl = await loadWorker(execFileSync('git', ['-C', path.join(__dirname, '..'), 'show', '143f531:phase1/worker.js'], { encoding: 'utf8' }), 'ctrl');
  // loosened for dustrgb-rc: index.html gains the Dust RGB card, so only app.js (which reads /status) stays pinned to the 0.6.10 release
  ok('page file index.html still loads the same app.js build as main 143f531', (m => m && execFileSync('git', ['-C', path.join(__dirname, '..'), 'show', '143f531:index.html'], { encoding: 'utf8' }).includes(m[0]))(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/app\.js\?v=\d+/)));
  for (const f of ['app.js']) ok(`page file ${f} unchanged from main 143f531`, fs.readFileSync(path.join(__dirname, '..', f), 'utf8') === execFileSync('git', ['-C', path.join(__dirname, '..'), 'show', '143f531:' + f], { encoding: 'utf8' }));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rowOf = b => (JSON.parse(b).last_runs || []).find(x => x.layer === 'orbital');
  for (const [name, metaStatus] of [['A missing snapshot', 404], ['B usable snapshot + newer failed run', 200]]) {
    const c = await run(browser, cand, metaStatus), o = await run(browser, ctrl, metaStatus);
    ok(`${name}: control 0.6.9 really returned the seeded note in its orbital row`, o.statusBodies.length > 0 && o.statusBodies.every(b => (rowOf(b) || {}).note === ORB_ROW[7]), o.statusBodies.map(rowOf));
    ok(`${name}: candidate 0.6.10 orbital row has no note, same six fields as seeded`, c.statusBodies.length > 0 && c.statusBodies.every(b => { const r = rowOf(b); return r && !('note' in r) && r.status === 'down' && r.http_status === 500 && r.started_at === ORB_ROW[1]; }), c.statusBodies.map(rowOf));
    const norm = t => t.replace(/Positions propagated for [0-9: -]+ UTC/g, 'Positions propagated for <t> UTC').replace(/\d+ (s|min) ago/g, '<age>');   // propagation time advances in real time between the two loads
    ok(`${name}: rendered orbital panel text identical on both hubs (propagation time normalised)`, norm(c.lines) === norm(o.lines) && norm(c.card) === norm(o.card), { cand: c.lines.slice(0, 300), ctrl: o.lines.slice(0, 300) });
    ok(`${name}: marker never in the page DOM (either hub)`, !c.domHasMark && !o.domHasMark);
    ok(`${name}: no page errors`, !c.perr.length && !o.perr.length, [...c.perr, ...o.perr]);
    if (metaStatus === 404) {
      ok('A: the usual unavailable message', c.lines.trim() === 'Orbital layers not shown: the hub has no orbital element file yet.', c.lines);
      ok('A: layer not drawn', !c.drawn);
    } else {
      ok('B: previous-file freshness line', /Latest refresh 2026-11-03 15:41 UTC failed \(down\); showing the previous file, retrieved 2026-11-03 13:42 UTC/.test(c.lines), c.lines.slice(0, 300));
      ok('B: layer still draws', c.drawn);
    }
  }
  await browser.close();
  console.log(`\nstatus-notes-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + (e && e.stack || e)); process.exit(1); });
