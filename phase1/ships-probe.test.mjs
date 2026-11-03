// Offline test of the private ships probe (hub 0.3.3). No network: the Worker WebSocket is stubbed, R2 in memory.
// Proves: guards before any connection, nothing published, key never stored, bounded wall time, failure recorded.
// Usage: node phase1/ships-probe.test.mjs
import assert from 'node:assert/strict';
import worker from './worker.js';

function makeEnv(extra = {}) {
  const store = new Map();
  const R2 = { async put(k, b) { store.set(k, String(b)); }, async delete(k) { store.delete(k); },
    async get(k) { const b = store.get(k); return b === undefined ? null : { body: b, async json() { return JSON.parse(b); }, async text() { return b; } }; },
    async list() { return { objects: [], truncated: false }; } };
  const st = () => { const x = { async run() { return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; return { bind: () => x, ...x }; };
  return { env: { R2, DB: { prepare: st, async batch() { return []; } }, ADMIN_KEY: 'k', AISSTREAM_KEY: 'AIS-SECRET-123', ...extra }, store };
}
// A fake Workers WebSocket: emits a confirmation then `n` position reports, then (optionally) closes early.
function fakeSocket({ n = 5, closeEarlyMs = null, sendError = null, binary = false } = {}) {
  const L = {}; const sent = [];
  const ws = { accept() {}, send(x) { sent.push(x);
      setTimeout(() => { if (sendError) { emit('message', { data: JSON.stringify({ error: sendError }) }); emit('close', { code: 1008, reason: 'bad key' }); return; }
        emit('message', { data: JSON.stringify({ MessageType: 'SubscriptionConfirmation', Message: {} }) });
        for (let i = 0; i < n; i++) { const m = JSON.stringify({ MessageType: i % 3 ? 'PositionReport' : 'StandardClassBPositionReport', MetaData: { MMSI: 100 + (i % 4), latitude: 1, longitude: 2 }, Message: {} }); emit('message', { data: binary ? new TextEncoder().encode(m).buffer : m }); }
        emit('message', { data: '{not json' });
        if (closeEarlyMs !== null) setTimeout(() => emit('close', { code: 1006, reason: 'gone' }), closeEarlyMs);
      }, 5); },
    close() { setTimeout(() => emit('close', { code: 1000, reason: 'window done' }), 0); },
    addEventListener(t, f) { (L[t] = L[t] || []).push(f); } };
  const emit = (t, e) => (L[t] || []).forEach(f => f(e));
  return { ws, sent };
}
let mode = { kind: 'ok' }, calls = 0, lastSock = null;
globalThis.fetch = async (url, init = {}) => {
  url = String(url); if (!url.includes('aisstream')) return new Response('stub', { status: 503 });
  calls++;
  if (mode.kind === 'throw') throw new Error('network unreachable');
  if (mode.kind === 'http') return { status: 522, webSocket: null, text: async () => 'error code: 522' };
  assert.equal(init.headers.Upgrade, 'websocket');
  lastSock = fakeSocket(mode); return { status: 101, webSocket: lastSock.ws };
};
const probe = (env, w = 10) => worker.fetch(new Request(`https://hub/admin/probe/ships?key=k&window=${w}`), env).then(r => r.json());
let NOW = Date.parse('2026-11-03T17:40:00Z'); const realNow = Date.now; Date.now = () => NOW + (realNow() - BASE); const BASE = realNow();
let passed = 0; const t = async (n, fn) => { await fn(); passed++; console.log('ok -', n); };

await t('A. wrong admin key → 403, no connection', async () => {
  const { env } = makeEnv(); calls = 0;
  assert.equal((await worker.fetch(new Request('https://hub/admin/probe/ships?key=nope'), env)).status, 403); assert.equal(calls, 0);
});
await t('B. no AISSTREAM_KEY secret → refused, no connection', async () => {
  const { env } = makeEnv({ AISSTREAM_KEY: undefined }); calls = 0;
  assert.match((await probe(env)).refused, /AISSTREAM_KEY/); assert.equal(calls, 0);
});
await t('C. one 10 s listen: counts messages + unique vessels by class; parse error counted; nothing published; key not stored', async () => {
  const { env, store } = makeEnv(); mode = { kind: 'ok', n: 9 }; calls = 0;
  const r = await probe(env, 10);
  assert.equal(calls, 1); assert.equal(r.status, 'ok'); assert.equal(r.messages, 9); assert.equal(r.vessels, 4); assert.equal(r.parse_errors, 1); assert.equal(r.confirmed, true);
  assert.ok(r.wall_s >= 9.5 && r.wall_s < 25, r.wall_s);
  assert.deepEqual([...store.keys()], ['state/ships-probe.json']);
  assert.ok(!store.get('state/ships-probe.json').includes('AIS-SECRET-123'));
  assert.ok(JSON.parse(lastSock.sent[0]).APIKey === 'AIS-SECRET-123', 'the key goes to aisstream only');
});
await t('D. second probe inside 10 min → refused before connecting', async () => {
  const { env } = makeEnv(); mode = { kind: 'ok', n: 2 }; await probe(env, 10); calls = 0; NOW += 5 * 60e3;
  assert.match((await probe(env, 10)).refused, /10 minutes/); assert.equal(calls, 0); NOW += 6 * 60e3;
});
await t('E. Cloudflare cannot reach aisstream (522 / no upgrade) → down, reason recorded', async () => {
  const { env } = makeEnv(); mode = { kind: 'http' };
  const r = await probe(env, 10); assert.equal(r.status, 'down'); assert.match(r.reason, /522/);
});
await t('F. network error → down, reason recorded, nothing else written', async () => {
  const { env, store } = makeEnv(); mode = { kind: 'throw' };
  const r = await probe(env, 10); assert.equal(r.status, 'down'); assert.match(r.reason, /unreachable/); assert.deepEqual([...store.keys()], ['state/ships-probe.json']);
});
await t('G. aisstream rejects the subscription (bad key) → down with the source error', async () => {
  const { env } = makeEnv(); mode = { kind: 'ok', sendError: 'Api Key Is Not Valid' };
  const r = await probe(env, 10); assert.equal(r.status, 'down'); assert.match(r.source_error, /Api Key/); assert.equal(r.close.code, 1008);
});
await t('H. binary frames are decoded (aisstream sends bytes)', async () => {
  const { env } = makeEnv(); mode = { kind: 'ok', n: 6, binary: true }; NOW += 11 * 60e3;
  const r = await probe(env, 10); assert.equal(r.messages, 6); assert.equal(r.vessels, 4);
});
await t('I. window is clamped to 10–90 s', async () => {
  const { env } = makeEnv(); mode = { kind: 'ok', n: 1, closeEarlyMs: 50 }; NOW += 11 * 60e3;
  const r = await probe(env, 5000); assert.equal(r.window_s, 90); assert.ok(r.wall_s < 5, 'early close ends the run');
});
console.log(`\n${passed} passed`);
