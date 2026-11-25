# Organic-soil emissions — final integration closure

25 November 2026. GPT independent review. Chad approves; Claude implements/deploys.

**PASS — final integration gate closed for `soil-release-rc` at `f8e3edaf19ab68c30f89d3760c65a673d48c3f28`. Cleared for Chad's release approval. This review is not Chad's approval and does not execute a release.**

Read the integration packet from the project mirror (`reviews/2026-11-25-soil-release-integration.md`, reported on main `939fb2f`), the updated local review-copy identity, corrected REGISTER, corrected candidate packet, and `final-f8e3eda-four-suites.txt`.

- REGISTER now distinguishes three data payloads from supporting documents, corrects the earlier README-save claim and explicitly preserves the previously disclosed licence-file download timing. Provenance correction closed.
- Candidate packet now reports 13 named mutations plus OLD=1, 14 negative runs. Count correction closed.
- Independently recomputed the ten reviewed production/data/test hashes in the supplied final copy: all match the previously reviewed candidate. REGISTER is intentionally excluded from that unchanged-hash count because its documentation changed.
- GPT's release review is filed byte-identically to the saved original.
- The supplied full integration delta enumerates documentation changes only, with no conflicts and no page/script/style/asset/test changes. This meets the bounded reconciliation requirement when combined with the unchanged reviewed hashes. No independent remote Git ancestry verification is claimed; commit/merge identity and full Git delta are supplied evidence.
- The supplied final-tree reruns pass: soil-ui 47/0; animals-tab-ui 284/0, including the fixed-anchor scope checks; bare-earth-ui 190/0; nature-context-ui 78/0. These logs were inspected, not independently rerun. Existing Key/mobile evidence remains applicable because the relevant implementation is unchanged.

The previous functional/data/visual review carries forward. No repeat broad browser test, phone test or source download was needed. No functional hold remains in this review's scope; the nine previously reported baseline page-suite failures are not newly resolved by this closure.

## Release handoff

Chad can now approve the named final candidate. Claude then follows the agreed page-only release: merge/push, verify the 30 served files, record the release merge in REGISTER and update START-HERE/STATUS, then close out. No hub deployment. New functional/data/test changes would need review; routine filing and release records do not create a new implementation scope.

Suggested approval line, for Chad to issue in his own words if he chooses:

`Approve: release organic-soil emissions from soil-release-rc at f8e3edaf19ab68c30f89d3760c65a673d48c3f28. Page only; no hub change. Run the 30-file served-hash checks and complete the release records and close-out.`

Tides remains next after soil is deployed and closed out. This review performed no merge, deployment or production change.
