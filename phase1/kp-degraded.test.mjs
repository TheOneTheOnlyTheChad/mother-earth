// Kp "degraded" fix (hub 0.6.1 + page wording), 8 Nov 2026 — reviews/2026-11-08-kp-degraded-finding.md.
// Hub: kpStatus boundaries (reference = interval start / time_tag) + collectSwpc and collectUsgs envelopes over a fake fetch/R2/D1.
// Page: ME.degradedWhy / ME.freshness / Kp interval wording for every active layer that can be 'degraded'. No network.
// Usage: node --no-warnings phase1/kp-degraded.test.mjs        Break check: OLD_RULE=1 swaps in the old 4 h rule (must FAIL).
import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const W = await import(new URL('./worker.js', import.meta.url));
let n = 0, failed = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('ok -', name); } catch (e) { failed++; console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); } };
const H = 3600e3, T0 = Date.parse('2026-11-08T00:00:00Z');
const kp = process.env.OLD_RULE ? (tag, now) => { const a = (now - Date.parse(tag)) / 1000; return { status: Number.isFinite(a) && a < 4 * 3600 ? 'ok' : 'degraded', reason: null }; } : W.kpStatus;

// ---------- hub: the rule itself
await t('normal cadence: value first seen 3.13 h after its interval start → ok', () => assert.equal(kp('2026-11-08T00:00:00Z', T0 + 3.13 * H).status, 'ok'));
await t('normal cadence: the same value an hour and two later (4.13 h, 5.13 h) → ok (was degraded under the 4 h rule)', () => {
  assert.equal(kp('2026-11-08T00:00:00Z', T0 + 4.13 * H).status, 'ok'); assert.equal(kp('2026-11-08T00:00:00Z', T0 + 5.13 * H).status, 'ok'); });
await t('delayed replacement (next value first seen at 4.13 h): the old value at 6.13 h → ok', () => assert.equal(kp('2026-11-08T00:00:00Z', T0 + 6.13 * H).status, 'ok'));
await t('boundary: 1 s under 7.5 h → ok; exactly 7.5 h → degraded; 1 s over → degraded', () => {
  assert.equal(kp('2026-11-08T00:00:00Z', T0 + 7.5 * H - 1000).status, 'ok');
  assert.equal(kp('2026-11-08T00:00:00Z', T0 + 7.5 * H).status, 'degraded');
  assert.equal(kp('2026-11-08T00:00:00Z', T0 + 7.5 * H + 1000).status, 'degraded'); });
await t('missing replacement: first hourly run past the limit (8.13 h) → degraded, reason = our observation-age limit from the interval start', () => {
  const r = kp('2026-11-08T00:00:00Z', T0 + 8.13 * H); assert.equal(r.status, 'degraded');
  assert.equal(r.reason.code, 'observation_older_than_limit'); assert.equal(r.reason.reference, 'interval start (time_tag)'); assert.equal(r.reason.limit_s, 27000); });
await t('invalid time_tag (unparseable, null, number) → degraded with its own reason, never ok', () => {
  for (const bad of ['not a date', null, undefined, 12345, '']) { const r = kp(bad, T0); assert.equal(r.status, 'degraded'); assert.equal(r.reason && r.reason.code, 'time_tag_invalid'); } });
await t('future time_tag beyond 5 min skew → degraded (time_tag_in_future); within skew → ok', () => {
  const f = kp('2026-11-08T03:00:00Z', T0); assert.equal(f.status, 'degraded'); assert.equal(f.reason && f.reason.code, 'time_tag_in_future');
  assert.equal(kp('2026-11-08T00:04:00Z', T0).status, 'ok'); });
await t('clock-skew boundary: exactly 300 s ahead → ok; 301 s ahead → degraded (time_tag_in_future)', () => {
  assert.equal(kp('2026-11-08T00:05:00Z', T0).status, 'ok');
  const r = kp('2026-11-08T00:05:01Z', T0); assert.equal(r.status, 'degraded'); assert.equal(r.reason.code, 'time_tag_in_future'); });
await t('synthetic ages sampled across the reported 4–8 Nov range (3.13–6.13 h, 0.25 h steps; not a replay of the 102 measured runs) → 0 degraded', () => {
  let d = 0; for (let a = 3.13; a <= 6.131; a += 0.25) if (kp('2026-11-08T00:00:00Z', T0 + a * H).status !== 'ok') d++; assert.equal(d, 0); });

