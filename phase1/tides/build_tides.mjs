/* Tides: write the pre-rendered default cross-section into tides.html (so the page shows the model without JavaScript),
 * and check the pinned images against assets/tides/SOURCE.json.
 *   node phase1/tides/build_tides.mjs            rewrite the block between the TIDES-XSEC markers
 *   node phase1/tides/build_tides.mjs --check    exit 1 if the block, an image hash or a size differs
 * The markup comes from tides-model.js (the page's own generator), at the page's initial state: 0°, both. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), M = createRequire(import.meta.url)(path.join(root, 'tides-model.js'));
const check = process.argv.includes('--check'), file = path.join(root, 'tides.html'), A = '<!-- TIDES-XSEC:BEGIN -->', B = '<!-- TIDES-XSEC:END -->';
let html = fs.readFileSync(file, 'utf8'); const i = html.indexOf(A), j = html.indexOf(B); const bad = [];
if (i < 0 || j < i) { console.error('tides.html has no TIDES-XSEC markers'); process.exit(2); }
const want = A + M.xsec(0, 'both') + B, have = html.slice(i, j + B.length);
if (check) { if (have !== want) bad.push('the pre-rendered cross-section in tides.html differs from tides-model.js'); }
else if (have !== want) { fs.writeFileSync(file, html.slice(0, i) + want + html.slice(j + B.length)); console.log('tides.html: cross-section written'); }
const src = JSON.parse(fs.readFileSync(path.join(root, 'assets/tides/SOURCE.json'), 'utf8'));
for (const e of src.images) for (const f of [e, e.original].filter(x => x && x.path)) {
  let b; try { b = fs.readFileSync(path.join(root, f.path)); } catch (_) { bad.push(f.path + ': missing'); continue; }
  const sha = crypto.createHash('sha256').update(b).digest('hex');
  if (sha !== f.sha256) bad.push(f.path + ': sha256 ' + sha + ' is not the recorded ' + f.sha256);
  if (b.length !== f.bytes) bad.push(f.path + ': ' + b.length + ' B is not the recorded ' + f.bytes);
}
if (src.model !== M.REV) bad.push('SOURCE.json names model ' + src.model + ', tides-model.js is ' + M.REV);
if (bad.length) { bad.forEach(x => console.error('DIFFERENT  ' + x)); process.exit(1); }
console.log(check ? 'tides: cross-section and ' + src.images.length + ' image records agree' : 'tides: image records agree');
