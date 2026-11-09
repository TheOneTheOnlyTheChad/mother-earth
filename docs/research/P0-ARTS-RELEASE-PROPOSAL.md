# Arts (the Met) — proposal to put the cleared scope on the live site (rev 1, 9 Nov 2026)

**Status: proposal only, for GPT's independent review and Chad's decisions.** Arts remains **unselected**. Nothing here starts a prototype, Phase A, implementation, branch, resource, deploy or page change. Built from accepted evidence only (`P0-CHECKPOINT.md`, `P0-arts-planet-recovery.md`, `P0-RECOMMENDATION-DRAFT.md` rev 3, `REGISTER.md` Met entry, `docs/research/p0-recovery/arts/`). No new research, sample, fetch or measurement went into it, except one local size measurement of the existing object file (§4).

## 1. What is already cleared (accepted 7 Nov 2026, Chad after GPT) — unchanged by this proposal
- **Scope:** a metadata-only view of the Met's catalogued places of making (`created_at`), mapped to present-day countries. **Media excluded.**
- **Rights:** collection data CC0 1.0; commercial use yes; attribution not required (the README asks users to consider citing). REGISTER filed 7 Nov from Chad's paste.
- **Counts:** **479 distinct objects across 25 present-day countries** (`final-view-results.json`), meeting ≥ 300 / ≥ 20.
- **Clearance is research-gate clearance, not release readiness**, and not independent verification of every object.

