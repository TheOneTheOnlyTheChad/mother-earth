/* Mother Earth — Animals regional satellite picture candidate: drawing cost on the Mac, from a SERVED review tree
 * (docs/concepts/ANIMALS-SATELLITE-PROPOSAL.md rev 1.1, section 4 item 2 and section 7 item 4). Built on
 * reviews/evidence/2026-11-21-animals-corridor-cost/mac-confirm.js: same capture-health rule, same definitions, same limits.
 * Run in animals.html served from the review copy, Chrome, window visible and in front, Mac awake, straight after a fresh load
 * (nothing switched on yet). Result: window.__ME_PIC (done: true when finished).
 *
 * Nothing is added to the page's drawing: no gl.finish, no pixel reads, no wrapped render call, no scene traversal in a timed window.
 * ONE thing is wrapped: window.fetch, for the regional picture's request only, so the first part can run with the picture refused
 * ("corridor alone") without NASA being asked. Every other request passes straight through. The wrapper is removed before part B.
 *  H. CAPTURE HEALTH before every timed window: an 80 ms busy loop must come back as a longtask record, and frames must run. Else the run is INVALID.
 *  A. PICTURE REFUSED (the automatic attempt fails at once; one of the three attempts is used):
 *     warm switch-on and off; control (nothing on, 2.5 s); 7 redraws; 5 s orbits: nothing on, corridor, corridor and zebra journey.
 *  B. ARRIVAL, one sample: with the areas shown, the page's own "Try the regional picture again" button is pressed (second attempt, real request).
 *     Reported: the page's fetch, decode and attach times, press to "picture shown", and every long task from the press to shown + 300 ms.
 *  C. PICTURE IN MEMORY: 7 redraws. to_shown_ms = press to the frame in which the page reports the AREAS shown (limit 1,500 ms);
 *     to_picture_shown_ms = press to the frame in which the page reports the PICTURE shown; longest task from the press to picture shown + 300 ms (limit 500 ms).
 *     5 s orbits: corridor with picture; corridor with picture and zebra journey.
 * Version 2 (after GPT's hold of 22 Nov): each redraw also records the frame in which the page first reports the picture ATTACHED, so a long task can be
 * placed before or after the picture's own work; and the complete result is handed to the review server (POST /_save/, serve-and-save.py) byte for byte.
 * If the real request in B fails, B and C are NOT PERFORMED and say so. Fixed arithmetic loop timed at start and end, for comparison between sessions only. */
