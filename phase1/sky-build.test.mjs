/* Mother Earth — Sky catalogue generator (SKY-TWO-CLOCKS-PROPOSAL rev 3 §3, §8 check 5).
 * Runs phase1/sky/build_sky.py --check on the real exports (must pass, byte-identical output), then on altered copies of
 * the raw exports in a temporary folder (each must be REJECTED with exit code 2 and a reason naming the fault).
 * Run:   node phase1/sky-build.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), SKY = path.join(HERE, 'sky');
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };
const run = (dir, args = ['--check']) => spawnSync('python3', [path.join(dir, 'build_sky.py'), ...args], { encoding: 'utf8' });

let r = run(SKY);
ok('real exports: --check passes (catalogue and BUILD.json byte-identical)', r.status === 0 && /check OK/.test(r.stdout), [r.status, r.stdout, r.stderr]);

const copy = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sky-build-')); fs.cpSync(SKY, d, { recursive: true }); return d; };
const MOON = 'raw/hz-moon-ut-20261110.txt', CROSS = 'raw/hz-moon-tdb-crosscheck-20261110.txt';
const CASES = [
  ['wrong-centre', MOON, t => t.replace('Center body name: Earth (399)', 'Center body name: Mars (499)'), /wrong centre/],
  ['topocentric site', MOON, t => t.replace('Center-site name: BODY CENTER', 'Center-site name: GEOCENTRIC'), /body centre/],
  ['wrong-timescale', MOON, t => t.replace('Start time      : A.D. 2026-Jun-01 00:00:00.0000 UT ', 'Start time      : A.D. 2026-Jun-01 00:00:00.0000 TDB'), /time scale is not UT/],
  ['wrong-api-version (GET)', MOON, t => t.replace('API VERSION: 1.2', 'API VERSION: 1.3'), /API version/],
  ['wrong-api-version (File API cross-check)', CROSS, t => t.replace('API VERSION: 1.0', 'API VERSION: 1.2'), /API version/],
  ['csv-columns-missing (a record without RG/RR)', MOON, t => t.replace(/( LT= \S+ )RG= \S+ RR= \S+/, '$1'), /without RG\/RR/],
  ['not geometric (light-time corrected)', MOON, t => t.replace('Output type     : GEOMETRIC cartesian states', 'Output type     : ASTROMETRIC cartesian states'), /not geometric/],
  ['wrong units', MOON, t => t.replace('Output units    : KM-S', 'Output units    : AU-D'), /units/],
  ['wrong ephemeris', MOON, t => t.replace('Moon (301)                      {source: DE441}', 'Moon (301)                      {source: DE440}'), /ephemeris/],
  ['a row not at 00:00:00', MOON, t => t.replace('A.D. 2026-Jun-05 00:00:00.0000', 'A.D. 2026-Jun-05 00:01:09.1848'), /not at 00:00:00/],
  ['a missing day', MOON, t => t.replace(/\n\d+\.\d+ = A\.D\. 2026-Jun-05 [^\n]*\n[^\n]*\n[^\n]*\n[^\n]*/, ''), /rows, expected 579|not continuous/],
  ['unexpected time flag', MOON, t => t.replace('A.D. 2026-Jun-05 00:00:00.0000 UTC', 'A.D. 2026-Jun-05 00:00:00.0000 TT'), /time flag/],
  ['cross-check epoch not echoed', CROSS, t => t.replace('2461195.500800751 = ', '2461195.500800999 = '), /not echoed/],
  ['cross-check range disagrees by > 1 m', CROSS, t => t.replace(/(2026-Jun-03 [^\n]*\n[^\n]*\n[^\n]*\n\s*LT=\s*\S+\s+RG=\s*)(\S+)/, (m, a, v) => a + (parseFloat(v) + 0.01).toExponential(15).toUpperCase()), /range differs/],
];
for (const [name, file, f, want] of CASES) {
  const d = copy(); const p = path.join(d, file);
  const before = fs.readFileSync(p, 'utf8'), after = f(before);
  if (after === before) { ok(`${name}: fixture changed the file`, false); continue; }
  fs.writeFileSync(p, after);
  r = run(d);
  ok(`${name}: REJECTED (exit 2, reason named)`, r.status === 2 && /REJECTED/.test(r.stderr) && want.test(r.stderr), [r.status, r.stderr.trim()]);
  const cat = fs.readFileSync(path.join(d, 'catalogue/sky-2026-11-R1.json'));
  ok(`${name}: nothing written`, cat.equals(fs.readFileSync(path.join(SKY, 'catalogue/sky-2026-11-R1.json'))));
}
// manifest-driven windows (refresh path): a manifest whose window does not match its exports is rejected
for (const [name, patch, want] of [
  ['manifest window shorter than the exports', m => { m.end = '2027-12-30'; }, /rows, expected 578|not continuous/],
  ['manifest with a malformed revision id', m => { m.revision = 'sky-R1'; }, /bad revision id/],
  ['manifest start after end', m => { m.start = '2028-01-01'; }, /start after end/],
]) {
  const d = copy(); const mp = path.join(d, 'revisions/sky-2026-11-R1.json');
  const m = JSON.parse(fs.readFileSync(mp, 'utf8')); patch(m); fs.writeFileSync(mp, JSON.stringify(m));
  r = run(d);
  ok(`${name}: REJECTED`, r.status === 2 && want.test(r.stderr), [r.status, r.stderr.trim()]);
}
// endpoint rule: a returned 2028-01-01 row is trimmed, not counted
{
  const d = copy(); const p = path.join(d, MOON); let t = fs.readFileSync(p, 'utf8');
  const blk = t.match(/\n(2461770\.500000000 = A\.D\. 2027-Dec-31 [^\n]*\n[^\n]*\n[^\n]*\n[^\n]*)/)[1];
  t = t.replace(blk, blk + '\n' + blk.replace('2461770.500000000', '2461771.500000000').replace('2027-Dec-31', '2028-Jan-01'));
  fs.writeFileSync(p, t);
  r = run(d);
  ok('a 2028-01-01 row is trimmed: output unchanged except the raw hash', r.status === 1 && /MISMATCH/.test(r.stdout), [r.status, r.stdout, r.stderr]);
}
console.log(`sky-build: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
