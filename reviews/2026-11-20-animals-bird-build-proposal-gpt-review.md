# GPT review: bird build proposal rev 1 (as relayed by Chad, 20 Nov 2026)

Filed as received. GPT's text, not Claude's. Outcome: REVIEW HOLD. Chad's own summary to Claude: hold before building; the 5 ms timestamp rule fails on two source rows (19 ms and 21 ms); colony omissions need replay handling (withheld periods, marker hiding, line breaks); after colony filtering 10 displayed joins span failed fixes, not 12; GPT's recommendations remain gap option A, colony omission, accuracy shown, separate private branch.

---

Mother Earth — bird build proposal rev 1: GPT review

20 November 2026 · animals-expansion-proposal · 5a34790f3bc2d4289b3bfe1aa946cbcfa1458e2e

REVIEW HOLD on the proposal as written. The bird/source choice remains sound. Resolve the timestamp rule and the omission/replay contract before asking Chad for branch implementation. These are concrete design corrections, not a new source audit. Nothing built, changed on the implementation branch, deployed or sent.

Evidence

Read the full proposal; SHA-256 matches 4080c9bc4a9894c68b54694699d922da37ca0d06985fbad0ac79fa74e8f2de0c. Independently inspected the relocated tracking CSV and verified its pinned hash. Used the source rows to check timestamps, gap counts and the proposed exclusion. Inspected the available parked preview copy at _review/animals-journeys-preview-ea5414d-full, including build_journey.py, animals-journey.js and animals.js. This is inspection of that copy, not a claim that its entire tree was independently proved identical to f00a330.

1. Timestamp rule: the proposed 5 ms limit fails on the pinned file

Two positioned source rows for this bird exceed it:

Event ID

Timestamp as recorded

Distance to nearest whole second

28208092

2008-07-19 01:30:13.979

21 ms

28279234

2008-08-25 19:30:26.019

19 ms

The other positioned rows are 0, 1 or 2 ms from a second. Both exceptions are colony-side under the proposed exclusion, but the proposal still promises validation of the source and offers an all-fixes option. Do not hide a source-validation failure by filtering it first.

Recommendation: nearest-second rounding is proportionate for this replay; carrying milliseconds is not necessary. Define an explicit per-study allowance of 25 ms, measured maximum 21 ms, deterministic integer-millisecond arithmetic and collision/order checks. This is a deliberate display conversion, not proof the fractional values are an export error. Apply it before omission; keep older studies' defaults unchanged.

If preserving milliseconds is chosen instead, specify the schema/reader migration. The inspected reader requires integer seconds. The README's UTC/GPS caveat does not justify or correct rounding; those are separate issues.

Remeasure the actual chosen output after the final rule. The proposal already labels truncation-based sizes as preliminary, which is appropriate.

2. D1: joining across one failed attempt is defensible with accurate disclosure

Option A is acceptable for an illustrative connector between recorded fixes, if the page explicitly says the path between them was not observed and the marker remains on a recorded fix. Name the actual threshold: 3 hours 15 minutes, with tolerance beyond two nominal 90-minute intervals. Do not describe 11,700 seconds as exactly two intervals.

I confirmed 13 gaps above 95 minutes and one above 11,700 seconds before colony omission. The longer rule does not validate a flight route or supply a missing fix.

Count the actual displayed joins after all filtering. With the proposed first-fix-centred 5 km exclusion I find 10, not 12, displayed joins spanning a no-position row. Twelve is the unfiltered count. Retain both source and display counts where useful; do not hard-code 12 in the card.

An intentional omission must always break a connector, independently of the elapsed-time threshold. Option B remains valid if Chad prefers no connectors across failed attempts, but it too needs that separate omission rule.

3. D2: omission is sensible, but the anchor and replay semantics need fixing

The first positioned fix is at -1.3895007, -89.6209246. It lies about 117 m from the reference file's rounded tagging-site point (-1.39, -89.62). Both centres give 345 omitted / 981 retained fixes for this pinned bird under my spherical-distance check.

A 5 km radius is a reasonable project display choice, not a scientifically established protection distance inherited from the grey-headed study.

