# skycraft-rc — Moon and Sun spacecraft: release candidate packet

Branch `skycraft-rc`, built on Chad's line (13 Nov 2026): "Go: build skycraft-rc on a branch per MOON-AND-SUN-BUILD-PROPOSAL rev 2.1 (P-b; tolerances as in §11; no merge, no hub deploy)".
**Nothing is merged, deployed, uploaded, registered or scheduled.** Live is unchanged: hub 0.6.11 `119cc641…801f`, page `bdf894f`.

Proposal: `docs/concepts/MOON-AND-SUN-BUILD-PROPOSAL.md` rev 2.1. Earlier record: `reviews/2026-11-13-moon-sun-proposal-review.md`.

## 1. What the candidate contains

| Part | Files |
|---|---|
| Dated examples (generator, archived source bytes, outputs) | `phase1/skycraft/build_examples.py`, `phase1/skycraft/raw/*`, `phase1/skycraft/catalogue/craft-moon-2026-06-R1.json`, `craft-sun-2024-12-R1.json`, `phase1/skycraft/BUILD.json` |
| Hub 0.6.12 | `phase1/worker.js`: daily job `skycraft` behind `SKYCRAFT_ENABLED`, `/admin/probe/skycraft`, `/snapshot/skycraft/meta`, `/snapshot/skycraft/<id>`, `/catalogue/skycraft/<revision>` |
| Pages | new `moon.html`, `sun.html`, `craft.js`; `index.html` (two links in the zoom bar), `skyscene.js` (links, leave, return), `style.css`, `sources.html` (new section) |
| Suites | `phase1/skycraft-hub.test.mjs`, `phase1/skycraft-ui.test.cjs`, fixture `phase1/skycraft-fixture.mjs` |

Served page files after a release: **fourteen** (adds `moon.html`, `sun.html`, `craft.js`).

## 2. Source checks done in this build (13 Nov 2026, browser pane; times UTC)

| Check | Result |
|---|---|
| JPL SSD API fair-use policy re-read (07:0x) | Nothing forbids a once-daily scheduled request. Operative lines: one request at a time; cache and reuse; back off on errors rather than retrying; "Applications making automated connections must provide a valid, application-specific User-Agent request header that includes correct product name, version, and contact information"; check the version field; APIs not to be embedded in a website. |
| LRO kernel `lrorg_2026074_2026166_v01.bsp` (07:11) | 7,557,120 B, sha256 `5e17414e…28b1`. DAF/SPK, 92 daily segments, all type 13, target −85, centre 301, frame 1 (J2000). Each segment holds 1,441 states at 60 s, on UTC minutes. Comment area: merged from daily `fdf29_*_n01.bsp` files "as is". |
| LRO segment for 10 June 2026 (words 894101–904203) | 80,824 B, sha256 `7fb04d7e…93f9`, archived in `raw/`. Read directly (our own reader of the stored states; no interpolation, no SPICE library). |
| LRO three-point check (rev 1): kernel vs fresh Horizons at 11:45, 12:00, 12:15 UTC 10 June 2026 | Differences **0.017 m, 0.017 m, 0.018 m**. Horizons target source tag `LRO_merged`; its data sheet places these times in "Reconstructed trajectory". |
| Parker example, Horizons, 22–27 Dec 2024, 10-minute step (07:12) | 721 rows; raw answer 220,359 B, sha256 `41eb0494…7748`, archived. Data sheet (revised Nov 03, 2026) and vectors in one answer; target source tag `psp_merged`; segment `spp_nom_20180812_20251001_v041_RO8`. |
| Parker cross-product check vs SPDF hourly (HAPI, 07:13 and 07:16), nine hours | Centre distance agrees within SPDF's 0.0001 au rounding at the three named hours. HGI longitude: ours − SPDF = **+0.853°, +0.855°, +0.850°** at 11:00, 12:00, 13:00 on 24 Dec; **about +0.08°** on 22 and 26 Dec. Latitude: up to 0.032°. See §4.6. |
| NASA's closest-approach statement | NASA (science.nasa.gov): "flying just 3.8 million miles above the surface of the Sun" (web search result; the 6.1 million km conversion appears in reports of NASA's statement). Shown attributed to NASA with the link. |

## 3. Tests

- `node --no-warnings phase1/skycraft-hub.test.mjs`: **127 passed**. 22 breaks, each fails (`gate-ignored any-version any-object any-times no-band no-statement edge-ok move-on-fail no-cas create-unconditional no-readback overwrite no-lock parallel lro-published any-snapshot no-integrity probe-two generic-down no-ua retry cat-unpinned`). Two breaks first passed (`no-cas`, `generic-down`); the tests were strengthened until they failed.
- `phase1/skycraft-ui.test.cjs` (real pages, real globe.gl, hub answers produced by the real `worker.js`): **75 passed**. 18 breaks, each fails (`no-pin nearest-sample hub-any-time edge-shown no-snap-hash push-history lro-today wrong-axis no-far no-break controls-shown example-default-hub link-no-time link-always no-reopen no-focus keep-return back-always`).
- `python3 -I phase1/skycraft/build_examples.py --check`: outputs reproduce byte for byte.
- Full regression: 61 test files; 4 manual/network tools skipped (`orbital`, `search.realdata`, `ships-probe`, `spacetrack-probe`); **57 run sequentially, 57 passed** (13 Nov 07:35:09–08:03:18 UTC). `sky-zoom-ui` 333/333 on the changed `skyscene.js`; `terminator-ui` passed this run (it is intermittent on main).

