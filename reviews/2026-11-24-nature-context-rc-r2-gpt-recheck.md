# Nature context — Stage 1 rev 2 independent recheck

24 November 2026 · GPT independent reviewer · branch `nature-context-rc`, code `90eb522`, review head `29492a9`.

**PASS for the corrected fixture-preview candidate. H1, H2 and H3 are independently closed. The previous candidate HOLD is lifted for these bytes. This is not release clearance or approval to merge, publish, change an Animals pin or deploy a hub.**

## 1. Independent verification

Read rev 2's packet, rev-1-to-rev-2 page diff, changed logic and added regression checks. The candidate's `app.js`, `index.html`, `sources.html` and new suite match exact code commit `90eb522` on GitHub. All **44 SHA256SUMS entries verify** in the self-contained Mac packet; no missing input or mismatch remains.

Confirmed `sources.html` and both previously amended place suites are byte-identical to rev 1. The production correction diff is confined to `app.js` and `index.html`; the unchanged rev 1 scope and review boundaries remain applicable.

Independent execution on the Mac:

| Check | Result |
|---|---|
| Original new-suite fixture definitions and pure Part A, extracted in memory against unchanged candidate code | **41 passed, 0 failed** |
| Targeted H1–H3 probes, including readings/report and the candidate's inspector row-construction block | **8 passed** |
| Existing `place-rows.test.mjs` | **7 passed** |

These are code-level executions, not a browser run. GPT did not run the full Playwright suite, exercise a real device or use live data. The full Chromium and regression results below remain Claude's evidence.

## 2. Hold closures

**H1 — closed.** With no usable contributors, the summary's total is null, the readings/report say count not available, and the layer's successful fresh status is preserved. The card logic renders a dash and the completeness reason without a spurious highest-confidence zero. Empty cells remain unavailable. A genuine complete all-zero cell remains zero; a mixed total includes complete contributors and states the exclusions. Independent probes reproduce these outcomes.

**H2 — closed.** The inspector and place row now use `ME.forestCount`. An incomplete confidence set is unavailable on both; a missing raw count no longer prints undefined; a complete confidence sum is used consistently. A differing raw hub count is explicitly disclosed rather than silently replacing the sum. Independent execution of the inspector row block agrees with the place helper for all three cases.

**H3 — closed.** The forest helper formats the parsed instant in UTC. The offset/Z pair produces the same 06:10 UTC display and sixty-minute age. Offset timestamps exactly 300 seconds ahead remain explicitly ahead within tolerance; 301 seconds ahead is unknown. The shared `when()` formatter is unchanged.

No new blocking finding arose from this targeted recheck. This conclusion does not extend to unrelated timestamp handling elsewhere in the application.

## 3. Supplied test evidence

The logs support Claude's reported **78 passed, 0 failed**, all **15 deliberate breaks caught**, and the fifteen passing existing suites. The three new breaks restore the exact defects and fail their named checks:

| Break | Logged result |
|---|---|
| `zero-no-contributors` | 74 passed, 4 failed; A6/B15 |
| `inspector-raw-count` | 73 passed, 5 failed; B7/B16/B19 |
| `offset-literal` | 75 passed, 3 failed; A7 |

The old-code control is **13 passed, 60 failed** across 73 reported checks. Missing-helper groups collapse to single failures on the old page, so this is not an equal-count 78-check run; its disclosed behaviour still establishes that the old implementation fails the new requirements. Full-suite isolation logs record fixture-served hub requests and zero network escapes.

Animals remains **277 passed, three expected failures**: 13b, 13c (`app.js` only), 13e. This is accurately disclosed and is not a passing Animals suite.

## 4. Next step and release boundary

The accepted page bytes may form the basis of the separately reviewed Animals-owner `NC_MAIN` maintenance candidate. Keep the exact stable page-commit identity and all existing Animals link/header/Sources guarantees. Do not move `BASE_MAIN`, `TL_MAIN` or unrelated comparisons to remove failures. If production page bytes change again, identify and review the resulting difference before selecting the final pin.

A later release still requires the dated REGISTER correction, review of the narrow Animals patch, fresh-main reconciliation, affected-suite and Animals checks on the merged tree, Chad's own Approve line, and served-hash/live verification. This recheck requests no production action or broad smoke test. No hub deploy is needed for this page correction; the old hub description remains separately owned.

Real phone, Safari, screen reader and live-data validation remain open. Soil integration, global disturbance alerts and Earth from Space Stage D remain separate and uncleared by this result.

## 5. Accepted identities

| File at `90eb522` | SHA256 |
|---|---|
| `app.js` | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `index.html` | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` |
| `sources.html` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |
| `phase1/nature-context-ui.test.cjs` | `92acf1f5a2629509a371aee0b31bca0199ed902c9dbda8160153ce3fc9ad2a7b` |

No repository file, live service, account setting or external message was changed by GPT.