Preferred anchor: use the explicitly named reference tagging-site point, with a specified distance calculation and boundary rule. If retaining the first-fix anchor, call it exactly that; it is a proxy, not the precise nest position. Avoid “At the colony” as a factual location statement for everything in that disk. Use wording such as “Colony-area fixes withheld within 5 km of the tagging-site reference point.”

The current t/lat/lon-only output cannot fulfil the promised time-specific omission message by deletion alone. The inspected renderer holds the last displayed marker, clamps playback to displayed endpoints and, for ordinary GPS manifests, says “No fix was recorded” across long gaps. Those behaviours would misdescribe this filtered record.

The proposal must explicitly provide:

omission-event timestamps or another validated, coordinate-free representation of the withheld portions;

no connector across any withheld source fix, even in a short synthetic case below D1's time threshold;

marker/accuracy behaviour during withholding: hide the position and current accuracy, or explicitly identify any retained old marker as a previous displayed fix, never the withheld location;

separate wording for a failed attempt, a long observation gap and an intentionally withheld fix;

the complete source recording period versus the first/last displayed fix.

The first retained fix is 29 June 2008 01:30:53.999, whereas recording began on 23 June. Decide whether replay includes that initial withheld period; the label and controls must agree. Between recorded events do not assert that the animal remained inside the radius.

For this pinned data, every omission-separated retained pair happens to exceed D1-A's threshold. That coincidence does not establish correct withholding behaviour. The inspected reader's existing join-flag path is coupled to Argos class validation; do not simply add a GPS join array and assume it works unchanged.

“Source not altered” should mean the archived source remains intact. The display is explicitly filtered and timestamps are rounded. Remove “private preview B is harmless”: private scope alone does not establish harmlessness.

4. D3 and D4

D3 yes: carry the tag's accuracy estimate with each retained fix. Require n entries, finite nonnegative values, source-row correspondence and reader rejection of malformed arrays. Show it only for an actual displayed fix, with its time/age. Do not confuse tag accuracy with marker size, line uncertainty or measurement of error.

Statistics must identify their population: all 1,326 positioned source fixes or the 981 retained fixes. Recompute any “each displayed fix” summary after filtering.

D4 yes: own implementation branch from the parked preview with current main merged, followed by candidate review. Chad has authorised only the proposal so far. Preserve existing data/manifests byte for byte and identify unavoidable catalogue/pin/UI changes.

5. B1–B12: good start, add the missing checks

Add acceptance criteria for:

Both pinned input files, including the selected reference/deployment identity.

Valid status/fix-type/coordinate combinations: D/0 requires both coordinates absent; A/3 requires both valid; reject partial coordinates and unexpected combinations. Validate before spatial filtering.

Timestamp maximum, rounding boundary, collision and chronology failures, including the two real >5 ms cases.

Omission boundary, no reintroduced coordinates in any browser-served asset, short-gap omission joins, marker/accuracy hiding and initial/trailing withheld periods.

Separate counts for source rows, failed attempts, retained/withheld fixes and post-filter joined steps.

The optional accuracy contract in both builder and reader, plus legacy files without it.

Air chooser behaviour and new-card presentation, network/integrity failure, switching/late loads, and old journey regression on the actual merged tree.

Keep the source archive unserved. Adding _source-data/ to .gitignore helps prevent accidental additions; it does not make committing impossible (forced adds and tracked files are exceptions). Replace the absolute “never committed from any clone” claim with that practical guard plus a tracked-file check.

6. Wording and next step

The breeding-adult/date label and attributed paper context remain supported. Replace the distance-count inference “about a quarter ... at or beside the nest site” with “345 fixes within the proposed 5 km exclusion radius”; proximity does not identify a nest.

Where the outlier column is absent, say no manual-outlier field was supplied, rather than implying the source affirmatively checked and flagged zero outliers.

Revise these two substantive design areas, recalculate affected counts and present rev 2 for a focused review. No need for more provider emails or a new general research round. My provisional choices are D1 A, D2 omission with the explicit contract above, D3 yes, D4 yes. They are recommendations for Chad, not his approval.

Penguins, IWC and Cape Vidal enquiries remain SENT; no reply reported. NOAA/ATAP unchanged. Implementation parked; Earth from Space probe untouched.

