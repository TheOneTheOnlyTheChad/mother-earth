#!/usr/bin/env python3
"""Mother Earth — "Lit as now" on the Moon globe: the sunlight table (MOON-LIT-AS-NOW-PROPOSAL rev 2.1, route B).

  moon-light-2026-06-R1   Sub-solar and sub-Earth points on the Moon every 6 hours, 2026-06-01 00:00 UTC to 2028-01-01 00:00 UTC
                          (2,317 samples), in MOON_ME_DE440_ME421 (the frame already used for LRO's dated path).
     Sun direction    SPICE spkpos('SUN', t, frame, 'LT+S', 'MOON'): the light arriving at the Moon's centre at t.
     Earth direction  SPICE spkpos('EARTH', t, frame, 'NONE', 'MOON'): geometric, Earth's centre.
     Stored as planetocentric latitude and east longitude, degrees, 5 decimals. The page interpolates unit vectors (moonlight.js).

Checks on every build (checks/moonlight-checks.json):
  1. INDEPENDENT — the same two directions from JPL's public DE440 ASCII coefficients with this script's own Chebyshev evaluator,
     own UTC→TDB, own light time and aberration, own rotation (libration angles + NAIF's fixed PA→ME offset). No SPICE call.
     Angle between unit vectors at every sample, before and after the catalogue's rounding. Ceiling 0.0001°.
  2. JUNE ROTATION — pxform at the exact SPK epochs archived in checks/moonfixed-checks.json equals the matrices archived there.
  3. HORIZONS — Moon (301) from the Earth's centre, quantities 10, 14, 15, 116 instants. Compared LIKE FOR LIKE first: our values
     recomputed in Horizons' conventions (observer time; Moon and its orientation at t − light time; the apparent Sun at the
     Moon then). Ceilings 0.001° and 0.01 percentage points. The residual against the catalogue's own conventions is reported apart.
  4. INTERPOLATION — the page's rule (spherical interpolation of the rounded samples) against SPICE at every sample and the
     midpoint of every interval. Ceiling 0.01°. (phase1/moon-light.test.mjs repeats this with the page's own JavaScript.)
  5. NASA SVS hourly table, 15 Nov – 31 Dec 2026: corroboration only. Offsets reported; no ceiling.

Inputs (raw/, hash-pinned): byte ranges of NAIF de440s.bsp (header + summaries; the type-2 records of the Sun, the Earth–Moon
barycentre, the Moon and the Earth that cover the table with a day's margin each side; the four segment trailers) and of
moon_pa_de440_200625.bpc (records 21750–21823). Full files were hashed in the browser pane when the ranges were cut. The build
reassembles same-length files with every other byte 0xFF, so a read outside the ranges is NaN and fails the build.

  python3 phase1/skycraft/build_moonlight.py          write the catalogue, checks and BUILD-moonlight.json
  python3 phase1/skycraft/build_moonlight.py --check  rebuild in memory and compare with the files on disk
Needs spiceypy 8.0.0 (CSPICE N0067). The independent check uses the standard library only.
"""
import calendar, hashlib, json, math, os, re, struct, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_moonfixed import mm, mv, tr, dot, norm, sub, cross, ang, frot, latlon, tk_angles, PINS as OLD_PINS, BPC as OLD_BPC

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); RAW = os.path.join(HERE, 'raw')
OUT_CAT = os.path.join(ROOT, 'assets', 'moon', 'moon-light-2026-06-R1.json')
OUT_CHK = os.path.join(HERE, 'checks', 'moonlight-checks.json')
OUT_MID = os.path.join(HERE, 'checks', 'moonlight-truth.json')
OUT_BUILD = os.path.join(HERE, 'BUILD-moonlight.json')
OLD_CHK = os.path.join(HERE, 'checks', 'moonfixed-checks.json')

