# Timeline Route W — bounded first gate: parameters proposal (rev 1, 9 Nov 2026)

**Status: proposal only (docs).** Chad's brief, 9 Nov: bring forward TIMELINE-CONCEPT rev 3.1, especially Route W (Wikipedia/Wikidata first, library work later deepening or challenging it). This document recommends the parameters of the gate in §5A.4 of the concept: period, region, language, event cap, effort cap, the claim-checking rule, and whether to include an independent reference list.

**Written from the accepted concept and saved project records only.** No provider research, queries, sampling, downloads, accounts, contact, REGISTER filing, prototype or production change. **Route selection and running the gate stay Chad's separate decisions.** The completed Arts reviews stay closed. The actual-iPhone check stays deferred.

**Labelling in this document:**
- **[record]** — from a saved project record (named).
- **[general knowledge, unverified]** — Claude's background knowledge, not researched for this project. Such statements are expectations for the gate to confirm or refute. Nothing rests on them being true.
- **[recommendation]** — Claude's proposal for Chad's decision, open to GPT's review.

---

## 1. What carries over unchanged from rev 3.1

These rules are restated here so the gate can be run from this document. Nothing in this proposal relaxes them.

| Rule | Concept section |
|---|---|
| Wikidata and Wikipedia are **T2-s** (summary or structured assertion). They are never T1 and never T2-c. | §3.1, §5A.1 |
| A claim is shown as an **established event** only when it is traced to a supporting source (T1, T2-c, or a named T2-r/T2-h work), each shown with its category. An untraced assertion may be shown only as an **unverified source assertion** — "Wikidata (revision …) states …; not traced to a supporting source" — and never counts as corroboration. | §5A.1 |
| **Pinned revisions:** every item and article used is recorded with its exact revision ID, the retrieval date and the date last checked. A re-check is a dated event. | §5A.2 |
| **Uncertainty kept:** date precision, "circa", earliest/latest dates and disputed-by statements carry through; nothing is rounded into a sharper date or place. | §5A.2, §3.2 |
| **Two dates, always:** publication date ≠ event date, each with its own uncertainty and basis. | §3.1, §3.2 |
| **Reference lineage:** three states (independent with supporting evidence / known dependent / relationship unknown). Wikipedia and Wikidata citing the same source = one account. A reference that relies on Wikipedia is circular = known dependent. Only the first state raises a corroboration count. | §3.1, §5A.2 |
| **Five claim dispositions,** exactly one per claim: checked — supported · checked — unsupported · inaccessible · no reference given · not checked. | §5A.4 (3) |
| **Support rate over checked claims only:** supported ÷ (supported + unsupported). Inaccessible, no-reference and not-checked counts are shown beside it, never folded in. | §5A.4 (4) |
| **Gaps:** no item in Wikidata = unassessed coverage, not absence. | §3.3, §5A.2 |
| **Terms:** a research-only terms record for the four materials in §4.1 plus draft REGISTER wording. **Nothing filed.** | §4.1, §5A.4 (4) |
| A cleared gate **selects nothing**: not History, not a route, not a prototype, not Phase A. | §5A.4 (6), §5.4 |

---

## 2. Recommended parameters (summary)

