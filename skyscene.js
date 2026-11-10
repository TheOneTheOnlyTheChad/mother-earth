/* Mother Earth — Sky zoom-out view: Earth → Moon → Sun (SKY-ZOOM-OUT-PROPOSAL rev 2.2; Chad's go, 10 Nov 2026).
 * Off on load: nothing is fetched until "Zoom out to the Moon and Sun" is used. Then ONE request:
 *   /catalogue/sky/<this page's scene revision> (hub ≥ 0.6.6). The complete file's sha256 must equal the pin, its shape must
 *   pass schema(), and its pairs_with must equal the Two Clocks card's own pinned revision and sha256 (ME.skyState()).
 *   Any failure → the view does not open and says why. Nothing is drawn.
 * Date (§5): the Two Clocks sample — today's UTC date on the device clock, at 00:00 UTC, matched exactly; no neighbour, no
 *   interpolation. A rollover while open changes bodies, distances, date line and text together (one update).
 * Scale (§4, Z2a): Earth and Moon to scale (true size, true distance). The Sun is drawn at SUN_SCENE_R Earth radii along its
 *   calculated direction, resized so its angular size from Earth's centre equals the real Sun's. Labels show actual distances.
 * Layers (§5, Z4a): every globe layer group (and the day/night mesh) is hidden in the view and restored exactly on exit.
 * Camera (§2, §4.3, §4.4): one continuous pull-back A → B → C along a path that swings between each stop's framing; free
 *   orbit allowed (then wheel/pinch zoom straight); Re-frame / stop buttons return to the path. Near plane by forward
 *   camera-space depth; far plane untouched. Everything saved on entry is restored on exit.
 * Directions come from build_scene.py (IAU 2006 precession + GMST; no nutation; polar motion 0; UT1 = UTC). Not observed.
 */
