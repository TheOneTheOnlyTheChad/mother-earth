# Timeline T1 discovery inbox + T4 public "What changed" — proposal rev 2.1

Rev 1 written 12 Nov 2026 on Chad's go ("draft the Timeline T1 discovery inbox and T4 public 'What changed' proposal for GPT review"). **Rev 2 (12 Nov 2026) applies GPT's review of rev 1** (sha256 `b03f51e6…6ad9`, verified by GPT; "revise before branch build"). **Proposal only.** Nothing here is built, uploaded, deployed or released; each of those needs its own approval (§9).

Base: backlog §T (`docs/BACKLOG-VIEW-2026-11-08.md`), the live deep-time release (catalogue `tl-2026-11-R1`, page main `cc91165`, hub 0.6.8 serving R1 on the legacy and versioned routes), and the versioned-revision rules in `TIMELINE-CATALOGUE-REVISIONS-PROPOSAL.md` rev 1.1 (T3, done).

**What changed in rev 2 (GPT's six points):**
1. Inbox states: "reviewed" and "accepted" each name a specific version; both decisions are recorded; a material change after review goes back through review; branch-build go and page-release approval are distinct; "released" only after the matched pair is verified live (§2.3).
2. The public changes file and catalogue carry **no inbox reference**. The mapping lives in the private item (§2.2, §3.4).
3. "Evidence last reviewed" is an entry-wide review date, defined separately from each source's checked date. The rev 1 validator rule is withdrawn. Stated dates verified against the records. A differing-dates test added. The date-change fixture preserves each value's own citation and checked date. Withdrawals are deferred (§3.2–§3.3, §6).
4. Release day: planned UTC day with a cutoff, a live check of the actual day, and ID rules for a rebuild (§3.5).
5. GPT's wording recommended for C5 (§3.6).
6. Compatibility: asset versions bumped; R1 tested with its real page files and against its known pin; links tested both ways on the phone sheet; Pliny fragments in the anchor regression; the rollback trade-off stated (§4–§7, §9).

**Rev 2.1 (12 Nov 2026) applies GPT's re-check of rev 2** (sha256 `28c24f38…a768`, verified by GPT; the private inbox setup is ready for Chad's docs-only Go; C1–C5 remain Chad's):
- Approvals reference a **frozen review snapshot**, not the live item file (§2.3, §9).
- The privacy guarantee is stated precisely, and public evidence pointers are limited to records already suitable for publication (§2.1, §3.4).
- Cutoff: 22:00 UTC is the latest start; the first verified live observation is recorded; `previous` always names the last reader-facing release (§3.5).
- Phone Back: the visual close is reused without the Close button's handler; Back and Forward tested from both ways of opening an entry (§5, §6).
- The mixed pair (old HTML, new script) is named and tested (§4, §6).

## 0. Chad's brief, as given
- Keep the first delivery small.
- **T1:** show how a candidate moves from discovery to evidence review and into an approved release.
- **T4:** show one example of how a reader sees what changed and why, with the **release date** distinct from the date an entry's **evidence was last reviewed**.
- Preserve existing entry links and catalogue revisions.

## 1. The first delivery in one paragraph
One real item goes through the whole path: GPT's 10 Nov wording note on the end-Triassic entry ("extinction horizon" may slow a general reader; STATUS 10 Nov 06:53). It is logged in a private inbox (T1), checked against the source passage already on record, reviewed, accepted, and released as catalogue **`tl-2026-11-R2`**. That release also introduces the public **What changed** section (T4), which then holds two records: R1's first release (10 Nov) and R2's wording change. Each entry gains an **"Evidence last reviewed"** date. The wording change does not move that date, because it is an editorial check against the existing evidence record, so the reader sees a release dated after the evidence review it rests on. No date, source, lane, axis mark or link changes.

## 2. T1 — the discovery inbox

### 2.1 Where it lives (and why not the public repo)
- **Mac folder `research/timeline-inbox/`**, mirrored to the Claude Project. GPT reads it there.
- It holds unreviewed leads. The constitution says nothing unverified is shown, and reader tips can carry names or contact details, which stay out of the public repo (standing rule). **Only the reader-facing outcome is shipped** (§3.4). The guarantee, stated precisely *(rev 2.1, GPT)*: **inbox fields and private paths are kept out of shipped data and pages** (the changes file, the catalogue, `timeline.html`, `timeline.js`). This proposal and STATUS are public documents and do name the worked example and its proposed public change ID; that is the project record, not shipped data.
- $0: plain text files, no hub, D1, R2 or schedule.

### 2.2 Shape
- `INBOX.md`: one index row per item (id, kind, one-line summary, affected entry or "new", state, last state change).
- `items/TL-IN-0001.md` … one file per item; its **history section is append-only**, with real-clock times (START-HERE §9).
- Item ids `TL-IN-NNNN`, never reused. A rejected or parked item keeps its file and id.

| Field | What goes in it |
|---|---|
| Kind | new paper · newly digitised or uncovered record · correction · reader tip · source-scan lead · reviewer note |
| Source | link, plus citation or revision ID where one exists |
| What it might add or change | one short note, in our words |
| Affects | entry ID(s) and claim type(s), or "new entry" + lane |
| Logged | real-clock time and by whom (Chad, Claude, GPT, or "reader tip, relayed by Chad") |
| Evidence record | the evidence record once written (§2.4), with its sha256 |
| Decisions | the review decision and the acceptance, each naming the version it applies to (§2.3) |
| Outcome | released in `<revision>` as public change `<change ID>`, rejected (reason) or parked (reason). **This is the only place the inbox ID and the public change ID are linked.** |

Reader tips: the tip's substance only, paraphrased. No names, email addresses or phone numbers, even in the private copy, unless Chad says otherwise.

### 2.3 States *(tightened in rev 2, GPT)*
```
logged → triaged → in evidence review → reviewed → accepted → built → released (tl-YYYY-MM-Rn)
                 ↘ rejected (reason)     ↘ parked (reason) → back to triaged on Chad's word
```
- **triaged:** in scope for a lane that exists? Duplicate of another item? Out of scope or duplicate → rejected, with the reason.
- **in evidence review:** Claude writes the evidence record (§2.4) and the exact proposed wording or values. A source-scan lead or a reader tip **never skips this step**: it is a pointer, not evidence.
- **Review snapshot** *(rev 2.1, GPT)*: before review, Claude writes a **frozen snapshot file** beside the item (`items/TL-IN-0001.review-1.md`) holding the exact reader-facing wording or values and the sha256 of the evidence record. It is never edited; a later version is a new file (`review-2`). The live item file cannot be the reference, because its hash changes each time its history is appended.
- **reviewed:** GPT reviewed **that snapshot** and found it ready. The history records GPT's decision, the date and the snapshot's sha256. An earlier opinion (for example GPT's 12 Nov wording review) can be cited in the snapshot, but does not replace the review of the snapshot itself.
- **accepted:** Chad's **branch-build go** names the item **and the reviewed snapshot's sha256**. The history records it. This is the person's review before publication.
- **Material change after review:** if the claim, the wording or the evidence changes after "reviewed" (or after "accepted"), the item goes **back to "in evidence review"**, and the earlier decisions are kept in the history as superseded. Typo-level fixes that change no claim, value or wording shown to readers are recorded but do not reset the state.
- **built:** the item is in a branch candidate. Chad's **page-release approval is a separate, later line** (§9); the build go never implies it.
- **released:** set only after the **matched page and catalogue are verified live** (served-hash check of the page files, the catalogue read from the hub by revision ID with its exact hash, and a live read of the entry and the change record). The history records the revision ID, the public change ID and the measured time.
- Items can be accepted together (a batch; cadence rules are T5, later).

### 2.4 The evidence record (the minimum for the first delivery)
What the source actually supports (passage locator, paraphrase), date or range as stated, uncertainty as stated, citation, licence, publisher status and **the date it was checked**, credible disagreement where it matters. It also says which kind of check this was:
- **an entry-wide evidence review** (all the evidence behind the entry looked at together), which sets the entry's "evidence last reviewed" date;
- **a re-check of one source**, which updates only that source's checked date;
- **an editorial check against the existing record** (no source opened), which changes neither date.

Evidence already on record (research packets, REGISTER) can be cited instead of re-fetched; the record says which. The **dates-without-a-year shelf stays** (Pliny is untouched). A broader evidence workflow (full T2) is a later delivery.

### 2.5 Worked example: TL-IN-0001 (a real item, not a fixture)
| State | When | What happens |
|---|---|---|
| logged | the moment the inbox is created (real clock) | Kind *reviewer note*. Source: GPT's live smoke test of the deep-time release, relayed by Chad (STATUS 10 Nov 06:53). Might change: the claim label "Approximate age of the extinction horizon" and the phrase "coincides with the extinction horizon" on `e-big5-end-triassic`. |
| triaged | same session | In scope (existing entry, existing lane). No duplicate. |
| in evidence review | same session | **Editorial check against the existing record**; no source is opened. Claude compares the proposed wording (§3.6) with the He et al. 2020 passage already recorded (Results, sulfate sulfur-isotope trends; research packet `research/timeline-big-five/2026-11-10-claude/`). Test: the plainer words must say no more than the source does. Neither the source's checked date nor the entry's "evidence last reviewed" date moves. |
| reviewed | GPT's decision on the frozen snapshot `TL-IN-0001.review-1.md` (sha256 recorded) | The snapshot holds the §3.6 wording and the evidence record's hash, and cites GPT's 12 Nov wording review. GPT still reviews the snapshot itself. |
| accepted | Chad's branch-build go | The go line names TL-IN-0001 and the snapshot's sha256. |
| built | branch candidate | In `timeline-changes-rc`. |
| released | after the page release is verified live | Revision `tl-2026-11-R2`, public change `tl-2026-11-R2-1`. |

## 3. T4 — the public "What changed" section

### 3.1 What the reader sees (example; R2 contents as proposed)
Near the top of the Timeline page, one line under the coverage note:

> Timeline page updated **[R2 release date]** · revision tl-2026-11-R2 · [What changed](#changes)

At the end of the page, a section `#changes`, newest first:

> **What changed**
>
> **[R2 release date] — revision tl-2026-11-R2**
> - **Wording clarified: End-Triassic mass extinction.** The label "Approximate age of the extinction horizon" now reads "Approximate age of the extinction level in the rock record", with the matching change in the entry text. Why: plainer wording for a general reader. Dates, sources and the mark on the axis are unchanged. The entry's evidence was last reviewed 10 Nov 2026. [Open the entry](#e-big5-end-triassic)
>
> **10 Nov 2026 — revision tl-2026-11-R1 (first release)**
> - Added the conventional Big Five mass extinctions on the deep-time axis, placed on the ICS chart (v2026-06).
> - The Pliny entry (on this page since 9 Nov 2026) moved into the catalogue. It stays on the dates-without-a-year shelf.

In the End-Triassic entry itself, under its sources:

> Evidence last reviewed: 10 Nov 2026 · Changed in revision tl-2026-11-R2: [wording clarified](#change-tl-2026-11-R2-1)

### 3.2 Three dates, kept apart *(rev 2, GPT)*
| Date | Means | Set by | Shown |
|---|---|---|---|
| **Page release date** | the UTC day this page revision went public (§3.5) | the release | the "Timeline page updated" line and each What changed heading |
| **Evidence last reviewed** (per entry) | the last time the evidence behind the entry **as a whole** was reviewed | only an entry-wide evidence review (§2.4), recorded explicitly with a pointer to its record | on the entry, and in a change record that mentions it |
| **Source checked** (per source) | the last time that one source (passage and publisher status) was checked | a check of that source | in the source line, as today ("checked 10 Nov 2026") |

- An editorial check leaves both evidence dates alone. A re-check of one source moves only that source's date. **The latest source check is never used as the entry's review date**, and "evidence last reviewed" is never derived from the source dates.
- **Rev 1's validator rule is withdrawn** (it required the entry date to be no earlier than every source date, which would reject a legitimate partial re-check). Rev 2 validates only: every date is a real date; no source checked date and no "evidence last reviewed" date is later than the page release date; every entry has an explicit "evidence last reviewed" with its record pointer.
- **Stated dates, verified against the records (12 Nov):**
  - **Big Five entries: 10 Nov 2026.** Source check run 10 Nov 03:27:47–03:39:11Z and its rev 2 the same day (`docs/research/TIMELINE-BIG-FIVE-SOURCE-CHECK.md`); all six publisher pages read on 10 Nov (REGISTER: Harper by Chad; Percival, Burgess and Wilf by Claude; He and O'Connor by GPT on Chad's behalf); every source in the R1 catalogue carries `checked: 2026-11-10`.
  - **Pliny: 9 Nov 2026.** Passage checked 9 Nov 14:00:36Z (hash on the page); the EGU abstract's publisher page and withdrawal read 9 Nov (REGISTER); Test B closed by GPT the same day.
  - In R1 every entry's review date equals its sources' checked dates, so **real data has no differing case**. The test in §6 supplies one.

### 3.3 When a date changes (rule now; a test fixture only in the first delivery)
The first delivery contains no date change. The rule, which the tests exercise with a **synthetic fixture that is never published**:
- The change record shows the **old and new value side by side**, each as written (its `when_text`).
- Each side carries **its own snapshot**: full citation, DOI or link, locator, licence, source status and **checked date, copied into the change record at the time of the change** *(rev 2, GPT)*. A source key alone is not enough, because the entry's sources can be edited later and the history must keep what the change relied on.
- It states **why** (for example: new dating; source corrected; our earlier reading corrected).
- The entry keeps the old value visible under "Earlier dating", labelled with the revision it was shown in.
- Wording template (fixture): "**Date revised:** was ~X Ma (Source A, checked …); now Y ± z Ma (Source B, checked …). Why: …"

**Deferred to a later delivery:** actual withdrawals (an entry or source withdrawn after release) and any broader evidence workflow. The first delivery has change kinds `added` and `revised` only. The link-stability rule for a future withdrawal is noted in §4 but nothing is built for it now.

### 3.4 Where the data comes from (one source of truth)
- A new repo file **`phase1/timeline/changes.json`**: the public change records, written for readers. Each carries `id` (`tl-2026-11-R2-1`), `revision`, `kind` (`added` · `revised`), `entry`, `what` (`wording` · `date` · `source`), `before`, `after`, `why`, and, for `date` and `source` changes, the per-side evidence snapshots of §3.3. **No inbox field** *(rev 2)*.
- The generator copies these into the catalogue as `changes` (the full history up to that revision, so every revision is self-contained), fills each affected entry's existing `revisions` list with change IDs, and **pre-renders** the section into `timeline.html`, so it works without JavaScript.
- New per-entry fields, on axis and shelf entries alike: **`evidence_reviewed`** `{ date, record }` (the entry-wide date and a short public pointer to its record). **The pointer may name only a record already suitable for publication** (a document in the public repo, such as the research record or REGISTER); never a Mac research-packet path or an inbox path *(rev 2.1, GPT)*. Source `checked` dates stay where they are.
- New top-level **`release`**: `{ revision, release_date, previous }` (`previous: "tl-2026-11-R1"`).

### 3.5 Release day *(C3; rev 2, GPT)*
- `release_date` is the **reader-facing page release date**: the UTC day the Timeline page carrying this revision goes public. The catalogue object is deliberately exposed on the hub **before** that, by revision ID only, so the live candidate check can read it; that earlier exposure is not the release, and the page says "Timeline page updated".
- It is set to the **planned UTC day** at build time.
- **Cutoff** *(rev 2.1, GPT)*: **22:00 UTC is the latest start**, and the release is deferred earlier than that whenever there is not enough time left to verify the served files the same UTC day. If the day is missed, the release stops and the date is rebuilt.
- **After release:** STATUS records the **first verified live observation** (the measured time of the first served-hash check that shows the new files). That observation proves the page was live by then, not when it cut over: **if the checks straddle midnight UTC, it alone cannot prove the cutover day**, and the record says so instead of asserting a day. A confirmed mismatch with the page's date is a correction release (new revision), never a silent edit.
- **Rebuild rules:**
  - Before the catalogue object is uploaded or pinned: a date-only rebuild may keep the proposed ID (`tl-2026-11-R2`).
  - Once the object is **uploaded or pinned**, changed bytes get a **new ID and a new key** (`tl-2026-11-R3`), with the matched page and the hub pin regenerated together. The uploaded R2 object stays, unused. **`release.previous` still names the last reader-facing release, `tl-2026-11-R1`**, never a staged catalogue that no released page used, and What changed lists no release for the staged ID *(rev 2.1, GPT)*.
  - A **hash-only re-check** by GPT is enough only if the diff shows the date and its generated consequences (the rendered date, hashes, build id) are the sole changes. Anything else is a full review.

### 3.6 Wording for TL-IN-0001 *(C5; GPT's recommendation adopted as the lean)*
GPT: He et al. support the approximate age, the shift, and the coincidence in the three studied sections.
- Label: **"Approximate age of the extinction level in the rock record"**.
- Text: "**In each of the three sections studied**, a large sulfur-isotope shift **about** 201.5 million years ago coincides with **the level in the rock record that marks the extinction**."
- The same wording everywhere it appears: the catalogue (`claim_labels` and the claim's `label` and `text`), the axis labels in `timeline.js`, the pre-rendered card and entry, and the change record. The age (~201.5 Ma) and its approximate status stay as they are; the claim type key `extinction_horizon_approx` is an internal key and does not change.
- Rev 1's candidate ("the rock layer that marks the extinction") is withdrawn in favour of GPT's.

## 4. Links and revisions preserved
- **Entry IDs and anchors never change** (`#e-big5-…`, `#e-pliny-ep-6-16`, `#card-…`, and the Pliny section fragments `#e-pliny-ep-6-16-conv` and `#e-pliny-ep-6-16-debate`). The new anchors are additions only: `#changes`, `#change-<revision>-<n>`.
- **R1 is untouched:** same object, same pin (`096ae648…0fbe`, 15,656 B), still served at `/catalogue/timeline` (legacy, permanently) and `/catalogue/timeline/tl-2026-11-R1`. Pages already open keep working.
- **R2 is a new revision ID and a new R2 object** (`ref/timeline/tl-2026-11-R2.json`). The hub adds one pin to `TIMELINE_REVISIONS` and moves `TIMELINE_CURRENT` (metadata only). The page and catalogue are released as a matched pair with the existing hash checks (T3, unchanged).
- **Schema (C4):** `schema: 2` for R2 (GPT: fine). The R1-era page asks for R1 by its own revision, so it never meets schema 2.
- **Asset versions** *(rev 2, GPT)*: `timeline.html` gets a new `?v=` on `timeline.js`, and on `style.css` where its bytes change, so a new page cannot pair with the cached schema-1 validator. The page's build id is that same version, and the existing check (page build id = script build id, else no axis) stays. **What the pins do and do not preserve** *(rev 2.1, GPT)*: keeping the R1 and R2 pins preserves the axis for a reader holding a **matched page and script**. A version query on the same filename does not keep the old script on the server: an old R1 HTML page that has to fetch `timeline.js` again receives the new script. That mixed pair fails the build-id check, so it shows the static list with no axis until the page itself is reloaded. If `style.css` changes, `index.html` and `sources.html` get the standing `?v=` bump too (version string only).
- **A future withdrawal** would keep its entry ID and anchor so a link never dead-ends. Rule noted; not built in this delivery.

## 5. Page changes (first delivery)
- `timeline.html` (generated block): the "Timeline page updated" line, the `#changes` section, an "Evidence last reviewed" line on each entry, and a "Changed in …" link where an entry has revisions.
- `timeline.js`: `LABELS` takes the new label text; `validate()` checks schema 2, `release`, `evidence_reviewed`, the `changes` IDs, and that every entry ID in `changes` exists. The failure behaviour is unchanged: on any mismatch the axis is not drawn and the pre-rendered list (now including What changed) stays usable.
- **Links across the phone sheet** *(rev 2, GPT)*: on a phone the open entry is a modal sheet and the rest of the page is inert, so a bare fragment link cannot reach `#changes`. Behaviour (GPT agreed in its re-check): activating "Changed in …" closes the sheet, reveals the change record and moves focus to it; **Back reopens the same entry with focus on that link**. It **reuses the visual close and unlock logic only** (hide the sheet, release inert and the scroll lock) and **does not call the Close button's handler**: that handler navigates Back or replaces the history entry, which would consume the very state Back has to restore *(rev 2.1, GPT)*. The jump adds its own history entry instead. "Open the entry" from a change record opens the entry exactly as a card does; Back returns to the change record. On desktop the panel stays open and the page scrolls.
- `style.css`: a few rules scoped under `body.tl`. No behaviour change on the Earth now or Sources pages.

## 6. Tests (each with a break that must fail)
- **Generator:** a date later than the release date → refused; a missing `evidence_reviewed` → refused; a `changes` record naming an unknown entry → refused; **a source checked later than its entry's review date is accepted** (the partial re-check case). Breaks: `date-after-release`, `orphan-change`, `review-derived-from-sources`.
- **Differing dates** *(rev 2, GPT)*: a fixture entry with evidence last reviewed 10 Nov 2026, one source re-checked on a later day, and a later release day. The test asserts the **actual rendered values**: the entry shows the entry-wide date, the source line shows its own later date, the What changed heading shows the release day, and the change record quotes the entry-wide date. Break `review-date-from-release` and break `review-date-from-latest-source` each fail it.
- **R1 frozen** *(rev 2, GPT)*: the repo's `tl-2026-11-R1.json` is hashed directly against its known pin (`096ae648…0fbe`, 15,656 B) in a test of its own. The generator's `--check` follows `BUILD.json`, so with BUILD at R2 it says nothing about R1. Break: `r1-mutated`.
- **Hub:** the candidate hub returns R1's **original bytes on both routes** (legacy and versioned), and R2 only on an exact pin; legacy never follows current. Break: `legacy-follows-current` (exists).
- **R1 page on the candidate hub** *(rev 2, GPT)*: the **real R1 `timeline.html` and `timeline.js`**, taken from main at the pinned commit `cc91165` (not regenerated), run against the candidate hub; the axis draws from R1. And the reverse: the new page against a hub without the R2 pin shows the list and no axis.
- **Asset versions:** the new `timeline.html` references a `timeline.js?v=` different from R1's; a new page served with the old script draws no axis (existing build-id check). **Mixed pair the other way** *(rev 2.1, GPT)*: the real R1 `timeline.html` served with the **new** `timeline.js` draws no axis, and its static list, entries, sources and anchors stay fully usable with no script error. Breaks: `stale-js-version`, `guard-off` (the build-id check removed: the mixed pair must then fail visibly in the test).
- **Links, both ways, desktop and 390×844:** "Changed in …" from the open entry (on the phone: the sheet closes, the change record is visible in the viewport and **actually holds focus** (`document.activeElement`), Back reopens the same entry with focus on the link, Forward returns to the change record); "Open the entry" from the change record, then Back and Forward. **Each run twice: from a card-opened entry and from a direct entry link** *(rev 2.1, GPT)*. Breaks: `fragment-only-link` (the sheet stays open over an inert page), `back-loses-entry`, `close-handler-reused` (the jump calls the Close handler, so Back leaves the page or lands elsewhere).
- **Anchor regression:** every R1 anchor still resolves, including `#e-pliny-ep-6-16-conv` and `#e-pliny-ep-6-16-debate` as direct links (JS on and off). Break: `dropped-anchor`.
- **Date-change fixture (§3.3):** a synthetic catalogue with one revised date renders old and new side by side, each with its own citation and checked date; editing the entry's current source afterwards leaves the old side unchanged. Breaks: `old-value-hidden`, `snapshot-by-key`. The fixture is never published.
- Existing timeline suites (timeline-ui, timeline-axis, timeline-catalogue-hub) plus desktop-overflow and mobile-pass.

## 7. Cost, risk and rollback
- $0 expected: one R2 object (~16 KB, one Class A write) inside the allowances (billing check rev 2.1).
- Risk: small. The deep-time release path has been exercised once (R1). The new parts are the changes data, the date rules and the cross-sheet links.
- Not touched: other layers, collectors, crons, D1, history and the Earth now page.
- **Rollback after R2's page is live** *(rev 2, GPT)*:
  - **Page revert with both catalogue pins kept (recommended):** fresh loads get the R1 page and R1 catalogue; readers with a cached R2 page still fetch R2 and keep their axis.
  - **Hub rollback to 0.6.8** removes the R2 route: cached R2 pages lose the axis and fall back to the static list (still complete and readable). That is a **separate decision on its own Approve line**, and not needed for a page rollback, since the R2 pin is served only when asked for by ID.

## 8. Decisions for Chad (after GPT)
| # | Decision | Lean |
|---|---|---|
| C1 | First delivery = TL-IN-0001 released as R2 with What changed (as §1) | Yes |
| C2 | The inbox lives on the Mac + Project, outside the public repo, and nothing public refers to it | Yes (GPT agrees) |
| C3 | Release date = planned UTC day, with the cutoff, live check and ID rules of §3.5 | Yes (GPT prefers this) |
| C4 | Catalogue `schema: 2` for R2 | Yes (GPT: fine) |
| C5 | GPT's wording (§3.6) | Yes |

## 9. Approval lines (none given; each its own line, in order)
1. `Go: create the Timeline inbox (Mac research/timeline-inbox/ + Project) and log TL-IN-0001 (docs only)`
2. GPT reviews the frozen snapshot `TL-IN-0001.review-1.md` (Mac path and sha256 supplied).
3. `Approve: build timeline-changes-rc on a branch only — TL-IN-0001 review snapshot sha256 <hash>, What changed and evidence-last-reviewed per TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1; no merge, R2 write, hub deploy or page change.` (This is the acceptance of the item; it is not the page-release approval.)
4. GPT reviews the candidate.
5. `Approve: upload ref/timeline/tl-2026-11-R2.json (complete-file sha256 <hash>, <bytes> B) to R2`
6. `Approve: deploy hub 0.6.9 from <commit> (content only)` → live RC from the Pages origin (R1 routes return their original bytes, R2 exact, CORS).
7. `Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)` — the page release, inside the §3.5 cutoff. Then the live verification, and only then is TL-IN-0001 marked released.

## 10. Review record
- **Rev 1 → GPT (12 Nov):** revise before branch build; six points (applied in rev 2).
- **Rev 2 → GPT re-check (12 Nov):** states, dates, cutoff and phone Back agreed, with the five clarifications applied in rev 2.1. The private inbox setup is ready for Chad's docs-only Go. Next for GPT: the frozen item snapshot, once the inbox exists.
