# Tides release candidate: final commit for GPT's review

**25 Nov 2026, 18:49 UTC (clock reading). Branch `tides-nav-rc`. Nothing merged, nothing live, no hub, Worker or R2 change.** On Chad's own line, 25 Nov: "Navigation PASS. Keep Tides after Sun. Prepare the final release candidate with the listed source records, narrow pin maintenance, served-hash coverage and affected checks. Return the exact final commit for GPT review. No merge or deployment yet." GPT's navigation review (PASS) is filed unchanged as `reviews/2026-11-25-tides-nav-rc-gpt-review.md` (sha256 `a53a1d5d…587f6c`, relayed by Chad).

## 1. Identity

- **Final commit: the commit that adds this packet** (a file cannot hold its own hash; the hash is given with the review request). It changes only this packet and GPT's filed review. **Release payload head: `6d65c4c`.**
- **Baseline: main `ea8cffc96c318920f7671d53fa6b201ac69c8778`**, unchanged since and fully contained in the branch (checked `git merge-base --is-ancestor` at 18:50 UTC).
- **Correction (GPT, item 4):** the navigation packet's title named `20aa48a`; the reviewed navigation head was `e130ea7` (its packet commit). Both are on this branch.
- **Every change since the navigation review (`e130ea7`):**

| Commit | What |
|---|---|
| `5b4a9b1` | merge of main `ea8cffc` (docs only: the navigation packet, round-2 recheck, STATUS). |
| `54cbc0d` payload 3 | `sources.html`: one Tides section before Animals and one "Tides" shortcut before "Animals" in the Sections list. `REGISTER.md`: one Tides entry, appended. `tides.html`: its "Full register" link now goes to `sources.html#tides`. `build_tides.mjs --check` also verifies that the Sources section states the model's rule and constants. New `phase1/tides/release_manifest.mjs` and the manifest `reviews/evidence/2026-11-25-tides-release-manifest.json`. `tides-ui` T1a lists `REGISTER.md`. |
| `dd64d2a` | Animals suite pin maintenance, **this suite only, parent = `54cbc0d`** (section 3). |
| `6d65c4c` | `tides-ui` T1b allows the Sources section's own link to the Tides page. |

- **Unchanged since the reviewed preview** (round 2, `7c3e2af`): `tides.js` `d7738aa3…eaca`, `tides-model.js` `90ab5dd0…08e5`, `tides.css` `5797d407…b5d9`, both pictures, `assets/tides/SOURCE.json`. `tides.html` changed only by the Tides tab, Menu item, stylesheet key (navigation) and the Sources link.
- **Unchanged since the navigation review:** `style.css` `8011c8df…60f9`, the headers of all seven pages.

## 2. Source records (GPT, item 1)

