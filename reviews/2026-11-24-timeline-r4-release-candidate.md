# Timeline — release candidate `tl-2026-11-R4`: Humans and human relatives (four dated finds)

24 Nov 2026 · Claude · Timeline thread.
**Chad's go (24 Nov 2026), after GPT passed the wheel fix at `bfa32da`, reviewed through `5977a1c`:** take the four-find work through release-candidate preparation and review, then deployment on his Approve lines.
**Nothing is uploaded, pinned, deployed or merged.** The live page serves `tl-2026-11-R3` from hub 0.6.24. Each production step below needs Chad's own Approve line.

Two branches, both cut from fresh main `72ea123` (Nature context released; soil-carbon documents):

| Branch | Head | What |
|---|---|---|
| **`timeline-finds-release-rc`** | this packet's commit; tested tree **`f464fa8`** | The page release: page commit **H = `643bb9a`**, release sources, R4 catalogue, suites, `TL_MAIN`, REGISTER, freeze record |
| **`timeline-r4-hub-rc`** | `0235545` | Hub 0.6.25: the R4 pin. Its own packet: `reviews/2026-11-24-hub-0.6.25-candidate.md` on that branch |

## 1. Values — final for a page release on 25 Nov 2026

| | |
|---|---|
| Revision | `tl-2026-11-R4`, schema 4, previous `tl-2026-11-R3` |
| **Release date in the catalogue** | **25 Nov 2026.** The page release must go out on that date. If Chad wants it out on 24 Nov instead, the date changes, the bytes change, and this candidate and the hub pin are rebuilt and rechecked **before** any upload |
| Catalogue | `phase1/timeline/catalogue/tl-2026-11-R4.json`, **48,134 B, sha256 `74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca`** |
| R2 object key | `ref/timeline/tl-2026-11-R4.json` |
| Hub | 0.6.25, `phase1/worker.js` 551,780 B, sha256 `d54323183ebd49acb1818b2cb68dc31a56e95c6ddc2fc8635303311837e9e24d` |
| Page build key | `202612250900` |
| Images | `assets/timeline/tl-2026-11-R4/`: the R3 NASA files, same bytes |

Served files this release changes, at `f464fa8`:

| File | SHA256 | Bytes |
|---|---|---:|
| `timeline.html` | `95ad7f82dd32f286ade090fb735bbd7134125e06d7a44ac85a257ef75e9b27dd` | 73,210 |
| `timeline.js` | `10ac42f49edecca40e74db871e3f094969db486e6aaa7f654978b5bbcc45ceec` | 76,861 |
| `style.css` | `a386302f4206c47efb4ce41401c268df40942e2cf9ddeef295f0b6a6bb899d71` | 87,531 |
| `REGISTER.md` | `e523aea795e03713b0d136e894fedb622741ffbe85f95d43d31afe65bbb29b9f` | 147,972 |
| `assets/timeline/tl-2026-11-R4/` (3 files) | as R3's | |

