# sunface-rc — round 4 (after GPT's review of `0365ea4`)

2026-11-14 · branch `sunface-rc` @ `90c7cc5` (+ this packet) · **not deployed** · live hub is still 0.6.13 `5859fb70…f9ae` (`1a4888c`), schedule off, nothing stored

`phase1/worker.js`: sha256 `bbf8dc61447a690b329733e1b13c5b9c632dd0c91b7c580be0169712702d0480`, 364,554 bytes, `COLLECTOR_VERSION = '0.6.14'`.

## GPT's finding

A marker that appears after the initial lookup but before the create-only write made the write lose; the fallback checked only that
a marker existed, so publication went on under a different time.

## Fix: the standing marker decides

`record()` now returns the marker that stands for the bytes: ours if the create-only write won, otherwise the existing one, **read back and
required to carry the same sha256 and a file-updated time**. After recording, one rule is applied whatever happened before:

> if the standing marker's `file_updated` differs from this fetch's, the fetch is refused ("picture already published earlier").

Equal times go on (an interrupted publication resuming). A marker that is unreadable, about other bytes, or without a time stops the run
("history record could not be written"). The earlier lookup-before-write check is kept only to avoid needless writes; correctness no longer rests on it.

## A second interleaving, found while checking this one

When a run's fetch equals the current image and its "unchanged" write loses to another run that moved the pointer on, the run went on
judging against its stale copy of the pointer. If that image's marker had also been lost, the old bytes could be republished over the newer
image. Now the run takes the pointer as it stands after the lost write (the image is then "previous", and is refused). Test added; the
break `stale-before` fails it.

## Tests

`sunface-hub`: **171 of 171.** New:
- GPT's exact interleaving: lookup sees nothing; a marker for the same bytes with a time 3 h 39 min earlier lands before the write → not published under the fresh time, rejected, winning marker untouched; a check confirms the hook fired.
- Same interleaving with the same time → publication continues with that time.
- Racing marker about other bytes / not JSON / without a time → nothing published.
- Pointer moves A→B during an "unchanged" check of A, with and without A's marker.

**28 breaks, each fails.** Two earlier breaks (`replay-ok`, `marker-any-time`) were removed: they weakened only the lookup-before-write
check, which is now redundant, so they no longer changed behaviour. New: `conflict-exists-only` (GPT's bug), `conflict-any-bytes`, `stale-before`.
All 30 node hub suites pass. Browser suites not rerun (hub-only change).

## What I checked by reasoning and did not find a hole in

- Two runs, same bytes, different times, neither sees a marker: one create wins; the other reads the winner, times differ, refused.
- Two runs, same bytes, same time: both go on; the second's pointer write sees the same image already current and stands down.
- Rival publishes a different newer image mid-run: this run is superseded. A different older one: this run publishes; the rival's image
  becomes previous, and the rival wrote its own marker before publishing.

Not covered: markers deleted from storage by hand for images that have already left the current/previous pair.

## Lines (Chad), in order

1. GPT's review of `90c7cc5`.
2. `Approve: deploy hub 0.6.14 from sunface-rc (content only, SUNFACE_ENABLED unset)`
3. `Approve: run /admin/run/sunface once`
4. `Approve: set SUNFACE_ENABLED=1`
