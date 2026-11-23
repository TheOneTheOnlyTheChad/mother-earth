/* Earth from Space, hub 0.6.23: the two trial health checks, /health/runs/earthview and /health/trial/earthview
 * (EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL rev 3.1, the build brief).
 * The real worker.js is driven through its OWN fetch route and, in section I, its own five-minute scheduled job.
 * D1 is a REAL SQLite database (node:sqlite) loaded with phase1/schema.sql; R2 is in memory; the clock is controlled.
 * Nothing reaches the network: any upstream request made while a health address is being answered is counted and fails the case.
 * Run:  node --no-warnings phase1/earthview-health.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must make this suite fail (run them all: phase1/earthview-health-breaks.mjs).
 * Cases marked KNOWN LIMIT assert a limitation the proposal states; they pin the behaviour so that a change to it is noticed. */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const SCHEMA = fs.readFileSync(path.join(HERE, 'schema.sql'), 'utf8');
export const BREAKS = {
  // ---- slots and the due rule
  'due-after-equality': ['nowMs >= from + settled * EVH.SLOT_MS + EVH.ALLOW_MS) settled++', 'nowMs > from + settled * EVH.SLOT_MS + EVH.ALLOW_MS) settled++'],
  'allow-30-minutes': ['const EVH = { SLOT_MS: 600e3, ALLOW_MS: 1200e3,', 'const EVH = { SLOT_MS: 600e3, ALLOW_MS: 1800e3,'],
  'off-mark-row-counts': ['|| (s - from) % EVH.SLOT_MS !== 0) { outside++; continue; }', ') { outside++; continue; }\n    if ((s - from) % EVH.SLOT_MS !== 0) { slot[Math.floor((s - from) / EVH.SLOT_MS)].rows++; continue; }'],
  'earlier-trial-row-counts': ['if (!Number.isFinite(s) || s < from || s >= until ||', 'if (!Number.isFinite(s) || s >= until ||'],
  // ---- configuration precedence
  'unknown-gate-ok': ["  if (gate === 'unknown') return { gate, fail: 'gate_unknown_value' };\n", ''],
  'gate-on-without-window-ok': ["return gate === '1' ? { gate, fail: 'gate_on_without_window' } : { gate, none: true };", 'return { gate, none: true };'],
  'bad-window-is-no-trial': ["until - from > EV_WINDOW_MAX_MS) return { gate, fail: 'window_not_readable' };", 'until - from > EV_WINDOW_MAX_MS) return { gate, none: true };'],
  'one-variable-is-no-trial': ['  if (!hasF && !hasU) return gate', '  if (!hasF || !hasU) return gate'],
  'armed-with-gate-off-ok': ["healthy: on, reasons: on ? [] : ['not_collecting'], facts: f }", 'healthy: true, reasons: [], facts: f }'],
  'gate-off-silent': ["  if (!on && nowMs < last) runsReasons.push('not_collecting');\n", ''],
  'gate-off-red-for-ever': ["  if (!on && nowMs < last) runsReasons.push('not_collecting');", "  if (!on) runsReasons.push('not_collecting');"],
  // ---- startup
  'startup-skips-the-rows': ['  // The rows of this trial: finished inside', "  if (on && nowMs < from + EVH.ALLOW_MS) { const f = { state: 'starting', ...base }; return { runs: { healthy: true, reasons: [], facts: f }, trial: { healthy: true, reasons: [], facts: f } }; }\n  // The rows of this trial: finished inside"],
  // ---- findings
  'storage-stop-ignored': ["    if (k === 'storage_stop') x.storage_stop = true;\n", ''],
  'busy-is-not-a-stop': ['reason === EV_STOP.REPAIR || reason === EV_STOP.CHANGED || reason === EV_STOP.BUSY) return', 'reason === EV_STOP.REPAIR || reason === EV_STOP.CHANGED) return'],
  'guard-refusal-is-a-stop': ["if (reason === EV_STOP.HELD || reason === EV_STOP.UNSET) return 'guard_refused';", "if (reason === EV_STOP.HELD || reason === EV_STOP.UNSET) return 'storage_stop';"],
  'unrecognised-ignored': ["    if (k === 'unrecognised') x.unrecognised = true;\n", ''],
  'unknown-phrase-is-internal-error': ["  if (reason === 'internal error') return 'internal_error';\n  return 'unrecognised';", "  return 'internal_error';"],
  'refusal-masked-by-success': ["    if (k === 'validation_refused') x.refused = true;\n", "    if (k === 'validation_refused' && !x.current) x.refused = true;\n"],
  'late-good-row-counts': ["k === 'nothing_newer') && f <= s + EVH.ALLOW_MS) x.current = true;", "k === 'nothing_newer')) x.current = true;"],
  'good-row-frozen-before-equality': ["k === 'nothing_newer') && f <= s + EVH.ALLOW_MS) x.current = true;", "k === 'nothing_newer') && f < s + EVH.ALLOW_MS) x.current = true;"],
  'superseded-not-current': ["if ((k === 'published' || k === 'superseded' || k === 'nothing_newer')", "if ((k === 'published' || k === 'nothing_newer')"],
  'post-check-not-newer-listed': ["    if (k === 'validation_refused' || k === 'post_check_failure') x.newer_listed = true;", "    if (k === 'validation_refused') x.newer_listed = true;"],
  'c6-counts-unsettled': ['for (let i = 0; i + EVH.C6_RUN <= settled; i++)', 'for (let i = 0; i + EVH.C6_RUN <= nSlots; i++)'],
  'c8-counts-unsettled': ['for (let i = 0; i + EVH.C8_RUN <= settled; i++)', 'for (let i = 0; i + EVH.C8_RUN <= nSlots; i++)'],
  'c6-needs-four': ['C6_RUN: 3,', 'C6_RUN: 4,'],
  'c8-needs-seven': ['C8_RUN: 6 }', 'C8_RUN: 7 }'],
  'c8-without-a-newer-frame': ['if (w.every(x => !x.current) && w.some(x => x.newer_listed))', 'if (w.every(x => !x.current))'],
  // ---- reads
  'truncation-ok': ["  if (rows.length >= EVH.ROW_LIMIT) return both('too_many_rows',", "  if (false) return both('too_many_rows',"],
  'read-failure-is-empty': ["  } catch (_) { return both('rows_unreadable', 'rows unreadable', base); }", '  } catch (_) { rows = []; }'],
  'future-row-accepted': ['if (!Number.isFinite(f) || f > nowMs + HEALTH_SKEW_MS) return both(', 'if (!Number.isFinite(f)) return both('],
  'no-horizon': ['iso(until + EVH.HORIZON_MS), EVH.ROW_LIMIT)', 'iso(until + 4000 * EVH.HORIZON_MS), EVH.ROW_LIMIT)'],
  'rows-before-from-read': ["AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?')\n      .bind('earthview', iso(from),", "AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?')\n      .bind('earthview', iso(0),"],
  // ---- public answer
  'note-in-the-answer': ['const facts = { state, ...base, settled,', 'const facts = { notes: rows.map(r => r.note), state, ...base, settled,'],
  'exception-text-in-the-answer': ["catch (_) { return { healthy: false, reasons: ['rows_unreadable'], facts: { state: 'rows unreadable' } }; } };", "catch (e) { return { healthy: false, reasons: ['rows_unreadable: ' + String(e)], facts: { state: 'rows unreadable' } }; } };"],
  'trial-check-not-routed': ["const fn = layer === 'earthview' ? { runs: healthEvRuns, trial: healthEvTrial }[check]", "const fn = layer === 'earthview' ? { runs: healthEvRuns }[check]"],
  'old-runs-rule-for-earthview': ["const fn = layer === 'earthview' ? { runs: healthEvRuns, trial: healthEvTrial }[check]", "const fn = layer === 'earthview' && check === 'trial' ? healthEvTrial"],
  'state-clean-ignores-findings': ['clean = !overdue.length && !findings.length;', 'clean = !overdue.length;'],
};
const BREAK = process.env.BREAK || '';
let WPATH = path.join(HERE, 'worker.js');
if (BREAK) {
  const b = BREAKS[BREAK]; if (!b) { console.log('unknown BREAK', BREAK); process.exit(2); }
  if (SRC.split(b[0]).length !== 2) { console.log('BAD BREAK (pattern not found exactly once):', BREAK); process.exit(2); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evh-')); WPATH = path.join(dir, 'worker.mjs'); fs.writeFileSync(WPATH, SRC.replace(b[0], b[1]));
}
const { default: worker, ...W } = await import(pathToFileURL(WPATH).href);

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; if (!BREAK) console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e && e.message || e).split('\n').slice(0, 5).join('\n    ')); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || 'not equal') + ': got ' + JSON.stringify(a) + ', wanted ' + JSON.stringify(b)); };
const yes = (v, m) => { if (!v) throw new Error(m || 'expected true'); };

