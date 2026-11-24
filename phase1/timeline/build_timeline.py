#!/usr/bin/env python3
"""Build the Timeline catalogue and pre-render it into timeline.html (works with JavaScript off).

Usage:
  python3 phase1/timeline/build_timeline.py          # write the catalogue file and the block between the markers
  python3 phase1/timeline/build_timeline.py --check  # exit 1 if timeline.html, the catalogue file or timeline.js's BUILD differ
  ... --check --page <file>                           # check another copy (used by the tests)
  ... --src <dir> --page <file>                        # build from another source folder (test fixtures; never published)

Since catalogue schema 2 (TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1): changes.json holds the public change records;
every entry carries evidence_reviewed (the entry-wide review date, set explicitly, never derived from source dates);
BUILD.json carries release_date (the reader-facing page release day) and previous (the last reader-facing release).
The previous revision's catalogue file is read as a frozen reference and is never rewritten.

Schema 3 (TIMELINE-STORY-PROPOSAL rev 2.1): an episode may carry a `story` (an opening whose sentences each name what
supports them, typed evidence items, one image with every served rendition recorded) and explicit claim ids. Nothing of
schema 3 is written when BUILD.json says schema 2, so an earlier revision still builds byte for byte.

Deterministic: output depends only on the source JSON (chart-v2026-06.5.json, big5.json, entry-*.json, BUILD.json).
The catalogue (phase1/timeline/catalogue/<revision>.json) is the single source for the hub route /catalogue/timeline
and for the pre-rendered list; the page embeds its sha256 and the build id (= the ?v= asset version), and the script
draws the axis only when both match (TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §3–§4). Everything between
<!-- TIMELINE:BEGIN --> and <!-- TIMELINE:END --> is generated; edit the JSON, not the HTML.
"""
import hashlib, html, json, math, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / 'timeline.html'
TL = pathlib.Path(sys.argv[sys.argv.index('--src') + 1]).resolve() if '--src' in sys.argv else ROOT / 'phase1/timeline'
ENTRIES = [TL / 'entry-pliny-ep-6-16.json']
JSF = ROOT / 'timeline.js'
BUILD = json.loads((TL / 'BUILD.json').read_text(encoding='utf-8'))
CHART = json.loads((TL / 'chart-v2026-06.5.json').read_text(encoding='utf-8'))
BIG5 = json.loads((TL / 'big5.json').read_text(encoding='utf-8'))
CHANGES = json.loads((TL / 'changes.json').read_text(encoding='utf-8'))
LANES = [('earth-life', 'Earth systems and life'), ('extinctions', 'Mass extinctions'),
         ('relatives', 'Human relatives'), ('history', 'Human history')]
EMPTY = {'earth-life': 'No entries yet', 'relatives': 'No entries yet', 'history': 'No dated entries on the axis yet'}
# fixed labels per claim type (proposal rev 1.1 §3); the script refuses a catalogue whose labels differ
CLAIM_LABELS = {
    'extinction_interval_approx': 'Approximate extinction interval',
    'boundary_age_bound': 'Boundary age: no older than',
    'boundary_age_range_modelled': 'Modelled boundary-age range',
    'extinction_onset_estimate': 'Estimated extinction onset',
    'extinction_horizon_approx': 'Approximate age of the extinction level in the rock record',
    'dated_event_age': 'Impact age',
    'extinction_placement_tied': 'Extinction placed at the dated impact (synchrony evidence cited)',
    'chart_boundary': 'ICS chart boundary (v2026-06)',
    'context': 'Context',
}
SCHEMA = BUILD['schema']
STORY_LABELS = {'cause_account': 'Attributed account of the cause', 'disagreement': 'Attributed finding that qualifies or differs'}
if SCHEMA >= 3:
    CLAIM_LABELS.update(STORY_LABELS)
# schema 4: dated finds on the "Humans and human relatives" lane (TIMELINE-HUMAN-RELATIVES-BUILD-PROPOSAL rev 1; GPT 24 Nov 2026).
# One entry is one find or deposit with exactly one axis claim; nothing joins two finds. The page's script carries the same tables.
FIND_AXIS = {'find_context_bracket': 'interval', 'find_older_than_dated_layer': 'limit', 'find_direct_date_calibrated': 'calibrated'}
FIND_LABELS = {'find_context_bracket': 'Age bracket of the deposit or layer', 'find_older_than_dated_layer': 'Older than a dated layer above it',
               'find_direct_date_calibrated': 'Direct radiocarbon date, calibrated', 'dated_material': 'What was dated',
               'find_association': 'How the date relates to the find', 'reported_by': 'Reported by'}
FIND_BASIS = {'anatomy': 'by its anatomy', 'proteins': 'by its proteins', 'mitochondrial_dna': 'by its mitochondrial DNA'}
FIND_UNITS = {'ka': 1000.0, 'kyr': 1000.0, 'ka cal BP': 1000.0}     # the source's unit -> how many of it make one Ma
FIND_MAX = 4                    # one sub-row each; a fifth find is refused, not clustered (GPT)
FIND_NOTE = ('Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. '
             'Overlap in date does not establish shared place or contact.')
# our own interpretive wording only (never a source's title or citation): whole words and phrases
FIND_TITLE_BAN = re.compile(r'\b(earliest|latest|oldest|youngest|first|last)\b', re.I)
FIND_TEXT_BAN = re.compile(r'\b(first appeared|last appeared|died out|went extinct|became extinct|evolved into|evolved from|ancestor of|'
                           r'descended from|interbred|the first human|lived from|lived until|met)\b', re.I)
FINDS = json.loads((TL / 'finds.json').read_text(encoding='utf-8')) if SCHEMA >= 4 else None
if SCHEMA >= 4:
    CLAIM_LABELS.update(FIND_LABELS)
    LANES = [(i, 'Humans and human relatives' if i == 'relatives' else l) for i, l in LANES]
ASSETS = TL / 'assets'                  # image files for this source folder; hashes are checked against these bytes
IMAGE_KINDS = ('photograph', 'measured_image')      # 'reconstruction' is a defined value this slice refuses, labelled or not
MEDIA = {'image/jpeg': ('.jpg', '.jpeg'), 'image/png': ('.png',), 'image/webp': ('.webp',)}
IMAGE_BYTES_MAX = 300000                # total across an entry's shipped renditions (proposal rev 2 section 7; GPT 23 Nov)
BOUNDARY_NAMES = {'ordovician-silurian': 'Ordovician–Silurian', 'frasnian-famennian': 'Frasnian–Famennian',
                  'permian-triassic': 'Permian–Triassic', 'triassic-jurassic': 'Triassic–Jurassic',
                  'cretaceous-paleogene': 'Cretaceous–Paleogene'}
BEGIN, END = '<!-- TIMELINE:BEGIN -->', '<!-- TIMELINE:END -->'
e = lambda s: html.escape(s, quote=True)


MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def fmt_date(d):  # 2026-11-10 -> 10 Nov 2026
    y, m, dd = d.split('-')
    return f'{int(dd)} {MONTHS[int(m) - 1]} {y}'


def tdate(d):
    return f'<time datetime="{e(d)}">{e(fmt_date(d))}</time>'


def rev_line(i, er, revs, changes):
    """The entry's own line: when its evidence was last reviewed as a whole, and any revision that changed it."""
    by = {c['id']: c for c in changes}
    ch = ''.join(f' · Changed in revision {e(by[r]["revision"])}: <a class="chg" id="{i}-chg-{e(r)}" href="#change-{e(r)}" '
                 f'data-change="change-{e(r)}">{e(by[r]["short"])}</a>' for r in revs)
    return f'<p class="rev" id="{i}-rev">Evidence last reviewed: {tdate(er["date"])}{ch}</p>'


def fmt_utc(iso):  # 2026-11-09T14:00:36Z -> 9 Nov 2026, 14:00:36 UTC
    d, t = iso.rstrip('Z').split('T')
    y, m, dd = d.split('-')
    mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][int(m) - 1]
    return f'{int(dd)} {mon} {y}, {t} UTC'


def card(x):
    i, d = x['id'], x['date_line']
    return f'''      <li class="card" id="card-{i}">
        <h4 class="ctitle"><a href="#{i}" data-entry="{i}" data-opener="title">{e(x['title']['text'])}</a></h4>
        <p class="dline">{e(d['day'])} <a class="sc" href="#{i}-conv" data-entry="{i}" data-x="conv" data-opener="julian" aria-label="{e(d['day'])} {e(d['calendar_label'])}: how we converted">{e(d['calendar_label'])}</a> · {e(d['year_label'])}</p>
        <p class="cplace">Misenum · Bay of Naples (present-day reference)</p>
        <p class="chip">▣ {e(x['evidence']['label'])} · {e(x['evidence']['kind'])}</p>
        <p class="cflag"><a class="sc" href="#{i}-debate" data-entry="{i}" data-x="debate" data-opener="debated" aria-label="{e(x['card_flag']['aria'])}">{e(x['card_flag']['text'])}</a></p>
      </li>'''


