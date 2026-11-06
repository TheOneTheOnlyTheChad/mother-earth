// FIRMS resource guard + checkpoint coverage (collector 0.5.2) — after the 5 Nov finding (guard tripped 15:45→24:00; the day's
// fires checkpoint silently held the 15:30 snapshot). Offline: sources stubbed; R2 in memory; D1 = real SQLite with schema.sql.
// Covers GPT's review points (6 Nov): (1) the limit vs file size, (2) just below/above the limit + failed/truncated downloads,
// (3) a failed run keeps the last good public data and reports its age, (4) a midnight checkpoint discloses a stale input and the
// failed runs before it, (5) a later success resumes without rewriting retained history. Plus: a failed run triggers the checkpoint.
// Usage: node --no-warnings phase1/firms-guard.test.mjs        BREAK=<name> runs a deliberately broken variant (must FAIL)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const BREAK = process.env.BREAK || '';
const BREAKS = {   // [find, replace] in worker.js — each a plausible mistake
  'old-limit':        ['const FIRMS_MAX_PARSE_BYTES = 8 * 1024 * 1024;', 'const FIRMS_MAX_PARSE_BYTES = 4 * 1024 * 1024;'],
  'no-truncation':    ["    if (c.length !== nCols) throw new Error(", "    if (false) throw new Error("],
  'no-content-check': ["    if (bad) throw new Error(", "    if (false) throw new Error("],
  'scheduled-clock':  ["AND started_at >= ? AND started_at < ? AND finished_at > ? ORDER BY finished_at\")\n    .bind(layer, day + 'T00:00:00.000Z', new Date(dayEnd).toISOString(), cutoff)", "AND started_at > ? AND started_at < ? AND finished_at > '' ORDER BY finished_at\")\n    .bind(layer, cutoff, new Date(dayEnd).toISOString())"],
  'no-coverage':      ['  await writeCoverage(env, cov);   // what the input covered', '  // await writeCoverage(env, cov);   // what the input covered'],
  'coverage-blind':   ["input_status: fails.length || age > 2 * cad + 300 ? 'stale' : 'current',", "input_status: 'current',"],
  'down-no-checkpoint': ["  if (HIST.checkpointLayers.includes(layer)) await hist(env, layer + '-checkpoint', () => histCheckpointsDue(env, layer, Date.now()));\n}", '}'],
  // silently re-assessing retained history on every run (replace instead of ignore, and no "only missing" filter)
  'reassess-history': [["INSERT OR IGNORE INTO archive_checkpoint_coverage", "INSERT OR REPLACE INTO archive_checkpoint_coverage"],
                       [" AND NOT EXISTS (SELECT 1 FROM archive_checkpoint_coverage v WHERE v.layer = c.layer AND v.day = c.day) ORDER BY c.day LIMIT 3", " ORDER BY c.day LIMIT 3"]],
};
let src = fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8');
if (BREAK) { if (!BREAKS[BREAK]) { console.log('unknown BREAK', Object.keys(BREAKS)); process.exit(2); } const pairs = Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]]; for (const [f, r] of pairs) { if (!src.includes(f)) { console.log('BREAK target not found (stale break):', f.slice(0, 60)); process.exit(2); } src = src.replace(f, r); } }
const tmp = new URL(`./.firms-guard-${process.pid}.mjs`, import.meta.url); fs.writeFileSync(tmp, src);
const W = await import(tmp.href); fs.unlinkSync(tmp); const worker = W.default;

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e && e.message || e).split('\n').slice(0, 4).join('\n    ')); } };

// ---------- D1 over SQLite, R2 in memory (same shape as history-hub.test.mjs)
function makeEnv(extra = {}) {
  const db = new DatabaseSync(':memory:'); db.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const prep = sql => { const mk = args => ({ sql, args,
    async run() { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
    async first() { return db.prepare(sql).get(...args) ?? null; }, async all() { return { results: db.prepare(sql).all(...args) }; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const D1 = { prepare: prep, async batch(st) { const o = []; for (const s of st) { if (/^\s*SELECT/i.test(s.sql)) o.push(await s.all()); else { await s.run(); o.push({ results: [] }); } } return o; } };
  const store = new Map();
  const R2 = { async put(k, b, o = {}) { store.set(k, { body: b instanceof Uint8Array ? b : String(b), meta: o }); }, async delete(k) { store.delete(k); },
    async get(k) { const v = store.get(k); if (!v) return null; const b = v.body; return { customMetadata: (v.meta || {}).customMetadata, async json() { return JSON.parse(b); }, async text() { return String(b); }, async arrayBuffer() { return b instanceof Uint8Array ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) : new TextEncoder().encode(b).buffer; } }; },
    async list({ prefix, include } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, ...(include && include.includes('customMetadata') ? { customMetadata: (store.get(key).meta || {}).customMetadata } : {}) })), truncated: false }; } };
  return { env: { R2, DB: D1, ADMIN_KEY: 'k', FIRMS_MAP_KEY: 'x', HISTORY_ENABLED: '1', ...extra }, store, db };
}
const q = (db, sql, ...a) => db.prepare(sql).all(...a);
const latest = async (env, k) => JSON.parse(String((await env.R2.get(k)).body ?? await (await env.R2.get(k)).text()));
const readJson = async (env, k) => JSON.parse(await (await env.R2.get(k)).text());

