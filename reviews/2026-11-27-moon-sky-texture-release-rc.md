# Moon item 10a: release candidate for the Moon's picture on the Sky zoom-out Moon

Packet rev 1 · 27 Nov 2026, 09:20 UTC (clock reading) · Claude · **branch only: not merged, not deployed; no hub change; no data downloaded** · for GPT's release review.

**Chad's line (27 Nov 2026):** "Go for the Moon item 10a release candidate, carrying GPT's passed R1 fix. Include Sources, both REGISTER extensions, narrow Animals pins, the served-file manifest and final affected validation. Return the exact commit for GPT release review. Page only; no merge or deployment."

**Inputs:**
- GPT's R1 recheck, PASS: `reviews/2026-11-27-moon-sky-texture-ui-r1-gpt-recheck.md`, filed unchanged, sha256 `96dfb0b3…e28e`.
- The preview packet: `reviews/2026-11-27-moon-sky-texture-ui-rc.md` (rev 2).
- The proposal: `docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md` rev 1, with D1–D6 as accepted.

## 1. Exact commits

| | Commit | What |
|---|---|---|
| Fresh main | `018102c` | unchanged since the thread began (checked on GitHub at the start of this round). It is an ancestor of the branch. |
| Docs branch | `moon-sky-texture-docs` at `45cc94d` | **contained in this branch** (ancestor): the proposal, the evidence and GPT's proposal review. The merge brings them; nothing else from that branch exists. |
| Page payload (preview, with R1) | `6ba15ac` | `skyscene.js`, `index.html` (`index.html` unchanged since `a391ed8`) |
| RC: Sources and REGISTER | `09a5056` | `sources.html`, `REGISTER.md`, GPT's recheck filed |
| RC: served manifest (= **SK_MAIN**) | `bc0afd0` | `phase1/moonsci/served_manifest.mjs`, `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json` |
| RC: Animals pin maintenance | **`4c8aecd`** | `phase1/animals-tab-ui.test.cjs` only; parent `bc0afd0` |
| Records | this packet's commit (head) | docs only: this packet, checklist, STATUS, HANDOVER |

- **Frozen tested tree: `4c8aecd`.** Every result below ran on a detached worktree at `4c8aecd`. Nothing after it changes a page file, a served asset or a test.
- **The commit for release** is the branch head. It equals `4c8aecd` plus docs-only records (§6 lists the paths).

**Page files at `4c8aecd`, compared with main `018102c`:**

| File | sha256 | Change |
|---|---|---|
| `skyscene.js` | `192fb036…785c` | the Moon's picture (preview + R1), unchanged since `6ba15ac` |
| `index.html` | `125ebba7…6273` | the `moonlight.js` tag, the `skyscene.js` key, the `#zoom-moonmap` paragraph |
| `sources.html` | `4d148515…8e9c` | the `#sky-scene` "The Moon's picture." paragraph and two Data path sentences |

- **Unchanged:** `moonlight.js` (still pinned to main by the Animals 13c check), the map, the sunlight table, the scene file and its pin, `moon.html`, `tides.html`, `style.css`, the hub (0.6.25), R2 and the collectors.

## 2. Sources (`sources.html#sky-scene`)