def entry(x, revs=(), changes=()):
    i, s, n = x['id'], x['source'], x['scholarly_note']
    d = x['date_line']
    reports = ''.join(f'\n          <li>{e(r["text"])}</li>' for r in x['reports'])
    return f'''    <article class="entry" id="{i}" aria-labelledby="{i}-h">
      <h3 class="eh" id="{i}-h" tabindex="-1">{e(x['title']['text'])}</h3>
      <p class="dline">{e(d['day'])} {e(d['calendar_label'])} · {e(d['year_label'])}</p>

      <section class="es" id="{i}-when" aria-labelledby="{i}-when-h">
        <h4 id="{i}-when-h">When — as the source says</h4>
        <p>{e(x['when_source']['text'])}</p>
        <p class="src" id="{i}-src"><a class="readsrc" href="{e(s['url'])}" target="_blank" rel="noopener">Read the passage at {e(s['host'])} <span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a></p>
        <p class="srcnote">{e(s['host'])} — <i>{e(s['page'])}</i>. Find <b>{e(s['find'])}</b>. The link opens the whole book; it does not jump to the letter. {e(s['edition'].capitalize())}.</p>
        <p class="srcnote">We checked a copy of this page on <time datetime="{e(s['checked_at'])}">{e(fmt_utc(s['checked_at']))}</time>; its sha256 is <code class="hash">{e(s['checked_sha256'])}</code>. The hash identifies the copy we checked. The live page can change, and what it shows now is not necessarily what we checked.</p>
      </section>

      <section class="es xp" id="{i}-conv" aria-labelledby="{i}-conv-h">
        <h4 id="{i}-conv-h">How we converted</h4>
        <div class="xb" id="{i}-conv-b"><p>{e(x['conversion']['text'])} <span class="ours">Ours.</span></p></div>
      </section>

      <section class="es" id="{i}-hour" aria-labelledby="{i}-hour-h">
        <h4 id="{i}-hour-h">Hour and year</h4>
        <p>Hour: {e(x['hour']['as_given'])}</p>
        <p>{e(x['hour']['model'])}</p>
        <p>{e(x['hour']['clock'])}</p>
        <p>{e(x['year']['text'])}</p>
      </section>

      <section class="es" id="{i}-place" aria-labelledby="{i}-place-h">
        <h4 id="{i}-place-h">Place</h4>
        <p>{e(x['place']['stated'])}</p>
        <p>{e(x['place']['reference'])}</p>
      </section>

      <section class="es" id="{i}-reports" aria-labelledby="{i}-reports-h">
        <h4 id="{i}-reports-h">What Pliny reports</h4>
        <ul>{reports}
          <li>{e(x['caveat']['text'])}</li>
        </ul>
      </section>

      <section class="es" id="{i}-uncertain" aria-labelledby="{i}-uncertain-h">
        <h4 id="{i}-uncertain-h">Uncertain</h4>
        <p>{e(x['uncertain']['text'])}</p>
      </section>

      <section class="es xp note" id="{i}-debate" aria-labelledby="{i}-debate-h">
        <h4 id="{i}-debate-h">Scholarly note on the date <span class="sub">(separate, attributed)</span></h4>
        <div class="xb" id="{i}-debate-b">
          <p class="withdrawn"><b>{e(n['status_line'])}</b></p>
          <p>{e(n['text'])}</p>
          <p><a href="https://doi.org/{e(n['doi'])}" target="_blank" rel="noopener">doi {e(n['doi'])} <span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(n['licence'])}.</p>
          <p class="srcnote">{e(n['read'])}</p>
          <p><b>{e(n['verdict'])}</b></p>
        </div>
      </section>

      <section class="es" id="{i}-evidence" aria-labelledby="{i}-evidence-h">
        <h4 id="{i}-evidence-h">Evidence</h4>
        <p><b>{e(x['evidence']['label'])}</b> ({e(x['evidence']['account'])}) · {e(x['evidence']['kind'])} · {e(x['evidence']['corroboration'])}.</p>
        <p>{e(x['evidence']['language'])}.</p>
        <p>{e(x['evidence']['note_not_counted'])}</p>
      </section>
      {rev_line(i, x['evidence_reviewed'], revs, changes)}
    </article>'''


def num(v):  # values as stated; 66.00 keeps the chart's two decimals
    if isinstance(v, float) and v == int(v):
        return '%.2f' % v if v == 66.0 else '%d' % v
    return '%s' % v


def pmn(v):  # a margin as the source writes it: the chart's 1.0 stays 1.0
    return '%.1f' % v if isinstance(v, float) and v == int(v) else '%s' % v


def when_text(w, claims=None):
    t = w['type']
    if t == 'interval':
        return f"{'~' if w.get('approximate') else ''}{num(w['from_ma'])}–{num(w['to_ma'])} Ma"
    if t == 'bound':
        return f"{num(w['ma'])} Ma"
    if t == 'interval_modelled':
        return f"{num(w['from_ma'])}–{num(w['to_ma'])} Ma ({num(w['mid_ma'])} ± {pmn(w['mid_pm'])} Ma), modelled"
    if t == 'measured':
        return f"{num(w['ma'])} ± {pmn(w['pm'])} Ma (uncertainty {w['pm_meaning']})"
    if t == 'approx_point':
        return f"~{num(w['ma'])} Ma (approximate, as stated)"
    if t == 'point':
        return f"{num(w['ma'])} Ma" + (f" ± {pmn(w['pm'])}" if w.get('pm') is not None else ' (uncertainty not stated)')
    if t == 'tied':
        ref = next(c for c in claims if c['claim_type'] == w['to'])
        return f"at the impact age, {num(ref['when']['ma'])} Ma"
    raise SystemExit(f'unknown when type {t}')


def years(ma):  # a stored Ma value as whole years, "335,000"
    return f'{round(ma * 1e6):,}'


def find_when_text(w):
    try:
        return _find_when_text(w)
    except (KeyError, TypeError, ValueError):
        raise SystemExit('refused: malformed find date ' + json.dumps(w, sort_keys=True)[:160])


def _find_when_text(w):
    t = w['type']
    if t == 'interval':
        return f"{years(w['from_ma'])} to {years(w['to_ma'])} years ago"
    if t == 'limit':
        return f"the layer is dated {years(w['ref_ma'])} ± {years(w['ref_pm'])} years ago ({w['sigma']}σ); older limit unknown"
    if t == 'calibrated':
        return f"{years(w['from_ma'])} to {years(w['to_ma'])} calibrated years before {w['datum_ce']} ({w['probability']} % range)"
    raise SystemExit(f'unknown find when type {t}')


def boundary_text(key):
    b = CHART['boundaries'][key]
    pm = f" ± {pmn(b['margin'])}" if b['margin'] is not None else ''
    return f"{BOUNDARY_NAMES[key]} {'~' if b['approximate'] else ''}{num(b['ma'])}{pm} Ma"


def src_obj(key):
    if key is None:
        return None
    s = dict(BIG5['sources'][key] if key in BIG5['sources'] else FINDS['sources'][key]); s['key'] = key; s['url'] = 'https://doi.org/' + s['doi']
    return s


def revisions_of(entry_id):  # change ids that REVISED this entry (its first appearance is not a revision)
    return [c['id'] for c in CHANGES['changes'] if c['kind'] == 'revised' and entry_id in c['entries']]


