/* Mother Earth — Tides explorer (tides.html). TIDES-EXPLORER-PROPOSAL rev 2; Chad's go for a branch build, 25 Nov 2026.
 * A mechanism view: it draws tides-model.js (an idealised equilibrium tide). No hub, no feed, no clock, no date, no timer.
 *
 * WHAT IS DRAWN
 *   One globe.gl scene (the library is loaded here with a 12 s limit, as on the Moon and Sun pages). Earth is the library's
 *   globe; the Moon, the Sun, the model surface, the reference circle and the orbit ring are added to the same scene with
 *   constructors taken from the library's own globe mesh (the bundle exposes no THREE global).
 *   Scene axes: +y north, +x = Earth longitude 90°E, +z = longitude 0°. One Earth radius = 100 units.
 *   Sun direction (−1, 0, 0), fixed. Moon direction (−cos θ, 0, sin θ). Drawn distances and the Sun's size are NOT to scale
 *   and are never used in the calculation; the Moon's size against Earth's is to scale.
 *   LIGHT: the Sun is self-lit (unlit material, its picture at full brightness). Earth and the Moon are lit by ONE directional
 *   light (parallel rays) from the Sun direction plus an ambient floor. Never a point light at the Sun's drawn position.
 *   MODEL SURFACE: a sphere mesh whose vertices are moved on the CPU by TidesModel.radius(); same constants in every mode.
 * IMAGES are dated reference pictures held in assets/ (never live). Each body falls back on its own to a plain, named
 *   sphere; the model and every control keep working without any picture, and without WebGL (the cross-section is the view).
 * RENDERING: the library's loop runs only while something moves (play, a drag, a camera move, a late picture, a resize)
 *   and is paused again shortly after. window.TIDES.renders() counts frames for the tests.
 * INPUT: slider, Moon handle (pointer + arrow keys), four presets, three modes, Play/Pause, Overhead/Angled, Reset.
 *   Dragging the camera never changes the angle; dragging the Moon never moves the camera or scrolls the page.
 *   The wheel is never captured: it always scrolls the page (no zoom in this slice). */
