// FIRMS v2 (0.6.0) memory bench — the REAL worker.js in workerd (Miniflare 4.20260730.0), local R2 + D1, FIRMS served from a file,
// total V8 heap capped with MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=<MB>". One scenario per process (a failure kills workerd).
// Every scenario ASSERTS its outputs (complete and correct, not just survival); heap peaks sampled every 10 ms through the
// inspector are LOWER BOUNDS (the inspector cannot answer during synchronous JS) — the verdict is pass/fail.
// LOCAL simulator evidence only: production R2/D1 are other implementations; Cloudflare's 128 MB is per isolate.
// Files above 8 MiB can only be processed with the resource guard raised: the runner makes a bench-only worker copy with
// FIRMS_MAX_PARSE_BYTES = 1 GiB for those rows (labelled guard_raised_in_bench_copy); production keeps 8 MiB.
// Usage: MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=80" WORKER_FILE=./worker-v2.js node bench-v2.mjs <csv> <scenario>
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
import crypto from 'node:crypto';
const [file, scenario] = process.argv.slice(2);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const WF = process.env.WORKER_FILE || './worker-v2.js';
const TESTED = { worker_sha256: sha(fs.readFileSync(WF)).slice(0, 16), worker_file: WF, source_worker_sha256: process.env.SOURCE_WORKER_SHA || null, v8_flags: process.env.MINIFLARE_WORKERD_V8_FLAGS || '(none)',
  miniflare: '4.20260730.0', compatibility_date: '2026-07-30', guard_raised_in_bench_copy: /FIRMS_MAX_PARSE_BYTES = 1024 \* 1024 \* 1024/.test(fs.readFileSync(WF, 'utf8')) };
const FIRMS = fs.readFileSync(file), TEXT = FIRMS.toString('utf8'), HEAD = TEXT.slice(0, TEXT.indexOf('\n') + 1);
const ROWS = TEXT.split('\n').filter(Boolean).length - 1;
let firmsBody = FIRMS, firmsMode = 'ok'; const PORT = 9300 + Math.floor(Math.random() * 600);
const brokenStream = () => { let sent = 0; return new ReadableStream({ pull(c) { if (sent > FIRMS.length / 2) { c.error(new Error('connection reset (bench)')); return; } const n = Math.min(1 << 20, FIRMS.length - sent); c.enqueue(FIRMS.subarray(sent, sent + n)); sent += n; } }); };
import os from 'node:os'; import path from 'node:path';
const PERSIST = fs.mkdtempSync(path.join(os.tmpdir(), 'bv2-'));   // R2 + D1 on disk, so a separate UNCAPPED instance can verify the outputs afterwards
const mf = new Miniflare({ modules: true, scriptPath: WF, compatibilityDate: '2026-07-30', inspectorPort: PORT, d1Databases: ['DB'], r2Buckets: ['R2'], d1Persist: PERSIST + '/d1', r2Persist: PERSIST + '/r2',
  bindings: { HISTORY_ENABLED: '1', FIRMS_MAP_KEY: 'x', ADMIN_KEY: 'k', FIRMS_PIPELINE: 'v2', FIRMS_CREATE_ONLY: 'verified' },
  outboundService: async req => req.url.includes('firms.modaps') ? new Response(firmsMode.startsWith('reset') ? brokenStream() : firmsBody, { status: 200, headers: firmsMode === 'reset-cl' ? { 'content-length': String(FIRMS.length) } : {} })
    : req.url.includes('earthquake.usgs.gov') ? new Response(JSON.stringify({ metadata: { generated: Date.now() - 60e3 }, features: [] }), { status: 200 }) : new Response('stub', { status: 503 }) });
await mf.ready;
let db = await mf.getD1Database('DB'), r2 = await mf.getR2Bucket('R2'); const w = await mf.getWorker();
for (const st of fs.readFileSync('./schema.sql', 'utf8').replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean)) await db.prepare(st).run();
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const ws = new WebSocket(targets[0].webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
const heap = () => new Promise(r => { const i = ++id; pend.set(i, x => r(x ? x.usedSize / 1048576 : NaN)); ws.send(JSON.stringify({ id: i, method: 'Runtime.getHeapUsage' })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); r(NaN); } }, 3000); });
const sched = (cron, ms) => w.scheduled({ cron, scheduledTime: new Date(ms) });
const q = async (sql, ...a) => (await db.prepare(sql).bind(...a).all()).results;
const text = async k => { const o = await r2.get(k); return o ? await o.text() : null; };
const RESP = [];

