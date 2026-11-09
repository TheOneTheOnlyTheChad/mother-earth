# Timeline POC — human evolution and human history: bounded test proposal (rev 1, 9 Nov 2026)

**Status: proposal only (docs).** Chad's brief, 9 Nov: orient the next timeline proof-of-concept toward human history and evolution, using the accepted timeline concept (`docs/concepts/TIMELINE-CONCEPT.md` rev 3.1), the project records and the lessons of the completed pilots.

**What this document is and is not:**
- Written without research: no lookups, browsing, queries, sampling or downloads.
- **Every example below comes from Claude's background knowledge and is labelled [unverified candidate].** Nothing rests on those examples being right; any dates, names or attributions in them may be wrong.
- This proposal **selects neither the final timeline scope nor a research route.** All parameters are recommendations for Chad's decision (§10), after GPT's review.
- The completed Route W gate stays closed. The Wikipedia-led pilot's recorded findings stand, with its rev 2 corrections and their review.

**Labels:**
- **[record]** — from a saved project record.
- **[general knowledge, unverified]** — background knowledge, not checked.
- **[unverified candidate]** — an example that may or may not survive a real test.
- **[recommendation]** — for Chad's decision.

---

## 1. Shared test or two tests?
**Recommendation: two separate small tests. Run one now (Test A, human evolution) and keep Test B (human history) as a later, separate proposal.** [recommendation]

**Why not one test:**
- **Different evidence.** Human evolution rests mainly on physical finds (fossils, artefacts, sediments, genetic data) dated by scientific methods with stated ranges and uncertainties [general knowledge, unverified]. Human history rests largely on written or recorded accounts, with archaeology alongside. A combined test would mix two tracing problems and could not show which one causes trouble.
- **Different time scales.** Deep-time ranges (tens or hundreds of thousands of years, often with wide uncertainty) and historical dates (years or days) need different display and uncertainty handling. A shared test would blur them.
- **No forced connection.** Putting both in one test invites an implied line "from evolution to civilisation". The constitution says we force no view [record: START-HERE §2]. Two tests keep each honest about what its own evidence says, and they can sit side by side on one timeline later without a drawn progression between them.
- **What the pilots already tested.** Both completed pilots traced **written assertions** to sources [record: Route W gate; Wikipedia pilot]. Test A tests something not yet tried: **physical evidence and scientific dating** as the primary tier. That is the more informative next step.

## 2. Test A — the question
> **For a small set of early *Homo sapiens* finds, can the timeline show each find as physical evidence with its scientific dating (method, material dated, stated range and uncertainty), keep classification and interpretation disputes visible as separate, attributed claims, and trace each to its primary scientific report, without implying a sequence, ancestry or progression the evidence does not state?**

**Why it helps assess the eventual timeline experience:**
- The concept's top tier is physical, dated evidence (T1) [record: concept §3.1]. This tests whether T1 can be shown with its dating method and uncertainty intact, which is the hardest display rule.
- It tests whether **disputed interpretation** (what a find *is*) can be kept apart from **what was found and dated**: the "show, don't tell" rule applied to a contested field.
- It tests our **computed links** (T3): placing finds by date range on one axis must not read as ancestry or succession.
- It measures access: scientific papers carry per-paper licences and paywalls, a different access profile from the floods pilots.

## 3. Candidate scope (all [recommendation])
| Parameter | Recommendation | Note |
|---|---|---|
| **Theme** | Early fossil finds attributed (by some or all researchers) to *Homo sapiens* | The attribution itself is a claim to be traced, not assumed |
| **Period** | Finds with published dates within roughly **350,000–100,000 years ago** | Bounds apply to the published date ranges; boundary-straddling ranges are listed, not silently dropped (as rule D in the Route W proposal) |
| **Geography** | **Africa**, recorded per site as **present-day country + site** | Present-day country is a location reference, never ancestry or nationality [record: Arts rules] |
| **Entries** | **≤ 5** finds; operational floor 3 (below that, inconclusive) | |
| **Entry type** | One entry = one find (a specimen or set of specimens from one site, as the source defines it) | Several dates per find are kept as several claims, not one |
| **Effort cap** | **3 h** total incl. selection, access/rights checks, tracing and report, with real-clock times; one GPT review outside the cap | Same as the Wikipedia pilot; stop at the cap and report what is unfinished |
| **Sources per claim** | ≤ 3, in a predeclared order | As the pilot |

