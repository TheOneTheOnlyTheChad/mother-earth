// Offline test of the late-sample re-aggregation (collector 0.3.1). No network: R2 and D1 in memory, clock controlled.
// Reproduces 2 Nov 2026 hour 22: a sample scheduled 22:06 reported 'down' at 23:13, after hour 22's 23:07 batch,
// and was counted nowhere. Usage: node phase1/ships-late.test.mjs
import assert from 'node:assert/strict';
import { hourlyBatch, SHIPS_LOOKBACK_H } from './worker.js';

let NOW = 0; Date.now = () => NOW; const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { a.length ? super(...a) : super(NOW); } static now() { return NOW; } };
globalThis.fetch = async () => new Response('stub', { status: 503 });

function makeEnv() {
  const store = new Map(), hourly = new Map(); let hourlyWrites = 0;
  const R2 = {
    async put(k, body) { store.set(k, { body: String(body), uploaded: new RealDate(NOW) }); },
    async get(k) { const o = store.get(k); return o ? { async json() { return JSON.parse(o.body); }, async text() { return o.body; } } : null; },
    async list({ prefix }) { return { objects: [...store.entries()].filter(([k]) => k.startsWith(prefix)).map(([key, o]) => ({ key, uploaded: o.uploaded, size: o.body.length })), truncated: false }; },
    async delete(k) { store.delete(k); },
  };
  const DB = {
    prepare(sql) {
      const exec = (a) => ({
        async run() { if (/INSERT INTO layer_hourly/.test(sql)) { if (a[0] === 'ships') hourlyWrites++; hourly.set(a[0] + '|' + a[1], { snapshots_expected: a[2], snapshots_ok: a[3], source_status: a[4], note: a[6], updated_at: a[7] }); } return {}; },
        async first() { if (/FROM layer_hourly/.test(sql)) return hourly.get(a[0] + '|' + a[1]) || null; if (/COUNT\(\*\)/.test(sql)) return { n: 0 }; return null; },
        async all() { return { results: [] }; },
      });
      return { bind: (...a) => exec(a), ...exec([]) };
    },
    async batch() { return []; },
  };
  return { env: { R2, DB }, store, hourly, writes: () => hourlyWrites };
}
const at = iso => { NOW = RealDate.parse(iso); };
const batchAt = (env, iso) => { at(iso); return hourlyBatch(env, NOW); };
const sample = (env, key, uploadedIso, f) => { at(uploadedIso); return env.R2.put(`cells/ships/${key}.json`, JSON.stringify(f)); };
const DOWN = { source_status: 'down', cells: {} };
const OK = (n) => ({ source_status: 'ok', cells: { '10_20': { count: n } }, window_s: 60, class_a: n, class_b: 0, collector_version: 'mac-test' });
const row = (h, hour) => h.get('ships|' + hour);
let passed = 0; const t = async (n, fn) => { await fn(); passed++; console.log('ok -', n); };

await t('A. hour 22 has no file at its 23:07 batch → absent (correct at that moment)', async () => {
  const { env, hourly } = makeEnv();
  await batchAt(env, '2026-11-02T23:07:00Z');
  assert.equal(row(hourly, '2026-11-02T22').source_status, 'absent');
});

await t('B. the 22:06 sample reports down at 23:13 → the 00:07 batch re-aggregates hour 22 to down (received 1)', async () => {
  const { env, hourly } = makeEnv();
  await batchAt(env, '2026-11-02T23:07:00Z');
  await sample(env, '2026-11-02T22-06Z', '2026-11-02T23:13:07Z', DOWN);
  const out = await batchAt(env, '2026-11-03T00:07:00Z');
  const r = row(hourly, '2026-11-02T22');
  assert.equal(r.source_status, 'down'); assert.equal(r.snapshots_ok, 0);
  assert.equal(JSON.parse(r.note).received, 1);
  assert.deepEqual(out.ships_late.map(x => x.hour), ['2026-11-02T22']);
});

await t('C. a late USABLE sample upgrades the hour (absent → degraded 1/2), and its counts are aggregated', async () => {
  const { env, hourly } = makeEnv();
  await batchAt(env, '2026-11-02T23:07:00Z');
  await sample(env, '2026-11-02T22-36Z', '2026-11-03T00:40:00Z', OK(7));
  await batchAt(env, '2026-11-03T01:07:00Z');
  const r = row(hourly, '2026-11-02T22'); assert.equal(r.source_status, 'degraded'); assert.equal(r.snapshots_ok, 1);
});

await t('D. no churn: once caught up, later batches do not rewrite the hour', async () => {
  const { env, hourly, writes } = makeEnv();
  await batchAt(env, '2026-11-02T23:07:00Z');
  await sample(env, '2026-11-02T22-06Z', '2026-11-02T23:13:07Z', DOWN);
  await batchAt(env, '2026-11-03T00:07:00Z');
  const stamp = row(hourly, '2026-11-02T22').updated_at, w = writes();
  const out = await batchAt(env, '2026-11-03T01:07:00Z');
  assert.equal(row(hourly, '2026-11-02T22').updated_at, stamp);
  assert.equal(out.ships_late.length, 0);
  assert.equal(writes() - w, 1, 'only the hour just closed (00) is written');
});

await t('E. on-time hours are never re-aggregated', async () => {
  const { env, hourly } = makeEnv();
  await sample(env, '2026-11-02T22-06Z', '2026-11-02T22:07:30Z', OK(3));
  await sample(env, '2026-11-02T22-36Z', '2026-11-02T22:37:30Z', OK(5));
  await batchAt(env, '2026-11-02T23:07:00Z');
  assert.equal(row(hourly, '2026-11-02T22').source_status, 'ok');
  for (const iso of ['2026-11-03T00:07:00Z', '2026-11-03T01:07:00Z', '2026-11-03T02:07:00Z']) assert.equal((await batchAt(env, iso)).ships_late.length, 0);
});

await t(`F. bounded: a sample arriving more than ${SHIPS_LOOKBACK_H} h late is NOT picked up (left for /admin/reaggregate)`, async () => {
  const { env, hourly } = makeEnv();
  await batchAt(env, '2026-11-02T23:07:00Z');
  await sample(env, '2026-11-02T22-06Z', '2026-11-03T06:30:00Z', DOWN);
  await batchAt(env, '2026-11-03T07:07:00Z');        // hour 22 is 9 h back → outside the window
  assert.equal(row(hourly, '2026-11-02T22').source_status, 'absent');
});

await t('G. an hour with files but no row (batch missed) is aggregated by the next batch', async () => {
  const { env, hourly } = makeEnv();
  await sample(env, '2026-11-02T22-06Z', '2026-11-02T22:07:30Z', OK(3));
  await batchAt(env, '2026-11-03T00:07:00Z');        // the 23:07 batch never ran
  assert.equal(row(hourly, '2026-11-02T22').source_status, 'degraded');
});

console.log(`\n${passed} passed`);
