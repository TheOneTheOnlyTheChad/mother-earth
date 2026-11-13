/* Sky spacecraft hub job, probe and routes (hub 0.6.12; MOON-AND-SUN-BUILD-PROPOSAL rev 2.1).
 * The real worker.js runs against a fake R2 (etags, conditional puts, delete), a recording D1 and a stubbed Horizons.
 * Real bytes: the parser is also run over the archived Horizons answers in phase1/skycraft/raw/. Standard library only; no network.
 * Run: node --no-warnings phase1/skycraft-hub.test.mjs
 * BREAK=<name> weakens a copy of worker.js; each must fail:
 *   gate-ignored any-version any-object any-times no-band no-statement edge-ok move-on-fail no-cas create-unconditional no-readback
 *   overwrite no-lock parallel lro-published any-snapshot no-integrity probe-two generic-down no-ua retry cat-unpinned
 *   release-unowned parker-cancels-study no-backoff no-tag-check study-after-lock-loss pointer-throws parker-throw-escapes */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BREAK = process.env.BREAK || '';
const BREAKS = {
  'gate-ignored': ["const v = env.SKYCRAFT_ENABLED !== '1' ?", 'const v = false ?'],
  'any-version': ["  if (ver !== SKYCRAFT.API_VERSION) return { ok: false, reason: 'api version changed', detail: String(ver) };", ''],
  'any-object': ["if (!target || !target.startsWith(spec.target) || !centre || !centre.startsWith(spec.centre))", 'if (false)'],
  'any-times': ["if (z.rows.length !== n || z.rows.some((r, i) => r.ms !== start + i * P.step_s * 1000))", 'if (false)'],
  'no-band': ["if (dist.some(d => !(d >= P.band_km[0] && d <= P.band_km[1])))", 'if (false)'],
  'no-statement': ["  if (fit === null) return bad('parker data sheet statement not recognised', 200, z.statement.slice(0, 160));", ''],
  'edge-ok': ['return (tdb - s.start_tdb_ms < 120000 || s.end_tdb_ms - tdb < 120000) ? -1 : hit[0];', 'return hit[0];'],
  'move-on-fail': ["craftUpdate(env, cur => ({ ...cur, last_attempt: { run:", "craftUpdate(env, cur => ({ ...cur, current: null, last_attempt: { run:"],
  'no-cas': ["    const r = await env.R2.put(SKYCRAFT.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });", "    const r = await env.R2.put(SKYCRAFT.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? undefined : { etagDoesNotMatch: '*' } });"],
  'create-unconditional': ["    const r = await env.R2.put(SKYCRAFT.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' } });", "    const r = await env.R2.put(SKYCRAFT.POINTER, JSON.stringify(body), { httpMetadata: { contentType: 'application/json' }, onlyIf: etag ? { etagMatches: etag } : undefined });"],
  'no-readback': ["  return (await same()) === 'same' ? 'stored' : 'read-back differs';", "  return 'stored';"],
  'overwrite': ["  if (had !== 'absent') return 'stored copy differs';", ''],
  'no-lock': ["  const lock = await craftLock(env, 'run ' + new Date(ms).toISOString());", "  const lock = { etag: 'none' };"],
  'release-unowned': ["JSON.stringify({ released: true, at: nowIso() }), { httpMetadata: { contentType: 'application/json' }, onlyIf: { etagMatches: lock.etag } });", "JSON.stringify({ released: true, at: nowIso() }), { httpMetadata: { contentType: 'application/json' } });"],
  'parker-cancels-study': ["  const study = pk.backoff ? 'not attempted: backing off after ' + pk.reason", "  const study = !pk.ok ? 'not attempted: backing off after ' + pk.reason"],
  'no-backoff': ["got.http === 0 || got.http === 429 || got.http >= 500);", "false);"],
  'no-tag-check': ["  if (!target_source || !revised) return { ok: false, reason: 'no source tag or data sheet revision in response', detail: `${target_source} / ${revised}` };", ''],
  'parker-throw-escapes': ["  let pk; try { pk = await craftParker(env, ms); } catch (e) { pk = { ok: false, reason: 'parker internal error', http: 0, detail: String(e).slice(0, 160), backoff: false }; }", "  const pk = await craftParker(env, ms);"],
  'pointer-throws': ["  let up; try { up = await craftUpdate(env, c => (c.current && c.current.retrieved_at >= retrieved_at) ? null : { ...craftEmpty(), current: brief, previous: c.current || null }); }\n  catch (e) { return bad('parker pointer update failed', 200, String(e).slice(0, 160)); }", "  const up = await craftUpdate(env, c => (c.current && c.current.retrieved_at >= retrieved_at) ? null : { ...craftEmpty(), current: brief, previous: c.current || null });"],
  'study-after-lock-loss': ["    : !await craftHolds(env, lock) ? 'not attempted: this run no longer holds the lock'\n", ''],
  'parallel': ["    : await craftStudy(env, ms).catch(", "    : await craftStudyEarly.catch("],   // with the line below: the LRO request starts before Parker's answer
  'lro-published': ["    modifications: 'Positions rounded to 1 km. Velocities not carried.',", "    modifications: 'Positions rounded to 1 km. Velocities not carried.', lro: await env.R2.list({ prefix: SKYCRAFT.STUDY }),"],
  'any-snapshot': ['  const x = [cur.current, cur.previous].find(f => f && f.id === p[2]);\n  if (!x) return none(404, \'not found\');\n  let buf; try { const o = await env.R2.get(x.key);', "  const x = [cur.current, cur.previous].find(f => f && f.id === p[2]) || { key: SKYCRAFT.SNAP + p[2] + '.json' };\n  let buf; try { const o = await env.R2.get(x.key);"],
  'no-integrity': ["  if (buf.byteLength !== x.bytes || await sha256Bytes(buf) !== x.sha256) return none(503, 'integrity');\n  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': SKYCRAFT.CACHE_FILE,", "  return new Response(buf, { headers: { 'Content-Type': 'application/json', 'Cache-Control': SKYCRAFT.CACHE_FILE,"],
  'probe-two': ["text = await r.text(); } catch (e) { err = String(e).slice(0, 200); }", "text = await r.text(); await fetch(url, { headers: { 'User-Agent': SKYCRAFT.UA } }); } catch (e) { err = String(e).slice(0, 200); }"],
  'generic-down': ["    else if (layer === 'skycraft') { try { await craftFail(env, ms, 'internal error', 0, note); } catch (_) {} }", ''],
  'no-ua': ["  let r; try { r = await fetch(url, { headers: { 'User-Agent': SKYCRAFT.UA }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(SKYCRAFT.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: 'request failed'", "  let r; try { r = await fetch(url, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(SKYCRAFT.TIMEOUT_MS) }); } catch (e) { return { ok: false, reason: 'request failed'"],
  'retry': ["  if (r.status !== 200) { try { await r.body.cancel(); } catch (_) {} return { ok: false, reason: 'http error', http: r.status }; }", "  if (r.status !== 200) { r = await fetch(url, { headers: { 'User-Agent': SKYCRAFT.UA } }); if (r.status !== 200) return { ok: false, reason: 'http error', http: r.status }; }"],
  'cat-unpinned': ["  if (buf.byteLength !== pin.bytes || await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');", ''],
};
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
if (BREAK) {
  if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  const b = BREAKS[BREAK]; if (!src.includes(b[0])) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]);
  if (BREAK === 'parallel') { const a = "  let pk; try { pk = await craftParker(env, ms); }"; if (!src.includes(a)) { console.log('FAIL  break did not apply: parallel'); process.exit(1); }
    src = src.replace(a, "  const craftStudyEarly = craftStudy(env, ms);\n" + a); }
}
const tmp = path.join(os.tmpdir(), `worker-craft-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); process.exit(1); });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : ''}`); } };
const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const S = W.SKYCRAFT, DAY = 86400000, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------- a Horizons answer in the service's own layout (checked against the archived real answers in section R)
const hzLine = ms => { const d = new Date(ms); const p = n => String(n).padStart(2, '0'); return `${(2440587.5 + ms / DAY).toFixed(9)} = A.D. ${d.getUTCFullYear()}-${MON[d.getUTCMonth()]}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00.0000 UTC`; };
const PSP_TABLE = `  Name                                      Start (TDB)         End (TDB) \n  ---------------------------------------  -----------------  -----------------\n  spp_nom_20180812_20251001_v041_RO8       2018-Aug-12 08:17  2025-Jun-25 06:00\n  spp_pred_20260902_20270120_od267_V0.1    2026-Sep-02 00:00  2026-Sep-30 00:00\n  spp_pred_20260930_20270217_od268_v001    2026-Sep-30 00:00  2027-Feb-17 00:00\n  spp_nom_20180812_20300101_v044_PostV7    2027-Jan-20 00:00  2030-Jan-01 00:00\n`;
const LRO_TABLE = `  Trajectory name                   Start (TDB)          Stop (TDB)\n  ----------------------------   -----------------   -----------------\n  Reconstructed trajectory       2009-Jun-18 22:16   2026-Jun-15 00:01\n  Concatenated predict updates   2026-Jun-15 00:01   2026-Oct-07 00:01\n  558day_20261007_01             2026-Oct-07 00:01   2028-Apr-16 23:59\n`;
function answer(kind, times, o = {}) {
  const psp = kind === 'psp';
  const pos = o.pos || (psp ? (ms, i) => [8e7 + i * 1000, -2e7, -1.5e7] : (ms, i) => [1200 + i, 40, 1350]);
  const sheet = psp ? ` Revised: ${o.revised || 'Nov 03, 2026'}         Parker Solar Probe / Sun                    -96\n\n SPACECRAFT TRAJECTORY \n  ${o.statement || 'Fit to post-launch tracking data through 2026-Sep-29. Reference planning \n  trajectory for subsequent times.'}\n\n${o.table || PSP_TABLE}`
    : ` Revised: Oct 07, 2026          LRO Spacecraft / (Moon)                     -85\n\n SPACECRAFT TRAJECTORY: \n  Final reconstructed trajectory segments are from PDS. Preliminary "tag-up" \n  solutions begin 2026-Jun-15, with prediction after 2026-Oct-06.\n\n${LRO_TABLE}`;
  const head = `Target body name: ${o.target || (psp ? 'Parker Solar Probe (spacecraft) (-96) {source: psp_merged}' : 'LRO (spacecraft) (-85)          {source: LRO_merged}')}\nCenter body name: ${psp ? 'Sun (10)                        {source: DE441}' : 'Moon (301)                      {source: DE441}'}\nCenter-site name: BODY CENTER\nOutput units    : KM-S\nOutput type     : GEOMETRIC cartesian states\nReference frame : ${o.frame || 'ICRF'}\n`;
  const rows = times.map((ms, i) => { const p = pos(ms, i); return `${hzLine(ms)}\n X = ${p[0].toExponential(15)} Y = ${p[1].toExponential(15)} Z = ${p[2].toExponential(15)}\n VX= 1.0E+00 VY= 1.0E+00 VZ= 1.0E+00`; }).join('\n');
  return JSON.stringify({ signature: { source: 'NASA/JPL Horizons API', version: o.version || '1.2' }, result: `*******\n${sheet}*******************************************************************************\n\n\n*******\nEphemeris / API_USER\n*******\n${head}*******\n$$SOE\n${rows}\n$$EOE\n*******\n` });
}
const timesOf = url => { const u = decodeURIComponent(url), g = k => (new RegExp(k + "='([^']*)'").exec(u) || [])[1], T = s => Date.parse(s.replace(' ', 'T') + ':00Z');
  if (u.includes('TLIST=')) return /TLIST=([^&]*)/.exec(u)[1].split(',').map(x => T(x.replace(/'/g, '')));
  const a = T(g('START_TIME')), b = T(g('STOP_TIME')), st = parseInt(g('STEP_SIZE')) * 60000, out = []; for (let t = a; t <= b; t += st) out.push(t); return out; };

// ---------- fakes
function world(o = {}) {
  const store = new Map(), runs = [], reqs = [];
  const w = { store, runs, reqs, order: [], hold: null, conflicts: 0, deletes: 0, putFail: null, corruptRead: null, inFlight: 0, maxInFlight: 0, pointerPuts: [], psp: {}, lro: {}, status: 200, lroStatus: 200, throwFetch: false, delay: 0, onPointerPut: null, ...o };
  const etagOf = buf => crypto.createHash('md5').update(buf).digest('hex');
  const R2 = {
    async put(key, body, opts = {}) {
      if (w.putFail && key.includes(w.putFail)) throw new Error('R2 put failed (test)');
      const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);
      if (key === S.POINTER) { w.pointerPuts.push(opts.onlyIf || null); if (w.onPointerPut) { const f = w.onPointerPut; w.onPointerPut = null; await f(); } }
      if (opts.onlyIf) { const had = store.get(key); const refused = opts.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== opts.onlyIf.etagMatches); if (refused) { w.conflicts++; return null; } }
      store.set(key, { buf, opts, etag: etagOf(buf) }); return { key, etag: etagOf(buf) }; },
    async get(key) { const o = store.get(key); if (!o) return null; let buf = o.buf; if (w.corruptRead && key.includes(w.corruptRead)) { buf = Buffer.from(buf); buf[buf.length - 3] ^= 0xff; }
      return { etag: o.etag, async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }, async json() { return JSON.parse(buf.toString('utf8')); }, async text() { return buf.toString('utf8'); } }; },
    async head(key) { const o = store.get(key); return o ? { size: o.buf.length, etag: o.etag } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; },
    async delete(key) { w.deletes++; store.delete(key); },
  };
  const stmt = sql => ({ bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], status: a[3], http: a[4], records: a[5], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } });
  w.env = { R2, DB: { prepare: stmt, async batch() { return []; } }, SKYCRAFT_ENABLED: '1', ADMIN_KEY: 'k' };
  w.fetch = async (url, init) => { const u = String(url);
    if (!u.startsWith('https://ssd.jpl.nasa.gov/api/horizons.api')) throw new Error('unexpected fetch ' + u);
    const lro = u.includes("COMMAND='-85'"); reqs.push({ u, ua: init && init.headers && init.headers['User-Agent'], signal: !!(init && init.signal), lro });
    w.inFlight++; w.maxInFlight = Math.max(w.maxInFlight, w.inFlight); w.order.push(lro ? 'lro:start' : 'psp:start');
    try { await new Promise(r => setTimeout(r, w.delay || 1)); if (w.hold) await w.hold(u, lro);
      if (w.throwFetch) throw new Error('network down (test)');
      const st = lro ? w.lroStatus : w.status; if (st !== 200) return new Response('no', { status: st });
      if (!u.includes("MAKE_EPHEM='YES'")) return new Response(JSON.stringify({ signature: { version: w.psp.version || '1.2', source: 'NASA/JPL Horizons API' }, result: ' Revised: Nov 03, 2026  Parker Solar Probe / Sun  -96\n' }), { status: 200, headers: { 'content-type': 'application/json' } });
      const body = (lro ? w.lro.body : w.psp.body) || answer(lro ? 'lro' : 'psp', (lro ? w.lro.times : w.psp.times) || timesOf(u), lro ? w.lro : w.psp);
      return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    } finally { w.inFlight--; w.order.push(lro ? 'lro:end' : 'psp:end'); } };
  w.lock = () => store.has(S.LOCK) ? JSON.parse(store.get(S.LOCK).buf.toString()) : null;
  w.ptr = () => store.has(S.POINTER) ? JSON.parse(store.get(S.POINTER).buf.toString()) : null;
  w.keys = p => [...store.keys()].filter(k => k.startsWith(p)).sort();
  return w;
}
const realFetch = globalThis.fetch, use = w => { globalThis.fetch = w.fetch; return w; };
const NOW = Date.UTC(2026, 10, 13, 5, 7), at = h => Date.UTC(2026, 10, 13, h, 7);
const get = async (w, p) => { const r = await W.default.fetch(new Request('https://hub.test' + p), w.env); const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch (_) {} return { status: r.status, j, buf, h: r.headers }; };
// the clock: retrieval times come from new Date(); keep them distinct and controllable
const RealDate = Date; let clock = null;
const setClock = ms => { clock = ms; }; 
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(clock === null ? RealDate.now() : clock); } static now() { return clock === null ? RealDate.now() : clock; } };

