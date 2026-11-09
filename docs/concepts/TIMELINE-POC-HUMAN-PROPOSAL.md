# Timeline POC — human evolution and human history: bounded test proposal (rev 4, 9 Nov 2026)

**Status: proposal only (docs).** Chad's brief, 9 Nov: orient the next timeline proof-of-concept toward human history and evolution, using the accepted timeline concept (`docs/concepts/TIMELINE-CONCEPT.md` rev 3.1), the project records and the lessons of the completed pilots.

**What this document is and is not:**
- Written without research: no lookups, browsing, queries, sampling or downloads.
- **Every example comes from Claude's background knowledge and is labelled [unverified candidate].** Nothing rests on those examples being right.
- This proposal **selects neither the final timeline scope nor a research route**, and it is a research test, **not a prototype**. All parameters are recommendations for Chad's decision (§11), after GPT's review.
- **Related records:**
  - the completed **Route W gate stays closed** (rev 2 accepted by GPT);
  - the **Wikipedia-led pilot**: rev 1 findings recorded; rev 2 checked by GPT; **rev 2.1 (G-P2 row restored, §4 access wording) awaits GPT's sign-off** — its status is not otherwise changed here.

**ACCEPTED by GPT as a proposal (rev 4, 9 Nov 2026, relayed by Chad).** GPT's pick: H3b (i) and H8b no — a reviewer recommendation, **not Chad's decision**. H1–H8, H3b and H8b remain Chad's; even his parameter line approves parameters only, and the run needs its own go.