// ---------- clock (covers `new Date()` too — thread 14 lesson)
let NOW = Date.parse('2026-11-05T10:00:40Z');
{ const R = Date; globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }

// ---------- FIRMS source stub: the real 14-column header and real row shapes (5 Nov file)
const HEAD = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight';
const row = (lat, lng, t = '1200', frp = '5.20', dn = 'D') => `${lat},${lng},330.1,0.4,0.4,2026-11-05,${t},N20,VIIRS,n,2.0NRT,300.2,${frp},${dn}`;
const csv = rows => HEAD + '\n' + rows.join('\n');          // real files end WITHOUT a newline (6 Nov, 3 files)
/** A FIRMS-shaped CSV of exactly `bytes` bytes (valid rows; the last row's version field padded to hit the size). */
function csvOfSize(bytes) {
  const rows = []; let n = HEAD.length; let i = 0;
  while (n < bytes - 200) { const r = row((-30 + (i % 600) / 10).toFixed(4), (-60 + (i % 1200) / 10).toFixed(4)); rows.push(r); n += r.length + 1; i++; }
  let text = csv(rows); const pad = bytes - text.length - 1 - row(1, 1).length; if (pad < 0) throw new Error('size');
  text += '\n' + row(1, 1).replace('2.0NRT', '2.0NRT' + 'x'.repeat(pad));
  assert.equal(text.length, bytes); return text;
}
let FIRMS = { status: 200, body: csv([row(-20, 30)]) };
globalThis.fetch = async url => { url = String(url);
  if (url.includes('firms.modaps')) { if (FIRMS.throw) throw new Error('network reset'); return new Response(FIRMS.body, { status: FIRMS.status }); }
  if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: NOW - 60e3 }, features: [] }), { status: 200 });
  return new Response('stub', { status: 503 }); };
const runFirms = env => worker.scheduled({ cron: '*/15 * * * *', scheduledTime: NOW }, env, { waitUntil() {} });
/** A run SCHEDULED at `sched` that ENDS at `end` (the hub stamps finished_at and retrieved_at from the clock). */
const runFirmsAt = async (env, sched, end) => { NOW = Date.parse(end); await worker.scheduled({ cron: '*/15 * * * *', scheduledTime: Date.parse(sched) }, env, { waitUntil() {} }); };
const GOOD = () => ({ status: 200, body: csv([row(-20, 30, '2300')]) }), BAD = () => ({ status: 503, body: 'down' }), EMPTY = () => ({ status: 200, body: HEAD });
const coverage = db => q(db, "SELECT * FROM archive_checkpoint_coverage WHERE layer='firms' AND day='2026-11-05'")[0];
const status = async env => (await (await worker.fetch(new Request('https://hub/status'), env)).json()).archive_health;
const LIMIT = W.FIRMS_MAX_PARSE_BYTES;

