/* Mother Earth — Animal journey: a dated replay of one tracked animal's recorded fixes (animals-zebra-preview-rc;
 * docs/concepts/ANIMALS-PROPOSAL.md rev 2.2). PRIVATE PREVIEW. From animals-journeys-preview-rc (19 Nov 2026): one switch and a
 * chooser over three recorded journeys (zebra Z3866 by GPS; white shark tag 118845 and false killer whale tag 98364 by Argos, each
 * filtered at build time by phase1/animals/build_argos_journey.py). A dated archive feature: Chad's decision of 19 Nov 2026 allows
 * recorded journeys on the Animals tab; every other layer keeps the live-feed rule.
 * Argos journeys carry a quality class per fix (shown with the fix) and a per-step join flag made at build time: a step is joined
 * only if it is within the journey's time limit AND the build found the drawn line clear of land in its land map.
 * One optional layer, off on load. Nothing is requested while it is off.
 * Rules this file keeps:
 *  - Observation-based. The marker is only ever on a recorded fix: the last one at or before the replay time. Nothing is
 *    interpolated, smoothed, thinned or modelled. Only the past is drawn: fixes and lines later than the replay time are not on
 *    the globe, and scrubbing backwards removes them.
 *  - The line joins consecutive recorded fixes. It never joins two fixes more than the study's gap rule apart (the manifest's
 *    gap_rule.max_join_seconds; for this study 3 hours, a Mother Earth display rule, not the researchers').
 *  - Times are the source's own, to the second, printed in UTC. The visitor's time zone is never used.
 *  - Replay time is not the globe's time. No replay control touches another layer's clock, date, data or selection, the header
 *    clock, the imagery or the day/night shading. This file writes only to its own card, its own replay bar and its own objects.
 *  - Files are verified before anything is drawn: the manifest against the sha256 pinned here, the display file against the
 *    manifest's sha256, then counts, end times, order and coordinate ranges. A file that fails draws nothing.
 *  - Switching off stops playback, aborts a request in flight and refuses any answer that still arrives (a late answer draws nothing), removes and disposes every object
 *    this file added, hides the replay bar and takes the entry out of the Key.
 *  - The Sky zoom-out view pauses and hides the journey and restores it, paused, at the same replay time. A hidden browser tab
 *    pauses playback and keeps the replay. A new page load starts bare: nothing is remembered. Leaving the page switches the
 *    journey off, so a page restored by Back also starts bare.
 *  - Its own scene objects, never a globe.gl data layer (the page uses those for other layers and redraws them).
 * The Key and "Key · N layers" follow drawn(): the journey counts only while its objects are on the globe and visible. */
