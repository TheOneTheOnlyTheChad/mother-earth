/* Mother Earth — Ocean Heat (OCEAN-HEAT-PROPOSAL rev 4.2; release per OCEAN-HEAT-RELEASE-PROPOSAL rev 2: files served by the hub).
 * One dated, global snapshot of NOAA Coral Reef Watch sea surface temperature and its difference from the 1991–2020
 * normal, painted on the globe and answered by a tap. Analysed (satellite-based, gaps filled by NOAA), never "observed".
 * Kept out of the observation path like day/night: it never touches state, points, pmeta, usable() or any globe.gl layer.
 *
 * Identity: the page pins the manifest's sha256; the manifest pins every binary's sha256; nothing is drawn unless all
 * match and the manifest names the expected revision, date and grids. A load that completes after switch-off never draws.
 * Painting: P1 = native 0.05° texels with the 0.25° values; P2 = 0.1° texels with the 0.5° values (a texel never straddles
 * a block). Path rule (GPT preview review, 11 Nov): phone-sized viewports take P2 (~25 MiB texture, not ~99 MiB);
 * otherwise P1 when the renderer's texture limit fits it. Limits are handled explicitly: P1 7200 × 3600 as 1 texture
 * (limit ≥ 7200) or 2 tiles of 3600 (3600–7199); P2 3600 × 1800 as 1 texture (≥ 3600) or 2 tiles of 1800 (1800–3599);
 * below 1800, or unreadable, the layer says so and downloads nothing more. Colour and tap read the SAME arrays through
 * the SAME lookup.
 */
