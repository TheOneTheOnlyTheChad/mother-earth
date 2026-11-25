# Nature context — organic-soil emissions (Workstream B): corrected assessment packet and proposed presentation (rev 3, cleaned 25 Nov as the build brief)

**Rev 3, 25 Nov 2026. Docs only.** *Cleaned 25 Nov after GPT's preview-readiness review (`reviews/2026-11-25-soil-c1-rev3-preview-readiness-gpt-review.md`) and preview review (`reviews/2026-11-25-soil-preview-rc-gpt-review.md`): superseded wording in §1, §1b and §2 now matches what was approved and built (`soil-preview-rc`). No decision changed.* Rev 3 answers GPT's rev 2 recheck (`reviews/2026-11-25-soil-c1-rev2-gpt-recheck.md`, filed unchanged): it fixes R2-1 and R2-2, and revises S1 to add an optional globe layer (§1b) after Chad raised the spatial-discovery gap. Rev 2 text below stands except where §0a says otherwise.
- **Supersedes:** rev 2 of 25 Nov (commit `d520b33`) and rev 1 of 24 Nov (commit `72ea123`).
- **Answers:** GPT's soil C1 assessment review, which was a HOLD (`reviews/2026-11-25-soil-c1-assessment-gpt-review.md`, filed unchanged).
- **Under:** Chad's standing decision of 24 Nov, which allows dated snapshots and modelled datasets (START-HERE §2), and his acceptance of the dated-model exception for this product.
- **Evidence:** `docs/research/soil-c1/SOIL-C1-ASSESSMENT-NOTES-2026-11-24.md`; see its rev 2 amendment, which also corrects its §2 summary.
- **Builder:** `docs/research/soil-c1/soil_build.py`. It replaces `cells4.py` and the unsaved assembly step.
- **Controls:** `docs/research/soil-c1/soil_controls.py`.
- **Spec:** `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` §6.
- **Not approved by this document:** a card, a hub route, an R2 upload, a deployment, a repository copy of the derived table, or the tables download in §6.

## 0a. What changed in rev 3 (GPT rev 2 recheck)

| Finding | Fix |
|---|---|
| **R2-1:** the reference display trusted an absent cell before validating the table (an empty table and an unsupported period both gave "no organic soil mapped"; a positive state with −1 showed "<0.01") | New `docs/research/soil-c1/soil_reference.py`, the contract the page must reproduce:<br>• `load_table` checks the pinned SHA-256, then JSON, then `validate_table`.<br>• `validate_table` checks the whole table once: version, DOI, grid, periods, sparse rule, canonical in-domain cell ids, types, finite non-negative numbers, and state/value/coverage consistency. Any failure makes the table unavailable everywhere.<br>• `display` checks the cell id and period **before** the sparse rule.<br>GPT's three reproductions are controls G1–G3, plus 17 malformed-table mutations (G4), the real table validating (G5) and pinned identity against truncation (G6). |
| **R2-2:** C8 failed on size before reaching the units guard | C8 now uses an otherwise valid header mock that passes every guard (C8a). Wrong units are refused by the tag guard, not the size guard (C8b). A mutation with only the units guard removed lets the wrong-units mock through (C8c), so C8b depends on that guard. Wrong period and wrong extent units are also refused (C8d, C8e). C7 still tests size on its own. |
| **Conservation wording** | The 6-significant-figure **table** sums differ from the raw raster sums by 1.5×10⁻⁸ to 6.8×10⁻⁷ relative; this is storage rounding (GPT measured it independently). Exact conservation applies to the unrounded aggregation inside the builder, not to the exported table. |
| **S1** | Revised: the panel row stays, plus an optional, off-by-default 4° globe layer (§1b). |

Controls: `soil_controls.py` gives **75 passed, 0 failed** (rev 2: 58). The table is unchanged (`c5c01ff5…30cf`); no raster rebuild was needed.

## 0. What changed since rev 1 (by GPT finding)

