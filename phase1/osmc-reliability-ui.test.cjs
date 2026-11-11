/* Buoy reliability, page side (docs/concepts/OSMC-RELIABILITY-PROPOSAL.md rev 2.1 §8, page cases).
 * Every hub response comes from the REAL hub code: phase1/osmc-reliability-fixture-hub.mjs runs a worker.js behind a local port
 * with OSMC stubbed and a controllable clock. The new hub (this branch's worker.js) is on 8898; the old hub (main's worker.js,
 * 0.6.7) on 8897. The browser's clock is skewed to the hub's clock; timers stay real, and the page's own refresh (tick) and
 * its 30-second timer are captured and called directly, so "no data poll" can be asserted from the hub's request log.
 * Old page and old hub = index.html / app.js / sources.html / worker.js at commit 0386058 (the last main before this change), from git.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/osmc-reliability-ui.test.cjs
 *      (8899 static server on the repo root). BREAK=drop-line | showing-without-records | no-redraw | keep-cells |
 *      missing-field-is-failure | failed-at-run | no-degraded | degraded-without-records | cells-without-records |
 *      count-without-records | positions-copy-without-records  — each must fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'), BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '', MAIN = process.env.OLD_REF || '0386058';   // the last page and hub (0.6.7) before this change; pinned, because after the merge 'main' IS the new code (needs that commit in the clone: git fetch --depth=60 origin main)
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 8 min'); process.exit(1); }, 8 * 60e3);
const git = f => cp.execFileSync('git', ['show', `${MAIN}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 }).toString();
const BREAKS = {
  'drop-line': ['index.html', "const la = s && s.last_attempt; if (!la ||", "const la = null; if (!la ||"],
  'showing-without-records': ['index.html', "(usable('drifters') ? ` Showing buoys from", "(true ? ` Showing buoys from"],
  'no-redraw': ['index.html', "driftDrawnGrade !== null && ME.freshness('drifters').grade !== driftDrawnGrade) render();", "false) render();"],
  'keep-cells': ['index.html', "(fresh.grade === 'unknown' || !usable('drifters'))) continue;", "(!usable('drifters'))) continue;"],
  'missing-field-is-failure': ['index.html', "const la = s && s.last_attempt; if (!la ||", "const la = (s && s.last_attempt) || (s && { failed_at: s.retrieved_at }); if (!la ||"],
  'failed-at-run': ['index.html', "return `Latest update failed at ${t(la.failed_at)}.`", "return `Latest update failed at ${t(la.run)}.`"],
  'no-degraded': ['index.html', "if (fb && shown) { st.textContent = 'degraded'; st.className = 'state warn'; st.title = fb; }", ""],
  'degraded-without-records': ['index.html', "if (noRecords) { st.textContent = 'unknown'; st.className = 'state bad'; st.title = fb; }", "if (noRecords) { st.textContent = 'degraded'; st.className = 'state warn'; st.title = fb; }"],
  'cells-without-records': ['index.html', "(fresh.grade === 'unknown' || !usable('drifters'))) continue;", "(fresh.grade === 'unknown')) continue;"],
  'count-without-records': ['index.html', "f.grade !== 'unknown' && s && !noRecords ? ME.total(s)", "f.grade !== 'unknown' && s ? ME.total(s)"],
  'positions-copy-without-records': ['index.html', "noRecords ? 'buoy positions not shown' : s && s.window_end", "s && s.window_end"],
};
const PORT_NEW = 8898, PORT_OLD = 8897;
const ctl = async (port, q) => { const r = await fetch(`http://127.0.0.1:${port}/${q}`); return r.json(); };

(async () => {
  // ---- the two hubs
  const oldWorker = path.join(__dirname, `.osmc-old-worker-${process.pid}.js`); fs.writeFileSync(oldWorker, git('phase1/worker.js'));
  const kids = [cp.spawn(process.execPath, ['--no-warnings', path.join(__dirname, 'osmc-reliability-fixture-hub.mjs'), String(PORT_NEW)], { stdio: ['ignore', 'pipe', 'inherit'] }),
    cp.spawn(process.execPath, ['--no-warnings', path.join(__dirname, 'osmc-reliability-fixture-hub.mjs'), String(PORT_OLD), oldWorker], { stdio: ['ignore', 'pipe', 'inherit'] })];
  const bye = () => { for (const k of kids) try { k.kill(); } catch (_) { } try { fs.unlinkSync(oldWorker); } catch (_) { } };
  process.on('exit', bye);
  await Promise.all(kids.map(k => new Promise((res, rej) => { k.stdout.once('data', res); k.once('exit', c => rej(new Error('fixture hub exited ' + c))); })));
  ok('new hub is 0.6.8, old hub is 0.6.7', (await ctl(PORT_NEW, '')).version === '0.6.8' && (await ctl(PORT_OLD, '')).version === '0.6.7');

  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  // page files: 'new' = this checkout (with an optional break), 'old' = main
  const open = async ({ port = PORT_NEW, files = 'new', nowIso, buoysOn = true }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', async route => { const u = new URL(route.request().url());
      try { const r = await fetch(`http://127.0.0.1:${port}${u.pathname}${u.search}`); route.fulfill({ status: r.status, contentType: 'application/json', body: await r.text() }); } catch (e) { route.abort(); } });
    if (files === 'old') for (const f of ['index.html', 'app.js', 'sources.html']) await ctx.route(new RegExp('^' + BASE + '/' + f.replace('.', '\\.') + '(\\?.*)?$'), r => r.fulfill({ status: 200, contentType: f.endsWith('.js') ? 'application/javascript' : 'text/html', body: git(f) }));
    else if (BREAK) { const [f, a, b] = BREAKS[BREAK]; const srcF = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (!srcF.includes(a)) { console.log('FAIL  break anchor missing'); process.exit(2); }
      await ctx.route(new RegExp('^' + BASE + '/' + f.replace('.', '\\.') + '(\\?.*)?$'), r => r.fulfill({ status: 200, contentType: f.endsWith('.js') ? 'application/javascript' : 'text/html', body: srcF.replace(a, b) })); }
    // browser clock = hub clock (Date only; timers real). The page's intervals are recorded so the suite can fire them itself.
    await ctx.addInitScript(now => { const R = Date; let skew = now - R.now();
      window.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + skew); } static now() { return R.now() + skew; } };
      window.__setNow = ms => { skew = ms - R.now(); };
      const si = window.setInterval; window.__iv = []; window.setInterval = function (fn, ms, ...a) { window.__iv.push({ fn, ms, name: fn && fn.name }); return si.call(this, fn, ms, ...a); }; }, Date.parse(nowIso));
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.loadedAt && ME.renderState && ME.renderState() && window.__iv.some(i => i.name === 'tick'), null, { timeout: 40000 });
    if (buoysOn) { await page.click('button[data-layer="drifters"]'); await page.waitForFunction(() => !/^(off|loading)$/.test(document.getElementById('s-drifters').textContent), null, { timeout: 20000 }); await page.waitForTimeout(700); }
    return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => { const t = id => document.getElementById(id); const b = t('m-drifters').querySelector('b'); const rs = ME.renderState();
    return { badge: t('s-drifters').textContent, cls: t('s-drifters').className, title: t('s-drifters').title, value: t('v-drifters').textContent, meta: t('m-drifters').textContent, bold: b ? b.textContent : '',
      withheld: t('p-drifters').hidden ? '' : t('p-drifters').textContent, obs: t('o-drifters').textContent, fresh: ME.freshness('drifters'), points: rs.driftPoints, cells: rs.driftCells, pair: ME.pairState('drifters').drifters,
      cellGrades: [...new Set((window.__polys ? window.__polys() : []))] }; });
  const fire = (page, which) => page.evaluate(async w => { for (const i of window.__iv) if (w === 'tick' ? i.name === 'tick' : i.ms === 30000) await i.fn(); }, which);
  const setNow = (page, iso) => page.evaluate(ms => window.__setNow(ms), Date.parse(iso));
  const placeRow = async (page, id) => { await page.evaluate(i => ME.openPlace(i), id); await page.waitForFunction(() => { const d = document.querySelector('#insp-dl dt'); return d && !/Loading/.test(d.textContent); }, null, { timeout: 15000 });
    const r = await page.evaluate(() => { const dt = [...document.querySelectorAll('#insp-dl dt')].find(d => d.textContent === 'Drifting buoys'); return dt ? dt.nextElementSibling.textContent : null; }); await page.keyboard.press('Escape'); return r; };
  // hub scenario: a good 15:07 run, then a 522 on the 16:07 run that fails at 16:08:42
  const seed = async (port, day = '2026-11-10', failKind = 'http_error') => { await ctl(port, '__reset'); await ctl(port, `__now?at=${day}T15:08:15.000Z`); await ctl(port, `__run?kind=good&sched=${day}T15:07:00Z`);
    await ctl(port, `__now?at=${day}T16:08:42.000Z`); return ctl(port, `__run?kind=${failKind}&sched=${day}T16:07:00Z`); };
  const cellsWith = c => Object.keys(c.cells).sort(), emptyCell = c => { for (let r = 0; r < 45; r++) for (let k = 0; k < 90; k++) if (!c.cells[`${r}_${k}`]) return `${r}_${k}`; };
  const LINE = 'Latest update failed at 16:08 UTC. Showing buoys from the 15:08 UTC run.';

  // ---- 9. layer off: no buoy request
  let c = await seed(PORT_NEW); ok('seed: the hub kept the good counts and added last_attempt', c.source_status === 'ok' && c.last_attempt && c.last_attempt.failed_at === '2026-11-10T16:08:42.000Z' && c.last_attempt.run === '2026-11-10T16:07:00.000Z', c.last_attempt);
  let w = await open({ nowIso: '2026-11-10T16:20:00.000Z', buoysOn: false });
  ok('9 layer off: no buoy request reached the hub', !(await ctl(PORT_NEW, '__reqs')).some(p => /drifters/.test(p)), await ctl(PORT_NEW, '__reqs'));
  await w.ctx.close();

  // ---- 1. fallback inside the limit
  w = await open({ nowIso: '2026-11-10T16:20:00.000Z' }); let r = await read(w.page);
  ok('1 fallback: the full line with both times', r.bold === LINE, r.meta);
  ok('1 fallback: badge "degraded" (warn), tooltip = the line', r.badge === 'degraded' && /\bwarn\b/.test(r.cls) && r.title === LINE, [r.badge, r.cls, r.title]);
  ok('1 fallback: the good run\'s buoys are drawn (1,300 points, cells) and the count is shown', r.points === 1300 && r.cells > 0 && r.value === '1,300' && r.pair.usable, r);
  ok('1 fallback: "retrieved … ago" counts from the good run (15:08:15 → 72 min)', / · retrieved 72 min ago · /.test(r.meta), r.meta);
  ok('1 fallback: freshness is still computed from the good run (adequate), not changed by the badge', r.fresh.grade === 'adequate' && r.fresh.why === 'retrieved 72 min ago', r.fresh);
  const grades = await w.page.evaluate(() => { const g = {}; for (const id of Object.keys(ME.state.drifters.cells)) { const c = ME.state.drifters.cells[id]; g[c.coverage.grade] = 1; } return Object.keys(g); });
  ok('1 fallback: cell coverage grades are the good run\'s (partial)', JSON.stringify(grades) === '["partial"]', grades);
  let pr = await placeRow(w.page, cellsWith(c)[0]);
  ok('6 place, cell with buoys: lists them with the clause', /buoys? with a latest fix here/.test(pr || '') && /latest update failed at 16:08 UTC; from the 15:08 UTC run/.test(pr || ''), pr);
  pr = await placeRow(w.page, emptyCell(c));
  ok('6 place, cell with no buoys: no clause', pr !== null && !/latest update failed/.test(pr), pr);

  // ---- 5. recovery inside the open page through its own refresh
  await ctl(PORT_NEW, '__now?at=2026-11-10T17:08:09.000Z'); await ctl(PORT_NEW, '__run?kind=good&sched=2026-11-10T17:07:00Z');
  await setNow(w.page, '2026-11-10T17:09:00.000Z'); await fire(w.page, 'tick'); await w.page.waitForTimeout(300); r = await read(w.page);
  ok('5 recovery on the page\'s own refresh: badge current, line and tooltip gone, new run drawn', r.badge === 'current' && !/Latest update failed/.test(r.meta) && !/Latest update failed/.test(r.title) && r.points === 1300 && / · retrieved 5\d s ago/.test(r.meta), r);
  ok('new page: no page errors', w.perr.length === 0, w.perr); await w.ctx.close();

  // ---- 2. the two times cross midnight
  await ctl(PORT_NEW, '__reset'); await ctl(PORT_NEW, '__now?at=2026-11-10T23:08:15.000Z'); await ctl(PORT_NEW, '__run?kind=good&sched=2026-11-10T23:07:00Z');
  await ctl(PORT_NEW, '__now?at=2026-11-11T00:08:42.000Z'); c = await ctl(PORT_NEW, '__run?kind=http_error&sched=2026-11-11T00:07:00Z');
  w = await open({ nowIso: '2026-11-11T00:20:00.000Z' }); r = await read(w.page);
  ok('2 midnight: both times carry their UTC date', r.bold === 'Latest update failed at 00:08 UTC, 11 Nov. Showing buoys from the 23:08 UTC run, 10 Nov.', r.meta);
  pr = await placeRow(w.page, cellsWith(c)[0]);
  ok('2 midnight: the place clause carries both dates too', /latest update failed at 00:08 UTC, 11 Nov; from the 23:08 UTC run, 10 Nov/.test(pr || ''), pr);
  await w.ctx.close();

  // ---- 3a. last_attempt present, records unreadable
  c = await seed(PORT_NEW); await ctl(PORT_NEW, '__del?key=latest/drifters.json');
  w = await open({ nowIso: '2026-11-10T16:20:00.000Z' }); r = await read(w.page);
  ok('3a records unreadable: badge UNKNOWN (bad), not degraded', r.badge === 'unknown' && /\bbad\b/.test(r.cls) && !/\bwarn\b/.test(r.cls), [r.badge, r.cls]);
  ok('3a records unreadable: no buoy points drawn', r.points === 0 && !r.pair.usable, r);
  ok('3a records unreadable: no buoy cells drawn either', r.cells === 0, r.cells);
  ok('3a records unreadable: no count shown, and no copy implying positions are shown', r.value === '–' && r.obs === 'buoy positions not shown' && !/each buoy shown/.test(r.obs), [r.value, r.obs]);
  ok('3a records unreadable: the card says only that the update failed — no "Showing buoys"', r.bold === 'Latest update failed at 16:08 UTC.' && !/Showing buoys/.test(r.meta + r.title), r.meta);
  ok('3a records unreadable: the existing withheld reason is shown', /^Records withheld:/.test(r.withheld), r.withheld);
  pr = await placeRow(w.page, cellsWith(c)[0]); ok('3a place: withheld, no clause', /^withheld — /.test(pr || '') && !/latest update failed at/.test(pr), pr);
  await w.ctx.close();

  // ---- 3b. last_attempt present, records from a different run (the exact partial publish)
  await ctl(PORT_NEW, '__reset'); await ctl(PORT_NEW, '__now?at=2026-11-10T15:08:15.000Z'); await ctl(PORT_NEW, '__run?kind=good&sched=2026-11-10T15:07:00Z');
  await ctl(PORT_NEW, '__now?at=2026-11-10T16:08:42.000Z'); c = await ctl(PORT_NEW, '__run?kind=partial&sched=2026-11-10T16:07:00Z');
  ok('3b seed: old counts + last_attempt internal_error', c.retrieved_at === '2026-11-10T15:08:15.000Z' && c.last_attempt && c.last_attempt.reason === 'internal_error', c.last_attempt);
  w = await open({ nowIso: '2026-11-10T16:20:00.000Z' }); r = await read(w.page);
  ok('3b mismatched records: badge UNKNOWN (bad), not degraded', r.badge === 'unknown' && /\bbad\b/.test(r.cls) && !/\bwarn\b/.test(r.cls), [r.badge, r.cls]);
  ok('3b mismatched records: no buoy points and no buoy cells drawn', r.points === 0 && r.cells === 0, [r.points, r.cells]);
  ok('3b mismatched records: no count, no positions copy', r.value === '–' && r.obs === 'buoy positions not shown', [r.value, r.obs]);
  ok('3b mismatched records: failed-at line kept, no "Showing buoys", withheld reason shown', r.bold === 'Latest update failed at 16:08 UTC.' && r.title === 'Latest update failed at 16:08 UTC.' && !/Showing buoys/.test(r.meta + r.title) && /^Records withheld:.*different collector run/.test(r.withheld), r);
  await w.ctx.close();

  // ---- 4. ageing through 4 h in an already-open page, without a data poll
  c = await seed(PORT_NEW); await ctl(PORT_NEW, '__now?at=2026-11-10T19:07:00.000Z');
  w = await open({ nowIso: '2026-11-10T19:07:00.000Z' }); r = await read(w.page);   // 3 h 58 min 45 s after the good run
  ok('4 before expiry: fallback shown and drawn', r.badge === 'degraded' && r.points === 1300 && r.cells > 0 && r.bold === LINE, r);
  const before = (await ctl(PORT_NEW, '__reqs')).length;
  await setNow(w.page, '2026-11-10T19:09:00.000Z'); await fire(w.page, '30s'); await w.page.waitForTimeout(300); r = await read(w.page);
  ok('4 at expiry: the hub was not asked again (no data poll)', (await ctl(PORT_NEW, '__reqs')).length === before, (await ctl(PORT_NEW, '__reqs')).slice(before));
  ok('4 at expiry: badge unknown, existing reason, no fallback line', r.badge === 'unknown' && /\bbad\b/.test(r.cls) && !/Latest update failed|Showing buoys/.test(r.meta) && /over 4 h old/.test(r.meta) && r.value === '–', r);
  ok('4 at expiry: the buoy points AND cells are actually removed from the globe', r.points === 0 && r.cells === 0, [r.points, r.cells]);
  await ctl(PORT_NEW, '__now?at=2026-11-10T19:09:00.000Z'); pr = await placeRow(w.page, cellsWith(c)[0]);
  ok('4 at expiry: a fresh place request withholds them', /^withheld — the latest update failed and the last successful update is over 4 h old/.test(pr || '') && !/with a latest fix here/.test(pr), pr);
  await w.ctx.close();

  // ---- 7. OLD page on the NEW hub
  c = await seed(PORT_NEW); await ctl(PORT_NEW, '__now?at=2026-11-10T19:07:00.000Z');
  w = await open({ files: 'old', nowIso: '2026-11-10T19:07:00.000Z' }); r = await read(w.page);
  ok('7 old page, new hub: draws the matched pair with the true retrieval time, no line, badge as it always was', r.points === 1300 && r.pair.usable && r.badge === 'current' && !/Latest update failed/.test(r.meta + r.title) && / · retrieved 4\.0 h ago$/.test(r.meta), r);
  await setNow(w.page, '2026-11-10T19:09:00.000Z'); await fire(w.page, '30s'); await w.page.waitForTimeout(300); r = await read(w.page);
  ok('7 old page at expiry, 30 s timer: badge unknown; the map still holds the points (existing cadence: redraw on the 5-min refresh)', r.badge === 'unknown' && r.points === 1300, [r.badge, r.points]);
  await ctl(PORT_NEW, '__now?at=2026-11-10T19:09:00.000Z'); await fire(w.page, 'tick'); await w.page.waitForTimeout(300); r = await read(w.page);
  ok('7 old page at its next 5-min refresh: the points are gone', r.badge === 'unknown' && r.points === 0, [r.badge, r.points, r.cells]);
  pr = await placeRow(w.page, cellsWith(c)[0]);
  ok('7 old page: a fresh place request stops listing at 4 h (the hub\'s cutoff)', /^withheld — the latest update failed and the last successful update is over 4 h old/.test(pr || ''), pr);
  ok('old page: no page errors', w.perr.length === 0, w.perr); await w.ctx.close();

  // ---- 8. NEW page on the OLD hub (0.6.7): exactly today's behaviour
  c = await seed(PORT_OLD); ok('8 seed: the old hub wrote the empty down envelope, no last_attempt', c.source_status === 'down' && !c.last_attempt && c.note === 'http 522', c);
  w = await open({ port: PORT_OLD, nowIso: '2026-11-10T16:20:00.000Z' }); r = await read(w.page);
  ok('8 new page, old hub after a failure: unknown, "collector reported down: http 522", records withheld, nothing drawn, no fallback line', r.badge === 'unknown' && r.bold === 'collector reported down: http 522' && r.points === 0 && /^Records withheld:/.test(r.withheld) && !/Latest update failed/.test(r.meta), r);
  await ctl(PORT_OLD, '__reset'); await ctl(PORT_OLD, '__now?at=2026-11-10T15:08:15.000Z'); await ctl(PORT_OLD, '__run?kind=good&sched=2026-11-10T15:07:00Z');
  await setNow(w.page, '2026-11-10T15:10:00.000Z'); await fire(w.page, 'tick'); await w.page.waitForTimeout(300); r = await read(w.page);
  ok('8 new page, old hub, good run (no field): current, no line — a missing field is not a failure', r.badge === 'current' && r.points === 1300 && !/Latest update failed/.test(r.meta + r.title), r);
  ok('new page on old hub: no page errors', w.perr.length === 0, w.perr); await w.ctx.close();

  await browser.close(); bye(); clearTimeout(wd); console.log(`\nosmc-reliability-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
