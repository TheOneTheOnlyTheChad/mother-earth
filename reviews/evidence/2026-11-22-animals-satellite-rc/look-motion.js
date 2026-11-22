/* Mother Earth — Animals regional satellite picture candidate: a CONTINUOUS-MOTION check of the picture's drawing (gate 1, after GPT's hold of 22 Nov).
 * Run in animals.html served from the review copy, straight after a fresh load, in the window to be checked (the page itself, or the page inside a 390 px frame).
 * Result: window.__ME_LOOK (done: true when finished), also handed to the review server (POST /_save/).
 *
 * TEST PICTURE, NOT NASA'S: window.fetch is wrapped for the regional request only and answers with a picture made here: four flat colours, one per quarter
 * of the fixed box (north-west red, north-east green, south-west blue, south-east yellow). The whole-globe backdrop is the page's own, real one.
 * With a known colour at every point of the box, a frame in which the picture is hidden, torn, mis-ordered against the globe or the wrong way round shows up
 * as a wrong colour at a probe. The check is of DRAWING during motion; it says nothing about NASA's picture, cloud, or timing.
 *
 * Method: the camera is moved on every frame (drag-like wobble close in; a zoom from the corridor view out to altitude 1.5 and back; wobbles pulled back at two heights;
 * a wobble in between). After each frame the library has drawn, five probes are read straight from the drawing buffer (one pixel each, gl.readPixels;
 * no GL state is changed) at fixed places in the box, each at least 0.12 degrees from any line, edge, quarter boundary or published area.
 * A probe is read only while one tenth of a degree covers at least 4 device pixels; smaller than that is counted as "too small to judge", not as a pass.
 * A read counts as wrong if any channel is more than 70 from the expected colour. Every wrong read is kept (first 60 in full). Not a timing measurement. */
