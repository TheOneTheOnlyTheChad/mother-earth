# Earth from Space test fixtures

Three real frames of EUMETSAT "GeoColour RGB - MTG - 0 degree" (collection EO:EUM:DAT:0913), read from the public EUMETView map
service on 19 Nov 2026 between 17:33 and 17:35 UTC in the browser pane. Contains modified EUMETSAT Meteosat data 2026. Licence:
CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The night-time background inside the product is NASA's Black Marble.
Unchanged files as served. Used only by the test suites and the local preview; the site does not serve them.

Request (all six): `https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&styles=&layers=mtg_fd:rgb_geocolour&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000`
then `&width=2048&height=2048&format=image/jpeg&bgcolor=0x0B1016&time=<T>` or `&width=256&height=256&format=image/png&transparent=true&time=<T>`.
Every response carried `Warning: 99 Nearest value used: time=<T>.000Z ISO8601 (mtg_fd:rgb_geocolour)`.

| File | Frame time (T) | Bytes | sha256 |
|---|---|---|---|
| day.jpg | 2026-11-19T11:00:00Z | 676,253 | 781aa8a233090cac58f24a86052d4059e5634e608a0aa15c35edc6ad24275ed0 |
| day.png | 2026-11-19T11:00:00Z | 132,460 | 2e72045f0a198ff6f639b3d86cd06826e722a6ad7ae40c8b14e62e45c12be8a1 |
| night.jpg | 2026-11-19T00:00:00Z | 544,930 | e6393c1f9729b6c04853c56a98a03ffa48899103c434f2da162d4cbad7cf253e |
| night.png | 2026-11-19T00:00:00Z | 117,319 | ad76111e135cdd8e64c154d80de275e12ed41df801dac549c5e177ab325aa32c |
| dusk.jpg | 2026-11-19T16:50:00Z | 654,042 | 3af704935eae9da360aa2a47adcb8c1faa66ab202ad6d52db8af8f6f5a1d3fbe |
| dusk.png | 2026-11-19T16:50:00Z | 130,041 | 69c2ca8bac23583ed1e256a33dd8dbb562f4caf39a042b4b1f703d9f02e58b88 |

## Derived 1,536 px inputs (not as served)

`day-1536-derived.jpg`, `night-1536-derived.jpg`, `dusk-1536-derived.jpg` are the three frames above **resized here** to 1,536 px (Pillow 12.3.0,
Lanczos, progressive JPEG, quality 88, 4:2:0) on 20 Nov 2026. They are not what EUMETView returns for a 1,536 px request. They are used only
by `phase1/evprobe.test.mjs` and the local workerd run, to exercise the probe's code path at that size. Evidence about EUMETView's own
1,536 px rendering is in `reviews/evidence/2026-11-20-earth-from-space-probe/validation-1536-real-frames.json` (six real frames, validated
in the browser pane; no picture saved).

| File | From | Bytes | sha256 |
|---|---|---|---|
| day-1536-derived.jpg | day.jpg | 595,064 | 4625662042f293b6585de7939d924900afa1bf56da8296bc3015613ec81b9651 |
| night-1536-derived.jpg | night.jpg | 494,972 | 335bc3e2a81ea1425047c976b382e1eb729523ded274270019a80386da91928d |
| dusk-1536-derived.jpg | dusk.jpg | 577,801 | f219f6ec295fe930ee4a4585753c32a48e354a38955e0271724b39940fbf3364 |