def catalogue():
    if SCHEMA < 3 and any(ep.get('story') or ep.get('chart_claim_id') or any(c.get('id') or c['claim_type'] in STORY_LABELS for c in ep['claims'])
                          for ep in BIG5['episodes']):
        raise SystemExit('refused: story fields in a schema 2 source')
    eps = []
    for ep in BIG5['episodes']:
        claims = []
        for c in ep['claims']:
            d = {'claim_type': c['claim_type'], 'label': CLAIM_LABELS[c['claim_type']], 'axis': bool(c.get('axis')),
                 'text': c['text'], 'source': src_obj(c.get('source')), 'locator': c.get('locator')}
            if 'when' in c:
                d['when'] = c['when']; d['when_text'] = when_text(c['when'], ep['claims'])
            if 'assumptions' in c:
                d['assumptions'] = c['assumptions']
            if c.get('also'):
                d['also'] = src_obj(c['also'])
            if SCHEMA >= 3 and c.get('id'):
                d['id'] = c['id']
            claims.append(d)
        b = CHART['boundaries'][ep['chart_boundary']]
        claims.append({'claim_type': 'chart_boundary', 'label': CLAIM_LABELS['chart_boundary'], 'axis': False,
                       'boundary': BOUNDARY_NAMES[ep['chart_boundary']],
                       'when': {'type': 'boundary_age', 'ma': b['ma'], 'pm': b['margin'], 'approximate': b['approximate']},
                       'when_text': boundary_text(ep['chart_boundary']),
                       'text': 'Shown beside the source value, not merged with it. The chart supplies the boundary only, not the event date.',
                       'source': None, 'locator': None})
        if SCHEMA >= 3 and ep.get('chart_claim_id'):
            claims[-1]['id'] = ep['chart_claim_id']
        eps.append({'id': ep['id'], 'lane': 'extinctions', 'title': ep['title'], 'short': ep['short'], 'axis': True,
                    'scope': ep.get('scope'), 'claims': claims, 'evidence_reviewed': ep.get('evidence_reviewed'),
                    'revisions': revisions_of(ep['id'])})
        if SCHEMA >= 3 and ep.get('story'):
            st = json.loads(json.dumps(ep['story']))
            st.pop('snapshot_sha256', None)      # the reviewed snapshot's hash stays in the source file, not in shipped data
            for ev in st.get('evidence', []):
                if ev.get('type') == 'passage':
                    ev['source'] = src_obj(ev.get('source'))
            eps[-1]['story'] = st
    finds = []
    for f in (FINDS['finds'] if FINDS else []):
        claims = []
        for c in f['claims']:
            d = {'id': c['id'], 'claim_type': c['claim_type'], 'label': CLAIM_LABELS[c['claim_type']], 'axis': bool(c.get('axis')),
                 'text': c['text'], 'source': src_obj(c.get('source')), 'locator': c.get('locator')}
            if 'when' in c:
                d['when'] = c['when']; d['when_text'] = find_when_text(c['when'])
                for k in ('result', 'source_notation', 'source_units', 'source_values', 'confidence', 'calibration'):
                    if k in c: d[k] = c[k]
            claims.append(d)
        finds.append({'id': f['id'], 'lane': 'relatives', 'title': f['title'], 'short': f['short'], 'axis': True, 'scope': None,
                      'find': f['find'], 'attributed_to': f['attributed_to'], 'links': f['links'], 'claims': claims,
                      'evidence_reviewed': f.get('evidence_reviewed'), 'revisions': revisions_of(f['id'])})
    pliny = json.loads(ENTRIES[0].read_text(encoding='utf-8'))
    shelf = [{'id': pliny['id'], 'lane': 'history', 'title': pliny['title']['text'], 'axis': False,
              'when': {'type': 'partial_date', 'day': pliny['date_line']['day'],
                       'calendar': pliny['date_line']['calendar_label'].strip('()'), 'year': None},
              'note': 'Day and month only; never placed on the axis.', 'evidence_reviewed': pliny.get('evidence_reviewed'),
              'revisions': revisions_of(pliny['id'])}]
    src = CHART['source']
    out = {
        'catalogue': 'timeline', 'catalogue_revision': BUILD['catalogue_revision'], 'schema': BUILD['schema'],
        'generated_at': BUILD['generated_at'],
        'release': {'revision': BUILD['catalogue_revision'], 'release_date': BUILD['release_date'], 'previous': BUILD['previous']},
        'releases': CHANGES['releases'], 'changes': CHANGES['changes'],
        'chart': {'name': src['name'], 'tag': src['tag'], 'commit': src['commit'], 'file_sha256': src['file_sha256'],
                  'licence': src['licence'], 'licence_url': src['licence_url'], 'citation': src['citation'], 'units': 'Ma',
                  'margin_meaning': src['margin_meaning'], 'window': CHART['window'], 'overview': CHART['overview'],
                  'periods': CHART['periods']},
        'lanes': [{'id': i, 'label': l, 'status': 'active' if i == 'extinctions' or (i == 'relatives' and finds) else EMPTY[i]} for i, l in LANES],
        'claim_labels': CLAIM_LABELS,
        'coverage': 'This release shows the conventional Big Five mass extinctions, placed on the ICS chart. '
                    'Empty stretches are not periods where nothing happened. Lanes fill as their evidence is checked.',
        'entries': eps, 'shelf': shelf,
        'credit': 'Chart: ICS International Chronostratigraphic Chart v2026-06 (CC BY 4.0). Episode sources as cited in each '
                  'entry (CC BY 4.0 unless stated). Values reformatted by Mother Earth.',
    }
    if finds:
        out['entries'] = eps + finds
        out['axis_convention'] = FINDS['axis_convention']
        out['find_note'] = FIND_NOTE
        out['coverage'] = ('This release shows the conventional Big Five mass extinctions, placed on the ICS chart, and '
                           f'{len(finds)} dated finds of humans and human relatives reviewed for this page. Other finds are not yet '
                           'reviewed, or their full text is not yet verified. Empty stretches are not periods where nothing happened.')
    return out


