#!/usr/bin/env python3
"""Offline builder: historical regional land context for zebra Z3866 (stage C1a). Makes no network call.

  build_journey_context.py --firms DIR --hansen DIR --journey FILE --out FILE [--check]

Refuses to build unless: the FIRMS folder passes journey_context_verify.verify(); the six Hansen files match the pinned
sha256 values below and their manifest says complete; the journey file matches its pin. --check rebuilds in memory and
fails if the file on disk differs by one byte; it changes nothing and makes no provider call.

Method (evidence record rev 1.3 and build brief): region = 4-degree cells 17_50 and 17_51 (half-open); fires = FIRMS
MODIS_SP rows with type 0, all confidence levels, Terra and Aqua, acquisition time within [first fix, last fix] rounded
to whole minutes, clipped to the half-open union, identical rows counted once, conflicting rows stop the build;
loss = Hansen GFC v1.13 pixels with datamask 1, treecover2000 >= 30 and lossyear 7 or 8, area from each pixel row's
WGS84 ellipsoidal area. Needs numpy, tifffile and imagecodecs (tifffile's strip decoder is used, so each row is exactly 40,000 pixels). Memory is bounded: rasters are read
one strip (one row) at a time in blocks of BLOCK rows.
"""
import argparse, csv, hashlib, io, json, math, os, resource, sys, time
from datetime import date, datetime, timedelta, timezone
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import journey_context_firms_fetch as fetch
import journey_context_verify as verify

BUILDER_VERSION = 'C1a-1'
JOURNEY_SHA256 = '8d00aa32dc728dee09f7136835b5b1d32e3cc19469250ad29bf73506a1141bb6'
CELLS = ['17_50', '17_51']
W, S, E, N = 20.0, -22.0, 28.0, -18.0
HUB_AREA_KM2 = {'17_50': 185861, '17_51': 185861}           # the hub's cellAreaKm2 (sphere, R = 6371.0088 km)
THRESHOLD = 30
LOSS_YEARS = {7: 2007, 8: 2008}
HANSEN = {  # file: (sha256, tile top latitude, tile west longitude)
    'Hansen_GFC-2025-v1.13_lossyear_10S_020E.tif': ('cc1a73d3380940a2d311588132d2be2034b74b5b6b9396a489d2d438a92e777f', -10, 20), 'Hansen_GFC-2025-v1.13_treecover2000_10S_020E.tif': ('d3606e340c181b551b98f2f73c30d1383d83293c0442eb025bebb0d97fc38b0a', -10, 20),
    'Hansen_GFC-2025-v1.13_datamask_10S_020E.tif': ('34b68ccf3537d0032f53a0707a0c2791c81a59c1a09f3e869b65ba1159d44c34', -10, 20), 'Hansen_GFC-2025-v1.13_lossyear_20S_020E.tif': ('35fec7711598c0914b30da86ea533834f11566f562e7075e0a51b1bfee0f2c13', -20, 20),
    'Hansen_GFC-2025-v1.13_treecover2000_20S_020E.tif': ('a53059f5cdbc66f86f671b131ab62633d422e424c45c8e706fed34912af7d05e', -20, 20), 'Hansen_GFC-2025-v1.13_datamask_20S_020E.tif': ('2d65b797f1148241c61d66fc9376bb99843c2bb84a4c4bf1d5c5b08d120a3396', -20, 20)}
PIX = 0.00025
BLOCK = 250
WGS84_A, WGS84_F = 6378137.0, 1 / 298.257223563

class Refuse(Exception): pass

def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for c in iter(lambda: f.read(1 << 22), b''): h.update(c)
    return h.hexdigest()

# ---------------------------------------------------------------- journey
def journey_facts(path):
    raw = open(path, 'rb').read()
    if hashlib.sha256(raw).hexdigest() != JOURNEY_SHA256: raise Refuse('the zebra journey file does not match its pin')
    d = json.loads(raw)
    t, lat, lon = d['t'], d['lat'], d['lon']
    if not (len(t) == len(lat) == len(lon) == d['n']): raise Refuse('the journey file is inconsistent')
    cells = sorted({f'{math.floor((la + 90) / 4)}_{math.floor((lo + 180) / 4)}' for la, lo in zip(lat, lon)})
    if cells != CELLS: raise Refuse(f'the retained fixes touch {cells}, not {CELLS}')
    first, last = datetime.fromtimestamp(min(t), timezone.utc), datetime.fromtimestamp(max(t), timezone.utc)
    return {'id': d['id'], 'fixes': d['n'], 'first_fix_utc': first.isoformat().replace('+00:00', 'Z'), 'last_fix_utc': last.isoformat().replace('+00:00', 'Z'),
            'sha256': JOURNEY_SHA256}, first, last

