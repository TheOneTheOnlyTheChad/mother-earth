# Timeline: Human relatives, a bounded first slice — proposal (rev 1, docs only)

24 Nov 2026 · Claude · Timeline thread · on Chad's "go" (audit and proposal draft; nothing built).
**Proposal only. No source is cleared, no catalogue or page is changed, nothing is filed in REGISTER. Each later step needs its own go; anything live needs Chad's own Approve line.**

Order note: Chad's T6 (`docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md`) put the source refresh before this proposal. On 24 Nov he asked for this first. The source refresh re-checks the Big Five sources and does not feed this slice; it stays queued.

Leads behind this proposal: `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-LEADS-2026-11-24.md`. **That file is a first pass, not a source check: one source was read in full, the rest were seen as abstracts.**

## 1. What is already decided (not reopened here)
- The lane "Human relatives" is on the page, empty, labelled "No entries yet" (D5, 10 Nov; T3, 23 Nov).
- Entries are **overlapping evidence ranges**. An overlap in time says nothing about shared place or contact. Ancestry or contact is shown only where a source supports that specific relationship (`TIMELINE-DEEP-TIME-PROPOSAL.md`).
- Smithsonian Human Origins is for orientation and source-finding only.
- The constitution: only observations with provenance, time and place; what is modelled says so; named things carry a stable public identifier where one exists.

## 2. What the leads changed
I proposed "five or six well-dated relatives, both ends, open primary sources". **The leads do not support that.**
- Only one group (Homo naledi) has both ends in one open source, and that range is the age of one cave deposit.
- Every other open lead gives one end only, at one site or in one region.
- Several familiar dates (the last Homo erectus at Ngandong, Homo floresiensis at Liang Bua, the Europe-wide Neanderthal date) are in papers with no open licence seen.

So the unit of this lane should not be "a species and its lifespan". It should be **a dated piece of evidence, at a named place, attributed to a named group**.

## 3. The proposed shape
**3.1 An entry is one group. Its claims are dated evidence, each at a place.**
- Title: the group's name as the source uses it (for example "Homo naledi").
- Each claim: what was dated, where, by which method in plain words, the date with the source's own uncertainty, and the source.
- The bar on the lane runs between the group's oldest and youngest **plotted** claims. Its label says "Dated evidence", never "lived from … to …".
- An entry with one dated claim is drawn as that claim alone (a mark, or a short bar where the claim is itself a range).

**3.2 Four kinds of date, kept apart.** The catalogue already has shapes for each; the reader sees which it is.

| Kind | Example lead | Existing shape |
|---|---|---|
| A deposit's or layer's age bracket | Homo naledi, Dinaledi Chamber, 335–236 thousand years ago; the Denisovan rib's layer, about 48–32 | `interval` |
| A minimum or maximum age only | Omo I, at least 233 ± 22 thousand years, no maximum | `bound` |
| A measured age of one find | none in the open leads yet | `measured` / `point` |
| A modelled estimate beyond the dated record | Neanderthal disappearance in France and northern Spain | `interval_modelled` |

A bound is drawn open-ended on its unknown side and says so. A modelled estimate is labelled "modelled" and names its region.

**3.3 Sentences the lane never writes.** "First appeared", "died out", "evolved into", "ancestor of", "met", "interbred with", "the first human". The earliest dated fossil is not the origin and the latest is not the extinction. A fixed line on the lane says: *"Bars show dated evidence. A group may have lived earlier or later than its evidence, and two bars that overlap in time may be half a world apart."*

**3.4 Fossils only in this slice.** Dates of tools attributed to a group (Mousterian, the Liang Bua artefacts) and dates from genetics (divergence times, interbreeding) stay out. Each would be its own later claim type.

**3.5 Place and identifiers.** Every claim names its site and country as the source does. Group and site carry a Wikidata identifier where one exists; these are looked up in the source check, not from memory.

## 4. The first slice
**Rule proposed (H2):** an end is plotted only if its source's full text and licence were read on the publisher's page (or by Chad or GPT, recorded as such) and its status was checked. An end with no such source is **not plotted and said to be not shown**, with the reason. This is the rule the Big Five met: all six sources are CC BY 4.0 and were read.

Candidates, from the leads, in the order I would check them:

| # | Entry | Claim(s) | Source | What must still be shown |
|---|---|---|---|---|
| 1 | **Homo naledi** | Dinaledi Chamber deposit, 335–236 thousand years ago | Dirks et al. 2017, eLife | Passage, licence and status on the page |
| 2 | **Homo sapiens** (earliest dated in eastern Africa) | Omo I, at least 233 ± 22 thousand years (2σ); no maximum | Vidal et al. 2022, Nature, CC BY 4.0 (read) | Status re-read; the supplementary-table correction shown with the claim |
| 3 | **Denisovans** | Rib, Baishiya Karst Cave, layer dated about 48–32 thousand years ago | Xia et al. 2024, Nature | Passage and licence; whether the date is the layer's; the protein-based identification stated |
| 4 | **Neanderthals** | Modelled disappearance in France and northern Spain | Djakovic et al. 2022, Scientific Reports | The dates (not yet seen); the paper's own limits |
| 5 | **Homo erectus** | Drimolen, about 2.04–1.95 million years ago | Martin et al. 2026, Annals of Human Biology | Licence; whether an open source carries the dating itself (it is from a 2020 Science paper) |