| Finding | Fix |
|---|---|
| **H1:** rounding to one decimal turned 42 cells with mapped organic soil into 0.0, and 12 of those have emissions | The builder decides every state from **unrounded** sums before any rounding.<br>Each cell carries an explicit `has_mapped_organic_soil` flag, each period a `coverage` value, and each component a `state` (`positive` / `zero` / `unknown`).<br>Stored numbers keep **6 significant figures**, which cannot turn a positive into 0.<br>Display uses two significant figures and never shows a positive as 0; below 0.01 it shows "<0.01". |
| **H1, also found:** cell `33_54` had 0.00025 km² of organic soil, which the 24 Nov per-map files (three decimals) had already lost | Restored. All **43** small-area cells now keep their flag: GPT's 42 plus `33_54`. |
| **H1:** no assembly script | `soil_build.py` reads the inputs and writes the final table in one run. Nothing is done by hand. |
| **H2:** "missing km²" overstated what is known | The field is renamed `incomplete_source_footprint_km2`: the overlap area of source raster cells flagged NaN. It is a raster footprint, not the organic-soil area that lacks estimates.<br>The builder compares the drained and burned NaN masks **cell for cell** in every period and stops if they differ. They are identical. |
| **H2:** a period with no source cells available must show unknown | `coverage: none` gives every component the state `unknown`, with no value. No such cell exists in v1.0.1; the controls exercise the case. |
| **H2 / G3:** the zero wording implied a cause | Replaced with: "0 assigned by this model for <component> in this period; this does not establish zero real-world emissions." |
| **G5:** "differences are not a trend" was too categorical | Replaced with GPT's wording (§1). |
| **G2:** uncertainty | A short sentence now sits beside the values. The global scenario ranges move to Sources, labelled as global sensitivity scenarios. |
| **G4:** totals discrepancy | Not resolved. A bounded tables check is prepared for Chad's go (§6). |
| **Sparse omission** | The table metadata defines the 45 × 90 domain and what an unlisted cell means (§1). A missing table, period or malformed record is unavailable, never 0. |
| **Fail-closed inputs** | The builder now checks: hashes; CRC and size of each GeoTIFF against the zip directory; exact CRS, transform, size, dtype and tags; finite or NaN values only; no negatives; extent between 0 and 100 with no NaN. The controls show each check refusing bad input. |
| **Memory unit** | Reported as `peak_rss_MiB_linux`, with the platform. |
| **Name** | The row is "Organic-soil emissions (modelled)", not "Soil carbon", so it is not mistaken for carbon stock. |

## 1. Proposed presentation (first preview: fixture only, page only)