| Parameter | Recommendation | Main reason |
|---|---|---|
| **Theme** | Water and floods (river and coastal) | Fixed by §5A.4 so both routes share ground |
| **Period** | **1870–1927** (event start dates inside it) | Printed material for a later Route L pass is plausibly out of copyright in the US; instrument river records plausibly exist (§3.1) |
| **Region** | **One US state, Pennsylvania** (fallback: contiguous United States; see §3.2) | Small enough for an independent list to cover the same ground; one T1 anchor is plausible |
| **Language** | **English** (Wikipedia article and labels); cited works in any language may be checked | Chad and GPT can verify English; Route L's leads are likely English for this region |
| **Event cap** | **≤ 30 events** inventoried; at least **10** needed for a workable set | Matches §5A.4's example; 10 is the floor below which the result says little |
| **Effort cap** | **6 h** of gate work incl. write-up, in fixed sub-caps (§5); one GPT review outside the cap | Reference tracing is the unmeasured risk (§5B); sub-caps stop one step eating the rest |
| **Claim-checking rule** | Every **date and place** claim of every selected event, in a seeded order; then **all other claims** of a seeded random 10 events, cap permitting (§4) | Dates and places are the timeline's spine |
| **Independent reference list** | **Yes, recommended** — one list of flood events for the same state and period, from a source independent of Wikipedia/Wikidata, fixed **before** the Wikidata selection is seen (§6) | It is the only way to say anything about missed events, Route W's main risk |
| **Seed** | `20261109`, recorded now | Fixes the checking order before any data is seen |

Each row is a separate decision for Chad (§9).

---

## 3. Period, region and language

### 3.1 Why share ground with Route L
§5A.4 asks for the same theme, period and region that Route L would use, so the routes can be compared on the same ground and later book mining can deepen or challenge the Route W skeleton (§5B). The choice below is therefore made with Route L's stage-1 criteria (§5.1) in mind as well:
1. digitised printed material whose rights can be assessed;
2. page images linked to the text;
3. manageable volume;
4. at least one T1 anchor (a dated physical record of water levels or floods);
5. reprinting likely enough to test the lineage rule.

**Risk recorded:** if Route L later finds no suitable corpus for this period and region, the comparison weakens. That is a finding, not a reason to change Route W's parameters after the fact.

### 3.2 Recommendation and reasoning
**Period 1870–1927.**
- The end year keeps any later Route L corpus inside material plausibly in the US public domain **[general knowledge, unverified]**. Public domain in one jurisdiction is not public domain everywhere, and OCR, page images and metadata can carry different terms **[record: concept §4]**. The gate assumes none of this.
- The start year is chosen because systematic river-stage records plausibly exist from roughly then for larger US rivers **[general knowledge, unverified]**. Whether a usable T1 anchor exists is for the gate to find, not assume (§5.1 criterion 4).
- A ~58-year window is bounded enough for ≤ 30 events in one state, and long enough that a workable set (≥ 10) is plausible.

**Region: one US state — Pennsylvania (candidate).**
- **A single state, not the whole country:** the independent reference list (§6) can only measure missed events where it and the Wikidata selection cover the same ground. A country-wide selection against a one-river list would leave an overlap too small to say anything.
- **Why Pennsylvania as the candidate:**
  - It has major rivers with a recorded flood history in the period, including the 1889 Johnstown flood, which is very likely to have a Wikidata item **[general knowledge, unverified]**.
  - Pittsburgh sits where two rivers meet to form the Ohio, a plausible place for a long river-stage record **[general knowledge, unverified]**.
  - The US Library of Congress OCR packages are already one of the concept's three Route L leads **[record: concept §4]**. Their coverage of this state and period is not assessed.
  - **These are reasons to expect a workable set, not evidence of one.**
- **Alternative candidate:** Ohio, which shares the Ohio River basin. Chad may name any state. The rule in §3.3 applies unchanged.
- **Fallback, recorded now so it cannot be tuned later:** if the state yields fewer than 10 events under the selection rule (§3.3) within the selection sub-cap, the gate:
  - widens the selection to the **contiguous United States**, same period and rule;
  - draws ≤ 30 events by seeded random order (seed above);
  - still measures missed events only against the original state's subset;
  - reports the widening.
  If the widened set is also below 10, selection ends **blocked or inconclusive** and the later steps do not run.

**Language: English.**
- English Wikipedia for article context and English Wikidata labels. Wikidata's labels in other languages are recorded where present but not used for selection.
- Cited works in other languages may be checked. Any translation is labelled as Claude's, with the original passage reference kept.
- **Disclosed limitation:** English-language coverage follows English editors' interests, which is §5A.3's main risk. The report states it in the gaps section.

