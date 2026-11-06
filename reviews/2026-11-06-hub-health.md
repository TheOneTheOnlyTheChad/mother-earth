# Hub health for an external monitor (UptimeRobot) — branch `hub-health`, hub 0.5.3 — rev 2, 6 Nov 2026

## Rev 2 — GPT's review of rev 1 (`80a380a`)
GPT reproduced rev 1 (23/23, 12/12 breaks, 9 regressions) and ran six probes that all came back **green when they should be red**. Each is now a test (`P1`–`P6` in `health-hub.test.mjs`); **rev 1's `worker.js` fails all six** (checked by running the suite with `WORKER=` set to the rev-1 file), rev 2 passes them.
| Probe | Rev 1 | Fix in rev 2 |
|---|---|---|
| P1 corrupt coverage evidence (unparsable `cutoff`/`assessed_at`, unreadable `failure_reasons`) with `input_status = current` | 200 | Coverage evidence is validated before "current" can mean healthy: times parse and are not in the future, `failure_reasons` is a JSON list, `input_status` is `current`/`stale`, `failed_runs_after_cutoff` is a count, and "current" with failures > 0 is a contradiction → 503 |
| P2 a new gap for an old day, hidden behind five newer gaps | 200 | Recent gaps are found by **when they were recorded** (`detected_at` within 24 h, any day) in their own query; the 5-row list is display only. A gap with no readable `detected_at` counts as recent (fail closed) |
| P3 established hub loses all activity rows + yesterday's checkpoint | 200 | "Established" is decided from **independent evidence**: any checkpoint, gap or activity row before yesterday, or the layer's data table (`fires_daily` / `quake_revisions`) before yesterday. On an established hub, yesterday must have a checkpoint or a gap by 02:00 UTC, judged from those tables — not from the activity row that makes a day "due". Stated limit: if every one of those sources is lost together, the hub is indistinguishable from a new installation |
| P4 a run finished in 2099 → negative age → green | 200 | Every time used as evidence goes through `tAt()`: unparsable **or more than 5 min in the future** → 503 "health data unreadable". 4 min of skew is tolerated (tested) |
| P5 guard 09:15, then HTTP 500 09:30 → red, then green | 503 → 200 | A resource-guard skip **after the last publication** keeps `publication/firms` failing until a new publication, whatever runs come in between |
| P6 coverage row describing a different cutoff from the checkpoint | 200 | The coverage `cutoff` must equal the checkpoint's `cutoff` |
| (agreed with GPT) `/status` notes | unredacted | `/status` now passes through `redactStatus()`: note/reason/failure_reasons fields get the full redaction (secret values + long tokens); every other string loses secret values only, so keys, hashes and times stay intact. GPT's point stands: the leak shown is from a **synthetic** error; it does not establish that a real key has ever leaked |

**Tests (rev 2):** `health-hub.test.mjs` **29/29**; `health-breaks.mjs` **19/19** breaks caught (7 new: P1–P6 + `/status`; the checker now counts P-test failures too — before that fix 6 breaks looked "missed" because only H-test failures were counted). Regressions unchanged: history-hub 27 · firms-guard 19 · place-rows 7 · drifters-hub 12 · plastic-hub 11 · ships-fallback 7 · ships-late 7 · satellites-hub 12 · orbital-hub 13.
**UptimeRobot push on Free:** GPT cites UptimeRobot's help article on mobile-app push as confirming it on Free. I could not open that article from here (blocked); UptimeRobot's mobile-app page says every plan can use the app. Delivery is still proven only by the Mac-closed acceptance test (§7).
**Still for Chad:** nothing deployed. Sections below are rev 1 text with the thresholds unchanged; where they conflict, this section wins.

---


Brief: `docs/briefs/2026-11-06-monitoring-and-memory.md` (GPT, relayed by Chad). Authorised: branch work, local tests, documentation. **Nothing deployed, no account created, no monitor configured, no production read or write.** STATUS.md / HANDOVER.md untouched (another thread owns them until its 00:50 UTC 7 Nov handover).

