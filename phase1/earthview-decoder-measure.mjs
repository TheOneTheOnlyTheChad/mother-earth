// Earth from Space: what the carried JPEG decoder costs on one real frame. Evidence only; not part of the hub.
// Usage: node --expose-gc phase1/earthview-decoder-measure.mjs <day|night|dusk>    (one process per frame, so peaks do not mix)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), name = process.argv[2] || 'day';
const W = await import('./worker.js'); const jpg = new Uint8Array(fs.readFileSync(path.join(HERE, 'earthview-fixtures', name + '.jpg'))), pngB = new Uint8Array(fs.readFileSync(path.join(HERE, 'earthview-fixtures', name + '.png')));
const mem = () => { const m = process.memoryUsage(); return m.heapUsed + m.arrayBuffers + m.external; };
if (global.gc) global.gc(); const base = mem(), rss0 = process.resourceUsage().maxRSS;
const c0 = process.cpuUsage(), t0 = performance.now();
const sc = W.evJpegScans(jpg); const c1 = process.cpuUsage(c0);
const png = await W.evPng(pngB, 65536); const c2 = process.cpuUsage(c0);
const dec = W.evDecode(jpg); const c3 = process.cpuUsage(c0); const held = mem();
const cmp = W.evCompare(dec, png); const c4 = process.cpuUsage(c0), wall = performance.now() - t0;
const ms = c => +((c.user + c.system) / 1000).toFixed(1);
console.log(JSON.stringify({ frame: name, bytes: jpg.length, node: process.version, structure_walk_cpu_ms: ms(c1), check_image_decode_cpu_ms: +(ms(c2) - ms(c1)).toFixed(1), jpeg_decode_cpu_ms: +(ms(c3) - ms(c2)).toFixed(1), compare_cpu_ms: +(ms(c4) - ms(c3)).toFixed(1), total_cpu_ms: ms(c4), wall_ms: +wall.toFixed(1),
  js_memory_held_after_decode_mb: +((held - base) / 1048576).toFixed(1), process_peak_rss_mb: +(process.resourceUsage().maxRSS / 1024).toFixed(1), process_rss_before_mb: +(rss0 / 1024).toFixed(1), scans: sc.scans, complete: sc.complete, ok: cmp.ok, agreement: cmp.agreement }));
