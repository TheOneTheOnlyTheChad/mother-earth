# GIBS backdrop — stage 1 bench (one-off, read-only), 8 Nov 2026 — for GPT

**Chad's go (8 Nov 2026):** one-off, read-only bench of `docs/GIBS-FALLBACK-PROPOSAL.md` rev 3 **stage 1 only**: same-date NOAA-21 vs NOAA-20, **no threshold *T***. Checks: (1) PNG served; (2) 512×256 PNG vs the page's 2048×1024 JPEG, including ranking; (3) decoder works + CPU, local/browser vs Worker kept apart.
**Not done / not authorised:** shadow week or recurring collection; threshold selection; day-before fallback; implementation branch; Worker deployment; new resources; schedules; production or page change. Bench code is a temporary research tool (evidence folder only; not in `phase1/`, not imported anywhere).

**Evidence:** `reviews/evidence/2026-11-08-gibs-stage1-bench/` — `rows.json` (28 measurements), `summary.json` (per-date comparison), `alpha-probe.json`, `timing.json`, `bench-node.TEMPORARY.mjs` (decoder used in both the pane and Node).
`rows.json` columns: day, sat, measured_at, png status, png content-type, png bytes, png near_black, png no_data, png band pixels, png decode ms (pane, single pass), own-vs-browser decoder mismatches, png pixels with alpha 255, jpg status, jpg content-type, jpg bytes, jpg near_black, jpg band pixels.

