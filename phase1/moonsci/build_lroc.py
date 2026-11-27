"""Build the Moon LROC regional-detail assets (Apollo 11) from the RETAINED source files. Build tooling; never served.

MOON-LROC-REGION-PROPOSAL rev 2.1 §7, with GPT's closure notes (reviews/2026-11-26-moon-lroc-retention-frame-rev21-gpt-recheck.md):
  * inputs only from the retained, hash-checked files (Mac _source-data/moon-lro-science-lroc/); no archive fetch
  * binary layout derived from the ATTACHED PDS3 headers and reconciled exactly with file/range lengths; PDS4 conflicts recorded,
    archive metadata never rewritten; little-endian decode stated explicitly ('<i2')
  * pixel convention: header NOTE / SIS v1.6 §6.4 (centre of the upper-left pixel = (1.0, 1.0)): line = L0 - y/s + 1, sample = S0 + x/s + 1
  * site: 0.5 m lines 33593-34616, samples 5603-6626 (1-based); area: 2 m lines 7527-9526, samples 1-2110 (2111 dropped), 2x2 blocks,
    mean of valid DN if >= 2 of 4 valid else no data (Chad, D6); any saturation code in a window stops the build
  * stretch v = clamp(floor((DN - 144) * 255 / 95 + 0.5), 0, 255) after averaging; greyscale JPEG q80 baseline, not optimised (Pillow)
  * no-data mask: lossless RGBA PNG, alpha 255 where no data, used as a CSS mask for the hatched overlay
Usage:
  python3 -I phase1/moonsci/build_lroc.py --src <dir>            write assets/moon/lroc/* and SOURCE.json
  python3 -I phase1/moonsci/build_lroc.py --src <dir> --check    rebuild in memory, compare with the committed files, run the checks
Exits 1 on any failure.
"""
import argparse, hashlib, io, json, math, os, re, sys
import numpy as np
from PIL import Image, features
import PIL

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'moon', 'lroc')
BUILDER = 'phase1/moonsci/build_lroc.py'
# Retained inputs (checkpoints.jsonl retention lines 1-5): name -> (bytes, sha256)
INPUTS = {
    'range50': ('LROC_A11_M150368601_50CM_bytes567049840-584334959.bin', 17285120, '3bd1b8627c8ba81d33a3ac756ec999b7276ec40356f1b3d3c99d57defc71a2fa'),
    'img2': ('NAC_DTM_APOLLO11_M150368601_2M.IMG', 59023560, '73de3c6ec94109cc466adf87dbbcc320116e5d41f3f6f473fbb22cc1e32aeff8'),
    'hdr50': ('NAC_DTM_APOLLO11_M150368601_50CM_PDS3HEADER_bytes0-16879.bin', 16880, '5bbfe9e375945435c7f57b9bde3577286a1ab03651b4f57c3b739977cc48240a'),
    'xml50': ('NAC_DTM_APOLLO11_M150368601_50CM.xml', 12523, '7bd41644078a82d3208a9e41d17a92c7e461a21e22efd325f822bb91b1d80ae8'),
    'xml2': ('NAC_DTM_APOLLO11_M150368601_2M.xml', 12504, 'ac7849d4ee93afe39514100b674faf98887410f8ff0dbb4a9ac7fddc55f97879'),
}
MD5_2M = '187f3d1dac32aff7f00c512ec4907cdf'
RANGE50 = (567049840, 584334959)
SITE = dict(L1=33593, S1=5603, N=1024)
AREA = dict(L1=7527, N=2000, S1=1, W=2110, dropped=2111)
EXPECT = dict(site_sha='18a0603b34a01b36403af17750cf5483fe3753a3fc89a42832b9aa71d16e1fd8',
              area_sha='4cd6d42d1286901a1091636fc3c7792f62a3668bffbd4cb0d1a3b8aedd74138f',
              hist=[30579, 10, 1999, 10, 1022402])
LO, HI = 144, 239
JPEG = dict(quality=80, optimize=False, progressive=False)
LM = (0.67416, 23.47314)
R, C = 1737400.0, math.cos(math.radians(1.0))
SPECIAL = (-32768, -32767, -32766, -32765, -32764)