- **New paragraph, "The Moon's picture.":**
  - the same colour map as the Moon page (NASA's Scientific Visualization Studio, CGI Moon Kit, linked; and to `#moonglobe`);
  - **appearance only and evenly lit**: no phase, not how the Moon was lit at that instant;
  - an **approximate calculated orientation**: a two-direction fit from the "Lit as now" table (JPL DE440 via NAIF) and this view's directions;
  - agreement with astronomy-engine (IAU) within 0.027° on 95% of dates and 0.29° at worst near new Moon, stated as agreement, not accuracy;
  - "about 3–10 screen pixels across in the measured examples" at the Earth-and-Moon stop, so light and dark areas, not features;
  - from the side, much of the visible disc can be the far side;
  - grey if the picture or the table can't be loaded, or the orientation can't be calculated, and the view still opens.
- **Data path:** two sentences added. When the view opens it also reads the map and the table from this site, each used only if its sha256 matches its pin; they are optional and the view never waits for them.

## 3. REGISTER (both extensions, filed 07:53 UTC under Chad's RC go)

1. **NASA SVS CGI Moon Kit entry**, "Also shown on the Sky zoom-out Moon on `index.html`": same file and URL; requested only on entry; checked against its sha256; grey if it can't be loaded or placed; wrapped, evenly lit, approximate calculated orientation; about 3–10 px across at the Earth-and-Moon stop; credit in "How this is drawn" and Sources; no change to the file.
2. **Sunlight table entry**, "Also read by `index.html` for the Sky zoom-out Moon's orientation only": same file and pin, read by the unchanged `moonlight.js`; requested only on entry; exact six-hour sample, no interpolation; two-direction fit, Moon→Earth exact, Sun for the roll; **never used for lighting**; agreement figures as above; grey outside its span or on failure.

## 4. Served-file manifest

- **New:** `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json`, sha256 `15e96c52…de8a`. It has **51 files**: 37 root page files and 14 assets, the 13 of the LROC manifest plus **`assets/moon/moon-light-2026-06-R1.json`**.
- **Against the LROC manifest:** 1 added (the table); 3 changed (`index.html`, `skyscene.js`, `sources.html`); none removed.
- **Kept unchanged as their own records:** the LROC manifest (`2026-11-26-moon-lroc-manifest.json`), the Moon temperature and height manifests and the Tides manifests. The script now writes the new file; its header says so.
- `node phase1/moonsci/served_manifest.mjs --check` on `4c8aecd`: "51 files (37 root page files + 14 assets) match this tree".
- **After release:** the live check (`--pane`) is built from this reviewed manifest file, not from the tree. Every listed path must match byte for byte.

## 5. Animals pins (narrow; `4c8aecd`, this suite only)

| Check | Holds |
|---|---|
| **13b** | `index.html` byte-identical to SK_MAIN's. SK_MAIN holds the `moonlight.js` tag (directly before the new `skyscene.js` tag), the new key and one `#zoom-moonmap` paragraph (with its "appearance only, evenly lit" and "approximate calculated orientation" wording), each once. With those set aside and the old key put back, it is TIDES_MAIN's, as before. The Animals links and header checks are unchanged. |
| **13c** | `skyscene.js` left the "same as main" list (now 11 files; the check asserts it is absent and `moonlight.js` present). All others are still byte-identical to main. |
| **13x** (new) | `skyscene.js` byte-identical to SK_MAIN's. |
| **13e sources.html (Sky)** (new) | byte-identical to SK_MAIN's, which holds the one paragraph (inside the `#sky-scene` section) and the two Data path sentences once each. The LROC check and the Nature-context and Animals check now apply after these are set aside, to everything they held before. |
| **13y** (new) | `018102c..bc0afd0` changes exactly the 23 literal SK_FILES: `index.html`, `skyscene.js` and `sources.html` among them; `moonlight.js`, `moon.html`, `style.css` and the hub not. |
| **13z** (new) | the first commit after SK_MAIN touching this suite has parent SK_MAIN and changes only this suite. |

**Tamper controls, all six caught at their named check:**

| Break | Change | Caught at | Checks failed |
|---|---|---|---|
| `sk-index-paragraph-edited` | "evenly lit" dropped from the paragraph | 13b | 4 |
| `sk-index-tag-gone` | `moonlight.js` tag removed | 13b | 4 |
| `sk-skyscene-edited` | limit 10 s → 20 s | 13x | 4 |
| `sk-sources-edited` | "and the view still opens" dropped | 13e sources.html (Sky) | 4 |
| `sk-sources-datapath-gone` | the optional-files sentence removed | 13e sources.html (Sky) | 6 |
| `sk-moonlight-edited` | the sunlight table's step changed in `moonlight.js` | 13c | 4 |

## 6. Final affected validation (frozen tree `4c8aecd`; logs in `evidence-rc/`)

| Suite | Result | Why it is affected |
|---|---|---|
| `served_manifest.mjs --check` | 51 / 51 match | the new manifest |
| `animals-tab-ui` | **300 / 0** | pins (13b, 13c, 13e, 13x–13z). See the note below. |
| `animals-tab-ui` × 6 tamper breaks | 6 / 6 caught | §5 |
| `sky-moon-texture-ui` | **197 / 0** | the feature |
| `sky-zoom-ui` | **351 / 0** | the view |
| `sky-ui` | **79 / 0** | the card |
| `skycraft-ui` | **77 / 0** | Explore and Back |
| `night-lights-ui` | **152 / 0** | reads `sources.html` |
| `tides-nav` | **2,882 / 0** | every page's header, incl. `index.html` and `sources.html` |
| `desktop-overflow` | **286 / 0** | page layout, incl. `sources.html` |
| `moon-diviner-ui` | **178 / 0** | its §H reads `sources.html`'s Moon sections |
| `smoke-fixes` | **stops at its harness wait** (line 109, after 11 FAIL lines; no summary line) **on both the candidate and unchanged main `018102c`**, with identical failure lists | `index.html` |

**`animals-tab-ui`, first run 297 / 3:** 13n, 13p and 13s ("the maintenance after … changes only this suite") failed. My start-of-round `git fetch --depth=50` had re-shallowed the clone, so those three checks could not walk back to their old baselines; they reported "uncommitted" instead. This was an environment problem, not the tree. After restoring the depth (`--depth=400`; 977 commits reachable), the rerun on the same frozen tree passed **300 / 0**. Both logs are kept. The six tamper breaks ran on the shallow history, but each was caught at its own named check, and none of those checks reads the old history.

**`smoke-fixes`:**
- Its fire-cell checks now fail, and it stops at a 5-s wait. The 11 failures and the stop are identical on the candidate and on unchanged main, run the same way on its documented server (`phase1/serve-core-on.py`). So they don't come from this change.
- It passed 113 / 0 at about 05:00 UTC on `c132f46`. `index.html`, `app.js`, `layers.js` and `style.css` are byte-identical between `c132f46` and `4c8aecd`.
- **The cause is not established.** Its fixture builds its fire records from the run time (`Date.now()`), so a dependence on the time of day is likely but not shown.
- The first attempt this round ran just after the previous server was stopped. It failed the same way, and was rerun on a fresh server.

**Not rerun here** (unaffected, or run already on the preview with byte-identical inputs):
- `mobile-pass`, 131 / 0 on `c132f46`, which has the same `index.html`;
- the other Moon-tab suites (no Moon-tab file changed);
- `tides-ui`, whose T1a is a branch-scope check that lists every branch's own files, as recorded at earlier Moon releases.

## 7. After Chad's Approve line (not done)

1. Merge the branch to main (fast-forward; main is an ancestor).
2. Run the served verification of all 51 files against `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json` on the live site.
3. Make one bounded live check of the zoom view: the picture is placed, the words show, Back works.
4. Do the records and delete the `moon-sky-texture-docs` and `moon-sky-texture-ui` branches.
5. No hub step.

## 8. Limits (unchanged)

- **Not verified:** a real phone, Safari, a screen reader or a hardware renderer.
- **GPU memory** is an estimate. The heap figures are script heap only.
- **Brightness** (+19–21%) is a sampled image-code luminance statistic in this rendering environment, not physical radiance or a universal figure.
- **Free-orbit Moon sizes** were not measured.
