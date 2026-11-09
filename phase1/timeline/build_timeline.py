#!/usr/bin/env python3
"""Pre-render the Timeline entry into timeline.html (U8: the page works with JavaScript off).

Usage:
  python3 phase1/timeline/build_timeline.py          # rewrite the block between the markers
  python3 phase1/timeline/build_timeline.py --check  # exit 1 if timeline.html differs from the generator's output
  ... --check --page <file>                           # check another copy (used by the tests)

Deterministic: output depends only on the entry JSON. Everything between
<!-- TIMELINE:BEGIN --> and <!-- TIMELINE:END --> in timeline.html is generated; edit the JSON, not the HTML.
"""
import html, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / 'timeline.html'
ENTRIES = [ROOT / 'phase1/timeline/entry-pliny-ep-6-16.json']
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


def render():
    xs = [json.loads(p.read_text(encoding='utf-8')) for p in ENTRIES]
    shelf = [x for x in xs if x['placement']['kind'] == 'no-year-shelf']
    shelf.sort(key=lambda x: (x['placement']['day_of_year_order']['month'], x['placement']['day_of_year_order']['day']))
    dated = [x for x in xs if x['placement']['axis']]
    cards = '\n'.join(card(x) for x in shelf)
    full = '\n'.join(entry(x) for x in xs)
    return f'''{BEGIN}
  <p class="counts"><a href="#dated">Dated entries ({len(dated)})</a> · <a href="#shelf">Dates without a year ({len(shelf)})</a></p>

  <section id="shelf" class="shelf" aria-labelledby="shelf-h">
    <h3 id="shelf-h">Dates without a year <span class="n">({len(shelf)})</span></h3>
    <p class="note">Shown here, not on the axis, because their source gives a day and month but no year. Ordered by day of year only; nothing here implies a year.</p>
    <ul class="cards">
{cards}
    </ul>
  </section>

  <section id="dated" class="dated" aria-labelledby="dated-h">
    <h3 id="dated-h">Dated entries <span class="n">({len(dated)})</span></h3>
    <p class="note">Entries are placed at the precision their sources support. There are none yet.</p>
  </section>

  <section id="entries" class="entries" aria-label="Entries in full">
{full}
  </section>
  {END}'''


def main():
    path = pathlib.Path(sys.argv[sys.argv.index('--page') + 1]) if '--page' in sys.argv else PAGE
    page = path.read_text(encoding='utf-8')
    a, b = page.index(BEGIN), page.index(END) + len(END)
    new = page[:a] + render() + page[b:]
    if '--check' in sys.argv:
        if new != page:
            print(f'{path.name} differs from the generator output'); sys.exit(1)
        print(f'{path.name} matches the generator output'); return
    path.write_text(new, encoding='utf-8')
    print('timeline.html written')


if __name__ == '__main__':
    main()
