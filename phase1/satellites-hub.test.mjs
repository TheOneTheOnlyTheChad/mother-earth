// Offline test of the hub's satellites collector + endpoints (collector 0.2.2). No network: CelesTrak is stubbed,
// R2 and D1 are in-memory. Usage: node phase1/satellites-hub.test.mjs [path/to/frozen-active.csv]
// The frozen CelesTrak active CSV (2 Nov 2026, sha256 2c5c78ab…) lives in bench-private (not in the repo); without it a
// synthetic 2,000-row file is generated with the same header and line endings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker from './worker.js';

const HEADER = 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT';
const csvPath = process.argv[2];
const CSV = csvPath ? fs.readFileSync(csvPath, 'utf8')
  : HEADER + '\r\n' + Array.from({ length: 2000 }, (_, i) => `SAT ${i},2020-001A,2026-11-02T03:22:41.013408,15.5,.0001,53,10,20,30,0,U,${10000 + i},999,1,.0001,.00001,0`).join('\r\n') + '\r\n';
const ROWS = CSV.split('\n').length - 2;

// ---- in-memory R2 / D1
function makeEnv(extra = {}) {
  const store = new Map();
  const R2 = {
    async put(key, body, opts = {}) { store.set(key, { body: String(body), meta: opts.customMetadata || {}, etag: '"' + key.length + ':' + String(body).length + '"' }); },
    async get(key) {
      const o = store.get(key); if (!o) return null;
      return { body: o.body, httpEtag: o.etag, customMetadata: o.meta, async json() { return JSON.parse(o.body); }, async text() { return o.body; } };
    },
  };
  const runs = [];
  const stmt = (sql) => ({ bind: (...a) => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push(a); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }),
    async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } });
  const DB = { prepare: stmt };
  return { env: { R2, DB, ADMIN_KEY: 'k', ...extra }, store, runs };
}

// ---- stubbed network: a script of responses for CelesTrak; everything else 503
let calls = [];
function stubFetch(script) {
  calls = [];
  globalThis.fetch = async (url) => {
    url = String(url); calls.push(url);
    if (url.startsWith('https://celestrak.org/NORAD/elements/gp.php')) { const r = script.data(); return new Response(r.body, { status: r.status }); }
    if (url === 'https://celestrak.org/NORAD/elements/') { const r = script.stamp(); return new Response(r.body, { status: r.status }); }
    return new Response('stub: not reachable', { status: 503 });
  };
}
const stampPage = (s) => ({ status: 200, body: `<html>…<p>Current as of ${s} UTC</p>…</html>` });
const ok = (body) => ({ status: 200, body });
const run = (env) => worker.fetch(new Request('https://hub/admin/run/satellites?key=k'), env).then(r => r.json());
const get = (env, path) => worker.fetch(new Request('https://hub' + path), env);
let passed = 0; const t = async (name, fn) => { await fn(); passed++; console.log('ok -', name); };

const { env, store, runs } = makeEnv();