// ---------- hub: collectors over a fake env
function fakeEnv() {
  const store = new Map(), runs = [];
  const R2 = { async put(k, b) { store.set(k, typeof b === 'string' ? b : String(b)); }, async get(k) { const b = store.get(k); return b === undefined ? null : { async json() { return JSON.parse(b); }, async text() { return b; }, body: b }; }, async head() { return null; }, async delete(k) { store.delete(k); }, async list() { return { objects: [] }; } };
  const DB = { prepare(sql) { const mk = a => ({ async run() { if (/collector_runs/.test(sql)) runs.push(a); return {}; }, async all() { return { results: [] }; }, async first() { return null; } }); return { bind: (...a) => mk(a), ...mk([]) }; } };
  return { env: { R2, DB }, store, runs };
}
async function withFetch(body, nowMs, fn) {
  const of = globalThis.fetch, od = Date.now;
  globalThis.fetch = async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  Date.now = () => nowMs;
  try { return await fn(); } finally { globalThis.fetch = of; Date.now = od; }
}
const kpFeed = tag => [{ time_tag: '2026-11-07T21:00:00', Kp: 4, a_running: 27, station_count: 8 }, { time_tag: tag, Kp: 5, a_running: 48, station_count: 8 }];
const latest = (store, layer) => JSON.parse(store.get(`latest-cells/${layer}.json`) || store.get(`latest/${layer}.json`));
await t('collectSwpc at 5.13 h (was degraded): envelope ok, no status_reason, interval start + end published', async () => {
  const { env, store } = fakeEnv();
  await withFetch(kpFeed('2026-11-08T00:00:00'), T0 + 5.13 * H, () => W.collectSwpc(env, T0 + 5.13 * H));
  const e = latest(store, 'swpc'); assert.equal(e.source_status, 'ok'); assert.equal(e.status_reason, null);
  assert.equal(e.index.interval_start, '2026-11-08T00:00:00Z'); assert.equal(e.index.interval_end, '2026-11-08T03:00:00.000Z'); assert.equal(e.index.age_reference, 'interval start (time_tag)'); });
await t('collectSwpc at 8.13 h: envelope degraded with status_reason observation_older_than_limit', async () => {
  const { env, store } = fakeEnv();
  await withFetch(kpFeed('2026-11-08T00:00:00'), T0 + 8.13 * H, () => W.collectSwpc(env, T0 + 8.13 * H));
  const e = latest(store, 'swpc'); assert.equal(e.source_status, 'degraded'); assert.equal(e.status_reason.code, 'observation_older_than_limit'); });
await t('collectSwpc with an invalid newest time_tag: degraded (time_tag_invalid), value still published', async () => {
  const { env, store } = fakeEnv();
  await withFetch(kpFeed('garbage'), T0, () => W.collectSwpc(env, T0));
  const e = latest(store, 'swpc'); assert.equal(e.source_status, 'degraded'); assert.equal(e.status_reason.code, 'time_tag_invalid'); assert.equal(e.index.value, 5); });
await t('collectUsgs with no metadata.generated → degraded (outcome unchanged) with feed_age_unknown, never feed_not_refreshed', async () => {
  const x = fakeEnv(); await withFetch({ metadata: {}, features: [] }, T0, () => W.collectUsgs(x.env, T0));
  const e = latest(x.store, 'usgs'); assert.equal(e.source_status, 'degraded'); assert.equal(e.status_reason.code, 'feed_age_unknown'); assert.equal(e.status_reason.age_s, undefined); });
await t('collectUsgs with a stale feed: degraded with feed_not_refreshed (limit 600 s); fresh feed: ok, no reason', async () => {
  const feed = gen => ({ metadata: { generated: gen }, features: [] });
  let x = fakeEnv(); await withFetch(feed(T0 - 1200e3), T0, () => W.collectUsgs(x.env, T0));
  let e = latest(x.store, 'usgs'); assert.equal(e.source_status, 'degraded'); assert.equal(e.status_reason.code, 'feed_not_refreshed'); assert.equal(e.status_reason.limit_s, 600);
  x = fakeEnv(); await withFetch(feed(T0 - 60e3), T0, () => W.collectUsgs(x.env, T0));
  e = latest(x.store, 'usgs'); assert.equal(e.source_status, 'ok'); assert.equal(e.status_reason, null); });