// ================= 1–2. the limit, just below/above, failed and truncated downloads
await t('1. the limit is 8 MiB and the 5 Nov evening file size (5,311,642 B) is now processed', async () => {
  assert.equal(LIMIT, 8 * 1024 * 1024);
  const { env } = makeEnv(); FIRMS = { status: 200, body: csvOfSize(5311642) }; await runFirms(env);
  const e = await readJson(env, 'latest/firms.json'); assert.equal(e.source_status, 'ok'); assert.ok(e.records.length > 60000, 'rows parsed: ' + e.records.length);
});
await t('2a. exactly at the limit → processed; one byte over → "raw archived; processing skipped: resource guard"; raw kept both times', async () => {
  const { env, store, db } = makeEnv();
  FIRMS = { status: 200, body: csvOfSize(LIMIT) }; await runFirms(env);
  assert.equal((await readJson(env, 'latest/firms.json')).source_status, 'ok');
  NOW += 900e3; FIRMS = { status: 200, body: csvOfSize(LIMIT + 1) }; await runFirms(env);
  const last = q(db, "SELECT status, note FROM collector_runs WHERE layer='firms' ORDER BY id DESC LIMIT 1")[0];
  assert.equal(last.status, 'down'); assert.match(last.note, /raw archived; processing skipped: resource guard \(\d+ bytes > 8388608\)/);
  assert.equal([...store.keys()].filter(k => k.startsWith('raw/firms/')).length, 2, 'both raw files archived');
});
await t('2b. failed downloads (network error, HTTP 500, HTML error page) → down with the reason; nothing published', async () => {
  for (const f of [{ throw: true }, { status: 500, body: 'oops' }, { status: 200, body: '<html>maintenance</html>' }]) {
    const { env, store, db } = makeEnv(); FIRMS = f; await runFirms(env);
    assert.ok(!store.has('latest/firms.json'), 'nothing published for ' + JSON.stringify(f).slice(0, 40));
    assert.equal(q(db, "SELECT status FROM collector_runs WHERE layer='firms'")[0].status, 'down');
  }
});
await t('2c. a body cut mid-row is refused whole ("truncated or malformed"), not published as a partial day', async () => {
  const { env, store, db } = makeEnv(); const full = csvOfSize(200000);
  FIRMS = { status: 200, body: full.slice(0, full.lastIndexOf('\n') + 40) }; await runFirms(env);   // cut 40 chars into the last row
  assert.ok(!store.has('latest/firms.json'));
  assert.match(q(db, "SELECT note FROM collector_runs WHERE layer='firms'")[0].note, /truncated or malformed response: line \d+ has \d+ fields, header has 14/);
});
await t('2d. stated limit: a body cut exactly between rows is NOT detectable (no row count/length from FIRMS) — published with fewer rows', async () => {
  const { env } = makeEnv(); const full = csvOfSize(200000);
  FIRMS = { status: 200, body: full.slice(0, full.lastIndexOf('\n')) }; await runFirms(env);
  const e = await readJson(env, 'latest/firms.json'); assert.equal(e.source_status, 'ok');
  assert.equal(e.records.length, full.split('\n').length - 2, 'one row short, undetected — documented, not hidden');
});

// ================= 3. failed runs keep the last good public data and report its age
await t('3. after a good run, each failure keeps latest/firms.json (its own retrieved_at) and /status reports last success, its age and the failing streak', async () => {
  const { env } = makeEnv();
  FIRMS = { status: 200, body: csv([row(-20, 30), row(-21, 31)]) }; await runFirms(env);
  const good = await readJson(env, 'latest/firms.json'); const goodAt = NOW;
  const failures = [{ status: 200, body: csvOfSize(LIMIT + 10) }, { throw: true }, { status: 503, body: 'down' }];
  for (const f of failures) { NOW += 900e3; FIRMS = f; await runFirms(env); }
  const now = await readJson(env, 'latest/firms.json');
  assert.equal(now.retrieved_at, good.retrieved_at, 'public snapshot unchanged, original retrieval time kept');
  assert.deepEqual(now.records, good.records);
  assert.equal((await readJson(env, 'latest-cells/firms.json')).source_status, 'down', 'the cells file says down');
  const c = (await status(env)).collection.firms;
  assert.equal(c.last_successful_run.scheduled_at, new Date(goodAt).toISOString());
  assert.equal(c.last_successful_run.age_s, Math.round((NOW - Date.parse(c.last_successful_run.finished_at)) / 1000));
  assert.ok(c.last_successful_run.age_s >= 3 * 900, 'age covers the failed interval: ' + c.last_successful_run.age_s);
  assert.equal(c.failing.runs, 3); assert.equal(c.failing.since_scheduled, new Date(goodAt + 900e3).toISOString());
  assert.equal(c.latest_run.status, 'down');
});

