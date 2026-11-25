# Tides navigation candidate (`tides-nav-rc` `20aa48a`) for GPT's review

**25 Nov 2026, 18:12 UTC (clock reading). Branch only: nothing merged, nothing live, no hub, Worker or R2 change.** On Chad's own line, 25 Nov: "I'm happy with the preview and accept the 1,364,086-byte image total, 14% above the target. Keep the pictures as they are. Go for the navigation candidate, including the top Tides tab and relevant layout/regression checks. Return it for GPT review. No merge or deployment yet." GPT's round-2 recheck (PASS for the unlinked preview) is filed unchanged as `reviews/2026-11-25-tides-rc-round2-gpt-recheck.md` (sha256 `cf357030…1a32`, relayed by Chad).

## 1. The branch

`tides-nav-rc` = the reviewed preview `tides-rc` `e8978e2` (page `7c3e2af`) + current main `a84a642` merged in (STATUS conflict taken from main; no other conflict) + these commits:

| Commit | What |
|---|---|
| `1784a71` payload 1 | Tides tab (after Sun) and Tides Menu item on all seven pages (`tides.html` marks its own); six-tab header rules in `style.css` inside one marked block (`/* TIDES-NAV:BEGIN … END */`); World View's promise text wrapped in a `<span>` so it is shown only where its two full lines fit (container query, measured in the promise's own font: the Earth from Space branch's mechanism); new suite `phase1/tides-nav.test.cjs`; the tab expectations moved in `tides-ui`, `timeline-ui` and `desktop-overflow`. |
| `7dfae21` | Animals suite pin maintenance, this suite only, parent = payload 1 (superseded by `b01d394`). |
| `8475452` payload 2 | One new stylesheet cache key, `202612250800`, on the six pages whose header rules changed (`index`, `sources`, `moon`, `sun`, `animals`, `tides`). Timeline keeps its own (`202612250900`), still not older, as the Timeline build rule requires. `timeline-mixed-assets` sets the TIDES-NAV block aside in its stylesheet guard. |
| `b01d394` | Animals suite: Tides pins moved to payload 2. **Only this suite; parent = payload 2.** |
| `20aa48a` | `tides-ui` T1a lists the Timeline stylesheet guard among the navigation files. |

