# aircraft-counts-rc — Aircraft counts per area (OpenSky), release candidate packet

**Rev 4, 17 Nov 2026 (17 Nov 10:17 UTC clock reading): first upload made and read back (§13); home-network check added before any OpenSky request (§14). §13–§14 govern where they differ from earlier sections. Code head for review: `39e4a9c`.**

**Rev 3, 17 Nov 2026 (17 Nov 05:07 UTC clock reading): GPT reproduced three more runner cases on `059c531`; §12 records them, the fixes, the Mac `/bin/bash` results and a correction to §8. §12 governs where it differs from earlier sections.**

**Rev 2, 17 Nov 2026 (17 Nov 04:13 UTC clock reading): GPT held `ddf109b`; §8 onward records the hold and the changes. §3, §5 and §7 below are rev 1 text and are superseded where §8–§11 differ.**

Rev 1, 17 Nov 2026 (17 Nov 03:53 UTC clock reading). For GPT's review and Chad's approval. **Nothing here is released**: no merge, no upload to the hub, no schedule. The old Worker flag `OPENSKY_ENABLED` stays unset.

## 1. Chad's Go (17 Nov, his own message)
Reopen the OpenSky aircraft layer for a private test: one authenticated pull from his home connection; check the API response and the available feeder status; a private counts-by-area preview; a release candidate for the agreed cadence of about 10 pulls a day with OpenSky attribution; old Worker flag off; bring the exact production approval line once the preview is verified.

## 2. The one pull (Chad ran `~/mother-earth/opensky-once.sh` in Terminal; result file `~/mother-earth/state/opensky-once.json`)
- Route: Node v24.14.1 on the Mac, home connection. The script reads the credentials from `KEYS.md`; Claude did not handle them. It refuses to run twice. It saved counts per 4° cell and response facts only: no identifiers, callsigns or positions.
- Token: HTTP 200 in 771 ms, bearer, 1,800 s life.
- `GET /api/states/all` at 03:40:55 UTC (response `date` header): **HTTP 200 in 1,971 ms, 904,694 bytes**, top-level keys `time`, `states`; 17 fields per state vector; source time 03:40:53 UTC.
- **6,854 state vectors; 6,809 with a position; 45 without; 0 duplicate addresses; 810 on the ground.** Position source 0 (ADS-B) for all 6,809. Position age against the source time: median 1 s, 90th percentile 88 s, maximum 6,487 s.
- **446 cells** with at least one aircraft; largest cell 172. Southern Africa: three cells (Cape Town cell `14_49`: 5).
- **Credits: `x-rate-limit-remaining: 3996`** after the pull, so the world pull cost 4 credits against a 4,000-a-day allowance. Ten pulls a day = 40 credits.
- **Feeder status as the API shows it:** the allowance is the standard 4,000, not a larger feeder allowance. That agrees with Martin's reply of 9 Nov ("automatic on our side, if you've been feeding for 30%+ of the preceeding month"): the receiver came online on 17 Nov. GPT's dashboard check on 17 Nov (relayed by Chad): receiver Online and Approved, 21 messages/sec at 03:26 UTC. No endpoint was called for feeder status; one data request was made in total.

