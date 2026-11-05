# Mother Earth — status

Newest first. Threads 1–13 are in `docs/STATUS-ARCHIVE.md` (moved verbatim 5 Nov). Current state and next steps: `HANDOVER.md`.

# 5 Nov 2026 — thread 15

## History trial — ON since 10:21 UTC (Chad's go)
`HISTORY_ENABLED=1` (plain text, Production). Claude filled the form; Chad clicked "Add 1 variable and deploy" (the session's safety check blocks Claude from production-deploy clicks). Verified 10:21: 17 bindings, hub still **0.5.1**, `history.collecting:true`, `archive_health` empty. **Chad, 5 Nov: keep it on — the full day is the test.** To stop: remove the variable (Chad's click); retained history is not deleted.

**CPU per tick (invocation log, CPU / wall), history on vs off:**
| job | history on (5 Nov) | history off (reference) |
|---|---|---|
| usgs (*/5) | 9–14 ms | 6 ms (08:30) |
| firms (*/15) | 124 ms 10:30 · 190 ms 11:00 · 126 ms 12:00 (grows with the day's file) | 107 ms (08:30) |
| hourly (:07) | 82 ms / 15.2 s (11:08) · 84 ms / 17.1 s (12:08) | — |
| forest + orbital (11:41, odd hour) | 184 ms / 72.4 s | 173 ms (3 Nov) |
| forest alone (12:11) | 28 ms | — |
All outcomes ok.

**What was written (D1 at 12:14 UTC):**
- `quake_revisions` 42 — 30 on the first run, then only new quakes and revisions (e.g. us7000tw7b automatic → reviewed at 10:30).
- `drifter_fixes` 2,491 — 1,304 (11:08) + 1,187 (12:08; 1,304 buoys reported, only new buoy-fix pairs written). **Early rate ≈ 1,200 rows/hour ⇒ up to ~29,000/day if it holds** (top of the 1,300–31,000 range). Full-day rows + bytes at the midnight read.
- `archive_versions` 2 — co2 "first" (3,284 B gz; unchanged at 12:07 → same row, `retrievals: 2`, nothing new stored) and orbital "first" (1,220 B).
- `orbital_population` 1 — 32,584 objects (payload 19,675 · rocket body 2,207 · debris 10,163 · unknown type 539; elements sha `3bfcf743…`).
- `history_activity` 2 — firms + usgs for 5 Nov.
- `archive_checkpoints`, `fires_daily`, `seaice_daily`, `archive_gaps` 0 — none due yet.
- R2 `archive/`: 2 objects, ≈ 4.5 KB. Hub report: retained since 10:25:08 UTC; `archive_health` pending / gaps / failures empty at every read.

**Still to see:** `seaice_daily` at 15:07 UTC; **first midnight checkpoint 00:30 UTC 6 Nov** (firms + usgs: `archive_checkpoints`, `fires_daily`); **drifter rows/day + bytes** (5 Nov is partial — from 10:21); plastic's first version with its next daily run ~05:07–06:07 UTC 6 Nov (its 5 Nov run was 09:07, before history was on). Read-only checks are scheduled in the session at 15:12 and 00:50 UTC.

## Page cleanup published — main `bd17401`, assets `?v=202611121000` (Chad's go)
- Removed the unreachable `'no history kept'` fallback (inspector Comparison row in `index.html`, Sources t-cmp in `sources.html`). A missing kept statement now adds nothing rather than an absolute claim. Visible text is unchanged today (every layer has a kept line).
- `kept-ui` +2 checks (21): every layer with a Comparison line has a kept statement; no "no history kept" text. Shown to fail when ships' line is removed (removing sea ice's does not — its history line still supplies text).
- Tests: kept-ui 21 · place-ui 30 · place-rows 7 · history-hub 27 · ux-round1 34 · mobile-pass 131 · drifters-ui 25 · plastic-ui 29 · search-ui 104 · terminator-ui 19.

