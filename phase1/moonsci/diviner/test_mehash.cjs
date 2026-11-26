// Tests for mehash.js against RFC 1321 / FIPS 180-4 vectors and Node's crypto, with varied chunk boundaries (GPT rev 2 note 5).
// Usage: node phase1/moonsci/diviner/test_mehash.cjs [samples-dir]   (exit 1 on any failure)
'use strict';
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { MD5, SHA256 } = require('./mehash.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const enc = s => new TextEncoder().encode(s);
const run = (C, chunks) => { const h = new C(); for (const c of chunks) h.update(c); return h.hex(); };

// RFC 1321 appendix A.5
const md5v = [['', 'd41d8cd98f00b204e9800998ecf8427e'], ['a', '0cc175b9c0f1b6a831c399e269772661'], ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'], ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
  ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a']];
for (const [m, h] of md5v) ok(run(MD5, [enc(m)]) === h, 'md5 vector ' + JSON.stringify(m));
// FIPS 180-4 / NIST examples
const shav = [['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'], ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'],
  ['abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', 'cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1']];
for (const [m, h] of shav) ok(run(SHA256, [enc(m)]) === h, 'sha256 vector ' + JSON.stringify(m).slice(0, 30));
// one million 'a' in uneven chunks
{ const a = new Uint8Array(1000000).fill(97); const parts = []; let i = 0, k = 1; while (i < a.length) { const n = (k * 7919) % 70001; parts.push(a.subarray(i, i + n)); i += n; k++; }
  ok(run(SHA256, parts) === 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0', 'sha256 million a');
  ok(run(MD5, parts) === '7707d6ae4e027c70eea2a935c2296f21', 'md5 million a'); }

// every length 0..200 and random chunkings, including empty chunks, against Node
let rs = 12345; const rnd = n => { rs = (rs * 1103515245 + 12345) >>> 0; return rs % n; };
for (let len = 0; len <= 200; len++) {
  const d = crypto.randomBytes(len); const u = new Uint8Array(d);
  const parts = []; let i = 0; while (i < len) { const n = rnd(70); parts.push(u.subarray(i, i + n)); i += n; } parts.push(new Uint8Array(0));
  ok(run(MD5, parts) === crypto.createHash('md5').update(d).digest('hex'), 'md5 len ' + len);
  ok(run(SHA256, parts) === crypto.createHash('sha256').update(d).digest('hex'), 'sha256 len ' + len);
}
// large random buffers with chunk sizes around block edges and typical network chunks
for (const sz of [1, 63, 64, 65, 113, 4096, 65536, 65537, 1048576]) {
  const d = crypto.randomBytes(3000017); const u = new Uint8Array(d); const parts = [];
  for (let i = 0; i < u.length; i += sz) parts.push(u.subarray(i, i + sz));
  ok(run(MD5, parts) === crypto.createHash('md5').update(d).digest('hex'), 'md5 chunk ' + sz);
  ok(run(SHA256, parts) === crypto.createHash('sha256').update(d).digest('hex'), 'sha256 chunk ' + sz);
}
// misuse is refused
{ const h = new MD5(); h.hex(); let threw = false; try { h.update(enc('x')); } catch (e) { threw = true; } ok(threw, 'md5 update after hex refused'); }
// the real sample files, if given
const dir = process.argv[2];
if (dir) {
  const files = [];
  for (const d of [dir, path.join(dir, 'diviner')]) if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (/\.(tab|img|f32)$/.test(f)) files.push(path.join(d, f));
  for (const f of files) {
    const b = fs.readFileSync(f), u = new Uint8Array(b); const parts = []; for (let i = 0; i < u.length; i += 65536 + 17) parts.push(u.subarray(i, i + 65536 + 17));
    ok(run(MD5, parts) === crypto.createHash('md5').update(b).digest('hex'), 'md5 ' + path.basename(f));
    ok(run(SHA256, parts) === crypto.createHash('sha256').update(b).digest('hex'), 'sha256 ' + path.basename(f));
  }
  console.log('sample files hashed: ' + files.length);
}
console.log(`mehash: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