class BuildError(Exception): pass
def sha(b): return hashlib.sha256(b).hexdigest()

def read_inputs(src):
    out = {}
    for k, (name, n, h) in INPUTS.items():
        p = os.path.join(src, name)
        if not os.path.exists(p): raise BuildError(f'missing input {name}')
        b = open(p, 'rb').read()
        if len(b) != n: raise BuildError(f'{name}: {len(b)} bytes, expected {n}')
        if sha(b) != h: raise BuildError(f'{name}: SHA-256 differs from the retention record')
        out[k] = b
    if hashlib.md5(out['img2']).hexdigest() != MD5_2M: raise BuildError('2 m file: MD5 differs from the label')
    return out

def pds3(text):
    """The attached PDS3 header keywords this build relies on (first occurrence; values stripped of units)."""
    def kw(k):
        m = re.search(r'\n\s*' + re.escape(k) + r'\s*=\s*([^\r\n]+)', text)
        if not m: raise BuildError(f'PDS3 keyword {k} missing')
        return re.sub(r'\s*<[^>]*>\s*$', '', m.group(1).strip()).strip('"')
    keys = ['RECORD_BYTES', 'FILE_RECORDS', 'LABEL_RECORDS', '^IMAGE', 'LINES', 'LINE_SAMPLES', 'SAMPLE_TYPE', 'SAMPLE_BITS',
            'SCALING_FACTOR', 'OFFSET', 'MAP_PROJECTION_TYPE', 'A_AXIS_RADIUS', 'POSITIVE_LONGITUDE_DIRECTION', 'CENTER_LATITUDE',
            'CENTER_LONGITUDE', 'MAP_SCALE', 'LINE_PROJECTION_OFFSET', 'SAMPLE_PROJECTION_OFFSET', 'START_TIME', 'STOP_TIME', 'PRODUCT_ID']
    h = {k: kw(k) for k in keys}
    if 'The center of the upper left pixel is' not in text or 'adopted in' not in text: raise BuildError('PDS3 pixel-centre NOTE missing')
    return h

def layout(h, expect):
    """Integers from the header, checked against the values this build was reviewed with."""
    L = dict(rb=int(h['RECORD_BYTES']), lr=int(h['LABEL_RECORDS']), im=int(h['^IMAGE']), lines=int(h['LINES']), ns=int(h['LINE_SAMPLES']),
             fr=int(h['FILE_RECORDS']), s=float(h['MAP_SCALE']), L0=float(h['LINE_PROJECTION_OFFSET']), S0=float(h['SAMPLE_PROJECTION_OFFSET']))
    if h['SAMPLE_TYPE'] != 'LSB_INTEGER' or h['SAMPLE_BITS'] != '16': raise BuildError('sample type is not 16-bit LSB integer')
    if float(h['SCALING_FACTOR']) != 1.0 or float(h['OFFSET']) != 0.0: raise BuildError('scaling/offset not 1/0')
    if h['MAP_PROJECTION_TYPE'] != 'EQUIRECTANGULAR' or float(h['A_AXIS_RADIUS']) != 1737.4 or h['POSITIVE_LONGITUDE_DIRECTION'] != 'EAST': raise BuildError('projection basis differs')
    if float(h['CENTER_LATITUDE']) != 1.0 or float(h['CENTER_LONGITUDE']) != 180.0: raise BuildError('projection centre differs')
    if L['rb'] != 2 * L['ns'] or L['fr'] != L['lr'] + L['lines']: raise BuildError('record layout does not reconcile')
    for k, v in expect.items():
        if L[k] != v: raise BuildError(f'header {k} = {L[k]}, reviewed value {v}')
    L['offset'] = (L['im'] - 1) * L['rb']
    return L

def pds4_offset(xml):
    m = re.search(r'<Array_2D_Image>.*?<offset unit="byte">(\d+)</offset>', xml, re.S)
    return int(m.group(1)) if m else None

