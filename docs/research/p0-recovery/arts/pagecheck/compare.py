"""Compare blind page reads (pagecheck/batch*.json) with the CSV-based v2 assignments for the validation sample
(seed 20261108) and the targeted 'Country of Origin' objects. Usage: python3 -I pagecheck/compare.py"""
import json, glob, math, re, os
here = os.path.dirname(os.path.abspath(__file__)); base = os.path.dirname(here)
P = {}
for f in sorted(glob.glob(os.path.join(here, 'batch*.json'))):
    for r in json.load(open(f)):
        P[r['id']] = r
A = {r['object_id']: r for r in json.load(open(os.path.join(base, 'met-R1-assignments-v2.json')))}
V = json.load(open(os.path.join(base, 'validate-v2-results.json')))
def created(r):
    return [a for a in r['assignments_v2'] if a['relation'] == 'created_at' and a['certainty'] == 'certain'
            and a['iso'] and a['alignment'] in ('aligned', 'single-country')]
def page_line(p):
    return ' ; '.join(p.get('geography_lines', []))
rows = []
for kind, ids in (('random', V['validation_ids']), ('targeted_coo', V['targeted_country_of_origin_ids'])):
    for i in ids:
        r, p = A[i], P.get(i, {'status': 'not read'})
        row = dict(kind=kind, id=i, csv_geography_type=r['geography_type'], csv_country=r['country'], csv_city=r['city'],
                   assigned=[(a['relation'], a['iso'], a['country_verbatim']) for a in r['assignments_v2'] if a['relation'] in ('created_at', 'country_of_origin')],
                   page_status=p['status'], page_geography=page_line(p), page_notes=p.get('notes', ''))
        if p['status'] != 'ok':
            row['verdict'] = 'not checked (page not reached)'
        else:
            line = row['page_geography'].lower()
            if kind == 'random':
                c = created(r)
                verb_ok = 'made in' in line or 'minted in' in line or 'decorated in' in line or 'printed' in line
                hedge_on_page = bool(re.search(r'probably|possibly|attributed|formerly|said to be', line))
                country_ok = all(a['country_verbatim'].lower() in line for a in c)
                row['verdict'] = 'agree' if (verb_ok and country_ok and not hedge_on_page) else 'DISAGREE'
            else:
                coo = [a for a in r['assignments_v2'] if a['relation'] == 'country_of_origin']
                row['verdict'] = 'page shows Country of Origin as in CSV' if all(('country of origin ' + a['country_verbatim'].lower()) in line for a in coo) else 'DIFFERS'
        rows.append(row)
rnd = [x for x in rows if x['kind'] == 'random']
checked = [x for x in rnd if x['verdict'] in ('agree', 'DISAGREE')]
err = sum(1 for x in checked if x['verdict'] == 'DISAGREE'); n = len(checked)
def wilson(k, n, z=1.96):
    if n == 0: return None
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [round((c - h) / d, 3), round((c + h) / d, 3)]
summary = dict(random_drawn=len(rnd), random_checked=n, random_not_reached=len(rnd) - n, random_disagree=err,
               random_error_rate=round(err / n, 3) if n else None, wilson95=wilson(err, n),
               targeted_coo_drawn=sum(1 for x in rows if x['kind'] == 'targeted_coo'),
               targeted_coo_checked=sum(1 for x in rows if x['kind'] == 'targeted_coo' and x['page_status'] == 'ok'))
json.dump(dict(summary=summary, rows=rows), open(os.path.join(here, 'pagecheck-results.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(summary, indent=1))
for x in rows:
    if x['page_status'] == 'ok':
        print(x['kind'][:6], x['id'], '|', x['csv_geography_type'], '|', x['csv_country'], '|', x['csv_city'], '||', x['page_geography'], '=>', x['verdict'])
