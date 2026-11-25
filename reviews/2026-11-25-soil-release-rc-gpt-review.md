# Organic-soil emissions release candidate — GPT review

25 November 2026. Candidate reported as `soil-release-rc` `d2d597bc29a5853231cbe38c9a0830b0cb7d52dc`; payload `86071bfc4d019cd400019e98eed3ab49c1cf6415`; parent `af89de247471c768f047e40fb4a749e0e69f1d7d`. Packet reported on main `30a14b4`.

**Verdict: technical PASS for this candidate, with two records corrections and final fresh-main reconciliation still required before release clearance and Chad's approval. No merge to main, deployment or hub change is authorised by this review.** No new functional defect found in the reviewed scope. This is not a pass of a future merged tree that has not yet been produced.

## Evidence actually checked

Read the release packet from the project mirror, the complete preview-to-release `soil.js` diff, the relevant Animals maintenance implementation and supplied test summaries/controls. Read the soil Sources section and REGISTER entry. Independently hashed all 11 files in the packet's hash table: all match the supplied candidate copy. No independent remote Git/branch identity or ancestry verification is claimed; the Mac copy is an extracted tree and its reported commit identity comes from the packet.

The full table is 684,135 bytes, has 790 records, carries no fixture metadata and has the unchanged assessed SHA-256 `c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf`. The retired fixture asset and its cutter are absent from the candidate tree. The Python reference validator accepts the table. Independent gzip output is approximately 43 KB (compression settings affect the exact size); production transfer size has not been measured.

Independent execution of the candidate JS confirmed: no table fetch on startup; successful pinned full-table load; equality to the Python reference for 3,965 cell-period texts, 7,930 component classes and 6,183 number formats; explicit fixture rejection; empty-table rejection; unsupported-period unknown before sparse absence; 790 drained model polygons and 790 burned model polygons; one additional selected outline; and a single table fetch throughout these operations. These execution checks ran in a Node VM with a minimal DOM stub, not a browser renderer.

Opened the running localhost copy, which displayed the full-data wording and 790 cells for both components. Reviewed boreal and tropical coverage over actual dated imagery, zoom/rotation and the positive-cell inspector (`22_71`). The palette remains readable, hollow model zeros remain distinct, and the inspector retains the full caveats without sample wording. Interaction was usable in this bounded desktop check; no independently instrumented drawing-speed or phone/Safari benchmark was made. Screenshot: `SOIL-RELEASE-RC-GLOBE-2026-11-25.jpg`.

Claude's supplied evidence records 47 soil checks, Animals 284/0, restored fixture-dependent suites passing, and 42/51 page suites passing with nine reported baseline-equivalent failures. The five restored-suite main baseline summaries were inspected. The negative-control log was inspected. Those full browser suites, baseline-failure equivalence and Git scratch-commit controls were not independently rerun here: their hard-coded browser/globe/font dependency paths are unavailable in this workspace. No broad smoke test, source-data download or production operation was performed.

## C1 — Animals scope: PASS at the reviewed candidate

The literal 11-path `SOIL_FILES` set replaces the previous wildcard plan. 13m checks exact payload-path equality, ancestry, unchanged `app.js` scope, fixture absence and pinned table/soil-script identity. Historical 13j/13k and NC anchors remain; BASE_MAIN/TL_MAIN remain. Changed-file pins are moved selectively while independent Animals links/header/source/zebra assertions stay present. The 17-row check identifies exactly one soil row and still excludes journeys.

13n identifies the first Animals-suite maintenance commit after SOIL_MAIN and requires a sole SOIL_MAIN parent and only that test-file change. This handles the self-referential commit issue for the actual payload-plus-maintenance candidate. It is **not** a blanket proof that arbitrary later commits are scoped: it examines the first qualifying maintenance commit. Final integration must account for the whole post-candidate delta, and a later maintenance or production change needs explicit review. Do not market 13n as pinning every future commit or the entire final tree by itself.

The reported negative controls target the required failures. Their supplied log evidence supports acceptance alongside the code inspection. No further Animals refactor is requested.

## C2 — Full rendering: PASS within desktop scope

The browser served the full-data UI, not the earlier preview. Both components reported 790 cells. Northern and equatorial coverage, palette separation and cell inspector were checked against real imagery. The table and JS parity checks above support data/display consistency. Accept Claude's measured workspace timings only with their stated software-rendering environment; do not turn them into Mac or phone performance claims. No need to repeat all 51 suites merely for this review.

## C3 — Sources acceptable; correct REGISTER and control count

The Sources section correctly identifies model/year, separate components, whole-cell units, Mother Earth's aggregation, zero/missing states, lack of trend interpretation, uncertainty limitations, pinned file and attribution. No new Sources correction required in this pass.

**Records correction 1:** REGISTER says the downloads were made on Chad's yes and were “three files only”. Earlier accepted records explicitly include the separately saved `license_and_attribution.md` (and REGISTER itself says the README was downloaded). Change this to the three **data payloads** and separately account for supporting documentation. Retain the previously disclosed unintended licence-file download accurately in the private/appropriate research audit; do not rewrite it as occurring after permission. There is no need to reproduce temporary filenames or reopen the accepted incidental-download decision. This corrects provenance, not the licence or numerical conclusion.

**Records correction 2:** the supplied mutation log lists **13 named BREAK cases plus OLD=1**, totalling 14 negative runs. The packet's statement “all 14 breaks” overstates the number of named mutations. State “13 mutations plus the OLD=1 baseline control”. No extra artificial test is needed to make the old count true.

These corrections may be made in a narrowly scoped documentation follow-up. Preserve the meanings of the existing payload/maintenance anchors and explicitly list the follow-up paths; do not silently widen the historical payload manifest.

## Final integration gate

Before presenting Chad with the final Approve line:

1. Correct the two records statements above.
2. Reconcile current main into the release branch and identify the actual new main parent/final commit. Establish the actual delta rather than assuming main still has only the five Animals docs commits named in the packet.
3. Demonstrate no unreviewed production, data or test changes: compare the final tree to this reviewed candidate, enumerate the docs/reconciliation delta and retain the reviewed production/table hashes. Explain any conflict resolution.
4. Rerun the promised soil-ui, animals-tab-ui, bare-earth-ui and nature-context-ui on the integrated tree. Include the fixed-anchor scope results and final identity in a short return packet. If reconciliation changes affected Key/mobile code, rerun the corresponding suites too; otherwise their existing candidate evidence stands.
5. Return that bounded reconciliation evidence to GPT for closure. A documentation-only merge with unchanged reviewed production hashes does not need another broad review cycle, but the evidence must exist before calling the final tree cleared.
6. Then Chad's explicit approval names the cleared final commit. Deploy page only, verify the planned 30 served files, update release records and close out. No hub deployment.

T1 stays closed. The accepted dated-model principle, palette and scope decisions are not reopened. Tides remains the next implementation after soil is deployed and closed out.
