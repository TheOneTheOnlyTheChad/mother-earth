/* Aircraft counts and positions (OpenSky) — collector and hub suite. No network: storage is in memory, nothing is uploaded.
 * Run: node phase1/aircraft-counts.test.mjs */
import { openskyPositions, openskyDots, buildEnvelope } from './collector-mac.mjs';
import worker, { validateEnvelope, aircraftProject, aircraftDownNote, aircraftFieldsOk, AIRCRAFT_MAX_AGE_S } from './worker.js';
import fs from 'node:fs';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log('FAIL  ' + n + (got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 400) : '')); } };
const sv = (icao, lng, lat, ground = false, call = 'TEST123 ', tpos = 1794886850) => [icao, call, 'Testland', tpos, 1794886852, lng, lat, 11000, ground, 230, 90, 0, null, 11200, '1000', false, 0];
const J = { time: 1794886853, states: [
  sv('aaaaaa', 18.6, -33.9),            // Cape Town cell 14_49
  sv('bbbbbb', 19.9, -32.1),            // same cell
  sv('cccccc', 2.5, 48.9, true),        // Paris, on the ground
  sv('aaaaaa', 18.7, -33.8),            // duplicate address: dropped
  sv('dddddd', null, null),             // no position
  sv('eeeeee', 180, 90),                // the corner: clamps into the last row and column
  sv('ffffff', 999, 10),                // impossible longitude: treated as no position
  sv('777777', 151.2, -33.9, false, 'OLDPOS  ', 1794886853 - 301),   // position 301 s before the snapshot: over the limit, not counted
  sv('888888', 151.2, -33.9, false, 'EDGEPOS ', 1794886853 - 300),   // exactly 300 s: counted
  sv('999999', 139.7, 35.6, false, 'NOTIME  ', null),                // no position time: not counted
] };
const o = openskyPositions(J);
ok('one position per address, inside the age limit', o.rows.length === 5, o.rows);
ok('duplicates, missing and on-ground are counted', o.duplicates === 1 && o.withoutPosition === 2 && o.onGround === 1 && o.stateVectors === 10, o);
ok('a position older than 300 s or with no time is not counted, and is tallied', o.tooOld === 1 && o.noPositionTime === 1, o);
ok('the age limit is a parameter of the count', openskyPositions(J, 0).rows.length === 0 && openskyPositions(J, 1e6).rows.length === 6);
ok('rows carry latitude and longitude only', o.rows.every(r => r.length === 2 && typeof r[0] === 'number' && typeof r[1] === 'number'), o.rows);
ok('source time comes from the response', o.sourceTime === '2026-11-17T03:40:53.000Z', o.sourceTime);
let threw = 0; for (const bad of [null, {}, { time: 1 }, { states: [] }, { time: 'x', states: [] }]) { try { openskyPositions(bad); } catch (_) { threw++; } }
ok('a response without states or time is refused', threw === 5, threw);

const f = { fields: ['lat', 'lng'], rows: o.rows, countsOnly: true, coverageDefault: { grade: 'partial', evidence: 'volunteer_receivers_only' }, quantity: 'q',
  extra: { stale_after_s: 10800, window_start_override: o.sourceTime, window_end_override: o.sourceTime, citation: 'The OpenSky Network, https://opensky-network.org', records_policy: 'counts per cell only' } };
const e = buildEnvelope('opensky', f, Date.parse('2026-11-17T03:40:54Z'), '2026-11-17T03:40:57.000Z');
ok('cells are counted on the 4-degree grid', e.cells['14_49'] && e.cells['14_49'].count === 2 && e.cells['34_45'].count === 1 && e.cells['44_89'].count === 1 && e.cells['14_82'].count === 1 && Object.keys(e.cells).length === 4, e.cells);
ok('every cell carries the partial coverage grade', Object.values(e.cells).every(c => c.coverage.grade === 'partial' && c.coverage.evidence === 'volunteer_receivers_only'));
ok('a counts-only feed carries NO records and no record fields', Array.isArray(e.records) && e.records.length === 0 && e.record_fields.length === 0 && e.record_format === 'rows', [e.records, e.record_fields]);
const body = JSON.stringify(e);
ok('counts-only: no address, callsign or position appears anywhere in the upload', !/aaaaaa|bbbbbb|cccccc|eeeeee|888888|TEST123|EDGEPOS|Testland|18\.6|-33\.9|48\.9|151\.2/.test(body), body.slice(0, 300));
ok('window is the source time; retrieval time is separate', e.window_start === o.sourceTime && e.window_end === o.sourceTime && e.retrieved_at === '2026-11-17T03:40:57.000Z');
ok('stale limit, citation and policy travel with the counts', e.stale_after_s === 10800 && /OpenSky Network/.test(e.citation) && /counts per cell only/.test(e.records_policy));
ok('override keys do not leak into the envelope', !('window_start_override' in e) && !('window_end_override' in e) && !('source_status_override' in e));

