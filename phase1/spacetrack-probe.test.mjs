// Offline test of the hub's one-shot Space-Track probe (collector 0.2.3). No network: Space-Track is stubbed, R2/D1 in memory,
// the clock is controlled. Usage: node phase1/spacetrack-probe.test.mjs
import assert from 'node:assert/strict';
import worker from './worker.js';

function makeEnv(extra = {}) {
  const store = new Map();
  const R2 = {
    async delete(k) { store.delete(k); },
    async put(k, body) { store.set(k, body instanceof ArrayBuffer ? new TextDecoder().decode(body) : String(body)); },
    async get(k) { const b = store.get(k); return b == null ? null : { body: b, async json() { return JSON.parse(b); }, async text() { return b; } }; },
  };
  const stmt = () => ({ bind: () => ({ async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } }), async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } });
  return { env: { R2, DB: { prepare: stmt }, ADMIN_KEY: 'k', SPACETRACK_USER: 'user@example.org', SPACETRACK_PASS: 'S3CRET-pass', ...extra }, store };
}

const GP = '"NORAD_CAT_ID","OBJECT_TYPE"\r\n' + Array.from({ length: 500 }, (_, i) => `"${i + 1}","DEBRIS"`).join('\r\n') + '\r\n';
let calls = [];
function stub({ login = 'ok', gp = () => new Response(GP, { status: 200, headers: { 'content-type': 'text/csv' } }) } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, method: init.method || 'GET', body: init.body ? String(init.body) : '', cookie: (init.headers || {}).Cookie || '' });
    if (url.endsWith('/ajaxauth/login')) {
      if (login === 'fail') return new Response('{"Login":"Failed"}', { status: 200 });
      if (login === '522') return new Response('error code: 522', { status: 522 });
      const h = new Headers(); h.append('set-cookie', 'chocolatechip=abc123; path=/; secure; HttpOnly');
      return new Response('', { status: 200, headers: h });
    }
    if (url.includes('/basicspacedata/query/class/gp/')) return gp();
    if (url.endsWith('/ajaxauth/logout')) return new Response('"Successfully logged out"', { status: 200 });
    return new Response('stub: unexpected', { status: 599 });
  };
}
let NOW = Date.parse('2026-11-03T10:14:00Z');
Date.now = () => NOW;
const probe = (env, key = 'k') => worker.fetch(new Request('https://hub/admin/probe/spacetrack?key=' + key), env).then(async r => ({ status: r.status, body: await r.json() }));
let passed = 0; const t = async (name, fn) => { await fn(); passed++; console.log('ok -', name); };

