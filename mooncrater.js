/* Moon tab: CRaTER good-event counts on LRO, a dated record (moon.html). MOON-CRATER-PROPOSAL rev 2 §7, §8, §11, §12; GPT's rev 2
 * build notes 2-4. Chad's go, 27 Nov 2026 (page-only branch preview).
 * Off by default; nothing is requested until the chart is opened. One small file, sha256-pinned, built by
 * phase1/moonsci/build_crater.py from two retained NASA PDS files. The file holds only integer GOOD sums N and exposure T = 600 s per
 * 10-minute group (or a withheld group with its reason); this page derives the rate N/T and the counting benchmark sqrt(N)/T, both
 * shown to 2 decimals. The groups are by UTC record timestamp. The drawing's time slider (craft.js, event me:craft-select) selects a
 * group; this chart draws no position, path or footprint of its own, and the drawing never depends on it.
 * Whole load (fetch, hash, parse, check, prepare) runs under one deadline and a generation token: a late answer cannot reopen a closed
 * chart or replace a newer request; a failure shows its reason and a Retry, and leaves the drawing, slider and globe working. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const btn = $('cr-toggle'), panel = $('cr-panel');
  if (!btn || !panel) return;
  const URL_ = 'assets/moon/crater/crater-good-2026-06-10-R1.json?v=1';
  const SHA = '50ef3c0cfd64879f429093e60bcd02ee1511480250f3615225ed12a0bbf19a5c';
  const REV = 'crater-good-2026-06-10-R1', CRAFT_REV = 'craft-moon-2026-06-R1';
  const START = Date.UTC(2026, 5, 10), BIN_MS = 600000, NB = 145;
  const TIMEOUT_MS = 10000;
  const KNOWN = ['it took too long', 'the file did not load', 'the file failed its integrity check', 'the file could not be read', 'the file is not in the expected form'];
  const REASONS = { 'incomplete': 'not all 600 one-second records are present', 'non-nominal setting': 'the instrument was not in its nominal settings for the whole group' };
  const S = { on: false, tok: 0, state: 'off', why: '', data: null, sel: null, bin: -1, loads: 0, ctl: null };
  const st = $('cr-state'), retry = $('cr-retry'), fig = $('cr-fig'), svg = $('cr-svg'), read = $('cr-read'), tbody = $('cr-tbody');
  const p2 = n => String(n).padStart(2, '0');
  const hm = ms => { const d = new Date(ms); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
  const day = ms => new Date(ms).getUTCDate() === 10 ? '10 June 2026' : '11 June 2026';
  const label = i => { const a = START + i * BIN_MS, b = a + BIN_MS; return `${day(a)}, ${hm(a)}–${hm(b) === '00:00' ? '24:00' : hm(b)} UTC${i === NB - 1 ? ' (the extra group)' : ''}`; };
  const fmt = x => x.toFixed(2);

  async function sha256(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
  const isInt = v => Number.isInteger(v) && v >= 0;
  /** Whole-payload check: everything the chart reads, before anything is drawn. Returns prepared groups or null. */
  function check(j) {
    if (!j || j.schema !== 'crater-good-bins-1' || j.revision !== REV || !j.source || j.source.doi !== '10.17189/2c1t-ph72' || j.source.release !== 67) return null;
    const B = j.binning;
    if (!B || B.start !== '2026-06-10T00:00:00Z' || B.bin_s !== 600 || B.n !== NB || B.live_time_correction !== false || B.timing_offset_applied !== false) return null;
    if (!Array.isArray(j.rows) || j.rows.length !== NB) return null;
    const g = [];
    for (const r of j.rows) {
      if (!Array.isArray(r)) return null;
      if (r.length === 2 && isInt(r[0]) && r[1] === 600 && r[0] <= 600 * 1200) {   // a validation bound chosen for this release (counts here are far below it), not a property of the counter
        g.push({ N: r[0], T: r[1], rate: r[0] / r[1], bench: Math.sqrt(r[0]) / r[1] });
      } else if (r.length === 5 && r[0] === null && r[1] === null && Object.prototype.hasOwnProperty.call(REASONS, r[2]) && isInt(r[3]) && r[3] <= 600 && isInt(r[4]) && r[4] <= r[3]) {
        g.push({ withheld: r[2], records: r[3], nominal: r[4] });
      } else return null;
    }
    return g;
  }

  // ---------- drawing (y axis from zero, so the size of any change is not exaggerated)
  // drawn at the chart's own width, so labels keep their size on narrow screens (redrawn on resize)
  let W = 640; const H = 230, L = 46, R = 12, TOP = 12, BOT = 34, YMAX = 40;
  const X = i => L + (W - L - R) * i / NB, Y = v => TOP + (H - TOP - BOT) * (1 - v / YMAX);
  function draw() {
    W = Math.max(300, Math.min(900, Math.round(fig.clientWidth || 640)));
    const g = S.data;
    let s = '<defs><pattern id="cr-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="#7f8da3" opacity=".55"/></pattern></defs>';
    for (const v of [0, 10, 20, 30, 40]) s += `<line class="crg" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="crt" x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
    for (const [i, t] of (W < 480 ? [[0, '00:00'], [72, '12:00'], [144, '24:00']] : [[0, '00:00'], [36, '06:00'], [72, '12:00'], [108, '18:00'], [144, '24:00']])) s += `<text class="crt" x="${X(i).toFixed(1)}" y="${H - 18}" text-anchor="${i === 0 ? 'start' : i === 144 ? 'end' : 'middle'}">${t}</text>`;
    s += W < 480 ? `<text class="crt" x="${L}" y="${H - 4}">10 June 2026 UTC + 11 June 00:00–00:10</text>`
      : `<text class="crt" x="${L}" y="${H - 4}">10 June 2026, UTC (by record time)</text><text class="crt" x="${W - R}" y="${H - 4}" text-anchor="end">+ 11 June 00:00–00:10</text>`;
    s += `<text class="crt" x="${L - 34}" y="${TOP}" transform="rotate(-90 ${L - 34} ${TOP})" text-anchor="end">events a second</text>`;
    if (S.bin >= 0) s += `<rect class="crsel" x="${X(S.bin).toFixed(1)}" y="${TOP}" width="${(X(1) - X(0)).toFixed(2)}" height="${H - TOP - BOT}"/>`;
    g.forEach((b, i) => {
      const x0 = X(i), x1 = X(i + 1);
      if (b.withheld) { s += `<rect class="crw" x="${x0.toFixed(1)}" y="${TOP}" width="${(x1 - x0).toFixed(2)}" height="${H - TOP - BOT}"><title>${label(i)}: no value</title></rect>`; return; }
      const xm = (x0 + x1) / 2;
      s += `<line class="crb" x1="${xm.toFixed(1)}" x2="${xm.toFixed(1)}" y1="${Y(b.rate + b.bench).toFixed(2)}" y2="${Y(b.rate - b.bench).toFixed(2)}"/>`
        + `<line class="crv${i === S.bin ? ' on' : ''}" x1="${x0.toFixed(1)}" x2="${x1.toFixed(1)}" y1="${Y(b.rate).toFixed(2)}" y2="${Y(b.rate).toFixed(2)}"/>`;
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = s;
  }
  function readout() {
    const sel = S.sel;
    if (!sel || sel.kind !== 'example' || sel.rev !== CRAFT_REV) { S.bin = -1; read.textContent = 'The drawing above shows no time from this dated record, so no group is selected.'; return; }
    const t = Date.parse(sel.t), i = Math.floor((t - START) / BIN_MS);
    if (!(t >= START && i >= 0 && i < NB)) { S.bin = -1; read.textContent = 'The drawing’s time is outside this record, so no group is selected.'; return; }
    S.bin = i; const b = S.data[i];
    read.innerHTML = b.withheld
      ? `<b>${label(i)}</b> (grouped by record time): no value. ${REASONS[b.withheld]} (${b.records} of 600 records, ${b.nominal} nominal).`
      : `<b>${label(i)}</b> (grouped by record time): <b>${fmt(b.rate)}</b> events a second, ±${fmt(b.bench)} approximate counting benchmark (${b.N.toLocaleString('en-GB')} events in ${b.T} s). Instrument counts on LRO, not a dose or a surface value.`;
  }
  function table() {
    tbody.innerHTML = S.data.map((b, i) => `<tr><th scope="row">${label(i)}</th>` + (b.withheld
      ? `<td colspan="3">no value: ${REASONS[b.withheld]} (${b.records} of 600 records, ${b.nominal} nominal)</td></tr>`
      : `<td>${b.N}</td><td>${fmt(b.rate)}</td><td>±${fmt(b.bench)}</td></tr>`)).join('');
  }
  function show() { readout(); draw(); }

  // ---------- state
  function setState(state, html) { S.state = state; st.innerHTML = html; retry.hidden = state !== 'failed'; fig.hidden = state !== 'shown'; }
  function fail(tok, why) { if (tok !== S.tok || !S.on) return; S.why = why; setState('failed', `<b>CRaTER chart unavailable</b> — ${why}. The drawing above is not affected.`); }
  async function load() {
    const tok = ++S.tok; S.loads++; S.why = '';
    if (S.ctl) S.ctl.abort();
    const ctl = S.ctl = new AbortController();
    setState('loading', 'loading the CRaTER record…');
    let timer;
    const deadline = new Promise((_, rej) => { timer = setTimeout(() => { ctl.abort(); rej(new Error('it took too long')); }, TIMEOUT_MS); });
    try {
      const work = (async () => {
        const r = await fetch(URL_, { signal: ctl.signal, cache: 'no-cache' });
        if (!r.ok) throw new Error('the file did not load');
        const buf = await r.arrayBuffer(); if (tok !== S.tok) return null;
        if (await sha256(buf) !== SHA) throw new Error('the file failed its integrity check'); if (tok !== S.tok) return null;
        let j; try { j = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { throw new Error('the file could not be read'); }
        const g = check(j); if (!g) throw new Error('the file is not in the expected form');
        return g;
      })();
      work.catch(() => {});                                 // a stopped fetch after the deadline is not an unhandled rejection
      const g = await Promise.race([work, deadline]);
      if (tok !== S.tok || !S.on || !g) return;        // a newer request, or closed meanwhile: drop this answer
      S.data = g; table(); setState('shown', ''); show();
    } catch (e) {
      const m = e && e.message;
      fail(tok, KNOWN.includes(m) ? m : 'the file did not load');   // fail() ignores a request that was replaced or closed
    } finally { clearTimeout(timer); if (S.ctl === ctl) S.ctl = null; }
  }
  function setOn(on) {
    S.on = on; btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Hide CRaTER’s event counts' : 'Show CRaTER’s event counts (dated record)';
    panel.hidden = !on;
    if (!on) { S.tok++; if (S.ctl) S.ctl.abort(); setState('off', ''); return; }
    if (S.data) { setState('shown', ''); show(); } else load();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (S.on && S.state === 'shown') draw(); }) : null;
  if (ro) ro.observe(fig); else addEventListener('resize', () => { if (S.on && S.state === 'shown') draw(); });
  btn.addEventListener('click', () => setOn(!S.on));
  retry.addEventListener('click', () => { if (S.on) load(); });
  document.addEventListener('me:craft-select', ev => { S.sel = ev.detail || null; if (S.on && S.state === 'shown') show(); });
  S.sel = (window.ME && window.ME.craftSelection) || null;

  window.ME = window.ME || {};
  window.ME.craterState = () => ({ on: S.on, state: S.state, why: S.why, bin: S.bin, loads: S.loads, tok: S.tok, n: S.data ? S.data.length : 0,
    readout: read.textContent, sel: S.sel ? S.sel.t : null });
})();
