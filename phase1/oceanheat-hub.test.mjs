/* Mother Earth — Ocean Heat snapshot files, hub side (0.6.7; OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §2–§3).
 * The REAL worker.js through its fetch export, a fake R2 holding the four real files read from an EXPLICIT local folder
 * (OH_SNAPSHOT_DIR), hash-checked against the pins at setup. The release branch carries no copy: this suite asserts that.
 * Run:   OH_SNAPSHOT_DIR=/path/to/oh-2026-11-09-R1 node --no-warnings phase1/oceanheat-hub.test.mjs
 * Breaks (each loads a weakened copy of worker.js; the suite must FAIL on every one):
 *   BREAK=no-hash-check | no-size-check | loose-route | wrong-type | content-encoding | cache-on-error | decoded-segments
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const DIR = process.env.OH_SNAPSHOT_DIR;
if (!DIR || !fs.existsSync(DIR)) { console.log('FAIL  setup: OH_SNAPSHOT_DIR unset or missing: ' + DIR); process.exit(1); }
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'no-hash-check': ["  if (await sha256Bytes(buf) !== pin.sha256) return no('integrity');\n", ''],
  'no-size-check': ["  if (buf.byteLength !== pin.bytes) return no('size');\n", ''],
  'loose-route': ["rawPath.match(/^\\/catalogue\\/oceanheat\\/([^/]+)\\/([^/]+)$/)", "rawPath.match(/^\\/catalogue\\/oceanheat\\/([^/]+)\\/([^/]+)/)"],
  'wrong-type': ["return new Response(buf, { headers: { 'Content-Type': pin.type, 'Cache-Control': OCEANHEAT_CACHE_OK,", "return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': OCEANHEAT_CACHE_OK,"],
  'content-encoding': ["'Content-Type': pin.type, 'Cache-Control': OCEANHEAT_CACHE_OK,", "'Content-Type': pin.type, 'Content-Encoding': 'deflate', 'Cache-Control': OCEANHEAT_CACHE_OK,"],
  'decoded-segments': ["const pin = m ? oceanHeatPin(m[1], m[2], table) : null;", "let pin = null; if (m) { try { pin = oceanHeatPin(decodeURIComponent(m[1]), decodeURIComponent(m[2]), table); } catch (e) { pin = null; } }"],
  'cache-on-error': ["catalogue: 'oceanheat', status: 'unavailable', reason }, 503, { 'Cache-Control': 'no-store' });", "catalogue: 'oceanheat', status: 'unavailable', reason }, 503);"],
};
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!src.includes(a)) { console.log('break anchor missing: ' + B); process.exit(2); } src = src.replace(a, b); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oh-hub-'));
fs.writeFileSync(path.join(dir, 'worker.mjs'), src);
const W = await import(pathToFileURL(path.join(dir, 'worker.mjs')).href), worker = W.default;

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const REV = 'oh-2026-11-09-R1', T = W.OCEANHEAT_REVISIONS[REV];
const NAMES = ['manifest.json', 'mask.bin.z', 'v025.bin.z', 'v050.bin.z'];

// ---- setup: the explicit local folder, hash-checked; the branch carries no copy
const FILES = {};
for (const n of NAMES) {
  const p = path.join(DIR, n); if (!fs.existsSync(p)) { console.log('FAIL  setup: missing ' + p); process.exit(1); }
  FILES[n] = fs.readFileSync(p);
  if (FILES[n].length !== T.files[n].bytes || sha(FILES[n]) !== T.files[n].sha256) { console.log(`FAIL  setup: ${n} does not match its pin (${FILES[n].length} B, ${sha(FILES[n])})`); process.exit(1); }
}
ok('setup: four local files match the pins (length + sha256)', true);
ok('setup: the release branch carries no data/ocean-heat/ copy', !fs.existsSync(path.join(ROOT, 'data', 'ocean-heat')));
ok('version 0.6.7; table frozen with one revision and four files', /COLLECTOR_VERSION = '0\.6\.7'/.test(src) && Object.isFrozen(W.OCEANHEAT_REVISIONS) && Object.keys(W.OCEANHEAT_REVISIONS).join() === REV && JSON.stringify(Object.keys(T.files)) === JSON.stringify(NAMES) && W.OCEANHEAT_CURRENT === REV);

const fakeDB = { prepare() { const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } };
const reads = [];
const r2 = (objects, opts = {}) => ({
  get: async key => { reads.push(key); if (opts.throws) throw new Error('R2 down');
    const b = objects[key]; if (b == null) return null;
    return { arrayBuffer: async () => { if (opts.readFails) throw new Error('read'); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } }; },
});
const ALL = Object.fromEntries(NAMES.map(n => [T.files[n].key, FILES[n]]));
const env = (objects = ALL, opts) => ({ R2: r2(objects, opts), DB: fakeDB });
const get = (e, p, method = 'GET') => worker.fetch(new Request('https://hub.test' + p, { method }), e);
const P = n => `/catalogue/oceanheat/${REV}/${n}`;

// ---- the four real files
for (const n of NAMES) {
  reads.length = 0;
  const r = await get(env(), P(n)), body = Buffer.from(await r.arrayBuffer());
  ok(`${n} → 200, byte-identical, exactly one R2 read of its key`, r.status === 200 && sha(body) === T.files[n].sha256 && body.length === T.files[n].bytes && reads.length === 1 && reads[0] === T.files[n].key, [r.status, reads]);
  ok(`${n}: Content-Type ${T.files[n].type}; NO Content-Encoding`, r.headers.get('Content-Type') === T.files[n].type && r.headers.get('Content-Encoding') === null, [r.headers.get('Content-Type'), r.headers.get('Content-Encoding')]);
  ok(`${n}: Cache-Control public, max-age=86400, immutable; ETag = sha256 (exposed); CORS *`, r.headers.get('Cache-Control') === 'public, max-age=86400, immutable' && r.headers.get('ETag') === `"${T.files[n].sha256}"` && /ETag/.test(r.headers.get('Access-Control-Expose-Headers') || '') && r.headers.get('Access-Control-Allow-Origin') === '*', [r.headers.get('Cache-Control'), r.headers.get('ETag')]);
}
ok('binaries are application/octet-stream, the manifest application/json', T.files['manifest.json'].type === 'application/json' && ['mask.bin.z', 'v025.bin.z', 'v050.bin.z'].every(n => T.files[n].type === 'application/octet-stream'));

// ---- routing: 404, no-store, zero R2 reads
for (const p of ['/catalogue/oceanheat', '/catalogue/oceanheat/', `/catalogue/oceanheat/${REV}`, `/catalogue/oceanheat/${REV}/`, `/catalogue/oceanheat/${REV}/mask.bin.z/`,
  `/catalogue/oceanheat/${REV}/mask.bin.z/extra`, `/catalogue/oceanheat/${REV}//mask.bin.z`, `/catalogue/oceanheat//${REV}/mask.bin.z`, `/catalogue/oceanheat/oh-2026-11-09-R2/mask.bin.z`,
  `/catalogue/oceanheat/${REV}/other.bin.z`, `/catalogue/oceanheat/${REV}/v025.bin.zz`, `/catalogue/oceanheat/${REV}%2Fmask.bin.z`, `/catalogue/oceanheat/${REV}/..%2Fmanifest.json`,
  `/catalogue/oceanheat/${REV}/%`, `/catalogue/oceanheat/${REV}/%6danifest.json`, `/catalogue/oceanheat/${REV}/mask%2Ebin.z`, `/catalogue/oceanheat/oh%2D2026-11-09-R1/manifest.json`, `/catalogue/oceanheat/current/manifest.json`, `/catalogue/oceanheat/${REV}/constructor`, `/catalogue/oceanheat/__proto__/manifest.json`]) {
  reads.length = 0;
  const r = await get(env(), p);
  ok(`404 + no-store + zero R2 reads: ${p}`, r.status === 404 && r.headers.get('Cache-Control') === 'no-store' && reads.length === 0, [r.status, r.headers.get('Cache-Control'), reads]);
}

// ---- failures: 503 + reason + no-store
const reason = async (e, n = 'v025.bin.z') => { const x = await get(e, P(n)); const j = x.status === 503 ? await x.json() : null; return [x.status, j && j.reason, x.headers.get('Cache-Control')]; };
const K = T.files['v025.bin.z'].key;
const flipped = Buffer.from(FILES['v025.bin.z']); flipped[1000] ^= 1;
let res = await reason(env({ ...ALL, [K]: flipped })); ok('one changed byte, same length → 503 integrity, no-store', res[0] === 503 && res[1] === 'integrity' && res[2] === 'no-store', res);
res = await reason(env({ ...ALL, [K]: FILES['v025.bin.z'].subarray(0, FILES['v025.bin.z'].length - 7) })); ok('truncated → 503 size, no-store', res[0] === 503 && res[1] === 'size' && res[2] === 'no-store', res);
res = await reason(env({ ...ALL, [K]: Buffer.concat([FILES['v025.bin.z'], Buffer.from([0])]) })); ok('one extra byte → 503 size', res[0] === 503 && res[1] === 'size', res);
const noK = { ...ALL }; delete noK[K];
res = await reason(env(noK)); ok('missing object → 503 missing, no-store (not 404)', res[0] === 503 && res[1] === 'missing' && res[2] === 'no-store', res);
res = await reason(env(ALL, { throws: true })); ok('R2.get throws → 503 unreadable, no-store', res[0] === 503 && res[1] === 'unreadable' && res[2] === 'no-store', res);
res = await reason(env(ALL, { readFails: true })); ok('arrayBuffer() throws → 503 unreadable, no-store', res[0] === 503 && res[1] === 'unreadable' && res[2] === 'no-store', res);
const swapped = { ...ALL, [T.files['v050.bin.z'].key]: FILES['v025.bin.z'] };
res = await reason(env(swapped), 'v050.bin.z'); ok('another file stored under this key → 503 (size), never served', res[0] === 503 && (res[1] === 'size' || res[1] === 'integrity'), res);

// ---- methods, discovery, isolation
let r = await get(env(), P('manifest.json'), 'POST'); ok('POST → 405', r.status === 405);
r = await get(env(), P('manifest.json'), 'OPTIONS'); ok('OPTIONS → CORS preflight', r.status === 200 && r.headers.get('Access-Control-Allow-Origin') === '*');
r = await get(env(), '/'); const meta = await r.json();
ok('discovery: endpoint listed; catalogues.oceanheat current + revisions; version 0.6.7', meta.version === '0.6.7' && meta.endpoints.includes('/catalogue/oceanheat/<revision>/<file>') && meta.catalogues.oceanheat && meta.catalogues.oceanheat.current === REV && meta.catalogues.oceanheat.revisions.join() === REV, meta.catalogues && meta.catalogues.oceanheat);
ok('not a collector layer: absent from LAYERS', !(W.LAYERS || []).includes('oceanheat') && !/oceanheat/.test(JSON.stringify(meta.layers)));
reads.length = 0; r = await get(env(), '/catalogue/sky/sky-2026-11-R1');
ok('Sky route untouched (still served from its own key)', reads.length === 1 && reads[0] === 'ref/sky/sky-2026-11-R1.json', reads);

console.log(`\n${pass} passed, ${fail} failed${B ? `  (BREAK=${B})` : ''}`);
process.exit(fail ? 1 : 0);
