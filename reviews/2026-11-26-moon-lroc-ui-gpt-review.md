# Mother Earth — Apollo 11 LROC UI preview review

26 November 2026 · GPT independent reviewer

Supplied candidate `moon-lroc-ui` at `a35a25b`; final validated tree `1dc62c1`; page payload `c99da22` plus locator fix `3ed8f82`. Reviewed Mac `_review/moon-lroc-ui/` code, assets, SOURCE, packet, suites/break logs and test code.

## Verdict

**Normal preview and image-processing choices: PASS. One startup-readiness fix is required before release-candidate clearance.** The HTML locator implementation and area JPEG tolerance of six grey levels are accepted for this display feature, with the limits below. No new archive acquisition is needed.

No merge or deployment is cleared. Sources, REGISTER, refreshed manifest and release pins remain later release-candidate work on Chad's go.

## Independent checks

- All **16** files in the Mac SHA256SUMS list match, including images/screenshots/logs. The actual builder SHA matches SOURCE. The archive transfer has resolved the earlier re-encoding uncertainty for this review copy.
- Read the actual builder and confirmed it uses retained hashes, attached-header-derived 16,880/8,444-byte offsets, exact source crop hashes, explicit little-endian decode, corrected n≥2 histogram, special-code checks and recorded PDS4 conflicts.
- Independently decoded the **actual shipped mask PNG** with Python standard-library PNG/zlib/filter code and compared each alpha to a separate valid-count calculation from the retained 2 m source at offset 8,444. All **1,055,000 alpha values match**, with **30,589** masked output pixels.
- Inspected the shipped area evidence image visually. The date, source, fixed historic lighting, averaging and no-data distinctions are present; the footprint rectangle and ground scale are useful.
- Independently opened the local candidate overlay in the in-app browser: opened area detail, switched to site, enabled the optional pointer, enabled Lit as now, selected Earth view, then switched detail off. The site turn, captions, view changes, pointer control, Earth-view locator explanation, and camera/lighting preservation on off behaved as expected. Temporary tab and server were closed afterwards.
- Inspected the supplied final break log: mutations are recorded as applied and behavioural failures are shown. The suite log carries the reported Moon/Animals results. I did not rerun the full Playwright matrix or all mutations locally, and did not independently rebuild JPEGs in the pinned Pillow/numpy environment.

This is a bounded desktop functional/code/data review, not a real-phone, Safari, screen-reader or verified hardware-renderer check.

## R1 — opening before the globe is ready loses the turn-to

The detail button is available while `moonglobe.js` is still loading its library/texture. That module exports `MoonGlobe.point` before the globe exists, and its internal `set()` simply returns when `globe` is absent.

`moonlroc.js` calls `MoonGlobe.point` once at switch-on, then retries **only** `drawLocator()` every 200 ms. When the globe subsequently starts, the locator is added but the required turn to Apollo 11 is never replayed. If the globe never starts, the readiness interval has no deadline while detail remains on.

I reproduced this with the **actual candidate `moonlroc.js`** in Node VM and mocked DOM/image/globe boundaries:

1. Globe initially absent; click the registered detail handler.
2. Images complete and panel becomes shown; point called once but applies no camera change; one readiness poll registered.
3. Globe becomes available; invoke the poll.
4. Locator is added; point has still been attempted once and applied **zero** times. The camera remains at the default view.

The current browser suite waits for `data-ready=1` in every setup before clicking, so it does not exercise this case. This is separate from the cached-visibility issue already fixed.

Please handle readiness explicitly, either by disabling/qualifying the detail control until the globe is ready, or by one token-guarded, bounded on-entry operation that performs the camera turn and locator together after readiness. Make off invalidate/clear a pending readiness operation; make permanent globe failure/deadline settle without an endless interval or late camera move. Preserve the selected lighting/science mode.

Add focused tests for: delayed globe startup, off before readiness (no later turn/locator/panel reopen), and permanent startup failure/deadline (no endless polling). Include a meaningful mutation that removes the readiness protection. Recheck the normal opening and existing live-camera visibility tests. A fresh broad suite sweep is not needed just to diagnose this fix.

## Accepted deviations and qualifications

### HTML locator

Accepted as an implementation change from the proposed WebGL ring. Fixed screen size, pointer-event exclusion, geometric sphere occlusion and Earth-view hiding meet the user-facing purpose. The live-camera dot-product test is appropriate for the smooth spherical globe, and B8 directly tests both directions when the library visibility answer is wrong.

Keep the description accurate: HTML locator with geometric visibility, **not** a WebGL depth-tested marker. It marks a location, not a footprint or sub-metre navigation position. It must not become a general-purpose replacement for other overlays without separate review.

Unchanged WebGL draw calls show no extra WebGL draw; they do not establish unchanged total rendering work or CPU. The HTML visibility callback runs with the library renderer and performs camera/coordinate/DOM work. Carry the unmeasured layout/CPU qualification in the packet and final release wording.

### JPEG tolerance

Accept area mean absolute difference **≤6** grey levels at quality 80, with reported measured 5.46, while retaining the site ≤3 limit. This is a display-only picture derived from a retained raw source, not a quantitative brightness readout. The recorded correlation, visible morphology, unchanged source-coordinate overlays and exact no-data mask make the roughly 360 KB area choice reasonable. No requirement to increase to about 500 KB merely to preserve the preliminary three-level estimate.

Record the measured values, tolerance and encoder versions in release evidence. Do not describe JPEG brightness as lossless or use its extrema to validate source-coordinate accuracy.

### Build-check and record wording

The builder's `--check` validates fresh outputs against committed bytes only when the encoder metadata match. With a different encoder it prints a NOTE and skips that byte comparison; its quality checks operate on the newly generated images. Keep byte-identical rebuild claims explicitly limited to the pinned environment. A different-encoder run must be described as such, not as proof that it reproduced the shipped JPEGs. The current candidate's exact hashes were independently checked above.

The packet's §1 still mentions a packet-only difference from `3ed8f82`; the final validated tree includes B8 in `1dc62c1`. Align that sentence with the final head/tree identifiers already correctly supplied in the message and validation section. Page-code identity is unaffected.

## Next

Fix R1 with focused evidence and return the exact updated preview for GPT recheck. The source selection, corrected offsets, mask, JPEG choice, captions and accepted locator design remain supported. Do not reacquire data or expand scope. After the focused recheck and Chad's go, prepare the release candidate; no merge or deployment yet.