## 3. What the candidate is
- **Collector (Mac, `phase1/collector-mac.mjs` mac-0.3.3, `phase1/run.sh`):** new feed `opensky`. One token request and one `states/all` request per run. `openskyPositions()` returns latitude and longitude pairs only; the address is used for de-duplication inside the function and goes no further. `buildEnvelope()` publishes **cells only** for a counts-only feed: `records: []`, `record_fields: []`. Envelope extras: `stale_after_s` 10,800, window = OpenSky's source time, counts summary, `records_policy`, `credits_remaining`, citation. A failed upload is not kept as pending (the single pending slot stays the ships collector's).
- **Schedule:** inside the existing launchd tick, before the ships sample, never changing the ships timing or exit code. Runs only while the switch file `state/aircraft.on` exists; interval 8,640 s (144 min) from the attempt, so at most 10 requests in 24 h and no early retry after a failure. Runs only while the Mac is awake. Manual: `run.sh aircraft --dry` prints the envelope and uploads nothing.
- **Hub: no code change and no deploy.** Hub 0.6.17 already accepts `/ingest/opensky` (`INGEST_LAYERS`), validates the envelope, and serves `/cells/opensky`. `OPENSKY_ENABLED` stays unset, so the Worker's own OpenSky pulls and its hourly aggregation stay off. The suite runs the hub's own `validateEnvelope` on the counts-only envelope: accepted.
- **Page (`aircraft.js`, new; `index.html`, `app.js`, `sources.html`):** optional layer "Aircraft counts", off on load, fetched only while on. Counts are painted as filled 4° squares on a transparent sheet that is its own mesh (no globe.gl data layer). Five provisional bands (1–4, 5–19, 20–49, 50–99, 100+). The card shows the snapshot time and age, the total and the number of cells; tapping the globe reads one cell. No colour = no count, worded as not an empty sky. Past 3 h the card says stale; past 6 h the sheet is cleared. A down report, a file with individual records, a wrong layer or an unreadable time draws nothing and says why. The old "Aircraft: not shown" card, the status report line, the rules text and the Sources row are reworded.
- **Attribution:** "The OpenSky Network, https://opensky-network.org" on the card, in the rules text and in the Sources row, with "Mother Earth contributes a receiver to the network".

## 4. Checks run
- `node phase1/aircraft-counts.test.mjs`: **15 passed** (positions only; no address, callsign or position anywhere in the upload body; cells on the 4° grid; hub validator accepts; ships-style feeds keep their records).
- `node phase1/duration-contract.test.mjs`: ALL CHECKS PASSED (ships path).
- `phase1/wind-ui.test.cjs` with the changed page files: **92 passed, 0 failed**.
- **Private preview (pane, clean session, 17 Nov 03:53 UTC):** branch files at `a569c1c` loaded from raw.githubusercontent.com with sha256 recorded, `/cells/opensky` answered by a fixture built from the real pull (the fixture lived only in that tab; nothing was uploaded). Result: ready, 6,809 aircraft, 446 cells, 446 squares drawn (bands 215 / 131 / 61 / 27 / 12), one mesh in the scene, one request. Cape Town cell read 5; an empty Atlantic cell read "No aircraft counted… not an empty sky". Screenshot: squares sit over Europe and North Africa where expected.
- **Failure paths in the same tab:** stale wording at 3 h 30 min; cleared at 6 h 6 min; down report; file with records refused; wrong layer refused; a newer count replaces the older; an older count never replaces a newer; off removes the mesh; Wind stayed off and the page's own points were untouched.

## 5. Not done / open (say so before release)
- **No page suite for `aircraft.js`** (the checks above were made by hand in the pane). The other page suites were not rerun except Wind.
- **The collector's `opensky` feed has not run end to end**: the one pull used the one-off script, not `collector-mac.mjs`. First real run = first production upload.
- **`run.sh` schedule not exercised on the Mac.**
- Provisional: colour bands, 3 h stale, 6 h clear, opacity 0.78.
- The layer is empty whenever the Mac has been asleep for more than 6 h. Moving collection to the always-on Pi is a later, separate proposal.
- Phone, Safari, screen reader: deferred (standing).
- Sky view and other sheets with Aircraft on: not checked.
- OpenSky's location update for the receiver (Martin): unverified. Feeder allowance not yet applied to the API account.
- Place view, search, legend and "Key · N layers" do not include aircraft (same as Wind).
- `aircraft-rc` (3 Nov) is superseded by this branch and still parked; not deleted.

