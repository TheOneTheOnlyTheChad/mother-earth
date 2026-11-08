# Phase 0 — recommendation (DRAFT, 8 Nov 2026)

**Status: draft rev 2 (after GPT's review, 8 Nov) for Chad's separate decision.** Rev 2 applies GPT's six requested revisions only; no accepted gate is reopened. Built from accepted findings only (`P0-CHECKPOINT.md`, `P0-arts-planet-recovery.md`, `P0-life-gbif.md`). No new research, sample or measurement went into it. **The iPhone measurements are outstanding** (§3) and remain pending Chad's availability.

This document recommends; it does not select. Domain selection, any prototype and any Phase A start each need Chad's separate decision. Aircraft stays parked, research included.

## 1. Where each gate stands (as accepted)

| | Outcome | Scope it applies to | Accepted on |
|---|---|---|---|
| **Arts (the Met)** | **CLEARED** for the limited feasibility gate — not selected, not release-ready | metadata-only view of the Met's catalogued places of making (created_at), mapped to present-day countries; media excluded | 7 Nov ~13:25 UTC (Chad, after GPT) |
| **Life (GBIF)** | **BLOCKED** for the scoped marker proof of concept; research stopped. Not a rejection of GBIF or of Life | marker view from the 2,000-record sample, with the stated exclusions | 7 Nov ~11:40 UTC (Chad, after GPT) |
| **Planet** | **Baseline partial**: 7 Nov transfer/load measurements accepted; phone outstanding | the live page as it was on **7 Nov, before the NOAA-21 backdrop (8 Nov)** | cold load + desktop accepted 7 Nov ~13:55 UTC |

### Arts — what the clearance rests on
- Data rights cleared: CC0, REGISTER filed 7 Nov.
- **479 distinct objects across 25 present-day countries**: meets ≥ 300 / ≥ 20.
- Concentration disclosed: USA 239 (49.9%), then France 47, UK 30, China 28, Iran 26, Germany 25, Egypt 19. Thin tail: 8 countries with one object, 12 with ≤ 3.
- Random page check: 0 / 27 reached pages disagree (95% interval for the error rate 0–12.5%). **23 pages were not reached and are unverified, not passes.**
- "Country of Origin" kept as its own relationship, outside the view.
- Every object carries **"sensitivity not fully assessed"**; source restrictions are preserved. Present-day country references are a location reference only and **do not imply historical nationality**.
- Sensitive material: **included with honest context** (Chad, 7 Nov: "we are not here to bury the truth"), confined to this metadata-only scope. No object manually assessed; 11 carry tentative labels; unlabelled is not "not sensitive". Inclusion is not a claim about ownership legitimacy.
- Limits carried forward: typed geography in the source exists in **5 departments** (Egyptian Art, Islamic Art, The American Wing, Medieval Art, The Cloisters); **4 of them contribute to the final view** (The American Wing 326, Islamic Art 72, Medieval Art 43, The Cloisters 38); Arts of Africa, Oceania and the Americas is an excluded department, not an absence of those regions; the view shows the Met's catalogue, not independent historical verification.

### Life — what the block rests on
- 2,000 → **172 eligible at ≤ 1 km** after the rights, sensitivity and precision rules: 8 countries, 48 cells, no Americas or Asia. Fails ≥ 300.
- The missing American and Asian coverage is an artefact of the method, not of the data. Identifiers are not attribution. The region view is unproven.
- Rights separately inconclusive (dataset vs record licence on iNaturalist and three other datasets); media excluded.

### Planet — what is measured
| Run | Conditions | Result |
|---|---|---|
| Cold load | Chrome 156 Guest window, Mac, unthrottled, viewport not recorded | 1,500,912 B / 22 requests (all measured); DCL 1.52 s; load 5.09 s; last response 7.45 s |
| Desktop × 3 | same browser, 1470 × 835, DPR 2, warm | DCL 0.69–0.91 s; last response 4.96–6.20 s; ~0.9 MB each (backdrop + hub data re-fetched every load) |
| Pane × 3 | 588 px (phone layout), warm/mixed | FCP 960 / 640 / 176 ms; last hub response 8.0 / 4.7 / 3.8 s; frames ≈ 35 ms |

These are the **7 Nov, pre-NOAA-21 baseline**. They establish transfer and load measurements only. They do **not** establish desktop input responsiveness, nor any agreed performance tolerance. The cold and desktop runs are not directly comparable with the pane runs.

## 2. Draft recommendation

1. **Arts (the Met), in the cleared scope, is the only cleared expansion candidate among those assessed in this round** (Arts, Life). It cleared with its rights settled and its gaps disclosed. This is the recommendation of a candidate, for Chad's decision. It is not a selection.
2. **Life is not recommended for this round.** The scoped block stands. Any return to Life would be a new, separately authorised scope (a different view, method or source); nothing here starts it.
3. **Planet's baseline covers transfer and load on desktop (7 Nov, pre-NOAA-21), not input responsiveness and not the phone.** Checks that name the iPhone ("first switch into a domain", touch response) have no baseline until the runs in §3 are done. A VoiceOver baseline is a separate measurement: the planned load/drag recordings do not establish one.
4. **Suggested order (a suggestion, not a prerequisite):** taking the domain decision after the iPhone runs would let any later "no worse than Planet" check on the phone be measured against a baseline. It is not an accepted prerequisite for domain selection or for documenting this recommendation.

## 3. Outstanding — must be done before this draft is final
- **iPhone Safari × 3, screen-recorded (Chad):** time to globe visible; time to first drag response.
- **Direct interactivity:** input response on the phone (the desktop figures don't cover it).
- Not covered by those recordings: a VoiceOver baseline (separate, if wanted).
- Also open from GPT's 8 Nov smoke test (not Phase 0 gates, but phone-adjacent): actual-phone layout check; the "Everything here" cell-selection tap.

## 4. What this draft does not do
No domain selection, prototype, collector, schedule, resource, deploy, merge, new research or provider contact. No change to the Arts clearance or the Life block. Aircraft parked, research included.
