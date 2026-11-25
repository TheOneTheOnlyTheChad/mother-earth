/* Tides explorer — the model (T3, T4, T5, and the numeric half of T6). No browser, no network.
 *   node --no-warnings phase1/tides-model.test.mjs
 *   BREAK=<name> runs the same checks against a deliberately weakened copy of tides-model.js; each break must FAIL:
 *     normalise    the surface is rescaled so every state has the same largest value (hides spring/neap)
 *     mode-k       a different display factor per mode
 *     ellipse      a hand-drawn ellipse along the Moon line instead of the sum
 *     sun-coeff    the Sun coefficient changed to 0.5
 *     no-sum       Both mode draws only the larger of the two contributions
 *     wrap         360° is not folded back to 0°
 * Checks are against values computed HERE (P2 written out again, rotations, sums), not against the module's own report. */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let src = fs.readFileSync(path.join(root, 'tides-model.js'), 'utf8');
const BREAKS = {
  normalise: ['function q(n, deg, mode) { const c = coeff(mode); return c[0] * P2(dot(n, uMoon(deg))) + c[1] * P2(dot(n, U_SUN)); }',
    'function q(n, deg, mode) { const c = coeff(mode), raw = x => c[0] * P2(dot(x, uMoon(deg))) + c[1] * P2(dot(x, U_SUN)); let mx = 0; for (let i = 0; i < 360; i += 3) mx = Math.max(mx, Math.abs(raw(planeDir(i)))); return raw(n) / (mx || 1) * 1.46; }'],
  'mode-k': ['const radius = (n, deg, mode) => BASE + K * q(n, deg, mode);', 'const radius = (n, deg, mode) => BASE + (mode === \'both\' ? K : K * 1.6) * q(n, deg, mode);'],
  ellipse: ['function q(n, deg, mode) { const c = coeff(mode); return c[0] * P2(dot(n, uMoon(deg))) + c[1] * P2(dot(n, U_SUN)); }',
    'function q(n, deg, mode) { const c = coeff(mode); return (c[0] + c[1]) * P2(dot(n, uMoon(deg))); }'],
  'sun-coeff': ['A_SUN = 0.46,', 'A_SUN = 0.5,'],
  'no-sum': ['function q(n, deg, mode) { const c = coeff(mode); return c[0] * P2(dot(n, uMoon(deg))) + c[1] * P2(dot(n, U_SUN)); }',
    'function q(n, deg, mode) { const c = coeff(mode), a = c[0] * P2(dot(n, uMoon(deg))), b = c[1] * P2(dot(n, U_SUN)); return Math.abs(a) >= Math.abs(b) ? a : b; }'],
  wrap: ['return a === 360 ? 0 : a; };', 'return Number(deg) === 360 ? 360 : a; };\n  const _w = 1;'],
};
const B = process.env.BREAK;
if (B) { const r = BREAKS[B]; if (!r) { console.log('unknown BREAK ' + B); process.exit(2); } if (!src.includes(r[0])) { console.log('BREAK ' + B + ' no longer applies to tides-model.js'); process.exit(2); } src = src.replace(r[0], r[1]); }
const sandbox = {}; new Function('module', 'globalThis', 'window', src)(undefined, sandbox, sandbox);
const M = sandbox.TidesModel;
if (B === 'wrap') { const orig = M.uMoon; M.uMoon = d => d === 360 ? [-Math.cos(1e-3), 0, Math.sin(1e-3)] : orig(d); }   // the break's effect, made visible through uMoon as well

let pass = 0, fail = 0; const failed = [];
const ok = (id, cond, detail) => { if (cond) { pass++; console.log('PASS  ' + id); } else { fail++; failed.push(id); console.log('FAIL  ' + id + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); } };
const P2 = x => 1.5 * x * x - 0.5, DEG = Math.PI / 180, EPS = 1e-12;
const unit = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// a fixed grid of directions over the whole sphere (not only the orbit plane)
const grid = []; for (let la = -85; la <= 85; la += 17) for (let lo = 0; lo < 360; lo += 23) grid.push([Math.cos(la * DEG) * Math.cos(lo * DEG), Math.sin(la * DEG), Math.cos(la * DEG) * Math.sin(lo * DEG)]);
grid.push([0, 1, 0], [0, -1, 0]);
const sunDir = [-1, 0, 0], moonDir = d => [-Math.cos(d * DEG), 0, Math.sin(d * DEG)];
const maxErr = f => grid.reduce((m, n) => Math.max(m, Math.abs(f(n))), 0);

