#!/usr/bin/env python3
"""Moon / LRO science assessment: checks on the small real samples (26 Nov 2026, Claude).

Docs-only evidence script. It reads sample files fetched from PDS in the browser pane (the workspace
cannot reach PDS) and prints the numbers quoted in SAMPLES.md and the proposal. The samples are NOT
committed (research stays text only); SAMPLES.md gives each file's URL, size and SHA-256 so it can be
fetched again and checked.

Usage:  python3 -I assess_samples.py <samples-dir> <repo-root>
Needs:  numpy, Pillow.
"""
import gzip, hashlib, io, sys
import numpy as np
from PIL import Image

S, REPO = sys.argv[1], sys.argv[2]
EXPECT = {
    'ldem_4_float.img': '6eaee9376442dc851b8f8e94790499ec339d923367d7b8608a4316088b85bd45',
    'ldec_4.img': '10ccc1253a7adab1ecb651d26b00ef6cbfa41107fd40f8998b5ab9fa5f9ee943',
    'gcp_00n10n_rows0-19199.tab': 'b1f930da3d4a8de1e136ac71c90947e1d7dc3e82d54114f6b722eaa68802ba97',
    'gcp_80n90n_rows0-19199.tab': '9c1de7250ce3f24e6520623916dd910efd4ec2ba620aa20395e7df886c7f6264',
}
for f, h in EXPECT.items():
    got = hashlib.sha256(open(f'{S}/{f}', 'rb').read()).hexdigest()
    assert got == h, f'{f}: sha256 {got} != {h}'
print('A. sample hashes match SAMPLES.md')

# ---------- LOLA LDEM_4_FLOAT (V3.0) ----------
h = np.fromfile(f'{S}/ldem_4_float.img', '<f4').reshape(720, 1440)      # km relative to 1737.4 km
c = np.fromfile(f'{S}/ldec_4.img', '<i2').reshape(720, 1440)            # returns per cell
lat = lambda i: (359.5 - i) / 4              # label: LINE_PROJECTION_OFFSET 359.5, 4 pix/deg, pixel registered
lon = lambda j: (j - 719.5) / 4 + 180        # label: SAMPLE_PROJECTION_OFFSET 719.5, CENTER_LONGITUDE 180, east positive
print('B1. min/max km', float(h.min()), float(h.max()), '| NaN', int(np.isnan(h).sum()))
for name, fn in (('max', h.argmax), ('min', h.argmin)):
    i, j = np.unravel_index(fn(), h.shape)
    print(f'B2. {name} cell centre {lat(i):.3f} N, {lon(j):.3f} E  value {h[i, j]:.3f} km '
          f'(cell spans lat {lat(i)-0.125:.3f}..{lat(i)+0.125:.3f}, lon {lon(j)-0.125:.3f}..{lon(j)+0.125:.3f})')
z = np.argwhere(h == 0)
print('B3. exact 0.0 values:', len(z), 'rows', sorted(set(z[:, 0].tolist())))
for r in (0, 1, 2, 3, 716, 717, 718, 719):
    print(f'    row {r} lat {lat(r):+.3f}: mean {h[r].mean()*1000:8.1f} m  min {h[r].min()*1000:8.1f}  max {h[r].max()*1000:8.1f}')
print('B4. returns per cell min/median/max', int(c.min()), float(np.median(c)), int(c.max()), '| cells with 0 returns', int((c == 0).sum()))
print('B5. seam |col0 - col1439| mean km', round(float(np.abs(h[:, 0] - h[:, -1]).mean()), 3),
      ' typical neighbour |d| km', round(float(np.abs(np.diff(h, axis=1)).mean()), 3))
rd = np.abs(np.diff(h, axis=0)).mean(axis=1)
print('B6. mean row-to-row |d| km: all', round(float(rd.mean()), 3), ' at 45N', round(float(rd[179]), 3),
      ' at equator', round(float(rd[359]), 3), ' at 45S', round(float(rd[539]), 3))

