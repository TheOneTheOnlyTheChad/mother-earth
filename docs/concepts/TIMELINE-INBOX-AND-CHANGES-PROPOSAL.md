# Timeline T1 discovery inbox + T4 public "What changed" — proposal rev 1

Written 12 Nov 2026 on Chad's go ("draft the Timeline T1 discovery inbox and T4 public 'What changed' proposal for GPT review"). **Proposal only.** Nothing here is built, uploaded, deployed or released; each of those needs its own approval (§9).

Base: backlog §T (`docs/BACKLOG-VIEW-2026-11-08.md`), the live deep-time release (catalogue `tl-2026-11-R1`, page main `cc91165`, hub 0.6.8 serving R1 on the legacy and versioned routes), and the versioned-revision rules in `TIMELINE-CATALOGUE-REVISIONS-PROPOSAL.md` rev 1.1 (T3, done).

## 0. Chad's brief, as given
- Keep the first delivery small.
- **T1:** show how a candidate moves from discovery to evidence review and into an approved release.
- **T4:** show one example of how a reader sees what changed and why, with the **release date** distinct from the date an entry's **evidence was last reviewed**.
- Preserve existing entry links and catalogue revisions.

## 1. The first delivery in one paragraph
One real item goes through the whole path: GPT's 10 Nov wording note on the end-Triassic entry ("extinction horizon" may slow a general reader; STATUS 10 Nov 06:53). It is logged in a private inbox (T1), checked against the source passage already on record, accepted, and released as catalogue **`tl-2026-11-R2`**. That release also introduces the public **What changed** section (T4), which then holds two records: R1's first release (10 Nov) and R2's wording change. Each entry gains an **"Evidence last reviewed"** date. The wording change does not move that date, because no evidence was re-checked, so the reader sees a release dated after the evidence review it rests on. No date, source, lane, axis mark or link changes.

## 2. T1 — the discovery inbox

### 2.1 Where it lives (and why not the public repo)
- **Mac folder `research/timeline-inbox/`**, mirrored to the Claude Project. GPT reads it there.
- It holds unreviewed leads. The constitution says nothing unverified is shown, and reader tips can carry names or contact details, which stay out of the public repo (standing rule). Only the **outcome** of an accepted item enters the repo, as a public change record (§3.3).
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
| Evidence record | the T2 record once reviewed (§2.4) |
| Outcome | released in `<revision>`, rejected (reason) or parked (reason) |

Reader tips: the tip's substance only, paraphrased. No names, email addresses or phone numbers, even in the private copy, unless Chad says otherwise.

### 2.3 States (one direction, except "parked")
```
logged → triaged → in evidence review → reviewed → accepted → released (tl-YYYY-MM-Rn)
                 ↘ rejected (reason)     ↘ parked (reason) → back to triaged on Chad's word
```
- **triaged:** in scope for a lane that exists? Duplicate of another item? Out of scope or duplicate → rejected, with the reason.
- **in evidence review:** Claude writes the evidence record (§2.4). A source-scan lead or a reader tip **never skips this step**: it is a pointer, not evidence.
- **reviewed:** GPT has reviewed the evidence record (paths only, as now).
- **accepted:** Chad's branch-build go names the item. That is the person's review before publication the backlog asks for. Items can be accepted together (a batch; cadence rules are T5, later).
- **released:** set only after the page release's served-hash check, with the revision ID.

### 2.4 The evidence record (T2-lite, the minimum for the first delivery)
What the source actually supports (passage locator, paraphrase), date or range as stated, uncertainty as stated, citation, licence, publisher status and **the date it was checked**, credible disagreement where it matters. Evidence already on record (research packets, REGISTER) can be cited instead of re-fetched; the record says which. The **dates-without-a-year shelf stays** (Pliny is untouched). Full T2 is a later item.

### 2.5 Worked example: TL-IN-0001 (a real item, not a fixture)
| State | When | What happens |
|---|---|---|
| logged | the moment the inbox is created (real clock) | Kind *reviewer note*. Source: GPT's live smoke test of the deep-time release, relayed by Chad (STATUS 10 Nov 06:53). Might change: the claim label "Approximate age of the extinction horizon" and the phrase "coincides with the extinction horizon" on `e-big5-end-triassic`. |
| triaged | same session | In scope (existing entry, existing lane). No duplicate. |
| in evidence review | same session | No new evidence is needed. Claude compares the proposed wording with the He et al. 2020 passage **already recorded** (Results, sulfate sulfur-isotope trends; checked 10 Nov 2026; research packet `research/timeline-big-five/2026-11-10-claude/`). Test: the plainer words must say no more than the source does. Candidate wording in §3.5. **No source is re-fetched, so the entry's "evidence last reviewed" stays 10 Nov 2026.** |
| reviewed | after GPT | GPT checks the wording against the same recorded passage. |
| accepted | Chad's branch-build go | The go line names TL-IN-0001. |
| released | after the page release | Revision `tl-2026-11-R2`. |