(async () => {
  const OUT = window.__ME_LOOK = { done: false, started: new Date().toISOString(), href: location.href, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, phases: [], wrong: [], notes: [] };
  const realFetch = window.fetch;
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r)), S = () => ME.corridor.state(), g = ME.animalsGlobe.raw(), R = g.renderer(), gl = R.getContext(), cv = R.domElement;
    const until = async (f, ms) => { const t = performance.now(); while (!f()) { if (performance.now() - t > ms) return false; await sleep(25); } return true; };
    if (!(await until(() => S().facts === 'ready' && !['loading', 'none'].includes(ME.animalsGlobe.state().backdrop), 30000))) throw new Error('page not ready');
    if (S().on || S().pic.used !== 0) throw new Error('run this straight after a fresh load (picture attempts used: ' + S().pic.used + ')');
    OUT.backdrop = ME.animalsGlobe.state().backdrop; OUT.pin = ME.corridor.C.CATALOG_SHA256; OUT.canvas = [cv.width, cv.height, cv.clientWidth, cv.clientHeight];
    const COL = { nw: [208, 32, 32], ne: [32, 176, 32], sw: [32, 64, 208], se: [208, 192, 32] }, hexc = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
    const c2 = document.createElement('canvas'); c2.width = 960; c2.height = 800; const x = c2.getContext('2d'); x.fillStyle = hexc(COL.nw); x.fillRect(0, 0, 480, 400); x.fillStyle = hexc(COL.ne); x.fillRect(480, 0, 480, 400); x.fillStyle = hexc(COL.sw); x.fillRect(0, 400, 480, 400); x.fillStyle = hexc(COL.se); x.fillRect(480, 400, 480, 400);
    const png = await new Promise(r => c2.toBlob(r, 'image/png')); let answered = 0;
    window.fetch = function (u) { if (typeof u === 'string' && /gibs\.earthdata\.nasa\.gov/.test(u) && /[?&]WIDTH=960(&|$)/.test(u)) { answered++; return Promise.resolve(new Response(png, { status: 200, headers: { 'content-type': 'image/png' } })); } return realFetch.apply(this, arguments); };
    document.getElementById('cor-tgl').click();
    if (!(await until(() => S().status === 'shown' && S().pic.shown, 30000))) throw new Error('areas or test picture not shown: ' + S().status + ' / ' + S().pic.status + ' ' + S().pic.err);
    window.fetch = realFetch; OUT.test_picture_answers = answered; await sleep(1200);
    const PROBES = [['nw', 38.625, -119.375], ['nw', 38.5, -119.65], ['ne', 38.625, -118.875], ['se', 38.125, -118.875], ['sw', 38.1, -119.65]], home = g.pointOfView();
    const sx = cv.width / cv.clientWidth, sy = cv.height / cv.clientHeight, px = new Uint8Array(4);
    const read = (phase) => { const a = g.getScreenCoords(38.3, -119.2, 0), b = g.getScreenCoords(38.4, -119.2, 0), tenth = Math.hypot((a.x - b.x) * sx, (a.y - b.y) * sy), out = { reads: 0, wrong: 0, small: 0, off: 0, tenth };
      if (gl.getParameter(gl.FRAMEBUFFER_BINDING) !== null) { out.unreadable = 1; return out; }
      for (const [q, la, lo] of PROBES) { if (tenth < 4) { out.small++; continue; } const c = g.getScreenCoords(la, lo, 0), X = Math.round(c.x * sx), Y = Math.round(cv.height - c.y * sy); if (!(X >= 2 && Y >= 2 && X < cv.width - 2 && Y < cv.height - 2)) { out.off++; continue; }
        gl.readPixels(X, Y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); out.reads++; const e = COL[q]; if (Math.abs(px[0] - e[0]) > 70 || Math.abs(px[1] - e[1]) > 70 || Math.abs(px[2] - e[2]) > 70) { out.wrong++; if (OUT.wrong.length < 60) OUT.wrong.push({ phase, probe: [q, la, lo], got: [px[0], px[1], px[2]], expected: e, altitude: +g.pointOfView().altitude.toFixed(4), tenth_px: +tenth.toFixed(1) }); } }
      return out; };
    const run = async (name, ms, pov) => { const P = { phase: name, frames: 0, reads: 0, wrong: 0, too_small: 0, off_screen: 0, unreadable: 0, altitude: [Infinity, 0], tenth_px: [Infinity, 0] }; g.pointOfView(pov(0), 0); await raf(); await raf(); const t0 = performance.now();
      for (;;) { await raf(); const t = (performance.now() - t0) / ms; const o = read(name), al = g.pointOfView().altitude; P.frames++; P.reads += o.reads; P.wrong += o.wrong; P.too_small += o.small; P.off_screen += o.off; P.unreadable += o.unreadable || 0; P.altitude = [Math.min(P.altitude[0], al), Math.max(P.altitude[1], al)]; P.tenth_px = [Math.min(P.tenth_px[0], o.tenth), Math.max(P.tenth_px[1], o.tenth)]; if (t >= 1) break; g.pointOfView(pov(t), 0); }
      P.altitude = P.altitude.map(v => +v.toFixed(4)); P.tenth_px = P.tenth_px.map(v => +v.toFixed(1)); OUT.phases.push(P); };
    const wob = (alt, amp) => t => ({ lat: 38.3 + amp * Math.sin(t * 14), lng: -119.2 + amp * Math.cos(t * 9), altitude: alt });
    // a still frame first: if the probes are not right when nothing moves, the method does not apply and the run says so
    { g.pointOfView({ lat: 38.3, lng: -119.2, altitude: 0.05 }, 0); await sleep(600); await raf(); const o = read('still'); OUT.still = o; if (o.unreadable || o.reads !== PROBES.length || o.wrong) OUT.notes.push('STILL FRAME NOT AS EXPECTED: the motion results below cannot be read as a pass'); }
    await run('close, drag-like wobble (corridor view height)', 4000, wob(home.altitude, 0.12));
    await run('zoom out from the corridor view to altitude 1.5', 6000, t => ({ lat: 38.3, lng: -119.2, altitude: home.altitude * Math.pow(1.5 / home.altitude, t) }));
    await run('zoom back in', 6000, t => ({ lat: 38.3, lng: -119.2, altitude: 1.5 * Math.pow(home.altitude / 1.5, t) }));
    await run('in between (altitude 0.06), wobble', 3000, wob(0.06, 0.3));
    await run('pulled back (altitude 0.12), wobble', 4000, wob(0.12, 0.7));
    await run('pulled back (altitude 0.25), wobble', 4000, wob(0.25, 1.5));
    g.pointOfView(home, 0); await sleep(400);
    OUT.totals = OUT.phases.reduce((a, p) => ({ frames: a.frames + p.frames, reads: a.reads + p.reads, wrong: a.wrong + p.wrong, too_small: a.too_small + p.too_small, off_screen: a.off_screen + p.off_screen, unreadable: a.unreadable + p.unreadable }), { frames: 0, reads: 0, wrong: 0, too_small: 0, off_screen: 0, unreadable: 0 });
    OUT.picture_after = { shown: S().pic.shown, used: S().pic.used }; OUT.ended = new Date().toISOString();
  } catch (e) { OUT.error = String(e && e.stack || e).slice(0, 400); }
  window.fetch = realFetch;
  try { const body = JSON.stringify(OUT), r = await realFetch('/_save/look-motion-' + innerWidth + 'px-' + OUT.started.replace(/[^0-9]/g, '').slice(0, 14) + '.json', { method: 'POST', body }); OUT.saved = r.ok ? await r.text() : 'not saved: HTTP ' + r.status; } catch (e) { OUT.saved = 'not saved: ' + String(e).slice(0, 120); }
  OUT.done = true;
})();