// ---------- R. the parser against the archived REAL Horizons answers
{ const P = fs.readFileSync(path.join(HERE, 'skycraft/raw/horizons-psp-20241222-20241227-10m.json'), 'utf8'), z = W.hzParse(P, S.PARKER);
  ok('R real Parker answer parses', z.ok && z.rows.length === 721 && z.version === '1.2', z.reason);
  ok('R Parker: target source tag and data-sheet revision read from the same response', z.target_source === 'psp_merged' && z.revised === 'Nov 03, 2026', [z.target_source, z.revised]);
  ok('R Parker: ten named segments, both date spellings read', z.table.length === 10 && z.table.some(s => s.name === 'spp_pred_20260526_20261013_od263_V0.1' && s.start === '2026 MAY 26 00:00'), z.table.map(s => s.name));
  ok('R Parker: the statement is the tracking-fit sentence, fit through 29 Sep 2026', W.hzFitThrough(z.statement) === Date.UTC(2026, 8, 30), z.statement);
  ok('R Parker: 24 Dec 2024 12:00 lies in spp_nom_…_RO8', z.table[W.hzSegmentOf(Date.UTC(2024, 11, 24, 12), z.table)].name === 'spp_nom_20180812_20251001_v041_RO8');
  ok('R Parker: 13 Nov 2026 00:00 lies in spp_pred_…_od268_v001 and is after the fit', z.table[W.hzSegmentOf(Date.UTC(2026, 10, 13), z.table)].name === 'spp_pred_20260930_20270217_od268_v001' && Date.UTC(2026, 10, 13) >= W.hzFitThrough(z.statement));
  ok('R an instant on a segment edge names no segment', W.hzSegmentOf(Date.UTC(2026, 8, 30) - 69184, z.table) === -1 && W.hzSegmentOf(Date.UTC(2026, 8, 30) + 3600000, z.table) >= 0);
  const cat = JSON.parse(fs.readFileSync(path.join(HERE, 'skycraft/catalogue/craft-sun-2024-12-R1.json'), 'utf8'));
  ok('R Parker rows equal the dated example (rounded to 1 km)', z.rows.every((r, i) => r.p.every((c, k) => Math.round(c) === cat.xyz_km[3 * i + k])));
  ok('R the hub view matrix is the dated example\'s, number for number', JSON.stringify(S.VIEW_SUN) === JSON.stringify(cat.frame.view.rows));
  const L = fs.readFileSync(path.join(HERE, 'skycraft/raw/horizons-lro-check-20260610.json'), 'utf8'), y = W.hzParse(L, S.LRO);
  ok('R real LRO answer parses; names with spaces', y.ok && y.rows.length === 3 && y.table.map(s => s.name).join('|') === 'Reconstructed trajectory|Concatenated predict updates|558day_20261007_01', y.reason || y.table);
  ok('R LRO: 10 June 2026 is in the reconstructed span; 13 Nov 2026 in the 558-day prediction', y.table[W.hzSegmentOf(Date.UTC(2026, 5, 10, 12), y.table)].name === 'Reconstructed trajectory' && y.table[W.hzSegmentOf(Date.UTC(2026, 10, 13, 12), y.table)].name === '558day_20261007_01');
  ok('R the archived answer with its source tag removed is refused', W.hzParse(P.replace(' {source: psp_merged}', ''), S.PARKER).reason === 'no source tag or data sheet revision in response');
  ok('R the archived answer with its revision line removed is refused', W.hzParse(P.replace(/Revised: Nov 03, 2026/, 'Updated  Nov 03  2026'), S.PARKER).reason === 'no source tag or data sheet revision in response');
  ok('R the archived sheet lists two segments for 20 Jan – 17 Feb 2027: samples there are withheld; before and after are named', W.hzSegmentOf(Date.UTC(2027, 1, 1, 12), z.table) === -1 && W.hzSegmentOf(Date.UTC(2027, 0, 20, 0), z.table) === -1 && z.table[W.hzSegmentOf(Date.UTC(2027, 0, 19, 12), z.table)].name === 'spp_pred_20260930_20270217_od268_v001' && z.table[W.hzSegmentOf(Date.UTC(2027, 1, 18), z.table)].name === 'spp_nom_20180812_20300101_v044_PostV7');
  ok('R a Parker answer is refused as LRO', W.hzParse(P, S.LRO).reason === 'wrong object in response');
  const B = JSON.parse(fs.readFileSync(path.join(HERE, 'skycraft/BUILD.json'), 'utf8')).catalogues;
  ok('R Worker pins = generator record', Object.entries(W.CRAFT_REVISIONS).every(([k, p]) => B[k] && B[k].sha256 === p.fileSha256 && B[k].bytes === p.bytes && sha(fs.readFileSync(path.join(HERE, 'skycraft', B[k].file))) === p.fileSha256));
  const page = fs.readFileSync(path.join(HERE, '..', 'craft.js'), 'utf8');
  ok('R the page pins the same two files', Object.values(W.CRAFT_REVISIONS).every(p => page.includes(`rev: '${p.revision}', sha: '${p.fileSha256}'`)));
  ok('R the synthetic answer has the real layout (same parser, same fields)', W.hzParse(answer('psp', [NOW]), S.PARKER).ok && W.hzParse(answer('lro', [NOW]), S.LRO).ok);
}
// ---------- A. gate and schedule, through the real hourly job
{ const w = use(world()); delete w.env.SKYCRAFT_ENABLED; const stub = w.fetch; w.fetch = async (u, i) => String(u).includes('horizons') ? stub(u, i) : (() => { throw new Error('offline (test)'); })(); use(w);
  const r = await W.JOBS.hourly(w.env, at(5), false);
  ok('A gate unset: no Horizons request, reported as not scheduled', w.reqs.length === 0 && /not scheduled/.test(r.skycraft), r.skycraft);
  w.env.SKYCRAFT_ENABLED = '1'; const r7 = await W.JOBS.hourly(w.env, at(7), false);
  ok('A gate set, 07 UTC: skipped, no request', w.reqs.length === 0 && /skipped/.test(r7.skycraft), r7.skycraft);
  setClock(at(5)); const r5 = await W.JOBS.hourly(w.env, at(5), false); setClock(null);
  ok('A gate set, 05 UTC: runs; exactly two requests', w.reqs.length === 2 && r5.skycraft === 'skycraft:ran' && !!(w.ptr() && w.ptr().current), [w.reqs.length, r5.skycraft]);
  ok('A no generic envelope written for skycraft', !w.store.has('latest/skycraft.json') && !w.store.has('latest-cells/skycraft.json'));
}
// ---------- B. a good run
let goodId = null;
{ const w = use(world()); setClock(NOW); const r = await W.collectSkycraft(w.env, NOW); setClock(null);
  const p = w.ptr(), snap = p && JSON.parse(w.store.get(p.current.key).buf.toString());
  ok('B published', /^skycraft:published /.test(r) && p && p.current && !p.previous && !p.last_attempt, r);
  ok('B two requests, one at a time, Parker first; LRO only after Parker\'s answer ended', w.reqs.length === 2 && w.maxInFlight === 1 && w.order.join() === 'psp:start,psp:end,lro:start,lro:end', w.order);
  ok('B both carry the application User-Agent with product, version and contact, and a timeout', w.reqs.every(q => q.ua === S.UA && q.signal) && /^mother-earth-collector\/\d+\.\d+\.\d+ \(.*github\.com\/TheOneTheOnlyTheChad\/mother-earth.*contact/.test(S.UA), w.reqs.map(q => q.ua));
  const u = decodeURIComponent(w.reqs[0].u);
  ok('B Parker request: Sun-centred ICRF geometric vectors with the data sheet, yesterday 00:00 → +7 d hourly', ["COMMAND='-96'", "CENTER='500@10'", "OBJ_DATA='YES'", "REF_SYSTEM='ICRF'", "VEC_CORR='NONE'", "TIME_TYPE='UT'", "START_TIME='2026-11-12 00:00'", "STOP_TIME='2026-11-20 00:00'", "STEP_SIZE='60 m'", 'format=json'].every(x => u.includes(x)), u);
  ok('B snapshot: 193 hourly samples, UTC, km, view matrix, radius', snap.time.n === 193 && snap.xyz_km.length === 579 && snap.time.start === '2026-11-12T00:00:00Z' && snap.time.end === '2026-11-20T00:00:00Z' && snap.body_radius_km === 695700 && snap.frame.view.rows.length === 3);
  ok('B snapshot names the solution from the SAME response', snap.solution.same_response_as_vectors === true && snap.solution.data_sheet_revised === 'Nov 03, 2026' && snap.solution.target_source === 'psp_merged' && /Reference planning trajectory/.test(snap.solution.statement) && snap.solution.fit_through_utc === '2026-09-29');
  ok('B every sample has its segment and fit flag', snap.solution.segment_of.length === 193 && snap.solution.segment_of.every(i => i === 2) && snap.solution.within_tracking_fit.every(x => x === false) && snap.solution.segments[0].name === 'spp_pred_20260930_20270217_od268_v001');
  ok('B the snapshot id names its content; stored bytes match the pointer', p.current.id.endsWith(sha(w.store.get(p.current.key).buf).slice(0, 16)) && sha(w.store.get(p.current.key).buf) === p.current.sha256 && p.current.bytes === w.store.get(p.current.key).buf.length);
  ok('B raw answer kept, hash recorded', w.keys(S.RAW).length === 1 && sha(w.store.get(p.current.raw.key).buf) === p.current.raw.sha256 && snap.source.response_sha256 === p.current.raw.sha256);
  ok('B every pointer write was conditional', w.pointerPuts.length >= 1 && w.pointerPuts.every(c => c && (c.etagMatches || c.etagDoesNotMatch === '*')), w.pointerPuts);
  ok('B the lock is released (marked, not deleted)', w.lock() && w.lock().released === true, w.lock());
  ok('B run recorded ok', w.runs.length === 1 && w.runs[0].layer === 'skycraft' && w.runs[0].status === 'ok' && w.runs[0].records === 193, w.runs);
  // LRO study
  const idxKey = w.keys(S.STUDY).find(k => k.endsWith('-index.json')), idx = JSON.parse(w.store.get(idxKey).buf.toString()), lu = decodeURIComponent(w.reqs[1].u);
  ok('B LRO request: Moon-centred, 41 listed epochs', ["COMMAND='-85'", "CENTER='500@301'", 'TLIST='].every(x => lu.includes(x)) && timesOf(w.reqs[1].u).length === 41, lu.slice(0, 300));
  ok('B study epochs: D 00:00 plus four instants at each of ten leads incl. 37 days', idx.epochs.length === 41 && idx.epochs[0].utc === '2026-11-13T00:00:00Z' && [0, 1, 3, 7, 14, 21, 30, 37, 45, 60].every(L => idx.epochs.filter(e => e.lead_days === L && e.instant !== '00:00').length === 4) && idx.epochs.some(e => e.utc === '2026-12-20T12:30:00Z'));
  ok('B signed lead from the ACTUAL retrieval; the past 00:00 sample is not a forward forecast', idx.epochs[0].signed_lead_s === -(5 * 3600 + 7 * 60) && idx.epochs[0].forward === false && idx.epochs[1].forward === true && idx.epochs[1].signed_lead_s === 6 * 3600 + 53 * 60, idx.epochs.slice(0, 2));
  ok('B study index keeps sheet revision, table and segment per epoch; marked unpublished', idx.data_sheet_revised === 'Oct 07, 2026' && idx.table.length === 3 && idx.epochs.every(e => e.segment === '558day_20261007_01') && idx.published === false);
  ok('B same fixed instants on the next day\'s capture overlap exactly', (() => { const a = W.craftStudyEpochs(NOW).map(e => e.ms), b = W.craftStudyEpochs(NOW + DAY).map(e => e.ms); return a.filter(x => b.includes(x)).length >= 4; })());
  // serving
  const meta = await get(w, '/snapshot/skycraft/meta');
  ok('B /meta: pointer without storage keys, no-store, nothing about LRO', meta.status === 200 && meta.j.current.id === p.current.id && meta.j.current.key === undefined && meta.j.current.raw.key === undefined && /no-store/.test(meta.h.get('cache-control')) && !/lro|study/i.test(JSON.stringify(meta.j)), meta.j);
  const file = await get(w, '/snapshot/skycraft/' + p.current.id);
  ok('B the snapshot is served byte for byte, immutable', file.status === 200 && sha(file.buf) === p.current.sha256 && /immutable/.test(file.h.get('cache-control')));
  ok('B the published snapshot holds nothing about LRO', !/lro|-85|Moon \(301\)|study/i.test(file.buf.toString()));
  ok('B study objects are not reachable by any route', (await get(w, '/snapshot/skycraft/' + path.basename(idxKey, '.json'))).status === 404 && (await get(w, '/snapshot/skycraft/study')).status === 404);
  ok('B an id that is not current or previous → 404', (await get(w, '/snapshot/skycraft/20200101T000000Z-0000000000000000')).status === 404 && (await get(w, '/snapshot/skycraft/' + p.current.id + '/x')).status === 404);
  w.corruptRead = 'skycraft/snap/'; ok('B stored snapshot altered → 503 integrity', (await get(w, '/snapshot/skycraft/' + p.current.id)).j.reason === 'integrity'); w.corruptRead = null;
  goodId = p.current.id;
  // a second, later run keeps the first as previous
  setClock(NOW + DAY); await W.collectSkycraft(w.env, NOW + DAY); setClock(null); const p2 = w.ptr();
  ok('B next day: new current, yesterday kept as previous and still served', p2.current.id !== goodId && p2.previous.id === goodId && (await get(w, '/snapshot/skycraft/' + goodId)).status === 200);
  ok('B nothing is ever deleted', w.deletes === 0 && w.keys(S.RAW).length === 2 && w.keys(S.SNAP).length === 2, w.deletes);
  ok('B the snapshot records how many samples it withholds', JSON.parse(w.store.get(w.ptr().current.key).buf.toString()).solution.withheld_samples === 0 && w.ptr().current.withheld_samples === 0);
}
// ---------- C. failures never move the snapshot
async function failing(name, setup, expect, extra) {
  const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW); const before = w.ptr().current.id; w.reqs.length = 0; w.runs.length = 0;
  setup(w); setClock(NOW + DAY); const r = await W.collectSkycraft(w.env, NOW + DAY); setClock(null); const p = w.ptr();
  ok(`C ${name}: run is down with a fixed phrase`, r.startsWith('skycraft:down ' + expect + '; lro study ') && w.runs[0].status === 'down', [r, w.runs]);
  ok(`C ${name}: the snapshot did not move; last_attempt recorded`, p.current.id === before && p.last_attempt && p.last_attempt.reason === expect && p.last_attempt.consecutive_failures === 1, p);
  ok(`C ${name}: no retry inside the run`, w.reqs.filter(q => !q.lro).length === 1, w.reqs.length);
  ok(`C ${name}: the old snapshot is still served`, (await get(w, '/snapshot/skycraft/' + before)).status === 200);
  if (extra) await extra(w, p);
  return w;
}
const noStudy = why => async w => ok(`C ${why}: the whole run backs off — no LRO request, nothing stored for the study that day`, w.reqs.every(q => !q.lro) && w.keys(S.STUDY).length === 2 && /not attempted: backing off/.test(w.runs[0].note), [w.reqs.length, w.runs[0].note]);
const withStudy = why => async w => ok(`C ${why}: a Parker-only failure does not cancel the LRO capture (one LRO request, stored)`, w.reqs.filter(q => q.lro).length === 1 && w.keys(S.STUDY).length === 4 && /lro study stored 41 epochs/.test(w.runs[0].note) && w.maxInFlight === 1, [w.reqs.length, w.keys(S.STUDY).length, w.runs[0].note]);
await failing('HTTP 503', w => { w.status = 503; }, 'parker http error', noStudy('HTTP 503'));
await failing('HTTP 429', w => { w.status = 429; }, 'parker http error', noStudy('HTTP 429'));
await failing('network error', w => { w.throwFetch = true; }, 'parker request failed', noStudy('network error'));
await failing('HTTP 422', w => { w.status = 422; }, 'parker http error', withStudy('HTTP 422'));
await failing('no source tag', w => { w.psp.target = 'Parker Solar Probe (spacecraft) (-96)'; }, 'parker no source tag or data sheet revision in response', withStudy('no source tag'));
await failing('API version changed', w => { w.psp.version = '1.3'; }, 'parker api version changed', withStudy('unreadable Parker answer'));
await failing('wrong object', w => { w.psp.target = 'Solar Orbiter (spacecraft) (-144) {source: x}'; }, 'parker wrong object in response');
await failing('wrong frame', w => { w.psp.frame = 'Ecliptic of J2000.0'; }, 'parker unexpected response settings');
await failing('a row missing', w => { w.psp.times = timesOf("x?START_TIME='2026-11-13 00:00'&STOP_TIME='2026-11-20 23:00'&STEP_SIZE='60 m'"); }, 'parker returned times differ from the request');
await failing('a neighbouring time substituted', w => { const t = []; for (let i = 0; i < 193; i++) t.push(Date.UTC(2026, 10, 13) + i * 3600000 + (i === 50 ? 60000 : 0)); w.psp.times = t; }, 'parker returned times differ from the request');
await failing('distance out of range', w => { w.psp.pos = () => [9e8, 0, 0]; }, 'parker distance out of range');
await failing('non-finite coordinate', w => { w.psp.body = answer('psp', timesOf("x?START_TIME='2026-11-13 00:00'&STOP_TIME='2026-11-21 00:00'&STEP_SIZE='60 m'")).replace(/X = \S+/, 'X = NaN'); }, 'parker vector table unreadable');
await failing('statement not the known sentence', w => { w.psp.statement = 'Trajectory updated.'; }, 'parker data sheet statement not recognised');
await failing('no table', w => { w.psp.table = '  (none)\n'; }, 'parker data sheet unreadable');
await failing('not JSON', w => { w.psp.body = '<html>busy</html>'; }, 'parker response unreadable');
await failing('snapshot write fails', w => { w.putFail = 'skycraft/snap/'; }, 'snapshot write failed', withStudy('publication failure'));
await failing('snapshot read-back differs', w => { w.corruptRead = 'skycraft/snap/20261114'; }, 'snapshot read-back differs', async w => { w.corruptRead = null; });
// a sample on a segment edge is published as "no segment", never mislabelled
{ const w = use(world()); w.psp.table = PSP_TABLE.replace('2026-Sep-30 00:00  2027-Feb-17 00:00', '2026-Sep-30 00:00  2026-Nov-14 00:00').replace('2027-Jan-20 00:00  2030-Jan-01 00:00', '2026-Nov-14 00:00  2030-Jan-01 00:00');
  setClock(NOW); await W.collectSkycraft(w.env, NOW); setClock(null); const snap = JSON.parse(w.store.get(w.ptr().current.key).buf.toString()), k = 48;   // 14 Nov 00:00 UTC
  ok('C edge: the sample at a segment change has segment −1; neighbours are named on each side', snap.solution.segment_of[k] === -1 && snap.solution.segment_of[k - 1] === 2 && snap.solution.segment_of[k + 1] === 3, snap.solution.segment_of.slice(k - 2, k + 3)); }
