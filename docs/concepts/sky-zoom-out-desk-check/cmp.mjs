/* Sky zoom-out desk check (10 Nov 2026): committed raw Horizons exports only, no requests. Run desk.py first (writes subpoints.json).
 * Needs astronomy-engine 2.1.19 in /home/claude/spike (dev only, as in solar.test.mjs). */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
import * as A from '/home/claude/spike/node_modules/astronomy-engine/esm/astronomy.js';
globalThis.window = {}; new Function(readFileSync(join(here,'..','..','..','app.js'),'utf8'))(); const ME = window.ME;
const sp = JSON.parse(readFileSync(join(here,'subpoints.json'),'utf8'));
function refSub(body, d){ // geocentric, geometric (no aberration), of-date, apparent sidereal
  const t = A.MakeTime(d);
  const v = body==='sun' ? A.GeoVector(A.Body.Sun, t, false) : A.GeoMoon(t);
  const e = A.RotateVector(A.Rotation_EQJ_EQD(t), v); const eq = A.EquatorFromVector(e);
  const g = A.SiderealTime(t); return [eq.dec, ME.wrap180(eq.ra*15 - g*15)];
}
const S = {sunPage:[], sunAE:[], moonAE:[]};
for (const r of sp) {
  const d = new Date((r.jd - 2440587.5)*86400e3);
  const p = ME.subsolar(d); S.sunPage.push(ME.angularSep(r.sun[0], r.sun[1], p.lat, p.lng));
  const a = refSub('sun', d); S.sunAE.push(ME.angularSep(r.sun[0], r.sun[1], a[0], a[1]));
  const m = refSub('moon', d); S.moonAE.push(ME.angularSep(r.moon[0], r.moon[1], m[0], m[1]));
}
const st = v => ({ n: v.length, max: Math.max(...v), median: [...v].sort((a,b)=>a-b)[v.length>>1] });
console.log(JSON.stringify({ sun_vs_ME_subsolar: st(S.sunPage), sun_vs_astronomy_engine: st(S.sunAE), moon_vs_astronomy_engine: st(S.moonAE) }, null, 1));
