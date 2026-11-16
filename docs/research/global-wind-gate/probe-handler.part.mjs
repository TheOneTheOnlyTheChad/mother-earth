
// ---- Read-only probe Worker (private, temporary). No bindings, no schedule, no storage. One run per request. ----
// GET /?cycle=YYYYMMDDHH  → fetches the six wind messages of that run from ONE host by byte range, checks each response
// before reading its body, decodes one field at a time, makes the three 1 degree grids, returns hashes and timings as JSON.
const HOST = 'https://noaa-gfs-bdp-pds.s3.amazonaws.com/';
const NOT_AFTER = Date.parse('__NOT_AFTER__');            // the probe refuses to run after this time
const IDX_WANT = [['UGRD', '10 m above ground'], ['VGRD', '10 m above ground'], ['UGRD', '250 mb'], ['VGRD', '250 mb'], ['UGRD', '10 mb'], ['VGRD', '10 mb']];
const MAX_MSG = 3 * 1024 * 1024, MAX_IDX = 200 * 1024, W = 360, H = 181, STEP = 4, MISS = -32768;
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (bytes) => hex(await crypto.subtle.digest('SHA-256', bytes));

export async function probe(cycleStr, fetchFn = fetch) {
  const m = /^(\d{4})(\d{2})(\d{2})(00|06|12|18)$/.exec(cycleStr || '');
  if (!m) throw new GribRefused('cycle must be YYYYMMDDHH with HH 00, 06, 12 or 18');
  const cycle = { year: +m[1], month: +m[2], day: +m[3], hour: +m[4] };
  const obj = `gfs.${m[1]}${m[2]}${m[3]}/${m[4]}/atmos/gfs.t${m[4]}z.pgrb2.0p25.f000`;
  const out = { probe: 'global-wind', host: HOST, object: obj, cycle: cycleStr, started: new Date().toISOString(), fields: [], requests: 0 };
  const t0 = Date.now();
  // index
  const ir = await fetchFn(HOST + obj + '.idx'); out.requests++;
  if (ir.status !== 200) { await ir.body?.cancel(); throw new GribRefused('index status ' + ir.status); }
  const il = Number(ir.headers.get('content-length'));
  if (!(il > 0 && il <= MAX_IDX)) { await ir.body?.cancel(); throw new GribRefused('index length ' + ir.headers.get('content-length')); }
  const itxt = await ir.text();
  out.index = { bytes: itxt.length, sha256: await sha(new TextEncoder().encode(itxt)), last_modified: ir.headers.get('last-modified') };
  const lines = itxt.trim().split('\n').map((l) => l.split(':'));
  const hr = await fetchFn(HOST + obj, { method: 'HEAD' }); out.requests++;
  if (hr.status !== 200) throw new GribRefused('object status ' + hr.status);
  const total = Number(hr.headers.get('content-length')), etag = hr.headers.get('etag');
  out.object_info = { length: total, etag, last_modified: hr.headers.get('last-modified') };
  out.ms_index = Date.now() - t0;
  const grids = [new Int16Array(W * H * 2), new Int16Array(W * H * 2), new Int16Array(W * H * 2)];
  for (let f = 0; f < 6; f++) {
    const [v, lev] = IDX_WANT[f];
    const hits = lines.map((l, i) => [l, i]).filter(([l]) => l[3] === v && l[4] === lev && l[5] === 'anl');
    if (hits.length !== 1) throw new GribRefused(`${v} ${lev}: ${hits.length} index lines`);
    const [l, i] = hits[0]; const start = Number(l[1]); const end = (i + 1 < lines.length ? Number(lines[i + 1][1]) : total) - 1; const len = end - start + 1;
    if (!(Number.isInteger(start) && len > 0 && len <= MAX_MSG && end < total)) throw new GribRefused(`${v} ${lev}: range ${start}-${end} not acceptable`);
    const tf = Date.now();
    const r = await fetchFn(HOST + obj, { headers: { Range: `bytes=${start}-${end}` } }); out.requests++;
    // refuse before buffering the body
    const cr = r.headers.get('content-range'), cl = Number(r.headers.get('content-length'));
    if (r.status !== 206 || cr !== `bytes ${start}-${end}/${total}` || cl !== len || r.headers.get('etag') !== etag) {
      await r.body?.cancel();
      throw new GribRefused(`${v} ${lev}: response refused (status ${r.status}, content-range ${cr}, length ${cl}, etag ${r.headers.get('etag')})`);
    }
    let bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length !== len) throw new GribRefused(`${v} ${lev}: body ${bytes.length} bytes, expected ${len}`);
    const msFetch = Date.now() - tf;
    const digest = await sha(bytes);
    let dec = decode(bytes); checkField(dec, WIND_FIELDS[f], cycle);
    const g = grids[f >> 1], c = f & 1, vals = dec.values;
    for (let j = 0; j < H; j++) for (let k = 0; k < W; k++) g[(j * W + k) * 2 + c] = Math.round(vals[j * STEP * 1440 + k * STEP] * 10);
    out.fields.push({ key: WIND_FIELDS[f].key, range: `${start}-${end}`, bytes: len, ms_fetch: msFetch, sha256: digest });
    dec = null; bytes = null;                                // one field at a time; no forced garbage collection
  }
  out.grids = [];
  for (const [n, g] of [['near-ground', grids[0]], ['250hPa', grids[1]], ['10hPa', grids[2]]]) out.grids.push({ level: n, bytes: g.byteLength, sha256: await sha(new Uint8Array(g.buffer)) });
  out.ms_total_wall = Date.now() - t0; out.finished = new Date().toISOString();
  out.note = 'Wall times advance only at network waits inside a Worker; CPU time is read from the invocation log, not from this response.';
  return out;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const json = (o, s = 200) => new Response(JSON.stringify(o, null, 1), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    if (request.method !== 'GET' || url.pathname !== '/') return json({ error: 'not found' }, 404);
    if (!(Date.now() <= NOT_AFTER)) return json({ error: 'probe expired' }, 410);
    try { return json(await probe(url.searchParams.get('cycle'))); }
    catch (e) { return json({ error: e.name + ': ' + e.message, refused: e instanceof GribRefused }, e instanceof GribRefused ? 422 : 500); }
  },
};
