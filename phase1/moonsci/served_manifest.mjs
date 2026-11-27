/* Sky zoom-out Moon picture release (Moon item 10a, moon-sky-texture-ui): the current served-file manifest, pinned path by path. The Moon
 * LROC manifest (reviews/evidence/2026-11-26-moon-lroc-manifest.json), the Moon temperature and Moon height manifests and the Tides release
 * and dedication manifests are kept unchanged as their own records.
 *   node phase1/moonsci/served_manifest.mjs           write reviews/evidence/2026-11-27-moon-sky-texture-manifest.json from this tree
 *   node phase1/moonsci/served_manifest.mjs --check   exit 1 unless the manifest equals this tree exactly (same paths, sizes, sha256)
 *   node phase1/moonsci/served_manifest.mjs --pane    print the script to run in a browser-pane tab on the live site after release:
 *                                                     it fetches every listed path with no-store and compares bytes and sha256
 * Covered: every .html, .js and .css at the repository root (now including moonsci.js and moonsci.css), the Tides pictures and record,
 * the Moon picture, the Moon height files (assets/moon/lola/*), the Moon temperature files (assets/moon/diviner/*) and the Moon
 * detailed-site files (assets/moon/lroc/*, now including moonlroc.js and moonlroc.css at the root), and (10a) the sunlight table
 * assets/moon/moon-light-2026-06-R1.json, which index.html now reads for the Sky zoom-out Moon's orientation. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), OUT = path.join(root, 'reviews/evidence/2026-11-27-moon-sky-texture-manifest.json');
const roots = fs.readdirSync(root).filter(f => /\.(html|js|css)$/.test(f) && fs.statSync(path.join(root, f)).isFile()).sort();
const extra = ['assets/tides/SOURCE.json', 'assets/tides/earth-2026-06-22.jpg', 'assets/tides/sun-2026-11-25.jpg', 'assets/moon/lroc_color_2k.jpg',
  'assets/moon/lola/SOURCE.json', 'assets/moon/lola/ldem4-colour-R1.png', 'assets/moon/lola/ldem4-m-R1.i16.gz',
  'assets/moon/diviner/SOURCE.json', 'assets/moon/diviner/gcp-tbol-nm-R1.bin.gz',
  'assets/moon/lroc/SOURCE.json', 'assets/moon/lroc/a11-area-4m-mask.png', 'assets/moon/lroc/a11-area-4m.jpg', 'assets/moon/lroc/a11-site-0p5m.jpg',
  'assets/moon/moon-light-2026-06-R1.json'];
const files = [...roots, ...extra].map(p => { const b = fs.readFileSync(path.join(root, p)); return { path: p, bytes: b.length, sha256: crypto.createHash('sha256').update(b).digest('hex') }; });
const man = { note: 'Served-file manifest for the Sky zoom-out Moon picture release (Moon item 10a, moon-sky-texture-ui). Every path is fetched from the live site after release and must match byte for byte. The Moon LROC, Moon temperature, Moon height, Tides release and dedication manifests stay as their own records.',
  site: 'https://theonetheonlythechad.github.io/mother-earth/', root_page_files: roots.length, files };
if (process.argv.includes('--check')) {
  const have = JSON.parse(fs.readFileSync(OUT, 'utf8')); const a = JSON.stringify(have.files), b = JSON.stringify(files);
  if (a !== b) { const hp = new Map(have.files.map(f => [f.path, f.sha256])); for (const f of files) if (hp.get(f.path) !== f.sha256) console.error('DIFFERENT  ' + f.path);
    for (const f of have.files) if (!files.some(x => x.path === f.path)) console.error('MISSING    ' + f.path); process.exit(1); }
  console.log(`moon sky-texture manifest: ${files.length} files (${roots.length} root page files + ${extra.length} assets) match this tree`);
} else if (process.argv.includes('--pane')) {
  console.log(`(async()=>{const M=${JSON.stringify(files.map(f => [f.path, f.bytes, f.sha256]))},B=${JSON.stringify(man.site)},bad=[];for(const[p,n,h]of M){const r=await fetch(B+p+'?served-check='+Date.now(),{cache:'no-store'});const u=new Uint8Array(await r.arrayBuffer());const d=[...new Uint8Array(await crypto.subtle.digest('SHA-256',u))].map(x=>x.toString(16).padStart(2,'0')).join('');if(!r.ok||u.length!==n||d!==h)bad.push([p,r.status,u.length,d.slice(0,12)]);}return {checked:M.length,ok:M.length-bad.length,bad,at:new Date().toISOString()};})()`);
} else { fs.writeFileSync(OUT, JSON.stringify(man, null, 1) + '\n'); console.log(`wrote ${path.relative(root, OUT)}: ${files.length} files`); }