# ---------------------------------------------------------------- fires
MONTHS = None
def month_rows(first_min, last_min):
    rows, y, m = [], first_min.year, first_min.month
    while (y, m) <= (last_min.year, last_min.month):
        start = datetime(y, m, 1, tzinfo=timezone.utc); nxt = datetime(y + (m == 12), m % 12 + 1, 1, tzinfo=timezone.utc)
        a, b = max(start, first_min), min(nxt - timedelta(minutes=1), last_min)
        part = a != start or b != nxt - timedelta(minutes=1)
        label = (f'{a.day}–{b.day} {a:%b %Y}' if part else f'{a:%b %Y}')
        rows.append({'label': label, 'from_utc': a.strftime('%Y-%m-%dT%H:%MZ'), 'to_utc': b.strftime('%Y-%m-%dT%H:%MZ'), 'part_month': part, 'count': 0})
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return rows

def in_union(lat, lon): return S <= lat < N and W <= lon < E
def cell_of(lat, lon): return f'{math.floor((lat + 90) / 4)}_{math.floor((lon + 180) / 4)}'

def count_fires(windows, first, last):
    """Pure counting over [(start_date, days, csv_text)]: the rules of the record, testable without any provider file."""
    first_min = first.replace(second=0, microsecond=0); last_min = last.replace(second=0, microsecond=0)
    months = month_rows(first_min, last_min)
    seen, total, other_types, dup, outside_t, outside_u = {}, 0, {}, 0, 0, 0
    by_sat, by_cell, versions = {}, {c: 0 for c in CELLS}, set()
    for start, days, text in windows:
        for r in csv.DictReader(io.StringIO(text)):
            if fetch.bad_row([r[k] for k in fetch.HEADER], start, start + timedelta(days=days - 1)):
                raise Refuse(f'window {start}: a row fails the extractor\'s checks')
            key = (r['latitude'], r['longitude'], r['acq_date'], r['acq_time'].zfill(4), r['satellite'])
            full = tuple(r[k] for k in fetch.HEADER)
            if key in seen:
                if seen[key] != full: raise Refuse(f'conflicting rows for {key[2]} {key[3]} {key[4]}: same identity, different values')
                dup += 1; continue
            seen[key] = full
            t = r['acq_time'].zfill(4); at = datetime.fromisoformat(f"{r['acq_date']}T{t[:2]}:{t[2:]}:00+00:00")
            if not (first_min <= at <= last_min): outside_t += 1; continue
            lat, lon = float(r['latitude']), float(r['longitude'])
            if not in_union(lat, lon): outside_u += 1; continue
            if r['type'] != '0': other_types[r['type']] = other_types.get(r['type'], 0) + 1; continue
            total += 1; versions.add(r['version']); by_sat[r['satellite']] = by_sat.get(r['satellite'], 0) + 1; by_cell[cell_of(lat, lon)] += 1
            ym = at.strftime('%Y-%m'); [mo for mo in months if mo['from_utc'][:7] == ym][0]['count'] += 1
    if sum(mo['count'] for mo in months) != total: raise Refuse('the monthly rows do not sum to the total')
    if sum(by_cell.values()) != total: raise Refuse('the per-cell counts do not sum to the total')
    return {'first_min': first_min, 'last_min': last_min, 'months': months, 'total': total, 'other_types': other_types, 'dup': dup,
            'outside_t': outside_t, 'outside_u': outside_u, 'by_sat': by_sat, 'by_cell': by_cell, 'versions': versions}

