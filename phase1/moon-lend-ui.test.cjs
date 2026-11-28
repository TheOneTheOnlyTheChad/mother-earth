/* Moon south-polar neutron record (moon.html, moonsci.js LEND layer) — real globe.gl 2.45.0 under SwiftShader.
 * MOON-LEND-PROPOSAL rev 2 §8.1, Chad's D1-D9, GPT's rev 2 recheck build notes 1-4.
 *  A. lossless: every decoded record (state, near, p, estimate, support, exposure; 14,400 cells) equals the served file; readout sentences for
 *     each state and outside coverage; valid zero is a value; no unit, flux, hydrogen or ice wording in a readout
 *  B. registration: texture pixels of shown/missing/withheld cells (colour against the ramp computed here; the two hatches) at the
 *     builder's row/column; the area north of 80 S equals the plain picture; a click at the screen centre after turning to a cell reads that cell
 *  C. coordinator: lighting saved once and restored on leave; switching height <-> neutron <-> temperature keeps the saved state; a failed
 *     load keeps the shown map; a late answer is dropped; the 15 s deadline ends the request while the PNG step is held, and the late
 *     texture is released; leave cancels a pending request; retry after failure works
 *  D. network: nothing fetched while off; one file and one picture request on first use; none on re-entry
 *  E. page rejections (crafted files with their pins injected, so the page's own checks reject them): magic, header field, reference
 *     mean, source hash, payload hash, bad state code, shown cell with estimate 0.51, missing cell with a value, shown p beyond 20 %,
 *     withheld cell with p set, short file; NaN and infinite reference mean and error (GPT's preview review), and a NaN header refused
 *     while height is shown, leaving that map and texture unchanged
 *  F. legend and wording on the feature (uncalibrated-field caveat, conditional estimate, display choice); pole and centre buttons; keyboard;
 *     360 px layout; LRO overlay untouched; height and temperature still work afterwards
 * Run: node phase1/moon-lend-ui.test.cjs [base-url]   (static server on the repo, default 127.0.0.1:8899)
 * BREAK=row|col|flip|outside|nocell|nopayload|nopin|missval|late|leak|nosave|norestore|noleavecancel|deadline|noerrtext|nocaveat|nofinite|tofixed|nohalfaway must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const FILE = fs.readFileSync(path.join(ROOT, 'assets/moon/lend/lend-alds-2011-2016-R1.bin'));
const rec = (b, i) => { const o = 160 + 10 * i; return { state: b[o], near: b[o + 1], p: b.readInt16LE(o + 2), e: b.readUInt16LE(o + 4), n: b.readUInt16LE(o + 6), exp: b.readUInt16LE(o + 8) }; };
const nIdx = (lat, lng) => lat < -80 ? Math.min(19, Math.max(0, Math.floor((lat + 90) * 2))) * 720 + Math.floor((((lng % 360) + 360) % 360) * 2) % 720 : -1;
const RAMP = ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const rampAt = p => { const t = (Math.min(250, Math.max(-250, p)) + 250) / 500 * 10, k = Math.min(9, Math.floor(t)), f = t - k; return RAMP[k].map((c, j) => Math.round(c + (RAMP[k + 1][j] - c) * f)); };
const near = (a, b, tol = 3) => a.every((v, k) => Math.abs(v - b[k]) <= tol);
/** A crafted file: a copy of the real one changed by mod(buf); the header payload hash recomputed unless keepHash. */
function craft(mod, { keepHash = false } = {}) { const b = Buffer.from(FILE); mod(b); if (!keepHash) crypto.createHash('sha256').update(b.subarray(160)).digest().copy(b, 128); return b; }
const setRec = (b, i, r) => { const o = 160 + 10 * i; b[o] = r.state; b[o + 1] = r.near; b.writeInt16LE(r.p, o + 2); b.writeUInt16LE(r.e, o + 4); b.writeUInt16LE(r.n, o + 6); b.writeUInt16LE(r.exp, o + 8); };

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await br.newContext({ viewport: { width: opt.w || 1000, height: opt.h || 900 }, reducedMotion: 'reduce' });
    const hits = { lend: 0, pic: 0, temp: 0, hgrid: 0 };
    await ctx.route(/fonts\.googleapis|workers\.dev/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/moonsci.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'moonsci.js'), 'utf8');
      if (opt.body) s = s.replace(/bytes: 144160, sha: '[0-9a-f]+'/, `bytes: ${opt.body.length}, sha: '${sha(opt.body)}'`);
      const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); };
      if (BREAK === 'row') B('Math.floor((lat + 90) * 2))', 'Math.round((lat + 90) * 2))');
      if (BREAK === 'col') B('const c = Math.floor((((lng % 360) + 360) % 360) * 2) % NCOL;', 'const c = Math.floor((((lng + 180) % 360 + 360) % 360) * 2) % NCOL;');
      if (BREAK === 'flip') B('const nTexY = r => TH - PX * (r + 1);', 'const nTexY = r => TH - PX * (NR - r);');
      if (BREAK === 'outside') B('if (!(lat < -80)) return -1;', '');
      if (BREAK === 'nocell') B('if (!okCell) throw new Why(`the neutron record file', 'if (false) throw new Why(`the neutron record file');   // the LEND check, not the temperature one (an earlier version of this break hit the temperature check first and tested nothing)
      if (BREAK === 'nopayload') B("if (await hex(buf.slice(NHDR)) !==", "if (false && await hex(buf.slice(NHDR)) !==");
      if (BREAK === 'nopin') B("if (buf.byteLength !== NF.bytes || await hex(buf) !== NF.sha) throw", "if (false) throw");
      if (BREAK === 'missval') B("const rgb = rgb0 || (st === 1 ?", "const rgb = rgb0 || nRgb(0) || (st === 1 ?");
      if (BREAK === 'late') B('if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }', '');
      if (BREAK === 'leak') B("const drop = () => { for (const u of made) { URL.revokeObjectURL(u); N.revoked++; } };", "const drop = () => {};");
      if (BREAK === 'nosave') B('if (!from) { MS.saved = h.lit();', 'MS.saved = h.lit(); if (!from) {');
      if (BREAK === 'norestore') B('if (MS.saved && MS.saved.on) h.litRestore(true);', '');
      if (BREAK === 'noleavecancel') B('const h = MG(), was = MS.active; cancel();', 'const h = MG(), was = MS.active;');
      const DL = "const tm = setTimeout(() => { if (MS.pend && MS.pend.tok === tok) { cancel(); LAYER[target].failed(new Why('it took too long'), target); } }, TIMEOUT_MS);";
      if (BREAK === 'deadline') { B(DL, 'const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);'); B("    if (ctl.signal.aborted) { res.drop(); syncRadio(); LAYER[target].failed(new Why('it took too long or was cancelled'), target); paint(); return; }\n", ''); }
      if (BREAK === 'nofinite') B('const refOk = Number.isFinite(refMean) && Number.isFinite(refErr) && Math.abs(refMean - NREF.mean) <= 1e-9 && Math.abs(refErr - NREF.err) <= 1e-9;',
        'const refOk = !(Math.abs(refMean - NREF.mean) > 1e-9 || Math.abs(refErr - NREF.err) > 1e-9);');   // the reviewed preview's test, which accepts NaN
      if (BREAK === 'tofixed') B("const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + one(tenths(v)) + '%';\n  const pp = v => one(tenths(v)) + ' pp';",
        "const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + (Math.abs(v) / 100).toFixed(1) + '%';\n  const pp = v => (v / 100).toFixed(1) + ' pp';");   // the released formatter
      if (BREAK === 'nohalfaway') B('const tenths = v => (Math.floor((Math.abs(v) + 5) / 10));', 'const tenths = v => (Math.floor((Math.abs(v) + 4) / 10));');   // ties down
      if (BREAK === 'noerrtext') B(' (± is a formal counting-error estimate assuming independent archive errors)', '');
      if (BREAK && !globalThis.__brkLogged && !['nocaveat'].includes(BREAK)) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): ' + BREAK); }
      r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    await ctx.route('**/moon.html*', async r => { let s = fs.readFileSync(path.join(ROOT, 'moon.html'), 'utf8');
      if (BREAK === 'nocaveat') { const a = 'Archive documents disagree about the field’s normalization and background treatment, so these percentages are not a calibrated change in lunar neutron flux, nor a measurement of hydrogen or ice.';
        if (!s.includes(a)) throw new Error('break pattern missing: nocaveat'); s = s.replace(a, ''); if (!globalThis.__brkLogged) { globalThis.__brkLogged = 1; console.log('BREAK applied (pattern found): nocaveat'); } }
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: s }); });
    await ctx.route('**/assets/moon/lend/lend-alds-2011-2016-R1.bin*', async r => { hits.lend++;
      if (opt.lendDelay) await new Promise(res => setTimeout(res, opt.lendDelay));
      if (opt.lendHang) return;
      if (opt.lend404 && !(opt.lend404once && hits.lend > 1)) return r.fulfill({ status: 404, body: '' }).catch(() => {});
      r.fulfill({ status: 200, contentType: 'application/octet-stream', body: opt.body || FILE }).catch(() => {}); });
    await ctx.route('**/assets/moon/lroc_color_2k.jpg*', r => { hits.pic++; r.continue().catch(() => {}); });
    await ctx.route('**/assets/moon/diviner/gcp-tbol-nm-R1.bin.gz*', r => { hits.temp++; r.continue().catch(() => {}); });
    await ctx.route('**/assets/moon/lola/ldem4-m-R1.i16.gz*', r => { hits.hgrid++; r.continue().catch(() => {}); });
    await ctx.addInitScript(() => { window.__u = { made: [], revoked: [] }; const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = b => { const u = mk(b); window.__u.made.push(u); return u; }; URL.revokeObjectURL = u => { window.__u.revoked.push(u); rv(u); }; });
    if (opt.noAbort) await ctx.addInitScript(() => { AbortController.prototype.abort = function () {}; });   // only the token gate can stop a late commit
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
  /** Read texture pixels (x, y) from the globe's current texture. */
  const texPx = (p, pts) => p.evaluate(async pts => { const url = MoonGlobe.globe().globeImageUrl(); const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return { w: c.width, h: c.height, px: pts.map(([a, b]) => [...x.getImageData(a, b, 1, 1).data.slice(0, 3)]) }; }, pts);

  // ================= A, B, D, F on one page =================
  {
    const { ctx, p, hits, errs } = await mk();
    ok('D nothing fetched while off', hits.lend === 0, hits);
    ok('F legend hidden while off', await hidden(p, '#mg-lend-leg') && await hidden(p, '#mg-lend-pole') && await hidden(p, '#mg-lend-centre'));
    const picBefore = hits.pic;
    await press(p, '#mg-lend');
    ok('C entry commits', await waitActive(p, 'lend'));
    ok('D one file request and one picture request on first use', hits.lend === 1 && hits.pic - picBefore <= 1, { lend: hits.lend, pic: hits.pic - picBefore });
    // A lossless
    const dec = await p.evaluate(() => { const g = MoonLend.grid(); return { state: [...g.state], near: [...g.near], p: [...g.p], e: [...g.e], n: [...g.n], exp: [...g.exp] }; });
    let bad = 0; for (let i = 0; i < 14400; i++) { const r = rec(FILE, i); for (const k of Object.keys(r)) if (dec[k][i] !== r[k]) { bad++; break; } }
    ok('A all 14,400 records decoded losslessly', bad === 0, bad);
    const cnt = [0, 0, 0, 0]; for (let i = 0; i < 14400; i++) cnt[dec.state[i]]++;
    ok('A state counts 11656/987/317/1440', cnt.join() === '11656,987,317,1440', cnt);
    const first = s => { for (let i = 0; i < 14400; i++) if (dec.state[i] === s) return i; };
    const tx = await p.evaluate(is => is.map(i => MoonLend.text(i)), [first(0), first(1), first(2), first(3), -1]);
    ok('A shown sentence', /^here: [+−]?\d\.\d% ± \d\.\d pp relative difference in the archived CSETN_RATE field/.test(tx[0]) && /formal counting-error estimate assuming independent archive errors/.test(tx[0]), tx[0]);
    ok('A missing sentence', /not in the archive/.test(tx[1]) && /nothing is filled in/.test(tx[1]) && !/%/.test(tx[1]), tx[1]);
    ok('A error-withheld sentence', /withheld by our display rule/.test(tx[2]) && /above 0\.5 percentage points/.test(tx[2]) && !/[+−]\d\.\d%/.test(tx[2]), tx[2]);
    ok('A edge-withheld sentence', /runs past the product’s 80°S edge/.test(tx[3]), tx[3]);
    ok('A outside sentence', /outside this product’s coverage/.test(tx[4]), tx[4]);
    ok('A no unit, flux, hydrogen or ice claim in readouts', tx.every(t => !/counts? ?\/ ?s|counts per second|neutron flux of|wt%|hydrogen amount|ice is/.test(t)));
    const zero = (() => { for (let i = 0; i < 14400; i++) if (dec.state[i] === 0 && dec.p[i] === 0) return i; return -1; })();
    if (zero >= 0) ok('A valid 0.0% is a value', /^here: 0\.0% ± /.test(await p.evaluate(i => MoonLend.text(i), zero)));
    const cab = await p.evaluate(() => MoonLend.cell(-85.33, 317.87));
    ok('A Cabeus cell index and value', cab.i === nIdx(-85.33, 317.87) && cab.p === rec(FILE, cab.i).p, cab);
    ok('A index north of 80 S is outside', await p.evaluate(() => MoonLend.index(-79.9, 10)) === -1 && await p.evaluate(() => MoonLend.index(-80.01, 10)) === nIdx(-80.01, 10));
    // R readout rounding (28 Nov 2026, GPT and Chad): stored integer hundredths shown as tenths, half away from zero, for both the
    //   percentage and the error estimate. Oracle here is independent of the page's: quotient and remainder, round up on remainder >= 5.
    const orc = v => { const a = Math.abs(v); let q = Math.trunc(a / 10); if (a % 10 >= 5) q += 1; return String(Math.trunc(q / 10)) + '.' + String(q % 10); };
    const oPct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + orc(v) + '%', oPp = v => orc(v) + ' pp';
    {
      const tieP = [[0, '0.0%'], [4, '+0.0%'], [-4, '−0.0%'], [5, '+0.1%'], [-5, '−0.1%'], [6, '+0.1%'], [-6, '−0.1%'], [14, '+0.1%'], [-14, '−0.1%'], [15, '+0.2%'], [-15, '−0.2%'],
        [16, '+0.2%'], [34, '+0.3%'], [35, '+0.4%'], [-35, '−0.4%'], [36, '+0.4%'], [84, '+0.8%'], [-84, '−0.8%'], [85, '+0.9%'], [-85, '−0.9%'], [95, '+1.0%'], [-95, '−1.0%'], [249, '+2.5%'], [-245, '−2.5%'], [1005, '+10.1%']];
      const tieE = [[0, '0.0 pp'], [4, '0.0 pp'], [5, '0.1 pp'], [14, '0.1 pp'], [15, '0.2 pp'], [34, '0.3 pp'], [35, '0.4 pp'], [36, '0.4 pp'], [44, '0.4 pp'], [45, '0.5 pp'], [50, '0.5 pp'], [95, '1.0 pp'], [105, '1.1 pp']];
      const got = await p.evaluate(([a, b]) => ({ p: a.map(([v]) => MoonLend.fmt.pct(v)), e: b.map(([v]) => MoonLend.fmt.pp(v)) }), [tieP, tieE]);
      const badP = tieP.filter(([v, w], k) => got.p[k] !== w), badE = tieE.filter(([v, w], k) => got.e[k] !== w);
      ok('R percentage: positive and negative ties round half away from zero; zero and neighbours as expected', badP.length === 0, { badP, got: got.p });
      ok('R error estimate: ties round half away from zero; zero and neighbours as expected', badE.length === 0, { badE, got: got.e });
      ok('R the test oracle agrees with every expected literal', tieP.every(([v, w]) => oPct(v) === w) && tieE.every(([v, w]) => oPp(v) === w));
      const shown = []; for (let i = 0; i < 14400; i++) if (dec.state[i] === 0) shown.push(i);
      const txt = await p.evaluate(is => is.map(i => MoonLend.text(i)), shown);
      let mis = [], oldE = 0, oldP = 0, stepBad = 0;
      shown.forEach((i, k) => { const r = rec(FILE, i), m = /^here: ([+−]?\d+\.\d)% ± (\d+\.\d) pp /.exec(txt[k]);
        if (!m || m[1] + '%' !== oPct(r.p) || m[2] + ' pp' !== oPp(r.e)) mis.push({ i, p: r.p, e: r.e, t: (txt[k] || '').slice(0, 40) });
        const oe = (r.e / 100).toFixed(1), op = (Math.abs(r.p) / 100).toFixed(1);
        if (oe + ' pp' !== oPp(r.e)) { oldE++; if (Math.round(Math.abs(parseFloat(oPp(r.e)) - parseFloat(oe)) * 10) !== 1) stepBad++; }
        if (op !== orc(r.p)) { oldP++; if (Math.round(Math.abs(parseFloat(orc(r.p)) - parseFloat(op)) * 10) !== 1) stepBad++; } });
      ok('R every one of the 11,656 shown cells reads its stored percentage and estimate rounded half away from zero', shown.length === 11656 && mis.length === 0, { n: shown.length, mis: mis.slice(0, 5), nMis: mis.length });
      ok('R scope of the change: 530 estimates and 456 percentages differ from the released toFixed text, each by exactly 0.1', oldE === 530 && oldP === 456 && stepBad === 0, { oldE, oldP, stepBad });
      const nonShown = [first(1), first(2), first(3), -1];
      ok('R missing, withheld and outside readouts still carry no percentage or estimate', (await p.evaluate(is => is.map(i => MoonLend.text(i)), nonShown)).every(t => !/\d\.\d%|\d\.\d pp/.test(t)));
    }
    // B texture registration
    const pick = [first(0), first(1), first(2), first(3)].concat([nIdx(-85.25, 0.25), nIdx(-85.25, 359.75), nIdx(-82.25, 180.25)]);
    const pts = pick.map(i => { const r = Math.floor(i / 720), c = i % 720; return [(4 * c + 1440) % 2880 + 1, 1440 - 4 * (r + 1) + 1]; });
    const T = await texPx(p, pts.concat([[100, 1300], [2000, 200]]));
    ok('B texture is 2880 x 1440', T.w === 2880 && T.h === 1440, [T.w, T.h]);
    pick.forEach((i, k) => { const r = rec(FILE, i), got = T.px[k];
      if (r.state === 0) ok('B shown cell colour ' + i, near(got, rampAt(r.p)), { got, want: rampAt(r.p), p: r.p });
      else if (r.state === 1) ok('B missing cell dark hatch ' + i, got.every(v => v <= 110), got);
      else ok('B withheld cell light hatch ' + i, got.every(v => v >= 150) && Math.max(...got) - Math.min(...got) <= 4, got); });
    const pic = await p.evaluate(async () => { const r = await fetch('assets/moon/lroc_color_2k.jpg?v=1'); const b = await r.blob(); const im = await createImageBitmap(b);
      const c = document.createElement('canvas'); c.width = 2880; c.height = 1440; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 2880, 1440); return [[...x.getImageData(100, 1300, 1, 1).data.slice(0, 3)], [...x.getImageData(2000, 200, 1, 1).data.slice(0, 3)]]; });
    ok('B north of 80 S equals the plain picture', near(T.px[pick.length], pic[0], 2) && near(T.px[pick.length + 1], pic[1], 2), { got: T.px.slice(-2), want: pic });
    // B click at screen centre after turning to a cell
    await p.evaluate(() => document.getElementById('mg-globe').scrollIntoView({ block: 'center' }));
    for (const [la, lo] of [[-84.6, 100.3], [-83.2, 250.8]]) {
      await p.evaluate(([la, lo]) => MoonGlobe.point(la, lo), [la, lo]); await p.waitForTimeout(400);
      const bb = await p.locator('#mg-globe').boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(300);
      const ds = await p.evaluate(() => ({ ...document.getElementById('mg-lend-read').dataset }));
      const cla = Number(ds.lat), clo = Number(ds.lng), toR = Math.PI / 180;
      const km = 1737.4 * Math.acos(Math.min(1, Math.sin(la * toR) * Math.sin(cla * toR) + Math.cos(la * toR) * Math.cos(cla * toR) * Math.cos((lo - clo) * toR)));
      ok('B centre click lands near the pointed place ' + la, km < 10, { km, ds });
      ok('B the page reads the cell our independent index gives for the clicked point ' + la, Number(ds.cell) === nIdx(cla, clo), { cell: ds.cell, want: nIdx(cla, clo) });
      ok('B readout value equals the file at that cell ' + la, Number(ds.p) === rec(FILE, Number(ds.cell)).p && Number(ds.state) === rec(FILE, Number(ds.cell)).state, ds);
    }
    // F legend and wording
    const leg = await text(p, '#mg-lend-leg');
    ok('F legend shown while active', !await hidden(p, '#mg-lend-leg'));
    ok('F caveat on the feature', /Archive documents disagree about the field’s normalization and background treatment/.test(leg) && /not a calibrated change in lunar neutron flux, nor a measurement of hydrogen or ice/.test(leg));
    ok('F conditional estimate on the feature', /formal counting-error estimate that assumes the archive’s errors are independent; it is not the full uncertainty/.test(leg));
    ok('F display choice and dispute', /60 km disc is a display choice/.test(leg) && /disputed in published work/.test(leg) && /not attributed to any one cause/.test(leg));
    ok('F four states named', /Not in the archive/.test(leg) && /Withheld by our display rule/.test(leg) && /Outside this product’s coverage/.test(leg));
    ok('F no hydrogen or water number', !/\d\s?(wt|ppm|%\s?water|% hydrogen)/i.test(leg));
    await press(p, '#mg-lend-pole'); await p.waitForTimeout(300);
    ok('F pole button turns to -85', Math.abs((await p.evaluate(() => MoonGlobe.view())).lat + 85) < 0.01);
    await press(p, '#mg-lend-centre'); await p.waitForTimeout(200);
    ok('F centre read gives a sentence', /\(centre of view\)/.test(await text(p, '#mg-lend-read')));
    ok('F LRO overlay untouched', await p.evaluate(() => document.getElementById('mg-lro').getAttribute('aria-pressed')) === 'false');
    // D re-entry from cache
    await press(p, '#mg-lend'); ok('C leave', await waitIdle(p) && (await sci(p)).active === null);
    ok('F legend hidden after leave', await hidden(p, '#mg-lend-leg'));
    await press(p, '#mg-lend'); await waitActive(p, 'lend');
    ok('D no request on re-entry', hits.lend === 1, hits.lend);
    // C switching layers keeps the saved state; height and temperature still work
    await press(p, '#mg-height'); ok('C neutron -> height', await waitActive(p, 'height'));
    await press(p, '#mg-temp'); ok('C height -> temperature', await waitActive(p, 'temp-noon'));
    await press(p, '#mg-lend'); ok('C temperature -> neutron', await waitActive(p, 'lend'));
    ok('C entry kept across switches', (await sci(p)).entry === 'lend' && (await sci(p)).saved && (await sci(p)).saved.on === false, await sci(p));
    await press(p, '#mg-lend'); await waitIdle(p);
    ok('A/F no page errors', errs.length === 0, errs);
    await ctx.close();
  }

  // ================= C lighting saved once and restored =================
  {
    const { ctx, p } = await mk();
    await litOn(p);
    await press(p, '#mg-lend'); await waitActive(p, 'lend');
    ok('C lighting off while shown', await p.evaluate(() => MoonGlobe.light().state) !== 'on');
    await press(p, '#mg-height'); await waitActive(p, 'height');
    ok('C saved once (lit on) across a switch', (await sci(p)).saved.on === true);
    await press(p, '#mg-height'); await waitIdle(p); await p.waitForTimeout(500);
    ok('C lit restored on leave', await p.evaluate(() => MoonGlobe.light().state) === 'on');
    await ctx.close();
  }

  // ================= C failure keeps shown map; retry; late answer; leave cancels =================
  {
    const { ctx, p, hits } = await mk({ lend404: true, lend404once: true });
    await press(p, '#mg-height'); await waitActive(p, 'height');
    const texH = await p.evaluate(() => MoonGlobe.globe().globeImageUrl());
    await press(p, '#mg-lend'); await waitIdle(p);
    ok('C failed load keeps the shown map', (await sci(p)).active === 'height' && await p.evaluate(() => MoonGlobe.globe().globeImageUrl()) === texH);
    ok('C failure message', /Neutron record map could not be loaded: the server answered HTTP 404\. The map shown is unchanged\./.test(await text(p, '#mg-lend-read')));
    await press(p, '#mg-lend'); ok('C retry after failure works', await waitActive(p, 'lend') && hits.lend === 2, hits.lend);
    await ctx.close();
  }
  {
    const { ctx, p } = await mk({ lendDelay: 3000 });
    await press(p, '#mg-lend'); await p.waitForTimeout(300);
    await press(p, '#mg-lend');   // cancel while loading
    await p.waitForTimeout(4000);
    ok('C cancelled request never commits (late answer dropped)', (await sci(p)).active === null && (await sci(p)).commits === 0, await sci(p));
    await press(p, '#mg-height'); await waitActive(p, 'height');
    await press(p, '#mg-lend'); await p.waitForTimeout(300); await press(p, '#mg-height');   // leave height while lend is pending
    await p.waitForTimeout(4000);
    ok('C leave cancels a pending request', (await sci(p)).active === null && (await sci(p)).pending === null, await sci(p));
    await ctx.close();
  }
  {   // a superseded request whose fetch cannot be aborted: only the token check stops its late answer
    const { ctx, p } = await mk({ lendDelay: 3000, noAbort: true });
    await press(p, '#mg-lend'); await p.waitForTimeout(300);
    await press(p, '#mg-lend');   // cancel while loading (abort does nothing here)
    await p.waitForFunction(() => MoonLend.state().drawMs !== null, null, { timeout: 40000 }).catch(() => {});
    await p.waitForTimeout(1500);
    ok('C late answer from an unabortable request never commits', (await sci(p)).active === null && (await sci(p)).commits === 0, await sci(p));
    ok('C that late answer was produced and released', await p.evaluate(() => MoonLend.state().drawMs) !== null && await live(p) === 0, { live: await live(p) });
    await ctx.close();
  }
  {   // deadline: the PNG step is held past 15 s; the request ends at the deadline; the late texture is released, never shown
    const { ctx, p } = await mk({ hold: true });
    await p.evaluate(() => { window.__hold.on = true; });
    await press(p, '#mg-lend');
    await p.waitForFunction(() => window.__hold.q.length > 0, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(16000);
    ok('C deadline ends the request', (await sci(p)).pending === null && (await sci(p)).active === null, await sci(p));
    ok('C deadline message', /took too long/.test(await text(p, '#mg-lend-read')));
    const madeBefore = await p.evaluate(() => window.__u.made.length);
    await p.evaluate(() => { window.__hold.on = false; return window.__release(); });
    const produced = await p.waitForFunction(n => window.__u.made.length > n, madeBefore, { timeout: 40000 }).then(() => true, () => false);
    await p.waitForTimeout(1000);
    ok('C the held texture was produced after the deadline (the check below is not vacuous)', produced);
    ok('C late texture never shown', (await sci(p)).active === null && (await sci(p)).commits === 0);
    ok('C late texture released', await live(p) === 0, await live(p));
    await ctx.close();
  }

  // ================= E page rejections =================
  const NREC = i => 160 + 10 * i;
  const cases = [
    ['magic', craft(b => { b[0] = 0x58; }), /header is not the expected one/],
    ['header radius', craft(b => { b.writeUInt32LE(60000, 28); }), /header/],
    ['reference mean', craft(b => { b.writeDoubleLE(5.0, 52); }), /header/],
    ['source hash', craft(b => { b[100] ^= 1; }), /header/],
    // non-finite reference fields (GPT's preview review): the outer pin is injected to match each crafted file, so the header validator decides
    ['reference mean NaN', craft(b => { b.writeDoubleLE(NaN, 52); }), /header is not the expected one/],
    ['reference error NaN', craft(b => { b.writeDoubleLE(NaN, 60); }), /header is not the expected one/],
    ['reference mean +Infinity', craft(b => { b.writeDoubleLE(Infinity, 52); }), /header is not the expected one/],
    ['reference error -Infinity', craft(b => { b.writeDoubleLE(-Infinity, 60); }), /header is not the expected one/],
    ['payload hash', craft(b => { b[NREC(5000) + 2] ^= 1; }, { keepHash: true }), /payload check/],
    ['bad state code', craft(b => { b[NREC(7000)] = 4; }), /cell check/],
    ['shown estimate 0.51', craft(b => { const i = (() => { for (let i = 0; i < 14400; i++) if (b[NREC(i)] === 0) return i; })(); b.writeUInt16LE(51, NREC(i) + 4); }), /cell check/],
    ['missing cell with a value', craft(b => { b.writeInt16LE(5, NREC(0) + 2); }), /cell check/],
    ['shown p beyond 20 %', craft(b => { const i = (() => { for (let i = 0; i < 14400; i++) if (b[NREC(i)] === 0) return i; })(); b.writeInt16LE(2001, NREC(i) + 2); }), /cell check/],
    ['withheld cell with p set', craft(b => { const i = (() => { for (let i = 0; i < 14400; i++) if (b[NREC(i)] === 3) return i; })(); b.writeInt16LE(-50, NREC(i) + 2); }), /cell check/],
    ['short file', FILE.subarray(0, FILE.length - 10), /integrity check|header|payload/],
  ];
  for (const [name, body, re] of cases) {
    const { ctx, p } = await mk({ body });
    await press(p, '#mg-lend'); await waitIdle(p);
    const t = await text(p, '#mg-lend-read');
    ok('E rejects ' + name, (await sci(p)).active === null && re.test(t), t);
    await ctx.close();
  }
  {   // a NaN header while another map is shown: refused with the header message; the shown height map and its texture stay unchanged
    const nanBody = craft(b => { b.writeDoubleLE(NaN, 52); });
    const { ctx, p } = await mk({ body: nanBody });
    await press(p, '#mg-height');
    const hOk = await waitActive(p, 'height');
    const texBefore = await p.evaluate(() => MoonGlobe.globe().globeImageUrl());
    await press(p, '#mg-lend'); await waitIdle(p);
    const t = await text(p, '#mg-lend-read');
    ok('E NaN header while height is shown: refused, height stays', hOk && (await sci(p)).active === 'height' && /header is not the expected one/.test(t), { st: await sci(p), t });
    ok('E NaN header: the displayed texture is unchanged', await p.evaluate(() => MoonGlobe.globe().globeImageUrl()) === texBefore);
    await ctx.close();
  }
  { const { ctx, p } = await mk({ body: null }); await ctx.route('**/assets/moon/lend/lend-alds-2011-2016-R1.bin*', r => r.fulfill({ status: 200, body: craft(b => { b[NREC(9)] ^= 0; b[NREC(9) + 8] ^= 1; }, { keepHash: false }) }));
    await press(p, '#mg-lend'); await waitIdle(p);
    ok('E pin refuses a changed file', (await sci(p)).active === null && /integrity check/.test(await text(p, '#mg-lend-read')), await text(p, '#mg-lend-read')); await ctx.close(); }

  // ================= F keyboard and narrow layout =================
  {
    const { ctx, p } = await mk({ w: 360, h: 780 });
    await p.focus('#mg-lend'); await p.keyboard.press('Enter');
    ok('F keyboard Enter shows the layer', await waitActive(p, 'lend'));
    const over = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('#mg-lend-leg *, #mg-lend, #mg-lend-pole, #mg-lend-centre')].filter(e => e.getBoundingClientRect().right > W + 1).map(e => e.id || e.className || e.tagName); });
    ok('F 360 px: nothing wider than the page', over.length === 0, over);
    await p.focus('#mg-lend-centre'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok('F keyboard centre read', /\(centre of view\)/.test(await text(p, '#mg-lend-read')));
    await ctx.close();
  }

  await br.close();
  console.log(`moon-lend-ui: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