PINS = {
    'de440s.bsp.head.bin': 'ff5c641287d93e8b44f1095e274f76881803cc1b63cb5c724280141495c7cfa2',
    'de440s.bsp.seg3.rec4027-4063.bin': 'b10bcfbf25ddc0b75cad355ec158d4b680a7ba76864403eb7d26b0dcac1c1125',
    'de440s.bsp.seg3-trailer.bin': '5c2c40218128aa6a3a8d66a78ba4b7a5b68d31d2bc0acea1a718afb9ee5daa48',
    'de440s.bsp.seg10.rec4027-4063.bin': '1d255d2fa210dbdf610ec8f9a30c0f7828f6947641f0ecdfc7e2b4d8e1e0923c',
    'de440s.bsp.seg10-trailer.bin': '301337d4f1d701702672e5ce85dae675a09c47b34652e30cad4f74040bcd87e6',
    'de440s.bsp.seg301.rec16109-16255.bin': '110b51d75808696d4eeaecfab31bf1a675f3d9aec5c0521121d135c3d0c7dadd',
    'de440s.bsp.seg301-trailer.bin': '43eea3a9958caf71f431f91ec6878a876da6e18ecd507a8c2d64e80afea186a1',
    'de440s.bsp.seg399.rec16109-16255.bin': 'c64cde8bf68c5e3384b45804839036cb94168746324b0d033929e2094cd86aec',
    'de440s.bsp.seg399-trailer.bin': '43eea3a9958caf71f431f91ec6878a876da6e18ecd507a8c2d64e80afea186a1',
    'moon_pa_de440_200625.bpc.head.bin': OLD_PINS['moon_pa_de440_200625.bpc.head.bin'],
    'moon_pa_de440_200625.bpc.rec21750-21823.bin': '7430467e69a773860f7c2fa45d7ac9f4499cdbfd30468ae425dfa7f3ea0e9797',
    'moon_pa_de440_200625.bpc.seg1-trailer.bin': OLD_PINS['moon_pa_de440_200625.bpc.seg1-trailer.bin'],
    'moon_de440_250416.tf': OLD_PINS['moon_de440_250416.tf'],
    'naif0012.tls': OLD_PINS['naif0012.tls'],
    'de440-header.440': OLD_PINS['de440-header.440'],
    'de440-ascp01950-rec873-891.txt': '922de55b9b92223c23d2a93277f309593d4693fb6f19d7d6fa67d810c2e408e1',
    'horizons-moon-geocentre-q10-14-15-20260601-20280101.txt': 'fb1d0d8f1c99150f6f67bbd2653871f36b04e7c45cdb31b85dc7285eef1086e9',
    'svs-mooninfo-2026-nov15-dec31.csv': '2150f7e55a7d65d3e27647a4d57d2f9e21eae16f0716495a71060e20cabbcb9e',
}
SPK = {'file': 'de440s.bsp', 'bytes': 32726016, 'sha256': 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2',
       'url': 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440s.bsp', 'last_modified': 'Mon, 21 Dec 2020 19:39:26 GMT',
       'ranges': [['de440s.bsp.head.bin', 0], ['de440s.bsp.seg3.rec4027-4063.bin', 7961432], ['de440s.bsp.seg3-trailer.bin', 8887376],
                  ['de440s.bsp.seg10.rec4027-4063.bin', 13960760], ['de440s.bsp.seg10-trailer.bin', 14751200],
                  ['de440s.bsp.seg301.rec16109-16255.bin', 20034984], ['de440s.bsp.seg301-trailer.bin', 23738432],
                  ['de440s.bsp.seg399.rec16109-16255.bin', 29022216], ['de440s.bsp.seg399-trailer.bin', 32725664]],
       # target: (centre, first word, last word, record size in doubles, interval s, first and last record held)
       'segments': {'3': [0, 830073, 1110926, 41, 1382400.0, 4027, 4063], '10': [0, 1604151, 1843904, 35, 1382400.0, 4027, 4063],
                    '301': [3, 1843905, 2967308, 41, 345600.0, 16109, 16255], '399': [3, 2967309, 4090712, 41, 345600.0, 16109, 16255]},
       'init_tdb_s': -4734072000.0}
BPC = dict(OLD_BPC, ranges=[['moon_pa_de440_200625.bpc.head.bin', 0], ['moon_pa_de440_200625.bpc.rec21750-21823.bin', 5573120],
                            ['moon_pa_de440_200625.bpc.seg1-trailer.bin', 10245120]], records_held=[21750, 21823])
ASCII = {'file': 'ascp01950.440', 'bytes': 30629582, 'sha256': 'e24f6356225f7d912e35af2ebc5f9bcf6fb0425c53aa92b5d7243cb063477286',
         'url': 'https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/ascp01950.440', 'last_modified': 'Tue, 22 Dec 2020 00:51:10 GMT',
         'byte_range': [23387912, 23897511], 'records': [873, 891], 'record_bytes': 26821}
HORIZONS = {'url': "https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='301'&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=OBSERVER&CENTER='500@399'&START_TIME='2026-06-01 00:00'&STOP_TIME='2028-01-01 00:00'&STEP_SIZE='5 d'&QUANTITIES='10,14,15,20,21'&ANG_FORMAT=DEG&CSV_FORMAT=YES&EXTRA_PREC=YES&TIME_DIGITS=SECONDS"}
SVS = {'page': 'https://svs.gsfc.nasa.gov/5587/', 'file': 'https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json', 'bytes': 2094339,
       'sha256': '098ec6434ba4fecb84e66485385816d465b7969f142864bcfc9ffc68311b4a86', 'last_modified': 'Thu, 30 Oct 2025 14:24:53 GMT',
       'extract': 'rows 15 Nov 2026 00:00 UT to 31 Dec 2026 23:00 UT; columns time, phase, subsolar lon/lat, subearth lon/lat, values as published',
       'ephemeris_listed_on_page': 'DE421 (JPL DE421)'}
