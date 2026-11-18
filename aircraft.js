/* Mother Earth — Aircraft counts and positions (OpenSky Network), aircraft-counts-rc + aircraft-dots-rc.
 * Two optional layers, both off on load, from the same OpenSky snapshot. A collector on Chad's own connection asks the OpenSky
 * Network for one state snapshot about ten times a day. It sends the hub (1) the number of aircraft that reported a position in
 * each 4 degree cell and (2) one latitude and longitude per counted aircraft, rounded to 0.01 degree and ordered by position.
 * This file paints the counts on one transparent sheet over the globe and the positions, as plain dots, on another.
 *
 * Rules this file keeps:
 * - Counts: /cells/opensky, which never carries records. Positions: /snapshot/opensky, drawn ONLY if its record fields are exactly
 *   lat,lng. No aircraft identifier, callsign, altitude, speed, heading or track exists in what the hub serves, and none is drawn.
 * - A dot cannot be tapped, has no label and is never matched to a dot in an earlier snapshot: each snapshot replaces the last.
 * - Counts and positions are never drawn together: switching one on switches the other off.
 * - Dots are cleared once the snapshot is older than its own stale limit (stale_after_s): a position is where an aircraft was.
 * - A cell with no count is drawn as nothing: aircraft are heard only where a volunteer receiver is in range, so no count is not
 *   an empty sky.
 * - The time shown is the time OpenSky gave its snapshot, with its age. It is not the moment every aircraft was heard: each aircraft is
 *   counted at its last reported position, which the collector accepts only up to a stated limit before the snapshot time. The
 *   limit travels with the counts (position_age_cutoff_s) and is printed; counts that do not state it are not drawn.
 * - Snapshot age: Past the stale limit the sheet says so; past HIDE_AFTER_H it is cleared.
 * - Kept out of the observation path like Wind, Ocean heat and Dust RGB: never touches state, points, pmeta, usable() or a globe.gl
 *   data layer (index.html uses those; see START-HERE). The sheet is its own mesh.
 * - Fetched only while the layer is on.
 */
