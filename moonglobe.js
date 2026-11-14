/* Moon globe (moon.html). Self-contained; needs globe.gl (same build as the Earth page).
 * A looking view only: NASA SVS appearance map on a sphere, evenly lit, drag to turn.
 * No sunlight and no live spacecraft. One overlay, off by default: LRO's DATED path (10–11 June 2026) in the Moon-fixed frame
 * (docs/concepts/MOON-LRO-DATED-PATH-PROPOSAL.md rev 2; catalogue assets/moon/craft-moon-me-2026-06-R1.json, sha256 pinned below).
 * The spacecraft drawing below (craft.js) owns the time: the overlay follows its selected minute and its 120-sample window.
 * Texture convention relied on (verified by phase1/moon-globe.test.cjs against named landmarks):
 *   longitude-latitude image, 0° longitude at the centre, east to the right, north up. */
(() => {
  'use strict';
  const LIB = 'https://unpkg.com/globe.gl@2.45.0/dist/globe.gl.min.js', LIB_WAIT_MS = 12000;   // the library is loaded here, never by a blocking tag: the spacecraft drawing must not wait for a CDN
  const $ = id => document.getElementById(id);
  const el = $('mg-globe'), state = $('mg-state'), read = $('mg-read');
  if (!el) return;
  const TEX = 'assets/moon/lroc_color_2k.jpg?v=1';
  const ALT = () => innerWidth <= 720 ? 2.6 : 2.2, ALT_MIN = 0.5;   // whole Moon in the box; closest look (the map is about 5 km a pixel at the equator, so closer only blurs)
  const alt = () => globe ? Math.max(ALT_MIN, Math.min(ALT(), globe.pointOfView().altitude)) : ALT();
  const fail = why => { el.hidden = true; $('mg-ctl').hidden = true; read.hidden = true;
    state.textContent = 'Moon globe unavailable'; const p = $('mg-why'); p.hidden = false; p.textContent = why + ' The spacecraft drawing below does not need it.'; };
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };
  if (!webgl()) return fail('This browser or device has no WebGL, which the globe needs.');

  const fmt = (v, pos, neg) => Math.abs(v) < .5 ? '0°' : Math.round(Math.abs(v)) + '°' + (v >= 0 ? pos : neg);
  const side = lng => Math.abs(lng) <= 90 ? 'near side' : 'far side';
  const norm = lng => ((lng + 180) % 360 + 360) % 360 - 180;
  let globe, dead = false, libOk = false, texOk = false;
  const failOnce = why => { if (dead || globe) return; dead = true; fail(why); };
  const show = () => { const v = globe.pointOfView(), lng = norm(v.lng);
    read.textContent = 'Centre of view: ' + fmt(v.lat, 'N', 'S') + ' ' + fmt(lng, 'E', 'W') + ' · ' + side(lng); };
  const img = new Image();
  img.onerror = () => failOnce('The Moon map did not load.');
  img.onload = () => { texOk = true; start(); };
  const start = () => {
    if (dead || globe || !libOk || !texOk) return;
    try {
      globe = Globe()(el).width(el.clientWidth).height(el.clientHeight)
        .globeImageUrl(TEX).backgroundColor('#05070b').showAtmosphere(false);
      // Evenly lit: ambient light only. No direction of sunlight is implied.
      const amb = globe.lights().filter(l => l.isAmbientLight);
      amb.forEach(l => { l.intensity = Math.PI; l.color.set(0xffffff); });
      globe.lights(amb);
      const mat = globe.globeMaterial(); if (mat && mat.shininess !== undefined) { mat.shininess = 0; if (mat.specular) mat.specular.set(0x000000); }
      const c = globe.controls(); c.autoRotate = false; c.enablePan = false;
      // Zoom stays inside the box: pinch (touch, or a trackpad's ctrl+wheel) and the Zoom buttons move the camera.
      // A plain mouse wheel is left to scroll the page (see the capture listener below).
      c.enableZoom = true; c.minDistance = 100 * (1 + ALT_MIN); c.maxDistance = 100 * (1 + ALT());
      globe.pointOfView({ lat: 0, lng: 0, altitude: ALT() }, 0);
      c.addEventListener('change', show);
      state.textContent = 'The Moon · drag to turn, or use the buttons';
      el.dataset.ready = '1'; show();
    } catch (e) { globe = null; failOnce('The globe could not start on this device.'); }
  };
  img.src = TEX;
  const lib = document.createElement('script'); lib.src = LIB; lib.async = true;
  const timer = setTimeout(() => failOnce('The globe library did not arrive within ' + LIB_WAIT_MS / 1000 + ' seconds.'), LIB_WAIT_MS);
  lib.onload = () => { clearTimeout(timer); if (typeof Globe === 'undefined') return failOnce('The globe library did not load.'); libOk = true; start(); };
  lib.onerror = () => { clearTimeout(timer); failOnce('The globe library did not load (blocked, or no network when the page opened).'); };
  document.head.appendChild(lib);

  // Every button moves the view at once (no glide): a second press can never be lost behind a running animation,
  // and the readout always describes what is on screen.
  const set = (lat, lng, a) => { if (!globe) return; globe.pointOfView({ lat: Math.max(-85, Math.min(85, lat)), lng: norm(lng), altitude: Math.max(ALT_MIN, Math.min(ALT(), a)) }, 0); show(); };
  const go = (lat, lng) => set(lat, lng, alt());
  const turn = (dlat, dlng) => { if (!globe) return; const v = globe.pointOfView(); set(v.lat + dlat, v.lng + dlng, alt()); };
  const zoom = f => { if (!globe) return; const v = globe.pointOfView(); set(v.lat, v.lng, alt() * f); };
  $('mg-zin').addEventListener('click', () => zoom(0.75));
  $('mg-zout').addEventListener('click', () => zoom(1 / 0.75));
  el.addEventListener('wheel', e => { if (!e.ctrlKey) e.stopPropagation(); }, { capture: true, passive: true });
  el.addEventListener('mousedown', e => e.preventDefault());   // pressing on the globe to drag it does not move keyboard focus (e.g. off “change the time”); dragging is unaffected   // plain wheel: not for the globe, the page scrolls
  $('mg-near').addEventListener('click', () => go(0, 0));
  $('mg-far').addEventListener('click', () => go(0, 180));
  for (const [id, dlat, dlng] of [['mg-west', 0, -15], ['mg-east', 0, 15], ['mg-north', 15, 0], ['mg-south', -15, 0]]) $(id).addEventListener('click', () => turn(dlat, dlng));
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (globe) { globe.width(el.clientWidth).height(el.clientHeight); globe.controls().maxDistance = 100 * (1 + ALT()); } }, 120); });

  // ---------- LRO's dated path (off by default)
  const LRO = { url: 'assets/moon/craft-moon-me-2026-06-R1.json?v=1', rev: 'craft-moon-me-2026-06-R1', from: 'craft-moon-2026-06-R1',
    sha: 'd62fb2712406f25711ea43f3380c3e7b8ab75692a26ae6134de60e474e30afb9', R: 1737.4, n: 1441, start: Date.UTC(2026, 5, 10), step: 60000 };
  const lb = $('mg-lro'), lread = $('mg-lro-read');
  const ov = { on: false, data: null, err: undefined, sel: null, drawn: null };   // err: undefined while loading, null when loaded
  const num = v => typeof v === 'number' && isFinite(v);
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getUTCDate()} ${MONS[d.getUTCMonth()]} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; };
  /** The path's geographic conversion: Moon-fixed x, y, z (km) → planetocentric latitude, east longitude, altitude in globe radii. */
  const toGlobe = (x, y, z) => { const r = Math.hypot(x, y, z);
    return { lat: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, lng: Math.atan2(y, x) * 180 / Math.PI, alt: r / LRO.R - 1, km: r - LRO.R }; };
  async function loadLro() {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 10000);
      let buf; try { const r = await fetch(LRO.url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); } finally { clearTimeout(tm); }
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
      if (h !== LRO.sha) return 'the file failed its integrity check';
      const j = JSON.parse(new TextDecoder().decode(buf)), T = j.time || {};
      if (j.schema !== 1 || j.catalogue_revision !== LRO.rev || !j.derived_from || j.derived_from.revision !== LRO.from || !j.frame || j.frame.name !== 'MOON_ME_DE440_ME421'
        || j.body_radius_km !== LRO.R || T.n !== LRO.n || T.step_s !== 60 || T.start !== '2026-06-10T00:00:00Z' || T.end !== '2026-06-11T00:00:00Z'
        || !Array.isArray(j.xyz_km) || j.xyz_km.length !== 3 * LRO.n || !j.xyz_km.every(num)) return 'the file is not in the expected form';
      const g = []; for (let i = 0; i < LRO.n; i++) { const q = toGlobe(j.xyz_km[3 * i], j.xyz_km[3 * i + 1], j.xyz_km[3 * i + 2]); if (!(q.km > 0)) return 'the file holds a position below the reference sphere'; g.push(q); }
      ov.data = g; return null;
    } catch (e) { return 'the file could not be loaded'; }
  }
  const lroReady = loadLro().then(e => { ov.err = e; });
  const behind = q => { if (!globe) return false; const c = globe.camera().position, p = globe.getCoords(q.lat, q.lng, q.alt), R = 100;
    const d = { x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }, dd = d.x * d.x + d.y * d.y + d.z * d.z;
    const t = Math.max(0, Math.min(1, -(c.x * d.x + c.y * d.y + c.z * d.z) / dd)); return Math.hypot(c.x + t * d.x, c.y + t * d.y, c.z + t * d.z) < R; };
  function clearOverlay() { if (globe) { globe.pathsData([]); globe.labelsData([]); } ov.drawn = null; }
  // The readout is rebuilt only when its kind changes (loading / unavailable / no time / drawn). While a path is drawn, a new time
  // or a camera move updates text in place, so keyboard focus (e.g. on "change the time") is never thrown away.
  let mode = '';
  const setMode = (m, html) => { if (mode === m && m !== 'msg') return false; mode = m; lread.innerHTML = html; return true; };
  function updateBehind() { const e = $('mg-lro-behind'); if (!e || !ov.drawn) return; const h = behind(ov.drawn.marker); if (e.hidden === h) e.hidden = !h; }
  function drawOverlay() {
    if (!lb || !lread) return;
    lb.setAttribute('aria-pressed', String(ov.on)); lb.textContent = ov.on ? 'Hide LRO’s dated path' : 'Show LRO’s dated path';
    if (!ov.on) { clearOverlay(); lread.hidden = true; mode = ''; lread.innerHTML = ''; return; }
    lread.hidden = false;
    if (ov.err || !ov.data) { clearOverlay(); mode = 'msg'; lread.innerHTML = ov.err ? `<b>Dated path unavailable on the globe</b> — ${ov.err}. The globe and the spacecraft drawing below are unaffected.` : 'loading…'; return; }
    if (!globe) { clearOverlay(); mode = 'msg'; lread.innerHTML = '<b>Dated path unavailable on the globe</b> — the globe is not running. The spacecraft drawing below is unaffected.'; return; }
    const s = ov.sel;
    if (!s || s.kind !== 'example' || s.rev !== LRO.from || !(s.i >= 0 && s.i < LRO.n) || !(s.lo >= 0 && s.hi < LRO.n && s.lo <= s.i && s.i <= s.hi)) {
      clearOverlay();
      setMode('none', 'No dated position on the globe for this time. Use <a href="#craft-view" id="mg-lro-go">the spacecraft drawing</a> below to open the dated example.'); return; }
    const pts = []; for (let i = s.lo; i <= s.hi; i++) { const q = ov.data[i]; pts.push([q.lat, q.lng, q.alt]); }
    const m = ov.data[s.i];
    globe.pathsData([{ pts }]).pathPoints('pts').pathPointLat(p => p[0]).pathPointLng(p => p[1]).pathPointAlt(p => p[2])
      .pathResolution(1e9).pathColor(() => '#ffd27a').pathStroke(null).pathTransitionDuration(0);
    globe.labelsData([{ lat: m.lat, lng: m.lng, alt: m.alt }]).labelLat('lat').labelLng('lng').labelAltitude('alt').labelText(() => 'LRO')
      .labelSize(2.2).labelDotRadius(1.1).labelColor(() => '#ffd27a').labelResolution(2).labelsTransitionDuration(0);
    ov.drawn = { i: s.i, lo: s.lo, hi: s.hi, marker: m, pts: pts.length };
    setMode('drawn', `<span><b>Dated LRO example · 10–11 June 2026 UTC</b></span>`
      + `<span>Calculated from NASA/GSFC’s definitive trajectory · <span id="mg-lro-t"></span> · <a href="#craft-controls" id="mg-lro-time">change the time</a></span>`
      + `<span id="mg-lro-alt"></span><span id="mg-lro-win"></span>`
      + `<span id="mg-lro-behind" hidden>At this time LRO is behind the Moon from this view.</span>`
      + `<span class="dim">The line is the spacecraft’s flight path above a spherical Moon (radius 1,737.4 km), not a track on the ground; the marker is enlarged so it can be seen. Moon orientation: JPL DE440 via NAIF.</span>`);
    const put = (id, v) => { const e = $(id); if (e.textContent !== v) e.textContent = v; };
    put('mg-lro-t', hm(LRO.start + s.i * LRO.step) + ' UTC');
    put('mg-lro-alt', m.km.toFixed(1) + ' km above the reference sphere');
    put('mg-lro-win', `Path shown: ${hm(LRO.start + s.lo * LRO.step)} to ${hm(LRO.start + s.hi * LRO.step)} UTC, joining LRO’s one-minute positions.`);
    updateBehind();
  }
  if (lb) lb.addEventListener('click', async () => { ov.on = !ov.on; drawOverlay(); if (ov.on && !ov.data && ov.err === undefined) { await lroReady; drawOverlay(); } });
  if (lread) lread.addEventListener('click', ev => { const a = ev.target.closest('a'); if (!a) return;
    if (a.id === 'mg-lro-time') { const r = $('craft-range'); if (r && !r.closest('[hidden]')) { ev.preventDefault(); r.focus(); r.scrollIntoView({ block: 'center' }); } }
    if (a.id === 'mg-lro-go') { const b = $('craft-example'); if (b) { ev.preventDefault(); b.focus(); b.scrollIntoView({ block: 'center' }); } } });
  document.addEventListener('me:craft-select', ev => { ov.sel = ev.detail; if (ov.on) drawOverlay(); });
  if (window.ME && 'craftSelection' in window.ME) ov.sel = window.ME.craftSelection;
  let rbt; const reBehind = () => { clearTimeout(rbt); rbt = setTimeout(() => { if (ov.on && ov.drawn) updateBehind(); }, 150); };   // a camera move changes only the behind-the-Moon line
  const hook = () => { if (globe) globe.controls().addEventListener('change', reBehind); };   // any turn or zoom: re-check whether the marker is behind the Moon
  const started = setInterval(() => { if (globe) { clearInterval(started); hook(); if (ov.on) drawOverlay(); } else if (dead) clearInterval(started); }, 200);
  for (const id of ['mg-near', 'mg-far', 'mg-west', 'mg-east', 'mg-north', 'mg-south', 'mg-zin', 'mg-zout']) { const b = $(id); if (b) b.addEventListener('click', reBehind); }

  window.MoonGlobe = { view: () => globe ? globe.pointOfView() : null, point: (lat, lng) => set(lat, lng, alt()), lights: () => globe ? globe.lights().map(l => l.type) : null,   // test aids
    lro: () => ({ on: ov.on, err: ov.err, loaded: !!ov.data, drawn: ov.drawn ? { ...ov.drawn, behind: behind(ov.drawn.marker) } : null }),
    toGlobe, globe: () => globe };
})();
