# GPT focused review: Animals East Walker corridor proposal rev 2 (as relayed by Chad, 21 Nov 2026)

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Not Chad's approval of anything. Chad's message also carried GPT's short summary: hold 1 closed; two narrow corrections remain (the Medium and High relation test; the phone reveal at the press, not at the response); clarifications on scale hiding, area tolerances, the three-request total, failure cleanup and view-status wording; the public-branch disclosure accepted, and Chad's eventual build go must acknowledge it; no build or deployment clearance.

---

Animals — East Walker corridor proposal rev 2: focused GPT review

21 November 2026. Documents only.

Proposal: animals-expansion-proposal, commit 3eb3ffd3122cc09d3b23dbba11c92e0e59e2e460.
Verified file SHA256: 4d231a0fd675a3b1e5a080dbc3317117c7cf9a300710f967460749fe990cda92.

Verdict: Hold 1 CLOSED. Holds 2 and 3 substantially answered, but two narrow corrections remain before proposal clearance. The design and recommended decisions remain unchanged. No implementation, merge, deployment or release clearance is given.

What closes

Read the full proposal, including the complete §5.5–6.1 text separately after the initial output was shortened.

The method now correctly separates within-animal averaging and stacked individual footprints from the population-averaging used for stopovers. The herd-specific class definitions, qualified datum note, withdrawn raster-origin inference, decoded absence-of-Low test, per-class hole tests, resource ownership, separate backdrop lines, bounded regional imagery request, source-versus-display resolution distinction, declared performance budget and public-repository disclosure answer the corresponding review points.

The displacement and area limits are acceptable as declared candidate acceptance limits, not mathematical guarantees that the source will pass. Source validity, cross-class relations, rounded validity, imagery, zoom and performance still must actually be measured. Stop/report rather than repair or loosen a failed limit.

Remaining Hold 2 — §5.4 does not yet define a sound relation test

It counts proper segment crossings, but its “bands” definition does not use that count. Testing vertices alone misses genuine overlap.

Independent counterexample, coordinates in metres:

Medium rectangle: x from −200 to 200, y from −50 to 50.

High rectangle: x from −50 to 50, y from −200 to 200.

These form a plus shape. No vertex of either rectangle lies inside the other. There are four proper boundary crossings and a 10,000 m² overlapping interior. The stated vertex-only definition nevertheless labels them “bands.” I reproduced these counts with a small independent check.

Correct the contract so proper crossings and filled-interior/containment evidence determine the relation together, with holes respected. “Bands” requires disjoint filled interiors, not merely no strictly interior vertices; any proper crossing or positive-area interior overlap inconsistent with the selected relation must not pass as bands. Partial containment of separate components also needs a defined mixed result. Include the crossing-rectangle counterexample among K1 cases.

The 0.01 m and 1.5 m neighbourhoods may identify boundary-proximity/rounding ambiguity. They are not proof that a real overlap is numerical noise. In particular, 1.5 m is a possible combined movement of two independently rounded boundaries, not a floating-point-error bound. Report near-boundary cases separately; unresolved source/output relation changes stop for review. Do not discard them and then claim topology is unchanged.

This does not require a particular geometry library or algorithm; it requires a complete relation test whose candidate implementation can be checked.

Remaining Hold 3 — §6.1 phone reveal is still response-timed

The phone reveal occurs “at the same moment” as drawing after the geometry response. Cancellation covers camera movement but not ordinary page scrolling. A visitor can press the switch, scroll down to read another card while the request waits, and then be pulled back when the geometry arrives. That repeats the behaviour Stage 1 was changed to prevent.

Use the already accepted journey interaction:

Reveal the globe once at the explicit switch-on or row-Retry press, with loading/failure status beside it.

No page scroll from geometry success/failure or picture success/failure.

Keep focus on the control used and respect reduced motion.

Do not scroll for switch-off, page load, background/list retries or unavailable controls.

Keep camera positioning distinct from document scrolling. A deferred camera move is acceptable only while the original action remains current and no intervening camera/navigation action has cancelled it. Define “late” as stale/superseded; the text currently both allows an active response to complete the pending move and says any late answer never moves. A regional-picture answer never owns a camera or scroll action.

Add a held-geometry phone test: press on, verify the globe reveal before releasing the response, scroll away, release the response, and verify the document stays where the visitor left it. Also cover Retry and the reduced-motion path.

Small wording/test clarifications to carry into the revision

These are refinements to the specified implementation contract, not requests for additional features.

Scale during motion: §6.3 recalculates only at camera-end. Hide/invalidate the existing scale immediately when camera movement or resize begins, then show a freshly checked value once stable. Otherwise an outdated scale can remain visible during motion. Add a test during, not only after, movement.

K5 area scope: state explicitly that the ±0.001 km² comparison is for the source net areas against §3.2. Rounded areas use §5.3's per-ring bound and per-class 0.05% bound. Record both, with no contradictory expectation that a rounded output exactly matches a source-area fixture.

Image cap: say “at most three requests total per page load, including the first automatic request.” A switch-off that aborts the automatic request still consumes an attempt; later toggles must not silently restart it. Explain how the visitor explicitly retries an aborted image request without toggling a journey off.

Geometry versus image failure: image failure leaves verified polygons available. Geometry verification/load failure returns the corridor to off and removes/invalidates its regional overlay too. Reword “either may fail without the other” to mean independent loading/error handling, not permission to leave an orphan regional image visible after corridor failure.

View status: both items being on does not logically mean one must be outside the view at every zoom. Derive an “out of view” claim from actual view evidence and test zooming/panning, or use bounded wording such as “View centred on the corridor; the journey remains active,” rather than inferring invisibility from the last go-to action.

K3 fixture provenance: the previous review supplied areas/extents and envelope checks, not a published set of point-by-point projection fixtures. Identify any additional GPT vertex fixtures actually supplied; do not invent or attribute new values to GPT. The independently sourced printed example and independent full-data calculation must be real and cited at candidate review. Projection-library/runtime dependencies are not required merely to write this proposal.

Private-preview disclosure: §10 correctly establishes that branch assets are publicly downloadable. Therefore the earlier “no further enquiry needed for a genuinely local/private preview” finding cannot itself clear publication on this public branch. Before a build writes and pushes display files there, Chad's own go must explicitly cover that known exposure of this published aggregate product. This can be part of the ordinary build decision, with no extra email or separate approval ritual. Live-page release remains separate. An unlinked branch is not guaranteed unindexed.

Recommended next step

Return only the focused proposal edits for the two remaining holds plus the short clarifications above. No new data audit or broader feature redesign is requested. Once these contracts are clear, the proposal can proceed to Chad's decisions: C-D0 yes; C-D1 A independent; C-D2 A Medium/High only; C-D3 A all vertices with rounding checks; C-D4 A regional imagery with tested fallback B; C-D5 A Stage 4 on animals-tab-rc.

These are recommendations, not Chad's decisions. His ordinary build-go wording should plainly acknowledge that derived corridor assets committed to the public branch will be publicly downloadable although not deployed on the live site.

Nothing built, merged, deployed or sent. Earth from Space and the passed Animals modules were not touched.