// ================= 4. the 5 Nov replay: the midnight checkpoint discloses a stale input and the failed runs before it
await t('4. day D: good until 15:30 (latest detection 13:00), guard from 15:45 to 23:45 → checkpoint at 00:30 carries input_status stale, 33 failed runs, reason, ages', async () => {
  const { env, db, store } = makeEnv();
  NOW = Date.parse('2026-11-05T10:00:40Z');
  for (; NOW <= Date.parse('2026-11-05T15:30:40Z'); NOW += 900e3) { FIRMS = { status: 200, body: csv([row(-20, 30, '0900'), row(-21, 31, '1300', '', 'N')]) }; await runFirms(env); }
  for (; NOW <= Date.parse('2026-11-05T23:45:40Z'); NOW += 900e3) { FIRMS = { status: 200, body: csvOfSize(LIMIT + 1000) }; await runFirms(env); }
  // 00:30: FIRMS has nothing yet for the new day (header only) → a DOWN run; the closed day must still be checkpointed now
  NOW = Date.parse('2026-11-06T00:30:40Z'); FIRMS = { status: 200, body: HEAD }; await runFirms(env);
  const cp = q(db, "SELECT * FROM archive_checkpoints WHERE layer='firms'");
  assert.equal(cp.length, 1, 'checkpoint written at 00:30 although the run was down');
  assert.equal(cp[0].cutoff.slice(11, 16), '15:30', 'cutoff = the input snapshot RETRIEVAL time');
  const v = q(db, "SELECT * FROM archive_checkpoint_coverage WHERE layer='firms'")[0];
  assert.equal(v.input_status, 'stale');
  assert.equal(v.failed_runs_after_cutoff, 33);
  assert.equal(v.last_observation_at, '2026-11-05T13:00:00Z', 'latest DETECTION time — kept separate from the cutoff');
  assert.equal(v.input_age_at_day_end_s, Math.round((Date.parse('2026-11-06T00:00:00Z') - Date.parse(cp[0].cutoff)) / 1000));
  assert.equal(v.failure_first_at.slice(11, 16), '15:45'); assert.equal(v.failure_last_at.slice(11, 16), '23:45');
  assert.match(JSON.parse(v.failure_reasons)[0], /resource guard \(size > limit\)/);
  assert.equal(v.assessed_with_checkpoint, 1);
  const meta = store.get('archive/checkpoints/firms/2026-11-05.json.gz').meta.customMetadata;
  assert.equal(meta.input_status, 'stale'); assert.equal(meta.failed_runs_after_cutoff, '33');
  const h = (await status(env)).last_completed.find(x => x.layer === 'firms');
  assert.equal(h.coverage.input_status, 'stale', '/status shows the stale input next to the completed checkpoint');
  assert.equal(h.coverage.failed_runs_after_cutoff, 33);
});
await t('4b. a full good day → input_status current, 0 failed runs', async () => {
  const { env, db } = makeEnv();
  for (NOW = Date.parse('2026-11-05T00:00:40Z'); NOW <= Date.parse('2026-11-05T23:45:40Z'); NOW += 900e3) { FIRMS = { status: 200, body: csv([row(-20, 30, '2300')]) }; await runFirms(env); }
  NOW = Date.parse('2026-11-06T00:30:40Z'); FIRMS = { status: 200, body: HEAD }; await runFirms(env);
  const v = q(db, "SELECT * FROM archive_checkpoint_coverage WHERE layer='firms'")[0];
  assert.equal(v.input_status, 'current'); assert.equal(v.failed_runs_after_cutoff, 0); assert.ok(v.input_age_at_day_end_s < 20 * 60);
});

