/* Mother Earth — Dust RGB imagery (DUST-RGB-LAYER-PROPOSAL rev 5).
 * An optional layer, off on load. The hub fetches EUMETSAT's Dust RGB frame (Meteosat Third Generation, 0°) twice a day and
 * serves one picture plus its footprint mask; this file paints that pair on the part of the globe the satellite sees.
 * - Nothing is requested while the layer is off. On: the hub's pointer, then exactly one picture and one mask.
 * - Both files are checked against the SHA-256 values in the pointer before anything is drawn.
 * - The picture, the mask and the time line change together, only after the replacement has loaded and decoded.
 * - A failed first load paints nothing. A failed refresh keeps the frame already shown, with its own time, until it is
 *   older than UNKNOWN_AFTER_H; then it is cleared.
 * - The time shown is the time the hub REQUESTED from EUMETSAT's list of frames. EUMETSAT's service can return the nearest
 *   available frame instead and does not say which; if the hub ever learns the served time, the label says "Frame".
 * - Kept out of the observation path like Ocean heat: never touches state, points, pmeta, usable() or a globe.gl layer.
 */
(() => {
  const ME = window.ME; if (!ME) return;
  const $ = ME.$, esc = ME.esc;
  const tgl = $('tgl-dustrgb'); if (!tgl) return;
  const DR = { META: ME.HUB + '/snapshot/dustrgb/meta', STALE_AFTER_H: 14, UNKNOWN_AFTER_H: 24, REFRESH_MS: 10 * 60e3, AGE_MS: 30e3,
    ALT: 0.0006, OPACITY: 0.82, TEX: 2048, TEX_PHONE: 1024, OUTLINE: 'rgba(255,255,255,0.9)', OUTLINE_FRAC: 0.006,
    BUILD_WAIT_MS: 60000 };   // how long to wait for the globe's own picture (the layer borrows the globe's drawing classes from it)
  const st = { on: false, gen: 0, status: 'off', why: null, frame: null, meta: null, meshes: [], refreshFailed: false, lastAttempt: null,
    timer: null, ageTimer: null, loading: false, requests: [], opts: { now: null } };
  const now = () => (st.opts.now ? st.opts.now() : Date.now());
  const hex = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = iso => { const d = new Date(iso); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`; };
  const hhmm = iso => { const d = new Date(iso); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`; };
  const frameTime = f => f.served_time || f.requested_time;
  const ageMs = f => now() - Date.parse(frameTime(f));
  const ageText = ms => { const m = Math.max(0, Math.floor(ms / 60e3)); return m < 60 ? `${m} min old` : `${Math.floor(m / 60)} h old`; };
  const grade = f => { const h = ageMs(f) / 3600e3; return h > DR.UNKNOWN_AFTER_H ? 'unknown' : h > DR.STALE_AFTER_H ? 'stale' : 'current'; };

  // ---------- painting (the Ocean heat method: a textured partial sphere just above the surface)
  function harvest() {
    const g = ME.globe && ME.globe(); if (!g || typeof g.scene !== 'function' || typeof g.globeMaterial !== 'function') return null;
    const gm = g.globeMaterial(); let gmesh = null, Mat = null, Tex = null;
    g.scene().traverse(o => { if (!o.isMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m === gm) gmesh = o; if (m) { Mat = Mat || m.constructor; if (m.map) Tex = Tex || m.map.constructor; } });
    if (gm && gm.map) Tex = Tex || gm.map.constructor;
    if (!gmesh || !gmesh.geometry || !/Sphere/i.test(gmesh.geometry.type || '') || !Mat || !Tex || !gmesh.parent) return null;
    return { g, gmesh, Sphere: gmesh.geometry.constructor, Mesh: gmesh.constructor, Mat, Tex };
  }
  /** One canvas: the picture, cut to the mask's footprint, with a thin outline along the footprint's edge. */
  function compose(pic, mask) {
    const N = matchMedia('(max-width:720px)').matches ? DR.TEX_PHONE : DR.TEX;
    const cv = document.createElement('canvas'); cv.width = N; cv.height = N; const c = cv.getContext('2d');
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(pic, 0, 0, N, N);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0, N, N);        // keep the picture only where the mask is opaque
    // outline = the mask's shape minus the same shape shrunk slightly about the centre
    const ring = document.createElement('canvas'); ring.width = N; ring.height = N; const r = ring.getContext('2d');
    r.imageSmoothingEnabled = true; r.fillStyle = DR.OUTLINE; r.fillRect(0, 0, N, N);
    r.globalCompositeOperation = 'destination-in'; r.drawImage(mask, 0, 0, N, N);
    const k = 1 - 2 * DR.OUTLINE_FRAC, o = N * DR.OUTLINE_FRAC;
    r.globalCompositeOperation = 'destination-out'; r.drawImage(mask, o, o, N * k, N * k);
    c.globalCompositeOperation = 'source-over'; c.drawImage(ring, 0, 0);
    return cv;
  }
  function buildMesh(cv, box) {
    const h = harvest(); if (!h) return null;
    const p = h.gmesh.geometry.parameters || {}, R = h.g.getGlobeRadius() * (1 + DR.ALT);
    const phi0 = p.phiStart != null ? p.phiStart : 0, phiL = p.phiLength != null ? p.phiLength : Math.PI * 2;
    const th0 = p.thetaStart != null ? p.thetaStart : 0, thL = p.thetaLength != null ? p.thetaLength : Math.PI;
    const tex = new h.Tex(cv); if ('colorSpace' in tex) tex.colorSpace = 'srgb'; tex.needsUpdate = true;
    const geo = new h.Sphere(R, 96, 96, phi0 + phiL * (box.west + 180) / 360, phiL * (box.east - box.west) / 360, th0 + thL * (90 - box.north) / 180, thL * (box.north - box.south) / 180);
    const mesh = new h.Mesh(geo, new h.Mat({ map: tex, transparent: true, depthWrite: false, opacity: DR.OPACITY }));
    mesh.rotation.set(h.gmesh.rotation.x, h.gmesh.rotation.y, h.gmesh.rotation.z);
    mesh.raycast = () => { };          // never a pick target
    mesh.renderOrder = -3;             // beneath Ocean heat (−2) and the day/night shading (−1)
    mesh.__dustRgb = true;
    return { mesh, parent: h.gmesh.parent };
  }
  function destroy() {
    for (const m of st.meshes) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
    st.meshes = [];
  }

  // ---------- loading
  const hubFetch = async (url, init) => { st.requests.push(url.replace(ME.HUB, '')); return fetch(url, init); };
  async function getMeta() {
    const r = await hubFetch(DR.META, { cache: 'no-store' });
    if (!r.ok) throw new Error('the hub did not answer (HTTP ' + r.status + ')');
    return r.json();
  }
  async function getFile(f) {
    const r = await hubFetch(ME.HUB + f.path);
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) throw new Error('a frame file could not be loaded');
    const b = await r.arrayBuffer();
    if (b.byteLength !== f.bytes || await hex(b) !== f.sha256) throw new Error('a frame file did not match its fingerprint');
    try { return await createImageBitmap(new Blob([b], { type: f.type })); } catch (e) { throw new Error('a frame file could not be decoded'); }
  }
  /** Load one frame fully (both files verified and decoded, mesh built) without touching what is shown. */
  async function prepare(frame, gen) {
    const pic = await getFile(frame.picture); if (gen !== st.gen) return null;
    const mask = await getFile(frame.mask); if (gen !== st.gen) return null;
    const cv = compose(pic, mask);
    let built = null;
    for (const t0 = Date.now(); !built;) { built = buildMesh(cv, frame.box); if (built) break; if (Date.now() - t0 > DR.BUILD_WAIT_MS) break; await new Promise(r => setTimeout(r, 200)); if (gen !== st.gen) return null; }
    if (!built) throw new Error('the globe has not finished loading its own picture, so the layer cannot be drawn on it');
    return built;
  }
  /** Swap in one step: mesh, frame and labels together. */
  function show(frame, built) {
    destroy(); built.parent.add(built.mesh); st.meshes = [built.mesh]; st.frame = frame; st.refreshFailed = false;
  }
  function clearFrame(why) { destroy(); st.frame = null; st.status = 'unknown'; st.why = why; }

  // ---------- labels
  function paint() {
    const s = $('s-dustrgb'), o = $('o-dustrgb'), fl = $('dustrgb-frame'), ex = $('dustrgb-extra');
    tgl.setAttribute('aria-checked', String(st.on));
    const f = st.frame;
    const g = f ? grade(f) : null;
    s.textContent = !st.on ? 'off' : st.status === 'loading' && !f ? 'loading' : f ? g : 'unknown';
    s.className = 'state' + (st.on && f && g === 'current' ? ' ok' : st.on && f && g === 'stale' ? ' warn' : st.on && st.status !== 'loading' ? ' bad' : '');
    if (!st.on) { fl.hidden = true; ex.hidden = true; o.hidden = false; o.textContent = st.why || 'Off. Switch on to load the latest Dust RGB frame.'; return; }
    if (f) {
      fl.hidden = false; o.hidden = true;
      fl.innerHTML = `<b>${f.served_time ? 'Frame' : 'Frame requested'}: ${esc(utc(frameTime(f)))}</b> · ${esc(ageText(ageMs(f)))}`;
      const bits = ['Meteosat (MTG) at 0° · Updated twice daily.'];
      if (st.lastAttempt) bits.push(`Latest update failed at ${hhmm(st.lastAttempt.failed_at)}.`);
      if (st.refreshFailed) bits.push('Refresh unavailable.');
      ex.hidden = false; ex.textContent = bits.join(' ');
    } else {
      fl.hidden = true; ex.hidden = true; o.hidden = false;
      o.textContent = st.status === 'loading' ? 'Loading the latest frame…' : (st.why || 'No frame is available.') + ' Nothing is drawn.';
    }
  }

  // ---------- on / off / refresh
  async function refresh(first) {
    if (!st.on || st.loading) return;
    st.loading = true; const gen = st.gen;
    try {
      let meta;
      try { meta = await getMeta(); } catch (e) {
        if (gen !== st.gen) return;
        if (st.frame) st.refreshFailed = true; else { st.status = 'unknown'; st.why = 'The latest frame could not be loaded: ' + (e.message || e) + '.'; }
        return;
      }
      if (gen !== st.gen) return;
      st.meta = meta; st.lastAttempt = meta.last_attempt || null;
      const f = meta.frame;
      if (!f) { if (!st.frame) { st.status = 'unknown'; st.why = 'The hub has no Dust RGB frame yet.'; } return; }
      if (grade(f) === 'unknown') {   // too old to belong on "Earth now": nothing is fetched or painted
        clearFrame(`The newest frame is from ${utc(frameTime(f))}, more than ${DR.UNKNOWN_AFTER_H} hours ago.`); return; }
      if (st.frame && st.frame.id === f.id) { st.refreshFailed = false; return; }   // already shown: never fetched again
      let built;
      try { built = await prepare(f, gen); } catch (e) {
        if (gen !== st.gen) return;
        if (st.frame) st.refreshFailed = true; else { st.status = 'unknown'; st.why = 'The latest frame could not be loaded: ' + (e.message || e) + '.'; }
        return;
      }
      if (!built || gen !== st.gen || !st.on) { if (built) { built.mesh.geometry.dispose(); built.mesh.material.map.dispose(); built.mesh.material.dispose(); } return; }   // switched off while loading: a late response never paints
      show(f, built); st.status = 'ready'; st.why = null;
    } finally { if (gen === st.gen) { st.loading = false; paint(); } }
  }
  function ageTick() {
    if (!st.on) return;
    if (st.frame && grade(st.frame) === 'unknown') clearFrame(`The frame shown was more than ${DR.UNKNOWN_AFTER_H} hours old and has been cleared.`);
    paint();
  }
  async function setOn(on) {
    if (on === st.on) return;
    st.gen++;
    if (!on) { st.on = false; st.status = 'off'; st.why = null; st.loading = false; st.refreshFailed = false; st.lastAttempt = null; destroy(); st.frame = null;
      clearInterval(st.timer); clearInterval(st.ageTimer); st.timer = st.ageTimer = null; paint(); return; }
    st.on = true; st.why = null; st.status = 'loading'; paint();
    if (!ME.globe || !ME.globe()) { st.on = false; st.status = 'off'; st.why = 'Dust RGB imagery needs the 3-D globe, which is not available in this browser. Nothing is drawn.'; st.gen++; return paint(); }
    st.timer = setInterval(() => { if (!document.hidden) refresh(false); }, DR.REFRESH_MS);
    st.ageTimer = setInterval(ageTick, DR.AGE_MS);
    await refresh(true);
  }
  tgl.addEventListener('click', () => setOn(!st.on));

  // read-only aids for tests and the console
  ME.dustRgb = { state: () => ({ on: st.on, status: st.status, why: st.why, frameId: st.frame ? st.frame.id : null, grade: st.frame ? grade(st.frame) : null, meshes: st.meshes.length,
      refreshFailed: st.refreshFailed, lastAttempt: st.lastAttempt, requests: st.requests.slice(), label: $('dustrgb-frame').hidden ? null : $('dustrgb-frame').textContent,
      extra: $('dustrgb-extra').hidden ? null : $('dustrgb-extra').textContent, off: $('o-dustrgb').hidden ? null : $('o-dustrgb').textContent, stateWord: $('s-dustrgb').textContent,
      inScene: st.meshes.filter(m => m.parent).length, loading: st.loading }),
    refresh: () => refresh(false), ageTick, setOn, opts: st.opts, config: DR,
    texture: () => (st.meshes[0] && st.meshes[0].material.map && st.meshes[0].material.map.image) || null };
  paint();
})();
