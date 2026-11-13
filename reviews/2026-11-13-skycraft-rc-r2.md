# skycraft-rc — round 2 (GPT's review of `b4f3984` applied)

Chad relayed GPT's review on 13 Nov 2026: hold `skycraft-rc` at `b4f3984` for a revision before any §7 production step. **Branch only. Nothing merged, deployed, uploaded, registered or scheduled.** Live unchanged: hub 0.6.11 `119cc641…801f`, page `bdf894f`.

Round 1 packet: `reviews/2026-11-13-skycraft-rc.md` (its §1, §2, §4, §6, §7 still stand except where this file says otherwise).

## 1. GPT's findings and what changed

| | Finding (GPT) | Change |
|---|---|---|
| **P1** | An expired run can release its successor's lock: after run B takes over an expired lock, run A's unconditional cleanup deleted it, and run C could start while B's request was in flight. | **Nothing is deleted any more.** `craftLock` returns the etag it wrote; `craftUnlock` marks the lock released with a compare-and-swap on that etag, so a run that no longer holds the lock changes nothing. A released or ten-minute-old lock is taken over by compare-and-swap. Also new: before its second request a run checks it **still holds** the lock (`craftHolds`), and makes no further Horizons request if it does not. |
| **P1** | A Parker-only failure cancels the LRO study capture (simulated HTTP 422 exited after one call). | The two outcomes are independent. `craftParker` returns its result; the LRO capture then runs **unless** Parker's failure points at an upstream outage or rate limit: no answer (network error or timeout), HTTP 429, or HTTP 5xx. Parker 4xx other than 429, an unreadable or invalid answer, a validation failure, and a storage or publication failure all still let the LRO capture run. One request at a time is unchanged. |
| **P2** | Leaving between the Moon and Sun stops can return to a stop that hides the link used (the Sun link shows once progress passes 1, but progress under 1.5 rounded back to the Moon stop). | The return stop is now one where the originating link is shown: the Sun link always returns to the Sun stop; the Moon link returns to the Moon stop, or the Sun stop if the view had already reached it. |
| Carry | With the archived Parker sheet, samples from 20 Jan to 17 Feb 2027 fall in two listed segments and are withheld. | Recorded as a **coverage gap** (see §3). Behaviour kept. The snapshot and pointer now carry `withheld_samples`, and the run note states "k of n samples withheld". |
| Carry | Provenance was accepted without the response's source tag. | `hzParse` now refuses an answer that lacks **either** the target's `{source: …}` tag **or** the data sheet's `Revised:` date ("no source tag or data sheet revision in response"), for Parker and for the LRO capture. |
| Carry | The probe's `user_agent_sent` reports what the code sets, not what the upstream received. | Field renamed `user_agent_set`, with `user_agent_receipt: "not verified: this is the header the hub set on its request; the upstream does not echo it"`. A successful probe establishes reachability only. |

## 2. Tests

- `skycraft-hub`: **156 passed** (was 127). New: the takeover regression (run A's lock expires, B takes over, A finishes — B's lock stays, A makes no further request, C is refused while B is in flight, B then completes and releases its own lock); HTTP 422 / unreadable answer / missing source tag / publication failure each still capture LRO; HTTP 503 / 429 / network error each back off with no LRO request; archived answer refused without its source tag and without its revision line; the archived sheet's overlap withholds samples; nothing is ever deleted. **27 breaks, each fails** (new: `release-unowned parker-cancels-study no-backoff no-tag-check study-after-lock-loss`).
- `skycraft-ui`: **77 passed** (was 75). New: from between the Moon and Sun stops (progress 1.1–1.45, nearer stop still the Moon, Sun link shown) → Sun page → browser Back → reopened at the Sun stop with the Sun link shown and focused. **19 breaks, each fails** (new: `round-stop`).
- Full regression: 61 test files; 4 manual/network tools skipped; **57 run sequentially, 57 passed** (13 Nov 08:31:13–09:00:19 UTC), including `sky-zoom-ui` 333/333 on the changed `skyscene.js`.

## 3. Coverage gap to carry (Parker, 20 Jan – 17 Feb 2027)

The Horizons data sheet archived on 13 Nov 2026 lists `spp_pred_20260930_20270217_od268_v001` to 2027-Feb-17 00:00 and `spp_nom_20180812_20300101_v044_PostV7` from 2027-Jan-20 00:00. For times in both, the sheet does not say which one Horizons evaluates. The hub therefore names no segment for those samples and the page shows no position there. If the same sheet is still in use on 19 January 2027, the Sun page will have no "today" position from 20 January until the sheet changes or a precedence rule is established from JPL's documentation. Not a defect; an open item with a date.

## 4. Unchanged, and accepted by GPT

One-minute LRO kernel states; the ten-minute Parker example; two serialized combined responses per run; the SPDF longitude difference documented with its cause open (a cross-product check); current LRO marker and path withheld. GPT independently reran 127 skycraft-hub, 7 sky-scene-hub and 174 dustrgb-hub checks and reproduced both dated catalogues byte for byte. GPT could not run the page suite (no Playwright on that Mac): the UI results are Claude's.

## 5. Still not shown

Worker reachability of Horizons; **upstream receipt of the User-Agent**; Worker CPU and wall time; the pages against the real hub; a real phone, Safari, a screen reader; any LRO prediction-error figure.

## 6. Release order (unchanged; each on Chad's own line; registration steps and the one-call probe stay separate from the full manual run)

1. GPT reviews this revision.
2. `Approve: upload the two skycraft example files to R2 ref/skycraft/ (craft-moon-2026-06-R1, craft-sun-2024-12-R1)`
3. `Approve: deploy hub 0.6.12 from <commit> (content only, SKYCRAFT_ENABLED unset) and run /admin/probe/skycraft once`
4. `Approve: run /admin/run/skycraft once`
5. REGISTER lines.
6. `Approve: set SKYCRAFT_ENABLED=1`
7. Live candidate check; Chad's look.
8. `Approve: push skycraft-rc to main (page change: Moon and Sun spacecraft pages, Sky Explore links, Sources section)`
