# Moon globe and LRO science — spec checklist

Rev 38 · 28 Nov 2026, 06:33 UTC (clock reading; rev 37 05:58, rev 36 05:21, rev 35 04:37, rev 34 04:09, rev 33 01:50, rev 32 27 Nov 21:02, rev 31 18:20, rev 30 16:37, rev 29 16:21, rev 28 14:50, rev 27 14:24, rev 26 11:52, rev 25 10:34, rev 24 10:18, rev 23 09:52, rev 22 09:34, rev 21 09:20, rev 20 06:43, rev 19 04:58, rev 18 03:25, rev 17 27 Nov 02:48, rev 16 26 Nov 21:05, rev 15 18:58, rev 14 17:49, rev 13 16:07, rev 12 15:54, rev 11 15:34, rev 10 15:07, rev 9 14:42, rev 8 13:07, rev 7 11:58, rev 6 10:22, rev 5 09:54, rev 4 09:42, rev 3 09:20, rev 2 08:59, rev 1 08:31 UTC) · written by Claude on Chad's instruction (26 Nov) · **persistent record; update it as each item moves** · docs only.

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
| 3 | Diviner temperature ("Recommended first feature", second paragraph) | **done: released and closed** (merge `0622e80`) |
| 4 | LROC regional detailed imagery | **done: released and closed** (merge `8e7d262`; Apollo 11) |
| 5 | CRaTER radiation | **done: released and closed** (merge `ba41c8a`; 10 June 2026 event-count chart) |
| 6 | LEND neutron and hydrogen products | **done: released and closed** (merge `25993bf`; south-polar archived-field record, 2011–2016) |
| 7 | LAMP far-ultraviolet products | **assessed: feasible; proposal rev 2 with GPT for recheck** (south-polar Lyman-α albedo, GDR V1.0; docs only) |
| 8 | Mini-RF radar products | to assess |
| 9 | Science and trajectory pairing; observation footprints (requirements 5–7) | to assess, only where a selected example benefits |
| 10a | Sky zoom-out textured Moon (Chad's wider scope) | **done and live** (release commit `1280c0d`, 27 Nov 2026; 51/51 served files match the reviewed manifest `15e96c52…`; later main has records only) |
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
- **Preserved again through the Diviner release (26 Nov, merge `0622e80`):**
  - `assets/moon/lroc_color_2k.jpg` unchanged, in the 44-file served manifest, matched live at 15:01:09 UTC.
  - One coordinator now serves height and temperature. Lighting is saved once on entry and restored on leaving: checked live in both cases (Lit off before entry stays off; Lit on before entry comes back on). The Earth view does not reopen by itself.
  - No readout comes from the picture: the temperature readout comes from the separate Diviner grid.
  - The four Moon suites passed on the release tree (`reviews/2026-11-26-moon-diviner-release-rc.md`; moon-lit 138/0 when run alone).
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
- **Served comparison at the height release:** `reviews/evidence/2026-11-26-moon-height-manifest.json` (42 files; kept as that release's record; superseded as the current comparison by the Diviner release's 44-file manifest, item 3), checked with `node phase1/moonsci/served_manifest.mjs --check` (local tree) and `--pane` (live site). The Tides manifests stay as their release records.
- **Animals pins:** `MH_MAIN` `83f7c32` / `MH_PARENT` `97815dd` held `moon.html`, `moonglobe.js` and `sources.html` at the height release (checks 13e, 13q–13s in `phase1/animals-tab-ui.test.cjs`); since the Diviner release the current pins for those files are `DV_MAIN` / `DV_PARENT` (item 3).
- **Tests:** `phase1/moon-height-ui.test.cjs` (110; 12 deliberate breaks); build check `python3 phase1/moonsci/build_lola.py --check`. *Erratum (26 Nov, 12:31 UTC): at the release code, breaks `late` and `nocache` matched nothing, so 10 of the 12 were established; see the erratum in `reviews/2026-11-26-moon-height-release-rc.md`, corrected on branch `moon-diviner-ui`.*
- **Review cadence:** yearly and at each build, check for a newer version against the PDS errata and the LOLA Data Node. Last checked 26 Nov 2026.
- **Next:** none for this layer. Options in item 12.

## 3. Diviner temperature — done: released and closed

- **Product:** Diviner Global Cumulative Product `LRO-L-DLRE-5-GCP-V1.0`, `tbol` (bolometric brightness temperature: an equivalent blackbody temperature, not the physical temperature of any one surface); bundle `urn:nasa:pds:lro_diviner_derived1` v5.0, DOI 10.17189/wj0s-w188; observations 5 Jul 2009 – 1 Apr 2015.
- **What the page shows:** two maps, "around local noon" and "around local midnight". Each 0.5° cell is our unweighted mean of the available quarter-hour bins within an hour of local noon or midnight, with the bin count and the range between bins. Noon is withheld poleward of 70° and midnight poleward of 80°, as our display policy. Scales are frozen at 281–395 K (noon) and 70–105 K (midnight), viridis, with clipping shown. Evenly lit; one science-mode coordinator shared with height; Moon tab only.
- **Release:**
  - Merge `0622e80` of `moon-diviner-ui` at `310ca1e` (26 Nov 2026, 14:50:35 UTC commit time), on Chad's own Approve line. Page only; no hub change.
  - All 44 of 44 files of GPT's reviewed manifest (`7bf9576a…`) matched on the live site at 15:01:09 UTC. Live layer check passed at 15:02:32 UTC (noon → midnight → height → off, from Lit off and from Lit on; readouts equal the served file).
  - Rollback: `git revert -m 1 0622e80`.
- **Reviews (all filed unchanged in `reviews/`):**
  - proposal rev 1 review `2026-11-26-moon-diviner-proposal-rev1-gpt-review.md`; rev 2 recheck `…-proposal-rev2-gpt-recheck.md`
  - first-band trial review `…-first-band-trial-gpt-review.md`; pane job v2 recheck `…-pane-job-v2-gpt-recheck.md`
  - global report review `…-global-report-gpt-review.md`
  - preview review `…-ui-gpt-review.md`; rev 2 recheck `…-ui-rev2-gpt-recheck.md`
  - release review `…-release-rc-gpt-review.md`
- **Packets and records:** first-band trial `reviews/2026-11-26-moon-diviner-first-band-trial.md`; global report `…-global-report.md` (with erratum); preview packets `…-ui-rc.md` (with errata) and `…-ui-rc-rev2.md`; release candidate `…-release-rc.md`; **release record `reviews/2026-11-26-moon-diviner-release.md`**.
- **Source records:** REGISTER entry "NASA PDS — LRO Diviner Global Cumulative Product (`tbol`)…" (marked live); the `sources.html#moontemp` section; `assets/moon/diviner/SOURCE.json`; evidence in `docs/research/moon-lro-science/` (SAMPLES §6, including Claude's Powell read §6.8; `diviner-acq/` checkpoints and tooling notes; `diviner-ghrm/` comparison).
- **Acquisition tooling and evidence** (from the not-for-merge branch `moon-diviner-trial`, now all on main byte for byte): `phase1/moonsci/diviner/` (streaming parser, hashing, pane job, references, tests, `global_report.py`, `trial_compare.py`, `ghrm_compare.py`) and `phase1/moonsci/build_diviner.py`. The 18 retained extractions stay on the Mac only (`_source-data/moon-lro-science-diviner-gcp/`); nothing binary from PDS is committed except the page file.
- **Accepted costs:** a 720,037 B optional download on first use of the temperature layer (the two maps are drawn in the browser from it).
- **Accepted deviation (Chad, 26 Nov):** checkpoints for 17 bands were written after the run. **Standing rule: future acquisitions write a durable checkpoint per band before proceeding.**
- **Known scientific caveat (on the page, in Sources, SOURCE.json and REGISTER):** at 10 sharp warm features our midnight value reads warmer than the GHRM mosaic (median +8.7 K); background sites agree within 0.05–0.82 K. Registration controls pass; the cause is not isolated. No correction applied.
- **Current served comparison:** `reviews/evidence/2026-11-26-moon-diviner-manifest.json` (44 files), checked with `node phase1/moonsci/served_manifest.mjs --check` (local tree). For the live site, build the expected list from the reviewed manifest file, not from a later tree (GPT, release review step 3).
- **Animals pins:** `DV_MAIN` `cc75407` / `DV_PARENT` `5efe200` hold `moon.html`, `moonglobe.js` and `sources.html` (checks 13e, 13t, 13u).
- **Tests:** `phase1/moon-diviner-ui.test.cjs` (178; 19 deliberate breaks), `phase1/moon-height-ui.test.cjs` (110; 12 breaks); every break must report its pattern found, and missing-pattern failures are counted apart from behavioural ones. Build check `python3 -I phase1/moonsci/build_diviner.py --ext <extractions> --check`.
- **Review cadence:** every six months and at each build, check for a newer GCP version or errata (REGISTER). Last checked 26 Nov 2026.
- **Carried wording note (GPT, release review):** Sources' "switching it off brings sunlight back" is shorthand for restoring the prior lighting choice. Fix it in the next documentation update that touches `sources.html`; the code is correct.
- **Not proposed for this display, with revisit conditions (proposal §11):** single mapping-cycle maps, single bins and dawn/dusk (a diurnal feature), GHRM high-resolution midnight, polar PCP, an RDR dated interval for 10–11 June 2026 (see item 9).
- **Next:** none for this layer. The history below is kept as it was written.

### History of item 3

- **Brief asked:** a bounded Diviner example, either one documented map product or a short dated observation interval.
  - Keep channel brightness temperature apart from derived or bolometric temperature, and record local time, viewing geometry and aggregation.
  - No generic "Moon temperature now", and no apparent thermal response synchronised to the day/night control.
  - Check the `-9999` warning against the exact product. Missing is never 0 K.
- **Update (15:07 UTC clock reading): released.** GPT's release review PASS (filed unchanged); Chad's own Approve line; merge `0622e80`; 44 of 44 served files at 15:01:09 UTC; live layer check passed; REGISTER live; branches `moon-diviner-ui` and `moon-diviner-trial` closed at close-out.
- **Update (14:42 UTC clock reading): release candidate with GPT for release review. Not merged, not deployed.**
  - **GPT's rev 2 recheck:** PASS; R1 closed (`reviews/2026-11-26-moon-diviner-ui-rev2-gpt-recheck.md`, filed unchanged). Chad's go for the release candidate.
  - **Branch `moon-diviner-ui`, final commit `310ca1e`:** fresh main `5efe200` merged in; release payload `cc75407`; Animals pins `8b233d9`; packet `reviews/2026-11-26-moon-diviner-release-rc.md`.
  - **Added:** `sources.html#moontemp`, the REGISTER entry, the page's "Details" link, the SOURCE.json review cadence, and the served manifest `reviews/evidence/2026-11-26-moon-diviner-manifest.json` (44 files).
  - **Validated on a frozen worktree at `8b233d9`:**
    - `moon-diviner-ui` 178/0, `moon-height-ui` 110/0, Animals 294/0, and 20 more suites green
    - 31 of 31 breaks caught, all with the pattern found (0 setup failures)
    - exceptions carried with main-baseline evidence: tides-ui T1a (branch scope); smoke-fixes, kept-ui, ux-round1, timeline-mixed-assets and osmc identical on main; moon-lit 138/0 when run alone
  - **Next:** GPT's release review; then Chad's own Approve line naming `310ca1e`; merge, then served-hash verification of the 44 paths and a live smoke.
- **Update (13:07 UTC clock reading): preview rev 2 with GPT for recheck. Not merged, not deployed.**
  - **GPT's preview review** (`reviews/2026-11-26-moon-diviner-ui-gpt-review.md`, filed unchanged): data and normal behaviour PASS; one fix required (R1: a timeout during an unabortable stage could still commit); the GHRM finding is corroboration, not a cause; wording corrections.
  - **GPT's global-report review** filed unchanged (`reviews/2026-11-26-moon-diviner-global-report-gpt-review.md`, PASS).
  - **Chad:** address R1 and the corrections; keep the frozen masks and scales.
  - **Done** (branch head `34368ee`, payload `1a842f9`, pins `3261682`, packet `reviews/2026-11-26-moon-diviner-ui-rc-rev2.md`):
    - the deadline ends the request; late results are released and never shown
    - focused tests G1–G4 pass 16/16; the breaks restoring the reviewed code fail 10 and 6
    - full suites: `moon-diviner-ui` 175/0, `moon-height-ui` 110/0, Animals 294/0
    - wording: equivalent blackbody temperature; GHRM caveat on the page, in the Sources line and in SOURCE.json; percentiles rounded outward; grid-cell shares; the appearance picture's 5 km
  - **Height records erratum** on main (`6d355d2`): breaks `late` and `nocache` matched nothing at the release code; 10 of 12 were established at release.
  - **Next:** GPT's recheck; then the release candidate on Chad's go.
- **Update (11:58 UTC clock reading): page preview built, with GPT for review. Not merged, not deployed.**
  - **Chad (26 Nov):**
    - accepted the disclosed checkpoint-timing deviation for D4b; **future acquisitions must write a durable checkpoint per band before proceeding**
    - froze the masks at 70° (noon) / 80° (midnight) and the scales at 281–395 K / 70–105 K
    - go for the page-only preview after Claude's Powell read
  - **Claude read Powell et al. 2023 §2.4–2.5** in full (SAMPLES §6.8); the explainer now rests on that read.
  - **Branch `moon-diviner-ui`:** payload `947dd14`, Animals pins `29bb0ee`, packet `reviews/2026-11-26-moon-diviner-ui-rc.md` (head `cdc9aed`).
    - page file 720,037 B gzip, built from the 18 retained extractions and byte-checked against the pane planes
    - one coordinator for height and temperature
    - `moon-diviner-ui` 157/0 with 17 of 17 breaks caught; `moon-height-ui` 110/0 with 12 of 12; Animals 294/0
  - **Finding for GPT:** at 10 high-contrast sites our midnight value reads a median 8.75 K warmer than GHRM; at 10 background sites the two agree within 0.05–0.82 K. Registration controls pass. Partly explained (radiance-first averaging); channel set and method are plausible further causes. Packet §4.
  - **Correction:** two of the released height suite's breaks (`late`, `nocache`) matched no code. Now fixed, and a missing pattern stops the suite (packet §6).
  - **Next:** GPT's review; then a release candidate (REGISTER, `sources.html#moontemp`, served manifest) on Chad's go; release only on his own Approve line.
- **Update (10:22 UTC clock reading): D4b done, all PASS.** GPT's v2 recheck passed pane_job-2 (filed unchanged, `reviews/2026-11-26-moon-diviner-pane-job-v2-gpt-recheck.md`). Chad's go for D4b.
  - The other 17 bands were fetched with tooling v2 (`83dc53a`), one at a time, 09:59:17–10:14:26 UTC. Every archive MD5 matched; the strict parse passed; the five kept sample ranges are byte-identical; each extraction is on the Mac and was re-hashed there.
  - Checkpoints: 18 lines; line 1 (band 00N–10N, v1) byte-identical. Lines 2–18 were written in one step after the 17th band, from evidence that was durable per band (disclosed in the report §3).
  - `global_report.py` (an independent numpy reduction) reproduces all 18 pane planes byte for byte from the retained extractions; a negative control fails.
  - **§6.4:** no valid data in 1.43% of shown noon cells and 0.70% of shown midnight cells. The noon range grows smoothly with latitude (no step at 70°). Midnight is tight to 80°. The range cap is never hit. Candidate scales: noon 281–395 K, midnight 70–105 K (about 1% clipped at each end).
  - Report: `reviews/2026-11-26-moon-diviner-global-report.md` on branch `moon-diviner-trial` `b918187`. With GPT and Chad.
  - **Next:** Chad's decisions on the masks and scales after GPT's review, Claude's read of Powell 2023 §2.4–2.5, and a separate go for the page build. No page build, merge or deployment.
- **Status (26 Nov, 09:42 UTC clock reading):** proposal rev 2 **passed** by GPT's recheck (`reviews/2026-11-26-moon-diviner-proposal-rev2-gpt-recheck.md`, PASS for the first-band trial, five implementation notes).
  - **Chad (26 Nov):** accepted D1, D2, D3, D5, D6 and D7 with GPT's notes. Chose **D8 (a)** (retain the lossless all-bin extraction on his Mac; browser downloads approved). Gave the go for **D4a only**.
  - **First-band trial 00N–10N: PASS.** The archive MD5 matched; the sample byte ranges are identical; the strict parse passed; the extraction and codes equal the independent reference on both sample patches; the extraction is stored on the Mac and re-hashed. Measured: 32.1 s, peak JS heap 41.9 MB, extraction 2.89 MB gzip.
  - Report: `reviews/2026-11-26-moon-diviner-first-band-trial.md` on branch `moon-diviner-trial` `3380aaf` (tooling and evidence; not for merge). Checkpoint: `docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl` on that branch.
  - **New against the samples:** the whole band has 0.85% of noon cells and 0.34% of midnight cells with no valid data.
  - **The download route works for one file per page;** a second automatic download did not arrive (base64 fallback used).
  - **D4b (the other 17 bands) waits** for Chad's go after GPT and Chad have the report. No page build, merge or deployment.
- **Update (09:54 UTC clock reading):** GPT's first-band review (`reviews/2026-11-26-moon-diviner-first-band-trial-gpt-review.md`).
  - **Data and numerical result: PASS.** GPT independently matched 38,400 sampled values and reproduced all 28,800 cell results and the plane hash.
  - **D4b: HOLD.** pane_job-1 could export a failed run's outputs, or a previous band's outputs after a later run failed early.
  - **Fixed in tooling v2:** pane_job-2, with 56 job-level tests, on branch `moon-diviner-trial` `83dc53a`; versions in `docs/research/moon-lro-science/diviner-acq/TOOLING.md`. With GPT for recheck.
  - Band 00n10n's evidence is unchanged; no new download.
- **Earlier status (09:20 UTC):** assessed, docs only.
  - **Rev 1** (`9be23dd`, fixes `caa00ab`) reviewed by GPT: **REVISE FIRST**, with the GCP product and the noon/midnight concept supported. Review filed unchanged as `reviews/2026-11-26-moon-diviner-proposal-rev1-gpt-review.md`.
  - **Rev 2** answers R1–R5 (proposal §14 maps each point) and is with GPT for recheck.
  - Nothing is built, nothing has been fetched in bulk, and nothing is deployed.
- **Rev 2 in short:**
  - **R1:** our statistic is named precisely: the unweighted mean of the available quarter-hour bin values. Range only for n ≥ 2, and never called uncertainty. "No valid data in this window". Three cell states distinct; the map cell is distinguished from the detector footprint.
  - **R2:** per-band durable checkpoints; a failed band is refetched whole; a streaming parser with a pinned, vector-tested MD5/SHA-256; memory measured in a first-band trial; no partial publishing. Retention is Chad's decision D8: (a) a lossless all-bin extraction, about 54–77 MB gzip (estimated), or (b) the two-window grid only.
  - **R3:** one science-mode coordinator. The lighting and Earth-view state is saved once on entry and restored for the current minute only on leaving. The previous map stays until its replacement has passed validation. Stale answers are discarded.
  - **R4:** strict parsing with our own 1–450 K plausibility bounds; a 64-byte header with offsets, codes and payload hash; whole-file validation in the page; fixed scales from valid displayed cells, with clipping shown; masks stated as display policy, and a global report before freezing.
  - **R5:** claims narrowed. The GHRM agreement is corroboration only; explicit index, origin and flip tests are planned. Cycle maps, single bins and dawn/dusk are described as unsuited to this display, with revisit conditions.
  - **Script:** `assess_diviner.py` rev 2 exits 1 on any hash, layout or value failure (eight break tests) and reads the Mac's two-folder layout.
  - **Sources:** Powell et al. 2023 is the primary source for the general definition. That is GPT's read; Claude reads §2.4–2.5 before any build (the fetch needed an approval that went unanswered on 26 Nov).
- **Evidence:** `docs/research/moon-lro-science/SAMPLES.md` §6 (product recheck, `tbol` definition, 12 new samples, multi-range test, archive MD5s, findings), `assess_diviner.py` and `assess_diviner_output-2026-11-26.txt`. Earlier reads are in SAMPLES §1 and §3.
- **Samples kept** (not committed; research stays text only):
  - on the Mac in `Documents/Mother Earth/_source-data/moon-lro-science-2026-11-26/`, with the new ones in its `diviner/` folder: seven GCP patches, two Level 3 TBOL and two Level 2 LTIM cycle maps at 4 ppd, three GHRM midnight 1° patches, and the SIS v1.21 PDF (read, not committed)
  - hashes in SAMPLES §3 and §6.3
- **Products checked:** GCP, GHRM, GDR Level 2/3 per-cycle maps, PCP, PRP, RCP, the derived bundle 2 (EPF) and the RDR. No newer GCP version exists; the derived bundle was last changed 2 Feb 2024.
- **Proposed (rev 2, for GPT's recheck, then Chad's decisions D1–D8):**
  - GCP `tbol`, 2009–2015, two maps "around local noon" (11:30–12:30) and "around local midnight" (23:30–00:30)
  - each 0.5° cell = our unweighted mean of the available quarter-hour bin values, with the bin count always shown and the range between bins only for two or more bins
  - noon withheld poleward of 70°, midnight poleward of 80°, as display policy
  - evenly lit; one science-mode coordinator shared with height; Moon tab only
  - route A: stream the 18 whole band files in the browser pane with archive-MD5 checks and per-band checkpoints, after a first-band trial (D4a), the rest on a second go (D4b); retention D8
- **Key findings:**
  - `tbol` is the bolometric brightness temperature, computed per bin from the mean radiances of channels 3–9 (SIS v1.21 §8.1). The Paige 2010 definition sentence was read only in a third-party copy, labelled as secondary.
  - A 15-minute bin alone is patchy (15–18 of 96 bins empty in whole patches). A one-hour window fills all sampled cells at midnight and all but 7 + 1 + 1 of 1,400 at noon.
  - Within-window spread is 1–3 K at noon and 1–2 K at midnight at low and mid latitudes. It rises at high latitude (noon 10–20 K per row at 70–80°N; tens of K beyond 80°).
  - Dawn and dusk windows are unsuited to a one-hour representative map (mean spread 18–85 K); that is real change, which a diurnal feature could show.
  - The GHRM 2009–2022 midnight mosaic agrees with the GCP midnight window within 0.20–0.50 K at four cells: corroboration only, not a registration proof.
  - Single 2016 cycle maps are sparse (4–6% of low-latitude cells by day, 20–36% by night), and local time drifts across the map.
  - Multi-range requests (8–128 ranges) returned every part exactly; overhead is about 143 B per part.
  - Label errors are recorded: the GCP DOI typo; the Level 3 TBOL unit and description text.
- **Missing-value rules (unchanged):** GCP `-9999` = empty bin and `-9998` = invalid, both shown as no value, never 0 K. The RDR 2019 `-9999` gap cannot affect the 2009–2015 GCP. Negative single-channel values are not displayed.
- **Not proposed for this display, with revisit conditions (proposal §11):** single mapping-cycle maps (a dated-pass feature); single bins and dawn/dusk (a diurnal feature); GHRM high-resolution midnight; polar PCP; an RDR dated interval for 10–11 June 2026.
- **Blockers:** none. PDS is reachable only from the browser pane; that is a practical constraint.
- **Decision needed (Chad, after GPT's recheck):** D1 product, D2 window, D3 masks, D4a go for the first-band trial and D4b go for the remaining 17 bands after its report, D5 texture, D6 units, D7 readout, D8 retention. A build starts only on Chad's go; the release only on his own Approve line.

## 4. LROC regional detailed imagery — done: released and closed (Apollo 11)

- **Released (27 Nov 2026):** merge `8e7d262` of `moon-lroc-ui` at `40e0f86`, on Chad's own Approve line, page only; no hub change. GPT's release review PASS (`reviews/2026-11-27-moon-lroc-release-rc-gpt-review.md`). All 50 files of the reviewed manifest (`reviews/evidence/2026-11-26-moon-lroc-manifest.json`, `cdd304f5…`) matched live at 02:44:57 UTC; live functional check passed (open and turn, ring, both views, pointer, close with focus and the camera kept). Release record `reviews/2026-11-27-moon-lroc-release.md`. Rollback `git revert -m 1 8e7d262`.
- **What the page shows:** an optional panel, "Show a detailed site: Apollo 11 (LROC)", in its own control row outside the globe controls (it works when the globe cannot start). It turns the globe to the site, marks it with a ring (a locator, not the footprint), and shows one dated NAC orthophoto (M150368601, 22 Jan 2011) at two scales: area 4 m (from 2 m, 2 × 2 rule, no data hatched) and site 0.5 m, with an optional pointer to the Lunar Module. Stretched for display; credit NASA/GSFC/Arizona State University.
- **Records:** REGISTER entry (live); `sources.html#moonlroc`; `assets/moon/lroc/SOURCE.json`; builder `phase1/moonsci/build_lroc.py`; evidence `docs/research/moon-lro-science/lroc/`; retained inputs on the Mac `_source-data/moon-lro-science-lroc/`.
- **Animals pins:** `LR_MAIN` `998df30` / `LR_PARENT` `d73a639` hold `moon.html` and `sources.html` (13e, 13v, 13w).
- **Tests:** `phase1/moon-lroc-ui.test.cjs` (78; 20 breaks). Build check `python3 -I phase1/moonsci/build_lroc.py --src <retained inputs> --check` (byte identity only in the pinned encoder environment).
- **Not verified:** real phone, Safari, screen reader, hardware renderer; HTML-layer CPU/layout cost.
- **Review cadence:** yearly and at each build, compare the PDS4 label versions and archive MD5s with `SOURCE.json`. Last checked 26 Nov 2026.
- **Other sites:** one at a time later, each with its own product check and landmark test, only if Chad asks. Nothing else is open for item 4.

### History of item 4

- **Brief asked:** a distinct zoom or region feature, showing each image's observation date, resolution and coverage. It cannot make the whole globe uniformly high-resolution, and it is not a prerequisite for the first release.
- **Chad's go (26 Nov):** docs-only assessment of one bounded, well-documented site; bounded downloads with a checkpoint per file; no merge or deployment.
- **Status (15:34 UTC, clock reading):** assessed for one site; proposal rev 1 `docs/concepts/MOON-LROC-REGION-PROPOSAL.md` for GPT's review. Nothing built.
- **Site and product:** Apollo 11 landing site. LROC NAC orthophotos of one observation, M150368601 L/R, 22 Jan 2011 20:48:53–20:49:11 UTC (PDS `lro-l-lroc-5-rdr`, Apollo 11 NAC DTM set), 0.50 m and 2.00 m a pixel, equirectangular, footprint 0.3146–1.2365°N, 23.3723–23.5115°E (about 4.2 × 28 km). Public domain as a PDS product; credit NASA/GSFC/Arizona State University (LROC terms read in full).
- **Evidence:**
  - checkpoints `docs/research/moon-lro-science/lroc/checkpoints.jsonl`: a 17,285,120-byte range of the 0.5 m file (`3a89ad5`) and the whole 2 m file, MD5 match (`2604505`)
  - three evidence views on the Mac in `_source-data/moon-lro-science-lroc/`, not committed
- **Findings:**
  - The LM's brightest pixel is 0.6 m (0.5 m product) and 2.0 m (2 m product) from LROC's published position (0.67416°N, 23.47314°E).
  - The globe picture is about 5.3 km a pixel, and one screen pixel is about 1.45 km at the closest zoom. So the link is a marker plus a separate dated panel, never a drape.
  - Proposed assets are measured at about 225 KB (site, 0.5 m) and 360 KB (area, 4 m), loaded on demand.
- **Host change noted:** `pds.lroc.im-ldi.com` now redirects to the PDS Imaging Node (`pds.mcp.nasa.gov`), with PDS4 labels v2.0. Only the browser pane reaches it.
- **Open:**
  - the frame of the orthophotos is not read from the RDR SIS (proposal §3); invisible at globe scale
  - source retention for the build: Downloads access was refused this session (proposal D5)
- **Update (15:54 UTC, clock reading): proposal rev 2 with GPT for recheck. Docs only.**
  - GPT's rev 1 review filed unchanged (`reviews/2026-11-26-moon-lroc-proposal-rev1-gpt-review.md`): concept and product supported; revise before build (R1–R4).
  - Chad: D1 Apollo 11, D2 both views, D3 pointer off by default, D4 camera left where it is on switch-off.
  - Rev 2 changes:
    - claims narrowed to local agreement at one landmark
    - pixel convention and the PDS4 x-sign settled by `phase1/moonsci/lroc/lroc_geom.py` (PASS; half-pixel limit in the 0.5 m product stated)
    - source-pixel checks by `phase1/moonsci/lroc/lroc_pixels.js` (outputs recorded byte-exact); 2 m test corrected to a local maximum
    - all five special codes, the 2 × 2 valid-count rule, dropped column 2,111, crop bounds, stretch and encoder
    - locator and Earth-view behaviour
    - honest checkpoints (lines 3–5, NOT RETAINED)
  - Open:
    - the volume RDR SIS read (frame); ME is supported by LROC's coordinate list and page and by a quoted SIS v1.2
    - D5 source retention: Downloads access refused twice by the automatic approval check; needs Chad to name the folder
    - D6: the 2 × 2 rule and no-data style
- **Update (16:07 UTC, clock reading): sources retained, frame closed, proposal rev 2.1. Docs only.**
  - Chad granted Downloads access and accepted D6.
  - Eight inputs retained on the Mac in `_source-data/moon-lro-science-lroc/`, each re-hashed and checkpointed before the next (retention lines 1–8).
  - Volume RDR SIS v1.6 (22 Aug 2020) read directly: §5.5 mean Earth/polar axis frame; §6.4 and both headers define the pixel-centre convention (k = 1).
  - **Error corrected:** the 2 m PDS3 header is two records (image at byte 8,444; the PDS4 label says 4,222), so the earlier pane 2 m figures were one line off. `lroc_source_check.py` on the retained files proves it and gives the corrected values (LM 2 m local maximum 0.95 m from the published point).
  - Report: `reviews/2026-11-26-moon-lroc-retention-frame-closure.md`.
- **Decisions:** D1–D6 all made. **Next:** GPT's recheck, then Chad's build go.
- **Update (17:49 UTC, clock reading): page preview with GPT. Branch only.**
  - GPT's rev 2 recheck and closure recheck filed unchanged (both PASS).
  - Chad's go for the page-only preview.
  - **Branch `moon-lroc-ui`:** head `a35a25b`, validated tree `1dc62c1`. Payload: `c99da22`, plus the `moonlroc.js` fix `3ed8f82`. Animals pins `ba9785c` (`LR_MAIN` `c99da22`).
  - Assets built from the retained inputs by `phase1/moonsci/build_lroc.py`: site 223,227 B, area 359,687 B, mask 6,002 B.
  - **Suites:** `moon-lroc-ui` 56/0 with 15 of 15 breaks caught; diviner 178, height 110, globe 67, LRO path 68, light 27, lit 138, Animals 296, all green.
  - WebGL draw calls per frame are unchanged (1 on, 1 off).
  - **A locator-visibility fault was found by a smoke run and fixed** (live-camera test).
  - **Packet:** `reviews/2026-11-26-moon-lroc-ui-rc.md` on the branch.
  - **Next:** GPT's review; then the release candidate (Sources, REGISTER, manifest, release pins) on Chad's go.
- **Update (18:58 UTC, clock reading): startup fix, preview rev 3. Branch only.**
  - GPT's preview review filed unchanged (`reviews/2026-11-26-moon-lroc-ui-gpt-review.md`, main `80eb098`): normal preview PASS; HTML locator and the 6-grey-level area tolerance accepted (Chad too); R1: opening the detail before the globe is ready lost the turn and could poll forever.
  - Fix `f4599d6` (`moonlroc.js` only): bounded, token-guarded wait (20 s); turn and locator together, once, when ready; off ends the wait; failure or deadline settles as "unavailable".
  - `moon-lroc-ui` 67/0 (new H1–H10, H7a); 19 of 19 breaks caught (new: noready, nodeadline, latestart, offwait); Animals 296/0 at `02d2f4a`. Disclosed: `eager` pattern updated, `offguard` replaced, one `ptr` harness stall.
  - Open for GPT: after a globe failure the page's existing behaviour hides the LROC button with the other controls, so an opened panel only closes on reload.
  - Packet rev 3 on the branch; Mac `_review/moon-lroc-ui/` refreshed (SHA256SUMS).
  - **Next:** GPT's recheck; then the release candidate on Chad's go.
- **Update (21:05 UTC, clock reading): release candidate with GPT. Branch only; not merged, not deployed.**
  - GPT's rev 3 recheck filed unchanged (`reviews/2026-11-26-moon-lroc-ui-rev3-gpt-recheck.md`, main `d73a639`): R1 PASS; keep the detail usable after a globe failure by moving the toggle out of the hidden globe controls. Chad's go for the release candidate.
  - **Branch `moon-lroc-ui`:** head `40e0f86` (packet `reviews/2026-11-26-moon-lroc-release-rc.md`), validated tree `9436b8e`; payload `998df30` (`LR_MAIN`), fresh main `d73a639` merged in (`1b1d30d`), Animals pins `9436b8e`.
  - Payload: the toggle in its own row outside `#mg-ctl`; `sources.html#moonlroc` and shortcut; the carried lighting wording fixed in the height and temperature sections; REGISTER entry; Details links; served manifest `reviews/evidence/2026-11-26-moon-lroc-manifest.json` (50 files); `moon-diviner-ui` H narrow maintenance.
  - **Validation:** 31 suites on `5eae783`, then the suites reading the two changed test files and all breaks on `9436b8e`: `moon-lroc-ui` 78/0 (J1–J3 new), Animals 296/0, Diviner 178/0, height 110/0, all others green; exceptions with main baseline (tides-ui T1a branch scope; timeline-mixed-assets 16/2 and osmc 40/1 identical on main); fire-status-ui 276/3 under load, 279/0 alone. 20 of 20 breaks caught (new `inctl`); `nofocus` tried and dropped as a no-op; two Animals pin controls caught.
  - Mac copy `_review/moon-lroc-rc/` (84 files, SHA256SUMS verified); the preview folder's spurious checksum line removed.
  - **Next:** GPT's release review; then Chad's own Approve line naming the final commit; merge, served check from the reviewed manifest, live check, records.
- **Other sites:** one at a time later, each with its own product check and landmark test.

## 5. CRaTER radiation — done: released and closed (27 Nov 2026)

- **Brief asked:** radiation measured at the spacecraft. Its spatial meaning differs from that of ground-looking instruments. Units, detectors and product interpretation must be assessed.
- **Chad's go (27 Nov):** assess one manageable archived product or short dated interval; docs-only proposal for GPT; keep spacecraft measurements distinct from lunar-surface conditions; assess pairing before proposing it; checkpoint each acquisition; no build, bulk acquisition, merge or deployment.
- **Status: done: released and closed.** Merge `ba41c8a` of candidate `6ed18c3` (27 Nov 2026, 14:44:27 UTC commit time), on Chad's own Approve line; page only, no hub change. 54 of 54 files of the reviewed manifest (`85cca2ad…`) matched live at 14:46:44 UTC; bounded live check passed 14:47–14:48 UTC. Release record `reviews/2026-11-27-moon-crater-release.md`; rollback `git revert -m 1 ba41c8a`. The history below is kept as it was written. Proposal `docs/concepts/MOON-CRATER-PROPOSAL.md` rev 2, evidence `docs/research/moon-crater/`.
- **Evidence (summary; details in the proposal):**
  - Product: PDS PPI bundle `urn:nasa:pds:lro-crater` v2.4 (logical identifier from the retained bundle XML; the Readme writes `lro.crater`; corrected at release on GPT's note), Release 67 (coverage to 2026-06-30). Level 2 secondary science, one record per second, 16,761,600 B a day.
  - Quantity: `GOOD`, events counted per ~1 s readout inside the instrument (checked against the primary-science event records: 674 of 674 seconds). Not a dose, not a flux, not a surface value. About 30 a second on 10–11 June.
  - Pairing (item 9): the records carry LRO's MOON_ME position from the definitive ephemeris. It agrees with the page's dated path to a median of 0.023–0.034 km (max 0.064–0.081 km over 1,440 of 1,441 minutes) once a 0.18–0.20 s tag offset is allowed for.
  - Signal: per-minute variation 1.17–1.35 times counting noise; no relation with altitude. A path colouring would show noise.
  - No archived dose for 2026 (the team's legacy dose table ends 2012; current team plots carry no stated terms). Two archive observations are recorded (a suspected flag label/column inconsistency in L2 PRI, not confirmed; no L2 housekeeping found where listed for 2026).
  - Acquisitions: four files, 38,695,835 B, each checkpointed before the next (`docs/research/moon-crater/checkpoints.jsonl`); retained on the Mac.
- **Recommendation (Claude):** R1, an off-by-default chart of 10-minute event rates for 10 June 2026 in the dated-example drawing, following its time control. R0 ("assessed, not shown") is a legitimate alternative.
- **Blockers:** none for R1. R3 (a computed dose) needs its own reading, resolution of the flag question and a bulk acquisition.
- **Decision needed:** Chad's D1–D7 after GPT's recheck. *(Made: D1–D5 and D7 accepted, below.)*
- **Update (10:34 UTC, clock reading): proposal rev 2 with GPT for recheck. Docs only.**
  - GPT's rev 1 review filed unchanged (`reviews/2026-11-27-moon-crater-proposal-rev1-gpt-review.md`): REVISE BEFORE BUILD (R1–R3); supports the 10-minute chart and D2–D5; reproduced the counts and the position comparison.
  - Chad: rev 2 addressing R1–R3, keeping the historical GOOD-event chart; no build, bulk acquisition, merge or deployment.
  - Rev 2: timing offset kept as a diagnostic hypothesis (nothing shifted); bins by UTC record timestamp `[start, end)`; a bin shown only with 600 nominal records (T = 600 s, no live-time correction), otherwise withheld (D7); the 11 June 00:00–00:10 bin labelled; bars are an approximate Poisson counting benchmark; origin, absence and noise claims withdrawn; flags a suspected inconsistency; dose wording narrowed.
  - New evidence: `bins_preview.py` (145 bins, all shown; 10 June sum 2,573,044; seven tamper cases behave as specified) and `assess_crater_5.py` (10 June 12:40–13:10 rise of 8–10%, with the thick singles, cause not determined).
- **Update (11:52 UTC, clock reading): page preview with GPT. Branch only; not merged, not deployed.**
  - GPT's rev 2 recheck PASS, filed unchanged (`reviews/2026-11-27-moon-crater-proposal-rev2-gpt-recheck.md`, on the branch), with build notes 1–4.
  - Chad's own go (confirmed in chat): accept D1–D5 and D7; page-only branch preview with GPT's build notes; retained sources; no acquisition, merge or deployment.
  - Branch `moon-crater-ui`, tested `d6f9a0f`, packet `reviews/2026-11-27-moon-crater-ui-rc.md` (head `10a05db`).
  - Builder `phase1/moonsci/build_crater.py` (fixed fields, hashes first, coverage and total asserts) with `test_build_crater.py` 28/0; asset `assets/moon/crater/crater-good-2026-06-10-R1.json` 3,908 B (`50ef3c0c…`); page `mooncrater.js`/`.css` in the dated-example drawing; `moon.html` wiring and Sources line.
  - `moon-crater-ui` 49/0 with 11 of 11 breaks; Moon suites, skycraft, tides, timeline green; `timeline-mixed-assets` 16/2 (main baseline); Animals 298/2 (13e, `moon.html` pins, moved at the release candidate).
- **Update (14:24 UTC, clock reading): release candidate with GPT for release review. Branch only; not merged, not deployed.**
  - GPT's preview review PASS, filed unchanged (`reviews/2026-11-27-moon-crater-ui-gpt-review.md`). Chad's go for the release candidate.
  - **Branch `moon-crater-ui`:** candidate `6ed18c3` (payload `4927a02` = `CR_MAIN`; fresh main `67a615c` merged in `b5f46f3`; Animals pins `6ed18c3`); packet `reviews/2026-11-27-moon-crater-release-rc.md` (head `dd7ea16`).
  - Added: `sources.html#mooncrater` (full benchmark qualification) and shortcut; Details links; REGISTER entry; served manifest `reviews/evidence/2026-11-27-moon-crater-manifest.json` (54 files, `85cca2ad…`); the bound described as a validation bound; `moon-diviner-ui` H narrow maintenance.
  - Validation on the frozen worktree: builder `--check` and tests 28/0; manifest 54 match; `moon-crater-ui` 51/0 with 11 of 11 breaks; Animals 304/0 with the four tamper breaks caught; Moon, craft, Sun and Sources-reading suites green; exceptions identical on main (timeline-mixed-assets 16/2, kept-ui 18/3, ux-round1 33/1, osmc 40/1); tides-ui T1a by design; night-lights-ui 152/0 alone after one load timeout.
- **Update (14:50 UTC, clock reading): released and closed.**
  - GPT's release review PASS, filed unchanged (`reviews/2026-11-27-moon-crater-release-rc-gpt-review.md`).
  - Chad: "Approve: release the CRaTER event-count chart from moon-crater-ui at 6ed18c3 to main, page only; no hub deployment."
  - Merge `ba41c8a` (main `05dc479` held three docs-only commits after the merge base, so a merge, not a fast-forward); the branch head's packet followed in a records-only merge of `cffec00`.
  - Served: 54/54 against `reviews/evidence/2026-11-27-moon-crater-manifest.json` (`85cca2ad…`), expected list taken from that file, at 14:46:44 UTC.
  - Live: off by default with no chart request; opening loads the one file; 12:00 selects group 72 (readout equals the served row); the final slider time selects the labelled extra 11 June group; close and reopen without a second request; the drawing stays usable; Details reaches `sources.html#mooncrater` (the first click showed this pane's cached pre-release Sources page, `max-age=600`; after refresh it reached the section).
  - REGISTER marked live, with the bundle identifier corrected to `urn:nasa:pds:lro-crater`. Branch `moon-crater-ui` deleted after verification. Raw sources and provenance kept.
  - **Records:** REGISTER entry "NASA PDS — LRO CRaTER Level 2 secondary science…" (live); `sources.html#mooncrater`; builder `phase1/moonsci/build_crater.py` (`--check`); asset `assets/moon/crater/crater-good-2026-06-10-R1.json`; tests `phase1/moon-crater-ui.test.cjs` (51; 11 breaks) and `phase1/moonsci/crater/test_build_crater.py` (28); Animals pins `CR_MAIN` `4927a02` / `CR_PARENT` `67a615c` (13e, 13aa, 13ab); evidence `docs/research/moon-crater/`; retained inputs on the Mac `_source-data/moon-lro-science-crater/`.
  - **Not pursued now, with revisit conditions (proposal):** a computed dose (R3: needs its own reading, the flag question resolved and a bulk acquisition); path colouring (the per-minute variation is near counting noise).

## 6. LEND neutron and hydrogen products — done: released and closed (28 Nov 2026)

- **Brief asked:** neutron measurements and hydrogen-related products. A hydrogen inference is not direct confirmation of water ice, nor a quantity of accessible ice.
- **Chad's go (27 Nov):** "Continue with Moon item 6: LEND, using the bounded assessment instructions already agreed. Start with archive documentation while folder access is being connected. Return a docs-only feasibility assessment and proposal for GPT review. Keep neutron measurements distinct from inferred hydrogen and accessible water ice. No page build, bulk acquisition, merge or deployment."
- **Status: done: released and closed.** Merge `25993bf` of candidate `5ed9d70` (28 Nov 2026, 01:44:38 UTC commit time), on Chad's own Approve line; page only, no hub change, no north acquisition. 55 of 55 files of the reviewed manifest (`4764f405…`) matched live at 01:47:03 UTC; bounded live check passed 01:47–01:48 UTC. Release record `reviews/2026-11-28-moon-lend-release.md`; rollback `git revert -m 1 25993bf`. The history below is kept as it was written.
  - **Records:** REGISTER entry "NASA PDS — LRO LEND averaged science product `lend_rdr_alds_20111211`…" (live); `sources.html#moonlend`; builder `phase1/moonsci/build_lend.py` (`--check`); asset `assets/moon/lend/lend-alds-2011-2016-R1.bin` (144,160 B, `9f185cc3…`); tests `phase1/moon-lend-ui.test.cjs` (83; 17 breaks), `phase1/moonsci/lend/test_build_lend.py` (436) and `break_build_lend.py` (9 mutants); Animals pins `LE_MAIN` `0db9f9f` / `LE_PARENT` `b67358d` (13e, 13ac, 13ad); served manifest `reviews/evidence/2026-11-27-moon-lend-manifest.json` (55 files); evidence `docs/research/moon-lend/`; review logs `reviews/evidence/2026-11-28-moon-lend-review-logs.tgz`; retained inputs on the Mac `_source-data/moon-lro-science-lend/` (rechecked).
  - **Follow-up (closed 28 Nov, see below):** at exact hundredth ties the readout's `toFixed(1)` rounds down (530 shown ± values read 0.1 lower and 456 percentages 0.1 nearer zero than half-away rounding of the stored values); within the frozen "rounded to 0.1" wording; the map colours are unaffected (release record).
  - **Follow-up update (04:09 UTC, 28 Nov):** GPT confirmed the counts and Chad gave the go: "Go: prepare a narrow LEND readout-rounding fix on a new branch…". Branch `moon-lend-rounding`, **candidate `f0c7625`** (payload `065b8b5`: integer half-away-from-zero formatting of both values; `moonsci.js` key; section R tests and breaks `tofixed`/`nohalfaway`; manifest `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json`, 55 files; Animals pins with 13ae/13af); packet `reviews/2026-11-28-moon-lend-rounding-rc.md` (head `cbb62ca`); Mac `_review/moon-lend-rounding/`. `moon-lend-ui` 89/0 with 19 of 19 breaks; all 11,656 shown readouts equal the oracle (and Python `Decimal` half-up); Animals 311/0; other suites green; exceptions identical on main `542b689`. Data, colours and withholding unchanged. With GPT for review; no merge or deployment.
  - **Rounding fix released (04:37 UTC, 28 Nov):** GPT's review PASS (signed zero kept as written), filed unchanged (`reviews/2026-11-28-moon-lend-rounding-gpt-review.md`). Chad: "Approve: release the LEND readout-rounding fix from `moon-lend-rounding` at `f0c7625` to main, page only; no hub or data change." Merge `4b646ea`; 55/55 served against the reviewed manifest (`943d243b…`) at 04:35:48 UTC; live: cell 1604 reads −0.8% ± 0.4 pp, the −0.85 tie reads −0.9%, toggle, layer and lighting behaviour unchanged. Record `reviews/2026-11-28-moon-lend-rounding-release.md`; rollback `git revert -m 1 4b646ea`. **Follow-up closed.** Current served manifest: `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json`; Animals pins `RD_MAIN` `065b8b5` / `RD_PARENT` `542b689` (13e, 13ae, 13af); `moon-lend-ui` 89 checks, 19 breaks.
  - **Not pursued now, with revisit conditions (proposal rev 2):** north pole (one more bounded file, on Chad's go); a newer map from DLD (a bulk acquisition); a hydrogen or WEH map (L3, not proposed).
- **Earlier status: partly assessed (16:21 UTC, clock reading).** Proposal `docs/concepts/MOON-LEND-PROPOSAL.md` rev 1; evidence `docs/research/moon-lend/`; retained on the Mac in `_source-data/moon-lro-science-lend/`.
- **Superseded rev 1 summary (kept as written; GPT's rev 2 recheck note 4).** The bullets from here to "Decision needed" describe rev 1. Where they differ from rev 2 — the unrestricted noise claim (rev 2 §6.2 restricts it to one ring and one statistic), "30 km" smoothing (rev 2: a 30 km **radius**, 60 km diameter), "signal" (rev 2: descriptive differences in stored values), "count rate" (rev 2: the archived `CSETN_RATE` field, meaning unresolved) and the north-pole D2 (rev 2 D9: not now) — rev 2 and the updates below govern.
- **Evidence (rev 1 summary; superseded where noted above):**
  - Archive: PDS Geosciences Node bundle `urn:nasa:pds:lro_lend` v2.0 (DOI 10.17189/p89b-8w72), Release 67. Collections: raw, reduced, derived (DLD/DLX to 2026-03-14) and **averaged (ALD): six gridded maps** (south pole, north pole, equatorial; 2009-09-15 to 2011-12-11 and 2011-12-11 to 2016-09-14). ALD last updated in Release 29 (2017); not included in any of releases 30–67. **No hydrogen or water product in the bundle.**
  - Sample: `lend_rdr_alds_20111211.dat` (4,464,000 B, sha256 `e6b1c2d5…0031ef`), plus 19 documents and labels in one JSON (1,095,765 B); checkpoint per file.
  - Quantity: `CSETN_RATE`, the collimated epithermal count, 0.5° cells, 80–90°S, one 2011–2016 average. Only CSETN and STN1 hold data in this file. 987 cells missing (−1; all of 89.75°S). Per-cell relative error median 3.8%; cell-to-cell differences at 0.5° match counting noise.
  - Signal: 30 km averages near Cabeus, Shoemaker and Faustini are 0.8–1.0% below same-latitude controls (2.0–3.4 control sd); Haworth −0.6% (−1.1); Amundsen none.
  - Two document inconsistencies recorded, not resolved: what the stored number is (catalog "unitless" vs values of about 4.9, counts-per-second magnitude), and whether a spacecraft background is subtracted.
  - Resolution: published and unresolved dispute, from 5–10 km (team documents) and a 30 km footprint (McClanahan et al. 2023) to at least an uncollimated detector's footprint (Eke et al. 2012; Teodoro et al. 2014).
- **Recommendation (Claude):** L1, an optional polar map of the archived CSETN count rate as percent difference from the same pole's 80–85° band, 30 km display smoothing (our choice, not the instrument's resolution), withholding by counting error; wording keeps neutron measurement, inferred hydrogen and water ice apart. L0 ("assessed, not shown") and L2 (a crater readout) are legitimate. A hydrogen or WEH map (L3) is not proposed.
- **Blockers:** none for L1 (south pole). North pole needs one more bounded file on Chad's go (D2). A newer map from DLD would be a bulk acquisition.
- **Decision needed:** Chad's D1–D7 after GPT's review. *(Superseded by rev 2: D1–D9.)*
- **Update (16:37 UTC, clock reading): proposal rev 2 with GPT for recheck. Docs and focused evidence only.**
  - GPT's rev 1 review filed unchanged (`reviews/2026-11-27-moon-lend-proposal-rev1-gpt-review.md`, sha256 `1859291c…`): REVISE BEFORE BUILD; feasibility supported; reference mean, formal error, counts and disc means reproduced independently.
  - Chad: address R1–R3 in rev 2; docs and focused evidence only; no new acquisition, build, merge or deployment.
  - R1: the quantity is the relative difference in the archived `CSETN_RATE` field; the archive's contradiction (unitless ratio / relative rate / counts per second; background) is stated, not resolved; no raw value or unit; hydrogen context from McClanahan et al. 2024 (PSJ 5:217, arXiv v5) read in full for §1–1.3; "top metre" removed; resolution sources versioned.
  - R2: "real signal" withdrawn; crater comparisons descriptive; the ± figure is a formal counting-error estimate conditional on independent archive errors. Reference and covariance propagated (`preview_lend_4.py`): differs from the rev 1 benchmark by −0.003 to +0.005 pp; 10 of 13,413 cells change state at 0.5 pp; a Monte Carlo check of the formula passes (`check_lend_4.py`).
  - R3: 30 km **radius** (60 km diameter) everywhere; geometry, four display states, notation, readout, served schema and a focused build/test plan frozen; edge-truncated discs (1,440 cells at 80.25° and 80.75°S) proposed withheld.
  - Next: GPT's recheck, then Chad's D1–D9 and a separate build go.
- **Update (18:20 UTC, clock reading): page preview `moon-lend-ui` with GPT. Branch only; not merged, not deployed; no hub change; no north acquisition.**
  - GPT's rev 2 recheck PASS, filed unchanged on the branch (`reviews/2026-11-27-moon-lend-proposal-rev2-gpt-recheck.md`, sha256 `aeb13324…`), with build notes 1–4.
  - Chad: "Accept D1–D9 as recommended in LEND proposal rev 2. Build a page-only south-polar LEND branch preview, carrying GPT's recheck build notes. Return the preview and evidence for GPT review. No north acquisition, merge, deployment or hub change."
  - Branch `moon-lend-ui`, tested `cd3a9b6` (builder `263b8d5`), packet `reviews/2026-11-27-moon-lend-ui-rc.md` (head `b1b8164`); Mac `_review/moon-lend-ui/`.
  - Builder `phase1/moonsci/build_lend.py` → `assets/moon/lend/lend-alds-2011-2016-R1.bin` (144,160 B, `9f185cc3…`): shown 11,656 / missing 987 / withheld error 317 / withheld edge 1,440 (= GPT's independent counts). `test_build_lend.py` 436/0; mutation runner 9 of 9 caught.
  - Page: LEND as a third layer in the existing science coordinator (`moonsci.js`); appearance picture with the cap painted over; four states; readout and legend wording per D7; `moon.html` controls and Sources line.
  - `moon-lend-ui` 77/0 with 16 of 16 breaks (three first-version breaks fixed and disclosed); Moon, Sky and craft suites green; Animals 301/3 (13e `moon.html` pins, moved at the release candidate).
  - Rev 1 summary above marked superseded (GPT's note 4).
  - Next: GPT's preview review; then the release candidate (Sources `#moonlend`, REGISTER, narrow Animals pins, served manifest, final validation) on Chad's go; release only on his own Approve line.
- **Update (21:02 UTC, clock reading): release candidate with GPT for release review. Branch only; not merged, not deployed; no hub change; no north acquisition.**
  - GPT's preview review PASS, filed unchanged on the branch (`reviews/2026-11-27-moon-lend-ui-gpt-review.md`, sha256 `d1085fe8…`), with one required fix (NaN reference values accepted by the header check) and RC notes.
  - Chad: "Go: build the page-only LEND release candidate, including GPT's header-validation fix and RC notes, Sources, REGISTER, narrow Animals pins, served manifest and final validation. Return the exact commit for GPT release review. No merge, deployment, north acquisition or hub change."
  - **Branch `moon-lend-ui`: candidate `5ed9d70`** (Animals pins; payload `LE_MAIN` `0db9f9f`; fix `f8ef429`; main `b67358d` merged in `dabb825`); packet `reviews/2026-11-27-moon-lend-release-rc.md` (head `7f851cc`); Mac `_review/moon-lend-rc/` (84 files, SHA256SUMS).
  - Fix: the two float64 reference values must be finite before the 1e-9 test; NaN/Infinity tests with matching outer pins; NaN refused while height is shown, map unchanged; break `nofinite` fails 4.
  - Added: `sources.html#moonlend` and shortcut; Details link; REGISTER entry (release candidate); served manifest `reviews/evidence/2026-11-27-moon-lend-manifest.json` (55 files, `4764f405…`); Animals pins `LE_MAIN` / `LE_PARENT` with 13ac, 13ad and four tamper breaks; `moon-diviner-ui` H narrow maintenance; `moonsci.js` comment; runner exit capture fixed.
  - Validation on frozen `5ed9d70` (19:05–20:53 UTC): builder `--check`, tests 436/0, mutants 9/9; `moon-lend-ui` 83/0, 17 of 17 breaks; Animals 308/0 with nine tamper breaks caught; Moon, Sky, craft, Sun and Sources-reading suites green; exceptions run on main `b67358d` the same evening and identical (timeline-mixed-assets 16/2, kept-ui 18/3, ux-round1 33/1, osmc crash, smoke-fixes); tides-ui T1a by design.
  - Next: GPT's release review; then Chad's own Approve line naming `5ed9d70`; merge, served check from the reviewed manifest, live check, records.
- **Update (01:50 UTC, 28 Nov, clock reading): released and closed.**
  - GPT's release review PASS, filed unchanged (`reviews/2026-11-28-moon-lend-release-rc-gpt-review.md`, sha256 `232e9859…`).
  - Chad: "Approve: release the Moon south-polar LEND record from moon-lend-ui at 5ed9d70 to main, page only; no hub deployment or north acquisition."
  - Merge `25993bf` (main `90c457e` held only my docs commit since the candidate's base); the branch head's packet followed in a records-only merge `a46d218`.
  - Served: 55/55 against the reviewed manifest file (`4764f405…`) at 01:47:03 UTC. Live: off by default, open with one file request, pole and centre readouts, all five readout states, height switch and re-entry without a second request, prior lighting restored, Details reaches the section.
  - REGISTER marked live. Branch `moon-lend-ui` deleted after verification. Raw sources and provenance kept.

## 7. LAMP far-ultraviolet products — assessed: feasible; proposal rev 2 with GPT for recheck (28 Nov 2026)

- **Brief asked:** far-ultraviolet observations, including shadowed regions. A different spectral view, not ordinary visible-light photography.
- **Status:** assessed, docs only. Proposal `docs/concepts/MOON-LAMP-PROPOSAL.md` rev 1 is with GPT for review. No page build, bulk acquisition, merge, deployment or hub change.
- **Chad's go (28 Nov):** "Continue with Moon item 7: LAMP. Start with archive documentation, then assess one suitable product and a small, bounded sample. … No page build, bulk acquisition, merge, deployment or hub change."
- **Product:**
  - PDS Imaging Node, LRO-L-LAMP-5-GDR-V1.0 (volume LROLAM_2001, released 15 Mar 2011, DOI 10.17189/1520244). This is the only archived map volume; the 2024 PDS4 bundle is raw and calibrated data only;
  - the sample is the south-polar cumulative Lyman-α albedo (dimensionless) with its quality and signal-to-noise maps;
  - 240 m per pixel, polar stereographic, 80–90°S, night side, Sept 2009 – Sept 2010;
  - frame: Mean Earth/Polar Axis of DE421.
- **Acquired and retained (each checkpointed before the next):** four files, 76,899,531 B: a documents JSON (37 items as exact bytes) and three 25,020,004 B maps, all MD5-matched to the archive's own list. Mac `_source-data/moon-lro-science-lamp/`; evidence `docs/research/moon-lamp/`.
- **Findings:**
  - inside 80°S, 98.9% of pixels are finite and flagged good;
  - the "error" maps are signal-to-noise, settled by data (flag 2 = SNR < 3 on all 53,013 pixels);
  - quality flag 1 does not mark NaN, and value 5 is undocumented;
  - the Lyman-α band edges and the dates disagree between the archive documents (recorded, unresolved);
  - the albedo depends on a modelled illumination the archive does not describe.
- **Orientation finding:** read as printed, the map is mirrored top to bottom. An independent test against the released LOLA heights puts reading B first by 1,244.8 m. The build must carry reading B and repeat the check; a finer 240 m check is offered to Chad (D6).
- **Recommended (for Chad after GPT):** L1, a globe layer like LEND from a 960 m grid (about 244 kB); L2, a polar panel, is an option. The off/on "H2O absorption feature depth" ratio is not proposed. No ice, frost or water and no cause for the darkness on the page.
- **GPT's rev 1 review (28 Nov):** `reviews/2026-11-28-moon-lamp-proposal-rev1-gpt-review.md`: REVISE BEFORE BUILD, feasible, R1–R4. Chad asked for rev 2 with focused evidence; no new acquisition.
- **Rev 2 (06:33 UTC):**
  - band-edge footnote applied (125.57 nm explained);
  - the quantity named as Mother Earth's 960 m average of illumination-model-dependent archive estimates; Gladstone et al. (2012) §1–2 read;
  - orientation wording narrowed: reading B agrees with DSMAP's prose and the coarse diagnostic (codes 4 and 6, two baselines, 1,574 distinct LOLA cells); not a 240 m registration;
  - finer check specified (LOLA `LDEM_75S_240M`, 29.1 MB, D6);
  - texture corrected to 2880 × 1440; padded 2504 grid with explicit origin (pole at 312.125);
  - uint16 thousandths plane (233,132 B gzip) replacing the 8-bit route; states S0–S5;
  - outlier policy P1 retain-and-disclose recommended, P2 costed (D8).
- **Decisions needed:** D1–D8 (proposal §10), after GPT's recheck.

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
- **Status:** nothing paired; no footprint shown or inferred (proposal §9). The height layer (2009–2016) and the temperature layer (2009–2015) are multi-year grids, kept visibly apart from the dated path; both say they are not measured at the spacecraft position shown.
- **Rule carried forward:** pair only where a selected science example benefits **and** its actual time, frame and pointing are compatible. Science displays that are not synchronised remain valid on their own.
- **Lead to check, not a finding:**
  - Release 67 lists Diviner RDR data through 15 Jun 2026 and LOLA RDR through 13 Jun 2026 (SAMPLES §1). Those periods include the dated LRO example (10–11 June 2026).
  - Whether records with usable footprints exist for those days has **not** been checked.
- **Next bounded assessment:** only as part of the item it serves (Diviner, CRaTER or LOLA returns). Confirm the records for the interval, their footprint fields, timescale and frame.
- **Blockers:** none known.
- **Decision needed:** per item, if a pairing is proposed.

## 10a. Sky zoom-out textured Moon — done and live (27 Nov 2026)

- **Scope:** Chad's 26 Nov widening. Today the Sky zoom-out shows a plain grey sphere (`skyscene.js`, emissive `0x9a9a9a`) at true size and distance.
- **Status: done and live.** Release commit `1280c0d`; served manifest `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json` (51 files); Animals pins `SK_MAIN` `bc0afd0` / `SK_PARENT` `018102c` (13b, 13x, 13e Sky, 13y, 13z); suite `phase1/sky-moon-texture-ui.test.cjs` (197; 17 breaks); handover `reviews/2026-11-27-moon-sky-texture-handover.md`. The history below is kept as it was written.
- **Earlier status (before 27 Nov):** parked from the height release for its own round (proposal §7, D4).
- **Starting point:** rev 1 option S1, noted in proposal §7.
  - Same picture, near side towards Earth.
  - Libration not shown.
  - Adds 457,942 B.
  - Needs new pixel tests.
- **27 Nov 2026 (Chad's go: assess using the existing Moon appearance texture; docs only):** assessed; proposal rev 1 `docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md`, evidence `docs/research/moon-sky-texture/`. Findings:
  - **Size:** on unchanged main the Moon's radius at stop B is 1.3–5.2 CSS px (360–1920 px wide, three dates); at stop C 0.5–1.7 px; at stop A it is outside the frame.
  - **Viewing direction:** at stop B the camera sees it 36–121° from the Earth–Moon line, so the visible disc is often half or more far side.
  - **Orientation:** the true orientation (libration included) can be derived from the sunlight table already served for "Lit as now" plus the Sky scene file (two-direction fit). Against astronomy-engine's IAU model over all 579 dates: median 0.004°, 95% 0.027°, max 0.29° (near new Moon); three breaks caught. S1 rejected (its roll would be invented).
  - **Proposed:** T-orient, evenly lit (L1, no phase), loaded only on entry, pinned, never blocking, grey on any failure; +540,272 B on first entry; no new data, no hub change.
  - "Not pursued" is offered as a legitimate outcome (D1).
- **Blockers:** none known.
- **27 Nov (later):** GPT's proposal review PASS with notes 1–6 (`reviews/2026-11-27-moon-sky-texture-proposal-rev1-gpt-review.md`). Chad accepted D1–D6 and gave the go for a page-only preview.
  - Branch `moon-sky-texture-ui`, candidate `c132f46`; packet `reviews/2026-11-27-moon-sky-texture-ui-rc.md`.
  - New suite `sky-moon-texture-ui`: 96/0; 13 of 13 breaks caught.
  - Orientation against astronomy-engine 2.1.19: 0.003–0.29° on four dates. Rendered brightness at stop B: +19–21% over the grey.
  - Regressions clean, except the Animals 13b/13c pins, expected for the release candidate.
- **27 Nov (R1):** GPT's preview review held for R1 (placement errors not contained). Fixed in `6ba15ac`, with focused tests; candidate `ceb6dc8`, with GPT for recheck.
- **27 Nov (RC):** GPT's R1 recheck PASS. On Chad's go, the release candidate was built: Sources `#sky-scene`, both REGISTER extensions, Animals pins (13b, 13c, 13e Sky, 13x–13z; six tamper breaks caught), and the new served manifest (51 files, adds the sunlight table).
  - Packet: `reviews/2026-11-27-moon-sky-texture-release-rc.md`.
  - Validation on frozen `4c8aecd`: texture 197/0, Sky 351/79/77, Animals 300/0, night lights, tides-nav, desktop-overflow, Moon temperature all clean.
  - `smoke-fixes` stops identically on unchanged main (not this change).
- **27 Nov (released):** GPT's release review PASS. Chad: "Approve: release the Sky zoom-out Moon picture from `moon-sky-texture-ui` at `1280c0d` to main, page only; no hub deployment." Main was fast-forwarded to `1280c0d` at 09:31:52 UTC; 51/51 served files match the reviewed manifest; the bounded live check passed. Record: `reviews/2026-11-27-moon-sky-texture-release.md`. **Closed.**

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
- **Diviner release (26 Nov):** the same four checks are still not done (real phone, Safari, screen reader, verified hardware renderer). Used instead: headless Chrome with SwiftShader at narrow widths (minor scale ticks hidden below 520 px, tested), the browser pane on the live site for the functional layer check. Keyboard: the temperature button, mode radios, centre-read button and readout were tested. The extra polar-cap draw belongs to height only (`h.cap(target === 'height')`); the temperature layer adds none. Its draw cost was not measured separately.
- **LROC release (27 Nov):** the same four checks are still not done. Used instead: headless Chrome with SwiftShader (desktop and 360 px, keyboard path to the toggle, globe-failure fallback), and the browser pane on the live site for the functional check (the tab must be in front: a background tab gets no animation frames, so the globe's HTML layer is not drawn). WebGL draws per frame are unchanged (1 on, 1 off); the HTML locator's CPU and layout cost was not measured.
- **Sky zoom-out Moon picture (10a, 27 Nov):** the same four checks are still not done. Used instead: headless Chrome with SwiftShader (360–1920 px; DPR 1 and 2), the browser pane on the live site for one bounded functional check. GPU memory (≈10.7 MiB) is an estimate; heap figures are script heap only; rendered brightness (+19–21%) is an image statistic in that environment; free-orbit Moon sizes not measured. `smoke-fixes` is an unresolved baseline exception on main (not caused by Moon work).
- **CRaTER release (5, 27 Nov):** the same four checks are still not done. Used instead: headless Chrome with SwiftShader (desktop and narrow widths, keyboard toggle), the browser pane on the live site for one bounded functional check. No chart performance measurement was made or claimed (an SVG of 145 groups). Failure paths are covered by the suite only.
- **LEND release (6, 28 Nov):** the same four checks are still not done. Used instead: headless Chrome with SwiftShader (desktop and 360 px, keyboard path), and the browser pane on the live site for one bounded functional check in the foreground tab. No performance measurement of the layer is claimed; "no second request on re-entry" is for the LEND file only. osmc-reliability-ui remains an incomplete test (missing fixture history), not a pass.
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

1. **Diviner:** assessment and proposal first, not a build. *(26 Nov: released, merge `0622e80`; item 3 done and closed.)*
2. Then the remaining items **one at a time**, in the order Chad chooses. *(27 Nov: item 4, LROC Apollo 11, released, merge `8e7d262`; item 5, CRaTER, released, merge `ba41c8a`. 28 Nov: item 6, LEND, released, merge `25993bf`.)*

**Current handover:** `reviews/2026-11-28-moon-lend-handover.md` (Project `claude/HANDOVER-MOON-AFTER-LEND.md`).

**Remaining open items after 6 (28 Nov):** 7 (assessed; proposal rev 2 with GPT for recheck), 8 (to assess); 9 (only inside the item it serves); 12a–c (options to classify); 11 (carried). Done: 1, 2, 3, 4, 5, 6, 10a; 10b closed decision; 13 outside scope. Chad names the next item; suggested order (Claude's suggestion only): LAMP (7), Mini-RF (8). The LEND readout-rounding follow-up is released and closed (merge `4b646ea`). Pairing (9) and the options (12) are taken up only inside the item they serve or when Chad classifies them.

## Change log

- Rev 1 (26 Nov 2026, 08:31 UTC): created after the height release close-out, reconciled against the original brief.
- Rev 2 (26 Nov 2026, 08:59 UTC): §3 Diviner assessed and proposal rev 1 written (`docs/concepts/MOON-DIVINER-PROPOSAL.md`; evidence SAMPLES §6). Summary row 3 updated. No other item moved.
- Rev 3 (26 Nov 2026, 09:20 UTC): §3 updated for GPT's rev 1 review (REVISE FIRST) and proposal rev 2. No other item moved.
- Rev 4 (26 Nov 2026, 09:42 UTC): §3: GPT's rev 2 recheck (PASS), Chad's decisions, the first-band trial PASS (branch `moon-diviner-trial` `3380aaf`). No other item moved.
- Rev 5 (26 Nov 2026, 09:54 UTC): §3: GPT's first-band review (data PASS; tooling HOLD) and tooling v2 (`83dc53a`). No other item moved.
- Rev 6 (26 Nov 2026, 10:22 UTC): §3: GPT's v2 recheck (PASS), D4b done (17 bands, all PASS), §6.4 global report (branch `moon-diviner-trial` `b918187`). No other item moved.
- Rev 7 (26 Nov 2026, 11:58 UTC): §3: Chad's freeze and acceptance, Claude's Powell read, the `moon-diviner-ui` preview (head `cdc9aed`). No other item moved.
- Rev 8 (26 Nov 2026, 13:07 UTC): §3: GPT's preview and global-report reviews, the R1 fix and wording (preview rev 2, head `34368ee`); §2 erratum on the height breaks. No other item moved.
- Rev 9 (26 Nov 2026, 14:42 UTC): §3: GPT's rev 2 recheck (PASS), the release candidate (`310ca1e`). No other item moved.
- Rev 10 (26 Nov 2026, 15:07 UTC): §3 released and closed (merge `0622e80`, 44/44 served, live layer check); §1, §2, §9 and §11 updated for the release; order of work updated. No other item moved.
- Rev 11 (26 Nov 2026, 15:34 UTC): §4 partly assessed: Apollo 11 LROC orthophoto, two checkpointed acquisitions, proposal rev 1 for GPT (`docs/concepts/MOON-LROC-REGION-PROPOSAL.md`). No other item moved.
- Rev 12 (26 Nov 2026, 15:54 UTC): §4: GPT's rev 1 review (revise before build), Chad's D1–D4, proposal rev 2 with the geometry and pixel tooling. No other item moved.
- Rev 13 (26 Nov 2026, 16:07 UTC): §4: sources retained, frame closed by the volume SIS, 2 m offset error corrected, proposal rev 2.1 and closure report. No other item moved.
- Rev 14 (26 Nov 2026, 17:49 UTC): §4: GPT's rechecks filed; page preview `moon-lroc-ui` built and with GPT. No other item moved.
- Rev 15 (26 Nov 2026, 18:58 UTC): §4: GPT's preview review filed; startup fix and preview rev 3 with GPT. No other item moved.
- Rev 16 (26 Nov 2026, 21:05 UTC): §4: GPT's rev 3 recheck filed; release candidate with GPT. No other item moved.
- Rev 17 (27 Nov 2026, 02:48 UTC): §4 released and closed (merge `8e7d262`, 50/50 served, live functional check); order of work updated. No other item moved.
- Rev 18 (27 Nov 2026, 03:25 UTC): §10a assessed on Chad's go; proposal rev 1 for GPT (`docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md`; evidence `docs/research/moon-sky-texture/`). No other item moved.
- Rev 19 (27 Nov 2026, 04:58 UTC): §10a: GPT's proposal review filed (PASS with notes), Chad's D1–D6, page preview `moon-sky-texture-ui` at `c132f46` with GPT. No other item moved.
- Rev 20 (27 Nov 2026, 06:43 UTC): §10a: GPT's preview review (R1) filed; R1 fixed, candidate `ceb6dc8` with GPT for recheck. No other item moved.
- Rev 21 (27 Nov 2026, 09:20 UTC): §10a: release candidate (tested `4c8aecd`) with GPT for release review. No other item moved.
- Rev 22 (27 Nov 2026, 09:34 UTC): §10a done and live (main `1280c0d`). No other item moved.
- Rev 23 (27 Nov 2026, 09:52 UTC): close-out tidy: §10a status line, §11 limits for 10a, remaining-items line. No item moved.
- Rev 24 (27 Nov 2026, 10:18 UTC): §5 CRaTER assessed; proposal rev 1 with GPT. No other item moved.
- Rev 25 (27 Nov 2026, 10:34 UTC): §5: GPT's rev 1 review filed; proposal rev 2 with GPT for recheck. No other item moved.
- Rev 26 (27 Nov 2026, 11:52 UTC): §5: GPT's rev 2 recheck (PASS), Chad's D1–D5, D7 and go; page preview `moon-crater-ui` (tested `d6f9a0f`) with GPT. No other item moved.
- Rev 27 (27 Nov 2026, 14:24 UTC): §5: GPT's preview review (PASS); release candidate `6ed18c3` with GPT for release review; §5 status line and the archive-observations wording brought up to date (rev 2). No other item moved.
- Rev 28 (27 Nov 2026, 14:50 UTC): §5 released and closed (merge `ba41c8a`, 54/54 served, live check); bundle identifier corrected; §11 limits for 5; remaining-items line and order of work updated. No other item moved.
- Rev 29 (27 Nov 2026, 16:21 UTC): §6 LEND partly assessed on Chad's go; proposal rev 1 with GPT (`docs/concepts/MOON-LEND-PROPOSAL.md`; evidence `docs/research/moon-lend/`). No other item moved.
- Rev 30 (27 Nov 2026, 16:37 UTC): §6: GPT's rev 1 review filed; proposal rev 2 with GPT for recheck. No other item moved.
- Rev 31 (27 Nov 2026, 18:20 UTC): §6: GPT's rev 2 recheck (PASS), Chad's D1–D9 and go; page preview `moon-lend-ui` (tested `cd3a9b6`) with GPT; rev 1 summary marked superseded. No other item moved.
- Rev 32 (27 Nov 2026, 21:02 UTC): §6: GPT's preview review (PASS, finite-header fix); release candidate `5ed9d70` with GPT for release review. No other item moved.
- Rev 33 (28 Nov 2026, 01:50 UTC): §6 released and closed (merge `25993bf`, 55/55 served, live check); readout-rounding follow-up recorded; §11 limits for 6; remaining-items line and order of work updated. No other item moved.
- Rev 34 (28 Nov 2026, 04:09 UTC): §6: readout-rounding follow-up candidate `f0c7625` with GPT for review. No other item moved.
- Rev 35 (28 Nov 2026, 04:37 UTC): §6: readout-rounding fix released (merge `4b646ea`, 55/55 served, live check); follow-up closed. No other item moved.
- Rev 36 (28 Nov 2026, 05:21 UTC): thread close-out: 55/55 served again at 05:12:32 UTC; handover `reviews/2026-11-28-moon-lend-handover.md`; branches `moon-lend-ui` and `moon-lend-rounding` deleted; Mac leftovers staged for the Trash. No item moved.
- Rev 37 (28 Nov 2026, 05:58 UTC): §7 assessed (LAMP GDR south-polar Lyman-α albedo; feasible; orientation finding); proposal rev 1 with GPT. No other item moved.
- Rev 38 (28 Nov 2026, 06:33 UTC): §7: GPT's rev 1 review filed; proposal rev 2 (R1–R4) with GPT for recheck. No other item moved.
