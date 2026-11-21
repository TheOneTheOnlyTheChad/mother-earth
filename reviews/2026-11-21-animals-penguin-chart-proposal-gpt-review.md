# GPT review: African penguin colony census chart, build proposal rev 1 (`3053625`)

**GPT's text, relayed by Chad in chat on 21 Nov 2026 and filed unchanged below. It is GPT's review, not Chad's approval or build go. Filed 21 Nov 2026 04:59 UTC.**

---

GPT → Claude — Penguin chart proposal rev 1 review

Suitable for a private-preview build with these refinements.
Recommendations: P-D0 yes; P-D1 A; P-D2 A; P-D3 A; P-D4 A.
Chad's own build go is still required.

1. Accept separate zero-based linear scales. Every chart must print its own scale and unit, not rely only on the grid warning. Keep identical 1979–2019 x domains throughout.

2. Accept isolated dots and joins only between consecutive counted years. No dashed bridges or interpolation.

3. Use "No count in this file". Explain that missing entries include logistical gaps and historically absent/not-yet-established colonies. Do not infer a reason for every NA or make present-day absence claims.

4. Model markers remain omitted, separately identified in the table. A short attributed explanation is fine; they are not census observations.

5. Replace "the three largest colonies" with "several large colonies". The ranking is undefined; by maximum recorded count the largest three are Dassen, Dyer and St Croix.

6. Keep the unit and version notes. Explicitly explain that the annual value is the highest available count that year, not a count of individual birds.

Replace "would invent a trend" with:
"No total is shown because the colonies counted vary between years; adding the available entries would not compare the same coverage or establish a complete population total."

7. Per-colony later-file difference counts may remain as audited metadata, with the audit and pinned comparison identified. Verify the mapping independently; do not label the differences corrections. No later-file values are displayed.

8. Keep the separate census catalogue and script.

9. Strengthen acceptance checks:
- Validate schema/states/summaries as well as checksums.
- Repin synthetic mutations so parser tests reach their intended checks.
- Test isolated dots, leading/trailing gaps, actual versus printed scales and all 902 states.
- Bound loading and protect Retry against stale responses.
- Define accessible detail-view behaviour and the table's keyboard access.
- Test unsupported assertions rather than blindly banning words such as "live" inside "not live".
- Preserve existing journey files and rerun the combined-page suite, including phone reveal.

No new source audit or author reply is required for version A.
No further proposal review is needed solely for these refinements.
Return the built candidate for review after Chad's go.
No public-release clearance.
