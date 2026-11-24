# Timeline: the "Timeline page updated" line — wording proposal (rev 1, docs only)

24 Nov 2026 · Claude · Timeline thread · Item 3 of `reviews/2026-11-24-timeline-closeout-index.md`.
**Proposal only. Nothing built. A wording change is a page release and needs its own go, branch and Approve line.**

## 1. The fault
The line above the deep-time axis reads:

> Timeline page updated 24 Nov 2026 · revision tl-2026-11-R3 · What changed

The date printed there is **not** the last day the page changed. It is the catalogue revision's `release_date`.

**Evidence.** Stage 1 (the explorer) went public in page merge `03aff0a` on **23 Nov 2026**. It was a presentation-only release on the unchanged catalogue `tl-2026-11-R2`. After that merge the page still said **"Timeline page updated 12 Nov 2026"** (`git show 03aff0a:timeline.html`). A reader was told the page had not changed for eleven days, on the day it changed. Noticed in START-HERE §4ah ("a presentation-only release does not move it").

## 2. What the date actually is
| Date | Where it comes from | What it means | Where it is shown |
|---|---|---|---|
| **Catalogue release date** | `BUILD.json` `release_date` → catalogue `release.release_date` | The UTC day the page carrying **this catalogue revision** (its entries, claims, sources and change records) went public. A presentation-only page release does not move it. | The line under discussion, and each heading in What changed |
| **Evidence last reviewed** | each entry's `evidence_reviewed.date`, set explicitly, never derived | The day that **entry's** evidence was last checked as a whole. Can be earlier than the catalogue release; the generator refuses one that is later. | "Evidence last reviewed: …" on each entry |
| *(not shown)* last page-code change | git only | When the page's script, style or layout last changed | Nowhere on the page, by design |

The proposal of 12 Nov (`docs/concepts/TIMELINE-INBOX-AND-CHANGES-PROPOSAL.md` §3.5, table row "Page release date") meant this date for a release that brings a catalogue. It did not foresee presentation-only releases; stage 1 was the first.

## 3. Proposed wording
**Recommended (W1):**
> Revision tl-2026-11-R3, released 24 Nov 2026 · What changed

- It says what the date belongs to (the revision) and nothing about the page code.
- It matches the What changed headings ("24 Nov 2026 — revision tl-2026-11-R3"), so one date reads the same in both places.
- It cannot be confused with the per-entry "Evidence last reviewed" line: one names a revision, the other an entry's evidence.

**Alternatives, for Chad's choice:**
- **W2:** "Timeline content released 24 Nov 2026 · revision tl-2026-11-R3 · What changed". Closest to today's line; "content" is less exact than "revision".
- **W3:** keep "Timeline page updated" and make the date move on every page release. **Not recommended:** it needs a second date field the catalogue does not carry, would put a page-code date beside evidence dates, and the What changed headings would then disagree with it.

## 4. What a change would touch (for planning only; not authorised)
- `phase1/timeline/build_timeline.py` line 670 (the generated line) and the generated block of `timeline.html`. **Catalogue bytes do not change** (the line is page text, not catalogue data), so no new revision, no R2 upload and no hub deploy. It is a page-only release under the presentation-only route (START-HERE §4ah).
- Checks that name the text: `phase1/timeline-changes-build.test.mjs` line 106 and `phase1/timeline-changes-ui.test.cjs` line 165 (B).
- **Animals 13f–13i** hold `timeline.html` to `19f4e07` (`TL_MAIN`): they would fail until `TL_MAIN` moves to the new release merge. That needs the Animals suite's owner, in the same release.
- Older pages (R1, R2) still in a browser's cache keep their old line. That is acceptable; the mixed-asset rules do not depend on this text.
- `id="tl-updated"` and its `<time datetime>` stay, so links and the suites' date reads keep working.

## 5. Decisions for Chad
- **D1:** W1, W2, or keep the current line.
- **D2:** when: bundle with the next catalogue release, or a page-only release on its own.