// ---------- clock
let NOW = Date.parse('2026-11-24T05:00:00Z');
{ const RealDate = Date; globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const at = v => { NOW = typeof v === 'number' ? v : Date.parse(v); };

// ---------- upstream: nothing may be requested while a health address is answered
let upstream = [];
globalThis.fetch = async url => { upstream.push(String(url)); return new Response('stub', { status: 503 }); };

// ---------- D1 over SQLite (every statement recorded), R2 in memory (every call recorded)
function makeEnv(extra = {}, o = {}) {
  const db = new DatabaseSync(':memory:'); if (!o.noSchema) db.exec(SCHEMA);
  const sql = [], fail = { select: null };
  const prep = q => { sql.push(q); const mk = args => ({ sql: q, args,
    async run() { const r = db.prepare(q).run(...args); return { meta: { changes: r.changes } }; },
    async first() { if (fail.select && fail.select.test(q)) throw new Error('D1 stub: forced read failure SECRET-IN-EXCEPTION'); return db.prepare(q).get(...args) ?? null; },
    async all() { if (fail.select && fail.select.test(q)) throw new Error('D1 stub: forced read failure SECRET-IN-EXCEPTION'); return { results: db.prepare(q).all(...args) }; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const D1 = { prepare: prep, async batch(stmts) { const out = []; for (const s of stmts) { if (/^\s*SELECT/i.test(s.sql)) out.push(await s.all()); else { await s.run(); out.push({ results: [] }); } } return out; } };
  const store = new Map(), r2calls = [];
  const R2 = {
    async put(k, body, m = {}) { r2calls.push('put ' + k); store.set(k, { body, meta: m, uploaded: new Date(NOW) }); return { key: k }; },
    async get(k) { r2calls.push('get ' + k); const v = store.get(k); if (!v) return null; return { body: v.body, uploaded: v.uploaded, async json() { return JSON.parse(v.body); }, async text() { return String(v.body); }, async arrayBuffer() { return v.body; } }; },
    async head(k) { r2calls.push('head ' + k); const v = store.get(k); return v ? { key: k, uploaded: v.uploaded } : null; },
    async delete(k) { r2calls.push('delete ' + k); store.delete(k); },
    async list({ prefix } = {}) { r2calls.push('list ' + prefix); return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key })), truncated: false }; },
  };
  return { env: { R2, DB: D1, ADMIN_KEY: 'admin-key-0123456789abcdef', ...extra }, db, sql, fail, r2calls };
}
const FROM = '2026-11-24T06:00:00Z', UNTIL = '2026-11-24T08:00:00Z';   // 12 slots; the last is 07:50; LAST (its due time) is 08:10
const F = Date.parse(FROM), U = Date.parse(UNTIL), MIN = 60e3, SLOT = 10 * MIN, ALLOW = 20 * MIN, LAST = U - SLOT + ALLOW;
const UNSET = Symbol('gate unset');
const trial = (gate = '1', extra = {}) => makeEnv({ ...(gate === UNSET ? {} : { EARTHVIEW_ENABLED: gate }), EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: UNTIL, ...extra });
const slot = i => F + i * SLOT, iso = ms => new Date(ms).toISOString();
/** One collector_runs row. started = the scheduled time; finished = when the run ended (default 90 s after the scheduled time). */
function ins(h, startedMs, kind, o = {}) {
  const fin = o.finished !== undefined ? o.finished : startedMs + 90e3, T = '2026-11-24T05:50:00Z';
  const row = {
    pub: ['ok', 1, `frame ${T} as 20261124T0550Z-0123456789abcdef-g1-abcdef; SECRETNOTE detail`], nn: ['ok', 0, `nothing newer: ${T} listed, ${T} held`], sup: ['ok', 0, `superseded: ${T} was published first; SECRETNOTE`],
    refused: ['down', 0, 'picture failed validation — structure: SECRETNOTE'], refusedChk: ['down', 0, 'check image failed validation — does not decode'],
    picfail: ['down', 0, 'picture request failed — TimeoutError SECRETNOTE'], served: ['down', 0, 'served a different frame — picture: asked A, server named B'],
    src: ['down', 0, 'source check failed — no answer'], src2: ['down', 0, 'source check failed'],
    repair: ['down', 0, 'storage record needs repair — SECRETNOTE'], changed: ['down', 0, 'storage changed during the run'], busy: ['down', 0, 'storage busy — x'],
    held: ['down', 0, 'collection is held'], unset: ['down', 0, 'storage is not set up'], internal: ['down', 0, 'internal error — uncaught: TypeError SECRETNOTE'],
    weirdNote: ['down', 0, 'a brand new failure phrase — SECRETNOTE'], weirdStatus: ['degraded', 0, 'source check failed'], weirdOk: ['ok', 0, 'something else happened'],
  }[kind];
  if (!row) throw new Error('no such row kind ' + kind);
  h.db.prepare('INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)').run(o.layer || 'earthview', iso(startedMs), iso(fin), row[0], 200, row[1], 0, row[2]);
}
const fill = (h, n, kind = 'nn', from = 0) => { for (let i = from; i < n; i++) ins(h, slot(i), kind); };
/** Rows only for slots whose run would have finished by `nowMs` (a row finished in the future is corrupt evidence). */
const fillTo = (h, nowMs, kind = 'nn') => { for (let i = 0; i < 12 && slot(i) + 90e3 <= nowMs; i++) ins(h, slot(i), kind); };
const req = (p, method = 'GET') => new Request('https://hub' + p, { method });
async function get(h, which, method = 'GET') {
  upstream = []; const sqlBefore = h.sql.length, r2Before = h.r2calls.length;
  const r = await worker.fetch(req('/health/' + which + '/earthview', method), h.env), text = await r.text();
  if (upstream.length) throw new Error('a health request reached upstream: ' + upstream.join(', '));
  if (h.r2calls.length !== r2Before) throw new Error('a health request touched R2: ' + h.r2calls.slice(r2Before).join(', '));
  const stmts = h.sql.slice(sqlBefore); if (stmts.some(q => !/^\s*SELECT/i.test(q))) throw new Error('a health request wrote to D1: ' + stmts.join(' | '));
  return { status: r.status, headers: r.headers, text, body: text ? JSON.parse(text) : null, stmts };
}
/** [runs status, trial status] */
const both = async h => [(await get(h, 'runs')).status, (await get(h, 'trial')).status];
const reasons = async (h, which) => (await get(h, which)).body.reasons;
const state = async (h, which = 'runs') => (await get(h, which)).body.facts.state;

// ===== S. states, in order of precedence (proposal 3.5) =====
await t('S1 no window, gate unset or manual: both 200, "no trial configured"', async () => {
  for (const g of [undefined, 'manual']) { const h = makeEnv(g === undefined ? {} : { EARTHVIEW_ENABLED: g }); at('2026-11-24T07:00:00Z'); eq(await both(h), [200, 200], 'gate ' + g); eq(await state(h), 'no trial configured'); }
});
await t('S2 an unknown gate value fails both, with no window, with a valid window, before, during and after it', async () => {
  for (const g of ['true', '0', '', 'Manual', ' 1']) {
    const a = makeEnv({ EARTHVIEW_ENABLED: g }); at('2026-11-24T07:00:00Z'); eq(await both(a), [503, 503], JSON.stringify(g) + ' no window'); eq(await reasons(a, 'trial'), ['gate_unknown_value']);
    for (const when of [F - 3600e3, F + 3600e3, LAST + 3600e3]) { const h = trial(g); fillTo(h, when); at(when); eq(await both(h), [503, 503], JSON.stringify(g) + ' at ' + iso(when)); }
  }
});
await t('S3 gate "1" with neither window variable fails both', async () => { const h = makeEnv({ EARTHVIEW_ENABLED: '1' }); at('2026-11-24T07:00:00Z'); eq(await both(h), [503, 503]); eq(await reasons(h, 'runs'), ['gate_on_without_window']); });
await t('S4 a window that cannot be read fails both, whatever the gate: one variable, off the mark, inverted, empty, over 48 hours', async () => {
  const bad = [{ EARTHVIEW_FROM: FROM }, { EARTHVIEW_UNTIL: UNTIL }, { EARTHVIEW_FROM: '2026-11-24T06:05:00Z', EARTHVIEW_UNTIL: UNTIL }, { EARTHVIEW_FROM: '2026-11-24 06:00', EARTHVIEW_UNTIL: UNTIL },
    { EARTHVIEW_FROM: UNTIL, EARTHVIEW_UNTIL: FROM }, { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: FROM }, { EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-26T06:10:00Z' }, { EARTHVIEW_FROM: '', EARTHVIEW_UNTIL: '' }];
  for (const w of bad) for (const g of [undefined, 'manual', '1']) { const h = makeEnv({ ...(g ? { EARTHVIEW_ENABLED: g } : {}), ...w }); at('2026-11-24T07:00:00Z'); eq(await both(h), [503, 503], JSON.stringify(w) + ' gate ' + g); eq(await reasons(h, 'runs'), ['window_not_readable']); }
  const ok48 = makeEnv({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-26T06:00:00Z' }); at(F - 60e3); eq(await both(ok48), [200, 200], 'exactly 48 hours is a readable window');
});
await t('S5 before FROM: gate "1" is armed (200, 200); gate off is "window set but gate is not 1" (runs 503, trial 200)', async () => {
  const a = trial('1'); at(F - 1); eq(await both(a), [200, 200]); eq(await state(a), 'armed');
  for (const g of ['manual', UNSET]) { const h = trial(g); at(F - 1); eq(await both(h), [503, 200], 'gate ' + String(g)); eq(await reasons(h, 'runs'), ['not_collecting']); eq(await state(h), 'window set but gate is not 1'); }
});
await t('S6 starting: no slot is due until FROM + 20 min; a missing first completion is not a failure before then, and is one AT that instant', async () => {
  const h = trial('1');
  at(F); eq(await both(h), [200, 200]); eq(await state(h), 'starting');
  at(F + ALLOW - 1); eq(await both(h), [200, 200], 'one millisecond before the first slot is due'); eq(await state(h), 'starting');
  at(F + ALLOW); eq(await both(h), [503, 200], 'at equality the first slot is due'); eq(await reasons(h, 'runs'), ['completion_missing']); eq((await get(h, 'runs')).body.facts.overdue_slots, ['2026-11-24T06:00:00.000Z']); eq(await state(h), 'active');
});
await t('S7 gate off during the trial: runs 503 "not collecting", from FROM until the last slot is due', async () => {
  for (const g of ['manual', UNSET]) for (const when of [F, F + 3600e3, LAST - 1]) { const h = trial(g); fillTo(h, when);
    { at(when); eq(await both(h), [503, 200], 'gate ' + String(g) + ' at ' + iso(when)); eq(await reasons(h, 'runs'), ['not_collecting']); eq(await state(h), 'trial window set but not collecting'); } }
});
await t('S8 after the last slot is due: every slot complete and no finding is 200, 200, whatever the gate now is (unknown still fails)', async () => {
  for (const g of ['1', 'manual', UNSET]) { const h = trial(g); fill(h, 12); for (const when of [LAST, LAST + 5 * 3600e3]) { at(when); eq(await both(h), [200, 200], 'gate ' + String(g)); eq(await state(h), 'trial complete, nothing outstanding'); } }
});
await t('S9 the last slot is judged after UNTIL: not due one millisecond before LAST, overdue at LAST, and still 503 a day later', async () => {
  const h = trial('1'); fill(h, 11);
  at(U + 60e3); eq(await both(h), [200, 200], 'after UNTIL, the last slot still inside its 20 minutes'); eq(await state(h), 'active');
  at(LAST - 1); eq(await both(h), [200, 200]);
  at(LAST); eq(await both(h), [503, 200]); eq((await get(h, 'runs')).body.facts.overdue_slots, ['2026-11-24T07:50:00.000Z']); eq(await state(h), 'trial ended with outstanding findings');
  at(LAST + 20 * 3600e3); eq(await both(h), [503, 200], 'the window ending is not a recovery');
});
await t('S10 a trial that ended with a finding stays 503 on the trial address and says so', async () => {
  const h = trial('manual'); fill(h, 12); ins(h, slot(3), 'repair');
  at(LAST + 3600e3); eq(await both(h), [200, 503]); eq(await state(h, 'trial'), 'trial ended with outstanding findings');
});

// ===== T. slots =====
await t('T1 only a row whose scheduled time is exactly a slot of this trial completes it: off the mark, before FROM, at UNTIL and other layers do not', async () => {
  const h = trial('1');
  ins(h, slot(0) + 191e3, 'nn'); ins(h, slot(0) - SLOT, 'nn', { finished: slot(0) + 5e3 }); ins(h, U, 'nn', { finished: F + 6e3 }); ins(h, slot(0), 'nn', { layer: 'usgs' }); ins(h, slot(0) + 1, 'nn');
  at(F + ALLOW); eq(await both(h), [503, 200]); const f = (await get(h, 'runs')).body.facts; eq([f.complete, f.overdue, f.rows_outside_slots], [0, 1, 4]);
  ins(h, slot(0), 'nn'); eq(await both(h), [200, 200]);
});
await t('T2 several rows for one scheduled time are one slot, not several', async () => {
  const h = trial('1'); for (let k = 0; k < 5; k++) ins(h, slot(0), 'nn', { finished: slot(0) + 60e3 + k * 1e3 });
  at(F + ALLOW + SLOT); const f = (await get(h, 'runs')).body; eq(f.facts.complete, 1); eq(f.facts.overdue_slots, ['2026-11-24T06:10:00.000Z']); eq((await get(h, 'runs')).status, 503);
});
await t('T3 a late run that finishes resolves its overdue slot (a true resolution)', async () => {
  const h = trial('1'); ins(h, slot(0), 'nn'); ins(h, slot(2), 'nn');
  at(F + SLOT + ALLOW + 5 * MIN); eq(await both(h), [503, 200]);
  ins(h, slot(1), 'nn', { finished: NOW }); eq(await both(h), [200, 200]);
});
await t('T4 KNOWN LIMIT: a row whose scheduled time is exactly a mark completes that slot, whoever made it (a manual run on the mark cannot be told apart)', async () => {
  const h = trial('1'); ins(h, slot(0), 'pub'); at(F + ALLOW); eq(await both(h), [200, 200]);
});
await t('T5 the number of slots is (UNTIL - FROM) / 10 min; a 48-hour trial has 288', async () => {
  const h = makeEnv({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-26T06:00:00Z' }); at(F + 60e3); eq((await get(h, 'runs')).body.facts.slots, 288);
  const s = trial('1'); at(F + 60e3); eq((await get(s, 'runs')).body.facts.slots, 12);
});

// ===== C. findings =====
await t('C3 a storage stop on any run of the trial fails the trial address: each of the three phrases; a guard refusal does not', async () => {
  for (const k of ['repair', 'changed', 'busy']) { const h = trial('1'); fill(h, 3); ins(h, slot(1), k); at(F + 2 * SLOT + ALLOW); eq(await both(h), [200, 503], k); eq(await reasons(h, 'trial'), ['storage_stop']); eq((await get(h, 'trial')).body.facts.findings, [{ code: 'storage_stop', slot: '2026-11-24T06:10:00.000Z' }]); }
  for (const k of ['held', 'unset', 'src', 'internal', 'picfail']) { const h = trial('1'); fill(h, 3, k); at(F + 2 * SLOT + ALLOW); eq(await both(h), [200, 200], k); }
});
await t('C3b failure, then a good run, then the next poll: still 503; and still 503 after the window', async () => {
  const h = trial('1'); ins(h, slot(0), 'repair'); at(F + 5 * MIN); eq(await both(h), [200, 503]);
  ins(h, slot(0), 'pub', { finished: slot(0) + 8 * MIN }); let done = 1;
  for (const when of [F + SLOT + 5 * MIN, F + 3600e3, LAST, LAST + 86400e3]) { for (; done < 12 && slot(done) + 90e3 <= when; done++) ins(h, slot(done), 'pub'); at(when); eq(await both(h), [200, 503], iso(when)); }
});
await t('C3c a storage stop in the last slot before UNTIL is a finding after the window', async () => {
  const h = trial('1'); fill(h, 11); ins(h, slot(11), 'changed'); at(LAST + 60e3); eq(await both(h), [200, 503]);
});
await t('C3d startup does not excuse a recorded storage stop: first slot 06:00, stop recorded 06:02, poll 06:05 → trial 503, runs 200', async () => {
  const h = trial('1'); ins(h, slot(0), 'busy', { finished: F + 2 * MIN }); at(F + 5 * MIN); eq(await both(h), [200, 503]); eq(await state(h), 'starting');
});
await t('C6 three adjacent settled slots each with a validation refusal fail the trial; two do not; a check-image refusal counts', async () => {
  const h = trial('1'); fill(h, 12); ins(h, slot(4), 'refused'); ins(h, slot(5), 'refusedChk');
  at(LAST); eq(await both(h), [200, 200], 'two adjacent');
  ins(h, slot(7), 'refused'); eq(await both(h), [200, 200], 'two adjacent and one apart');
  ins(h, slot(6), 'refused'); eq(await both(h), [200, 503]); eq(await reasons(h, 'trial'), ['three_slots_refused']);
});
await t('C6b a slot counts as refused if ANY of its rows is a refusal: a success before it, or after it, does not mask it', async () => {
  const h = trial('1');
  ins(h, slot(0), 'pub', { finished: slot(0) + 60e3 }); ins(h, slot(0), 'refused', { finished: slot(0) + 120e3 });   // success first, then the refusal
  ins(h, slot(1), 'refused', { finished: slot(1) + 60e3 }); ins(h, slot(1), 'pub', { finished: slot(1) + 120e3 });   // refusal first, then a success
  ins(h, slot(2), 'refused');
  at(F + 2 * SLOT + ALLOW); eq(await both(h), [200, 503]);
});
await t('C6c only settled slots build a streak: two refused and a third refused but not yet due is no finding until it is due', async () => {
  const h = trial('1'); ins(h, slot(0), 'refused'); ins(h, slot(1), 'refused'); ins(h, slot(2), 'refused', { finished: slot(2) + 30e3 });
  at(slot(2) + ALLOW - 1); eq(await both(h), [200, 200]);
  at(slot(2) + ALLOW); eq(await both(h), [200, 503]);
});
await t('C6d an overdue slot between refusals breaks the streak (it alarms on the runs address instead)', async () => {
  const h = trial('1'); ins(h, slot(0), 'refused'); ins(h, slot(1), 'refused'); ins(h, slot(3), 'refused'); ins(h, slot(4), 'refused');
  at(slot(4) + ALLOW); eq(await both(h), [503, 200]);
});
await t('C8 six adjacent settled slots with no current frame and at least one showing a newer frame listed fail the trial; five do not', async () => {
  const h = trial('1'); fill(h, 5, 'picfail'); ins(h, slot(5), 'nn'); fill(h, 12, 'nn', 6);
  at(LAST); eq(await both(h), [200, 200], 'five');
  const g = trial('1'); fill(g, 6, 'picfail'); fill(g, 12, 'nn', 6); at(LAST); eq(await both(g), [200, 503]); eq(await reasons(g, 'trial'), ['six_slots_without_a_current_frame']);
  const m = trial('1'); for (const [i, k] of ['src', 'src2', 'served', 'internal', 'src', 'held'].entries()) ins(m, slot(i), k); at(slot(5) + ALLOW); eq(await both(m), [200, 503], 'one post-check failure among source failures is enough');
});
await t('C8b six slots of source-check failures, internal errors or guard refusals alone are not condition 8 (a source outage is recorded, not alarmed)', async () => {
  for (const k of ['src', 'internal', 'held']) { const h = trial('1'); fill(h, 12, k); at(LAST); eq(await both(h), [200, 200], k); }
});
await t('C8c "nothing newer", "published" and "superseded" each break the run of six', async () => {
  for (const k of ['nn', 'pub', 'sup']) { const h = trial('1'); fill(h, 12, 'picfail'); for (const i of [3, 9]) ins(h, slot(i), k); at(LAST); eq(await both(h), [200, 200], k); }
});
await t('C8d good evidence is frozen at the slot\'s due time: at equality it counts, one millisecond later it does not', async () => {
  const a = trial('1'); fill(a, 6, 'picfail'); ins(a, slot(2), 'nn', { finished: slot(2) + ALLOW }); at(slot(5) + ALLOW); eq(await both(a), [200, 200], 'finished exactly at the due time');
  const b = trial('1'); fill(b, 6, 'picfail'); ins(b, slot(2), 'nn', { finished: slot(2) + ALLOW + 1 }); at(slot(5) + ALLOW); eq(await both(b), [200, 503], 'finished one millisecond after the due time');
});
await t('C8e an overdue slot counts as "no current frame"; an early failure followed by slots not yet due is no finding', async () => {
  const h = trial('1'); ins(h, slot(0), 'picfail'); at(slot(0) + ALLOW); eq(await both(h), [200, 200], 'one settled slot, eleven in the future');
  ins(h, slot(5), 'served'); at(slot(5) + ALLOW); eq(await both(h), [503, 503], 'four overdue between two failures');
});
await t('C8f incomplete slots across the end of the window: a run of six that reaches the last slot is judged only when that slot is due', async () => {
  const h = trial('1'); fill(h, 6); fill(h, 11, 'picfail', 6);
  at(LAST - 1); eq(await both(h), [200, 200]);
  at(LAST); eq(await both(h), [503, 503]);
});
await t('U1 a row this code cannot read fails the trial: an unknown status, an unknown failure phrase, an unknown "ok" note; also during startup', async () => {
  for (const k of ['weirdNote', 'weirdStatus', 'weirdOk']) { const h = trial('1'); ins(h, slot(0), k, { finished: F + 2 * MIN }); at(F + 5 * MIN); eq(await both(h), [200, 503], k + ' at startup'); eq(await reasons(h, 'trial'), ['unrecognised_outcome']); fill(h, 12, 'pub', 1); at(LAST); eq(await both(h), [200, 503], k + ' at the end'); }
  const off = trial('1'); ins(off, slot(0) + 1234, 'weirdNote'); fill(off, 12); at(LAST); eq(await both(off), [200, 200], 'an unreadable row that is not a slot of this trial is not evidence about it');
});
await t('U2 every failure phrase the collector can write is one this code recognises (read from worker.js itself)', async () => {
  const lits = new Set([...SRC.matchAll(/(?:evFail|vFail)\(env, ms, '([^']+)'/g)].map(m => m[1]));
  const evFetchSrc = SRC.slice(SRC.indexOf('async function evFetch('), SRC.indexOf('/* ---- Storage records, guards and recovery'));
  yes(evFetchSrc.length > 500 && evFetchSrc.length < 3000, 'evFetch not found as expected');
  for (const what of ['picture', 'check image']) for (const r of [...evFetchSrc.matchAll(/reason: what \+ ' ([^']+)'/g)].map(m => m[1])) lits.add(what + ' ' + r);
  for (const v of Object.values(W.EV_STOP)) lits.add(v);
  yes(lits.size >= 18, 'expected at least 18 phrases, found ' + lits.size);
  for (const reason of lits) for (const note of [reason, reason + ' — some detail']) yes(W.evhKind({ status: 'down', records: 0, note }) !== 'unrecognised', 'not recognised: ' + note);
  eq([W.evhKind({ status: 'ok', records: 1, note: 'frame T as id; x' }), W.evhKind({ status: 'ok', records: 0, note: 'nothing newer: A listed, B held' }), W.evhKind({ status: 'ok', records: 0, note: 'superseded: A was published first; x' })], ['published', 'nothing_newer', 'superseded']);
  eq([W.evhKind({ status: 'ok', records: 0, note: 'frame T as id' }), W.evhKind({ status: 'down', records: 0, note: null }), W.evhKind({ status: 'down', records: 0, note: 'storage busy and more' })], ['unrecognised', 'unrecognised', 'unrecognised']);
});

// ===== R. reads =====
await t('R1 if the read returns its limit the evidence may be incomplete: both 503 "too_many_rows"; one row fewer is evaluated', async () => {
  const h = trial('1'); const st = h.db.prepare('INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)');
  for (let k = 0; k < W.EVH.ROW_LIMIT - 1; k++) st.run('earthview', iso(slot(k % 12)), iso(F + 60e3 + k), 'ok', 200, 0, 0, 'nothing newer: A listed, B held');
  at(LAST); eq(await both(h), [200, 200], 'limit - 1 rows');
  st.run('earthview', iso(slot(0)), iso(F + 60e3 + 5e6), 'ok', 200, 0, 0, 'nothing newer: A listed, B held');
  eq(await both(h), [503, 503]); eq(await reasons(h, 'runs'), ['too_many_rows']); eq(await reasons(h, 'trial'), ['too_many_rows']);
});
await t('R2 a failed read fails both, at startup too, and the exception\'s text is not in the answer', async () => {
  const h = trial('1'); fill(h, 12); h.fail.select = /collector_runs/;
  for (const when of [F + 60e3, F + 3600e3, LAST + 60e3]) { at(when); for (const w of ['runs', 'trial']) for (const m of ['GET', 'HEAD']) { const g = await get(h, w, m); eq(g.status, 503, w + ' ' + m + ' ' + iso(when)); yes(!g.text.includes('SECRET') && !g.text.includes('D1 stub'), 'exception text in the answer'); if (m === 'GET') eq(g.body.reasons, ['rows_unreadable']); } }
  at(F - 60e3); eq(await both(h), [200, 200], 'before FROM no row is read');
});
await t('R3 no table, an unreadable time or a time in the future in a row: both 503', async () => {
  const a = trial('1', {}); const n = makeEnv({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: UNTIL }, { noSchema: true }); at(F + 60e3); eq(await both(n), [503, 503], 'no table');
  ins(a, slot(0), 'nn', { finished: F + 3600e3 }); at(F + 30 * MIN); eq(await both(a), [503, 503], 'a row finished in the future');
  const b = trial('1'); b.db.prepare('INSERT INTO collector_runs (layer, started_at, finished_at, status, http_status, records, bytes, note) VALUES (?,?,?,?,?,?,?,?)').run('earthview', iso(slot(0)), '2026-11-24T06:01:00.000Zzz', 'ok', 200, 0, 0, 'nothing newer: A listed, B held');
  at(F + 30 * MIN); eq(await both(b), [503, 503], 'an unreadable finished_at');
});
await t('R4 KNOWN LIMIT, the 24-hour horizon: a late bad repeat of a completed slot finished after UNTIL + 24 h is not seen; just inside it, it is', async () => {
  const h = trial('1'); fill(h, 12); ins(h, slot(4), 'repair', { finished: U + 86400e3 }); at(U + 2 * 86400e3); eq(await both(h), [200, 200], 'finished exactly at UNTIL + 24 h: outside the read');
  const g = trial('1'); fill(g, 12); ins(g, slot(4), 'repair', { finished: U + 86400e3 - 1 }); at(U + 2 * 86400e3); eq(await both(g), [200, 503], 'one millisecond inside');
});
await t('R5 the horizon the other way: a row finished after UNTIL + 24 h does not complete an overdue slot (it errs toward alerting)', async () => {
  const h = trial('1'); fill(h, 11); ins(h, slot(11), 'nn', { finished: U + 86400e3 + 5e3 }); at(U + 2 * 86400e3); eq(await both(h), [503, 200]);
});
await t('R6 rows finished before FROM are not read at all (an earlier trial, Stage C)', async () => {
  const h = trial('1'); ins(h, slot(0), 'repair', { finished: F - 1 }); ins(h, F - 86400e3, 'weirdNote', { finished: F - 86400e3 + 60e3 }); fill(h, 12);
  at(LAST); const g = await get(h, 'trial'); eq(g.status, 200); eq(g.body.facts.rows_read, 12);
});
await t('R7 one bounded SELECT per answer, through the (layer, finished_at) index, and nothing else', async () => {
  const h = trial('1'); fill(h, 12); at(LAST); const g = await get(h, 'runs'); eq(g.stmts.length, 1); yes(/WHERE layer = \? AND finished_at >= \? AND finished_at < \? ORDER BY finished_at LIMIT \?/.test(g.stmts[0]), g.stmts[0]);
  const plan = h.db.prepare('EXPLAIN QUERY PLAN ' + g.stmts[0]).all('earthview', FROM, UNTIL, 2000).map(r => r.detail).join(' | '); yes(/collector_runs_layer_finished/.test(plan) && !/SCAN/.test(plan), plan);
  const none = makeEnv({}); at(LAST); eq((await get(none, 'runs')).stmts.length, 0, 'no trial: no read');
});

// ===== P. pause limits (documented, not detected) =====
await t('P1 KNOWN LIMIT: a pause that misses no slot leaves no trace: every slot complete and the gate back at "1" is 200, 200', async () => {
  const h = trial('1'); fillTo(h, F + 3600e3 + ALLOW); at(F + 3600e3 + ALLOW); eq(await both(h), [200, 200]);
});
await t('P2 KNOWN LIMIT: gate off after the last trigger was admitted: red while off, green once the last slot is due and complete, with no closeout', async () => {
  const h = trial('manual'); fill(h, 12); at(LAST - 60e3); eq(await both(h), [503, 200]); at(LAST); eq(await both(h), [200, 200]);
});
await t('P3 a slot that really was missed while paused stays overdue after the gate is back on', async () => {
  const h = trial('1'); fill(h, 4); fill(h, 12, 'nn', 6); at(LAST + 60e3); eq(await both(h), [503, 200]); eq((await get(h, 'runs')).body.facts.overdue, 2);
});

// ===== H. the HTTP answer =====
await t('H1 HEAD gives the same status as GET with no body; every answer is no-store and carries X-Health', async () => {
  const cases = [[makeEnv({}), F], [trial('1'), F - 60e3], [trial('manual'), F + 60e3], [(() => { const h = trial('1'); ins(h, slot(0), 'repair'); return h; })(), F + 5 * MIN], [trial('1'), LAST], [makeEnv({ EARTHVIEW_ENABLED: 'x' }), F]];
  for (const [h, when] of cases) for (const w of ['runs', 'trial']) { at(when); const g = await get(h, w), hd = await get(h, w, 'HEAD');
    eq(hd.status, g.status, w); eq(hd.text, ''); for (const r of [g, hd]) { yes(/no-store/.test(r.headers.get('cache-control') || ''), 'no-store'); eq(r.headers.get('x-health'), g.status === 200 ? 'ok' : 'failing'); }
    eq([g.body.check, g.body.healthy, g.body.collector_version], [w + '/earthview', g.status === 200, '0.6.23']); }
});
await t('H2 no run note reaches the answer: fixed codes, times and counts only', async () => {
  const h = trial('1'); for (const [i, k] of ['pub', 'refused', 'repair', 'internal', 'weirdNote', 'sup', 'picfail'].entries()) ins(h, slot(i), k);
  at(LAST); for (const w of ['runs', 'trial']) { const g = await get(h, w); yes(!/SECRETNOTE|detail|structure|TypeError|brand new/.test(g.text), w + ' leaks note text: ' + g.text.slice(0, 300)); yes(!g.text.includes(h.env.ADMIN_KEY)); }
  const codes = (await get(h, 'trial')).body.facts.findings.map(x => x.code); for (const c of codes) yes(['storage_stop', 'unrecognised_outcome', 'three_slots_refused', 'six_slots_without_a_current_frame'].includes(c), c);
});
await t('H3 the other checks do not exist for earthview, and the trial check does not exist for other layers: 404', async () => {
  const h = trial('1'); at(F + 60e3);
  for (const p of ['/health/publication/earthview', '/health/archive/earthview', '/health/coverage/earthview', '/health/trial/usgs', '/health/trial/firms', '/health/trial', '/health/runs']) { const r = await worker.fetch(req(p), h.env); eq(r.status, 404, p); }
  eq((await worker.fetch(req('/health/runs/earthview', 'POST'), h.env)).status, 405);
});
await t('H4 the long lists are capped at 20 entries while the counts stay exact', async () => {
  const h = makeEnv({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: FROM, EARTHVIEW_UNTIL: '2026-11-25T06:00:00Z' }); at(Date.parse('2026-11-25T07:00:00Z'));
  const f = (await get(h, 'runs')).body.facts; eq([f.slots, f.settled, f.overdue, f.overdue_slots.length], [144, 144, 144, 20]);
});
await t('H5 anything unexpected inside the evaluation is the fixed code rows_unreadable, failing, with none of the exception\'s text', async () => {
  const h = trial('1'); Object.defineProperty(h.env, 'EARTHVIEW_FROM', { get() { throw new Error('SECRET-IN-EXCEPTION from a getter'); }, enumerable: true });
  at(F + 60e3); for (const w of ['runs', 'trial']) { const g = await get(h, w); eq(g.status, 503, w); eq(g.body.reasons, ['rows_unreadable']); yes(!g.text.includes('SECRET'), 'exception text in the answer'); eq((await get(h, w, 'HEAD')).status, 503); }
});

// ===== I. through the real scheduled job =====
const realLog = console.log, quiet = async fn => { console.log = () => {}; try { return await fn(); } finally { console.log = realLog; } };
await t('I1 a scheduled Earth from Space run writes its row with the trigger\'s scheduled time exactly on the mark, and that row completes the slot', async () => {
  const h = trial('1'); at(slot(0) + 8e3);   // the trigger is delivered 8 s late; its scheduled time is the mark
  await quiet(() => worker.scheduled({ cron: '*/5 * * * *', scheduledTime: slot(0) }, h.env, { waitUntil() {} }));
  const rows = h.db.prepare("SELECT started_at, status, note FROM collector_runs WHERE layer = 'earthview'").all();
  eq(rows.length, 1); eq(rows[0].started_at, '2026-11-24T06:00:00.000Z'); eq(W.evhKind({ ...rows[0], records: 0 }), 'guard_refused');   // storage is empty in this suite: the run stops at its first guard
  at(slot(0) + ALLOW); eq(await both(h), [200, 200]);
  await quiet(() => worker.scheduled({ cron: '*/5 * * * *', scheduledTime: slot(0) + 5 * MIN }, h.env, { waitUntil() {} }));   // the :05 tick is not an Earth from Space time
  eq(h.db.prepare("SELECT COUNT(*) AS n FROM collector_runs WHERE layer = 'earthview'").get().n, 1);
});
await t('I2 with the gate at "manual" the scheduled job writes no Earth from Space row, and the runs address says "not collecting"', async () => {
  const h = trial('manual'); at(slot(0) + 8e3); await quiet(() => worker.scheduled({ cron: '*/5 * * * *', scheduledTime: slot(0) }, h.env, { waitUntil() {} }));
  eq(h.db.prepare("SELECT COUNT(*) AS n FROM collector_runs WHERE layer = 'earthview'").get().n, 0); eq(await both(h), [503, 200]);
});

console.log(`\nearthview-health${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${passed} passed, ${failed} failed`);
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(failed ? 1 : 0);
