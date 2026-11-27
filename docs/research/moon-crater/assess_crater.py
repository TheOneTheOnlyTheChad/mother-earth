"""Moon item 5 (CRaTER) bounded sample assessment, 27 Nov 2026.

Reads the four checkpointed acquisitions (see checkpoints.jsonl) and the repo's
dated LRO path (assets/moon/craft-moon-me-2026-06-R1.json). Prints every number
quoted in MOON-CRATER-PROPOSAL rev 1. Fixed-record parsing follows the PDS4 labels
(field_location is 1-based; record_length 194 for L2 SEC, 240 for L2 PRI).

Usage: python3 -I assess_crater.py <dir with the acquisitions> <repo root>
"""
import sys, json, hashlib, math
import numpy as np

SRC, REPO = sys.argv[1], sys.argv[2]
R_MOON = 1737.4  # km, the page's reference sphere (not terrain)

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

ck = [json.loads(l) for l in open(f'{SRC}/checkpoints.jsonl')]
print('== integrity against checkpoints')
for c in ck:
    got = sha(f"{SRC}/{c['file']}")
    print(c['seq'], c['file'], 'sha256 ok' if got == c['sha256'] else f'MISMATCH {got}')
    assert got == c['sha256']

# ---------------------------------------------------------------- L2 SEC
SEC_NAMES = ['SECONDS', 'FRACT', 'TIME', 'BIASCNTRL', 'BIASCMD', 'CALLOW', 'CALHIGH', 'CALRATE',
             'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'LASTCMD', 'LASTVALUE', 'DISCTHIN', 'DISCTHICK',
             'MASK1', 'MASK2', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'GOOD', 'REJECT', 'TOTAL',
             'X', 'Y', 'Z']

def read_sec(path):
    raw = open(path, 'rb').read()
    assert len(raw) % 194 == 0, 'record length'
    recs = [raw[i:i + 194] for i in range(0, len(raw), 194)]
    assert all(r.endswith(b'\r\n') for r in recs)
    rows = [r[:-2].decode('ascii').split(',') for r in recs]
    assert all(len(r) == 32 for r in rows)
    cols = {n: [r[i].strip().strip('"') for r in rows] for i, n in enumerate(SEC_NAMES)}
    out = {'TIME': cols['TIME']}
    for n in SEC_NAMES:
        if n == 'TIME':
            continue
        out[n] = np.array(cols[n], dtype=float)
    return out

sec = {}
for day, fn in [('2026-06-10', 'CRAT_L2_SEC_2026161_V01.TAB'), ('2026-06-11', 'CRAT_L2_SEC_2026162_V01.TAB')]:
    d = read_sec(f'{SRC}/{fn}')
    sec[day] = d
    s = d['SECONDS']
    dt = np.diff(s)
    print(f'\n== L2 SEC {day} ({fn})')
    print('records', len(s), '| first', d['TIME'][0], '| last', d['TIME'][-1])
    print('time step s: min', dt.min(), 'max', dt.max(), '| steps != 1:', int((dt != 1).sum()))
    print('UTC day prefix all match:', all(t.startswith(day) for t in d['TIME']))
    for n in ['BIASCNTRL', 'BIASCMD', 'CALLOW', 'CALHIGH', 'CALRATE', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6',
              'DISCTHIN', 'DISCTHICK', 'MASK1', 'MASK2', 'LASTCMD', 'LASTVALUE']:
        u = np.unique(d[n])
        print(f'  {n}: unique {u[:6].tolist()}{" ..." if len(u) > 6 else ""}')
    tot_ok = np.all(d['TOTAL'] == d['GOOD'] + d['REJECT'])
    print('TOTAL == GOOD + REJECT every record:', bool(tot_ok),
          '| mismatches', int((d['TOTAL'] != d['GOOD'] + d['REJECT']).sum()))
    for n in ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'GOOD', 'REJECT', 'TOTAL']:
        v = d[n]
        print(f'  {n}: mean {v.mean():.3f} median {np.median(v):.0f} min {v.min():.0f} '
              f'p99 {np.percentile(v, 99):.0f} max {v.max():.0f} (counts per 1 s record)')
    hourly = d['GOOD'].reshape(24, 3600).mean(axis=1)
    print('  GOOD hourly mean: min %.3f max %.3f' % (hourly.min(), hourly.max()))
    r = np.sqrt(d['X'] ** 2 + d['Y'] ** 2 + d['Z'] ** 2)
    neg = int(((d['X'] == -1) & (d['Y'] == -1) & (d['Z'] == -1)).sum())
    print('MOONVEC fill (-1,-1,-1) records:', neg)
    alt = r - R_MOON
    print('radius km: min %.2f max %.2f | altitude above 1737.4 km sphere: min %.2f max %.2f'
          % (r.min(), r.max(), alt.min(), alt.max()))
    lat = np.degrees(np.arcsin(d['Z'] / r))
    print('latitude deg: min %.2f max %.2f' % (lat.min(), lat.max()))
    # quantisation of %11.4e: mantissa step 1e-4 -> 0.1 km for 1000-9999 km, 0.01 km for 100-999 km
    big = np.abs(np.concatenate([d['X'], d['Y'], d['Z']]))
    print('component |value| >= 1000 km share: %.3f (step 0.1 km, half-step 0.05 km)' % (big >= 1000).mean())

