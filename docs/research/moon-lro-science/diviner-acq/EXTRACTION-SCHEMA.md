# Diviner GCP lossless `tbol` extraction — schema (R1)

26 Nov 2026 · Claude · for MOON-DIVINER-PROPOSAL rev 2 §7.4, D8 (a), Chad's choice of 26 Nov · GPT rev 2 recheck note 4

**What it is.** For each GCP band file `global_cumul_avg_cyl_<band>_002.tab` (`LRO-L-DLRE-5-GCP-V1.0`), the `tbol` field of every record, losslessly. It is **not** the original ASCII file. It does **not** hold the coordinate fields or the channel temperatures t3–t9: a future channel feature would need to fetch the source again. The coordinates are not stored because the build checks that they follow the exact sequence below (`gcp_stream.js`); any record that does not stops the build.

**File:** `gcp-tbol-x10000-<band>-R1.i32.gz` = gzip of the raw extraction. It is kept on Chad's Mac in `Documents/Mother Earth/_source-data/moon-lro-science-diviner-gcp/`, never in the repository.

**Raw layout** (after gunzip):
- 1,382,400 values, **signed 32-bit little-endian integers**, 5,529,600 bytes, no header.
- Order = source record order: **longitude slowest** (720 centres, −179.75 to +179.75 in 0.5° steps; index i ↔ −179.75 + 0.5 i), then **latitude ascending** (20 centres per band, from the band's southern edge + 0.25° in 0.5° steps), then **local time fastest** (96 bins; index k ↔ bin centre 0.125 + 0.25 k h).
- The value for (i, j, k) is at index `i × 1920 + j × 96 + k`.
- **Value = `tbol` × 10000**, exact: the source prints at most 4 decimals, and the parser reads the decimal text into an integer without floating point.
- **Sentinels:** −99,990,000 = source `-9999` (empty bin); −99,980,000 = source `-9998` (invalid).
- Every other value v satisfies 10,000 < v < 4,500,000 (1 K < `tbol` < 450 K, our plausibility bounds); anything else stops the build.

**Provenance, per band:** one line of `checkpoints.jsonl` (beside this file) records:
- the source URL, bytes and `Last-Modified`
- the archive MD5 from `urn-nasa-pds-lro_diviner_derived1.md5` and the MD5 computed while streaming
- the source SHA-256
- the header line's text and SHA-256
- record and sentinel counts; `tbol` minimum and maximum
- the tooling versions and SHA-256s (`mehash.js`, `gcp_stream.js`, `pane_job.js`) and the repository commit they came from
- the extraction's raw and gzip SHA-256 and sizes
- the path where it is stored, and the SHA-256 re-read there

**A band's extraction counts as retained only when** the file exists at that path and its re-read SHA-256 matches the checkpoint.

**Reading it** (Python): `numpy.frombuffer(gzip.open(p).read(), '<i4').reshape(720, 20, 96)` for [longitude, latitude, local time]; divide by 10000 for kelvin, after masking both sentinels.
