// Local run of the probe's logic with the network replaced by the saved bytes of the same run.
import { readFileSync } from 'node:fs';
const { probe } = await import(process.argv[2]);
const dir = process.argv[3];
const idx = readFileSync(dir + '/f000.idx'); const TOTAL = 500418863, ETAG = '"e85c7642b26561940fb3e795dd04348e"';
const ranges = { '413095365': 0, '414054949': 1, '206166258': 2, '206753934': 3, '114656286': 4, '115147644': 5 };
const mode = process.argv[4] || 'ok';
const fake = async (url, opt = {}) => {
  if (url.endsWith('.idx')) return new Response(idx, { status: 200, headers: { 'content-length': String(idx.length), 'last-modified': 'x' } });
  if (opt.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-length': String(TOTAL), etag: ETAG } });
  const [s, e] = opt.headers.Range.slice(6).split('-'); const b = readFileSync(`${dir}/msg${ranges[s]}.grib2`);
  if (mode === 'full200') return new Response(b, { status: 200, headers: { 'content-length': String(b.length), etag: ETAG } });
  if (mode === 'wrongrange') return new Response(b, { status: 206, headers: { 'content-range': `bytes 0-${b.length - 1}/${TOTAL}`, 'content-length': String(b.length), etag: ETAG } });
  if (mode === 'otheretag') return new Response(b, { status: 206, headers: { 'content-range': `bytes ${s}-${e}/${TOTAL}`, 'content-length': String(b.length), etag: '"changed"' } });
  return new Response(b, { status: 206, headers: { 'content-range': `bytes ${s}-${e}/${TOTAL}`, 'content-length': String(b.length), etag: ETAG } });
};
try { const o = await probe('2026111600', fake); console.log(mode, 'requests', o.requests, o.grids.map(g => g.level + ' ' + g.sha256.slice(0, 12)).join(' | '), 'fields ok', o.fields.length); }
catch (e) { console.log(mode, '->', e.name, ':', e.message.slice(0, 120)); }
