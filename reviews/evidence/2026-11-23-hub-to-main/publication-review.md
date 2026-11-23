# Hub-to-main candidate: publication review of what main would newly carry (23 Nov 2026)

**What landing does.** Every file in the manifest is already public in the repository, on the branches named
there. Landing on main also puts each one on the website: the site publishes the repository's root.
**Confirmed 23 Nov 18:40 UTC** by fetching from `https://theonetheonlythechad.github.io/mother-earth/`:
`phase1/schema.sql`, `phase1/worker.js` (main's 0.6.19), `START-HERE.md` and
`reviews/2026-11-23-hub-to-main-plan.md` all answer 200; `phase1/earthview-fixtures/SOURCE.md` answers 404 today
and would answer 200 after the landing.

So: **the existing page files are unchanged; the repository and the site gain 117 new hub, test and record files,
and 9 existing files change** (the hub file, five hub suites, one record, `START-HERE.md` and the Animals suite). That is new accessible material. It is not "no change to the site".

## What was reviewed, and how

1. **Pattern search of every text file in the manifest** (the 126 changed paths and the 61 left as on main) (the 11 picture files excepted) for: mail
   addresses, phone numbers, network addresses (IPv4 and IPv6), the Cloudflare account id, identifiers shaped like
   UUIDs, keys in addresses or headers, client-address and country fields, storage and database identifiers,
   passwords and tokens, the private-access work, alert-contact details, and personal names in paths.
2. **Reading, not searching, of the operational and account records** listed in the table below.
3. **Not done:** a line-by-line reading of all 126 files. The reviews and proposals among them were written for
   publication on the branch and were each read by GPT at the time; that is the basis for them, not this review.

## Findings

| Kind | Where | Decision |
|---|---|---|
| The hub's public address | 19 files | already in 80 files on main. Kept |
| The Mac's user folder name in a path | 3 records | already in 9 files on main. **Kept unchanged, on Chad's decision of 23 Nov** |
| `127.0.0.1` | 50 mentions | the local test stand-in |
| `?key=ADMIN_KEY`, `?key=k-test`, `Bearer <ADMIN_KEY>`, `admin-key-0123456789abcdef` and the like | 13 mentions | placeholders and made-up test keys. No real key |
| Header **names** `cf-connecting-ip`, `cf-ray`, `cf-ipcountry` | 2 records (Stage B) | names only, in a list of the headers a request carried. No value |
| Cloudflare version and deployment ids, and request ids | 10 Stage B records | identifiers of the Worker's own versions and of Chad's three probe calls. Not credentials; they grant nothing. Kept |
| Words "password", "token" | `phase1/worker.js` (2) | code comments |
| Mail addresses, phone numbers, other network addresses, the account id, storage or database ids, client addresses or countries, alert-contact details, private-access material | **none found** | |

## Operational and account records, read

| Record | What it holds | Decision |
|---|---|---|
| `reviews/evidence/2026-11-19-earth-from-space/cloudflare-billable-usage-read-2026-11-20.json` | the account's usage figures and US$0.00 total for one billing period, and the plan's included allowances | kept. The same figures are already in `STATUS.md` on main |
| `…/cloudflare-dashboard-read-2026-11-20.json` | the hub's 24-hour metrics and log-volume usage | kept |
| `reviews/evidence/2026-11-20-earth-from-space-probe/hub-settings-read-2026-11-20.md` | compatibility date, cron lines, placement | kept. No binding values |
| `…/stage-a/deployment-read-back-2026-11-20.md`, `reviews/evidence/2026-11-21-earth-from-space-stage-b/deployment-read-back-2026-11-21.md` | what was deployed, its hash, bindings by count and type, version ids | kept |
| `…/stage-a/result/` (`invocations.json`, `lines.jsonl`, `generic.jsonl`, `result.json`, `enc.txt`) | the probe Worker's own run records | kept. The probe had no bindings and its address was off |
| `reviews/evidence/2026-11-21-earth-from-space-stage-b/observations/*` | the three Stage B calls: status, timings, header names, CPU | kept. The `authorization` field holds a description of what the log stored ("stored as 8 asterisks"), never the key; that was the point of the check |
| `reviews/evidence/2026-11-22-earth-from-space-stage-c/results-as-saved/*` | **already on main** (identical); not newly published by this candidate | n/a |

**Not in the candidate at all:** the private-access assessment (it is not on either source branch); `KEYS.md`
(never in the repository); the UptimeRobot account reading beyond what the monitoring proposal, already on main,
says; any correspondence.

## The test pictures

Eleven files, 3.8 MB, under `phase1/earthview-fixtures/`: six frames as served by EUMETView (three JPEG, three
PNG), three smaller JPEGs derived from them, the script that derived them, and `SOURCE.md`. `SOURCE.md` gives the
request, frame times, byte counts, sha256, licence (CC BY 4.0) and credit ("Contains modified EUMETSAT Meteosat
data 2026"; the night background is NASA's Black Marble). **The nine picture files in the candidate were checked
against the sha256 values in `SOURCE.md`: all nine match** (see the candidate record).

`SOURCE.md` said the site does not serve them. That sentence is corrected in the candidate: no page requests
them, and the site serves them by address with the credit and licence beside them.

## Scripts that come with it

`phase1/earthview-admin.sh`, `earthview-stage-b-call.sh`, `evprobe.js`, `evprobe.build.mjs`, `evprobe.driver.js`,
`evprobe.report.mjs`, `evprobe.wrangler.jsonc` and `earthview-decoder-measure.mjs` are copied as source. **Nothing
was executed, installed, scheduled or deployed from them by this work**, apart from the offline suites that test
them against local stand-ins. Having them on main gives no permission to run them (`docs/HUB-DEPLOY-RULE.md`).

## Limits

A pattern search cannot tell a real key from a hash pasted without a label, and cannot judge whether a sentence
discloses something it should not. The records under "read" above were read for that; the rest rest on having
been written and reviewed for a public branch.
