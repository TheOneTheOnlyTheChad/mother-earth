#!/usr/bin/env node
/*
 * MOTHER EARTH — external collector (D11). Runs on a Mac or Pi, builds a §5 envelope, POSTs it to the hub's /ingest.
 * The hub validates and publishes it exactly like an internal collector. The hub never repairs a bad envelope.
 *
 * Usage:   INGEST_KEY=… node collector-mac.mjs mock          # synthetic feed, proves the path end to end
 *          INGEST_KEY=… node collector-mac.mjs mock --dry    # print the envelope, send nothing
 * Hub:     HUB=https://mother-earth.chadoberholzer.workers.dev (default)
 * Needs Node 18+ (global fetch). No dependencies.
 */

const COLLECTOR_VERSION = 'mac-0.1.0';
const SCHEMA_VERSION = 1;
const CELL_DEG = 4;
const HUB = process.env.HUB || 'https://mother-earth.chadoberholzer.workers.dev';
const KEY = process.env.INGEST_KEY;
const [, , layer = 'mock', ...flags] = process.argv;
const dry = flags.includes('--dry');

function cellId(lat, lng) {
  const r = Math.max(0, Math.min(Math.floor(180 / CELL_DEG) - 1, Math.floor((lat + 90) / CELL_DEG)));
  const c = Math.max(0, Math.min(Math.floor(360 / CELL_DEG) - 1, Math.floor((lng + 180) / CELL_DEG)));
  return r + '_' + c;
}
const nowIso = () => new Date().toISOString();

/* ---- feeds: each returns { fields, rows, quantity, coverageDefault, extra } or throws ---- */
const FEEDS = {
  // Synthetic: a handful of points around Cape Town. Exists only to prove auth → validate → publish → page.
  mock: async () => {
    const base = [-33.97, 18.60];
    const rows = [];
    for (let i = 0; i < 12; i++) rows.push(['mock' + i, base[0] + (Math.random() - 0.5) * 6, base[1] + (Math.random() - 0.5) * 8, nowIso()]);
    return { fields: ['id', 'lat', 'lng', 'observed_at'], rows,
      quantity: 'synthetic points per cell (mock feed; not an observation)',
      coverageDefault: { grade: 'partial', evidence: 'mock_feed', observed_fraction: 1 }, extra: { scope: 'mock' } };
  },
};

async function main() {
  if (!FEEDS[layer]) { console.error('unknown layer', layer, '— known:', Object.keys(FEEDS).join(', ')); process.exit(2); }
  const scheduledMs = Date.now();
  let e;
  try {
    const f = await FEEDS[layer]();
    const cells = {};
    const iLat = f.fields.indexOf('lat'), iLng = f.fields.indexOf('lng');
    for (const r of f.rows) { const id = cellId(r[iLat], r[iLng]); (cells[id] || (cells[id] = { count: 0 })).count++; }
    for (const id in cells) cells[id].coverage = { ...f.coverageDefault };
    e = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer,
      window_start: new Date(scheduledMs - 300e3).toISOString(), window_end: nowIso(), retrieved_at: nowIso(),
      scheduled_for: new Date(scheduledMs).toISOString(), source_status: 'ok', interruptions: [],
      cells, record_format: 'rows', record_fields: f.fields, records: f.rows,
      coverage_default: f.coverageDefault, quantity: f.quantity, ...(f.extra || {}) };
  } catch (err) {
    e = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer, retrieved_at: nowIso(),
      scheduled_for: new Date(scheduledMs).toISOString(), source_status: 'down', cells: {}, note: String(err).slice(0, 200) };
  }
  if (dry) { console.log(JSON.stringify(e, null, 1)); return; }
  if (!KEY) { console.error('INGEST_KEY not set'); process.exit(2); }
  const r = await fetch(`${HUB}/ingest/${layer}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, 'User-Agent': 'mother-earth-' + COLLECTOR_VERSION }, body: JSON.stringify(e) });
  const t = await r.text();
  console.log(r.status, t);
  process.exit(r.ok ? 0 : 1);
}
main();
