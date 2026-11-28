/* Moon science layers (moon.html): "What LRO measured: height" (LOLA), "What LRO measured: brightness temperature" (Diviner) and the
 * south-polar neutron record (LEND). All three optional, off by default, not live. One coordinator (MoonScience) owns what is on the
 * globe; each layer owns its own data; only one is shown at a time.
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
 * Transitions (proposal §5, GPT's note 2). active is none, height, temp-noon, temp-mid or lend. The lighting state is saved ONCE, on
 * entering science mode, and kept across any switch between height, temperature (noon <-> midnight) and the neutron record. While a new map loads and is checked, the shown map stays.
 * On success the texture is swapped in one call. On failure or cancel nothing changes (a radio button that asked for the failed mode
 * goes back to the mode shown). Leaving science mode (the active layer's own button) brings the picture back and restores "Lit as now"
 * for the current minute if it was on; the Earth view is not reopened. Every request takes a new token and aborts the previous one;
 * only the latest may commit. Leaving also cancels anything pending, so a late answer cannot reopen science mode. Anything a failed,
 * cancelled or late attempt made (object URLs, decoded arrays) is released. The 15 s deadline ends the request itself (its message is
 * shown at once); a stage still running then (PNG drawing, picture decode) finishes into nothing. The LRO overlay is never touched. */
/* South-polar neutron record (MOON-LEND-PROPOSAL rev 2 §8.1, Chad's D1-D9, GPT's rev 2 recheck build notes). Source: LEND averaged
 * science product lend_rdr_alds_20111211 (NASA PDS, bundle DOI 10.17189/p89b-8w72), field CSETN_RATE on 0.5 degree cells 80-90 S,
 * averaged by the team 2011-12-11 to 2016-09-14. One file (phase1/moonsci/build_lend.py), MELENDR1: a 160-byte header and 14,400
 * ten-byte records (row 0 = 89.75 S, column 0 = 0.25 E). Each record holds OUR state (0 shown, 1 not in the archive, 2 withheld: formal
 * estimate above 0.5 pp, 3 withheld: the 60 km disc runs past the product's 80 S edge), p = percent difference of the 30 km-radius
 * inverse-variance-weighted mean from the 80.25-84.75 S band (x100), the first-order formal counting-error estimate (x100; conditional on
 * independent archive errors), the usable cells in the disc, a near-missing flag and the native cell's exposure. The archive disagrees
 * about the field's normalisation and background, so nothing is shown as a unit, a flux or a hydrogen amount. The whole file is checked
 * before anything is shown: pin, length, every header field, the payload hash, every record. The texture is the usual appearance
 * picture (pinned, checked) with the cap's cells painted over it, so the region north of 80 S looks as it always does. */
