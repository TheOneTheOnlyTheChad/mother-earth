# Timeline — deep-time axis, first slice: the Big Five mass extinctions (concept proposal, rev 1)

**Rev 1, 10 Nov 2026 (docs only).** Written from Chad's vision (10 Nov) and GPT's review of Claude's brief (10 Nov, relayed by Chad). **Nothing is built, researched, sampled or approved.** Every step after this document needs Chad's separate go; production steps need their own Approve lines.

**Rev 1.1, 10 Nov 2026 (docs only): ACCEPTED by GPT as a concept** (GPT read the Mac copy of rev 1; relayed by Chad). GPT recommends D1–D4 and D6 as written, **D5 = hide the empty axis lanes** (superseded by Chad's decision in rev 1.2: show them), D7 = 3 h including write-up, text only. Its two carry-forward points are added as §11a (source-check pass rules) and §11b (before a build). §3 updated for D5. **Chad's decisions and the source-check go are still separate.**

**Rev 1.2, 10 Nov 2026 (docs only): Chad decided D5 = SHOW all four lanes** (his reason: there is enough evidence to be found to fill them, so the page should show where the timeline is going). §3 and D5 rewritten; GPT's phone-space concern is answered with a compact rule for the lanes that have no entries yet (§3a). Each lane still fills only through its own slice and source check. For GPT's review.

**Rev 1.3, 10 Nov 2026 (docs only): GPT ACCEPTED rev 1.2 for concept approval** (Mac copy; relayed by Chad): all four lanes stay visible. Applied: a measurable phone target in §10 (GPT's proposed build target, pending measurement); empty rows add **zero** Tab stops; short phone row text with the explanation once in the coverage note; Human history reads "No dated entries on the axis yet" (Pliny is on the shelf).

**DECIDED 10 Nov 2026 (Chad):** "D1–D4 and D6 as written, D5 show all four lanes, D7 3 h incl. write-up, text only. Go: Big Five source check per §11a." Research only; build, R2, hub and page steps each still need their own Approve lines.

**Related:** `TIMELINE-CONCEPT.md` (concept rev 3.1), `TIMELINE-PAGE-UX-PROPOSAL.md` (rev 2, the shelf and evidence controls), `TIMELINE-ENTRY-BUILD-PROPOSAL.md` (rev 2, the Pliny entry), START-HERE §2 (constitution; T1 exception).

---

## 1. What Chad wants (his idea, in plain terms)
An actual timeline of events across deep time: the big sweep from the early Earth (an ocean world, early life) through billions of years to us today, with different kinds of events side by side — massive global wipeouts, the evolution and range of life over time, our cousins that we know of, and human history. "Jellyfish to humans" was Chad's shorthand for that range across time, not a claim of descent.

What is live today (main `4b23518`) is one carefully sourced entry (Pliny, *Letters* 6.16) on a "Dates without a year" shelf. It proved the evidence method; it is not yet a timeline in Chad's sense.

## 2. GPT's review (10 Nov 2026), adopted
- **The geological chart supplies the clock; the extinction literature supplies the events.** A chart boundary is a reference marker; the biological losses can span an interval or several pulses.
- Lanes kept, with these labels: **Earth systems and life** (broad enough for oceans, oxygenation, climate shifts and ice ages) · **Mass extinctions** ("wipeouts" stays conversational) · **Human relatives** · **Human history**. One clock; each lane treats its evidence on its own terms.
- **Human relatives:** shown as overlapping evidence ranges. An overlap in time says nothing about shared place or contact; ancestry or contact is shown only where a source supports that specific relationship. (Later slice.)
- **Earth-centred overview** for now; the cosmos before Earth can be a separate view that joins at Earth's formation (later).
- **Pliny stays on the "Dates without a year" shelf**, grouped under Human history if useful. The year attributed in the withdrawn abstract never gives the letter an axis position.
- **Big Five first, human relatives second.**
- **No percentage-loss comparisons** in this slice (no common denominator or method yet).
- **End the T1 exception with this release:** one reviewed, versioned catalogue served by the hub, from which the page also generates its plain-HTML fallback (§6).
- GPT checked the named public source pages and licensing leads; it sampled no dataset and cleared no source.

## 3. What the first release shows
- **Overview strip:** the full Earth span (~4.5 billion years to now) as a thin bar, with a marked window showing which part the main view covers. Its purpose is scale: at the widest view you see how much of Earth's history sits before the later chapters.
- **Main view: a labelled Phanerozoic zoom window** (roughly the last ~540 million years; the exact bounds come from the pinned chart, §5) with the **five mass-extinction episode cards** on the Mass extinctions lane, against the chart's period/era bands.
- **Coverage statement, always visible:** what this release covers (five episodes, one chart revision) and that **empty stretches are not periods where nothing happened** — they are not yet shown.
- **All four lanes shown** (D5, Chad's decision, rev 1.2): Earth systems and life · Mass extinctions · Human relatives · Human history. Mass extinctions is the active lane with the five episode cards; the other three are visible and labelled, with no entries yet (§3a). One line states that this release covers five episodes.
- **Overview vs explorable window:** the page says plainly that the full-Earth strip is an overview and the Phanerozoic window is the part visitors can explore in this release.
### 3a. Lanes with no entries yet (rev 1.2)
- Each row reads **"<Lane name> · No entries yet"**; Human history reads **"Human history · No dated entries on the axis yet"** (Pliny is already on the page, on the separate partial-date shelf). The longer explanation ("this lane fills as its evidence is checked") appears **once**, in the coverage note. Nothing is drawn in a lane: no placeholder marks, sample dates or illustrative shapes, because nothing unchecked is shown (constitution).
- **Phone space (GPT's concern):** lanes with no entries collapse to a single thin labelled row (about one line of text high), so the active lane keeps the room for dates and evidence. A lane expands to full height only once it has entries.
- **Keyboard and screen readers:** empty rows add **zero Tab stops**; their names and status are available to screen readers (as text in the reading order), and keyboard users tab straight to the controls that do something.
- **The no-JS list** names all four lanes, with the same "no entries yet" line under the empty ones.
- Showing a lane is **not** a claim that its evidence exists or has been checked; each lane still needs its own slice proposal and source check (§11) before anything appears in it.

- **Pliny:** on the shelf as today; its public link (`#e-pliny-ep-6-16`) stays stable.
- **Opening an episode:** the same panel/sheet pattern as Pliny (desktop panel, phone sheet, Back closes), with the evidence items one action each.

## 4. The five episodes and the date shapes they test
Names only here; **no ages are stated in this proposal** — every value comes from the pinned chart or a named source at the source check (§7).

| Episode | Shape it is expected to test (to be confirmed by the selected evidence) |
|---|---|
| End-Ordovician (Late Ordovician) | **several pulses** — the literature describes two phases; if the selected evidence supports only a broader interval, show that interval |
| Late Devonian | **interval** (a protracted crisis) or several pulses, per the selected source |
| End-Permian | **boundary marker** plus an event interval, per source |
| End-Triassic | **boundary marker** plus an event interval, per source |
| End-Cretaceous | **boundary marker**; any proposed cause (e.g. the impact) is a separate claim with its own source |

The slice is chosen because it must show a boundary, an interval and several pulses **without making them look like the same thing**.

## 5. Scale rule
- **Linear within each zoom window**, with the visible range and units shown (Ma = millions of years ago, as the source states them).
- **Overview** shows where the window sits within the full span.
- **Overlap:** labels or marks that collide are clustered (a count marker opening a list) or offered a closer view. **Time positions are never shifted** to make room.
- A boundary is drawn as a line, an interval as a bar, pulses as separate marks on one row; uncertainty is drawn differently from duration (§5a).
- No log axis in this slice (it distorts duration and invites misreading); revisit only with a proposal.

### 5a. Date model (one `when` object per claim)
| Type | Fields | Notes |
|---|---|---|
| `boundary_age` | value, ± uncertainty, units, chart revision, boundary name | a chart reference marker, not the event itself |
| `measured_age` | value, ± uncertainty (and its meaning, e.g. 2σ), units, method, material dated | |
| `interval` | start, end (each its own value ± uncertainty, or `null` = unknown), units | **event duration** |
| `pulses` | list of `measured_age` or `interval`, ordered | e.g. the two Ordovician phases |
| `partial_date` | as Pliny today (calendar fields present/absent) | never placed on the axis without a year |

Rules:
- Store the **source's original value, units and reference basis** (e.g. "Ma", "before 1950") before any display conversion; display conversions are labelled as ours.
- Keep three things apart: **measurement uncertainty**, **event duration**, and **the span of surviving evidence**.
- **An unknown bound stays unknown** (`null`), never filled.

## 6. Hub, catalogue and the no-JavaScript view (ends the T1 exception)
Same pattern as the Arts card (hub 0.6.2), which already works in production:
- **Catalogue file:** one JSON file holding every timeline entry (the five episodes + Pliny with its partial-date type), with a `catalogue_revision`, generated reproducibly from source files in the repo (`phase1/timeline/`), and its complete-file sha256 pinned.
- **Storage and route:** the file goes to R2 `ref/timeline/<revision>.json`; the hub serves it at a fixed route (proposed `GET /catalogue/timeline`) **only if the stored file's sha256 matches the pinned value**, else 503 unavailable. Outside LAYERS, cron, D1, health and history (like Arts).
- **No-JS fallback:** the build script renders the plain entry list (dates, evidence, source links) into `timeline.html` from the **same pinned revision**. The page embeds that revision's hash.
- **Revision consistency:** the page draws the axis only from a catalogue whose hash equals the one it embeds. On mismatch or hub unavailability, the axis shows "timeline data unavailable" and **the plain list, evidence and source links stay usable**; dates and evidence from two revisions are never mixed.
- **Release order (each its own Approve line):** R2 upload → hub deploy (pin the pre-deploy version) → live RC check → page release. **Rollback page first**, then hub, then the R2 object.
- **Cost:** one small R2 object and one Class B read per page load that reaches the hub — inside the allowances measured in the Arts billing check; to be re-stated with numbers in the build proposal.

## 7. Sources and terms (all leads; nothing cleared)
| Lead | Role | Status |
|---|---|---|
| ICS International Chronostratigraphic Chart + official data repository | the clock: period/era bands, boundary ages | GPT reports **CC BY 4.0** on the chart and repository; **to verify and pin the exact release** and attribution in REGISTER. ICS distinguishes revisable numerical ages from what defines a boundary — keep that distinction in the entries. |
| Peer-reviewed extinction literature (open access) | the events: timing, pulses, reported impact; proposed causes as separate claims | GPT's leads: *Late Ordovician Mass Extinction: Earth, fire and ice* (Europe PMC PMC10799725; GPT reports CC BY 4.0) and *Selectivity of mass extinctions* (open review). **At least one named source per episode**; passages checked, not just titles. Source status (e.g. withdrawn, corrected) recorded — the Pliny lesson. |
| Paleobiology Database | later: where and when fossils were recorded | GPT saw CC BY 4.0 on one VertNet occurrence release; terms of whichever route is selected to be verified. Occurrences = recorded finds. Not in this slice. |
| Smithsonian Human Origins | later: orientation and source-finding for Human relatives | reuse checked item by item (Smithsonian Open Access marks CC0 assets by designation). Not in this slice. |

The claims above about licences are **GPT's readings, not yet Claude's or Chad's**; operative sentences go into REGISTER only from a direct extraction, labelled with who read it.

## 8. Evidence record per entry
Stable ID · the claim · what was actually dated (material/horizon) · method where reported · the `when` object (§5a) · source (citation, DOI/URL) · passage or table locator · source version/revision · source status (live/withdrawn/corrected, checked date) · checked date · any project transformation. **Timing, proposed cause and reported impact may each have different sources** and are separate claims.

## 9. Revisions
- An entry's link never changes when its date moves.
- Each change records the previous value, what changed, why, and which source revision drove it; the catalogue revision bumps.
- A source's status is recorded; a **withdrawal or correction is surfaced wherever the affected claim appears** (as the EGU abstract is on Pliny today).

## 10. Acceptance (for the later build)
- A **boundary marker**, an **interval**, a **multi-pulse entry** and **Pliny's unplaced date** each render correctly and distinctly; Pliny never appears on the axis.
- Overview + zoom on phone (390 × 844) and desktop; no horizontal overflow; keyboard access to every mark; a list view reachable without the axis.
- The no-JS fallback carries every entry, its dates and evidence.
- **Empty-lane rows (rev 1.3, GPT's proposed build target, pending measurement):** at 390 × 844 with default text size, the three empty rows together use **≤ 96 CSS px**, gaps and padding included. At larger text sizes or narrower widths they wrap and grow **without clipping or horizontal scrolling**. They add zero Tab stops (§3a).
- Revision consistency through rollout and rollback (hash mismatch → list only, never mixed data); hub-unavailable state.
- Tests break-checked as before (each guard fails when its fix is removed).

## 11. Steps and approvals
1. **This proposal** → GPT review → Chad's decisions (§12). *Docs only.*
2. **Bounded source check** (research, own go): verify the ICS licence and pin a chart release; select and read one open source per episode (passage-level), record status; propose REGISTER entries (filed only on Chad's line). Text only; time-capped (D7).
3. **Build proposal** (docs): exact catalogue schema, route name, page layout wireframes, cost figures.
4. **Branch build** (own Approve line) → GPT review → R2 upload → hub deploy → live RC → page release, each its own Approve line.

### 11a. Source check — what counts as a pass (GPT, 10 Nov; to fix before the source-check go)
Per episode, a **pass** needs all three:
1. a **readable passage** (text, not a PDF unless Chad decides otherwise) that supports the timing shown on the card, with its locator;
2. the **source version and status** recorded (live / corrected / withdrawn, with the checked date);
3. **terms evidence for the intended use** (storing, reformatting, displaying and serving the cited facts and short attributed wording through the hub), recorded with who read it.

Rules:
- **3 h including write-up is a cap, not a target.** An episode not resolved at the cap is recorded **unresolved**, and stays off the axis.
- **The chart can supply a reference boundary but never a missing event date.** An episode with only a chart boundary is shown as a boundary marker labelled as such, or not at all (decided in the build proposal), never with an inferred event interval.
- **Publish only the shape the evidence supports.** If no source supports a multi-pulse entry, the pulse rendering is still built and tested with a **fixture**, and the real entry uses the shape its source does support.
- The chart release itself: licence read directly and the exact release pinned (revision, date, file hash).

### 11b. Before a build (GPT, 10 Nov; to be specified in the build proposal)
- **Approximate ages and one-sided intervals:** how "~", "at least", "before" and an open start or end render, on the axis and in the list. An open bound is drawn as open, never closed off.
- **Hub/page version mismatch:** with one fixed route serving one revision, an old page can briefly fall back to the list during a deployment or rollback. That is consistent with §6 **if the fallback is tested and the previous catalogue object is retained in R2** for rollback.
- **R2 headroom for this release:** re-read the account's current usage. The Arts billing check covered its own review window only.

## 12. Decisions for Chad
- **D1** End the T1 exception with this first axis release (catalogue on the hub; no-JS list generated from it). *Recommended (GPT + Claude).*
- **D2** First slice = Big Five on a Phanerozoic zoom window with a full-span overview; Human relatives second. *Recommended.*
- **D3** Lane labels: Earth systems and life · Mass extinctions · Human relatives · Human history. *Recommended.*
- **D4** No percentage-loss figures in this slice. *Recommended.*
- **D5** Lanes: **DECIDED by Chad (rev 1.2): show all four lanes.** Lanes without entries collapse to a labelled thin row with "No entries yet" (§3a). *Superseded:* rev 1.1 recorded GPT's recommendation to hide them (phone space); §3a answers that concern.
- **D6** Cosmos before Earth: a separate later view. *Recommended.*
- **D7** Source check cap: 3 h incl. write-up, text only (no PDFs unless Chad decides otherwise). *Suggested.*