# registration against the Moon picture already on the page (independent image, 0 deg longitude at its centre)
tex = np.asarray(Image.open(f'{REPO}/assets/moon/lroc_color_2k.jpg').convert('L').resize((1440, 720), Image.BILINEAR), float)
hc = np.roll(h, 720, axis=1)                  # put 0 deg E at the centre, as in the picture
band = slice(120, 600)                        # 60 N .. 60 S (the picture's own data reach 70 N/S)
cc = lambda a: round(float(np.corrcoef(a[band].ravel(), tex[band].ravel())[0, 1]), 4)
print('B7. correlation height vs picture brightness, shift in 0.25 deg cells (lon):',
      {s: cc(np.roll(hc, s, axis=1)) for s in range(-3, 4)})
print('    (lat):', {s: cc(np.roll(hc, s, axis=0)) for s in range(-3, 4)},
      ' east-west mirrored:', cc(hc[:, ::-1]), ' north-south flipped:', cc(hc[::-1]))

# sizes of candidate page files (measured; colour ramp is a placeholder, final ramp will differ slightly)
m = np.round(h * 1000).astype(np.int32)
print('B8. whole-metre rounding: max error m', round(float(np.abs(m / 1000 - h).max() * 1000), 4))
u = (m + 10000).astype(np.uint16); b = io.BytesIO(); Image.fromarray(u).save(b, 'PNG', optimize=True)
print('    16-bit PNG of whole metres (+10000 offset):', b.tell(), 'B;  int16 raw gzip -9:', len(gzip.compress(m.astype('<i2').tobytes(), 9)), 'B')
t = np.clip((hc + 9.0) / 19.6, 0, 1)
rgb = (np.stack([t, t ** 0.8, 1 - t * 0.6], -1) * 255).astype(np.uint8)
for W in (1440, 2048):
    im = Image.fromarray(rgb).resize((W, W // 2), Image.BILINEAR)
    out = {}
    for fmt, kw in (('PNG', {'optimize': True}), ('WEBP', {'quality': 85}), ('JPEG', {'quality': 85})):
        b = io.BytesIO(); im.save(b, fmt, **kw); out[fmt] = b.tell()
    print(f'    colour picture {W}x{W//2}:', out)

# ---------- Diviner GCP (Williams et al. 2017), two contiguous samples ----------
for f in ('gcp_00n10n_rows0-19199.tab', 'gcp_80n90n_rows0-19199.tab'):
    a = np.loadtxt(f'{S}/{f}', delimiter=',')
    lt, tb = a[:, 2], a[:, 10]; ok = tb > -9000
    print(f'C. {f}: lon {a[:,0].min()}..{a[:,0].max()} lat {a[:,1].min()}..{a[:,1].max()} local-time bins {len(np.unique(lt))}')
    print(f'   tbol -9999 (no observations) {(tb == -9999).mean():.1%}; -9998 {int((tb == -9998).sum())}; range {tb[ok].min()}..{tb[ok].max()} K')
    neg = {f't{k}': int((a[:, k][a[:, k] > -9000] < 0).sum()) for k in range(3, 10)}
    print('   negative channel brightness temperatures (label: below channel sensitivity):', neg)
    for lo, hi in ((11.5, 12.5), (23.5, 0.5)):
        w = ((lt >= lo) & (lt < hi)) if lo < hi else ((lt >= lo) | (lt < hi))
        cells = {}
        for row in a[w & ok]:
            cells.setdefault((row[0], row[1]), []).append(row[10])
        means = [np.mean(v) for v in cells.values()]
        spread = np.mean([max(v) - min(v) for v in cells.values()])
        print(f'   window {lo}-{hi} h: cells with tbol {len(cells)} of 200; mean-of-bins range {min(means):.1f}..{max(means):.1f} K; mean spread inside window {spread:.2f} K')
    single = [int(ok[(lt >= hh) & (lt < hh + 0.25)].sum()) for hh in range(24)]
    print('   single 15-min bin at each whole hour, cells with tbol (of 200):', single)