def fires(firms_dir, first, last):
    problems = verify.verify(firms_dir)
    if problems: raise Refuse('the FIRMS extraction is not usable: ' + '; '.join(problems[:5]))
    mraw = open(os.path.join(firms_dir, 'manifest.json'), 'rb').read(); m = json.loads(mraw)
    c = count_fires([(date.fromisoformat(w['start']), w['days'], open(os.path.join(firms_dir, w['file']), 'rb').read().decode('utf-8')) for w in m['windows']], first, last)
    first_min, last_min, months, total = c['first_min'], c['last_min'], c['months'], c['total']
    other_types, dup, outside_t, outside_u, by_sat, by_cell, versions = c['other_types'], c['dup'], c['outside_t'], c['outside_u'], c['by_sat'], c['by_cell'], c['versions']
    g = m['gap_list']
    return {
        'product': 'NASA FIRMS active fire detections, MODIS standard processing (MODIS_SP)',
        'collection_wording': 'MODIS Collection 6 standard processing; file version ' + ', '.join(sorted(versions)),
        'versions_in_file': sorted(versions), 'what_is_counted': 'presumed vegetation-fire detections (type 0), all confidence levels, Terra and Aqua; detections, not fires',
        'interval_utc': {'from': first_min.strftime('%Y-%m-%dT%H:%MZ'), 'to': last_min.strftime('%Y-%m-%dT%H:%MZ'),
                         'rounding': 'the first and last retained fixes rounded down to whole minutes; FIRMS acquisition times are given in whole minutes'},
        'count': total, 'by_month': months, 'by_cell': by_cell, 'by_satellite': dict(sorted(by_sat.items())),
        'excluded': {'other_types': dict(sorted(other_types.items())), 'outside_interval': outside_t, 'outside_union': outside_u, 'identical_rows_dropped': dup},
        'coverage': {'state': 'complete', 'gap_days_listed_in_interval': g['modis_days_listed_in_interval'],
                     'statement': "No dates are listed in the provider's missing-data table for this period" if not g['modis_days_listed_in_interval'] else 'Dates listed in the provider\'s missing-data table: ' + ', '.join(g['modis_days_listed_in_interval']),
                     'limitation': 'cloud and unobserved times hide detections; the missing-data table does not describe cloud'},
        'provenance': {'fetch_manifest_sha256': hashlib.sha256(mraw).hexdigest(), 'extractor_sha256': m['script_sha256'], 'requests': m['http_made'],
                       'retrieved_utc': m['run_utc'], 'gap_list_sha256': g['sha256'], 'availability': {k: v for k, v in m['availability'].items() if k != 'sha256'}},
        'credit': 'NASA FIRMS (MODIS); LANCE acknowledgement on every page',
    }

# ---------------------------------------------------------------- Hansen
def q(phi):
    e2 = WGS84_F * (2 - WGS84_F); e = math.sqrt(e2); s = math.sin(phi)
    return (1 - e2) * (s / (1 - e2 * s * s) - (1 / (2 * e)) * math.log((1 - e * s) / (1 + e * s)))

def zone_area_m2(lat1, lat2, dlon_deg):
    """WGS84 ellipsoidal area between two latitudes over a longitude span (exact authalic-latitude formula)."""
    return abs(q(math.radians(lat2)) - q(math.radians(lat1))) * WGS84_A ** 2 / 2 * math.radians(dlon_deg)

def area_reference():
    total = zone_area_m2(-90, 90, 360) / 1e6
    return {'wgs84_total_km2': round(total, 1), 'expected_km2': 510065621.7, 'ok': abs(total - 510065621.7) < 1.0}

def open_band(path, top, west):
    import tifffile
    tf = tifffile.TiffFile(path); p = tf.pages[0]
    if not (p.shape == (40000, 40000) and str(p.dtype) == 'uint8' and p.compression == 5 and p.predictor == 1 and p.rowsperstrip == 1 and len(p.dataoffsets) == 40000):
        raise Refuse(f'{os.path.basename(path)}: not the expected 40000 x 40000 uint8 LZW one-row-per-strip raster')
    scale = p.tags['ModelPixelScaleTag'].value; tie = p.tags['ModelTiepointTag'].value
    if not (abs(scale[0] - PIX) < 1e-12 and abs(scale[1] - PIX) < 1e-12 and tie[3] == west and tie[4] == top):
        raise Refuse(f'{os.path.basename(path)}: georeferencing is not 0.00025 degrees from ({west}, {top})')
    return tf, p

