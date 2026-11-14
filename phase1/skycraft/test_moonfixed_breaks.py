#!/usr/bin/env python3
"""Each deliberate error in the Moon-fixed build must be caught by one of its checks (run: python3 -I phase1/skycraft/test_moonfixed_breaks.py)."""
import importlib.util, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
def load():
    spec = importlib.util.spec_from_file_location('bm', os.path.join(HERE, 'build_moonfixed.py')); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
def expect_fail(name, patch):
    m = load(); patch(m)
    try: m.build(); print('FAIL', name, '(not caught)'); return 1
    except SystemExit as e: print('ok  ', name, '→', str(e)[:90]); return 0
bad = 0
# 1. PA→ME offset read the other way round
def offset_reversed(m):
    f = m.independent
    def g(et, angles, offs): (a1, a2, a3), ax = offs; return f(et, angles, ([-a1, -a2, -a3], ax))
    m.independent = g
bad += expect_fail('PA→ME offset applied in the opposite sense', offset_reversed)
# 2. offset left out
bad += expect_fail('PA→ME offset left out', lambda m: setattr(m, 'tk_angles', lambda: ([0.0, 0.0, 0.0], [3, 2, 1])))
# 3. SPICE asked for the PA frame instead of ME
bad += expect_fail('SPICE frame MOON_PA_DE440 instead of ME', lambda m: setattr(m, 'FRAME', 'MOON_PA_DE440'))
# 4. libration evaluated one subinterval off (wrong Chebyshev block)
def wrong_block(m):
    f = m.de440_librations
    def g():
        a = f(); return lambda jd: a(jd + 8.0)
    m.de440_librations = g
bad += expect_fail('libration angles from the wrong 8-day block', wrong_block)
# 5. no light-time correction in the Horizons comparison (ceiling tightened to the corrected level to show it matters)
def no_lt(m): m.C_KMS = float('inf'); m.CEIL = dict(m.CEIL, horizons_deg=0.001)
bad += expect_fail('Horizons comparison without the light-time correction', no_lt)
# 6. a state rotated at the wrong epoch (one minute late)
def late(m):
    f = m.lro_states
    m.lro_states = lambda: [(r, v, et + 60.0) for r, v, et in f()]
bad += expect_fail('every state rotated one minute late', late)
print('breaks:', 6 - bad, 'caught of 6'); sys.exit(1 if bad else 0)