**Not changed:** `app.js`, `index.html`, `sources.html` (Nature context's released files, held by `NC_MAIN`), every other page, `phase1/worker.js` on this branch (0.6.24), the R1, R2 and R3 catalogue files.

## 2. What changed since the tree GPT passed (`5977a1c`)

1. **Merged onto fresh main** `72ea123` (`eec006c`). Main's changes since the rehearsal's base were documents and the Nature context release; no conflict.
2. **Release sources** (`ea6ce7f`): `BUILD.json` (R4, schema 4, 25 Nov), `finds.json` (the rehearsal's finds, claim for claim; only the file note differs — checked by `timeline-finds-build` A), `changes.json` (the R4 release and one change record). The generator made the catalogue and the page.
3. **Two fixes the release run found** (`643bb9a`, served files):
   - **`timeline.js`:** deep in time at the 50,000-year narrowest window, each end is rounded to 1e-6 Ma, so the span could read 0.050001. Zoom in stayed enabled and did nothing, and a stored narrowest window could be refused. The limit is now judged with a 2e-6 allowance (`SPAN_EPS`). The old 1 Ma limit had the same latent flaw. Found by `timeline-travel-ui` B on the R4 page (336.775001 to 336.725).
   - **`style.css`:** the finds lane now sits below the extinctions lane, so an extinction cluster's open list is drawn over the finds rows. At the whole span the list's "Zoom to these" button was covered by the finds lane. **This was in the rehearsal GPT passed; neither of us saw it.** Found when `timeline-travel-ui`, run on the R4 page, could not click a cluster's "Zoom to these": the finds lane intercepted the click.
4. **`TL_MAIN`** → `643bb9a` (`1a589e1`), one line. `BASE_MAIN`, `NC_MAIN`, `NC_PARENT` and every other comparison untouched.
5. **Freeze record and REGISTER entry** (`f464fa8`): `docs/research/TIMELINE-HUMAN-RELATIVES-FREEZE-R4.md`; REGISTER heading marked release candidate.

## 3. Final wording, for review

- **Change record** `tl-2026-11-R4-1`: *"Opened the Humans and human relatives lane with four dated finds. Each mark is the date or age limit one source gives for one find or deposit. It is not a record of how long a group lived."* (The rehearsal's sentence said "Added four dated finds to a new lane"; GPT asked that the final wording not imply a lifespan database.)
- **Coverage line:** *"This release shows the conventional Big Five mass extinctions, placed on the ICS chart, and 4 dated finds of humans and human relatives reviewed for this page. Other finds are not yet reviewed, or their full text is not yet verified. Empty stretches are not periods where nothing happened."*
- **Page line:** "Revision tl-2026-11-R4, released 25 Nov 2026 · What changed". Lane list: "Humans and human relatives (4)". Counts: "Dated entries (5) · Dated finds (4) · Dates without a year (1)".
- Lane sentence, entries, attribution and the La Ferrassie context line: unchanged from rev 2, as accepted.

## 4. Suites that had to change — each a judgement for GPT

Seven older suites were written with R3, schema 3 and an empty relatives lane as the release. They were migrated; none was loosened.

| Suite | Change | Why |
|---|---|---|
| `timeline-finds-build` A | R4 is the release (identity, bytes, date). The published R3 must still come out byte for byte from **its frozen sources** (`phase1/timeline/fixtures/tl-2026-11-R3-src/`, new). The release finds must equal the accepted rehearsal finds. The R4 change record word for word | Section A compared "the released sources" with R3 |
| `timeline-story-build` A | Release identity is schema 4. New check: R3 still carries the story sentences, and R4's end-Cretaceous entry equals R3's | Two checks named schema 3 |
| `timeline-axis` | Two empty lanes, not three. Tab order adds "Last 400,000 years", then the finds lane's button and four links. No-JS: nine entries, the find claims' fixed labels | The page has a fourth lane's content |
| `timeline-changes-ui` | A heading for R3 as a past release; eleven review lines (the finds' are "24 Nov 2026"); fixtures copy `finds.json`; fixture H lists five releases | R3 is no longer the newest |
| `timeline-story-ui` | The story's "Changed in revision" line names R3, where the change was made, not the current release | It was written as "the current revision" |
| `timeline-travel-ui` | **Runs on a schema-3 page generated from R3's frozen sources by this checkout's generator, with this checkout's script and stylesheet.** No expectation changed | It tests the explorer as it is without finds (1 Ma limit, Ma ticks, five marks). The finds lane's own rules are `timeline-finds-ui`'s. I first tried adapting it to the R4 page; that meant rewriting its limits and cluster fixtures, so I reverted that and kept it whole |
| `timeline-finds-ui` | New: extinction cluster lists drawn over the finds lane (fails without the style fix; checked by removing it); deep-time narrowest window kept and Zoom in unavailable; break `span-eps` | The two fixes |

`timeline-ui`, `timeline-mixed-assets`, `timeline-changes-build` and `timeline-catalogue-hub` (on this branch) are unedited. `timeline-travel-ui` keeps `381e011`'s helper fix.

**A gap this leaves, said plainly:** no suite runs the travel suite's full matrix on the R4 page itself. On the R4 page the explorer is covered by `timeline-finds-ui` (281 checks, on the rehearsal sources, whose finds equal the release's), `timeline-ui`, `timeline-axis`, `timeline-changes-ui` and `timeline-story-ui` (all on the release page).

## 5. Results

Claude's cloud workspace, Playwright Chromium, each suite alone on tree `f464fa8`, 24 Nov 2026: breaks 15:36–15:57 UTC (three lanes in parallel), suites 15:57–16:10 UTC, `nature-context-ui` at 16:13 UTC. Logs: `reviews/evidence/2026-11-24-timeline-r4-release-candidate/`.

| Suite | Result |
|---|---|
| `timeline-finds-ui` (1280 and 390) | **281 / 0** |
| `timeline-finds-build` | **80 / 0** |
| `timeline-ui` | 594 / 0 |
| `timeline-travel-ui` (schema-3 page, this script) | 209 / 0 |
| `timeline-changes-ui` | 173 / 0 |
| `timeline-story-ui` | 127 / 0 |
| `timeline-axis` | 97 / 0 |
| `timeline-mixed-assets` | 18 / 0 |
| `timeline-story-build` / `timeline-changes-build` | 99 / 0, 49 / 0 |
| `timeline-catalogue-hub` / `hub-alignment` (this branch: hub 0.6.24) | 74 / 0, 6 / 0 |
| **`animals-tab-ui`** (`TL_MAIN` `643bb9a` in the file; `BASE_MAIN`, `NC_MAIN` as on main) | **282 / 0** |
| **`nature-context-ui`** | **78 / 0** (first attempt could not start: this workspace lacked the suite's local globe and font files; installed, then run) |
| All 51 non-browser suites | 46 pass; 5 could not run here (`night-lights`, `oceanheat-hub`, `orbital`, `sky-scene-ref`, `solar`), the same five as on main. Against main the only differences are the new `timeline-finds-build` and `timeline-story-build` 98 → 99 |

**Breaks**, each run alone on the same tree, all fail a named check (`…/breaks/`): 30 browser breaks and the old-script control (`OLD=1`, 44 fails), among them `wheel-redraw-release` 19, `wheel-trap` 4 and the new `span-eps` 4; 10 build breaks.

**Combined tree** (this branch merged with the hub candidate, local, never pushed): see the hub packet §2; all pass.

**Not run:** the other browser suites of the repository (Animals and Nature context apart), since no file they load changes; the R4 page against a live hub (R4 is not pinned yet); a real phone, Safari, a screen reader, true 200 % zoom, a real mouse wheel or trackpad. No new screenshots of the release page were taken; the focus crops in the evidence are from the finds suite.

## 6. Order from here — each production step on Chad's own Approve line

1. **GPT reviews** this candidate and the hub candidate.
2. **R2 upload** of the catalogue to `ref/timeline/tl-2026-11-R4.json`, read back, exact bytes; R1–R3 objects read back unchanged; no public effect (hub still 404 for R4).
3. **Hub 0.6.25** deployed, read back, checked (hub packet §5), then landed on main with `DEPLOYED-HUB.json` updated.
4. **This branch takes main** (the landed hub), the affected suites are rerun, and the result is checked to equal this candidate plus the landing.
5. **Page release on 25 Nov 2026:** main moves to this branch. Before the push: hub re-read (0.6.25, R4 exact). After: served hashes of the files in §1, the live page read at desktop and phone widths, R3's page state gone, the hub and R1–R3 routes unchanged.
6. **Close-out:** REGISTER heading to "on the page since", START-HERE, HANDOVER, STATUS, Mac sync preserve-first, Project copies, branches `timeline-finds-rc`, `timeline-finds-release-rc`, `timeline-r4-hub-rc` deleted after verification, one close-out record.

Sketches of the lines (2 and 5; the hub line is in the hub packet):

`Approve: upload phase1/timeline/catalogue/tl-2026-11-R4.json (48,134 B, sha256 74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca) to R2 as ref/timeline/tl-2026-11-R4.json, and read it back`

`Approve: merge timeline-finds-release-rc into main (page release: Humans and human relatives, tl-2026-11-R4, release date 25 Nov 2026), with served-hash and live checks`

## 7. Rollback

- **Page:** revert the release merge on main (page first). The page then pins R3 again; the hub keeps serving R3. The R4 pin and object can stay.
- **Hub:** redeploy 0.6.24 (`db4f9cdf…1aa5`), only while the page is on R3.
- **R2:** the object is never edited or removed; an unused object is harmless. A wrong byte means a new revision id.

## 8. Not holding this release

Drimolen (held), DNH 127 (excluded), Ngandong and Liang Bua (out); enquiries E1–E4 unsent, Chad's to send; the source refresh (T6) queued.

## 9. Questions for GPT

1. Are the two late fixes (§2.3) acceptable within this candidate, or does either need its own recheck?
2. Are the suite migrations in §4 sound, in particular running `timeline-travel-ui` on a generated schema-3 page, and the gap stated under the table?
3. Is the final wording in §3 accepted?
4. Is the freeze record complete enough to stand as the release's source record?
5. Anything else before Chad's Approve lines?
