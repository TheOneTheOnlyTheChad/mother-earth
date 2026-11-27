"""Moon item 5 (CRaTER): is a per-minute event-rate display signal or counting noise?
GOOD = coincidence-accepted events per 1 s readout (L2 SEC). Per-minute sums along 10-11 June 2026,
compared with Poisson expectation and with altitude above the 1737.4 km sphere (same records' MOONVEC)."""
import sys
import numpy as np
SRC = sys.argv[1]
def load(fn):
    raw = open(f'{SRC}/{fn}', 'rb').read()
    rr = [raw[i:i + 194][:-2].decode('ascii').split(',') for i in range(0, len(raw), 194)]
    g = np.array([int(r[26]) for r in rr], float)
    x = np.array([[float(r[29]), float(r[30]), float(r[31])] for r in rr])
    return g, np.linalg.norm(x, axis=1) - 1737.4, np.degrees(np.arcsin(x[:, 2] / np.linalg.norm(x, axis=1)))
for fn in ['CRAT_L2_SEC_2026161_V01.TAB', 'CRAT_L2_SEC_2026162_V01.TAB']:
    g, alt, lat = load(fn)
    gm = g.reshape(1440, 60).sum(1); am = alt.reshape(1440, 60).mean(1); lm = lat.reshape(1440, 60).mean(1)
    sd, pois = gm.std(), np.sqrt(gm.mean())
    print(f'{fn}: per-minute GOOD sum mean {gm.mean():.1f} sd {sd:.1f}; Poisson sd {pois:.1f}; ratio {sd/pois:.3f}')
    print(f'   min {gm.min():.0f} max {gm.max():.0f} | Pearson r with altitude {np.corrcoef(gm, am)[0,1]:.3f} | with |lat| {np.corrcoef(gm, np.abs(lm))[0,1]:.3f}')
    lo, hi = am < np.percentile(am, 20), am > np.percentile(am, 80)
    print(f'   lowest-altitude fifth (mean alt {am[lo].mean():.1f} km): mean {gm[lo].mean():.1f}/min; highest fifth ({am[hi].mean():.1f} km): {gm[hi].mean():.1f}/min; diff {100*(gm[hi].mean()/gm[lo].mean()-1):.2f}%')
    # 10-minute and orbit (~113 min) smoothing
    g10 = g.reshape(144, 600).sum(1)
    print(f'   per-10-min: sd/Poisson {g10.std()/np.sqrt(g10.mean()):.3f}')
