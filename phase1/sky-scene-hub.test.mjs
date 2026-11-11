/* Mother Earth — Sky zoom-out scene, hub side (0.6.6; SKY-ZOOM-OUT-PROPOSAL rev 2.2 §7, §11 check 18).
 * The real worker.js and the ACTUAL scene bytes (phase1/sky/catalogue/sky-scene-2026-11-R1.json) and R1 bytes, in a fake R2.
 * A fixture copy of worker.js pins a scene file with an empty Sun row set, to prove the envelope check rejects it.
 * Run:   node --no-warnings phase1/sky-scene-hub.test.mjs
 * Break: BREAK=serve-on-fail | no-envelope-check — each loads a weakened worker.js; the suite must FAIL.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'serve-on-fail': ["  if (await sha256Bytes(buf) !== pin.fileSha256) return no('integrity');\n  let j;", "  let j;"],
  'no-envelope-check': ["  if (!j || j.catalogue !== 'sky' || j.catalogue_revision !== pin.revision || !j.bodies || !ok(j.bodies.moon) || !ok(j.bodies.sun) || !j.coverage) return no('invalid');", "  // (break) envelope check removed"],
};
const BK = process.env.BREAK;
if (BK) { const [a, b] = BREAKS[BK]; if (!src.includes(a)) throw new Error('break anchor missing: ' + BK); src = src.replace(a, b); }
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SCENE = fs.readFileSync(path.join(HERE, 'sky/catalogue/sky-scene-2026-11-R1.json'));
const R1 = fs.readFileSync(path.join(HERE, 'sky/catalogue/sky-2026-11-R1.json'));
const BAD = Buffer.from(JSON.stringify((j => { j.catalogue_revision = 'sky-scene-2099-01-T9'; j.bodies.sun.rows = []; return j; })(JSON.parse(SCENE.toString('utf8')))));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sky-scene-hub-'));
fs.writeFileSync(path.join(dir, 'w.mjs'), src);
const anchor = "  }),\n});\nconst SKY_CURRENT = 'sky-2026-11-R1';";
if (!src.includes(anchor)) throw new Error('fixture anchor missing');
fs.writeFileSync(path.join(dir, 'w2.mjs'), src.replace(anchor, `  }),\n  'sky-scene-2099-01-T9': Object.freeze({ key: 'ref/sky/bad.json', revision: 'sky-scene-2099-01-T9', fileSha256: '${sha(BAD)}', bytes: ${BAD.length} }),\n});\nconst SKY_CURRENT = 'sky-2026-11-R1';`));
const W = await import(pathToFileURL(path.join(dir, 'w.mjs')).href), W2 = await import(pathToFileURL(path.join(dir, 'w2.mjs')).href);
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 300)}` : ''}`); } };
const reads = [];
const env = objs => ({ R2: { get: async k => { reads.push(k); const b = objs[k]; return b == null ? null : { arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; } }, DB: { prepare() { const s = { bind: () => s, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return s; } } });
const get = (w, e, p) => w.default.fetch(new Request('https://hub.test' + p), e);
const PS = W.SKY_REVISIONS['sky-scene-2026-11-R1'], P1 = W.SKY_REVISIONS['sky-2026-11-R1'];
ok('scene pin = the committed scene file (sha256 and bytes)', PS && PS.fileSha256 === sha(SCENE) && PS.bytes === SCENE.length && PS.key === 'ref/sky/sky-scene-2026-11-R1.json', PS);
const good = env({ [PS.key]: SCENE, [P1.key]: R1 });
for (const [p, buf] of [['/catalogue/sky/sky-scene-2026-11-R1', SCENE], ['/catalogue/sky/sky-2026-11-R1', R1]]) {
  const r = await get(W, good, p), b = Buffer.from(await r.arrayBuffer());
  ok(`${p}: 200 with the exact bytes`, r.status === 200 && sha(b) === sha(buf) && r.headers.get('ETag') === `"${sha(buf)}"`, [r.status, sha(b)]);
}
let r = await get(W, env({ [PS.key]: Buffer.concat([SCENE, Buffer.from(' ')]) }), '/catalogue/sky/sky-scene-2026-11-R1');
ok('scene with wrong bytes: 503 integrity', r.status === 503 && (await r.json()).reason === 'integrity', r.status);
r = await get(W2, env({ 'ref/sky/bad.json': BAD }), '/catalogue/sky/sky-scene-2099-01-T9');
ok('pinned scene with an empty Sun row set: 503 invalid', r.status === 503 && (await r.clone().json()).reason === 'invalid', [r.status, await r.text()]);
reads.length = 0; r = await get(W, good, '/catalogue/sky/sky-scene-2026-11-R2');
ok('unknown scene id: 404, no R2 read', r.status === 404 && reads.length === 0, [r.status, reads]);
r = await get(W, good, '/');
const idx = await r.json();
ok('index: version ≥ 0.6.6 (numeric; ocean-heat-release: 0.6.7), sky.scene = sky-scene-2026-11-R1, current still R1', idx.version.split('.').map(Number).reduce((a, x) => a * 1000 + x, 0) >= 6006 && idx.catalogues.sky.scene === 'sky-scene-2026-11-R1' && idx.catalogues.sky.current === 'sky-2026-11-R1', idx.catalogues && idx.catalogues.sky);
console.log(`sky-scene-hub: ${pass} passed, ${fail} failed${BK ? ` (BREAK=${BK})` : ''}`); process.exit(fail ? 1 : 0);
