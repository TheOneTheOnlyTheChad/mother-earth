#!/usr/bin/env python3
"""Builds assets/coast-50m.bin, the coastline outline drawn above the Wind sheet.
Source: Natural Earth 1:50m coastline, public domain. File ne_50m_coastline.geojson from
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_coastline.geojson
  sha256 271f1c4c1908312bac6b29d158ea1356544beafc129f260005300913aa5ea283 (fetched 16 Nov 2026; 1,640,858 bytes)
Usage: build-coast.py <ne_50m_coastline.geojson> <out.bin>
What it does: drops lines whose bounding box is under 0.4 degrees corner to corner; thins each line (Douglas-Peucker, 0.02 degrees);
rounds to 0.01 degrees; writes "MECOAST1", line count (u32), each line's point count (u32), then lon,lat pairs as int16 hundredths (LE)."""
import json, struct, math, hashlib, sys
SRC_SHA = '271f1c4c1908312bac6b29d158ea1356544beafc129f260005300913aa5ea283'
raw = open(sys.argv[1], 'rb').read()
if hashlib.sha256(raw).hexdigest() != SRC_SHA: sys.exit('source file is not the pinned one')
lines = []
for f in json.loads(raw)['features']:
    g = f['geometry']
    if g['type'] == 'LineString': lines.append(g['coordinates'])
    elif g['type'] == 'MultiLineString': lines += g['coordinates']
def dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy); md = 0; mi = -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if L > 0 else math.hypot(px - ax, py - ay)
            if d > md: md = d; mi = i
        if md > tol: keep[mi] = True; st += [(a, mi), (mi, b)]
    return [p for p, k in zip(pts, keep) if k]
out = []
for l in lines:
    xs = [p[0] for p in l]; ys = [p[1] for p in l]
    if math.hypot(max(xs) - min(xs), max(ys) - min(ys)) < 0.4: continue
    q = []
    for x, y in dp([(p[0], p[1]) for p in l], 0.02):
        t = (max(-18000, min(18000, round(x * 100))), max(-9000, min(9000, round(y * 100))))
        if not q or q[-1] != t: q.append(t)
    if len(q) >= 2: out.append(q)
b = bytearray(b'MECOAST1'); b += struct.pack('<I', len(out))
for l in out: b += struct.pack('<I', len(l))
for l in out:
    for x, y in l: b += struct.pack('<hh', x, y)
open(sys.argv[2], 'wb').write(b)
print(len(out), 'lines', sum(len(l) for l in out), 'points', len(b), 'bytes', hashlib.sha256(b).hexdigest())