### 3.3 Selection rule (to be recorded verbatim at gate start, before any results are seen)
An event is selected if its Wikidata item meets **all** of the following:
- **Type:** instance of *flood*, or of a subclass of flood. The class IDs and the subclass depth used are recorded at gate start.
- **Date:** a start date, point-in-time date or earliest date with a year in 1870–1927. An item whose only date has decade or coarser precision spanning the boundary is listed as "boundary — excluded, precision too coarse" and not silently dropped.
- **Place:** a location or administrative-territory claim that resolves to the chosen state through the item's own place chain. The path used is recorded per item. An item that names only the country is listed as "place too coarse — excluded".

The rule, the class IDs, the date of the run, every candidate found, every exclusion with its reason, and the final item IDs with revision IDs are all recorded. The same rule is applied once; it is not adjusted after results are seen except through the pre-recorded fallback above.

---

## 4. Claim inventory and the checking rule

### 4.1 What counts as a claim
For each selected event, **every statement on its Wikidata item** that bears on the timeline is inventoried as one claim, with its value, precision, qualifiers and references exactly as stated at the pinned revision. The four groups are:

| Group | What it covers |
|---|---|
| **Date** | start, end, point in time, earliest/latest date |
| **Place** | location, located-in, coordinates, country |
| **Scale** | number of deaths, injured or displaced, damage, area or height figures |
| **Relationship** | part of, cause, effect, follows/followed by, significant event, and similar links to other items |

- Statements outside these groups (labels, images, identifiers in other databases) are counted but not inventoried as claims.
- **Wikipedia article text is not inventoried as claims.** It is context (§5A.1). If the article cites a source for a fact the Wikidata claim leaves unreferenced, that citation is recorded as a **lead** beside the claim (article revision ID + footnote). The claim's own disposition stays "no reference given". Leads are not checked in this gate (decision D6).

### 4.2 Checking rule (recorded before checking)
1. **Order:** every claim gets a position from the seeded order (seed `20261109`). Claims are taken in that order inside each step; the order is saved before the first check.
2. **Step A — all date and place claims of all selected events.** These are the timeline's spine: two dates and place uncertainty are what every published item must carry (§3.2).
3. **Step B — all scale and relationship claims of a seeded random 10 events** (or all events if fewer than 10 were selected), cap permitting.
4. **Cap reached:** any claim inside the rule that was not reached when the checking sub-cap ran out gets **not checked** with the reason **"cap reached"**. This is distinct from "not checked — outside the rule". The reason is a sub-field, not a sixth disposition, so the five dispositions stay exactly as accepted.

### 4.3 What "checked" means
| Situation | Disposition | Note |
|---|---|---|
| The cited work was reached and the cited page or passage supports the claim, **including its precision** | checked — supported | Supporting source category recorded (T1 / T2-c / T2-r / T2-h / T2-s, §3.1). A source that supports only a coarser date or wider place supports the coarser value; the record says so. |
| The cited work was reached and does not support the claim, or contradicts it | checked — unsupported | The passage reference is recorded. Disagreements are recorded side by side, not resolved. |
| The cited work could not be reached **without an account, a purchase, contact or a download outside the bounded set** | inaccessible | Named, with why |
| The claim cites nothing | no reference given | |
| The claim's only reference is an import from a Wikimedia project | no reference given | Noted as "Wikimedia import only — circular, known dependent". **Open point for GPT's review:** whether this should be its own sub-field (see §8). |
| A Wikipedia footnote cites a source for an unreferenced claim | no reference given | The footnote is recorded as a lead only (§4.1) |

- **A supported claim stays a Wikidata assertion.** The record shows the assertion (T2-s, revision-pinned) and, separately, the supporting source (its category, page reference, publication date and event date). They are two rows, never merged into one statement.
- Quotations from cited works are short (under 15 words) and only where wording decides support; otherwise the record paraphrases and gives the page reference.

