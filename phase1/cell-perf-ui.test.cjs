/* Globe performance build (proposal rev 1.1, 11 Nov 2026): how coverage cells are drawn, per ?perf= step.
 * main = today's page (transparent side colour); b1 = no side walls; b2a = b1 + shared DoubleSide cap materials per fill;
 * b2b = b2a with FrontSide. Checks: side geometry and draw calls per step; shared materials carry exactly the colour, opacity,
 * transparency and depth settings globe.gl gives a per-cell default; FrontSide only on b2b; ME.cellPolys identical across steps;
 * material lifetime through toggles (every rendered cap material belongs to the current pass); hover winners and pixels compared
 * with main on a fixed pose, including points near the limb.
 * Run: node --no-warnings phase1/cell-perf-ui.test.cjs   (8899 server + /home/claude/spike, as the other suites)
 * BREAK=keep-sides|per-cell|wrong-opacity|frontside-a  — each puts an old or wrong behaviour back and must fail. */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const ocean = new PNG({ width: 64, height: 32 }); for (let i = 0; i < ocean.data.length; i += 4) { ocean.data[i] = 20; ocean.data[i + 1] = 40; ocean.data[i + 2] = 70; ocean.data[i + 3] = 255; }
const OCEAN_PNG = PNG.sync.write(ocean);   // a plain dark backdrop so globe.gl builds and draws the globe (START-HERE §4n)
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 8 min'); process.exit(1); }, 8 * 60e3);
const RUN = new Date(Date.now() - 60e3).toISOString();
const cov = g => ({ grade: g, evidence: 'e', observed_fraction: g === 'adequate' ? 1 : .5 });
// overlapping cells across layers (as on the live page), three grades, forest counts spanning its log fill, a dateline and a polar cell
const CELLS = {
  usgs: { '14_49': [1, 'partial'], '27_28': [2, 'partial'], '36_11': [1, 'partial'] },
  firms: { '14_49': [5, 'partial'], '20_53': [3, 'adequate'], '15_52': [2, 'unknown'], '17_89': [4, 'partial'], '40_61': [1, 'partial'], '20_54': [7, 'partial'], '19_65': [1, 'partial'], '19_66': [2, 'adequate'], '19_67': [3, 'partial'], '19_68': [1, 'unknown'], '17_0': [2, 'partial'] },
  ships: { '14_49': [9, 'partial'], '15_52': [4, 'partial'], '29_21': [6, 'adequate'], '36_12': [2, 'partial'], '30_53': [3, 'partial'], '32_53': [1, 'adequate'] },
  forest: { '20_53': [10, 'partial'], '15_52': [3000, 'partial'], '29_21': [90000, 'partial'], '27_28': [0, 'partial'], '17_89': [12, 'unknown'], '21_53': [400, 'partial'], '19_66': [50, 'partial'], '35_53': [7, 'partial'], '17_88': [30, 'partial'] },
};
const env = (layer, extra) => ({ layer, retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 10800, quantity: 'q',
  cells: Object.fromEntries(Object.entries(CELLS[layer] || {}).map(([id, [n, g]]) => [id, { count: n, coverage: cov(g) }])), ...extra });
