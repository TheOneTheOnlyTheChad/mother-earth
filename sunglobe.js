/* Sun globe (sun.html). Self-contained; loads globe.gl itself (never by a blocking tag).
 * MOON-SUN-GLOBES-PROPOSAL rev 2.3 §3.2. One picture: NASA/SDO HMI continuum, fetched hourly by OUR hub; this page never calls SDO.
 *
 * WHAT IS DRAWN
 *   The picture is a view of the Sun's disc from near Earth. It is wrapped on the Earth-facing part of a sphere by orthographic
 *   projection from three measured numbers (disc centre cx, cy and radius R, by a circle fit to the limb in the picture itself)
 *   and one computed angle (B0, the tilt of the Sun's axis toward Earth on that date).
 *   Globe longitude 0 is the centre of the disc as seen from Earth; positive longitude is solar WEST (right, with north up).
 *     x =  cos(lat) sin(lon)                      (right)
 *     y =  sin(lat) cos(B0) − cos(lat) cos(lon) sin(B0)   (up)
 *     z =  sin(lat) sin(B0) + cos(lat) cos(lon) cos(B0)   (toward Earth; z ≤ 0 is the far side)
 *     pixel = (cx + R·x, cy − R·y)
 *   ASSUMPTION, checked outside this file before release (see the review packet): solar north is UP in SDO's browse image.
 *   MASK: nothing with z ≤ 0, and nothing farther than MASK_RHO of the radius from the disc centre, is ever taken from the picture.
 *   That keeps the stretched limb, the black sky and SDO's printed caption off the sphere. Everything else is drawn plain and
 *   reads "Outside this image's view".
 *
 * TIMES (three, never merged)
 *   observed_at is not known and is never shown. The page shows "File updated at …" (SDO's Last-Modified, via the hub) and when the
 *   hub retrieved it. AGE LIMIT: the picture is shown only while (now − file updated) < age_limit_s (three hours). "now" is this
 *   device's clock corrected by the hub's clock as read with the pointer, so the limit holds in a tab left open, with the hub
 *   silent, and on resume. At the limit the picture is removed: "No recent picture".
 *   A newer pointer whose picture cannot be loaded or placed never displaces a picture that is still valid. */
