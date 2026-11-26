#!/usr/bin/env python3
"""Build the Moon height layer's two page files from LOLA LDEM_4_FLOAT V3.0 (MOON-LRO-SCIENCE-PROPOSAL rev 2.1).

  python3 -I phase1/moonsci/build_lola.py --src <dir with ldem_4_float.img>          writes assets/moon/lola/*
  python3 -I phase1/moonsci/build_lola.py --src <dir> --check                         rebuilds in memory, compares bytes

Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/float_img/ldem_4_float.img
(4,147,200 B, sha256 pinned below; float32 LE, km relative to 1737.4 km; 1440 x 720, 0.25 deg, pixel registered;
row 0 at 90 N, column 0 at 0 E). Any other file is refused.

Outputs:
  ldem4-m-R1.i16.gz   int16 little-endian, row-major 720 x 1440 in the SOURCE order; whole metres rounded in float64
                      (round half to even, numpy); -32768 = withheld (rows 0-1, north of 89.5 N, and nowhere else);
                      gzip level 9, mtime 0, no file name -> reproducible bytes.
  ldem4-colour-R1.png 2048 x 1024 colour texture, 0 deg longitude at the image centre (as the page's Moon picture);
                      each pixel takes the colour of the 0.25 deg cell containing its centre (no interpolation);
                      withheld cap plain grey; one-hue blue ramp, dark = low, light = high
                      (dark-surface sequential ramp from the repo's dataviz palette, steps 700..100, OKLab interpolation,
                      254 colours, about 79 m of height per colour step); indexed PNG with 255 palette entries.
Needs numpy and Pillow (build machine only; the page needs neither)."""
import argparse, gzip, hashlib, io, json, sys
import numpy as np
from PIL import Image

SRC_SHA = '6eaee9376442dc851b8f8e94790499ec339d923367d7b8608a4316088b85bd45'
SRC_BYTES = 4147200
OUT = 'assets/moon/lola'
LO_M, HI_M = -9000.0, 11000.0             # ramp ends (source range -8,879 .. +10,504 m)
WITHHELD = -32768
RAMP = ['#0e3d7e', '#0f4a96', '#1757ac', '#1b64be', '#2370cd', '#257de0', '#338ced', '#519ced', '#6aabf1', '#84b9f3',
        '#9dc8f7', '#b6d5f8', '#cce3fd']   # palette.md blue 700 -> 100
CAP = (0x8c, 0x8c, 0x8c)   # neutral grey, never in the ramp (the page also draws the cap as a grey polygon on top)

def srgb2lin(c): c = c / 255; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lin2srgb(c): c = np.clip(c, 0, 1); return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055) * 255
M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]])
M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]])
def to_oklab(rgb): return (np.cbrt(srgb2lin(rgb) @ M1.T)) @ M2.T
def from_oklab(lab): return lin2srgb(((lab @ np.linalg.inv(M2).T) ** 3) @ np.linalg.inv(M1).T)

def ramp_lut(n=254):
    """n colours from LO_M to HI_M, OKLab-interpolated between the 13 ramp steps (lightness monotone)."""
    steps = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in RAMP], float)
    lab = to_oklab(steps); t = np.linspace(0, len(RAMP) - 1, n); i = np.minimum(t.astype(int), len(RAMP) - 2); f = (t - i)[:, None]
    out = from_oklab(lab[i] * (1 - f) + lab[i + 1] * f)
    L = to_oklab(out)[:, 0]; assert np.all(np.diff(L) > -1e-9), 'ramp lightness must rise'
    return np.round(out).astype(np.uint8)

def colour_of(metres, lut):
    k = np.clip(np.round((metres - LO_M) / (HI_M - LO_M) * (len(lut) - 1)), 0, len(lut) - 1).astype(int)
    return lut[k]

def build(src):
    raw = open(src, 'rb').read()
    if len(raw) != SRC_BYTES or hashlib.sha256(raw).hexdigest() != SRC_SHA:
        sys.exit('refused: not the pinned LDEM_4_FLOAT V3.0 file')
    h = np.frombuffer(raw, '<f4').reshape(720, 1440).astype(np.float64)
    m = np.round(h * 1000)
    assert np.abs(m - h * 1000).max() <= 0.5 + 1e-9
    m = m.astype(np.int32); assert m.min() > WITHHELD and m.max() < 32767
    m[0:2, :] = WITHHELD
    grid = m.astype('<i2').tobytes()
    gz = gzip.compress(grid, 9, mtime=0)
    # colour texture: 2048 x 1024, 0 deg at the centre
    W, H = 2048, 1024
    lon = ((np.arange(W) + 0.5) / W * 360 - 180) % 360
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    col = np.minimum((lon * 4).astype(int), 1439); row = np.minimum(((90 - lat) * 4).astype(int), 719)
    cells = m[row[:, None], col[None, :]]
    lut = ramp_lut(); img = colour_of(cells.astype(float), lut)
    wh = cells == WITHHELD
    img[wh] = np.array(CAP, np.uint8)
    # indexed PNG: 254 ramp colours + 1 grey = 255 entries, exact colours, no interpolation
    pal = np.vstack([lut, np.array([CAP], np.uint8)])
    idx = np.clip(np.round((cells.astype(float) - LO_M) / (HI_M - LO_M) * (len(lut) - 1)), 0, len(lut) - 1).astype(np.uint8)
    idx[wh] = len(lut)
    assert np.array_equal(pal[idx], img)
    pim = Image.fromarray(idx, 'P'); pim.putpalette(pal.flatten().tolist())
    b = io.BytesIO(); pim.save(b, 'PNG', optimize=True, compress_level=9); png = b.getvalue()
    info = {'grid_gz': {'bytes': len(gz), 'sha256': hashlib.sha256(gz).hexdigest()},
            'grid_raw': {'bytes': len(grid), 'sha256': hashlib.sha256(grid).hexdigest()},
            'colour_png': {'bytes': len(png), 'sha256': hashlib.sha256(png).hexdigest()},
            'withheld_cells': int((m == WITHHELD).sum()), 'min_m': int(m[2:].min()), 'max_m': int(m.max()),
            'ramp': {'lo_m': LO_M, 'hi_m': HI_M, 'steps': RAMP}}
    return gz, png, info

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
    gz, png, info = build(f'{a.src}/ldem_4_float.img')
    if a.check:
        ok = open(f'{OUT}/ldem4-m-R1.i16.gz', 'rb').read() == gz and open(f'{OUT}/ldem4-colour-R1.png', 'rb').read() == png
        print(json.dumps(info, indent=1)); print('check:', 'OK, both files byte-identical' if ok else 'DIFFERENT'); sys.exit(0 if ok else 1)
    open(f'{OUT}/ldem4-m-R1.i16.gz', 'wb').write(gz); open(f'{OUT}/ldem4-colour-R1.png', 'wb').write(png)
    print(json.dumps(info, indent=1))
