Timeline explorer Stage 1 — rev 3 bounded recheck

23 November 2026 · GPT for Chad and Claude

PASS for the bounded fixes: close the previous focused hold. Candidate reported as timeline-travel-rc at 861b0f5, build 202612250300. This is branch acceptance of these fixes, not permission to merge or release. Earlier accepted design decisions stand.

Read the Mac build record rev 3 section 8, raw rev 3 log, updated history/window, status and clustering code, and the new E2/E3/F2 regression assertions. Independently reran native Mac JavaScript syntax, generator --check, and timeline-changes-build (45 passed, 0 failed). Did not rerun browser suites or mutations: 207 travel checks, 20 caught breaks and the other suite results are Claude’s supplied runs.

Current hashes verified from disk:

timeline.js: 53,230 B; 42fe23bcc9654266e00aa16a2ee53672b533fa027539f921ca3a835ec1c1936b.

timeline.html: 87535def047393362ce14bd3ef938eafff2a719c780b46b2193802aba6fba280.

style.css: 28759e4663a63638bcef64eb27c4203809d5fd1162670f68fb1be0e46426841f (unchanged from previous smoke).

Catalogue: 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356 (unchanged).

H1 — closed

Repeated the original steps in Chrome at 1280 × 860 against the local server and real hub catalogue:

Point

Observed window

Zoom in, Older, open end-Permian

471.4–202.1 Ma

Zoom in with story open

404.1–269.4 Ma

Back

471.4–202.1 Ma; story closed

Forward

404.1–269.4 Ma; story reopened without recentring

Reload

404.1–269.4 Ma retained

The explicit reveal/restoration distinction is correct. show(..., false) preserves valid saved windows, while explicit selection can reveal a mark. E2 adds the direct-reload, change-record and offscreen-explicit-open cases, with restore-reveals catching the prior bug. Those additional assertions were read, not independently all rerun.

H2 — closed by code and regression review

zoomTarget() now calculates the target window then applies groupsAt() using the actual rendering rule. It requires each proposed member to stand alone in that target, rather than comparing only the extreme ages. F2 covers a coincident pair plus a third member, a very close pair plus a third, and a genuinely separable group. The recorded zoom-outer-only negative control catches the old defect. No new fixture-browser run by GPT was needed for this bounded recheck. The 32 px grouping cap remains accepted.

H3 — closed

The status now has a tracked lostId, is recomputed on redraw, and is cleared when its condition ends or focus leaves the explorer. In the independent Chrome pass it was empty after Reset and on the end-Triassic change record. E3 explicitly exercises the initial non-empty condition, keyboard return into range, Reset, another story and the change record; the supplied stale-status break fails. GPT did not independently reproduce every E3 trigger during this recheck.

Wheel semantics — accepted

The chosen behaviour is focus-armed wheel zoom: merely moving the pointer outside does not disarm it. Outside, the wheel scrolls the page; on returning, it can zoom again without another click. Escape or moving focus outside the explorer disarms it. Moving focus from the explorer onto one of its own marks stays inside it and is not expected to disarm.

The new hint says: “Wheel zoom is on while the pointer is over the timeline. Press Esc, or click or Tab somewhere else, to turn it off.” This is acceptable with the specified semantics. In Chrome, after activation, an outside scroll left the displayed range unchanged; returning over the explorer changed the range without reactivation. Reset by click ended this interaction. The exact return-scroll delta is not a calibrated zoom/pointer-anchor measurement. The supplied tests cover focus leaving, click elsewhere and Escape. Pointer-leave is therefore a defined choice, not a missing release handler.

Base history key and deferred saving

Accept the base entry carrying k and win. It is still a base entry because it has no entry or change field. A key alone is not a story, and it creates no extra browser-history entry. Existing k/p relationships continue to identify navigation; saving merges fields instead of overwriting them. E2 and the unchanged history suites provide relevant coverage.

The memory map keyed by history-entry key recovers the newest deferred window during same-document Back/Forward. Restoring a newer in-memory value writes it into that current entry. beforeunload and pagehide attempt to flush a pending save for the current entry on reload/leaving. These are navigation conveniences, not durable scientific records or a browser-crash recovery guarantee.

Accept the disclosed limit for Stage 1: input made during the last 200 ms on entry A can be lost if the user leaves A before its save, then reloads on entry B before revisiting A. A’s latest value exists only in page memory, which that reload discards. This loses at most that unsaved view change under the stated normal-save conditions; it does not change the catalogue, evidence, story text or stored ages. Keep it recorded as a view-restoration limitation rather than claiming lossless history. Browser shutdown/crash and denied/rate-limited history writes are outside this guarantee too. No new persistence layer is necessary for this low-impact transient state.

Small documentation correction, not a code hold

Section 8 equates 09:50–10:17 SAST with 08:50–09:17 UTC. SAST is UTC+2: the raw UTC log corresponds to 10:50–11:17 SAST. Correct the converted times, retaining the raw log. No code rerun is required for that edit.

Browser scope: a bounded desktop Chrome recheck, not a fresh full desktop/phone smoke, performance run, network audit, actual phone/Safari or screen-reader pass. The earlier responsive smoke remains qualified as before. Temporary viewport reset; owned tab closed. No live changes made.

Next: record this closure and correct the time conversion. Before release, complete the already agreed publisher-page reads, current-main integration and relevant checks, and obtain Chad’s own release line. No additional code/test hold identified within this bounded recheck; no Worker deployment is needed.