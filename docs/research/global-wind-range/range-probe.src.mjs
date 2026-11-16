// ---- Wind range-request probe Worker (private, temporary, read-only). No bindings, no schedule, no storage. ----
// Why: hub 0.6.16 twice (16 Nov 14:19 and 14:22 UTC) got 206 with the right headers for the first wind field of run 2026111606 and then
// could not finish reading the body in 30 s. This probe asks for THAT byte range of THAT object, changing one thing at a time.
// Everything is pinned in this file: one host, one object, one byte range. A request must carry the probe key (only its SHA-256 is here);
// without it the answer is 404 and no upstream request is made. The caller picks one of the fixed sequences below by letter, nothing else.
// Each step uses the hub's own User-Agent and the hub's own 30-second abort signal. Only the cache setting differs between steps.
const URL_OBJ = 'https://noaa-gfs-bdp-pds.s3.amazonaws.com/gfs.20261116/06/atmos/gfs.t06z.pgrb2.0p25.f000';
const START = 410321002, END = 411280101, LEN = 959100, TOTAL = 497550596;       // index line 585: UGRD, 10 m above ground, anl
const ETAG = '"9db02525a99a3da5703e33e26f82a9d0"';
const BODY_SHA256 = '83eb6f5e51ce1a3f4eb562dbc6938fbf3bfe34667d932a42e2393f911d2b1386';   // the same range read in a browser, 14:27:34 UTC
const UA = 'mother-earth-collector/0.6.16 (open project; github.com/TheOneTheOnlyTheChad)';   // as hub 0.6.16 sends it
const TIMEOUT_MS = 30000;                                                           // as WIND.TIMEOUT_MS in hub 0.6.16
const NOT_AFTER = Date.parse('__NOT_AFTER__');
const KEY_SHA256 = '__KEY_SHA256__';
// cache settings: 'cf0' is what hub 0.6.16 sends; 'plain' sends no cache setting; 'nostore' is Cloudflare's documented bypass
const MODES = { cf0: { cf: { cacheTtl: 0 } }, plain: {}, nostore: { cache: 'no-store' } };
const SEQUENCES = {
  A: [['GET', 'cf0'], ['GET', 'plain']],          // the hub's range request, then the same without the cache setting
  B: [['GET', 'plain'], ['GET', 'cf0']],          // reverse order, to check for an order effect
  C: [['GET', 'nostore']],                        // the documented bypass, alone
  D: [['HEAD', 'cf0'], ['GET', 'cf0']],           // the hub's own order: object check, then the range, both with the cache setting
  E: [['HEAD', 'cf0'], ['GET', 'plain']],         // does the hub's object check alone spoil a plain range request after it?
};
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (bytes) => hex(await crypto.subtle.digest('SHA-256', bytes));
const pick = (h) => { const o = {}; for (const k of ['content-range', 'content-length', 'etag', 'cf-cache-status', 'age', 'accept-ranges', 'last-modified', 'server']) { const v = h.get(k); if (v !== null) o[k] = v; } return o; };

async function step(method, mode, fetchFn) {
  const o = { method, mode, sent: { 'user-agent': UA, range: method === 'GET' ? `bytes=${START}-${END}` : null, cache_setting: JSON.stringify(MODES[mode]) }, started: new Date().toISOString() };
  const t0 = Date.now(); let res;
  const headers = { 'User-Agent': UA }; if (method === 'GET') headers.Range = `bytes=${START}-${END}`;
  try { res = await fetchFn(URL_OBJ, { method, headers, ...MODES[mode], signal: AbortSignal.timeout(TIMEOUT_MS) }); }
  catch (e) { o.ms_to_error = Date.now() - t0; o.outcome = 'request failed before headers'; o.error = String(e).slice(0, 200); return o; }
  o.ms_to_headers = Date.now() - t0; o.status = res.status; o.headers = pick(res.headers);
  if (method === 'HEAD') { o.outcome = res.status === 200 ? 'headers only' : 'unexpected status'; o.object_matches_pin = res.headers.get('content-length') === String(TOTAL) && res.headers.get('etag') === ETAG; return o; }
  o.headers_as_expected = res.status === 206 && res.headers.get('content-range') === `bytes ${START}-${END}/${TOTAL}` && res.headers.get('content-length') === String(LEN) && res.headers.get('etag') === ETAG;
  if (!o.headers_as_expected) { try { await res.body?.cancel(); } catch (_) {} o.outcome = 'headers not as expected; body not read'; return o; }
  // Read in chunks so the bytes that did arrive can be counted. (Hub 0.6.16 reads with arrayBuffer(); the request is the same.)
  const buf = new Uint8Array(LEN); let got = 0, chunks = 0, over = false; const reader = res.body.getReader();
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break;
      if (!chunks) o.ms_to_first_chunk = Date.now() - t0; chunks++; o.ms_to_last_chunk = Date.now() - t0;
      if (got + value.length > LEN) { over = true; got += value.length; try { await reader.cancel(); } catch (_) {} break; }
      buf.set(value, got); got += value.length; }
    o.ms_to_end = Date.now() - t0; o.bytes_received = got; o.chunks = chunks;
    if (over) o.outcome = 'more bytes than the range';
    else if (got !== LEN) o.outcome = 'ended short';
    else { o.sha256 = await sha(buf); o.sha256_matches_browser_read = o.sha256 === BODY_SHA256; o.outcome = 'complete'; }
  } catch (e) { o.ms_to_error = Date.now() - t0; o.bytes_received = got; o.chunks = chunks; o.outcome = 'body not finished'; o.error = String(e).slice(0, 200); }
  return o;
}

export async function run(letter, fetchFn = fetch) {
  const out = { probe: 'wind-range-request', object: URL_OBJ, range: [START, END], length: LEN, sequence: letter, plan: SEQUENCES[letter], timeout_ms: TIMEOUT_MS, started: new Date().toISOString(), steps: [] };
  for (const [method, mode] of SEQUENCES[letter]) out.steps.push(await step(method, mode, fetchFn));
  out.upstream_requests = out.steps.length; out.finished = new Date().toISOString();
  out.note = 'Times are the Worker\'s own clock, which advances only at network waits. Bytes are those handed to the Worker, not what Cloudflare fetched upstream.';
  return out;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const json = (o, s = 200) => new Response(JSON.stringify(o, null, 1), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    if (request.method !== 'GET' || url.pathname !== '/' || url.search !== '') return json({ error: 'not found' }, 404);
    const key = request.headers.get('x-probe-key') || '';
    const got = key.length >= 32 && key.length <= 128 ? await sha(new TextEncoder().encode(key)) : '';
    let diff = got.length ^ KEY_SHA256.length; for (let i = 0; i < KEY_SHA256.length; i++) diff |= (got.charCodeAt(i) || 0) ^ KEY_SHA256.charCodeAt(i);
    if (diff !== 0) return json({ error: 'not found' }, 404);                        // no key, no upstream request
    if (!(Date.now() <= NOT_AFTER)) return json({ error: 'probe expired' }, 410);
    const letter = request.headers.get('x-probe-sequence') || '';
    if (!Object.prototype.hasOwnProperty.call(SEQUENCES, letter)) return json({ error: 'sequence must be one of ' + Object.keys(SEQUENCES).join(', ') }, 400);   // no upstream request
    try { return json(await run(letter)); } catch (e) { return json({ error: e.name + ': ' + String(e.message).slice(0, 200) }, 500); }
  },
};