// ---------- page wording (app.js in Node, no DOM)
globalThis.window = globalThis; globalThis.document = {};
new Function(readFileSync(new URL('../app.js', import.meta.url), 'utf8'))();
const ME = globalThis.ME;
const now = new Date().toISOString(), snapBase = layer => ({ layer, retrieved_at: now, stale_after_s: 99999, source_status: 'degraded', cells: {} });
const why = (layer, extra) => { ME.state[layer] = { ...snapBase(layer), ...extra }; return ME.freshness(layer); };
const NEVER = /source flagged|source degraded/i;
await t('Kp degraded: names our observation-age limit, the interval start and "provisional"; never blames the source', () => {
  const f = why('swpc', { status_reason: { code: 'observation_older_than_limit', age_s: 29268, limit_s: 27000, reference: 'interval start (time_tag)' } });
  assert.equal(f.grade, 'partial'); assert.match(f.why, /observation-age limit/); assert.match(f.why, /start of its 3-hour interval/); assert.match(f.why, /7\.5 h, provisional/);
  assert.match(f.why, /not by the source/); assert.doesNotMatch(f.why, NEVER); assert.doesNotMatch(f.why, /time_tag/); });
await t('Kp invalid / future timestamps: their own wording, no age claimed', () => {
  assert.match(why('swpc', { status_reason: { code: 'time_tag_invalid' } }).why, /could not be read/);
  assert.match(why('swpc', { status_reason: { code: 'time_tag_in_future', age_s: -10800 } }).why, /later than our clock/); });
await t('usgs, co2, seaice: freshness-rule wording with their own limits (days for daily products)', () => {
  assert.match(why('usgs', { status_reason: { code: 'feed_not_refreshed', age_s: 1200, limit_s: 600 } }).why, /generated 20 min before our retrieval, beyond our 10 min feed-age limit/);
  assert.match(why('co2', { status_reason: { code: 'observation_older_than_limit', age_s: 8 * 86400, limit_s: 7 * 86400 } }).why, /8 days old.*our limit: 7 days\)/);
  assert.match(why('seaice', { status_reason: { code: 'observation_older_than_limit', age_s: 6 * 86400, limit_s: 5 * 86400 } }).why, /6 days old.*our limit: 5 days\)/); });
await t('ships (Mac envelope, no reason code): flowing fraction < 90% → flow wording, never "late"', () => {
  const f = why('ships', { window_s: 60, connection_fraction_of_sample: 0.62, overlong_sample: false, elapsed_wall_s: 61 });
  assert.match(f.why, /messages flowed for 62% of the 60 s sample \(inferred from arrival gaps\), below our 90% standard/); assert.doesNotMatch(f.why, /late|freshness|age limit/i); assert.doesNotMatch(f.why, NEVER); });
await t('ships (Mac envelope): overlong → overlong wording (not described as low flow), never "late"', () => {
  const f = why('ships', { window_s: 60, connection_fraction_of_sample: 1, overlong_sample: true, elapsed_wall_s: 95.4 });
  assert.match(f.why, /ran 95\.4 s against a 60 s window, over our 75 s limit \(1\.25 × the window\)/); assert.doesNotMatch(f.why, /late|freshness|age limit|flowed/i); });
await t('ships (cloud fallback reason codes): both conditions worded from the hub reason', () => {
  assert.match(why('ships', { status_reason: { code: 'sample_flow_below_standard', fraction: 0.5, window_s: 60 } }).why, /messages flowed for 50% of the 60 s sample/);
  assert.match(why('ships', { status_reason: { code: 'sample_overlong', elapsed_s: 80, window_s: 60 } }).why, /ran 80 s against a 60 s window, over our 75 s limit/); });
await t('ships near the boundaries (cloud reason AND Mac envelope): 76 s, 75.04 s, 89.9%, 89.99% keep the condition visible', () => {
  const cloud = r => why('ships', { status_reason: r }).why, mac = x => why('ships', { window_s: 60, ...x }).why;
  for (const w of [cloud({ code: 'sample_overlong', elapsed_s: 76, window_s: 60 }), mac({ overlong_sample: true, elapsed_wall_s: 76, connection_fraction_of_sample: 1 })]) {
    assert.match(w, /ran 76 s against a 60 s window, over our 75 s limit/); assert.doesNotMatch(w, /1 min/); }
  for (const w of [cloud({ code: 'sample_overlong', elapsed_s: 75.04, window_s: 60 }), mac({ overlong_sample: true, elapsed_wall_s: 75.04, connection_fraction_of_sample: 1 })]) {
    assert.match(w, /ran 75\.04 s against a 60 s window, over our 75 s limit/); }
  for (const f of [0.899, 0.8999]) for (const w of [cloud({ code: 'sample_flow_below_standard', fraction: f, window_s: 60 }), mac({ overlong_sample: false, elapsed_wall_s: 60, connection_fraction_of_sample: f })]) {
    assert.match(w, /messages flowed for 89\.9% of the 60 s sample/); assert.match(w, /below our 90% standard/); assert.doesNotMatch(w, /for 90%/); } });
