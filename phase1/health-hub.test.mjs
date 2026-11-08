// Offline test of the hub's external-monitor health checks (collector 0.5.3, branch hub-health).
// No network: USGS + FIRMS stubbed; R2 in memory (with head().uploaded); D1 = a REAL SQLite database (node:sqlite) loaded with
// phase1/schema.sql, driven through the REAL scheduled jobs and the REAL fetch route. Clock controlled (Date + new Date()).
// Usage: node --no-warnings phase1/health-hub.test.mjs
//        WORKER=<path to a modified worker.js> node --no-warnings phase1/health-hub.test.mjs   (used by health-breaks.sh)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const WPATH = process.env.WORKER ? pathToFileURL(process.env.WORKER).href : new URL('./worker.js', import.meta.url).href;
const SCHEMA = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const { default: worker, ...W } = await import(WPATH);

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e && e.message || e).split('\n').slice(0, 4).join('\n    ')); } };

// ---------- clock
let NOW = Date.parse('2026-11-05T10:00:00Z');
{ const RealDate = Date; globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const at = iso => { NOW = Date.parse(iso); };

// ---------- D1 over SQLite, R2 in memory
function makeEnv(extra = {}, o = {}) {
  const db = new DatabaseSync(':memory:'); if (!o.noSchema) db.exec(SCHEMA);
  const fail = { select: null, write: null };
  const prep = sql => { const mk = args => ({ sql, args,
    async run() { if (fail.write && fail.write.test(sql)) throw new Error('D1 stub: forced write failure'); const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
    async first() { if (fail.select && fail.select.test(sql)) throw new Error('D1 stub: forced read failure'); return db.prepare(sql).get(...args) ?? null; },
    async all() { if (fail.select && fail.select.test(sql)) throw new Error('D1 stub: forced read failure'); return { results: db.prepare(sql).all(...args) }; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const D1 = { prepare: prep, async batch(stmts) { const out = []; for (const s of stmts) { if (/^\s*SELECT/i.test(s.sql)) out.push(await s.all()); else { await s.run(); out.push({ results: [] }); } } return out; } };
  const store = new Map(); const r2 = { failPut: null, failHead: false };
  const R2 = {
    async put(k, body, m = {}) { if (r2.failPut && r2.failPut.test(k)) throw new Error('R2 stub: forced put failure'); store.set(k, { body: body instanceof Uint8Array ? body : String(body), meta: m, uploaded: new Date(NOW), etag: '"' + Math.random().toString(36).slice(2) + '"' }); },
    async get(k) { const v = store.get(k); if (!v) return null; const b = v.body; return { body: b, httpEtag: v.etag, uploaded: v.uploaded, customMetadata: v.meta.customMetadata, async json() { return JSON.parse(b); }, async text() { return String(b); }, async arrayBuffer() { return typeof b === 'string' ? new TextEncoder().encode(b).buffer : b.buffer; } }; },
    async head(k) { if (r2.failHead) throw new Error('R2 stub: head failed'); const v = store.get(k); return v ? { key: k, uploaded: v.uploaded, httpEtag: v.etag, size: String(v.body).length } : null; },
    async delete(k) { store.delete(k); },
    async list({ prefix, include } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, ...(include && include.includes('customMetadata') ? { customMetadata: (store.get(key).meta || {}).customMetadata } : {}) })), truncated: false }; },
  };
  return { env: { R2, DB: D1, ADMIN_KEY: 'admin-key-0123456789abcdef', FIRMS_MAP_KEY: 'firmskey0123456789abcdef', ...extra }, db, store, fail, r2 };
}
const rows = (db, sql, ...a) => db.prepare(sql).all(...a);

// ---------- sources
let firmsMode = 'ok', firmsBody = null;
const firmsCsv = (n = 3) => 'latitude,longitude,acq_date,acq_time,confidence,frp,satellite,daynight\n' + Array.from({ length: n }, (_, i) => `${-20 + i * 0.1},30,${new Date(NOW).toISOString().slice(0, 10)},0800,n,${5 + i},N20,D`).join('\n') + '\n';
globalThis.fetch = async url => { url = String(url);
  if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: NOW - 60e3 }, features: [{ type: 'Feature', id: 'us1', geometry: { type: 'Point', coordinates: [18, -33, 10] }, properties: { mag: 3, magType: 'ml', time: NOW - 3600e3, updated: 1000, place: 'x', status: 'automatic', title: 'M 3', url: 'u' } }] }), { status: 200 });
  if (url.includes('firms.modaps')) {
    if (firmsMode === 'http500') return new Response('Internal error', { status: 500 });
    if (firmsMode === 'empty') return new Response('latitude,longitude,acq_date,acq_time,confidence,frp,satellite,daynight\n', { status: 200 });
    if (firmsMode === 'body') return new Response(firmsBody, { status: 200 });
    if (firmsMode === 'throw') throw new TypeError('network connection lost while fetching https://firms.modaps.eosdis.nasa.gov/api/area/csv/firmskey0123456789abcdef/VIIRS');
    return new Response(firmsCsv(), { status: 200 });
  }
  return new Response('stub', { status: 503 }); };