**Where:** a row in the existing "Everything here" panel, after Forest disturbance, plus an entry on Sources, plus the optional globe layer in §1b (Chad's revised S1).

**Row** (the full text is fixed by `soil_reference.display` in `docs/research/soil-c1/soil_reference.py`, which the page must reproduce):

> **Organic-soil emissions (modelled) · whole containing 4° cell** — modelled, not measured · **2021–2024 average** · drained ≈ <a> t CO₂e per year · burned ≈ <b> t CO₂e per year · mapped organic soil ≈ <c> km² of this cell
> <span class="q">Totals for the whole 4° cell, not this point and not per hectare. Substantial model uncertainty; local uncertainty is not quantified. Glen et al. 2026 model outputs v1.0.1 (WRI Land & Carbon Lab; CC BY 4.0): IPCC Tier 1 factors applied to mapped drainage and burned area. Drainage is inferred from nearby roads, canals and land use; fire is conservative. A period average, not this year, and not linked to fires shown elsewhere on this page. Source checked <date>.</span>

**Real examples from the reference function:**
- `22_70`: "drained ≈ 310,000,000 t CO₂e per year · burned ≈ 4,600,000 t CO₂e per year · mapped organic soil ≈ 80,000 km²".
- `31_78`: "mapped organic soil ≈ 0.044 km²", where rev 1 would have shown 0.

**States**, decided from flags and never from formatted numbers:

| State | When | Text |
|---|---|---|
| Positive | `state: positive` | "≈ <2 sig. fig.> t CO₂e per year" (below 0.01, "<0.01") |
| Model zero | `state: zero` | "0 assigned by this model for <component> in this period; this does not establish zero real-world emissions" |
| Incomplete coverage | `coverage: incomplete` | appended: "incomplete model coverage: source raster cells covering about <m> km² within this 4° cell have missing estimates. Values sum the available raster cells." A zero under incomplete coverage is never called a complete zero. |
| Unknown coverage | `coverage: none` | "unknown — the model has no estimate for any part of this cell in this period" |
| No organic soil | cell in the domain but not listed (e.g. Cape Town `14_49`) | "no organic soil mapped in this cell by this model" |
| Unavailable | table missing or invalid, period missing, record malformed, id outside the domain | "unknown — …", never 0 |

**Sparse rule** (from the table metadata):
- A cell is listed when it has mapped organic soil, any positive value, or any incomplete footprint in any period.
- An unlisted cell in the 45 × 90 domain has no mapped organic soil, exactly 0 for both components in every period, and complete coverage.
- In v1.0.1, all 790 listed cells have mapped organic soil, and no cell has emissions without it.

**Other periods:**
- They sit behind a collapsed "Show all reporting periods" disclosure, with each row labelled by its period.
- When the disclosure is open, it shows: "Differences between periods must not be interpreted as measured local change: input coverage and timing can affect them; several infrastructure layers are static."
- No charts, arrows, percentage changes or trend calculations.

**Sources entry "Organic-soil emissions (modelled)":**
- Citation, DOI, licence and version, and the input hashes.
- The last-checked date and the review cadence (§5).
- What the numbers are: modelled period-average annual totals per 4° cell, from 1 km model outputs.
- What they are not: measurements, carbon stocks, trends or this year.
- What the incomplete footprint means.
- The paper's §4.5 limitations, in proportion: missed small and smouldering fires; no Tier 1 factor for tropical undrained peat fire; incomplete extraction coverage; no treatment of drainage age or rewetting; threshold choice as a first-order factor.
- The 2021–24 global sensitivity scenarios: emission factors only 1.50–3.97 Gt; combined envelope about 0.7–4.5 Gt. These are labelled as global scenarios, not local confidence intervals and not a percentage to apply to each cell.

## 1b. Optional globe layer (rev 3; GPT recommendation; for Chad's S1 choice)

The row answers "what does the model estimate for the cell containing this place?" The layer answers "where are the high and low cells?" It stays on the landing globe; there is no new tab.

- **Card:** "Organic-soil emissions (modelled)", **off by default** (bare-start rule). The table loads only when the layer is switched on or a place panel needs the row. The card's evidence label reads "Modelled", never "Observed".
- **Period:** fixed to the 2021–2024 annual average in the first preview; no period switch.
- **Component:** a two-way switch, drained or burned. No combined score.
- **What is drawn:** the same 4° cells as the data, through the existing cell-polygon path used by forest. No points, and no inferred hotspots within a cell.
- **Colour classes:** fixed decade bins in t CO₂e per year per **whole** cell (`soil_reference.BINS`), on one sequential palette, the same scale for both components. As built: one ochre hue, dark to light in OKLCH (`#6a3913 #925512 #b7761f #d49838 #e8bd6d #f7e3b0`), near-opaque fills (0.88) with thin dark cell edges. The lowest class is labelled "more than 0, below 1,000".

  | Bin (t CO₂e/yr per cell) | Drained cells | Burned cells |
  |---|---:|---:|
  | 0 assigned by the model (model zero) | 83 | 366 |
  | below 1,000 | 134 | 67 |
  | 1,000–10,000 | 133 | 71 |
  | 10,000–100,000 | 164 | 111 |
  | 100,000–1,000,000 | 138 | 96 |
  | 1,000,000–10,000,000 | 94 | 65 |
  | 10,000,000 or more | 44 | 14 |

  These are the counts from the real table, 2021–24. The bins are decades, not quantiles, so the scale does not move when the data changes. The colours themselves go to the preview for review against these counts.
- **Distinct states in the key and on the globe:**
  - **Model zero:** hollow, with an ochre outline, no fill. It never shares the look of unavailable.
  - **No organic soil mapped:** nothing drawn; the key says so.
  - **Unknown coverage (`none`):** the site's red "unknown" cell outline. There are none in v1.0.1. Unknown-only outlines do not count in the Key.
  - **Incomplete coverage:** a violet outline, kept for **values and zeros alike** (filled = a sum over the available raster cells; hollow = a 0 over them), so a partial sum is visibly partial. globe.gl strokes cannot be dashed, so the outline is solid (Iceland and the Canadian Arctic cells only in 2011–15 and 2016–20; in 2021–24 there are none, so the first preview shows the style only from a synthetic fixture).
  - **Table unavailable:** the card says "unknown — the soil table is not available" and nothing is drawn.
- **Legend (key line):** "Organic-soil emissions (modelled), 2021–2024 average, t CO₂e per year per whole 4° cell; Glen et al. 2026 v1.0.1." The card adds: "Cell totals, not intensity: 4° cells shrink towards the poles (a 70°N cell has about a third of the area of an equatorial one), so colours compare cell totals, not emissions per km²." No per-km² layer in the first preview.
- **Selection:** clicking a cell opens the cell inspector with the same text as the row (`soil_reference.display`), with its rows stacked so the figures get the panel's width, and draws a **white** selected-cell outline, which is new to the page. **The outline belongs to the layer:** it is drawn only while the layer is on, for the inspector and for the "Everything here" panel alike. With the layer off, the panel names the cell and its bounds in its "Selected" row and changes nothing on the globe (the place view's read-only rule; accepted by GPT, P1).
- **Key count:** the layer counts as one in "Key · N layers" while it draws a value or a model zero; unknown-only outlines and the selection outline do not count.
- **Not in the first preview:** a period switch, a per-km² view, a combined total, a separate tab, animation.
- **Reference:** `soil_reference.layer_class()` fixes the class of every cell, state and invalid input (controls H1–H6). The page must reproduce it.

