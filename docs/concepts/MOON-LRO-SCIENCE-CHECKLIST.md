# Moon globe and LRO science — spec checklist

Rev 1 · 26 Nov 2026, 08:31 UTC (clock reading) · written by Claude on Chad's instruction (26 Nov) · **persistent record; update it as each item moves** · docs only.

**What this is.** The record of every item in GPT's original brief, `docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`. It also covers the scope Chad added on 26 Nov: every page that shows the Moon. It is **not** the narrowed height proposal (`docs/concepts/MOON-LRO-SCIENCE-PROPOSAL.md` rev 2.1), which covered only the first release.

**Rules for this checklist (Chad, 26 Nov):**
- **The Moon spec stays open** until every item below has a recorded outcome and Chad accepts its close-out.
- **Sun and Parker work waits until then.**
- **One item at a time.** Each approved implementation goes through assess → propose → GPT review → build and review → Chad's own release approval → deploy and verify → records and cleanup → next item.
- **"Not yet assessed" is never "infeasible".** Suitable sources are attempted first. An item is parked only when it is genuinely blocked, with the reason and the condition for revisiting it.
- **"Parked for the height release" means deferred from that release only.** It does not mean infeasible, and it does not mean permanently deferred.

**Status words used:** `done` (released or closed, with evidence) · `closed decision` (deliberately not changed; nothing left to do) · `next` (the next item to assess) · `to assess` (not assessed yet) · `partly assessed` · `option` (to classify, not an automatic build) · `outside scope` (needs Chad to expand the scope first).

## Summary

