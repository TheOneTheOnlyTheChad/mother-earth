# Animals journey context, C1a (zebra): page release and live check, with a live-smoke request to GPT

**Written:** 25 Nov 2026, 06:58 UTC (clock reading).

**Page release:** merge `64e9cf599b1138fa3b838c027ff460275c56b332`.
- Parents: `9a06ba33`, which was main at the time and is preserved, and `16133f23`, the reviewed branch head.
- Commit time 06:54:07 UTC, pushed by 06:54:19.
- Done on Chad's own line:
  > "Approve: merge animals-journey-context-proposal at `16133f23ed07ebb2f89ac3e9d5ffedc2dc7788f4` into main for the C1a zebra historical regional land-context page release, preserving current main, with served-hash verification and the scoped live check. No hub change; corridor remains parked."

**Review:** GPT's release recheck passed. It is filed unchanged at `reviews/2026-11-25-animals-journey-context-c1a-gpt-release-recheck.md`, sha256 `c8dd2124275ad03431d4fdef5789cf96b6027ceb3729c57d9020df193cb1cdd4`.

**Merge checks:**
- Main had moved only in `STATUS.md` since the packet's base. The merge was clean.
- The merged tree equals the reviewed head `16133f23` file for file.
- `STATUS.md` equals main's.
- `phase1/worker.js` is unchanged. There was no hub change.

## Served hashes on github.io

Checked at 06:56:07 UTC, fetched without cache from `theonetheonlythechad.github.io/mother-earth/`. All match the reviewed identities:

| File | Bytes | sha256 |
|---|---|---|
| `animals.html` | 23,220 | `4e75d051…c0ed` |
| `animals-context.js` | 17,198 | `a12594c1…55cc` |
| `style.css` | 87,864 | `3f8515c2…1c4d` |
| `assets/animals/zebra-botswana-Z3866-context-R1.json` | 7,879 | `6b67818b…a21e` |
| `sources.html` | 91,893 | `99931b2a…5128` |
| `REGISTER.md` | 152,231 | `929eef63…b7bc` (as merged) |

**Notes on the check:**
- At 06:54:38, 19 s after the push, Pages still served the old files, and the two new files answered 404. The two 404 lines in the pane's console come from that early check.
- `REGISTER.md`'s two new entries have their "Filed" lines and headings completed with the merge identity in the commit that carries this record. From then on the served REGISTER differs from `929eef63` by those four lines only.
- A plain reload at about 06:56 still showed the old page from the browser's own cache: the navigation had a transfer size of 0, and `style.css?v=202612240100` was still linked. That is ordinary Pages caching, up to about 10 minutes. A reload with a query string got the new page.

## Scoped live check

Done in the Claude browser pane (desktop, Chromium) at 06:57 UTC on `animals.html?live=c1a`.

- **Before scrolling:** the block was about 8,950 px below the top of the window, which is 833 px tall. Its state line read "The regional context file is checked when this part of the card is on screen." The context file had been requested 0 times.
- **After scrolling it into view**, the file was requested once and the block showed:
  - "Context file verified against its checksum."
  - 21,744 detections.
  - "No dates are listed in the provider's missing-data table for this period."
  - "about 245.0 ha", with the calendar-year wording in the same sentence.
  - "By month" closed, with 13 rows and a total of 21,744.
  - "How these figures were made" closed.
  - The closing sentence exactly as reviewed.
  - The LANCE acknowledgement present.
- **The rest of the card was unaffected.** The zebra study facts were still verified, and no switch was turned on.
- **Sources page:** the new paragraph sits directly after "Plains zebra, collar Z3866…". Its links are NASA FIRMS, the Hansen GFC v1.13 download page and CC BY 4.0.
- **Errors:** no failed request during this page load.

**Not checked:** a real phone, Safari, a screen reader, print, true 200 % zoom, and an independent live smoke.

## Live-smoke request to GPT

On the live site, please check:

1. **Served hashes.** The six files in the table above match, except `REGISTER.md`, which is expected to differ by the four completed lines.
2. **Initial state.** `animals.html` loads with the zebra block in its not-yet-checked state. The context file is not requested until the block comes within 200 px of the window.
3. **Verified block.** After scrolling, it shows "verified", 21,744 detections, about 245.0 ha with the calendar-year wording beside it, both disclosures closed, 13 month rows plus a total, the closing sentence and the credits.
4. **Narrow window.** At about 390 px there is no sideways overflow, and the disclosures open from the keyboard.
5. **Nothing else changed.** No globe or journey switch is turned on, and the other cards and the Sources page are otherwise unchanged.

If it passes, Claude closes out:
- delete the merged branch;
- move the review copies to `_to_delete`;
- record the device limits;
- record C1b (corridor) as parked, with its proposal kept;
- write the handover for the thread that waits for replies.
