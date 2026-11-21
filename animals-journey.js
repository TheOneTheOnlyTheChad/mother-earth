/* Mother Earth — Animal journeys on the Animals page: a dated replay of one tracked animal's recorded fixes.
 * PRIVATE PREVIEW. animals-tab-rc, stage 1 (20 Nov 2026; docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md rev 3.1, Part A): the replay
 * moved here from Earth now, on Chad's design instruction. This page has its own globe (animals-globe.js). Earth now carries no
 * journey control. History: animals-zebra-preview-rc, then animals-journeys-preview-rc (one switch and a chooser on Earth now;
 * three recorded journeys: zebra Z3866 by GPS; white shark tag 118845 and false killer whale tag 98364 by Argos, each filtered at
 * build time by phase1/animals/build_argos_journey.py). The data files, manifests and verification are unchanged from that build.
 * ONE JOURNEY AT A TIME. Each animal has its own labelled switch (role="switch"); there is no chooser. Nothing is on when the page
 * opens. Switching a second animal on switches the first off at once: its request is aborted, its objects leave the scene and
 * its replay stops; then the second loads. While it loads the second switch reads on (aria-busy). If it fails it returns to off,
 * its error and Retry stay on its own row, and the first is NOT brought back. Retry goes through the same path as the switch.
 * FAILURE SCOPE. A manifest or display file that fails affects that journey only. The journey list (catalogue) is shared: if it
 * cannot be verified, no journey from it can be trusted, so that is one error for the whole group, with its own Retry.
 * NETWORK. This file requests nothing until a switch is pressed. Then: the journey list, that study's manifest, that journey's
 * display file. No journey's coordinates are requested before its own switch is on.
 * Argos journeys carry a quality class per fix (shown with the fix) and a per-step join flag made at build time: a step is joined
 * only if it is within the journey's time limit AND the build found the drawn line clear of land in its land map.
 * Rules this file keeps:
 *  - Observation-based. The marker is only ever on a recorded fix: the last one at or before the replay time. Nothing is
 *    interpolated, smoothed, thinned or modelled. Only the past is drawn: fixes and lines later than the replay time are not on
 *    the globe, and scrubbing backwards removes them.
 *  - The line joins consecutive recorded fixes. It never joins two fixes more than the study's gap rule apart (the manifest's
 *    gap_rule.max_join_seconds; a Mother Earth display rule, not the researchers').
 *  - Times are the source's own, to the second, printed in UTC. The visitor's time zone is never used.
 *  - Replay time is not the page's time. No replay control touches the header clock or the backdrop. This file writes only to
 *    the journey rows, its own replay bar and its own objects.
 *  - Files are verified before anything is drawn: the journey list against the sha256 pinned here, the manifest against the list,
 *    the display file against the manifest, then counts, end times, order and coordinate ranges. A file that fails draws nothing.
 *  - Switching off stops playback, aborts a request in flight and refuses any answer that still arrives (a late answer draws
 *    nothing), removes and disposes every object this file added, and hides the replay bar.
 *  - A hidden browser tab pauses playback and keeps the replay. A new page load starts with nothing on. Leaving the page switches
 *    the journey off, so a page restored by Back also starts with nothing on.
 *  - Its own scene objects, never a globe.gl data layer.
 *  - No globe, no replay: with no usable 3-D globe (none at start, the library failed, or the graphics context was lost) the
 *    switches are marked unavailable and say why; the study details stay readable. */
