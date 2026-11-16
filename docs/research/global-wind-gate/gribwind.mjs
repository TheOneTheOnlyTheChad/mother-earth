// Candidate narrow GRIB2 decoder for the six GFS wind messages (gate test, 16 Nov 2026).
// Supports ONLY: edition 2, one field per message, grid template 3.0 (regular lat/lon), scanning mode 0,
// Earth-relative components, product template 4.0, data template 5.3 (complex packing, spatial differencing order 2),
// no bitmap, no missing-value management, floating-point original values. Anything else throws GribRefused.
// Rev 2 (16 Nov, GPT's review): the grid must be exactly the expected global grid; sizes and group counts are bounded
// before anything is allocated; non-finite packing numbers and non-finite or implausible output are refused;
// decodeWindBatch() requires exactly the six expected fields from one run.
export class GribRefused extends Error { constructor(m) { super(m); this.name = 'GribRefused'; } }
const no = (m) => { throw new GribRefused(m); };
const u8 = (b, o) => b[o];
const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const u32 = (b, o) => ((b[o] * 16777216) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]);
const sm = (v, bits) => { const s = 2 ** (bits - 1); return v >= s ? -(v - s) : v; };   // sign-and-magnitude
const s16 = (b, o) => sm(u16(b, o), 16);
const s32 = (b, o) => sm(u32(b, o), 32);
const f32 = (b, o) => new DataView(b.buffer, b.byteOffset + o, 4).getFloat32(0, false);

export const GFS_0P25 = { ni: 1440, nj: 721, la1: 90, lo1: 0, la2: -90, lo2: 359.75, di: 0.25, dj: 0.25 };
export const MAX_ABS_MS = 500;   // no wind component on Earth approaches this; a larger value means corrupt input

