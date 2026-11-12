# Remove collector run notes from the public `/status` — proposal rev 2

Rev 1 written 12 Nov 2026 (11:32 UTC clock reading) on Chad's go: "Go: draft the proposal for removing collector run notes from public /status." **Rev 2 (this file) applies GPT's review of rev 1** (Mac hash `5e0ae201…6147` verified by GPT; relayed by Chad): the candidate becomes **hub-only**. **Proposal only. Nothing built, deployed or released.** Lockdown stays parked.

Code read at main `2ea9747` (hub 0.6.9 = live, `3e791a5c…c49d`).

## 0. What changed from rev 1 (GPT's five points)

1. **Scope agreed** as written: `note` comes out of the SQL projection that feeds `last_runs`; the six structured fields, the full D1 notes, the existing response redaction, and the archive-health and batch fields all stay. The archive-health query keeps reading and exposing its own scoped notes.
2. **The `app.js` edit and the HTTP-code wording are dropped.** Rev 1's §4.1 was wrong about the page: the note line in `ME.orbPanel` is reachable only when the helper is called directly. Checked in `index.html`: `orbPaint()` calls `ME.orbPanel(orb.meta, orb.lastRun, …)` only inside `else if (onG.length && orb.meta)`, i.e. with usable metadata, where the refresh-failed line uses `status` and `started_at` only. A missing or invalid snapshot is caught in `orbFetchMeta()` (`problem`) and shown through `orbFail(problem)` as "Orbital layers not shown: …", which never touches the run row. The other two calls (`index.html` 1185, 1207) pass `lastRun = null`. No active caller displays the note branch.
3. **No page step, no page-first order, and no cached-page `down ().` outcome** (that outcome cannot happen on the page as built). The existing globe page is instead verified against the candidate hub (§5.2).
4. **Tests assert by path**, with a different marker per row: absent from every `last_runs` row; the FIRMS note expected, redacted, at its exact `archive_health` path; H8 pinned to that path.
5. **Query-level removal stays an implementation requirement**, checked by a projection-aware harness or the reviewed SQL diff. The critical break restores `note` to the public rows and must be caught by the route test. The literal-SQL check and the `strip-after` break are dropped.

## 1. The ask (Chad's scope)

- Remove `last_runs[].note` from the public `/status` response.
- Keep the full diagnostic notes in D1 (`collector_runs.note`), unchanged.
- Check the known consumers, especially the orbital freshness line.
- A test that seeds a distinctive note in D1, proves it is absent from `/status`, and proves the structured fields consumers use are still there.
- **Outside this change:** the eight `/health/…` endpoints and all collector behaviour.

## 2. What `/status` does today

`worker.js` route `p[0] === 'status'`:

```
SELECT layer, started_at, status, http_status, records, bytes, note
FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)
```

The response is `redactStatus(env, { now, collector_version, schema_version, cell_deg, stale_after_s, last_runs, opensky_spend_today, last_batch, history, archive_health })`, `no-store`. `redactStatus` removes secret values (and, for `note`/`reason`/`failure_reasons`, 32+ char tokens) but does not drop the note, so the rest of its free text is public.

Production (D1, latest row per layer, read 12 Nov ~11:32 UTC, read-only): 15 layers, notes 18–178 chars, e.g. run ids, per-cell request timings (forest), refusal breakdowns (drifters), the Mac collector's version string (ships), upstream error text (opensky), internal job names (`firms:recovery`).

## 3. Change proposed (hub only)

1. The `/status` query becomes `SELECT layer, started_at, status, http_status, records, bytes FROM collector_runs WHERE id IN (…)` (same `WHERE`). The note is never read for this answer.
2. `last_runs[]` keeps `layer`, `started_at`, `status`, `http_status`, `records`, `bytes`, unchanged in name, type and meaning. No replacement text field.
3. `redactStatus` still wraps the whole response.
4. Hub 0.6.9 → **0.6.10**. Nothing else in `worker.js` changes: collectors, D1 writes, R2, crons, `/health/*`, `/place`, `/cells`, `/snapshot`, `archiveHealth()` untouched.
5. **No page file changes.** Served-hash checks stay at ten unchanged files.

## 4. Known consumers

| Consumer | What it reads from `/status` | Effect |
|---|---|---|
| Page, orbital card (`orbFetchMeta` → `orb.lastRun` → `orbPaint` → `ME.orbPanel` with usable meta) | `status`, `started_at` of the orbital row | none: the displayed branch never reads `note` (§0.2) |
| Page, every other card; `sources.html` | nothing | none |
| Mac `phase1/sleeptest.sh` | saves `/status` to a local log during a manual sleep test; parses nothing | saved file lacks run notes; notes are in D1 |
| Mac collector, `run.sh` | nothing | none |
| UptimeRobot | `/health/*` only | none |
| Claude / GPT checks | `archive_health`, `history`, version | unaffected; run notes are read from D1 (START-HERE §4e) |

`ME.orbPanel`'s note branch (`Latest hub attempt …: <status> (<note>).`) stays in `app.js` untouched. With the new hub it would render empty brackets **only if called directly with null meta and a failed row** — no page path does that (§0.2). Recorded so a later caller doesn't inherit it unknowingly; not changed here.

## 5. Tests

