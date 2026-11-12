/* Mother Earth — Arts fixed catalogue snapshot, hub side (0.6.2; Arts release proposal rev 2.1 §4.1, §7 Data + Hub).
 * Real worker.js, fake R2 holding the generated file phase1/arts/met-R1-e394878.json. Nothing networked.
 * Run:   node --no-warnings phase1/arts-hub.test.mjs
 * Break: BREAK=records-only | no-records-check | serve-on-fail  node --no-warnings phase1/arts-hub.test.mjs
 *        each loads a deliberately weakened copy of worker.js; the suite must FAIL on every one.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'records-only': ["  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');", "  // (break) whole-file check removed"],
  'no-records-check': ["  if (j.snapshot_id !== pin.recordsSha256) return no('integrity');", "  // (break) records check removed"],
  'serve-on-fail': ["  if (!o) return no('missing');", "  if (!o) return json({ kind: 'catalogue_snapshot', layer: 'arts', records: [] });"],
};
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!src.includes(a)) throw new Error('break anchor missing: ' + B); src = src.replace(a, b); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'arts-hub-')), 'worker.mjs');
fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href), worker = W.default;

const FILE = fs.readFileSync(path.join(HERE, 'arts/met-R1-e394878.json'));
const BUILD = JSON.parse(fs.readFileSync(path.join(HERE, 'arts/BUILD.json'), 'utf8'));
const RES = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/research/p0-recovery/arts/final-view-results.json'), 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };

const dbTouched = [];
const fakeDB = { prepare(q) { dbTouched.push(q); const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } };
const r2 = (bytes, opts = {}) => ({
  get: async key => { if (opts.throws) throw new Error('R2 down'); if (key !== 'ref/arts/met-R1-e394878.json' || bytes == null) return null;
    return { httpEtag: '"r2etag"', body: new Blob([bytes]).stream(), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; },
});
const env = (bytes, opts) => ({ R2: r2(bytes, opts), DB: fakeDB });
const get = (e, p = '/snapshot/arts', method = 'GET') => worker.fetch(new Request('https://hub.test' + p, { method }), e);

// ---- the generated file itself (§7 Data)
ok('BUILD file_sha256 = sha of the committed file', BUILD.file_sha256 === sha(FILE), [BUILD.file_sha256, sha(FILE)]);
ok('hub pin fileSha256 = BUILD', W.ARTS.fileSha256 === BUILD.file_sha256);
ok('hub pin recordsSha256 = the accepted records hash', W.ARTS.recordsSha256 === '067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2');
const txt = FILE.toString('utf8'), at = txt.lastIndexOf(',"records":');
const recBytes = Buffer.from(txt.slice(at + ',"records":'.length, -1), 'utf8');
ok('records embedded last, byte-identical to the §4.2 projection (122,227 B, sha 067211d9…)', recBytes.length === 122227 && sha(recBytes) === W.ARTS.recordsSha256, [recBytes.length, sha(recBytes)]);
const J = JSON.parse(txt);
ok('snapshot_id = records hash', J.snapshot_id === W.ARTS.recordsSha256);
ok('479 records, 25 countries', J.records.length === 479 && J.counts.objects === 479 && J.counts.countries === 25);
const by = {}; for (const r of J.records) by[r.countries[0]] = (by[r.countries[0]] || 0) + 1;
ok('per-country counts = final-view-results.json', JSON.stringify(Object.fromEntries(RES.all_counts)) === JSON.stringify(Object.fromEntries(Object.entries(by).sort((a, b) => b[1] - a[1] || 0))) || RES.all_counts.every(([c, n]) => by[c] === n) && Object.keys(by).length === RES.all_counts.length);
ok('envelope by_country = the records', J.counts.by_country.every(([c, n]) => by[c] === n) && J.counts.by_country.length === 25);
ok('11 tentatively labelled objects', J.records.filter(r => r.tentative_labels.length).length === 11 && J.counts.objects_with_tentative_labels === 11);
ok('departments = the accepted four', JSON.stringify(J.counts.departments) === JSON.stringify(RES.departments));
ok('record fields fixed (no coordinate or media field)', J.records.every(r => JSON.stringify(Object.keys(r)) === JSON.stringify(J.record_fields)) && !J.record_fields.some(f => /lat|lng|lon|image|media/i.test(f)));
ok('every record placed by a certain created_at wording', J.records.every(r => r.met_wording.split('|').map(s => s.trim()).some(s => ['Made in', 'Minted in', 'Decorated in', 'Printed'].includes(s))));
ok('every link is the Met object page for its id', J.records.every(r => r.link === 'http://www.metmuseum.org/art/collection/search/' + r.object_id));
ok('source pin, source date and processing dates kept separate', J.source.commit === 'e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea' && J.source.source_date === '2026-11-02' && J.view.prepared === '2026-11-07' && /^2026-11-09T/.test(J.published_file_generated_at));
ok('no retrieved_at / stale_after_s / observed_at fields (outside freshness grading)', !/"(retrieved_at|stale_after_s|observed_at|source_status)"/.test(txt.slice(0, at)));
ok('sample stages stated (503,073 → 59,137 → 2,000 → 479, four departments)', J.sample.collection_records === 503073 && J.sample.population === 59137 && J.sample.sample_size === 2000 && J.sample.retained === 479 && J.sample.departments_retained === 4);
const L = J.limitations.join(' ');
for (const [n, re] of [['sample wording (GPT)', /479 objects retained from a seeded 2,000-record sample of 59,137 Met records with typed geography\. This filtered view draws from four departments; it does not represent the Met's whole collection or the world's art\./],
  ['excluded department ≠ absence', /excluded department, not an absence/], ['not historical nationality', /not historical nationality/], ['Country of Origin outside', /"Country of Origin" is its own relationship/],
  ['concentration', /49\.9%/], ['23 unverified, not passes', /23 pages were not reached and are unverified, not passes/], ['not independent verification', /not independent historical verification/],
  ['sensitivity not fully assessed', /Sensitivity not fully assessed/], ['fixed snapshot tied to the source CSV', /source CSV of 2 Nov 2026 \(commit e394878\)/]])
  ok('limitation present: ' + n, re.test(L));
ok('sensitivity handling + every-object wording present', /not fully assessed/.test(J.sensitivity.every_object) && /does NOT mean not sensitive/.test(J.sensitivity.unlabelled) && /not a claim about ownership legitimacy/.test(J.sensitivity.handling));
const pairs = r => { const w = r.met_wording.split('|').map(x => x.trim()); let c = r.met_country.split('|').map(x => x.trim()); if (c.length === 1 && w.length > 1) c = Array(w.length).fill(c[0]); return w.map((x, i) => [x, c[i]]); };
ok('every heading is a place-of-making text of its own objects', Object.entries(J.counts.heading_text).every(([iso, t]) => J.records.some(r => r.countries[0] === iso && pairs(r).some(([w, c]) => ['Made in', 'Minted in', 'Decorated in', 'Printed'].includes(w) && c === t))));
ok('headings never borrow another segment (CHN = China, UZB = present-day Uzbekistan, DEU = Germany)', J.counts.heading_text.CHN === 'China' && J.counts.heading_text.UZB === 'present-day Uzbekistan' && J.counts.heading_text.DEU === 'Germany' && Object.keys(J.counts.heading_text).length === 25);
ok('credit line (D7)', J.credit === 'Collection data: The Metropolitan Museum of Art Open Access (CC0), source CSV of 2 Nov 2026 (commit e394878)');
ok('evidence label Catalogued (D3)', J.evidence_label === 'Catalogued');

// ---- hub serving (§4.1, §7 Hub)
dbTouched.length = 0;
let r = await get(env(new Uint8Array(FILE)));
const body = new Uint8Array(await r.arrayBuffer());
ok('ok → 200, byte for byte', r.status === 200 && sha(body) === W.ARTS.fileSha256, r.status);
ok('ok → ETag = "file_sha256"', r.headers.get('ETag') === '"' + W.ARTS.fileSha256 + '"', r.headers.get('ETag'));
ok('ok → Cache-Control as other snapshots (public, max-age=60)', r.headers.get('Cache-Control') === 'public, max-age=60');
ok('ok → CORS + ETag exposed + JSON', r.headers.get('Access-Control-Allow-Origin') === '*' && /ETag/.test(r.headers.get('Access-Control-Expose-Headers') || '') && /application\/json/.test(r.headers.get('Content-Type')));
ok('ok → no D1 touched (no collector_runs, no history)', dbTouched.length === 0, dbTouched);

const expect503 = async (name, e, reason, pin) => {
  const res = pin ? await W.artsSnapshot(e, pin) : await get(e);
  const j = await res.json().catch(() => null);
  ok(`${name} → 503 ${reason}, no-store, no records`, res.status === 503 && j && j.status === 'unavailable' && j.reason === reason && !('records' in j) && res.headers.get('Cache-Control') === 'no-store', [res.status, j]);
};
await expect503('missing object', env(null), 'missing');
await expect503('R2 throws', env(null, { throws: true }), 'unreadable');
const oneByte = Buffer.from(FILE); const li = oneByte.indexOf('Concentration: United States'); oneByte[li] = 'c'.charCodeAt(0);
ok('tamper fixture: records untouched, file differs', sha(Buffer.from(oneByte.toString('utf8').slice(oneByte.toString('utf8').lastIndexOf(',"records":') + 11, -1))) === W.ARTS.recordsSha256 && sha(oneByte) !== W.ARTS.fileSha256);
await expect503('one byte changed in a limitation, records untouched', env(new Uint8Array(oneByte)), 'integrity');
const dateByte = Buffer.from(FILE.toString('utf8').replace('"prepared":"2026-11-07"', '"prepared":"2026-11-08"'));
await expect503('a date changed, records untouched', env(new Uint8Array(dateByte)), 'integrity');
const trunc = FILE.subarray(0, FILE.length - 10);
await expect503('truncated file', env(new Uint8Array(trunc)), 'integrity');
// paths reachable only if the whole-file hash matched: pin the fake file's own hash
const garbage = Buffer.from('{"not json'); await expect503('unparseable (hash pinned to it)', env(new Uint8Array(garbage)), 'invalid', { ...W.ARTS, fileSha256: sha(garbage) });
const wrongKind = Buffer.from(JSON.stringify({ kind: 'snapshot', layer: 'arts', records: [], counts: {} })); await expect503('wrong kind', env(new Uint8Array(wrongKind)), 'invalid', { ...W.ARTS, fileSha256: sha(wrongKind) });
const otherRecs = Buffer.from(txt.replace(W.ARTS.recordsSha256, 'f'.repeat(64))); await expect503('snapshot_id ≠ records pin (file hash pinned)', env(new Uint8Array(otherRecs)), 'integrity', { ...W.ARTS, fileSha256: sha(otherRecs) });
await expect503('object count ≠ pin', env(new Uint8Array(FILE)), 'invalid', { ...W.ARTS, objects: 478 });
const badUtf8 = Buffer.concat([FILE.subarray(0, 20), Buffer.from([0xff]), FILE.subarray(20)]); await expect503('not UTF-8 (hash pinned)', env(new Uint8Array(badUtf8)), 'invalid', { ...W.ARTS, fileSha256: sha(badUtf8) });

// ---- outside the live-collector machinery
r = await get(env(new Uint8Array(FILE)), '/cells/arts'); ok('/cells/arts → 404 (not a layer)', r.status === 404);
r = await get(env(new Uint8Array(FILE)), '/snapshot/arts/x'); ok('/snapshot/arts/x is not the catalogue route', r.status !== 200 || !(await r.text()).includes('catalogue_snapshot'));
r = await get(env(new Uint8Array(FILE)), '/snapshot/arts', 'POST'); ok('POST → 405', r.status === 405);
r = await get(env(new Uint8Array(FILE)), '/health/runs/arts'); ok('/health/runs/arts is not a passing check', r.status !== 200, r.status);
ok('arts not in LAYERS (no collector, cells, place or status rows)', !/'arts'/.test((src.match(/const LAYERS = \[[^\]]*\]/) || [''])[0]));
const artsSrc = src.slice(src.indexOf('// ===== Arts (the Met)'), src.indexOf('function json(obj')).split('\n').map(l => l.replace(/\/\/.*$/, '').replace(/\/\*\*.*\*\//, '')).join('\n');   // code only, comments stripped
ok('Arts section writes nothing and never reads D1', artsSrc.length > 500 && !/env\.DB|collector_runs|\.put\(|\.delete\(/.test(artsSrc));
ok('no cron or job references arts', !/arts/i.test((src.match(/function jobForCron[\s\S]*?\n}/) || [''])[0]) && !/arts/i.test((src.match(/const JOBS = \{[\s\S]*?\n};/) || [''])[0]));
r = await get(env(new Uint8Array(FILE)), '/'); const root = await r.json();
ok('root: version ≥ 0.6.2, arts listed as a catalogue', (v => v.length === 3 && v.every(Number.isInteger) && (v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 2)))(String(root.version).split('.').map(Number)) && root.catalogues && root.catalogues.arts && root.catalogues.arts.path === '/snapshot/arts' && !root.layers.includes('arts'), root.version);

console.log(`\narts-hub: ${pass} passed, ${fail} failed${B ? ' [BREAK=' + B + ']' : ''}`);
process.exit(fail ? 1 : 0);
