/* Earth from Space, Stage A probe: turns the probe's log lines and Cloudflare's invocation records into the criteria of the
 * packet, per picture size. Written and reviewed BEFORE the probe runs, so the result is read by rule.
 *   evaluate({ start, build, lines, invocations, diagnoses }, planOf)
 *     start, build  the reviewed probe's start time and build id (EVPROBE_BUILD). Lines that say otherwise are not evidence.
 *     lines         the probe's JSON log lines (objects), any order
 *     invocations   one per cron invocation: { scheduled: ISO or ms, outcome, cpu_ms, wall_ms } from Cloudflare's invocation log
 *     diagnoses     optional { '<picture sha256> <check sha256> <size>': 'a' | 'b' | 'c' } for refused inputs: a = the picture was
 *                   faulty; b = sound and the refusal reproduces; c = sound and it does not. Keyed by the BYTES, not the frame time:
 *                   the service may render one frame time differently on another request.
 * RULES
 *  - Evidence is read per ATTEMPT (the probe's attempt id), never stitched across attempts of one slot.
 *  - An attempt is COMPLETE only with exactly: one start (right start, build, phase, size, ballast for its slot), one fetched, every
 *    validate-begin and validated index 1..N once (N = 6 in phase 2, else 1), one done whose counts agree with those lines; and in
 *    phase 3 one ballast line of the planned size and ballast_ok true.
 *  - A slot is CLEAN only with exactly one attempt, complete, and exactly one invocation record whose outcome is 'ok'.
 *    Its CPU figure counts only if it is a finite number >= 0 (0 is a real value; null, '', text and NaN are missing).
 *  - Anything observed going wrong in ANY attempt or invocation of a slot counts against it; a second, clean attempt does not erase it.
 *  - A criterion is 'not met' only on an OBSERVED failure. Missing lines or missing records are 'incomplete': absence of a
 *    completion line does not show that the run failed.
 *   node phase1/evprobe.report.mjs <lines.jsonl> <invocations.json> [diagnoses.json]   prints the result for phase1/evprobe.js */