### 4.4 Lineage grouping
- Every reference (Wikidata reference or recorded lead) is assigned to a lineage group by the cited work.
- Groups take one of the three states in §3.1, with the evidence written down for any "independent" state.
- The report states how many accounts per event are independent **with supporting evidence**. Unknown is shown as unknown and never counted.

---

## 5. Effort cap and order of work

**Recommended: 6 h of gate work, write-up included, plus one GPT review outside the cap.** If the independent reference list is not chosen, 5 h.

Order and sub-caps:

| # | Step | Sub-cap | Ends the gate early? |
|---|---|---|---|
| 0 | **Terms record** for the four materials in §4.1 (Wikidata data, Wikipedia text, media, referenced works): direct extraction of operative wording, labelled with who read it, plus draft REGISTER wording. Where Claude's fetch tool is refused by a host, the item is listed for GPT's extraction instead of worked around **[record: HANDOVER "Learned"]**. | 0.75 h | No; an unresolved term is reported as unresolved |
| 1 | **Independent reference list** (if chosen, §6), fixed and saved **before** step 2 | 1 h | No; if no list is established, missed events are "unmeasured" |
| 2 | **Selection** by the §3.3 rule (+ fallback) | 0.75 h | Yes, if < 10 events after the fallback |
| 3 | **Inventory** of all claims of all selected events; seeded order saved | 0.75 h | No |
| 4 | **Checking**, Steps A then B | 2 h | No; unreached claims are "not checked — cap reached" |
| 5 | **Report** (§7) | 0.75 h | — |