(() => {
  const ME = window.ME; if (!ME) return;
  const $ = ME.$, esc = ME.esc;
  const OH = {
    REV: 'oh-2026-11-09-R1',
    BASE: 'https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/',   // hub 0.6.7, pinned; immutable revision
    MANIFEST_SHA256: 'dcc3467428e38e76966508d10078d322b8d724ed784de3266ae0b62354f5af1b',
    DATE: '2026-11-09', DATE_TEXT: '9 Nov 2026 (UTC day)',
    NATIVE: { res: 0.05, rows: 3600, cols: 7200 },
    // §4 legend: 9 classes on the stored 0.01 °C value (a). Bounds in hundredths. Index 4 = near normal (−0.2 < a < +0.2).
    CLASSES: [
      { hi: -300, inc: true, col: [8, 48, 107], label: '−3.0 or colder' }, { hi: -200, inc: true, col: [33, 113, 181], label: '−3.0 to −2.0' },
      { hi: -100, inc: true, col: [107, 174, 214], label: '−2.0 to −1.0' }, { hi: -20, inc: true, col: [198, 219, 239], label: '−1.0 to −0.2' },
      { hi: 20, inc: false, col: [242, 240, 235], label: 'near normal (−0.2 to +0.2)' }, { hi: 100, inc: false, col: [253, 208, 162], label: '+0.2 to +1.0' },
      { hi: 200, inc: false, col: [253, 141, 60], label: '+1.0 to +2.0' }, { hi: 300, inc: false, col: [217, 72, 1], label: '+2.0 to +3.0' },
      { hi: Infinity, inc: false, col: [127, 39, 4], label: '+3.0 or warmer' }],
    ALPHA_WATER: 230, NODATA: [[128, 140, 160], [100, 112, 130]], ALPHA_NODATA: 220,   // lightened after GPT's preview review (11 Nov): readable against polar-night land
    MIXED: [138, 143, 150], ALPHA_MIXED: 140,
    ALT: 0.0003,
  };
  const st = { on: false, gen: 0, status: 'off', why: null, man: null, mask: null, vals: {}, path: null, valueRes: null, tiles: 1,
    phone: null, meshes: [], parent: null, maxTex: null, timings: {}, bytes: {}, opts: { forcePath: null, forceTiles: null, forceMaxTex: null, forcePhone: null } };

  // ---------- pure lookups (shared by painting and tapping)
  const classOf = a => { for (let i = 0; i < OH.CLASSES.length; i++) { const c = OH.CLASSES[i]; if (c.inc ? a <= c.hi : a < c.hi) return i; } return OH.CLASSES.length - 1; };
  const wrapLng = lng => ((((lng + 180) % 360) + 360) % 360);            // [0, 360): +180 and −180 both → 0 (column 0)
  const cellAt = (lat, lng, res, rows, cols) => ({
    row: Math.max(0, Math.min(Math.floor((90 - lat) / res), rows - 1)),
    col: Math.floor(wrapLng(lng) / res) % cols });
  const codeAt = (r, c) => { const i = r * OH.NATIVE.cols + c; return (st.mask[i >> 2] >> ((i & 3) * 2)) & 3; };   // 0 water, 1 land, 2 no normal, 3 ice
  ME.ohLookup = { classOf, wrapLng, cellAt };   // test aid: the exact functions the layer uses

  // ---------- loading
  const sha256 = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  async function inflate(buf) {
    if (typeof DecompressionStream !== 'function') throw new Error('this browser cannot decompress the snapshot (no DecompressionStream)');
    const out = new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate')));
    return new Uint8Array(await out.arrayBuffer());
  }
  async function getChecked(name, wantSha) {
    const r = await fetch(OH.BASE + name);   // default cache: the hub marks verified files immutable for 24 h; the hash check below still runs
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    const buf = await r.arrayBuffer(); st.bytes[name] = buf.byteLength;
    const got = await sha256(buf);
    if (got !== wantSha) throw new Error(`${name} failed its check (sha256 ${got.slice(0, 12)}… ≠ pinned ${wantSha.slice(0, 12)}…)`);
    return buf;
  }
  function decodeValues(raw, f) {
    const R = f.rows, C = f.cols, N = R * C;
    if (raw.length !== 7 * N || f.raw_bytes !== raw.length) throw new Error('value file has the wrong size for its grid');
    const planeI16 = off => {   // row-delta, int16 split into low-byte then high-byte planes → absolute Int32
      const out = new Int32Array(N);
      for (let r = 0; r < R; r++) { let acc = 0; for (let c = 0; c < C; c++) { const i = r * C + c; let d = raw[off + i] | (raw[off + N + i] << 8); if (d & 0x8000) d -= 0x10000; acc += d; out[i] = acc; } }
      return out;
    };
    const k = Math.round(f.res / OH.NATIVE.res);   // square side in native cells (5 at 0.25°, 10 at 0.5°)
    if (k * k !== f.cells_per_block || R * k !== OH.NATIVE.rows || C * k !== OH.NATIVE.cols) throw new Error('value grid does not nest in the 0.05° grid');
    return { res: f.res, rows: R, cols: C, k, anom: planeI16(0), sst: planeI16(2 * N),
      n: raw.subarray(4 * N, 5 * N), land: raw.subarray(5 * N, 6 * N), sstOk: raw.subarray(6 * N, 7 * N) };
  }
  function rendererMaxTex() {
    try { const g = ME.globe(), r = g && g.renderer && g.renderer(); const gl = r && r.getContext && r.getContext(); return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null; } catch (e) { return null; }
  }
  // Phone-sized: the page's own phone breakpoint (≤ 720 CSS px wide), or a touch screen whose short side is ≤ 500 px
  // (a phone held sideways). Decided once at switch-on.
  function phoneSized() {
    try { return innerWidth <= 720 || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 500); }
    catch (e) { return innerWidth <= 720; }
  }
  const MIN_TEX = OH.NATIVE.rows / 2;    // 1800: one P2 tile's height and width
  function choosePath() {
    const o = st.opts;
    st.maxTex = o.forceMaxTex != null ? o.forceMaxTex : rendererMaxTex();
    st.phone = o.forcePhone != null ? o.forcePhone : phoneSized();
    const mt = st.maxTex || 0;
    if (mt < MIN_TEX) throw new Error(st.maxTex ? `this device's graphics texture limit (${st.maxTex} px) is below the ${MIN_TEX} px the layer needs` : "this browser did not report its graphics texture limit");
    const p1ok = mt >= OH.NATIVE.rows;   // a P1 tile is 3600 tall
    if (o.forcePath === 'P1' && !p1ok) throw new Error(`P1 needs a texture limit of ${OH.NATIVE.rows} px; this one is ${mt}`);
    const p1 = o.forcePath ? o.forcePath === 'P1' : (p1ok && !st.phone);
    st.path = p1 ? 'P1' : 'P2';
    st.valueRes = p1 ? 0.25 : 0.5;        // P2 is paired with 0.5° only (texels nest in blocks)
    const width = p1 ? OH.NATIVE.cols : OH.NATIVE.cols / 2;
    st.tiles = o.forceTiles || (mt >= width ? 1 : 2);
  }
  async function load(gen) {
    const t0 = performance.now();
    const mbuf = await getChecked('manifest.json', OH.MANIFEST_SHA256); if (gen !== st.gen) return 'superseded';
    const man = JSON.parse(new TextDecoder().decode(mbuf));
    if (man.revision !== OH.REV || man.data_date !== OH.DATE) throw new Error(`snapshot is ${man.revision} / ${man.data_date}, expected ${OH.REV} / ${OH.DATE}`);
    const fm = man.files && man.files['mask.bin.z'];
    if (!fm || fm.rows !== OH.NATIVE.rows || fm.cols !== OH.NATIVE.cols || fm.res !== OH.NATIVE.res) throw new Error('mask grid does not match the expected 0.05° grid');
    choosePath();
    const vname = st.valueRes === 0.25 ? 'v025.bin.z' : 'v050.bin.z', fv = man.files[vname];
    const wantRows = Math.round(180 / st.valueRes), wantCols = Math.round(360 / st.valueRes);
    if (!fv || fv.res !== st.valueRes || fv.rows !== wantRows || fv.cols !== wantCols) throw new Error('value grid does not match');
    const [mz, vz] = await Promise.all([getChecked('mask.bin.z', fm.sha256), getChecked(vname, fv.sha256)]); if (gen !== st.gen) return 'superseded';
    const [mraw, vraw] = await Promise.all([inflate(mz), inflate(vz)]); if (gen !== st.gen) return 'superseded';
    if (mraw.length !== fm.raw_bytes || mraw.length !== OH.NATIVE.rows * OH.NATIVE.cols / 4) throw new Error('mask has the wrong size');
    st.man = man; st.mask = mraw; st.vals = decodeValues(vraw, fv);
    st.timings.loadMs = Math.round(performance.now() - t0);
    return null;
  }

  // ---------- painting
  function harvest() {
    const g = ME.globe(); if (!g || typeof g.scene !== 'function' || typeof g.globeMaterial !== 'function') return null;
    const gm = g.globeMaterial(); let gmesh = null, Mat = null, Tex = null;
    g.scene().traverse(o => { if (!o.isMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m === gm) gmesh = o; if (m) { Mat = Mat || m.constructor; if (m.map) Tex = Tex || m.map.constructor; } });
    if (gm && gm.map) Tex = Tex || gm.map.constructor;
    if (!gmesh || !gmesh.geometry || !/Sphere/i.test(gmesh.geometry.type || '') || !Mat || !Tex || !gmesh.parent) return null;
    return { g, gmesh, Sphere: gmesh.geometry.constructor, Mesh: gmesh.constructor, Mat, Tex };
  }
  const blockColour = (() => { let cache = null; return () => {
    if (cache && cache.v === st.vals) return cache.c;
    const V = st.vals, n = V.rows * V.cols, c = new Uint32Array(n), little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    for (let i = 0; i < n; i++) { if (!V.n[i]) continue; const [r, g, b] = OH.CLASSES[classOf(V.anom[i])].col; c[i] = little ? (OH.ALPHA_WATER << 24 | b << 16 | g << 8 | r) >>> 0 : (r << 24 | g << 16 | b << 8 | OH.ALPHA_WATER) >>> 0; }
    cache = { v: st.vals, c, little }; return c; }; })();
  function paintTile(x0, W, H, tex) {     // native texels: x0 = first native column of this tile
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H), u32 = new Uint32Array(img.data.buffer), V = st.vals, k = V.k, bc = blockColour();
    const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    const px = (rgb, a) => little ? (a << 24 | rgb[2] << 16 | rgb[1] << 8 | rgb[0]) >>> 0 : (rgb[0] << 24 | rgb[1] << 16 | rgb[2] << 8 | a) >>> 0;
    const nd0 = px(OH.NODATA[0], OH.ALPHA_NODATA), nd1 = px(OH.NODATA[1], OH.ALPHA_NODATA), mixed = px(OH.MIXED, OH.ALPHA_MIXED);
    if (tex === 'native') {
      for (let r = 0; r < H; r++) { const br = (r / k) | 0; for (let x = 0; x < W; x++) { const c = x0 + x, code = codeAt(r, c);
        u32[r * W + x] = code === 0 ? bc[br * V.cols + ((c / k) | 0)] : code === 1 ? 0 : (((r >> 1) + (c >> 1)) & 1 ? nd1 : nd0); } }
    } else {   // P2: 0.1° texel = 2 × 2 native cells, nested inside one 0.5° block (k = 10); x0 = first texel column of this tile
      for (let tr = 0; tr < H; tr++) { for (let tc = 0; tc < W; tc++) {
        const r = 2 * tr, c = 2 * (x0 + tc), a = codeAt(r, c), b = codeAt(r, c + 1), d = codeAt(r + 1, c), e = codeAt(r + 1, c + 1);
        let v;
        if (a === 0 && b === 0 && d === 0 && e === 0) v = bc[((r / k) | 0) * V.cols + ((c / k) | 0)];
        else if (a === 1 && b === 1 && d === 1 && e === 1) v = 0;
        else if (a > 1 && b > 1 && d > 1 && e > 1) v = (tr + tc) & 1 ? nd1 : nd0;
        else v = mixed;
        u32[tr * W + tc] = v; } }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
  function build() {
    const h = harvest(); if (!h) return false;
    const t0 = performance.now(), p = h.gmesh.geometry.parameters || {}, R = h.g.getGlobeRadius() * (1 + OH.ALT);
    const NEAREST = 1003;   // three.js NearestFilter (stable constant); no mipmaps, so the GPU never blends texels
    const tiles = st.tiles;
    const W = (st.path === 'P1' ? OH.NATIVE.cols : OH.NATIVE.cols / 2) / tiles, H = st.path === 'P1' ? OH.NATIVE.rows : OH.NATIVE.rows / 2;
    const phi0 = p.phiStart != null ? p.phiStart : 0, phiL = p.phiLength != null ? p.phiLength : Math.PI * 2;
    for (let t = 0; t < tiles; t++) {
      const cv = paintTile(t * W, W, H, st.path === 'P1' ? 'native' : 'p2');
      const tex = new h.Tex(cv); if ('colorSpace' in tex) tex.colorSpace = 'srgb';
      tex.magFilter = NEAREST; tex.minFilter = NEAREST; tex.generateMipmaps = false; tex.needsUpdate = true;
      const geo = new h.Sphere(R, Math.max(8, Math.round(128 / tiles)), 64, phi0 + phiL * t / tiles, phiL / tiles,
        p.thetaStart != null ? p.thetaStart : 0, p.thetaLength != null ? p.thetaLength : Math.PI);
      const mesh = new h.Mesh(geo, new h.Mat({ map: tex, transparent: true, depthWrite: false }));
      mesh.rotation.set(h.gmesh.rotation.x, h.gmesh.rotation.y, h.gmesh.rotation.z);
      mesh.raycast = () => { };         // never a pick target: taps go to the globe / coverage cells as before
      mesh.renderOrder = -2;            // beneath the day/night shading (−1)
      mesh.__oceanHeat = true;
      st.meshes.push(mesh);
    }
    st.parent = h.gmesh.parent; st.meshes.forEach(m => st.parent.add(m));
    st.texW = W; st.texH = H;
    st.timings.paintMs = Math.round(performance.now() - t0);
    return true;
  }
  function destroy() {
    for (const m of st.meshes) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
    st.meshes = []; st.parent = null;
  }

  // ---------- labels
  const signed = c100 => {   // one decimal, true minus sign, ties away from zero
    const t = Math.sign(c100) * Math.floor(Math.abs(c100) / 10 + 0.5);
    return { tenths: t, text: (t < 0 ? '−' : t > 0 ? '+' : '') + (Math.abs(t) / 10).toFixed(1) };
  };
  const gridText = () => st.path === 'P1'
    ? `averaged on a ${st.valueRes}° grid (about ${st.valueRes === 0.25 ? 28 : 55} km at the equator), coastlines drawn at NOAA's 5 km`
    : `averaged on a 0.5° grid (about 55 km at the equator), drawn at 0.1°; grey squares are mixed coast or ice edge — a tap shows the cell underneath`;
  function keyHtml() {
    const sw = (rgb, a) => `<span style="display:inline-block;width:12px;height:10px;margin-right:3px;vertical-align:-1px;background:rgba(${rgb.join(',')},${(a / 255).toFixed(2)});border:1px solid rgba(255,255,255,.18)"></span>`;
    return `<div><b>Difference from the 1991–2020 normal for this day of year (°C)</b></div>` +
      `<div style="line-height:1.9">${OH.CLASSES.map(c => `<span style="white-space:nowrap">${sw(c.col, OH.ALPHA_WATER)}${esc(c.label)}</span>`).join(' · ')}</div>` +
      `<div>${sw(OH.NODATA[0], OH.ALPHA_NODATA)}sea ice, or no 1991–2020 normal · land: imagery shows through${st.path === 'P2' ? ` · ${sw(OH.MIXED, OH.ALPHA_MIXED)}mixed coast or ice edge` : ''}</div>`;
  }
  function paintLabels() {
    const show = st.on && st.status === 'ready';
    const s = $('oh-status'), k = $('oh-key'), lg = $('oh-legend');
    if (s) { s.hidden = !(st.on || st.why); s.innerHTML = st.status === 'loading' ? 'loading the 9 Nov snapshot…' : show ? `<b>Dated snapshot · NOAA Coral Reef Watch · ${OH.DATE_TEXT}</b><br>${esc(gridText())}` : st.why ? `<b>${esc(st.why)}</b>` : ''; }
    if (k) { k.hidden = !show; if (show) k.innerHTML = keyHtml(); }
    if (lg) { lg.hidden = !show; if (show) lg.innerHTML = `<b>Ocean heat</b> · dated snapshot · NOAA Coral Reef Watch · ${OH.DATE_TEXT} · analysed, not live<br>${keyHtml()}<div>${esc(gridText())}</div>`; }
    const t = $('tgl-oh'); if (t) t.setAttribute('aria-checked', String(st.on));
    if (typeof ME.paintKeyExternal === 'function') ME.paintKeyExternal();
  }

  // ---------- on / off
  async function setOn(on) {
    if (on === st.on) return;
    st.gen++; const gen = st.gen;
    if (!on) { st.on = false; st.status = 'off'; st.why = null; destroy(); paintLabels(); return; }
    st.on = true; st.why = null; st.status = 'loading'; paintLabels();
    if (!ME.globe || !ME.globe()) { st.status = 'unavailable'; st.why = 'Ocean heat needs the 3-D globe, which is not available in this browser. Nothing is drawn.'; st.on = false; return paintLabels(); }
    let why = null;
    try { why = await load(gen); } catch (e) { why = String(e && e.message || e); }
    if (why === 'superseded' || gen !== st.gen || !st.on) return;           // switched off (or again) while loading: never draw
    if (why) { st.status = 'unavailable'; st.why = `Ocean heat unavailable — ${why}. Nothing is drawn.`; st.on = false; destroy(); return paintLabels(); }
    for (let i = 0; i < 50 && !st.meshes.length; i++) { if (build()) break; await new Promise(r => setTimeout(r, 100)); if (gen !== st.gen) return; }
    if (!st.meshes.length) { st.status = 'unavailable'; st.why = 'Ocean heat unavailable — this browser did not expose what the overlay needs. Nothing is drawn.'; st.on = false; return paintLabels(); }
    st.status = 'ready'; st.timings.readyAt = performance.now(); paintLabels();
  }

  // ---------- tap → inspector rows (the tap's own lat/lng; never the nearest water)
  function rowsAt(lat, lng) {
    if (!st.on || st.status !== 'ready' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const nat = cellAt(lat, lng, OH.NATIVE.res, OH.NATIVE.rows, OH.NATIVE.cols), code = codeAt(nat.row, nat.col);
    const V = st.vals, b = cellAt(lat, lng, V.res, V.rows, V.cols), i = b.row * V.cols + b.col;
    const head = ['Ocean heat here', `<span class="q">dated snapshot · NOAA Coral Reef Watch · ${esc(OH.DATE_TEXT)}</span>`];
    const credit = ['Source', `NOAA Coral Reef Watch (files from the NOAA / NESDIS Center for Satellite Applications and Research) — <a href="https://coralreefwatch.noaa.gov/product/5km/index_5km_sst.php" target="_blank" rel="noopener">CoralTemp v3.1</a> and <a href="https://coralreefwatch.noaa.gov/product/5km/index_5km_ssta_clim19912020.php" target="_blank" rel="noopener">SST anomaly, 1991–2020 baseline</a>. Methods article DOI: <a href="https://doi.org/10.3390/rs12233856" target="_blank" rel="noopener">10.3390/rs12233856</a>`, 'more'];
    const method = ['Method', 'Analysed · Satellite-based, with gaps filled by NOAA. An estimate for the surface of a grid cell; it can differ from a nearby beach or buoy reading, says nothing about the water below the surface, and one warm snapshot does not identify a marine heatwave or coral bleaching. NOAA notes anomalies are less reliable at high latitudes.', 'more'];
    if (code === 1) return [head, ['Here', 'Land — no sea temperature'], credit];
    if (code === 3) return [head, ['Here', 'Sea ice — no temperature difference shown'], method, credit];
    if (code === 2) return [head, ['Here', 'No 1991–2020 normal for this location and day of year'], method, credit];
    if (!V.n[i]) return [head, ['Here', 'No data for this location'], credit];   // defensive: water cell in a block without contributors cannot happen
    const a = signed(V.anom[i]);
    const diff = a.tenths === 0 ? '0.0 °C, about the same as usual' : `${a.text} °C ${a.tenths > 0 ? 'warmer' : 'cooler'} than usual`;
    const sst = V.sstOk[i] ? `${(Math.sign(V.sst[i]) * Math.floor(Math.abs(V.sst[i]) / 10 + 0.5) / 10).toFixed(1).replace('-', '−')} °C` : 'unavailable';
    const others = V.k * V.k - V.n[i], land = V.land[i];
    const cells = `${V.n[i]} of ${V.k * V.k} source cells contributed to this average${others && land === others ? ` (the other ${others} are land)` : others ? ` (${others} others: ${land} land, ${others - land} sea ice or without a 1991–2020 normal)` : ''}`;
    return [head, ['Surface temperature', esc(sst)], ['Difference', esc(diff)], ['Compared with', "NOAA's 1991–2020 normal for this location and day of year"],
      ['Data date', esc(OH.DATE_TEXT)], ['Square', esc(`${cells} · ${st.valueRes}° square`)], method, credit];
  }

  // ---------- wiring
  const tgl = $('tgl-oh'); if (tgl) tgl.addEventListener('click', () => setOn(!st.on));
  ME.oceanHeat = {
    on: () => st.on && st.status === 'ready', setOn, rowsAt,
    state: () => ({ on: st.on, status: st.status, why: st.why, path: st.path, valueRes: st.valueRes, tiles: st.tiles, maxTex: st.maxTex, phone: st.phone,
      meshes: st.meshes.length, texture: st.texW ? `${st.texW}x${st.texH}` : null, timings: { ...st.timings }, bytes: { ...st.bytes }, rev: st.man && st.man.revision }),
    options: o => Object.assign(st.opts, o || {}),     // test aid: forcePath 'P1'|'P2', forceTiles n, forceMaxTex px, forcePhone bool (before switching on)
    meshes: () => st.meshes.slice(),
  };
  paintLabels();
})();
