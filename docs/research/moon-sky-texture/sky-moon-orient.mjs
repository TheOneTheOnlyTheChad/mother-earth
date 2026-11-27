/* Moon item 10a assessment (docs only): can the Sky zoom-out Moon be ORIENTED from files the site already serves?
 * Method under test (two-vector / TRIAD): at each daily 00:00 UTC sample of the Sky scene file,
 *   in the scene's Earth-fixed frame: e_S = Moon→Earth (from the scene's sub-lunar point and range),
 *                                     s_S = Moon→Sun   (scene's sub-solar point and true Sun range, minus the Moon's position);
 *   in the Moon-fixed frame (moon-light-2026-06-R1, MOON_ME): e_M = sub-Earth point, s_M = sub-solar point (exact 6-h samples).
 *   R maps Moon-fixed → scene so that e_M → e_S exactly and s_M → the plane of (e_S, s_S).
 * Independent reference (not from either file): astronomy-engine — IAU Moon rotation axis and spin (RotationAxis), EQJ→EQD,
 *   apparent sidereal time; Earth-fixed axes as the Sky test uses them. Reported: the angle of R·Rref⁻¹ per date, the phase angle,
 *   and the consistency of the two files (angle(e_S,s_S) vs angle(e_M,s_M)).
 * Run: node sky-moon-orient.mjs <repo>
 */
import fs from 'fs'; import path from 'path';
const A = await import('/home/claude/spike/node_modules/astronomy-engine/esm/astronomy.js');
const REPO = process.argv[2];
const SC = JSON.parse(fs.readFileSync(path.join(REPO, 'phase1/sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8'));
const ML = JSON.parse(fs.readFileSync(path.join(REPO, 'assets/moon/moon-light-2026-06-R1.json'), 'utf8'));
const D = Math.PI / 180;
const vec = (lat, lng) => [Math.cos(lat * D) * Math.cos(lng * D), Math.cos(lat * D) * Math.sin(lng * D), Math.sin(lat * D)];
const sub = (a, b) => a.map((v, i) => v - b[i]), mul = (a, k) => a.map(v => v * k), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(...a)), ang = (a, b) => Math.atan2(Math.hypot(...cross(a, b)), dot(a, b)) / D;
const triad = (p, q) => { const t1 = norm(p), t2 = norm(cross(p, q)), t3 = cross(t1, t2); return [t1, t2, t3]; };   // rows
const T = M => M[0].map((_, j) => M.map(r => r[j]));
const mm = (X, Y) => X.map(r => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
const mv = (M, v) => M.map(r => dot(r, v));
const rotAngle = M => Math.acos(Math.max(-1, Math.min(1, (M[0][0] + M[1][1] + M[2][2] - 1) / 2))) / D;
const Rz = t => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
const Rx = t => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
const t0 = Date.parse(ML.time.start), step = ML.time.step_s * 1000;
const rows = [];
const sunRows = new Map(SC.bodies.sun.rows.map(r => [r[0], r]));
for (const m of SC.bodies.moon.rows) {
  const date = m[0], s = sunRows.get(date), ms = Date.parse(date + 'T00:00:00Z'), i = (ms - t0) / step;
  if (!Number.isInteger(i)) throw new Error('not an exact sample: ' + date);
  const moonP = mul(vec(m[1], m[2]), m[3]), sunP = mul(vec(s[1], s[2]), s[3]);
  const eS = norm(mul(moonP, -1)), sS = norm(sub(sunP, moonP));
  const eM = vec(ML.earth_lon_lat_deg[2 * i + 1], ML.earth_lon_lat_deg[2 * i]), sM = vec(ML.sun_lon_lat_deg[2 * i + 1], ML.sun_lon_lat_deg[2 * i]);
  // R (Moon-fixed → scene) = Ts^T · Tm, with Tm, Ts the TRIAD row bases
  const R = mm(T(triad(eS, sS)), triad(eM, sM));
  // reference: Moon-fixed → EQJ (IAU axis + spin) → EQD → Earth-fixed (apparent sidereal time; no polar motion)
  const t = A.MakeTime(new Date(ms)), ax = A.RotationAxis(A.Body.Moon, t);
  const M2J = mm(mm(Rz((90 + ax.ra * 15) * D), Rx((90 - ax.dec) * D)), Rz(ax.spin * D));
  const J2D = A.Rotation_EQJ_EQD(t).rot;   // astronomy-engine stores rot[i][j] as column-major (v' = rot^T v)
  const J2Dm = T(J2D);
  const D2F = Rz(-A.SiderealTime(t) * 15 * D);
  const Rref = mm(D2F, mm(J2Dm, M2J));
  rows.push({ date, phase: +ang(eS, sS).toFixed(3), err_deg: +rotAngle(mm(R, T(Rref))).toFixed(4),
    files_consistency_deg: +(ang(eS, sS) - ang(eM, sM)).toFixed(4),
    subEarth_ref_vs_table_deg: +ang(mv(T(Rref), eS), eM).toFixed(4) });
}
const by = k => rows.map(r => r[k]).sort((a, b) => a - b), q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const err = by('err_deg'), cons = rows.map(r => Math.abs(r.files_consistency_deg)).sort((a, b) => a - b), se = by('subEarth_ref_vs_table_deg');
const worst = [...rows].sort((a, b) => b.err_deg - a.err_deg).slice(0, 6);
const small = rows.filter(r => r.phase < 10 || r.phase > 170);
const summary = { samples: rows.length, err_deg: { median: q(err, .5), p95: q(err, .95), max: err.at(-1) },
  files_consistency_abs_deg: { median: q(cons, .5), max: cons.at(-1) },
  subEarth_ref_vs_table_deg: { median: q(se, .5), max: se.at(-1) },
  phase_deg: { min: Math.min(...rows.map(r => r.phase)), max: Math.max(...rows.map(r => r.phase)) },
  near_syzygy: { n_phase_lt10_or_gt170: small.length, max_err_there: Math.max(...small.map(r => r.err_deg)) },
  away_from_syzygy_max_err: Math.max(...rows.filter(r => r.phase >= 10 && r.phase <= 170).map(r => r.err_deg)), worst };
console.log(JSON.stringify(summary, null, 1));
fs.writeFileSync(process.env.OUT || 'sky-moon-orient.json', JSON.stringify({ summary, rows }, null, 0));
