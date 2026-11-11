/* Mother Earth — Ocean Heat release: build-time consistency check (OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §2, Q2).
 * Ties together the three places the snapshot is pinned, reading the FOUR LOCAL FILES from an explicit folder:
 *   - the Worker's OCEANHEAT_REVISIONS (phase1/worker.js): key, sha256, bytes, content type per file;
 *   - the manifest itself: its revision must equal the route's revision id; its file entries (sha256, bytes) must equal the Worker pins;
 *   - the page (oceanheat.js): OH.REV, OH.BASE (= the hub route for that revision) and OH.MANIFEST_SHA256.
 * Every local file's length and sha256 must equal its Worker pin. The Worker itself only checks length and sha256 at serve time.
 * Run:    OH_SNAPSHOT_DIR=/path/to/oh-2026-11-09-R1 node phase1/ocean-heat/check_release_pins.mjs
 * Breaks: BREAK=manifest-revision | pin-mismatch | page-pin-mismatch   (each must make this check FAIL)
 * Exit 0 = consistent; 1 = a mismatch (each printed); 2 = cannot run (no folder, unreadable).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const BREAK = process.env.BREAK || '';
const DIR = process.env.OH_SNAPSHOT_DIR;
if (!DIR || !fs.existsSync(DIR)) { console.log('CANNOT RUN  OH_SNAPSHOT_DIR is unset or missing: ' + DIR); process.exit(2); }

let wsrc = fs.readFileSync(path.join(ROOT, 'phase1/worker.js'), 'utf8');
let page = fs.readFileSync(path.join(ROOT, 'oceanheat.js'), 'utf8');
if (BREAK === 'pin-mismatch') wsrc = wsrc.replace("sha256: '3e66d63c816b01c561a038f757fdc5628ec1be96857232f8ed62b8dac2be1ae0', bytes: 1081272", "sha256: '3e66d63c816b01c561a038f757fdc5628ec1be96857232f8ed62b8dac2be1ae1', bytes: 1081272");
if (BREAK === 'page-pin-mismatch') page = page.replace(/MANIFEST_SHA256: '([0-9a-f]{63})[0-9a-f]'/, "MANIFEST_SHA256: '$10'");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oh-pins-'));
fs.writeFileSync(path.join(tmp, 'worker.mjs'), wsrc);
const W = await import(pathToFileURL(path.join(tmp, 'worker.mjs')).href);

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let bad = 0; const ok = (n, c, got) => { if (c) console.log('ok    ' + n); else { bad++; console.log('FAIL  ' + n + (got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 400) : '')); } };

const revs = Object.keys(W.OCEANHEAT_REVISIONS);
ok('Worker: exactly one revision pinned, frozen', revs.length === 1 && Object.isFrozen(W.OCEANHEAT_REVISIONS), revs);
const rev = revs[0], T = W.OCEANHEAT_REVISIONS[rev];
ok('Worker: the four files, frozen, keys under ref/oceanheat/<revision>/', JSON.stringify(Object.keys(T.files).sort()) === JSON.stringify(['manifest.json', 'mask.bin.z', 'v025.bin.z', 'v050.bin.z']) &&
  Object.values(T.files).every(f => Object.isFrozen(f)) && Object.entries(T.files).every(([n, f]) => f.key === `ref/oceanheat/${rev}/${n}`), T.files);
ok('Worker: content types — manifest JSON, binaries octet-stream', T.files['manifest.json'].type === 'application/json' && ['mask.bin.z', 'v025.bin.z', 'v050.bin.z'].every(n => T.files[n].type === 'application/octet-stream'));

const bytes = {};
for (const n of Object.keys(T.files)) {
  const p = path.join(DIR, n);
  if (!fs.existsSync(p)) { console.log('CANNOT RUN  missing ' + p); process.exit(2); }
  bytes[n] = fs.readFileSync(p);
  ok(`local ${n}: length and sha256 = Worker pin`, bytes[n].length === T.files[n].bytes && sha(bytes[n]) === T.files[n].sha256, [bytes[n].length, sha(bytes[n])]);
}
const man = JSON.parse(bytes['manifest.json'].toString('utf8'));
if (BREAK === 'manifest-revision') man.revision = 'oh-2026-11-09-R2';
ok('manifest revision = the route revision id', man.revision === rev && T.revision === rev, [man.revision, rev]);
for (const n of ['mask.bin.z', 'v025.bin.z', 'v050.bin.z'])
  ok(`manifest entry ${n} (sha256, bytes) = Worker pin`, man.files && man.files[n] && man.files[n].sha256 === T.files[n].sha256 && man.files[n].bytes === T.files[n].bytes, man.files && man.files[n] && { sha256: man.files[n].sha256, bytes: man.files[n].bytes });

const pageRev = (page.match(/REV: '([^']+)'/) || [])[1], pageBase = (page.match(/BASE: '([^']+)'/) || [])[1], pageSha = (page.match(/MANIFEST_SHA256: '([0-9a-f]{64})'/) || [])[1];
ok('page OH.REV = the route revision id', pageRev === rev, pageRev);
ok('page OH.BASE = the hub route for that revision', pageBase === `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/${rev}/`, pageBase);
ok('page OH.MANIFEST_SHA256 = Worker manifest pin = local manifest sha256', pageSha === T.files['manifest.json'].sha256 && pageSha === sha(bytes['manifest.json']), pageSha);
ok('page fetch has no forced revalidation (Q1)', !/cache:\s*'no-cache'/.test(page));

console.log(`\n${bad ? 'INCONSISTENT' : 'CONSISTENT'}  ${bad} mismatch(es)${BREAK ? `  (BREAK=${BREAK})` : ''}`);
process.exit(bad ? 1 : 0);
