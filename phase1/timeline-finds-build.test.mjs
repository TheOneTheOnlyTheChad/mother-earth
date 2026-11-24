/*
 * Timeline dated finds, build level (docs/concepts/TIMELINE-HUMAN-RELATIVES-BUILD-PROPOSAL.md rev 1; GPT's review of 24 Nov 2026).
 * No browser. The real generator on the rehearsal source phase1/timeline/rehearsal-finds/ (tl-2026-11-T2, schema 4, never
 * published); every refusal by fixture; controls that the released page and catalogue are untouched.
 * Run: node phase1/timeline-finds-build.test.mjs
 * Breaks (the generator is run from a patched copy held in memory; no file in the repository changes):
 *   BREAK=no-find-checks | ban-sources | midpoint | pm-dropped | fifth-allowed | finds-at-schema-3
 *   rev 2: notation-unchecked | words-unchecked | record-unchecked | clock-in-catalogue
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..'), TL = path.join(HERE, 'timeline'), RH = path.join(TL, 'rehearsal-finds');
const GEN = path.join(TL, 'build_timeline.py'), BREAK = process.env.BREAK || '';
const sha = b => createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (info !== undefined ? '  → ' + JSON.stringify(info).slice(0, 500) : '')); } };
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const REV = 'tl-2026-11-T2', R3 = 'tl-2026-11-R3', R3_SHA = 'f1a5fab2', NOTE = 'Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact.';
const PATCH = { '': null,
  'no-find-checks': ["    finds = [x for x in cat['entries'] if x['lane'] == 'relatives']\n", "    return\n"],
  'ban-sources': ["        if FIND_TITLE_BAN.search(x['title']) or FIND_TITLE_BAN.search(x['short']):", "        if FIND_TITLE_BAN.search(json.dumps(FINDS['sources'])) or FIND_TITLE_BAN.search(x['title']) or FIND_TITLE_BAN.search(x['short']):"],
  'midpoint': ["        return f\"{years(w['from_ma'])} to {years(w['to_ma'])} years ago\"", "        return f\"about {years((w['from_ma'] + w['to_ma']) / 2)} years ago\""],
  'pm-dropped': ["        return f\"the layer is dated {years(w['ref_ma'])} ± {years(w['ref_pm'])} years ago ({w['sigma']}σ); older limit unknown\"", "        return f\"the layer is dated {years(w['ref_ma'])} years ago; older limit unknown\""],
  'fifth-allowed': ['FIND_MAX = 4 ', 'FIND_MAX = 9 '],
  'notation-unchecked': ["        bad_n = notation_bad(a['source_notation'], w, sv)\n", "        bad_n = None\n"],
  'words-unchecked': ["        if any(y not in a['text'] for y in say):", "        if False:"],
  'record-unchecked': ["        if len(rows) != 1: no(f'{i}: result {r} is not listed once in its evidence record')\n        if f\"`{a['source_notation']}`\" not in rows[0]:", "        if False:"],
  'clock-in-catalogue': ["        out['find_note'] = FIND_NOTE", "        out['find_note'] = FIND_NOTE; out['axis_convention'] += ' ' + __import__('time').strftime('%Y')"],
  'finds-at-schema-3': ["FINDS = json.loads((TL / 'finds.json').read_text(encoding='utf-8')) if SCHEMA >= 4 else None", "FINDS = json.loads((TL / 'finds.json').read_text(encoding='utf-8')) if (TL / 'finds.json').exists() else None\nSCHEMA = 4 if FINDS else SCHEMA"] };
if (!(BREAK in PATCH)) throw new Error('unknown BREAK ' + BREAK);
const RUNNER = `import sys, os\nif os.environ.get('FAKE_T'):\n    import time, datetime as _dt\n    _T = float(os.environ['FAKE_T'])\n    time.time = lambda: _T\n    _lt = time.localtime; time.localtime = lambda s=None: _lt(_T if s is None else s)\n    _gt = time.gmtime; time.gmtime = lambda s=None: _gt(_T if s is None else s)\n    _st = time.strftime; time.strftime = lambda f, t=None: _st(f, _gt(_T) if t is None else t)\n    class _FD(_dt.datetime):\n        @classmethod\n        def now(cls, tz=None): return cls.fromtimestamp(_T, tz)\n        @classmethod\n        def utcnow(cls): return cls.utcfromtimestamp(_T)\n    class _FDa(_dt.date):\n        @classmethod\n        def today(cls): return cls.fromtimestamp(_T)\n    _dt.datetime = _FD; _dt.date = _FDa\nP, a, b = sys.argv[1], sys.argv[2], sys.argv[3]\ns = open(P, encoding='utf-8').read()\nif a:\n    assert s.count(a) == 1, 'break anchor missing'\n    s = s.replace(a, b)\nsys.argv = [P] + sys.argv[4:]\nexec(compile(s, P, 'exec'), {'__name__': '__main__', '__file__': P})\n`;
const gen = (args, fakeT) => { const [a, b] = PATCH[BREAK] || ['', '']; const r = spawnSync('python3', ['-c', RUNNER, GEN, a, b, ...args], { encoding: 'utf8', env: { ...process.env, ...(fakeT ? { FAKE_T: String(fakeT) } : {}) } }); return { code: r.status, out: (r.stdout + r.stderr).trim() }; };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-finds-build-'));
let n = 0;
/** A complete source folder: the released sources, with the rehearsal's own files over them, then `change(dir)`. */
function source(change, { rehearsal = true } = {}) {
  const dir = path.join(TMP, 's' + (++n)), src = path.join(dir, 'src');
  fs.mkdirSync(path.join(src, 'catalogue'), { recursive: true }); fs.mkdirSync(path.join(src, 'assets'), { recursive: true });
  for (const f of ['chart-v2026-06.5.json', 'entry-pliny-ep-6-16.json', 'big5.json', 'changes.json', 'BUILD.json']) fs.copyFileSync(path.join(TL, f), path.join(src, f));
  for (const f of fs.readdirSync(path.join(TL, 'catalogue'))) fs.copyFileSync(path.join(TL, 'catalogue', f), path.join(src, 'catalogue', f));
  for (const f of fs.readdirSync(path.join(TL, 'assets'))) fs.copyFileSync(path.join(TL, 'assets', f), path.join(src, 'assets', f));
  if (rehearsal) for (const f of fs.readdirSync(RH)) fs.copyFileSync(path.join(RH, f), path.join(src, f));
  if (change) change(src);
  const page = path.join(dir, 'timeline.html'); fs.copyFileSync(path.join(ROOT, 'timeline.html'), page);
  return { src, page };
}
const run = (change, o, fakeT) => { const s = source(change, o); const r = gen(['--src', s.src, '--page', s.page], fakeT); return { ...s, ...r, html: fs.readFileSync(s.page, 'utf8'), cat: r.code === 0 ? (f => fs.existsSync(f) ? fs.readFileSync(f) : null)(path.join(s.src, 'catalogue', J(path.join(s.src, 'BUILD.json')).catalogue_revision + '.json')) : null }; };
const edit = (f, fn) => src => { const p = path.join(src, f), o = J(p); fn(o); fs.writeFileSync(p, JSON.stringify(o, null, 1) + '\n'); };
const finds = fn => edit('finds.json', fn);
const AX = (o, i) => o.finds[i].claims.find(k => k.axis);

