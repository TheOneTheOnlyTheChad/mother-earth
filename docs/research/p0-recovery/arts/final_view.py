"""Step 4–5 (7 Nov 2026): apply Chad's sensitive-material rule ("include it — that is the truth; we are not here to
bury the truth": include, never exclude; label honestly) to the v2 created_at candidates, then recount.
Labels come from (a) the R1 keyword screen, (b) an extended screen using the Met's own human-remains terms and
culture fields, (c) findings from the blind page check. Labels never remove an object.
Usage: python3 -I final_view.py"""
import json, re, collections as C, os
h = os.path.dirname(os.path.abspath(__file__))
R1 = {r['object_id']: r for r in json.load(open(os.path.join(h, 'met-recovery-sample-R1.json')))}
V2 = {r['object_id']: r for r in json.load(open(os.path.join(h, 'met-R1-assignments-v2.json')))}
cand = json.load(open(os.path.join(h, 'created-at-candidates-v2.json')))
EXT = {
  'human_remains': r"\bhuman (remains|bone|skull|hair|tooth|teeth)\b|\bmumm(y|ies|ified)\b|\bcremat|\bashes\b|hair jewel|mourning (ring|brooch|jewel)",
  'funerary': r"funerar|burial|\btomb\b|coffin|sarcophag|\bgrave\b|shabti|ushabti|canopic|mortuary|cinerary|memorial",
  'sacred_ritual': r"\britual\b|shrine|\baltar\b|sacred|ceremon|reliquar|\bidol\b|divination|liturg|chalice|church|mosque|temple|qur.an|koran|torah|icon\b",
  'indigenous_source_community': r"native american|yup.ik|inuit|lakota|navajo|dine\b|hopi|pueblo|haida|tlingit|iroquois|cherokee|apache|aborigin|maori|first nations",
}
PAGE = {'717572': ['indigenous_source_community', 'sacred_ritual'],   # Yup'ik mask "worn during dance ceremonies" (page)
        '471897': ['sacred_ritual'],                                   # stained glass from a church choir (page)
        '818842': ['sacred_ritual']}                                   # Karbala painting used as recitation backdrop (page)
def created(r):
    return [a for a in r['assignments_v2'] if a['relation'] == 'created_at' and a['certainty'] == 'certain'
            and a['iso'] and not a['iso'].startswith('H:') and a['alignment'] in ('aligned', 'single-country')]
out, cc = [], C.Counter()
for i in cand:
    r1, v = R1[i], V2[i]
    text = ' '.join(r1.get(k, '') for k in ('object_name', 'title', 'culture', 'period', 'department')).lower()
    lab = set(r1['sensitivity_flags'])
    for k, p in EXT.items():
        if re.search(p, text): lab.add(k)
    lab |= set(PAGE.get(i, []))
    isos = sorted({a['iso'] for a in created(v)})
    for k in isos: cc[k] += 1
    out.append(dict(object_id=i, countries=isos, met_wording=v['geography_type'], met_country=v['country'],
                    object_name=r1['object_name'], culture=r1['culture'], department=r1['department'],
                    labels=sorted(lab), link=r1['link']))
n = len(out)
lab_counts = C.Counter(l for o in out for l in o['labels'])
res = dict(rule="Chad, 7 Nov 2026: include sensitive material; do not exclude; label honestly ('that is the truth, we are not here to bury the truth')",
           objects=n, countries=len(cc), criterion_300_objects=n >= 300, criterion_20_places=len(cc) >= 20,
           top=cc.most_common(5), top_share=round(cc.most_common(1)[0][1] / n, 3),
           countries_with_1_object=sorted(k for k, v in cc.items() if v == 1),
           countries_with_le_3_objects=sum(1 for v in cc.values() if v <= 3),
           all_counts=cc.most_common(), objects_labelled=sum(1 for o in out if o['labels']), label_counts=lab_counts,
           departments=C.Counter(o['department'] for o in out))
json.dump(out, open(os.path.join(h, 'final-view-objects.json'), 'w'), ensure_ascii=False, indent=0)
json.dump(res, open(os.path.join(h, 'final-view-results.json'), 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps(res, ensure_ascii=False, indent=1, default=list))
for o in out:
    if o['labels']: print(o['object_id'], o['labels'], '|', o['object_name'][:40], '|', o['culture'][:30], '|', o['department'])
