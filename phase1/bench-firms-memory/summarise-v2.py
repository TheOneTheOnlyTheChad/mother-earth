#!/usr/bin/env python3
"""Summarise results-v2*.jsonl → markdown tables: pass count per (file, scenario, cap), heap peaks (sampled lower bounds), wall ms.
Usage: python3 summarise-v2.py results-v2.jsonl [more.jsonl …]"""
import json, sys, collections
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f) if l.strip()]
cell = collections.defaultdict(list)
for d in rows:
    cap = (d.get('tested', {}).get('v8_flags') or '').replace('--max-heap-size=', '')
    cell[(d.get('file', '?').split('/')[-1], d.get('scenario'), cap)].append(d)
files = ['real.csv', '8mib.csv', 'dense-8mib.csv', '16mib.csv', '32mib.csv', '64mib.csv']
scen = ['collect', 'checkpoint', 'checkpoint-rebuild', 'overlap', 'stress-2-collects', 'injected-reset', 'injected-reset-cl', 'injected-truncated-row', 'legacy-transition']
caps = sorted({k[2] for k in cell}, key=lambda c: int(c) if c.isdigit() else 0)
print('| file | scenario | ' + ' | '.join(f'cap {c} MB' for c in caps) + ' | max sampled heap MB | max wall ms |')
print('|---|---|' + '---|' * len(caps) + '---|---|')
for f in files:
    for s in scen:
        rs = [cell.get((f, s, c), []) for c in caps]
        if not any(rs): continue
        marks = [''.join('p' if d['verdict'] == 'pass' else 'F' for d in r) or '–' for r in rs]
        allr = [d for r in rs for d in r]
        hp = max((d.get('heap_peak_sampled') or 0) for d in allr); ms = max((d.get('ms') or 0) for d in allr)
        print(f'| {f} | {s} | ' + ' | '.join(marks) + f' | {hp:.1f} | {ms} |')
tot = len(rows); ok = sum(d['verdict'] == 'pass' for d in rows)
print(f'\n{ok} of {tot} runs pass.')
fails = [d for d in rows if d['verdict'] != 'pass']
if fails:
    print('\nFailures:')
    for d in fails: print(f"- {d.get('file')} {d.get('scenario')} {d.get('tested', {}).get('v8_flags')}: alive={d.get('alive')} err={d.get('err')} fail={(d.get('fail') or [])[:2]}")
