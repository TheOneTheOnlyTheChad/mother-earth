# Mother Earth — status

Newest first. Threads 1–13 are in `docs/STATUS-ARCHIVE.md` (moved verbatim 5 Nov). Current state and next steps: `HANDOVER.md`.

# 5 Nov 2026 — thread 15

## 6 Nov — firms-guard **rev 3** (`2ee3a62`) — NOT deployed
GPT confirmed rev 2's clock and truncation fixes (firms-guard 19/19, history-hub 27/27) but found the memory bench's verdict only checked survival — the hub swallows collection/checkpoint errors, so a failed checkpoint write read as "pass". Rev 3: the bench asserts every scenario's outputs (publication + record count; checkpoint marker, object, daily aggregates, coverage; backfill row; both stress collects; usgs; exact `/place` firms section + `/snapshot`; no history failures); 4 negative controls each FAIL; **real 5.3 MB + 8 MiB, 6 scenarios × 3 runs, caps 128 and 80 MB: 72/72 verified passes** (tested `worker.js` sha `70307d5fc2a9afed…`). No hub code change. Wording: an 80 MB local V8 cap is not a measured production reserve. Pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — firms-guard **rev 2** (`5570b82`) after GPT's review — NOT deployed
GPT reproduced rev 1 (firms-guard 10/10, history-hub 27/27, Node 24) and found three problems, all addressed on the branch: (1) **memory** — re-measured in the Workers runtime (workerd 2026-07-30) under a **total-heap** cap, natural GC, the real 5 Nov payload + scale-ups, 6 scenarios incl. a resident `/place` index and overlaps, 2 runs each → **limit 8 MiB** (passes everything at an 80 MB cap, 48 MB headroom); **12 MiB not supported** (two-collect case fails at 128). The rev-1 Node "retained after forced GC" figures are superseded; "transient peaks are reclaimable" withdrawn. (2) **clocks** — the day a run belongs to = scheduled time; "after the snapshot" = actual end time vs retrieval time (GPT's 23:45:40 / 23:45:00→23:46:00 case now reports 1 failure, stale). (3) **truncation** — content checks on used fields (GPT's cut-final-`D` case refused; genuine zeros kept, empty FRP → null); wording: no check proves a complete download. firms-guard **19/19**, 8 breaks each fail it; all hub regressions + place-ui pass. Bench + results in `phase1/bench-firms-memory/`. Still pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — FIRMS guard fix on branch `firms-guard` (`908ff8d`), hub 0.5.2 candidate — NOT deployed
Review: `reviews/2026-11-06-firms-guard.md` (for GPT + Chad). Limit 4 → **12 MiB**, chosen on **memory** (128 MB per isolate; held ≈ 4× file: 5.3 MB → 31 MB, 12 → 49, 16 → 62; real Worker P999 17.4 MB on ≤ 3.8 MB files) — CPU on the real 5.3 MB file 80–173 ms. Truncated rows refused. New `archive_checkpoint_coverage` table + `/status` `collection` health: every checkpoint states its input's retrieval time, latest detection, age at day end, failed runs after it and reasons; 5 Nov gets a later-assessed row (labelled). Failed runs now trigger the checkpoint step. firms-guard 10/10; 6 breaks each fail it; all hub regressions pass. **Correction:** the "00:31 firms checkpoint 243 ms" was the ships fallback in the same invocation; the firms checkpoint was written 02:16:10 on the first successful run. **Needs Chad's go:** D1 table → deploy. **Time-limited:** 5 Nov raw files expire from ~7 Nov 15:45 UTC (recovery not built).

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

**15:07–15:15 UTC read:** first **`seaice_daily`** rows (2, data date 4 Nov: N 8.241 / clim 9.935, S 15.563 / clim 17.153 M km²) + seaice version "first" (3,908 B). New versions as sources moved: orbital 13:42 and co2 14:08, each `data+processing` — expected: "processing" is our derived output (counts, cells, index), not code, so new source data changes both hashes. Totals: quake_revisions 52 · **drifter_fixes 5,863** (per hourly run 1,304 / 1,187 / 933 / 1,214 / 1,225 → mean ≈ 1,170/h ⇒ ~28,000/day if it holds) · archive_versions 5 · orbital_population 2 · seaice_daily 2. R2 `archive/` 5 objects, 12.9 KB. CPU: hourly 110 ms / 22.5 s · firms 156 ms · usgs 10–17 ms · forest 31 ms — all ok. `archive_health` empty.

