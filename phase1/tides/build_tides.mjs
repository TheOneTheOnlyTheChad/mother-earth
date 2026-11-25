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
// every generated block: [begin, end, content from the model, what it is]
const BLOCKS = [[A, B, M.xsec(0, 'both'), 'pre-rendered cross-section'], ['<!-- TIDES-DRAW:BEGIN -->', '<!-- TIDES-DRAW:END -->', M.drawingText(), 'Drawing sentence (display constants)'],
  ['<!-- TIDES-NEAP:BEGIN -->', '<!-- TIDES-NEAP:END -->', String(M.neapPercent()), 'neap percentage in How this works']];
let out = html;
for (const [a, b, body, what] of BLOCKS) {
  const p = out.indexOf(a), q = out.indexOf(b); if (p < 0 || q < p || out.indexOf(a, p + 1) >= 0) { bad.push('tides.html: markers for the ' + what + ' are missing or repeated'); continue; }
  if (out.slice(p, q + b.length) !== a + body + b) { if (check) bad.push('tides.html: the ' + what + ' differs from tides-model.js'); else out = out.slice(0, p) + a + body + b + out.slice(q + b.length); }
}
// no stale copy of the display constants anywhere else in the page text
const stale = [...out.replace(/<!-- TIDES-[A-Z]+:BEGIN -->[\s\S]*?<!-- TIDES-[A-Z]+:END -->/g, '').matchAll(/\b1\.\d+\s*\+\s*0\.\d+\s*×/g)].map(m => m[0]);
if (stale.length) bad.push('tides.html: display constants written outside the generated block: ' + stale.join(', '));
if (!check && out !== html) { fs.writeFileSync(file, out); console.log('tides.html: generated blocks written'); }
const src = JSON.parse(fs.readFileSync(path.join(root, 'assets/tides/SOURCE.json'), 'utf8'));
for (const e of src.images) for (const f of [e, e.original].filter(x => x && x.path)) {
  let b; try { b = fs.readFileSync(path.join(root, f.path)); } catch (_) { bad.push(f.path + ': missing'); continue; }
  const sha = crypto.createHash('sha256').update(b).digest('hex');
  if (sha !== f.sha256) bad.push(f.path + ': sha256 ' + sha + ' is not the recorded ' + f.sha256);
  if (b.length !== f.bytes) bad.push(f.path + ': ' + b.length + ' B is not the recorded ' + f.bytes);
}
// sources.html's Tides section states the same rule and constants (written by hand; checked here)
{ const sp = fs.readFileSync(path.join(root, 'sources.html'), 'utf8'), sec = (sp.match(/<h2 id="tides">[\s\S]*?(?=<h2 id=)/) || [''])[0];
  const want = ['Drawn radius = ' + M.BASE + ' + ' + M.K + ' × value', M.A_SUN + ' × P2(angle to the Sun)', M.REV];
  if (!sec) bad.push('sources.html has no Tides section'); else for (const w of want) if (!sec.includes(w)) bad.push('sources.html Tides section does not state: ' + w); }
if (src.model !== M.REV) bad.push('SOURCE.json names model ' + src.model + ', tides-model.js is ' + M.REV);
if (bad.length) { bad.forEach(x => console.error('DIFFERENT  ' + x)); process.exit(1); }
console.log(check ? 'tides: cross-section and ' + src.images.length + ' image records agree' : 'tides: image records agree');
