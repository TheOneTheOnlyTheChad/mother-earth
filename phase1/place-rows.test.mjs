// Pure wording rules of the Place view (ME.placeRows in app.js). No DOM, no network. Usage: node phase1/place-rows.test.mjs
import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
globalThis.window = globalThis; globalThis.document = {}; new Function(readFileSync(new URL('../app.js', import.meta.url), 'utf8'))();
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const base = layers => ({ cell: { id: '22_46', ref: 'g4:22_46', west: 4, south: -2, east: 8, north: 2, area_km2: 197789 }, statement: 'Listed together because they share this 4° cell. Nothing here states a connection between them.', layers, not_place_based: { swpc: 'one planetary index' }, generated_at: '2026-11-05T06:00:00Z', collector_version: '0.5.0' });
const text = rows => rows.map(r => r[0] + ': ' + r[1].replace(/<[^>]+>/g, '')).join('\n');
const coll = (agg24, ran24, agg7, ran7) => ({ collection_ran: { last_24h: { hours_with_a_usable_sample: ran24, hours_aggregated: agg24, hours: 24 }, last_7d: { hours_with_a_usable_sample: ran7, hours_aggregated: agg7, hours: 168 }, retention_start: agg7 ? '2026-11-01T03' : null }, records_reached_us_here: { last_24h_hours: 0, last_7d_hours: 0, first_report_retained: null, retention_start: agg7 ? '2026-11-01T03' : null } });
t('no aggregated hours on record → "unknown", never "0 of 24 h"', () => {
  const s = text(ME.placeRows({ ...base({}), collection: { ships: coll(0, 0, 0, 0) } }));
  assert.match(s, /Collection · Ships: unknown — no aggregated hour of ours is on record/); assert.doesNotMatch(s, /\b0 of (24|168)/);
});
t('partial aggregation: counts stated against the hours actually aggregated, the period named separately', () => {
  const s = text(ME.placeRows({ ...base({}), collection: { ships: coll(20, 15, 100, 80) } }));
  assert.match(s, /15 of 20 aggregated hours \(of 24 h in the period\) over the last 24 h and 80 of 100 aggregated hours \(of 168 h in the period\)/);
  assert.match(s, /records for this cell reached us in 0 h of the last 24 h/); assert.match(s, /Neither is the source's geographic coverage/);
});
t('the last 24 h unknown while the 7 days are known', () => {
  const s = text(ME.placeRows({ ...base({}), collection: { ships: coll(0, 0, 50, 40) } }));
  assert.match(s, /unknown \(no aggregated hour of the 24 h is on record\) over the last 24 h and 40 of 50 aggregated hours/);
});
t('a source-reported forest zero is labelled as the source\'s zero', () => {
  const s = text(ME.placeRows(base({ forest: { layer: 'forest', state: 'ok', cell: { count: 0, confidence: { nominal: 0, high: 0, highest: 0 }, since: '2026-10-28', queried_at: '2026-11-04T02:42:00Z' } } })));
  assert.match(s, /Forest disturbance: 0 \(source-reported zero\) alert pixels/);
});
t('every no-records wording carries its limit; none says a bare zero', () => {
  const L = Object.fromEntries(['usgs', 'firms', 'ships', 'drifters', 'plastic'].map(l => [l, { layer: l, state: 'no_records', count: 0, retrieved_at: '2026-11-05T06:00:00Z' }]));
  const s = text(ME.placeRows(base(L)));
  for (const re of [/not a statement that none occurred/, /not “no fires”/, /not an empty sea/, /says nothing about the water/, /does not establish plastic-free water/]) assert.match(s, re);
  assert.doesNotMatch(s, /\b0 (event|detection|vessel|buoy|sample)/);
});
t('stale layer flagged against its own refresh limit', () => {
  const s = text(ME.placeRows(base({ usgs: { layer: 'usgs', state: 'no_records', retrieved_at: '2026-11-05T05:00:00Z', stale_after_s: 900 } }), Date.parse('2026-11-05T06:00:00Z')));
  assert.match(s, /Earthquakes: .* stale: older than its refresh limit/);
});
t('source text is escaped (no markup reaches the page)', () => {
  const rows = ME.placeRows(base({ usgs: { layer: 'usgs', state: 'ok', records_total: 1, record_fields: ['id', 'lat', 'lng', 'mag', 'observed_at', 'title'], records: [['x', 0, 0, 3, '2026-11-05T05:00:00Z', '<img src=x onerror=alert(1)>']] } }));
  const html = rows.map(r => r[1]).join(''); assert.ok(!html.includes('<img'), html); assert.ok(html.includes('&lt;img'));
});
console.log(`\nplace-rows: ${n} passed`);
