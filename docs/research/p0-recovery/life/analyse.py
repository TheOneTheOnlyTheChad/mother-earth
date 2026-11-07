import json,collections as C,math
d=json.load(open('gbif-sample-2026-11-07.json')); R=d['recs']; N=len(R)
P=lambda k,n=N:f"{k} ({100*k/n:.1f}%)"
print('N',N,'distinct keys',len({r['key'] for r in R}))
print('per stratum',C.Counter(r['stratum'] for r in R))
print('licence',C.Counter(r['lic'] for r in R))
# uncertainty tiers
def tier(u):
  if u is None: return 'not stated'
  for lim,name in [(10,'<=10 m'),(100,'<=100 m'),(1000,'<=1 km'),(10000,'<=10 km'),(100000,'<=100 km')]:
    if u<=lim: return name
  return '>100 km'
order=['<=10 m','<=100 m','<=1 km','<=10 km','<=100 km','>100 km','not stated']
t=C.Counter(tier(r['unc']) for r in R); print('uncertainty',[(k,P(t[k])) for k in order])
print('coordinatePrecision stated',sum(r['prec'] is not None for r in R))
print('basisOfRecord',C.Counter(r['bor'] for r in R).most_common())
print('taxonKey present',P(sum(r['taxonKey'] is not None for r in R)),'acceptedTaxonKey',P(sum(r['acc'] is not None for r in R)))
print('rank',C.Counter(r['rank'] for r in R).most_common()); print('kingdom',C.Counter(r['kingdom'] for r in R).most_common())
iw=[r for r in R if r['iw']]; dg=[r for r in R if r['dg']]
print('informationWithheld',len(iw),C.Counter(r['iw'] for r in iw).most_common(8))
print('dataGeneralizations',len(dg),C.Counter(r['dg'] for r in dg).most_common(8))
print('issues top',C.Counter(i for r in R for i in r['issues']).most_common(15))
print('records with any issue',P(sum(bool(r['issues']) for r in R)))
med=[m for r in R for m in r['media']]
print('records with media',P(sum(bool(r['media']) for r in R)),'media items',len(med),C.Counter(m.get('type') for m in med),C.Counter(m.get('lic') for m in med).most_common(10))
print('occurrenceID present',P(sum(bool(r['occID']) for r in R)))
print('datasets',len({r['ds'] for r in R}),'publishers',len({r['org'] for r in R}))
ds=C.Counter(r['ds'] for r in R).most_common(10); print('top datasets',[(k[:8],v) for k,v in ds])
print('top-dataset share',P(ds[0][1]),'top-5 share',P(sum(v for _,v in ds[:5])))
# places
cc=C.Counter(r['cc'] for r in R); print('countries',len(cc),cc.most_common(10))
cell=lambda r:(math.floor(r['lat']),math.floor(r['lon']))
cells=C.Counter(cell(r) for r in R); print('1deg cells',len(cells))
g4=C.Counter((math.floor((r['lat']+90)/4),math.floor((r['lon']+180)/4)) for r in R); print('4deg cells',len(g4))
print('stratum vs continent mismatch',sum(r['stratum']!=r['continent'] for r in R))
# marker-view usable: uncertainty <=10 km, no generalisation; also <=1 km
for lim in [1000,10000]:
  U=[r for r in R if r['unc'] is not None and r['unc']<=lim and not r['dg']]
  print(f'marker usable unc<={lim}m & not generalised:',P(len(U)),'countries',len({r['cc'] for r in U}),'1deg cells',len({cell(r) for r in U}),'4deg cells',len({(math.floor((r['lat']+90)/4),math.floor((r['lon']+180)/4)) for r in U}),'per stratum',dict(C.Counter(r['stratum'] for r in U)))
U=[r for r in R if not r['dg'] and (r['unc'] is None or r['unc']<=10000)]
print('if unstated uncertainty counted (unc unknown):',P(len(U)))
# per-stratum place spread
for s in sorted({r['stratum'] for r in R}):
  S=[r for r in R if r['stratum']==s]; print(s,'countries',len({r['cc'] for r in S}),'1deg',len({cell(r) for r in S}),'top ds share',round(C.Counter(r['ds'] for r in S).most_common(1)[0][1]/len(S),2))
print('rounded-coordinate decimals (<=2dp):',P(sum(all(abs(x*100-round(x*100))<1e-9 for x in (r['lat'],r['lon'])) for r in R)))
print('timing ms median',sorted(d['ms'])[len(d['ms'])//2],'max',max(d['ms']),'pages',len(d['ms']))
