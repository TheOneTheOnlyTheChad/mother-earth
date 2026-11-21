# Hub scheduled-job timing, read 04:44 UTC 21 Nov 2026

Read-only, Cloudflare Workers Logs query in Chad's signed-in dashboard pane, Worker `mother-earth`, scheduled invocation
records from 2026-11-20T04:00Z to 2026-11-21T04:00Z. 457 records (19 or 20 an hour), every outcome `ok`. Nothing changed.
Hub settings read 04:29 UTC: Workers Logs on, invocation logs on, sampling 1, query strings not redacted, compatibility date 2026-10-30.

| Cron | Scheduled second | Runs | Wall ms p50 / p95 / max | CPU ms p50 / p95 / max |
|---|---|---|---|---|
| `*/5 * * * *` | :08 | 289 | 2237 / 5491 / 9007 | 9 / 16 / 22 |
| `*/15 * * * *` | :40 | 96 | 8526 / 98972 / 134920 | 217 / 600 / 762 |
| `11,41 * * * *` | :38 | 48 | 53491 / 65776 / 77608 | 23 / 208 / 228 |
| `7 * * * *` | :59 | 24 | 24786 / 53320 / 65258 | 84 / 1042 / 1072 |

Hourly run, UTC time: CPU ms, wall ms.
00:07 67, 23436 · 01:07 68, 22682 · 02:07 65, 23514 · 03:07 174, 24786 · 04:07 718, 21881 · 05:07 72, 22424 · 06:07 123, 30286 ·
07:07 66, 17656 · 08:07 62, 13241 · 09:07 84, 53320 · 10:07 1072, 21471 · 11:07 69, 27256 · 12:07 121, 27324 · 13:07 81, 23894 ·
14:07 69, 15425 · 15:07 84, 26556 · 16:07 717, 65258 · 17:07 66, 19923 · 18:07 104, 39466 · 19:07 108, 29987 · 20:07 75, 25375 ·
21:07 104, 28466 · 22:07 1042, 20687 · 23:07 57, 46085

"Scheduled second" is the seconds part of Cloudflare's scheduled time for that cron on this account. Percentiles are of this one day.
