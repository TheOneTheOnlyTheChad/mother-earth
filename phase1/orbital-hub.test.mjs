// Offline test of the hub's scheduled orbital job (collector 0.3.0). No network: Space-Track stubbed, R2/D1 in memory, clock controlled.
// Usage: node phase1/orbital-hub.test.mjs [trimmed-gp.csv]   (without a file: a synthetic 21,000-row trimmed GP file)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker from './worker.js';

const COLS = 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT,OBJECT_TYPE';
const TYPES = ['PAYLOAD', 'PAYLOAD', 'DEBRIS', 'ROCKET BODY', 'UNKNOWN'];
const synth = (n, off = 0) => COLS + '\n' + Array.from({ length: n }, (_, i) => '"' + [`OBJ ${i}`, '2020-001A', '2026-11-03T01:02:03.000000', '15.5', '0.0001', '53', '10', '20', '30', '0', 'U', String(10000 + i + off), '999', '1', '0.0001', '0.00001', '0', TYPES[i % 5]].join('","') + '"').join('\n') + '\n';
const GP = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : synth(21000);
const GP_ROWS = GP.split('\n').filter(Boolean).length - 1;
const variant = (tag) => { const i = GP.indexOf('\n') + 2; return GP.slice(0, i) + tag + GP.slice(i); };   // edit the first object's name only

function makeEnv(extra = {}) {
  const store = new Map(); const runs = [];
  const R2 = {
    async delete(k) { store.delete(k); },
    async put(k, body, o = {}) { if (globalThis.FAIL_PUT && FAIL_PUT(k)) throw new Error('R2 put failed (test)'); store.set(k, { body: body instanceof ArrayBuffer ? new TextDecoder().decode(body) : String(body), meta: o.customMetadata || {} }); },
    async get(k) { const o = store.get(k); return o ? { body: o.body, httpEtag: '"e"', customMetadata: o.meta, async json() { return JSON.parse(o.body); }, async text() { return o.body; } } : null; },
    async list() { return { objects: [], truncated: false }; },
  };
  const stmt = (sql) => ({ bind: (...a) => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push(a); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }), async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } });
  return { env: { R2, DB: { prepare: stmt }, ADMIN_KEY: 'k', SPACETRACK_USER: 'u@example.org', SPACETRACK_PASS: 'pw-SECRET', ORBITAL_ENABLED: '1', ...extra }, store, runs };
}
let calls = [];
function stub({ login = 'ok', gp = () => new Response(GP, { status: 200 }), forest = true } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push(url);
    if (url.endsWith('/ajaxauth/login')) {
      if (login === 'fail') return new Response('{"Login":"Failed"}', { status: 200 });
      if (login === '522') return new Response('error code: 522', { status: 522 });
      const h = new Headers(); h.append('set-cookie', 'chocolatechip=abc; path=/'); return new Response('', { status: 200, headers: h });
    }
    if (url.includes('/class/gp/')) return gp();
    if (url.endsWith('/ajaxauth/logout')) return new Response('"ok"', { status: 200 });
    return new Response('stub: unreachable', { status: 503 });   // forest/GFW etc.
  };
}
let NOW = Date.parse('2026-11-03T13:41:00Z'); Date.now = () => NOW;
const cron = (env, iso, c = '11,41 * * * *') => { NOW = Date.parse(iso); return worker.scheduled({ cron: c, scheduledTime: NOW }, env, { waitUntil() {} }); };
const gpCalls = () => calls.filter(u => u.includes('/class/gp/')).length;
const meta = (store) => store.get('latest/orbital.json') && JSON.parse(store.get('latest/orbital.json').body);
const csvKeys = (store) => [...store.keys()].filter(k => k.startsWith('latest/orbital-elements-'));
let passed = 0; const t = async (n, fn) => { await fn(); passed++; console.log('ok -', n); };

