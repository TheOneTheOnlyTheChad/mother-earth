// Offline test of the hub's drifters job (collector 0.3.2). No network: OSMC stubbed, R2/D1 in memory, clock controlled.
// The REAL lines below were read from OSMC's ERDDAP on 3 Nov 2026 17:08 UTC (header, units, sample rows, all 10
// future-stamped rows, the quoted-country rows); synthetic rows of the same shape bring the count above the floor.
// Usage: node phase1/drifters-hub.test.mjs
import assert from 'node:assert/strict';
import worker, { driftBuild, csvFields } from './worker.js';

const RETRIEVED = Date.parse('2026-11-03T17:08:00.889Z');
const HEAD = ['platform_code,platform_type,country,time,latitude,longitude,sst', ',,,UTC,degrees_north,degrees_east,Deg C'];
const REAL = [
  '1101570,DRIFTING BUOYS,EUROPEAN UNION,2026-11-03T15:59:00Z,50.3989,-173.6824,8.24',
  '1101577,DRIFTING BUOYS,EUROPEAN UNION,2026-11-03T14:59:00Z,19.4062,-87.5175,NaN',
  '1301742,DRIFTING BUOYS,UNKNOWN,2026-11-03T13:00:00Z,-22.6746,167.4854,22.3',
  '1301805,DRIFTING BUOYS (GENERIC),UNKNOWN,2026-11-03T16:00:00Z,61.2162,-37.909,6.68',
  '1501695,DRIFTING BUOYS,UNITED KINGDOM,2026-11-03T16:00:00Z,-33.2648,-0.2878,17.48',
  '21730,DRIFTING BUOYS (GENERIC),"KOREA, REPUBLIC OF",2026-11-03T05:00:00Z,16.72,131.24,28.9',
  '21734,DRIFTING BUOYS (GENERIC),"KOREA, REPUBLIC OF",2026-11-03T16:00:00Z,24.76,124.56,27.3',
];
const FUTURE = ['1801943', '1801945', '1801946', '2802242', '3801834', '3801836', '3801839', '3801840', '5802253', '7894569'].map((id, i) =>
  `${id},DRIFTING BUOYS,EUROPEAN UNION,2026-11-03T${i === 6 ? '18' : i === 9 ? '22' : '21'}:00:00Z,47.29,-35.44,14.77`);
const synth = (n, off = 0) => Array.from({ length: n }, (_, i) => `${900000 + off + i},DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,${(-60 + (i * 7.3) % 120).toFixed(4)},${(-179 + (i * 13.7) % 358).toFixed(4)},${(5 + i % 25).toFixed(2)}`);
const csv = (rows) => [...HEAD, ...rows].join('\n') + '\n';
const GOOD = csv([...REAL, ...FUTURE, ...synth(1289)]);   // 1,306 rows like the real response

let passed = 0; const t = async (n, fn) => { await fn(); passed++; console.log('ok -', n); };

await t('A. csvFields keeps a quoted country with a comma as ONE field', () => {
  const f = csvFields(REAL[5]); assert.equal(f.length, 7); assert.equal(f[2], 'KOREA, REPUBLIC OF');
});
await t('B. real shape: 1,296 drawn, the 10 future-stamped fixes refused and counted, NaN SST → null (never 0)', () => {
  const b = driftBuild(GOOD, RETRIEVED, 0);
  assert.ok(!b.problem, b.problem);
  assert.equal(b.rows.length, 1296); assert.equal(b.refused.future, 10);
  const nan = b.rows.find(r => r[0] === '1101577'); assert.equal(nan[4], null);
  const kr = b.rows.find(r => r[0] === '21730'); assert.equal(kr[6], 'KOREA, REPUBLIC OF'); assert.equal(kr[1], 16.72);
  assert.ok(!b.rows.some(r => FUTURE.some(f => f.startsWith(r[0] + ','))), 'no future-stamped buoy drawn');
  assert.equal(Object.values(b.cells).reduce((a, c) => a + c.count, 0), 1296);
  assert.equal(b.newest, '2026-11-03T16:00:00.000Z');
});
await t('C. wrong header (e.g. an HTML error page sent with 200) → refused', () => {
  assert.match(driftBuild('<html>error</html>', RETRIEVED, 0).problem, /header/);
});
await t('D. too few buoys → refused; a fall below 50 % of the previous valid count → refused', () => {
  assert.match(driftBuild(csv(synth(150)), RETRIEVED, 0).problem, /too few/);
  assert.match(driftBuild(csv(synth(600)), RETRIEVED, 1300).problem, /fell/);
  assert.ok(!driftBuild(csv(synth(700)), RETRIEVED, 1300).problem);
});
await t('E. duplicate ids, impossible positions, bad times, wrong field counts: refused and counted, never drawn', () => {
  const bad = ['900000,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,1,1,10', '1,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,95,1,10', '2,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,1,181,10',
    '3,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,,1,10', '4,DRIFTING BUOYS,UNKNOWN,yesterday,1,1,10', '5,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,1,1', '6,DRIFTING BUOYS,UNKNOWN,2026-11-01T10:00:00Z,1,1,10'];
  const b = driftBuild(csv([...synth(300), ...bad]), RETRIEVED, 0);
  assert.deepEqual(b.refused, { future: 0, bad_time: 1, bad_position: 3, field_count: 1, duplicate: 1, too_old: 1 });
  assert.equal(b.rows.length, 300);
});
await t('F. implausible SST is blanked (null) and counted, the position still drawn', () => {
  const b = driftBuild(csv([...synth(250), '7,DRIFTING BUOYS,UNKNOWN,2026-11-03T16:00:00Z,1,1,99.9']), RETRIEVED, 0);
  assert.equal(b.sst_out_of_range, 1); assert.equal(b.rows.find(r => r[0] === '7')[4], null);
});

