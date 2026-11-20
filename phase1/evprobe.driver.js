/* The probe's own driver. Everything above this text in evprobe.js is the hub candidate's validation code, unchanged.
 * WHAT A RUN DOES. On each cron tick it finds its slot in a plan fixed by PROBE_START. Outside the twelve-hour window, or on an
 * excluded slot, it makes no request. Otherwise: (phase 3 only) it takes B MiB of memory and writes every byte; it reads the frame
 * list; it asks for the newest frame's picture, at this slot's size, and for the check image, exactly as the collector would; it
 * records what each response's Warning header says; it validates the picture once (phase 2: six times); it checks the memory it
 * took is intact; it logs. It stores nothing and has nothing to store to.
 * LOG LINES (console.log, one JSON object each, all carrying the slot): "start" before anything; "ballast" once the memory is held;
 * "fetched" with both responses' facts, BEFORE any decode; "validate-begin" and "validated" around each validation; "done" last.
 * A run killed for memory therefore shows how far it got: no "ballast" = it died taking the memory; "validate-begin" without
 * "validated" = it died decoding. CPU time, wall time and the outcome of each invocation come from Cloudflare's invocation log.
 * DIFFERENCES FROM THE COLLECTOR, all deliberate: the size is a parameter (2048 or 1536); validation runs even when a header is
 * missing or names another time (the collector would stop there), so that memory is measured on every run; nothing is stored. */
const PROBE = {
  START_MS: Date.parse(PROBE_START), SLOT_MS: 600000, SLOTS: 72,   // twelve hours of ten-minute slots
  SIZES: [2048, 1536],                                             // alternate runs
  PHASE1_RUNS: 36, PHASE2_RUNS: 10,                                // 18 and 5 per size; phase 3 is every run after them (24: 12 per size)
  REPEATS: 6, LADDER_MIB: [16, 32, 48, 64, 80, 96],                // phase 3: each rung once per size, then the ladder again
  EXCLUDED_UTC_MINUTES: [360, 370, 1080, 1090],                    // 06:00, 06:10, 18:00, 18:10: kept clear of the hub's Dust RGB runs
  WALL_BUDGET_MS: 240000,                                          // per run: 30 s list + 90 s + 90 s pictures at worst, plus the work
  PICTURE_MAX_BYTES: 3 * 1024 * 1024,
};
const evprobeIso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
/** THE PLAN: every slot of the window, in order, with what its run does. Fixed by the start time alone; nothing at run time changes it.
 * An excluded slot is skipped, not made up later: the window is never extended and no request is added to replace a missed one. */
function evprobePlan(start = PROBE.START_MS) {
  const out = []; let n = 0;
  for (let k = 0; k < PROBE.SLOTS; k++) { const t = start + k * PROBE.SLOT_MS, d = new Date(t), minute = d.getUTCHours() * 60 + d.getUTCMinutes();
    if (PROBE.EXCLUDED_UTC_MINUTES.includes(minute)) { out.push({ k, at: evprobeIso(t), excluded: 'Dust RGB run time' }); continue; }
    const phase = n < PROBE.PHASE1_RUNS ? 1 : n < PROBE.PHASE1_RUNS + PROBE.PHASE2_RUNS ? 2 : 3, j = n - PROBE.PHASE1_RUNS - PROBE.PHASE2_RUNS;
    out.push({ k, n, at: evprobeIso(t), phase, size: PROBE.SIZES[n % 2], validations: phase === 2 ? PROBE.REPEATS : 1, ballast_mib: phase === 3 ? PROBE.LADDER_MIB[Math.floor(j / 2) % PROBE.LADDER_MIB.length] : 0 }); n++; }
  return out;
}
/** The collector's steps 3 and 4 for one picture and its check image, at a given size: structure to the last byte, every scan
 * present, full decode, comparison with the check image. Same order, same refusals, same wording as collectEarthView. */