**Rev 4 (GPT's direct review of rev 3 in the shared folder, relayed by Chad, 9 Nov; docs only).** GPT closed the image/PDF, axis and scientific-comparability points. Two docs fixes:
1. **The one-sided age rule is put to Chad as its own decision (H3b).** A known minimum-only or maximum-only bound that could overlap the period is now its own outcome, **one-sided overlapping**, kept separate from **unknown basis** (§5). Rev 3's exclusion stays the recommendation, and the alternative is set out.
2. **Unfinished selection at 30 min = incomplete and inconclusive.** If screening or ranking is unfinished when the 30 min run out, selection is reported **incomplete and inconclusive**, even if 3 or more eligible finds have already surfaced. The 30 min sit inside the 3 h (§4, §10).

**Rev 3 (GPT's review of rev 2, relayed by Chad, 9 Nov; docs only).** Rev 2's accepted improvements are kept. Changes:
1. `pr-v1` now has explicit **inside / overlapping / outside / unknown–incomparable** outcomes. On a comparable basis, a minimum-only age above 350 ka and a maximum-only age below 100 ka are outside. Missing endpoints stay unknown. `ax-v1` assumes no 1950 reference where the basis is unstated. A midpoint is a labelled display aid only (§5).
2. Comparability before contradiction. Non-overlapping ranges indicate tension, not proof. Source-stated disagreement is recorded separately (§7).
3. Image scope made consistent: the default is strictly text-only (direct text/XML or unrendered HTML without fetching image resources). Unrendered PDF ingestion is a **separate option needing Chad's explicit choice**, acknowledging that the PDF's embedded image bytes are transferred (§9, H8).
4. Selection cap: **30 min for A1 frame discovery and selection, inside the 3 h total**; stop and report if the frame is unusable or insufficient (§3, §4).

**Rev 2 (GPT's review of rev 1, relayed by Chad, 9 Nov; docs only).** GPT supports the direction: two separate small tests, Test A first, as a recommendation. Five corrections:
1. Scientific age definitions and the period rule (§5, §6).
2. Disagreement and independence (§7).
3. Claim types versus discovered result units; outcomes reported separately (§4, §6, §10).
4. Evidence tiers and what "supported" means (§7, §10).
5. Operational image exclusion (§9).

Also: source selection is bounded, with no silent switch from A1 (§4); and Chad's design note on a separate page and view (§12).

**Rev 1 (9 Nov, `49685bd`):** first version.

**Labels:**
- **[record]** — from a saved project record.
- **[general knowledge, unverified]** — background knowledge, not checked.
- **[unverified candidate]** — an example that may or may not survive a real test.
- **[recommendation]** — for Chad's decision.

---

## 1. Shared test or two tests?
**Recommendation: two separate small tests. Test A (human evolution) is proposed now; Test B (human history) is a later, separate proposal.** [recommendation; GPT supports the direction]

- **Different evidence:** physical finds dated by scientific methods with stated uncertainties [general knowledge, unverified], versus written or recorded accounts with archaeology alongside. A combined test could not show which tracing problem causes trouble.
- **Different time scales:** deep-time ranges and historical dates need different uncertainty handling.
- **No forced connection:** one test would invite an implied line "from evolution to civilisation". The constitution says we force no view [record: START-HERE §2]. Two tests can later sit side by side without a drawn progression.
- **Not yet tested:** both completed pilots traced written assertions [record]. Test A tests physical observations and scientific dating instead.

## 2. Test A — the question
> **For a small set of early *Homo sapiens* finds, can the timeline show what each source reports was found, measured and dated (dated material, method, target quantity, value and uncertainty as stated), keep classification and interpretation as separate, attributed claims, and trace each claim to the passage that states it, without implying a sequence, ancestry or progression the evidence does not state?**

**Why it helps assess the eventual timeline experience:**
- It tests whether the timeline can carry a scientific age **with its definition intact** (what was dated, how, on what basis, with what uncertainty) rather than as a bare number.
- It keeps "what a source reports was measured" apart from "what a source infers" and "what we compute".
- It tests attributed disagreement and lineage in a contested field.
- It measures access to scientific papers (per-paper licences, paywalls, image-heavy formats).

## 3. Candidate scope (all [recommendation])
| Parameter | Recommendation |
|---|---|
| Theme | Fossil finds that at least one source attributes to *Homo sapiens* (the attribution is a claim to trace, not an eligibility fact we assert) |
| Period | Ages within roughly **350,000–100,000 years ago**, under the period rule in §5 |
| Geography | **Africa**, recorded per site as **present-day country + site**, at the precision stated. Present-day country is a location reference, never ancestry or nationality [record: Arts rules] |
| Entries | **≤ 5 finds**. **Operational floor 3** (a working minimum for a useful report, **not a statistical threshold**) |
| Effort cap | **3 h** total, incl. selection, access/rights checks, tracing and report; real-clock times; one GPT review outside the cap; stop at the cap and report what is unfinished. **Selection sub-cap: 30 min for A1 frame discovery and selection, inside the 3 h (not added to it).** |
| Sources per claim | ≤ 3, in a predeclared order |

**[unverified candidate] examples** (background knowledge only; **none checked, none selected**): Jebel Irhoud (Morocco), Omo Kibish (Ethiopia), Herto (Ethiopia), Florisbad (South Africa), Klasies River (South Africa).

## 4. Discovery and selection (bounded; fixed before any assessment)
**A1 [recommendation]: one named encyclopedia list page as the discovery frame only.**
- E.g. an English Wikipedia list of human evolution fossils [unverified candidate that a usable one exists].
- Read at a pinned revision. The list is a **finder only** (T2-s), never evidence.
- **Eligibility, judged from the list row as written:**
  - a site in Africa;
  - an age the row states, judged by the period rule (§5);
  - an attribution that includes *Homo sapiens* as the row states it.
- **Selection:** all eligible finds if ≤ 5; otherwise the first 5 by `SHA-256("<seed>|HA|" + stable row identifier)`.
- **Recorded before assessment:** route, list identity and revision, the exact rules, the seed, row identifiers.

**No silent switch, no extension.** Frame discovery and selection get **at most 30 minutes, inside the 3 h total** (not added to it). Selection stops and is reported **inconclusive** if, within that time:
- no usable frame is found; or
- the frame yields fewer than 3 eligible finds (an operational floor, not a statistical one); or
- **screening of the frame rows or the ranking is still unfinished at 30 min.** Then selection is reported **incomplete and inconclusive, even if 3 or more eligible finds have already surfaced**. Finds seen so far are listed as seen, not as selected, and nothing goes on to tracing.

 The run does not move to A2 or A3; either would be a separate decision by Chad.
- **A2** (alternative for Chad): a named review article as the frame.
- **A3** (alternative for Chad): Chad names the finds, recorded as his choice.

## 5. Scientific age definitions and the period rule
**Recorded for every dating result, as the source states it, or `unknown` where it does not say:**
- **Dated material:** specimen, sediment, associated artefact, flowstone, other.
- **Target quantity:** what the number estimates, e.g. the age of a sediment's last exposure, of a burnt artefact's heating, or of a specimen's mineral.
- **Value and units:** e.g. ka, years BP; and the **reference epoch** of "before present" if stated.
- **Uncertainty:** ± with its basis (1σ / 2σ / confidence level / range type).
- **Calibration, model or assumptions** stated.
- **Relationship to the find:** direct (on the specimen), associated (same layer/context), bracketing (above/below), or other, as stated.

**Ages kept apart; never merged:**
- the **specimen's age** (if a source infers one, that inference is its own claim);
- the **age of associated material or a layer**;
- the **deposition date** if stated;
- the **discovery date** (an event in recent history);
- the **publication, update and copyright dates** of the source.

**Period rule (eligibility only, versioned `pr-v1`).** Each dating result is first checked for a **comparable basis**: a stated quantity, stated units, and a stated or determinable reference (e.g. "ka" with its "before present" definition). Then exactly one outcome:

| Outcome | Rule (period 350–100 ka) |
|---|---|
| **Inside** | the stated range (value ± stated uncertainty, at the stated basis) lies wholly within 350–100 ka |
| **Overlapping** | part of the stated range lies inside and part outside → **eligible, flagged "boundary — overlaps the period edge"** |
| **Outside** | the whole stated range lies outside. **Minimum-only (≥ X):** outside if X > 350 ka. **Maximum-only (≤ Y):** outside if Y < 100 ka. |
| **One-sided overlapping** | a **known** one-sided bound on a comparable basis that could overlap the period: a minimum-only X ≤ 350 ka, or a maximum-only Y ≥ 100 ka. The missing endpoint stays **unknown**. **Recommendation: listed, not eligible** (rev 3's rule); the alternative is in H3b |
| **Unknown basis** | no comparable basis: unstated quantity, units or reference, or no uncertainty for a range test → **listed, not eligible**, with the reason. Kept separate from one-sided overlapping: here the age itself cannot be placed, while there the bound is known and only one end is missing |

- **Missing endpoints are never filled in.** A minimum-only age has an unknown upper end, and a maximum-only age an unknown lower end.
- **H3b, the one-sided rule, is Chad's decision.** Option (i), recommended: one-sided overlapping results are **not eligible**; they are listed with their bound. Option (ii): they are **eligible, flagged "one-sided — other end unknown"**, never given a filled-in endpoint or a midpoint. (ii) would admit finds whose age may lie wholly outside the period.
- A find is eligible if **any** of its frame-stated results is inside or overlapping (or one-sided overlapping, under H3b option ii only). All its results and their outcomes are listed.
- **Eligibility is judged at selection from the discovery frame row.** If the papers later show a different basis, that difference is recorded, and **selection is not redone**.

**Our axis (T3, versioned `ax-v1`):**
- Placement on the timeline axis is our computation, method-versioned.
- **The original values, bounds, units and basis are always preserved and shown.**
- **No reference date is assumed:** where a source's "before present" basis is unstated, **no conversion to calendar years is made** (e.g. no assumed 1950 reference). The value is placed on its own stated scale with "basis unstated", or not placed.
- **A midpoint, if used for placement, is a labelled display aid:** never a measured age, and never a replacement for the range. A result with a missing endpoint gets no midpoint.

## 6. Claim types, result units and inventory
**F1–F5 are frozen as claim *types*,** with inclusion rules:

| Type | Includes | Excludes |
|---|---|---|
| **F1 find identity** | what the source says was found (specimen(s)/assemblage), with the source's own identifiers | descriptions of morphology beyond identity |
| **F2 location** | site name, context/layer, coordinates if given, stated precision | regional narrative |
| **F3 dating result** | one unit per **published dating result** (per §5) | ages the source only *cites* from another paper (logged as citations, see below) |
| **F4 attribution / interpretation** | each classification or interpretive age statement, **attributed to its source** (e.g. "X infers the specimen is ~N ka", "Y classifies it as …") | our own wording |
| **F5 discovery** | when and by whom the find was made, as stated | later excavation history beyond the first report |

**Result units:**
- A **unit** is one instance of a type found in an inspected source. It gets a **stable identifier**: `<find id>|<type>|<source id>|<result label as printed, or table/row/page>`. Finds and assemblages use the source's own specimen or assemblage identifiers, recorded verbatim.
- **Logged consistently:** every additional dating result or competing attribution that an inspected source reveals, within the frozen types, is logged as a unit, whether it helps or hurts the figures.
- **Not silently omitted:** a revealed unit that cannot be assessed within the cap is logged "not checked — cap reached".
- **Cited-only ages:** an age a paper *cites* from another paper is logged as a citation link (unit pointer), not as a new result.

**Intended inventory boundary:** all F1–F5 units stated in the primary report(s) reached for each selected find, plus F4 units in the sources those reports cite for attribution, within ≤ 3 sources per claim.
- **Completeness is assessed after inspection**, never promised beforehand. The report says complete, partial or unassessed, per find, with what is known to be missing.

## 7. Evidence tiers, support and disagreement
**A primary paper is a carrier, not automatic T1.** Within any source, statements are classified separately:
- **Reported physical observations and measurements:** what was found, where; measured values with method. These are the closest we get to T1. We never see the object; we record a source's report of it.
- **Source-inferred statements:** a specimen age inferred from layer ages; a classification; an interpretation. **An associated layer's age is not a direct specimen measurement.** If a source infers a specimen age from it, that inference is an F4 unit, attributed.
- **Later interpretation or review (T2-h)** and **encyclopedia/press summaries (T2-s, repetition only)**.
- **Our computations (T3, versioned):** axis conversion (`ax-v1`), date-range overlap or ordering, the present-day-country lookup. **Never** an ancestry, "first", "earliest" or "led to" link unless a source states it, and then it is that source's attributed claim.

**What "supported" means:** the source **states the precisely scoped claim**: the same quantity, material, value and uncertainty, at the stated precision. **It does not mean we validated the method, the sample, or the interpretation.**

**Dispositions are unchanged from the accepted rules** [record: Route W proposal rev 4 §4.3, roll-v1]:
- the **five dispositions**: checked — supported · checked — unsupported · inaccessible · no reference given · not checked;
- **support-kind sub-fields:** qualifying / repetition; unsupported reasons: not stated / precision not supported / contradicted;
- **reference-level observations** kept;
- **one counted outcome per claim unit.**

**Comparability before contradiction:**
- Two results are compared only when **comparability is established**: the same **target quantity** and **referent** (the same material/layer/specimen), and compatible **units, reference dates, context/model and uncertainty meaning** (e.g. 1σ vs 2σ, range type).
- **Comparison not established:** wherever any of these cannot be established. Never forced either way (the floods-pilot lesson).
- **Comparable but non-overlapping:** stated ranges that do not overlap are recorded as **"tension"**. Tension does **not** prove a contradiction, and does not show which estimate is wrong.
- **Contradicted** (the disposition reason) is used only when a source's statement for the **same unit and referent** is incompatible with the claim as scoped. Our own range comparison never makes that call on its own.
- **Source-stated disagreement** (a paper saying it disagrees with, or revises, another result) is recorded **separately**, attributed to that source, apart from our tension observation.
- **Different methods may estimate the same target** (comparable, so tension is possible). **Different layers or materials usually concern different quantities** (comparison not established, unless a source asserts they estimate the same thing).
- A source-stated **revision or supersession** is kept, dated, with the earlier result still shown as recorded.

**Independence:**
- Different laboratories, teams, methods or papers **do not automatically** establish independence.
- Where known, record **shared samples, shared data, the same context/layer, shared assumptions or models, overlapping authors**.
- Independent corroboration is counted only with evidence of independence. **Unknown lineage stays unknown and is never counted.**

## 8. Uncertainty and geography (retained)
- Ranges as stated; never rounded sharper; minimum/maximum labelled; several results per find side by side; revisions dated.
- Site precision as stated; a region-only statement stays region-only; present-day country never stands for ancestry or nationality.
- Four date families kept apart (the pilots' lesson): event/age · discovery · publication · update/copyright. Copyright years and "last updated" dates are never treated as publication dates.

## 9. Tracing, access, rights and the image exclusion
**Default: strictly text-only access (operational image exclusion).**
- Allowed: **direct text or XML full text**, metadata/abstract pages, and **unrendered HTML** (the page's HTML fetched as text) **without fetching any image resources it references**.
- No image bytes are requested, transferred, stored, viewed, described or screenshotted.
- **If needed evidence is unavailable through these routes** (only in a PDF, a figure, an image-only table or a scan): the unit is **"not checked — outside bound (image only / text route unavailable)"**, or **inaccessible** if the text route itself is blocked. **The rule is not relaxed silently.**

**Separate option — NOT authorised by default; needs Chad's explicit choice (H8b):**
- Unrendered PDF ingestion: the PDF file is fetched and processed in memory to text, and only the text is saved.
- This **does transfer the PDF's embedded image bytes** (including any specimen images) to our tool, even though they are never rendered, viewed, described or stored.
- Chosen only by Chad, per run.

**Routes:**
- Open-access versions and archive captures, reached without account or purchase.
- Sources are described as reached (or not) **through the inspected routes**, without claiming those are the only routes.

**Rights, as observed per source:**
- licence statement or rights notice, kept apart from publication, update and copyright dates;
- "no licence found" is not permission;
- **no reuse is cleared by this test.**
- **The short-quote limit (under 15 words) is a working habit, not rights clearance.**

**Sensitivity flags (for Chad; not decided in the test):**
- human remains and their holding institutions;
- descendant-community and repatriation questions;
- contested terms ("archaic", "modern", "anatomically modern"), recorded as the source's terms in quotation, never as ours.

**Public repo rule:** IDs, revisions, hashes and dispositions only. Passages stay in the Mac research folder.

## 10. Deliverable and outcomes (reported separately)
**Evidence table, one row per unit:**

| Unit ID | Find | Type | Assertion (source and passage location) | Material / target / method / relationship | Value, units, epoch, uncertainty (as stated) | Statement class (reported measurement / source inference / T2-h / T2-s) | Source identity, location, four dates, access route, rights as observed | Disposition + sub-fields | Notes: referent, revision/supersession, comparison status, lineage, completeness |

**Four outcomes, reported separately (one does not imply another):**
| Outcome | Pass | Partial | Inconclusive |
|---|---|---|---|
| **Selection** | ≥ 3 eligible finds from the fixed frame, screened and ranked by the rule **within the 30 min** | — | frame not found within the sub-cap; or < 3 eligible; or **screening/ranking unfinished at 30 min — reported incomplete and inconclusive even if ≥ 3 eligible have surfaced** (**no switch to A2/A3**) |
| **Inventory** | all revealed units of the frozen types logged, completeness assessed per find | some sources not reached or the cap hit; missing parts named | completeness cannot be assessed |
| **Access** | text routes reached for the primary reports | some inaccessible or image-only (named) | most primary reports inaccessible |
| **Method** | every logged unit has one disposition; ages carry their definitions; disagreements compared only on a recorded referent; no T3 link implies ancestry; within the cap | cap reached with units not checked | method could not be applied honestly |

- **Low support rates are findings, not failures.**
- **No outcome selects anything:** not the timeline's scope, not a route, not a prototype, not Phase A.

## 11. Decisions for Chad

**DECIDED by Chad, 9 Nov 2026 (12:10 UTC, "its a go from me" on the line "H1–H8 as recommended, H3b (i), H8b no. Parameters only."):** H1–H8 as recommended; **H3b (i)** (one-sided overlapping bounds listed, not eligible); **H8b no** (strictly text-only). **Parameters only — the Test A run is not started and needs its own go.**

| | Decision | Recommendation |
|---|---|---|
| H1 | Two separate tests vs one shared | Two; Test A first |
| H2 | Test A question | §2 |
| H3 | Period, geography, period rule | ~350–100 ka; Africa; present-day country + site; `pr-v1` (inside / overlapping eligible; outside and unknown basis not eligible) |
| H3b | One-sided bounds that could overlap the period (minimum-only ≤ 350 ka, maximum-only ≥ 100 ka) | (i) **not eligible, listed with the bound** [recommended]; or (ii) eligible, flagged "one-sided — other end unknown", no filled endpoint or midpoint |
| H4 | Entries | ≤ 5; operational floor 3 |
| H5 | Discovery route and selection cap | A1, ≤ 30 min inside the 3 h; stop and report if unusable/insufficient, **or incomplete and inconclusive if screening/ranking is unfinished at 30 min**; no automatic A2/A3 or extension |
| H6 | Claim types and units | F1–F5 frozen as types (§6); every revealed unit logged; completeness assessed after inspection |
| H7 | Effort cap | 3 h + one GPT review |
| H8 | Sensitivity and image handling | strictly text-only (direct text/XML, unrendered HTML without image resources); otherwise outside bound / inaccessible; terms quoted as the source's |
| H8b | Unrendered PDF ingestion (transfers embedded image bytes) | **not recommended by default**; only by Chad's explicit choice |

## 12. Chad's design note — a separate page and view (recorded; nothing built)
- Chad (9 Nov): a timeline experience like this **needs its own page and view and cannot sit on the Mother Earth opening page**. He suggests starting to think about **tabs at the top of the screen**.
- Recorded as a **design direction for a later UX proposal**: the opening globe stays as it is, and future views (timeline, and perhaps others) would each be a separate page reached by top-level navigation.
- This fits the constitution's "the hub is the product; the page is a client" [record: START-HERE §2].
- **Not part of Test A** (a research test, not a prototype). No page, tab, navigation or code work is proposed or authorised here.
- **Separately:** a docs-only review of the opening page and the Met card's placement is running in parallel. It is referenced in the review relayed by Chad on 9 Nov, is not held in this repo, and is not changed by this proposal.

## 13. Test B (human history) — sketch only, for a later separate proposal
- **Shape:** one event with both contemporary written accounts and physical evidence, to test how those tiers sit together and how a disputed date is shown.
- **[unverified candidate] example:** the eruption of Vesuvius in 79 CE (background knowledge suggests its traditional date has been questioned; unverified).
- Same rules as Test A, adapted to written accounts.
- **Not proposed now; nothing selected.**

*This proposal authorises nothing beyond its own writing.*
