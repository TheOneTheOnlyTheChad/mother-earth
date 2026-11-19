/* Earth from Space (space.html) — one picture of the Earth as Meteosat at 0° longitude views it (EARTH-FROM-SPACE-PROPOSAL rev 2).
 * This page reads ONLY the Mother Earth hub: /snapshot/earthview/meta and the picture that record names. It never contacts EUMETSAT.
 * Rules kept here:
 *  - Everything on the page describes the DISPLAYED picture: its source frame time, its age, its credits.
 *  - A newer verified frame never replaces the picture being looked at. One line offers it; nothing changes until the reader asks.
 *  - Three facts stay apart: the hub's last source check, its last collection outcome, and the displayed frame. A failed check is
 *    said as a failed check ("whether a newer frame exists is unknown"), never as a delay at the source.
 *  - "Source frame time" is the time the service named for the frame. No scan start or end is stated: we do not hold one.
 *  - "now" is the hub's clock as read with the record, carried forward by elapsed time on this device (as on the Sun page).
 * Zoom: buttons, + and - keys, arrow keys, drag. It stops at one picture pixel per screen pixel. Nothing is animated. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
  const POLL_MS = 60000, TICK_MS = 15000, TIMEOUT_MS = 15000, CHECK_STALE_S = 1500;   // 25 min without a source check: stop calling the frame current
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = t => new Date(t).toISOString().slice(11, 16) + ' UTC';
  const dayOf = t => { const d = new Date(t); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const full = t => `${hm(t)}, ${dayOf(t)}`;
  const ago = s => { s = Math.max(0, Math.floor(s)); if (s < 90) return 'about a minute ago'; const m = Math.round(s / 60); if (m < 120) return `${m} minutes ago`; const h = Math.floor(m / 60); if (h < 48) return `${h} hours ${m % 60} minutes ago`; return `${Math.floor(h / 24)} days ago`; };
  const st = { meta: null, metaAt: null, metaError: null, shown: null, loading: null, loadError: null, sync: null };
  const now = () => st.sync ? st.sync.hub + Math.max(performance.now() - st.sync.perf, Date.now() - st.sync.wall, 0) : Date.now();


  // ---------- view tabs: when the row is too narrow for every tab (fallback fonts, narrow phones) it scrolls sideways; keep the current tab in view
  { const show = () => { const c = document.querySelector('.tabs [aria-current="page"]'), t = c && c.parentElement; if (t && t.scrollWidth > t.clientWidth) t.scrollLeft += c.getBoundingClientRect().left - t.getBoundingClientRect().left - (t.clientWidth - c.offsetWidth) / 2; };
    show(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(show); addEventListener('resize', show); }
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

  // ---------- the picture: zoom and pan
  const view = $('ev-view'), img = $('ev-img');
  const z = { s: 1, x: 0, y: 0 };   // scale (1 = whole picture fits the box) and offset of the picture's centre from the box's centre, in CSS px
  const maxScale = () => Math.max(1, (img.naturalWidth || 2048) / (view.clientWidth || 1));   // one picture pixel per screen pixel
  const apply = () => {
    const lim = (view.clientWidth * (z.s - 1)) / 2; z.x = Math.max(-lim, Math.min(lim, z.x)); z.y = Math.max(-lim, Math.min(lim, z.y));
    img.style.transform = `translate(${z.x}px,${z.y}px) scale(${z.s})`;
    $('ev-zin').disabled = z.s >= maxScale() - 1e-6; $('ev-zout').disabled = z.s <= 1; $('ev-reset').disabled = z.s === 1 && !z.x && !z.y;
    view.classList.toggle('zoomed', z.s > 1);
    $('ev-zoomsay').textContent = z.s === 1 ? 'Whole picture shown.' : z.s >= maxScale() - 1e-6 ? 'Zoomed to full detail: one picture pixel per screen pixel.' : `Zoomed in ${z.s.toFixed(1)} times.`;
  };
  const zoom = f => { const s = Math.max(1, Math.min(maxScale(), z.s * f)); const k = s / z.s; z.x *= k; z.y *= k; z.s = s; apply(); };
  $('ev-zin').addEventListener('click', () => zoom(1.5)); $('ev-zout').addEventListener('click', () => zoom(1 / 1.5));
  $('ev-reset').addEventListener('click', () => { z.s = 1; z.x = 0; z.y = 0; apply(); });
  view.addEventListener('keydown', ev => { const step = 60;
    const act = { '+': () => zoom(1.5), '=': () => zoom(1.5), '-': () => zoom(1 / 1.5), '0': () => { z.s = 1; z.x = 0; z.y = 0; apply(); },
      ArrowLeft: () => { z.x += step; apply(); }, ArrowRight: () => { z.x -= step; apply(); }, ArrowUp: () => { z.y += step; apply(); }, ArrowDown: () => { z.y -= step; apply(); } }[ev.key];
    if (!act || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key.startsWith('Arrow') && z.s === 1) return;   // not zoomed: arrows scroll the page as usual
    ev.preventDefault(); act(); });
  { let drag = null;
    view.addEventListener('pointerdown', ev => { if (z.s === 1 || ev.button) return; drag = { id: ev.pointerId, x: ev.clientX - z.x, y: ev.clientY - z.y }; view.setPointerCapture(ev.pointerId); });
    view.addEventListener('pointermove', ev => { if (!drag || ev.pointerId !== drag.id) return; z.x = ev.clientX - drag.x; z.y = ev.clientY - drag.y; apply(); });
    const end = ev => { if (drag && ev.pointerId === drag.id) drag = null; }; view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end); }
  addEventListener('resize', () => { if (z.s > maxScale()) z.s = maxScale(); apply(); });

  // ---------- what the page says
  const set = (id, text, hidden) => { const e = $(id); if (e.textContent !== text) e.textContent = text; e.hidden = hidden === undefined ? !text : hidden; };
  /** The state lines, each tied to the evidence it needs (proposal §7). Pure: (record, displayed frame, hub time) → { head, lines, offer } */
  function words(m, shown, t, metaError, metaAt) {
    const lines = []; let offer = null;
    const f = m && m.frame, sc = m && m.source_check, col = m && m.collection;
    if (metaError) lines.push(`Mother Earth’s hub could not be reached${metaAt ? ' since ' + hm(metaAt) : ''}. ${shown ? 'The picture shown is the last one loaded.' : ''}`.trim());
    if (!shown) return { head: st.loading ? 'Loading the picture…' : (m && !f) ? 'No verified picture is available' : metaError ? 'No picture could be loaded' : st.loadError ? 'The picture could not be loaded' : 'Loading…', lines: m && !f && sc && sc.ok === false ? [...lines, `We could not check the source at ${hm(sc.at)}. Whether a frame exists is unknown.`] : m && !f && col && col.outcome === 'failed' && col.frame_time ? [...lines, `A frame (${hm(col.frame_time)}) is listed, but our collection failed.`] : lines, offer };
    if (f && f.id !== shown.id && f.source_frame_time > shown.source_frame_time) offer = f;
    if (metaError || !m) return { head: 'Showing the last picture loaded', lines, offer };
    const newest = sc && sc.ok ? sc.newest : null, checkAge = sc && sc.at ? (t - Date.parse(sc.at)) / 1000 : Infinity;
    let head;
    if (!sc) { head = 'Showing the last verified frame'; lines.push('No source check is on record.'); }
    else if (sc.ok === false) { head = 'Showing the last verified frame'; lines.push(`We could not check the source at ${hm(sc.at)}. Whether a newer frame exists is unknown.`); }
    else if (checkAge > CHECK_STALE_S) { head = 'Showing the last verified frame'; lines.push(`Our last check of the source was at ${hm(sc.at)}, ${ago(checkAge)}. Whether a newer frame exists is unknown.`); }
    else if (newest > f.source_frame_time) { head = 'Showing the last verified frame';
      lines.push(col && col.outcome === 'failed' && col.frame_time === newest ? `A newer frame (${hm(newest)}) is listed, but our collection failed. Showing ${hm(shown.source_frame_time)}.` : `A newer frame (${hm(newest)}) is listed. It has not been collected yet.`); }
    else { head = offer ? 'Showing an earlier frame' : 'Current: the newest frame the source lists';
      const limit = (m.limits && m.limits.waiting_s) || 2700;
      lines.push((t - Date.parse(newest)) / 1000 < limit ? 'Waiting for the next frame.' : `The source has listed nothing newer than the ${hm(newest)} frame.`);
      lines.push(`Source last checked at ${hm(sc.at)}.`); }
    return { head, lines, offer };
  }
  function render() {
    const t = now(), s = st.shown, w = words(st.meta, s, t, st.metaError, st.metaAt);
    set('ev-state', w.head, false);
    set('ev-lines', '', true); const box = $('ev-lines'); box.textContent = ''; for (const l of w.lines) { const p = document.createElement('p'); p.textContent = l; box.appendChild(p); } box.hidden = !w.lines.length;
    const off = $('ev-offer'); off.hidden = !w.offer || !!st.loading;
    if (w.offer) { $('ev-offer-say').textContent = `A newer frame, ${hm(w.offer.source_frame_time)}, is available.`; $('ev-offer-btn').dataset.id = w.offer.id; }
    set('ev-busy', st.loading ? `Loading the ${hm(st.loading.source_frame_time)} frame…` : st.loadError ? st.loadError : '', !(st.loading || st.loadError));
    $('ev-retry').hidden = !(st.loadError && !st.loading);
    view.hidden = !s; $('ev-ctl').hidden = !s; $('ev-frame').hidden = !s;
    if (s) { set('ev-time', full(s.source_frame_time)); $('ev-time').dateTime = s.source_frame_time; set('ev-age', ago((t - Date.parse(s.source_frame_time)) / 1000));
      img.alt = `Picture of the Earth from Meteosat at 0° longitude: Africa, the Atlantic and Europe. GeoColour product, source frame time ${full(s.source_frame_time)}.`;
      set('ev-year', String(new Date(s.source_frame_time).getUTCFullYear())); }
  }
  // ---------- loading a frame's picture; the displayed picture changes only when the new one has fully loaded
  function load(frame) {
    if (st.loading && st.loading.id === frame.id) return;
    st.loading = frame; st.loadError = null; render();
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { if (st.loading !== frame) return; if (im.naturalWidth !== frame.picture.w || im.naturalHeight !== frame.picture.h) return im.onerror();
      img.src = im.src; st.shown = frame; st.loading = null; z.s = 1; z.x = 0; z.y = 0; apply(); render(); };
    im.onerror = () => { if (st.loading !== frame) return; st.loading = null; st.loadError = `The ${hm(frame.source_frame_time)} picture could not be loaded.${st.shown ? ' Still showing ' + hm(st.shown.source_frame_time) + '.' : ''}`; st.failed = frame; render(); };
    im.src = HUB + frame.picture.path;
  }
  $('ev-offer-btn').addEventListener('click', () => { const f = st.meta && st.meta.frame; if (f && f.id === $('ev-offer-btn').dataset.id) load(f); });
  $('ev-retry').addEventListener('click', () => { if (st.failed) load(st.failed); });
  // ---------- reading the hub's record
  let reading = false;
  async function read() {
    if (reading) return; reading = true;
    try { const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS); let m;
      try { const r = await fetch(HUB + '/snapshot/earthview/meta', { signal: ctl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); m = await r.json(); } finally { clearTimeout(timer); }
      if (!m || m.layer !== 'earthview') throw new Error('unexpected answer');
      if (st.meta && st.meta.frame && (!m.frame || m.frame.source_frame_time < st.meta.frame.source_frame_time)) m = { ...m, frame: st.meta.frame };   // never step back
      st.meta = m; st.metaError = null; if (Number.isFinite(Date.parse(m.now))) st.sync = { hub: Date.parse(m.now), perf: performance.now(), wall: Date.now() }; st.metaAt = now();
      if (m.frame && !st.shown && !st.loading && !(st.failed && st.failed.id === m.frame.id)) load(m.frame);   // the first picture only; later frames are offered, never swapped in
    } catch (e) { st.metaError = String(e && e.message || e); if (!st.metaAt) st.metaAt = null; }
    finally { reading = false; render(); }
  }
  apply(); render(); read();
  setInterval(read, POLL_MS); setInterval(render, TICK_MS);
  for (const ev of ['visibilitychange', 'pageshow']) addEventListener(ev, () => { if (document.visibilityState !== 'hidden') read(); });
  window.__earthview = { words };   // for the page suite
})();
