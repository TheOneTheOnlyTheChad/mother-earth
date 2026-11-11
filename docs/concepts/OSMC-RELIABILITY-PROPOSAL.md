# Drifting buoys: keep the last good data on screen when one OSMC update fails — proposal

Rev 2, 11 Nov 2026 (GPT's review of rev 1 applied; §11 lists what changed). Docs only, for GPT's re-check and then Chad's decisions. Nothing is built, deployed or approved.

## 1. The problem

When one hourly request to NOAA OSMC fails, the drifting-buoy layer goes blank ("unknown, records withheld") for the whole hour, although the previous hour's buoys are still held by the hub and are still inside the layer's own freshness limit.

Seen once so far:

- **10 Nov, the 16:07 UTC run:** OSMC answered HTTP 522. The run is logged `down`, finished 16:08:42 UTC.
- The layer was blank on the live site at 16:57 UTC and came back with the 17:08 run (1,303 buoys). STATUS 10 Nov 17:19 has the observation.

How often (D1 `collector_runs`, read 11 Nov between 17:44:39 and 17:49:07 UTC, since 4 Nov 00:00 UTC): **186 buoy runs, 1 down.** One failed hour in about eight days. It is a small problem; the fix should be small too.

## 2. Why it happens

Each good run writes two objects from the same run: `latest/drifters.json` (records and counts) and `latest-cells/drifters.json` (counts only). The page and the place view show records only when both carry the same `retrieved_at`.

A failed run calls the shared `writeDown`, which:

- overwrites `latest-cells/drifters.json` with an empty `down` envelope stamped with the failed run's time,
- leaves `latest/drifters.json` alone,
- writes a per-run failure record (`cells/drifters/<minute>.json`) and a `down` row in `collector_runs`.

So after a failure the two `latest` objects are from different runs, and everything is withheld. The pairing rule is right; the trouble is that the hub threw away the matching counts.

## 3. What a visitor should see instead

While the last good run is inside the layer's freshness limit (4 hours for buoys) **and its records and counts still match**:

- the buoys and counts from that run, drawn as now, with that run's own retrieval time;
- the card's badge reads **degraded**, and a line says why:

> Latest update failed at 16:08 UTC. Showing buoys from the 15:08 UTC run.

Rules for the line:

- "failed at" is the time the attempt actually failed (16:08), not the run's scheduled minute (16:07).
- When the two times fall on different UTC dates, both carry their date: "Latest update failed at 00:08 UTC, 11 Nov. Showing buoys from the 23:08 UTC run, 10 Nov."
- **"Showing buoys from…" appears only when buoys from that run are actually being shown.** If the records could not be read or do not match the counts, the card says only "Latest update failed at 16:08 UTC." and keeps today's "Records withheld: …" reason.

"Degraded" here is an update-status badge on the buoy card. The good run's coverage grade and freshness calculation are not changed by it. Once the last good run is older than 4 hours, **unknown takes precedence**: records withheld, nothing drawn, as today.

No time is moved forward: "retrieved … ago" keeps counting from the last good run.

## 4. The change (H1)

### 4.1 What the hub writes on a failed buoy run

`latest-cells/drifters.json` keeps **the last good counts envelope unchanged, with one block added**:

```json
"last_attempt": { "run": "2026-11-10T16:07:00.000Z", "failed_at": "2026-11-10T16:08:42.580Z",
                  "status": "down", "http": 522, "reason": "http_error", "consecutive_failures": 1 }
```

- `retrieved_at`, `cells`, `source_status`, `scheduled_for`, `collector_version` and every other field stay as the good run wrote them. `latest/drifters.json` is not touched.
- The hub does not claim a matched pair. It preserves the counts; whether records match is checked where it is checked today, by the page and by the place view at read time.
- `reason` is one of four fixed codes. The raw error text stays in `collector_runs` only.
- A good run writes both objects fresh, with no `last_attempt`.
- Unchanged: the `down` row in `collector_runs` with its full note, and the per-run failure record `cells/drifters/<minute>.json`. Those describe the failed run; `latest-*` describes the last good data.

### 4.2 Which failures take this path

Both the scheduled job and the manual run (`/admin/run/drifters`) go through `guarded()` into `collectDrifters`, so both are covered by the same code.

| Failure | Where it is caught | `reason` |
|---|---|---|
| Request throws (no connection, timeout) | `collectDrifters` | `fetch_failed` |
| Non-2xx answer (the 522) | `collectDrifters` | `http_error` |
| Our checks refuse the response (header, units, too few buoys, count halved) | `collectDrifters` | `refused_by_checks` |
| Anything unexpected thrown inside the run | `guarded()` | `internal_error` |

The first three happen before anything is published, so the last good pair is intact. For the fourth, `guarded()` gets a buoy branch that calls the same preserving write instead of the generic `writeDown` (the way the FIRMS v2 pipeline already avoids it). An unexpected throw can land between the two publishes of an otherwise good run, leaving new records beside old counts. The preserving write does not try to repair that: it keeps the counts it finds and adds `last_attempt`; the pair check then fails at read time and the buoys are withheld with the existing reason, and the card says only that the update failed (§3).

**When there is nothing good to keep** — no counts object, or the stored one is itself an empty `down` envelope — the hub writes the `down` envelope as today.

### 4.3 A late failure must not overwrite newer data

Two runs can overlap (a slow scheduled run and a manual run, or a run that hangs past the next hour). The preserving write is guarded, using the Worker's existing R2 conditional-write pattern (`onlyIf: { etagMatches }`, as in the FIRMS v2 code, proven on production by the 7 Nov probe):

1. Read the counts object and its etag.
2. If its `retrieved_at` is later than this attempt's start, a newer run has already published: **write nothing** to `latest-*`. Log the failed run and stop.
3. If it already carries a `last_attempt` from a later attempt than this one, write nothing.
4. Otherwise put the same envelope plus `last_attempt`, conditional on the etag read in step 1.
5. If the condition fails, something else wrote in between: re-read once and apply steps 2–4 again; if it fails a second time, write nothing and log it.

A good run's publish is unconditional, as today, and replaces the envelope whole, so a good run always clears `last_attempt`.

### 4.4 The place view

Today `/place` returns matched buoy records with no age cutoff, and `app.js` labels a stale section while still listing it. So with H1 alone, a page (including an old cached one) could keep listing the fallback's buoys after four hours.

- **The hub enforces the limit on the buoy place section:** when the counts carry `last_attempt` and the good run is older than `stale_after_s` (4 h), the section is returned as `withheld`, with the reason that the last successful update is over 4 hours old. No records are returned.
- **Inside the limit**, the section passes `last_attempt` through, and the page adds one clause, only when the section actually holds records from the good run: "latest update failed at 16:08 UTC; from the 15:08 UTC run".
- A mismatched or unreadable records object gives `withheld` with today's reason, with or without `last_attempt`.

Whether the cutoff should apply to every buoy place section past 4 h, not only the fallback, is O7.

### 4.5 The page

- The buoy card reads `last_attempt` from `/cells/drifters`: badge and line per §3. The badge override lives in the card code; `ME.freshness('drifters')` keeps computing from the good run and still returns unknown past 4 h.
- Sources gets one sentence in the buoy section.
- `app.js` changes (place clause), so the `?v=` bump applies.

### 4.6 Unchanged

Validation rules, the pairing rule, history (`drifter_fixes` takes good runs only), the health endpoints (none cover buoys), cron, variables, schema, R2 layout, every other layer.

## 5. Options not taken

- **H2, one retry inside the run: deferred** (GPT). One 522 in 186 runs supports keeping the previous pair; it is no evidence that a retry 20 s later would have succeeded.
- **P1, page-only:** the place view and any other reader of the hub would still see the blank. The hub is the product.
- **Leave as is:** still a fair choice if this is not worth a hub release.

## 6. Decisions for Chad

GPT recommends H1 only, degraded on the buoy card, four hours, refused responses included, and the short place clause. These stay Chad's.

| | Question | GPT and Claude lean |
|---|---|---|
| O1 | H1, or leave as is (H2 deferred, P1 not recommended) | H1 |
| O2 | Card wording (§3) | as written |
| O3 | Badge reads "degraded" while the fallback is usable | yes |
| O4 | Freshness limit stays 4 h (up to three failed hours shown, then unknown) | yes |
| O5 | A response our checks refuse takes the same path, with its own reason code | yes |
| O6 | The place view carries the short clause | yes |
| O7 | The hub's 4 h cutoff on the buoy place section: fallback only, or every buoy place section past 4 h | fallback only for this change (Claude's lean; new in rev 2, not yet seen by GPT) |

