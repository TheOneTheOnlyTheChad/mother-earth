#!/usr/bin/env python3
"""Mother Earth — build the Animals page's Red List assessment file from the hand-kept record
(animals-assessment-rc; docs/concepts/ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF.md rev 1, with GPT's three clarifications).

    python3 -I phase1/animals/build_assessments.py [--source phase1/animals/red-list-assessments.json] [--out-dir assets/animals] [--today YYYY-MM-DD] [--check]

There is no downloaded source file: the record is typed by hand from the Red List's own pages and checked by a second reader.
This builder cannot know whether a typed value is what the Red List says. It refuses records that are malformed or that break
the rules below ("BUILD STOPPED", exit 2; nothing is written). Whether the values are RIGHT is tested separately, against the
reviewed evidence record, in build_assessments.test.py.
  1. Only known keys, in the file and in each record. An unknown key stops the build: that is how a trend, criteria string,
     regional category, population number or Green Status value is kept out.
  2. One record per card, each card once.
  3. `category` is one of the Red List's category names, in full words. `scope` is exactly "global".
  4. `assessment_id` has the form e.T<taxon>A<assessment>; `url` and `doi_url` carry the same two numbers; the citation
     names the same identifier and the scientific name, and carries no "Accessed" date (that date is the website's, not ours).
  5. Dates, each at the precision it has, none invented: `assessed` is a full date; `published_year` is a year, not before the
     assessment's year. `version_note` is null, or "amended" with the year of the assessment it amends (not before the
     assessment's year, not after the published year), or "errata" with the errata's own year (not before the published year).
  6. `status` is "usable" or "suppressed". A suppressed record gives a `suppressed_reason`; a usable one has none.
  7. Check dates are ours: `last_successful_check` is not after today and not before the assessment; `edition_at_check` has
     the form YYYY-N and its year is not after the check's.
  8. `last_attempt` is not before the last successful check and not after today. Result "ok" means its date IS the last
     successful check. Result "failed" leaves the last successful check where it was.
  9. `next_check_due` is exactly the last successful check plus the file's cadence in months. A failed attempt cannot move it.
 10. `shown` says what the card shows: a journey (animal, place, years) or a census (years).
Output: assessments-<rev>.json, the records as given plus nothing computed except a count. Its sha256 is pinned in
animals-assessment.js; the page shows no category from a file that differs.
--check rebuilds in memory and compares: exit 0 when the shipped file is present and identical, 3 otherwise."""
import argparse, datetime, hashlib, json, os, re, sys

sha = lambda b: hashlib.sha256(b).hexdigest()
CATEGORIES = ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild', 'Extinct', 'Data Deficient']
TOP_KEYS = {'schema', 'revision', 'note', 'source', 'cadence_months', 'records'}
REC_KEYS = {'card', 'common_name', 'scientific_name', 'assessment_id', 'url', 'doi_url', 'citation', 'scope', 'category', 'assessed', 'published_year', 'version_note',
            'shown', 'status', 'suppressed_reason', 'edition_at_check', 'last_successful_check', 'last_attempt', 'next_check_due'}