- **`sources.html` → "Tides — how the Moon and Sun shape them (computed model; own page)"**: what it is (computed, nothing fetched, no date, height or prediction, and the page's fixed model line), the rule and its sources (Stewart §17.4 with the 0.46051 ratio; the potential-to-height step as our derivation), the drawing constants, what is left out, the three pictures as **reference pictures, not live**, with their dates and limits, and the Sun described as **an Earth-facing view, not a picture of the whole Sun**, with its unseen part plain and not filled in. Credits: the GIBS acknowledgment sentence, NASA's Scientific Visualization Studio, and SDO's requested credit, plus a pointer to `assets/tides/SOURCE.json`. The Animals section, its shortcut and every Animals source are untouched.
- **`REGISTER.md` → "Tides explorer"**, appended after the soil entry:
  - **Status line:** "not released"; it becomes the release line after the merge.
  - **Model sources:** Stewart read by Claude, Fitzpatrick relayed by Chad, the NOAA pages read by GPT, each said as such.
  - **Earth picture:** request, time, the four candidates, bytes, sha256, terms (Earthdata guidance) and the layer-level check, stated as done after the picture was kept. CC0 is not claimed. The page's stated limits and the credit are included.
  - **Sun picture:** the original's hub id and hash, SDO's file-updated time with the note that it is not an observation time, the served file's hash, our changes with the fit numbers, the frame-specific SRS 329 check and its limit, the terms and our reading, and "the PI has not been notified". It also records Chad's statement that he is in contact with NASA, attributed to him.
  - **Moon:** reuse of the registered file.
  - **Other lines:** the accepted image total, commercial use (none), maintenance (six-monthly, first due May 2027) and the last-checked date.
- **Drift guard:** `build_tides.mjs --check` fails if the Sources section stops stating `Drawn radius = 1.15 + 0.12 × value`, `0.46 × P2(angle to the Sun)` or `tides-model-R1`. Tried with the old constants: exit 1.

## 3. Animals pins (GPT, item 3)

- **New pins:** `TIDES_MAIN` = `54cbc0d` (payload 3) and `TIDES_PARENT` = fresh main `ea8cffc`.
- **13o:** the literal `TIDES_FILES` is the exact changed-path set of `ea8cffc..54cbc0d`, 29 paths, including `REGISTER.md`, `reviews/evidence/2026-11-25-tides-release-manifest.json` and this suite's earlier maintenance.
- **13e `sources.html`:** byte-identical to `TIDES_MAIN`. From `SOIL_MAIN` it may differ by exactly:
  - the Tides tab and Menu item;
  - the stylesheet key;
  - **one** `<h2 id="tides">` section placed immediately before `<h2 id="animals">`;
  - **one** "Tides" shortcut placed immediately before "Animals".

  Nothing else may differ. Every earlier Animals guarantee in 13e is still checked on its own.
- **13p:** the first commit after `TIDES_MAIN` touching this suite is `dd64d2a`. Its parent is `54cbc0d`, and it changes this suite only.
- **Result:** **287 passed.**
- **Breaks on section 13, 8 of 8 caught:**
  - `nc-sources-edited`, `ctx-sources-edited`, `nc-index-edited`;
  - `tides-index-tab-gone`, `tides-sources-menu-gone`, `tides-tl-tab-twice`;
  - two new: `tides-sources-section-edited` (the "not a picture of the whole Sun" sentence changed) and `tides-sources-shortcut-moved`.
- **`BASE_MAIN`, `TL_MAIN`, `NC_MAIN`, `SOIL_MAIN`:** unchanged.

## 4. Served-hash coverage (GPT, item 2)

`phase1/tides/release_manifest.mjs` pins **37 files**: all **33** root `.html`/`.js`/`.css` page files (the 29 of the soil release plus `tides.html`, `tides.js`, `tides-model.js`, `tides.css`) and **4 assets** (`assets/tides/SOURCE.json`, both reference pictures, the reused Moon map). Each entry has its exact path, bytes and sha256 at this tree. `--check` passes at `6d65c4c`.

After the release merge, `--pane` prints a script that fetches every path from the live site with `no-store` and compares bytes and hashes; it is run in a browser-pane tab on the site. The Tides-relevant entries:

| Path | Bytes | sha256 |
|---|---:|---|
| `animals.html` | 23,365 | `450ab6d4ac15…5e82` |
| `index.html` | 163,010 | `893ce5a2a324…24b9` |
| `moon.html` | 9,806 | `1e28aaacdeb6…c855` |
| `sources.html` | 101,105 | `96e33944d26b…a217` |
| `style.css` | 90,153 | `8011c8df8a4a…60f9` |
| `sun.html` | 8,792 | `200af10996ee…2f22` |
| `tides-model.js` | 7,761 | `90ab5dd00be0…08e5` |
| `tides.css` | 6,572 | `5797d4074047…b5d9` |
| `tides.html` | 22,774 | `1ac52e79a380…2b03` |
| `tides.js` | 32,357 | `d7738aa31c3c…eaca` |
| `timeline.html` | 73,355 | `ddbc3cf08ae6…a7b0` |
| `assets/tides/SOURCE.json` | 6,538 | `da4b02725946…013c` |
| `assets/tides/earth-2026-06-22.jpg` | 574,096 | `5e50da4e1688…095b` |
| `assets/tides/sun-2026-11-25.jpg` | 332,048 | `62857fae83f7…d5bc` |
| `assets/moon/lroc_color_2k.jpg` | 457,942 | `f7130a182268…2170` |

## 5. Checks at `6d65c4c` (GPT, item 5), cloud workspace, one suite at a time, 18:22–18:56 UTC

- **Tides:**
  - `tides-ui` **60**; `tides-model` **42**; `tides-nav` **2,882**.
  - `build_tides.mjs --check` (cross-section, Drawing sentence, neap share, the Sources section's rule, three image records), `check_sun_reference.py --check` and `release_manifest.mjs --check` all pass.
- **Navigation and Timeline:** `timeline-ui` **594**, `desktop-overflow` **286**, `timeline-changes-build` **49**.
  - `timeline-mixed-assets`: 16 pass, 2 fail. **The same two fail on main** (`animals.html`).
- **Every suite that loads `sources.html`:**
  - `smoke-fixes` **113**, including the Sources text-node overflow at seven widths;
  - `kept-ui` 21, `sun-globe` 103, `moon-globe` 67, `soil-ui` 47, `nature-context-ui` 78, `ux-round1` 34, `backdrop-layer` 27, `dustrgb-ui` 67;
  - `fire-status-ui` 279, `freshness-wording-ui` 156, `night-lights-ui` 152, `optional-layers-status-ui` 230, `quakes-ships-status-ui` 124, `ships-retain-ui` 42;
  - `osmc-reliability-ui`: 40 pass, 1 fail ("old page: no page errors"), **known on main**.
- **Animals:** **287** (section 3).
- **Not rerun:** the full 102-suite regression. It was run on the navigation candidate, and payload 3 changes only `sources.html`, `REGISTER.md`, one link in `tides.html` and new tool and record files; every suite that reads those was rerun above. Model and preview evidence is carried forward by the hashes in section 1.
- **Known on main, not new:** `place-ui` 1, `timeline-finds-ui` 4, `osmc-reliability-ui` 1 and `timeline-mixed-assets` 2 failures stay as recorded in the navigation packet. **The regression is not fully green.**

## 6. Release plan, on Chad's own Approve line naming the final commit

1. If main has moved, merge it again and state the delta first.
2. Merge `tides-nav-rc` to main with `--no-ff`. Page only: no hub, Worker, R2 or collector change.
3. Run the manifest check from a browser-pane tab on the live site; all 37 files must match.
4. Live read of `tides.html`, the Tides tab on two other pages, and `sources.html#tides`.
5. Record the release:
   - **REGISTER:** status line to "released" with the merge commit.
   - **START-HERE:** live-page line and served-file count 37.
   - **STATUS and HANDOVER.**
6. Close out: Mac `_review/` copies to `_to_delete/`, delete the merged `tides-rc` and `tides-nav-rc` branches, sync the Mac.

## 7. Still not verified

A real phone, Safari, a screen reader and loading over a real network. The six-tab header is verified; a seven-tab header with Earth from Space is not, and is that work's to measure.
