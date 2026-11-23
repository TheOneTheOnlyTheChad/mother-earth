Timeline explorer Stage 1 — candidate review

23 November 2026 · GPT for Chad and Claude · candidate reported as timeline-travel-rc at 69b6c19

Verdict: focused review hold. The presentation direction and requested document deviations are acceptable, but saved-window restoration needs a fix before acceptance. Also fix the cluster zoom eligibility and stale explorer status, and clarify/test wheel release on leaving. No merge, release or Worker clearance.

Basis and independent checks

Read the build record rev 2, proposal rev 2.1 with Chad’s decisions, raw run/performance logs, relevant generator/test differences and explorer/history code in the Mac review tree. Compared local source bytes with main where applicable. Did not independently resolve the Git branch head.

Independent native Mac checks: JavaScript syntax passed; timeline-changes-build 45 passed, 0 failed; generator --check passed. Catalogue SHA256 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356 unchanged, byte-identical to local main. Worker byte-identical to local main, not deployed or touched. Full browser suites and mutations were not rerun by GPT; their reported results remain Claude’s.

Source bytes read:

timeline.js: 50,155 B; SHA256 560896043628cd7aa9379a5cf5ea27e776f3dfb0226637b2d2a7d82199f95d99.

style.css: SHA256 28759e4663a63638bcef64eb27c4203809d5fd1162670f68fb1be0e46426841f.

timeline.html: SHA256 1c0ed7a47f05cf82ceedd49da3238127a87622a684234cb3731b81e16f1c16d6.

Build record section 1 still lists earlier CSS/HTML hashes and the earlier stylesheet key; its rev 2 heading explains the later cosmetic change. Update section 1 to identify current bytes unambiguously.

Findings to address

H1 — Forward changes the saved window (browser-reproduced)

At 1280 × 860, fresh /timeline.html:

Reset; Zoom in; Older → 471.4–202.1 Ma.

Open the end-Permian mark.

Zoom in with the story open → 404.1–269.4 Ma, span 134.7 Ma. The story remains open although its mark is outside this window; this is permitted while exploring.

Back → story closes and correctly restores 471.4–202.1 Ma.

Forward → story opens at 319.3–184.6 Ma, not the saved 404.1–269.4 Ma.

Reload then keeps the changed window.

Code explains the result: popstate restores st.win, then show() unconditionally calls revealMark(). That recentres and saves the window when the restored story’s mark is outside it. Reload similarly needs checking with the original saved-outside-mark window, not only after Forward has overwritten it.

Separate explicit selection/reveal from restoring an existing state. Valid saved windows must win on Forward, reload and return from a change record. Keep explicit opening of an offscreen entry able to reveal it. Preserve invalid/missing-state defaults and focus behaviour. Add a targeted regression and meaningful break; current section E exercises a saved window that does not expose this case.

H2 — cluster “Zoom to these” eligibility uses only the outermost separation (static finding)

cluster() uses hi - lo and the minimum span to decide whether members can separate. This does not inspect internal gaps or duplicate ages. Example fixture: two entries at 251.941 Ma and another at 251.971 Ma. They cluster at the broad view; the outer span can pass the eligibility test while the coincident pair can never separate. The target span/padding and actual target width also need to be used, rather than only asking whether the extremes could separate at minimum zoom.

Check actual adjacent member separations in the candidate target window, preserving the same rendering/clustering rules. Under the agreed rule, suppress this action when all members cannot separate; their list remains usable. Add mixed coincident-plus-separated and mixed very-close-plus-separated fixtures. The existing two-member coincidence tests miss this. This was not reproduced in the live five-entry catalogue, which contains no coincident pair.

H3 — stale “outside this view” status (browser-observed, code-confirmed)

After the focused end-Permian mark left the window during desktop zoom, the explorer acquired “End-Permian mass extinction is outside this view.” That status remained after Reset returned to 538.8–0 and later while viewing the end-Triassic change record, although the Permian mark was again in range. E.stat is written on focus loss but never cleared/recomputed on the other render paths.

Clear or recompute this status when its condition ends, without removing useful announcements. Test leaving, returning to range, switching stories and reset, including screen-reader-facing status text.

Wheel release: pin the meaning of “leaving” and test it

The observed wheel activation and Escape release work. Code releases on focusout; pointerleave currently only clears a not-yet-moved drag. If “leave the timeline” means moving the pointer outside it, the promised release is absent. Either implement pointer-leave release and test it, or explicitly choose and label focus-leave semantics. Do not retain ambiguous instructions. GPT did not independently exercise pointer-leave/re-enter during this smoke.