// GPT, 13 Nov (round 2 review): a pointer that cannot be READ or WRITTEN during publication is a Parker outcome — LRO is still captured, the last good snapshot stays current
for (const [how, arm] of [['read', w => { const g = w.env.R2.get; w.env.R2.get = async k => { if (k === S.POINTER) throw new Error('R2 pointer read failed (test)'); return g(k); }; return () => { w.env.R2.get = g; }; }],
                          ['write', w => { const p = w.env.R2.put; w.env.R2.put = async (k, b, o) => { if (k === S.POINTER) throw new Error('R2 pointer write failed (test)'); return p(k, b, o); }; return () => { w.env.R2.put = p; }; }]]) {
  const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW); const before = w.ptr().current.id; w.reqs.length = 0; w.runs.length = 0;
  const disarm = arm(w); setClock(NOW + DAY); const r = await W.JOBS.skycraft(w.env, NOW + DAY, true); setClock(null); disarm();
  ok(`C pointer ${how} fails: recorded as a Parker failure, not an internal error`, w.runs.length === 1 && w.runs[0].status === 'down' && /^parker pointer update failed/.test(w.runs[0].note), [r, w.runs]);
  ok(`C pointer ${how} fails: the LRO capture still runs (two requests, one at a time) and is stored`, w.reqs.length === 2 && w.reqs[1].lro && w.maxInFlight === 1 && w.keys(S.STUDY).length === 4 && /lro study stored 41 epochs/.test(w.runs[0].note), [w.reqs.length, w.keys(S.STUDY).length, w.runs[0].note]);
  ok(`C pointer ${how} fails: the last good Parker snapshot stays current and is still served`, w.ptr().current.id === before && (await get(w, '/snapshot/skycraft/' + before)).status === 200 && w.lock().released === true, w.ptr());
}
{ // anything else Parker's part throws is still Parker's outcome: LRO captured, snapshot kept
  const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW); const before = w.ptr().current.id; w.reqs.length = 0; w.runs.length = 0;
  const h = Math.hypot; Math.hypot = () => { Math.hypot = h; throw new Error('boom (test)'); };
  setClock(NOW + DAY); await W.JOBS.skycraft(w.env, NOW + DAY, true); setClock(null); Math.hypot = h;
  ok('C Parker part throws: its own failure; LRO still captured; snapshot kept', w.runs.length === 1 && /^parker internal error/.test(w.runs[0].note) && /lro study stored 41 epochs/.test(w.runs[0].note) && w.reqs.length === 2 && w.ptr().current.id === before, [w.runs, w.reqs.length]); }
{ // and the LRO part throwing does not undo a published Parker snapshot
  const w = use(world()); const p = w.env.R2.put; w.env.R2.put = async (k, b, o) => { if (k.startsWith(S.STUDY)) { const e = new Error('boom (test)'); throw e; } return p(k, b, o); };
  const g = w.env.R2.get; w.env.R2.get = async k => { if (k.startsWith(S.STUDY)) throw new Error('boom (test)'); return g(k); };
  setClock(NOW); const r = await W.JOBS.skycraft(w.env, NOW, true); setClock(null);
  ok('C LRO part fails in storage: Parker is published; run recorded degraded, not an internal error', !!w.ptr().current && w.runs.length === 1 && w.runs[0].status === 'degraded' && !/^internal error/.test(w.runs[0].note), [r, w.runs]); }