/* South-polar far-ultraviolet albedo (MOON-LAMP-PROPOSAL rev 2 §6-§8, Chad's D1-D8 and D6 decision, GPT's rev 2 recheck notes 1-5 and D6
 * review notes). Source: LRO LAMP GDR V1.0 (NASA PDS Imaging Node, LROLAM_2001), south-polar cumulative Lyman-alpha (about 121.6 nm) albedo,
 * night side, Sept 2009 - Sept 2010, 240 m polar stereographic. Albedo here is the archive's measured far-UV brightness divided by a
 * MODELLED night-time illumination (sky glow and starlight): a model-dependent estimate, not a photograph, and nothing here identifies
 * ice, frost or water. One file (phase1/moonsci/build_lamp.py), MELAMPR1: a 160-byte header and three planes on 626 x 626 cells of
 * 4 x 4 source pixels (960 m): value (u16 integer thousandths, 65535 = no value), n_q | bit 7 (a qualifying archive value above 1, kept
 * as archived and disclosed) and n_in. Map orientation is the documented one (reading B: LON = atan2(x, -y)); fine positional error is
 * not quantified and no shift is applied. The whole file is checked before anything is shown: gzip and raw pins, every header field,
 * the source hashes, the payload hash and every cell. Each texture pixel south of 80 S takes its centre's latitude and longitude, the
 * reading-B inverse and the nearest 960 m cell; no interpolation. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const hbtn = $('mg-height'), hcbtn = $('mg-height-centre'), hleg = $('mg-height-leg'), hrd = $('mg-height-read');
  const tbtn = $('mg-temp'), tcbtn = $('mg-temp-centre'), tleg = $('mg-temp-leg'), trd = $('mg-temp-read'), tmode = $('mg-temp-mode');
  const nbtn = $('mg-lend'), npbtn = $('mg-lend-pole'), ncbtn = $('mg-lend-centre'), nleg = $('mg-lend-leg'), nrd = $('mg-lend-read');
  const ubtn = $('mg-lamp'), upbtn = $('mg-lamp-pole'), ucbtn = $('mg-lamp-centre'), uleg = $('mg-lamp-leg'), urd = $('mg-lamp-read');
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
    tleg.querySelector('[data-t="clip"]').textContent = `Colours stop at the scale’s ends: ${md.clipLo}% of the shown grid cells with a value are below ${md.lo} K and ${md.clipHi}% are above ${md.hi} K (shares of 0.5° grid cells, not of surface area). The readout gives their value.`;
  }

  // ============================== south-polar neutron record (LEND) ==============================
  const NF = { url: 'assets/moon/lend/lend-alds-2011-2016-R1.bin?v=1', bytes: 144160, sha: '9f185cc38cb8f378220b30f212deec8daf1e639071dcfe0304cb743038d26cdf' };
  const AP = { url: 'assets/moon/lroc_color_2k.jpg?v=1', bytes: 457942, sha: 'f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170' };
  const NR = 20, NCOL = 720, NN = NR * NCOL, NHDR = 160, NREC = 10;
  const NSRC = 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef';
  const NREF = { mean: 4.9413873895, err: 0.0022184209 };   // reference band mean and its formal error, as built (checked to 1e-9)
  // one fixed diverging ramp (ColorBrewer PuOr), -2.5 % .. +2.5 %; brown below the band, purple above. No meaning beyond the number.
  const NRAMP = ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const NLO = -250, NHI = 250;   // centi-percent
  const MISS_A = [46, 46, 46], MISS_B = [107, 107, 107], WH_A = [154, 154, 154], WH_B = [230, 230, 230];
  const N = { grid: null, tex: null, revoked: 0, decodeMs: null, drawMs: null };
  async function loadLend(signal) {
    const t0 = performance.now();
    const buf = await get(NF.url, signal);
    if (buf.byteLength !== NF.bytes || await hex(buf) !== NF.sha) throw new Why('the neutron record file failed its integrity check');
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    const magic = String.fromCharCode(...u8.subarray(0, 8));
    const want16 = [[8, 1], [10, NHDR], [12, NR], [14, NCOL], [16, NREC], [20, 50], [22, 25], [24, 50], [26, 50], [42, 0]];
    const wantI16 = [[18, -8975], [36, -8475], [38, -8025], [40, -8000]], want32 = [[28, 30000], [32, 1737400], [44, 20111211], [48, 20160914]];
    // the two float64 reference fields are read once and must be finite before the tolerance test (a NaN fails every comparison, so
    // "difference > 1e-9" alone would accept it; GPT's preview review)
    const refMean = dv.getFloat64(52, true), refErr = dv.getFloat64(60, true);
    const refOk = Number.isFinite(refMean) && Number.isFinite(refErr) && Math.abs(refMean - NREF.mean) <= 1e-9 && Math.abs(refErr - NREF.err) <= 1e-9;
    if (magic !== 'MELENDR1' || want16.some(([o, v]) => dv.getUint16(o, true) !== v) || wantI16.some(([o, v]) => dv.getInt16(o, true) !== v)
      || want32.some(([o, v]) => dv.getUint32(o, true) !== v) || !refOk
      || u8.subarray(68, 96).some(b => b !== 0) || [...u8.subarray(96, 128)].map(b => b.toString(16).padStart(2, '0')).join('') !== NSRC)
      throw new Why('the neutron record file header is not the expected one');
    if (await hex(buf.slice(NHDR)) !== [...u8.subarray(128, 160)].map(b => b.toString(16).padStart(2, '0')).join('')) throw new Why('the neutron record file failed its payload check');
    const g = { state: new Uint8Array(NN), near: new Uint8Array(NN), p: new Int16Array(NN), e: new Uint16Array(NN), n: new Uint16Array(NN), exp: new Uint16Array(NN) };
    for (let i = 0; i < NN; i++) {
      const o = NHDR + NREC * i, st = u8[o], nr = u8[o + 1], p = dv.getInt16(o + 2, true), e = dv.getUint16(o + 4, true), n = dv.getUint16(o + 6, true), x = dv.getUint16(o + 8, true);
      const okCell = st === 0 ? p >= -2000 && p <= 2000 && e >= 1 && e <= 50 && n >= 1 && x >= 1 && nr <= 1
        : st === 1 ? p === 0 && e === 0 && n === 0 && x === 0 && nr === 0
        : (st === 2 || st === 3) ? p === 0 && e === 0 && n >= 1 && x >= 1 && nr <= 1
        : false;
      if (!okCell) throw new Why(`the neutron record file failed its cell check (row ${Math.floor(i / NCOL)}, column ${i % NCOL})`);
      g.state[i] = st; g.near[i] = nr; g.p[i] = p; g.e[i] = e; g.n[i] = n; g.exp[i] = x;
    }
    N.decodeMs = Math.round(performance.now() - t0);
    return g;
  }
  async function loadAppearance(signal) {
    const buf = await get(AP.url, signal);
    if (buf.byteLength !== AP.bytes || await hex(buf) !== AP.sha) throw new Why('the Moon picture failed its integrity check');
    const url = URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' })), img = new Image(); img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw new Why('the Moon picture could not be decoded'); }
    URL.revokeObjectURL(url);
    if (img.naturalWidth !== 2048 || img.naturalHeight !== 1024) throw new Why('the Moon picture is not the expected size');
    return img;
  }
  const nRgb = p => { const t = (Math.min(NHI, Math.max(NLO, p)) - NLO) / (NHI - NLO) * (NRAMP.length - 1), k = Math.min(NRAMP.length - 2, Math.floor(t)), f = t - k;
    return NRAMP[k].map((c, j) => Math.round(c + (NRAMP[k + 1][j] - c) * f)); };
  /** Cell row r (centred 89.75 S - ... 80.25 S, row 0 at the pole) occupies texture rows y = 1436 - 4 r .. +3 (texture row 0 = 90 N). */
  const nTexY = r => TH - PX * (r + 1);
  async function drawLend(g, img) {
    const t0 = performance.now();
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, TW, TH);
    const y0 = nTexY(NR - 1), im = cx.getImageData(0, y0, TW, NR * PX), d = im.data;
    for (let r = 0; r < NR; r++) for (let c = 0; c < NCOL; c++) {
      const i = r * NCOL + c, st = g.state[i], x0 = texX(c), yy = nTexY(r) - y0, rgb0 = st === 0 ? nRgb(g.p[i]) : null;
      for (let dy = 0; dy < PX; dy++) for (let dx = 0; dx < PX; dx++) {
        const X = x0 + dx, Y = yy + dy, k = 4 * (Y * TW + X), h = ((X + Y) & 3) === 0, h2 = ((X - Y) & 3) === 0;
        const rgb = rgb0 || (st === 1 ? (h ? MISS_B : MISS_A) : (h2 ? WH_A : WH_B));
        d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = 255; } }
    cx.putImageData(im, 0, y0);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    cv.width = cv.height = 0;
    if (!blob) throw new Why('the neutron record map could not be drawn');
    N.drawMs = Math.round(performance.now() - t0);
    return URL.createObjectURL(blob);
  }
  /** The cell containing a point, or -1 north of 80 S (outside this product). */
  const nIndex = (lat, lng) => { if (!(lat < -80)) return -1; const r = Math.min(NR - 1, Math.max(0, Math.floor((lat + 90) * 2))); const c = Math.floor((((lng % 360) + 360) % 360) * 2) % NCOL; return r * NCOL + c; };
  const nCentre = i => { const r = Math.floor(i / NCOL), c = i % NCOL; return deg(-89.75 + 0.5 * r, 'N', 'S') + ', ' + deg(norm(0.25 + 0.5 * c), 'E', 'W'); };
  // Readout rounding (28 Nov 2026, GPT and Chad): the file stores integer hundredths; the readout shows tenths, rounded half away from zero
  // in integer arithmetic (as the builder rounds), then written as a string. (v / 100).toFixed(1) rounded binary values just below a tie
  // downwards (a stored 35 read 0.3). The sign shown is the stored value's, as released; data, colours and withholding are unchanged.
  const tenths = v => (Math.floor((Math.abs(v) + 5) / 10));                   // |v| in tenths, half away from zero
  const one = t => Math.floor(t / 10) + '.' + (t % 10);                       // tenths -> "a.b"
  const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + one(tenths(v)) + '%';
  const pp = v => one(tenths(v)) + ' pp';
  function nText(i, where) {
    if (i < 0) return `${where}: outside this product’s coverage. LEND’s averaged south-polar product covers 80–90°S; north of 80°S the usual picture is shown.`;
    const g = N.grid, st = g.state[i], cell = `0.5° cell centred ${nCentre(i)}`;
    const exp = `exposure of this cell in the archive: ${g.exp[i].toLocaleString('en-GB')} s (accumulated 2011–2016)`;
    const sup = `${g.n[i]} archived cells in the 60 km-wide disc` + (g.near[i] ? ', near the archive’s missing cells around the pole' : '');
    if (st === 1) return `${where}: not in the archive. LEND’s archive holds no value for this ${cell}; nothing is filled in from neighbouring cells.`;
    if (st === 3) return `${where}: withheld by our display rule. The 60 km-wide disc around this ${cell} runs past the product’s 80°S edge, so it would average one side only · ${sup} · ${exp}.`;
    if (st === 2) return `${where}: withheld by our display rule. The formal counting-error estimate for this ${cell} is above 0.5 percentage points · ${sup} · ${exp}.`;
    return `${where}: ${pct(g.p[i])} ± ${pp(g.e[i])} relative difference in the archived CSETN_RATE field from the 80–85°S band, 60 km-wide disc (± is a formal counting-error estimate assuming independent archive errors) · ${sup} · ${cell} · ${exp}.`;
  }
  const lend = {
    name: 'neutron record',
    async prepare(target, ctl) {
      const made = [];
      let g = N.grid;
      if (!g) g = await loadLend(ctl.signal);
      if (ctl.signal.aborted) throw new Why('it took too long or was cancelled');
      let url = N.tex;
      if (!url) { const img = await loadAppearance(ctl.signal); if (ctl.signal.aborted) throw new Why('it took too long or was cancelled'); url = await drawLend(g, img); made.push(url); }
      const drop = () => { for (const u of made) { URL.revokeObjectURL(u); N.revoked++; } };
      return { url, drop, keep: () => { N.grid = g; N.tex = url; } };
    },
    shown() { say(nrd, 'Sunlight is not drawn on the neutron record map, so “Lit as now” is off while it is shown. Use “Turn to the south pole” to bring the region into view; click it, or use “Read neutron record at centre”, to read a value.'); },
    hidden() { say(nrd, ''); },
    failed(e) { say(nrd, 'Neutron record map could not be loaded: ' + (e instanceof Why ? e.message : 'an unexpected error') + '. ' + (MS.active ? 'The map shown is unchanged.' : 'The globe is unchanged.')); },
    readAt(lat, lng, how) {
      if (MS.active !== 'lend' || !N.grid) return;
      const i = nIndex(lat, lng), where = deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W') + ` (${how})`;
      rdSet(nrd, nText(i, where), i < 0 ? { state: 'outside', lat: String(lat), lng: String(lng) }
        : { state: String(N.grid.state[i]), p: String(N.grid.p[i]), e: String(N.grid.e[i]), n: String(N.grid.n[i]), cell: String(i), lat: String(lat), lng: String(lng) });
    },
  };

  // ============================== south-polar far-UV albedo (LAMP) ==============================
  const UF = { url: 'assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz?v=1', gzBytes: 233357, gzSha: 'a97907724322d96a23afde4f128169f1cc020d93593689cec52af72888801cbe',
    bytes: 1567664, sha: '81b5a50ad378bbbc119e8621439a9c6e5341a8dd289a4065620469f6aef755b9' };
  const UC = 626, UNN = UC * UC, UHDR = 160, UN = 2501, US = 240, UR = 1737400, USENT = 65535, UTOP = 80, UMIN = 8;
  const USRC_A = '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2', USRC_Q = '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754';
  // one fixed one-hue ramp (ColorBrewer Blues, dark = low) over 0 .. 0.079 in steps of 0.001 from the stored integer; one distinct top colour
  // for stored values >= 80 (displayed estimate 0.080 or higher after rounding). No meaning beyond the number.
  const URAMP = ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const UTOPC = [253, 141, 60];
  const U = { grid: null, tex: null, revoked: 0, decodeMs: null, drawMs: null };
  const uRgb = v => { if (v >= UTOP) return UTOPC; const t = v / (UTOP - 1) * (URAMP.length - 1), k = Math.min(URAMP.length - 2, Math.floor(t)), f = t - k;
    return URAMP[k].map((c, j) => Math.round(c + (URAMP[k + 1][j] - c) * f)); };
  const shaAt = (u8, o) => [...u8.subarray(o, o + 32)].map(b => b.toString(16).padStart(2, '0')).join('');
  /** Parse and check the page file (exported for the tests' malformed-file cases). Throws Why on anything unexpected. */
  async function parseLamp(raw) {
    if (raw.byteLength !== UF.bytes || await hex(raw) !== UF.sha) throw new Why('the far-UV albedo file failed its integrity check');
    if (raw.byteLength !== UHDR + 4 * UNN) throw new Why('the far-UV albedo file is not the expected size');
    const dv = new DataView(raw), u8 = new Uint8Array(raw);
    const want16 = [[8, 1], [10, UHDR], [12, UC], [14, 4], [16, UN], [18, 2504], [28, 1251], [30, 15], [32, 2], [34, 1000], [36, USENT], [38, UTOP], [40, UMIN], [42, 80]];
    const want32 = [[20, 960], [24, UR], [44, 20090901], [48, 20101001]];
    if (String.fromCharCode(...u8.subarray(0, 8)) !== 'MELAMPR1' || want16.some(([o, v]) => dv.getUint16(o, true) !== v) || want32.some(([o, v]) => dv.getUint32(o, true) !== v)
      || u8.subarray(52, 64).some(b => b !== 0) || shaAt(u8, 64) !== USRC_A || shaAt(u8, 96) !== USRC_Q)
      throw new Why('the far-UV albedo file header is not the expected one');
    if (await hex(raw.slice(UHDR)) !== shaAt(u8, 128)) throw new Why('the far-UV albedo file failed its payload check');
    const val = new Uint16Array(UNN), q = u8.subarray(UHDR + 2 * UNN, UHDR + 3 * UNN), nin = u8.subarray(UHDR + 3 * UNN, UHDR + 4 * UNN);
    let shown = 0;
    for (let i = 0; i < UNN; i++) {
      const v = dv.getUint16(UHDR + 2 * i, true), b = q[i], nq = b & 31, hi = b >> 7, n = nin[i];
      // GPT's recheck note 3: 0 <= n_q <= n_in <= 16; bits 5-6 reserved; bit 7 only with a qualifying pixel; a value exactly when n_q >= 8
      if ((b & 0x60) || nq > n || n > 16 || (hi && nq === 0) || ((v !== USENT) !== (nq >= UMIN)))
        throw new Why(`the far-UV albedo file failed its cell check (row ${Math.floor(i / UC)}, column ${i % UC})`);
      val[i] = v; shown += nq >= UMIN;
    }
    return { val, nq: Uint8Array.from(q, b => b & 31), hi: Uint8Array.from(q, b => b >> 7), nin: Uint8Array.from(nin), shown };
  }
  async function loadLamp(signal) {
    const t0 = performance.now();
    const raw = await gunzipIfNeeded(await get(UF.url, signal), UF.gzBytes, UF.gzSha, 'far-UV albedo');
    if (signal.aborted) throw new Why('it took too long or was cancelled');
    const g = await parseLamp(raw);
    U.decodeMs = Math.round(performance.now() - t0);
    return g;
  }
  /** Reading B inverse (proposal §5.1, §7). Returns { s: 'S4' } north of 80 S, { s: 'S5' } inside 80 S but beyond the map's square,
   *  else { i: cell index, I, J } with 1-based fractional sample I and line J. */
  function uLocate(lat, lng) {
    if (!(lat <= -80)) return { s: 'S4' };
    const r = 2 * UR * Math.tan((90 + lat) * Math.PI / 360), L = lng * Math.PI / 180;
    const I = r * Math.sin(L) / US + 1251, J = -r * Math.cos(L) / US + 1251;
    if (!(I >= 0.5 && I < UN + 0.5 && J >= 0.5 && J < UN + 0.5)) return { s: 'S5' };
    return { i: Math.floor((J - 0.5) / 4) * UC + Math.floor((I - 0.5) / 4), I, J };
  }
  /** A cell's state: S0 shown, S1 too few usable, S2 no usable value, S3 map edge (fewer than 8 source pixels inside 80 S, including 0). */
  const uState = (g, i) => g.nq[i] >= UMIN ? 'S0' : g.nin[i] >= UMIN ? (g.nq[i] ? 'S1' : 'S2') : 'S3';
  const HATCH_A = [[46, 46, 46], [107, 107, 107]], HATCH_B = [[230, 230, 230], [154, 154, 154]];
  async function drawLamp(g, img) {
    const t0 = performance.now();
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, TW, TH);
    const y0 = TH - 80, im = cx.getImageData(0, y0, TW, 80), d = im.data;   // texture rows 1360..1439: centres 80.0625 S .. 89.9375 S
    const sn = new Float64Array(TW), cs = new Float64Array(TW);
    for (let X = 0; X < TW; X++) { const L = ((X + 0.5) / 8 - 180) * Math.PI / 180; sn[X] = Math.sin(L); cs[X] = Math.cos(L); }
    for (let y = 0; y < 80; y++) {
      const lat = 90 - (y0 + y + 0.5) / 8, r = 2 * UR * Math.tan((90 + lat) * Math.PI / 360) / US;
      for (let X = 0; X < TW; X++) {
        const I = r * sn[X] + 1251, J = -r * cs[X] + 1251, k = 4 * (y * TW + X);
        const h = (((X + y) & 3) === 0) ? 1 : 0, h2 = (((X - y) & 3) === 0) ? 1 : 0;
        let rgb;
        if (!(I >= 0.5 && I < UN + 0.5 && J >= 0.5 && J < UN + 0.5)) rgb = HATCH_B[h2];                 // S5
        else { const i = Math.floor((J - 0.5) / 4) * UC + Math.floor((I - 0.5) / 4), st = uState(g, i);
          rgb = st === 'S0' ? uRgb(g.val[i]) : st === 'S3' ? HATCH_B[h2] : HATCH_A[h]; }
        d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = 255; } }
    cx.putImageData(im, 0, y0);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    cv.width = cv.height = 0;
    if (!blob) throw new Why('the far-UV albedo map could not be drawn');
    U.drawMs = Math.round(performance.now() - t0);
    return URL.createObjectURL(blob);
  }
  const thou = v => Math.floor(v / 1000) + '.' + String(v % 1000).padStart(3, '0');   // integer thousandths -> "a.bcd", as a string
  function uCentre(i) {
    const c = i % UC, r = Math.floor(i / UC), x = (4 * c + 1.5 - 1250) * US, y = (4 * r + 1.5 - 1250) * US;
    const lat = -90 + 2 * Math.atan(Math.hypot(x, y) / (2 * UR)) * 180 / Math.PI, lng = Math.atan2(x, -y) * 180 / Math.PI;
    return deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W');
  }
  function uText(loc, where) {
    if (loc.s === 'S4') return `${where}: outside this map. LAMP’s map covers 80–90°S; north of that the usual picture is shown.`;
    if (loc.s === 'S5') return `${where}: inside 80°S but beyond the edge of LAMP’s map square; nothing is filled in.`;
    const g = U.grid, i = loc.i, st = uState(g, i), nq = g.nq[i], n = g.nin[i], cell = `960 m cell centred ${uCentre(i)}`;
    if (st === 'S3') return `${where}: edge of the map. Fewer than half of this ${cell} lies inside the 80°S circle and the map’s square (${n} of 16 archive pixels); no value is shown.`;
    if (st === 'S2') return `${where}: no value here. The archive has no usable value in this ${cell} (missing, or flagged by the archive’s quality map).`;
    if (st === 'S1') return `${where}: no value here. Only ${nq} of this ${cell}’s ${n} archive pixels pass the quality and finiteness rules (8 needed).`;
    const v = g.val[i];
    return `${where}: Lyman-α albedo estimate ${thou(v)}` + (v >= UTOP ? ' (at or above the top of the colour scale: displayed estimate 0.080 or higher after rounding)' : '')
      + ` · Mother Earth’s 960 m average of ${nq} of ${n} archive pixels; LAMP night side, Sept 2009 – Sept 2010; measured far-UV brightness ÷ modelled night-time illumination · ${cell}.`
      + (g.hi[i] ? ' This average includes archive values above 1; they are shown as archived, and their cause has not been assessed here.' : '')
      + ' The third decimal is our rounding, not the estimate’s accuracy.';
  }
  const lamp = {
    name: 'far-UV albedo',
    async prepare(target, ctl) {
      const made = [];
      let g = U.grid;
      if (!g) g = await loadLamp(ctl.signal);
      if (ctl.signal.aborted) throw new Why('it took too long or was cancelled');
      let url = U.tex;
      if (!url) { const img = await loadAppearance(ctl.signal); if (ctl.signal.aborted) throw new Why('it took too long or was cancelled'); url = await drawLamp(g, img); made.push(url); }
      const drop = () => { for (const u of made) { URL.revokeObjectURL(u); U.revoked++; } };
      return { url, drop, keep: () => { U.grid = g; U.tex = url; } };
    },
    shown() { say(urd, 'Sunlight is not drawn on the far-UV albedo map, so “Lit as now” is off while it is shown. Use “Turn to the south pole” to bring the region into view; click it, or use “Read far-UV albedo at centre”, to read a value.'); },
    hidden() { say(urd, ''); },
    failed(e) { say(urd, 'Far-UV albedo map could not be loaded: ' + (e instanceof Why ? e.message : 'an unexpected error') + '. ' + (MS.active ? 'The map shown is unchanged.' : 'The globe is unchanged.')); },
    readAt(lat, lng, how) {
      if (MS.active !== 'lamp' || !U.grid) return;
      const loc = uLocate(lat, lng), where = deg(lat, 'N', 'S') + ', ' + deg(norm(lng), 'E', 'W') + ` (${how})`;
      rdSet(urd, uText(loc, where), loc.s ? { state: loc.s, lat: String(lat), lng: String(lng), value: '', cell: '' }
        : { state: uState(U.grid, loc.i), value: String(U.grid.val[loc.i]), cell: String(loc.i), lat: String(lat), lng: String(lng) });
    },
  };

  // ============================== the coordinator ==============================
  const LAYER = { height, 'temp-noon': temp, 'temp-mid': temp, lend, lamp };
  const MS = { active: null, saved: null, entry: null, pend: null, tok: 0, commits: 0 };
  /** Ask for a map. Pressing a layer's button while that map is shown leaves science mode; pressing it while it is loading cancels. */
  async function request(target) {
    const h = MG();
    if (!h || !h.ready()) { LAYER[target].failed(new Why('the globe is not running'), target); return; }
    if (MS.pend) cancel();
    const tok = ++MS.tok, ctl = new AbortController(); MS.pend = { target, tok, ctl };
    if (!MS.active || LAYER[MS.active] !== LAYER[target]) LAYER[target].hidden(); paint();
    // The deadline ends the REQUEST, not just its fetches (GPT review R1): a stage that cannot be aborted (drawing the PNG, decoding a
    // picture) may still finish later, but by then this request is no longer pending, so its result is released and never shown.
    const tm = setTimeout(() => { if (MS.pend && MS.pend.tok === tok) { cancel(); LAYER[target].failed(new Why('it took too long'), target); } }, TIMEOUT_MS);
    let res = null, err = null;
    try { res = await LAYER[target].prepare(target, ctl); } catch (e) { err = e; }
    clearTimeout(tm);
    if (tok !== MS.tok || !MS.pend || MS.pend.tok !== tok) { if (res) res.drop(); return; }   // superseded, cancelled, timed out or left: a late answer changes nothing
    MS.pend = null;
    if (err) { syncRadio(); LAYER[target].failed(err, target); paint(); return; }
    // a result is never committed from an aborted request (GPT review R1; an ordinary failure may abort its sibling fetch, so this applies to results only)
    if (ctl.signal.aborted) { res.drop(); syncRadio(); LAYER[target].failed(new Why('it took too long or was cancelled'), target); paint(); return; }
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
    if (wasEarth) say(LAYER[was] === height ? hrd : LAYER[was] === lend ? nrd : LAYER[was] === lamp ? urd : trd, `Earth view was closed while ${entry === 'height' ? 'height' : entry === 'lend' ? 'the neutron record map' : entry === 'lamp' ? 'the far-UV albedo map' : 'the temperature map'} was shown; “As seen from Earth now” can reopen it.`);
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
    if (nbtn) { const nLoad = pend === 'lend';
      nbtn.setAttribute('aria-pressed', String(a === 'lend' || nLoad)); nbtn.setAttribute('aria-busy', String(nLoad));
      nbtn.textContent = nLoad ? 'Neutron record: loading…' : a === 'lend' ? 'Hide south-polar neutron record (LEND)' : 'Show south-polar neutron record (LEND)';
      nleg.hidden = a !== 'lend'; if (npbtn) npbtn.hidden = a !== 'lend'; if (ncbtn) ncbtn.hidden = a !== 'lend'; }
    if (ubtn) { const uLoad = pend === 'lamp';
      ubtn.setAttribute('aria-pressed', String(a === 'lamp' || uLoad)); ubtn.setAttribute('aria-busy', String(uLoad));
      ubtn.textContent = uLoad ? 'Far-UV albedo: loading…' : a === 'lamp' ? 'Hide south-polar far-UV albedo (LAMP)' : 'Show south-polar far-UV albedo (LAMP)';
      uleg.hidden = a !== 'lamp'; if (upbtn) upbtn.hidden = a !== 'lamp'; if (ucbtn) ucbtn.hidden = a !== 'lamp'; }
    const g = $('mg-globe'); g.dataset.height = hLoad ? 'loading' : a === 'height' ? 'on' : 'off';
    g.dataset.science = a || 'none'; g.dataset.pending = pend || '';
  }
  hbtn.addEventListener('click', () => { if (MS.active === 'height') leave(); else if (MS.pend && MS.pend.target === 'height') cancel(); else request('height'); });
  if (tbtn) tbtn.addEventListener('click', () => { if (isTemp(MS.active)) leave(); else if (MS.pend && isTemp(MS.pend.target)) cancel(); else request(radioMode()); });
  if (tmode) tmode.addEventListener('change', () => { if (!isTemp(MS.active)) return; const t = radioMode();
    if (t === MS.active) { if (MS.pend) cancel(); return; } request(t); });
  if (nbtn) nbtn.addEventListener('click', () => { if (MS.active === 'lend') leave(); else if (MS.pend && MS.pend.target === 'lend') cancel(); else request('lend'); });
  if (npbtn) npbtn.addEventListener('click', () => { const v = window.MoonGlobe && window.MoonGlobe.view(); if (v && window.MoonGlobe.point) window.MoonGlobe.point(-85, v.lng); });
  if (ncbtn) ncbtn.addEventListener('click', () => { const h = MG(), v = h && h.centre(); if (v) lend.readAt(v.lat, v.lng, 'centre of view'); });
  if (ubtn) ubtn.addEventListener('click', () => { if (MS.active === 'lamp') leave(); else if (MS.pend && MS.pend.target === 'lamp') cancel(); else request('lamp'); });
  if (upbtn) upbtn.addEventListener('click', () => { const v = window.MoonGlobe && window.MoonGlobe.view(); if (v && window.MoonGlobe.point) window.MoonGlobe.point(-85, v.lng); });
  if (ucbtn) ucbtn.addEventListener('click', () => { const h = MG(), v = h && h.centre(); if (v) lamp.readAt(v.lat, v.lng, 'centre of view'); });
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
  window.MoonLend = { state: () => ({ cached: { grid: !!N.grid, tex: !!N.tex }, revoked: N.revoked, decodeMs: N.decodeMs, drawMs: N.drawMs }),
    cell: (lat, lng) => { if (!N.grid) return null; const i = nIndex(lat, lng); return i < 0 ? { i } : { i, state: N.grid.state[i], p: N.grid.p[i], e: N.grid.e[i], n: N.grid.n[i], near: N.grid.near[i], exp: N.grid.exp[i] }; },
    text: i => N.grid ? nText(i, 'here') : null, index: nIndex, texY: nTexY, rgb: nRgb, grid: () => N.grid, fmt: { pct, pp } };
  window.MoonLamp = { state: () => ({ cached: { grid: !!U.grid, tex: !!U.tex }, revoked: U.revoked, decodeMs: U.decodeMs, drawMs: U.drawMs }),
    locate: uLocate, cellState: i => U.grid ? uState(U.grid, i) : null, text: (lat, lng) => U.grid ? uText(uLocate(lat, lng), 'here') : null,
    cell: i => U.grid ? { val: U.grid.val[i], nq: U.grid.nq[i], nin: U.grid.nin[i], hi: U.grid.hi[i] } : null,
    rgb: uRgb, thou, parse: buf => parseLamp(buf).then(g => g.shown), centre: uCentre };
})();
