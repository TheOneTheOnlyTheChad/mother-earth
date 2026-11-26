# Mother Earth — Moon Diviner UI preview review

26 November 2026 · GPT independent reviewer · supplied candidate `moon-diviner-ui` head `cdc9aed`, payload `947dd14`, Animals maintenance `29bb0ee`.

## Verdict

**Normal preview behaviour and numerical data: PASS. One controller timeout fix is required before release-candidate clearance.** The GHRM comparison does not require replacing the chosen product or downloading more data, but its interpretation and release caveat need tightening as below.

No merge, deployment or hub change is cleared by this review. Sources, REGISTER and refreshed served manifest remain release-candidate work after Chad's go.

## Independent checks

- Read the preview packet, actual `moonsci.js`, `moon.html`, SOURCE record, builder, GHRM comparison code/output/sites and relevant test code.
- Independently verified the 720,037-byte page gzip SHA-256 `1d81cb86738d81797ad92449419d4c46a2e8ffe6233a66863dcf2e05fde611d0`, raw SHA-256 `cfaaabd8ecc9cdeb92644811f20ffd0d463cbde5073b19b49289176daaabff92`, and header payload hash. Reconstructed the six int32 evidence planes from the actual page file: they reproduce the independently validated global acquisition digest `1cd629dd3be74f752452ea55366efd9ebff6d279bfedab30a7f1d9d4ebcc9f7b`. Thus the codes shipped to the page are those verified in the global review.
- Opened a local overlay preview in the in-app browser: candidate changed files with unchanged files served from the Mac main mirror. Observed Lit as now → Earth camera → noon temperature → midnight temperature/read centre → height → off. Lighting was locked off during science, the original Lit choice returned for the current minute, and Earth camera did not reopen. Midnight centre readout was 101.7 K (−171.5 °C), four bins, 1 K range. Both scale warnings and historic compilation wording were visible.
- This was a bounded desktop functional check, not a rerun of Claude's 157/110/294 browser suites, a performance measurement, real-phone/Safari/screen-reader check or a verified hardware-renderer test. The checked browser tab and temporary local server were closed afterwards.
- Independently re-read the 20-site GHRM float sample and verified SHA-256 `94cba44ba69c8a3c9c119375b631b010a99c246db0eb1e19ee03c2206c8945e5`. Separate standard-library Python calculations reproduce the centre differences, T⁴ comparison and all aggregate registration-control scores.
- Re-read primary Powell 2023 §§2.4–2.5 on the publisher's site: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022JE007532 . Its fitted nighttime products and mixed-temperature interpretation support the qualified distinction between the products, not a quantitative attribution of this measured offset.

## R1 — timeout must terminate the request, not merely abort fetch

`request()` currently starts a timer that only calls `ctl.abort()`. The commit gate checks token/pending identity, **not the aborted signal**. `temp.prepare()` checks abort before drawing but not after `drawTemp()` resolves. A timeout during canvas PNG encoding can therefore be followed by `res.keep()`, lighting/camera changes and a texture commit. A stalled non-abortable prepare stage can also leave pending state indefinitely after the timeout.

I reproduced the commit problem using the **actual candidate `moonsci.js`** in Node VM, its real compressed page file, native crypto/decompression, mocked DOM/globe hooks and a deferred canvas `toBlob` callback:

1. Clicked the actual registered temperature handler; pending `temp-noon`, zero commits, no lighting change.
2. While `toBlob` was pending, invoked the registered 15-second timeout callback to simulate its expiry.
3. Completed the deferred blob callback.
4. Result: active `temp-noon`, one commit, `litOff` and `texture` called, one URL cached and none revoked.

This is a deterministic deadline-path test, not a measured 15-second browser delay. It demonstrates that the normal fetch-timeout test misses the draw-stage case.

Please make the deadline invalidate/finish the current request promptly, preserve the active map or appearance state, and show the timeout reason. Check aborted state before any cache/view commit as well as token identity. Any late result must be released. Ensure rejection/abort races cannot produce double cleanup or a stale error for a later request.

