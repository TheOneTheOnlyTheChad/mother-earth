// 5 Nov 2026 FIRMS recovery — workspace only. Runs the hub's own functions (worker.js @ 2ee3a62, 0.5.2) on preserved inputs.
// Writes nothing anywhere except ./out. No network, no D1, no R2.
import fs from 'node:fs'; import crypto from 'node:crypto'; import zlib from 'node:zlib';
const W = await import('./worker-2ee3a62-exports.mjs');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const IN = './in/', OUT = './out/', DAY = '2026-11-05';
const rd = f => fs.readFileSync(IN + f);
const inputs = { orig: 'checkpoint-firms-2026-11-05.json', raw1530: '2026-11-05T15-30Z.csv', raw2345: '2026-11-05T23-45Z.csv' };
const prov = Object.fromEntries(Object.entries(inputs).map(([k, f]) => [k, { file: f, bytes: rd(f).length, sha256: sha(rd(f)) }]));
const orig = JSON.parse(rd(inputs.orig).toString('utf8'));
const agg = by => { let det = 0, d = 0, n = 0, frpN = 0, max = null; for (const c of Object.values(by)) { det += c.n; d += c.day; n += c.night; frpN += c.frpN; if (c.frpMax !== null) max = max === null ? c.frpMax : Math.max(max, c.frpMax); } return { cells: Object.keys(by).length, detections: det, day_n: d, night_n: n, frp_n: frpN, frp_max_mw: max }; };
const lastObs = (rows, f) => { const i = f.indexOf('observed_at'); let m = null; for (const r of rows) if (!m || r[i] > m) m = r[i]; return m; };
const dates = (rows, f) => { const i = f.indexOf('observed_at'), o = {}; for (const r of rows) { const k = r[i].slice(0, 10); o[k] = (o[k] || 0) + 1; } return o; };
// ---- A. validation: does this harness reproduce the original checkpoint?
const p15 = W.firmsParse(rd(inputs.raw1530).toString('utf8'));
const sameFields = JSON.stringify(p15.fields) === JSON.stringify(orig.record_fields);
const sameRows = JSON.stringify(p15.rows) === JSON.stringify(orig.records);
const byOrig = W.firesDaily(orig);
const A = { original: { retrieved_at: orig.retrieved_at, collector_version: orig.collector_version, source_status: orig.source_status, window_start: orig.window_start, window_end: orig.window_end, raw: orig.raw, records: orig.records.length, last_observation_at: lastObs(orig.records, orig.record_fields), observed_dates: dates(orig.records, orig.record_fields), ...agg(byOrig) },
  status_md_expected: { cells: 555, detections: 46009, day_n: 37899, night_n: 8110, frp_n: 46009, frp_max_mw: 746.34 },
  reparse_15_30_with_0_5_2: { rows: p15.rows.length, same_fields: sameFields, identical_rows_in_order: sameRows } };
A.matches_status_md = Object.entries(A.status_md_expected).every(([k, v]) => A.original[k] === v);
// ---- B. recovery from the 23:45 raw file (latest retrieval of the day)
const p23 = W.firmsParse(rd(inputs.raw2345).toString('utf8'));
const e23 = { record_fields: p23.fields, records: p23.rows };
const byRec = W.firesDaily(e23);
const RAW_UPLOADED = '2026-11-05T23:45:43.250Z';   // R2 last_modified of raw/firms/2026-11-05T23-45Z.csv (read 6 Nov); the hub never made a snapshot of this run
const fakeDb = { prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) };   // no D1: failures after cutoff stated in the review, not queried
const cov = await W.checkpointCoverage({ DB: fakeDb }, 'firms', DAY, RAW_UPLOADED, p23.rows, p23.fields, Date.parse('2026-11-06T00:00:00Z'), false);
const B = { input: { r2_key: 'raw/firms/2026-11-05T23-45Z.csv', uploaded_at: RAW_UPLOADED, ...prov.raw2345 }, records: p23.rows.length, last_observation_at: lastObs(p23.rows, p23.fields), observed_dates: dates(p23.rows, p23.fields), ...agg(byRec),
  coverage_fields_from_hub_function: { input_age_at_day_end_s: cov.input_age_at_day_end_s, input_status_without_run_history: cov.input_status } };