const ctx = { waitUntil() {} };
const five = env => worker.scheduled({ cron: '*/5 * * * *', scheduledTime: NOW }, env, ctx);
const firms = env => worker.scheduled({ cron: '*/15 * * * *', scheduledTime: NOW }, env, ctx);
/** Run every scheduled slot from the current clock up to `untilIso` (exclusive), moving the clock. */
async function runUntil(env, untilIso, { usgs = true, fires = true } = {}) {
  const end = Date.parse(untilIso);
  let s = Math.ceil(NOW / 300e3) * 300e3;
  for (; s < end; s += 300e3) { NOW = s; if (usgs) await five(env); if (fires && s % 900e3 === 0) await firms(env); }
  NOW = end;
}
const req = (path, method = 'GET') => new Request('https://hub' + path, { method });
async function check(env, path, method = 'GET') { const r = await worker.fetch(req(path, method), env); const text = await r.text(); return { status: r.status, headers: r.headers, text, body: text ? JSON.parse(text) : null }; }
const ALL = ['/health/runs/usgs', '/health/runs/firms', '/health/publication/usgs', '/health/publication/firms', '/health/archive/firms', '/health/archive/usgs', '/health/coverage/firms', '/health/coverage/usgs'];

// A steady, healthy hub with history on: two full days of normal slots so yesterday's checkpoints exist.
async function healthyHub(extra = {}) {
  const h = makeEnv({ HISTORY_ENABLED: '1', ...extra }); firmsMode = 'ok';
  at('2026-11-04T22:00:00Z'); await runUntil(h.env, '2026-11-06T09:00:30Z');   // the 09:00 slot has run
  return h;
}

// ================= H0 baseline
await t('H0. a steady hub: all 8 checks answer 200 (GET), HEAD gives the same status with no body, no-store on both', async () => {
  const { env } = await healthyHub();
  for (const p of ALL) {
    const g = await check(env, p); assert.equal(g.status, 200, p + ' ' + g.text); assert.equal(g.body.healthy, true); assert.equal(g.body.verdict, 'ok');
    assert.match(g.headers.get('cache-control'), /no-store/); assert.equal(g.headers.get('x-health'), 'ok');
    const h = await check(env, p, 'HEAD'); assert.equal(h.status, 200, 'HEAD ' + p); assert.equal(h.text, '', 'HEAD has no body'); assert.match(h.headers.get('cache-control'), /no-store/);
  }
});

// ================= H1 stopped scheduling
await t('H1a. usgs (*/5) trigger stops: runs/usgs stays 200 for 20 min (3 slots + 5 min), then 503 with the reason; firms checks unaffected', async () => {
  const { env } = await healthyHub();
  await runUntil(env, '2026-11-06T09:20:00Z', { usgs: false });
  assert.equal((await check(env, '/health/runs/usgs')).status, 200, 'last usgs run 09:00, 20 min allowed (inclusive)');
  NOW += 60e3; const r = await check(env, '/health/runs/usgs');
  assert.equal(r.status, 503); assert.match(r.body.reasons[0], /no usgs run has completed for \d+ s .*scheduling stopped/);
  assert.equal((await check(env, '/health/runs/firms')).status, 200); assert.equal((await check(env, '/health/publication/firms')).status, 200);
  const h = await check(env, '/health/runs/usgs', 'HEAD'); assert.equal(h.status, 503); assert.equal(h.text, '');
});
await t('H1b. firms (*/15) trigger stops: runs/firms and publication/firms both 503 after 50 min (3 slots + 5 min); usgs unaffected', async () => {
  const { env } = await healthyHub();
  await runUntil(env, '2026-11-06T09:50:00Z', { fires: false });   // last firms run at 09:00
  assert.equal((await check(env, '/health/runs/firms')).status, 200);
  assert.equal((await check(env, '/health/publication/firms')).status, 200);
  NOW += 60e3;
  const a = await check(env, '/health/runs/firms'), b = await check(env, '/health/publication/firms');
  assert.equal(a.status, 503); assert.equal(b.status, 503); assert.match(b.body.reasons.join(' '), /no firms publication since 2026-11-06T09:00/);
  assert.equal((await check(env, '/health/runs/usgs')).status, 200);
});

