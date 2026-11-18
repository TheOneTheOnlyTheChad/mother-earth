/* Ships after a failed or overlong attempt: the page (ships-retain-rc; docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md rev 2.1, Parts B and C).
 * The REAL page in Chromium against responses the REAL hub code produced: worker.js runs in this process on an in-memory R2
 * (conditional writes), is fed the Mac's envelopes through /ingest/ships, and answers the page's own /cells/ships,
 * /snapshot/ships and /place requests. Nothing is hand-written between the hub's rule and the page's wording.
 * What it proves: after a failure or an overlong sample the card still shows the retained sample's vessels, reads "degraded",
 * and says which attempt was not shown (elapsed and window from the attempt) and which sample is shown (its own time); the
 * same sentence reaches the report, the Sources page, the cell inspector and the place row; nothing to keep → no sample is
 * claimed; a retained sample three hours old → unknown as before; records and counts from different runs → no ships drawn,
 * no count, "ship positions not shown"; recovery clears the note; this page on the previous hub, and the previous page on
 * this hub, both behave.
 * What it does NOT prove: real phone, screen reader, the live hub.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/ships-retain-ui.test.cjs
 *      (needs git history to 155af90 for the previous hub and page: git fetch --depth=60 origin main)
 * Breaks (each must fail): BREAK=no-attempt|n-from-sample|time-from-attempt|no-pair-check|draw-unpaired-cells|attempt-when-down|attempt-renews-life|report-silent */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), cp = require('child_process'); const { pathToFileURL } = require('url');
const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'), HUB = 'https://mother-earth.chadoberholzer.workers.dev', OLD = '155af90';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 12 min'); process.exit(1); }, 12 * 60e3);
const BREAKS = {
  'no-attempt': ['app.js', "  const la = s && s.last_attempt;\n  if (!la || typeof la.run", "  const la = null;\n  if (!la || typeof la.run"],
  'n-from-sample': ['app.js', "`Latest sample ran ${secs(la.elapsed_s)} against a ${secs(la.window_s)} window and is not shown.`", "`Latest sample ran ${secs(s.elapsed_wall_s)} against a ${secs(s.window_s)} window and is not shown.`"],
  'time-from-attempt': ['app.js', "ME.shipsSampleTime = s => { const t = (s && (s.window_end || s.retrieved_at)) || '',", "ME.shipsSampleTime = s => { const t = (s && s.last_attempt && s.last_attempt.run) || '',"],
  'no-pair-check': ['index.html', "shipsHidden = !!shipsNote && !shipsShown;", "shipsHidden = false;"],
  'draw-unpaired-cells': ['index.html', "    if (layer === 'ships' && fresh.attempt && !usable('ships')) continue;\n", ''],
  'attempt-when-down': ['app.js', "|| s.source_status === 'down' || !Number.isFinite(Date.parse(s.retrieved_at))) return '';", "|| !Number.isFinite(Date.parse(s.retrieved_at))) return '';"],
  'attempt-renews-life': ['app.js', "  const ageS = (Date.now() - Date.parse(snap.retrieved_at)) / 1000;", "  const ageS = (Date.now() - Date.parse(layer === 'ships' && snap.last_attempt && snap.last_attempt.at ? snap.last_attempt.at : snap.retrieved_at)) / 1000;"],
  'report-silent': ['app.js', "${R.ships.fresh.attempt ? ' — ' + R.ships.fresh.attempt.replace(/\\.$/, '').replace(/^Latest/, 'latest') : ''}", ''],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const START = "const START_ON = [];", SHIPS_ON = "const START_ON = ['ships'];";
const served = (f, text) => { let t = text; if (f === 'index.html') { if (t.split(START).length !== 2) { console.log('FAIL  START_ON = [] not found'); process.exit(1); } t = t.replace(START, SHIPS_ON); }
  if (BREAK && BREAKS[BREAK][0] === f) { const [, a, b] = BREAKS[BREAK]; if (t.split(a).length !== 2) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } t = t.replace(a, b); } return t; };
