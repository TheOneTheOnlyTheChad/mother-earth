# Mother Earth — Tides navigation candidate review

25 November 2026. GPT independent review of the Mac `tides-nav-rc` copy supplied as `e130ea7`, records supplied on main `ea8cffc`. Packet: `reviews/2026-11-25-tides-nav-rc.md`. No merge or deployment performed.

## Verdict

**PASS for the navigation candidate. Proceed to prepare the final release candidate for review.** No navigation hold was found. This is not Chad's final release approval.

Support the order **Earth now · Timeline · Moon · Sun · Tides · Animals**, and the equivalent Menu order with Sources last. Tides follows the two bodies whose combined influence it explains. No placement decision needs reopening unless Chad wants a different order.

Chad's acceptance of the 1,364,086-byte image total is recorded in this packet; that issue is closed. Keep the pictures unchanged.

## Independently checked

- Read the packet, marked stylesheet block, header suite, Timeline stylesheet guard change, and Animals pin-maintenance code, including 13b/13e/13o/13p.
- Compared all six existing pages with the current main Mac mirror. Deltas are the Tides tab/Menu item, stylesheet version keys, and the home-page promise wrapper. `style.css` adds the single marked header block; its previous lines are unchanged.
- Compared `app.js`, `layers.js`, `soil.js`, `animals-journey.js`, `animals-globe.js` and `phase1/worker.js` with the main mirror: identical. Compared `tides.js`, `tides-model.js` and `tides.css` with the reviewed round-2 preview: identical.
- Served the candidate locally on an isolated port. In the Mac in-app browser at 390 px, the six-tab header fits, Tides is marked current, and the Menu has the intended seven items with Tides fifth. Followed Menu → Moon and the Moon page's Tides tab back to Tides successfully. The Moon retains its UTC clock; Tides has none. At 721 px the single-row Tides header fits visibly. Restored the temporary viewport afterwards.

This focused pass does not claim the complete automated width/font matrix was independently rerun. The mirror has no working Git baseline checkout or the cloud suite's Playwright/font dependencies. Claude's reported 2,882 header checks, negative controls, 287 Animals checks and 102-suite regression remain implementation evidence reviewed alongside the code and spot checks.

## Assessment of test maintenance

The changes preserve the earlier baseline pins and restrict the new index/Sources baseline step to the named Tides navigation transformations. The exact changed-path list and suite-only maintenance-commit check are appropriate. Including the earlier maintenance file inside the named payload range is disclosed rather than hidden.

The Timeline mixed-assets change removes exactly one marked Tides header block for its legacy layout comparison. Its mixed-build fail-safe exercises still use the actual stylesheet. The new header suite covers the layout intentionally changed by that block. This is a reasonable division of evidence and does not waive unrelated stylesheet changes.

Reported failures match main in the supplied record; they are not to be described as a fully green regression. The existing Sources content overflow at 320 px remains explicitly excluded from the header suite and is not a newly introduced header defect.

The header suite currently asserts **six tabs**. Its code may be adapted later, but this candidate does not verify seven tabs. Earth from Space remains untouched and uncleared; its eventual combined seven-tab layout must be measured when that work resumes. That does not block this six-tab release.

## Final release-candidate work

1. Add the Tides source/method entry and section link on `sources.html`, and the two pinned-image REGISTER records with attribution, dates, hashes, modifications and existing limits. Describe the Sun as an Earth-facing reference, with its unobserved part plain; no full-Sun claim. Preserve the existing Animals source content.
2. Extend served-file verification to all files actually needed by Tides: page, scripts, stylesheet, two new reference pictures and reused Moon asset, plus the shared files changed by navigation. Include source records in the release manifest if the existing verification scheme covers them. Pin exact hashes and paths; do not rely only on an unversioned page check.
3. Update Animals release pins/scope narrowly for the **final** Sources delta and any other final release files. The present whole-file Sources pin will otherwise fail after the planned source entry is added. Keep prior guarantees and permit only the named new source block/link, not an arbitrary Sources replacement. Record the final payload endpoint and suite-only maintenance commit. The final release manifest/diff must account for all changes through final HEAD, including anything after the currently pinned endpoint.
4. Correct the packet's stale candidate identity: its title still names `20aa48a`, while the request names `e130ea7`. State the final full commit, its baseline and every intervening change. This is record completion for the final packet, not a reason to rebuild the accepted navigation.
5. Run the checks affected by those final edits, including Sources/REGISTER coverage, Animals pins and release scope, served-manifest coverage, and navigation consistency. Carry forward unchanged model/preview evidence by exact hashes. No additional full regression or source downloads are requested merely because the final metadata is being completed; broaden only if changes or failures justify it.
6. Return one final review packet. If main has advanced, reconcile it and identify the final delta before Chad approves that exact release commit. Then obtain Chad's own final Approve line before merge/deployment and verify the served result after release.

Real phone, Safari, screen reader and real-network loading remain unverified. They must remain accurately stated; this review does not silently convert them into completed checks or introduce a new mandatory phone-testing gate.

No hub route, collector or deployment is needed by this page release. No further model or image-budget decision is outstanding in this review.
