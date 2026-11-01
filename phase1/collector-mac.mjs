#!/usr/bin/env node
/*
 * MOTHER EARTH — external collector (D11). Runs on a Mac or Pi, builds a §5 envelope, POSTs it to the hub's /ingest.
 * The hub validates and publishes it exactly like an internal collector. The hub never repairs a bad envelope.
 *
 * Usage:   INGEST_KEY=… node collector-mac.mjs mock          # synthetic feed, proves the path end to end
 *          INGEST_KEY=… node collector-mac.mjs mock --dry    # print the envelope, send nothing
 *          INGEST_KEY=… AISSTREAM_KEY=… node collector-mac.mjs ships [--window=60] [--dry] [--quiet] [--state=DIR]
 *          node collector-mac.mjs retry --state=DIR          # upload the one pending envelope, if any (expired/oversize ones are dropped)
 * Hub:     HUB=https://mother-earth.chadoberholzer.workers.dev (default)
 * Needs Node 22+ (global fetch + global WebSocket). No dependencies.
 *
 * Exit codes (the runner relies on them):  0 collected and uploaded · 3 source-down report uploaded (collection failed, hub told)
 *   · 1 upload failed (envelope kept as the single pending file, 2 h expiry, 5 MB cap) · 2 usage/config error · 4 nothing pending (retry mode)
 * Bounded storage: nothing is archived locally — messages are processed in memory and only the finished envelope leaves the machine.
 *   The only files: <state>/pending.json (≤ 1 envelope) and whatever the runner logs. No credentials or vessel payloads are ever logged.
 * Sleep/interruption: message gaps > 10 s inside a sample are recorded as interruptions and subtracted from connected time; a sample whose
 *   wall-clock ran long (laptop slept) is marked degraded, never counted as observed.
 *
 * ships (aisstream.io, measured 31 Oct 2026 from aisstream.io/documentation): wss://stream.aisstream.io/v0/stream; one JSON
 * subscription within 3 s of connecting; 3 subscribed connections per account; read continuously or the service drops messages;
 * permessage-deflate recommended (uncompressed connections get bandwidth-limited from Sep 2026). Terrestrial AIS only: open ocean is
 * not covered, so a silent cell is not an empty cell (coverage stays 'partial' until receipt history exists — same rule as OpenSky, D9).
 */

