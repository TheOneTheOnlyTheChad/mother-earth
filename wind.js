/* Mother Earth — Wind by height (GLOBAL-WIND-BUILD-PROPOSAL rev 2; built on branch wind-rc).
 * An optional layer, off on load. The hub fetches one NOAA/NCEP GFS run (analysis hour), samples it to a 1 degree grid at three
 * heights and serves each as a small file; this file paints one height at a time on a transparent sheet over the globe.
 * - MODELLED, not measured. The card says so whenever the layer is drawn, with the model's valid time.
 * - Nothing is requested while the layer is off. On: the hub's manifest, then exactly one grid (the selected height).
 * - A grid is checked against the SHA-256 in the manifest before anything is drawn.
 * - The sheet, the height control, the valid-time line and the point reading change TOGETHER, only after the replacement has
 *   loaded. A late answer for a choice that has since changed is dropped.
 * - Switching height keeps the revision already shown, even if the hub has a newer one. A newer revision arrives on the refresh
 *   tick, as one step. If the revision shown has aged out of the hub, the manifest is read again and everything moves together.
 * - Colour, arrows and the point reading all use the same value: the model's value at the nearest whole degree. No smoothing.
 * - Age runs from the model's VALID time, not from when it was fetched. At 24 hours the sheet is cleared. No "stale" line is set yet.
 * - Kept out of the observation path like Ocean heat and Dust RGB: never touches state, points, pmeta, usable() or a globe.gl layer.
 */
