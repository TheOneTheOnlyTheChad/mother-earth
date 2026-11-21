/* Mother Earth — Animals Stage 4 r2: the Mac drawing and frame measurement (GPT's Stage 4 review, section 4).
 * Paste into the console of animals.html (served locally, in Chrome, window visible and in front), or run through the
 * browser tool. It changes nothing on the page's files. Result: window.__ME_MEASURE (done: true when finished), JSON.
 *
 * What is timed, and from where:
 *  A. FIRST DRAW. The display file is first loaded, verified and decoded once (a switch-on, then off), so it is in memory.
 *     Then, N times: t0 = just before the switch is pressed. With the data in memory the page's own code calls draw()
 *     inside that press. t1 = the end of the first renderer.render() call in which both polygon objects (medium and high)
 *     are in the scene with filled geometry, after gl.finish() (so the GPU has done the work). t2 = the next
 *     animation-frame callback after it. In that same first render, pixels are read at 4 points inside High, 4 in the
 *     Medium-only band and 4 outside both, to confirm both classes are in the picture and differ from the ground and
 *     from each other. Reported: t1 - t0 and t2 - t0 per run.
 *  B. LONGEST MAIN-THREAD TASK over that draw: the longest 'longtask' entry (and 'long-animation-frame' where the
 *     browser has it) that overlaps t0..t2. The longtask API reports only tasks of 50 ms or more.
 *  C. FRAME INTERVALS over a five-second orbit: the camera is moved every frame; intervals between animation-frame
 *     callbacks; median, 95th percentile and worst. Two orbits (close over the corridor; whole globe turning once),
 *     in three states (nothing on; corridor; corridor and the zebra journey).
 */
