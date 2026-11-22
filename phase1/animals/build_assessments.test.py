"""Mother Earth — tests for the Red List assessment build (animals-assessment-rc; ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF rev 1).
Part 1: every refusal rule of build_assessments.py, each on a changed copy of the committed record file, each stopping at
  the rule named. Plus the required valid fixtures (GPT, 22 Nov): 2018 publication with a 2019 errata; a failed attempt that
  leaves the successful check and the due date where they were.
Part 2: SOURCE ACCURACY, from independent expectations. EXPECTED below is typed here from the reviewed evidence record
  (reviews/2026-11-22-animals-assessment-evidence.md section 2: read on the Red List's own pages by Claude on 22 Nov 2026 and
  matched by GPT's own read the same day). The committed record file and the shipped file must both equal it. A wrong value
  that is correctly built and hashed fails here.
Part 3: the shipped file is what a fresh build gives, and its checksum is the one pinned in animals-assessment.js.
Run: python3 -I phase1/animals/build_assessments.test.py"""
import copy, datetime, hashlib, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import build_assessments as b
sha = lambda x: hashlib.sha256(x).hexdigest()
npass = nfail = 0
def ok(name, cond, got=None):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:700]))

SRC = os.path.join(HERE, 'red-list-assessments.json')
CFG = json.load(open(SRC, encoding='utf-8'))
TODAY = datetime.date(2026, 11, 22)
def stops(mutate, needle, today=TODAY):
    c = copy.deepcopy(CFG); mutate(c)
    try: b.build(c, today)
    except b.BuildError as e: return needle in str(e), str(e)
    return False, 'built'
def builds(mutate, today=TODAY):
    c = copy.deepcopy(CFG); mutate(c)
    try: b.build(c, today); return True, ''
    except b.BuildError as e: return False, str(e)
R = lambda c, i=0: c['records'][i]
WHALE, SHARK = 2, 1

