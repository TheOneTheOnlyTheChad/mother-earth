# Mother Earth — handover to thread 8 (3 Nov 2026, end of thread 7)

Read `START-HERE.md` (§2 constitution · §4 deploy — API method first · §5a testing), then this file, then `STATUS.md` (newest sections first). Not a fresh sandbox: nothing below needs re-investigating.

---

## 0. State in one paragraph

**Satellites are public** (page `4c974ab`+docs, assets `?v=202611031600`): its own card at the bottom of the right column, off on load, CelesTrak "active" set (16,848 objects) propagated in the browser from the hub's validated file. **Hub = collector 0.2.2** with `SATELLITES_ENABLED=1` (satellites job on odd UTC hours at `:07`). **First scheduled run (05:08 UTC) failed: CelesTrak stamp page HTTP 522**; last good file (04:12 UTC) keeps serving — 07:07 slot is the next evidence (a reminder is set in thread 7; re-check it here if it hasn't been recorded). **Aircraft is built but NOT public** on branch `aircraft-rc` (`67c98e3`). Mac collector unchanged (`mac-0.3.2` running; the new `opensky` mode exists only on the branch and is never scheduled). Retention unchanged by decision.

## 0a. Access (all verified thread 7)

- **GitHub:** `add_repo` (push) → `git clone --depth 1 … /home/claude/mother-earth`. **Pushing `main` publishes the page** — unreleased page work goes on a branch. Shallow clone: fetch a branch as `git fetch origin <b>:refs/remotes/origin/<b>` before `--force-with-lease`.
- **Chad's Mac:** remote-device tools; `~/Documents/Mother Earth/` needs one folder prompt per thread. `device_bash` there CAN reach `raw.githubusercontent.com` (sync by `curl` from a commit, then `shasum`) but NOT the hub or celestrak. `device_stage_files`/`device_commit_files` were not available in thread 7; private files were moved by base64-in-command (worked, hash-verified).
- **Browser pane:** signed in to Cloudflare, Space-Track (Chad's account, created 2 Nov), claude.ai. Reaches hub, CelesTrak, Space-Track, raw.githubusercontent.com, github.io. **It only draws (requestAnimationFrame) while displayed** — if a check stalls, `tabs_context` says "hidden"; ask Chad for Cmd+Shift+B. Sending Chad screenshots/files (SendUserFile, display render) takes over the side panel and hides the pane.
- **Cloudflare deploys:** dashboard API from a `dash.cloudflare.com` tab (START-HERE §4) — code-only `PUT …/content`, file pulled from GitHub by commit + hash check. **Needs Chad's explicit go each time** (the session's safety check blocks it otherwise). Plain-text Worker variables: Settings → Variables and Secrets form, never the bindings API. ADMIN_KEY is in KEYS.md line 8.
- **Test toolchain (container):** `/home/claude/spike` (npm: globe.gl@2.45.0, satellite.js@6.0.2, pngjs, astronomy-engine); Playwright via `NODE_PATH=/opt/npm-tools/node_modules`; serve the clone with `python3 -m http.server 8899 --bind 127.0.0.1` **in the same command** as the test (backgrounded servers die between turns). The frozen CelesTrak CSV (needed by the satellite suites) is in `~/Documents/Mother Earth/bench-private/celestrak-active-gp.csv` and the private bench artifact — copy it in first.

## 1. Where things are

| | |
|---|---|
| Page | https://theonetheonlythechad.github.io/mother-earth/ · `main` · assets `?v=202611031600` |
| Hub | https://mother-earth.chadoberholzer.workers.dev · collector **0.2.2** · `SATELLITES_ENABLED=1` · endpoints add `/snapshot/satellites`, `/elements/satellites` |
| Satellite storage | ONE current file `latest/satellites-elements-<sha12>.csv` + `latest/satellites.json` + `state/satellites.json` (new file → meta → delete previous; failure keeps last good) |
| Aircraft RC | branch `aircraft-rc` `67c98e3`; Mac copy `~/Documents/Mother Earth/aircraft-rc/` (pre-rebase files — refresh from the branch) |
| Bench evidence | `~/Documents/Mother Earth/bench-private/thread7/` (hash-verified) |
| Tests | `phase1/satellites-hub.test.mjs` (12) · `satellites-ui.test.cjs` (66) · on aircraft-rc: `aircraft.test.mjs` (5), `toggles-ui.test.cjs` (25) · plus search/solar/terminator/duration suites, all green 3 Nov |

