/* Mother Earth — Animals corridor candidate: CONFIRMING measurement on the Mac, from a SERVED review tree (GPT's review of 62121d1, section 4).
 * Run in the console of animals.html served from the review copy, Chrome, window visible and in front, Mac awake. Changes no file and no
 * library option. Result: window.__ME_CONFIRM (done: true when finished); JSON.stringify it and keep the whole text.
 *
 * Nothing is added to the page's drawing: no gl.finish, no pixel reads, no wrapped render call, no scene traversal during a timed window.
 * The script presses the page's own switch and reads (a) the browser's 'longtask' and 'long-animation-frame' records and (b) the page's own
 * state, once per animation frame (ME.corridor.state().status, a property read).
 *  H. CAPTURE HEALTH, before every timed window: a deliberate 80 ms busy loop. The run is VALID only if the browser returns a longtask record
 *     for that loop and at least one animation frame ran in the window. An invalid run is kept and reported, never counted as a pass.
 *  0. WARM: one switch-on to "shown" and off, so the display file is fetched, verified and decoded once.
 *  1. CONTROL: nothing on, 2.5 s. Long tasks in that window.
 *  2. REDRAW, N = 7: t0 = just before the press (display data in memory).
 *     to_shown_ms = t0 to the first animation frame in which the page reports "shown". The page reports "shown" only after both classes' fill
 *     and outline geometry is built in the library's objects and the renderer has drawn a frame since (suite checks 10a, 10h, 10i), so this is
 *     verified data in memory -> first frame containing both complete classes (limit 1,500 ms).
 *     longest_task_ms = the longest 'longtask' overlapping t0 .. shown + 300 ms (limit 500 ms). All tasks and long frames in it are kept.
 *  3. FRAME INTERVALS, 5 s, camera nudged every frame close over the corridor: nothing on; corridor; corridor and the zebra journey.
 * Fixed arithmetic loop timed at start and end, for comparison between sessions only. */
