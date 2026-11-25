# Mother Earth — Tides final release candidate review

25 November 2026. Independent GPT review; Chad remains release approver.

Candidate supplied: `tides-nav-rc` **`72e00114ce59d9d2419efff458c7b92eec3cb110`**, payload head `6d65c4c`, baseline `ea8cffc96c318920f7671d53fa6b201ac69c8778`. Reviewed the synced Mac `_review/tides-nav-rc/` copy and `reviews/2026-11-25-tides-release-rc.md` in full. GitHub branch-head identity and ancestry were not independently queried in this pass.

## Verdict

**PASS — release content cleared for Chad's approval. No remaining model, imagery, navigation or source-record hold.** Do the final current-main reconciliation below, then give Chad the exact final commit to approve. This review is not approval to merge or deploy.

## Verified

- `node phase1/tides/release_manifest.mjs --check`: **37 files match**, with 37 distinct paths: all 33 root HTML/JS/CSS files, the two Tides reference pictures, their SOURCE.json and the reused Moon map.
- `node phase1/tides/build_tides.mjs --check`: generated cross-section, drawing statement, neap percentage, Sources model statement and three image records agree.
- Independently compared the current candidate with the reviewed round-2 copy: `tides.js`, `tides-model.js`, `tides.css`, both reference pictures and `assets/tides/SOURCE.json` are unchanged. Their complete hashes agree with the recorded values. The previous model and browser reviews carry forward.
- Normalised the current main Mac mirror's Sources comparison by only the permitted new Tides section, shortcut, Tides header links and stylesheet version: **no other difference**. This preserves the Animals section and the earlier soil/source material.
- REGISTER contains the existing register followed by the appended Tides entry. It states the model assumptions, source-read ownership, dates, exact asset hashes, original/derived Sun identity, the Earth layer check's actual chronology, interpretation of SDO terms, PI not notified, and unknown Sun observation time. Chad's NASA contact is attributed to his statement rather than claimed as provider clearance.
- Sources explicitly distinguishes computed mechanism from observed tides, names the fixed display constants, labels the images as dated references, and says the Sun is an Earth-facing view rather than a picture of the whole Sun.
- Reviewed the final Animals pin/scope checks: Sources is pinned to the release payload and may depart from the soil baseline only by the named Tides section and shortcut plus the reviewed navigation/key changes. The suite-only maintenance commit remains separately constrained. The earlier baseline pins remain unchanged.
- Reviewed the served-check implementation: it checks HTTP 200, exact byte count and SHA-256 for each path, with no-store requests. The manifest check compares current files with the committed list and fails on differences. Retain the reviewed manifest when running the post-release check; do not regenerate it from an unexpected live result.

Claude's affected-suite results remain implementation evidence: Tides UI 60, model 42, header 2,882, Animals 287, the relevant Timeline/navigation and Sources consumers, and the reported negative controls. The full navigation regression was already run; targeted reruns for the final Sources/REGISTER/link changes are appropriate. This review did not independently rerun the cloud browser suites, which require dependencies and Git history absent from the Mac mirror.

Known baseline failures remain disclosed. “Passed release review” does not mean every legacy suite is green. Real phone, Safari, screen reader and real-network loading remain unverified; no new phone-testing gate is introduced here.

## Final integration and release

The request calls baseline main `ea8cffc` “unmoved”, but also reports the new records commit **`3b3dc4d` on main**. Distinguish the contained baseline from the current branch head. This is routine docs integration, not a new feature hold:

1. Establish current remote main. Reconcile its newer records with the candidate before asking Chad to approve the final commit. Preserve both threads' records; resolve any docs conflict explicitly.
2. Report the exact resulting final hash and the delta from `72e0011`. If the delta is docs only and the 37 pinned served files remain identical, this PASS carries forward without another implementation-review round. Rerun the manifest check and checks affected by reconciliation; identify any changed code/assets for review instead of assuming this allowance applies.
3. Chad's own Approve line must name that actual final commit. Then Claude may carry out the approved merge/deployment. No hub deployment is part of this release.
4. Verify all 37 served files against the reviewed manifest, then check the live navigation and a small functional Tides sample: opening via the tab, quarter-phase change, mode switch and Reset, plus Sources link. Record the result and any limits; no unrelated broad smoke run is requested.
5. Close out STATUS/START-HERE and REGISTER with the release merge/time and served verification. Change the register's “not released” status in the close-out record without rewriting source history. Preserve the accepted image total and outstanding device-test limitations.

Minor wording follow-up, not a release hold: Sources/REGISTER say “nothing is fetched while the page is open”. In context this means no tide/feed data, but the page loads static assets and the library. On the next ordinary wording edit, narrow this to “no tide observations or live feeds are fetched”. Do not create a new release loop solely for that clarification tonight.

**Ready for final docs reconciliation, Chad's exact-commit approval, and the scoped release checks above. Nothing was merged, deployed, fetched from providers or changed in the candidate by GPT.**
