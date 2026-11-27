# Mother Earth — Sky Moon texture R1 recheck

27 November 2026 · GPT independent review for Chad and Claude

**PASS — R1 closed.** Preview candidate `ceb6dc8` may proceed to release-candidate preparation on Chad's go. No merge or deployment is approved by this verdict.

Branch `moon-sky-texture-ui`; page fix `6ba15ac`; candidate `ceb6dc8` changes the suite and documentation only after that fix. Reported head `ee01bc0` adds records. Supplied Mac copy: `_review/moon-sky-texture-ui-r1/`. All **48** checksum entries match.

## Independent reproduction against the fix

I reran the same isolated failure harness used for the original review against the candidate's actual optional-map code, unchanged, with actual moonlight.js and pinned source bytes. Fixtures control image decode and scene/renderer objects; this is not a browser/hardware test.

The eight cases are constructor, colourSpace configuration, upload and orientation exceptions, each with assets ready before or after scene opening. **All eight now terminate in failed state without an escaping exception.** Every case clears the map, ready data, texture and object URL, returns the grey material, and revokes its one created URL. For configuration/upload/orientation errors, the one created texture is disposed. Constructor errors allocate no texture to dispose.

This directly closes the stuck-loading, false-success, uncontained-call and lost-partial-texture findings from the first preview review.

## Code and focused evidence

The common applyMap path now contains preparation and placement errors for load completion, entry and rollover. Texture ownership begins immediately after construction, upload errors reach cleanup, and the early settled flag no longer suppresses those errors. The generation checks and invalidation remain in place. A timer remains active while ready inputs wait for the scene; an elapsed deadline check before and after synchronous texture preparation rejects work that crosses the limit. Normal rollover reuses the successfully placed texture without treating its original acquisition deadline as a permanent expiry.

I inspected the focused browser tests and logs rather than rerunning the full browser suite independently:

- Full texture suite: **197/0** on both `6ba15ac` and `ceb6dc8`.
- Old-code control against `c132f46`: **51 passed, 50 failed**, reproducing the prior faults through the same new tests.
- New tests cover both completion orderings for the four exceptions, orientation failure during rollover, synchronous upload crossing the limit, failure wording, cleanup, usable controls, no uncaught page error, successful re-entry and final release.
- All **17** break variants are caught on the page-fix tree. The two variants affected by the later assertion change were rerun on `ceb6dc8` and remain caught by relevant checks: emissive-grey, 2 failures; no-sync-deadline, 4 failures.
- Sky regressions: **351/0**, **79/0**, **77/0**. No unrelated sweep was required.

The flaky framing assertion change is acceptable: it now compares deterministic box geometry and stops B/C rather than equating two independently captured entry cameras. It does not change framing code. Five isolated runs and the full suite pass after this change. Historical mutation counts and the two affected reruns are disclosed separately. The summary now counts assertion failures rather than counting its final FAILED line as another assertion.

The page code, orientation method, accepted brightness choice, shared assets and UI decisions remain within the previous review. The request-count comment now distinguishes the scene request from the two optional assets.

## Release-candidate scope

On Chad's go, prepare the page-only release candidate with:

1. Sources wording and attribution, including appearance-only/even-lighting, approximate calculated orientation, small visible size, entry-only optional loads and grey fallback.
2. Both REGISTER use extensions, authorized together in the release-candidate go; no separate permission round per line is needed.
3. Narrow Animals pin maintenance for index.html/skyscene.js and any affected Sources checks, with passing checks and meaningful tampering controls.
4. A new reviewed served manifest that includes `assets/moon/moon-light-2026-06-R1.json`, preserving historical manifests.
5. Fresh-main reconciliation, a frozen final tested tree, affected validation and an exact final commit for GPT release review. Account for the still-separate docs branch explicitly; do not accidentally omit its proposal/reviews or merge unrelated work.

No new science-data acquisition, hub deployment or feature expansion is needed. Real phone, Safari, screen reader and hardware renderer remain unchecked. GPU bytes remain estimated; existing heap and renderer-count results keep their stated scope.

Suggested owner line:

> Go for the Moon item 10a release candidate, carrying GPT's passed R1 fix. Include Sources, both REGISTER extensions, narrow Animals pins, the reviewed served-file manifest and final affected validation. Return the exact commit for GPT release review. Page only; no merge or deployment.