## 6. REGISTER — proposed replacement for the OpenSky "Status" line (not filed)
> **Status:** in use from <date>, optional layer "Aircraft counts": counts per 4° cell only, each aircraft at its last reported position no more than 300 s before the snapshot time (no aircraft identifiers, callsigns, positions or tracks stored or published), about 10 requests a day from the project's own home connection, 4 credits each of 4,000 a day (measured 17 Nov 2026). Basis: ticket #837506 (hobbyist, feeder, credits; hosting aggregated snapshots "3. Yes", 9 Nov 2026). Receiver Online and Approved 17 Nov 2026 (dashboard, GPT). Attribution: "The OpenSky Network, https://opensky-network.org". Commercial use: needs agreement (unchanged).

## 7. Release steps (each needs Chad's own line; order matters)
1. Collector: copy `collector-mac.mjs` and `run.sh` to `~/mother-earth/`, one manual run (`run.sh aircraft`), check `/cells/opensky`, then create `state/aircraft.on`.
2. REGISTER line.
3. Page merge.
Rollback: delete `state/aircraft.on` (collection stops); revert the page merge; restore the previous `collector-mac.mjs` and `run.sh` (kept in `_sync-preserved`).

## 8. Rev 2 — GPT's hold on `ddf109b` (relayed by Chad, 17 Nov) and what changed
GPT reproduced the 15 collector checks and the ships duration suite on the Mac copy, judged the counts-only approach sound, and held the approvals for three findings and one question.

**1. OpenSky could delay Ships (scheduler regression). Fixed.**
- Cause as GPT found it: one shared lock, aircraft ran first, and its request timeouts plus upload retries could hold the lock for minutes while a ships sample was due.
- `phase1/run.sh` now: the aircraft block is reached only in a tick where **no ships sample was due**; it does **not start when ships is due within 180 s** (`AIRCRAFT_GUARD_S`); the run is **killed at 90 s** (`AIRCRAFT_MAX_S`, `run_bounded`), so the lock is free before the next ships sample. The interval still runs from the attempt.
- `phase1/collector-mac.mjs`: token timeout 15 s, states timeout 30 s, **one** upload attempt for a counts-only layer (no backoff), and its own 80 s deadline.
- New suite `phase1/aircraft-schedule.test.sh` drives the real `run.sh` with a stub in place of node (no network): **22 passed**. Case C is GPT's case: a slow, failing OpenSky run while ships comes due is killed at its limit, the lock is released, no process is left, ships starts on the first tick after it is due, and the failed aircraft run is not retried early.
- Six breaks, each applied and each failing: `aircraft-first` (the `ddf109b` ordering) 5 fail; `no-guard` 3; `no-kill` 3; `no-budget` 5; `dry-free` 4; `no-switch` 1. ~~The `ddf109b` `run.sh` itself fails 14 of the 22.~~ **Withdrawn (rev 3): that comparison was invalid. The old `run.sh` was copied without its executable bit, so every call failed for that reason. The valid comparison is in §12.**

**2. First upload split from schedule activation; the ten-a-day claim now holds on every path.**
- Every OpenSky request (scheduled, manual, and `--dry`, which still asks OpenSky) is entered in `state/aircraft_requests` before it is made and **refused when 10 entries fall inside the last 24 h** (`AIRCRAFT_MAX_PER_DAY`, not overridable from the environment; manual refusal exits 7). Suite cases D1–D5.
- The 03:40 UTC one-off pull of 17 Nov was made by `opensky-once.sh`, outside this ledger: it is 1 request toward the first 24 h and is not counted by the ledger.
- Release steps are now separate approvals with a read-back between them (§10).