def decode(inp, wrong_2m_offset=False):
    """Source arrays. wrong_2m_offset=True reproduces the diagnosed error (PDS4's 4,222 B) for the negative control."""
    h50, h2 = pds3(inp['hdr50'].decode('latin1')), pds3(inp['img2'][:8444].decode('latin1'))
    L50 = layout(h50, dict(rb=16880, lr=1, im=2, lines=55908, ns=8440))
    L2 = layout(h2, dict(rb=4222, lr=2, im=3, lines=13978, ns=2111))
    if L50['offset'] != 16880 or L2['offset'] != 8444: raise BuildError('image offsets differ from the reviewed 16,880 / 8,444 B')
    if len(inp['img2']) != L2['offset'] + L2['lines'] * L2['rb']: raise BuildError('2 m file length does not reconcile with its header')
    # the 0.5 m range must start on a line boundary inside the image and hold whole lines
    first = RANGE50[0] - L50['offset']
    if first % L50['rb'] or len(inp['range50']) % L50['rb']: raise BuildError('0.5 m range is not whole lines')
    line0 = first // L50['rb'] + 1
    if line0 != SITE['L1'] or len(inp['range50']) // L50['rb'] != SITE['N']: raise BuildError('0.5 m range lines differ from the site crop')
    off2 = 4222 if wrong_2m_offset else L2['offset']
    a50 = np.frombuffer(inp['range50'], dtype='<i2').reshape(SITE['N'], L50['ns'])
    a2 = np.frombuffer(inp['img2'][off2:off2 + L2['lines'] * L2['rb']], dtype='<i2').reshape(L2['lines'], L2['ns'])
    conflicts = {
        '2m_array_offset': {'pds4_label': pds4_offset(inp['xml2'].decode('utf-8')), 'pds3_header': L2['offset'], 'used': 'pds3_header'},
        '50cm_array_offset': {'pds4_label': pds4_offset(inp['xml50'].decode('utf-8')), 'pds3_header': L50['offset'], 'used': 'pds3_header'},
        'upperleft_corner_x': {'pds4_label_m': 4748752.75, 'pds3_implied_centre_of_pixel_1_1_m': -L50['S0'] * L50['s'], 'used': 'pds3_header'},
    }
    if conflicts['50cm_array_offset']['pds4_label'] != 16880 or conflicts['2m_array_offset']['pds4_label'] != 4222: raise BuildError('PDS4 labels changed since review')
    return a50, a2, h50, h2, L50, L2, conflicts

def windows(a50, a2):
    site = np.ascontiguousarray(a50[:, SITE['S1'] - 1:SITE['S1'] - 1 + SITE['N']])
    area = np.ascontiguousarray(a2[AREA['L1'] - 1:AREA['L1'] - 1 + AREA['N'], AREA['S1'] - 1:AREA['S1'] - 1 + AREA['W']])
    for nm, w in (('site', site), ('area', area)):
        sat = {c: int((w == c).sum()) for c in SPECIAL[1:]}
        if any(sat.values()): raise BuildError(f'saturation code in the {nm} window: {sat} (stop for review)')
    if int((site <= -32764).sum()): raise BuildError('site crop has invalid pixels')
    return site, area

def stretch(x):
    return np.clip(np.floor((x - LO) * 255.0 / (HI - LO) + 0.5), 0, 255).astype(np.uint8)

def products(site, area):
    v = area > -32764
    cnt = v.reshape(1000, 2, 1055, 2).sum(axis=(1, 3))
    s = np.where(v, area, 0).astype(np.float64).reshape(1000, 2, 1055, 2).sum(axis=(1, 3))
    ok = cnt >= 2
    mean = np.where(ok, s / np.maximum(cnt, 1), 0.0)
    area8 = np.where(ok, stretch(mean), 128).astype(np.uint8)
    site8 = stretch(site.astype(np.float64))
    mask = np.zeros((1000, 1055, 4), np.uint8); mask[~ok, 3] = 255
    def enc(arr, fmt, **kw):
        b = io.BytesIO(); Image.fromarray(arr).save(b, fmt, **kw); return b.getvalue()
    return dict(site8=site8, area8=area8, ok=ok, cnt=cnt,
                files={'a11-site-0p5m.jpg': enc(site8, 'JPEG', **JPEG), 'a11-area-4m.jpg': enc(area8, 'JPEG', **JPEG),
                       'a11-area-4m-mask.png': enc(mask, 'PNG', optimize=True)})

