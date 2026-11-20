# Animals expansion: source-audit briefs (one per priority)

20 Nov 2026 13:04 UTC (clock reading) · rev 1 · for GPT, then Chad's go per brief · **docs only; none of these has started.**

Companion to `ANIMALS-EXPANSION-PROPOSAL.md` rev 2. Each brief is a bounded, read-only audit in the pattern of the zebra audit (`docs/research/animals-source-audit/README.md`).

**Rules common to all four**
- Read-only. No account, key, agreement, request form or provider contact. No build.
- Files are read in the browser's memory through Chad's Chrome and counted there. **Nothing is saved to the Mac or the repository.** Each file's byte length and sha256 as received are recorded, with the address and the time from a real clock.
- One request at a time; a request log is kept beside the audit.
- **PDFs:** Claude opens none (text-only rule). Where a fact is only in a PDF, either GPT extracts it and it is recorded as GPT's extraction, or Chad lifts the rule for that one document. Each brief says where this arises.
- Output: one audit file under `docs/research/animals-source-audit/` on the `animals-expansion-proposal` branch, plus an evidence JSON; then GPT's review. An audit clears nothing for display by itself.
- Stop and report if a file differs from what the brief expects (size, columns, licence wording).

---

## Brief A: African penguin counts

**Inspect**
1. Dryad doi `10.5061/dryad.vx0k6djp7`: `Afr_penguin.csv` (3.89 KB) and the record's methods, usage notes and licence line.
2. GitHub `rbsherley/AP_IUCN_CR` at head `682766636a8a0ebcdd5a1b3959f291444cb83db4`: `Afr_penguin_2023_JARAinput.csv` (last commit seen by GPT `1f7cd820343b91903c94455ca985c2bf76eb2b22`), `README.md`, and the commit history of the CSV. If the head has moved, record both and audit the pinned commit.

**Establish, for each file separately**
- Columns and colony names as written; rows and years; every value's type.
- Per colony: first and last year with a count, the years marked NA, and every 0.1 (or other non-count) value with its position.
- For version B: where the anchors are and whether the README or the R script (`JARA R AP 2023.R`, read as text) states their rule. No rule is assumed from version A.
- Which colonies are in B and not in A, and whether values for shared colony-years agree. Differences are listed, not explained.
- The licence or reuse wording found, quoted exactly, with where it was found. For B: also whether a licence file exists at the pinned commit.

**Interpretation questions to answer on paper**
- Which colonies have a complete enough run for an individual series, by a stated rule (for example no more than a stated number of gaps).
- Whether any fixed set of colonies has counts in every year of a stated period, so that a fixed-coverage aggregate is possible. If none, say so.
- Exactly what a chart built only from version A may say, with the unit label "Annual colony census: occupied nest sites (used as a breeding-pair proxy)".

**Rights questions left for the enquiry:** reuse of version B in a public chart with the values delivered to browsers; corrected versions; the anchor rule for B.

**PDF point:** the two papers' methods. Version A's methods are on the Dryad record as text; version B's are in the 2024 paper (PDF) and partly in the R script.

**Out of scope:** the model outputs in the repository (`AP Output`, the PDFs of plots), any national or global total, any chart.

---

## Brief B: whale recovery (IWC stock C and Cape Vidal)

**Inspect**
1. IWC status graphics page and the Southern Hemisphere humpback status summary (both read on 20 Nov; re-read and record the text exactly), and any page they link that states how the abundance figure and its interval are defined.
2. The IWC population estimates page, humpback section, for the Mozambique and Madagascar rows.
3. Wilkinson and co-authors 2023 (doi `10.2989/1814232X.2023.2193591`): Table 3 and the methods for the survey windows.

**Establish**
- For the 18,111 figure: the year it refers to, whether it is a model output, and what the interval is. If the IWC pages do not say, record "not stated on the pages read" and name the report that would.
- The exact wording of the status sentence, the growth class and its period, the assessment date sentence, and the page's update label, each with its address.
- From Table 3: every column (survey window), the years with an entry in each, the estimates, and any uncertainty given. Name the one column proposed for display and why. Record what "adjusted" means in the paper's terms.
- The reuse position for citing a handful of values from each source (the IWC site's terms page; the article's licence line), quoted.

**Interpretation questions**
- The two panels' titles, units and scopes, word for word, so that neither can be read as the other.
- Whether the authors' trend sentence can be quoted with its period, and its exact form.

**PDF point:** Table 3 and the methods are in the PDF. Proposed: GPT's extraction of Table 3, recorded as GPT's, checked by Claude against the abstract's two headline values only. Or Chad lifts the rule for this paper.

**Out of scope:** stock A; any other species; the NOAA stock assessment for false killer whales (its own small brief later).

---

## Brief C: migration corridor (one USGS herd)

**Inspect**
1. ScienceBase record for doi `10.5066/P1ETBSYE`: the full list of 30 child items.
2. For one herd (proposed: California mule deer, East Walker, if all three polygon types are released; otherwise the first herd that has them): the child items for Migration Corridors, Stopovers and Winter Ranges, their metadata records, and the shapefile archives.

**Establish**
- The herd list by species, with which layer types are released for each.
- For the chosen herd: file names and sizes; the metadata's statement of method, contributing years, number of animals, and any use-level classes (high, medium, low); the coordinate reference system; polygon counts, parts, holes and vertex counts.
- The licence wording on each child record, quoted. Any sentence about withheld data for this herd.
- The herd's own date and whether an earlier volume mapped the same herd (so the card can say fixed or revised).
- A measured size for the polygons at full detail and after one stated simplification.

**Interpretation questions**
- The card's sentences for "corridor", "stopover" and "winter range", from the metadata's own definitions.
- Any sensitivity note in the metadata or report about the herd or the places.

**PDF point:** the report (SIR 2026-5123) is a PDF; the audit uses the metadata records, which are text.

**Out of scope:** the Migration Routes layers; any other volume; the 152.69 MB archive as a whole; CMS.

---

## Brief D: bird journey (two packages)

**Inspect**
1. Movebank Data Repository doi `10.5441/001/1.694p666h`: the data file (16 MB), reference data (4.08 KB) and README (9.28 KB).
2. Movebank Data Repository doi `10.5441/001/1.3hp3s250`: `Galapagos Albatrosses.csv` (4.69 MB), reference data (5.92 KB) and README (13.84 KB).

**Establish, for each, as the zebra audit did**
- Identity, authors, licence text on the record and in the README, and any recommendation to contact the authors.
- Columns; rows; animals; per animal: first and last fix, fixes, interval pattern, gaps, rows without coordinates, flagged rows.
- The longitude convention; **the number of date-line crossings per animal**; latitude range; implausible steps (the speed implied between consecutive fixes).
- Quality and uncertainty fields; the time convention.
- What each record is, from the README and reference data: breeding stage, deployment site as the source names it, and what the paper says the trips are.
- Display size of one proposed bird in the existing JSON encoding, measured, with its compressed size.
- Sensitivity considerations, stated as considerations, not conclusions.

**Recommendation asked for:** one package and one bird, with reasons, or neither.

**PDF point:** none expected; READMEs are text. The two papers are read only as far as their HTML pages allow.

**Out of scope:** eBird, Motus, any other bird package; any date-line build work.
