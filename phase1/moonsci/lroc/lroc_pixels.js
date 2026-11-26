/* LROC Apollo 11 orthophoto: source-pixel checks for Moon item 4 (proposal rev 2, R1/R2). Build tooling; never served.
 * Runs in the browser pane on pds.mcp.nasa.gov (the only route to the archive). Needs MEHash (mehash.js) loaded first.
 * Works on UNSTRETCHED source DN only. Geometry uses the convention fixed by lroc_geom.py (k = 1, pixel centres
 * on integer 1-based coordinates): line = L0 - y/s + 1, sample = S0 + x/s + 1.
 * Usage: LROCPX.run() then read window.LROCPX.result (one pane call times out at 45 s). */
(function (root) {
  'use strict';
  const BASE = '/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/DATA/SDP/NAC_DTM/APOLLO11/';
  const F50 = BASE + 'NAC_DTM_APOLLO11_M150368601_50CM.IMG', F2 = BASE + 'NAC_DTM_APOLLO11_M150368601_2M.IMG';
  const R = 1737400, C = Math.cos(Math.PI / 180), rad = d => d * Math.PI / 180;
  const G = {
    p50: { s: 0.49999999999999, L0: 74989.5, S0: 9497505.5, NS: 8440, HDR: 16880 },
    p2: { s: 2.0000000000006, L0: 18747.5, S0: 2374376.5, NS: 2111, NL: 13978, HDR: 8444,   // lroc_pixels-3: the PDS3 header is 2 records (LABEL_RECORDS 2, ^IMAGE 3); the PDS4 label's 4,222 B offset is wrong. Versions 1-2 read the 2 m image one line early (superseded by lroc_source_check.py)
    BYTES: 59023560, MD5: '187f3d1dac32aff7f00c512ec4907cdf' },
  };
  const LM = [0.67416, 23.47314];
  const CK1 = { range: [567049840, 584334959], sha256: '3bd1b8627c8ba81d33a3ac756ec999b7276ec40356f1b3d3c99d57defc71a2fa', L1: 33593, N: 1024 };
  const SITE = { L1: 33593, S1: 5603, N: 1024 };          // lroc_geom.py: LM pixel at (512, 512) 0-based
  const AREA = { L1: 7527, N: 2000, S1: 1, W: 2110 };      // sample 2111 dropped
  const SPECIAL = { '-32768': 'missing (NULL)', '-32767': 'low representation saturation', '-32766': 'low instrument saturation', '-32765': 'high instrument saturation', '-32764': 'high representation saturation' };
  const hex = b => Array.from(new Uint8Array(b)).map(v => v.toString(16).padStart(2, '0')).join('');
  const sha = async b => hex(await crypto.subtle.digest('SHA-256', b));
  const fwd = (p, lat, lon) => [p.L0 - R * rad(lat) / p.s + 1, p.S0 + R * C * rad(lon - 180) / p.s + 1];
  const census = (arr) => { const c = {}; for (const k in SPECIAL) c[k] = 0; let v = 0, mn = 1e9, mx = -1e9;
    for (const x of arr) { if (x <= -32764) { c[String(x)] = (c[String(x)] || 0) + 1; } else { v++; if (x < mn) mn = x; if (x > mx) mx = x; } }
    return { valid: v, min: mn, max: mx, special: c }; };
  // metres east/north of the published LM for a 1-based (line, sample) centre in product p
  const offM = (p, L, S) => { const [Lp, Sp] = fwd(p, ...LM); return [(S - Sp) * p.s, (Lp - L) * p.s].map(v => +v.toFixed(3)); };
  function landmark(arr, W, H, p, L1, S1, label) {
    const [Lp, Sp] = fwd(p, ...LM); const r0 = Lp - L1, c0 = Sp - S1;      // 0-based in window
    let gmax = -1e9, gi = -1, ties = 0;
    for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v <= -32764) continue; if (v > gmax) { gmax = v; gi = i; ties = 1; } else if (v === gmax) ties++; }
    const gr = Math.floor(gi / W), gc = gi % W;
    // threshold centroid: pixels >= max - 25 % of (max - window median) within 12 m of the prediction
    const vals = Array.from(arr).filter(v => v > -32764).sort((a, b) => a - b), med = vals[vals.length >> 1];
    const thr = gmax - 0.25 * (gmax - med), rp = Math.ceil(12 / p.s);
    let sw = 0, sr = 0, sc = 0, n = 0;
    for (let r = Math.floor(r0 - rp); r <= r0 + rp; r++) for (let c = Math.floor(c0 - rp); c <= c0 + rp; c++) {
      if (r < 0 || c < 0 || r >= H || c >= W) continue; const v = arr[r * W + c]; if (v >= thr) { const w = v - med; sw += w; sr += w * r; sc += w * c; n++; } }
    // local maximum: brightest valid pixel within 12 m of the prediction (the test that applies where the LM is not the window's maximum)
    let lmax = -1e9, lr = 0, lc = 0, lties = 0;
    for (let r = Math.floor(r0 - rp); r <= r0 + rp; r++) for (let c = Math.floor(c0 - rp); c <= c0 + rp; c++) {
      if (r < 0 || c < 0 || r >= H || c >= W) continue; const v = arr[r * W + c]; if (v <= -32764) continue;
      if (v > lmax) { lmax = v; lr = r; lc = c; lties = 1; } else if (v === lmax) lties++; }
    // shadow: darkest 3x3 mean within 16 m east of the prediction
    let dk = 1e9, dr = 0, dc = 0;
    for (let r = Math.floor(r0 - 8 / p.s); r <= r0 + 8 / p.s; r++) for (let c = Math.floor(c0); c <= c0 + 16 / p.s; c++) {
      let s = 0, k = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const v = arr[(r + i) * W + c + j]; if (v > -32764) { s += v; k++; } }
      if (k === 9 && s / 9 < dk) { dk = s / 9; dr = r; dc = c; } }
    // negative control: the same 12 m search centred 40 m north and 40 m west of the prediction finds nothing as bright as the LM's local maximum
    let cmax = -1e9; const nr = r0 - 40 / p.s, nc = c0 - 40 / p.s;
    for (let r = Math.floor(nr - rp); r <= nr + rp; r++) for (let c = Math.floor(nc - rp); c <= nc + rp; c++) { const v = arr[r * W + c]; if (v > cmax) cmax = v; }
    return { label, local12m_max: lmax, local12m_max_ties: lties, local12m_max_offset_m: offM(p, L1 + lr, S1 + lc), window_max: gmax, window_max_ties: ties, window_max_offset_m: offM(p, L1 + gr, S1 + gc), window_median: med,
      centroid_pixels: n, centroid_offset_m: n ? offM(p, L1 + sr / sw, S1 + sc / sw) : null,
      shadow_3x3_mean: +dk.toFixed(1), shadow_offset_m: offM(p, L1 + dr, S1 + dc),
      control_40m_NW_max: cmax, control_below_LM_local_max: cmax < lmax };
  }
  async function run() {
    const out = { tool: 'lroc_pixels.js', started: new Date().toISOString() };
    root.LROCPX.result = { phase: 'running' };
    try {
      // 1. Same 0.5 m range as checkpoint 1: re-fetch and compare SHA-256
      const r1 = await fetch(F50, { headers: { Range: `bytes=${CK1.range[0]}-${CK1.range[1]}` }, cache: 'no-store' });
      const b1 = await r1.arrayBuffer(); const s1 = await sha(b1);
      out.refetch_50cm = { status: r1.status, content_range: r1.headers.get('content-range'), etag: r1.headers.get('etag'), bytes: b1.byteLength, sha256: s1, equals_checkpoint_1: s1 === CK1.sha256 };
      if (s1 !== CK1.sha256) throw new Error('0.5 m range differs from checkpoint 1');
      const a1 = new Int16Array(b1), NS = G.p50.NS;
      out.census_50cm_range = census(a1);
      const site = new Int16Array(SITE.N * SITE.N);
      for (let i = 0; i < SITE.N; i++) { const L = SITE.L1 + i - CK1.L1; site.set(a1.subarray(L * NS + SITE.S1 - 1, L * NS + SITE.S1 - 1 + SITE.N), i * SITE.N); }
      out.site = { lines: [SITE.L1, SITE.L1 + SITE.N - 1], samples: [SITE.S1, SITE.S1 + SITE.N - 1], census: census(site), sha256_int16le: await sha(site.buffer) };
      out.landmark_50cm = landmark(site, SITE.N, SITE.N, G.p50, SITE.L1, SITE.S1, '0.5 m site crop (whole 512 m crop searched for its maximum)');
      // 2. Whole 2 m file: MD5 against the label, then the area window
      const p = G.p2, r2 = await fetch(F2, { cache: 'no-store' }); if (r2.status !== 200) throw new Error('2 m status ' + r2.status);
      const all = new Uint8Array(p.BYTES); let n = 0; const m = new MEHash.MD5(); const rd = r2.body.getReader();
      for (;;) { const { done, value } = await rd.read(); if (done) break; if (n + value.length > p.BYTES) { rd.cancel(); throw new Error('2 m: too many bytes'); } all.set(value, n); n += value.length; m.update(value); }
      const md5 = m.hex(); out.refetch_2m = { status: r2.status, bytes: n, md5, md5_match: n === p.BYTES && md5 === p.MD5, sha256: await sha(all.buffer) };
      if (!out.refetch_2m.md5_match) throw new Error('2 m MD5 mismatch');
      const a2 = new Int16Array(all.buffer, p.HDR, p.NS * p.NL);
      out.census_2m_whole = census(a2);
      const area = new Int16Array(AREA.N * AREA.W);
      for (let i = 0; i < AREA.N; i++) area.set(a2.subarray((AREA.L1 - 1 + i) * p.NS + AREA.S1 - 1, (AREA.L1 - 1 + i) * p.NS + AREA.S1 - 1 + AREA.W), i * AREA.W);
      out.area_source = { lines: [AREA.L1, AREA.L1 + AREA.N - 1], samples: [AREA.S1, AREA.S1 + AREA.W - 1], dropped_sample: 2111, census: census(area), sha256_int16le: await sha(area.buffer) };
      out.landmark_2m = landmark(area, AREA.W, AREA.N, p, AREA.L1, AREA.S1, '2 m area source (whole 4,220 x 4,000 m window searched for its maximum)');
      // 3. 2x2 valid-count downsampling of the area source: histogram of valid counts per output pixel
      const hist = [0, 0, 0, 0, 0], W2 = AREA.W / 2, H2 = AREA.N / 2;
      for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let k = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (area[(2 * y + i) * AREA.W + 2 * x + j] > -32764) k++; hist[k]++; }
      out.area_2x2_valid_count_histogram = { output: [W2, H2], counts_0_to_4: hist };
      // 4. Small lossless windows around the LM for independent re-checking (48 x 48, int16 little-endian, base64)
      const win = (arr, W, L1, S1, pp, L1w, S1w) => { const o = new Int16Array(48 * 48); for (let i = 0; i < 48; i++) o.set(arr.subarray((L1w - L1 + i) * W + S1w - S1, (L1w - L1 + i) * W + S1w - S1 + 48), i * 48); return o; };
      const [Lp5, Sp5] = fwd(G.p50, ...LM), [Lp2, Sp2] = fwd(p, ...LM);
      const w5 = { L1: Math.round(Lp5) - 24, S1: Math.round(Sp5) - 24 }, w2 = { L1: Math.round(Lp2) - 24, S1: Math.round(Sp2) - 24 };
      const o5 = win(site, SITE.N, SITE.L1, SITE.S1, G.p50, w5.L1, w5.S1), o2 = win(area, AREA.W, AREA.L1, AREA.S1, p, w2.L1, w2.S1);
      const b64 = a => btoa(String.fromCharCode(...new Uint8Array(a.buffer)));
      out.windows = { size: [48, 48], dtype: 'int16 little-endian, row-major, north up', w50cm: { lines_from: w5.L1, samples_from: w5.S1, sha256: await sha(o5.buffer) }, w2m: { lines_from: w2.L1, samples_from: w2.S1, sha256: await sha(o2.buffer) } };
      root.LROCPX.win_b64 = { w50cm: b64(o5), w2m: b64(o2) };
      out.finished = new Date().toISOString(); out.phase = 'done';
      root.LROCPX.result = out;
    } catch (e) { out.phase = 'failed'; out.error = String(e); root.LROCPX.result = out; }
  }
  root.LROCPX = { run, result: null, VERSION: 'lroc_pixels-3' };
})(typeof window !== 'undefined' ? window : globalThis);