## 7. Scope

Buoys only. The same `writeDown` behaviour applies to every layer, but the others either run every 5–15 minutes or carry their own rules. Extending the pattern to another layer would be its own proposal with its own evidence.

## 8. Tests

**Hub, through the real dispatch path and the public endpoints** (the scheduled job entry and `/admin/run/drifters`, then `GET /cells/drifters`, `/snapshot/drifters`, `/place/g4/<cell>`; fake R2 with etags and conditional puts, real SQLite):

1. **good → failure → recovery.**
   - After the failure: the decoded counts payload with `last_attempt` removed deep-equals the good run's decoded counts payload (decoded, because adding a field changes the bytes). Records object: bytes and etag unchanged, same run ID. A `down` row logged with the raw note. The per-run failure record written.
   - After recovery: a newly matched pair from the new run, `last_attempt` gone.
2. **Each failure kind** (§4.2): throw, 522, refused by checks, and an unexpected throw via `guarded()` — right `reason`, counts preserved, generic `writeDown` not called for buoys.
3. **Two failures in a row:** `consecutive_failures` 2, `failed_at` moves, counts still the good run's.
4. **Late failure against a newer good publish:** start a run, let a second run publish a newer good pair, then fail the first. The newer pair survives byte for byte, with no `last_attempt`.
5. **Conditional write loses the race:** the counts object changes between read and put; re-read once; newer good data is never overwritten.
6. **Late failure against a later failure:** the later `last_attempt` stands.
7. **Nothing good to keep:** first run ever fails; stored counts are already an empty `down` envelope → today's `down` envelope.
8. **Unexpected throw between the two publishes:** counts preserved with `last_attempt`; `/place` returns `withheld` (mismatch); no records returned.
9. **Missing records object** with fallback counts: `/place` withheld.
10. **Place cutoff:** fallback at 3 h 59 min → records with `last_attempt`; at 4 h 1 min → `withheld`, no records. A good pair with no `last_attempt` at the same ages behaves as today (O7).
11. The raw error text never appears in any published object.

