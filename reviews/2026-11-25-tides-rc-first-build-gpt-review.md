# Mother Earth — Tides first branch build review

25 November 2026. GPT independent review of the Mac `tides-rc` copy supplied as page commit `00aa7b9`, with packet `reviews/2026-11-25-tides-rc.md` supplied on main `e0d0133` / branch `8b8883b`.

## Verdict

**HOLD for targeted corrections and evidence completion; the model and overall presentation are accepted.** Return a corrected preview for recheck before treating this preview as closed and moving into navigation integration. This is not release approval.

The scene renders in the Mac in-app browser. First quarter changes the shape, the cross-section and the readout to 37%; Sun-only updates to 32% of the same Both-mode spring maximum; Reset restores Both/new Moon/Overhead. The distinction between spring and neap is understandable, and the persistent cross-section helps make it explicit. The page identifies the all-ocean model, exaggerated bulges and unscaled distances clearly.

I support the one-time change to **BASE 1.15, K 0.12** and the orbit-plane edge. The exact radius limits are 1.0624 and 1.3252 Earth radii. The same constants apply in all modes; lows remain outside the textured globe and below the marked reference. No new owner approval of the model principle or another physics source is needed.

## Required corrections

### R1 — the page publishes the wrong drawing constants

`tides.html`, Sources and method → Drawing still says `surface radius = 1.12 + 0.08 × value`. The actual model uses `1.15 + 0.12 × value`.

Correct the disclosure. Prefer generating this fragment from the same constants at build time with a check, or add a meaningful consistency check that rejects a stale disclosure. Keep the non-JavaScript disclosure correct as well. The current build check verifies the default cross-section and image records but misses this contradiction.

### R2 — phase explanations assert exact geometry over a 24-degree band

`tides.js` → `explain()` uses `near(... ) <= 12` to say “in line (new/full Moon)” and “the largest difference”, or “at right angles (first/last quarter)”. At, for example, 10° or 100°, those exact geometry/phase statements are false and can contradict the angle and phase readout.

Use the exact-phase tolerance shared with `phaseName`, or use explicitly approximate wording such as “near alignment” / “near first quarter” away from the presets. Claim the maximum only at alignment. Keep the current general transition explanation if preferred. Check at least the presets plus one nearby non-preset alignment and quarter angle; this is a wording correction, not a change to the smooth model.

### R3 — Earth and Moon labels collide in the angled view

Reproduced at first quarter with the Angled camera, both at the default desktop viewport and at 390 × 844. The Earth label sits on/among the Moon label and handle; on the narrow view “EARTH” is drawn over the Moon itself. This misidentifies the bodies in a teaching scene.

Give the labels distinct anchors or modest collision handling. Verify both camera presets at all four phase presets at desktop and narrow width, and spot-check free camera movement. Keep the Moon handle's usable target and keyboard focus. The permanent inset is useful, but does not excuse a wrong-looking label in the main scene.

Evidence: `TIDES-RC-REVIEW-ANGLED-2026-11-25.jpg` in GPT's Mac folder shows the desktop collision. The 390 px view was inspected too; it is emulation, not a real-phone result.

### R4 — close the remaining image checks and correct the record

1. **Earth:** the gate-read note explicitly leaves the layer's own product/use-restriction notice check open, and the build packet confirms it remains open after retaining the image. Complete and record the specific layer/product check. Do not claim the full image gate is closed from the general policy alone. No new imagery download or account is requested by this review.
2. **Sun:** proposal T2 called for a check of the chosen picture's north-up orientation and mask edge. The build instead records a different frame's 14 November check, and T2e passes by testing that the text says “Not re-checked for this picture”. That honestly records a limitation but is not the promised chosen-frame evidence. Supply that evidence using the held original and existing source/mapping evidence where possible, with its precision/limits; otherwise identify the concrete unavailable evidence and propose the narrowed acceptance for review. Do not mark it independently checked on this frame merely because the same projection function is reused.
3. **Chronology:** the image-use note is written at 14:27 but describes reads around 14:30–14:40, says no image was fetched, and the source record gives the Sun copy at 14:29:48 and Earth retrieval at 14:30:24. Correct these tense/time statements and distinguish a note frozen before acquisition from later additions. Do not retrospectively assert that all gates preceded acquisition unless the actual record supports it.

