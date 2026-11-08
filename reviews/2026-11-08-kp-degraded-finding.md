# Kp "degraded" is a false signal — finding (8 Nov 2026, read-only)

**Status: finding only. No hub, page or production change.** Any fix needs its own review (GPT) and Chad's specific approval.

## What was seen
The swpc (Kp) layer flips between `ok` and `degraded` around the clock, and the public page shows "degraded" on the Kp card. GPT's 8 Nov smoke test recorded this as "Kp degradation explicitly disclosed".

## Measured (Cloudflare D1, read-only, 8 Nov ~06:00 UTC)
- **Publication lag.** `kp_index` holds the first retrieval of each 3-hourly value. Of 33 values from 4 Nov 00:00 to 8 Nov 00:00 UTC:
  - 31 were first seen **3.13 h** after their `time_tag`, at the first hourly run (:07) after the 3-hour interval ended;
  - 2 were first seen **4.13 h** after it (the 21:00 intervals of 6 and 7 Nov, both first seen after midnight).
- **Run status.** Of 102 swpc runs since 4 Nov:
  - **70 (69%) were `degraded`**, with source ages of 14,879–22,079 s (4.1–6.1 h);
  - 32 were `ok`, all at age ~11,280 s (3.1 h).
  - Every degraded run happened while the source was delivering on schedule.

## Cause
1. **The threshold ignores what `time_tag` means.** The rule in `collectSwpc` is `ageS < 4 h → ok, else degraded` ("Kp is 3-hourly; > 4 h is late"). In practice `time_tag` behaves as the *start* of the 3-hour interval, as the lag above shows. So an on-time value is already ~3.1 h old when it first appears, and normally ages to ~6.1 h before the next one. The 4 h line therefore marks two of every three hourly runs "degraded" by design.
2. **The page misattributes it.** A `degraded` snapshot is graded `partial` with the reason *"the source flagged this observation as degraded"* (`app.js` ~314). The readings summary adds "source degraded" (`app.js` ~375). NOAA SWPC flags nothing in this feed: the flag comes from our hub's age rule. Under the constitution ("honesty over polish"), the page is stating something that is not true about the source.

## What it does not affect
- The Kp **values** shown are correct and correctly dated ("Kp 5 observed 00:00 UTC").
- No UptimeRobot monitor watches swpc (they cover usgs and firms only), so no false alerts were sent.
- History (`kp_index`) is unaffected.

## Options for a fix (not done; each needs review + Chad's approval)
- **Hub threshold:** call Kp late only when the *next* value is overdue. Measured on-time values reach at most ~7.1 h before the next one appears (one-hour slips included). An "older than 7.5 h → degraded" line would have flagged **0 of the 102** runs, and would still catch a genuinely missed value within ~1.5 h.
  - An equivalent framing is to measure age from the interval's end (`time_tag + 3 h`) with a 4.5 h line.
  - This is a hub change: code, review, deploy with an Approve line.
- **Page wording:** where the hub, not the source, sets `degraded`, say so, e.g. "late by our freshness rule (older than N h)" rather than "the source flagged…".
  - **Scope question for review:** the same reason text applies to *every* layer the hub marks `degraded` (e.g. ships' overlong samples), so the wording fix may be wider than Kp. Check each layer's degraded rule before rewording.
- The two fixes are independent. The threshold alone removes the false signal for Kp; the wording fix is needed for honesty wherever the hub sets the flag.
