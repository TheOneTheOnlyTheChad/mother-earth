# Moon height release candidate — GPT review

26 November 2026, South Africa. Supplied candidate: `moon-height-rc` at **`afb42d5`**, release payload `83f7c32`, Animals maintenance `bb001b9` and `b468034`. Reviewed local copy: `/Users/chadobie/Documents/Mother Earth/_review/moon-height-rc/tree/`. Branch identity is the supplied identity, not an independent remote Git query.

## Verdict

**PASS for release content at the supplied candidate `afb42d5`.** The preview's resource-cleanup finding is closed. The source records, narrow Sources addition, numerical assets and refreshed served manifest are acceptable. No blocking finding remains from this review. Chad's explicit approval naming the final candidate is still required before merge/publication. This review does not perform or report a deployment.

Chad's acceptance of the 2,578,646-byte optional asset download and additional polar-cap draw is recorded in the candidate packet. Diviner, Sky Moon, current LRO prediction and hub/collector changes remain outside the release.

## Independent verification this round

- Read the final packet, loader changes, new Sources section, REGISTER entry, new cleanup/failure tests, Animals pin and stripping logic, and served-manifest implementation.
- Ran `node phase1/moonsci/served_manifest.mjs --check`: **42 files match the review tree** (35 root HTML/JS/CSS files plus seven named assets). This is the declared comparison scope, not every data asset on the site.
- Ran `node --check moonsci.js`: passed.
- Compared 19 retained paths byte-for-byte against the preserved `2ac103e` preview tree: `moonglobe.js`, `moonsci.css`, the build script, both height data assets and SOURCE.json, Tides page/model/code/styles, craft and Sun code, index, shared style, hub worker, and both historical Tides manifests. All unchanged.
- Independently stripped exactly the Moon-height Sources section and shortcut from the candidate and compared with the preview Sources file: identical. The preceding Tides records are preserved.
- Confirmed the filed preview review is byte-identical to GPT's retained review.
- Exercised the actual final `moonsci.js` in an independent Node VM harness, using stub DOM/network/image objects with the real grid/PNG assets, SHA-256 and gzip decoding. **Nine scenarios passed:** success and cached toggles; cancellation after texture decode; late reply despite abort; grid failure after texture decode; texture failure aborting grid; grid failure aborting texture; corrupt texture; image-decode failure; timeout. Failed/cancelled attempts left zero live object URLs and invoked no view-changing hooks. Successful cached toggles retained exactly one URL. This is a logic/unit check, not a browser or rendering measurement. The harness shortened the timeout to exercise the branch quickly.

## Why the cleanup finding is closed

The attempt now owns both acquisition promises. The first rejection records its cause and aborts the shared controller. `Promise.allSettled` gathers both results before deciding whether the texture URL becomes the cache or must be revoked. An obsolete token also drops the attempt's new URL. Successful cached URLs remain owned and usable. `loadTex` retains its own cleanup for decoding/dimension failures. The focused suite additions cover both file families and include negative controls for missing sibling abort and missing revocation.

The numerical conversion, source period, reference sphere and polar exclusion are unchanged from the independently checked preview. The visual evidence remains stated at its actual scope; the optional synthetic colour control was not added and is not a release blocker.

## Limits and release procedure

Claude reports 110/0 height, 292/0 Animals and the listed affected regression suites passing on the final page tree, with 12 height and two new Animals breaks caught. I inspected the code and records; I did not independently rerun those browser suites, Git-history checks or the numpy/Pillow build. The Mac mirror is not a normal checkout and the suites reference Claude's workspace dependencies.

The earlier preview received an independent rendered desktop-browser interaction check. This final round checked its changes through inspection, file comparisons and the independent loader harness; no new browser rendering/performance test was performed. Real phone, Safari, screen reader and verified hardware-renderer tests remain unverified. These are disclosed limits, not newly invented production gates.

After Chad's exact approval: reconcile any later main changes without broadening scope; if executable or served bytes change, return the changed candidate for review. Publish page only, with no hub deployment. Compare the 42 live files against this reviewed manifest, not a regenerated post-merge baseline, then record the merge and served result. Keep the historical Tides manifests unchanged. A GitHub Pages push/merge is a production action.

Suggested owner approval text:

> Approve: release Moon height from `moon-height-rc` at `afb42d5` to main, page only; no hub deployment. Run the 42-file served verification against the reviewed Moon height manifest and record the result.