**FIRST MIDNIGHT CHECKPOINT — read 6 Nov 02:47 UTC** (the 00:50 scheduled read could not run: Mac closed by plan). **The checkpoint machinery worked; the fires collection was incomplete. The full-day trial is NOT complete** (GPT review, 6 Nov — adopted).
- **Qualification of "no gaps":** `archive_health` shows no pending day, no recorded gap and no history failure. That means every due checkpoint completed — **not** that collection covered the day. Fires stopped updating after 15:30 UTC and the archive retained that stale snapshot as the day's checkpoint. Today's `archive_health` does not show this; the fix adds it (below).
- **What "15:30" is:** the checkpoint `cutoff` = the chosen snapshot's **retrieval time** (`retrieved_at` 15:30:44). The latest detection time inside it is separate and is **not** recorded in the checkpoint today; the fix records it. Source cutoff (FIRMS NRT latency) is a third, separate thing.
- **Recoverable until ~7 Nov 15:45 UTC:** each guarded run archived its raw file (`raw/firms/2026-11-05T15-45Z.csv` … `T23-45Z.csv`, 4.5–5.3 MB); raw is deleted 2 days after upload. A recovery would be a separate, explicitly recorded record — never a rewrite of the original checkpoint. **Chad's call.**
- **It recurs daily** until fixed (6 Nov expected to trip by mid-afternoon UTC).
- `archive_checkpoints` 2 for 5 Nov: **usgs** cutoff 23:55:08 · 31 records · 2,605 B gz · `snapshots/usgs/2026-11-05T23-55Z.json`. **firms** cutoff **15:30:44** · 46,009 records · 507,004 B gz · `snapshots/firms/2026-11-05T15-30Z.json`.
- `fires_daily` 555 cells for 5 Nov: 46,009 detections (day 37,899 · night 8,110), FRP present on all 46,009 (0 missing that day), max 746.34 MW.
- `archive_health`: last_completed firms + usgs 5 Nov; pending, gaps, recent_failures all empty.
- **CPU of the checkpoint ticks:** firms */15 at 00:31 — **243 ms / 67.4 s wall**; usgs */5 at 00:32 — **558 ms / 165.6 s wall** (the heaviest invocation seen; ok, within limits; wall overlaps the firms tick). Other ticks 8–27 ms.
- **⚠ FINDING — FIRMS resource guard (pre-existing, not caused by history).** From **15:45 UTC 5 Nov to midnight** every firms run was "raw archived; processing skipped: resource guard" — the raw file grew past the **4 MB guard (4,194,304 B)**: 3.8 MB at 15:30 → 5.3 MB by 22:45. So (a) the **public fires layer kept serving the 15:30 snapshot all evening** (collector shown as down with the D14 wording — honest, but stale), and (b) **the 5 Nov `fires_daily` checkpoint covers detections up to 15:30 only**; the checkpoint records its cutoff but does not say later runs were skipped. **Getting earlier each day:** first guard trip 3 Nov 21:00 (12 runs) · 4 Nov 18:30 (22) · 5 Nov 15:45 (33); none before 3 Nov (max raw 3.4–3.7 MB). The 4 MB guard dates from the Free plan (D14); on Workers Paid a 5.3 MB parse is measured at 124–243 ms CPU at 3.8 MB. **Fix needs Chad's go** (hub change): raise the guard; make a checkpoint record skipped runs after its cutoff.
- **Drifter cost item, 5 Nov (partial: 10:21–24:00, ~13.6 h): 13,440 rows**, ≈ 1.85 MB of row content (estimate from field lengths; D1 overhead not included). Hourly batches uneven (OSMC delivers in batches: ~1,200 most hours, 116–206 in some). ≈ 990 rows/h ⇒ **~23,700/day — provisional extrapolation from a partial day.** One full UTC day (6 Nov, read after 00:30 UTC 7 Nov) and preferably several different days give the operating estimate.
- **Storage now:** D1 **8.3 MB** (2.6 MB on 4 Nov, before history; includes other tables' growth) · R2 `archive/` 13 objects, 530 KB (the firms checkpoint is 507 KB of it).
- Totals: quake_revisions 121 · drifter_fixes 14,750 · fires_daily 555 · orbital_population 8 (one per odd-hour run, each a new version) · seaice_daily 2 · archive_versions 11 · checkpoints 2 · gaps 0.
- Plastic: first version still due with its next daily run (~05:07–06:07 UTC 6 Nov).

**Still to see:** **first midnight checkpoint 00:30 UTC 6 Nov** (firms + usgs: `archive_checkpoints`, `fires_daily`); **drifter rows/day + bytes** (5 Nov is partial — from 10:21); plastic's first version with its next daily run ~05:07–06:07 UTC 6 Nov (its 5 Nov run was 09:07, before history was on). Read-only checks are scheduled in the session at 15:12 and 00:50 UTC.

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