def fwd(L, lat, lon): return (L['L0'] - R * math.radians(lat) / L['s'] + 1, L['S0'] + R * C * math.radians(lon - 180) / L['s'] + 1)

def overlay_geometry(L50, L2):
    """Display geometry, all from the headers (independent of the pixels): LM pointer in the site view; site footprint in the area view."""
    Lp, Sp = fwd(L50, *LM)
    ptr = dict(x=(Sp - (SITE['S1'] - 0.5)) / SITE['N'], y=(Lp - (SITE['L1'] - 0.5)) / SITE['N'])   # fractions of the site image
    # site edges in metres -> 2 m (line, sample) -> area output pixel edges (4 m)
    def to_area(line50, samp50):
        y = (L50['L0'] - line50 + 1) * L50['s']; x = (samp50 - L50['S0'] - 1) * L50['s']
        line2 = L2['L0'] - y / L2['s'] + 1; samp2 = L2['S0'] + x / L2['s'] + 1
        return ((samp2 - (AREA['S1'] - 0.5)) / 2, (line2 - (AREA['L1'] - 0.5)) / 2)
    x0, y0 = to_area(SITE['L1'] - 0.5, SITE['S1'] - 0.5); x1, y1 = to_area(SITE['L1'] + SITE['N'] - 0.5, SITE['S1'] + SITE['N'] - 0.5)
    fp = dict(x=x0 / 1055, y=y0 / 1000, w=(x1 - x0) / 1055, h=(y1 - y0) / 1000)
    def inv(L, line, samp): return (math.degrees((L['L0'] - line + 1) * L['s'] / R), 180 + math.degrees((samp - L['S0'] - 1) * L['s'] / (R * C)))
    n, w = inv(L2, AREA['L1'] - 0.5, AREA['S1'] - 0.5); s, e = inv(L2, AREA['L1'] + AREA['N'] - 0.5, AREA['S1'] + AREA['W'] - 0.5)
    sn, sw = inv(L50, SITE['L1'] - 0.5, SITE['S1'] - 0.5); ss, se = inv(L50, SITE['L1'] + SITE['N'] - 0.5, SITE['S1'] + SITE['N'] - 0.5)
    return dict(pointer_in_site=ptr, site_footprint_in_area=fp,
                area_bounds_deg=dict(n=n, s=s, w=w, e=e), site_bounds_deg=dict(n=sn, s=ss, w=sw, e=se),
                area_ground_m=dict(width=AREA['W'] * L2['s'], height=AREA['N'] * L2['s']), site_ground_m=dict(width=SITE['N'] * L50['s'], height=SITE['N'] * L50['s']))

