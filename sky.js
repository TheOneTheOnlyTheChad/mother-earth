/* Mother Earth — "The Sky on Two Clocks" card (SKY-TWO-CLOCKS-PROPOSAL rev 3; Chad's S1a/S2a/S3/S4, 10 Nov 2026).
 * Off on load: nothing is fetched until the switch is turned on. Nothing is drawn on the globe.
 * Now: Moon and Sun distance from Earth's centre at 00:00 UTC today, from the hub's fixed catalogue
 *      /catalogue/sky/<this page's own revision> (hub ≥ 0.6.5). The page checks the complete file's sha256 against its pin
 *      and the catalogue's shape; any failure → "Distances unavailable", never a zero, a neighbour or an empty chart.
 * Deep Time: static text in the page; never waits for the catalogue.
 * Date rules (§7): "today" is the UTC date of the viewer's clock, matched EXACTLY (never the nearest sample, never
 * interpolated); recomputed on switch-on, on the page's refresh tick, and when the tab becomes visible again.
 * Direction (§4, S3 = range rate): RR < 0 closer, > 0 farther, = 0 neither, missing → no label. No fallback.
 */
(() => {
  const ME = window.ME, $ = id => document.getElementById(id), esc = ME.esc;
  const REV = 'sky-2026-11-R1';
  const SHA = 'f851f16438415bc1e05b392e3e1616052b6347c637ee5ea98df307052058368a';
  const TIMEOUT_MS = 10000;
  const WIN = { moon: 17, sun: 182 };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const st = { on: false, status: 'off', reason: null, cat: null, index: null, token: 0, today: null, view: 'now' };

  // ---- dates (UTC only)
  const utcToday = () => new Date(Date.now()).toISOString().slice(0, 10);
  const addDays = (iso, n) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n)).toISOString().slice(0, 10);
  const nice = iso => `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;

  // ---- formatting
  const km = v => Math.round(v).toLocaleString('en-GB') + ' km';
  const mkm = (v, d = 1) => (v / 1e6).toFixed(d) + ' million km';
  const fmt = (body, v) => body === 'moon' ? km(v) : mkm(v);
  const direction = rr => typeof rr !== 'number' || !isFinite(rr) ? null
    : rr < 0 ? 'Getting closer at sample time' : rr > 0 ? 'Getting farther at sample time' : 'Neither closer nor farther at sample time';

  // ---- integrity + shape
  async function sha256(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
  function schema(j) {
    if (!j || j.catalogue !== 'sky' || j.catalogue_revision !== REV || j.direction_method !== 'range_rate' || !j.coverage || !j.bodies) return false;
    for (const b of ['moon', 'sun']) {
      const rows = j.bodies[b] && j.bodies[b].rows;
      if (!Array.isArray(rows) || !rows.length) return false;
      for (const r of rows) if (!Array.isArray(r) || r.length !== 4 || !/^\d{4}-\d\d-\d\d$/.test(r[0]) || typeof r[1] !== 'number' || !isFinite(r[1]) || r[1] <= 0
        || (r[2] !== null && (typeof r[2] !== 'number' || !isFinite(r[2]))) || !['UTC', 'UT~'].includes(r[3])) return false;
    }
    const iso = v => typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v);
    // every field the renderer reads, checked before anything is shown (GPT, 10 Nov: a catalogue without `time` passed and then threw)
    const t = j.time;
    if (!t || !iso(t.horizons_ut_tilde_from) || !iso(t.first_date_affected_by_unresolved_leap_second)) return false;
    return iso(j.coverage.start) && iso(j.coverage.end) && j.coverage.start <= j.coverage.end;
  }

  // ---- one row
  function rowState(body, today) {
    const cat = st.cat, idx = st.index[body], cov = cat.coverage;
    const r = idx.get(today) || null;
    const outside = today < cov.start || today > cov.end;
    let last = null;
    if (!r) { for (const row of cat.bodies[body].rows) if (row[0] <= today && (!last || row[0] > last[0])) last = row; }
    const days = [];
    for (let i = -WIN[body]; i <= WIN[body]; i++) {
      const d = addDays(today, i), x = idx.get(d);
      days.push({ d, v: x ? x[1] : null, outside: d < cov.start || d > cov.end, ahead: d > today });
    }
    return { body, today, row: r, outside, last, days };
  }

  function chart(s) {
    const W = 320, H = 96, L = 4, R = 4, T = 14, Bm = 16;
    const vals = s.days.filter(p => p.v != null).map(p => p.v);
    if (!vals.length) return '<svg class="sky-ch" viewBox="0 0 320 96" aria-hidden="true"></svg>';
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.08 || hi * 0.001; lo -= pad; hi += pad;
    const n = s.days.length, x = i => L + (W - L - R) * i / (n - 1), y = v => T + (H - T - Bm) * (1 - (v - lo) / (hi - lo));
    let segs = [], cur = [];
    s.days.forEach((p, i) => { if (p.v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(`${x(i).toFixed(1)},${y(p.v).toFixed(1)}`); });
    if (cur.length) segs.push(cur);
    const ti = s.days.findIndex(p => p.d === s.today);
    const firstAhead = s.days.findIndex(p => p.ahead);
    let shade = '';
    // calculated-ahead region (after today) and outside-coverage regions
    if (firstAhead >= 0) shade += `<rect class="sky-ahead" x="${x(firstAhead - 0.5).toFixed(1)}" y="${T}" width="${(x(n - 1) - x(firstAhead - 0.5)).toFixed(1)}" height="${H - T - Bm}"/>`;
    s.days.forEach((p, i) => { if (p.outside) shade += `<rect class="sky-out" x="${x(i - 0.5).toFixed(1)}" y="${T}" width="${(x(1) - x(0)).toFixed(1)}" height="${H - T - Bm}"/>`; });
    const lines = segs.map(sg => sg.length === 1 ? `<circle class="sky-pt" cx="${sg[0].split(',')[0]}" cy="${sg[0].split(',')[1]}" r="1.4"/>` : `<polyline class="sky-ln" points="${sg.join(' ')}"/>`).join('');
    const unit = s.body === 'moon' ? 'km' : 'million km';
    const lab = v => s.body === 'moon' ? Math.round(v).toLocaleString('en-GB') : (v / 1e6).toFixed(2);
    let marks = '';
    if (s.row && ti >= 0) marks += `<line class="sky-today" x1="${x(ti).toFixed(1)}" x2="${x(ti).toFixed(1)}" y1="${T - 2}" y2="${H - Bm}"/><circle class="sky-tdot" cx="${x(ti).toFixed(1)}" cy="${y(s.row[1]).toFixed(1)}" r="3"/>`;
    if (s.body === 'sun') {
      const ex = extrema(s);
      if (ex) for (const [k, p] of [['min', ex.min], ['max', ex.max]]) {
        const i = s.days.indexOf(p);
        marks += `<circle class="sky-ex" data-ex="${k}" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3"/>`;
      }
    }
    return `<svg class="sky-ch" viewBox="0 0 ${W} ${H}" aria-hidden="true" data-lo="${lo}" data-hi="${hi}">${shade}`
      + `<text class="sky-ax" x="${L}" y="${T - 4}">${lab(hi)} ${unit}</text><text class="sky-ax" x="${L}" y="${H - 4}">${lab(lo)} ${unit}</text>`
      + `${firstAhead >= 0 ? `<text class="sky-ax sky-ah" x="${W - R}" y="${T - 4}" text-anchor="end">calculated ahead →</text>` : ''}`
      + `${lines}${marks}</svg>`;
  }

  function extrema(s) {
    const pts = s.days.filter(p => p.v != null);
    if (!pts.length) return null;
    let min = pts[0], max = pts[0];
    for (const p of pts) { if (p.v < min.v) min = p; if (p.v > max.v) max = p; }
    return { min, max };
  }

  function textEq(s) {
    const pts = s.days.filter(p => p.v != null), shown = `${nice(s.days[0].d)} – ${nice(s.days[s.days.length - 1].d)}`;
    const parts = [`Shown: ${shown}`];
    if (s.row) parts.push(`today ${fmt(s.body, s.row[1])}`);
    if (pts.length) {
      if (s.body === 'sun') { const ex = extrema(s); parts.push(`closest sample ${mkm(ex.min.v)} on ${nice(ex.min.d)}`, `farthest sample ${mkm(ex.max.v)} on ${nice(ex.max.d)}`); }
      else { const lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v)); parts.push(`range in window ${km(lo)} – ${km(hi)}`); }
    }
    const gaps = s.days.filter(p => p.v == null && !p.outside).length, out = s.days.filter(p => p.outside).length;
    if (gaps) parts.push(`no sample for ${gaps} day${gaps > 1 ? 's' : ''} in this window (gaps)`);
    if (out) parts.push(`${out} day${out > 1 ? 's' : ''} outside the calculated range (${nice(st.cat.coverage.start)} – ${nice(st.cat.coverage.end)})`);
    return parts.join(' · ');
  }

  function rowHtml(s) {
    const name = s.body === 'moon' ? 'Moon' : 'Sun';
    let head;
    if (s.row) {
      const dir = direction(s.row[2]);
      head = `<div class="sky-val" data-today="${esc(s.today)}"><b class="sky-d">${esc(fmt(s.body, s.row[1]))}</b> from Earth's centre</div>`
        + `<div class="sky-ts">at 00:00 UTC, ${esc(nice(s.today))}${s.row[3] === 'UT~' ? ' <span class="sky-flag">(time estimated — see Details)</span>' : ''}</div>`
        + (dir ? `<div class="sky-dir">${esc(dir)}</div>` : '');
    } else {
      const why = s.outside ? `outside the calculated range (ends ${nice(st.cat.coverage.end)})` : 'no sample for this date';
      head = `<div class="sky-val sky-na" data-today="${esc(s.today)}">Today's distance unavailable — ${esc(why)}</div>`
        + (s.last ? `<div class="sky-last">Last available: ${esc(fmt(s.body, s.last[1]))} at 00:00 UTC, ${esc(nice(s.last[0]))}</div>` : '');
    }
    const note = s.body === 'moon' ? '<div class="cav sky-note">The Moon can be getting closer today even though its average orbit is growing over time.</div>'
      : '<div class="cav sky-note">Earth\'s distance from the Sun varies from roughly 147 to 152 million km over a year because its orbit is elliptical. Marked: the closest and farthest daily samples shown.</div>';
    return `<div class="sky-name">${name}</div>${head}${chart(s)}<div class="sky-te">${esc(textEq(s))}</div>${note}`;
  }

  function timeNote() {
    const t = st.cat.time;
    return `Samples are at 00:00 UTC. From ${nice(t.horizons_ut_tilde_from)}, Horizons marks the times as estimates because future leap seconds are not yet known. `
      + `A leap second at the end of June 2027 has not been decided; if one is added, samples from ${nice(t.first_date_affected_by_unresolved_leap_second)} would be off by one second until the next refresh.`;
  }

  // ---- render / recompute
  function render() {
    if (st.status !== 'ok') return;
    st.today = utcToday();
    for (const b of ['moon', 'sun']) { const el = $('sky-' + b); el.innerHTML = rowHtml(rowState(b, st.today)); el.hidden = false; }
    $('sky-time').textContent = timeNote();
  }

  function setStatus(s, reason) {
    st.status = s; st.reason = reason || null;
    const o = $('o-sky');
    o.textContent = s === 'off' ? 'off — switch on to load the distances'
      : s === 'loading' ? 'loading…'
      : s === 'ok' ? `Calculated daily samples, ${nice(st.cat.coverage.start)} – ${nice(st.cat.coverage.end)} (revision ${REV}); today is taken from your device's clock, in UTC.`
      : `Distances unavailable — the calculated data could not be loaded (${reason}).`;
    o.classList.toggle('bad', s === 'unavailable');
  }

  function clearNow() { for (const b of ['moon', 'sun']) { $('sky-' + b).innerHTML = ''; $('sky-' + b).hidden = true; } $('sky-time').textContent = ''; }

  async function load() {
    const t = ++st.token;
    setStatus('loading'); clearNow();
    let reason = null, buf = null;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(ME.HUB + '/catalogue/sky/' + encodeURIComponent(REV), { cache: 'no-store', signal: ctl.signal });
      if (!r.ok) { let b = null; try { b = await r.json(); } catch (e) {} reason = b && b.reason ? `the hub reports ${b.reason}` : `the hub answered ${r.status}`; }
      else buf = await r.arrayBuffer();
    } catch (e) { reason = 'the hub could not be reached'; }
    clearTimeout(timer);
    if (t !== st.token) return;
    let j = null;
    if (!reason) { try { if (await sha256(buf) !== SHA) reason = 'integrity check failed'; } catch (e) { reason = 'integrity check failed'; } }
    if (!reason) { try { j = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (e) { reason = 'invalid'; } }
    if (!reason && !schema(j)) reason = 'invalid';
    if (t !== st.token) return;
    if (reason) { st.cat = null; setStatus('unavailable', reason); return; }
    st.cat = j; st.index = {};
    for (const b of ['moon', 'sun']) st.index[b] = new Map(j.bodies[b].rows.map(r => [r[0], r]));
    setStatus('ok'); render();
  }

  function setOn(on) {
    st.on = on;
    $('tgl-sky').setAttribute('aria-checked', String(on));
    $('sky-body').hidden = !on;
    if (!on) { st.token++; st.cat = null; clearNow(); setStatus('off'); return; }
    select(st.view, false);
    if (st.cat) { setStatus('ok'); render(); } else load();
  }

  // ---- tabs (Now / Deep Time); roving tabindex, arrows, Home/End; activation by click, Enter, Space
  function select(view, focus) {
    st.view = view;
    for (const v of ['now', 'deep']) {
      const tab = $('sky-tab-' + v), on = v === view;
      tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1;
      $('sky-' + v).hidden = !on;
    }
    if (focus) $('sky-tab-' + view).focus();
  }
  $('sky-tabs').addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) select(t.dataset.view, true); });
  $('sky-tabs').addEventListener('keydown', e => {
    const t = e.target.closest('[role=tab]'); if (!t) return;
    const other = t.dataset.view === 'now' ? 'deep' : 'now';
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(other, true); }
    else if (e.key === 'Home') { e.preventDefault(); select('now', true); }
    else if (e.key === 'End') { e.preventDefault(); select('deep', true); }
  });

  $('tgl-sky').addEventListener('click', () => setOn(!st.on));
  setInterval(() => { if (st.on && st.status === 'ok') render(); }, ME.REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.on && st.status === 'ok') render(); });

  // read-only aid for tests and the console
  ME.skyState = () => ({ on: st.on, status: st.status, reason: st.reason, today: st.today, view: st.view, rev: REV });
  ME.skyRender = render;
})();