async function evprobeValidate(picBuf, chkBuf, size) {
  const C = EARTHVIEW.CHECK, u8 = new Uint8Array(picBuf), sc = evJpegScans(u8), no = detail => ({ ok: false, reason: 'picture failed validation', detail });
  if (!sc.ok) return no('structure: ' + sc.reason);
  if (sc.w !== size || sc.h !== size || sc.components !== 3) return no(`size ${sc.w}x${sc.h}, ${sc.components} components`);
  if (!sc.complete) return no(`scans incomplete: ${sc.missing} coefficient positions not delivered at full precision in ${sc.scans} scans`);
  const png = await evPng(new Uint8Array(chkBuf), C.w * C.h);
  if (!png || png.w !== C.w || png.h !== C.h) return { ok: false, reason: 'check image failed validation', detail: 'does not decode as ' + C.w + 'x' + C.h + ' RGBA' };
  const dec = evDecode(u8);
  if (dec.error) return no('decode: ' + dec.error);
  if (dec.w !== size || dec.h !== size) return no(`decoded size ${dec.w}x${dec.h}`);
  const cmp = evCompare(dec, png);
  if (!cmp.ok) return { ...cmp, ok: false, reason: 'picture failed validation', detail: cmp.reason, progressive: sc.progressive, scans: sc.scans };
  return { ...cmp, ok: true, reason: null, progressive: sc.progressive, scans: sc.scans };
}
const EVPROBE_ISOLATE = { id: null, runs: 0, active: 0 };   // shows, in the log, when two runs shared an isolate or overlapped
const evprobeSay = o => console.log(JSON.stringify(o));
async function evprobeRun(scheduledMs) {
  const tick = Math.floor(scheduledMs / PROBE.SLOT_MS) * PROBE.SLOT_MS, k = Math.round((tick - PROBE.START_MS) / PROBE.SLOT_MS);
  if (k < 0 || k >= PROBE.SLOTS) {   // ABSOLUTE WINDOW: outside it, no request of any kind. One short line per tick for the hour either side, then silence.
    if (k >= -6 && k < PROBE.SLOTS + 6) evprobeSay({ probe: 'evprobe', ev: k < 0 ? 'not started' : 'expired', scheduled: evprobeIso(scheduledMs), start: PROBE_START });
    return 'outside the window';
  }
  const slot = evprobePlan()[k];
  if (slot.excluded) { evprobeSay({ probe: 'evprobe', ev: 'excluded', k, scheduled: evprobeIso(scheduledMs), why: slot.excluded }); return 'excluded'; }
  if (!EVPROBE_ISOLATE.id) { const b = new Uint8Array(4); crypto.getRandomValues(b); EVPROBE_ISOLATE.id = [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }
  const base = { probe: 'evprobe', k, run: slot.n + 1, phase: slot.phase, size: slot.size, ballast_mib: slot.ballast_mib, isolate: EVPROBE_ISOLATE.id, isolate_run: ++EVPROBE_ISOLATE.runs };
  const began = Date.now(), deadline = began + PROBE.WALL_BUDGET_MS, left = () => deadline - Date.now(), overlapping = EVPROBE_ISOLATE.active++;
  evprobeSay({ ...base, ev: 'start', scheduled: evprobeIso(scheduledMs), late_ms: began - scheduledMs, overlapping, source: PROBE_SOURCE.validation_sha256.slice(0, 16) });
  const done = (outcome, extra) => { evprobeSay({ ...base, ev: 'done', outcome, wall_ms: Date.now() - began, ...extra }); return outcome; };
  try {
    // PHASE 3: take the memory first, write every byte, and keep it until it has been checked after the validation
    let ballast = null;
    if (slot.ballast_mib) { ballast = []; for (let i = 0; i < slot.ballast_mib; i++) { const b = new Uint8Array(1048576); b.fill((i * 31 + 7) & 255); ballast.push(b); }
      evprobeSay({ ...base, ev: 'ballast', held_mib: ballast.length }); }
    // the frame list, as the collector reads it
    let r; try { r = await fetch(EARTHVIEW.CAP, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(EARTHVIEW.LIST_TIMEOUT_MS) }); } catch (e) { return done('frame list: no answer', { detail: String(e).slice(0, 160) }); }
    if (r.status !== 200) { try { await r.body.cancel(); } catch (_) {} return done('frame list: http error', { http: r.status }); }
    let xml; try { xml = await r.text(); } catch (e) { return done('frame list: unreadable', { detail: String(e).slice(0, 160) }); }
    const T = evLatest(xml); if (!T) return done('frame list: no time for this layer');
    if (left() < 2 * EARTHVIEW.TIMEOUT_MS) return done('wall budget: not enough left for the pictures');
    // the picture at this slot's size, and the check image: the collector's requests, with only the size changed
    const C = EARTHVIEW.CHECK, P = { w: slot.size, h: slot.size, maxBytes: PROBE.PICTURE_MAX_BYTES, type: 'image/jpeg' }, q = `&time=${T}`;
    const picUrl = `${EARTHVIEW.MAP}&width=${P.w}&height=${P.h}&format=image/jpeg&bgcolor=${EARTHVIEW.BGCOLOR}${q}`, chkUrl = `${EARTHVIEW.MAP}&width=${C.w}&height=${C.h}&format=image/png&transparent=true${q}`;
    const pic = await evFetch('picture', picUrl, P), chk = pic.ok && left() > EARTHVIEW.TIMEOUT_MS ? await evFetch('check image', chkUrl, C) : { ok: false, reason: 'not requested', http: 0 };
    const fact = f => f.ok ? { ok: true, bytes: f.bytes, sha256: f.sha256, header_present: f.warn_present, header_names: f.served } : { ok: false, reason: f.reason, http: f.http, detail: f.detail };
    const header_ok = !!(pic.ok && chk.ok && pic.served === T && chk.served === T);
    evprobeSay({ ...base, ev: 'fetched', frame_time: T, cache_age_s: r.headers.get('age'), picture: fact(pic), check: fact(chk), header_ok });
    if (!pic.ok || !chk.ok) return done('fetch failed', { frame_time: T, header_ok });
    // validation: once, or (phase 2) six times on the same bytes in this one invocation
    let last = null, refused = 0;
    for (let i = 1; i <= slot.validations; i++) { evprobeSay({ ...base, ev: 'validate-begin', i });
      const t0 = Date.now(); last = await evprobeValidate(pic.buf, chk.buf, slot.size); if (!last.ok) refused++;
      evprobeSay({ ...base, ev: 'validated', i, frame_time: T, wall_ms: Date.now() - t0, ...last }); }
    // the memory taken in phase 3 must still be there and intact: it was live for the whole validation
    let ballast_ok = null; if (ballast) { let bad = 0; for (let i = 0; i < ballast.length; i++) { const b = ballast[i], v = (i * 31 + 7) & 255; for (let o = 0; o < b.length; o += 4096) if (b[o] !== v) bad++; if (b[b.length - 1] !== v) bad++; } ballast_ok = bad === 0 && ballast.length === slot.ballast_mib; }
    return done(refused ? 'validation refused' : 'validated', { frame_time: T, header_ok, validations: slot.validations, refused, ballast_ok });
  } catch (e) { return done('error', { detail: String((e && e.stack) || e).slice(0, 300) }); }
  finally { EVPROBE_ISOLATE.active--; }
}
/* No fetch handler: the Worker cannot be called. __probe is for the test suite only; the runtime ignores it. */
export default { async scheduled(event, env, ctx) { await evprobeRun(event.scheduledTime); }, __probe: { PROBE, PROBE_START, PROBE_SOURCE, EARTHVIEW, evprobePlan, evprobeRun, evprobeValidate, EVPROBE_ISOLATE } };