// ================= H2 failed publication
await t('H2a. FIRMS answers HTTP 500 three slots running: runs/firms stays 200 (runs complete), publication/firms 503 naming the latest failure', async () => {
  const { env } = await healthyHub();
  firmsMode = 'http500'; await runUntil(env, '2026-11-06T09:46:00Z');
  assert.equal((await check(env, '/health/publication/firms')).status, 200, 'two failed slots (09:15, 09:30) are not yet an incident');
  await runUntil(env, '2026-11-06T09:51:00Z');
  const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503); assert.match(p.body.reasons.join(' '), /latest run down: http 500/);
  assert.equal((await check(env, '/health/runs/firms')).status, 200, 'the scheduler is fine — a different monitor stays green');
});
await t('H2b. resource guard: the first guarded run fails publication/firms immediately (no 50-min wait)', async () => {
  const { env } = await healthyHub();
  firmsMode = 'body'; firmsBody = 'latitude,longitude,acq_date,acq_time,confidence,frp,satellite,daynight\n' + 'x'.repeat(W.FIRMS_MAX_PARSE_BYTES + 10);
  await runUntil(env, '2026-11-06T09:16:00Z');
  const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503); assert.match(p.body.reasons.join(' '), /resource guard/);
  firmsMode = 'ok';
});
await t('H2c. publication write fails (R2 put of latest/ refused): run logged down, file not updated → 503 after 50 min', async () => {
  const h = await healthyHub(); const { env } = h;
  h.r2.failPut = /^latest\/firms\.json$/; await runUntil(env, '2026-11-06T09:51:00Z'); h.r2.failPut = null;
  const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503); assert.match(p.body.reasons.join(' '), /uncaught: Error: R2 stub: forced put failure/);
});
await t('H2d. the run log says ok but the published file was not rewritten (stale latest/): 503 — log and file disagree, and the older one counts', async () => {
  const h = await healthyHub(); const { env, store } = h;
  const old = store.get('latest/firms.json'); old.uploaded = new Date(Date.parse('2026-11-06T07:30:00Z'));
  const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503); assert.match(p.body.reasons.join(' '), /disagree/); assert.match(p.body.reasons.join(' '), /no firms publication since 2026-11-06T07:30/);
});

// ================= H3 the FIRMS day boundary (expected empty files) must not alert — and must not mask a real failure
await t('H3a. normal night: last publication 23:45, header-only files 00:00–03:45, data again 04:00 → publication/firms 200 throughout', async () => {
  const { env } = await healthyHub();
  at('2026-11-06T23:31:00Z'); await runUntil(env, '2026-11-06T23:46:00Z');
  firmsMode = 'empty';
  for (const x of ['2026-11-07T00:40:00Z', '2026-11-07T02:00:00Z', '2026-11-07T03:59:00Z', '2026-11-07T04:10:00Z']) { await runUntil(env, x); const p = await check(env, '/health/publication/firms'); assert.equal(p.status, 200, x + ' ' + p.text); }
  firmsMode = 'ok'; await runUntil(env, '2026-11-07T04:20:00Z');
  assert.equal((await check(env, '/health/publication/firms')).status, 200);
});
await t('H3b. still empty after the boundary: 503 from 04:35 (last expected-empty slot 03:45 + 50 min), reason names the empty response', async () => {
  const { env } = await healthyHub();
  at('2026-11-06T23:31:00Z'); await runUntil(env, '2026-11-06T23:46:00Z');
  firmsMode = 'empty'; await runUntil(env, '2026-11-07T04:35:00Z');
  assert.equal((await check(env, '/health/publication/firms')).status, 200);
  await runUntil(env, '2026-11-07T04:36:00Z'); const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503); assert.match(p.body.reasons.join(' '), /empty response .*not a validated zero/);
  firmsMode = 'ok';
});
await t('H3c. a REAL failure inside the boundary window is not masked: HTTP 500 from 00:00 → 503 from 00:36 (last acceptable run 23:45 + 50 min)', async () => {
  const { env } = await healthyHub();
  at('2026-11-06T23:31:00Z'); await runUntil(env, '2026-11-06T23:46:00Z');
  firmsMode = 'http500'; await runUntil(env, '2026-11-07T00:41:00Z');
  const p = await check(env, '/health/publication/firms');
  assert.equal(p.status, 503, p.text); assert.match(p.body.reasons.join(' '), /expected empty file .*latest run down: http 500/);
  firmsMode = 'ok';
});