(async () => {
  const OUT = window.__ME_CONFIRM = { done: false, started: new Date().toISOString(), href: location.href, ua: navigator.userAgent, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], visibility: [document.visibilityState], focus: [document.hasFocus()], control: null, runs: [], frames: [], notes: [] };
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r)), g = ME.animalsGlobe.raw(), sw = document.getElementById('cor-tgl'), S = () => ME.corridor.state();
    const bench = () => { const t = performance.now(); let s = 0; for (let i = 1; i < 3e7; i++) s += Math.sqrt(i) * Math.sin(i); return Math.round(performance.now() - t); };
    const busy = ms => { const t = performance.now(); let s = 0; while (performance.now() - t < ms) s += Math.sqrt(s + 1); return s; };
    const LT = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'longtask', s: e.startTime, d: e.duration }); }).observe({ type: 'longtask' });
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'loaf', s: e.startTime, d: e.duration, blocking: e.blockingDuration, scripts: (e.scripts || []).map(x => ({ ms: Math.round(x.duration), invoker: String(x.invoker || '').split(':')[0].slice(0, 24), src: String(x.sourceURL || '').split('/').pop().split('?')[0].slice(0, 32) })) }); }).observe({ type: 'long-animation-frame' }); OUT.loaf = true; } catch (_) { OUT.loaf = false; }
    const within = (a, b) => LT.filter(e => e.s + e.d > a && e.s < b).map(e => Object.assign({}, e, { s: Math.round(e.s - a), d: Math.round(e.d), blocking: e.blocking == null ? undefined : Math.round(e.blocking) }));
    const health = async () => { await sleep(120); const t = performance.now(); busy(80); await sleep(250); return LT.some(e => e.type === 'longtask' && e.s >= t - 5 && e.s < t + 90 && e.d >= 60); };
    const until = async (f, ms) => { const t = performance.now(); while (!f()) { if (performance.now() - t > ms) return false; await sleep(20); } return true; };
    OUT.bench_ms = [bench(), bench()];
    if (!(await until(() => S().facts === 'ready', 30000))) throw new Error('corridor record not ready');
    OUT.backdrop = ME.animalsGlobe.state().backdrop; OUT.pin = ME.corridor.C.CATALOG_SHA256; OUT.pointer_hit_testing = g.enablePointerInteraction(); OUT.draw_wait_ms = ME.corridor.C.DRAW_WAIT_MS;
    if (S().on) { sw.click(); await sleep(800); }
    { const t = performance.now(); sw.click(); const ok = await until(() => S().status === 'shown', 30000); OUT.warm = { shown: ok, ms: Math.round(performance.now() - t) }; if (!ok) throw new Error('warm switch-on did not reach shown: ' + S().status); await sleep(1500); sw.click(); await sleep(1000); }
    const view = g.pointOfView();
    { const h = await health(), t0 = performance.now(); let n = 0, on = true; (function f() { if (on) { n++; requestAnimationFrame(f); } })(); await sleep(2500); on = false; await sleep(200); OUT.control = { valid: h && n > 0, health_record: h, frames: n, window_ms: 2500, entries: within(t0, t0 + 2500) }; }
    for (let i = 0; i < 7; i++) { const h = await health(); let frames = 0, tShown = null, firstStatus = null; const t0 = performance.now(); sw.click(); firstStatus = S().status;
      while (performance.now() - t0 < 8000) { const t = await raf(); frames++; if (S().status === 'shown') { tShown = t - t0; break; } if (S().status !== 'loading') break; }
      const end = performance.now() + 300; await sleep(300); await sleep(200); const e = within(t0, end), tasks = e.filter(x => x.type === 'longtask');
      OUT.runs.push({ run: i + 1, valid: h && frames > 0 && tShown != null, health_record: h, frames_until_shown: frames, status_at_press: firstStatus, status_end: S().status, to_shown_ms: tShown == null ? null : Math.round(tShown * 10) / 10, longest_task_ms: tasks.length ? Math.max(...tasks.map(x => x.d)) : 0, tasks: tasks.map(x => [x.s, x.d]), long_frames: e.filter(x => x.type === 'loaf'), visibility: document.visibilityState, focus: document.hasFocus() });
      sw.click(); await sleep(900); }
    const orbit = async label => { g.pointOfView(view, 0); await sleep(300); const h = await health(), iv = []; let last = await raf(); const t0 = last, lt0 = performance.now(); let k = 0;
      while (last - t0 < 5000) { k++; g.pointOfView({ lat: view.lat + 0.02 * Math.sin(k / 30), lng: view.lng + 0.02 * Math.cos(k / 30), altitude: view.altitude }, 0); const t = await raf(); iv.push(t - last); last = t; }
      const s = iv.slice().sort((a, b) => a - b), q = p => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10; await sleep(200);
      OUT.frames.push({ state: label, valid: h && iv.length > 0, health_record: h, frames: iv.length, median: q(0.5), p95: q(0.95), worst: q(1), over33: iv.filter(v => v > 33.4).length, over50: iv.filter(v => v > 50).length, longtasks: within(lt0, lt0 + 5000).filter(x => x.type === 'longtask').map(x => x.d) }); };
    await orbit('nothing on');
    sw.click(); if (!(await until(() => S().status === 'shown', 15000))) OUT.notes.push('corridor not shown before its orbit'); await sleep(800); await orbit('corridor');
    const z = document.getElementById('tgl-zebra-botswana-Z3866'); if (z) { z.click(); await sleep(4000); OUT.journey_on = !!(ME.journey && ME.journey.on && ME.journey.on()); OUT.corridor_still = S().status; await orbit('corridor and zebra journey'); z.click(); await sleep(600); } else OUT.notes.push('zebra switch not found');
    if (S().on) { sw.click(); await sleep(600); }
    try { const gl = g.renderer().getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); OUT.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); OUT.buffer = [gl.drawingBufferWidth, gl.drawingBufferHeight]; } catch (_) { }
    OUT.bench_end_ms = bench(); OUT.visibility.push(document.visibilityState); OUT.focus.push(document.hasFocus()); OUT.ended = new Date().toISOString();
  } catch (e) { OUT.error = String(e && e.stack || e).slice(0, 400); }
  OUT.done = true;
})();