# ---------- Part 1: refusals
T = [
 ('1a an unknown top-level key', lambda c: c.update(trend_source='x'), 'must hold exactly'),
 ('1b a trend value in a record', lambda c: R(c).update(population_trend='Decreasing'), 'unknown key'),
 ('1c a criteria string in a record', lambda c: R(c).update(criteria='A2bd'), 'unknown key'),
 ('1d a Green Status value in a record', lambda c: R(c).update(green_status='Moderately Depleted'), 'unknown key'),
 ('1e a regional category in a record', lambda c: R(c).update(regional_category='Least Concern'), 'unknown key'),
 ('1f a missing field', lambda c: R(c).pop('assessed'), 'missing key'),
 ('2a two records for one card', lambda c: R(c, 1).update(card=R(c)['card']), 'more than one record'),
 ('2b one assessment used twice', lambda c: [R(c, 1).update({k: R(c)[k] for k in ('assessment_id', 'url', 'doi_url', 'citation', 'scientific_name', 'assessed', 'published_year', 'version_note')})], 'used by more than one record'),
 ('3a a category code instead of words', lambda c: R(c).update(category='NT'), 'not a Red List category name'),
 ('3b a made-up category', lambda c: R(c).update(category='Threatened'), 'not a Red List category name'),
 ('3c a regional scope', lambda c: R(c).update(scope='Europe'), 'scope must be "global"'),
 ('4a a malformed assessment identifier', lambda c: R(c).update(assessment_id='T41013A45172424'), 'not of the form'),
 ('4b the link is another assessment\'s', lambda c: R(c).update(url=R(c, 1)['url']), 'url does not carry'),
 ('4c the DOI is another assessment\'s', lambda c: R(c).update(doi_url=R(c, 1)['doi_url']), 'doi_url does not carry'),
 ('4d the citation is another assessment\'s', lambda c: R(c).update(citation=R(c, 1)['citation']), 'citation does not name'),
 ('4e the website\'s Accessed date left in the citation', lambda c: R(c).update(citation=R(c)['citation'] + ' Accessed on 19 November 2026.'), 'Accessed'),
 ('4f a scientific name that is not a species name', lambda c: R(c).update(scientific_name='Equus'), 'two-part species name'),
 ('5a an assessment date given as a year only', lambda c: R(c).update(assessed='2016'), 'not a full date'),
 ('5b an impossible assessment date', lambda c: R(c).update(assessed='2016-02-30'), 'not a real date'),
 ('5c published before assessed', lambda c: R(c).update(published_year=2015), 'before the assessment year'),
 ('5d a published year given as text', lambda c: R(c).update(published_year='2016'), 'not a year'),
 ('5e an errata year before publication', lambda c: R(c, WHALE)['version_note'].update(year=2017), 'cannot come before publication'),
 ('5f an amended-of year after the published year', lambda c: R(c, SHARK)['version_note'].update(of_year=2023), 'cannot sit with'),
 ('5g an amended-of year before the assessment year', lambda c: R(c, SHARK)['version_note'].update(of_year=2017), 'cannot sit with'),
 ('5h a version note of an unknown kind', lambda c: R(c).update(version_note={'kind': 'reprint', 'year': 2017}), 'must be null'),
 ('5i an errata note given a day it does not have', lambda c: R(c, WHALE)['version_note'].update(date='2019-01-01'), 'exactly kind and year'),
 ('6a an unknown status', lambda c: R(c).update(status='checked'), 'status must be'),
 ('6b suppressed without a reason', lambda c: R(c).update(status='suppressed'), 'suppressed_reason'),
 ('6c usable with a suppression reason', lambda c: R(c).update(suppressed_reason='x'), 'carries no suppressed_reason'),
 ('7a a successful check dated after today', lambda c: R(c).update(last_successful_check='2026-11-23', last_attempt={'date': '2026-11-23', 'result': 'ok'}, next_check_due='2027-05-23'), 'after today'),
 ('7b a successful check before the assessment', lambda c: R(c).update(last_successful_check='2016-01-01', last_attempt={'date': '2016-01-01', 'result': 'ok'}, next_check_due='2016-07-01', edition_at_check='2016-1'), 'before the assessment date'),
 ('7c an edition later than the check', lambda c: R(c).update(edition_at_check='2027-1'), 'edition_at_check'),
 ('7d an edition not of the form YYYY-N', lambda c: R(c).update(edition_at_check='2026'), 'edition_at_check'),
 ('8a an attempt before the successful check', lambda c: R(c).update(last_attempt={'date': '2026-11-01', 'result': 'failed'}), 'before the last successful check'),
 ('8b an attempt after today', lambda c: R(c).update(last_attempt={'date': '2026-12-01', 'result': 'failed'}), 'after today'),
 ('8c a successful attempt on another date than the successful check', lambda c: R(c).update(last_successful_check='2026-11-01', next_check_due='2027-05-01'), 'the two dates differ'),
 ('8d an attempt with an unknown result', lambda c: R(c).update(last_attempt={'date': '2026-11-22', 'result': 'partial'}), 'last_attempt holds exactly'),
 ('9a a due date that is not check plus six months', lambda c: R(c).update(next_check_due='2027-06-22'), 'next_check_due must be'),
 ('10a a census with a place', lambda c: R(c, 4)['shown'].update(place='x'), 'shown holds exactly'),
 ('10b a journey with no place', lambda c: R(c)['shown'].pop('place'), 'shown holds exactly'),
 ('10c shown years out of order', lambda c: R(c)['shown'].update(first_year=2009), 'out of order'),
 ('10d a stock claim other than "not verified"', lambda c: R(c, WHALE)['shown'].update(stock_not_verified=False), 'shown holds exactly'),
]
for name, mut, needle in T:
    good, got = stops(mut, needle); ok(name + ' stops the build at its own rule', good, got)

# a failed attempt later, with the due date quietly reset from the failed attempt: refused (GPT clarification 1)
later = datetime.date(2027, 6, 1)
good, got = stops(lambda c: R(c).update(last_attempt={'date': '2027-05-30', 'result': 'failed'}, next_check_due='2027-11-30'), 'next_check_due must be', later)
ok('9b a failed attempt cannot reset the six-month clock', good, got)
good, got = stops(lambda c: R(c).update(last_successful_check='2027-05-30', last_attempt={'date': '2027-05-30', 'result': 'failed'}, next_check_due='2027-11-30'), 'x', later)
ok('9c (stated limit) a failed attempt typed AS the successful check is not something a rule can see: the builder accepts it', got == 'built', got)

# required valid fixtures
good, got = builds(lambda c: None); ok('V1 the committed record builds', good, got)
w = R(CFG, WHALE); ok('V2 the false killer whale keeps publication year 2018 with an errata year of 2019', w['published_year'] == 2018 and w['version_note'] == {'kind': 'errata', 'year': 2019}, w)
good, got = builds(lambda c: R(c).update(last_attempt={'date': '2027-05-30', 'result': 'failed'}), later); ok('V3 a failed attempt with the successful check and due date unchanged builds', good, got)
good, got = builds(lambda c: R(c).update(status='suppressed', suppressed_reason='The assessment was replaced and the new one has not been reviewed.')); ok('V4 a suppressed record with a reason builds', good, got)
ok('V5 add_months: 22 Nov + 6 = 22 May; 31 Aug + 6 = 28 Feb', b.add_months(datetime.date(2026, 11, 22), 6) == datetime.date(2027, 5, 22) and b.add_months(datetime.date(2026, 8, 31), 6) == datetime.date(2027, 2, 28))

