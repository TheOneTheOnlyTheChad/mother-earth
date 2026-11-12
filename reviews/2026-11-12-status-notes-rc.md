# status-notes-rc — hub 0.6.10, run notes out of public `/status` — candidate review packet

Built on Chad's line, after GPT passed proposal rev 2: "Go: build status-notes-rc on a branch per STATUS-RUN-NOTES-PROPOSAL rev 2 (hub only; no merge, no hub deploy)". **Branch only. Nothing merged, uploaded or deployed.** Live unchanged: hub 0.6.9 `3e791a5c…c49d`, page `12ff4ff`. Lockdown parked.

Proposal: `docs/concepts/STATUS-RUN-NOTES-PROPOSAL.md` rev 2 (`0f9c263e…3883`). Branch base: main `60a94aa`.

## 1. The change (hub only)

`phase1/worker.js`, two lines:

```diff
-const COLLECTOR_VERSION = '0.6.9';
+const COLLECTOR_VERSION = '0.6.10';
…
-      const runs = await env.DB.prepare('SELECT layer, started_at, status, http_status, records, bytes, note FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)').all();
+      const runs = await env.DB.prepare('SELECT layer, started_at, status, http_status, records, bytes FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)').all();   // 0.6.10: run notes stay in D1, not public (STATUS-RUN-NOTES-PROPOSAL rev 2)
```

**Projection, verified in the diff (GPT's §5.1 ruling):** `note` is removed from the column list of the one statement that feeds `last_runs`; the `WHERE` is unchanged. No other statement, route, collector, D1 write, R2 key, cron or `/health/*` code changed (the diff above is the whole of `worker.js`). `archiveHealth()` keeps its own scoped `note` reads. `redactStatus` still wraps the response.

**No page file changed.** All ten served page files are byte-identical to main.

worker.js: 293,617 B, sha256 `784939f814335f47d3d5e0d118c6dbc2d6b0f181157a39b55ce1d0c080b6a0da`. Rollback target: 0.6.9 `3e791a5c…c49d`.

## 2. Tests

### 2.1 `phase1/status-notes-hub.test.mjs` (new, 6 checks) — real `worker.js`, D1 = real SQLite with `schema.sql`

The harness honours the projection by construction: SQLite returns exactly the columns the route's SELECT names. Seeded: one older row per layer (`MKR-older-row`), then the latest rows, each with its own marker under 32 chars:

| layer | status | http | records | bytes | note |
|---|---|---|---|---|---|
| orbital | down | 500 | 0 | 0 | `MKR-orbital-a1 GP HTTP 500` |
| usgs | ok | 200 | 39 | 14875 | `MKR-usgs-b2 generated_age_s=18` |
| firms | down | 0 | 0 | 0 | `fetch failed MKR-firms-c3 https://…/<FIRMS key>/VIIRS` |
| drifters | ok | 200 | 1298 | 218918 | `MKR-drift-d4 buoys=1298 refused=6` |

- S1 200, `no-store`.
- S2 absent by path: no `last_runs` element has a `note` key; no seeded row's element contains any marker.
- S3 each seeded element has exactly `layer, started_at, status, http_status, records, bytes`, equal to the latest seeded values, numeric types numeric.
- S4 `archive_health.collection.firms.latest_run.note` = the seeded note with the key → `[redacted]`; `…usgs.latest_run.note` = `MKR-usgs-b2 …`.
- S5 every seeded `collector_runs.note` reads back byte-identical after the request.
- S6 `now`, `collector_version` ≥ 0.6.10, `schema_version`, `cell_deg`, `stale_after_s`, `history`, `archive_health`, `last_batch` present.

Result: **6/6**.

### 2.2 Breaks and control (`phase1/status-notes-breaks.mjs`)

| Run | Fails | Expected |
|---|---|---|
| `note-restored` (`note` back in the SELECT) | S2, S3 | S2 |
| `drop-http` (`http_status` out of the SELECT) | S3 | S3 |
| control: live 0.6.9 `worker.js` (git `143f531`) | S2, S3, S6 | S2 |

All caught.

### 2.3 `phase1/status-notes-ui.test.cjs` (new, 16 checks) — the unchanged globe page against both hubs (§5.2)

The page files are served from the clone; the suite first asserts `index.html` and `app.js` are byte-identical to main `143f531`. `/status` is answered by the **real hub code in-process** over a seeded SQLite D1 (orbital row `down`, HTTP 500, started 2026-11-03 15:41:04 UTC, note `MKR-orbital-a1 GP HTTP 500`): once by the candidate, once by the 0.6.9 control (git `143f531`). The orbital snapshot and element file are the orbital-browser fixtures (built by the hub's own `orbBuild`), as in that suite; real globe.gl 2.45.0, satellite.js 6.0.2, SwiftShader.

Per case, on both hubs:
- **the control really returned the seeded note** in its orbital row (GPT's point), and the candidate's row has no `note` with `status`, `http_status`, `started_at` as seeded;
- rendered `#orb-lines` and `#card-orb` text identical across the two hubs (propagation time and "N min ago" normalised, as they advance in real time between loads);
- the marker never appears in the page DOM; no page errors.

- **A. missing snapshot** (`/snapshot/orbital` 404): panel reads exactly "Orbital layers not shown: the hub has no orbital element file yet."; layer not drawn.
- **B. usable snapshot + newer failed run:** "Latest refresh 2026-11-03 15:41 UTC failed (down); showing the previous file, retrieved 2026-11-03 13:42 UTC"; rocket bodies draw.

Result: **16/16**.

### 2.4 Existing tests changed

- `osmc-reliability-hub.test.mjs` (tests 2 and 15): the two assertions that `/status` **includes** the raw buoy note now assert the drifters `last_runs` element has no `note` and no `SECRET-RAW` (test 2 also: status `down`). **Its fake D1 now honours the SELECT's column list** (it previously returned a fixed row with `note` whatever the query asked, which would have hidden a restored column). Result 27/27 on the candidate; **2 fail on the 0.6.9 worker** (tests 2 and 15), so the flipped assertions see the old behaviour.
- `health-hub.test.mjs` H8: the note check is pinned to `archive_health.collection.firms.latest_run.note`; new assertion that the firms `last_runs` element has no `note`. 29/29 on the candidate; **H8 fails on the 0.6.9 worker**. `health-breaks.mjs` 19/19 caught.
- `orbital-browser`, `mobile-pass`, `orbital-ui`: unchanged (no page change); their fixtures keep a `note`, which no displayed branch reads.

### 2.5 Full regression

See §5 (filled in when the run completes).

## 3. What was not done

- No deploy, so no live read of `/status` from 0.6.10 and no Worker CPU figure (the change removes a column; no new work).
- No real phone (no page change).

## 4. Next (each its own line)

1. GPT reviews this packet (Mac `_review/status-notes-rc/`).
2. `Approve: deploy hub 0.6.10 from <commit> (content only)` → live read: every `last_runs` row without `note`, six fields present, `archive_health` unchanged; orbital card on the live page.
3. `Approve: merge status-notes-rc to main (hub 0.6.10 record; no page file change)` → served-hash check of the ten unchanged page files.