import fs from 'node:fs';
export const CPU_SINGLE_MAX_MS = 5000, CHECKPOINT_MIB = 48;
const cpuOf = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0) ? v : null;
const RESOURCE = /^exceeded(Memory|Cpu)$/;
export async function evaluate({ start, build, lines, invocations = [], diagnoses = {} }, planOf) {
  const plan = planOf(Date.parse(start)), SLOT = 600000, runs = plan.filter(s => !s.excluded);
  const slotOf = t => { const ms = typeof t === 'number' ? t : Date.parse(t); return Number.isFinite(ms) ? Math.round((Math.floor(ms / SLOT) * SLOT - Date.parse(start)) / SLOT) : null; };
  const mine = (lines || []).filter(l => l && l.probe === 'evprobe' && Number.isInteger(l.k)), stray = [];
  const byK = new Map(); for (const l of mine) { if (l.ev === 'excluded' || l.ev === 'not run' || l.ev === 'not started' || l.ev === 'expired') continue;
    const id = typeof l.attempt === 'string' && l.attempt ? l.attempt : null; if (!id) { stray.push({ k: l.k, ev: l.ev, why: 'no attempt id' }); continue; }
    if (!byK.has(l.k)) byK.set(l.k, new Map()); const A = byK.get(l.k); if (!A.has(id)) A.set(id, []); A.get(id).push(l); }
  const strayK = new Set(stray.map(x => x.k)), invK = new Map(); for (const i of invocations || []) { const k = slotOf(i && i.scheduled); if (k === null) continue; if (!invK.has(k)) invK.set(k, []); invK.get(k).push(i); }
  const readAttempt = (s, id, L) => { const of = ev => L.filter(l => l.ev === ev), st = of('start'), fe = of('fetched'), dn = of('done'), ba = of('ballast'), vb = of('validate-begin'), va = of('validated'), N = s.validations, problems = [];
    for (const l of L) if (l.phase !== s.phase || l.size !== s.size || l.ballast_mib !== s.ballast_mib) { problems.push('a line does not match the plan for this slot (phase, size or ballast)'); break; }
    if (st.length !== 1) problems.push(st.length + ' start lines'); else { if (st[0].start !== start) problems.push('start time is not the reviewed one'); if (st[0].build !== build) problems.push('build is not the reviewed one'); if (slotOf(st[0].scheduled) !== s.k) problems.push('scheduled time is not this slot'); }
    const once = (arr, what) => { const idx = arr.map(l => l.i).sort((a, b) => a - b).join(), want = Array.from({ length: N }, (_, i) => i + 1).join(); return idx === want ? null : `${what} indices ${idx || 'none'}, expected ${want}`; };
    const ended = dn.length === 1 ? dn[0] : null, stage = !st.length ? 'before its first line' : s.ballast_mib && !ba.length ? 'taking the extra memory' : !fe.length ? 'before the pictures were fetched' : vb.length > va.length ? `decoding (validation ${Math.max(...vb.map(l => l.i))})` : !ended ? `after validation ${va.length}` : null;
    if (!ended) problems.push(dn.length ? dn.length + ' done lines' : 'no done line (last seen: ' + stage + ')');
    if (fe.length !== 1) problems.push(fe.length + ' fetched lines');
    const fetchedOk = fe.length === 1 && fe[0].picture && fe[0].picture.ok === true && fe[0].check && fe[0].check.ok === true, validating = ended && (ended.outcome === 'validated' || ended.outcome === 'validation refused');
    if (ended && !validating) problems.push('ended without validating: ' + ended.outcome);
    if (validating || vb.length || va.length) { const a = once(vb, 'validate-begin'), b = once(va, 'validated'); if (a) problems.push(a); if (b) problems.push(b); }
    const refused = va.filter(v => v.ok !== true);
    if (validating && (ended.validations !== N || ended.refused !== refused.length || (ended.outcome === 'validated') !== (refused.length === 0))) problems.push('the done line does not agree with the validation lines');
    if (s.ballast_mib && (ba.length !== 1 || ba[0].held_mib !== s.ballast_mib)) problems.push('ballast line missing or of another size');
    const f = fe.length === 1 ? fe[0] : null;
    return { id, complete: problems.length === 0, problems, stage: ended ? null : stage, frame_time: f ? f.frame_time : null, header_ok: f && fetchedOk ? f.header_ok === true : null,
      header: f ? { picture_present: f.picture && f.picture.header_present, picture_names: f.picture && f.picture.header_names, check_present: f.check && f.check.header_present, check_names: f.check && f.check.header_names } : null,
      inputs: f && fetchedOk ? `${f.picture.sha256} ${f.check.sha256} ${s.size}` : null, refused: refused.map(v => ({ reason: v.reason, detail: v.detail })), outcome: ended ? ended.outcome : null, ballast_ok: ended ? ended.ballast_ok === true : null, overlapping: st.length ? st[0].overlapping || 0 : 0 }; };
  const slots = runs.map(s => { const A = [...(byK.get(s.k) || new Map())].map(([id, L]) => readAttempt(s, id, L)), inv = invK.get(s.k) || [], one = A.length === 1 && inv.length === 1 && !strayK.has(s.k);
    const resource = inv.filter(i => RESOURCE.test(String(i.outcome))).map(i => i.outcome), okOutcome = one && inv[0].outcome === 'ok';
    const clean = one && A[0].complete && okOutcome && A[0].outcome === 'validated' && (!s.ballast_mib || A[0].ballast_ok === true);
    const state = !A.length && !inv.length ? 'not run' : clean ? 'clean' : resource.length ? 'ended for ' + resource.join('+') : 'not clean';
    const why = clean || state === 'not run' ? [] : [...(A.length !== 1 ? [A.length + ' attempts'] : []), ...(inv.length !== 1 ? [inv.length + ' invocation records'] : []), ...(strayK.has(s.k) ? ['lines without an attempt id'] : []), ...(one && !okOutcome ? ['outcome ' + JSON.stringify(inv[0].outcome)] : []), ...A.flatMap(a => a.problems.map(p => `attempt ${a.id}: ${p}`))];
    return { ...s, state, clean, why, attempts: A, invocations: inv.length, outcomes: inv.map(i => i.outcome), resource, cpu_ms: one ? cpuOf(inv[0].cpu_ms) : null, died_at: A.map(a => a.stage).filter(Boolean) }; });
  const sizes = {};
  for (const size of [...new Set(runs.map(s => s.size))]) {
    const S = slots.filter(s => s.size === size), ph = n => S.filter(s => s.phase === n), p12 = [...ph(1), ...ph(2)];
    const count = L => ({ planned: L.length, clean: L.filter(s => s.clean).length, not_run: L.filter(s => s.state === 'not run').length, other: L.filter(s => !s.clean && s.state !== 'not run').length });
    const tri = (failed, allSeen) => failed ? 'not met' : allSeen ? 'met' : 'incomplete';
    // 1. phases 1 and 2: no invocation ended for memory or CPU. Not met only on an observed resource outcome.
    const killed = p12.filter(s => s.resource.length), c1 = tri(killed.length > 0, p12.every(s => s.clean || (s.attempts.length === 1 && s.attempts[0].complete && s.invocations === 1 && s.outcomes[0] === 'ok')));
    // 2. phase 1: both responses named the requested time, in every planned run. Any attempt that saw otherwise counts.
    const h = ph(1), hFailed = h.flatMap(s => s.attempts.filter(a => a.header_ok === false).map(a => ({ k: s.k, at: s.at, attempt: a.id, frame_time: a.frame_time, ...a.header }))), hSeen = h.filter(s => s.attempts.length === 1 && s.attempts[0].header_ok === true && !strayK.has(s.k));
    const c2 = tri(hFailed.length > 0, hSeen.length === h.length);
    // 3. every refusal diagnosed, by the bytes that were refused
    const refusals = p12.flatMap(s => s.attempts.flatMap(a => a.refused.map(r => ({ k: s.k, at: s.at, attempt: a.id, frame_time: a.frame_time, inputs: a.inputs, ...r, diagnosis: (a.inputs && diagnoses[a.inputs]) || null }))));
    const c3 = tri(refusals.some(r => r.diagnosis === 'b' || r.diagnosis === 'c'), refusals.every(r => r.diagnosis === 'a') && p12.every(s => s.attempts.length === 1 && s.attempts[0].complete && !strayK.has(s.k)));
    // 4. CPU: the maximum over phase 1's single-validation runs, from valid figures only
    const cpu1 = ph(1).filter(s => s.cpu_ms !== null), cpuMax = cpu1.length ? Math.max(...cpu1.map(s => s.cpu_ms)) : null, cpu2 = ph(2).filter(s => s.cpu_ms !== null);
    const c4 = tri(cpuMax !== null && cpuMax >= CPU_SINGLE_MAX_MS, cpu1.length === ph(1).length && ph(1).every(s => s.clean));
    // 5. the ladder as observed; checkpoint: every planned run at and below CHECKPOINT_MIB clean (complete, validated, memory intact, invocation 'ok')
    const rungs = [...new Set(ph(3).map(s => s.ballast_mib))].sort((a, b) => a - b).map(b => { const R = ph(3).filter(s => s.ballast_mib === b);
      return { mib: b, planned: R.length, clean: R.filter(s => s.clean).length, ended_for_resources: R.filter(s => s.resource.length).length, runs: R.map(s => ({ k: s.k, at: s.at, state: s.state, died_at: s.died_at, outcomes: s.outcomes, why: s.why })) }; });
    const upTo = rungs.filter(r => r.mib <= CHECKPOINT_MIB), upSlots = ph(3).filter(s => s.ballast_mib <= CHECKPOINT_MIB);
    const c5 = tri(upSlots.some(s => s.resource.length || s.attempts.some(a => a.ballast_ok === false || a.refused.length)), upTo.length > 0 && upSlots.every(s => s.clean));
    const top = rungs[rungs.length - 1], notes = [];
    if (top && top.planned && top.clean === top.planned) notes.push(`every run at ${top.mib} MiB completed: the extra memory may not be counted toward the limit, in which case the ladder measured nothing`);
    if (S.some(s => s.attempts.some(a => a.overlapping))) notes.push('runs overlapped in one isolate, slots: ' + S.filter(s => s.attempts.some(a => a.overlapping)).map(s => s.k).join(', '));
    if (S.some(s => s.attempts.length > 1 || s.invocations > 1)) notes.push('slots with more than one attempt or invocation record (none of them counts as clean): ' + S.filter(s => s.attempts.length > 1 || s.invocations > 1).map(s => s.k).join(', '));
    const frames = [...new Set(S.flatMap(s => s.attempts.map(a => a.frame_time)).filter(Boolean))].sort(), crit = { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 }, vals = Object.values(crit);
    sizes[size] = { verdict: vals.includes('not met') ? 'does not qualify' : vals.includes('incomplete') ? 'incomplete' : 'qualifies', criteria: crit,
      runs: { phase1: count(ph(1)), phase2: count(ph(2)), phase3: count(ph(3)) }, ended_for_resources_in_phases_1_2: killed.map(s => ({ k: s.k, at: s.at, outcomes: s.outcomes, died_at: s.died_at })),
      header: { planned: h.length, observed_matching: hSeen.length, failures: hFailed }, refusals,
      cpu: { single_validation_max_ms: cpuMax, valid_figures: cpu1.length, planned: ph(1).length, six_validations_max_ms: cpu2.length ? Math.max(...cpu2.map(s => s.cpu_ms)) : null, limit_ms: CPU_SINGLE_MAX_MS },
      ladder: rungs.map(r => ({ mib: r.mib, planned: r.planned, clean: r.clean, ended_for_resources: r.ended_for_resources, died_at: r.runs.flatMap(x => x.died_at) })), ladder_runs: rungs,
      not_clean: S.filter(s => !s.clean && s.state !== 'not run').map(s => ({ k: s.k, at: s.at, phase: s.phase, state: s.state, why: s.why })),
      coverage: { distinct_frames: frames.length, first: frames[0] || null, last: frames[frames.length - 1] || null }, notes };
  }
  const order = Object.keys(sizes).map(Number).sort((a, b) => b - a), goes = order.find(s => sizes[s].verdict === 'qualifies') || null;
  const attempts = slots.reduce((n, s) => n + s.attempts.length, 0), other = mine.filter(l => l.ev === 'not run').map(l => ({ k: l.k, why: l.why, actual: l.actual }));
  return { start, build, slots: plan.length, runs_planned: runs.length, excluded: plan.filter(s => s.excluded).map(s => s.at), requests_planned_at_most: runs.length * 3, attempts_observed: attempts, requests_observed_at_most: attempts * 3,
    ticks_not_run: other, lines_without_attempt_id: stray.length,
    forward: goes ? String(goes) : order.some(s => sizes[s].verdict === 'incomplete') ? 'undecided: the experiment is incomplete' : 'neither size qualifies', sizes, slots_detail: slots };
}
if (process.argv[1] && process.argv[1].endsWith('evprobe.report.mjs') && process.argv.length >= 4) {
  const P = (await import(new URL('./evprobe.js', import.meta.url))).default.__probe, [, , lf, inf, df] = process.argv;
  const lines = fs.readFileSync(lf, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  const r = await evaluate({ start: P.PROBE_START, build: P.EVPROBE_BUILD, lines, invocations: JSON.parse(fs.readFileSync(inf, 'utf8')), diagnoses: df ? JSON.parse(fs.readFileSync(df, 'utf8')) : {} }, P.evprobePlan); delete r.slots_detail; for (const s of Object.values(r.sizes)) delete s.ladder_runs;
  console.log(JSON.stringify(r, null, 1));
}