(() => {
  const ME = window.ME = window.ME || {};
  const $ = id => document.getElementById(id);
  const tgl = $('tgl-journey'); if (!tgl) return;
  const J = {
    CATALOG: 'assets/animals/journeys-R1.catalog.json',          // the list of journeys; it pins each study's manifest, which pins its display file
    CATALOG_SHA256: 'a25cdce33091e0b1a62f4cce35c93f26b192d92409e53dc573ea513056bf3470',
    BASE: 'assets/animals/',
    WAIT_MS: 20000,                     // a request that has not answered in 20 s is treated as failed (our number)
    ALT: 0.004,                         // line and fix marks sit just above the surface (fraction of the globe radius)
    VIEW_ALT: 0.14,                     // "Go to the journey area": camera altitude in globe radii
    SPEEDS: [[3600, '1 h/s'], [21600, '6 h/s'], [86400, '1 day/s'], [604800, '1 week/s']],   // replay time that passes in one second of playback
    SPEED_DEFAULT: 86400,
    LINE: 0xffd166, FIX: 0xffffff, MARK: 0xff4fd8,
    MARK_PX: 0.012,                     // marker radius as a fraction of the camera distance: about the same size at any zoom
    FIX_SIZE: 0.012,                    // fix mark half-size in globe units (globe radius 100): about 750 m on the ground
    T: {
      off: 'Off. Switch on to load the recorded journey.',
      loading: 'Loading the journey file…',
      unverified: 'Journey file could not be verified. Nothing is drawn.',
      failed: 'The journey file could not be loaded. Nothing is drawn.',
      noGlobe: 'The journey needs the 3-D globe, which is not available in this browser. Nothing is drawn.',
      notBuilt: 'The globe has not finished loading, so the journey cannot be drawn yet.',
      sky: 'Hidden while the zoom-out view is open. Paused at the same replay time.',
      first: 'First recorded fix',
      last: 'Last recorded fix: tracking record ends here',
      // filtered journeys (Argos): the source holds fixes that are not displayed, so the bar speaks of displayed fixes only.
      // "No fix was recorded" or "the tracking record ends" would be false where a left-out fix lies in the gap or after the end.
      firstShown: 'First displayed fix', lastShown: 'Last displayed fix: displayed record ends here', midShown: 'Last displayed fix',
      marks: 'The fix marks are drawn large so they can be seen with the whole journey in view. Their size does not show uncertainty.',
      line: 'The line joins recorded fixes. The path between fixes was not recorded.',
      others: 'Other layers on the globe retain their own dates and times; they are not matched to this journey.',
    },
  };
  const st = { on: false, status: 'off', why: '', gen: 0, man: null, jr: null, d: null, seg: null, i: 0, rt: 0, playing: false, speed: J.SPEED_DEFAULT,
    raf: 0, lastTick: 0, objs: null, sky: false, said: '', ctl: null, abort: null };

  // ---------- time, in UTC, from whole seconds (the visitor's zone is never used)
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p2 = n => String(n).padStart(2, '0');
  const utc = s => { const d = new Date(s * 1000); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC`; };
  const utcDay = s => { const d = new Date(s * 1000); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  /** a length of time, exact to the second: every unit below the largest is printed (1 h 1 min 1 s; 3 h 0 min 1 s; 2 d 0 h 5 min 3 s) */
  const span = s => { s = Math.max(0, Math.floor(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return d ? `${d} d ${h} h ${m} min ${x} s` : h ? `${h} h ${m} min ${x} s` : m ? `${m} min ${x} s` : `${x} s`; };
  /** index of the last fix at or before time s (−1 before the first fix) */
  function fixAt(s) { const t = st.d.t; if (s < t[0]) return -1; let lo = 0, hi = t.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (t[mid] <= s) lo = mid; else hi = mid - 1; } return lo; }

  // ---------- loading and verification
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  /** one request of the current load. Its AbortController is kept in st.abort so that switching off (or leaving the page, or a
   *  newer load) aborts the request itself; the generation check in load() separately refuses any answer that still arrives. */
  async function get(url) { const c = new AbortController(), timer = setTimeout(() => c.abort(), J.WAIT_MS); st.abort = c;
    try { const r = await fetch(url, { cache: 'no-store', signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.arrayBuffer(); } finally { clearTimeout(timer); if (st.abort === c) st.abort = null; } }
  const abortLoad = () => { const c = st.abort; st.abort = null; if (c) try { c.abort(); } catch (_) { } };
  class Unverified extends Error { }
  /** every check the display file must pass before anything is drawn; throws Unverified with the reason */
  /** a step (fix i−1 → fix i) is joined when it is within the journey's time rule and, for files that carry join flags, the build allowed it */
  const joins = (d, rule, i) => d.t[i] - d.t[i - 1] <= rule && (!d.j || d.j[i] === 1);
  function verify(man, d, animal) {
    const jr = (man.journeys || []).find(j => j.animal === animal); if (!jr) throw new Unverified('the manifest lists no journey for ' + animal);
    const rule = man.gap_rule && man.gap_rule.max_join_seconds; if (!Number.isInteger(rule) || rule <= 0) throw new Unverified('the manifest has no gap rule');
    if (!d || !Array.isArray(d.t) || !Array.isArray(d.lat) || !Array.isArray(d.lon)) throw new Unverified('the display file has no fix arrays');
    const n = d.t.length; if (n !== jr.fixes || d.lat.length !== n || d.lon.length !== n || d.n !== n) throw new Unverified('the fix count does not match the manifest');
    if (d.t[0] !== jr.first_fix_s || d.t[n - 1] !== jr.last_fix_s) throw new Unverified('the first or last fix time does not match the manifest');
    const b = jr.bbox;
    for (let i = 0; i < n; i++) { const t = d.t[i], la = d.lat[i], lo = d.lon[i];
      if (!Number.isInteger(t) || (i && t <= d.t[i - 1])) throw new Unverified('fix times are not whole seconds in increasing order');
      if (!Number.isFinite(la) || !Number.isFinite(lo) || la < b.south || la > b.north || lo < b.west || lo > b.east) throw new Unverified('a coordinate is missing or outside the study area'); }
    if (d.schema === 2 || d.lc !== undefined || d.j !== undefined) {                       // Argos files: a class per fix and a join flag per step
      const cm = man.class_meanings || {};
      if (typeof d.lc !== 'string' || d.lc.length !== n || [...d.lc].some(c => !(c in cm))) throw new Unverified('the quality classes are missing or not ones the manifest explains');
      if (!Array.isArray(d.j) || d.j.length !== n || d.j[0] !== 0 || d.j.some(x => x !== 0 && x !== 1)) throw new Unverified('the join flags are missing or malformed');
      let k = 0; for (let i = 1; i < n; i++) { if (d.j[i] === 1) { k++; if (d.t[i] - d.t[i - 1] > rule) throw new Unverified('a join flag joins fixes further apart than the rule allows'); } }
      if (k !== jr.steps_joined) throw new Unverified('the number of joined steps does not match the manifest'); }
    return jr;
  }
  async function load() {
    abortLoad(); const gen = ++st.gen; st.status = 'loading'; st.why = ''; paint();
    try {
      const cb = await get(J.CATALOG); if (gen !== st.gen) return;
      if (await hex(cb) !== J.CATALOG_SHA256) throw new Unverified('the journey list does not match its pinned checksum'); if (gen !== st.gen) return;
      let cat; try { cat = JSON.parse(new TextDecoder().decode(cb)); } catch (_) { throw new Unverified('the journey list is not readable'); }
      const ce = (cat.journeys || []).find(j => j.id === st.choice); if (!ce) throw new Unverified('the journey list has no journey ' + st.choice);
      const mb = await get(J.BASE + ce.manifest); if (gen !== st.gen) return;
      if (await hex(mb) !== ce.manifest_sha256) throw new Unverified('the manifest does not match the checksum in the journey list'); if (gen !== st.gen) return;
      let man; try { man = JSON.parse(new TextDecoder().decode(mb)); } catch (_) { throw new Unverified('the manifest is not readable'); }
      const ent = (man.journeys || []).find(j => j.animal === ce.animal); if (!ent) throw new Unverified('the manifest lists no journey for ' + ce.animal);
      const db = await get(J.BASE + ent.file); if (gen !== st.gen) return;
      if (db.byteLength !== ent.bytes || await hex(db) !== ent.sha256) throw new Unverified('the display file does not match the manifest checksum'); if (gen !== st.gen) return;
      let d; try { d = JSON.parse(new TextDecoder().decode(db)); } catch (_) { throw new Unverified('the display file is not readable'); }
      const jr = verify(man, d, ce.animal); if (gen !== st.gen) return;
      st.man = man; st.jr = jr; st.d = d; st.ce = ce;
      // seg[i] = number of line segments whose later fix has index ≤ i (a segment joins fix i−1 to fix i when they are within the rule)
      const rule = man.gap_rule.max_join_seconds, seg = new Uint32Array(d.t.length); let k = 0; for (let i = 1; i < d.t.length; i++) { if (joins(d, rule, i)) k++; seg[i] = k; } st.seg = seg;
      if (!build()) { st.status = 'failed'; st.why = J.T.notBuilt; st.d = null; return paint(); }
      st.status = 'ready'; st.playing = false; ensureBar(); setBarFrame(); paint(); seek(d.t[0], true);
    } catch (e) { if (gen !== st.gen) return; clearObjs(); st.d = null;
      st.status = e instanceof Unverified ? 'unverified' : 'failed'; st.why = e instanceof Unverified ? J.T.unverified : J.T.failed; st.detail = String(e && e.message || e); paint(); }
  }

  // ---------- drawing: three objects of our own on the globe's scene (a line, the fix marks, the marker)
  function harvest() {
    const g = ME.globe && ME.globe(); if (!g || typeof g.scene !== 'function' || typeof g.globeMaterial !== 'function' || typeof g.getCoords !== 'function') return null;
    const gm = g.globeMaterial(); let gmesh = null; g.scene().traverse(o => { if (o.isMesh && (Array.isArray(o.material) ? o.material[0] : o.material) === gm) gmesh = o; });
    if (!gmesh || !gmesh.geometry || !/Sphere/i.test(gmesh.geometry.type || '') || !gmesh.parent) return null;
    const pos = gmesh.geometry.getAttribute && gmesh.geometry.getAttribute('position'); const Geo = Object.getPrototypeOf(gmesh.geometry.constructor);
    if (!pos || typeof Geo !== 'function') return null;
    return { g, gmesh, Sphere: gmesh.geometry.constructor, Mesh: gmesh.constructor, Geo, Attr: pos.constructor, Mat: gm.constructor };
  }
  function build() {
    clearObjs(); const h = harvest(); if (!h) return false;
    const d = st.d, n = d.t.length, rule = st.man.gap_rule.max_join_seconds, g = h.g;
    const P = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const c = g.getCoords(d.lat[i], d.lon[i], J.ALT); P[i * 3] = c.x; P[i * 3 + 1] = c.y; P[i * 3 + 2] = c.z; }
    const mat = (colour, wire, op) => { const m = new h.Mat({ wireframe: wire, transparent: true, opacity: op, depthWrite: false }); if (m.color) m.color.set(colour); if (m.emissive) m.emissive.set(colour); if ('side' in m) m.side = 2; return m; };
    // the line: one flat triangle (a, b, b) per joined pair, drawn as a wireframe; segments are in time order so a draw range shows only the past
    const L = []; for (let i = 1; i < n; i++) if (joins(d, rule, i)) { const a = (i - 1) * 3, b = i * 3; L.push(P[a], P[a + 1], P[a + 2], P[b], P[b + 1], P[b + 2], P[b], P[b + 1], P[b + 2]); }
    const lg = new h.Geo(); lg.setAttribute('position', new h.Attr(new Float32Array(L), 3)); lg.setDrawRange(0, 0);
    const line = new h.Mesh(lg, mat(J.LINE, true, 0.9)); line.raycast = () => { }; line.renderOrder = 3; line.frustumCulled = false; line.__journey = 'line';
    // the fix marks: one small filled triangle per recorded fix, lying on the surface, in time order
    // Argos journeys cover hundreds to thousands of km: their fix marks are sized to stay visible when the whole journey is in view
    const bb = st.jr.bbox, F = new Float32Array(n * 9), s = d.lc ? Math.max(J.FIX_SIZE, 0.2 * Math.max(J.VIEW_ALT, Math.max(bb.north - bb.south, bb.east - bb.west) / 26)) : J.FIX_SIZE;
    for (let i = 0; i < n; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], r = Math.hypot(x, y, z), ux = x / r, uy = y / r, uz = z / r;
      let ex = -uz, ey = 0, ez = ux; const el = Math.hypot(ex, ey, ez) || 1; ex /= el; ez /= el;                 // east-ish, on the surface
      const nx = uy * ez - uz * ey, ny = uz * ex - ux * ez, nz = ux * ey - uy * ex;                               // north-ish, on the surface
      const o = i * 9; F[o] = x + nx * s; F[o + 1] = y + ny * s; F[o + 2] = z + nz * s;
      F[o + 3] = x - nx * s * 0.5 + ex * s * 0.87; F[o + 4] = y - ny * s * 0.5 + ey * s * 0.87; F[o + 5] = z - nz * s * 0.5 + ez * s * 0.87;
      F[o + 6] = x - nx * s * 0.5 - ex * s * 0.87; F[o + 7] = y - ny * s * 0.5 - ey * s * 0.87; F[o + 8] = z - nz * s * 0.5 - ez * s * 0.87; }
    const fg = new h.Geo(); fg.setAttribute('position', new h.Attr(F, 3)); fg.setDrawRange(0, 0);
    const fixes = new h.Mesh(fg, mat(J.FIX, false, 0.95)); fixes.raycast = () => { }; fixes.renderOrder = 4; fixes.frustumCulled = false; fixes.__journey = 'fixes';
    // the marker: a small sphere on the last recorded fix, kept about the same size on screen
    const marker = new h.Mesh(new h.Sphere(1, 12, 8), mat(J.MARK, false, 1)); marker.raycast = () => { }; marker.renderOrder = 5; marker.__journey = 'marker';
    const parent = h.gmesh.parent; parent.add(line); parent.add(fixes); parent.add(marker);
    st.objs = { line, fixes, marker, parent, P, g, segs: L.length / 9 }; return true;
  }
  function clearObjs() { const o = st.objs; if (!o) return; for (const m of [o.line, o.fixes, o.marker]) { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); } st.objs = null; }
  /** put on the globe exactly what was recorded up to fix i (−1 = nothing yet) */
  function show() {
    const o = st.objs; if (!o) return; const i = st.i, vis = !st.sky;
    o.line.geometry.setDrawRange(0, i > 0 ? st.seg[i] * 3 : 0); o.fixes.geometry.setDrawRange(0, i >= 0 ? (i + 1) * 3 : 0);
    o.line.visible = vis; o.fixes.visible = vis; o.marker.visible = vis && i >= 0;
    if (i >= 0) { o.marker.position.set(o.P[i * 3], o.P[i * 3 + 1], o.P[i * 3 + 2]); sizeMarker(); }
  }
  function sizeMarker() { const o = st.objs; if (!o || st.i < 0) return; let dist = 250; try { const c = o.g.camera(); dist = Math.hypot(c.position.x - o.marker.position.x, c.position.y - o.marker.position.y, c.position.z - o.marker.position.z); } catch (_) { }
    const s = Math.max(0.02, dist * J.MARK_PX); o.marker.scale.set(s, s, s); }

  // ---------- replay
  /** set the replay time (whole seconds, clamped to the record); quiet = do not announce */
  function seek(s, quiet) { if (!st.d) return; const t = st.d.t; s = Math.min(t[t.length - 1], Math.max(t[0], Math.floor(s))); st.rt = s; st.rtExact = s; st.i = fixAt(s); show(); paintBar(quiet); }
  function tick(now) {
    st.raf = 0; if (!st.playing || !st.d) return;
    const dt = Math.min(0.25, Math.max(0, (now - st.lastTick) / 1000)); st.lastTick = now;
    const end = st.d.t[st.d.t.length - 1], next = st.rtExact + dt * st.speed;
    if (next >= end) { st.playing = false; seek(end, false); paintCtl(); return; }                                  // stop at the last recorded fix
    st.rtExact = next; st.rt = Math.floor(next); const i = fixAt(st.rt); if (i !== st.i) { st.i = i; show(); } else sizeMarker(); paintBar(true);
    st.raf = requestAnimationFrame(tick);
  }
  function play() { if (!st.d || st.sky || st.status !== 'ready') return; const end = st.d.t[st.d.t.length - 1]; if (st.rt >= end) seek(st.d.t[0], true);
    st.playing = true; st.lastTick = performance.now(); if (!st.raf) st.raf = requestAnimationFrame(tick); paintCtl(); }
  function pause(say) { st.playing = false; if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; } paintCtl(); if (say) paintBar(false); }

  // ---------- the card, the replay bar and the Key
  const keyRepaint = () => { if (typeof ME.paintKeyExternal === 'function') ME.paintKeyExternal(); };
  const drawn = () => !!(st.objs && st.objs.line.parent && st.objs.line.visible);
  function paint() {
    keyRepaint();
    tgl.setAttribute('aria-checked', String(st.on)); if (st.status === 'loading') tgl.setAttribute('aria-busy', 'true'); else tgl.removeAttribute('aria-busy');
    $('s-journey').textContent = !st.on ? 'off' : st.status === 'ready' ? 'replay' : st.status === 'loading' ? 'loading' : 'not drawn';
    const o = $('o-journey'), retry = $('journey-retry');
    retry.hidden = !(st.on && st.status === 'failed');
    if (!st.on) o.textContent = st.why || J.T.off;
    else if (st.status === 'loading') o.textContent = J.T.loading;
    else if (st.status === 'ready' && st.man.card) { const m = st.man, c = m.card;      // Argos journeys: the manifest carries the sentences
      o.textContent = `${c.shown} ${c.not_route} ${c.line} ${c.done} ${m.accuracy_note} ${J.T.marks} ${m.sample_sentence}` + (st.sky ? ' ' + J.T.sky : ''); }
    else if (st.status === 'ready') { const j = st.jr, m = st.man;
      o.textContent = `${j.fixes.toLocaleString('en-GB')} recorded fixes of one animal (${j.animal}), ${utcDay(j.first_fix_s)} to ${utcDay(j.last_fix_s)}. ` +
        `${m.animals_sampled} animals were tracked in this study; ${m.animals_shown} is shown. ` +
        (j.rows_without_position || j.rows_flagged_by_source ? `Not drawn for this animal: ${j.rows_without_position} fix attempts without a position, ${j.rows_flagged_by_source} flagged by the source. ` : '') +
        `Location uncertainty: ${m.location_uncertainty}.` + (st.sky ? ' ' + J.T.sky : ''); }
    else o.textContent = st.why;
    const bar = $('replay'); bar.hidden = !(st.on && st.status === 'ready' && !st.sky);
    if (!bar.hidden) { paintCtl(); paintBar(true); }
  }
  function paintCtl() { const b = $('replay-play'); if (!b) return; b.textContent = st.playing ? 'Pause' : 'Play'; b.setAttribute('aria-pressed', String(st.playing)); }
  /** the always-visible replay line: replay time, the fix under the marker, its age, and the gap it sits in */
  function barText() {
    const d = st.d, i = st.i, t = d.t, rule = st.man.gap_rule.max_join_seconds, n = t.length;
    let s = `Replay time (recorded) ${utc(st.rt)}`;
    const F = !!st.man.card;                                   // a filtered journey: speak of displayed fixes
    if (i < 0) return s + (F ? ' · No fix displayed yet' : ' · No fix recorded yet');
    const age = st.rt - t[i];
    s += i === 0 && age === 0 ? ` · ${F ? J.T.firstShown : J.T.first} ${utc(t[i])}` : i === n - 1 ? ` · ${F ? J.T.lastShown : J.T.last}, ${utc(t[i])}` : ` · ${F ? J.T.midShown : 'Last recorded fix'} ${utc(t[i])}` + (age > 0 ? `, ${span(age)} earlier` : ', at this time');
    if (d.lc) { const c = d.lc[i], m = st.man.class_meanings[c]; s += ` · Argos class ${c} (${m === 'no estimate' ? 'no error estimate' : 'nominal error ' + m})`; }
    if (i < n - 1 && t[i + 1] - t[i] > rule) s += F ? ` · No fix is displayed for ${span(t[i + 1] - t[i])} after it` : ` · No fix was recorded for ${span(t[i + 1] - t[i])} after it`;
    return s;
  }
  function paintBar(quiet) {
    if (!st.d || $('replay').hidden) return;
    const txt = barText(); $('replay-now').textContent = txt;
    const r = $('replay-range'); if (document.activeElement !== r || !st.dragging) r.value = String(Math.max(0, st.i)); r.setAttribute('aria-valuetext', txt);
    if (!quiet && txt !== st.said) { st.said = txt; $('replay-say').textContent = txt; }                             // announced when the visitor moves the replay or it stops, not on every frame
  }
  function ensureBar() {
    if (st.ctl) return; st.ctl = true;
    const r = $('replay-range'), sp = $('replay-speed');
    sp.innerHTML = J.SPEEDS.map(([v, l]) => `<option value="${v}"${v === J.SPEED_DEFAULT ? ' selected' : ''}>${l}</option>`).join('');
    $('replay-play').addEventListener('click', () => st.playing ? pause(true) : play());
    r.addEventListener('input', () => { if (!st.d) return; pause(false); seek(st.d.t[Math.min(st.d.t.length - 1, Math.max(0, +r.value))], false); });
    sp.addEventListener('change', () => { st.speed = +sp.value || J.SPEED_DEFAULT; });
    $('replay-goto').addEventListener('click', () => { const o = st.objs; if (!o || !st.jr) return; const b = st.jr.bbox, ALT = Math.max(J.VIEW_ALT, Math.max(b.north - b.south, b.east - b.west) / 26);   // far enough out to hold the whole journey
      try { o.g.controls().autoRotate = false;
        // centre the journey in the part of the globe's box the replay bar does not cover (the bar sits over the top or the bottom of it)
        let shift = 0; const cv = o.g.renderer().domElement.getBoundingClientRect(), br = $('replay').getBoundingClientRect();
        if (cv.height > 0 && br.height > 0 && br.bottom > cv.top && br.top < cv.bottom) { const above = br.top - cv.top, below = cv.bottom - br.bottom, top = above >= below ? cv.top : br.bottom, bot = above >= below ? br.top : cv.bottom;   // the larger free part
          const dy = (top + bot) / 2 - (cv.top + cv.height / 2), fov = (o.g.camera().fov || 50) * Math.PI / 180; shift = dy * (2 * ALT * Math.tan(fov / 2) / cv.height) * 180 / Math.PI; }
        o.g.pointOfView({ lat: (b.south + b.north) / 2 + shift, lng: (b.west + b.east) / 2, altitude: ALT }, 0); sizeMarker(); } catch (_) { } });
  }
  function setBarFrame() { const d = st.d, r = $('replay-range'); r.min = '0'; r.max = String(d.t.length - 1); r.step = '1';
    $('replay-note').textContent = `Replay: recorded ${utcDay(d.t[0])} to ${utcDay(d.t[d.t.length - 1])}. ${J.T.others}`;
    $('replay-rule').textContent = `${J.T.line} ${st.man.gap_rule.statement}`; }

  // ---------- the switch
  async function setOn(on) {
    if (on === st.on) return;
    if (!on) { st.on = false; st.gen++; abortLoad(); pause(false); clearObjs(); st.d = null; st.man = null; st.jr = null; st.seg = null; st.status = 'off'; st.why = ''; st.said = ''; $('replay-say').textContent = ''; return paint(); }
    if (!ME.globe || !ME.globe()) { st.why = J.T.noGlobe; st.status = 'off'; return paint(); }
    st.on = true; await load();
  }
  tgl.addEventListener('click', () => setOn(!st.on));
  // the chooser: which recorded journey the switch shows. Choosing while the switch is on clears the old journey and loads the new one.
  const chooser = $('journey-choose'); st.choice = chooser.value;
  chooser.addEventListener('change', () => { st.choice = chooser.value; const c = $('journey-chosen'); if (c) c.hidden = true; if (st.on) { setOn(false); setOn(true); } else paint(); });
  $('journey-retry').addEventListener('click', () => { if (st.on && st.status === 'failed') load(); });

  // the Sky zoom-out view: pause and hide; restore, paused, at the same replay time
  new MutationObserver(() => { const sky = document.body.classList.contains('sky-zoom'); if (sky === st.sky) return; st.sky = sky; if (sky) pause(false); if (st.objs) show(); paint(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // a hidden browser tab pauses playback; the replay itself is kept
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) pause(false); });
  // leaving the page switches the journey off, so a page the browser keeps and restores on Back (its back/forward cache) comes
  // back bare, the same as a fresh load; pageshow repeats it in case the page was frozen before pagehide ran
  window.addEventListener('pagehide', () => { if (st.on) setOn(false); });
  window.addEventListener('pageshow', e => { if (e.persisted && st.on) setOn(false); });
  // keep the marker a steady size while the visitor zooms with the replay paused
  setInterval(() => { if (st.objs && !st.playing && !st.sky) sizeMarker(); }, 500);

  // "Choose this journey on Earth now" (from the Animals page): reveal the switch in the Layers panel; switch nothing on
  function reveal() { const m = /journey=([A-Za-z0-9-]+)/.exec(location.hash); if (!m || ![...chooser.options].some(o => o.value === m[1])) return; chooser.value = m[1]; st.choice = m[1]; const go = () => { const btn = $('layers-btn'), panel = $('layers-panel'); if (!btn || !panel) return false; if (panel.hidden) btn.click(); if (panel.hidden) return false;
      const row = [...document.querySelectorAll('#layers-list [data-for]')].find(r => r.dataset.for === '#tgl-journey'); if (row) row.focus(); const c = $('journey-chosen'); if (c) c.hidden = false; return true; };
    if (!go()) { let n = 0; const iv = setInterval(() => { if (go() || ++n > 40) clearInterval(iv); }, 100); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal); else reveal();

  ME.journey = { drawn, on: () => st.on, J,
    /** read-only aids for tests and the console */
    state: () => ({ choice: st.choice, cls: st.d && st.d.lc && st.i >= 0 ? st.d.lc[st.i] : null, on: st.on, status: st.status, why: st.why, detail: st.detail || null, gen: st.gen, playing: st.playing, speed: st.speed, sky: st.sky, rt: st.rt, i: st.i, n: st.d ? st.d.t.length : 0,
      fixTime: st.d && st.i >= 0 ? st.d.t[st.i] : null, bar: $('replay').hidden ? null : $('replay-now').textContent, drawn: drawn(),
      objects: st.objs ? { segments: st.objs.segs, lineShown: st.objs.line.geometry.drawRange.count / 3, fixesShown: st.objs.fixes.geometry.drawRange.count / 3, markerVisible: st.objs.marker.visible,
        marker: st.objs.marker.visible ? [st.objs.marker.position.x, st.objs.marker.position.y, st.objs.marker.position.z] : null, fixXYZ: st.i >= 0 ? [st.objs.P[st.i * 3], st.objs.P[st.i * 3 + 1], st.objs.P[st.i * 3 + 2]] : null } : null }),
    sceneCount: () => { let n = 0; try { ME.globe().scene().traverse(o => { if (o.__journey) n++; }); } catch (_) { } return n; },
    seek: s => seek(s, false), play, pause: () => pause(true), setSpeed: v => { st.speed = v; }, fixTimes: () => st.d ? st.d.t : null, fixAt: s => st.d ? fixAt(s) : null };
})();
