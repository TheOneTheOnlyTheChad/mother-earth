#!/usr/bin/env node
/*
 * MOTHER EARTH — external collector (D11). Runs on a Mac or Pi, builds a §5 envelope, POSTs it to the hub's /ingest.
 * The hub validates and publishes it exactly like an internal collector. The hub never repairs a bad envelope.
 *
 * Usage:   INGEST_KEY=… node collector-mac.mjs mock          # synthetic feed, proves the path end to end
 *          INGEST_KEY=… node collector-mac.mjs mock --dry    # print the envelope, send nothing
 *          INGEST_KEY=… AISSTREAM_KEY=… node collector-mac.mjs ships [--window=60] [--dry] [--quiet]
 * Hub:     HUB=https://mother-earth.chadoberholzer.workers.dev (default)
 * Needs Node 22+ (global fetch + global WebSocket). No dependencies.
 *
 * ships (aisstream.io, measured 31 Oct 2026 from aisstream.io/documentation): wss://stream.aisstream.io/v0/stream; one JSON
 * subscription within 3 s of connecting; 3 subscribed connections per account; read continuously or the service drops messages;
 * permessage-deflate recommended (uncompressed connections get bandwidth-limited from Sep 2026). Terrestrial AIS only: open ocean is
 * not covered, so a silent cell is not an empty cell (coverage stays 'partial' until receipt history exists — same rule as OpenSky, D9).
 */

