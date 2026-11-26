"""LROC Apollo 11 retained-source check (Moon item 4). Build tooling; never served.

A second, independent implementation (numpy) of the source-pixel checks first made in the pane by lroc_pixels.js.
Reads the RETAINED files from the Mac's _source-data/moon-lro-science-lroc/ (or a copy) and checks:
hashes against the retention records; special-code census; the site crop and area window (their int16 SHA-256 must
equal the pane's); the landmark tests on unstretched DN; the 2x2 valid-count histogram. Exits 1 on any failure.
Pixel convention: the attached PDS3 header's NOTE (LROC, adopted Nov 2011) -- the centre of the upper-left pixel is
(line, sample) = (1.0, 1.0) and the offsets run from it to the projection origin, positive right/below. Hence
line = L0 - y/s + 1, sample = S0 + x/s + 1 (pixel centres at integers).
Run: python3 -I phase1/moonsci/lroc/lroc_source_check.py <dir with the retained files>
"""
import hashlib, math, sys, os
import numpy as np

d = sys.argv[1]
fails = []
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + str(info)) if info != '' else ''))
    if not ok: fails.append(name)
def sha(b): return hashlib.sha256(b).hexdigest()

R, C = 1737400.0, math.cos(math.radians(1.0))
P50 = dict(s=0.49999999999999, L0=74989.5, S0=9497505.5, NS=8440)
P2 = dict(s=2.0000000000006, L0=18747.5, S0=2374376.5, NS=2111, NL=13978, HDR=4222)
LM = (0.67416, 23.47314)
def fwd(p, lat, lon): return (p['L0'] - R * math.radians(lat) / p['s'] + 1, p['S0'] + R * C * math.radians(lon - 180) / p['s'] + 1)
def off_m(p, L, S):
    Lp, Sp = fwd(p, *LM); return (round((S - Sp) * p['s'], 3), round((Lp - L) * p['s'], 3))

# --- retained files
b50 = open(os.path.join(d, 'LROC_A11_M150368601_50CM_bytes567049840-584334959.bin'), 'rb').read()
b2 = open(os.path.join(d, 'NAC_DTM_APOLLO11_M150368601_2M.IMG'), 'rb').read()
check('0.5 m range: 17,285,120 B, SHA-256 = checkpoint 1', len(b50) == 17285120 and sha(b50) == '3bd1b8627c8ba81d33a3ac756ec999b7276ec40356f1b3d3c99d57defc71a2fa')
check('2 m file: 59,023,560 B, MD5 = label', len(b2) == 59023560 and hashlib.md5(b2).hexdigest() == '187f3d1dac32aff7f00c512ec4907cdf')
import re
def kw(h, k): return re.search(r'\n\s*' + re.escape(k) + r'\s*=\s*([^\r\n]+)', h).group(1).strip()
hdr = b2[:8444].decode('latin1')
check('2 m attached header carries the Nov 2011 pixel-centre NOTE', 'The center of the upper left pixel is' in hdr and 'adopted in' in hdr)
RB, LR, IM = int(kw(hdr, 'RECORD_BYTES')), int(kw(hdr, 'LABEL_RECORDS')), int(kw(hdr, '^IMAGE'))
OFF2 = (IM - 1) * RB
print(f'  2 m PDS3: RECORD_BYTES {RB}, LABEL_RECORDS {LR}, ^IMAGE {IM} -> image offset {OFF2} B (PDS4 label says 4222)')
check('2 m image offset from the PDS3 header is 8,444 B and the file size matches exactly', OFF2 == 8444 and len(b2) == OFF2 + 13978 * 2111 * 2)
check('2 m PDS4 label offset (4,222 B) does NOT match: one 4,222-byte line early (recorded label error)', OFF2 - 4222 == 2111 * 2)
h50 = open(os.path.join(d, 'NAC_DTM_APOLLO11_M150368601_50CM_PDS3HEADER_bytes0-16879.bin'), 'rb').read()
check('0.5 m PDS3 header file: 16,880 B, SHA-256 = retention line 3', len(h50) == 16880 and sha(h50) == '5bbfe9e375945435c7f57b9bde3577286a1ab03651b4f57c3b739977cc48240a')
h50 = h50.decode('latin1')
if True:
    check('0.5 m PDS3: LABEL_RECORDS 1, ^IMAGE 2, RECORD_BYTES 16880 -> offset 16,880 B (agrees with its PDS4 label)', (kw(h50, 'LABEL_RECORDS'), kw(h50, '^IMAGE'), kw(h50, 'RECORD_BYTES')) == ('1', '2', '16880'))

a50 = np.frombuffer(b50, dtype='<i2').reshape(1024, 8440)          # lines 33593..34616
a2 = np.frombuffer(b2[OFF2:], dtype='<i2').reshape(13978, 2111)
a2_pane = np.frombuffer(b2[4222:4222 + 13978 * 2111 * 2], dtype='<i2').reshape(13978, 2111)   # what the pane read (offset 4,222)
def census(a):
    out = {str(c): int((a == c).sum()) for c in (-32768, -32767, -32766, -32765, -32764)}
    v = a[a > -32764]; return dict(valid=int(v.size), min=int(v.min()), max=int(v.max()), special=out)