def cat_bytes():
    cat = catalogue()
    cb = (json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')
    check_rules(cat, cb)
    return cb


def is_date(d):
    if not isinstance(d, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d):
        return False
    try:
        import datetime
        datetime.date.fromisoformat(d); return True
    except ValueError:
        return False


def check_rules(cat, cb):
    """Refuse a catalogue that breaks the release, date, change-record or privacy rules (proposal rev 2.1 §3.2–§3.5, §6)."""
    def no(msg):
        raise SystemExit('refused: ' + msg)
    rel, rels, chs = cat['release'], cat['releases'], cat['changes']
    # releases: valid, ascending, the last is this build, previous = the last reader-facing release before it
    if not rels or any(not is_date(r.get('release_date')) for r in rels): no('a release has no valid date')
    if [r['release_date'] for r in rels] != sorted(r['release_date'] for r in rels): no('releases are not in date order')
    if len({r['revision'] for r in rels}) != len(rels): no('a revision is listed twice')
    if rels[-1]['revision'] != rel['revision'] or rels[-1]['release_date'] != rel['release_date']: no('the last release is not this build')
    if rel['previous'] != (rels[-2]['revision'] if len(rels) > 1 else None): no('previous is not the last reader-facing release')
    day = rel['release_date']
    # entries: an explicit entry-wide review date (never derived), no date after the release day
    ids = set()
    for x in cat['entries'] + cat['shelf']:
        ids.add(x['id'])
        er = x.get('evidence_reviewed')
        if not er or not is_date(er.get('date')): no(f"{x['id']} has no evidence_reviewed date")
        if er['date'] > day: no(f"{x['id']} evidence_reviewed {er['date']} is after the release day {day}")
        recs = er.get('records')
        if not recs: no(f"{x['id']} evidence_reviewed names no public record")
        for r in recs:  # a public pointer: a file in the public repo, never a private research or inbox path
            if r.startswith(('/', '~', 'research/')) or '..' in r or not (ROOT / r).is_file(): no(f"{x['id']} record {r!r} is not a file in the public repo")
        for c in x.get('claims', []):
            for s in (c.get('source'), c.get('also')):
                if not s: continue
                if not is_date(s.get('checked')): no(f"{x['id']} source {s.get('key')} has no checked date")
                if s['checked'] > day: no(f"{x['id']} source {s['key']} checked {s['checked']} is after the release day {day}")
                if f"(checked {fmt_date(s['checked'])})" not in s['status']: no(f"{x['id']} source {s['key']}: status text and checked date disagree")
    # change records
    seen, known = set(), {r['revision'] for r in rels}
    for c in chs:
        if 'inbox' in c: no(f"{c.get('id')} carries an inbox field")
        if c['revision'] not in known: no(f"{c['id']} names an unreleased revision")
        if not re.fullmatch(re.escape(c['revision']) + r'-[1-9]\d*', c['id']) or c['id'] in seen: no(f"bad or repeated change id {c['id']}")
        seen.add(c['id'])
        if c['kind'] not in ('added', 'revised'): no(f"{c['id']} kind {c['kind']!r}")
        if not c.get('entries') or any(i not in ids for i in c['entries']): no(f"{c['id']} names an unknown entry")
        if c['kind'] == 'revised':
            if c['what'] not in ('wording', 'date') + (('account',) if SCHEMA >= 3 else ()) or not c.get('short') or not c.get('why') or len(c['entries']) != 1: no(f"{c['id']} is incomplete")
            if c['what'] == 'account':      # an account and image added to an entry; an earlier line it retires is kept here, word for word
                if not c.get('title') or not c.get('text'): no(f"{c['id']} is incomplete")
                if c['revision'] == rel['revision']:
                    ent = next(x for x in cat['entries'] if x['id'] == c['entries'][0])
                    if not ent.get('story'): no(f"{c['id']} names an entry with no account")
                    if c.get('retired'):
                        prev = json.loads((TL / 'catalogue' / (rel['previous'] + '.json')).read_text(encoding='utf-8'))
                        pe = next((x for x in prev['entries'] if x['id'] == ent['id']), {})
                        if not any(k['text'] == c['retired'] for k in pe.get('claims', [])): no(f"{c['id']} 'retired' is not a line {rel['previous']} showed")
                        if any(k['text'] == c['retired'] for k in ent['claims']): no(f"{c['id']} 'retired' is still in the entry")
                continue
            for side in ('before', 'after'):
                v = c.get(side) or {}
                if c['what'] == 'wording' and not (v.get('label') and v.get('text')): no(f"{c['id']} {side} wording missing")
                if c['what'] == 'date':  # each side keeps its OWN evidence snapshot, copied in at the time of the change
                    sn = v.get('source') or {}
                    if not v.get('when_text') or not all(sn.get(k) for k in ('citation', 'url', 'licence', 'status')) or not is_date(sn.get('checked')):
                        no(f"{c['id']} {side} value has no evidence snapshot of its own")
            if c['revision'] == rel['revision']:  # a change made in THIS build must match the data on both sides
                ent = next(x for x in cat['entries'] + cat['shelf'] if x['id'] == c['entries'][0])
                cl = next((k for k in ent.get('claims', []) if k['claim_type'] == c.get('claim_type')), None)
                if not cl: no(f"{c['id']} names a claim the entry does not have")
                prev = json.loads((TL / 'catalogue' / (rel['previous'] + '.json')).read_text(encoding='utf-8'))
                pe = next((x for x in prev['entries'] if x['id'] == ent['id']), None)
                pc = next((k for k in (pe or {}).get('claims', []) if k['claim_type'] == c['claim_type']), None)
                if not pc: no(f"{c['id']}: the previous release has no such claim")
                if c['what'] == 'wording':
                    if (c['after']['label'], c['after']['text']) != (cl['label'], cl['text']): no(f"{c['id']} 'after' is not what this catalogue says")
                    if (c['before']['label'], c['before']['text']) != (pc['label'], pc['text']): no(f"{c['id']} 'before' is not what {rel['previous']} said")
                else:
                    if c['after']['when_text'] != cl['when_text']: no(f"{c['id']} 'after' is not the value this catalogue shows")
                    if c['before']['when_text'] != pc['when_text']: no(f"{c['id']} 'before' is not the value {rel['previous']} showed")
    for x in cat['entries'] + cat['shelf']:
        if any(r not in seen for r in x['revisions']): no(f"{x['id']} lists an unknown change")
    if cat['schema'] >= 3:
        for x in cat['entries']:
            check_story(x, day, no)
    if cat['schema'] >= 4:
        check_finds(cat, no)
    elif any(x['lane'] != 'extinctions' or any(k['claim_type'] in FIND_LABELS for k in x['claims']) for x in cat['entries']):
        no('find fields in a catalogue below schema 4')
    # privacy: inbox fields and private paths stay out of shipped data
    low = cb.decode('utf-8').lower()
    for bad in (r'tl-in-\d', r'timeline-inbox/', r'(?<!docs/)research/', r'_review/', r'/users/', r'_to_delete'):
        if re.search(bad, low): no(f'shipped data contains a private reference ({bad})')


def check_finds(cat, no):
    """Schema 4. Each find is one entry with exactly one axis claim of a find type, its number in finite Ma, the source's own
    notation, units and confidence beside it, and what was dated and how that relates to the find. Semantics are checked, not
    just presence (GPT, 24 Nov 2026). An unknown type or field value is refused."""
    fin = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
    txt = lambda v: isinstance(v, str) and v.strip() != ''
    O = cat['chart']['overview']['ma']
    finds = [x for x in cat['entries'] if x['lane'] == 'relatives']
    if not finds: no('schema 4 with no find')
    if len(finds) > FIND_MAX: no(f'{len(finds)} finds: at most {FIND_MAX}, one sub-row each')
    if not txt(cat.get('axis_convention')) or cat.get('find_note') != FIND_NOTE: no('axis convention or lane note missing')
    for x in cat['entries']:
        if x['lane'] == 'extinctions':
            if any(k['claim_type'] in FIND_LABELS or (k.get('when') or {}).get('type') in ('limit', 'calibrated') for k in x['claims']): no(f"{x['id']}: a find claim on the extinctions lane")
            continue
        if x['lane'] != 'relatives': no(f"{x['id']}: lane {x['lane']!r}")
        i = x['id']
        if not re.fullmatch(r'f-[a-z0-9]+(-[a-z0-9]+)*', i): no(f'{i}: a find id starts with f-')
        if x.get('story'): no(f'{i}: a find has no account or image in this slice')
        f, at, ln = x.get('find') or {}, x.get('attributed_to') or {}, x.get('links') or {}
        if not txt(f.get('site')) or not txt(f.get('where')) or not txt(f.get('context')): no(f'{i}: find site, place or context missing')
        if f.get('specimen') is not None and not txt(f['specimen']): no(f'{i}: specimen is empty')
        if txt(f.get('specimen')) and (re.fullmatch(r'Q\d+', f['specimen']) or f['specimen'] in ln.values()): no(f'{i}: a group or site identifier is not a specimen id')
        if not txt(at.get('name')) or at.get('basis') not in FIND_BASIS: no(f'{i}: attribution name or basis')
        if at.get('qualified') is not None and not txt(at['qualified']): no(f'{i}: attribution qualification is empty')
        if set(ln) != {'group', 'site'} or any(not re.fullmatch(r'Q[1-9]\d*', str(v)) for v in ln.values()): no(f'{i}: links')
        if FIND_TITLE_BAN.search(x['title']) or FIND_TITLE_BAN.search(x['short']): no(f'{i}: a comparative word in a find title')
        ids = [k.get('id') for k in x['claims']]
        if any(not txt(k) for k in ids) or len(set(ids)) != len(ids): no(f'{i}: claim ids')
        ax = [k for k in x['claims'] if k['axis']]
        if len(ax) != 1 or ax[0]['claim_type'] not in FIND_AXIS: no(f'{i}: exactly one axis claim of a find type')
        for k in x['claims']:
            if k['claim_type'] not in FIND_LABELS and k['claim_type'] != 'context': no(f"{i}: claim type {k['claim_type']!r} is not a find's")
            if not txt(k.get('text')): no(f"{i}: claim {k['id']} has no text")
            if FIND_TEXT_BAN.search(k['text']): no(f"{i}: claim {k['id']} makes a claim this lane never makes ({FIND_TEXT_BAN.search(k['text']).group(0)!r})")
            if k['claim_type'] in FIND_LABELS and not (k.get('source') and txt(k.get('locator'))): no(f"{i}: claim {k['id']} has no source or locator")
        if at.get('qualified') and FIND_TEXT_BAN.search(at['qualified']): no(f'{i}: attribution wording')
        for need in ('dated_material', 'find_association'):
            if sum(k['claim_type'] == need for k in x['claims']) != 1: no(f'{i}: exactly one {need} claim')
        a = ax[0]; w = a.get('when') or {}; sv = a.get('source_values') or {}
        if w.get('type') != FIND_AXIS[a['claim_type']]: no(f"{i}: {a['claim_type']} needs a {FIND_AXIS[a['claim_type']]} date")
        if not all(txt(a.get(q)) for q in ('source_notation', 'source_units', 'confidence')): no(f'{i}: source notation, units or confidence missing')
        if a['source_units'] not in FIND_UNITS or sv.get('unit') != a['source_units']: no(f"{i}: source units {a.get('source_units')!r}")
        per = FIND_UNITS[a['source_units']]; same = lambda ma, v: fin(v) and abs(ma * per - v) < 1e-9
        if w['type'] in ('interval', 'calibrated'):
            if set(w) - {'type', 'from_ma', 'to_ma', 'probability', 'datum_ce', 'curve', 'lab_id', 'c14_bp', 'c14_pm'}: no(f'{i}: unknown date field')
            if not (fin(w.get('from_ma')) and fin(w.get('to_ma'))) or not (O >= w['from_ma'] > w['to_ma'] >= 0): no(f'{i}: bracket ends')
            if not (same(w['from_ma'], sv.get('from')) and same(w['to_ma'], sv.get('to'))): no(f'{i}: stored ages differ from the source values')
        if w['type'] == 'interval' and set(w) != {'type', 'from_ma', 'to_ma'}: no(f'{i}: a bracket carries only its two ends')
        if w['type'] == 'calibrated':
            if w.get('datum_ce') != 1950 or a['source_units'] != 'ka cal BP': no(f'{i}: calibrated ages count from 1950')
            if w.get('curve') != 'IntCal20': no(f"{i}: calibration curve {w.get('curve')!r} is not one this build knows")
            if not fin(w.get('probability')) or not (0 < w['probability'] <= 100): no(f'{i}: probability')
            if not txt(w.get('lab_id')) or not (fin(w.get('c14_bp')) and w['c14_bp'] > 0 and fin(w.get('c14_pm')) and w['c14_pm'] > 0): no(f'{i}: laboratory measurement')
            if f"{w['probability']}%" not in a['source_notation'].replace(' ', ''): no(f'{i}: the stated probability is not the source notation\'s')
        if w['type'] == 'limit':
            if set(w) != {'type', 'ref_ma', 'ref_pm', 'sigma', 'side'}: no(f'{i}: limit fields')
            if w.get('side') != 'older': no(f"{i}: limit side {w.get('side')!r}")
            if w.get('sigma') not in (1, 2): no(f'{i}: limit sigma')
            if not (fin(w.get('ref_ma')) and fin(w.get('ref_pm'))) or w['ref_pm'] <= 0: no(f'{i}: limit reference or uncertainty')
            if not (O >= w['ref_ma'] + w['ref_pm'] and w['ref_ma'] - w['ref_pm'] >= 0): no(f'{i}: limit reference ± uncertainty leaves the chart')
            if not (same(w['ref_ma'], sv.get('ref')) and same(w['ref_pm'], sv.get('pm'))): no(f'{i}: stored ages differ from the source values')

        # one selected published result (GPT, rehearsal review Q5). The stored numbers must be the numbers of the notation the source
        # writes, at its precision; the claim's own words must say the same numbers; and the notation must be the one the public evidence
        # record lists for that result id. Two editable copies of a number agreeing with each other proves nothing on its own
        bad_n = notation_bad(a['source_notation'], w, sv)
        if bad_n: no(f'{i}: source notation and stored values disagree ({bad_n})')
        say = [years(w['from_ma']), years(w['to_ma'])] if w['type'] != 'limit' else [years(w['ref_ma']), years(w['ref_pm'])]
        if any(y not in a['text'] for y in say): no(f"{i}: the claim's own words do not give the stored numbers ({', '.join(say)})")
        r = a.get('result')
        if not (isinstance(r, str) and re.fullmatch(r'C\d+\.r\d+', r)): no(f'{i}: the axis claim names no selected result')
        rows = [ln for rec in (x.get('evidence_reviewed') or {}).get('records', []) if (ROOT / rec).is_file()
                for ln in (ROOT / rec).read_text(encoding='utf-8').splitlines() if ln.startswith('|') and f'`{r}`' in ln.split('|')[1]]
        if len(rows) != 1: no(f'{i}: result {r} is not listed once in its evidence record')
        if f"`{a['source_notation']}`" not in rows[0]: no(f'{i}: source notation is not the one its evidence record lists for {r}')


NUM = re.compile(r'\d+(?:\.\d+)?')


def notation_bad(notation, w, sv):
    """The numbers a source writes, against the stored source values: the same numbers at the same precision, or a reason."""
    m = re.search(r'\((\d+(?:\.\d+)?)\s*%\)', notation)
    rest = notation[:m.start()] + notation[m.end():] if m else notation
    nums = NUM.findall(rest)
    if w.get('type') == 'limit':
        if m or len(nums) != 2 or '±' not in rest: return 'a limit is written as a value ± its uncertainty'
        if [float(n) for n in nums] != [sv.get('ref'), sv.get('pm')]: return f"notation {nums[0]} ± {nums[1]}, stored {sv.get('ref')} ± {sv.get('pm')}"
        return None
    if len(nums) != 2: return f'{len(nums)} numbers in the notation, not two ends'
    if sorted(float(n) for n in nums) != sorted([sv.get('from'), sv.get('to')]): return f"notation ends {' and '.join(nums)}, stored {sv.get('from')} and {sv.get('to')}"
    if w.get('type') == 'calibrated' and (not m or float(m.group(1)) != w.get('probability')): return 'the probability is not the notation\'s'
    if w.get('type') == 'interval' and m: return 'a bracket carries no probability'
    return None


def claim_id(c, n):  # a claim's stable id inside its entry: its own, or its position as in schema 2 (c0, c1, ...)
    return c.get('id') or f'c{n}'


def image_pixels(b):
    """(width, height) of a JPEG or PNG, read from its own bytes; None if neither."""
    if b[:8] == b'\x89PNG\r\n\x1a\n' and b[12:16] == b'IHDR':
        return int.from_bytes(b[16:20], 'big'), int.from_bytes(b[20:24], 'big')
    if b[:2] == b'\xff\xd8':
        i = 2
        while i + 9 < len(b) and b[i] == 0xFF:
            m = b[i + 1]
            if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                return int.from_bytes(b[i + 7:i + 9], 'big'), int.from_bytes(b[i + 5:i + 7], 'big')
            i += 2 + int.from_bytes(b[i + 2:i + 4], 'big')
    return None


def check_story(x, day, no):
    """Structure only (proposal rev 2 section 4): ids exist, are unique and resolve; required fields are present and well
    formed; image bytes equal their record. Whether a passage supports a sentence is the reviewer's matrix, not this."""
    i = x['id']; st = x.get('story')
    cids = [claim_id(c, n) for n, c in enumerate(x['claims'])]
    idre = re.compile(r'[a-z][a-z0-9-]*')
    if any(not isinstance(k, str) or not idre.fullmatch(k) for k in cids): no(f'{i} has a malformed claim id')
    if len(set(cids)) != len(cids): no(f'{i} has a duplicate claim id')
    for c in x['claims']:
        if c['claim_type'] in STORY_LABELS and not (c.get('id') and c.get('source') and c.get('locator')):
            no(f"{i} claim {c.get('id')} has no evidence record")
        if (c.get('source') or {}).get('read') not in (None, 'abstract only'): no(f'{i} source read state')
    if not st:
        if any(c['claim_type'] in STORY_LABELS for c in x['claims']): no(f'{i} has account claims and no story')
        return
    evs, ops = st.get('evidence') or [], st.get('opening') or []
    ids = cids + [v.get('id') for v in evs] + [o.get('id') for o in ops]
    if any(not isinstance(k, str) or not idre.fullmatch(k) for k in ids): no(f'{i} has a malformed id')
    if len(set(ids)) != len(ids): no(f'{i} has a duplicate id')
    known = set(cids) | {v['id'] for v in evs}
    for v in evs:
        if v.get('type') == 'passage':
            s = v.get('source')
            if not s or not v.get('locator') or not is_date(s.get('checked')) or s['checked'] > day: no(f"{i} evidence {v['id']} is incomplete")
            if f"(checked {fmt_date(s['checked'])})" not in s['status']: no(f"{i} evidence {v['id']}: status text and checked date disagree")
        elif v.get('type') == 'collection_record':
            if not all(isinstance(v.get(k), str) and v[k] for k in ('institution', 'record', 'title', 'url')) or not v['url'].startswith('https://') \
               or not is_date(v.get('checked')) or v['checked'] > day: no(f"{i} evidence {v['id']} is incomplete")
        else:
            no(f"{i} evidence {v.get('id')} has an unknown type")   # chart_reference and dataset are defined but not used in this slice
    if not ops: no(f'{i} story has no opening')
    for o in ops:
        if not isinstance(o.get('text'), str) or not o['text'].strip() or o.get('kind') not in ('evidence', 'structural'): no(f"{i} sentence {o['id']} is malformed")
        sup = o.get('supports')
        if not isinstance(sup, list) or any(k not in known for k in sup): no(f"{i} sentence {o['id']} names support that does not exist")
        if o['kind'] == 'evidence' and not sup: no(f"{i} sentence {o['id']} is an evidence sentence with no support")
    if not isinstance(st.get('heading'), str) or not st['heading'].strip(): no(f'{i} story has no heading for its attributed findings')
    rv = st.get('reviewed')
    if not isinstance(rv, dict) or not is_date(rv.get('date')) or rv['date'] > day or not isinstance(rv.get('scope'), str) or not rv['scope'].strip(): no(f'{i} story has no dated, scoped review of its own')
    im = st.get('image')
    if im is None:
        return
    if im.get('kind') not in IMAGE_KINDS: no(f"{i} image kind {im.get('kind')!r} is not allowed in this slice")
    for k in ('alt', 'caption', 'creator', 'credit', 'licence', 'licence_url', 'source_page'):
        if not isinstance(im.get(k), str) or not im[k].strip(): no(f'{i} image has no {k}')
    if not im['licence_url'].startswith('https://') or not im['source_page'].startswith('https://'): no(f'{i} image links must be https')
    if not isinstance(im.get('supports'), list) or not im['supports'] or any(k not in known for k in im['supports']): no(f'{i} image names support that does not exist')
    rs = im.get('renditions')
    if not isinstance(rs, list) or not rs: no(f'{i} image has no rendition')
    total = 0
    for r in rs:
        f = r.get('file')
        if not isinstance(f, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', f) or '..' in f: no(f'{i} image file {f!r} is not a plain file name')
        if r.get('media_type') not in MEDIA or not f.lower().endswith(MEDIA[r['media_type']]): no(f'{i} image {f} media type')
        if not isinstance(r.get('sha256'), str) or not re.fullmatch(r'[0-9a-f]{64}', r['sha256']): no(f'{i} image {f} has no sha256')
        if not isinstance(r.get('bytes'), int) or r['bytes'] <= 0: no(f'{i} image {f} has no size')
        px = r.get('pixels')
        if not isinstance(px, list) or len(px) != 2 or any(not isinstance(v, int) or v <= 0 for v in px): no(f'{i} image {f} has no pixel size')
        if not isinstance(r.get('modification'), str) or not r['modification'].strip(): no(f'{i} image {f} does not say how it differs from the original')
        fp = ASSETS / f
        if not fp.is_file(): no(f'{i} image {f} is not in the assets folder')
        b = fp.read_bytes()
        if len(b) != r['bytes'] or hashlib.sha256(b).hexdigest() != r['sha256']: no(f'{i} image {f}: the bytes on disk are not the bytes recorded')
        if image_pixels(b) != tuple(px): no(f'{i} image {f}: pixel size on disk is not the size recorded')
        total += r['bytes']
    if len({r['file'] for r in rs}) != len(rs): no(f'{i} image lists a file twice')
    if total > IMAGE_BYTES_MAX: no(f'{i} image renditions total {total} B, over {IMAGE_BYTES_MAX}')


CAT_PATH = TL / 'catalogue' / (BUILD['catalogue_revision'] + '.json')
# for each revision, the releases before it (a date change says which revision showed the earlier value)
REL_BEFORE = {r['revision']: CHANGES['releases'][:n] for n, r in enumerate(CHANGES['releases'])}


def asset_version(page):
    m = re.search(r'timeline\.js\?v=(\d+)', page)
    if not m:
        raise SystemExit('timeline.js ?v= not found in the page')
    return m.group(1)


def ep_card(ep):
    prim = [c for c in ep['claims'] if c['axis'] and c['claim_type'] != 'extinction_placement_tied'][0]
    i = ep['id']
    return (f'      <li class="card ep" id="card-{i}">\n'
            f'        <h4 class="ctitle"><a href="#{i}" data-entry="{i}" data-opener="title">{e(ep["title"])}</a></h4>\n'
            f'        <p class="dline"><span class="clab">{e(prim["label"])}{"" if prim["label"].endswith("than") else ":"}</span> {e(prim["when_text"])}</p>\n'
            f'      </li>')


def src_line(s, locator):
    if not s:
        return ''
    loc = f' · {e(locator)}' if locator else ''
    return (f'<p class="srcnote">{e(s["citation"])}{loc}. <a href="{e(s["url"])}" target="_blank" rel="noopener">doi {e(s["doi"])} '
            f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(s["licence"])}. {e(s["status"])}.'
            + (f' Read as: {e(s["read"])}.' if s.get('read') else '') + '</p>')


def snap_line(v):  # one side of a date change, with ITS OWN citation and checked date (not the entry's current source)
    sn = v['source']
    loc = f' · {e(sn["locator"])}' if sn.get('locator') else ''
    return (f'{e(v["when_text"])} — {e(sn["citation"])}{loc}. <a href="{e(sn["url"])}" target="_blank" rel="noopener">source '
            f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(sn["licence"])} · checked {tdate(sn["checked"])}')


GROUPS = (('how', 'How we know'), ('interp', None), ('context', 'Context and limits'), ('chart', 'Chart reference'))


def claim_group(c):  # which heading an existing claim sits under; the claim itself is unchanged
    return ('chart' if c['claim_type'] == 'chart_boundary' else 'context' if c['claim_type'] == 'context'
            else 'interp' if c['claim_type'] in STORY_LABELS else 'how')


def story_head(ep):
    """The image and the opening of an entry that has an account. All text is escaped; nothing here is HTML from the data."""
    i, st = ep['id'], ep['story']; out = []
    im = st.get('image')
    if im:
        rs = sorted(im['renditions'], key=lambda r: r['pixels'][0])
        big = rs[-1]; base = f'assets/timeline/{e(BUILD["catalogue_revision"])}/'
        srcset = ', '.join(f'{base}{e(r["file"])} {r["pixels"][0]}w' for r in rs)
        attrs = f'alt="{e(im["alt"])}" width="{big["pixels"][0]}" height="{big["pixels"][1]}"'
        sizes = '(max-width: 760px) calc(100vw - 32px), 480px'
        out.append(f'      <figure class="sfig" id="{i}-fig" data-kind="{e(im["kind"])}">\n'
                   f'        <img class="simg" id="{i}-img" {attrs} data-src="{base}{e(big["file"])}" data-srcset="{srcset}" data-sizes="{sizes}">\n'
                   f'        <noscript><img class="simg" {attrs} src="{base}{e(big["file"])}" srcset="{srcset}" sizes="{sizes}"></noscript>\n'
                   f'        <p class="imgfail" id="{i}-imgfail" hidden>The image could not be loaded. Its caption and the account remain available.</p>\n'
                   f'        <figcaption id="{i}-cap">{e(im["caption"])} <span class="icred"><a href="{e(im["source_page"])}" target="_blank" rel="noopener">{e(im["credit"])} '
                   f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · <a href="{e(im["licence_url"])}" target="_blank" rel="noopener">{e(im["licence"])} '
                   f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a></span></figcaption>\n'
                   f'      </figure>')
    evs = st['evidence']; num_of = {}
    for o in st['opening']:
        for k in o['supports']:
            if k not in num_of and any(v['id'] == k for v in evs):
                num_of[k] = len(num_of) + 1
    sents = []
    for o in st['opening']:
        marks = ''.join(f'<sup class="cite" data-src="{i}-{e(k)}" data-n="{num_of[k]}">[{num_of[k]}]</sup>' for k in o['supports'] if k in num_of)
        sents.append(f'<span class="ops" id="{i}-{e(o["id"])}" data-kind="{e(o["kind"])}">{e(o["text"])}</span>{marks}')
    out.append(f'      <p class="opening" id="{i}-opening">' + ' '.join(sents) + '</p>')
    items = []
    for v in sorted((v for v in evs if v['id'] in num_of), key=lambda v: num_of[v['id']]):
        if v['type'] == 'passage':
            s = v['source']
            body = (f'{e(s["citation"])} · {e(v["locator"])}. <a href="{e(s["url"])}" target="_blank" rel="noopener">doi {e(s["doi"])} '
                    f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(s["licence"])}. {e(s["status"])}.'
                    + (f' Read as: {e(s["read"])}.' if s.get('read') else ''))
        else:
            body = (f'{e(v["institution"])}, record {e(v["record"])}: {e(v["title"])}. <a href="{e(v["url"])}" target="_blank" rel="noopener">record '
                    f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · read {tdate(v["checked"])}.')
        items.append(f'          <li id="{i}-{e(v["id"])}" value="{num_of[v["id"]]}" tabindex="-1">{body}</li>')
    out.append(f'      <details class="opsrc" id="{i}-opsrc">\n        <summary>Sources for these sentences</summary>\n        <ol>\n'
               + '\n'.join(items) + '\n        </ol>\n      </details>')
    return '\n'.join(out)


def ep_article(ep, changes=()):
    """An episode in full. Its claims are grouped under plain headings (TIMELINE-TRAVEL-PROPOSAL rev 2.1 §3.11): the dated
    claims from sources, then context, then the chart reference on its own, then review and changes. Every claim keeps its
    label, value, text, source and id exactly as the catalogue has them; no sentence is added. An empty group is not written."""
    i = ep['id']; parts = []
    by = {c['id']: c for c in changes}
    order = [claim_group(c) for c in ep['claims']]
    if order != sorted(order, key=[k for k, _ in GROUPS].index):
        raise SystemExit(f'{i}: claims are not in group order (dated, context, chart)')
    st = ep.get('story')
    for gk, gl in GROUPS:
        if gk == 'interp':
            gl = st['heading'] if st else None
        inner = []
        for n, c in enumerate(ep['claims']):
            if claim_group(c) != gk:
                continue
            cid = f'{i}-{claim_id(c, n)}'
            if gk == 'interp':          # an attributed finding: the sentence and its own citation, no repeated label
                inner.append(f'        <section class="es claim told" id="{cid}" data-claim-type="{c["claim_type"]}">\n'
                             f'          <p>{e(c["text"])}</p>\n'
                             f'          {src_line(c.get("source"), c.get("locator"))}{src_line(c.get("also"), None) if c.get("also") else ""}\n'
                             f'        </section>')
                continue
            val = f'<p class="cval">{e(c["when_text"])}</p>' if c.get('when_text') else ''
            asm = ('<p>Assumes: ' + '; '.join(e(a) for a in c['assumptions']) + '.</p>') if c.get('assumptions') else ''
            also = src_line(c.get('also'), None) if c.get('also') else ''
            inner.append(f'        <section class="es claim" id="{cid}" data-claim-type="{c["claim_type"]}" aria-labelledby="{cid}-h">\n'
                         f'          <h5 id="{cid}-h">{e(c["label"])}</h5>\n'
                         f'          {val}<p>{e(c["text"])}</p>{asm}\n'
                         f'          {src_line(c.get("source"), c.get("locator"))}{also}\n'
                         f'        </section>')
        if inner:
            parts.append(f'      <section class="grp" data-grp="{gk}" aria-labelledby="{i}-g-{gk}">\n'
                         f'        <h4 class="gh" id="{i}-g-{gk}">{gl}</h4>\n' + '\n'.join(inner) + '\n      </section>')
    tail = []
    for r in ep['revisions']:  # an earlier date stays visible in the entry, labelled with the revision that showed it
        c = by[r]
        if c['what'] != 'date':
            continue
        was = next(x['revision'] for x in reversed(REL_BEFORE[c['revision']]))
        tail.append(f'        <section class="es earlier" id="{i}-earlier-{e(r)}" aria-labelledby="{i}-earlier-{e(r)}-h">\n'
                    f'          <h5 id="{i}-earlier-{e(r)}-h">Earlier dating</h5>\n'
                    f'          <p>Shown in revision {e(was)}: <span class="was">{snap_line(c["before"])}</span>.</p>\n'
                    f'        </section>')
    tail.append(f'        {rev_line(i, ep["evidence_reviewed"], ep["revisions"], changes)}')
    if st and st.get('reviewed'):   # a scoped review of the added account, beside the entry-wide date and never instead of it
        tail.append(f'        <p class="rev srev" id="{i}-srev">Account and image reviewed: {tdate(st["reviewed"]["date"])}. {e(st["reviewed"]["scope"])}</p>')
    parts.append(f'      <section class="grp" data-grp="review" aria-labelledby="{i}-g-review">\n'
                 f'        <h4 class="gh" id="{i}-g-review">Review and changes</h4>\n' + '\n'.join(tail) + '\n      </section>')
    scope = f'\n      <p class="scope">{e(ep["scope"])}</p>' if ep.get('scope') else ''
    head = ('\n' + story_head(ep)) if st else ''
    return (f'    <article class="entry ep{" story" if st else ""}" id="{i}" aria-labelledby="{i}-h">\n'
            f'      <h3 class="eh" id="{i}-h" tabindex="-1">{e(ep["title"])}</h3>{scope}{head}\n'
            + '\n'.join(parts) + '\n    </article>')


def find_attr(x):
    at = x['attributed_to']
    return f"Attributed to {at['name']} {FIND_BASIS[at['basis']]}." + (f" {at['qualified']}" if at.get('qualified') else '')


def find_card(x):
    a = next(c for c in x['claims'] if c['axis']); i = x['id']
    return (f'      <li class="card ep find" id="card-{i}">\n'
            f'        <h4 class="ctitle"><a href="#{i}" data-entry="{i}" data-opener="title">{e(x["title"])}</a></h4>\n'
            f'        <p class="dline"><span class="clab">{e(a["label"])}:</span> {e(a["when_text"])}</p>\n'
            f'        <p class="fattr">{e(find_attr(x))}</p>\n'
            f'      </li>')


def find_article(x, changes=()):
    """A find in full: who it is attributed to and on what basis, the one dated claim with the source's own notation, what was
    dated, how that relates to the find, and its limits. Every sentence is the catalogue's; nothing is added here."""
    i, f = x['id'], x['find']; how, ctx = [], []
    for c in x['claims']:
        cid = f'{i}-{c["id"]}'
        val = ''
        if c['axis']:
            cal = f' Calibration: {e(c["calibration"])}' if c.get('calibration') else ''
            val = (f'<p class="cval">{e(c["when_text"])}</p>'
                   f'<p class="fnot" id="{cid}-not">As the source writes it: {e(c["source_notation"])}. {e(c["confidence"])}{cal}</p>')
        sec = (f'        <section class="es claim" id="{cid}" data-claim-type="{c["claim_type"]}" aria-labelledby="{cid}-h">\n'
               f'          <h5 id="{cid}-h">{e(c["label"])}</h5>\n'
               f'          {val}<p>{e(c["text"])}</p>\n'
               f'          {src_line(c.get("source"), c.get("locator"))}\n'
               f'        </section>')
        (ctx if c['claim_type'] == 'context' else how).append(sec)
    parts = [f'      <section class="grp" data-grp="how" aria-labelledby="{i}-g-how">\n'
             f'        <h4 class="gh" id="{i}-g-how">Dated evidence</h4>\n' + '\n'.join(how) + '\n      </section>']
    if ctx:
        parts.append(f'      <section class="grp" data-grp="context" aria-labelledby="{i}-g-context">\n'
                     f'        <h4 class="gh" id="{i}-g-context">Context and limits</h4>\n' + '\n'.join(ctx) + '\n      </section>')
    parts.append(f'      <section class="grp" data-grp="review" aria-labelledby="{i}-g-review">\n'
                 f'        <h4 class="gh" id="{i}-g-review">Review and changes</h4>\n'
                 f'        {rev_line(i, x["evidence_reviewed"], x["revisions"], changes)}\n      </section>')
    spec = f' · specimen {e(f["specimen"])}' if f.get('specimen') else ''
    return (f'    <article class="entry ep find" id="{i}" aria-labelledby="{i}-h">\n'
            f'      <h3 class="eh" id="{i}-h" tabindex="-1">{e(x["title"])}</h3>\n'
            f'      <p class="scope fattr" id="{i}-attr">{e(find_attr(x))}</p>\n'
            f'      <p class="fplace" id="{i}-place">{e(f["context"][0].upper() + f["context"][1:])} · {e(f["site"])}, {e(f["where"])}{spec}</p>\n'
            + '\n'.join(parts) + '\n    </article>')


def change_item(c, cat):
    """One public change record, as a reader sees it."""
    ents = {x['id']: x for x in cat['entries'] + cat['shelf']}
    cid = 'change-' + c['id']
    if c['kind'] == 'added':
        return f'        <li class="chgrec" id="{e(cid)}" tabindex="-1">{e(c["text"])}</li>'
    ent = ents[c['entries'][0]]
    reviewed = f'The entry\'s evidence was last reviewed {tdate(ent["evidence_reviewed"]["date"])}.'
    opener = (f'<a class="chgopen" id="{e(cid)}-open" href="#{e(ent["id"])}" data-entry="{e(ent["id"])}" data-opener="change">Open the entry</a>')
    if c['what'] == 'account':
        was = f' The earlier line "{e(c["retired"])}" is retired.' if c.get('retired') else ''
        body = f'<b>{e(c["title"])}</b> {e(c["text"])}{was} Why: {e(c["why"])}. {e(c["unchanged"])} {reviewed} {opener}'
    elif c['what'] == 'wording':
        body = (f'<b>{e(c["title"])}</b> The label "{e(c["before"]["label"])}" now reads "{e(c["after"]["label"])}", with the matching change '
                f'in the entry text. Why: {e(c["why"])}. {e(c["unchanged"])} {reviewed} {opener}')
    else:  # date: old and new side by side, each with its own citation and checked date
        body = (f'<b>{e(c["title"])}</b> Was: <span class="was">{snap_line(c["before"])}</span>. Now: <span class="now">{snap_line(c["after"])}</span>. '
                f'Why: {e(c["why"])}. {reviewed} {opener}')
    return f'        <li class="chgrec" id="{e(cid)}" tabindex="-1">{body}</li>'


def changes_section(cat):
    out = ['  <section id="changes" class="changes" aria-labelledby="changes-h">', '    <h3 id="changes-h">What changed</h3>']
    for r in reversed(cat['releases']):  # newest first
        note = f' ({e(r["note"])})' if r.get('note') else ''
        out += [f'    <section class="rel" id="rel-{e(r["revision"])}" aria-labelledby="rel-{e(r["revision"])}-h">',
                f'      <h4 id="rel-{e(r["revision"])}-h">{tdate(r["release_date"])} — revision {e(r["revision"])}{note}</h4>', '      <ul>']
        out += [change_item(c, cat) for c in cat['changes'] if c['revision'] == r['revision']]
        out += ['      </ul>', '    </section>']
    return out + ['  </section>']


def render(page, cat, sha):
    xs = [json.loads(p.read_text(encoding='utf-8')) for p in ENTRIES]
    shelf = [x for x in xs if x['placement']['kind'] == 'no-year-shelf']
    shelf.sort(key=lambda x: (x['placement']['day_of_year_order']['month'], x['placement']['day_of_year_order']['day']))
    eps = [x for x in cat['entries'] if x['lane'] == 'extinctions']
    fs = [x for x in cat['entries'] if x['lane'] == 'relatives']
    cards = '\n'.join(card(x) for x in shelf)
    ep_cards = '\n'.join(ep_card(x) for x in eps)
    srev = {x['id']: x['revisions'] for x in cat['shelf']}
    full = ('\n'.join(entry(x, srev[x['id']], cat['changes']) for x in xs) + '\n'
            + '\n'.join(ep_article(x, cat['changes']) for x in eps)
            + ''.join('\n' + find_article(x, cat['changes']) for x in fs))
    rel = cat['release']
    n_in = {'extinctions': len(eps), 'relatives': len(fs)}
    find_block = [] if not fs else [
        '  <section id="finds" class="dated finds" aria-labelledby="finds-h">',
        f'    <h3 id="finds-h">{e(next(l["label"] for l in cat["lanes"] if l["id"] == "relatives"))} <span class="n">({len(fs)})</span></h3>',
        f'    <p class="note" id="finds-note">{e(cat["find_note"])}</p>',
        '    <ul class="cards">',
        '\n'.join(find_card(x) for x in fs),
        '    </ul>',
        '  </section>',
        '']
    lanes = '\n'.join(f'      <li class="lane" data-lane="{l["id"]}">{e(l["label"])}'
                      + (f' <span class="n">({n_in[l["id"]]})</span>' if l['status'] == 'active' else f' · {e(l["status"])}') + '</li>'
                      for l in cat['lanes'])
    v = asset_version(page)
    ext = '<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span>'
    return '\n'.join([
        BEGIN,
        f'  <section id="axis-wrap" class="axiswrap" aria-labelledby="axis-h" data-catalogue-sha="{sha}" '
        f'data-catalogue-rev="{e(cat["catalogue_revision"])}" data-build="{v}"' + (f' data-catalogue-schema="{cat["schema"]}"' if cat['schema'] >= 3 else '') + '>',
        '    <h3 id="axis-h">Deep time</h3>',
        f'    <p class="coverage">{e(cat["coverage"])}</p>',
        f'    <p class="updated" id="tl-updated">Revision {e(rel["revision"])}, released {tdate(rel["release_date"])} · <a id="tl-changes-link" href="#changes">What changed</a></p>',
        '    <div id="axis" class="axis" hidden></div>',
        '    <p id="axis-off" class="axisoff" role="status" hidden>The timeline axis is unavailable right now; every entry, date and source is listed below.</p>',
        '    <noscript><p class="axisoff">The timeline axis needs JavaScript; every entry, date and source is listed below.</p></noscript>',
        '    <ul class="lanes" aria-label="Lanes">',
        lanes,
        '    </ul>',
        f'    <p class="credit">{e(cat["credit"])} <a href="https://stratigraphy.org/chart/" target="_blank" rel="noopener">ICS chart {ext}</a> · '
        f'<a href="{e(cat["chart"]["licence_url"])}" target="_blank" rel="noopener">CC BY 4.0 {ext}</a> · {e(cat["chart"]["citation"])}.</p>',
        '  </section>',
        '',
        f'  <p class="counts"><a href="#dated">Dated entries ({len(eps)})</a> · ' + (f'<a href="#finds">Dated finds ({len(fs)})</a> · ' if fs else '') + f'<a href="#shelf">Dates without a year ({len(shelf)})</a></p>',
        '',
        '  <section id="dated" class="dated" aria-labelledby="dated-h">',
        f'    <h3 id="dated-h">Dated entries <span class="n">({len(eps)})</span></h3>',
        '    <p class="note">Entries are placed at the precision their sources support. Mass extinctions, oldest first.</p>',
        '    <ul class="cards">',
        ep_cards,
        '    </ul>',
        '  </section>',
        '',
        *find_block,
        '  <section id="shelf" class="shelf" aria-labelledby="shelf-h">',
        f'    <h3 id="shelf-h">Dates without a year <span class="n">({len(shelf)})</span></h3>',
        '    <p class="note">Shown here, not on the axis, because their source gives a day and month but no year. Ordered by day of year only; nothing here implies a year.</p>',
        '    <ul class="cards">',
        cards,
        '    </ul>',
        '  </section>',
        '',
        '  <section id="entries" class="entries" aria-label="Entries in full">',
        full,
        '  </section>',
        '',
        *changes_section(cat),
        '  ' + END])


def main():
    path = pathlib.Path(sys.argv[sys.argv.index('--page') + 1]) if '--page' in sys.argv else PAGE
    page = path.read_text(encoding='utf-8')
    cb = cat_bytes(); sha = hashlib.sha256(cb).hexdigest(); cat = json.loads(cb)
    a, b = page.index(BEGIN), page.index(END) + len(END)
    new = page[:a] + render(page, cat, sha) + page[b:]
    v = asset_version(page)
    js = JSF.read_text(encoding='utf-8')
    m = re.search(r"const BUILD = '(\d+)';", js)
    # the image files a story serves: copied from the source folder to assets/timeline/<revision>/ beside the page, byte for byte,
    # with SOURCE.json (where they came from). Only for the real page; a --page build elsewhere is the preview helper's job.
    pub = ROOT / 'assets/timeline' / BUILD['catalogue_revision']
    want = {}
    if path == PAGE:
        files = {r['file'] for x in cat['entries'] if x.get('story') and x['story'].get('image') for r in x['story']['image']['renditions']}
        want = {f: (ASSETS / f).read_bytes() for f in sorted(files | ({'SOURCE.json'} if files else set()))}
    if '--check' in sys.argv:
        bad = []
        for f, by in want.items():
            if not (pub / f).is_file() or (pub / f).read_bytes() != by: bad.append(f'assets/timeline/{BUILD["catalogue_revision"]}/{f} is missing or is not the source file')
        if want and sorted(q.name for q in pub.iterdir()) != sorted(want): bad.append(f'assets/timeline/{BUILD["catalogue_revision"]}/ holds a file the catalogue does not name')
        if new != page: bad.append(f'{path.name} differs from the generator output')
        if not CAT_PATH.exists() or CAT_PATH.read_bytes() != cb: bad.append(f'{CAT_PATH.name} differs from the generator output')
        if not m or m.group(1) != v: bad.append(f'timeline.js BUILD ({m and m.group(1)}) != page asset version {v}')
        if bad:
            print('\n'.join(bad)); sys.exit(1)
        print(f'{path.name}, {CAT_PATH.name} (sha256 {sha}) and timeline.js BUILD {v} match the generator output'); return
    CAT_PATH.parent.mkdir(exist_ok=True)
    CAT_PATH.write_bytes(cb)
    if want:
        pub.mkdir(parents=True, exist_ok=True)
        for f, by in want.items():
            (pub / f).write_bytes(by)
    path.write_text(new, encoding='utf-8')
    if not m or m.group(1) != v:
        print(f'WARNING: timeline.js BUILD must be {v}')
    print(f'{path.name} written; {CAT_PATH.name} {len(cb)} B sha256 {sha}')


if __name__ == '__main__':
    main()
