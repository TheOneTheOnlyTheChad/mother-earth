# Moon height — release record (26 Nov 2026)

**Released:** merge `d6a26b6` on `main` (08:05:37 UTC commit time, pushed right after) of `moon-height-rc` at `afb42d5`. Page only. No hub, R2, D1, collector or schedule change.

## Approval and review
- **Chad's own line (26 Nov 2026):** "Approve: release Moon height from `moon-height-rc` at `afb42d5` to main, page only; no hub deployment. Run the 42-file served verification against the reviewed Moon height manifest and record the result."
- **GPT's release review:** PASS for release content at `afb42d5`, filed unchanged as `reviews/2026-11-26-moon-height-release-rc-gpt-review.md` (from the Mac's `ChatGPT/Mother Earth/MOON-HEIGHT-RELEASE-RC-REVIEW-2026-11-26.md`, sha256 `e01922f1…df73`).

## Merge
- `main` had not moved since the candidate's parent `97815dd`, so nothing was reconciled.
- The merge tree is identical to the reviewed tree (`2aff6237…` for both `d6a26b6` and `afb42d5`). No executable or served byte changed after review.
- `node phase1/moonsci/served_manifest.mjs --check` on the merged tree: 42 files (35 root page files + 7 assets) match.

## Served verification (browser pane, live site)
- **Manifest:** the reviewed `reviews/evidence/2026-11-26-moon-height-manifest.json`, unchanged from `afb42d5`. It was not regenerated after the merge.
- **Method:** `node phase1/moonsci/served_manifest.mjs --pane`, run in a browser-pane tab on `https://theonetheonlythechad.github.io/mother-earth/`. Every path is fetched with `cache: 'no-store'` and a cache-busting query, then its byte length and sha256 are compared.
- **Result:** 42 checked, **42 match**, 0 differ, at 2026-11-26T08:10:44.206Z.
- The historical Tides manifests are unchanged. As before, `phase1/tides/release_manifest.mjs --check` reports by design the files changed since Tides.

## Live smoke (browser pane, `moon.html`, about 08:11 UTC)
- Pressing "Show height (LOLA)" loaded the layer:
  - `aria-pressed` was true and the legend showed.
  - `MoonHeight.value(0,0)` = −722 m, `value(-89,0)` = −346 m, and `value(89.9,0)` = withheld (−32768).
- Pressing it again turned the layer off: `aria-pressed` false, legend hidden, state `off`, both files cached, 0 object URLs revoked.
- This is a functional smoke check only. It measures neither rendering nor performance.

## Not verified
Real phone, Safari, screen reader and a verified hardware renderer, as stated in the release packet and GPT's review.

## Rollback
`git revert -m 1 d6a26b6` (page only), on Chad's own Approve line.
