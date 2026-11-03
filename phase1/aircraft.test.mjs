// Aircraft (OpenSky) — collector parser + dry-run envelope, no network (fetch stubbed). Run: node phase1/aircraft.test.mjs
import assert from 'node:assert/strict';
import { FEEDS, openskyRows } from './collector-mac.mjs';
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };
const T = 1793680000;
const sv = (icao, lat, lng, extra = {}) => [icao, extra.cs ?? 'SAA123 ', extra.country ?? 'South Africa', extra.tpos === undefined ? T - 3 : extra.tpos, T - 1, lng, lat, extra.alt ?? 10668, !!extra.ground, 230.5, 87.2, null, 11000, '1234', false, 0, 0];
await t('rows: position required, dedup by icao24, source position time kept, never "now"', async () => {
  const o = openskyRows({ time: T, states: [sv('abc123', -33.9, 18.6), sv('abc123', -33.8, 18.7), sv('def456', null, 18), sv('aaa111', -26.1, 28.2, { tpos: null, ground: true })] });
  assert.equal(o.rows.length, 2); assert.equal(o.noPos, 1); assert.equal(o.dup, 1);
  const [a, b] = o.rows;
  assert.deepEqual([a[0], a[1], a[2], a[3], a[5]], ['abc123', -33.9, 18.6, new Date((T - 3) * 1000).toISOString(), 'SAA123']);
  assert.equal(b[3], null, 'no time_position → observed_at null');
  assert.equal(b[8], true);
  assert.equal(o.coverageDefault.grade, 'partial');
});
await t('rows: out-of-range coordinates are dropped, not clamped', async () => {
  const o = openskyRows({ states: [sv('x1', 95, 10), sv('x2', 10, 190)] }); assert.equal(o.rows.length, 0); assert.equal(o.noPos, 2);
});
await t('feed: OAuth token then one states request; credits carried; source time is the window', async () => {
  process.env.OPENSKY_CLIENT_ID = 'id'; process.env.OPENSKY_CLIENT_SECRET = 'secret';
  const calls = [];
  globalThis.fetch = async (url, init = {}) => { calls.push([String(url), init.method || 'GET', init.headers && init.headers.Authorization]);
    if (String(url).includes('/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 1800 }), { status: 200 });
    return new Response(JSON.stringify({ time: T, states: [sv('abc123', -33.9, 18.6)] }), { status: 200, headers: { 'X-Rate-Limit-Remaining': '3996' } }); };
  const f = await FEEDS.opensky();
  assert.equal(calls.length, 2); assert.equal(calls[0][1], 'POST'); assert.equal(calls[1][0], 'https://opensky-network.org/api/states/all'); assert.equal(calls[1][2], 'Bearer tok');
  assert.equal(f.rows.length, 1); assert.equal(f.extra.credits_remaining, 3996); assert.equal(f.extra.window_end, new Date(T * 1000).toISOString());
  assert.match(f.extra.citation, /OpenSky Network/);
});
await t('feed: a non-200 throws (→ the collector reports the source down; nothing published as zero)', async () => {
  globalThis.fetch = async (url) => String(url).includes('/token') ? new Response('{"access_token":"t"}', { status: 200 }) : new Response('busy', { status: 429, headers: { 'X-Rate-Limit-Remaining': '0' } });
  await assert.rejects(FEEDS.opensky(), /states http 429 \(credits remaining 0\)/);
});
await t('feed: missing credentials is a config error, before any request', async () => {
  delete process.env.OPENSKY_CLIENT_ID; let called = false; globalThis.fetch = async () => { called = true; };
  await assert.rejects(FEEDS.opensky(), /OPENSKY_CLIENT_ID/); assert.equal(called, false);
});
console.log(`\n${n} passed`);
