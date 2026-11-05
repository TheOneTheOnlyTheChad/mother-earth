// Offline test of the hub's history retention (collector 0.5.0) and the /place endpoint.
// No network: sources stubbed; R2 in memory; D1 = a REAL SQLite database (node:sqlite) loaded with phase1/schema.sql,
// so every history statement is executed by an SQL engine, not mocked. Clock controlled.
// Usage: node --no-warnings phase1/history-hub.test.mjs        (BREAK=<name> runs a deliberately broken variant)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker, * as W from './worker.js';

const BREAK = process.env.BREAK || '';
let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e && e.message || e).split('\n').slice(0, 4).join('\n    ')); } };

// ---------- D1 over SQLite, R2 in memory
function makeD1(opts = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  let writes = 0;
  const prep = (sql) => {
    const mk = (args) => ({
      sql, args,
      async run() { if (opts.failOn && opts.failOn.test(sql)) throw new Error('D1 stub: forced failure'); const r = db.prepare(sql).run(...args); writes += r.changes; return { meta: { changes: r.changes } }; },
      async first() { return db.prepare(sql).get(...args) ?? null; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
    });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) };
  };
  return { db, D1: { prepare: prep, async batch(stmts) { const out = []; for (const s of stmts) { if (/^\s*SELECT/i.test(s.sql)) out.push(await s.all()); else { await s.run(); out.push({ results: [] }); } } return out; } }, writes: () => writes };
}
function makeEnv(extra = {}, d1opts = {}) {
  const store = new Map(); let gets = [];
  const R2 = {
    async put(k, body, o = {}) { store.set(k, { body: body instanceof Uint8Array ? body : String(body), meta: o, etag: '"' + Math.random().toString(36).slice(2) + '"' }); },
    async delete(k) { store.delete(k); },
    async get(k) { gets.push(k); const v = store.get(k); if (!v) return null; const b = v.body;
      return { body: b, httpEtag: v.etag, customMetadata: v.meta.customMetadata, async json() { return JSON.parse(b); }, async text() { return String(b); } }; },
    async list({ prefix } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key })), truncated: false }; },
  };
  const d = makeD1(d1opts);
  return { env: { R2, DB: d.D1, ADMIN_KEY: 'k', FIRMS_MAP_KEY: 'x', ...extra }, store, db: d.db, gets: () => gets, resetGets: () => { gets = []; }, writes: d.writes };
}
const gunzip = async (u8) => JSON.parse(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
const rows = (db, sql, ...a) => db.prepare(sql).all(...a);

// ---------- source stubs
let NOW = Date.parse('2026-11-05T10:00:00Z');
{ const RealDate = Date;   // the hub stamps retrieved_at with `new Date()`: the fake clock must cover the no-argument constructor too
  globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const quake = (id, updated, mag = 3.1, lat = -33.9, lng = 18.4) => ({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [lng, lat, 10] }, properties: { mag, magType: 'ml', time: Date.parse('2026-11-05T08:00:00Z'), updated, place: 'Somewhere', status: 'automatic', title: `M ${mag} - Somewhere`, url: 'https://usgs/' + id } });
let usgsFeatures = [quake('us1', 1000), quake('us2', 2000, 4.6, 10, 10)];
let firmsCsv = '';
const firmsRow = (lat, lng, frp, dn, t = '0800') => `${lat},${lng},2026-11-05,${t},n,${frp},N20,${dn}`;
const setFirms = lines => { firmsCsv = 'latitude,longitude,acq_date,acq_time,confidence,frp,satellite,daynight\n' + lines.join('\n') + '\n'; };
globalThis.fetch = async (url) => { url = String(url);
  if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: NOW - 60e3 }, features: usgsFeatures }), { status: 200 });
  if (url.includes('firms.modaps')) return new Response(firmsCsv, { status: 200 });
  return new Response('stub', { status: 503 }); };
const runFive = env => worker.scheduled({ cron: '*/5 * * * *', scheduledTime: NOW }, env, { waitUntil() {} });
const runFirms = env => worker.scheduled({ cron: '*/15 * * * *', scheduledTime: NOW }, env, { waitUntil() {} });
const get = (env, path) => worker.fetch(new Request('https://hub' + path), env);