await t('A. first run: stamp check then one data request; CSV + meta published', async () => {
  stubFetch({ stamp: () => stampPage('2026 Nov 02 14:24:24'), data: () => ok(CSV) });
  const r = await run(env);
  assert.match(r.result, /satellites:ran/);
  assert.deepEqual(calls, ['https://celestrak.org/NORAD/elements/', 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=csv']);
  const meta = JSON.parse(store.get('latest/satellites.json').body);
  assert.equal(meta.source_stamp, '2026-11-02T14:24:24.000Z');
  assert.equal(meta.elements.rows, ROWS);
  assert.equal(meta.tier, 'model');
  assert.equal(store.get('latest/satellites.csv').body, CSV);
  const state = JSON.parse(store.get('state/satellites.json').body);
  assert.equal(state.last_attempt.status, 'ok'); assert.equal(state.last_success.rows, ROWS);
});

await t('A2. GET /elements/satellites serves the stored CSV byte-for-byte, CORS + sha header', async () => {
  const r = await get(env, '/elements/satellites');
  assert.equal(r.status, 200); assert.equal(r.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(r.headers.get('Content-Type'), /text\/csv/);
  assert.equal(await r.text(), CSV);
  assert.equal(r.headers.get('X-Elements-SHA256'), JSON.parse(store.get('latest/satellites.json').body).elements.sha256);
  const m = await get(env, '/snapshot/satellites'); assert.equal(m.status, 200); assert.equal((await m.json()).layer, 'satellites');
});

const before = () => ({ csv: store.get('latest/satellites.csv').body, meta: store.get('latest/satellites.json').body });

await t('B. same stamp: no data request at all', async () => {
  stubFetch({ stamp: () => stampPage('2026 Nov 02 14:24:24'), data: () => { throw new Error('must not be called'); } });
  const b = before(); await run(env);
  assert.deepEqual(calls, ['https://celestrak.org/NORAD/elements/']);
  assert.deepEqual(before(), b);
  assert.equal(JSON.parse(store.get('state/satellites.json').body).last_attempt.data_request, false);
});

await t('C. newer stamp, data 403: recorded down with the body; previous file and times kept', async () => {
  stubFetch({ stamp: () => stampPage('2026 Nov 02 16:24:10'), data: () => ({ status: 403, body: 'GP data has not updated since your last successful download of GROUP=active at …' }) });
  const b = before(); await run(env);
  assert.equal(calls.length, 2, 'exactly one data attempt, no retry');
  assert.deepEqual(before(), b);
  const s = JSON.parse(store.get('state/satellites.json').body);
  assert.equal(s.last_attempt.status, 'down'); assert.equal(s.last_attempt.http, 403); assert.match(s.last_attempt.note, /has not updated/);
  assert.equal(s.last_success.source_stamp, '2026-11-02T14:24:24.000Z');
});

await t('D. truncated body (cut mid-line): validation fails; previous kept', async () => {
  stubFetch({ stamp: () => stampPage('2026 Nov 02 18:24:00'), data: () => ok(CSV.slice(0, Math.floor(CSV.length * 0.97))) });
  const b = before(); await run(env);
  assert.deepEqual(before(), b);
  assert.match(JSON.parse(store.get('state/satellites.json').body).last_attempt.note, /final line incomplete/);
});

await t('E. complete lines but far fewer rows than the last valid file: refused', async () => {
  const lines = CSV.split('\n'); const half = lines.slice(0, Math.floor(lines.length / 2)).join('\n') + '\n';
  stubFetch({ stamp: () => stampPage('2026 Nov 02 20:24:00'), data: () => ok(half) });
  const b = before(); await run(env);
  assert.deepEqual(before(), b);
  assert.match(JSON.parse(store.get('state/satellites.json').body).last_attempt.note, /vs previous valid/);
});

await t('F. wrong header (e.g. an HTML error page with 200): refused', async () => {
  stubFetch({ stamp: () => stampPage('2026 Nov 02 22:24:00'), data: () => ok('<html>maintenance</html>\n') });
  const b = before(); await run(env);
  assert.deepEqual(before(), b);
  assert.match(JSON.parse(store.get('state/satellites.json').body).last_attempt.note, /unexpected header/);
});

await t('G. stamp page 500 or no stamp: down, no data request', async () => {
  stubFetch({ stamp: () => ({ status: 500, body: 'oops' }), data: () => { throw new Error('must not be called'); } });
  await run(env); assert.deepEqual(calls, ['https://celestrak.org/NORAD/elements/']);
  stubFetch({ stamp: () => ok('<html>no stamp here</html>'), data: () => { throw new Error('must not be called'); } });
  await run(env); assert.deepEqual(calls, ['https://celestrak.org/NORAD/elements/']);
  assert.match(JSON.parse(store.get('state/satellites.json').body).last_attempt.note, /stamp not found/);
});

await t('H. newer stamp + valid data: replaced, new times, D1 run rows logged', async () => {
  const csv2 = CSV.replace('CALSPHERE 1', 'CALSPHERE 1X').replace('SAT 0,', 'SAT 0X,');
  stubFetch({ stamp: () => stampPage('2026 Nov 03 00:24:00'), data: () => ok(csv2) });
  const b = before(); await run(env);
  assert.notDeepEqual(before(), b);
  assert.equal(store.get('latest/satellites.csv').body, csv2);
  assert.equal(JSON.parse(store.get('latest/satellites.json').body).source_stamp, '2026-11-03T00:24:00.000Z');
  assert.ok(runs.filter(r => r[0] === 'satellites').length >= 8);
});

await t('I. scheduled hourly job: never runs satellites unless SATELLITES_ENABLED=1, and then only on odd UTC hours', async () => {
  const at = (h) => Date.UTC(2026, 10, 3, h, 7);
  const sched = async (e, h) => { stubFetch({ stamp: () => stampPage('2026 Nov 03 02:24:00'), data: () => ok(CSV) }); let done; await worker.scheduled({ cron: '7 * * * *', scheduledTime: at(h) }, e.env, { waitUntil: (p) => { done = p; } }); await done; return calls.filter(u => u.includes('celestrak')); };
  assert.deepEqual(await sched(makeEnv(), 3), [], 'unset → no CelesTrak request');
  assert.deepEqual(await sched(makeEnv({ SATELLITES_ENABLED: '1' }), 2), [], 'even hour → skipped');
  assert.equal((await sched(makeEnv({ SATELLITES_ENABLED: '1' }), 3)).length, 2, 'odd hour → stamp + data');
});

await t('J. no element file yet: 404 JSON, not a crash', async () => {
  const r = await get(makeEnv().env, '/elements/satellites'); assert.equal(r.status, 404);
});

console.log(`\n${passed} passed (${ROWS} rows${csvPath ? ' from ' + csvPath : ', synthetic'})`);
