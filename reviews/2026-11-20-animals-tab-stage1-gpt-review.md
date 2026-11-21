# GPT review: Animals tab Stage 1 candidate (`5bae569`), 20 Nov 2026

**GPT's text, relayed by Chad on 20 Nov 2026 and filed unchanged below. It is GPT's review, not Chad's approval. Filed 20 Nov 2026 18:14 UTC.**

---

Mother Earth — Animals tab Stage 1: independent candidate review

20 November 2026 · animals-tab-rc · code 5bae569edb1bc3ad367d05b37dbc7f4b98ea7730 · packet head 7a7e1a8630762163b3f19854c1acd23935e588a4

REVIEW HOLD, bounded: fix shared-list Retry lifecycle handling and add Chad's now-requested phone scroll behaviour before Stage 2. The page move and normal journey playback worked in independent Chrome smoke checks. No source-data or bird-design issue is reopened.

What I checked independently

Read the packet and the new globe module, the complete journey controller and relevant HTML/CSS/test code. All ten supplied packet/code/test hashes checked match.

Compared assets/animals/ (7 files) and phase1/animals/ (9 files, excluding caches) against the available parked ea5414d review copy: byte-identical. This is a direct comparison to that preserved copy, not an independent Git proof of the entire 74941ff tree.

Opened the exact candidate in Chad's Chrome, via my localhost-only server. At 390 × 844:

all three journeys loaded via their switches;

shark → whale → zebra left the newly selected switch on and the previous one off;

zebra Play advanced replay time; Pause stopped it; keyboard End reached the last recorded fix;

Space on the zebra switch returned all switches off and hid the replay bar, with focus on the switch;

the real NASA backdrop loaded, with the requested date/caveat displayed. This is one successful real request, not validation of every imagery/fallback path.

The Python GPS builder suite ran independently: 22 pass / 0 fail.

I could not independently run the supplied Playwright suite: local playwright, pngjs and globe.gl packages are unavailable, and it hard-codes a Linux globe-library path. The review copy also has no Git metadata for its main-baseline checks. The two Argos suites stop at missing geographiclib locally. Thus 169/169, 26/26 deliberate breaks, the older page-suite totals and Argos results remain Claude's reported runs, not mine. No installs or production changes were made.

Finding 1 — shared-list Retry can overwrite a newer state

animals-journey.js, checkList(), lines 149–154.

Normal journey loads have a timeout, abort handling and generation checks. The shared Retry uses bare fetch with none of those lifecycle protections. It can hang indefinitely, run concurrently with another retry, or announce/set a global error after a newer journey has verified and loaded.

I reproduced the latter by executing the exact extracted checkList function with a deferred fetch and stubbed collaborators:

Start Retry on an earlier shared-list error.

Advance selection/generation to a newer verified journey and clear the error.

Reject the old Retry request.

Result: the newer selection remains, but catErr becomes LIST FAILED and the old failure is announced.

This was an isolated-function reproduction, not a browser network-race test. The absence of guards is also visible directly in the source.

Required correction: give shared Retry its own bounded request lifecycle. Abort/supersede it on a later selection, a newer Retry, page departure and loss of usable globe as appropriate. Check identity/generation after each await and before any error/success paint or announcement. Do not let its controller interfere with the current journey load.

Retain the good behaviour: successful shared Retry verifies only the list and activates nothing.

Add browser regressions for delayed Retry success/failure after a valid journey selection; Retry → Retry; Retry → pagehide; and a request that never answers. Old completions must not change the current error state, clear newer errors, speak stale messages or draw anything.

Finding 2 — phone toggle must reveal the globe (Chad's new instruction)

Confirmed at 390 px: after selecting the shark, scrollY was 966 and the globe rectangle ran from approximately -736 to -316 px. The whole globe was above the screen.

This was consistent with the original proposal order; it is now an authorised UX correction because Chad explicitly wants the page to move up to the globe when a phone toggle is activated.

Recommended behaviour:

In the single-column layout, activating a journey on or Retry brings the globe into view once, with fixed-header clearance. No scroll when switching off.

Prefer doing that immediately for the accepted user activation, with visible loading/error status beside the globe. That avoids a delayed network answer dragging a visitor back after they have scrolled elsewhere.

If scrolling on successful completion is chosen, bind it to the current selection and cancel it when superseded, switched off, the user navigates/scrolls elsewhere, or the page is left.

Respect prefers-reduced-motion; do not steal keyboard focus from the activated switch. Never scroll per playback frame, on initial load, catalogue-only Retry or a focus-only deep link.

Keep a usable route back to the choices. Do not hide failure feedback below the screen after an automatic upward scroll.

Test short/tall phone viewports, reduced motion, delayed loads with user scrolling, rapid switching, switch-off while loading and load failure. Confirm globe/replay visibility and focus, not just that scrollIntoView was called.

The scroll feature must also work for the bird's later opening withheld state: a successfully loaded record need not have a visible marker.

Packet questions / accepted decisions

Imagery duplication: acceptable for this stage. The equivalence check is useful and avoids importing the Earth now application. Keep the source/date rule comparison, failure/no-date fallback and no-hub-request checks.

Shared Retry activates nothing: correct; keep that contract while fixing its lifecycle.

Cards load metadata on entry: accepted. Catalogue/manifests for readable cards are allowed. No journey coordinate file should load before its switch is enabled.

Layout: the separate Animals page and flow-based replay bar are the right direction. This candidate needs the phone reveal action, not another page-design proposal.

Verification and handoff

Provide a revised candidate hash and focused evidence for the two fixes. Rerun the complete Animals tab suite and relevant regression checks. Make the test dependency paths configurable or supply a portable runner if independent local rerunning is expected; record the exact pinned globe-library version used.

Carry the existing sampled bar-text sweep forward where practical; unchanged bar text lowers risk but does not substitute for the earlier requested replay checks on the new page. This is verification follow-through, not a demand for another research round.

Do not describe Earth now as wholly identical without the stated exceptions and shared stylesheet assessment. Its missing captured-fixture tests remain unrun; disclose them, as the packet already does.

The existing source/release caveats, actual-phone testing, screen-reader testing, performance and hardware context-loss limits remain. One real Chrome imagery success updates only that narrow earlier “not proven” item.

Stage 2 waits for closure of this bounded Stage 1 hold. No merge, deployment or public release. Parked source branch retained. Penguin/IWC/Cape Vidal enquiries SENT, no reply reported; NOAA/ATAP unchanged. Earth from Space probe untouched.

