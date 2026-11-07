"""Created_at-only country view (Phase 0 review update, 7 Nov 2026) from the R1 sample.
Distinct objects; certain + aligned/single-country + ISO-resolved created_at assignments; sensitivity-flagged excluded;
a country reached only through superseded wording (formerly/previously/once thought/traditionally) is dropped.
Usage: python3 -I created_at_view.py met-recovery-sample-R1.json created-at-view-object-ids-R1.json"""
import json, sys, collections as C
R = json.load(open(sys.argv[1]))
SUP = ('formerly', 'previously', 'once thought', 'traditionally')
def ok(a):
    return (a['relation'] == 'created_at' and a['certainty'] == 'certain' and a['iso']
            and not a['iso'].startswith('H:') and a['alignment'] in ('aligned', 'single-country'))
fin, cc = [], C.Counter()
for x in R:
    if x['sensitivity_flags']:
        continue
    g = [s.strip().lower() for s in x['geography_type'].split('|')]
    c = [s.strip() for s in x['country'].split('|')]
    keep = set()
    for a in x['country_assignments']:
        if not ok(a):
            continue
        segs = [g[i] for i in range(len(g)) if (len(g) == len(c) and c[i] == a['country_verbatim']) or len(set(c)) == 1]
        if segs and all(any(w in s for w in SUP) for s in segs):
            continue
        keep.add(a['iso'])
    if keep:
        fin.append(x)
        for k in keep:
            cc[k] += 1
json.dump(sorted(x['object_id'] for x in fin), open(sys.argv[2], 'w'))
print(json.dumps({'objects': len(fin), 'countries': len(cc), 'top_share': round(cc.most_common(1)[0][1] / len(fin), 3),
                  'counts': cc.most_common()}))