// ---- the job end to end, through the Worker's own scheduled() and fetch()
function makeEnv(extra = {}) {
  const store = new Map(); const runs = [];
  const R2 = {
    async put(k, body) { store.set(k, String(body)); return { key: k }; }, async delete(k) { store.delete(k); },
    async get(k) { const b = store.get(k); return b === undefined ? null : { body: b, etag: 'e', httpEtag: '"e"', async json() { return JSON.parse(b); }, async text() { return b; } }; },
    async list({ prefix } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, uploaded: new Date() })), truncated: false }; },
  };
  const stmt = (sql) => { const x = (a) => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push(a); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };
  return { env: { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', ...extra }, store, runs };
}
let osmcCalls = 0, osmcBody = () => new Response(GOOD, { status: 200 });
globalThis.fetch = async (url) => { url = String(url); if (url.includes('osmc.noaa.gov')) { osmcCalls++; return osmcBody(); } return new Response('stub', { status: 503 }); };
Date.now = () => RETRIEVED;
const hourly = (env) => worker.scheduled({ cron: '7 * * * *', scheduledTime: Date.parse('2026-11-03T17:07:00Z') }, env, { waitUntil() {} });
const admin = (env) => worker.fetch(new Request('https://hub/admin/run/drifters?key=k'), env);

await t('G. schedule gate: hourly job makes NO OSMC request without DRIFTERS_ENABLED=1, exactly ONE with it', async () => {
  const a = makeEnv(); osmcCalls = 0; await hourly(a.env); assert.equal(osmcCalls, 0); assert.ok(!a.store.has('latest/drifters.json'));
  const b = makeEnv({ DRIFTERS_ENABLED: '1' }); osmcCalls = 0; await hourly(b.env); assert.equal(osmcCalls, 1); assert.ok(b.store.has('latest/drifters.json'));
});
await t('H. a good run publishes ONE current snapshot (records + counts, same run) and no history objects', async () => {
  const { env, store, runs } = makeEnv(); osmcBody = () => new Response(GOOD, { status: 200 });
  assert.equal((await admin(env)).status, 200);
  const s = JSON.parse(store.get('latest/drifters.json')), c = JSON.parse(store.get('latest-cells/drifters.json'));
  assert.equal(s.retrieved_at, c.retrieved_at); assert.equal(s.records.length, 1296); assert.equal(s.refused.future, 10);
  assert.deepEqual(s.record_fields, ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country']);
  assert.equal(c.records, undefined); assert.equal(s.source.licence, 'CC0 1.0');
  assert.deepEqual([...store.keys()].filter(k => k.includes('drifters')).sort(), ['latest-cells/drifters.json', 'latest/drifters.json']);   // a good run writes no per-run object
  assert.equal(runs.at(-1)[1] === 'drifters' || runs.at(-1)[0] === 'drifters', true);
  const r = await worker.fetch(new Request('https://hub/snapshot/drifters'), env); assert.equal(r.status, 200);
  assert.equal((await worker.fetch(new Request('https://hub/cells/drifters'), env)).status, 200);
});
for (const [name, body] of [['HTTP 500', () => new Response('err', { status: 500 })], ['HTML with 200', () => new Response('<html>x</html>', { status: 200 })], ['a count collapse', () => new Response(csv(synth(300)), { status: 200 })], ['a network error', () => { throw new Error('reset'); }]]) {
  await t(`I. ${name} → down recorded; the previous valid snapshot AND its counts stay served with their own times (0.6.8; races in osmc-reliability-hub.test.mjs)`, async () => {
    const { env, store, runs } = makeEnv(); osmcBody = () => new Response(GOOD, { status: 200 }); await admin(env);
    const before = store.get('latest/drifters.json');
    osmcBody = body; Date.now = () => RETRIEVED + 3600e3; await admin(env); Date.now = () => RETRIEVED;
    assert.equal(store.get('latest/drifters.json'), before);
    const c = JSON.parse(store.get('latest-cells/drifters.json'));
    assert.equal(c.source_status, 'ok'); assert.equal(c.retrieved_at, JSON.parse(before).retrieved_at); assert.equal(c.last_attempt.status, 'down'); assert.equal(c.last_attempt.consecutive_failures, 1);
    assert.equal(runs.at(-1)[3], 'down');
  });
}
console.log(`\n${passed} passed`);
