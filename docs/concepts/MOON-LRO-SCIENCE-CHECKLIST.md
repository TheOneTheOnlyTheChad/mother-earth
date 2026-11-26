# Moon globe and LRO science — spec checklist

Rev 2 · 26 Nov 2026, 08:59 UTC (clock reading; rev 1 08:31 UTC) · written by Claude on Chad's instruction (26 Nov) · **persistent record; update it as each item moves** · docs only.

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
| 3 | Diviner temperature ("Recommended first feature", second paragraph) | **assessed; proposal rev 1 with GPT** (`docs/concepts/MOON-DIVINER-PROPOSAL.md`) |
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

## 3. Diviner temperature — assessed; proposal rev 1 with GPT for review

- **Brief asked:** a bounded Diviner example, either one documented map product or a short dated observation interval.
  - Keep channel brightness temperature apart from derived or bolometric temperature, and record local time, viewing geometry and aggregation.
  - No generic "Moon temperature now", and no apparent thermal response synchronised to the day/night control.
  - Check the `-9999` warning against the exact product. Missing is never 0 K.
- **Status (26 Nov, 08:59 UTC clock reading):** assessed, docs only, on Chad's go of 26 Nov. **Proposal `docs/concepts/MOON-DIVINER-PROPOSAL.md` rev 1** is with GPT for review. Nothing is built, nothing has been fetched in bulk, and nothing is deployed.
- **Evidence:** `docs/research/moon-lro-science/SAMPLES.md` §6 (product recheck, `tbol` definition, 12 new samples, multi-range test, archive MD5s, findings), `assess_diviner.py` and `assess_diviner_output-2026-11-26.txt`. Earlier reads are in SAMPLES §1 and §3.
- **Samples kept** (not committed; research stays text only):
  - on the Mac in `Documents/Mother Earth/_source-data/moon-lro-science-2026-11-26/`, with the new ones in its `diviner/` folder: seven GCP patches, two Level 3 TBOL and two Level 2 LTIM cycle maps at 4 ppd, three GHRM midnight 1° patches, and the SIS v1.21 PDF (read, not committed)
  - hashes in SAMPLES §3 and §6.3
- **Products checked:** GCP, GHRM, GDR Level 2/3 per-cycle maps, PCP, PRP, RCP, the derived bundle 2 (EPF) and the RDR. No newer GCP version exists; the derived bundle was last changed 2 Feb 2024.
- **Proposed (for GPT's review, then Chad's decisions D1–D7):**
  - GCP `tbol`, 2009–2015, two maps "around local noon" (11:30–12:30) and "around local midnight" (23:30–00:30)
  - each 0.5° cell = an unweighted mean of the available 15-minute bin values, with the bin count and spread in the readout
  - noon withheld poleward of 70°, midnight poleward of 80°
  - evenly lit; mutually exclusive with height; Moon tab only
  - route A: stream the 18 whole band files in the browser pane with archive-MD5 checks, after a one-file stop point
- **Key findings:**
  - `tbol` is the bolometric brightness temperature, computed per bin from the mean radiances of channels 3–9 (SIS v1.21 §8.1). The Paige 2010 definition sentence was read only in a third-party copy, labelled as secondary.
  - A 15-minute bin alone is patchy (15–18 of 96 bins empty in whole patches). A one-hour window fills all sampled cells at midnight and all but 7 + 1 + 1 of 1,400 at noon.
  - Within-window spread is 1–3 K at noon and 1–2 K at midnight at low and mid latitudes. It rises at high latitude (noon 10–20 K per row at 70–80°N; tens of K beyond 80°).
  - Dawn and dusk windows are not usable (spread 18–85 K mean).
  - The GHRM 2009–2022 midnight mosaic agrees with the GCP midnight window within 0.20–0.50 K at four cells.
  - Single 2016 cycle maps are sparse (4–6% of low-latitude cells by day, 20–36% by night), and local time drifts across the map.
  - Multi-range requests (8–128 ranges) returned every part exactly; overhead is about 143 B per part.
  - Label errors are recorded: the GCP DOI typo; the Level 3 TBOL unit and description text.
- **Missing-value rules (unchanged):** GCP `-9999` = empty bin and `-9998` = invalid, both shown as no value, never 0 K. The RDR 2019 `-9999` gap cannot affect the 2009–2015 GCP. Negative single-channel values are not displayed.
- **Not proposed now, with revisit conditions (proposal §10):** single mapping-cycle maps; GHRM high-resolution midnight; polar PCP; an RDR dated interval for 10–11 June 2026; dawn and dusk.
- **Blockers:** none. PDS is reachable only from the browser pane; that is a practical constraint.
- **Decision needed (Chad, after GPT's review):** D1 product, D2 window, D3 latitude limits, D4 acquisition route, D5 texture, D6 units, D7 spread in the readout. A build starts only on Chad's go; the release only on his own Approve line.

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

1. **Diviner:** assessment and proposal first, not a build. *(Done 26 Nov: proposal rev 1 with GPT.)*
2. Then the remaining items **one at a time**, in the order Chad chooses.

Suggested order (Claude's suggestion, for Chad to decide): LROC regional example (4), then the Sky Moon decision (10a), then CRaTER (5), LEND (6), LAMP (7) and Mini-RF (8). Pairing (9) and the options (12) are taken up only inside the item they serve or when Chad classifies them.

## Change log

- Rev 1 (26 Nov 2026, 08:31 UTC): created after the height release close-out, reconciled against the original brief.
- Rev 2 (26 Nov 2026, 08:59 UTC): §3 Diviner assessed and proposal rev 1 written (`docs/concepts/MOON-DIVINER-PROPOSAL.md`; evidence SAMPLES §6). Summary row 3 updated. No other item moved.