(() => {
  const ME = window.ME; if (!ME) return;
  const $ = ME.$, esc = ME.esc;
  const tgl = $('tgl-wind'); if (!tgl) return;
  // OPACITY 0.8 with the white coastline above the sheet: chosen 16 Nov after four looks in desktop Chrome (GPT) at 0.5 and 0.8, with and
  // without the outline. At 0.8 the speed colours match the legend closely; the outline, not a thinner sheet, is what shows where you are.
  const WD = { META: ME.HUB + '/snapshot/wind/meta', HIDE_AFTER_H: 24, REFRESH_MS: 10 * 60e3, AGE_MS: 30e3, ALT: 0.0009, OPACITY: 0.8,
    W: 360, H: 181, BYTES: 360 * 181 * 4, MISSING: -32768, PX: 8, PX_PHONE: 4, CALM_KMH: 1, ARROW_STEP: 5, ARROW_MAX_LAT: 80, ARROW_LEN: 2.1, BUILD_WAIT_MS: 60000,
    LEVELS: [{ id: 'near-ground', label: 'Near ground', where: '10 m above the model’s surface' }, { id: '250hPa', label: 'Jet-stream height', where: '250 hPa, roughly 10–11 km' }, { id: '10hPa', label: 'Stratosphere', where: '10 hPa, roughly 30 km' }],
    // One fixed scale for all three heights, in km/h. PROVISIONAL: to be frozen once several days of real revisions have been seen. Each band is [from, colour].
    SCALE: [[0, '#1b2a4a'], [5, '#27477a'], [10, '#2f6c9c'], [20, '#2f9aa6'], [30, '#3fbf8f'], [45, '#8fd65c'], [60, '#dfe04a'], [80, '#f5b33c'], [100, '#f08433'], [130, '#e4532f'], [160, '#cf2f4f'], [200, '#b0308f'], [250, '#8a4fd0'], [300, '#c9a6ff'], [400, '#ffffff']] };
  const st = { on: false, gen: 0, seq: 0, status: 'off', why: null, note: null, level: 'near-ground', want: null, rev: null, grid: null, meta: null, meshes: [], cache: new Map(),
    sel: null, badInput: false, lastAttempt: null, refreshFailed: false, timer: null, ageTimer: null, loading: false, requests: [], opts: { now: null } };
  const now = () => (st.opts.now ? st.opts.now() : Date.now());
  // ---------- coastline outline above the sheet (16 Nov: under the sheet the coast was hard to find; GPT's looks)
  // Natural Earth 1:50m coastline (public domain), simplified by Mother Earth: assets/coast-50m.bin. A reference line, not live data.
  const COAST = { FILE: 'assets/coast-50m.bin?v=202612121200', MAGIC: 'MECOAST1', ALT: 0.002, OPACITY: 0.92, MAX_SEG_DEG: 1 };
  const coast = { status: 'idle', lines: null, shown: false, mesh: null, parent: null };
  async function loadCoast() {
    if (coast.status !== 'idle') return;
    coast.status = 'loading';
    try {
      const r = await fetch(COAST.FILE); if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = await r.arrayBuffer(), dv = new DataView(b); let o = 8;
      if (b.byteLength < 12 || new TextDecoder().decode(new Uint8Array(b, 0, 8)) !== COAST.MAGIC) throw new Error('not a coastline file');
      const n = dv.getUint32(o, true); o += 4; const lens = []; let total = 0;
      for (let i = 0; i < n; i++) { const k = dv.getUint32(o, true); o += 4; lens.push(k); total += k; }
      if (!(n > 0 && n < 5000) || b.byteLength !== o + total * 4) throw new Error('coastline file has the wrong length');
      const lines = [];
      for (const k of lens) { const pts = []; for (let i = 0; i < k; i++) { const lng = dv.getInt16(o, true) / 100, lat = dv.getInt16(o + 2, true) / 100; o += 4; if (Math.abs(lng) > 180 || Math.abs(lat) > 90) throw new Error('coastline point out of range'); pts.push([lng, lat]); } lines.push(pts); }
      coast.lines = lines; coast.status = 'ready';
    } catch (e) { coast.status = 'failed'; coast.err = String(e.message || e); }
    paint();
  }
  /** The outline is its own mesh, like the wind sheet: it uses NO globe.gl data layer. (Rev 6 used the library's path layer, which the
   *  page already uses for microplastic rings: the page's next redraw wiped the outline, and Wind changed that layer's settings. Rev 7.)
   *  The library gives this file no line class, so each segment is a flat triangle (a, b, b) drawn as a wireframe: one object, one-pixel lines. */
  function buildCoast() {
    const h = harvest(); if (!h || !coast.lines) return null;
    const g = h.g, Geo = Object.getPrototypeOf(h.Sphere), pos = h.gmesh.geometry.getAttribute && h.gmesh.geometry.getAttribute('position'), Attr = pos && pos.constructor, C = g.globeMaterial().constructor;
    if (typeof Geo !== 'function' || !Attr || typeof g.getCoords !== 'function') return null;
    const xyz = []; let segs = 0;
    const put = (lng, lat) => { const c = g.getCoords(lat, lng, COAST.ALT); xyz.push(c.x, c.y, c.z); };
    for (const l of coast.lines) for (let i = 1; i < l.length; i++) {
      const a = l[i - 1], b = l[i], n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / COAST.MAX_SEG_DEG));   // long straight runs are cut so they follow the curve
      for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, x0 = a[0] + (b[0] - a[0]) * t0, y0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, y1 = a[1] + (b[1] - a[1]) * t1;
        put(x0, y0); put(x1, y1); put(x1, y1); segs++; }
    }
    const geo = new Geo(); geo.setAttribute('position', new Attr(new Float32Array(xyz), 3));
    const mat = new C({ wireframe: true, transparent: true, opacity: COAST.OPACITY, depthWrite: false }); if (mat.color) mat.color.set(0xffffff); if (mat.emissive) mat.emissive.set(0xffffff);
    const mesh = new h.Mesh(geo, mat); mesh.raycast = () => { }; mesh.renderOrder = 1;   // after the wind sheet (−4) and the other sheets
    mesh.__windCoast = true; mesh.__segments = segs;
    return { mesh, parent: h.gmesh.parent };
  }
  /** the outline is drawn exactly while a wind sheet is drawn; it never appears on its own */
  function coastSync() {
    const want = st.on && st.meshes.length > 0 && coast.status === 'ready';
    if (want && !coast.mesh) { const b = buildCoast(); if (!b) { coast.status = 'failed'; coast.err = 'the outline could not be built'; return; } coast.mesh = b.mesh; coast.parent = b.parent; }
    if (want === coast.shown) return;
    if (want) coast.parent.add(coast.mesh); else if (coast.mesh && coast.mesh.parent) coast.mesh.parent.remove(coast.mesh);
    coast.shown = want;
  }
  const hex = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = iso => { const d = new Date(iso); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`; };
  const ageMs = rev => now() - Date.parse(rev.valid_time);
  const ageText = ms => { const m = Math.max(0, Math.floor(ms / 60e3)); return m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`; };
  const tooOld = rev => ageMs(rev) >= WD.HIDE_AFTER_H * 3600e3;
  const LV = id => WD.LEVELS.find(l => l.id === id);
  const band = kmh => { let k = 0; for (let i = 0; i < WD.SCALE.length; i++) if (kmh >= WD.SCALE[i][0]) k = i; return k; };

  // ---------- one cell, read the same way by the colour, the arrows and the point reading
  /** j = row from the north pole (0..180), i = degrees east (0..359). Returns null where the model has no value. */
  function cell(grid, j, i) {
    const o = (j * WD.W + i) * 2, u = grid[o], v = grid[o + 1];
    if (u === WD.MISSING || v === WD.MISSING) return null;
    const ue = u / 10, vn = v / 10, kmh = Math.hypot(ue, vn) * 3.6;
    const pole = j === 0 || j === WD.H - 1, calm = kmh < WD.CALM_KMH;
    const to = (Math.atan2(ue, vn) * 180 / Math.PI + 360) % 360, from = (to + 180) % 360;
    return { u: ue, v: vn, kmh, pole, calm, to: pole || calm ? null : to, from: pole || calm ? null : from };
  }
  const CARD = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const cellOf = (lat, lng) => ({ j: Math.min(WD.H - 1, Math.max(0, Math.round(90 - lat))), i: ((Math.round(lng) % 360) + 360) % 360 });
  const cellName = (j, i) => { const la = 90 - j, lo = i > 180 ? i - 360 : i; return `${Math.abs(la)}°${la > 0 ? 'N' : la < 0 ? 'S' : ''} ${Math.abs(lo)}°${lo > 0 && lo < 180 ? 'E' : lo < 0 ? 'W' : ''}`; };
  /** The words for one point. Returns { text, kind } where kind is value | calm | pole | missing. */
  function reading(grid, lat, lng) {
    const { j, i } = cellOf(lat, lng), c = cell(grid, j, i), where = cellName(j, i);
    if (!c) return { kind: 'missing', text: 'No model value here.', where, j, i };
    const sp = `${Math.round(c.kmh)} km/h`;
    if (c.pole) return { kind: 'pole', text: `${sp}. No compass bearing at the pole.`, where, j, i, kmh: c.kmh };
    if (c.calm) return { kind: 'calm', text: `Calm (under ${WD.CALM_KMH} km/h).`, where, j, i, kmh: c.kmh };
    return { kind: 'value', text: `From ${CARD[Math.round(c.from / 45) % 8]} (${Math.round(c.from) % 360}°), ${sp}`, where, j, i, kmh: c.kmh, from: c.from, to: c.to };
  }

  // ---------- painting: one canvas carries the colour field and the arrows
  function compose(grid) {
    const px = matchMedia('(max-width:720px)').matches ? WD.PX_PHONE : WD.PX, TW = 360 * px, TH = 180 * px;
    // colour: one pixel per model cell on a small canvas, columns from 180°W so it matches the globe's own picture
    const small = document.createElement('canvas'); small.width = WD.W; small.height = WD.H; const sc = small.getContext('2d'), im = sc.createImageData(WD.W, WD.H), d = im.data;
    const rgb = WD.SCALE.map(([, c]) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
    const missing = [];
    for (let j = 0; j < WD.H; j++) for (let k = 0; k < WD.W; k++) {
      const i = (k + 180) % 360, c = cell(grid, j, i), o = (j * WD.W + k) * 4;
      if (!c) { d[o + 3] = 0; missing.push([j, k]); continue; }
      const [r, g, b] = rgb[band(c.kmh)]; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    sc.putImageData(im, 0, 0);
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;                     // each model cell keeps its own colour: what is drawn is what the point reading says
    // a cell is centred on its whole degree: shift by half a cell, and draw twice so the column at 180° wraps
    const cw = TW / 360, ch = TH / 180;
    for (const dx of [0, TW]) c.drawImage(small, 0, 0, WD.W, WD.H, dx - cw / 2, -ch / 2, TW, TH + ch);
    // missing cells: a hatch, never a colour from the scale and never calm
    if (missing.length) { c.save(); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, px / 6);
      for (const [j, k] of missing) { const x = k * cw - cw / 2, y = j * ch - ch / 2; c.fillStyle = 'rgba(40,40,40,0.9)'; c.fillRect(x, y, cw, ch); c.beginPath(); c.moveTo(x, y + ch); c.lineTo(x + cw, y); c.stroke(); }
      c.restore(); }
    // arrows: direction only, fixed length, thinned so their spacing on the globe stays roughly even
    const L = WD.ARROW_LEN * px; let arrows = 0, dots = 0;
    const draw = (x, y, to, lat) => {
      const a = to * Math.PI / 180, k = 1 / Math.cos(lat * Math.PI / 180);     // the picture is stretched east-west by 1/cos(latitude)
      const ex = Math.sin(a) * k, ey = -Math.cos(a), hx = x + ex * L / 2, hy = y + ey * L / 2, tx = x - ex * L / 2, ty = y - ey * L / 2;
      const nx = -ey * k, ny = ex / k, hl = L * 0.36;                       // head: two short strokes back from the tip
      const p = [[hx - ex * hl + nx * hl * 0.55, hy - ey * hl + ny * hl * 0.55], [hx - ex * hl - nx * hl * 0.55, hy - ey * hl - ny * hl * 0.55]];
      for (const [col, wd] of [['rgba(0,0,0,0.75)', px * 0.42], ['#ffffff', px * 0.2]]) { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.moveTo(p[0][0], p[0][1]); c.lineTo(hx, hy); c.lineTo(p[1][0], p[1][1]); c.stroke(); }
    };
    for (let lat = -WD.ARROW_MAX_LAT; lat <= WD.ARROW_MAX_LAT; lat += WD.ARROW_STEP) {
      const step = WD.ARROW_STEP * Math.max(1, Math.round(1 / Math.cos(lat * Math.PI / 180)));
      for (let lon = -180; lon < 180; lon += step) {
        const j = 90 - lat, i = (lon + 360) % 360, v = cell(grid, j, i); if (!v) continue;
        const x = (lon + 180) * cw, y = j * ch;
        if (v.calm) { c.fillStyle = 'rgba(0,0,0,0.75)'; c.beginPath(); c.arc(x, y, px * 0.34, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, px * 0.2, 0, 7); c.fill(); dots++; continue; }
        for (const dx of (x < L ? [0, TW] : x > TW - L ? [0, -TW] : [0])) draw(x + dx, y, v.to, lat); arrows++;
      }
    }
    cv.__wind = { arrows, dots, missing: missing.length, px };
    return cv;
  }
  function harvest() {
    const g = ME.globe && ME.globe(); if (!g || typeof g.scene !== 'function' || typeof g.globeMaterial !== 'function') return null;
    const gm = g.globeMaterial(); let gmesh = null, Mat = null, Tex = null;
    g.scene().traverse(o => { if (!o.isMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m === gm) gmesh = o; if (m) { Mat = Mat || m.constructor; if (m.map) Tex = Tex || m.map.constructor; } });
    if (gm && gm.map) Tex = Tex || gm.map.constructor;
    if (!gmesh || !gmesh.geometry || !/Sphere/i.test(gmesh.geometry.type || '') || !Mat || !Tex || !gmesh.parent) return null;
    return { g, gmesh, Sphere: gmesh.geometry.constructor, Mesh: gmesh.constructor, Mat, Tex };
  }
  function buildMesh(cv) {
    const h = harvest(); if (!h) return null;
    const p = h.gmesh.geometry.parameters || {}, R = h.g.getGlobeRadius() * (1 + WD.ALT);
    const tex = new h.Tex(cv); if ('colorSpace' in tex) tex.colorSpace = 'srgb'; if ('magFilter' in tex && h.gmesh.material && h.gmesh.material.map) { /* keep the library's default filters */ } tex.needsUpdate = true;
    const geo = new h.Sphere(R, 96, 96, p.phiStart != null ? p.phiStart : 0, p.phiLength != null ? p.phiLength : Math.PI * 2, p.thetaStart != null ? p.thetaStart : 0, p.thetaLength != null ? p.thetaLength : Math.PI);
    const mesh = new h.Mesh(geo, new h.Mat({ map: tex, transparent: true, depthWrite: false, opacity: WD.OPACITY }));
    mesh.rotation.set(h.gmesh.rotation.x, h.gmesh.rotation.y, h.gmesh.rotation.z);
    mesh.raycast = () => { };          // never a pick target: taps go through to the globe
    mesh.renderOrder = -4;             // beneath Dust RGB (−3), Ocean heat (−2) and the day/night shading (−1)
    mesh.__wind = true;
    return { mesh, parent: h.gmesh.parent };
  }
  function destroy() {
    for (const m of st.meshes) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
    st.meshes = [];
  }
  const discard = b => { if (b) { b.mesh.geometry.dispose(); b.mesh.material.map.dispose(); b.mesh.material.dispose(); } };

  // ---------- loading
  const hubFetch = async (url, init) => { st.requests.push(url.replace(ME.HUB, '')); return fetch(url, init); };
  async function getMeta() {
    const r = await hubFetch(WD.META, { cache: 'no-store' });
    if (!r.ok) throw new Error('the hub did not answer (HTTP ' + r.status + ')');
    return r.json();
  }
  const fileErr = (msg, extra) => Object.assign(new Error(msg), { file: true, ...extra });
  /** One level's grid for one revision: from memory, or fetched and checked. gone = the hub no longer serves that revision. */
  async function getGrid(rev, levelId) {
    const l = rev.levels.find(x => x.id === levelId); if (!l) throw fileErr('the revision has no such level');
    if (st.cache.has(l.sha256)) return st.cache.get(l.sha256);
    let r; try { r = await hubFetch(ME.HUB + l.path); } catch (e) { throw fileErr('the wind file could not be loaded'); }
    if (r.status === 404) throw fileErr('the hub no longer serves that revision', { gone: true });
    if (!r.ok) throw fileErr('the wind file could not be loaded');
    let b; try { b = await r.arrayBuffer(); } catch (e) { throw fileErr('the wind file could not be loaded'); }
    if (b.byteLength !== WD.BYTES || b.byteLength !== l.bytes || await hex(b) !== l.sha256) throw fileErr('the wind file did not match its fingerprint');
    const dv = new DataView(b), g = new Int16Array(WD.W * WD.H * 2); for (let k = 0; k < g.length; k++) g[k] = dv.getInt16(k * 2, true);
    st.cache.set(l.sha256, g); return g;
  }
  async function build(grid, gen) {
    const cv = compose(grid); let built = null;
    for (const t0 = Date.now(); !built;) { built = buildMesh(cv); if (built) break; if (Date.now() - t0 > WD.BUILD_WAIT_MS) break; await new Promise(r => setTimeout(r, 200)); if (gen !== st.gen) return null; }
    if (!built) throw new Error('the globe has not finished loading its own picture, so the layer cannot be drawn on it');
    return built;
  }
  /** Swap in ONE step: sheet, revision, level and every label. */
  function show(rev, levelId, grid, built) {
    destroy(); built.parent.add(built.mesh); st.meshes = [built.mesh]; st.rev = rev; st.level = levelId; st.grid = grid; st.status = 'ready'; st.why = null; st.note = null; st.refreshFailed = false; st.want = null;
    for (const k of [...st.cache.keys()]) if (!rev.levels.some(l => l.sha256 === k)) st.cache.delete(k);   // keep only the shown revision's grids in memory
  }
  function clearAll(why) { destroy(); st.rev = null; st.grid = null; st.status = 'unknown'; st.why = why; st.note = null; st.want = null; st.cache.clear(); }

  /** Load one level of one revision and show it. rev = null means "the revision already shown, else the hub's current one". */
  async function load(levelId, rev, isRefresh) {
    const gen = st.gen, seq = ++st.seq; st.want = levelId; st.loading = true; paint();
    const late = () => gen !== st.gen || seq !== st.seq || !st.on;
    try {
      let target = rev || st.rev, meta = null;
      const readMeta = async () => { meta = await getMeta(); st.meta = meta; st.lastAttempt = meta.last_attempt || null; return meta.current; };
      if (!target) {
        try { target = await readMeta(); } catch (e) { if (late()) return; st.status = 'unknown'; st.why = 'The wind field could not be loaded: ' + (e.message || e) + '.'; return; }
        if (late()) return;
        if (!target) { st.status = 'unknown'; st.why = 'The hub has no wind revision yet.'; return; }
      }
      if (tooOld(target)) { if (late()) return; clearAll(`The newest model field is valid at ${utc(target.valid_time)}, more than ${WD.HIDE_AFTER_H} hours ago.`); return; }
      let grid = null, err = null;
      try { grid = await getGrid(target, levelId); } catch (e) { err = e; }
      if (late()) return;
      if (err && err.gone) {                                // the revision has aged out of the hub: read the manifest again and move everything together
        try { target = await readMeta(); } catch (e) { target = null; }
        if (late()) return;
        if (target && !tooOld(target)) { err = null; try { grid = await getGrid(target, levelId); } catch (e) { err = e; } if (late()) return; }
      }
      let built = null;
      if (!err && grid) { try { built = await build(grid, gen); } catch (e) { err = e; } }
      if (late()) return discard(built);
      // the 24-hour limit is checked again at the moment of drawing: a load that began in time can finish too late
      if (!err && built && tooOld(target)) { discard(built); clearAll(`The newest model field is valid at ${utc(target.valid_time)}, more than ${WD.HIDE_AFTER_H} hours ago.`); return; }
      if (!err && built) { show(target, levelId, grid, built); return; }
      if (!err) return;
      // failure: what is shown stays, under its own label, and the level that failed is named
      if (st.rev) { if (isRefresh) st.refreshFailed = true; else st.note = `${LV(levelId).label} could not be loaded: ${err.message || err}. Still showing ${LV(st.level).label}.`; }
      else { st.status = 'unknown'; st.why = 'The wind field could not be loaded: ' + (err.message || err) + '.'; }
    } finally { if (gen === st.gen && seq === st.seq) { st.loading = false; st.want = null; paint(); } }
  }
  async function refresh() {
    if (!st.on || st.loading) return;
    const gen = st.gen;
    let meta; try { meta = await getMeta(); } catch (e) { if (gen !== st.gen) return; if (st.rev) st.refreshFailed = true; else { st.status = 'unknown'; st.why = 'The wind field could not be loaded: ' + (e.message || e) + '.'; } return paint(); }
    if (gen !== st.gen || st.loading) return;
    st.meta = meta; st.lastAttempt = meta.last_attempt || null;
    const c = meta.current;
    if (!c) { if (!st.rev) { st.status = 'unknown'; st.why = 'The hub has no wind revision yet.'; } return paint(); }
    if (st.rev && st.rev.run === c.run) { st.refreshFailed = false; return paint(); }
    if (st.rev && c.run < st.rev.run) return paint();        // never go back to an older run
    await load(st.level, c, true);
  }
  function ageTick() {
    if (!st.on) return;
    if (st.rev && tooOld(st.rev)) clearAll(`The model field shown was valid at ${utc(st.rev.valid_time)}, more than ${WD.HIDE_AFTER_H} hours ago, and has been cleared.`);
    paint();
  }

  // ---------- labels
  const keyRepaint = () => { if (typeof ME.paintKeyExternal === 'function') ME.paintKeyExternal(); };   // the Key's count, entries and empty sentence follow what is drawn
  function paint() {
    keyRepaint();
    coastSync();
    const s = $('s-wind'), o = $('o-wind'), fl = $('wind-frame'), ex = $('wind-extra'), rd = $('wind-read');
    tgl.setAttribute('aria-checked', String(st.on));
    s.textContent = !st.on ? 'off' : st.rev ? 'loaded' : st.status === 'loading' || st.loading ? 'loading' : 'unknown';
    s.className = 'state' + (st.on && st.rev ? ' ok' : st.on && !st.loading && st.status !== 'loading' ? ' bad' : '');
    for (const b of document.querySelectorAll('#wind-levels button')) { const id = b.dataset.level;
      b.setAttribute('aria-checked', String(st.on && !!st.rev && st.level === id)); b.disabled = !st.on; b.classList.toggle('pending', st.on && st.want === id && !(st.rev && st.level === id)); b.tabIndex = (st.rev ? st.level : 'near-ground') === id ? 0 : -1; }
    $('wind-pt').hidden = !(st.on && st.rev);
    if (!st.on) { fl.hidden = true; ex.hidden = true; rd.textContent = ''; o.hidden = false; o.textContent = st.why || 'Off. Switch on to load the newest modelled wind field.'; return; }
    if (st.rev) {
      const l = LV(st.level); fl.hidden = false; o.hidden = true;
      fl.innerHTML = `<b>Modelled wind · NOAA GFS · Valid at ${esc(utc(st.rev.valid_time))}</b> (${esc(ageText(ageMs(st.rev)))})<br><span class="wind-lv">${esc(l.label)} — ${esc(l.where)}</span>`;
      const bits = ['One model run, frozen at its valid time: not a measurement, not a forecast. NOAA/NCEP GFS, sampled to 1° and quantised by Mother Earth.'];
      if (st.note) bits.push(st.note);
      if (st.lastAttempt && st.lastAttempt.status === 'down') bits.push('The hub’s latest update did not complete.');
      if (st.refreshFailed) bits.push('Refresh unavailable.');
      if (coast.status === 'failed') bits.push('The coastline outline could not be loaded.');
      ex.hidden = false; ex.textContent = bits.join(' ');
      if (st.badInput) { rd.textContent = 'Enter a latitude from −90 to 90 and a longitude from −180 to 180.'; rd.dataset.kind = ''; }   // kept by every repaint until a valid point is chosen
      else if (st.sel) { const r = reading(st.grid, st.sel.lat, st.sel.lng); rd.textContent = `${r.text} · ${l.label} · model cell ${r.where} · valid ${utc(st.rev.valid_time)}`; rd.dataset.kind = r.kind; }
      else { rd.textContent = 'Tap the globe, or enter a latitude and longitude, to read the model value there.'; rd.dataset.kind = ''; }
    } else {
      fl.hidden = true; ex.hidden = true; rd.textContent = ''; o.hidden = false;
      o.textContent = st.loading || st.status === 'loading' ? 'Loading the newest modelled wind field…' : (st.why || 'No wind field is available.') + ' Nothing is drawn.';
    }
  }
  function select(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 360) { st.badInput = true; paint(); return false; }
    st.badInput = false; st.sel = { lat, lng: ((lng + 540) % 360) - 180 }; const a = $('wind-lat'), b = $('wind-lng'); if (a && b) { a.value = String(Math.round(st.sel.lat)); b.value = String(Math.round(st.sel.lng)); }
    paint(); return true;
  }

  // ---------- on / off
  async function setOn(on) {
    if (on === st.on) return;
    st.gen++;
    if (!on) { st.on = false; st.status = 'off'; st.why = null; st.note = null; st.loading = false; st.want = null; st.refreshFailed = false; st.lastAttempt = null; st.badInput = false; destroy(); st.rev = null; st.grid = null; st.cache.clear();
      clearInterval(st.timer); clearInterval(st.ageTimer); st.timer = st.ageTimer = null; paint(); return; }
    st.on = true; st.why = null; st.status = 'loading'; st.level = 'near-ground'; paint();
    if (!ME.globe || !ME.globe()) { st.on = false; st.status = 'off'; st.why = 'Wind needs the 3-D globe, which is not available in this browser. Nothing is drawn.'; st.gen++; return paint(); }
    loadCoast();
    st.timer = setInterval(() => { if (!document.hidden) refresh(); }, WD.REFRESH_MS);
    st.ageTimer = setInterval(ageTick, WD.AGE_MS);
    await load('near-ground', null, false);
  }
  tgl.addEventListener('click', () => setOn(!st.on));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.on) { ageTick(); refresh(); } });   // age and freshness are rechecked when the tab comes back
  const setLevel = id => { if (!st.on || !LV(id)) return; if (st.rev && st.level === id && !st.loading) return; return load(id, null, false); };
  { const box = $('wind-levels');
    box.addEventListener('click', e => { const b = e.target.closest('button[data-level]'); if (b && !b.disabled) setLevel(b.dataset.level); });
    box.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault();
      const bs = [...box.querySelectorAll('button')], k = (bs.indexOf(document.activeElement) + d + bs.length) % bs.length; bs[k].focus(); if (!bs[k].disabled) setLevel(bs[k].dataset.level); });
    $('wind-go').addEventListener('click', () => { select(parseFloat($('wind-lat').value), parseFloat($('wind-lng').value)); });
    for (const id of ['wind-lat', 'wind-lng']) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('wind-go').click(); }); }
  // the globe's own tap: the page calls every function in ME.taps with the tapped point
  (ME.taps = ME.taps || []).push((lat, lng) => { if (st.on && st.rev) select(lat, lng); });
  // (a tap always carries a real point, so it also clears an earlier bad entry)
  // legend, built once from the scale
  { const el = $('wind-key'); if (el) el.innerHTML = WD.SCALE.map(([v, c], k) => `<span class="b"><i style="background:${c}"></i>${k === WD.SCALE.length - 1 ? v + '+' : v}</span>`).join('') + '<span class="u">km/h · one scale for all three heights (provisional)</span><span class="b m"><i class="hatch"></i>no model value</span>'; }

  // read-only aids for tests and the console
  ME.wind = { drawn: () => st.meshes.some(m => m.parent),   // a wind field is on the globe (also after a failed refresh that kept it)
    state: () => ({ on: st.on, status: st.status, why: st.why, note: st.note, level: st.rev ? st.level : null, want: st.want, run: st.rev ? st.rev.run : null, valid: st.rev ? st.rev.valid_time : null,
      meshes: st.meshes.length, inScene: st.meshes.filter(m => m.parent).length, loading: st.loading, refreshFailed: st.refreshFailed, requests: st.requests.slice(), sel: st.sel,
      label: $('wind-frame').hidden ? null : $('wind-frame').textContent, extra: $('wind-extra').hidden ? null : $('wind-extra').textContent, off: $('o-wind').hidden ? null : $('o-wind').textContent,
      read: $('wind-read').textContent, readKind: $('wind-read').dataset.kind || '', stateWord: $('s-wind').textContent,
      checked: [...document.querySelectorAll('#wind-levels button')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.level),
      drawn: st.meshes[0] && st.meshes[0].material.map.image.__wind || null, cached: st.cache.size,
      coast: { status: coast.status, shown: coast.shown, lines: coast.lines ? coast.lines.length : 0, err: coast.err || null, inScene: !!(coast.mesh && coast.mesh.parent), segments: coast.mesh ? coast.mesh.__segments : 0 }, opacity: WD.OPACITY }),
    setOn, setLevel, refresh, ageTick, select, opts: st.opts, config: WD, reading: (lat, lng) => st.grid ? reading(st.grid, lat, lng) : null, cell, band,
    coastConfig: COAST, coastLines: () => coast.lines, texture: () => (st.meshes[0] && st.meshes[0].material.map && st.meshes[0].material.map.image) || null };
  paint();
})();
