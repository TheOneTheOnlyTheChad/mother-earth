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
