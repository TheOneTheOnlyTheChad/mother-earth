/* Streaming parser, reducer and lossless extractor for one Diviner GCP band file (LRO-L-DLRE-5-GCP-V1.0).
 * Mother Earth build tooling (MOON-DIVINER-PROPOSAL rev 2 §6.1, §7.1; GPT rev 2 recheck notes 3-4). Never served on the page.
 *
 * Input: bytes of global_cumul_avg_cyl_<band>_002.tab, pushed in chunks of any size (empty chunks allowed). Nothing is buffered beyond
 * one partial 113-byte record. Each record: exactly 113 bytes ending CRLF; 11 comma-separated fields; longitude slowest
 * (-179.75 .. +179.75 in 0.5 steps), then latitude ascending in 0.5 steps (20 per band), then 96 local-time bins.
 * Coordinates are checked as exact decimals (integers x100) against the band's expected identity, not inferred from the data:
 *   lon x100 = -17975 + 50 * (lonStart + i); lat x100 = lat0 + 50 * j; local time x100 in {25k + 12, 25k + 13} (0.125 + 0.25k printed to 2 decimals).
 * tbol (field 11) is parsed as an exact decimal x10000 (integer): exactly "-9999" (empty bin) or "-9998" (invalid), else 1 < tbol < 450 K
 * with at most 4 decimals (our plausibility bounds; the label documents none). Fields 4-10 must be numeric. Any failure throws GcpError.
 *
 * Outputs (finish()):
 *  - extraction: Int32Array, one value per record in source order (lon, lat, local time), tbol x 10000; sentinels -99990000 / -99980000
 *    (schema: docs/research/moon-lro-science/diviner-acq/EXTRACTION-SCHEMA.md)
 *  - per cell and window (noon bins 46-49 = 11:30-12:30; midnight bins 94, 95, 0, 1 = 23:30-00:30): n, sum, min, max of valid values
 *  - page codes (rev 2 §6.2): value u16 (0 no valid data, 1 withheld, v>=2 tenths of K rounded half up), n u8, range u8
 *    (whole K rounded half up; 254 = at least 253.5 K; 255 = unavailable) computed in integer arithmetic. */