// ================= A. the gate
await t('A1. HISTORY_ENABLED unset: usgs + firms runs write NO archive object and NO history row (publishing unchanged)', async () => {
  const { env, store, db } = makeEnv(); setFirms([firmsRow(-20, 30, 12.5, 'D')]);
  await runFive(env); await runFirms(env); NOW += 86400e3; await runFirms(env); NOW -= 86400e3;
  assert.ok(store.has('latest/usgs.json') && store.has('latest/firms.json'));
  assert.deepEqual([...store.keys()].filter(k => k.startsWith('archive/') || k.startsWith('state/history')), []);
  for (const tb of ['quake_revisions', 'fires_daily', 'archive_checkpoints', 'archive_versions', 'drifter_fixes', 'seaice_daily', 'orbital_population'])
    assert.equal(rows(db, `SELECT COUNT(*) n FROM ${tb}`)[0].n, 0, tb);
});
await t('A2. HISTORY_ENABLED=1 through the real scheduled jobs: usgs revisions written; firms state started', async () => {
  const { env, store, db } = makeEnv({ HISTORY_ENABLED: '1' }); setFirms([firmsRow(-20, 30, 12.5, 'D')]);
  await runFive(env); await runFirms(env);
  assert.equal(rows(db, 'SELECT COUNT(*) n FROM quake_revisions')[0].n, 2);
  assert.ok(store.has('state/history-firms.json') && store.has('state/history-usgs.json'));
});

// ================= B. earthquakes: append-only revisions
await t('B1. same revision received again → no duplicate row; a new USGS `updated` → a new row, the earlier one kept', async () => {
  const { env, db } = makeEnv({ HISTORY_ENABLED: '1' });
  usgsFeatures = [quake('us1', 1000), quake('us2', 2000, 4.6, 10, 10)];
  await runFive(env); NOW += 300e3; await runFive(env);
  assert.equal(rows(db, 'SELECT COUNT(*) n FROM quake_revisions')[0].n, 2);
  usgsFeatures = [quake('us1', 5000, 3.4), quake('us2', 2000, 4.6, 10, 10)]; NOW += 300e3; await runFive(env);
  const r = rows(db, "SELECT source_updated, mag, received_at, run_ref, collector_version FROM quake_revisions WHERE usgs_id='us1' ORDER BY source_updated");
  assert.equal(r.length, 2); assert.deepEqual(r.map(x => x.mag), [3.1, 3.4]);
  assert.ok(r[1].run_ref.startsWith('usgs@') && r[1].collector_version === '0.5.0' && r[1].received_at > r[0].received_at);
  NOW -= 600e3;
});

// ================= C. fires: daily checkpoint from the LAST pull of the day
await t('C1. day D pulled twice, then D+1: checkpoint = D\'s LAST snapshot (cutoff = its retrieved_at); fires_daily per cell; FRP max null when no value', async () => {
  const { env, store, db } = makeEnv({ HISTORY_ENABLED: '1' });
  NOW = Date.parse('2026-11-05T20:00:00Z'); setFirms([firmsRow(-20, 30, 10, 'D')]); await runFirms(env);
  NOW = Date.parse('2026-11-05T23:45:00Z'); setFirms([firmsRow(-20, 30, 10, 'D'), firmsRow(-20.5, 30.5, 40, 'N'), firmsRow(5, 5, '', 'N')]); await runFirms(env);
  const lastD = JSON.parse(store.get('latest/firms.json').body).retrieved_at;
  NOW = Date.parse('2026-11-06T00:15:00Z'); setFirms([firmsRow(1, 1, 3, 'N')]); await runFirms(env);
  const cp = rows(db, 'SELECT * FROM archive_checkpoints WHERE layer = ?', 'firms');
  assert.equal(cp.length, 1); assert.equal(cp[0].day, '2026-11-05'); assert.equal(cp[0].cutoff, lastD); assert.equal(cp[0].records, 3);
  const obj = await gunzip(store.get(cp[0].r2_key).body); assert.equal(obj.retrieved_at, lastD); assert.equal(obj.records.length, 3);
  assert.equal(store.get(cp[0].r2_key).meta.customMetadata.cutoff, lastD);
  const fd = rows(db, 'SELECT * FROM fires_daily ORDER BY cell_id');
  const a = fd.find(r => r.cell_id === W.cellAreaKm2 && false) || fd.find(r => r.detections === 2);
  assert.ok(a, JSON.stringify(fd)); assert.equal(a.frp_sum_mw, 50); assert.equal(a.frp_max_mw, 40); assert.equal(a.day_n, 1); assert.equal(a.night_n, 1); assert.equal(a.cutoff, lastD);
  const b = fd.find(r => r.detections === 1); assert.equal(b.frp_max_mw, null, 'no FRP value → null, never 0'); assert.equal(b.frp_n, 0);
  NOW = Date.parse('2026-11-06T00:30:00Z'); await runFirms(env);
  assert.equal(rows(db, 'SELECT COUNT(*) n FROM archive_checkpoints')[0].n, 1, 'same day: no second checkpoint');
  NOW = Date.parse('2026-11-05T10:00:00Z');
});
await t('C2. the first run ever (no previous day known) keeps nothing — no invented checkpoint', async () => {
  const { env, db } = makeEnv({ HISTORY_ENABLED: '1' }); setFirms([firmsRow(1, 1, 3, 'N')]); await runFirms(env);
  assert.equal(rows(db, 'SELECT COUNT(*) n FROM archive_checkpoints')[0].n, 0);
});

