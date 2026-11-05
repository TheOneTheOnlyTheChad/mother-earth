// Offline test of the hub's plastic job (collector 0.4.0). No network: NOAA's ArcGIS layer and SEANOE stubbed,
// R2/D1 in memory, clock fixed. The synthetic Oceaneye zip copies the REAL file shapes measured 4 Nov 2026: SeaDataNet
// ODV tab-separated files, comment lines '//', continuation rows with blank metadata, an end-time column present in
// 26 files and absent in 4, a lake/river file, and one sample filed in two regional files with one blank method.
// Real-data result of the same functions on 4 Nov 2026 (browser pane, real SEANOE file + live NOAA layer):
// 1,145 rows, 647 reproduced / 11 possible date conflicts / 1 not reproduced / 486 no original; pinned sha matched.
// Usage: node phase1/plastic-hub.test.mjs
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import worker, { PLASTIC, plDay, unzipText, odvSamples, plasticValidate, plasticVerify } from './worker.js';

let passed = 0; const t = async (n, fn) => { await fn(); passed++; console.log('ok -', n); };

// ---- synthetic Oceaneye zip
const HEAD_FULL = ['Cruise', 'Station', 'Type', 'YYYY-MM-DDThh:mm:ss.sss', 'Longitude [degrees_east]', 'Latitude [degrees_north]', 'LOCAL_CDI_ID', 'EDMO_code', 'Bot. Depth [m]',
  'MinimumObservationDepth [Metres]', 'QV:SEADATANET', 'MaximumObservationDepth [Metres]', 'QV:SEADATANET', 'SampleID:INDEXED_TEXT', 'QV:SEADATANET', 'SamplingEffort [Kilometres]', 'QV:SEADATANET',
  'Net_opening [Centimetres]', 'QV:SEADATANET', 'Mesh_size [Micrometres (microns)]', 'QV:SEADATANET', 'Microlitter_Type:INDEXED_TEXT', 'QV:SEADATANET', 'Microlitter_Size:INDEXED_TEXT', 'QV:SEADATANET',
  'Microlitter_Count [Dimensionless]', 'QV:SEADATANET', 'ENDX8601 [YYYY-MM-DDThh:mm]', 'QV:SEADATANET', 'ENDXXLON [Degrees east]', 'QV:SEADATANET', 'ENDXXLAT [Degrees north]', 'QV:SEADATANET',
  'MLDWWD01 [Grams]', 'QV:SEADATANET', 'SAMPPROT:INDEXED_TEXT', 'QV:SEADATANET'];
