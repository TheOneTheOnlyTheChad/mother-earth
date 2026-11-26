// Tests for gcp_stream.js: the seven real sample patches fed in varied chunk sizes, compared cell for cell and byte for byte with the
// independent Python reference (diviner_ref.py); plus deliberate breaks that must throw. Usage:
//   node phase1/moonsci/diviner/test_gcp_stream.cjs <samples-dir>     (exit 1 on any failure)
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const G = require('./gcp_stream.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const dir = process.argv[2];
const find = f => [dir, path.join(dir, 'diviner')].map(d => path.join(d, f)).find(p => fs.existsSync(p));
// identity of each sample: first latitude x100, first longitude index (0 = -179.75), 10 longitudes, no header line
const SAMPLES = [
  ['gcp_00n10n_rows0-19199.tab', 25, 0], ['gcp_80n90n_rows0-19199.tab', 8025, 0], ['gcp_00n10n_lon000-009.tab', 25, 360],
  ['gcp_40s30s_lon000-009.tab', -3975, 360], ['gcp_90s80s_lon000-009.tab', -8975, 360], ['gcp_70s60s_lon000-009.tab', -6975, 360],
  ['gcp_70n80n_lon000-009.tab', 7025, 360]];
const REF = path.join(__dirname, 'diviner_ref.py');
const feed = (u8, opts, sizes) => { const b = new G.GcpBand(opts); let i = 0, k = 0; while (i < u8.length) { const n = sizes[k++ % sizes.length]; b.push(u8.subarray(i, i + n)); i += n; if (k % 5 === 0) b.push(new Uint8Array(0)); } return b.finish(); };
let cellsCompared = 0;
for (const [f, lat0, lonStart] of SAMPLES) {
  const p = find(f); if (!p) { ok(false, 'missing ' + f); continue; }
  const u8 = new Uint8Array(fs.readFileSync(p)), opts = { lat0x100: lat0, lonStart, nLon: 10, header: false, extract: true };
  const tmp = path.join(require('os').tmpdir(), 'ref-' + f + '.i32');
  const ref = JSON.parse(cp.execFileSync('python3', ['-I', REF, p, String(lat0), String(lonStart), '10', '--extract', tmp]).toString());
  const refExt = fs.readFileSync(tmp);
  for (const sizes of [[113], [1], [65536], [7, 300, 4096, 112, 114], [2169600]]) {
    const res = feed(u8, opts, sizes);
    ok(res.records === 19200 && res.records === ref.records, `${f} records`);
    ok(res.sentinels.empty === ref.sentinels.empty && res.sentinels.invalid === ref.sentinels.invalid, `${f} sentinels`);
    ok(Buffer.from(G.extractionBytes(res.extraction)).equals(refExt), `${f} extraction bytes (chunks ${sizes})`);
    const pl = G.bandPlanes(res, opts);
    let bad = 0;
    pl.cellsAt.forEach(c => { const r = ref.cells.find(x => x.lonx100 === c.lonx100 && x.latx100 === c.latx100);
      if (!r || JSON.stringify(r.noon) !== JSON.stringify(c.noon) || JSON.stringify(r.mid) !== JSON.stringify(c.mid)) bad++; });
    ok(bad === 0 && pl.cellsAt.length === 200, `${f} 200 cells x 2 windows equal to the reference (chunks ${sizes}; ${bad} differ)`);
    if (sizes[0] === 113) cellsCompared += pl.cellsAt.length;
  }
  fs.unlinkSync(tmp);
}
console.log('cells compared with the reference (each in 5 chunkings): ' + cellsCompared);

// codes(): boundary cases
ok(JSON.stringify(G.codes(1, 3891234, 3891234, 3891234, false)) === '{"value":3891,"n":1,"range":255}', 'n=1 range unavailable, 389.1234 -> 3891');
ok(G.codes(1, 3891250, 3891250, 3891250, false).value === 3891, '389.1250 K -> 3891 (tenths 3891.25 rounds to 3891)');
ok(G.codes(2, 3891000 + 3892000, 3891000, 3892000, false).value === 3892, 'mean 389.15 K of two bins -> 3892 (half up)');
ok(G.codes(1, 3891500, 3891500, 3891500, false).value === 3892, '389.15 K -> 3892 (half up)');
ok(G.codes(2, 1000000 + 3535000, 1000000, 3535000, false).range === 254, 'range 253.5 K -> 254 (cap)');
ok(G.codes(2, 1000000 + 3534999, 1000000, 3534999, false).range === 253, 'range 253.4999 K -> 253');
ok(G.codes(2, 2000000 + 2015000, 2000000, 2015000, false).range === 2, 'range 1.5 K -> 2 (half up)');
ok(JSON.stringify(G.codes(0, 0, 0, 0, false)) === '{"value":0,"n":0,"range":255}', 'no valid data');
ok(JSON.stringify(G.codes(3, 9, 1, 5, true)) === '{"value":1,"n":0,"range":255}', 'withheld wins');

// deliberate breaks: each must throw GcpError
const base = new Uint8Array(fs.readFileSync(find('gcp_00n10n_lon000-009.tab')));
const opts = { lat0x100: 25, lonStart: 360, nLon: 10, header: false, extract: false };
const put = (u, r, s) => { const b = Uint8Array.from(u); const t = Buffer.from(s.padStart(9)); b.set(t, r * 113 + 102); return b; };
const breaks = {
  letter: put(base, 5, '1x2.3456'), hot: put(base, 7, '500.0000'), cold: put(base, 7, '0.5000'), sentinel: put(base, 9, '-9997'), nan: put(base, 11, 'nan'),
  fiveDecimals: put(base, 13, '10.12345'), crlf: (() => { const b = Uint8Array.from(base); b[3 * 113 + 111] = 32; return b; })(),
  lonShift: (() => { const b = Uint8Array.from(base); b.set(Buffer.from('   0.75'), 0); return b; })(),
  latSwap: (() => { const b = Uint8Array.from(base); b.set(Buffer.from('  0.75'), 9); return b; })(),
  ltWrong: (() => { const b = Uint8Array.from(base); b.set(Buffer.from('  0.50'), 17); return b; })(),
  truncated: base.subarray(0, base.length - 5), extraRecord: (() => { const b = new Uint8Array(base.length + 113); b.set(base); b.set(base.subarray(0, 113), base.length); return b; })(),
  channelText: (() => { const b = Uint8Array.from(base); b.set(Buffer.from('    abcde'), 2 * 113 + 25); return b; })(),
  wrongIdentity: base,   // fed as if it were 10N-20N
};
for (const [name, u] of Object.entries(breaks)) {
  let threw = false, why = '';
  try { feed(u, name === 'wrongIdentity' ? Object.assign({}, opts, { lat0x100: 1025 }) : opts, [4096]); } catch (e) { threw = e instanceof G.GcpError; why = e.message; }
  ok(threw, 'break ' + name + ' must throw'); if (threw) console.log(`  break ${name}: refused (${why})`);
}
// header handling: a 113-byte header plus records
{ const hdr = Buffer.alloc(113, 32); hdr.write('clon,clat,ltim', 0); hdr[111] = 13; hdr[112] = 10;
  const u = new Uint8Array(Buffer.concat([hdr, Buffer.from(base)]));
  const r = feed(u, Object.assign({}, opts, { header: true }), [50, 9000]); ok(r.records === 19200 && Buffer.from(r.header).equals(hdr), 'header line split off exactly');
  let threw = false; try { const h2 = Buffer.from(hdr); h2[112] = 32; feed(new Uint8Array(Buffer.concat([h2, Buffer.from(base)])), Object.assign({}, opts, { header: true }), [4096]); } catch (e) { threw = true; }
  ok(threw, 'header without CRLF refused'); }
console.log(`gcp_stream: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