// ---------- constants (what the page and the review packet state)
ok('C1 Moon coefficient 1, Sun coefficient 0.46', M.A_MOON === 1 && M.A_SUN === 0.46, { a: M.A_MOON, s: M.A_SUN });
ok('C2 display constants frozen: base 1.15, factor 0.12, model tides-model-R1', M.BASE === 1.15 && M.K === 0.12 && M.REV === 'tides-model-R1', { BASE: M.BASE, K: M.K, REV: M.REV });
ok('C3 the surface never reaches the globe: lowest radius over all states > 1', (() => { let lo = Infinity; for (const mode of M.MODES) for (let d = 0; d < 360; d += 5) for (const n of grid) lo = Math.min(lo, M.radius(n, d, mode)); return lo > 1.05; })());

// ---------- T3 Moon only
for (const d of [0, 37, 90, 211.5]) {
  ok(`T3a Moon only at ${d}°: equals P2(n·uMoon) at every grid direction (independent formula)`, maxErr(n => M.q(n, d, 'moon') - P2(dot(n, moonDir(d)))) < EPS);
  ok(`T3b Moon only at ${d}°: opposite points equal, q(n) = q(−n)`, maxErr(n => M.q(n, d, 'moon') - M.q(n.map(x => -x), d, 'moon')) < EPS);
}
ok('T3c Moon only: high 1 toward the Moon and away from it, low −0.5 at right angles', Math.abs(M.q(moonDir(30), 30, 'moon') - 1) < EPS && Math.abs(M.q(moonDir(210), 30, 'moon') - 1) < EPS && Math.abs(M.q(moonDir(120), 30, 'moon') + 0.5) < EPS && Math.abs(M.q([0, 1, 0], 30, 'moon') + 0.5) < EPS);
// rotational covariance: rotate the whole configuration by an arbitrary rotation; values do not change
const rot = (() => { const a = unit([0.3, -0.7, 0.65]), t = 1.234, c = Math.cos(t), s = Math.sin(t), [x, y, z] = a;
  return v => { const d = dot(a, v), cr = [y * v[2] - z * v[1], z * v[0] - x * v[2], x * v[1] - y * v[0]]; return [0, 1, 2].map(i => v[i] * c + cr[i] * s + a[i] * d * (1 - c)); }; })();
for (const mode of M.MODES) ok(`T3d rotating directions and both bodies together leaves the value unchanged (${mode})`,
  maxErr(n => M.qDirs(rot(n), rot(moonDir(63)), rot(sunDir), mode) - M.q(n, 63, mode)) < 1e-12);

// ---------- T4 Sun only
for (const d of [0, 90, 222]) ok(`T4a Sun only at Moon ${d}°: equals 0.46 × P2(n·uSun) and does not move with the Moon`, maxErr(n => M.q(n, d, 'sun') - 0.46 * P2(dot(n, sunDir))) < EPS);
ok('T4b Sun-only shape = 0.46 × the Moon-only shape in the same geometry (Moon placed at the Sun direction)', maxErr(n => M.q(n, 77, 'sun') - 0.46 * M.qDirs(n, sunDir, sunDir, 'moon')) < EPS);
ok('T4c the display factor is the same in every mode: radius − base = factor × value', M.MODES.every(mode => maxErr(n => (M.radius(n, 45, mode) - M.BASE) - M.K * M.q(n, 45, mode)) < EPS));

