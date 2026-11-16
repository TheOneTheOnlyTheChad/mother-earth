// Memory-lean order of work, as a Worker would do it: one message at a time, keep only the 1 degree samples.
import { readFileSync } from 'node:fs';
import { decode } from './gribwind.mjs';
const dir = process.argv[2]; const W = 360, H = 181;
const rss = () => process.memoryUsage().rss / 1048576, ab = () => process.memoryUsage().arrayBuffers / 1048576;
let peak = rss(), peakAb = ab(); const start = rss(); const c0 = process.cpuUsage();
for (let lev = 0; lev < 3; lev++) {
  const out = new Int16Array(W * H * 2);
  for (let c = 0; c < 2; c++) {
    let msg = new Uint8Array(readFileSync(`${dir}/msg${lev * 2 + c}.grib2`));
    let r = decode(msg);
    peak = Math.max(peak, rss()); peakAb = Math.max(peakAb, ab());
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) out[(j * W + i) * 2 + c] = Math.round(r.values[j * 4 * 1440 + i * 4] * 10);
    r = null; msg = null; if (global.gc) global.gc();
  }
}
const cpu = process.cpuUsage(c0);
console.log('lean run: rss start MB', start.toFixed(1), 'peak MB', peak.toFixed(1), 'peak ArrayBuffers MB', peakAb.toFixed(1), 'total cpu ms (6 decodes + reduce)', ((cpu.user + cpu.system) / 1000).toFixed(0));