export function decode(msg, grid = GFS_0P25, maxAbs = MAX_ABS_MS) {
  if (!(msg instanceof Uint8Array)) no('input is not bytes');
  if (msg.length < 16 + 21 + 4) no('too short for a GRIB2 message');
  if (!(msg[0] === 71 && msg[1] === 82 && msg[2] === 73 && msg[3] === 66)) no('does not start with GRIB');
  if (msg[7] !== 2) no('edition ' + msg[7] + ' not supported');
  const hi = u32(msg, 8), total = u32(msg, 12);
  if (hi !== 0) no('message length over 4 GB');
  if (total !== msg.length) no(`declared length ${total} but ${msg.length} bytes given`);
  if (!(msg[total - 4] === 55 && msg[total - 3] === 55 && msg[total - 2] === 55 && msg[total - 1] === 55)) no('does not end with 7777');
  const discipline = msg[6];
  const sec = {}; let o = 16;
  while (o < total - 4) {
    if (o + 5 > total - 4) no('section header runs past the end');
    const len = u32(msg, o), num = msg[o + 4];
    if (len < 5 || o + len > total - 4) no(`section ${num} length ${len} runs past the end`);
    if (num < 1 || num > 7) no('unknown section ' + num);
    if (num === 2) { o += len; continue; }               // local use: ignored
    if (sec[num]) no(`section ${num} appears twice (more than one field in the message)`);
    sec[num] = msg.subarray(o, o + len); o += len;
  }
  if (o !== total - 4) no('sections do not fill the message');
  for (const n of [1, 3, 4, 5, 6, 7]) if (!sec[n]) no('section ' + n + ' missing');
  const s1 = sec[1], s3 = sec[3], s4 = sec[4], s5 = sec[5], s6 = sec[6], s7 = sec[7];
  // Section 1: reference time
  if (s1.length < 21) no('section 1 too short');
  const ref = { significance: s1[11], year: u16(s1, 12), month: s1[14], day: s1[15], hour: s1[16], minute: s1[17], second: s1[18] };
  // Section 3: grid
  if (s3.length < 72) no('section 3 too short');
  if (s3[5] !== 0) no('grid definition source ' + s3[5]);
  if (s3[10] !== 0) no('quasi-regular grid not supported');
  if (u16(s3, 12) !== 0) no('grid template 3.' + u16(s3, 12) + ' not supported');
  const npts = u32(s3, 6), ni = u32(s3, 30), nj = u32(s3, 34);
  const basic = u32(s3, 38), sub = u32(s3, 42);
  if (!((basic === 0) && (sub === 0 || sub === 0xFFFFFFFF))) no('non-standard basic angle');
  const la1 = s32(s3, 46) / 1e6, lo1 = u32(s3, 50) / 1e6, flags = s3[54], la2 = s32(s3, 55) / 1e6, lo2 = u32(s3, 59) / 1e6;
  const di = u32(s3, 63) / 1e6, dj = u32(s3, 67) / 1e6, scan = s3[71];
  if (scan !== 0) no('scanning mode ' + scan + ' not supported (only 0: west to east, north to south, rows)');
  if (flags & 0x08) no('wind components are grid-relative, not Earth-relative');
  if ((flags & 0x30) !== 0x30) no('direction increments not given');
  for (const [k, v] of Object.entries({ ni, nj, la1, lo1, la2, lo2, di, dj })) if (v !== grid[k]) no(`grid ${k} is ${v}, expected ${grid[k]}`);
  if (npts !== grid.ni * grid.nj) no('number of grid points is ' + npts + ', expected ' + grid.ni * grid.nj);
  // Section 4: product
  if (s4.length < 34) no('section 4 too short');
  if (u16(s4, 5) !== 0) no('hybrid coordinate list present');
  if (u16(s4, 7) !== 0) no('product template 4.' + u16(s4, 7) + ' not supported');
  const prod = { discipline, category: s4[9], number: s4[10], process: s4[11], timeUnit: s4[17], forecastTime: u32(s4, 18),
    surfaceType: s4[22], surfaceScale: s4[23], surfaceValue: u32(s4, 24), surface2Type: s4[28] };
  // Section 5: packing
  if (s5.length < 49) no('section 5 too short for template 5.3');
  const nvals = u32(s5, 5), drt = u16(s5, 9);
  if (drt !== 3) no('data template 5.' + drt + ' not supported (only 5.3)');
  if (nvals !== npts) no('number of packed values differs from grid points');
  const R = f32(s5, 11), E = s16(s5, 15), D = s16(s5, 17), nbits = s5[19], origType = s5[20], split = s5[21], miss = s5[22];
  if (!Number.isFinite(R)) no('packing reference value is not a finite number');
  if (Math.abs(E) > 30) no('binary scale factor ' + E + ' out of range');
  if (D < 0 || D > 6) no('decimal scale factor ' + D + ' out of range');
  if (origType !== 0) no('original field type ' + origType + ' not supported');
  if (split !== 1) no('group splitting method ' + split + ' not supported');
  if (miss !== 0) no('missing-value management ' + miss + ' not supported');
  const NG = u32(s5, 31), refW = s5[35], bitsW = s5[36], refL = u32(s5, 37), incL = s5[41], lastL = u32(s5, 42), bitsL = s5[46], order = s5[47], nOct = s5[48];
  if (order !== 2) no('spatial differencing order ' + order + ' not supported (only 2)');
  if (nOct < 1 || nOct > 4) no('extra descriptor size ' + nOct);
  if (nbits > 32 || bitsW > 32 || bitsL > 32) no('field width over 32 bits');
  if (NG < 1 || NG > npts) no('group count out of range');
  if (lastL < 1 || lastL > npts || incL < 1) no('group length fields out of range');
  // every group needs its reference, width and length fields inside section 7: checked before any array is made
  if (5 + 3 * nOct + Math.ceil(NG * nbits / 8) + Math.ceil(NG * bitsW / 8) + Math.ceil(NG * bitsL / 8) > s7.length) no('group count does not fit in the data section');
  // Section 6: bitmap
  if (s6.length < 6) no('section 6 too short');
  if (s6[5] !== 255) no('bitmap indicator ' + s6[5] + ' not supported (only 255: none)');
  // Section 7: data
  const d = s7, dl = d.length; let p = 5;
  const need = (n) => { if (p + n > dl) no('data section ends early'); };
  const rdS = () => { need(nOct); let v = 0; for (let i = 0; i < nOct; i++) v = v * 256 + d[p + i]; p += nOct; return sm(v, 8 * nOct); };
  const ival1 = rdS(), ival2 = rdS(), minsd = rdS();
  let bit = p * 8; const endBit = dl * 8;
  const rd = (n) => {                                   // read n bits (0..32), big-endian
    if (n === 0) return 0;
    if (bit + n > endBit) no('data section ends early');
    let v = 0, left = n;
    while (left > 0) {
      const byte = d[bit >> 3], off = bit & 7, take = Math.min(8 - off, left);
      v = v * (1 << take) + ((byte >> (8 - off - take)) & ((1 << take) - 1));
      bit += take; left -= take;
    }
    return v;
  };
  const align = () => { bit = (bit + 7) & ~7; };
  const gref = new Int32Array(NG), gwid = new Uint8Array(NG), glen = new Int32Array(NG);
  for (let g = 0; g < NG; g++) gref[g] = rd(nbits); align();
  for (let g = 0; g < NG; g++) { const w = refW + rd(bitsW); if (w > 32) no('group width over 32'); gwid[g] = w; } align();
  let sum = 0;
  for (let g = 0; g < NG; g++) { const L = refL + rd(bitsL) * incL; glen[g] = L; sum += L; } align();
  sum += lastL - glen[NG - 1]; glen[NG - 1] = lastL;
  if (sum !== nvals) no(`group lengths add to ${sum}, expected ${nvals}`);
  const x = new Float64Array(nvals); let k = 0;
  for (let g = 0; g < NG; g++) {
    const w = gwid[g], L = glen[g], r = gref[g];
    if (w === 0) { for (let i = 0; i < L; i++) x[k++] = r; }
    else { if (bit + w * L > endBit) no('data section ends early'); for (let i = 0; i < L; i++) x[k++] = r + rd(w); }
  }
  if (k !== nvals) no('value count mismatch');
  if (endBit - bit >= 8 * 2) no('unread bytes at the end of the data section');
  // undo second-order differencing
  x[0] = ival1; x[1] = ival2;
  for (let n = 2; n < nvals; n++) x[n] = x[n] + minsd + 2 * x[n - 1] - x[n - 2];
  const be = 2 ** E, dd = 10 ** (-D), out = new Float64Array(nvals);
  for (let n = 0; n < nvals; n++) {
    const v = (R + x[n] * be) * dd;
    if (!(Math.abs(v) <= maxAbs)) no(Number.isFinite(v) ? `decoded value ${v} at point ${n} is beyond ${maxAbs}` : `decoded value at point ${n} is not a finite number`);
    out[n] = v;
  }
  return { ref, prod, grid: { ni, nj, la1, lo1, la2, lo2, di, dj, scan, flags }, packing: { template: 3, order, R, E, D, nbits, NG }, values: out };
}