def hansen(hdir):
    import numpy as np
    man = json.load(open(os.path.join(hdir, 'manifest.json')))
    if man.get('state') != 'complete': raise Refuse('the Hansen download is not complete')
    for f, (pin, _, _) in HANSEN.items():
        p = os.path.join(hdir, f)
        if not os.path.isfile(p): raise Refuse(f'{f} is missing')
        if sha256_file(p) != pin: raise Refuse(f'{f} does not match its pinned sha256')
    acc = {c: {'nodata_m2': 0.0, 'land_m2': 0.0, 'water_m2': 0.0, 'treecover30_m2': 0.0, 2007: 0.0, 2008: 0.0, 'pixels_loss': {2007: 0, 2008: 0}, 'loss_not_counted': 0} for c in CELLS}
    t0 = time.monotonic()
    for tile, top, rows in (('10S_020E', -10, range(32000, 40000)), ('20S_020E', -20, range(0, 8000))):
        bands = {b: open_band(os.path.join(hdir, f'Hansen_GFC-2025-v1.13_{b}_{tile}.tif'), top, 20) for b in ('lossyear', 'treecover2000', 'datamask')}
        fh = {b: open(os.path.join(hdir, f'Hansen_GFC-2025-v1.13_{b}_{tile}.tif'), 'rb') for b in bands}
        for r0 in range(rows.start, rows.stop, BLOCK):
            block = {}
            for b, (tf, p) in bands.items():
                arr = np.empty((min(BLOCK, rows.stop - r0), 32000), dtype=np.uint8)
                for k in range(arr.shape[0]):
                    r = r0 + k; fh[b].seek(p.dataoffsets[r]); seg = p.decode(fh[b].read(p.databytecounts[r]), r)[0]
                    seg = np.asarray(seg).reshape(-1)       # tifffile's own strip decoder: exactly one row (a raw LZW decode can run a few bytes past the strip)
                    if seg.size != 40000 or seg.dtype != np.uint8: raise Refuse(f'{b} {tile} row {r} decoded to {seg.size} values')
                    arr[k] = seg[:32000]
                block[b] = arr
            dm, tc, ly = block['datamask'], block['treecover2000'], block['lossyear']
            if dm.max() > 2: raise Refuse(f'datamask value {int(dm.max())} in {tile}')
            if ly.max() > 25: raise Refuse(f'lossyear value {int(ly.max())} in {tile}')
            if tc.max() > 100: raise Refuse(f'treecover2000 value {int(tc.max())} in {tile}')
            for k in range(dm.shape[0]):
                r = r0 + k; lat_top = top - r * PIX; a = zone_area_m2(lat_top - PIX, lat_top, PIX)   # one pixel's area in this row
                for ci, c in enumerate(CELLS):
                    sl = slice(ci * 16000, (ci + 1) * 16000); d = dm[k, sl]; t = tc[k, sl]; l = ly[k, sl]
                    land = d == 1; tc30 = land & (t >= THRESHOLD)
                    A = acc[c]
                    A['nodata_m2'] += a * int((d == 0).sum()); A['land_m2'] += a * int(land.sum()); A['water_m2'] += a * int((d == 2).sum())
                    A['treecover30_m2'] += a * int(tc30.sum())
                    for code, yr in LOSS_YEARS.items():
                        n = int((tc30 & (l == code)).sum()); A[yr] += a * n; A['pixels_loss'][yr] += n
                    A['loss_not_counted'] += int((((l == 7) | (l == 8)) & ~tc30).sum())
        for b in bands: bands[b][0].close(); fh[b].close()
    secs = round(time.monotonic() - t0, 1)
    out, cons = {}, {}
    for c in CELLS:
        A = acc[c]
        cell_area = zone_area_m2(S, N, 4)
        total = A['nodata_m2'] + A['land_m2'] + A['water_m2']
        cons[c] = {'cell_area_km2': round(cell_area / 1e6, 3), 'mask_sum_km2': round(total / 1e6, 3), 'relative_difference': abs(total - cell_area) / cell_area}
        if cons[c]['relative_difference'] > 1e-9: raise Refuse(f'{c}: land + water + no-data area does not equal the cell area')
        out[c] = {'land_km2': round(A['land_m2'] / 1e6, 1), 'water_km2': round(A['water_m2'] / 1e6, 1), 'nodata_km2': round(A['nodata_m2'] / 1e6, 1),
                  'treecover2000_ge30_km2': round(A['treecover30_m2'] / 1e6, 1),
                  'loss_ha': {str(y): round(A[y] / 1e4, 1) for y in (2007, 2008)}, 'loss_pixels': {str(y): A['pixels_loss'][y] for y in (2007, 2008)},
                  'loss_2007_2008_pixels_not_counted': A['loss_not_counted']}
    union = {k: round(sum(out[c][k] for c in CELLS), 1) for k in ('land_km2', 'water_km2', 'nodata_km2', 'treecover2000_ge30_km2')}
    union['loss_ha'] = {y: round(sum(out[c]['loss_ha'][y] for c in CELLS), 1) for y in ('2007', '2008')}
    union['loss_pixels'] = {y: sum(out[c]['loss_pixels'][y] for c in CELLS) for y in ('2007', '2008')}
    return {
        'product': 'Hansen/UMD/Google/USGS/NASA Global Forest Change, version 1.13 (2000–2025)',
        'what_is_counted': 'approximate mapped tree-cover loss area: pixels mapped as land, with tree cover in 2000 of at least 30 % (vegetation taller than 5 m), whose loss year is 2007 or 2008',
        'years': [2007, 2008], 'threshold': 'tree cover in 2000 ≥ 30 %',
        'mismatch': 'Mapped tree-cover loss in the calendar years 2007 and 2008; these years extend beyond the recorded journey.',
        'union': union, 'by_cell': out,
        'cautions': ['A relative indicator, not a measured total: the authors say definitive area estimates should not be made from pixel counts.',
                     'Years before 2011 have not been reprocessed with the newer method; these values are not comparable with later years or with the corridor.',
                     'Gross loss (stand replacement or forest to non-forest), not deforestation, net loss or a cause.',
                     'No-data area is reported separately and is never counted as zero loss.'],
        'method': {'pixel_area': 'each row\'s WGS84 ellipsoidal area from the raster\'s own georeferencing (0.00025 degrees, tile corners 20 E 10 S and 20 E 20 S)',
                   'assignment': 'pixel centres, half-open cells; rows 32000–39999 of tile 10S_020E and 0–7999 of 20S_020E, columns 0–31999',
                   'area_reference': area_reference(), 'mask_conservation': cons, 'decode_seconds': secs},
        'provenance': {'release': 'GFC-2025-v1.13', 'files': {f: v[0] for f, v in HANSEN.items()}, 'licence': 'CC BY 4.0', 'credit': 'Source: Hansen/UMD/Google/USGS/NASA'},
    }

