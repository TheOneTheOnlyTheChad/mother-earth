// 5 Nov 2026 FIRMS recovery, rev 2 — workspace only. Runs the hub's own functions (worker.js @ 2ee3a62, hub 0.5.2)
// on preserved inputs. Writes nothing anywhere except ./out. No network, no D1, no R2.
//
// Order: (1) check the inputs' hashes, (2) compute everything, (3) check every figure against the pinned values
// verified independently (GPT, 6 Nov 2026), (4) only if ALL checks pass, write ./out. Any mismatch: nothing is
// written, exit code 1. ./out must not exist beforehand, so a failed run can never leave write-ready files behind.
//
// Usage: RECOVERY_CREATED_AT=<ISO time> node --no-warnings recover.mjs
// RECOVERY_CREATED_AT is the time this record was made; pass the same value to reproduce the outputs byte for byte.
import fs from 'node:fs'; import crypto from 'node:crypto'; import zlib from 'node:zlib';
const W = await import('./worker-2ee3a62-exports.mjs');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const IN = './in/', OUT = './out/', DAY = '2026-11-05';
const CREATED = process.env.RECOVERY_CREATED_AT;
if (!CREATED || isNaN(Date.parse(CREATED)) || new Date(CREATED).toISOString() !== CREATED) { console.error('RECOVERY_CREATED_AT must be an ISO time like 2026-11-06T08:30:00.000Z'); process.exit(2); }
if (fs.existsSync(OUT)) { console.error('./out already exists — move it aside first; this script only writes into a fresh ./out'); process.exit(2); }

// ---- pinned facts
const PIN = {
  inputs: {
    orig: { file: 'checkpoint-firms-2026-11-05.json', bytes: 2955920, sha256: '1a61adf2e9149ad21a4bc55f986406e95380c596d222e002d1c46bf834648bb0' },
    raw1530: { file: '2026-11-05T15-30Z.csv', bytes: 3833218, sha256: 'de6c53975d5228641b3cda1da4301c7e0084fc16744a84733f59d7a5df957c31' },
    raw2345: { file: '2026-11-05T23-45Z.csv', bytes: 5311642, sha256: 'c3487dcc3e063db3dcbc7f76f272e00aaaf1bded83906c79b4c180619262bab8' },
  },
  worker_copy_sha256: '46624a3de0e26f917b4e186ac13aec4961ad7b60b795c1083249b54c0696fb32',   // worker.js @ 2ee3a62 + test exports
  original: { records: 46009, cells: 555, detections: 46009, day_n: 37899, night_n: 8110, frp_n: 46009, frp_max_mw: 746.34, last_observation_at: '2026-11-05T11:55:00Z' },
  recovery: { rows: 63614, distinct_parsed_records: 63591, duplicate_excess_rows: 23, cells: 641, day_n: 48826, night_n: 14788, frp_n: 63614, frp_max_mw: 746.34,
    last_observation_at: '2026-11-05T21:36:00Z', original_records_absent: 23, cells_only_in_original: 0, cells_only_in_recovery: 86 },
};
// Facts about the input object and its run, from outside the files (sources named)
const INPUT_R2_KEY = 'raw/firms/2026-11-05T23-45Z.csv';
const INPUT_R2_UPLOADED_AT = '2026-11-05T23:45:43.250Z';   // R2 last_modified of the raw object (read 6 Nov 2026). NOT a retrieval time.
const INPUT_RUN = { finished_at: '2026-11-05T23:45:43.686Z', status: 'not processed',
  reason: 'raw archived; processing skipped: resource guard (size > limit)',
  source: 'hub /status archive_health.last_completed[firms].coverage (failure_last_at, failure_reasons), read 2026-11-06T07:54Z' };

const fails = [];
const check = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };

// ---- 1. inputs
const rd = f => fs.readFileSync(IN + f);
const prov = {};
for (const [k, p] of Object.entries(PIN.inputs)) { const b = rd(p.file); prov[k] = { file: p.file, bytes: b.length, sha256: sha(b) }; check(`input ${p.file}`, prov[k], p); }
check('worker copy sha256', sha(fs.readFileSync('./worker-2ee3a62-exports.mjs')), PIN.worker_copy_sha256);
if (fails.length) { console.error('STOP — input mismatch, nothing written:\n' + fails.join('\n')); process.exit(1); }

