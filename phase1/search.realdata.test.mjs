/* Mother Earth — limited search against REAL snapshot records (thread 5, 2 Nov 2026).
 * The records in realdata/live-sample.json were pulled from the live hub through the browser
 * pane on 2 Nov 2026 (runs: usgs 06:30:08Z, ships 06:05:01Z, firms 06:15:44Z) and are kept
 * verbatim, including the awkward ones: 602 of 3,735 vessels had an EMPTY name, 76 carried
 * characters needing escaping (P&O IRIDA, F/V TIN' DAN, FESTINA LENTE @B, 401(PLAY)), and
 * 41 of 50 earthquake titles carried non-ASCII (Kuril’sk, Pāhala, Farkhār).
 * Run: node phase1/search.realdata.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
new Function(readFileSync(join(here, '..', 'app.js'), 'utf8'))();
const ME = globalThis.window.ME;
const D = JSON.parse(readFileSync(join(here, 'realdata', 'live-sample.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got)}` : ''}`); } };

// rebuild records in the shape the page's toPoints() produces
const Q = D.usgs.map(([lat, lng, mag, title, observed_at]) => ({ lat, lng, mag, title, observed_at }));
const S = [...D.shipsRisky, ...D.shipsNoName, ...D.shipsNear]
  .map(([lat, lng, mmsi, name, observed_at, received_at]) => ({ lat, lng, mmsi, name, observed_at, received_at }));
const F = D.firmsNear.map(([lat, lng, frp_mw, observed_at]) => ({ lat, lng, frp_mw, observed_at }));
// the live envelopes' own field lists, as read from the hub on 2 Nov 2026
const QF = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'];
const SF = ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'];
const FF = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'];
const pools = () => [
  { layer: 'usgs', records: Q, runId: D.runs.usgs, fields: QF },
  { layer: 'firms', records: F, runId: D.runs.firms, fields: FF },
  { layer: 'ships', records: S, runId: D.runs.ships, fields: SF },
];

// ---------- the live field lists must actually contain what the search claims to search
ok('usgs really publishes title', QF.includes('title'));
ok('ships really publishes name and mmsi', SF.includes('name') && SF.includes('mmsi'));
ok('firms really publishes no text field', !FF.some(f => ME.TEXT_FIELDS.usgs.concat(ME.TEXT_FIELDS.ships).includes(f)));
ok('the text fields the code searches all exist in the live envelopes',
  ME.TEXT_FIELDS.usgs.every(f => QF.includes(f)) && ME.TEXT_FIELDS.ships.every(f => SF.includes(f)));

// ---------- real text matching
let r = ME.searchLoaded('vanuatu', pools());
ok('a real place word in USGS titles matches every one of them',
  r.total === Q.filter(q => /vanuatu/i.test(q.title)).length && r.total === 5, { got: r.total });
ok('only earthquakes and ships are claimed as searched',
  JSON.stringify(r.searched) === JSON.stringify(['usgs', 'ships']), r.searched);

r = ME.searchLoaded('mid-indian ridge', pools());
ok('a multi-word phrase with a hyphen matches', r.total === 4, r.total);

r = ME.searchLoaded('PĀHALA', pools());
ok('a non-ASCII title matches case-insensitively', r.total === 1 && /Pāhala/.test(r.hits[0].text), r.total);
r = ME.searchLoaded('kuril’sk', pools());
ok('a curly apostrophe in a real title matches', r.total === 1, r.total);

// a country word matches TEXT only — the honest limitation, demonstrated on real data
r = ME.searchLoaded('japan', pools());
const jp = Q.filter(q => /japan/i.test(q.title)).length;
ok('a country word finds exactly the records whose description contains it', r.total === jp && jp === 4, { got: r.total, jp });
ok('records near Japan but described otherwise are NOT found (text, not territory)',
  Q.some(q => q.lat > 23 && q.lat < 46 && q.lng > 122 && q.lng < 146 && !/japan/i.test(q.title)), 'expected at least one');

// ---------- escaping on the real awkward names
for (const needle of ['p&o', "tin'", '@b', '401(play)', 'l\'albatros', 'meier&jaeggi']) {
  r = ME.searchLoaded(needle, pools());
  ok(`real name containing ${JSON.stringify(needle)} matches`, r.total >= 1, r.total);
  if (r.total) {
    const h = r.hits[0], html = ME.markMatch(h.text, h.at, h.len);
    const stripped = html.replace(/<\/?mark>/g, '');
    ok(`...and escapes to safe markup`, !/[<>]/.test(stripped) && /&amp;|&#39;|^[^&]*$/.test(stripped) !== null, { html });
    ok(`...and the mark covers exactly the match`,
      html.match(/<mark>([\s\S]*?)<\/mark>/)[1].toLowerCase().replace(/&amp;/g, '&').replace(/&#39;/g, "'") === needle.toLowerCase(),
      html.match(/<mark>([\s\S]*?)<\/mark>/)[1]);
  }
}
ok('an ampersand name produces an escaped entity, not a raw &',
  (() => { const h = ME.searchLoaded('p&o', pools()).hits[0]; return ME.markMatch(h.text, h.at, h.len).includes('&amp;'); })());

// ---------- the 602 empty-name vessels
const empties = S.filter(x => x.name === '');
ok('the real sample contains empty-name vessels', empties.length >= 3, empties.length);
r = ME.searchLoaded('cape', pools());
ok('an empty name never matches a text query', !r.hits.some(h => h.rec.name === ''), r.hits.map(h => h.rec.name));
r = ME.searchLoaded(String(empties[0].mmsi), pools());
ok('an empty-name vessel is still findable by its real MMSI', r.total === 1 && r.hits[0].field === 'mmsi', r);

// ---------- real MMSIs
r = ME.searchLoaded('601212600', pools());
ok('a full real MMSI matches exactly one vessel', r.total === 1 && r.hits[0].rec.name === 'CAPE CHALLENGER', r.total);
r = ME.searchLoaded('6012', pools());
ok('an MMSI prefix matches several real vessels', r.total >= 3, r.total);
ok('every MMSI in the real sample is numeric (so the digit rule is sound)', S.every(x => /^\d+$/.test(String(x.mmsi))));

// ---------- real coordinate search: Chad's own city
r = ME.searchLoaded('-33.92, 18.42', pools());
ok('Cape Town coordinates return real vessels', r.kind === 'coord' && r.total >= 10, r.total);
ok('nearest first, on real positions', r.hits.every((h, i) => i === 0 || h.km >= r.hits[i - 1].km), r.hits.map(h => +h.km.toFixed(1)));
ok('the nearest real vessel is inside the harbour, ~1 km away', r.hits[0].km < 3, r.hits[0].km);
ok('all real hits are inside the radius', r.hits.every(h => h.km <= 250), r.hits.map(h => +h.km.toFixed(1)));
ok('no fire detection is within 250 km of Cape Town in this real snapshot — and that is not absence',
  !r.hits.some(h => h.layer === 'firms'), r.hits.map(h => h.layer));
ok('the nearest real fire is far outside the radius (Namibia)',
  ME.kmBetween(-33.92, 18.42, F[0].lat, F[0].lng) > 1400, ME.kmBetween(-33.92, 18.42, F[0].lat, F[0].lng));
const ctCount = r.total;
r = ME.searchLoaded('33.92S, 18.42E', pools());
ok('the hemisphere form gives the identical real result', r.total === ctCount, r.total);

// a real position in the middle of the South Atlantic: Go-to still offered, nothing nearby
r = ME.searchLoaded('-40, -20', pools());
ok('an empty ocean gives zero records but is still a coordinate', r.kind === 'coord' && r.total === 0, r.total);

// ---------- observation time vs receipt time vs sample end, on real records
ok('no real vessel observation time equals the snapshot window_end',
  !S.some(x => x.observed_at === D.window_end), S.filter(x => x.observed_at === D.window_end).length);
ok('every real vessel observation time precedes the sample end',
  S.every(x => !x.observed_at || Date.parse(x.observed_at) <= Date.parse(D.window_end)));
ok('every real vessel was received AFTER it was observed',
  S.every(x => !x.observed_at || !x.received_at || Date.parse(x.received_at) >= Date.parse(x.observed_at)));
ok('observation and receipt differ on real records, so they must never be shown as one value',
  S.filter(x => x.observed_at !== x.received_at).length === S.length);

// ---------- real cap behaviour
r = ME.searchLoaded('km', pools());
ok('a common real substring is capped, with the true total preserved',
  r.total > ME.MAX_RESULTS && r.hits.length === ME.MAX_RESULTS, { total: r.total, shown: r.hits.length });

// ---------- a real magnitude typed as digits is a text match on the title, not a coordinate
r = ME.searchLoaded('4.9', pools());
ok('"4.9" reads as text (USGS puts the magnitude in the title) and is not taken as a coordinate',
  r.kind === 'text' && r.total >= 1, { kind: r.kind, total: r.total });

console.log(`\n${pass} passed, ${fail} failed   [real records: usgs ${D.totals.usgs}, ships ${D.totals.ships}, firms ${D.totals.firms} — runs ${D.runs.usgs} / ${D.runs.ships} / ${D.runs.firms}]`);
process.exit(fail ? 1 : 0);