**3. What the snapshot time implies. Fixed with a documented position-age limit and wording.**
- The pull's positions were up to 6,487 s (1 h 48 min) older than the snapshot time (median 1 s, 90th percentile 88 s).
- The collector now counts an aircraft only if its position was reported **no more than 300 s before OpenSky's snapshot time** (`OPENSKY_MAX_POSITION_AGE_S`); a vector with no position time is not counted. Both tallies travel in the envelope (`counts.position_older_than_cutoff`, `counts.position_time_missing`) with `position_age_cutoff_s: 300`. 300 s is provisional: only the median, 90th percentile and maximum of the first pull are known, so how many aircraft it excludes is not yet measured.
- Page: the label reads "OpenSky snapshot of HH:MM UTC" (no longer "counted at"); the line under it says each aircraft is counted where it last reported a position, no more than 5 minutes before the snapshot time; "at one moment" is gone from the card note and the scope text. **The page refuses counts that do not state their limit** ("the counts do not state how old a counted position may be"; nothing drawn).
- Collector suite now **19 passed** (301 s excluded, 300 s counted, missing time excluded, limit is a parameter).

## 9. The feeder question (GPT): is the written public-use condition met by a receiver that is feeding now?
**What is written (ENQUIRIES-2026-11.md):**
- Acknowledgement, 30 Oct (summary on record): the public site must be a **feeder** to the network; credits apply; no cloud whitelisting.
- Martin, 9 Nov, to the enquiry about ~10 pulls a day for a public globe: "That works for us."
- Martin, 9 Nov, to "How is feeder status linked to the API account? Is it automatic once the receiver is feeding…?": "It's automatic on our side, if you've been feeding for 30%+ of the preceeding month." Chad's separate question "What contribution and uptime qualify someone as a feeder?" got no separate answer.
- Martin, 9 Nov: "3. Yes" to hosting aggregated snapshots (counts per area, no identifiers or tracks).

