# Animals journey context — evidence and build-brief review

25 Nov 2026 · GPT · branch `animals-journey-context-proposal`, `2c19327`, evidence/brief rev 1.1

**Pilot evidence: PASS. Scientific/design direction: accepted with the clarifications below. Full extraction: hold for the narrow fetcher corrections and concrete script check before Chad runs it.** No repeat pilot, new product assessment or proposal-only revision loop is needed. No build, download or provider request was performed by this review.

## Independent checks

Read the evidence record, brief, pilot script and manifest from the Mac packet. Independently checked the private pilot files against all six request hashes: every response matched, including the two byte-identical 25–29 Oct downloads. Manifest SHA256 is `b948cb6ecd9a45385dad1d72a9bd8e7249066b72a4c354874a60834c2d0051d3`; packet script SHA256 is `91be1a2e05b940c965b33c6812881cbaecbd08f56c6ba0ce78879ca37d33a027`.

The two distinct sample windows contain 33 rows, all type 0, version string `6.03`, and all inside the stated region. The repeated download is evidence of repeatability for that response at that time, not a guarantee of permanent archive immutability. The manifest reports status 200 for all six requests and key usage 0 → 31; I did not rerun any request or read the key.

The 364-day inclusive date range needs 73 windows: 72 of five days and one of four. The basic 79-request arithmetic is correct for the listed schedule, but omits an end-of-run status reading after the final 13 windows. Add that reading and update the count to **80** if retaining the every-15-window schedule.

The earlier A–E corrections are substantially incorporated: fixed broad cells/areas, honest calendar-year mismatch, explicit satellite limitations, no-data mask, offline reproducibility, immutable context pin, no hub change and no unrelated pin movement. Implementation must preserve Timeline R4 and Nature's current pins on fresh main.

## Answers to evidence §7

### 1. Pilot, transaction budget and MODIS version

**Accept the pilot. Correct the resource claims before the full run.** The 31 transactions bound the combined pilot use during that observed interval. Assigning them all to three area requests gives an observed average upper estimate, not a proven maximum per future request. Thus about 755 is a conservative extrapolation from this sample, **not “worst case” or “at most”** for the full year. Nor does a small pilot establish that the live layer cannot be affected by a larger run sharing its key.

Declare an estimated transaction count, a separately enforceable stopping policy, and reserve for other key users. Record status and accounting-window information before each allowed burst and after the final burst; fail on unreadable status. A reset of the service's accounting window must not produce a negative usage figure or conceal further work. Do not promise a five-minute maximum: approximately 4–5 minutes is a typical estimate, while 60-second request timeouts can make it longer. Preserve the bounded request count, no retries and serial spacing.

**The `6.03` question is resolved for these rows.** NASA GIBS's official Python-usage documentation includes a VERSION ValueMap explicitly mapping `6.03` to **Collection 6 Standard processing**. The FAQ's current-collection statement does not override the downloaded historical row label. Accept “MODIS Collection 6 standard processing; file version 6.03” for this sample. Store version as text; do not convert it to a numeric value or label it Collection 6.1. If the full extraction contains other labels, retain them all and require a documented mapping or state their literal labels without inventing a collection meaning.

The selected count is **presumed vegetation-fire detections**, all confidence levels, Terra and Aqua combined—not a count of unique fires. Keep the type-0 and no-confidence-filter policies beside the value or in its immediately associated methodology. Missing or unknown type values in the now-frozen standard-processing schema must not silently broaden the count to all hotspots.

### 2. Whole tiles versus row reads

**Whole-file download is acceptable for the first zebra build**, subject to Chad accepting the stated roughly 976.6 MB transfer and the exact six-file manifest. A new range-reader/network path is not required simply to optimise this one bounded download. Reconcile exact byte lengths and supplied checksum metadata before download; store SHA256 after download. Report partial files as incomplete and verify all inputs before processing. Keep them private and out of the repository.

Downloading whole files does **not** justify loading whole rasters into memory. A 40,000² uint8 band alone is about 1.6 GB uncompressed. Stream/decode bounded rows/windows with a named memory budget; measure peak memory/runtime for the candidate. Validate CRS, tiepoint, scale, dimensions and alignment across all three bands and both tiles. Prove no seam omission/double count, geodesic area arithmetic and land/water/no-data area conservation. The WGS84 method needs a numerical reference check, not merely that label in metadata.

The report's four-row sample is useful format evidence, not whole-region validation. I did not independently fetch or decode Hansen tiles in this review.

### 3. Canopy threshold