// ---- 2. compute
const orig = JSON.parse(rd(PIN.inputs.orig.file).toString('utf8'));
const agg = by => { let det = 0, d = 0, n = 0, frpN = 0, max = null; for (const c of Object.values(by)) { det += c.n; d += c.day; n += c.night; frpN += c.frpN; if (c.frpMax !== null) max = max === null ? c.frpMax : Math.max(max, c.frpMax); } return { cells: Object.keys(by).length, detections: det, day_n: d, night_n: n, frp_n: frpN, frp_max_mw: max }; };
const lastObs = (rows, f) => { const i = f.indexOf('observed_at'); let m = null; for (const r of rows) if (!m || r[i] > m) m = r[i]; return m; };
const dates = (rows, f) => { const i = f.indexOf('observed_at'), o = {}; for (const r of rows) { const k = r[i].slice(0, 10); o[k] = (o[k] || 0) + 1; } return o; };
// A. the harness reproduces the original checkpoint
const p15 = W.firmsParse(rd(PIN.inputs.raw1530.file).toString('utf8'));
const byOrig = W.firesDaily(orig);
const A = { original: { retrieved_at: orig.retrieved_at, collector_version: orig.collector_version, raw: orig.raw, records: orig.records.length,
    last_observation_at: lastObs(orig.records, orig.record_fields), observed_dates: dates(orig.records, orig.record_fields), ...agg(byOrig) },
  reparse_15_30_with_0_5_2: { rows: p15.rows.length, same_fields: JSON.stringify(p15.fields) === JSON.stringify(orig.record_fields), identical_rows_in_order: JSON.stringify(p15.rows) === JSON.stringify(orig.records) } };
// B. recovery from the 23:45 raw object
const p23 = W.firmsParse(rd(PIN.inputs.raw2345.file).toString('utf8'));
const byRec = W.firesDaily({ record_fields: p23.fields, records: p23.rows });
const key = r => JSON.stringify(r);
const cnt = rows => { const m = new Map(); for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1); return m; };
const setO = cnt(orig.records), setR = cnt(p23.rows);
let excess = 0; for (const n of setR.values()) excess += n - 1;
let absent = 0; for (const [k, n] of setO) absent += Math.max(0, n - (setR.get(k) || 0));
const B = { rows: p23.rows.length, distinct_parsed_records: setR.size, duplicate_excess_rows: excess,
  last_observation_at: lastObs(p23.rows, p23.fields), observed_dates: dates(p23.rows, p23.fields), ...agg(byRec) };
const cellsO = new Set(Object.keys(byOrig)), cellsR = new Set(Object.keys(byRec));
const diff = [...new Set([...cellsO, ...cellsR])].sort().map(id => { const o = byOrig[id], r = byRec[id]; return [id, o ? o.n : 0, r ? r.n : 0, (r ? r.n : 0) - (o ? o.n : 0)]; });
const C = { original_records_absent_from_recovery: absent, original_records_also_in_recovery: orig.records.length - absent,
  cells_only_in_original: [...cellsO].filter(x => !cellsR.has(x)).length, cells_only_in_recovery: [...cellsR].filter(x => !cellsO.has(x)).length,
  cells_fewer_detections_in_recovery: diff.filter(d => d[3] < 0).map(d => d[0]), detections_added: B.detections - A.original.detections };

// ---- 3. checks
for (const [k, v] of Object.entries(PIN.original)) check(`original.${k}`, A.original[k], v);
check('original observed dates', A.original.observed_dates, { [DAY]: PIN.original.records });
check('0.5.2 re-parse of 15:30 = original', A.reparse_15_30_with_0_5_2, { rows: 46009, same_fields: true, identical_rows_in_order: true });
check('recovery.rows', B.rows, PIN.recovery.rows); check('recovery.detections = rows', B.detections, PIN.recovery.rows);
for (const k of ['distinct_parsed_records', 'duplicate_excess_rows', 'cells', 'day_n', 'night_n', 'frp_n', 'frp_max_mw', 'last_observation_at']) check(`recovery.${k}`, B[k], PIN.recovery[k]);
check('recovery rows - distinct = excess', B.rows - B.distinct_parsed_records, B.duplicate_excess_rows);
check('recovery observed dates', B.observed_dates, { [DAY]: PIN.recovery.rows });
check('original records absent', C.original_records_absent_from_recovery, PIN.recovery.original_records_absent);
check('cells only in original', C.cells_only_in_original, PIN.recovery.cells_only_in_original);
check('cells only in recovery', C.cells_only_in_recovery, PIN.recovery.cells_only_in_recovery);
check('day+night = rows', B.day_n + B.night_n, B.rows);

