# GPT closure review: Animals tab Stage 1 r2 (`069a2dc`), 20 Nov 2026

**GPT's text, relayed by Chad on 20 Nov 2026 and filed unchanged below. It is GPT's review, not Chad's approval. Filed 20 Nov 2026 18:27 UTC.**

---

Mother Earth — Animals tab Stage 1 r2: focused closure review

20 November 2026 · animals-tab-rc · code 069a2dc513226b83a4e43f97be8c4575fb92493b · packet head 9fb449d191020353abf2696eedd1f039b383443d

PASS for the Stage 1 private-candidate checkpoint. Both bounded hold points on 5bae569 are closed. Stage 2 may begin under Chad's existing two-stage branch-build go, with the bird candidate returning to GPT. No merge, deployment or public release clearance.

Evidence checked

Verified the six supplied hashes for the changed files and r2 packet. Read the Retry lifecycle changes, phone reveal/status code, HTML/CSS and the new test sections.

Compared the seven files in assets/animals/ and nine source/test/config files in phase1/animals/ to the archived r1 review tree now under _to_delete/animals-tab-stage1-5bae569: unchanged, excluding caches.

Compared index.html with the bundled _baseline-main-0e62083 snapshot: only the stylesheet version and two Animals navigation links differ. All 18 other baseline files listed by the suite match that supplied snapshot. This is a file comparison to the supplied baseline, not an independent Git attestation of the snapshot's commit.

Hold 1: shared-list Retry — closed

The revised function has a separate controller, deadline and token. Cancellation advances the token and aborts the old request; checks after the asynchronous stages prevent stale results from painting or announcing. Selection, pagehide and lost-globe paths invalidate it.

I independently executed the exact extracted cancelList/checkList functions with controlled request collaborators:

Cancelled Retry's late failure leaves newer state untouched and announces nothing.

Cancelled Retry's late success leaves a newer error untouched and announces nothing.

A second Retry aborts/supersedes the first; an old failure cannot overwrite the newer success.

A never-answering request ends through the deadline, with busy state cleared.

All four passed. These are isolated-function tests, not claims to have independently rerun Claude's browser race fixtures. Successful list-only Retry still activates no journey, as required.

Hold 2: phone reveal — closed

Opened the exact revised candidate through localhost in Chad's Chrome.

At 390 × 844, switching on the shark brought the entire 420 px globe into view, top approximately 8 px and bottom 428 px; the replay bar was also within the viewport after loading. Focus remained on the shark switch.

At 360 × 560, the “Journey switches” link returned to the choices. Switching on the whale brought its 280 px globe fully into view, approximately 8–288 px. Only the whale switch remained checked; Space switched it off and hid the replay bar, retaining focus.

The code initiates reveal at the accepted user press, not from a load completion; that answers the delayed-scroll issue. Reduced-motion selection and exclusions for switch-off, unavailable controls and desktop layout are explicit. The status beside the globe provides loading/error feedback; the return link is present.

I observed the final positions after ordinary smooth scrolling, not a measured motion/accessibility performance study. I did not independently emulate reduced motion or rerun the held-network UI cases.

Test provenance and remaining limits

The revised suite removes the fixed Linux globe-library path and supports a file-based main baseline. That resolves the portability design issue.

Local playwright, pngjs and globe.gl packages are still absent, so I have not independently rerun 227/227 or 38/38 breaks. Those and the older-page suite totals remain Claude's reported runs. I reviewed their relevant coverage and combined that evidence with the independent code/race/phone checks above.

The earlier independent GPS-builder 22/22 result stands; builders have not changed. Argos suites remain unrun by me because geographiclib is absent. mobile-pass and key-drawn-ui remain unrun as disclosed because their captured fixture is missing.

Real phone, screen reader, broad performance and real hardware context-loss remain unverified. This does not claim full release readiness.

Next action

File this closure and proceed to Stage 2 on the same private branch under Chad's existing go. Keep Stage 1's reviewed commit as the comparison point and the original parked branch intact. Bring the bird implementation, source-reproduced outputs, withholding states and complete candidate evidence back for review.

No extra confirmation is needed merely to begin already-authorised Stage 2. Public release remains separate. Three expansion enquiries SENT, no reply reported; NOAA/ATAP unchanged. Earth from Space probe untouched.

