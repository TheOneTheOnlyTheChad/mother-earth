/* Mother Earth — Tides explorer: the calculation, and nothing else (TIDES-EXPLORER-PROPOSAL rev 2; Chad's go, 25 Nov 2026).
 * Runs in the page (window.TidesModel) and under Node (module.exports), so the function the tests check is the function drawn.
 *
 * MODEL (tides-model-R1). A static, leading-order equilibrium tide on an idealised all-ocean Earth:
 *     q(n) = aMoon · P2(n · uMoon) + aSun · P2(n · uSun),      P2(x) = (3x² − 1) / 2
 *   n = unit direction from Earth's centre; uMoon, uSun = unit directions to the Moon and the Sun.
 *   aMoon = 1; aSun = 0.46 (the Sun's share at representative mean distances; Stewart §17.4 gives 0.46051). A body that is
 *   switched off has coefficient 0. The two terms are ADDED before anything is drawn.
 *   q is dimensionless. It is a relative shape, not a height in metres and not a prediction for any place.
 * FRAME. Right-handed, y = north = the normal of the Moon's orbit; Earth's equator lies in the orbit plane (a stated simplification).
 *   The Sun direction is fixed: uSun = (−1, 0, 0). The Moon angle is measured from the Sun direction, counter-clockwise seen
 *   from north: uMoon(θ) = (−cos θ, 0, sin θ). 0° new Moon, 90° first quarter, 180° full Moon, 270° last quarter.
 *   Seen from north with +x to the right, +z is DOWN the screen, so first quarter is drawn below Earth.
 * DISPLAY. Model surface radius = BASE + K · q Earth radii. BASE and K are constants: the same for every angle and every mode.
 *   BASE 1.15 and K 0.12 were set once in the first preview (proposal rev 2 had 1.12 and 0.08, provisional) and are frozen.
 *   With q between −0.73 and 1.46 the surface stays between 1.062 and 1.325 Earth radii: always outside the globe, so the low
 *   parts stay visible. BASE is the q = 0 reference level; "low" means below that reference, not below the ground.
 * NOT IN THE MODEL: real coasts and depth, lag, friction, basins, declination, changing distances, the solid Earth's own
 *   response, the ocean's own gravity. No clock, no date, no place. */