- Unused time in a step does not move to another step. The sub-caps exist so reference tracing (§5B's named risk) cannot consume the selection or the write-up.
- Times are recorded from a real clock at the start and end of each step, never estimated **[record: START-HERE §9]**.

**What stays out of the public repo until the terms record is accepted:** copied Wikidata statement values, Wikipedia text, and passages from cited works. Until then the repo holds only IDs, revision IDs, retrieval times, our dispositions and page references. Working copies are kept in the Mac research folder, as for the earlier fireballs research **[record: HANDOVER §1-old item 6]**. Whether anything copied may later go into the repo depends on the accepted terms.

---

## 6. Independent reference list — recommended, as an option

**Why it is useful:**
- Without it, the gate measures only claim support **among the events Wikidata already has**. It says nothing about events Wikidata lacks, so missed events stay unmeasured (§5A.4 (5)).
- Editor-driven coverage is Route W's main named risk (§5A.3). This list is the one measurement that tests it.
- A list drawn from a physical record (for example, recorded flood crests at a named river gauge) would also be a candidate **T1 anchor** for a later Route L pass (§5.1 criterion 4), so the hour is not spent on Route W alone.

**Rules:**
- **Independent of Wikipedia/Wikidata in how it was selected:** compiled by a named source that does not draw its list from either. The source and why it counts as independent are recorded.
- **Fixed before the Wikidata selection is seen,** and saved with a real-clock time, so the comparison cannot be shaped by what Wikidata holds.
- **Same ground:** the same state, period and theme. Only list events that fall inside the selection rule's state count toward the missed-event figure. If the fallback widened the selection, the comparison still covers the state only.
- **Coverage, not corroboration:** the list measures which events Wikidata lacks. Whether the list's source can also corroborate a claim is a separate lineage question (§4.4). Wikidata may cite the very source the list came from, in which case they are one account.
- **Reported as:** list size; matched to a selected Wikidata event; present in Wikidata but excluded by the rule (with the reason); not found in Wikidata. "Not found" is bounded to the rule, the pinned revisions and the date (§3.3).
- **Finding a list is itself provider research.** It would happen only inside an authorised gate, within its sub-cap. If no suitable independent list is established within 1 h, the gate continues and reports missed events as unmeasured.

**Default if Chad declines the option:** missed events are stated as unmeasured, as in §5A.4 (5).

---

## 7. What the gate reports (each part pass / blocked / inconclusive, separately)

| Part | Pass means | Blocked / inconclusive means |
|---|---|---|
| **Terms** | All four §4.1 materials have operative wording extracted and labelled, and draft REGISTER wording exists (nothing filed) | One or more materials unresolved within the sub-cap (listed) |
| **Selection** | ≥ 10 events under the recorded rule (state, or fallback), with every exclusion and reason listed | < 10 after the fallback |
| **Fields** | Every inventoried claim has its value, precision, qualifiers, references and pinned revision recorded; both dates and place uncertainty kept where present | Any claim missing these (listed) |
| **Checking** | The rule ran in the saved order; every claim has exactly one disposition | The rule could not be applied as written (explained) |
| **Lineage** | Every reference grouped in one of the three states, with evidence for any "independent" | Grouping could not be completed (listed) |
| **Coverage** (if the list was chosen) | List fixed before selection; missed-event counts reported | No independent list established; missed events unmeasured |
| **Gaps** | Stated in the three kinds of §3.3, bounded to the rule, revisions, region, language and date | — |
| **Sensitivity** | Flags raised for Chad (deaths and displacement are likely); none decided by Claude | — |

**The support rate is a measurement, not a pass mark.** A low support rate is a finding about the sources, not a failure of the gate. The gate passes or fails on whether the method could be applied honestly within its bounds.

---

## 8. Open points for GPT's review
1. **Wikimedia-import references:** recorded as "no reference given" with a note (§4.3). Alternatively it could be a sub-field like "cap reached". Neither adds a sixth disposition.
2. **Precision mismatch:** a source supporting a coarser value than the claim (e.g. year where Wikidata states a day) is recorded as supporting the coarser value. Should the claim itself then be "checked — supported" with a precision note, or "checked — unsupported" at its stated precision? Claude's current wording leans to the second for the stated value plus a note of what *is* supported. GPT's view is asked for before the gate runs.
3. **Region candidate:** the reasons for Pennsylvania are all **[general knowledge, unverified]**. Whether that is acceptable for choosing a candidate (with a pre-recorded fallback) rather than a researched choice.
4. **Sub-cap sizes:** checking at 2 h of 6 is a guess. Neither route's real effort has been measured (§5B).

---

## 9. Decisions for Chad (none taken)

| | Decision | Claude's recommendation |
|---|---|---|
| D1 | Route: W first (with L later on the same ground), L first, both, or neither | Not Claude's to select. GPT and Claude have both suggested W first as an option (§5B). |
| D2 | Period | 1870–1927 |
| D3 | Region and the fallback | Pennsylvania; fallback to the contiguous US as in §3.2 |
| D4 | Language | English, cited works in any language checkable |
| D5 | Event cap / floor | ≤ 30 / ≥ 10 |
| D6 | Checking rule; Wikipedia footnote leads | §4.2 as written; leads recorded, not checked |
| D7 | Independent reference list | Yes, 1 h sub-cap, fixed before selection |
| D8 | Effort cap | 6 h incl. write-up (5 h without D7), sub-caps in §5, one GPT review |

**Bounded wording, if and when Chad chooses (not now):**

`Go: timeline Route W first gate per TIMELINE-CONCEPT rev 3.1 §5A.4 and TIMELINE-ROUTE-W-GATE-PROPOSAL rev <n> — research only, cap 6 h + one GPT review; water/floods, Pennsylvania (fallback contiguous US), 1870–1927, English; ≤ 30 events (≥ 10 workable); checking rule §4.2, seed 20261109; reference list yes; no downloads beyond the bounded set, no accounts, no provider contact, no REGISTER filing, no prototype.`

This proposal itself authorises nothing beyond its own writing.
