/* Holds the hub-to-main candidate to its manifest. Reads git only; changes nothing.
 * usage (from the repo root, on the candidate):  node reviews/evidence/2026-11-23-hub-to-main/check-manifest.mjs <BASE commit> [<candidate commit, default HEAD>]
 * Passes only if: (1) the set of paths changed between BASE and the candidate is exactly the manifest's add/replace/edit paths plus
 * the candidate's own record files listed below; (2) every such path has the manifest's destination sha256 and byte count in the
 * candidate; (3) every identical / keep-main path is byte for byte BASE's; (4) no page file, asset or schema file is in the changed set;
 * (5) phase1/worker.js is the deployed hub recorded in phase1/DEPLOYED-HUB.json. */
import { execFileSync } from 'node:child_process'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..', '..');
const BASE = process.argv[2], CAND = process.argv[3] || 'HEAD'; if (!BASE) { console.log('usage: check-manifest.mjs <BASE> [<candidate>]'); process.exit(2); }
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const blob = (c, p) => { try { return git('show', `${c}:${p}`); } catch (_) { return null; } };
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) { pass++; console.log('ok    ' + n); } else { fail++; console.log('FAIL  ' + n + (got === undefined ? '' : '\n      ' + JSON.stringify(got).slice(0, 900))); } };
// The candidate's own record: written after the manifest, so the manifest cannot carry their hashes. Listed by exact path, nothing else.
const OWN_RECORD = ['reviews/2026-11-23-hub-to-main-candidate.md', 'reviews/evidence/2026-11-23-hub-to-main/manifest-final.txt', 'reviews/evidence/2026-11-23-hub-to-main/check-manifest.mjs',
  'reviews/evidence/2026-11-23-hub-to-main/worker-0.6.19-to-0.6.24.diff', 'reviews/evidence/2026-11-23-hub-to-main/suites-non-browser.txt', 'reviews/evidence/2026-11-23-hub-to-main/suites-browser-paired.txt',
  'reviews/evidence/2026-11-23-hub-to-main/publication-review.md', 'reviews/evidence/2026-11-23-hub-to-main/dependency-inventory.md', 'reviews/evidence/2026-11-23-hub-to-main/browser-logs.tar.gz'];
const rows = fs.readFileSync(path.join(HERE, 'manifest-final.txt'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const [action, dest, bytes, src, p] = l.split('\t'); return { action, dest, bytes: +bytes, src, p }; });
const changing = rows.filter(r => ['add', 'replace', 'edit'].includes(r.action)), still = rows.filter(r => ['identical', 'keep-main'].includes(r.action));
ok('manifest rows are well formed and paths are unique', rows.length === new Set(rows.map(r => r.p)).size && rows.every(r => /^[0-9a-f]{64}$/.test(r.dest) && Number.isInteger(r.bytes) && ['add', 'replace', 'edit', 'identical', 'keep-main'].includes(r.action)), rows.length);
const diff = git('diff', '--name-status', '--no-renames', BASE, CAND).toString().split('\n').filter(Boolean).map(l => l.split('\t'));
const changed = new Map(diff.map(([st, p]) => [p, st]));
const expected = new Set([...changing.map(r => r.p), ...OWN_RECORD]);
ok('every changed path is in the manifest or is the candidate\'s own record', [...changed.keys()].every(p => expected.has(p)), [...changed.keys()].filter(p => !expected.has(p)));
ok('every add / replace / edit path of the manifest did change', changing.every(r => changed.has(r.p)), changing.filter(r => !changed.has(r.p)).map(r => r.p));
ok('nothing is deleted or renamed', diff.every(([st]) => st === 'A' || st === 'M'), diff.filter(([st]) => st !== 'A' && st !== 'M'));
ok('add means new on BASE; replace and edit mean BASE had the file', changing.every(r => (r.action === 'add') === (blob(BASE, r.p) === null)), changing.filter(r => (r.action === 'add') !== (blob(BASE, r.p) === null)).map(r => r.p));
const wrong = changing.filter(r => { const b = blob(CAND, r.p); return !b || sha(b) !== r.dest || b.length !== r.bytes; });
ok('every changed path has the manifest\'s destination sha256 and byte count', wrong.length === 0, wrong.map(r => r.p));
const moved = still.filter(r => { const a = blob(BASE, r.p), b = blob(CAND, r.p); return !a || !b || !a.equals(b) || sha(b) !== r.dest; });
ok('every identical / keep-main path is BASE\'s file byte for byte', moved.length === 0, moved.map(r => r.p));
const copied = changing.filter(r => r.action !== 'edit' && r.src !== '-' && r.src !== r.dest).map(r => r.p);
ok('a copied file whose bytes differ from its source is only the one declared (the fixtures note)', JSON.stringify(copied) === JSON.stringify(['phase1/earthview-fixtures/SOURCE.md']), copied);
// scope: nothing a page loads, no asset, no schema, no collector
const PAGE = p => !p.includes('/') ? p !== 'START-HERE.md' : /^(assets|data)\//.test(p);
ok('no page file, root file (START-HERE.md apart), asset or data file changed', ![...changed.keys()].some(PAGE), [...changed.keys()].filter(PAGE));
ok('phase1/schema.sql, the Mac collector and its scripts are unchanged', !['phase1/schema.sql', 'phase1/collector-mac.mjs', 'phase1/run.sh'].some(p => changed.has(p)));
const top = [...new Set([...changed.keys()].map(p => p.split('/')[0]))].sort();
ok('changed paths lie under phase1/, docs/, reviews/ and START-HERE.md only', JSON.stringify(top) === JSON.stringify(['START-HERE.md', 'docs', 'phase1', 'reviews']), top);
const html = [...changed.keys()].filter(p => /\.(html|css)$/.test(p));
ok('no .html or .css file changed anywhere', html.length === 0, html);
const rec = JSON.parse(blob(CAND, 'phase1/DEPLOYED-HUB.json')), w = blob(CAND, 'phase1/worker.js');
ok('phase1/worker.js is the recorded deployed hub', sha(w) === rec.deployed.worker_sha256 && w.length === rec.deployed.worker_bytes, [sha(w), w.length]);
const r3 = blob(CAND, 'phase1/timeline/catalogue/tl-2026-11-R3.json');
ok('the R3 catalogue is the reviewed file: 31,636 bytes, sha256 f1a5fab2…0993', !!r3 && r3.length === 31636 && sha(r3) === 'f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993');
console.log(`check-manifest: ${pass} passed, ${fail} failed  (BASE ${git('rev-parse', '--short', BASE).toString().trim()}, candidate ${git('rev-parse', '--short', CAND).toString().trim()}; ${changed.size} changed paths, ${changing.length} in the manifest, ${still.length} left as on BASE)`);
process.exit(fail ? 1 : 0);