// ---------- A. the released page and catalogue, by this generator, are what main has
{ const r = gen(['--check']);
  ok(`A the released sources still give the released page and catalogue (${R3}, sha256 ${R3_SHA}…) with this generator`, r.code === 0 && r.out.includes(`${R3}.json (sha256 ${R3_SHA}`), r.out);
  const m = run(null, { rehearsal: false }), live = fs.readFileSync(path.join(TL, 'catalogue', R3 + '.json'));
  ok('A a fresh build from the released sources is byte-identical to the committed R3 catalogue and to the committed page', m.code === 0 && m.cat && Buffer.compare(m.cat, live) === 0 && m.html === fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8'), [m.code, m.out]);
  const f = run(src => fs.copyFileSync(path.join(RH, 'finds.json'), path.join(src, 'finds.json')), { rehearsal: false });
  ok('A a finds file beside schema-3 sources changes nothing: the same R3 bytes and the same page', f.code === 0 && f.cat && Buffer.compare(f.cat, live) === 0 && f.html === m.html && !/id="finds"/.test(f.html), [f.code, f.out]);
  ok('A the rehearsal folder holds no file of the released revision and nothing under assets/timeline or the published catalogue folder names T2', !fs.existsSync(path.join(TL, 'catalogue', REV + '.json')) && !fs.existsSync(path.join(ROOT, 'assets/timeline', REV)) && !fs.readFileSync(path.join(ROOT, 'timeline.html'), 'utf8').includes(REV) && !fs.readFileSync(path.join(ROOT, 'phase1/worker.js'), 'utf8').includes(REV)); }

// ---------- B. the rehearsal builds, and says what the source file says
const G = run(null); const SRC = J(path.join(RH, 'finds.json'));
ok(`B the rehearsal source builds (${G.out.split('\n').pop()})`, G.code === 0 && !!G.cat, G.out);
if (G.cat) {
  const c = JSON.parse(G.cat), fe = c.entries.filter(e => e.lane === 'relatives'), ex = c.entries.filter(e => e.lane === 'extinctions');
  ok(`B catalogue ${REV}, schema 4, previous ${R3}; five extinctions and four finds`, c.schema === 4 && c.catalogue_revision === REV && c.release.previous === R3 && ex.length === 5 && fe.length === 4, [c.schema, c.catalogue_revision, ex.length, fe.length]);
  const r3 = J(path.join(TL, 'catalogue', R3 + '.json'));
  ok('B the five extinction entries are, field for field, the ones R3 serves', JSON.stringify(ex) === JSON.stringify(r3.entries), null);
  ok('B the lane sentence and the axis convention are in the catalogue', c.find_note === NOTE && typeof c.axis_convention === 'string' && /count back from 1950 CE/.test(c.axis_convention) && /not claimed to be 1950/.test(c.axis_convention) && /No age is ever recomputed from today's date/.test(c.axis_convention), c.axis_convention);
  const wt = fe.map(e => e.claims.find(k => k.axis).when_text);
  ok('B each axis claim reads as its source states it: two ends, a limit with its ± and sigma, a calibrated range with its datum and probability', JSON.stringify(wt) === JSON.stringify(['335,000 to 236,000 years ago', 'the layer is dated 233,000 ± 22,000 years ago (2σ); older limit unknown', '48,000 to 32,000 years ago', '41,700 to 40,800 calibrated years before 1950 (95.4 % range)']), wt);
  ok('B no midpoint and no single "about" age for a bracket or a limit anywhere in the finds', !/285,500|40,000|41,250|\babout [\d,]+ (thousand |million )?years/i.test(JSON.stringify(fe.map(e => [e.title, e.claims.map(k => [k.when_text, k.text])]))));
  ok('B every find keeps its claims in the source file\'s order, with the notation, units, values, confidence and calibration untouched', fe.every((e, i) => JSON.stringify(e.claims.map(k => [k.id, k.claim_type, k.text, k.source_notation, k.source_units, k.source_values, k.confidence, k.calibration])) === JSON.stringify(SRC.finds[i].claims.map(k => [k.id, k.claim_type, k.text, k.source_notation, k.source_units, k.source_values, k.confidence, k.calibration]))));
  ok('B attribution, place and the two outside identifiers are carried as given; none is used as a name', fe.every((e, i) => JSON.stringify([e.find, e.attributed_to, e.links]) === JSON.stringify([SRC.finds[i].find, SRC.finds[i].attributed_to, SRC.finds[i].links])) && !/Q\d{5,}/.test(G.html.slice(G.html.indexOf('TIMELINE:BEGIN')).replace(/data-[a-z-]+="[^"]*"/g, '')));
  ok('B "Homo longi" appears nowhere in the catalogue or the page (the paper\'s own wording, "Denisovan lineage", is used)', !/longi/i.test(G.cat.toString() + G.html));
  ok('B the catalogue carries no private path, inbox id or folder of the Mac packet', !/timeline-inbox|tl-in-\d|\/users\/|timeline-human-relatives\/2026|_review\//i.test(G.cat.toString()));
  const page = G.html;
  ok('B the page has the finds section with the lane sentence, four cards and four entries, and pins this catalogue\'s hash', page.includes(`id="finds-note"`) && page.includes(NOTE) && (page.match(/class="card ep find"/g) || []).length === 4 && (page.match(/<article class="entry ep find"/g) || []).length === 4 && page.includes(`data-catalogue-sha="${sha(G.cat)}"`) && page.includes('data-catalogue-schema="4"'), null);
  ok('B the check mode agrees with what was just written', gen(['--src', G.src, '--page', G.page, '--check']).code === 0);
  ok('B a second build from the same sources is byte-identical', (() => { const g2 = run(null); return g2.cat && Buffer.compare(g2.cat, G.cat) === 0 && g2.html === G.html; })());
}

ok('B a source whose own title has the word "oldest" (Vidal et al. 2022) is accepted: the wording rules read our text, not citations', G.code === 0 && /Age of the oldest known Homo sapiens/.test(String(G.cat || '')));

// ---------- C. refusals, each by a fixture that changes one thing
const REFUSE = [
  ['a fifth find (one sub-row each; never clustered)', finds(o => { const f = JSON.parse(JSON.stringify(o.finds[0])); f.id = 'f-extra-one'; o.finds.push(f); }), /at most 4/],
  ['schema 4 with no find', src => { finds(o => { o.finds = []; })(src); edit('changes.json', o => { o.changes.pop(); })(src); }, /no find|names no|change|release/],
  ['a find title with a comparative word ("The oldest …")', finds(o => { o.finds[1].title = 'The oldest Homo sapiens, Omo-Kibish Formation, Ethiopia'; }), /comparative word/],
  ['a short title with "first"', finds(o => { o.finds[0].short = 'First Dinaledi'; }), /comparative word/],
  ['our text saying a group "died out"', finds(o => { o.finds[3].claims[1].text += ' Neandertals died out soon after.'; }), /never makes/],
  ['our text saying two groups "met"', finds(o => { o.finds[2].claims.at(-1).text += ' The two groups met here.'; }), /never makes/],
  ['our text saying "evolved into"', finds(o => { o.finds[0].claims.at(-1).text += ' It evolved into later forms.'; }), /never makes/],
  ['a find with no site', finds(o => { o.finds[0].find.site = ''; }), /site, place or context/],
  ['a find with no place', finds(o => { delete o.finds[2].find.where; }), /site, place or context/],
  ['a find with no attribution basis', finds(o => { delete o.finds[1].attributed_to.basis; }), /attribution name or basis/],
  ['an attribution basis this build does not know', finds(o => { o.finds[1].attributed_to.basis = 'tools'; }), /attribution name or basis/],
  ['a group identifier substituted for the specimen', finds(o => { o.finds[1].find.specimen = o.finds[1].links.group; }), /not a specimen id/],
  ['a link that is not an identifier', finds(o => { o.finds[1].links.group = 'Homo sapiens'; }), /links/],
  ['two axis claims', finds(o => { o.finds[0].claims.push({ ...AX(o, 0), id: 'd9' }); }), /exactly one axis claim/],
  ['no axis claim', finds(o => { delete AX(o, 0).axis; }), /exactly one axis claim/],
  ['a bracket claim carrying a limit', finds(o => { AX(o, 0).when = { type: 'limit', ref_ma: 0.3, ref_pm: 0.01, sigma: 2, side: 'older' }; }), /needs a interval date/],
  ['a limit with its ± dropped', finds(o => { delete AX(o, 1).when.ref_pm; }), /limit (fields|reference)|malformed find date/],
  ['a limit with a zero ±', finds(o => { AX(o, 1).when.ref_pm = 0; }), /limit reference or uncertainty/],
  ['a limit given an invented older end', finds(o => { AX(o, 1).when.from_ma = 0.3; }), /limit fields/],
  ['a limit pointing the newer way', finds(o => { AX(o, 1).when.side = 'younger'; }), /limit side/],
  ['a limit with a sigma of 3', finds(o => { AX(o, 1).when.sigma = 3; }), /limit sigma/],
  ['a limit whose ± leaves the chart', finds(o => { AX(o, 1).when.ref_pm = 0.3; AX(o, 1).source_values.pm = 300; }), /leaves the chart/],
  ['a bracket with reversed ends', finds(o => { const w = AX(o, 2).when; [w.from_ma, w.to_ma] = [w.to_ma, w.from_ma]; }), /bracket ends/],
  ['a bracket end that is text', finds(o => { AX(o, 2).when.from_ma = '0.048'; }), /bracket ends|malformed find date/],
  ['a bracket with an extra field', finds(o => { AX(o, 2).when.mid_ma = 0.04; }), /only its two ends|unknown date field/],
  ['stored ages that are not the source values', finds(o => { AX(o, 0).when.to_ma = 0.241; }), /differ from the source values/],
  ['a source unit this build does not know', finds(o => { AX(o, 0).source_units = 'Ma'; AX(o, 0).source_values.unit = 'Ma'; }), /source units/],
  ['a date with no source notation', finds(o => { delete AX(o, 2).source_notation; }), /notation, units or confidence/],
  ['a date with no stated confidence', finds(o => { AX(o, 0).confidence = ''; }), /notation, units or confidence/],
  ['a calibrated date counted from this year', finds(o => { AX(o, 3).when.datum_ce = 2026; }), /count from 1950/],
  ['calibrated ends beside uncalibrated units (mixed endpoints)', finds(o => { AX(o, 3).source_units = 'ka'; AX(o, 3).source_values.unit = 'ka'; }), /count from 1950/],
  ['a calibration curve this build does not know', finds(o => { AX(o, 3).when.curve = 'IntCal13'; }), /calibration curve/],
  ['a probability that is not the notation\'s', finds(o => { AX(o, 3).when.probability = 68.2; }), /probability/],
  ['a calibrated date with no laboratory number', finds(o => { AX(o, 3).when.lab_id = ''; }), /laboratory measurement/],
  ['a find with no "what was dated"', finds(o => { o.finds[2].claims = o.finds[2].claims.filter(k => k.claim_type !== 'dated_material'); }), /exactly one dated_material/],
  ['a find with two association claims', finds(o => { const k = o.finds[2].claims.find(k => k.claim_type === 'find_association'); o.finds[2].claims.push({ ...k, id: 'x9' }); }), /exactly one find_association/],
  ['a find claim with no source', finds(o => { delete o.finds[0].claims[1].source; }), /no source or locator|KeyError|source/],
  ['a claim type that is not a find\'s', finds(o => { o.finds[0].claims[1].claim_type = 'extinction_cause'; }), /is not a find's|claim/],
  ['a find id that does not start with f-', finds(o => { o.finds[0].id = 'e-dinaledi'; }), /starts with f-|unknown entry/],
  ['an evidence record that is a private path', finds(o => { o.finds[0].evidence_reviewed.records = ['research/timeline-human-relatives/2026-11-24-claude/REPORT.md']; }), /not a file in the public repo|private reference/],
  ['a source checked after the release day', finds(o => { o.sources.dirks2017.checked = '2026-12-01'; o.sources.dirks2017.status = o.sources.dirks2017.status.replace('24 Nov 2026', '1 Dec 2026'); }), /after the release day/],
  ['a change record that names a find the catalogue does not have', edit('changes.json', o => { o.changes.at(-1).entries.push('f-not-there'); }), /unknown entry/],
  // rev 2: one selected published result (GPT's reproduction first, exactly as GPT made it at source level)
  ['a calibrated range with one end taken from another published calculation (GPT\'s reproduction: 41,700 to 40,827)', finds(o => { AX(o, 3).when.to_ma = 0.040827; AX(o, 3).source_values.to = 40.827; }), /notation and stored values disagree/],
  ['notation and values changed together, the claim\'s own words not', finds(o => { const a = AX(o, 3); a.when.to_ma = 0.0407; a.source_values.to = 40.7; a.source_notation = a.source_notation.replace('40.8', '40.7'); }), /own words do not give the stored numbers/],
  ['notation, values and words all changed to a mixed result: not the result the evidence record lists', finds(o => { const a = AX(o, 3); a.when.to_ma = 0.040827; a.source_values.to = 40.827; a.source_notation = '41.7–40.827 ka cal BP (95.4%)'; a.text = a.text.replace('40,800', '40,827'); }), /not the one its evidence record lists for C7\.r1/],
  ['an axis claim naming no selected result', finds(o => { delete AX(o, 0).result; }), /names no selected result/],
  ['a result id the evidence record does not list', finds(o => { AX(o, 2).result = 'C3.r9'; }), /not listed once in its evidence record/],
  ['two finds naming one result', finds(o => { AX(o, 2).result = 'C1.r1'; }), /not the one its evidence record lists for C1\.r1/],
  ['a limit written without its ±', finds(o => { AX(o, 1).source_notation = '233 kyr'; }), /written as a value ± its uncertainty/],
  ['a bracket given a probability', finds(o => { AX(o, 0).source_notation = 'between 236 ka and 335 ka (95%)'; }), /carries no probability|evidence record/],
  ['a published-style revision id on a finds build with no release record', edit('BUILD.json', o => { o.catalogue_revision = 'tl-2026-11-R4'; }), /last release is not this build|refused/],
];
{ const c = run(finds(o => { o.note = (o.note || '') + ' '; })); ok('C control: a fixture that changes nothing of substance still builds', c.code === 0, c.out); }
for (const [name, change, want] of REFUSE) { const r = run(change);
  ok(`C refused: ${name}`, r.code !== 0 && want.test(r.out) && !fs.existsSync(path.join(r.src, 'catalogue', REV + '.json')), [r.code, r.out.slice(-200)]); }

// ---------- D. controls: fewer finds build the same way; the device clock changes no byte
const drop = keep => src => { finds(o => { o.finds = o.finds.filter(f => keep.includes(f.id)); })(src); edit('changes.json', o => { for (const c of o.changes) if (c.entries) c.entries = c.entries.filter(i => !i.startsWith('f-') || keep.includes(i)); })(src); };
for (const keep of [['f-dinaledi-chamber', 'f-omo-1', 'f-xiahe-2'], ['f-omo-1']]) { const r = run(drop(keep));
  const c = r.cat ? JSON.parse(r.cat) : null;
  ok(`D control: ${keep.length} find${keep.length > 1 ? 's' : ''} build, with the same lane, the same checks and ${keep.length} entr${keep.length > 1 ? 'ies' : 'y'} on it`, r.code === 0 && !!c && c.entries.filter(e => e.lane === 'relatives').map(e => e.id).join() === keep.join() && (r.html.match(/<article class="entry ep find"/g) || []).length === keep.length, [r.code, r.out.slice(-200)]); }
{ const t1 = Date.UTC(1990, 5, 1) / 1000, t2 = Date.UTC(2090, 5, 1) / 1000, a = run(null, {}, t1), b = run(null, {}, t2);
  const yr = gen(['--src', a.src, '--page', a.page, '--check'], t2);
  ok('D the device clock at 1990 and at 2090 gives byte-identical catalogues and pages; the check mode agrees across the two clocks', a.code === 0 && b.code === 0 && a.cat && b.cat && Buffer.compare(a.cat, b.cat) === 0 && a.html === b.html && yr.code === 0, [a.code, b.code, a.cat && sha(a.cat), b.cat && sha(b.cat), yr.out.slice(-160)]);
  const probe = spawnSync('python3', ['-c', RUNNER.split('P, a, b =')[0] + "import time, datetime\nprint(time.strftime('%Y'), datetime.datetime.now().year, datetime.date.today().year)"], { encoding: 'utf8', env: { ...process.env, FAKE_T: String(t2) } });
  ok('D the fake clock itself works (2090 seen by time and datetime)', probe.stdout.trim() === '2090 2090 2090', probe.stdout + probe.stderr); }

console.log(`timeline-finds-build: ${pass} pass, ${fail} fail` + (BREAK ? ` (BREAK=${BREAK})` : ''));
process.exit(fail ? 1 : 0);
