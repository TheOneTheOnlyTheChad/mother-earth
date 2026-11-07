# Phase 0 — checkpoint and resume (Arts validation + Planet measurement pass)

Written 7 Nov 2026 ~12:50 UTC at the start of Chad's "Go: bounded Arts validation and the remaining Planet baseline measurements". Updated as each step completes (see the log at the end).

## Authority and limits (Chad, 7 Nov)
- **Effort cap:** 2 h of active work across this follow-up (validation, measurement and write-up count; waiting for Chad doesn't), plus one GPT review round. At the cap: stop, save, report unfinished items. No automatic extension, no new sample.
- **Arts:** existing R1 sample and pinned file only.
  1. Read the Met's policies and propose a sensitive-material rule for Chad's agreement. Sensitivity clearance waits on that agreement.
  2. Classify the distinct Geography Type segments; resolve "Country of Origin", superseded wording and alignment rules before drawing the validation sample.
  3. Check a seeded random 50 against public Met object pages, plus the targeted "Country of Origin" cases. Report targeted findings separately from the random error estimate and interval.
  4. Apply the agreed rule within the remaining budget; if incomplete, report partial validation and keep Arts inconclusive.
  5. Recompute distinct object and country counts; test ≥ 300 / ≥ 20; report concentration and the thin tail without inventing thresholds.
  - created_at-only scope. No media. No provider contact.
- **Planet:** three desktop-width runs; three iPhone Safari runs with Chad when available; cold load via a fresh profile where available. Never clear Chad's browser data without arranging it with him. No header or page changes.
- **Mac:** closed. No dependence on, or retries of, its pane or shell.
  - When Chad reopens it, the pane belongs to the FIRMS thread: no navigation or takeover without coordination.
  - **Reserved: 8 Nov 02:40–03:00 SAST** (FIRMS stage 6).
- Backdrop findings stay separate from FIRMS. Life stopped. Aircraft parked. No prototype, collector, schedule, resource, subscription, deploy, production change or merge. Don't commit to `firms-memory`; pull before editing shared docs.

## Durable evidence (repo `TheOneTheOnlyTheChad/mother-earth`, branch `main`; project copies under `claude/research/`)
| Item | Path | sha256 |
|---|---|---|
| Life sample (2,000 GBIF records, CC0/CC BY, gz) | `docs/research/p0-recovery/life/gbif-sample-2026-11-07.json.gz` | gz `b567c8c338af0d1d8a20a902b74ac8b6a3aec247730df259a97ec66fda263cea`; JSON `76ccf79208d04f5a574b8b526344abbcbc62e0ea0637bd500501eb746bad644f` |
| Life attribution (30 datasets, licences, DOIs) | `docs/research/p0-recovery/life/ATTRIBUTION.md` | `dcfb219df00c5db4bff8784052b41df169e80d88323eabfa71e45864995b302b` |
| Life scripts | `docs/research/p0-recovery/life/analyse.py`, `subset.py`, `ds-meta.py` | see `MANIFEST.sha256` |
| Life outputs | `docs/research/p0-recovery/life/analysis-output.txt`, `eligible-keys.json` (172 eligible marker keys) | see `MANIFEST.sha256` |
| Life write-up | `docs/research/P0-life-gbif.md` | in git |
| Met source pin | `docs/research/p0-recovery/arts/SOURCE.md` | commit `e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea`; LFS `7adc37e41923f9f8179e8ed30d9312e6148da54c4468f373c162afc89d5cd0fe`, 340,864,677 B |
| Arts recovery script | `docs/research/p0-recovery/arts/arts_recovery.py` | in git |
| Arts sample R1 (2,000 Met records, CC0) | `docs/research/p0-recovery/arts/met-recovery-sample-R1.json` | `c4046fd373ff1afe1cbf4b2565c41a32d3e059c13dd2256a57b6a50253758762` |
| Arts results R1 | `docs/research/p0-recovery/arts/met-recovery-results-R1.json` | `6304a84835610d1f94a434ebf9cc17c670dc7c11a4bd06b8ae4efdf4c18f5e88` |
| created_at view script | `docs/research/p0-recovery/arts/created_at_view.py` | reproduces the IDs file byte for byte |
| created_at view object IDs (485) | `docs/research/p0-recovery/arts/created-at-view-object-ids-R1.json` | `eae0aae9dcc4c505fe6fb160e0a6d6e888cb1f1ff3cd87a2d32134cb0612d7e6` |
| Planet runs (3, 7 Nov 12:21–12:22 UTC) | `docs/research/p0-recovery/planet/runs-2026-11-07.json` | `bb7ad48775aa2aea95631e01496cc6807428767f65156bbeb1329f922381b4bc` |
| Reports | `docs/research/P0-arts-planet-recovery.md` (review update at the top), `P0-arts-planet-for-GPT.md` | in git |
| REGISTER (Met filed; GIBS coverage concern) | `REGISTER.md` | in git |
| R11 (FIRMS 6 Nov late arrival) | `docs/RESEARCH-BACKLOG.md` | in git |
| **Not in git (by design)** | `MetObjects.csv` (340 MB) | re-fetch from `https://media.githubusercontent.com/media/metmuseum/openaccess/e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea/MetObjects.csv` and check the hash above |

The Life sample was also sent to Chad in the conversation at 10:58 UTC (same gz hash).

**Full hashes of every evidence file:** `docs/research/p0-recovery/MANIFEST.sha256` (generated with `sha256sum`; check with `cd docs/research/p0-recovery && sha256sum -c MANIFEST.sha256`).

## Completed findings (short)
- **Life:** stopped; BLOCKED for the accepted marker scope (172 < 300); rights separately inconclusive.
- **Arts:** data rights cleared (CC0, REGISTER filed 7 Nov). Media excluded. created_at-only view from R1 = **485 objects, 25 present-day countries, USA 49.5%**, before the validation in this pass. Five-department limitation. "Arts of Africa, Oceania and the Americas" is an excluded department.
- **Planet:** partial baseline. Three warm/mixed runs at 588 px (phone layout). Cold load, total transfer, desktop width, iPhone and direct interactivity are all pending.
- **Backdrop:** unconfirmed coverage concern (NOAA-20 swath gaps); recorded in REGISTER and R11; no change authorised.

## Pending decisions (Chad)
1. The sensitive-material rule (proposal to come in this pass).
2. Planet: when he's available for desktop-width runs (Mac open, pane free of FIRMS needs) and the iPhone runs; whether a fresh profile can be arranged.

## Resume steps (any new thread)
1. Read `START-HERE.md`, `HANDOVER.md`, `STATUS.md`, then this file and the log below.
2. Clone `main` (`git clone --depth 1`); every file above is there. For the Met CSV, re-fetch from the pinned URL and verify sha256 `7adc37e4…d0fe`.
3. Arts: `python3 -I docs/research/p0-recovery/arts/arts_recovery.py MetObjects.csv <out>` (needs `pip install pycountry==26.2.16`) reproduces R1. Then `python3 -I docs/research/p0-recovery/arts/created_at_view.py <out>/met-recovery-sample-R1.json ids.json` reproduces the 485.
4. Continue at the first step in the log below that isn't marked done. Effort used so far is in the log.

## Log (UTC)
- 12:44 — follow-up started (effort clock starts). Checkpoint: Life files and created_at view script moved from workspace-only into the repo; verified against a fresh clone (see next entry).
- 12:58 — **Step 1 (policies) read**: the Met's "Stewardship of Human Remains" guidelines (as of 22 Apr 2025, https://www.metmuseum.org/policies/human-remains-guidelines) and "About the Met's collecting practices" (provenance, NAGPRA, repatriation; https://www.metmuseum.org/policies/about-the-mets-collecting-practices). Rule proposal drafted for Chad (not applied).
- 13:05 — **Step 2 done**: all 30 distinct Geography Type segments in the pinned file classified by explicit table (`arts/validate_v2.py`; segment counts `arts/geotype-segments-pinned.json`).
  - Fixes vs R1 rules: "Formerly considered made in" = superseded; "Made for" / "Probably made for" = destination, not making; "Designed in", "Published in", "Retailed in", "Depicted" = not created_at; "Presumably from" = uncertain; "Country of Origin" = unvalidated, held out until the targeted check.
  - Re-classified the EXISTING R1 records (no redraw): created_at candidates **479 objects, 25 countries, USA 49.9%** (before sensitivity; 4 keyword-flagged still inside). "Country of Origin" objects in R1: 13 (targeted).
  - Validation sample: seed 20261108, 50 IDs in `arts/validate-v2-results.json`.
  - Outputs: `met-R1-assignments-v2.json`, `created-at-candidates-v2.json`, `validate-v2-results.json`.
- 13:06 — **Step 3 access**: Met object pages and the collection API are refused from the cloud shell and from direct fetch (not on the allowlist). The search-then-fetch route is under test. The Mac pane is not used (Mac closed).