await t('unknown reason / no reason (older hub): neutral collection-quality wording, no cause invented, never "source flagged"', () => {
  for (const [layer, extra] of [['co2', {}], ['swpc', { status_reason: { code: 'something_new' } }], ['usgs', {}]]) {
    const f = why(layer, extra); assert.match(f.why, /below our collection-quality standard/); assert.doesNotMatch(f.why, NEVER); } });
await t('forest keeps its specific sweep wording (not routed through the degraded text)', () => {
  ME.state.forest = { ...snapBase('forest'), sweep: { answered: 10, cells_total: 20 } };
  const f = ME.freshness('forest'); assert.match(f.why, /first sweep in progress/); assert.doesNotMatch(f.why, NEVER); });
// readings + report: the ACTUAL card and summary text, not just degradedWhy()
const kpSnap = (tag, status = 'ok', reason = null) => ({ ...snapBase('swpc'), source_status: status, status_reason: reason, index: { value: 5, time_tag: tag } });
const kpOut = tag => { for (const l of Object.keys(ME.state)) ME.state[l] = null; ME.state.swpc = kpSnap(tag, 'degraded', { code: 'time_tag_invalid' });
  const R = ME.readings(); return { card: R.swpc.observed, report: ME.report(R).text }; };
await t('readings/report with a normal Kp timestamp: card + summary show the interval and "began … ago"', () => {
  const tag = new Date(Date.now() - 2 * 3600e3).toISOString().slice(0, 13) + ':00:00Z';
  for (const l of Object.keys(ME.state)) ME.state[l] = null; ME.state.swpc = kpSnap(tag);
  const R = ME.readings(), rep = ME.report(R).text;
  assert.match(R.swpc.observed, /^interval \d\d:00–\d\d:00 UTC, began [\d.]+ (h|min) ago; 3-hourly product, timestamped at the interval start$/);
  assert.match(rep, /Kp 5, interval \d\d:00–\d\d:00 UTC, began [\d.]+ (h|min) ago \(NOAA SWPC\)/); });
await t('readings/report with an INVALID Kp timestamp: "interval time unknown", no NaN, no "unknown interval (began"', () => {
  for (const bad of ['garbageZ', '', null]) { const o = kpOut(bad);
    for (const x of [o.card, o.report]) { assert.doesNotMatch(String(x), /NaN|unknown interval|began unknown/); } assert.match(o.card, /^interval time unknown/); assert.match(o.report, /Kp 5, interval time unknown/); } });
await t('readings/report with a FUTURE Kp timestamp: "timestamp later than our clock", never a negative age', () => {
  const o = kpOut(new Date(Date.now() + 3 * 3600e3).toISOString());
  for (const x of [o.card, o.report]) { assert.match(x, /timestamp later than our clock/); assert.doesNotMatch(x, /-\d|ago/); } });
await t('usgs collector → page: missing metadata.generated reads as unknown age, never "beyond our limit"', async () => {
  const x = fakeEnv(); await withFetch({ metadata: {}, features: [] }, Date.now(), () => W.collectUsgs(x.env, Date.now()));
  ME.state.usgs = latest(x.store, 'usgs'); const f = ME.freshness('usgs');
  assert.equal(f.grade, 'partial'); assert.match(f.why, /no usable generation time, so its age is unknown and our 10 min feed-age limit could not be applied/); assert.doesNotMatch(f.why, /beyond|generated unknown/); });
await t('Kp shown as an interval, not an instant: "00:00–03:00 UTC"; summary never says "source degraded"', () => {
  assert.equal(ME.kpInterval('2026-11-08T00:00:00Z'), '00:00–03:00 UTC'); assert.equal(ME.kpInterval('2026-11-07T21:00:00Z'), '21:00–00:00 UTC'); assert.equal(ME.kpInterval('x'), null);
  const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8'); assert.doesNotMatch(src, NEVER); assert.doesNotMatch(src, /Kp \$\{R\.swpc\.value\} observed/); });

console.log(`\nkp-degraded: ${n} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
