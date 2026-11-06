// Pass/fail under the PRODUCTION memory limit. Real worker.js in workerd (Miniflare 4.20260730.0) started with
// MINIFLARE_WORKERD_V8_FLAGS="--max-old-space-size=128" (shown to kill the isolate past 128 MB). No forced GC: V8 collects as it
// would under the real cap. One scenario per process (a failure kills workerd). Heap is sampled through the inspector every 10 ms;
// the inspector cannot answer while the isolate runs synchronous JS, so sampled peaks are LOWER BOUNDS — the pass/fail is the verdict.
// Usage: MINIFLARE_WORKERD_V8_FLAGS="--max-old-space-size=128" node bench2.mjs <csv> <scenario>
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
const [file, scenario] = process.argv.slice(2);
import crypto from 'node:crypto';
const sha = t => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const TESTED = { worker_sha256: sha(fs.readFileSync(process.env.WORKER_FILE || './worker.js')), worker_file: process.env.WORKER_FILE || './worker.js', source_worker_sha256: process.env.SOURCE_WORKER_SHA || null, v8_flags: process.env.MINIFLARE_WORKERD_V8_FLAGS || '(none)', miniflare: '4.20260730.0', compatibility_date: '2026-07-30' };
const FIRMS = fs.readFileSync(file, 'utf8'), HEAD = FIRMS.slice(0, FIRMS.indexOf('\n')); const ROWS = FIRMS.split('\n').length - 1;
let firmsBody = FIRMS; const PORT = 9300 + Math.floor(Math.random() * 600);
const mf = new Miniflare({ modules: true, scriptPath: process.env.WORKER_FILE || './worker.js', compatibilityDate: '2026-07-30', inspectorPort: PORT, d1Databases: ['DB'], r2Buckets: ['R2'],
  bindings: { HISTORY_ENABLED: '1', FIRMS_MAP_KEY: 'x', ADMIN_KEY: 'k' },
  outboundService: async req => req.url.includes('firms.modaps') ? new Response(firmsBody, { status: 200 })
    : req.url.includes('earthquake.usgs.gov') ? new Response(JSON.stringify({ metadata: { generated: Date.now() - 60e3 }, features: [] }), { status: 200 }) : new Response('stub', { status: 503 }) });
await mf.ready;
const db = await mf.getD1Database('DB'), r2 = await mf.getR2Bucket('R2'), w = await mf.getWorker();
for (const st of fs.readFileSync('./schema.sql', 'utf8').replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean)) await db.prepare(st).run();
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const ws = new WebSocket(targets[0].webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
const heap = () => new Promise(r => { const i = ++id; pend.set(i, x => r(x ? x.usedSize / 1048576 : NaN)); ws.send(JSON.stringify({ id: i, method: 'Runtime.getHeapUsage' })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); r(NaN); } }, 3000); });
const sched = (cron, ms) => w.scheduled({ cron, scheduledTime: new Date(ms) });
const RESP = [];   // every HTTP response the scenario made: status + body checks
// /place answers 200 even when a section fails (section state 'unavailable'), so the FIRMS SECTION is checked: state 'ok' and its count
// equal to the published cell count. 'withheld' (records and counts from different runs) is the hub's designed answer while a collect
// lands mid-request — recorded, and allowed only during the overlap; a final /place after the scenario must be exact.
let BUSY = '26_57';
const place = (c, final = false) => mf.dispatchFetch('http://hub/place/g4/' + (c || BUSY)).then(async r => { const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (_) {}
  const f = j && j.layers && j.layers.firms, cells = JSON.parse(await (await r2.get('latest-cells/firms.json')).text()), want = cells.cells && cells.cells[c || BUSY] ? cells.cells[c || BUSY].count : 0;
  const exact = !!f && f.state === 'ok' && f.count === want && want > 0;
  RESP.push({ what: '/place ' + (c || BUSY) + (final ? ' (final)' : ''), status: r.status, firms_state: f ? f.state : null, count: f ? f.count : null, want, ok: r.status === 200 && (exact || (!final && f && f.state === 'withheld')) }); });
