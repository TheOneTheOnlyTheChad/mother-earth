/* Hub alignment: phase1/worker.js on this tree must be the DEPLOYED hub, byte for byte.
 * Added 23 Nov 2026 with the hub-to-main alignment (reviews/2026-11-23-hub-to-main-plan.md; rule: docs/HUB-DEPLOY-RULE.md).
 * It replaces the hub part of animals-tab-ui check 13c, which compared the hub file with an old pinned main.
 *
 * phase1/DEPLOYED-HUB.json records what was read back from Cloudflare after the last deploy: version, sha256 and byte count.
 *   - Normal tree (main, any page branch): worker.js must equal "deployed". A page branch that changes the hub by accident fails here.
 *   - Hub candidate branch: the record also carries "candidate" (the file under review) whose "base_sha256" is the deployed hash.
 *     worker.js must then equal the candidate, and this suite says so in its last line. It is still NOT deployed.
 * This reads two local files. It contacts nothing: it cannot tell whether Cloudflare still runs these bytes. That is read back
 * from the account at every deploy and landing, and written into the record by hand.
 * Run:  node --no-warnings phase1/hub-alignment.test.mjs
 * BREAK=<name> makes the check judge an altered copy; each break must fail (it does not touch the files on disk). */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (name, cond, got) => { if (cond) { pass++; console.log('ok    ' + name); } else { fail++; console.log('FAIL  ' + name + (got === undefined ? '' : '\n      got: ' + JSON.stringify(got))); } };

let worker = fs.readFileSync(path.join(HERE, 'worker.js'));
let rec = JSON.parse(fs.readFileSync(path.join(HERE, 'DEPLOYED-HUB.json'), 'utf8'));
const BREAKS = {
  'one-byte-changed': () => { worker = Buffer.concat([worker, Buffer.from(' ')]); },
  'version-line-changed': () => { worker = Buffer.from(worker.toString('utf8').replace(/const COLLECTOR_VERSION = '[^']+';/, "const COLLECTOR_VERSION = '9.9.9';")); },
  'record-names-another-hash': () => { rec.deployed.worker_sha256 = '0'.repeat(64); },
  'candidate-on-a-stale-base': () => { rec.candidate = { version: '9.9.9', worker_sha256: sha(worker), worker_bytes: worker.length, base_sha256: 'f'.repeat(64) }; rec.deployed.worker_sha256 = '0'.repeat(64); },
  'record-without-a-readback': () => { delete rec.deployed.read_back_at; },
};
if (process.env.BREAK) { if (!BREAKS[process.env.BREAK]) { console.log('unknown BREAK'); process.exit(2); } BREAKS[process.env.BREAK](); }

const d = rec.deployed || {}, c = rec.candidate || null, hex = /^[0-9a-f]{64}$/;
const version = (worker.toString('utf8').match(/^const COLLECTOR_VERSION = '([^']+)';$/m) || [])[1];
ok('the record is readable: hub name, version, sha256, byte count, deploy time and read-back time', rec.hub === 'mother-earth' && /^\d+\.\d+\.\d+$/.test(d.version || '') && hex.test(d.worker_sha256 || '') && Number.isInteger(d.worker_bytes) && !Number.isNaN(Date.parse(d.deployed_at)) && !Number.isNaN(Date.parse(d.read_back_at)), d);
ok('worker.js states exactly one version', typeof version === 'string', version);
const isDeployed = sha(worker) === d.worker_sha256;
const isCandidate = !!c && hex.test(c.worker_sha256 || '') && sha(worker) === c.worker_sha256 && c.base_sha256 === d.worker_sha256;
ok('phase1/worker.js is the recorded deployed hub byte for byte, or the recorded candidate built on it', isDeployed || isCandidate, { file: sha(worker), deployed: d.worker_sha256, candidate: c && c.worker_sha256, candidate_base: c && c.base_sha256 });
ok('byte count agrees with the record', isDeployed ? worker.length === d.worker_bytes : !!c && worker.length === c.worker_bytes, worker.length);
ok('the version in the file is the version in the record', isDeployed ? version === d.version : !!c && version === c.version, version);
ok('a tree holding the deployed file carries no stale candidate entry', !(isDeployed && c), c);

console.log(`hub-alignment: ${pass} passed, ${fail} failed` + (fail ? '' : isDeployed ? ` (worker.js = deployed hub ${d.version})` : ` (worker.js = CANDIDATE ${c.version}, NOT deployed; deployed is ${d.version})`));
process.exit(fail ? 1 : 0);
