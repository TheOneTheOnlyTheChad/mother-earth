# Timeline close-out, 24 Nov 2026 — review index for GPT

Claude · Timeline thread · base: main **`5b3d9ba`** (includes the Animals baseline landing `9969bc3`; supersedes the `9036552` named in the last handover).
**Commissioned by Chad as one bounded close-out. Not authorised: any page release, catalogue change or hub operation.** Every live state is unchanged: page merge `19f4e07`, catalogue `tl-2026-11-R3` `f1a5fab2…0993`, hub 0.6.24 `db4f9cdf…1aa5`.

Each item stands alone; review and answer them separately.

| # | Item | Kind | Document | Changes in the repository |
|---|---|---|---|---|
| **1** | Travel record §9: the `data-px` fix and the wheel focus guard (commit `4913d18`, released in `03aff0a`, still in `19f4e07`) | Review of released code; fresh runs | `reviews/2026-11-24-timeline-travel-s9-review.md` | none (evidence only) |
| **2** | `timeline-changes-ui`: permanent break `unpinned-is-pinned`; previous revision from `BUILD.json` checked against `release.previous`; `REV = R2` kept fixed | **Test only**, one file | `reviews/2026-11-24-timeline-changes-ui-followups.md` | `phase1/timeline-changes-ui.test.cjs` (+17 −4) |
| **3** | "Timeline page updated" line: what its date is, and accurate wording | **Proposal, docs only** | `docs/concepts/TIMELINE-DATE-LABEL-PROPOSAL.md` | none |

Evidence for all three: `reviews/evidence/2026-11-24-timeline-closeout/` (diffs, run logs, `SHA256SUMS`).

## Coordination with the Animals baseline checks
- The Animals suite (`animals-tab-ui`, with 13f–13i holding the Timeline's files to `19f4e07`) passes **280/0** on the item-2 tree. Item 2 touches no file it pins.
- Item 3, if built later, changes `timeline.html` and so needs `TL_MAIN` moved in the same release (proposal §4).

## Open, not cleared by anything in this index
**Device and assistive checks (need Chad's devices; kept open):**
- a real phone
- Safari (macOS or iOS)
- a screen reader
- true 200 % browser zoom (not an emulated width)

**Image states, listed separately so desktop coverage can be judged without a phone:**
| State | Covered on desktop by | Where | On the live page |
|---|---|---|---|
| **No image** (an entry whose story has no figure) | `timeline-story-ui` C at 1280 and 390 px (emulated width, Chromium): no figure, no image request, the account and findings complete; also the preview helper's `no-image` state | rerun on main: see §A below | **not exercised** (the released entry has an image) |
| **Image fails to load** | `timeline-story-ui` B at 1280 and 390 px: image withdrawn, the plain line "The image could not be loaded…" shown, caption and account stand, no page error, no overflow; also the preview's `image-fails` state | rerun on main: see §A below | **not exercised** (it would need the image blocked in a real browser on the live page) |

The 390 px runs are an emulated width in desktop Chromium, not a phone.

### §A. `timeline-story-ui` on main `5b3d9ba`
**127 pass, 0 fail** (05:03:23–05:04:04 UTC; log `story-ui-main.log`). B 1280, B 390, C 1280, C 390 all pass. The suite ran on its FIXTURE images: the NASA files are not in `phase1/timeline/rehearsal/assets/` in this workspace (the suite says so in its first line). The image-state checks do not depend on which picture is used; the released files are checked separately in its section R.

## Results are Claude's
Every browser result here is Claude's, in the cloud workspace with Playwright Chromium 158.0.8127.36. No Mac or real-device run.

## Still to come in the Timeline thread, not part of this index
Source refresh, then the bounded Human relatives proposal (Chad's order). The next story and collapsing detail groups stay parked.
