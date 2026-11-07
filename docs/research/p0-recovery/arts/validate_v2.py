"""Phase 0 Arts validation, step 2 (7 Nov 2026): explicit Geography Type classification (v2) applied to the
EXISTING R1 sample (no redraw), then the created_at-only candidate set and the seeded validation sample.
Input: met-recovery-sample-R1.json (sha256 c4046fd3...3762). Country-name rules and ISO reference as in arts_recovery.py.
Usage: python3 -I validate_v2.py met-recovery-sample-R1.json <outdir>
"""
import json, sys, random, collections as C, importlib.util, os

# Every distinct Geography Type segment in the pinned file (30; counts are segment occurrences across 503,073 rows).
# relation: created_at | found_at | associated_with | attributed_to | depicted | destination | none
# certainty: certain | uncertain | superseded
TABLE = {
    'From':                         ('associated_with', 'certain'),     # 28,357
    'Made in':                      ('created_at', 'certain'),          # 16,612
    'Attributed to':                ('attributed_to', 'uncertain'),     # 7,630
    'Excavated in':                 ('found_at', 'certain'),            # 3,945
    'Possibly made in':             ('created_at', 'uncertain'),        # 1,457
    'Probably made in':             ('created_at', 'uncertain'),        # 1,049
    'Probably from':                ('associated_with', 'uncertain'),   # 771
    'Found':                        ('found_at', 'certain'),            # 505
    'Country of Origin':            ('country_of_origin', 'unvalidated'),  # 470: meaning checked in step 3; NOT created_at until then
    'Found/excavated':              ('found_at', 'certain'),            # 385
    'Possibly from':                ('associated_with', 'uncertain'),   # 342
    'Said to be from':              ('associated_with', 'uncertain'),   # 331
    'Original from':                ('associated_with', 'certain'),     # 318
    'Object place':                 ('associated_with', 'certain'),     # 201
    'Minted in':                    ('created_at', 'certain'),          # 182
    '':                             ('none', None),                     # 148
    'Probably originally from':     ('associated_with', 'uncertain'),   # 141
    '(none assigned)':              ('none', None),                     # 137
    'Formerly considered made in':  ('created_at', 'superseded'),       # 71: superseded attribution, never shown as current
    'Presumably from':              ('associated_with', 'uncertain'),   # 69 (missed by the R1 hedge list)
    'Made for':                     ('destination', 'certain'),         # 6: place made FOR, not place of making
    'Original':                     ('associated_with', 'certain'),     # 6
    'Depicted':                     ('depicted', 'certain'),            # 4: place shown in the work
    'Decorated in':                 ('created_at', 'certain'),          # 4: place where decoration was made (labelled)
    'Said to be found in':          ('found_at', 'uncertain'),          # 2
    'Probably made for':            ('destination', 'uncertain'),       # 1
    'Designed in':                  ('designed_at', 'certain'),         # 1: design, not making
    'Published in':                 ('published_at', 'certain'),        # 1
    'Printed':                      ('created_at', 'certain'),          # 1
    'Retailed in':                  ('retailed_at', 'certain'),         # 1
}

here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ar', os.path.join(here, 'arts_recovery_iso.py'))
ar = importlib.util.module_from_spec(spec); spec.loader.exec_module(ar)
iso = ar.iso

SRC, OUT = sys.argv[1], sys.argv[2]
R = json.load(open(SRC))

def segs(s):
    return [x.strip() for x in (s or '').split('|')]

unknown = C.Counter()
def assign(x):
    g, c = segs(x['geography_type']), segs(x['country'])
    rel = []
    for s in g:
        if s not in TABLE:
            unknown[s] += 1
            rel.append(('unclassified', 'uncertain'))
        else:
            rel.append(TABLE[s])
    uniq = {v for v in c if v}
    if len(g) == len(c):
        align, pairs = 'aligned', list(zip(rel, c))
    elif len(uniq) == 1:
        align, pairs = 'single-country', [(r, next(iter(uniq))) for r in rel]
    else:
        align, pairs = 'misaligned', [(('unknown', 'uncertain'), v) for v in c]
    out = []
    for (r, cert), cc in pairs:
        if not cc or r == 'none':
            continue
        code, how, hedged = iso(cc)
        out.append(dict(country_verbatim=cc, iso=code, match=how, relation=r,
                        certainty=('uncertain' if hedged and cert == 'certain' else cert), alignment=align))
    return out

def created_ok(a):
    return (a['relation'] == 'created_at' and a['certainty'] == 'certain' and a['iso']
            and not a['iso'].startswith('H:') and a['alignment'] in ('aligned', 'single-country'))

recs = []
for x in R:
    A = assign(x)
    recs.append(dict(object_id=x['object_id'], department=x['department'], geography_type=x['geography_type'],
                     country=x['country'], city=x['city'], link=x['link'], keyword_flags=x['sensitivity_flags'],
                     assignments_v2=A))

# Candidate set = created_at only (certain, aligned, ISO-resolved). Keyword-flagged objects are NOT removed here:
# sensitivity is applied later under the rule Chad agrees.
cand = [r for r in recs if any(created_ok(a) for a in r['assignments_v2'])]
coo = [r for r in recs if any(a['relation'] == 'country_of_origin' for a in r['assignments_v2'])]

random.seed(20261108)          # validation-sample seed (distinct from the R1 draw seed 20261107)
val = random.sample(sorted(cand, key=lambda r: int(r['object_id'])), 50)

def countries(rs):
    cc = C.Counter()
    for r in rs:
        for k in {a['iso'] for a in r['assignments_v2'] if created_ok(a)}:
            cc[k] += 1
    return cc

cc = countries(cand)
res = dict(
    distinct_segments_classified=len(TABLE), unclassified_segments_in_R1=dict(unknown),
    candidate_objects=len(cand), candidate_countries=len(cc), candidate_top=cc.most_common(10),
    candidate_top_share=round(cc.most_common(1)[0][1] / len(cand), 3),
    candidate_keyword_flagged=sum(1 for r in cand if r['keyword_flags']),
    country_of_origin_objects_in_R1=len(coo),
    validation_seed=20261108, validation_ids=[r['object_id'] for r in val],
    targeted_country_of_origin_ids=[r['object_id'] for r in coo],
    relation_counts_R1=C.Counter(a['relation'] for r in recs for a in r['assignments_v2']),
)
json.dump(recs, open(f'{OUT}/met-R1-assignments-v2.json', 'w'), ensure_ascii=False, indent=0)
json.dump(sorted(r['object_id'] for r in cand), open(f'{OUT}/created-at-candidates-v2.json', 'w'))
json.dump(res, open(f'{OUT}/validate-v2-results.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps(res, ensure_ascii=False, indent=1, default=list))
