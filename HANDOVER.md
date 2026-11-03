# Mother Earth — handover to thread 9 (3 Nov 2026, end of thread 8)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4a measuring CPU · §5a testing), then this file, then `STATUS.md` (newest first). Not a fresh sandbox: nothing below needs re-investigating.

## 0. State at the end of thread 9 (3 Nov ~14:20 UTC)
Hub 0.3.0 unchanged; orbital job live (first scheduled run 13:42:31, 32,509 objects, sha `5b2aa04c…`). **Orbital renderer DONE on `orbital-rc` `936528a`** (rebased on main `919c7cb`): Payloads · Rocket bodies · Debris, replaces the Satellites card; browser suite 105/105 and shown to fail on 7 breaks; live check on the real file matched an independent calculation exactly. **Not public. Satellites toggle still live on main.** See STATUS thread 9.

## 1. Next (Chad's calls first)
1. Chad looks at the RC (pane tab `seed`, all three on; it only draws while the pane is visible) and decides the **GEO line** (STATUS finding: 968 of 1,310 "above GEO" are within 500 km of GEO height).
2. On his go: apply the GEO decision on the branch (both orbital and — if he wants — nothing else, since Satellites retires), re-run `orbital-browser.test.cjs`, merge `orbital-rc` → main (publishes; mind the ~30 min Pages lock), retire `satellites-ui.test.cjs`, public smoke test (fresh load 0 requests; each toggle; all off).
3. After release, later: SATELLITES_ENABLED / the CelesTrak job can stop (his call — schedule change needs his go); payload status source (CelesTrak) still his decision.
To re-run tests in a new container: `cd /home/claude/spike && npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine`; rebuild the fixture with the builder in STATUS thread 9 (copy committed as `phase1/orbital-fixture.build.mjs`); `python3 -m http.server 8899 --bind 127.0.0.1`.

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