Add meaningful focused tests for a delayed/non-returning PNG callback and the analogous non-abortable height picture-decode stage: entry and replacement; timeout settles pending before the late callback; radio returns to actual mode; existing view and saved lighting stay unchanged; late output is revoked, never cached; retry works. Include a deliberate break that removes the new protection. Avoid a new broad test sweep until the focused fix is ready.

## GHRM finding — useful corroboration, not an accuracy certificate

Independent reproduction:

| Centre comparison, our midnight minus GHRM | Selected high-contrast sites | Fixed background sites |
|---|---:|---:|
| Median | +8.75 K | +0.35 K |
| Min to max | −1.91 to +16.71 K | +0.05 to +0.82 K |
| Median against T⁴ proxy | +4.85 K | +0.29 K |
| True-alignment aggregate absolute difference | 2.26 K | 0.60 K |

True alignment beats the tested shifts and local reflections on average; this supports the orientation already tested separately. It does **not** prove that no local pointing/georeferencing or effective-footprint difference contributes. Powell explicitly describes improvements to pointing and effective field of view. The reflection controls in this script reverse each local 3×3 patch, not the entire global latitude/longitude grid; label them accordingly.

The `(mean T⁴)^(1/4)` calculation is a useful idealized blackbody spatial-aggregation proxy. Its reduction of the numerical discrepancy does **not** establish that about half the real inter-product offset is caused by averaging order. The compared products also differ in channel processing, period, local-time fitting, sampling and georeferencing. Keep these as possible contributors, unquantified here.

Likewise, the ten maxima were selected from our own grid. Consistency among our contributing bins does not remove the selection bias or establish a cause for the cross-product discrepancy. Do not generalize this set to all rocky terrain or characterize it as an independent random validation sample.

Correct the packet's site identification: site 0 is **33.75°N, 335.75°E**. The **35.75°N, 102.75°E** location identified as Giordano Bruno is **site 2**, not the first selected site.

Suggested Sources/release caveat:

> In a comparison at ten selected high-contrast midnight sites, this map's cell values differed from a separately processed high-resolution Diviner midnight mosaic by −1.9 to +16.7 K (median +8.7 K). Ten background sites differed by less than 1 K. The products use different processing, sampling and periods; the causes of the differences have not been isolated. This comparison is not an accuracy estimate.

A short page-level line can link to that detail: “Differently processed Diviner maps can give different values, especially at sharp warm features. See Sources for our comparison.” Keep the full statistic/rounding/spread caveats already present. No ad hoc subtraction or correction to the GCP values is justified.

## Other wording and test records

- The Moon page's new Sources line calls 281–395 K and 70–105 K “the 1st and 99th percentiles.” They are **those percentiles rounded outward to whole kelvin**, not the exact percentile values. Use that wording there, as SOURCE already does.
- Identify the existing “about 5 km to a pixel” sentence as referring specifically to the **appearance picture**. It does not describe the new 0.5° science grid. If adding a distance, 0.5° is about 15 km north–south and at the equator, narrowing east–west toward the poles.
- “Perfect emitter … all the heat Diviner measured” would be clearer as “equivalent blackbody temperature representing the wavelength-integrated thermal radiation.” It is an effective radiative temperature, not a physical temperature of every material in a mixed cell.
- Accept the correction of the height release's two no-op mutations. The new mutation patterns target real current code, and the missing-pattern guard prevents silent no-op mutations. Preserve the historical release records, with a dated erratum pointing to this correction; do not continue citing the old “12 caught” as established release evidence. Distinguish a mutation rejected by setup failure from a changed implementation caught by a behavioural assertion.
- The two reported suite exceptions are recorded rather than hidden: branch-specific Tides scope check and 11 live-data smoke failures reproduced on baseline. I inspected the explanation; I did not independently rerun those suites. Carry their baseline evidence to the release packet.

## Next

Claude should fix R1, add the focused tests and incorporate the scientific/wording corrections, then return the exact new candidate and evidence for recheck. The frozen masks/scales, source product and numerical extraction remain supported. After that recheck and Chad's go, prepare Sources/REGISTER/served-manifest release work and the narrow Animals maintenance. No merge or deployment yet.