(() => {
  const ME = window.ME = window.ME || {};
  const $ = id => document.getElementById(id);
  const switches = [...document.querySelectorAll('button.an-tgl[data-journey]')]; if (!switches.length) return;
  const rowOf = id => document.querySelector('.an-sw[data-journey="' + id + '"]');
  const part = (id, f) => { const r = rowOf(id); return r ? r.querySelector('[data-f="' + f + '"]') : null; };
  const nameOf = id => { const b = switches.find(x => x.dataset.journey === id); return b ? (b.dataset.name || id) : id; };
  const J = {
    CATALOG: 'assets/animals/journeys-R1.catalog.json',          // the list of journeys; it pins each study's manifest, which pins its display file
    CATALOG_SHA256: '5eb789b10488b68cb5e471309ebc517199b1dbce00e5ac719d84f3b4b42c5452',
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
      off: 'Off. Switch on to replay this recorded journey on the globe.',
      loading: 'Loading the journey file…',
      unverified: 'Journey file could not be verified. Nothing is drawn.',
      failed: 'The journey file could not be loaded. Nothing is drawn.',
      noGlobe: 'The journey needs the 3-D globe, which is not available in this browser. Nothing is drawn.',
      catUnverified: 'The list of journeys could not be verified. No journey can be shown until it verifies.',
      catFailed: 'The list of journeys could not be loaded. No journey can be shown until it loads.',
      notBuilt: 'The globe has not finished loading, so the journey cannot be drawn yet.',
      first: 'First recorded fix',
      last: 'Last recorded fix: tracking record ends here',
      // filtered journeys (Argos): the source holds fixes that are not displayed, so the bar speaks of displayed fixes only.
      // "No fix was recorded" or "the tracking record ends" would be false where a left-out fix lies in the gap or after the end.
      firstShown: 'First displayed fix', lastShown: 'Last displayed fix: displayed record ends here', midShown: 'Last displayed fix',
      marks: 'The fix marks are drawn large so they can be seen with the whole journey in view. Their size does not show uncertainty.',
      line: 'The line joins recorded fixes. The path between fixes was not recorded.',
      others: 'The backdrop keeps its own date; it is not matched to this journey.',
      range: 'Recorded fix (arrow keys step from fix to fix)',
      rangeWithheld: 'Replay position (arrow keys step between displayed fixes and the start of each withheld period)',
    },
  };
  const st = { on: false, choice: null, status: 'off', gen: 0, list: null, listTok: 0, note: '', scroll: null, man: null, jr: null, d: null, seg: null, i: 0, rt: 0, playing: false, speed: J.SPEED_DEFAULT,
    raf: 0, lastTick: 0, objs: null, said: '', announced: '', ctl: null, abort: null, err: {}, catErr: '', catDetail: '' };

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
  class NotBuilt extends Error { }
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
    // Argos files (schema 2, or any older-schema file that carries a class or a flag): a class per fix AND a join flag per step, as before.
    // A schema-3 GPS file may carry join flags without classes.
    const filtered = man.kind === 'gps-filtered', argos = d.schema === 2 || d.lc !== undefined || (d.j !== undefined && d.schema !== 3);
    if (argos) { const cm = man.class_meanings || {};
      if (typeof d.lc !== 'string' || d.lc.length !== n || [...d.lc].some(c => !(c in cm))) throw new Unverified('the quality classes are missing or not ones the manifest explains'); }
    // a withheld-fix journey REQUIRES its fields: a file without one is refused, never read as an older, simpler journey
    if (filtered) { for (const f of ['acc', 'j', 'withheld', 'failed_t']) if (!Array.isArray(d[f])) throw new Unverified(`the display file lacks "${f}", which this journey requires`);
      if (d.schema !== 3) throw new Unverified('the display file is not the schema this journey requires'); }
    if (argos || d.j !== undefined) {
      if (!Array.isArray(d.j) || d.j.length !== n || d.j[0] !== 0 || d.j.some(x => x !== 0 && x !== 1)) throw new Unverified('the join flags are missing or malformed');
      let k = 0; for (let i = 1; i < n; i++) { if (d.j[i] === 1) { k++; if (d.t[i] - d.t[i - 1] > rule) throw new Unverified('a join flag joins fixes further apart than the rule allows'); } }
      if (k !== jr.steps_joined) throw new Unverified('the number of joined steps does not match the manifest'); }
    if (d.acc !== undefined) {                                                                   // the tag's accuracy estimate, one per displayed fix
      if (!Array.isArray(d.acc) || d.acc.length !== n || d.acc.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0)) throw new Unverified('the accuracy estimates are missing or malformed'); }
    if (d.withheld !== undefined || d.failed_t !== undefined) {
      const R0 = jr.record_first_s, R1 = jr.record_last_s;
      if (!Number.isInteger(R0) || !Number.isInteger(R1) || R0 > d.t[0] || R1 < d.t[n - 1]) throw new Unverified('the recording period in the manifest is missing or does not hold the fixes');
      const W = d.withheld === undefined ? [] : d.withheld; if (!Array.isArray(W)) throw new Unverified('the withheld periods are malformed');
      let total = 0, prevLast = -Infinity, lo = 0;
      for (const p of W) {
        if (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isInteger)) throw new Unverified('a withheld period is malformed');
        const [f, l, c] = p; if (f < R0 || l > R1 || f > l || c < 1 || (c === 1) !== (f === l) || f <= prevLast) throw new Unverified('the withheld periods are out of order, overlap or lie outside the recording');
        while (lo < n && d.t[lo] < f) lo++;                                                    // lo = first displayed fix at or after the period's start
        if (lo < n && d.t[lo] <= l) throw new Unverified('a displayed fix lies inside a withheld period');
        if (lo > 0 && lo < n && (!d.j || d.j[lo] !== 0)) throw new Unverified('a step is joined across a withheld period');
        total += c; prevLast = l; }
      if (d.withheld !== undefined && (total !== jr.fixes_withheld || W.length !== jr.withheld_periods)) throw new Unverified('the withheld counts do not match the manifest');
      if (d.failed_t !== undefined) { const F = d.failed_t, ts = new Set(d.t);
        if (!Array.isArray(F) || F.length !== jr.failed_listed) throw new Unverified('the failed-attempt times do not match the manifest');
        for (let i = 0; i < F.length; i++) { const x = F[i];
          if (!Number.isInteger(x) || x < R0 || x > R1 || (i && x <= F[i - 1]) || ts.has(x) || W.some(p => x >= p[0] && x <= p[1])) throw new Unverified('a failed-attempt time is malformed, repeated, at a fix, or inside a withheld period'); } } }
    return jr;
  }
  /** the replay's frame for a verified journey. R0..R1 is the recording period (for journeys with nothing withheld: first to
   *  last fix). A hidden span runs from a withheld period's first time (inclusive) to the next displayed fix (exclusive), or
   *  through the end of the recording when no displayed fix follows. The slider's stops are the displayed fixes, the start of
   *  each withheld period, and the two ends of the recording, in time order. */
  function frame(d, jr) { const n = d.t.length, W = d.withheld || [];
    st.R0 = Number.isInteger(jr.record_first_s) ? jr.record_first_s : d.t[0]; st.R1 = Number.isInteger(jr.record_last_s) ? jr.record_last_s : d.t[n - 1];
    st.hide = W.map(p => { let k = fixAt(p[1]) + 1; return { from: p[0], to: k < n ? d.t[k] : Infinity, p }; });
    st.stops = W.length || st.R0 !== d.t[0] || st.R1 !== d.t[n - 1] ? [...new Set([st.R0, ...d.t, ...W.map(p => p[0]), st.R1])].sort((a, b) => a - b) : d.t; }
  /** the withheld span that holds replay time s, or null */
  const hiddenAt = s => { const H = st.hide || []; for (const h of H) if (s >= h.from && s < h.to) return h; return null; };
  /** index of the last slider stop at or before s */
  const stopAt = s => { const a = st.stops; let lo = 0, hi = a.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (a[mid] <= s) lo = mid; else hi = mid - 1; } return lo; };
  async function load() {
    abortLoad(); const gen = ++st.gen, id = st.choice; st.status = 'loading'; paint();
    let shared = true;                                           // true while the failure would be the shared journey list's
    try {
      const cb = await get(J.CATALOG); if (gen !== st.gen) return;
      if (await hex(cb) !== J.CATALOG_SHA256) throw new Unverified('the journey list does not match its pinned checksum'); if (gen !== st.gen) return;
      let cat; try { cat = JSON.parse(new TextDecoder().decode(cb)); } catch (_) { throw new Unverified('the journey list is not readable'); }
      shared = false; st.catErr = ''; st.catDetail = '';                       // the list verified: from here a failure is this journey's own
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
      frame(d, jr);
      // seg[i] = number of line segments whose later fix has index ≤ i (a segment joins fix i−1 to fix i when they are within the rule)
      const rule = man.gap_rule.max_join_seconds, seg = new Uint32Array(d.t.length); let k = 0; for (let i = 1; i < d.t.length; i++) { if (joins(d, rule, i)) k++; seg[i] = k; } st.seg = seg;
      if (!build()) throw new NotBuilt('the globe could not take the journey');
      st.status = 'ready'; st.playing = false; ensureBar(); setBarFrame(); paint(); seek(st.R0, true); goArea();
      announce(st.hid ? `${nameOf(id)} shown. Replay is at the start of the recording. The first fixes are withheld, so no marker is shown yet.` : `${nameOf(id)} shown. Replay is at the first ${man.card ? 'displayed' : 'recorded'} fix.`);
    } catch (e) { if (gen !== st.gen) return;
      // the requested journey returns to off; its error stays on its own row (or, for the shared list, on the group); nothing else is restored
      const unv = e instanceof Unverified, detail = String(e && e.message || e);
      off(); st.choice = null;
      if (shared) { st.catErr = unv ? J.T.catUnverified : J.T.catFailed; st.catDetail = detail; announce(`${nameOf(id)} could not be shown. ${st.catErr}`); }
      else { st.err[id] = { kind: e instanceof NotBuilt ? 'notbuilt' : unv ? 'unverified' : 'failed', text: e instanceof NotBuilt ? J.T.notBuilt : unv ? J.T.unverified : J.T.failed, detail }; announce(`${nameOf(id)} could not be shown. ${st.err[id].text}`); }
      st.note = st.announced; paint(); }
  }
  /** the shared journey list on its own (the group's Retry): verify it and clear or keep the group error; switches nothing on.
   *  It has its own request, time limit and token (st.list), apart from a journey load's: a newer Retry, a later selection,
   *  leaving the page or losing the globe cancels it, and an answer that still arrives after that changes and says nothing. */
  function cancelList() { const L = st.list; st.list = null; st.listTok++; if (L) { clearTimeout(L.timer); try { L.c.abort(); } catch (_) { } } }
  async function checkList() {
    cancelList(); const tok = st.listTok, c = new AbortController(), L = { c, timer: setTimeout(() => c.abort(), J.WAIT_MS) }; st.list = L; paint();
    let err = '', detail = '';
    try { const r = await fetch(J.CATALOG, { cache: 'no-store', signal: c.signal }); if (tok !== st.listTok) return; if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = await r.arrayBuffer(); if (tok !== st.listTok) return;
      const h = await hex(b); if (tok !== st.listTok) return;
      if (h !== J.CATALOG_SHA256) { err = J.T.catUnverified; detail = 'the journey list does not match its pinned checksum'; }
      else JSON.parse(new TextDecoder().decode(b));
    } catch (e) { if (tok !== st.listTok) return; err = J.T.catFailed; detail = String(e && e.message || e); }
    finally { clearTimeout(L.timer); if (st.list === L) st.list = null; }
    st.catErr = err; st.catDetail = detail; st.note = err;
    announce(err || 'The list of journeys verified. Journeys can be switched on.'); paint();
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
    const bb = st.jr.bbox, F = new Float32Array(n * 9), s = (d.lc || d.acc) ? Math.max(J.FIX_SIZE, 0.2 * Math.max(J.VIEW_ALT, Math.max(bb.north - bb.south, bb.east - bb.west) / 26)) : J.FIX_SIZE;
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
    const o = st.objs; if (!o) return; const i = st.i, vis = true;
    o.line.geometry.setDrawRange(0, i > 0 ? st.seg[i] * 3 : 0); o.fixes.geometry.setDrawRange(0, i >= 0 ? (i + 1) * 3 : 0);
    o.line.visible = vis; o.fixes.visible = vis; o.marker.visible = vis && i >= 0 && !st.hid;        // no marker anywhere in a withheld span; track already drawn stays
    if (i >= 0) { o.marker.position.set(o.P[i * 3], o.P[i * 3 + 1], o.P[i * 3 + 2]); sizeMarker(); }
  }
  function sizeMarker() { const o = st.objs; if (!o || st.i < 0) return; let dist = 250; try { const c = o.g.camera(); dist = Math.hypot(c.position.x - o.marker.position.x, c.position.y - o.marker.position.y, c.position.z - o.marker.position.z); } catch (_) { }
    const s = Math.max(0.02, dist * J.MARK_PX); o.marker.scale.set(s, s, s); }

  // ---------- replay
  /** set the replay time (whole seconds, clamped to the record); quiet = do not announce */
  function seek(s, quiet) { if (!st.d) return; s = Math.min(st.R1, Math.max(st.R0, Math.floor(s))); st.rt = s; st.rtExact = s; st.i = fixAt(s); st.hid = hiddenAt(s); show(); paintBar(quiet); }
  function tick(now) {
    st.raf = 0; if (!st.playing || !st.d) return;
    const dt = Math.min(0.25, Math.max(0, (now - st.lastTick) / 1000)); st.lastTick = now;
    const end = st.R1, next = st.rtExact + dt * st.speed;
    if (next >= end) { st.playing = false; seek(end, false); paintCtl(); return; }                                  // stop at the end of the recording
    st.rtExact = next; st.rt = Math.floor(next); const i = fixAt(st.rt), h = hiddenAt(st.rt); if (i !== st.i || h !== st.hid) { st.i = i; st.hid = h; show(); } else sizeMarker(); paintBar(true);
    st.raf = requestAnimationFrame(tick);
  }
  function play() { if (!st.d || st.status !== 'ready') return; if (st.rt >= st.R1) seek(st.R0, true);
    st.playing = true; st.lastTick = performance.now(); if (!st.raf) st.raf = requestAnimationFrame(tick); paintCtl(); }
  function pause(say) { st.playing = false; if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; } paintCtl(); if (say) paintBar(false); }

  // ---------- the journey rows, the group error and the replay bar
  const drawn = () => !!(st.objs && st.objs.line.parent && st.objs.line.visible);
  /** why no journey can be drawn right now, or '' when the globe is usable */
  function blocked() { if (ME.globe && ME.globe()) return ''; const g = ME.animalsGlobe && ME.animalsGlobe.state();
    return g && g.globe === 'lost' ? ME.animalsGlobe.G.T.lost : g && g.globe === 'starting' ? J.T.notBuilt : J.T.noGlobe; }
  /** one polite message per change (never per frame) */
  function announce(t) { const e = $('an-say'); st.announced = t || ''; if (e) e.textContent = t || ''; }
  function readyText() { const j = st.jr, m = st.man;
    if (m.card) { const c = m.card; return `${c.shown} ${c.not_route} ${c.line} ${c.done} ${m.accuracy_note} ${J.T.marks} ${m.sample_sentence}`; }   // Argos journeys: the manifest carries the sentences
    return `${j.fixes.toLocaleString('en-GB')} recorded fixes of one animal (${j.animal}), ${utcDay(j.first_fix_s)} to ${utcDay(j.last_fix_s)}. ` +
      `${m.animals_sampled} animals were tracked in this study; ${m.animals_shown} is shown. ` +
      (j.rows_without_position || j.rows_flagged_by_source ? `Not drawn for this animal: ${j.rows_without_position} fix attempts without a position, ${j.rows_flagged_by_source} flagged by the source. ` : '') +
      `Location uncertainty: ${m.location_uncertainty}.`; }
  function paint() {
    const why = blocked();
    for (const b of switches) { const id = b.dataset.journey, cur = id === st.choice, e = st.err[id];
      b.setAttribute('aria-checked', String(cur));                                   // the requested selection reads on while it loads
      if (cur && st.status === 'loading') b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
      if (why) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      const sw = part(id, 'sw-state'), o = part(id, 'sw-obs'), retry = part(id, 'sw-retry');
      if (sw) sw.textContent = cur ? (st.status === 'ready' ? 'replay' : 'loading') : e ? 'not shown' : 'off';
      if (o) o.textContent = cur ? (st.status === 'ready' ? readyText() : J.T.loading) : e ? e.text : why ? why : J.T.off;
      if (retry) retry.hidden = !(e && !cur && !why); }
    const box = $('an-integrity'); if (box) { box.hidden = !st.catErr; const t = $('an-integrity-text'); if (t) t.textContent = st.catErr;
      const rb = $('an-integrity-retry'); if (rb) { if (st.list) rb.setAttribute('aria-busy', 'true'); else rb.removeAttribute('aria-busy'); rb.textContent = st.list ? 'Checking…' : 'Retry'; } }
    const ns = $('an-status'); if (ns) { const t = st.choice && st.status === 'loading' ? `${nameOf(st.choice)} loading…` : !st.choice ? st.note : ''; ns.textContent = t; ns.hidden = !t; }
    const bar = $('replay'); bar.hidden = !(st.choice && st.status === 'ready');
    if (!bar.hidden) { paintCtl(); paintBar(true); }
  }
  function paintCtl() { const b = $('replay-play'); if (!b) return; b.textContent = st.playing ? 'Pause' : 'Play'; b.setAttribute('aria-pressed', String(st.playing)); }
  /** the always-visible replay line: replay time, the fix under the marker, its age, and the gap it sits in */
  function barText() {
    const d = st.d, i = st.i, t = d.t, rule = st.man.gap_rule.max_join_seconds, n = t.length;
    let s = `Replay time (recorded) ${utc(st.rt)}`;
    const F = !!st.man.card;                                   // a filtered journey: speak of displayed fixes
    // a withheld span: no marker, no accuracy, and no other wording (it takes precedence over a failed attempt inside the span)
    if (st.hid) { const [f, l, c] = st.hid.p, km = st.man.withholding ? st.man.withholding.radius_km : '';
      return s + ` · Fixes near the tagging site are withheld: ${c} fixes between ${utc(f)} and ${utc(l)}, within ${km} km of the tagging-site reference point, are not shown. No marker is shown` +
        (st.hid.to === Infinity ? ' · The recording ends in this withheld period' : ` · Next displayed fix ${utc(st.hid.to)}`); }
    if (i < 0) return s + (F ? ' · No fix displayed yet' : ' · No fix recorded yet');
    const age = st.rt - t[i];
    s += i === 0 && age === 0 ? ` · ${F ? J.T.firstShown : J.T.first} ${utc(t[i])}` : i === n - 1 ? ` · ${F ? J.T.lastShown : J.T.last}, ${utc(t[i])}` : ` · ${F ? J.T.midShown : 'Last recorded fix'} ${utc(t[i])}` + (age > 0 ? `, ${span(age)} earlier` : ', at this time');
    if (d.lc) { const c = d.lc[i], m = st.man.class_meanings[c]; s += ` · Argos class ${c} (${m === 'no estimate' ? 'no error estimate' : 'nominal error ' + m})`; }
    if (d.acc) s += ` · Tag's accuracy estimate ${d.acc[i]} m`;
    const next = i < n - 1 ? t[i + 1] : Infinity;
    if (d.failed_t) { let f = null; for (const x of d.failed_t) if (x > t[i] && x < next && x <= st.rt) f = x;          // only once replay time has reached the failed attempt
      if (f !== null) s += ` · The tag tried for a position at ${utc(f)} and got none`; }
    if (i < n - 1 && next - t[i] > rule) {
      if (st.man.kind === 'gps-filtered') {                                                    // never "No fix was recorded": say only what the source holds
        const withheldNext = (st.hide || []).some(h => h.from > t[i] && h.from < next), tried = (d.failed_t || []).some(x => x > t[i] && x < next);
        if (!withheldNext) s += tried ? ` · No position is in the source for ${span(next - t[i])} after it` : ` · No position and no attempt is in the source for ${span(next - t[i])} after it`; }
      else s += F ? ` · No fix is displayed for ${span(next - t[i])} after it` : ` · No fix was recorded for ${span(next - t[i])} after it`; }
    return s;
  }
  function paintBar(quiet) {
    if (!st.d || $('replay').hidden) return;
    const txt = barText(); $('replay-now').textContent = txt;
    const r = $('replay-range'); if (document.activeElement !== r || !st.dragging) r.value = String(stopAt(st.rt)); r.setAttribute('aria-valuetext', txt);
    if (!quiet && txt !== st.said) { st.said = txt; $('replay-say').textContent = txt; }                             // announced when the visitor moves the replay or it stops, not on every frame
  }
  function ensureBar() {
    if (st.ctl) return; st.ctl = true;
    const r = $('replay-range'), sp = $('replay-speed');
    sp.innerHTML = J.SPEEDS.map(([v, l]) => `<option value="${v}"${v === J.SPEED_DEFAULT ? ' selected' : ''}>${l}</option>`).join('');
    $('replay-play').addEventListener('click', () => st.playing ? pause(true) : play());
    r.addEventListener('input', () => { if (!st.d) return; pause(false); seek(st.stops[Math.min(st.stops.length - 1, Math.max(0, +r.value))], false); });
    sp.addEventListener('change', () => { st.speed = +sp.value || J.SPEED_DEFAULT; });
    $('replay-goto').addEventListener('click', goArea);
  }
  /** turn the globe to the journey (no animation): used when a journey has loaded and by the "Journey area" button */
  function goArea() { { const o = st.objs; if (!o || !st.jr) return; const b = st.jr.bbox, ALT = Math.max(J.VIEW_ALT, Math.max(b.north - b.south, b.east - b.west) / 26);   // far enough out to hold the whole journey
      try { o.g.controls().autoRotate = false;
        // centre the journey in the part of the globe's box the replay bar does not cover (the bar sits over the top or the bottom of it)
        let shift = 0; const cv = o.g.renderer().domElement.getBoundingClientRect(), br = $('replay').getBoundingClientRect();
        if (cv.height > 0 && br.height > 0 && br.bottom > cv.top && br.top < cv.bottom) { const above = br.top - cv.top, below = cv.bottom - br.bottom, top = above >= below ? cv.top : br.bottom, bot = above >= below ? br.top : cv.bottom;   // the larger free part
          const dy = (top + bot) / 2 - (cv.top + cv.height / 2), fov = (o.g.camera().fov || 50) * Math.PI / 180; shift = dy * (2 * ALT * Math.tan(fov / 2) / cv.height) * 180 / Math.PI; }
        o.g.pointOfView({ lat: (b.south + b.north) / 2 + shift, lng: (b.west + b.east) / 2, altitude: ALT }, 0); sizeMarker(); } catch (_) { } }
  }
  function setBarFrame() { const d = st.d, r = $('replay-range'); r.min = '0'; r.max = String(st.stops.length - 1); r.step = '1';
    const lab = document.querySelector('label[for="replay-range"]'); if (lab) lab.textContent = st.hide && st.hide.length ? J.T.rangeWithheld : J.T.range;
    $('replay-note').textContent = `Replay: recorded ${utcDay(st.R0)} to ${utcDay(st.R1)}. ${J.T.others}`;
    $('replay-rule').textContent = `${J.T.line} ${st.man.gap_rule.statement}`; }

  // ---------- the switches: one journey at a time
  /** everything a shown or loading journey holds is released; the selection itself is cleared by the caller */
  function off() { st.on = false; st.gen++; abortLoad(); pause(false); clearObjs(); st.d = null; st.man = null; st.jr = null; st.seg = null; st.hide = null; st.hid = null; st.stops = null; st.status = 'off'; st.said = ''; const e = $('replay-say'); if (e) e.textContent = ''; }
  /** make `id` the one selected journey (null = none). The previous one is switched off first; it is never restored. */
  async function select(id, quiet) {
    id = id || null; if (id === st.choice) return;
    cancelList(); st.note = '';
    const prev = st.choice; if (prev) off();
    st.choice = id;
    if (!id) { if (!quiet && prev) announce(`${nameOf(prev)} switched off.`); return paint(); }
    const why = blocked();
    if (why) { st.choice = null; if (!quiet) announce(`${nameOf(id)} cannot be shown. ${why}`); return paint(); }
    delete st.err[id]; st.on = true;
    if (!quiet) announce((prev ? `${nameOf(prev)} switched off. ` : '') + `${nameOf(id)} loading.`);
    await load();
  }
  /** One-column layout (phones): the switches sit below the globe, so a press that switches a journey on (or its Retry) brings
   *  the globe to the top of the screen, once, at the press itself. Never when a load answers, so a late answer cannot pull the
   *  visitor back; never on switching off, at page load, for the list's Retry or for a link to a switch. Focus is not moved.
   *  The loading or failure line (#an-status) and a link back to the switches are beside the globe. */
  function showGlobe() { const box = $('an-globe-box'), panel = $('an-panel'); if (!box || !panel) return;
    const r = box.getBoundingClientRect(); if (panel.getBoundingClientRect().top < r.bottom - 1) return;              // switches beside the globe: nothing to do
    const h = document.querySelector('header.top'), hp = h ? getComputedStyle(h).position : '', clear = h && (hp === 'sticky' || hp === 'fixed') ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
    if (r.top >= clear && r.bottom <= innerHeight) return;                                                            // already in view
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), top = Math.max(0, Math.round(scrollY + r.top - clear - 8));
    st.scroll = { top, behavior: reduce ? 'auto' : 'smooth', n: (st.scroll ? st.scroll.n : 0) + 1 };
    try { window.scrollTo({ top, behavior: st.scroll.behavior }); } catch (_) { window.scrollTo(0, top); } }
  for (const b of switches) b.addEventListener('click', () => { const id = b.dataset.journey;
    if (b.getAttribute('aria-disabled') === 'true') return announce(`${nameOf(id)} cannot be shown. ${blocked()}`);
    const turnOn = id !== st.choice; select(turnOn ? id : null); if (turnOn && st.choice === id) showGlobe(); });                            // pressing the selected journey's switch (shown or still loading) switches it off
  for (const id of switches.map(b => b.dataset.journey)) { const r = part(id, 'sw-retry'); if (r) r.addEventListener('click', () => { if (st.err[id] && !blocked()) { select(id); if (st.choice === id) showGlobe(); } }); }
  { const r = $('an-integrity-retry'); if (r) r.addEventListener('click', checkList); }

  // a hidden browser tab pauses playback; the replay itself is kept
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) pause(false); });
  // leaving the page switches the journey off, so a page the browser keeps and restores on Back (its back/forward cache) comes
  // back with nothing on, the same as a fresh load; pageshow repeats it in case the page was frozen before pagehide ran
  window.addEventListener('pagehide', () => { cancelList(); if (st.choice) select(null, true); else paint(); });
  window.addEventListener('pageshow', e => { if (e.persisted && st.choice) select(null, true); });
  // keep the marker a steady size while the visitor zooms with the replay paused
  setInterval(() => { if (st.objs && !st.playing) sizeMarker(); }, 500);
  // the globe: when it stops being usable (graphics context lost) the journey is switched off and the rows say why
  if (ME.animalsGlobe) ME.animalsGlobe.onChange(() => { if (blocked()) cancelList(); if (st.choice && blocked()) { const id = st.choice; select(null, true); announce(`${nameOf(id)} switched off. ${blocked()}`); } paint(); });

  // a link to one journey (animals.html#journey=<id>, and the links on the study cards): bring that journey's switch into view
  // and focus it. Nothing is switched on. An unknown id does nothing.
  function reveal() { const m = /journey=([A-Za-z0-9-]+)/.exec(location.hash); if (!m) return; const b = switches.find(x => x.dataset.journey === m[1]); if (!b) return;
    try { b.scrollIntoView({ block: 'center' }); } catch (_) { } b.focus({ preventScroll: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal); else reveal();
  window.addEventListener('hashchange', reveal);
  paint();

  ME.journey = { drawn, on: () => !!st.choice, J,
    /** read-only aids for tests and the console */
    state: () => ({ choice: st.choice, cls: st.d && st.d.lc && st.i >= 0 ? st.d.lc[st.i] : null, on: !!st.choice, status: st.status, gen: st.gen, playing: st.playing, speed: st.speed, rt: st.rt, i: st.i, n: st.d ? st.d.t.length : 0, hidden: st.d ? !!st.hid : null, hiddenPeriod: st.hid ? st.hid.p.slice() : null, R0: st.d ? st.R0 : null, R1: st.d ? st.R1 : null, stops: st.stops ? st.stops.length : 0,
      err: JSON.parse(JSON.stringify(st.err)), globeNote: st.note, listBusy: !!st.list, listTok: st.listTok, scroll: st.scroll ? { ...st.scroll } : null, catErr: st.catErr, catDetail: st.catDetail, announced: st.announced, blocked: blocked(),
      switches: Object.fromEntries(switches.map(b => { const id = b.dataset.journey, r = part(id, 'sw-retry'); return [id, { checked: b.getAttribute('aria-checked'), busy: b.getAttribute('aria-busy'), disabled: b.getAttribute('aria-disabled'),
        state: (part(id, 'sw-state') || {}).textContent, obs: (part(id, 'sw-obs') || {}).textContent, retry: r ? !r.hidden : null }]; })),
      fixTime: st.d && st.i >= 0 ? st.d.t[st.i] : null, bar: $('replay').hidden ? null : $('replay-now').textContent, drawn: drawn(),
      objects: st.objs ? { segments: st.objs.segs, lineShown: st.objs.line.geometry.drawRange.count / 3, fixesShown: st.objs.fixes.geometry.drawRange.count / 3, markerVisible: st.objs.marker.visible,
        marker: st.objs.marker.visible ? [st.objs.marker.position.x, st.objs.marker.position.y, st.objs.marker.position.z] : null, fixXYZ: st.i >= 0 ? [st.objs.P[st.i * 3], st.objs.P[st.i * 3 + 1], st.objs.P[st.i * 3 + 2]] : null } : null }),
    sceneCount: () => { let n = 0; try { const g = ME.animalsGlobe ? ME.animalsGlobe.raw() : ME.globe(); g.scene().traverse(o => { if (o.__journey) n++; }); } catch (_) { } return n; },
    select: id => select(id), seek: s => seek(s, false), play, pause: () => pause(true), setSpeed: v => { st.speed = v; }, fixTimes: () => st.d ? st.d.t : null, fixAt: s => st.d ? fixAt(s) : null, goArea };
})();
