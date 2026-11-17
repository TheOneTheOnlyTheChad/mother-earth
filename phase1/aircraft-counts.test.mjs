/* Aircraft counts (OpenSky) — collector suite. Pure functions only: no network, nothing uploaded.
 * Run: node phase1/aircraft-counts.test.mjs */
import { openskyPositions, buildEnvelope } from './collector-mac.mjs';
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
ok('the envelope carries NO records and no record fields', Array.isArray(e.records) && e.records.length === 0 && e.record_fields.length === 0 && e.record_format === 'rows', [e.records, e.record_fields]);
const body = JSON.stringify(e);
ok('no address, callsign or position appears anywhere in the upload', !/aaaaaa|bbbbbb|cccccc|eeeeee|888888|TEST123|EDGEPOS|Testland|18\.6|-33\.9|48\.9|151\.2/.test(body), body.slice(0, 300));
ok('window is the source time; retrieval time is separate', e.window_start === o.sourceTime && e.window_end === o.sourceTime && e.retrieved_at === '2026-11-17T03:40:57.000Z');
ok('stale limit, citation and policy travel with the counts', e.stale_after_s === 10800 && /OpenSky Network/.test(e.citation) && /counts per cell only/.test(e.records_policy));
ok('override keys do not leak into the envelope', !('window_start_override' in e) && !('window_end_override' in e) && !('source_status_override' in e));

// a records feed still publishes its records (ships path unchanged)
const g = buildEnvelope('mock', { fields: ['id', 'lat', 'lng'], rows: [['x', 1, 2]], coverageDefault: { grade: 'adequate', evidence: 'e' }, quantity: 'q' }, 0, '2026-01-01T00:00:00.000Z');
ok('a feed that is not counts-only keeps its records and fields', g.records.length === 1 && g.record_fields.join() === 'id,lat,lng' && g.cells['22_45'].count === 1, g);

// the hub's own validator accepts the counts-only envelope (worker.js is the authority)
const w = fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8');
const m = /function validateEnvelope\(e, layer\) \{[\s\S]*?\n\}/.exec(w);
const validate = new Function('SCHEMA_VERSION', 'CELL_DEG', m[0] + '; return validateEnvelope;')(1, 4);
const realNow = Date.now; Date.now = () => Date.parse('2026-11-17T03:41:00Z');
ok('hub validator accepts the counts-only envelope', validate(e, 'opensky') === null, validate(e, 'opensky'));
ok('hub lists opensky as ingestable', /const INGEST_LAYERS = \[[^\]]*'opensky'/.test(w));
Date.now = realNow;
// the real feed's envelope states its own age limit and the tallies (source text check: the feed needs the network to run)
const src = fs.readFileSync(new URL('./collector-mac.mjs', import.meta.url), 'utf8');
ok('the feed publishes its position-age limit and the excluded tallies', /position_age_cutoff_s: OPENSKY_MAX_POSITION_AGE_S/.test(src) && /position_older_than_cutoff: o\.tooOld/.test(src) && /const OPENSKY_MAX_POSITION_AGE_S = 300;/.test(src));
ok('an aircraft upload gets one attempt and is never kept as pending', /const tries = noPending \? 1 :/.test(src) && /upload\(e, layer === 'opensky'\)/.test(src));
console.log(`\naircraft-counts: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