// ================= 5. a later success resumes normally; retained history is not rewritten; older checkpoints are assessed, labelled
await t('5. next day resumes: new snapshot published; D\'s checkpoint object, row and coverage byte-identical after more runs', async () => {
  const { env, db, store } = makeEnv();
  NOW = Date.parse('2026-11-05T15:30:40Z'); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirms(env);
  NOW = Date.parse('2026-11-05T16:00:40Z'); FIRMS = { status: 200, body: csvOfSize(LIMIT + 5) }; await runFirms(env);
  NOW = Date.parse('2026-11-06T00:30:40Z'); FIRMS = { status: 200, body: HEAD }; await runFirms(env);
  const before = { cp: JSON.stringify(q(db, 'SELECT * FROM archive_checkpoints')), cov: JSON.stringify(q(db, 'SELECT * FROM archive_checkpoint_coverage')), obj: Buffer.from(store.get('archive/checkpoints/firms/2026-11-05.json.gz').body).toString('base64') };
  for (NOW = Date.parse('2026-11-06T02:15:40Z'); NOW <= Date.parse('2026-11-06T03:15:40Z'); NOW += 900e3) { FIRMS = { status: 200, body: csv([row(-20, 30, '0130')]) }; await runFirms(env); }
  assert.equal((await readJson(env, 'latest/firms.json')).source_status, 'ok', 'collection resumed');
  assert.equal((await status(env)).collection.firms.failing, null, 'failing streak cleared by the success');
  assert.equal(JSON.stringify(q(db, 'SELECT * FROM archive_checkpoints')), before.cp);
  assert.equal(JSON.stringify(q(db, 'SELECT * FROM archive_checkpoint_coverage')), before.cov);
  assert.equal(Buffer.from(store.get('archive/checkpoints/firms/2026-11-05.json.gz').body).toString('base64'), before.obj);
});
await t('5b. a checkpoint made before 0.5.2 (no coverage row, like 5 Nov) is assessed later, labelled assessed_with_checkpoint = 0; the checkpoint row is untouched', async () => {
  const { env, db } = makeEnv();
  NOW = Date.parse('2026-11-05T15:30:40Z'); FIRMS = { status: 200, body: csv([row(-20, 30, '1300')]) }; await runFirms(env);
  NOW = Date.parse('2026-11-05T15:45:40Z'); FIRMS = { status: 200, body: csvOfSize(LIMIT + 5) }; await runFirms(env);
  NOW = Date.parse('2026-11-06T00:30:40Z'); FIRMS = { status: 200, body: HEAD }; await runFirms(env);
  db.exec("DELETE FROM archive_checkpoint_coverage");   // simulate the pre-0.5.2 state of 5 Nov
  const cpBefore = JSON.stringify(q(db, 'SELECT * FROM archive_checkpoints'));
  NOW = Date.parse('2026-11-06T02:15:40Z'); FIRMS = { status: 200, body: csv([row(-20, 30, '0130')]) }; await runFirms(env);
  const v = q(db, "SELECT * FROM archive_checkpoint_coverage WHERE layer='firms'")[0];
  assert.ok(v, 'assessed'); assert.equal(v.assessed_with_checkpoint, 0); assert.equal(v.assessed_at, '2026-11-06T02:15:40.000Z');
  assert.equal(v.input_status, 'stale'); assert.equal(v.failed_runs_after_cutoff, 1); assert.equal(v.last_observation_at, '2026-11-05T13:00:00Z');
  assert.equal(JSON.stringify(q(db, 'SELECT * FROM archive_checkpoints')), cpBefore, 'original checkpoint row unchanged');
});

