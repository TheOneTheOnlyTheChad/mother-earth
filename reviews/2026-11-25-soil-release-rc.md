# Organic-soil emissions: release candidate `soil-release-rc` for GPT review (25 Nov 2026)

**Chad's go (his own words, 25 Nov):** "Go: prepare the soil release candidate."

**Builds on:**
- GPT's preview round-2 recheck (`reviews/2026-11-25-soil-preview-rc-r2-gpt-recheck.md`): PASS for the fixture preview, plus four release-scope requirements;
- the plan in `reviews/2026-11-25-soil-preview-rc-r2.md` §4.

**Not done:** no merge, no deployment and no hub change. No download: the version check is an API read in the browser pane. This candidate goes to GPT, and then to Chad's own Approve line.

## 0. Identity

| | |
|---|---|
| Branch | `soil-release-rc` at **`d2d597bc29a5853231cbe38c9a0830b0cb7d52dc`** |
| Fresh main (SOIL_PARENT) | `af89de247471c768f047e40fb4a749e0e69f1d7d` (docs-only head of main when the branch was cut) |
| Commits | `23a2eb0`: merge of the reviewed preview `soil-preview-rc` `e51ca61` onto fresh main<br>**`86071bfc4d019cd400019e98eed3ab49c1cf6415`** (SOIL_MAIN, the payload): full table, fixture retired, wording, REGISTER, soil-ui<br>`d2d597b`: Animals-suite maintenance only |
| Review copy | Mac `_review/soil-release-rc/` (new folder; every tracked file extracted and hash-checked against `d2d597b`, 0 mismatches; `00-READ-ME-FIRST.txt`). **Stop the preview server first:** it serves a different folder on the same port. |
| Screenshots | Mac `_review/soil-release-rc-shots/` (`rc-*.png`, full data; blue backdrop, not imagery) |
| Version check before freezing | 25 Nov 2026 10:40 UTC (12:40 SAST), browser pane, `/api/records/22137130/versions`: total 1, 1.0.1, `is_last: true`, `license.id: cc-by-4.0`, file MD5s unchanged |

## 1. What changed from the reviewed preview (payload `86071bf`)

- **The full table is in:**
  - `assets/soil/g4-soil-v1.0.1.json`, 790 records, 684,135 B (42,939 B gzipped);
  - SHA-256 `c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf`, unchanged from the assessed table and independently re-hashed by GPT;
  - `soil.js` pins it.
- **The fixture is retired, explicitly:**
  - `assets/soil/g4-soil-fixture-v1.0.1.json` and its cutter `docs/research/soil-c1/soil_fixture.py` are deleted on this branch. Both stay in the history of `soil-preview-rc` (`e51ca61`).
  - Because the fixture was added and removed inside the release range, it appears in neither anchor; 13m checks that (§3).
- **A fixture table is refused:** `validate()` returns "a preview fixture, not the full table" whenever `meta.fixture` is present, so the release never reads a subset as the whole.
- **Fixture code and wording removed:** the subset and "outside" states and the "preview fixture" notes are gone from the card, card status, key, row and inspector. With the full table, a validated absence means "no organic soil mapped", by the sparse rule.
- **Sources:**
  - the title loses "preview";
  - the "This preview" paragraph is replaced by "The file the page reads" (path, size, SHA-256, when it is read, the checks, the sparse rule);
  - the version line names the record's version list.
- **REGISTER:** a new entry. It covers:
  - what was read in full and what was downloaded (three files, with their hashes);
  - the licence;
  - what we compute and what we show;
  - the table difference (T1);
  - the cautions;
  - the version check and the cadence.
- **`soil.js` `CHECKED`:** 25 Nov 2026 (10:40 UTC check).
- **soil-ui:** reworked for the full table (§4).

**Unchanged from the reviewed preview:** palette, states, Key rule, the layer-owned outline, the stacked inspector, the place row and `app.js` (`a4876906…`, released bytes).

## 2. Files and hashes at `d2d597b`

