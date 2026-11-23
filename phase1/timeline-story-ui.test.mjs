/*
 * Timeline story in a real browser (docs/concepts/TIMELINE-STORY-PROPOSAL.md rev 2.1 §7, §9, §12), against the preview helper.
 * Workspace Chromium (Playwright). The page, script, stylesheet, catalogue and images are the helper's; nothing is mocked
 * except where a check says so (delayed image, mutated catalogue, mixed builds).
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/timeline-story-ui.test.mjs
 * Breaks, each of which must make the suite fail: BREAK=eager-image | no-story-validate | no-schema-pin
 * Without the NASA files in phase1/timeline/rehearsal/assets/ it runs on FIXTURE images and says so.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { build, serve } from './timeline/preview.mjs'; import { rehearsalFor } from './timeline/story-fixture.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), BREAK = process.env.BREAK || '';
const sha = b => createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0; const ok = (name, cond, info) => { if (cond) { pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (info !== undefined ? '  → ' + JSON.stringify(info).slice(0, 500) : '')); } };
const KPG = 'e-big5-end-cretaceous', REV = 'tl-2026-11-T1', PORT = 8793, B = `http://127.0.0.1:${PORT}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-story-ui-')); const { dir: RH, real } = rehearsalFor(TMP);
if (!real) console.log('NOTE: NASA image files are not in phase1/timeline/rehearsal/assets/. Running on FIXTURE images.');
const rep = build(path.join(TMP, 'preview'), PORT, { rehearsal: RH }); const server = serve(path.join(TMP, 'preview'), PORT, rep, () => {}); await new Promise(r => server.once('listening', r));
const SRC = JSON.parse(fs.readFileSync(path.join(RH, 'big5.json'), 'utf8')).episodes.find(e => e.id === KPG);
const WANT = [...SRC.story.opening.map(o => o.text)], FINDINGS = SRC.claims.filter(c => /^(ca|di)-/.test(c.id)).map(c => c.text);
const must = (t, a, b) => { if (t.split(a).length !== 2) throw new Error('break anchor missing: ' + a.slice(0, 50)); return t.replace(a, b); };
const brokenJs = js => BREAK === 'eager-image' ? must(js, "document.body.classList.add('js');", "document.body.classList.add('js'); setTimeout(() => entries.forEach(a => hydrate(a)), 0);")
  : BREAK === 'no-story-validate' ? must(js, "function storyBad(e) {", "function storyBad(e) { return null;")
  : BREAK === 'no-schema-pin' ? must(js, "c.schema !== pageSchema", "false") : js;

const browser = await chromium.launch();
async function open(state, { w = 1280, h = 860, dpr = 1, js = true, hash = '', imgDelay = 0, mutate = null, page: pageBody = null, script = null } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, javaScriptEnabled: js });
  const reqs = [], imgs = [], errs = [];
  await c.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  if (imgDelay) await c.route(/assets\/timeline\//, async r => { await new Promise(z => setTimeout(z, imgDelay)); r.continue(); });
  if (BREAK || script) await c.route(/timeline\.js/, async r => { const body = script || brokenJs((await (await fetch(r.request().url())).text())); r.fulfill({ contentType: 'application/javascript', body }); });
  if (mutate) {   // a catalogue changed by the fixture, with the page's pin moved to the changed bytes, so only validation can refuse it
    const cat0 = await (await fetch(`${B}/${state}/hub/catalogue/timeline/${REV}`)).text(); const o = JSON.parse(cat0); mutate(o.entries.find(e => e.id === KPG), o);
    const body = Buffer.from(JSON.stringify(o)); const pg = (await (await fetch(`${B}/${state}/timeline.html`)).text()).replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(body)}"`);
    await c.route(/hub\/catalogue\/timeline/, r => r.fulfill({ contentType: 'application/json', body })); await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: pg }));
  }
  if (pageBody) await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: pageBody }));
  const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e)));
  p.on('request', r => { reqs.push(r.url()); if (/assets\/timeline\//.test(r.url())) imgs.push(r.url().split('/').pop()); });
  await p.goto(`${B}/${state}/timeline.html${hash}`, { waitUntil: 'load' });
  if (js) await p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending');
  await p.waitForTimeout(250);
  const axis = js ? await p.evaluate(() => window.TL_AXIS.state + (window.TL_AXIS.reason ? ':' + window.TL_AXIS.reason : '')) : 'no-js';
  return { c, p, reqs, imgs, errs, axis };
}
const story = p => p.evaluate(id => { const d = document.getElementById('detail'), a = document.getElementById(id), img = document.getElementById(id + '-img'), fig = document.getElementById(id + '-fig');
  const vis = e => !!e && !e.hidden && e.getClientRects().length > 0; const r = e => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; };
  return { open: !!d && !d.hidden && d.contains(a), focus: document.activeElement && document.activeElement.id, sents: [...a.querySelectorAll('.opening .ops')].map(e => e.textContent), opVis: vis(a.querySelector('.opening')),
    heads: [...a.querySelectorAll('.grp > .gh')].filter(vis).map(e => e.textContent), told: [...a.querySelectorAll('.told > p:first-child')].map(e => e.textContent), cap: fig ? fig.querySelector('figcaption').textContent : null,
    img: img ? { vis: vis(img), done: img.complete && img.naturalWidth > 0, cur: (img.currentSrc || '').split('/').pop(), box: (() => { const q = img.getBoundingClientRect(), t = a.getBoundingClientRect(), f = v => Math.round(v * 10) / 10; return [f(q.left - t.left), f(q.top - t.top), f(q.width), f(q.height)]; })(), nat: [img.naturalWidth, img.naturalHeight] } : null, fig: !!fig, failVis: fig ? vis(fig.querySelector('.imgfail')) : null,
    srcOpen: a.querySelector('.opsrc') ? a.querySelector('.opsrc').open : null, order: [...a.children].map(e => e.id || e.className).slice(0, 5), sw: document.documentElement.scrollWidth, iw: innerWidth,
    panel: d ? Math.round(d.querySelector('#d-body').getBoundingClientRect().width) : 0, hash: location.hash }; }, KPG);
const CARD = `#card-${KPG} .ctitle a`;

// ---------- A. with the image: nothing fetched until the story is opened, then one rendition; nothing on pan or zoom
for (const [w, h, dpr] of [[1280, 860, 1], [390, 844, 3], [360, 740, 2], [800, 900, 1]]) {
  const T = await open('with-image', { w, h, dpr, imgDelay: 500 }); const L = `A ${w}@${dpr}x`;
  ok(`${L}: the explorer draws from the rehearsal catalogue (schema 3) with no page error`, T.axis === 'on' && T.errs.length === 0, [T.axis, T.errs]);
  ok(`${L}: banner "Rehearsal ${REV}: not published"`, (await T.p.textContent('#rehearsal-banner')).includes(`Rehearsal ${REV}: not published`));
  ok(`${L}: no image request before a story is opened`, T.imgs.length === 0, T.imgs);
  await T.p.click(`#card-e-big5-end-permian .ctitle a`); await T.p.waitForTimeout(300);
  ok(`${L}: opening an entry that has no image fetches no image`, T.imgs.length === 0, T.imgs);
  await T.p.keyboard.press('Escape'); await T.p.waitForTimeout(200);
  await T.p.click(CARD); await T.p.waitForTimeout(120); const early = await story(T.p);
  await T.p.waitForFunction(id => { const i = document.getElementById(id + '-img'); return i.complete && i.naturalWidth > 0; }, KPG); await T.p.waitForTimeout(150); const s = await story(T.p);
  ok(`${L}: the story opens and focus goes to its heading`, s.open && s.focus === KPG + '-h', [s.open, s.focus]);
  ok(`${L}: exactly one image request on first open (${T.imgs.join()}), and it is the file the browser shows`, T.imgs.length === 1 && s.img.cur === T.imgs[0], [T.imgs, s.img.cur]);
  ok(`${L}: the image box is reserved before the image arrives and does not move when it does (position inside the entry and size ${early.img.box.join(',')})`, !early.img.done && early.img.box[3] > 50 && early.img.box.every((v, i) => Math.abs(v - s.img.box[i]) <= 0.5), [early.img, s.img.box]);   // half a pixel: the two files' proportions differ by 0.02 %
  ok(`${L}: the image keeps its own proportions and fits the panel`, Math.abs(s.img.box[2] / s.img.box[3] - s.img.nat[0] / s.img.nat[1]) < 0.02 && s.img.box[2] <= s.panel, [s.img.box, s.img.nat, s.panel]);
  ok(`${L}: no sideways overflow`, s.sw <= s.iw, [s.sw, s.iw]);
  ok(`${L}: the opening is the snapshot's six sentences, in order, and is visible`, JSON.stringify(s.sents) === JSON.stringify(WANT) && s.opVis, s.sents);
  ok(`${L}: the attributed findings are the snapshot's eight, in order, under "Evidence and interpretations"`, JSON.stringify(s.told) === JSON.stringify(FINDINGS) && s.heads.join('|') === 'How we know|Evidence and interpretations|Context and limits|Chart reference|Review and changes', [s.heads, s.told.length]);
  ok(`${L}: caption and credit are shown; the sources list for the opening is closed until asked for`, s.cap.startsWith(SRC.story.image.caption) && s.cap.includes('Image: NASA/JPL (PIA03379)') && s.srcOpen === false);
  await T.p.click(`#${KPG}-opsrc summary`); ok(`${L}: the sources list opens on request, with seven numbered sources`, await T.p.evaluate(id => { const d = document.getElementById(id + '-opsrc'); return d.open && d.querySelectorAll('li').length === 7; }, KPG));
  const n0 = T.imgs.length, v0 = await T.p.evaluate(() => JSON.stringify(window.TL_AXIS.view));
  if (w > 760) { await T.p.focus('.xpl'); for (const k of ['+', '+', 'ArrowLeft', 'ArrowRight', '-']) { await T.p.keyboard.press(k); await T.p.waitForTimeout(80); } }
  else { await T.p.keyboard.press('Escape'); await T.p.waitForTimeout(200); await T.p.focus('.xpl'); for (const k of ['+', '+', 'ArrowLeft', '-']) { await T.p.keyboard.press(k); await T.p.waitForTimeout(80); } await T.p.click(CARD); await T.p.waitForTimeout(300); }
  await T.p.waitForTimeout(400); const v1 = await T.p.evaluate(() => JSON.stringify(window.TL_AXIS.view));
  ok(`${L}: zooming and panning the timeline (and reopening the story) fetches no further image`, T.imgs.length === n0, T.imgs);
  await T.p.keyboard.press('Escape'); await T.p.waitForTimeout(200); await T.p.click(CARD); await T.p.waitForTimeout(300); await T.p.goBack(); await T.p.waitForTimeout(300); const closed = !(await story(T.p)).open; await T.p.goForward(); await T.p.waitForTimeout(300); const again = await story(T.p);
  ok(`${L}: Back closes the story, Forward reopens it with the image, with no new request`, closed && again.open && again.img.done && T.imgs.length === n0, [closed, again.open, T.imgs]);
  const other = T.reqs.filter(u => !u.startsWith(B) && !/fonts\.(googleapis|gstatic)/.test(u));
  ok(`${L}: no request to any other host (the live hub, R2 and NASA are never contacted)`, other.length === 0, other);
  await T.c.close();
}
{ const T = await open('with-image', { hash: '#' + KPG }); await T.p.waitForTimeout(500); const s = await story(T.p);
  ok('A direct link to the entry opens the story, with one image request', s.open && T.imgs.length === 1 && s.hash === '#' + KPG, [s.open, T.imgs]); await T.c.close(); }

// ---------- B. the image fails to load: the caption and the account stand
for (const w of [1280, 390]) { const T = await open('image-fails', { w }); await T.p.click(CARD); await T.p.waitForTimeout(700); const s = await story(T.p);
  ok(`B ${w}: the image is withdrawn and one plain line says it could not be loaded; no broken frame`, s.open && s.img && !s.img.vis && s.failVis === true, s.img);
  ok(`B ${w}: caption, opening and findings are all still there; no page error; no overflow`, s.cap.includes('Radar height map') && JSON.stringify(s.sents) === JSON.stringify(WANT) && s.told.length === 8 && T.errs.length === 0 && s.sw <= s.iw, T.errs);
  await T.c.close(); }

// ---------- C. no image: the story is complete without one
for (const w of [1280, 390]) { const T = await open('no-image', { w }); await T.p.click(CARD); await T.p.waitForTimeout(400); const s = await story(T.p);
  ok(`C ${w}: explorer on; the story has no figure, makes no image request, and is otherwise the same`, T.axis === 'on' && s.open && !s.fig && T.imgs.length === 0 && JSON.stringify(s.sents) === JSON.stringify(WANT) && s.told.length === 8 && s.order[0] === KPG + '-h', [T.axis, s.fig, T.imgs]);
  await T.c.close(); }

// ---------- D. the catalogue is refused: the list stays, and the entry can still be read
{ const T = await open('catalogue-refused'); ok('D: a catalogue with one byte changed is refused by the page (explorer off, list message shown)', T.axis === 'off:revision mismatch' && await T.p.isVisible('#axis-off'), T.axis);
  await T.p.click(CARD); await T.p.waitForTimeout(500); const s = await story(T.p);
  ok('D: the entry still opens from the list with its account and image', s.open && JSON.stringify(s.sents) === JSON.stringify(WANT) && s.img.done && T.imgs.length === 1); await T.c.close(); }

// ---------- E. JavaScript off: same content, same order, everything reachable
{ const T = await open('with-image', { js: false }); const r = await T.p.evaluate(id => { const a = document.getElementById(id); const img = a.querySelector('figure img:not([data-src])'), ph = a.querySelector('figure img[data-src]'); const vis = e => e.getClientRects().length > 0;
    return { vis: vis(a), sents: [...a.querySelectorAll('.opening .ops')].map(e => e.textContent), told: [...a.querySelectorAll('.told > p:first-child')].map(e => e.textContent), imgVis: !!img && vis(img) && img.complete && img.naturalWidth > 0 && !vis(ph), alt: img && img.alt,
      order: [...a.children].map(e => e.tagName + (e.dataset.grp ? ':' + e.dataset.grp : e.className ? '.' + e.className.split(' ')[0] : '')), claims: [...a.querySelectorAll('.claim')].every(vis), others: [...document.querySelectorAll('article.entry')].every(vis) }; }, KPG);
  ok('E no JavaScript: the entry is in the page with the image loaded as an ordinary image, its alt text, the six sentences and the eight findings', r.vis && r.imgVis && r.alt === SRC.story.image.alt && JSON.stringify(r.sents) === JSON.stringify(WANT) && JSON.stringify(r.told) === JSON.stringify(FINDINGS), r);
  ok('E no JavaScript: order heading, image, opening, sources, then the groups; every claim visible', r.order.join() === 'H3.eh,FIGURE.sfig,P.opening,DETAILS.opsrc,SECTION:how,SECTION:interp,SECTION:context,SECTION:chart,SECTION:review' && r.claims && r.others, r.order);
  await T.c.close(); }

// ---------- F. the page refuses a catalogue that breaks the story rules (pin moved to the changed bytes, so only validation refuses)
const refuses = async (name, mutate) => { const T = await open('with-image', { mutate }); ok('F refused by the page: ' + name + ` (${T.axis})`, /^off:validation: story /.test(T.axis) && T.errs.length === 0, T.axis); await T.c.close(); };
{ const T = await open('with-image', { mutate: () => {} }); ok('F control: the same route with an unchanged catalogue draws the explorer', T.axis === 'on', T.axis); await T.c.close(); }
await refuses('a duplicate id', k => { k.story.opening[1].id = 'ca-1'; });
await refuses('a dangling support reference', k => { k.story.opening[0].supports = ['ev-nowhere']; });
await refuses('an evidence sentence with no support', k => { k.story.opening[0].supports = []; });
await refuses('a sentence that is not the one on the page', k => { k.story.opening[0].text += ' And more.'; });
await refuses('an attributed finding with no source', k => { k.claims[2].source = null; });
await refuses('a reconstruction', k => { k.story.image.kind = 'reconstruction'; });
await refuses('a reconstruction with a label', k => { k.story.image.kind = 'reconstruction'; k.story.image.label = 'Reconstruction'; });
await refuses('an image file given as a path', k => { k.story.image.renditions[0].file = 'a/b.jpg'; });
await refuses('an image file given as an external address', k => { k.story.image.renditions[0].file = 'https://example.org/x.jpg'; });
await refuses('an image with no hash', k => { delete k.story.image.renditions[0].sha256; });
await refuses('an image with no licence', k => { k.story.image.licence = ''; });
await refuses('renditions over the byte budget', k => { k.story.image.renditions[0].bytes = 290000; });
await refuses('image files that are not the ones on the page', k => { k.story.image.renditions[0].file = 'other.jpg'; });
await refuses('an image in the page that the catalogue does not have', k => { delete k.story.image; });

// ---------- G. mixed builds fail safe
const show = f => execFileSync('git', ['show', 'origin/main:' + f], { cwd: ROOT, maxBuffer: 1 << 26 }).toString();
{ const R2 = fs.readFileSync(path.join(ROOT, 'phase1/timeline/catalogue/tl-2026-11-R2.json'));
  const hubTo = (c, body) => c.route(/catalogue\/timeline/, r => r.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body }));
  const T1cat = Buffer.from(await (await fetch(`${B}/with-image/hub/catalogue/timeline/${REV}`)).arrayBuffer());
  // the released page and script, given the schema-3 catalogue with the page's pin moved to it: the released script must refuse schema 3
  let T = await open('with-image', { page: show('timeline.html').replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(T1cat)}"`).replace('data-catalogue-rev="tl-2026-11-R2"', `data-catalogue-rev="${REV}"`), script: show('timeline.js').replace("const HUB = 'https://mother-earth.chadoberholzer.workers.dev';", `const HUB = '${B}/with-image/hub';`) });
  ok('G: the released page and script refuse the schema-3 catalogue even when its hash is pinned (list only)', T.axis === 'off:validation: catalogue identity' && T.errs.length === 0, T.axis); await T.c.close();
  // the new page (built for schema 3) given a schema-2 catalogue with the pin moved to it: refused on schema
  const c2 = JSON.parse(R2.toString()); c2.catalogue_revision = REV; c2.release.revision = REV; c2.releases.push({ revision: REV, release_date: c2.release.release_date }); const b2 = Buffer.from(JSON.stringify(c2));
  T = await open('with-image', { page: (await (await fetch(`${B}/with-image/timeline.html`)).text()).replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(b2)}"`) }); await T.c.close();
  const c = await browser.newContext(); await c.route(/fonts\./, r => r.abort()); await hubTo(c, b2); await c.route(/timeline\.html/, async r => r.fulfill({ contentType: 'text/html', body: (await (await fetch(`${B}/with-image/timeline.html`)).text()).replace(/data-catalogue-sha="[0-9a-f]{64}"/, `data-catalogue-sha="${sha(b2)}"`) }));
  if (BREAK) await c.route(/timeline\.js/, async r => r.fulfill({ contentType: 'application/javascript', body: brokenJs(await (await fetch(r.request().url())).text()) }));
  const p = await c.newPage(); await p.goto(`${B}/with-image/timeline.html`); await p.waitForFunction(() => window.TL_AXIS.state !== 'pending'); const st = await p.evaluate(() => window.TL_AXIS.state + ':' + window.TL_AXIS.reason);
  ok('G: the new page, built for schema 3, refuses a schema-2 catalogue even when its hash is pinned', st === 'off:validation: catalogue identity', st); await c.close();
  // the new script with the released page and catalogue: the released pair still works (schema 2 path unchanged)
  const c3 = await browser.newContext(); await c3.route(/fonts\./, r => r.abort()); await hubTo(c3, R2); await c3.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8') }));
  await c3.route(/timeline\.js/, async r => r.fulfill({ contentType: 'application/javascript', body: brokenJs(await (await fetch(r.request().url())).text()) }));
  const p3 = await c3.newPage(); const e3 = []; p3.on('pageerror', e => e3.push(String(e))); await p3.goto(`${B}/with-image/timeline.html`); await p3.waitForFunction(() => window.TL_AXIS.state !== 'pending');
  ok('G: this branch\'s script with the released page and released catalogue (schema 2) still draws the explorer', (await p3.evaluate(() => window.TL_AXIS.state)) === 'on' && e3.length === 0, e3); await c3.close(); }

await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`timeline-story-ui: ${pass} pass, ${fail} fail${real ? '' : ' — on FIXTURE images'}${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`);
process.exit(fail ? 1 : 0);
