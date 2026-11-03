// Builds a GP-shaped Space-Track CSV (18 quoted columns) with the real 3 Nov 13:42 class mix, runs it through the hub's
// own orbBuild (worker.js), and writes the served CSV + a meta shaped exactly like collector 0.3.0 publishes.
import fs from 'node:fs'; import crypto from 'node:crypto';
import { orbBuild, ORB_CLASSES } from './worker.js';
const COLS = 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT,OBJECT_TYPE'.split(',');
const MIX = [['PAYLOAD', 18954], ['ROCKET BODY', 2205], ['DEBRIS', 10118], ['UNKNOWN', 1232]];
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const REF = Date.parse('2026-11-03T13:00:00Z');
const orbitFor = (i) => { const u = rnd();
  if (i % 997 === 3) return [15.2, 0.9995];                       // deliberately unusable: perigee far below the surface
  if (u < 0.80) return [13.5 + rnd() * 2.6, rnd() * 0.02];         // LEO
  if (u < 0.88) return [2.0 + rnd() * 0.01, rnd() * 0.02];         // MEO
  if (u < 0.95) return [1.0027 + (rnd() - 0.5) * 0.002, rnd() * 0.001]; // GEO
  if (u < 0.99) return [2.0 + rnd() * 0.3, 0.6 + rnd() * 0.15];    // HEO
  return [0.3 + rnd() * 0.5, rnd() * 0.3];                          // beyond GEO
};
const lines = [COLS.join(',')]; let norad = 1;
for (const [type, n] of MIX) for (let k = 0; k < n; k++, norad++) {
  const [mm, ecc] = orbitFor(norad);
  const ageH = rnd() < 0.03 ? 72 + rnd() * 160 : rnd() * 48;       // ~3 % older than 3 days, all under 10 days
  const ep = new Date(REF - ageH * 3600e3).toISOString().replace('Z', '000');
  const v = [`${type} ${norad}`, `2020-${String(norad % 999).padStart(3, '0')}A`, ep, mm.toFixed(8), ecc.toFixed(7), (rnd() * 100).toFixed(4), (rnd() * 360).toFixed(4), (rnd() * 360).toFixed(4), (rnd() * 360).toFixed(4), '0', 'U', String(norad), '999', String(Math.floor(rnd() * 9e4)), (rnd() * 1e-4).toExponential(4), (rnd() * 1e-5).toExponential(4), '0', type];
  lines.push('"' + v.join('","') + '"');
}
const gp = lines.join('\n') + '\n';
const b = orbBuild(gp, null, null);
if (!b.ok) { console.error(b.problems); process.exit(1); }
const sha = crypto.createHash('sha256').update(b.csv, 'utf8').digest('hex');
const meta = { schema_version: 1, collector_version: '0.3.0', layer: 'orbital', tier: 'model', retrieved_at: '2026-11-03T13:42:31.943Z', source_status: 'ok', stale_after_s: 28800,
  elements: { path: '/elements/orbital', key: 'latest/orbital-elements-' + sha.slice(0, 12) + '.csv', rows: b.rows, bytes: Buffer.byteLength(b.csv), sha256: sha, columns: COLS.slice(0, 17).concat('CLASS'), source_bytes: gp.length },
  counts: b.counts,
  classification: { by: 'OBJECT_TYPE first (Space-Track GP)', payload_status: 'pending — CelesTrak SATCAT operational status not used yet; every payload is payload_status_unavailable', classes: ORB_CLASSES },
  validation: { completeness: 'unverified' }, source: { name: 'Space-Track.org' }, map_layer: true };
fs.writeFileSync('/home/claude/fixtures/orbital.csv', b.csv);
fs.writeFileSync('/home/claude/fixtures/orbital-meta.json', JSON.stringify(meta));
console.log(b.rows, JSON.stringify(b.counts), b.csv.length, sha.slice(0, 12));