**Tab order (Claude's choice, easy to change):** Earth now · Timeline · Moon · Sun · **Tides** · Animals. Menu: World View · Timeline · Moon · Sun · **Tides** · Animals · Sources & Details. Tides sits after Moon and Sun because it explains them together; Animals stays last.

**Existing files changed (and nothing else):** the seven pages' headers (two lines each; `index.html` also its promise wrapper), the stylesheet key on six of them, `style.css` (one added block, no main line removed or edited), and five suites that count tabs or pin files: `desktop-overflow`, `timeline-ui`, `timeline-mixed-assets` (Timeline thread's), `animals-tab-ui` (Animals owner's), `tides-ui`. No script, no hub file, no asset outside `assets/tides/`.

## 2. The header with six tabs

The tab rows were measured before any CSS change, with the real fonts and fallback fonts (Google Fonts blocked), on all seven pages:
- **Real fonts:** six tabs already fitted at every width tested (phone two-row header and the one-row header).
- **Fallback fonts:** the tab row overflowed at 320–390 px (phone), at 721–761 px (one-row header), and World View's promise was cut at 1200–1366 px.
- **Already broken on main with five tabs** (measured on `a84a642` the same way): fallback fonts at 320 px (tab row overflows), and `sources.html` at 320 px with either font (the page's content is 356 px wide, not the header).

**Rules added (TIDES-NAV block only):** compact tabs at ≤ 480 px and ≤ 420 px (with 10 px header padding), ≤ 340 px; 721–900 px and 721–760 px tighter padding and gap; the promise container rule. Five-tab rules above it are untouched.

**`phase1/tides-nav.test.cjs` (modelled on the Earth from Space branch's header suite, its own name so neither overwrites the other):** seven pages × 26 widths (World View and Tides) or 12 widths (the others) × both fonts. Per state: no sideways page scroll (one stated exception: `sources.html` at 320 px, as on main), Menu on screen and clickable, six tabs in order with Tides fifth, every tab fully inside the row and header with no clipped text, the row overlapping neither title, clock nor Menu button, the current tab marked (only it), tab touch height, header height, Menu with seven items and Tides fifth, Menu marks the current page, a clock on every page except Tides with its UTC label clear of the Menu, World View's promise whole (≤ 2 lines) or not shown, never below 1200 px. **2,882 passed.** Breaks: `no-compact` (55 fail), `no-current` (52), `menu-order` (276): 3 of 3 caught.

**Real fonts, real graphics, Chad's Mac** (browser pane, 588 × 833, Apple M3; branch `moon.html` and `style.css` from raw.githubusercontent at `1784a71`, sha256-checked, injected into a clean live-origin tab): two-row header 94 px, six tabs 93–94 px each, none clipped, page width 588 = window, Moon marked, Menu "World View · Timeline · Moon · Sun · Tides · Animals · Sources & Details".

## 3. Other threads' suites (narrow maintenance)

**Animals suite (`phase1/animals-tab-ui.test.cjs`), the same pattern as the organic-soil release:**
- New pins `TIDES_MAIN` = payload 2 `8475452` and `TIDES_PARENT` = fresh main `a84a642`; literal `TIDES_FILES` (26 paths).
- 13b `index.html` and 13e `sources.html` held byte-for-byte to `TIDES_MAIN`, **and** the step from `SOIL_MAIN` to `TIDES_MAIN` is checked to be exactly the Tides tab, the Tides Menu item, the stylesheet key and (index) the promise wrapper, so the organic-soil guarantee still holds.
- 13e `moon.html`/`sun.html` and 13h `timeline.html`: the two Tides lines set aside exactly as the Animals lines are; 13h requires them once each.
- 1h/1j: six tabs, Animals last after Moon, Sun and Tides (now also checked on `tides.html`).
- New 13o (the payload range changes exactly `TIDES_FILES`, and no app, layers, soil, Animals script or hub file) and 13p (the maintenance commit after `TIDES_MAIN` changes only this suite).
- `BASE_MAIN`, `TL_MAIN`, `NC_MAIN`, `SOIL_MAIN` do not move.
- Result: **287 passed**. Breaks on section 13, all caught: `nc-index-edited`, `nc-index-tab-gone`, `nc-index-menu-gone`, `nc-sources-edited`, `nc-sources-tab-gone`, `moon-page-edited`, `shared-rule-dropped`, `tl-page-edited`, `tl-page-animals-tab-gone`, `tl-page-header-edited`, plus three new ones (`tides-index-tab-gone`, `tides-sources-menu-gone`, `tides-tl-tab-twice`).

**Timeline:** `timeline-ui` tab expectations moved (594 pass). `timeline-mixed-assets` sets the TIDES-NAV block aside in its "other pages laid out identically under the old stylesheet" guard; without that, it failed on the header elements only (2–11 per page). With it: 16 pass, 2 fail, **the same two failures as on main** (`animals.html`, 205 elements, both widths). `timeline-changes-build`: **49 passed**; its stylesheet-key check failed on main (index and sources had different keys) and passes here.

## 4. Full regression (cloud workspace, `serve-core-on.py` on 8899, one suite at a time)

106 test files, 4 skipped as manual or network tools; run on `b01d394` 16:32–17:44 UTC, then the changed suites rerun at the final tree (section 3 and below). Suites that did not pass, each compared with main `a84a642` in the same container:

| Suite | Branch | Main |
|---|---|---|
| `place-ui` | 34 pass, 1 fail ("6 hub failure → Unknown") | the same check fails |
| `timeline-finds-ui` | 275 pass, 4 fail (section I, mixed released builds) | the same four fail |
| `osmc-reliability-ui` | 40 pass, 1 fail ("old page: no page errors") | known on main since 17 Nov (START-HERE) |
| `timeline-mixed-assets` | 16 pass, 2 fail after the set-aside | the same two fail |
| `nature-context-ui`, `timeline-changes-ui` | failed to start in the batch (a stray server of mine held port 8898; history too shallow) | rerun: **78 pass**; **173 pass** |

Everything else passed. At the final tree: `tides-ui` **60**, `tides-model` **42**, `tides-nav` **2,882**, `desktop-overflow` **286**, `timeline-ui` **594**, `timeline-changes-build` **49**, `animals-tab-ui` **287**, `build_tides.mjs --check` and `check_sun_reference.py --check` pass.

## 5. Coordination and what is open

- **Earth from Space** (`earth-from-space-rc`, not released, not touched): its branch adds its own tab and its own header suite and is based on an older main (before the Animals tab). When it is brought up to date there will be **seven** tabs. Its sideways-scrolling tab row is not adopted here; this candidate's promise rule is the same as its. That reconciliation belongs to the Earth from Space release, and `tides-nav` is written so it can take a seventh tab.
- **For the release candidate, not done here:** REGISTER lines for the two pinned references (GIBS Earth frame with the GIBS acknowledgment; the SDO reference copy and its reading) and the Moon reuse, each on Chad's own Approve; a Tides entry on `sources.html` (the page carries its own Sources and method); served-hash checks to cover the four new page files.
- **Not verified:** a real phone, Safari, a screen reader, a real network. GPT's note kept: T9j asserts scroll and an unchanged Moon angle on a vertical swipe, not an unchanged camera.