const { env, store, runs } = makeEnv();
await t(`A. scheduled run at 13:41 UTC (odd hour): ONE GP request → validated → published (${GP_ROWS} rows)`, async () => {
  stub(); await cron(env, '2026-11-03T13:41:00Z');
  assert.equal(gpCalls(), 1);
  const m = meta(store); assert.ok(m, 'meta published');
  assert.equal(m.retrieved_at, '2026-11-03T13:41:00.000Z'); assert.equal(m.elements.rows, GP_ROWS);
  assert.match(m.validation.completeness, /^unverified/); assert.match(m.classification.payload_status, /^pending/);
  assert.equal(m.counts.active + m.counts.inactive, 0);
  assert.equal(csvKeys(store).length, 1); assert.equal(csvKeys(store)[0], m.elements.key);
  const r = await worker.fetch(new Request('https://hub/elements/orbital'), env); assert.equal(r.status, 200);
  const body = await r.text(); assert.equal(r.headers.get('X-Elements-SHA256'), m.elements.sha256);
  assert.equal(body.split('\n')[0], COLS.replace(',OBJECT_TYPE', '') + ',CLASS');
  assert.equal((await worker.fetch(new Request('https://hub/snapshot/orbital'), env)).status, 200);
  assert.ok(!JSON.stringify([...store.values()]).includes('pw-SECRET'));
  assert.equal(runs.at(-1)[0], 'orbital'); assert.equal(runs.at(-1)[3], 'ok');
});
const good = meta(store);
await t('B. not scheduled: even hour, :11 tick, ORBITAL_ENABLED unset, other crons → no Space-Track request', async () => {
  stub(); await cron(env, '2026-11-03T14:41:00Z'); await cron(env, '2026-11-03T15:11:00Z');
  await cron(env, '2026-11-03T15:07:00Z', '7 * * * *'); await cron(env, '2026-11-03T15:15:00Z', '*/15 * * * *'); await cron(env, '2026-11-03T15:05:00Z', '*/5 * * * *');
  const e2 = makeEnv({ ORBITAL_ENABLED: undefined }); await cron(e2.env, '2026-11-03T15:41:00Z');
  assert.equal(calls.filter(u => u.includes('space-track')).length, 0);
});
const failCase = async (name, iso, opts, re) => t(name, async () => {
  stub(opts); await cron(env, iso);
  const m = meta(store); assert.deepEqual(m, good, 'meta unchanged, original times kept');
  assert.deepEqual(csvKeys(store), [good.elements.key], 'previous CSV kept, no new file');
  assert.equal(runs.at(-1)[3], 'down'); assert.match(runs.at(-1)[7], re);
  assert.ok(gpCalls() <= 1, 'never more than one GP request');
});
await failCase('C. login rejected → down, last good kept', '2026-11-03T15:41:00Z', { login: 'fail' }, /login failed/);
await failCase('D. login 522 → down, last good kept', '2026-11-03T17:41:00Z', { login: '522' }, /login failed: HTTP 522/);
await failCase('E. GP HTTP 500 → down, last good kept, no retry', '2026-11-03T19:41:00Z', { gp: () => new Response('err', { status: 500 }) }, /GP HTTP 500/);
await failCase('F. GP empty 200 → down, last good kept', '2026-11-03T21:41:00Z', { gp: () => new Response('', { status: 200 }) }, /empty body/);
await failCase('G. truncated mid-row → validation failed, last good kept', '2026-11-03T23:41:00Z', { gp: () => new Response(GP.slice(0, Math.floor(GP.length * 0.7)), { status: 200 }) }, /validation failed/);
await failCase('H. cut on a complete row at 80 % → refused by the previous-rows floor', '2026-11-04T01:41:00Z', { gp: () => new Response(GP.slice(0, GP.indexOf('\n', Math.floor(GP.length * 0.8)) + 1), { status: 200 }) }, /vs previous valid/);
await t('I. meta write fails → orphan CSV removed, last good kept', async () => {
  const before = meta(store); globalThis.FAIL_PUT = (k) => k === 'latest/orbital.json';
  stub({ gp: () => new Response(variant('b'), { status: 200 }) }); await cron(env, '2026-11-04T03:41:00Z'); globalThis.FAIL_PUT = null;
  assert.deepEqual(meta(store), before); assert.deepEqual(csvKeys(store), [before.elements.key]);
  assert.match(runs.at(-1)[7], /publication failed \(meta write\)/);
});
await t('J. a later valid run replaces: new file + meta, previous CSV deleted, exactly one current file', async () => {
  stub({ gp: () => new Response(variant('c'), { status: 200 }) }); await cron(env, '2026-11-04T05:41:00Z');
  const m = meta(store); assert.notEqual(m.elements.key, good.elements.key); assert.equal(m.retrieved_at, '2026-11-04T05:41:00.000Z');
  assert.deepEqual(csvKeys(store), [m.elements.key]);
});
await t('K. hourly guard shared with the probe: a probe GP request < 60 min before a slot blocks the job', async () => {
  await env.R2.put('state/spacetrack-probe.json', JSON.stringify({ at: '2026-11-04T07:10:00Z' }));
  stub(); await cron(env, '2026-11-04T07:41:00Z'); assert.equal(gpCalls(), 0); assert.match(runs.at(-1)[7], /< 60 min/);
});
await t('L. manual /admin/run/orbital obeys the off-peak and hourly guards', async () => {
  const e = makeEnv(); stub(); NOW = Date.parse('2026-11-04T09:30:00Z');
  await worker.fetch(new Request('https://hub/admin/run/orbital?key=k'), e.env); assert.equal(gpCalls(), 0);
  NOW = Date.parse('2026-11-04T09:44:00Z'); await worker.fetch(new Request('https://hub/admin/run/orbital?key=k'), e.env); assert.equal(gpCalls(), 1);
  stub(); NOW = Date.parse('2026-11-04T10:15:00Z'); await worker.fetch(new Request('https://hub/admin/run/orbital?key=k'), e.env); assert.equal(gpCalls(), 0);
});
await t('M. Satellites layer untouched by the orbital job', async () => {
  assert.equal([...store.keys()].filter(k => k.startsWith('latest/satellites')).length, 0);
});
console.log(`\n${passed}/13 passed`);