## 0. Bottom line
- 8 read-only checks at `GET|HEAD /health/<check>/<layer>`; verdict = HTTP status (200 healthy, 503 failing, 404 no such check). One check per UptimeRobot monitor.
- Fail closed: unreadable D1, missing tables, no rows, unparsable times, a missing published file → 503. Tested.
- `health-hub.test.mjs` **23/23**; **12 of 12** deliberate breaks make it fail (`health-breaks.mjs`); 9 existing hub suites still pass.
- UptimeRobot Free is **$0** and its current terms allow commercial use (§1). Incremental Cloudflare cost expected **$0** (§6).
- **One finding that changes the setup:** UptimeRobot HTTP monitors send **HEAD** by default and choosing the method is a paid feature. The hub answered every non-GET with 405, so a plain monitor would have shown permanently down. 0.5.3 answers HEAD on `/health/*`.
- **Next production steps need Chad's Approve lines** (§8): deploy 0.5.3, then he creates the account and monitors.

## 1. UptimeRobot — what was checked (6 Nov 2026, ~15:00 UTC)

**Verified from UptimeRobot's own pages:**
| Item | Source | What it says |
|---|---|---|
| Commercial use | [Terms](https://uptimerobot.com/terms), §3 Services Provided | "UptimeRobot is available for any use, including commercial and business use." Same sentence opens the [Fair Use Policy](https://uptimerobot.com/terms-fair-use/). |
| Terms date | Terms changelog | Latest entry **26 May 2026**: Fair Use Policy added; Services Provided and No Resale sections updated. No explicit "last updated" line besides the changelog. |
| Resale | Terms §14 | The service may not be repackaged, white-labelled or offered to third parties as a monitoring service. (Not our use: we monitor our own hub.) |
| Termination | Terms §9 | They may end access "at any time, with or without cause" — any plan. |
| Fair use | Fair Use Policy §1–3 | Automated patterns that strain shared infrastructure are out of fair use; capacity can be reduced; accounts that outgrow their plan may be asked to change plans. No numbers given. |
| Free plan | [Pricing](https://uptimerobot.com/pricing/) (no date on page) | 50 monitors; **5-minute interval**; HTTP, port, ping and **keyword** monitors; 1 status page; 3 months data retention; "Good for personal and commercial projects". Heartbeat monitoring not on Free. |
| Mobile app | [Mobile app page](https://uptimerobot.com/mobile-app/) | "every plan can use the app, including the free plan"; push alerts described as an app feature, not limited by plan. |
| Request method | [UptimeRobot blog](https://uptimerobot.com/blog/introducing-http-method-selection-headgetpostputpatchdelete), updated 13 Nov 2025 | HTTP monitors send **HEAD** by default, keyword monitors **GET**; method selection is paid-only. |
| Open-source sponsorship | Terms §3 | Mentions a sponsored subscription programme for non-profit and open-source projects. Not needed now; noted for later. |

**History (reported by third parties, not verifiable on UptimeRobot's pages today):** two 2026 articles say Free was restricted to personal, non-commercial use from **1 Dec 2024** ([dev.to, May 2026](https://dev.to/r0tten0x/uptimerobot-free-plan-in-2026-the-limits-thatll-actually-bite-you-445g); [dev.to, Apr 2026](https://dev.to/velprove/uptimerobot-commercial-use-free-alternatives-for-business-sites-in-2026-5d75)). The terms' changelog shows no such entry, and an UptimeRobot account commented under the first article that Free is available for commercial use. **The current terms are what governs; the earlier restriction is why the terms should be re-read whenever the plan or our use changes** (e.g. when paid hub features start).

**Not verified (assumptions, closed by the acceptance test in §7):**
- That **email** alerts are included on Free. The pricing page's text extraction showed the email row with an empty Free cell, and its markdown version lists Free's integrations as Google Chat, Discord, Pushover, Pushbullet and Splunk. The terms describe email, SMS and mobile push as notification methods without tying them to a plan. → Confirm in the account; push via the app is the main channel either way.
- That a **503 / 404 counts as down** and **200 as up**. Industry-standard; not stated on the pages read. → The acceptance test proves it.
- Whether UptimeRobot re-checks before alerting (confirmation). Not found. Detection times below assume a single failed check alerts.

## 2. The checks

| Monitor URL (prefix `https://mother-earth.chadoberholzer.workers.dev`) | Fails (503) when | Normal cadence behind it |
|---|---|---|
| `/health/runs/usgs` | no usgs run (any outcome) has **completed** for > 20 min | `*/5` trigger |
| `/health/runs/firms` | no firms run (any outcome) has completed for > 50 min | `*/15` trigger |
| `/health/publication/usgs` | no validated publication for > 20 min | usgs ok runs |
| `/health/publication/firms` | no validated publication for > 50 min (day-boundary aware, below); **or** the latest run was a resource-guard skip (immediately); **or** run log and published file disagree by > 10 min; **or** no run ended in a publication or an expected empty file for > 50 min | firms ok runs |
| `/health/archive/firms` | a closed day's checkpoint is not complete **2 h** after midnight; **or** a gap was recorded in the last 24 h; **or** history ran before yesterday but recorded no activity yesterday (a day that would never become due); **or** history is off | checkpoint at the first run ≥ 00:30 UTC |
| `/health/archive/usgs` | same, for usgs | same |
| `/health/coverage/firms` | yesterday's completed checkpoint was built from a **stale** input (`archive_checkpoint_coverage.input_status`), or the checkpoint has no coverage row | written with the checkpoint |
| `/health/coverage/usgs` | same, for usgs | same |

**"Publication" is measured twice and the older wins:** the last `collector_runs` row with `status = 'ok'` (logged after the four writes) **and** the upload time of `latest/<layer>.json` from an R2 `head()` (metadata only — the file the page actually reads). A run logged ok whose file was not rewritten fails the check (test H2d).

**Body:** `{check, healthy, verdict, reasons[], checked_at, collector_version, facts}` — enough to explain a failure (latest run, its status and note, ages, the overdue time, pending days, recorded gaps). HEAD returns the same status and an `X-Health: ok|failing` header, no body.

**Kept out:** credentials and admin access. Notes are cut to 160 characters; every environment string of 16+ characters (all the secrets) and any 32+ character token are replaced by `[redacted]` (test H8). No admin route is reachable through `/health`. Only GET and HEAD.

**Cache:** `Cache-Control: no-store, max-age=0` on every answer (the hub's default for JSON is `public, max-age=60`). Worker responses on workers.dev are not served from cache unless the Worker uses the Cache API, which it does not; `no-store` also covers anything in between. `checked_at` in the body shows the age of any copy.

## 3. Thresholds, reviewed against the schedules
| Proposed (brief) | Chosen | Why |
|---|---|---|
| FIRMS: no publication ~45 min | **50 min** = 3 missed `*/15` slots + 5 min | At exactly 45 min the third run may still be in flight (firms wall time 3–14 s, measured 6 Nov), so 45 min would race it. The page already marks FIRMS stale at 40 min (`stale_after_s` 2400); the alert follows two failed slots plus the third not succeeding. Worst detection ≈ 50 + 5 (check interval) = 55 min. |
| Resource guard prevents processing | **immediate** | One guarded run means the 8 MiB limit was crossed: the next run will almost certainly be guarded too. |
| Checkpoint incomplete 2 h after midnight | **2 h** | Normal completion is ~00:30 (end of day + 30 min grace, first firms/usgs run after it). 2 h leaves 6 more firms attempts and 18 usgs attempts before alerting. |
| New gap or stale coverage | gap: 24 h incident; coverage: yesterday only | See §4. |
| Hub unreachable | every check fails | No check can answer 200 without the Worker, D1 and R2 responding. |
| (added) Scheduler stopped | `runs/usgs` 20 min, `runs/firms` 50 min | Separate from publication, so "source down" and "scheduler stopped" are different monitors. |

**Three clocks, kept apart:**
- **Collection freshness** — did our runs complete? (`runs/*`; `collector_runs.finished_at`)
- **Publication freshness** — did a validated snapshot reach `latest/`? (`publication/*`)
- **Observation age / source latency** — how old the newest detection is, and how far FIRMS is behind the satellite pass (~2–3 h for VIIRS NRT). **Not pass/fail here.** It needs the published records (a 2–5 MB read per check), and lateness at the source is not a pipeline failure. It is visible already in the checkpoint coverage (`last_observation_at`) and on the page. If wanted later: the collector can log the newest `observed_at` in `collector_runs` at no extra read.

**The FIRMS day boundary (found while testing the brief's 45-minute rule):** `day_range=1` returns today (UTC) only, so the file is legitimately header-only from 00:00 until ~04:00 UTC (measured 1 Nov). The collector logs those runs as `down` with "no detections processed yet for today". A plain "no publication for 45 min" rule would alert **every night at ~00:30**. The check therefore:
- accepts those boundary runs as expected (they are not publications, but they are not failures);
- if the publication deadline falls inside 00:00–04:00, counts it from the window's last slot (03:45) instead → fails from **04:35** if FIRMS is still empty (test H3b);
- does **not** let the window hide a real failure: an HTTP 500 at 00:00 is not an expected empty file, so it fails from 00:36 (last acceptable run 23:45 + 50 min; test H3c).
If FIRMS's first rows of the day move later than ~04:00 (e.g. a late first pass), this alerts. That is honest — nothing new is published — but it is the source, not us; the reason string says "empty response … not a validated zero".

## 4. Incidents that stay visible without permanent alerts
- **One monitor per kind of failure,** per layer: an open incident on one cannot hide a new failure of another kind or another layer. Within one monitor, a second failure of the same kind during an open incident does not produce a new notification (one boolean per URL — a limit of status-code monitoring); it is still listed in the body and in `/status`.
- **Gaps:** a gap fails `archive/<layer>` for 24 h after it was recorded, then the monitor recovers. The gap itself is never deleted: `archive_gaps` keeps it, the health body lists the latest 5 under `recorded_gaps`, `/status` → `archive_health.gaps` lists 20 (test H4b). UptimeRobot also keeps the incident in its log (3 months on Free).
- **Coverage:** only yesterday's completed checkpoint is judged. A stale day stays failing until midnight of the following day, then rolls off; its row stays in `archive_checkpoint_coverage` and in `/status`.
- **Notifications:** UptimeRobot sends one alert when a monitor goes down and one when it comes back — incident-open and recovery, as the brief prefers. No hub-side email, and nothing in the hub has to be running for an alert about the hub to be sent.

## 5. Tests — `node --no-warnings phase1/health-hub.test.mjs` (23/23, Node 22.23.4)
Real `worker.js` scheduled jobs and fetch route; D1 = real SQLite with `schema.sql`; R2 in memory with `head().uploaded`; fake clock covering `new Date()`.
| # | Brief's case | What is asserted |
|---|---|---|
| H0 | baseline | 2 days of normal slots: all 8 checks 200 on GET and HEAD, HEAD has no body, `no-store` on both |
| H1a, H1b | **stopped scheduling** | usgs trigger stops: 200 at 20 min, 503 at 21 with the reason, firms checks unaffected; firms trigger stops: `runs/firms` and `publication/firms` 503 after 50 min, usgs unaffected |
| H2a | **failed publication** | 3 × HTTP 500: 200 after two (09:46), 503 after three (09:51) naming "http 500"; `runs/firms` stays 200 |
| H2b | resource guard | first guarded run → 503 at once |
| H2c | failed publication | R2 write of `latest/firms.json` refused → 503 after 50 min |
| H2d | failed publication | log says ok, file not rewritten → 503 (disagree; older time used) |
| H3a–c | day boundary | normal night stays 200; still empty → 503 from 04:35; HTTP 500 inside the window → 503 from 00:36 |
| H4a | **overdue checkpoint** | firms marker refused all night: 200 at 02:00, 503 at 02:06 ("2.1 h after the day closed"); usgs green; **recovery** when the marker lands |
| H4b | new gap | 503 for 24 h, then 200 with the gap still listed in the body and `/status` |
| H4c | silent miss | history ran before but recorded nothing yesterday → 503 |
| H4d | history off | archive checks 503 with "pause this monitor if that is intended" |
| H5 | stale coverage | current → 200; stale → 503 (usgs green); before the checkpoint → 200 "not assessed yet"; marker without coverage → 503 |
| H6a–d | **unreadable health data** | D1 read failure → every check 503 (GET + HEAD); no tables → 503; empty DB → runs/publication 503; R2 head throws / latest missing / unparsable time → 503 |
| H7 | **recovery** | 70 min of HTTP 500 → 503; first good run → 200 at once; scheduler resumes → 200 |
| H8 | no secrets | a fetch error carrying the FIRMS key is redacted; neither key appears in any health answer |
| H9 | routing | unknown check 404 (lists the 8); POST 405 |
| H10 | cost | `EXPLAIN QUERY PLAN` of every health query: no scan of `collector_runs` or the archive tables (index searches only) |

**Breaks must bite — `node phase1/health-breaks.mjs`: 12 of 12 caught:** fail-open on unreadable data (H6a,b,d) · boundary masks real failures (H3c) · HEAD not handled (H0, H1a, H6a) · HEAD with a body (H0, H1a) · guard not checked (H2b) · published file not checked (H2d) · cacheable answers (H0) · notes not redacted (H8) · gap alerts forever (H4b) · silent missing day not checked (H4c) · no boundary allowance (H3a–c) · stale coverage ignored (H5).

**Regressions on the branch:** history-hub 27 · firms-guard 19 · place-rows 7 · drifters-hub 12 · plastic-hub 11 · ships-fallback 7 · ships-late 7 · satellites-hub 12 · orbital-hub 13 — all pass. Browser suites (place-ui, kept-ui) not run here: no page file changed, and the only change they could see is one extra entry in `/`'s endpoint list.

**What these tests do not show:** behaviour on the real platform (D1/R2 latency, a real `head()`), UptimeRobot's handling of HEAD/503, and real phone delivery. Those are the acceptance test (§7).

## 6. Expected usage and cost
| | Per month (8 monitors × 12/h) | Included on Workers Paid | Extra cost |
|---|---|---|---|
| UptimeRobot Free | 8 of 50 monitors | — | **$0** |
| Worker requests | ~69,000 | 10 million ([pricing](https://developers.cloudflare.com/workers/platform/pricing/), read 6 Nov) | $0 unless the account is already near 10 M (it is not known to be; check the usage page at deploy) |
| Worker CPU | ~1–3 ms each (estimate; measure after deploy) → < 0.3 M ms | 30 million ms | $0 |
| D1 rows read | ~10–30 per check (index searches) → < 2 M | 25 billion | $0 |
| D1 writes, R2 writes, upstream requests | none | — | $0 |
| R2 | 1 `head()` per publication check (2 monitors) → ~17,000 Class B | 10 million Class B / month ([R2 pricing](https://developers.cloudflare.com/r2/pricing/), read 6 Nov; $0.36/M beyond) | $0 |

**No new line item is proposed.** If Chad later wants SMS/voice alerts or 1-minute checks, those are paid UptimeRobot features — named here, not proposed.

## 7. Proposed UptimeRobot setup (for Chad, after 0.5.3 is deployed — nothing done yet)
**Chad at the screen:** account creation and the app sign-in are his (Claude never creates accounts).
1. Create the UptimeRobot account yourself (email + password).
2. Install the UptimeRobot app on the Galaxy, sign in, allow notifications. (Push is the channel for "Mac closed".)
3. In the dashboard, check which alert contacts the Free account offers (email? app push?). Tell Claude what you see — this closes §1's open item.
4. Add 8 monitors, type **HTTP(s)**, interval **5 minutes**, each with the app (and email if offered) as alert contact. Names suggested: `ME runs usgs`, `ME runs firms`, `ME publication usgs`, `ME publication firms`, `ME archive firms`, `ME archive usgs`, `ME coverage firms`, `ME coverage usgs`; URLs as in §2. Leave the method at the default (HEAD).
5. After 15 minutes all 8 should be **up**. If one is down, open `https://mother-earth.chadoberholzer.workers.dev/health/<check>/<layer>` in a browser: the `reasons` say why.
6. Optional later: one public status page (Free includes one). Not proposed now — it would publish the hub's health to anyone with the link.

**Notification acceptance test (with the Mac closed; no change to the hub):**
1. Add a 9th monitor, `ME alert test`, HTTP(s), 5 min, URL `…/health/test/firms` — a check that does not exist, so the hub answers **404**.
2. Close the Mac lid (or shut it down). Keep the phone on mobile data, Wi-Fi off, if possible.
3. **Pass 1:** a "down" push arrives on the phone within ~10 min (and email, if offered). Note the time.
4. On the phone (app) or any browser, edit `ME alert test`'s URL to `…/health/runs/firms`. **Pass 2:** an "up" (recovery) notification arrives within ~10 min.
5. Delete `ME alert test`. Report the two times to Claude; they go into STATUS.
6. Also confirm from the 8 real monitors' first checks that HEAD was used and answered 200 (UptimeRobot's response details, if shown) — this proves the HEAD path on the real platform.
Then, as the brief says, the routine overnight check-ins can be retired once Chad decides.

## 8. Approvals needed (in order; none requested yet)
1. `Approve: deploy hub commit <sha> (hub-health, 0.5.3, content only)` — adds `/health/*` and HEAD on it; no binding, secret, schedule, variable or schema change. Rollback = 0.5.2 `909e8cd`/`2ee3a62` worker.js (`70307d5f…`).
2. Chad creates the UptimeRobot account and monitors himself (§7).
3. Merge `hub-health` → `main` after the deploy is verified (no page file changes).

## 9. Found on the way (not changed)
- **`/status` publishes run notes unredacted.** In test H8 a fetch error message that contained the FIRMS URL put the key into `/status`. That error text is the test's own; whether the Workers runtime's real fetch errors ever include the URL is **not known**. Proposal: pass `/status` notes through the same `healthNote()` redaction — a one-line change, waiting for Chad's go.
- Manual `/admin/run/<job>` runs are logged like scheduled ones, so a manual run can make `runs/<layer>` look alive for one window while the trigger is stopped. Rare; stated.
- The `hourly` job (Kp, CO₂, sea ice, drifters, plastic, D1 aggregation), forest and orbital have no health check yet. Out of this brief's FIRMS scope; the same pattern extends to them.

## Rev 2 — deployed and accepted (6 Nov 2026)
**Deploy (Chad's Approve line):** hub 0.5.3, `phase1/worker.js` from `88e0399`, sha256 `61c8e05262a3…6d0692`, content-only API from the dashboard pane, HTTP 200 at **15:38:04 UTC**. Read back through the Cloudflare connector: same sha256. Before: 0.5.2 `70307d5f…` (rollback).
**Checks after deploy (15:38 UTC):** `/` and `/status` report 0.5.3, `/status` shape unchanged (no note needed redacting); all 8 `/health/*` checks answer GET and HEAD with the same status, HEAD body empty, `Cache-Control: no-store, max-age=0`; 7 × 200, `coverage/firms` 503 — 5 Nov's preserved stale coverage (cutoff 15:30:44, 33 failed runs), expected while 5 Nov is "yesterday" (clears 00:00 UTC 7 Nov); evidence untouched. Unknown check 404, POST 405. First runs on 0.5.3: usgs 15:40 + 15:45 ok, firms 15:45 ok (30,644 records, 2,554,353 B raw).
**UptimeRobot (Free, Chad's account, created by Chad 6 Nov ~15:55 UTC):** 8 HTTP(s) monitors, 5-min interval, default method HEAD, up = 2xx/3xx (seen in the monitor form). Alert contacts: email + iPhone push on all 8 ("2 channels" each). Monitors were added by Claude in the pane on Chad's instruction ("you add them"). The form also confirmed on Free: email alerts, push via the iOS app, HEAD default with method selection paid.
**First real alert:** `ME coverage firms` went down (503) right after creation — the correct 5 Nov condition.
**Notification acceptance test — PASSED (times SAST = UTC+2):**
| Step | Mac | Event | Push sent | Email sent | Received |
|---|---|---|---|---|---|
| test monitor `ME alert test` → `/health/test/firms` (404) | open | down 18:11:54 | 18:11:54 | 18:11:56 | yes |
| URL changed to `/health/runs/firms` in the iPhone app | **closed** | resolved 18:18:45 | 18:18:46 | 18:18:47 | **popped up on the phone** |
| URL changed back to `/health/test/firms` | **closed** | down 18:21:57 | 18:21:58 | 18:21:59 | **popped up on the phone** |
Phone on mobile data (5G), Mac lid closed (the device bridge disconnected, confirming it). Detection to push ≤ 1 s after UptimeRobot's check; UptimeRobot confirmed the 404 from a second location (Nuremberg) before alerting. `ME alert test` deleted after the test.
**Next (Chad):** merge `hub-health` → `main` (no page change) with his go; decide when to retire routine overnight check-ins.
