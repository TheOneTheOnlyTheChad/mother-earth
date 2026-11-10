#!/usr/bin/env python3
"""Build the Timeline catalogue and pre-render it into timeline.html (works with JavaScript off).

Usage:
  python3 phase1/timeline/build_timeline.py          # write the catalogue file and the block between the markers
  python3 phase1/timeline/build_timeline.py --check  # exit 1 if timeline.html, the catalogue file or timeline.js's BUILD differ
  ... --check --page <file>                           # check another copy (used by the tests)

Deterministic: output depends only on the source JSON (chart-v2026-06.5.json, big5.json, entry-*.json, BUILD.json).
The catalogue (phase1/timeline/catalogue/<revision>.json) is the single source for the hub route /catalogue/timeline
and for the pre-rendered list; the page embeds its sha256 and the build id (= the ?v= asset version), and the script
draws the axis only when both match (TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1 §3–§4). Everything between
<!-- TIMELINE:BEGIN --> and <!-- TIMELINE:END --> is generated; edit the JSON, not the HTML.
"""
import hashlib, html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / 'timeline.html'
TL = ROOT / 'phase1/timeline'
ENTRIES = [TL / 'entry-pliny-ep-6-16.json']
JSF = ROOT / 'timeline.js'
BUILD = json.loads((TL / 'BUILD.json').read_text(encoding='utf-8'))
CHART = json.loads((TL / 'chart-v2026-06.5.json').read_text(encoding='utf-8'))
BIG5 = json.loads((TL / 'big5.json').read_text(encoding='utf-8'))
LANES = [('earth-life', 'Earth systems and life'), ('extinctions', 'Mass extinctions'),
         ('relatives', 'Human relatives'), ('history', 'Human history')]
EMPTY = {'earth-life': 'No entries yet', 'relatives': 'No entries yet', 'history': 'No dated entries on the axis yet'}
# fixed labels per claim type (proposal rev 1.1 §3); the script refuses a catalogue whose labels differ
CLAIM_LABELS = {
    'extinction_interval_approx': 'Approximate extinction interval',
    'boundary_age_bound': 'Boundary age: no older than',
    'boundary_age_range_modelled': 'Modelled boundary-age range',
    'extinction_onset_estimate': 'Estimated extinction onset',
    'extinction_horizon_approx': 'Approximate age of the extinction horizon',
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


def entry(x):
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
                    'scope': ep.get('scope'), 'claims': claims, 'revisions': []})
    pliny = json.loads(ENTRIES[0].read_text(encoding='utf-8'))
    shelf = [{'id': pliny['id'], 'lane': 'history', 'title': pliny['title']['text'], 'axis': False,
              'when': {'type': 'partial_date', 'day': pliny['date_line']['day'],
                       'calendar': pliny['date_line']['calendar_label'].strip('()'), 'year': None},
              'note': 'Day and month only; never placed on the axis.'}]
    src = CHART['source']
    return {
        'catalogue': 'timeline', 'catalogue_revision': BUILD['catalogue_revision'], 'schema': BUILD['schema'],
        'generated_at': BUILD['generated_at'],
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
    return (json.dumps(catalogue(), ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')


CAT_PATH = TL / 'catalogue' / (BUILD['catalogue_revision'] + '.json')


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


def ep_article(ep):
    i = ep['id']; parts = []
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
    scope = f'\n      <p class="scope">{e(ep["scope"])}</p>' if ep.get('scope') else ''
    return (f'    <article class="entry ep" id="{i}" aria-labelledby="{i}-h">\n'
            f'      <h3 class="eh" id="{i}-h" tabindex="-1">{e(ep["title"])}</h3>{scope}\n'
            + '\n'.join(parts) + '\n    </article>')


def render(page, cat, sha):
    xs = [json.loads(p.read_text(encoding='utf-8')) for p in ENTRIES]
    shelf = [x for x in xs if x['placement']['kind'] == 'no-year-shelf']
    shelf.sort(key=lambda x: (x['placement']['day_of_year_order']['month'], x['placement']['day_of_year_order']['day']))
    eps = cat['entries']
    cards = '\n'.join(card(x) for x in shelf)
    ep_cards = '\n'.join(ep_card(x) for x in eps)
    full = '\n'.join(entry(x) for x in xs) + '\n' + '\n'.join(ep_article(x) for x in eps)
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
    print(f'timeline.html written; {CAT_PATH.relative_to(ROOT)} {len(cb)} B sha256 {sha}')


if __name__ == '__main__':
    main()
