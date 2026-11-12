# Timeline "What changed" + evidence last reviewed — candidate (branch `timeline-changes-rc`)

12 Nov 2026. Built on Chad's line: "Approve: build timeline-changes-rc on a branch only — TL-IN-0001 option A, review snapshot sha256 d7b895c5b0a5361e06ebbd05dacedd0a3727e27050ff5622b9f9938f2a405d8d, What changed and evidence-last-reviewed per TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1; no merge, R2 write, hub deploy or page change."

Proposal: `docs/concepts/TIMELINE-INBOX-AND-CHANGES-PROPOSAL.md` rev 2.1 (main). **Branch only.** Nothing is merged, uploaded, deployed or released. Production is unchanged: hub 0.6.8, page merge `7c3aa22`.

> **Rev 2 (code `eed6c28`, 12 Nov 10:56 UTC commit time) supersedes the `timeline.js` hash, the browser-suite counts and §3.5 below. See §9.** §1–§8 are kept as the rev 1 record GPT reviewed at `fe4cf18`; the rollback note in §8 is corrected in place and marked.

## 1. Candidate

Code commit `9f31fb6` (09:51 UTC commit time; branched from main `95ffad0`). This packet is a later commit on the same branch; the files below are unchanged after `9f31fb6`.

| File | sha256 | Change |
|---|---|---|
| `phase1/timeline/catalogue/tl-2026-11-R2.json` | `2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356` (18,120 B) | **new** catalogue revision, schema 2 |
| `phase1/worker.js` | `3e791a5c7ea501ac89c87e355aef1defed81456ef5bc6d80a0f8de1750d1c49d` (293,542 B) | hub **0.6.9**: R2 pin added, `TIMELINE_CURRENT` = R2. No route code changed |
| `timeline.html` | `2f5a246c31ac56f75d58e89ad6fa30d3f3c7b353a8681243420cda0a8e86fda5` | generated: page-updated line, review line per entry, What changed; `?v=202611301000` |
| `timeline.js` | `7db7754f3b4186aeb1bff858c71c5a39d428ab91127b2fde8038fc6ba82abce2` (28,341 B) | label, schema-2 validation, the "Changed in …" jump; `BUILD` `202611301000` |
| `style.css` | `e48b3fc067ea755848fa9bfc822d7074743485e7ac74a9d134c48e2514febc69` | 11 rules, all under `body.tl` |
| `index.html` | `5d2d284c934628fb58f05d3a2d89da6b72b92b714f0cf32690b447539fef43aa` | `style.css?v=` string only |
| `sources.html` | `5c3e4a7e7dc00087c572ea0e2262f26bfd7f467a7d2fa25c0b23cf01f267f937` | `style.css?v=` string only |
| `phase1/timeline/changes.json` | `155915436ace7e7c9f37d3a6fd6e7948512c48603a636d534f72f1164a9c6d1a` | **new**: public change records and release list |
| `phase1/timeline/build_timeline.py` | `78f26e7a565d10a479f96efc65530b5cddee366586b88cc498153eb9b4a90d20` | generator: new fields, rendering, refusal rules, `--src` |

- **Unchanged:** `app.js`, `arts.js`, `sky.js`, `skyscene.js`, `oceanheat.js`; **`tl-2026-11-R1.json` (`096ae648…0fbe`, 15,656 B)**. No schema.sql, cron, variable or R2 layout change.
- **After a release, five of the ten served page files change:** `timeline.html`, `timeline.js`, `style.css`, and `index.html` and `sources.html` by their `style.css?v=` string only.
- `BUILD.json`: revision `tl-2026-11-R2`, generated 2026-11-12T09:34:14Z, schema 2, **release_date 2026-11-12**, previous `tl-2026-11-R1`.
- New test files: `phase1/timeline-changes-build.test.mjs`, `phase1/timeline-changes-ui.test.cjs`. Edited tests: `timeline-axis`, `timeline-catalogue-hub`, `timeline-ui`, `osmc-reliability-hub`, `osmc-reliability-ui` (§5).

## 2. What was built

**The approved wording (review snapshot 1, option A), in every place it appears**
- Label "Approximate age of the extinction level in the rock record": catalogue `claim_labels`, the claim's `label`, the axis labels in `timeline.js`, the card line and the entry heading.
- Text "In each of the three sections studied, a large sulfur-isotope shift about 201.5 million years ago coincides with the level in the rock record that marks the extinction."
- The value (~201.5 Ma, approximate) and the source line (He et al. 2020, checked 10 Nov 2026) are unchanged. The old wording survives only inside the change record.
- A test compares R1 and R2 after removing the new fields and that one label and text: **the rest of the catalogue is identical** (no date, source, lane or mark moved).