## orbital-browser — 2 pre-existing failures fixed (test only; main `66c1a8c` + `e5bac15`)
- Cause: the reference counted stale over all rows; the page's worker over objects whose elements initialise successfully. The fixture's epochs are pinned to 3 Nov 13:00 and the suite runs on the wall clock; by 5 Nov 6 payload + 6 debris init failures were past 3 days (rocket bodies 0) — exactly the 6/6 gap. Fix: the reference uses the worker's definition. **Stale and failed are not mutually exclusive** (an object that initialises but fails propagation can be in both — GPT's correction). 105/105; still fails on `draws-all-groups` (6) and a stale threshold one day short (3). GPT agreed; Chad's go.
- Open: shared fixed calculation time for browser + reference, with cases either side of the 3-day boundary; real timers kept (GPT).

## Research backlog — `docs/RESEARCH-BACKLOG.md` (research only)
R1 Schumann resonance / ELF; R2–R9 from GPT's source checks (first: CNEOS fireballs, USNO/IERS Earth rotation, Argo; next: Coral Reef Watch, Ozone Watch, CO-OPS water level; later: GloTEC, NMDB). One first gate for all. No build, collector, schedule, deploy, purchase or third-party contact.

# Mother Earth — status (5 Nov 2026 — thread 14 close)

## 5 Nov 09:41 UTC — **PAGE RELEASE PUBLISHED; HISTORY OFF; TRIAL PENDING.** Chad's go, after GPT's review.
- **Published:** main = **`8c8633d`** (fast-forward from `da22513`, 09:39:07 UTC), assets **`?v=202611111000`**; served files hash-equal to the commit (index `bdc44df5d2e6`, app `fc2133f7f088`, style `e10935d03acb`, sources `dd2e63e59484`). New public: the **place view** ("Everything here" from any cell or any globe point) and **"What Mother Earth keeps" following the hub** (collecting now / retained, never "none" when unknown); the Sources `fill()` refresh fix; the desktop-overflow fix (published earlier, `3a2fcb2`).
- **Hub 0.5.1** (`8c8633d`) since 09:28 UTC; **9 history tables + 8 indexes** in D1 since 09:28 UTC (empty). **`HISTORY_ENABLED` absent.** Hub reports `history: {collecting:false, retained:{exists:false}}`; `/status` → `archive_health` all empty; 0 history rows; 0 `archive/` objects (09:41 UTC).
- **Public checks:** candidate report §11 (globe, place panel, panel-only loading, phone layout, retention wording).
- **Tests:** Claude: history-hub 27/27, kept-ui 19/19, place-ui 30/30, place-rows 7/7 + all regressions. GPT independently: 27/27 + six retention-state checks on `8c8633d`. **orbital-browser: 2 pre-existing failures** (same on main), open.
- **Next:** HANDOVER §1. The history trial waits for **Chad's separate go**.

# Mother Earth — status (5 Nov 2026 — thread 14, continued)

## 5 Nov 09:28 UTC — **HISTORY TABLES CREATED + HUB 0.5.1 DEPLOYED, HISTORY OFF.** Chad's go, after GPT's re-check of `8c8633d`.
- D1: 9 tables + 8 indexes from `8c8633d` (17 statements, all ok); live schema = commit (9/9 via `PRAGMA table_info`); all empty.
- Hub 0.5.1 (`8c8633d`, sha256 `1f34554b2e53…`), content-only; 16 bindings, no `HISTORY_ENABLED`. `/` + `/status` 0.5.1; history `collecting:false, retained:{exists:false}`; `archive_health` empty; `/place` ok (all sections same-run).
- First scheduled runs 09:30 (usgs ok 29, firms ok 20,332): 0 history rows, 0 `archive/` objects, no failures; snapshots now carry `retrieved_at` metadata.
- Page release (place view + hub-driven retention wording) live-RC-checked against 0.5.1 — candidate report §10. **Next:** GPT reviews the page release → Chad's go to publish (merge `place-view` → main) **before** the history trial (GPT's separate go).