## 2. Corrected derived table (Mac review copy only)

- **File:** `g4-soil-v1.0.1.json`; 684,135 B (42,939 B gzipped); sha256 `c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf`.
- **Contents:** 790 cells, all five periods.
- **Build:** `soil_build.py` ran on the workspace copies of the two verified downloads; 272 s; peak 1,629 MiB (Linux). No new download, and the rasters were not re-fetched.
- **Totals:** identical to rev 1 (raster sums; the exported 6-figure table sums agree within 7×10⁻⁷ relative, which is storage rounding): drainage 1.9922 / 2.0087 / 2.0026 / 2.0740 / 2.1491 and fire 0.6337 / 0.5972 / 0.6934 / 0.4808 / 0.5419 Gt CO₂e/yr. Conservation holds for every period and component, and nothing falls outside the world.
- **Controls:** `soil_controls.py` gives **75 passed, 0 failed** (§0a; the breakdown below is the rev 2 list of 58, before groups G and H were added).
  - A, weights (6): split overlap, negative coordinates, touching edges, aligned intervals, clipped coverage, outside bins.
  - B, synthetic end-to-end with real pyproj, scipy and matrix products (10): a 3 × 3 km raster across longitude 0° and the 2°N parallel, with hand-computed bin sums, NaN footprint, organic area, conservation and nothing outside.
  - C, fail-closed (8): infinite values, negatives, NaN extent, extent above 100, differing masks, wrong raster size and wrong units tag are each refused; good input is accepted.
  - D, every cell against the 24 Nov per-map outputs (14): listed set, flags, states, values, footprints and global sums.
  - E, named regressions and fixtures (10): `31_78`, `17_89`, `35_61`, `22_70`, `38_39`, `13_27` and `14_49`.
  - F, reference display text (10): states, unavailable, malformed, out-of-domain, coverage none, and two significant figures.
