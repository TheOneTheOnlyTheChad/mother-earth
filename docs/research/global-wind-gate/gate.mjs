import { readFileSync, writeFileSync } from 'node:fs';
import { decode, GribRefused } from './gribwind.mjs';
const dir = process.argv[2];
const meta = JSON.parse(readFileSync(dir + '/ref-meta.json', 'utf8'));
const TOL = 1e-6;
const rss0 = process.memoryUsage().rss;
const dec = []; let peakRss = rss0;
console.log('== decode vs ecCodes, tolerance ' + TOL + ' m/s');
for (let i = 0; i < 6; i++) {
  const msg = new Uint8Array(readFileSync(`${dir}/msg${i}.grib2`));
  const c0 = process.cpuUsage(); const t0 = performance.now();
  const r = decode(msg);
  const cpu = process.cpuUsage(c0); const ms = performance.now() - t0;
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
  const refb = readFileSync(`${dir}/ref${i}.f64`); const ref = new Float64Array(refb.buffer, refb.byteOffset, refb.length / 8);
  let maxd = 0, nbad = 0, nan = 0;
  for (let n = 0; n < ref.length; n++) { const dlt = Math.abs(ref[n] - r.values[n]); if (!(dlt <= TOL)) nbad++; if (dlt > maxd) maxd = dlt; if (Number.isNaN(r.values[n])) nan++; }
  console.log(i, meta[i].shortName, meta[i].level, 'n', r.values.length, 'refn', ref.length, 'maxdiff', maxd.toExponential(2), 'over tol', nbad, 'NaN', nan,
    'cpu ms', ((cpu.user + cpu.system) / 1000).toFixed(1), 'wall ms', ms.toFixed(1),
    'prod', JSON.stringify(r.prod), 'ref', JSON.stringify(r.ref), 'grid', JSON.stringify(r.grid), 'pack', JSON.stringify(r.packing));
  dec.push(r);
}
console.log('rss start MB', (rss0 / 1048576).toFixed(1), 'peak MB', (peakRss / 1048576).toFixed(1), 'heapUsed MB', (process.memoryUsage().heapUsed / 1048576).toFixed(1));
// agreement across six
const g0 = JSON.stringify(dec[0].grid), r0 = JSON.stringify(dec[0].ref);
console.log('same grid all six', dec.every(d => JSON.stringify(d.grid) === g0), 'same ref time', dec.every(d => JSON.stringify(d.ref) === r0), 'all f000 analysis', dec.every(d => d.prod.forecastTime === 0));
// == refusal tests
console.log('== refusals');
const base = new Uint8Array(readFileSync(`${dir}/msg0.grib2`));
const tryIt = (name, bytes) => { try { decode(bytes); console.log(name, 'ACCEPTED (bad)'); } catch (e) { console.log(name, '->', e.name, ':', e.message); } };
tryIt('truncated to half', base.slice(0, base.length >> 1));
{ const b = base.slice(0, base.length - 1000); const t = new Uint8Array(b.length + 0); t.set(b); // truncated but with length and 7777 fixed up
  const n = t.length; t[12] = n >>> 24; t[13] = (n >> 16) & 255; t[14] = (n >> 8) & 255; t[15] = n & 255; t.set([55, 55, 55, 55], n - 4); tryIt('cut 1000 bytes, length and end marker repaired', t); }
