/* Moon / LRO science rev 2 evidence (26 Nov 2026, Claude). Two browser measurements, real Chrome under SwiftShader:
 *  1. DECODE: the proposed readout grid (int16 little-endian, whole metres, -32768 = withheld, gzip) fetched and decoded in the page
 *     with fetch -> DecompressionStream('gzip') -> Int16Array (no image, no canvas). Every one of the 1,036,800 values is compared
 *     with the expected integers worked out in Node from the PDS float file; then named cells (negative, zero, extremes, withheld).
 *  2. RENDER BASELINE: the CURRENT moon.html (main, unchanged), globe idle after start: animation-frame callbacks and WebGL draw
 *     calls counted over 5 s, with reduced motion on and off; then the same while the page is hidden.
 * Run (repo served on 127.0.0.1:8899):  node measure_browser.cjs <candidate.i16.gz> <ldem_4_float.img> [globe.gl.min.js]
 * Not a test suite and not part of the page; evidence for docs/concepts/MOON-LRO-SCIENCE-PROPOSAL.md rev 2. */
const { chromium } = require('playwright'); const fs = require('fs'); const zlib = require('zlib');
const [GZ, FLOAT, LIB = '/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js'] = process.argv.slice(2);
const BASE = 'http://127.0.0.1:8899';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ---------- 1. decode ----------
  const f = new Float32Array(fs.readFileSync(FLOAT).buffer.slice(0));
  const gzBytes = fs.readFileSync(GZ);
  const exp = new Int16Array(zlib.gunzipSync(gzBytes).buffer.slice(0));   // the file's own integers, decoded by Node's zlib: the page must reproduce them exactly
  // the file against the PDS source: rows 0-1 (north of 89.5 N) must be -32768; every other value within 0.5 m (+1e-3 m float32 slack) of the source
  let wh = 0, worst = 0, badRows = 0;
  for (let i = 0; i < f.length; i++) { if (i < 2 * 1440) { if (exp[i] !== -32768) badRows++; else wh++; continue; }
    const e = Math.abs(exp[i] - f[i] * 1000); if (e > worst) worst = e; if (exp[i] === -32768) badRows++; }
  console.log('decode/node: file', gzBytes.length, 'B;', exp.length, 'values; withheld', wh, '(expected 2880); wrong withheld/kept markers', badRows, '; worst |file - source|', worst.toFixed(4), 'm (bound 0.5)');
  { const ctx = await b.newContext(); const p = await ctx.newPage();
    await ctx.route('**/cand.i16.gz', r => r.fulfill({ status: 200, contentType: 'application/octet-stream', body: gzBytes }));
    await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' });
    const res = await p.evaluate(async () => {
      const t0 = performance.now(); const r = await fetch('/cand.i16.gz'); let buf = await r.arrayBuffer(); const t1 = performance.now();
      const u = new Uint8Array(buf); const gz = u[0] === 0x1f && u[1] === 0x8b;   // tolerate a server that already removed the gzip layer
      if (gz) buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const t2 = performance.now();
      const a = new Int16Array(buf); window.__H = a;
      return { fetched: u.length, decoded: buf.byteLength, n: a.length, gz, fetchMs: +(t1 - t0).toFixed(1), decodeMs: +(t2 - t1).toFixed(1) };
    });
    console.log('decode/browser:', JSON.stringify(res));
    // full comparison in chunks
    let diff = 0, first = -1; const CH = 1440 * 60;
    for (let s = 0; s < exp.length; s += CH) {
      const got = await p.evaluate(([s, n]) => Array.from(window.__H.subarray(s, s + n)), [s, CH]);
      for (let k = 0; k < got.length; k++) if (got[k] !== exp[s + k]) { diff++; if (first < 0) first = s + k; }
    }
    console.log('decode/browser: all', exp.length, 'values compared with the same file decoded by Node; differing:', diff, first >= 0 ? 'first at ' + first : '');
    // named cells: lat/lon -> index exactly as the page would do it (pixel registered, 0-360 E, row 0 at the north edge)
    const idx = (lat, lonE) => { const r = Math.min(719, Math.floor((90 - lat) * 4)), c = Math.floor((((lonE % 360) + 360) % 360) * 4) % 1440; return r * 1440 + c; };
    const named = [['highest cell (5.4125N 201.3665E)', 5.4125, 201.3665], ['lowest cell (70.4S 187.6E)', -70.4, 187.6],
      ['withheld (89.9N 10E)', 89.9, 10], ['withheld edge (89.51N 100E)', 89.51, 100], ['first kept row (89.49N 100E)', 89.49, 100],
      ['seam west side (0N 359.99E)', 0, 359.99], ['seam east side (0N 0.01E)', 0, 0.01], ['antimeridian (0N 180E)', 0, 180], ['south pole row (89.9S 0E)', -89.9, 0]];
    const zeroAt = exp.findIndex((v, i) => i >= 2 * 1440 && v === 0), negAt = exp.findIndex(v => v < 0 && v > -32768);
    for (const [name, la, lo] of named) { const i = idx(la, lo); const got = await p.evaluate(i => window.__H[i], i);
      console.log(`  ${name}: index ${i}, page ${got}, expected ${exp[i]}, source float ${(f[i] * 1000).toFixed(3)} m`); }
    for (const [name, i] of [['a zero-metre cell', zeroAt], ['first negative cell', negAt]]) { const got = await p.evaluate(i => window.__H[i], i);
      console.log(`  ${name}: index ${i}, page ${got}, expected ${exp[i]}, source float ${(f[i] * 1000).toFixed(3)} m`); }
    let mx = -1e9, mn = 1e9; for (let i = 2 * 1440; i < exp.length; i++) { if (exp[i] > mx) mx = exp[i]; if (exp[i] < mn) mn = exp[i]; }
    const pm = await p.evaluate(() => { let mx = -1e9, mn = 1e9; for (let i = 2880; i < window.__H.length; i++) { const v = window.__H[i]; if (v > mx) mx = v; if (v < mn) mn = v; } return [mn, mx]; });
    console.log('  extremes outside withheld rows: page', pm, 'expected', [mn, mx]);
    await ctx.close(); }

  // ---------- 2. render baseline on the current moon.html ----------
  const LIBJS = fs.readFileSync(LIB, 'utf8');
  for (const motion of ['reduce', 'no-preference']) {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: motion });
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: LIBJS }));
    await ctx.addInitScript(() => {
      window.__c = { raf: 0, draw: 0 };
      const R = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => R(t => { window.__c.raf++; cb(t); });
      for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue;
        for (const m of ['drawElements', 'drawArrays']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { window.__c.draw++; return o.apply(this, a); }; } }
    });
    const p = await ctx.newPage();
    await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 });
    await p.waitForTimeout(3000);   // let start-up settle
    const a = await p.evaluate(() => ({ ...window.__c })); await p.waitForTimeout(5000); const z = await p.evaluate(() => ({ ...window.__c }));
    console.log(`render/${motion}: idle 5 s on the current page: animation frames ${z.raf - a.raf}, WebGL draw calls ${z.draw - a.draw}`);
    // a second tab in front. Headless Chrome still reports visibilityState 'visible' here, so this is a background-tab reading, NOT a hidden-page measurement
    const p2 = await ctx.newPage(); await p2.goto('about:blank'); await p2.bringToFront();
    const h0 = await p.evaluate(() => ({ ...window.__c, vis: document.visibilityState })); await p.waitForTimeout(5000); const h1 = await p.evaluate(() => ({ ...window.__c, vis: document.visibilityState }));
    console.log(`render/${motion}: background tab (visibilityState reported '${h1.vis}'), 5 s: animation frames ${h1.raf - h0.raf}, WebGL draw calls ${h1.draw - h0.draw}`);
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
