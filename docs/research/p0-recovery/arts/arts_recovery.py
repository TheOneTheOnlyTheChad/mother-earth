"""Phase 0 Arts recovery sample (NEW recovery evidence, not a reproduction of the lost 7 Nov samples).
Input: MetObjects.csv pinned at metmuseum/openaccess commit e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea,
LFS sha256 7adc37e41923f9f8179e8ed30d9312e6148da54c4468f373c162afc89d5cd0fe (340,864,677 B).
Metadata only; media excluded (no image fields used, nothing fetched).
Usage: python3 -I arts_recovery.py <MetObjects.csv> <outdir>
"""
import csv, sys, json, random, re, collections as C, hashlib
import pycountry

SRC, OUT = sys.argv[1], sys.argv[2]
SEED, N = 20261107, 2000
csv.field_size_limit(10**9)
rows = list(csv.DictReader(open(SRC, encoding='utf-8-sig')))

def segs(s):
    return [x.strip() for x in (s or '').split('|')]

# ---- relationship vocabulary (applied per Geography Type segment) ----
HEDGE = ('probably', 'possibly', 'said to be', 'attributed', 'perhaps', 'likely', 'reportedly', 'or ')
def relation(seg):
    s = seg.lower()
    if not s or s == '(none assigned)':
        return None
    if s.startswith('attributed'):
        base = 'attributed_to'                      # GPT: keep as uncertain, never created_at
    elif re.search(r'excavat|found', s):
        base = 'found_at'
    elif re.search(r'made|manufactur|minted|printed|published|woven|carved|painted|decorated|country of origin|cast|built', s):
        base = 'created_at'
    else:
        base = 'associated_with'                    # From, Original from, Object place, Possibly from, ...
    certain = not any(h in s for h in HEDGE) and base != 'attributed_to'
    return base, ('certain' if certain else 'uncertain')

# ---- typed-place subset: explicit definition ----
# A record is in the subset if Geography Type has at least one segment that maps to a relationship
# (not empty, not "(none assigned)") AND the Country field is non-empty.
def typed(r):
    return any(relation(g) for g in segs(r['Geography Type'])) and r['Country'].strip() != ''
subset = [r for r in rows if typed(r)]

random.seed(SEED)
sample = random.sample(subset, N)

# ---- country assignment with pipe alignment ----
# Documented name rules (applied in this order). Anything not matched stays UNRESOLVED; nothing is guessed.
ALIAS = {'Turkey': 'TUR'}   # ISO 3166-1 renamed TUR "Türkiye" (2022); same alpha-3.
HEDGE_NAME = re.compile(r'^(probably|possibly|perhaps|likely)\s+|\s+(probably|possibly)$', re.I)
def iso(name):
    n = name.strip().rstrip('?').strip()
    if not n:
        return None, 'empty', False
    hedged = bool(HEDGE_NAME.search(n))
    n = HEDGE_NAME.sub('', n).strip()
    if re.search(r'\bor\b|\band\b|/', n):
        return None, 'unresolved-multiple', hedged
    how = 'iso3166-1'
    if n.lower().startswith('present-day '):
        n, how = n[12:].strip(), 'iso3166-1 (Met "present-day")'
    if n in ALIAS:
        return ALIAS[n], 'alias (ISO rename)', hedged
    try:
        return pycountry.countries.lookup(n).alpha_3, how, hedged
    except LookupError:
        pass
    try:
        sd = [x for x in pycountry.subdivisions if x.name == n and x.type in ('Country', 'Nation', 'Province')]
        if len(sd) == 1:
            return pycountry.countries.get(alpha_2=sd[0].country_code).alpha_3, 'iso3166-2 subdivision', hedged
    except Exception:
        pass
    try:
        h = pycountry.historic_countries.lookup(n)
        return 'H:' + h.alpha_4, 'iso3166-3 (historic)', hedged
    except LookupError:
        return None, 'unresolved-name', hedged

def assignments(r):
    g = [x for x in segs(r['Geography Type'])]
    c = [x for x in segs(r['Country'])]
    rel = [relation(x) for x in g]
    out = []
    uniq_c = {x for x in c if x}
    if len(g) == len(c):
        align = 'aligned'
        pairs = list(zip(rel, c))
    elif len(uniq_c) == 1:
        # one country for every typed segment (e.g. 'United States|United States' or single country)
        align = 'single-country'
        pairs = [(x, next(iter(uniq_c))) for x in rel]
    else:
        align = 'misaligned'
        pairs = [(None, x) for x in c]   # cannot tell which relationship each country belongs to
    for rr, cc in pairs:
        if not cc:
            continue
        code, how, hedged = iso(cc)
        out.append(dict(country_verbatim=cc, iso=code, match=how,
                        relation=(rr[0] if rr else 'unknown'),
                        certainty=('uncertain' if hedged or not rr else rr[1]),
                        alignment=align))
    # de-duplicate identical (iso/verbatim, relation, certainty)
    seen, ded = set(), []
    for a in out:
        k = (a['iso'] or a['country_verbatim'], a['relation'], a['certainty'])
        if k not in seen:
            seen.add(k); ded.append(a)
    return ded