- **Not covered by the controls:** a full-size synthetic GeoTIFF through `open_checked` passing (the real inputs exercise the passing path), and the page code, which does not exist yet.
- **Superseded:** the rev 1 table `g4-cells-v1.0.1.json` stays in the review folder, preserved and marked superseded.

**Fixtures for the preview:**
- `22_70`: large values.
- `21_29`: small values.
- `38_39`: incomplete in 2011–15 and 2016–20; footprint 9.95 and 6.48 km²; burned is 0 over the available cells.
- `13_27`: mapped soil with model zeros.
- `31_78`: small-area regression (0.044 km²).
- `14_49`: unlisted, no organic soil.
- Synthetic `coverage: none` and malformed records.

## 3. Data path

**P1** is recommended: a pinned table in the repository, read by the page, with no hub and no R2. GPT supports it.
- Attribution is explicit.
- Changes are described.
- 1.0.1 stays kept when a newer version arrives.
- CC BY 4.0 reuse rests on the record's licence. The metadata was re-checked 25 Nov (`license.id: cc-by-4.0`). The licence file was read in full on 24 Nov; its manifest SHA-256 is `65d86603…4c9d`.

**P2** (R2 plus a hub route) offers no needed benefit here.

## 4. Release integration (for later; not started)

- **Shared files:** the preview touches `app.js`, `index.html` and `sources.html`.
- **Fresh main:** the release must keep Animals C1a and Timeline R4 on fresh main.
- **Animals check 13e:** it pins the precise Sources addition, so the next Nature context release needs a narrow, reviewed maintenance of that suite against the actual integrated baseline, not a blind `NC_MAIN` bump. `BASE_MAIN` is not moved to suppress failures.

## 5. Maintenance cadence

- **Who and what:** Claude, in this thread or its successor, checks with one GET of `https://zenodo.org/api/records/22137130/versions`. Record the total, each version, `is_last` and the file checksums.
- **When:** monthly while the 30 m open release is "being prepared", then quarterly, and on any erratum to the paper.
- **Last check:** 2026-11-25 07:51 UTC, browser pane: total 1, 1.0.1 latest; checksums unchanged.
- **Rules:** no automation has been created. An old check is never relabelled as current. A new version gets a diff of global and per-cell sums and states before any pinned data is replaced, and 1.0.1 is kept.

## 6. Prepared, not done: bounded tables check (needs Chad's go)

- **File:** `tabular_data_v1_0_1.zip`, the only file. 842,116 B; MD5 `2a4dd44b561d0e168b57856a9da2689a` (Zenodo); SHA-256 `3108fefee61dc190ec316c48a7bfd6598c5842896dc43795a1e82b2270e5f4a8` (manifest).
- **How:** downloaded through the browser pane to Downloads, as on 24 Nov. The two large files are not downloaded again.
- **Then:**
  1. Verify both checksums.
  2. List the four members.
  3. Read the five global summary rows in full.
  4. Compare like for like with the raster sums: period, component, unit, and whatever the readme and table say about masks and tabulation rules. The readme was read in full on 24 Nov; the rules are quoted from it again.
  5. Report the exact difference for each period and component.
- **If the 2011–15 gap (2.696 against 2.69) remains unexplained,** it comes back as a bounded decision. Neither the page nor this packet claims an exact reproduction of the paper; "close agreement" is the claim. The same applies to 1,145.5 against 1,144 Mha.
- **Cost:** none beyond the 842 KB download.

## 7. Decisions for Chad

- **S1** (revised in rev 3): the panel row (§1) **plus** the optional, off-by-default drained/burned 4° globe layer (§1b). *Recommended; GPT recommends this scope.*
- **S3** (cadence, §5): *Recommended; GPT supports.*
- **S2:** P1. *Recommended; GPT supports.*
- **T1:** the go for the tables check in §6.
- **S4:** the go for a fixture preview on a branch, with S1's scope. GPT supports a preview after these two fixes and the spatial revision. T1 can run alongside it, but must close before any release.