## 2. Open — next actions in order

| # | Item | Next step |
|---|---|---|
| 1 | **Satellites scheduled refresh: 522 at 05:08** | Read `/status` (satellites) for the 07:07 and 09:07 slots. If they succeed → note recovered. If 522 persists → evidence that Cloudflare egress to celestrak.org is refused; options for Chad: fetch from the Mac (like ships; posts to a new ingest path) or Space-Track via Chad's account (also from the Mac if Cloudflare is refused there too). Never retry inside a slot. |
| 2 | **Debris / inactive layers (Chad's next ask, with GPT)** | Plan agreed in principle (thread 7 end): positions from Space-Track GP (all on-orbit, Chad's account, ≤ 1/h at an off-peak minute) + SATCAT object type (≤ 1/day after 17:00 UTC) → three independent toggles, all off: Active · Inactive satellites & rocket bodies · Debris. Space-Track's blanket approval covers basic data accessed via the account, with citation. **First step: ONE deliberate Space-Track query from the pane (Chad logged in) to get real counts by OBJECT_TYPE** — nothing built before that. Then: does CelesTrak's OPS_STATUS (working/dead) or an equivalent exist on Space-Track (unverified); one bounded browser re-measure at the real count (16,848 cost ~0 frame time; 30–40k unmeasured); Worker reachability to space-track.org (unmeasured). Below ~10 cm: state ESA's estimate as a number, never draw it. |
| 3 | **Aircraft to public** | Chad checks the exact OpenSky wording against our setup (only wording on record: ticket #837506, 30 Oct — hobbyist use within credits; public site must also feed the network; no cloud whitelisting). Then: feeder decision if still required; a Mac schedule for `collector-mac.mjs opensky` within credits (posts to `/ingest/opensky`); REGISTER row; merge `aircraft-rc`. |
| 4 | Retention | Chad handles separately today (incl. provider emails). **Do not change retention without him.** STATUS has the read-from-code audit (page reads only `latest/*`; `cells/` feeds the hourly D1 aggregation; `snapshots/` and `raw/firms/` are read by nothing; D1 aggregates = phase-3 baseline). |
| 5 | Existing page ~30 fps / slow heap growth | Separate investigation of today's layers. Not a satellite issue. |
| 6 | Unchanged from thread 6 | FIRMS CPU attribution (invocation logs ARE on — read CPU for `*/15` and the satellites job), CO₂ truncated-200 guard, physical long-sleep test, Galaxy/phones, cables licence. |

## 3. Rules that came out of thread 7

- **Independent optional layers:** satellites and aircraft (and any future debris layers) are separate toggles, **off on a fresh load**, no requests while off, each toggle touches only its own layer. Test both off / each alone / both on / both off.
- **Storage (MVP, $0):** one current validated snapshot per replaceable feed; publish new with matching metadata before deleting the previous; failures keep the last good snapshot with original times; no temp files. Flag anything the site relies on before changing retention.
- **Reuse wording:** record published policies + remaining uncertainty + the decision; never describe uncertainty as a licence grant; no commercial-use assumption. Space-Track direct is the documented, cleanest basis.
- **A test suite must be shown to fail** on a deliberate break before its green result counts.

## 4. Standing rules (unchanged)

The promise verbatim; the constitution (START-HERE §2); observations, models and computed context stay distinguishable; no inferred causes, no invented zeros; every source's commercial standing in REGISTER before it goes live; $0/month with named triggers; measure, don't assume; bound every test; baby steps; Chad pastes secrets himself.