(async () => {
  const OUT = window.__ME_MEASURE = { done: false, started: new Date().toISOString(), ua: navigator.userAgent, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], visibility: document.visibilityState, focus: document.hasFocus(), runs: [], orbits: [], notes: [] };
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r)), g = ME.animalsGlobe.raw(), R = g.renderer(), gl = R.getContext();
    const until = async (f, ms = 60000) => { const t = performance.now(); while (!f()) { if (performance.now() - t > ms) throw new Error('timed out waiting: ' + f); await sleep(20); } };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info'); OUT.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); OUT.canvas = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    const P = { high: [[-119.3167, 38.229], [-119.2727, 38.301], [-119.2207, 38.325], [-119.1687, 38.353]], medium: [[-119.2847, 38.325], [-119.1607, 38.309], [-119.1087, 38.365], [-119.0407, 38.417]], none: [[-119.4047, 38.301], [-119.4007, 38.253], [-119.3967, 38.205], [-119.3927, 38.157]] };
    const tasks = []; for (const type of ['longtask', 'long-animation-frame']) { try { new PerformanceObserver(l => { for (const e of l.getEntries()) tasks.push({ type, start: e.startTime, dur: e.duration }); }).observe({ type }); } catch (_) { OUT.notes.push(type + ' not available in this browser'); } }
    const tgl = document.getElementById('cor-tgl'), S = () => ME.corridor.state();
    const filled = () => { const seen = {}; g.scene().traverse(o => { if (o.__globeObjType === 'polygon' && o.__data && o.visible) o.traverse(m => { if (m.isMesh && m.geometry && m.geometry.attributes.position && m.geometry.attributes.position.count > 0) { const d = o.__data.data || o.__data; seen[d.key] = (seen[d.key] || 0) + m.geometry.attributes.position.count; } }); }); return seen; };
    const px = (lng, lat) => { const c = g.getScreenCoords(lat, lng, 0.00008), cv = R.domElement, k = gl.drawingBufferWidth / cv.clientWidth, b = new Uint8Array(4); gl.readPixels(Math.round(c.x * k), gl.drawingBufferHeight - Math.round(c.y * k), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, b); return [b[0], b[1], b[2]]; };
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), mean = a => a[0].map((_, i) => a.reduce((s, v) => s + v[i], 0) / a.length);
    if (S().facts !== 'ready') throw new Error('corridor record not ready: ' + S().facts);
    if (S().on) { tgl.click(); await sleep(800); }
    // the display file into memory once (not timed as the metric; reported as information)
    { const t = performance.now(); tgl.click(); await until(() => S().status === 'shown'); OUT.coldSwitchOnToShownMs = Math.round(performance.now() - t); await sleep(1500); tgl.click(); await sleep(1500); if (!S().cached) throw new Error('display data not kept in memory'); }
    // A and B
    const N = 7, orig = R.render;
    for (let i = 0; i < N; i++) { const run = { i }; let hit = null; tasks.length = 0;
      R.render = function () { const r = orig.apply(this, arguments); if (!hit && run.t0 != null) { const f = filled(); if (f.medium && f.high) { gl.finish(); hit = performance.now(); run.vertices = f;
        try { const c = {}; for (const k in P) c[k] = P[k].map(p => px(p[0], p[1])); run.pixels = c; const H = mean(c.high), M = mean(c.medium), Z = mean(c.none); run.colour = { high: H.map(Math.round), medium: M.map(Math.round), ground: Z.map(Math.round), highVsGround: Math.round(dist(H, Z)), mediumVsGround: Math.round(dist(M, Z)), highVsMedium: Math.round(dist(H, M)) }; } catch (e) { run.pixelError = String(e); } } } return r; };
      run.t0 = performance.now(); tgl.click(); run.syncPressMs = +(performance.now() - run.t0).toFixed(1); await until(() => hit != null, 30000); const t2 = await raf(); R.render = orig;
      run.firstFrameMs = +(hit - run.t0).toFixed(1); run.nextFrameCallbackMs = +(t2 - run.t0).toFixed(1); run.status = S().status; await sleep(300);
      const over = tasks.filter(e => e.start < t2 && e.start + e.dur > run.t0); run.longestTaskMs = Math.round(Math.max(0, ...over.filter(e => e.type === 'longtask').map(e => e.dur))); run.longestAnimationFrameMs = Math.round(Math.max(0, ...over.filter(e => e.type === 'long-animation-frame').map(e => e.dur))); run.tasksOver50 = over.filter(e => e.type === 'longtask').length;
      OUT.runs.push(run); tgl.click(); await sleep(1200); }
    // C
    const orbit = async (label, kind) => { const v = { lat: 38.35, lng: -119.15, altitude: 0.02 }, ts = []; g.controls().autoRotate = false; g.pointOfView(kind === 'close' ? v : { lat: 20, lng: -119.15, altitude: 2.5 }, 0); await sleep(700); const t0 = await raf(); let t = t0; ts.push(t0);
      while (t - t0 < 5000) { const u = (t - t0) / 5000; g.pointOfView(kind === 'close' ? { lat: v.lat + 0.12 * Math.sin(4 * Math.PI * u), lng: v.lng + 0.25 * Math.sin(2 * Math.PI * u), altitude: v.altitude } : { lat: 20, lng: -119.15 + 360 * u, altitude: 2.5 }, 0); t = await raf(); ts.push(t); }
      const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b), q = p => +d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(2);
      OUT.orbits.push({ label, orbit: kind, frames: d.length, medianMs: q(0.5), p95Ms: q(0.95), worstMs: +d[d.length - 1].toFixed(2), over33ms: d.filter(x => x > 33.4).length, over50ms: d.filter(x => x > 50).length, visibility: document.visibilityState }); };
    for (const k of ['close', 'whole']) await orbit('nothing on', k);
    tgl.click(); await until(() => S().status === 'shown'); await sleep(1500); for (const k of ['close', 'whole']) await orbit('corridor', k);
    const z = document.getElementById('tgl-zebra-botswana-Z3866'); z.click(); await until(() => ME.journey.state().status === 'ready'); await sleep(2000); OUT.bothOn = { corridor: S().status, journey: ME.journey.state().status, journeyOn: ME.journey.on() };
    for (const k of ['close', 'whole']) await orbit('corridor and journey', k);
    z.click(); await sleep(500); tgl.click(); await sleep(500);
    const fm = OUT.runs.map(r => r.firstFrameMs).sort((a, b) => a - b); OUT.summary = { firstFrameMedianMs: fm[Math.floor((fm.length - 1) / 2)], firstFrameWorstMs: fm[fm.length - 1], longestTaskWorstMs: Math.max(...OUT.runs.map(r => r.longestTaskMs)), longestAnimationFrameWorstMs: Math.max(...OUT.runs.map(r => r.longestAnimationFrameMs)), limits: { firstDrawMs: 1500, taskMs: 500 } };
    OUT.finished = new Date().toISOString(); OUT.visibilityAtEnd = document.visibilityState;
  } catch (e) { OUT.error = String(e && e.stack || e); }
  OUT.done = true;
})();
