# Remove collector run notes from the public `/status` — proposal rev 1

Written 12 Nov 2026 (clock reading 11:32 UTC, workspace `date -u`), on Chad's go: "Go: draft the proposal for removing collector run notes from public /status." **Proposal only, for GPT's review. Nothing built, deployed or released.** Lockdown stays parked; this is a stand-alone backlog item (candidate (c) in HANDOVER).

Code read at main `143f531` (hub 0.6.9 = live, `3e791a5c…c49d`).

## 1. The ask (Chad's scope)

- Remove `last_runs[].note` from the public `/status` response.
- Keep the full diagnostic notes in D1 (`collector_runs.note`), unchanged.
- Check the known consumers, especially the orbital freshness line.
- A test that seeds a distinctive note in D1, proves it is absent from `/status`, and proves the structured fields consumers use are still there.
- **Outside this change:** the eight `/health/…` endpoints and all collector behaviour (what is written to D1, R2 or `latest/`).

## 2. What `/status` does today (read from the code)

`worker.js` route `p[0] === 'status'`:

```
SELECT layer, started_at, status, http_status, records, bytes, note
FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)
```

The response is `redactStatus(env, { now, collector_version, schema_version, cell_deg, stale_after_s, last_runs, opensky_spend_today, last_batch, history, archive_health })`, `no-store`.

`redactStatus` (0.5.3 rev 2) removes every secret-length env value from every string and, for keys `note`, `reason`, `failure_reasons`, also any 32+ character token. **It does not cut or drop the note**, so the rest of the free text reaches the public.

What that looks like on production (D1, latest row per layer, read 12 Nov ~11:32 UTC, read-only): 15 layers; notes 18–178 chars. Examples: run ids (`run=2026-11-12T11-30Z-1794483043180-cf9bb0565d01`), per-cell request timings (forest), refusal breakdowns (drifters), the Mac collector's version string (ships, mock), upstream error text (`pull failed: Error: token http 522 …`, opensky), internal job names (`firms:recovery`).

## 3. Change proposed

1. **The `/status` query stops selecting `note`.** It becomes `SELECT layer, started_at, status, http_status, records, bytes FROM collector_runs …` (same `WHERE`). The note is never read for this answer, so it cannot be returned by accident through a later refactor of the response object.
2. **`last_runs[]` keeps these fields, unchanged in name, type and meaning:** `layer`, `started_at`, `status`, `http_status`, `records`, `bytes`.
3. **No replacement text field.** No summary, no "reason code" invented for this change. (If a short machine-readable reason is wanted later, that is its own proposal: it would need defining per collector.)
4. `redactStatus` stays as it is, wrapping the whole response (it still protects the fields listed in §6).
5. Hub version bump (0.6.9 → 0.6.10). Nothing else in `worker.js` changes: collectors, D1 writes, R2, crons, `/health/*`, `/place`, `/cells`, `/snapshot` are untouched.

Exact diff for review comes with the branch candidate, not this proposal.

## 4. Known consumers (searched at `143f531`)

| Consumer | What it reads | Effect |
|---|---|---|
| **Page, orbital card** (`index.html` line 1129 → `ME.orbPanel` in `app.js` line 516) | `last_runs[]` row with `layer === 'orbital'`: `status`, `started_at`, and **`note` in one line** | see §4.1 — **needs a page change** |
| Page, every other card | nothing from `/status` (cards read `/cells`, `/snapshot`, `/place`) | none |
| `sources.html` | does not fetch `/status` | none |
| Mac `phase1/sleeptest.sh` (line 68) | saves `/status` to a local log file during a manual sleep test | the saved file will lack notes; the script parses nothing from it. Diagnostics live in D1 (read with the connector) |
| Mac collector `collector-mac.mjs`, `run.sh` | do not read `/status` | none |
| UptimeRobot (8 monitors) | `/health/*` only | none (out of scope) |
| Claude / GPT checks | have read `/status` for `archive_health`, `history`, version | unaffected; run notes are read from D1 via the connector (START-HERE §4e) |
| `phase1/recovery-firms-2026-11-05/recover.mjs` | a historical record that cites `archive_health…failure_reasons` | not a live reader; unaffected |

### 4.1 The orbital freshness line

`ME.orbPanel(meta, lastRun, now)` uses the `/status` row two ways:

- **`failedRun`** = the row when `status !== 'ok'` and it started after the snapshot's `retrieved_at` (or there is no snapshot). Uses `status` and `started_at` only.
- **With a usable snapshot** (the normal case): `Latest refresh HH:MM UTC failed (down); showing the previous file, retrieved …`. **No note.** Unaffected.
- **With no usable snapshot** (the "not available" headline): `Latest hub attempt HH:MM UTC: down (<note, first 120 chars>).` **This is the one place the page shows a run note.** With the note gone it would read `… : down ().`

Proposed page change (`app.js` only, one line):

- `Latest hub attempt HH:MM UTC: down (HTTP 500).` when `http_status` is a positive integer;
- `Latest hub attempt HH:MM UTC: down.` otherwise (`0`, null, absent).
- The page stops reading `note` from `/status` entirely, so it renders the same whether the hub sends a note (old hub) or not (new hub).

Everything else in `orbPanel` is unchanged. `app.js` gets a new `?v=` on the pages that load it.

**Open for GPT:** is `HTTP <code>` the right public replacement, or should the line carry the status word alone? (Lean: keep the HTTP code; it is already a structured field on the public response and says something useful.)