const ITEMS = 'SDN:H01::H0100001 (items)', MICRO = 'SDN:H03::H0300010', MICRO1 = 'SDN:H03::H0300008', MESO = 'SDN:H03::H0300009';
function odv(rows, withEnd = true) {
  const head = withEnd ? HEAD_FULL : HEAD_FULL.filter((h, i) => !(h.startsWith('ENDX8601') || (i > 0 && HEAD_FULL[i - 1].startsWith('ENDX8601'))));
  const lines = ['//SeaDataNet ODV MICROLITTER - synthetic copy of the real layout', '//', head.join('\t')];
  for (const r of rows) for (const [k, [size, count]] of r.counts.entries()) {
    const v = Object.fromEntries(head.map(h => [h, '']));
    if (k === 0) Object.assign(v, { Cruise: r.cruise || 'X', Station: r.id, Type: '*', 'YYYY-MM-DDThh:mm:ss.sss': r.start + ':00.000', 'Longitude [degrees_east]': String(r.lon), 'Latitude [degrees_north]': String(r.lat) });
    Object.assign(v, { 'MinimumObservationDepth [Metres]': '0.00', 'MaximumObservationDepth [Metres]': '0.15', 'SampleID:INDEXED_TEXT': r.id, 'SamplingEffort [Kilometres]': String(r.km),
      'Net_opening [Centimetres]': '60', 'Mesh_size [Micrometres (microns)]': '330', 'Microlitter_Type:INDEXED_TEXT': ITEMS, 'Microlitter_Size:INDEXED_TEXT': size, 'Microlitter_Count [Dimensionless]': String(count),
      'ENDX8601 [YYYY-MM-DDThh:mm]': r.end || '', 'ENDXXLON [Degrees east]': String(r.lon), 'ENDXXLAT [Degrees north]': String(r.lat), 'MLDWWD01 [Grams]': '0.1',
      'SAMPPROT:INDEXED_TEXT': r.method === null ? '' : `Distance measurement method: ${r.method || 'flowmeter'}, sample storage method : food bags` });
    for (const h of head) if (h.startsWith('QV')) v[h] = '0';
    lines.push(head.map(h => v[h]).join('\t'));
  }
  return lines.join('\n') + '\n';
}
function zip(files) {
  const parts = [];
  for (const [name, text] of files) {
    const data = deflateRawSync(Buffer.from(text, 'utf8')); const n = Buffer.from(name);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(data.length, 18); h.writeUInt32LE(text.length, 22); h.writeUInt16LE(n.length, 26); h.writeUInt16LE(0, 28);
    parts.push(h, n, data);
  }
  parts.push(Buffer.from([0x50, 0x4b, 0x05, 0x06]));   // end-of-central-directory marker (the reader stops at the first non-local header)
  return new Uint8Array(Buffer.concat(parts));
}
// samples: A reproduced (0.3-5 mm), Z reproduced zero, C date conflict (start 2013, end 2014 = NOAA's date), D distance 0, E filed twice
const S = {
  A: { id: 'OE_1', start: '2011-08-31T07:52', end: '2011-08-31T09:22', lat: 42.7533, lon: 4.13, km: 9.223, method: 'GPS', counts: [[MICRO, 419], [MESO, 7]] },
  Z: { id: 'OE_2', start: '2012-05-01T10:00', end: '2012-05-01T11:00', lat: 40.1, lon: 5.2, km: 3.0, counts: [[MICRO1, 0], [MESO, 0]] },
  C: { id: 'OE_108', start: '2013-04-06T11:54', end: '2014-04-06T12:40', lat: 43.0782, lon: 5.1725, km: 2.0, counts: [[MICRO1, 66], [MESO, 1]] },
  D: { id: 'TMF_2019_11', start: '2019-08-01T14:05', lat: 67.4561, lon: 13.4574, km: 0, counts: [[MICRO1, 4], [MESO, 1]] },
  E: { id: 'BON_26', start: '2017-04-09T18:13', end: '2017-04-09T18:13', lat: -6.0067, lon: -136.3817, km: 2.697, counts: [[MICRO1, 12], [MESO, 0]] },
};
const vol = (km) => km * 1000 * 0.6 * 0.15;
const ZIP = zip([
  ['OceanEye_MedSea.txt', odv([S.A, S.Z, S.C])],
  ['SwissSailingClub_NorthAtlantic.txt', odv([S.D], false)],                    // no end-time column, as in the real file
  ['Bonavalette_NorthAtlantic.txt', odv([{ ...S.E, method: null }])],           // same sample, method blank here…
  ['Bonavalette_SouthAtlantic.txt', odv([S.E])],                                // …and 'flowmeter' here
  ['OceanEye_Lakes.txt', odv([{ id: 'L_1', start: '2015-01-01T10:00', lat: 46.4, lon: 6.5, km: 1, counts: [[MICRO, 5]] }])],
]);
const ZIP_SHA = createHash('sha256').update(ZIP).digest('hex');
PLASTIC.zipSha256 = ZIP_SHA;   // pin the synthetic file for this test only

// ---- NOAA stub: 1,100 rows (minRows 1,000); ids 1–5 correspond to the samples above, the rest have no original
const usMidnight = (d) => Date.parse(d + 'T05:00:00Z');
function noaaRows(over = {}) {
  const r = [
    { id: 1, d: '2011-08-31', lat: 42.753333, lng: 4.13, v: 0.504779 },
    { id: 2, d: '2012-05-01', lat: 40.1, lng: 5.2, v: 0 },
    { id: 3, d: '2014-04-06', lat: 43.078167, lng: 5.1725, v: +(66 / vol(2)).toFixed(6) },
    { id: 4, d: '2019-08-01', lat: 67.456083, lng: 13.457433, v: 0.022234 },
    { id: 5, d: '2017-04-09', lat: -6.006667, lng: -136.381667, v: +(12 / vol(2.697)).toFixed(6) },
  ];
  for (let i = 6; i <= 1100; i++) r.push({ id: i, d: '2023-06-' + String(1 + i % 28).padStart(2, '0'), lat: -50 + (i * 0.09) % 100, lng: -170 + (i * 0.31) % 340, v: (i % 9) / 10 });
  return r.map(x => ({ ...x, ...(over[x.id] || {}) })).map(x => ({ attributes: {
    UniqueID: '0276422-' + String(x.id).padStart(7, '0'), Date__MM_DD_YYYY_: usMidnight(x.d), Latitude__degree_: x.lat, Longitude_degree_: x.lng, Microplastics_measurement: x.v,
    Unit: x.unit || 'pieces/m3', Medium: 'Ocean water', Sampling_Method: 'Manta net', Mesh_size__mm_: 0.33, Water_Sample_Depth__m_: 0, NCEI_Accession_No: 276422 } }));
}
const NOW = Date.parse('2026-11-04T12:07:00Z'); Date.now = () => NOW;
{ const RealDate = Date;   // 5 Nov: the hub stamps retrieved_at with `new Date()`; without this the test used the real clock and only passed on 4 Nov
  globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(Date.now()); } static now() { return Date.now(); } };
  const setNow = globalThis.Date; Object.defineProperty(setNow, 'now', { writable: true, value: () => NOW }); }