### 5.1 New suite `phase1/status-notes-hub.test.mjs` (real `worker.js` in-process; harness pattern as `health-hub` / `osmc-reliability-hub`)

**Seed** `collector_runs` with rows carrying a **different marker per row**, each under 32 chars so the existing token redaction would not remove it (the test then checks removal, not redaction):

| layer | status | http_status | records | bytes | note |
|---|---|---|---|---|---|
| orbital | down | 500 | 0 | 0 | `MKR-orbital-a1` |
| usgs | ok | 200 | 39 | 14875 | `MKR-usgs-b2` |
| firms | down | 0 | 0 | 0 | `fetch failed MKR-firms-c3 …` + the FIRMS key (as H8 does) |
| drifters | ok | 200 | 1298 | 218918 | `MKR-drift-d4` |

Checks:

1. `GET /status` → 200, `Cache-Control: no-store`.
2. **Absent by path:** for every seeded row, the matching `last_runs[]` element has no `note` key, and `JSON.stringify` of that element contains none of the four markers.
3. **Structured fields:** each seeded `last_runs[]` element has exactly the keys `layer, started_at, status, http_status, records, bytes`, with the seeded values and types.
4. **Archive health, exact path:** `archive_health.collection.firms.latest_run.note` equals the seeded FIRMS note with the key replaced by `[redacted]` (and cut to 160 chars as today). `archive_health.collection.usgs.latest_run.note` equals `MKR-usgs-b2`. Nothing else in the response is asserted absent; the archive-health and batch fields are out of scope (§6).
5. **D1 preserved:** after the request, each seeded `collector_runs.note` reads back byte-identical.
6. **Projection:** the harness's fake D1 records the columns each statement selects; the `/status` `last_runs` statement must not select `note`. If GPT prefers, this is reviewed in the SQL diff instead and the harness check is dropped.
7. The rest of the response present: `now`, `collector_version` (≥ 0.6.10), `schema_version`, `cell_deg`, `stale_after_s`, `history`, `archive_health`, `last_batch`.

**Break (must fail):** `note-restored` — `note` back in the `last_runs` SELECT. Must fail check 2 for every seeded row (and check 6 if kept). Also `drop-http` (drop `http_status` from the SELECT), which must fail check 3.

### 5.2 The existing globe page against the candidate hub

Using the fixture-hub pattern (`osmc-reliability-fixture-hub.mjs`: real hub code behind a local port), a browser suite loads the **unchanged** live `index.html` / `app.js` and asserts:

- **Missing snapshot** (`/snapshot/orbital` 404, orbital run row `down`, no note): the card shows its usual "Orbital layers not shown: the hub has no orbital element file yet." text and nothing else from the run row.
- **Usable snapshot + newer failed orbital run** (row `down`, `started_at` after `retrieved_at`, no note): the toggle draws and the panel shows "Latest refresh HH:MM UTC failed (down); showing the previous file, retrieved …" exactly as with today's hub.
- Same two cases with the 0.6.9 hub file (from git) as the control: identical rendered text.

### 5.3 Existing tests that change

- `osmc-reliability-hub.test.mjs` lines 128 and 309 currently assert `/status` **includes** the raw buoy note. They flip to: the drifters `last_runs[]` element has no `note` and no `SECRET-RAW`; the note is still in `collector_runs` (already asserted).
- `health-hub.test.mjs` H8: the `/status` assertion is pinned to `archive_health.collection.firms.latest_run.note` (matches `fetch failed: … [redacted]`), and asserts the firms `last_runs[]` element has no `note`. It can no longer pass by finding the text in the wrong field.
- `orbital-browser.test.cjs`, `mobile-pass.test.cjs`, `orbital-ui.test.mjs`: unchanged (no page change). Their fixtures keep a `note` on the row, which the page ignores in every displayed branch; §5.2 covers the no-note case.

Full regression (51 suites) before GPT's candidate review.

## 6. Out of scope (still public, still redacted)

`archive_health.collection.<firms|usgs>.latest_run.note`; `archive_health.recent_failures[].note`; `archive_health.gaps[].reason`; `archive_health.last_completed[].coverage.failure_reasons`; `last_batch.result`; `opensky_spend_today`. A change to any of them is a separate scope decision.

## 7. Release and rollback

- One step: `Approve: deploy hub 0.6.10 from <commit> (content only)`, then read `/status` live (no `note` on any `last_runs` row; six fields present; archive_health unchanged) and open the orbital card on the live page.
- Merge to main follows the deploy so main = live (no page file differs; the served-hash check confirms all ten unchanged).
- Rollback: hub → 0.6.9 `3e791a5c…c49d` (own Approve line).
- Cost: $0.

## 8. What GPT is asked

1. Do §0.2 and §4 now match your reading of the orbital callers?
2. §5.1 check 6 (projection-aware fake D1) or SQL-diff review only?
3. Is §5.2 enough to settle the page behaviour?

## 9. Approval lines (none given)

- `Go: build status-notes-rc on a branch per STATUS-RUN-NOTES-PROPOSAL rev 2 (hub only; no merge, no hub deploy)`
- `Approve: deploy hub 0.6.10 from <commit> (content only)`
- `Approve: merge status-notes-rc to main (hub 0.6.10 record; no page file change)`
