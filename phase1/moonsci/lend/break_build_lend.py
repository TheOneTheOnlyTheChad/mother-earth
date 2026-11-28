#!/usr/bin/env python3
"""Mutation runs for test_build_lend.py: each deliberately broken copy of build_lend.py must make the tests FAIL.
The asset comparison (G) is skipped for mutants by pointing the test at a temporary asset built from the mutant itself, so a mutant
is caught by the behavioural tests, not merely because its bytes differ. Usage: python3 -I break_build_lend.py <dir with retained file>"""
import os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', 'build_lend.py')).read()
MUT = {
    'radius-as-diameter': ("RADIUS_KM, SPHERE_KM, CUTOFF_PP, EDGE_DEG = 30.0,", "RADIUS_KM, SPHERE_KM, CUTOFF_PP, EDGE_DEG = 60.0,"),
    'no-seam-wrap': ("xyz = np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], 1)",
                     "xyz = np.stack([np.cos(la) * np.cos(lo * 0.999), np.cos(la) * np.sin(lo * 0.999), np.sin(la)], 1)"),
    'rows-flipped-output': ("    for k in res:\n        st = k['state']", "    for k in [res[(19 - j // 720) * 720 + j % 720] for j in range(len(res))]:\n        st = k['state']"),
    'rows-flipped-parse': ("if lat != f32(-89.75 + 0.5 * r)", "if lat != f32(-80.25 - 0.5 * r)"),
    'error-before-edge': ("        if lat[i] + reach > EDGE_DEG:\n            st = 3\n        elif e > CUTOFF_PP:\n            st = 2",
                          "        if e > CUTOFF_PP:\n            st = 2\n        elif lat[i] + reach > EDGE_DEG:\n            st = 3"),
    'cutoff-after-rounding': ("        elif e > CUTOFF_PP:", "        elif q100(e) > round(CUTOFF_PP * 100):"),
    'no-covariance': ("- 2.0 * m * cov / r ** 3", "- 0.0 * m * cov / r ** 3"),
    'sentinel-as-missing': ("        raise BuildError('record %d: inconsistent values", "        out.append({'row': r, 'col': c, 'lat': lat, 'lon': lon, 'state': 'missing'}); continue\n        raise BuildError('record %d: inconsistent values"),
    'nan-unchecked': ("            if not math.isfinite(v):\n                raise BuildError", "            if False:\n                raise BuildError"),
}
bad = 0
for name, (a, b) in MUT.items():
    if a not in SRC:
        print('PATTERN MISSING', name); bad += 1; continue
    d = tempfile.mkdtemp()
    p = os.path.join(d, 'build_lend.py'); open(p, 'w').write(SRC.replace(a, b, 1))
    r = subprocess.run([sys.executable, '-I', os.path.join(HERE, 'test_build_lend.py'), sys.argv[1]], env={**os.environ, 'LEND_BUILDER': p}, capture_output=True, text=True)
    fails = [l for l in r.stdout.splitlines() if l.startswith('FAIL ')]
    behavioural = [l for l in fails if not l.startswith('FAIL G committed asset')]
    crashed = r.returncode != 0 and not fails and 'BuildError' in r.stderr
    caught = r.returncode != 0 and (len(behavioural) > 0 or crashed)
    how = 'the builder refuses the real file (BuildError)' if crashed else 'behavioural fails %d; first: %s' % (len(behavioural), behavioural[0][:90] if behavioural else '-')
    print(('CAUGHT  ' if caught else 'MISSED  ') + name + '  (' + how + ')')
    bad += 0 if caught else 1
print('break_build_lend: %d of %d mutants caught' % (len(MUT) - bad, len(MUT)))
sys.exit(1 if bad else 0)