**Catalogue schema 2**
- `release` `{revision, release_date, previous}`; `releases` (R1 10 Nov 2026 "first release", R2); `changes` (the full public history: `R1-1`, `R1-2` added; `R2-1` revised wording).
- Each entry and the shelf entry: `evidence_reviewed` `{date, records}` and `revisions`. Big Five 2026-11-10; Pliny 2026-11-09. Only End-Triassic lists a revision.
- Source `checked` dates are untouched (all 2026-11-10).

**Page (pre-rendered; works without JavaScript)**
- Under the coverage note: "Timeline page updated 12 Nov 2026 · revision tl-2026-11-R2 · What changed".
- Every entry ends with "Evidence last reviewed: <date>"; End-Triassic adds "· Changed in revision tl-2026-11-R2: wording clarified" (a link to its record).
- A last section "What changed", newest release first. The R2 record and the entry line are the snapshot's text word for word (tested on the rendered page).
- New anchors only: `#changes`, `#change-<revision>-<n>`.

**Page script**
- Validation for schema 2: release block, release list, each entry's review date (present, valid, not after the release day), change records (ids, kinds, entries known, and each record present on the page). Any failure → the axis is not drawn and the list, including What changed, stays usable, as before.
- **"Changed in …" jump:** on a phone the sheet is closed with a new `closeVisual()` (moves the entry home, hides the sheet, releases inert and the scroll lock; no history call, no focus move). The jump then pushes its own history entry, scrolls to the record and focuses it. **The Close handler is not called.** Back returns to the entry's own history entry, reopens it and focuses the link used. On desktop the panel stays open and the page scrolls.
- "Open the entry" in a record is an ordinary entry opener; Back closes the entry and returns focus to that link.

**Hub 0.6.9**
- `TIMELINE_REVISIONS` gains the R2 pin (`ref/timeline/tl-2026-11-R2.json`, the hash and size above); `TIMELINE_CURRENT` = R2 (metadata only); `TIMELINE_LEGACY` stays R1. `COLLECTOR_VERSION` 0.6.9. The diff is 11 lines; no route logic changed.

**Generator refusal rules** (each tested, each with a break)
- A review date or a source checked date after the release day; a missing or invalid review date; a source whose status text and checked date disagree.
- A change naming an unknown entry; a repeated or malformed change id; a kind other than added / revised.
- A wording change whose "after" is not what the catalogue says, or whose "before" is not what the previous release said (read from the frozen R1 file).
- `previous` naming anything but the last reader-facing release; a release list not ending with this build.
- **Privacy:** an `inbox` field, an inbox id, an inbox path, a private research path, `_review/`, `_to_delete` or a `/Users/` path anywhere in the catalogue bytes; an evidence record that is not a file in the public repo.
- A source checked **after** the entry-wide review, both on or before the release day, is **accepted** (the partial re-check case), and the entry-wide date is never derived from source dates.

**Date changes (rule built, fixture only)**
- The generator renders a `date` change with each side's own evidence snapshot, and an "Earlier dating" section in the entry. No date change exists in R2; only the synthetic fixture exercises it. Withdrawals are not built (kinds are `added` and `revised` only).

## 3. Differences from proposal rev 2.1, for GPT

