"""Moon item 5 (CRaTER): locate the maximum of the offset-corrected position difference (assess_crater_2 (b))."""
import sys, json
import numpy as np
SRC, REPO = sys.argv[1], sys.argv[2]
def sec_xyz(fn):
    raw = open(f'{SRC}/{fn}', 'rb').read()
    rr = [raw[i:i + 194][:-2].decode('ascii').split(',') for i in range(0, len(raw), 194)]
    return (np.array([int(r[0]) + int(r[1]) / 100 for r in rr]),
            np.array([[float(r[29]), float(r[30]), float(r[31])] for r in rr]))
t10, x10 = sec_xyz('CRAT_L2_SEC_2026161_V01.TAB'); t11, x11 = sec_xyz('CRAT_L2_SEC_2026162_V01.TAB')
t = np.concatenate([t10, t11]); x = np.concatenate([x10, x11])
P = np.array(json.load(open(f'{REPO}/assets/moon/craft-moon-me-2026-06-R1.json'))['xyz_km'], float).reshape(-1, 3)
tp = 802742400.0 + 60.0 * np.arange(len(P))
for eps in (0.0, 0.02):
    q = np.stack([np.interp(tp, t + eps, x[:, k]) for k in range(3)], 1)
    d = np.linalg.norm(q - P, axis=1)
    i = int(d.argmax())
    print(f'eps {eps}: argmax minute {i} ({d[i]:.4f} km); first page time before first CRaTER tag: {tp[0] < t[0] + eps}')
    print(f'   excluding minute 0: n {len(d)-1} median {np.median(d[1:]):.4f} p95 {np.percentile(d[1:],95):.4f} max {d[1:].max():.4f} km')
