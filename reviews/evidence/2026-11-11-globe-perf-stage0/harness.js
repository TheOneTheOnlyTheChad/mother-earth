// Globe performance Stage 0 harness, 11 Nov 2026 — run from the console (Claude in Chrome javascript_tool) in a tab of the
// live page. Read-only: wraps renderer.render for the duration of a window and restores it (checked), toggles .visible and
// sets it back (checked). Nothing is removed, disposed or sent anywhere. Reconstructed verbatim from the calls made this session;
// tab 1 (10:38–11:01 UTC) and tab 2 (from 11:07 UTC) used the same logic. Tab 1 added nNoRing/win/forcedWin after S0.1.

window.S = (() => {
const g = ME.globe(), r = g.renderer(), gl = r.getContext(), scene = g.scene(), cam = g.camera();
const ORIG = r.render;
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))].toFixed(1); };
const stats = a => ({ n: a.length, med: q(a, .5), p95: q(a, .95), max: a.length ? +Math.max(...a).toFixed(1) : null });
const env = () => ({ t: new Date().toISOString(), vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio, db: [gl.drawingBufferWidth, gl.drawingBufferHeight], vis: document.visibilityState, focus: document.hasFocus() });
const polyGroups = () => { const a = []; scene.traverse(o => { if (o.__globeObjType === 'polygon') a.push(o); }); return a; };
const kinds = () => { const caps = [], outl = []; for (const p of polyGroups()) p.traverse(o => { if (o === p) return; if (o.isMesh) caps.push(o); else if (o.isLine || o.isLineSegments) outl.push(o); }); return { caps, outl }; };
const ringObjs = () => { const a = []; scene.traverse(o => { if (o.__globeObjType === 'ring') a.push(o); }); return a; };
const census = () => { const byType = {}, byGlobe = {}; let n = 0; scene.traverse(o => { n++; byType[o.type] = (byType[o.type] || 0) + 1; if (o.__globeObjType) byGlobe[o.__globeObjType] = (byGlobe[o.__globeObjType] || 0) + 1; }); const k = kinds(); const pd = g.polygonsData(); const perLayer = {}; for (const p of pd) perLayer[p.layer] = (perLayer[p.layer] || 0) + 1; return { n, byType, byGlobe, polyGroups: polyGroups().length, caps: k.caps.length, outlines: k.outl.length, polygonsData: pd.length, perLayer, rings: g.ringsData().length, points: g.pointsData().length, mem: { ...r.info.memory } }; };
const ids = () => { try { const ps = ME.pairState(); const o = {}; for (const k in ps) o[k] = ps[k].cells; return o; } catch (e) { return String(e); } };
const nNoRing = () => { let n = 0; const skip = new Set(); scene.traverse(o => { if (o.__globeObjType === 'ring') o.traverse(c => skip.add(c)); }); scene.traverse(o => { if (!skip.has(o)) n++; }); return n; };
const hide = (kind, vis) => { const objs = kind === 'all' ? polyGroups() : kind === 'caps' ? kinds().caps : kind === 'outlines' ? kinds().outl : kind === 'rings' ? ringObjs() : []; for (const o of objs) o.visible = vis; return objs.length; };
const allVisible = () => { let v = true; for (const p of polyGroups()) p.traverse(o => { if (!o.visible) v = false; }); for (const o of ringObjs()) if (!o.visible) v = false; return v; };
// one window: 2 s warm-up, then W ms measured; longitude = start + deg/s × elapsed, set each frame with zero transition
const sweep = (W = 10000, deg = 36) => new Promise(res => {
  g.controls().autoRotate = false; const lat = -10, lng0 = 25, alt = 2.2;
  let phase = 'warm', t0 = performance.now(), last = null; const frames = [], rcpu = [], calls = [], tris = []; let cur = [];
  r.render = function (...a) { const s = performance.now(); const out = ORIG.apply(this, a); cur.push(performance.now() - s); return out; };
  g.pointOfView({ lat, lng: lng0, altitude: alt }, 0);
  const tick = now => {
    if (phase === 'warm') { const el = now - t0; g.pointOfView({ lat, lng: lng0 + deg * el / 1000, altitude: alt }, 0); if (el >= 2000) { phase = 'meas'; t0 = now; last = now; cur = []; g.pointOfView({ lat, lng: lng0, altitude: alt }, 0); } requestAnimationFrame(tick); return; }
    const el = now - t0; frames.push(now - last); last = now;
    if (cur.length) { rcpu.push(cur.reduce((x, y) => x + y, 0)); calls.push(r.info.render.calls); tris.push(r.info.render.triangles); } cur = [];
    if (el >= W) { r.render = ORIG; res({ frames: stats(frames.slice(1)), renderCpu: stats(rcpu), drawCalls: q(calls, .5), tris: q(tris, .5), restored: r.render === ORIG }); return; }
    g.pointOfView({ lat, lng: lng0 + deg * el / 1000, altitude: alt }, 0); requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
// forced completion: globe paused, N × render + 1-pixel readPixels
const forced = (N = 60) => { g.pauseAnimation(); const px = new Uint8Array(4), a = []; for (let i = 0; i < N; i++) { const s = performance.now(); ORIG.call(r, scene, cam); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); a.push(performance.now() - s); } g.resumeAnimation(); return stats(a); };
const sleep = ms => new Promise(f => setTimeout(f, ms));
// flag = polygonsData replaced or non-ring object count changed during the window (ring objects come and go as they animate)
const win = async (label, cond) => { if (cond) hide(cond, false); const pd0 = g.polygonsData(), n0 = nNoRing(), e = env(); const w = await sweep(); const n1 = nNoRing(); if (cond) hide(cond, true); return { label, cond, t: e.t, focus: e.focus && document.hasFocus(), vis: document.visibilityState, vw: innerWidth, vh: innerHeight, db: [gl.drawingBufferWidth, gl.drawingBufferHeight], frames: w.frames, renderCpu: w.renderCpu, drawCalls: w.drawCalls, tris: w.tris, flag: (g.polygonsData() !== pd0) || n0 !== n1, n0, n1, restoredRender: w.restored, allVisibleAfter: allVisible() }; };
const forcedWin = (label, cond) => { if (cond) hide(cond, false); const f = forced(); if (cond) hide(cond, true); return { label, cond, t: new Date().toISOString(), ...f, allVisibleAfter: allVisible() }; };
return { g, r, gl, env, census, ids, nNoRing, hide, allVisible, sweep, forced, win, forcedWin, stats, sleep, kinds, polyGroups, ringObjs, ORIG };
})();

