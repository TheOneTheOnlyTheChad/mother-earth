// Job-level tests for pane_job.js (GPT first-band trial review: exports bound to the current, verified run). The real pane_job.js,
// mehash.js and gcp_stream.js run in a Node VM; fetch is mocked with a fixture built from a committed sample patch (a 113-byte header
// line + gcp_00n10n_rows0-19199.tab, 10 longitudes), served in chunks. No network. Usage:
//   node phase1/moonsci/diviner/test_pane_job.cjs <samples-dir>     (exit 1 on any failure)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), zlib = require('zlib');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const dir = process.argv[2];
const sampleP = [dir, path.join(dir, 'diviner')].map(d => path.join(d, 'gcp_00n10n_rows0-19199.tab')).find(p => fs.existsSync(p));
const hdr = Buffer.alloc(113, 32); hdr.write('   clon,   clat,   ltim,        t3,        t4,        t5,        t6,        t7,        t8,        t9,      tbol'); hdr[111] = 13; hdr[112] = 10;
const GOOD = Buffer.concat([hdr, fs.readFileSync(sampleP)]);
const GOOD_MD5 = crypto.createHash('md5').update(GOOD).digest('hex');
const BAD = Buffer.from(GOOD); BAD.set(Buffer.from('    abcde'), 113 + 5 * 113 + 102);   // record 5's tbol is not numeric

