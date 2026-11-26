/* Moon LROC regional detail: Apollo 11 (moon.html). MOON-LROC-REGION-PROPOSAL rev 2.1 §6, GPT's closure notes.
 * Off by default. On: the globe turns to the site through the ordinary view call (MoonGlobe.point: leaves the Earth view like any view
 * button, keeps "Lit as now" and the height/temperature mode), a locator ring marks the place (not the image footprint), and a panel
 * below shows one dated LRO NAC observation at two scales, each loaded only when first chosen. The images are pictures from the PDS
 * orthophotos; nothing here is a measurement readout. Facts and geometry: assets/moon/lroc/SOURCE.json (built by phase1/moonsci/build_lroc.py). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const btn = $('mg-lroc'), panel = $('mg-lroc-panel');
  if (!btn || !panel) return;
  const SITE = { lat: 0.67416, lng: 23.47314 };   // Apollo 11 LM, LROC 2016 coordinate list (mean Earth/polar axis); locator and turn-to
  const V = {
    area: { url: 'assets/moon/lroc/a11-area-4m.jpg?v=1', mask: 'assets/moon/lroc/a11-area-4m-mask.png?v=1', w: 1055, h: 1000, groundW: 4220, bar: [1000, '1 km'],
      alt: 'LRO Narrow Angle Camera picture of the Apollo 11 landing area, about 4.2 km across: a grey, cratered plain lit from the left (west). A blue box marks the 512 m site view; hatched strips at the edges have no image data.' },
    site: { url: 'assets/moon/lroc/a11-site-0p5m.jpg?v=1', w: 1024, h: 1024, groundW: 512, bar: [100, '100 m'],
      alt: 'LRO Narrow Angle Camera picture of the Apollo 11 landing site, 512 m across: a grey, cratered plain lit from the left (west). Near the centre the Lunar Module descent stage is a small bright spot with a dark shadow to its right; a crater lies just below and to its left.' } };
  const FP = { x: 0.663981043, y: 0.43625, w: 0.121327014, h: 0.128 };   // site footprint in the area picture (SOURCE.json geometry)
  const PTR = { x: 0.500148448, y: 0.500410309 };                          // descent stage in the site picture (SOURCE.json geometry)
  const TIMEOUT_MS = 20000;
  const CAP = { area: 'averaged to 4 m (2 × 2 blocks of the 2 m orthophoto; blocks with at least 2 of 4 valid pixels)', site: 'shown at its native pixel spacing of 0.5 m' };
  const S = { on: false, view: 'area', tok: 0, state: 'off', why: '', earth: false, locVisible: false, ring: null, shown: '' };
  const radios = [...panel.querySelectorAll('input[name="mg-lroc-view"]')];
  const img = $('mg-lroc-img'), fig = $('mg-lroc-fig'), st = $('mg-lroc-state'), retry = $('mg-lroc-retry'), loc = $('mg-lroc-loc');
  const nd = $('mg-lroc-nd'), fp = $('mg-lroc-fp'), arrow = $('mg-lroc-arrow'), ptrL = $('mg-lroc-ptr-l'), ptr = $('mg-lroc-ptr');
  const bar = $('mg-lroc-bar'), barL = $('mg-lroc-barl'), cap = $('mg-lroc-cap'), ndKey = $('mg-lroc-nd-key');
  const MG = () => window.MoonGlobe;
  const G = () => (MG() && MG().globe && MG().globe()) || null;
  const earthView = () => { try { return !!(MG() && MG().light && MG().light().earthView); } catch (e) { return false; } };

  // ---------- locator (globe library HTML layer: fixed screen size, hidden past the limb by the library's own test, no pointer events)
  function locLine() {
    if (!S.on) { loc.hidden = true; return; }
    loc.hidden = false;
    const t = S.earth ? 'Locator hidden in the Earth view. Return to the ordinary view (drag, zoom or any view button) to see it.'
      : 'Ring: locator for the Apollo 11 site (marks the place, not the image’s footprint). The globe’s picture is about 5 km a pixel, so the detail is shown below.';
    if (loc.textContent !== t) loc.textContent = t;
  }
  /** Is the site on the camera's side of the sphere? Worked out from the live camera each time (visible when camera · site > R²), not from
   *  the library's cached behind-the-globe answer, which can still describe the camera from before the turn when the locator is first placed. */
  function front() { const g = G(); if (!g) return false; const c = g.camera().position, q = g.getCoords(SITE.lat, SITE.lng, 0);
    return c.x * q.x + c.y * q.y + c.z * q.z > q.x * q.x + q.y * q.y + q.z * q.z; }
  function drawLocator() {
    const g = G(); if (!g) return false;
    if (!S.ring) { S.ring = document.createElement('div'); S.ring.className = 'mgl-ring'; S.ring.setAttribute('aria-hidden', 'true'); }
    g.htmlElementsData([SITE]).htmlLat('lat').htmlLng('lng').htmlAltitude(0).htmlTransitionDuration(0).htmlElement(() => S.ring)
      // the library's HTML renderer rewrites style.display on every frame, so hiding uses visibility
      .htmlElementVisibilityModifier((el, vis) => { S.libVis = vis; S.earth = earthView(); S.locVisible = front() && !S.earth; el.style.visibility = S.locVisible ? 'visible' : 'hidden'; locLine(); });
    return true;
  }
  function clearLocator() { const g = G(); if (g) g.htmlElementsData([]); S.locVisible = false; }

  // ---------- panel
  function scaleBar() {
    if (S.state !== 'shown') return; const v = V[S.view], w = img.clientWidth; if (!w) return;
    const px = v.bar[0] / (v.groundW / w);   // ground-distance bar: metres per displayed pixel from the picture's own width
    bar.style.width = px.toFixed(1) + 'px'; barL.textContent = v.bar[1];
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(scaleBar) : null; if (ro) ro.observe(img); else addEventListener('resize', scaleBar);
  function overlays() {
    const a = S.view === 'area';
    nd.hidden = !a; ndKey.hidden = !a; fp.hidden = !a; ptrL.hidden = a;
    arrow.hidden = a || !ptr.checked;
    if (a) Object.assign(fp.style, { left: FP.x * 100 + '%', top: FP.y * 100 + '%', width: FP.w * 100 + '%', height: FP.h * 100 + '%' });
    else Object.assign(arrow.style, { left: PTR.x * 100 + '%', top: PTR.y * 100 + '%' });
  }
  function setState(state, html) { S.state = state; st.innerHTML = html; retry.hidden = state !== 'failed'; fig.hidden = state !== 'shown'; }
  function fail(why) { S.why = why; setState('failed', `<b>Detailed image unavailable</b> — ${why}. The locator stays on the globe.`); }
  const preload = (url, w, h) => new Promise((res, rej) => { const im = new Image(); im.onload = () => (w && (im.naturalWidth !== w || im.naturalHeight !== h)) ? rej('the picture was not the expected size') : res(im); im.onerror = () => rej('the picture did not load'); im.src = url; });
  function load(view) {
    const tok = ++S.tok; S.view = view; S.why = '';
    for (const r of radios) r.checked = r.value === view;
    setState('loading', 'loading the detailed picture…');
    const v = V[view];
    const timer = new Promise((_, rej) => setTimeout(() => rej('it took too long'), TIMEOUT_MS));
    const work = Promise.all([preload(v.url, v.w, v.h), v.mask ? preload(v.mask, v.w, v.h) : null]);
    Promise.race([work, timer]).then(() => {
      if (tok !== S.tok || !S.on || S.view !== view) return;          // a late result for a view no longer wanted is dropped
      img.alt = v.alt; img.src = v.url; S.shown = v.url;
      cap.textContent = 'One observation by LRO’s Narrow Angle Camera (M150368601, left and right cameras), 22 January 2011, 20:48:53–20:49:11 UTC. '
        + `LROC’s map-projected orthophoto from the PDS, ${CAP[view]}; what the eye can resolve depends on your screen. Brightness stretched for display; not a measured reflectance. Credit: NASA/GSFC/Arizona State University.`;
      overlays(); setState('shown', ''); scaleBar();
    }, why => { if (tok !== S.tok || !S.on) return; fail(typeof why === 'string' ? why : 'the picture did not load'); });
  }
  function setOn(on) {
    if (on === S.on) return;
    S.on = on; S.tok++;
    btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'Hide the detailed site' : 'Show a detailed site: Apollo 11 (LROC)';
    panel.hidden = !on;
    if (on) {
      if (MG() && MG().point) MG().point(SITE.lat, SITE.lng);   // like a view button: leaves the Earth view; lighting and science modes kept
      if (!drawLocator()) { const t = setInterval(() => { if (!S.on) return clearInterval(t); if (drawLocator()) clearInterval(t); }, 200); }
      S.earth = earthView(); locLine(); load(S.view);
    } else {
      clearLocator(); locLine(); setState('off', ''); img.removeAttribute('src'); S.shown = ''; btn.focus();   // camera left where it is
    }
  }
  btn.addEventListener('click', () => setOn(!S.on));
  for (const r of radios) r.addEventListener('change', () => { if (r.checked && S.on && r.value !== S.view) load(r.value); });
  retry.addEventListener('click', () => { if (S.on) load(S.view); });
  ptr.addEventListener('change', () => { if (S.state === 'shown') overlays(); });
  // Entering or leaving the Earth view (moonglobe.js) moves the camera after setting its flag, so the library's visibility callback above
  // re-runs and hides or restores the locator; nothing else is needed here.

  window.MoonLroc = { state: () => ({ on: S.on, view: S.view, state: S.state, why: S.why, tok: S.tok, earth: S.earth, locVisible: S.locVisible, shown: S.shown,
    ring: S.ring ? { visibility: S.ring.style.visibility, inDom: document.body.contains(S.ring) } : null, libVis: S.libVis, front: front() }), SITE, FP, PTR, TIMEOUT_MS };   // test aids
})();