// a records feed still publishes its records (ships path unchanged)
const g = buildEnvelope('mock', { fields: ['id', 'lat', 'lng'], rows: [['x', 1, 2]], coverageDefault: { grade: 'adequate', evidence: 'e' }, quantity: 'q' }, 0, '2026-01-01T00:00:00.000Z');
ok('a feed that is not counts-only keeps its records and fields', g.records.length === 1 && g.record_fields.join() === 'id,lat,lng' && g.cells['22_45'].count === 1, g);

// ---------- positions as published (aircraft-dots-rc)
const dots = openskyDots(o.rows);
ok('one published position per counted aircraft', dots.length === o.rows.length && dots.length === 5, dots);
ok('a published position is exactly [lat, lng], two numbers', dots.every(r => Array.isArray(r) && r.length === 2 && r.every(v => typeof v === 'number' && Number.isFinite(v))), dots);
ok('positions are rounded to 0.01 degree', openskyDots([[-33.90491, 18.60123], [48.8566, 2.3522]]).join() === '-33.9,18.6,48.86,2.35' && dots.every(r => r.every(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9)), dots);
ok('positions are ordered by latitude then longitude, not in the order OpenSky sent them', JSON.stringify(dots) === JSON.stringify([...dots].sort((a, b) => a[0] - b[0] || a[1] - b[1])) && JSON.stringify(openskyDots([[10, 5], [-10, 7], [10, -5], [-10, 3]])) === '[[-10,3],[-10,7],[10,-5],[10,5]]', dots);
ok('rounding never produces a negative zero', JSON.stringify(openskyDots([[-0.001, -0.004]])) === '[[0,0]]');
ok('rounding does not change the input rows (cells are counted from the unrounded positions)', o.rows.some(r => r[0] === -33.9 && r[1] === 18.6));
const fd = { fields: ['lat', 'lng'], rows: [[3.999, 7.996], [-33.9, 18.6]], records: openskyDots([[3.999, 7.996], [-33.9, 18.6]]), coverageDefault: { grade: 'partial', evidence: 'volunteer_receivers_only' }, quantity: 'q', extra: {} };
const ed0 = buildEnvelope('opensky', fd, 0, '2026-01-01T00:00:00.000Z');
ok('a position that rounds across a cell edge is still counted in the cell it was reported in', ed0.cells['23_46'] && ed0.cells['23_46'].count === 1 && !ed0.cells['23_47'] && JSON.stringify(ed0.records) === '[[-33.9,18.6],[4,8]]', [ed0.cells, ed0.records]);
const f2 = { ...f, countsOnly: false, records: dots, extra: { ...f.extra, position_precision_deg: 0.01, records_policy: 'positions only' } };
const e2 = buildEnvelope('opensky', f2, Date.parse('2026-11-17T03:40:54Z'), '2026-11-17T03:40:57.000Z');
ok('the positions envelope: record_fields is exactly lat,lng and the cells are unchanged', e2.record_fields.join() === 'lat,lng' && e2.records.length === 5 && JSON.stringify(e2.cells) === JSON.stringify(e.cells), [e2.record_fields, e2.records.length]);
const body2 = JSON.stringify(e2);
ok('positions envelope: no address, callsign, country, altitude, speed or time of any aircraft', !/aaaaaa|bbbbbb|cccccc|eeeeee|888888|777777|999999|TEST123|EDGEPOS|OLDPOS|NOTIME|Testland|11000|11200|1794886850|"1000"/.test(body2), body2.slice(0, 300));
ok('positions envelope: the total of the cells equals the number of positions', Object.values(e2.cells).reduce((a, c) => a + c.count, 0) === e2.records.length);

