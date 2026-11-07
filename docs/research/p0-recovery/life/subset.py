import json,math,collections as C,sys
sys.path.insert(0,'.'); from importlib.machinery import SourceFileLoader
M=SourceFileLoader('m','ds-meta.py').load_module().M
R=json.load(open('gbif-sample-2026-11-07.json'))['recs']
lic=lambda r:r['lic'].split('/')[4]
steps=[]; cur=R
def step(name,keep):
  global cur
  out=[r for r in cur if not keep(r)]; cur=[r for r in cur if keep(r)]
  steps.append((name,len(out),len(cur),out))
step('iNaturalist excluded (GPT scope choice)',lambda r:not r['ds'].startswith('50c9509d'))
step('dataset licence CC BY-NC over permissive record licence (unresolved, excluded)',lambda r:M[r['ds'][:8]][1]!='by-nc')
step('record licence differs from dataset licence (flag)',lambda r:lic(r)==M[r['ds'][:8]][1])
step('informationWithheld present (any: location withheld, uncertainty raised, identifier obfuscation)',lambda r:not r['iw'])
step('dataGeneralizations present',lambda r:not r['dg'])
step('coordinate uncertainty not stated',lambda r:r['unc'] is not None)
step('coordinate uncertainty > 1 km (marker view)',lambda r:r['unc']<=1000)
for n,o,k,_ in steps: print(f'{n}: -{o} -> {k}')
F=cur
cell=lambda r:(math.floor(r['lat']),math.floor(r['lon']))
print('\nELIGIBLE',len(F),'countries',len({r['cc'] for r in F}),'1deg cells',len({cell(r) for r in F}),'4deg',len({(math.floor((r['lat']+90)/4),math.floor((r['lon']+180)/4)) for r in F}),'datasets',len({r['ds'] for r in F}))
print('per stratum',dict(C.Counter(r['stratum'] for r in F)))
print('countries',C.Counter(r['cc'] for r in F).most_common())
print('basisOfRecord',C.Counter(r['bor'] for r in F))
print('per dataset',[(M[k[:8]][0][:40],v) for k,v in C.Counter(r['ds'] for r in F).most_common()])
print('top dataset share',round(C.Counter(r['ds'] for r in F).most_common(1)[0][1]/len(F),3))
print('unc tiers',C.Counter('<=10m' if r['unc']<=10 else '<=100m' if r['unc']<=100 else '<=1km' for r in F))
print('coordinatePrecision stated',sum(r['prec'] is not None for r in F))
print('occurrenceID',sum(bool(r['occID']) for r in F),'taxonKey',sum(r['taxonKey'] is not None for r in F),'rank species+',sum(r['rank'] in('SPECIES','SUBSPECIES','VARIETY','FORM') for r in F))
d=C.Counter(('range' if '/' in (r['date'] or '') else 'datetime' if 'T' in (r['date'] or '') else 'date' if r['date'] and len(r['date'])>=10 else 'coarse/none') for r in F); print('date form',d)
print('licence',C.Counter(lic(r) for r in F))
# observed vs collected
rel=lambda b:'observed_at' if b in('HUMAN_OBSERVATION','MACHINE_OBSERVATION') else 'collected_at'
O=[r for r in F if rel(r['bor'])=='observed_at']
print('observed_at only',len(O),'countries',len({r['cc'] for r in O}),'1deg',len({cell(r) for r in O}))
# iw texts in excluded
iwx=[r for r in steps[3][3]]; print('\niw excluded texts',C.Counter((r['iw'][:70]) for r in iwx).most_common())
print('iw excluded by dataset',C.Counter(M[r['ds'][:8]][0][:35] for r in iwx))
print('NC-dataset excluded',C.Counter(M[r['ds'][:8]][0][:35] for r in steps[1][3]))
print('mismatch flagged',[(M[r['ds'][:8]][0],lic(r)) for r in steps[2][3]])
json.dump([r['key'] for r in F],open('eligible-keys.json','w'))