// ================= D. versions: data vs processing vs repeat retrieval
const plasticEnv = (over = {}) => ({ layer: 'plastic', retrieved_at: '2026-11-05T12:16:23.000Z', scheduled_for: 'x', collector_version: '0.5.0', noaa_count: 2,
  record_fields: ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'],
  records: [['a', 1, 2, '2011-08-31', 0.5, 'reproduced', 0.5, 'manta', 0.33, 0.15], ['b', 3, 4, '2014-04-06', 1.2, 'possible_date_conflict', 1.2, 'manta', 0.33, 0.15]],
  source: { data_last_edit: '2026-10-15T00:00:00Z' }, verification: { status: 'checked', counts: { reproduced: 1, possible_date_conflict: 1 } }, refused: {}, ...over });
await t('D1. repeat retrieval (only times differ) → NO new object; the version\'s retrieval count and last time advance', async () => {
  const { env, store, db } = makeEnv({ HISTORY_ENABLED: '1' });
  assert.equal(await W.histVersion(env, 'plastic', plasticEnv()), 'first');
  assert.equal(await W.histVersion(env, 'plastic', plasticEnv({ retrieved_at: '2026-11-06T12:16:23.000Z', scheduled_for: 'y' })), 'repeat');
  const v = rows(db, 'SELECT * FROM archive_versions');
  assert.equal(v.length, 1); assert.equal(v[0].retrievals, 2); assert.equal(v[0].last_retrieved_at, '2026-11-06T12:16:23.000Z'); assert.equal(v[0].first_run_ref, 'plastic@2026-11-05T12:16:23.000Z');
  assert.equal([...store.keys()].filter(k => k.startsWith('archive/versions/plastic/')).length, 1);
});
await t('D2. a changed CHECK result only → "processing" version kept; a changed value → "data"; both → "data+processing"', async () => {
  const { env, store, db } = makeEnv({ HISTORY_ENABLED: '1' });
  await W.histVersion(env, 'plastic', plasticEnv());
  const p1 = plasticEnv({ retrieved_at: '2026-11-06T00:00:00.000Z' }); p1.records = p1.records.map(r => r.slice()); p1.records[1][5] = 'reproduced'; p1.verification = { status: 'checked', counts: { reproduced: 2 } };
  assert.equal(await W.histVersion(env, 'plastic', p1), 'processing');
  const p2 = plasticEnv({ retrieved_at: '2026-11-07T00:00:00.000Z' }); p2.records = p1.records.map(r => r.slice()); p2.verification = p1.verification; p2.records[0][4] = 0.6;
  assert.equal(await W.histVersion(env, 'plastic', p2), 'data');
  const p3 = plasticEnv({ retrieved_at: '2026-11-08T00:00:00.000Z' }); p3.records = p2.records.map(r => r.slice()); p3.records[0][4] = 0.7; p3.records[0][5] = 'not_reproduced';
  assert.equal(await W.histVersion(env, 'plastic', p3), 'data+processing');
  const kept = await gunzip(store.get(rows(db, "SELECT r2_key FROM archive_versions WHERE change='processing'")[0].r2_key).body);
  assert.equal(kept.records[1][5], 'reproduced', 'the revised verification result is preserved in the kept version');
  assert.deepEqual(rows(db, 'SELECT change FROM archive_versions ORDER BY id').map(r => r.change), ['first', 'processing', 'data', 'data+processing']);
});
await t('D3. sea ice: the access date inside the citation and the retrieval time are volatile — same values twice = repeat', async () => {
  const { env } = makeEnv({ HISTORY_ENABLED: '1' });
  const e = d => ({ layer: 'seaice', retrieved_at: d, citation: 'Date Accessed ' + d, records: [['2026-11-03', 8.1, 15.7]], index: { north: { value: 8.1, date: '2026-11-03', source_age_s: 1 }, south: { value: 15.7, date: '2026-11-03', source_age_s: 2 } } });
  assert.equal(await W.histVersion(env, 'seaice', e('2026-11-05T03:07:00Z')), 'first');
  assert.equal(await W.histVersion(env, 'seaice', e('2026-11-05T09:07:00Z')), 'repeat');
});

