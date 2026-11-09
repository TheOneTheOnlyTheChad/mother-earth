# Evidence-linked historical timeline — concept proposal (rev 1, 9 Nov 2026)

**Status: concept only.** Written from Chad's brief (9 Nov 2026) and existing project records. No provider research, downloads, sampling, accounts, emails, parsing, prototype, building, resources or deployment. **Separate from Arts and from the active research backlog** (`docs/RESEARCH-BACKLOG.md`). It does not select History, start Phase 0 work for it, or authorise Phase A. All existing approvals, accepted reviews and parked/stopped decisions are unchanged.

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
| **T1 — Physical evidence and dated events** | Measurements and material evidence with their own dating: instrument records, excavations, sediment or geological layers, dated artefacts | "River gauge recorded a crest of … on …" | Observed / dated (with method and uncertainty) |
| **T2 — What a source records or claims** | A passage in a book, newspaper, chronicle, letter or oral-history record; quoted or summarised with its page reference | "This 1712 book recounts a flood in …" | Recorded by <source> |
| **T3 — Our computed matches and proposed connections** | Theme matches, date/place alignments and proposed links made by our method | "Our method matches these two passages to one event (basis: …)" | Computed by Mother Earth |

**Rules that follow from the brief:**
- **A recorded story is evidence that the story exists**, not automatically proof of the event it describes. A T2 item never becomes T1 by repetition.
- **Copies are not corroboration.** Several books (or reprinted newspaper columns) carrying one account count as **one** account. Each T2 item carries a **lineage** field (original / copy of / derived from / unknown), and only accounts with no established common source are described as independent; where lineage is unknown, the item says so and is not counted as independent.
- **Publication date ≠ event date.** Both are stored separately, each with its own uncertainty.
- **Disagreement is shown, not resolved.** Conflicting dates or accounts sit side by side with their sources.

### 3.2 Required fields for every published item and connection
- source identifier (stable ID; Wikidata where one exists) and **page / location reference** (page, column, line, or scan coordinates);
- **publication date** (with uncertainty) and **event date or date range** (with uncertainty and its basis: "source states", "inferred by …", "unknown");
- **place** with **geographic uncertainty** (the area the evidence supports, plus how it was resolved, e.g. "historical name mapped to a present-day region — not historical sovereignty");
- **evidence basis and grade** for any connection (which tiers support it, how many independent accounts, what would change it);
- **rights status** of the text and the scan, per item;
- **method version** for anything in T3.

### 3.3 Gaps (visible but bounded)
Every view states, at least: material that did not survive; material that survived but is not digitised; languages not covered; OCR quality where it was measured; conflicting dates. Each gap statement is bounded to the named corpus and date range, in the same way "not found" is bounded elsewhere in this project. **"Nothing found in our corpus" never becomes "nothing happened."**

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
### 5.1 Recommended scope
**Water and flood accounts, in one bounded period and region, with a small set of candidate passages.** Selection criteria for the period and region:
1. **digitised, plausibly public-domain printed material** in one language, from one of the leads above;
2. **at least one T1 anchor** for the period (an instrument or other dated physical record of water levels or floods), so the gate can test the T1/T2 separation on real material rather than in the abstract;
3. **reprinting is common in the material**, so the copy-chain rule is tested, not assumed;
4. small enough to hand-check every candidate passage against its page image.

A period of printed newspapers in one country meets criteria 3 and 4 by its nature, since reprinted columns were common. Which period, region and lead best meet all four is **for the gate to establish**, not decided here.

### 5.2 What the gate would test (pass / blocked / inconclusive, reported separately)
- **Rights:** operative terms for text, scans and metadata, filed from direct extraction; commercial standing in REGISTER.
- **Finding passages:** a bounded set (e.g. ≤ 50 candidates), every one checked by hand against its page image; the matching method's misses and false matches reported against that hand-checked set, without inventing thresholds.
- **Fields:** every passage carries a page reference, publication date, event date or range with its basis, place with uncertainty, and rights status (§3.2).
- **Lineage:** copies grouped; the count of independent accounts stated with its basis, and "unknown" where lineage cannot be established.
- **T1 comparison:** whether the anchor exists and can be aligned in time and place, or an explicit "no T1 anchor found in the named records".
- **Gaps:** a bounded statement of what the corpus does not cover for that period and region.
- **Sensitivity:** whether any passage needs a sensitivity decision (accounts of deaths and displacement are likely in flood material); flagged for Chad, not decided by Claude.

### 5.3 Limits
Same shape as Phase 0: an effort cap set by Chad, one GPT review, research only. A cleared gate would not select History, authorise a prototype or start Phase A. Each of those stays a separate decision.

## 6. Decisions for Chad (none taken)
1. Whether to run the first feasibility gate at all, and when, relative to Arts and the research backlog.
2. If yes: the effort cap and which lead(s) the gate may read.
3. Later and separately: whether deep time gets its own concept and gate.

**Bounded wording, if and when Chad chooses (not now):** `Go: timeline first feasibility gate per TIMELINE-CONCEPT rev <n> §5 — research only, cap <h> h + one GPT review; no downloads beyond the bounded candidate set, no accounts, no provider contact, no prototype.`
