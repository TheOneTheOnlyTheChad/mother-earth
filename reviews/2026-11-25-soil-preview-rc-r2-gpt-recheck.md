# Organic-soil emissions preview round 2 — GPT recheck

25 November 2026. Independent reviewer: GPT. Chad owns/approves; Claude implements/deploys.

**Verdict: PASS for the corrected fixture preview; suitable to proceed to full-data release-candidate preparation on Chad's go. This is not clearance to merge or deploy.** The previous four fixture findings are closed. The release-scope plan is supported with the precise requirements below, to be checked against the integrated candidate.

## Material reviewed

- Packet: `/Users/chadobie/Documents/Mother Earth/reviews/2026-11-25-soil-preview-rc-r2.md`, reported on main `69cd9b4`.
- Local review copy: `/Users/chadobie/Documents/Mother Earth/_review/soil-preview-rc/`, identifying itself as `e51ca61908ea3afd4c5c7116d514cb3947a65dcb`.
- Read `soil.js`, relevant inspector/render/CSS integration, new UI controls and historical Animals checks. Reviewed the running fixture through the in-app browser at `http://127.0.0.1:8899/`, with real dated globe imagery, both components, cell selection, reporting-period disclosure, and 360 px layout.
- Full derived table SHA-256 independently recomputed: `c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf`; unchanged.

The branch identity comes from the supplied packet and local review-copy record, not an independent remote Git checkout. Browser UI and source inspection agree on the round-2 changes. A shell attempt to compare served bytes with disk was blocked by local network permissions; no served-byte or remote-commit verification is claimed.

## Findings closed

**Palette:** PASS for this preview. The ochre ramp separates classes materially better than the previous alpha-only scheme over real imagery, for drained and burned. The low-bin label explicitly excludes zero. I am accepting the observed presentation, not treating an asserted colour-distance threshold as a universal accessibility certification.

**Incomplete zeros:** PASS. `cellClass` preserves incomplete coverage for zeros; the polygon path uses hollow fill and violet stroke. Independent execution confirmed the actual historical `38_39` burned zero retains incomplete coverage and a synthetic current-period version produces the intended polygon styles. Complete zeros retain the ochre outline. The key explains filled and hollow incomplete states.

**Unknown-only Key count:** PASS. Independent synthetic execution produced one unknown polygon, zero value/zero cells counted, `drawn()` false, and the separate unknown count on the card. Unknown-only outlines no longer make soil a counted data layer. The selection outline remains excluded.

**Inspector width:** PASS. On the running page, cell `22_71` uses 366 px value rows inside a 400 px desktop panel; at 360 px viewport it uses 302 px rows inside a 336 px panel. The document width remained 360 px. Values and expanded periods are scrollable and readable; the label is in the heading. Source inspection confirms the soil class is removed before other inspector views.

## Evidence and limits

Nine independent targeted Node VM checks passed: pinned fixture load; incomplete historical zero; complete zero; outside-fixture unknown; unsupported-period unknown; synthetic incomplete-zero polygon; synthetic unknown-only table validity; unknown-only count/card behaviour; and modified-fingerprint rejection. Synthetic cases changed the in-memory test pin only; no served file or project implementation was edited.

The full 790-record table independently passes the Python reference validator. Coverage counts are: 790 complete in 2001–05 and 2006–10; 784 complete/6 incomplete in 2011–15; 785 complete/5 incomplete in 2016–20; 790 complete in 2021–24. Consequently there is no real incomplete-outline cell in the displayed 2021–24 release period. Violet/white overlap was not visually exercised in the running unmodified fixture; the synthetic style path and historical record were checked. No claim of a real-phone or Safari check.

Claude reports 45 UI checks and mutation controls passing. I read the relevant controls but did not independently rerun that full browser suite: its hard-coded Playwright/globe/font dependency directories are absent here. The 15-suite comparison and historical failures remain Claude's evidence, not independently reproduced results. No broad smoke test, production operation or additional source download was performed.

## Release-scope plan: supported, with these requirements

1. Keep historical 13j and its NC anchors unchanged; retain 13k's `app.js` pin. Add soil-specific 13m; do not move BASE_MAIN or TL_MAIN. The proposed shifts for the changed files are appropriate in principle.
2. Replace `docs/research/soil-c1/*` and `reviews/2026-11-2?-soil-*` with a literal final changed-file manifest for the actual candidate. Include only the specifically intended records, REGISTER/proposal/STATUS edits if included, and explicitly account for fixture removal and full-table addition. Broad patterns are not an exact file list. Do not widen the manifest automatically to make a failure pass.
3. Freeze the actual fresh-main parent and reviewed payload/integrated-tree anchors. The final checks must cover every release file, including test maintenance. Explain how SOIL_MAIN is bound without an impossible self-referential commit pin; if maintenance is a later commit, scope that commit too. Preserve independent Animals structure/content assertions rather than relying only on equality to a new baseline.
4. Exercise the planned negative controls: an `app.js` edit, an unrelated file, a missing index change and a missing Sources change must fail. Retain the existing historical 13j/13k controls. Confirm the final layer-row count against the actual UI; a new count alone is not evidence of correct rows.

These are requirements for release preparation, not another fixture-preview HOLD.

## Remaining release gate

Prepare a fresh-main, full-data branch candidate; switch the asset and pin to the unchanged 790-record table; remove fixture metadata/wording and handle the retired fixture asset explicitly; update served-hash checks and REGISTER; implement and demonstrate the scoped Animals maintenance; and resolve the affected Key/mobile evidence gaps through restored fixtures or focused integrated evidence. Review the real full-data rendering and measured performance. Return the integrated packet to GPT, then Chad's explicit release approval. T1 remains closed; no new download is needed for these fixes.

Screenshot: `SOIL-R2-GLOBE-2026-11-25.jpg` beside this review, showing the burned fixture over real dated imagery.