(async () => {
  const OUT = window.__ME_PIC = { done: false, started: new Date().toISOString(), href: location.href, ua: navigator.userAgent, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], visibility: [document.visibilityState], focus: [document.hasFocus()], A: { runs: [], frames: [] }, B: null, C: { runs: [], frames: [] }, notes: [] };
  const realFetch = window.fetch;
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r)), g = ME.animalsGlobe.raw(), sw = document.getElementById('cor-tgl'), S = () => ME.corridor.state();
    const bench = () => { const t = performance.now(); let s = 0; for (let i = 1; i < 3e7; i++) s += Math.sqrt(i) * Math.sin(i); return Math.round(performance.now() - t); };
    const busy = ms => { const t = performance.now(); let s = 0; while (performance.now() - t < ms) s += Math.sqrt(s + 1); return s; };
    const LT = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'longtask', s: e.startTime, d: e.duration }); }).observe({ type: 'longtask' });
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'loaf', s: e.startTime, d: e.duration, blocking: e.blockingDuration }); }).observe({ type: 'long-animation-frame' }); OUT.loaf = true; } catch (_) { OUT.loaf = false; }
    const within = (a, b) => LT.filter(e => e.s + e.d > a && e.s < b).map(e => Object.assign({}, e, { s: Math.round(e.s - a), d: Math.round(e.d), blocking: e.blocking == null ? undefined : Math.round(e.blocking) }));
    const health = async () => { await sleep(120); const t = performance.now(); busy(80); await sleep(250); return LT.some(e => e.type === 'longtask' && e.s >= t - 5 && e.s < t + 90 && e.d >= 60); };
    const until = async (f, ms) => { const t = performance.now(); while (!f()) { if (performance.now() - t > ms) return false; await sleep(20); } return true; };
    OUT.bench_ms = [bench(), bench()];
    if (!(await until(() => S().facts === 'ready', 30000))) throw new Error('corridor record not ready');
    if (S().on || S().pic.used !== 0) throw new Error('run this straight after a fresh load: the corridor has already been switched on (picture attempts used: ' + S().pic.used + ')');
    OUT.backdrop = ME.animalsGlobe.state().backdrop; OUT.pin = ME.corridor.C.CATALOG_SHA256; OUT.pointer_hit_testing = g.enablePointerInteraction();
    let refused = 0; window.fetch = function (u) { if (typeof u === 'string' && /gibs\.earthdata\.nasa\.gov/.test(u) && /[?&]WIDTH=960(&|$)/.test(u)) { refused++; return Promise.reject(new TypeError('refused by the measurement script')); } return realFetch.apply(this, arguments); };
    const redraw = async (withPic) => { const h = await health(); let frames = 0, tShown = null, tPic = null, tAtt = null; const t0 = performance.now(); sw.click(); const first = S().status;
      while (performance.now() - t0 < 8000) { const t = await raf(); frames++; const s = S(); if (tShown == null && s.status === 'shown') tShown = t - t0; if (tAtt == null && s.pic.attached) tAtt = t - t0; if (s.status !== 'loading' && s.status !== 'shown') break; if (tShown != null && (!withPic || s.pic.shown)) { if (withPic) tPic = t - t0; break; } }
      const end = performance.now() + 300; await sleep(500); const e = within(t0, end), tasks = e.filter(x => x.type === 'longtask'), s = S();
      const row = { valid: h && frames > 0 && tShown != null && (!withPic || tPic != null), health_record: h, frames, status_at_press: first, status_end: s.status, picture: { status: s.pic.status, shown: s.pic.shown, used: s.pic.used, attach_ms: s.pic.attachMs, frame_ms: s.pic.frameMs }, to_shown_ms: tShown == null ? null : Math.round(tShown * 10) / 10, to_picture_attached_ms: tAtt == null ? null : Math.round(tAtt * 10) / 10, to_picture_shown_ms: tPic == null ? null : Math.round(tPic * 10) / 10, longest_task_ms: tasks.length ? Math.max(...tasks.map(x => x.d)) : 0, tasks: tasks.map(x => [x.s, x.d]), long_frames: e.filter(x => x.type === 'loaf').map(x => [x.s, x.d, x.blocking]), visibility: document.visibilityState, focus: document.hasFocus() };
      sw.click(); await sleep(900); return row; };
    let view = null;
    const orbit = async label => { g.pointOfView(view, 0); await sleep(300); const h = await health(), iv = []; let last = await raf(); const t0 = last, lt0 = performance.now(); let k = 0;
      while (last - t0 < 5000) { k++; g.pointOfView({ lat: view.lat + 0.02 * Math.sin(k / 30), lng: view.lng + 0.02 * Math.cos(k / 30), altitude: view.altitude }, 0); const t = await raf(); iv.push(t - last); last = t; }
      const s = iv.slice().sort((a, b) => a - b), q = p => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10; await sleep(200);
      return { state: label, valid: h && iv.length > 0, health_record: h, frames: iv.length, median: q(0.5), p95: q(0.95), worst: q(1), over33: iv.filter(v => v > 33.4).length, over50: iv.filter(v => v > 50).length, longtasks: within(lt0, lt0 + 5000).filter(x => x.type === 'longtask').map(x => x.d), picture_shown: S().pic.shown }; };
    const zebra = document.getElementById('tgl-zebra-botswana-Z3866');
    // ---- A. picture refused
    { const t = performance.now(); sw.click(); const ok = await until(() => S().status === 'shown', 30000); OUT.A.warm = { shown: ok, ms: Math.round(performance.now() - t), picture: S().pic.status, used: S().pic.used, refused }; if (!ok) throw new Error('warm switch-on did not reach shown: ' + S().status); await sleep(1500); view = g.pointOfView(); sw.click(); await sleep(1000); }
    { const h = await health(), t0 = performance.now(); let n = 0, on = true; (function f() { if (on) { n++; requestAnimationFrame(f); } })(); await sleep(2500); on = false; await sleep(200); OUT.A.control = { valid: h && n > 0, health_record: h, frames: n, entries: within(t0, t0 + 2500) }; }
    for (let i = 0; i < 7; i++) OUT.A.runs.push(Object.assign({ run: i + 1 }, await redraw(false)));
    OUT.A.frames.push(await orbit('nothing on'));
    sw.click(); if (!(await until(() => S().status === 'shown', 15000))) OUT.notes.push('A: corridor not shown before its orbit'); await sleep(800); OUT.A.frames.push(await orbit('corridor, picture refused'));
    if (zebra) { zebra.click(); await sleep(4000); OUT.A.journey_on = !!(ME.journey && ME.journey.on && ME.journey.on()); OUT.A.frames.push(await orbit('corridor and zebra journey, picture refused')); zebra.click(); await sleep(600); } else OUT.notes.push('zebra switch not found');
    // ---- B. arrival: the real request, through the page's own button, with the areas shown
    window.fetch = realFetch; g.pointOfView(view, 0); await sleep(500);
    { const btn = document.getElementById('cor-pic-retry'), h = await health(); if (S().status !== 'shown' || btn.hidden || btn.getAttribute('aria-disabled') === 'true') throw new Error('B: the picture button is not available (corridor ' + S().status + ', picture ' + S().pic.status + ')');
      const t0 = performance.now(); btn.click(); let tDone = null, tShown = null; while (performance.now() - t0 < 30000) { const t = await raf(), s = S().pic; if (tDone == null && !s.busy) tDone = t - t0; if (s.shown) { tShown = t - t0; break; } if (!s.busy && s.status === 'failed') break; }
      const end = performance.now() + 300; await sleep(500); const s = S().pic, e = within(t0, end), tasks = e.filter(x => x.type === 'longtask'); document.activeElement && document.activeElement.blur && document.activeElement.blur();
      OUT.B = { performed: s.shown, valid: h && s.shown, health_record: h, picture: { status: s.status, err: s.err, used: s.used, fetch_ms: s.fetchMs, decode_ms: s.decodeMs, attach_ms: s.attachMs, attach_to_frame_ms: s.frameMs }, press_to_answer_ms: tDone == null ? null : Math.round(tDone), press_to_picture_shown_ms: tShown == null ? null : Math.round(tShown), corridor_still: S().status, longest_task_ms: tasks.length ? Math.max(...tasks.map(x => x.d)) : 0, tasks: tasks.map(x => [x.s, x.d]), long_frames: e.filter(x => x.type === 'loaf').map(x => [x.s, x.d, x.blocking]) }; }
    // ---- C. picture in memory
    if (OUT.B.performed) { await sleep(600); OUT.C.frames.push(await orbit('corridor with picture'));
      if (zebra) { zebra.click(); await sleep(4000); OUT.C.frames.push(await orbit('corridor with picture and zebra journey')); zebra.click(); await sleep(600); }
      sw.click(); await sleep(1000); for (let i = 0; i < 7; i++) OUT.C.runs.push(Object.assign({ run: i + 1 }, await redraw(true))); OUT.C.requests_after = S().pic.used; }
    else { OUT.C = { performed: false, why: 'the real picture request failed in B: ' + (S().pic.err || S().pic.status) }; if (S().on) { sw.click(); await sleep(600); } }
    if (S().on) { sw.click(); await sleep(600); }
    try { const gl = g.renderer().getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); OUT.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); OUT.buffer = [gl.drawingBufferWidth, gl.drawingBufferHeight]; } catch (_) { }
    OUT.bench_end_ms = bench(); OUT.visibility.push(document.visibilityState); OUT.focus.push(document.hasFocus()); OUT.ended = new Date().toISOString();
  } catch (e) { OUT.error = String(e && e.stack || e).slice(0, 400); }
  window.fetch = realFetch; OUT.version = 2;
  try { const body = JSON.stringify(OUT), r = await realFetch('/_save/mac-picture-' + OUT.started.replace(/[^0-9]/g, '').slice(0, 14) + '.json', { method: 'POST', body }); OUT.saved = r.ok ? await r.text() : 'not saved: HTTP ' + r.status; OUT.saved_bytes = new TextEncoder().encode(body).length;
    OUT.saved_sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)))].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { OUT.saved = 'not saved: ' + String(e).slice(0, 120); }
  OUT.done = true;
})();
