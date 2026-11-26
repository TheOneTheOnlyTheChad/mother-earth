/* Moon science layers (moon.html): "What LRO measured: height" (LOLA) and "What LRO measured: brightness temperature" (Diviner).
 * Both optional, off by default, not live. One coordinator (MoonScience) owns what is on the globe; each layer owns its own data.
 *
 * Height (MOON-LRO-SCIENCE-PROPOSAL rev 2.1; released 26 Nov 2026). Source: LOLA LDEM_4_FLOAT V3.0 (NASA PDS, DOI 10.17189/tnyt-7007):
 * height relative to a 1737.4 km reference sphere on a 0.25 degree grid, laser data 13 Jul 2009 - 29 Nov 2016. Two files, each checked
 * before use (phase1/moonsci/build_lola.py): the readout grid (int16 LE whole metres, 720 x 1440, row 0 at 90 N, column 0 at 0 E,
 * -32768 = withheld north of 89.5 N, gzip; decoded with an explicit little-endian read, two pins) and the colour texture (2048 x 1024
 * PNG). The withheld cap is also drawn on top as a grey polygon.
 *
 * Temperature (MOON-DIVINER-PROPOSAL rev 2 with GPT's review notes; masks and scales frozen by Chad, 26 Nov 2026). Source: Diviner
 * Global Cumulative Product (GCP), LRO-L-DLRE-5-GCP-V1.0, field tbol, bundle DOI 10.17189/wj0s-w188, nadir observations
 * 5 Jul 2009 - 1 Apr 2015. One file (phase1/moonsci/build_diviner.py), MEDIVNR1: a 64-byte header and six planes on a 720 x 360 grid of
 * 0.5 degree cells (column 0 centred 0.25 E, row 0 centred 89.75 N): noon and midnight value (u16; 0 = no valid data in this window,
 * 1 = withheld by our display policy, v >= 2 -> v/10 K), bin count n (u8) and range between bins (u8 whole K; 254 = at least 253.5 K,
 * 255 = unavailable). The whole file is checked before anything is shown (proposal §6.3): gzip and raw pins, every header field, the
 * header's payload hash, and the consistency of every cell's codes. The value shown is OUR unweighted mean of the available
 * quarter-hour tbol bins within an hour of local noon (11:30-12:30) or local midnight (23:30-00:30). The texture is drawn here from
 * the checked grid: one fixed ramp, one fixed scale per mode (noon 281-395 K, midnight 70-105 K), no valid data in a dark neutral
 * hatch, withheld in a flat light neutral.
 *
 * Transitions (proposal §5, GPT's note 2). active is none, height, temp-noon or temp-mid. The lighting state is saved ONCE, on entering
 * science mode, and kept across height <-> temperature and noon <-> midnight. While a new map loads and is checked, the shown map stays.
 * On success the texture is swapped in one call. On failure or cancel nothing changes (a radio button that asked for the failed mode
 * goes back to the mode shown). Leaving science mode (the active layer's own button) brings the picture back and restores "Lit as now"
 * for the current minute if it was on; the Earth view is not reopened. Every request takes a new token and aborts the previous one;
 * only the latest may commit. Leaving also cancels anything pending, so a late answer cannot reopen science mode. Anything a failed,
 * cancelled or late attempt made (object URLs, decoded arrays) is released. The LRO overlay is never touched. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const hbtn = $('mg-height'), hcbtn = $('mg-height-centre'), hleg = $('mg-height-leg'), hrd = $('mg-height-read');
  const tbtn = $('mg-temp'), tcbtn = $('mg-temp-centre'), tleg = $('mg-temp-leg'), trd = $('mg-temp-read'), tmode = $('mg-temp-mode');
  if (!hbtn || !hleg || !hrd) return;
  const TIMEOUT_MS = 15000;
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  class Why extends Error {}
  async function get(url, signal) {
    let r; try { r = await fetch(url, { signal }); } catch (e) { throw new Why(signal.aborted ? 'it took too long or was cancelled' : 'the network request failed'); }
    if (!r.ok) throw new Why('the server answered HTTP ' + r.status);
    try { return await r.arrayBuffer(); } catch (e) { throw new Why(signal.aborted ? 'it took too long or was cancelled' : 'the download broke off'); }
  }
  async function gunzipIfNeeded(buf, gzBytes, gzSha, what) {
    const u = new Uint8Array(buf);
    if (u.length >= 2 && u[0] === 0x1f && u[1] === 0x8b) {
      if (u.length !== gzBytes || await hex(buf) !== gzSha) throw new Why(`the ${what} file failed its integrity check`);
      if (typeof DecompressionStream !== 'function') throw new Why(`this browser cannot unpack the ${what} file (it needs a newer browser)`);
      try { return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
      catch (e) { throw new Why(`the ${what} file could not be unpacked`); }
    }
    return buf;   // a server that removed the gzip layer itself: the decompressed pin alone decides
  }
  const deg = (v, pos, neg) => Math.abs(v).toFixed(2) + '°' + (v >= 0 ? pos : neg);
  const norm = lng => ((lng + 180) % 360 + 360) % 360 - 180;
  const MG = () => window.MoonGlobe && window.MoonGlobe.height;
  const say = (el, t) => { if (!el) return; el.hidden = !t; el.textContent = t || ''; for (const k of Object.keys(el.dataset)) delete el.dataset[k]; };

  // ============================== height layer ==============================
  const HF = {
    grid: { url: 'assets/moon/lola/ldem4-m-R1.i16.gz?v=1', gzBytes: 1776231, gzSha: 'af4450019840918da4a62812f4969ad07a0c77bf3f878ef59ca7e8961cc7d43d',
      rawBytes: 2073600, rawSha: '392bceff7827ceb8cf6a8e9292f3903d317d4da590765f5152cda8587db4c155' },
    tex: { url: 'assets/moon/lola/ldem4-colour-R1.png?v=1', bytes: 802415, sha: 'e9281ca2a92cec0deb93e3f46837d6a0053056f4f14fd1f3ed945be8d4e63a58' },
  };
  const HROWS = 720, HCOLS = 1440, HWITHHELD = -32768;
  const WITHHELD_TEXT = 'Values north of 89.5°N are withheld because inconsistencies were found in the source products.';
  const H = { grid: null, texUrl: null, revoked: 0 };
  async function loadGrid(signal) {
    const buf = await get(HF.grid.url, signal);
    const raw = await gunzipIfNeeded(buf, HF.grid.gzBytes, HF.grid.gzSha, 'height');
    if (raw.byteLength !== HF.grid.rawBytes || await hex(raw) !== HF.grid.rawSha) throw new Why('the height values failed their integrity check');
    const dv = new DataView(raw), a = new Int16Array(HROWS * HCOLS);
    for (let i = 0; i < a.length; i++) a[i] = dv.getInt16(2 * i, true);
    return a;
  }
  async function loadTex(signal) {
    const buf = await get(HF.tex.url, signal);
    if (buf.byteLength !== HF.tex.bytes || await hex(buf) !== HF.tex.sha) throw new Why('the height map picture failed its integrity check');
    const url = URL.createObjectURL(new Blob([buf], { type: 'image/png' }));
    const img = new Image(); img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw new Why('the height map picture could not be decoded'); }
    if (img.naturalWidth !== 2048 || img.naturalHeight !== 1024) { URL.revokeObjectURL(url); throw new Why('the height map picture is not the expected size'); }
    return url;
  }
  const hIndex = (lat, lng) => { const r = Math.min(HROWS - 1, Math.max(0, Math.floor((90 - lat) * 4))); const c = Math.floor((((lng % 360) + 360) % 360) * 4) % HCOLS; return r * HCOLS + c; };
  const metres = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-GB') + ' m';
  const height = {
    name: 'height',
    /** Resources for showing height: cached ones, or new ones loaded and checked. Each file loads on its own; the first failure aborts
     *  the other. Every outcome is waited for, so a texture URL made by this attempt is either committed (kept) or released. */
    async prepare(target, ctl) {
      let firstErr = null; const first = p => p.catch(e => { if (!firstErr) firstErr = e; ctl.abort(); throw e; });
      const [g, t] = await Promise.allSettled([H.grid ? Promise.resolve(H.grid) : first(loadGrid(ctl.signal)), H.texUrl ? Promise.resolve(H.texUrl) : first(loadTex(ctl.signal))]);
      const madeTex = t.status === 'fulfilled' && t.value !== H.texUrl ? t.value : null;
      const drop = () => { if (madeTex) { URL.revokeObjectURL(madeTex); H.revoked++; } };
      if (g.status === 'rejected' || t.status === 'rejected') { drop(); throw firstErr || (g.status === 'rejected' ? g.reason : t.reason); }
      return { url: t.value, drop, keep: () => { H.grid = g.value; H.texUrl = t.value; } };
    },
    shown() { say(hrd, 'Sunlight is not drawn on the height map, so “Lit as now” is off while height is shown. Click the globe, or use “Read height at centre”, to read a value.'); },
    hidden() { say(hrd, ''); },
    failed(e) { say(hrd, 'Height map could not be loaded: ' + (e instanceof Why ? e.message : 'an unexpected error') + '. ' + (MS.active ? 'The map shown is unchanged.' : 'The globe is unchanged.')); },
    readAt(lat, lng, how) {
      if (MS.active !== 'height' || !H.grid) return;
      const v = H.grid[hIndex(lat, lng)], where = deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W');
      rdSet(hrd, v === HWITHHELD ? `${where}: no value. ${WITHHELD_TEXT}`
        : `${where} (${how}): ${metres(v)} relative to the 1,737.4 km reference sphere · value of the 0.25° cell containing this point (no interpolation).`, { value: String(v), lat: String(lat), lng: String(lng) });
    },
  };
  function rdSet(el, t, data) { say(el, t); for (const [k, v] of Object.entries(data || {})) el.dataset[k] = v; }

  // ============================== temperature layer ==============================
  const TF = { url: 'assets/moon/diviner/gcp-tbol-nm-R1.bin.gz?v=1', gzBytes: 720037, gzSha: '1d81cb86738d81797ad92449419d4c46a2e8ffe6233a66863dcf2e05fde611d0',
    rawBytes: 2073664, rawSha: 'cfaaabd8ecc9cdeb92644811f20ffd0d463cbde5073b19b49289176daaabff92' };
  const TC = 720, TR = 360, NCELL = TC * TR;
  const MODES = { noon: { word: 'noon', window: '11:30–12:30', maskTenths: 700, lo: 281, hi: 395, clipLo: '0.93', clipHi: '0.43' },
                  mid: { word: 'midnight', window: '23:30–00:30', maskTenths: 800, lo: 70, hi: 105, clipLo: '0.85', clipHi: '0.75' } };
  // one fixed sequential ramp for both modes (viridis stops); the two neutrals are not ramp colours
  const RAMP = ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const NODATA_A = [46, 46, 46], NODATA_B = [107, 107, 107], WITHHELD_RGB = [207, 207, 207];
  const PX = 4, TW = TC * PX, TH = TR * PX;   // texture: 2880 x 1440, 4 x 4 pixels per cell, 0 degrees at the centre like the picture
  const T = { grid: null, tex: { noon: null, mid: null }, revoked: 0, decodeMs: null, drawMs: {} };
  /** Decode and check the whole file. Returns { value: {noon, mid} Uint16Array, n: {...} Uint8Array, range: {...} Uint8Array }. */
  async function loadTemp(signal) {
    const t0 = performance.now();
    const buf = await get(TF.url, signal);
    const raw = await gunzipIfNeeded(buf, TF.gzBytes, TF.gzSha, 'temperature');
    if (raw.byteLength !== TF.rawBytes || await hex(raw) !== TF.rawSha) throw new Why('the temperature values failed their integrity check');
    const dv = new DataView(raw), u8 = new Uint8Array(raw);
    const magic = String.fromCharCode(...u8.subarray(0, 8));
    const want = [[8, 1], [10, 64], [12, TC], [14, TR], [16, 6], [18, 0], [24, 50], [26, 700], [28, 800], [30, 0]];
    if (magic !== 'MEDIVNR1' || want.some(([o, v]) => dv.getUint16(o, true) !== v) || dv.getInt16(20, true) !== 25 || dv.getInt16(22, true) !== 8975)
      throw new Why('the temperature file header is not the expected one');
    const pay = await hex(raw.slice(64));
    if (pay !== [...u8.subarray(32, 64)].map(b => b.toString(16).padStart(2, '0')).join('')) throw new Why('the temperature file failed its payload check');
    const g = { value: {}, n: {}, range: {} };
    const off = { value: { noon: 64, mid: 64 + 2 * NCELL }, n: { noon: 64 + 4 * NCELL, mid: 64 + 5 * NCELL }, range: { noon: 64 + 6 * NCELL, mid: 64 + 7 * NCELL } };
    for (const m of ['noon', 'mid']) {
      const v = new Uint16Array(NCELL); for (let i = 0; i < NCELL; i++) v[i] = dv.getUint16(off.value[m] + 2 * i, true);
      g.value[m] = v; g.n[m] = u8.slice(off.n[m], off.n[m] + NCELL); g.range[m] = u8.slice(off.range[m], off.range[m] + NCELL);
      const mask = MODES[m].maskTenths * 10, n = g.n[m], rg = g.range[m];
      for (let r = 0; r < TR; r++) {
        const masked = Math.abs(8975 - 50 * r) > mask;
        for (let c = 0; c < TC; c++) { const i = r * TC + c, x = v[i], k = n[i], q = rg[i];
          const okCell = x === 1 ? masked && k === 0 && q === 255
            : x === 0 ? !masked && k === 0 && q === 255
            : !masked && x >= 2 && x <= 4500 && k >= 1 && k <= 4 && (k === 1 ? q === 255 : q <= 254);
          if (!okCell) throw new Why(`the temperature file failed its cell check (${MODES[m].word}, row ${r}, column ${c})`); } }
    }
    T.decodeMs = Math.round(performance.now() - t0);
    return g;
  }
  const lut = m => { const { lo, hi } = MODES[m], out = new Uint8Array(4501 * 3);
    for (let v = 2; v <= 4500; v++) { const t = Math.min(1, Math.max(0, (v / 10 - lo) / (hi - lo))) * (RAMP.length - 1), k = Math.min(RAMP.length - 2, Math.floor(t)), f = t - k;
      for (let ch = 0; ch < 3; ch++) out[3 * v + ch] = Math.round(RAMP[k][ch] + (RAMP[k + 1][ch] - RAMP[k][ch]) * f); }
    return out; };
  /** Grid column c (centred 0.25 + 0.5c degrees east) lands in texture columns starting at x = (4c + 1440) mod 2880 (0 degrees at the centre). */
  const texX = c => (PX * c + TW / 2) % TW;
  async function drawTemp(g, m) {
    const t0 = performance.now(), L = lut(m), v = g.value[m];
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    const cx = cv.getContext('2d'); const img = cx.createImageData(TW, TH), d = img.data;
    for (let r = 0; r < TR; r++) for (let c = 0; c < TC; c++) {
      const x = v[r * TC + c], x0 = texX(c), y0 = PX * r;
      for (let dy = 0; dy < PX; dy++) for (let dx = 0; dx < PX; dx++) {
        const X = x0 + dx, Y = y0 + dy, k = 4 * (Y * TW + X);
        const rgb = x === 1 ? WITHHELD_RGB : x === 0 ? (((X + Y) & 3) === 0 ? NODATA_B : NODATA_A) : null;
        if (rgb) { d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; } else { d[k] = L[3 * x]; d[k + 1] = L[3 * x + 1]; d[k + 2] = L[3 * x + 2]; }
        d[k + 3] = 255; } }
    cx.putImageData(img, 0, 0);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    cv.width = cv.height = 0;
    if (!blob) throw new Why('the temperature map picture could not be drawn');
    T.drawMs[m] = Math.round(performance.now() - t0);
    return URL.createObjectURL(blob);
  }
  const tIndex = (lat, lng) => { const r = Math.min(TR - 1, Math.max(0, Math.floor((90 - lat) * 2))); const c = Math.floor((((lng % 360) + 360) % 360) * 2) % TC; return r * TC + c; };
  const cellCentre = i => { const r = Math.floor(i / TC), c = i % TC; return deg(89.75 - 0.5 * r, 'N', 'S') + ', ' + deg(norm(0.25 + 0.5 * c), 'E', 'W'); };
  /** Kelvin in tenths to the readout: K exactly as stored; °C = K - 273.15, which always ends in 5 hundredths, rounded half away from zero. */
  const kelvin = x => { const s = x - 2731.5, c = Math.sign(s) * Math.round(Math.abs(s)); return (x / 10).toFixed(1) + ' K (' + (c < 0 ? '−' : '') + (Math.abs(c) / 10).toFixed(1) + ' °C)'; };
  const SCALE_LINE = m => { const a = MODES[m], b = MODES[m === 'noon' ? 'mid' : 'noon'];
    return `Colour scale: ${a.word} ${a.lo}–${a.hi} K. The ${b.word} map uses ${b.lo}–${b.hi} K. The same colour does not mean the same temperature on the two maps.`; };
  /** The readout sentence for one cell (proposal §4, GPT's note 1 for the cap). */
  function tText(m, i, where) {
    const x = T.grid.value[m][i], n = T.grid.n[m][i], q = T.grid.range[m][i], md = MODES[m];
    if (x === 1) return `${where}: not shown. Our display limit is 70° latitude for noon (80° for midnight). Near the poles the Sun stays low and local time means little, so a one-hour window mixes very different temperatures. This is our choice, not the edge of Diviner’s coverage.`;
    if (x === 0) return `${where}: no valid data in this window for this cell (centred ${cellCentre(i)}).`;
    const spread = n === 1 ? 'one bin; range unavailable' : `mean of ${n} quarter-hour bins · range between bins ${q === 254 ? 'at least 253.5 K (display capped)' : q + ' K'}`;
    return `${where}: ${kelvin(x)} around local ${md.word} · ${spread} · 0.5° cell centred ${cellCentre(i)}.`;
  }
  const tMode = t => t === 'temp-noon' ? 'noon' : 'mid';
  const temp = {
    name: 'temperature',
    async prepare(target, ctl) {
      const m = tMode(target), made = [];
      let g = T.grid;
      if (!g) g = await loadTemp(ctl.signal);
      if (ctl.signal.aborted) throw new Why('it took too long or was cancelled');
      let url = T.tex[m];
      if (!url) { url = await drawTemp(g, m); made.push(url); }
      const drop = () => { for (const u of made) { URL.revokeObjectURL(u); T.revoked++; } };
      return { url, drop, keep: () => { T.grid = g; T.tex[m] = url; } };
    },
    shown(target, from) {
      const m = tMode(target); paintLegend(m);
      if (from === 'temp-noon' || from === 'temp-mid') say(trd, `Now showing around local ${MODES[m].word}. ${SCALE_LINE(m)}`);
      else say(trd, 'Sunlight is not drawn on the temperature map, so “Lit as now” is off while it is shown. Click the globe, or use “Read temperature at centre”, to read a value.');
    },
    hidden() { say(trd, ''); },
    failed(e, target) { say(trd, 'Temperature map could not be loaded: ' + (e instanceof Why ? e.message : 'an unexpected error') + '. ' + (MS.active ? 'The map shown is unchanged.' : 'The globe is unchanged.')); },
    readAt(lat, lng, how) {
      if (!(MS.active === 'temp-noon' || MS.active === 'temp-mid') || !T.grid) return;
      const m = tMode(MS.active), i = tIndex(lat, lng), where = deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W') + ` (${how})`;
      rdSet(trd, tText(m, i, where), { mode: m, value: String(T.grid.value[m][i]), n: String(T.grid.n[m][i]), range: String(T.grid.range[m][i]), lat: String(lat), lng: String(lng), cell: String(i) });
    },
  };
  function paintLegend(m) {
    if (!tleg) return; const md = MODES[m];
    tleg.querySelector('[data-t="title"]').textContent = `What LRO measured: brightness temperature around local ${md.word}`;
    tleg.querySelector('[data-t="line"]').textContent = `Our unweighted mean of the available quarter-hour Diviner bin temperatures within an hour of each place’s own local ${md.word} (${md.window}). The bins were compiled by the Diviner team from observations made July 2009 – April 2015. Each 0.5° map cell is much larger than Diviner’s footprint. This is not today’s temperature, and the Moon is shown evenly lit.`;
    tleg.querySelector('[data-t="scale"]').textContent = SCALE_LINE(m);
    const ticks = tleg.querySelector('[data-t="ticks"]'), steps = m === 'noon' ? [281, 300, 325, 350, 375, 395] : [70, 80, 90, 100, 105];
    ticks.innerHTML = ''; for (const k of steps) { const s = document.createElement('span'); s.style.left = ((k - md.lo) / (md.hi - md.lo) * 100) + '%';
      s.textContent = k === md.lo ? `≤ ${k} K` : k === md.hi ? `≥ ${k} K` : String(k); if ([300, 375, 80, 100].includes(k)) s.className = 'mgt-minor'; ticks.appendChild(s); }   // minor ticks give way on narrow screens
    tleg.querySelector('[data-t="bar"]').setAttribute('aria-label', `Colour scale from dark purple at ${md.lo} kelvin or less to yellow at ${md.hi} kelvin or more`);
    tleg.querySelector('[data-t="clip"]').textContent = `Colours stop at the scale’s ends: ${md.clipLo}% of the shown cells with a value are below ${md.lo} K and ${md.clipHi}% are above ${md.hi} K. The readout gives their value.`;
  }

  // ============================== the coordinator ==============================
  const LAYER = { height, 'temp-noon': temp, 'temp-mid': temp };
  const MS = { active: null, saved: null, entry: null, pend: null, tok: 0, commits: 0 };
  /** Ask for a map. Pressing a layer's button while that map is shown leaves science mode; pressing it while it is loading cancels. */
  async function request(target) {
    const h = MG();
    if (!h || !h.ready()) { LAYER[target].failed(new Why('the globe is not running'), target); return; }
    if (MS.pend) cancel();
    const tok = ++MS.tok, ctl = new AbortController(); MS.pend = { target, tok, ctl };
    if (!MS.active || LAYER[MS.active] !== LAYER[target]) LAYER[target].hidden(); paint();
    const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let res = null, err = null;
    try { res = await LAYER[target].prepare(target, ctl); } catch (e) { err = e; }
    clearTimeout(tm);
    if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }   // superseded, cancelled or left: a late answer changes nothing
    MS.pend = null;
    if (err) { syncRadio(); LAYER[target].failed(err, target); paint(); return; }
    // one step: remember (only on entering), leave the Earth view, sunlight off and locked, then the texture
    const from = MS.active;
    if (!from) { MS.saved = h.lit(); MS.entry = target; h.litOff(); h.lock(true); }
    res.keep(); h.texture(res.url); h.cap(target === 'height');
    if (from && LAYER[from] !== LAYER[target]) LAYER[from].hidden();
    MS.active = target; MS.commits++; syncRadio(); paint();
    LAYER[target].shown(target, from);
  }
  function cancel() { if (!MS.pend) return; MS.tok++; MS.pend.ctl.abort(); MS.pend = null; syncRadio(); paint(); }
  function leave() {
    const h = MG(), was = MS.active; cancel();
    if (!was) return;
    if (h) { h.texture(null); h.cap(false); h.lock(false); if (MS.saved && MS.saved.on) h.litRestore(true); }
    const wasEarth = MS.saved && MS.saved.earth, entry = MS.entry;
    MS.active = null; MS.saved = null; MS.entry = null; paint();
    for (const L of new Set(Object.values(LAYER))) L.hidden();
    if (wasEarth) say(LAYER[was] === height ? hrd : trd, `Earth view was closed while ${entry === 'height' ? 'height' : 'the temperature map'} was shown; “As seen from Earth now” can reopen it.`);
  }
  const isTemp = t => t === 'temp-noon' || t === 'temp-mid';
  const radioMode = () => { const r = tmode && tmode.querySelector('input:checked'); return r && r.value === 'midnight' ? 'temp-mid' : 'temp-noon'; };
  /** The radio buttons always show the mode on the globe (or, while temperature is off, the mode it will open in). */
  function syncRadio() { if (!tmode) return; const t = isTemp(MS.active) ? MS.active : null; if (!t) return;
    for (const r of tmode.querySelectorAll('input')) r.checked = (r.value === 'midnight') === (t === 'temp-mid'); }
  function paint() {
    const pend = MS.pend && MS.pend.target, a = MS.active;
    const hOn = a === 'height' || pend === 'height', hLoad = pend === 'height';
    hbtn.setAttribute('aria-pressed', String(hOn)); hbtn.setAttribute('aria-busy', String(hLoad));
    hbtn.textContent = hLoad ? 'Height: loading…' : a === 'height' ? 'Hide height (LOLA)' : 'Show height (LOLA)';
    hleg.hidden = a !== 'height'; if (hcbtn) hcbtn.hidden = a !== 'height';
    if (tbtn) { const tLoad = isTemp(pend) && !isTemp(a), tOn = isTemp(a) || isTemp(pend);
      tbtn.setAttribute('aria-pressed', String(tOn)); tbtn.setAttribute('aria-busy', String(isTemp(pend)));
      tbtn.textContent = tLoad ? 'Temperature: loading…' : isTemp(a) ? 'Hide temperature (Diviner)' : 'Show temperature (Diviner)';
      tleg.hidden = !isTemp(a); if (tcbtn) tcbtn.hidden = !isTemp(a);
      for (const r of tmode.querySelectorAll('input')) r.disabled = !isTemp(a);
      tmode.setAttribute('aria-busy', String(isTemp(a) && isTemp(pend))); }
    const g = $('mg-globe'); g.dataset.height = hLoad ? 'loading' : a === 'height' ? 'on' : 'off';
    g.dataset.science = a || 'none'; g.dataset.pending = pend || '';
  }
  hbtn.addEventListener('click', () => { if (MS.active === 'height') leave(); else if (MS.pend && MS.pend.target === 'height') cancel(); else request('height'); });
  if (tbtn) tbtn.addEventListener('click', () => { if (isTemp(MS.active)) leave(); else if (MS.pend && isTemp(MS.pend.target)) cancel(); else request(radioMode()); });
  if (tmode) tmode.addEventListener('change', () => { if (!isTemp(MS.active)) return; const t = radioMode();
    if (t === MS.active) { if (MS.pend) cancel(); return; } request(t); });
  if (hcbtn) hcbtn.addEventListener('click', () => { const h = MG(), v = h && h.centre(); if (v) height.readAt(v.lat, v.lng, 'centre of view'); });
  if (tcbtn) tcbtn.addEventListener('click', () => { const h = MG(), v = h && h.centre(); if (v) temp.readAt(v.lat, v.lng, 'centre of view'); });
  const hookUp = setInterval(() => { const h = MG(); if (h) { clearInterval(hookUp); h.onClick((lat, lng) => { if (MS.active) LAYER[MS.active].readAt(lat, lng, 'clicked'); }); } }, 200);
  paint();
  // test aids
  window.MoonScience = { state: () => ({ active: MS.active, saved: MS.saved, entry: MS.entry, pending: MS.pend && MS.pend.target, token: MS.tok, commits: MS.commits }) };
  window.MoonHeight = { state: () => ({ on: MS.active === 'height' || (MS.pend && MS.pend.target === 'height') || false, phase: MS.pend && MS.pend.target === 'height' ? 'loading' : MS.active === 'height' ? 'on' : 'off',
      token: MS.tok, cached: { grid: !!H.grid, tex: !!H.texUrl }, prev: MS.saved, revoked: H.revoked }),
    value: (lat, lng) => H.grid ? H.grid[hIndex(lat, lng)] : null, index: hIndex, grid: () => H.grid };
  window.MoonTemp = { state: () => ({ cached: { grid: !!T.grid, noon: !!T.tex.noon, mid: !!T.tex.mid }, revoked: T.revoked, decodeMs: T.decodeMs, drawMs: T.drawMs }),
    cell: (lat, lng, m) => { if (!T.grid) return null; const i = tIndex(lat, lng); return { i, value: T.grid.value[m][i], n: T.grid.n[m][i], range: T.grid.range[m][i] }; },
    text: (m, i) => T.grid ? tText(m, i, 'here') : null, index: tIndex, texX, grid: () => T.grid };
})();
