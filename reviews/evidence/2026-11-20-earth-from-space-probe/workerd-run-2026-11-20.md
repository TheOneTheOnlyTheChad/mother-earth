# The probe file (rev 2) run inside workerd (local), 20 Nov 2026

`node evprobe-workerd-run.mjs <miniflare>`, miniflare 4.20260730.0 / workerd 1.20260730.1, cloud workspace, run at 10:00 UTC. The probe now acts only when the actual time is inside the slot it was scheduled for, and workerd uses the real clock, so each case runs the file with **only its PROBE_START line changed** to a start that puts a slot of the wanted kind at the present moment. EUMETView is replaced by the fixtures. **Shows that the file loads and runs as a Worker with no bindings, makes three requests a run, refuses ticks outside their own slot, and cannot be called over HTTP. Shows nothing about memory capacity** (local workerd has no limit, so 96 MiB completes).

| Case | Slot placed at the present time | Requests | Lines | Outcome | Memory intact |
|---|---|---|---|---|---|
| HTTP request | phase 1, 2048 px | 0 | 500 Error: Handler does not export a fetch() function. at as |  |  |
| phase 1, 2048 | phase 1, 2048 px | 3 | start fetched validate-begin validated done | validated |  |
| phase 1, 1536 | phase 1, 1536 px | 3 | start fetched validate-begin validated done | validated |  |
| phase 2, 2048 | phase 2, 2048 px | 3 | start fetched validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated done | validated |  |
| phase 2, 1536 | phase 2, 1536 px | 3 | start fetched validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated done | validated |  |
| phase 3, 2048, 16 MiB | phase 3, 2048 px, 16 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| phase 3, 1536, 16 MiB | phase 3, 1536 px, 16 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| phase 3, 2048, 48 MiB | phase 3, 2048 px, 48 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| phase 3, 1536, 48 MiB | phase 3, 1536 px, 48 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| phase 3, 2048, 96 MiB | phase 3, 2048 px, 96 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| phase 3, 1536, 96 MiB | phase 3, 1536 px, 96 MiB | 3 | start ballast fetched validate-begin validated done | validated | true |
| tick for the slot twenty minutes ago, delivered now | phase 1, 1536 px | 0 | not run | not run: delivered after its slot |  |
| tick for the slot twenty minutes ahead, delivered now | phase 1, 1536 px | 0 | not run | not run: delivered before its slot |  |
| a slot from before the window (scheduled time), delivered now | phase 1, 2048 px | 0 | not started | not started |  |
| a slot from after the window (scheduled time), delivered now | phase 3, 1536 px, 96 MiB | 0 | expired | expired |  |
| an excluded slot | no slot of this kind can be placed at the present time | | | | |

The excluded-slot case cannot be placed at an arbitrary present time (exclusions are fixed clock times); it is covered in Node by test C19 and C25.