Answers to the requested differences

Section 2 points 1–3 accepted: uncertainty remains with its own claim; “Review and changes” accurately describes the final group; lane wording avoids implying that reviewed Pliny does not exist. Generator grouping preserves claim indices/IDs and text; its order guard prevents silent regrouping of an incompatible future catalogue.

Point 4 accepted: keeping the existing full-height phone modal is reasonable. At 390 px it reads cleanly, contains the story controls and keeps underlying content inert. The 70% alternative is not a requirement for this branch. This proves responsive desktop Chrome behaviour, not actual phone/Safari use.

Point 6 accepted: replacing the global equal-key assertion with index = sources and Timeline key at least their key/build is consistent with the scoped redesign. The diff does not simply delete version checks. Its safety also depends on stylesheet isolation, mixed-asset guards and other-page regression checks; numeric key ordering alone proves none of those. Claude’s supplied mixed-assets/other-page results support it; GPT independently reran the 45-check build suite only. No need to bump all five pages solely to satisfy the old assertion.

The 32 px cap

Accept the cap as a presentation grouping rule. It limits the spread of member centres grouped together, not necessarily the physical hit-target width. The control sits at that group’s midpoint and its count/list makes it visibly an aggregate, not an event at that age. No individual date is moved. At 1280 px the actual Whole Earth view offered a two-member Permian/Triassic cluster; its list and zoom worked. At 360 px all five formed one reachable list, which fitted the page (document width = scroll width = 360).

The cap is not a guarantee that arbitrarily many coincident records produce a short list. Retain a usable bounded-height scrolling list for dense content and keyboard access to every member. H2 concerns zoom eligibility, not rejection of this cap.

Independent Chrome smoke, approximately 10:33–10:37 SAST

Local review URL http://127.0.0.1:8899/timeline.html; explorer loaded against the live hub, without a catalogue fixture. No publication or source-data change. Native pointer/scroll input plus semantic browser controls used.

Exercise

Observed result

Desktop 1280 × 860, buttons and drag

Zoom/pan changed range; 140 px native drag shifted the window and opened no story. Story opened beside the narrowed explorer.

Inactive/active wheel

Inactive wheel scrolled page with range unchanged. Click activation enabled range changes; Escape released it.

Back/Close

Restored the opening range and mark focus in the exercised desktop paths.

Forward after mark leaves range

Failed exact range restoration: H1.

Desktop “Changed in”

Entry → record → Back restored story and wording link focus; record → Open entry → Back restored its opener.

390 × 844

Zoom, pan buttons, native mouse drag at phone width, Enter wheel activation and Escape release worked. Not touch input.

Phone sheet/history

Story opened as a readable full-height modal; Back closed it; Forward reopened it.

Phone “Changed in”

Closed the sheet, focused the record; Back reopened with focus on the wording link; Forward returned to record; Open entry and return worked.

360 × 844 Whole Earth

Five-member list and its zoom control reachable; no page overflow in that observed view.

Pliny conversion deep link

Conversion expanded, heading focused, Close returned to list without invented axis placement.

Temporary viewport override reset and owned review tab closed. No UI performance measurement, complete network trace, real phone, Safari, screen reader, full keyboard audit, publisher refresh or 200-entry browser smoke was performed by GPT.

History coverage to add or make explicit

Beyond the exact H1 regression: saved window excluding the story’s mark → reload directly; the same saved state → change-record round trip; browser Back/reload immediately after wheel/keyboard input before the 200 ms deferred save; wide/narrow resize while a story or change record is current; switching between plotted entries and Pliny without losing state/focus. The phone branch of section E skips the full change-record chain; GPT’s ordinary phone round trip worked, but add the automated counterpart rather than describing it as already covered there.

The direct-link-to-an-entry-older-than-the-current-catalogue-window rule is unexercisable under this catalogue validator. Keep that limitation explicit; do not weaken the validator for a hypothetical future slice. Add its valid fixture when a later schema actually supports older entries.

Next: focused branch fixes/tests for H1–H3 and clear wheel-leave semantics, refreshed hashes/build record, then a bounded recheck. Presentation direction, existing content scope and catalogue remain accepted; no redesign or new research is needed to fix these findings. Publisher-page reads, integration and Chad’s release decisions remain later steps.