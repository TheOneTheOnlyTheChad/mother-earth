# sunface-rc — hub side of the Sun globe (stage 1: job, probe, routes)

2026-11-14 · branch `sunface-rc` @ `2bfa014` (+ this packet) · from main `741b9a9` · **hub source only; nothing deployed; no page change**
Built to `docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md` rev 2.3 §3.2 ("Collection").

`phase1/worker.js` on the branch: sha256 `018c3e3eea067eca1c6242eb94325afe9ff15d87f98f355c60be48f6ccda0c61`, 360,666 bytes, `COLLECTOR_VERSION = '0.6.13'`.
Live hub is 0.6.12 `c1addd19…0106` and stays so until Chad's deploy line.

## What the hub would do

- **One request an hour**, last in the hourly job, only on scheduled runs, only when `SUNFACE_ENABLED=1`:
  `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIIC.jpg` (HMI continuum, 1024 px), with the application User-Agent, 30 s limit, no retry.
- **Checks before anything is kept:** HTTP 200; `image/jpeg`; 20,000 B – 2 MiB (enforced while reading); JPEG structure with size exactly 1024 × 1024 and an end marker. The picture is not decoded (a Worker has no decoder).
- **Stored unchanged** at `sunface/images/<id>/sun.jpg`, read back and hash-compared before the pointer moves. `<id>` = file-updated time + first 16 hex of the sha256.
- **Pointer** `sunface/current.json`: `image`, `previous`, `last_checked`, `last_attempt`, `age_limit_s: 10800`, credit. Every pointer write is conditional on what was read.
- **Routes:** `GET /snapshot/sunface/meta` (no-store; includes the hub's clock) and `GET /snapshot/sunface/<id>/sun.jpg` (current or previous only; bytes must match the pointer; immutable; CORS).
- **Probe:** `GET /admin/probe/sunface?key=…` — exactly one request for the image; stores nothing, logs nothing; returns status, bytes, hash, the Last-Modified / Date / ETag headers, the parsed file-updated time, its age, and whether the timestamp passes the rule.
- **Manual run:** `/admin/run/sunface` (admin key; ignores the gate).

## The time rules, as built

| Rule (proposal §3.2) | In the code |
|---|---|
| Three times never merged | `observed_at` is always `null` (the hub does not know it); `file_updated` = SDO's Last-Modified; `retrieved_at` = hub clock |
| Identical bytes keep the original timestamp | same sha256 as the current image → image and all its times untouched; only `last_checked` moves; logged "unchanged". Holds whatever headers arrive, including none |
| No trustworthy timestamp, no publication | Last-Modified must be a plain HTTP date, not more than 2 minutes ahead of the hub clock, and **newer than the current image's**. Otherwise the fetched image is rejected and not stored |
| A bad replacement does not displace a good image | a rejected or failed run never changes `image`; it sets `last_attempt` (`rejected` or `down`, fixed reason, failure count) |
| Age limit is the page's job, at display time | the hub expires nothing; it publishes `age_limit_s` and its clock |

Two choices of mine to check:
1. **Two-minute future tolerance** on Last-Modified (clock skew). Beyond it the timestamp is not trusted.
2. **Different bytes with an equal or older Last-Modified are rejected** ("timestamp not newer than the current image"). The proposal did not say; accepting them would let a picture go backwards in time.

## Tests

- `phase1/sunface-hub.test.mjs`: **117 of 117.** Real `worker.js` against a fake R2 (etags, conditional writes), a recording D1 and a stubbed SDO.
  Covers: gate and schedule; first publication; identical bytes (newer header, no header); replacement and what stays served;
  five untrustworthy-timestamp forms with and without a current image; equal / older time; failure count and reset;
  nine bad answers (one request each, no retry); read-back mismatch; a rival run publishing mid-write; an uncaught storage error;
  routes (unknown id, stray object, corrupted bytes, missing object); probe (one request, nothing stored or logged, key needed).
- **19 breaks, each fails:** gate-ignored, manual-hourly, same-bytes-renews, loose-stamp, future-ok, not-newer-ok, move-on-fail, no-cas, no-readback, any-image, no-integrity, probe-stores, probe-two, generic-down, no-ua, retry, any-size, any-dims, observed-invented.
- Neighbours unchanged: `skycraft-hub` 164, `dustrgb-hub` 174.
- Full regression at `2bfa014`: 04:33:02–05:00:35 UTC, 59 files run (4 manual skipped), 59 pass.

## Finding on observation time (browser pane, 14 Nov 2026 04:32:43 UTC, read-only)

- `latest_1024_HMIIC.jpg` at that moment: 206,197 B, Last-Modified 04:10:05 GMT.
- It was **byte-identical** (sha256) to `…/assets/img/browse/2026/11/14/20261114_034500_1024_HMIIC.jpg`, same Last-Modified. The file name carries 03:45:00, so the file was written 25 minutes after the time in its name.
- A newer browse file (`…_040000_…`, written 04:30:05) already existed while "latest" still pointed at 03:45.
- So a route to a **verified image time** exists: read the day's browse listing, fetch the file whose bytes equal "latest", take the time from its name. Cost: two more requests an hour. Not built. Open: what exactly SDO's file-name time denotes (to confirm from SDO's own documentation), and behaviour across midnight.
- Until that is agreed and built, `observed_at` stays null and the page says "File updated at …", as the proposal requires.

## Not verified

- **Whether the Worker can reach `sdo.gsfc.nasa.gov`** — only the browser pane has. This is what the probe is for.
- Whether SDO's server sees our User-Agent.
- CPU and memory of the job in production (one ~200 KB body hashed twice). To read after the first manual run.
- Storage growth: one ~200 KB object per new image, never deleted by this version (up to ~4.8 MB a day if every hour differs). A cleanup rule is not built.

## Order from here (each its own line from Chad)

1. GPT review of this branch.
2. `Approve: deploy hub 0.6.13 from sunface-rc (content only, SUNFACE_ENABLED unset) and run /admin/probe/sunface once`
3. Report the probe. If the Worker cannot reach SDO, stop and rethink.
4. `Approve: run /admin/run/sunface once` → read the pointer, the stored file, D1, CPU.
5. `Approve: set SUNFACE_ENABLED=1` (Chad clicks the final deploy button in the variables form).
6. Then the Sun globe page on its own branch (projection, mask, alignment check), the REGISTER entry, and the push.

Rollback at any point: hub 0.6.12 `c1addd19…0106`; removing `SUNFACE_ENABLED` stops the schedule.
