/* Moon globe (moon.html). Self-contained; needs globe.gl (same build as the Earth page).
 * A looking view only: NASA SVS appearance map on a sphere, evenly lit, drag to turn.
 * No spacecraft, no sunlight, no time: those need the Moon-fixed frame work described in
 * docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md (rev 2.1, section 3.1). The spacecraft diagram below is separate.
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
  el.addEventListener('wheel', e => { if (!e.ctrlKey) e.stopPropagation(); }, { capture: true, passive: true });   // plain wheel: not for the globe, the page scrolls
  $('mg-near').addEventListener('click', () => go(0, 0));
  $('mg-far').addEventListener('click', () => go(0, 180));
  for (const [id, dlat, dlng] of [['mg-west', 0, -15], ['mg-east', 0, 15], ['mg-north', 15, 0], ['mg-south', -15, 0]]) $(id).addEventListener('click', () => turn(dlat, dlng));
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (globe) { globe.width(el.clientWidth).height(el.clientHeight); globe.controls().maxDistance = 100 * (1 + ALT()); } }, 120); });
  window.MoonGlobe = { view: () => globe ? globe.pointOfView() : null, point: (lat, lng) => set(lat, lng, alt()), lights: () => globe ? globe.lights().map(l => l.type) : null };   // test aid
})();