// ---- the record (built, then checked again after a gzip round trip)
const RECOVERY_REF = `recovery-generated:firms:${DAY}:${PIN.inputs.raw2345.sha256.slice(0, 12)}`;
const r1 = x => x === null ? null : Math.round(x * 10) / 10;
const cellRows = Object.entries(byRec).sort(([a], [b]) => a < b ? -1 : 1).map(([id, c]) => [id, c.n, r1(c.frpSum), c.frpMax, c.frpN, c.day, c.night]);
const record = {
  kind: 'recovery', layer: 'firms', day: DAY, recovery_ref: RECOVERY_REF,
  label: 'RECOVERED — made after the day, outside the hub, from a raw object the hub archived but did not process (4 MB resource guard). Not the original checkpoint, not a hub run, and not a complete record of the UTC day.',
  recovers: { checkpoint_r2_key: 'archive/checkpoints/firms/2026-11-05.json.gz', original_snapshot_retrieved_at: orig.retrieved_at, original_records: orig.records.length,
    note: 'The original checkpoint, its metadata, archive_checkpoints and fires_daily are unchanged by this record.' },
  times: {
    observations: { observed_date: DAY, latest_observation_at: B.last_observation_at,
      note: "This file's latest observation is 21:36 UTC. It does not establish a fixed end-of-day gap for any other day." },
    input_r2_uploaded_at: INPUT_R2_UPLOADED_AT,
    input_retrieved_at: null,
    input_retrieved_at_note: 'Unavailable. The run that fetched this file made no snapshot and recorded no retrieval time; the R2 upload time above is when the raw object was stored, not an exact retrieval time.',
    recovery_created_at: CREATED,
  },
  input: { r2_key: INPUT_R2_KEY, bytes: PIN.inputs.raw2345.bytes, sha256: PIN.inputs.raw2345.sha256,
    preserved_copy: "Chad's Mac: ~/Documents/Mother Earth/research/firms-recovery/2026-11-05/in/2026-11-05T23-45Z.csv" },
  input_run: { ...INPUT_RUN, note: 'This is the run whose raw object is the input. It archived the file but did not process it; this recovery processes it. It is described here, not counted as a failure.' },
  run_history: { assessed: false, note: "Run history for 5 Nov was not assessed for this record (D1 not read). Nothing here states the day's run failures, their absence, or coverage." },
  processed_with: { worker_commit: '2ee3a62', worker_sha256: '70307d5fc2a9afed5f04fb1929468a9b60d55f51e412e55d590d7c6e8596824a', collector_version: '0.5.2', functions: ['firmsParse', 'firesDaily'],
    made_where: 'Claude workspace (not the hub)', validated: 'Reproduces the original checkpoint exactly from its own input; figures independently verified (GPT, 6 Nov 2026).' },
  counting: { method: 'as delivered — every row in the source file counts once, matching the hub', rows: B.rows,
    distinct_parsed_records: B.distinct_parsed_records, duplicate_excess_rows: B.duplicate_excess_rows },
  limitations: [
    `Counts are as delivered, matching the hub's counting method: ${B.rows} rows; ${B.distinct_parsed_records} distinct parsed records; ${B.duplicate_excess_rows} duplicate excess rows (exact repeated lines in the source file).`,
    `${C.original_records_absent_from_recovery} records in the original checkpoint are absent from this later source file. The reason is unknown.`,
    'This is a later source snapshot (one file, uploaded 23:45:43 UTC). It is not a union of the day\'s files and not a complete record of the UTC day.',
    "The input's retrieval time is unavailable; input_r2_uploaded_at is the R2 upload time of the raw object.",
    'Run history was not assessed. Nothing here implies zero failures or complete coverage.',
    'FIRMS gives no row count, so no check proves the download was complete; malformed rows are refused by the parser.',
  ],
  daily_cells: { fields: ['cell_id', 'detections', 'frp_sum_mw', 'frp_max_mw', 'frp_n', 'day_n', 'night_n'],
    note: "Per-cell aggregates by the hub's firesDaily, rounded as the hub writes fires_daily (frp_sum to 0.1 MW).", rows: cellRows },
  record_fields: p23.fields, records: p23.rows,
};
const json = JSON.stringify(record);
const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
const back = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
check('round trip: records', back.records.length === B.rows && key(back.records) === key(p23.rows), true);
check('round trip: cells', back.daily_cells.rows.length, PIN.recovery.cells);
check('round trip: cell detections sum', back.daily_cells.rows.reduce((s, r) => s + r[1], 0), B.rows);

if (fails.length) { console.error('STOP — validation failed, nothing written:\n' + fails.join('\n')); process.exit(1); }

// ---- 4. write (only reached when every check passed)
fs.mkdirSync(OUT);
const hdr = 'cell_id,day,detections,frp_sum_mw,frp_max_mw,frp_n,day_n,night_n,input_r2_uploaded_at,recovery_ref,collector_version';
fs.writeFileSync(OUT + 'fires_daily-recovered-2026-11-05.csv', hdr + '\n' + cellRows.map(([id, ...v]) => [id, DAY, ...v, INPUT_R2_UPLOADED_AT, RECOVERY_REF, '0.5.2'].map(x => x === null ? '' : x).join(',')).join('\n') + '\n');
fs.writeFileSync(OUT + 'cells-diff-2026-11-05.csv', 'cell_id,original_detections,recovered_detections,change\n' + diff.map(d => d.join(',')).join('\n') + '\n');
fs.writeFileSync(OUT + 'recovery-firms-2026-11-05.json.gz', gz);
const summary = { status: 'all checks passed', recovery_created_at: CREATED, inputs: prov, A_validation: A, B_recovery: B, C_comparison: C,
  input_r2_uploaded_at: INPUT_R2_UPLOADED_AT, input_run: INPUT_RUN, run_history_assessed: false, recovery_ref: RECOVERY_REF,
  outputs: { record_gz: { file: 'recovery-firms-2026-11-05.json.gz', bytes: gz.length, sha256: sha(gz) }, record_json_bytes: Buffer.byteLength(json), record_json_sha256: sha(json), daily_cells: cellRows.length },
  harness: { worker_copy_sha256: PIN.worker_copy_sha256, node: process.version } };
fs.writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1) + '\n');
for (const f of fs.readdirSync(OUT).sort()) { const b = fs.readFileSync(OUT + f); console.log(`${f}\t${b.length}\t${sha(b)}`); }
