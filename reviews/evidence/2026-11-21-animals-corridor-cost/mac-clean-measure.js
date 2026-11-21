/* Mother Earth — Animals corridor: CLEAN switch-on measurement, with a nothing-on control (22 Nov thread "Animals after MVP").
 * Run in the console of animals.html (live or served), Chrome, window visible. Changes no file. Result: window.__ME_CLEAN.
 *
 * Unlike mac-measure.js (21 Nov), parts 0 to 2 add NOTHING to the page's drawing: no gl.finish, no pixel reads, no scene
 * traversal, no wrapped render call. They only press the page's own switch and read what the browser itself recorded:
 * 'longtask' entries and, where the browser has them, 'long-animation-frame' entries with their script attribution.
 *  0. WARM: one switch-on and off, so the display file is fetched, verified and decoded once (as in the 21 Nov method).
 *  1. CONTROL: nothing on, 2.5 s, at the corridor's view. Long tasks recorded by the browser in that window.
 *  2. SWITCH-ON, N times: t0 = just before the press. Long tasks and long animation frames that overlap t0 .. t0+1500 ms.
 * Parts 3 and 4 are EXPERIMENTS to find the cost. They are labelled as such and are not the clean measurement:
 *  3. HIT TEST: the time of one g.toGlobeCoords(x, y) call (the library's own "what is under this screen point" test, the
 *     same routine it runs for the pointer every 50 ms and the page's scale bar runs six times), corridor off and on.
 *  4. FRAME INTERVALS over 3 s with the camera nudged every frame, close over the corridor: nothing on; corridor on;
 *     corridor on with the library's pointer hit-testing switched off (g.enablePointerInteraction(false)); then back on.
 */
(async () => {
  const OUT = window.__ME_CLEAN = { done: false, started: new Date().toISOString(), ua: navigator.userAgent, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], visibility: document.visibilityState, focus: document.hasFocus(), control: null, runs: [], hit: {}, frames: [], notes: [] };
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r)), g = ME.animalsGlobe.raw(), sw = document.getElementById('cor-tgl');
    const LT = []; let loaf = false;
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'longtask', s: e.startTime, d: e.duration }); }).observe({ type: 'longtask' }); } catch (e) { OUT.notes.push('no longtask observer: ' + e); }
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'loaf', s: e.startTime, d: e.duration, blocking: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : null, scripts: (e.scripts || []).map(x => ({ ms: Math.round(x.duration), invoker: String(x.invoker || '').slice(0, 80), fn: x.sourceFunctionName || '', src: String(x.sourceURL || '').split('/').pop().slice(0, 40), layout: Math.round(x.forcedStyleAndLayoutDuration || 0) })) }); }).observe({ type: 'long-animation-frame' }); loaf = true; } catch (e) { OUT.notes.push('no long-animation-frame observer'); }
    OUT.loaf = loaf;
    const until = async (f, ms = 30000) => { const t = performance.now(); while (!f()) { if (performance.now() - t > ms) throw new Error('timed out: ' + f); await sleep(20); } };
    const within = (a, b) => LT.filter(e => e.s + e.d > a && e.s < b).map(e => Object.assign({}, e, { s: Math.round(e.s - a), d: Math.round(e.d), blocking: e.blocking == null ? undefined : Math.round(e.blocking), render: e.render == null ? undefined : Math.round(e.render) }));
    await until(() => ME.corridor.state().facts === 'ready'); OUT.backdrop = ME.animalsGlobe.state().backdrop; OUT.pin = ME.corridor.C.CATALOG_SHA256.slice(0, 8);
    if (ME.corridor.state().on) { sw.click(); await sleep(800); }
    // 0. warm
    { const t = performance.now(); sw.click(); await until(() => ME.corridor.state().status === 'shown'); OUT.warm_ms = Math.round(performance.now() - t); await sleep(2000); sw.click(); await sleep(1000); }
    const view = g.pointOfView();                                             // the corridor's view, left by the page's own move
    // 1. control
    { const t0 = performance.now(); await sleep(2500); await sleep(150); OUT.control = { window_ms: 2500, entries: within(t0, t0 + 2500) }; }
    // 2. clean switch-on
    const N = 7;
    for (let i = 0; i < N; i++) { const t0 = performance.now(); sw.click(); await sleep(1500); await sleep(200); const e = within(t0, t0 + 1500), tasks = e.filter(x => x.type === 'longtask'), frames = e.filter(x => x.type === 'loaf');
      OUT.runs.push({ run: i + 1, status: ME.corridor.state().status, longest_task_ms: Math.max(0, ...tasks.map(x => x.d)), tasks: tasks.map(x => [x.s, x.d]), longest_frame_ms: Math.max(0, ...frames.map(x => x.d)), frames: frames.filter(x => x.d >= 80).map(x => ({ s: x.s, d: x.d, blocking: x.blocking, render: x.render, scripts: x.scripts.filter(y => y.ms >= 5) })) });
      sw.click(); await sleep(900); }
    // 3. hit test (experiment)
    const box = document.getElementById('an-globe'), w = box.clientWidth, h = box.clientHeight;
    const hit = (x, y, n = 5) => { const r = []; for (let i = 0; i < n; i++) { const t = performance.now(); g.toGlobeCoords(x, y); r.push(Math.round((performance.now() - t) * 10) / 10); } return r; };
    g.pointOfView(view, 0); await sleep(400);
    OUT.hit.off_centre = hit(w / 2, h / 2); OUT.hit.off_corner = hit(-2, -2);
    sw.click(); await sleep(1500); g.pointOfView(view, 0); await sleep(400);
    OUT.hit.on_centre = hit(w / 2, h / 2); OUT.hit.on_corner = hit(-2, -2); OUT.hit.pointer = g.renderObjs ? null : undefined;
    sw.click(); await sleep(900);
    // 4. frame intervals (experiment)
    const orbit = async (label) => { g.pointOfView(view, 0); await sleep(300); const iv = []; let last = await raf(); const t0 = last, lt0 = performance.now(); let k = 0;
      while (last - t0 < 3000) { k++; g.pointOfView({ lat: view.lat + 0.02 * Math.sin(k / 30), lng: view.lng + 0.02 * Math.cos(k / 30), altitude: view.altitude }, 0); const t = await raf(); iv.push(t - last); last = t; }
      const s = iv.slice().sort((a, b) => a - b), q = p => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10; await sleep(150);
      OUT.frames.push({ state: label, frames: iv.length, median: q(0.5), p95: q(0.95), worst: q(1), over33: iv.filter(v => v > 33.4).length, over50: iv.filter(v => v > 50).length, longtasks: within(lt0, lt0 + 3000).filter(x => x.type === 'longtask').length }); };
    await orbit('nothing on');
    sw.click(); await sleep(1500); await orbit('corridor on');
    g.enablePointerInteraction(false); await sleep(200); await orbit('corridor on, pointer hit-testing off (experiment)');
    g.enablePointerInteraction(true); await sleep(200); await orbit('corridor on, pointer hit-testing back on');
    sw.click(); await sleep(600);
    try { const gl = g.renderer().getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); OUT.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); OUT.buffer = [gl.drawingBufferWidth, gl.drawingBufferHeight]; } catch (_) { }
    OUT.visibility_end = document.visibilityState; OUT.focus_end = document.hasFocus(); OUT.ended = new Date().toISOString();
  } catch (e) { OUT.error = String(e && e.stack || e).slice(0, 400); }
  OUT.done = true;
})();