const REC = { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'observed_at'], records: [] };
const serveIndex = html => {
  if (BREAK === 'keep-sides') html = html.replace("CELL_PERF.mode === 'main' ? 'rgba(0,0,0,0)' : null", "'rgba(0,0,0,0)'");
  if (BREAK === 'per-cell') html = html.replace('let m = mats.get(fill); if (m) return m;', 'let m;');
  if (BREAK === 'wrong-opacity') html = html.replace('m.opacity = c.a;', 'm.opacity = Math.min(1, c.a * 1.5);');
  if (BREAK === 'frontside-a') html = html.replace("side: CELL_PERF.mode === 'b2b' ? 0 : 2", 'side: 0');
  return html;
};
const INDEX = serveIndex(fs.readFileSync('index.html', 'utf8'));
if (BREAK && INDEX === fs.readFileSync('index.html', 'utf8')) { console.log('FAIL  BREAK did not apply: ' + BREAK); process.exit(1); }
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async perf => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: OCEAN_PNG }));
    await ctx.route(BASE + '/index.html*', r => r.fulfill({ status: 200, contentType: 'text/html', body: INDEX }));
    await ctx.route(HUB + '/**', route => { const p = new URL(route.request().url()).pathname, layer = p.split('/').pop();
      if (p === '/') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'x', history: { collecting: false, retained: { exists: false } } }) });
      if (CELLS[layer] || layer === 'drifters') {
        const extra = ['usgs', 'firms', 'ships', 'drifters'].includes(layer) ? REC : layer === 'forest' ? { sweep: { answered: 559, cells_total: 559, oldest_queried_at: RUN } } : {};
        if (layer === 'drifters') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...env('drifters', REC), cells: { '20_53': { count: 2, coverage: cov('adequate') }, '33_80': { count: 1, coverage: cov('partial') } } }) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env(layer, extra)) });
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ layer, retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', index: null }) }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html' + (perf ? '?perf=' + perf : ''), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.cellPolys && (ME.cellPolys('forest') || []).length > 0 && (ME.cellPolys('usgs') || []).length > 0 && (ME.cellPolys('firms') || []).length > 0 && (ME.cellPolys('ships') || []).length > 0, null, { timeout: 30000 });
    await page.waitForTimeout(1500);   // let globe.gl build the objects and the one harvest re-render land
    return { ctx, page, perr };
  };
  // scene facts read through the globe handle
  const facts = async page => { const calls = await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(ME.globe().renderer().info.render.calls)))));
    const f = await page.evaluate(() => {
    const g = ME.globe(), r = g.renderer(); const groups = []; g.scene().traverse(o => { if (o.__globeObjType === 'polygon') groups.push(o); });
    const caps = [], sides = [], meshes = [];
    for (const grp of groups) { const [conic] = grp.children; meshes.push(conic); const mats = Array.isArray(conic.material) ? conic.material : [conic.material];
      const params = conic.geometry && conic.geometry.parameters || {}; const groupsN = conic.geometry && conic.geometry.groups ? conic.geometry.groups.length : 0;
      sides.push({ includeSides: !!params.includeSides, groupsN });
      const capIdx = params.includeSides ? 1 : 0; const m = mats[capIdx]; caps.push(m); }
    const fills = g.polygonsData().map(p => p.fill);
    const ids = new Set(caps.map(m => m && m.uuid));
    const props = caps.map((m, i) => ({ fill: fills[i], hex: m.color.getHex(), op: +m.opacity.toFixed(4), tr: m.transparent, dw: m.depthWrite, dt: m.depthTest, side: m.side, type: m.type, pass: m.__cellShared === undefined ? null : m.__cellShared }));
    return { calls: null, n: groups.length, withSides: sides.filter(s => s.includeSides).length, sideGroups: sides.map(s => s.groupsN), distinctCapMats: ids.size, distinctFills: new Set(fills).size, props, perf: ME.cellPerf(), polys: ['usgs', 'firms', 'ships', 'forest', 'drifters'].map(l => ME.cellPolys(l)) };
  }); f.calls = calls; return f; };
  // hover winners at a fixed set of screen points (inside cells, on shared edges, near the limb) and a canvas pixel snapshot
  const probe = async page => {
    const res = [], shots = [];
    const poses = [
      { pov: { lat: -14, lng: 32, altitude: 1.6 }, pts: [[-8, 34, 'overlap firms+forest 20_53'], [-28, 30, 'overlap 3 layers 15_52'], [-32, 18, 'overlap usgs+firms+ships 14_49'],
        [-8, 36, 'edge 20_53|20_54 firms+forest | firms'], [-6, 36, 'edge 20_53|20_54 upper'], [-4, 34, 'edge 20_53|21_53 forest | forest'],
        [-12, 80.5, 'limb firms 19_65'], [-12, 84.5, 'limb firms+forest 19_66'], [-12, 88.5, 'limb firms 19_67'], [-12, 92.5, 'limb firms 19_68 (unknown)'], [-12, 84, 'limb edge 19_65|19_66'], [-12, 88, 'limb edge 19_66|19_67'],
        [32, 34, 'north ships 30_53'], [40, 34, 'north ships 32_53'], [52, 34, 'north-limb forest 35_53'], [36, 34, 'north open'], [-14, 40, 'open globe']] },
      { pov: { lat: -20, lng: 178, altitude: 1.6 }, pts: [[-18, 178, 'dateline 17_89 firms+forest'], [-18, -178, 'dateline 17_0 firms'], [-18, 180, 'dateline edge 17_89|17_0'], [-18, 174, 'dateline 17_88 forest'], [-18, 176, 'edge 17_88|17_89']] },
    ];
    for (const ps of poses) {
      await page.evaluate(pov => { ME.globe().controls().autoRotate = false; ME.globe().pointOfView(pov, 0); }, ps.pov);
      await page.waitForTimeout(900);
      const pts = await page.evaluate(list => { const g = ME.globe(), rect = g.renderer().domElement.getBoundingClientRect();
        return list.map(([lat, lng, tag]) => { const s = g.getScreenCoords(lat, lng, 0.006); return { tag, x: Math.round(rect.left + s.x), y: Math.round(rect.top + s.y) }; }); }, ps.pts);
      for (const p of pts) { await page.mouse.move(p.x, p.y); await page.waitForTimeout(250);
        const tip = await page.evaluate(() => { const t = document.querySelector('.float-tooltip-kap'); return t && getComputedStyle(t).display !== 'none' && t.textContent ? t.textContent.replace(/\s+/g, ' ').slice(0, 40) : null; });
        res.push([p.tag, tip]); }
      await page.mouse.move(5, 5); await page.waitForTimeout(300);
      shots.push(await page.locator('#globe canvas').first().screenshot());
    }
    return { res, shot: shots[0], shot2: shots[1] };
  };
  const pixDiff = (a, b) => { const A = PNG.sync.read(a), B = PNG.sync.read(b); if (A.width !== B.width || A.height !== B.height) return { size: true };
    let n = 0, max = 0; for (let i = 0; i < A.data.length; i += 4) { const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2])); if (d > 2) n++; if (d > max) max = d; } return { n, max, total: A.width * A.height }; };

  const R = {};
  for (const mode of ['main', 'b1', 'b2a', 'b2b']) {
    const { ctx, page, perr } = await open(mode);
    const f = await facts(page); const pr = await probe(page);
    R[mode] = { f, pr, perr };
    if (mode === 'b2a') {
      // lifetime: Forest off → on through the page's own toggle, then an optional layer on (fetch + render), then off
      const before = f.perf.pass;
      await page.click('button.tgl[data-layer="forest"]'); await page.waitForTimeout(600); await page.click('button.tgl[data-layer="forest"]'); await page.waitForTimeout(1200);
      const f2 = await facts(page);
      ok('b2a lifetime: after Forest off→on every cap material belongs to the current pass', f2.props.every(p => p.pass === f2.perf.pass) && f2.perf.pass > before, { pass: f2.perf.pass, before, stray: f2.props.filter(p => p.pass !== f2.perf.pass).length });
      ok('b2a lifetime: materials follow the distinct fills after the toggle', f2.distinctCapMats === f2.distinctFills, { mats: f2.distinctCapMats, fills: f2.distinctFills });
      await page.click('button.tgl[data-layer="drifters"]'); await page.waitForFunction(() => (ME.cellPolys('drifters') || []).length === 2, null, { timeout: 15000 }); await page.waitForTimeout(1200);
      const f3 = await facts(page);
      ok('b2a lifetime: optional layer on (fetch + render) → every cap material from the current pass, shared by fill', f3.props.every(p => p.pass === f3.perf.pass) && f3.distinctCapMats === f3.distinctFills && f3.n === f.n + 2, { n: f3.n, base: f.n, mats: f3.distinctCapMats, fills: f3.distinctFills });
      await page.click('button.tgl[data-layer="drifters"]'); await page.waitForTimeout(1200);
      const f4 = await facts(page);
      ok('b2a lifetime: optional layer off → back to the base cells, current-pass materials only', f4.n === f.n && f4.props.every(p => p.pass === f4.perf.pass), { n: f4.n });
      const renders = await page.evaluate(async () => { const g = ME.globe(), r = g.renderer(); const t = []; for (let i = 0; i < 5; i++) { const s = performance.now(); r.render(g.scene(), g.camera()); t.push(performance.now() - s); } return r.info.programs ? r.info.programs.length : null; });
      ok('b2a: programs stay few (shared materials compile to a handful of programs)', renders === null || renders < 40, renders);
    }
    ok(`${mode}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }
  const M = R.main.f, B1 = R.b1.f, A = R.b2a.f, Bb = R.b2b.f;
  // cell set
  ok('same cells in every step (count)', [B1, A, Bb].every(x => x.n === M.n) && M.n === 29, [M.n, B1.n, A.n, Bb.n]);
  ok('ME.cellPolys identical in every step', [B1, A, Bb].every(x => JSON.stringify(x.polys) === JSON.stringify(M.polys)));
  ok('perf mode reported', M.perf.mode === 'main' && B1.perf.mode === 'b1' && A.perf.mode === 'b2a' && Bb.perf.mode === 'b2b', [M.perf, B1.perf, A.perf, Bb.perf]);
  // B1
  ok('main: every cell builds side walls (today\'s behaviour)', M.withSides === M.n, M.withSides);
  ok('B1: no cell builds side geometry', B1.withSides === 0 && A.withSides === 0 && Bb.withSides === 0, [B1.withSides, A.withSides, Bb.withSides]);
  ok('B1: 2 fewer draw calls per cell than main', M.calls - B1.calls === 2 * M.n, { main: M.calls, b1: B1.calls, cells: M.n });
  // B2a
  ok('main and b1: one cap material per cell (globe.gl default)', M.distinctCapMats === M.n && B1.distinctCapMats === B1.n, [M.distinctCapMats, B1.distinctCapMats]);
  ok('b2a: one shared cap material per distinct fill', A.distinctCapMats === A.distinctFills && A.distinctFills < A.n, [A.distinctCapMats, A.distinctFills, A.n]);
  const key = p => p.fill; const mainBy = Object.fromEntries(M.props.map(p => [key(p), p]));
  const same = (p, q, keys) => keys.every(k => p[k] === q[k]);
  ok('b2a: each shared material has exactly globe.gl\'s colour, opacity, transparency, depth and side for its fill', A.props.every(p => same(p, mainBy[p.fill], ['hex', 'op', 'tr', 'dw', 'dt', 'side', 'type'])), A.props.filter(p => !same(p, mainBy[p.fill], ['hex', 'op', 'tr', 'dw', 'dt', 'side', 'type'])).slice(0, 3).map(p => [p, mainBy[p.fill]]));
  ok('b2a: DoubleSide (2) on every cap; same draw calls as b1', A.props.every(p => p.side === 2) && A.calls === B1.calls, { calls: [A.calls, B1.calls] });
  ok('b2b: FrontSide (0) on every cap, otherwise as b2a; one fewer draw call per cell than b2a', Bb.props.every(p => p.side === 0) && A.calls - Bb.calls === Bb.n, { calls: [A.calls, Bb.calls], n: Bb.n });
  // picking + pixels against main
  const winners = x => JSON.stringify(R[x].pr.res);
  ok('b1: hover winners identical to main at every probe point (overlaps, edges, dateline, limb, open globe)', winners('b1') === winners('main'), R.b1.pr.res.filter((r, i) => JSON.stringify(r) !== JSON.stringify(R.main.pr.res[i])).concat(['main:']).concat(R.main.pr.res.filter((r, i) => JSON.stringify(r) !== JSON.stringify(R.b1.pr.res[i]))));
  ok('b2a: hover winners identical to main', winners('b2a') === winners('main'), R.b2a.pr.res.filter((r, i) => JSON.stringify(r) !== JSON.stringify(R.main.pr.res[i])));
  ok('probes hit cells at overlaps, edges, the limb and the dateline', R.main.pr.res.length === 22 && ['limb firms 19_65', 'limb firms+forest 19_66', 'north-limb forest 35_53', 'dateline 17_89 firms+forest', 'dateline 17_0 firms'].every(t => (R.main.pr.res.find(r => r[0] === t) || [])[1]), R.main.pr.res);
  const d1 = pixDiff(R.main.pr.shot, R.b1.pr.shot), d2 = pixDiff(R.b1.pr.shot, R.b2a.pr.shot), d3 = pixDiff(R.b2a.pr.shot, R.b2b.pr.shot);
  const e1 = pixDiff(R.main.pr.shot2, R.b1.pr.shot2), e2 = pixDiff(R.b1.pr.shot2, R.b2a.pr.shot2), e3 = pixDiff(R.b2a.pr.shot2, R.b2b.pr.shot2);
  const lit = buf => { const P = PNG.sync.read(buf); let n = 0; for (let i = 0; i < P.data.length; i += 4) if (P.data[i + 2] > 50) n++; return n; };
  ok('the globe actually drew (backdrop pixels present on both poses, every step)', ['main', 'b1', 'b2a', 'b2b'].every(m => lit(R[m].pr.shot) > 20000 && lit(R[m].pr.shot2) > 20000), ['main', 'b1', 'b2a', 'b2b'].map(m => [lit(R[m].pr.shot), lit(R[m].pr.shot2)]));
  ok('draw calls were counted (the renderer drew frames)', M.calls > 0 && B1.calls > 0, [M.calls, B1.calls]);
  ok('b2a vs b1: pixels identical on both poses (same materials by construction)', d2.n === 0 && e2.n === 0, [d2, e2]);
  console.log('INFO  hover winners (main):', JSON.stringify(R.main.pr.res));
  console.log('INFO  dateline pose pixels main→b1:', JSON.stringify(e1), ' b2a→b2b:', JSON.stringify(e3));
  console.log('INFO  draw calls (29 cells, swiftshader): main', M.calls, '· b1', B1.calls, '· b2a', A.calls, '· b2b', Bb.calls);
  console.log('INFO  pixels differing (>2/255) main→b1:', JSON.stringify(d1), ' b1→b2a:', JSON.stringify(d2), ' b2a→b2b:', JSON.stringify(d3));
  fs.writeFileSync('/home/claude/spike/cell-perf-main.png', R.main.pr.shot); fs.writeFileSync('/home/claude/spike/cell-perf-b1.png', R.b1.pr.shot); fs.writeFileSync('/home/claude/spike/cell-perf-b2b.png', R.b2b.pr.shot); fs.writeFileSync('/home/claude/spike/cell-perf-main2.png', R.main.pr.shot2); fs.writeFileSync('/home/claude/spike/cell-perf-b1-2.png', R.b1.pr.shot2);
  // B1 vs main is NOT pixel-identical: the invisible side walls wrote depth and hid parts of neighbouring outlines; without them
  // those outline pixels draw. Reported for Chad (rc packet, comparison images); the guard is that the change stays this small.
  ok('b1 vs main: only a sliver of pixels differs (< 0.1 % of the canvas on both poses; outline pixels, see packet)', d1.n < d1.total * 0.001 && e1.n < e1.total * 0.001 && d1.n > 0, [d1, e1]);
  console.log('INFO  b2b hover winners differing from main:', JSON.stringify(R.b2b.pr.res.filter((r, i) => JSON.stringify(r) !== JSON.stringify(R.main.pr.res[i]))));
  await browser.close(); clearTimeout(wd);
  console.log(`${pass} passed, ${fail} failed${BREAK ? '  (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + (e && e.stack || e)); process.exit(1); });