const gitShow = spec => cp.execFileSync('git', ['-C', ROOT, 'show', spec], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();

// ---------- the hub: real worker.js on an in-memory R2 with conditional writes
const enc = new TextEncoder(), dec = new TextDecoder(); let seq = 0;
function makeEnv() {
  const m = new Map();
  const obj = (k, v) => ({ key: k, size: v.b.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new Date(), customMetadata: v.meta || {}, httpMetadata: {} });
  const R2 = { async put(k, value, o = {}) { const cur = m.get(k), c = o.onlyIf; if (c && c.etagDoesNotMatch === '*' && cur) return null; if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
      const v = { b: enc.encode(String(value)), etag: 'u' + (++seq), meta: o.customMetadata || {} }; m.set(k, v); return obj(k, v); },
    async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
    async get(k) { const v = m.get(k); if (!v) return null; return { ...obj(k, v), body: new Blob([v.b]).stream(), async text() { return dec.decode(v.b); }, async json() { return JSON.parse(dec.decode(v.b)); } }; },
    async delete(k) { m.delete(k); }, async list() { return { objects: [], truncated: false }; } };
  const stmt = () => { const x = () => ({ async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: () => x(), ...x() }; };
  return { env: { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', INGEST_KEY: 'ik' }, m, json: k => { const v = m.get(k); return v ? JSON.parse(dec.decode(v.b)) : null; },
    set: (k, o) => m.set(k, { b: enc.encode(JSON.stringify(o)), etag: 'u' + (++seq), meta: {} }) };
}
const FIELDS = ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'];
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`, iso = ms => new Date(ms).toISOString(), hm = ms => iso(ms).slice(11, 16) + ' UTC';
const COV = { grade: 'partial', evidence: 'messages_flowing_inferred_from_arrival_gaps', observed_fraction: 1 };
function sample(runMs, n, o = {}) { const endMs = runMs + (o.elapsedS || 60) * 1000, t = iso(endMs);
  const records = Array.from({ length: n }, (_, i) => [String(100000 + i), i === 0 ? -33.9 : -60 + (i % 100), i === 0 ? 18.4 : -170 + (i % 300), t, t, 1, 2, 3, 0, 'A', 'V' + i]);
  const cells = {}; for (const r of records) { const k = cellOf(r[1], r[2]); (cells[k] = cells[k] || { count: 0, coverage: { ...COV } }).count++; }
  return { schema_version: 1, collector_version: 'mac-0.3.5', layer: 'ships', window_start: iso(runMs), window_end: t, retrieved_at: t, scheduled_for: iso(runMs), source_status: o.status || 'ok', interruptions: [], cells, record_format: 'rows', record_fields: FIELDS, records,
    coverage_default: COV, quantity: 'vessel identities in a 60 s AIS sample', window_s: 60, elapsed_wall_s: o.elapsedS || 60.1, messages_flowing_s: o.flowS ?? 58, connection_fraction_of_sample: (o.flowS ?? 58) / 60, overlong_sample: !!o.overlong, stale_after_s: 10800, class_a: n, class_b: 0, socket_connected_s: 59, endMs }; }
const down = (runMs, note) => ({ schema_version: 1, collector_version: 'mac-0.3.5', layer: 'ships', retrieved_at: iso(runMs + 18000), scheduled_for: iso(runMs), source_status: 'down', cells: {}, note });

let BASE, worker, oldWorker;
const post = async (W, E, body) => { const b = { ...body }; delete b.endMs; const r = await W.fetch(new Request('https://hub/ingest/ships', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ik', 'User-Agent': 'mother-earth-mac-0.3.5' }, body: JSON.stringify(b) }), E.env); if (r.status !== 200) throw new Error('ingest ' + r.status + ' ' + await r.text()); return r.json(); };
async function open(browser, W, E, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  if (o.shiftMs) await ctx.addInitScript(ms => { const R = Date, B = R.now; const D = class extends R { constructor(...a) { a.length ? super(...a) : super(B() + ms); } static now() { return B() + ms; } }; window.Date = D; }, o.shiftMs);   // the page's clock moved forward; timers stay real
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: BACKDROP }));
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', async route => { const u = new URL(route.request().url()), p = u.pathname, H = { 'access-control-allow-origin': '*' };
    if (p === '/cells/ships' || p === '/snapshot/ships' || p.startsWith('/place/')) { const r = await W.fetch(new Request('https://hub' + p + u.search), E.env); return route.fulfill({ status: r.status, contentType: 'application/json', headers: H, body: await r.text() }); }
    if (p === '/') return route.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ name: 'x', history: { collecting: false, retained: { exists: false } } }) });
    route.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }) }); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + (o.old ? '/old/' : '/') + (o.page || 'index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.loadedAt, null, { timeout: 30000 });
  if (!o.page) { await page.waitForFunction(() => { const g = ME.globe && ME.globe(); if (!g) return false; let ok = false; g.scene().traverse(x => { if (x.isMesh && x.material === g.globeMaterial() && x.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });
    await page.waitForFunction(() => ME.state.ships && (ME.state.ships.source_status === 'down' || ME.pairState('ships').ships.records !== null), null, { timeout: 20000 }).catch(() => { });   // the ships counts have arrived, and (unless it is a down file) the records read has finished
    await page.waitForFunction(() => document.getElementById('s-ships').textContent !== 'unknown' || document.getElementById('o-ships').textContent !== 'no sample yet', null, { timeout: 10000 }).catch(() => { }); await page.waitForTimeout(500); }
  return { ctx, page, errs };
}
/** What a reader sees on the ships card, and what is on the globe. */
const card = page => page.evaluate(() => { const t = id => document.getElementById(id).textContent.replace(/\s+/g, ' ').trim(); const rs = ME.renderState() || {};
  return { state: t('s-ships'), cls: document.getElementById('s-ships').className, label: t('l-ships'), value: t('v-ships'), obs: t('o-ships'), meta: t('m-ships'), points: rs.points, cells: (ME.cellPolys('ships') || []).length, pair: ME.pairState('ships').ships, key: ME.keyState().drawn }; });

(async () => {
  worker = (await import(pathToFileURL(path.join(ROOT, 'phase1', 'worker.js')).href)).default;
  const oldPath = path.join(__dirname, `.ships-retain-old-hub-${process.pid}.tmp.mjs`); fs.writeFileSync(oldPath, gitShow(OLD + ':phase1/worker.js')); process.on('exit', () => { try { fs.unlinkSync(oldPath); } catch (_) { } });
  oldWorker = (await import(pathToFileURL(oldPath).href)).default;
  const OLDFILES = { 'index.html': gitShow(OLD + ':index.html'), 'app.js': gitShow(OLD + ':app.js'), 'style.css': gitShow(OLD + ':style.css') };
  const srv = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html'; const old = f.startsWith('old/'); if (old) f = f.slice(4) || 'index.html';
    const type = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' }[f.split('.').pop()] || 'application/octet-stream';
    if (old && OLDFILES[f]) { r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); return r.end(f === 'index.html' ? OLDFILES[f].replace(START, SHIPS_ON) : OLDFILES[f]); }
    const full = path.join(ROOT, f); if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); r.end(/\.(js|html|css)$/.test(f) ? served(f, fs.readFileSync(full, 'utf8')) : fs.readFileSync(full)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const T = Date.now(), sRun = T - 35 * 60e3, S = sample(sRun, 3000), fRun = T - 4 * 60e3;
  ok('fixture: the sample\'s end time and the attempt\'s time print differently (so a swapped time is visible)', hm(S.endMs) !== hm(fRun) && hm(S.endMs) !== hm(fRun - 6 * 60e3));

  // ===== 1. a good sample alone: as before
  { const E = makeEnv(); await post(worker, E, S); const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('1 good sample: "current", 3,000, no attempt wording, 3,000 vessels drawn', c.state === 'current' && c.value === '3,000' && !/Latest sample/.test(c.meta) && c.points === 3000 && c.pair.usable && c.key.includes('ships'), c);
    ok('1 no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== 2. a failure after the good sample
  { const E = makeEnv(); await post(worker, E, S); const r = await post(worker, E, down(fRun, 'connect timeout (15 s)')); const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('2 the hub kept the sample and recorded the attempt', r.published === 'failure recorded; last sample kept' && E.json('latest-cells/ships.json').last_attempt.run === iso(fRun));
    ok('2 failure after a good sample: badge "degraded" (warn), the count is still the sample\'s 3,000', c.state === 'degraded' && /warn/.test(c.cls) && c.value === '3,000' && c.label === '', c);
    ok('2 the card says which attempt failed and which sample is shown, each with its own time', c.meta.includes(`Latest sample failed at ${hm(fRun)}. Showing ships from the ${hm(S.endMs)} sample.`), c.meta);
    ok('2 the sample\'s own line is unchanged ("sample ended …")', c.obs.startsWith(`sample ended ${hm(S.endMs)}`), c.obs);
    ok('2 the retained sample\'s 3,000 vessels and its cells are drawn; records and counts are a pair', c.points === 3000 && c.cells > 0 && c.pair.usable && c.pair.cells === S.retrieved_at && c.pair.records === S.retrieved_at, c);
    const rep = await page.evaluate(() => { const R = ME.readings(), r = ME.report(R); return { text: r.text, st: r.states.ships }; });
    ok('2 the report keeps the sample\'s figures and adds the failed attempt', rep.text.includes('3,000 vessel identities received during a 60 s AIS sample ending ' + hm(S.endMs)) && rep.text.includes(`— latest sample failed at ${hm(fRun)};`), rep.text.slice(0, 700));
    ok('2 the report\'s state line: degraded, with both times', rep.st === `degraded — Latest sample failed at ${hm(fRun)}. The sample in use ended ${hm(S.endMs)}`, rep.st);
    const cell = await page.evaluate(() => { const ok = ME.openCell('ships', '14_49'); return ok ? document.getElementById('insp-dl').textContent.replace(/\s+/g, ' ') : null; });
    ok('2 the cell inspector\'s Collector row carries the same sentence', !!cell && cell.includes(`Latest sample failed at ${hm(fRun)}. The sample in use ended ${hm(S.endMs)}`), cell && cell.slice(0, 500));
    await page.evaluate(() => ME.openPlace('14_49')); await page.waitForFunction(() => /vessel/.test(document.body.innerText) && /latest sample failed/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => { });
    const place = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    ok('2 the place view lists the retained sample\'s vessel and says the latest sample failed, with the sample\'s time', place.includes(`latest sample failed at ${hm(fRun)}; from the sample retrieved at ${hm(S.endMs)}`) && /1 vessel heard in the latest sample/.test(place), (place.match(/Ships.{0,400}/) || [''])[0]);
    ok('2 no page errors', errs.length === 0, errs); await ctx.close();
    const s2 = await open(browser, worker, E, { page: 'sources.html' }); await s2.page.waitForFunction(() => /Ships/.test(document.getElementById('report-states').textContent), null, { timeout: 15000 }).catch(() => { });
    const st = await s2.page.evaluate(() => ({ states: document.getElementById('report-states').textContent, text: document.getElementById('report-text').textContent }));
    ok('2 Sources page: the status line and the report carry the attempt', st.states.includes(`Ships: degraded — Latest sample failed at ${hm(fRun)}. The sample in use ended ${hm(S.endMs)}`) && st.text.includes(`latest sample failed at ${hm(fRun)}`), st.states.slice(0, 400));
    ok('2 Sources: no page errors', s2.errs.length === 0, s2.errs); await s2.ctx.close(); }

  // ===== 3. the 17 Nov case: an overlong 381.5 s / 700-vessel sample after the good one
  { const E = makeEnv(); await post(worker, E, S); const O = sample(T - 390e3, 700, { status: 'degraded', overlong: true, elapsedS: 381.5, flowS: 20.2 }); const r = await post(worker, E, O);
    const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('3 the hub did not publish the overlong sample', /^not published: overlong sample; last sample kept$/.test(r.published) && E.json('latest/ships.json').records.length === 3000);
    ok('3 overlong attempt: "degraded", and the card shows the 3,000 of the retained sample, never the 700', c.state === 'degraded' && c.value === '3,000' && c.points === 3000, c);
    ok('3 the wording takes elapsed and window from the ATTEMPT and the time from the retained SAMPLE', c.meta.includes(`Latest sample ran 381.5 s against a 60 s window and is not shown. Showing ships from the ${hm(S.endMs)} sample.`), c.meta);
    const rep = await page.evaluate(() => ME.report(ME.readings()).text);
    ok('3 the report says the same', rep.includes('— latest sample ran 381.5 s against a 60 s window and is not shown;') && rep.includes('3,000 vessel identities'), rep.slice(0, 600));
    ok('3 no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== 4. an ordinary low-flow sample is kept and its own reason is still given
  { const E = makeEnv(); const Lw = sample(sRun, 2700, { status: 'degraded', flowS: 53 }); await post(worker, E, Lw); await post(worker, E, down(fRun, 'websocket error before connection')); const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    const why = await page.evaluate(() => ME.freshness('ships').why);
    ok('4 a retained low-flow sample: degraded, 2,700 shown, the attempt and the sample\'s own low-flow reason both stated', c.state === 'degraded' && c.value === '2,700' && c.points === 2700 && why.startsWith(`Latest sample failed at ${hm(fRun)}. The sample in use ended ${hm(Lw.endMs)}; `) && /below our 90% standard/.test(why), [c.state, c.value, why]);
    ok('4 no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== 5. nothing to keep
  { const E = makeEnv(); await post(worker, E, down(fRun, 'connect timeout (15 s)')); const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('5 a failure with no sample to keep: unknown, no count, no sample claimed, the fixed phrase, no "Latest sample" sentence', c.state === 'unknown' && c.value === '–' && c.label === '' && c.obs === 'no sample from the latest run' && c.meta.includes('collector reported down: connect timeout (15 s)') && !/Latest sample|Showing ships/.test(c.meta) && c.points === 0 && c.cells === 0, c);
    ok('5 the helper itself gives no sentence for a down file, although that file carries last_attempt', await page.evaluate(() => !!ME.state.ships.last_attempt && ME.state.ships.source_status === 'down' && ME.shipsAttempt(ME.state.ships) === ''), await page.evaluate(() => [ME.state.ships.source_status, ME.shipsAttempt(ME.state.ships)]));
    ok('5 no page errors', errs.length === 0, errs); await ctx.close();
    const F = makeEnv(); await post(worker, F, sample(T - 390e3, 700, { status: 'degraded', overlong: true, elapsedS: 381.5, flowS: 20.2 })); const o = await open(browser, worker, F); const d = await card(o.page);
    ok('5 an overlong sample with nothing to keep: its 700 vessels are not shown as current; unknown, no count', d.state === 'unknown' && d.value === '–' && d.points === 0 && d.cells === 0 && d.obs === 'no sample from the latest run' && d.meta.includes('latest sample ran past its window and is not shown') && !/700/.test(d.value + d.label), d);
    ok('5b no page errors', o.errs.length === 0, o.errs); await o.ctx.close(); }

  // ===== 6. the retained sample's three-hour life is its own
  { const E = makeEnv(); await post(worker, E, S); await post(worker, E, down(fRun, 'connect timeout (15 s)'));
    const shift = (S.endMs + 3 * 3600e3 + 120e3) - Date.now(); const { ctx, page, errs } = await open(browser, worker, E, { shiftMs: shift }); const c = await card(page);
    ok('6 three hours after the SAMPLE (the attempt is far younger): unknown, "Last sample: 3,000", over-3-h wording, no "Showing ships"', c.state === 'unknown' && c.label === 'Last sample:' && c.value === '3,000' && /last sample is over 3 h old/.test(c.meta) && !/Showing ships|Latest sample/.test(c.meta) && c.points === 0, c);
    ok('6 no page errors', errs.length === 0, errs); await ctx.close();
    const shift2 = (S.endMs + 3 * 3600e3 - 180e3) - Date.now(); const b = await open(browser, worker, E, { shiftMs: shift2 }); const d = await card(b.page);
    ok('6 three minutes before that limit: still degraded and shown', d.state === 'degraded' && d.value === '3,000' && d.points === 3000 && /Showing ships from/.test(d.meta), d); await b.ctx.close(); }

  // ===== 7. records and counts from different runs (an interrupted writer): nothing of the ships is shown
  { const E = makeEnv(); await post(worker, E, S); await post(worker, E, down(fRun, 'connect timeout (15 s)'));
    const other = sample(T - 2 * 60e3, 1234); delete other.endMs; E.set('latest/ships.json', other);   // the records file now holds another run; the counts file still holds S and its attempt
    const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('7 unpaired files: badge unknown, no count, "ship positions not shown"', c.state === 'unknown' && /bad/.test(c.cls) && c.value === '–' && c.label === '' && c.obs === 'ship positions not shown', c);
    ok('7 …the attempt is still stated, without claiming any ships are shown', c.meta.includes(`Latest sample failed at ${hm(fRun)}.`) && !/Showing ships/.test(c.meta), c.meta);
    ok('7 …no vessel and no ships cell is drawn, and the Key does not count ships', c.points === 0 && c.cells === 0 && !c.key.includes('ships') && c.pair.usable === false, c);
    ok('7 no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== 8. recovery
  { const E = makeEnv(); await post(worker, E, S); await post(worker, E, down(fRun, 'connect timeout (15 s)')); const N = sample(T - 62e3, 3100); await post(worker, E, N);
    const { ctx, page, errs } = await open(browser, worker, E); const c = await card(page);
    ok('8 the next eligible sample: "current", 3,100, the note is gone', c.state === 'current' && c.value === '3,100' && !/Latest sample|Showing ships/.test(c.meta) && c.points === 3100, c);
    ok('8 no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== 9. version skew, both ways
  { const E = makeEnv(); await post(oldWorker, E, S); let o = await open(browser, oldWorker, E); let c = await card(o.page);
    ok('9 this page on the previous hub (0.6.18), good sample: as before', c.state === 'current' && c.value === '3,000' && c.points === 3000 && o.errs.length === 0, [c, o.errs]); await o.ctx.close();
    await post(oldWorker, E, down(fRun, 'connect timeout (15 s)')); o = await open(browser, oldWorker, E); c = await card(o.page);
    ok('9 this page on the previous hub, failure: the previous hub\'s down file reads as before (unknown, no sample claimed)', c.state === 'unknown' && c.value === '–' && c.obs === 'no sample from the latest run' && o.errs.length === 0, [c, o.errs]); await o.ctx.close();
    const F = makeEnv(); await post(worker, F, S); await post(worker, F, down(fRun, 'connect timeout (15 s)')); o = await open(browser, worker, F, { old: true });
    const old = await o.page.evaluate(() => ({ state: document.getElementById('s-ships').textContent, value: document.getElementById('v-ships').textContent, points: (ME.renderState() || {}).points, has: typeof ME.shipsAttempt }));
    ok('9 the PREVIOUS page on this hub, after a failure: it shows the retained sample (3,000) and raises no error', old.has === 'undefined' && old.value === '3,000' && old.points === 3000 && o.errs.length === 0, [old, o.errs]); await o.ctx.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`\nships-retain-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite threw: ' + (e && e.stack || e)); process.exit(1); });
