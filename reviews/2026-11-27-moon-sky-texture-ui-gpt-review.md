# Mother Earth — Sky Moon texture preview review

27 November 2026 · GPT independent review for Chad and Claude

**REVIEW HOLD — one focused correction, R1, before release-candidate preparation.** The appearance, orientation evidence, selected brightness and memory qualifications are acceptable. No new data assessment or broad redesign is needed. No merge or deployment is approved.

Candidate: `moon-sky-texture-ui`, tested `c132f46`; reported head `c9f10c8` adds the packet and records. Base `45cc94d`. Reviewed supplied Mac files in `_review/moon-sky-texture-ui/`, including code, payload diff, suite, logs, real crops and results. All **52** checksum entries match. I did not independently retrieve Git history or rerun the full browser suites.

## R1 — Texture preparation and placement exceptions bypass failure cleanup

Location: supplied `files/skyscene.js`, `applyMap` lines 283–297 and `loadMap` lines 319–326. The load sets `settled = true` and clears its timer **before** calling `applyMap`. That function then constructs and configures the texture, attaches it, invokes upload and applies the rotation.

Consequences:

- If texture construction/configuration or rotation throws during `loadMap`'s `applyMap` call, the outer catch immediately returns because `settled` is already true. The status stays `loading`, the deadline is gone, and retained data/object URLs or a partially attached texture can remain until a later exit.
- If the assets become ready before the scene opens, the later `applyMap` in `enter` executes outside that catch. The same exception escapes from entry. A rollover placement exception is similarly uncontained.
- An exception from `renderer.initTexture` is explicitly swallowed. The code then reports `ok` and attaches the picture despite the failed preparation attempt. It should fail to the grey optional map state, not claim success.
- A texture created successfully but failing configuration before `mm.tex = tex` is not owned by the shared cleanup path, so that partial texture cannot be disposed there.

### Independent reproduction

I executed the candidate's actual optional-map block, unedited, in a Node VM with the actual moonlight.js reader and actual pinned source bytes. Image decode and scene/renderer objects were controlled fixtures. I injected exceptions in the texture constructor, colourSpace configuration, upload and orientation matrix operation. Each was tested with assets completing after scene opening and before opening. These are injected failure checks, not claims that the normal real renderer throws in these places.

| Injected failure | Scene already open | Assets ready before scene opens |
|---|---|---|
| Texture constructor | No exception propagated; status `loading`, ready data and object URL retained, no failure wording | Exception escapes; same retained state |
| Texture colourSpace configuration | Same stuck loading state; created texture not disposed | Exception escapes; created texture not disposed |
| `initTexture` upload | Status `ok`, map attached despite the thrown upload | Same false success |
| Orientation matrix operation | Status `loading`, texture already attached and not disposed | Exception escapes with the map partially attached |

For the constructor case, the reproduced state was `status: loading, ready: true, texture: false, url: true`, with one URL created and zero revoked. For orientation, it was `status: loading, ready: true, texture: true, mapOn: true`, with zero disposals. These show the promised “grey on any failure” and “nothing kept on failure” boundary is incomplete.

### Required correction and focused evidence

1. Contain preparation, upload and orientation exceptions for **every** caller of applyMap (load completion, entry and rollover). Route an actual error to a terminal failed state with the grey/no-map/no-rotation fallback and existing failure wording; preserve scene controls and Back.
2. Track ownership of a newly constructed texture immediately, or dispose local partial allocations in a finally/catch path. Clear image/ready references and revoke remaining object URLs. Do not swallow an upload exception and then report success.
3. Separate “input assets ready” from “picture successfully placed”. Do not use the early settled flag to suppress placement errors. Preserve generation checks and the whole-load deadline. The timer currently ends before actual texture construction/upload; if the advertised limit includes those steps, include them in the commit/deadline check, including an elapsed-time check for synchronous preparation that runs past the deadline. No claim of pre-empting synchronous JavaScript is needed.
4. Add targeted failure tests for constructor/configuration, upload and orientation exceptions, both completion orderings, and at least one rollover failure. Assert terminal failure wording, grey material, no map or ready/image/URL references, disposal of owned textures, no uncaught page errors, unchanged usable scene controls, and a successful later close/re-entry retry. Include an old-code control or a narrow deliberate break proving the tests detect this defect.

Return the focused fix and evidence for recheck. Run the normal texture suite and relevant Sky regression checks after it. A full unrelated suite sweep or repeating all Moon-tab tests is unnecessary for this correction.

## Accepted evidence and choices

- The supplied clean log ends **96 passed, 0 failed**. All 13 final break logs show applied patterns and behavioural failures. The previously missed late-keep case is now caught; its earlier miss is correctly retained and disclosed.
- The orientation implementation follows the reviewed frame chain, uses the true Sun range, guards singular/non-finite fits and constructs a proper rotation. The table/scene date selection and normal rollover use the current row. Four-date reference results include the known worst near-syzygy date; the reference package version and hash are now recorded. I inspected these results rather than independently rerunning astronomy-engine in this review.
- The landmark tests are appropriately split from world-direction tests: one checks the map-to-local geometry and the other checks local-to-world rotation. This avoids claiming that a camera derived from the same quaternion alone proves celestial orientation.
- The real stop-B crops show the intended modest mottling, rather than identifiable features. The reported rendered means imply about **18.8%** and **20.7%** increases for the two controlled crops. That is acceptable under Chad's D4(a). Keep those as sampled image-code luminance statistics in this rendering environment, not physical radiance or a universal brightness increase across dates and views.
- Heap growth of 1,101,160 bytes after five entry/exit cycles is correctly scoped to garbage-collected script heap. Renderer texture count returning to baseline supports the tested resource lifecycle; it does not measure GPU bytes, driver allocations or decoded-image cache. The 10.7 MiB graphics allocation remains an estimate.
- The two Animals failures are understandable preview pin consequences. They must become narrow, passing checks in the release candidate, with controls that catch unauthorized changes. The smoke server setup error is distinguished from its valid rerun.

Small records correction: `breaks-summary.txt` reports one more “fails” per variant than the corresponding final suite summary (for example late-keep says 2 there but its log ends 1 failed; no-pin says 5 there but its log ends 4 failed). It appears to count the final FAILED summary as another match. The packet uses the actual assertion counts correctly. Fix the summary generator or label its count accurately when refreshing evidence. This does not invalidate the 13 caught breaks.

The existing top comment still says “Then ONE request” before its later optional-request explanation. Make this unambiguous when finalizing the data-path documentation: one scene request plus two optional asset requests on entry.

## Release candidate after R1 passes

Complete Sources, the two REGISTER use extensions, narrow Animals maintenance and a new reviewed served manifest, including the Moon-light table. Preserve the historical manifests. A single Chad go for that release-candidate scope can authorize both REGISTER additions; no separate permission question per sentence is necessary unless Chad specifically wants it.

Main reconciliation must account for the still-separate docs branch. Return the final candidate and its relation to the frozen tested tree for independent release review. Chad's explicit exact-commit approval remains required before merge/deployment. No hub changes.

Real phone, Safari, screen reader and hardware renderer remain unchecked. This review introduced no new fetch, build, merge or deployment.
