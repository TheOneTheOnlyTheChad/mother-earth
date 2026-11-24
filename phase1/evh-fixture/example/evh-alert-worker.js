// THROWAWAY TEST WORKER "mother-earth-evhtest". NOT THE HUB. Built by phase1/evh-fixture/build.mjs; do not edit by hand.
// Plan: reviews/2026-11-23-earth-from-space-alert-test-plan.md rev 1.2, sections 2 to 6. NO bindings, no cron, no route, no secret.
// It answers /health/runs/earthview and /health/trial/earthview from MADE-UP run records, by the clock. Everything else is 404.
const FX_T0 = '2026-11-26T08:00:00Z';   // the only line that differs between two builds
/* FIXTURE. HEALTH.checks holds only the two entries used. */
const HEALTH = { checks: { runs: ['earthview'], trial: ['earthview'] } };
/* ======================= COPIED, byte for byte, from phase1/worker.js =======================
 * source sha256 db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5, 551400 bytes. 19 spans; each is a contiguous part of that file.
 * COLLECTOR_VERSION (84), CORS (6034), json (6364-6366), redactText (2782-2786), healthNote (2788), HEALTH_SKEW_MS (2797), EV_STOP (3591), EV_WINDOW_MAX_MS (5800), evMark (5802-5806), EVH (2929), EVH_POST_CHECK (2930), EVH_FETCH_FAIL (2931), evhKind (2933-2949), evhConfig (2951-2959), evhEvaluate (2961-3015), evhSafe (3017), healthEvRuns (3018), healthEvTrial (3019), health (3020-3033)
 * health() also names four handlers of other layers that are NOT copied. They are reached only for a layer other than
 * earthview, and the fixture router below never passes one. ========================================================== */
