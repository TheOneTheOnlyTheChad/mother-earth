# Nature context — proposal rev 2 review

24 November 2026 · GPT independent reviewer · snapshot `0ab5fa5`.

**PASS for the bounded Stage 1 fixture-preview plan, with the implementation requirements below carried into the candidate. No further proposal round is needed for these details. Recommend N3 yes and Chad's N7 go for the branch-only preview. This review supplies neither owner approval nor release clearance.**

Read rev 2, the appended research amendment and the earlier GPT review. Compared all three public files with exact repository snapshot `0ab5fa5`: byte-identical. Inspected the existing Animals comparisons, forest place endpoint and page freshness logic. No browser suite or production smoke test was run for this docs-only review; no provider/account operation was made.

## 1. G7 — date and provenance wording

**Yes.** “First detected on or after <since>, as held in version <id>, queried <time>” resolves the earlier date-window correction. Keep the distinct unknown messages and do not substitute envelope dates or invent an upper endpoint from the version name. Show the actual version id as provenance, not as a certified dataset date or freshness guarantee.

The mixed-cell total, partial-coverage zero and earliest-detection caveats are accepted. The explanatory “normally 7 days before its scheduled query” describes the collector's initial filter choice; it must not reappear as a claim that each returned cell covers seven days. F14 should reject fixed-window claims on the actual returned cell while permitting that clearly qualified explanation.

The appended research amendment preserves history appropriately. One remaining historical sentence in research §2 says the window runs to the version's content date. Mark that interpretation superseded as well: verified dataset temporal coverage can be described separately, but the filter has no explicit upper bound and the page does not hold that metadata.

## 2. G8 — Animals migration

**The proposed three-file exception is narrow enough. Prefer option (ii): exact files at an immutable reviewed page commit H, plus the independent Animals guarantees.** This is clearer than subtracting patch hunks from pages that already have permitted Animals differences. The Animals owner implements and reviews the actual test patch; this proposal does not authorize that patch or a blanket baseline advance.

Keep `BASE_MAIN`, `TL_MAIN`, the other 15 script comparisons, stylesheet comparisons and Moon/Sun comparisons unchanged. `NC_MAIN` must identify the reviewed page commit, not a later moving branch tip or maintenance commit containing its own pin. Check the actual H diff against an explicit allowed path list; pin inequality alone proves little about scope. List test/document changes separately from the three production page files.

**A header check alone is insufficient for Sources.** Preserve the substance of existing 13e as well as byte equality at H: the Animals section, its Sections shortcut, all six source identifiers, the Low-use-class explanation and the exclusion of “private preview.” Preserve the Animals tab/menu links exactly once and the corresponding header guarantee for both pages. Inspecting the existing suite confirms these are protections already present, not new product requirements.

The candidate must demonstrate that unreviewed edits to each newly pinned file are caught, and that removing an Animals link or a required Sources element is caught by the independent guarantee even when a proposed baseline also lacks it. Continue the established missing-baseline fail-closed behaviour. The test-maintenance commit follows stable reviewed H; the final merged tree must pass before any authorized publication push.

Expected failures 13b/13c/13e during the first preview are acceptable when disclosed. Do not describe that preview as a fully passing Animals suite. No unrelated failure is silently accepted.

## 3. G9 — future-skew tolerance

**Accept five minutes as a project display tolerance, not evidence that a timestamp in the future is fresh.** Keep the literal query timestamp. For a timestamp slightly ahead of the page clock, avoid negative “ago” text: say it is ahead of the page clock, within the tolerance; do not derive a positive freshness claim from it. Beyond five minutes, query age is unknown as proposed. Missing/malformed times are likewise unknown.

Exercise just below, exactly at and just beyond the five-minute boundary. Retain the separate strict four-day rule: exactly four days is not “older than four days.” The actual elapsed age must be available for valid past timestamps; dataset version and envelope age remain separate.

## 4. G10 — fixture additions and one wording correction

F1–F17 cover the major previous gaps. Add these focused cases to the new suite, or show that existing tests already exercise the precise behaviour:

- **Stale envelope with `source_status: ok`, retained cell:** do not print “the latest forest run did not succeed” merely because the envelope is old. Staleness shows that the last recorded run is old; explicit `down` supports the failure statement. Keep the cell's own query-age assessment independent. This corrects §3.1's current stale-OR-down clause.
- **Mixed-cell summary:** at least two cells with different starts, versions and query times; card/report must not flatten them into a common interval. Include an unresolved cell version so it is not silently omitted in a way that implies complete provenance.
- **Pending cell:** no count becomes zero, no query time or first-asked time is invented, and opening/loading the panel does not switch a globe layer on.
- **Future-skew boundaries:** the three cases in §3 above, including displayed age text. Keep malformed dates and impossible calendar dates distinct from missing values where relevant.
- **Collection line:** a fixed response representing multiple same-day queries must display retained daily snapshots, not a count of all queries. Do not imply a pixel-level history. This is a page-fixture check; no new database write is needed.

Apply unknown-category qualification wherever the affected count is presented, not just one panel row. Preserve the zero-valued unknown-key case and escape provider-derived keys/text before inserting HTML. Missing confidence values must not become an invented valid zero.

The preview must fulfil the promise of saved-data-only operation: intercept the needed place/forest requests, stub other startup requests as needed, and fail or abort unexpected hub/provider data requests. Record zero escaped requests; two route patterns alone do not prove isolation if the normal page also starts other requests. This requires no runtime GNW metadata fetching.

Retain the proposed old-code control, deliberate wording/freshness breaks, affected-suite runs, 360 px overflow and keyboard/focus checks. Report assertions changed in existing suites individually, with their reasons. Real phone, Safari and screen reader remain open unless actually checked.

## 5. Owner decisions and boundaries

- **N3: recommend yes.** Page-owned corrected forest descriptions should replace the known-wrong hub wording on every listed page surface. Keep the original hub string as a separately owned backlog item; no hub deploy for this preview.
- **N7: recommend go for `nature-context-rc` from fresh main**, limited to the fixture preview and tests described here. Chad supplies that go. No merge, publication push, hub change, storage write, schedule or REGISTER filing follows from this review. A dated REGISTER correction belongs to the later approved release.
- Soil C1's aggregation cautions accurately carry the prior review forward. Its methods assessment, downloads and integration remain separate and uncleared. Global disturbance alerts remain parked. Animals permissions and Earth from Space Stage D are unaffected.

The next review should examine the concrete branch candidate and evidence, including the implementation requirements above, rather than repeat the Stage 0 assessment.

## 6. Input identities

| File at `0ab5fa5` | Bytes | SHA256 |
|---|---:|---|
| `docs/concepts/NATURE-CONTEXT-PROPOSAL.md` | 20,550 | `cecabfc576550d5e0ff53e27eacc2cb10899bbecdf916682421f720be52e8b03` |
| `docs/research/NATURE-CONTEXT-STAGE0-2026-11-24.md` | 15,795 | `cb0a8ff8b8af189eff3dac5d15573d7f2f63fce59a11a36d0f834369fbcba2ac` |
| `reviews/2026-11-24-nature-context-stage0-gpt-review.md` | 13,579 | `8d2f375d2aa674550823a4c70d586b9b67bb3bc76f0bf2b2612dedd9d0a25ef3` |

The filed earlier review matches the Mac review identity. GPT changed no repository file in this check.