// an error nothing anticipates (here: the lock object cannot be written): still never the generic writeDown
{ const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW); const before = w.ptr().current.id; w.runs.length = 0; w.reqs.length = 0;
  w.putFail = 'skycraft/lock.json'; setClock(NOW + DAY); const r = await W.JOBS.skycraft(w.env, NOW + DAY, true); setClock(null); w.putFail = null;
  ok('C uncaught: recorded as an internal error; no Horizons request; no generic envelope; pointer keeps the snapshot', w.runs.some(x => x.layer === 'skycraft' && x.status === 'down' && /^internal error/.test(x.note)) && w.reqs.length === 0 && ![...w.store.keys()].some(k => k.startsWith('latest')) && w.ptr().current.id === before, [r, w.runs, [...w.store.keys()].filter(k => k.startsWith('latest'))]); }
// LRO study failure: Parker still published, run degraded
{ const w = use(world()); w.lroStatus = 500; setClock(NOW); const r = await W.collectSkycraft(w.env, NOW); setClock(null);
  ok('C LRO study fails: Parker is still published; run recorded degraded; no study object', /published/.test(r) && w.ptr().current && w.runs[0].status === 'degraded' && w.keys(S.STUDY).length === 0, [r, w.runs]); }
// ---------- D. two runs at once, and the pointer race
{ const w = use(world()); w.delay = 20; setClock(NOW); const [a, b] = await Promise.all([W.collectSkycraft(w.env, NOW), W.collectSkycraft(w.env, NOW)]); setClock(null);
  ok('D two runs at once: one talks to Horizons, the other makes no request', [a, b].filter(x => x === 'skycraft:busy').length === 1 && w.reqs.length === 2 && w.maxInFlight === 1, [a, b, w.reqs.length, w.maxInFlight]); }
{ const w = use(world()); w.store.set(S.LOCK, { buf: Buffer.from(JSON.stringify({ who: 'dead run', at: new RealDate(NOW - 11 * 60000).toISOString() })), opts: {}, etag: 'old' });
  setClock(NOW); const r = await W.collectSkycraft(w.env, NOW); setClock(null); ok('D a lock older than ten minutes is taken over', /published/.test(r), r);
  const w2 = use(world()); w2.store.set(S.LOCK, { buf: Buffer.from(JSON.stringify({ who: 'live run', at: new RealDate(NOW - 60000).toISOString() })), opts: {}, etag: 'x' });
  setClock(NOW); const r2 = await W.collectSkycraft(w2.env, NOW); setClock(null); ok('D a fresh lock is respected: no request', r2 === 'skycraft:busy' && w2.reqs.length === 0 && w2.store.has(S.LOCK), r2); }
{ // a later run publishes while this one is paused before its pointer write: the older one must not win
  const w = use(world()); const newer = { ...JSON.parse(JSON.stringify({ schema: 1, layer: 'skycraft' })), current: { id: 'NEWER', key: 'skycraft/snap/NEWER.json', retrieved_at: new RealDate(NOW + 3600000).toISOString(), bytes: 1, sha256: 'x' }, previous: null, last_attempt: null };
  w.onPointerPut = async () => { w.store.set(S.POINTER, { buf: Buffer.from(JSON.stringify(newer)), opts: {}, etag: 'raced' }); };
  setClock(NOW); const r = await W.collectSkycraft(w.env, NOW); setClock(null);
  ok('D race: an older run does not replace a newer published snapshot', w.ptr().current.id === 'NEWER' && /superseded/.test(r), [r, w.ptr().current.id]); }
{ // the same race when a pointer already existed (compare-and-swap path)
  const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW);
  const newer = { schema: 1, layer: 'skycraft', current: { id: 'NEWER', key: 'skycraft/snap/NEWER.json', retrieved_at: new RealDate(NOW + 2 * DAY).toISOString(), bytes: 1, sha256: 'x' }, previous: null, last_attempt: null };
  w.onPointerPut = async () => { w.store.set(S.POINTER, { buf: Buffer.from(JSON.stringify(newer)), opts: {}, etag: 'raced' }); };
  setClock(NOW + DAY); const r = await W.collectSkycraft(w.env, NOW + DAY); setClock(null);
  ok('D race with an existing pointer: the write is refused and the newer snapshot stays', w.ptr().current.id === 'NEWER' && /superseded/.test(r), [r, w.ptr().current.id]); }
{ const w = use(world()); setClock(NOW); await W.collectSkycraft(w.env, NOW); const id = w.ptr().current.id, key = w.ptr().current.key; const orig = Buffer.from(w.store.get(key).buf);
  // a different body already stored under the key this run would use is never overwritten
  w.store.delete(S.POINTER); w.store.set(key, { buf: Buffer.from('{"tampered":true}'), opts: {}, etag: 't' }); w.runs.length = 0;
  const r = await W.collectSkycraft(w.env, NOW); setClock(null);
  ok('D a stored snapshot is never overwritten', r.startsWith('skycraft:down snapshot stored copy differs') && w.store.get(key).buf.toString() === '{"tampered":true}' && !w.ptr().current, [r, id]); void orig; }
{ // GPT, 13 Nov: run A's lock expires; run B takes it over; A then finishes. A must not release B's lock, and a third run must not start.
  const w = use(world()); const gates = {}; const gate = k => new Promise(r => { gates[k] = r; });
  let n = 0; w.hold = async (u, lro) => { if (!lro) { const k = n++ === 0 ? 'A' : 'B'; await gate(k); } };
  const T0 = NOW; setClock(T0); const a = W.collectSkycraft(w.env, T0); await new Promise(r => setTimeout(r, 30));
  ok('D takeover: run A holds the lock and has one request in flight', w.lock() && /run 2026-11-13T05:07/.test(w.lock().who) && w.reqs.length === 1, w.lock());
  setClock(T0 + 11 * 60000); const b = W.collectSkycraft(w.env, T0 + 11 * 60000); await new Promise(r => setTimeout(r, 30));
  const bLock = w.lock();
  ok('D takeover: after ten minutes run B takes the lock over and starts its request', bLock && /run 2026-11-13T05:18/.test(bLock.who) && w.reqs.length === 2, [bLock, w.reqs.length]);
  gates.A(); const ra = await a;
  ok('D takeover: A finishing does NOT release B\'s lock', w.lock() && w.lock().token === bLock.token && !w.lock().released, w.lock());
  ok('D takeover: A makes no further Horizons request once it no longer holds the lock', /this run no longer holds the lock/.test(ra) && w.reqs.length === 2, [ra, w.reqs.length]);
  setClock(T0 + 11 * 60000 + 1000); const rc = await W.collectSkycraft(w.env, T0 + 11 * 60000 + 1000);
  ok('D takeover: a third run cannot start while B\'s request is in flight', rc === 'skycraft:busy' && w.reqs.length === 2, [rc, w.reqs.length]);
  gates.B(); const rb = await b; setClock(null);
  ok('D takeover: B completes both requests and then releases its own lock', /lro study stored/.test(rb) && w.reqs.length === 3 && w.lock().released === true, [rb, w.reqs.length, w.lock()]);
  ok('D takeover: the newer run\'s snapshot is current', /20261113T0518/.test(w.ptr().current.id), w.ptr().current.id); }
