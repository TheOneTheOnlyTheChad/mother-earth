# Animals journey context — targeted extractor review

25 Nov 2026 · GPT · `animals-journey-context-proposal` at `e76d4de`

**Targeted HOLD: fix H1 and H2 below before the full FIRMS run.** The pilot remains accepted. Product choices, whole-file Hansen route, threshold and display decisions are not reopened. No production or provider action was taken.

## What passed independently

Read the extractor, verifier, control suite and evidence rev 1.2 §4b. The runnable Mac files match their plain-text packet copies:

| File | SHA256 |
|---|---|
| journey_context_firms_fetch.py | `91c115a0eccf6dbf0b1fa1c91d0e5eb3edc7014f81e3095396e7ee19cce28d77` |
| journey_context_verify.py | `d9d9b7dcdbdb4b99bda4d189276460e45ed0a6bc700c0ebc0ea4b78e43c380dc` |
| journey_context_firms_fetch.test.py | `befe9d88858e2c821fa5eae20bf76a95210b1cc11bcc01e36f4e1a605010e2ad` |

Ran `python3 -I journey_context_firms_fetch.test.py` independently on the Mac: **39 passed, 0 failed**. It uses a loopback stand-in and fake key. No request reached FIRMS and the real key was not read.

The five earlier fixes are substantially implemented: malformed key status stops; availability must cover the interval; response and aggregate byte checks run during reading; stored response bytes match their hashes; schema/time/type checks are stronger; final status and completion checks distinguish complete/stopped/invalid. The 81-request plan includes the keyless gap-list request and final status check. The observed-cost extrapolation is now an estimate. No second pilot is needed.

A usage check every 15 windows is a sampled stop policy, not proof that 3,000 transactions are reserved at every instant between checks. Keep that limitation in the record; don't call the estimated 755 a hard maximum. The script makes no reservation on the provider's shared key. This clarification does not require changing the accepted burst schedule.

## H1 — missing-data parsing can silently lose a real gap

**Independent reproduction, without network:** call `Run.gap_list()` with a substituted response body:

```json
{"success":true,"html":"<tr><td>2022-10-22</td><td>Terra (MODIS)</td><td></td><td></td></tr><tr class=\"gap\"><td>2008-03-01</td><td>Aqua (MODIS)</td><td></td><td></td></tr>"}
```

Observed `modis_days_listed_in_interval: []`. Expected either the 1 March 2008 Aqua gap or an explicit invalid/unknown result. The exact `<tr>(.*?)</tr>` regular expression silently ignores the attributed row, while the older plain row satisfies the “some rows exist” guard. Matching the live page's current hash does not test this future-format failure.

A separate response with an ordinary row dated `2008-02-31` is also accepted and listed. A date-shaped string is not necessarily a real date.

**Required correction:** parse rows without silently skipping attributed or nested markup, or detect unsupported row structure and fail closed. Standard-library HTMLParser is one option; a general HTML framework is unnecessary. Validate actual calendar dates. A changed/unrecognised MODIS satellite label must not quietly become “no MODIS gaps”. Preserve source provenance and the existing distinction between database gaps and local observation/cloud limitations.

Add focused offline controls: attributed MODIS row among valid rows; an impossible calendar date; malformed/unsupported MODIS row or label. Assert that no complete/no-gaps extraction results from an unreadable list. A valid list genuinely containing no gaps in the zebra interval must still pass. Do not pin the count to 171 rows as a substitute for parsing.

## H2 — verifier doesn't bind a complete folder to the planned extraction

**Independent reproduction using the suite's real successful stand-in run:** the extractor completed and `verify(out)` returned `[]`. Changed only the manifest's `area` from `20,-22,28,-18` to `0,0,4,4`: verifier still returned `[]`. Restored area and changed only `source` to `VIIRS_SNPP_SP`: it again returned `[]`. No CSV or hash was changed.

Thus it currently establishes file/hash integrity and window-list shape, but not the promised zebra/MODIS provenance. It also does not require the reviewed script identity or expected final status records. Do not advertise it as sufficient for the builder to trust the extraction until these are checked.

**Required correction:** validate a typed manifest against the fixed product, region, interval and approved extractor identity; exact planned window indices/dates/durations and filenames; complete request/status evidence including the successful final read below the stop threshold; and the existing file/hash checks. Reject paths outside the extraction folder. Independently validate the saved availability and gap-list provenance against their claimed meaning, reusing pure parsing functions where practical. Don't trust a changed cached summary merely because its raw-file hash still matches.

Malformed JSON shapes should return a clear NOT USABLE result, not an uncaught traceback. This is ordinary reproducibility validation, not a request for signatures or protection against coordinated rewriting of every input and the approved code. No new online verification is needed.

Add narrow controls for the wrong area/source reproductions, missing/wrong extractor identity, missing or bad final status, invalid manifest shape, and changed parsed availability/gap summaries. Retain the valid complete fixture and the prior alteration/missing/partial-file controls. The later builder must still parse the actual CSVs and perform clipping, deduplication and aggregate checks; a verifier is not a substitute for those scientific checks.

## What can continue

Claude may fix these two items on the same branch and return the exact replacement hashes with focused controls for a targeted recheck. No separate proposal or repeated provider pilot is necessary. Do not run the full year yet. Chad's extraction/download/build go follows the corrected check; the corridor remains parked. No change to the live site, hub, pin ownership or existing Animals data is part of this task.

The remaining observations in this review do not expand the hold. No full Hansen download/decoder assessment, live-site smoke, real-device test or provider request was performed. The public code/runtime remains untouched.