(() => {
  const ME = window.ME; if (!ME) return;
  const $ = ME.$, esc = ME.esc;
  const tgl = $('tgl-air'); if (!tgl) return;
  const AC = { URL: ME.HUB + '/cells/opensky', LAYER: 'opensky', CELL_DEG: 4, ROWS: 45, COLS: 90, PX: 4, ALT: 0.0011, OPACITY: 0.78,
    STALE_FALLBACK_S: 3 * 3600, HIDE_AFTER_H: 6, REFRESH_MS: 10 * 60e3, AGE_MS: 30e3, BUILD_WAIT_MS: 60000,
    // PROVISIONAL bands, chosen from the first private pull (17 Nov 2026: 446 cells, largest cell 172). Each band is [from, colour].
    SCALE: [[1, '#3b2f6b'], [5, '#6a3d9a'], [20, '#b5478c'], [50, '#ef7f4f'], [100, '#ffd166']],
    CREDIT: 'The OpenSky Network, https://opensky-network.org' };
  const st = { on: false, gen: 0, seq: 0, status: 'off', why: null, env: null, meshes: [], loading: false, refreshFailed: false, sel: null, timer: null, ageTimer: null, requests: [], opts: { now: null } };
  const now = () => (st.opts.now != null ? st.opts.now : Date.now());
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = iso => { const d = new Date(iso); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC, ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const ageText = ms => { const m = Math.max(0, Math.floor(ms / 60e3)); return m < 1 ? 'less than a minute ago' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.floor(m / 60)} h ${m % 60} min ago` : `${Math.floor(m / 1440)} days ago`; };
  const band = n => { let k = -1; for (let i = 0; i < AC.SCALE.length; i++) if (n >= AC.SCALE[i][0]) k = i; return k; };
  const cellOf = (lat, lng) => { const l = ((lng + 540) % 360) - 180; return Math.max(0, Math.min(AC.ROWS - 1, Math.floor((lat + 90) / AC.CELL_DEG))) + '_' + Math.max(0, Math.min(AC.COLS - 1, Math.floor((l + 180) / AC.CELL_DEG))); };
  const cellBox = id => { const [r, c] = id.split('_').map(Number); return { s: -90 + r * AC.CELL_DEG, n: -90 + (r + 1) * AC.CELL_DEG, w: -180 + c * AC.CELL_DEG, e: -180 + (c + 1) * AC.CELL_DEG }; };
  const cutText = s => s % 60 === 0 ? `${s / 60} minute${s === 60 ? '' : 's'}` : `${s} seconds`;
  const deg = (v, pos, neg) => `${Math.abs(v)}°${v === 0 ? '' : v > 0 ? pos : neg}`;
  const boxText = b => `${deg(b.s, 'N', 'S')} to ${deg(b.n, 'N', 'S')}, ${deg(b.w, 'E', 'W')} to ${deg(b.e, 'E', 'W')}`;

  /** What the hub served, checked. Returns { ok, env } or { ok: false, why }. Anything that is not counts-only is refused. */
  function check(j) {
    if (!j || typeof j !== 'object' || j.layer !== AC.LAYER) return { ok: false, why: 'the hub returned something that is not the aircraft counts' };
    if (Array.isArray(j.records) && j.records.length) return { ok: false, why: 'the file carries individual records, which this layer never shows' };
    if (j.source_status === 'down') return { ok: false, down: true, why: 'The latest collection did not complete' + (j.retrieved_at && Number.isFinite(Date.parse(j.retrieved_at)) ? ` (${utc(j.retrieved_at)})` : '') + '.' };
    const t = j.window_end; if (!t || !Number.isFinite(Date.parse(t))) return { ok: false, why: 'the counts carry no readable time' };
    const cut = j.position_age_cutoff_s; if (!Number.isFinite(cut) || cut <= 0) return { ok: false, why: 'the counts do not state how old a counted position may be' };
    if (!j.cells || typeof j.cells !== 'object' || Array.isArray(j.cells)) return { ok: false, why: 'the counts are missing' };
    const cells = {}; let total = 0, max = 0;
    for (const id in j.cells) { const m = /^(\d{1,2})_(\d{1,2})$/.exec(id), n = j.cells[id] && j.cells[id].count;
      if (!m || +m[1] >= AC.ROWS || +m[2] >= AC.COLS || !Number.isInteger(n) || n < 0) return { ok: false, why: 'a count in the file is not readable' };
      if (n > 0) { cells[id] = n; total += n; if (n > max) max = n; } }
    return { ok: true, env: { time: t, cutS: cut, retrieved: j.retrieved_at || null, cells, total, max, n: Object.keys(cells).length, degraded: j.source_status === 'degraded',
      staleS: Number.isFinite(j.stale_after_s) && j.stale_after_s > 0 ? j.stale_after_s : AC.STALE_FALLBACK_S, citation: typeof j.citation === 'string' ? j.citation : AC.CREDIT } };
  }
  const ageMs = env => now() - Date.parse(env.time);
  const tooOld = env => ageMs(env) >= AC.HIDE_AFTER_H * 3600e3;
  const stale = env => ageMs(env) >= env.staleS * 1e3;

  // ---------- painting: one canvas, one filled square per counted cell, columns from 180°W to match the globe's own picture
  function compose(env) {
    const px = AC.PX, cv = document.createElement('canvas'); cv.width = 360 * px; cv.height = 180 * px; const c = cv.getContext('2d');
    const s = AC.CELL_DEG * px; let drawn = 0; const bands = AC.SCALE.map(() => 0);
    for (const id in env.cells) { const [r, col] = id.split('_').map(Number), k = band(env.cells[id]); if (k < 0) continue;
      const x = col * s, y = (AC.ROWS - 1 - r) * s;
      c.fillStyle = AC.SCALE[k][1]; c.fillRect(x, y, s, s);
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      drawn++; bands[k]++; }
    cv.__air = { drawn, bands, px };
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
  function buildMesh(cv, alt = AC.ALT, opacity = AC.OPACITY, order = -1) {
    const h = harvest(); if (!h) return null;
    const p = h.gmesh.geometry.parameters || {}, R = h.g.getGlobeRadius() * (1 + alt);
    const tex = new h.Tex(cv); if ('colorSpace' in tex) tex.colorSpace = 'srgb'; tex.needsUpdate = true;
    const geo = new h.Sphere(R, 96, 96, p.phiStart != null ? p.phiStart : 0, p.phiLength != null ? p.phiLength : Math.PI * 2, p.thetaStart != null ? p.thetaStart : 0, p.thetaLength != null ? p.thetaLength : Math.PI);
    const mesh = new h.Mesh(geo, new h.Mat({ map: tex, transparent: true, depthWrite: false, opacity }));
    mesh.rotation.set(h.gmesh.rotation.x, h.gmesh.rotation.y, h.gmesh.rotation.z);
    mesh.raycast = () => { };          // never a pick target: taps go through to the globe
    mesh.renderOrder = order;          // counts −1: above the wind sheet (−4), Dust RGB (−3) and Ocean heat (−2); dots −0.5: above the counts
    mesh.__air = true;
    return { mesh, parent: h.gmesh.parent };
  }
  function destroy() {
    for (const m of st.meshes) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
    st.meshes = [];
  }
  const discard = b => { if (b) { b.mesh.geometry.dispose(); b.mesh.material.map.dispose(); b.mesh.material.dispose(); } };
  function clearAll(why) { destroy(); st.env = null; st.status = 'unknown'; st.why = why; st.sel = null; }

  // ---------- loading
  async function getCounts() {
    st.requests.push(AC.URL.replace(ME.HUB, ''));
    const r = await fetch(AC.URL, { cache: 'no-store' });
    if (r.status === 404) return { ok: false, none: true, why: 'No aircraft count has been collected yet.' };
    if (!r.ok) throw new Error('the hub did not answer (HTTP ' + r.status + ')');
    return check(await r.json());
  }
  async function build(env, gen) {
    const cv = compose(env); let built = null;
    for (const t0 = Date.now(); !built;) { built = buildMesh(cv); if (built) break; if (Date.now() - t0 > AC.BUILD_WAIT_MS) break; await new Promise(r => setTimeout(r, 200)); if (gen !== st.gen) return null; }
    if (!built) throw new Error('the globe has not finished loading its own picture, so the layer cannot be drawn on it');
    return built;
  }
  const oldWhy = env => `The newest snapshot is from ${utc(env.time)}, more than ${AC.HIDE_AFTER_H} hours ago.`;
  /** Fetch, check, build, then swap sheet and labels in one step. A failed refresh leaves what is shown, and says so. */
  async function load(isRefresh) {
    if (st.loading) return;
    const gen = st.gen, seq = ++st.seq; st.loading = true; paint();
    const late = () => gen !== st.gen || seq !== st.seq || !st.on;
    try {
      let res, err = null; try { res = await getCounts(); } catch (e) { err = e; }
      if (late()) return;
      if (err) { if (st.env && isRefresh) st.refreshFailed = true; else clearAll('The aircraft counts could not be loaded: ' + (err.message || err) + '.'); return; }
      if (!res.ok) {
        // a down report or an unreadable file never leaves an older count on screen under a newer failure
        if (res.down || res.none) clearAll(res.why); else clearAll('The aircraft counts could not be shown: ' + res.why + '.');
        return;
      }
      const env = res.env;
      if (st.env && Date.parse(env.time) < Date.parse(st.env.time)) { st.refreshFailed = false; return; }   // never go back to an older count
      if (st.env && env.time === st.env.time) { st.refreshFailed = false; return; }
      if (tooOld(env)) { clearAll(oldWhy(env)); return; }
      let built = null; try { built = await build(env, gen); } catch (e) { err = e; }
      if (late()) return discard(built);
      if (err || !built) { if (!st.env) clearAll('The aircraft counts could not be drawn: ' + ((err && err.message) || 'unknown reason') + '.'); else st.refreshFailed = true; return; }
      if (tooOld(env)) { discard(built); clearAll(oldWhy(env)); return; }   // checked again at the moment of drawing
      destroy(); built.parent.add(built.mesh); st.meshes = [built.mesh]; st.env = env; st.status = 'ready'; st.why = null; st.refreshFailed = false;
    } finally { if (gen === st.gen && seq === st.seq) { st.loading = false; paint(); } }
  }
  function ageTick() { if (!st.on) return; if (st.env && tooOld(st.env)) clearAll(`The snapshot shown was from ${utc(st.env.time)}, more than ${AC.HIDE_AFTER_H} hours ago, and has been cleared.`); paint(); }

  // ---------- labels
  function reading(env, lat, lng) {
    const id = cellOf(lat, lng), n = env.cells[id] || 0, b = boxText(cellBox(id));
    return n > 0 ? { n, id, text: `${n.toLocaleString()} aircraft counted in this cell (${b})` } : { n: 0, id, text: `No aircraft counted in this cell (${b}). That is not an empty sky: aircraft are heard only where a volunteer receiver is in range.` };
  }
  function paint() {
    const s = $('s-air'), o = $('o-air'), fl = $('air-frame'), ex = $('air-extra'), rd = $('air-read');
    tgl.setAttribute('aria-checked', String(st.on));
    const isStale = st.on && st.env && stale(st.env);
    s.textContent = !st.on ? 'off' : st.env ? (isStale ? 'stale' : 'loaded') : st.loading ? 'loading' : 'unknown';
    s.className = 'state' + (st.on && st.env ? (isStale ? ' warn' : ' ok') : st.on && !st.loading ? ' bad' : '');
    if (!st.on) { fl.hidden = true; ex.hidden = true; rd.textContent = ''; o.hidden = false; o.textContent = st.why || 'Off. Switch on to load the newest aircraft counts.'; return; }
    if (st.env) {
      const e = st.env; fl.hidden = false; o.hidden = true;
      fl.innerHTML = `<b>OpenSky snapshot of ${esc(utc(e.time))}</b> (${esc(ageText(ageMs(e)))})<br><span class="wind-lv">${e.total.toLocaleString()} aircraft counted, in ${e.n.toLocaleString()} cells</span>`;
      const bits = [`Each aircraft is counted where it last reported a position, no more than ${cutText(e.cutS)} before the snapshot time. One snapshot, not a live view. No individual aircraft is shown or stored.`];
      if (isStale) bits.push(`This count is more than ${Math.round(e.staleS / 3600)} hours old; it is cleared at ${AC.HIDE_AFTER_H} hours.`);
      if (e.degraded) bits.push('The collector marked this count as incomplete.');
      if (st.refreshFailed) bits.push('Refresh unavailable.');
      ex.hidden = false; ex.textContent = bits.join(' ');
      rd.textContent = st.sel ? reading(e, st.sel.lat, st.sel.lng).text + ` · snapshot of ${utc(e.time)}` : 'Tap the globe to read the count for that cell.';
    } else {
      fl.hidden = true; ex.hidden = true; rd.textContent = ''; o.hidden = false;
      o.textContent = st.loading ? 'Loading the newest aircraft counts…' : (st.why || 'No aircraft count is available.') + ' Nothing is drawn.';
    }
  }

  // ---------- on / off
  async function setOn(on) {
    if (on === st.on) return;
    st.gen++;
    if (!on) { st.on = false; st.status = 'off'; st.why = null; st.loading = false; st.refreshFailed = false; st.sel = null; destroy(); st.env = null;
      clearInterval(st.timer); clearInterval(st.ageTimer); st.timer = st.ageTimer = null; paint(); return; }
    if (dt.on) await dotsSetOn(false);   // counts and positions are never drawn together (Chad, 17 Nov): one on switches the other off
    st.on = true; st.why = null; st.status = 'loading'; paint();
    if (!ME.globe || !ME.globe()) { st.on = false; st.status = 'off'; st.why = 'Aircraft counts need the 3-D globe, which is not available in this browser. Nothing is drawn.'; st.gen++; return paint(); }
    st.timer = setInterval(() => { if (!document.hidden) load(true); }, AC.REFRESH_MS);
    st.ageTimer = setInterval(ageTick, AC.AGE_MS);
    await load(false);
  }
  tgl.addEventListener('click', () => setOn(!st.on));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.on) { ageTick(); load(true); } });
  (ME.taps = ME.taps || []).push((lat, lng) => { if (st.on && st.env && Number.isFinite(lat) && Number.isFinite(lng)) { st.sel = { lat, lng }; paint(); } });
  { const el = $('air-key'); if (el) el.innerHTML = AC.SCALE.map(([v, c], k) => `<span class="b"><i style="background:${c}"></i>${k === AC.SCALE.length - 1 ? v + '+' : v + '–' + (AC.SCALE[k + 1][0] - 1)}</span>`).join('') + '<span class="u">aircraft per 4° cell (bands provisional) · no colour = no count, not an empty sky</span>'; }


  // ====================================================================== positions as plain dots (aircraft-dots-rc)
  const DT = { URL: ME.HUB + '/snapshot/opensky', FIELDS: ['lat', 'lng'], W: 4096, H: 2048, R_PX: 2.2, ALT: 0.0016, OPACITY: 1, ORDER: -0.5,
    FILL: '#e84ab5', EDGE: 'rgba(8,12,20,0.75)', REFRESH_MS: 10 * 60e3, AGE_MS: 30e3, MAX: 60000 };
  const dt = { on: false, gen: 0, seq: 0, why: null, env: null, meshes: [], loading: false, refreshFailed: false, timer: null, ageTimer: null, requests: [], opts: { source: null } };
  const dtgl = $('tgl-airdots');
  /** What the hub served, checked. Positions are drawn only from a file whose record fields are exactly lat,lng. */
  function checkDots(j) {
    if (!j || typeof j !== 'object' || j.layer !== AC.LAYER) return { ok: false, why: 'the hub returned something that is not the aircraft snapshot' };
    if (j.source_status === 'down') return { ok: false, down: true, why: 'The latest collection did not complete' + (j.retrieved_at && Number.isFinite(Date.parse(j.retrieved_at)) ? ` (${utc(j.retrieved_at)})` : '') + '.' };
    const t = j.window_end; if (!t || !Number.isFinite(Date.parse(t))) return { ok: false, why: 'the snapshot carries no readable time' };
    const cut = j.position_age_cutoff_s; if (!Number.isFinite(cut) || cut <= 0) return { ok: false, why: 'the snapshot does not state how old a position may be' };
    // The hub says when it is holding positions back (hub 0.6.18): after three hours from the snapshot time, or while switched off.
    if (j.positions === 'withheld_expired') return { ok: false, none: true, why: `The newest snapshot is from ${utc(t)}, more than ${Math.round((Number.isFinite(j.positions_max_age_s) ? j.positions_max_age_s : AC.STALE_FALLBACK_S) / 3600)} hours ago. Aircraft have long since moved, so its positions are no longer served.` };
    if (j.positions === 'withheld_off') return { ok: false, none: true, why: `Aircraft positions are not being published at the moment (newest snapshot: ${utc(t)}).` };
    const f = j.record_fields, rows = j.records;
    if (!Array.isArray(f) || !Array.isArray(rows)) return { ok: false, why: 'the snapshot carries no list of positions' };
    if (f.length === 0 && rows.length === 0) return { ok: false, none: true, why: `The newest snapshot (${utc(t)}) carries counts only: no positions have been collected yet.` };
    if (f.length !== DT.FIELDS.length || f.some((x, i) => x !== DT.FIELDS[i])) return { ok: false, why: 'the file carries more than a latitude and a longitude for each aircraft, which this layer never shows' };
    if (rows.length > DT.MAX) return { ok: false, why: 'the snapshot carries more positions than this layer draws' };
    const pts = new Float32Array(rows.length * 2);
    for (let i = 0; i < rows.length; i++) { const r = rows[i];
      if (!Array.isArray(r) || r.length !== 2 || typeof r[0] !== 'number' || typeof r[1] !== 'number' || !Number.isFinite(r[0]) || !Number.isFinite(r[1]) || r[0] < -90 || r[0] > 90 || r[1] < -180 || r[1] > 180) return { ok: false, why: 'a position in the file is not readable' };
      pts[2 * i] = r[0]; pts[2 * i + 1] = r[1]; }
    return { ok: true, env: { time: t, cutS: cut, pts, n: rows.length, degraded: j.source_status === 'degraded', step: Number.isFinite(j.position_precision_deg) && j.position_precision_deg > 0 ? j.position_precision_deg : null,
      staleS: Number.isFinite(j.stale_after_s) && j.stale_after_s > 0 ? j.stale_after_s : AC.STALE_FALLBACK_S } };
  }
  const dotsOld = env => ageMs(env) >= env.staleS * 1e3;
  const dotsOldWhy = env => `The newest snapshot is from ${utc(env.time)}, more than ${Math.round(env.staleS / 3600)} hours ago. Aircraft have long since moved, so no positions are drawn.`;
  function composeDots(env) {
    const cv = document.createElement('canvas'); cv.width = DT.W; cv.height = DT.H; const c = cv.getContext('2d'), r = DT.R_PX, TAU = Math.PI * 2; let drawn = 0;
    const put = (x, y, rad) => { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, TAU); };
    for (const [rad, col] of [[r + 1.2, DT.EDGE], [r, DT.FILL]]) {   // every dark edge first, then every dot, so a dot is never hidden under a neighbour's edge
      c.fillStyle = col; c.beginPath();
      for (let i = 0; i < env.n; i++) { const x = (env.pts[2 * i + 1] + 180) / 360 * DT.W, y = (90 - env.pts[2 * i]) / 180 * DT.H;
        put(x, y, rad); if (x < rad + 2) put(x + DT.W, y, rad); else if (x > DT.W - rad - 2) put(x - DT.W, y, rad);   // the 180° seam
        if (col === DT.FILL) drawn++; }
      c.fill(); }
    cv.__airdots = { drawn, w: DT.W, h: DT.H, r };
    return cv;
  }
  function dotsDestroy() { for (const m of dt.meshes) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } } dt.meshes = []; }
  function dotsClear(why) { dotsDestroy(); dt.env = null; dt.why = why; }
  async function getDots() {
    if (typeof dt.opts.source === 'function') return checkDots(await dt.opts.source());   // tests and previews: a supplied file in place of the hub's
    dt.requests.push(DT.URL.replace(ME.HUB, ''));
    const r = await fetch(DT.URL, { cache: 'no-store' });
    if (r.status === 404) return { ok: false, none: true, why: 'No aircraft snapshot has been collected yet.' };
    if (!r.ok) throw new Error('the hub did not answer (HTTP ' + r.status + ')');
    return checkDots(await r.json());
  }
  async function dotsLoad(isRefresh) {
    if (dt.loading) return;
    const gen = dt.gen, seq = ++dt.seq; dt.loading = true; dotsPaint();
    const late = () => gen !== dt.gen || seq !== dt.seq || !dt.on;
    try {
      let res, err = null; try { res = await getDots(); } catch (e) { err = e; }
      if (late()) return;
      if (err) { if (dt.env && isRefresh) dt.refreshFailed = true; else dotsClear('The aircraft positions could not be loaded: ' + (err.message || err) + '.'); return; }
      if (!res.ok) { dotsClear(res.down || res.none ? res.why : 'The aircraft positions could not be shown: ' + res.why + '.'); return; }   // never an older snapshot's dots under a newer failure
      const env = res.env;
      if (dt.env && Date.parse(env.time) <= Date.parse(dt.env.time)) { dt.refreshFailed = false; return; }
      if (dotsOld(env)) { dotsClear(dotsOldWhy(env)); return; }
      const cv = composeDots(env); let built = null;
      for (const t0 = Date.now(); !built;) { built = buildMesh(cv, DT.ALT, DT.OPACITY, DT.ORDER); if (built) break; if (Date.now() - t0 > AC.BUILD_WAIT_MS) break; await new Promise(r => setTimeout(r, 200)); if (late()) return; }
      if (late()) return discard(built);
      if (!built) { if (!dt.env) dotsClear('The aircraft positions could not be drawn: the globe has not finished loading its own picture.'); else dt.refreshFailed = true; return; }
      built.mesh.__air = false; built.mesh.__airdots = true;
      dotsDestroy(); built.parent.add(built.mesh); dt.meshes = [built.mesh]; dt.env = env; dt.why = null; dt.refreshFailed = false;   // the earlier snapshot's dots are destroyed in the same step
    } finally { if (gen === dt.gen && seq === dt.seq) { dt.loading = false; dotsPaint(); } }
  }
  function dotsAgeTick() { if (!dt.on) return; if (dt.env && dotsOld(dt.env)) dotsClear(`The positions shown were from ${utc(dt.env.time)}, more than ${Math.round(dt.env.staleS / 3600)} hours ago, and have been cleared.`); dotsPaint(); }
  function dotsPaint() {
    if (!dtgl) return;
    const s = $('s-airdots'), o = $('o-airdots'), fl = $('airdots-frame'), ex = $('airdots-extra');
    dtgl.setAttribute('aria-checked', String(dt.on));
    s.textContent = !dt.on ? 'off' : dt.env ? 'loaded' : dt.loading ? 'loading' : 'unknown';
    s.className = 'state' + (dt.on && dt.env ? ' ok' : dt.on && !dt.loading ? ' bad' : '');
    if (!dt.on) { fl.hidden = true; ex.hidden = true; o.hidden = false; o.textContent = dt.why || 'Off. Switch on to load the positions in the newest snapshot.'; return; }
    if (dt.env) {
      const e = dt.env; fl.hidden = false; o.hidden = true;
      fl.innerHTML = `<b>OpenSky snapshot of ${esc(utc(e.time))}</b> (${esc(ageText(ageMs(e)))})<br><span class="wind-lv">${e.n.toLocaleString()} aircraft positions</span>`;
      const bits = [`Each dot is where an aircraft last reported a position, no more than ${cutText(e.cutS)} before the snapshot time${e.step ? `, rounded to ${e.step}°` : ''}. One snapshot, not a live view: every aircraft has moved since. A dot says nothing else about an aircraft, cannot be tapped, and is not followed from one snapshot to the next.`,
        `Cleared when the snapshot is ${Math.round(e.staleS / 3600)} hours old.`];
      if (e.degraded) bits.push('The collector marked this snapshot as incomplete.');
      if (dt.refreshFailed) bits.push('Refresh unavailable.');
      ex.hidden = false; ex.textContent = bits.join(' ');
    } else {
      fl.hidden = true; ex.hidden = true; o.hidden = false;
      o.textContent = dt.loading ? 'Loading the positions in the newest snapshot…' : (dt.why || 'No aircraft positions are available.') + ' Nothing is drawn.';
    }
  }
  async function dotsSetOn(on) {
    if (!dtgl || on === dt.on) return;
    dt.gen++;
    if (!on) { dt.on = false; dt.why = null; dt.loading = false; dt.refreshFailed = false; dotsDestroy(); dt.env = null; clearInterval(dt.timer); clearInterval(dt.ageTimer); dt.timer = dt.ageTimer = null; dotsPaint(); return; }
    if (st.on) await setOn(false);       // the other half of the same rule
    dt.on = true; dt.why = null; dotsPaint();
    if (!ME.globe || !ME.globe()) { dt.on = false; dt.why = 'Aircraft positions need the 3-D globe, which is not available in this browser. Nothing is drawn.'; dt.gen++; return dotsPaint(); }
    dt.timer = setInterval(() => { if (!document.hidden) dotsLoad(true); }, DT.REFRESH_MS);
    dt.ageTimer = setInterval(dotsAgeTick, DT.AGE_MS);
    await dotsLoad(false);
  }
  if (dtgl) {
    dtgl.addEventListener('click', () => dotsSetOn(!dt.on));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && dt.on) { dotsAgeTick(); dotsLoad(true); } });
  }

  // read-only aids for tests and the console
  ME.aircraft = { state: () => ({ on: st.on, status: st.status, why: st.why, time: st.env ? st.env.time : null, cutS: st.env ? st.env.cutS : null, total: st.env ? st.env.total : null, cells: st.env ? st.env.n : null,
      meshes: st.meshes.length, inScene: st.meshes.filter(m => m.parent).length, loading: st.loading, refreshFailed: st.refreshFailed, requests: st.requests.slice(), sel: st.sel,
      label: $('air-frame').hidden ? null : $('air-frame').textContent, extra: $('air-extra').hidden ? null : $('air-extra').textContent, off: $('o-air').hidden ? null : $('o-air').textContent,
      read: $('air-read').textContent, stateWord: $('s-air').textContent, drawn: st.meshes[0] && st.meshes[0].material.map.image.__air || null }),
    setOn, refresh: () => load(true), ageTick, select: (lat, lng) => { if (st.on && st.env) { st.sel = { lat, lng }; paint(); } }, opts: st.opts, config: AC, check, band, cellOf,
    reading: (lat, lng) => st.env ? reading(st.env, lat, lng) : null, texture: () => (st.meshes[0] && st.meshes[0].material.map && st.meshes[0].material.map.image) || null,
    dots: { state: () => ({ on: dt.on, why: dt.why, time: dt.env ? dt.env.time : null, n: dt.env ? dt.env.n : null, meshes: dt.meshes.length, inScene: dt.meshes.filter(m => m.parent).length, loading: dt.loading, refreshFailed: dt.refreshFailed,
        requests: dt.requests.slice(), stateWord: dtgl ? $('s-airdots').textContent : null, label: dtgl && !$('airdots-frame').hidden ? $('airdots-frame').textContent : null, extra: dtgl && !$('airdots-extra').hidden ? $('airdots-extra').textContent : null,
        off: dtgl && !$('o-airdots').hidden ? $('o-airdots').textContent : null, drawn: dt.meshes[0] && dt.meshes[0].material.map.image.__airdots || null }),
      setOn: dotsSetOn, refresh: () => dotsLoad(true), ageTick: dotsAgeTick, opts: dt.opts, config: DT, check: checkDots, compose: composeDots } };
  paint(); dotsPaint();
})();