def build(a):
    jf, first, last = journey_facts(a.journey)
    ctx = {'schema': 1, 'id': 'zebra-botswana-Z3866-context-R1', 'heading': 'Historical regional land context', 'journey': jf,
           'region': {'cells': CELLS, 'bounds': {'west': W, 'south': S, 'east': E, 'north': N}, 'area_km2_hub_grid': sum(HUB_AREA_KM2.values()),
                      'rule': 'the 4-degree cells of the hub grid that contain a retained displayed fix; half-open; no cell inferred between fixes'},
           'fires': fires(a.firms, first, last), 'loss': hansen(a.hansen),
           'closing': 'These are regional observations. They do not show where the zebra went, what it encountered or how it was affected.',
           'builder': {'version': BUILDER_VERSION}}
    ctx['loss']['method'].pop('decode_seconds')                      # timing goes to stderr, not into the pinned file
    return (json.dumps(ctx, indent=1, ensure_ascii=False, sort_keys=False) + '\n').encode()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--firms', required=True); ap.add_argument('--hansen', required=True)
    ap.add_argument('--journey', required=True); ap.add_argument('--out', required=True); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(); t0 = time.monotonic()
    try: data = build(a)
    except Refuse as e: print('REFUSED:', e); return 1
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(f'built in {time.monotonic() - t0:.1f} s; peak resident memory {peak / 1024:.0f} MB; {len(data)} bytes; sha256 {hashlib.sha256(data).hexdigest()}', file=sys.stderr)
    if a.check:
        same = os.path.exists(a.out) and open(a.out, 'rb').read() == data
        print('CHECK OK: identical' if same else 'CHECK FAILED: the file on disk differs from a fresh build'); return 0 if same else 1
    with open(a.out, 'wb') as f: f.write(data)
    print('WROTE', a.out); return 0

if __name__ == '__main__':
    sys.exit(main())
