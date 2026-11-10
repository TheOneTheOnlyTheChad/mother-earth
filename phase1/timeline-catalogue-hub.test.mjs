/* Mother Earth — Timeline catalogue, hub side (0.6.3 TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §4, §5;
 * 0.6.4 TIMELINE-CATALOGUE-REVISIONS-PROPOSAL rev 1.1: versioned route, legacy URL pinned to R1, immutable revisions).
 * Real worker.js, fake R2 holding the generated catalogue phase1/timeline/catalogue/tl-2026-11-R1.json. Nothing networked.
 * A second copy of worker.js is loaded with a FIXTURE table (R1 + a fixture R2, R2 marked current) — the case that
 * would have broken pages built before 0.6.4.
 * Run:   node --no-warnings phase1/timeline-catalogue-hub.test.mjs
 * Break: BREAK=no-hash | serve-on-missing | no-validate | legacy-follows-current | serve-unknown-as-current | no-per-revision-hash
 *        — each loads a weakened copy of worker.js; the suite must FAIL on every one.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'no-hash': ["  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');                     // the WHOLE catalogue file (timeline)", "  // (break) hash check removed"],
  'serve-on-missing': ["  if (!o) return no('missing');\n  let buf;\n  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }\n  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');                     // the WHOLE catalogue file (timeline)",
    "  if (!o) return json({ catalogue: 'timeline', entries: [] });\n  let buf;\n  try { buf = await o.arrayBuffer(); } catch (e) { return no('unreadable'); }\n  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');                     // the WHOLE catalogue file (timeline)"],
  'no-validate': ["  if (!j || j.catalogue !== 'timeline' || j.catalogue_revision !== pin.revision || !Array.isArray(j.entries) || !Array.isArray(j.shelf) || !j.chart) return no('invalid');", "  // (break) validation removed"],
  'legacy-follows-current': ["  if (parts.length === 2) return timelineCatalogue(env, table[legacy]);", "  if (parts.length === 2) return timelineCatalogue(env, table[TIMELINE_CURRENT]);"],
  'serve-unknown-as-current': ["  if (!pin) return json({ kind: 'catalogue', catalogue: 'timeline', status: 'unknown revision' }, 404, { 'Cache-Control': 'no-store' });", "  if (!pin) return timelineCatalogue(env, table[TIMELINE_CURRENT]);"],
  'no-per-revision-hash': ["  return timelineCatalogue(env, pin);\n}", "  return timelineCatalogue(env, { ...pin, fileSha256: table[legacy].fileSha256 });\n}"],
};
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!src.includes(a)) throw new Error('break anchor missing: ' + B); src = src.replace(a, b); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tl-hub-')), 'worker.mjs');
fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href), worker = W.default;

const FILE = fs.readFileSync(path.join(HERE, 'timeline/catalogue/tl-2026-11-R1.json'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// FIXTURE R2: same shape, its own revision id, key and bytes. Loaded into a second worker copy whose table holds R1 + R2
// and whose TIMELINE_CURRENT is R2 (the legacy pin stays R1). Nothing here is published.
const R2ID = 'tl-2026-12-R2', R2KEY = 'ref/timeline/tl-2026-12-R2.json';
const FILE2 = Buffer.from(JSON.stringify({ ...JSON.parse(FILE.toString('utf8')), catalogue_revision: R2ID, generated_at: '2026-12-01T00:00:00Z' }));
const tableAnchor = "  }),\n});\nconst TIMELINE_LEGACY = 'tl-2026-11-R1';";
if (!src.includes(tableAnchor)) throw new Error('fixture anchor missing (revision table)');
let src2 = src.replace(tableAnchor, `  }),\n  '${R2ID}': Object.freeze({ key: '${R2KEY}', revision: '${R2ID}', fileSha256: '${sha(FILE2)}', bytes: ${FILE2.length} }),\n});\nconst TIMELINE_LEGACY = 'tl-2026-11-R1';`);
const curAnchor = "const TIMELINE_CURRENT = 'tl-2026-11-R1';";
if (!src2.includes(curAnchor)) throw new Error('fixture anchor missing (current)');
src2 = src2.replace(curAnchor, `const TIMELINE_CURRENT = '${R2ID}';`);
const tmp2 = path.join(path.dirname(tmp), 'worker-fixture.mjs');
fs.writeFileSync(tmp2, src2);
const W2 = await import(pathToFileURL(tmp2).href), worker2 = W2.default;
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };

const dbTouched = [];
const fakeDB = { prepare(q) { dbTouched.push(q); const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } };
const reads = [];
const r2 = (bytes, opts = {}) => ({
  get: async key => { reads.push(key); if (opts.throws) throw new Error('R2 down');
    const b = opts.objects ? opts.objects[key] : (key === W.TIMELINE.key ? bytes : null);
    if (b == null) return null;
    return { arrayBuffer: async () => { if (opts.readFails) throw new Error('read'); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } }; },
});
const env = (bytes, opts) => ({ R2: r2(bytes, opts), DB: fakeDB });
const get = (e, p = '/catalogue/timeline', method = 'GET', w = worker) => w.fetch(new Request('https://hub.test' + p, { method }), e);

// ---- the generated file and the pin
ok('generator --check passes (page, catalogue, BUILD)', (() => { try { execFileSync('python3', [path.join(HERE, 'timeline/build_timeline.py'), '--check']); return true; } catch (e) { return false; } })());
ok('hub pin = sha256 of the committed catalogue', W.TIMELINE.fileSha256 === sha(FILE), [W.TIMELINE.fileSha256, sha(FILE)]);
ok('hub pin bytes = file size', W.TIMELINE.bytes === FILE.length);
const page = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8');
ok('page embeds the same catalogue hash and revision', page.includes(`data-catalogue-sha="${sha(FILE)}"`) && page.includes(`data-catalogue-rev="${W.TIMELINE.revision}"`));
const J = JSON.parse(FILE.toString('utf8'));
ok('five episodes on the extinctions lane, Pliny on the shelf only', J.entries.length === 5 && J.entries.every(e => e.lane === 'extinctions') && J.shelf.length === 1 && J.shelf[0].axis === false && !J.entries.some(e => e.id === 'e-pliny-ep-6-16'));
ok('four lanes, three without entries', J.lanes.map(l => l.id).join() === 'earth-life,extinctions,relatives,history' && J.lanes.filter(l => l.status !== 'active').length === 3);
ok('chart pinned to tag v2026-06.5 / file hash', J.chart.tag === 'v2026-06.5' && J.chart.file_sha256 === '0158959e8fdae2a8bdbb14ca3e424d2370362cd8dfc8af86e7be73c74368b355' && J.chart.window.ma === 538.8 && J.chart.overview.ma === 4567);
const types = J.entries.flatMap(e => e.claims.map(c => c.claim_type));
ok('every claim type carries its fixed label', J.entries.every(e => e.claims.every(c => c.label === J.claim_labels[c.claim_type])));
ok('the release values are as checked', (() => {
  const v = (id, t) => J.entries.find(e => e.id === id).claims.find(c => c.claim_type === t).when;
  return v('e-big5-end-ordovician', 'extinction_interval_approx').from_ma === 445 && v('e-big5-frasnian-famennian', 'boundary_age_bound').ma === 372.4
    && v('e-big5-frasnian-famennian', 'boundary_age_range_modelled').mid_ma === 371.86 && v('e-big5-end-permian', 'extinction_onset_estimate').ma === 251.941
    && v('e-big5-end-permian', 'extinction_onset_estimate').pm === 0.037 && v('e-big5-end-triassic', 'extinction_horizon_approx').ma === 201.5
    && v('e-big5-end-cretaceous', 'dated_event_age').ma === 66.02 && v('e-big5-end-cretaceous', 'dated_event_age').pm === null;
})());
ok('Herz and Dai are not in the public catalogue (research record only); end-Permian = onset + chart boundary', !/herz2026|dai2025|251\.906|251\.867/.test(FILE.toString('utf8')) && J.entries.find(e => e.id === 'e-big5-end-permian').claims.map(c => c.claim_type).join() === 'extinction_onset_estimate,chart_boundary');
ok('end-Triassic: horizon age + chart boundary only; Bos and Trudgill not in the public catalogue', !/bos2024|trudgill2025|201\.3|s41467-024-47922-0|s41467-025-61344-6/.test(FILE.toString('utf8')) && J.entries.find(e => e.id === 'e-big5-end-triassic').claims.map(c => c.claim_type).join() === 'extinction_horizon_approx,chart_boundary');
ok('public sources = the seven proposed for REGISTER', [...new Set(J.entries.flatMap(e => e.claims.flatMap(c => [c.source, c.also]).filter(Boolean).map(s => s.key)))].sort().join() === 'burgess2017,harper2024,he2020,oconnor2024,percival2018,wilf2023');
ok('no causes, no percentage-loss figures in the catalogue', !/\d\s?%/.test(FILE.toString('utf8')) && !types.includes('cause'));
ok('no duration claimed for the F–F boundary values', J.entries.find(e => e.id === 'e-big5-frasnian-famennian').claims.every(c => !c.when || c.when.type !== 'interval'));

// ---- serving
let r = await get(env(FILE)), body = Buffer.from(await r.arrayBuffer());
ok('200, byte-identical body', r.status === 200 && sha(body) === sha(FILE), r.status);
ok('ETag = file hash; CORS open; max-age 60', r.headers.get('ETag') === `"${sha(FILE)}"` && r.headers.get('Access-Control-Allow-Origin') === '*' && /max-age=60/.test(r.headers.get('Cache-Control')));
ok('GET only, as the Arts route (HEAD → 405)', (await get(env(FILE), '/catalogue/timeline', 'HEAD')).status === 405);
const reason = async e => { const x = await get(e); const j = x.status === 503 ? await x.json() : null; return [x.status, j && j.reason, x.headers.get('Cache-Control')]; };
let [s, why, cc] = await reason(env(null));
ok('missing → 503 missing, no-store', s === 503 && why === 'missing' && cc === 'no-store', [s, why, cc]);
[s, why] = await reason(env(FILE, { throws: true })); ok('R2 error → 503 unreadable', s === 503 && why === 'unreadable', [s, why]);
[s, why] = await reason(env(FILE, { readFails: true })); ok('read error → 503 unreadable', s === 503 && why === 'unreadable', [s, why]);
const flipped = Buffer.from(FILE); flipped[flipped.length - 3] ^= 1;
[s, why] = await reason(env(flipped)); ok('one changed byte → 503 integrity', s === 503 && why === 'integrity', [s, why]);
// a correctly hashed but invalid file: re-pin to its hash in a copy of the pin
const bad = Buffer.from(JSON.stringify({ catalogue: 'timeline', catalogue_revision: 'other', entries: [], shelf: [], chart: {} }));
const pinBad = { ...W.TIMELINE, fileSha256: sha(bad) };
const rb = await W.timelineCatalogue(env(bad), pinBad);
ok('hash matches but wrong revision → 503 invalid', rb.status === 503 && (await rb.json()).reason === 'invalid');
const notJson = Buffer.from('not json'); const rn = await W.timelineCatalogue(env(notJson), { ...W.TIMELINE, fileSha256: sha(notJson) });
ok('hash matches but not JSON → 503 invalid', rn.status === 503 && (await rn.json()).reason === 'invalid');

// ---- 0.6.4: versioned route on the real table
ok('real table: one revision, legacy = current = tl-2026-11-R1, pin unchanged', Object.keys(W.TIMELINE_REVISIONS).join() === 'tl-2026-11-R1' && W.TIMELINE_LEGACY === 'tl-2026-11-R1' && W.TIMELINE_CURRENT === 'tl-2026-11-R1' && W.TIMELINE === W.TIMELINE_REVISIONS['tl-2026-11-R1']);
ok('published pins are frozen (immutable)', Object.isFrozen(W.TIMELINE_REVISIONS) && Object.isFrozen(W.TIMELINE_REVISIONS['tl-2026-11-R1']));
r = await get(env(FILE), '/catalogue/timeline/tl-2026-11-R1'); body = Buffer.from(await r.arrayBuffer());
ok('/catalogue/timeline/tl-2026-11-R1 → 200, exact R1 bytes, same headers', r.status === 200 && sha(body) === sha(FILE) && r.headers.get('ETag') === `"${sha(FILE)}"` && r.headers.get('Access-Control-Allow-Origin') === '*', r.status);
r = await get(env(FILE), '/catalogue/timeline/'); body = Buffer.from(await r.arrayBuffer());
ok('trailing slash = the legacy URL (R1)', r.status === 200 && sha(body) === sha(FILE));
[s, why] = await (async () => { const x = await get(env(null), '/catalogue/timeline/tl-2026-11-R1'); return [x.status, (await x.json()).reason]; })();
ok('known revision, object missing → 503 missing (not 404)', s === 503 && why === 'missing', [s, why]);
const BAD_IDS = ['tl-2026-11-R9', 'TL-2026-11-R1', 'tl-2026-11-R1%2Fx', '..%2F..%2Fsecret', '%2E%2E%2Fref%2Ftimeline%2Ftl-2026-11-R1.json', '%E0%A4%A', '%20', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'x'.repeat(600), 'tl-2026-11-R1/extra', 'tl-2026-11-R1.json', 'ref%2Ftimeline%2Ftl-2026-11-R1.json'];
for (const id of BAD_IDS) {
  reads.length = 0;
  const x = await get(env(FILE), '/catalogue/timeline/' + id); const j = await x.json().catch(() => null);
  ok(`unknown/malformed revision "${id.slice(0, 40)}" → 404 unknown revision, no R2 read, no-store`, x.status === 404 && j && j.status === 'unknown revision' && reads.length === 0 && x.headers.get('Cache-Control') === 'no-store', [x.status, j, reads]);
}
{ // dot segments are normalised by the URL parser before routing (WHATWG): '/catalogue/timeline/%2E%2E' becomes '/catalogue/' and never reaches a revision
  const before = dbTouched.length; reads.length = 0;
  const x = await get(env(FILE), '/catalogue/timeline/%2E%2E'); const j = await x.json();
  ok('dot segment "%2E%2E" is normalised away: no revision lookup, no R2 read, not a catalogue', reads.length === 0 && !('entries' in j) && j.status !== 'unknown revision', [x.status, reads]);
  dbTouched.length = before;   // the hub index it fell through to reads D1 for its history summary; not the route
}
ok('timelinePin: exact own keys only', W.timelinePin('tl-2026-11-R1') === W.TIMELINE && W.timelinePin('__proto__') === null && W.timelinePin('toString') === null && W.timelinePin(undefined) === null && W.timelinePin(1) === null);

// ---- 0.6.4: the bug this release prevents — R2 published and marked current; pages built for R1 must still get R1
const fx = () => env(null, { objects: { [W.TIMELINE.key]: FILE, [R2KEY]: FILE2 } });
ok('fixture: table R1 + R2, current = R2, legacy = R1', Object.keys(W2.TIMELINE_REVISIONS).join() === `tl-2026-11-R1,${R2ID}` && W2.TIMELINE_CURRENT === R2ID && W2.TIMELINE_LEGACY === 'tl-2026-11-R1');
r = await get(fx(), '/catalogue/timeline', 'GET', worker2); body = Buffer.from(await r.arrayBuffer());
ok('fixture: LEGACY URL still returns R1 exact bytes while R2 is current', r.status === 200 && sha(body) === sha(FILE), [r.status, sha(body).slice(0, 12)]);
r = await get(fx(), '/catalogue/timeline/tl-2026-11-R1', 'GET', worker2); body = Buffer.from(await r.arrayBuffer());
ok('fixture: /catalogue/timeline/tl-2026-11-R1 returns R1 exact bytes', r.status === 200 && sha(body) === sha(FILE), [r.status, sha(body).slice(0, 12)]);
r = await get(fx(), '/catalogue/timeline/' + R2ID, 'GET', worker2); body = Buffer.from(await r.arrayBuffer());
ok('fixture: /catalogue/timeline/<R2> returns R2 exact bytes (checked against its own pin)', r.status === 200 && sha(body) === sha(FILE2) && r.headers.get('ETag') === `"${sha(FILE2)}"`, [r.status, sha(body).slice(0, 12)]);
reads.length = 0;
r = await get(fx(), '/catalogue/timeline/tl-2026-13-R3', 'GET', worker2);
ok('fixture: unknown revision → 404, no R2 read', r.status === 404 && reads.length === 0, [r.status, reads]);
const d0 = dbTouched.length; const root2 = await (await get(fx(), '/', 'GET', worker2)).json(); dbTouched.length = d0;   // the index reads D1 for its history summary; not the route
ok('fixture root: path/revision describe the legacy response (R1); current names R2; both revisions listed', root2.catalogues.timeline.path === '/catalogue/timeline' && root2.catalogues.timeline.revision === 'tl-2026-11-R1' && root2.catalogues.timeline.current === R2ID && root2.catalogues.timeline.revisions.join() === `tl-2026-11-R1,${R2ID}`, root2.catalogues.timeline);
const swapped = { [W.TIMELINE.key]: FILE2, [R2KEY]: FILE };
r = await get(env(null, { objects: swapped }), '/catalogue/timeline/' + R2ID, 'GET', worker2);
ok('fixture: R2 key holding R1 bytes → 503 integrity (each revision checked against its own pin)', r.status === 503 && (await r.json()).reason === 'integrity');

// ---- the page asks for its own revision
const js = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8');
ok('timeline.js fetches /catalogue/timeline/<its data-catalogue-rev>', js.includes("fetch(HUB + '/catalogue/timeline/' + encodeURIComponent(wrap.dataset.catalogueRev || '')") && !js.includes("fetch(HUB + '/catalogue/timeline',"));

// ---- outside the collector
ok('no D1 touched by the route', dbTouched.length === 0, dbTouched);
const root = await (await get(env(FILE), '/')).json().catch(() => null);
ok('/ lists the catalogue: legacy path + revision (R1), current, versioned path, revisions; version 0.6.4', root && root.version === '0.6.4' && root.catalogues.timeline.path === '/catalogue/timeline' && root.catalogues.timeline.revision === 'tl-2026-11-R1' && root.catalogues.timeline.current === 'tl-2026-11-R1' && root.catalogues.timeline.versioned_path === '/catalogue/timeline/<revision>' && root.catalogues.timeline.revisions.join() === 'tl-2026-11-R1' && root.endpoints.includes('/catalogue/timeline') && root.endpoints.includes('/catalogue/timeline/<revision>'), root && root.catalogues);
ok('not a layer (no cells route)', (await get(env(FILE), '/cells/timeline')).status === 404);
ok('/catalogue/<other> is not a catalogue (falls through to the hub index)', await (async () => { const j = await (await get(env(FILE), '/catalogue/arts')).json(); return j.name === 'Mother Earth collector' && !('entries' in j); })());

console.log(`\ntimeline-catalogue-hub: ${pass} passed, ${fail} failed${B ? ' [BREAK=' + B + ']' : ''}`);
process.exit(fail ? 1 : 0);
