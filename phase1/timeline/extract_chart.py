#!/usr/bin/env python3
"""Extract the clock for the Timeline from the pinned ICS chart data (CC BY 4.0).

Usage: python3 phase1/timeline/extract_chart.py <path to chart.ttl>
  chart.ttl = https://raw.githubusercontent.com/i-c-stratigraphy/chart/44d1043ecf29/chart.ttl (tag v2026-06.5)

Refuses any file whose sha256 differs from the pin. Writes phase1/timeline/chart-v2026-06.5.json with the
Phanerozoic periods (name, chart short code, colour, beginning/end in Ma with the chart's margin), the window
and overview bounds, and the chart boundaries the five episodes are shown beside. Values are copied as stated;
nothing is rounded or reconciled. The `~` approximation flag is a page convention the data file does not carry,
so it is recorded from the chart page reading (Big Five source check, C0) where it applies.
"""
import hashlib, json, pathlib, re, sys

PIN = '0158959e8fdae2a8bdbb14ca3e424d2370362cd8dfc8af86e7be73c74368b355'
OUT = pathlib.Path(__file__).resolve().parent / 'chart-v2026-06.5.json'
PERIODS = ['Cambrian', 'Ordovician', 'Silurian', 'Devonian', 'Carboniferous', 'Permian', 'Triassic', 'Jurassic',
           'Cretaceous', 'Paleogene', 'Neogene', 'Quaternary']
# boundary name -> (unit whose beginning is the boundary, label)
BOUNDARIES = {'ordovician-silurian': 'Silurian', 'frasnian-famennian': 'Famennian', 'permian-triassic': 'Triassic',
              'triassic-jurassic': 'Jurassic', 'cretaceous-paleogene': 'Paleogene'}
# the live chart page marks these values approximate (~); the data file carries no flag (C0 record: ~538.8 ± 0.6, ~486.85 ± 1.5, ~201.4 ± 0.2)
APPROX_VALUES = {538.8, 486.85, 201.4}


def block(t, name):
    m = re.search(r'\nischart:' + name + r'\n(.*?)\n\.\n', t, re.S)
    if not m: sys.exit(f'unit {name} not found')
    return m.group(1)


def edge(b, which):
    m = re.search(r'time:has' + which + r'\s*\[\s*(.*?)\]', b, re.S)
    if not m: return None
    v = re.search(r'ischart:inMYA\s+([0-9.]+)', m.group(1)); e = re.search(r'schema:marginOfError\s+([0-9.]+)', m.group(1))
    ma = float(v.group(1))
    # *_text keep the chart's own writing (66.00, 1.0) for display; numbers are for placement
    return {'ma': ma, 'margin': float(e.group(1)) if e else None, 'approximate': ma in APPROX_VALUES,
            'ma_text': v.group(1), 'margin_text': e.group(1) if e else None}


def main():
    raw = pathlib.Path(sys.argv[1]).read_bytes()
    h = hashlib.sha256(raw).hexdigest()
    if h != PIN: sys.exit(f'chart.ttl sha256 {h} != pinned {PIN}')
    t = raw.decode('utf-8')
    def period(n):
        b = block(t, n)
        lab = re.search(r'"([^"]+)"@en\s*[,;]', b[b.find('skos:prefLabel'):]).group(1)
        code = re.search(r'skos:notation\s+"([^"]+)"\^\^ischart:ccgmShortCode', b).group(1)
        col = re.search(r'schema:color\s+"(#[0-9A-Fa-f]{6})"', b).group(1)
        return {'name': lab, 'code': code, 'colour': col, 'begin': edge(b, 'Beginning'), 'end': edge(b, 'End')}
    out = {
        'source': {'name': 'ICS International Chronostratigraphic Chart', 'tag': 'v2026-06.5', 'commit': '44d1043ecf29',
                   'file': 'chart.ttl', 'file_sha256': PIN, 'licence': 'CC BY 4.0',
                   'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
                   'citation': 'Cohen K, Harper D, Gibbard P, Car N. The ICS international chronostratigraphic chart this decade. '
                               'Episodes 2025;48:105-115. https://doi.org/10.18814/epiiugs/2025/025001',
                   'chart_page': 'https://stratigraphy.org/chart/', 'units': 'Ma',
                   'margin_meaning': 'as stated by ICS (meaning not given in the data read)'},
        'window': edge(block(t, 'Phanerozoic'), 'Beginning'),
        'overview': edge(block(t, 'Hadean'), 'Beginning'),
        'periods': [period(n) for n in PERIODS],
        'boundaries': {k: edge(block(t, u), 'Beginning') for k, u in BOUNDARIES.items()},
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'{OUT.name} written from chart.ttl sha256 {h}')


if __name__ == '__main__':
    main()