const COLLECTOR_VERSION = '0.6.24';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...CORS, ...extra } });
}
function redactText(env, s, tokens = true) {
  let t = String(s == null ? '' : s);
  for (const v of Object.values(env || {})) if (typeof v === 'string' && v.length >= 16) t = t.split(v).join('[redacted]');
  return tokens ? t.replace(/[A-Za-z0-9_\-]{32,}/g, '[redacted]') : t;
}
function healthNote(env, s) { return redactText(env, s).slice(0, 160); }
const HEALTH_SKEW_MS = 5 * 60e3;   // a recorded time more than 5 min after "now" is corrupt evidence, never fresh evidence
const EV_STOP = { HELD: 'collection is held', UNSET: 'storage is not set up', REPAIR: 'storage record needs repair', BUSY: 'storage busy', CHANGED: 'storage changed during the run' };
const EV_WINDOW_MAX_MS = 48 * 3600 * 1000;
function evMark(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d0:00Z$/.test(v)) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) || new Date(t).toISOString() !== v.replace(/Z$/, '.000Z') ? null : t;
}
const EVH = { SLOT_MS: 600e3, ALLOW_MS: 1200e3, HORIZON_MS: 24 * 3600e3, ROW_LIMIT: 2000, LIST_MAX: 20, C6_RUN: 3, C8_RUN: 6 };
const EVH_POST_CHECK = ['served time not confirmed', 'served a different frame', 'picture write failed', 'picture key already in use', 'picture read-back differs', 'stored copy is being removed'];
const EVH_FETCH_FAIL = /^(picture|check image) (request failed|http error|not a picture|size out of range)$/;
function evhKind(row) {
  const note = typeof row.note === 'string' ? row.note : '', reason = note.split(' — ')[0];
  if (row.status === 'ok') {
    if (Number(row.records) === 1 && note.startsWith('frame ')) return 'published';
    if (Number(row.records) === 0 && note.startsWith('nothing newer: ')) return 'nothing_newer';
    if (Number(row.records) === 0 && note.startsWith('superseded: ')) return 'superseded';
    return 'unrecognised';
  }
  if (row.status !== 'down') return 'unrecognised';
  if (reason === EV_STOP.REPAIR || reason === EV_STOP.CHANGED || reason === EV_STOP.BUSY) return 'storage_stop';
  if (reason === EV_STOP.HELD || reason === EV_STOP.UNSET) return 'guard_refused';
  if (reason === 'source check failed') return 'source_check_failed';
  if (reason === 'picture failed validation' || reason === 'check image failed validation') return 'validation_refused';
  if (EVH_POST_CHECK.includes(reason) || EVH_FETCH_FAIL.test(reason)) return 'post_check_failure';
  if (reason === 'internal error') return 'internal_error';
  return 'unrecognised';
}
function evhConfig(env) {
  const g = env.EARTHVIEW_ENABLED, gate = g === undefined ? 'unset' : g === 'manual' ? 'manual' : g === '1' ? '1' : 'unknown';
  if (gate === 'unknown') return { gate, fail: 'gate_unknown_value' };
  const hasF = env.EARTHVIEW_FROM !== undefined, hasU = env.EARTHVIEW_UNTIL !== undefined;
  if (!hasF && !hasU) return gate === '1' ? { gate, fail: 'gate_on_without_window' } : { gate, none: true };
  const from = evMark(env.EARTHVIEW_FROM), until = evMark(env.EARTHVIEW_UNTIL);
  if (from === null || until === null || until <= from || until - from > EV_WINDOW_MAX_MS) return { gate, fail: 'window_not_readable' };
  return { gate, from, until };
}
async function evhEvaluate(env, nowMs) {
  const iso = ms => new Date(ms).toISOString(), c = evhConfig(env);
  const both = (code, state, facts) => ({ runs: { healthy: false, reasons: [code], facts: { state, ...facts } }, trial: { healthy: false, reasons: [code], facts: { state, ...facts } } });
  if (c.fail) return both(c.fail, { gate_unknown_value: 'gate has an unknown value', gate_on_without_window: 'gate is 1 with no window', window_not_readable: 'window not readable' }[c.fail], { gate: c.gate });
  if (c.none) { const f = { state: 'no trial configured', gate: c.gate }; return { runs: { healthy: true, reasons: [], facts: f }, trial: { healthy: true, reasons: [], facts: f } }; }
  const { from, until, gate } = c, on = gate === '1', nSlots = (until - from) / EVH.SLOT_MS, last = until - EVH.SLOT_MS + EVH.ALLOW_MS;
  const base = { gate, from: iso(from), until: iso(until), slots: nSlots, allow_s: EVH.ALLOW_MS / 1000 };
  if (nowMs < from) {
    const f = { state: on ? 'armed' : 'window set but gate is not 1', ...base };
    return { runs: { healthy: on, reasons: on ? [] : ['not_collecting'], facts: f }, trial: { healthy: true, reasons: [], facts: f } };
  }
  // The rows of this trial: finished inside [FROM, UNTIL + 24 h), oldest first, through the (layer, finished_at) index, bounded.
  let rows;
  try {
    const r = await env.DB.prepare('SELECT started_at, finished_at, status, records, note FROM collector_runs WHERE layer = ? AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?')
      .bind('earthview', iso(from), iso(until + EVH.HORIZON_MS), EVH.ROW_LIMIT).all();
    rows = r && r.results;
    if (!Array.isArray(rows)) throw new Error('no result list');
  } catch (_) { return both('rows_unreadable', 'rows unreadable', base); }
  if (rows.length >= EVH.ROW_LIMIT) return both('too_many_rows', 'too many rows to evaluate', { ...base, rows_read: rows.length });
  // Per slot: flags that are true if ANY of its rows says so. A good row never removes a bad flag; evidence that the held frame
  // was current counts only from a row finished at or before the slot's due time.
  const slot = Array.from({ length: nSlots }, () => ({ rows: 0, refused: false, storage_stop: false, newer_listed: false, current: false, unrecognised: false }));
  let outside = 0;
  for (const row of rows) {
    const s = Date.parse(row.started_at), f = Date.parse(row.finished_at);
    if (!Number.isFinite(f) || f > nowMs + HEALTH_SKEW_MS) return both('rows_unreadable', 'rows unreadable', base);
    if (!Number.isFinite(s)) return both('rows_unreadable', 'rows unreadable', base);   // cannot be assigned to a slot or excluded from one
    if (s < from || s >= until || (s - from) % EVH.SLOT_MS !== 0) { outside++; continue; }
    const x = slot[(s - from) / EVH.SLOT_MS], k = evhKind(row); x.rows++;
    if (k === 'unrecognised') x.unrecognised = true;
    if (k === 'storage_stop') x.storage_stop = true;
    if (k === 'validation_refused') x.refused = true;
    if (k === 'validation_refused' || k === 'post_check_failure') x.newer_listed = true;
    if ((k === 'published' || k === 'superseded' || k === 'nothing_newer') && f <= s + EVH.ALLOW_MS) x.current = true;
  }
  const at = i => iso(from + i * EVH.SLOT_MS);
  let settled = 0; while (settled < nSlots && nowMs >= from + settled * EVH.SLOT_MS + EVH.ALLOW_MS) settled++;   // due at equality
  const overdue = [], complete = slot.filter(x => x.rows > 0).length;
  for (let i = 0; i < settled; i++) if (!slot[i].rows) overdue.push(at(i));
  // trial findings. c3 and unrecognised: any slot of the trial, settled or not. c6 and c8: settled slots only, in scheduled order.
  const findings = [];
  slot.forEach((x, i) => { if (x.storage_stop) findings.push({ code: 'storage_stop', slot: at(i) }); if (x.unrecognised) findings.push({ code: 'unrecognised_outcome', slot: at(i) }); });
  for (let i = 0; i + EVH.C6_RUN <= settled; i++) if (slot.slice(i, i + EVH.C6_RUN).every(x => x.refused)) { findings.push({ code: 'three_slots_refused', slot: at(i) }); break; }
  for (let i = 0; i + EVH.C8_RUN <= settled; i++) { const w = slot.slice(i, i + EVH.C8_RUN); if (w.every(x => !x.current) && w.some(x => x.newer_listed)) { findings.push({ code: 'six_slots_without_a_current_frame', slot: at(i) }); break; } }
  const runsReasons = [];
  if (!on && nowMs < last) runsReasons.push('not_collecting');
  if (overdue.length) runsReasons.push('completion_missing');
  const trialReasons = [...new Set(findings.map(x => x.code))];
  const ended = nowMs >= last, clean = !overdue.length && !findings.length;
  const state = ended ? (clean ? 'trial complete, nothing outstanding' : 'trial ended with outstanding findings')
    : !on ? 'trial window set but not collecting' : nowMs < from + EVH.ALLOW_MS ? 'starting' : 'active';
  const facts = { state, ...base, settled, complete, overdue: overdue.length, overdue_slots: overdue.slice(0, EVH.LIST_MAX), findings: findings.slice(0, EVH.LIST_MAX), rows_read: rows.length, rows_outside_slots: outside };
  return { runs: { healthy: !runsReasons.length, reasons: runsReasons, facts }, trial: { healthy: !trialReasons.length, reasons: trialReasons, facts } };
}
const evhSafe = async (env, nowMs, which) => { try { return (await evhEvaluate(env, nowMs))[which]; } catch (_) { return { healthy: false, reasons: ['rows_unreadable'], facts: { state: 'rows unreadable' } }; } };
const healthEvRuns = (env, _layer, nowMs) => evhSafe(env, nowMs, 'runs');
const healthEvTrial = (env, _layer, nowMs) => evhSafe(env, nowMs, 'trial');
async function health(req, env, check, layer) {
  const fn = layer === 'earthview' ? { runs: healthEvRuns, trial: healthEvTrial }[check]   // 0.6.23
    : { runs: healthRuns, publication: healthPublication, archive: healthArchive, coverage: healthCoverage }[check];
  const nowMs = Date.now(), hdr = { 'Cache-Control': 'no-store, max-age=0' };
  const known = fn && (HEALTH.checks[check] || []).includes(layer);
  let out;
  if (!known) out = { status: 404, body: { error: 'no such health check', checks: Object.entries(HEALTH.checks).flatMap(([k, ls]) => ls.map(l => `/health/${k}/${l}`)) } };
  else {
    let r; try { r = await fn(env, layer, nowMs); } catch (e) { r = { healthy: false, reasons: ['health data unreadable: ' + healthNote(env, String(e && e.message || e))] }; }
    out = { status: r.healthy ? 200 : 503, body: { check: `${check}/${layer}`, healthy: r.healthy, verdict: r.healthy ? 'ok' : 'failing', reasons: r.reasons, checked_at: new Date(nowMs).toISOString(), collector_version: COLLECTOR_VERSION, facts: r.facts || null } };
  }
  if (req.method === 'HEAD') return new Response(null, { status: out.status, headers: { 'Content-Type': 'application/json', ...CORS, ...hdr, 'X-Health': out.body.verdict || 'unknown-check' } });
  return json(out.body, out.status, { ...hdr, 'X-Health': out.body.verdict || 'unknown-check' });
}
/* ======================= end of the copied code ======================= */