// ================= H4 overdue checkpoint and new gaps
await t('H4a. checkpoint marker write fails all night: archive/firms 200 until 02:00, 503 after; archive/usgs unaffected', async () => {
  const h = await healthyHub(); const { env } = h;
  at('2026-11-06T23:00:00Z'); await runUntil(env, '2026-11-07T00:00:00Z');
  // layer-specific failure: only the FIRMS completion marker is refused (usgs completes normally)
  const prep0 = h.env.DB.prepare; h.env.DB.prepare = sql => { const p = prep0(sql); if (!/INSERT OR IGNORE INTO archive_checkpoints/.test(sql)) return p;
    const b0 = p.bind; return { ...p, bind: (...a) => { const s = b0(...a); return a[0] === 'firms' ? { ...s, async run() { throw new Error('D1 stub: firms marker refused'); } } : s; } }; };
  await runUntil(env, '2026-11-07T02:00:00Z');
  assert.equal((await check(env, '/health/archive/firms')).status, 200, 'pending, but within 2 h of the day closing');
  await runUntil(env, '2026-11-07T02:06:00Z');
  const a = await check(env, '/health/archive/firms');
  assert.equal(a.status, 503); assert.match(a.body.reasons[0], /checkpoint for 2026-11-06 is not complete 2\.1 h after the day closed/);
  assert.equal((await check(env, '/health/archive/usgs')).status, 200, 'usgs completed: separate monitor stays green');
  h.env.DB.prepare = prep0;   // recovery: the next run completes the day
  await runUntil(env, '2026-11-07T02:16:00Z');
  assert.equal((await check(env, '/health/archive/firms')).status, 200, 'recovered once the marker is written');
});
await t('H4b. a new archive gap fails archive/<layer> for 24 h, then the check recovers while the gap stays listed (never erased)', async () => {
  const h = await healthyHub(); const { env, db } = h;
  db.prepare('INSERT INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').run('firms', '2026-11-03', 'the retained snapshots for this day expired', '2026-11-06T09:00:00.000Z');
  const a = await check(env, '/health/archive/firms'); assert.equal(a.status, 503); assert.match(a.body.reasons.join(' '), /new archive gap: firms 2026-11-03/);
  at('2026-11-07T09:01:00Z'); await runUntil(env, '2026-11-07T09:16:00Z');   // 6 Nov completes on the 09:15 firms run
  const b = await check(env, '/health/archive/firms'); assert.equal(b.status, 200, b.text);
  assert.ok(b.body.facts.recorded_gaps.some(g => g.day === '2026-11-03'), 'the gap is still listed');
  const st = await check(env, '/status'); assert.ok(st.body.archive_health.gaps.some(g => g.day === '2026-11-03'), 'and still in /status');
});
await t('H4c. history stopped writing activity yesterday (e.g. every history step failing): a silent miss is caught', async () => {
  const h = await healthyHub(); const { env, db } = h;
  db.prepare("DELETE FROM history_activity WHERE layer='firms' AND day='2026-11-05'").run();
  db.prepare("DELETE FROM archive_checkpoints WHERE layer='firms' AND day='2026-11-05'").run();
  const a = await check(env, '/health/archive/firms'); assert.equal(a.status, 503); assert.match(a.body.reasons.join(' '), /firms 2026-11-05 has neither a checkpoint nor a recorded gap .* missed silently/);
});
await t('H4d. history switched off: archive checks fail closed with the reason (pause the monitor if intended)', async () => {
  const { env } = await healthyHub(); env.HISTORY_ENABLED = '0';
  const a = await check(env, '/health/archive/firms'); assert.equal(a.status, 503); assert.match(a.body.reasons[0], /history collection is off/);
});

