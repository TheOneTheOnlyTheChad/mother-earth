# Nature context — soil carbon (Workstream B): assessment result and proposed presentation (rev 1)

**24 Nov 2026 (14:40 UTC clock reading). Docs only.**
- **Under:** Chad's standing decision of 24 Nov (dated snapshots and modelled datasets allowed; START-HERE §2) and his acceptance of the dated-model exception for this product.
- **Evidence:** `docs/research/soil-c1/SOIL-C1-ASSESSMENT-NOTES-2026-11-24.md`.
- **Method:** `docs/research/soil-c1/cells4.py`.
- **Spec:** `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` §6, with GPT's Stage 0 review §5 (aggregation rules).
- **Not approved by this document:** a soil card, a hub route, an R2 upload, a deployment, or a repository copy of the derived data.

## 0. Bottom line

1. **The product is what it says, and the numbers reproduce.**
   - Both files match Zenodo's MD5 and the release manifest's SHA-256.
   - The files' own tags give the 1 km semantics: Mg CO₂e per 1 km cell per year; NaN where part of the organic soil lacks an estimate; zero where no organic soil is mapped.
   - Summed globally, the ten maps reproduce the paper's ranges: drainage 1.99–2.15, fire 0.48–0.69, 2021–24 total 2.69 Gt CO₂e/yr. The extent reproduces the paper's 1,144 Mha (1,145.5 measured).
2. **Aggregation to Mother Earth's 4° cells is exact and conserves mass.**
   - Weights are equal-area overlaps on the source grid, as GPT set out.
   - Cell sums equal raster sums to within 5×10⁻¹⁶.
   - NaN is never summed, and its area is carried as "missing".
   - Cost: about 40 s and 1.1 GB of memory per map in the workspace; about 6.5 minutes for all ten. The derived table is 313 KB, 37 KB gzipped.
3. **What it can support on the page:** for one 4° cell, a **modelled** annual average of emissions from **drained** and from **burned** organic soils, per reporting period, with the cell's mapped organic-soil area and any missing area. It is not a measurement, not a stock, not a trend, and not connected to today's fires.
4. **One small open point:** the 2011–15 raster total is 2.696 against the paper's stated top of 2.69. It is not resolved without the tables (§4 of the notes).

## 1. Proposed presentation (first preview: fixture only, page only)

**Where:** a "Soil (modelled)" row in the existing "Everything here" panel, after Forest disturbance, with an entry on Sources. There is no globe layer in the first preview: a coloured layer of a model would compete visually with observations, and Chad's bare-start rule keeps new layers off anyway. A layer can be a later, separate proposal.

**Row, for a cell with organic soil (wording for GPT to test):**

> **Soil (modelled) · containing 4° cell** — modelled, not measured · emissions from disturbed organic soils, **2021–2024 average**: drained ≈ <a> t CO₂e per year · burned ≈ <b> t CO₂e per year · mapped organic soil ≈ <c> km² of this cell
> <span class="q">Glen et al. 2026, model outputs v1.0.1 (WRI Land & Carbon Lab; CC BY 4.0), IPCC Tier 1 factors applied to mapped drainage and burned area. Drainage is inferred from nearby roads, canals and land use, not measured; fire is conservative and excludes undrained tropical peat fires. A period average, not this year, and not linked to fires shown elsewhere on this page. Source checked <date>.</span>

**Values:**
- Rounded to **two significant figures**. The paper's emission-factor scenario alone spans 1.50–3.97 Gt against a 2.69 baseline, so more digits would claim precision the model doesn't have.
- Units are "t CO₂e per year" (1 t = 1 Mg).
- No combined total is shown in the first preview; drained and burned stay separate, as GPT recommended.

**States:**