// ---------- the hub (worker.js is the authority): validator, what is stored, what is served
const realNow = Date.now; Date.now = () => Date.parse('2026-11-17T03:41:00Z');
ok('hub validator accepts the counts-only envelope', validateEnvelope(e, 'opensky') === null, validateEnvelope(e, 'opensky'));
ok('hub validator accepts lat,lng positions rounded to 0.01 degree', validateEnvelope(e2, 'opensky') === null, validateEnvelope(e2, 'opensky'));
const bad = (fields, records) => validateEnvelope({ ...e2, record_fields: fields, records }, 'opensky');
ok('hub refuses an aircraft upload with an address field', /lat,lng only/.test(bad(['icao24', 'lat', 'lng'], [['aaaaaa', 1, 2]])));
ok('hub refuses an aircraft upload with any third field', /lat,lng only/.test(bad(['lat', 'lng', 'alt'], [[1, 2, 3]])) && /lat,lng only/.test(bad(['lng', 'lat'], [[1, 2]])) && /lat,lng only/.test(bad(['lat'], [[1]])));
ok('hub refuses a value that is not a latitude and longitude', /not a latitude/.test(bad(['lat', 'lng'], [['aaaaaa', 2]])) && /not a latitude/.test(bad(['lat', 'lng'], [[91, 2]])) && /not a latitude/.test(bad(['lat', 'lng'], [[1, 181]])) && /not a latitude/.test(bad(['lat', 'lng'], [[null, 2]])));
ok('hub refuses unrounded positions', /rounded to 0\.01/.test(bad(['lat', 'lng'], [[-33.90491, 18.6]])) && /rounded to 0\.01/.test(bad(['lat', 'lng'], [[-33.9, 18.60123]])));
ok('hub refuses records with no record_fields', /exactly 0 fields|without record_fields/.test(bad([], [[1, 2]])), bad([], [[1, 2]]));
ok('ships are not held to the aircraft rule', validateEnvelope({ ...e2, layer: 'ships', record_fields: ['mmsi', 'lat', 'lng'], records: [['1', 1.23456, 2]] }, 'ships') === null);
ok('aircraftFieldsOk: only [] or exactly lat,lng', aircraftFieldsOk([]) && aircraftFieldsOk(['lat', 'lng']) && !aircraftFieldsOk(['lng', 'lat']) && !aircraftFieldsOk(['lat', 'lng', 'x']) && !aircraftFieldsOk(null));
const own = aircraftProject({ layer: 'opensky', source_status: 'ok', record_fields: ['icao24', 'lat', 'lng', 'callsign'], records: [['aaaaaa', 1, 2, 'TEST123']], cells: {} }, true);
ok('the hub\'s own parked OpenSky rows (addresses, callsigns) would be published without records', own.records.length === 0 && own.record_fields.length === 0 && !/aaaaaa|TEST123/.test(JSON.stringify(own)), own);
ok('hub lists opensky as ingestable', /const INGEST_LAYERS = \[[^\]]*'opensky'/.test(fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8')));

function makeEnv(extra = {}) {
  const store = new Map(), runs = [];
  const R2 = { async put(k, v) { store.set(k, String(v)); }, async get(k) { if (!store.has(k)) return null; const v = store.get(k); return { body: v, httpEtag: '"t"', async text() { return v; }, async json() { return JSON.parse(v); } }; }, async list() { return { objects: [] }; } };
  const stmt = () => ({ bind() { return this; }, async run() { runs.push(1); return {}; }, async first() { return null; }, async all() { return { results: [] }; } });
  return { env: { R2, DB: { prepare: stmt, async batch() { return []; } }, INGEST_KEY: 'k', ADMIN_KEY: 'a', AIRCRAFT_POSITIONS: '1', ...extra }, store, runs };
}
const post = (env, body, key = 'k') => worker.fetch(new Request('https://hub.test/ingest/opensky', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) }), env, { waitUntil() { } });
const get = (env, path, method = 'GET') => worker.fetch(new Request('https://hub.test' + path, { method }), env, { waitUntil() { } });
{
  const { env, store } = makeEnv();
  const r = await post(env, e2); const rj = await r.json();
  ok('hub ingest of a positions envelope: 200, 5 records', r.status === 200 && rj.ok === true && rj.records === 5, rj);
  const keys = [...store.keys()].sort();
  ok('hub writes exactly four objects for it', keys.length === 4 && keys.join() === 'cells/opensky/2026-11-17T03-40Z.json,latest-cells/opensky.json,latest/opensky.json,snapshots/opensky/2026-11-17T03-40Z.json', keys);
  const has = k => /"records"/.test(store.get(k)) && JSON.parse(store.get(k)).records.length > 0;
  ok('positions exist in ONE stored object only: latest/opensky.json', has('latest/opensky.json') && !has('snapshots/opensky/2026-11-17T03-40Z.json') && !has('cells/opensky/2026-11-17T03-40Z.json') && !has('latest-cells/opensky.json'), keys.filter(has));
  ok('the dated copy keeps the cells', Object.keys(JSON.parse(store.get('snapshots/opensky/2026-11-17T03-40Z.json')).cells).length === 4);
  const snap = await (await get(env, '/snapshot/opensky')).json(), cells = await (await get(env, '/cells/opensky')).json();
  ok('/snapshot/opensky serves lat,lng rows; /cells/opensky serves none', snap.record_fields.join() === 'lat,lng' && snap.records.length === 5 && snap.records.every(x => x.length === 2) && !('records' in cells) && !('record_fields' in cells), [snap.record_fields, Object.keys(cells)]);
  // the next upload replaces the positions: nothing of the earlier snapshot's positions remains anywhere
  const e3 = buildEnvelope('opensky', { ...f2, rows: [[10, 20]], records: openskyDots([[10.004, 20.006]]) }, Date.parse('2026-11-17T03:40:58Z'), '2026-11-17T03:40:59.000Z');
  const r3 = await post(env, e3);
  const all = [...store.values()].join('\n');
  ok('a newer upload replaces the positions; the earlier ones are gone from every stored object', r3.status === 200 && JSON.stringify(JSON.parse(store.get('latest/opensky.json')).records) === '[[10,20.01]]' && !/-33\.9,18\.6|48\.9,2\.5/.test(all), all.slice(0, 200));
  // an upload older than latest is archived without positions and does not become latest
  const eOld = buildEnvelope('opensky', f2, Date.parse('2026-11-17T03:39:00Z'), '2026-11-17T03:39:05.000Z');
  const rOld = await post(env, eOld), rOldJ = await rOld.json();
  ok('an older upload is archive-only and its positions are not stored', rOld.status === 200 && /archive only/.test(rOldJ.published) && !/"records":\[\[/.test(store.get('snapshots/opensky/2026-11-17T03-39Z.json')) && JSON.stringify(JSON.parse(store.get('latest/opensky.json')).records) === '[[10,20.01]]', rOldJ);
  const rBad = await post(env, { ...e2, record_fields: ['icao24', 'lat', 'lng'], records: [['aaaaaa', 1, 2]] }), rBadJ = await rBad.json();
  ok('an upload with an address is refused with 422 and nothing of it is stored', rBad.status === 422 && /lat,lng only/.test(rBadJ.why) && ![...store.values()].some(v => /aaaaaa/.test(v)), rBadJ);
  ok('a wrong ingest key is refused', (await post(env, e2, 'x')).status === 403);
}

// ---------- rev 2 (GPT's review of c8bd941): explicit schema, expiry at the hub, immediate stop
const LEAK = /abc123|TEST123|4b1815|leak-me|Testland/;
const dirty = () => { const d = JSON.parse(JSON.stringify(e2));
  d.unexpected = { icao24: 'abc123', callsign: 'TEST123' }; d.icao24 = '4b1815'; d.tracks = [['abc123', 1, 2]];
  d.cells['14_49'].icao24 = 'abc123'; d.cells['14_49'].coverage.callsign = 'TEST123'; d.cells['14_49'].coverage.evidence = 'leak-me abc123';
  d.counts = { state_vectors: 10, counted: 5, on_ground: 1, icao24: 'abc123', list: ['4b1815'] }; d.coverage_default.extra = 'TEST123';
  d.quantity = 'leak-me abc123'; d.records_policy = 'TEST123'; d.cadence = 'abc123'; d.citation = '4b1815'; d.collector_version = 'mac-0.3.4 abc123'; d.interruptions = [{ icao24: 'abc123' }];
  d.note = 'abc123'; d.received_at = 'abc123'; d.ingested_from = 'TEST123'; d.positions = 'published'; return d; };
{
  const { env, store } = makeEnv();
  const r = await post(env, dirty()), rj = await r.json();
  ok('rev2 A. an upload with unexpected fields at every level is accepted (its documented fields are valid)…', r.status === 200 && rj.records === 5 && rj.positions === 'stored', rj);
  const stored = [...store.entries()];
  ok('rev2 A. …and NONE of the unexpected content is in any stored object', stored.length === 4 && !stored.some(([, v]) => LEAK.test(v)), stored.filter(([, v]) => LEAK.test(v)).map(([k]) => k));
  const sr = await get(env, '/snapshot/opensky'), st = await sr.text(), cr = await get(env, '/cells/opensky'), ct = await cr.text();
  ok('rev2 A. …nor in /snapshot/opensky or /cells/opensky', sr.status === 200 && cr.status === 200 && !LEAK.test(st) && !LEAK.test(ct), (st + ct).match(LEAK));
  const sj = JSON.parse(st), KEYS = 'schema_version,collector_version,layer,window_start,window_end,retrieved_at,scheduled_for,source_status,interruptions,stale_after_s,cells,record_format,record_fields,records,coverage_default,quantity,position_age_cutoff_s,counts,position_precision_deg,records_policy,credits_remaining,cadence,citation,received_at,ingested_from,positions,positions_max_age_s';
  ok('rev2 A. /snapshot/opensky has exactly the documented top-level keys', Object.keys(sj).join() === KEYS, Object.keys(sj).join());
  ok('rev2 A. nested objects have exactly their documented keys', Object.keys(sj.cells['14_49']).join() === 'count,coverage' && Object.keys(sj.cells['14_49'].coverage).join() === 'grade,evidence' && sj.cells['14_49'].coverage.evidence === 'unspecified' && Object.keys(sj.counts).join() === 'state_vectors,counted,without_position,position_older_than_cutoff,position_time_missing,duplicate_addresses,on_ground' && sj.counts.without_position === null && Object.keys(sj.coverage_default).join() === 'grade,evidence' && sj.interruptions.length === 0, sj.counts);
  ok('rev2 A. every sentence in the file is the hub\'s own; the version is a version or "unknown"', /^aircraft in one OpenSky Network state snapshot/.test(sj.quantity) && /rounded positions without identifiers/.test(sj.records_policy) && sj.citation === 'The OpenSky Network, https://opensky-network.org' && sj.collector_version === 'unknown' && sj.ingested_from === 'unknown' && sj.positions === 'published', [sj.collector_version, sj.ingested_from]);
  const cj = JSON.parse(ct);
  ok('rev2 A. /cells/opensky: no records keys, counts policy, the same cells', !('records' in cj) && !('record_fields' in cj) && !('record_format' in cj) && !('position_precision_deg' in cj) && /counts per cell only/.test(cj.records_policy) && JSON.stringify(cj.cells) === JSON.stringify(sj.cells));
  ok('rev2 B. both aircraft routes answer no-store', sr.headers.get('Cache-Control') === 'no-store' && cr.headers.get('Cache-Control') === 'no-store', [sr.headers.get('Cache-Control'), cr.headers.get('Cache-Control')]);
  const T0 = Date.parse(e2.window_end), at = async ms => { Date.now = () => ms; return (await get(env, '/snapshot/opensky')).json(); };
  const j1 = await at(T0 + AIRCRAFT_MAX_AGE_S * 1e3 - 1000), j2 = await at(T0 + AIRCRAFT_MAX_AGE_S * 1e3), j3 = await at(T0 + 4 * 3600e3);
  ok('rev2 B. one second under three hours: positions served', j1.positions === 'published' && j1.records.length === 5, j1.positions);
  ok('rev2 B. at three hours, and at four: the hub serves NO coordinates, says so, and still gives the snapshot time and the counts', j2.positions === 'withheld_expired' && j2.records.length === 0 && j2.record_fields.length === 0 && j3.positions === 'withheld_expired' && j3.records.length === 0 && !/-33\.9|48\.9/.test(JSON.stringify(j3)) && j3.window_end === e2.window_end && Object.keys(j3.cells).length === 4 && j3.positions_max_age_s === 10800 && /counts per cell only/.test(j3.records_policy) && !('position_precision_deg' in j3), [j2.positions, j3.positions]);
  const jf = await at(T0 - 3600e3);
  ok('rev2 B. a snapshot time in the future is not served either', jf.positions === 'withheld_expired' && jf.records.length === 0, jf.positions);
  Date.now = () => Date.parse('2026-11-17T03:41:00Z');
  delete env.AIRCRAFT_POSITIONS;
  const off = await (await get(env, '/snapshot/opensky')).json();
  ok('rev2 C. variable removed: the very next request serves no coordinates ("withheld_off"), counts intact', off.positions === 'withheld_off' && off.records.length === 0 && off.record_fields.length === 0 && !/-33\.9|48\.9/.test(JSON.stringify(off)) && Object.keys(off.cells).length === 4, off.positions);
  ok('rev2 C. the stored copy still holds them until cleared (so the clear step matters)', JSON.parse(store.get('latest/opensky.json')).records.length === 5);
  ok('rev2 C. clear-positions needs the admin key and POST', (await get(env, '/admin/aircraft/clear-positions', 'POST')).status === 403 && (await get(env, '/admin/aircraft/clear-positions?key=x', 'POST')).status === 403 && (await get(env, '/admin/aircraft/clear-positions?key=a')).status === 405 && JSON.parse(store.get('latest/opensky.json')).records.length === 5);
  const cl = await (await get(env, '/admin/aircraft/clear-positions?key=a', 'POST')).json();
  ok('rev2 C. clear-positions removes them from storage; nothing with a coordinate is left anywhere', cl.ok && cl.cleared === 5 && cl.positions_variable_on === false && JSON.parse(store.get('latest/opensky.json')).records.length === 0 && ![...store.values()].some(v => /"records":\[\[/.test(v)), cl);
  const cl2 = await (await get(env, '/admin/aircraft/clear-positions?key=a', 'POST')).json();
  ok('rev2 C. clearing again is harmless; /snapshot now reads "none"', cl2.ok && cl2.cleared === 0 && (await (await get(env, '/snapshot/opensky')).json()).positions === 'none');
  const r5 = await post(env, e2), r5j = await r5.json();
  ok('rev2 C. while the variable is off, a positions upload is stored WITHOUT positions and the reply says so', r5.status === 200 && r5j.records === 0 && /not stored/.test(r5j.positions) && ![...store.values()].some(v => /"records":\[\[/.test(v)), r5j);
}
{ // positions are off by default: deploying the hub alone publishes nothing new
  const { env, store } = makeEnv({ AIRCRAFT_POSITIONS: undefined });
  const r = await post(env, e2), rj = await r.json(), sj = await (await get(env, '/snapshot/opensky')).json();
  ok('rev2 D. no variable: positions are neither stored nor served', r.status === 200 && rj.records === 0 && sj.positions === 'none' && sj.records.length === 0 && ![...store.values()].some(v => /"records":\[\[/.test(v)), [rj, sj.positions]);
  for (const v of ['0', 'true', 'on', '']) { env.AIRCRAFT_POSITIONS = v; await post(env, e2); }
  ok('rev2 D. only the exact value "1" switches positions on', ![...store.values()].some(v => /"records":\[\[/.test(v)));
}
{ // the collector that is installed today (mac-0.3.3, counts only) keeps working on the new hub
  const { env, store } = makeEnv({ AIRCRAFT_POSITIONS: undefined });
  const old = { ...e, collector_version: 'mac-0.3.3', position_age_cutoff_s: 300, counts: { state_vectors: 10, counted: 5, without_position: 2, position_older_than_cutoff: 1, position_time_missing: 1, duplicate_addresses: 1, on_ground: 1 }, credits_remaining: 3988 };
  const r = await worker.fetch(new Request('https://hub.test/ingest/opensky', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer k', 'User-Agent': 'mother-earth-mac-0.3.3' }, body: JSON.stringify(old) }), env, { waitUntil() { } });
  const cj = await (await get(env, '/cells/opensky')).json(), sj = await (await get(env, '/snapshot/opensky')).json();
  ok('rev2 E. the counts-only collector installed today is accepted and served as before', r.status === 200 && Object.keys(cj.cells).length === 4 && cj.cells['14_49'].count === 2 && cj.cells['14_49'].coverage.grade === 'partial' && cj.cells['14_49'].coverage.evidence === 'volunteer_receivers_only' && cj.window_end === e.window_end && cj.position_age_cutoff_s === 300 && cj.stale_after_s === 10800 && cj.source_status === 'ok' && cj.counts.counted === 5 && cj.credits_remaining === 3988 && cj.collector_version === 'mac-0.3.3' && cj.ingested_from === 'mother-earth-mac-0.3.3' && !('records' in cj) && sj.records.length === 0 && sj.positions === 'none', cj);
  store.set('latest/opensky.json', JSON.stringify({ ...old, records: [], record_fields: [], unexpected: { icao24: 'abc123' }, quantity: 'leak-me' }));
  store.set('latest-cells/opensky.json', JSON.stringify({ ...old, unexpected: { icao24: 'abc123' }, quantity: 'leak-me' }));
  const t1 = await (await get(env, '/snapshot/opensky')).text(), t2 = await (await get(env, '/cells/opensky')).text();
  ok('rev2 E. a stored file from an earlier hub is projected when served', !LEAK.test(t1) && !LEAK.test(t2) && JSON.parse(t2).cells['14_49'].count === 2, (t1 + t2).match(LEAK));
  store.set('latest/opensky.json', 'not json');
  ok('rev2 E. an unreadable stored file is a 503, never passed through', (await get(env, '/snapshot/opensky')).status === 503);
}
{ // a failed collection: the collector's free-text note is matched to a fixed phrase, never copied
  const { env, store } = makeEnv();
  const down = { schema_version: 1, collector_version: 'mac-0.3.4', layer: 'opensky', retrieved_at: '2026-11-17T03:40:57.000Z', scheduled_for: '2026-11-17T03:40:54.000Z', source_status: 'down', cells: {}, note: 'Error: OpenSky states refused (HTTP 429) abc123 TEST123' };
  const r = await post(env, down), all = [...store.values()].join('\n');
  ok('rev2 F. a down upload stores a fixed phrase and nothing of the free text', r.status === 200 && /OpenSky states request refused \(HTTP 429\)/.test(all) && !LEAK.test(all), all.slice(0, 300));
  ok('rev2 F. unknown failure text becomes "collection failed"', aircraftDownNote('abc123 anything') === 'collection failed' && aircraftDownNote('TypeError: fetch failed') === 'request failed' && aircraftDownNote('TimeoutError: The operation was aborted due to timeout') === 'request timed out');
}
ok('rev2 G. projection drops every row if one row is not a rounded lat,lng; and never keeps records for a down file', aircraftProject({ ...e2, records: [[1, 2], [1.234567, 2]] }, true).records.length === 0 && aircraftProject({ ...e2, source_status: 'down' }, true).records.length === 0 && aircraftProject(e2, false).records.length === 0 && aircraftProject(null, true).layer === 'opensky');
Date.now = realNow;
// the real feed's envelope states its own age limit and the tallies (source text check: the feed needs the network to run)
const src = fs.readFileSync(new URL('./collector-mac.mjs', import.meta.url), 'utf8');
ok('the feed publishes its position-age limit and the excluded tallies', /position_age_cutoff_s: OPENSKY_MAX_POSITION_AGE_S/.test(src) && /position_older_than_cutoff: o\.tooOld/.test(src) && /const OPENSKY_MAX_POSITION_AGE_S = 300;/.test(src));
ok('the feed publishes rounded, re-ordered positions and nothing else per aircraft', /records: openskyDots\(o\.rows\)/.test(src) && /fields: \['lat', 'lng'\]/.test(src) && /position_precision_deg: OPENSKY_DOT_PRECISION_DEG/.test(src) && /const OPENSKY_DOT_PRECISION_DEG = 0\.01;/.test(src) && !/countsOnly: true/.test(src));
ok('an aircraft dry run never prints a position (run.sh sends its output to the log)', /positions not printed/.test(src) && /layer === 'opensky' \? \{ \.\.\.e, records:/.test(src));
ok('an aircraft upload gets one attempt and is never kept as pending', /const tries = noPending \? 1 :/.test(src) && /upload\(e, layer === 'opensky'\)/.test(src));
console.log(`\naircraft-counts+positions: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
