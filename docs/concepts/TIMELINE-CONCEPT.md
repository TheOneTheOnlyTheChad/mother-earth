# Evidence-linked historical timeline — concept proposal (rev 2, 9 Nov 2026)

**Status: concept only.** Written from Chad's brief (9 Nov 2026) and existing project records. No provider research, downloads, sampling, accounts, emails, parsing, prototype, building, resources or deployment. **Separate from Arts and from the active research backlog** (`docs/RESEARCH-BACKLOG.md`). It does not select History, start Phase 0 work for it, or authorise Phase A. All existing approvals, accepted reviews and parked/stopped decisions are unchanged.

**Rev 2 (GPT's review of rev 1; docs only):** evaluation limited to what it can measure, with an optional independent reference set (§5.3); three lineage states, unknown never counted (§3.1); gaps split into measured, externally documented and unassessed (§3.3); the gate produces a research-only terms record and draft REGISTER wording, filing separate (§5.2); bounded source selection first, blocked/inconclusive allowed (§5.1); dating method and uncertainty kept for material evidence (§3.1, §3.2). GPT supports the separate evidence categories, the two dates, source-linked connections and a later deep-time scope.

## 1. The idea (Chad's brief)
A timeline that could eventually run from deep time (dinosaurs and earlier) through human history to the present, across themes such as floods, migration, conflicts, discoveries and technologies. It would draw on digitised books and structured evidence, surface candidate themes and connections, and let a visitor open the evidence behind every item.

It fits the constitution (1 Nov) as written: **live data, real things** (provenance, time, place, honest coverage), **we force no view** (the site shows, it does not tell), **a bridge carries its evidence grade** (every link states what supports it and how sure), and **shared keys** (Wikidata IDs for places, people, events and works where they exist). It is a natural home for Chad's 7 Nov stance on contested material: opposing accounts are presented and clearly labelled as such, and people decide what they take.

## 2. Visitor experience (sketch, not a design)
- **A time axis paired with the globe.** Deep time to now on one axis, stretched where records are dense (the last few thousand years) and compressed where they are sparse. The scale is stated on screen, never hidden. Choosing a span shows what is placed there on the globe, each place drawn at its stated uncertainty (a region or a broad area, not a pin, when that is all the evidence supports).
- **Every item opens its evidence.** One panel, three clearly separated tiers (§3): what physical evidence or dated measurement exists; what each source records or claims, with page references; and what *we* computed (theme matches, proposed connections), labelled as ours.
- **Connections are opt-in and graded.** A line between two items appears only with its stated basis and grade ("same event, two independent accounts", "theme match by our method, not a causal claim"). Nothing implies a cause without saying so.
- **Gaps are drawn, not hidden.** Coverage bands along the axis and on the globe show where our corpus has no digitised material, no material in a language, poor OCR, or conflicting dates — the timeline equivalent of the globe's "unknown coverage".
- **Two dates, always.** "Event: about 1607–1610 (source states)" and "Recorded: printed 1712" never collapse into one date.
- **Themes as lenses, not verdicts.** "Water and floods" shows what our method matched, with its rules one click away; it never ranks or concludes.

## 3. Evidence model
### 3.1 Three tiers, never merged
| Tier | What it is | Example wording | Labelled as |
|---|---|---|---|
| **T1 — Physical evidence and dated events** | Measurements and material evidence with their own dating: instrument records, excavations, sediment or geological layers, dated artefacts. **Every date derived from material evidence keeps its dating method and its stated uncertainty** (e.g. the method and its ± range as the source reports them); a T1 date is never shown without them. | "River gauge recorded a crest of … on …"; "layer dated to … ± … by <method>" | Observed / dated (with method and uncertainty) |
| **T2 — What a source records or claims** | A passage in a book, newspaper, chronicle, letter or oral-history record; quoted or summarised with its page reference | "This 1712 book recounts a flood in …" | Recorded by <source> |
| **T3 — Our computed matches and proposed connections** | Theme matches, date/place alignments and proposed links made by our method | "Our method matches these two passages to one event (basis: …)" | Computed by Mother Earth |

**Rules that follow from the brief:**
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

## 5. Proposed first feasibility gate (recommendation only — not started)
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

## 6. Decisions for Chad (none taken)
1. Whether to run the first feasibility gate at all, and when, relative to Arts and the research backlog.
2. If yes: the effort cap, which lead(s) the gate may read, and whether the reference set (§5.3) is included.
3. Later and separately: whether deep time gets its own concept and gate.

**Bounded wording, if and when Chad chooses (not now):** `Go: timeline first feasibility gate per TIMELINE-CONCEPT rev <n> §5 — research only, cap <h> h + one GPT review; reference set <yes|no>; no downloads beyond the bounded selection and candidate set, no accounts, no provider contact, no REGISTER filing, no prototype.`