def build(src):
    inp = read_inputs(src)
    a50, a2, h50, h2, L50, L2, conflicts = decode(inp)
    site, area = windows(a50, a2)
    if sha(site.tobytes()) != EXPECT['site_sha']: raise BuildError('site crop differs from the reviewed hash')
    if sha(area.tobytes()) != EXPECT['area_sha']: raise BuildError('area window differs from the reviewed hash')
    P = products(site, area)
    hist = [int((P['cnt'] == k).sum()) for k in range(5)]
    if hist != EXPECT['hist']: raise BuildError(f'2x2 histogram {hist} differs from the reviewed counts')
    geo = overlay_geometry(L50, L2)
    src_json = {
        'schema': 1, 'revision': 'lroc-a11-R1', 'builder': BUILDER, 'builder_sha256': sha(open(os.path.join(ROOT, BUILDER), 'rb').read()),
        'encoder': {'pillow': PIL.__version__, 'libjpeg': features.version('jpg'), 'zlib': features.version('zlib'), 'jpeg': JPEG, 'mode': 'L (greyscale, no chroma subsampling)'},
        'observation': {'image': 'M150368601 L/R', 'start_utc': h50['START_TIME'] + 'Z', 'stop_utc': h50['STOP_TIME'] + 'Z', 'camera': 'LRO Narrow Angle Camera'},
        'products': {
            'site': {'pds4_lid': 'urn:nasa:pds:lro-l-lroc-5-rdr:lrolrc_2001_data:sdp.nac_dtm.apollo11.nac_dtm_apollo11_m150368601_50cm', 'pds3_product_id': h50['PRODUCT_ID'],
                     'file_md5_label': '95decbebbf283e46d6146c47fec988ed', 'range_bytes': list(RANGE50), 'range_sha256': INPUTS['range50'][2]},
            'area': {'pds4_lid': 'urn:nasa:pds:lro-l-lroc-5-rdr:lrolrc_2001_data:sdp.nac_dtm.apollo11.nac_dtm_apollo11_m150368601_2m', 'pds3_product_id': h2['PRODUCT_ID'],
                     'file_md5_label': MD5_2M, 'file_sha256': INPUTS['img2'][2]}},
        'retained_inputs': {v[0]: {'bytes': v[1], 'sha256': v[2]} for v in INPUTS.values()},
        'archive': 'NASA PDS Imaging Node (pds.mcp.nasa.gov; redirected from pds.lroc.im-ldi.com), LRO-L-LROC-5-RDR-V1.0 / LROLRC_2001',
        'frame': 'mean Earth/polar axis, planetocentric, east positive (LROC RDR SIS v1.6, 22 Aug 2020, §5.5); sphere 1737.4 km',
        'pixel_convention': 'centre of the upper-left pixel = (line, sample) (1.0, 1.0); offsets to the projection origin positive right/below (PDS3 header NOTE; SIS §6.4)',
        'layout': {'site_header_offset_bytes': L50['offset'], 'area_image_offset_bytes': L2['offset'], 'decode': 'int16 little-endian'},
        'pds4_conflicts_recorded': conflicts,
        'crops_1based_inclusive': {'site': {'lines': [SITE['L1'], SITE['L1'] + SITE['N'] - 1], 'samples': [SITE['S1'], SITE['S1'] + SITE['N'] - 1]},
                                   'area': {'lines': [AREA['L1'], AREA['L1'] + AREA['N'] - 1], 'samples': [AREA['S1'], AREA['S1'] + AREA['W'] - 1], 'dropped_sample': AREA['dropped']}},
        'source_window_sha256_int16le': {'site': EXPECT['site_sha'], 'area': EXPECT['area_sha']},
        'downsampling': {'area': '2x2 blocks; invalid codes excluded before averaging; mean of valid DN if at least 2 of 4 valid, else no data (Chad, D6); partial blocks averaged (provenance)',
                         'valid_count_histogram_0_to_4': hist, 'no_data_output_pixels': hist[0] + hist[1], 'partial_blocks_averaged': hist[2] + hist[3]},
        'stretch': f'v = clamp(floor((DN - {LO}) * 255 / {HI - LO} + 0.5), 0, 255) after averaging; display only, not reflectance; DN carry no scale or offset (README)',
        'no_data_fill': 'grey 128 under a hatched overlay; mask a11-area-4m-mask.png (alpha 255 = no data), from the valid-count rule',
        'geometry': geo,
        'native_pixel_spacing_m': {'site': L50['s'], 'area_after_2x2': 2 * L2['s']},
        'credit': 'NASA/GSFC/Arizona State University',
        'rights': 'PDS-delivered LROC data products are public domain (LROC terms, read 26 Nov 2026); images derived by Mother Earth from the PDS products',
        'review_cadence': 'yearly and at each build: check the PDS4 label versions and the archive MD5s against this record',
        'files': {k: {'bytes': len(v), 'sha256': sha(v)} for k, v in P['files'].items()},
    }
    return inp, a50, a2, site, area, P, src_json, L50, L2

