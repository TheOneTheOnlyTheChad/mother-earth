# Evidence-linked historical timeline — concept proposal (rev 3.1, 9 Nov 2026)

**Status: concept only.** Written from Chad's brief (9 Nov 2026) and existing project records. No provider research, downloads, sampling, accounts, emails, parsing, prototype, building, resources or deployment. **Separate from Arts and from the active research backlog** (`docs/RESEARCH-BACKLOG.md`). It does not select History, start Phase 0 work for it, or authorise Phase A. All existing approvals, accepted reviews and parked/stopped decisions are unchanged.

**Follow-on (9 Nov, docs only):** recommended parameters for the Route W gate in §5A.4 are proposed in `docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md` (rev 4, accepted by GPT 9 Nov within its recorded scope). The concept text below is unchanged; no route is selected.

**Rev 3.1 (GPT's review of rev 3; docs only):** effort wording made unmeasured-honest (§5B); written accounts classified individually by their relationship to the event — contemporary, later recollection, later history or summary — never by format (§3.1, §5B); claim dispositions and a reconciled publication rule (§5A.1, §5A.4, §5B). GPT supports Route W as the first option to consider, with library work later deepening or challenging it — a recommendation, not a route selection or research approval.

**Rev 3 (Chad, 9 Nov; docs only):** a second possible starting route — **Route W, Wikipedia/Wikidata first** — added alongside the library-first route (now **Route L**): source roles and rules (§5A), separate reuse questions (§4.1), a bounded first gate (§5A.4, not run), a comparison of the two routes and how later book mining could deepen or challenge a Route W timeline (§5B). T2 split into contemporary accounts and encyclopedic/structured assertions (§3.1). **No source is adopted or cleared by adding the option.**

**Rev 2.1 (GPT accepted rev 2 as a separate concept, 9 Nov):** §2 aligned with §3.3 — conflicting dates are disagreements, not gaps. Acceptance authorises no research, downloads, sampling, parsing, provider contact, REGISTER filing, prototype or building.

**Rev 2 (GPT's review of rev 1; docs only):** evaluation limited to what it can measure, with an optional independent reference set (§5.3); three lineage states, unknown never counted (§3.1); gaps split into measured, externally documented and unassessed (§3.3); the gate produces a research-only terms record and draft REGISTER wording, filing separate (§5.2); bounded source selection first, blocked/inconclusive allowed (§5.1); dating method and uncertainty kept for material evidence (§3.1, §3.2). GPT supports the separate evidence categories, the two dates, source-linked connections and a later deep-time scope.

## 1. The idea (Chad's brief)
A timeline that could eventually run from deep time (dinosaurs and earlier) through human history to the present, across themes such as floods, migration, conflicts, discoveries and technologies. It would draw on digitised books and structured evidence, surface candidate themes and connections, and let a visitor open the evidence behind every item.

It fits the constitution (1 Nov) as written: **live data, real things** (provenance, time, place, honest coverage), **we force no view** (the site shows, it does not tell), **a bridge carries its evidence grade** (every link states what supports it and how sure), and **shared keys** (Wikidata IDs for places, people, events and works where they exist). It is a natural home for Chad's 7 Nov stance on contested material: opposing accounts are presented and clearly labelled as such, and people decide what they take.

## 2. Visitor experience (sketch, not a design)
- **A time axis paired with the globe.** Deep time to now on one axis, stretched where records are dense (the last few thousand years) and compressed where they are sparse. The scale is stated on screen, never hidden. Choosing a span shows what is placed there on the globe, each place drawn at its stated uncertainty (a region or a broad area, not a pin, when that is all the evidence supports).
- **Every item opens its evidence.** One panel, three clearly separated tiers (§3): what physical evidence or dated measurement exists; what each source records or claims, with page references; and what *we* computed (theme matches, proposed connections), labelled as ours.
- **Connections are opt-in and graded.** A line between two items appears only with its stated basis and grade ("same event, two independent accounts", "theme match by our method, not a causal claim"). Nothing implies a cause without saying so.
- **Gaps are drawn, not hidden.** Coverage bands along the axis and on the globe show the three kinds of gap in §3.3 (measured coverage of our corpus, externally documented missing material, unassessed coverage) — the timeline equivalent of the globe's "unknown coverage".
- **Disagreements are shown side by side.** Conflicting dates or accounts are disagreements, not gaps: each is shown with its source (§3.1).
- **Two dates, always.** "Event: about 1607–1610 (source states)" and "Recorded: printed 1712" never collapse into one date.
- **Themes as lenses, not verdicts.** "Water and floods" shows what our method matched, with its rules one click away; it never ranks or concludes.

## 3. Evidence model
### 3.1 Three tiers, never merged
| Tier | What it is | Example wording | Labelled as |
|---|---|---|---|
| **T1 — Physical evidence and dated events** | Measurements and material evidence with their own dating: instrument records, excavations, sediment or geological layers, dated artefacts. **Every date derived from material evidence keeps its dating method and its stated uncertainty** (e.g. the method and its ± range as the source reports them); a T1 date is never shown without them. | "River gauge recorded a crest of … on …"; "layer dated to … ± … by <method>" | Observed / dated (with method and uncertainty) |
| **T2 — What a source records or claims** | A passage in a book, newspaper, chronicle, letter, recorded interview or reference work; quoted or summarised with its page reference | "This 1712 book recounts a flood in …" | Recorded by <source> |
| **T3 — Our computed matches and proposed connections** | Theme matches, date/place alignments and proposed links made by our method | "Our method matches these two passages to one event (basis: …)" | Computed by Mother Earth |

**Rules that follow from the brief:**
- **Each T2 item is classified individually by its relationship to the event, always labelled:**
  - **T2-c — contemporary or near-contemporary account:** written or recorded at or close to the time by someone placed to know (a report of the day, a letter, a diary entry, a chronicle entry made at the time);
  - **T2-r — later recollection:** a participant's or witness's own account recorded later (a memoir, a later interview), with the gap between event and recording stated;
  - **T2-h — later history:** an account by someone not present, written later from other sources;
  - **T2-s — summary or structured assertion:** an encyclopedia article, a Wikidata statement, a digest or compilation.
  **Format alone never decides the category:** a book can print a contemporary diary, a newspaper can print a recollection decades later, an encyclopedia can quote a contemporary letter. Where the relationship cannot be established, the item says "relationship to the event unknown" rather than guessing. T2-r, T2-h and T2-s items point to their sources where they give them; none is treated as physical evidence.
- **A recorded story is evidence that the story exists**, not automatically proof of the event it describes. A T2 item never becomes T1 by repetition.
- **Copies are not corroboration.** Several books (or reprinted newspaper columns) carrying one account count as **one** account. Each pair or group of T2 accounts carries one of **three lineage states**:
  - **independent, with supporting evidence** — the evidence for independence is stated (e.g. different observers, places and details, with no shared text); the absence of a *known* common source is **not** proof of independence;
  - **known dependent** — copy of, derived from, or sharing a common source;
  - **relationship unknown**.
  **Only the first state increases a corroboration count.** Unknown lineage never does, and is shown as unknown.
- **Publication date ≠ event date.** Both are stored separately, each with its own uncertainty.
- **Disagreement is shown, not resolved.** Conflicting dates or accounts sit side by side with their sources.

### 3.2 Required fields for every published item and connection
- source identifier (stable ID; Wikidata where one exists) and **page / location reference** (page, column, line, or scan coordinates);
- **publication date** (with uncertainty) and **event date or date range** (with uncertainty and its basis: "source states", "inferred by …", "unknown");
- **place** with **geographic uncertainty** (the area the evidence supports, plus how it was resolved, e.g. "historical name mapped to a present-day region — not historical sovereignty");
- for T1 items, the **dating method and its uncertainty**;
- **evidence basis and grade** for any connection (which tiers support it, how many accounts are independent *with supporting evidence*, which are known dependent or of unknown relationship, and what would change it);
- **rights status** of the text and the scan, per item;
- **method version** for anything in T3.

### 3.3 Gaps (visible but bounded)
Three kinds of gap statement, never mixed:
| Kind | What it is | Example |
|---|---|---|
| **Measured coverage of our corpus** | what *our* corpus contains, measured: titles, dates, places, languages held; OCR quality where measured | "Our corpus holds 3 titles for this region in 1880–1885; OCR checked on 40 pages" |
| **Externally documented missing material** | losses or undigitised holdings that a named source documents | "<source> records that <archive> was destroyed in …" |
| **Unassessed coverage** | everything else — the default | "Coverage outside our corpus has not been assessed" |

We cannot map everything that failed to survive or remains undigitised, and the timeline does not claim to. Conflicting dates are shown as such, not as gaps. Every statement is bounded to the named corpus, date range and sources, in the same way "not found" is bounded elsewhere in this project. **Empty search results establish nothing beyond our corpus: "nothing found in our corpus" never becomes "nothing happened."**

### 3.4 Deep time
Books cannot establish deep time. That span needs different evidence types (geological, palaeontological and radiometric dating records, among others), each with its own sources, terms and uncertainty conventions. It is named here as a later, separate scope with its own first gate; nothing about it is assessed in this concept.

## 4. Access and reuse — leads, not cleared sources
GPT identified three **access leads** (9 Nov). None has been researched by this project; none is cleared.

| Lead | Unresolved questions (each needs direct extraction of operative terms, labelled with who read it) |
|---|---|
| Harvard's public-domain book corpus | Licence of the text and of any derived OCR; bulk access route and conditions; commercial use; how public-domain status is determined, and for which jurisdiction; attribution; rate or volume limits |
| Library of Congress OCR packages | Rights per item (not assumed from the institution); OCR licence vs scan rights; bulk download conditions; attribution; commercial use |
| Europeana full text | Rights statement per item (varies by contributing institution); full-text availability vs metadata only; API or bulk conditions; commercial use; attribution |

**Questions common to all:** public domain in one jurisdiction is not public domain everywhere; OCR text, page images and metadata can carry different terms; a release for public access is not commercial permission; any "no limit found" is bounded to the pages read. Every source's commercial standing goes in REGISTER before anything is shown (constitution).

### 4.1 Route W — reuse questions, recorded separately (not researched; nothing cleared)
| Material | Unresolved questions (each from direct extraction of the provider's own terms, labelled with who read it) |
|---|---|
| **Wikidata structured data** (items, statements, qualifiers, references) | licence of the structured data; attribution expected; bulk access routes (query service, dumps, API) and their usage limits; commercial use |
| **Wikipedia article text** | licence of the text and its share-alike or attribution conditions, if any; how quotation or summary on our pages would be credited; revision-specific attribution |
| **Media** (images, maps, audio on Wikimedia Commons or in articles) | licensed per file, not by the project; excluded unless separately reviewed (as for Arts) |
| **Referenced external works** (the books, papers and pages the articles and statements cite) | each carries its own rights; a citation in Wikipedia or Wikidata grants nothing for the cited work |

## 5. Route L (library-first) — proposed first feasibility gate (recommendation only — not started)
### 5.1 Two stages, in order, inside one effort cap
**Stage 1 — bounded source selection.** Identify one **specific corpus, period, region and language** that meets the criteria below, from the leads in §4, within the cap. Criteria:
1. digitised printed material whose rights can be assessed from the provider's own terms;
2. **accessible page images** linked to the text, so every passage can be checked by eye;
3. a **manageable volume** for the period and region (stated, not assumed);
4. at least one **T1 anchor** for the period (an instrument or other dated physical record of water levels or floods), or an explicit finding that none was established;
5. reprinting likely enough to test the lineage rule, **stated as found, not assumed**.

Newspapers are one candidate type: reprinted columns were common. That does **not** by itself establish manageable volume, accessible page images or useful reprint chains; stage 1 has to find them. **If no suitable corpus is established within the cap, the gate ends as blocked or inconclusive**, with what was found and why, and stage 2 does not run.

**Stage 2 — bounded passage assessment.** Only on the corpus selected in stage 1: a small set of candidate water/flood passages (e.g. ≤ 50), each checked by hand against its page image.

### 5.2 What the gate reports (pass / blocked / inconclusive, each part separately)
- **Terms:** a **research-only terms record** for the selected corpus (text, page images and metadata; commercial standing; attribution; access conditions), from direct extraction labelled with who read it, plus **draft REGISTER wording**. **The gate files nothing in REGISTER; filing needs Chad's separate authorisation.**
- **Fields:** every passage carries a page reference, publication date, event date or range with its basis, place with uncertainty, and rights status (§3.2).
- **Lineage:** each group in one of the three states (§3.1), with the evidence for any "independent" state; corroboration counted only from that state.
- **T1 comparison:** the anchor with its dating method and uncertainty, aligned in time and place where possible, or "no T1 anchor established in the named records".
- **Gaps:** in the three kinds of §3.3, bounded to the named corpus and dates.
- **Sensitivity:** passages that may need a decision (accounts of deaths and displacement are likely) flagged for Chad, not decided by Claude.

### 5.3 Evaluation — what it can and cannot measure
- **Measured:** checking the retrieved candidates against their page images measures **false matches** and **extraction errors** (dates, places, page references).
- **Not measured by that:** **missed passages.** Candidates retrieved by the method cannot show what the method failed to retrieve.
- **Option (for Chad):** an independently selected **reference set** of pages (e.g. a small seeded random set from the selected corpus and period, drawn before the method is run), read completely by hand, against which missed passages can be counted. It adds effort inside the cap.
- **Default if the option is not chosen:** missed-passage performance is stated as **unmeasured**.
- Neither check is run until the gate is authorised.

### 5.4 Limits
Same shape as Phase 0: an effort cap set by Chad, one GPT review, research only. A cleared gate would not select History, authorise a prototype, file REGISTER entries or start Phase A. Each stays a separate decision.

## 5A. Route W (Wikipedia/Wikidata first) — an alternative starting route (option only; not adopted, not started)
### 5A.1 Roles
- **Wikidata:** a candidate source for **identifiers** (the shared-key direction), **events, dates, places and relationships** as structured assertions (T2-s), each with its stated precision, qualifiers and references.
- **Wikipedia:** **explanatory context, alternative names and references** (T2-s). Its text is not published as the evidence for a claim.
- **Supporting sources and the publication rule:** a claim is shown **as an established event** only when it is traced to supporting sources (T1, T2-c, or a named T2-r/T2-h work), each shown with its category. An assertion that has **not** been traced may be displayed only **explicitly as an unverified source assertion** — "Wikidata (revision …) states …; not traced to a supporting source" — never as an established event, and never counted as corroboration.

### 5A.2 Rules
- **Pinned revisions:** every Wikidata item and Wikipedia article used is recorded with its **exact revision ID**, the **retrieval date** and the **date we last checked** it. What we show is tied to that revision, not to "the current page".
- **Edits are not evidence:** frequent editing does not establish correctness, and not every article is updated daily. A later revision can change, add or remove a claim; re-checking is a dated event, recorded like any other.
- **Uncertainty kept:** Wikidata's date precision (day, month, year, decade…), qualifiers such as "circa", "earliest/latest date" and disputed-by statements are carried through, never rounded into a sharper date.
- **Reference lineage:** each claim keeps the references it came with. **Wikipedia and Wikidata citing the same source count as one account, not two** (known dependent, §3.1). A reference that itself relies on Wikipedia is circular and counts as known dependent. Unknown lineage never raises a corroboration count.
- **Tiers stay apart:** encyclopedia summaries and structured assertions (T2-s) are shown as such, separately from contemporary accounts (T2-c) and physical evidence (T1).
- **Gaps:** Wikidata or Wikipedia holding no item is **unassessed coverage**, not absence (§3.3).

### 5A.3 What it would offer and risk
- Offers: a quick, structured skeleton of events with stable IDs, dates and places; multilingual names; ready links to references; the shared keys later pages need.
- Risks: coverage follows editors' interests and languages, not the historical record; dates and places may be stated more sharply than their sources support; references may be missing, secondary or circular; revisions change.

### 5A.4 Proposed bounded first gate for Route W (recommendation only — not run)
Same theme, period and region as Route L would use (water/flood events, one bounded period and region), so the two routes could later be compared on the same ground.
1. **Bounded selection:** within the cap, a small set of candidate flood events (e.g. ≤ 30) identified from Wikidata by a **stated, recorded selection rule** (item type, date range, place), with the rule, the item IDs, revision IDs and retrieval dates recorded. If no workable set is established within the cap, the gate ends **blocked or inconclusive**.
2. **Per event:** dates with their precision and qualifiers, place with its uncertainty, the references attached to each claim, the Wikipedia article revision used for context (if any).
3. **Claim inventory and dispositions:** **every selected event and every claim** (date, place, scale, relationship) is listed. Which claims are checked is decided by a **rule recorded before checking** (e.g. all claims of every event, or a seeded random subset of claims), and the rule is reported. Every claim ends with exactly one disposition:
   - **checked — supported** (the cited page or passage supports it; category of the supporting source stated, §3.1);
   - **checked — unsupported** (the cited work was reached and does not support it, or contradicts it);
   - **inaccessible** (selected for checking, but the cited work could not be reached; named, with why);
   - **no reference given** (the claim cites nothing);
   - **not checked** (outside the checking rule).
   References are grouped by lineage (§3.1).
4. **Reports (pass / blocked / inconclusive, each part separately):** a **research-only terms record** for the four materials in §4.1 with **draft REGISTER wording — nothing filed**; the full claim inventory with dispositions and the checking rule; **support rates computed over checked claims only** (supported ÷ (supported + unsupported)), with the inaccessible, no-reference and not-checked counts shown beside them and never folded in; lineage groups and how many accounts are independent *with supporting evidence*; date/place uncertainty as stated; gaps as unassessed coverage; sensitivity flags for Chad.
5. **Evaluation limits:** the gate measures claim support **among the events selected**; it does **not** measure which events Wikidata lacks (missed events stay unmeasured unless an independent reference list is chosen as an option, as in §5.3).
6. **Limits:** effort cap set by Chad, one GPT review, research only. No downloads beyond the bounded set, no accounts, no provider contact, no REGISTER filing, no prototype. A cleared gate selects nothing.

## 5B. Comparing the two starting routes
| | Route L — library first | Route W — Wikipedia/Wikidata first |
|---|---|---|
| Starts from | digitised printed material, page by page, each passage classified by its relationship to the event (§3.1) | structured assertions and summaries (T2-s), item by item |
| First output | a few hand-checked passages with page references, lineage and dates | a small event skeleton with IDs, dates, places and references |
| Tests best | the evidence model on primary material: copy chains, two dates, OCR, gaps | identifiers and shared keys; how far published claims can be traced to supporting sources |
| Main risks | volume, page-image access, OCR quality, rights per item | editor-driven coverage, over-precise dates, circular or missing references, revision churn |
| Coverage statement | measured for our corpus only | unassessed beyond the selected items |
| Effort to first result | **not measured**; source selection and hand-checking page images are expected to be the main work | **not measured**; expected to need less initial extraction work to reach a skeleton, but reference tracing could dominate the effort |

**How later book mining could deepen or challenge a Route W timeline:**
- **Deepen:** passages found in books attach to an existing event's ID, each **classified individually** (§3.1) as a contemporary account, later recollection, later history or summary according to its relationship to the event, with page references and its own publication and event dates. Being in a book does not make a passage contemporary.
- **Corroborate, carefully:** a book account raises the count only if its independence from the encyclopedia's references is supported by evidence (§3.1); many encyclopedia citations come from the same few books.
- **Challenge:** contemporary accounts can disagree with an encyclopedia's date, place or scale. The disagreement is shown side by side with sources, not resolved by preferring either.
- **Fill or expose gaps:** events found in books but absent from Wikidata are added with their own evidence and category. A Wikidata event not traced to a supporting source stays displayed only as an **unverified source assertion** (§5A.1), not as an established event.

**Claude's suggestion (for Chad's decision, not a selection):** Route W's gate is expected to need less initial extraction work and builds the shared-key spine, though reference tracing could dominate its effort; Route L's gate is the real test of the evidence model. Neither route's actual time or cost has been measured. GPT also supports Route W as the first option to consider, with library work later deepening or challenging it. Running W first and then L on the same theme, period and region would show how much book mining adds or overturns. Either order, or one route only, is a valid choice.

## 6. Decisions for Chad (none taken)
1. Whether to run a first feasibility gate at all, which route (L, W, or both in an order), and when, relative to Arts and the research backlog.
2. If yes: the effort cap, which lead(s) the gate may read, and whether the reference set (§5.3) is included.
3. Later and separately: whether deep time gets its own concept and gate.

**Bounded wording, if and when Chad chooses (not now):**
- Route L: `Go: timeline first feasibility gate per TIMELINE-CONCEPT rev <n> §5 — research only, cap <h> h + one GPT review; reference set <yes|no>; no downloads beyond the bounded selection and candidate set, no accounts, no provider contact, no REGISTER filing, no prototype.`
- Route W: `Go: timeline Route W first gate per TIMELINE-CONCEPT rev <n> §5A.4 — research only, cap <h> h + one GPT review; ≤ <n> events; reference list <yes|no>; no downloads beyond the bounded set, no accounts, no provider contact, no REGISTER filing, no prototype.`
