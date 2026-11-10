/* Mother Earth — Sky catalogue, hub side (0.6.5; SKY-TWO-CLOCKS-PROPOSAL rev 3 §5a, §8 "S1(a) only: hub route").
 * Real worker.js, fake R2 holding the generated catalogue phase1/sky/catalogue/sky-2026-11-R1.json. Nothing networked.
 * A second copy of worker.js is loaded with a FIXTURE table (R1 + a fixture R2, R2 marked current): each revision must be
 * served with its own bytes, and nothing may serve "current" implicitly.
 * Run:   node --no-warnings phase1/sky-hub.test.mjs
 * Break: BREAK=no-hash | serve-on-missing | no-validate | serve-unknown-as-current | no-per-revision-hash | read-on-malformed | bare-serves-current
 *        — each loads a weakened copy of worker.js; the suite must FAIL on every one.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'no-hash': ["  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');\n  let j;\n  try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }\n  const ok = b =>",
    "  let j;\n  try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { return no('invalid'); }\n  const ok = b =>"],
  'serve-on-missing': ["  if (!o) return no('missing');\n  let buf;\n  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }\n  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');\n  let j;",
    "  if (!o) return json({ catalogue: 'sky', bodies: {} });\n  let buf;\n  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }\n  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');\n  let j;"],
  'no-validate': ["  if (!j || j.catalogue !== 'sky' || j.catalogue_revision !== pin.revision || !j.bodies || !ok(j.bodies.moon) || !ok(j.bodies.sun) || !j.coverage) return no('invalid');", "  // (break) validation removed"],
  'serve-unknown-as-current': ["  if (!pin) return json({ kind: 'catalogue', catalogue: 'sky', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });\n  return skyCatalogue(env, pin);",
    "  if (!pin) return skyCatalogue(env, table[SKY_CURRENT]);\n  return skyCatalogue(env, pin);"],
  'no-per-revision-hash': ["  return skyCatalogue(env, pin);\n}", "  return skyCatalogue(env, { ...pin, fileSha256: table['sky-2026-11-R1'].fileSha256 });\n}"],
  'read-on-malformed': ["  if (!pin) return json({ kind: 'catalogue', catalogue: 'sky', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });\n  return skyCatalogue(env, pin);",
    "  if (!pin) { try { await env.R2.get('ref/sky/' + rev + '.json'); } catch (e) {} return json({ kind: 'catalogue', catalogue: 'sky', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' }); }\n  return skyCatalogue(env, pin);"],
  'bare-serves-current': ["  const m = typeof rawPath === 'string' ? rawPath.match(/^\\/catalogue\\/sky\\/([^/]+)$/) : null;",
    "  if (rawPath === '/catalogue/sky') return skyCatalogue(env, table[SKY_CURRENT]);\n  const m = typeof rawPath === 'string' ? rawPath.match(/^\\/catalogue\\/sky\\/([^/]+)$/) : null;"],
};
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!src.includes(a)) throw new Error('break anchor missing: ' + B); src = src.replace(a, b); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sky-hub-'));
fs.writeFileSync(path.join(dir, 'worker.mjs'), src);
const W = await import(pathToFileURL(path.join(dir, 'worker.mjs')).href), worker = W.default;

const FILE = fs.readFileSync(path.join(HERE, 'sky/catalogue/sky-2026-11-R1.json'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const R2ID = 'sky-2027-05-R2', R2KEY = 'ref/sky/sky-2027-05-R2.json';
const FILE2 = Buffer.from(JSON.stringify({ ...JSON.parse(FILE.toString('utf8')), catalogue_revision: R2ID, generated_at: '2027-05-15T00:00:00Z' }));
const tableAnchor = "  }),\n});\nconst SKY_CURRENT = 'sky-2026-11-R1';";
if (!src.includes(tableAnchor)) throw new Error('fixture anchor missing (revision table)');
const src2 = src.replace(tableAnchor, `  }),\n  '${R2ID}': Object.freeze({ key: '${R2KEY}', revision: '${R2ID}', fileSha256: '${sha(FILE2)}', bytes: ${FILE2.length} }),\n});\nconst SKY_CURRENT = '${R2ID}';`);
fs.writeFileSync(path.join(dir, 'worker-fixture.mjs'), src2);
const W2 = await import(pathToFileURL(path.join(dir, 'worker-fixture.mjs')).href), worker2 = W2.default;

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };
const fakeDB = { prepare() { const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } };
const reads = [];
const r2 = (objects, opts = {}) => ({
  get: async key => { reads.push(key); if (opts.throws) throw new Error('R2 down');
    const b = objects[key]; if (b == null) return null;
    return { arrayBuffer: async () => { if (opts.readFails) throw new Error('read'); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } }; },
});
const PIN = W.SKY_REVISIONS['sky-2026-11-R1'];
const env = (objects = { [PIN.key]: FILE }, opts) => ({ R2: r2(objects, opts), DB: fakeDB });
const get = (e, p, method = 'GET', w = worker) => w.fetch(new Request('https://hub.test' + p, { method }), e);
const P1 = '/catalogue/sky/sky-2026-11-R1';

// ---- generated file and pins
ok('generator --check passes', (() => { try { execFileSync('python3', [path.join(HERE, 'sky/build_sky.py'), '--check']); return true; } catch (e) { return false; } })());
const BUILD = JSON.parse(fs.readFileSync(path.join(HERE, 'sky/BUILD.json'), 'utf8'));
ok('hub pin = sha256 and size of the committed catalogue = BUILD.json', PIN.fileSha256 === sha(FILE) && PIN.bytes === FILE.length && BUILD.file_sha256 === sha(FILE) && BUILD.bytes === FILE.length, [PIN, sha(FILE)]);
const skyjs = fs.readFileSync(path.join(HERE, '..', 'sky.js'), 'utf8');
ok('page (sky.js) pins the same revision and hash', skyjs.includes(`'${PIN.revision}'`) && skyjs.includes(`'${sha(FILE)}'`));
ok('real table: R1 pin unchanged + the 0.6.6 scene pin, current = R1, frozen', Object.keys(W.SKY_REVISIONS).join() === 'sky-2026-11-R1,sky-scene-2026-11-R1' && PIN.key === 'ref/sky/sky-2026-11-R1.json' && PIN.fileSha256 === 'f851f16438415bc1e05b392e3e1616052b6347c637ee5ea98df307052058368a' && PIN.bytes === 71925 && W.SKY_CURRENT === 'sky-2026-11-R1' && Object.isFrozen(W.SKY_REVISIONS) && Object.isFrozen(PIN) && Object.isFrozen(W.SKY_REVISIONS['sky-scene-2026-11-R1']));
const J = JSON.parse(FILE.toString('utf8'));
ok('catalogue: 579 rows per body, 2026-06-01..2027-12-31, range_rate method', ['moon', 'sun'].every(b => J.bodies[b].rows.length === 579 && J.bodies[b].rows[0][0] === '2026-06-01' && J.bodies[b].rows[578][0] === '2027-12-31') && J.direction_method === 'range_rate');
ok('raw time flags kept: UTC 248, UT~ 331, UT~ from 2027-02-04', ['moon', 'sun'].every(b => J.bodies[b].rows.filter(r => r[3] === 'UTC').length === 248 && J.bodies[b].rows.filter(r => r[3] === 'UT~').length === 331) && J.time.horizons_ut_tilde_from === '2027-02-04' && J.time.first_date_affected_by_unresolved_leap_second === '2027-07-01');
ok('provenance: API 1.2 / cross-check 1.0, DE441, geometric, attribution', J.provenance.api_version === 'API VERSION: 1.2' && J.provenance.crosscheck.api_version === 'API VERSION: 1.0' && J.provenance.ephemeris === 'DE441' && /geometric/.test(J.provenance.correction) && J.attribution === 'Calculated orbital distances · NASA/JPL Horizons');
ok('the bundle does not carry its own file hash (pinned outside it)', !FILE.toString('utf8').includes(sha(FILE)));

// ---- serving R1
reads.length = 0;
let r = await get(env(), P1), body = Buffer.from(await r.arrayBuffer());
ok('R1 → 200, byte-identical, one R2 read', r.status === 200 && sha(body) === sha(FILE) && reads.length === 1 && reads[0] === PIN.key, [r.status, reads]);
ok('ETag = file hash; CORS open; max-age 60; JSON', r.headers.get('ETag') === `"${sha(FILE)}"` && r.headers.get('Access-Control-Allow-Origin') === '*' && /max-age=60/.test(r.headers.get('Cache-Control')) && r.headers.get('Content-Type') === 'application/json');
const reason = async (e, p = P1) => { const x = await get(e, p); const j = x.status === 503 ? await x.json() : null; return [x.status, j && j.reason, x.headers.get('Cache-Control')]; };
let [s, why, cc] = await reason(env({}));
ok('known revision, object missing → 503 missing, no-store (not 404)', s === 503 && why === 'missing' && cc === 'no-store', [s, why, cc]);
[s, why] = await reason(env(undefined, { throws: true })); ok('R2 error → 503 unreadable', s === 503 && why === 'unreadable', [s, why]);
[s, why] = await reason(env(undefined, { readFails: true })); ok('read error → 503 unreadable', s === 503 && why === 'unreadable', [s, why]);
const flipped = Buffer.from(FILE); flipped[flipped.length - 5] ^= 1;
[s, why] = await reason(env({ [PIN.key]: flipped })); ok('one changed byte → 503 integrity', s === 503 && why === 'integrity', [s, why]);
const bad = Buffer.from(JSON.stringify({ catalogue: 'sky', catalogue_revision: 'other', bodies: { moon: { rows: [1] }, sun: { rows: [1] } }, coverage: {} }));
const rb = await W.skyCatalogue(env({ [PIN.key]: bad }), { ...PIN, fileSha256: sha(bad) });
ok('hash matches but wrong revision → 503 invalid', rb.status === 503 && (await rb.json()).reason === 'invalid');
const noRows = Buffer.from(JSON.stringify({ catalogue: 'sky', catalogue_revision: 'sky-2026-11-R1', bodies: { moon: { rows: [] }, sun: { rows: [1] } }, coverage: {} }));
const rr = await W.skyCatalogue(env({ [PIN.key]: noRows }), { ...PIN, fileSha256: sha(noRows) });
ok('hash matches but a body has no rows → 503 invalid', rr.status === 503 && (await rr.json()).reason === 'invalid');

// ---- unknown / malformed ids and loose paths: 404, zero reads
const BAD = ['sky-2026-11-R9', 'SKY-2026-11-R1', 'sky-2026-11-R1%2Fx', '..%2F..%2Fsecret', '%2E%2E%2Fref%2Fsky%2Fsky-2026-11-R1.json', '%E0%A4%A', '%20', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'x'.repeat(600), 'sky-2026-11-R1.json', 'ref%2Fsky%2Fsky-2026-11-R1.json', 'tl-2026-11-R1'];
for (const id of BAD) {
  reads.length = 0;
  const x = await get(env(), '/catalogue/sky/' + id); const j = await x.json().catch(() => null);
  ok(`unknown/malformed "${id.slice(0, 40)}" → 404 unknown revision, no R2 read, no-store`, x.status === 404 && j && j.status === 'unknown revision' && reads.length === 0 && x.headers.get('Cache-Control') === 'no-store', [x.status, j, reads]);
}
for (const p of ['/catalogue/sky', '/catalogue/sky/', '/catalogue/sky//', '/catalogue/sky//sky-2026-11-R1', '/catalogue/sky/sky-2026-11-R1/', '/catalogue//sky/sky-2026-11-R1', '//catalogue/sky/sky-2026-11-R1', '/catalogue/sky/sky-2026-11-R1/extra']) {
  reads.length = 0;
  const x = await get(env(), p); const j = await x.json().catch(() => null);
  ok(`no unversioned or loose path: "${p}" → 404, no R2 read`, x.status === 404 && j && j.status === 'unknown revision' && reads.length === 0, [x.status, j && j.status, reads]);
}
ok('skyPin: exact own keys only', W.skyPin('sky-2026-11-R1') === PIN && W.skyPin('__proto__') === null && W.skyPin('toString') === null && W.skyPin(undefined) === null && W.skyPin(1) === null);

// ---- two-revision fixture (R2 current): each page fetches its own revision; R1 stays; nothing implicit
const P2 = W2.SKY_REVISIONS[R2ID];
const both = () => env({ [PIN.key]: FILE, [R2KEY]: FILE2 });
r = await get(both(), P1, 'GET', worker2); body = Buffer.from(await r.arrayBuffer());
ok('fixture: R1 still served with R1 bytes while R2 is current', r.status === 200 && sha(body) === sha(FILE) && r.headers.get('ETag') === `"${sha(FILE)}"`);
r = await get(both(), '/catalogue/sky/' + R2ID, 'GET', worker2); body = Buffer.from(await r.arrayBuffer());
ok('fixture: R2 served with its own bytes and ETag', r.status === 200 && sha(body) === sha(FILE2) && r.headers.get('ETag') === `"${P2.fileSha256}"`);
r = await get(env({ [PIN.key]: FILE, [R2KEY]: FILE }), '/catalogue/sky/' + R2ID, 'GET', worker2);
ok('fixture: R2 key holding R1 bytes → 503 integrity (per-revision hash)', r.status === 503 && (await r.json()).reason === 'integrity');
reads.length = 0; r = await get(both(), '/catalogue/sky', 'GET', worker2);
ok('fixture: bare /catalogue/sky does not serve current', r.status === 404 && reads.length === 0);
reads.length = 0; r = await get(both(), '/catalogue/sky/sky-2026-11-R9', 'GET', worker2);
ok('fixture: unknown id does not serve current', r.status === 404 && reads.length === 0);

// ---- index lists the route; other catalogues untouched
const idx = await (await get(env(), '/')).json();
ok('hub >= 0.6.5 (numeric; sky-zoom-rc: 0.6.6); index lists /catalogue/sky/<revision> and catalogues.sky (R1 current; the 0.6.6 scene listed as scene)', (v => { const x = String(v).split('.').map(Number), y = [0, 6, 5]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return true; })(idx.version) && idx.endpoints.includes('/catalogue/sky/<revision>') && idx.catalogues.sky && idx.catalogues.sky.current === 'sky-2026-11-R1' && idx.catalogues.sky.revisions.includes('sky-2026-11-R1') && idx.catalogues.timeline && idx.catalogues.arts);

console.log(`sky-hub: ${pass} passed, ${fail} failed${B ? ` (BREAK=${B})` : ''}`);
process.exit(fail ? 1 : 0);