**[unverified candidate] entries** (from background knowledge only, to show the kind of find meant; **none is checked or selected**):
- Jebel Irhoud (Morocco)
- Omo Kibish (Ethiopia)
- Herto (Ethiopia)
- Florisbad (South Africa)
- Klasies River (South Africa)

Their dates, attributions and even their fit to the period are unverified. A real test selects by the method in §4, not from this list.

## 4. Discovery and selection (fixed before any assessment)
**Option A1 [recommendation]: an encyclopedia list as a discovery index.**
- Use a single named list page (e.g. an English Wikipedia list of human evolution fossils [unverified candidate that such a list exists in usable form]), read at a pinned revision, as the **discovery frame only**.
- **Eligibility:** the list row names a site in Africa, a published age overlapping 350–100 ka, and an attribution that includes *Homo sapiens* (as the list states it).
- **Selection:** all if ≤ 5; otherwise the first 5 by `SHA-256("<seed>|HA|" + row identifier)`.
- The list is never used as evidence (T2-s). Its rows only point to finds.

**Option A2:** a review article as the discovery frame (more authoritative, but finding and accessing one is itself research and access-dependent).

**Option A3:** Chad names the ≤ 5 finds (fastest; selection then reflects his choice, recorded as such).

**Recorded before assessment, whichever option:** the route, the exact eligibility rules, the seed, and "not selected for favourable results".

## 5. Claim units and inventory boundary (fixed before tracing; the pilots' main lesson)
Per selected find, exactly these units:

| Unit | What it states | Typical tier of the supporting evidence |
|---|---|---|
| **F1 identity** | what was found (as the source describes it) and where (site) | primary report (T1 carrier) |
| **F2 location** | site location and its stated precision (named site; coordinates if given) | primary report |
| **F3 date(s)** | **each published dating result is its own unit**: method, material dated (specimen, sediment, associated artefact), value, uncertainty as stated (± / confidence level), and whether it is a minimum, maximum or direct age | primary dating report (T1 measurement, reported in a paper) |
| **F4 attribution** | the classification claim (e.g. "*Homo sapiens*", "early *H. sapiens*", other labels), **attributed to who says it** | primary report and/or later interpretation (T2-h); competing attributions are separate units |
| **F5 discovery date** | when the find was made (the event of discovery, distinct from the age of the find) | primary report or later history |

**Boundary:**
- Only these units; anything else in a source is out of the inventory.
- **The inventory is declared complete or partial up front.** If a source holds more dating results than the units list, they are listed as "further results, not inventoried" (the Wikipedia-pilot lesson: say partial, never imply complete).
- No unit is split or added after tracing begins.

## 6. Tiers kept apart (concept §3.1 applied)
- **Physical evidence (T1):** the specimen, the sediment, the sample. We never see it; we see a **report of a measurement**. Each F3 unit records the physical thing measured and the method, as reported.
- **Scientific dating:** method, laboratory/paper, value, uncertainty, calibration or model if stated, and the stated relationship between the dated material and the find (direct, bracketing layer, associated). **A date for a layer is not a date for the specimen** unless the source says so.
- **Source accounts and summaries:** primary report (the paper describing the find or dating); later interpretation or review (T2-h); encyclopedia or press summary (T2-s, repetition only, never qualifying).
- **Our computed links (T3, method-versioned):**
  - date-range overlap or ordering on the axis;
  - the present-day country lookup.
  - **Never** an ancestry, descent, "first", "earliest" or "led to" link unless a source states it, and then it is that source's attributed claim, not ours.

## 7. Uncertainty, disputes and lineage retained
- **Date ranges:** stored as stated (value ± uncertainty, confidence level, units such as ka/years BP with their definition if stated). Never rounded into a sharper figure. Minimum or maximum ages are labelled as such.
- **Several dates for one find:** shown side by side, each with method and material.
- **Different phenomena are not contradictions** (the floods-pilot lesson):
  - two dates for different layers, different materials or different methods are **different measurements**, not a contradiction;
  - a later re-dating is a **dated revision**, kept with its own publication date;
  - a contradiction is recorded only when two sources state incompatible values **for the same unit and the same referent**.
