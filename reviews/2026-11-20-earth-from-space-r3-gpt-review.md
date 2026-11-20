# GPT independent review — Earth from Space R3 (`earth-from-space-rc` `9f350bc`)

Filed by Claude on 20 Nov 2026 from the text Chad supplied in the thread. GPT's words, unchanged except that the Mac home-folder path is written as `~/Documents/…`. Result: PASS for the R3 repairs and the private local-fixture candidate; not production clearance.

---

Earth from Space R3 — independent review
20 November 2026. Review clock reading: 06:57:04 UTC / 08:57:04 SAST.

PASS for the R3 repairs and private local-fixture candidate. Both outstanding findings from the R2 review are closed. This is not production release clearance, a decoder-option selection, or permission for a production trial.

Candidate: earth-from-space-rc, 9f350bc05995ce94dcf05b86ff709fcbd05b5ac2, as identified by the supplied packet. Reviewed Mac copy: ~/Documents/Mother Earth/_review/earth-from-space-rc-r3/.
Findings closed
Publication against overlapping cleanups
The generation-key change addresses the reproduced R2 defect. Allocation and the pending entry are committed together through a conditional held-list write. Each retry gets another generation, stores create-only, verifies its object, claims its own entry, then attempts the forward-only pointer update. A cleanup retains the retired key; it cannot delete the different key used by the retry.

I accept the adapted L8 assertion: requiring the old object to be restored would contradict the repair. L8 still tests the essential invariants after the stale cleanup resumes, and additionally checks that only the old key was deleted, twice.

Independently verified:
- Unmodified R3 hub suite: 159 passed, 0 failed.
- Isolated L8 against R3: 6 passed, 0 failed.
- The same isolated L8 against the preserved R2 Worker: 2 passed, 4 failed. Besides the expected new-key assertion failure, the current-picture and held-entry invariants fail as before. This is a real negative control for the reproduced defect.
The failure/recovery cases L5/L5b, the marked-claim rejection L5c, allocation-conflict case L2, and key collision/counter cases K6/K9 were inspected as well as run. I found no remaining blocker in this repair within its stated operating assumptions.

The ordering argument remains conditional on the durable held list/counter, correct conditional storage writes, and no run surviving the full 24-hour grace period between claim and pointer publication. Loss or rollback of that persistent state is not established as a safe recovery procedure. The normal collector must not be treated as supporting that recovery.
Decoder memory evidence
Both requested revisions are present in decoder-memory-rev2.md and packet R2 §2:
- 16.86 MB is identified as P99/P99.9, not a maximum. The combined 66–71 MB/headroom inference is withdrawn.
- The Node RSS increase is no longer a bound for Worker memory.
- Forced-GC readings are qualified as sampled observations under altered collection behavior.
- My independent Node 24 results are attributed separately.
The evidence-description hold is closed. Worker capacity remains unverified. No decoder choice or production run follows from these Node figures.
Status wording
R3 space.js has exactly the R2 hash. space.html and style.css are byte-identical to the preserved R2 copies. The prior targeted Chrome wording closures carry forward.

The page-suite diff is limited to its picture-address assertion accepting the new generation suffix. Its 79/0 result remains Claude’s evidence, not an independent rerun.
Targeted mutation checks
All nine selected changed-area breaks applied and caused failure independently:
Break	Independent result
key-reused	Suite stops on an error; exit 1
counter-not-past-listed	158 passed, 1 failed
overwrite	156 passed, 3 failed
no-readback	157 passed, 2 failed
claim-ignores-mark	158 passed, 1 failed
serve-pending	158 passed, 1 failed
cleanup-own-view	148 passed, 11 failed
no-second-pointer-read	157 passed, 2 failed
serve-marked	158 passed, 1 failed


I did not rerun all 26 mutation cases; the complete 26/26 claim remains Claude’s.
Browser and file checks
The Mac Chrome extension remains reachable. I opened the rebuilt static preview and confirmed its first-night picture loaded completely at 2048 × 2048 with the expected source-frame alternative text. This static preview displays the local night.jpg fixture; it does not independently demonstrate live hub serving. The in-process hub suite exercises the generation-key routes.

The reviewed hashes match the supplied R3 identity:
- phase1/worker.js: ae355386b00d9dc28a59b50898215b56bee3ac5d241b579dd63eb92a69b7077b
- space.js: 8eb5cba843d22fe0b85ce19f5dfba321f6580017db00fad3ea84de27b0da0e22
As before, the Mac project folder is not a Git checkout; the head label comes from the supplied packet, with these file hashes independently confirmed.
Still open
- Worker-runtime memory, CPU, concurrent-load effects and served-time confirmation for this layer/projection.
- Decoder-option decision; no production trial requested or authorized.
- Independent full page-suite run and fallback-font header checks. Playwright does not resolve in this Mac’s Node environment.
- Morning and afternoon listing-delay samples.
- Account-wide Workers execution and R2 usage/cost evidence.
- Real phone, Safari and screen-reader testing.
- Validation coverage remains three frames from one day.
- Eight existing page-suite failures reported identically on main in Claude’s cloud environment; not investigated here.
No implementation, production configuration, stored production data, schedule, deployment, merge, provider contact or spending was changed.
Reply for Claude
GPT PASS on R3 9f350bc for the repairs and private local-fixture candidate. The overlapping-cleanup hold and the two memory-evidence statements are closed. Independently: hub 159/0; isolated L8 6/0 on R3 and fails on R2; all nine selected changed-area mutations fail. The L8 assertion adaptation is accepted. Unchanged wording closures carry forward. Keep all listed evidence limits open; this pass selects no decoder option and authorizes no production action.