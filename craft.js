/* Mother Earth — Moon and Sun spacecraft pages (moon.html, sun.html). MOON-AND-SUN-BUILD-PROPOSAL rev 2.1; Chad's go, 13 Nov 2026.
 * One mission per page in this release: Lunar Reconnaissance Orbiter (Moon), Parker Solar Probe (Sun).
 * Data, all through the hub (this page never calls a provider):
 *   1. a DATED EXAMPLE — /catalogue/skycraft/<pinned revision>; the complete file's sha256 must equal the pin below.
 *   2. Sun only: the hub's latest Horizons read — /snapshot/skycraft/meta, then the snapshot it names, sha256 checked against it.
 *      Used ONLY for a time it holds a sample for, and only when that sample lies inside a named trajectory segment.
 *   LRO has no position for today: its prediction is not validated (the forward study publishes nothing).
 * Time: ?t=<UTC, YYYY-MM-DDTHH:MM:SSZ>. A covered time opens at that exact sample (no neighbour, no interpolation). A time with no
 *   sample keeps that time on screen, says so, and offers the dated example. No ?t → the dated example's default time.
 *   Selecting a sample rewrites ?t in place (replaceState), so a copied link reproduces the view and Back still leaves the page.
 * View: a flat drawing. Positions are multiplied by the file's own view matrix (screen right, screen up, toward the viewer); body
 *   and path share one scale; anything enlarged is said beside the drawing. A point behind the body is drawn dashed.
 * A missing or invalid file leaves the mission text and sources readable and draws nothing.
 * Does not load app.js (clock and menu as on the Timeline page). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
  const BODY = document.body.dataset.body;
  const CFG = {
    moon: { name: 'Moon', rev: 'craft-moon-2026-06-R1', sha: 'e747aa7a58a71a5e2a11253b2d063fcfc80809d8d86291ce6dce8220d1d05ebb', hub: false, window_samples: 120, marker: 'LRO',
      noToday: 'No validated position for this time. LRO circles the Moon about every two hours, and a prediction loses its place along that orbit first. Predictions for LRO have not been checked against what later happened, so none is drawn.' },
    sun: { name: 'Sun', rev: 'craft-sun-2024-12-R1', sha: '5934263214741a21b11019fa55d326a5b0524274c3104a6a768fca4fd3149500', hub: true, window_samples: 0, marker: 'Parker',
      noToday: 'Position unavailable for this time.' },
  }[BODY];
  const TIMEOUT_MS = 10000, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const st = { status: 'loading', example: null, today: null, hubNote: null, active: null, i: -1, t: null, tRaw: null, problem: null };

  // ---------- clock + menu (same behaviour as the other pages)
  const clock = $('clock');
  if (clock) { const tick = () => { clock.firstChild.textContent = new Date().toISOString().slice(11, 19); }; tick(); setInterval(tick, 1000); }
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

  // ---------- Back to Earth: when this tab came here from the Sky view, go back to that history entry (it reopens at the stop
  // that was left); otherwise it is a plain link to the globe.
  (() => {
    const a = $('craft-back'); if (!a) return;
    a.addEventListener('click', ev => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      let from = false;
      try { from = !!sessionStorage.getItem('me.sky.out') && history.length > 1 && !!document.referrer && new URL(document.referrer).origin === location.origin && /(\/|index\.html)$/.test(new URL(document.referrer).pathname); } catch (_) {}
      if (from) { ev.preventDefault(); history.back(); }
    });
  })();

  // ---------- time
  const parseT = s => { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z$/.exec(s || ''); if (!m) return null;
    const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]); return new Date(ms).toISOString().slice(0, 19) + 'Z' === s ? ms : null; };
  const iso = ms => new Date(ms).toISOString().slice(0, 19) + 'Z';
  const nice = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`; };
  const km = v => Math.round(v).toLocaleString('en-GB') + ' km';

  // ---------- loading + checks
  async function sha256(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
  async function fetchBuf(path) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try { const r = await fetch(HUB + path, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.arrayBuffer(); } finally { clearTimeout(timer); }
  }
  const num = v => typeof v === 'number' && isFinite(v);
  /** Everything the renderer reads, checked before anything is shown. Returns a dataset or null. */
  function shape(j, kind) {
    if (!j || j.schema !== 1 || j.body !== BODY || !j.time || !j.frame || !j.frame.view) return null;
    const T = j.time, a = parseT(T.start), b = parseT(T.end), V = j.frame.view.rows;
    if (a === null || b === null || !Number.isInteger(T.step_s) || T.step_s <= 0 || !Number.isInteger(T.n) || T.n < 2 || a + (T.n - 1) * T.step_s * 1000 !== b) return null;
    if (!Array.isArray(j.xyz_km) || j.xyz_km.length !== 3 * T.n || !j.xyz_km.every(num)) return null;
    if (!Array.isArray(V) || V.length !== 3 || !V.every(r => Array.isArray(r) && r.length === 3 && r.every(num)) || typeof j.frame.view.description !== 'string') return null;
    if (!num(j.body_radius_km) || j.body_radius_km <= 0) return null;
    const d = { kind, j, start: a, end: b, step: T.step_s * 1000, n: T.n, R: j.body_radius_km, V, ok: null };
    if (kind === 'example') {
      if (j.catalogue !== 'skycraft' || j.catalogue_revision !== CFG.rev || !j.classification || typeof j.classification.label !== 'string' || typeof j.credit !== 'string' || parseT(T.default) === null) return null;
      d.def = Math.round((parseT(T.default) - a) / d.step); if (d.def < 0 || d.def >= d.n || a + d.def * d.step !== parseT(T.default)) return null;
    } else {
      const S = j.solution;
      if (j.layer !== 'skycraft' || !S || S.same_response_as_vectors !== true || !Array.isArray(S.segment_of) || S.segment_of.length !== T.n || !Array.isArray(S.within_tracking_fit) || S.within_tracking_fit.length !== T.n
        || !Array.isArray(S.segments) || typeof S.statement !== 'string' || parseT(j.retrieved_at.slice(0, 19) + 'Z') === null) return null;
      if (!S.segment_of.every(i => i === -1 || S.segments.some(g => g.index === i && typeof g.name === 'string'))) return null;
      d.ok = S.segment_of.map(i => i >= 0);   // a sample with no named segment is treated as missing: not drawn, not selectable
    }
    // project once: screen right, screen up, toward the viewer
    d.P = new Float64Array(3 * d.n); d.dist = new Float64Array(d.n);
    for (let i = 0; i < d.n; i++) { const x = j.xyz_km[3 * i], y = j.xyz_km[3 * i + 1], z = j.xyz_km[3 * i + 2];
      for (let k = 0; k < 3; k++) d.P[3 * i + k] = V[k][0] * x + V[k][1] * y + V[k][2] * z;
      d.dist[i] = Math.hypot(x, y, z); }
    return d;
  }
  async function loadExample() {
    try { const buf = await fetchBuf('/catalogue/skycraft/' + CFG.rev);
      if (await sha256(buf) !== CFG.sha) return 'the dated example failed its integrity check';
      const d = shape(JSON.parse(new TextDecoder().decode(buf)), 'example'); if (!d) return 'the dated example is not in the expected form';
      st.example = d; return null;
    } catch (e) { return 'the dated example could not be loaded'; }
  }
  async function loadToday() {
    if (!CFG.hub) return;
    try { const meta = JSON.parse(new TextDecoder().decode(await fetchBuf('/snapshot/skycraft/meta')));
      for (const ref of [meta.current, meta.previous]) {      // the previous snapshot is the fallback when the current one cannot be read
        if (!ref || typeof ref.id !== 'string' || !/^[0-9A-Za-z-]+$/.test(ref.id) || typeof ref.sha256 !== 'string') continue;
        try { const buf = await fetchBuf('/snapshot/skycraft/' + ref.id);
          if (await sha256(buf) !== ref.sha256) continue;
          const d = shape(JSON.parse(new TextDecoder().decode(buf)), 'hub'); if (d) { st.today = d; return; }
        } catch (_) {}
      }
      st.hubNote = meta.current ? 'The hub\'s latest read could not be loaded.' : 'The hub has not published a read yet.';
    } catch (e) { st.hubNote = 'The hub\'s latest read could not be loaded.'; }
  }

  // ---------- choose what to show for a time
  const indexOf = (d, ms) => { if (!d || ms < d.start || ms > d.end || (ms - d.start) % d.step) return -1; const i = (ms - d.start) / d.step; return d.ok && !d.ok[i] ? -1 : i; };
  function choose(ms) {
    let i = indexOf(st.today, ms); if (i >= 0) return { d: st.today, i };
    i = indexOf(st.example, ms); if (i >= 0) return { d: st.example, i };
    return null;
  }
  function setUrl() { try { const u = new URL(location.href); if (st.t === null) u.searchParams.delete('t'); else u.searchParams.set('t', iso(st.t)); history.replaceState(history.state, '', u); } catch (_) {} }

  // ---------- drawing
  const SIZE = 600, PAD = 46, MIN_BODY_PX = 3.5, MARK_PX = 7;
  function niceBar(kmPerPx) { const target = kmPerPx * 110, p = Math.pow(10, Math.floor(Math.log10(target))), m = target / p; const v = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; return { km: v, px: v / kmPerPx }; }
  function draw() {
    const d = st.active, svg = $('craft-svg'); if (!d || st.i < 0) { svg.innerHTML = ''; return null; }
    const w = CFG.window_samples, lo = w ? Math.max(0, st.i - w) : 0, hi = w ? Math.min(d.n - 1, st.i + w) : d.n - 1;
    let ext = d.R; for (let i = lo; i <= hi; i++) if (!d.ok || d.ok[i]) ext = Math.max(ext, Math.abs(d.P[3 * i]), Math.abs(d.P[3 * i + 1]));
    const s = (SIZE / 2 - PAD) / ext, cx = SIZE / 2, cy = SIZE / 2, X = i => cx + d.P[3 * i] * s, Y = i => cy - d.P[3 * i + 1] * s;
    const behind = i => d.P[3 * i + 2] < 0 && Math.hypot(d.P[3 * i], d.P[3 * i + 1]) < d.R;
    const bodyPx = Math.max(d.R * s, MIN_BODY_PX), enlarged = d.R * s < MIN_BODY_PX ? bodyPx / (d.R * s) : 1;
    // the path as runs: a run ends at a missing sample, and where the path passes behind the body
    const runs = []; let cur = null;
    for (let i = lo; i <= hi; i++) {
      if (d.ok && !d.ok[i]) { cur = null; continue; }
      const far = behind(i);
      if (!cur || cur.far !== far) { const prev = cur; cur = { far, pts: [] }; runs.push(cur); if (prev && prev.pts.length) cur.pts.push(prev.pts[prev.pts.length - 1]); }
      cur.pts.push(`${X(i).toFixed(1)},${Y(i).toFixed(1)}`);
    }
    const bar = niceBar(1 / s), far = behind(st.i);
    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    svg.innerHTML = `<circle class="cb" cx="${cx}" cy="${cy}" r="${bodyPx.toFixed(2)}"/>`
      + runs.map(r => `<polyline class="cp${r.far ? ' far' : ''}" points="${r.pts.join(' ')}"/>`).join('')
      + `<circle class="cm${far ? ' far' : ''}" cx="${X(st.i).toFixed(1)}" cy="${Y(st.i).toFixed(1)}" r="${MARK_PX}"/>`
      + `<text class="cl" x="${(X(st.i) + 11).toFixed(1)}" y="${(Y(st.i) - 9).toFixed(1)}">${esc(CFG.marker)}</text>`
      + (bodyPx > 40 ? `<text class="cl on" x="${cx}" y="${cy + 4}" text-anchor="middle">${esc(CFG.name)}</text>` : `<text class="cl dim" x="${cx}" y="${(cy + bodyPx + 15).toFixed(1)}" text-anchor="middle">${esc(CFG.name)}</text>`)
      + `<line class="cs" x1="${PAD}" y1="${SIZE - 22}" x2="${(PAD + bar.px).toFixed(1)}" y2="${SIZE - 22}"/><text class="cl dim" x="${PAD}" y="${SIZE - 28}">${esc(km(bar.km))}</text>`;
    return { lo, hi, enlarged, far, runs: runs.length, scale_km_per_px: 1 / s, marker: [X(st.i), Y(st.i)], bodyPx };
  }

  // ---------- words
  function row(k, v) { return `<div class="cr"><dt>${k}</dt><dd>${v}</dd></div>`; }
  function render() {
    const d = st.active, has = !!d && st.i >= 0;
    $('craft-stage').hidden = !has; $('craft-controls').hidden = !has; $('craft-unavail').hidden = has || st.status === 'loading';
    const geo = has ? draw() : (draw(), null); st.geo = geo;
    const state = $('craft-state');
    if (st.status === 'loading') { state.textContent = 'loading…'; return; }
    if (!has) {
      const when = st.t !== null ? nice(st.t) : (st.tRaw ? `“${st.tRaw}”` : '');
      const why = st.problem ? `Nothing is drawn: ${st.problem}. The mission and sources below are unaffected.`
        : st.t === null && st.tRaw ? 'The time in this link could not be read.' : CFG.noToday + (CFG.hub && st.hubNote ? ' ' + st.hubNote : '');
      state.textContent = st.problem ? 'Geometry unavailable.' : 'Position unavailable for this time.';
      $('craft-unavail').innerHTML = (when ? `<p class="cwhen">Requested time: <b>${esc(when)}</b></p>` : '') + `<p>${esc(why)}</p>`
        + (st.example ? `<p><button type="button" id="craft-example">View a dated example</button> <span class="dim">${esc(nice(st.example.start + st.example.def * st.example.step))} — a historical snapshot.</span></p>` : '');
      const b = $('craft-example'); if (b) b.addEventListener('click', () => go(st.example.start + st.example.def * st.example.step, true));
      $('craft-read').innerHTML = ''; return;
    }
    const t = d.start + st.i * d.step, j = d.j, r = d.dist[st.i], ex = d.kind === 'example';
    state.textContent = ex ? `Historical snapshot — ${nice(t)}.` : `Predicted position — ${nice(t)}.`;
    const range = $('craft-range'); range.min = 0; range.max = d.n - 1; range.value = st.i; range.setAttribute('aria-valuetext', nice(t));
    $('craft-time').textContent = nice(t);
    $('craft-prev').disabled = step(-1, true) < 0; $('craft-next').disabled = step(1, true) < 0;
    const scale = [`${esc(j.frame.view.description)}`, `Body and path are drawn to one scale. The spacecraft marker is enlarged.`];
    if (geo.enlarged > 1) scale.push(`The ${esc(CFG.name)} is drawn ${geo.enlarged.toFixed(1)}× larger than this scale so it can be seen.`);
    if (geo.far) scale.push(`At this time the spacecraft is behind the ${esc(CFG.name)} from this viewpoint (dashed).`);
    scale.push(`Path shown: ${esc(nice(d.start + geo.lo * d.step))} to ${esc(nice(d.start + geo.hi * d.step))}, one point every ${d.step >= 3600000 ? d.step / 3600000 + ' h' : d.step >= 60000 ? d.step / 60000 + ' min' : d.step / 1000 + ' s'}${d.ok && d.ok.includes(false) ? '; the line breaks where a sample is withheld' : ''}.`);
    $('craft-scale').innerHTML = scale.map(x => `<span>${x}</span>`).join(' ');
    let out = '';
    if (ex) {
      out += row('<span class="ev comp">Calculated</span>', `${esc(j.credit)} · ${esc(nice(t))}`);
      out += row('Distance from the centre', esc(km(r)));
      out += row(`Above the nominal surface`, `${esc(km(r - d.R))} <span class="dim">(our subtraction: centre distance − ${esc(km(d.R))})</span>`);
      out += row('Trajectory', `${esc(j.classification.label)}. <span class="dim">Provider’s words: “${esc(j.classification.provider_words)}”${j.classification.segment ? ' Segment: ' + esc(j.classification.segment) + '.' : ''}</span>`);
      // NASA's report gives the distance in miles only (page read 13 Nov 2026): the kilometre figure is shown as OUR conversion, not as NASA's words
      if (j.reported_closest_approach) out += row('Closest approach, as reported', `NASA: “flying just 3.8 million miles above the surface of the Sun” (24 December 2024). <span class="dim">About 6.1 million km by our conversion.</span> <a href="${esc(j.reported_closest_approach.url)}" rel="noopener">NASA’s report</a>`);
      if (j.closest_sample) out += row('Closest sample in this snapshot', `${esc(nice(parseT(j.closest_sample.utc)))}: ${esc(km(j.closest_sample.above_nominal_surface_km))} above the nominal surface. <span class="dim">${esc(j.closest_sample.note)}</span>`);
      out += row('Snapshot', `Dated example ${esc(j.catalogue_revision)}: ${esc(nice(d.start))} to ${esc(nice(d.end))}.`);
    } else {
      const S = j.solution, g = S.segments.find(x => x.index === S.segment_of[st.i]), fit = S.within_tracking_fit[st.i];
      out += row('<span class="ev comp">Predicted</span>', `Predicted position · NASA/JPL Horizons · ${esc(nice(t))}`);
      out += row('Distance from the centre', esc(km(r)));
      out += row('Above the nominal surface', `${esc(km(r - d.R))} <span class="dim">(our subtraction: centre distance − ${esc(km(d.R))})</span>`);
      out += row('Trajectory', `${fit ? 'Within the tracking-data fit' : 'Reference planning trajectory'}. <span class="dim">Horizons’ words: “${esc(S.statement)}” Segment: ${esc(g.name)}. Data sheet revised ${esc(S.data_sheet_revised || 'date not given')}.</span>`);
      out += row('Read by the hub', `${esc(nice(Date.parse(j.retrieved_at)))} <span class="dim">(the solution’s own dates are in the line above)</span>`);
      out += row('Snapshot', `${esc(nice(d.start))} to ${esc(nice(d.end))}, hourly.`);
    }
    $('craft-read').innerHTML = out;
  }

  // ---------- selection
  function step(dir, probe) { const d = st.active; if (!d) return -1; let i = st.i + dir; while (i >= 0 && i < d.n && d.ok && !d.ok[i]) i += dir; if (i < 0 || i >= d.n) return -1; if (!probe) pick(i); return i; }
  function pick(i) { const d = st.active; if (!d || i < 0 || i >= d.n || (d.ok && !d.ok[i])) return; st.i = i; st.t = d.start + i * d.step; setUrl(); render(); }
  function go(ms, focus) {
    st.t = ms; st.tRaw = null; const c = choose(ms);
    st.active = c ? c.d : null; st.i = c ? c.i : -1; setUrl(); render();
    if (focus && c) $('craft-range').focus();
  }
  $('craft-range').addEventListener('input', ev => { const d = st.active; if (!d) return; let i = +ev.target.value;
    if (d.ok && !d.ok[i]) { const dir = i > st.i ? 1 : -1; while (i >= 0 && i < d.n && !d.ok[i]) i += dir; if (i < 0 || i >= d.n) { ev.target.value = st.i; return; } }
    pick(i); });
  $('craft-prev').addEventListener('click', () => step(-1));
  $('craft-next').addEventListener('click', () => step(1));

  // ---------- start
  (async () => {
    const raw = new URLSearchParams(location.search).get('t');
    st.tRaw = raw; st.t = raw === null ? null : parseT(raw);
    render();
    const [bad] = await Promise.all([loadExample(), loadToday()]);
    st.problem = bad; st.status = 'ready';
    if (raw === null) { if (st.example) { st.active = st.example; st.i = st.example.def; st.t = st.example.start + st.i * st.example.step; } }
    else if (st.t !== null) { const c = choose(st.t); if (c) { st.active = c.d; st.i = c.i; st.problem = null; } }
    if (st.active) st.problem = null;
    render();
  })();

  // read-only aid for tests and the console
  window.ME = window.ME || {};
  window.ME.craftState = () => ({ body: BODY, status: st.status, problem: st.problem, hubNote: st.hubNote, t: st.t === null ? null : iso(st.t), tRaw: st.tRaw, kind: st.active ? st.active.kind : null, i: st.i,
    n: st.active ? st.active.n : 0, geo: st.geo || null, hasExample: !!st.example, hasToday: !!st.today, rev: CFG.rev });
})();
