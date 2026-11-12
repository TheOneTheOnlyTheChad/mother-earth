# Backlog view — 8 Nov 2026, rev 2 after GPT's review; §T Timeline maintenance added 10 Nov (for Chad's choice; nothing here is started)

One page over everything open: the research backlog (`docs/RESEARCH-BACKLOG.md`, R1–R11) plus the open hub/page items from HANDOVER. **No item is authorised by appearing here.** Tiers are GPT's 5 Nov recommendations. Effort figures are Claude's rough estimates, not measurements.

## A. Fixes and improvements to what is already live
| Item | What it is | State | Next step (needs Chad's go) | Rough effort |
|---|---|---|---|---|
| **Kp false "degraded"** | 69% of Kp runs marked degraded by our 4 h rule (interval-start timestamps); page attributes the flag to "the source" on every active layer | **Finding** 8 Nov (`reviews/2026-11-08-kp-degraded-finding.md`) | Finding rev 2 (GPT: diagnosis supported, threshold provisional) → fix on a branch: provisional threshold + boundary tests + wording across all affected active layers → review → Approve lines | small (hub + page) |
| **GIBS measured selection** | Pick NOAA-21 or NOAA-20 for the same date by lower near-black share (appearance, not completeness) | **Proposal rev 3** 8 Nov (`docs/GIBS-FALLBACK-PROPOSAL.md`). Stage 1 = same-date selection, **no threshold *T***; a day-before fallback is a later, separate decision | **Stage-1 bench CLOSED 8 Nov — accepted by GPT** (`reviews/2026-11-08-gibs-stage1-bench.md` rev 2; PNG promising; no margin, cap or eligibility rule adopted; Worker unverified); shadow record **not authorised** → hub rollout (separate) | medium |
| **FIRMS empty-input retry** | Nightly header-only retries are logged as `firms:recovery down` rows (expected, but noisy) | Left open by decision | Review whether to refine the retry/logging | small |
| **FIRMS 8 MiB guard** | Raise the size guard (bench: v2 handled 16/32/64 MiB within 64 MB) | Left open by decision | Decide whether needed; FIRMS files peaked ~5.3 MB so far | small |
| **R11 FIRMS late arrivals** | An unmeasured question: whether detections processed after midnight are missing from that day's checkpoint (`day_range=1` resets at 00:00 UTC). No quantity of lost detections is established | Not started (one data point) | Measure across several days; compare `day_range=2` | small–medium |
| **place-ui harness** | Test-only fix, 30/30 | On branch; **GPT technical sign-off 8 Nov** | Chad's Approve line to merge | done, merge only |
| **Smoke checks left** | Real phone; noon rollover; HTTP status codes | Noon booked 11:50 UTC today | Real phone with Chad (with the Phase 0 iPhone runs) | — |
| **Sea-ice last-good fallback** | One failed NSIDC fetch blanks the sea-ice tile until the next 6-hourly run, although the last good reading exists (as buoys did before hub 0.6.8) | **Backlog (Chad, 12 Nov)** — one failure seen (12 Nov 03:08 UTC, HTTP 521; recovered 09:08) | Only if failures recur: evidence + a sea-ice-only proposal | small (hub + page) |
| **Real iPhone Safari check** | Live site incl. the deep-time Timeline on a real iPhone (the pane is not a phone) | **Deferred by Chad 10 Nov** — site first | Chad, later | — |

## B. New sources (research only, R1–R10)
| ID | Candidate | Tier | Where it stands | What its next gate needs |
|---|---|---|---|---|
| R2 | Fireballs (NASA/JPL CNEOS) | 1 | **Parked** 5 Nov after the matching proposal (rev 3) | Design notes: count disclosure, negative coordinates; acceptance rules |
| R3 | Earth rotation / polar motion (USNO/IERS) | 1 | **Parked** 6 Nov: numbers feasible; reuse/access unresolved | IERS terms, revisions, timing, conventions |
| R4 | Argo ocean profiles | 1 | **Parked** 6 Nov: core T/S/P feasible; Coriolis access terms unresolved | Access terms, revisions, arrival rates |
| R6 | Ozone (NASA Ozone Watch) | 2 | **Parked** 6 Nov: daily hole area + minimum feasible; licence unresolved | Climatology, gap-fill share, terms |
| R5 | Coral heat stress (NOAA Coral Reef Watch) | 2 | Not started | First gate |
| R7 | Water level vs predicted tide (NOAA CO-OPS) | 2 | Not started | Pilot stations; datum |
| R10 | Solar flares / X-ray (NOAA SWPC) | 2 *(Claude's placement)* | Partly: GPT saw one event record | Event + flux samples, revisions |
| R1 | Schumann resonance / ELF (BGS) | 3 | Not started: no recent sample; terms unresolved | One BGS sample + terms |
| R8 | Ionospheric TEC (GloTEC) | 3 | Not started | Model label; quality |
| R9 | Neutron monitors (NMDB) | 3 | Blocked: account required | Recheck service + reuse |

**Pattern worth seeing (corrected in rev 2):** R3, R4 and R6 are parked with **terms or access** among their main open items; **R2 also has unresolved identity, validation and acceptance rules**. A bounded "terms review" (reading each provider's reuse terms and filing the operative sentences in REGISTER, as for the Met) **may clarify rights without clearing any source**: each item's other open questions remain.

## T. Timeline maintenance and expansion (added 10 Nov 2026 on Chad's request — captured only, nothing started)
Captured from Chad's brief (10 Nov). The deep-time release (catalogue `tl-2026-11-R1`, hub 0.6.3, main `57d07c2`) is the base. **First deliverables: T1 discovery inbox and T4 public changelog.** Each item still needs its own proposal → GPT review → Chad's go; anything that changes the public page, R2 or the hub needs its own Approve line.

| ID | Item | What Chad wants | State |
|---|---|---|---|
| **T1** | **Discovery inbox** *(first deliverable)* | Log new papers, newly uncovered or digitised records, corrections and reader tips, each with the source link and a short note on what it might add or change. A source scan may surface leads; **a person reviews each claim before publication**. | **Proposal rev 2.1** 12 Nov (after GPT's re-check); **first delivery LIVE 12 Nov** (inbox created; `tl-2026-11-R2` with What changed released, main `12ff4ff`) (`docs/concepts/TIMELINE-INBOX-AND-CHANGES-PROPOSAL.md`), for GPT |
| **T2** | **Evidence review** | Record what the source actually supports, its date or range, the uncertainty, the citation, the licence, and when it was checked. Show credible disagreements where they matter. **Keep the dates-without-a-year shelf** for entries like Pliny. | Not started (today's record: `TIMELINE-BIG-FIVE-SOURCE-CHECK.md` + REGISTER) |
| **T3** | **Versioned releases** | Keep event links stable. Each published catalogue gets a new revision ID; **older catalogues retained** for pages that still expect them; each page and catalogue released as a **matched pair using the existing hash checks**. | **Serving mechanism DONE 10 Nov** (hub 0.6.4 versioned route, legacy URL pinned to R1, immutable revisions; page fetches its own revision — main `cc91165`; `docs/concepts/TIMELINE-CATALOGUE-REVISIONS-PROPOSAL.md` rev 1.1). Stable event links already hold. |
| **T4** | **Public change history ("What changed")** *(first deliverable)* | A small section for additions, revisions and withdrawals. If an event's date changes, show the **old and new ranges and the evidence behind the change**. Page "last updated" kept **separate** from each entry's "last reviewed". | **Proposal rev 2.1** 12 Nov (after GPT's re-check); **first delivery LIVE 12 Nov** (inbox created; `tl-2026-11-R2` with What changed released, main `12ff4ff`) (same document), for GPT |
| **T5** | **Release cadence** | Batch routine additions by lane or topic; move **material corrections and withdrawals sooner**. | Not started |

Already queued against T2/T3/T5 (routine, batch with the next revision): GPT's wording note — "extinction horizon" → plainer wording (STATUS 10 Nov 06:53).

## C. Bigger decisions (separate, Chad's)
- **Domain selection (Phase 0):** recommendation drafted (`docs/research/P0-RECOMMENDATION-DRAFT.md`, rev 3), ready for Chad's separate decision. The iPhone measurements are pending Chad's availability; the recommendation does not depend on them.
- **Aircraft:** parked, research included (OpenSky feeder condition; ADS-B receiver not yet needed).
- **Polar-cap imagery, Possible futures, Schumann view:** recorded ideas, no gate set.

## Claude's suggestion (Chad decides)
1. **Kp correctness first** (GPT agrees): it removes a false public signal and an untrue sentence across layers.
2. **Then choose one:** a bounded terms review over R2/R3/R4/R6 (read-only; clarifies rights, clears nothing), **or** the revised GIBS bench + shadow record (read-only, workspace/pane). Neither is started.
3. New first gates (R5, R7, R10) after that.
