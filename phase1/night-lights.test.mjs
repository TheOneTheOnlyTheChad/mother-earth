/* Night lights — logic suite (NIGHT-LIGHTS-PROPOSAL rev 2 §9; GPT's two build details, 15 Nov 2026; branch night-lights-rc).
 * Runs the page's own functions (ME.nlLogic from nightlights.js) in node, against synthetic fixtures and against the
 * responses recorded from NASA GIBS on 15 Nov 2026 (phase1/night-lights/recorded-gibs-2026-11-15.json: both colour keys,
 * the Saipan and Tinian box for 19 March, 20 April and 15 April 2026, and one whole-globe frame for 21 June 2026).
 * Run: node --no-warnings phase1/night-lights.test.mjs        (needs pngjs: /home/claude/spike/node_modules)
 * BREAK=<name> weakens the loaded source; each must make this suite fail:
 *   one-date-shares missing-zero low-usable one-missing-ok failed-as-arriving arriving-as-ok float-threshold bbox-order
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const { PNG } = createRequire(import.meta.url)(process.env.PNGJS || '/home/claude/spike/node_modules/pngjs');
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'one-date-shares': [["if (la[i] < 0 || lb[i] < 0) noData++; else if (a && b) both++; else noRel++;", "if (la[i] < 0 || lb[i] < 0) noData++; else if (a) both++; else noRel++;"]],
  'missing-zero': [["if (rgba[i * 4 + 3] < 10) { v[i] = -1; none++; continue; }", "if (rgba[i * 4 + 3] < 10) { v[i] = 0; none++; continue; }"]],
  'low-usable': [["(ca[i] >= th && cb[i] >= th) ? USABLE : NOREL;", "(ca[i] >= 0 && cb[i] >= 0) ? USABLE : NOREL;"]],
  'one-missing-ok': [["s[i] = (la[i] < 0 || lb[i] < 0) ? NODATA", "s[i] = (la[i] < 0 && lb[i] < 0) ? NODATA"]],
  'failed-as-arriving': [["if (r.status === 'failed' || r.status === 'blocked') return { date: null, arriving, fail: r };", ""]],
  'arriving-as-ok': [["if (r.status === 'ok' && r.missing <= NL.MAX_MISSING) return", "if (r.status === 'ok') return"]],
  'float-threshold': [["THRESH_H: 95,", "THRESH_H: 96,"]],
  'bbox-order': [["`&BBOX=${num(box.s)},${num(box.w)},${num(box.n)},${num(box.e)}", "`&BBOX=${num(box.w)},${num(box.s)},${num(box.e)},${num(box.n)}"]],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
let src = fs.readFileSync(path.join(ROOT, 'nightlights.js'), 'utf8');
if (BREAK) for (const [a, b] of BREAKS[BREAK]) { if (src.split(a).length !== 2) { console.log('FAIL  break did not apply exactly once: ' + BREAK); process.exit(1); } src = src.replace(a, b); }
const ME = { $: () => null, esc: s => String(s) }; const win = { ME };
new Function('window', 'document', src)(win, { createElement: () => { throw new Error('no document in the logic suite'); } });
const L = ME.nlLogic, { NL, USABLE, NOREL, NODATA } = L;

let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const REC = JSON.parse(fs.readFileSync(path.join(HERE, 'night-lights/recorded-gibs-2026-11-15.json'), 'utf8'));
const text = n => Buffer.from(REC.colormaps[n].b64, 'base64').toString('utf8');
const png = k => { const p = PNG.sync.read(Buffer.from(REC.frames[k].b64, 'base64')); return { w: p.width, h: p.height, data: p.data }; };

// ---------- A. NASA's keys
const LK = L.parseKey(text('VIIRS_DayNightBand_At_Sensor_Radiance'), 10), CK = L.parseKey(text('VIIRS_Clear_Sky_Confidence'), 100);
ok('A light key: 180 colours, darkest is 0, white is 38.2, every colour a grey', LK.size === 180 && LK.get('7,7,7') === 0 && LK.get('255,255,255') === 382 && [...LK.keys()].every(k => { const [r, g, b] = k.split(','); return r === g && g === b; }), [LK.size, LK.get('7,7,7'), LK.get('255,255,255')]);
ok('A light key: values rise with brightness and never repeat', (() => { const e = [...LK.entries()].sort((x, y) => +x[0].split(',')[0] - +y[0].split(',')[0]); return e.every((x, i) => i === 0 || x[1] > e[i - 1][1]); })());
ok('A clear-sky key: 101 colours, 0.00 to 1.00 in hundredths, 0.95 present as exactly 95', CK.size === 101 && Math.min(...CK.values()) === 0 && Math.max(...CK.values()) === 100 && [...CK.values()].includes(95) && new Set(CK.values()).size === 101, [CK.size]);
ok('A a key with no entries is refused', (() => { try { L.parseKey('<ColorMap></ColorMap>', 10); return false; } catch (e) { return true; } })());
ok('A a key that maps one colour to two values is refused', (() => { try { L.parseKey('<ColorMapEntry rgb="1,1,1" value="[0,1)"/><ColorMapEntry rgb="1,1,1" value="[1,2)"/>', 10); return false; } catch (e) { return true; } })());

// ---------- B. decoding: transparent is no data, never zero; an unknown colour is counted, never guessed
{ const rgba = new Uint8ClampedArray([7, 7, 7, 255, 255, 255, 255, 255, 0, 0, 0, 0, 9, 200, 9, 255]); const d = L.decode(rgba, 4, LK);
  ok('B dark measured light decodes to 0, white to 382', d.v[0] === 0 && d.v[1] === 382, [...d.v]);
  ok('B a transparent pixel is no data (−1), not zero', d.v[2] === -1 && d.none === 1, [...d.v]);
  ok('B a colour the key does not hold is counted as unknown and left without a value', d.v[3] === -1 && d.unknown === 1, d.unknown); }

// ---------- C. three states from both dates (§9.1; GPT build detail 1)
{ const A = (...x) => Int16Array.from(x);
  //            0:both fine  1:A dark valid, B transparent  2:conf low on B  3:conf missing on A  4:both transparent  5:exactly 0.95 both  6:0.94 on A
  const la = A(12, 0, 30, 30, -1, 5, 5), lb = A(3, -1, 30, 30, -1, 5, 5), ca = A(100, 100, 100, -1, 100, 95, 94), cb = A(99, 100, 40, 100, 100, 95, 100);
  const s = L.classify(la, ca, lb, cb, NL.THRESH_H);
  ok('C usable on both: light on both and confidence 0.95 or more on both', s[0] === USABLE && s[5] === USABLE, [...s]);
  ok('C GPT fixture: a valid dark pixel on one date and a transparent one on the other is "No data" (one state, used for both panels)', la[1] === 0 && lb[1] === -1 && s[1] === NODATA, [...s]);
  ok('C light on both, confidence low on either date: "No reliable comparison"', s[2] === NOREL && s[6] === NOREL, [...s]);
  ok('C light on both, confidence MISSING on either date: "No reliable comparison"', s[3] === NOREL, [...s]);
  ok('C no light on either date: "No data"', s[4] === NODATA, [...s]);
  const t = L.tally(la, ca, lb, cb, NL.THRESH_H);
  ok('C tally: n 7, readable A 4, readable B 4, usable on both 2, no data 2, no reliable 3', t.n === 7 && t.readA === 4 && t.readB === 4 && t.both === 2 && t.noData === 2 && t.noRel === 3, t);
  ok('C tally: usable on both is never more than either readable count', t.both <= t.readA && t.both <= t.readB, t);
  ok('C tally: the three states add up to every pixel', t.both + t.noData + t.noRel === t.n, t);
  ok('C tally agrees with classify pixel for pixel', [USABLE, NOREL, NODATA].map(k => s.filter(x => x === k).length).join() === [t.both, t.noRel, t.noData].join());
  const one = L.classifyOne(la, ca, NL.THRESH_H);
  ok('C one date alone: readable, not readable, no data', one[0] === USABLE && one[3] === NOREL && one[4] === NODATA && one[6] === NOREL, [...one]); }

// ---------- D. the recorded Saipan and Tinian frames (fixture check of the recorded requests; test harness only)
const BOX = { s: 14.85, w: 145.45, n: 15.35, e: 145.95 }, W = 120, H = 120;
const SAIPAN = { s: 15.09, n: 15.30, w: 145.68, e: 145.84 }, TINIAN = { s: 14.92, n: 15.11, w: 145.58, e: 145.68 };
const inBox = (b, i) => { const x = i % W, y = (i / W) | 0, lon = BOX.w + (x + .5) / W * (BOX.e - BOX.w), lat = BOX.n - (y + .5) / H * (BOX.n - BOX.s); return lon >= b.w && lon < b.e && lat >= b.s && lat < b.n; };
const rec = d => { const r = png(d + '/rad'), c = png(d + '/csc'); const l = L.decode(r.data, W * H, LK), k = L.decode(c.data, W * H, CK); return { r, light: l.v, clear: k.v, unknown: l.unknown + k.unknown, none: l.none }; };
// The record's totals (2,854 → 770; 183 → 138) were taken over each box with its edges rounded OUTWARD to whole pixels
// (2,028 and 1,175 pixels), not over the pixels whose centres lie inside it (1,950 and 1,080). Found while building this
// fixture, 15 Nov 2026; the test record carries the correction. Both are checked here, each against its own figures.
const inSlice = (b, i) => { const x = i % W, y = (i / W) | 0; return x >= Math.floor((b.w - BOX.w) / (BOX.e - BOX.w) * W) && x < Math.ceil((b.e - BOX.w) / (BOX.e - BOX.w) * W) && y >= Math.floor((BOX.n - b.n) / (BOX.n - BOX.s) * H) && y < Math.ceil((BOX.n - b.s) / (BOX.n - BOX.s) * H); };
const sumBox = (f, b, rule = inSlice) => { let t = 0, n5 = 0, n = 0, max = 0; for (let i = 0; i < W * H; i++) if (rule(b, i)) { n++; if (f.light[i] >= 0) { t += f.light[i]; if (f.light[i] >= 50) n5++; if (f.light[i] > max) max = f.light[i]; } } return { tenths: t, n5, n, max }; };
const M19 = rec('2026-03-19'), A20 = rec('2026-04-20'), A15 = rec('2026-04-15');
ok('D the recorded pictures are 120 × 120 and every colour is in NASA\'s keys', [M19, A20, A15].every(f => f.r.w === W && f.r.h === H && f.unknown === 0), [M19.unknown, A20.unknown, A15.unknown]);
for (const [d, k] of [['2026-03-19', NL.LIGHT], ['2026-04-20', NL.CLEAR]]) ok(`D the page's request for ${d} is the recorded request, character for character (WMS 1.3.0, south,west,north,east)`,
  L.wmsUrl(k, d, BOX, W, H) === 'https://gibs.earthdata.nasa.gov' + REC.frames[d + (k === NL.LIGHT ? '/rad' : '/csc')].url, L.wmsUrl(k, d, BOX, W, H));
{ const a = sumBox(M19, SAIPAN), b = sumBox(A20, SAIPAN), ta = sumBox(M19, TINIAN), tb = sumBox(A20, TINIAN);
    ok('D fixture: Saipan box summed radiance 2,854 on 19 March and 770 on 20 April (exactly 2,854.1 and 769.9; box edges rounded outward, 2,028 pixels)', a.tenths === 28541 && b.tenths === 7699 && a.n === 2028, [a.tenths, b.tenths, a.n]);
  ok('D fixture: Saipan pixels at or above 5: 154 and 16', a.n5 === 154 && b.n5 === 16, [a.n5, b.n5]);
  ok('D fixture: Tinian 183 and 138 (exactly 183.0 and 137.8; 1,175 pixels); pixels at or above 5: 7 and 0', ta.tenths === 1830 && tb.tenths === 1378 && ta.n5 === 7 && tb.n5 === 0 && ta.n === 1175, [ta.tenths, tb.tenths, ta.n5, tb.n5, ta.n]);
  const ca = sumBox(M19, SAIPAN, inBox), cb = sumBox(A20, SAIPAN, inBox), cta = sumBox(M19, TINIAN, inBox), ctb = sumBox(A20, TINIAN, inBox);
  ok('D the same boxes by pixel centre (1,950 and 1,080 pixels): Saipan 2,853.2 and 760.9; Tinian 181.8 and 130.2', ca.tenths === 28532 && cb.tenths === 7609 && ca.n === 1950 && cta.tenths === 1818 && ctb.tenths === 1302 && cta.n === 1080, [ca, cb, cta, ctb]);
  ok('D the brightest 19 March pixel is at the top of the scale and reads "38.2 or more"', a.max === 382 && L.lightText(a.max) === '38.2 or more' && L.lightText(223) === '22.3', [a.max]); }
{ const t = L.tally(M19.light, M19.clear, A20.light, A20.clear, NL.THRESH_H), s = L.classify(M19.light, M19.clear, A20.light, A20.clear, NL.THRESH_H);
  console.log(`      19 March / 20 April, whole box of ${t.n}: readable ${t.readA} (${L.pct(t.readA, t.n)}) and ${t.readB} (${L.pct(t.readB, t.n)}); usable on both ${t.both} (${L.pct(t.both, t.n)}); no reliable ${t.noRel}; no data ${t.noData}`);
  ok('D pair: no pixel is missing light on either night; usable on both is no more than either readable count and more than half the box', t.noData === 0 && t.both <= t.readA && t.both <= t.readB && t.both > t.n / 2, t);
  ok('D pair: the lit Saipan pixels of 19 March that are usable on both lie inside the Saipan box (axis order and placement)', (() => { let inside = 0, all = 0; for (let i = 0; i < W * H; i++) if (M19.light[i] >= 50) { all++; if (inBox(SAIPAN, i) || inBox(TINIAN, i)) inside++; } return all > 100 && inside === all; })()); }
{ const t = L.tally(A15.light, A15.clear, A20.light, A20.clear, NL.THRESH_H);
  ok('D 15 April against 20 April: light was measured everywhere, clear-sky confidence is 0 everywhere on 15 April, so nothing is usable and all of it is "No reliable comparison"', t.noData === 0 && t.readA === 0 && t.both === 0 && t.noRel === t.n && A15.clear.every(x => x === 0), t); }

// ---------- E. the latest-date rule (§9.3; GPT build detail 2)
{ const full = new Int16Array(64 * 32).fill(5), half = full.slice(), polar = full.slice();
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { if (x < 32) half[y * 64 + x] = -1; if (y < 5 || y > 26) polar[y * 64 + x] = -1; }
  ok('E band rule: a complete frame has 0 missing in 30°S–30°N', L.bandMissing(full, 64, 32, 30) === 0);
  ok('E band rule: a half-arrived frame has half missing', L.bandMissing(half, 64, 32, 30) === 0.5);
  ok('E band rule: a frame missing only near the poles has 0 missing in the band (the seasonal gap does not fail the rule)', L.bandMissing(polar, 64, 32, 30) === 0);
  const g = png('2026-06-21/global512'), d = L.decode(g.data, g.w * g.h, LK);
  let north = 0, northMiss = 0; for (let y = 0; y < g.h; y++) { const lat = 90 - (y + .5) / g.h * 180; if (lat > 60) for (let x = 0; x < g.w; x++) { north++; if (d.v[y * g.w + x] < 0) northMiss++; } }
  ok('E recorded 21 June 2026 frame: nothing missing in 30°S–30°N, so the rule passes it', d.unknown === 0 && L.bandMissing(d.v, g.w, g.h, 30) <= NL.MAX_MISSING, L.bandMissing(d.v, g.w, g.h, 30));
  ok('E recorded 21 June 2026 frame: north of 60°N is no data (no night pass), not dark', northMiss === north && north > 0, [northMiss, north]); }
{ const P = L.pickDate, D = ['2026-11-15', '2026-11-14', '2026-11-13', '2026-11-12'];
  const okf = (d, m = 0) => ({ date: d, status: 'ok', missing: m }), bad = (d, st = 'failed') => ({ date: d, status: st, why: 'NASA GIBS answered HTTP 503' });
  let r = P([okf(D[0])]); ok('E newest complete: it is chosen, nothing arriving', r.date === D[0] && r.arriving.length === 0 && !r.fail, r);
  r = P([okf(D[0], 0.57), okf(D[1], 0)]); ok('E newest still filling: the prior date is chosen and the newest is named as arriving', r.date === D[1] && r.arriving.join() === D[0] && !r.fail, r);
  r = P([okf(D[0], 0.57), okf(D[1], 0.2), okf(D[2], 0.004)]); ok('E two newest still filling: the third is chosen, both named', r.date === D[2] && r.arriving.join() === D[0] + ',' + D[1], r);
  r = P([okf(D[0], 0.0101), okf(D[1], 0.01)]); ok('E the 1% line: 1.01% missing is still arriving, exactly 1% passes', r.date === D[1] && r.arriving.join() === D[0], r);
  r = P([bad(D[0])]); ok('E a failed request is a failure, not "still arriving": no date, nothing arriving, the failure returned', r.date === null && r.arriving.length === 0 && r.fail && r.fail.status === 'failed', r);
  r = P([okf(D[0], 0.6), bad(D[1])]); ok('E a failure behind an arriving date: no fallback past it', r.date === null && r.fail && r.fail.date === D[1] && r.arriving.join() === D[0], r);
  r = P([bad(D[0], 'blocked')]); ok('E a blocked read is reported as blocked', r.fail && r.fail.status === 'blocked', r);
  r = P(D.map(d => okf(d, 0.5))); ok('E four dates all still arriving: no date, no failure, all four named', r.date === null && !r.fail && r.arriving.length === 4, r); }

// ---------- F. small rules
ok('F dates: strict YYYY-MM-DD real days only', L.validDay('2026-03-19') === '2026-03-19' && L.validDay('2026-02-30') === null && L.validDay('2026-3-19') === null && L.validDay('2026-03-19T00:00') === null && L.validDay(null) === null);
ok('F date text', L.dayText('2026-03-19') === '19 Mar 2026' && L.dayText('2026-11-05') === '5 Nov 2026' && L.dayText('x') === null);
ok('F shares: whole percent, never "0%" for some and never "100%" for less than all', L.pct(0, 200) === '0%' && L.pct(1, 1000) === 'under 1%' && L.pct(999, 1000) === 'over 99%' && L.pct(1000, 1000) === '100%' && L.pct(85, 100) === '85%');
ok('F box: 0.5° about 15.10, 145.70 is the recorded box; 120 pixels', JSON.stringify(L.boxFor(15.10, 145.70, 0.5)) === JSON.stringify(BOX) && L.spanPx(0.5) === 120 && L.spanPx(1) === 240 && L.spanPx(2) === 480 && L.spanPx(10) === 480, L.boxFor(15.10, 145.70, 0.5));
ok('F box: kept inside the map at the poles and the date line (shifted, never wrapped)', (() => { const a = L.boxFor(89.9, 179.9, 2), b = L.boxFor(-89.9, -179.9, 2); return a.n === 90 && a.e === 180 && a.s === 88 && a.w === 178 && b.s === -90 && b.w === -180; })());
ok('F threshold is 0.95 as an exact integer comparison (94 fails, 95 passes)', NL.THRESH_H === 95 && L.classify(Int16Array.of(1, 1), Int16Array.of(94, 95), Int16Array.of(1, 1), Int16Array.of(100, 100), NL.THRESH_H).join() === '1,0');
ok('F the fixed wording: light, never power', !/outage|blackout|power/i.test([NL.R2, NL.THRESH_TEXT, NL.LOCAL].join(' ')) && /Mother Earth uses a clear-sky confidence threshold of 0\.95 for this comparison, on both nights; not a NASA standard\./.test(NL.THRESH_TEXT));

console.log(`\nnight-lights logic${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