| # | Item (brief section) | Status |
|---|---|---|
| 1 | Existing all-round appearance, orientation, polar disclosure, lighting, dated LRO path ("Existing Moon view", "Existing LRO view", requirement 1) | **done: preserved** |
| 2 | LOLA elevation-first layer ("Recommended first feature", requirements 2–4) | **done: released and closed** |
| 3 | Diviner temperature ("Recommended first feature", second paragraph) | **next** (partly assessed) |
| 4 | LROC regional detailed imagery | to assess |
| 5 | CRaTER radiation | to assess |
| 6 | LEND neutron and hydrogen products | to assess |
| 7 | LAMP far-ultraviolet products | to assess |
| 8 | Mini-RF radar products | to assess |
| 9 | Science and trajectory pairing; observation footprints (requirements 5–7) | to assess, only where a selected example benefits |
| 10a | Sky zoom-out textured Moon (Chad's wider scope) | to assess and decide (separate round) |
| 10b | Tides Moon (Chad's wider scope) | **closed decision: unchanged** |
| 11 | Verification limits (requirement 8) | open record; carried with every item |
| 12a | Higher-resolution LOLA grids | option |
| 12b | Individual LOLA laser-return views | option |
| 12c | Terrain displacement (requirement 4) | option |
| 13 | Current LRO prediction or position | outside scope |

## 1. Existing appearance, orientation, polar disclosure, lighting, dated LRO path — done: preserved

- **Brief asked:** keep the all-round Moon picture, its orientation and its lower-resolution polar disclosure. Keep the default even lighting, the separate calculated "Lit as now" view and the dated LRO example (10–11 June 2026, one-minute samples, altitude above a 1737.4 km sphere, no current position). Derive no science from appearance pixels.
- **Status:** preserved through the height release.
  - `assets/moon/lroc_color_2k.jpg` is unchanged (`f7130a18…2170`, in the 42-file served manifest).
  - With height off, the page behaves as before. With height on, the lighting is locked to even and restored when height is switched off, under the state contract in proposal §4.3.
  - No readout is taken from the picture: the height readout comes from the separate LOLA grid.
- **Evidence:**
  - The four existing Moon suites passed unchanged on the release tree: `moon-globe` 67, `moon-lit` 138, `moon-lro-path` 68, `moon-light` 27 (`reviews/2026-11-26-moon-height-release-rc.md`).
  - GPT's preview review included an independent rendered desktop-browser check (`reviews/2026-11-26-moon-height-rc-gpt-review.md`).
  - GPT's release review compared retained files byte for byte (`reviews/2026-11-26-moon-height-release-rc-gpt-review.md`).
  - Live smoke after release (`reviews/2026-11-26-moon-height-release.md`).
- **Limits:** see item 11.
- **Next:** none. Any later item that touches `moon.html`, `moonglobe.js`, `moonlight.js` or `craft.js` must keep these suites green and move the Animals pins.

## 2. LOLA elevation-first layer — done: released and closed

- **Product:** LOLA `LDEM_4_FLOAT` V3.0.
  - Identifiers: PDS3 `LRO-L-LOLA-4-GDR-V1.0`; LIDVID `urn:nasa:pds:lro_lola_rdr:data_gridded:ldem_4_float::1.0`; DOI 10.17189/tnyt-7007.
  - Quantity: height relative to a 1737.4 km sphere on a 0.25° grid, from data taken 2009-07-13 to 2016-11-29.
  - Values north of 89.5°N are withheld ("inconsistencies were found in the source products").
- **Release:**
  - Merge `d6a26b6` of `moon-height-rc` at `afb42d5` (26 Nov 2026, 08:05:37 UTC commit time), on Chad's own Approve line. Page only; no hub change.
  - All 42 of 42 served files verified at 08:10:44 UTC.
  - Rollback: `git revert -m 1 d6a26b6`.
- **Reviews (all filed unchanged in `reviews/`):**
  - proposal rev 1 review: `2026-11-26-moon-lro-proposal-rev1-gpt-review.md`
  - rev 2 recheck: `2026-11-26-moon-lro-proposal-rev2-gpt-recheck.md`
  - preview review: `2026-11-26-moon-height-rc-gpt-review.md`
  - release review: `2026-11-26-moon-height-release-rc-gpt-review.md`
- **Packets:** `reviews/2026-11-26-moon-height-rc.md`, `reviews/2026-11-26-moon-height-release-rc.md`. Release record: `reviews/2026-11-26-moon-height-release.md`.
- **Source records:**
  - REGISTER entry "NASA PDS — LOLA gridded topography `LDEM_4_FLOAT`…" (marked live)
  - the `sources.html#moonheight` section
  - `assets/moon/lola/SOURCE.json`
  - evidence in `docs/research/moon-lro-science/` (`SAMPLES.md` §2 and §5, `assess_samples.py`, `measure_browser.cjs` and their outputs)
- **Accepted costs (Chad, 26 Nov):** a 2,578,646 B optional download on first use, and the extra polar-cap draw.
  - The download is the grid (1,776,231 B) plus the texture (802,415 B).
  - Idle draws per 5 s in the release-candidate run: height off 239, on 484.
- **Current served comparison:** `reviews/evidence/2026-11-26-moon-height-manifest.json` (42 files), checked with `node phase1/moonsci/served_manifest.mjs --check` (local tree) and `--pane` (live site). The Tides manifests stay as their release records.
- **Animals pins:** `MH_MAIN` `83f7c32` / `MH_PARENT` `97815dd` hold `moon.html`, `moonglobe.js` and `sources.html` (checks 13e, 13q–13s in `phase1/animals-tab-ui.test.cjs`).
- **Tests:** `phase1/moon-height-ui.test.cjs` (110; 12 deliberate breaks); build check `python3 phase1/moonsci/build_lola.py --check`.
- **Review cadence:** yearly and at each build, check for a newer version against the PDS errata and the LOLA Data Node. Last checked 26 Nov 2026.
- **Next:** none for this layer. Options in item 12.

## 3. Diviner temperature — next (partly assessed)

- **Brief asked:** a bounded Diviner example, either one documented map product or a short dated observation interval.
  - Keep channel brightness temperature apart from derived or bolometric temperature, and record local time, viewing geometry and aggregation.
  - No generic "Moon temperature now", and no apparent thermal response synchronised to the day/night control.
  - Check the `-9999` warning against the exact product. Missing is never 0 K.
- **Status:** partly assessed before the height release, then parked from that release only (GPT's recommendation, proposal §8, D4). Assessment resumes as the next item.
- **Real samples kept** (not committed: research stays text only):
  - on the Mac in `Documents/Mother Earth/_source-data/moon-lro-science-2026-11-26/`: `gcp_00n10n_rows0-19199.tab` (`b1f930da…ba97`) and `gcp_80n90n_rows0-19199.tab` (`9c1de725…6264`), 2,169,600 B each
  - also in the workspace `/home/claude/samples/` for this session only
  - URLs and byte ranges in `SAMPLES.md` §3
- **Product findings so far (SAMPLES §3):**
  - Product: Diviner Global Cumulative Product (GCP), `LRO-L-DLRE-5-GCP-V1.0`, bundle `urn:nasa:pds:lro_diviner_derived1` v5.0, DOI 10.17189/wj0s-w188 (Paige, Sullivan, Williams 2022). Method paper: Williams et al. 2017, Icarus 283.
  - Quantities: average calibrated channel brightness temperatures t3–t9 and the bolometric brightness temperature `tbol`, in K. These are brightness temperatures, not modelled physical or subsurface temperatures. Only `tbol` was proposed for display.
  - Period: all nadir observations, 5 Jul 2009 – 1 Apr 2015 (multi-year).
  - Binning: 0.5° × 0.5° × 0.25 h local time (96 bins). Longitude runs −179.75 to +179.75, a different convention from LOLA's 0–360. Row order: longitude slowest, local time fastest. 113 B per line (measured).
  - Size: 18 band files × 156,211,313 B = 2,811,803,634 B ASCII (from the directory listing).
- **Missing-value rules (recorded):**
  - The GCP `-9999` means an empty bin; `-9998` means invalid. Both are shown as missing, never as 0 K.
  - Negative channel values occur below a channel's sensitivity (label). They are not physical temperatures.
  - The RDR `-9999` warning covers RDR point records from 17 Apr 2019 only (the `tb` column). It cannot affect the 2009–2015 GCP, and it is kept apart from the GCP's own `-9999`.
- **Sample statistics:**
  - Equatorial patch: 39.8% of `tbol` bins empty. A single 15-minute bin is patchy: some hours have no values at all.
  - With a one-hour window (11:30–12:30 or 23:30–00:30), all 200 equatorial cells have values. The within-window spread is 3.29 K at noon and 0.85 K at midnight.
  - Polar patch (80–90°N): 7.5% empty, but the within-window spread is 26.6 K at noon and 11.8 K at midnight. Local time means little near the pole.
- **Acquisition estimates** (not measured as downloads):
  - Whole product: 2.81 GB, offline only.
  - A ranged fetch of one one-hour window (4 bins per cell) for the whole globe: 720 × 360 cells × 4 bins × 113 B ≈ **117 MB in 259,200 contiguous ranges**. Two windows: ≈ 234 MB.
  - The server answered single-range and two-range requests with 206 (SAMPLES §3). Behaviour with many ranges per request is untested.
  - The pane is the only route that reaches PDS (both shells get a 403), so any bulk fetch goes through the pane in pieces, or through another route to be found.
  - The published layer would be a small derived grid, like LOLA's. Its size is not yet estimated.
- **Unresolved decisions:**
  - which local time or times to show
  - window width
  - how to average: proposal §8 commits to an unweighted mean of available local-time-bin values, with a per-cell count of contributing bins and the missing share
  - a polar cut-off latitude or polar caveat
  - how coverage and gaps are shown
  - whether a dated RDR interval is preferable to, or additional to, the multi-year map
- **Next bounded assessment** (docs only):
  1. Recheck the Diviner archive for newer or better-suited derived products (newer GCP versions, other gridded or polar products) and read their labels.
  2. Fetch a few more bounded GCP patches: far side, mid-latitude, south polar. This tests coverage beyond the two equatorial and north-polar patches.
  3. Test a multi-range request to measure the ranged-fetch route.
  4. Estimate the derived grid size and build cost.
  5. Draft the display wording (brightness temperature, local-time window, compiled period, calculated sunlight kept separate).
  6. Return a Diviner proposal for GPT's review.
- **Blockers:** none known. The bulk-fetch route is a practical constraint, not a block.
- **Decision needed (Chad, after GPT's review):** the product and display form (map at chosen local times, or a dated interval), the acquisition route, and the accepted download and draw costs.

## 4. LROC regional detailed imagery — to assess

- **Brief asked:** a distinct zoom or region feature, showing each image's observation date, resolution and coverage. It cannot make the whole globe uniformly high-resolution, and it is not a prerequisite for the first release.
- **Status:** not assessed. No LROC product has been fetched (SAMPLES §4).
- **Evidence:** the brief's instrument table; no Claude read yet.
- **Next bounded assessment:**
  - Identify candidate LROC products in the PDS or LROC archive, for example a regional mosaic or a single dated detailed image of one well-known site. Product IDs are still to be confirmed.
  - Choose one bounded, useful example and record its identity, date, resolution, footprint, frame, rights and size.
  - Propose how a region view would sit beside the global picture without implying global detail.
- **Blockers:** none known.
- **Decision needed:** which example region, and whether a region view belongs on the Moon tab.

## 5. CRaTER radiation — to assess

- **Brief asked:** radiation measured at the spacecraft. Its spatial meaning differs from that of ground-looking instruments. Units, detectors and product interpretation must be assessed.
- **Status:** not assessed.
- **Evidence:** the brief's instrument table only.
- **Next bounded assessment:**
  - Identify the CRaTER products in PDS, for example dose-rate or energy-deposition records, and read one label.
  - Fetch one bounded sample (a short dated interval).
  - Record units, detectors, time base and what "where" means for a measurement made at the spacecraft.
  - Check whether an interval overlaps the dated LRO path (10–11 June 2026), which would allow honest pairing with the spacecraft position (see item 9).
- **Blockers:** none known.
- **Decision needed:** whether a spacecraft-environment display (time series, or values along the dated path) fits the Moon tab.

## 6. LEND neutron and hydrogen products — to assess

- **Brief asked:** neutron measurements and hydrogen-related products. A hydrogen inference is not direct confirmation of water ice, nor a quantity of accessible ice.
- **Status:** not assessed.
- **Evidence:** the brief's instrument table only.
- **Next bounded assessment:**
  - Identify the LEND products (count-rate maps and any derived hydrogen maps), read their labels and method notes, and fetch one bounded sample.
  - Record the resolution and the published interpretation limits, including any published scientific debate about the instrument's spatial resolution, cited from sources.
- **Blockers:** none known.
- **Decision needed:** whether to show a neutron or hydrogen-related map, and its wording.

## 7. LAMP far-ultraviolet products — to assess

- **Brief asked:** far-ultraviolet observations, including shadowed regions. A different spectral view, not ordinary visible-light photography.
- **Status:** not assessed.
- **Evidence:** the brief's instrument table only.
- **Next bounded assessment:** identify the LAMP map products (for example polar far-UV albedo maps), read the labels, fetch one bounded sample, and record wavelength band, coverage, polar extent and interpretation limits.
- **Blockers:** none known.
- **Decision needed:** whether a polar far-UV view fits, and its wording.

## 8. Mini-RF radar products — to assess

- **Brief asked:** radar observations and derived products. Signatures need product-specific interpretation: not every signal is ice.
- **Status:** not assessed.
- **Evidence:** the brief's instrument table only.
- **Next bounded assessment:** identify the Mini-RF products (for example global or polar mosaics and derived radar parameters), read the labels, fetch one bounded sample, and record wavelength, the quantity shown, coverage and the published interpretation limits.
- **Blockers:** none known.
- **Decision needed:** whether a radar view fits, and its wording.

## 9. Science and trajectory pairing; observation footprints — to assess, only where a selected example benefits

- **Brief asked (requirements 5–7):**
  - Spacecraft position, nadir point and detector footprint are different things. Use source footprints or enough pointing metadata, and never infer a footprint from the drawn marker.
  - For any pairing, verify the epoch, timescale and Moon-fixed frame against the definitive ephemeris.
  - Keep multi-year grids apart from individual pass records.
- **Status:** nothing paired; no footprint shown or inferred (proposal §9). The height layer is a multi-year grid, kept visibly apart from the dated path.
- **Rule carried forward:** pair only where a selected science example benefits **and** its actual time, frame and pointing are compatible. Science displays that are not synchronised remain valid on their own.
- **Lead to check, not a finding:**
  - Release 67 lists Diviner RDR data through 15 Jun 2026 and LOLA RDR through 13 Jun 2026 (SAMPLES §1). Those periods include the dated LRO example (10–11 June 2026).
  - Whether records with usable footprints exist for those days has **not** been checked.
- **Next bounded assessment:** only as part of the item it serves (Diviner, CRaTER or LOLA returns). Confirm the records for the interval, their footprint fields, timescale and frame.
- **Blockers:** none known.
- **Decision needed:** per item, if a pairing is proposed.

## 10a. Sky zoom-out textured Moon — to assess and decide (separate round)

- **Scope:** Chad's 26 Nov widening. Today the Sky zoom-out shows a plain grey sphere (`skyscene.js`, emissive `0x9a9a9a`) at true size and distance.
- **Status:** parked from the height release for its own round (proposal §7, D4). Not assessed beyond the rev 1 notes.
- **Starting point:** rev 1 option S1, noted in proposal §7.
  - Same picture, near side towards Earth.
  - Libration not shown.
  - Adds 457,942 B.
  - Needs new pixel tests.
- **Next bounded assessment:** confirm what the current Sky scene does on main, measure the cost, and state what S1 would and would not show. Then propose.
- **Blockers:** none known.
- **Decision needed (Chad):** whether to texture the Sky Moon at all, and in which form.

## 10b. Tides Moon — closed decision: unchanged

- **Status:** deliberately left unchanged (proposal §0 and §7). On Tides the Moon is a reference picture in a computed model of the tide mechanism.
- This is a closed decision, not an unfinished task. It reopens only if Chad asks.

## 11. Verification limits — open record, carried with every item

- **Not verified for the height release:** a real phone, Safari, a screen reader, and a verified hardware graphics renderer.
- **What was used instead:** headless Chrome with SwiftShader, at narrow widths 360, 390 and 721 px.
- **Keyboard:** the height button and readout were tested. Keyboard access to the polar cap is not claimed.
- **Rendering findings:**
  - The Moon globe redraws continuously while idle. Before the release it measured 216–269 draws per 5 s.
  - The height release adds about one draw per frame for the polar cap (release-candidate run: 239 off, 484 on).
  - Draw counts are not a measure of energy, CPU cost or perceived performance.
  - **Idle pausing was not delivered.** It remains a separate, later question for Chad (proposal §5). No release has claimed it.
- **Next:** record real-device checks separately whenever they are done. Every later item reports its own limits.

## 12. Options to classify — not automatic builds

| Option | What it is | Known facts | Decision needed |
|---|---|---|---|
| 12a Higher-resolution LOLA | finer gridded heights | `LDEM_16_FLOAT` V3.1 is 66,355,200 B; `LDEM_64_FLOAT` is 1,061,683,200 B (directory listing, SAMPLES §4); same data period | whether a finer grid is worth assessing (perhaps regionally, with item 4) |
| 12b Individual LOLA laser returns | point records (RDR) rather than a grid | not assessed | whether to assess, perhaps as the dated-pass example in item 9 |
| 12c Terrain displacement | raising the sphere's surface by height | brief: state the exaggeration and measure performance; excluded from the height release (proposal §9) | whether to assess at all |

Each stays `option` until Chad classifies it as "assess" or "not pursued", with a reason.

## 13. Current LRO prediction or position — outside scope

- The brief keeps current prediction out of scope "unless separately requested and validated". The page shows no current LRO position.
- This stays outside the Moon spec unless Chad separately expands the scope.

## Order of work (Chad, 26 Nov)

1. **Diviner:** assessment and proposal first, not a build.
2. Then the remaining items **one at a time**, in the order Chad chooses.

Suggested order (Claude's suggestion, for Chad to decide): LROC regional example (4), then the Sky Moon decision (10a), then CRaTER (5), LEND (6), LAMP (7) and Mini-RF (8). Pairing (9) and the options (12) are taken up only inside the item they serve or when Chad classifies them.

## Change log

- Rev 1 (26 Nov 2026, 08:31 UTC): created after the height release close-out, reconciled against the original brief.