- **Disputed interpretation:** each attribution (F4) is a separate, attributed unit. Disagreement is shown as "Source X classifies…; Source Y classifies…", not resolved and not ranked by us.
- **Geographic uncertainty:** site precision as stated. If a source gives a region only, that is all we show.
- **Lineage:** a review or encyclopedia citing the primary report is **known dependent**; press coverage repeating a paper is repetition; unknown stays unknown. Independent corroboration needs evidence of independence (e.g. two laboratories, two methods, two papers by different teams — only where the sources show it).
- **Four dates kept apart (pilot lesson):** event age (the find's age) · discovery date · publication date · and, separately, any update, revision or copyright date on a page. Copyright years and "last updated" dates are never treated as publication dates.

## 8. Tracing, rights and access
- **Tracing:** from the selected find's discovery page to the cited primary report(s), then to the passage, table or figure stating each unit, recorded with page/section/table reference.
- **Routes:** open-access versions (publisher, repository, preprint) and archive captures, reached without account or purchase. **Inaccessible** is an allowed outcome (paywall, borrow-only). Sources are described as reached (or not) **through the inspected routes**, without claiming those are the only routes.
- **Rights per source, as observed:** licence statement on the paper (e.g. a CC licence) or rights notice, kept apart from publication, update and copyright dates. "No licence found" is not permission. No reuse is cleared by this test.
- **Media and specimen images: excluded.** No images of human remains are fetched or stored (sensitivity and rights).
- **Sensitivity (flags for Chad, decided by no one in the test):**
  - human remains and their holding institutions;
  - descendant-community and repatriation questions;
  - contested terms ("archaic", "modern", "anatomically modern") — each recorded as the source's term, in quotation, not as ours.
- **Public repo rule:** IDs, revisions, hashes and dispositions only. Passages stay in the Mac research folder, with quotes under 15 words.

## 9. Deliverable and outcomes
**Evidence table, one row per unit:**

| Find | Unit | Assertion (where it came from) | Physical thing / method | Value as stated (incl. uncertainty) | Source(s): identity, location in work, publication date, category, access route, rights as observed | Disposition | Notes (revision, dispute, referent, lineage) |

**Dispositions:**
- supported — qualifying (primary report or named T2-h);
- supported — repetition (T2-s);
- unsupported — `not stated` / `precision not supported` / `contradicted` (same unit, same referent only);
- inaccessible;
- no reference;
- not checked (`cap` / `outside bound`).

**Plus:** the inventory status (complete/partial), real-clock effort per step, and observed access obstacles (not a measured access-vs-reading split unless timed that way).

**Outcomes:**
| Outcome | Meaning |
|---|---|
| **Success (method)** | ≥ 3 finds selected by the fixed route; every inventoried unit has one disposition; dating units carry method, material and uncertainty as stated; disputes appear as attributed units; no T3 link implies ancestry; finished within the cap. **A low support rate can still be a success**: the test is whether the method shows the evidence honestly, not whether the evidence is strong. |
| **Partial** | The cap was reached, or some units are not checked; reported with exactly what is missing. |
| **Inconclusive** | < 3 eligible finds by the route, or access blocks most primary reports, so the method could not be judged. |

**Success selects nothing:** not the timeline's scope, not a route, not a prototype, not Phase A.

## 10. Decisions for Chad (none taken)
| | Decision | Recommendation |
|---|---|---|
| H1 | Two separate tests (evolution / history) vs one shared | Two; Test A first |
| H2 | Test A question (§2) | as written |
| H3 | Period and geography | ~350–100 ka; Africa; present-day country + site |
| H4 | Entries | ≤ 5, floor 3 |
| H5 | Discovery route | A1 (encyclopedia list as discovery frame only, hash selection); A2 or A3 as alternatives |
| H6 | Claim units | F1–F5 as §5; F3 one unit per dating result |
| H7 | Effort cap | 3 h + one GPT review |
| H8 | Sensitivity handling | images excluded; terms quoted as the source's; flags for Chad |

## 11. Test B (human history) — sketch only, for a later separate proposal
- **Shape:** one historical event that has both **contemporary written accounts** (T2-c) and **physical evidence**, to test how the two tiers sit together and how a disputed date is shown.
- **[unverified candidate] example:** the eruption of Vesuvius in 79 CE. Background knowledge suggests the traditional August date has been questioned by later evidence; that is unverified, and it is exactly the kind of claim a test would trace.
- Same rules as Test A: units fixed first, contradictions only for the same referent, four dates kept apart, ≤ 5 entries, cap and review.
- **Not proposed now; nothing selected.**

*This proposal authorises nothing beyond its own writing.*