RETRIEVED = {'de440s_ranges': '2026-11-15T03:14Z', 'bpc_range': '2026-11-15T03:14:45Z', 'de440_ascii_records': '2026-11-15T03:15:09Z',
             'horizons': '2026-11-15T03:15:23Z', 'svs': '2026-11-15T03:15:53Z', 'via': 'browser pane on the Mac (JPL and SVS hosts are not reachable from the workspace shell)'}
FRAME = 'MOON_ME_DE440_ME421'; MOON_R_KM, C_KMS = 1737.4, 299792.458
T0 = calendar.timegm((2026, 6, 1, 0, 0, 0)); T1 = calendar.timegm((2028, 1, 1, 0, 0, 0)); STEP = 21600; N = (T1 - T0) // STEP + 1
J2000_UNIX = calendar.timegm((2000, 1, 1, 12, 0, 0))
CEIL = {'independent_deg': 0.0001, 'june_matrix_abs': 1e-14, 'horizons_subpoint_deg': 0.001, 'horizons_illum_pp': 0.01, 'interpolation_deg': 0.01}

def raw(name, mode='rb'):
    b = open(os.path.join(RAW, name), 'rb').read(); got = hashlib.sha256(b).hexdigest()
    if got != PINS[name]: raise SystemExit(f'raw/{name}: sha256 {got} is not the pinned {PINS[name]}')
    return b if mode == 'rb' else b.decode('utf-8')
def unit(v): n = norm(v); return [c / n for c in v]
def from_ll(lat, lon):
    a, o = math.radians(lat), math.radians(lon); return [math.cos(a) * math.cos(o), math.cos(a) * math.sin(o), math.sin(a)]
def iso(t):
    import time; return time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(t))
def slerp(a, b, f):
    """The page's interpolation rule (moonlight.js): spherical interpolation between two unit vectors."""
    w = math.atan2(norm(cross(a, b)), dot(a, b))
    if w < 1e-12: return unit([x + (y - x) * f for x, y in zip(a, b)])
    s = math.sin(w); ka, kb = math.sin((1 - f) * w) / s, math.sin(f * w) / s
    return unit([ka * x + kb * y for x, y in zip(a, b)])