def checks(src, P, site, area, src_json, inp):
    fails = []
    def ck(name, cond, info=''):
        print(('PASS ' if cond else 'FAIL ') + name + (('  ' + str(info)) if info != '' else '')); cond or fails.append(name)
    # decoded images
    S = np.asarray(Image.open(io.BytesIO(P['files']['a11-site-0p5m.jpg'])))
    A = np.asarray(Image.open(io.BytesIO(P['files']['a11-area-4m.jpg'])))
    M = np.asarray(Image.open(io.BytesIO(P['files']['a11-area-4m-mask.png'])))
    ck('site JPEG 1024 x 1024 greyscale', S.shape == (1024, 1024))
    ck('area JPEG 1055 x 1000 greyscale', A.shape == (1000, 1055))
    ck('mask PNG 1055 x 1000 RGBA', M.shape == (1000, 1055, 4))
    def corr(a, b): a = a.astype(float).ravel(); b = b.astype(float).ravel(); return float(np.corrcoef(a, b)[0, 1])
    s8, a8, ok = P['site8'], P['area8'], P['ok']
    cs, cs_ns, cs_ew = corr(S, s8), corr(S[::-1], s8), corr(S[:, ::-1], s8)
    ca, ca_ns, ca_ew = corr(A[ok], a8[ok]), corr(A[::-1][ok], a8[ok]), corr(A[:, ::-1][ok], a8[ok])
    ck('site orientation: correlation with the stretched source > 0.98, flipped controls < 0.5', cs > 0.98 and cs_ns < 0.5 and cs_ew < 0.5, (round(cs, 4), round(cs_ns, 4), round(cs_ew, 4)))
    ck('area orientation: correlation (valid pixels) > 0.98, flipped controls < 0.5', ca > 0.98 and ca_ns < 0.5 and ca_ew < 0.5, (round(ca, 4), round(ca_ns, 4), round(ca_ew, 4)))
    mae_s, mae_a = float(np.abs(S.astype(int) - s8).mean()), float(np.abs(A.astype(int) - a8)[ok].mean())
    # tolerances fixed at build from measurement (proposal §9 "to be measured and fixed at build"): q80 gives 2.69 (site) and 5.46 (area,
    # 4 m texture) grey levels; held at <= 3 and <= 6
    ck('mean absolute JPEG difference: site <= 3, area (valid) <= 6 grey levels', mae_s <= 3 and mae_a <= 6, (round(mae_s, 3), round(mae_a, 3)))
    ck('mask equals the valid-count rule exactly', bool(((M[..., 3] == 255) == ~ok).all()) and set(np.unique(M[..., 3])) <= {0, 255})
    ck('site: a white blob covers the predicted LM pixel (max >= 250 within +/-2 px of (512, 512))', int(S[510:515, 510:515].max()) >= 250, int(S[510:515, 510:515].max()))
    # source (unstretched) landmark, recomputed here
    def local_max(arr, L, L1, S1):
        Lp, Sp = fwd(L, *LM); r0, c0 = Lp - L1, Sp - S1; rp = math.ceil(12 / L['s'])
        win = arr[math.floor(r0 - rp):math.floor(r0 + rp) + 1, math.floor(c0 - rp):math.floor(c0 + rp) + 1].astype(int)
        win = np.where(win > -32764, win, -10**9); i = np.unravel_index(int(np.argmax(win)), win.shape)
        r, c = math.floor(r0 - rp) + i[0], math.floor(c0 - rp) + i[1]
        return int(win[i]), int((win == win[i]).sum()), (round((c + S1 - Sp) * L['s'], 3), round((Lp - (r + L1)) * L['s'], 3))
    _, _, _, _, _, _, _, L50, L2 = BUILT
    ck('0.5 m source: local maximum 446, unique, at (-0.326 E, +0.46 N) m', local_max(site, L50, SITE['L1'], SITE['S1']) == (446, 1, (-0.326, 0.46)))
    ck('2 m source: local maximum 268, unique, at (+0.924 E, +0.21 N) m', local_max(area, L2, AREA['L1'], AREA['S1']) == (268, 1, (0.924, 0.21)))
    # negative / malformed-input controls
    def refuses(fn):
        try: fn(); return False
        except BuildError as e: return str(e)
    a50w, a2w, *_ = decode(inp, wrong_2m_offset=True)
    wrong_area = np.ascontiguousarray(a2w[AREA['L1'] - 1:AREA['L1'] - 1 + AREA['N'], 0:AREA['W']])
    ck('control: the wrong 4,222-B 2 m offset gives a different area hash (the build would refuse it)', sha(wrong_area.tobytes()) != EXPECT['area_sha'] and sha(wrong_area.tobytes()) == 'a84a2c598f730a4750541e39e24d7ddded908e0968b073ee2a3878a42d123a10')
    for nm, mod in (('truncated 2 m file', lambda d: d.__setitem__('img2', d['img2'][:-2])),
                    ('one flipped byte in the 0.5 m range', lambda d: d.__setitem__('range50', d['range50'][:100] + bytes([d['range50'][100] ^ 1]) + d['range50'][101:]))):
        d = dict(inp); mod(d); tmp = os.path.join('/tmp', 'lroc_ctl'); os.makedirs(tmp, exist_ok=True)
        for k, (name, _, _) in INPUTS.items(): open(os.path.join(tmp, name), 'wb').write(d[k])
        r = refuses(lambda: read_inputs(tmp)); ck(f'control: {nm} is refused', bool(r), r)
    bad = dict(inp); bad['img2'] = inp['img2'].replace(b'LABEL_RECORDS = 2', b'LABEL_RECORDS = 1', 1)
    r = refuses(lambda: decode(bad)); ck('control: a header with LABEL_RECORDS 1 is refused', bool(r), r)
    _, a50s, a2s, *_ = BUILT
    m50 = a50s.copy(); m50[5, SITE['S1'] - 1 + 5] = -32765
    r = refuses(lambda: windows(m50, a2s)); ck('control: a saturation code in the site window stops the build', bool(r) and 'saturation' in r, r)
    m2 = a2s.copy(); m2[AREA['L1'] + 10, 20] = -32764
    r = refuses(lambda: windows(a50s, m2)); ck('control: a saturation code in the area window stops the build', bool(r) and 'saturation' in r, r)
    return fails

