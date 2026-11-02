/* Mother Earth — solar terminator: validation against an independent reference (thread 5, 2 Nov 2026).
 *
 * Reference: astronomy-engine (MIT), a VSOP87-based ephemeris validated against JPL. It is a DEV
 * dependency used by this test only and is never shipped to the page.
 *
 * This measures AGREEMENT with that reference over a stated date range. Agreement with one reference
 * is not proof of absolute accuracy, and nothing here should be quoted as such.
 *
 * Comparison is by ANGULAR SEPARATION of the two subsolar directions, so a longitude difference near
 * the date line or close to a pole can never inflate or hide an error.
 *
 * Run:  node phase1/solar.test.mjs        (needs: npm i astronomy-engine, in /home/claude/spike)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Astro from '/home/claude/spike/node_modules/astronomy-engine/esm/astronomy.js';

const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
new Function(readFileSync(join(here, '..', 'app.js'), 'utf8'))();
const ME = globalThis.window.ME;

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };

// ---- the reference subsolar point: RA/Dec of date, and apparent sidereal time
function refSubsolar(date) {
  const eq = Astro.Equator(Astro.Body.Sun, date, new Astro.Observer(0, 0, 0), true, true);  // of-date, aberration
  const gast = Astro.SiderealTime(date);                    // hours
  return { lat: eq.dec, lng: ME.wrap180(eq.ra * 15 - gast * 15) };
}

// ================================================================ 1. agreement over a stated range
const RANGE_START = Date.UTC(2024, 0, 1), RANGE_END = Date.UTC(2030, 0, 1);
const STEP_H = 7;                                            // 7 h steps walk through all times of day
let worst = { sep: -1, at: null }, n = 0, sum = 0;
const seps = [];
for (let t = RANGE_START; t < RANGE_END; t += STEP_H * 3600e3) {
  const d = new Date(t);
  const a = ME.subsolar(d), b = refSubsolar(d);
  const sep = ME.angularSep(a.lat, a.lng, b.lat, b.lng);
  seps.push(sep); sum += sep; n++;
  if (sep > worst.sep) worst = { sep, at: d.toISOString(), ours: a, ref: b };
}
seps.sort((x, y) => x - y);
const p = q => seps[Math.min(seps.length - 1, Math.floor(q * seps.length))];
const RANGE_TXT = `${new Date(RANGE_START).toISOString().slice(0, 10)} → ${new Date(RANGE_END).toISOString().slice(0, 10)}`;
console.log(`Agreement with astronomy-engine over ${RANGE_TXT}, ${n.toLocaleString()} samples at ${STEP_H} h steps`);
console.log(`  angular separation of the subsolar directions:`);
console.log(`    mean ${(sum / n).toFixed(4)}°   P50 ${p(.5).toFixed(4)}°   P95 ${p(.95).toFixed(4)}°   P99 ${p(.99).toFixed(4)}°   max ${worst.sep.toFixed(4)}°  (worst at ${worst.at})`);
console.log(`  (agreement with one reference; not a claim of absolute accuracy)`);

// a bound chosen well above the observed spread, so the test fails loudly if the formulation drifts
ok('subsolar agreement stays within 0.25° across the whole range', worst.sep < 0.25, worst);
ok('mean agreement is far tighter than the bound', sum / n < 0.05, +(sum / n).toFixed(5));

// ================================================================ 2. equinoxes, solstices — measured, not assumed
const events = [
  ['2026 March equinox', Astro.Seasons(2026).mar_equinox.date],
  ['2026 June solstice', Astro.Seasons(2026).jun_solstice.date],
  ['2026 September equinox', Astro.Seasons(2026).sep_equinox.date],
  ['2026 December solstice', Astro.Seasons(2026).dec_solstice.date],
];
console.log('\nAt the 2026 season instants (reference: astronomy-engine Seasons):');
for (const [name, date] of events) {
  const a = ME.subsolar(date), b = refSubsolar(date);
  const sep = ME.angularSep(a.lat, a.lng, b.lat, b.lng);
  console.log(`  ${name.padEnd(24)} ours lat ${a.lat.toFixed(4).padStart(9)}°  ref ${b.lat.toFixed(4).padStart(9)}°  sep ${sep.toFixed(4)}°`);
  ok(`${name}: agrees with the reference`, sep < 0.25, { sep, ours: a, ref: b });
}
const eqMar = ME.subsolar(events[0][1]), solJun = ME.subsolar(events[1][1]), solDec = ME.subsolar(events[3][1]);
ok('March equinox: subsolar latitude is near the equator', Math.abs(eqMar.lat) < 0.02, eqMar.lat);
ok('June solstice: subsolar latitude is near +23.44', Math.abs(solJun.lat - 23.44) < 0.05, solJun.lat);
ok('December solstice: subsolar latitude is near −23.44', Math.abs(solDec.lat + 23.44) < 0.05, solDec.lat);

// ================================================================ 3. the illumination test itself, vs the reference's altitude
// Independent check of ME.sunlit: compare against the sign of the reference's GEOMETRIC solar altitude
// (refraction 'normal' would move the boundary by ~0.57°, which is exactly the assumption we documented).
// GEOMETRIC altitude — refraction `null`. astronomy-engine's 'normal' option ADDS standard refraction,
// which would raise the apparent altitude near the horizon by about half a degree and make this a
// geometric-vs-refracted comparison rather than a like-for-like one.
function refAltitude(date, lat, lng) {
  const eq = Astro.Equator(Astro.Body.Sun, date, new Astro.Observer(lat, lng, 0), true, true);
  return Astro.Horizon(date, new Astro.Observer(lat, lng, 0), eq.ra, eq.dec, null).altitude;
}
// and the refracted one, used only to quantify the assumption we documented
function refAltitudeRefracted(date, lat, lng) {
  const eq = Astro.Equator(Astro.Body.Sun, date, new Astro.Observer(lat, lng, 0), true, true);
  return Astro.Horizon(date, new Astro.Observer(lat, lng, 0), eq.ra, eq.dec, 'normal').altitude;
}
{
  const when = [Date.UTC(2026, 2, 20, 6), Date.UTC(2026, 5, 21, 18), Date.UTC(2026, 8, 23, 0), Date.UTC(2026, 11, 21, 12)];
  let checked = 0, disagree = 0, worstNear = 0, farDisagree = [];
  for (const t of when) {
    const d = new Date(t), sub = ME.subsolar(d);
    for (let lat = -85; lat <= 85; lat += 5) for (let lng = -180; lng < 180; lng += 5) {
      const ours = ME.sunlit(lat, lng, sub);
      const alt = refAltitude(d, lat, lng);
      checked++;
      if (ours !== (alt > 0)) {
        disagree++;
        const fromTerm = Math.abs(alt);
        worstNear = Math.max(worstNear, fromTerm);
        if (fromTerm > 1.0) farDisagree.push({ lat, lng, alt: +alt.toFixed(3), t: d.toISOString() });
      }
    }
  }
  console.log(`\nIllumination test vs the reference's solar altitude: ${checked.toLocaleString()} points, ${disagree} disagreements`);
  console.log(`  every disagreement lies within ${worstNear.toFixed(3)}° of the horizon — i.e. hard against the terminator itself`);
  ok('no disagreement sits more than 1° from the horizon', farDisagree.length === 0, farDisagree.slice(0, 5));
  ok('disagreements are a small fraction of points', disagree / checked < 0.01, +(disagree / checked).toFixed(5));
}

// ================================================================ 4. poles
{
  const jun = new Date(Date.UTC(2026, 5, 21, 12)), dec = new Date(Date.UTC(2026, 11, 21, 12));
  const sJun = ME.subsolar(jun), sDec = ME.subsolar(dec);
  ok('June solstice: the North Pole is lit', ME.sunlit(90, 0, sJun) === true);
  ok('June solstice: the South Pole is dark', ME.sunlit(-90, 0, sJun) === false);
  ok('December solstice: the North Pole is dark', ME.sunlit(90, 0, sDec) === false);
  ok('December solstice: the South Pole is lit', ME.sunlit(-90, 0, sDec) === true);
  // a pole's lit state cannot depend on the longitude we happen to ask about
  const lngs = [-180, -90, -1, 0, 1, 90, 179.9];
  ok('the North Pole gives the same answer at every longitude (June)', new Set(lngs.map(L => ME.sunlit(90, L, sJun))).size === 1);
  ok('the South Pole gives the same answer at every longitude (December)', new Set(lngs.map(L => ME.sunlit(-90, L, sDec))).size === 1);
  // the polar day/night circle sits at 90 − |declination|
  const circle = 90 - Math.abs(sJun.lat);
  ok('June: just inside the Arctic circle is lit, just outside is not guaranteed',
    ME.sunlit(circle + 1.5, sJun.lng + 180, sJun) === true && ME.sunlit(circle - 1.5, sJun.lng + 180, sJun) === false,
    { circle, inside: ME.sunlit(circle + 1.5, sJun.lng + 180, sJun), outside: ME.sunlit(circle - 1.5, sJun.lng + 180, sJun) });
}

// ================================================================ 5. the date line
{
  const d = new Date(Date.UTC(2026, 6, 15, 3, 17));
  const sub = ME.subsolar(d);
  // crossing ±180 must be continuous: sampling either side of the seam gives the same answer as the midpoint
  let jumps = 0;
  for (let lat = -80; lat <= 80; lat += 10) {
    const a = ME.sunlit(lat, 179.99, sub), b = ME.sunlit(lat, -179.99, sub);
    if (a !== b) jumps++;
  }
  ok('no discontinuity across the date line', jumps === 0, jumps);
  // a longitude expressed as +190 and as −170 is the same place
  for (const [lat, lng] of [[0, 190], [45, 200], [-60, 350], [10, -170]]) {
    ok(`lng ${lng} and its wrap give the same illumination`, ME.sunlit(lat, lng, sub) === ME.sunlit(lat, ME.wrap180(lng), sub), { lat, lng });
  }
  // and the subsolar longitude itself is always in range
  let outOfRange = 0;
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 37 * 3600e3) {
    const s = ME.subsolar(new Date(t));
    if (!(s.lng >= -180 && s.lng <= 180)) outOfRange++;
    if (!(s.lat >= -23.5 && s.lat <= 23.5)) outOfRange++;
  }
  ok('subsolar longitude always within ±180 and latitude within the tropics', outOfRange === 0, outOfRange);
}

// ================================================================ 6. the documented assumption, quantified
{
  // our boundary is geometric; real sunrise includes refraction + semi-diameter (~50'). Show the size of that.
  const d = new Date(Date.UTC(2026, 3, 10, 9));
  const sub = ME.subsolar(d);
  let found = null;
  for (let lng = -180; lng < 180 && !found; lng += 0.25) {
    if (ME.sunlit(0, lng, sub) !== ME.sunlit(0, lng + 0.25, sub)) found = lng;
  }
  const altGeom = refAltitude(d, 0, found), altRefr = refAltitudeRefracted(d, 0, found);
  console.log(`\nDocumented assumption, quantified at our boundary (equator, ${new Date(d).toISOString()}):`);
  console.log(`  reference GEOMETRIC solar altitude  ${altGeom.toFixed(3)}°  — this is the boundary we draw`);
  console.log(`  reference REFRACTED solar altitude  ${altRefr.toFixed(3)}°  — the Sun already appears above the horizon here`);
  console.log(`  Observed sunrise further includes the solar semi-diameter (~16'); together with refraction (~34') that is about 0.83°.`);
  console.log(`  So this line is NOT sunrise, and is not presented as one.`);
  ok('our boundary really is the geometric one (sun centre at the horizon)', Math.abs(altGeom) < 0.3, altGeom);
  ok('the refracted altitude at our boundary is higher, as the assumption predicts', altRefr > altGeom, { altGeom, altRefr });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