# ---------- SPICE (primary)
class Spice:
    def __enter__(self):
        import spiceypy as sp
        if sp.__version__ != '8.0.0' or sp.tkvrsn('TOOLKIT') != 'CSPICE_N0067':
            raise SystemExit(f'needs spiceypy 8.0.0 / CSPICE_N0067, found {sp.__version__} / {sp.tkvrsn("TOOLKIT")}')
        self.sp = sp; self.tmp = tempfile.TemporaryDirectory(); sp.kclear()
        for spec in (SPK, BPC):
            buf = bytearray(b'\xff' * spec['bytes'])
            for name, off in spec['ranges']: piece = raw(name); buf[off:off + len(piece)] = piece
            p = os.path.join(self.tmp.name, spec['file']); open(p, 'wb').write(bytes(buf)); sp.furnsh(p)
        for name in ('moon_de440_250416.tf', 'naif0012.tls'):
            p = os.path.join(self.tmp.name, name); open(p, 'wb').write(raw(name)); sp.furnsh(p)
        return self
    def __exit__(self, *a): self.sp.kclear(); self.tmp.cleanup()
    def covered(self, et):
        """True only if every record SPICE will read for this epoch is among the held ranges."""
        for tgt, (ctr, first, last, rs, intlen, k0, k1) in SPK['segments'].items():
            if not k0 <= int((et - SPK['init_tdb_s']) // intlen) <= k1: return False
        s1 = BPC['segment1']; k = int((et - s1['init_tdb_s']) // s1['intlen_s'])
        return BPC['records_held'][0] <= k <= BPC['records_held'][1]
    def need(self, et, slack=600.0):
        if not (self.covered(et) and self.covered(et - slack)): raise SystemExit(f'epoch {et}: outside the held kernel ranges')
    def fin(self, v, what):
        v = [float(c) for c in v]
        if not all(math.isfinite(c) for c in v): raise SystemExit(f'{what}: not finite (a read outside the held ranges)')
        return v
    def et(self, t_unix): return self.sp.str2et(iso(t_unix))
    def catalogue_dirs(self, et):
        self.need(et)
        s, _ = self.sp.spkpos('SUN', et, FRAME, 'LT+S', 'MOON'); e, _ = self.sp.spkpos('EARTH', et, FRAME, 'NONE', 'MOON')
        return unit(self.fin(s, 'Sun')), unit(self.fin(e, 'Earth'))
    def rot(self, et):
        self.need(et, 0.0); m = [list(map(float, r)) for r in self.sp.pxform('J2000', FRAME, et)]
        self.fin([c for r in m for c in r], 'rotation'); return m
    def horizons_dirs(self, et):
        """Horizons' conventions for an observer at the Earth's centre at et: the Moon, and its orientation, at et − lt (down-leg light
        time, no aberration); the Sun as its light reaches the Moon at et − lt (light time, no aberration)."""
        self.need(et)
        p, lt = self.sp.spkpos('MOON', et, 'J2000', 'LT', 'EARTH'); m = self.rot(et - lt)
        s, _ = self.sp.spkpos('SUN', et - lt, 'J2000', 'LT+S', 'MOON'); s0, _ = self.sp.spkpos('SUN', et - lt, 'J2000', 'LT', 'MOON')
        return unit(mv(m, self.fin(s, 'Sun'))), unit(mv(m, [-c for c in self.fin(p, 'Moon')])), float(lt), unit(mv(m, self.fin(s0, 'Sun')))

# ---------- independent (no SPICE): DE440 ASCII, own time conversion, light time, aberration and rotation
class De440:
    def __init__(self):
        hdr = raw('de440-header.440', 'txt')
        if 'KSIZE= 2036    NCOEFF= 1018' not in hdr or 'JPL Planetary Ephemeris DE440/LE440' not in hdr: raise SystemExit('header.440: unexpected')
        g = hdr[hdr.index('GROUP   1050'):].split('\n'); rows = [list(map(int, g[k].split())) for k in (2, 3, 4)]
        self.ptr = {name: (rows[0][i], rows[1][i], rows[2][i]) for name, i in (('emb', 2), ('moon', 9), ('sun', 10), ('lib', 12))}
        if self.ptr['lib'] != (899, 10, 4): raise SystemExit('header.440: libration pointer')
        names = hdr[hdr.index('GROUP   1040'):hdr.index('GROUP   1041')].split()[3:]
        vals = hdr[hdr.index('GROUP   1041'):hdr.index('GROUP   1050')].split()[3:]
        self.emrat = float(vals[names.index('EMRAT')].replace('D', 'E'))
        if not 81.3 < self.emrat < 81.31: raise SystemExit('header.440: EMRAT')
        txt = raw('de440-ascp01950-rec873-891.txt', 'txt'); rb = ASCII['record_bytes']; self.recs = []
        if len(txt) != 19 * rb: raise SystemExit('DE440 ASCII: unexpected length')
        for i in range(19):
            tok = txt[i * rb:(i + 1) * rb].split()
            if tok[:2] != [str(873 + i), '1018']: raise SystemExit('DE440 ASCII: record header')
            c = [float(x.replace('D', 'E')) for x in tok[2:2 + 1018]]
            if self.recs and c[0] != self.recs[-1][1]: raise SystemExit('DE440 ASCII: records not contiguous')
            self.recs.append(c)
        self.jd0, self.jd1 = self.recs[0][0], self.recs[-1][1]
    def ev(self, what, jd, deriv=False):
        if not self.jd0 <= jd <= self.jd1: raise SystemExit(f'DE440 ASCII: JD {jd} outside the held records')
        c = self.recs[min(len(self.recs) - 1, int((jd - self.jd0) // 32))]; start, ncf, nsub = self.ptr[what]
        span = 32.0 / nsub; k = min(nsub - 1, int((jd - c[0]) // span)); x = 2 * (jd - (c[0] + k * span)) / span - 1
        T = [1.0, x]; D = [0.0, 1.0]
        for n in range(2, ncf): T.append(2 * x * T[-1] - T[-2]); D.append(2 * T[-2] + 2 * x * D[-1] - D[-2])
        out = []
        for comp in range(3):
            o = start - 1 + (k * 3 + comp) * ncf; co = c[o:o + ncf]
            out.append(sum(a * b for a, b in zip(co, D)) * 2 / (span * 86400.0) if deriv else sum(a * b for a, b in zip(co, T)))
        return out
    def moon_ssb(self, jd, deriv=False):
        f = self.emrat / (1 + self.emrat); return [a + f * b for a, b in zip(self.ev('emb', jd, deriv), self.ev('moon', jd, deriv))]

def own_tdb(t_unix, tls):
    """UTC → TDB seconds past J2000, from the constants in the leap-seconds kernel (own arithmetic)."""
    g = lambda k: [float(x.replace('D', 'E')) for x in re.search(k + r'\s*=\s*\(?\s*([-+\d.DE,\s]+?)\s*\)?\s*\n', tls).group(1).replace(',', ' ').split()]
    dta, k, eb, m = g('DELTET/DELTA_T_A')[0], g('DELTET/K')[0], g('DELTET/EB')[0], g('DELTET/M')
    leaps = re.findall(r'(\d+),\s*@(\d{4})-([A-Z]{3})-(\d+)', tls); mon = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
    dat = [int(n) for n, y, mo, d in leaps if calendar.timegm((int(y), mon.index(mo) + 1, int(d), 0, 0, 0)) <= t_unix][-1]
    tai = t_unix - J2000_UNIX + dat; M = m[0] + m[1] * tai; E = M + eb * math.sin(M)
    return tai + dta + k * math.sin(E), dat

def own_dirs(de, offs, et):
    jd = lambda s: 2451545.0 + s / 86400.0
    def me(s):
        phi, theta, psi = de.ev('lib', jd(s)); (a1, a2, a3), (x1, x2, x3) = offs; k = math.pi / 180 / 3600
        return mm(tr(mm(frot(x3, a3 * k), mm(frot(x2, a2 * k), frot(x1, a1 * k)))), mm(frot(3, psi), mm(frot(1, theta), frot(3, phi))))
    moon = de.moon_ssb(jd(et)); lt = 0.0
    for _ in range(4): p = sub(de.ev('sun', jd(et - lt)), moon); lt = norm(p) / C_KMS
    # stellar aberration (Newtonian, as SPICE 'LT+S'): turn the direction toward the observer's velocity by asin(|u × v/c|)
    vb = [c / C_KMS for c in de.moon_ssb(jd(et), True)]; u = unit(p); h = cross(u, vb); sphi = norm(h)
    if sphi > 0:
        phi = math.asin(sphi); ax = unit(h); cph, sph = math.cos(phi), math.sin(phi); d = dot(ax, p); cr = cross(ax, p)
        p = [p[i] * cph + cr[i] * sph + ax[i] * d * (1 - cph) for i in range(3)]
    m = me(et); earth = [-c for c in de.ev('moon', jd(et))]
    return unit(mv(m, p)), unit(mv(m, earth)), m

def horizons_rows():
    t = raw('horizons-moon-geocentre-q10-14-15-20260601-20280101.txt', 'txt')
    for need in ('API VERSION: 1.2', 'Target body name: Moon (301)', 'Center body name: Earth (399)', 'Center-site name: GEOCENTRIC',
                 'Target pole/equ : MOON_ME                         {East-longitude positive}', 'Target radii    : 1737.4, 1737.4, 1737.4 km',
                 ' Date__(UT)__HR:MN:SS, , ,     Illu%,  ObsSub-LON, ObsSub-LAT,  SunSub-LON, SunSub-LAT,'):
        if need not in t: raise SystemExit(f'Horizons: header lacks "{need}"')
    mon = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(); rows = []
    for line in t[t.index('$$SOE') + 5:t.index('$$EOE')].strip().split('\n'):
        f = [x.strip() for x in line.split(',')]; y, mo, d = f[0].split()[0].split('-'); hh, mi, ss = f[0].split()[1].split(':')
        rows.append((calendar.timegm((int(y), mon.index(mo) + 1, int(d), int(hh), int(mi), int(ss))), float(f[3]), float(f[4]), float(f[5]), float(f[6]), float(f[7]), float(f[10]) * 60))
    if len(rows) != 116: raise SystemExit('Horizons: expected 116 rows')
    return rows, re.search(r'Target body name: Moon \(301\)\s+\{source: (\w+)\}', t).group(1)

def svs_rows():
    mon = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(); out = []
    for line in raw('svs-mooninfo-2026-nov15-dec31.csv', 'txt').strip().split('\n')[1:]:
        f = line.split(','); d, mo, y, hm, _ = f[0].split(); hh, mi = hm.split(':')
        out.append((calendar.timegm((int(y), mon.index(mo) + 1, int(d), int(hh), int(mi), 0)), *map(float, f[1:])))
    if len(out) != 1128: raise SystemExit('SVS: expected 1,128 rows')
    return out

def dump(o): return (json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')
def stats(v): s = sorted(v); return {'max': s[-1], 'mean': sum(s) / len(s), 'p99': s[min(len(s) - 1, int(0.99 * len(s)))]}
def lit(s, e): return (1 + dot(s, e)) / 2

def build():
    tls = raw('naif0012.tls', 'txt'); de = De440(); offs = tk_angles(); times = [T0 + i * STEP for i in range(N)]
    with Spice() as S:
        ets = [S.et(t) for t in times]
        truth = [S.catalogue_dirs(et) for et in ets]
        mids = [S.catalogue_dirs((a + b) / 2) for a, b in zip(ets, ets[1:])]
        first_last = [S.sp.et2utc(ets[0], 'ISOC', 3), S.sp.et2utc(ets[-1], 'ISOC', 3)]
        if first_last != ['2026-06-01T00:00:00.000', '2028-01-01T00:00:00.000']: raise SystemExit(f'grid check: {first_last}')
        # 2. June rotation at the archived SPK epochs
        old = json.load(open(OLD_CHK)); june = []
        for smp in old['independent_rotation']['samples']:
            m = S.rot(smp['tdb_s']); june.append(max(abs(round(a, 15) - b) for ra, rb in zip(m, smp['spice']) for a, b in zip(ra, rb)))
        # 3. Horizons
        hrows, hz_src = horizons_rows(); hz = []
        for t, ill, olon, olat, slon, slat, lt_h in hrows:
            et = S.et(t); hs, he, lt, hs0 = S.horizons_dirs(et); cs, ce = S.catalogue_dirs(et); us, ue = from_ll(slat, slon), from_ll(olat, olon)
            hz.append({'utc': iso(t) + 'Z', 'horizons': {'illum_pct': ill, 'obs_sub_lon_lat': [olon, olat], 'sun_sub_lon_lat': [slon, slat], 'light_time_s': lt_h},
                       'like_for_like': {'sun_deg': ang(hs, us), 'earth_deg': ang(he, ue), 'illum_pp': abs(100 * lit(hs, he) - ill), 'light_time_s': lt, 'sun_deg_without_aberration': ang(hs0, us)},
                       'catalogue_convention': {'sun_deg': ang(cs, us), 'earth_deg': ang(ce, ue), 'illum_pp': abs(100 * lit(cs, ce) - ill)}})
        # 5. SVS
        svs = []
        for t, ph, slon, slat, elon, elat in svs_rows():
            cs, ce = S.catalogue_dirs(S.et(t)); svs.append((ang(cs, from_ll(slat, slon)), ang(ce, from_ll(elat, elon)), 100 * lit(cs, ce) - ph))
        toolkit = S.sp.tkvrsn('TOOLKIT')
    # catalogue values (rounded) and the vectors the page will hold
    r5 = lambda u: [round(latlon(u)[1], 5), round(latlon(u)[0], 5)]          # [east longitude, latitude]
    sun_ll = [r5(s) for s, _ in truth]; earth_ll = [r5(e) for _, e in truth]
    sun_r = [from_ll(la, lo) for lo, la in sun_ll]; earth_r = [from_ll(la, lo) for lo, la in earth_ll]
    # 1. independent
    ind_before, ind_after, dats, tdb_diff = [], [], set(), 0.0
    for i, t in enumerate(times):
        et_own, dat = own_tdb(t, tls); dats.add(dat); tdb_diff = max(tdb_diff, abs(et_own - ets[i])); os_, oe_, _ = own_dirs(de, offs, et_own)
        ind_before.append(max(ang(os_, truth[i][0]), ang(oe_, truth[i][1]))); ind_after.append(max(ang(os_, sun_r[i]), ang(oe_, earth_r[i])))
    # 4. interpolation: the page's rule on the rounded samples, against SPICE at samples and midpoints
    interp_s = [ang(sun_r[i], truth[i][0]) for i in range(N)] + [ang(slerp(sun_r[i], sun_r[i + 1], .5), mids[i][0]) for i in range(N - 1)]
    interp_e = [ang(earth_r[i], truth[i][1]) for i in range(N)] + [ang(slerp(earth_r[i], earth_r[i + 1], .5), mids[i][1]) for i in range(N - 1)]
    lit_err = max(abs(lit(slerp(sun_r[i], sun_r[i + 1], .5), slerp(earth_r[i], earth_r[i + 1], .5)) - lit(*mids[i])) for i in range(N - 1)) * 100
    worst = {'independent_before_rounding_deg': max(ind_before), 'independent_after_rounding_deg': max(ind_after), 'june_matrix_abs': max(june),
             'horizons_sun_deg': max(r['like_for_like']['sun_deg'] for r in hz), 'horizons_earth_deg': max(r['like_for_like']['earth_deg'] for r in hz),
             'horizons_illum_pp': max(r['like_for_like']['illum_pp'] for r in hz), 'interpolation_sun_deg': max(interp_s), 'interpolation_earth_deg': max(interp_e)}
    fails = [k for k, lim in (('independent_before_rounding_deg', CEIL['independent_deg']), ('independent_after_rounding_deg', CEIL['independent_deg']), ('june_matrix_abs', CEIL['june_matrix_abs']),
                              ('horizons_sun_deg', CEIL['horizons_subpoint_deg']), ('horizons_earth_deg', CEIL['horizons_subpoint_deg']), ('horizons_illum_pp', CEIL['horizons_illum_pp']),
                              ('interpolation_sun_deg', CEIL['interpolation_deg']), ('interpolation_earth_deg', CEIL['interpolation_deg'])) if not worst[k] <= lim]
    if fails and '--report' not in sys.argv: raise SystemExit('checks failed: ' + ', '.join(f'{k} = {worst[k]}' for k in fails))
    cat = {
        'schema': 1, 'catalogue': 'moon-light', 'catalogue_revision': 'moon-light-2026-06-R1', 'kind': 'computed table', 'body': 'moon',
        'time': {'standard': 'UTC', 'start': '2026-06-01T00:00:00Z', 'end': '2028-01-01T00:00:00Z', 'step_s': STEP, 'n': N},
        'frame': {'name': FRAME, 'alias': 'MOON_ME', 'centre': 'Moon (301)', 'longitude': 'east-positive, degrees', 'latitude': 'planetocentric, degrees'},
        'conventions': {'sun': "Direction from the Moon's centre to the Sun as its light arrives at the Moon at the sample time (light time and stellar aberration applied).",
                        'earth': "Direction from the Moon's centre to the Earth's centre at the sample time, geometric.",
                        'between_samples': 'Interpolate the unit vectors spherically; do not interpolate longitude and latitude.',
                        'lit_fraction': '(1 + cos i) / 2, i the angle between the two directions; a sphere and a point Sun.'},
        'body_radius_km': MOON_R_KM, 'ephemeris': 'JPL DE440 (NAIF de440s.bsp); orientation moon_pa_de440_200625.bpc with moon_de440_250416.tf',
        'credit': 'Calculated · Sun, Earth and Moon positions and Moon orientation: JPL DE440 via NAIF',
        'modifications': 'Reduced to two sub-points per sample; rounded to 0.00001°.',
        'sun_lon_lat_deg': [c for p in sun_ll for c in p], 'earth_lon_lat_deg': [c for p in earth_ll for c in p],
    }
    cat_bytes = dump(cat)
    r7 = lambda u: [round(latlon(u)[1], 7), round(latlon(u)[0], 7)]
    truth_file = {'what': 'SPICE values (unrounded to 1e-7°) for moon-light-2026-06-R1 at every sample and at the midpoint of every interval. Test-only; read by phase1/moon-light.test.mjs.',
                  'catalogue_sha256': hashlib.sha256(cat_bytes).hexdigest(), 'n': N,
                  'samples': {'sun': [c for s, _ in truth for c in r7(s)], 'earth': [c for _, e in truth for c in r7(e)]},
                  'midpoints': {'sun': [c for s, _ in mids for c in r7(s)], 'earth': [c for _, e in mids for c in r7(e)]}}
    lfl = lambda k: stats([r['like_for_like'][k] for r in hz]); cc = lambda k: stats([r['catalogue_convention'][k] for r in hz])
    checks = {
        'what': 'Checks run by build_moonlight.py for moon-light-2026-06-R1 (MOON-LIT-AS-NOW-PROPOSAL rev 2.1 §3 and §10).',
        'ceilings': CEIL, 'worst': worst, 'toolkit': toolkit, 'spiceypy': '8.0.0', 'first_last_sample_utc': first_last, 'samples': N, 'midpoints': N - 1,
        'independent': {'method': "DE440 ASCII records 873–891 (EMB, geocentric Moon, Sun, librations) with this script's own Chebyshev evaluator and derivative; EMRAT from header.440; own UTC→TDB from the leap-second kernel's constants; own light-time iteration and Newtonian stellar aberration for the Sun; own 3-1-3 libration rotation and NAIF's fixed PA→ME offset. No SPICE call.",
                        'compared': 'angle between unit vectors, larger of Sun and Earth, at every sample', 'before_rounding_deg': stats(ind_before), 'after_rounding_deg': stats(ind_after),
                        'leap_seconds_used': sorted(dats), 'own_vs_spice_tdb_worst_s': tdb_diff,
                        'note': 'No leap second is scheduled after 2017-01-01 in naif0012.tls; a future one inside the table would shift its later samples by 1 s (about 0.00014° of sub-solar longitude).'},
        'june_rotation': {'epochs': [s['tdb_s'] for s in old['independent_rotation']['samples']], 'source': 'phase1/skycraft/checks/moonfixed-checks.json (independent_rotation.samples[].tdb_s and .spice)',
                          'worst_abs_element_difference': max(june), 'note': 'pxform from the wider PCK byte range (records 21750–21823), rounded as archived (15 decimals).'},
        'horizons': {'request': HORIZONS['url'], 'target_source': hz_src, 'frame_line': 'Target pole/equ : MOON_ME {East-longitude positive}; radii 1737.4 × 3',
                     'horizons_conventions': 'Apparent quantities at the observer time t: the Moon and its orientation at t − lt (down-leg light time, no aberration); the Sun as seen from the Moon at t − lt, apparent (light time and stellar aberration); illuminated fraction from those two directions. Reading the sub-solar point with light time only leaves the residual in sun_without_aberration_deg (about the 20" aberration constant), so that reading is rejected.',
                     'sun_without_aberration_deg': lfl('sun_deg_without_aberration'),
                     'like_for_like': {'sun_deg': lfl('sun_deg'), 'earth_deg': lfl('earth_deg'), 'illum_pp': lfl('illum_pp')},
                     'catalogue_convention_residual': {'sun_deg': cc('sun_deg'), 'earth_deg': cc('earth_deg'), 'illum_pp': cc('illum_pp'),
                                                       'explanation': 'The catalogue takes sunlight arriving at the Moon at t (with aberration) and the geometric Earth at t; Horizons ties both to an Earth observer at t, about 1.3 s of light time later than the Moon event. Not judged against the ceilings.'},
                     'rows': hz},
        'interpolation': {'rule': 'spherical interpolation of the rounded samples (as moonlight.js)', 'sun_deg': stats(interp_s), 'earth_deg': stats(interp_e), 'lit_fraction_worst_pp_at_midpoints': lit_err},
        'svs': {'source': SVS, 'rows': 1128, 'status': 'corroboration only; no ceiling; offsets as found',
                'sun_deg': stats([r[0] for r in svs]), 'earth_deg': stats([r[1] for r in svs]),
                'phase_pp': {'max_abs': max(abs(r[2]) for r in svs), 'mean': sum(r[2] for r in svs) / len(svs)},
                'note': 'SVS publishes 3 decimals of a degree and 2 of a percent and lists DE421. Its page does not state light-time or aberration conventions; the offsets here are against the catalogue conventions.'},
    }
    chk_bytes = (json.dumps(checks, indent=1) + '\n').encode(); truth_bytes = dump(truth_file)
    record = {'generator': 'phase1/skycraft/build_moonlight.py', 'raw': PINS, 'spk': SPK, 'bpc': BPC, 'de440_ascii': ASCII, 'horizons': HORIZONS, 'svs': SVS, 'retrieved': RETRIEVED,
              'toolkit': {'spiceypy': '8.0.0', 'cspice': toolkit}, 'frame': FRAME,
              'coverage': {'table_utc': ['2026-06-01T00:00:00Z', '2028-01-01T00:00:00Z'], 'spk_records_tdb_s': {k: [SPK['init_tdb_s'] + v[5] * v[4], SPK['init_tdb_s'] + (v[6] + 1) * v[4]] for k, v in SPK['segments'].items()},
                           'pck_records_tdb_s': [BPC['segment1']['init_tdb_s'] + 21750 * 691200.0, BPC['segment1']['init_tdb_s'] + 21824 * 691200.0], 'table_tdb_s': [ets[0], ets[-1]],
                           'confirmed': 'every sample, midpoint and comparison epoch was checked against the held record numbers before SPICE was called, and every returned value is finite'},
              'renewal': 'The table ends 2028-01-01 00:00 UTC. Rebuild with wider ranges, or move to another route, before then.',
              'outputs': {name: {'file': os.path.relpath(p, ROOT), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()} for name, p, b in (('catalogue', OUT_CAT, cat_bytes), ('checks', OUT_CHK, chk_bytes), ('truth', OUT_MID, truth_bytes))}}
    return {OUT_CAT: cat_bytes, OUT_CHK: chk_bytes, OUT_MID: truth_bytes, OUT_BUILD: (json.dumps(record, indent=1) + '\n').encode()}, checks

def main():
    files, checks = build()
    if '--check' in sys.argv:
        bad = [p for p, v in files.items() if not os.path.exists(p) or open(p, 'rb').read() != v]
        if bad: raise SystemExit('differs from a fresh build: ' + ', '.join(os.path.relpath(p, ROOT) for p in bad))
        print('check ok'); return
    if '--report' not in sys.argv:
        for p, v in files.items(): os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(v)
    print(json.dumps(checks['worst'], indent=1))
    h = checks['horizons']; print('horizons residual (catalogue convention):', json.dumps(h['catalogue_convention_residual']['sun_deg']), json.dumps(h['catalogue_convention_residual']['earth_deg']))
    print('svs:', json.dumps({k: checks['svs'][k] for k in ('sun_deg', 'earth_deg', 'phase_pp')}))
    for p, v in files.items(): print(os.path.relpath(p, ROOT), len(v), hashlib.sha256(v).hexdigest())

if __name__ == '__main__': main()
