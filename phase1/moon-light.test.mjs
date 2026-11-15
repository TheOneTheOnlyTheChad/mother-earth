/* "Lit as now" arithmetic — the page's own moonlight.js against SPICE (MOON-LIT-AS-NOW-PROPOSAL rev 2.1 §3, §10).
 *  A. the shipped table: pinned hash, shape, coverage
 *  B. interpolation: every sample and the midpoint of every six-hour interval, unit-vector angle against SPICE truth, limit 0.01°
 *  C. lit fraction, the mask (0.5 on the line, edges at ±1°, probes at ±0.5°, ±1°, ±2°), coverage edges, bad inputs
 * Run: node phase1/moon-light.test.mjs      BREAK=lerpll|nearest|edge2|offcentre|sha|openend must each fail. */
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import vm from 'vm'; import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), BREAK = process.env.BREAK || '';
const BREAKS = {
  lerpll: ["var sun = slerp(tab.sun[i], tab.sun[i + 1], f), earth = slerp(tab.earth[i], tab.earth[i + 1], f);", "var L = function (a, b) { var p = ll(a), q = ll(b); return vec(p.lat + (q.lat - p.lat) * f, p.lng + (q.lng - p.lng) * f); }; var sun = L(tab.sun[i], tab.sun[i + 1]), earth = L(tab.earth[i], tab.earth[i + 1]);"],
  nearest: ["f = x - i;", "f = Math.round(x - i);"],
  edge2: ["var EDGE_DEG = 1,", "var EDGE_DEG = 2,"],
  offcentre: ["(elevDeg + EDGE_DEG) / (2 * EDGE_DEG)", "(elevDeg + EDGE_DEG + 0.3) / (2 * EDGE_DEG)"],
  sha: ["sha: 'a78c2f4b", "sha: 'b78c2f4b"],
  openend: ["ms >= T.start && ms <= T.end", "ms >= T.start"],
};
let src = fs.readFileSync(path.join(ROOT, 'moonlight.js'), 'utf8');
if (BREAK) { const b = BREAKS[BREAK]; if (!b || !src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); }
const mod = { exports: {} }; vm.runInNewContext(src, { module: mod, Math, Date, Array, isFinite }); const ML = mod.exports;
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 300) : ''}`); } };
const D = Math.PI / 180, ang = (a, b) => { const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; return Math.atan2(Math.hypot(...c), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / D; };
const bytes = fs.readFileSync(path.join(ROOT, 'assets/moon/moon-light-2026-06-R1.json')), cat = JSON.parse(bytes);
const truth = JSON.parse(fs.readFileSync(path.join(ROOT, 'phase1/skycraft/checks/moonlight-truth.json')));
const sha = crypto.createHash('sha256').update(bytes).digest('hex');
// A
ok('A1 the shipped table has the hash the page pins', sha === ML.T.sha, sha);
ok('A2 the truth file was made for this table', truth.catalogue_sha256 === sha && truth.n === ML.T.n);
const tab = ML.read(cat);
ok('A3 the table reads', typeof tab === 'object' && tab.sun.length === 2317 && tab.earth.length === 2317, tab);
ok('A4 grid: 6 h from 1 Jun 2026 to 1 Jan 2028 UTC', ML.T.start + (ML.T.n - 1) * ML.T.step === ML.T.end && ML.T.step === 6 * 3600e3);
for (const [n, f] of [['revision', j => { j.catalogue_revision = 'x'; }], ['frame', j => { j.frame.name = 'IAU_MOON'; }], ['short', j => { j.sun_lon_lat_deg.pop(); }], ['NaN', j => { j.earth_lon_lat_deg[5] = null; }], ['range', j => { j.sun_lon_lat_deg[1] = 91; }], ['step', j => { j.time.step_s = 3600; }]]) {
  const j = JSON.parse(bytes); f(j); ok('A5 a wrong table is refused: ' + n, typeof ML.read(j) === 'string'); }
// B
const V = (a, i) => ML.vec(a[2 * i + 1], a[2 * i]); let ws = 0, we = 0, wms = 0, wme = 0, wl = 0;
for (let i = 0; i < ML.T.n; i++) { const r = ML.at(tab, ML.T.start + i * ML.T.step); ws = Math.max(ws, ang(r.sun, V(truth.samples.sun, i))); we = Math.max(we, ang(r.earth, V(truth.samples.earth, i))); }
for (let i = 0; i < ML.T.n - 1; i++) { const r = ML.at(tab, ML.T.start + (i + .5) * ML.T.step), s = V(truth.midpoints.sun, i), e = V(truth.midpoints.earth, i);
  wms = Math.max(wms, ang(r.sun, s)); wme = Math.max(wme, ang(r.earth, e)); wl = Math.max(wl, Math.abs(r.lit - (1 + s[0] * e[0] + s[1] * e[1] + s[2] * e[2]) / 2)); }
ok('B1 samples: Sun within 0.0001° of SPICE after rounding', ws <= 1e-4, ws); ok('B2 samples: Earth within 0.0001°', we <= 1e-4, we);
ok('B3 every midpoint: Sun within 0.01°', wms <= 0.01, wms); ok('B4 every midpoint: Earth within 0.01°', wme <= 0.01, wme);
ok('B5 the interpolation is doing work (midpoint error is not zero, and far below a 6-hour step of about 3°)', wms > 1e-6 && wms < 0.002, wms);
ok('B6 lit fraction at midpoints within 0.01 percentage points', wl * 100 <= 0.01, wl * 100);
console.log(`      measured: samples Sun ${ws.toExponential(2)}° Earth ${we.toExponential(2)}° · midpoints Sun ${wms.toFixed(5)}° Earth ${wme.toFixed(5)}° · lit ${(wl * 100).toFixed(4)} pp`);
// C
ok('C1 coverage: first and last instants are in, a millisecond outside is out', !!ML.at(tab, ML.T.start) && !!ML.at(tab, ML.T.end) && ML.at(tab, ML.T.start - 1) === null && ML.at(tab, ML.T.end + 1) === null);
ok('C2 no time, no answer', [NaN, undefined, null, Infinity, '2026'].every(v => ML.at(tab, v) === null) && ML.at(null, ML.T.start) === null);
const r = ML.at(tab, Date.UTC(2026, 10, 15, 3, 20));
ok('C3 the result is two unit vectors and a fraction', Math.abs(Math.hypot(...r.sun) - 1) < 1e-12 && Math.abs(Math.hypot(...r.earth) - 1) < 1e-12 && r.lit > 0 && r.lit < 1, r);
ok('C4 longitude and latitude agree with the vectors', ang(ML.vec(r.sunLL.lat, r.sunLL.lng), r.sun) < 1e-9 && ang(ML.vec(r.earthLL.lat, r.earthLL.lng), r.earth) < 1e-9);
const m = ML.mask;
ok('C5 mask: one half exactly on the calculated line', m(0) === 0.5);
ok('C6 mask: full day at +1° and beyond, night at −1° and beyond', m(1) === 1 && m(2) === 1 && m(90) === 1 && m(-1) === 0 && m(-2) === 0 && m(-90) === 0);
ok('C7 mask: ±0.5° sit a quarter of the way in from each edge', Math.abs(m(0.5) - 0.75) < 1e-12 && Math.abs(m(-0.5) - 0.25) < 1e-12);
ok('C8 mask: the edges are at ±1° (just inside is not yet full)', m(0.99) < 1 && m(-0.99) > 0 && ML.EDGE_DEG === 1);
ok('C9 mask at a place: sub-solar point is day, its antipode night, a point 90° away one half', ML.maskAt(r.sunLL.lat, r.sunLL.lng, r.sun) === 1 && ML.maskAt(-r.sunLL.lat, r.sunLL.lng + 180, r.sun) === 0 && Math.abs(ML.maskAt(r.sunLL.lat + 90, r.sunLL.lng, r.sun) - .5) < 1e-6);
ok('C10 minute boundary', ML.minute(Date.UTC(2026, 10, 15, 3, 20, 59, 999)) === Date.UTC(2026, 10, 15, 3, 20));
ok('C11 the night floor is a small positive share', ML.FLOOR > 0 && ML.FLOOR <= 0.2);
console.log(`moon-light${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