await t('A. plDay names the day of NOAA\'s US-local-midnight dates (05:00 and 06:00 UTC) and of UTC midnight', () => {
  assert.equal(plDay(Date.parse('2014-04-06T05:00:00Z')), '2014-04-06'); assert.equal(plDay(Date.parse('2014-11-06T06:00:00Z')), '2014-11-06'); assert.equal(plDay(Date.parse('2014-04-06T00:00:00Z')), '2014-04-06');
});
await t('B. zip + ODV: sea samples only (lake file excluded), end-time column optional, the twice-filed sample merged with its method note', async () => {
  const od = odvSamples(await unzipText(ZIP));
  assert.equal(od.lakes_rivers_files, 1); assert.equal(od.entries, 6); assert.equal(od.samples.length, 5);
  const d = od.samples.find(s => s.sample === 'TMF_2019_11'); assert.equal(d.end, null); assert.equal(d.distance_km, 0);
  const e = od.samples.find(s => s.sample === 'BON_26'); assert.equal(e.distance_method, 'flowmeter'); assert.match(e.method_note, /blank in Bonavalette_NorthAtlantic/); assert.equal(e.also_in_file, 'Bonavalette_SouthAtlantic.txt');
  const a = od.samples.find(s => s.sample === 'OE_1'); assert.deepEqual(a.counts, { '0.3-5 mm': 419, '5-25 mm': 7 });
});
await t('C. statuses: reproduced (0.5 % tolerance, metres), reproduced zero, possible date conflict with the end date shown, not reproduced, no original', async () => {
  const od = odvSamples(await unzipText(ZIP)); const v = plasticValidate(noaaRows(), NOW); const r = plasticVerify(v.rows, od.samples);
  assert.deepEqual(r.counts, { reproduced: 3, not_reproduced: 1, possible_date_conflict: 1, ambiguous: 0, no_original: 1095 });
  const a = r.byId.get('0276422-0000001'); assert.equal(a.check, 'reproduced'); assert.equal(a.original.distance_m, 9223); assert.equal(a.original.count, 419); assert.equal(a.original.tolerance, 0.005);
  assert.deepEqual(a.original.checked_against, { date: '2011-08-31', lat: 42.753333, lng: 4.13, value: 0.504779 });
  assert.equal(r.byId.get('0276422-0000002').check, 'reproduced'); assert.equal(r.byId.get('0276422-0000002').original.count, 0);
  const c = r.byId.get('0276422-0000003'); assert.equal(c.check, 'possible_date_conflict'); assert.equal(c.original.start.slice(0, 10), '2013-04-06'); assert.equal(c.original.end_date_matches_noaa, true);
  const d = r.byId.get('0276422-0000004'); assert.equal(d.check, 'not_reproduced'); assert.equal(d.original.computed, null);
  assert.equal(r.byId.get('0276422-0000500').check, 'no_original'); assert.equal(r.byId.get('0276422-0000500').original, null);
});
await t('D. NOAA changes a value, a date or a position → the old "reproduced" does NOT survive; checked_against always equals NOAA\'s current fields', async () => {
  const od = odvSamples(await unzipText(ZIP));
  const value = plasticVerify(plasticValidate(noaaRows({ 1: { v: 0.6 } }), NOW).rows, od.samples).byId.get('0276422-0000001');
  assert.equal(value.check, 'not_reproduced'); assert.equal(value.original.checked_against.value, 0.6);
  const date = plasticVerify(plasticValidate(noaaRows({ 1: { d: '2011-09-30' } }), NOW).rows, od.samples).byId.get('0276422-0000001');
  assert.notEqual(date.check, 'reproduced'); assert.equal(date.original.checked_against.date, '2011-09-30');   // found only as a possible conflict, dated by NOAA
  const moved = plasticVerify(plasticValidate(noaaRows({ 1: { lat: 10, lng: 10 } }), NOW).rows, od.samples).byId.get('0276422-0000001');
  assert.equal(moved.check, 'no_original'); assert.equal(moved.original, null);
});
await t('E. validation: wrong unit, bad id, duplicate, future date, impossible position, negative value → refused and counted, never drawn', () => {
  const f = noaaRows(); f[10].attributes.Unit = 'pieces/km2'; f[11].attributes.UniqueID = 'x'; f[12].attributes.UniqueID = f[13].attributes.UniqueID;
  f[14].attributes.Date__MM_DD_YYYY_ = NOW + 864e5; f[15].attributes.Latitude__degree_ = 95; f[16].attributes.Microplastics_measurement = -1;
  const v = plasticValidate(f, NOW);
  assert.deepEqual(v.refused, { bad_id: 1, duplicate: 1, bad_date: 1, bad_position: 1, bad_value: 1, wrong_unit: 1, wrong_medium: 0, wrong_accession: 0 });
  assert.equal(v.rows.length, 1094);
});