## Method
- **Where:** Claude desktop app browser pane (Chromium 152 on Chad's Mac), a plain-text github.io tab (`app.js?gibs-bench-s1`, no page scripts run). Run 2026-11-08 **15:55:13–15:59:11 UTC**. The pane was hidden at the start and displayed when checked at ~15:57; the timing pass (below) ran with the pane visible (`document.visibilityState = visible`).
- **Requests (GIBS WMS, sequential, `cache: no-store`, 25 s abort):** `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&CRS=EPSG:4326&BBOX=-90,-180,90,180&TIME=<day>&LAYERS=<layer>` with
  - **PNG:** `FORMAT=image/png&WIDTH=512&HEIGHT=256`;
  - **JPEG reference:** `FORMAT=image/jpeg&WIDTH=2048&HEIGHT=1024` (exactly the page's request).
  - Layers `VIIRS_NOAA20_CorrectedReflectance_TrueColor`, `VIIRS_NOAA21_CorrectedReflectance_TrueColor`. Dates **25 Oct – 7 Nov 2026** (14 dates × 2 satellites × 2 formats = 56 images; the 7 Nov PNGs were requested twice, once in a format probe at 15:55:13), plus an alpha probe of 8 and 9 Nov (4 PNGs). Total ≈ 60 GIBS requests, one time.
- **Measure (proposal §2, §5):** band **66.5°S–66.5°N** by pixel-row centre latitude; near-black = R, G, B all < 12; no-data = alpha 0 (PNG only); dark-area score = (near_black + no_data) / band pixels; near-black share reported separately.
- **PNG decoder (proposal §5):** parse chunks, check IHDR (512×256, 8-bit, colour type 6, non-interlaced), inflate IDAT with `DecompressionStream('deflate')`, un-filter (filters 0–4), byte cap before decoding, decompressed-size cap = (4×W+1)×H. **JPEG** decoded by the browser (`createImageBitmap` → `OffscreenCanvas`), as in the 8 Nov method.
- **Cross-check:** every PNG also decoded by the browser (`premultiplyAlpha: 'none'`, `colorSpaceConversion: 'none'`) and compared pixel by pixel with the bench decoder.

## Results

### 1. Does GIBS serve the layers as PNG? — **Yes**
- All 30 PNG requests: **HTTP 200, `image/png`**, valid signature, **512×256, 8-bit RGBA (colour type 6), non-interlaced**, chunks IHDR/IDAT/IEND only.
- Size **202–287 KB** for full days (median ≈ 282 KB). Not "small": the byte cap must allow ≥ ~300 KB (a 2 MB cap was used here). The page's JPEG is ~375–576 KB.
- **Alpha carries no information in any image measured:** all 131,072 pixels had alpha 255 in all 30 PNGs, including **9 Nov (no imagery yet): HTTP 200, 1,204 bytes, 100 % opaque black** in both layers. The partial day 8 Nov scored 53.5 % (N20) / 49.9 % (N21), also all opaque.
  - **Consequence for §5:** GIBS signals missing imagery as **opaque black, not transparency**, in these requests. The "no-data" count is always 0, so the **dark-area score equals the near-black share** in practice, and **"all no-data → ineligible" cannot be detected via alpha**. A different eligibility signal would be needed (e.g. near-black share ≈ 100 %, or a response far below normal size); that is a design decision for review, not chosen here.

### 2. 512×256 PNG vs 2048×1024 JPEG — **close in value; ranking agreed on 12 of 14 dates**
| Day | N20 PNG | N21 PNG | N20 JPG | N21 JPG | PNG gap (pp) | JPG gap (pp) | Lower: PNG / JPG |
|---|---:|---:|---:|---:|---:|---:|---|
| 25 Oct | 0.062 | 0.082 | 0.190 | 0.279 | 0.021 | 0.089 | N20 / N20 |
| 26 Oct | 0.308 | 0.096 | 0.414 | 0.302 | 0.213 | 0.112 | N21 / N21 |
| 27 Oct | 0.315 | 3.588 | 0.405 | 3.789 | 3.273 | 3.384 | N20 / N20 |
| **28 Oct** | 0.361 | 0.302 | 0.328 | 0.462 | 0.059 | 0.134 | **N21 / N20 — flip** |
| **29 Oct** | 0.692 | 0.475 | 0.543 | 0.614 | 0.217 | 0.071 | **N21 / N20 — flip** |
| 30 Oct | 1.071 | 0.573 | 0.894 | 0.586 | 0.499 | 0.308 | N21 / N21 |
| 31 Oct | 1.607 | 0.828 | 1.520 | 0.781 | 0.779 | 0.739 | N21 / N21 |
| 1 Nov | 1.728 | 1.143 | 1.657 | 0.997 | 0.585 | 0.660 | N21 / N21 |
| 2 Nov | 1.841 | 1.578 | 1.723 | 1.598 | 0.263 | 0.125 | N21 / N21 |
| 3 Nov | 2.171 | 1.914 | 1.970 | 1.839 | 0.257 | 0.132 | N21 / N21 |
| 4 Nov | 2.360 | 5.826 | 2.277 | 5.840 | 3.466 | 3.563 | N20 / N20 |
| 5 Nov | 13.604 | 35.323 | 13.532 | 35.233 | 21.719 | 21.701 | N20 / N20 |
| 6 Nov | 23.467 | 5.143 | 23.486 | 5.162 | 18.324 | 18.324 | N21 / N21 |
| 7 Nov | 7.109 | 2.871 | 6.899 | 2.807 | 4.238 | 4.093 | N21 / N21 |
(Values = dark-area score, % of band pixels; with no-data always 0 this equals the near-black share. JPEG has no alpha.)
- **Per-image difference PNG vs JPEG:** max **0.21 pp**, median **0.09 pp** (28 images).
- **Flips:** 2 of 14 dates (28, 29 Oct), both where the two satellites were within **0.22 pp** in either format. Every date with a gap > 0.25 pp agreed, including all four days with large dark areas (27 Oct, 4–7 Nov).
- 25 Oct agreed with a PNG gap of only 0.021 pp — agreement there is not evidence that small gaps are reliable.
- **Cross-check with the 8 Nov evidence** (`reviews/evidence/2026-11-08-gibs-black-share.json`, JPEG read 03:56–03:57 UTC):
  - **4–6 Nov: same byte sizes** (hashes not compared) and the same 66.5°S–66.5°N values to the first decimal — the method reproduces.
  - **7 Nov: the images changed between the two reads.** N20 514,913 → 525,797 B, near-black **8.8 % → 6.9 %**; N21 544,843 → 546,723 B, 2.9 % → 2.8 %. *Observation:* the 7 Nov layers changed between 03:56 and 15:55 UTC on 8 Nov. The N21 image was already 546,723 B at 12:05:40 UTC (STATUS, noon-rollover check), so N21's change landed before noon; N20's timing is unknown. Ranking unchanged (N21 lower both times).
  - Note: `IMG_DAY` = now − 36 h, so 7 Nov was the page's date from 12:00 UTC 8 Nov; the 03:56 read was before that and the 15:55 read after, so it is not known whether the change landed before or after the page started showing 7 Nov. This supports the proposal's plan to re-measure a few times after the decision rather than once (§4); it does not show how late fill-in typically is.

### 3. Decoder and CPU
- **Correctness:** the bench decoder's output matched the browser's own PNG decode **exactly** on all 30 PNGs (0 alpha mismatches, 0 RGB mismatches). The Node run reproduced the browser's counts for the timed file (near-black 2,793 of 97,280).
- **Bounded-decoding negative controls (pane):** wrong expected dimensions → rejected; byte cap below file size → rejected; corrupted signature → rejected; truncated file → `DecompressionStream` error; an XML service-exception body → rejected ("not png").
- **Timing (decode + band count, per image):**
  | Where | What | min | median | p90 | max |
  |---|---|---:|---:|---:|---:|
  | Browser pane (Chromium 152, Chad's Mac, visible) | wall, 40 runs, 277 KB file | 2.7 ms | 3.2 ms | 5.8 ms | 9.3 ms |
  | Node v22.23.4 (workspace, 2 vCPU) | wall, 60 runs | 7.6 ms | 10.0 ms | 15.6 ms | 26.8 ms |
  | Node v22.23.4 (workspace) | process CPU, 60 runs | 7.7 ms | 10.4 ms | 16.7 ms | 33.0 ms |
  - First Node run 23.9 ms (warm-up). Single decode passes during the main run: 6.5–17.4 ms (pane possibly hidden for the first rows).
  - **These are local measurements, not Worker measurements.** Node's process CPU may include zlib work on other threads.
- **Cloudflare Worker CPU: NOT MEASURED.** It needs the decoder running in a Worker (a separate bench Worker or the hub) plus a read of invocation telemetry (START-HERE §4a). That is a deployment; it was left unverified as instructed. *Interpretation only:* ~10 ms per image locally suggests a two-image decision is small next to today's firms ticks (100–300 ms), but **this is not evidence about Worker CPU**.

## Recommendation (for GPT review; nothing adopted)
1. **PNG route is viable** for stage 1: served, decodable with no new dependency, and the bench decoder is exact against the browser. The JPEG-decoder fallback (§5) is not needed on this evidence.
2. **Tie margin (proposal §3):** in this sample, flips happened only where the satellites were within 0.22 pp; per-image PNG–JPEG differences reached 0.21 pp. A margin **of at least ~0.25 pp** would have turned both flips into "tie → NOAA-21 kept", and no date with a gap above 0.25 pp disagreed. **Provisional, from 14 dates; Chad/GPT set it.** (The shadow record, if ever authorised, is what would test it over time.)
3. **No-data handling needs a revision of §5:** alpha is never used by GIBS here; missing imagery arrives as opaque black (9 Nov: 1,204 bytes, 100 %). Proposal text should say the dark-area score equals the near-black share for these layers, and an ineligibility rule needs another signal (e.g. share ≈ 100 % or an abnormally small response). To be chosen in review.
4. **Byte cap:** full-day PNGs were 202–287 KB; a cap around **512 KB** would leave headroom (to be set in review).
5. **Worker CPU remains unverified** until a deployment is separately authorised.

## Limitations
- One run, 14 dates (25 Oct – 7 Nov), images re-requested on 8 Nov; GIBS layers can change after the fact, so values for a date may differ from what the page showed on that date.
- 66.5°S–66.5°N fixed band; illumination not equalised (proposal §2).
- Browser timings are from Chad's Mac in the Claude app pane; Node timings from the workspace container; neither is a Worker.
- The alpha finding covers these two layers, this request form and these dates only.
- Ranking agreement is measured against the page's JPEG at 2048×1024, which is itself a downsampled render, not "ground truth".
