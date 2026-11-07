"""Step 4–5 (7 Nov 2026), wording revised after GPT's review the same day.
View: the Met's catalogued place of making (created_at), mapped to present-day countries; source wording, uncertainty
and superseded assertions preserved; not independent historical verification.
Sensitive material: for this metadata-only scope, included with honest context (Chad's instruction, 7 Nov 2026);
source restrictions and uncertainty preserved; inclusion is not a claim about ownership legitimacy.
COVERAGE: NOT a manual assessment. Labels come only from (a) the R1 keyword screen, (b) an extended keyword screen
(Met human-remains terms, culture names) and (c) three findings from the blind page check. They are TENTATIVE
("potential ... association"); no object was manually assessed; an unlabelled object is NOT "not sensitive".
Usage: python3 -I final_view.py"""
import json, re, collections as C, os
h = os.path.dirname(os.path.abspath(__file__))
R1 = {r['object_id']: r for r in json.load(open(os.path.join(h, 'met-recovery-sample-R1.json')))}
V2 = {r['object_id']: r for r in json.load(open(os.path.join(h, 'met-R1-assignments-v2.json')))}
cand = json.load(open(os.path.join(h, 'created-at-candidates-v2.json')))
EXT = {
  'potential_human_remains': r"\bhuman (remains|bone|skull|hair|tooth|teeth)\b|\bmumm(y|ies|ified)\b|\bcremat|\bashes\b|hair jewel|mourning (ring|brooch|jewel)",
  'potential_funerary_association': r"funerar|burial|\btomb\b|coffin|sarcophag|\bgrave\b|shabti|ushabti|canopic|mortuary|cinerary|memorial",
  'potential_sacred_ritual_association': r"\britual\b|shrine|\baltar\b|sacred|ceremon|reliquar|\bidol\b|divination|liturg|chalice|church|mosque|temple|qur.an|koran|torah|icon\b",
  'potential_indigenous_source_community': r"native american|yup.ik|inuit|lakota|navajo|dine\b|hopi|pueblo|haida|tlingit|iroquois|cherokee|apache|aborigin|maori|first nations",
}
PAGE = {'717572': ['potential_indigenous_source_community', 'potential_sacred_ritual_association'],   # Yup'ik mask "worn during dance ceremonies" (page)
        '471897': ['potential_sacred_ritual_association'],                                   # stained glass from a church choir (page)
        '818842': ['potential_sacred_ritual_association']}                                   # Karbala painting used as recitation backdrop (page)
def created(r):
    return [a for a in r['assignments_v2'] if a['relation'] == 'created_at' and a['certainty'] == 'certain'
            and a['iso'] and not a['iso'].startswith('H:') and a['alignment'] in ('aligned', 'single-country')]
out, cc = [], C.Counter()
for i in cand:
    r1, v = R1[i], V2[i]
    text = ' '.join(r1.get(k, '') for k in ('object_name', 'title', 'culture', 'period', 'department')).lower()
    REN = {'human_remains': 'potential_human_remains', 'funerary': 'potential_funerary_association',
           'sacred_ritual': 'potential_sacred_ritual_association'}
    lab = {REN.get(f, f) for f in r1['sensitivity_flags']}
    for k, p in EXT.items():
        if re.search(p, text): lab.add(k)
    lab |= set(PAGE.get(i, []))
    isos = sorted({a['iso'] for a in created(v)})
    for k in isos: cc[k] += 1
    out.append(dict(object_id=i, countries=isos, met_wording=v['geography_type'], met_country=v['country'],
                    object_name=r1['object_name'], culture=r1['culture'], department=r1['department'],
                    tentative_labels=sorted(lab),
                    sensitivity_assessment='not fully assessed (keyword screen + 3 page findings only; no manual assessment)',
                    unlabelled_note=(None if lab else 'no screen hit; this does NOT mean not sensitive'),
                    link=r1['link']))
n = len(out)
lab_counts = C.Counter(l for o in out for l in o['tentative_labels'])
res = dict(view="The Met's catalogued place of making (created_at), mapped to present-day countries; source wording, uncertainty and superseded assertions preserved; not independent historical verification",
           sensitivity_handling="For this metadata-only scope: sensitive material included with honest context (Chad, 7 Nov 2026: 'no include it that is the truth we are not here to bury the truth'); source restrictions and uncertainty preserved; inclusion is not a claim about ownership legitimacy",
           sensitivity_coverage="NOT manually assessed: 0 of the objects were individually assessed under the rule. Labels = keyword screen + extended keyword screen + 3 page-check findings; tentative; the missed Yup'ik ceremonial mask (found only by page check) shows they are not comprehensive; an unlabelled object does not mean not sensitive",
           status="geography passed; overall clearance pending (GPT review)",
           objects=n, countries=len(cc), criterion_300_objects=n >= 300, criterion_20_places=len(cc) >= 20,
           top=cc.most_common(5), top_share=round(cc.most_common(1)[0][1] / n, 3),
           countries_with_1_object=sorted(k for k, v in cc.items() if v == 1),
           countries_with_le_3_objects=sum(1 for v in cc.values() if v <= 3),
           all_counts=cc.most_common(), objects_with_tentative_labels=sum(1 for o in out if o['tentative_labels']), tentative_label_counts=lab_counts,
           departments=C.Counter(o['department'] for o in out))
json.dump(out, open(os.path.join(h, 'final-view-objects.json'), 'w'), ensure_ascii=False, indent=0)
json.dump(res, open(os.path.join(h, 'final-view-results.json'), 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps(res, ensure_ascii=False, indent=1, default=list))
for o in out:
    if o['tentative_labels']: print(o['object_id'], o['tentative_labels'], '|', o['object_name'][:40], '|', o['culture'][:30], '|', o['department'])
