#!/usr/bin/env python3
"""Cut the preview fixture from the full 4-degree soil table (proposal rev 3 §3; Chad's S4 go, 25 Nov 2026).
The fixture is a SUBSET of real records, unchanged. Its meta says so and lists exactly which cells it holds, so the page can tell
"not in this fixture" apart from "no organic soil mapped" (the sparse rule holds only for the full table).
Usage: soil_fixture.py <full table.json> <out fixture.json>"""
import sys, json, hashlib

NAMED = ['22_70', '21_29', '38_39', '13_27', '31_78', '17_89', '35_61', '33_54', '22_29', '40_16', '14_49']   # 14_49: in the subset, absent from the table
REGIONS = [(range(20, 25), range(68, 77)),     # 10°S–10°N, 92°E–128°E: Sumatra, Borneo, New Guinea's west
           (range(37, 40), range(44, 53))]     # 58°N–70°N, 4°W–32°E: Scandinavia and Finland

full = json.load(open(sys.argv[1]))
want = sorted(set(NAMED) | {f'{r}_{c}' for rr, cc in REGIONS for r in rr for c in cc}, key=lambda k: tuple(map(int, k.split('_'))))
meta = dict(full['meta'])
meta['fixture'] = dict(
    note=('Preview fixture: a subset of the full table, records unchanged. A cell listed in subset_cells but absent from cells has no '
          'mapped organic soil (sparse rule). A cell NOT in subset_cells is not in this fixture: unknown, never "no organic soil".'),
    subset_cells=want, source_table_sha256=hashlib.sha256(open(sys.argv[1], 'rb').read()).hexdigest(),
    built_by='docs/research/soil-c1/soil_fixture.py')
meta['checks'] = dict(full['meta']['checks'], positive_without_mapped_organic_soil=[], unknown_cells=[])
cells = {k: full['cells'][k] for k in want if k in full['cells']}
json.dump(dict(meta=meta, cells=cells), open(sys.argv[2], 'w'), separators=(',', ':'), sort_keys=True)
print(len(want), 'subset cells,', len(cells), 'records,', sorted(set(want) - set(cells)), 'listed without a record')