(function (root) {
  'use strict';
  const REC = 113, PER_LON = 20 * 96;
  const NOON = [46, 47, 48, 49], MID = [94, 95, 0, 1];
  const SENT_EMPTY = -99990000, SENT_INVALID = -99980000;
  const TB_MIN = 10000, TB_MAX = 4500000;   // exclusive bounds, x10000 (1 K, 450 K)
  class GcpError extends Error {}

  // exact decimal text -> integer scaled by 10^dec; returns null if not of the form ^ *-?\d+(\.\d{1,maxDec})?$
  function parseFixed(s, dec, exactDec) {
    let i = 0; while (i < s.length && s.charCodeAt(i) === 32) i++;
    let neg = false; if (s[i] === '-') { neg = true; i++; }
    let ip = '', fp = '', dot = false;
    for (; i < s.length; i++) { const c = s.charCodeAt(i); if (c >= 48 && c <= 57) { if (dot) fp += s[i]; else ip += s[i]; } else if (c === 46 && !dot) dot = true; else return null; }
    if (!ip.length || (dot && !fp.length) || fp.length > dec) return null;
    if (exactDec !== undefined && fp.length !== exactDec) return null;
    const v = parseInt(ip, 10) * Math.pow(10, dec) + (fp.length ? parseInt(fp.padEnd(dec, '0'), 10) : 0);
    return neg ? -v : v;
  }

  class GcpBand {
    /** opts: { lat0x100: first latitude centre x100 (e.g. 25 for 00N-10N, -8975 for 90S-80S), lonStart: index of the first longitude (0 = -179.75),
     *          nLon: longitudes in this input (720 for a whole band), header: true if the input starts with the 113-byte header line,
     *          extract: keep the Int32Array extraction } */
    constructor(opts) {
      this.o = Object.assign({ lonStart: 0, nLon: 720, header: true, extract: true }, opts);
      if (typeof this.o.lat0x100 !== 'number') throw new GcpError('lat0x100 required');
      this.carry = new Uint8Array(REC); this.cl = 0; this.r = 0; this.headerBytes = null;
      this.total = this.o.nLon * PER_LON;
      this.ext = this.o.extract ? new Int32Array(this.total) : null;
      const cells = this.o.nLon * 20;
      this.w = {};
      for (const k of ['noon', 'mid']) this.w[k] = { n: new Uint8Array(cells), sum: new Float64Array(cells), min: new Int32Array(cells).fill(2147483647), max: new Int32Array(cells).fill(-2147483648) };
      this.sent = { empty: 0, invalid: 0 }; this.tbMin = Infinity; this.tbMax = -Infinity; this.bytes = 0;
    }
    push(u8) {
      this.bytes += u8.length;
      let i = 0;
      if (this.o.header && !this.headerBytes) {
        // the header is one 113-byte line too
        while (i < u8.length && this.cl < REC) this.carry[this.cl++] = u8[i++];
        if (this.cl < REC) return;
        this.headerBytes = this.carry.slice(0, REC); this.cl = 0;
        if (this.headerBytes[111] !== 13 || this.headerBytes[112] !== 10) throw new GcpError('header line does not end in CRLF at byte 113');
      }
      if (this.cl) {
        while (i < u8.length && this.cl < REC) this.carry[this.cl++] = u8[i++];
        if (this.cl < REC) return;
        this._rec(this.carry, 0); this.cl = 0;
      }
      for (; i + REC <= u8.length; i += REC) this._rec(u8, i);
      while (i < u8.length) this.carry[this.cl++] = u8[i++];
    }
    _rec(b, o) {
      const r = this.r;
      if (r >= this.total) throw new GcpError(`more records than expected (${this.total})`);
      if (b[o + 111] !== 13 || b[o + 112] !== 10) throw new GcpError(`record ${r}: no CRLF`);
      let s = ''; for (let k = 0; k < 111; k++) s += String.fromCharCode(b[o + k]);
      const f = s.split(',');
      if (f.length !== 11) throw new GcpError(`record ${r}: ${f.length} fields`);
      const li = Math.floor(r / PER_LON), lj = Math.floor(r / 96) % 20, k = r % 96;
      const lon = parseFixed(f[0], 2, 2), lat = parseFixed(f[1], 2, 2), lt = parseFixed(f[2], 2, 2);
      if (lon === null || lat === null || lt === null) throw new GcpError(`record ${r}: coordinate field not numeric`);
      if (lon !== -17975 + 50 * (this.o.lonStart + li)) throw new GcpError(`record ${r}: longitude ${f[0].trim()} where ${(-17975 + 50 * (this.o.lonStart + li)) / 100} expected`);
      if (lat !== this.o.lat0x100 + 50 * lj) throw new GcpError(`record ${r}: latitude ${f[1].trim()} where ${(this.o.lat0x100 + 50 * lj) / 100} expected`);
      if (lt !== 25 * k + 12 && lt !== 25 * k + 13) throw new GcpError(`record ${r}: local time ${f[2].trim()} where ${0.125 + 0.25 * k} (2 decimals) expected`);
      for (let q = 3; q < 10; q++) if (parseFixed(f[q], 4) === null) throw new GcpError(`record ${r}: field ${q + 1} not numeric`);
      const t = f[10].trim(); let v;
      if (t === '-9999') { v = SENT_EMPTY; this.sent.empty++; }
      else if (t === '-9998') { v = SENT_INVALID; this.sent.invalid++; }
      else {
        v = parseFixed(f[10], 4);
        if (v === null) throw new GcpError(`record ${r}: tbol not numeric`);
        if (!(v > TB_MIN && v < TB_MAX)) throw new GcpError(`record ${r}: tbol ${t} outside plausibility bounds (1, 450) K`);
        if (v < this.tbMin) this.tbMin = v; if (v > this.tbMax) this.tbMax = v;
        const c = li * 20 + lj;
        for (const [name, bins] of [['noon', NOON], ['mid', MID]]) if (bins.includes(k)) {
          const w = this.w[name]; w.n[c]++; w.sum[c] += v; if (v < w.min[c]) w.min[c] = v; if (v > w.max[c]) w.max[c] = v;
        }
      }
      if (this.ext) this.ext[r] = v;
      this.r++;
    }
    finish() {
      if (this.o.header && !this.headerBytes) throw new GcpError('no header line');
      if (this.cl) throw new GcpError(`${this.cl} trailing bytes (not a whole record)`);
      if (this.r !== this.total) throw new GcpError(`records ${this.r} where ${this.total} expected`);
      return { records: this.r, bytes: this.bytes, sentinels: this.sent, tbolMin: this.tbMin / 1e4, tbolMax: this.tbMax / 1e4, header: this.headerBytes, extraction: this.ext, windows: this.w };
    }
  }

  /** Page codes for one cell and window (rev 2 §6.2), integer arithmetic only. withheld: boolean (display policy). */
  function codes(n, sum, min, max, withheld) {
    if (withheld) return { value: 1, n: 0, range: 255 };
    if (n === 0) return { value: 0, n: 0, range: 255 };
    const value = Math.floor((sum + n * 500) / (n * 1000));   // round half up of (sum / n / 10000 K) * 10
    let range = 255;
    if (n >= 2) { const d = max - min; range = d >= 2535000 ? 254 : Math.floor((d + 5000) / 10000); }
    return { value, n, range };
  }
  const NOON_MASK = 7000, MID_MASK = 8000;   // latitude x100: withheld poleward of 70 (noon) / 80 (midnight)

  /** Band planes in page order (rows north to south, columns east from 0.25 E), little-endian, rev 2 §6.2 layout restricted to this band's rows:
   *  noon value u16 | midnight value u16 | noon n u8 | midnight n u8 | noon range u8 | midnight range u8. Returns { bytes, rows, cols, cellsAt }. */
  function bandPlanes(res, opts) {
    const nLon = opts.nLon, lonStart = opts.lonStart || 0, lat0 = opts.lat0x100, cells = 20 * nLon;
    const vN = new Uint16Array(cells), vM = new Uint16Array(cells), nN = new Uint8Array(cells), nM = new Uint8Array(cells), rN = new Uint8Array(cells), rM = new Uint8Array(cells);
    const at = [];
    for (let row = 0; row < 20; row++) {
      const lj = 19 - row, latx = lat0 + 50 * lj;
      for (let i = 0; i < nLon; i++) {
        const lonIdx = lonStart + i, col = (lonIdx + 360) % 720;   // -179.75 -> column 360 (180.25 E); 0.25 E -> column 0
        const c = i * 20 + lj;
        const idx = row * nLon + (nLon === 720 ? col : i);
        const wn = res.windows.noon, wm = res.windows.mid;
        const a = codes(wn.n[c], wn.sum[c], wn.min[c], wn.max[c], Math.abs(latx) > NOON_MASK);
        const b = codes(wm.n[c], wm.sum[c], wm.min[c], wm.max[c], Math.abs(latx) > MID_MASK);
        vN[idx] = a.value; nN[idx] = a.n; rN[idx] = a.range; vM[idx] = b.value; nM[idx] = b.n; rM[idx] = b.range;
        at.push({ lonx100: -17975 + 50 * lonIdx, latx100: latx, col, noon: a, mid: b });
      }
    }
    const out = new Uint8Array(cells * 8), dv = new DataView(out.buffer);
    for (let i = 0; i < cells; i++) { dv.setUint16(2 * i, vN[i], true); dv.setUint16(2 * cells + 2 * i, vM[i], true); }
    out.set(nN, 4 * cells); out.set(nM, 5 * cells); out.set(rN, 6 * cells); out.set(rM, 7 * cells);
    return { bytes: out, rows: 20, cols: nLon, cellsAt: at };
  }
  /** The extraction as little-endian bytes (independent of platform endianness). */
  function extractionBytes(ext) { const out = new Uint8Array(ext.length * 4), dv = new DataView(out.buffer); for (let i = 0; i < ext.length; i++) dv.setInt32(4 * i, ext[i], true); return out; }

  const api = { GcpBand, GcpError, codes, bandPlanes, extractionBytes, parseFixed, VERSION: 'gcp_stream-1', REC, NOON, MID, SENT_EMPTY, SENT_INVALID };
  root.GcpStream = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