const COLLECTOR_VERSION = 'mac-0.3.2';
const SCHEMA_VERSION = 1;
const CELL_DEG = 4;
const HUB = process.env.HUB || 'https://mother-earth.chadoberholzer.workers.dev';
const KEY = process.env.INGEST_KEY;
const [, , layer = 'mock', ...flags] = process.argv;
const dry = flags.includes('--dry');
const quiet = flags.includes('--quiet');
const flag = (name, dflt) => { const f = flags.find(x => x.startsWith('--' + name + '=')); return f ? f.slice(name.length + 3) : dflt; };
import fs from 'node:fs';
import path from 'node:path';
const STATE_DIR = flag('state', path.join(path.dirname(new URL(import.meta.url).pathname), 'state'));
const PENDING = path.join(STATE_DIR, 'pending.json');
const PENDING_MAX_BYTES = 5 * 1024 * 1024, PENDING_MAX_AGE_MS = 2 * 3600e3;
const UPLOAD_TIMEOUT_MS = 20e3, UPLOAD_BACKOFF_MS = [5e3, 20e3, 60e3];   // 3 tries inside one run; after that the envelope waits as pending
const GAP_S = 10;                                                         // a silence longer than this inside a sample is an interruption
const MAX_WALL_MULTIPLE = 2;                                              // a sample whose elapsed time exceeds this × its window is OVERLONG: bounded, never counted as listening
const OVERLONG_MULTIPLE = 1.25;                                           // elapsed beyond this × window is already not a clean sample, whatever the cause

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
    let messages = 0, parseErrors = 0, confirmed = false, compression = null, closeInfo = null, connectedAt = null, lastMsgAt = null, closedAt = null, noSourceTime = 0, olderIgnored = 0;
    const interruptions = [];                                                      // [{from, to, seconds}] gaps > GAP_S between messages (sleep, Wi-Fi loss, upstream silence)
    const t0 = Date.now(); const h0 = process.hrtime.bigint();
    let hardStop = null;
    await new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      ws.binaryType = 'arraybuffer';
      const timer = setTimeout(() => { try { ws.close(1000, 'window done'); } catch (_) {} resolve(); }, windowS * 1000);
      // Duration contract (1 Nov 2026). This timer bounds the sample ONLY while the process is actually running: a
      // suspended host runs no timers, so nothing here prevents a suspension overrun and no such claim is made. It
      // ends the run once the host is scheduling again, instead of holding a dead socket open. The real guard against
      // folding post-resumption data into an expired window is the elapsed check in onmessage below.
      hardStop = setTimeout(() => { try { ws.close(4000, 'overlong'); } catch (_) {} resolve(); }, MAX_WALL_MULTIPLE * windowS * 1000);
      const connectTimer = setTimeout(() => { if (!connectedAt) { try { ws.close(); } catch (_) {} reject(new Error('connect timeout (15 s)')); } }, 15e3);
      ws.onopen = () => {
        connectedAt = Date.now(); clearTimeout(connectTimer);
        ws.send(JSON.stringify({ APIKey: key, BoundingBoxes: [[[bbox[0], bbox[1]], [bbox[2], bbox[3]]]], FilterMessageTypes: Object.keys(CLASS) }));
      };
      ws.onerror = (ev) => { clearTimeout(timer); clearTimeout(hardStop); const er = ev && ev.error; reject(new Error('websocket error: ' + [ev && ev.message, er && er.message, er && er.cause && er.cause.message, er && er.cause && er.cause.code].filter(Boolean).join(' | ') || 'unknown (no detail from the socket)')); };
      ws.onclose = (ev) => { closeInfo = { code: ev.code, reason: ev.reason }; closedAt = Date.now(); clearTimeout(timer); clearTimeout(hardStop); resolve(); };
      ws.onmessage = (ev) => {
        // On resumption the timers above may not have fired while the host was away. Check elapsed time BEFORE accepting
        // anything: a message arriving past the hard bound belongs to a window that expired, so the sample is closed and
        // left unusable rather than topped up with data from long after the period it claims to describe.
        if (Date.now() - t0 > MAX_WALL_MULTIPLE * windowS * 1000) { try { ws.close(4000, 'overlong on resumption'); } catch (_) {} resolve(); return; }
        let m;
        try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8')); } catch (_) { parseErrors++; return; }
        if (m.MessageType === 'SubscriptionConfirmation') { confirmed = true; compression = m.Message && m.Message.CompressionEnabled; return; }
        const cls = CLASS[m.MessageType]; if (!cls) return;
        const now = Date.now();
        if (lastMsgAt && now - lastMsgAt > GAP_S * 1000) interruptions.push({ from: new Date(lastMsgAt).toISOString(), to: new Date(now).toISOString(), seconds: Math.round((now - lastMsgAt) / 1000) });
        messages++; lastMsgAt = now;
        const md = m.MetaData || {}; const pr = (m.Message || {})[m.MessageType] || {};
        const lat = Number(pr.Latitude ?? md.Latitude ?? md.latitude), lng = Number(pr.Longitude ?? md.Longitude ?? md.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
        const mmsi = String(md.MMSI ?? pr.UserID ?? '');
        if (!mmsi) return;
        // observed_at = the source's own time, or null when the source gives none (never "now" — that would claim more than the source supplied). received_at is ours.
        const tUtc = md.time_utc ? new Date(String(md.time_utc).replace(' +0000 UTC', 'Z').replace(' ', 'T')) : null;
        const observedAt = tUtc && !isNaN(tUtc) ? tUtc.toISOString() : null;
        if (!observedAt) noSourceTime++;
        // "latest" = the newest source time when both carry one; otherwise the last one received.
        const prev = vessels.get(mmsi);
        if (prev && prev[3] && observedAt && Date.parse(observedAt) < Date.parse(prev[3])) { olderIgnored++; return; }
        vessels.set(mmsi, [mmsi, lat, lng, observedAt, nowIso(), pr.Sog ?? null, pr.Cog ?? null, pr.TrueHeading ?? null, pr.NavigationalStatus ?? null, cls, String(md.ShipName || '').trim().slice(0, 40)]);
      };
    });
    const wallS = (Date.now() - t0) / 1000;
    const monoS = Number(process.hrtime.bigint() - h0) / 1e9;                                       // monotonic; a laptop sleep shows as wall ≫ mono
    const slept = wallS - monoS > 5;
    const end = closedAt || Date.now();
    const quietS = connectedAt && lastMsgAt ? (end - lastMsgAt) / 1000 : null;                      // seconds between the last message and close
    if (lastMsgAt && quietS > GAP_S) interruptions.push({ from: new Date(lastMsgAt).toISOString(), to: new Date(end).toISOString(), seconds: Math.round(quietS) });
    const lostS = interruptions.reduce((n, i) => n + i.seconds, 0);
    /* Three DIFFERENT durations, never to be merged or swapped for one another:
     *   elapsedWallS  — measured: start of the attempt to its end. Includes any time the host was away.
     *   socketS       — measured: how long the transport reported the socket connected.
     *   gapS          — measured: the sum of silences > GAP_S between message arrivals.
     *   flowingS      — INFERRED: socketS − gapS. It is arithmetic on arrival times, not an observation of reception,
     *                   and it is never geographic coverage: it says nothing about which seas a receiver could hear. */
    const elapsedWallS = wallS;
    const socketS = connectedAt ? (end - connectedAt) / 1000 : 0;
    const gapS = lostS;
    const flowingS = Math.max(0, socketS - gapS);
    const upFrac = Math.max(0, Math.min(1, flowingS / windowS));
    if (!confirmed) throw new Error('no SubscriptionConfirmation within the window' + (closeInfo ? ' (close ' + closeInfo.code + ' ' + closeInfo.reason + ')' : ''));
    const rows = [...vessels.values()];
    const rowsA = rows.filter(r => r[9] === 'A').length;
    /* A nominal windowS sample that took far longer in elapsed time is an interrupted/overlong sample, whatever the cause,
     * and it is degraded on that fact alone — we do NOT need to know why to know it is not a clean 60 s of listening.
     * `slept` is only this detector's verdict: on macOS both clocks can include suspend time, so slept=false does not
     * establish that the host stayed awake. That is what the untested "sleep mid-sample" acceptance test (STATUS Next 0)
     * exists to settle. Until it is run, treat a long gap as "a gap in locally processed messages" of unestablished origin. */
    const overlong = wallS > OVERLONG_MULTIPLE * windowS;
    const status = upFrac >= 0.9 && !slept && !overlong ? 'ok' : 'degraded';
    console.error(`ships: window=${windowS}s wall=${wallS.toFixed(1)}s mono=${monoS.toFixed(1)}s slept=${slept} overlong=${overlong} status=${status} socket=${socketS.toFixed(1)}s flowing=${flowingS.toFixed(1)}s(inferred) interruptions=${interruptions.length} (${lostS}s) quiet_at_end=${quietS === null ? '?' : quietS.toFixed(1)}s messages=${messages} vessels=${rows.length} (A=${rowsA} B=${rows.length - rowsA}) no_source_time=${noSourceTime} older_ignored=${olderIgnored} compression=${compression} parseErrors=${parseErrors} close=${JSON.stringify(closeInfo)}`);
    return { fields: ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'], rows,
      quantity: `vessel identities (MMSI) with a Class A or B position report received during a ${windowS} s AIS sample, per cell; latest received position per vessel — terrestrial AIS, so open ocean is not covered; a silent cell is not an empty cell; positions between samples unknown`,
      coverageDefault: { grade: 'partial', evidence: 'messages_flowing_inferred_from_arrival_gaps;not_a_measure_of_reception;not_geographic_coverage;receipt_history_pending;terrestrial_ais_only', observed_fraction: upFrac },
      extra: { scope: bbox.join(',') === '-90,-180,90,180' ? 'world' : 'bbox ' + bbox.join(','), window_s: windowS,
        socket_connected_s: Math.round(socketS * 10) / 10,                                  // measured
        message_gap_s: Math.round(gapS * 10) / 10,                                          // measured
        elapsed_wall_s: Math.round(elapsedWallS * 10) / 10,                                 // measured
        messages_flowing_s: Math.round(flowingS * 10) / 10,                                 // INFERRED: socket_connected_s − message_gap_s
        durations_note: 'socket_connected_s, message_gap_s and elapsed_wall_s are measured; messages_flowing_s is inferred by subtracting the gaps and is not a measurement of reception, nor any statement about geographic coverage',
        quiet_at_end_s: quietS, connection_fraction_of_sample: upFrac, messages, class_a: rowsA, class_b: rows.length - rowsA,
        interruptions_override: interruptions, wall_s: Math.round(wallS * 10) / 10, mono_s: Math.round(monoS * 10) / 10, slept_during_sample: slept,
        overlong_sample: overlong, elapsed_not_counted_s: overlong ? Math.round((elapsedWallS - flowingS) * 10) / 10 : 0,
        duration_rule: `elapsed time (${Math.round(elapsedWallS)} s) is never counted as listening; a sample over ${OVERLONG_MULTIPLE}× its ${windowS} s window is degraded whatever the cause, is closed at ${MAX_WALL_MULTIPLE}× once the process runs again, and rejects messages arriving past that bound`,
        sleep_detector_caveat: 'slept = (wall - monotonic > 5 s); on macOS both clocks may include host suspend, so slept=false does not establish the host stayed awake',
        records_without_source_time: noSourceTime, older_reports_ignored: olderIgnored, sampling: 'one sample per run; runs are scheduled roughly every 30 min while the collector is available; no observation between samples',
        compression_enabled: compression, parse_errors: parseErrors, close: closeInfo, stale_after_s: 3 * 3600, source_status_override: status,
        citation: 'AIS data via aisstream.io (aisstream.io; free API, server-side use only)' } };
  },
};