const find5 = () => { let o = 16; while (true) { const len = (base[o] * 16777216) + (base[o + 1] << 16) + (base[o + 2] << 8) + base[o + 3]; if (base[o + 4] === 5) return o; o += len; } };
const o5 = find5();
{ const b = base.slice(); b[o5 + 10] = 0; tryIt('data template set to 5.0 (simple packing)', b); }
{ const b = base.slice(); b[o5 + 10] = 40; tryIt('data template set to 5.40 (JPEG 2000)', b); }
{ const b = base.slice(); b[o5 + 22] = 1; tryIt('missing-value management set to 1', b); }
{ const b = base.slice(); b[o5 + 47] = 1; tryIt('differencing order set to 1', b); }
const findN = (num) => { let o = 16; while (true) { const len = (base[o] * 16777216) + (base[o + 1] << 16) + (base[o + 2] << 8) + base[o + 3]; if (base[o + 4] === num) return o; o += len; } };
{ const b = base.slice(); b[findN(3) + 71] = 64; tryIt('scanning mode set to 64 (south to north)', b); }
{ const b = base.slice(); b[findN(3) + 54] |= 8; tryIt('components flagged grid-relative', b); }
{ const b = base.slice(); b[findN(6) + 5] = 0; tryIt('bitmap flagged present', b); }
{ const b = base.slice(); b[7] = 1; tryIt('edition set to 1', b); }
// == export 1 degree grids: sample the model value at each whole degree (every 4th point of the 0.25 degree grid)
console.log('== 1 degree export (method: point sample at whole degrees; components first, speed after)');
const NI = 1440, STEP = 4, W = 360, H = 181, MISS = -32768;
const levels = [['near-ground', 0, 1], ['250hPa', 2, 3], ['10hPa', 4, 5]];
const enc = {};
for (const [name, iu, iv] of levels) {
  const out = new Int16Array(W * H * 2);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const src = (j * STEP) * NI + i * STEP;
    for (const [c, arr] of [[0, dec[iu].values], [1, dec[iv].values]]) {
      const v = arr[src]; const q = Number.isFinite(v) ? Math.round(v * 10) : MISS;
      if (q !== MISS && (q < -32767 || q > 32767)) throw new Error('out of int16 range');
      out[(j * W + i) * 2 + c] = q;
    }
  }
  enc[name] = out; writeFileSync(`${dir}/wind-${name}.i16`, Buffer.from(out.buffer));
  console.log(name, 'bytes', out.byteLength);
}
// == real vectors at chosen points: exported value vs ecCodes reference
const refArr = (i) => { const b = readFileSync(`${dir}/ref${i}.f64`); return new Float64Array(b.buffer, b.byteOffset, b.length / 8); };
const refs = [0, 1, 2, 3, 4, 5].map(refArr);
const card = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function read(u, v, j) {                                 // inspector rule
  const sp = Math.hypot(u, v) * 3.6;
  if (j === 0 || j === H - 1) return { kmh: sp, text: `${sp.toFixed(0)} km/h (pole: no bearing)` };
  if (sp < 1) return { kmh: sp, text: 'calm' };
  const from = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360, to = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;
  return { kmh: sp, from, to, text: `From ${card[Math.round(from / 45) % 8]} (${Math.round(from) % 360}°), ${sp.toFixed(0)} km/h; arrow heads ${Math.round(to) % 360}°` };
}
const pts = [['Cape Town', -34, 18], ['North Atlantic', 50, -30], ['Tokyo', 36, 140], ['Southern Ocean', -55, 100], ['Date line west side', 0, 179], ['Date line', 0, 180], ['Date line east side', 0, -179], ['Greenwich seam', 40, 0], ['Last column', 40, 359], ['Near N pole', 89, 45], ['Near S pole', -89, 200], ['N pole', 90, 0], ['S pole', -90, 90]];
let worst = 0;
for (const [name, lat, lon] of pts) {
  const j = 90 - lat, i = ((lon % 360) + 360) % 360; const row = [name, lat, lon];
  levels.forEach(([lname, iu, iv]) => {
    const e = enc[lname], u = e[(j * W + i) * 2] / 10, v = e[(j * W + i) * 2 + 1] / 10;
    const src = (j * 4) * NI + i * 4, ru = refs[iu][src], rv = refs[iv][src];
    worst = Math.max(worst, Math.abs(u - ru), Math.abs(v - rv));
    row.push(`${lname}: u ${u.toFixed(1)} (ref ${ru.toFixed(2)}) v ${v.toFixed(1)} (ref ${rv.toFixed(2)}) → ${read(u, v, j).text}`);
  });
  console.log(row.join(' | '));
}
console.log('worst export-vs-reference difference at these points m/s', worst.toFixed(3), '(quantisation limit 0.05)');
// whole-grid export check against reference
let gw = 0; levels.forEach(([lname, iu, iv]) => { const e = enc[lname]; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const s = (j * 4) * NI + i * 4; gw = Math.max(gw, Math.abs(e[(j * W + i) * 2] / 10 - refs[iu][s]), Math.abs(e[(j * W + i) * 2 + 1] / 10 - refs[iv][s])); } });
console.log('worst export-vs-reference over all 3 x 65,160 cells m/s', gw.toFixed(4));
// pole rows: speed spread across longitudes
levels.forEach(([lname, iu, iv]) => { for (const [pn, j] of [['N', 0], ['S', 720]]) { let mn = 1e9, mx = -1e9; for (let i = 0; i < NI; i++) { const s = Math.hypot(refs[iu][j * NI + i], refs[iv][j * NI + i]); mn = Math.min(mn, s); mx = Math.max(mx, s); } console.log('pole row', pn, lname, 'speed min', mn.toFixed(3), 'max', mx.toFixed(3), 'm/s across 1440 longitudes'); } });
// == synthetic vectors
console.log('== synthetic');
for (const [n, u, v] of [['eastward 10 m/s', 10, 0], ['northward 10 m/s', 0, 10], ['westward', -10, 0], ['southward', 0, -10], ['to north-east', 7, 7], ['0.2 m/s', 0.2, 0]]) console.log(n, '→', read(u, v, 50).text);
console.log('eastward at exact pole →', read(10, 0, 0).text);