# ---- sensitivity flags (metadata keyword screen; flags are candidates for review, not findings) ----
SENS = {
    'human_remains': r'\bhuman (remains|bone|skull|hair|tooth|teeth)\b|\bmumm(y|ies|ified)\b|\bskull\b|\bcranium\b',
    'funerary': r'funerar|burial|\btomb\b|coffin|sarcophag|\bgrave\b|shabti|ushabti|canopic|mortuary|cinerary|reliquar',
    'sacred_ritual': r'\britual\b|shrine|\baltar\b|sacred|ceremonial|power figure|nkisi|\bidol\b|divination',
}
def sens(r):
    text = ' '.join(r[f] for f in ('Object Name', 'Title', 'Medium', 'Classification', 'Tags')).lower()
    f = [k for k, p in SENS.items() if re.search(p, text)]
    return f

recs = []
for r in sample:
    a = assignments(r)
    recs.append(dict(
        object_id=r['Object ID'], object_number=r['Object Number'], department=r['Department'],
        object_name=r['Object Name'], title=r['Title'][:200], culture=r['Culture'], period=r['Period'],
        object_begin=r['Object Begin Date'], object_end=r['Object End Date'],
        geography_type=r['Geography Type'], city=r['City'], state=r['State'], county=r['County'],
        country=r['Country'], region=r['Region'], subregion=r['Subregion'],
        is_public_domain=r['Is Public Domain'], wikidata=r['Object Wikidata URL'],
        credit_line=r['Credit Line'][:200], link=r['Link Resource'],
        country_assignments=a, sensitivity_flags=sens(r),
    ))

# ---- results ----
def country_view(rs, certain_only=False, aligned_only=False):
    recs_ok, countries = 0, C.Counter()
    for x in rs:
        A = [a for a in x['country_assignments'] if a['iso'] and not a['iso'].startswith('H:')]
        if certain_only:
            A = [a for a in A if a['certainty'] == 'certain']
        if aligned_only:
            A = [a for a in A if a['alignment'] in ('aligned', 'single-country')]
        if A:
            recs_ok += 1
            for c in {a['iso'] for a in A}:
                countries[c] += 1
    top = countries.most_common(10)
    return dict(records=recs_ok, countries=len(countries),
                top_share=round(top[0][1] / recs_ok, 3) if recs_ok else None, top=top)

allA = [a for x in recs for a in x['country_assignments']]
nosens = [x for x in recs if not x['sensitivity_flags']]
res = dict(
    input=dict(file=SRC, rows=len(rows)),
    subset_definition='Geography Type has >=1 segment mapping to a relationship (not empty / "(none assigned)") AND Country non-empty',
    subset_size=len(subset), seed=SEED, sample_size=len(recs),
    geography_type_populated_in_file=sum(1 for r in rows if r['Geography Type'].strip()),
    relations=C.Counter(a['relation'] for a in allA),
    certainty=C.Counter(a['certainty'] for a in allA),
    alignment_records=C.Counter(x['country_assignments'][0]['alignment'] if x['country_assignments'] else 'none' for x in recs),
    country_match=C.Counter(a['match'] for a in allA),
    unmatched_names=C.Counter(a['country_verbatim'] for a in allA if a['iso'] is None).most_common(40),
    historic_names=C.Counter(a['country_verbatim'] for a in allA if a['match'].startswith('iso3166-3')).most_common(20),
    country_view_any=country_view(recs),
    country_view_aligned=country_view(recs, aligned_only=True),
    country_view_certain_aligned=country_view(recs, certain_only=True, aligned_only=True),
    country_view_certain_aligned_no_sensitivity_flag=country_view(nosens, certain_only=True, aligned_only=True),
    sensitivity=dict(C.Counter(f for x in recs for f in x['sensitivity_flags'])),
    sensitivity_records=sum(1 for x in recs if x['sensitivity_flags']),
    sensitivity_found_at_records=sum(1 for x in recs if any(a['relation'] == 'found_at' for a in x['country_assignments'])),
    sensitivity_by_department=C.Counter(x['department'] for x in recs if x['sensitivity_flags']).most_common(10),
    departments=C.Counter(x['department'] for x in recs).most_common(20),
    public_domain=sum(1 for x in recs if x['is_public_domain'] == 'True'),
    wikidata=sum(1 for x in recs if x['wikidata']),
)
json.dump(recs, open(f'{OUT}/met-recovery-sample-R1.json', 'w'), ensure_ascii=False, indent=0)
json.dump(res, open(f'{OUT}/met-recovery-results-R1.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps(res, ensure_ascii=False, indent=1, default=list))