(() => {
  const ME = window.ME, $ = id => document.getElementById(id), esc = ME.esc;
  const REV = 'sky-scene-2026-11-R1';
  const SHA = 'd4605c3d4abc2c022aef6d5df4d2e92f7c29a01c583b43fa7efdbbaf9901ae29';
  const TIMEOUT_MS = 10000;
  const SUN_SCENE_R = 200;                       // Earth radii (rev 2.2 §4.2)
  const TAG = { w: 56, h: 18 }, INSET = 0.06, MIN_SEP_PX = 24, NEAR_MIN = 0.05;
  const DEPTH_RATIO = 1.5;   // no body more than 1.5x nearer the camera than another, so perspective cannot make the Moon look larger than Earth
  const TXT = {
    B: 'Earth and Moon to scale. Labels show actual distances.',
    C: 'Earth and Moon to scale. Sun drawn closer and resized. Labels show actual distances.',
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nice = iso => `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;
  const utcToday = () => new Date(Date.now()).toISOString().slice(0, 10);
  const st = { status: 'idle', reason: null, file: null, index: null, open: false, date: null, rows: null, saved: null,
    meshes: null, s: 0, path: null, free: false, sunShown: false, raf: 0, last: null, token: 0, msg: '' };

  // ---------- integrity + shape + pairing
  async function sha256(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
  function schema(j) {
    if (!j || j.catalogue !== 'sky' || j.catalogue_revision !== REV || j.content !== 'scene' || j.schema !== 1) return false;
    if (!Array.isArray(j.fields) || j.fields.join() !== 'date,lat,lng,range_km,time_flag' || !j.coverage || !j.bodies || !j.radii_km) return false;
    const r = j.radii_km; if (![r.earth_equatorial, r.moon, r.sun].every(v => typeof v === 'number' && v > 0)) return false;
    if (!j.pairs_with || typeof j.pairs_with.catalogue_revision !== 'string' || typeof j.pairs_with.fileSha256 !== 'string') return false;
    for (const b of ['moon', 'sun']) {
      const rows = j.bodies[b] && j.bodies[b].rows;
      if (!Array.isArray(rows) || !rows.length) return false;
      for (const x of rows) if (!Array.isArray(x) || x.length !== 5 || !/^\d{4}-\d\d-\d\d$/.test(x[0]) || !(Math.abs(x[1]) <= 90) || !(Math.abs(x[2]) <= 180)
        || typeof x[3] !== 'number' || !(x[3] > 0) || !['UTC', 'UT~'].includes(x[4])) return false;
    }
    return true;
  }
  function paired(j) {
    const c = ME.skyState ? ME.skyState() : null;
    return !!c && j.pairs_with.catalogue_revision === c.rev && j.pairs_with.fileSha256 === c.sha;
  }

  async function load() {
    if (st.file) return null;
    const t = ++st.token;
    let reason = null, buf = null;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(ME.HUB + '/catalogue/sky/' + encodeURIComponent(REV), { cache: 'no-store', signal: ctl.signal });
      if (!r.ok) { let b = null; try { b = await r.json(); } catch (e) {} reason = b && b.reason ? `the hub reports ${b.reason}` : `the hub answered ${r.status}`; }
      else buf = await r.arrayBuffer();
    } catch (e) { reason = 'the hub could not be reached'; }
    clearTimeout(timer);
    if (t !== st.token) return 'superseded';
    let j = null;
    if (!reason) { try { if (await sha256(buf) !== SHA) reason = 'integrity check failed'; } catch (e) { reason = 'integrity check failed'; } }
    if (!reason) { try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { reason = 'invalid'; } }
    if (!reason && !schema(j)) reason = 'invalid';
    if (!reason && !paired(j)) reason = 'it does not match the distances card';
    if (reason) return reason;
    st.file = j; st.index = {};
    for (const b of ['moon', 'sun']) st.index[b] = new Map(j.bodies[b].rows.map(r => [r[0], r]));
    return null;
  }
  const rowsFor = date => { const m = st.index.moon.get(date), s = st.index.sun.get(date); return m && s ? { moon: m, sun: s } : null; };

  // ---------- small vector helpers (three.js world units; globe radius = 1 Earth radius)
  const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]) };
  V.norm = a => V.mul(a, 1 / V.len(a));
  const slerp = (a, b, t) => { const d = Math.max(-1, Math.min(1, V.dot(a, b))), w = Math.acos(d);
    if (w < 1e-6) return a; const s = Math.sin(w); return V.norm(V.add(V.mul(a, Math.sin((1 - t) * w) / s), V.mul(b, Math.sin(t * w) / s))); };
  const lerp = (a, b, t) => V.add(V.mul(a, 1 - t), V.mul(b, t));

  // ---------- geometry of the scene at the sample instant
  function bodiesFor(rows) {
    const g = ME.globe(), R = g.getGlobeRadius(), rk = st.file.radii_km, Re = rk.earth_equatorial;
    const at = (lat, lng, altR) => { const c = g.getCoords(lat, lng, altR); return [c.x, c.y, c.z]; };
    const mR = rows.moon[3] / Re, sR = rows.sun[3] / Re;
    return {
      R,
      earth: { pos: [0, 0, 0], r: R },
      moon: { pos: at(rows.moon[1], rows.moon[2], mR - 1), r: R * rk.moon / Re, lat: rows.moon[1], lng: rows.moon[2], km: rows.moon[3] },
      sun: { pos: at(rows.sun[1], rows.sun[2], SUN_SCENE_R - 1), r: R * SUN_SCENE_R * rk.sun / rows.sun[3], lat: rows.sun[1], lng: rows.sun[2], km: rows.sun[3] },
    };
  }

  // ---------- framing (§4.3): fixed ordered candidate list, smallest distance at which every disc, ring and tag fits the
  // canvas with a 6% inset, the strip and the stop bar are kept clear, and no two markers come closer than MIN_SEP_PX.
  const CAND = (() => { const out = [], n = 240, g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), t = g * i; if (Math.abs(y) < 0.97) out.push([Math.cos(t) * r, y, Math.sin(t) * r]); }
    return out; })();
  function frameFor(list, W, H, padTop, padBot) {
    const cam = ME.globe().camera(), tv = Math.tan(cam.fov * Math.PI / 360), th = tv * W / H;
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const b of list) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], b.pos[k] - b.r); hi[k] = Math.max(hi[k], b.pos[k] + b.r); }
    const tgt = V.mul(V.add(lo, hi), 0.5);
    const yTop = tv * (1 - 2 * (H * INSET + padTop) / H), yBot = -tv * (1 - 2 * (H * INSET + padBot) / H), xLim = th * (1 - INSET);
    const lw = TAG.w / (W / 2) * th, lh = TAG.h / (H / 2) * tv;
    let best = null;
    for (const u of CAND) {
      const f = V.mul(u, -1), rt = V.norm(V.cross(f, [0, 1, 0])), up = V.cross(rt, f);
      const fits = d => {
        const c = V.add(tgt, V.mul(u, d)), pts = []; let zmin = Infinity, zmax = 0;
        for (const b of list) {
          const q = V.sub(b.pos, c), z = V.dot(q, f); if (z <= b.r * 1.5) return false; zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
          const x = V.dot(q, rt) / z, y = V.dot(q, up) / z, e = b.r / z;
          if (Math.abs(x) + e + lw > xLim || y + e + lh > yTop || y - e - lh < yBot) return false;
          pts.push([x / th * W / 2, y / tv * H / 2]);
        }
        if (zmax / zmin > DEPTH_RATIO) return false;
        for (let i = 0; i < pts.length; i++) for (let k = i + 1; k < pts.length; k++) if (Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]) < MIN_SEP_PX) return false;
        return true;
      };
      // not monotone (very far: markers merge below MIN_SEP_PX), so scan outward on a log grid, then bisect the first gap
      const R = list[0].r; let a = R * 1.5, z = null;
      for (let i = 0; i <= 80; i++) { const d = R * 1.5 * Math.pow(2000 / 1.5, i / 80); if (fits(d)) { z = d; break; } a = d; }
      if (z === null) continue;
      for (let i = 0; i < 40; i++) { const m = (a + z) / 2; if (fits(m)) z = m; else a = m; }
      if (!best || z < best.d) best = { u, d: z, tgt };
    }
    return best;
  }

  // ---------- path: s = 0 (entry view) → 1 (stop B) → 2 (stop C)
  function buildPath() {
    const g = ME.globe(), cam = g.camera(), el = $('globe'), W = el.clientWidth, H = el.clientHeight;
    const pt = $('zoom-bar').offsetHeight + 8, pb = $('zoom-strip').offsetHeight + 8;
    const b = st.meshes.geo, E = b.earth, M = b.moon, S = b.sun;
    const fB = frameFor([E, M], W, H, pt, pb), fC = frameFor([E, M, S], W, H, pt, pb);
    const p0 = [cam.position.x, cam.position.y, cam.position.z], t0 = g.controls().target, tg0 = [t0.x, t0.y, t0.z];
    const d0 = V.len(V.sub(p0, tg0)), u0 = V.norm(V.sub(p0, tg0));
    st.path = { W, H, k: [{ u: u0, d: d0, t: tg0 }, fB && { u: fB.u, d: fB.d, t: fB.tgt }, fC && { u: fC.u, d: fC.d, t: fC.tgt }] };
    return !!(fB && fC);
  }
  function at(s) {
    const k = st.path.k, i = s <= 1 ? 0 : 1, t = s <= 1 ? s : s - 1, a = k[i], b = k[i + 1];
    const d = Math.exp(Math.log(a.d) * (1 - t) + Math.log(b.d) * t);
    return { u: slerp(a.u, b.u, t), d, t: lerp(a.t, b.t, t) };
  }
  function place(view) {
    const g = ME.globe(), cam = g.camera(), c = g.controls();
    const p = V.add(view.t, V.mul(view.u, view.d));
    st.target = view.t;   // globe.gl's own 'change' handler resets the orbit target to Earth's centre; ours (registered after) puts it back
    c.target.set(view.t[0], view.t[1], view.t[2]); cam.position.set(p[0], p[1], p[2]); cam.lookAt(c.target); c.update();
  }
  function setS(s, fromUser) {
    st.s = Math.max(0, Math.min(2, s)); st.free = false; place(at(st.s));
    if (fromUser !== 'keep') announce();
  }
  const stopName = () => st.free ? 'free' : st.s < 0.5 ? 'A' : st.s < 1.5 ? 'B' : 'C';

  // ---------- meshes (flat, unlit: diffuse black + emissive; no light from the Sun, so no implied phase)
  function harvest() {
    const g = ME.globe(), gm = g.globeMaterial(); let gmesh = null;
    g.scene().traverse(o => { if (o.isMesh && (Array.isArray(o.material) ? o.material[0] : o.material) === gm) gmesh = o; });
    if (!gmesh) return null;
    return { gmesh, Mesh: gmesh.constructor, Sphere: gmesh.geometry.constructor, Mat: gm.constructor };
  }
  function makeMeshes() {
    const h = harvest(); if (!h) return null;
    const mk = (hex) => { const m = new h.Mat({ color: 0x000000, specular: 0x000000, shininess: 0 }); m.emissive && m.emissive.setHex(hex); return m; };
    const moon = new h.Mesh(new h.Sphere(1, 32, 16), mk(0x9a9a9a)), sun = new h.Mesh(new h.Sphere(1, 32, 16), mk(0xffe7a3));
    moon.__skyScene = 'moon'; sun.__skyScene = 'sun';
    return { h, moon, sun, geo: null };
  }
  function positionMeshes() {
    const g = st.meshes.geo;
    for (const b of ['moon', 'sun']) { const m = st.meshes[b]; m.position.set(...g[b].pos); m.scale.set(g[b].r, g[b].r, g[b].r); }
  }

  // ---------- layers: hide every layer group of the globe root, and siblings of the globe mesh (day/night), except the
  // atmosphere; restore each saved flag exactly
  function hideLayers() {
    const g = ME.globe(), h = st.meshes.h, saved = [];
    let root = h.gmesh; while (root.parent && root.parent !== g.scene()) root = root.parent;
    const globeGroup = (() => { let o = h.gmesh; while (o.parent && o.parent !== root) o = o.parent; return o; })();
    for (const ch of root.children) if (ch !== globeGroup) { saved.push([ch, ch.visible]); ch.visible = false; }
    for (const ch of h.gmesh.parent.children) if (ch !== h.gmesh && ch.__globeObjType !== 'atmosphere') { saved.push([ch, ch.visible]); ch.visible = false; }
    return saved;
  }

  // ---------- enter / exit
  async function enter() {
    const g = ME.globe && ME.globe();
    if (!g) return say('The zoom-out view needs the 3-D globe, which is not available in this browser.', true);
    if (st.open || st.status === 'loading') return;
    st.status = 'loading'; say('loading the computed positions…');
    const why = await load();
    if (why === 'superseded') return;
    if (why) { st.status = 'unavailable'; return say(`Zoom-out view unavailable — ${why}. Nothing is drawn.`, true); }
    const date = utcToday(), rows = rowsFor(date);
    if (!rows) { st.status = 'ok'; return say(`No computed position for today (${nice(date)}): this view covers ${nice(st.file.coverage.start)} – ${nice(st.file.coverage.end)}. Nothing is drawn.`, true); }
    for (let i = 0; i < 50 && !st.meshes; i++) { st.meshes = makeMeshes(); if (!st.meshes) await new Promise(r => setTimeout(r, 100)); }   // the globe mesh appears once globe.gl has finished building (up to 5 s)
    if (!st.meshes) { st.status = 'unavailable'; return say('Zoom-out view unavailable — the globe scene could not be read. Nothing is drawn.', true); }
    const cam = g.camera(), c = g.controls();
    const sheet = $('sheet'), wasOpen = sheet && !sheet.classList.contains('collapsed') && getComputedStyle($('sheet-btn')).display !== 'none';
    st.saved = { pos: cam.position.clone(), target: c.target.clone(), near: cam.near, minD: c.minDistance, maxD: c.maxDistance,
      zoom: c.enableZoom, pan: c.enablePan, auto: c.autoRotate, damp: c.enableDamping, sheetWasOpen: wasOpen, focus: document.activeElement };
    st.saved.layers = hideLayers();
    if (wasOpen) $('sheet-btn').click();
    st.open = true; st.status = 'ok'; st.date = date; st.rows = rows;
    // damping off in the view: leftover momentum would move the camera after a stop is placed (and read as free orbit)
    c.autoRotate = false; c.enableDamping = false; c.enableZoom = false; c.enablePan = false; c.maxDistance = 2000 * g.getGlobeRadius();
    g.scene().add(st.meshes.moon); g.scene().add(st.meshes.sun);
    if ($('zoom-ui').parentNode !== $('globe')) $('globe').appendChild($('zoom-ui'));   // globe.gl owns #globe's start-up contents
    $('zoom-ui').hidden = false; document.body.classList.add('sky-zoom'); $('tgl-zoom').textContent = 'Close the zoom-out view';
    await new Promise(r => setTimeout(r, wasOpen ? 300 : 0));     // the sheet's own transition; the globe resizes after it
    st.meshes.geo = bodiesFor(rows); positionMeshes();
    $('zoom-scale').textContent = TXT.C; writeStrip(true);   // frame against the strip at its largest (stop C wording, Sun line present)
    if (!buildPath()) { exit(); return say('Zoom-out view unavailable — this screen is too small to frame the scene. Nothing is drawn.', true); }
    st.s = 0; st.free = false; st.sunShown = false; place(at(0));
    attach(); loop(); writeText(); announce();
    say(`Zoom-out view open — computed positions at 00:00 UTC, ${nice(date)}.`);
    $('zoom-b').focus();
  }
  function exit() {
    if (!st.open) return;
    const g = ME.globe(), cam = g.camera(), c = g.controls(), sv = st.saved;
    detach(); cancelAnimationFrame(st.raf); st.raf = 0;
    g.scene().remove(st.meshes.moon); g.scene().remove(st.meshes.sun);
    for (const [o, v] of sv.layers) o.visible = v;
    cam.near = sv.near; cam.updateProjectionMatrix();
    c.minDistance = sv.minD; c.maxDistance = sv.maxD; c.enableZoom = sv.zoom; c.enablePan = sv.pan; c.enableDamping = sv.damp;
    c.target.copy(sv.target); cam.position.copy(sv.pos); c.update(); c.autoRotate = sv.auto;
    $('zoom-ui').hidden = true; document.body.classList.remove('sky-zoom'); $('zoom-svg').innerHTML = ''; $('tgl-zoom').textContent = 'Zoom out to the Moon and Sun';
    if (sv.sheetWasOpen && $('sheet').classList.contains('collapsed')) $('sheet-btn').click();
    st.open = false; st.saved = null; st.last = null; st.target = null;
    say('');
    const back = $('tgl-zoom'); if (back) back.focus();
  }

  // ---------- input: wheel / pinch drive the path; rotation makes the view free (then zoom is straight)
  const H = {};
  function attach() {
    const el = ME.globe().renderer().domElement, c = ME.globe().controls();
    H.wheel = e => { e.preventDefault(); step(e.deltaY > 0 ? 1 : -1, Math.min(1, Math.abs(e.deltaY) / 100)); };
    H.pts = new Map(); H.pinch0 = null;
    H.down = e => { H.pts.set(e.pointerId, [e.clientX, e.clientY]); if (H.pts.size === 2) H.pinch0 = dist2(); };
    H.move = e => { if (!H.pts.has(e.pointerId)) return; H.pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (H.pts.size === 2 && H.pinch0) { const d = dist2(), r = d / H.pinch0; if (Math.abs(Math.log(r)) > 0.02) { step(r < 1 ? 1 : -1, Math.min(1, Math.abs(Math.log(r)) * 2)); H.pinch0 = d; } } };
    H.up = e => { H.pts.delete(e.pointerId); if (H.pts.size < 2) H.pinch0 = null; };
    H.change = () => { if (st.target) c.target.set(st.target[0], st.target[1], st.target[2]);
      if (st.placing) return; if (H.pts.size === 2) return; if (!st.free && moved()) { st.free = true; announce(); } };
    H.key = e => { if (e.key === 'Escape' && st.open) { e.preventDefault(); exit(); } };
    el.addEventListener('wheel', H.wheel, { passive: false });
    el.addEventListener('pointerdown', H.down); el.addEventListener('pointermove', H.move);
    el.addEventListener('pointerup', H.up); el.addEventListener('pointercancel', H.up);
    c.addEventListener('change', H.change); document.addEventListener('keydown', H.key);
  }
  function detach() {
    const el = ME.globe().renderer().domElement, c = ME.globe().controls();
    el.removeEventListener('wheel', H.wheel); el.removeEventListener('pointerdown', H.down); el.removeEventListener('pointermove', H.move);
    el.removeEventListener('pointerup', H.up); el.removeEventListener('pointercancel', H.up);
    c.removeEventListener('change', H.change); document.removeEventListener('keydown', H.key);
  }
  const dist2 = () => { const [a, b] = [...H.pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  function moved() { const v = at(st.s), cam = ME.globe().camera(), p = V.add(v.t, V.mul(v.u, v.d));
    return Math.hypot(cam.position.x - p[0], cam.position.y - p[1], cam.position.z - p[2]) > 1e-6 * v.d + 1e-3; }
  function step(dir, k) {
    if (!st.open || !st.path) return;
    const STEP = 0.08 * k;
    if (st.free) {                                  // free orbit: zoom straight along the current view
      const g = ME.globe(), cam = g.camera(), t = g.controls().target, f = Math.exp(dir * STEP * 4);
      const off = V.mul([cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z], f);
      st.placing = true; cam.position.set(t.x + off[0], t.y + off[1], t.z + off[2]); g.controls().update(); st.placing = false; return;
    }
    st.placing = true; setS(st.s + dir * STEP, 'keep'); st.placing = false; announce();
  }
  function goStop(n) { if (!st.open || !st.path) return; st.placing = true; setS(n); st.placing = false; }

  // ---------- per-frame: near plane, overlay (lines, rings, tags), state for the text and tests
  function project(p) { const g = ME.globe(); const c = g.getScreenCoords; const R = st.meshes.geo.R;
    // world point -> lat/lng/alt for globe.gl's own projection
    const r = V.len(p); if (r < 1e-9) return g.getScreenCoords(0, 0, -1);
    const lat = Math.asin(p[1] / r) * 180 / Math.PI, lng = Math.atan2(p[0], p[2]) * 180 / Math.PI; return c(lat, lng, r / R - 1); }
  function nearRule() {
    const g = ME.globe(), cam = g.camera(), f = cam.getWorldDirection(cam.position.clone()), fv = [f.x, f.y, f.z], cp = [cam.position.x, cam.position.y, cam.position.z];
    const geo = st.meshes.geo, list = [{ pos: geo.earth.pos, r: geo.R * 1.2 }, geo.moon].concat(st.sunShown ? [geo.sun] : []);
    let m = Infinity; for (const b of list) { const z = V.dot(V.sub(b.pos, cp), fv) - b.r; if (z > 0) m = Math.min(m, z); }
    const near = Math.max(NEAR_MIN, isFinite(m) ? 0.2 * m : NEAR_MIN);
    if (Math.abs(near - cam.near) > 1e-9) { cam.near = near; cam.updateProjectionMatrix(); }
    return { near, minForwardDepth: m };
  }
  function overlaps(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  // tags: right, left, above, below of the ring — first placement overlapping no other tag or ring and inside the canvas
  function placeTags(items, W, Hh) {
    const tags = [], rings = items.map(it => ({ k: it.k, x: it.x - Math.max(6, it.rpx + 4), y: it.y - Math.max(6, it.rpx + 4), w: 2 * Math.max(6, it.rpx + 4), h: 2 * Math.max(6, it.rpx + 4) }));
    for (const it of items) { if (!it.inFrame) continue;
      const rr = Math.max(6, it.rpx + 4), opts = [[it.x + rr + 4, it.y - TAG.h / 2], [it.x - rr - 4 - TAG.w, it.y - TAG.h / 2], [it.x - TAG.w / 2, it.y - rr - 4 - TAG.h], [it.x - TAG.w / 2, it.y + rr + 4]];
      let pick = null;
      for (const [x, y] of opts) { const box = { k: it.k, x, y, w: TAG.w, h: TAG.h };
        if (x < 0 || y < 0 || x + TAG.w > W || y + TAG.h > Hh) continue;
        if (tags.some(t => overlaps(t, box)) || rings.some(r => r.k !== it.k && overlaps(r, box))) continue; pick = box; break; }
      tags.push(pick || { k: it.k, x: opts[0][0], y: opts[0][1], w: TAG.w, h: TAG.h, forced: true });
    }
    return { tags, rings };
  }
  function frame() {
    if (!st.open) return;
    const g = ME.globe(), cam = g.camera(), el = $('globe'), W = el.clientWidth, Hh = el.clientHeight, geo = st.meshes.geo;
    st.sunShown = st.free ? st.sunShown : st.s > 1;
    st.meshes.sun.visible = st.sunShown;
    const nr = nearRule();
    const cp = [cam.position.x, cam.position.y, cam.position.z];
    const items = [['earth', 'Earth'], ['moon', 'Moon']].concat(st.sunShown ? [['sun', 'Sun']] : []).map(([k, name]) => {
      const b = geo[k], s = project(b.pos), dist = V.len(V.sub(b.pos, cp));
      const rpx = b.r / dist / Math.tan(cam.fov * Math.PI / 360) * (Hh / 2);
      return { k, name, x: s.x, y: s.y, rpx, dist, inFrame: s.x >= 0 && s.x <= W && s.y >= 0 && s.y <= Hh };
    });
    // occlusion: is the line of sight to each body's centre blocked by another (nearer) body?
    for (const it of items) { it.occludedBy = null;
      for (const o of items) { if (o === it) continue; const b = geo[o.k], dir = V.norm(V.sub(geo[it.k].pos, cp)), w = V.sub(b.pos, cp), t = V.dot(w, dir);
        if (t > 0 && t < it.dist && V.len(V.sub(w, V.mul(dir, t))) < b.r) it.occludedBy = o.k; } }
    const { tags, rings } = placeTags(items, W, Hh);
    const c0 = items[0];
    let svg = '';
    for (const it of items.slice(1)) {
      svg += `<line class="zl" x1="${c0.x.toFixed(1)}" y1="${c0.y.toFixed(1)}" x2="${it.x.toFixed(1)}" y2="${it.y.toFixed(1)}"/>`;
      if (it.k === 'sun') { const dx = it.x - c0.x, dy = it.y - c0.y, L = Math.hypot(dx, dy) || 1; svg += `<line class="zl zd" x1="${it.x.toFixed(1)}" y1="${it.y.toFixed(1)}" x2="${(it.x + dx / L * 2000).toFixed(1)}" y2="${(it.y + dy / L * 2000).toFixed(1)}"/>`; }
    }
    for (const it of items) if (it.k !== 'earth' || st.s >= 0.5 || st.free) svg += `<circle class="zr zr-${it.k}" cx="${it.x.toFixed(1)}" cy="${it.y.toFixed(1)}" r="${Math.max(6, it.rpx + 4).toFixed(1)}"/>`;
    for (const t of tags) { const it = items.find(i => i.k === t.k); svg += `<text class="zt" x="${(t.x + 3).toFixed(1)}" y="${(t.y + 13).toFixed(1)}">${it.name}</text>`; }
    $('zoom-svg').innerHTML = svg;
    const strip = $('zoom-strip').getBoundingClientRect(), gr = el.getBoundingClientRect();
    st.last = { W, H: Hh, near: nr.near, minForwardDepth: nr.minForwardDepth, items, tags, rings,
      strip: { x: strip.left - gr.left, y: strip.top - gr.top, w: strip.width, h: strip.height },
      bar: (r => ({ x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height }))($('zoom-bar').getBoundingClientRect()),
      cam: cp, sunShown: st.sunShown, scale: $('zoom-scale').textContent };
  }
  function loop() { const f = () => { if (!st.open) return; frame(); st.raf = requestAnimationFrame(f); }; st.raf = requestAnimationFrame(f); }

  // ---------- words: scale line, strip, text equivalent, status line
  function scaleLine() { return st.sunShown || (!st.free && st.s > 1) ? TXT.C : TXT.B; }
  function announce() {
    if (!st.open) return;
    st.sunShown = st.free ? st.sunShown : st.s > 1;
    $('zoom-scale').textContent = scaleLine();
    const n = stopName(); for (const k of ['a', 'b', 'c']) $('zoom-' + k).setAttribute('aria-pressed', String(n === k.toUpperCase()));
    $('zoom-reframe').hidden = !st.free;
    writeStrip();
  }
  const km = v => Math.round(v).toLocaleString('en-GB') + ' km', mkm = v => (v / 1e6).toFixed(1) + ' million km';
  const deg = (v, p, n) => `${Math.abs(v).toFixed(2)}° ${v < 0 ? n : p}`;
  function writeStrip(forceSun) {
    const r = st.rows; if (!r) return;
    $('zoom-dist').innerHTML = `<span>Moon · ${esc(km(r.moon[3]))}</span>` + (st.sunShown || forceSun ? `<span>Sun · ${esc(mkm(r.sun[3]))}</span>` : '') + `<span class="zc">from Earth's centre</span>`;
    $('zoom-when').textContent = `00:00 UTC, ${nice(st.date)} · NASA/JPL Horizons · Layers are hidden in this view.`;
    $('zoom-img').textContent = ($('imgdate').textContent || '').split(' — ')[0].split(' (')[0];   // the Earth imagery keeps its own date, shown here while the view covers the usual line
  }
  function writeText() {
    const r = st.rows; if (!r) { $('zoom-text').innerHTML = ''; return; }
    $('zoom-text').innerHTML = `<p>Computed positions at 00:00 UTC, ${esc(nice(st.date))} (not observed).</p><ul>`
      + `<li>Moon: ${esc(km(r.moon[3]))} from Earth's centre. Calculated point directly beneath the Moon: ${esc(deg(r.moon[1], 'N', 'S'))}, ${esc(deg(r.moon[2], 'E', 'W'))}.</li>`
      + `<li>Sun: ${esc(mkm(r.sun[3]))} from Earth's centre. Calculated point directly beneath the Sun: ${esc(deg(r.sun[1], 'N', 'S'))}, ${esc(deg(r.sun[2], 'E', 'W'))}.</li></ul>`
      + `<p>${esc(TXT.C)}</p>`;
  }
  function say(t, bad) { st.msg = t; const o = $('o-zoom'); if (!o) return; o.textContent = t; o.classList.toggle('bad', !!bad); }

  // ---------- rollover while open: one update; a date without a row → no-position state, never a mix
  function rollover() {
    if (!st.open) return;
    const d = utcToday(); if (d === st.date) return;
    const rows = rowsFor(d);
    st.date = d; st.rows = rows;
    if (!rows) { st.meshes.moon.visible = st.meshes.sun.visible = false; cancelAnimationFrame(st.raf); st.raf = 0; $('zoom-svg').innerHTML = '';
      $('zoom-dist').innerHTML = ''; $('zoom-when').textContent = `No computed position for today (${nice(d)}).`; $('zoom-text').innerHTML = `<p>No computed position for today (${esc(nice(d))}).</p>`; return; }
    st.meshes.moon.visible = true; st.meshes.geo = bodiesFor(rows); positionMeshes(); $('zoom-scale').textContent = TXT.C; writeStrip(true); buildPath(); st.placing = true; setS(st.s); st.placing = false;
    writeText(); writeStrip(); if (!st.raf) loop();
  }

  // ---------- wiring
  $('tgl-zoom').addEventListener('click', () => (st.open ? exit() : enter()));
  $('zoom-back').addEventListener('click', exit);
  $('zoom-a').addEventListener('click', () => goStop(0));
  $('zoom-b').addEventListener('click', () => goStop(1));
  $('zoom-c').addEventListener('click', () => goStop(2));
  $('zoom-reframe').addEventListener('click', () => goStop(Math.round(st.s)));
  setInterval(rollover, ME.REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') rollover(); });

  // read-only aids for tests and the console
  ME.zoomState = () => ({ open: st.open, status: st.status, msg: st.msg, rev: REV, date: st.date, s: st.s, stop: stopName(), free: st.free,
    sunShown: st.sunShown, rows: st.rows, geo: st.meshes && st.meshes.geo ? { moon: st.meshes.geo.moon.pos, sun: st.meshes.geo.sun.pos, R: st.meshes.geo.R } : null,
    meshWorld: st.meshes && st.open ? { moon: st.meshes.moon.position.toArray(), sun: st.meshes.sun.position.toArray() } : null,
    path: st.path, last: st.last });
  ME.zoomPlaceTags = placeTags; ME.zoomStep = step; ME.zoomGo = goStop; ME.zoomRollover = rollover; ME.zoomFrame = frame;
})();