// ---- C. comparison original vs recovery
const key = r => JSON.stringify(r);
const setO = new Map(); for (const r of orig.records) setO.set(key(r), (setO.get(key(r)) || 0) + 1);
const setR = new Map(); for (const r of p23.rows) setR.set(key(r), (setR.get(key(r)) || 0) + 1);
let inBoth = 0, onlyO = 0; for (const [k, n] of setO) { const m = setR.get(k) || 0; inBoth += Math.min(n, m); onlyO += Math.max(0, n - m); }
const dupO = [...setO.values()].filter(n => n > 1).length, dupR = [...setR.values()].filter(n => n > 1).length;
// original rows absent from 23:45: same position+time but changed fields?
const pk = r => r[0] + ',' + r[1] + ',' + r[2] + ',' + r[5];
const posR = new Map(); for (const r of p23.rows) posR.set(pk(r), r);
let changedAtSamePos = 0, gone = 0; const changedFields = {};
for (const r of orig.records) if (!setR.has(key(r))) { const q = posR.get(pk(r)); if (q) { changedAtSamePos++; r.forEach((v, i) => { if (v !== q[i]) changedFields[orig.record_fields[i]] = (changedFields[orig.record_fields[i]] || 0) + 1; }); } else gone++; }
const iObs = p23.fields.indexOf('observed_at');
const after1530 = p23.rows.filter(r => r[iObs] > A.original.last_observation_at).length;
const cellsO = new Set(Object.keys(byOrig)), cellsR = new Set(Object.keys(byRec));
const diff = [...new Set([...cellsO, ...cellsR])].sort().map(id => { const o = byOrig[id], r = byRec[id]; return [id, o ? o.n : 0, r ? r.n : 0, (r ? r.n : 0) - (o ? o.n : 0)]; });
const C = { original_rows_also_in_recovery_identical: inBoth, original_rows_not_in_recovery: onlyO, of_which_same_position_time_satellite_but_changed: changedAtSamePos, changed_fields: changedFields, of_which_absent: gone,
  recovery_rows_observed_after_original_last_observation: after1530, duplicate_row_values: { original: dupO, recovery: dupR },
  cells_only_in_original: [...cellsO].filter(x => !cellsR.has(x)).length, cells_only_in_recovery: [...cellsR].filter(x => !cellsO.has(x)).length,
  cells_fewer_detections_in_recovery: diff.filter(d => d[3] < 0).length, detections_added: B.detections - A.original.detections };
// ---- outputs
const fmt = (id, c, cutoff, ref) => [id, DAY, c.n, c.frpSum === null ? null : Math.round(c.frpSum * 10) / 10, c.frpMax, c.frpN, c.day, c.night, cutoff, ref, '0.5.2'];
const ref = W.runRef('firms', RAW_UPLOADED);
const rows = Object.entries(byRec).sort(([a], [b]) => a < b ? -1 : 1).map(([id, c]) => fmt(id, c, RAW_UPLOADED, ref));
const hdr = 'cell_id,day,detections,frp_sum_mw,frp_max_mw,frp_n,day_n,night_n,cutoff,run_ref,collector_version';
fs.writeFileSync(OUT + 'fires_daily-recovered-2026-11-05.csv', hdr + '\n' + rows.map(r => r.map(v => v === null ? '' : v).join(',')).join('\n') + '\n');
fs.writeFileSync(OUT + 'cells-diff-2026-11-05.csv', 'cell_id,original_detections,recovered_detections,change\n' + diff.map(d => d.join(',')).join('\n') + '\n');
const record = { kind: 'recovery', layer: 'firms', day: DAY, label: 'RECOVERED — made after the day from a raw file the hub archived but did not process (4 MB resource guard); not the original checkpoint',
  recovers: { checkpoint_r2_key: 'archive/checkpoints/firms/2026-11-05.json.gz', original_cutoff: orig.retrieved_at, original_records: orig.records.length },
  input: B.input, processed_with: { worker_commit: '2ee3a62', collector_version: '0.5.2', functions: ['firmsParse', 'firesDaily'] }, made_where: 'Claude workspace (not the hub)', made_on: '2026-11-06',
  cutoff: RAW_UPLOADED, cutoff_meaning: 'R2 upload time of the raw file (the hub records retrieval at upload; no snapshot was made for this run)', last_observation_at: B.last_observation_at,
  record_fields: p23.fields, records: p23.rows };
const gz = zlib.gzipSync(JSON.stringify(record)); fs.writeFileSync(OUT + 'recovery-firms-2026-11-05.json.gz', gz);
const summary = { inputs: prov, A_validation: A, B_recovery: B, C_comparison: C, outputs: { fires_daily_rows: rows.length, record_gz_bytes: gz.length, record_gz_sha256: sha(gz) }, harness: { worker_copy_sha256: sha(fs.readFileSync('./worker-2ee3a62-exports.mjs')), node: process.version } };
fs.writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