// ================= H5 coverage
await t('H5. coverage: yesterday current → 200; stale → 503; before the checkpoint completes → 200 "not assessed yet"; marker without coverage → 503', async () => {
  const h = await healthyHub(); const { env, db } = h;
  assert.equal((await check(env, '/health/coverage/firms')).status, 200);
  db.prepare("UPDATE archive_checkpoint_coverage SET input_status='stale', failed_runs_after_cutoff=33, failure_reasons=? WHERE layer='firms' AND day='2026-11-05'").run(JSON.stringify(['raw archived; processing skipped: resource guard (size > limit)']));
  const s = await check(env, '/health/coverage/firms'); assert.equal(s.status, 503); assert.match(s.body.reasons[0], /stale input .*33 failed runs/);
  assert.equal((await check(env, '/health/coverage/usgs')).status, 200, 'usgs coverage is a separate monitor');
  at('2026-11-07T00:10:00Z'); const n = await check(env, '/health/coverage/firms');   // 6 Nov not yet checkpointed
  assert.equal(n.status, 200); assert.match(n.body.facts.state, /not assessed yet/);
  at('2026-11-06T09:00:00Z'); db.prepare("DELETE FROM archive_checkpoint_coverage WHERE layer='firms' AND day='2026-11-05'").run();
  const m = await check(env, '/health/coverage/firms'); assert.equal(m.status, 503); assert.match(m.body.reasons[0], /has no coverage record/);
});

// ================= H6 unreadable health data never reads as healthy
await t('H6a. D1 read failure: every check 503 "health data unreadable" (GET and HEAD)', async () => {
  const h = await healthyHub(); h.fail.select = /collector_runs|history_activity|archive_/;
  for (const p of ALL) { const g = await check(h.env, p); assert.equal(g.status, 503, p); assert.match(g.body.reasons[0], /health data unreadable/); assert.equal((await check(h.env, p, 'HEAD')).status, 503, 'HEAD ' + p); }
});
await t('H6b. tables missing (schema not loaded) → 503, never 200', async () => {
  const { env } = makeEnv({ HISTORY_ENABLED: '1' }, { noSchema: true });
  for (const p of ALL) assert.equal((await check(env, p)).status, 503, p);
});
await t('H6c. empty database (no runs ever) → 503 for runs/publication; archive 200 only because nothing is due (stated in facts)', async () => {
  const { env } = makeEnv({ HISTORY_ENABLED: '1' });
  for (const p of ['/health/runs/usgs', '/health/runs/firms', '/health/publication/usgs', '/health/publication/firms']) { const g = await check(env, p); assert.equal(g.status, 503, p); assert.match(g.body.reasons[0], /ever/); }
  const a = await check(env, '/health/archive/firms'); assert.equal(a.status, 200); assert.equal(a.body.facts.established_before_yesterday, false, 'stated: no evidence that history ever ran, so nothing is due');
});
await t('H6d. R2 head() throws, latest/ file missing, or a run time is unparsable → 503', async () => {
  let h = await healthyHub(); h.r2.failHead = true; assert.equal((await check(h.env, '/health/publication/firms')).status, 503);
  h = await healthyHub(); h.store.delete('latest/firms.json'); const m = await check(h.env, '/health/publication/firms'); assert.equal(m.status, 503); assert.match(m.body.reasons.join(' '), /missing: nothing is published/);
  h = await healthyHub(); h.db.prepare("INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES ('firms','x','not-a-time','ok',200,1,1,'')").run();
  const u = await check(h.env, '/health/runs/firms'); assert.equal(u.status, 503); assert.match(u.body.reasons[0], /unreadable: unparsable time/);
});

// ================= H7 recovery
await t('H7. recovery: after 70 min of HTTP 500 the first good FIRMS run turns publication/firms back to 200 at once', async () => {
  const { env } = await healthyHub();
  firmsMode = 'http500'; await runUntil(env, '2026-11-06T10:10:00Z');
  assert.equal((await check(env, '/health/publication/firms')).status, 503);
  firmsMode = 'ok'; await runUntil(env, '2026-11-06T10:16:00Z');
  const p = await check(env, '/health/publication/firms'); assert.equal(p.status, 200, p.text); assert.equal(p.body.facts.last_publication.logged_ok_finished_at.slice(0, 16), '2026-11-06T10:15');
  await runUntil(env, '2026-11-06T10:40:00Z', { usgs: false }); assert.equal((await check(env, '/health/runs/usgs')).status, 503);
  await runUntil(env, '2026-11-06T10:46:00Z'); assert.equal((await check(env, '/health/runs/usgs')).status, 200, 'scheduler recovered');
});

