# Animals journey context, C1a (zebra): final release tree for GPT's bounded release recheck

**Branch:** `animals-journey-context-proposal`. Release tree: the head that carries this record (STATUS gives its commit). Fresh main `bfdd370a` was merged at `bfa9cf00`.
**State:** final release tree, prepared for the recheck and then Chad's Approve line. Not merged and not deployed. The corridor (C1b) stays parked.
**Written:** 25 Nov 2026, 06:33 UTC (clock reading).
**Chad, 25 Nov:**
> "File GPT's review unchanged and prepare the final release tree. The loading choice, acknowledgement placement, rounding and disclosed area bases are accepted. Correct the macOS memory units and measurement record, regenerate the stale packet checksum, and include the exact REGISTER/Sources additions with the narrow test adjustment described in GPT's review. Keep all existing pins unchanged. Test that final tree on fresh main and return it for the bounded release recheck before my Approve line. No repeat extraction or downloads needed."

**GPT's candidate review** is filed unchanged at `reviews/2026-11-25-animals-journey-context-c1a-gpt-review.md`, sha256 `b4c1bb3d21a579998179a1710e2561ebd9a93a9db5efa1afe1bcd70c15afec44`. Its verdict: PASS for the feature, with four release items. Each is answered below.

## 1. Memory units and measurement (review item 1)

- **The premise needs a correction.** The build never ran on macOS. The "Mac shell" is a Linux VM on Chad's Mac: `Linux 6.8.0-149-generic aarch64`, Python 3.10.12, 4 CPUs, 3,906 MiB RAM.
  - On Linux, `ru_maxrss` is in KiB, so the old `/1024` gave MiB.
  - The old figure was therefore about right in size but labelled "MB" instead of MiB, and was described as a Mac figure. Both labels were wrong.
- **The fix:** `peak_memory()` in the builder.
  - darwin: bytes ÷ 1,048,576. Linux: KiB ÷ 1,024. Any other platform: the raw value with no conversion.
  - It prints MiB together with the raw value, its unit and the platform.
  - It never writes into the context file, which is unchanged (sha256 `6b67818b…a21e`).
  - A new builder control covers both platforms and the unconverted case.
- **Re-measured on the release builder** (`880dc87c…5ca3`), on the same VM:

| What | Value |
|---|---|
| Builder output | `built in 18.1 s; peak resident memory 104.7 MiB (ru_maxrss raw 107208 KiB, platform linux); 7879 bytes; sha256 6b67818b…a21e` then `CHECK OK: identical` |
| External: `/usr/bin/time -v` | maximum resident set 107,208 kbytes; wall clock 0:18.17; user 6.04 s; system 8.94 s |
| Builder controls | 17 passed, 0 failed |

  - Log: `reviews/evidence/2026-11-25-animals-journey-context/c1a-release-mac-build-check.log`. It holds the command, the hashes of every script and the platform.
  - The earlier "6.4–6.5 s" was a less-loaded run of the same build. Wall time varies with the Mac's load; the memory does not.
- **Candidate record:** its "105 MB" line keeps what was printed and now carries a correction note.

## 2. Packet checksum (review item 2)

The Mac packet `ChatGPT/Mother Earth/animals-journey-context-c1a/` has been rebuilt for this release tree.
- `SHA256SUMS.txt` is regenerated after the final record edits and covers every file under `run/`.
- The stale entry came from copying the record after its last edit without rerunning the manifest. That has been corrected and checked: `sha256sum -c` passes on the Mac.

## 3. REGISTER, Sources and the narrow test adjustment (review item 3)

**`sources.html`** gains exactly one line (sha256 of the file `99931b2a…5128`).
- The line is the paragraph "Historical regional land context for the zebra…".
- It sits directly after the zebra's source paragraph in the Animals section.
- It names:
  - NASA FIRMS (MODIS Collection 6 standard processing, file version 6.03, type 0, all confidence levels, read 25 Nov 2026);
  - the LANCE acknowledgement in its required form;
  - Hansen/UMD/Google/USGS/NASA GFC v1.13, tiles 10S_020E and 20S_020E, 30 % threshold, its credit, CC BY 4.0;
  - aggregates only;
  - detections are not fires;
  - the calendar-year mismatch;
  - the closing limitation;
  - the local-scale caveat.
- Nothing else in the file changes.

**`REGISTER.md`** gains two entries at the end:
- the FIRMS `MODIS_SP` area archive (C1a);
- Hansen GFC v1.13.