# ---------------------------------------------------------------- compare with the page's dated path
p = json.load(open(f'{REPO}/assets/moon/craft-moon-me-2026-06-R1.json'))
xyz = np.array(p['xyz_km'], dtype=float).reshape(-1, 3)
print('\n== dated LRO path on the page:', p['catalogue_revision'], '| n', p['time']['n'],
      '| frame', p['frame']['name'], '| step', p['time']['step_s'], 's')
assert len(xyz) == p['time']['n'] == 1441
d10, d11 = sec['2026-06-10'], sec['2026-06-11']
cr = np.stack([d10['X'], d10['Y'], d10['Z']], 1)  # one per UTC second of 10 June
idx = np.arange(0, 86400, 60)  # 00:00, 00:01 ... 23:59 of 10 June
diff = np.linalg.norm(cr[idx] - xyz[:1440], axis=1)
last = np.linalg.norm(np.array([d11['X'][0], d11['Y'][0], d11['Z'][0]]) - xyz[1440])
allp = np.append(diff, last)
print('CRaTER MOONVEC vs page path at the 1441 minute marks (CRaTER record time = whole UTC second;'
      ' SECONDS/FRACT carry .18-.20 s):')
print('  |difference| km: median %.4f p95 %.4f max %.4f (argmax minute %d)'
      % (np.median(allp), np.percentile(allp, 95), allp.max(), int(allp.argmax())))
# expected size of a ~0.19 s timing offset at orbital speed
v = np.linalg.norm(np.diff(cr, axis=0), axis=1)
print('  CRaTER speed from 1 s differences km/s: median %.4f (0.19 s x that = %.3f km)'
      % (np.median(v), 0.19 * np.median(v)))
print('  FRACT unique values 10 June:', np.unique(d10['FRACT']).tolist())

# ---------------------------------------------------------------- L2 PRI slice
print('\n== L2 PRI slice (first 20,000 records of 10 June)')
raw = open(f'{SRC}/CRAT_L2_PRI_2026161_V01_bytes0-4799999.TAB', 'rb').read()
assert len(raw) == 4800000 and len(raw) % 240 == 0
rows = [raw[i:i + 240][:-2].decode('ascii').split(',') for i in range(0, len(raw), 240)]
assert all(len(r) == 35 for r in rows)
S = np.array([int(r[0]) for r in rows])
IDX = np.array([int(r[3]) for r in rows])
AM = np.array([[int(x) for x in r[4:10]] for r in rows])
EN = np.array([[float(x) for x in r[10:16]] for r in rows])
LET = np.array([[float(x) for x in r[16:22]] for r in rows])
DQI = np.array([float(r[22]) for r in rows])
MAXF = np.array([[int(x) for x in r[23:29]] for r in rows])
GTL = np.array([[int(x) for x in r[29:35]] for r in rows])
print('records', len(rows), '| UTC', rows[0][2], 'to', rows[-1][2])
secs = np.unique(S)
print('distinct seconds', len(secs), '| last second may be partial (slice boundary)')
# events per second vs SEC GOOD for the same seconds (exclude the last, possibly cut, second)
g = dict(zip(d10['SECONDS'].astype(int), d10['GOOD'].astype(int)))
cnt = {s: int((S == s).sum()) for s in secs[:-1]}
eq = sum(1 for s, c in cnt.items() if g.get(s) == c)
print('seconds where PRI record count == SEC GOOD:', eq, 'of', len(cnt))
mis = [(s, cnt[s], g.get(s)) for s in cnt if g.get(s) != cnt[s]][:5]
print('  first mismatches (second, PRI count, SEC GOOD):', mis)
print('INDEX restarts at 0 each second:', all(IDX[S == s].min() == 0 for s in secs))
G = np.array([76.3, 21.8, 78.6, 21.6, 76.3, 21.9]); O = np.array([105.1, 50.0, 152.8, 74.7, 119.1, 46.6])
pred = G * AM + O
rel = np.abs(EN - pred) / pred
print('ENERGY vs Gi*AMPL+Oi (V1.0 table): max relative diff per detector', np.round(rel.max(axis=0), 4).tolist())
z = AM == 0
print('AMPL==0 entries per detector', z.sum(axis=0).tolist())
print('  ENERGY at AMPL==0 equals the offset Oi exactly:',
      [bool(np.all(EN[z[:, k], k] == O[k])) for k in range(6)])
th = EN / LET
print('ENERGY/LET (implied path, micron): median per detector', np.round(np.median(th, axis=0), 1).tolist())
print('GTLLD flag share =1 per detector', np.round(GTL.mean(axis=0), 4).tolist())
for k in range(6):
    a1 = AM[GTL[:, k] == 1, k]; a0 = AM[GTL[:, k] == 0, k]
    print(f'  D{k+1}: AMPL when flag=1 min {a1.min() if len(a1) else None} | when flag=0 max {a0.max() if len(a0) else None} '
          f'| AMPL==0 with flag=1: {int(((AM[:, k] == 0) & (GTL[:, k] == 1)).sum())}')
print('MAXSIG flags set per detector', MAXF.sum(axis=0).tolist())
u, c = np.unique(DQI, return_counts=True)
print('DQI unique values (value: count)', dict(zip(u.tolist()[:8], c.tolist()[:8])))
# energy deposited summed over the slice, per detector, using only GTLLD-flagged entries (illustration of
# what a dose computation would need; no detector mass is applied here)
Esum = np.where(GTL == 1, EN, 0).sum(axis=0) / 1000.0
print('summed ENERGY over flagged entries, MeV per detector (slice only):', np.round(Esum, 1).tolist())
print('slice spans s:', int(S[-1] - S[0] + 1))
