# Global Wind by Height — build proposal for a private preview (rev 1)

16 Nov 2026 · docs only · nothing built · no branch, hub deploy, flag, schedule, R2 write, REGISTER filing or page change is approved by this document
**For:** GPT's review, then Chad's decisions (§9).
**Rests on:** `docs/concepts/GLOBAL-WIND-PROPOSAL.md` rev 2 (what the layer is; §11 governs), `docs/research/GLOBAL-WIND-GATE-2026-11-16.md` (§1–§7 the gate, §8 decoder rev 2, §10–§11 the Worker probe), and GPT's review of the probe (relayed by Chad, 16 Nov): "the probe is enough to propose a private preview with the collector in the hub code and the wind layer on a branch."
**Main:** `4ab698f`. Page merge `9e9769c`, hub 0.6.15.

## 1. What the preview is

**One end-to-end private run at the centre** (GPT): the hub fetches a real run, publishes one complete revision to R2, and the branch page draws it at three heights. The same preview then runs on a schedule for several days to test repeats, recovery and arrival times.

**What "private" can and cannot mean here.** There is one hub and it is the production hub; there is no private hub environment. The proposal follows the Dust RGB pattern (12–13 Nov):
- The collector ships inside the hub file but is **gated by `WIND_ENABLED`**. Absent means no request to NOAA at all.
- The page layer lives **only on a branch**. Nothing on main names wind, so the live site shows nothing.
- **Not private:** once a revision is published, its files can be fetched from the hub by anyone who knows the address, and the branch is in the public repo. That makes the hub a redistributor of NOAA-derived data from the first published revision. So **the reuse terms are read before the first hub run** (§7), not left to release time.

## 2. Hub (would be 0.6.16)

- **Job `wind`,** run last inside the existing hourly job (as Dust RGB, Sky spacecraft and Sun face are), each scheduled hour, and by `/admin/run/wind`. One guarded step; a failure never affects the other jobs.
- **Each run:** look for the newest run whose `f000` index exists on the mirror (newest first, back four runs). If it is not newer than the published one, stop: one small request. Otherwise fetch the six fields by range, exactly as the probe did: one host, each response refused before its body is read unless it is `206` with the exact range, length and ETag.
- **Decoder:** `gribwind.mjs` rev 2, unchanged, in the hub file. One field at a time. `decodeWindBatch` rules: exactly six expected fields of one run, or nothing.
- **Unsupported packing or any refusal is a clear named failure.** The last good revision stays published. Nothing is repaired or guessed.
- **A skipped run is not an error.** The job always goes to the newest available run; a missed or failed run is simply passed over when the next complete one arrives.
- **Limits:** the hourly schedule has the 15-minute CPU allowance (START-HERE §4a); the probe used 1.1 s. Memory is shared with the rest of the hourly job in one invocation; the preview watches for any over-limit outcome.
- **Log, one row a run** (run notes, D1): run found, first-seen time of its index, bytes, requests, outcome, publish time. CPU and wall time come from Cloudflare's invocation log.

## 3. R2 publication

- **Keys:** `wind/rev/<YYYYMMDDHH>/near-ground.i16`, `250hPa.i16`, `10hPa.i16` (260,640 bytes each) and `wind/current.json` (the manifest). Outside the hub's generic layers, cells, history and health, as Dust RGB is.
- **Order:** write the three grids; read each back and check its SHA-256 against what was computed; only then write the manifest. **Readers only ever follow the manifest,** so they see a complete revision or the previous one.
- **Manifest:** schema version, revision, run time, valid time, source and display grid, reduction method, per-level file, bytes and SHA-256, the six message hashes, index-first-seen, retrieval and publication times.
- **A late run never replaces a newer one:** the manifest is written only if the run is newer than the manifest read at the start, and with R2's conditional write on that manifest's ETag, so two overlapping runs cannot both win.
- **Interrupted write:** grids without a manifest are harmless leftovers; the next run overwrites or removes them.
- **Kept:** current and previous revision (about 0.8 MB each). Older ones removed by the job after a successful publish.
- **Served:** `/snapshot/wind/meta` and `/snapshot/wind/<revision>/<level>.i16`, for the current or previous revision only, immutable caching on the grid files.

## 4. Page (branch `wind-rc`)