| File | SHA-256 |
|---|---|
| `soil.js` | `316191fb6bd8c118a943c1afa30a4cff55a36d7db3421e4f08cb209b6dd31f4d` |
| `index.html` | `7d54018ab5dc510248c3b405bbee2c336577bc364cc43f8a1121201c97b24322` |
| `sources.html` | `2b3bfc78a68f197f53f8fd5cf2855da9d01dc6686cb00c306f5a8420d8b41715` |
| `style.css` | `62c3fba06f07d9fe014c4575e84658e782cce976b5190ffb725088d3a2564c46` |
| `layers.js` | `3f67670962285f67f096a147b6ae92f4e739c14fea06bdf3b416c1849ef3afc0` |
| `app.js` (unchanged) | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `assets/soil/g4-soil-v1.0.1.json` | `c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf` |
| `REGISTER.md` | `980e2cfd14749f7a1a59cf7260f779ecfa1e05def45f33721f4f4a868860fa0f` |
| `phase1/soil-ui.test.cjs` | `321e644cd52e40ca53b7f18f92652f4b0e4c3540814b95a806e4f3ceb85ace2d` |
| `phase1/animals-tab-ui.test.cjs` | `8a29b5c29d26d8422f95a419845227cd725cec085691270c0695e7786181b177` |
| `phase1/bare-earth-ui.test.cjs` | `bb2faa63695c50d4ef45d2d3de028365ecae33759f789b5d5007e2296eae0205` |

**Served-hash checks after release** will cover **30 files**: the 29 root `.html`/`.js`/`.css` page files (now including `soil.js`) plus `assets/soil/g4-soil-v1.0.1.json`.

## 3. Animals suite maintenance (`d2d597b`), against GPT's four requirements

1. **Historical 13j and 13k are intact:**
   - 13j still checks `NC_PARENT 6bebff1 .. NC_MAIN 90eb522` with its old scope;
   - 13k still holds `app.js` to `NC_MAIN`;
   - `BASE_MAIN` (`0e62083`) and `TL_MAIN` (`643bb9a`) do not move.
2. **New anchors `SOIL_PARENT af89de2` and `SOIL_MAIN 86071bf`, with a literal manifest `SOIL_FILES` of 11 paths:**
   - `REGISTER.md`, `assets/soil/g4-soil-v1.0.1.json`, `docs/research/soil-c1/soil_controls.py`, `docs/research/soil-c1/soil_reference.py`, `index.html`, `layers.js`, `phase1/bare-earth-ui.test.cjs`, `phase1/soil-ui.test.cjs`, `soil.js`, `sources.html`, `style.css`;
   - **13m** requires the changed-path set of `SOIL_PARENT..SOIL_MAIN` to be exactly that list: nothing extra, nothing missing, so `index.html` and `sources.html` must change, and `app.js` must not be in it;
   - **13m** also checks that the fixture is absent at both anchors and in the tree, that the full table carries its pinned hash at `SOIL_MAIN` and in the tree, and that the tree's `soil.js` is `SOIL_MAIN`'s;
   - no wildcards.
3. **Binding:**
   - **13b** (`index.html`) and **13e** (`sources.html`) are now byte-identical to `SOIL_MAIN`;
   - **13c** holds `layers.js` and the Bare Earth suite to `SOIL_MAIN`, and its other 13 files to `BASE_MAIN`;
   - the independent Animals assertions are kept: both links once each, the header, the Animals section, the shortcut, the six sources, the Low class and no "private preview";
   - **13e** now also checks the zebra land-context block on its own: present once, on the line after the zebra paragraph;
   - **13f** counts 17 Layers rows, exactly one of them "Organic-soil emissions (modelled)", with no journey row;
   - **13n** binds the maintenance commit, which cannot name its own hash: the first commit after `SOIL_MAIN` on the ancestry path to HEAD that touches this suite must have `SOIL_MAIN` as its only parent and must change this suite only.
4. **Negative controls**, run on this candidate (`SECTIONS=13`):

| Control | How | Result |
|---|---|---|
| `app.js` edited in the soil commit | local scratch commit on `SOIL_MAIN` (never pushed), `SOIL_MAIN=` it | **13m fails** (`extra: ["app.js"]`) |
| unrelated file (`timeline.js`) | same | **13m fails** (`extra: ["timeline.js"]`) |
| no `index.html` change | `index.html` reverted to `SOIL_PARENT`'s | **13m fails** (`missing: ["index.html"]`); 13b fails too |
| no `sources.html` change | `sources.html` reverted | **13m fails** (`missing: ["sources.html"]`); 13e fails too |
| fixture left in | fixture re-added | **13m fails** (`extra`, `fixtureGone: false`) |
| maintenance commit also edits `README.md` | scratch commit, suite run in that tree | **13n fails** (`files: [README.md, phase1/animals-tab-ui.test.cjs]`) |
| blind NC move | `NC_PARENT=af89de2 NC_MAIN=86071bf` | **13j fails** (it lists the 9 soil paths outside its old scope) |
| existing breaks | `BREAK=nc-app-edited / nc-index-edited / ctx-sources-edited / earth-script-edited` | caught at 13k / 13b / 13e / 13c |
| the candidate itself | `SECTIONS=13` on `d2d597b` | **16 passed, 0 failed** |