const snapshot = () => mf.dispatchFetch('http://hub/snapshot/firms').then(async r => { const t = await r.text(); let n = -1; try { n = JSON.parse(t).records.length; } catch (_) {} RESP.push({ what: '/snapshot/firms', status: r.status, ok: r.status === 200 && n === ROWS, records: n }); });

// ---- setup (not measured): one collect so latest/ and a snapshot exist; seed a closed day from it
async function seedClosedDay(day) {
  const k = (await r2.list({ prefix: 'snapshots/firms/' })).objects[0].key; const s = JSON.parse(await (await r2.get(k)).text());
  s.retrieved_at = day + 'T23:45:40.000Z'; await r2.put(`snapshots/firms/${day}T23-45Z.json`, JSON.stringify(s), { customMetadata: { retrieved_at: s.retrieved_at } });
  await db.prepare('INSERT OR IGNORE INTO history_activity (layer, day, first_seen) VALUES (?,?,?)').bind('firms', day, day + 'T00:00:40.000Z').run();
}
const busiest = async () => { const o = await r2.get('latest-cells/firms.json'); if (!o) return; const c = JSON.parse(await o.text()).cells || {}; BUSY = Object.entries(c).sort((a, b) => b[1].count - a[1].count)[0][0]; };
const SC = {
  'collect': { setup: async () => {}, run: () => sched('*/15 * * * *', Date.now()) },
  'checkpoint': { setup: async () => { await sched('*/15 * * * *', Date.now()); await seedClosedDay('2026-11-05'); firmsBody = HEAD; }, run: () => sched('*/15 * * * *', Date.now()) },
  'backfill': { setup: async () => { await sched('*/15 * * * *', Date.now()); await seedClosedDay('2026-11-05'); firmsBody = HEAD; await sched('*/15 * * * *', Date.now()); await db.prepare('DELETE FROM archive_checkpoint_coverage').run(); }, run: () => sched('*/15 * * * *', Date.now()) },
  'place-resident+collect': { setup: async () => { await sched('*/15 * * * *', Date.now()); await (await busiest(), place()); }, run: () => sched('*/15 * * * *', Date.now()) },
  'realistic-overlap': { setup: async () => { await sched('*/15 * * * *', Date.now()); await (await busiest(), place()); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), place(), snapshot(), sched('*/5 * * * *', Date.now())]) },
  'collect+checkpoint-overlap': { setup: async () => { await sched('*/15 * * * *', Date.now()); await (await busiest(), place()); await seedClosedDay('2026-11-05'); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), sched('*/5 * * * *', Date.now()), place()]) },
  'stress-2-collects': { setup: async () => { await sched('*/15 * * * *', Date.now()); await (await busiest(), place()); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), sched('*/15 * * * *', Date.now() - 1000), place(), snapshot()]) },
};
const q = async (sql, ...a) => (await db.prepare(sql).bind(...a).all()).results;
const firmsRuns = () => q("SELECT id, status, records, note FROM collector_runs WHERE layer = 'firms' ORDER BY id");
async function checkpointDone(day) {   // object + marker + daily aggregates + coverage, all for the expected rows
  const m = (await q("SELECT records FROM archive_checkpoints WHERE layer='firms' AND day=?", day))[0];
  const obj = await r2.head(`archive/checkpoints/firms/${day}.json.gz`);
  const agg = (await q("SELECT COUNT(*) cells, COALESCE(SUM(detections),0) det FROM fires_daily WHERE day=?", day))[0];
  const cov = (await q("SELECT assessed_with_checkpoint w FROM archive_checkpoint_coverage WHERE layer='firms' AND day=?", day))[0];
  return { marker: !!m && m.records === ROWS, object: !!obj, aggregates: agg.cells > 0 && agg.det === ROWS, coverage: !!cov, coverage_with_checkpoint: cov ? cov.w : null };
}
const sc = SC[scenario]; let setupErr = null;
try { await sc.setup(); } catch (e) { setupErr = String(e).slice(0, 100); }
const runsBefore = setupErr ? [] : await firmsRuns(); const histFailBefore = setupErr ? 0 : (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer LIKE 'history:%' AND status != 'ok'"))[0].n; const usgsBefore = setupErr ? 0 : (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer='usgs' AND status='ok'"))[0].n;
let peak = await heap(); const base = peak; let run = true;
const sampler = (async () => { while (run) { const h = await heap(); if (h > peak) peak = h; await new Promise(r => setTimeout(r, 10)); } })();
const t0 = Date.now(); let err = null;
try { await sc.run(); } catch (e) { err = String(e).slice(0, 140); }
run = false; await sampler.catch(() => {});
let alive = true; try { await mf.dispatchFetch('http://hub/'); } catch (e) { alive = false; }
const checks = {}; const fail = [];
if (alive && !setupErr) {
  const after = await firmsRuns(); const fresh = after.filter(r => !runsBefore.some(b => b.id === r.id));
  const okFresh = fresh.filter(r => r.status === 'ok' && r.records === ROWS);
  const expectCollects = { collect: 1, 'realistic-overlap': 1, 'collect+checkpoint-overlap': 1, 'stress-2-collects': 2, checkpoint: 0, backfill: 0 }[scenario];
  checks.firms_runs_new = fresh.map(r => `${r.status}:${r.records}`);
  if (okFresh.length !== expectCollects) fail.push(`expected ${expectCollects} successful collect(s) of ${ROWS} rows, got ${okFresh.length}`);
  if (expectCollects) { const lo = await r2.get('latest/firms.json'); const lat = lo ? JSON.parse(await lo.text()) : { records: [], source_status: 'missing' }; checks.latest_records = lat.records.length; if (lat.records.length !== ROWS || lat.source_status !== 'ok') fail.push('latest/firms.json not the expected publication'); }
  if (expectCollects === 0 && fresh.some(r => r.status === 'ok')) fail.push('unexpected successful collect');
  if (['checkpoint', 'backfill', 'collect+checkpoint-overlap'].includes(scenario)) {
    const c = await checkpointDone('2026-11-05'); checks.checkpoint = c;
    if (!c.marker || !c.object || !c.aggregates || !c.coverage) fail.push('checkpoint incomplete: ' + JSON.stringify(c));
    if (scenario === 'backfill' && c.coverage_with_checkpoint !== 0) fail.push('backfill did not write a later-assessed coverage row');
    if (scenario !== 'backfill' && c.coverage_with_checkpoint !== 1) fail.push('coverage not written with the checkpoint');
  }
  if (['realistic-overlap', 'collect+checkpoint-overlap'].includes(scenario)) { const u = (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer='usgs' AND status='ok'"))[0].n; checks.usgs_ok_new = u - usgsBefore; if (u - usgsBefore < 1) fail.push('usgs run did not complete ok'); }
  const hf = (await q("SELECT COUNT(*) n FROM collector_runs WHERE layer LIKE 'history:%' AND status != 'ok'"))[0].n - histFailBefore; checks.history_failures_new = hf; if (hf) fail.push(hf + ' history step failure(s) logged');
  if (RESP.some(r => r.what.startsWith('/place'))) await place(null, true);
  checks.responses = RESP; for (const r of RESP) if (!r.ok) fail.push('bad response: ' + r.what + ' ' + r.status);
}
let last = null; try { last = await db.prepare("SELECT status, substr(note,1,60) note FROM collector_runs WHERE layer='firms' ORDER BY id DESC LIMIT 1").first(); } catch (_) {}
const verdict = !alive || err || setupErr || fail.length ? 'FAIL' : 'pass';
console.log(JSON.stringify({ file: file.split('/').pop(), mb: +(FIRMS.length / 1048576).toFixed(2), rows: ROWS, scenario, verdict, fail, setupErr, err, alive, heap_base: +base.toFixed(1), heap_peak_sampled: +peak.toFixed(1), ms: Date.now() - t0, checks, tested: TESTED, last_firms_run: last }));
try { ws.close(); await mf.dispose(); } catch (_) {}
process.exit(0);