// ---------- E. the probe: exactly one request, nothing stored
{ const w = use(world()); const r = await get(w, '/admin/probe/skycraft?key=k');
  ok('E probe: exactly one upstream request, data sheet only, with the User-Agent', r.status === 200 && w.reqs.length === 1 && !w.reqs[0].u.includes("MAKE_EPHEM='YES'") && w.reqs[0].u.includes("MAKE_EPHEM='NO'") && w.reqs[0].ua === S.UA && r.j.upstream_requests === 1 && r.j.user_agent_set === S.UA && /not verified/.test(r.j.user_agent_receipt) && !('user_agent_sent' in r.j), [w.reqs.length, r.j]);
  ok('E probe: reports status, API version and sheet revision; stores and publishes nothing', r.j.http === 200 && r.j.api_version === '1.2' && r.j.data_sheet_revised === 'Nov 03, 2026' && r.j.stored === false && w.keys('skycraft/').filter(k => k !== S.LOCK).length === 0 && w.lock().released === true && w.runs.length === 0, [r.j, [...w.store.keys()]]);
  ok('E probe needs the admin key', (await get(w, '/admin/probe/skycraft')).status === 403 && (await get(w, '/admin/probe/skycraft?key=no')).status === 403 && w.reqs.length === 1);
  w.store.set(S.LOCK, { buf: Buffer.from(JSON.stringify({ who: 'run', at: new RealDate().toISOString() })), opts: {}, etag: 'x' }); const busy = await get(w, '/admin/probe/skycraft?key=k');
  ok('E probe while a run holds the lock: no request', busy.j.made_request === false && w.reqs.length === 1, busy.j); }
