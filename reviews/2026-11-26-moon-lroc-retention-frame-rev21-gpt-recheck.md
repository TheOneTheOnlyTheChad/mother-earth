# Mother Earth — LROC retention/frame closure and proposal rev 2.1 recheck

26 November 2026 · GPT independent reviewer · supplied main `1f34163`

Reviewed the Mac closure report, revised proposal, checkpoints, source-check code/output and actual retained inputs.

## Verdict

**PASS. Source-retention and frame prerequisites are closed.** Proposal rev 2.1 is technically clear for a page-only LROC branch preview on Chad's build go. No merge, deployment, hub change or new bulk acquisition is cleared here.

The corrected 2 m image offset is supported by the retained file itself, not an inference from the improved landmark match. Earlier 2 m pixel results must remain marked superseded; the 0.5 m source/crop remains unchanged.

## Independent verification

### Retained files

Independently re-read all **eight** retained inputs and matched every byte count and SHA-256 to the retention checkpoints. Independently computed the retained 2 m file's MD5 and matched the archive label (`187f3d1dac32aff7f00c512ec4907cdf`). Also checked the recorded PDF MD5. The range remains verified by its range SHA and recorded provenance, not by a computed whole-file MD5.

### Header and offset

Read the actual 2 m attached header: `RECORD_BYTES = 4222`, `LABEL_RECORDS = 2`, `^IMAGE = 3`, `LINES = 13978`, `LINE_SAMPLES = 2111`. Therefore the image begins at **(3−1)×4222 = 8444 bytes**. The complete-file size reconciles exactly:

`8444 + 13978 × 2111 × 2 = 59023560 bytes`.

The erroneous 4,222-byte PDS4 offset begins one full image row early and includes part of the attached header. Preserve the original PDS4 label and record the justified PDS3 interpretation in SOURCE; do not silently rewrite archive metadata.

### Independent raw-pixel recomputation

Used separate Python standard-library code (`array`, `struct`, `hashlib`, integer arithmetic), not Claude's numpy implementation, against the retained files:

- Correct 2 m census: **28,560,833 valid samples**, **946,725 missing samples**, valid range **DN 4–502**. All four saturation-code counts are zero.
- Correct area-window SHA-256: **`4cd6d42d1286901a1091636fc3c7792f62a3668bffbd4cb0d1a3b8aedd74138f`**.
- Correct 2×2 valid-count histogram n=0…4: **30,579 / 10 / 1,999 / 10 / 1,022,402**. The accepted n≥2 policy masks **30,589** output blocks and retains **2,009** partial blocks.
- Independently reproduced the unique 2 m local maximum: **DN 268**, **+0.924 m east / +0.210 m north**, distance **0.948 m** from the published position.
- Rebuilt the 0.5 m site crop and matched its previous SHA-256 **`18a0603b34a01b36403af17750cf5483fe3753a3fc89a42832b9aa71d16e1fd8`**. Its unique local maximum remains DN 446 at **−0.326 m east / +0.460 m north**, distance **0.564 m**.

These are local landmark-consistency results. They do not establish sub-metre absolute positional accuracy or whole-strip registration. I did not independently recompute the shadow search or rerun Claude's numpy suite; the checks above provide a separate implementation of the material corrected quantities.

### Specification and pixel convention

Read text directly from the retained **LROC RDR SIS version 1.6, 22 August 2020**, including title/version, product table, §§5.3–5.5 and the §6.4 label note. The PDF matches retained SHA-256 `f8f091ba3d5e7fc65f0a2403ab6e00b90cc14a5dce7a912cec0bab013f92cfff`.

The actual §5.5 confirms mean Earth/polar axis coordinates, planetocentric latitude and east-positive longitude; the following page names DE421 and associated Euler angles. The §6.4 note on page 34 defines the upper-left pixel centre as line/sample (1,1), with offsets to the projection origin. I separately read that note in the retained 2 m header. This closes the missing frame read and the previously provisional pixel-centre convention. Bounding-coordinate residuals remain consistency checks, not a competing pixel-centre definition.

Source PDF: `/Users/chadobie/Documents/Mother Earth/_source-data/moon-lro-science-lroc/RDRSIS.PDF`.

## Build carry-forward

1. Build only from retained, hash-checked sources. Derive and validate the binary layout from the attached headers, require exact file/array-length reconciliation, and explicitly record PDS4 conflicts. Add a wrong-4,222-byte-offset control that fails on the resulting source/crop census or hash. It must not be accepted merely because the image still resembles lunar terrain.
2. Use the corrected rev 2.1 area hash/census/histogram in the builder and tests. Rev 2 browser outputs are historical evidence of the diagnosed error, not current expected values. Avoid carrying the unused `HDR=4222` constant from the reference script into the builder.
3. Preserve the accepted D1–D6 choices, n≥2 masked downsampling, special-code stop-for-review, grayscale JPEG/stretch/version provenance, lossless categorical mask, independent overlay geometry and explicit native pixel spacing versus screen resolution.
4. Preserve the reviewed Earth-camera, lighting/science-layer and dated-LRO boundaries. Verify locator occlusion/click-through, lazy-load/failure/retry/off/late-result behaviour, keyboard and narrow layouts, and actual rendering cost in the preview. No need to reacquire the source files for ordinary tests.
5. Return the exact preview commit, source/build hashes, meaningful numerical and malformed-input checks, applied behavioural mutation results and preview evidence for GPT review. Keep device/browser/renderer limits explicit.

No remaining proposal/source-closure hold found. Sources/REGISTER/final served-manifest release work and an exact-commit release approval remain later steps. The full Moon checklist remains active beyond this regional-imagery item.

Suggested owner go:

> Go for the page-only `moon-lroc-ui` branch preview under proposal rev 2.1 and GPT's closure notes. Use the retained inputs and corrected 8,444-byte 2 m offset, preserve the existing Moon features, and return the exact preview commit and evidence for GPT review. No merge or deployment.
