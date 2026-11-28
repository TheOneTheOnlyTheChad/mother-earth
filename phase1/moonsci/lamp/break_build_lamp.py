#!/usr/bin/env python3
"""Mutation check for test_build_lamp.py: each mutant builder writes a page file to a temporary path; the tests must FAIL on every one.
Usage: python3 -I phase1/moonsci/lamp/break_build_lamp.py --src <dir with the retained files>
"""
import argparse, os, subprocess, sys, tempfile

ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.join(HERE, '..', 'build_lamp.py'); TEST = os.path.join(HERE, 'test_build_lamp.py')
src = open(BUILDER).read()
MUT = {
    'threshold7': ('shown = nq >= NMIN', 'shown = nq >= 7'),
    'code4qualifies': ('qual = inside & np.isfinite(A) & (Q == 0)', 'qual = inside & np.isfinite(A) & ((Q == 0) | (Q == 4))'),
    'floor': ('thou = np.floor(mv * 1000 + 0.5)', 'thou = np.floor(mv * 1000)'),
    'nohiflag': ('hi = blk(qp & (Ap > 1)).any((1, 3))', 'hi = np.zeros((C, C), bool)'),
    'flipped': ("A = np.frombuffer(raw['albed'], '<f4').reshape(N, N).astype(np.float64)", "A = np.frombuffer(raw['albed'], '<f4').reshape(N, N)[::-1].astype(np.float64)"),
    'transposed': ("Q = np.frombuffer(raw['dqual'], '<f4').reshape(N, N)", "Q = np.frombuffer(raw['dqual'], '<f4').reshape(N, N).T"),
    'nocapmask': ('inside = LAT <= -CAPLAT', 'inside = LAT <= 0'),
    'padfront': ("pad = lambda a, v: np.pad(a, ((0, P - N), (0, P - N)), constant_values=v)", "pad = lambda a, v: np.pad(a, ((P - N, 0), (P - N, 0)), constant_values=v)"),
    'nanmean': ("mean = np.where(blk(qp), blk(Ap), 0.0).sum((1, 3)) / nq", "mean = np.where(blk(qp), blk(Ap), 0.0).sum((1, 3)) / 16"),
}
caught = 0
for name, (x, y) in MUT.items():
    assert src.count(x) == 1, 'mutation pattern missing: ' + name
    with tempfile.TemporaryDirectory() as d:
        b = os.path.join(d, 'build_lamp_mut.py'); out = os.path.join(d, 'out.bin.gz')
        open(b, 'w').write(src.replace(x, y))
        r = subprocess.run([sys.executable, '-I', b, '--src', a.src, '--out', out], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(out):
            print(f'{name}: builder itself refused ({r.stdout.strip()[-80:]}{r.stderr.strip()[-80:]}) -> counts as caught'); caught += 1; continue
        t = subprocess.run([sys.executable, '-I', TEST, '--src', a.src, '--file', out], capture_output=True, text=True)
        hit = t.returncode != 0
        caught += hit
        print(f'{name}: {"caught" if hit else "NOT CAUGHT"} ({t.stdout.strip().splitlines()[-1]})')
print(f'break_build_lamp: {caught} of {len(MUT)} mutants caught')
sys.exit(0 if caught == len(MUT) else 1)