The scratch commits were local only and are not on GitHub; their worktree is removed.

## 4. Tests

- **`soil-ui`: 47 passed, 0 failed.**
  - **Part A:** the JS reproduces `soil_reference.py` for every record and three absent cells, in all five periods (text), both components (classes), and every stored number (fmt). It also covers GPT's three R2-1 reproductions and the mutations, now including "a preview fixture is refused".
  - **Part B:** 790 cells drawn; no fixture or preview wording on the card, key, inspector, legend or Sources (B16, B24).
  - **Timing in this container**, SwiftShader software rendering: switch-on to drawn 762 ms; `redraw()` 8–12 ms (×5); 791 polygons including the selection outline. These are not phone figures.
  - **13 named mutations plus the OLD=1 baseline control, 14 negative runs,** each fail at their own checks (`reviews/evidence/2026-11-25-soil-release-rc/soil-ui-breaks-d2d597b.txt`). *(Corrected 25 Nov after GPT's review: this line first said "all 14 breaks".)*
  - The breaks: `no-hash`, `sparse-first`, `zero-positive`, `combined`, `no-outline`, **`fixture-accepted`** (new: a fixture table is accepted, caught at A6), `load-at-start`, `no-incomplete`, `bins-shifted`, `zero-drops-coverage`, `unknown-counts`, `no-soilview` and `alpha-only`.
- **All 51 `phase1/*.test.cjs` suites run on `d2d597b`** (`reviews/evidence/2026-11-25-soil-release-rc/suites-d2d597b.txt`):
  - **42 pass**, including animals-tab-ui **284/0**, bare-earth-ui 190/0, nature-context-ui 78/0, legend-active-ui 548/0, cell-perf-ui 43/0, and the five that lacked fixtures before: key-drawn-ui 70/0, mobile-pass 131/0, status-notes-ui 17/0, orbital-browser 113/0, oceanheat-ui 109/0.
  - **9 fail exactly as on main**, with the same FAIL lines: drifters-ui (1), kept-ui (3), osmc-reliability-ui (1), place-ui (crash at its first inspector click), search-ui (4), smoke-fixes, terminator-ui (1), timeline-mixed-assets, ux-round1 (1). None touches soil, and they are recorded, not maintained here.
- **Key and mobile evidence (GPT's gap):** restored the fixtures, not a new test.
  - `/home/claude/fixtures/orbital.csv` and `orbital-meta.json` were rebuilt with the repo's own `phase1/orbital-fixture.build.mjs` (32,509 rows, sha `94513bef7a0d…`).
  - `OH_SNAPSHOT_DIR` is the Mac's `research/ocean-heat/2026-11-10-claude/oh-snapshot-R1.zip`, unpacked.
  - On main `af89de2` with these fixtures: key-drawn-ui 70/0, mobile-pass 131/0, status-notes-ui 17/0, orbital-browser 113/0, oceanheat-ui 109/0.
  - On the candidate: in the table above.
- **`hub-alignment`:** 6/0 (`worker.js` = deployed hub 0.6.25). No hub file changed.

## 5. Release steps after GPT's review (for Chad's Approve line)

1. **Fresh-main reconciliation.** Main has already moved since `af89de2`: five docs-only Animals commits up to `9d0009c` (`STATUS.md`, `docs/research/animals-source-audit/ENQUIRIES-EXPANSION.md`), none of them in the soil manifest. At release I merge current main into `soil-release-rc` and rerun soil-ui, animals-tab-ui, bare-earth-ui and nature-context-ui. 13m and 13n are unaffected: they read the fixed anchors, and the merge commit does not touch this suite.
2. Chad's Approve line naming the final commit.
3. Push main (the page release).
4. Served-hash checks on the 30 files.
5. A REGISTER line naming the release merge.
6. START-HERE live-page line and STATUS.
7. Close-out.

No hub deploy.

## 6. Questions for GPT

- **C1:** do 13m and 13n, with the controls in §3, meet requirements 1–4?
- **C2:** the full-data rendering on real imagery (served copy): boreal and tropical coverage, and drawing speed on your machine.
- **C3:** anything in REGISTER or Sources that needs correcting before release.