// ---------- F. the dated examples route
{ const w = use(world()); const B = JSON.parse(fs.readFileSync(path.join(HERE, 'skycraft/BUILD.json'), 'utf8')).catalogues;
  for (const [rev, pin] of Object.entries(W.CRAFT_REVISIONS)) w.store.set(pin.key, { buf: fs.readFileSync(path.join(HERE, 'skycraft', B[rev].file)), opts: {}, etag: rev });
  for (const rev of Object.keys(W.CRAFT_REVISIONS)) { const r = await get(w, '/catalogue/skycraft/' + rev);
    ok(`F ${rev}: served byte for byte, immutable, CORS`, r.status === 200 && sha(r.buf) === W.CRAFT_REVISIONS[rev].fileSha256 && /immutable/.test(r.h.get('cache-control')) && r.h.get('access-control-allow-origin') === '*'); }
  const before = w.store.size; let reads = 0; const g = w.env.R2.get; w.env.R2.get = async k => { reads++; return g(k); };
  for (const p of ['/catalogue/skycraft', '/catalogue/skycraft/', '/catalogue/skycraft/craft-moon-2026-06-R2', '/catalogue/skycraft/craft-moon-2026-06-R1/x', '/catalogue/skycraft/craft-%6doon-2026-06-R1', '/catalogue/skycraft//craft-moon-2026-06-R1']) { const r = await get(w, p); ok(`F ${p} → 404, no storage read`, r.status === 404 && /no-store/.test(r.h.get('cache-control')), r.status); }
  ok('F unknown ids never touched storage', reads === 0 && w.store.size === before); w.env.R2.get = g;
  const pin = W.CRAFT_REVISIONS['craft-sun-2024-12-R1'], good = w.store.get(pin.key);
  w.store.set(pin.key, { ...good, buf: Buffer.concat([good.buf.subarray(0, 500), Buffer.from('9'), good.buf.subarray(501)]) }); ok('F altered file → 503 integrity', (await get(w, '/catalogue/skycraft/craft-sun-2024-12-R1')).j.reason === 'integrity');
  w.store.delete(pin.key); ok('F missing file → 503 missing', (await get(w, '/catalogue/skycraft/craft-sun-2024-12-R1')).j.reason === 'missing'); }
// ---------- G. the rest of the hub is as it was
{ const w = use(world()); const root = await get(w, '/');
  ok('G hub reports at least 0.6.12 and lists the new routes', (v => v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 12))(root.j.version.split('.').map(Number)) && root.j.endpoints.includes('/catalogue/skycraft/<revision>'), root.j.version);
  ok('G skycraft is a manual job; the Dust and Sky routes still answer', 'skycraft' in W.JOBS && (await get(w, '/snapshot/dustrgb/meta')).status === 200 && (await get(w, '/catalogue/sky/nope')).status === 404); }
globalThis.fetch = realFetch; globalThis.Date = RealDate;
console.log(`${fail ? 'FAIL' : 'PASS'}  skycraft-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
