# aircraft-counts-rc — Aircraft counts per area (OpenSky), release candidate packet

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
> **Status:** in use from <date>, optional layer "Aircraft counts": counts per 4° cell only (no aircraft identifiers, callsigns, positions or tracks stored or published), about 10 requests a day from the project's own home connection, 4 credits each of 4,000 a day (measured 17 Nov 2026). Basis: ticket #837506 (hobbyist, feeder, credits; hosting aggregated snapshots "3. Yes", 9 Nov 2026). Receiver Online and Approved 17 Nov 2026 (dashboard, GPT). Attribution: "The OpenSky Network, https://opensky-network.org". Commercial use: needs agreement (unchanged).

## 7. Release steps (each needs Chad's own line; order matters)
1. Collector: copy `collector-mac.mjs` and `run.sh` to `~/mother-earth/`, one manual run (`run.sh aircraft`), check `/cells/opensky`, then create `state/aircraft.on`.
2. REGISTER line.
3. Page merge.
Rollback: delete `state/aircraft.on` (collection stops); revert the page merge; restore the previous `collector-mac.mjs` and `run.sh` (kept in `_sync-preserved`).