/* FIXTURE from here on. The made-up trial (plan 2.2): FROM = T0 - 44 h, UNTIL = T0 + 4 h, 288 slots, one good row per slot finished
 * 15 s after its mark, except slot A (T0 + 30 min: its good row finishes at T0 + 100 min) and slot B (T0 + 120 min: a storage stop).
 * Simulated closeout at T0 + 170 min: from then on there is no window and the gate is manual. */
const FX_SQL = "SELECT started_at, finished_at, status, records, note FROM collector_runs WHERE layer = ? AND finished_at >= ? AND finished_at < ? ORDER BY finished_at LIMIT ?";   // the production query, read out of the copied code by the build
const FX = (() => { const t0 = Date.parse(FX_T0), m = 60e3, h = 3600e3; return { T0: t0, FROM: t0 - 44 * h, UNTIL: t0 + 4 * h, A: t0 + 30 * m, A_FIN: t0 + 100 * m, B: t0 + 120 * m, CLOSE: t0 + 170 * m }; })();
const fxIso = ms => new Date(ms).toISOString(), fxMark = ms => fxIso(ms).replace('.000Z', 'Z');
const FX_ROWS = (() => {
  const rows = [];
  for (let s = FX.FROM; s < FX.UNTIL; s += 600e3) {
    if (s === FX.B) rows.push({ layer: 'earthview', started_at: fxIso(s), finished_at: fxIso(s + 15e3), status: 'down', records: 0, note: 'storage busy' });
    else rows.push({ layer: 'earthview', started_at: fxIso(s), finished_at: fxIso(s === FX.A ? FX.A_FIN : s + 15e3), status: 'ok', records: 0, note: 'nothing newer: fixture frame' });
  }
  return rows.sort((a, b) => (a.finished_at < b.finished_at ? -1 : a.finished_at > b.finished_at ? 1 : 0));
})();
/* The stand-in for env.DB. It answers ONLY the production query, applies that query's own bounds (layer, finished_at range, order,
 * limit), and adds ONE rule of its own: a row is returned only once the clock has reached its finished_at. */
