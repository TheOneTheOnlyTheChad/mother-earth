# Animals journey context — H1/H2 extractor recheck

25 Nov 2026 · GPT · `animals-journey-context-proposal` at `0fce44a`

**PASS. H1 and H2 are independently closed.** This clears the reviewed zebra extractor for Chad's bounded execution go. It is not a claim that live extraction has succeeded, nor permission to publish context, deploy, merge or extract the corridor.

## Reviewed identities

Read evidence rev 1.3 §4c, the replacement extractor/verifier/controls and the old-versus-new record. Independently calculated these hashes from the runnable Mac packet:

| File | SHA256 |
|---|---|
| journey_context_firms_fetch.py | `62e29621bdb2637a7c60a5de6955f316931f9710a18ef48fccb716b6a5b4a752` |
| journey_context_verify.py | `4bdaf0a7d4cc06dc86b95d9b2a3bdbd517d6387b696b0a1f7fe9686d9468ab00` |
| journey_context_firms_fetch.test.py | `3f7ade9c8793267cdfc7b73620ed44519d15c1eee4f0937f3a720f4b9e621cd9` |
| fixtures/firms-missing-data-2026-11-25.json | `8b9c8d5d1ff198ee84538a38ccc10e3a7870f17806b79ff1735ac3d780b282be` |

## Independent results

Ran the supplied `python3 -I journey_context_firms_fetch.test.py` on the Mac: **72 passed, 0 failed**. This used a loopback stand-in, temporary fake-key folders and no FIRMS requests. The fixture parses to 171 standard-data rows and no listed MODIS gap date in the zebra interval. That is a result from the frozen fixture, not a new provider reading.

Also reran my four original reproductions separately:

| Case | Independent replacement result |
|---|---|
| Attributed MODIS row after a plain row | Correctly lists `2008-03-01` |
| `2008-02-31` | Parser rejects it as an impossible calendar date |
| Only `area` changed to `0,0,4,4` in a successful stand-in run | Verifier refuses it |
| Only `source` changed to `VIIRS_SNPP_SP` | Verifier refuses it |

The untouched successful stand-in run remains usable. I inspected the HTMLParser implementation and its real-date/known-satellite checks: supported attributes are read; unsupported/nested structure, malformed dates and unknown labels are refused rather than silently discarded. The extractor translates parser rejection into an invalid run. **H1 closed.**

I inspected the verifier's independently held product/region/date/window plan and approved extractor hash. It checks planned filenames and local paths, hashes and CSV row counts, successful request records, ordered key-status readings including the final one, and saved availability/gap summaries re-parsed from their source files. Malformed record shapes are returned as unusable. The old “intact file hashes imply correct extraction” gap is closed for the reviewed contract. **H2 closed.**

The supplied old-versus-new record is consistent with my earlier independently observed failures and these new results. I did not rerun the entire new suite against the old implementation; it stops early on the absent old extractor pin, so that early stop must not be represented as every new control individually tested against old code.

## Execution boundary

The accepted plan is zebra only: 73 MODIS_SP date windows, 81 planned HTTP requests including status/availability/gap-list requests, serial spacing, no automatic retries, bounded responses/cache and explicit complete/stopped/invalid outcome. About 755 transactions remains a sample-based estimate. Key status is sampled between bursts: it does not reserve 3,000 transactions continuously or guarantee the live layer cannot be affected by other concurrent key use.

Chad may now give the concrete go to run this exact extractor and download the previously accepted six Hansen files, about 977 MB, for the private zebra branch build. Claude should provide the exact runnable command, script identity and destination before Chad runs it. The verifier must accept the resulting real cache before building. A stop or invalid run is evidence to inspect, not permission to loosen checks or retry automatically.

The six-file raster selection, labelled 30% year-2000 canopy threshold and collapsed monthly table stay accepted as in the previous review. Whole files remain private; offline processing must still be bounded in memory and the built candidate must supply its measured resource use and aggregation/area/coverage checks. Do not treat this extractor pass as a completed Hansen decoding or scientific aggregation review.

If Chad gives a combined extraction/download/branch-build go, no further proposal-only loop is needed. Bring the resulting bounded candidate back for normal GPT review before any release approval. Corridor extraction, IUCN/reply-dependent features, soil work and hub changes remain outside this go. Preserve the current Timeline R4, Nature and Animals pins on fresh main.

No real key was read and no provider request, tile download, page change, production action or repository edit was made by GPT in this recheck.