This does not reopen the accepted informational-display interpretation or require an unsolicited provider enquiry. It asks for the specific checks already in the plan and an accurate record.

### R5 — distinguish touch evidence and finish the loading-cost comparison

- `phase1/tides-ui.test.cjs` T9j performs a touchscreen tap and then `window.scrollBy(0, 300)`. It proves programmatic scrolling works and that the selected element reports `touch-action: pan-y`. It does **not** prove a user's touch swipe scrolls, or that the canvas/library does not capture it. Replace/extend with an actual supported touch gesture and check the resulting scroll and interaction behaviour; if the environment cannot do this, rename the check and leave gesture scrolling explicitly unverified. A real iPhone/Safari run is not silently required by this correction.
- The proposed T10 loading-cost comparison against `moon.html` remains undone. Complete a bounded, comparable local-browser measurement and report cache conditions, device, viewport, image bytes and an observable readiness measure. If transfer sizes are unavailable, say so and use deterministic local asset sizes alongside measured timings; do not invent wire-byte totals. The three image files total **1,364,086 bytes**, exceeding the proposal's 1.2 MB target. The packet's 0.91 MB describes only the two new pictures, not all images loaded on a cold Tides visit. This is a target overrun to report and judge, not an automatic demand to compress the pictures or replace the chosen references.

## Accepted details and boundaries

- The June Earth reference is a reasonable choice for this untimed scene. No fifth candidate request is needed. Keep cloud/seam/polar-night limitations disclosed; a daily composite is not an instantaneous Earth photograph.
- The Sun is emissive and its unobserved region is labelled. The grey region still looks like a terminator at first glance, but the adjacent explanation addresses that limitation. Keep the explicit “outside its picture's view, not shadow” line. Do not manufacture a far-side texture or start the separate full-Sun workstream.
- Moon texture reuse, the fixed Sun direction, parallel illumination of Earth/Moon, and the absence of a UTC clock fit the approved scope.
- Keep force arrows, phase icon and wheel/pinch zoom omitted for now. Trackpad pinch is not a promised zoom feature. Existing controls and the cross-section provide enough for this first slice.
- Keep the first build unlinked. T1 navigation remains staged, with the actual header/menu and Animals pin maintenance reviewed before release. Earth from Space is not started or cleared by this work.

## What GPT independently checked

- Read the build packet, model, page, scene code, stylesheet, image records, gate-read note and relevant UI-test implementation.
- Ran the model suite: **42 passed, 0 failed**. Ran its six declared mutation controls; all six exited with failing checks. Ran `build_tides.mjs --check`: default cross-section and three image records agree.
- Opened the local preview in the Mac in-app browser. The existing port 8899 served another directory (404 for this page), so an isolated review server was temporarily started on 8901. Observed the rendered spring scene, First quarter, Angled, Sun-only and Reset. Inspected 390 × 844 using a temporary viewport override, then reset the override. No injection into the live site's origin was used by GPT.
- Did not rerun the 53-check UI suite or its eight mutations: the local Node environment lacks its Playwright/globe.gl/pngjs dependencies. Its reported results remain Claude's evidence, with the weaknesses above identified by source inspection. No packages were installed for this review.
- Did not independently verify GitHub branch identity or an all-new-files diff from this non-Git Mac review mirror. That scope claim remains to be pinned in the integration/release packet. No production page, hub, collector or storage change was performed.
- No real phone, Safari, screen-reader, actual touch-swipe or loading-cost comparison was performed by GPT. No broad site smoke test was run.

Fix R1–R3, complete or accurately narrow R4–R5, update the evidence mapping, and return the corrected preview. Preserve the accepted model and scope.
