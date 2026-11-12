// Hub 0.6.10: collector run notes are not in the public /status `last_runs` (STATUS-RUN-NOTES-PROPOSAL rev 2).
// D1 = a REAL SQLite database (node:sqlite) loaded with phase1/schema.sql, so the route's own SELECT decides which columns
// reach the response (a column dropped from the projection is really absent; a column restored is really present).
// R2 in memory. The REAL fetch route. Seeded rows carry a different marker each, all under 32 chars so the existing token
// redaction would NOT remove them: the test checks removal, not redaction.
// Usage: node --no-warnings phase1/status-notes-hub.test.mjs
//        WORKER=<path to worker.js> node --no-warnings phase1/status-notes-hub.test.mjs   (used by status-notes-breaks.mjs)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const WPATH = process.env.WORKER ? pathToFileURL(process.env.WORKER).href : new URL('./worker.js', import.meta.url).href;
const SCHEMA = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const { default: worker } = await import(WPATH);

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e && e.message || e).split('\n').slice(0, 4).join('\n    ')); } };

const NOW = Date.parse('2026-11-12T11:40:00Z');
{ const R = Date; globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
globalThis.fetch = async () => new Response('stub', { status: 503 });   // /status makes no upstream request

const FIRMS_KEY = 'firmskey0123456789abcdef';
// layer, started_at, finished_at, status, http_status, records, bytes, note
const SEED = [
  ['orbital', '2026-11-12T09:42:20.410Z', '2026-11-12T09:42:31.000Z', 'down', 500, 0, 0, 'MKR-orbital-a1 GP HTTP 500'],
  ['usgs', '2026-11-12T11:35:07.867Z', '2026-11-12T11:35:09.100Z', 'ok', 200, 39, 14875, 'MKR-usgs-b2 generated_age_s=18'],
  ['firms', '2026-11-12T11:30:40.387Z', '2026-11-12T11:30:52.000Z', 'down', 0, 0, 0, `fetch failed MKR-firms-c3 https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_KEY}/VIIRS`],
  ['drifters', '2026-11-12T11:07:58.510Z', '2026-11-12T11:08:10.352Z', 'ok', 200, 1298, 218918, 'MKR-drift-d4 buoys=1298 refused=6'],
];
const MARKERS = ['MKR-orbital-a1', 'MKR-usgs-b2', 'MKR-firms-c3', 'MKR-drift-d4'];
const FIELDS = ['layer', 'started_at', 'status', 'http_status', 'records', 'bytes'];

function makeEnv() {
  const db = new DatabaseSync(':memory:'); db.exec(SCHEMA);
  const ins = db.prepare('INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)');
  // an older row per layer first, so "latest per layer" is really selected (MAX(id)), not just the only row
  for (const r of SEED) ins.run(r[0], '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:05.000Z', 'ok', 200, 1, 1, 'MKR-older-row');
  for (const r of SEED) ins.run(...r);
  const prep = sql => { const mk = args => ({ sql, args,
    async run() { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args).map(x => ({ ...x })) }; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const DB = { prepare: prep, async batch(st) { const out = []; for (const s of st) out.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : (await s.run(), { results: [] })); return out; } };
  const R2 = { async get() { return null; }, async head() { return null; }, async put() { return {}; }, async delete() {}, async list() { return { objects: [], truncated: false }; } };
  return { env: { DB, R2, ADMIN_KEY: 'admin-key-0123456789abcdef', FIRMS_MAP_KEY: FIRMS_KEY, HISTORY_ENABLED: '1' }, db };
}
async function status(env) { const r = await worker.fetch(new Request('https://hub/status'), env); const text = await r.text(); return { r, text, body: JSON.parse(text) }; }
const row = (body, layer) => (body.last_runs || []).find(x => x.layer === layer);

const { env, db } = makeEnv();
const S = await status(env);

await t('S1. /status answers 200, no-store', async () => {
  assert.equal(S.r.status, 200); assert.match(S.r.headers.get('Cache-Control') || '', /no-store/);
});

await t('S2. absent by path: no seeded last_runs row has a note key or any marker', async () => {
  for (const r of SEED) {
    const x = row(S.body, r[0]); assert.ok(x, 'row present for ' + r[0]);
    assert.ok(!Object.prototype.hasOwnProperty.call(x, 'note'), `last_runs[${r[0]}] still has a note key`);
    const s = JSON.stringify(x); for (const m of [...MARKERS, 'MKR-older-row']) assert.ok(!s.includes(m), `marker ${m} in last_runs[${r[0]}]`);
  }
  for (const x of S.body.last_runs) assert.ok(!('note' in x), 'note key on ' + x.layer);
});

await t('S3. structured fields: exactly the six, with the seeded values and types (latest row per layer)', async () => {
  for (const r of SEED) {
    const x = row(S.body, r[0]);
    assert.deepEqual(Object.keys(x).sort(), [...FIELDS].sort(), 'keys of ' + r[0]);
    assert.deepEqual(x, { layer: r[0], started_at: r[1], status: r[3], http_status: r[4], records: r[5], bytes: r[6] }, 'values of ' + r[0]);
    assert.equal(typeof x.http_status, 'number'); assert.equal(typeof x.records, 'number'); assert.equal(typeof x.bytes, 'number');
  }
});

await t('S4. archive_health keeps its own scoped notes, at their exact paths (redacted, cut as today)', async () => {
  const c = S.body.archive_health && S.body.archive_health.collection;
  assert.ok(c && c.firms && c.firms.latest_run, 'archive_health.collection.firms.latest_run present');
  assert.equal(c.firms.latest_run.note, SEED[2][7].slice(0, 160).split(FIRMS_KEY).join('[redacted]'), 'firms latest_run.note');
  assert.ok(!c.firms.latest_run.note.includes(FIRMS_KEY), 'key redacted');
  assert.equal(c.usgs.latest_run.note, SEED[1][7], 'usgs latest_run.note');
  assert.equal(c.firms.latest_run.status, 'down'); assert.equal(c.firms.latest_run.scheduled_at, SEED[2][1]);
});

await t('S5. D1 preserved: every seeded note reads back byte-identical after the request', async () => {
  for (const r of SEED) {
    const got = db.prepare('SELECT note FROM collector_runs WHERE layer = ? ORDER BY id DESC LIMIT 1').get(r[0]).note;
    assert.equal(got, r[7], 'D1 note for ' + r[0]);
  }
});

await t('S6. the rest of the response is present', async () => {
  for (const k of ['now', 'collector_version', 'schema_version', 'cell_deg', 'stale_after_s', 'history', 'archive_health', 'last_batch']) assert.ok(k in S.body, 'missing ' + k);
  const [a, b, c] = S.body.collector_version.split('.').map(Number); assert.ok(a > 0 || b > 6 || (b === 6 && c >= 10), 'collector_version >= 0.6.10, got ' + S.body.collector_version);
  assert.equal(S.body.now, new Date(NOW).toISOString());
});

console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
