# Backlog view — 8 Nov 2026 (for Chad's choice; nothing here is started)

One page over everything open: the research backlog (`docs/RESEARCH-BACKLOG.md`, R1–R11) plus the open hub/page items from HANDOVER. **No item is authorised by appearing here.** Tiers are GPT's 5 Nov recommendations. Effort figures are Claude's rough estimates, not measurements.

## A. Fixes and improvements to what is already live
| Item | What it is | State | Next step (needs Chad's go) | Rough effort |
|---|---|---|---|---|
| **Kp false "degraded"** | 69% of Kp runs marked degraded while NOAA is on time; page blames "the source" | **Finding** 8 Nov (`reviews/2026-11-08-kp-degraded-finding.md`) | GPT review → fix: hub threshold (~7.5 h) + honest wording (check every layer's degraded rule) → Approve lines | small (hub + page) |
| **GIBS fallback rule** | Pick the more complete of NOAA-21/NOAA-20 by measurement | **Proposal** 8 Nov (`docs/GIBS-FALLBACK-PROPOSAL.md`) | GPT review → bench (read-only) → ~7-day shadow record → build | medium |
| **FIRMS empty-input retry** | Nightly header-only retries are logged as `firms:recovery down` rows (expected, but noisy) | Left open by decision | Review whether to refine the retry/logging | small |
| **FIRMS 8 MiB guard** | Raise the size guard (bench: v2 handled 16/32/64 MiB within 64 MB) | Left open by decision | Decide whether needed; FIRMS files peaked ~5.3 MB so far | small |
| **R11 FIRMS late arrivals** | `day_range=1` resets at 00:00 UTC, so detections processed after midnight never reach that day's checkpoint | Not started (one data point) | Measure across several days; compare `day_range=2` | small–medium |
| **place-ui harness** | Test-only fix, 30/30 | On branch; GPT sign-off reported by Chad 8 Nov (reply text not yet in the thread) | Chad's Approve line to merge | done, merge only |
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

**Pattern worth seeing:** the four parked tier-1/2 items (R2, R3, R4, R6) all stopped on **terms or access**, not on the data. A single "terms pass" across them could unblock more than any new first gate. That means reading each provider's reuse terms and filing the operative sentences in REGISTER, as for the Met.

## C. Bigger decisions (separate, Chad's)
- **Domain selection (Phase 0):** recommendation drafted (`docs/research/P0-RECOMMENDATION-DRAFT.md`); waits on GPT's revisions and the iPhone runs.
- **Aircraft:** parked, research included (OpenSky feeder condition; ADS-B receiver not yet needed).
- **Polar-cap imagery, Possible futures, Schumann view:** recorded ideas, no gate set.

## Claude's suggestion (Chad decides)
1. **Kp fix**: it removes a false public signal and an untrue sentence. Small, and it meets the "honesty over polish" bar.
2. **Terms pass over R2/R3/R4/R6**, read-only: the cheapest way to move four parked items at once.
3. **GIBS bench + shadow week**: runs in the background while 1 and 2 happen.
4. New first gates (R5, R7, R10) only after that.