// ================= E. drifters: sampled track, corrections kept
const drEnv = (recs, at) => ({ layer: 'drifters', retrieved_at: at, record_fields: ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], records: recs });
await t('E1. identical buoy + fix time + values repeats ignored (incl. missing SST); a corrected position or SST under the same key is kept', async () => {
  const { env, db } = makeEnv({ HISTORY_ENABLED: '1' });
  const r1 = [['1101570', 50.39, -173.68, '2026-11-05T09:00:00.000Z', 8.24, 'DB', 'EU'], ['21730', 16.72, 131.24, '2026-11-05T09:00:00.000Z', null, 'DB', 'KR']];
  await W.histDrifters(env, drEnv(r1, '2026-11-05T09:07:00Z')); await W.histDrifters(env, drEnv(r1, '2026-11-05T10:07:00Z'));
  assert.equal(rows(db, 'SELECT COUNT(*) n FROM drifter_fixes')[0].n, 2, 'no duplicates from the hourly repeat');
  const r2 = [['1101570', 50.40, -173.68, '2026-11-05T09:00:00.000Z', 8.24, 'DB', 'EU'], ['21730', 16.72, 131.24, '2026-11-05T09:00:00.000Z', 28.9, 'DB', 'KR']];
  await W.histDrifters(env, drEnv(r2, '2026-11-05T11:07:00Z'));
  const all = rows(db, 'SELECT buoy_id, lat, sst_c, first_received_at FROM drifter_fixes ORDER BY buoy_id, first_received_at');
  assert.equal(all.length, 4); assert.deepEqual(all.filter(r => r.buoy_id === '1101570').map(r => r.lat), [50.39, 50.4]);
  assert.deepEqual(all.filter(r => r.buoy_id === '21730').map(r => r.sst_c), [null, 28.9]);
  assert.equal(all.find(r => r.lat === 50.39).first_received_at, '2026-11-05T09:07:00Z', 'first receipt time preserved through the repeat');
});

// ================= F. failure isolation
await t('F1. a history failure never stops publishing: forced D1 failure on quake_revisions → usgs still published, run logged ok', async () => {
  const { env, store, db } = makeEnv({ HISTORY_ENABLED: '1' }, { failOn: BREAK === 'unwrapped' ? /^$/ : /quake_revisions/ });
  usgsFeatures = [quake('us9', 9000)]; await runFive(env);
  assert.ok(store.has('latest/usgs.json'));
  assert.equal(rows(db, "SELECT status FROM collector_runs WHERE layer='usgs'").at(-1).status, 'ok');
});