BUILT = None
def main():
    global BUILT
    ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
    try:
        BUILT = build(a.src)
    except BuildError as e:
        print('FAIL build:', e); sys.exit(1)
    inp, a50, a2, site, area, P, src_json, L50, L2 = BUILT
    if not a.check:
        os.makedirs(OUT, exist_ok=True)
        for k, v in P['files'].items(): open(os.path.join(OUT, k), 'wb').write(v)
        open(os.path.join(OUT, 'SOURCE.json'), 'w').write(json.dumps(src_json, indent=1) + '\n')
        print('wrote', ', '.join(f'{k} {len(v)} B' for k, v in P['files'].items()), '+ SOURCE.json')
    fails = checks(a.src, P, site, area, src_json, inp)
    if a.check:
        on_disk = json.load(open(os.path.join(OUT, 'SOURCE.json')))
        same_enc = on_disk['encoder'] == src_json['encoder']
        for k, v in P['files'].items():
            d = open(os.path.join(OUT, k), 'rb').read()
            if same_enc:
                ok = d == v
                print(('PASS ' if ok else 'FAIL ') + f'{k}: rebuilt bytes equal the committed file'); ok or fails.append(k)
            else:
                print(f'NOTE {k}: encoder differs from the record ({on_disk["encoder"]} vs {src_json["encoder"]}); byte equality not expected')
        ok = on_disk['files'] == {k: {'bytes': len(open(os.path.join(OUT, k), 'rb').read()), 'sha256': sha(open(os.path.join(OUT, k), 'rb').read())} for k in P['files']}
        print(('PASS ' if ok else 'FAIL ') + 'SOURCE.json file records equal the committed files'); ok or fails.append('records')
        ok = on_disk['builder_sha256'] == src_json['builder_sha256']
        print(('PASS ' if ok else 'FAIL ') + 'SOURCE.json builder hash equals this builder'); ok or fails.append('builder')
    print('RESULT', 'FAIL' if fails else 'PASS', len(fails), 'failures')
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
