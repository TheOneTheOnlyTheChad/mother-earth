# Earth from Space — the D1 cost measurement: result (rev 1)

24 Nov 2026. Run on Chad's own Approve line of 24 Nov (packet rev 1.1, `reviews/2026-11-24-earth-from-space-live-test-packets.md`,
packet 1), with his continuation line after the stop at M4. Times are UTC clock readings; SAST is UTC + 2.
Evidence: `reviews/evidence/2026-11-24-evd1-measurement/` (hashes in `SHA256SUMS` there).

**Stage D is not cleared. This result goes to GPT for review; runbook P4a is not closed until it is reviewed.**

## 1. In short

- **Every set ran in full, and every one of the 320 measurement requests gave the expected status and state.**
- **D1 returned `rows_read` with every query**, so the per-request figure is D1's own, not a total.
- **Rows read equalled rows returned** for S1 (288), S2 (1,900) and S3 (2,000), and was **one more** for S0 (289 read, 288
  returned). On the empty table it was 1.
- **S3 (2,016 rows in range) read exactly 2,000.** For this query and index, D1 stopped reading at the `LIMIT`. That is what
  was measured here; it is not offered as a general bound on rows read.
- **Worker CPU per request:** median 1 ms (S1, S0), 3 ms (S2), 2 ms (S3); the highest single reading 21 ms (one S2 request).
- **The Worker, the database and every test row are deleted and read back. The hub was not touched**, and reads back exactly
  as before.

## 2. The stop at M4, and Chad's correction

At M4 (empty table) the packet said both addresses must answer 503. They answered:

| Address | Status | Reasons | State |
|---|---|---|---|
| runs | **503** | `completion_missing`, 288 overdue | trial ended with outstanding findings |
| trial | **200** | none | trial ended with outstanding findings |

The hub code is right and the packet was wrong: `trial` fails only on recorded findings (a storage stop, refused slots,
unrecognised outcomes); a missing run is `runs`' job. The suite's check C13 tested only `runs` on an empty table, so the
mistake was not caught before the day. **Claude stopped, reported, and made no further request.** Chad's line: continue from
M5 with M4 corrected to *empty table: runs 503, trial 200*, the actual answers preserved
(`m4-empty-table.json`), the reviewed files and row-set expectations unchanged. A test-only follow-up adds the empty-table
check for both addresses (section 7).

## 3. What was created, and how

| Thing | Identity | Read back |
|---|---|---|
| D1 database | `mother-earth-evd1test`, `2fcea1dc-c88e-4ea5-af89-efb8f6b623bc`, created 03:33:59 | The table and its two indexes, from `seed-schema.sql`, each statement run in its console |
| Worker | `mother-earth-evd1` | Code 15,065 bytes, sha256 `2afd3bdf…654f` (equal to the approved file); one binding `DB` → that database's id; no cron; no custom domain; `workers.dev` address on; logs on, sampling 1 |

**Method, disclosed at the stop and accepted by Chad for those steps only:** the Worker was created in the dashboard as
"Hello World" as the packet said; its code was then replaced and the binding added by an upload through the Cloudflare tab's own
session (the way the hub deploys were made), not through the on-screen editor and settings form. Everything was read back from
the account afterwards.

**Seeds:** each statement was typed into the database's console and, **before it was run, the text in the console was hashed
and compared with the approved statement's hash**; all nine statements matched. Each set began with `seed-clear.sql` and a count
of 0, and its counts were read back after seeding:

| Set | In the table | In the read range | Expected |
|---|---|---|---|
| S1 | 288 | 288 | 288, 288 |
| S2 | 1,900 | 1,900 | 1,900, 1,900 |
| S3 | 2,016 | 2,016 | 2,016, 2,016 |
| S0 | 5,888 | 288 | 5,888, 288 |

No seed statement was refused. The exception of packet 1.3a was not needed.

## 4. The figures

Each set: 80 requests (20 each of runs `GET`, runs `HEAD`, trial `GET`, trial `HEAD`), one after another, by the reviewed
helper with only the origin filled in. Statuses: S1, S2, S0 all 200 `ok`, "trial complete, nothing outstanding"; S3 all 503
`failing`, "too many rows to evaluate". `HEAD` carried the measurement headers and no body, as expected.