// ================= H8 nothing secret, nothing admin
await t('H8. a run note carrying the FIRMS key (fetch error with the URL) is redacted in every health answer AND in /status', async () => {
  const { env } = await healthyHub(); firmsMode = 'throw'; await runUntil(env, '2026-11-06T10:00:00Z'); firmsMode = 'ok';
  const st = await check(env, '/status');
  assert.ok(!st.text.includes(env.FIRMS_MAP_KEY) && !st.text.includes(env.ADMIN_KEY), '/status no longer exposes the key (rev 2)');
  assert.match(st.text, /fetch failed: TypeError: network connection lost while fetching .*\[redacted\]/, 'the note survives, minus the key');
  assert.match(st.text, /"collector_version":"\d+\.\d+\.\d+"/, 'non-note strings are intact');
  for (const p of ALL) { const g = await check(env, p); for (const v of [env.FIRMS_MAP_KEY, env.ADMIN_KEY]) assert.ok(!g.text.includes(v), p + ' leaks a secret'); }
  const p = await check(env, '/health/publication/firms'); assert.match(p.text, /\[redacted\]/);
});

// ================= H9 routing
await t('H9. unknown check → 404 listing the checks; POST → 405; the 8 known checks are exactly the monitor list', async () => {
  const { env } = await healthyHub();
  const u = await check(env, '/health/archive/ships'); assert.equal(u.status, 404); assert.deepEqual(u.body.checks.sort(), ALL.slice().sort());
  assert.equal((await check(env, '/health/runs/firms', 'POST')).status, 405);
  assert.equal((await check(env, '/health')).status, 404);
});

// ================= H10 cost: every health query is an index search, never a table scan
await t('H10. EXPLAIN QUERY PLAN: no health query scans collector_runs or the archive tables', async () => {
  const { env, db } = await healthyHub(); const seen = [];
  const prep0 = env.DB.prepare; env.DB.prepare = sql => { seen.push(sql); return prep0(sql); };
  for (const p of ALL) await check(env, p);
  const uniq = [...new Set(seen)]; assert.ok(uniq.length >= 9, 'captured ' + uniq.length);
  for (const sql of uniq) {
    const plan = db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...Array((sql.match(/\?\d?/g) || []).length ? [...new Set(sql.match(/\?\d*/g))].length : 0).fill('firms')).map(r => r.detail).join(' | ');
    assert.ok(!/SCAN (collector_runs|archive_gaps|archive_checkpoints|archive_checkpoint_coverage)\b(?! USING)/.test(plan), sql.slice(0, 90) + ' → ' + plan);
  }
});


