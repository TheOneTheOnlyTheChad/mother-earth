# Diviner GCP acquisition tooling — versions

Each checkpoint line names the tooling version it was made with. Earlier versions stay valid for the bands they produced. Their evidence is never rewritten.

| Version | Commit | Files (SHA-256) | Used for | Notes |
|---|---|---|---|---|
| **v1** | `0d5ae9b7c9b0e05c865a12366e0acc18f4c75e87` | `mehash.js` `85420962f50191ffa35be5f76cb49b4177c26a29387f31666a64fb40a4f99dd8`; `gcp_stream.js` `523149df9db5dfd39ba3baa5e76efdd834859fa7165266bf409fdb9dc2941fb9`; `pane_job.js` (pane_job-1) `d541245d8658eb27dff21497a59511e1225f48bdcc872651eb0ac2a89d229ba6` | band `00n10n` (checkpoint line 1, 26 Nov 09:36 UTC) | GPT passed that band's numerical result (`reviews/2026-11-26-moon-diviner-first-band-trial-gpt-review.md`). GPT also found that pane_job-1 could export a failed run's outputs, and a previous band's outputs after a later run failed early. **Not to be used again.** The band's data were verified independently and stand. |
| **v2** | the commit that adds this line (see `git log -1 -- docs/research/moon-lro-science/diviner-acq/TOOLING.md`) | `mehash.js` and `gcp_stream.js` unchanged from v1; `pane_job.js` (pane_job-2) `1ca0e93ecdf8746d4a1274c3d241b9aa6d3c6d7661cb3d635421a88b84bd1601`; new test `test_pane_job.cjs` `35e5e055fc8ca7bfc83b6bcd5ee80ecb17f74f9fa1db6d3c72de3dbeef237f69` | the remaining 17 bands (D4b, after GPT's recheck and Chad's go) | Exports are bound to the current verified run (see below). |

**pane_job-2 changes:**
- **Starting a run:** `start()` refuses while a run is active, then releases all earlier outputs and status before the new run begins. Each run has a `runId`.
- **Integrity checks, in order:** HTTP 200; `Content-Length` (when sent) equal to the expected size; never more bytes than expected (the stream is cancelled at once); total bytes equal to expected; MD5 equal to the archive's. The MD5 check comes before the parser's final check and before any reduction or compression.
- **On failure:** any failure keeps no outputs, cancels the stream reader and aborts the request.
- **Exports:** `download(which, name, runId, band)` and `piece(which, start, length, runId, band)` work only when the phase is `done` and the run and band match the completed run. `which` must be `ext` or `planes`, and a download name must contain the band.

**Tests:** `node phase1/moonsci/diviner/test_pane_job.cjs <samples-dir>` gives 56 passed, 0 failed (26 Nov). It runs the real job code in a Node VM, with fetch mocked from a committed sample patch, and needs no network. The cases:
1. a successful run, and exports refused for the wrong run, band, name or selector
2. run B fails at the first read: A's outputs are released at B's start, nothing is exportable, there are no stale status fields, and the reader is cancelled
3. a wrong MD5: nothing is reduced and nothing is exportable
4. a wrong `Content-Length`: refused before any read, reader cancelled
5. more bytes than expected: stopped early and cancelled; 5b, fewer bytes than expected
6. a parse error: stopped at the failing chunk and cancelled
7. HTTP 404; 7b, the request itself fails
8. exports and a second start refused during an active run; a retry completes and exports only its own data

Against pane_job-1, GPT's two findings reproduce (a wrong-MD5 export, and an export after a later run failed).