(() => {
  'use strict';
  const M = window.TidesModel, $ = id => document.getElementById(id);
  const el = $('td-scene'), box = $('td-box'); if (!M || !el) return;
  const LIB = 'https://unpkg.com/globe.gl@2.45.0/dist/globe.gl.min.js', LIB_WAIT_MS = 12000, IMG_WAIT_MS = 20000;
  const IMG = { earth: 'assets/tides/earth-2026-06-22.jpg?v=1', moon: 'assets/moon/lroc_color_2k.jpg?v=1', sun: 'assets/tides/sun-2026-11-25.jpg?v=1' };
  const R = 100, MOON_D = 230, MOON_R = 27.3, SUN_D = 400, SUN_R = 60, SUN_B0 = 1.6053;   // SUN_B0: the reference picture's own tilt (assets/tides/SOURCE.json)
  const FRAME = { cx: -100, halfX: 395, halfZ: 290 };   // what Overhead must show: Sun (left) to the far side of the Moon's ring
  const EDGE_N = 360, CYCLE_MS = 24000, DEG = Math.PI / 180, INITIAL = Object.freeze({ deg: 0, mode: 'both', playing: false, view: 'overhead' });
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const st = { deg: INITIAL.deg, mode: INITIAL.mode, playing: false, view: INITIAL.view, dragging: false, orbiting: false, three: 'starting', why: '',
    images: { earth: 'loading', moon: 'loading', sun: 'loading' }, renders: 0, activeUntil: 0, loop: 0, lastT: 0 };
  let globe = null, H = null, bodies = null, shell = null;

  // ---------- menu (same behaviour as the other pages; this page has no clock on purpose: nothing here is timed)
  (() => {
    const btn = $('menu-btn'), list = $('menu-list'); if (!btn || !list) return;
    const items = [...list.querySelectorAll('a')];
    const open = o => { list.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) items[0].focus(); };
    btn.addEventListener('click', ev => { ev.stopPropagation(); open(!list.classList.contains('open')); });
    btn.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown') { ev.preventDefault(); open(true); } });
    list.addEventListener('keydown', ev => { const i = items.indexOf(document.activeElement);
      if (ev.key === 'Escape') { ev.stopPropagation(); open(false); btn.focus(); }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); } });
    document.addEventListener('click', ev => { if (!list.contains(ev.target) && ev.target !== btn) open(false); });
  })();

  // ---------- words
  const MODE_WORDS = { both: 'Moon and Sun together', moon: 'Moon only', sun: 'Sun only' };
  const round1 = d => Math.round(M.norm(d) * 10) / 10;
  const degText = d => { const r = round1(d); return (r === 360 ? 0 : r) + '°'; };
  const share = () => Math.round(M.inPlane(st.deg, st.mode).range / M.SPRING_RANGE * 100);
  /** The explanation for the current state. Exact geometry ("in line", "at right angles", "largest", "smallest") is claimed
   *  only within M.PRESET_TOL of the preset angle, the same limit that names the phase; nearby angles get "close to" wording
   *  with the actual share; elsewhere the general sentence. */
  const NEAR = 15;
  function explain() {
    const a = M.norm(st.deg), offAlign = M.offFrom(a, [0, 180]), offQuarter = M.offFrom(a, [90, 270]), pct = share() + '%';
    const nearest = list => list.reduce((b, d) => M.offFrom(a, [d]) < M.offFrom(a, [b]) ? d : b);
    const name = d => ({ 0: 'new Moon', 90: 'first quarter', 180: 'full Moon', 270: 'last quarter' })[d];
    if (st.mode === 'moon') return 'Moon only. The Moon pulls harder on the near side of Earth than on Earth’s centre, and harder on the centre than on the far side. Measured against the centre, both sides are stretched away from it, so the model surface rises on two opposite sides and dips in a band between them.';
    if (st.mode === 'sun') return 'Sun only. The Sun does the same thing along its own line, at about 46% of the Moon’s strength in this model. Its total pull on Earth is far larger than the Moon’s; what makes tides is how much that pull differs from one side of Earth to the other, and the Sun is much farther away.';
    if (offAlign <= M.PRESET_TOL) return 'Moon and Sun in line (' + name(nearest([0, 180])) + '). The two stretches lie along the same line and add up: the largest difference between the model’s high and low. These are called spring tides. The name has nothing to do with the season, and new and full Moon give the same shape.';
    if (offQuarter <= M.PRESET_TOL) return 'Moon and Sun at right angles (' + name(nearest([90, 270])) + '). The Sun’s stretch lies across the Moon’s and partly fills in its dips: the smallest difference between high and low, called neap tides. It does not vanish, and the surface does not become a sphere.';
    if (offAlign <= NEAR) return 'Close to ' + name(nearest([0, 180])) + ', ' + Math.round(offAlign) + '° from being in line. The two stretches nearly line up, so the difference between the model’s high and low is close to its largest: ' + pct + ' of it. It is largest exactly at new and full Moon (spring tides).';
    if (offQuarter <= NEAR) return 'Close to ' + name(nearest([90, 270])) + ', ' + Math.round(offQuarter) + '° from a right angle. The Sun’s stretch lies nearly across the Moon’s, so the difference between high and low is close to its smallest: ' + pct + ' of the largest. It is smallest exactly at the quarter Moons (neap tides), and never zero.';
    return 'Between the two. As the Moon moves round, the Sun’s smaller stretch turns from adding to the Moon’s to working across it, and the combined shape changes smoothly. Difference between high and low now: ' + pct + ' of the largest.';
  }
  function statusLine() { return 'Moon at ' + degText(st.deg) + ', ' + M.phaseName(st.deg) + '. ' + MODE_WORDS[st.mode] + '. Difference between the model’s high and low in the orbit plane: ' + share() + '% of its largest.'; }

  // ---------- one paint of everything that is not WebGL (runs on every change, including play frames; nothing here is a live region)
  const slider = $('td-slider'), xsec = $('td-xsec'), cyc = $('td-cycle'), readout = $('td-readout'), expl = $('td-explain'), live = $('td-status');
  function paintDom() {
    const r = round1(st.deg);
    const sv = String(Math.round(M.norm(st.deg)) % 360); if (slider.value !== sv) slider.value = sv;
    slider.setAttribute('aria-valuetext', degText(st.deg) + ', ' + M.phaseName(st.deg));
    xsec.innerHTML = M.xsec(st.deg, st.mode);
    xsec.dataset.deg = String(M.norm(st.deg)); xsec.dataset.mode = st.mode;
    cyc.textContent = 'Illustrative cycle: ' + Math.floor(M.norm(st.deg) / 360 * 100) + '%';
    readout.textContent = 'Moon at ' + (r === 360 ? 0 : r) + '° from the Sun’s direction · ' + M.phaseName(st.deg) + ' · high-to-low difference ' + share() + '% of the model’s largest';
    const t = explain(); if (expl.textContent !== t) expl.textContent = t;
    document.querySelectorAll('input[name="td-mode"]').forEach(i => { i.checked = i.value === st.mode; });
    document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(M.norm(st.deg) - Number(b.dataset.preset)) < 1e-9)));
    const pb = $('td-play'); pb.textContent = st.playing ? 'Pause' : 'Play'; pb.setAttribute('aria-pressed', String(st.playing));
    $('td-view-over').setAttribute('aria-pressed', String(st.view === 'overhead')); $('td-view-ang').setAttribute('aria-pressed', String(st.view === 'angled'));
    box.dataset.deg = String(M.norm(st.deg)); box.dataset.mode = st.mode; box.dataset.playing = String(st.playing); box.dataset.view = st.view;
  }
  let sayT = 0;
  /** The polite status line: only when a change has ENDED (never per frame). */
  function say() { clearTimeout(sayT); sayT = setTimeout(() => { live.textContent = statusLine(); }, 250); }

  // ---------- state changes: every input goes through these
  function setDeg(deg, how) {
    st.deg = M.norm(deg);
    if (how !== 'play' && st.playing) { st.playing = false; }
    paintDom(); paintScene(); if (how !== 'play') kick(how === 'drag' || how === 'slider' ? 250 : 500);
  }
  function setMode(mode) { if (!M.MODES.includes(mode)) return; st.mode = mode; paintDom(); paintScene(); kick(400); say(); }
  function play(on) {
    st.playing = !!on; st.lastT = 0; paintDom();
    if (st.playing) { kick(0); } else { kick(300); say(); }
  }
  function reset() {
    st.playing = false; st.deg = INITIAL.deg; st.mode = INITIAL.mode; paintDom(); paintScene(); setView(INITIAL.view, 0); say();
  }

  // ---------- controls
  slider.addEventListener('input', () => setDeg(Number(slider.value), 'slider'));
  slider.addEventListener('change', say);
  document.querySelectorAll('input[name="td-mode"]').forEach(i => i.addEventListener('change', () => { if (i.checked) setMode(i.value); }));
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { st.playing = false; setDeg(Number(b.dataset.preset), 'preset'); say(); }));
  $('td-play').addEventListener('click', () => play(!st.playing));
  $('td-view-over').addEventListener('click', () => setView('overhead'));
  $('td-view-ang').addEventListener('click', () => setView('angled'));
  $('td-reset').addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) { st.playing = false; paintDom(); stopLoop(); } });   // pause when hidden; it stays paused on return

  // ---------- the loop: runs only while something moves
  function kick(ms) {
    st.activeUntil = Math.max(st.activeUntil, performance.now() + (ms || 0));
    if (globe && globe.resumeAnimation) globe.resumeAnimation();
    if (!st.loop) st.loop = requestAnimationFrame(frame);
  }
  function stopLoop() { if (st.loop) cancelAnimationFrame(st.loop); st.loop = 0; st.activeUntil = 0; if (globe && globe.pauseAnimation) globe.pauseAnimation(); }
  function frame(t) {
    st.loop = 0;
    if (st.playing) { if (st.lastT) setDeg(st.deg + (t - st.lastT) / CYCLE_MS * 360, 'play'); st.lastT = t; }
    placeTags();
    if (st.playing || st.dragging || st.orbiting || performance.now() < st.activeUntil) st.loop = requestAnimationFrame(frame);
    else { if (globe && globe.pauseAnimation) globe.pauseAnimation(); placeTags(); }
  }

  // ---------- 3-D scene
  const state3 = $('td-3d'), handle = $('td-handle'), tags = { earth: $('td-tag-earth'), sun: $('td-tag-sun') };
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };
  function no3d(why) {
    if (st.three === 'none') return; st.three = 'none'; st.why = why; globe = null;
    el.hidden = true; handle.hidden = true; Object.values(tags).forEach(t => { t.hidden = true; });
    box.dataset.three = 'none'; $('td-view-ctl').hidden = true;
    state3.textContent = why + ' The cross-section below is the same model and every control still works.';
  }
  function imageNote() {
    const w = { earth: 'Earth', moon: 'Moon', sun: 'Sun' }, bad = Object.keys(st.images).filter(k => st.images[k] === 'failed');
    box.dataset.images = Object.keys(st.images).map(k => k + ':' + st.images[k]).join(' ');
    if (st.three !== 'ok') return;
    state3.textContent = bad.length ? bad.map(k => w[k]).join(' and ') + (bad.length > 1 ? ' pictures' : ' picture') + ' unavailable: drawn as ' + (bad.length > 1 ? 'plain spheres' : 'a plain sphere') + '. The model is not affected.' : 'Drag the Moon to move it; drag the space around it to look from another side. The Sun’s grey half is outside its picture’s view, not shadow.';
    tags.earth.textContent = st.images.earth === 'failed' ? 'Earth (image unavailable)' : 'Earth';
    tags.sun.textContent = st.images.sun === 'failed' ? 'Sun (image unavailable)' : 'Sun';
    handle.querySelector('span').textContent = st.images.moon === 'failed' ? 'Moon (image unavailable)' : 'Moon';
  }

  function harvest() {
    const gm = globe.globeMaterial(); let gmesh = null;
    globe.scene().traverse(o => { if (o.isMesh && (Array.isArray(o.material) ? o.material[0] : o.material) === gm) gmesh = o; });
    if (!gmesh || !gm.map) return null;
    const Sphere = gmesh.geometry.constructor, Geo = Object.getPrototypeOf(Sphere), Attr = gmesh.geometry.attributes.position.constructor;
    return { gmesh, gm, Mesh: gmesh.constructor, Sphere, Geo, Attr, Mat: gm.constructor, Tex: gm.map.constructor, V3: globe.camera().position.constructor, space: gm.map.colorSpace };
  }
  const flat = (hex, opacity) => { const m = new H.Mat({ color: 0x000000, specular: 0x000000, shininess: 0, side: 2 }); m.emissive.setHex(hex); if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; } return m; };
  /** A flat ring in the orbit plane (y = 0), radius r, width w. */
  function ring(r, w, hex, opacity) {
    const N = 256, p = new Float32Array((N + 1) * 6), idx = [];
    for (let i = 0; i <= N; i++) { const a = i / N * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a); p.set([c * (r - w / 2), 0, s * (r - w / 2), c * (r + w / 2), 0, s * (r + w / 2)], i * 6); if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const g = new H.Geo(); g.setAttribute('position', new H.Attr(p, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new H.Mesh(g, flat(hex, opacity)); m.__tides = 'ring'; return m;
  }
  function texture(img) { const t = new H.Tex(img); if (H.space !== undefined) t.colorSpace = H.space; t.needsUpdate = true; return t; }
  function loadImage(key, apply) {
    const img = new Image(); let done = false;
    const end = ok => { if (done) return; done = true; clearTimeout(timer); st.images[key] = ok ? 'ok' : 'failed'; if (ok && globe) { try { apply(texture(img)); } catch (e) { st.images[key] = 'failed'; st.imgErr = String(e && e.message || e); } } imageNote(); kick(400); };
    const timer = setTimeout(() => end(false), IMG_WAIT_MS);
    img.onload = () => end(true); img.onerror = () => end(false); img.src = IMG[key];
  }

  function build() {
    H = harvest(); if (!H) return false;
    const sc = globe.scene();
    // light: ambient floor + one directional light from the Sun direction (parallel rays), placed in the scene, not on the camera
    const ls = globe.lights(), amb = ls.find(l => l.isAmbientLight), dir = ls.find(l => l.isDirectionalLight);
    if (amb) { amb.color.set(0xffffff); amb.intensity = 0.42 * Math.PI; }
    if (dir) { dir.color.set(0xffffff); dir.intensity = 0.95 * Math.PI; if (dir.parent !== sc) sc.add(dir); dir.position.set(M.U_SUN[0] * 1000, M.U_SUN[1] * 1000, M.U_SUN[2] * 1000); if (dir.target) dir.target.position.set(0, 0, 0); }
    H.gm.shininess = 0; if (H.gm.specular) H.gm.specular.set(0x000000);
    // Moon: lit by the same light. Sun: unlit (black diffuse, its picture as emissive), so it has no day or night side.
    const moon = new H.Mesh(new H.Sphere(MOON_R, 48, 24), new H.Mat({ color: 0x8f8f8f, specular: 0x000000, shininess: 0 }));
    const sunMat = new H.Mat({ color: 0x000000, specular: 0x000000, shininess: 0 }); sunMat.emissive.setHex(0xf2c35a);
    const sun = new H.Mesh(new H.Sphere(SUN_R, 48, 24), sunMat);
    sun.position.set(M.U_SUN[0] * SUN_D, 0, M.U_SUN[2] * SUN_D);
    // the picture's sub-Earth point (heliographic latitude B0, longitude 0) is the mesh's (cos B0, sin B0, 0): tilt it down to +x, then turn +x toward Earth
    sun.rotation.order = 'YZX'; sun.rotation.set(0, Math.atan2(-(-M.U_SUN[2]), -M.U_SUN[0]), -SUN_B0 * DEG);
    moon.__tides = 'moon'; sun.__tides = 'sun';
    // model surface
    const geo = new H.Sphere(1, 96, 48), pos = geo.attributes.position, base = new Float32Array(pos.array.length);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), l = Math.hypot(x, y, z) || 1; base[i * 3] = x / l; base[i * 3 + 1] = y / l; base[i * 3 + 2] = z / l; }
    const sm = new H.Mat({ color: 0x53cfe6, specular: 0x000000, shininess: 0, transparent: true, opacity: 0.4, depthWrite: false }); sm.emissive.setHex(0x14606f);
    const mesh = new H.Mesh(geo, sm); mesh.__tides = 'surface'; mesh.renderOrder = 3;
    const ep = new Float32Array((EDGE_N + 1) * 6), ei = []; for (let i = 0; i < EDGE_N; i++) ei.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const eg = new H.Geo(), eattr = new H.Attr(ep, 3); eg.setAttribute('position', eattr); eg.setIndex(ei);
    const edge = new H.Mesh(eg, flat(0x7fe6f7, 1)); edge.__tides = 'edge'; edge.renderOrder = 5;
    shell = { mesh, geo, pos, base, edge: { mesh: edge, geo: eg, attr: eattr } };
    const ref = ring(M.BASE * R, 0.9, 0xe8eef6, 0.75), orbit = ring(MOON_D, 0.8, 0x7f8da3, 0.55); ref.renderOrder = 4;
    [moon, sun, mesh, edge, ref, orbit].forEach(o => sc.add(o));
    bodies = { moon, sun, ref, orbit, amb, dir };
    loadImage('earth', t => { H.gm.map = t; if (H.gm.color) H.gm.color.set(0xffffff); H.gm.needsUpdate = true; });
    loadImage('moon', t => { moon.material.map = t; if (moon.material.color) moon.material.color.set(0xffffff); moon.material.needsUpdate = true; });
    loadImage('sun', t => { sunMat.emissiveMap = t; sunMat.emissive.setHex(0xffffff); sunMat.needsUpdate = true; });
    return true;
  }

  /** Move the Moon and rebuild the model surface for the current angle and mode. */
  function paintScene() {
    if (!bodies) return;
    const u = M.uMoon(st.deg), m = bodies.moon;
    m.position.set(u[0] * MOON_D, 0, u[2] * MOON_D);
    m.rotation.y = Math.atan2(u[2], -u[0]);   // the map's longitude 0 (the near side) is the mesh's +x: keep it facing Earth
    const a = shell.pos.array, b = shell.base;
    for (let i = 0; i < a.length; i += 3) { const n = [b[i], b[i + 1], b[i + 2]], r = M.radius(n, st.deg, st.mode) * R; a[i] = n[0] * r; a[i + 1] = n[1] * r; a[i + 2] = n[2] * r; }
    shell.pos.needsUpdate = true; shell.geo.computeVertexNormals(); shell.geo.computeBoundingSphere(); shell.geo.computeBoundingBox();
    const ea = shell.edge.attr.array, w = 0.7;   // the surface's edge in the orbit plane: the same line as the cross-section
    for (let i = 0; i <= EDGE_N; i++) { const n = M.planeDir(i / EDGE_N * 360), r = M.radius(n, st.deg, st.mode) * R; ea.set([n[0] * (r - w), 0.4, n[2] * (r - w), n[0] * (r + w), 0.4, n[2] * (r + w)], i * 6); }
    shell.edge.attr.needsUpdate = true; shell.edge.geo.computeBoundingSphere();
    placeTags();
  }

  // ---------- camera: two presets, bounded orbit, never a zoom
  function fitDistance() {
    const cam = globe.camera(), t = Math.tan(cam.fov * DEG / 2), W = el.clientWidth || 1, Hh = el.clientHeight || 1;
    return Math.max((FRAME.halfX + 30) / (t * W / Hh), (FRAME.halfZ + 30) / t);
  }
  function applyOffset() {   // Earth stays the centre the camera turns about; the picture is shifted so the Sun-to-Moon span is centred in the box
    const cam = globe.camera(), W = el.clientWidth || 1, Hh = el.clientHeight || 1, D = fitDistance(), pxPerUnit = (Hh / 2) / (D * Math.tan(cam.fov * DEG / 2));
    cam.setViewOffset(W, Hh, FRAME.cx * pxPerUnit, 0, W, Hh); cam.updateProjectionMatrix();
  }
  function setView(view, ms) {
    st.view = view === 'angled' ? 'angled' : 'overhead'; paintDom();
    if (!globe) return;
    const D = fitDistance() * (st.view === 'angled' ? 1.12 : 1), dur = ms === undefined ? (reduced() ? 0 : 600) : ms;
    applyOffset();
    globe.pointOfView({ lat: st.view === 'angled' ? 38 : 89.4, lng: 0, altitude: D / R - 1 }, dur);
    kick(dur + 500);
  }

  // ---------- tags and the Moon handle follow their bodies on screen
  function screen(x, y, z) {
    const cam = globe.camera(), v = new H.V3(x, y, z).project(cam), W = el.clientWidth, Hh = el.clientHeight;
    return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * Hh, front: v.z < 1 };
  }
  /** Labels never sit on another body: Earth's label goes on the side of Earth away from the Moon (as seen on screen), the
   *  Moon's label on the side of the Moon away from Earth, each just outside the body's drawn size. The Sun's label sits above
   *  the Sun. Recomputed on every camera or Moon change. */
  const unit2 = (x, y, fx, fy) => { const l = Math.hypot(x, y); return l > 1e-6 ? [x / l, y / l] : [fx, fy]; };
  function placeTags() {
    if (!globe || !bodies || st.three !== 'ok') return;
    const E = screen(0, 0, 0), mp = bodies.moon.position, Mo = screen(mp.x, mp.y, mp.z), sp = bodies.sun.position, S = screen(sp.x, sp.y, sp.z);
    // on-screen radii: Earth's model surface (largest drawn radius) and the Moon
    const far = 1.33 * R, rE = Math.max(...[[far, 0, 0], [-far, 0, 0], [0, 0, far], [0, 0, -far], [0, far, 0], [0, -far, 0]].map(p => { const q = screen(...p); return Math.hypot(q.x - E.x, q.y - E.y); }));
    const rM = Math.max(24, ...[[MOON_R, 0, 0], [0, MOON_R, 0], [0, 0, MOON_R]].map(p => { const q = screen(mp.x + p[0], mp.y + p[1], mp.z + p[2]); return Math.hypot(q.x - Mo.x, q.y - Mo.y); }));
    const rS = Math.max(...[[SUN_R, 0, 0], [0, SUN_R, 0], [0, 0, SUN_R]].map(p => { const q = screen(sp.x + p[0], sp.y + p[1], sp.z + p[2]); return Math.hypot(q.x - S.x, q.y - S.y); }));
    const rectAt = (node, c, dir, r, gap) => {   // label box just outside a circle of radius r around c, in direction dir
      const w = node.offsetWidth, h = node.offsetHeight, d = r + gap + Math.abs(dir[0]) * w / 2 + Math.abs(dir[1]) * h / 2;
      const x = c.x + dir[0] * d - w / 2, y = c.y + dir[1] * d - h / 2; return { x, y, l: x, t: y, r: x + w, b: y + h };
    };
    const circles = { E: [E, rE], M: [Mo, rM], S: [S, rS] }, placed = [];
    const cost = (q, own) => {   // overlap of a candidate box with the other bodies and the labels already placed (0 = clear)
      let c = 0;
      for (const k in circles) { if (k === own) continue; const [p, r] = circles[k], x = Math.max(q.l, Math.min(p.x, q.r)), y = Math.max(q.t, Math.min(p.y, q.b)), dd = Math.hypot(x - p.x, y - p.y); if (dd < r) c += r - dd; }
      for (const o of placed) { const ox = Math.min(q.r, o.r) - Math.max(q.l, o.l), oy = Math.min(q.b, o.b) - Math.max(q.t, o.t); if (ox > 0 && oy > 0) c += ox * oy / 10; }
      return c;
    };
    const choose = (node, own, c, r, gap, dirs) => { let best = null;   // nearest clear spot; if none is clear (the camera low, one body in front of another), step outward
      for (const extra of [0, 30, 60, 100, 150]) { for (const d of dirs) { const q = rectAt(node, c, d, r, gap + extra), k = cost(q, own) + extra / 1000; if (!best || k < best.k - 1e-9) best = { q, k }; if (k === extra / 1000) break; } if (best.k === extra / 1000) break; }
      placed.push(best.q); return best.q; };
    const away = unit2(E.x - Mo.x, E.y - Mo.y, 0, 1), out = unit2(Mo.x - E.x, Mo.y - E.y, 0, -1), perp = [-out[1], out[0]];
    const AX = [[0, -1], [0, 1], [-1, 0], [1, 0]], DG = [[0.7071, -0.7071], [-0.7071, -0.7071], [0.7071, 0.7071], [-0.7071, 0.7071]];
    st.tagGeom = { E: [E.x, E.y], rE, M: [Mo.x, Mo.y], rM, S: [S.x, S.y], rS };
    const ps = choose(tags.sun, 'S', S, rS, 6, [[0, -1], [0, 1], ...DG]);
    const pe = choose(tags.earth, 'E', E, rE, 8, [away, ...AX, ...DG]);
    const lbl = handle.querySelector('span'), pm = choose(lbl, 'M', Mo, rM, 4, [out, perp, [-perp[0], -perp[1]], ...AX, ...DG]);
    tags.earth.style.transform = 'translate(' + pe.x.toFixed(1) + 'px,' + pe.y.toFixed(1) + 'px)'; tags.earth.style.visibility = E.front ? 'visible' : 'hidden';
    tags.sun.style.transform = 'translate(' + ps.x.toFixed(1) + 'px,' + ps.y.toFixed(1) + 'px)'; tags.sun.style.visibility = S.front ? 'visible' : 'hidden';
    handle.style.transform = 'translate(' + (Mo.x - 24).toFixed(1) + 'px,' + (Mo.y - 24).toFixed(1) + 'px)'; handle.style.visibility = Mo.front ? 'visible' : 'hidden';
    lbl.style.transform = 'translate(' + (pm.x - (Mo.x - 24)).toFixed(1) + 'px,' + (pm.y - (Mo.y - 24)).toFixed(1) + 'px)';
  }

  // ---------- Moon handle: pointer drag in the orbit plane, and arrow keys
  function angleAt(clientX, clientY) {
    const r = el.getBoundingClientRect(), cam = globe.camera();
    const p = new H.V3((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(cam), o = cam.position;
    const dy = p.y - o.y; if (Math.abs(dy) < 1e-9) return null;
    const k = -o.y / dy; if (!(k > 0)) return null;   // the pointer's ray does not meet the orbit plane in front of the camera
    const x = o.x + (p.x - o.x) * k, z = o.z + (p.z - o.z) * k; if (Math.hypot(x, z) < 1) return null;
    return M.norm(Math.atan2(z, -x) / DEG);
  }
  let dragId = null;
  const endDrag = () => { if (dragId === null) return; dragId = null; st.dragging = false; handle.classList.remove('drag'); if (globe) globe.controls().enabled = true; kick(300); say(); };
  handle.addEventListener('pointerdown', ev => {
    if (!globe || ev.button > 0) return;
    ev.preventDefault(); ev.stopPropagation(); dragId = ev.pointerId; st.dragging = true; st.playing = false; handle.classList.add('drag');
    globe.controls().enabled = false; try { handle.setPointerCapture(ev.pointerId); } catch (e) { }
    handle.focus({ preventScroll: true }); paintDom(); kick(0);
  });
  handle.addEventListener('pointermove', ev => { if (ev.pointerId !== dragId) return; ev.preventDefault(); const a = angleAt(ev.clientX, ev.clientY); if (a !== null) setDeg(a, 'drag'); });
  handle.addEventListener('pointerup', ev => { if (ev.pointerId === dragId) endDrag(); });
  handle.addEventListener('pointercancel', ev => { if (ev.pointerId === dragId) endDrag(); });   // a cancelled pointer leaves the last angle, which is always a valid state
  handle.addEventListener('lostpointercapture', ev => { if (ev.target === handle && ev.pointerId === dragId) endDrag(); });
  handle.addEventListener('keydown', ev => {
    const step = ev.shiftKey ? 10 : 1; let d = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') d = st.deg + step; else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') d = st.deg - step; else if (ev.key === 'Home') d = 0;
    if (d === null) return; ev.preventDefault(); setDeg(Math.round(M.norm(d)), 'key'); say();
  });

  // ---------- start
  function start3d() {
    if (!webgl()) return no3d('This browser or device has no WebGL, which the 3-D scene needs.');
    const lib = document.createElement('script'); lib.src = LIB; lib.async = true;
    const timer = setTimeout(() => no3d('The 3-D library did not arrive within ' + LIB_WAIT_MS / 1000 + ' seconds.'), LIB_WAIT_MS);
    lib.onerror = () => { clearTimeout(timer); no3d('The 3-D library did not load (blocked, or no network when the page opened).'); };
    lib.onload = async () => {
      clearTimeout(timer); if (st.three === 'none') return;
      if (typeof Globe === 'undefined') return no3d('The 3-D library did not load.');
      try {
        const c = document.createElement('canvas'); c.width = 2; c.height = 1; const g = c.getContext('2d'); g.fillStyle = '#2b4a63'; g.fillRect(0, 0, 2, 1);   // a plain Earth until (or without) its picture
        globe = Globe()(el).width(el.clientWidth).height(el.clientHeight).globeImageUrl(c.toDataURL('image/png')).backgroundColor('rgba(0,0,0,0)').showAtmosphere(false);
        const rr = globe.renderer(), orig = rr.render.bind(rr); rr.render = (...a) => { st.renders++; return orig(...a); };
        const cam = globe.camera(); cam.fov = 32; cam.updateProjectionMatrix();
        const ct = globe.controls(); ct.autoRotate = false; ct.enablePan = false; ct.enableZoom = false; ct.minPolarAngle = 0.01; ct.maxPolarAngle = 78 * DEG;
        // the camera controls set touch-action:none on their element, which would trap a vertical swipe on a phone: let the
        // browser keep vertical panning (page scroll); a sideways drag still turns the camera
        if (ct.domElement && ct.domElement.style) ct.domElement.style.touchAction = 'pan-y';
        ct.addEventListener('start', () => { st.orbiting = true; kick(0); });
        ct.addEventListener('end', () => { st.orbiting = false; kick(900); });
        ct.addEventListener('change', placeTags);
        let ok = false; for (let i = 0; i < 60 && !ok; i++) { ok = build(); if (!ok) await new Promise(r => setTimeout(r, 100)); }   // the globe mesh and its first texture appear once the library has finished building
        if (!ok) { el.innerHTML = ''; return no3d('The 3-D scene could not be built on this device.'); }
        st.three = 'ok'; box.dataset.three = 'ok'; handle.hidden = false; Object.values(tags).forEach(t => { t.hidden = false; });
        imageNote(); paintScene(); setView(st.view, 0);
        new ResizeObserver(() => { if (!globe) return; globe.width(el.clientWidth).height(el.clientHeight); setView(st.view, 0); }).observe(el);
      } catch (e) { globe = null; no3d('The 3-D scene could not start on this device.'); }
    };
    document.head.appendChild(lib);
  }

  window.TIDES = {
    state: () => ({ deg: st.deg, mode: st.mode, playing: st.playing, view: st.view, three: st.three, why: st.why, imgErr: st.imgErr, images: Object.assign({}, st.images), dragging: st.dragging, orbiting: st.orbiting, looping: !!st.loop }),
    renders: () => st.renders, initial: INITIAL, tagGeom: () => st.tagGeom || null,
    camera: () => globe ? { pos: globe.camera().position.toArray(), pov: globe.pointOfView() } : null,
    surface: () => shell ? { positions: Array.from(shell.pos.array), base: Array.from(shell.base), bounds: shell.geo.boundingSphere && shell.geo.boundingSphere.radius, normals: Array.from(shell.geo.attributes.normal.array) } : null,
    bodies: () => bodies ? { moon: bodies.moon.position.toArray(), moonRotY: bodies.moon.rotation.y, sun: bodies.sun.position.toArray(), light: bodies.dir ? bodies.dir.position.toArray() : null, lightParent: bodies.dir && bodies.dir.parent === globe.scene(), lightType: bodies.dir && bodies.dir.type, sunLit: bodies.sun.material.color.getHex() !== 0 } : null,
    screenOf: (x, y, z) => globe && H ? screen(x, y, z) : null, constants: { R, MOON_D, MOON_R, SUN_D, SUN_R, CYCLE_MS },
    setDeg: d => setDeg(d, 'api'), kick,
    lightIntensity: v => { if (bodies && bodies.dir) { bodies.dir.intensity = v; kick(300); } }   // tests only: proves the Sun does not respond to the light
  };
  paintDom(); live.textContent = '';
  start3d();
})();