// ================= 6. clocks: scheduled time decides the day; actual end time is compared with the snapshot's retrieval time
await t('6a. GPT\'s case: snapshot retrieved 23:45:40; another run scheduled 23:45:00 fails at 23:46:00 → 1 failure after the snapshot, stale', async () => {
  const { env, db } = makeEnv();
  FIRMS = GOOD(); await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-05T23:45:40Z');
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-05T23:46:00Z');
  FIRMS = EMPTY(); await runFirmsAt(env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  const v = coverage(db);
  assert.equal(v.cutoff, '2026-11-05T23:45:40.000Z'); assert.equal(v.failed_runs_after_cutoff, 1); assert.equal(v.input_status, 'stale');
  assert.equal(v.failure_first_at, '2026-11-05T23:46:00.000Z', 'reported as the actual end time');
});
await t('6b. out-of-order completion: a failure scheduled 23:30 ending 23:46 counts; one scheduled 23:45 ending 23:45:20 (before the snapshot) does not', async () => {
  const { env, db } = makeEnv();
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-05T23:45:20Z');   // superseded by the later snapshot
  FIRMS = GOOD(); await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-05T23:45:40Z');
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T23:30:00Z', '2026-11-05T23:46:00Z');   // scheduled earlier, ended later
  FIRMS = EMPTY(); await runFirmsAt(env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  const v = coverage(db); assert.equal(v.failed_runs_after_cutoff, 1); assert.equal(v.failure_first_at, '2026-11-05T23:46:00.000Z');
});
await t('6c. out-of-order success: the later-RETRIEVED snapshot is the input; a failure that ended before it is not counted → current', async () => {
  const { env, db } = makeEnv();
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-05T23:46:00Z');
  FIRMS = GOOD(); await runFirmsAt(env, '2026-11-05T23:30:00Z', '2026-11-05T23:47:00Z');   // scheduled earlier, retrieved later
  FIRMS = EMPTY(); await runFirmsAt(env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  const v = coverage(db); assert.equal(v.cutoff, '2026-11-05T23:47:00.000Z'); assert.equal(v.failed_runs_after_cutoff, 0); assert.equal(v.input_status, 'current');
});
await t('6d. midnight: a day-D run (scheduled 23:45) failing at 00:00:20 counts for D; a run scheduled 00:00 on D+1 does not', async () => {
  const { env, db } = makeEnv();
  FIRMS = GOOD(); await runFirmsAt(env, '2026-11-05T23:30:00Z', '2026-11-05T23:30:40Z');
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T23:45:00Z', '2026-11-06T00:00:20Z');
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-06T00:00:00Z', '2026-11-06T00:00:30Z');
  FIRMS = EMPTY(); await runFirmsAt(env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  const v = coverage(db); assert.equal(v.failed_runs_after_cutoff, 1); assert.equal(v.failure_last_at, '2026-11-06T00:00:20.000Z');
});
await t('6e. /status failing streak follows actual end times: a failure that ended before the last success ended is not in the streak', async () => {
  const { env } = makeEnv();
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T12:15:00Z', '2026-11-05T12:15:30Z');
  FIRMS = GOOD(); await runFirmsAt(env, '2026-11-05T12:00:00Z', '2026-11-05T12:16:00Z');   // older slot, finished last
  let c = (await status(env)).collection.firms; assert.equal(c.failing, null); assert.equal(c.last_successful_run.finished_at, '2026-11-05T12:16:00.000Z');
  FIRMS = BAD();  await runFirmsAt(env, '2026-11-05T12:30:00Z', '2026-11-05T12:30:30Z');
  c = (await status(env)).collection.firms; assert.equal(c.failing.runs, 1); assert.equal(c.failing.since_scheduled, '2026-11-05T12:30:00.000Z'); assert.equal(c.failing.since_finished, '2026-11-05T12:30:30.000Z');
});

// ================= 7. content checks: cuts inside the final field; genuine zeros and legitimately missing values kept
await t('7a. GPT\'s case: the final "D" removed from an otherwise valid last row (still 14 fields) → refused, not published', async () => {
  const { env, store, db } = makeEnv(); const body = csv([row(-20, 30), row(-21, 31)]);
  assert.ok(body.endsWith(',D')); FIRMS = { status: 200, body: body.slice(0, -1) }; NOW = Date.parse('2026-11-05T12:00:40Z'); await runFirms(env);
  assert.ok(!store.has('latest/firms.json'));
  assert.match(q(db, "SELECT note FROM collector_runs WHERE layer='firms'")[0].note, /truncated or malformed response: line 3 daynight ""/);
});
await t('7b. cuts inside the last row\'s FRP (13 fields) and an invalid code are refused; reasons name the field', async () => {
  for (const [body, re] of [[csv([row(-20, 30)]).replace(/,5\.20,D$/, ',5.2'), /has 13 fields/], [csv([row(-20, 30, '1200', '5.20', 'X')]), /daynight "X"/], [csv([row(-20, 30, '1275')]), /acq_time "1275"/], [csv([row(95, 30)]), /latitude "95"/]]) {
    const { env, store, db } = makeEnv(); FIRMS = { status: 200, body }; NOW = Date.parse('2026-11-05T12:00:40Z'); await runFirms(env);
    assert.ok(!store.has('latest/firms.json'), String(re)); assert.match(q(db, "SELECT note FROM collector_runs WHERE layer='firms'")[0].note, re);
  }
});
await t('7c. genuine zeros (acq_time "0", FRP "0") and an EMPTY FRP are accepted; the empty FRP is published as null, the zero as 0', async () => {
  const { env } = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '0', '0'), row(-21, 31, '0', '', 'N')]) }; NOW = Date.parse('2026-11-05T12:00:40Z'); await runFirms(env);
  const e = await readJson(env, 'latest/firms.json'), iF = e.record_fields.indexOf('frp_mw'), iO = e.record_fields.indexOf('observed_at');
  assert.equal(e.source_status, 'ok'); assert.deepEqual(e.records.map(r => r[iF]), [0, null]); assert.equal(e.records[0][iO], '2026-11-05T00:00:00Z');
});
await t('7d. stated limit, unchanged: a cut exactly between rows still passes every check (not proof of completeness)', async () => {
  const { env } = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30), row(-21, 31), row(-22, 32)]).split('\n').slice(0, 3).join('\n') }; NOW = Date.parse('2026-11-05T12:00:40Z'); await runFirms(env);
  const e = await readJson(env, 'latest/firms.json'); assert.equal(e.source_status, 'ok'); assert.equal(e.records.length, 2);
});

console.log(`\nfirms-guard: ${passed} passed, ${failed} failed${BREAK ? `  (BREAK=${BREAK})` : ''}`);
process.exit(failed ? 1 : 0);
