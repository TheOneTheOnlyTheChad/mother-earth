/* Mother Earth — the Animals page's own globe (animals-tab-rc, stage 1; docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md rev 3.1,
 * Part A). PRIVATE PREVIEW. A plain reference globe for one recorded journey at a time. It carries NO live layer, no day/night
 * line, no search and no zoom-out view, and it makes no request to the hub.
 * Backdrop (Chad, 20 Nov 2026): the same dated NASA GIBS picture Earth now uses, chosen by the same rule (the UTC date 36 hours
 * before now; one VIIRS true-colour layer). The rule is repeated here so this page does not load the Earth now application; the
 * suite checks that these constants equal app.js's and that the address equals index.html's. The picture is of ITS OWN date,
 * never of a journey's dates, and the line under the globe says so.
 * If the picture cannot be fetched, the globe stays plain, a Natural Earth coastline outline is drawn (the file Wind uses), and
 * the line says "Satellite backdrop unavailable". Journeys remain usable either way. The coastline file is requested only then.
 * The picture is fetched once, checked to be an image, and handed to the globe from memory: one request, and a failure is known.
 * Rules: no auto-rotation and no camera motion on entry; a lost graphics context is reported, never hidden. */
(() => {
  const ME = window.ME = window.ME || {};
  const $ = id => document.getElementById(id);
  const el = $('an-globe'), note = $('an-backdrop'); if (!el) return;
  const G = {
    IMG_OFFSET_H: 36, IMG_LAYER: 'VIIRS_NOAA21_CorrectedReflectance_TrueColor', IMG_SAT: 'NOAA-21',   // = app.js IMG_DAY and IMG_LAYER
    IMG_WAIT_MS: 20000,                 // a picture that has not arrived in 20 s is treated as unavailable (our number)
    COAST_FILE: 'assets/coast-50m.bin?v=202612121200', COAST_MAGIC: 'MECOAST1', COAST_ALT: 0.002, COAST_OPACITY: 0.92, COAST_MAX_SEG_DEG: 1,
    PLAIN: 0x15263c,                    // the plain globe's colour
    VIEW: { lat: -10, lng: 25, altitude: 2.2 },
    T: {
      loading: 'Backdrop: loading satellite imagery…',
      plain: 'Satellite backdrop unavailable. Plain globe with a coastline outline (Natural Earth, a reference line). Journeys can still be shown.',
      plainNoCoast: 'Satellite backdrop unavailable. Plain globe; the coastline outline could not be loaded either. Journeys can still be shown.',
      lost: 'The 3-D globe stopped: this browser lost its graphics context. Reload the page to use the globe again.',
    },
  };
  const IMG_DAY = new Date(Date.now() - G.IMG_OFFSET_H * 3600e3).toISOString().slice(0, 10);
  const IMG_LABEL = new Date(IMG_DAY).toUTCString().slice(5, 16);
  const IMG_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/jpeg&WIDTH=2048&HEIGHT=1024&CRS=EPSG:4326&BBOX=-90,-180,90,180&TIME=' + IMG_DAY + '&LAYERS=' + G.IMG_LAYER;
  G.T.imagery = `Backdrop: NASA satellite imagery for ${IMG_LABEL} (NASA GIBS, VIIRS ${G.IMG_SAT}), not the journey dates. Dark areas: low sunlight or no imagery; the cause of gaps is not established.`;
  const st = { globe: 'starting', why: '', technical: '', backdrop: 'none', imgErr: '', coast: 'idle', coastErr: '', coastSegs: 0, objUrl: null };
  const listeners = [];
  let globe = null, coastMesh = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function paint() {
    if (note) { note.hidden = st.globe !== 'ok' && st.globe !== 'lost';
      note.textContent = st.globe === 'lost' ? G.T.lost : st.backdrop === 'imagery' ? G.T.imagery : st.backdrop === 'plain' ? (st.coast === 'failed' ? G.T.plainNoCoast : G.T.plain) : G.T.loading; }
    for (const f of listeners) { try { f(); } catch (_) { } }
  }
  const webglMissing = () => { try { const c = document.createElement('canvas'); if (c.getContext('webgl2') || c.getContext('webgl')) return null;
    return 'This browser or device has 3-D graphics (WebGL) turned off or unavailable.'; } catch (_) { return 'This browser blocked 3-D graphics (WebGL) when the page asked for it.'; } };
  /** The reader gets plain language; the library's own error goes to the console and a collapsed Diagnostics block. */
  function unavailable(plain, technical) {
    globe = null; st.globe = 'failed'; st.why = plain; st.technical = technical ? String(technical).slice(0, 300) : '';
    if (technical) console.error('[Mother Earth] Animals globe initialisation failed:', technical);
    el.innerHTML = '<div class="globe-fail"><div><b>The globe needs 3-D graphics</b><br>' + esc(plain) +
      ' A journey cannot be shown here. The study details, sources and licences below remain available.' +
      (technical ? '<details><summary>Diagnostics</summary><code>' + esc(st.technical) + '</code></details>' : '') + '</div></div>';
    paint();
  }

  // ---------- the coastline outline for the plain globe (its own mesh; the same file and drawing rule as wind.js)
  async function loadCoast() {
    if (st.coast !== 'idle' || !globe) return; st.coast = 'loading';
    try {
      const r = await fetch(G.COAST_FILE); if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = await r.arrayBuffer(), dv = new DataView(b); let o = 8;
      if (b.byteLength < 12 || new TextDecoder().decode(new Uint8Array(b, 0, 8)) !== G.COAST_MAGIC) throw new Error('not a coastline file');
      const n = dv.getUint32(o, true); o += 4; const lens = []; let total = 0;
      for (let i = 0; i < n; i++) { const k = dv.getUint32(o, true); o += 4; lens.push(k); total += k; }
      if (!(n > 0 && n < 5000) || b.byteLength !== o + total * 4) throw new Error('coastline file has the wrong length');
      const gm = globe.globeMaterial(); let gmesh = null; globe.scene().traverse(x => { if (x.isMesh && (Array.isArray(x.material) ? x.material[0] : x.material) === gm) gmesh = x; });
      const pos = gmesh && gmesh.geometry && gmesh.geometry.getAttribute && gmesh.geometry.getAttribute('position');
      if (!gmesh || !gmesh.parent || !pos) throw new Error('the globe is not ready for the outline');
      const Geo = Object.getPrototypeOf(gmesh.geometry.constructor), xyz = []; let segs = 0;
      const put = (lng, lat) => { const c = globe.getCoords(lat, lng, G.COAST_ALT); xyz.push(c.x, c.y, c.z); };
      for (const k of lens) { let prev = null;
        for (let i = 0; i < k; i++) { const lng = dv.getInt16(o, true) / 100, lat = dv.getInt16(o + 2, true) / 100; o += 4;
          if (Math.abs(lng) > 180 || Math.abs(lat) > 90) throw new Error('coastline point out of range');
          if (prev) { const m = Math.max(1, Math.ceil(Math.max(Math.abs(lng - prev[0]), Math.abs(lat - prev[1])) / G.COAST_MAX_SEG_DEG));   // long straight runs are cut so they follow the curve
            for (let q = 0; q < m; q++) { const t0 = q / m, t1 = (q + 1) / m; put(prev[0] + (lng - prev[0]) * t0, prev[1] + (lat - prev[1]) * t0);
              const x1 = prev[0] + (lng - prev[0]) * t1, y1 = prev[1] + (lat - prev[1]) * t1; put(x1, y1); put(x1, y1); segs++; } }
          prev = [lng, lat]; } }
      const geo = new Geo(); geo.setAttribute('position', new pos.constructor(new Float32Array(xyz), 3));
      const mat = new gm.constructor({ wireframe: true, transparent: true, opacity: G.COAST_OPACITY, depthWrite: false }); if (mat.color) mat.color.set(0xffffff); if (mat.emissive) mat.emissive.set(0xffffff);
      coastMesh = new gmesh.constructor(geo, mat); coastMesh.raycast = () => { }; coastMesh.renderOrder = 1; coastMesh.frustumCulled = false; coastMesh.__animalsCoast = true;
      if (st.backdrop === 'plain') gmesh.parent.add(coastMesh);
      st.coastSegs = segs; st.coast = 'ready';
    } catch (e) { st.coast = 'failed'; st.coastErr = String(e && e.message || e); }
    paint();
  }
  // ---------- the backdrop picture: one request, checked, then given to the globe from memory
  async function loadBackdrop() {
    if (!globe) return; st.backdrop = 'loading'; paint();
    const c = new AbortController(), timer = setTimeout(() => c.abort(), G.IMG_WAIT_MS);
    try {
      const r = await fetch(IMG_URL, { signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const type = (r.headers.get('content-type') || '').toLowerCase(); if (!type.startsWith('image/')) throw new Error('the answer is not an image (' + (type || 'no type') + ')');
      const blob = await r.blob(); if (!blob.size) throw new Error('the image is empty');
      await new Promise((res, rej) => { const im = new Image(); im.onload = () => (im.naturalWidth > 0 ? res() : rej(new Error('the image has no size'))); im.onerror = () => rej(new Error('the image could not be decoded')); st.objUrl = URL.createObjectURL(blob); im.src = st.objUrl; });
      if (!globe) return;
      const gm = globe.globeMaterial(); if (gm.color) gm.color.set(0xffffff);
      globe.globeImageUrl(st.objUrl); st.backdrop = 'imagery'; st.imgErr = '';
    } catch (e) {
      st.imgErr = String(e && e.message || e); if (st.objUrl) { try { URL.revokeObjectURL(st.objUrl); } catch (_) { } st.objUrl = null; }
      st.backdrop = 'plain'; paint(); return loadCoast();                    // the date line is replaced at once; it never claims a picture that is not shown
    } finally { clearTimeout(timer); }
    paint();
  }

  const missing = webglMissing();
  if (missing) unavailable(missing, null);
  else {
    try {
      if (typeof Globe === 'undefined') throw new Error('globe.gl did not load (script blocked, or no network when the page opened)');
      globe = Globe()(el).enablePointerInteraction(false).width(el.clientWidth || 300).height(el.clientHeight || 300).backgroundColor('#070a0f').showAtmosphere(true).atmosphereColor('#4a6a9a').atmosphereAltitude(.18);
      const gm = globe.globeMaterial(); if (gm.color) gm.color.set(G.PLAIN);
      globe.pointOfView(G.VIEW, 0); globe.controls().autoRotate = false;
      st.globe = 'ok';
      const cv = globe.renderer().domElement;
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); st.globe = 'lost'; st.why = G.T.lost; paint(); });
      const size = () => { if (globe && el.clientWidth && el.clientHeight) globe.width(el.clientWidth).height(el.clientHeight); };
      window.addEventListener('resize', size); window.addEventListener('orientationchange', size);
      if (typeof ResizeObserver === 'function') new ResizeObserver(size).observe(el);
      size(); loadBackdrop();
    } catch (e) { unavailable('The 3-D globe could not start in this browser.', (e && e.message) || e); }
  }
  paint();
  /** the handle the journey replay draws on: null when there is no usable globe */
  ME.globe = () => (st.globe === 'ok' ? globe : null);
  ME.animalsGlobe = { G, IMG_DAY, IMG_LABEL, IMG_URL, onChange: f => { listeners.push(f); }, raw: () => globe,
    /** read-only aid for tests and the console */
    state: () => ({ globe: st.globe, why: st.why, technical: st.technical, backdrop: st.backdrop, imgErr: st.imgErr, coast: st.coast, coastErr: st.coastErr, coastSegs: st.coastSegs,
      coastInScene: !!(coastMesh && coastMesh.parent), note: note ? note.textContent : null, noteHidden: note ? note.hidden : null,
      autoRotate: globe ? !!globe.controls().autoRotate : null, view: globe ? globe.pointOfView() : null, size: globe ? [globe.width(), globe.height()] : null }) };
})();