// The six fields the wind layer needs, in order. surfaceType 103 = height above ground (m), 100 = isobaric (Pa).
export const WIND_FIELDS = [
  { key: 'u10m', number: 2, surfaceType: 103, surfaceValue: 10 }, { key: 'v10m', number: 3, surfaceType: 103, surfaceValue: 10 },
  { key: 'u250', number: 2, surfaceType: 100, surfaceValue: 25000 }, { key: 'v250', number: 3, surfaceType: 100, surfaceValue: 25000 },
  { key: 'u10', number: 2, surfaceType: 100, surfaceValue: 1000 }, { key: 'v10', number: 3, surfaceType: 100, surfaceValue: 1000 },
];
// Checks one decoded message is the wanted field of the wanted run. cycle = { year, month, day, hour } (UTC).
export function checkField(r, want, cycle) {
  const p = r.prod, t = r.ref;
  if (p.discipline !== 0 || p.category !== 2 || p.number !== want.number) no(`${want.key}: parameter is ${p.discipline}.${p.category}.${p.number}`);
  if (p.surfaceType !== want.surfaceType || p.surfaceScale !== 0 || p.surfaceValue !== want.surfaceValue || p.surface2Type !== 255) no(`${want.key}: level is type ${p.surfaceType} value ${p.surfaceValue}`);
  if (p.forecastTime !== 0) no(`${want.key}: forecast time ${p.forecastTime}, expected 0`);
  if (t.significance !== 1) no(`${want.key}: reference time significance ${t.significance}`);
  if (t.year !== cycle.year || t.month !== cycle.month || t.day !== cycle.day || t.hour !== cycle.hour || t.minute !== 0 || t.second !== 0) no(`${want.key}: run is ${t.year}-${t.month}-${t.day} ${t.hour}:${t.minute}, expected ${cycle.year}-${cycle.month}-${cycle.day} ${cycle.hour}:00`);
}
// Exactly six messages, in WIND_FIELDS order, all from one run. Calls use(i, decoded) for each, one at a time, so the
// caller can keep only what it needs. Refuses the whole batch on any failure.
export function decodeWindBatch(msgs, cycle, use) {
  if (!Array.isArray(msgs) || msgs.length !== WIND_FIELDS.length) no(`batch has ${Array.isArray(msgs) ? msgs.length : 'no'} messages, expected ${WIND_FIELDS.length}`);
  for (let i = 0; i < WIND_FIELDS.length; i++) { const r = decode(msgs[i]); checkField(r, WIND_FIELDS[i], cycle); use(i, r); }
}
