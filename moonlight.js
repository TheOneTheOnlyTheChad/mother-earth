/* Moon sunlight arithmetic (moon.html; used by moonglobe.js and, unchanged, by phase1/moon-light.test.mjs under Node).
 * Reads the pinned table assets/moon/moon-light-2026-06-R1.json (phase1/skycraft/build_moonlight.py): sub-solar and sub-Earth points
 * every 6 hours in MOON_ME_DE440_ME421, and gives both directions for any covered instant by spherical interpolation of unit vectors.
 * No DOM, no clock, no network: the caller supplies the bytes and the time. (MOON-LIT-AS-NOW-PROPOSAL rev 2.1) */
(function (root) {
  'use strict';
  var D = Math.PI / 180;
  var T = { url: 'assets/moon/moon-light-2026-06-R1.json?v=1', rev: 'moon-light-2026-06-R1', frame: 'MOON_ME_DE440_ME421',
    sha: 'a78c2f4b10e3d9fa27153401531852f4eb53117562703d10243d7cf1f253b462',
    start: Date.UTC(2026, 5, 1), end: Date.UTC(2028, 0, 1), step: 21600000, n: 2317 };
  var EDGE_DEG = 1, FLOOR = 0.12;   // half-width of the day–night transition; night-side brightness as a share of the day side (a display aid)
  var num = function (v) { return typeof v === 'number' && isFinite(v); };
  var vec = function (lat, lng) { var a = lat * D, o = lng * D; return [Math.cos(a) * Math.cos(o), Math.cos(a) * Math.sin(o), Math.sin(a)]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  var ll = function (u) { return { lat: Math.atan2(u[2], Math.hypot(u[0], u[1])) / D, lng: Math.atan2(u[1], u[0]) / D }; };
  function slerp(a, b, f) {
    var c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    var w = Math.atan2(Math.hypot(c[0], c[1], c[2]), dot(a, b)), ka = 1 - f, kb = f;
    if (w > 1e-12) { var s = Math.sin(w); ka = Math.sin((1 - f) * w) / s; kb = Math.sin(f * w) / s; }
    var v = [ka * a[0] + kb * b[0], ka * a[1] + kb * b[1], ka * a[2] + kb * b[2]], n = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / n, v[1] / n, v[2] / n];
  }
  /** Parsed table → { sun: [unit vectors], earth: [unit vectors] }, or a string saying why it cannot be used. */
  function read(j) {
    var t = j && j.time || {}, ok = function (a) { return Array.isArray(a) && a.length === 2 * T.n && a.every(num); };
    if (!j || j.schema !== 1 || j.catalogue_revision !== T.rev || !j.frame || j.frame.name !== T.frame || t.n !== T.n || t.step_s !== T.step / 1000
      || t.start !== '2026-06-01T00:00:00Z' || t.end !== '2028-01-01T00:00:00Z' || !ok(j.sun_lon_lat_deg) || !ok(j.earth_lon_lat_deg)) return 'the file is not in the expected form';
    var out = { sun: [], earth: [] };
    for (var i = 0; i < T.n; i++) {
      var s = [j.sun_lon_lat_deg[2 * i], j.sun_lon_lat_deg[2 * i + 1]], e = [j.earth_lon_lat_deg[2 * i], j.earth_lon_lat_deg[2 * i + 1]];
      if (Math.abs(s[1]) > 90 || Math.abs(e[1]) > 90 || Math.abs(s[0]) > 180 || Math.abs(e[0]) > 180) return 'the file holds a value out of range';
      out.sun.push(vec(s[1], s[0])); out.earth.push(vec(e[1], e[0]));
    }
    return out;
  }
  var covered = function (ms) { return num(ms) && ms >= T.start && ms <= T.end; };
  /** Directions at an instant (UTC milliseconds), or null when the instant is not a number or is outside the table. */
  function at(tab, ms) {
    if (!tab || !covered(ms)) return null;
    var x = (ms - T.start) / T.step, i = Math.min(T.n - 2, Math.floor(x)), f = x - i;
    var sun = slerp(tab.sun[i], tab.sun[i + 1], f), earth = slerp(tab.earth[i], tab.earth[i + 1], f);
    if (![].concat(sun, earth).every(num)) return null;
    return { ms: ms, sun: sun, earth: earth, sunLL: ll(sun), earthLL: ll(earth), lit: (1 + dot(sun, earth)) / 2 };
  }
  /** Day share at a Sun elevation in degrees: 0 night, 1 day, linear across ±EDGE_DEG, one half exactly on the calculated line. */
  var mask = function (elevDeg) { return Math.max(0, Math.min(1, (elevDeg + EDGE_DEG) / (2 * EDGE_DEG))); };
  var elevation = function (lat, lng, sun) { return Math.asin(Math.max(-1, Math.min(1, dot(vec(lat, lng), sun)))) / D; };
  var api = { T: T, EDGE_DEG: EDGE_DEG, FLOOR: FLOOR, read: read, at: at, covered: covered, mask: mask, elevation: elevation,
    maskAt: function (lat, lng, sun) { return mask(elevation(lat, lng, sun)); }, vec: vec, ll: ll, slerp: slerp,
    minute: function (ms) { return Math.floor(ms / 60000) * 60000; } };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MoonLight = api;
})(typeof self !== 'undefined' ? self : this);
