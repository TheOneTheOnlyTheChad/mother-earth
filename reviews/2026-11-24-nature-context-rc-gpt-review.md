# Nature context — Stage 1 candidate review

24 November 2026 · GPT independent reviewer · code `879cea8`, branch head `f4670a5`, baseline `6bebff1`.

**HOLD: three targeted corrections below before accepting this candidate.** The main wording, provenance and cell-age changes are sound. The passing suite misses an all-incomplete aggregate, an inspector/place inconsistency and a timezone-offset display error. Keep this on the existing branch; no new scope or proposal round is required. No release or Animals baseline change is cleared by this review.

## 1. Independent checks and limits

Read the packet, full page diff, new test suite, affected page logic and saved test/break logs. GitHub's baseline-to-head comparison confirms that the only production page files changed are `app.js`, `index.html` and `sources.html`; the other changes are tests and review/evidence records. No stylesheet, Worker or REGISTER file is in that diff.

All six supplied page/test files match exact code commit `879cea8`. Verified 36 supplied manifest entries after accounting for the documented Mac evidence-folder relocation. The 37th entry, the earlier GPT review, is absent from this partial review copy; its hash was verified against the retained original review instead. This is a packaging omission, not a hash mismatch. Include it in the next self-contained packet or make the external dependency explicit.

Independent execution on the Mac:

- **New suite Part A: 32 passed, 0 failed.** Executed the original fixture definitions and pure-row test function extracted in memory, against the candidate's unchanged `app.js`. Browser startup/dependencies were excluded; this was not a run of the full suite.
- **Existing `place-rows.test.mjs`: 7 passed.**
- Additional probes reproduced the three findings below, using the candidate's helpers/readings/report and the unchanged forest-inspector row-construction block.

No browser run was made by GPT. Playwright is unavailable in this local Node environment; the suite also requires fixed cloud-only dependency paths. Claude's full 58/58 run, 12/46 old-code control, twelve caught deliberate breaks and existing browser-suite results remain Claude's evidence. The saved logs are consistent with the packet. No live data, GNW query or production/account action was made by GPT.

## 2. H1 — no usable contributing counts becomes a source-reported zero

**Blocking.** `ME.forestSummary` starts at `n: 0`; `ME.readings` publishes that number whenever the envelope is fresh, even when `counted === 0`. All incomplete cells therefore produce a zero that the card calls source-reported. The report also states a numerical zero across zero contributing cells. This contradicts the accepted missing-versus-zero rule.

Reproduced with a fresh, successful forest envelope holding one cell:

```js
{ count: 5, confidence: { nominal: 5, high: 0 },
  since: '2026-11-16', version: 'v20261123',
  queried_at: '2026-11-24T06:10:00Z' }
```

The missing `highest` makes this count incomplete under the candidate's own policy. Actual results:

```text
forestSummary: n=0, cells=1, counted=0, missingCells=1
readings().forest.value: 0
fmt(value): 0 (source-reported zero)
report: 0 forest-disturbance alert pixels summed across 0 cells ...
```

**Required correction:** represent a total with no usable contributors as unavailable, with a count-completeness reason distinct from envelope freshness. Do not fabricate a source outage or say a fresh envelope is stale. Preserve genuine complete all-zero cells as valid zero; preserve a mixed sum over complete contributors with the exclusions stated.

**Regression cases:** all incomplete; empty cell map/no contributors; one complete zero; mixed complete and incomplete. Check card, report and Sources readings, not only the helper's accumulator. A deliberately restored zero-on-no-contributors implementation must fail.

## 3. H2 — the cell inspector bypasses the new count policy

**Blocking consistency gap.** The place row uses `ME.forestConf` to withhold an incomplete total, but the inspector's `Cell total` still uses raw `p.cell.count` in the generic row at `index.html:942`. The forest-specific branch adds confidence/query rows without replacing that total.

For the same fixture as H1, independent execution of the inspector row block gives:

```text
Place panel: count not available (highest not provided)
Inspector By confidence: nominal 5 · high 0 · highest not provided
Inspector Cell total: 5 alert pixels (10 m) ...
```

**Required correction:** use one documented count/completeness policy on both surfaces. Under this candidate's chosen policy, replace the forest inspector total with the shared validated known-category result and the same unavailable/exclusion qualification. If retaining a separately authoritative published `count` instead, that distinction must be explicit and consistent on the place/card/report surfaces too; do not silently use different meanings for the same count.

Add browser cases for incomplete confidence, missing raw count and disagreement between raw count and known-category sum. The present B7 case tests only a complete cell whose two totals happen to agree, so it cannot detect this bypass. Keep unexpected categories excluded and labelled without implying an all-category total.

## 4. H3 — valid timezone offsets are relabelled UTC without conversion

`ME.forestAge` accepts `ME.RUN_TIME` timestamps with numeric offsets, and correctly uses `Date.parse` for elapsed age. It then calls `when(iso)`, which takes the literal wall-clock portion and appends UTC. Thus one sentence presents an incorrect timestamp beside the correctly calculated age.

Independent probe:

```js
ME.forestAge('2026-11-24T08:10:00+02:00',
             Date.parse('2026-11-24T07:10:00Z'))
```

Actual: `queried 2026-11-24 08:10 UTC (60 min ago)`.
Correct instant: **06:10 UTC**, sixty minutes before the test clock.

**Required correction:** format the parsed instant in UTC, or deliberately accept only the hub's canonical Z format and mark other forms unsupported. Since the current validator explicitly accepts offsets, normalising the parsed instant is preferable. Do this narrowly for the new forest helper rather than broadly altering shared time formatters in this patch. Add an equivalent Z/offset pair and an offset-bearing future-skew boundary case. The hub's normal Z timestamps are unaffected by this finding.

## 5. Accepted work and continuation

The implementation correctly separates earliest detection, version provenance, cell query age and envelope run status. It does not fabricate a query end date. The strict four-day boundary and five-minute future handling pass the supplied pure fixtures. A stale successful envelope is no longer described as a failed run. Unknown start/version, pending/outside-coverage, partial zero, escaped confidence keys and retained-daily-snapshot wording are materially improved. The three existing assertion changes are justified by their documented wording changes; they do not weaken the count/zero rule itself.

The reported Animals result remains **277 passed, three expected failures**, not a passing suite. After the corrected page commit is independently accepted, its owner can prepare the narrow `NC_MAIN` maintenance candidate while retaining all prior Animals guarantees. Do not pin these currently held bytes merely to remove failures. `BASE_MAIN`, `TL_MAIN` and unrelated file comparisons remain unchanged.

Next: correct H1–H3 on `nature-context-rc`, add the focused regression cases and deliberate controls, then rerun the new suite and affected existing checks. List new exact code/head identities and hashes in the revised packet. No broad live smoke test is requested. Keep real phone, Safari, screen reader and live-data checks accurately open; REGISTER correction and publication remain later approved steps.

## 6. Reviewed identities

| File | SHA256 |
|---|---|
| `app.js` | `05bd243faec327ff688143def9fe18e7f4efcbd199c68b4511009d93b5b94a4f` |
| `index.html` | `98ec0ced5e697c92266974d01301783ead02e5e9a5f18550340a7225d0d4629a` |
| `sources.html` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |
| `phase1/nature-context-ui.test.cjs` | `b57d96e040a01b0995dfa15e9c2877d5338169139e9ea81955e086f27055268b` |
| Review packet | `7ad2169c822b2a7aafad186dca61206dddaee07ad27f0be2422e61d9fb9dea54` |

No repository file was edited by GPT. Earth from Space Stage D, soil integration and all other release approvals remain separate.
