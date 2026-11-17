# aircraft-counts-rc — Aircraft counts per area (OpenSky), release candidate packet

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
- Six breaks, each applied and each failing: `aircraft-first` (the `ddf109b` ordering) 5 fail; `no-guard` 3; `no-kill` 3; `no-budget` 5; `dry-free` 4; `no-switch` 1. The `ddf109b` `run.sh` itself fails 14 of the 22.

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
