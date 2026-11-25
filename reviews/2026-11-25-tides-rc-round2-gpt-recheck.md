# Mother Earth — Tides round 2 recheck

25 November 2026. Independent GPT review. Supplied page candidate `tides-rc` at `7c3e2af`; packet `e8978e2`, records on main `a84a642`. Reviewed the refreshed Mac `_review/tides-rc/` copy and packet section R. No independent GitHub-head query was performed.

## Verdict

**PASS for the unlinked preview. R1–R5 are closed for this stage.** Chad can now judge the preview and, if satisfied, authorise the navigation candidate. This is not merge or release approval. The top Tides tab and integrated navigation checks remain outstanding.

## Findings against the holds

- **R1:** the drawing sentence and neap percentage are generated from the model; `build_tides.mjs --check` verifies those blocks, rejects additional display formulas outside them, and checks the held asset hashes/sizes. The disclosure now matches base 1.15 and factor 0.12. Closed.
- **R2:** exact-preset language uses the shared 0.5-degree tolerance; nearby positions use qualified wording and the actual computed percentage. Independently selected 100 degrees in the browser: the readout says between first quarter and full Moon, and the explanation says 10 degrees from a right angle with 40% of the largest difference. Closed. The forwarded “39%” example is not the value observed at exactly 100 degrees; the actual page correctly computes it.
- **R3:** the new placement logic accounts for body and label bounds. Independently reproduced Angled + first quarter at 1280×720, then 390×844: Earth is labelled above Earth and Moon below Moon, with the original collision absent. Claude's broader preset/free-camera matrix is additional evidence, not an independent GPT rerun of every state. Closed.
- **R4:** the Earth layer/source metadata check is now recorded, with the unavailable twelfth collection explicitly identified rather than silently counted as read. The general source-use record and absence of restrictions found support this specific informational reference use; do not describe all twelve collection records as verified. The check happened after acquisition and remains recorded that way. The dated chronology correction preserves the original and withdraws invented minute estimates. The Sun evidence now uses this held frame, three SWPC regions and an independently written reprojection. Unknown observation time remains a limit on positional agreement, not a claim of exact observational coordinates. Closed for this display use.
- **R5:** reviewed actual CDP touchStart/touchMove/touchEnd gestures, rather than programmatic scrolling. The canvas now permits vertical panning; the checks cover scrolling, horizontal camera interaction and Moon dragging. These are emulated Chromium gestures, not real-phone evidence. The local cold-load comparison records five runs each, assets and readiness conditions, with no network claims. Closed.

Minor evidence precision to retain at navigation close-out: T9j records the camera before/after the vertical swipe but asserts scroll and unchanged Moon angle only. Do not claim it proves an unchanged camera unless that comparison is also asserted. This does not reopen the scrolling hold.

## Picture budget recommendation

**Recommend accepting 1,364,086 image bytes for this version**, 164,086 bytes (13.7%, rounded to 14%) above the 1.2 MB target. The target was a design target, not evidence of a hard platform limit. Retain the source pictures and current Sun texture; no compression change is needed to close this preview.

The local medians, 646 ms versus Moon's 342 ms, indicate additional local parsing/decoding/scene work under the stated software-rendering conditions. They are not a download forecast or a real-device performance guarantee. Both pages reuse existing infrastructure/assets; a cold Tides visit still loads all three pictures, so accounting must continue to include the Moon file. Chad's acceptance of the deviation remains his call.

## Independent checks and limits

- Node model suite: **42 passed, 0 failed**.
- `node phase1/tides/build_tides.mjs --check`: passed, including image and original-source records.
- Mac in-app browser: scene rendered; preset/camera interaction, corrected labels at 1280×720 and 390×844, and nearby-angle explanation checked. Temporary viewport override reset afterwards.
- Read the updated UI checks, source records, Sun-check script/evidence and loading-comparison method. Did not independently rerun the 60-check UI suite or its 12 negative controls; the local runtime lacks its Playwright/library dependencies. The Python Sun check also could not run locally because numpy is unavailable; its algorithm and saved evidence were reviewed. These limits do not replace Claude's reported runs with independent ones.
- Real phone, Safari, screen reader and real-network loading remain unverified. No broad regression or production smoke test was performed or implied.

Evidence screenshot: `TIDES-RC-R2-ANGLED-2026-11-25.jpg` in GPT's Mac review folder.

## Next step

File this review unchanged. Chad looks at the preview and decides on the image target overrun. If he says go, prepare the separate navigation candidate against current main, including actual combined tab/menu layout, Animals pin maintenance and relevant regressions. Coordinate Earth from Space layout without starting or clearing that workstream. Return that candidate for GPT review, followed by Chad's explicit release approval.

No merge, deployment, hub change, provider enquiry or production action was performed by this review.
