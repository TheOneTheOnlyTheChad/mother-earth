# Request box

- CRS `EPSG:900003`, defined by EUMETView's own viewer configuration (`https://view.eumetsat.int/assets/data/config.json`, sha256 `e4f8369e…3a8a`, read 19 Nov 2026) as "GEOS: MSG FES, MTG FD", `+proj=geos +h=35785831.0 +lon_0=0`.
- Box: −5,500,000 to 5,500,000 m on both axes; 2,048 × 2,048 px, so 5,371 m per pixel at the centre of the disk.
- Measured from the three 256 × 256 check images (transparent where there is no Earth): opaque share 0.7644 to 0.7645 of the frame; no opaque pixel on any frame edge. A disk of that area has a diameter of 0.9866 of the frame width, about 10,853 km across in projection units, leaving about 0.7% of the frame (about 14 px of 2,048) clear on each side.
- The hub does not hard-code this share. Each run measures its own check image and refuses a picture whose disk touches the edge.
