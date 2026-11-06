// 5 Nov 2026 FIRMS recovery — R2-only write procedure (rev 2). Runs in a dash.cloudflare.com browser-pane tab
// (signed in) via javascript_tool. Review: reviews/2026-11-06-firms-recovery-5nov.md §7.
//
// Writes exactly ONE object, archive/recoveries/firms/2026-11-05.json.gz, and nothing else: no D1 write, no hub
// deploy, no page change. Everything except REC.put() is read-only. REC.put() refuses unless the bytes in the page
// hash to the pinned SHA-256, refuses to replace an existing object, and treats an identical existing object as a no-op.
//
// Load: paste this file into javascript_tool once (it defines window.REC). Then, one call each:
//   0. await REC.precheck()            read-only: destination absent? lifecycle rules; "before" state of the originals
//   1. REC.addChunk(i, '<base64>')     × N, then REC.assemble()  — bytes pass in-page SHA-256 + size before anything else
//   2. await REC.put()                 THE WRITE (needs Chad's Approve line)
//   3. await REC.verify()              read-only: read back, hash, size, gunzip, content checks
//   4. await REC.untouched()           read-only: originals identical to the "before" state from step 0
//   5. REC.log                         write time + every result, copied into the review §10 and STATUS
(() => {
  const ACCT = '0538d0fe34d9fd261a2eac11583f8972', BUCKET = 'mother-earth';
  const PIN = {
    key: 'archive/recoveries/firms/2026-11-05.json.gz',
    bytes: 659639,
    sha256: '624ecf2ed864465137cb20ddc999d594cbbdeefcce7b9f0f682aede75678096e',
    contentType: 'application/gzip',
    expect: { kind: 'recovery', layer: 'firms', day: '2026-11-05', recovery_ref: 'recovery-generated:firms:2026-11-05:c3487dcc3e06',
      input_sha256: 'c3487dcc3e063db3dcbc7f76f272e00aaaf1bded83906c79b4c180619262bab8', input_r2_uploaded_at: '2026-11-05T23:45:43.250Z',
      input_retrieved_at: null, run_history_assessed: false, rows: 63614, distinct: 63591, excess: 23, cells: 641,
      latest_observation_at: '2026-11-05T21:36:00Z', recovery_created_at: '2026-11-06T08:06:37.000Z' },
  };
  const ORIGINAL = 'archive/checkpoints/firms/2026-11-05.json.gz';
  const API = `/api/v4/accounts/${ACCT}`;
  const H = () => ({ 'x-atok': window.bootstrap && window.bootstrap.atok });
  const enc = k => k.split('/').map(encodeURIComponent).join('/');
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const sha = async buf => hex(await crypto.subtle.digest('SHA-256', buf));
  const json = async (u, o = {}) => { const r = await fetch(API + u, { ...o, headers: { ...H(), ...(o.headers || {}) } }); return { status: r.status, body: await r.json().catch(() => null) }; };
  // exact-key listing: returns the object's listing entry or null
  const stat = async key => { const r = await json(`/r2/buckets/${BUCKET}/objects?prefix=${encodeURIComponent(key)}`);
    if (r.status !== 200) throw new Error(`list ${key}: HTTP ${r.status}`);
    return (r.body.result || []).find(o => o.key === key) || null; };
  const getBytes = async key => { const r = await fetch(`${API}/r2/buckets/${BUCKET}/objects/${enc(key)}`, { headers: H() });
    if (r.status !== 200) throw new Error(`get ${key}: HTTP ${r.status}`); return r.arrayBuffer(); };
  const d1 = async sql => { const r = await json(`/d1/database/${REC.dbId}/query`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sql }) });
    if (r.status !== 200 || !r.body.success) throw new Error(`d1: HTTP ${r.status} ${JSON.stringify(r.body && r.body.errors)}`); return r.body.result[0].results; };
  const D1_READS = {   // read-only; compared before vs after
    archive_checkpoints: "SELECT * FROM archive_checkpoints WHERE layer='firms' AND day='2026-11-05'",
    coverage: "SELECT * FROM archive_checkpoint_coverage WHERE layer='firms' AND day='2026-11-05'",
    fires_daily: "SELECT COUNT(*) AS n, SUM(detections) AS det, MAX(frp_max_mw) AS frpmax FROM fires_daily WHERE day='2026-11-05'",
  };
  const originals = async () => {
    const o = await stat(ORIGINAL), out = { r2: o && { key: o.key, size: o.size, etag: o.etag, last_modified: o.last_modified } };
    for (const [k, q] of Object.entries(D1_READS)) out[k] = await d1(q);
    return out;
  };
  const REC = window.REC = { PIN, log: [], chunks: [], buf: null, dbId: null, before: null };
  const note = (step, result) => { const e = { step, at: new Date().toISOString(), result }; REC.log.push(e); return e; };

  REC.precheck = async () => {
    if (!H()['x-atok']) throw new Error('not signed in to the dashboard (no x-atok)');
    const st = await json(`/workers/scripts/mother-earth/settings`);
    const db = (st.body && st.body.result && st.body.result.bindings || []).find(b => b.type === 'd1' && b.name === 'DB');
    if (!db) throw new Error('DB binding not found'); REC.dbId = db.id;
    const dest = await stat(PIN.key);
    const lc = await json(`/r2/buckets/${BUCKET}/lifecycle`);
    const rules = (lc.body && lc.body.result && lc.body.result.rules || []).map(r => ({ id: r.id, enabled: r.enabled, prefix: r.conditions && r.conditions.prefix }));
    const coveredByRule = rules.filter(r => r.enabled && PIN.key.startsWith(r.prefix || '')).map(r => r.id);
    REC.before = await originals();
    return note('0 precheck', { destination_exists: !!dest, destination: dest, lifecycle_rules: rules, rules_matching_destination: coveredByRule, before: REC.before });
  };
  REC.addChunk = (i, b64) => { REC.chunks[i] = b64; return { i, chars: b64.length, have: REC.chunks.filter(Boolean).length }; };
  REC.assemble = async () => {
    const bin = atob(REC.chunks.join('')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const h = await sha(u.buffer); const ok = u.length === PIN.bytes && h === PIN.sha256;
    REC.buf = ok ? u.buffer : null; REC.chunks = [];
    return note('1 assemble', { bytes: u.length, sha256: h, matches_pin: ok });
  };
  REC.put = async () => {
    if (!REC.buf || await sha(REC.buf) !== PIN.sha256) throw new Error('bytes in the page do not match the pinned SHA-256 — nothing written');
    if (!REC.before) throw new Error('run precheck() first');
    const ex = await stat(PIN.key);   // re-checked immediately before the write
    if (ex) {
      const h = await sha(await getBytes(PIN.key));
      if (h === PIN.sha256) return note('2 put', { action: 'no-op: identical object already present', existing: ex, sha256: h });
      return note('2 put', { action: 'STOPPED: a different object exists at the destination — needs review; nothing written', existing: ex, sha256: h });
    }
    const t0 = new Date().toISOString();
    const r = await fetch(`${API}/r2/buckets/${BUCKET}/objects/${enc(PIN.key)}`, { method: 'PUT', headers: { ...H(), 'content-type': PIN.contentType }, body: REC.buf });
    const body = await r.json().catch(() => null);
    return note('2 put', { action: r.ok ? 'written' : 'FAILED', http: r.status, request_started_at: t0, response_at: new Date().toISOString(), response: body });
  };
  REC.verify = async () => {
    const o = await stat(PIN.key); if (!o) return note('3 verify', { ok: false, reason: 'object not found' });
    const buf = await getBytes(PIN.key), h = await sha(buf);
    const txt = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    const r = JSON.parse(txt), E = PIN.expect;
    const checks = {
      sha256: h === PIN.sha256, bytes: buf.byteLength === PIN.bytes, listed_size: +o.size === PIN.bytes,
      kind: r.kind === E.kind, layer: r.layer === E.layer, day: r.day === E.day, recovery_ref: r.recovery_ref === E.recovery_ref,
      input_sha256: r.input && r.input.sha256 === E.input_sha256, input_r2_uploaded_at: r.times && r.times.input_r2_uploaded_at === E.input_r2_uploaded_at,
      input_retrieved_at_null: r.times && r.times.input_retrieved_at === E.input_retrieved_at, recovery_created_at: r.times && r.times.recovery_created_at === E.recovery_created_at,
      latest_observation_at: r.times && r.times.observations.latest_observation_at === E.latest_observation_at,
      run_history_not_assessed: r.run_history && r.run_history.assessed === E.run_history_assessed,
      counting: r.counting && r.counting.rows === E.rows && r.counting.distinct_parsed_records === E.distinct && r.counting.duplicate_excess_rows === E.excess,
      records: Array.isArray(r.records) && r.records.length === E.rows, cells: r.daily_cells && r.daily_cells.rows.length === E.cells,
      cell_sum: r.daily_cells && r.daily_cells.rows.reduce((s, x) => s + x[1], 0) === E.rows, limitations: Array.isArray(r.limitations) && r.limitations.length >= 5,
    };
    return note('3 verify', { ok: Object.values(checks).every(Boolean), checks, sha256: h, r2: { key: o.key, size: o.size, etag: o.etag, last_modified: o.last_modified, http_metadata: o.http_metadata } });
  };
  REC.untouched = async () => {
    const after = await originals();
    const same = {}; for (const k of Object.keys(after)) same[k] = JSON.stringify(after[k]) === JSON.stringify(REC.before[k]);
    return note('4 untouched', { ok: Object.values(same).every(Boolean), same, after });
  };
  return 'REC loaded: precheck → addChunk×N + assemble → put → verify → untouched';
})();