One fault found by looking at a screenshot, not by a test: the time controls stayed visible in the "unavailable" state (a `display:flex` rule beat `hidden`). Fixed; the suite now checks what is rendered (`controls-shown` break).

## 4. Deviations from the proposals, for GPT's judgement

1. **LRO example cadence is 60 s, not 30 s.** The kernel stores states every 60 s on UTC minutes. Showing those as written avoids any interpolation of ours.
2. **No SPICE library.** The workspace cannot reach NAIF; the pane can. One day's segment was pulled by byte range and read directly. The independent evaluation is Horizons (1.7–1.8 cm). The whole kernel's sha256 is recorded; only the one segment's bytes are archived in the repo. If the full 7.5 MB file should be archived, Chad can download it into the Mac research folder.
3. **Parker example every 10 minutes** (Horizons can; SPDF is hourly). The label says "closest sample in this snapshot" (24 Dec 2024 11:40 UTC, 6,166,864 km above the nominal surface), separate from NASA's figure.
4. **Two upstream requests per run, not four.** With `OBJ_DATA='YES'` Horizons returns the data sheet and the vectors in one answer, which is also GPT's preferred form of solution evidence (same response).
5. **LRO view:** face-on to the orbit plane that day (mean of r × v; largest single-state deviation 0.066°), lunar north up. Nothing is hidden behind the Moon in this view; the far-side drawing is exercised by a test on the Sun page.
6. **Cross-product finding (new).** The SPDF hourly product and Horizons differ along Parker's path near closest approach by what a timing difference of roughly 8 to 10 minutes would give, plus about 0.08° of constant longitude. Cause not established. Also: the CDAWeb HAPI record lists the product to 2029-01-31, while the SPASE record says 2025-08-30, so part of the SPDF series is necessarily predicted. This supports P-b (one classified source on the page).
7. **Segment edges.** The data sheet's table is in TDB to the minute. A sample within two minutes of a segment change is published with "no segment" and the page withholds it (line breaks there).
8. **User-Agent:** `mother-earth-collector/0.6.12 (+https://github.com/TheOneTheOnlyTheChad/mother-earth; contact: issues at that address)`. Whether a repository address is sufficient "contact information" for JPL is Chad's call; an email address would go into the public repo.
9. **Run hour:** 05 UTC on the existing hourly trigger (no new cron), after everything else in that job.
10. **Return to Sky** uses the history entry's state plus `pageshow`. On a fresh load it turns the Two Clocks card on first, because the zoom-out button lives inside that card.
11. **LRO forward study epochs:** 41 per capture (D 00:00, then 12:00, 12:30, 13:00, 13:30 UTC on days D+0, 1, 3, 7, 14, 21, 30, 37, 45, 60), each with its signed lead from the actual retrieval. The dense full-orbit capture GPT asked for before any *path* is not built; nothing about LRO is published.

## 5. Not shown by this candidate

- **Whether the Worker can reach Horizons with this User-Agent** (the preflight).
- Worker CPU and wall time of the job.
- The pages against the real hub (needs the two example files in R2 and hub 0.6.12).
- A real phone, Safari, a screen reader.
- Any LRO prediction-error figure (first definitive reference expected around Q1 2027).
- GPT's review.

## 6. Draft REGISTER entries (not filed; each on Chad's own line)

- **NASA/JPL Horizons — extend:** spacecraft −96 (Sun-centred) and −85 (Moon-centred) vectors with data sheets; **one scheduled hub read a day (two requests, one at a time)** with the application User-Agent; Parker shown on `sun.html`; LRO stored for a study and not shown. Terms as already filed (SSD public-domain statement; fair-use conditions as re-read 13 Nov).
- **NASA PDS / NAIF — LRO SPICE data set LRO-L-SPICE-6-V1.0** (FDF/GSFC definitive trajectory): one day's states shown on `moon.html`. Reuse terms for the PDS archive: **not yet read**; to be read before filing.
- **NASA/GSFC SPDF / CDAWeb — PSP_HELIO1HR_POSITION:** comparison only, not displayed. Record lists CC0 1.0 and a requested acknowledgement (N. E. Papitashvili, the data providers, CDAWeb, with an accessed date) — from a fetch summary, a lead; to be read directly before filing.
- **NASA — closest-approach statement:** cited sentence with link.

## 7. Release order (each on its own line from Chad; nothing implied by this packet)

1. GPT reviews this candidate.
2. `Approve: upload the two skycraft example files to R2 ref/skycraft/ (craft-moon-2026-06-R1, craft-sun-2024-12-R1)`
3. `Approve: deploy hub 0.6.12 from <commit> (content only, SKYCRAFT_ENABLED unset) and run /admin/probe/skycraft once` — exactly one Horizons request; stores nothing.
4. `Approve: run /admin/run/skycraft once` — the full manual run (two requests); read back the pointer, files and D1 row; measure CPU.
5. REGISTER lines (§6).
6. `Approve: set SKYCRAFT_ENABLED=1`; read the first scheduled run (05:07 UTC = 07:07 SAST).
7. Live candidate check from the Pages origin; Chad's look.
8. `Approve: push skycraft-rc to main (page change: Moon and Sun spacecraft pages, Sky Explore links, Sources section)`; served hashes (fourteen files); live read.

Rollback after release, each independent: page = revert the merge; schedule = remove `SKYCRAFT_ENABLED`; hub = 0.6.11 `119cc641…801f`.