await t('A. wrong admin key → 403, no request', async () => {
  const { env } = makeEnv(); stub();
  const r = await probe(env, 'nope'); assert.equal(r.status, 403); assert.equal(calls.length, 0);
});
await t('B. secrets missing → refused, no request, nothing stored', async () => {
  const { env, store } = makeEnv({ SPACETRACK_PASS: undefined }); stub();
  const r = await probe(env); assert.match(r.body.refused, /not set/); assert.equal(calls.length, 0); assert.equal(store.size, 0);
});
await t('C. outside off-peak minutes (:00, :05, :25, :30, :35, :55) → refused, no request', async () => {
  for (const m of ['00', '05', '09', '21', '25', '30', '35', '39', '51', '55']) {
    NOW = Date.parse(`2026-11-03T10:${m}:00Z`); const { env, store } = makeEnv(); stub();
    const r = await probe(env); assert.match(r.body.refused || '', /off-peak/, 'minute ' + m); assert.equal(calls.length, 0); assert.equal(store.size, 0);
  }
});
await t('D. success: login → ONE GP query → logout; measured; no credentials or cookie in the result or state', async () => {
  NOW = Date.parse('2026-11-03T10:14:00Z'); const { env, store } = makeEnv(); stub();
  const r = await probe(env);
  assert.equal(r.body.status, 'ok');
  assert.deepEqual(calls.map(c => c.url.replace('https://www.space-track.org', '')), ['/ajaxauth/login', '/basicspacedata/query/class/gp/decay_date/null-val/epoch/%3Enow-10/emptyresult/show/format/csv', '/ajaxauth/logout']);
  assert.equal(calls[0].method, 'POST'); assert.equal(calls[1].cookie, 'chocolatechip=abc123');
  assert.equal(calls.filter(c => c.url.includes('/class/gp/')).length, 1);
  assert.equal(r.body.steps.gp.bytes, GP.length); assert.equal(r.body.steps.gp.header, '"NORAD_CAT_ID","OBJECT_TYPE"');
  assert.equal(store.get('staging/spacetrack-gp.csv'), GP);   // staged privately, byte-exact
  const everything = JSON.stringify(r.body) + JSON.stringify([...store.values()]);
  for (const secret of ['S3CRET-pass', 'user@example.org', 'abc123']) assert.ok(!everything.includes(secret), 'leaked ' + secret);
  assert.deepEqual([...store.keys()].sort(), ['staging/spacetrack-gp.csv', 'state/spacetrack-probe.json']);   // nothing published; only the private staging copy
  const pub = await worker.fetch(new Request('https://hub/snapshot/orbital'), env); assert.equal(pub.status, 404);   // not served
});
await t('E. second call 30 min later (still off-peak) → refused by the hourly guard, no request', async () => {
  const { env } = makeEnv(); stub();
  NOW = Date.parse('2026-11-03T10:14:00Z'); await probe(env);
  NOW = Date.parse('2026-11-03T10:44:00Z'); stub();
  const r = await probe(env); assert.match(r.body.refused, /< 60 min/); assert.equal(calls.length, 0);
  NOW = Date.parse('2026-11-03T11:15:00Z'); stub();
  const r2 = await probe(env); assert.equal(r2.body.status, 'ok');   // next hour is allowed
});
await t('F. login failed → no GP query, status auth_or_reach_failed, Space-Track body shown', async () => {
  NOW = Date.parse('2026-11-03T12:14:00Z'); const { env } = makeEnv(); stub({ login: 'fail' });
  const r = await probe(env); assert.equal(r.body.status, 'auth_or_reach_failed'); assert.equal(calls.length, 1); assert.match(r.body.steps.login.body, /Failed/);
});
await t('G. login HTTP 522 (unreachable from Cloudflare) → no GP query, recorded', async () => {
  NOW = Date.parse('2026-11-03T12:44:00Z'); const { env } = makeEnv(); stub({ login: '522' });
  const r = await probe(env); assert.equal(r.body.status, 'auth_or_reach_failed'); assert.equal(r.body.steps.login.http, 522); assert.equal(calls.length, 1);
});
await t('H. empty HTTP 200 GP body (what the pane saw) → gp_failed with empty_body true, no retry', async () => {
  NOW = Date.parse('2026-11-03T13:14:00Z'); const { env } = makeEnv(); stub({ gp: () => new Response('', { status: 200 }) });
  const r = await probe(env); assert.equal(r.body.status, 'gp_failed'); assert.equal(r.body.steps.gp.empty_body, true); assert.equal(r.body.steps.staged, undefined);
  assert.equal(calls.filter(c => c.url.includes('/class/gp/')).length, 1);
});
await t('I. the probe is not a job and no cron reaches Space-Track', async () => {
  const { env } = makeEnv({ SATELLITES_ENABLED: undefined }); stub();
  const r = await worker.fetch(new Request('https://hub/admin/run/spacetrack?key=k'), env); assert.equal(r.status, 404);
  for (const cron of ['*/5 * * * *', '*/15 * * * *', '11,41 * * * *', '7 * * * *']) {
    try { await worker.scheduled({ cron, scheduledTime: NOW }, env, { waitUntil() {} }); } catch (_) {}
  }
  assert.equal(calls.filter(c => c.url.includes('space-track.org')).length, 0);
});
await t('J. ?last=1 reads the stored result without any request', async () => {
  NOW = Date.parse('2026-11-03T14:14:00Z'); const { env } = makeEnv(); stub(); await probe(env); stub();
  const r = await worker.fetch(new Request('https://hub/admin/probe/spacetrack?key=k&last=1'), env).then(x => x.json());
  assert.equal(r.last.status, 'ok'); assert.equal(calls.length, 0);
});
await t('K. orbital-build: 403 without key, 404 with nothing staged, runs on the staged copy without any request and writes nothing', async () => {
  const { env, store } = makeEnv(); stub();
  assert.equal((await worker.fetch(new Request('https://hub/admin/probe/orbital-build?key=x'), env)).status, 403);
  assert.equal((await worker.fetch(new Request('https://hub/admin/probe/orbital-build?key=k'), env)).status, 404);
  const head = 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT,OBJECT_TYPE';
  const row = (i, ty) => '"' + ['X', '2020-001A', '2026-11-03T00:00:00', '15', '0.001', '50', '1', '2', '3', '0', 'U', String(i), '999', '1', '0.0001', '0', '0', ty].join('","') + '"';
  await env.R2.put('staging/spacetrack-gp.csv', head + '\n' + [row(1, 'PAYLOAD'), row(2, 'DEBRIS'), row(3, 'ROCKET BODY')].join('\n') + '\n');
  const before = [...store.keys()].sort().join();
  const r = await worker.fetch(new Request('https://hub/admin/probe/orbital-build?key=k'), env).then(x => x.json());
  assert.equal(r.rows, 3); assert.equal(r.counts.debris, 1); assert.equal(r.ok, false);   // 3 rows < 20,000 floor
  assert.equal(calls.length, 0); assert.equal([...store.keys()].sort().join(), before);
});
console.log(`\n${passed}/11 passed`);