**What is true today:** a receiver whose serial Martin assigned by hand on this ticket is Online and Approved and reporting (GPT's dashboard check, 03:26 UTC 17 Nov). It has fed for less than a day. The API account shows the standard 4,000-credit allowance.

**Reading (Claude's; not a terms finding):** the records do **not** settle whether "must be a feeder" means (a) a receiver that currently feeds, or (b) an account OpenSky classes as an active feeder under the 30% rule. The 30% sentence was given as the condition for the automatic account link, and it is also the only criterion OpenSky has stated for being a feeder. Under (a) the condition is met now. Under (b) it is not met until the receiver has fed for 30% of "the preceding month", and how that is measured (calendar or rolling month; time or messages) is not stated.

**Consequence:** this cannot be closed by reading. It is closed by OpenSky's answer or by Chad's decision. Recommended: one question to Martin on the existing thread, and **hold the first public upload** until he answers. The upload to `/ingest/opensky` is itself public hosting (`/cells/opensky` is a public hub route), whether or not the page is merged.

## 10. Release sequence, rev 2 (each step on Chad's own Approve line; lines are in Claude's message with the head filled in)
0. **Precondition:** §9 closed (Martin's answer, or Chad's recorded decision).
1. **Install + first upload (one request):** copy `collector-mac.mjs` and `run.sh` to `~/mother-earth/` (previous files preserved), run `./run.sh aircraft` once. **Schedule stays off** (`state/aircraft.on` not created).
2. **Read-back (no approval needed, read-only):** `/cells/opensky` and `/snapshot/opensky` from the pane: layer, source time (`window_end`), `position_age_cutoff_s` 300, counts and tallies, `records: []` and `record_fields: []` in the snapshot, no identifier-shaped strings anywhere in either body; the D1 run row; credits remaining. Report to Chad and GPT.
3. **Schedule on:** create `state/aircraft.on`. Then watch the first two scheduled runs and the ships rows around them.
4. **REGISTER line** (§6, with the 300 s limit added).
5. **Page merge.**
Rollback: delete `state/aircraft.on`; restore the preserved `collector-mac.mjs` and `run.sh`; revert the page merge. A published count ages out on the page at 6 h; the hub's `latest-cells/opensky.json` would remain until overwritten (removing it is a separate approved action).

## 11. Checks at the rev 2 head, and what is still open
- `aircraft-counts.test.mjs` 19 passed; `aircraft-schedule.test.sh` 22 passed (+6 breaks); `duration-contract.test.mjs` passed; `wind-ui.test.cjs` 92 passed.
- Private preview repeated in a clean pane session at `0bdee8d` (page files identical at the packet commit): ready, label "OpenSky snapshot of 03:40 UTC, 17 Nov 2026", the 5-minute line shown, Cape Town cell 5; counts without a stated limit refused. **The preview's numbers are the first pull's, counted before the 300 s limit existed** (the one-off file kept no per-aircraft ages), so the first real run will count fewer.
- **Matching the Mac copy to the remote head:** `_review/aircraft-counts-rc/SHA256SUMS.txt` lists the sha256 of every file in the review copy, produced from a fresh clone of the head named in that file.
- **Still open:** no page suite for `aircraft.js` (hand checks only); the `opensky` feed has not run end to end (step 1 is its first run); the runner suite ran under Linux bash, not macOS's bash 3.2; bands, 3 h stale, 6 h clear, 300 s position limit all provisional; the layer empties when the Mac sleeps over 6 h; other page suites not rerun; phone, Safari, screen reader deferred; Martin's location update unverified.

## 12. Rev 3 — three cases GPT reproduced on `059c531` (relayed by Chad, 17 Nov), fixes, and the Mac results
Chad: Martin has been emailed on the existing ticket; go ahead with the runner fixes and local tests; the first public upload, schedule activation, REGISTER update and page merge stay on hold.

**1. Clock after the pending ships retry.** `run.sh tick` read the clock once, before the pending-upload retry, which can take minutes. It now reads the clock and the last ships sample again after the retry, before choosing a collector. Suite G1–G3: a retry that crosses the ships due time → ships runs in that same tick, aircraft does not, order retry then ships.

**2. Manual aircraft runs obey the ships guard.** `run.sh aircraft`, with or without `--dry`, is refused with exit 8 when a ships sample is due within `AIRCRAFT_GUARD_S` (180 s) or overdue, before the budget is touched. Suite H1–H5: five seconds before ships is due (plain and `--dry`), nothing entered in the ledger, ships overdue, and allowed at 400 s.

**3. No request without a saved ledger entry.** `aircraft_budget` now returns 0 (entry saved and read back), 1 (cap reached) or 2 (entry could not be saved, or the ledger exists but is not a readable file). On 2 no request is made: the scheduled path logs it, the manual path exits 9. The entry is written to a temporary file, moved into place and read back. Suite I1–I5: the ledger path is a directory; the temporary file cannot be written; scheduled and manual.

**The one-off pull is counted.** `aircraft_budget` reads `source_time` from `state/opensky-once.json` (the 17 Nov 03:40:53 UTC pull, made outside the ledger) and counts it while it is inside the rolling 24 h. Suite J1–J2. So if the first upload happens before 03:40:53 UTC on 18 Nov, it is request 2 of 10.

**Exit codes for a refused manual run:** 7 cap reached · 8 ships due soon · 9 ledger not saved.

**Results, head as named in `SHA256SUMS.txt`:**
- **On the Mac itself** (Chad ran `/bin/bash ~/mother-earth/aircraft-test/aircraft-mac-regression.sh` in Terminal; Darwin 25.5.0, **/bin/bash 3.2.57(1)-release**, node v24.14.1; 04:56:29–05:06:13 UTC; full output `reviews/evidence/2026-11-17-aircraft-mac-regression.txt`, with the sha256 of each file under test): **runner suite 37 passed, 0 failed**; collector suite 19 passed; ships duration contract ALL CHECKS PASSED.
- **Ten breaks, each applied, each failing, same counts on the Mac and on Linux bash 5.2:** `aircraft-first` 7 · `no-guard` 3 · `no-kill` 3 · `no-budget` 7 · `dry-free` 8 · `no-switch` 1 · `stale-clock` 3 (G1–G3) · `manual-no-guard` 5 (H1–H5) · `ledger-unchecked` 5 (I1–I5) · `once-ignored` 2 (J1–J2).
- **Earlier heads against this suite (Linux, executable copies):** `059c531` `run.sh` fails exactly the 15 new checks (G1–G3, H1–H5, I1–I5, J1–J2) and passes the other 22; `ddf109b` `run.sh` fails 27 of 37.
- `wind-ui.test.cjs`: not rerun at this head (no page file changed since `0bdee8d`, where it passed 92).
- No page file and no collector source changed in rev 3: `run.sh`, the runner suite, the Mac regression script and this packet only.

**Release sequence:** unchanged from §10, all on hold. Step 1's manual run now also needs ships not due within 3 minutes, so it is run just after a ships sample.

**Still open:** §9 (Martin's answer pending); no page suite for `aircraft.js`; the `opensky` feed has not run end to end; provisional limits (bands, 3 h stale, 6 h clear, 300 s position age); the layer empties when the Mac sleeps over 6 h. **Closed:** the runner suite has now run under macOS bash 3.2.

## 13. Step 1 done at `239e685`: one upload from the home connection, read-back clean
- GPT passed rev 3 on technical review (17 Nov). Martin (OpenSky), 17 Nov: "you can go ahead without waiting" and "You can easily use all the credits you have - that's what they are for." (both verbatim in `docs/research/ENQUIRIES-2026-11.md` on main, rev 9 and rev 10). §9 is closed.
- Chad's own Approve line (17 Nov). Collector mac-0.3.3 installed in `~/mother-earth` at 07:53:17 UTC from `239e685`; previous files preserved. First ships sample on the new runner 08:11:03 UTC: ok.
- **The upload was held while the Mac was on a cafe network** and made once the Mac was home (the Pi's local JSON answered at 09:08 UTC). Chad ran `run.sh aircraft` at 09:17:09 UTC: hub answer `200 … "layer":"opensky" … "records":0,"cells":452,"bytes":41682`, exit 0; one ledger entry; D1 `collector_runs` id 11848.
- **Read-back (Claude from Chad's Chrome 09:17–09:18 UTC; GPT confirmed independently):** `/cells/opensky` has no records keys; `/snapshot/opensky` has `records: []` and `record_fields: []`; both carry the same 452 cells totalling 5,411, each cell a count and a coverage grade; snapshot time 09:17:11 UTC; `position_age_cutoff_s` 300; 157 aircraft left out as older than the limit (2.8% of those with a position); `credits_remaining` 3992; citation and policy present; no hex addresses, callsign-shaped strings or coordinates in either body.
- Schedule off. Page not merged. `OPENSKY_ENABLED` unset.

## 14. Rev 4 — home-network check before any OpenSky request (GPT via Chad, 17 Nov)
**Why.** The collector runs on a MacBook that roams. The arrangement on record is requests from Chad's own home connection. As built at `239e685`, a request would leave from whatever network the Mac was on.

**What changed (`phase1/run.sh` only; the collector source is unchanged, still mac-0.3.3):**
- `home_probe()`: one read-only GET of our own receiver's local aircraft JSON (`AIRCRAFT_HOME_PROBE_URL`, default `http://adsb-feeder.local:8080/data/aircraft.json`), curl limit 4 s, killed outright at 6 s by `perl alarm`; the answer goes to a scratch file (not a pipe) and only its first 512 bytes are looked at. **Home = the answer contains both `"now"` and `"aircraft"`.** Anything else (no answer, timeout, error, a sign-in page) is not home.
- **Order on every path:** ships guard → home probe → request ledger → OpenSky request. Scheduled, manual and `--dry` alike.
- **Away, scheduled:** no OpenSky request, no ledger entry, `aircraft_last` not set, the collector is not started (so nothing is uploaded and the hub keeps its last good count), one log line with the reason. The probe is not repeated for 300 s (`AIRCRAFT_PROBE_RETRY_S`, marker `state/aircraft_probe_failed`); the count is taken on the first successful probe after that.
- **Away, manual:** refused with exit 10 before the ledger is touched.
- **Ships priority unchanged:** when a ships sample is due, or due within 180 s, the receiver is not probed at all in that tick.
- **Limit (GPT's point, written into the runner's comments):** the probe shows the Mac can reach the Pi. With a VPN that routes internet traffic elsewhere, the Pi can still answer while the OpenSky request leaves by another route. The check cannot see that.
- Unchanged: 10 requests per rolling 24 h; 144 min interval; 90 s run limit.

**Runner suite: 54 checks (17 new, K1–K17):** home (probe first, then one request); away (no request, ledger and `aircraft_last` untouched, reason logged, no collector call, lock free); no immediate re-probe; return home (probe again after the wait, request made, marker cleared); manual and `--dry` refused with exit 10 when away and allowed at home; a sign-in page is not home; a hanging probe is cut off at its limit with no request, no probe left running, and ships still on time; ships due → no probe; ships within the guard → no probe; away with a full ledger → ledger byte-for-byte unchanged.

**Results:**
- **On the Mac** (Chad ran `/bin/bash ~/mother-earth/aircraft-test/aircraft-mac-regression.sh`; Darwin 25.5.0, /bin/bash 3.2.57, node v24.14.1; 09:47:10–10:06:09 UTC; output `reviews/evidence/2026-11-17-aircraft-mac-regression-rev4.txt`): **runner suite 54 passed, 0 failed**; collector suite 19 passed; ships duration contract passed.
- **Fifteen breaks on the Mac, each applied, each failing:** `aircraft-first` 9 · `no-guard` 4 · `no-kill` 3 · `no-budget` 7 · `dry-free` 8 · `no-switch` 1 · `stale-clock` 3 · `manual-no-guard` 5 · `ledger-unchecked` 5 · `once-ignored` 2 · `no-probe` 9 · `manual-no-probe` 4 · `portal-ok` 1 · `probe-no-kill` 2 · `probe-no-backoff` 2.
- **Live probe on the Mac at home** (the real `/usr/bin/curl` and `/usr/bin/perl`, same command as the runner): the receiver answered with aircraft JSON in under a second: HOME.
- Linux bash 5.2: 54 passed; the five new breaks fail (9, 4, 1, 2, 2). The installed `239e685` `run.sh` fails 12 of the 17 new checks (K1–K11, K13) and passes the other 42.
- **Not tested:** the away case on the real Mac with the real curl (the Mac was home during the run; the away, timeout and sign-in-page cases use a stand-in for curl). Real-world evidence that the Pi does not answer off the home network: Chrome at 07:36 UTC from the cafe (name did not resolve). A VPN case: not tested.

**Release state.** The Mac runs `239e685` with the schedule off. Installing the rev 4 runner, switching the schedule on, the REGISTER line and the page merge each need Chad's own line.

## 15. Rev 5 — GPT's hold on `f9791f7`: the home probe accepted answers that were not our receiver (relayed by Chad, 17 Nov)
**What GPT found.** The rev 4 probe called it "home" when the first 512 bytes of the answer contained both `"now"` and `"aircraft"`. Three false positives: a timeout after a partial body, an HTML page containing both key names, and JSON with the wrong types.

**What changed (`phase1/run.sh` only, `home_probe()`; collector unchanged, still mac-0.3.3).** Home now needs all three:
1. **curl succeeded** (exit 0). A timeout or any other curl failure is not home, whatever arrived.
2. **HTTP status 2xx.** Redirects are not followed.
3. **The whole body parses as JSON** and is an object whose `now` is a finite number and whose `aircraft` is an array. **An empty array is valid** (GPT's instruction).

The body goes to a scratch file (`state/aircraft_probe.tmp`, removed afterwards; curl `--max-filesize` 8 MB); the JSON check runs under the same `perl alarm` kill (5 s). **Unchanged:** the 4 s curl limit and 6 s kill; the placement (ships guard → probe backoff → home probe → request ledger → OpenSky request) on the scheduled, manual and `--dry` paths; the 300 s retry wait; exit 10 for a manual run away from home.

**Runner suite: 88 checks (was 54).** Section L, each case on the scheduled path and on manual plus `--dry`, each asserting **the collector is never started and the ledger is byte-for-byte untouched**, with the reason logged (scheduled) or exit 10 (manual):
- **GPT's three:** L1 timeout after a partial body (curl exit 28) · L2 HTML page containing both key names · L3 JSON with `now` as a string and `aircraft` null.
- **Neighbouring cases:** L4 full valid body but curl failed · L5 cut-off body with curl exit 0 · L6 `now` null · L7 `aircraft` an object · L8 top-level array · L9 HTTP 500 · L10 HTTP 302 · L11 HTTP 404.
- An empty `aircraft` array at home is accepted and the request is made.

**Results:**
- **On the Mac** (Chad ran `/bin/bash ~/mother-earth/aircraft-test/aircraft-mac-regression.sh`; Darwin 25.5.0, /bin/bash 3.2.57, node v24.14.1; 10:49:21–11:17:43 UTC; output `reviews/evidence/2026-11-17-aircraft-mac-regression-rev5.txt`, sha256 `48270add7fd6b715612cfeab0bcdf78ec941f9fec868401b566ad899bc975caa`): **runner suite 88 passed, 0 failed**; collector suite 19 passed; ships duration contract passed.
- **Nineteen breaks on the Mac, each applied, each failing:** `aircraft-first` 9 · `no-guard` 4 · `no-kill` 3 · `no-budget` 7 · `dry-free` 8 · `no-switch` 1 · `stale-clock` 3 · `manual-no-guard` 5 · `ledger-unchecked` 5 · `once-ignored` 2 · `no-probe` 31 · `manual-no-probe` 26 · `portal-ok` 13 · `probe-no-kill` 2 · `probe-no-backoff` 2 · **new:** `probe-ignore-exit` 2 (L4) · `probe-ignore-http` 6 (L9–L11) · `probe-two-words` 12 (restores the rev 4 two-word search; L2, L3, L5–L8) · `probe-any-json` 6 (L3, L6, L7).
- **Live probe on the Mac at home** (the real `/usr/bin/curl` and `/usr/bin/perl`, the same three conditions as the runner): curl exit 0, HTTP 200, 9,022 bytes, `now` a finite number, `aircraft` an array of 22, 1 s: HOME.
- Linux bash 5.2: 88 passed; the same breaks fail. The `f9791f7` `run.sh` under this suite fails L1–L11 and passes everything else. **L9–L11 on the old runner are partly an artefact:** the stand-in for curl ignores `-f`, which the old runner relied on for HTTP errors. GPT's three (L1–L3), the full body with a failed curl (L4) and the body-shape cases (L5–L8) are real false positives in `f9791f7`.
- **Not tested:** the false-positive answers against the real curl (they use a stand-in; the real curl was exercised only by the live probe at home). The away case on the real Mac. A VPN case (limit unchanged from §14: the probe shows the Mac can reach the Pi, not which route the OpenSky request takes).

**Files at this head:** `phase1/run.sh` sha256 `f6f587aec646ca8bfdeeebad4d162077f683ecc6eb51514aab58f999216f65ce` · `phase1/aircraft-schedule.test.sh` `aa5cd2a6c2e3a04eabf5f72aebd5f0161a3decf7bee08cb007b1219db8a3b613` · `phase1/aircraft-mac-regression.sh` `f66cc8185481a858873a817eeaab046da30277feb43f93e70a6e4cd92fe2356c` · `phase1/collector-mac.mjs` `e88ada68c3f334a0e98b35c12bf00c4d0c330c26d35f5e8644226ca364db3d47` (unchanged). The code under test is commit `375d3f6`; the commits after it add only this section and the evidence file.

**Release state.** The Mac runs the `239e685` runner with the schedule off; one upload made (§13). Installing the rev 5 runner, switching the schedule on, the REGISTER line and the page merge each need Chad's own line, after GPT's review of this head.