// Block orders used: S0.2 for c of [null,'all',null,'all','all',null,'all',null] → S.win(c ? 'hidden' : 'visible', c), then the
// same order through S.forcedWin with 300 ms between. S0.3: the same with 'caps' and with 'outlines'. S0.4: 'rings'.

// S0.5a: Forest toggle through the page's own button, each state applied before the next
//   const btn = document.querySelector('button.tgl[data-layer="forest"]');
//   settle = two animation frames + 400 ms; check aria-pressed after every click; census at cycles 0, 1, 5, 20.
// S0.5b (disposable tab): base = g.polygonsData(); 20 × g.polygonsData(base.map(p => ({ ...p, geom: JSON.parse(JSON.stringify(p.geom)) })))
//   each followed by two animation frames + 300 ms.

// S0.7 picking: case centred with ME.pointView(lat, lng) (altitude 2); target canvas point = g.getScreenCoords(lat, lng, 0.006)
// + canvas rect (735, 343 CSS px every time). Real hover then real click through Claude in Chrome. Hover winner = text of
// .float-tooltip-kap. Click winner = #insp-h text. Tap → paint = canvas pointerdown (capture, event.timeStamp) to the first
// mutation in #insp, plus two requestAnimationFrame callbacks. Inspector closed with #insp-x between cases.

// S0.T: performance.mark('S0T2-visible-start'); S.win('visible', null); mark end; mark 'S0T2-hidden-start'; S.win('hidden','all'); mark end.

// S0.6 dwell: every 5 s compare S.ids() and the polygonsData() reference; on change record a checkpoint before and 3 s after;
// otherwise a checkpoint each minute; visibilitychange events logged; then three S.win('visible') + one S.forcedWin.