// ---- expected outputs, computed in the bench process from the CSV itself (independent of the worker)
const CELL = 4; const cellOf = (lat, lng) => Math.min(Math.floor((lat + 90) / CELL), 180 / CELL - 1) + '_' + Math.min(Math.floor((lng + 180) / CELL), 360 / CELL - 1);
function expected(t) { const L = t.split('\n'), h = L[0].split(','), iLat = h.indexOf('latitude'), iLng = h.indexOf('longitude'), iD = h.indexOf('acq_date'), iT = h.indexOf('acq_time');
  const cells = {}, hours = {}; let n = 0; for (let i = 1; i < L.length; i++) { if (!L[i]) continue; const c = L[i].split(','); const id = cellOf(+c[iLat], +c[iLng]); cells[id] = (cells[id] || 0) + 1; const hk = c[iD] + 'T' + c[iT].padStart(4, '0').slice(0, 2); (hours[hk] || (hours[hk] = {}))[id] = (hours[hk][id] || 0) + 1; n++; }
  return { n, cells, hours }; }
const EXP = expected(TEXT);
let BUSY = Object.entries(EXP.cells).sort((a, b) => b[1] - a[1])[0][0];
const place = (c, final = false) => mf.dispatchFetch('http://hub/place/g4/' + (c || BUSY)).then(async r => { const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (_) {}
  const f = j && j.layers && j.layers.firms, cj = JSON.parse((await text('latest-cells/firms.json')) || '{}'), want = cj.cells && cj.cells[c || BUSY] ? cj.cells[c || BUSY].count : 0;
  const exact = !!f && f.state === 'ok' && f.count === want && want > 0 && f.records.length === Math.min(8, want);
  RESP.push({ what: '/place ' + (c || BUSY) + (final ? ' (final)' : ''), status: r.status, firms_state: f ? f.state : null, count: f ? f.count : null, want,
    ok: r.status === 200 && (exact || (!final && f && ['withheld', 'busy'].includes(f.state))) }); });
const snapshot = () => mf.dispatchFetch('http://hub/snapshot/firms').then(async r => { const t = await r.text(); let n = -1; try { n = JSON.parse(t).records.length; } catch (_) {} RESP.push({ what: '/snapshot/firms', status: r.status, ok: r.status === 200 && (n === EXP.n || n === LEGACY_N), records: n }); });
let LEGACY_N = -1;

