// Earth from Space: what validating one real frame costs in memory and CPU. Evidence only; not part of the hub.
// Usage: node --expose-gc phase1/earthview-decoder-measure.mjs <day|night|dusk> <plain|sampled|live>
//   plain    no instrumentation: CPU per step, and Node's raw memory counters before the decode, when it returns, and after a
//            forced collection while the result is still held (the RETURNED FOOTPRINT). This mode measures no peak.
//   sampled  every typed-array allocation the decoder makes is counted; the counters are read every 256th allocation and around
//            every allocation of 1 MB or more. The largest reading is the SAMPLED PEAK, garbage not yet collected included.
//   live     as sampled, with a forced collection before each reading: the largest reading is the peak of memory still in use.
// One process per run, so readings do not mix. Counters are process.memoryUsage() as Node reports them:
//   rss; heapTotal; heapUsed; external (memory outside the V8 heap tied to JavaScript objects, WHICH INCLUDES arrayBuffers); arrayBuffers.
//   "js" below = heapUsed + external. arrayBuffers is NOT added again (the first version of this script did, and over-counted).
// maxRSS is the operating system's high-water mark for the whole Node process. None of this is a Cloudflare Worker measurement.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), name = process.argv[2] || 'day', mode = process.argv[3] || 'plain';
const W = await import('./worker.js'); const jpg = new Uint8Array(fs.readFileSync(path.join(HERE, 'earthview-fixtures', name + '.jpg'))), pngB = new Uint8Array(fs.readFileSync(path.join(HERE, 'earthview-fixtures', name + '.png')));
const MB = 1048576, r1 = x => +(x / MB).toFixed(2);
const read = () => { const m = process.memoryUsage(); return { rss: r1(m.rss), heapTotal: r1(m.heapTotal), heapUsed: r1(m.heapUsed), external: r1(m.external), arrayBuffers: r1(m.arrayBuffers), js: r1(m.heapUsed + m.external) }; };
const gc = () => { if (global.gc) { global.gc(); global.gc(); } };
const out = { frame: name, mode, bytes: jpg.length, node: process.version, units: 'MB (1,048,576 bytes); CPU in ms' };
const png = await W.evPng(pngB, 65536); gc();
out.before = read(); out.maxRSS_before = +(process.resourceUsage().maxRSS / 1024).toFixed(1);
let peak = null, samples = 0, allocs = 0, bytes = 0; const NAMES = ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'], REAL = {};
const sample = () => { if (mode === 'live') gc(); const m = process.memoryUsage(), js = m.heapUsed + m.external; samples++; if (!peak || js > peak.jsBytes) peak = { jsBytes: js, rss: r1(m.rss), heapTotal: r1(m.heapTotal), heapUsed: r1(m.heapUsed), external: r1(m.external), arrayBuffers: r1(m.arrayBuffers), js: r1(js), at_allocation: allocs }; };
if (mode !== 'plain') for (const n of NAMES) { REAL[n] = globalThis[n]; globalThis[n] = new Proxy(REAL[n], { construct(t, args, nt) { const big = typeof args[0] === 'number' && args[0] * t.BYTES_PER_ELEMENT >= MB; if (big) sample(); const o = Reflect.construct(t, args, nt === globalThis[n] ? t : nt); allocs++; bytes += o.byteLength; if (big || allocs % 256 === 0) sample(); return o; } }); }
const c0 = process.cpuUsage(), t0 = performance.now();
const sc = W.evJpegScans(jpg); const c1 = process.cpuUsage(c0);
if (mode !== 'plain') sample();
const dec = W.evDecode(jpg); const c2 = process.cpuUsage(c0);
if (mode !== 'plain') { sample(); for (const n of NAMES) globalThis[n] = REAL[n]; }
out.when_decode_returns = read();
const cmp = W.evCompare(dec, png); const c3 = process.cpuUsage(c0), wall = performance.now() - t0;
gc(); out.returned_footprint_after_collection = read();
const ms = c => +((c.user + c.system) / 1000).toFixed(1);
out.cpu = { structure_walk: ms(c1), jpeg_decode: +(ms(c2) - ms(c1)).toFixed(1), compare: +(ms(c3) - ms(c2)).toFixed(1), total: ms(c3), wall: +wall.toFixed(1), note: mode === 'plain' ? 'uninstrumented' : 'INFLATED by the instrumentation; use the plain run for CPU' };
if (mode !== 'plain') { delete peak.jsBytes; out.peak = { ...peak, over_before_js: +(peak.js - out.before.js).toFixed(2), readings: samples, typed_array_allocations: allocs, typed_array_bytes_allocated_total: r1(bytes), kind: mode === 'live' ? 'largest reading with a forced collection before each: memory still in use' : 'largest reading as run: includes garbage not yet collected' }; }
out.returned_over_before_js = +(out.returned_footprint_after_collection.js - out.before.js).toFixed(2);
out.maxRSS_after = +(process.resourceUsage().maxRSS / 1024).toFixed(1);
out.result = { scans: sc.scans, complete: sc.complete, decoded: !dec.error, ok: cmp.ok, agreement: cmp.agreement };
console.log(JSON.stringify(out));