| Set | D1 rows read (every request) | Rows returned | D1 query time, ms (min / median / max) | Worker CPU, ms (min / median / max) | Worker wall time, ms (min / median / max) |
|---|---|---|---|---|---|
| S1 | 288 | 288 | 0.28 / 0.33 / 1.51 | 0 / 1 / 3 | 176 / 179 / 330 |
| S2 | 1,900 | 1,900 | 1.65 / 1.98 / 9.03 | 2 / 3 / 21 | 211 / 245 / 812 |
| S3 | 2,000 | 2,000 | 1.70 / 2.05 / 3.04 | 1 / 2 / 5 | 208 / 242 / 810 |
| S0 | 289 | 288 | 0.30 / 0.36 / 1.40 | 1 / 1 / 4 | 163 / 170 / 182 |
| empty (M4) | 1 | 0 | 0.09 to 0.16 | 1 to 4 | 157 to 203 |

- D1 query time and rows read are from D1's metadata returned with each query. CPU and wall time are from the Worker's
  invocation records (read through the account's Observability query, 20-second windows, none at the 100-record limit):
  **327 records**, every outcome `ok` = 7 at M4 (including one `favicon.ico` from the pane opening the page, and one `GET /`
  not named in the packet's M4) + 4 × 80.
- The browser's own latency (`wall_ms` in the measurement files) is not the Worker's wall time and is not used above.
- **Every request was served by D1's primary in Western Europe (`MAD`).** The hub's own database may be placed elsewhere.

**What it suggests for the hub, as an estimate and not a measurement of the hub:** two addresses polled every five minutes is
576 requests a day. At a completed trial's 288 rows, that is about 166,000 rows read a day; at the S2 shape, about 1.1 million;
at the cap, about 1.15 million. The account's monthly allowance is 25 billion; it has used 7.97 million this period. Extra
polls and manual reads add to this. The hub's table holds every layer's history, which S0 only approximates; the hub's own
figures are read at Stage D's start read and every read after.

## 5. D1's own totals (aggregate)

The database's analytics, read three times: 03:40:15 and 03:41:58 (both 18 rows read, 6 written: **lagging**, since the S1
seed of about 03:39 was not yet in them), and 03:49:47 (**378,973 rows read, 34,495 written, 334 read queries, 15 write
queries**). The 80-request sums from the per-request figures come to 358,163 rows read (with M4's 3). The other 20,810 rows
read are the console's seed, clear and count statements; they were not attributed one by one. **This is aggregate evidence
only.**

## 6. Departures from the packet, all listed

1. **M4's expectation was wrong** (section 2). Corrected on Chad's line; the actual answers are preserved.
2. **The code upload and binding went through the tab's session** (section 3). Accepted by Chad for those steps only.
3. **The metric readings "after seeding and before the requests" and "again after" (M5 d and g) were made for S1 only**, and
   both of those were lagging. For S2, S3 and S0 there is only the final aggregate. The per-request figures, which are the
   primary evidence, are complete for every set; the per-set aggregate comparison was not made.
4. **M4 made one request the packet did not name** (`GET /`, 404). Harmless; recorded.
5. **The Worker's deletion took two attempts:** the first click did not open the confirmation, and the Worker was still listed
   when read back. The second, through the confirmation dialog with its name typed, removed it.
6. The account usage was read at 03:28 (packet 1.2a), again at 03:33 before creating anything (M0), and at 03:55 (M7).

## 7. Cleanup, read back

- 03:54:07: the account lists one Worker, `mother-earth`.
- 03:55:02: the account lists one D1 database, `mother-earth` (`53fced06…0293`).
- 03:55:17: the fixture's address answers Cloudflare's own 404 page, not the fixture.
- 03:55:02, the hub: code 551,400 bytes, sha256 `db4f9cdf…1aa5`; 25 bindings; its D1 binding the hub's own database;
  `EARTHVIEW_ENABLED=manual`, no window variables; crons `11,41 * * * *`, `*/15 * * * *`, `*/5 * * * *`, `7 * * * *`.
  **Unchanged.** The eight UptimeRobot monitors were not touched.

**Test-only follow-up (separate commit):** check C13b in `phase1/evh-fixture.test.mjs` asserts the empty-table answers for both
addresses, on the D1 Worker and on the real hub's own route: runs 503 `completion_missing` with 288 overdue, trial 200 with no
reasons.

## 8. Not established

- The hub's own figures (a bigger table, possibly another D1 location).
- A general rule that D1 reads stop at the `LIMIT`; only this query, this index and these row sets were measured.
- Per-statement attribution of the seed and console reads in the totals.
- Nothing here bears on alert delivery: that is packet 2.