// ================= P. GPT's independent probes (6 Nov, rev 1 → all six returned green); each must now fail closed
await t('P1. corrupt coverage evidence (unparsable cutoff / assessed_at, unreadable failure_reasons) with input_status "current" → 503', async () => {
  const h = await healthyHub(); const { env, db } = h;
  db.prepare("UPDATE archive_checkpoint_coverage SET cutoff='not-a-time', assessed_at='not-a-time', failure_reasons='{bad json' WHERE layer='firms' AND day='2026-11-05'").run();
  const r = await check(env, '/health/coverage/firms'); assert.equal(r.status, 503, r.text); assert.match(r.body.reasons.join(' '), /unreadable or does not match/);
  for (const [col, val] of [['failure_reasons', '"just a string"'], ['input_status', "'fine'"], ['failed_runs_after_cutoff', '3']]) {
    const h2 = await healthyHub(); h2.db.prepare(`UPDATE archive_checkpoint_coverage SET ${col}=${col === 'failure_reasons' ? "'" + val + "'" : val} WHERE layer='firms' AND day='2026-11-05'`).run();
    assert.equal((await check(h2.env, '/health/coverage/firms')).status, 503, col + ' corrupt/contradictory must fail');
  }
});
await t('P2. a NEW gap for an OLD day is found even with five newer gaps in the display list', async () => {
  const { env, db } = await healthyHub();
  for (const d of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) db.prepare('INSERT INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').run('firms', d, 'old gap', '2026-10-20T00:00:00.000Z');
  db.prepare('INSERT INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').run('firms', '2026-09-01', 'found today', '2026-11-06T08:00:00.000Z');
  const r = await check(env, '/health/archive/firms'); assert.equal(r.status, 503, r.text); assert.match(r.body.reasons.join(' '), /new archive gap: firms 2026-09-01/);
  assert.equal(r.body.facts.recorded_gaps.length, 5, 'display list unchanged (5)');
});
await t('P3. established hub loses ALL activity records and yesterday\'s checkpoint → 503 (other evidence shows history ran)', async () => {
  const { env, db } = await healthyHub();
  db.prepare("DELETE FROM history_activity WHERE layer='firms'").run(); db.prepare("DELETE FROM archive_checkpoints WHERE layer='firms' AND day='2026-11-05'").run();
  const r = await check(env, '/health/archive/firms'); assert.equal(r.status, 503, r.text); assert.match(r.body.reasons.join(' '), /2026-11-05 has neither a checkpoint nor a recorded gap/);
  assert.equal(r.body.facts.established_before_yesterday, true);
  const { env: e2, db: d2 } = await healthyHub();   // even with the earlier checkpoints gone too, fires_daily rows remain as evidence
  d2.prepare("DELETE FROM history_activity WHERE layer='firms'").run(); d2.prepare("DELETE FROM archive_checkpoints WHERE layer='firms'").run(); d2.prepare("DELETE FROM fires_daily WHERE day >= '2026-11-05'").run();
  assert.equal((await check(e2, '/health/archive/firms')).status, 503, 'fires_daily before yesterday is independent evidence');
});
await t('P4. a run (or published file) timestamped in the future → 503, never a negative age', async () => {
  let h = await healthyHub(); h.db.prepare("INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES ('firms','2026-11-06T09:00:00.000Z','2099-11-06T09:00:00.000Z','ok',200,3,1,'raw_bytes=174')").run();
  for (const p of ['/health/runs/firms', '/health/publication/firms']) { const r = await check(h.env, p); assert.equal(r.status, 503, p + ' ' + r.text); assert.match(r.body.reasons[0], /time in the future/); }
  h = await healthyHub(); h.store.get('latest/firms.json').uploaded = new Date(Date.parse('2099-01-01T00:00:00Z'));
  assert.equal((await check(h.env, '/health/publication/firms')).status, 503, 'future upload time');
  h = await healthyHub(); h.db.prepare('INSERT INTO archive_gaps (layer, day, reason, detected_at) VALUES (?,?,?,?)').run('firms', '2026-11-01', 'x', '2099-01-01T00:00:00.000Z');
  assert.equal((await check(h.env, '/health/archive/firms')).status, 503, 'future gap time');
  h = await healthyHub(); h.db.prepare("INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES ('firms','2026-11-06T09:00:00.000Z','2026-11-06T09:04:00.000Z','ok',200,3,1,'skew')").run();
  assert.equal((await check(h.env, '/health/runs/firms')).status, 200, 'up to 5 min of clock skew is tolerated');
});
await t('P5. guard at 09:15 then HTTP 500 at 09:30: stays 503 (never green) until a successful publication, then 200', async () => {
  const { env } = await healthyHub();
  firmsMode = 'body'; firmsBody = 'latitude,longitude,acq_date,acq_time,confidence,frp,satellite,daynight\n' + 'x'.repeat(W.FIRMS_MAX_PARSE_BYTES + 10);
  await runUntil(env, '2026-11-06T09:16:00Z'); assert.equal((await check(env, '/health/publication/firms')).status, 503);
  firmsMode = 'http500'; await runUntil(env, '2026-11-06T09:31:00Z');
  const r = await check(env, '/health/publication/firms'); assert.equal(r.status, 503, r.text); assert.match(r.body.reasons.join(' '), /resource guard at 2026-11-06T09:15/);
  firmsMode = 'ok'; await runUntil(env, '2026-11-06T09:46:00Z');
  assert.equal((await check(env, '/health/publication/firms')).status, 200, 'resolved by the 09:45 publication');
});
await t('P6. coverage row describing a different cutoff from the actual checkpoint → 503', async () => {
  const { env, db } = await healthyHub();
  db.prepare("UPDATE archive_checkpoint_coverage SET cutoff='2026-11-05T15:30:00.000Z' WHERE layer='firms' AND day='2026-11-05'").run();
  const r = await check(env, '/health/coverage/firms'); assert.equal(r.status, 503, r.text); assert.match(r.body.reasons.join(' '), /is not the checkpoint's cutoff/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