(() => {
  'use strict';
  const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
  const LIB = 'https://unpkg.com/globe.gl@2.45.0/dist/globe.gl.min.js', LIB_WAIT_MS = 12000, IMG_WAIT_MS = 20000, META_WAIT_MS = 12000;
  const TICK_MS = 15000, REFETCH_MS = 10 * 60000, MASK_RHO = 0.97, TW = 2048, TH = 1024, DEG = Math.PI / 180;
  const PLAIN = [38, 43, 51], HATCH = [58, 64, 74];
  const $ = id => document.getElementById(id);
  const el = $('sg-globe'), state = $('sg-state'), read = $('sg-read'), times = $('sg-times'), why = $('sg-why');
  if (!el) return;

  // ---------- pure parts (also used by the tests through window.SunGlobe)
  /** B0 in degrees for a UTC instant: heliographic latitude of the centre of the disc as seen from Earth (Meeus, Astronomical Algorithms, ch. 25 and 29; low-precision solar longitude, good to ~0.01°). */
  function sunB0(ms) {
    const JD = ms / 86400000 + 2440587.5, T = (JD - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T, M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    const lam = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * DEG);
    const K = 73.6667 + 1.3958333 * (JD - 2396758) / 36525;
    return Math.asin(Math.sin((lam - K) * DEG) * Math.sin(7.25 * DEG)) / DEG;
  }
  /** Disc coordinates of a surface point: { x, y, z } in units of the radius (see the header). */
  function toDisc(lat, lon, b0) {
    const cl = Math.cos(lat * DEG), sl = Math.sin(lat * DEG), cb = Math.cos(b0 * DEG), sb = Math.sin(b0 * DEG), co = Math.cos(lon * DEG);
    return { x: cl * Math.sin(lon * DEG), y: sl * cb - cl * co * sb, z: sl * sb + cl * co * cb };
  }
  /** Is this surface point taken from the picture? */
  function seen(lat, lon, b0) { const d = toDisc(lat, lon, b0); return d.z > 0 && Math.hypot(d.x, d.y) <= MASK_RHO; }
  /** Circle fit to the limb. data = RGBA bytes. Returns { cx, cy, R, rms, n } or null when the picture does not hold one clean bright disc. */
  function fitDisc(data, w, h) {
    const T = 40, lum = (x, y) => { const o = (y * w + x) * 4; return Math.max(data[o], data[o + 1], data[o + 2]); };
    const pts = [];
    const run = (len, at) => { let best = 0, b0 = -1, cur = 0, c0 = 0; for (let i = 0; i < len; i++) { if (at(i) > T) { if (!cur) c0 = i; cur++; if (cur > best) { best = cur; b0 = c0; } } else cur = 0; } return best ? [b0, b0 + best - 1, best] : null; };
    for (let y = 0; y < h; y += 2) { const r = run(w, x => lum(x, y)); if (r && r[2] >= 0.3 * w) { if (r[0] > 0) pts.push([r[0] - 0.5, y]); if (r[1] < w - 1) pts.push([r[1] + 0.5, y]); } }
    for (let x = 0; x < w; x += 2) { const r = run(h, y => lum(x, y)); if (r && r[2] >= 0.3 * h) { if (r[0] > 0) pts.push([x, r[0] - 0.5]); if (r[1] < h - 1) pts.push([x, r[1] + 0.5]); } }
    if (pts.length < 200) return null;
    const fit = P => {   // Kåsa: x² + y² + D x + E y + F = 0, least squares
      let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0; const n = P.length;
      for (const [x, y] of P) { const z = x * x + y * y; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sz += z; sxz += x * z; syz += y * z; }
      const A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], B = [-sxz, -syz, -sz];
      const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const d = det(A); if (!d) return null;
      const col = k => A.map((r, i) => r.map((v, j) => j === k ? B[i] : v));
      const D = det(col(0)) / d, E = det(col(1)) / d, F = det(col(2)) / d, cx = -D / 2, cy = -E / 2, R2 = cx * cx + cy * cy - F;
      return R2 > 0 ? { cx, cy, R: Math.sqrt(R2) } : null;
    };
    let c = fit(pts); if (!c) return null;
    const res = P => P.map(([x, y]) => Math.hypot(x - c.cx, y - c.cy) - c.R);
    const keep = pts.filter((p, i, a) => Math.abs(Math.hypot(p[0] - c.cx, p[1] - c.cy) - c.R) < 4);   // drop stray edges (a caption, a sunspot at the threshold) and fit once more
    if (keep.length < 200) return null;
    c = fit(keep); if (!c) return null;
    const r = res(keep), rms = Math.sqrt(r.reduce((s, v) => s + v * v, 0) / r.length);
    if (!(c.R > 0.35 * w && c.R < 0.5 * w) || Math.abs(c.cx - w / 2) > 0.06 * w || Math.abs(c.cy - h / 2) > 0.06 * h || rms > 1.5 || keep.length < 0.8 * pts.length) return null;
    return { cx: c.cx, cy: c.cy, R: c.R, rms, n: keep.length };
  }
  /** Equirectangular texture for the sphere: picture where seen(), plain hatch elsewhere. src = RGBA bytes of the picture (null → all plain). */
  function buildTexture(src, w, h, g, b0) {
    const out = new Uint8ClampedArray(TW * TH * 4), cb = Math.cos(b0 * DEG), sb = Math.sin(b0 * DEG);
    for (let j = 0; j < TH; j++) {
      const lat = (90 - (j + 0.5) / TH * 180) * DEG, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let i = 0; i < TW; i++) {
        const lon = ((i + 0.5) / TW * 360 - 180) * DEG, co = Math.cos(lon), o = (j * TW + i) * 4;
        let r = PLAIN[0], gg = PLAIN[1], b = PLAIN[2];
        if (((i + j * 2) & 31) < 3) { r = HATCH[0]; gg = HATCH[1]; b = HATCH[2]; }
        if (src) { const z = sl * sb + cl * co * cb;
          if (z > 0) { const x = cl * Math.sin(lon), y = sl * cb - cl * co * sb;
            if (x * x + y * y <= MASK_RHO * MASK_RHO) { const px = Math.round(g.cx + g.R * x), py = Math.round(g.cy - g.R * y);
              if (px >= 0 && py >= 0 && px < w && py < h) { const s = (py * w + px) * 4; r = src[s]; gg = src[s + 1]; b = src[s + 2]; } } } }
        out[o] = r; out[o + 1] = gg; out[o + 2] = b; out[o + 3] = 255;
      }
    }
    return out;
  }
  const fmt = (v, pos, neg) => Math.abs(v) < .5 ? '0°' : Math.round(Math.abs(v)) + '°' + (v >= 0 ? pos : neg);
  const norm = lng => ((lng + 180) % 360 + 360) % 360 - 180;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], p2 = n => String(n).padStart(2, '0');
  const utc = ms => { const d = new Date(ms); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`; };
  const ageText = s => { const m = Math.floor(s / 60); return m < 1 ? 'under a minute ago' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`; };
  window.SunGlobe = { sunB0, toDisc, seen, fitDisc, buildTexture, MASK_RHO };

  // ---------- state
  let globe = null, dead = false, libOk = false, shown = null /* { image, geom, b0 } */, limitS = 10800, offset = 0, lastMeta = 0, busy = false, plainUrl = null, note = '';
  const now = () => Date.now() + offset;
  const ALT = () => innerWidth <= 720 ? 2.6 : 2.2, ALT_MIN = 0.5;
  const alt = () => globe ? Math.max(ALT_MIN, Math.min(ALT(), globe.pointOfView().altitude)) : ALT();
  const fail = msg => { if (dead) return; dead = true; el.hidden = true; $('sg-ctl').hidden = true; read.hidden = true; times.hidden = true; state.textContent = 'Sun globe unavailable'; why.hidden = false; why.textContent = msg + ' The spacecraft drawing below does not need it.'; };
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };
  const toUrl = px => { const c = document.createElement('canvas'); c.width = TW; c.height = TH; c.getContext('2d').putImageData(new ImageData(px, TW, TH), 0, 0); return c.toDataURL('image/png'); };
  const ageS = im => (now() - Date.parse(im.file_updated)) / 1000;
  /** May this image be on screen at this instant? A usable time, not in the future of the corrected clock, and younger than the limit. */
  const valid = im => !!im && typeof im.file_updated === 'string' && Number.isFinite(Date.parse(im.file_updated)) && ageS(im) >= -60 && ageS(im) < limitS;

  function show() {
    if (!globe) return;
    const v = globe.pointOfView(), lng = norm(v.lng);
    read.textContent = 'Centre of view: ' + fmt(v.lat, 'N', 'S') + ' ' + fmt(lng, 'W', 'E') + ' · ' + (!shown ? 'no picture' : seen(v.lat, lng, shown.b0) ? 'in this picture' : 'outside this image’s view');
  }
  /** Everything the reader is told about time, and the age rule itself. Runs on a timer, on resume, and after every pointer read. */
  function tick() {
    if (dead) return;
    if (shown && !valid(shown.image)) {   // the picture has reached its limit: remove it, whether or not the hub answers
      const im = shown.image; shown = null; note = `The last picture’s file was updated at ${utc(Date.parse(im.file_updated))}, more than ${Math.round(limitS / 3600)} hours ago.`;
      if (globe) globe.globeImageUrl(plainUrl);
    }
    if (shown) { const im = shown.image;
      state.textContent = 'The Sun · drag to turn, or use the buttons';
      times.textContent = `File updated at ${utc(Date.parse(im.file_updated))} (${ageText(Math.max(0, ageS(im)))}). Retrieved by our hub at ${utc(Date.parse(im.retrieved_at))}. The file does not state when the Sun was observed.`;
      el.dataset.image = im.id; }
    else { state.textContent = 'No recent picture'; times.textContent = note || 'The hub has no picture of the Sun younger than three hours.'; el.dataset.image = ''; }
    show();
    if (now() - lastMeta > REFETCH_MS) refresh();
  }
  const loadImage = url => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; const t = setTimeout(() => rej(new Error('picture timed out')), IMG_WAIT_MS); i.onload = () => { clearTimeout(t); res(i); }; i.onerror = () => { clearTimeout(t); rej(new Error('picture did not load')); }; i.src = url; });
  /** Load and place one image. Resolves to { image, geom, b0, url } or throws; never touches what is on screen. */
  async function prepare(im) {
    const img = await loadImage(HUB + im.path);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data, geom = fitDisc(px, c.width, c.height);
    if (!geom) throw new Error('the Sun’s disc could not be located in the picture');
    const b0 = sunB0(Date.parse(im.file_updated));
    return { image: im, geom, b0, url: toUrl(buildTexture(px, c.width, c.height, geom, b0)) };
  }
  /** Read the pointer and, if it names a valid picture that is not the one on screen, try to put it up. Failure leaves the screen as it is. */
  async function refresh() {
    if (busy || dead) return; busy = true; lastMeta = now();
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), META_WAIT_MS); let m;
      try { const r = await fetch(HUB + '/snapshot/sunface/meta', { signal: ctl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); m = await r.json(); } finally { clearTimeout(t); }
      if (m && typeof m.now === 'string' && Number.isFinite(Date.parse(m.now))) offset = Date.parse(m.now) - Date.now();
      if (m && Number.isFinite(m.age_limit_s) && m.age_limit_s > 0 && m.age_limit_s <= 10800) limitS = m.age_limit_s;   // the hub may shorten the limit, never lengthen it past three hours
      for (const im of [m && m.image, m && m.previous]) {
        if (!valid(im)) continue;
        if (shown && shown.image.id === im.id) break;                                          // already up
        if (shown && Date.parse(im.file_updated) <= Date.parse(shown.image.file_updated)) break;   // never step back to an older picture
        try { const p = await prepare(im); if (!valid(im)) continue; shown = p; note = ''; if (globe) { globe.globeImageUrl(p.url); globe.pointOfView({ lat: p.b0, lng: 0, altitude: alt() }, 0); } break; }
        catch (e) { if (!shown) note = 'A picture is on the hub but could not be shown here: ' + e.message + '.'; }
      }
    } catch (e) { if (!shown && !note) note = 'The hub could not be reached for the Sun’s picture.'; }
    finally { busy = false; tick(); }
  }
  function start() {
    if (dead || globe || !libOk) return;
    try {
      plainUrl = toUrl(buildTexture(null, 0, 0, null, 0));
      globe = Globe()(el).width(el.clientWidth).height(el.clientHeight).globeImageUrl(shown ? shown.url : plainUrl).backgroundColor('#05070b').showAtmosphere(false);
      const amb = globe.lights().filter(l => l.isAmbientLight); amb.forEach(l => { l.intensity = Math.PI; l.color.set(0xffffff); }); globe.lights(amb);   // the picture supplies its own shading (limb darkening); no lamp
      const mat = globe.globeMaterial(); if (mat && mat.shininess !== undefined) { mat.shininess = 0; if (mat.specular) mat.specular.set(0x000000); }
      const c = globe.controls(); c.autoRotate = false; c.enablePan = false; c.enableZoom = true; c.minDistance = 100 * (1 + ALT_MIN); c.maxDistance = 100 * (1 + ALT());
      globe.pointOfView({ lat: shown ? shown.b0 : 0, lng: 0, altitude: ALT() }, 0);
      c.addEventListener('change', show);
      el.dataset.ready = '1'; tick();
    } catch (e) { globe = null; fail('The globe could not start on this device.'); }
  }
  if (!webgl()) { fail('This browser or device has no WebGL, which the globe needs.'); return; }
  const lib = document.createElement('script'); lib.src = LIB; lib.async = true;
  const timer = setTimeout(() => { if (!libOk) fail('The globe library did not arrive within ' + LIB_WAIT_MS / 1000 + ' seconds.'); }, LIB_WAIT_MS);
  lib.onload = () => { clearTimeout(timer); if (dead) return; if (typeof Globe === 'undefined') return fail('The globe library did not load.'); libOk = true; start(); };
  lib.onerror = () => { clearTimeout(timer); fail('The globe library did not load (blocked, or no network when the page opened).'); };
  document.head.appendChild(lib);
  refresh();
  setInterval(tick, TICK_MS);
  for (const ev of ['visibilitychange', 'pageshow', 'focus']) addEventListener(ev, () => { if (document.visibilityState !== 'hidden') tick(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') tick(); });

  // ---------- controls: every button moves the view at once
  const set = (lat, lng, a) => { if (!globe) return; globe.pointOfView({ lat: Math.max(-85, Math.min(85, lat)), lng: norm(lng), altitude: Math.max(ALT_MIN, Math.min(ALT(), a)) }, 0); show(); };
  const turn = (dlat, dlng) => { if (!globe) return; const v = globe.pointOfView(); set(v.lat + dlat, v.lng + dlng, alt()); };
  $('sg-near').addEventListener('click', () => set(shown ? shown.b0 : 0, 0, alt()));
  $('sg-far').addEventListener('click', () => set(shown ? -shown.b0 : 0, 180, alt()));
  for (const [id, dlat, dlng] of [['sg-east', 0, -15], ['sg-west', 0, 15], ['sg-north', 15, 0], ['sg-south', -15, 0]]) $(id).addEventListener('click', () => turn(dlat, dlng));
  $('sg-zin').addEventListener('click', () => { if (globe) { const v = globe.pointOfView(); set(v.lat, v.lng, alt() * 0.75); } });
  $('sg-zout').addEventListener('click', () => { if (globe) { const v = globe.pointOfView(); set(v.lat, v.lng, alt() / 0.75); } });
  el.addEventListener('wheel', e => { if (!e.ctrlKey) e.stopPropagation(); }, { capture: true, passive: true });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (globe) { globe.width(el.clientWidth).height(el.clientHeight); globe.controls().maxDistance = 100 * (1 + ALT()); } }, 120); });
  Object.assign(window.SunGlobe, { view: () => globe ? globe.pointOfView() : null, point: (lat, lng) => set(lat, lng, alt()), shown: () => shown && { id: shown.image.id, geom: shown.geom, b0: shown.b0 }, tick, refresh, lights: () => globe ? globe.lights().map(l => l.type) : null, limit: () => limitS, offset: () => offset });
})();
