/*
 * Timeline story, build level (docs/concepts/TIMELINE-STORY-PROPOSAL.md rev 2.1 §4, §9, §12). No browser.
 * The real generator on the rehearsal sources; every refusal by fixture; the preview helper's isolation and fidelity.
 * Run: node phase1/timeline-story-build.test.mjs
 * If the NASA image files are not in phase1/timeline/rehearsal/assets/, the suite runs on FIXTURE images of the same pixel
 * sizes (made here with Pillow) and says so; the real-file checks are then reported as NOT RUN, not as passed.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { build, serve, STATES } from './timeline/preview.mjs';
import { rehearsalFor, NASA } from './timeline/story-fixture.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..'), TL = path.join(HERE, 'timeline'), RH = path.join(TL, 'rehearsal');
const sha = b => createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0, notrun = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (info !== undefined ? '  → ' + JSON.stringify(info).slice(0, 400) : '')); } };
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const KPG = 'e-big5-end-cretaceous', REV = 'tl-2026-11-T1';
const SNAP = {  // review snapshot 2, sha256 d532063d5df9f19d8262e34a3d8ef3c38cdfb1b58b24f4d09cd05999d479219a: the exact reader-facing wording
  'op-1': 'About 66 million years ago, a mass extinction marked the end of the Cretaceous Period.',
  'op-2': 'An estimated three-quarters of species were lost, including every dinosaur that was not a bird.',
  'op-3': "At that time a large asteroid struck what is now Mexico's Yucatán Peninsula, forming the Chicxulub crater, now buried beneath younger rock.",
  'op-4': 'Renne and colleagues (2013) reported dating that places the impact and the extinction within 32,000 years of each other.',
  'op-4b': 'That figure is a limit on how far apart the two could be, not a measured gap between them.',
  'op-5': 'At two sites in the western United States, researchers identified the boundary by shock-altered minerals, an unusual enrichment in iridium, and the disappearance of fossil pollen and spores.',
  'ca-1': 'Wilf and colleagues (2023) call the impact the extinction\'s "unique cause".',
  'ca-2': 'Schulte and colleagues (2010), in a synthesis of rock records from around the world, concluded that the impact triggered the extinction.',
  'ca-3': 'Hull and colleagues (2020), using carbon-cycle models and past-temperature records, found support for the main Deccan gas release beginning and ending before the impact, with only the impact coinciding with the extinction.',
  'di-1': 'Other studies examine what part was played by the Deccan Traps, a volcanic province in what is now India.',
  'di-2': 'Schoene and colleagues (2019) dated the start of one pulse of eruptions to tens of thousands of years before the impact and the extinction.',
  'di-2b': 'They say their findings support models in which both events drove the environmental deterioration linked to the extinction.',
  'di-3': "O'Connor and colleagues (2024) note that the dating does not exclude Deccan volcanism as a contributing or primary cause.",
  'di-4': 'Their own temperature records, from two sites in the western United States, suggest that on land volcanic climate change was not the primary cause.',
  'lim-1': 'This entry does not show how the extinction unfolded for each group of living things, or how long recovery took.' };
const CAPTION = "Radar height map of the north-west Yucatán Peninsula, Mexico, with NASA's labels. The dashed line follows a shallow trough, 3 to 5 metres deep and about 5 kilometres wide, which NASA describes as a surface expression of the buried crater's outer boundary. Sinkholes (cenotes) are marked along it. Heights are greatly exaggerated. This is a rendering of elevation measurements, not a photograph of the crater. Data: Shuttle Radar Topography Mission, February 2000.";
const ALT = 'Colour relief map of the north-west corner of the Yucatán Peninsula. A dashed semicircle labelled "Trough" curves inland from the coast. Arrows labelled "Cenotes (sinkholes)" point to small pits along it.';
// ---------- the rehearsal source this run uses: the committed one, or a copy with fixture images (timeline/story-fixture.mjs)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-story-'));
const { dir: REHEARSAL, real } = rehearsalFor(TMP);
if (!real) console.log('NOTE: NASA image files are not in phase1/timeline/rehearsal/assets/. Running on FIXTURE images.');

// one generator run on a scratch source folder; mut edits the folder first
let n = 0;
function gen(mut) {
  const dir = path.join(TMP, 'g' + (n++)), src = path.join(dir, '_src');
  fs.mkdirSync(path.join(src, 'catalogue'), { recursive: true }); fs.mkdirSync(path.join(src, 'assets'));
  for (const f of ['chart-v2026-06.5.json', 'entry-pliny-ep-6-16.json']) fs.copyFileSync(path.join(TL, f), path.join(src, f));
  for (const f of fs.readdirSync(path.join(TL, 'catalogue'))) fs.copyFileSync(path.join(TL, 'catalogue', f), path.join(src, 'catalogue', f));
  for (const f of ['BUILD.json', 'big5.json', 'changes.json']) fs.copyFileSync(path.join(REHEARSAL, f), path.join(src, f));
  for (const f of fs.readdirSync(path.join(REHEARSAL, 'assets'))) fs.copyFileSync(path.join(REHEARSAL, 'assets', f), path.join(src, 'assets', f));
  const page = path.join(dir, 'timeline.html'); fs.copyFileSync(path.join(ROOT, 'timeline.html'), page);
  const E = { src, J: f => J(path.join(src, f)), W: (f, o) => fs.writeFileSync(path.join(src, f), JSON.stringify(o, null, 1) + '\n'),
    kpg: b => b.episodes.find(e => e.id === KPG) };
  if (mut) mut(E);
  const r = spawnSync('python3', [path.join(TL, 'build_timeline.py'), '--src', src, '--page', page], { encoding: 'utf8' });
  const cp = path.join(src, 'catalogue', REV + '.json');
  return { code: r.status, err: (r.stderr || '') + (r.stdout || ''), cat: r.status === 0 && fs.existsSync(cp) ? J(cp) : null, catBytes: r.status === 0 && fs.existsSync(cp) ? fs.readFileSync(cp) : null, page: fs.readFileSync(page, 'utf8'), src };
}
const big = (E, f) => { const b = E.J('big5.json'); f(E.kpg(b), b); E.W('big5.json', b); };

// ---------- A. the released build is untouched
{ const r = spawnSync('python3', [path.join(TL, 'build_timeline.py'), '--check'], { encoding: 'utf8' });
  ok('A: the released page and catalogue still equal the generator output (tl-2026-11-R2, sha256 2f39aa30…0356)', r.status === 0 && r.stdout.includes('2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356'), r.stdout + r.stderr); }
ok('A: production big5.json carries no story field', !/"story"|"chart_claim_id"/.test(fs.readFileSync(path.join(TL, 'big5.json'), 'utf8')));

// ---------- B. the rehearsal catalogue
const G = gen(); const C = G.cat, R2 = J(path.join(TL, 'catalogue/tl-2026-11-R2.json'));
ok('B: the rehearsal sources build (schema 3, revision tl-2026-11-T1, previous tl-2026-11-R2)', G.code === 0 && C && C.schema === 3 && C.catalogue_revision === REV && C.release.previous === 'tl-2026-11-R2', G.err);
if (!C) { console.log(`timeline-story-build: ${pass} pass, ${fail + 1} fail (build failed; nothing else can run)`); process.exit(1); }
const byId = Object.fromEntries(C.entries.map(e => [e.id, e])), r2 = Object.fromEntries(R2.entries.map(e => [e.id, e]));
ok('B: the other four entries are identical to the released catalogue, key for key', Object.keys(r2).filter(i => i !== KPG).every(i => JSON.stringify(byId[i]) === JSON.stringify(r2[i])) && Object.keys(byId).join() === Object.keys(r2).join());
const k = byId[KPG], kc = Object.fromEntries(k.claims.map(c => [c.id, c])), strip = c => { const o = { ...c }; delete o.id; return JSON.stringify(o); };
ok('B: the two released timing claims are unchanged apart from carrying their ids c0 and c1', strip(kc.c0) === JSON.stringify(r2[KPG].claims[0]) && strip(kc.c1) === JSON.stringify(r2[KPG].claims[1]));
ok('B: the chart-boundary claim is unchanged and keeps its id c3', strip(kc.c3) === JSON.stringify(r2[KPG].claims[3]));
ok('B: the released context line "Causes are not shown in this release." is gone and its id c2 is not reused', !k.claims.some(c => c.text === r2[KPG].claims[2].text) && !('c2' in kc));
ok('B: the entry-wide evidence_reviewed date did not move', JSON.stringify(k.evidence_reviewed) === JSON.stringify(r2[KPG].evidence_reviewed));
const got = { ...Object.fromEntries(k.story.opening.map(o => [o.id, o.text])), ...Object.fromEntries(k.claims.filter(c => c.id in SNAP).map(c => [c.id, c.text])) };
ok('B: every reader-facing sentence equals review snapshot 2, word for word, and there is no other', JSON.stringify(Object.keys(SNAP).sort()) === JSON.stringify(Object.keys(got).sort()) && Object.keys(SNAP).every(i => SNAP[i] === got[i]), Object.keys(SNAP).filter(i => SNAP[i] !== got[i]));
ok('B: order as in the snapshot (opening op-1…op-5; then ca-1…di-4; then lim-1)', k.story.opening.map(o => o.id).join() === 'op-1,op-2,op-3,op-4,op-4b,op-5' && k.claims.map(c => c.id).join() === 'c0,c1,ca-1,ca-2,ca-3,di-1,di-2,di-2b,di-3,di-4,lim-1,c3');
ok('B: heading "Evidence and interpretations"; caption, alt text and credit as in the snapshot; kind measured_image', k.story.heading === 'Evidence and interpretations' && k.story.image.caption === CAPTION && k.story.image.alt === ALT && k.story.image.credit === 'Image: NASA/JPL (PIA03379)' && k.story.image.kind === 'measured_image');
ok('B: Renne 2013 and Schulte 2010 are marked "abstract only" wherever they are cited', [...k.story.evidence.filter(v => v.type === 'passage').map(v => v.source), ...k.claims.map(c => c.source).filter(Boolean)].every(s => (s.read === 'abstract only') === ['renne2013', 'schulte2010'].includes(s.key)));
const tot = k.story.image.renditions.reduce((a, r) => a + r.bytes, 0);
ok(`B: image renditions total ${tot} B, within 300,000`, tot <= 300000);
const src = J(path.join(RH, 'big5.json')).episodes.find(e => e.id === KPG).story.image.renditions;
ok('B: the committed rehearsal source names the two NASA files with the hashes and sizes of snapshot 2', src.length === 2 && src.every(r => NASA[r.file] && NASA[r.file][0] === r.sha256 && NASA[r.file][1] === r.bytes));
if (real) ok('B: the image files in the repository are those bytes', Object.keys(NASA).every(f => { const b = fs.readFileSync(path.join(RH, 'assets', f)); return sha(b) === NASA[f][0] && b.length === NASA[f][1]; }));
else { notrun++; console.log('NOT RUN  B: the image files in the repository are the NASA bytes (files absent; fixture images used)'); }
const raw = G.catBytes.toString('utf8');
ok('B: nothing private in the shipped data (no inbox id, private path or snapshot hash)', !/tl-in-|timeline-inbox|_review\/|snapshot|d532063d/i.test(raw));
ok('B: the public change record (account and image added) keeps the retired line word for word', C.changes.at(-1).what === 'account' && C.changes.at(-1).retired === 'Causes are not shown in this release.' && k.revisions.join() === 'tl-2026-11-T1-1');

// ---------- C. the pre-rendered page (JavaScript off reads this)
const P = G.page, art = P.slice(P.indexOf(`<article class="entry ep story" id="${KPG}"`)); const A = art.slice(0, art.indexOf('</article>'));
ok('C: the page says which schema it was built for (data-catalogue-schema="3")', /data-catalogue-schema="3"/.test(P));
const order = ['-fig"', '-opening"', '-opsrc"', 'data-grp="how"', 'data-grp="interp"', 'data-grp="context"', 'data-grp="chart"', 'data-grp="review"'].map(x => A.indexOf(x));
ok('C: order in the entry: heading, image, opening, its sources, how we know, evidence and interpretations, context, chart, review', order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])) && A.indexOf(`id="${KPG}-h"`) < order[0], order);
ok('C: the image without JavaScript: a <noscript> <img> with src, srcset, alt, width and height; the scripted <img> has no src', /<noscript><img class="simg" alt="[^"]+" width="1024" height="581" src="assets\/timeline\/tl-2026-11-T1\/PIA03379-fig1-1024\.jpg" srcset="[^"]+800w, [^"]+1024w" sizes="[^"]+"><\/noscript>/.test(A) && /<img class="simg" id="[^"]+" alt="[^"]+" width="1024" height="581" data-src=/.test(A) && !/<img class="simg" id="[^"]*"[^>]* src=/.test(A));
ok('C: every sentence of the snapshot is in the entry, escaped, each under its own id', Object.keys(SNAP).every(i => A.includes(`id="${KPG}-${i}"`)) && A.includes('&quot;unique cause&quot;') && A.includes('O&#x27;Connor and colleagues'));
ok('C: no element carries the retired id …-c2; the four other entries keep their claim ids', !P.includes(`id="${KPG}-c2"`) && ['e-big5-end-ordovician-c0', 'e-big5-end-triassic-c1', 'e-big5-end-permian-c0'].every(i => P.includes(`id="${i}"`)));
ok('C: credit and rights line link to the NASA record and to NASA\'s guidelines; no licence badge wording', A.includes('Image: NASA/JPL (PIA03379)') && A.includes('https://www.nasa.gov/nasa-brand-center/images-and-media/') && !/CC0|CC BY|public domain/i.test(A.slice(0, A.indexOf('data-grp="how"')).replace(/licence: CC BY 4\.0/g, '')));
const outside = P.replace(A, '');
const R2P = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8'); const artOf = (pg, id) => { const a = pg.slice(pg.indexOf(`id="${id}" aria-labelledby`) - 40); return a.slice(a.indexOf('<article'), a.indexOf('</article>')); };
ok('C: the other four entries are pre-rendered byte for byte as on the released page', ['e-big5-end-ordovician', 'e-big5-frasnian-famennian', 'e-big5-end-permian', 'e-big5-end-triassic'].every(i => artOf(P, i) === artOf(R2P, i) && artOf(P, i).length > 500));
ok('C: no image is referenced outside the entry that has one', !/assets\/timeline/.test(outside));
ok('C: each opening sentence carries its source numbers, and each number names a source in the list', (A.match(/<sup class="cite" data-src="[^"]+" data-n="\d">\[\d\]<\/sup>/g) || []).length === 11 && [...A.matchAll(/<sup class="cite" data-src="([^"]+)"/g)].every(m => A.includes(`<li id="${m[1]}" value=`)));
ok('C: the failure line and the scoped review note read as agreed with GPT; the entry-wide review line is still there', A.includes('The image could not be loaded. Its caption and the account remain available.') && A.includes('Account and image reviewed: <time datetime="2026-11-23">23 Nov 2026</time>. This covers the added sentences, their sources and the image record.') && A.includes('Evidence last reviewed: <time datetime="2026-11-10">10 Nov 2026</time>'));
ok('C: the change record gives the agreed reason', P.includes('Why: the earlier entry presented timing claims without a cause account.'));

// ---------- D. refusals, each by fixture (the generator must stop and say why)
const refused = (name, mut, word) => { const r = gen(mut); ok('D refused: ' + name, r.code !== 0 && /refused/.test(r.err) && (!word || r.err.includes(word)), r.err.slice(-200)); };
refused('a duplicate id (an opening sentence reusing a claim id)', E => big(E, k => { k.story.opening[1].id = 'ca-1'; }), 'duplicate');
refused('two claims with the same id', E => big(E, k => { k.claims[3].id = 'ca-1'; }), 'duplicate');
refused('a malformed id', E => big(E, k => { k.story.opening[0].id = 'Op 1'; }), 'malformed');
refused('a dangling support reference', E => big(E, k => { k.story.opening[0].supports = ['ev-nowhere']; }), 'does not exist');
refused('an evidence sentence with no support', E => big(E, k => { k.story.opening[0].supports = []; }), 'no support');
refused('a sentence of an unknown kind', E => big(E, k => { k.story.opening[0].kind = 'opinion'; }), 'malformed');
refused('an attributed finding with no source', E => big(E, k => { k.claims[2].source = null; }), 'no evidence record');
refused('an attributed finding with no locator', E => big(E, k => { delete k.claims[2].locator; }), 'no evidence record');
refused('an evidence item of an unknown type', E => big(E, k => { k.story.evidence[0].type = 'hearsay'; }), 'unknown type');
refused('a collection record with no address', E => big(E, k => { delete k.story.evidence.find(v => v.type === 'collection_record').url; }), 'incomplete');
refused('an image whose bytes differ from the recorded hash (one byte changed on disk)', E => { const f = path.join(E.src, 'assets/PIA03379-fig1-800.jpg'); const b = fs.readFileSync(f); b[b.length - 20] ^= 1; fs.writeFileSync(f, b); }, 'not the bytes recorded');
refused('an image with the wrong recorded size', E => big(E, k => { k.story.image.renditions[0].bytes += 1; }), 'not the bytes recorded');
refused('an image with the wrong recorded pixel size', E => big(E, k => { k.story.image.renditions[0].pixels = [801, 454]; }), 'pixel size');
refused('an image with a missing hash', E => big(E, k => { delete k.story.image.renditions[0].sha256; }), 'sha256');
refused('an image whose media type does not match its file', E => big(E, k => { k.story.image.renditions[0].media_type = 'image/png'; }), 'media type');
refused('an image with no licence field', E => big(E, k => { delete k.story.image.licence; }), 'licence');
refused('an image with no licence address', E => big(E, k => { k.story.image.licence_url = ''; }), 'licence_url');
refused('an image file given as a path', E => big(E, k => { k.story.image.renditions[0].file = 'sub/PIA03379-fig1-800.jpg'; }), 'plain file name');
refused('an image file that climbs out of the folder', E => big(E, k => { k.story.image.renditions[0].file = '../PIA03379-fig1-800.jpg'; }), 'plain file name');
refused('an image file given as an external address', E => big(E, k => { k.story.image.renditions[0].file = 'https://example.org/a.jpg'; }), 'plain file name');
refused('an image that is not in the assets folder', E => fs.renameSync(path.join(E.src, 'assets/PIA03379-fig1-800.jpg'), path.join(E.src, 'assets/moved.jpg')), 'not in the assets folder');
refused('a reconstruction', E => big(E, k => { k.story.image.kind = 'reconstruction'; }), 'not allowed');
refused('a reconstruction that is labelled as one', E => big(E, k => { k.story.image.kind = 'reconstruction'; k.story.image.caption = 'Artist\'s reconstruction. ' + k.story.image.caption; k.story.image.label = 'reconstruction'; }), 'not allowed');
refused('renditions over the byte budget in total', E => {   // a third file: the 1024-px image with padding after its end, so its record is true and only the total is wrong (no image library needed)
  const by = Buffer.concat([fs.readFileSync(path.join(E.src, 'assets/PIA03379-fig1-1024.jpg')), Buffer.alloc(100000)]); fs.writeFileSync(path.join(E.src, 'assets/big.jpg'), by);
  big(E, k => k.story.image.renditions.push({ file: 'big.jpg', sha256: sha(by), bytes: by.length, pixels: [1024, 581], media_type: 'image/jpeg', modification: 'test' })); }, 'over 300000');
refused('story fields in a schema 2 source', E => { const b = E.J('BUILD.json'); b.schema = 2; E.W('BUILD.json', b); const c = E.J('changes.json'); c.changes.pop(); E.W('changes.json', c); }, 'schema 2');
refused('a change record that retires a line the previous release never showed', E => { const c = E.J('changes.json'); c.changes.at(-1).retired = 'Something else.'; E.W('changes.json', c); }, 'retired');
refused('a change record that retires a line the entry still shows', E => big(E, k => { k.claims.at(-1).text = 'Causes are not shown in this release.'; }), 'still in the entry');
refused('an "account added" change for an entry with no account', E => { const c = E.J('changes.json'); c.changes.at(-1).entries = ['e-big5-end-permian']; E.W('changes.json', c); }, 'no account');
refused('an account with no dated review of its own', E => big(E, k => { delete k.story.reviewed; }), 'scoped review');
refused('an account review dated after the release day', E => big(E, k => { k.story.reviewed.date = '2026-12-01'; }), 'scoped review');
refused('a private reference in shipped data', E => big(E, k => { k.story.opening[0].text += ' See TL-IN-0002.'; }), 'private');
{ const r = gen(E => big(E, k => { k.story.opening[0].text = 'A <b>bold</b> & "quoted" <img src=x onerror=alert(1)> sentence.'; k.story.image.caption = '<script>alert(1)</script>' + k.story.image.caption; k.story.image.alt = '"><script>x</script>'; }));
  ok('D: markup in a text field is written as text, never as HTML', r.code === 0 && r.page.includes('A &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot; &lt;img src=x onerror=alert(1)&gt; sentence.') && r.page.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !/<script>alert|<b>bold|<img src=x/.test(r.page) && r.page.includes('alt="&quot;&gt;&lt;script&gt;x&lt;/script&gt;"'), r.err); }
{ const r = gen(E => big(E, k => { k.story.opening.at(-1).supports = ['ev-renne-abs']; }));
  ok('D REVIEW FIXTURE (not a validator test): a sentence whose support id is valid but points at an unrelated source BUILDS. Only the matrix review can catch it', r.code === 0); }
{ const r = gen(E => big(E, k => { delete k.story.image; }));
  ok('D: the same account with no image builds, with no figure and no asset reference in the page', r.code === 0 && !r.page.includes('class="sfig"') && !r.page.includes('assets/timeline') && r.page.includes(`id="${KPG}-opening"`)); }

// ---------- E. the preview helper: isolation and fidelity
{ let threw = ''; try { build(path.join(ROOT, 'phase1/_scratch'), 8791, { rehearsal: REHEARSAL }); } catch (e) { threw = e.message; }
  ok('E: the helper refuses to build inside the repository', /outside the repository/.test(threw) && !fs.existsSync(path.join(ROOT, 'phase1/_scratch')), threw); }
{ const bad = path.join(TMP, 'rh-bad'); fs.cpSync(REHEARSAL, bad, { recursive: true }); const b = J(path.join(bad, 'BUILD.json')); b.catalogue_revision = 'tl-2026-11-R3'; fs.writeFileSync(path.join(bad, 'BUILD.json'), JSON.stringify(b));
  let threw = ''; try { build(path.join(TMP, 'out-bad'), 8791, { rehearsal: bad }); } catch (e) { threw = e.message; }
  ok('E: the helper refuses a revision id that is not a rehearsal id (never builds under a release id)', /not a rehearsal revision id/.test(threw), threw); }
const OUT = path.join(TMP, 'preview'), PORT = 8791; const rep = build(OUT, PORT, { rehearsal: REHEARSAL });
const jsC = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8').split('\n'), cssC = fs.readFileSync(path.join(ROOT, 'style.css'));
ok('E: four states built: ' + STATES.join(', '), Object.keys(rep.states).join() === STATES.join());
for (const st of STATES) { const jsS = fs.readFileSync(path.join(OUT, st, 'timeline.js'), 'utf8').split('\n'); const d = jsS.map((l, i) => l === jsC[i] ? null : [jsC[i], l]).filter(Boolean);
  ok(`E ${st}: the served timeline.js differs from the committed file in exactly one line, the hub address`, jsS.length === jsC.length && d.length === 1 && d[0][0] === "const HUB = 'https://mother-earth.chadoberholzer.workers.dev';" && d[0][1] === `const HUB = 'http://127.0.0.1:${PORT}/${st}/hub';`, d);
  ok(`E ${st}: style.css is the committed file, byte for byte`, fs.readFileSync(path.join(OUT, st, 'style.css')).equals(cssC));
  const pg = fs.readFileSync(path.join(OUT, st, 'timeline.html'), 'utf8'); const lines = pg.split('\n').filter(l => l.includes('rehearsal-banner'));
  ok(`E ${st}: the page carries one banner line and is otherwise the generator's output`, lines.length === 1 && lines[0].includes(`Rehearsal ${REV}: not published`) && sha(Buffer.from(pg.replace('\n' + lines[0], ''))) === rep.states[st].page_generated_sha256);
  ok(`E ${st}: the page pins the catalogue the helper will serve`, pg.includes(`data-catalogue-sha="${rep.states[st].catalogue_sha256}"`) && pg.includes(`data-catalogue-rev="${REV}"`)); }
ok('E: the no-image state is a different catalogue with no image; the other three share one', rep.states['no-image'].catalogue_sha256 !== rep.states['with-image'].catalogue_sha256 && rep.states['image-fails'].catalogue_sha256 === rep.states['with-image'].catalogue_sha256 && rep.states['catalogue-refused'].catalogue_sha256 === rep.states['with-image'].catalogue_sha256);
const log = []; const server = serve(OUT, PORT, rep, l => log.push(l)); await new Promise(r => server.once('listening', r));
const get = async (p, init) => { const r = await fetch(`http://127.0.0.1:${PORT}${p}`, init); return { st: r.status, b: Buffer.from(await r.arrayBuffer()), h: r.headers }; };
ok('E: the helper listens on 127.0.0.1 only', server.address().address === '127.0.0.1');
{ const c = await get(`/with-image/hub/catalogue/timeline/${REV}`); ok('E: the catalogue is served as the bytes on disk (sha256 equals the page pin)', c.st === 200 && sha(c.b) === rep.states['with-image'].catalogue_sha256);
  const x = await get(`/catalogue-refused/hub/catalogue/timeline/${REV}`); const diff = [...x.b].filter((v, i) => v !== c.b[i]).length;
  ok('E: the catalogue-refused state serves the same catalogue with exactly one byte changed', x.st === 200 && x.b.length === c.b.length && diff === 1, diff);
  for (const f of Object.keys(NASA)) { const i = await get(`/with-image/assets/timeline/${REV}/${f}`); ok(`E: ${f} is served as the bytes on disk`, i.st === 200 && i.b.equals(fs.readFileSync(path.join(REHEARSAL, 'assets', f))) && i.h.get('content-type') === 'image/jpeg'); }
  ok('E: the image-fails state refuses the image (404) and serves the page', (await get(`/image-fails/assets/timeline/${REV}/PIA03379-fig1-800.jpg`)).st === 404 && (await get('/image-fails/timeline.html')).st === 200);
  const pg = await get('/with-image/timeline.html'); const csp = pg.h.get('content-security-policy') || '';
  ok('E: every response carries the policy that keeps the page to this helper and the two font hosts (no other host may be contacted)', /default-src 'none'/.test(csp) && /connect-src 'self'/.test(csp) && /img-src 'self'/.test(csp) && /script-src 'self'/.test(csp) && !/workers\.dev|nasa|r2|\*/.test(csp), csp);
  ok('E: GET only (POST → 405, HEAD → 405)', (await get('/with-image/timeline.html', { method: 'POST' })).st === 405 && (await get('/with-image/timeline.html', { method: 'HEAD' })).st === 405);
  const refusedPaths = ['/with-image/../../../etc/passwd', '/with-image/%2e%2e/%2e%2e/secret', '/with-image/_src/big5.json', '/with-image/hub/anything', '/other/timeline.html', '/with-image/assets/timeline/' + REV + '/SOURCE.txt', '/with-image/hub/catalogue/timeline/tl-2026-11-R2'];
  const sts = []; for (const p of refusedPaths) sts.push((await get(p)).st);
  ok('E: paths that leave the build folder, the source folder, other revisions and unknown paths are refused (404)', sts.every(s => s === 404), sts);
  ok('E: every request is logged, refusals included', log.length >= 12 && log.some(l => l.startsWith('404')) && log.some(l => l.startsWith('405'))); }
server.close();
ok('E: the helper has no client code: it cannot contact the live hub, R2 or any other host', !/\bfetch\(|https?\.request|https?\.get\(|node:https|net\.connect|dgram|WebSocket/.test(fs.readFileSync(path.join(TL, 'preview.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')));
console.log(`timeline-story-build: ${pass} pass, ${fail} fail${notrun ? `, ${notrun} NOT RUN (NASA image files absent)` : ''}${real ? '' : ' — on FIXTURE images'}`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