Each gives: read or download, request method, what is counted, gaps, terms and credit, what we ship, and commercial use. Both are "Filed: with the … release merge, on Chad's own Approve line", the wording of the zebra journey entry.

**`phase1/animals-tab-ui.test.cjs`** (now `77b7aa71…24cf`): the only test change. The diff is 13 lines added and 3 removed.
- It adds a constant `CTX_SOURCES`, holding the exact reviewed line.
- Check 13e for `sources.html` now builds its expectation from the file at **NC_MAIN**, with `CTX_SOURCES` inserted on the line after the zebra paragraph. It then compares the whole served file to that expectation **byte for byte**.
  - If the zebra paragraph is missing, or NC_MAIN already holds the block, the expectation is null and the check fails.
  - Every other 13e guarantee is unchanged: the Animals tab and menu links once each, main's header, the Animals section, the shortcut, the six source identifiers, the Low class, and no "private preview".
- Three new breaks: `ctx-sources-edited`, `ctx-sources-dropped` and `ctx-sources-moved`.
- The existing unrelated-edit controls still apply: `nc-sources-edited` (a space before `</title>`), `nc-sources-id-gone`, `nc-sources-shortcut-gone` and `nc-sources-tab-gone`.
- Section 13: 14 passed. All seven breaks were caught at "13e sources.html".

**Pins unchanged:**
- `BASE_MAIN` 0e62083
- `TL_MAIN` 643bb9a
- `NC_MAIN` 90eb522
- `NC_PARENT` 6bebff1

The Nature pin is not moved to an Animals commit, and 13e is not reduced to presence checks.

## 4. Final tree, tested on fresh main (review item 4)

**Production files changed against main `bfdd370a`:**

| File | sha256 | Change |
|---|---|---|
| `animals.html` | `4e75d051…c0ed` | as reviewed |
| `animals-context.js` | `a12594c1…55cc` | as reviewed |
| `style.css` | `3f8515c2…1c4d` | as reviewed; eight lines added |
| `assets/animals/zebra-botswana-Z3866-context-R1.json` | `6b67818b…a21e` | as reviewed |
| `sources.html` | `99931b2a…5128` | one line added |
| `REGISTER.md` | `929eef63…b7bc` | two entries added |

**Other changes, not served:**
- Tools under `phase1/animals/`. The builder is `880dc87c…5ca3`; the extractor, verifier and Hansen fetcher are unchanged.
- Tests and records.

**No hub change, no schedule and no provider call.**

**Runs on this tree** (logs in `reviews/evidence/2026-11-25-animals-journey-context/c1a-release-*.log`):

| Suite | Result |
|---|---|
| `animals-context-ui` | 30/0; all 12 breaks caught |
| `animals-tab-ui` (full) | 282/0, including 13e as above |
| `animals-census-ui` | 71/0 |
| `animals-corridor-ui` | 102/0 |
| `hub-alignment` | 6/0 (deployed hub 0.6.25) |
| Builder controls | 17/0, in the workspace and on the Mac |
| Extractor controls | 72/0 |
| Hansen download controls | 5/0 |
| Offline `--check` on the Mac with the release builder | OK, identical |

**Shared-file regressions.** `sources.html` and `style.css` are shared, so the suites that load `sources.html` were run:

| Suite | Result |
|---|---|
| `nature-context-ui` | 78/0 |
| `freshness-wording-ui` | 156/0 |
| `backdrop-layer` | 27/0 |
| `dustrgb-ui` | 67/0 |
| `kept-ui` | 18/3 |

- `kept-ui`'s three World View failures are **pre-existing**: the same three fail on fresh main `bfdd370a` with no branch changes (`c1a-release-kept-ui-main.log`). They are outside this change; recorded, not fixed here.
- The stylesheet's added lines are covered by 13d and 13i in `animals-tab-ui`.

**Not repeated:** the FIRMS extraction and the Hansen downloads (no need, per Chad).
**Not proven:** a real phone, Safari, a screen reader, print, 200 % zoom, and the live page.

## 5. After the recheck

1. If GPT passes this tree: Chad's own Approve line for the page release.
2. Then merge to main, check the hashes served by GitHub Pages, and do a scoped live check of the zebra block and the Sources line.
3. Then close the zebra branch work and record the device limits.
4. C1b (corridor) stays parked, with its proposal kept in the durable records (build brief §1, evidence §7), not left in progress.
