# sunglobe-rc — round 2 (after GPT's review of `9347996`)

2026-11-14 · branch `sunglobe-rc` · code `ac04092`, tests and docs after it (+ this packet) · **page not released**

GPT's rulings on the four questions: keep the 0.97 mask; keep stripes, readout and caption for the plain side; keep the hub as the time
reference **but fix expiry**; keep "◀ East / West ▶". One fix held the push.

## 1. Expiry (the hold)

GPT reproduced two cases: the picture outlived the cutoff until the next 15-second poll, and setting the device clock back after
synchronising lengthened its life while the hub was silent. The earlier boundary test called `tick()` by hand and missed both.

Fix in `sunglobe.js`:

- **Clock.** At every successful pointer read the page records the hub's time together with the monotonic timer (`performance.now()`) and the
  wall clock. "Now" is the hub's time plus **elapsed** time: the larger of the two advances, never negative.
  - Wall clock set back → the monotonic advance carries on: no extension.
  - Sleep, where the monotonic timer may stand still → the wall clock's advance is used.
  - Wall clock set forward → the picture can only expire sooner. The next successful read re-anchors to the hub.
- **Deadline.** Whenever a picture is on screen a timer is set for the instant its age reaches the limit. It is re-set on every check.
  The 15-second poll and the resume checks (`visibilitychange`, `pageshow`, `focus`) stay.

New tests (no manual `tick()` at the cutoff):
- **Cutoff between polls:** a poll runs, the deadline lies some seconds later and not on a 15 s boundary; the clock is jumped to 1 ms
  before the deadline → picture still up, words unchanged, and the rendered globe (read before the jump) shows the picture; then 2 ms on,
  well short of the next poll → "No recent picture" with the words; the clock is released and the **rendered globe is plain**.
- **Clock set back** two hours after synchronising, hub silent: the words still give the true age; still up 5 ms before the real
  deadline; gone at it.
- The poll's own jobs: the age in the words advances by itself; the pointer is re-read after ten minutes and a newer picture taken up.

Breaks: `no-deadline` (3 failures), `clock-back` (2), `sleep-blind` — monotonic only (1), `no-offset` (3), `no-timer` (2), `no-resume` (1), `age-late` (7), `future-ok` (5).
`no-timer` first **passed** after this fix (the deadline timer had taken over its only tested job), so the two poll checks above were added; it now fails.

## 2. REGISTER draft (rev 2; still not filed)

- Summary-only caveat replaced by the direct links and read dates (GPT 14 Nov; I also read both SDO pages directly in the browser pane, 09:54–09:55 UTC 14 Nov). Operative sentences quoted.
- SDO's Rules of the Road recorded: browse products are not for science analysis or publication without the PI's consent; value-added data products must be labelled as different and the PI notified.
- Our use described as a credited public display with reprojection and masking, labelled as such; not science analysis, not offered as a data product. **The PI has not been notified**; whether that rule reaches a display like this is our reading that it does not. A note to SDO, if wanted, is Chad's to send.
- North-up: "within about 1° of latitude and 4.5° of longitude"; the roll-under-1° claim is withdrawn; recorded as a one-frame check, the evidence used for release; no north-up guarantee found on the SDO pages read.
- **Retention deviation, for Chad's decision:** the proposal said only the current and previous pictures are kept. As built, only those two are **served**, but older picture files (about 200 KB an hour) and one small marker per picture stay in storage; no cleanup exists. The draft carries the sentence "accepted by Chad for this release / to be corrected" for him to settle.

The first packet (`reviews/2026-11-14-sunglobe-rc.md`) is corrected for the same two north-up points.

## 3. Results

- `sun-globe`: **103 of 103** on the final code.
- Breaks: the eight time-related ones above were rerun on the new code and fail. The other nine (`mirror`, `no-b0`, `flip`, `no-mask`, `no-limb`, `step-back`, `bad-displaces`, `limit-raised`, `observed`) were last run at `e363b6b`; their code is untouched by this change. Seventeen breaks in all.
- `skycraft-ui` (same page) 77 of 77. **The full regression was not rerun** for this change, which touches `sunglobe.js` and its test only; the last full run was at `e363b6b` (60 of 60).

## 4. Not checked / open (unchanged unless noted)

Real phone, Safari, screen reader, phone performance. One-frame north-up check only. If the hub can never be reached there is no picture at all, so no clock question arises. Hub storage growth (see the retention decision).

## Order from here (Chad's lines)

1. GPT's check of this round.
2. Chad's word on the retention deviation (accept for this release, or have cleanup built first — that would be a hub change with its own review and deploy line).
3. `Approve: file the REGISTER entry for the NASA SDO HMI continuum latest image`
4. `Approve: push sunglobe-rc to main (page change: Sun globe on the Sun page; hub 0.6.14 source reaches main)`
