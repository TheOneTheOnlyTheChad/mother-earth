# Mother Earth — handover to thread 8 (3 Nov 2026, end of thread 7)

Read `START-HERE.md` (§2 constitution · §4 deploy — API method first · §5a testing), then this file, then `STATUS.md` (newest sections first). Not a fresh sandbox: nothing below needs re-investigating.

---

## 0. State in one paragraph

**Satellites are public and deployed** (page `main`, assets `?v=202611031600`): own card at the bottom of the right column, off on load, CelesTrak "active" set (16,848 objects) propagated in the browser from the hub's validated file. **Hub = collector 0.2.2, deployed**, `SATELLITES_ENABLED=1` (satellites job on odd UTC hours at `:07`). **Scheduled refresh: both slots so far refused** — 05:08:10 and 07:08:01 UTC, CelesTrak stamp page **HTTP 522**, no data request made, no retry. **Checked 07:47 UTC: the last good snapshot kept serving with its original times** — retrieved 04:12:23 UTC, CelesTrak source stamp 02:15:09 UTC, `latest/satellites-elements-067d2c65d883.csv`, 16,848 rows, 2,490,850 B, `X-Elements-SHA256` matches meta. **Next slot 09:07 UTC — thread 8 verifies it** (§2 item 1). **Aircraft is built but NOT public / not deployed** (branch `aircraft-rc` `67c98e3`). **Orbital layers: measured and benchmarked, nothing built, nothing deployed.** Mac collector unchanged (`mac-0.3.2`). Retention unchanged by decision.

