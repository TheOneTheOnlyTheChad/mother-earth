/* Diviner GCP band acquisition job, run inside the browser pane on a pds-geosciences.wustl.edu page (MOON-DIVINER-PROPOSAL rev 2 §7).
 * Build tooling only; never served on the site. Loaded by the operator from raw.githubusercontent.com at a pinned commit, after
 * mehash.js and gcp_stream.js have been loaded and their SHA-256 checked against the values recorded in the checkpoint.
 *
 * pane_job-2 (26 Nov 2026, after GPT's first-band trial review): exports are bound to the current, verified run.
 *  - start() refuses while a run is active, then releases every previous output and status field before the new run begins.
 *    Each run gets a runId; its outputs carry { runId, band }.
 *  - Outputs exist only after every check has passed: HTTP 200; Content-Length (when sent) = expected bytes; never more bytes than
 *    expected; total bytes = expected; computed MD5 = archive MD5 (checked BEFORE the parser's finish and before any reduction or
 *    compression); structure (GcpStream). Any failure sets phase 'integrity-failed' or 'error', keeps no outputs, cancels the stream
 *    reader and aborts the request.
 *  - download(which, name, runId, band) and piece(which, start, length, runId, band) work only when phase is 'done' and runId and
 *    band match the completed run; which must be 'ext' or 'planes'; a download name must contain the band. Anything else throws.
 *
 * DivTrial.start(cfg) returns at once with { runId }; poll DivTrial.status() (tool calls have a 45 s limit).
 * cfg = { url, band, lat0x100, archiveMd5, expectBytes, keep: [{ name, start, length }], lonStart?, nLon? } (lonStart 0 and nLon 720
 * for a whole band; other values only in tests). Heap readings: performance.memory.usedJSHeapSize, Chromium JS heap only. */