const COLLECTOR_VERSION = 'mac-0.2.0';
const SCHEMA_VERSION = 1;
const CELL_DEG = 4;
const HUB = process.env.HUB || 'https://mother-earth.chadoberholzer.workers.dev';
const KEY = process.env.INGEST_KEY;
const [, , layer = 'mock', ...flags] = process.argv;
const dry = flags.includes('--dry');
const quiet = flags.includes('--quiet');
const flag = (name, dflt) => { const f = flags.find(x => x.startsWith('--' + name + '=')); return f ? f.slice(name.length + 3) : dflt; };

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

  // aisstream.io: hold the socket for a fixed window, keep the latest position per vessel (MMSI), Class A + Class B.
  ships: async () => {
    const key = process.env.AISSTREAM_KEY;
    if (!key) throw new Error('AISSTREAM_KEY not set');
    if (typeof WebSocket === 'undefined') throw new Error('Node 22+ needed for the global WebSocket; this is ' + process.version + ' (brew install node, or nvm install 22)');
    const windowS = Math.max(10, Number(flag('window', 60)));
    const bbox = flag('bbox', '-90,-180,90,180').split(',').map(Number);          // lat1,lng1,lat2,lng2 (default: world)
    const CLASS = { PositionReport: 'A', StandardClassBPositionReport: 'B', ExtendedClassBPositionReport: 'B' };
    const vessels = new Map();                                                     // mmsi -> row
    let messages = 0, parseErrors = 0, confirmed = false, compression = null, closeInfo = null, connectedAt = null, lastMsgAt = null;
    const t0 = Date.now();
    await new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      ws.binaryType = 'arraybuffer';
      const timer = setTimeout(() => { try { ws.close(1000, 'window done'); } catch (_) {} resolve(); }, windowS * 1000);
      ws.onopen = () => {
        connectedAt = Date.now();
        ws.send(JSON.stringify({ APIKey: key, BoundingBoxes: [[[bbox[0], bbox[1]], [bbox[2], bbox[3]]]], FilterMessageTypes: Object.keys(CLASS) }));
      };
      ws.onerror = (ev) => { clearTimeout(timer); const er = ev && ev.error; reject(new Error('websocket error: ' + [ev && ev.message, er && er.message, er && er.cause && er.cause.message, er && er.cause && er.cause.code].filter(Boolean).join(' | ') || 'unknown (no detail from the socket)')); };
      ws.onclose = (ev) => { closeInfo = { code: ev.code, reason: ev.reason }; clearTimeout(timer); resolve(); };
      ws.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8')); } catch (_) { parseErrors++; return; }
        if (m.MessageType === 'SubscriptionConfirmation') { confirmed = true; compression = m.Message && m.Message.CompressionEnabled; return; }
        const cls = CLASS[m.MessageType]; if (!cls) return;
        messages++; lastMsgAt = Date.now();
        const md = m.MetaData || {}; const pr = (m.Message || {})[m.MessageType] || {};
        const lat = Number(pr.Latitude ?? md.Latitude ?? md.latitude), lng = Number(pr.Longitude ?? md.Longitude ?? md.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
        const mmsi = String(md.MMSI ?? pr.UserID ?? '');
        if (!mmsi) return;
        const tUtc = md.time_utc ? new Date(String(md.time_utc).replace(' +0000 UTC', 'Z').replace(' ', 'T')) : null;
        const observedAt = tUtc && !isNaN(tUtc) ? tUtc.toISOString() : nowIso();
        vessels.set(mmsi, [mmsi, lat, lng, observedAt, pr.Sog ?? null, pr.Cog ?? null, pr.TrueHeading ?? null, pr.NavigationalStatus ?? null, cls, (md.ShipName || '').trim()]);
      };
    });
    const wallS = (Date.now() - t0) / 1000;
    const upS = connectedAt ? ((lastMsgAt || connectedAt) - connectedAt) / 1000 : 0;
    const upFrac = Math.max(0, Math.min(1, upS / windowS));
    if (!confirmed) throw new Error('no SubscriptionConfirmation within the window' + (closeInfo ? ' (close ' + closeInfo.code + ' ' + closeInfo.reason + ')' : ''));
    const rows = [...vessels.values()];
    const rowsA = rows.filter(r => r[8] === 'A').length;
    const status = upFrac >= 0.9 ? 'ok' : 'degraded';
    console.error(`ships: window=${windowS}s wall=${wallS.toFixed(1)}s up=${upS.toFixed(1)}s messages=${messages} vessels=${rows.length} (A=${rowsA} B=${rows.length - rowsA}) compression=${compression} parseErrors=${parseErrors} close=${JSON.stringify(closeInfo)}`);
    return { fields: ['mmsi', 'lat', 'lng', 'observed_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'], rows,
      quantity: `unique vessels (by MMSI) with a Class A or B position report during a ${windowS} s window, per cell — terrestrial AIS, so open ocean is not covered; a silent cell is not an empty cell`,
      coverageDefault: { grade: 'partial', evidence: 'socket_up;receipt_history_pending;terrestrial_ais_only', observed_fraction: upFrac },
      extra: { scope: bbox.join(',') === '-90,-180,90,180' ? 'world' : 'bbox ' + bbox.join(','), window_s: windowS, socket_up_s: upS, messages, class_a: rowsA, class_b: rows.length - rowsA,
        compression_enabled: compression, parse_errors: parseErrors, close: closeInfo, stale_after_s: 3 * 3600, source_status_override: status,
        citation: 'AIS data via aisstream.io (aisstream.io; free API, server-side use only)' } };
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
    const extra = { ...(f.extra || {}) }; const status = extra.source_status_override || 'ok'; delete extra.source_status_override;
    e = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer,
      window_start: new Date(scheduledMs).toISOString(), window_end: nowIso(), retrieved_at: nowIso(),
      scheduled_for: new Date(scheduledMs).toISOString(), source_status: status, interruptions: [],
      cells, record_format: 'rows', record_fields: f.fields, records: f.rows,
      coverage_default: f.coverageDefault, quantity: f.quantity, ...extra };
  } catch (err) {
    e = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer, retrieved_at: nowIso(),
      scheduled_for: new Date(scheduledMs).toISOString(), source_status: 'down', cells: {}, note: String(err).slice(0, 200) };
  }
  if (dry) {
    const body = JSON.stringify(e);
    console.error(`dry: layer=${layer} status=${e.source_status} cells=${Object.keys(e.cells).length} records=${(e.records || []).length} bytes=${body.length}`);
    console.log(quiet ? body.slice(0, 2000) + (body.length > 2000 ? '…' : '') : JSON.stringify(e, null, 1)); return;
  }
  if (!KEY) { console.error('INGEST_KEY not set'); process.exit(2); }
  const r = await fetch(`${HUB}/ingest/${layer}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, 'User-Agent': 'mother-earth-' + COLLECTOR_VERSION }, body: JSON.stringify(e) });
  const t = await r.text();
  console.log(r.status, t);
  process.exit(r.ok ? 0 : 1);
}
main();
