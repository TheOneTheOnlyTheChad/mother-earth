# sunface — round 2 fixes, deploy and probe

2026-11-14 · branch `sunface-rc` @ `1a4888c` (+ this record) · hub 0.6.13 is LIVE (content only) · `SUNFACE_ENABLED` unset · no page change

## 1. GPT's two findings on `4dd44b7`, fixed in `1a4888c`

1. **Timestamps.** Zero tolerance: a Last-Modified later than the hub's retrieval time is rejected (the two-minute allowance is gone).
   Calendar validation: the header must read back identically after parsing (`new Date(ms).toUTCString() === header`), so "31 Feb"
   (which `Date.parse` turned into 3 Mar), a wrong weekday, hour 24, minute 60 or a non-leap 29 Feb are all rejected.
2. **Replay.** Bytes the hub has already published are never published again under a fresh time:
   - checked against the **previous** image directly, and
   - against **any earlier** image through a marker written at publication, `sunface/seen/<sha256>.json` (create-only; holds the original file-updated time).
   The previous-image check does not depend on the markers. A → B → A, A → B → C → A, and C-current/B-previous → B are all rejected as
   "picture already published earlier"; the current image and the previous image's original time are untouched.
   Different bytes with an equal or older time stay rejected, as GPT ruled.

`observed_at` stays null; the browse-file finding is not used (GPT: the file-name time's meaning is unverified).

Tests: `sunface-hub` **149 of 149**; **24 breaks each fail** (new: `skew-ok`, `no-calendar`, `replay-ok`, `replay-previous-only`, `no-seen-marker`).
All 30 node hub suites pass on `1a4888c`. The browser suites were not rerun for this hub-only change (full regression was at `2bfa014`: 59 of 59).

**GPT has not reviewed `1a4888c`.** Chad's deploy line arrived in the same message as GPT's hold; the fixes were made first and then deployed on that line.

## 2. Deploy (Chad: "Approve: deploy hub 0.6.13 from sunface-rc (content only, SUNFACE_ENABLED unset) and run /admin/probe/sunface once")

- Before: live `worker.js` read back as `c1addd19e7b64d381664e0a05dfc3550c629ff5180946d3b547ccba6054c0106`, 347,290 B (0.6.12) at 05:44:42 UTC.
- Candidate fetched from GitHub at commit `1a4888c`: `5859fb70dd4d9be5991e8bd6d0dd3558500f55bb6d50473383d288ba9d63f9ae`, 361,884 B — equal to the branch file.
- Content-only PUT 05:44:52–05:44:54 UTC, HTTP 200; Cloudflare `modified_on` **2026-11-14T05:44:54.526Z**. Read back: 361,884 B, same sha256 — exact.
- After: `/` reports version `0.6.13`; health 8 of 8 answer 200 (05:45:38 UTC); `/status`, `/snapshot/usgs`, `/snapshot/dustrgb/meta` 200; `/snapshot/skycraft/meta` still names `20261114T050809Z-71d1328e9dc01272`.
- `/snapshot/sunface/meta` before and after the probe: 200, `image: null` — nothing published.
- **The hub is now ahead of main**: 0.6.13 lives on `sunface-rc`. A deploy built from main would remove the Sun job.

**Rollback (own Approve line):** hub 0.6.12 `c1addd19…0106` (= main's `worker.js`).

## 3. Probe (one request, 05:45:18–05:45:22 UTC)

`/admin/probe/sunface` without the key: 403. With it:

| | |
|---|---|
| Worker reached SDO | **yes** — HTTP 200 in 3,274 ms |
| File | 204,789 B, JPEG 1024 × 1024, structure checked, sha256 `1c2b19e5…e948` |
| Last-Modified | `Sat, 14 Nov 2026 05:40:07 GMT` → file updated 05:40:07Z, 316 s old at the probe |
| Date header | `Sat, 14 Nov 2026 05:45:21 GMT` |
| ETag | `"31ff5-66035fa2e36f0"` |
| Timestamp passes the rule | yes |
| Stored / published | no / no |
| User-Agent set | `mother-earth-collector/0.6.13 (+https://github.com/TheOneTheOnlyTheChad/mother-earth; contact: issues at that address)`; receipt by SDO not verified |

SDO's Date header (05:45:21) and the hub's clock at the end of the probe (05:45:22.6) agree to about a second, so the zero-tolerance rule has little room to misfire on clock difference; one sample only.

## 4. Not verified

Production CPU and memory of a full run (the probe does not store); that SDO sees the User-Agent; behaviour over a day (how often the picture changes, any gaps); storage growth.

## 5. Next lines (Chad)

1. GPT's review of `1a4888c` (recommended before the hub stores anything).
2. `Approve: run /admin/run/sunface once`
3. `Approve: set SUNFACE_ENABLED=1`

## 6. Rounds 3 and 4, and the 0.6.14 deploy (added 14 Nov 06:37 UTC)

- GPT found two more replay paths after this record was written: a failed marker write (`1a4888c`), then a marker landing between lookup and
  write (`0365ea4`). Fixed in `6bb0228` and `90c7cc5`; packets `reviews/2026-11-14-sunface-rc-r3.md` and `-r4.md`. GPT passed round 4 at `0672d0a`
  (Worker hash `bbf8dc61…0480`; 171 of 171; 28 breaks).
- A first deploy attempt at about 06:32 UTC was refused by the session's safety check: the Approve lines in that message were inside GPT's relayed
  text. Nothing was changed. Chad then sent the line himself.
- **Deploy** (Chad: "Approve: deploy hub 0.6.14 from sunface-rc (content only, SUNFACE_ENABLED unset)"):
  before, live `5859fb70…f9ae` 361,884 B (0.6.13), 21 bindings, no `SUNFACE_ENABLED` (06:35:55 UTC); candidate from GitHub at `90c7cc5`,
  `bbf8dc61447a690b329733e1b13c5b9c632dd0c91b7c580be0169712702d0480`, 364,554 B; content-only PUT 06:36:07–06:36:10 UTC, HTTP 200,
  `modified_on` **2026-11-14T06:36:10.456Z**; read back exact; 21 bindings, gate still absent.
- After (06:36:31 UTC): `/` reports `0.6.14`; health 8 of 8 answer 200; `/status`, `/snapshot/usgs`, `/snapshot/dustrgb/meta` 200; skycraft pointer
  unchanged; `/snapshot/sunface/meta` 200 with `image: null`, `last_attempt: null`; the probe without a key answers 403. No probe was run on 0.6.14.
- **Rollback (own Approve line):** 0.6.12 `c1addd19…0106` (= main), or 0.6.13 `5859fb70…f9ae` (`1a4888c`).
- Next lines: `Approve: run /admin/run/sunface once`, then `Approve: set SUNFACE_ENABLED=1`.

## 7. Manual run on 0.6.14 (Chad: "Approve: run /admin/run/sunface once")

`/admin/run/sunface`, 06:38:13.9–06:38:20.4 UTC: HTTP 200, `sunface:ran`, wall 6,312 ms. One upstream request.

- **D1 row 9932:** started 06:38:14.101Z, finished 06:38:20.238Z, `ok`, HTTP 200, 1 record, 203,365 bytes. Note: "image 20261114T063005Z-66f213bcb914748e; file updated 2026-11-14T06:30:05Z; observation time not known".
- **Pointer** (`/snapshot/sunface/meta`, 06:38:20.952Z): image `20261114T063005Z-66f213bcb914748e`, 203,365 B, 1024 × 1024, sha256 `66f213bc…7b32`;
  `observed_at` **null**; `file_updated` 06:30:05Z (header `Sat, 14 Nov 2026 06:30:05 GMT`); `retrieved_at` 06:38:16.927Z; `previous` null; `last_attempt` null;
  `age_limit_s` 10800; credit present. The file was 8 min 12 s old when retrieved.
- **File route:** 200, `image/jpeg`, 203,365 B, sha256 equal to the pointer, immutable cache, ETag = sha256, CORS `*`, starts `ffd8`.
- **Storage** (dashboard API): exactly three objects under `sunface/`, written in the required order:
  marker `sunface/seen/66f213bc…7b32.json` 06:38:17.825Z (197 B; holds the id and file-updated 06:30:05Z) → image `…/sun.jpg` 06:38:18.861Z → pointer `sunface/current.json` 06:38:20.125Z.
- **Worker CPU** (per-minute maximum, 06:38 minute, 16 requests, 0 errors): **10.1 ms**; maximum wall 6,316 ms (this run).
- **Viewed 06:42 UTC (Claude, browser pane, from the hub's file route):** the Sun's full disc in orange with several small sunspot groups, on black; the disc nearly fills the 1024 px frame. Printed in the bottom-left corner of the image: "SDO/HMI Quick-Look Continuum: 20261114_060000" — a time 30 min 5 s before the file-updated time. What that printed time denotes is not verified; `observed_at` stays null. The caption sits outside the disc, where the page's mask will hide it.
- Not verified: SDO's receipt of the User-Agent.

Next line: `Approve: set SUNFACE_ENABLED=1` (Chad clicks the final deploy button). The scheduled job would then run every hour with the hourly trigger.