Expected outcome: **three to five entries.** Any that fails the check drops out; the slice is not padded to reach a number.

**Named and not plotted** (a plain line under the lane, like today's coverage plans): the last Homo erectus at Ngandong, Homo floresiensis at Liang Bua, the earlier relatives (australopiths and older). Reason given: "no source we could read and cite in full yet".

**Out of this slice, each a later proposal:** ancestry or contact lines; stories and images; reconstructions; tool and genetic dates; the earlier relatives; a full Neanderthal or Homo erectus range across sites.

## 5. What it means for the explorer (for planning; not authorised)
- **Scale.** The landing view spans 538.8 million years. All of these entries fall in the last 2.1 million, about 0.4 % of that width: one cluster at the right-hand edge. The lane needs its own view. The "Human relatives" preset is a plain label today by design, because the lane has no reviewed entries (`TIMELINE-TRAVEL-PROPOSAL.md` §3); with entries it would become a button. Its window is set by the slice (about 2.2–0 million years if Homo erectus passes; about 0.4–0 if not).
- **Narrowest window.** It is 1 million years today (T5, provisional). Four of the five candidates lie within the last 0.34 million, and the Denisovan and Neanderthal claims within the last 0.05. At 1 million years those two sit in the last 5 % of the width. The slice probably needs a narrower limit; the build proposal measures it and proposes a number.
- **Units.** The axis is in Ma. Entries here read better in thousands of years ("335–236 thousand years ago"), with the axis unchanged.
- **Clusters.** At the landing view the lane's entries form one cluster; the existing cluster list handles that. To be tested, not assumed.

## 6. What it means for the catalogue and release (for planning; not authorised)
- **New claim types**, for example `dated_fossil_deposit`, `dated_fossil_minimum_age`, `modelled_regional_disappearance`, each with a fixed label. The page's script refuses any catalogue whose claim labels differ from its own list (`timeline.js`, "claim labels"). So this is **a new schema (4), a new script, a new catalogue revision, an R2 upload and a hub pin**: a full release like R3's, not a page-only one. Old pages must go on refusing the new catalogue, as the mixed-asset rules require.
- **Lane status** for `relatives` changes from "No entries yet" to active, and the coverage sentence is rewritten.
- **Animals `TL_MAIN`** moves in the same release, in the order GPT set on 24 Nov (page commit, then the pin).
- **No new cost line.** One more small object in R2.

## 7. Steps, each with its own go
1. **Chad's decisions H1–H5 below; GPT's review of this proposal.**
2. **Bounded source check** (research, text only, time-capped): read each candidate's passage, licence and status on the publisher's page; look for later papers that revise each date; Wikidata identifiers; proposed REGISTER entries (filed only on Chad's line). **Chad may be needed at the screen:** on 24 Nov two of three full-text pages answered with a browser check, and two page reads needed an approval that went unanswered.
3. **Build proposal** (schema 4, claim types, wording, the preset, the narrowest window, fixtures and breaks).
4. **Branch build, suites, GPT.**
5. **Release** on Chad's own Approve line, on the catalogue's UTC day.

## 8. Decisions for Chad
- **H1. The unit.** Dated evidence at a place, attributed to a group (§3), instead of a species lifespan. *Recommended.*
- **H2. The source rule.** Plot only what was read in full with its licence and status; name the rest as not shown (§4). *Recommended.* The alternative is to plot paywalled dates from their abstracts, which adds Ngandong and Liang Bua but breaks the rule the Big Five met.
- **H3. Our own species on this lane.** Omo I is Homo sapiens. Options: (a) include it, since the lane's point is who was alive when, and say plainly that it is us; (b) leave it for the Human history lane. *I lean (a); the lane's name then needs a look ("Humans and human relatives"?).*
- **H4. The modelled Neanderthal claim.** Include a modelled, regional estimate in the first slice, or keep the first slice to dated finds only. *I lean: keep it out of the first slice unless the source check finds a dated-fossil source we can read.*
- **H5. Time cap for the source check.** The Big Five check had a 3-hour cap and used 11 minutes of search before its review rounds. *Suggested: 3 hours including the write-up.*

## 9. Questions for GPT
1. Is "dated evidence at a place" the right unit, and does the fixed lane sentence in §3.3 say enough?
2. Is a bar between a group's oldest and youngest plotted claims acceptable when the two ends are different kinds of date, or should each claim be drawn on its own with no joining bar?
3. Is the H2 source rule right, or too strict for a field where key dates sit in subscription journals?
4. Is naming unplotted groups under the lane helpful, or does it invite the reading that we judged them less real?
5. Anything in §6 that would make schema 4 harder than it looks?

## 10. Limits of this draft
- Figures in §3–§5 come from the leads file and carry its limits. Only Vidal 2022 was read in full.
- The explorer percentages are arithmetic on the current constants (538.8 Ma landing span, 1 Ma narrowest window), not measurements of a drawn page.
- No look yet at how other sites present this; no reader testing.
