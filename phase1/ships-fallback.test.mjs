// Offline test of the ships cloud fallback (hub 0.3.5). No network: Worker WebSocket stubbed (Blob frames, as measured
// live 3 Nov 2026), R2 in memory, clock controlled. Usage: node phase1/ships-fallback.test.mjs
import assert from 'node:assert/strict';
import worker from './worker.js';

function makeEnv(extra = {}) {
  const store = new Map(); const runs = [];
  const R2 = { async put(k, b) { store.set(k, String(b)); }, async delete(k) { store.delete(k); },
    async get(k) { const b = store.get(k); return b === undefined ? null : { body: b, async json() { return JSON.parse(b); }, async text() { return b; } }; },
    async list({ prefix } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, uploaded: new Date() })), truncated: false }; } };
  const st = sql => { const x = a => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push(a); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };
  return { env: { R2, DB: { prepare: st, async batch() { return []; } }, ADMIN_KEY: 'k', AISSTREAM_KEY: 'AIS-SECRET', SHIPS_FALLBACK: '1', ...extra }, store, runs };
}
let conns = 0, mode = 'ok', onDuring = null;
globalThis.fetch = async (url) => {
  url = String(url);
  if (!url.includes('aisstream')) return new Response('stub', { status: 503 });   // FIRMS etc. unreachable here
  conns++; if (mode === '522') return { status: 522, webSocket: null };
  const L = {}; const emit = (t, e) => (L[t] || []).forEach(f => f(e));
  const ws = { accept() {}, addEventListener(t, f) { (L[t] = L[t] || []).push(f); }, close() { setTimeout(() => emit('close', { code: 1000, reason: '' }), 0); },
    send() { setTimeout(async () => {
      if (mode === 'badkey') { emit('message', { data: new Blob([JSON.stringify({ error: 'Api Key Is Not Valid' })]) }); emit('close', { code: 1008, reason: 'x' }); return; }
      emit('message', { data: new Blob([JSON.stringify({ MessageType: 'SubscriptionConfirmation' })]) });
      for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1450)); emit('message', { data: new Blob([JSON.stringify({ MessageType: i % 4 ? 'PositionReport' : 'StandardClassBPositionReport', MetaData: { MMSI: 200000 + (i % 25), latitude: -33 + i * 0.01, longitude: 18, ShipName: 'V' + i, time_utc: '2026-11-03 18:00:0' + (i % 10) + '.0 +0000 UTC' }, Message: { PositionReport: { Sog: 5 } } })]) }); }
      if (onDuring) await onDuring();
    }, 5); } };
  return { status: 101, webSocket: ws };
};
const RealDate = Date; let NOW = RealDate.parse('2026-11-03T22:00:00Z'); const real = RealDate.now, B = real();
globalThis.Date = class extends RealDate { constructor(...a) { a.length ? super(...a) : super(NOW + (real() - B)); } static now() { return NOW + (real() - B); } };
const macSample = (store, isoAt) => store.set('latest/ships.json', JSON.stringify({ layer: 'ships', retrieved_at: isoAt, collector_version: 'mac-0.3.2', source_status: 'ok', records: [] }));
const run = env => worker.fetch(new Request('https://hub/admin/run/ships-fallback?key=k'), env).then(r => r.json());
// window is 60 s in production; shorten for the test by patching the clock is not possible for timers, so accept ~60 s per sampling case
let passed = 0; const t = async (n, fn) => { const s = real(); await fn(); passed++; console.log(`ok - ${n} (${((real() - s) / 1000).toFixed(1)} s)`); };

await t('A. SHIPS_FALLBACK unset → off, no connection', async () => { const { env } = makeEnv({ SHIPS_FALLBACK: undefined }); conns = 0; assert.match((await run(env)).result, /off/); assert.equal(conns, 0); });
await t('B. a home sample 10 min old → not needed, no connection', async () => {
  const { env, store } = makeEnv(); macSample(store, new Date(NOW - 10 * 60e3).toISOString()); conns = 0;
  assert.match((await run(env)).result, /not needed.*mac-0\.3\.2/); assert.equal(conns, 0);
});
await t('C. home sample 50 min old → ONE 60 s cloud sample, published in the Mac envelope shape, labelled cloud', async () => {
  const { env, store, runs } = makeEnv(); macSample(store, new Date(NOW - 50 * 60e3).toISOString()); conns = 0;
  const r = await run(env); assert.match(r.result, /ships-fallback:ok \(25 vessels\)/); assert.equal(conns, 1);
  const s = JSON.parse(store.get('latest/ships.json'));
  assert.match(s.collected_by, /cloud hub/); assert.equal(s.records.length, 25); assert.equal(s.window_s, 60);
  assert.deepEqual(s.record_fields, ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name']);
  assert.equal(s.class_a + s.class_b, 25); assert.ok(s.records[0][3], 'source time kept'); assert.ok(s.records[0][4], 'received_at ours');
  assert.ok([...store.keys()].some(k => k.startsWith('cells/ships/')), 'cells file for the hourly aggregation');
  assert.ok(!JSON.stringify([...store.values()]).includes('AIS-SECRET'), 'key never stored');
  assert.ok(runs.length >= 1);
});
await t('D. a second attempt inside 25 min → waiting, no connection', async () => {
  const { env, store } = makeEnv(); macSample(store, new Date(NOW - 50 * 60e3).toISOString()); await run(env);
  store.set('latest/ships.json', JSON.stringify({ retrieved_at: new Date(NOW - 50 * 60e3).toISOString() }));   // still stale
  conns = 0; NOW += 10 * 60e3; assert.match((await run(env)).result, /waiting/); assert.equal(conns, 0); NOW += 20 * 60e3;
});
await t('E. a home sample landing DURING the listen wins: cloud sample archived only, latest untouched', async () => {
  const { env, store } = makeEnv(); macSample(store, new Date(NOW - 50 * 60e3).toISOString());
  onDuring = () => macSample(store, new Date(Date.now() + 5e3).toISOString());
  const r = await run(env); onDuring = null;
  assert.match(r.result, /archive only/); assert.equal(JSON.parse(store.get('latest/ships.json')).collector_version, 'mac-0.3.2');
  NOW += 30 * 60e3;
});
await t('F. Cloudflare cannot connect → down recorded, last good sample still served', async () => {
  const { env, store } = makeEnv(); macSample(store, new Date(NOW - 50 * 60e3).toISOString()); const before = store.get('latest/ships.json'); mode = '522';
  assert.match((await run(env)).result, /down/); assert.equal(store.get('latest/ships.json'), before); assert.equal(JSON.parse(store.get('latest-cells/ships.json')).source_status, 'down'); mode = 'ok';
  NOW += 30 * 60e3;
});
await t('G. aisstream rejects the key → down, nothing published', async () => {
  const { env, store } = makeEnv(); macSample(store, new Date(NOW - 50 * 60e3).toISOString()); const before = store.get('latest/ships.json'); mode = 'badkey';
  assert.match((await run(env)).result, /down/); assert.equal(store.get('latest/ships.json'), before); mode = 'ok';
});
console.log(`\n${passed} passed`);