// ---- end to end through the Worker's own scheduled() and fetch()
function makeEnv(extra = {}) {
  const store = new Map(); const runs = [];
  const R2 = {
    async put(k, body) { store.set(k, body instanceof Uint8Array ? body : String(body)); }, async delete(k) { store.delete(k); },
    async get(k) { const b = store.get(k); if (b === undefined) return null; return { body: b, httpEtag: '"e"', async json() { return JSON.parse(b); }, async text() { return String(b); }, async arrayBuffer() { return (b instanceof Uint8Array ? b : new TextEncoder().encode(b)).slice().buffer; } }; },
    async list({ prefix } = {}) { return { objects: [...store.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, uploaded: new Date() })), truncated: false }; },
  };
  const stmt = (sql) => { const x = (a) => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push(a); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };
  return { env: { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', ...extra }, store, runs };
}
const calls = { noaa: 0, seanoe: 0 }; let rows = noaaRows(), countOverride = null, zipBody = ZIP;
globalThis.fetch = async (url) => {
  url = String(url);
  if (url.includes('seanoe.org')) { calls.seanoe++; return new Response(zipBody, { status: 200 }); }
  if (url.includes('Ocean_Surface_Microplastics')) {
    calls.noaa++;
    if (url.endsWith('?f=json')) return Response.json({ editingInfo: { dataLastEditDate: Date.parse('2026-10-15T14:50:17Z') } });
    const u = new URL(url);
    if (u.searchParams.get('returnCountOnly')) return Response.json({ count: countOverride ?? rows.length });
    const off = +u.searchParams.get('resultOffset'), n = +u.searchParams.get('resultRecordCount'); const page = rows.slice(off, off + n);
    return Response.json({ features: page, exceededTransferLimit: off + n < rows.length });
  }
  return new Response('stub', { status: 503 });
};
const hourlyAt = (env, iso) => worker.scheduled({ cron: '7 * * * *', scheduledTime: Date.parse(iso) }, env, { waitUntil() {} });
const admin = (env) => worker.fetch(new Request('https://hub/admin/run/plastic?key=k'), env);
const reset = () => { calls.noaa = 0; calls.seanoe = 0; rows = noaaRows(); countOverride = null; zipBody = ZIP; Date.now = () => NOW; };

await t('F. schedule gate: no NOAA or SEANOE request without PLASTIC_ENABLED=1; with it one run publishes, and the next hourly within 20 h makes NO request', async () => {
  reset(); const a = makeEnv(); await hourlyAt(a.env, '2026-11-04T12:07:00Z'); assert.equal(calls.noaa + calls.seanoe, 0); assert.ok(!a.store.has('latest/plastic.json'));
  reset(); const b = makeEnv({ PLASTIC_ENABLED: '1' }); await hourlyAt(b.env, '2026-11-04T12:07:00Z');
  assert.ok(b.store.has('latest/plastic.json')); assert.equal(calls.seanoe, 1); assert.equal(calls.noaa, 4);   // meta + count + 2 pages
  calls.noaa = 0; calls.seanoe = 0; Date.now = () => NOW + 3600e3; await hourlyAt(b.env, '2026-11-04T13:07:00Z'); assert.equal(calls.noaa + calls.seanoe, 0);
  Date.now = () => NOW + 21 * 3600e3; await hourlyAt(b.env, '2026-11-05T09:07:00Z'); assert.equal(calls.noaa, 4); assert.equal(calls.seanoe, 0, 'the pinned original is reused from R2');
});
await t('G. a good run: one current snapshot + counts (same run), the pinned original kept in ref/, statuses and citations in the envelope', async () => {
  reset(); const { env, store, runs } = makeEnv(); assert.equal((await admin(env)).status, 200);
  const s = JSON.parse(store.get('latest/plastic.json')), c = JSON.parse(store.get('latest-cells/plastic.json'));
  assert.equal(s.retrieved_at, c.retrieved_at); assert.equal(s.records.length, 1100); assert.equal(c.records, undefined);
  assert.deepEqual(s.record_fields, ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m']);
  assert.equal(s.verification.status, 'checked'); assert.equal(s.verification.counts.reproduced, 3); assert.equal(s.verification.original.sha256, ZIP_SHA);
  assert.match(s.citation, /0276422/); assert.match(s.citation, /10\.17882\/86630/); assert.equal(s.source.licence, 'CC0 (NCEI compiled product)');
  assert.equal(s.window_start, '2011-08-31'); assert.equal(s.noaa_count, 1100); assert.equal(s.rows_published, 1100);
  assert.deepEqual([...store.keys()].filter(k => k.includes('plastic') || k.startsWith('ref/')).sort(), ['latest-cells/plastic.json', 'latest/plastic.json', PLASTIC.zipKey]);
  assert.equal((await worker.fetch(new Request('https://hub/snapshot/plastic'), env)).status, 200);
  assert.equal((await worker.fetch(new Request('https://hub/cells/plastic'), env)).status, 200);
  assert.ok(runs.length >= 1);
});
await t('H. NOAA returns fewer rows than its own count → refused (down); the previous snapshot stays served with its own times', async () => {
  reset(); const { env, store } = makeEnv(); await admin(env); const before = store.get('latest/plastic.json');
  countOverride = 1101; Date.now = () => NOW + 3600e3; await admin(env);
  assert.equal(store.get('latest/plastic.json'), before);
  const c = JSON.parse(store.get('latest-cells/plastic.json')); assert.equal(c.source_status, 'down'); assert.match(c.note, /retrieved 1100 rows, NOAA reports 1101/);
});
await t('I. a fall below 90 % of the previous rows → refused; below the 1,000-row floor → refused; previous kept each time', async () => {
  const more = () => { const r = noaaRows(); for (let i = 1101; i <= 1200; i++) r.push({ attributes: { ...r[500].attributes, UniqueID: '0276422-' + String(i).padStart(7, '0') } }); return r; };
  reset(); rows = more(); const { env, store } = makeEnv(); await admin(env); assert.equal(JSON.parse(store.get('latest/plastic.json')).rows_published, 1200);
  const before = store.get('latest/plastic.json');
  rows = more().slice(0, 1050); Date.now = () => NOW + 3600e3; await admin(env);            // 1,050 < 90 % of 1,200 (1,080)
  assert.equal(store.get('latest/plastic.json'), before); assert.match(JSON.parse(store.get('latest-cells/plastic.json')).note, /below 90 %/);
  reset(); const e2 = makeEnv(); rows = noaaRows().slice(0, 999); await admin(e2.env);
  assert.ok(!e2.store.has('latest/plastic.json')); assert.match(JSON.parse(e2.store.get('latest-cells/plastic.json')).note, /< 1000/);
});
await t('J. original file changed (hash ≠ pin) → every check "original_unavailable" with the reason; NOAA values still published; nothing stored in ref/', async () => {
  reset(); zipBody = new Uint8Array([...ZIP, 0]); const { env, store } = makeEnv(); await admin(env);
  const s = JSON.parse(store.get('latest/plastic.json'));
  assert.equal(s.verification.status, 'unavailable'); assert.match(s.verification.reason, /original file changed/);
  assert.ok(s.records.every(r => r[5] === 'original_unavailable' && r[6] === null)); assert.ok(!store.has(PLASTIC.zipKey));
});
await t('K. SEANOE down → checks unavailable, layer still published; SEANOE never contacted again once the pinned file is held', async () => {
  reset(); const { env, store } = makeEnv();
  const real = globalThis.fetch; globalThis.fetch = async (u) => String(u).includes('seanoe') ? new Response('x', { status: 503 }) : real(u);
  await admin(env); globalThis.fetch = real;
  assert.match(JSON.parse(store.get('latest/plastic.json')).verification.reason, /http 503/);
  reset(); await admin(env); assert.equal(calls.seanoe, 1); calls.seanoe = 0; Date.now = () => NOW + 3600e3; await admin(env); assert.equal(calls.seanoe, 0);
});
console.log(`\n${passed} passed`);