c50, c2 = census(a50), census(a2)
print('  census 0.5 m range', c50); print('  census 2 m whole', c2)
check('only -32768 occurs among the special codes (both files)', all(c50['special'][k] == 0 and c2['special'][k] == 0 for k in ('-32767', '-32766', '-32765', '-32764')))
cp = census(a2_pane)
check('0.5 m census equals the pane (missing 246,336)', c50['special']['-32768'] == 246336)
check('the pane 2 m census (missing 944,614; max 24,407) is reproduced only by the wrong 4,222-B offset', cp['special']['-32768'] == 944614 and cp['max'] == 24407 and c2['max'] != 24407, f"corrected: missing {c2['special']['-32768']}, max {c2['max']}")

# --- crops (1-based inclusive, from lroc_geom.py)
site = np.ascontiguousarray(a50[0:1024, 5603 - 1:5603 - 1 + 1024])
area = np.ascontiguousarray(a2[7527 - 1:7527 - 1 + 2000, 0:2110])
check('site crop int16 SHA-256 equals the pane', sha(site.tobytes()) == '18a0603b34a01b36403af17750cf5483fe3753a3fc89a42832b9aa71d16e1fd8')
area_pane = np.ascontiguousarray(a2_pane[7527 - 1:7527 - 1 + 2000, 0:2110])
check('the pane area window hash is reproduced only by the wrong offset (proves the one-line shift)', sha(area_pane.tobytes()) == 'a84a2c598f730a4750541e39e24d7ddded908e0968b073ee2a3878a42d123a10' and sha(area.tobytes()) != sha(area_pane.tobytes()))
print('  corrected area window int16 SHA-256', sha(area.tobytes()))
check('site crop has no special values', int((site <= -32764).sum()) == 0)

# --- landmark (unstretched DN)
def local_max(arr, p, L1, S1, radius_m=12.0):
    Lp, Sp = fwd(p, *LM); r0, c0 = Lp - L1, Sp - S1; rp = math.ceil(radius_m / p['s'])
    best, pos, ties = -10**9, None, 0
    for r in range(math.floor(r0 - rp), math.floor(r0 + rp) + 1):
        for c in range(math.floor(c0 - rp), math.floor(c0 + rp) + 1):
            v = int(arr[r, c])
            if v <= -32764: continue
            if v > best: best, pos, ties = v, (r, c), 1
            elif v == best: ties += 1
    return best, ties, off_m(p, L1 + pos[0], S1 + pos[1])
g = np.unravel_index(int(np.argmax(np.where(site > -32764, site, -32768))), site.shape)
gmax = int(site[g]); gties = int((site == gmax).sum())
lm5 = local_max(site, P50, 33593, 5603); lm2 = local_max(area, P2, 7527, 1)
print('  0.5 m: crop max', gmax, 'ties', gties, 'offset m (E,N)', off_m(P50, 33593 + g[0], 5603 + g[1]), '| local 12 m max', lm5)
print('  2 m: local 12 m max', lm2)
check('0.5 m: the crop maximum is unique and within 1 m of the published LM', gties == 1 and math.hypot(*off_m(P50, 33593 + g[0], 5603 + g[1])) < 1.0)
check('0.5 m: local maximum equals the pane result (446 at -0.326 E, +0.46 N)', lm5 == (446, 1, (-0.326, 0.46)))
lm2p = local_max(area_pane, P2, 7527, 1)
check('the pane 2 m local maximum (268 at +0.924 E, -1.79 N) is reproduced only by the wrong offset', lm2p == (268, 1, (0.924, -1.79)))
check('2 m (correct offset): local maximum within 2 m of the published LM', math.hypot(*lm2[2]) <= 2.0, lm2)
ga = np.unravel_index(int(np.argmax(np.where(area > -32764, area, -32768))), area.shape)
check('2 m: the area maximum is NOT the LM (control: it is over 1 km away)', math.hypot(*off_m(P2, 7527 + ga[0], 1 + ga[1])) > 1000, off_m(P2, 7527 + ga[0], 1 + ga[1]))

# --- 2x2 valid-count rule (>= 2 of 4 valid)
v = (area > -32764).reshape(1000, 2, 1055, 2).sum(axis=(1, 3))
hist = [int((v == k).sum()) for k in range(5)]
print('  2x2 valid-count histogram (correct offset)', hist, ' (pane, shifted: [30586, 2, 1999, 2, 1022411])')
check('2x2 histogram accounts for all 1,055,000 output pixels', sum(hist) == 1055000)
print('  rule >= 2 of 4: no-data output pixels', hist[0] + hist[1], '; averaged partial blocks', hist[2] + hist[3])
print('RESULT', 'FAIL' if fails else 'PASS', len(fails), 'failures')
sys.exit(1 if fails else 0)
