# Mother Earth — Diviner first-band trial review

26 November 2026 · GPT independent review

Reviewed Mac trial copy from branch `moon-diviner-trial` at reported head `3380aaf`, with acquisition tooling pinned to `0d5ae9b`. No PDS download, page change, merge or deployment performed by GPT.

## Verdict

**First-band data and numerical trial: PASS. D4b repeat acquisition: HOLD for one focused browser-job safeguard fix and recheck.** The retained first band need not be fetched again.

The science result is sound. The browser job can nevertheless export failed-run outputs and, after a subsequent run fails early, export the previous band's outputs. Correct that before repeating this job across 17 bands. This is a tooling hold, not a request to revisit the product selection or page proposal.

## Independent verification

- Read the trial report, checkpoint, extraction schema, parser/reducer, pane job and comparison code from the supplied Mac copy.
- SHA-256 of all three browser JS files matches the checkpoint: `mehash.js` = `85420962f50191ffa35be5f76cb49b4177c26a29387f31666a64fb40a4f99dd8`; `gcp_stream.js` = `523149df9db5dfd39ba3baa5e76efdd834859fa7165266bf409fdb9dc2941fb9`; `pane_job.js` = `d541245d8658eb27dff21497a59511e1225f48bdcc872651eb0ac2a89d229ba6`.
- Independently re-read retained gzip: 2,886,891 bytes, SHA-256 `6ad7aac03c37fa36f835ad42c9c76ba7b8f1bd5d0aaf52c9bb5f3fc85deb1a40`.
- Decompressed extraction: 5,529,600 bytes, SHA-256 `6f0f2287c1d8e6bb22ad8ba4b250bb5f076c83e8f5d47f0b2e2a3504a917f495`, exactly 1,382,400 little-endian int32 values. All values meet the recorded valid/sentinel rules. Reproduced 588,791 empty bins, zero invalid bins and valid range 87.3290–405.1021 K.
- Using Python standard-library Decimal and integer arithmetic, independently compared both original sample patches to their retained extraction positions: all 38,400 values match exactly.
- Independently rebuilt the **entire band's** six output planes from the retained extraction with separate standard-library Python code. All 28,800 cell/window results together reproduce the checkpoint's plane SHA-256 `0189d956e94b9204d5f8762acfb764a171e6fc9d5845d6b682c0fbb2d54a6c79`. This extends the independent reduction comparison beyond the two patches.
- Ran `test_gcp_stream.cjs` locally: 165 passed, zero failed, including refusal of all 14 malformed inputs.
- Ran `test_mehash.cjs` locally: 468 passed, zero failed with 17 currently discoverable sample files. The report's 466 reflects its earlier 16-file set; this is not a failure.

The archive MD5, source SHA-256 and source-stream sample hashes are Claude's recorded acquisition evidence; GPT did not re-download the 156 MB source or independently measure browser heap/timing. The extraction and its complete numerical reduction were independently checked as above. Browser memory is an approximate sampled script-heap reading, not a total-process peak.

## Required fix: bind exports to a successful current run

`pane_job.js` currently assigns `st.planes` and `st.extGz` before deciding `done` versus `integrity-failed`. Both `download()` and `piece()` can export those buffers without checking the phase. `start()` also leaves the old output buffers and old status fields in place. A new run that fails before replacement leaves the old buffers exportable under a newly supplied filename.

I reproduced both paths by running the actual pane-job code in Node VM with mocked fetch/parser/hash dependencies (an orchestration test, not a browser/network test):

1. Wrong expected MD5 produced `phase: integrity-failed`; `download('ext', 'bad.gz')` still succeeded.
2. A subsequent run's simulated network failure produced `phase: error`; `download('ext', 'new-band.gz')` still exported the previous 24-byte fixture gzip.

For D4b, please:

- Reset per-run state and release previous buffers before the new run starts. Keep a run/band identity with the completed output.
- On size or MD5 mismatch, fail immediately before reducing/exporting; clear partial outputs on every failed path.
- Permit both export routes only for verified outputs of the current completed run. Reject unknown output selectors too.
- Cancel/release the stream reader on parsing/hash/read failure so an abandoned source download does not continue unnecessarily.
- Add focused job-level tests: wrong MD5, wrong size, parse failure, network failure, successful band A followed by failed band B, export during an active run, and successful current-band export. Assert failed runs cannot export and stale buffers/status are gone; verify reader cancellation on early failure. Do not fetch another full file merely to test these paths.

Record the replacement tooling commit/hash in the checkpoint provenance for future bands. Preserve the first band's original tooling identity and evidence unchanged.

## Record tidy-up and next step

The report's tooling table abbreviations appear to attach `523149df…` to the wrong ending and `d541245d…` likewise. Use the exact checkpoint hashes above; the actual local files match them.

The reported browser download behaviour is consistent with a multiple-download restriction but does not prove the cause. One band at a time, verified arrival and destination re-hash, with the already demonstrated base64 fallback, remains a reasonable route. No Chad screen work is needed for this review. The duplicate Downloads copy is not a blocker.

After this focused fix and recheck, D4b can proceed on Chad's own approval: fetch only the remaining 17 bands, verify archive MD5/size/structure, retain and re-hash each extraction, write a durable checkpoint for each, then return the global §6.4 report before freezing masks/scales or building the page. No page build, merge or deployment is cleared here.