// one sandbox, like one pane tab, for every case (state carries over between runs exactly as in the pane)
const downloads = [];
const fetches = [];
function fetchMock(url, opts) {
  const spec = fetchMock.next; fetchMock.next = null;
  const rec = { url, opts, reads: 0, cancelled: false }; fetches.push(rec);
  if (spec.networkError) return Promise.reject(new TypeError('Failed to fetch'));
  const data = spec.data, chunk = spec.chunk || 65536;
  let pos = 0;
  const reader = {
    read: async () => {
      if (opts.signal && opts.signal.aborted) throw new DOMException('aborted', 'AbortError');
      if (spec.failAtRead !== undefined && rec.reads === spec.failAtRead) throw new TypeError('network error mid-stream');
      rec.reads++;
      if (spec.delay) await new Promise(r => setTimeout(r, spec.delay));
      if (pos >= data.length) return { done: true, value: undefined };
      const v = new Uint8Array(data.subarray(pos, pos + chunk)); pos += v.length; return { done: false, value: v };
    },
    cancel: async () => { rec.cancelled = true; },
  };
  const headers = { 'content-length': spec.contentLength === undefined ? String(data.length) : spec.contentLength, 'last-modified': 'fixture', date: new Date().toUTCString(), 'content-type': 'text/plain' };
  return Promise.resolve({ status: spec.status || 200, headers: { get: k => headers[k] === null ? null : (headers[k] ?? null) }, body: { getReader: () => reader } });
}
const sandbox = {
  console, crypto: crypto.webcrypto, TextDecoder, TextEncoder, Blob, Response, CompressionStream, DOMException, AbortController, setTimeout, clearTimeout, btoa, atob,
  performance: { now: () => performance.now(), memory: { usedJSHeapSize: 1 } },
  URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL: () => {} },
  document: { createElement: () => ({ click() { downloads.push(this.download); }, remove() {} }), body: { appendChild() {} } },
  fetch: fetchMock,
};
sandbox.window = sandbox; vm.createContext(sandbox);
for (const f of ['mehash.js', 'gcp_stream.js', 'pane_job.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), sandbox, { filename: f });
const J = sandbox.DivTrial;
const cfg = (o = {}) => Object.assign({ url: 'https://fixture/band.tab', band: 'fixA', lat0x100: 25, archiveMd5: GOOD_MD5, expectBytes: GOOD.length, nLon: 10, lonStart: 0,
  keep: [{ name: 'first', start: 113, length: 2169600 }] }, o);
const settle = async () => { for (let i = 0; i < 2000; i++) { const s = J.status(); if (!['fetching', 'checking', 'reducing'].includes(s.phase)) return s; await new Promise(r => setTimeout(r, 2)); } throw new Error('run did not settle'); };
const throws = (f, m) => { let t = false; try { f(); } catch (e) { t = true; } ok(t, m); };
const noExports = (runId, band, m) => { throws(() => J.download('ext', band + '.gz', runId, band), m + ': download ext refused'); throws(() => J.piece('planes', 0, 10, runId, band), m + ': piece planes refused'); };

(async () => {
  ok(J.VERSION === 'pane_job-2', 'version pane_job-2');
  // reference outputs computed directly with gcp_stream in this sandbox
  const G = sandbox.GcpStream;
  const b = new G.GcpBand({ lat0x100: 25, lonStart: 0, nLon: 10, header: true, extract: true }); b.push(new Uint8Array(GOOD)); const r = b.finish();
  const refExt = Buffer.from(G.extractionBytes(r.extraction)), refPlanes = Buffer.from(G.bandPlanes(r, { nLon: 10, lonStart: 0, lat0x100: 25 }).bytes);

  // 1. successful run: exports only with the right run id and band, and only for known outputs
  fetchMock.next = { data: GOOD, chunk: 7919 };
  const s1 = J.start(cfg()); ok(s1.started && s1.runId === 1, 'case 1 started as run 1');
  let st = await settle(); ok(st.phase === 'done' && st.exportable, 'case 1 done and exportable');
  ok(st.md5Match && st.sizeMatch && st.kept.first.sha256 === crypto.createHash('sha256').update(GOOD.subarray(113, 113 + 2169600)).digest('hex'), 'case 1 integrity and kept range');
  const ext1 = Buffer.from(J.piece('ext', 0, 1e9, 1, 'fixA'), 'base64');
  ok(zlib.gunzipSync(ext1).equals(refExt), 'case 1 exported extraction equals the direct reference');
  ok(Buffer.from(J.piece('planes', 0, 1e9, 1, 'fixA'), 'base64').equals(refPlanes), 'case 1 exported planes equal the direct reference');
  const d = J.download('ext', 'gcp-fixA.gz', 1, 'fixA'); ok(d.bytes === ext1.length && downloads.at(-1) === 'gcp-fixA.gz', 'case 1 download of the current verified run');
  throws(() => J.download('ext', 'gcp-fixA.gz', 2, 'fixA'), 'case 1 wrong run id refused');
  throws(() => J.download('ext', 'gcp-fixB.gz', 1, 'fixB'), 'case 1 wrong band refused');
  throws(() => J.download('ext', 'other-name.gz', 1, 'fixA'), 'case 1 download name without the band refused');
  throws(() => J.piece('source', 0, 10, 1, 'fixA'), 'case 1 unknown output selector refused');
  ok(J.start({ url: 'x' }).started === false, 'case 1 bad configuration refused');
  ok(J.status().phase === 'done' && J.status().exportable, 'case 1 a refused start leaves the verified run intact');

  // 2. run B after A fails early (network error at the first read): A's outputs are released at B's start; B exports nothing
  fetchMock.next = { data: GOOD, failAtRead: 0, delay: 1 };
  const s2 = J.start(cfg({ band: 'fixB' })); ok(s2.started && s2.runId === 2, 'case 2 started as run 2');
  noExports(1, 'fixA', 'case 2 while B runs, A (previous band)');
  st = await settle(); ok(st.phase === 'error' && /network error/.test(st.error), 'case 2 network failure -> error');
  noExports(1, 'fixA', 'case 2 after B failed, A'); noExports(2, 'fixB', 'case 2 failed B');
  ok(!('md5' in st) && !('planesSha' in st) && !('kept' in st) && st.band === 'fixB', 'case 2 no stale status fields from run 1');
  ok(fetches.at(-1).cancelled, 'case 2 reader cancelled');

  // 3. wrong archive MD5: integrity failure before reduction; no outputs
  fetchMock.next = { data: GOOD, chunk: 65536 };
  const s3 = J.start(cfg({ band: 'fixC', archiveMd5: '0'.repeat(32) })); st = await settle();
  ok(st.phase === 'integrity-failed' && /MD5/.test(st.error), 'case 3 wrong MD5 -> integrity-failed');
  ok(!('planesSha' in st) && !('extGzSha' in st) && !('records' in st), 'case 3 nothing reduced or compressed after the MD5 failure');
  noExports(s3.runId, 'fixC', 'case 3');

  // 4. wrong size via Content-Length: refused before reading; stream cancelled
  fetchMock.next = { data: GOOD };
  const s4 = J.start(cfg({ band: 'fixD', expectBytes: GOOD.length + 1 })); st = await settle();
  ok(st.phase === 'integrity-failed' && /Content-Length/.test(st.error), 'case 4 Content-Length mismatch -> integrity-failed');
  ok(fetches.at(-1).reads === 0 && fetches.at(-1).cancelled, 'case 4 no body read; reader cancelled');
  noExports(s4.runId, 'fixD', 'case 4');

  // 5. wrong size without Content-Length: the stream is longer than expected -> cancelled as soon as it exceeds
  fetchMock.next = { data: GOOD, contentLength: null, chunk: 65536 };
  const s5 = J.start(cfg({ band: 'fixE', expectBytes: 300000 })); st = await settle();
  ok(st.phase === 'integrity-failed' && /more than/.test(st.error), 'case 5 too many bytes -> integrity-failed');
  ok(fetches.at(-1).cancelled && fetches.at(-1).reads <= 6, `case 5 stopped early (${fetches.at(-1).reads} reads) and cancelled`);
  noExports(s5.runId, 'fixE', 'case 5');
  // 5b. shorter than expected, no Content-Length
  fetchMock.next = { data: GOOD.subarray(0, GOOD.length - 113), contentLength: null };
  const s5b = J.start(cfg({ band: 'fixE2' })); st = await settle();
  ok(st.phase === 'integrity-failed' && /received/.test(st.error), 'case 5b too few bytes -> integrity-failed');
  noExports(s5b.runId, 'fixE2', 'case 5b');

  // 6. parse failure early in the stream: error, stream cancelled after few reads, no outputs
  fetchMock.next = { data: BAD, chunk: 4096 };
  const s6 = J.start(cfg({ band: 'fixF', archiveMd5: crypto.createHash('md5').update(BAD).digest('hex') })); st = await settle();
  ok(st.phase === 'error' && /tbol not numeric/.test(st.error), 'case 6 parse failure -> error');
  ok(fetches.at(-1).cancelled && fetches.at(-1).reads <= 2, `case 6 stopped at the failing chunk (${fetches.at(-1).reads} reads) and cancelled`);
  noExports(s6.runId, 'fixF', 'case 6');

  // 7. HTTP 404
  fetchMock.next = { data: Buffer.from('not found'), status: 404 };
  const s7 = J.start(cfg({ band: 'fixG' })); st = await settle();
  ok(st.phase === 'error' && /HTTP 404/.test(st.error) && fetches.at(-1).cancelled, 'case 7 HTTP 404 -> error, body cancelled');
  noExports(s7.runId, 'fixG', 'case 7');
  // 7b. the request itself fails
  fetchMock.next = { networkError: true };
  const s7b = J.start(cfg({ band: 'fixG2' })); st = await settle();
  ok(st.phase === 'error' && /Failed to fetch/.test(st.error), 'case 7b request failure -> error');
  noExports(s7b.runId, 'fixG2', 'case 7b');

  // 8. export and second start during an active run are refused; the run then completes normally (retry after failures)
  fetchMock.next = { data: GOOD, chunk: 113 * 50, delay: 1 };
  const s8 = J.start(cfg({ band: 'fixH' })); ok(s8.started, 'case 8 retry started');
  noExports(s8.runId, 'fixH', 'case 8 during the active run');
  ok(J.start(cfg({ band: 'fixI' })).started === false, 'case 8 second start while active refused');
  st = await settle(); ok(st.phase === 'done' && st.runId === s8.runId, 'case 8 retry completed');
  ok(zlib.gunzipSync(Buffer.from(J.piece('ext', 0, 1e9, s8.runId, 'fixH'), 'base64')).equals(refExt), 'case 8 retry exports the current verified data');
  noExports(1, 'fixA', 'case 8 old run 1 still refused');

  console.log(`pane_job: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL harness: ' + e.stack); process.exit(1); });
