#!/usr/bin/env python3
"""Each deliberate error in the sunlight-table build must be caught by one of its checks (run: python3 phase1/skycraft/test_moonlight_breaks.py)."""
import importlib.util, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.argv = sys.argv[:1]
def load():
    spec = importlib.util.spec_from_file_location('bl', os.path.join(HERE, 'build_moonlight.py')); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
def expect_fail(name, patch):
    m = load(); patch(m)
    try: m.build(); print('FAIL', name, '(not caught)'); return 1
    except SystemExit as e: print('ok  ', name, '→', str(e)[:110]); return 0
    except Exception as e: print('ok  ', name, '→ build stopped:', type(e).__name__, str(e).strip().split('\n')[-3][:70] if 'SPICE(' in str(e) else str(e)[:70]); return 0
def sun_with(corr):
    def patch(m):
        def f(self, et):
            self.need(et); s, _ = self.sp.spkpos('SUN', et, m.FRAME, corr, 'MOON'); e, _ = self.sp.spkpos('EARTH', et, m.FRAME, 'NONE', 'MOON'); return m.unit(self.fin(s, 'Sun')), m.unit(self.fin(e, 'Earth'))
        m.Spice.catalogue_dirs = f
    return patch
def earth_lt(m):
    def f(self, et):
        self.need(et); s, _ = self.sp.spkpos('SUN', et, m.FRAME, 'LT+S', 'MOON'); e, _ = self.sp.spkpos('EARTH', et, m.FRAME, 'LT', 'MOON'); return m.unit(self.fin(s, 'Sun')), m.unit(self.fin(e, 'Earth'))
    m.Spice.catalogue_dirs = f
def no_emrat(m):
    m.De440.moon_ssb = lambda self, jd, deriv=False: self.ev('emb', jd, deriv)
def tamper(m): m.PINS = dict(m.PINS, **{'de440s.bsp.seg10.rec4027-4063.bin': '0' * 64})
def drop_range(m): m.SPK = dict(m.SPK, ranges=[x for x in m.SPK['ranges'] if 'seg10.rec' not in x[0]])
def hz_no_aberration(m):
    f = m.Spice.horizons_dirs
    def g(self, et): a, b, lt, a0 = f(self, et); return a0, b, lt, a0
    m.Spice.horizons_dirs = g
def hz_no_lt(m):
    def g(self, et): s, e = self.catalogue_dirs(et); return s, e, 0.0, s
    m.Spice.horizons_dirs = g
def june_late(m):
    f = m.Spice.rot; m.Spice.rot = lambda self, et: f(self, et + 1.0)
def no_leap(m):
    f = m.own_tdb
    def g(t, tls): et, dat = f(t, tls); return et - dat, 0
    m.own_tdb = g
def coarse(m): m.slerp = lambda a, b, f: a
def lib_block(m):
    f = m.De440.ev
    m.De440.ev = lambda self, what, jd, deriv=False: f(self, what, jd - (8.0 if what == 'lib' else 0.0), deriv)
tests = [('Sun direction without stellar aberration (LT only) in the table', sun_with('LT')), ('Sun direction geometric in the table', sun_with('NONE')),
         ('Earth direction light-time corrected instead of geometric', earth_lt), ('SPICE frame MOON_PA_DE440 instead of ME', lambda m: setattr(m, 'FRAME', 'MOON_PA_DE440')),
         ('independent check: Moon taken at the Earth–Moon barycentre (EMRAT ignored)', no_emrat), ('a pinned raw file does not match its hash', tamper),
         ('a kernel byte range left out (read outside the held ranges)', drop_range), ('Horizons sub-solar point read without aberration', hz_no_aberration),
         ('Horizons compared without its light time', hz_no_lt), ('June rotation one second late', june_late), ('independent UTC→TDB without leap seconds', no_leap),
         ('no interpolation between samples (previous sample held)', coarse), ('libration angles from the wrong 8-day block', lib_block)]
bad = sum(expect_fail(n, p) for n, p in tests)
print('breaks:', len(tests) - bad, 'caught of', len(tests)); sys.exit(1 if bad else 0)
