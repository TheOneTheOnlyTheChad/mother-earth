/* Fixture for the spacecraft page suite: runs the REAL hub job (worker.js) once against an in-memory store and a stubbed Horizons,
 * and prints what the hub would then serve: { meta, id, snapshot (base64), parker_raw_sha256 }. Synthetic positions (a straight
 * line through one real Horizons vector for 13 Nov 2026); the layout of the answer is the service's own.
 * Usage: node --no-warnings phase1/skycraft-fixture.mjs <now ISO> [edge=<ISO>] [worker.js path] */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const now = Date.parse(process.argv[2]), edgeArg = (process.argv.find(a => a.startsWith('edge=')) || '').slice(5), wpath = process.argv.find(a => a.endsWith('.js')) || path.join(HERE, 'worker.js');
const tmp = path.join(os.tmpdir(), `worker-fx-${process.pid}.mjs`); fs.writeFileSync(tmp, fs.readFileSync(wpath, 'utf8')); const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
const DAY = 86400000, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], p2 = n => String(n).padStart(2, '0');
const stamp = ms => { const d = new Date(ms); return `${d.getUTCFullYear()}-${MON[d.getUTCMonth()]}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
const T0 = Date.UTC(2026, 10, 13), R0 = [7.979684547823191e7, -2.282608030497202e7, -1.531531810977850e7], V0 = [-18.58428067979435, 20.24464414963325, 10.28631893872136];
const pos = ms => R0.map((c, k) => c + V0[k] * (ms - T0) / 1000);
const edge = edgeArg ? stamp(Date.parse(edgeArg)) : '2027-Feb-17 00:00';
const table = `  Name                                      Start (TDB)         End (TDB) \n  ---------------------------------------  -----------------  -----------------\n  spp_pred_20260930_20270217_od268_v001    2026-Sep-30 00:00  ${edge}\n  spp_nom_20180812_20300101_v044_PostV7    ${edge}  2030-Jan-01 00:00\n`;
function answer(url) {
  const u = decodeURIComponent(url), lro = u.includes("COMMAND='-85'"), g = k => (new RegExp(k + "='([^']*)'").exec(u) || [])[1], T = s => Date.parse(s.replace(' ', 'T') + ':00Z');
  let times = []; if (u.includes('TLIST=')) times = /TLIST=([^&]*)/.exec(u)[1].split(',').map(x => T(x.replace(/'/g, ''))); else for (let t = T(g('START_TIME')); t <= T(g('STOP_TIME')); t += parseInt(g('STEP_SIZE')) * 60000) times.push(t);
  const sheet = lro ? ` Revised: Oct 07, 2026          LRO Spacecraft / (Moon)                     -85\n\n SPACECRAFT TRAJECTORY: \n  Final reconstructed trajectory segments are from PDS.\n\n  Trajectory name                   Start (TDB)          Stop (TDB)\n  ----------------------------   -----------------   -----------------\n  558day_20261007_01             2026-Oct-07 00:01   2028-Apr-16 23:59\n`
    : ` Revised: Nov 03, 2026         Parker Solar Probe / Sun                    -96\n\n SPACECRAFT TRAJECTORY \n  Fit to post-launch tracking data through 2026-Sep-29. Reference planning \n  trajectory for subsequent times.\n\n${table}`;
  const head = `Target body name: ${lro ? 'LRO (spacecraft) (-85)          {source: LRO_merged}' : 'Parker Solar Probe (spacecraft) (-96) {source: psp_merged}'}\nCenter body name: ${lro ? 'Moon (301)' : 'Sun (10)'}                        {source: DE441}\nCenter-site name: BODY CENTER\nOutput units    : KM-S\nOutput type     : GEOMETRIC cartesian states\nReference frame : ICRF\n`;
  const rows = times.map(ms => { const p = lro ? [1200, 40, 1350] : pos(ms); return `${(2440587.5 + ms / DAY).toFixed(9)} = A.D. ${stamp(ms)}:00.0000 UTC\n X = ${p[0].toExponential(15)} Y = ${p[1].toExponential(15)} Z = ${p[2].toExponential(15)}\n VX= 1.0E+00 VY= 1.0E+00 VZ= 1.0E+00`; }).join('\n');
  return JSON.stringify({ signature: { source: 'NASA/JPL Horizons API', version: '1.2' }, result: `*******\n${sheet}*******************************************************************************\n\n*******\nEphemeris / API_USER\n*******\n${head}*******\n$$SOE\n${rows}\n$$EOE\n*******\n` });
}
const store = new Map(), etag = b => crypto.createHash('md5').update(b).digest('hex');
const R2 = { async put(k, body, o = {}) { const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body); if (o.onlyIf) { const had = store.get(k); if (o.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== o.onlyIf.etagMatches)) return null; } store.set(k, { buf, etag: etag(buf) }); return { etag: etag(buf) }; },
  async get(k) { const o = store.get(k); return o ? { etag: o.etag, async arrayBuffer() { return o.buf.buffer.slice(o.buf.byteOffset, o.buf.byteOffset + o.buf.byteLength); }, async json() { return JSON.parse(o.buf.toString()); } } : null; }, async delete(k) { store.delete(k); } };
const env = { R2, DB: { prepare() { return { bind() { return { async run() { return {}; } }; } }; } } };
globalThis.fetch = async url => new Response(answer(String(url)), { status: 200, headers: { 'content-type': 'application/json' } });
const RealDate = Date; globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } };
const result = await W.collectSkycraft(env, now);
globalThis.Date = RealDate;
const get = async p => { const r = await W.default.fetch(new Request('https://hub.test' + p), env); return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) }; };
const meta = await get('/snapshot/skycraft/meta'), id = JSON.parse(meta.buf.toString()).current.id, snap = await get('/snapshot/skycraft/' + id);
console.log(JSON.stringify({ result, meta: meta.buf.toString(), id, snapshot: snap.buf.toString('base64'), status: snap.status }));
