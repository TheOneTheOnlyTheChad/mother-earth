# Phase 0 — checkpoint and resume (Arts validation + Planet measurement pass)

Written 7 Nov 2026 ~12:50 UTC at the start of Chad's "Go: bounded Arts validation and the remaining Planet baseline measurements". Updated as each step completes (see the log at the end).

> **ACCEPTED OUTCOME — 7 Nov 2026 (Chad, after GPT's review): Arts CLEARED for the limited Phase 0 feasibility gate.**
>
> **Scope:** a metadata-only view of the Met's catalogued places of making (created_at), mapped to present-day countries.
>
> **Accepted on the recorded evidence:**
> - data rights cleared (CC0; REGISTER filed);
> - 479 distinct objects across 25 present-day countries, meeting the geographic threshold;
> - explicit disclosure of catalogue uncertainty, of the 23 unverified pages (not passes), and of incomplete sensitivity assessment (no object manually assessed; tentative labels only).
>
> **Qualifications preserved:**
> - This is research-gate clearance, **not release readiness** and not independent verification of every object.
> - Media remains excluded.
> - Chad's sensitive-material inclusion decision is confined to this scope.
>
> **Current position:**
> - **Arts:** scoped Phase 0 gate cleared; may be recommended as the first domain, **not selected**.
> - **Planet:** partial baseline; remaining measurements (desktop width, cold load via a Chrome Guest window, iPhone) pending Chad's availability.
> - **Life:** accepted scoped block; research stopped.
> - **Aircraft:** parked, including research.
>
> No prototype is authorised. Domain selection and any Phase A start need a separate decision. The wider expansion remains a proposal. FIRMS stage 6 and any `firms-memory` merge are separate.

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
- ~12:46 — **Step 1 (policies) read**: the Met's "Stewardship of Human Remains" guidelines (as of 22 Apr 2025, https://www.metmuseum.org/policies/human-remains-guidelines) and "About the Met's collecting practices" (provenance, NAGPRA, repatriation; https://www.metmuseum.org/policies/about-the-mets-collecting-practices). Rule proposal drafted for Chad (not applied).
- ~12:47 — **Step 2 done**: all 30 distinct Geography Type segments in the pinned file classified by explicit table (`arts/validate_v2.py`; segment counts `arts/geotype-segments-pinned.json`).
  - Fixes vs R1 rules: "Formerly considered made in" = superseded; "Made for" / "Probably made for" = destination, not making; "Designed in", "Published in", "Retailed in", "Depicted" = not created_at; "Presumably from" = uncertain; "Country of Origin" = unvalidated, held out until the targeted check.
  - Re-classified the EXISTING R1 records (no redraw): created_at candidates **479 objects, 25 countries, USA 49.9%** (before sensitivity; 4 keyword-flagged still inside). "Country of Origin" objects in R1: 13 (targeted).
  - Validation sample: seed 20261108, 50 IDs in `arts/validate-v2-results.json`.
  - Outputs: `met-R1-assignments-v2.json`, `created-at-candidates-v2.json`, `validate-v2-results.json`.
- ~12:48 — **Step 3 access**: Met object pages and the collection API are refused from the cloud shell and from direct fetch (not on the allowlist). The search-then-fetch route is under test. The Mac pane is not used (Mac closed).
- ~12:50 — (log times above corrected; earlier entries had been written ahead of the clock.) **Step 3 running**: the search-then-fetch route works (object 6405: page "Made in Delft, South Holland, Netherlands"). 63 objects (50 random, seed 20261108, plus 13 "Country of Origin") are being read BLIND (helpers get IDs only and return the page's place lines verbatim), with the comparison against the CSV done separately.
- ~12:52 — **Sensitivity rule PROPOSAL** written for Chad: `docs/research/P0-arts-sensitivity-rule-PROPOSAL.md` (human remains incl. burial wrappings excluded; funerary/sacred excluded from the first view as unresolved; Indigenous/NAGPRA-scope excluded; provenance never inferred; full manual pass of the ~479 candidates as the compliance check). **NOT applied; awaits Chad's agreement.**
- ~12:55 — **Step 3 done** (`arts/pagecheck/`: blind page reads `batch0–3.json`, comparison `compare.py` → `pagecheck-results.json`).
  - **Random 50 (seed 20261108):** 27 pages reached (search-then-fetch), 23 not reached (search didn't return the page; 1 fetch error). **0 / 27 disagree** on relationship verb + country; 95% Wilson interval for the error rate **0–12.5%**. The 23 unreached are a coverage gap, not passes. The sample does not certify every object.
  - **Targeted "Country of Origin" (13 in R1):** 6 reached. All 6 pages show "Country of Origin <country>" exactly as the CSV. The meaning is not defined on the pages: 2 descriptions say made there (825639 Bijapur/India; 892739 likely Abadeh/Iran); 2 pair it with a matching "Made in" (16758, 16170); 1 ambiguous (631270: Istanbul-born artist, Country of Origin United States); 1 no evidence (443180). **Decision: "Country of Origin" stays its own relationship, outside the created_at view.**
  - **Sensitivity finding (recall):** object **717572 is a Yup'ik (Native American) ceremonial dance mask**, inside the created_at candidates and **not keyword-flagged**. It would fall under proposed rule part 3. Also seen: 471897 stained glass from a church choir; 818842 a Karbala painting used as a recitation backdrop. These are for the rule decision, not auto-excluded.
- **State now:** created_at candidates 479 objects / 25 countries (USA 49.9%), sensitivity NOT applied. **Step 4 waits on Chad's agreement of the rule.** Step 5 (final recount) follows step 4. Planet waits for Chad (Mac closed).
- ~13:00 — **Chad's rule decision (verbatim): "no include it that is the truth we are not here to bury the truth".** Proposal not adopted. Applied as: for this metadata-only scope, sensitive material included with honest context; source restrictions and uncertainty preserved; inclusion is not a claim about ownership legitimacy (wording revised ~13:15 after GPT's review).
- ~13:01 — **Steps 4–5 done** (`arts/final_view.py` → `final-view-objects.json`, `final-view-results.json`).
  - Final created_at view (v2 rules, rule applied): **479 distinct objects, 25 present-day countries → ≥ 300 ✓, ≥ 20 ✓.**
  - Concentration: USA 239 (49.9%), then France 47, UK 30, China 28, Iran 26, Germany 25, Egypt 19.
  - Thin tail: 8 countries with 1 object (CAN, CZE, ECU, IRQ, JPN, MAR, PAK, UKR); 12 countries with ≤ 3.
  - Tentative labels: 11 objects (potential sacred/ritual 9, potential funerary 3, potential Indigenous source community 2; potential human remains 0). **No object manually assessed**; screen + 3 page findings only; unlabelled ≠ not sensitive.
  - Arts work in this pass is complete. Remaining: GPT review; Planet (Chad, later).
- ~13:15 — **GPT's review**: the numeric geography gate passes (479 / 25); "Country of Origin" kept out is appropriate; 23 unreached pages stay unverified, not passes.
  - **Clarification answered:** none of the 479 were manually assessed; labels = screens + 3 page findings.
  - **Wording revised (existing evidence only):** decision scoped to this metadata-only view; tentative label names; "sensitivity not fully assessed" on every object; view described as "the Met's catalogued place of making, mapped to present-day countries", not independent historical verification.
  - **Arts status: geography passed; overall clearance pending (GPT review).**
- ~13:25 — **Accepted outcome recorded** (Chad, after GPT): Arts cleared for the limited Phase 0 feasibility gate, qualifications preserved; no further Arts research this round. Planet pending Chad. This pass is otherwise closed.
