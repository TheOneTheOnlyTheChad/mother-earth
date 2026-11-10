/* Mother Earth — buoy water-temperature classes (BUOY-TEMPERATURE-PROPOSAL rev 2). Pure logic, no browser.
 * Loads app.js the way the other Node suites do and checks ME.sstClass / ME.sstColour / the keys against an
 * INDEPENDENT expectation written out by hand below (not computed from ME.SST_BREAKS), so a changed break or an
 * off-by-one in the page is caught rather than mirrored.
 * Run: node phase1/buoy-temp.test.mjs        Breaks: BREAK=null-zero|edge|grey-class|no-none node phase1/buoy-temp.test.mjs
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
let src = fs.readFileSync(here + '../app.js', 'utf8');
const BREAK = process.env.BREAK || '';
// Breaks are applied to the source text, so each must change behaviour the suite can see.
const brk = (from, to) => { if (!src.includes(from)) { console.log('BREAK pattern not found: ' + from); process.exit(2); } src = src.replace(from, to); };
if (BREAK === 'null-zero') brk("if (t === null || t === undefined || t === '' || typeof t === 'boolean') return -1;", "if (t === undefined || t === '' || typeof t === 'boolean') return -1;");   // Number(null) = 0 → class 1
if (BREAK === 'edge') brk('v >= ME.SST_BREAKS[i]', 'v > ME.SST_BREAKS[i]');
if (BREAK === 'grey-class') brk("ME.SST_NONE = '#b0b0b8';", "ME.SST_NONE = '#24878e';");   // grey made identical to a class colour
if (BREAK === 'no-none') brk('return i < 0 ? ME.SST_NONE : ME.SST_COLOURS[i];', 'return ME.SST_COLOURS[Math.max(0, i)];');
globalThis.window = globalThis; globalThis.document = { getElementById: () => null };
new Function(src)();
const ME = globalThis.ME;

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `  got: ${JSON.stringify(got)}` : ''}`); } };

// Expected classes, written out independently of the page's constants.
const CASES = [
  [null, -1], [undefined, -1], ['', -1], [NaN, -1], [Infinity, -1], ['abc', -1], [true, -1],
  [-1.55, 0], [-0.01, 0], [-3, 0],
  [0, 1], [0.0001, 1], [4.99, 1],
  [5, 2], [9.99, 2], [10, 3], [14.99, 3], [15, 4], [19.99, 4], [20, 5], [24.99, 5], [25, 6], [29.99, 6],
  [30, 7], [35.94, 7], [40, 7], ['17.48', 4],
];
for (const [t, want] of CASES) ok(`sstClass(${JSON.stringify(t)}) = ${want}`, ME.sstClass(t) === want, ME.sstClass(t));

ok('exactly 0 °C is a class colour, never grey', ME.sstColour(0) !== ME.SST_NONE && ME.sstColour(0) === ME.SST_COLOURS[1], ME.sstColour(0));
ok('null is grey', ME.sstColour(null) === ME.SST_NONE, ME.sstColour(null));
ok('negative is class 0 colour', ME.sstColour(-1.55) === ME.SST_COLOURS[0], ME.sstColour(-1.55));
ok('grey differs from every class colour', !ME.SST_COLOURS.includes(ME.SST_NONE), ME.SST_NONE);
ok('eight distinct class colours', new Set(ME.SST_COLOURS).size === 8 && ME.SST_COLOURS.length === 8, ME.SST_COLOURS);

// Lightness must rise with temperature (ordered sequential scale) — CIE L* computed here, not taken from the page.
const L = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(u => u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : y * 24389 / 27; };
const Ls = ME.SST_COLOURS.map(L);
ok('lightness strictly increases class by class', Ls.every((v, i) => i === 0 || v > Ls[i - 1]), Ls.map(Math.round));

// Labels and keys
ok('labels: ends and a middle class', ME.sstLabel(0) === 'below 0' && ME.sstLabel(7) === '30 and above' && ME.sstLabel(3) === '10 to 15', [ME.sstLabel(0), ME.sstLabel(3), ME.sstLabel(7)]);
const key = ME.sstKeyHtml();
ok('card key: all eight class colours and the grey, in order', ME.SST_COLOURS.every(c => key.includes(c)) && key.includes(ME.SST_NONE) &&
  ME.SST_COLOURS.every((c, i) => i === 0 || key.indexOf(c) > key.indexOf(ME.SST_COLOURS[i - 1])), key.slice(0, 200));
ok('card key: says "Temperature unavailable" and has a text equivalent', /Temperature unavailable/.test(key) && /aria-label="Water temperature classes/.test(key));
const sw = ME.sstSwatchHtml();
ok('main-key swatch: shows the scale, not one fixed colour (no old yellow)', ME.SST_COLOURS.every(c => sw.includes(c)) && !/ffd86b/i.test(sw), sw.slice(0, 120));

console.log(`\n${pass} passed, ${fail} failed${BREAK ? `  (BREAK=${BREAK})` : ''}`);
process.exit(fail ? 1 : 0);
