/* Moon south-polar far-UV albedo (moon.html, moonsci.js LAMP layer) — real globe.gl 2.45.0 under SwiftShader.
 * MOON-LAMP-PROPOSAL rev 2 §6-§8, Chad's D1-D8 and D6 decision (reading B, no shift), GPT's rev 2 recheck notes 1-5 and D6 review notes.
 * Every expected value here comes from the served file and an index function written here (reading B, proposal §5.1 and §7), not from the page.
 *  A. lossless: every decoded cell (value, n_q, flag, n_in; 391,876 cells) equals the file; totals; readout sentence for each state S0-S5;
 *     three decimals from the integer (every distinct shown value); top-bin wording at 80 and not at 79; the outlier sentence on all 9 flagged
 *     cells and on no other; the precision note; no ice, frost, water or photograph claim in a readout
 *  K. positions: independent known points — the pole reads cell (312, 312); the four cardinal mid-edges; five crater centres; the 0/360 seam;
 *     the four no-source wedges (S5); just north of 80 S (S4); an edge cell (S3), a too-few cell (S1), a no-usable cell (S2); and the page's
 *     index differs from a reflected, rotated and one-cell-shifted index at the crater centres (the check is not vacuous)
 *  B. texture: EVERY pixel of the 80 rows south of 80 S equals the colour this test computes from the file by nearest cell under reading B
 *     (no interpolation, exact); the area north of 80 S equals the plain picture; top colour only for stored >= 80; a click at the screen
 *     centre after turning to a place reads the cell our index gives
 *  C. coordinator (as LEND): lighting saved once and restored; switching layers; a failed load keeps the shown map; retry; a late answer is
 *     dropped (also with abort disabled); the 15 s deadline ends the request while the PNG step is held and the late texture is released;
 *     leave cancels a pending request
 *  D. network: nothing fetched while off; one file and one picture request on first use; none on re-entry
 *  E. page rejections (crafted files with their raw pin injected, so the page's own checks decide): gzip pin, magic, version, orientation,
 *     origin, sentinel, colour end, reserved header byte, source hash, payload hash, n_q > n_in, n_in 17, reserved bit 5, flag without a
 *     qualifying pixel, value with n_q < 8, sentinel with n_q >= 8, short file; a bad file while height is shown leaves height unchanged
 *  F. legend and wording (not a photograph; modelled illumination; no ice, frost or water; precision; rendering; registration statement);
 *     pole and centre buttons; keyboard; 360 px layout; LRO overlay untouched
 * Run: node phase1/moon-lamp-ui.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=reflect|rotate|shift|outside|wedge|nopin|nogzpin|nosize|nocell|nopayload|noreserved|nohibit|top|thresh|edge|interp|thou|nohi|noprecision|
 *       late|leak|nosave|norestore|noleavecancel|deadline|noice must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const zlib = require('zlib');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const GZ = fs.readFileSync(path.join(ROOT, 'assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz')), RAW = zlib.gunzipSync(GZ);
const C = 626, NN = C * C, H0 = 160, R = 1737400, S = 240, N = 2501;
const VAL = i => RAW.readUInt16LE(H0 + 2 * i), QB = i => RAW[H0 + 2 * NN + i], NIN = i => RAW[H0 + 3 * NN + i];
const NQ = i => QB(i) & 31, HI = i => QB(i) >> 7;
const state = i => NQ(i) >= 8 ? 'S0' : NIN(i) >= 8 ? (NQ(i) ? 'S1' : 'S2') : 'S3';
/** Our own reading-B lookup (proposal §5.1, §7): 1-based sample I, line J; x = (I - 1251) S, y = (J - 1251) S; LON = atan2(x, -y). */
function locate(lat, lng, v = 'B') {
  if (!(lat <= -80)) return { s: 'S4' };
  const rr = 2 * R * Math.tan((90 + lat) * Math.PI / 360), L = lng * Math.PI / 180;
  let x = rr * Math.sin(L), y = -rr * Math.cos(L);
  if (v === 'A') y = -y; if (v === 'rot') [x, y] = [-y, x];
  const I = x / S + 1251 + (v === 'shift' ? 4 : 0), J = y / S + 1251;
  if (!(I >= 0.5 && I < N + 0.5 && J >= 0.5 && J < N + 0.5)) return { s: 'S5' };
  const i = Math.floor((J - 0.5) / 4) * C + Math.floor((I - 0.5) / 4);
  return { s: state(i), i };
}
/** Latitude and longitude of a source pixel centre (1-based I, J), for choosing points inside particular cells. */
const pixLL = (I, J) => { const x = (I - 1251) * S, y = (J - 1251) * S; return [-90 + 2 * Math.atan(Math.hypot(x, y) / (2 * R)) * 180 / Math.PI, Math.atan2(x, -y) * 180 / Math.PI]; };
/** A point inside cell i whose source pixel is inside 80 S (null if none). */
const inside = i => { const c = i % C, r = Math.floor(i / C); for (let dj = 0; dj < 4; dj++) for (let di = 0; di < 4; di++) { const I = 4 * c + di + 1, J = 4 * r + dj + 1; if (I > N || J > N) continue; const ll = pixLL(I, J); if (ll[0] <= -80) return ll; } return null; };
const RAMP = ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const TOP = [253, 141, 60];
const rampAt = v => { if (v >= 80) return TOP; const t = v / 79 * 7, k = Math.min(6, Math.floor(t)), f = t - k; return RAMP[k].map((c, j) => Math.round(c + (RAMP[k + 1][j] - c) * f)); };
const HA = [[46, 46, 46], [107, 107, 107]], HB = [[230, 230, 230], [154, 154, 154]];
const near = (a, b, tol = 3) => a.every((v, k) => Math.abs(v - b[k]) <= tol);
const thouOracle = v => { const s = String(v).padStart(4, '0'); return s.slice(0, -3) + '.' + s.slice(-3); };
function craft(mod, { keepHash = false } = {}) { const b = Buffer.from(RAW); mod(b); if (!keepHash) crypto.createHash('sha256').update(b.subarray(H0)).digest().copy(b, 128); return b; }
const firstCell = f => { for (let i = 0; i < NN; i++) if (f(i)) return i; return -1; };

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await br.newContext({ viewport: { width: opt.w || 1000, height: opt.h || 900 }, reducedMotion: 'reduce' });
    const hits = { lamp: 0, pic: 0 };
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonsci.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'moonsci.js'), 'utf8');
      if (opt.body) s = s.replace(/bytes: 1567664, sha: '[0-9a-f]+'/, `bytes: ${opt.body.length}, sha: '${sha(opt.body)}'`);
      const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); };
      const LOC = 'const I = r * Math.sin(L) / US + 1251, J = -r * Math.cos(L) / US + 1251;', DRW = 'const I = r * sn[X] + 1251, J = -r * cs[X] + 1251, k = 4 * (y * TW + X);';
      if (BREAK === 'reflect') { B(LOC, 'const I = r * Math.sin(L) / US + 1251, J = r * Math.cos(L) / US + 1251;'); B(DRW, 'const I = r * sn[X] + 1251, J = r * cs[X] + 1251, k = 4 * (y * TW + X);'); }
      if (BREAK === 'rotate') { B(LOC, 'const I = r * Math.cos(L) / US + 1251, J = r * Math.sin(L) / US + 1251;'); B(DRW, 'const I = r * cs[X] + 1251, J = r * sn[X] + 1251, k = 4 * (y * TW + X);'); }
      if (BREAK === 'shift') { B(LOC, 'const I = r * Math.sin(L) / US + 1255, J = -r * Math.cos(L) / US + 1251;'); B(DRW, 'const I = r * sn[X] + 1255, J = -r * cs[X] + 1251, k = 4 * (y * TW + X);'); }
      if (BREAK === 'outside') B('if (!(lat <= -80)) return { s: \'S4\' };', '');
      if (BREAK === 'wedge') B("if (!(I >= 0.5 && I < UN + 0.5 && J >= 0.5 && J < UN + 0.5)) return { s: 'S5' };", "if (!(I >= -3.5 && I < UN + 3.5 && J >= -3.5 && J < UN + 3.5)) return { s: 'S5' };");
      if (BREAK === 'nopin') B("if (raw.byteLength !== UF.bytes || await hex(raw) !== UF.sha) throw", "if (false) throw");
      if (BREAK === 'nogzpin') B('if (u.length !== gzBytes || await hex(buf) !== gzSha) throw', 'if (false) throw');
      if (BREAK === 'nosize') B("if (raw.byteLength !== UHDR + 4 * UNN) throw", "if (false) throw");
      if (BREAK === 'nocell') B('throw new Why(`the far-UV albedo file failed its cell check', 'void (`');
      if (BREAK === 'nopayload') B("if (await hex(raw.slice(UHDR)) !== shaAt(u8, 128)) throw", "if (false) throw");
      if (BREAK === 'noreserved') B("if ((b & 0x60) || nq > n", "if (nq > n");
      if (BREAK === 'nohibit') B("|| (hi && nq === 0) ||", "||");
      if (BREAK === 'top') B('if (v >= UTOP) return UTOPC;', 'if (v > UTOP) return UTOPC;');
      if (BREAK === 'thresh') B("const uState = (g, i) => g.nq[i] >= UMIN ?", "const uState = (g, i) => g.nq[i] >= 7 ?");
      if (BREAK === 'edge') B("rgb = st === 'S0' ? uRgb(g.val[i]) : st === 'S3' ? HATCH_B[h2] : HATCH_A[h]; }", "rgb = st === 'S0' ? uRgb(g.val[i]) : HATCH_A[h]; }");
      if (BREAK === 'interp') B("rgb = st === 'S0' ? uRgb(g.val[i])", "rgb = st === 'S0' ? uRgb(i % UC < UC - 1 && uState(g, i + 1) === 'S0' ? Math.round((g.val[i] + g.val[i + 1]) / 2) : g.val[i])");
      if (BREAK === 'thou') B("const thou = v => Math.floor(v / 1000) + '.' + String(v % 1000).padStart(3, '0');", "const thou = v => (v / 1000).toFixed(2) + '0';");
      if (BREAK === 'nohi') B("+ (g.hi[i] ? ' This average includes archive values above 1; they are shown as archived, and their cause has not been assessed here.' : '')", '');
      if (BREAK === 'noprecision') B("+ ' The third decimal is our rounding, not the estimate’s accuracy.';", ';');
      if (BREAK === 'late') B('if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }', '');
      if (BREAK === 'leak') B("const drop = () => { for (const u of made) { URL.revokeObjectURL(u); U.revoked++; } };", "const drop = () => {};");
      if (BREAK === 'nosave') B('if (!from) { MS.saved = h.lit();', 'MS.saved = h.lit(); if (!from) {');
      if (BREAK === 'norestore') B('if (MS.saved && MS.saved.on) h.litRestore(true);', '');
      if (BREAK === 'noleavecancel') B('const h = MG(), was = MS.active; cancel();', 'const h = MG(), was = MS.active;');
      const DL = "const tm = setTimeout(() => { if (MS.pend && MS.pend.tok === tok) { cancel(); LAYER[target].failed(new Why('it took too long'), target); } }, TIMEOUT_MS);";
      if (BREAK === 'deadline') { B(DL, 'const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);'); B("    if (ctl.signal.aborted) { res.drop(); syncRadio(); LAYER[target].failed(new Why('it took too long or was cancelled'), target); paint(); return; }\n", ''); }
      if (BREAK && BREAK !== 'noice' && !globalThis.__brkLogged) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): ' + BREAK); }
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    await ctx.route('**/moon.html*', async r => { let s = fs.readFileSync(path.join(ROOT, 'moon.html'), 'utf8');
      if (BREAK === 'noice') { const a = 'This layer does not identify ice, frost or water, and no cause is given for darker or brighter areas.';
        if (!s.includes(a)) throw new Error('break pattern missing: noice'); s = s.replace(a, ''); if (!globalThis.__brkLogged) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): noice'); } }
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: s }); });
    await ctx.route('**/assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz*', async r => { hits.lamp++;
      if (opt.delay) await new Promise(res => setTimeout(res, opt.delay));
      if (opt.e404 && !(opt.e404once && hits.lamp > 1)) return r.fulfill({ status: 404, body: '' }).catch(() => {});
      r.fulfill({ status: 200, contentType: 'application/gzip', body: opt.gzBody || opt.body || GZ }).catch(() => {}); });
    await ctx.route('**/assets/moon/lroc_color_2k.jpg*', r => { hits.pic++; r.continue().catch(() => {}); });
    await ctx.addInitScript(() => { window.__u = { made: [], revoked: [] }; const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = mk(b); window.__u.made.push(u); return u; }; URL.revokeObjectURL = u => { window.__u.revoked.push(u); rv(u); }; });
    if (opt.noAbort) await ctx.addInitScript(() => { AbortController.prototype.abort = function () {}; });
    if (opt.hold) await ctx.addInitScript(() => { window.__hold = { on: false, q: [] };
      const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, ...a) { if (window.__hold.on) { window.__hold.q.push(() => tb.call(this, cb, ...a)); return; } return tb.call(this, cb, ...a); };
      window.__release = () => { const n = window.__hold.q.length; for (const f of window.__hold.q.splice(0)) f(); return n; }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#mg-globe[data-ready="1"]', { timeout: 30000 }); await p.waitForTimeout(800);
    return { ctx, p, hits, errs };
  };
  const press = (p, sel) => p.evaluate(sel => document.querySelector(sel).click(), sel);
  const hidden = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return !e || e.hidden || getComputedStyle(e).display === 'none'; }, sel);
  const text = (p, sel) => p.evaluate(sel => document.querySelector(sel).textContent, sel);
  const sci = p => p.evaluate(() => MoonScience.state());
  const waitActive = (p, a, t = 40000) => p.waitForFunction(a => MoonScience.state().active === a && !MoonScience.state().pending, a, { timeout: t }).then(() => true, () => false);
  const waitIdle = (p, t = 40000) => p.waitForFunction(() => !MoonScience.state().pending, null, { timeout: t }).then(() => true, () => false);
  const live = p => p.evaluate(() => window.__u.made.filter(u => !window.__u.revoked.includes(u)).length);
  const litOn = async p => { await press(p, '#mg-lit'); await p.waitForFunction(() => MoonGlobe.light().state === 'on', null, { timeout: 15000 }).catch(() => {}); };

  // ================= A, K, B, D, F on one page =================
  {
    const { ctx, p, hits, errs } = await mk();
    ok('D nothing fetched while off', hits.lamp === 0, hits);
    ok('F legend and buttons hidden while off', await hidden(p, '#mg-lamp-leg') && await hidden(p, '#mg-lamp-pole') && await hidden(p, '#mg-lamp-centre'));
    const picBefore = hits.pic;
    await press(p, '#mg-lamp');
    ok('C entry commits', await waitActive(p, 'lamp'));
    ok('D one file request and at most one picture request on first use', hits.lamp === 1 && hits.pic - picBefore <= 1, { lamp: hits.lamp, pic: hits.pic - picBefore });
    // A lossless (the page's decoded planes against the file)
    const dec = await p.evaluate(() => { const out = { val: [], nq: [], nin: [], hi: [] }; for (let i = 0; i < 626 * 626; i++) { const c = MoonLamp.cell(i); out.val.push(c.val); out.nq.push(c.nq); out.nin.push(c.nin); out.hi.push(c.hi); } return out; });
    let bad = 0; for (let i = 0; i < NN; i++) if (dec.val[i] !== VAL(i) || dec.nq[i] !== NQ(i) || dec.nin[i] !== NIN(i) || dec.hi[i] !== HI(i)) bad++;
    ok('A all 391,876 cells decoded losslessly', bad === 0, bad);
    const cnt = { S0: 0, S1: 0, S2: 0, S3: 0 }; let cons = 0, flag = 0, top = 0;
    for (let i = 0; i < NN; i++) { if (NIN(i)) { cnt[state(i)]++; cons++; } if (NQ(i) >= 8) { flag += HI(i); top += VAL(i) >= 80; } }
    ok('A state counts S0 311,803 / S1 1,779 / S2 366 / S3 935; 9 flagged; 56 in the top bin', cnt.S0 === 311803 && cnt.S1 === 1779 && cnt.S2 === 366 && cnt.S3 === 935 && cons === 314883 && flag === 9 && top === 56, { cnt, cons, flag, top });
    // states at chosen points
    const pole = locate(-90, 0);
    ok('K pole reads cell (312, 312)', pole.i === 312 * C + 312, pole);
    const pageLoc = pts => p.evaluate(pts => pts.map(([a, b]) => { const l = MoonLamp.locate(a, b); return { s: l.s || MoonLamp.cellState(l.i), i: l.i }; }), pts);
    const mids = [[1251, 1], [2501, 1251], [1251, 2501], [1, 1251]].map(([I, J]) => pixLL(I, J));
    ok('K the four mid-edge pixels are at 0, 90, 180, 270 E', mids.map(m => Math.round(((m[1] % 360) + 360) % 360 * 1e6) / 1e6).join() === '0,90,180,270', mids);
    const CR = { Cabeus: [-85.33, 317.87], Shoemaker: [-88.14, 45.91], Haworth: [-87.45, 354.83], Faustini: [-87.18, 84.31], Amundsen: [-84.44, 83.07] };
    const named = [[-90, 0], ...mids, ...Object.values(CR)];
    const pl = await pageLoc(named);
    ok('K page index equals ours at the pole, the mid-edges and the crater centres', named.every(([a, b], k) => pl[k].i === locate(a, b).i), { pl, want: named.map(([a, b]) => locate(a, b).i) });
    ok('K mid-edge cells (312,0), (625,312), (312,625), (0,312)', [pl[1].i, pl[2].i, pl[3].i, pl[4].i].join() === [0 * C + 312, 312 * C + 625, 625 * C + 312, 312 * C + 0].join(), pl.slice(1, 5));
    for (const [nm, [a, b]] of Object.entries(CR)) ok('K controls differ at ' + nm, ['A', 'rot', 'shift'].every(v => locate(a, b, v).i !== locate(a, b).i));
    const seam = await pageLoc([[-85, 0], [-85, 360], [-85, -360], [-86.5, -0.0001], [-86.5, 359.9999]]);
    ok('K the 0/360 seam reads one cell', seam[0].i === seam[1].i && seam[1].i === seam[2].i && seam[3].i === seam[4].i && seam[3].i === locate(-86.5, 359.9999).i, seam);
    const wpx = [[1251, -1], [2503, 1251], [1251, 2503], [-1, 1251]].map(([I, J]) => pixLL(I, J));   // 1.5 pixels beyond each mid-edge, inside 80 S
    ok('K the wedge test points lie inside 80 S', wpx.every(([a]) => a <= -80), wpx);
    const wedges = await pageLoc([[-80.01, 0], [-80.01, 90], [-80.01, 180], [-80.01, 270], ...wpx]);
    ok('K the four no-source wedges are S5, also just beyond the square', wedges.every(w => w.s === 'S5' && w.i === undefined), wedges);
    const north = await pageLoc([[-79.999, 10], [-80, 10]]);
    ok('K north of 80 S is S4; 80 S itself is inside', north[0].s === 'S4' && north[1].s !== 'S4', north);
    const want = { S1: firstCell(i => NIN(i) && state(i) === 'S1'), S2: firstCell(i => NIN(i) && state(i) === 'S2'), S3: firstCell(i => NIN(i) && state(i) === 'S3' && inside(i)),
      hi: firstCell(i => NQ(i) >= 8 && HI(i)), top: firstCell(i => NQ(i) >= 8 && VAL(i) >= 80 && !HI(i)), v79: firstCell(i => NQ(i) >= 8 && VAL(i) === 79), plain: firstCell(i => NQ(i) >= 8 && !HI(i) && VAL(i) < 80) };
    const wpts = Object.fromEntries(Object.entries(want).map(([k, i]) => [k, inside(i)]));
    const wl = await pageLoc(Object.values(wpts));
    ok('K edge (S3), too few (S1), no usable (S2) cells read their states', Object.keys(wpts).every((k, n) => wl[n].i === want[k] && wl[n].s === state(want[k])), { wl, want });
    // readout sentences
    const tx = await p.evaluate(pts => pts.map(([a, b]) => MoonLamp.text(a, b)), [wpts.plain, wpts.S1, wpts.S2, wpts.S3, [-80.01, 0], [-79, 0], wpts.hi, wpts.top, wpts.v79]);
    ok('A S0 sentence', new RegExp('^here: Lyman-α albedo estimate ' + thouOracle(VAL(want.plain)).replace('.', '\\.') + ' · Mother Earth’s 960 m average of \\d+ of \\d+ archive pixels; LAMP night side, Sept 2009 – Sept 2010; measured far-UV brightness ÷ modelled night-time illumination').test(tx[0]), tx[0]);
    ok('A S0 precision note', /The third decimal is our rounding, not the estimate’s accuracy\./.test(tx[0]), tx[0]);
    ok('A S1 sentence', /no value here\. Only \d of this 960 m cell centred .*’s \d+ archive pixels pass the quality and finiteness rules \(8 needed\)/.test(tx[1]) && !/estimate \d/.test(tx[1]), tx[1]);
    ok('A S2 sentence', /no value here\. The archive has no usable value in this 960 m cell/.test(tx[2]), tx[2]);
    ok('A S3 sentence', /edge of the map\. Fewer than half of this 960 m cell/.test(tx[3]), tx[3]);
    ok('A S5 sentence', /inside 80°S but beyond the edge of LAMP’s map square; nothing is filled in/.test(tx[4]), tx[4]);
    ok('A S4 sentence', /outside this map\. LAMP’s map covers 80–90°S/.test(tx[5]), tx[5]);
    ok('A outlier sentence on a flagged cell', /includes archive values above 1; they are shown as archived, and their cause has not been assessed here/.test(tx[6]), tx[6]);
    ok('A top-bin wording at or above 80', /at or above the top of the colour scale: displayed estimate 0\.080 or higher after rounding/.test(tx[7]) && !/above 1;/.test(tx[7]), tx[7]);
    ok('A no top-bin wording at 79', /estimate 0\.079 ·/.test(tx[8]) && !/top of the colour scale/.test(tx[8]), tx[8]);
    ok('A no ice, frost, water or photograph claim in a readout', tx.every(t => !/\bice\b|frost|water|photograph/i.test(t)));
    // every flagged cell carries the sentence; no other shown cell does; every distinct shown value prints from its integer
    const flagged = [], others = []; for (let i = 0; i < NN; i++) if (NQ(i) >= 8) (HI(i) ? flagged : others).push(i);
    const fl = await p.evaluate(pts => pts.map(([a, b]) => MoonLamp.text(a, b)), flagged.map(inside));
    ok('A all 9 flagged cells carry the outlier sentence', flagged.length === 9 && fl.every(t => /archive values above 1/.test(t)), fl.map(t => t.slice(0, 60)));
    const rnd = []; for (let k = 0; k < 300; k++) rnd.push(others[(k * 104729) % others.length]);
    const ot = await p.evaluate(pts => pts.map(([a, b]) => MoonLamp.text(a, b)), rnd.map(inside));
    ok('A 300 unflagged cells carry no outlier sentence and read their stored value', ot.every((t, k) => !/archive values above 1/.test(t) && (t.includes('estimate ' + thouOracle(VAL(rnd[k])) + ' ·') || t.includes('estimate ' + thouOracle(VAL(rnd[k])) + ' ('))), ot.slice(0, 2));
    const vals = [...new Set(others.concat(flagged).map(VAL))].sort((a, b) => a - b);
    const tv = await p.evaluate(vs => vs.map(v => MoonLamp.thou(v)), vals.concat([0, 5, 79, 80, 999, 1000, 31069]));
    ok(`A every distinct shown value (${vals.length}) and 0, 5, 79, 80, 999, 1000, 31069 print as three decimals from the integer`, tv.every((t, k) => t === thouOracle(vals.concat([0, 5, 79, 80, 999, 1000, 31069])[k])), tv.slice(-7));
    const rg = await p.evaluate(() => [MoonLamp.rgb(79), MoonLamp.rgb(80), MoonLamp.rgb(0), MoonLamp.rgb(31069)]);
    ok('A colour: 79 on the ramp, 80 and above the top colour, 0 the ramp start', near(rg[0], RAMP[7], 0) && near(rg[1], TOP, 0) && near(rg[3], TOP, 0) && near(rg[2], RAMP[0], 0) && !near(rg[0], TOP, 30), rg);

    // B texture: every pixel of the 80 rows south of 80 S, exact
    const T = await p.evaluate(async () => { const url = MoonGlobe.globe().globeImageUrl(); const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      return { w: c.width, h: c.height, band: Array.from(x.getImageData(0, c.height - 80, c.width, 80).data), north: [[...x.getImageData(100, 1300, 1, 1).data.slice(0, 3)], [...x.getImageData(2000, 200, 1, 1).data.slice(0, 3)], [...x.getImageData(1500, 1359, 1, 1).data.slice(0, 3)]] }; });
    ok('B texture is 2880 x 1440', T.w === 2880 && T.h === 1440, [T.w, T.h]);
    let mis = 0, firstMis = null, nTop = 0, nState = { S0: 0, S1: 0, S2: 0, S3: 0, S5: 0 };
    for (let y = 0; y < 80; y++) { const lat = 90 - (1360 + y + 0.5) / 8;
      for (let X = 0; X < 2880; X++) { const lng = (X + 0.5) / 8 - 180, l = locate(lat, lng), h = ((X + y) & 3) === 0 ? 1 : 0, h2 = ((X - y) & 3) === 0 ? 1 : 0;
        const w = l.s === 'S5' || l.s === 'S3' ? HB[h2] : l.s === 'S0' ? rampAt(VAL(l.i)) : HA[h]; nState[l.s]++; if (l.s === 'S0' && VAL(l.i) >= 80) nTop++;
        const k = 4 * (y * 2880 + X), g = [T.band[k], T.band[k + 1], T.band[k + 2]];
        if (g[0] !== w[0] || g[1] !== w[1] || g[2] !== w[2]) { mis++; if (!firstMis) firstMis = { X, y, g, w, s: l.s, i: l.i }; } } }
    ok('B every one of the 230,400 texture pixels south of 80 S is the nearest cell’s exact colour or hatch under reading B', mis === 0, { mis, firstMis });
    ok('B the texture band samples every state (the comparison is not vacuous)', Object.values(nState).every(n => n > 0), { nState, nTop });
    const pic = await p.evaluate(async () => { const r = await fetch('assets/moon/lroc_color_2k.jpg?v=1'); const b = await r.blob(); const im = await createImageBitmap(b);
      const c = document.createElement('canvas'); c.width = 2880; c.height = 1440; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 2880, 1440); return [[100, 1300], [2000, 200], [1500, 1359]].map(([a, b]) => [...x.getImageData(a, b, 1, 1).data.slice(0, 3)]); });
    ok('B north of 80 S (including the last row above it) equals the plain picture', T.north.every((g, k) => near(g, pic[k], 2)), { got: T.north, want: pic });
    // B click at screen centre
    await p.evaluate(() => document.getElementById('mg-globe').scrollIntoView({ block: 'center' }));
    for (const [la, lo] of [[-84.6, 100.3], [-83.2, 250.8]]) {
      await p.evaluate(([la, lo]) => MoonGlobe.point(la, lo), [la, lo]); await p.waitForTimeout(400);
      const bb = await p.locator('#mg-globe').boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(300);
      const ds = await p.evaluate(() => ({ ...document.getElementById('mg-lamp-read').dataset }));
      const cla = Number(ds.lat), clo = Number(ds.lng), toR = Math.PI / 180;
      const km = 1737.4 * Math.acos(Math.min(1, Math.sin(la * toR) * Math.sin(cla * toR) + Math.cos(la * toR) * Math.cos(cla * toR) * Math.cos((lo - clo) * toR)));
      const l = locate(cla, clo);
      ok('B centre click lands near the pointed place ' + la, km < 10, { km, ds });
      ok('B the page reads the cell our index gives for the clicked point ' + la, Number(ds.cell) === l.i && ds.state === l.s && Number(ds.value) === VAL(l.i), { ds, l });
    }
    // F legend and wording
    const leg = await text(p, '#mg-lamp-leg');
    ok('F legend shown while active', !await hidden(p, '#mg-lamp-leg'));
    ok('F not a photograph; light our eyes cannot see', /This is not a photograph/.test(leg) && /light our eyes cannot see/.test(leg) && /121\.6 nm/.test(leg));
    ok('F modelled illumination, model-dependent estimate', /divided by a modelled night-time illumination/.test(leg) && /model-dependent estimate/.test(leg));
    ok('F no ice, frost or water; no cause', /does not identify ice, frost or water/.test(leg) && /no cause is given/.test(leg));
    ok('F top bin, precision, rendering and registration notes', /Displayed estimate 0\.080 or higher after rounding/.test(leg) && /rounding is not the accuracy/.test(leg) && /graphics card may blend/.test(leg) && /fine positional error is not quantified and no shift is applied/.test(leg));
    ok('F four map keys', /No value:/.test(leg) && /Edge of the map/.test(leg) && /Outside this map/.test(leg));
    const src = await p.evaluate(() => [...document.querySelectorAll('li')].map(l => l.textContent).find(t => /South-polar far-UV albedo/.test(t)) || '');
    ok('F Sources entry carries the replacement registration statement', /The documented map orientation is supported by landmark and terrain comparisons\. A later exploratory albedo\/slope diagnostic shows a small-lag cluster that follows artificial shifts, but the declared fine-registration test was inconclusive\. Fine positional error is not quantified\. No shift is applied\./.test(src), src.slice(0, 120));
    ok('F no 240–480 m bound anywhere on the page', !/240\s*[–-]\s*480\s*m/.test(await p.evaluate(() => document.body.textContent)));
    await press(p, '#mg-lamp-pole'); await p.waitForTimeout(300);
    ok('F pole button turns to -85', Math.abs((await p.evaluate(() => MoonGlobe.view())).lat + 85) < 0.01);
    await press(p, '#mg-lamp-centre'); await p.waitForTimeout(200);
    ok('F centre read gives a sentence', /\(centre of view\)/.test(await text(p, '#mg-lamp-read')));
    ok('F LRO overlay untouched', await p.evaluate(() => document.getElementById('mg-lro').getAttribute('aria-pressed')) === 'false');
    // D re-entry; C switching
    await press(p, '#mg-lamp'); ok('C leave', await waitIdle(p) && (await sci(p)).active === null);
    ok('F legend hidden after leave', await hidden(p, '#mg-lamp-leg'));
    await press(p, '#mg-lamp'); await waitActive(p, 'lamp');
    ok('D no request on re-entry', hits.lamp === 1, hits.lamp);
    await press(p, '#mg-lend'); ok('C far-UV -> neutron', await waitActive(p, 'lend'));
    await press(p, '#mg-height'); ok('C neutron -> height', await waitActive(p, 'height'));
    await press(p, '#mg-lamp'); ok('C height -> far-UV', await waitActive(p, 'lamp'));
    ok('C entry kept across switches', (await sci(p)).entry === 'lamp' && (await sci(p)).saved && (await sci(p)).saved.on === false, await sci(p));
    ok('C only the far-UV legend shows', !await hidden(p, '#mg-lamp-leg') && await hidden(p, '#mg-lend-leg') && await hidden(p, '#mg-height-leg'));
    await press(p, '#mg-lamp'); await waitIdle(p);
    ok('A/F no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  // ================= C lighting saved once and restored =================
  {
    const { ctx, p } = await mk();
    await litOn(p);
    await press(p, '#mg-lamp'); await waitActive(p, 'lamp');
    ok('C lighting off while shown', await p.evaluate(() => MoonGlobe.light().state) !== 'on');
    await press(p, '#mg-lend'); await waitActive(p, 'lend');
    ok('C saved once (lit on) across a switch', (await sci(p)).saved.on === true);
    await press(p, '#mg-lend'); await waitIdle(p); await p.waitForTimeout(500);
    ok('C lit restored on leave', await p.evaluate(() => MoonGlobe.light().state) === 'on');
    await ctx.close();
  }
  // ================= C failure, retry, late answers, leave cancels, deadline =================
  {
    const { ctx, p, hits } = await mk({ e404: true, e404once: true });
    await press(p, '#mg-height'); await waitActive(p, 'height');
    const texH = await p.evaluate(() => MoonGlobe.globe().globeImageUrl());
    await press(p, '#mg-lamp'); await waitIdle(p);
    ok('C failed load keeps the shown map', (await sci(p)).active === 'height' && await p.evaluate(() => MoonGlobe.globe().globeImageUrl()) === texH);
    ok('C failure message', /Far-UV albedo map could not be loaded: the server answered HTTP 404\. The map shown is unchanged\./.test(await text(p, '#mg-lamp-read')));
    await press(p, '#mg-lamp'); ok('C retry after failure works', await waitActive(p, 'lamp') && hits.lamp === 2, hits.lamp);
    await ctx.close();
  }
  {
    const { ctx, p } = await mk({ delay: 3000 });
    await press(p, '#mg-lamp'); await p.waitForTimeout(300); await press(p, '#mg-lamp');
    await p.waitForTimeout(4000);
    ok('C cancelled request never commits', (await sci(p)).active === null && (await sci(p)).commits === 0, await sci(p));
    await press(p, '#mg-height'); await waitActive(p, 'height');
    await press(p, '#mg-lamp'); await p.waitForTimeout(300); await press(p, '#mg-height');
    await p.waitForTimeout(4000);
    ok('C leave cancels a pending request', (await sci(p)).active === null && (await sci(p)).pending === null, await sci(p));
    await ctx.close();
  }
  {
    const { ctx, p } = await mk({ delay: 3000, noAbort: true });
    await press(p, '#mg-lamp'); await p.waitForTimeout(300); await press(p, '#mg-lamp');
    await p.waitForFunction(() => MoonLamp.state().drawMs !== null, null, { timeout: 40000 }).catch(() => {});
    await p.waitForTimeout(1500);
    ok('C late answer from an unabortable request never commits', (await sci(p)).active === null && (await sci(p)).commits === 0, await sci(p));
    ok('C that late answer was produced and released', await p.evaluate(() => MoonLamp.state().drawMs) !== null && await live(p) === 0, { live: await live(p) });
    await ctx.close();
  }
  {
    const { ctx, p } = await mk({ hold: true });
    await p.evaluate(() => { window.__hold.on = true; });
    await press(p, '#mg-lamp');
    await p.waitForFunction(() => window.__hold.q.length > 0, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(16000);
    ok('C deadline ends the request', (await sci(p)).pending === null && (await sci(p)).active === null, await sci(p));
    ok('C deadline message', /took too long/.test(await text(p, '#mg-lamp-read')));
    const madeBefore = await p.evaluate(() => window.__u.made.length);
    await p.evaluate(() => { window.__hold.on = false; return window.__release(); });
    const produced = await p.waitForFunction(n => window.__u.made.length > n, madeBefore, { timeout: 40000 }).then(() => true, () => false);
    await p.waitForTimeout(1000);
    ok('C the held texture was produced after the deadline (not vacuous)', produced);
    ok('C late texture never shown', (await sci(p)).active === null && (await sci(p)).commits === 0);
    ok('C late texture released', await live(p) === 0, await live(p));
    await ctx.close();
  }

  // ================= E page rejections =================
  const Q0 = H0 + 2 * NN, N0 = H0 + 3 * NN;
  const s0 = firstCell(i => NQ(i) >= 8 && NIN(i) === 16 && !HI(i)), s1 = firstCell(i => NIN(i) && state(i) === 'S1');
  const cases = [
    ['magic', craft(b => { b[0] = 0x58; }), /header is not the expected one/],
    ['version', craft(b => { b.writeUInt16LE(2, 8); }), /header is not the expected one/],
    ['orientation constant (reading A)', craft(b => { b.writeUInt16LE(1, 32); }), /header is not the expected one/],
    ['origin (pole pixel 1250)', craft(b => { b.writeUInt16LE(1250, 28); }), /header is not the expected one/],
    ['sentinel', craft(b => { b.writeUInt16LE(65534, 36); }), /header is not the expected one/],
    ['colour end', craft(b => { b.writeUInt16LE(100, 38); }), /header is not the expected one/],
    ['reserved header byte', craft(b => { b[57] = 1; }), /header is not the expected one/],
    ['source hash', craft(b => { b[70] ^= 1; }), /header is not the expected one/],
    ['payload hash', craft(b => { b.writeUInt16LE(VAL(s0) + 1, H0 + 2 * s0); }, { keepHash: true }), /payload check/],
    ['n_q above n_in', craft(b => { const e = firstCell(i => NIN(i) > 0 && NIN(i) < 8 && NQ(i) === NIN(i)); b[Q0 + e] = (b[Q0 + e] & 0xe0) | (NIN(e) + 1); }), /cell check/],
    ['n_in 17', craft(b => { b[N0 + s0] = 17; }), /cell check/],
    ['reserved bit 5', craft(b => { b[Q0 + s0] |= 0x20; }), /cell check/],
    ['flag without a qualifying pixel', craft(b => { const z = firstCell(i => NIN(i) >= 8 && NQ(i) === 0); b[Q0 + z] = 0x80; }), /cell check/],
    ['value with n_q below 8', craft(b => { b.writeUInt16LE(30, H0 + 2 * s1); }), /cell check/],
    ['sentinel with n_q 8 or more', craft(b => { b.writeUInt16LE(65535, H0 + 2 * s0); }), /cell check/],
    ['short file (its own pin and payload hash)', (() => { const b = Buffer.from(RAW.subarray(0, RAW.length - 626)); crypto.createHash('sha256').update(b.subarray(H0)).digest().copy(b, 128); return b; })(), /not the expected size/],
  ];
  for (const [name, body, re] of cases) {
    const { ctx, p } = await mk({ body });
    await press(p, '#mg-lamp'); await waitIdle(p);
    const t = await text(p, '#mg-lamp-read');
    ok('E rejects ' + name, (await sci(p)).active === null && re.test(t), t);
    await ctx.close();
  }
  {   // the raw pin: a changed file whose header and payload hash are self-consistent, served without the gzip layer and WITHOUT injecting a pin
    const changed = craft(b => { b.writeUInt16LE(VAL(s0) + 1, H0 + 2 * s0); });
    const { ctx, p } = await mk({ gzBody: changed });
    await press(p, '#mg-lamp'); await waitIdle(p);
    ok('E raw pin refuses a self-consistent changed file', (await sci(p)).active === null && /integrity check/.test(await text(p, '#mg-lamp-read')), await text(p, '#mg-lamp-read'));
    await ctx.close();
  }
  {   // the gzip pin: a recompressed copy of the same raw bytes (different gzip bytes) is refused before unpacking
    const { ctx, p } = await mk({ gzBody: zlib.gzipSync(RAW, { level: 1 }) });
    await press(p, '#mg-lamp'); await waitIdle(p);
    ok('E gzip pin refuses a different gzip of the same data', (await sci(p)).active === null && /integrity check/.test(await text(p, '#mg-lamp-read')), await text(p, '#mg-lamp-read'));
    await ctx.close();
  }
  {   // a bad file while height is shown: refused; height and its texture unchanged
    const { ctx, p } = await mk({ body: craft(b => { b.writeUInt16LE(1, 32); }) });
    await press(p, '#mg-height'); const hOk = await waitActive(p, 'height');
    const texBefore = await p.evaluate(() => MoonGlobe.globe().globeImageUrl());
    await press(p, '#mg-lamp'); await waitIdle(p);
    ok('E bad header while height is shown: refused, height stays, texture unchanged', hOk && (await sci(p)).active === 'height' && /header is not the expected one/.test(await text(p, '#mg-lamp-read')) && await p.evaluate(() => MoonGlobe.globe().globeImageUrl()) === texBefore);
    await ctx.close();
  }
  // ================= F keyboard and narrow layout =================
  {
    const { ctx, p } = await mk({ w: 360, h: 780 });
    await p.focus('#mg-lamp'); await p.keyboard.press('Enter');
    ok('F keyboard Enter shows the layer', await waitActive(p, 'lamp'));
    const over = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('#mg-lamp-leg *, #mg-lamp, #mg-lamp-pole, #mg-lamp-centre')].filter(e => e.getBoundingClientRect().right > W + 1).map(e => e.id || e.className || e.tagName); });
    ok('F 360 px: nothing wider than the page', over.length === 0, over);
    await p.focus('#mg-lamp-centre'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok('F keyboard centre read', /\(centre of view\)/.test(await text(p, '#mg-lamp-read')));
    await ctx.close();
  }
  await br.close();
  console.log(`moon-lamp-ui: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