- **New file `wind.js`,** an optional layer, off on load. No wind request while it is off.
- **Drawn as its own transparent sheet over the globe,** the way Ocean Heat and Dust RGB are. It does not use the globe's picture, so it cannot collide with Night lights or the daylight picture.
- **One canvas carries both the colour field and the static arrows.** Arrows are thinned to a fixed spacing. No moving particles in this preview's default; a particle trial is a separate, later item.
- **One fixed, non-linear km/h colour scale across all three heights,** chosen in the preview from the real revisions and then frozen. Legend beside the layer.
- **Three heights** on one control. Switching keeps the camera, the selected point and the revision; field, card, legend and inspector are written from the grid actually drawn. A late answer for a superseded choice is dropped.
- **Inspector and wording** as proposal rev 2 §5 and §11.4: "Modelled wind · NOAA GFS · Valid at …"; from-bearing and km/h; "calm" under 1 km/h; "No model value here"; speed only at an exact pole.
- **Age, its own calculation from valid time** (not the page's fetched-time check). The 24-hour hide limit applies. The stale line is **not set**: until it is, a field between the newest expected age and 24 hours carries its valid time and age in plain words, and no "Stale" label is invented.
- **Desktop Chrome only.** Keyboard and reduced-motion checks stay. Phone, Safari and screen reader deferred (Chad, 16 Nov).

## 5. What the preview must prove (GPT's five areas)

| Area | How |
|---|---|
| Another NOAA run | The first hub run is a different run, and in time a different UTC slot, from the gate's. For that same run Claude fetches the six messages again through Chad's Chrome, decodes with ecCodes, and compares the three grid hashes with the hub's. A truly different packing remains untested until NOAA sends one. |
| Scheduled hub execution | Several days on the hourly schedule alongside the hub's other jobs. CPU, wall, bytes and outcome per run from the logs. An upstream failure and a missed run are exercised in the suite with breaks, and any real ones are recorded. |
| R2 publication | Suite cases for: hash mismatch on read-back, interruption between grids and manifest, two overlapping runs, an older run finishing late. |
| Freshness | From the run log: when each run's index was first seen and when its revision was published, across all four UTC slots over several days. Hourly polling delay is part of the figure. The stale line is proposed only after that. |
| Globe and reuse | Desktop checks of the three heights, the fixed scale, arrows, the date line, both poles, calm, missing and aged states, and height switching. Terms per §7. |

## 6. Tests on the branch

- `gribwind` suite: the gate's comparison against ecCodes for the recorded run, and the 25 refusals.
- Hub suite with breaks: run selection, range refusals, batch rules, publication order, conditional manifest, late and overlapping runs, cleanup, routes.
- Page suite with breaks, in the style of `night-lights-ui`: no request while off, level switching, superseded answers, age wording, inspector rules.
- Existing suites rerun; frame time with the layer on against the 11 Nov globe figures.

## 7. Terms, read first

Before any hub run: read NOAA's own pages for reuse of GFS output and the mirror's terms, and draft the REGISTER entry (attribution wording, commercial standing). If they do not clearly allow the hub to serve derived grids, stop and report. The REGISTER filing itself is its own Approve line.

## 8. Stages and approvals

1. **Branch build** (`wind-rc`: hub code, page, suites) and the terms read. Chad's "go". Nothing reaches the hub or main.
2. **GPT's review of the branch.**
3. **Hub 0.6.16 deploy with `WIND_ENABLED` unset.** Own Approve line. No NOAA request yet.
4. **One manual run** (`/admin/run/wind`): the first published revision. Own Approve line. Then the end-to-end check: the branch page, served from the Mac `_review/` copy, draws it; Claude's ecCodes comparison for that run.
5. **Schedule on** (`WIND_ENABLED=1`; the settings click is Chad's). Own Approve line. Several days of measurement.
6. **Chad's look and GPT's review of the preview results;** stale line and colour scale proposed.
7. **Release** is a later proposal: REGISTER filing and page merge, each its own Approve line.

**Rollback at any stage:** unset `WIND_ENABLED` (no further requests); redeploy 0.6.15; the `wind/` keys can be removed on Chad's word. The page on main is untouched until stage 7.

## 9. Decisions (Chad's; GPT's view asked on each)

- **B1.** Accept that published revisions are fetchable by address from stage 4, given the terms are read first (§1, §7). The alternative is a second, separate Worker with its own storage, which would not test the hub's own schedule.
- **B2.** Poll once an hour inside the hourly job. Simple; adds up to an hour to the age. A shorter poll is possible later if the arrival figures ask for it.
- **B3.** Point sampling for the 1° grids, as tested in the gate. Averaging stays untested.
- **B4.** Colour and arrows on one sheet; no particles in this preview.
- **B5.** Keep two revisions.
- **B6.** Go for stage 1.

## 10. Out of scope

Particles, forecast hours, gusts, history, finer zoom, the place view, phone and Safari, any public release.
