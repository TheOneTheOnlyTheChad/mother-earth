/*
 * Timeline "What changed" + evidence last reviewed, in the browser (TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1 §3–§6).
 *
 * The hub is the REAL worker code answering inside the test (candidate phase1/worker.js, and the pinned previous hub),
 * with an in-memory R2 holding the committed catalogue files. The R1 page is the real released timeline.html and
 * timeline.js, read from git at the pinned commit and hash-checked. Fixtures (a partial re-check; a date change) are
 * built by the real generator into a temp folder and are never published.
 *
 * Run:    node phase1/timeline-changes-ui.test.cjs [base-url]      (static server on the repo, default http://127.0.0.1:8899)
 *         needs commits cc91165 and 95ffad0 in the clone: git fetch --depth=400 origin main
 * Breaks (each must make the suite fail):
 *   BREAK=fragment-only-link | back-loses-entry | close-handler-reused | no-focus | no-schema2-validate | guard-off |
 *         stale-js-version | dropped-anchor | review-date-from-release | review-date-from-latest-source |
 *         old-value-hidden | snapshot-by-key
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const ROOT = path.resolve(__dirname, '..'), TL = path.join(__dirname, 'timeline');
const BREAK = process.env.BREAK || '';
const R1_COMMIT = 'cc91165', OLD_HUB_COMMIT = '95ffad0';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info === undefined ? '' : JSON.stringify(info).slice(0, 500)); } };
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('break anchor missing: ' + a.slice(0, 70)); return s.replace(a, b); };
const git = (ref, f) => { try { return execFileSync('git', ['-C', ROOT, 'show', `${ref}:${f}`], { maxBuffer: 1 << 26 }); } catch (e) { throw new Error(`commit ${ref} is not in this clone: git fetch --depth=400 origin main`); } };

const REV = 'tl-2026-11-R2', R1 = 'tl-2026-11-R1';
const CAT = fs.readFileSync(path.join(TL, 'catalogue', REV + '.json')), CAT1 = fs.readFileSync(path.join(TL, 'catalogue', R1 + '.json'));
const R1_SHA = '096ae648479b744f458cdf5d042667c6a6262114ee63252cf132c41f99050fbe';
const HTML0 = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8'), JS0 = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8');
const R1_HTML = git(R1_COMMIT, 'timeline.html'), R1_JS = git(R1_COMMIT, 'timeline.js');
const T = 'e-big5-end-triassic', LINK = `${T}-chg-${REV}-1`, REC = `change-${REV}-1`, OPEN = REC + '-open';

// ---- breaks on the served script / page
const JS = (() => {
  if (BREAK === 'fragment-only-link') return must(JS0, "  const rec = $(a.dataset.change); if (!rec) return;   // no such record: the plain link is left to the browser", "  return;");
  if (BREAK === 'back-loses-entry') return must(JS0, "  history.pushState({ change: a.dataset.change, k }, '', '#' + a.dataset.change); here = k;", "  history.replaceState({ change: a.dataset.change, k }, '', '#' + a.dataset.change); here = k;");
  if (BREAK === 'close-handler-reused') return must(JS0, "  if (from !== null && isPhone()) closeVisual();", "  if (from !== null && isPhone()) userClose();");
  if (BREAK === 'no-focus') return must(JS0, "function reveal(rec) { rec.scrollIntoView({ block: 'start' }); rec.focus({ preventScroll: true }); }", "function reveal(rec) { rec.scrollIntoView({ block: 'start' }); }");
  if (BREAK === 'no-schema2-validate') return must(JS0, "  // schema 2: the release, each entry's own review date, and the change records", "  return null;");
  if (BREAK === 'guard-off') return must(JS0, "if (wrap.dataset.build !== BUILD) return off('build');", '');
  return JS0;
})();
const HTML = (() => {
  if (BREAK === 'stale-js-version') return must(HTML0, 'timeline.js?v=202611301000', 'timeline.js?v=202611221000');
  if (BREAK === 'dropped-anchor') return must(HTML0, 'id="e-pliny-ep-6-16-debate"', 'id="e-pliny-ep-6-16-debate-x"');
  return HTML0;
})();

// ---- the generator, optionally weakened, run on a private copy of its sources (fixtures)
const GEN = path.join(TL, 'build_timeline.py');
const GEN_BREAKS = {
  'review-date-from-release': [['Evidence last reviewed: {tdate(er["date"])}{ch}</p>', 'Evidence last reviewed: {tdate(BUILD["release_date"])}{ch}</p>']],
  'review-date-from-latest-source': [['Evidence last reviewed: {tdate(er["date"])}{ch}</p>', 'Evidence last reviewed: {tdate(max([s["checked"] for s in BIG5["sources"].values()] + [er["date"]]))}{ch}</p>']],
  'old-value-hidden': [["        if c['what'] != 'date':\n            continue", "        if True:\n            continue"], ['Was: <span class="was">{snap_line(c["before"])}</span>. Now:', 'Now:']],
  'snapshot-by-key': [['<span class="was">{snap_line(c["before"])}</span>.</p>', '<span class="was">{snap_line(c["after"])}</span>.</p>'], ['Was: <span class="was">{snap_line(c["before"])}</span>', 'Was: <span class="was">{snap_line(c["after"])}</span>']],
};
let genSrc = fs.readFileSync(GEN, 'utf8');
if (GEN_BREAKS[BREAK]) for (const [a, b] of GEN_BREAKS[BREAK]) genSrc = must(genSrc, a, b);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-chg-ui-'));
fs.writeFileSync(path.join(TMP, 'gen-src.py'), genSrc);
const RUNNER = `import sys\nsrc=open(${JSON.stringify(path.join(TMP, 'gen-src.py'))},encoding='utf-8').read()\nreal=${JSON.stringify(GEN)}\nsys.argv=[real]+sys.argv[1:]\nexec(compile(src,real,'exec'),{'__name__':'__main__','__file__':real})`;
let fxN = 0;
function fixture(edit) {
  const dir = path.join(TMP, 'fx' + (++fxN)); fs.mkdirSync(path.join(dir, 'catalogue'), { recursive: true });
  for (const f of ['BUILD.json', 'big5.json', 'changes.json', 'chart-v2026-06.5.json', 'entry-pliny-ep-6-16.json']) fs.copyFileSync(path.join(TL, f), path.join(dir, f));
  for (const f of [R1, REV]) fs.copyFileSync(path.join(TL, 'catalogue', f + '.json'), path.join(dir, 'catalogue', f + '.json'));
  const page = path.join(dir, 'timeline.html'); fs.writeFileSync(page, HTML0);
  const J = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), W = (f, o) => fs.writeFileSync(path.join(dir, f), JSON.stringify(o, null, 1) + '\n');
  edit({ J, W });
  const r = spawnSync('python3', ['-c', RUNNER, '--src', dir, '--page', page], { encoding: 'utf8' });
  const rev = J('BUILD.json').catalogue_revision;
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), html: fs.readFileSync(page, 'utf8'), cat: r.status === 0 ? fs.readFileSync(path.join(dir, 'catalogue', rev + '.json')) : null };
}

(async () => {
  // ---- hubs: the real worker code, in-memory R2
  const loadWorker = async (src, name) => { const f = path.join(TMP, name); fs.writeFileSync(f, src); return (await import(pathToFileURL(f).href)).default; };
  const newHub = await loadWorker(fs.readFileSync(path.join(__dirname, 'worker.js')), 'hub-new.mjs');
  const oldHubSrc = git(OLD_HUB_COMMIT, 'phase1/worker.js');
  const oldHub = await loadWorker(oldHubSrc, 'hub-old.mjs');
  const KEY = r => `ref/timeline/${r}.json`;
  const envOf = objects => ({ DB: { prepare() { const st = { bind: () => st, first: async () => null, all: async () => ({ results: [] }), run: async () => ({}) }; return st; } },
    R2: { get: async k => { const b = objects[k]; return b ? { arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) } : null; } } });
  const BOTH = { [KEY(R1)]: CAT1, [KEY(REV)]: CAT };
  const seenHub = [];
  const hubRoute = (worker, objects) => async route => {
    const url = route.request().url(); const res = await worker.fetch(new Request(url), envOf(objects));
    const body = Buffer.from(await res.arrayBuffer()); seenHub.push({ url, status: res.status, sha: sha(body) });
    const headers = {}; res.headers.forEach((v, k) => { headers[k] = v; });
    return route.fulfill({ status: res.status, headers, body });
  };
  const HUB = /mother-earth\.chadoberholzer\.workers\.dev\//;
  const b = await chromium.launch();
  async function ctx({ hub = hubRoute(newHub, BOTH), html = HTML, js = JS, viewport = { width: 1280, height: 860 }, jsOn = true } = {}) {
    const c = await b.newContext({ viewport, javaScriptEnabled: jsOn });
    await c.route(/fonts\.googleapis|unpkg|gibs|jsdelivr|thelatinlibrary|doi\.org|stratigraphy|creativecommons/, r => r.abort());
    await c.route(HUB, hub);
    await c.route(/timeline\.js/, r => r.fulfill({ contentType: 'application/javascript', body: js }));
    await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: html }));
    return c;
  }
  const settle = p => p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending', null, { timeout: 20000 }).catch(() => {});
  const axis = p => p.evaluate(() => ({ state: window.TL_AXIS && window.TL_AXIS.state, reason: window.TL_AXIS && window.TL_AXIS.reason, marks: document.querySelectorAll('#axis a.mk').length,
    offShown: !document.getElementById('axis-off').hidden, cards: document.querySelectorAll('#dated .card').length, shelf: document.querySelectorAll('#shelf .card').length }));
  const st = p => p.evaluate(() => { const d = document.getElementById('detail'), a = document.activeElement, hb = document.querySelector('header.top').getBoundingClientRect().bottom;
    const rec = id => { const n = document.getElementById(id); if (!n) return null; const r = n.getBoundingClientRect(); return { top: Math.round(r.top), inView: r.top >= hb - 1 && r.top < innerHeight - 20, covered: (() => { const e = document.elementFromPoint(Math.min(innerWidth - 2, r.left + 8), r.top + 6); return !(e && (e === n || n.contains(e))); })() }; };
    return { open: !!d && !d.hidden, entry: d && d.querySelector('article') ? d.querySelector('article').id : null, active: a ? a.id : null, hash: location.hash, inert: document.querySelectorAll('[inert]').length,
      locked: document.documentElement.classList.contains('locked'), role: d ? d.getAttribute('role') : null, state: history.state, rec: rec('change-tl-2026-11-R2-1'), len: history.length }; });
  const wait = p => p.waitForTimeout(220);

  // ================= A. the released files this candidate must stay compatible with
  ok('A: real R1 page files read from git equal their released hashes', sha(R1_HTML) === 'd7c37d5f30574c98190650272b249e482f59a1202493b9edc5a8d65c47ebf3d5' && sha(R1_JS) === 'ae87c6a1f2ef8b5a350ce98e21e2db817a1e9d060868e02fe7ef6638664eec7b');
  ok('A: pinned previous hub is the live 0.6.8 code', sha(oldHubSrc) === '85737a48c97a0ee1817b3a70883ba4d334b82da4092135a367d25a676c17c427');
  ok('A: frozen R1 catalogue equals its published pin', sha(CAT1) === R1_SHA && CAT1.length === 15656);

  // ================= B. what a reader sees, without JavaScript
  {
    const c = await ctx({ jsOn: false }); const p = await c.newPage(); await p.goto(BASE + '/timeline.html');
    const m = await p.evaluate(({ REC, T }) => { const q = s => document.querySelector(s), tx = n => n ? n.textContent.replace(/\s+/g, ' ').trim() : null, tm = n => n ? [...n.querySelectorAll('time')].map(t => [t.getAttribute('datetime'), t.textContent]) : null;
      return { updated: tx(q('#tl-updated')), updatedT: tm(q('#tl-updated')), heads: [...document.querySelectorAll('#changes .rel > h4')].map(tx), headT: [...document.querySelectorAll('#changes .rel > h4')].map(tm),
        rec: tx(q('#' + REC)), recT: tm(q('#' + REC)), r1: [...document.querySelectorAll('#rel-tl-2026-11-R1 .chgrec')].map(tx), rev: tx(q('#' + T + '-rev')), revT: tm(q('#' + T + '-rev')),
        revs: [...document.querySelectorAll('article.entry .rev')].map(n => [n.id, tx(n)]), label: tx(q('#' + T + '-c0-h')), text: tx(q('#' + T + '-c0 p:not(.cval):not(.srcnote)')), cardLabel: tx(q('#card-' + T + ' .clab')),
        val: tx(q('#' + T + '-c0 .cval')), src: tx(q('#' + T + '-c0 .srcnote')), order: [...document.querySelectorAll('main > section, main > p')].map(n => n.id || n.className), sw: document.documentElement.scrollWidth, iw: innerWidth };
    }, { REC, T });
    const rel = JSON.parse(CAT).release.release_date, relText = `${+rel.slice(8)} Nov 2026`;
    ok('B: "Timeline page updated <release day> · revision tl-2026-11-R2 · What changed"', m.updated === `Timeline page updated ${relText} · revision tl-2026-11-R2 · What changed` && m.updatedT.length === 1 && m.updatedT[0][0] === rel, m.updated);
    ok('B: release headings, newest first, each with its own date', m.heads.join('|') === `${relText} — revision tl-2026-11-R2|10 Nov 2026 — revision tl-2026-11-R1 (first release)` && m.headT[0][0][0] === rel && m.headT[1][0][0] === '2026-11-10', m.heads);
    ok('B: the R2 change record, word for word as approved', m.rec === 'Wording clarified: End-Triassic mass extinction. The label "Approximate age of the extinction horizon" now reads "Approximate age of the extinction level in the rock record", with the matching change in the entry text. Why: plainer wording for a general reader. Dates, sources and the mark on the axis are unchanged. The entry\'s evidence was last reviewed 10 Nov 2026. Open the entry', m.rec);
    ok('B: the R1 records', m.r1.join('|') === 'Added the conventional Big Five mass extinctions on the deep-time axis, placed on the ICS chart (v2026-06).|The Pliny entry (on this page since 9 Nov 2026) moved into the catalogue. It stays on the dates-without-a-year shelf.', m.r1);
    ok('B: the entry line, word for word as approved', m.rev === 'Evidence last reviewed: 10 Nov 2026 · Changed in revision tl-2026-11-R2: wording clarified', m.rev);
    ok('B: release date and evidence-last-reviewed are separate elements with their own <time> values', m.revT.length === 1 && m.revT[0][0] === '2026-11-10' && m.recT.length === 1 && m.recT[0][0] === '2026-11-10' && m.updatedT[0][0] === rel && rel !== '2026-11-10', [m.revT, m.recT, m.updatedT]);
    ok('B: every entry carries its own review date (Big Five 10 Nov, Pliny 9 Nov); only End-Triassic says "Changed in"', m.revs.length === 6 && m.revs.filter(([i, t]) => /^e-big5/.test(i) && /^Evidence last reviewed: 10 Nov 2026/.test(t)).length === 5
      && m.revs.some(([i, t]) => i === 'e-pliny-ep-6-16-rev' && t === 'Evidence last reviewed: 9 Nov 2026') && m.revs.filter(([, t]) => /Changed in/.test(t)).length === 1, m.revs);
    ok('B: approved label on the entry and the card; approved text (option A)', m.label === 'Approximate age of the extinction level in the rock record' && m.cardLabel === 'Approximate age of the extinction level in the rock record:'
      && m.text === 'In each of the three sections studied, a large sulfur-isotope shift about 201.5 million years ago coincides with the level in the rock record that marks the extinction.', [m.label, m.cardLabel, m.text]);
    ok('B: value, source and its checked date unchanged', m.val === '~201.5 Ma (approximate, as stated)' && /He T et al\. \(2020\)/.test(m.src) && /\(checked 10 Nov 2026\)/.test(m.src), [m.val, m.src]);
    ok('B: no "extinction horizon" left outside the change record', await p.evaluate(REC => { const cl = document.querySelector('main').cloneNode(true); cl.querySelector('#' + REC).remove(); return !/extinction horizon/i.test(cl.textContent); }, REC));
    ok('B: What changed is the last section of the page', m.order[m.order.length - 1] === 'changes', m.order);
    ok('B: no horizontal overflow (1280)', m.sw <= m.iw, [m.sw, m.iw]);
    // plain links work without JavaScript, both ways
    await p.click('#' + LINK); let v = await p.evaluate(REC => { const r = document.getElementById(REC).getBoundingClientRect(); return { hash: location.hash, top: r.top, ih: innerHeight }; }, REC);
    ok('B no-JS: "wording clarified" lands on the change record', v.hash === '#' + REC && v.top >= 0 && v.top < v.ih, v);
    await p.click('#' + OPEN); v = await p.evaluate(T => { const r = document.getElementById(T).getBoundingClientRect(); return { hash: location.hash, top: r.top, ih: innerHeight }; }, T);
    ok('B no-JS: "Open the entry" lands on the entry', v.hash === '#' + T && v.top >= -2 && v.top < v.ih, v);
    await c.close();
  }
  for (const w of [360, 390]) {
    const c = await ctx({ jsOn: false, viewport: { width: w, height: 844 } }); const p = await c.newPage(); await p.goto(BASE + '/timeline.html#changes');
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(`B ${w}: no horizontal overflow with What changed in view`, m.sw <= m.iw, m); await c.close();
  }

  // ================= C. anchors: every R1 anchor still resolves; the Pliny section fragments still work
  {
    const ids = h => [...h.toString('utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    const old = ids(R1_HTML), now = new Set(ids(HTML));
    ok('C: every id on the released R1 page exists on the candidate page', old.length >= 60 && old.includes('e-pliny-ep-6-16-debate') && old.includes('card-e-big5-end-cretaceous') && old.every(i => now.has(i)), [old.length, old.filter(i => !now.has(i))]);
    ok('C: new anchors are additions only (#changes, #change-<revision>-<n>)', now.has('changes') && now.has(REC) && now.has('change-tl-2026-11-R1-1') && now.has('change-tl-2026-11-R1-2'));
    for (const x of ['conv', 'debate']) {
      let c = await ctx({ jsOn: false }); let p = await c.newPage(); await p.goto(BASE + '/timeline.html#e-pliny-ep-6-16-' + x);
      ok(`C no-JS: #e-pliny-ep-6-16-${x} lands on its section`, await p.evaluate(x => { const n = document.getElementById('e-pliny-ep-6-16-' + x); if (!n) return false; const r = n.getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight; }, x));
      await c.close();
      c = await ctx(); p = await c.newPage(); await p.goto(BASE + '/timeline.html#e-pliny-ep-6-16-' + x); await settle(p); await wait(p);
      const s = await p.evaluate(x => { const d = document.getElementById('detail'), sec = document.getElementById('e-pliny-ep-6-16-' + x), btn = sec && sec.querySelector('.xbtn');
        return { open: !d.hidden, entry: d.querySelector('article') && d.querySelector('article').id, expanded: btn && btn.getAttribute('aria-expanded'), hash: location.hash, active: document.activeElement.id }; }, x);
      ok(`C JS: #e-pliny-ep-6-16-${x} opens the entry with that section expanded, focus on its heading`, s.open && s.entry === 'e-pliny-ep-6-16' && s.expanded === 'true' && s.hash === '#e-pliny-ep-6-16' && s.active === 'e-pliny-ep-6-16-h', s);
      await c.close();
    }
  }

  // ================= D. page and hub pairs
  const pairs = [
    // [label, html, js, worker, objects, expect(axis) -> bool, wanted catalogue request]
    ['new page + new script + candidate hub (R1 and R2 stored)', HTML, JS, newHub, BOTH, a => a.state === 'on' && a.marks === 5, REV],
    ['REAL R1 page + R1 script + candidate hub: the old matched pair keeps its axis', R1_HTML.toString('utf8'), R1_JS.toString('utf8'), newHub, BOTH, a => a.state === 'on' && a.marks === 5, R1],
    ['MIXED: R1 page that re-fetches the script and gets the NEW one → build guard, static list', R1_HTML.toString('utf8'), JS, newHub, BOTH, a => a.state === 'off' && a.reason === 'build' && a.offShown, null],
    ['MIXED: new page with the cached OLD script → build guard, static list', HTML, R1_JS.toString('utf8'), newHub, BOTH, a => a.state === 'off' && a.reason === 'build' && a.offShown, null],
    ['new page + new script + previous hub 0.6.8 (no R2 pin) → 404, static list', HTML, JS, oldHub, { [KEY(R1)]: CAT1 }, a => a.state === 'off' && a.reason === 'http 404' && a.offShown, REV],
    ['new page + candidate hub before the R2 upload → 503, static list', HTML, JS, newHub, { [KEY(R1)]: CAT1 }, a => a.state === 'off' && a.reason === 'http 503' && a.offShown, REV],
    ['REAL R1 page + R1 script + previous hub 0.6.8 (today\'s production pair)', R1_HTML.toString('utf8'), R1_JS.toString('utf8'), oldHub, { [KEY(R1)]: CAT1 }, a => a.state === 'on' && a.marks === 5, R1],
  ];
  for (const [label, html, js, worker, objects, want, rev] of pairs) {
    seenHub.length = 0; const errs = [];
    const c = await ctx({ html, js, hub: hubRoute(worker, objects) }); const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/timeline.html'); await settle(p); const a = await axis(p);
    ok(`D ${label}`, want(a), a);
    ok(`D ${label}: list complete (5 dated cards, 1 shelf card), no script error`, a.cards === 5 && a.shelf === 1 && errs.length === 0, [a, errs]);
    if (rev) ok(`D ${label}: exactly one catalogue request, for ${rev}`, seenHub.length === 1 && seenHub[0].url.endsWith('/catalogue/timeline/' + rev), seenHub);
    else ok(`D ${label}: no catalogue request at all`, seenHub.length === 0, seenHub);
    if (rev === R1 && a.state === 'on') ok(`D ${label}: the hub returned R1's original bytes`, seenHub[0].status === 200 && seenHub[0].sha === R1_SHA, seenHub[0]);
    if (a.state === 'off') {   // the static list stays usable: an entry opens, its sources and anchors are there
      await p.click(`#card-${T} .ctitle a`); await wait(p);
      const s = await p.evaluate(T => { const d = document.getElementById('detail'); return { open: !d.hidden, entry: d.querySelector('article') && d.querySelector('article').id, src: !!d.querySelector('.srcnote a[href^="https://doi.org/"]'), hash: location.hash }; }, T);
      ok(`D ${label}: with the axis off an entry still opens with its source link`, s.open && s.entry === T && s.src && s.hash === '#' + T, s);
    }
    await c.close();
  }
  { // legacy URL on the candidate hub, asked directly as an old cached page would
    const r = await newHub.fetch(new Request('https://mother-earth.chadoberholzer.workers.dev/catalogue/timeline'), envOf(BOTH)); const body = Buffer.from(await r.arrayBuffer());
    ok('D candidate hub: the legacy URL returns R1\'s original bytes while R2 is current', r.status === 200 && sha(body) === R1_SHA, [r.status, sha(body).slice(0, 12)]);
  }
  ok('D asset version: the candidate page asks for a different timeline.js ?v= than the R1 page', (m => m && !R1_HTML.toString('utf8').includes(m[0]))(HTML.match(/timeline\.js\?v=\d+/)), HTML.match(/timeline\.js\?v=\d+/));

  // ================= E. schema 2 validation in the page (page and catalogue hash matched, so only validation can refuse)
  {
    const mut = fn => { const o = JSON.parse(CAT); fn(o); const body = Buffer.from(JSON.stringify(o)); return { body, html: HTML.replace(`data-catalogue-sha="${sha(CAT)}"`, `data-catalogue-sha="${sha(body)}"`) }; };
    const cases = [
      ['schema 1 bytes under the R2 name', o => { o.schema = 1; }], ['no release block', o => { delete o.release; }], ['release names another revision', o => { o.release.revision = R1; }],
      ['invalid release date', o => { o.release.release_date = '12 Nov 2026'; }], ['an entry without evidence_reviewed', o => { delete o.entries[2].evidence_reviewed; }],
      ['a shelf entry without evidence_reviewed', o => { delete o.shelf[0].evidence_reviewed; }], ['evidence reviewed after the release day', o => { o.entries[0].evidence_reviewed.date = '2027-01-01'; }],
      ['a change naming an unknown entry', o => { o.changes[0].entries.push('e-nope'); }], ['a change record that is not on the page', o => { o.changes[2].id = REV + '-9'; o.entries[3].revisions = [REV + '-9']; }],
      ['an entry listing an unknown change', o => { o.entries[1].revisions = [REV + '-7']; }], ['a change of an unknown kind', o => { o.changes[0].kind = 'withdrawn'; }], ['changes missing', o => { delete o.changes; }],
      ['a nested null', o => { o.changes[1] = null; }],
    ];
    for (const [label, fn] of cases) {
      const { body, html } = mut(fn);
      const c = await ctx({ html, hub: r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body }) }); const p = await c.newPage();
      await p.goto(BASE + '/timeline.html'); await settle(p); const a = await axis(p);
      ok(`E ${label} → axis off (validation), list and What changed still there`, a.state === 'off' && /^validation: /.test(a.reason || '') && a.cards === 5 && await p.evaluate(REC => !!document.getElementById(REC), REC), a);
      await c.close();
    }
  }

  // ================= F. "Changed in …" across the sheet, and back; "Open the entry" from the record, and back
  for (const [w, h] of [[390, 844], [1280, 860]]) for (const mode of ['card', 'direct']) {
    const tag = `F ${w} ${mode}`, phone = w <= 720; const errs = [];
    const c = await ctx({ viewport: { width: w, height: h } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e)));
    try {   // a broken history sequence can leave the page altogether; that is a failure of this block, not a crash of the suite
    if (mode === 'card') { await p.goto(BASE + '/timeline.html'); await settle(p); await p.click(`#card-${T} .ctitle a`); }
    else { await p.goto(BASE + '/timeline.html#' + T); await settle(p); }
    await wait(p);
    let s = await st(p);
    ok(`${tag}: entry open${phone ? ' as a modal sheet (page inert, scroll locked)' : ' as a panel'}`, s.open && s.entry === T && (phone ? s.role === 'dialog' && s.inert > 0 && s.locked : s.role === 'region' && s.inert === 0), s);
    const len0 = s.len;
    await p.click('#' + LINK); await wait(p); s = await st(p);
    ok(`${tag}: jump → ${phone ? 'sheet closed, nothing inert, scroll unlocked' : 'panel still open'}`, phone ? !s.open && s.inert === 0 && !s.locked : s.open && s.entry === T, s);
    ok(`${tag}: jump → the change record is in view below the header and not covered`, s.rec && s.rec.inView && !s.rec.covered, s.rec);
    ok(`${tag}: jump → the change record actually holds focus`, s.active === REC, s.active);
    ok(`${tag}: jump → its own history entry (#change-…), added, not replaced`, s.hash === '#' + REC && s.state && s.state.change === REC && s.len === len0 + 1, [s.hash, s.state, s.len, len0]);
    await p.goBack(); await wait(p); s = await st(p);
    ok(`${tag}: Back → the same entry is open again`, s.open && s.entry === T && s.hash === '#' + T && (phone ? s.role === 'dialog' && s.inert > 0 && s.locked : true), s);
    ok(`${tag}: Back → focus on the "wording clarified" link that was used`, s.active === LINK, s.active);
    await p.goForward(); await wait(p); s = await st(p);
    ok(`${tag}: Forward → the change record again, focused${phone ? ', sheet closed' : ''}`, s.active === REC && s.hash === '#' + REC && s.rec.inView && (phone ? !s.open && s.inert === 0 && !s.locked : true), s);
    // from the record: Open the entry, then Back and Forward
    await p.click('#' + OPEN); await wait(p); s = await st(p);
    ok(`${tag}: "Open the entry" from the record opens it, focus on its heading`, s.open && s.entry === T && s.active === T + '-h' && s.hash === '#' + T, s);
    await p.goBack(); await wait(p); s = await st(p);
    ok(`${tag}: Back → entry closed, back on the record's history entry, focus on "Open the entry"`, !s.open && s.inert === 0 && !s.locked && s.hash === '#' + REC && s.active === OPEN, s);
    await p.goForward(); await wait(p); s = await st(p);
    ok(`${tag}: Forward → the entry opens again`, s.open && s.entry === T && s.hash === '#' + T, s);
    await p.goBack(); await wait(p); await p.goBack(); await wait(p); s = await st(p);
    ok(`${tag}: Back twice → the first entry state again, open, focus on the link (the jump did not consume it)`, s.open && s.entry === T && s.hash === '#' + T && s.active === LINK, s);
    if (mode === 'card') { await p.goBack(); await wait(p); s = await st(p);
      ok(`${tag}: one more Back → entry closed, focus back on the card title that opened it`, !s.open && s.hash === '' && await p.evaluate(T => document.activeElement === document.querySelector(`#card-${T} .ctitle a`), T), s); }
    else { await p.click('#d-close'); await wait(p); s = await st(p);
      ok(`${tag}: Close after a direct link clears the fragment and closes`, !s.open && s.hash === '' && s.inert === 0, s); }
    ok(`${tag}: no script error`, errs.length === 0, errs);
    } catch (e) { ok(`${tag}: the Back/Forward sequence stays on the page`, false, String(e).slice(0, 200)); }
    await c.close();
  }

  // ================= G. fixture: a partial re-check (three different dates in three places)
  {
    const f = fixture(({ J, W }) => { const d = J('big5.json'); d.sources.he2020.checked = '2026-11-11'; d.sources.he2020.status = d.sources.he2020.status.replace('checked 10 Nov 2026', 'checked 11 Nov 2026'); W('big5.json', d); });
    ok('G: the generator accepts a source checked after the entry-wide review (both on or before the release day)', f.code === 0, f.out.slice(-300));
    if (f.code === 0) {
      const c = await ctx({ html: f.html, jsOn: false }); const p = await c.newPage(); await p.goto(BASE + '/timeline.html');
      const m = await p.evaluate(({ T, REC }) => ({ entry: document.querySelector(`#${T}-rev time`).getAttribute('datetime'), entryText: document.querySelector(`#${T}-rev time`).textContent, src: document.querySelector(`#${T}-c0 .srcnote`).textContent,
        head: document.querySelector('#rel-tl-2026-11-R2-h time').getAttribute('datetime'), rec: document.querySelector(`#${REC} time`).getAttribute('datetime'), updated: document.querySelector('#tl-updated time').getAttribute('datetime') }), { T, REC });
      ok('G rendered: entry "Evidence last reviewed" = 10 Nov 2026 (the entry-wide review)', m.entry === '2026-11-10' && m.entryText === '10 Nov 2026', m);
      ok('G rendered: the source line shows its own later date, 11 Nov 2026', /\(checked 11 Nov 2026\)/.test(m.src) && !/checked 10 Nov/.test(m.src), m.src);
      ok('G rendered: What changed heading and page line show the release day; the change record quotes the entry-wide date', m.head === '2026-11-12' && m.updated === '2026-11-12' && m.rec === '2026-11-10', m);
      await c.close();
    }
  }

  // ================= H. fixture: a date change (synthetic; never published)
  {
    const prev = JSON.parse(CAT).entries.find(e => e.id === 'e-big5-end-permian').claims.find(k => k.claim_type === 'extinction_onset_estimate');
    const NEWTXT = prev.when_text.replace('251.941', '251.902').replace('0.037', '0.024');
    const FX = 'tl-2026-12-T1';
    const f = fixture(({ J, W }) => {
      const bd = J('BUILD.json'); bd.catalogue_revision = FX; bd.release_date = '2026-12-01'; bd.previous = REV; bd.generated_at = '2026-12-01T00:00:00Z'; W('BUILD.json', bd);
      const d = J('big5.json'); d.sources.fixture2026 = { citation: 'Fixture A, Fixture B (2026) Synthetic test source. Journal of Fixtures 1: 1', doi: '10.0000/fixture', licence: 'CC BY 4.0', status: 'Synthetic fixture, not a real source (checked 30 Nov 2026)', checked: '2026-11-30' };
      const ep = d.episodes.find(e => e.id === 'e-big5-end-permian'), cl = ep.claims.find(k => k.claim_type === 'extinction_onset_estimate');
      cl.when.ma = 251.902; cl.when.pm = 0.024; cl.source = 'fixture2026'; cl.locator = 'Table 1'; ep.evidence_reviewed.date = '2026-11-30'; W('big5.json', d);
      const ch = J('changes.json'); ch.releases.push({ revision: FX, release_date: '2026-12-01' });
      ch.changes.push({ id: FX + '-1', revision: FX, kind: 'revised', what: 'date', entries: ['e-big5-end-permian'], claim_type: 'extinction_onset_estimate', title: 'Date revised: End-Permian mass extinction.', short: 'date revised',
        before: { when_text: prev.when_text, source: { citation: prev.source.citation, url: prev.source.url, locator: prev.locator, licence: prev.source.licence, status: prev.source.status, checked: prev.source.checked } },
        after: { when_text: NEWTXT, source: { citation: d.sources.fixture2026.citation, url: 'https://doi.org/10.0000/fixture', locator: 'Table 1', licence: 'CC BY 4.0', status: d.sources.fixture2026.status, checked: '2026-11-30' } },
        why: 'synthetic fixture, newer dating' });
      W('changes.json', ch);
    });
    ok('H: the generator builds the date-change fixture', f.code === 0, f.out.slice(-400));
    if (f.code === 0) {
      let c = await ctx({ html: f.html, jsOn: false }); let p = await c.newPage(); await p.goto(BASE + '/timeline.html');
      const m = await p.evaluate(FX => { const q = s => document.querySelector(s), tx = n => n ? n.textContent.replace(/\s+/g, ' ').trim() : null;
        return { was: tx(q(`#change-${FX}-1 .was`)), now: tx(q(`#change-${FX}-1 .now`)), rec: tx(q(`#change-${FX}-1`)), earlier: tx(q(`#e-big5-end-permian-earlier-${FX}-1`)), cur: tx(q('#e-big5-end-permian-c0 .cval')), curSrc: tx(q('#e-big5-end-permian-c0 .srcnote')),
          rev: tx(q('#e-big5-end-permian-rev')), heads: [...document.querySelectorAll('#changes .rel > h4')].map(tx) }; }, FX);
      ok('H: old and new values side by side in the change record', m.was && m.now && m.was.startsWith(prev.when_text) && m.now.startsWith(NEWTXT) && /Why: synthetic fixture, newer dating\./.test(m.rec), [m.was, m.now]);
      ok('H: the OLD side carries its own citation and checked date (Burgess 2017, 10 Nov 2026)', m.was && /Burgess SD, Muirhead JD, Bowring SA \(2017\)/.test(m.was) && /checked 10 Nov 2026/.test(m.was) && !/Fixture A/.test(m.was), m.was);
      ok('H: the NEW side carries its own citation and checked date (fixture source, 30 Nov 2026)', m.now && /Fixture A, Fixture B \(2026\)/.test(m.now) && /checked 30 Nov 2026/.test(m.now) && !/Burgess/.test(m.now), m.now);
      ok('H: the entry keeps the earlier value visible, labelled with the revision that showed it, with its old source', m.earlier && m.earlier.includes('Earlier dating') && m.earlier.includes('Shown in revision tl-2026-11-R2: ' + prev.when_text) && /Burgess SD/.test(m.earlier) && !/Fixture A/.test(m.earlier), m.earlier);
      ok('H: the entry now shows the new value and source; its line says what changed', m.cur === NEWTXT && /Fixture A/.test(m.curSrc) && m.rev === `Evidence last reviewed: 30 Nov 2026 · Changed in revision ${FX}: date revised`, [m.cur, m.rev]);
      ok('H: three releases listed, newest first', m.heads.length === 3 && /^1 Dec 2026 — revision tl-2026-12-T1$/.test(m.heads[0]) && /tl-2026-11-R2$/.test(m.heads[1]), m.heads);
      await c.close();
      // and the page script accepts the fixture catalogue (mark drawn from the new value)
      c = await ctx({ html: f.html.replace(/timeline\.js\?v=\d+/, 'timeline.js?v=202611301000'), hub: r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: f.cat }) }); p = await c.newPage();
      await p.goto(BASE + '/timeline.html'); await settle(p); const a = await axis(p);
      ok('H: the page script validates the fixture catalogue and draws the axis', a.state === 'on' && a.marks === 5 && /251\.902/.test(await p.evaluate(() => document.querySelector('#axis a.mk[data-entry="e-big5-end-permian"]').getAttribute('aria-label'))), a);
      await c.close();
    }
  }

  await b.close();
  console.log(`timeline-changes-ui: ${pass} pass, ${fail} fail${BREAK ? ' (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
