# GPT focused review: bird build proposal rev 2 (as relayed by Chad, 20 Nov 2026)

Filed as received. GPT's text, not Claude's. Outcome: PASS at proposal level; both rev 1 holds closed. Not Chad's implementation go, not candidate acceptance, not production clearance. Chad's own summary to Claude: timestamp rule accepted; withholding and initial replay state accepted; rounded reference centre in the manifest fine; keep the 11 failed-attempt timestamps, withholding takes precedence; B1 to B17 sufficient with the implementation clarifications recorded; GPT recommends D1 A, D2 A, D3 yes, D4 yes.

---

Mother Earth — bird build proposal rev 2: focused GPT review

20 November 2026 · animals-expansion-proposal · 206ecf061c349a2c2334d6c02775d3e37e2643f0

PASS at proposal level. Both rev 1 hold points are closed. Ready for Chad's decision on D1 A, D2 A, D3 yes and D4 yes, followed by a branch-only private-preview build if he gives his go. This is not implementation approval from Chad, candidate acceptance or production clearance.

Evidence checked

Read the complete rev 2 proposal and verified SHA-256 0412d89e3d652e3beb0f3150bdb5fbc72bd57ee3dd8dab4e4d6a6134c90091af. Independently reread the relocated pinned tracking and reference CSVs; both hashes match the proposal.

Recomputed from the bird's rows:

Timestamp distances: 372 at 0 ms, 641 at 1 ms, 323 at 2 ms, one at 19 ms and one at 21 ms.

Integer nearest-second conversion preserves strictly increasing order across all 1,338 rows.

Reference-point-centred haversine filter: 981 retained and 345 withheld, in 14 periods.

Initial period: 86 withheld fixes, starting at the first source row.

980 retained pairs: 966 joined, 13 broken by withholding and one broken by time alone.

10 displayed joins span failed attempts; one failed attempt is within a first-to-last withheld tuple, and one lies after a tuple's last withheld fix but before its next retained fix.

The stated longest withheld period is approximately 144.016 hours; “144 hours” is a rounded description. No build or UI verification was performed; those remain candidate checks.

1. Timestamp point: closed

The integer nearest-second rule, 25 ms study-specific allowance, all-row validation before omission, collision/order stops and unchanged legacy defaults answer the hold.

Define ms as the complete timestamp in integer epoch milliseconds. The allowance remains a declared display conversion, not a claim about source error. GPS-time uncertainty stays separate.

One test clarification: a .500 timestamp is outside the 25 ms allowance and must fail the integrated builder. A rounding-helper unit test may separately show half-up behaviour. Include 25 ms pass / 26 ms stop and a .999 carry into the next second. This is an implementation-test clarification, not a new proposal hold.

2. Withholding/replay point: closed

The coordinate-free period representation, separate failed-attempt events, independent join flags, whole-recording replay and explicit hidden-marker state provide the missing contract.

The initial period should open with no marker or accuracy. For any period use a half-open hidden span: first withheld time inclusive, next retained time exclusive. At that next retained event the marker and its accuracy may reappear. For a trailing period, remain hidden through recording_end inclusive, with the controls still reaching that endpoint.

Previously drawn historical track segments may remain visible. “No line into or out of the period” means no connector bridging it; it need not erase the earlier history.

Avoid interpreting absence of an attempt row as proof the tag physically made no attempt. The proposed “no ... attempt is in the source” wording correctly limits that claim to the record.

3. Centre in the manifest: acceptable

It may state the reference file's two-decimal point (-1.39, -89.62), its provenance, radius, distance formula and boundary rule. That is the deliberately coarse source reference point, not a withheld GPS fix or an exact nest position.

A named-only centre is also possible, but is unnecessary for this proposed design. Keep exact withheld fixes and the first-fix-derived precise centre out of served material. The 5 km rule remains a project omission rule, not a guarantee of safety.

4. The eleventh failed_t entry: acceptable, with state precedence

Keep all 11 entries outside the first-to-last withheld tuples, as proposed. The failed attempt between a tuple's last withheld fix and the next retained fix carries no location.

Withholding takes precedence over failed-attempt wording throughout the full hidden-marker span. That entry must not restore a marker/accuracy, change the screen to an ordinary failed-fix state or imply a known position.

Do not call those 11 events “outside withholding” without qualifying that this refers to the stored tuple endpoints; one is still inside the longer hidden-marker span. A count-only approach would also work, but is not required.

For visible joined steps, show “tried ... and got none” only once replay time reaches the failed event. Do not present a future failed attempt as already having happened. Source-wide counts in the card are separate.

5. B1–B17: sufficient for the private-preview build

Carry these precise checks into implementation:

j has n entries, starts with 0, contains only integer 0/1, matches the manifest join count and never permits a step over the time rule or across a withheld event.

Period endpoints are integer times inside recording bounds; first <= last; counts and totals agree; periods are ordered and disjoint. failed_t entries are integer, within recording bounds, unique and count-consistent.

The new bird manifest requires the new fields. Missing acc/j/withheld/failed_t must not silently trigger legacy behaviour. Genuine legacy journeys still load without these extensions.

Test hidden state at its start, just before the next retained event, exactly at that event, and at a trailing recording endpoint; include the failed event inside the hidden-marker span.

B6's string scan is a useful supplementary leak check, not proof: also verify structured output contains only the retained source rows and that raw input/extracts cannot be served. Numeric reformatting can defeat string matching.

B17 should mean no raw source file is present in the served tree. A provenance manifest may name the source CSV; banning the filename as text would conflict with normal source documentation.

These specify the intended design and tests; no further full proposal review is needed solely for these clarifications. Candidate review must verify their implementation and the legacy regression evidence.

Next handoff

Recommend D1 A, D2 A, D3 yes, D4 yes. Ask Chad for his concrete branch-build go; his existing authority covers only this proposal. Build on the stated separate branch/private preview and bring the actual candidate and tests back for review.

The source choice and breeding-adult label remain accepted. No extra research or provider email is needed for this build. Three expansion enquiries remain SENT; no reply reported. NOAA/ATAP unchanged. No production action or Earth from Space probe work.