function fxDb() {
  return { prepare(sql) {
    if (sql !== FX_SQL) throw new Error('fixture: unexpected query');
    return { bind(layer, ge, lt, limit) { return { async all() {
      const now = Date.now();
      return { results: FX_ROWS.filter(r => r.layer === layer && r.finished_at >= ge && r.finished_at < lt && Date.parse(r.finished_at) <= now).slice(0, limit)
        .map(r => ({ started_at: r.started_at, finished_at: r.finished_at, status: r.status, records: r.records, note: r.note })) };
    } }; } };
  } };
}
/* The env handed to the copied code. Decided by the clock; the Worker's real env is never read. */
function fxEnv(nowMs) {
  return nowMs >= FX.CLOSE ? { EARTHVIEW_ENABLED: 'manual', DB: fxDb() }
    : { EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: fxMark(FX.FROM), EARTHVIEW_UNTIL: fxMark(FX.UNTIL), DB: fxDb() };
}

/* FIXTURE. The router. Only these two exact paths, by GET or HEAD, reach the copied health(). Everything else is answered here. */
const FX_PATHS = { '/health/runs/earthview': ['runs', 'earthview'], '/health/trial/earthview': ['trial', 'earthview'] };
const FX_NOSTORE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' };
function fxRoute(req) {
  let p; try { p = new URL(req.url).pathname; } catch (_) { p = ''; }
  const hit = Object.prototype.hasOwnProperty.call(FX_PATHS, p) ? FX_PATHS[p] : null;
  if (!hit) return { res: new Response(req.method === 'HEAD' ? null : JSON.stringify({ error: 'not found' }), { status: 404, headers: FX_NOSTORE }) };
  if (req.method !== 'GET' && req.method !== 'HEAD') return { res: new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: { ...FX_NOSTORE, Allow: 'GET, HEAD' } }) };
  return { hit };
}
export default { async fetch(req) { const r = fxRoute(req); return r.res || health(req, fxEnv(Date.now()), r.hit[0], r.hit[1]); } };
