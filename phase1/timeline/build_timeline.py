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

Deterministic: output depends only on the source JSON (chart-v2026-06.5.json, big5.json, entry-*.json, BUILD.json).
The catalogue (phase1/timeline/catalogue/<revision>.json) is the single source for the hub route /catalogue/timeline
and for the pre-rendered list; the page embeds its sha256 and the build id (= the ?v= asset version), and the script
draws the axis only when both match (TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §3–§4). Everything between
<!-- TIMELINE:BEGIN --> and <!-- TIMELINE:END --> is generated; edit the JSON, not the HTML.
"""
import hashlib, html, json, pathlib, re, sys

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


def boundary_text(key):
    b = CHART['boundaries'][key]
    pm = f" ± {pmn(b['margin'])}" if b['margin'] is not None else ''
    return f"{BOUNDARY_NAMES[key]} {'~' if b['approximate'] else ''}{num(b['ma'])}{pm} Ma"


def src_obj(key):
    if key is None:
        return None
    s = dict(BIG5['sources'][key]); s['key'] = key; s['url'] = 'https://doi.org/' + s['doi']
    return s


def revisions_of(entry_id):  # change ids that REVISED this entry (its first appearance is not a revision)
    return [c['id'] for c in CHANGES['changes'] if c['kind'] == 'revised' and entry_id in c['entries']]


def catalogue():
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
            claims.append(d)
        b = CHART['boundaries'][ep['chart_boundary']]
        claims.append({'claim_type': 'chart_boundary', 'label': CLAIM_LABELS['chart_boundary'], 'axis': False,
                       'boundary': BOUNDARY_NAMES[ep['chart_boundary']],
                       'when': {'type': 'boundary_age', 'ma': b['ma'], 'pm': b['margin'], 'approximate': b['approximate']},
                       'when_text': boundary_text(ep['chart_boundary']),
                       'text': 'Shown beside the source value, not merged with it. The chart supplies the boundary only, not the event date.',
                       'source': None, 'locator': None})
        eps.append({'id': ep['id'], 'lane': 'extinctions', 'title': ep['title'], 'short': ep['short'], 'axis': True,
                    'scope': ep.get('scope'), 'claims': claims, 'evidence_reviewed': ep.get('evidence_reviewed'),
                    'revisions': revisions_of(ep['id'])})
    pliny = json.loads(ENTRIES[0].read_text(encoding='utf-8'))
    shelf = [{'id': pliny['id'], 'lane': 'history', 'title': pliny['title']['text'], 'axis': False,
              'when': {'type': 'partial_date', 'day': pliny['date_line']['day'],
                       'calendar': pliny['date_line']['calendar_label'].strip('()'), 'year': None},
              'note': 'Day and month only; never placed on the axis.', 'evidence_reviewed': pliny.get('evidence_reviewed'),
              'revisions': revisions_of(pliny['id'])}]
    src = CHART['source']
    return {
        'catalogue': 'timeline', 'catalogue_revision': BUILD['catalogue_revision'], 'schema': BUILD['schema'],
        'generated_at': BUILD['generated_at'],
        'release': {'revision': BUILD['catalogue_revision'], 'release_date': BUILD['release_date'], 'previous': BUILD['previous']},
        'releases': CHANGES['releases'], 'changes': CHANGES['changes'],
        'chart': {'name': src['name'], 'tag': src['tag'], 'commit': src['commit'], 'file_sha256': src['file_sha256'],
                  'licence': src['licence'], 'licence_url': src['licence_url'], 'citation': src['citation'], 'units': 'Ma',
                  'margin_meaning': src['margin_meaning'], 'window': CHART['window'], 'overview': CHART['overview'],
                  'periods': CHART['periods']},
        'lanes': [{'id': i, 'label': l, 'status': 'active' if i == 'extinctions' else EMPTY[i]} for i, l in LANES],
        'claim_labels': CLAIM_LABELS,
        'coverage': 'This release shows the conventional Big Five mass extinctions, placed on the ICS chart. '
                    'Empty stretches are not periods where nothing happened. Lanes fill as their evidence is checked.',
        'entries': eps, 'shelf': shelf,
        'credit': 'Chart: ICS International Chronostratigraphic Chart v2026-06 (CC BY 4.0). Episode sources as cited in each '
                  'entry (CC BY 4.0 unless stated). Values reformatted by Mother Earth.',
    }


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
            if c['what'] not in ('wording', 'date') or not c.get('short') or not c.get('why') or len(c['entries']) != 1: no(f"{c['id']} is incomplete")
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
    # privacy: inbox fields and private paths stay out of shipped data
    low = cb.decode('utf-8').lower()
    for bad in (r'tl-in-\d', r'timeline-inbox/', r'(?<!docs/)research/', r'_review/', r'/users/', r'_to_delete'):
        if re.search(bad, low): no(f'shipped data contains a private reference ({bad})')


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
            f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(s["licence"])}. {e(s["status"])}.</p>')


def snap_line(v):  # one side of a date change, with ITS OWN citation and checked date (not the entry's current source)
    sn = v['source']
    loc = f' · {e(sn["locator"])}' if sn.get('locator') else ''
    return (f'{e(v["when_text"])} — {e(sn["citation"])}{loc}. <a href="{e(sn["url"])}" target="_blank" rel="noopener">source '
            f'<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a> · licence: {e(sn["licence"])} · checked {tdate(sn["checked"])}')


def ep_article(ep, changes=()):
    i = ep['id']; parts = []
    by = {c['id']: c for c in changes}
    for n, c in enumerate(ep['claims']):
        cid = f'{i}-c{n}'
        val = f'<p class="cval">{e(c["when_text"])}</p>' if c.get('when_text') else ''
        asm = ('<p>Assumes: ' + '; '.join(e(a) for a in c['assumptions']) + '.</p>') if c.get('assumptions') else ''
        also = src_line(c.get('also'), None) if c.get('also') else ''
        parts.append(f'      <section class="es claim" id="{cid}" data-claim-type="{c["claim_type"]}" aria-labelledby="{cid}-h">\n'
                     f'        <h4 id="{cid}-h">{e(c["label"])}</h4>\n'
                     f'        {val}<p>{e(c["text"])}</p>{asm}\n'
                     f'        {src_line(c.get("source"), c.get("locator"))}{also}\n'
                     f'      </section>')
    for r in ep['revisions']:  # an earlier date stays visible in the entry, labelled with the revision that showed it
        c = by[r]
        if c['what'] != 'date':
            continue
        was = next(x['revision'] for x in reversed(REL_BEFORE[c['revision']]))
        parts.append(f'      <section class="es earlier" id="{i}-earlier-{e(r)}" aria-labelledby="{i}-earlier-{e(r)}-h">\n'
                     f'        <h4 id="{i}-earlier-{e(r)}-h">Earlier dating</h4>\n'
                     f'        <p>Shown in revision {e(was)}: <span class="was">{snap_line(c["before"])}</span>.</p>\n'
                     f'      </section>')
    scope = f'\n      <p class="scope">{e(ep["scope"])}</p>' if ep.get('scope') else ''
    return (f'    <article class="entry ep" id="{i}" aria-labelledby="{i}-h">\n'
            f'      <h3 class="eh" id="{i}-h" tabindex="-1">{e(ep["title"])}</h3>{scope}\n'
            + '\n'.join(parts) + f'\n      {rev_line(i, ep["evidence_reviewed"], ep["revisions"], changes)}\n    </article>')


def change_item(c, cat):
    """One public change record, as a reader sees it."""
    ents = {x['id']: x for x in cat['entries'] + cat['shelf']}
    cid = 'change-' + c['id']
    if c['kind'] == 'added':
        return f'        <li class="chgrec" id="{e(cid)}" tabindex="-1">{e(c["text"])}</li>'
    ent = ents[c['entries'][0]]
    reviewed = f'The entry\'s evidence was last reviewed {tdate(ent["evidence_reviewed"]["date"])}.'
    opener = (f'<a class="chgopen" id="{e(cid)}-open" href="#{e(ent["id"])}" data-entry="{e(ent["id"])}" data-opener="change">Open the entry</a>')
    if c['what'] == 'wording':
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
    eps = cat['entries']
    cards = '\n'.join(card(x) for x in shelf)
    ep_cards = '\n'.join(ep_card(x) for x in eps)
    srev = {x['id']: x['revisions'] for x in cat['shelf']}
    full = ('\n'.join(entry(x, srev[x['id']], cat['changes']) for x in xs) + '\n'
            + '\n'.join(ep_article(x, cat['changes']) for x in eps))
    rel = cat['release']
    lanes = '\n'.join(f'      <li class="lane" data-lane="{l["id"]}">{e(l["label"])}'
                      + (f' <span class="n">({len(eps)})</span>' if l['status'] == 'active' else f' · {e(l["status"])}') + '</li>'
                      for l in cat['lanes'])
    v = asset_version(page)
    ext = '<span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span>'
    return '\n'.join([
        BEGIN,
        f'  <section id="axis-wrap" class="axiswrap" aria-labelledby="axis-h" data-catalogue-sha="{sha}" '
        f'data-catalogue-rev="{e(cat["catalogue_revision"])}" data-build="{v}">',
        '    <h3 id="axis-h">Deep time</h3>',
        f'    <p class="coverage">{e(cat["coverage"])}</p>',
        f'    <p class="updated" id="tl-updated">Timeline page updated {tdate(rel["release_date"])} · revision {e(rel["revision"])} · <a id="tl-changes-link" href="#changes">What changed</a></p>',
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
        f'  <p class="counts"><a href="#dated">Dated entries ({len(eps)})</a> · <a href="#shelf">Dates without a year ({len(shelf)})</a></p>',
        '',
        '  <section id="dated" class="dated" aria-labelledby="dated-h">',
        f'    <h3 id="dated-h">Dated entries <span class="n">({len(eps)})</span></h3>',
        '    <p class="note">Entries are placed at the precision their sources support. Mass extinctions, oldest first.</p>',
        '    <ul class="cards">',
        ep_cards,
        '    </ul>',
        '  </section>',
        '',
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
    if '--check' in sys.argv:
        bad = []
        if new != page: bad.append(f'{path.name} differs from the generator output')
        if not CAT_PATH.exists() or CAT_PATH.read_bytes() != cb: bad.append(f'{CAT_PATH.name} differs from the generator output')
        if not m or m.group(1) != v: bad.append(f'timeline.js BUILD ({m and m.group(1)}) != page asset version {v}')
        if bad:
            print('\n'.join(bad)); sys.exit(1)
        print(f'{path.name}, {CAT_PATH.name} (sha256 {sha}) and timeline.js BUILD {v} match the generator output'); return
    CAT_PATH.parent.mkdir(exist_ok=True)
    CAT_PATH.write_bytes(cb)
    path.write_text(new, encoding='utf-8')
    if not m or m.group(1) != v:
        print(f'WARNING: timeline.js BUILD must be {v}')
    print(f'{path.name} written; {CAT_PATH.name} {len(cb)} B sha256 {sha}')


if __name__ == '__main__':
    main()