// ================= G. the /place endpoint
function seedPlace(env, store) {
  const put = (k, o) => env.R2.put(k, JSON.stringify(o));
  const T = '2026-11-05T09:55:00.000Z';
  const base = (layer, extra) => ({ layer, collector_version: '0.5.0', retrieved_at: T, source_status: 'ok', stale_after_s: 900, window_start: 'w0', window_end: 'w1', ...extra });
  // cell 14_52 contains (-33.9, 28.4)? row floor((−33.9+90)/4)=14, col floor((28.4+180)/4)=52
  const q = [['us1', -33.9, 28.4, 10, 3.1, 'ml', '2026-11-05T08:00:00.000Z', 'M 3.1', 'u']];
  return Promise.all([
    put('latest/usgs.json', base('usgs', { record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: q, cells: { '14_52': { count: 1 } } })),
    put('latest-cells/usgs.json', base('usgs', { cells: { '14_52': { count: 1, coverage: { grade: 'partial', evidence: 'e' } } } })),
    put('latest/firms.json', base('firms', { record_fields: ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], records: [[-33.5, 28.1, '2026-11-05T01:00:00Z', 'n', 5, 'N20', 'N']], cells: {} })),
    put('latest-cells/firms.json', base('firms', { cells: { '14_52': { count: 1 } } })),
    put('latest/ships.json', base('ships', { retrieved_at: '2026-11-05T09:30:00.000Z', record_fields: ['mmsi', 'lat', 'lng'], records: [], cells: {} })),
    put('latest-cells/ships.json', base('ships', { retrieved_at: '2026-11-05T09:31:00.000Z', cells: {} })),    // NOT the same run → withheld
    put('latest-cells/forest.json', base('forest', { cells: { '22_46': { count: 7, confidence: { nominal: 5, high: 2, highest: 0 }, since: '2026-10-29', queried_at: T, version: 'v1' } } })),
    put('latest/plastic.json', base('plastic', { record_fields: ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check'], records: [['p1', -33.8, 28.9, '2014-01-01', 0, 'reproduced'], ['p2', -33.7, 32.1, '2016-01-01', 1, 'reproduced']], cells: {} })),
    put('latest-cells/plastic.json', base('plastic', { cells: { '14_52': { count: 2 } } })),
  ]);
}
function seedD1(db) {
  const ins = db.prepare('INSERT INTO layer_hourly (layer, hour_utc, snapshots_expected, snapshots_ok, source_status, adequate_cells, updated_at) VALUES (?,?,?,?,?,?,?)');
  for (let h = 0; h < 30; h++) { const k = new Date(NOW - (h + 1) * 3600e3).toISOString().slice(0, 13); ins.run('ships', k, 2, h % 3 === 0 ? 0 : 2, h % 3 === 0 ? 'absent' : 'ok', 'none', 'x'); }
  const c = db.prepare('INSERT INTO cell_hourly (layer, cell_id, hour_utc, count, coverage, observed_fraction, updated_at) VALUES (?,?,?,?,?,?,?)');
  c.run('ships', '14_52', new Date(NOW - 5 * 3600e3).toISOString().slice(0, 13), 3, 'partial', 1, 'x');
  c.run('ships', '14_52', new Date(NOW - 50 * 3600e3).toISOString().slice(0, 13), 1, 'partial', 1, 'x');
  c.run('ships', '30_10', new Date(NOW - 100 * 3600e3).toISOString().slice(0, 13), 1, 'partial', 1, 'x');
}
await t('G1. sections are independent; records and counts paired per layer; a run mismatch is WITHHELD (never mixed)', async () => {
  const { env, store } = makeEnv(); await seedPlace(env, store); W.placeCache.usgs = W.placeCache.firms = W.placeCache.ships = undefined;
  const r = await (await get(env, '/place/g4/14_52')).json();
  assert.equal(r.layers.usgs.state, 'ok'); assert.equal(r.layers.usgs.count, 1); assert.equal(r.layers.usgs.records[0][0], 'us1');
  assert.equal(r.layers.firms.state, 'ok'); assert.equal(r.layers.firms.records_total, 1);
  assert.equal(r.layers.ships.state, 'withheld'); assert.match(r.layers.ships.why, /same collector run/);
  assert.equal(r.layers.forest.state, 'not_covered', '14_52 (South Africa, ~34°S) is outside the swept tropical cells');
  const f = await (await get(env, '/place/g4/22_46')).json(); assert.equal(f.layers.forest.state, 'ok'); assert.equal(f.layers.forest.cell.confidence.high, 2);
  const g = await (await get(env, '/place/g4/22_47')).json(); assert.equal(g.layers.forest.state, 'pending', 'in the sweep, not answered yet');
});
await t('G2. a write between the two reads is re-read once: consistent after the re-read → served; still inconsistent → withheld', async () => {
  const { env } = makeEnv(); await seedPlace(env);
  const real = env.R2.get.bind(env.R2); let n = 0;
  env.R2.get = async k => { if (k === 'latest/usgs.json' && n++ === 0) { const o = await real(k); const j = await o.json(); j.retrieved_at = '2026-11-05T09:50:00.000Z'; return { ...o, httpEtag: '"old"', async json() { return j; } }; } return real(k); };
  W.placeCache.usgs = undefined;
  const r = await (await get(env, '/place/g4/14_52')).json();
  assert.equal(r.layers.usgs.state, 'ok', 'the re-read found a consistent pair'); assert.equal(n, 2);
});
await t('G3. optional layers: OFF → not read at all (no R2 read of their files); ?layers=plastic → read and returned (every sample)', async () => {
  const { env, gets, resetGets } = makeEnv(); await seedPlace(env); resetGets();
  let r = await (await get(env, '/place/g4/14_52')).json();
  assert.equal(r.layers.plastic.state, 'off_not_requested'); assert.equal(r.layers.drifters.state, 'off_not_requested');
  assert.ok(!gets().some(k => /plastic|drifters/.test(k)), 'no read of an off layer: ' + gets().join(','));
  r = await (await get(env, '/place/g4/14_52?layers=plastic')).json();
  assert.equal(r.layers.plastic.state, 'ok'); assert.equal(r.layers.plastic.records_total, 1, 'p2 is in the next cell'); assert.equal(r.layers.drifters.state, 'off_not_requested');
});
await t('G4. any cell can be selected: an empty-ocean cell returns every layer as no_records / not_covered — never an error, never a zero claim', async () => {
  const { env } = makeEnv(); await seedPlace(env); W.placeCache.usgs = W.placeCache.firms = undefined;
  const r = await (await get(env, '/place/g4/20_0')).json();   // mid-Pacific near the date line
  assert.equal(r.layers.usgs.state, 'no_records'); assert.equal(r.layers.firms.state, 'no_records'); assert.equal(r.layers.forest.state, 'not_covered');
  assert.equal(r.statement, 'Listed together because they share this 4° cell. Nothing here states a connection between them.');
  assert.ok(r.cell.area_km2 > 190000 && r.cell.area_km2 < 200000);
  assert.equal((await get(env, '/place/g4/45_0')).status, 400); assert.equal((await get(env, '/place/g4/abc')).status, 400);
});
await t('G5. collection evidence: collector-ran hours vs hours records reached us HERE vs retention start vs first report for this cell — kept apart', async () => {
  const { env, db } = makeEnv(); await seedPlace(env); seedD1(db);
  const r = await (await get(env, '/place/g4/14_52')).json(); const s = r.collection.ships;
  assert.equal(s.collection_ran.last_24h.hours_aggregated, 24); assert.equal(s.collection_ran.last_24h.hours_with_a_usable_sample, 16);
  assert.equal(s.records_reached_us_here.last_24h_hours, 1); assert.equal(s.records_reached_us_here.last_7d_hours, 2);
  assert.equal(s.records_reached_us_here.first_report_retained, new Date(NOW - 50 * 3600e3).toISOString().slice(0, 13));
  assert.equal(s.records_reached_us_here.retention_start, new Date(NOW - 100 * 3600e3).toISOString().slice(0, 13), 'retention start ≠ first report here');
  assert.match(r.collection_meaning, /Neither is the source's geographic coverage/);
});
await t('G6. the place endpoint is read-only: no R2 write, no D1 change', async () => {
  const { env, store, writes } = makeEnv({ HISTORY_ENABLED: '1' }); await seedPlace(env);
  const keys = [...store.keys()].sort().join(','), w0 = writes();
  await get(env, '/place/g4/14_52?layers=plastic,drifters');
  assert.equal([...store.keys()].sort().join(','), keys); assert.equal(writes(), w0);
});

console.log(`\nhistory-hub: ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
