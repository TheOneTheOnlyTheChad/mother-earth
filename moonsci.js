/* Moon height layer (moon.html): "What LRO measured: height". MOON-LRO-SCIENCE-PROPOSAL rev 2.1; Chad's go, 26 Nov 2026.
 * Optional, off by default. Source: LOLA LDEM_4_FLOAT V3.0 (NASA PDS, DOI 10.17189/tnyt-7007): height relative to a 1737.4 km
 * reference sphere on a 0.25 degree grid, compiled from laser data taken 13 Jul 2009 - 29 Nov 2016. Not live.
 * Two files, fetched only when the button is first pressed, each checked before use (built by phase1/moonsci/build_lola.py):
 *   the readout grid: int16 little-endian whole metres, 720 x 1440 in the source's order (row 0 at 90 N, column 0 at 0 E),
 *     -32768 = withheld (north of 89.5 N), gzip. Decoded with DecompressionStream and an explicit little-endian read (DataView):
 *     no image and no canvas, so no 8-bit colour path. Two pins: the compressed bytes and the decompressed bytes. If the server
 *     already removed the gzip layer, the decompressed pin alone decides.
 *   the colour texture: 2048 x 1024 PNG, 0 deg at the centre like the Moon picture, each pixel the colour of its 0.25 deg cell.
 *   The withheld cap (north of 89.5 N) is also drawn on top as a grey polygon: in the texture it is three pixel rows, which the
 *   graphics card blurs into the blue at the pole.
 * State contract (rev 2.1 §4.3): nothing in the view changes until both files are ready; on failure nothing changes; on success
 * the Earth view is left, "Lit as now" is set off and both lighting buttons are disabled; switching height off brings the
 * picture back and restores "Lit as now" (for the current minute) if it was on; the Earth view is not reopened. A late response
 * after the user has switched height off is ignored (token) and the fetch is aborted. The LRO overlay is never touched. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const btn = $('mg-height'), cbtn = $('mg-height-centre'), leg = $('mg-height-leg'), rd = $('mg-height-read');
  if (!btn || !leg || !rd) return;
  const F = {
    grid: { url: 'assets/moon/lola/ldem4-m-R1.i16.gz?v=1', gzBytes: 1776231, gzSha: 'af4450019840918da4a62812f4969ad07a0c77bf3f878ef59ca7e8961cc7d43d',
      rawBytes: 2073600, rawSha: '392bceff7827ceb8cf6a8e9292f3903d317d4da590765f5152cda8587db4c155' },
    tex: { url: 'assets/moon/lola/ldem4-colour-R1.png?v=1', bytes: 802415, sha: 'e9281ca2a92cec0deb93e3f46837d6a0053056f4f14fd1f3ed945be8d4e63a58' },
  };
  const ROWS = 720, COLS = 1440, WITHHELD = -32768, TIMEOUT_MS = 15000;
  const WITHHELD_TEXT = 'Values north of 89.5°N are withheld because inconsistencies were found in the source products.';
  const st = { on: false, phase: 'off', token: 0, ctl: null, grid: null, texUrl: null, prev: null, why: '' };

  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  class Why extends Error {}
  async function get(url, signal) {
    let r; try { r = await fetch(url, { signal }); } catch (e) { throw new Why(signal.aborted ? 'it took too long or was cancelled' : 'the network request failed'); }
    if (!r.ok) throw new Why('the server answered HTTP ' + r.status);
    return r.arrayBuffer();
  }
  /** The readout grid, as an Int16Array read explicitly as little-endian. Throws Why with a plain reason. */
  async function loadGrid(signal) {
    const buf = await get(F.grid.url, signal); const u = new Uint8Array(buf);
    let raw;
    if (u.length >= 2 && u[0] === 0x1f && u[1] === 0x8b) {
      if (u.length !== F.grid.gzBytes || await hex(buf) !== F.grid.gzSha) throw new Why('the height file failed its integrity check');
      if (typeof DecompressionStream !== 'function') throw new Why('this browser cannot unpack the height file (it needs a newer browser)');
      try { raw = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
      catch (e) { throw new Why('the height file could not be unpacked'); }
    } else raw = buf;   // a server that removed the gzip layer itself: the decompressed pin alone decides
    if (raw.byteLength !== F.grid.rawBytes || await hex(raw) !== F.grid.rawSha) throw new Why('the height values failed their integrity check');
    const dv = new DataView(raw), a = new Int16Array(ROWS * COLS);
    for (let i = 0; i < a.length; i++) a[i] = dv.getInt16(2 * i, true);
    return a;
  }
  async function loadTex(signal) {
    const buf = await get(F.tex.url, signal);
    if (buf.byteLength !== F.tex.bytes || await hex(buf) !== F.tex.sha) throw new Why('the height map picture failed its integrity check');
    const url = URL.createObjectURL(new Blob([buf], { type: 'image/png' }));
    const img = new Image(); img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw new Why('the height map picture could not be decoded'); }
    if (img.naturalWidth !== 2048 || img.naturalHeight !== 1024) { URL.revokeObjectURL(url); throw new Why('the height map picture is not the expected size'); }
    return url;
  }

  /** Value of the 0.25 degree cell containing (lat, east longitude). Row 0 at 90 N, column 0 at 0 E (source order). */
  const cellIndex = (lat, lng) => { const r = Math.min(ROWS - 1, Math.max(0, Math.floor((90 - lat) * 4))); const c = Math.floor((((lng % 360) + 360) % 360) * 4) % COLS; return r * COLS + c; };
  const deg = (v, pos, neg) => Math.abs(v).toFixed(2) + '°' + (v >= 0 ? pos : neg);
  const norm = lng => ((lng + 180) % 360 + 360) % 360 - 180;
  const metres = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-GB') + ' m';
  function readAt(lat, lng, how) {
    if (st.phase !== 'on' || !st.grid) return;
    const v = st.grid[cellIndex(lat, lng)], where = deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W');
    rd.hidden = false;
    rd.textContent = v === WITHHELD ? `${where}: no value. ${WITHHELD_TEXT}`
      : `${where} (${how}): ${metres(v)} relative to the 1,737.4 km reference sphere · value of the 0.25° cell containing this point (no interpolation).`;
    rd.dataset.value = String(v); rd.dataset.lat = String(lat); rd.dataset.lng = String(lng);
  }

  const MG = () => window.MoonGlobe && window.MoonGlobe.height;
  function paint() {
    btn.setAttribute('aria-pressed', String(st.on)); btn.setAttribute('aria-busy', String(st.phase === 'loading'));
    btn.textContent = st.phase === 'loading' ? 'Height: loading…' : st.phase === 'on' ? 'Hide height (LOLA)' : 'Show height (LOLA)';
    leg.hidden = st.phase !== 'on'; if (cbtn) cbtn.hidden = st.phase !== 'on';
    document.getElementById('mg-globe').dataset.height = st.phase;
  }
  function say(t) { rd.hidden = !t; rd.textContent = t || ''; delete rd.dataset.value; delete rd.dataset.lat; delete rd.dataset.lng; }

  async function turnOn() {
    const h = MG();
    if (!h || !h.ready()) { say('Height map unavailable: the globe is not running.'); return; }
    st.on = true; st.phase = 'loading'; const tok = ++st.token; say(''); paint();
    const ctl = new AbortController(); st.ctl = ctl; const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const [grid, texUrl] = await Promise.all([st.grid || loadGrid(ctl.signal), st.texUrl || loadTex(ctl.signal)]);
      if (tok !== st.token || !st.on) return;   // switched off (or pressed again) while loading: a late answer changes nothing
      st.grid = grid; st.texUrl = texUrl;      // kept: later toggles make no requests
      // one step: remember, leave the Earth view, sunlight off and locked, then the texture
      st.prev = h.lit(); h.litOff(); h.lock(true); h.texture(texUrl); h.cap(true);
      st.phase = 'on'; paint();
      say('Sunlight is not drawn on the height map, so “Lit as now” is off while height is shown. Click the globe, or use “Read height at centre”, to read a value.');
    } catch (e) {
      if (tok !== st.token) return;
      st.on = false; st.phase = 'off'; paint();   // nothing in the view has changed
      say('Height map could not be loaded: ' + (e instanceof Why ? e.message : 'an unexpected error') + '. The globe is unchanged.');
    } finally { clearTimeout(tm); if (st.ctl === ctl) st.ctl = null; }
  }
  function turnOff() {
    const h = MG();
    if (st.phase === 'loading') { st.token++; if (st.ctl) st.ctl.abort(); st.on = false; st.phase = 'off'; paint(); say(''); return; }
    if (st.phase !== 'on') return;
    st.on = false; st.phase = 'off';
    if (h) { h.texture(null); h.cap(false); h.lock(false); if (st.prev && st.prev.on) h.litRestore(true); }
    const wasEarth = st.prev && st.prev.earth; st.prev = null; paint();
    say(wasEarth ? 'Earth view was closed while height was shown; “As seen from Earth now” can reopen it.' : '');
  }
  btn.addEventListener('click', () => { if (st.on) turnOff(); else turnOn(); });
  if (cbtn) cbtn.addEventListener('click', () => { const h = MG(), v = h && h.centre(); if (v) readAt(v.lat, v.lng, 'centre of view'); });
  const hookUp = setInterval(() => { const h = MG(); if (h) { clearInterval(hookUp); h.onClick((lat, lng) => readAt(lat, lng, 'clicked')); } }, 200);
  paint();
  window.MoonHeight = { state: () => ({ on: st.on, phase: st.phase, token: st.token, cached: { grid: !!st.grid, tex: !!st.texUrl }, prev: st.prev }),   // test aids
    value: (lat, lng) => st.grid ? st.grid[cellIndex(lat, lng)] : null, index: cellIndex, grid: () => st.grid };
})();
