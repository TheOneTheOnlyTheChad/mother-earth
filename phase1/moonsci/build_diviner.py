#!/usr/bin/env python3
"""Moon temperature layer: build the page file from the 18 retained Diviner GCP extractions (MOON-DIVINER-PROPOSAL rev 2 §6.2).
Build tooling; not served. Needs numpy.

Usage:
  python3 -I phase1/moonsci/build_diviner.py --ext <dir of gcp-tbol-x10000-<band>-R1.i32.gz> [--planes <dir of pane band planes>] [--check]
Writes (or, with --check, compares byte for byte against the committed copies):
  assets/moon/diviner/gcp-tbol-nm-R1.bin.gz   the MEDIVNR1 page file (gzip -9, mtime 0)
  assets/moon/diviner/SOURCE.json             provenance, statistic, coding, frozen masks and scales, clipped shares, hashes
Fails (exit 1) unless all 18 checkpoints are complete and every retained extraction re-hashes to its checkpoint (gzip and raw).
With --planes, each band's rows must also equal the band planes the pane produced during acquisition, byte for byte.

Frozen by Chad (26 Nov 2026), after the §6.4 global report: noon withheld poleward of 70 deg, midnight poleward of 80 deg (display
policy); colour scales noon 281-395 K and midnight 70-105 K (the 1st/99th percentiles of valid displayed cells, rounded outward
to whole kelvin). The builder recomputes the percentiles and stops if the frozen ends no longer follow from the data."""
import sys
import os
import gzip
import json
import hashlib
import struct
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CP = os.path.join(ROOT, 'docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl')
OUT = os.path.join(ROOT, 'assets/moon/diviner')
NAME = 'gcp-tbol-nm-R1.bin.gz'
args = sys.argv[1:]
ext_dir = args[args.index('--ext') + 1]
pl_dir = args[args.index('--planes') + 1] if '--planes' in args else None
CHECK = '--check' in args

SENT = -99980000
NOON, MID = [46, 47, 48, 49], [94, 95, 0, 1]
MASK = {'noon': 7000, 'mid': 8000}                     # 0.01 deg: a cell is withheld when |latitude centre| > this
SCALE = {'noon': (281, 395), 'mid': (70, 105)}           # frozen, whole K
BANDS = ['80n90n', '70n80n', '60n70n', '50n60n', '40n50n', '30n40n', '20n30n', '10n20n', '00n10n',
         '10s00s', '20s10s', '30s20s', '40s30s', '50s40s', '60s50s', '70s60s', '80s70s', '90s80s']
GLOBAL_REPORT_DIGEST = '1cd629dd3be74f752452ea55366efd9ebff6d279bfedab30a7f1d9d4ebcc9f7b'   # reviews/2026-11-26-moon-diviner-global-report.md §2


def stop(m):
    print('STOP: ' + m)
    sys.exit(1)


cps = [json.loads(l) for l in open(CP) if l.strip()]
by = {c['band']: c for c in cps}
if sorted(by) != sorted(BANDS) or len(cps) != 18 or any(c['status'] != 'complete' or not c['source']['md5_match'] for c in cps):
    stop('the 18 band checkpoints are not all present and complete')


def lat0x100(b):
    a = int(b[0:2])
    return (-a if b[2] == 's' else a) * 100 + 25


