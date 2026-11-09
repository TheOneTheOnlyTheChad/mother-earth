# Timeline Route W — bounded first gate: parameters proposal (rev 4, 9 Nov 2026)

**Status: proposal only (docs).** Chad's brief, 9 Nov: bring forward TIMELINE-CONCEPT rev 3.1, especially Route W (Wikipedia/Wikidata first, library work later deepening or challenging it). This document recommends the parameters of the gate in concept §5A.4: period, region, language, event cap, effort cap, the claim-checking rule, and whether to include an independent reference list.

**Written from the accepted concept and saved project records only.** No provider research, queries, sampling, downloads, accounts, contact, REGISTER filing, prototype or production change. **Route selection, parameter selection and running the gate stay Chad's separate decisions.** The completed Arts reviews stay closed. The actual-iPhone check stays deferred.

**Rev 4 (GPT's direct review of rev 3 in the shared folder, relayed by Chad, 9 Nov; docs only).** Rev 3 kept. Three corrections:
1. Claims outside the checking rule are "not checked — outside rule", their references preserved but not evaluated; the roll-up applies only to within-rule claims (§4.3, §4.3a).
2. The matching clock is separate from the selection clock: candidates come from (temporal condition AND (shared area OR shared river)) OR a source link, with an episode window that keeps a Monday-start flood and a Wednesday crest together until identity is checked (§6.3).
3. Property mapping is verified within the gate by meaning/description and datatype, and against the properties actually present on the frozen items, before inventory; corrections recorded; frozen before support checking (§4.1).
Also recorded: GPT accepts support-first precedence for measuring whether a source states a claim, with contradictions, coarser-only support and partial checking kept visible and separate (§4.3a, §8).

**Rev 3 (GPT's review of rev 2, relayed by Chad, 9 Nov; docs only, `7de48f4`).** Rev 2's improvements are kept. Four targeted corrections:
1. **Event identity:** date overlap plus a shared area or river only *generates candidates*; identity needs documented evidence; even one weak candidate stays unresolved; flood episodes are kept apart from gauge crests, with many-to-one relationships recorded; identity matching is separate from selection eligibility (§6.3).
2. **Coverage counts:** no "at least" labels. Exact current classes within the fixed reference subset, labelled provisional where discovery is incomplete, summing to the subset size; stable source-row identifiers and tie-breaking for subsetting keys (§6.2, §6.4).
3. **Multiple references and external reuse:** a predeclared roll-up from reference-level observations to one claim disposition, keeping contradictory and partially checked references and counting each claim once; circular-only repetition never becomes qualifying support (§4.3, §4.4). Accepting Wikidata/Wikipedia terms does not clear external works; quotation length is not rights clearance (§5).
4. **Frozen protocol:** property-ID → claim-group table with unmapped statements logged; eligibility re-evaluated on pinned item data before the sample is frozen; hierarchy provenance and query/item discrepancies kept; an unverifiable candidate frame is reported incomplete with its reproducibility limits (§3.3, §4.1).

GPT's answers to rev 2's four points are recorded in §8.

**Rev 2 (GPT's review of rev 1, relayed by Chad, 9 Nov; docs only, `3c3f321`).** Six corrections:
1. Imported references are references: import provenance is kept as a separate field, and dependency is not treated as circularity without evidence (§4.3, §4.4).
2. A claim stated more precisely than its source supports is "checked — unsupported"; the coarser supported value is recorded beside it (§4.3).
3. Coverage claims are bounded: five outcome classes, list size and matching rules fixed beforehand, gauge comparisons kept to the gauge's own coverage (§6). The national fallback is now an option, not the recommendation (§3.2).
4. Selection is reproducible: date precedence, boundary precision, conflicts, place and type chains, stable ordering, a deterministic hash-based sample, and discovery truncation reported (§3.3).
5. Caps are handled honestly: incomplete inventory is reported as such; checking coverage sits beside every rate; a zero denominator is N/A; the 10-event floor is operational, not statistical (§4.5, §5).
6. Full rule carryover and terms sequencing (§1, §5).

Pennsylvania, 1870–1927, English and six hours remain **candidate recommendations, with no completion guarantee**.

**Rev 1 (9 Nov, `79b0cf1`):** first version, for GPT.

**Labelling in this document:**
- **[record]** — from a saved project record (named).
- **[general knowledge, unverified]** — Claude's background knowledge, not researched for this project. Such statements are expectations for the gate to confirm or refute; nothing rests on them being true.
- **[recommendation]** — Claude's proposal for Chad's decision, open to GPT's review.

---

## 1. Rules carried over unchanged from rev 3.1

Restated so the gate can be run from this document. Nothing here relaxes them.

| Rule | Concept |
|---|---|
| **Tiers stay apart.** Wikidata statements and Wikipedia text are **T2-s** (summary or structured assertion), never T1 or T2-c. | §3.1, §5A.1 |
| **Embedded passages are classified on their own.** A passage quoted or printed inside another work (an encyclopedia quoting a contemporary letter, a book printing a diary) is classified by **its own** relationship to the event (T2-c, T2-r, T2-h or T2-s). The carrying work keeps its own category. Format never decides the category; where the relationship cannot be established, it says "relationship to the event unknown". | §3.1 |
| **Display rule.** A claim is shown as an **established event** only when traced to a qualifying supporting source (T1, T2-c, or a named T2-r/T2-h work), each shown with its category. An untraced assertion may be shown only as an **unverified source assertion** ("Wikidata (revision …) states …; not traced to a supporting source") and never counts as corroboration. | §5A.1 |
| **Tracing is not truth.** "Checked — supported" means the cited passage states the claim. It does not establish that the event happened as stated. A recorded story is evidence that the story exists. | §3.1 |
| **Pinned revisions.** Every item and article used is recorded with its exact revision ID, the retrieval time and the date last checked. A re-check is a dated event. | §5A.2 |
| **Source and location references.** Every supporting source carries a stable identifier (Wikidata where one exists) and a page / column / line / scan-coordinate reference. | §3.2 |
| **Two dates, always.** Publication date and event date (or range) are stored separately, each with its uncertainty and its basis ("source states", "inferred by …", or an explicit **"unknown"**). | §3.1, §3.2 |
| **Uncertainty kept.** Wikidata date precision, "circa", earliest/latest dates and disputed-by statements carry through; nothing is rounded into a sharper date. Place keeps its **geographic uncertainty** and how it was resolved ("historical name mapped to a present-day region — not historical sovereignty"). | §3.2, §5A.2 |
| **T1 dating.** Any T1 evidence met (e.g. a gauge record) keeps its dating method and stated uncertainty; a T1 date is never shown without them. | §3.1, §3.2 |
| **Rights per item.** The rights status of each supporting work's text and of its scan or page image is recorded per item. | §3.2 |
| **Method versions.** Anything we compute (T3) — here, the reference-list matching (§6) and the sampling (§3.3) — carries a method version. | §3.2 |
| **Reference lineage.** Three states: independent, with supporting evidence · known dependent · relationship unknown. Wikipedia and Wikidata citing the same source = one account. A reference shown by evidence to rely on Wikipedia is circular and known dependent. Only the first state raises a corroboration count; unknown never does. | §3.1, §5A.2 |
| **Five claim dispositions**, exactly one per claim: checked — supported · checked — unsupported · inaccessible · no reference given · not checked. This proposal adds **sub-fields** (reasons and kinds), never a sixth disposition. | §5A.4 (3) |
| **Support rates over checked claims only:** supported ÷ (supported + unsupported). Inaccessible, no-reference and not-checked counts shown beside it, never folded in. | §5A.4 (4) |
| **Gaps.** No item in Wikidata = unassessed coverage, not absence. "Nothing found in our results" never becomes "nothing happened". | §3.3, §5A.2 |
| **Media excluded.** Images, maps and audio are licensed per file and stay out unless separately reviewed. | §4.1 |
| **Terms record, nothing filed.** Research-only terms record + draft REGISTER wording. Filing is Chad's separate authorisation. | §4.1, §5A.4 (4) |
| **A cleared gate selects nothing** — not History, a route, a prototype or Phase A. | §5A.4 (6), §5.4 |

---

## 2. Recommended parameters (summary)

| Parameter | Recommendation | Main reason |
|---|---|---|
| **Theme** | Water and floods (river and coastal) | Fixed by §5A.4 so both routes share ground |
| **Period** | **1870–1927**, by the selection date defined in §3.3 | Printed material for a later Route L pass plausibly out of US copyright; instrument river records plausibly exist |
| **Region** | **Pennsylvania, fixed.** If it yields too few events, the result is **inconclusive**, not widened (GPT's recommendation, adopted here). A national fallback stays available as an option for Chad (§3.2). | Keeps the reference-list comparison and the sample on the same ground |
| **Language** | **English** (Wikipedia article and labels); cited works in any language may be checked | Chad and GPT can verify English |
| **Event cap** | **≤ 30** selected by a deterministic sample (§3.3); **operational floor 10** | 10 is a working minimum for a useful report, **not a statistical threshold** |
| **Effort cap** | **6 h** of gate work incl. write-up, fixed sub-caps (§5), one GPT review outside the cap. **No completion guarantee.** | Reference tracing is the unmeasured risk (§5B) |
| **Checking rule** | All date and place claims of every selected event, then all scale and relationship claims of 10 events, in hash order (§4.2) | Dates and places are the timeline's spine |
| **Independent reference list** | **Yes, recommended**, with its size, subsetting and matching rules fixed before the Wikidata selection is seen (§6) | The only way to say anything bounded about missed events |
| **Seed** | `20261109`, used as a fixed salt in SHA-256 keys (§3.3) | A seed alone does not fix an order; the algorithm does |

Each row is a separate decision for Chad (§9).

---

## 3. Period, region, language and selection

### 3.1 Why share ground with Route L
§5A.4 asks for the same theme, period and region as Route L, so the two routes can be compared and later book mining can deepen or challenge the Route W skeleton (§5B). Route L's stage-1 criteria (§5.1) were kept in mind: assessable rights, page images, manageable volume, a T1 anchor, and testable reprinting. **Risk recorded:** if Route L later finds no suitable corpus here, the comparison weakens. That is a finding, not a reason to change Route W's parameters afterwards.

### 3.2 Recommendation and reasoning
**Period 1870–1927.**
- The end year keeps a later Route L corpus inside material plausibly in the US public domain **[general knowledge, unverified]**. Public domain in one jurisdiction is not public domain everywhere, and OCR, page images and metadata can carry different terms **[record: concept §4]**. The gate assumes none of it.
- The start year reflects that systematic river-stage records plausibly exist from about then for larger US rivers **[general knowledge, unverified]**. Whether a usable T1 anchor exists is for the gate to find (§5.1 criterion 4).

**Region: Pennsylvania, fixed [recommendation].**
- One state, so the independent reference list (§6) and the Wikidata selection can cover the same ground.
- Reasons for this state are all **[general knowledge, unverified]**: major rivers with recorded floods in the period, including the 1889 Johnstown flood, very likely to have a Wikidata item; and Pittsburgh at the head of the Ohio River, a plausible site of a long river-stage record. The Library of Congress OCR packages are already one of the concept's Route L leads **[record: concept §4]**; their coverage here is not assessed. **These are reasons to expect a workable set, not evidence of one.**
- Ohio (same basin) is the alternative candidate; Chad may name any state. The rules below apply unchanged.
- **Sparse result:** if fewer than 10 events are eligible, selection is reported **inconclusive** with what was found, and checking still runs on what was selected only if Chad's go says so (decision D3b). The floor is operational: it says the report would be thin, not that a statistical test failed.

**Option for Chad, not recommended: national fallback.** If Chad keeps it, it is defined now:
- **Changed predicate:** the place chain (§3.3 rule P) resolves to any one of a fixed list of the 48 contiguous states plus the District of Columbia, recorded with their Wikidata IDs at gate start; type and date rules unchanged.
- **Trigger:** fewer than 10 eligible Pennsylvania events after complete discovery.
- **Sample:** the same deterministic hash sample (rule S) over the national eligible set.
- **Separation:** Pennsylvania and national results are reported in separate tables with separate rates; nothing is pooled. The reference-list comparison (§6) covers Pennsylvania only.

**Language: English.**
- English Wikipedia for article context and English labels. Labels in other languages are recorded where present but not used for selection.
- Cited works in other languages may be checked; any translation is labelled as Claude's and the original passage reference is kept.
- **Disclosed limitation:** English-language coverage follows English editors' interests (§5A.3). Stated in the gaps section.

### 3.3 Selection rules (recorded verbatim at gate start, before any results are seen; method version `sel-v1`)

**Rule T — type.** The item has an *instance of* value that is the flood class or a subclass of it reached through *subclass of* links, up to **4 hops** (a provisional effort boundary, not a completeness claim). The class list is **frozen at gate start**: each class ID with its revision ID and retrieval time, and the *subclass of* path that put it on the list (**hierarchy provenance**). Items typed only by a class outside the frozen list are not eligible; if discovery shows them (e.g. an item about a flood typed as "disaster"), they are listed as "type outside rule" for the coverage report (§6), not added.

**Rule D — date.**
- **Selection date**, by precedence:
  1. *start time*;
  2. else *point in time*;
  3. else the item has **no selection date** and is listed "no event date — excluded".
- **Rank:** preferred-rank statements first; if none, normal rank. Deprecated statements are recorded but never used.
- **Interval:** each value is read as the interval its precision implies (day → that day; month → the month; year → the year; decade → the decade; coarser → that span). *Earliest date* / *latest date* qualifiers widen the interval to the qualifier values.
- **Eligible** only if the selection value's whole interval lies within 1 Jan 1870 – 31 Dec 1927.
- **Boundary:** an interval that overlaps the period but extends outside it is listed "boundary — precision or qualifiers span the period edge — excluded". Never silently dropped.
- **Conflicts:** if the chosen rank holds two or more values for the same property, the item is eligible only if **every** such value is wholly inside the period; otherwise it is listed "conflicting dates — excluded". All values are recorded either way, side by side.
- **Start vs point in time disagreeing** (both present): the start time governs **eligibility only**; that does not settle the historical disagreement, which is recorded as a claim pair for checking.

**Rule P — place.**
- Each *location* and *located in the administrative territorial entity* value is followed upward through *located in the administrative territorial entity* links, up to **6 hops** (provisional effort boundary, not a completeness claim), to see whether it reaches the Pennsylvania item (ID recorded at gate start). Every hop is recorded with the item ID and the revision read (**hierarchy provenance**).
- **Eligible** if at least one place value reaches it. The full path is recorded per item; other places (e.g. a flood spanning two states) are recorded too.
- **Not eligible, listed with the reason:** country-only place ("place too coarse"); coordinates only, with no administrative chain ("coordinates only — not resolved; no point-in-polygon computation in this gate"); a chain that stops before a state ("chain unresolved"); a historical entity whose chain does not reach the state item ("historical entity — chain does not reach the state item", recorded verbatim, not mapped by us).

**Rule O — stable ordering.**
- Every candidate is keyed by its numeric Q-number. Discovery output is sorted by that number ascending before anything else happens, so the order never depends on how the service returns rows.

**Rule S — sample (deterministic).**
- If the eligible set has ≤ 30 items, all are selected.
- If it has more, each eligible item gets the key `SHA-256("20261109|S|" + Qid)` (hex, Qid as written, e.g. `Q123`). Items are sorted by key ascending (ties, if any, by Q-number) and the **first 30** are selected. The rest are recorded as "eligible, not sampled (cap)".
- The same construction, with a different label, orders everything else that needs an order: `|B|` for the 10 Step-B events and `|C|` for claims (§4.2), `|R|` for reference-list subsetting (§6.2). Anyone can recompute every key from the Qids, the statement IDs and the seed.

**Rule X — discovery completeness.**
- The discovery method is recorded in full: endpoint, exact query text or request, time sent, row count, and any limit, timeout, error or partial result.
- If anything suggests truncation or incompleteness (a hit limit, a timeout, an error, a result count equal to a page size), discovery is reported **incomplete**, and every result that depends on it is labelled **provisional** (§6.4).
- Discovery output is the **candidate frame**: everything returned, before eligibility is judged.

**Rule V — verify on pinned data, then freeze (before rule S runs).**
- Query-service results can lag the live items **[general knowledge, unverified]**. So every candidate in the frame is read from its item at a **pinned revision** (ID and retrieval time recorded), and rules T, D and P are **re-evaluated on that pinned data**. Eligibility is decided by the pinned data, never by the query result.
- Every **query/item discrepancy** (a candidate the query called eligible that the pinned data does not, or the reverse; a differing date, place or type) is kept in a discrepancy log.
- Only then is the eligible set frozen, sorted (rule O) and sampled (rule S). The frozen set, the pinned revisions and the keys are saved before inventory begins.
- **If the frame cannot be verified within the selection sub-cap** (too many candidates to pin, or reads failing), selection is reported **incomplete**: which candidates were verified on pinned data, which were judged only from query results, and the **reproducibility limit** that follows (the sample cannot be recomputed exactly from pinned data alone). Unverified candidates are never silently treated as verified.

---

## 4. Claim inventory, checking and dispositions

### 4.1 What counts as a claim
For each selected event, every statement whose property is in the frozen mapping below is one claim, recorded with its value, precision, rank, qualifiers, statement ID and references exactly as at the pinned revision.

**Property → claim group (starting mapping `map-v1`; verified and frozen as `map-v2` before inventory).** The property IDs below are **[general knowledge, unverified]**. A label match alone is not enough. Within an authorised gate, after the event sample is frozen (rule V) and **before inventory**:
1. **Meaning check:** for each mapped property, the pinned property page's **label, description and datatype** are read and recorded (revision ID, retrieval time). A property whose meaning or datatype does not fit its group is corrected or removed.
2. **Presence check:** every property actually present on the frozen items is tallied (property ID, label, datatype, number of items, number of statements). Each present property is either mapped to a group, logged as unmapped (below), or counted only, **with the reason recorded**.
3. **Corrections** (added, removed or regrouped properties) are recorded with their rationale. The result is frozen as `map-v2` and saved **before any support checking**. It is never changed after checking begins.
4. **Unresolved membership** (a property whose group cannot be decided) is recorded as such, its statements logged, not checked, and the resulting **coverage limitation** stated in the report.

| Group | Properties (ID — expected label) |
|---|---|
| **Date** | P580 start time · P582 end time · P585 point in time · P1319 earliest date · P1326 latest date (the last two also as qualifiers) |
| **Place** | P276 location · P131 located in the administrative territorial entity · P625 coordinate location · P17 country · P206 located in or next to body of water |
| **Scale** | P1120 number of deaths · P1339 number of injured · P2630 cost of damage |
| **Relationship** | P361 part of · P828 has cause · P1542 has effect · P155 follows · P156 followed by · P793 significant event |
| **Type** (recorded, not checked) | P31 instance of |

*(Starting list only; the gate uses the verified `map-v2`.)*

- **Unmapped but possibly relevant statements are logged, not dropped.** Any statement outside the mapping whose value is a date, a quantity, a place item or another event item goes into an "unmapped, possibly relevant" log (property ID, label, value, statement ID). It is not a claim in this gate, but the log is reported, so a missing property (e.g. a displaced-persons figure) is visible.
- Other statements (labels, images, external identifiers) are counted only.
- **Wikipedia article text is context, not claims** (§5A.1). If the article cites a source for a fact that the Wikidata claim leaves unreferenced, the footnote is recorded as a **lead** (article revision ID + footnote) beside the claim. Leads are not checked in this gate (decision D6).

### 4.2 Checking rule (recorded before checking; method version `chk-v1`)
1. **Order:** each claim gets the key `SHA-256("20261109|C|" + statement ID)`; claims are taken in key order within each step. The ordered list is saved before the first check.
2. **Step A:** all date and place claims of all selected events.
3. **Step B:** all scale and relationship claims of 10 events chosen by key `SHA-256("20261109|B|" + Qid)` (all events if fewer than 10). **Step A always runs first; Step B uses only what remains of the checking sub-cap.** Step B claims not reached are "not checked — cap reached".
4. **Cap reached:** a claim inside the rule not reached before the checking sub-cap ends is **not checked**, with reason **"cap reached"**, distinct from "outside the rule".

### 4.3 Dispositions and sub-fields
**Each reference is recorded with:**
- its own properties as stated;
- a separate **provenance** field: `cited work` (a book, article, page or record) or `imported from a Wikimedia project` (which project and edition, and any revision or date the reference gives).

**An imported reference is still a reference.** A claim whose only reference is a Wikimedia import is **not** "no reference given".

| Situation | Disposition | Sub-fields |
|---|---|---|
| Cited work reached; passage states the claim **at its stated precision** | **checked — supported** | **support kind:** `qualifying` (source is T1, T2-c, or a named T2-r/T2-h work) or `repetition` (source is T2-s, including a Wikimedia source repeating the assertion). Category, page reference, both dates and rights recorded. |
| Cited work reached; passage states it only at a **coarser** precision (e.g. year where Wikidata states a day) | **checked — unsupported** | reason `precision not supported`. The **supported coarser value** is recorded in a separate field, with the passage. The original assertion and its precision are kept unchanged. Never counted as supported, never silently repaired. |
| Cited work reached; passage does not state it | **checked — unsupported** | reason `not stated in cited passage` |
| Cited work reached; passage contradicts it | **checked — unsupported** | reason `contradicted`; both values recorded side by side, not resolved |
| Imported reference: the Wikimedia source was reached at the edition and revision it names (or, if it names none, at a revision recorded by us and labelled as our choice) | as above | support kind `repetition` if it repeats the assertion. **A Wikimedia source repeating an assertion is never qualifying support.** |
| Cited work could not be reached without an account, a purchase, contact, or a download outside the bounded set | **inaccessible** | named, with why |
| No reference of any kind | **no reference given** | lead recorded if a Wikipedia footnote exists |
| Claim outside the checking rule (§4.2) | **not checked** | reason `outside rule`. Its references are **preserved as recorded but not evaluated**; no reference-level observations are made |
| Claim inside the rule, not reached before the sub-cap ended | **not checked** | reason `cap reached` |

**A qualifying source must itself be classified on its own terms.** If the cited work is an encyclopedia that prints a contemporary letter, the letter passage may be T2-c (qualifying), while the encyclopedia's own narrative is T2-s (§1).

**Imported reference with no named revision:** a revision chosen by the checker is acceptable **only as explicitly dated T2-s repetition evidence** ("Wikipedia, revision …, read …, repeats the assertion"). It is **not** a reconstruction of the unspecified revision the statement was originally imported from.

### 4.3a Roll-up: from references to one disposition per claim (method version `roll-v1`, fixed before checking)
**Scope:** the roll-up applies only to claims **inside the checking rule**. A claim outside the rule is "not checked — outside rule"; its references stay in the inventory as recorded and are not evaluated, so it never receives reference-level observations.

**What the roll-up measures:** whether the cited sources **state** a claim. It does not establish historical truth, nor agreement among sources (GPT, 9 Nov).

The table above describes one reference. A claim inside the rule may carry several, so each reference gets a **reference-level observation** first:

`qualifying support` · `repetition support` · `coarser only` · `not stated` · `contradicts` · `inaccessible` · `not checked (cap)`

All observations are kept and reported. **None is discarded because another reference decided the claim.** The claim then gets **exactly one** disposition, by the first rule that applies:

| # | If, among the claim's references… | Claim disposition | Sub-fields always recorded |
|---|---|---|---|
| 1 | there are none | **no reference given** | lead, if any |
| 2 | none was reached (all `not checked (cap)`) | **not checked** — `cap reached` | — |
| 3 | at least one `qualifying support` | **checked — supported**, kind `qualifying` | `also repeated` if any repetition support; **`contradicted by`** listing every `contradicts` reference; **`coarser only`** listing, separately, every reference that supports only a coarser value (with that value); `partially checked (n of m)` if any reference was not reached |
| 4 | else at least one `repetition support` | **checked — supported**, kind `repetition` | same `contradicted by`, `coarser only` and `partially checked` fields |
| 5 | else at least one `contradicts`, `coarser only` or `not stated` | **checked — unsupported**, reason = the strongest present (contradicted > precision not supported > not stated) | `partially checked` if any reference was not reached; the coarser supported value, if any |
| 6 | else (everything reached was `inaccessible`) | **inaccessible** | `partially checked` if any were not reached |

- **Each claim is counted once** in every rate (§4.5), whatever its number of references.
- Supported claims with a `contradicted by` field and supported claims with a `coarser only` field are reported on **two separate lines** beside the rates. **Coarser-only support is not a contradiction** and is never counted as one. Contradictions are shown side by side, not resolved.
- `partially checked` claims are reported as a count beside checking coverage, so a claim decided on one of three references is never presented as fully checked.

### 4.4 Lineage
- References are grouped by the work they cite, after resolving editions where the record allows; a group is one account.
- **Dependency is recorded only with evidence:** e.g. an import reference shows the Wikidata statement was taken from a Wikipedia edition (known dependent between those two); a cited work that names the same source as another reference (known dependent).
- **Circularity is recorded only with evidence of a loop:** e.g. a cited work that itself cites the Wikipedia article or the Wikidata item. Dependency alone is not circularity.
- **Circular-only repetition is never qualifying support.** If a passage's only basis is shown to be the Wikipedia article or the Wikidata item, its observation is `repetition support`, even when the work carrying it is a later history (T2-h). The carrying work's category does not turn repeated encyclopedia content into historical support.
- States per §3.1. "Independent" needs the evidence written down. Unknown is shown as unknown and never counted.

### 4.5 Rates and coverage, reported together
For each step and overall, the report shows:
- **Checking coverage:** claims checked ÷ claims inside the rule, and claims checked ÷ all inventoried claims, with the "cap reached" count.
- **Qualifying support rate:** qualifying-supported ÷ (supported + unsupported).
- **All-support rate:** (qualifying + repetition) ÷ (supported + unsupported), shown **only beside** the qualifying rate, never alone.
- **Unsupported, by reason:** precision not supported · not stated · contradicted.
- **Beside them:** inaccessible, no reference given, not checked (each by reason).
- **Also beside them:** claims supported despite a contradicting reference; claims supported with a coarser-only reference (a separate line); claims decided while partially checked (§4.3a). Each claim is counted once, whatever its number of references.
- **N/A** wherever the denominator is zero. No rate is shown without its coverage figures.
- Rates **describe the selected sample only**; they are not estimates for Wikidata generally or for the state.

---

## 5. Effort cap, sub-caps and terms sequencing

**Recommended: 6 h of gate work, write-up included, plus one GPT review outside the cap. 5 h if the reference list is not chosen.** Completion within the cap is **not guaranteed**: neither route's real effort has been measured (§5B).

| # | Step | Sub-cap | If time runs out |
|---|---|---|---|
| 0 | **Terms record** (see below) | 0.75 h | Unresolved terms reported as unresolved |
| 1 | **Independent reference list** (if chosen, §6), fixed and saved **before** step 2 | 1 h | Missed events reported "unmeasured" |
| 2 | **Discovery, verification on pinned data and selection** (§3.3, rules X and V) | 0.75 h | Discovery or frame verification reported **incomplete**, with which candidates were verified and the reproducibility limit; dependent results labelled **provisional** |
| 3 | **Inventory** (§4.1) of all selected events; ordered claim list saved | 0.75 h | Reported **incomplete**: events inventoried, events not inventoried, **remainder of claims unknown**. No statement of complete claim coverage. Checking applies only to inventoried claims. |
| 4 | **Checking** (§4.2) | 2 h | Unreached claims "not checked — cap reached" |
| 5 | **Report** (§7) | 0.75 h | — |

- Unused time does not move between steps.
- Start and end of each step are taken from a real clock, never estimated **[record: START-HERE §9]**.

**Terms sequencing (concept §4.1 lists four materials):**
- **Step 0 covers two providers' terms up front:** **(a)** Wikidata structured data and **(b)** Wikipedia article text. Direct extraction of operative wording, labelled with who read it; draft REGISTER wording; nothing filed. Where Claude's fetch tool is refused by a host, the item is listed for GPT's extraction rather than worked around **[record: HANDOVER "Learned"]**.
- **(c) Media:** recorded as **excluded, not assessed**. No media is fetched or stored.
- **(d) Referenced external works:** **not cleared up front.** Each work reached during checking has its own conditions recorded **as encountered** (text rights, scan rights, access conditions). Step 0 grants nothing for works discovered later. A citation in Wikipedia or Wikidata grants nothing for the cited work.

**Accepting the Wikidata/Wikipedia terms does not clear external works.** Text, scans and passages copied from cited works stay subject to **their own reviewed reuse basis**, and to separate publication and REGISTER-filing authorisations from Chad. Nothing from an external work is published because it was reached through Wikidata or Wikipedia.

**Public-repo rule:** until the terms record for (a) and (b) is accepted, the repo holds only IDs, revision IDs, statement IDs, retrieval times, our dispositions, keys and page references. Copied statement values, article text and passages from cited works stay in the Mac research folder, as for the earlier fireballs research **[record: HANDOVER §1-old item 6]**. Even after acceptance, external-work content follows the rule above. Quotations are kept short (under 15 words) and used only where wording decides support; **the length limit is a working habit, not rights clearance.**

---

## 6. Independent reference list (recommended option)

### 6.1 Why
- Without it, the gate measures claim support only among events Wikidata already has. Editor-driven coverage, Route W's main named risk (§5A.3), stays unmeasured (§5A.4 (5)).
- A list from a physical record (e.g. recorded crests at a named river gauge) would also be a candidate **T1 anchor** for a later Route L pass (§5.1 criterion 4).
- Finding the list is itself provider research. It happens only inside an authorised gate, within its 1 h sub-cap. If no suitable list is established, missed events are reported unmeasured.

### 6.2 Rules fixed before the Wikidata selection is seen (method version `ref-v1`)
- **Independence:** compiled by a named source that does not draw its list from Wikipedia or Wikidata. The source, and why it counts as independent of them in selection, is recorded. (Independence of *selection* is what coverage needs. Whether the list's source can also corroborate a claim is a separate lineage question, §4.4.)
- **Own coverage stated first:** the list's geographic coverage (a state, a river reach, a single gauge) and its event definition (e.g. "crest above flood stage at gauge G") are recorded verbatim. **Comparisons are restricted to that coverage:** a single-gauge list speaks only for floods at that gauge as it defines them, not for the state.
- **Scope filter:** only entries whose stated date and place fall inside the selection period and Pennsylvania (and inside the list's own coverage) are used.
- **Stable source-row identifiers:** when the list is fixed, every entry gets a row ID: the list's own entry ID where it has one; otherwise `<source document ID>|<page or table>|<row position as printed>`. Row IDs are unique by construction, so two entries with the same date and place never share a key.
- **Size and subsetting:** if ≤ 40 entries remain (a provisional effort boundary), all are used. If more, each gets the key `SHA-256("20261109|R|" + row ID)`; ties, if any, are broken by row position as printed. The first 40 by key form the **fixed reference subset**; the rest are recorded as "not in the subset".
- **Saved with a real-clock time** before step 2 begins.

### 6.3 Identity matching (a T3 computation by our method, version `match-v2`)
Identity matching is **separate from selection eligibility**. It runs against every item in the candidate frame (eligible, excluded and type-outside-rule alike), uses the pinned data (rule V), and never changes the selection.

**The matching clock is not the selection clock.** Rule D uses an item's start (or point-in-time) date only to decide eligibility. Matching needs the whole episode: a flood that starts on a Monday and a gauge crest on the Wednesday may be the same episode. So matching uses its own interval, defined here.

**Matching interval of an item** (method version `match-v3`):
- **Documented timing first:** if the item, or a source cited on it, documents the episode's timing (an end time, a latest date, or a dated crest or peak), the interval runs from the earliest to the latest documented value, each read at its precision.
- **Otherwise, a provisional window:** from the start of the selection value's precision interval to **30 days after its end**. The 30 days is our candidate-generation boundary, not evidence that the episode lasted that long, and not identity evidence.
- The interval used, and which of the two ways produced it, is recorded per item.

**Step 1 — candidates.** An item is a candidate for a list entry when:

**C = ( T AND ( A OR R ) ) OR L**, where:
- **T (temporal):** the entry's date interval (at its stated precision) overlaps the item's matching interval;
- **A (shared area):** the entry's place is one of the item's place values or lies on that value's administrative chain;
- **R (shared river):** the item names the entry's river, or the gauge's locality, as a place;
- **L (source link), stated separately:** the item or a source cited on it explicitly refers to the list's record, the gauge record, or the same named event, whatever T, A and R say.

**This only generates candidates; it does not establish that they are the same flood.** Name similarity alone makes no candidate. A pair that fails T only because of the 30-day window, but is linked by L, is still a candidate. The condition that admitted each pair (T∧A, T∧R, L, or several) is recorded.

**Step 2 — identity.** A candidate becomes a **same-event match** only with **documented identity evidence**, recorded per pair, such as:
- the item, or a source cited on it, names the gauge, its locality or the list's own record of the event, with a consistent date; or
- the list's source names the event in a way that resolves to the item (e.g. the same named flood, with a consistent date and place).

**Without such evidence the pair stays unresolved, even if it is the only candidate.**

**Episodes and crests are different things.** A gauge list records **crests** (a peak at one gauge on one date); a Wikidata item usually describes a **flood episode** (an event over days and places). Each pair records its relationship:
- `same episode`
- `crest within episode` — the crest is one observation of the episode
- `episode contains several listed crests` — **many-to-one**: several entries map to one item; each entry is classed separately and the shared item is noted
- `unclear` — treated as unresolved

An uncertain episode/crest relationship is never forced into a match: if the timing cannot place the crest inside the episode on documented evidence, the pair stays **unresolved**.

### 6.4 Outcome classes (each entry gets exactly one; reported as counts and lists)
| Class | Meaning |
|---|---|
| **matched — selected** | identity established (§6.3) with an item in the ≤ 30 sample |
| **matched — omitted by the sample cap** | identity established with an eligible item that rule S did not sample |
| **matched — excluded by the rule** | identity established with a frame item excluded by rule T, D or P (reason given) |
| **unresolved** | at least one candidate, but identity not established (including a single weak candidate, several candidates, or an `unclear` relationship) |
| **not found in our discovery results** | no candidate in the candidate frame |

- **"Not found in our discovery results" does not establish absence from Wikidata.** Wikidata may hold the event under another type, without a resolvable place, or outside what discovery returned. The statement is bounded to the rules, the discovery record (rule X), the revisions and the date.
- **Absence from the ≤ 30-event sample says nothing about Wikidata.** That is why "omitted by the sample cap" is its own class.
- **Counts are exact and sum to the size of the fixed reference subset.** Each entry's class is its current classification on the frame as verified.
- If discovery or frame verification was incomplete (rules X and V), **every class is labelled provisional.** Further discoveries could move an entry from "not found" to a candidate, or turn a match into "unresolved" if a competing candidate appears; they could also change the other classes. Nothing is reported as a lower bound.
- Many-to-one relationships are listed beside the counts (which entries share an item); they do not change the per-entry counts.

---

## 7. What the gate reports (each part pass / blocked / inconclusive, separately)

| Part | Pass means | Otherwise |
|---|---|---|
| **Terms** | (a) and (b) have operative wording extracted and labelled, with draft REGISTER wording (nothing filed); (c) recorded as excluded; (d) conditions recorded per work encountered | Unresolved items listed |
| **Discovery** | Method recorded; no sign of truncation (rule X) | **Incomplete**, with what was seen |
| **Selection** | Frame verified on pinned data (rule V); ≥ 10 eligible events (operational floor), selected by rules T, D, P, O, S; every exclusion and discrepancy listed | **Incomplete** if the frame could not be verified (reproducibility limits stated); **inconclusive** if < 10; national option only if Chad chose it |
| **Inventory** | All selected events inventoried by the frozen mapping; unmapped-but-possibly-relevant log produced | **Incomplete**, with the unknown remainder stated |
| **Checking** | The rule ran in the saved order; every inventoried claim has one disposition and its sub-fields | Explained |
| **Lineage** | Every reference grouped, with evidence for any dependency, circularity or independence | Incomplete groups listed |
| **Coverage** (if chosen) | List and row IDs fixed before selection; every entry in the fixed subset classed per §6.4, counts summing to the subset size | No list established → missed events unmeasured; incomplete frame → classes provisional |
| **Gaps** | Stated in the three kinds of §3.3, bounded to rules, revisions, region, language and date | — |
| **Sensitivity** | Flags raised for Chad (deaths and displacement are likely); none decided by Claude | — |

**Rates are measurements, not pass marks.** A low qualifying-support rate is a finding about the sources, not a gate failure. The gate passes or fails on whether the method could be applied honestly within its bounds.

---

## 8. GPT's answers (recorded) and open points
**GPT's answers to rev 2's points (9 Nov), applied in the text:**
1. Type 4 hops, place 6 hops and 40 reference entries are reasonable **provisional effort boundaries**, with no completeness claims (§3.3, §6.2).
2. Start-time precedence is acceptable **for eligibility**; it does not settle historical disagreement (§3.3 rule D).
3. A reviewer-chosen Wikipedia revision is acceptable as **explicitly dated T2-s repetition evidence**, not as reconstruction of the unspecified import revision (§4.3).
4. **Step A first;** Step B uses only the remaining checking budget under the predeclared rule, otherwise "not checked — cap reached" (§4.2).

**GPT's answers to rev 3's points (9 Nov), applied in the text:**
1. **Support-first precedence** is accepted for measuring whether a source states a claim, provided contradictions and partial checking stay visible. It does not establish historical truth or agreement. Coarser-only support stays distinct from an actual contradiction (§4.3a).
2. **Label verification alone is insufficient:** meaning/description, datatype and presence on the frozen items are checked within the gate, before inventory (§4.1).

**Open for GPT's review of rev 4:**
1. The 30-day provisional matching window (§6.3) is Claude's choice, not measured. It only widens candidate generation; identity still needs documented evidence. Is 30 days a reasonable provisional boundary?

---

## 9. Decisions for Chad (none taken)

| | Decision | Recommendation |
|---|---|---|
| D1 | Route: W first (L later on the same ground), L first, both, or neither | Not Claude's to select. GPT and Claude have suggested W first as an option (§5B). |
| D2 | Period | 1870–1927 |
| D3 | Region | Pennsylvania, fixed |
| D3a | National fallback (§3.2) | Not recommended (GPT's view, adopted) |
| D3b | Whether checking runs on a sparse (< 10) selection | Yes, labelled inconclusive for selection |
| D4 | Language | English; cited works in any language checkable |
| D5 | Event cap / operational floor | ≤ 30 / 10 |
| D6 | Checking rule; Wikipedia footnote leads | §4.2 as written; leads recorded, not checked |
| D7 | Independent reference list | Yes, under §6 |
| D8 | Effort cap | 6 h incl. write-up (5 h without D7), sub-caps in §5, one GPT review; no completion guarantee |

**Bounded wording, if and when Chad chooses (not now):**

`Go: timeline Route W first gate per TIMELINE-CONCEPT rev 3.1 §5A.4 and TIMELINE-ROUTE-W-GATE-PROPOSAL rev <n> — research only, cap 6 h + one GPT review; water/floods, Pennsylvania fixed (no national fallback), 1870–1927, English; ≤ 30 events (operational floor 10); rules §3.3 (incl. V), mapping §4.1 (`map-v2`), checking §4.2–§4.3a, matching §6.3, seed 20261109; reference list yes; no downloads beyond the bounded set, no media, no accounts, no provider contact, no REGISTER filing, no prototype.`

This proposal itself authorises nothing beyond its own writing.
