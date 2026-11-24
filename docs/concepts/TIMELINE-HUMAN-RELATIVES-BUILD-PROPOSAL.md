# Timeline: Humans and human relatives — build proposal (rev 1, docs only)

24 Nov 2026 · Claude · Timeline thread · on Chad's "go" for the build proposal.
**Proposal only. Nothing is built or branched. No claim is frozen, no catalogue, hub or page is changed, nothing is filed in REGISTER. A branch build needs Chad's own go after GPT's review; anything live needs his own Approve line.**

Built on: `TIMELINE-HUMAN-RELATIVES-PROPOSAL.md` rev 2.1 (Chad's H1–H5; GPT accepted the design); `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` rev 1.2 (GPT accepted the bounded record); GPT's two reviews in `reviews/` (their minimum requirements are answered in §2–§7 and marked (GPT)).
Code read for this: `timeline.js` and `phase1/timeline/build_timeline.py` at main `6449484`. **Pixel figures here are arithmetic, not measurements of a drawn page** (§5).

## 1. Scope
**Four finds, one mark each, no line or fill between any two:**

| Id (proposed) | Find, neutral title | Attributed to, and how | Constraint | Source |
|---|---|---|---|---|
| `f-dinaledi-chamber` | Dinaledi Chamber fossils, Rising Star Cave, South Africa | Homo naledi (the source's name) | bracket for one deposit, 335–236 ka | Dirks et al. 2017 |
| `f-omo-1` | Omo I, Omo-Kibish Formation, Ethiopia | Homo sapiens (the source's name) | older than a dated eruption, 233 ± 22 ka at 2σ; no older limit | Vidal et al. 2022 |
| `f-xiahe-2` | Xiahe 2 rib, layer 3, Baishiya Karst Cave, Tibetan Plateau | Denisovan lineage, by proteins | bracket for the layer, 48–32 ka, **as reported by Xia et al. 2024** | Xia et al. 2024 |
| `f-la-ferrassie-eth-99102` | Hominin bone fragment from the La Ferrassie 8 burial context, La Ferrassie, France | Neanderthal, by mitochondrial DNA; its belonging to the LF8 child is the authors' inference | direct radiocarbon date, 41.7–40.8 ka cal BP at 95.4 % | Balzeau et al. 2020 |

**Not in:** DNH 134, Drimolen (held); DNH 127 (excluded); Ngandong and Liang Bua (not verified); any modelled disappearance; tools; genetics as dates; ancestry or contact; stories, images.
**No number above is frozen.** Freezing needs §9's open points closed and the exact passage locators recorded (GPT).

## 2. Data model: one entry per find
The renderer already draws **one mark per entry** (`markOf`). So the simplest way to make the find the plotted unit is: **an entry is a find.** No entry stands for a group, and nothing can join two finds, because no object spans them. (GPT: claim-level identity; separate geometry.)

New fields on a find entry (lane `relatives`):
- `find`: `{ specimen, context, site, country }` as the source writes them. `specimen` may be null (the Dinaledi assemblage has no single id here).
- `attributed_to`: `{ name, basis, qualified }`. `name` is the source's own wording ("Denisovan lineage" stays that; no species name is supplied by us). `basis` is one of `anatomy`, `proteins`, `mitochondrial_dna`. `qualified` is a sentence or null (La Ferrassie: the link to LF8 is the authors' inference).
- `links`: Wikidata ids for the group and the site, for linking only. They are not shown as the find's identity. (Wikidata names its Denisovan item "Homo longi"; we do not adopt that.)
- Exactly **one axis claim**, of one of three new types, plus non-axis claims that state what was dated and how it relates to the find.

**New claim types (fixed labels, checked by generator and page alike):**

| `claim_type` | Label on the page | `when.type` | Fields |
|---|---|---|---|
| `find_context_bracket` | Age bracket of the deposit or layer | `interval` (existing) | `from_ma`, `to_ma` |
| `find_older_than_dated_layer` | Older than a dated layer above it | **`limit`** (new) | `ref_ma`, `ref_pm`, `sigma`, `side: "older"` |
| `find_direct_date_calibrated` | Direct radiocarbon date, calibrated | **`calibrated`** (new) | `from_ma`, `to_ma`, `probability`, `datum_ce`, `curve`, `lab_id`, `c14_bp`, `c14_pm` |
| `dated_material` (non-axis) | What was dated | – | text; the method in plain words |
| `find_association` (non-axis) | How the date relates to the find | – | text |
| `reported_by` (non-axis, optional) | Reported by | – | text, for a number the source applies from an earlier study (Xiahe 2) |

**Every axis claim also carries, unchanged from the source (GPT: date semantics, reference system):**
- `source_notation`: the number as the paper writes it ("233 ± 22 kyr", "41.7–40.8 ka cal BP (95.4%)").
- `source_units`: `ka`, `kyr`, or `cal BP`.
- `confidence`: what the ± or the range means ("2σ", "95.4 % calibrated range", "bracket from two methods").
- `calibration` where the source states one (Omo I: Kuiper et al. 2008; under Renne et al. 2011 the same data give 234 ± 22, recorded as context).

**Conversion to the axis, stated once in the catalogue:** `ka` and `kyr` divide by 1000 to Ma with no rounding. **Calibrated years BP count back from 1950 CE** (`datum_ce: 1950`); the axis treats its zero as that datum for these claims and never uses the reader's clock. The 76 years between 1950 and today are 0.000076 Ma, far below anything drawn. One published calibrated result is used per find (the 2020 paper's); the 2022 recalculation is context and its endpoints are never mixed in (GPT).

## 3. Drawing
- **Lane row.** `relatives` becomes an active lane with its own row, labelled **"Humans and human relatives"** (the lane id stays `relatives`). Fixed line under the label, GPT's wording: *"Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact."*
- **Bracket** (Dinaledi, Xiahe 2): a bar at its true ends when it is at least `TRUE_PX` wide, otherwise a mark at its middle. The middle is a drawing position only and is never printed as an age.
- **Direct calibrated date** (La Ferrassie): the same rule, with its own glyph and "95.4 %" in the label.
- **Limit** (Omo I), option **L1, recommended:** a tick at the dated layer's age (233), a pale band for that layer's own ± (211–255) labelled "dated eruption", and a short open chevron pointing to the older side. **The chevron has a fixed length in pixels, not in years,** so it claims no older extent. The find is never drawn as a point at 233, never as a 211–255 bar for the fossil, and never as a hard edge with the ± dropped (GPT).
  Option **L2:** the tick and chevron only, with the ± in the label and panel but not drawn.
- **Fitting and clipping (GPT):** zoom-to-fit, presets and "Zoom to these" use a limit's `ref_ma ± ref_pm` only; the open side adds nothing. A bar or band cut by the window edge uses the existing clip marks.
- **Overlap.** The La Ferrassie date (41.7–40.8) lies inside the Xiahe 2 bracket (48–32) in time; they are two sites on two continents. Today's cluster rule would fold marks closer than 16 px into one list control. **Proposed: in this lane each find gets its own sub-row** (up to four rows, oldest first), so finds that overlap in time are all visible and none hides another; the cluster control is used only if there are ever more finds than rows.
- **Labels and selection.** Each find is its own Tab stop with its own history entry and `#id`, exactly like today's marks. `aria-label` reads the title, the attribution, the claim label and the date in words.

## 4. Text on the page
Panel for a find, in this order: title · "Attributed to … (by …)" with any qualification · the axis claim with its fixed label, the source's notation and plain words · What was dated · How the date relates to the find · Reported by (if any) · limits in one line ("This is the age of the deposit, not of a group") · source with status · Evidence last reviewed.
- Dates read in thousands of years: "335,000 to 236,000 years ago". The axis stays in Ma.
- **The generator refuses** any find text containing: first appeared, died out, went extinct, evolved into, ancestor of, descended from, met, interbred, the first human, earliest, latest, oldest, youngest, lived from.
- **Coverage line (GPT's form):** "This lane shows four dated finds reviewed for this page. Others are not yet reviewed, or their full text is not yet verified." No list of "missing" groups beside the plotted ones.
- With JavaScript off, the four finds are in the pre-rendered list under the lane's heading, complete.

## 5. Scale
Lane width, derived from positions the travel suite logged on 24 Nov: **about 1246 px at a 1280 px window and 356 px at 390 px.** Widths at candidate windows:

| | 1 Ma (today's limit) | **0.4 Ma (proposed view)** | 0.05 Ma (proposed limit) |
|---|---|---|---|
| px per thousand years, 1280 / 390 | 1.2 / 0.36 | 3.1 / 0.89 | 24.9 / 7.1 |
| Dinaledi bracket, 99 ka | 123 / 35 | 308 / 88 | out of view |
| Omo I eruption band, 44 ka | 55 / 16 | 137 / 39 | out of view |
| Xiahe 2 bracket, 16 ka | 20 / 6 | 50 / 14 | 399 / 114 |
| La Ferrassie date, 0.9 ka | 1.1 / 0.3 (mark) | 2.8 / 0.8 (mark) | **22 / 6.4 (true ends)** |

- **A lane view:** the plain label "Human relatives" becomes a button, **"Last 400,000 years"** (0.4–0 Ma). All four finds are in it at both widths.
- **Narrowest window:** `MIN_SPAN` from 1 Ma to **0.05 Ma**. The La Ferrassie date reaches the 4 px needed to be drawn at its true ends at 390 px once the window is 0.08 Ma or narrower; 0.05 leaves a margin. The number is confirmed or changed by measuring the built branch (GPT), and stays "an interface choice, not a statement about any source's precision".
- **Ticks.** `TICK_STEPS` stops at 0.1 Ma. Below a 2 Ma window, ticks step in thousands of years and read "300, 200, 100 thousand years ago"; above it nothing changes.
- **Bands.** The pinned chart has periods only, so this view is one band, Quaternary. No finer chart units are added in this slice.
- **Saved views.** Old saved windows stay valid. A window narrower than 1 Ma saved by the new page and opened by an older cached script is refused by that script's own check and falls back to the landing view. Tested both ways.

## 6. Validation and compatibility (GPT)
- **Schema 4.** The page states the schema it was built for; the script's label table gains the new types for schema 4 only. A schema-3 script counts claim labels and refuses a catalogue with more (`timeline.js`, "claim labels"), so an older cached page shows its list and no explorer. A schema-4 page refuses a schema-3 catalogue. Both are tested with the mixed-asset suite, not assumed.
- **Generator and page change together.** Entry rule becomes: lane `extinctions` with today's types, or lane `relatives` with exactly one of the three new axis types. Refused for a find: no `find.site`; no `attributed_to.name` or `basis`; a second axis claim; `interval` with `from_ma ≤ to_ma`; `limit` without `side`, `sigma` or `ref_pm`; `calibrated` without `probability`, `datum_ce`, `curve`; any number outside the chart window; missing `source_notation`, `source_units` or `confidence`; any forbidden phrase (§4); any `story` or image.
- **Unknown claim or `when` types fail closed** on both sides.
- **Older catalogues and routes are untouched.** R1, R2 and R3 stay byte-identical and served.
- **Release order, unchanged:** catalogue upload and read-back → reviewed hub pin (a hub version of its own, own Approve line; main must stay equal to the deployed hub) → page. A catalogue dated for a day is released on that UTC day. The change record for the new revision goes in `changes.json` and shows under What changed.
- **Animals `TL_MAIN`** moves through a stable reviewed page commit, then the pin, as on 24 Nov.
- **No new cost line.**

## 7. Tests
- **New suite `timeline-relatives-ui`** (Chromium, 1280 and 390) and additions to the build suites, on a **rehearsal catalogue that is never published** (as the story work did).
- **Breaks, each must be caught by a named check:** a bar joining two finds · a limit drawn as a point at its reference age · a limit drawn as a bar over its ± · the ± dropped from a limit · an older end invented for a limit · zoom-to-fit stretched by the open side · the calibrated datum taken from the device clock · two calibrated results' endpoints mixed · a bracket's middle printed as an age · a find hidden inside a cluster · a forbidden phrase in find text · a find with no site or no attribution basis · the group name replaced by a species name we supplied · a schema-3 script accepting the schema-4 catalogue · a window below the limit accepted · thousands-of-years ticks shown above the 2 Ma threshold.
- **Controls:** the released R3 page and script still pass their own suites untouched; a rehearsal catalogue with no finds draws exactly today's page.
- **Must still pass:** `timeline-ui`, `-axis`, `-travel-ui` (its limits and presets change: its expectations are updated in the same branch and listed in the packet), `-story-ui`, `-story-build`, `-changes-ui`, `-changes-build`, `-mixed-assets`, `-catalogue-hub`, `hub-alignment`, `animals-tab-ui`.
- **Measured, not judged:** drawn widths of the four finds at the three windows above, at both viewports, to settle §5.

## 8. Not covered by any of this
Real phone, Safari, screen reader, true 200 % zoom. The new lane makes the screen-reader check matter more: a limit and a bracket must sound different.

## 9. Open before any number is frozen
1. **La Ferrassie:** the 2023 chronology paper (doi 10.48738/2023.iss1.811) is unread; the journal's site does not load for Claude or for Chad. Enquiry drafted (`docs/research/TIMELINE-HUMAN-RELATIVES-ENQUIRY-DRAFTS.md`, E4). **The build can proceed on the rehearsal catalogue; this find is not frozen until the paper is read or Chad decides to show it with a stated note.**
2. **Passage locators** for all four (section and paragraph), source version, and the exact `source_notation` strings, into the freeze record.
3. **Wikidata ids** carried as checked in the source-check record rev 1.1.
4. **REGISTER rows** for the four sources: drafted with the branch packet, filed only on Chad's line.
5. Drimolen, Ngandong, Liang Bua: enquiries E1–E3 drafted. A reply can add a find later; it changes nothing in this build.

## 10. Decisions for Chad
- **B1.** One entry per find (§2). *Recommended.*
- **B2.** Omo I drawn as L1 (tick, eruption band, fixed-length chevron) or L2 (tick and chevron only). *I lean L1: the ± is part of the evidence and should be seen.*
- **B3.** Each find on its own sub-row instead of clustering (§3). *Recommended.*
- **B4.** The lane view "Last 400,000 years", and the narrowest window 0.05 Ma, both to be confirmed by measurement (§5). *Recommended.*
- **B5.** Thousands-of-years ticks below a 2 Ma window (§5). *Recommended.*
- **B6.** Build on the rehearsal catalogue now, with La Ferrassie unfrozen (§9.1), or wait for the 2023 paper. *I lean build now: nothing is published by a branch build.*

## 11. Questions for GPT
1. Does "an entry is a find" meet your claim-level identity requirement, or do you want a group container object as well?
2. L1 or L2 for the limit; and is a fixed-pixel chevron an acceptable way to draw "older, by an unknown amount"?
3. Is `datum_ce: 1950` with no device-clock conversion the right handling, given `ka` values have no stated datum?
4. Sub-rows versus clusters for finds that overlap in time.
5. Is the forbidden-phrase list (§4) too blunt (it would also refuse "earliest" inside a quoted paper title)?
6. Anything missing from the break list.

## 12. Limits of this draft
- Pixel widths are arithmetic from two logged mark positions, not a rendered measurement.
- No design mock-up has been drawn; glyphs and colours are not chosen.
- The effect of four more Tab stops on the keyboard path through the explorer has not been tried.
