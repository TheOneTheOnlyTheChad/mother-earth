/* Mother Earth — Sky zoom-out scene vs independent references (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §11 checks 2, 3).
 * check 2: every scene point (both bodies, all dates) within 0.005 deg of astronomy-engine (geocentric, geometric, of-date, GAST).
 * check 3: every Sun point within 0.02 deg of the page's own day/night formula ME.subsolar(00:00 UTC).
 * Each check is also run against broken variants that must fail it. Agreement with references; no accuracy claimed.
 * Needs astronomy-engine 2.1.19 in /home/claude/spike (dev only, as solar.test.mjs).   Run: node phase1/sky-scene-ref.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from '/home/claude/spike/node_modules/astronomy-engine/esm/astronomy.js';
const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = {}; new Function(readFileSync(join(here, '..', 'app.js'), 'utf8'))(); const ME = window.ME;
const scene = JSON.parse(readFileSync(join(here, 'sky/catalogue/sky-scene-2026-11-R1.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };
const ref = (body, d) => { const t = A.MakeTime(d); const v = body === 'sun' ? A.GeoVector(A.Body.Sun, t, false) : A.GeoMoon(t);
  const e = A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(t), v)); return [e.dec, ME.wrap180(e.ra * 15 - A.SiderealTime(t) * 15)]; };
const at = date => new Date(date + 'T00:00:00Z');
const check2 = rows => Math.max(...['moon', 'sun'].flatMap(b => rows[b].map(r => { const q = ref(b, at(r[0])); return ME.angularSep(r[1], r[2], q[0], q[1]); })));
const check3 = rows => Math.max(...rows.sun.map(r => { const s = ME.subsolar(at(r[0])); return ME.angularSep(r[1], r[2], s.lat, s.lng); }));
const real = { moon: scene.bodies.moon.rows, sun: scene.bodies.sun.rows };
const c2 = check2(real), c3 = check3(real);
ok('check 2: scene vs astronomy-engine <= 0.005 deg, both bodies, all dates', c2 <= 0.005 && real.sun.length === 579, c2);
ok('check 3: scene Sun vs ME.subsolar(00:00 UTC) <= 0.02 deg, all dates', c3 <= 0.02, c3);
console.log(`  measured max: check 2 ${c2.toFixed(5)} deg, check 3 ${c3.toFixed(5)} deg`);
const mut = f => ({ moon: real.moon.map(f), sun: real.sun.map(f) });
const shifted = { moon: real.moon.slice(1).concat(real.moon.slice(0, 1)).map((r, i) => [real.moon[i][0], r[1], r[2]]), sun: real.sun.slice(1).concat(real.sun.slice(0, 1)).map((r, i) => [real.sun[i][0], r[1], r[2]]) };
ok('break wrong-day fails check 2', check2(shifted) > 0.005);
ok('break antipode fails check 2', check2(mut(r => [r[0], -r[1], ME.wrap180(r[2] + 180)])) > 0.005);
ok('break mirror-lng fails check 2', check2(mut(r => [r[0], r[1], -r[2]])) > 0.005);
ok('break swap-axes (simulated in the file: lat <- lng/2, lng <- 2 lat) fails check 2', check2(mut(r => [r[0], r[2] / 2, r[1] * 2])) > 0.005);
ok('break era-only (simulated as a 0.1 deg offset; the computed era-only break is in sky-scene-build.test.py) fails check 3', check3({ sun: real.sun.map(r => [r[0], r[1] + 0.1, r[2]]) }) > 0.02);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
