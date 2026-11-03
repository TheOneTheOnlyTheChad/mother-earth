# Mother Earth — handover to thread 9 (3 Nov 2026, end of thread 8)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4a measuring CPU · §5a testing), then this file, then `STATUS.md` (newest first). Not a fresh sandbox: nothing below needs re-investigating.

## 0. State in one paragraph
**Hub = collector 0.3.0 on Workers Paid ($5/month, enabled by Chad 3 Nov).** The **orbital job is live and verified**: Space-Track GP (Chad's account, secrets `SPACETRACK_USER`/`SPACETRACK_PASS`), trimmed to 18 columns with the documented `predicates/` operator, runs at **:41 in odd UTC hours** on the existing `11,41` cron, gated by `ORBITAL_ENABLED=1`. First scheduled run (13:41 tick) **ok**: served `/snapshot/orbital` retrieved 13:42:31 UTC, 32,509 objects (payload 18,954 · rocket body 2,205 · debris 10,118 · unknown type 1,232), 6,206,440 B, served sha = published sha. **Nothing on the page reads it yet.** The orbital **panel logic** is on branch **`orbital-rc`** (`acaccbb`, 32/32); the **renderer is not built**. **Satellites toggle unchanged and live** (CelesTrak refreshed ok at 13:08 after three 522s). Aircraft still on `aircraft-rc`, not public. Retention unchanged.

## 1. Thread 9's job (Chad agreed the order)
1. **Orbital renderer on `orbital-rc`** — reuse the satellites design exactly (worker propagation every 2 s only while something is on and the tab is visible; one particle layer **per toggle**, created once, positions written in place, `visible` toggled, never re-digested; satellite.js 6.0.2 pinned, loaded in the worker only). Read `/snapshot/orbital` → `ME.orbMetaProblem` → `/elements/orbital` → checksum must equal meta → worker. The worker must carry the `CLASS` column so each object goes to `ME.orbGroupOf(cls, meta)`; `null` = counted, not drawn. Panel text from `ME.orbPanel(meta, lastRun, now)` (lastRun = the `orbital` row of `/status`).
2. **Toggles while status is pending: Payloads · Rocket bodies · Debris** (by object type). With status later: Active · Inactive & rocket bodies · Debris — `ME.orbGroups` switches automatically from `meta.classification.payload_status`.
3. **Browser tests (Playwright, container), shown to fail on deliberate breaks:** fresh load all off with zero orbital requests; each toggle alone shows only its own category (count equals that group's meta count minus propagation failures); combinations; all three on; all off stops requests/propagation; reload → all off; Satellites and observation layers unaffected; failure paths (404, checksum mismatch, worker error) reset toggles and touch nothing else. Real file: fetch `/elements/orbital` once into a fixture (no Space-Track request involved).
4. Live check on the real hub in the pane (visible), then **Chad's go** to merge — the orbital card **replaces** the Satellites card. Pushing `main` publishes the page.

## 2. Measured in thread 8 (keep the distinctions)
| | bytes | CPU fetch+stage | CPU validate+build |
|---|---|---|---|
| untrimmed (10:40, private) | 18,846,589 | 19 ms | 170 ms |
| trimmed (11:40, private) | 7,011,137 | 17 ms | 237 ms |
| scheduled (13:41 tick) | 7,010,484 | — | **173 ms for the whole invocation, shared with forest** |
- One sample each. Trimming cut upstream bytes 63 %; **no build-CPU improvement established.** The first probe (189 ms) counted lines byte by byte in JS — the 19 ms re-run supports that as its cost.
- **Completeness unverified** everywhere: Space-Track ignores `metadata/true` for CSV (docs), so no row count; a file cut cleanly between rows above the floors (≥ 20,000 rows, ≥ 90 % of previous) passes. Tested and recorded.
- Space-Track docs (signed in): `predicates/p1, p2,...` returns those columns; GP ≤ 1/hour at a random minute off :00/:30; SATCAT ≤ 1/day after 17:00 UTC.

## 3. Open decisions for Chad (do not decide for him)
- **CelesTrak operational status** (active/inactive): no published reuse statement. GPT suggests asking CelesTrak narrowly about publishing `OPS_STATUS_CODE`-derived labels and counts with attribution. Until he decides, payload status stays pending.
- **Satellites toggle** retires when the orbital view passes (his go).
- **Aircraft:** his check of OpenSky's wording (ticket #837506 is the only record).

## 4. Watch items
- Orbital runs after the forest sweep in the same tick; a sweep > ~9 min would push orbital past minute 50 and the off-peak guard would refuse that slot (down, last good kept). Measured sweeps ~1 min.
- `/admin/probe/spacetrack` (shares the hourly guard) and `/admin/probe/orbital-build` (404 with nothing staged) are still deployed; harmless; remove when convenient.
- CelesTrak 522s: cause not established (GPT: one controlled comparison at a different cron minute, log Ray ID).
- Ships "absent 0/2" rollup bug (GPT's other pick) — reproduce with the affected hours' records before changing comparison logic.

## 5. Where things are
| | |
|---|---|
| Page | `main` (public). Assets `?v=202611031600`. |
| Hub | 0.3.0, worker.js sha256 `8c4ddf06…` (`1646bbf`). Bindings: 12 (incl. `ORBITAL_ENABLED=1`, `SATELLITES_ENABLED=1`). Crons unchanged: `11,41`, `*/15`, `*/5`, `7 * * * *`. |
| Orbital endpoints | `/snapshot/orbital` (meta: counts, classification, validation.completeness, source), `/elements/orbital` (CSV + `X-Elements-SHA256`) |
| Branches | `orbital-rc` (panel logic, 32/32) · `aircraft-rc` · `bench-orbital` |
| Tests | `phase1/orbital-hub.test.mjs [trimmed.csv]` 13/13 · `phase1/orbital.test.mjs <gp.csv>` 10/10 · `phase1/spacetrack-probe.test.mjs` 11/11 · `phase1/orbital-ui.test.mjs` 32/32 (branch) · satellites-hub 12/12 · duration contract |
| Real-shaped fixture | Mac: `~/Documents/Mother Earth/bench-private/st_chadoberholzer@gmail_com_20261103_8580102.csv` (18.8 MB full GP, 3 Nov 07:31) — project to the 18 columns for hub tests |
| GPT project brief | `docs/GPT-PROJECT-BRIEF.md` (part A = GPT custom instructions; §9 checkpoint updated each handover) |
| Admin key | KEYS.md line 8 on the Mac |
