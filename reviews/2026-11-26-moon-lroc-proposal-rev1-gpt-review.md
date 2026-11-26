# Mother Earth — LROC regional-detail proposal rev 1 review

26 November 2026 · GPT independent reviewer · supplied main `9397993`

Reviewed Mac `_review/moon-lroc-proposal/MOON-LROC-REGION-PROPOSAL.md` and `checkpoints.jsonl`, and the retained evidence views. Docs-only review: no build, acquisition of large imagery, merge or deployment.

## Verdict

**The concept and Apollo 11 product choice are supported. Revise the proposal before build approval.** A separate regional panel with a locator on the existing globe is a sound bounded implementation. No need to replace the all-round appearance map, pair this 2011 image to the 2026 trajectory or add a collector.

The revisions below address coordinate claims, a build test that would be invalid after brightness clipping/JPEG, special-pixel handling and an ambiguous Earth-camera transition. Rights do not appear to require a new permission enquiry for these PDS-derived images.

## Independent checks and limits

- Opened the actual 0.5 m PDS4 product label in the in-app browser. Confirmed LID, version 2.0, orthophoto title, observation 2011-01-22 20:48:53–20:49:11 UTC, file size 943,743,920, MD5 `95decbebbf283e46d6146c47fec988ed`, 16,880-byte offset, SignedLSB2, 55,908×8,440 array, positive-east planetocentric coordinates, 1,737.4 km sphere, 1° standard parallel, 180° central meridian, reported bounds and the positive upper-left x value. This independently confirms the label conflict Claude identified; it does not independently recover the attached PDS3 header or source pixels.
- Independently recalculated the supplied projection formula: predicted 0.5 m sample/line **6114.6520 / 34104.9202**, and 2 m **1529.5380 / 8527.1050**. The recorded 0.5 m range follows exactly from the attached-header size and full-width row range: bytes **567049840–584334959**, 17,285,120 bytes.
- Read the official LROC terms and coordinate-list PDF, and the LROC explanatory page. The coordinate list gives the Apollo 11 coordinates and a 0.3 m uncertainty column, but its method notes and explanatory article also describe ±15 m spacecraft-position/coordinate uncertainty. Those quantities must not be collapsed into a guaranteed 0.3 m absolute location accuracy.
- Inspected the local crosshair evidence image visually. Source arrays, attached headers, projection catalogue and numerical landmark scripts/outputs were not retained in the supplied review copy, so I could not independently reproduce brightest-pixel/shadow/correlation results. They remain Claude's reported measurements.
- Local PNG evidence hashes differ from the prefixes in the proposal; the area view is 575×544 on the Mac, not a production 1,055×1,000 raster. Treat these as screenshots/visual evidence, not lossless source or build assets. Record this limitation rather than treating their pixel hashes/dimensions as source validation.
- The RDR SIS search index exposes §4.6 describing mean Earth/polar axis coordinates, planetocentric latitude and east-positive longitude, with DE421-related camera constants. Full PDF reads failed through the web service and yielded an unreadable browser view. I have not independently read its full relevant sections. Close this in the revised assessment rather than assuming every lunar frame difference is negligible.

## R1 — resolve the coordinate basis and narrow the registration claim

Read and retain the small relevant RDR SIS/DSMAP/README/label materials. State the orthophoto's named frame/realization, projection conventions, pixel-centre/edge convention and the accepted interpretation of the PDS4 x-sign conflict. Preserve both label identities and document why the attached PDS3 arithmetic is used; do not silently alter archive metadata.

The observed local agreement near the descent stage supports orientation and crop placement. Replace “it lines up exactly,” “hard registration test” and unqualified ±0.3 m claims with **local agreement at the named landmark, within the stated image sampling**, with absolute uncertainty not established here. A local maximum search near an expected position is not independent global registration or an accuracy certificate. The DTM's vertical RMS/precision figures are not horizontal orthophoto accuracy.

Retain a reproducible small numerical script/output for the source-pixel checks and independent geometric anchors. Do not test the coordinate conversion against numbers produced solely by the same code being tested. Include forward/inverse positions, corners, crop offsets and sign/axis/one-pixel negative controls. Describe label bounds as the mapped array's bounding box; valid coverage is additionally limited by the no-data mask.

Sources:
- LROC coordinate list: https://lroc.im-ldi.com/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf
- LROC explanatory page: https://lroc.im-ldi.com/images/938
- RDR SIS candidate: https://pds-imaging.jpl.nasa.gov/documentation/LROC_SOC_RDR_SIS_Spec_4_v1-2.pdf

## R2 — make the image build/test contract valid

The proposed “LM brightest pixel within 1 m … in the site JPEG” is not a valid build acceptance test. DN 239 and above all become white under the proposed stretch, while the reported LM peak is 446. Multiple pixels can therefore tie at white; lossy JPEG can move extrema or introduce ringing. Verify the landmark on retained **unstretched lossless source pixels**, and verify coordinate-to-overlay placement separately. Test final JPEG dimensions, orientation, crop, visual feature visibility and display-to-source transforms with suitable tolerance, not an absolute brightest-pixel criterion.

Specify these details:

- All source special values and their separate meanings. The actual 0.5 m label includes **−32764** high-representation saturation as well as −32765, −32766, −32767 and −32768. The proposal's “−32767…−32765” omits one. Saturation is not automatically equivalent to unobserved coverage. Define which values are invalid for averaging, how each is displayed and what a fully/partly valid block produces.
- For 2×2 downsampling, exclude invalid codes **before** averaging, state the valid-count rule, and keep no-data style distinct from real dark terrain. Do not average sentinel values into brightness. Record where the mask comes from; JPEG cannot preserve an exact categorical mask by itself.
- 2,111 input samples cannot form 1,055 complete 2×2 groups without discarding one column. Name the discarded edge (or alternative padding policy), the resulting 4,220 m width, bounds and pixel-centre offsets. Propagate these to the footprint rectangle and scale bars.
- Define the site crop's exact 1-based inclusive source bounds and rounding around the published coordinate. Slight pixel-grid offset from the exact coordinate is acceptable; record it rather than promise mathematical centring.
- Implement the source-to-display stretch explicitly: valid-DN handling, clipping, rounding, averaging then stretching, JPEG quality/subsampling and encoder/library versions for reproducible `--check`. The original native pixel spacing is not the CSS screen resolution or a guarantee of 0.5 m resolving power.

The 4.2×28 km strip is approximately **3 screen pixels wide and 19 tall** at the proposal's assumed 1.45 km/screen-pixel scale, not three pixels in every dimension. The central 512 m view is about 0.35 pixel across. This correction does not change the recommendation for a separate detail panel.

## R3 — specify deterministic marker and Earth-camera behaviour

“Lighting/Earth view untouched” conflicts with “turn to the site” while Earth camera is active. Resolve the transition explicitly. My recommendation:

- Opening detail acts like an explicit globe view button: leave the Earth-centred camera through the existing view API, preserve the Lit choice and active height/temperature mode, turn to the site, then show its locator.
- If the user later selects Earth view, keep the detail panel open, hide the marker with an explanation, and leave the camera alone. Restore the marker when returning to the ordinary view, subject to visibility/occlusion.
- Off removes the panel and marker and leaves the current camera/zoom unchanged; it does not reopen the prior Earth view.
- The fixed-size ring is a **locator symbol, not the observation footprint**, and must be labelled that way. Hide it on the back of the globe and verify limb/occlusion behaviour after rotation; do not let it float over unrelated terrain or intercept the height/temperature readout clicks.

Define panel loading/error/off/retry and late-response behaviour, keyboard operation and focus, and test interaction with the dated LRO overlay. Estimate/measure the actual marker rendering cost after implementation; “one marker” does not itself establish one draw call or zero idle CPU. Explain scale bars as ground-distance scales that resize with the image, not fixed CSS lengths.

An image load failure may leave the locator, as proposed, provided the page clearly says the detailed image is unavailable. Switching the feature off during loading must not allow a late completion to reopen it.

## R4 — retain reproducible inputs and make checkpoints honest

Checkpoint-per-acquisition timing is improved and should continue. These checkpoints record a fetched-and-checked acquisition **without durable source bytes**; “complete” must not be read as “retained and ready to rebuild.” Add a separate retention state/path/hash once the required files are actually stored and re-read.

Preferred D5: retain the 17 MB high-resolution range, the 59 MB 2 m file and the small labels/header/README/frame documents on the Mac, outside the repo. Use the Downloads route if approved and supported; bounded pieces are an acceptable fallback. A precisely specified, lossless subset with source offsets, dimensions, hashes and metadata is also reproducible for these fixed crops, but distinguish it from a retained full file. Keeping only hashes is not the recommended build path.

The ranged 0.5 m data are not verified by the full-file archive MD5: the recorded ETag equality, status, range, size and local SHA support provenance, as the checkpoint correctly says. Do not turn an ETag into an independently computed source MD5. Re-fetch only the needed existing range/full 2 m file when retention is authorized; no reason to download the 944 MB 0.5 m file wholesale.

Do not label Downloads a universal missing capability: it is an authorization problem in that Claude session, with a documented piece-transfer fallback. If an automatic approval review rejects the request again, state its specific reason; use a materially safer permitted route or obtain the necessary user authorization rather than repeating the same request.

## Rights assessment and recommended decisions

The actual LROC terms say PDS-delivered data are public domain and prescribe the NASA/GSFC/Arizona State University credit. The viewed XML identifies a NASA PDS observational product on the archive host. This supports treating the new host's **PDS product**, not merely anything on a NASA domain, under those terms; record redirect, product identifier and label. No extra permission enquiry is warranted for the proposed self-derived PDS crops on the evidence reviewed.

The website-image row should say “not selected; different copyright/terms,” not categorically “not usable”: the terms explicitly permit certain educational uses with citation. This does not change our chosen archive-derived route. Do not base reuse on an assumed “non-commercial” status alone.

Terms: https://lroc.im-ldi.com/about/terms

I support **D1 Apollo 11; D2 both area and site views; D3 optional descent-stage pointer off by default; D4 leave the current camera on off; D5 durable raw inputs as above**. The pointer identifies the descent stage at the published position, without implying a sub-metre absolute guarantee. Prefer lazy-loading each image when first selected; measure actual built sizes rather than promising the browser's trial encoder sizes.

Please return a docs-only rev 2 addressing R1–R4 and the corrected validation plan, then GPT can recheck before Chad's build go. No build, merge or deployment cleared yet.
