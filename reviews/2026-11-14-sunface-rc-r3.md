# sunface-rc — round 3 (after GPT's review of `1a4888c`)

2026-11-14 · branch `sunface-rc` @ `6bb0228` (+ this packet) · **not deployed** · live hub is still 0.6.13 `5859fb70…f9ae` (`1a4888c`), schedule off, nothing stored

`phase1/worker.js` on the branch: sha256 `34cf1bc3735258ccfd59e345ebb96095296ff11764017391aa9c01724c92efef`, 363,402 bytes, `COLLECTOR_VERSION = '0.6.14'`
(bumped so the live version number tells the two builds apart).

## GPT's finding

The pointer was published before the `seen` marker, and a failed marker write was ignored. With that failure injected for A, then B and C
published, A came back with a fresh header and was accepted as new.

## Fix: history first, and mandatory

Order in `collectSunface` now:

1. Fetch and validate the image. Identical to the current image → "unchanged" (as before).
2. Equal to the **previous** image → rejected (direct check; needs no marker).
3. Read the marker `sunface/seen/<sha256>.json`. An unreadable marker throws: the run fails, nothing is published.
4. Marker present with a **different** file-updated time (or no valid time on this fetch) → rejected, "picture already published earlier".
   Marker present with the **same** time → an earlier attempt at this same publication that did not finish; it may continue.
5. Timestamp rule; newer-than-current rule.
6. **Write the marker for the new image (create-only). Then write the marker for the outgoing current image as well** (create-only, so an
   existing one is untouched; a lost one is restored with the image's original time, flagged `backfilled`).
   **If either write fails and the marker is not there, the run stops**: "history record could not be written". Nothing is stored or published.
7. Only then: store the image, read it back, move the pointer.

So an image cannot reach the pointer without its record, and cannot leave the current/previous pair without one.

A consequence, stated plainly: if a publication is interrupted after step 6 (say the pointer write fails), the marker exists for bytes that were
never shown. Those bytes can still be published later, but only with the same file-updated time they had then. If SDO re-serves them with a
different time, they are refused until SDO has a new picture.

## Tests

`sunface-hub`: **160 of 160.** New cases:
- **GPT's case:** marker write fails for A → A is not published, no image stored, run logged down; next run A publishes with its marker; then B, C; A with a fresh header → rejected, C stays.
- Marker of the outgoing image deleted → restored when its successor publishes, with the original time and id; A → B → C → A still rejected.
- The restore write itself fails → the successor is not published; the current image stays.
- Pointer write fails after the marker → nothing published, marker kept; same bytes with a different time → rejected; with the same time → completes with that original time.
- An unreadable marker → nothing published.

**27 breaks, each fails.** New or changed: `replay-ok`, `replay-previous-off`, `marker-optional` (GPT's bug reintroduced), `no-backfill`, `marker-any-time`, `marker-blocks-retry`.
All 30 node hub suites pass on `6bb0228`. Browser suites not rerun (hub-only change).

## Not verified

As before: production CPU and memory of a full run, User-Agent receipt, a day's behaviour, storage growth
(each image now also leaves one ~150-byte marker that is never deleted).

## Lines (Chad), in order

1. GPT's review of `6bb0228`.
2. `Approve: deploy hub 0.6.14 from sunface-rc (content only, SUNFACE_ENABLED unset)`
3. `Approve: run /admin/run/sunface once`
4. `Approve: set SUNFACE_ENABLED=1`

Rollback at any point: 0.6.12 `c1addd19…0106` (= main).