async function main() {
  if (!FEEDS[layer]) { console.error('unknown layer', layer, '— known:', Object.keys(FEEDS).join(', ') + ', retry'); process.exit(2); }
  const scheduledMs = Date.now();
  let e;
  try {
    const f = await FEEDS[layer]();
    const cells = {};
    const iLat = f.fields.indexOf('lat'), iLng = f.fields.indexOf('lng');
    for (const r of f.rows) { const id = cellId(r[iLat], r[iLng]); (cells[id] || (cells[id] = { count: 0 })).count++; }
    for (const id in cells) cells[id].coverage = { ...f.coverageDefault };
    const extra = { ...(f.extra || {}) }; const status = extra.source_status_override || 'ok'; delete extra.source_status_override;
    const interruptions = extra.interruptions_override || []; delete extra.interruptions_override;
    e = { schema_version: SCHEMA_VERSION, collector_version: COLLECTOR_VERSION, layer,
      window_start: new Date(scheduledMs).toISOString(), window_end: nowIso(), retrieved_at: nowIso(),
      scheduled_for: new Date(scheduledMs).toISOString(), source_status: status, interruptions,
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
  const code = await upload(e);
  process.exit(code === 0 && e.source_status === 'down' ? 3 : code);
}

/* Upload with bounded timeouts and backoff. On final failure keep the envelope as the single pending file (identity and timestamps intact). */
async function upload(e) {
  const body = JSON.stringify(e);
  for (let i = 0; i <= UPLOAD_BACKOFF_MS.length; i++) {
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const r = await fetch(`${HUB}/ingest/${e.layer}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY, 'User-Agent': 'mother-earth-' + COLLECTOR_VERSION }, body, signal: ac.signal });
      const t = await r.text();
      console.log(r.status, t.slice(0, 300));
      if (r.ok) { dropPending(); return 0; }
      if (r.status >= 400 && r.status < 500) { console.error('rejected by hub; not retrying'); dropPending(); return 1; }   // 4xx: our envelope is wrong — retrying will not help
    } catch (err) { console.error(`upload attempt ${i + 1} failed: ${String(err && err.name === 'AbortError' ? 'timeout' : err).slice(0, 120)}`); }
    finally { clearTimeout(to); }
    if (i < UPLOAD_BACKOFF_MS.length) await new Promise(r => setTimeout(r, UPLOAD_BACKOFF_MS[i]));
  }
  savePending(e, body); return 1;
}
function savePending(e, body) {
  try {
    if (body.length > PENDING_MAX_BYTES) { console.error(`pending envelope ${body.length} bytes exceeds the ${PENDING_MAX_BYTES} byte cap; dropped`); return; }
    fs.mkdirSync(STATE_DIR, { recursive: true }); fs.writeFileSync(PENDING, body);
    console.error(`kept as pending: ${PENDING} (${body.length} bytes, retrieved_at ${e.retrieved_at}; expires 2 h after that)`);
  } catch (err) { console.error('could not write pending file: ' + String(err).slice(0, 120)); }
}
function dropPending() { try { fs.unlinkSync(PENDING); } catch (_) {} }
async function retryPending() {
  if (!fs.existsSync(PENDING)) { console.error('nothing pending'); process.exit(4); }
  let e; try { e = JSON.parse(fs.readFileSync(PENDING, 'utf8')); } catch (_) { console.error('pending file unreadable; dropped'); dropPending(); process.exit(4); }
  if (Date.now() - Date.parse(e.retrieved_at) > PENDING_MAX_AGE_MS) { console.error(`pending envelope from ${e.retrieved_at} expired (> 2 h); dropped — the hub would refuse it anyway`); dropPending(); process.exit(4); }
  if (!KEY) { console.error('INGEST_KEY not set'); process.exit(2); }
  console.error(`retrying pending envelope: layer=${e.layer} retrieved_at=${e.retrieved_at} records=${(e.records || []).length}`);
  process.exit(await upload(e));
}
if (layer === 'retry') retryPending(); else main();