## 5. Release order and compatibility

**Page first, then hub**, each on its own Approve line:

1. Page release (new `app.js`): works with today's hub (ignores the note it still receives) and with the new hub.
2. Hub 0.6.10 deploy (content only).

Version skew, both ways:

- New page + old hub 0.6.9: note present, ignored. Line shows the HTTP form. Fine.
- Old cached page + new hub: in the no-snapshot case only, the old page renders `down ().` until reloaded. Cosmetic, rare (needs a failed orbital run **and** no usable orbital file), and gone on reload. Stated, not fixed.

**Rollback**, independent, each its own Approve line: hub → 0.6.9 `3e791a5c…c49d` (notes back on `/status`); page → revert the merge (the old line comes back; with the new hub it shows `()` in the rare case above).

## 6. Explicitly out of scope (other free text still on `/status`)

Chad scoped this to `last_runs[].note`. These remain public after the change, still passed through `redactStatus`, and are listed so the boundary is visible, **not proposed here**:

- `archive_health.collection.<firms|usgs>.latest_run.note` (cut to 160 chars);
- `archive_health.recent_failures[].note` (history job failures);
- `archive_health.gaps[].reason`;
- `archive_health.last_completed[].coverage.failure_reasons`;
- `last_batch.result` (JSON of per-aggregator results, can contain `'error ' + e` text);
- `opensky_spend_today` (numbers and times only; parked layer).

If Chad wants any of them handled, that is a separate scope decision (they feed the archive-health reading that Claude and GPT use; removing them would need those readers moved to D1 first).

## 7. Tests

### 7.1 New suite `phase1/status-notes-hub.test.mjs` (in-process real `worker.js`, same harness pattern as `health-hub` / `osmc-reliability-hub`)

1. **Seed** `collector_runs` with one row per layer used by the page and the checks — at least `orbital` (status `down`, http_status 500), `usgs` (ok), `firms` (down) — each with a distinctive note: `STATUSNOTE-<layer>-7f3c9a…` (a fixed marker, under 32 chars so it would survive the existing token redaction and therefore really tests removal, not redaction).
2. **Absent:** `GET /status` → 200; the raw response text contains no `STATUSNOTE-` marker; no `last_runs[]` element has a `note` key.
3. **Present and correct:** for each seeded layer, `last_runs[]` has exactly `layer, started_at, status, http_status, records, bytes`, with the seeded values and types (e.g. orbital `status: 'down'`, `http_status: 500`, `started_at` as seeded).
4. **Diagnostics kept:** the D1 row still holds the full marker note after the request (read back from the fake DB).
5. **Rest of the response intact:** `now`, `collector_version`, `schema_version`, `cell_deg`, `stale_after_s`, `history`, `archive_health` present; `Cache-Control: no-store`.
6. **Out-of-scope behaviour unchanged (asserted, so a later scope change is visible):** a note seeded on a `firms` row still appears, redacted, in `archive_health.collection.firms.latest_run.note`; `/health/runs/firms` answers exactly as before.
7. **Breaks (each must fail):** `select-note` (re-add `note` to the SELECT), `strip-after` (keep the SELECT but delete `note` per row after the query — passes 2 and 3 but must fail a check that the query text does not select `note`; if GPT thinks a query-text check is too brittle, drop this break and say so), `drop-field` (also drop `http_status`), `redact-only` (replace the removal with `redactText`, as today).

### 7.2 Page

- `phase1/orbital-ui.test.mjs`: the no-snapshot cases (`noneFail`) assert the new wording for `http_status` 500, 0, null and absent; a row that still carries a note (old hub) renders identically to one without (note ignored). Break `reads-note` (old line restored) must fail.
- `phase1/orbital-browser.test.cjs`: its `/status` fixtures drop `note` and add `http_status`; the refresh-failed path still renders.
- `mobile-pass.test.cjs` fixture: drop `note` (cosmetic; it only needs an orbital row).

### 7.3 Existing tests that assert today's behaviour and must change

- `osmc-reliability-hub.test.mjs` lines 128 and 309 assert `/status` **includes** the raw buoy note ("existing behaviour"). They flip to assert it is **absent**, and that the note is still in `collector_runs` (already asserted).
- `health-hub.test.mjs` H8 asserts the FIRMS fetch-error note survives in `/status` minus the key. That text still appears in `archive_health.collection.firms.latest_run.note` (out of scope, §6), so H8 should pass unchanged; the build will confirm, and if it needs repointing to that path it will be said in the packet.
- `health-breaks.mjs` (`/status not redacted`): unchanged; redaction still wraps the response.

Full regression as usual (51 suites) before GPT's candidate review.

## 8. What GPT is asked

1. Is the scope boundary right: query-level removal of `last_runs[].note` only, everything in §6 left as is and listed?
2. The orbital replacement line (§4.1): `HTTP <code>` or status word alone?
3. Page-first order and the stated cosmetic skew for cached old pages: acceptable?
4. The test design in §7.1, in particular whether the query-text break (`strip-after`) is worth having.
5. Any consumer missed (§4).

## 9. Approval lines (none given)

- `Go: build status-notes-rc on a branch per STATUS-RUN-NOTES-PROPOSAL rev <n> (no merge, no hub deploy)`
- `Approve: merge status-notes-rc to main (page change: orbital line no longer reads the run note)`
- `Approve: deploy hub 0.6.10 from <commit> (content only)`

Cost: $0 (no new storage, request or schedule).