REQUIRED = REC_KEYS - {'suppressed_reason'}
ID = re.compile(r'^e\.T([1-9][0-9]*)A([1-9][0-9]*)$')
ISO = re.compile(r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$')

class BuildError(Exception):
    pass

def day(s, what):
    if not isinstance(s, str) or not ISO.match(s):
        raise BuildError(f'{what} is not a full date written YYYY-MM-DD: {s!r}')
    try:
        return datetime.date.fromisoformat(s)
    except ValueError:
        raise BuildError(f'{what} is not a real date: {s!r}')

def year(v, what):
    if not isinstance(v, int) or isinstance(v, bool) or not 1960 <= v <= 2100:
        raise BuildError(f'{what} is not a year: {v!r}')
    return v

def add_months(d, n):
    m = d.month - 1 + n
    y, m = d.year + m // 12, m % 12 + 1
    last = (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).day
    return datetime.date(y, m, min(d.day, last))

def text(v, what):
    if not isinstance(v, str) or not v.strip() or v != v.strip():
        raise BuildError(f'{what} is missing, empty or has stray spaces: {v!r}')
    return v

def check_record(r, cadence, today):
    if not isinstance(r, dict):
        raise BuildError('a record is not an object')
    card = r.get('card')
    w = lambda f: f'{card}: {f}'
    extra, missing = set(r) - REC_KEYS, REQUIRED - set(r)
    if extra:
        raise BuildError(w(f'unknown key(s) {sorted(extra)}; nothing beyond the listed fields may be stored'))
    if missing:
        raise BuildError(w(f'missing key(s) {sorted(missing)}'))
    for f in ('card', 'common_name', 'scientific_name', 'citation', 'url', 'doi_url'):
        text(r[f], w(f))
    if not re.match(r'^[A-Z][a-z]+ [a-z]+$', r['scientific_name']):
        raise BuildError(w(f'scientific_name is not a two-part species name: {r["scientific_name"]!r}'))
    if r['category'] not in CATEGORIES:
        raise BuildError(w(f'category {r["category"]!r} is not a Red List category name in full words'))
    if r['scope'] != 'global':
        raise BuildError(w(f'scope must be "global"; found {r["scope"]!r}'))
    m = ID.match(r['assessment_id'] if isinstance(r['assessment_id'], str) else '')
    if not m:
        raise BuildError(w(f'assessment_id is not of the form e.T<taxon>A<assessment>: {r["assessment_id"]!r}'))
    taxon, assess = m.groups()
    if r['url'] != f'https://www.iucnredlist.org/species/{taxon}/{assess}':
        raise BuildError(w('url does not carry the assessment identifier\'s two numbers'))
    if not re.match(rf'^https://dx\.doi\.org/10\.2305/IUCN\.UK\.[0-9]{{4}}-[0-9]\.RLTS\.T{taxon}A{assess}\.en$', r['doi_url']):
        raise BuildError(w('doi_url does not carry the assessment identifier'))
    if r['assessment_id'] not in r['citation'] or r['scientific_name'] not in r['citation']:
        raise BuildError(w('the citation does not name this assessment identifier and scientific name'))
    if 'ccessed' in r['citation']:
        raise BuildError(w('the citation carries an "Accessed" date; that is the website\'s date and is never stored'))
    a = day(r['assessed'], w('assessed'))
    py = year(r['published_year'], w('published_year'))
    if py < a.year:
        raise BuildError(w(f'published_year {py} is before the assessment year {a.year}'))
    v = r['version_note']
    if v is not None:
        if not isinstance(v, dict) or v.get('kind') not in ('amended', 'errata'):
            raise BuildError(w('version_note must be null, or of kind "amended" or "errata"'))
        if v['kind'] == 'amended':
            if set(v) != {'kind', 'of_year'}:
                raise BuildError(w('an amended note holds exactly kind and of_year'))
            oy = year(v['of_year'], w('version_note.of_year'))
            if not a.year <= oy <= py:
                raise BuildError(w(f'an amended version of the {oy} assessment cannot sit with assessment year {a.year} and published year {py}'))
        else:
            if set(v) != {'kind', 'year'}:
                raise BuildError(w('an errata note holds exactly kind and year'))
            ey = year(v['year'], w('version_note.year'))
            if ey < py:
                raise BuildError(w(f'an errata version of {ey} cannot come before publication in {py}'))
    if r['status'] not in ('usable', 'suppressed'):
        raise BuildError(w(f'status must be "usable" or "suppressed"; found {r["status"]!r}'))
    if r['status'] == 'suppressed':
        text(r.get('suppressed_reason'), w('suppressed_reason'))
    elif 'suppressed_reason' in r:
        raise BuildError(w('a usable record carries no suppressed_reason'))
    ok = day(r['last_successful_check'], w('last_successful_check'))
    if ok > today:
        raise BuildError(w(f'last_successful_check {ok} is after today, {today}'))
    if ok < a:
        raise BuildError(w('last_successful_check is before the assessment date'))
    em = re.match(r'^([0-9]{4})-[1-9]$', r['edition_at_check'] if isinstance(r['edition_at_check'], str) else '')
    if not em or int(em.group(1)) > ok.year:
        raise BuildError(w(f'edition_at_check {r["edition_at_check"]!r} is not YYYY-N, or is later than the check'))
    la = r['last_attempt']
    if not isinstance(la, dict) or set(la) != {'date', 'result'} or la['result'] not in ('ok', 'failed'):
        raise BuildError(w('last_attempt holds exactly a date and a result of "ok" or "failed"'))
    ad = day(la['date'], w('last_attempt.date'))
    if ad > today:
        raise BuildError(w(f'last_attempt {ad} is after today, {today}'))
    if ad < ok:
        raise BuildError(w('last_attempt is before the last successful check'))
    if la['result'] == 'ok' and ad != ok:
        raise BuildError(w('a successful last attempt IS the last successful check; the two dates differ'))
    due = day(r['next_check_due'], w('next_check_due'))
    if due != add_months(ok, cadence):
        raise BuildError(w(f'next_check_due must be the last successful check plus {cadence} months ({add_months(ok, cadence)}); found {due}. A failed attempt does not move it'))
    s = r['shown']
    if not isinstance(s, dict) or s.get('kind') not in ('journey', 'census'):
        raise BuildError(w('shown.kind must be "journey" or "census"'))
    want = {'kind', 'first_year', 'last_year'} | ({'animal', 'place'} if s['kind'] == 'journey' else set())
    if set(s) - {'stock_not_verified'} != want or (s['kind'] == 'census' and 'stock_not_verified' in s) or s.get('stock_not_verified', True) is not True:
        raise BuildError(w(f'shown holds exactly {sorted(want)} (a journey may add stock_not_verified: true)'))
    if year(s['first_year'], w('shown.first_year')) > year(s['last_year'], w('shown.last_year')):
        raise BuildError(w('shown years are out of order'))
    if s['kind'] == 'journey':
        text(s['animal'], w('shown.animal')); text(s['place'], w('shown.place'))

def build(cfg, today):
    if not isinstance(cfg, dict) or set(cfg) != TOP_KEYS:
        raise BuildError(f'the record file must hold exactly {sorted(TOP_KEYS)}')
    if cfg['schema'] != 1 or not re.match(r'^R[1-9][0-9]*$', str(cfg['revision'])):
        raise BuildError('schema must be 1 and revision of the form R<n>')
    src = cfg['source']
    if not isinstance(src, dict) or set(src) != {'name', 'terms', 'terms_url'}:
        raise BuildError('source holds exactly name, terms and terms_url')
    cad = cfg['cadence_months']
    if not isinstance(cad, int) or isinstance(cad, bool) or not 1 <= cad <= 24:
        raise BuildError('cadence_months must be a whole number of months, 1 to 24')
    recs = cfg['records']
    if not isinstance(recs, list) or not recs:
        raise BuildError('there are no records')
    for r in recs:
        check_record(r, cad, today)
    cards = [r['card'] for r in recs]
    if len(set(cards)) != len(cards):
        raise BuildError('a card has more than one record')
    ids = [r['assessment_id'] for r in recs]
    if len(set(ids)) != len(ids):
        raise BuildError('an assessment identifier is used by more than one record')
    out = {'schema': 1, 'kind': 'red-list-assessments', 'revision': cfg['revision'], 'source': src, 'cadence_months': cad, 'record_count': len(recs), 'records': recs}
    return f'assessments-{cfg["revision"]}.json', (json.dumps(out, ensure_ascii=False, indent=1) + '\n').encode('utf-8')

def main(argv=None):
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', default=os.path.join(here, 'red-list-assessments.json'))
    ap.add_argument('--out-dir', default=os.path.join(here, '..', '..', 'assets', 'animals'))
    ap.add_argument('--today')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    try:
        today = day(a.today, '--today') if a.today else datetime.datetime.now(datetime.timezone.utc).date()
        with open(a.source, 'rb') as f:
            cfg = json.loads(f.read().decode('utf-8'))
        name, body = build(cfg, today)
    except (BuildError, ValueError, OSError) as e:
        print(f'BUILD STOPPED: {e}')
        return 2
    path = os.path.join(a.out_dir, name)
    if a.check:
        same = os.path.exists(path) and open(path, 'rb').read() == body
        print(f'{"identical" if same else "MISSING OR DIFFERENT"}: {name}  sha256 {sha(body)}')
        return 0 if same else 3
    with open(path, 'wb') as f:
        f.write(body)
    print(f'wrote {name}  {len(body)} bytes  sha256 {sha(body)}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