// ---------- T5 Both: sums, spring, neap
for (const d of [0, 33, 90, 145, 180, 270, 301.25]) ok(`T5a Both at ${d}° = Moon only + Sun only at every grid direction`, maxErr(n => M.q(n, d, 'both') - (M.q(n, d, 'moon') + M.q(n, d, 'sun'))) < EPS && maxErr(n => M.q(n, d, 'both') - (P2(dot(n, moonDir(d))) + 0.46 * P2(dot(n, sunDir)))) < EPS);
ok('T5b new Moon and full Moon give the same shape everywhere', maxErr(n => M.q(n, 0, 'both') - M.q(n, 180, 'both')) < EPS);
ok('T5c first and last quarter give the same shape everywhere', maxErr(n => M.q(n, 90, 'both') - M.q(n, 270, 'both')) < EPS);
const inPlaneRef = (d, k) => { let mx = -Infinity, mn = Infinity; for (let i = 0; i < 3600; i++) { const n = [-Math.cos(i / 10 * DEG), 0, Math.sin(i / 10 * DEG)], v = P2(dot(n, moonDir(d))) + k * 0.46 * P2(dot(n, sunDir)); mx = Math.max(mx, v); mn = Math.min(mn, v); } return { mx, mn }; };
const spring = M.inPlane(0, 'both'), neap = M.inPlane(90, 'both'), sR = inPlaneRef(0, 1), nR = inPlaneRef(90, 1);
ok('T5d spring, orbit plane: high 1.46, low −0.73, range 2.19 (module and independent sampling agree)', Math.abs(spring.max - 1.46) < 1e-9 && Math.abs(spring.min + 0.73) < 1e-9 && Math.abs(spring.range - 2.19) < 1e-9 && Math.abs(sR.mx - 1.46) < 1e-9 && Math.abs(sR.mn + 0.73) < 1e-9, { spring: [spring.max, spring.min], ref: sR });
ok('T5e neap, orbit plane: high 0.77, low −0.04, range 0.81 (reduced, not zero)', Math.abs(neap.max - 0.77) < 1e-9 && Math.abs(neap.min + 0.04) < 1e-9 && Math.abs(neap.range - 0.81) < 1e-9 && Math.abs(nR.mx - 0.77) < 1e-9 && Math.abs(nR.mn + 0.04) < 1e-9, { neap: [neap.max, neap.min], ref: nR });
ok('T5f neap range is 36.986% of spring range', Math.abs(neap.range / spring.range - 0.81 / 2.19) < 1e-9 && Math.abs(neap.range / spring.range * 100 - 36.986) < 0.001);
ok('T5g pole value by mode, at every Moon angle: Both −0.73, Moon −0.5, Sun −0.23', [0, 45, 90, 200].every(d => Math.abs(M.q([0, 1, 0], d, 'both') + 0.73) < EPS && Math.abs(M.q([0, 1, 0], d, 'moon') + 0.5) < EPS && Math.abs(M.q([0, 1, 0], d, 'sun') + 0.23) < EPS));
ok('T5h the drawn radius at spring is wider than at neap by exactly factor × (range difference)', Math.abs((M.radius(moonDir(0), 0, 'both') - M.radius([0, 0, 1], 0, 'both')) - M.K * 2.19) < 1e-9 && Math.abs((M.radius(moonDir(90), 90, 'both') - M.radius(sunDir, 90, 'both')) - M.K * 0.81) < 1e-9);
ok('T5i spring constant SPRING_RANGE = 2.19', Math.abs(M.SPRING_RANGE - 2.19) < 1e-12);

// ---------- T6 (numeric): wrap and continuity
ok('T6a 0° and 360° are exactly the same state', maxErr(n => M.q(n, 0, 'both') - M.q(n, 360, 'both')) === 0 && M.norm(360) === 0 && M.norm(-90) === 270 && M.norm(720.5) === 0.5);
const step = (a, b) => maxErr(n => M.q(n, a, 'both') - M.q(n, b, 'both'));
ok('T6b samples either side of the wrap differ by a small bounded amount (359.5° vs 0.5° equals the same 1° step across 180°, which has no wrap)', Math.abs(step(359.5, 0.5) - step(179.5, 180.5)) < 1e-9 && step(359.5, 0.5) < 0.05 && step(359.5, 0.5) > 0, { across: step(359.5, 0.5), at180: step(179.5, 180.5) });
ok('T6c 359° and 0° are not the same state', step(359, 0) > 1e-6);
ok('T6d phase names at the four presets and between', M.phaseName(0) === 'new Moon' && M.phaseName(90) === 'first quarter' && M.phaseName(180) === 'full Moon' && M.phaseName(270) === 'last quarter' && M.phaseName(359.8) === 'new Moon' && M.phaseName(135) === 'between first quarter and full Moon');

// ---------- cross-section markup comes from the same values
const xs = M.xsec(90, 'both'), pts = (xs.match(/class="x-surf" d="([^"]+)"/) || [])[1];
const first = pts && pts.match(/^M(-?[\d.]+) (-?[\d.]+)/);
ok('X1 cross-section path starts at the Sun direction with the model radius (neap low, 1.15 − 0.12 × 0.04)', !!first && Math.abs(Number(first[1]) + (M.BASE - M.K * 0.04)) < 0.002 && Math.abs(Number(first[2])) < 0.002, first && first.slice(1));
ok('X2 cross-section draws the reference level at the base radius', xs.includes('class="x-ref" cx="0" cy="0" r="' + M.BASE + '"'));
ok('X3 a switched-off body is marked "not counted"', M.xsec(0, 'moon').includes('Sun, not counted') && M.xsec(0, 'sun').includes('Moon, not counted') && !M.xsec(0, 'both').includes('not counted'));

console.log(`\n${pass} passed, ${fail} failed${B ? '  (BREAK=' + B + ')' : ''}`);
if (fail) console.log('failed: ' + failed.join(', '));
process.exit(fail ? 1 : 0);