(function (root) {
  'use strict';
  const REV = 'tides-model-R1', A_MOON = 1, A_SUN = 0.46, BASE = 1.15, K = 0.12, DEG = Math.PI / 180;
  const MODES = ['both', 'moon', 'sun'], U_SUN = [-1, 0, 0];
  const P2 = x => (3 * x * x - 1) / 2;
  /** Angle folded into [0, 360). 360 is exactly 0. */
  const norm = deg => { const a = ((Number(deg) % 360) + 360) % 360; return a === 360 ? 0 : a; };
  /** Unit direction in the orbit plane at `deg` from the Sun direction, counter-clockwise seen from north. Exact at the quarter turns. */
  const planeDir = deg => {
    const a = norm(deg);
    if (a === 0) return [-1, 0, 0]; if (a === 90) return [0, 0, 1]; if (a === 180) return [1, 0, 0]; if (a === 270) return [0, 0, -1];
    return [-Math.cos(a * DEG), 0, Math.sin(a * DEG)];
  };
  const uMoon = planeDir;
  const coeff = mode => mode === 'moon' ? [A_MOON, 0] : mode === 'sun' ? [0, A_SUN] : [A_MOON, A_SUN];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  /** The model value in direction n (unit vector) for a Moon angle and a mode. */
  function q(n, deg, mode) { const c = coeff(mode); return c[0] * P2(dot(n, uMoon(deg))) + c[1] * P2(dot(n, U_SUN)); }
  /** The same with explicit unit directions to the two bodies (used by the rotation checks). */
  function qDirs(n, um, us, mode) { const c = coeff(mode); return c[0] * P2(dot(n, um)) + c[1] * P2(dot(n, us)); }
  /** Drawn radius of the model surface in Earth radii. */
  const radius = (n, deg, mode) => BASE + K * q(n, deg, mode);
  /** Values round the orbit plane: { max, min, range, at: [deg of max, deg of min], values } sampled every 360/steps degrees. */
  function inPlane(deg, mode, steps) {
    const N = steps || 720, v = new Array(N); let max = -Infinity, min = Infinity, iMax = 0, iMin = 0;
    for (let i = 0; i < N; i++) { const x = q(planeDir(i * 360 / N), deg, mode); v[i] = x; if (x > max) { max = x; iMax = i; } if (x < min) { min = x; iMin = i; } }
    return { max, min, range: max - min, at: [iMax * 360 / N, iMin * 360 / N], values: v };
  }
  /** The largest in-plane range the model can show: Both, Moon and Sun in line. */
  const SPRING_RANGE = 1.5 * (A_MOON + A_SUN);
  const PRESETS = [[0, 'new Moon'], [90, 'first quarter'], [180, 'full Moon'], [270, 'last quarter']];
  /** Words for a Moon angle: the preset's name within half a degree, otherwise the two it lies between. */
  function phaseName(deg) {
    const a = norm(deg);
    for (const [d, name] of PRESETS) { const off = Math.min(Math.abs(a - d), 360 - Math.abs(a - d)); if (off <= 0.5) return name; }
    const i = Math.floor(a / 90) % 4, j = (i + 1) % 4;
    return 'between ' + PRESETS[i][1] + ' and ' + PRESETS[j][1];
  }

  /** The orbit-plane cross-section as SVG markup (the inner content of an <svg viewBox="-3.25 -2.05 5.3 4.1">).
   *  One generator for the page, the no-WebGL view and the pre-rendered default, so they cannot differ. Sun to the left. */
  function xsec(deg, mode) {
    const f = x => (Math.round(x * 1000) / 1000).toString(), N = 360, a = norm(deg), c = coeff(mode);
    let d = '';
    for (let i = 0; i < N; i++) { const n = planeDir(i), r = radius(n, a, mode); d += (i ? 'L' : 'M') + f(n[0] * r) + ' ' + f(n[2] * r); }
    d += 'Z';
    const m = uMoon(a), MR = 1.72, mx = m[0] * MR, my = m[2] * MR, moonOn = c[0] > 0, sunOn = c[1] > 0;
    return '' +
      '<circle class="x-orbit" cx="0" cy="0" r="' + MR + '"/>' +
      '<path class="x-water" fill-rule="evenodd" d="' + d + 'M1 0A1 1 0 1 0 -1 0A1 1 0 1 0 1 0Z"/>' +
      '<circle class="x-earth" cx="0" cy="0" r="1"/>' +
      '<circle class="x-ref" cx="0" cy="0" r="' + BASE + '"/>' +
      '<path class="x-surf" d="' + d + '"/>' +
      '<text class="x-lbl" x="0" y="0.06" text-anchor="middle">Earth</text>' +
      '<g class="x-sun' + (sunOn ? '' : ' off') + '"><circle cx="-2.75" cy="0" r="0.42"/>' +
      '<text class="x-lbl" x="-2.75" y="-0.55" text-anchor="middle">' + (sunOn ? 'Sun' : 'Sun, not counted') + '</text></g>' +
      '<g class="x-moon' + (moonOn ? '' : ' off') + '"><circle cx="' + f(mx) + '" cy="' + f(my) + '" r="0.13"/>' +
      '<text class="x-lbl" x="' + f(mx + (mx > 1.1 ? -0.2 : 0.2)) + '" y="' + f(my + (my > 0 ? 0.34 : -0.22)) + '" text-anchor="' + (mx > 1.1 ? 'end' : 'start') + '">' + (moonOn ? 'Moon' : 'Moon, not counted') + '</text></g>';
  }

  const api = { REV, A_MOON, A_SUN, BASE, K, MODES, U_SUN, SPRING_RANGE, PRESETS, P2, norm, planeDir, uMoon, coeff, q, qDirs, radius, inPlane, phaseName, xsec };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TidesModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