(function () {
  'use strict';
  const VERSION = 'pane_job-2';
  const heap = () => (typeof performance !== 'undefined' && performance.memory ? performance.memory.usedJSHeapSize : null);
  const subtleHex = async u8 => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u8))].map(b => b.toString(16).padStart(2, '0')).join('');
  const gz = async u8 => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const ACTIVE = new Set(['fetching', 'checking', 'reducing']);

  let seq = 0;
  let st = { phase: 'idle' };   // status of the current run only (replaced at every start)
  let out = null;               // { runId, band, ext, planes } only after a fully verified run
  let ctx = null;               // { runId, ctl, reader } of the active run

  function release(c) {
    if (!c) return;
    try { if (c.reader) c.reader.cancel().catch(() => {}); } catch (e) { /* already closed */ }
    try { c.ctl.abort(); } catch (e) { /* nothing to abort */ }
    st.cancelled = true;
  }
  function fail(runId, phase, msg) {
    if (!ctx || ctx.runId !== runId) return;     // a stale run cannot touch the current state
    out = null;                                  // failed runs keep nothing
    release(ctx); ctx = null;
    st.phase = phase; st.error = msg; st.failedAt = new Date().toISOString();
  }
  class IntegrityError extends Error {}

  async function run(cfg, runId) {
    const { GcpBand, bandPlanes, extractionBytes } = window.GcpStream;
    const c = ctx;
    const nLon = cfg.nLon || 720, lonStart = cfg.lonStart || 0;
    const md5 = new window.MEHash.MD5(), sha = new window.MEHash.SHA256();
    const band = new GcpBand({ lat0x100: cfg.lat0x100, lonStart, nLon, header: true, extract: true });
    const keep = (cfg.keep || []).map(k => ({ ...k, buf: new Uint8Array(k.length), got: 0 }));
    const res = await fetch(cfg.url, { cache: 'no-store', signal: c.ctl.signal });
    if (c !== ctx) return;
    st.http = { status: res.status, contentLength: res.headers.get('content-length'), lastModified: res.headers.get('last-modified'), date: res.headers.get('date'), contentType: res.headers.get('content-type') };
    if (res.status !== 200) { if (res.body) c.reader = res.body.getReader(); throw new Error('HTTP ' + res.status); }
    if (st.http.contentLength !== null && Number(st.http.contentLength) !== cfg.expectBytes)
      { c.reader = res.body.getReader(); throw new IntegrityError(`Content-Length ${st.http.contentLength} where ${cfg.expectBytes} expected`); }
    c.reader = res.body.getReader();
    let pos = 0;
    for (;;) {
      const { done, value } = await c.reader.read();
      if (c !== ctx) return;
      if (done) break;
      if (pos + value.length > cfg.expectBytes) throw new IntegrityError(`more than the expected ${cfg.expectBytes} bytes`);
      md5.update(value); sha.update(value); band.push(value);   // a parse error throws here and ends the run
      for (const k of keep) {
        const a = Math.max(pos, k.start), b = Math.min(pos + value.length, k.start + k.length);
        if (a < b) { k.buf.set(value.subarray(a - pos, b - pos), a - k.start); k.got += b - a; }
      }
      pos += value.length; st.bytes = pos; st.chunks++; if (value.length > st.maxChunk) st.maxChunk = value.length;
      if (st.chunks % 64 === 0) { const h = heap(); if (h > st.heapMax) st.heapMax = h; }
    }
    c.reader = null;
    st.streamEndMs = Math.round(performance.now() - st.t0); st.phase = 'checking';
    // integrity first: nothing is reduced, compressed or exportable unless size and archive MD5 match
    st.sizeMatch = pos === cfg.expectBytes;
    if (!st.sizeMatch) throw new IntegrityError(`received ${pos} bytes where ${cfg.expectBytes} expected`);
    st.md5 = md5.hex(); st.sha256 = sha.hex(); st.md5Match = st.md5 === String(cfg.archiveMd5).toLowerCase();
    if (!st.md5Match) throw new IntegrityError(`MD5 ${st.md5} differs from the archive's ${String(cfg.archiveMd5).toLowerCase()}`);
    const r = band.finish();
    st.records = r.records; st.sentinels = r.sentinels; st.tbolMin = r.tbolMin; st.tbolMax = r.tbolMax;
    st.headerText = new TextDecoder('ascii').decode(r.header); st.headerSha = await subtleHex(r.header);
    st.kept = {};
    for (const k of keep) { st.kept[k.name] = { start: k.start, length: k.length, got: k.got, sha256: await subtleHex(k.buf) }; if (k.got !== k.length) throw new IntegrityError(`kept range ${k.name} incomplete`); }
    if (c !== ctx) return;
    st.phase = 'reducing';
    const planes = bandPlanes(r, { nLon, lonStart, lat0x100: cfg.lat0x100 }).bytes;
    const xb = extractionBytes(r.extraction), xz = await gz(xb);
    st.planesSha = await subtleHex(planes); st.planesBytes = planes.length;
    st.extRawSha = await subtleHex(xb); st.extRawBytes = xb.length; st.extGzSha = await subtleHex(xz); st.extGzBytes = xz.length;
    if (c !== ctx) return;
    const h = heap(); if (h > st.heapMax) st.heapMax = h; st.heapEnd = h;
    st.totalMs = Math.round(performance.now() - st.t0); st.finishedAt = new Date().toISOString();
    out = { runId, band: cfg.band, ext: xz, planes };   // the only place outputs are published
    ctx = null; st.phase = 'done';
  }

  function exportable(which, runId, band) {
    if (which !== 'ext' && which !== 'planes') throw new Error(`unknown output '${which}'`);
    if (st.phase !== 'done' || !out) throw new Error(`no verified output (phase ${st.phase})`);
    if (runId !== out.runId || band !== out.band) throw new Error(`output belongs to run ${out.runId} band ${out.band}, not run ${runId} band ${band}`);
    return which === 'ext' ? out.ext : out.planes;
  }

  window.DivTrial = {
    VERSION,
    start(cfg) {
      if (ctx || ACTIVE.has(st.phase)) return { started: false, reason: 'already running' };
      if (!cfg || typeof cfg.url !== 'string' || typeof cfg.band !== 'string' || typeof cfg.lat0x100 !== 'number' ||
          !/^[0-9a-fA-F]{32}$/.test(String(cfg.archiveMd5)) || !(cfg.expectBytes > 0)) return { started: false, reason: 'bad configuration' };
      out = null;                                  // previous outputs are released before the new run begins
      const runId = ++seq;
      st = { phase: 'fetching', runId, band: cfg.band, version: VERSION, startedAt: new Date().toISOString(), t0: performance.now(), heap0: heap(), heapMax: heap(), chunks: 0, bytes: 0, maxChunk: 0 };
      ctx = { runId, ctl: new AbortController(), reader: null };
      run(cfg, runId).catch(e => fail(runId, e instanceof IntegrityError ? 'integrity-failed' : 'error', String(e && e.message || e)));
      return { started: true, runId };
    },
    status() { const o = {}; for (const [k, v] of Object.entries(st)) if (k !== 't0') o[k] = v; o.elapsedMs = st.t0 ? Math.round(performance.now() - st.t0) : 0; o.heapNow = heap(); o.exportable = !!(out && st.phase === 'done'); return o; },
    download(which, name, runId, band) {
      const u8 = exportable(which, runId, band);
      if (typeof name !== 'string' || !name.includes(band)) throw new Error(`download name must contain the band '${band}'`);
      const url = URL.createObjectURL(new Blob([u8], { type: 'application/octet-stream' }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return { name, bytes: u8.length, runId, band };
    },
    piece(which, start, length, runId, band) {
      const u8 = exportable(which, runId, band), c = u8.subarray(start, start + length);
      let s = ''; for (let i = 0; i < c.length; i += 32768) s += String.fromCharCode.apply(null, c.subarray(i, i + 32768));
      return btoa(s);
    },
  };
})();
