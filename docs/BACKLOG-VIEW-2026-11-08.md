# Backlog view — 8 Nov 2026, rev 2 after GPT's review (for Chad's choice; nothing here is started)

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

## C. Bigger decisions (separate, Chad's)
- **Domain selection (Phase 0):** recommendation drafted (`docs/research/P0-RECOMMENDATION-DRAFT.md`, rev 3), ready for Chad's separate decision. The iPhone measurements are pending Chad's availability; the recommendation does not depend on them.
- **Aircraft:** parked, research included (OpenSky feeder condition; ADS-B receiver not yet needed).
- **Polar-cap imagery, Possible futures, Schumann view:** recorded ideas, no gate set.

## Claude's suggestion (Chad decides)
1. **Kp correctness first** (GPT agrees): it removes a false public signal and an untrue sentence across layers.
2. **Then choose one:** a bounded terms review over R2/R3/R4/R6 (read-only; clarifies rights, clears nothing), **or** the revised GIBS bench + shadow record (read-only, workspace/pane). Neither is started.
3. New first gates (R5, R7, R10) after that.
