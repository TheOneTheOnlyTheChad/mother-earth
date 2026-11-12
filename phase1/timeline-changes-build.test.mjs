/* Mother Earth — Timeline "What changed" and evidence-last-reviewed, generator side
 * (TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1 §3.2–§3.5, §4, §6). Nothing networked.
 *
 * The real build is checked as committed. Rule tests run the REAL generator on a copy of its source folder in a temp
 * directory (--src, --page), so nothing in the repo is written. Fixtures built here are never published.
 *
 * Run:    node --no-warnings phase1/timeline-changes-build.test.mjs
 * Breaks: BREAK=date-after-release | orphan-change | review-derived-from-sources | r1-mutated | inbox-allowed |
 *               private-record-allowed | after-unchecked | previous-unchecked
 *         — each runs a weakened generator (or, for r1-mutated, a changed copy of the frozen file); the suite must FAIL on every one.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..'), TL = path.join(HERE, 'timeline');
const GEN = path.join(TL, 'build_timeline.py');
const B = process.env.BREAK || '';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };

// ---- generator source, optionally weakened
const GEN_SRC = fs.readFileSync(GEN, 'utf8');
const BREAKS = {
  'date-after-release': [["        if er['date'] > day: no(", "        if False: no("], ["                if s['checked'] > day: no(", "                if False: no("]],
  'orphan-change': [["        if not c.get('entries') or any(i not in ids for i in c['entries']): no(", "        if False: no("]],
  'review-derived-from-sources': [["    return f'<p class=\"rev\" id=\"{i}-rev\">Evidence last reviewed: {tdate(er[\"date\"])}{ch}</p>'",
    "    return f'<p class=\"rev\" id=\"{i}-rev\">Evidence last reviewed: {tdate(max([s[\"checked\"] for s in BIG5[\"sources\"].values()] + [er[\"date\"]]))}{ch}</p>'"]],
  'inbox-allowed': [["        if 'inbox' in c: no(", "        if False: no("], ["    for bad in (r'tl-in-\\d', r'timeline-inbox/',", "    for bad in ("]],
  'private-record-allowed': [["            if r.startswith(('/', '~', 'research/')) or '..' in r or not (ROOT / r).is_file(): no(", "            if False: no("], ["r'(?<!docs/)research/', ", ""]],
  'after-unchecked': [["                    if (c['after']['label'], c['after']['text']) != (cl['label'], cl['text']): no(", "                    if False: no("],
    ["                    if (c['before']['label'], c['before']['text']) != (pc['label'], pc['text']): no(", "                    if False: no("]],
  'previous-unchecked': [["    if rel['previous'] != (rels[-2]['revision'] if len(rels) > 1 else None): no(", "    if False: no("]],
};
let genSrc = GEN_SRC;
if (B && BREAKS[B]) for (const [a, b] of BREAKS[B]) { if (!genSrc.includes(a)) throw new Error('break anchor missing: ' + B + ' :: ' + a.slice(0, 50)); genSrc = genSrc.replace(a, b); }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-chg-'));
const genFile = path.join(TMP, 'gen-src.py'); fs.writeFileSync(genFile, genSrc);
// run the (possibly weakened) generator as if it were the real file, so its ROOT is the repo
const RUNNER = `import sys\nsrc=open(${JSON.stringify(genFile)},encoding='utf-8').read()\nreal=${JSON.stringify(GEN)}\nsys.argv=[real]+sys.argv[1:]\nexec(compile(src,real,'exec'),{'__name__':'__main__','__file__':real})`;
const gen = args => { const r = spawnSync('python3', ['-c', RUNNER, ...args], { encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };

// a private copy of the source folder; `edit` mutates it; returns {dir, page, run()}
let n = 0;
function fixture(edit) {
  const dir = path.join(TMP, 'fx' + (++n)); fs.mkdirSync(path.join(dir, 'catalogue'), { recursive: true });
  for (const f of ['BUILD.json', 'big5.json', 'changes.json', 'chart-v2026-06.5.json', 'entry-pliny-ep-6-16.json']) fs.copyFileSync(path.join(TL, f), path.join(dir, f));
  fs.copyFileSync(path.join(TL, 'catalogue/tl-2026-11-R1.json'), path.join(dir, 'catalogue/tl-2026-11-R1.json'));
  const page = path.join(dir, 'timeline.html'); fs.copyFileSync(path.join(ROOT, 'timeline.html'), page);
  const J = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), W = (f, o) => fs.writeFileSync(path.join(dir, f), JSON.stringify(o, null, 1) + '\n');
  if (edit) edit({ J, W, dir });
  return { dir, page, run: () => gen(['--src', dir, '--page', page]), cat: () => JSON.parse(fs.readFileSync(path.join(dir, 'catalogue', J('BUILD.json').catalogue_revision + '.json'), 'utf8')), html: () => fs.readFileSync(page, 'utf8') };
}
const refused = (name, edit, why) => { const f = fixture(edit); const r = f.run(); ok(`refused: ${name}`, r.code !== 0 && /refused: /.test(r.out) && why.test(r.out), r.out.trim().slice(-200)); };

// =====================================================================================================================
// 1. the committed build
const R1_SHA = '096ae648479b744f458cdf5d042667c6a6262114ee63252cf132c41f99050fbe', R1_BYTES = 15656;
let r1 = fs.readFileSync(path.join(TL, 'catalogue/tl-2026-11-R1.json'));
if (B === 'r1-mutated') r1 = Buffer.from(r1.toString('utf8').replace('201.5', '201.6'));
ok('R1 frozen: the committed tl-2026-11-R1.json equals its published pin (literal sha256 and size)', sha(r1) === R1_SHA && r1.length === R1_BYTES, [sha(r1), r1.length]);
const chk = spawnSync('python3', [GEN, '--check'], { encoding: 'utf8' });
ok('generator --check passes on the committed page, catalogue and script build', chk.status === 0, (chk.stdout + chk.stderr).trim());
const BUILD = JSON.parse(fs.readFileSync(path.join(TL, 'BUILD.json'), 'utf8'));
const catBytes = fs.readFileSync(path.join(TL, 'catalogue', BUILD.catalogue_revision + '.json')), C = JSON.parse(catBytes), P = JSON.parse(r1);
const page = fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8'), js = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8');
ok('R2: schema 2, revision tl-2026-11-R2, previous = R1 (the last reader-facing release)', C.schema === 2 && C.catalogue_revision === 'tl-2026-11-R2' && C.release.revision === 'tl-2026-11-R2' && C.release.previous === 'tl-2026-11-R1', C.release);
ok('R2: releases = R1 (10 Nov 2026, first release) then R2', C.releases.length === 2 && C.releases[0].revision === 'tl-2026-11-R1' && C.releases[0].release_date === '2026-11-10' && C.releases[1].revision === 'tl-2026-11-R2' && C.releases[1].release_date === C.release.release_date, C.releases);
const byId = Object.fromEntries([...C.entries, ...C.shelf].map(e => [e.id, e]));
ok('evidence last reviewed: Big Five 10 Nov 2026, Pliny 9 Nov 2026 (explicit, with public records)', C.entries.length === 5 && C.entries.every(e => e.evidence_reviewed.date === '2026-11-10') && byId['e-pliny-ep-6-16'].evidence_reviewed.date === '2026-11-09'
  && Object.values(byId).every(e => e.evidence_reviewed.records.length && e.evidence_reviewed.records.every(r => fs.existsSync(path.join(ROOT, r)))), Object.values(byId).map(e => [e.id, e.evidence_reviewed]));
ok('source checked dates are untouched by the release (all still 10 Nov 2026)', C.entries.every(e => e.claims.every(k => !k.source || k.source.checked === '2026-11-10')));
ok('change records: R1-1, R1-2 (added) and R2-1 (revised wording), in that order', C.changes.map(c => `${c.id}:${c.kind}:${c.what}`).join() === 'tl-2026-11-R1-1:added:entries,tl-2026-11-R1-2:added:catalogue,tl-2026-11-R2-1:revised:wording', C.changes.map(c => c.id));
ok('only the End-Triassic entry lists a revision', Object.values(byId).filter(e => e.revisions.length).map(e => e.id + '=' + e.revisions.join()).join() === 'e-big5-end-triassic=tl-2026-11-R2-1');
// the approved wording (review snapshot 1, option A)
const LABEL = 'Approximate age of the extinction level in the rock record';
const TEXT = 'In each of the three sections studied, a large sulfur-isotope shift about 201.5 million years ago coincides with the level in the rock record that marks the extinction.';
const tri = byId['e-big5-end-triassic'].claims.find(k => k.claim_type === 'extinction_horizon_approx');
ok('approved label in the catalogue (claim and claim_labels)', tri.label === LABEL && C.claim_labels.extinction_horizon_approx === LABEL, [tri.label]);
ok('approved claim text (option A) in the catalogue', tri.text === TEXT, tri.text);
ok('approved label in the axis labels (timeline.js) and nowhere the old one', js.includes(`extinction_horizon_approx: '${LABEL}'`) && !js.includes('extinction horizon'));
ok('the old wording survives only inside the change record', (catBytes.toString('utf8').match(/extinction horizon/g) || []).length === 2 && C.changes[2].before.label === 'Approximate age of the extinction horizon');
ok('value and its approximate status unchanged', tri.when.ma === 201.5 && tri.when.type === 'approx_point' && tri.when_text === '~201.5 Ma (approximate, as stated)');
// R1 -> R2: nothing else moved
const strip = c => { const o = JSON.parse(JSON.stringify(c)); delete o.schema; delete o.catalogue_revision; delete o.generated_at; delete o.release; delete o.releases; delete o.changes;
  delete o.claim_labels.extinction_horizon_approx;
  for (const e of [...o.entries, ...o.shelf]) { delete e.evidence_reviewed; delete e.revisions; for (const k of e.claims || []) if (k.claim_type === 'extinction_horizon_approx') { delete k.label; delete k.text; } }
  return JSON.stringify(o); };
ok('R1 → R2: apart from the new fields and that one label and text, the catalogue is identical (no date, source, lane or mark moved)', strip(C) === strip(P));
// page
const EXPECT_REC = `<b>Wording clarified: End-Triassic mass extinction.</b> The label "Approximate age of the extinction horizon" now reads "${LABEL}", with the matching change in the entry text. Why: plainer wording for a general reader. Dates, sources and the mark on the axis are unchanged. The entry's evidence was last reviewed <time datetime="2026-11-10">10 Nov 2026</time>.`;
ok('page: the approved public change record, word for word', page.includes(EXPECT_REC));
ok('page: the approved entry line, word for word', page.includes('Evidence last reviewed: <time datetime="2026-11-10">10 Nov 2026</time> · Changed in revision tl-2026-11-R2: <a class="chg" id="e-big5-end-triassic-chg-tl-2026-11-R2-1" href="#change-tl-2026-11-R2-1" data-change="change-tl-2026-11-R2-1">wording clarified</a>'));
ok('page: "Timeline page updated" carries the release date and revision', new RegExp(`Timeline page updated <time datetime="${C.release.release_date}">[^<]+</time> · revision tl-2026-11-R2 · <a id="tl-changes-link" href="#changes">What changed</a>`).test(page));
// privacy: inbox fields and private paths stay out of shipped data and pages
for (const [name, text] of [['catalogue', catBytes.toString('utf8')], ['timeline.html', page], ['timeline.js', js], ['changes.json', fs.readFileSync(path.join(TL, 'changes.json'), 'utf8')]])
  ok(`privacy: no inbox id, inbox path or private path in ${name}`, !/TL-IN-\d|timeline-inbox\/|"inbox"|(?<!docs\/)research\/|_review\/|\/Users\/|_to_delete/i.test(text));
// asset versions
const R1_JS_V = '202611221000', v = (page.match(/timeline\.js\?v=(\d+)/) || [])[1];
ok('asset version: timeline.js ?v= is new, equals the page build id and the script BUILD', v && v !== R1_JS_V && page.includes(`data-build="${v}"`) && js.includes(`const BUILD = '${v}';`), v);
{ // loosened for dustrgb-rc: a later release bumps style.css again, so pin "same on all three pages, and not older than this build" rather than "equal to this build"
  const sv = ['timeline.html', 'index.html', 'sources.html'].map(f => (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/style\.css\?v=(\d+)/) || [])[1]);
  ok('asset version: style.css ?v= is the same on all three pages and not older than this build', sv.every(x => x && x === sv[0]) && Number(sv[0]) >= Number(v), sv); }

// =====================================================================================================================
// 2. the unchanged fixture builds, byte-identical to the committed catalogue (the fixture mechanism itself)
{ const f = fixture(); const r = f.run(); ok('fixture mechanism: an unedited copy builds the same catalogue bytes', r.code === 0 && sha(fs.readFileSync(path.join(f.dir, 'catalogue/tl-2026-11-R2.json'))) === sha(catBytes), r.out.slice(-200)); }

// 3. refusals
const setEp = (id, fn) => ({ J, W }) => { const b = J('big5.json'); fn(b.episodes.find(e => e.id === id), b); W('big5.json', b); };
refused('an entry reviewed after the release day', setEp('e-big5-end-permian', e => { e.evidence_reviewed.date = '2026-11-13'; }), /after the release day/);
refused('a source checked after the release day', setEp('e-big5-end-permian', (e, b) => { b.sources.burgess2017.checked = '2026-11-13'; b.sources.burgess2017.status = b.sources.burgess2017.status.replace('checked 10 Nov 2026', 'checked 13 Nov 2026'); }), /after the release day/);
refused('an entry with no evidence_reviewed', setEp('e-big5-end-permian', e => { delete e.evidence_reviewed; }), /evidence_reviewed|KeyError/);
refused('an invalid review date', setEp('e-big5-end-permian', e => { e.evidence_reviewed.date = '2026-11-31'; }), /no evidence_reviewed date/);
refused('a source whose status text and checked date disagree', setEp('e-big5-end-permian', (e, b) => { b.sources.burgess2017.checked = '2026-11-11'; }), /disagree/);
refused('a change record naming an unknown entry', ({ J, W }) => { const c = J('changes.json'); c.changes[0].entries.push('e-not-there'); W('changes.json', c); }, /unknown entry/);
refused('a change record carrying an inbox field', ({ J, W }) => { const c = J('changes.json'); c.changes[2].inbox = 'TL-IN-0001'; W('changes.json', c); }, /inbox field|private reference/);
refused('an inbox id anywhere in shipped data', ({ J, W }) => { const c = J('changes.json'); c.changes[2].why += ' (TL-IN-0001)'; W('changes.json', c); }, /private reference/);
refused('an evidence record that is a private research path', setEp('e-big5-end-permian', e => { e.evidence_reviewed.records = ['research/timeline-big-five/2026-11-10-claude/report/REPORT.md']; }), /not a file in the public repo|private reference/);
refused('an evidence record that does not exist in the repo', setEp('e-big5-end-permian', e => { e.evidence_reviewed.records = ['docs/research/NOT-THERE.md']; }), /not a file in the public repo/);
refused("a wording change whose 'after' is not what the catalogue says", ({ J, W }) => { const c = J('changes.json'); c.changes[2].after.text += ' Extra.'; W('changes.json', c); }, /'after' is not what this catalogue says/);
refused("a wording change whose 'before' is not what R1 said", ({ J, W }) => { const c = J('changes.json'); c.changes[2].before.label = 'Something else'; W('changes.json', c); }, /'before' is not what tl-2026-11-R1 said/);
refused('previous naming anything but the last reader-facing release', ({ J, W }) => { const b = J('BUILD.json'); b.previous = 'tl-2026-11-R1b'; W('BUILD.json', b); }, /previous is not the last reader-facing release/);
refused('a release list that does not end with this build', ({ J, W }) => { const c = J('changes.json'); c.releases[1].release_date = '2026-11-11'; W('changes.json', c); }, /last release is not this build/);
refused('a repeated change id', ({ J, W }) => { const c = J('changes.json'); c.changes[1].id = c.changes[0].id; W('changes.json', c); }, /bad or repeated change id/);
refused('a change kind outside added / revised (withdrawals are a later delivery)', ({ J, W }) => { const c = J('changes.json'); c.changes[0].kind = 'withdrawn'; W('changes.json', c); }, /kind/);

// 4. a slip that forces a fresh id: R3 built after a staged R2 still says previous = R1 and lists no R2 release
{ const f = fixture(({ J, W }) => { const b = J('BUILD.json'); b.catalogue_revision = 'tl-2026-11-R3'; b.release_date = '2026-11-13'; W('BUILD.json', b);
    const c = J('changes.json'); c.releases[1] = { revision: 'tl-2026-11-R3', release_date: '2026-11-13' }; c.changes[2].id = 'tl-2026-11-R3-1'; c.changes[2].revision = 'tl-2026-11-R3'; W('changes.json', c); });
  const r = f.run(); const c = r.code === 0 ? f.cat() : null;
  ok('slip → new id: R3 builds with previous = R1 and no release listed for the staged R2', r.code === 0 && c.release.previous === 'tl-2026-11-R1' && c.releases.map(x => x.revision).join() === 'tl-2026-11-R1,tl-2026-11-R3' && !/tl-2026-11-R2/.test(JSON.stringify(c)), r.out.slice(-200)); }

// 5. partial re-check: one source checked AFTER the entry-wide review, both on or before the release day → accepted,
//    and the entry-wide date is NOT taken from the source
{ const f = fixture(setEp('e-big5-end-triassic', (e, b) => { b.sources.he2020.checked = '2026-11-11'; b.sources.he2020.status = b.sources.he2020.status.replace('checked 10 Nov 2026', 'checked 11 Nov 2026'); }));
  const r = f.run(); const h = r.code === 0 ? f.html() : '';
  ok('partial re-check accepted (source 11 Nov, entry-wide review 10 Nov, release 12 Nov)', r.code === 0, r.out.slice(-200));
  const art = (h.match(/<article class="entry ep" id="e-big5-end-triassic"[\s\S]*?<\/article>/) || [''])[0];
  ok('partial re-check: the entry line still shows the entry-wide date (10 Nov 2026)', /Evidence last reviewed: <time datetime="2026-11-10">10 Nov 2026<\/time>/.test(art), art.slice(-300));
  ok('partial re-check: the source line shows its own later date (11 Nov 2026)', /\(checked 11 Nov 2026\)/.test(art) && !/\(checked 10 Nov 2026\)/.test(art));
  ok('partial re-check: the change record quotes the entry-wide date, under the release heading of 12 Nov', /<time datetime="2026-11-12">12 Nov 2026<\/time> — revision tl-2026-11-R2[\s\S]*?The entry's evidence was last reviewed <time datetime="2026-11-10">10 Nov 2026<\/time>/.test(h)); }

console.log(`\ntimeline-changes-build: ${pass} passed, ${fail} failed${B ? ' [BREAK=' + B + ']' : ''}`);
process.exit(fail ? 1 : 0);
