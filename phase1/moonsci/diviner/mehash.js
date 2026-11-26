/* Incremental MD5 (RFC 1321) and SHA-256 (FIPS 180-4) for streamed bytes.
 * Mother Earth build tooling for the Diviner GCP acquisition trial (MOON-DIVINER-PROPOSAL rev 2 §7.1). Never served on the page.
 * Why: crypto.subtle has no MD5 and no incremental digest, and a 156 MB band must not be buffered whole.
 * Usage: const h = new MEHash.MD5(); h.update(uint8array) any number of times (empty chunks allowed); h.hex() once at the end.
 * Tested by phase1/moonsci/diviner/test_mehash.cjs (RFC/FIPS vectors, random chunk boundaries, the sample files) against Node's crypto. */
(function (root) {
  'use strict';
  const hex32le = w => { let s = ''; for (let i = 0; i < 4; i++) s += ((w >>> (8 * i)) & 255).toString(16).padStart(2, '0'); return s; };
  const hex32be = w => (w >>> 0).toString(16).padStart(8, '0');

  // ---------------------------------------------------------------- MD5
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = new Int32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  class MD5 {
    constructor() { this.h = new Int32Array([0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476]); this.buf = new Uint8Array(64); this.bl = 0; this.len = 0; this.M = new Int32Array(16); this.done = false; }
    _block(b, o) {
      const M = this.M;
      for (let i = 0; i < 16; i++) M[i] = b[o + 4 * i] | (b[o + 4 * i + 1] << 8) | (b[o + 4 * i + 2] << 16) | (b[o + 4 * i + 3] << 24);
      let a = this.h[0], bb = this.h[1], c = this.h[2], d = this.h[3];
      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) { f = (bb & c) | (~bb & d); g = i; }
        else if (i < 32) { f = (d & bb) | (~d & c); g = (5 * i + 1) & 15; }
        else if (i < 48) { f = bb ^ c ^ d; g = (3 * i + 5) & 15; }
        else { f = c ^ (bb | ~d); g = (7 * i) & 15; }
        const t = d; d = c; c = bb;
        const x = (a + f + K[i] + M[g]) | 0;
        bb = (bb + ((x << S[i]) | (x >>> (32 - S[i])))) | 0;
        a = t;
      }
      this.h[0] = (this.h[0] + a) | 0; this.h[1] = (this.h[1] + bb) | 0; this.h[2] = (this.h[2] + c) | 0; this.h[3] = (this.h[3] + d) | 0;
    }
    update(u8) {
      if (this.done) throw new Error('MD5: update after hex');
      let i = 0; const n = u8.length; this.len += n;
      if (this.bl) { while (i < n && this.bl < 64) this.buf[this.bl++] = u8[i++]; if (this.bl === 64) { this._block(this.buf, 0); this.bl = 0; } }
      for (; i + 64 <= n; i += 64) this._block(u8, i);
      while (i < n) this.buf[this.bl++] = u8[i++];
      return this;
    }
    hex() {
      if (this.done) throw new Error('MD5: hex twice'); this.done = true;
      const bits = this.len * 8, pad = new Uint8Array(((this.bl < 56) ? 56 : 120) - this.bl + 8);
      pad[0] = 0x80;
      const lo = bits >>> 0, hi = Math.floor(bits / 4294967296) >>> 0, p = pad.length - 8;
      for (let i = 0; i < 4; i++) { pad[p + i] = (lo >>> (8 * i)) & 255; pad[p + 4 + i] = (hi >>> (8 * i)) & 255; }
      this.done = false; const L = this.len; this.update(pad); this.len = L; this.done = true;
      return hex32le(this.h[0]) + hex32le(this.h[1]) + hex32le(this.h[2]) + hex32le(this.h[3]);
    }
  }

  // ---------------------------------------------------------------- SHA-256
  const KS = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  class SHA256 {
    constructor() { this.h = new Int32Array([0x6a09e667, 0xbb67ae85 | 0, 0x3c6ef372, 0xa54ff53a | 0, 0x510e527f, 0x9b05688c | 0, 0x1f83d9ab, 0x5be0cd19]); this.buf = new Uint8Array(64); this.bl = 0; this.len = 0; this.W = new Int32Array(64); this.done = false; }
    _block(b, o) {
      const W = this.W;
      for (let i = 0; i < 16; i++) W[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const x = W[i - 15], y = W[i - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let a = this.h[0], bb = this.h[1], c = this.h[2], d = this.h[3], e = this.h[4], f = this.h[5], g = this.h[6], h = this.h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + KS[i] + W[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const mj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      const H = this.h;
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    update(u8) {
      if (this.done) throw new Error('SHA256: update after hex');
      let i = 0; const n = u8.length; this.len += n;
      if (this.bl) { while (i < n && this.bl < 64) this.buf[this.bl++] = u8[i++]; if (this.bl === 64) { this._block(this.buf, 0); this.bl = 0; } }
      for (; i + 64 <= n; i += 64) this._block(u8, i);
      while (i < n) this.buf[this.bl++] = u8[i++];
      return this;
    }
    hex() {
      if (this.done) throw new Error('SHA256: hex twice'); this.done = true;
      const bits = this.len * 8, pad = new Uint8Array(((this.bl < 56) ? 56 : 120) - this.bl + 8);
      pad[0] = 0x80;
      const lo = bits >>> 0, hi = Math.floor(bits / 4294967296) >>> 0, p = pad.length - 8;
      for (let i = 0; i < 4; i++) { pad[p + 3 - i] = (hi >>> (8 * i)) & 255; pad[p + 7 - i] = (lo >>> (8 * i)) & 255; }
      this.done = false; const L = this.len; this.update(pad); this.len = L; this.done = true;
      let s = ''; for (let i = 0; i < 8; i++) s += hex32be(this.h[i]); return s;
    }
  }

  const api = { MD5, SHA256, VERSION: 'mehash-1' };
  root.MEHash = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