**What is NOT deployed (thread 8 owns these, each only with Chad's explicit go):** aircraft (merge `aircraft-rc` + Mac schedule), the orbital hub job (a new Worker version) and the orbital page (replaces the Satellites toggle). Satellites itself needs no deployment.

## 0a. Access — Chad has given us everything

Chad has granted access to GitHub (push), Cloudflare (dashboard session in the pane), Space-Track (his account), his Mac folder and the browser pane. **If anything needs logging in again: open the browser pane and ask — Chad logs in himself, or pastes keys for you to add (Cloudflare secrets he enters himself in the dashboard form).** Claude never creates accounts and never types passwords.

- **GitHub:** `add_repo` (push) → `git clone --depth 1 … /home/claude/mother-earth`. **Pushing `main` publishes the page** — unreleased page work goes on a branch. Shallow clone: fetch a branch as `git fetch origin <b>:refs/remotes/origin/<b>` before `--force-with-lease`.
- **Chad's Mac:** remote-device tools; `~/Documents/Mother Earth/` needs one folder prompt per thread. `device_bash` there CAN reach `raw.githubusercontent.com` (sync by `curl` from a commit, then `shasum`) but NOT the hub or celestrak.
- **Browser pane:** signed in to Cloudflare, Space-Track, claude.ai. Reaches hub, CelesTrak, Space-Track, raw.githubusercontent.com, github.io. **It only draws (requestAnimationFrame) while displayed** — if a check stalls, `tabs_context` says "hidden"; ask Chad to show it. Sending Chad files/screenshots (SendUserFile render) hides the pane.
- **Space-Track:** a page-script `fetch` returns an **empty HTTP 200** (twice, 06:13 and 07:13 UTC); Chad's **address-bar** request worked (~07:31). GP ≤ 1/hour at an off-peak minute (10–20 min either side of :00/:30), no retries inside a slot.
- **Cloudflare deploys:** dashboard API from a `dash.cloudflare.com` tab (START-HERE §4) — code-only `PUT …/content`, file pulled from GitHub by commit + hash check. **Needs Chad's explicit go each time.** Plain-text variables via Settings → Variables and Secrets form; secrets Chad enters himself. ADMIN_KEY is in KEYS.md line 8.
- **Test toolchain (container):** `/home/claude/spike` (npm: globe.gl@2.45.0, satellite.js@6.0.2, pngjs, astronomy-engine); Playwright via `NODE_PATH=/opt/npm-tools/node_modules`; serve the clone with `python3 -m http.server 8899 --bind 127.0.0.1` **in the same command** as the test. The frozen CelesTrak CSV for the satellite suites is in `~/Documents/Mother Earth/bench-private/celestrak-active-gp.csv`.

## 1. Where things are

| | |
|---|---|
| Page | https://theonetheonlythechad.github.io/mother-earth/ · `main` · assets `?v=202611031600` |
| Hub | https://mother-earth.chadoberholzer.workers.dev · collector **0.2.2** · `SATELLITES_ENABLED=1` · `/snapshot/satellites`, `/elements/satellites` |
| Satellite storage | ONE current file `latest/satellites-elements-<sha12>.csv` + `latest/satellites.json` + `state/satellites.json` (new file → meta → delete previous; failure keeps last good) |
| Aircraft RC | branch `aircraft-rc` `67c98e3` |
| **Orbital spec** | `docs/SPEC-orbital-layers.md` (Chad's 4 decisions, measured numbers, next steps) |
| **Orbital benchmark** | branch `bench-orbital` `594aae2`: `phase1/bench-orbital.html` (1.1), results `phase1/bench-orbital-results-2026-11-03.json`, **quoted-CSV regression test `phase1/bench-orbital-unquote.test.mjs`** (keep it; shown to fail on a broken unquote). Mac copies in `bench-private/thread7/`. |
| **Orbital sample (saved)** | Space-Track GP file on Chad's Mac: `~/Downloads/st_chadoberholzer@gmail_com_20261103_8580102.csv`, **18,849,484 B, sha256 `fa260337b74d…4de1c0`** (also in the pane's IndexedDB `orb-bench` on the github.io origin, with the CelesTrak status map). Ask Chad to move it into `bench-private/` (Downloads isn't a connected folder). CelesTrak SATCAT used: `pub/satcat.csv`, 6,789,639 B, Last-Modified 1 Nov 20:27:36 GMT. |
| Bench evidence (satellites) | `~/Documents/Mother Earth/bench-private/thread7/` (hash-verified) |
| Tests | `satellites-hub.test.mjs` (12) · `satellites-ui.test.cjs` (66) · aircraft-rc: `aircraft.test.mjs` (5), `toggles-ui.test.cjs` (25) · bench-orbital: `bench-orbital-unquote.test.mjs` · search/solar/terminator/duration suites, all green 3 Nov |

## 2. Open — next actions in order

| # | Item | Next step |
|---|---|---|
| 1 | **Satellites scheduled refresh: 522 at 05:08 and 07:08** | **Verify the 09:07 UTC slot** in `/status` (`last_runs`, layer satellites) and `/snapshot/satellites`. Success → new `retrieved_at`/`source_stamp`, one element file only. 522 again → three of three refused; offer Chad: fetch from the Mac (like ships) and post to the hub, or Space-Track from the hub if item 2 shows it's reachable. Never retry inside a slot. Last good snapshot keeps serving meanwhile (confirmed 07:47). |
| 2 | **Orbital layers** | Measured + benchmarked (see below). **Next: ONE bounded Space-Track reachability and authentication check from the hub** — login + one GP request inside the rules; **no schedule, no public change**. Chad enters the login directly as Worker secrets. If refused (as CelesTrak/OpenSky were), the Mac fetches and posts. Then hub job (classify in hub, one current file + class column + counts, 2-h cadence), then page (three toggles). **Today's Satellites toggle stays live until the replacement passes end-to-end checks.** |
| 3 | **Aircraft to public** | Chad checks the exact OpenSky wording against our setup (only wording on record: ticket #837506, 30 Oct — hobbyist use within credits; public site must also feed the network; no cloud whitelisting). Then: feeder decision if still required; Mac schedule for `collector-mac.mjs opensky` within credits (posts to `/ingest/opensky`); REGISTER row; merge `aircraft-rc`. |
| 4 | Retention | Chad handles separately (incl. provider emails). **Do not change retention without him.** STATUS has the read-from-code audit. |
| 5 | Existing page ~30 fps / slow heap growth | Separate investigation of today's layers. Not a satellite issue. (Bench pane ran at 60 Hz on 3 Nov.) |
| 6 | Unchanged from thread 6 | FIRMS CPU attribution, CO₂ truncated-200 guard, physical long-sleep test, Galaxy/phones, cables licence. |

**Orbital numbers (keep the distinctions exact):** Space-Track GP 32,517 objects, 18.8 MB, 10-day element filter (older elements filtered upstream, outside these counts). By type: payloads 18,954 · rocket bodies 2,205 · debris 10,124 · unknown 1,234. Payload status match (CelesTrak SATCAT) 18,951 / 18,954 = 99.98 %. Classes: active 16,204 · inactive payloads 1,385 · rocket bodies 2,205 · **debris 10,124 classified, 10,123 drawn in the benchmark (1 propagation failure)** · **2,599 excluded for classification or catalogue-match reasons** (unknown type 1,234 + payload status blank 1,362 + no catalogue match 3). **The combined view matched the baseline at the display's 60 Hz cap on the tested setup** (frame median/p95 16.7/16.8 ms with and without; worker pass ~56 ms; C1–C5 pass, valid). First run was invalid (quoted-CSV bench defect, fixed in 1.1).

## 2a. Backlog — outside the orbital scope

- **Ocean plastic.** First step: ONE NOAA Marine Microplastics export — check its reuse terms, then plot dated surface-water samples with their units and sampling method (observations, not a model; no gap-filling).
- **NOAA ocean drifter tracks** — a separate possible layer showing how surface water moves. Not part of the plastic layer.

## 3. Rules that came out of thread 7

- **Independent optional layers:** satellites, aircraft and the future orbital layers are separate toggles, **off on a fresh load**, no requests while off, each toggle touches only its own layer. Test both off / each alone / combinations / all off.
- **Storage (MVP, $0):** one current validated snapshot per replaceable feed; publish new with matching metadata before deleting the previous; failures keep the last good snapshot with original times; no temp files. Flag anything the site relies on before changing retention.
- **Reuse wording:** record published policies + remaining uncertainty + the decision; never describe uncertainty as a licence grant; no commercial-use assumption.
- **A test suite must be shown to fail** on a deliberate break before its green result counts.
- **Unknown status never becomes "inactive"**; say "catalogued as active".

## 4. Standing rules (unchanged)

The promise verbatim; the constitution (START-HERE §2); observations, models and computed context stay distinguishable; no inferred causes, no invented zeros; every source's commercial standing in REGISTER before it goes live; $0/month with named triggers; measure, don't assume; bound every test; baby steps; Chad pastes secrets himself; every Cloudflare deploy needs Chad's explicit go.