1. **Record shape.** A change record carries `entries` (a list; the R1 "added" record names five) where the proposal said `entry`, plus `title`, `short` and `unchanged` for the approved sentences. `evidence_reviewed` carries `records` (a list of public repo paths) where the proposal said `record`. The pointers are in the catalogue and are **not rendered** on the page.
2. **`releases` list.** Added beside `release`, so headings and the "previous" rule come from one list.
3. **One new Tab stop before the axis.** The "What changed" link in the page-updated line comes before the period list. The axis suite's Tab-order check was updated to expect it.
4. **Focus after Back needs a second attempt.** Chrome drops the focus set during `popstate` when it then handles the entry's fragment. The link is focused again on a zero-delay timer, the same pattern `focusSoon` already uses. Found by the test.
5. **History keys continue across a reload** (`seq` starts from the current history entry's key). Limit: after a reload in the middle of a history stack, a Forward entry can carry a higher key than new ones, so the "Back from an entry opened from the record" rule could misjudge direction once. Not tested.
6. **Desktop Back from "Open the entry"** closes the panel even if the same entry was already open in it before the jump. Consistent with Back from a card-opened entry.
7. **Private-reference check** looks for `tl-in-<digit>` and `timeline-inbox/` (the path), not the bare word, because the proposal's own public file name contains "TIMELINE-INBOX" and is cited in a code comment in `timeline.js`.
8. **The R1 page files in the tests come from git** at the pinned commit `cc91165` (hash-checked against the released hashes), and the previous hub from `95ffad0`. A fresh clone needs `git fetch --depth=400 origin main`.

## 4. Tests

All run 12 Nov 2026 on `9f31fb6` in Claude's workspace (headless Chromium, software renderer). **Emulation only: no real phone, no screen reader, no live hub.**

**New: `timeline-changes-build` — 45 / 45.** Breaks, each fails: `date-after-release` 2 · `orphan-change` 1 · `review-derived-from-sources` 1 · `r1-mutated` 1 · `inbox-allowed` 2 · `private-record-allowed` 2 · `after-unchecked` 2 · `previous-unchecked` 1.

**New: `timeline-changes-ui` — 135 / 135.** The hub in this suite is the real `worker.js` answering in-process with an in-memory R2. Breaks, each fails: `fragment-only-link` 18 · `back-loses-entry` 14 · `close-handler-reused` 8 · `no-focus` 8 · `no-schema2-validate` 12 · `guard-off` 2 · `stale-js-version` 1 · `dropped-anchor` 3 · `review-date-from-release` 2 · `review-date-from-latest-source` 1 · `old-value-hidden` 3 · `snapshot-by-key` 3.

What the browser suite covers, by GPT's points:
- **R1 compatibility:** the real R1 `timeline.html` + `timeline.js` against the candidate hub → axis on, one request for R1, **R1's original bytes** (known pin). The legacy URL on the candidate hub also returns R1's bytes while R2 is current. The frozen R1 file is hashed against its literal pin in its own check (not via `--check`).
- **Mixed pairs:** R1 page with the **new** script → build guard, axis off, static list complete, an entry opens with its source link, no script error. New page with the **old** script → the same. With the guard removed (`guard-off`) the test fails.
- **Hub states:** new page on the previous hub 0.6.8 (no R2 pin) → 404, static list. New page on the candidate hub before the R2 upload → 503, static list.
- **Links both ways,** at 390×844 and 1280×860, each from a card-opened entry and from a direct entry link: the sheet closes, nothing is inert, the scroll lock is released, the record is in view below the header and not covered, **`document.activeElement` is the record**, the jump adds one history entry; Back reopens the same entry with focus on the link; Forward returns; "Open the entry" and Back; two more Backs prove the jump did not consume the entry's history entry.
- **Anchors:** every id on the released R1 page exists on the candidate page; `#e-pliny-ep-6-16-conv` and `-debate` work as direct links with JavaScript on (entry opens, section expanded) and off.
- **Three dates, rendered:** on the real page and on a partial re-check fixture (source 11 Nov, entry-wide review 10 Nov, release 12 Nov), the entry line, the source line, the release heading and the change record each show their own value.
- **Date-change fixture:** old and new side by side; the old side keeps Burgess 2017 and "checked 10 Nov 2026" after the entry's current source is replaced; "Earlier dating" names the revision that showed it.
- **Schema-2 validation:** 13 malformed catalogues (hash matched, so only validation can refuse) → axis off, list and What changed still there.

**Existing Timeline suites:** `timeline-ui` 585 / 585 · `timeline-axis` 96 / 96 (8 breaks each fail) · `timeline-catalogue-hub` 73 / 73 (7 breaks each fail; now on the real R1 + R2 table, with a fixture third revision).

**Full regression, one sequential run, 09:51–10:16 UTC:** 51 suites run, **50 green**; 4 manual/network tools skipped (`orbital`, `search.realdata`, `ships-probe`, `spacetrack-probe`).
- **One failure, not from this change:** `terminator-ui` 18 / 19 (rendered day/night shading: 103 of 104 probes agreed, one probe at 30°S 20°E). Rerun alone, it passed 19 / 19 on all four runs whose counts were captured (104 of 104 probes); four further reruns were made without capturing the count. `index.html` differs from main only in the `style.css?v=` string, and `app.js` is unchanged. Recorded as an intermittent failure of that suite; its cause was not investigated.
- Included and green: `desktop-overflow` 112, `mobile-pass` 131, `sky-zoom-ui` 333, `oceanheat-ui` 109, `orbital-browser` 113, `osmc-reliability-ui` 41, `search-ui` 104, all hub suites.

## 5. Test edits to existing suites
- `timeline-axis`, `timeline-ui`: read the current revision from `BUILD.json` instead of a hard-coded R1; Tab order (§3.3); label text.
- `timeline-catalogue-hub`: the real table is now R1 + R2; R1 checked against a literal pin; new checks that both R1 routes return R1's bytes while R2 is current, that R2 is served only by its own id and pin, and the pre-upload 503.
- `osmc-reliability-hub`, `osmc-reliability-ui`: hub version "at least 0.6.8" instead of equality (START-HERE §4r's own rule).

## 6. Not done, not verified
- **Live checks:** nothing is uploaded or deployed. CORS from the Pages origin, the real hub's R1 and R2 responses, served hashes: all after the separate approvals.
- **Worker CPU** for the new pin: not measured (the route code is unchanged).
- **Real phone, Safari, screen-reader announcement:** not tested. Focus is asserted in Chromium only.
- **The reload-in-mid-history limit** in §3.5.
- **Release date:** the catalogue says 2026-11-12. If the page is not released today (latest start 22:00 UTC), the date is rebuilt: same ID if nothing has been uploaded or pinned, else a new ID (proposal §3.5). Either rebuild changes the catalogue hash, the hub pin and `timeline.html`.

## 7. For GPT
1. §3.1–§3.2: are the record shape and the `releases` list acceptable departures?
2. §3.4–§3.6: the focus retry, the history-key rule and the desktop Back behaviour.
3. §3.7: is the narrowed private-reference check still the guarantee you asked for?
4. Smoke test: Mac `_review/timeline-changes-rc/` (exact branch copy with `SHA256SUMS`). The axis needs the hub, so against production it shows the static list ("axis unavailable"), which is the expected pre-upload state; `_review/timeline-changes-rc-preview/` reads the local catalogue so the axis draws (one-line change, README inside).
5. Anything to change before the upload, deploy and release lines?

## 8. Next (each its own Approve line; none given)
1. `Approve: upload ref/timeline/tl-2026-11-R2.json (complete-file sha256 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356, 18,120 B) to R2`
2. `Approve: deploy hub 0.6.9 from <final branch commit> (content only)` → live RC from the Pages origin.
3. `Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)`.

**Rollback** *(wording corrected in rev 2, GPT)*: page = revert the merge, keeping both pins. That preserves the axis **only for a reader who still holds a matched R2 page and R2 script** (both cached, or neither re-fetched). A reader whose cached R2 page has to fetch `timeline.js` again receives the reverted script; that mixed pair fails the build check and shows the static list until the page is reloaded. Fresh loads get the R1 page and R1 catalogue. Hub = 0.6.8 `85737a48…c427` is a separate decision: it removes the R2 route, and every cached R2 page falls back to the static list.

## 9. Rev 2 — after GPT's review of `fe4cf18` (12 Nov 2026)

**GPT's review (relayed by Chad):** hold the upload, deploy and merge lines pending a focused branch fix.
- Accepted: the `entries` and `records` lists and the `releases` list (§3.1–§3.2); the guarded focus retry and the desktop Back behaviour; the narrowed privacy check (no private inbox id or path found in the shipped page, script, public changes data or R2 catalogue; the public proposal filename in the script comment is fine).
- GPT's independent checks passed: 318 manifest entries, generator 45/45, hub 73/73, the exact candidate's static fallback, the preview's five axis marks; the Worker diff limited to the version and the Timeline pin and current metadata.
- **Defect (GPT, reproduced on desktop and at 390×844 in Chrome, no reload):** Open End-Triassic → Changed in … → Open the entry → Changed in … → Back ×3. The third Back reopened the original entry but focused its heading instead of "Changed in …". Cause: rev 1 kept **one** jump in page memory (`jump`), so the second jump overwrote the first one's return target.
- Asked for: the return target stored with each jump's history state; explicit transition data instead of inferring direction from numeric history keys across reloads; the repeated-jump regression and a reload-with-Forward-history case; the terminator result kept as intermittent with cause unverified; the rollback note qualified.

**The fix (`timeline.js` only; `eed6c28`)**
- **Each jump's history state carries its own return target:** `{ change, k, p, from: { entryK, link } }`. Back onto an entry reads the link from **the state being left**, so an older jump restores its own link. The single in-memory `jump` is gone.
- **Explicit transition data:** every state the page pushes records `p`, the key of the history entry it was pushed from; entry states also record `oid`, the id of the control that opened them. "Back from an entry that was opened from this record" is now `left.entry && left.p === st.k`, read from the two states. **No rule compares the size of keys.**
- **`at`** holds the state of the history entry the page is on. It starts from `history.state`, so it survives a reload; it is updated on every push, replace and `popstate`, and on `hashchange` (a plain fragment link adds an entry without `pushState`).
- **Keys are unique across reloads of the tab:** they start from the clock, never below a key already in use. Rev 1's §3.5 limit (a possible misjudged direction after a reload in mid-history) no longer applies; that paragraph is superseded.
- Unchanged: `closeVisual()`, the focus retry, the desktop panel behaviour, validation, every other file.

**Hashes (rev 2).** Only `timeline.js` changed among served files:

| File | sha256 |
|---|---|
| `timeline.js` | `713ecd4fad97908addc40d5767c961e76ec078e59b7523b61f2d8456810d8fad` (29,113 B) |
| `timeline.html` | `2f5a246c31ac56f75d58e89ad6fa30d3f3c7b353a8681243420cda0a8e86fda5` (unchanged) |
| `style.css` | `e48b3fc067ea755848fa9bfc822d7074743485e7ac74a9d134c48e2514febc69` (unchanged) |
| `index.html` | `5d2d284c934628fb58f05d3a2d89da6b72b92b714f0cf32690b447539fef43aa` (unchanged) |
| `sources.html` | `5c3e4a7e7dc00087c572ea0e2262f26bfd7f467a7d2fa25c0b23cf01f267f937` (unchanged) |
| `phase1/worker.js` | `3e791a5c7ea501ac89c87e355aef1defed81456ef5bc6d80a0f8de1750d1c49d` (293,542 B, unchanged) |
| `phase1/timeline/catalogue/tl-2026-11-R2.json` | `2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356` (18,120 B, unchanged) |

**Release date rechecked at 10:56 UTC, 12 Nov:** `BUILD.json` still says release_date 2026-11-12, and the generator's `--check` passes on the committed page, catalogue and script build. The date holds only if the page is released today (latest start 22:00 UTC); otherwise it is rebuilt before any upload and the catalogue hash, the hub pin and `timeline.html` change. **The hashes must be rechecked again immediately before any approval line is acted on.**

**Tests (rev 2, on `eed6c28`)**
- **`timeline-changes-ui` 173 / 173** (was 135). New block F2, at 390×844 and 1280×860:
  - GPT's sequence with all three Backs and three Forwards;
  - reload on the entry with Forward history kept → Forward reaches the record, Back focuses the link;
  - reload while on the record's history entry → "Open the entry" and Back, then Back to the entry with focus on the link;
  - reload on an entry that was opened from the record → Back closes it onto the record's opener, Back again restores the original entry and its link;
  - a plain fragment link after the jump does not disturb the return target.
- **Breaks, each fails (14):** `single-jump-memory` 8 (rev 1's defect, re-created: the failures are exactly "Back 3" and the three reload cases, at both sizes) · `no-return-target` 20 · `fragment-only-link` 38 · `back-loses-entry` 20 · `close-handler-reused` 10 · `no-focus` 16 · `no-schema2-validate` 12 · `guard-off` 2 · `stale-js-version` 1 · `dropped-anchor` 3 · `review-date-from-release` 2 · `review-date-from-latest-source` 1 · `old-value-hidden` 3 · `snapshot-by-key` 3.
- **`timeline-ui` 585 / 585.** Two of its break anchors pointed at lines this fix rewrote (`close-keeps-fragment`, `shortcut-fragment`); they were repointed, and all 12 breaks were rerun and fail (`script-only` fails with several failures and then stops on an exception, as it also does without this fix).
- Rerun on `eed6c28` and green: `timeline-axis` 96, `timeline-changes-build` 45, `timeline-catalogue-hub` 73, `desktop-overflow` 112, `mobile-pass` 131, `terminator-ui` 19.
- **Not rerun in full:** the other 44 suites. The change since the full run at `9f31fb6` is `timeline.js` and two test files; no other page loads `timeline.js`.
- **`terminator-ui`:** still recorded as an intermittent failure (18 / 19 once in the full run), **cause unverified**.

**Still not done:** live checks, Worker CPU, real phone, Safari, screen reader. Focus behaviour is asserted in headless Chromium only; GPT's reproduction was in Chrome.

**For GPT (rev 2):** does the repeated-jump sequence now behave correctly in your Chrome, on desktop and at 390×844? Mac `_review/timeline-changes-rc-r2/` (exact, `SHA256SUMS`) and `_review/timeline-changes-rc-r2-preview/`.

**Approval lines, updated (none given):**
1. `Approve: upload ref/timeline/tl-2026-11-R2.json (complete-file sha256 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356, 18,120 B) to R2`
2. `Approve: deploy hub 0.6.9 from <final branch commit> (content only)` → live RC from the Pages origin.
3. `Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)`.
