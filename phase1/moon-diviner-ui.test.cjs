/* Moon temperature layer (moon.html, moonsci.js) — real globe.gl 2.45.0 under SwiftShader. MOON-DIVINER-PROPOSAL rev 2 §5, §6.3, §8 item 4,
 * with GPT's review notes (range-cap wording; pending requests cancelled on leave; radio restored on a failed mode change).
 *  A. lossless: every decoded code (value, n, range; noon and midnight; 259,200 cells each) equals the build file; readout sentences for
 *     n = 1, 2-4, 0, withheld at each mask edge, the seam, the range cap (crafted file); no "0 K" or bare number for no data or withheld
 *  B. registration: index anchors; texture column/row mapping; a crafted file with marked cells read back by real clicks on screen, and
 *     the screen colour there; colour under clicks on the real map against the ramp computed here from the frozen scales
 *  C. transitions (§5): saved once; restore on leave for the current minute; Earth view never reopened; every direction of failure keeps
 *     the shown map; rapid clicks across all four modes; cancel during entry; leave cancels a pending change; radio restored on failure
 *  D. network and rendering: nothing fetched while off; one request on first use for both modes; none later; idle draws temp on vs off
 *  E. §6.3 rejections: pins, short file, already-decompressed, wrong header fields, payload hash, cell-consistency cases (crafted with
 *     valid pins injected into the page so the page's own checks are what reject them)
 *  F. keyboard, live region, scale line on mode change, narrow layouts, LRO overlay untouched, height never used
 * Run: node phase1/moon-diviner-ui.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=row|col|flip|shift|tex180|nosave|norestore|late|noleavecancel|radio|nopin|nocell|nomask|cap|n1|leak|celsius must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const crypto = require('crypto');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const GZ = fs.readFileSync(path.join(ROOT, 'assets/moon/diviner/gcp-tbol-nm-R1.bin.gz')), RAW = zlib.gunzipSync(GZ);
const N = 259200, OFF = { value: { noon: 64, mid: 64 + 2 * N }, n: { noon: 64 + 4 * N, mid: 64 + 5 * N }, range: { noon: 64 + 6 * N, mid: 64 + 7 * N } };
const code = (raw, plane, m, i) => plane === 'value' ? raw.readUInt16LE(OFF.value[m] + 2 * i) : raw[OFF[plane][m] + i];
const idx = (lat, lng) => Math.min(359, Math.max(0, Math.floor((90 - lat) * 2))) * 720 + Math.floor((((lng % 360) + 360) % 360) * 2) % 720;
const SCALE = { noon: [281, 395], mid: [70, 105] };
const RAMP = ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const rampAt = (m, v) => { const [lo, hi] = SCALE[m]; const t = Math.min(1, Math.max(0, (v / 10 - lo) / (hi - lo))) * 9, k = Math.min(8, Math.floor(t)), f = t - k; return RAMP[k].map((c, j) => Math.round(c + (RAMP[k + 1][j] - c) * f)); };
const near = (a, b, tol = 36) => a.every((v, k) => Math.abs(v - b[k]) <= tol);
/** A crafted page file: a copy of the real one changed by mod(buf), the header payload hash recomputed unless keepHash. Returns body and pins. */
function craft(mod, { keepHash = false } = {}) {
  const b = Buffer.from(RAW); mod(b); if (!keepHash) crypto.createHash('sha256').update(b.subarray(64)).digest().copy(b, 32);
  const gz = zlib.gzipSync(b, { level: 9 }); return { gz, raw: b, pins: { gzBytes: gz.length, gzSha: sha(gz), rawBytes: b.length, rawSha: sha(b) } };
}
const setCell = (b, m, i, v, n, r) => { b.writeUInt16LE(v, OFF.value[m] + 2 * i); b[OFF.n[m] + i] = n; b[OFF.range[m] + i] = r; };

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await br.newContext({ viewport: { width: opt.w || 1000, height: opt.h || 900 }, reducedMotion: 'reduce' });
    const hits = { temp: 0, hgrid: 0, htex: 0 };
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonsci.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'moonsci.js'), 'utf8');
      if (opt.pins) { const P = opt.pins; s = s.replace(/gzBytes: 720037, gzSha: '[0-9a-f]+',\n    rawBytes: 2073664, rawSha: '[0-9a-f]+'/, `gzBytes: ${P.gzBytes}, gzSha: '${P.gzSha}',\n    rawBytes: ${P.rawBytes}, rawSha: '${P.rawSha}'`); }
      const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); };
      if (BREAK === 'row') B('Math.floor((90 - lat) * 2)', 'Math.round((90 - lat) * 2)');
      if (BREAK === 'col') B('Math.floor((((lng % 360) + 360) % 360) * 2) % TC', 'Math.floor((((lng + 180) % 360 + 360) % 360) * 2) % TC');
      if (BREAK === 'flip') B('y0 = PX * r;', 'y0 = PX * (TR - 1 - r);');
      if (BREAK === 'shift') B('const texX = c => (PX * c + TW / 2) % TW;', 'const texX = c => (PX * c + TW / 2 + PX) % TW;');
      if (BREAK === 'tex180') B('const texX = c => (PX * c + TW / 2) % TW;', 'const texX = c => (PX * c) % TW;');
      if (BREAK === 'nosave') B('if (!from) { MS.saved = h.lit();', 'MS.saved = h.lit(); if (!from) {');
      if (BREAK === 'norestore') B('if (MS.saved && MS.saved.on) h.litRestore(true);', '');
      if (BREAK === 'late') B('if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }', '');
      if (BREAK === 'noleavecancel') B('const h = MG(), was = MS.active; cancel();', 'const h = MG(), was = MS.active;');
      if (BREAK === 'radio') B('function syncRadio() { if (!tmode) return;', 'function syncRadio() { return;');
      if (BREAK === 'nopin') B("if (raw.byteLength !== TF.rawBytes || await hex(raw) !== TF.rawSha) throw", "if (false) throw");
      if (BREAK === 'nocell') B('if (!okCell) throw', 'if (false) throw');
      if (BREAK === 'nomask') B('const masked = Math.abs(8975 - 50 * r) > mask;', 'const masked = Math.abs(8975 - 50 * r) > mask + 1000;');
      if (BREAK === 'cap') B("q === 254 ? 'at least 253.5 K (display capped)' : q + ' K'", "q + ' K'");
      if (BREAK === 'n1') B("n === 1 ? 'one bin; range unavailable'", "n === 1 ? 'range between bins 0 K'");
      if (BREAK === 'leak') B("const drop = () => { for (const u of made) { URL.revokeObjectURL(u); T.revoked++; } };", "const drop = () => {};");
      if (BREAK === 'celsius') B('const s = x - 2731.5,', 'const s = x - 2730,');
      // R1 (GPT preview review): the deadline must end the request, and the commit gate must refuse an aborted request
      const DL = "const tm = setTimeout(() => { if (MS.pend && MS.pend.tok === tok) { cancel(); LAYER[target].failed(new Why('it took too long'), target); } }, TIMEOUT_MS);";
      if (BREAK === 'deadline') { B(DL, 'const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);'); B("    if (ctl.signal.aborted) { res.drop(); syncRadio(); LAYER[target].failed(new Why('it took too long or was cancelled'), target); paint(); return; }\n", ''); }   // the reviewed code
      if (BREAK === 'deadlinetimer') B(DL, 'const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);');   // the gate alone: the pending request never settles
      if (BREAK && !globalThis.__brkLogged) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): ' + BREAK); }
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    await ctx.route('**/assets/moon/diviner/gcp-tbol-nm-R1.bin.gz*', async r => { hits.temp++;
      if (opt.tempDelay) await new Promise(res => setTimeout(res, opt.tempDelay));
      if (opt.tempHang) return;
      if (opt.temp404) return r.fulfill({ status: 404, body: '' }).catch(() => {});
      let body = opt.body || GZ;
      if (opt.tempRaw) body = opt.rawBody || RAW;
      if (opt.tempBad) { body = Buffer.from(body); body[body.length >> 1] ^= 1; }
      if (opt.tempShort) body = body.subarray(0, body.length - 10);
      r.fulfill({ status: 200, contentType: 'application/octet-stream', body }).catch(() => {}); });
    await ctx.route('**/assets/moon/lola/ldem4-m-R1.i16.gz*', async r => { hits.hgrid++; if (opt.height404) return r.fulfill({ status: 404, body: '' }).catch(() => {});
      if (opt.heightDelay) await new Promise(res => setTimeout(res, opt.heightDelay)); r.continue().catch(() => {}); });
    await ctx.route('**/assets/moon/lola/ldem4-colour-R1.png*', r => { hits.htex++; r.continue().catch(() => {}); });
    await ctx.addInitScript(() => { window.__u = { made: [], revoked: [] }; const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = mk(b); window.__u.made.push(u); return u; }; URL.revokeObjectURL = u => { window.__u.revoked.push(u); rv(u); }; });
    if (opt.hold) await ctx.addInitScript(() => {   // R1: hold the PNG callback and the picture decode until released (stages the deadline cannot abort)
      window.__hold = { blob: false, decode: false, blobs: [], decodes: [] };
      const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, ...a) { if (window.__hold.blob) { window.__hold.blobs.push(() => tb.call(this, cb, ...a)); return; } return tb.call(this, cb, ...a); };
      const dc = HTMLImageElement.prototype.decode; HTMLImageElement.prototype.decode = function () { if (window.__hold.decode) return new Promise((res, rej) => window.__hold.decodes.push(() => dc.call(this).then(res, rej))); return dc.call(this); };
      window.__release = () => { const n = window.__hold.blobs.length + window.__hold.decodes.length; for (const f of window.__hold.blobs.splice(0)) f(); for (const f of window.__hold.decodes.splice(0)) f(); return n; }; });
    if (opt.noBlob) await ctx.addInitScript(() => { const o = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, ...a) { if (window.__noBlob) return cb(null); return o.call(this, cb, ...a); }; });
    if (opt.noAbort) await ctx.addInitScript(() => { AbortController.prototype.abort = function () {}; });
    if (opt.count) await ctx.addInitScript(() => { window.__c = { draw: 0 }; for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue;
      for (const m of ['drawElements', 'drawArrays']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { window.__c.draw++; return o.apply(this, a); }; } } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 }); await p.waitForTimeout(1000);
    return { ctx, p, hits, errs };
  };
  const attr = (p, sel, a) => p.evaluate(([sel, a]) => { const e = document.querySelector(sel); return e ? e.getAttribute(a) : null; }, [sel, a]);
  const text = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent : null; }, sel);
  const hidden = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return !e || e.hidden || getComputedStyle(e).display === 'none'; }, sel);
  const press = (p, sel) => p.evaluate(sel => document.querySelector(sel).click(), sel);
  const radio = (p, v) => p.evaluate(v => { const r = document.querySelector(`#mg-temp-mode input[value="${v}"]`); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  const checkedRadio = p => p.evaluate(() => document.querySelector('#mg-temp-mode input:checked').value);
  const sci = p => p.evaluate(() => MoonScience.state());
  const waitActive = (p, a, t = 30000) => p.waitForFunction(a => MoonScience.state().active === a && !MoonScience.state().pending, a, { timeout: t }).then(() => true, () => false);
  const waitIdle = (p, t = 30000) => p.waitForFunction(() => !MoonScience.state().pending, null, { timeout: t }).then(() => true, () => false);
  const texUrl = p => p.evaluate(() => MoonGlobe.globe().globeImageUrl());
  const live = p => p.evaluate(() => window.__u.made.filter(u => !window.__u.revoked.includes(u)).length);
  const toGlobe = p => p.evaluate(() => document.getElementById('mg-globe').scrollIntoView({ block: 'center' }));
  const centreRGB = async (p, x, y) => { const s = await p.screenshot({ clip: { x: x - 2, y: y - 2, width: 4, height: 4 } }); const png = PNG.sync.read(s); const k = 4 * (1 * 4 + 1); return [png.data[k], png.data[k + 1], png.data[k + 2]]; };
  const litOn = async p => { await press(p, '#mg-lit'); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {}); };
  const NOW_MIN = () => Math.floor(Date.now() / 60000) * 60000;

  // ---- G (R1, GPT's preview review): the 15 s deadline ends the request even while a stage that cannot be aborted is still running
  //      (the temperature PNG callback; the height picture decode). Entry and replacement for each; the late result is released.
  const held = p => p.evaluate(() => window.__hold.blobs.length + window.__hold.decodes.length);
  const waitHeld = p => p.waitForFunction(() => window.__hold.blobs.length + window.__hold.decodes.length > 0, null, { timeout: 20000 }).then(() => true, () => false);
  const DEADLINE_WAIT = 16000;
  { // G1 temperature entry, PNG callback held past the deadline; then a retry, with the stale result released during the retry
    const { ctx, p } = await mk({ hold: true }); await litOn(p);
    await p.evaluate(() => { window.__hold.blob = true; }); await press(p, '#mg-temp');
    ok('G1 setup: the PNG callback is held while entering', await waitHeld(p) && (await sci(p)).pending === 'temp-noon');
    await p.waitForTimeout(DEADLINE_WAIT);
    const s = await sci(p), L = await p.evaluate(() => MoonGlobe.light()), t = await text(p, '#mg-temp-read');
    ok('G1 at the deadline (callback still held): the request has settled; nothing changed; the reason is shown', s.pending === null && s.active === null && s.saved === null && s.commits === 0
      && L.on && /lroc_color_2k/.test(await texUrl(p)) && !(await p.evaluate(() => document.getElementById('mg-lit').disabled)) && (await attr(p, '#mg-temp', 'aria-pressed')) === 'false'
      && /Temperature map could not be loaded: it took too long\. The globe is unchanged\./.test(t), { s, t });
    await p.evaluate(() => { window.__hold.blob = false; }); await press(p, '#mg-temp'); await p.evaluate(() => window.__release()); await p.waitForTimeout(500);
    ok('G1 retry succeeds while the stale result is released', await waitActive(p, 'temp-noon') && (await sci(p)).commits === 1 && !/could not be loaded/.test(await text(p, '#mg-temp-read')));
    await p.waitForFunction(() => window.__u.made.length >= 2 && window.__u.revoked.length >= 1, null, { timeout: 15000 }).catch(() => {});   // the late PNG finishes in its own time
    ok('G1 the late PNG became an object URL that was released, never cached or shown: exactly one live URL (the retry\'s)', (await live(p)) === 1 && (await p.evaluate(() => window.__u.made.length)) === 2 && (await p.evaluate(() => window.__u.revoked.length)) === 1
      && (await texUrl(p)) === (await p.evaluate(() => window.__u.made.filter(u => !window.__u.revoked.includes(u))[0])), await p.evaluate(() => window.__u));
    await ctx.close(); }
  { // G2 temperature replacement noon -> midnight, PNG held: noon stays, radio back on noon, saved lighting kept
    const { ctx, p } = await mk({ hold: true }); await litOn(p);
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); const tu = await texUrl(p), s0 = await sci(p);
    await p.evaluate(() => { window.__hold.blob = true; }); await radio(p, 'midnight'); ok('G2 setup: midnight PNG held', await waitHeld(p));
    await p.waitForTimeout(DEADLINE_WAIT);
    const s = await sci(p);
    ok('G2 at the deadline: noon still shown, radio back on noon, saved lighting unchanged, reason shown', s.active === 'temp-noon' && s.pending === null && (await texUrl(p)) === tu && (await checkedRadio(p)) === 'noon'
      && JSON.stringify(s.saved) === JSON.stringify(s0.saved) && /it took too long\. The map shown is unchanged\./.test(await text(p, '#mg-temp-read')), s);
    const n = await p.evaluate(() => window.__release()); await p.waitForTimeout(1500);
    ok('G2 after the late PNG: still noon, nothing cached for midnight, only the noon texture alive', n === 1 && (await sci(p)).active === 'temp-noon' && (await texUrl(p)) === tu && !(await p.evaluate(() => MoonTemp.state().cached.mid)) && (await live(p)) === 1);
    await p.evaluate(() => { window.__hold.blob = false; }); await radio(p, 'midnight'); ok('G2 retry of midnight succeeds', await waitActive(p, 'temp-mid'));
    await ctx.close(); }
  { // G3 height entry, picture decode held past the deadline
    const { ctx, p } = await mk({ hold: true }); await litOn(p);
    await p.evaluate(() => { window.__hold.decode = true; }); await press(p, '#mg-height');
    ok('G3 setup: the height picture decode is held while entering', await waitHeld(p) && (await sci(p)).pending === 'height');
    await p.waitForTimeout(DEADLINE_WAIT);
    const s = await sci(p);
    ok('G3 at the deadline: settled, nothing changed, reason shown', s.pending === null && s.active === null && (await p.evaluate(() => MoonGlobe.light().on)) && /lroc_color_2k/.test(await texUrl(p))
      && /Height map could not be loaded: it took too long\. The globe is unchanged\./.test(await text(p, '#mg-height-read')) && (await attr(p, '#mg-height', 'aria-pressed')) === 'false', s);
    await p.evaluate(() => window.__release()); await p.waitForTimeout(1500);
    ok('G3 the late picture is released, nothing cached', (await live(p)) === 0 && !(await p.evaluate(() => MoonHeight.state().cached.tex)) && (await sci(p)).active === null);
    await p.evaluate(() => { window.__hold.decode = false; }); await press(p, '#mg-height'); ok('G3 retry succeeds', await waitActive(p, 'height'));
    await ctx.close(); }
  { // G4 replacement temperature -> height, picture decode held
    const { ctx, p } = await mk({ hold: true });
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); const tu = await texUrl(p), s0 = await sci(p);
    await p.evaluate(() => { window.__hold.decode = true; }); await press(p, '#mg-height'); ok('G4 setup: height picture decode held', await waitHeld(p));
    await p.waitForTimeout(DEADLINE_WAIT);
    const s = await sci(p);
    ok('G4 at the deadline: temperature still shown, saved unchanged, reason in the height line', s.active === 'temp-noon' && s.pending === null && (await texUrl(p)) === tu && JSON.stringify(s.saved) === JSON.stringify(s0.saved)
      && /Height map could not be loaded: it took too long\. The map shown is unchanged\./.test(await text(p, '#mg-height-read')), s);
    await p.evaluate(() => window.__release()); await p.waitForTimeout(1500);
    ok('G4 the late picture is released: temperature stays, only its texture alive', (await sci(p)).active === 'temp-noon' && (await texUrl(p)) === tu && (await live(p)) === 1);
    await p.evaluate(() => { window.__hold.decode = false; }); await press(p, '#mg-height'); ok('G4 retry succeeds', await waitActive(p, 'height'));
    await ctx.close(); }
  if (process.env.ONLY === 'G') { await br.close(); console.log(`moon-diviner-ui (G only): ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0); }

  // ---- A, D (network) and F (height never used)
  { const { ctx, p, hits, errs } = await mk();
    ok('F off at start: picture, legend hidden, radios disabled, no temperature request', /lroc_color_2k/.test(await texUrl(p)) && await hidden(p, '#mg-temp-leg') && hits.temp === 0
      && (await p.evaluate(() => [...document.querySelectorAll('#mg-temp-mode input')].every(r => r.disabled))) && (await attr(p, '#mg-temp', 'aria-pressed')) === 'false');
    await press(p, '#mg-temp'); const onA = await waitActive(p, 'temp-noon'); ok('A temperature switches on (noon by default)', onA);
    if (!onA) { fail++; console.log('FAIL A: the rest of this block is not run, because temperature did not switch on (counted as one failure)'); } else {
    ok('D one request on first use', hits.temp === 1, hits);
    ok('B texture is a drawn picture (blob)', /^blob:/.test(await texUrl(p)));
    // every code, both modes
    let diff = 0, first = null;
    for (const m of ['noon', 'mid']) for (const pl of ['value', 'n', 'range']) for (let s = 0; s < N; s += 64800) {
      const got = await p.evaluate(([m, pl, s]) => Array.from(MoonTemp.grid()[pl][m].subarray(s, s + 64800)), [m, pl, s]);
      for (let k = 0; k < got.length; k++) if (got[k] !== code(RAW, pl, m, s + k)) { diff++; if (!first) first = [m, pl, s + k]; } }
    ok('A all 1,555,200 decoded codes equal the build file', diff === 0, { diff, first });
    // readout sentences by state, through the page's own wording
    const find = (m, pred) => { for (let i = 0; i < N; i++) if (pred(code(RAW, 'value', m, i), code(RAW, 'n', m, i), code(RAW, 'range', m, i), i)) return i; return -1; };
    for (const m of ['noon', 'mid']) {
      const word = m === 'noon' ? 'noon' : 'midnight';
      const i1 = find(m, (v, n) => n === 1), i4 = find(m, (v, n) => n === 4), i0 = find(m, v => v === 0), iw = find(m, v => v === 1);
      const t1 = await p.evaluate(([m, i]) => MoonTemp.text(m, i), [m, i1]), t4 = await p.evaluate(([m, i]) => MoonTemp.text(m, i), [m, i4]);
      const t0 = await p.evaluate(([m, i]) => MoonTemp.text(m, i), [m, i0]), tw = await p.evaluate(([m, i]) => MoonTemp.text(m, i), [m, iw]);
      const v1 = code(RAW, 'value', m, i1), v4 = code(RAW, 'value', m, i4), r4 = code(RAW, 'range', m, i4);
      ok(`A ${word} n = 1: value, "one bin; range unavailable", no range number`, t1.includes((v1 / 10).toFixed(1) + ' K') && /one bin; range unavailable/.test(t1) && !/range between bins/.test(t1) && t1.includes('around local ' + word), t1);
      ok(`A ${word} n = 4: value, mean of 4 bins, range in whole K`, t4.includes((v4 / 10).toFixed(1) + ' K') && /mean of 4 quarter-hour bins/.test(t4) && t4.includes(`range between bins ${r4} K`), t4);
      ok(`A ${word} n = 0: "no valid data in this window", no number in kelvin`, /no valid data in this window for this cell/.test(t0) && !/\d K\b/.test(t0), t0);
      ok(`A ${word} withheld: our display limit, not coverage, no kelvin`, /Our display limit is 70° latitude for noon \(80° for midnight\)/.test(tw) && /not the edge of Diviner’s coverage/.test(tw) && !/\d K\b/.test(tw), tw);
      ok(`A ${word}: °C = K − 273.15 rounded half away from zero`, (() => { const s = v4 - 2731.5, c = Math.sign(s) * Math.round(Math.abs(s)); return t4.includes(`(${c < 0 ? '−' : ''}${(Math.abs(c) / 10).toFixed(1)} °C)`); })(), t4);
    }
    // mask edges: the rows either side of 70 (noon) and 80 (midnight), both hemispheres
    for (const [m, edge] of [['noon', 70], ['mid', 80]]) for (const sgn of [1, -1]) {
      const inside = await p.evaluate(([la, m]) => MoonTemp.cell(la, 10, m), [sgn * (edge - 0.25), m]), outside = await p.evaluate(([la, m]) => MoonTemp.cell(la, 10, m), [sgn * (edge + 0.25), m]);
      ok(`A mask edge ${m} ${sgn > 0 ? 'N' : 'S'}: ${edge - 0.25}° shown, ${edge + 0.25}° withheld`, inside.value !== 1 && outside.value === 1, { inside, outside }); }
    // the seam: lookups either side of 0/360 E and of 180
    for (const [la, lo] of [[0.1, 359.9999], [0.1, 0.0001], [0.1, 179.9999], [0.1, 180.0001], [0.1, -0.0001], [10.0001, 20.0001], [9.9999, 19.9999], [89.99, 5], [-89.99, 5]]) {
      const got = await p.evaluate(([a, o]) => MoonTemp.cell(a, o, 'noon').i, [la, lo]); ok(`B lookup ${la}, ${lo} = build cell`, got === idx(la, lo), { got, want: idx(la, lo) }); }
    ok('B anchors: 0.25 N 0.25 E is row 179, column 0; -179.75 is column 360; +179.75 is column 359; 89.75 N row 0; 89.75 S row 359',
      (await p.evaluate(() => [MoonTemp.index(0.25, 0.25), MoonTemp.index(0.25, -179.75), MoonTemp.index(0.25, 179.75), MoonTemp.index(89.75, 0.25), MoonTemp.index(-89.75, 0.25)]))
        .join() === [179 * 720, 179 * 720 + 360, 179 * 720 + 359, 0, 359 * 720].join());
    ok('B texture columns: grid column 0 (0.25 E) starts at x 1440, column 360 (-179.75) at x 0, column 359 at x 2876', (await p.evaluate(() => [MoonTemp.texX(0), MoonTemp.texX(360), MoonTemp.texX(359)])).join() === '1440,0,2876');
    // later toggles and the other mode: no new requests
    await radio(p, 'midnight'); ok('A midnight from the same file', await waitActive(p, 'temp-mid'));
    await press(p, '#mg-temp'); await waitIdle(p); await press(p, '#mg-temp'); await waitActive(p, 'temp-mid');
    ok('D no requests for the second mode or later toggles', hits.temp === 1, hits);
    ok('F opening again opens the mode last shown (radio kept)', (await checkedRadio(p)) === 'midnight');
    ok('F no page errors', errs.length === 0, errs); }
    await ctx.close(); }

  // ---- A: range cap wording (crafted valid file: one cell with code 254, one cell n = 2 range 0)
  { const ic = idx(0.25, 0.25), iz = idx(0.25, 0.75);
    const c = craft(b => { setCell(b, 'noon', ic, 3000, 2, 254); setCell(b, 'noon', iz, 3000, 2, 0); });
    const { ctx, p } = await mk({ body: c.gz, pins: c.pins });
    await press(p, '#mg-temp'); ok('A crafted valid file accepted with its own pins', await waitActive(p, 'temp-noon'));
    const t = await p.evaluate(i => MoonTemp.text('noon', i), ic), tz = await p.evaluate(i => MoonTemp.text('noon', i), iz);
    ok('A range cap: "at least 253.5 K (display capped)" (GPT note 1)', /range between bins at least 253\.5 K \(display capped\)/.test(t) && !/254 K/.test(t), t);
    ok('A range 0 with two bins is shown as 0 K (a real zero spread, not n = 1)', /mean of 2 quarter-hour bins · range between bins 0 K/.test(tz), tz);
    await ctx.close(); }

  // ---- B: registration by real clicks on a crafted file with marked cells, and colour on the real map
  { const marks = [[20.25, 40.25], [-30.25, 259.75], [0.25, 0.25], [0.25, 359.75], [45.25, 179.75], [45.25, 180.25], [-60.25, 120.25]];
    const c = craft(b => { for (const [la, lo] of marks) for (const m of ['noon', 'mid']) setCell(b, m, idx(la, lo), 4500, 4, 0); });
    const { ctx, p } = await mk({ body: c.gz, pins: c.pins });
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await toGlobe(p);
    for (let k = 0; k < 8; k++) await press(p, '#mg-zin');
    for (const [la, lo] of marks) {
      await p.evaluate(([a, o]) => MoonGlobe.point(a, o), [la, lo]); await toGlobe(p); await p.waitForTimeout(400);
      const sc = await p.evaluate(([a, o]) => { const s = MoonGlobe.screen(a, o), r = document.getElementById('mg-globe').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, [la, lo]);
      await p.mouse.click(sc.x, sc.y); await p.waitForTimeout(250);
      const v = await attr(p, '#mg-temp-read', 'data-value'), cl = +(await attr(p, '#mg-temp-read', 'data-lat')), cg = +(await attr(p, '#mg-temp-read', 'data-lng'));
      ok(`B click on marked cell ${la}, ${lo}: readout 450.0 K from that cell`, v === '4500' && idx(cl, cg) === idx(la, lo) && /450\.0 K/.test(await text(p, '#mg-temp-read')), { v, cl, cg });
      const rgb = await centreRGB(p, sc.x, sc.y); ok(`B screen colour on marked cell ${la}, ${lo} is the top of the ramp`, near(rgb, RAMP[9]), rgb); }
    await ctx.close(); }
  { const { ctx, p } = await mk();
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await toGlobe(p);
    for (let k = 0; k < 8; k++) await press(p, '#mg-zin');
    const pts = [[9.75, 30.25], [-20.25, 160.25], [40.25, -60.25], [0.25, 179.75], [0.25, -179.75], [-45.25, 0.25], [65.25, 90.25]];
    for (const m of ['noon', 'mid']) { if (m === 'mid') { await radio(p, 'midnight'); await waitActive(p, 'temp-mid'); }
      for (const [la, lo] of pts) {
        await p.evaluate(([a, o]) => MoonGlobe.point(a, o), [la, lo]); await toGlobe(p); await p.waitForTimeout(400);
        const sc = await p.evaluate(([a, o]) => { const s = MoonGlobe.screen(a, o), r = document.getElementById('mg-globe').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, [la, lo]);
        await p.mouse.click(sc.x, sc.y); await p.waitForTimeout(250);
        const v = +(await attr(p, '#mg-temp-read', 'data-value')), cl = +(await attr(p, '#mg-temp-read', 'data-lat')), cg = +(await attr(p, '#mg-temp-read', 'data-lng'));
        ok(`B ${m} click ${la}, ${lo}: readout = build value of the clicked cell`, v === code(RAW, 'value', m, idx(cl, cg)), { v, cl, cg });
        if (v >= 2) { const rgb = await centreRGB(p, sc.x, sc.y); ok(`B ${m} screen colour at ${la}, ${lo} matches the ramp for that value (frozen scale)`, near(rgb, rampAt(m, v)), { rgb, want: rampAt(m, v) }); } } }
    await ctx.close(); }

  // ---- C: transitions
  for (const startLit of [true, false]) {
    const { ctx, p } = await mk();
    if (startLit) { await litOn(p); await press(p, '#mg-earth'); await p.waitForTimeout(300); }
    const L0 = await p.evaluate(() => MoonGlobe.light());
    await press(p, '#mg-height'); await waitActive(p, 'height');
    const s1 = await sci(p);
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon');
    ok(`C (${startLit ? 'lit on' : 'lit off'}) height → temperature: saved kept from entry, buttons still locked, height legend hidden`, JSON.stringify((await sci(p)).saved) === JSON.stringify(s1.saved)
      && s1.saved.on === startLit && (await p.evaluate(() => document.getElementById('mg-lit').disabled)) && await hidden(p, '#mg-height-leg') && !(await hidden(p, '#mg-temp-leg')), { s1, now: await sci(p) });
    await radio(p, 'midnight'); await waitActive(p, 'temp-mid');
    ok(`C (${startLit ? 'lit on' : 'lit off'}) noon → midnight: saved untouched`, JSON.stringify((await sci(p)).saved) === JSON.stringify(s1.saved));
    await press(p, '#mg-height'); await waitActive(p, 'height');
    ok(`C (${startLit ? 'lit on' : 'lit off'}) midnight → height: saved untouched, polar cap back`, JSON.stringify((await sci(p)).saved) === JSON.stringify(s1.saved) && (await p.evaluate(() => MoonGlobe.globe().polygonsData().length)) === 1);
    await press(p, '#mg-height'); await waitIdle(p); await p.waitForTimeout(300);
    if (startLit) await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {});
    const L = await p.evaluate(() => MoonGlobe.light());
    ok(`C (${startLit ? 'lit on' : 'lit off'}) leave: picture back, lighting ${startLit ? 'restored for the current minute' : 'stays off'}, buttons enabled, no cap`, /lroc_color_2k/.test(await texUrl(p))
      && L.on === startLit && (!startLit || Math.abs(L.minute - NOW_MIN()) <= 60000) && !(await p.evaluate(() => document.getElementById('mg-lit').disabled))
      && (await p.evaluate(() => MoonGlobe.globe().polygonsData().length)) === 0 && (await sci(p)).saved === null, L);
    ok(`C (${startLit ? 'lit on' : 'lit off'}) the Earth view is never reopened${startLit ? '; the line says so' : ''}`, !L.earthView && (!startLit || /Earth view was closed while height was shown/.test(await text(p, '#mg-height-read'))));
    await ctx.close(); }
  { // temperature first: temperature → height → off; and temperature → off with the Earth view
    const { ctx, p } = await mk();
    await litOn(p); await press(p, '#mg-earth'); await p.waitForTimeout(300);
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon');
    ok('C temperature first: lit off and locked, Earth view left', !(await p.evaluate(() => MoonGlobe.light().on)) && !(await p.evaluate(() => MoonGlobe.light().earthView)) && (await p.evaluate(() => document.getElementById('mg-lit').disabled)));
    await press(p, '#mg-height'); await waitActive(p, 'height');
    ok('C temperature → height: temperature legend and readout hidden, radios disabled', await hidden(p, '#mg-temp-leg') && await hidden(p, '#mg-temp-read') && (await p.evaluate(() => [...document.querySelectorAll('#mg-temp-mode input')].every(r => r.disabled))));
    await press(p, '#mg-height'); await waitIdle(p); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {});
    const L = await p.evaluate(() => MoonGlobe.light());
    ok('C temperature → height → off: lit restored for the current minute; Earth view not reopened; the line names the map that was shown at entry', L.on && Math.abs(L.minute - NOW_MIN()) <= 60000 && !L.earthView
      && /Earth view was closed while the temperature map was shown/.test(await text(p, '#mg-height-read')));
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await press(p, '#mg-temp'); await waitIdle(p);
    ok('C temperature → off (lit was on): restored', await p.waitForFunction(() => MoonGlobe.light().on && MoonGlobe.light().state === 'on', null, { timeout: 15000 }).then(() => true, () => false));
    await ctx.close(); }
  // failures in each direction keep the shown map usable
  for (const [name, opt, re] of [['404', { temp404: true }, /HTTP 404/], ['bad hash', { tempBad: true }, /integrity/], ['truncated gzip', { tempShort: true }, /integrity/],
    ['bad hash (already decompressed)', { tempRaw: true, tempBad: true }, /integrity/], ['timeout', { tempHang: true }, /too long/]]) {
    const { ctx, p } = await mk(opt);
    await litOn(p); const b4 = await p.evaluate(() => MoonGlobe.light());
    await press(p, '#mg-temp'); await waitIdle(p, 25000); await p.waitForTimeout(200);
    const t = await text(p, '#mg-temp-read'), af = await p.evaluate(() => MoonGlobe.light());
    ok(`C entry failure (${name}): nothing changes, reason given`, af.on === b4.on && /lroc_color_2k/.test(await texUrl(p)) && (await sci(p)).active === null && (await sci(p)).saved === null
      && re.test(t) && /could not be loaded/.test(t) && /globe is unchanged/.test(t) && (await attr(p, '#mg-temp', 'aria-pressed')) === 'false' && !(await p.evaluate(() => document.getElementById('mg-lit').disabled)), { t });
    ok(`C entry failure (${name}): no object URL left`, (await live(p)) === 0);
    // the same failure while height is shown: height stays
    await press(p, '#mg-height'); await waitActive(p, 'height'); const hu = await texUrl(p);
    await press(p, '#mg-temp'); await waitIdle(p, 25000);
    ok(`C height → temperature failure (${name}): height stays shown and usable`, (await sci(p)).active === 'height' && (await texUrl(p)) === hu && /The map shown is unchanged/.test(await text(p, '#mg-temp-read'))
      && !(await hidden(p, '#mg-height-leg')) && (await attr(p, '#mg-height', 'aria-pressed')) === 'true');
    await ctx.close(); }
  { // temperature → height failure keeps the temperature map; noon → midnight failure (drawing) keeps noon and the radio goes back (GPT note 2)
    const { ctx, p } = await mk({ height404: true, noBlob: true });
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); const tu = await texUrl(p);
    await press(p, '#mg-height'); await waitIdle(p);
    ok('C temperature → height failure: temperature stays shown, reason given', (await sci(p)).active === 'temp-noon' && (await texUrl(p)) === tu && /Height map could not be loaded: the server answered HTTP 404\. The map shown is unchanged\./.test(await text(p, '#mg-height-read')));
    await p.evaluate(() => { window.__noBlob = true; });
    await radio(p, 'midnight'); await waitIdle(p);
    ok('C noon → midnight failure: noon stays, radio back on noon, reason given', (await sci(p)).active === 'temp-noon' && (await texUrl(p)) === tu && (await checkedRadio(p)) === 'noon'
      && /could not be drawn/.test(await text(p, '#mg-temp-read')), { s: await sci(p), r: await checkedRadio(p) });
    ok('C failed mode change keeps nothing', (await p.evaluate(() => MoonTemp.state().cached.mid)) === false && (await live(p)) === 1);
    await p.evaluate(() => { window.__noBlob = false; }); await radio(p, 'midnight'); ok('C a later mode change still succeeds', await waitActive(p, 'temp-mid'));
    await ctx.close(); }
  for (const noAbort of [false, true]) { // rapid clicks across all four modes: only the last commits
    const { ctx, p } = await mk({ tempDelay: 1500, heightDelay: 1500, noAbort });
    await press(p, '#mg-height'); await p.waitForTimeout(100); await press(p, '#mg-temp'); await p.waitForTimeout(100); await press(p, '#mg-height');
    ok(`C rapid${noAbort ? ' (answers arrive despite aborts)' : ''}: the last request (height) commits`, await waitActive(p, 'height'));
    await p.waitForTimeout(2500); ok(`C rapid${noAbort ? ' (late answers)' : ''}: a late temperature answer does not commit`, (await sci(p)).active === 'height' && (await sci(p)).commits === 1, await sci(p));
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await radio(p, 'midnight'); await radio(p, 'noon');
    await p.waitForTimeout(4000); const s = await sci(p);
    ok(`C rapid${noAbort ? ' (late)' : ''}: radio back to the shown mode cancels the pending change; noon stays; radio on noon`, s.active === 'temp-noon' && !s.pending && (await checkedRadio(p)) === 'noon', s);
    await radio(p, 'midnight'); await waitActive(p, 'temp-mid'); await press(p, '#mg-height'); await waitActive(p, 'height'); await press(p, '#mg-temp'); await waitActive(p, 'temp-mid');
    const tex = await texUrl(p), st = await p.evaluate(() => MoonTemp.state());
    ok(`C rapid${noAbort ? ' (late)' : ''}: shown texture is the cached midnight texture; one grid, two textures, nothing else alive`, st.cached.mid && st.cached.noon && (await live(p)) === 3, { st, live: await live(p), tex });
    await ctx.close(); }
  { // cancel during first entry; leave cancels a pending change (GPT note 2)
    const { ctx, p } = await mk({ tempDelay: 2500 });
    await litOn(p); const b4 = await p.evaluate(() => MoonGlobe.light());
    await press(p, '#mg-temp'); await p.waitForTimeout(300); ok('C entering: button pressed and busy, nothing in the view changed yet', (await attr(p, '#mg-temp', 'aria-busy')) === 'true' && /loading/.test(await text(p, '#mg-temp')) && (await p.evaluate(() => MoonGlobe.light().on)) && /lroc_color_2k/.test(await texUrl(p)));
    await press(p, '#mg-temp'); await p.waitForTimeout(3500);
    const s = await sci(p), af = await p.evaluate(() => MoonGlobe.light());
    ok('C cancel during first entry: saved null, view unchanged, nothing kept', s.active === null && s.saved === null && !s.pending && af.on === b4.on && /lroc_color_2k/.test(await texUrl(p)) && (await live(p)) === 0 && !(await p.evaluate(() => MoonTemp.state().cached.grid)), s);
    await press(p, '#mg-height'); await waitActive(p, 'height');
    await press(p, '#mg-temp'); await p.waitForTimeout(300); await press(p, '#mg-height'); await p.waitForTimeout(3500);
    const s2 = await sci(p);
    ok('C leaving height while temperature is pending: pending cancelled, science mode does not reopen', s2.active === null && !s2.pending && /lroc_color_2k/.test(await texUrl(p)) && (await p.evaluate(() => MoonGlobe.light().on)), s2);
    await ctx.close(); }

  // ---- E: §6.3 rejections, crafted files with valid pins so the page's own checks decide
  const iE = idx(0.25, 0.25), iMask = idx(75.25, 10.25), iMid = idx(85.25, 10.25);
  const cases = [
    ['wrong magic', b => { b.write('MEDIVNR2', 0, 'latin1'); }, /header/],
    ['wrong schema', b => { b.writeUInt16LE(2, 8); }, /header/],
    ['wrong columns', b => { b.writeUInt16LE(721, 12); }, /header/],
    ['wrong noon mask', b => { b.writeUInt16LE(600, 26); }, /header/],
    ['wrong origin', b => { b.writeInt16LE(-17975, 20); }, /header/],
    ['payload hash', b => { b[100] ^= 1; }, /payload/, true],
    ['value 1 inside the mask', b => { setCell(b, 'noon', iE, 1, 0, 255); }, /cell check/],
    ['value inside the noon mask poleward of 70', b => { setCell(b, 'noon', iMask, 1000, 4, 1); }, /cell check/],
    ['midnight value poleward of 80', b => { setCell(b, 'mid', iMid, 700, 4, 1); }, /cell check/],
    ['no data with n > 0', b => { setCell(b, 'noon', iE, 0, 2, 3); }, /cell check/],
    ['value with n = 0', b => { setCell(b, 'noon', iE, 3000, 0, 255); }, /cell check/],
    ['n = 1 with a range', b => { setCell(b, 'noon', iE, 3000, 1, 4); }, /cell check/],
    ['n = 3 with range unavailable', b => { setCell(b, 'noon', iE, 3000, 3, 255); }, /cell check/],
    ['n = 5', b => { setCell(b, 'noon', iE, 3000, 5, 2); }, /cell check/],
    ['value above 450 K', b => { setCell(b, 'mid', iE, 4501, 2, 2); }, /cell check/],
  ];
  for (const [name, mod, re, keepHash] of cases) {
    const c = craft(mod, { keepHash });
    const { ctx, p } = await mk({ body: c.gz, pins: c.pins });
    await press(p, '#mg-height'); await waitActive(p, 'height'); const hu = await texUrl(p);
    await press(p, '#mg-temp'); await waitIdle(p, 25000);
    const t = await text(p, '#mg-temp-read');
    ok(`E rejected: ${name} (previous map kept, nothing cached)`, (await sci(p)).active === 'height' && (await texUrl(p)) === hu && re.test(t) && !(await p.evaluate(() => MoonTemp.state().cached.grid)) && (await live(p)) === 1, t);
    await ctx.close(); }
  { const c = craft(() => {}); const { ctx, p } = await mk({ tempRaw: true, rawBody: c.raw, pins: c.pins });
    await press(p, '#mg-temp'); ok('E already-decompressed answer accepted on its own raw pin', await waitActive(p, 'temp-noon')); await ctx.close(); }

  // ---- D rendering, F LRO, keyboard, narrow
  { const { ctx, p } = await mk({ count: true });
    await p.waitForTimeout(2000); let a = await p.evaluate(() => window.__c.draw); await p.waitForTimeout(5000); const offDraws = (await p.evaluate(() => window.__c.draw)) - a;
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await p.waitForTimeout(2000);
    a = await p.evaluate(() => window.__c.draw); await p.waitForTimeout(5000); const onDraws = (await p.evaluate(() => window.__c.draw)) - a;
    const st = await p.evaluate(() => MoonTemp.state());
    console.log(`MEASURED idle 5 s draw calls: temperature off ${offDraws}, on ${onDraws}; decode+check ${st.decodeMs} ms, draw noon ${st.drawMs.noon} ms (SwiftShader, headless)`);
    ok('D temperature on: no extra draw per frame (texture swap only; ≤ 1.25 × off + 20)', onDraws <= 1.25 * offDraws + 20, { offDraws, onDraws });
    await ctx.close(); }
  { const { ctx, p } = await mk();
    await press(p, '#mg-lro'); await p.waitForTimeout(1500); const l0 = await p.evaluate(() => MoonGlobe.lro());
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); const l1 = await p.evaluate(() => MoonGlobe.lro());
    await radio(p, 'midnight'); await waitActive(p, 'temp-mid'); await press(p, '#mg-temp'); await waitIdle(p); const l2 = await p.evaluate(() => MoonGlobe.lro());
    ok('F LRO overlay identical before, during and after temperature', JSON.stringify(l0) === JSON.stringify(l1) && JSON.stringify(l1) === JSON.stringify(l2));
    await ctx.close(); }
  { const { ctx, p } = await mk();
    await p.focus('#mg-temp'); await p.keyboard.press('Enter'); ok('F keyboard: Enter switches temperature on', await waitActive(p, 'temp-noon'));
    ok('F keyboard: focus stays on the button', await p.evaluate(() => document.activeElement && document.activeElement.id === 'mg-temp'));
    ok('F legend: title, scale line naming both scales, keys, clipping, rounding, explainer', await (async () => { const t = await text(p, '#mg-temp-leg');
      return /brightness temperature around local noon/.test(t) && /Colour scale: noon 281–395 K\. The midnight map uses 70–105 K\. The same colour does not mean the same temperature on the two maps\./.test(t)
        && /No valid data in this window/.test(t) && /Withheld by our display limit/.test(t) && /0\.93% .* below 281 K and 0\.43% .* above 395 K/.test(t) && /rounded to 0\.1 K; the rounding is not the accuracy/.test(t)
        && /equivalent blackbody temperature/.test(t) && /effective radiative temperature/.test(t) && /not the physical temperature of any one surface/.test(t)
        && /Differently processed Diviner maps can give different values, especially at sharp warm features\. See Sources for our comparison\./.test(t) && /shares of 0\.5° grid cells, not of surface area/.test(t) && /not today’s temperature/.test(t) && /≤ 281 K/.test(t) && /≥ 395 K/.test(t); })());
    ok('F Sources line: scales are percentiles rounded outward; the GHRM comparison with its caveat; not an accuracy estimate', await (async () => { const t = await text(p, '#craft-sources');
      return /1st and 99th percentiles of the shown grid cells, rounded outward to whole kelvin/.test(t) && /−1\.9 to \+16\.7 K \(median \+8\.7 K\)/.test(t) && /causes of the differences have not been isolated/.test(t) && /not an accuracy estimate/.test(t); })());
    ok('F the 5 km sentence names the appearance picture; the 0.5° cell size is stated', /The appearance picture holds about 5 km to a pixel/.test(await text(p, '#moon-globe')) && /temperature map’s cells are 0\.5° \(about 15 km/.test(await text(p, '#moon-globe')));
    await p.focus('#mg-temp-mode input[value="noon"]'); await p.keyboard.press('ArrowRight'); ok('F keyboard: arrow key in the radio group switches to midnight', await waitActive(p, 'temp-mid'));
    ok('F scale line repeated on mode change, in the legend and the live readout', /Colour scale: midnight 70–105 K\. The noon map uses 281–395 K\./.test(await text(p, '#mg-temp-leg')) && /Now showing around local midnight\. Colour scale: midnight 70–105 K/.test(await text(p, '#mg-temp-read')));
    await p.evaluate(() => MoonGlobe.point(9.75, 30.25)); await p.focus('#mg-temp-centre'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const v = await attr(p, '#mg-temp-read', 'data-value'), pov = await p.evaluate(() => MoonGlobe.view());
    ok('F keyboard: "Read temperature at centre" reads the centre cell', v !== null && +v === code(RAW, 'value', 'mid', idx(pov.lat, pov.lng)), { v, pov });
    ok('F readout region is polite live', (await attr(p, '#mg-temp-read', 'aria-live')) === 'polite');
    await ctx.close(); }
  for (const w of [360, 390, 721]) { const { ctx, p } = await mk({ w, h: 800 });
    await press(p, '#mg-temp'); await waitActive(p, 'temp-noon'); await p.evaluate(() => MoonGlobe.point(9.75, 30.25)); await press(p, '#mg-temp-centre'); await p.waitForTimeout(300);
    const o = await p.evaluate(() => { const W = document.documentElement.clientWidth; let worst = 0, who = '';
      for (const el of document.querySelectorAll('#moon-globe *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 0.5 && r.right - W > worst) { worst = r.right - W; who = el.id || el.className || el.tagName; } }
      const tw = document.createTreeWalker(document.getElementById('moon-globe'), NodeFilter.SHOW_TEXT); let n; const rg = document.createRange();
      while ((n = tw.nextNode())) { rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.right > W + 0.5 && r.right - W > worst) { worst = r.right - W; who = 'text: ' + n.textContent.slice(0, 30); } }
      return { worst, who, sw: document.documentElement.scrollWidth, W }; });
    ok(`F narrow ${w} px: nothing past the right edge with temperature on`, o.worst === 0 && o.sw <= o.W, o);
    for (const mode of ['noon', 'midnight']) { if (mode === 'midnight') { await radio(p, 'midnight'); await waitActive(p, 'temp-mid'); }
      const ov = await p.evaluate(() => { const r = [...document.querySelectorAll('#mg-temp-leg [data-t="ticks"] span')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.getBoundingClientRect());
        let worst = 0; for (let k = 1; k < r.length; k++) worst = Math.max(worst, r[k - 1].right + 4 - r[k].left); return { n: r.length, worst }; });
      ok(`F narrow ${w} px (${mode}): scale tick labels do not touch (at least 4 px apart)`, ov.n >= 3 && ov.worst <= 0, ov); }
    if (w === 360) await p.locator('#moon-globe').screenshot({ path: process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'temp-360.png') : '/tmp/temp-360.png' });
    await ctx.close(); }

  // ---- H (release candidate): sources.html#moontemp, read from the file (no browser)
  // 26 Nov 2026 (Moon LROC release candidate): the Moon detailed-site section now follows this one, and its shortcut follows this shortcut;
  // the section ends at the next section (detailed site, or the Sun globe), so the checks below read this section only
  { const t = fs.readFileSync(path.join(ROOT, 'sources.html'), 'utf8'), sec = (/  <h2 id="moontemp">[\s\S]*?\n\n(?=  <h2 id="(?:moonlroc|sunglobe)">)/.exec(t) || [''])[0];
    ok('H sources.html: one Moon temperature section, after Moon height and before the Moon detailed site and the Sun globe; one shortcut, after Moon height\'s and before the Moon detailed site\'s and Tides\'', (t.match(/<h2 id="moontemp">/g) || []).length === 1 && sec.length > 2000 && !sec.includes('id="moonlroc"')
      && t.indexOf('id="moonheight"') < t.indexOf('id="moontemp"') && t.indexOf('id="moontemp"') < t.indexOf('id="moonlroc"') && t.indexOf('id="moonlroc"') < t.indexOf('id="sunglobe"')
      && t.split(' · <a href="#moonheight">Moon height</a> · <a href="#moontemp">Moon temperature</a> · <a href="#moonlroc">Moon detailed site</a> · <a href="#tides">Tides</a>').length === 2);
    ok('H section: our statistic, the masks as display policy, both scales (rounded outward), the same-colour warning, grid-cell shares, the GHRM caveat, DOI and public domain',
      /our<\/b> unweighted mean of the available quarter-hour bin values/.test(sec) && /<b>our display policy<\/b>, not the edge of Diviner’s coverage/.test(sec) && /noon 281–395 K and midnight 70–105 K/.test(sec)
      && /rounded outward to whole kelvin/.test(sec) && /The same colour does not mean the same temperature on the two maps/.test(sec) && /not of surface area/.test(sec)
      && /−1\.9 to \+16\.7 K \(median \+8\.7 K\)/.test(sec) && /causes of the differences have not been isolated/.test(sec) && /not an accuracy estimate/.test(sec)
      && /doi:10\.17189\/wj0s-w188/.test(sec) && /public domain/.test(sec) && /equivalent blackbody temperature/.test(sec) && /not the physical temperature of any one surface/.test(sec) && !/today’s temperature is/i.test(sec));
    const mh = fs.readFileSync(path.join(ROOT, 'moon.html'), 'utf8');
    ok('H moon.html Sources line links to sources.html#moontemp', /This comparison is not an accuracy estimate\. <a href="sources\.html#moontemp">Details<\/a>\.<\/li>/.test(mh)); }

  await br.close();
  console.log(`moon-diviner-ui: ${pass} passed, ${fail} failed${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