# ---------- Part 2: source accuracy against the reviewed evidence record (typed here, not read from the record file)
EXPECTED = {  # card: (scientific name, assessment id, category, assessed, published year, version note, first author + year in the citation)
 'zebra-botswana-Z3866': ('Equus quagga', 'e.T41013A45172424', 'Near Threatened', '2016-06-20', 2016, None, 'King, S.R.B. & Moehlman, P.D. 2016.'),
 'white-shark-sa-118845': ('Carcharodon carcharias', 'e.T3855A212629880', 'Vulnerable', '2018-11-07', 2022, {'kind': 'amended', 'of_year': 2019}, 'Rigby, C.L.'),
 'false-killer-whale-hawaii-98364': ('Pseudorca crassidens', 'e.T18596A145357488', 'Near Threatened', '2018-07-23', 2018, {'kind': 'errata', 'year': 2019}, 'Baird, R.W. 2018.'),
 'waved-albatross-galapagos-3275-30662': ('Phoebastria irrorata', 'e.T22698320A132641638', 'Critically Endangered', '2018-08-07', 2018, None, 'BirdLife International 2018.'),
 'african-penguin-census': ('Spheniscus demersus', 'e.T22697810A256021744', 'Critically Endangered', '2024-07-04', 2024, None, 'BirdLife International 2024.'),
}
EXPECTED_DOI = {'zebra-botswana-Z3866': '2016-2', 'white-shark-sa-118845': '2022-1', 'false-killer-whale-hawaii-98364': '2018-2', 'waved-albatross-galapagos-3275-30662': '2018-2', 'african-penguin-census': '2024-2'}
SHIPPED_PATH = os.path.join(ROOT, 'assets', 'animals', 'assessments-R1.json')
SHIPPED_RAW = open(SHIPPED_PATH, 'rb').read(); SHIPPED = json.loads(SHIPPED_RAW.decode('utf-8'))
for label, recs in (('record file', CFG['records']), ('shipped file', SHIPPED['records'])):
    got = {r['card']: (r['scientific_name'], r['assessment_id'], r['category'], r['assessed'], r['published_year'], r['version_note']) for r in recs}
    ok(f'S1 the {label} holds exactly the five reviewed cards', sorted(got) == sorted(EXPECTED), sorted(got))
    for card, e in EXPECTED.items():
        ok(f'S2 {label}: {card} has the reviewed name, identifier, category, assessment date, published year and version note', got.get(card) == e[:6], got.get(card))
    for r in recs:
        e = EXPECTED[r['card']]
        ok(f'S3 {label}: {r["card"]} cites the reviewed authors and year and the reviewed DOI edition', r['citation'].startswith(e[6]) and f'IUCN.UK.{EXPECTED_DOI[r["card"]]}.RLTS.' in r['doi_url'], (r['citation'][:60], r['doi_url']))
        ok(f'S4 {label}: {r["card"]} is global, usable, checked 22 Nov 2026 against edition 2026-1, due 22 May 2027', (r['scope'], r['status'], r['last_successful_check'], r['edition_at_check'], r['next_check_due'], r['last_attempt']) == ('global', 'usable', '2026-11-22', '2026-1', '2027-05-22', {'date': '2026-11-22', 'result': 'ok'}), r)
# the Green Status dates on the white shark and penguin pages are not these dates: the assessment dates above are the Red List ones
ok('S5 only the false killer whale carries the stock-not-verified line; no record carries a claim that no stock assessment exists', [r['card'] for r in SHIPPED['records'] if r['shown'].get('stock_not_verified')] == ['false-killer-whale-hawaii-98364'] and 'no assessment exists' not in SHIPPED_RAW.decode('utf-8').lower())
ok('S6 no mule deer, no trend, criteria, regional or Green Status wording anywhere in the shipped file', not re.search(r'mule|trend|criteria|A2bd|B2ab|A3bce|regional|green status|decreasing|increasing', SHIPPED_RAW.decode('utf-8'), re.I))

# ---------- Part 3: the shipped file is the build, and the page pins it
name, body = b.build(CFG, TODAY)
ok('P1 a fresh build gives the shipped file byte for byte', name == 'assessments-R1.json' and body == SHIPPED_RAW)
js = open(os.path.join(ROOT, 'animals-assessment.js'), encoding='utf-8').read()
ok('P2 animals-assessment.js pins the shipped file\'s checksum', js.count(sha(SHIPPED_RAW)) == 1, sha(SHIPPED_RAW))
ok('P3 the page script holds the same category names as the builder', all(f"'{c}'" in js for c in b.CATEGORIES))
print(('PASSED' if not nfail else 'FAILED') + f'  {npass} passed, {nfail} failed')
sys.exit(1 if nfail else 0)