## 3. T4 — the public "What changed" section

### 3.1 What the reader sees (example; R2 contents as proposed)
Near the top of the Timeline page, one line under the coverage note:

> Timeline updated **[R2 release date]** · revision tl-2026-11-R2 · [What changed](#changes)

At the end of the page, a section `#changes`, newest first:

> **What changed**
>
> **[R2 release date] — revision tl-2026-11-R2**
> - **Wording clarified: End-Triassic mass extinction.** The label "Approximate age of the extinction horizon" now reads "Approximate age of the rock layer that marks the extinction", with the matching change in the entry text. Why: plainer wording for a general reader. Dates, sources and the mark on the axis are unchanged. The entry's evidence was last reviewed 10 Nov 2026. [Open the entry](#e-big5-end-triassic)
>
> **10 Nov 2026 — revision tl-2026-11-R1 (first release)**
> - Added the conventional Big Five mass extinctions on the deep-time axis, placed on the ICS chart (v2026-06).
> - The Pliny entry (on this page since 9 Nov 2026) moved into the catalogue. It stays on the dates-without-a-year shelf.

In the End-Triassic entry itself, under its sources:

> Evidence last reviewed: 10 Nov 2026 · Changed in revision tl-2026-11-R2: [wording clarified](#change-tl-2026-11-R2-1)

That is the distinction Chad asked for: **release date** (when this revision went public) on the changes list and page line; **evidence last reviewed** (when the sources behind an entry were last checked) on each entry. A wording release does not move the review date. A source re-check does, even when nothing else changes.

### 3.2 When a date changes (rule now; shown here as a test fixture only)
The first delivery contains no date change. The rule, which the tests exercise with a **synthetic fixture that is never published**:
- The change record shows the **old and new value side by side**, each as written (its `when_text`), each with its own source and checked date.
- It states **why** (for example: new dating; source corrected or withdrawn; our earlier reading corrected).
- The entry keeps the old value visible under "Earlier dating", labelled with the revision it was shown in, so the history is not lost from the entry itself.
- Wording template (fixture): "**Date revised:** was ~X Ma (Source A, checked …); now Y ± z Ma (Source B, checked …). Why: …"

### 3.3 Where the data comes from (one source of truth)
- A new repo file **`phase1/timeline/changes.json`**: the public change records, written for readers. Each carries `id` (`tl-2026-11-R2-1`), `revision`, `kind` (`added` · `revised` · `withdrawn`), `entry`, `what` (`wording` · `date` · `source` · `status`), `before`, `after`, `why`, `evidence` (source keys), `inbox` (`TL-IN-0001`, an opaque ID, not rendered).
- The generator copies these into the catalogue as `changes` (the full history up to that revision, so every revision is self-contained), fills each affected entry's existing `revisions` list with change IDs, and **pre-renders** the section into `timeline.html`, so it works without JavaScript.
- New per-entry field **`last_reviewed`** (date), on axis entries and shelf entries alike. The generator refuses a catalogue where `last_reviewed` is earlier than any of the entry's source `checked` dates, or later than the revision's `release_date`.
- New top-level **`release`**: `{ revision, release_date, previous }` (`previous: "tl-2026-11-R1"`).
- Values for R2: Big Five `last_reviewed` = 2026-11-10 (every source checked that day); Pliny = 2026-11-09 (passage and EGU withdrawal both checked that day).

### 3.4 Release date honesty (decision C3)
The release date is inside the catalogue bytes, and the bytes are hashed and reviewed before release. **Lean:** set `release_date` to the planned UTC release day at build time. If the page release slips past that day, rebuild with the new date before releasing (new hash, a hash-only re-check by GPT), never relabel after the fact. **Alternative:** show the build's preparation date ("prepared …"), which is always true but is not the release date Chad asked for.

### 3.5 Candidate wording for TL-IN-0001 (for GPT)
- Label: **"Approximate age of the rock layer that marks the extinction"**.
- Text: "In all three sections studied, a large sulfur-isotope shift at about 201.5 million years ago coincides with **the rock layer that marks the extinction**."
- Every other field of the claim is unchanged.

## 4. Links and revisions preserved
- **Entry IDs and anchors never change** (`#e-big5-…`, `#e-pliny-ep-6-16`, `#card-…`). The new anchors are additions only: `#changes`, `#change-<revision>-<n>`.
- **A withdrawn entry keeps its ID and anchor.** It shows "Withdrawn on <date> — why", leaves the axis, and is listed in What changed. A link to it never dead-ends. (Rule only; no withdrawal in the first delivery.)
- **R1 is untouched:** same object, same pin, still served at `/catalogue/timeline` (legacy, permanently) and `/catalogue/timeline/tl-2026-11-R1`. Pages already open keep working.
- **R2 is a new revision ID and a new R2 object** (`ref/timeline/tl-2026-11-R2.json`). The hub adds one pin to `TIMELINE_REVISIONS` and moves `TIMELINE_CURRENT` (metadata only). The page and catalogue are released as a matched pair with the existing hash checks (T3, unchanged).
- **Schema (decision C4):** lean `schema: 2`. Only the new page reads R2, and an explicit shape change is clearer. The R1-era page asks for R1 by its own revision, so it never meets schema 2.

## 5. Page changes (first delivery)
- `timeline.html` (generated block): the "Timeline updated" line, the `#changes` section, an "Evidence last reviewed" line on each entry, and a "Changed in …" link where an entry has revisions.
- `timeline.js`: `LABELS` gains the new label text; `validate()` checks schema 2, `release`, the `changes` IDs, and that every entry ID in `changes` exists or is a recorded withdrawal. The failure behaviour is unchanged: on any mismatch the axis is not drawn and the pre-rendered list (now including What changed) stays usable.
- `style.css`: a few rules scoped under `body.tl`. No change to the Earth now or Sources pages.

## 6. Tests (each with a break that must fail)
- **Generator:** `last_reviewed` before a source's checked date → refused; after `release_date` → refused; a `changes` record naming an unknown entry → refused; R1 bytes unchanged (`--check` on R1). Breaks: `review-after-release`, `orphan-change`, `r1-mutated`.
- **Hub:** R1 legacy and versioned routes byte-identical to today; R2 served only on an exact pin; legacy never follows current. Break: `legacy-follows-current` (exists).
- **Page:** What changed renders without JS; the release date and "evidence last reviewed" are distinct elements, each with its own `<time>`; every entry anchor from R1 still resolves; a cached R1 page against hub 0.6.9 still draws. Breaks: `review-date-from-release`, `dropped-anchor`.
- **Date-change fixture (§3.2):** a synthetic catalogue with one revised date renders old and new side by side with both sources. Break: `old-value-hidden`. The fixture is never published.
- Existing timeline suites (timeline-ui, timeline-axis, timeline-catalogue-hub) plus desktop-overflow and mobile-pass.

## 7. Cost and risk
- $0 expected: one R2 object (~16 KB, one Class A write) inside the allowances (billing check rev 2.1).
- Risk: small. The deep-time release path has been exercised once already (R1). The new parts are the changes data and the date rules.
- Not touched: other layers, collectors, crons, D1, history and the Earth now page.

## 8. Decisions for Chad (after GPT)
| # | Decision | Lean |
|---|---|---|
| C1 | First delivery = TL-IN-0001 released as R2 with What changed (as §1) | Yes. Alternative: ship What changed with only R1's record (still needs an R2, but it would carry no change). |
| C2 | The inbox lives on the Mac + Project, outside the public repo | Yes |
| C3 | Release date: set at build, rebuild if the release slips (§3.4) | Yes |
| C4 | Catalogue `schema: 2` | Yes |
| C5 | The §3.5 wording (or GPT's alternative) | GPT first |

## 9. Approval lines (none given; each its own line, in order)
1. `Go: create the Timeline inbox (Mac research/timeline-inbox/ + Project) and log TL-IN-0001 (docs only)`
2. `Approve: build timeline-changes-rc on a branch only — inbox item TL-IN-0001, What changed and evidence-last-reviewed per TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 1; no merge, R2 write, hub deploy or page change.`
3. GPT reviews the candidate.
4. `Approve: upload ref/timeline/tl-2026-11-R2.json (complete-file sha256 <hash>, <bytes> B) to R2`
5. `Approve: deploy hub 0.6.9 from <commit> (content only)` → live RC from the Pages origin (R1 routes unchanged, R2 exact, CORS).
6. `Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)`.

**Rollback:** page = revert the merge (its own Approve line); the R1 page and routes keep working throughout. Hub = 0.6.8 `85737a48…c427` (its own line; harmless to leave, since the R2 pin is only served when asked for by ID).

## 10. For GPT
1. Does the inbox state model (§2.3) give a person's review before every publication, with no way for a lead to skip evidence review?
2. Is keeping the inbox out of the public repo right, given only reviewed outcomes are published?
3. §3.1: does the reader example make release date versus evidence-review date clear? Is "Evidence last reviewed" the right label?
4. §3.4: build-time release date with a rebuild on slip, or the preparation date?
5. §3.5: does the new wording say no more than He et al. 2020's passage?
6. §4: anything that could break an existing link or the R1-era page?
