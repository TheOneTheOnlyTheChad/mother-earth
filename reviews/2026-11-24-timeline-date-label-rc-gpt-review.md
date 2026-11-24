# Timeline date label W1 — release-candidate review

24 November 2026 · Independent GPT review for Chad

**Outcome: PASS. No blocking finding. Ready for Chad's separate release approval, subject to the packet's fresh-main integration checks. Nothing is released or approved for execution by this review.**

Reviewed timeline-date-label-rc at **f646e2a07ce1fbcf8ba52a2053081e1bedc1d016** in TheOneTheOnlyTheChad/mother-earth. Read reviews/2026-11-24-timeline-date-label-rc.md and all fourteen hashed evidence files directly at that revision. The local mirror was older, so checks used a temporary exact-commit file set: downloaded files and locally reused inputs were verified against GitHub's commit-tree blob identities.

## Answers to §7

| Question | Ruling |
| --- | --- |
| 1. Is H then the Animals pin the intended order? | **Yes.** GitHub's comparison shows the actual chain dd16f2c → fbad1b6 → 251ab1f → f646e2a. The Animals constant equals the full stable H identity, fbad1b60bf1311528bde320d13b59637123265fc. No commit embeds its own or a future merge's hash. |
| 2. Is only 13h catching this change acceptable? | **Yes.** 13h compares timeline.html exactly. 13f checks the baseline, 13g checks timeline.js and 13i checks the Timeline stylesheet lines. Those other files/pin-availability conditions did not change. Their passing is expected, not a coverage gap. |
| 3. Anything else blocking the Approve line? | **No.** Keep the fresh-main/merged-tree checks and served-hash verification in the packet. Chad's earlier W1 build go is not the release approval. |

## Independent verification

The GitHub base-to-candidate comparison contains exactly the expected functional changes: one line each in the generator, generated page, two text checks and Animals baseline constant. Everything else added is packet/evidence material. The only changed served file is timeline.html.

Confirmed that the candidate page is exactly the previous page with the approved W1 text substitution. The ordered list of element ids is unchanged. tl-updated, the time element/date and tl-changes-link are preserved. The generator and both updated assertions use the same intended wording.

Ran independently:

- Generator --check: PASS; generated R3 catalogue remains byte-identical.
- timeline-changes-build: **49 passed, 0 failed**.
- timeline-catalogue-hub: **74 passed, 0 failed**.
- hub-alignment: **6 passed, 0 failed**.
- Syntax checks for the changed browser suites: PASS.

All fourteen supplied evidence hashes match SHA256SUMS. Claude's old-pin control fails exactly 13h with whole=false, links=true, header=true. The old-wording control fails exactly the new B text check. The reported full Animals 280/280, changes UI 173/173 and other browser-suite results remain **Claude's workspace evidence**; GPT did not independently rerun browser suites.

The 22 travel and 16 changes-UI breaks need not all be rerun merely for this text substitution: their targeted implementation is unchanged, and the supplied focused old-wording control exercises this change. No new phone or accessibility clearance follows.

## Release identities and boundary

| File | SHA256 |
| --- | --- |
| timeline.html, candidate | 9fa7b4e62dc30a01af6d41808d98a288475389c082ad80fabadf30a356c8f5e9 |
| timeline.js, unchanged | 55043697559b60d7470261afd88a790d0f07f1599c69165ee697788322d77524 |
| style.css, unchanged | 6b6115b2eaeef6d2e882dee888372d10e660fa48bb9ae267dea83688eff12956 |
| Animals test with TL_MAIN = H | bc15522c695c3449ba7268e5855e8432f783e09d4d474d1613ef6c32f6e58060 |

R3 remains 31,636 bytes, f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993. Hub remains 551,400 bytes, db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5. No new catalogue revision, R2 upload, hub deploy or cache-key bump is required for this isolated generated-text change.

On Chad's release line, follow the packet: fresh main, integrated-tree checks, push, obtain the actual merge identity, verify served HTML equals H's hash and script/style remain unchanged, then read the live label. Record the real merge for any future rollback; a rollback must revert the corresponding complete release change, including generator/test maintenance, without a catalogue or hub operation.

A later presentation-only release does not change the displayed catalogue date. That is now intentional and accurately labelled.

Real phone, Safari, screen reader, true 200% zoom and the separately listed live image-state checks remain open. Source refresh followed by the bounded Human relatives proposal stays next in the agreed feature order. Earth from Space Stage D remains uncleared.

No live page, account or production state was accessed or changed in this review.