**Page** (browser suite; hub responses are produced by the real hub code, not hand-written):

1. Fallback inside the limit: buoys drawn, counts shown, badge degraded, the full line with both times, "retrieved … ago" from the good run; coverage grade unchanged.
2. Dates cross midnight: both dates shown.
3. `last_attempt` present but records unreadable, and present but mismatched: nothing drawn, no "Showing buoys", only "Latest update failed at …", plus the existing withheld reason.
4. **Ageing in an already-open page:** advance the clock through 4 h without reloading. The badge becomes unknown, the map drops the buoy points and their cells, and a fresh place request withholds them.
5. Recovery inside one open page through its own refresh: badge and line gone.
6. Place clause shown only when the section holds records.
7. **Old page on the new hub:** main's current page files (before this change) served against hub fixtures that carry `last_attempt`: draws the matched pair with the true retrieval time, no line, goes unknown at 4 h, and its place view stops listing at 4 h (the hub's cutoff).
8. **New page on the old hub** (no field; a `down` envelope after a failure): behaves exactly as today.
9. Layer off: no buoy request.

**Breaks, each must fail:** the failed run's time stamped onto the counts; `last_attempt` kept after a good run; the write made unconditional (case 4 or 5 fails); `guarded()` still calling `writeDown` for buoys; the place cutoff removed; the page showing "Showing buoys" without records; the page drawing past 4 h; the page treating a missing field as a failure; "failed at" taken from the run minute.

Then the usual regression suites.

## 9. Release order and rollback

1. Branch build and tests; GPT review of the candidate.
2. **Page first.** With hub 0.6.7 the new page never sees `last_attempt`, so nothing changes for visitors. Own Approve line; served-hash check.
3. **Hub 0.6.8**, content only. Own Approve line; read-back; first scheduled buoy run read in D1.
4. The failure path cannot be triggered on production without breaking a real run. It is proven by the tests and then watched: the next real failed run is read from D1, R2 and the live page.

**Rollback** — hub back to 0.6.7 (`53ede31e…fb9e43`) and/or revert the page merge, each on its own line; they are independent.

- **Residual after a hub-only rollback:** a `last_attempt` already written to R2 stays in the counts envelope until the next buoy run replaces it — a good run writes a fresh pair, a failed run under 0.6.7 writes the empty `down` envelope. That is at most about an hour.
  - *Page* during that hour: the new page still shows the fallback, the badge and the line; all of it is still true (the latest attempt did fail), and the 4 h limit still applies in the page.
  - *Place* during that hour: hub 0.6.7 has no cutoff, so a place request past 4 h would list the records again with the page's existing stale label. This needs the fallback to be already over 3 hours old at the moment of rollback.
- **Page-only rollback:** the old page with hub 0.6.8 shows the matched pair without the line and honours 4 h (test 7).

Running cost: $0 expected (on a failed run only: one extra R2 read and one conditional write).

## 10. Questions for GPT (re-check)

1. §4.3: are the five steps the right guard, including writing nothing when a newer run has published?
2. §4.2: an unexpected throw between the two publishes is left unrepaired and withheld. Acceptable, or should the hub rebuild the counts from the records object (which carries its own cells)?
3. O7: fallback-only cutoff for this change, or every buoy place section past 4 h?
4. Anything in §8 that could still pass with a partial fix?

## 11. What changed from rev 1 (GPT's review, relayed by Chad 11 Nov)

GPT verified the Mac copy by sha256; found H1 the right shape and the cached-page behaviour acceptable; asked for revision before a branch-build go.

1. **Overlap and wrappers:** §4.2 names every failure path including `guarded()`; §4.3 adds the conditional write so a late failure cannot overwrite a newer good publish; the hub no longer describes the fallback as a pair; the failed-run log and per-run record are stated as separate from the latest good data.
2. **Place:** §4.4 adds the hub-side 4 h cutoff and the "only when records are present" rule; the same rule applies to the card's "Showing buoys" line.
3. **State and wording:** "degraded" as an update-status badge with the good run's coverage and freshness intact; unknown takes precedence after expiry; "failed at" uses the actual failure time (16:08); dates shown across midnight; 4 h kept; refused responses under their own code.
4. **Retry:** H2 deferred.
5. **Tests:** dispatch-path and public-endpoint run; decoded-payload comparison; interleaved late failure; missing and mismatched records; ageing in an open page including map and place; old page on the new hub.
6. **Rollback:** the R2 residual documented for the page and the place view.
7. New in rev 2 and not from the review: `internal_error` as a fourth reason code; O7; question 2 in §10.
