# Met source pin (Phase 0 Arts recovery, 7 Nov 2026)
- Repository: https://github.com/metmuseum/openaccess — commit `e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea` ("Open Access csv", 2026-11-02T08:05:36-05:00), = HEAD of master at 12:16 UTC 7 Nov.
- File: `MetObjects.csv` (Git LFS). LFS pointer: `oid sha256:7adc37e41923f9f8179e8ed30d9312e6148da54c4468f373c162afc89d5cd0fe`, `size 340864677`.
- Retrieved: https://media.githubusercontent.com/media/metmuseum/openaccess/e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea/MetObjects.csv, 2026-11-07T12:16:43Z → 12:16:56Z (cloud workspace). HTTP 200, Content-Length 340864677, ETag = oid.
- Verified: local sha256 `7adc37e41923f9f8179e8ed30d9312e6148da54c4468f373c162afc89d5cd0fe` = LFS oid; 340,864,677 B; 503,073 rows.
- **Same file version as the lost 7 Nov samples** (their recorded "etag 7adc37e4…" is this oid). The earlier samples' scripts and outputs were not recovered, so this is new recovery evidence, not a reproduction.
- Not committed (340 MB): re-fetch from the pinned URL above and check the hash.
- Run: `python3 -I arts_recovery.py MetObjects.csv <outdir>` (Python 3.13, pycountry 26.2.16 as the ISO 3166 reference). Sample `met-recovery-sample-R1.json` sha256 `c4046fd373ff1afe1cbf4b2565c41a32d3e059c13dd2256a57b6a50253758762`; results `met-recovery-results-R1.json` sha256 `6304a84835610d1f94a434ebf9cc17c670dc7c11a4bd06b8ae4efdf4c18f5e88`.
- Sample content: Met collection metadata, CC0. Media excluded (no image field used, nothing fetched).
