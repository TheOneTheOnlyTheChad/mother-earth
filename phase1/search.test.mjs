/* Mother Earth — limited search: pure-helper tests (thread 5, 2 Nov 2026).
 * No network, no DOM, no hub. Loads app.js with a window shim and exercises
 * ME.parseCoord, ME.kmBetween, ME.markMatch and ME.searchLoaded as tables.
 * Run: node phase1/search.test.mjs    (exit 0 = all pass)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
new Function(readFileSync(join(here, '..', 'app.js'), 'utf8'))();
const ME = globalThis.window.ME;

let pass = 0, fail = 0;
const ok = (name, cond, got) => { if (cond) { pass++; } else { fail++; console.log(`FAIL  ${name}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- parseCoord
// null = not a coordinate attempt (fall through to text search)
for (const q of ['Volcano', 'MAERSK', 'cape town', '', '   ', 'M5.2 quake', 'Hawaii 90']) {
  ok(`parseCoord(${JSON.stringify(q)}) falls through to text`, ME.parseCoord(q) === null, ME.parseCoord(q));
}
// accepted forms — all must land on the same point
for (const q of ['-33.92, 18.42', '-33.92,18.42', '-33.92 18.42', '  -33.92 ,  18.42 ', '33.92S, 18.42E', '33.92 S 18.42 E', 'S33.92 E18.42', '33.92s,18.42e', '−33.92, 18.42']) {
  const r = ME.parseCoord(q);
  ok(`parseCoord(${JSON.stringify(q)}) = -33.92,18.42`, r && r.ok && near(r.lat, -33.92, 1e-9) && near(r.lng, 18.42, 1e-9), r);
}
ok('positive pair', (r => r.ok && r.lat === 35.68 && r.lng === 139.77)(ME.parseCoord('35.68, 139.77')));
ok('integers', (r => r.ok && r.lat === 0 && r.lng === 0)(ME.parseCoord('0, 0')));
ok('explicit plus', (r => r.ok && r.lat === 12 && r.lng === -7)(ME.parseCoord('+12, -7')));
ok('north/west', (r => r.ok && r.lat === 40.7 && r.lng === -74)(ME.parseCoord('40.7N, 74W')));
ok('label is lat-then-lng with hemispheres', ME.parseCoord('-33.92, 18.42').label === '33.920° S, 18.420° E', ME.parseCoord('-33.92, 18.42').label);

// refused, with a reason — never silently reinterpreted
const refused = {
  '95.2, 18.4': /Latitude .*outside −90 to 90/,
  '-91, 0': /Latitude .*outside −90 to 90/,
  '0, 181': /Longitude .*outside −180 to 180/,
  '0, -180.5': /Longitude .*outside −180 to 180/,
  '18.42E, 33.92S': /longitude first/i,
  '18.42E, 33.92': /longitude/i,
  '33.92, 18.42N': /latitude/i,
  '-33.92S, 18.42E': /ambiguous/i,
  '1, 2, 3': /two numbers/i,
  '33.92, ': /two numbers/i,
  "33°55'12\", 18.42": /Degrees, minutes and seconds/i,
};
for (const [q, re] of Object.entries(refused)) {
  const r = ME.parseCoord(q);
  ok(`parseCoord(${JSON.stringify(q)}) refused with a reason`, r && r.ok === false && re.test(r.why), r);
}
// a swapped pair that is in range for both is NOT detectable — it must be accepted as typed, never auto-swapped
ok('in-range swap accepted as typed (order is stated at the input, not guessed)',
  (r => r.ok && r.lat === 18.42 && r.lng === -33.92)(ME.parseCoord('18.42, -33.92')));

// ---------------------------------------------------------------- kmBetween
ok('same point = 0 km', ME.kmBetween(0, 0, 0, 0) === 0);
ok('1° of latitude ≈ 111 km', near(ME.kmBetween(0, 0, 1, 0), 111.19, 0.1), ME.kmBetween(0, 0, 1, 0));
ok('Cape Town → Johannesburg ≈ 1265 km', near(ME.kmBetween(-33.92, 18.42, -26.2, 28.05), 1265, 15), ME.kmBetween(-33.92, 18.42, -26.2, 28.05));
ok('antimeridian is not a wall', near(ME.kmBetween(0, 179.5, 0, -179.5), 111.19, 0.5), ME.kmBetween(0, 179.5, 0, -179.5));
ok('symmetric', ME.kmBetween(10, 20, -30, 40) === ME.kmBetween(-30, 40, 10, 20));

// ---------------------------------------------------------------- markMatch escaping
ok('markMatch escapes around the mark',
  ME.markMatch('<b>Volcano</b> & co', 3, 7) === '&lt;b&gt;<mark>Volcano</mark>&lt;/b&gt; &amp; co', ME.markMatch('<b>Volcano</b> & co', 3, 7));
ok('markMatch escapes inside the mark',
  ME.markMatch('a<script>b', 1, 8) === 'a<mark>&lt;script&gt;</mark>b', ME.markMatch('a<script>b', 1, 8));
ok('markMatch handles a quote-heavy name',
  !/[<>]/.test(ME.markMatch('M/V "Ocean" <x>', 0, 3).replace(/<\/?mark>/g, '')), ME.markMatch('M/V "Ocean" <x>', 0, 3));

// ---------------------------------------------------------------- searchLoaded
const QFIELDS = ['lat', 'lng', 'mag', 'title', 'observed_at'];
const SFIELDS = ['lat', 'lng', 'mmsi', 'name', 'observed_at', 'received_at'];
const FFIELDS = ['lat', 'lng', 'frp_mw', 'observed_at'];
const quakes = [
  { lat: -33.0, lng: 18.0, mag: 4.1, title: '14 km SSW of Volcano, Hawaii', observed_at: '2026-11-02T04:00:00Z' },
  { lat: 10, lng: 20, mag: 5.5, title: '8 km N of Santiago, Chile', observed_at: '2026-11-02T03:00:00Z' },
  { lat: 11, lng: 21, mag: 3.0, title: null, observed_at: '2026-11-02T02:00:00Z' },
];
const ships = [
  { lat: -33.95, lng: 18.45, mmsi: '219018123', name: 'MAERSK CHILE', observed_at: '2026-11-02T05:00:10Z', received_at: '2026-11-02T05:00:11Z' },
  { lat: 0, lng: 0, mmsi: '636092111', name: null, observed_at: null, received_at: '2026-11-02T05:00:12Z' },
];
const fires = [{ lat: -33.80, lng: 18.60, frp_mw: 12, observed_at: '2026-11-02T01:00:00Z' }];
const pools = () => [
  { layer: 'usgs', records: quakes, runId: '2026-11-02T05:00:00Z', fields: QFIELDS },
  { layer: 'firms', records: fires, runId: '2026-11-02T04:45:00Z', fields: FFIELDS },
  { layer: 'ships', records: ships, runId: '2026-11-02T05:00:00Z', fields: SFIELDS },
];

let r = ME.searchLoaded('volcano', pools());
ok('text: case-insensitive title match', r.kind === 'text' && r.total === 1 && r.hits[0].layer === 'usgs', r);
ok('text: match offset points at the matched substring',
  r.hits[0].text.substr(r.hits[0].at, r.hits[0].len).toLowerCase() === 'volcano', r.hits[0]);
ok('text: scope names only layers with searchable text — firms excluded',
  JSON.stringify(r.searched) === JSON.stringify(['usgs', 'ships']), r.searched);
ok('text: considered counts only searched pools', r.considered === quakes.length + ships.length, r.considered);

r = ME.searchLoaded('chile', pools());
ok('text: one word matching two layers returns both', r.total === 2 && new Set(r.hits.map(h => h.layer)).size === 2, r.hits.map(h => h.layer));

r = ME.searchLoaded('21901', pools());
ok('text: MMSI fragment matches', r.total === 1 && r.hits[0].field === 'mmsi', r);
ok('digits shorter than the minimum are refused', ME.searchLoaded('21', pools()).kind === 'short');
// a lone bare number is a text search (MMSI / magnitude fragment), never half a refused coordinate
ok('a lone number falls through to text, not badcoord', ME.parseCoord('33.92') === null, ME.parseCoord('33.92'));
ok('a lone number that finds nothing offers the coordinate order',
  (x => x.kind === 'text' && x.total === 0 && x.couldBeCoord === true)(ME.searchLoaded('33.92', pools())), ME.searchLoaded('33.92', pools()));
ok('a lone number that DOES match does not nag about coordinates',
  (x => x.total === 1 && !x.couldBeCoord)(ME.searchLoaded('219018123', pools())), ME.searchLoaded('219018123', pools()));
ok('one character is refused', ME.searchLoaded('v', pools()).kind === 'short');
ok('text: a null field is skipped, not stringified', ME.searchLoaded('null', pools()).total === 0, ME.searchLoaded('null', pools()));
ok('text: no match says so with zero hits', (x => x.kind === 'text' && x.total === 0 && x.hits.length === 0)(ME.searchLoaded('zzzz', pools())));

// a layer whose envelope omits the text field is not searched on it
r = ME.searchLoaded('volcano', [{ layer: 'usgs', records: quakes, runId: 'r', fields: ['lat', 'lng', 'mag'] }]);
ok('text: a field the envelope did not publish is never searched', r.total === 0 && r.searched.length === 0, r);

// cap and true total
const many = Array.from({ length: 30 }, (_, i) => ({ lat: 0, lng: 0, mag: 1, title: 'Volcano ' + i, observed_at: '2026-11-02T00:00:00Z' }));
r = ME.searchLoaded('volcano', [{ layer: 'usgs', records: many, runId: 'r', fields: QFIELDS }]);
ok(`text: capped at ${ME.MAX_RESULTS} with the true total kept`, r.total === 30 && r.hits.length === ME.MAX_RESULTS, { total: r.total, shown: r.hits.length });

// coordinates
r = ME.searchLoaded('-33.92, 18.42', pools());
ok('coord: kind and label', r.kind === 'coord' && r.coord.label === '33.920° S, 18.420° E', r.coord);
ok('coord: nearest first', r.hits.length >= 2 && r.hits.every((h, i) => i === 0 || h.km >= r.hits[i - 1].km), r.hits.map(h => [h.layer, Math.round(h.km)]));
ok('coord: the ship 4 km away is first', r.hits[0].layer === 'ships', r.hits[0]);
ok('coord: fires take part in a coordinate search', r.hits.some(h => h.layer === 'firms'), r.hits.map(h => h.layer));
ok('coord: every hit is inside the radius', r.hits.every(h => h.km <= ME.SEARCH_RADIUS_KM), r.hits.map(h => h.km));
ok('coord: the quake 1500 km away is excluded', !r.hits.some(h => h.layer === 'usgs' && h.rec.mag === 5.5), r.hits.map(h => h.layer));

r = ME.searchLoaded('60, -40', pools());
ok('coord: empty result is still kind=coord so the Go-to row can be offered', r.kind === 'coord' && r.total === 0, r);

r = ME.searchLoaded('0, 0', pools());
ok('coord: a record with a null observation time is still locatable', r.hits.some(h => h.rec.mmsi === '636092111'), r.hits.map(h => h.layer));

// radius edge
const edge = [{ lat: 0, lng: 0, mag: 1, title: 'x', observed_at: 'z' }];
const atKm = km => ME.searchLoaded(`${km / 111.19}, 0`, [{ layer: 'usgs', records: edge, runId: 'r', fields: QFIELDS }]).total;
ok('coord: just inside the radius is included', atKm(ME.SEARCH_RADIUS_KM - 2) === 1);
ok('coord: just outside the radius is excluded', atKm(ME.SEARCH_RADIUS_KM + 2) === 0);

// bad coordinates never become a text search
ok('coord: out-of-range is refused, not searched as text', ME.searchLoaded('95, 0', pools()).kind === 'badcoord');

// no pools at all (every layer hidden / unknown / withheld)
ok('text: no searchable pool gives zero and names nothing as searched',
  (x => x.kind === 'text' && x.total === 0 && x.searched.length === 0)(ME.searchLoaded('volcano', [])));
ok('coord: no pool still yields a coordinate to go to',
  (x => x.kind === 'coord' && x.total === 0 && x.coord.ok)(ME.searchLoaded('-33.92, 18.42', [])));

// every hit carries its own layer + run id, which is what per-layer invalidation hangs on
r = ME.searchLoaded('chile', pools());
ok('every hit carries its own layer and run id', r.hits.every(h => h.layer && h.runId) && new Set(r.hits.map(h => h.runId)).size >= 1, r.hits.map(h => [h.layer, h.runId]));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