def codes(win, latx, mask):
    valid = win > SENT
    n = valid.sum(axis=2)
    s = np.where(valid, win, 0).sum(axis=2)
    mx = np.where(valid, win, -2 ** 40).max(axis=2)
    mn = np.where(valid, win, 2 ** 40).min(axis=2)
    value = np.zeros(n.shape, np.int64)
    pos = n > 0
    value[pos] = (s[pos] + n[pos] * 500) // (n[pos] * 1000)       # mean in 0.1 K, rounded half up (exact integer arithmetic on tbol x 10000)
    rng = np.full(n.shape, 255, np.int64)
    two = n >= 2
    d = mx - mn
    rng[two] = np.where(d[two] >= 2535000, 254, (d[two] + 5000) // 10000)   # whole K, half up; 254 = at least 253.5 K
    w = np.broadcast_to((np.abs(latx)[None, :] > mask), n.shape)
    return np.where(w, 1, value), np.where(w, 0, n), np.where(w, 255, rng)


G = {m: [np.zeros((360, 720), np.int64) for _ in range(3)] for m in ('noon', 'mid')}
cols = (np.arange(720) + 360) % 720          # source longitude index 0 (-179.75) -> page column 360; index 360 (0.25 E) -> column 0
for b in BANDS:
    ex = by[b]['outputs']['extraction']
    gz = open(os.path.join(ext_dir, ex['file']), 'rb').read()
    raw = gzip.decompress(gz)
    if hashlib.sha256(gz).hexdigest() != ex['gz_sha256'] or hashlib.sha256(raw).hexdigest() != ex['raw_sha256'] or len(raw) != 5529600:
        stop(f'{b}: retained extraction does not re-hash to its checkpoint')
    e = np.frombuffer(raw, '<i4').astype(np.int64).reshape(720, 20, 96)
    if not ((e > SENT) | (e == -99990000) | (e == -99980000)).all() or not ((e[e > SENT] > 10000) & (e[e > SENT] < 4500000)).all():
        stop(f'{b}: a value is neither an exact sentinel nor inside 1-450 K')
    lat0 = lat0x100(b)
    latx = lat0 + 50 * np.arange(20)
    r0 = int(round((8975 - (lat0 + 950)) / 50))   # page row of the band's northernmost latitude centre
    band = b''
    for m, bins in (('noon', NOON), ('mid', MID)):
        for k, a in enumerate(codes(e[:, :, bins], latx, MASK[m])):
            o = np.zeros((20, 720), np.int64)
            o[:, cols] = a.T[::-1, :]
            G[m][k][r0:r0 + 20] = o
    if pl_dir:
        p = G['noon'], G['mid']
        sl = slice(r0, r0 + 20)
        band = (p[0][0][sl].astype('<u2').tobytes() + p[1][0][sl].astype('<u2').tobytes() + p[0][1][sl].astype('u1').tobytes()
                + p[1][1][sl].astype('u1').tobytes() + p[0][2][sl].astype('u1').tobytes() + p[1][2][sl].astype('u1').tobytes())
        pf = os.path.join(pl_dir, by[b]['outputs']['band_planes']['file'])
        if open(pf, 'rb').read() != band:
            stop(f'{b}: rows differ from the pane band planes')
dig = hashlib.sha256(b''.join(G[m][k].astype('<i4').tobytes() for m in ('noon', 'mid') for k in range(3))).hexdigest()
if dig != GLOBAL_REPORT_DIGEST:
    stop('assembled grid differs from the global report digest')

# frozen scales: recompute the percentiles and clipped shares from valid displayed cells
scales = {}
for m in ('noon', 'mid'):
    v = G[m][0]
    vals = v[v >= 2] / 10
    p1, p99 = np.percentile(vals, [1, 99])
    lo, hi = SCALE[m]
    if (int(np.floor(p1)), int(np.ceil(p99))) != (lo, hi):
        stop(f'{m}: frozen scale {lo}-{hi} K no longer follows from the data (1st/99th pct {p1:.2f}/{p99:.2f})')
    scales[m] = {'low_K': lo, 'high_K': hi, 'p1_K': round(float(p1), 2), 'p99_K': round(float(p99), 2), 'valid_cells': int(vals.size),
                 'clipped_below_pct': round(float((vals < lo).mean() * 100), 2), 'clipped_above_pct': round(float((vals > hi).mean() * 100), 2),
                 'no_valid_cells': int((v == 0).sum()), 'withheld_cells': int((v == 1).sum())}

hdr = bytearray(64)
hdr[0:8] = b'MEDIVNR1'
struct.pack_into('<HHHHHHhhHHHH', hdr, 8, 1, 64, 720, 360, 6, 0, 25, 8975, 50, 700, 800, 0)
payload = (G['noon'][0].astype('<u2').tobytes() + G['mid'][0].astype('<u2').tobytes() + G['noon'][1].astype('u1').tobytes()
           + G['mid'][1].astype('u1').tobytes() + G['noon'][2].astype('u1').tobytes() + G['mid'][2].astype('u1').tobytes())
hdr[32:64] = hashlib.sha256(payload).digest()
raw = bytes(hdr) + payload
assert len(raw) == 2073664
gz = gzip.compress(raw, 9, mtime=0)
H = lambda x: hashlib.sha256(x).hexdigest()
src = {
    'layer': 'Moon temperature (moon.html, optional): What LRO measured: brightness temperature around local noon / local midnight',
    'kind': 'derived page file from a measurement-derived product (Diviner team bins); our own second step is the window mean; not live',
    'source': {
        'product': 'Diviner Global Cumulative Product (GCP), data set LRO-L-DLRE-5-GCP-V1.0, field tbol',
        'label_description': 'Bolometric average calibrated brightness temperature (K)',
        'bundle': 'urn:nasa:pds:lro_diviner_derived1 v5.0', 'bundle_doi': '10.17189/wj0s-w188',
        'citation': 'Paige, D.A.; Sullivan, M.T.; Williams, J.-P. (2022). LRO Diviner Derived Data Products. NASA PDS. https://doi.org/10.17189/wj0s-w188',
        'files': '18 band files global_cumul_avg_cyl_<band>_002.tab, each 156,211,313 B; archive MD5s in docs/research/moon-lro-science/SAMPLES.md §6.4',
        'compilation_period': 'nadir observations 5 Jul 2009 - 1 Apr 2015 (gcpds.cat)',
        'grid': '0.5 deg cells, 96 local-time bins of 0.25 h (centres 0.125 + 0.25k h)',
        'processing_reference': 'Diviner RDR SIS v1.21 §8.1: mean channel 3-9 radiances per bin determine the bolometric brightness temperature',
        'general_definition': 'Powell et al. 2023, JGR Planets 128, e2022JE007532, §2.5 (read by Claude 26 Nov 2026; see SAMPLES §6.8): an equivalent blackbody temperature of the wavelength-integrated flux',
        'also_cited': 'Williams, J.-P. et al. 2017, Icarus 283, 300-325 (the GCP label gives its DOI with a typo)',
        'rights': "PDS Geosciences FAQ: 'Data sets archived in the PDS are in the public domain'; cite the bundle DOI",
        'acquisition': {'checkpoints': 'docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl', 'checkpoints_sha256': H(open(CP, 'rb').read()),
                        'retained_extractions': 'Documents/Mother Earth/_source-data/moon-lro-science-diviner-gcp/ (not committed; schema EXTRACTION-SCHEMA.md R1)',
                        'archive_md5': {b: by[b]['source']['archive_md5'] for b in BANDS}},
    },
    'statistic': ('For each 0.5 deg cell and window, the unweighted arithmetic mean of the available quarter-hour tbol bin values within an hour '
                  'of local noon (bins 46-49, 11:30-12:30) or local midnight (bins 94, 95, 0, 1, 23:30-00:30). Empty (-9999) and invalid (-9998) '
                  'bins are omitted. n = bins used (0-4). Range = max - min of the bins used, only for n >= 2; it is not an uncertainty. '
                  'Not a bolometric temperature for the hour, and with fewer than four bins not a fully sampled hourly average.'),
    'coding': {'value': 'u16: 0 = no valid data in this window, 1 = withheld (display policy), v >= 2 -> v/10 K, mean rounded half up to 0.1 K',
               'n': 'u8 0-4 (0 for withheld)', 'range': 'u8 whole K rounded half up; 254 = at least 253.5 K (display capped); 255 = unavailable (n <= 1, no valid data, withheld)',
               'rounding_note': 'values are rounded to 0.1 K; the rounding is not the accuracy'},
    'masks': {'noon': 'withheld poleward of 70 deg (cell centres beyond 70)', 'midnight': 'withheld poleward of 80 deg',
              'nature': 'our display policy, not the edge of Diviner coverage and not a guarantee of small spread inside it', 'frozen': 'Chad, 26 Nov 2026'},
    'comparison_ghrm': {'what': 'Centre-cell differences, this map minus the GHRM midnight tbol mosaic (dghrm_tbol_m_70s70n_img) as 0.5-degree block means, at 20 sites',
                        'result': 'ten selected high-contrast midnight sites (our own grid maxima): -1.9 to +16.7 K, median +8.7 K; ten fixed background sites: +0.05 to +0.82 K',
                        'caveat': 'The products use different processing, sampling and periods; the causes of the differences have not been isolated. This comparison is not an accuracy estimate. The high-contrast sites were selected from this map, so they are not a random sample.',
                        'registration': 'the true alignment scored better on average than one-cell shifts, a 180-degree shift and local 3 x 3 reflections; this supports the grid orientation, and does not exclude local pointing or effective-footprint differences',
                        'evidence': 'phase1/moonsci/diviner/ghrm_compare.py; docs/research/moon-lro-science/diviner-ghrm/'},
    'scales': {**scales, 'shares_are_of': 'equal-angle 0.5 deg grid cells, not lunar surface area', 'rule': 'one fixed sequential ramp; per mode the ends are the 1st and 99th percentiles of valid displayed cells, rounded outward to whole K; computed once, never per view; clipped cells keep their exact value in the readout', 'frozen': 'Chad, 26 Nov 2026'},
    'review': {'cadence': 'every six months and on any Diviner derived release; earlier versions kept if a newer one is reviewed',
               'last_checked': '26 Nov 2026: GCP files dated 15 Mar 2017; derived bundle last changed 2 Feb 2024; no newer GCP version',
               'records': 'REGISTER.md (LRO Diviner GCP entry); sources.html#moontemp'},
    'build': {'script': 'phase1/moonsci/build_diviner.py', 'script_sha256': H(open(os.path.abspath(__file__), 'rb').read()),
              'check': 'python3 -I phase1/moonsci/build_diviner.py --ext <retained extractions> --check', 'grid_digest': dig},
    'files': {NAME: {'bytes': len(gz), 'sha256': H(gz), 'decompressed_bytes': len(raw), 'decompressed_sha256': H(raw), 'payload_sha256': H(payload),
                     'format': 'MEDIVNR1 schema 1: 64-byte header then planes P1 noon value u16, P2 midnight value u16, P3 noon n, P4 midnight n, P5 noon range, P6 midnight range; '
                               '720 columns from 0.25 E eastward, 360 rows from 89.75 N southward; little-endian (MOON-DIVINER-PROPOSAL rev 2 §6.2)'}},
}
sj = (json.dumps(src, indent=1, ensure_ascii=False) + '\n').encode()
outs = {NAME: gz, 'SOURCE.json': sj}
if CHECK:
    bad = [f for f, d in outs.items() if not os.path.exists(os.path.join(OUT, f)) or open(os.path.join(OUT, f), 'rb').read() != d]
    if bad:
        stop('committed files differ from a fresh build: ' + ', '.join(bad))
    print('CHECK PASS: committed files equal a fresh build')
else:
    os.makedirs(OUT, exist_ok=True)
    for f, d in outs.items():
        open(os.path.join(OUT, f), 'wb').write(d)
print(f'{NAME}: {len(gz)} B gzip, {len(raw)} B raw; gz {H(gz)}; raw {H(raw)}')
for m in ('noon', 'mid'):
    s = scales[m]
    print(f"{m}: scale {s['low_K']}-{s['high_K']} K (p1 {s['p1_K']}, p99 {s['p99_K']}); clipped {s['clipped_below_pct']}% below, {s['clipped_above_pct']}% above; "
          f"no valid {s['no_valid_cells']}, withheld {s['withheld_cells']}")
print('grid digest', dig)
