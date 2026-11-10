/* Mother Earth — Timeline catalogue, hub side (0.6.3; TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §4, §5).
 * Real worker.js, fake R2 holding the generated catalogue phase1/timeline/catalogue/tl-2026-11-R1.json. Nothing networked.
 * Run:   node --no-warnings phase1/timeline-catalogue-hub.test.mjs
 * Break: BREAK=no-hash | serve-on-missing | no-validate  — each loads a weakened copy of worker.js; the suite must FAIL on every one.
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
};
const B = process.env.BREAK;
if (B) { const [a, b] = BREAKS[B]; if (!src.includes(a)) throw new Error('break anchor missing: ' + B); src = src.replace(a, b); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tl-hub-')), 'worker.mjs');
fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href), worker = W.default;

const FILE = fs.readFileSync(path.join(HERE, 'timeline/catalogue/tl-2026-11-R1.json'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };

const dbTouched = [];
const fakeDB = { prepare(q) { dbTouched.push(q); const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } };
const r2 = (bytes, opts = {}) => ({
  get: async key => { if (opts.throws) throw new Error('R2 down'); if (key !== W.TIMELINE.key || bytes == null) return null;
    return { arrayBuffer: async () => { if (opts.readFails) throw new Error('read'); return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); } }; },
});
const env = (bytes, opts) => ({ R2: r2(bytes, opts), DB: fakeDB });
const get = (e, p = '/catalogue/timeline', method = 'GET') => worker.fetch(new Request('https://hub.test' + p, { method }), e);

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

// ---- outside the collector
ok('no D1 touched by the route', dbTouched.length === 0, dbTouched);
const root = await (await get(env(FILE), '/')).json().catch(() => null);
ok('/ lists the catalogue and its revision; version 0.6.3', root && root.version === '0.6.3' && root.catalogues.timeline.path === '/catalogue/timeline' && root.catalogues.timeline.revision === 'tl-2026-11-R1' && root.endpoints.includes('/catalogue/timeline'), root && root.catalogues);
ok('not a layer (no cells route)', (await get(env(FILE), '/cells/timeline')).status === 404);
ok('/catalogue/<other> is not a catalogue (falls through to the hub index)', await (async () => { const j = await (await get(env(FILE), '/catalogue/arts')).json(); return j.name === 'Mother Earth collector' && !('entries' in j); })());

console.log(`\ntimeline-catalogue-hub: ${pass} passed, ${fail} failed${B ? ' [BREAK=' + B + ']' : ''}`);
process.exit(fail ? 1 : 0);
