// Pass/fail under the PRODUCTION memory limit. Real worker.js in workerd (Miniflare 4.20260730.0) started with
// MINIFLARE_WORKERD_V8_FLAGS="--max-old-space-size=128" (shown to kill the isolate past 128 MB). No forced GC: V8 collects as it
// would under the real cap. One scenario per process (a failure kills workerd). Heap is sampled through the inspector every 10 ms;
// the inspector cannot answer while the isolate runs synchronous JS, so sampled peaks are LOWER BOUNDS — the pass/fail is the verdict.
// Usage: MINIFLARE_WORKERD_V8_FLAGS="--max-old-space-size=128" node bench2.mjs <csv> <scenario>
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
const [file, scenario] = process.argv.slice(2);
const FIRMS = fs.readFileSync(file, 'utf8'), HEAD = FIRMS.slice(0, FIRMS.indexOf('\n'));
let firmsBody = FIRMS; const PORT = 9300 + Math.floor(Math.random() * 600);
const mf = new Miniflare({ modules: true, scriptPath: './worker.js', compatibilityDate: '2026-07-30', inspectorPort: PORT, d1Databases: ['DB'], r2Buckets: ['R2'],
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
const place = c => mf.dispatchFetch('http://hub/place/g4/' + c).then(r => r.text());
const snapshot = () => mf.dispatchFetch('http://hub/snapshot/firms').then(r => r.text());

// ---- setup (not measured): one collect so latest/ and a snapshot exist; seed a closed day from it
async function seedClosedDay(day) {
  const k = (await r2.list({ prefix: 'snapshots/firms/' })).objects[0].key; const s = JSON.parse(await (await r2.get(k)).text());
  s.retrieved_at = day + 'T23:45:40.000Z'; await r2.put(`snapshots/firms/${day}T23-45Z.json`, JSON.stringify(s), { customMetadata: { retrieved_at: s.retrieved_at } });
  await db.prepare('INSERT OR IGNORE INTO history_activity (layer, day, first_seen) VALUES (?,?,?)').bind('firms', day, day + 'T00:00:40.000Z').run();
}
const SC = {
  'collect': { setup: async () => {}, run: () => sched('*/15 * * * *', Date.now()) },
  'checkpoint': { setup: async () => { await sched('*/15 * * * *', Date.now()); await seedClosedDay('2026-11-05'); firmsBody = HEAD; }, run: () => sched('*/15 * * * *', Date.now()) },
  'backfill': { setup: async () => { await sched('*/15 * * * *', Date.now()); await seedClosedDay('2026-11-05'); firmsBody = HEAD; await sched('*/15 * * * *', Date.now()); await db.prepare('DELETE FROM archive_checkpoint_coverage').run(); }, run: () => sched('*/15 * * * *', Date.now()) },
  'place-resident+collect': { setup: async () => { await sched('*/15 * * * *', Date.now()); await place('26_57'); }, run: () => sched('*/15 * * * *', Date.now()) },
  'realistic-overlap': { setup: async () => { await sched('*/15 * * * *', Date.now()); await place('26_57'); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), place('21_41'), snapshot(), sched('*/5 * * * *', Date.now())]) },
  'collect+checkpoint-overlap': { setup: async () => { await sched('*/15 * * * *', Date.now()); await place('26_57'); await seedClosedDay('2026-11-05'); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), sched('*/5 * * * *', Date.now()), place('21_41')]) },
  'stress-2-collects': { setup: async () => { await sched('*/15 * * * *', Date.now()); await place('26_57'); },
    run: () => Promise.all([sched('*/15 * * * *', Date.now()), sched('*/15 * * * *', Date.now() - 1000), place('21_41'), snapshot()]) },
};
const sc = SC[scenario]; let setupErr = null;
try { await sc.setup(); } catch (e) { setupErr = String(e).slice(0, 100); }
let peak = await heap(); const base = peak; let run = true;
const sampler = (async () => { while (run) { const h = await heap(); if (h > peak) peak = h; await new Promise(r => setTimeout(r, 10)); } })();
const t0 = Date.now(); let err = null;
try { await sc.run(); } catch (e) { err = String(e).slice(0, 140); }
run = false; await sampler.catch(() => {});
let alive = true; try { await mf.dispatchFetch('http://hub/'); } catch (e) { alive = false; }
let last = null; try { last = await db.prepare("SELECT status, substr(note,1,60) note FROM collector_runs WHERE layer='firms' ORDER BY id DESC LIMIT 1").first(); } catch (_) {}
console.log(JSON.stringify({ file: file.split('/').pop(), mb: +(FIRMS.length / 1048576).toFixed(2), scenario, verdict: !alive || err || setupErr ? 'FAIL' : 'pass', setupErr, err, alive, heap_base: +base.toFixed(1), heap_peak_sampled: +peak.toFixed(1), ms: Date.now() - t0, last_firms_run: last }));
try { ws.close(); await mf.dispose(); } catch (_) {}
process.exit(0);