| State | When | Text |
|---|---|---|
| Modelled value | organic soil > 0 and a value > 0 | as above |
| Modelled zero | organic soil > 0, value 0 | "0 in this model for <drained/burned>: no disturbance mapped here, or no IPCC default for this kind of soil, which is not proof of no emission" |
| No organic soil | organic soil 0 | "no organic soil mapped in this cell by this model" (e.g. Cape Town's cell `14_49`) |
| Partly missing | `missing_km2` > 0 | value plus "· the model has no estimate for <m> km² of this cell; this is a sum over the rest" (Iceland and Canadian Arctic cells, 2011–15 and 2016–20 only) |
| No data loaded | fixture or route unavailable | "unknown — the soil table is not available", never 0 |

**Other periods:** the 2001–05 … 2016–20 values sit behind a "Show all reporting periods" disclosure, as five rows of drained and burned. The heading says: "Each period is its own model run on that period's land use and burned area; drainage infrastructure is held fixed across all periods, so differences between periods are not a trend." No arrows, percentages or change words.

**Sources:** a "Soil carbon (modelled)" entry with:
- citation, DOI, licence and version;
- the file hashes;
- the last-checked date and the review cadence;
- what the numbers are and are not, and the limitations from the paper's §4.5.

## 2. Data path for a later release (options; Chad decides; none approved)

| | Path | For | Against |
|---|---|---|---|
| **P1** | A pinned derived table in the repository, read by the page (no hub, no R2) | No hub change, so no coordination with the Earth from Space owner; versioned with the page; tiny (37 KB gzipped) | A derivative in the public repository; there is no "latest" route, but none is needed for a dated product |
| **P2** | Upload to R2 at `ref/soil/glen2026-v1.0.1-g4.json`, served by a versioned hub route (the Arts and Timeline catalogue pattern) | Matches the catalogue pattern; keeps data out of the page repository | A hub change and an R2 write, each on its own Approve line, coordinated with the Earth from Space owner |

**Recommendation: P1 for the first release.** The product changes at most a few times a year. Its licence (CC BY 4.0) allows redistribution with credit, and changes are reviewed by diffing two pinned tables. Under either path, 1.0.1 stays kept when a newer version arrives.

## 3. Fixture preview (when Chad gives the go; not started)

- **Page only:** a pinned fixture table holding a handful of real cells taken from the derivative:
  - `22_70`, large values;
  - `21_29`, a forest-sweep cell, small values;
  - `38_39`, Iceland, partly missing in 2011–15 and 2016–20;
  - `14_49`, Cape Town, no organic soil;
  - one cell with organic soil but a modelled zero.
- **Tests:** a suite modelled on `nature-context-ui`:
  - every state;
  - two-significant-figure rounding;
  - the disclosure's no-trend heading;
  - no combined total;
  - "modelled, not measured" always present;
  - no request for the table anywhere other than the pinned path;
  - breaks for each rule.
- **Shared files:** `app.js` and `index.html` again. Since the Nature context release, the Animals suite pins those to `NC_MAIN` (`90eb522`), so a release would move `NC_MAIN` in a Nature context release commit, under the rule already agreed.

## 4. Decisions for Chad

- **S1.** The presentation in §1: a panel row only, drained and burned separately, two significant figures, other periods behind a disclosure, no globe layer yet. *Recommended.*
- **S2.** The data path for a later release: P1 (pinned table in the repository) or P2 (R2 plus hub route). *Recommended: P1.*
- **S3.** The review cadence: monthly while the 30 m open release is pending, then quarterly. *Recommended.*
- **S4.** When GPT passes this: the go for the fixture preview on a branch (§3).

## 5. Questions for GPT

- **G1.** Is splitting each 1 km cell by exact equal-area overlap (uniform within the cell), with NaN area carried as missing, an acceptable reading of your F(C) rule, given that the source file itself was made by "conservative overlap"?
- **G2.** Is two significant figures, with the scenario-range sentence omitted from the row but kept on Sources, honest enough? Or should the row carry the 1.50–3.97 range in words?
- **G3.** Does the zero-state wording avoid implying either "no emission" or a known cause?
- **G4.** Should the 2011–15 total difference (2.696 against the paper's 2.69) be resolved, by fetching the 842 KB tables zip on Chad's yes, before any release?
- **G5.** Is the per-period disclosure, with its heading, enough to stop period-to-period jumps (e.g. `22_29` ×15; Iceland 0 → 1.8 M → 0) being read as change?