## 5 Nov 08:27 UTC — **HUB 0.5.0 DEPLOYED, HISTORY OFF.** Chad's go: "if you ready you can deploy" (read as step 2 only).
- **What:** `place-view` commit `482ffb0`, worker.js sha256 `311455d37e1c…` (checked against GitHub before upload), content-only API, HTTP 200. Bindings unchanged (16; no `HISTORY_ENABLED`). No D1 tables created, no history, page NOT published (main unchanged, `b04a930` + docs).
- **New live:** `GET /place/g4/<row>_<col>`; `GET /` reports `history: {enabled:false}`; FIRMS missing FRP → null (not 0).
- **Verified 08:27–08:33 UTC:** `/` and `/status` = 0.5.0; `/place` North Sea 35_46 (ships 873, fires 31, every section same-run), Pacific 20_0 (all no_records), plastic cell 33_46 with `?layers=plastic,drifters` (plastic 100); bad cell → 400. Collection block on real D1: ships 22/24 h usable, 75/115 aggregated h in 7 d, retention since 2026-10-31T13. First scheduled runs on 0.5.0: usgs 08:30:07 ok (29), firms 08:30:40 ok (16,639; 0 null / 0 zero FRP in this file). R2 `archive/` 0 objects, `state/history-*` 0 objects (history off writes nothing).
- **CPU (invocation log):** firms tick 107 ms (wall 4.5 s), five 6 ms; `/place` 43 ms (cold index, North Sea), 16 ms (plastic + drifters), 7 ms (Pacific); other fetches ≤ 2 ms.
- **Next (superseded 09:28 — see above):** (1) D1: create the history tables; (2) trial `HISTORY_ENABLED=1`; (3) one full UTC day measured; (4) live RC + merge `place-view` → main (publishes the place view and the hub-driven "What Mother Earth keeps").

# Mother Earth — status (5 Nov 2026 — thread 14)

## 5 Nov 03:12 UTC — **DESKTOP OVERFLOW FIX PUBLIC.** main `3a2fcb2` (fast-forward of `desktop-overflow`), assets `?v=202611081000`. Chad's go: "you can merge".
- **GPT's discrepancy resolved:** GPT could not reproduce "8 px at 1280" — correct. That figure came from the container, where Google Fonts are blocked and fallback fonts are wider. Cause: `body.world` was a grid with an implicit auto column, so the header's min-content (nowrap title + nowrap promise + clock + menu) set the page width: **1,186.6 px with the real webfonts, 1,287.6 px with fallbacks**.
- **Real bug with the real fonts, measured live on the public page before the fix at 1,101×800:** page 1,186 px wide; `overflow:hidden` meant no scrollbar — **Menu button off-screen (left edge 1,110) and not clickable; right column (Kp, CO₂, sea ice, Optional layers) clipped by 86 px**. Affected every desktop width 1,101–~1,186 (and up to 1,288 when webfonts fail).
- **Fix (CSS only):** `body.world` gets `grid-template-columns:minmax(0,1fr)`; the promise is no longer nowrap — it wraps to at most 2 lines (`line-clamp:2`), wording verbatim, never an ellipsis. Header stays 56 px.
- **Tests:** new `node phase1/desktop-overflow.test.cjs` — 8 widths (1,101–1,920) × real fonts (npm `@fontsource`, served in place of Google Fonts) and fallback fonts: **112/0 on the fix, 20 FAIL on main**. `mobile-pass` no longer exempts 1280 (131/0). Regressions: ux-round1 34 · plastic-ui 29 · drifters-ui 25 · search-ui 104 · terminator-ui 19 · terminator-behaviour 47 · orbital-ui 38 · search 111 · real-data 50 · solar 26 — all pass. **orbital-browser 103/2 — the same 2 fail on main** (`B payload/debris alone: stale and beyond-GEO counts match the reference`); passed 105/105 in thread 9 → likely time-dependent fixture; separate test item.
- **Live RC (clean session, branch files sha-matched `99c1749e38e7` / `77b7202d356e` / `8ec969837bc9`, real fonts):** 1,101 / 1,150 / 1,186 / 1,280 / 1,440 — page = window, Menu clickable, right column fits, promise 2 lines below ~1,190 and 1 line above, nothing cut.
- **Public check 03:12 UTC:** served hashes = branch; 1,101×800: page 1,101, Menu clickable, right column fits, promise in full.
- **GPT's live check (5 Nov, before this fix):** mobile pass verified on the public site (Key, focus, 6→9 count staging, plastic LOADED 1,145, buoys 1,302, 844×390 controls); disclosure text readable but small — **do not shrink further**; all three orbital categories crowd a small globe (known).
- **Open:** Mac copies of STATUS/HANDOVER/START-HERE not synced this thread (folder not granted). Leftover branch `desktop-overflow` (= main).
