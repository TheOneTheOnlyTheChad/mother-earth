/* Earth from Space, Stage A probe: turns the probe's log lines and Cloudflare's invocation records into the criteria of the
 * release-readiness packet, per picture size. Written and reviewed BEFORE the probe runs, so the result is read by rule.
 *   evaluate({ start, lines, invocations, diagnoses })
 *     start        the probe's start time (ISO)
 *     lines        the probe's own JSON log lines (objects), any order
 *     invocations  one per cron invocation: { scheduled: ISO or ms, outcome: 'ok' | 'exceededMemory' | 'exceededCpu' | …, cpu_ms, wall_ms }
 *     diagnoses    optional { '<frame time> <size>': 'a' | 'b' | 'c' } for refused frames: a = the picture was faulty; b = sound and
 *                  the refusal reproduces; c = sound and it does not reproduce
 * A criterion is 'met', 'not met' or 'incomplete'. A MISSING observation is never counted as a success or as a failure.
 *   node phase1/evprobe.report.mjs <start> <lines.jsonl> <invocations.json> [diagnoses.json]   prints the result */
import fs from 'node:fs';
export const CPU_SINGLE_MAX_MS = 5000, CHECKPOINT_MIB = 48;
export async function evaluate({ start, lines, invocations = [], diagnoses = {} }, planOf) {
  const plan = planOf(Date.parse(start)), SLOT = 600000, slotOf = t => Math.round((Math.floor((typeof t === 'number' ? t : Date.parse(t)) / SLOT) * SLOT - Date.parse(start)) / SLOT);
  const byK = new Map(); for (const l of lines) { if (!l || l.probe !== 'evprobe' || typeof l.k !== 'number') continue; if (!byK.has(l.k)) byK.set(l.k, []); byK.get(l.k).push(l); }
  const invK = new Map(); for (const i of invocations) { const k = slotOf(i.scheduled); if (!invK.has(k)) invK.set(k, []); invK.get(k).push(i); }
  const slots = plan.filter(s => !s.excluded).map(s => { const L = byK.get(s.k) || [], inv = invK.get(s.k) || [], has = ev => L.filter(l => l.ev === ev), done = has('done')[0] || null, fetched = has('fetched')[0] || null;
    const starts = has('start').length, begun = has('validate-begin').length, validated = has('validated');
    const state = !starts && !inv.length ? 'not run' : done ? 'completed' : 'incomplete';
    const died_at = state !== 'incomplete' ? null : !starts ? 'before its first line' : s.ballast_mib && !has('ballast').length ? 'taking the extra memory' : !fetched ? 'before the pictures were fetched' : begun > validated.length ? 'decoding (validation ' + begun + ')' : 'after validation ' + validated.length;
    return { ...s, state, died_at, starts, invocations: inv.length, outcome: inv.length ? inv.map(i => i.outcome).join('+') : null, cpu_ms: inv.length ? Math.max(...inv.map(i => Number(i.cpu_ms))) : null,
      frame_time: fetched ? fetched.frame_time : null, header_ok: fetched ? fetched.header_ok === true : null, header: fetched ? { picture: fetched.picture && fetched.picture.header_names, check: fetched.check && fetched.check.header_names, picture_present: fetched.picture && fetched.picture.header_present, check_present: fetched.check && fetched.check.header_present } : null,
      result: done ? done.outcome : null, refused: validated.filter(v => !v.ok).map(v => ({ reason: v.reason, detail: v.detail })), ballast_ok: done ? done.ballast_ok : null, overlapping: (has('start')[0] || {}).overlapping || 0, isolate_run: (has('start')[0] || {}).isolate_run || null }; });
  const sizes = {};
  for (const size of [...new Set(plan.filter(s => !s.excluded).map(s => s.size))]) {
    const S = slots.filter(s => s.size === size), ph = n => S.filter(s => s.phase === n), bad = s => s.outcome && /exceeded/i.test(s.outcome);
    const count = L => ({ planned: L.length, completed: L.filter(s => s.state === 'completed').length, incomplete: L.filter(s => s.state === 'incomplete').length, not_run: L.filter(s => s.state === 'not run').length });
    // 1. memory and CPU limits, phases 1 and 2
    const p12 = [...ph(1), ...ph(2)], killed = p12.filter(s => bad(s) || s.state === 'incomplete'), unknownOutcome = p12.filter(s => s.state === 'completed' && !s.outcome);
    const c1 = killed.length ? 'not met' : (p12.some(s => s.state !== 'completed') || unknownOutcome.length) ? 'incomplete' : 'met';
    // 2. served time, phase 1: every planned run, both responses naming the requested time
    const h = ph(1), seen = h.filter(s => s.header_ok !== null), failed = seen.filter(s => !s.header_ok);
    const c2 = failed.length ? 'not met' : seen.length < h.length ? 'incomplete' : 'met';
    // 3. validation: every refusal needs a diagnosis; only "the picture was faulty" lets the size qualify
    const refusals = p12.flatMap(s => s.refused.map(r => ({ k: s.k, at: s.at, frame_time: s.frame_time, ...r, diagnosis: diagnoses[s.frame_time + ' ' + size] || null })));
    const c3 = refusals.some(r => r.diagnosis === 'b' || r.diagnosis === 'c') ? 'not met' : refusals.some(r => !r.diagnosis) ? 'incomplete' : p12.some(s => s.state !== 'completed' || s.result === 'fetch failed' || /^frame list|^wall budget|^error/.test(s.result || '')) ? 'incomplete' : 'met';
    // 4. CPU per run, as Cloudflare reports it: the MAXIMUM over single-validation runs of phase 1
    const cpu1 = ph(1).filter(s => Number.isFinite(s.cpu_ms)), cpuMax = cpu1.length ? Math.max(...cpu1.map(s => s.cpu_ms)) : null, cpu2 = ph(2).filter(s => Number.isFinite(s.cpu_ms));
    const c4 = cpuMax !== null && cpuMax >= CPU_SINGLE_MAX_MS ? 'not met' : cpu1.length < ph(1).length ? 'incomplete' : 'met';
    // 5. the ladder, as observed; checkpoint: every planned run at and below CHECKPOINT_MIB completed with its memory intact
    const rungs = [...new Set(ph(3).map(s => s.ballast_mib))].sort((a, b) => a - b).map(b => { const R = ph(3).filter(s => s.ballast_mib === b);
      return { mib: b, planned: R.length, completed_intact: R.filter(s => s.state === 'completed' && s.ballast_ok === true && s.result === 'validated').length, runs: R.map(s => ({ k: s.k, at: s.at, state: s.state, died_at: s.died_at, outcome: s.outcome, result: s.result, ballast_ok: s.ballast_ok })) }; });
    const upTo = rungs.filter(r => r.mib <= CHECKPOINT_MIB), c5 = upTo.some(r => r.runs.some(x => x.state === 'incomplete' || (x.outcome && /exceeded/i.test(x.outcome)) || (x.state === 'completed' && (x.ballast_ok !== true || x.result !== 'validated')))) ? 'not met' : upTo.some(r => r.completed_intact < r.planned) || !upTo.length ? 'incomplete' : 'met';
    const top = rungs[rungs.length - 1], notes = [];
    if (top && top.completed_intact === top.planned && top.planned) notes.push(`every run at ${top.mib} MiB completed: the extra memory may not be counted toward the limit, in which case the ladder measured nothing`);
    if (S.some(s => s.overlapping)) notes.push('runs overlapped in one isolate: ' + S.filter(s => s.overlapping).map(s => s.k).join(', '));
    if (S.some(s => s.starts > 1 || s.invocations > 1)) notes.push('slots that ran more than once: ' + S.filter(s => s.starts > 1 || s.invocations > 1).map(s => s.k).join(', '));
    const frames = [...new Set(S.filter(s => s.frame_time).map(s => s.frame_time))].sort(), crit = { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 }, vals = Object.values(crit);
    sizes[size] = { verdict: vals.includes('not met') ? 'does not qualify' : vals.includes('incomplete') ? 'incomplete' : 'qualifies', criteria: crit,
      runs: { phase1: count(ph(1)), phase2: count(ph(2)), phase3: count(ph(3)) }, killed_in_phases_1_2: killed.map(s => ({ k: s.k, at: s.at, outcome: s.outcome, died_at: s.died_at })),
      header: { planned: h.length, observed: seen.length, both_named_the_requested_time: seen.length - failed.length, failures: failed.map(s => ({ k: s.k, at: s.at, frame_time: s.frame_time, ...s.header })) },
      refusals, cpu: { single_validation_max_ms: cpuMax, observed: cpu1.length, six_validations_max_ms: cpu2.length ? Math.max(...cpu2.map(s => s.cpu_ms)) : null, limit_ms: CPU_SINGLE_MAX_MS },
      ladder: rungs.map(r => ({ mib: r.mib, planned: r.planned, completed_intact: r.completed_intact, died: r.runs.filter(x => x.state === 'incomplete').map(x => x.died_at + (x.outcome ? ' (' + x.outcome + ')' : '')) })), ladder_runs: rungs,
      coverage: { distinct_frames: frames.length, first: frames[0] || null, last: frames[frames.length - 1] || null }, notes };
  }
  const order = Object.keys(sizes).map(Number).sort((a, b) => b - a), goes = order.find(s => sizes[s].verdict === 'qualifies') || null;
  return { start, slots: plan.length, runs_planned: slots.length, excluded: plan.filter(s => s.excluded).map(s => s.at), requests_at_most: slots.length * 3,
    forward: goes ? String(goes) : order.some(s => sizes[s].verdict === 'incomplete') ? 'undecided: the experiment is incomplete' : 'neither size qualifies', sizes, slots_detail: slots };
}
if (process.argv[1] && process.argv[1].endsWith('evprobe.report.mjs') && process.argv.length >= 5) {
  const P = (await import(new URL('./evprobe.js', import.meta.url))).default.__probe, [, , start, lf, inf, df] = process.argv;
  const lines = fs.readFileSync(lf, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  const r = await evaluate({ start, lines, invocations: JSON.parse(fs.readFileSync(inf, 'utf8')), diagnoses: df ? JSON.parse(fs.readFileSync(df, 'utf8')) : {} }, P.evprobePlan); delete r.slots_detail; for (const s of Object.values(r.sizes)) delete s.ladder_runs;
  console.log(JSON.stringify(r, null, 1));
}