### Limitations that travel with every use (all accepted; none may be dropped or softened)
| Area | Limitation |
|---|---|
| **What the 479 are** | A **seeded random sample** (R1: 2,000 records, `random.seed(20261107)`) of the **59,137 records with typed geography** (of 503,073 in `MetObjects.csv` at commit `e394878`, 2 Nov 2026, LFS sha256 `7adc37e4…d0fe`). Not the Met's collection; not a census of its geography. |
| **Departments** | Typed geography exists in 5 departments (Egyptian Art, Islamic Art, The American Wing, Medieval Art, The Cloisters); **4 contribute** (American Wing 326, Islamic Art 72, Medieval Art 43, Cloisters 38). Arts of Africa, Oceania and the Americas is an **excluded department, not an absence of those regions**. |
| **Concentration** | USA 239 (49.9%), France 47, UK 30, China 28, Iran 26, Germany 25, Egypt 19. Thin tail: 8 countries with one object (CAN, CZE, ECU, IRQ, JPN, MAR, PAK, UKR); 12 with ≤ 3. Reflects the sample and the typed departments, not the world's art. |
| **Geography meaning** | The Met's catalogued place of making, **mapped to present-day countries**: a location reference only, **not historical nationality**. "Country of Origin" is kept as its own relationship, **outside** the view. Superseded wording ("Formerly considered made in") never places an object. Source wording kept verbatim (e.g. "Made in", "Excavated in\|Minted in"). |
| **Verification** | Random page check: **0 / 27** reached pages disagree (95% interval for the error rate **0–12.5%**). **23 pages not reached: unverified, not passes.** The view is the Met's catalogue, not independent historical verification; the Met says cataloguing is ongoing. |
| **Sensitivity** | Every object carries **"sensitivity not fully assessed"**. No object was manually assessed; **11 carry tentative labels** (sacred/ritual 9, funerary 3, Indigenous source community 2; human remains 0), from keyword screens + 3 page findings; **unlabelled ≠ not sensitive** (the Yup'ik mask 717572 was found only by page check). Chad's decision, confined to this scope: **included with honest context**; inclusion is not a claim about ownership legitimacy; source restrictions preserved. |
| **Source changes** | The Met's CSV is updated weekly; every figure is tied to commit `e394878`. |

## 2. Recommended presentation — the smallest useful one
The page has **no geocoder and no country boundaries** (index.html, search help). A country-level record has no honest point on a globe, so drawing one means adding a geography source and a precision the data does not have.

| Option | What it is | New dependencies | Honest-precision risk |
|---|---|---|---|
| **A (recommended)** | One **optional card, off on load**, in the right column's Optional layers group: "Met catalogue sample — places of making (dated)". Switching it on loads the snapshot and opens a **list by present-day country** (25 rows, counts) → each row expands to its objects: object name, culture, department, the Met's wording + country verbatim, tentative labels where present, "sensitivity not fully assessed", and a link to the Met's object page. **Nothing drawn on the globe.** | none | none: no location is implied |
| B | A plus one globe marker per country at a reference point | a reference-point dataset (e.g. Natural Earth label points) → its own REGISTER entry and review | a marker reads as a place; label "country reference point, not where the object was made" mitigates, does not remove |
| C | Country polygons shaded by count | a boundary dataset → REGISTER; contested borders | boundary choices are political, against "no politics" |

**Recommendation: A.** It fits the site's pattern (optional, off on load, own toggle; precedent: microplastic samples shown as dated records), adds no source, and cannot over-state location. B or C would be separate later decisions with their own review. Under A nothing is drawn, so "Key · N layers" does not count it (as with the indices).

**Card wording (draft, for GPT's review):** value "479 objects · 25 present-day countries"; small "a sample of the Met's catalogue, snapshot 2 Nov 2026". Caveat line, always visible: "A seeded sample of 2,000 of the 59,137 Met records with typed geography, from 4 departments. The Met's catalogued place of making, mapped to present-day countries — not historical nationality. Sensitivity not fully assessed." Details: the full table in §1, plus the concentration line and the 23 unverified pages.

**Evidence label:** the page's labels are Observed / Computed. A museum catalogue record is neither. **Proposed new label "Catalogued"** (a record of what an institution states, dated) — a decision for Chad (§5 D3). "Projected" stays reserved.

**Shared keys:** each object keeps the Met's object ID; countries carry ISO 3166-1 alpha-3. Wikidata IDs (the shared-key direction) are **not looked up** for these objects or countries; adding them would be separate work.

## 3. Fixed snapshot vs updating data
| | Fixed snapshot (recommended) | Updating (weekly CSV) |
|---|---|---|
| What is shown | exactly the 479 accepted objects, pinned to `e394878` | a re-run of the classification on each new CSV |
| Clearance | **covered by the accepted evidence** | **not covered**: every update changes the set the page check, counts and sensitivity labels were made on; each would need re-validation |
| Work | one static data file, no job | a hub job pulling a 340 MB CSV weekly (CPU/memory unmeasured), re-classification, a validation rule for changes, monitoring |
| Cost | ~$0 (§4) | unmeasured; at least a weekly 340 MB fetch + processing |
| Honesty on the page | "snapshot 2 Nov 2026" is exact | would need its own change disclosure |

**Recommendation: fixed snapshot for the initial release.** Updating is a separate, later proposal if ever wanted.

## 4. Where the data is served from (a decision; constitution applies)
The constitution says **the hub is the product; the page is a client** (every surface reads the hub API).
- **H1 (recommended, constitution-consistent):** the derived file goes into R2 `ref/arts/met-R1-2026-11-02.json` (like plastic's pinned original), served by the hub at `/snapshot/arts` (hub code change: `arts` added to `LAYERS`, served from `ref/`, no cron, no collector). Three production actions, each with its own Approve line.
- H2: a static file next to the page on GitHub Pages. One production action, but it departs from the constitution: needs Chad's explicit exception.

**Size (measured 9 Nov, locally, from `final-view-objects.json`):** the published fields for 479 objects = **122,227 B JSON, 7,207 B gzip**. Loaded only while the card is on, so the cold load (1,500,912 B, 7 Nov baseline) is unchanged with it off.

**Cost:** no new line item expected. R2 storage < 1 MB and a few reads sit inside the Workers Paid plan already paid ($5/month); no cron, no outbound fetch. **Expected, not measured** — confirmed after release from the dashboard (§7).

## 5. Decisions still needed (Chad; none taken by this proposal)
| # | Decision | Recommendation |
|---|---|---|
| **D1** | Publish this scoped view as an optional card **without selecting Arts as a domain** — or treat publication as selecting Arts | publish as a scoped card; domain selection and Phase A stay separate |
| **D2** | Is the accepted "not release-ready" clearance enough for public release, with every limitation on the page — or do you want more checks first (e.g. the 23 unreached pages, a manual sensitivity pass of the 11 labelled objects)? Any check = new bounded work needing its own go | release with limitations disclosed; your call |
| **D3** | New evidence label "Catalogued" | yes |
| **D4** | Presentation A / B / C | A |
| **D5** | Snapshot vs updating | fixed snapshot |
| **D6** | Hosting H1 (hub) / H2 (static, constitution exception) | H1 |
| **D7** | Credit line. Not required; suggested: "Collection data: The Metropolitan Museum of Art Open Access (CC0), snapshot 2 Nov 2026 (commit e394878)" in the footer credits and Sources | include |
| **D8** | Links to the Met's object pages open the Met's site (which shows images there; nothing loads on ours). Keep the links? | keep; media stays excluded from our page |

## 6. Implementation steps (only after D1–D8 and a separate go; listed, not started)
1. Branch `arts-met-rc` from main.
2. A deterministic script derives the published file from `final-view-objects.json` (fields in §4; envelope with source pin, sample definition, counts, every §1 limitation as data); the output's sha256 recorded; re-running gives identical bytes.
3. Page: card in Optional layers, country list, per-object rows, Sources section `#arts`, Key/legend text if needed, "Catalogued" label; `?v=` bump; no image requests.
4. Hub (H1): `arts` route from `ref/`; `COLLECTOR_VERSION` bump; tests.
5. Tests (§7) with breaks that bite.
6. GPT review of the branch.
7. Production, in order, each on its own Approve line (§8): R2 upload → hub deploy → live RC check against the deployed hub → page release.
8. REGISTER Met entry status: "not on the page" → "on the page (fixed snapshot)" on release.

## 7. Acceptance checks
**Data (automated):** 479 objects, 25 countries, per-country counts = `final-view-results.json`; published sha = the script's output; every object has verbatim Met wording + country, department, link, "sensitivity not fully assessed"; the 11 tentative labels present and named as tentative; no object placed through "Country of Origin" or superseded wording; no field implies a coordinate.
**Page (automated, local + live RC in a clean pane tab):** off on load; on → loads once, list renders, counts match; off → cleared; failed fetch → honest "unavailable" (no zero); **no request to any Met image host**; every §1 limitation reachable from the card; concentration and thin tail shown; no wording that a country without objects has no art; Key count unchanged; desktop-overflow, mobile-pass and existing UI suites still pass; served hashes = reviewed commit after release.
**Hub (H1):** `/snapshot/arts` returns the pinned bytes (sha), no-store rules as other snapshots; health 8/8 unchanged; other layers' runs unaffected.
**Cost (after release):** Worker requests and R2 reads for `arts` read from the dashboard after 24 h; no new line item.

**Actual-phone checks (iPhone Safari, Chad; the Galaxy is not available):** card toggles on/off by touch; the country list scrolls and expands without page overflow at the phone's width; caveat lines readable without zoom; a Met link opens and returns; nothing on the globe changes. Separate from the outstanding Phase 0 iPhone runs, which can be done in the same sitting. Pane checks at 360/390 px supplement, never replace, this.

## 8. Production changes, rollback, approval wording
| Change | Approve line (sent only when that step is reached) | Rollback |
|---|---|---|
| R2 object `ref/arts/met-R1-2026-11-02.json` | `Approve: upload ref/arts/met-R1-2026-11-02.json (sha <sha>) to R2` | delete the object (own Approve line) |
| Hub with the `arts` route | `Approve: deploy hub <version> from <commit> (content only)` | redeploy 0.6.1 `f38296a0…` (own Approve line) |
| Page release | `Approve: push arts-met-rc to main (page change: Met catalogue sample card)` | revert the merge commit (own Approve line) |
The three rollbacks are independent; the page can be reverted alone with the hub and R2 left in place.

**The next step — exact bounded wording:**
1. Now (non-production): **"Go: GPT review of the Arts release proposal rev 1 — docs only."**
2. After GPT and your D1–D8 answers: **"Go: build arts-met-rc per the Arts release proposal rev <n> — branch only; no merge, R2 write, deploy or page change."**

## 9. Unchanged
Arts unselected; no prototype or Phase A. Life stopped. GIBS bench closed, no shadow record. Aircraft reopened only for bounded terms/access and feeder clarification. The inspiration list stays separate from the research backlog. All accepted reviews and approvals stand.