**30% is an acceptable, fixed first-release choice for Chad to adopt**, with the current explicit year-2000 wording. It is a selection threshold, not a biological habitat definition or an optimisation based on how much loss appears. Keep “approximate mapped loss area”, calendar years 2007/2008, the temporal mismatch and the authors' area-estimation caution. Exclude no-data from valid zero. A small or zero result at that threshold is allowed and is not evidence of no environmental change.

Do not select a different threshold after inspecting the loss result just to create a more interesting number. An independently justified change would be a documented method revision.

### 4. Monthly display

**Accept total plus a collapsed 13-row monthly table** using a native accessible disclosure. Two part-months and eleven full months; this can be tested in the candidate without further design approval. Keep one count visible by default rather than permanently lengthening the card. Display the minute-rounded interval next to the total, and explain endpoint rounding in the disclosure. Monthly values must sum to the accepted total under identical filtering, clipping and deduplication rules. Do not replace incomplete months with zero.

## Narrow corrections required in the full extractor

The supplied pilot has already run successfully with readable status and valid data. These findings do not invalidate that observed run. They matter before growing it into the full extractor:

1. **Fail closed on budget status.** In the pilot, parsing failure sets `used = None`; the subsequent branch still continues. A missing/non-200/malformed key-status response must stop before availability or area work. Check the expected allowance and usage schema, not just whether something can be cast to an integer. An invalid availability response must also stop before extraction.
2. **Bound bytes during reading.** The pilot uses `r.read()` without a size bound. Implement the proposed 20 MB cache ceiling while streaming, including the current response and temporary files, not after writing a potentially oversized response. Have a bounded response/error-body size and always write an explicit incomplete manifest on failure.
3. **Validate actual CSV structure and values.** The pilot's success test is only a `latitude,longitude` prefix, despite declaring a fuller MODIS_HEADER constant. The full extractor must require the frozen fields and parse CSV, dates, HHMM ranges, satellite/instrument, coordinates, type and version explicitly. Padding `919` is correct; padding an invalid `2460` does not make it a valid time. Header-only valid CSV may represent zero; HTML with a plausible prefix does not.
4. **Make provenance agree with stored bytes.** The pilot hashes the response before decoding/redaction, then saves decoded/redacted text. Its actual sample hashes all match, so no discrepancy occurred. In future, if redaction or decoding would change a source response, stop and retain only a redacted failure record; do not pass that output off as the hashed raw input.
5. **Close the run explicitly.** Add final status read, request/byte/window completion checks and a manifest field distinguishing complete, stopped and invalid. Offline building must refuse an incomplete extraction, missing window, wrong input hash or missing gap-list provenance. A failed run must not look successful because its last line says “Done”.

Provide focused offline controls for these conditions before Chad runs the full extractor. No network rerun is required to demonstrate them. Return that small script/check packet for targeted GPT review; do not start the full extraction on the strength of the pilot's pass alone.

## Small record/build clarifications

- The failed/unknown gap-list state must remain distinct from an empty, valid list. Freeze its source/hash/retrieval date and Terra/Aqua interpretation. “No dates listed in the provider's missing-data table” is safer than implying all local satellite observations were available.
- Correct the half-open-boundary prose: a point on the internal 24°E boundary is assigned to the second selected cell and remains inside the union. Only the outer north/east bounds fall outside. A centre offset of 0.000125° is **half** a 0.00025° pixel, not a quarter. The geometric algorithm/tests should be authoritative.
- Deduplicate truly identical records. If rows share the proposed identity but conflict in other fields/version/type, flag the conflict rather than silently retaining the first one.
- The evidence §6 sentence “fires still depend on the pilot” is superseded by §4a; mark it so. The evidence step should say six **files**, not six distinct geographic tiles: two zebra tiles times three bands.
- Keep parsed JSON/CSV manifests free of secrets, keyed URLs and precise raw detections. The output context remains aggregates only; the private cache does not go into public evidence.

## Sources and next step

Official NASA pages independently opened on 25 Nov:

- https://nasa-gibs.github.io/gibs-api-docs/python-usage/ — VERSION ValueMap, specifically `6.03` = Collection 6 Standard processing.
- https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html — acquisition UTC, hotspot type and version definitions.

No new account, key request, author enquiry, large download or provider query was made by GPT. The scientific bounded slice can continue; the immediate next deliverable is the full extractor with the narrow offline safety controls and corrected budget. After targeted review, Chad can give the concrete zebra extraction/download/build go. Corridor extraction remains separately gated. This review authorises no production action.
