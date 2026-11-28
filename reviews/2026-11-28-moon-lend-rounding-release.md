# LEND readout-rounding fix — release record

28 Nov 2026 · Claude · Moon item 6 follow-up · page only; no hub, data, colour, withholding, Sources or REGISTER change.

**Chad's Approve line (his message, 28 Nov):** "Approve: release the LEND readout-rounding fix from `moon-lend-rounding` at `f0c7625` to main, page only; no hub or data change."

**GPT:** review PASS on `f0c76251964ec2b01f73f1016cfae723a1874839`. Filed unchanged as `reviews/2026-11-28-moon-lend-rounding-gpt-review.md` (sha256 `0e2deba9…e75c`, equal to the Mac copy).
- GPT independently checked the formatter against Python `Decimal` `ROUND_HALF_UP` for every integer percentage from −2000 to +2000, every estimate from 0 to 50, and all 11,656 shown cells.
- On the signed-zero question it said to keep the candidate as written: −0.04% reads "−0.0%" and an exact 0 reads "0.0%".
- It noted a typo in my chat summary: the validation ran 02:15–04:09 UTC (04:15–06:09 SAST), as the packet and logs record, not "06:15–06:09".

## Merge

- **Main recheck before the merge (04:33 UTC):** `origin/main` was `a4a4953`, my docs-only records commit. Since the branch base `542b689` it changed only `HANDOVER.md`, `STATUS.md` and the checklist. Served code had not moved.
- **Merge:** `4b646ea` merges `f0c7625` into `a4a4953`, commit time 04:33:34 UTC, pushed 04:33:37 UTC. The merged tree differs from `f0c7625` only in those three record files.
- **Before pushing:** the manifest's sha256 at the merged tree is `943d243ba41a61807f9d5d0f38ae48413a0337cd95a6522256829931c4c320b1`, equal to the reviewed hash, and `served_manifest.mjs --check` reports 55 match.
- **Records-only merge:** `cbb62ca` (the candidate packet) merged after the release.
- **Rollback:** `git revert -m 1 4b646ea`. That restores the LEND release's formatter and cache key; the data is unaffected either way.

## Served verification (04:35:48 UTC, browser pane, `cache: 'no-store'`)

- **Publish:** GitHub Pages for `4b646ea` completed successfully at 04:34:37 UTC.
- **Expected list:** taken directly from the reviewed manifest file `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json` (hash checked as above). It was not regenerated from a later tree.
- **Result:** every path compared on status, byte length and sha256 against `https://theonetheonlythechad.github.io/mother-earth/`: **55 of 55 match**.

## Live check (04:35–04:36 UTC, browser pane, active foreground tab; bounded, not a performance or full regression test)

- **Released file loaded:** the reloaded page uses `moonsci.js?v=202612280400`.
- **Off by default:** no LEND request at start.
- **Cell 1604** (88.75°S, 82.25°E; stored −0.84 and 0.35) reads **"−0.8% ± 0.4 pp"**, the corrected rounding GPT named. Under the released formatter it read ± 0.3. Cell 1608 (stored 0.35) also reads ± 0.4.
- **Negative percentage tie:** cell 1601 (stored −0.85) reads **"−0.9%"**.
- **Formatter on the live page:** −85 → "−0.9%", 35 → "0.4 pp", −4 → "−0.0%", 0 → "0.0%".
- **Behaviour:** "Lit as now" on → LEND on → height → LEND (still one LEND file request) → off. The prior lighting came back on and the legend is hidden again.

## Records

- Checklist rev 35 closes the follow-up; STATUS and HANDOVER updated.
- The original LEND release record (`reviews/2026-11-28-moon-lend-release.md`) and both manifests (`…-moon-lend-manifest.json`, `…-moon-lend-rounding-manifest.json`) are kept unchanged.
- **Review logs:** the Mac folder `_review/moon-lend-rounding/` (84 files, checked against its SHA256SUMS) is kept as `reviews/evidence/2026-11-28-moon-lend-rounding-review-logs.tgz` (175,456 B, sha256 `18a105b08b95cf8c41137e2e5e5721e62379bf541cdeb22002b18bf4db315329`; 85 files with the SHA256SUMS; no PDFs).

## Exceptions carried (GPT)

- **osmc-reliability-ui:** an incomplete test (missing fixture history), not a pass.
- **smoke-fixes:** an open baseline exception with its fire-record failures and timeout.
- **timeline-mixed-assets, kept-ui, ux-round1:** results match main.
- **tides-ui T1a:** a branch-scope check.

## Not verified

Real phone, Safari, a screen reader, hardware graphics and device performance, as before.

## Close-out

- **Branch `moon-lend-rounding`:** fully contained in main. It is deleted on the GitHub branches page after this record is pushed, and its worktree is removed.
- **LAMP (item 7) is not started.**