// ---- legacy objects at L_json (for the transition scenario), built from this file's own rows
const LJ = 12 * 1024 * 1024;
function legacyJson(target, at) {
  const L = TEXT.split('\n'), h = L[0].split(','), ix = n => h.indexOf(n); const recs = []; let size = 400, i = 1;
  while (size < target - 65536) {   // 64 KiB left for the cells object
    const c = L[1 + ((i - 1) % (L.length - 2))].split(','); if (c.length < h.length) { i++; continue; } const t = c[ix('acq_time')].padStart(4, '0');
    const r = [+c[ix('latitude')], +c[ix('longitude')], c[ix('acq_date')] + 'T' + t.slice(0, 2) + ':' + t.slice(2) + ':00Z', c[ix('confidence')], +c[ix('frp')], c[ix('satellite')], c[ix('daynight')]]; const s = JSON.stringify(r).length + 1; recs.push(r); size += s; i++; }
  const cells = {}; for (const r of recs) { const id = cellOf(r[0], r[1]); (cells[id] || (cells[id] = { count: 0 })).count++; }
  const env = { schema_version: 1, collector_version: '0.5.3', layer: 'firms', window_start: at.slice(0, 10) + 'T00:00:00.000Z', window_end: at, retrieved_at: at, source_status: 'ok', record_format: 'rows',
    record_fields: ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], records: recs, cells };
  const json = JSON.stringify(env); if (Buffer.byteLength(json) > target) throw new Error('legacy builder overshot: ' + Buffer.byteLength(json));
  return { json, n: env.records.length, cells };
}
async function seedLegacy() {
  const at = '2026-11-05T23:45:40.000Z'; const lj = legacyJson(LJ, at); LEGACY_N = lj.n;
  if (Buffer.byteLength(lj.json) > LJ) throw new Error('legacy object over L_json: ' + Buffer.byteLength(lj.json));
  await r2.put('snapshots/firms/2026-11-05T23-45Z.json', lj.json, { customMetadata: { retrieved_at: at } });
  await r2.put('latest/firms.json', lj.json); const cellsOnly = JSON.parse(lj.json); delete cellsOnly.records; delete cellsOnly.record_fields; await r2.put('latest-cells/firms.json', JSON.stringify(cellsOnly));
  await db.prepare('INSERT OR IGNORE INTO history_activity (layer, day, first_seen) VALUES (?,?,?)').bind('firms', '2026-11-05', '2026-11-05T00:00:40.000Z').run();
  // a legacy checkpoint for 4 Nov at L_json decompressed, with no coverage row → backfill reads it (bounded)
  const lj4 = legacyJson(LJ, '2026-11-04T23:45:40.000Z'); const gz = new Uint8Array(await new Response(new Blob([lj4.json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  await r2.put('archive/checkpoints/firms/2026-11-04.json.gz', gz, { httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' } });
  await db.prepare('INSERT INTO archive_checkpoints (layer, day, cutoff, r2_key, bytes, records, run_ref, collector_version, source_key) VALUES (?,?,?,?,?,?,?,?,?)').bind('firms', '2026-11-04', '2026-11-04T23:45:40.000Z', 'archive/checkpoints/firms/2026-11-04.json.gz', gz.length, lj4.n, 'firms@2026-11-04T23:45:40.000Z', '0.5.3', 'x').run();
  BUSY = Object.entries(lj.cells).sort((a, b) => b[1].count - a[1].count)[0][0];
  return lj;
}
/** A committed output becomes a closed day's checkpoint input (its retrieval is "yesterday" for the hub). */
async function closeDayOfLastOutput(day) { await db.prepare("UPDATE firms_outputs SET day = ?").bind(day).run(); await db.prepare('INSERT OR IGNORE INTO history_activity (layer, day, first_seen) VALUES (?,?,?)').bind('firms', day, day + 'T00:00:40.000Z').run(); }
const collect = () => sched('*/15 * * * *', Date.now());
const SC = {
  'collect': { setup: async () => {}, run: collect, expect: { collects: 1 } },
  'checkpoint': { setup: async () => { await collect(); await closeDayOfLastOutput('2026-11-05'); firmsBody = Buffer.from(HEAD); }, run: collect, expect: { collects: 0, checkpoint: '2026-11-05' } },
  // the sidecar is replaced by a wrong one: the checkpoint must reject it and rebuild from the committed snapshot (streamed) — memory of the rebuild
  'checkpoint-rebuild': { setup: async () => { await collect(); await closeDayOfLastOutput('2026-11-05'); const o = (await q('SELECT aux_key FROM firms_outputs'))[0]; await r2.put(o.aux_key, '{"run_id":"x","records":1}'); firmsBody = Buffer.from(HEAD); }, run: collect, expect: { collects: 0, checkpoint: '2026-11-05', rebuilt: true } },
  'overlap': { setup: async () => { await collect(); await closeDayOfLastOutput('2026-11-05'); await place(); },
    run: () => Promise.all([collect(), place(), place(), place(), snapshot(), sched('*/5 * * * *', Date.now())]), expect: { collects: 1, checkpoint: '2026-11-05', usgs: 1 } },
  'stress-2-collects': { setup: async () => { await collect(); await place(); }, run: () => Promise.all([collect(), sched('*/15 * * * *', Date.now() - 1000), place(), place(), snapshot()]), expect: { collects: 2 } },
  'legacy-transition': { setup: async () => { await seedLegacy(); await place(); },
    run: () => Promise.all([collect(), place(), place(), snapshot()]), expect: { collects: 1, checkpoint: '2026-11-05', legacyCheckpoint: true, backfill: '2026-11-04' } },
  // connection reset half-way, no Content-Length (FIRMS's header is unmeasured): workerd ends the body cleanly at the cut → the row checks refuse it
  'injected-reset': { setup: async () => { await collect(); firmsMode = 'reset'; }, run: collect, expect: { collects: 0, downNote: /truncated or malformed response|^fetch failed/, noNewSnapshot: true } },
  // the same with a Content-Length header: refused before registration (no input, no raw left behind)
  'injected-reset-cl': { setup: async () => { await collect(); firmsMode = 'reset-cl'; }, run: collect, expect: { collects: 0, downNote: /^truncated response|^fetch failed/, noNewRaw: true, noNewSnapshot: true } },
  'injected-truncated-row': { setup: async () => { await collect(); firmsBody = Buffer.concat([FIRMS.subarray(0, FIRMS.length - 1), Buffer.from('\n34.1,44.0,316\n')]); }, run: collect, expect: { collects: 0, downNote: /truncated or malformed response/, noNewSnapshot: true } },
};
const firmsRuns = () => q("SELECT id, status, records, note FROM collector_runs WHERE layer = 'firms' ORDER BY id");
async function checkpointDone(day, n) {
  const m = (await q("SELECT records, source_key FROM archive_checkpoints WHERE layer='firms' AND day=?", day))[0];
  const o = await r2.get(`archive/checkpoints/firms/${day}.json.gz`); let objOk = false, objRecords = -1;
  if (o) { const raw = new Uint8Array(await o.arrayBuffer()); let t; try { t = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); } catch (_) { t = new TextDecoder().decode(raw); } try { objRecords = JSON.parse(t).records.length; objOk = objRecords === n; } catch (_) {} }
  const agg = (await q("SELECT COUNT(*) cells, COALESCE(SUM(detections),0) det FROM fires_daily WHERE day=?", day))[0];
  const cov = (await q("SELECT assessed_with_checkpoint w FROM archive_checkpoint_coverage WHERE layer='firms' AND day=?", day))[0];
  return { marker: !!m && m.records === n, object_records: objRecords, object: objOk, aggregates: agg.det === n && agg.cells > 0, det: agg.det, coverage_with_checkpoint: cov ? cov.w : null };
}
const sc = SC[scenario]; let setupErr = null;
try { await sc.setup(); } catch (e) { setupErr = String(e).slice(0, 160); }
let runsBefore = [], rawBefore = [], snapBefore = [], histFailBefore = 0, usgsBefore = 0;
try {
runsBefore = setupErr ? [] : await firmsRuns(); rawBefore = setupErr ? [] : (await r2.list({ prefix: 'raw/firms/' })).objects.map(o => o.key); snapBefore = setupErr ? [] : (await r2.list({ prefix: 'snapshots/firms/' })).objects.map(o => o.key);
histFailBefore = setupErr ? 0 : (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer LIKE 'history:%' AND status != 'ok'"))[0].n; usgsBefore = setupErr ? 0 : (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer='usgs' AND status='ok'"))[0].n;
} catch (e) { setupErr = setupErr || 'runtime died during setup: ' + String(e).slice(0, 100); }
let peak = await heap(); const base = peak; let run = true;
const sampler = (async () => { while (run) { const h = await heap(); if (h > peak) peak = h; await new Promise(r => setTimeout(r, 10)); } })();
const t0 = Date.now(); let err = null;
try { await sc.run(); } catch (e) { err = String(e).slice(0, 160); }
run = false; await sampler.catch(() => {});
let alive = true; try { await mf.dispatchFetch('http://hub/'); } catch (e) { alive = false; }
if (alive && !setupErr && RESP.some(r => r.what.startsWith('/place'))) { try { await place(null, true); } catch (e) { alive = false; } }   // final /place: a hub request, so in the capped runtime
// Verification reads (64 MiB objects through Miniflare's proxy) must not count against the hub's heap: dispose the capped runtime
// and open the SAME persisted R2/D1 in a second runtime without a cap. The hub's work was already done (or not) above.
try { ws.close(); await mf.dispose(); } catch (_) {}
delete process.env.MINIFLARE_WORKERD_V8_FLAGS;
const vf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("verifier") } }', compatibilityDate: '2026-07-30', d1Databases: ['DB'], r2Buckets: ['R2'], d1Persist: PERSIST + '/d1', r2Persist: PERSIST + '/r2' });
await vf.ready; db = await vf.getD1Database('DB'); r2 = await vf.getR2Bucket('R2');
const checks = {}, fail = [], X = sc.expect;
if (alive && !setupErr) { try {
  const fresh = (await firmsRuns()).filter(r => !runsBefore.some(b => b.id === r.id)); checks.firms_runs_new = fresh.map(r => `${r.status}:${r.records}:${String(r.note).slice(0, 50)}`);
  const okFresh = fresh.filter(r => r.status === 'ok' && r.records === EXP.n), collision = fresh.filter(r => /identity collision/.test(r.note || ''));
  if (X.collects === 2 ? !(okFresh.length === 2 || (okFresh.length === 1 && collision.length === 1)) : okFresh.length !== X.collects) fail.push(`expected ${X.collects} successful collect(s) of ${EXP.n} rows, got ${okFresh.length}`);
  if (X.collects) {   // the published pair: complete and correct against the bench's own count of the CSV
    const lat = JSON.parse((await text('latest/firms.json')) || '{"records":[]}'), cj = JSON.parse((await text('latest-cells/firms.json')) || '{}');
    const top = (await q("SELECT run_id, records, publish_state FROM firms_outputs WHERE publish_state = 'published' ORDER BY retrieved_at DESC LIMIT 1"))[0];
    checks.latest = { records: lat.records.length, run_id: lat.run_id, cells_run_id: cj.run_id, top };
    if (lat.records.length !== EXP.n || lat.source_status !== 'ok' || lat.format !== 'lines/1') fail.push('latest/firms.json is not the complete new publication');
    if (!top || lat.run_id !== top.run_id || cj.run_id !== top.run_id || cj.retrieved_at !== lat.retrieved_at) fail.push('published pair not from the newest committed run');
    const cc = Object.fromEntries(Object.entries(cj.cells || {}).map(([k, v]) => [k, v.count])); if (JSON.stringify(Object.entries(cc).sort()) !== JSON.stringify(Object.entries(EXP.cells).sort())) fail.push('cells counts differ from the CSV');
    const hh = {}; for (const [h, o] of Object.entries(cj.by_hour || {})) hh[h] = o; const flat = o => JSON.stringify(Object.keys(o).sort().map(h => [h, Object.entries(o[h]).sort()]));
    if (flat(hh) !== flat(EXP.hours)) fail.push('by_hour differs from the CSV');
    const lineMax = (await text('latest/firms.json')).split('\n').reduce((a, l) => Math.max(a, l.length), 0); checks.max_line = lineMax; if (lineMax > 4095) fail.push('a line over 4 KiB');
    if (X.collects === 2) { const outs = await q('SELECT publish_state FROM firms_outputs'); checks.outputs = outs.map(o => o.publish_state); }
  }
  if (X.checkpoint) { const n = X.legacyCheckpoint ? LEGACY_N : EXP.n; const c = await checkpointDone(X.checkpoint, n); checks.checkpoint = c;
    if (!c.marker || !c.object || !c.aggregates || c.coverage_with_checkpoint !== 1) fail.push('checkpoint incomplete: ' + JSON.stringify(c)); }
  if (X.rebuilt) { const n = (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer='firms:recovery' AND note LIKE '%rebuilt from the committed snapshot%'"))[0].n; checks.rebuilt_logged = n; if (n < 1) fail.push('sidecar rebuild not recorded'); }
  if (X.backfill) { const v = (await q("SELECT assessed_with_checkpoint w, last_observation_at lo FROM archive_checkpoint_coverage WHERE layer='firms' AND day=?", X.backfill))[0]; checks.backfill = v || null; if (!v || v.w !== 0 || !v.lo) fail.push('legacy checkpoint backfill not assessed'); }
  if (X.usgs) { const u = (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer='usgs' AND status='ok'"))[0].n; checks.usgs_ok_new = u - usgsBefore; if (u - usgsBefore < 1) fail.push('usgs run did not complete ok'); }
  if (X.downNote) { const d = fresh.find(r => r.status === 'down'); checks.down = d && d.note; if (!d || !X.downNote.test(d.note)) fail.push('expected a down run matching ' + X.downNote);
    const lat = JSON.parse((await text('latest/firms.json')) || '{"records":[]}'); if (lat.records.length !== EXP.n) fail.push('the previous publication was not kept intact'); }
  if (X.noNewRaw) { const now = (await r2.list({ prefix: 'raw/firms/' })).objects.map(o => o.key).filter(k => !rawBefore.includes(k)); checks.new_raw = now; if (now.length) fail.push('a partial raw object was left: ' + now); }
  if (X.noNewSnapshot) { const now = (await r2.list({ prefix: 'snapshots/firms/' })).objects.map(o => o.key).filter(k => !snapBefore.includes(k)); checks.new_snapshots = now; if (now.length) fail.push('a snapshot was left for the failed attempt'); }
  const hf = (await q("SELECT COUNT(*) n, MAX(note) note FROM collector_runs WHERE layer LIKE 'history:%' AND status != 'ok'"))[0]; checks.history_failures_new = hf.n - histFailBefore; if (hf.n - histFailBefore) fail.push(hf.n - histFailBefore + ' history step failure(s): ' + hf.note);
  checks.responses = RESP; for (const r of RESP) if (!r.ok) fail.push('bad response: ' + r.what + ' ' + r.status + ' ' + r.firms_state);
} catch (e) { alive = false; fail.push('runtime died while checking: ' + String(e).slice(0, 100)); } }
const verdict = !alive || err || setupErr || fail.length ? 'FAIL' : 'pass';
console.log(JSON.stringify({ file: file.split('/').pop(), mb: +(FIRMS.length / 1048576).toFixed(2), rows: EXP.n, scenario, verdict, fail, setupErr, err, alive, heap_base: +base.toFixed(1), heap_peak_sampled: +peak.toFixed(1), ms: Date.now() - t0, checks, tested: TESTED }));
try { await vf.dispose(); fs.rmSync(PERSIST, { recursive: true, force: true }); } catch (_) {}
process.exit(0);
