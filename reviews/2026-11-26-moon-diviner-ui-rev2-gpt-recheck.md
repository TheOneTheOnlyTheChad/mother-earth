# Mother Earth — Moon Diviner UI rev 2 recheck

26 November 2026 · GPT independent reviewer

Supplied branch `moon-diviner-ui`, head `34368ee`; revised payload `1a842f9`, Animals maintenance `3261682`. Reviewed refreshed Mac `_review/moon-diviner-ui/` files and rev 2 packet.

## Verdict

**PASS for the revised preview. R1 is closed.** The requested scientific and wording corrections are incorporated. Recommend proceeding to release-candidate preparation on Chad's own go. No merge or deployment is cleared.

## Independent recheck of the fix

I first reran the deterministic Node-VM reproducer from my original review against the actual revised `moonsci.js`, using the real temperature payload and native crypto/decompression. After the simulated deadline and late PNG completion, the result is now: active null, pending null, zero commits, no globe/lighting calls, one URL created and one revoked. Previously this exact path committed temperature and changed lighting.

I then independently exercised four paths in a separate VM harness using the actual revised coordinator/loaders, real temperature and height files, mocked DOM/globe/image/canvas boundaries, and controlled completion callbacks:

1. Temperature entry: deadline settles pending; original view and lighting choice retained; late PNG released; retry succeeds.
2. Noon-to-midnight replacement: noon and saved lighting retained; late PNG released; retry succeeds.
3. Height entry: deadline settles pending; late decoded picture released; retry succeeds.
4. Temperature-to-height replacement: temperature and saved lighting retained; late picture released; retry succeeds.

All four passed. An additional ordinary height HTTP 404 case keeps the original error reason and leaves science mode inactive, checking the rev 2b regression fix independently.

The timer now ends the pending request through `cancel()`, which invalidates its token, aborts the request, clears pending state and synchronizes controls. A late result fails the identity gate and drops its resources. The separate aborted-result guard runs after the ordinary error path, preserving the first loader failure's reason when sibling cancellation occurs.

These are deterministic code-level tests with mocked browser boundaries, not new live-browser deadline measurements. I inspected Claude's G1–G4 tests: they hold the actual browser callback/decode stages past the real deadline and test entry, replacement, resource accounting and retry. The two new mutations distinguish the old late-commit defect from a gate-only fix that leaves pending state unresolved. Their reported 16/0, 10-failure and 6-failure results are Claude's browser evidence; I did not rerun those Playwright suites on this Mac.

## Numerical and wording checks

- Actual gzip remains `1d81cb86738d81797ad92449419d4c46a2e8ffe6233a66863dcf2e05fde611d0`; raw remains `cfaaabd8ecc9cdeb92644811f20ffd0d463cbde5073b19b49289176daaabff92`. Both re-hashed successfully. The numerical map, masks and scales are unchanged from the independently validated preview.
- SOURCE's builder SHA-256 matches the actual revised builder.
- The page now names the equivalent-blackbody/effective-radiative interpretation, qualifies the appearance picture's resolution separately from 0.5° temperature cells, labels scales as outward-rounded percentiles and shares as grid cells rather than surface area.
- The visible legend links to the page's Sources comparison, with selected-site differences and explicit unisolated causes/not-an-accuracy-estimate wording. SOURCE carries the corresponding selection and interpretation caveats. Values remain unadjusted.
- GHRM labels/record addenda distinguish local patch reflections from global flips and the T⁴ proxy from causal attribution. The site identification and earlier noon-spread claim are corrected through dated errata.
- The height mutation erratum distinguishes preview evidence from the release code where two patterns no longer matched. Keep that erratum attached to the historical records; the corrected current tests do not retroactively prove the old release's missing mutations.

No remaining preview hold found within this recheck's scope.

## Release-candidate scope

On Chad's go, prepare `sources.html#moontemp`, REGISTER, final provenance/links, refreshed served-file manifest and narrow Animals pin maintenance. Keep the frozen 70°/80° masks and 281–395 K / 70–105 K scales and the agreed controller, scientific and data-integrity boundaries. No further bulk acquisition is needed.

Run the affected suites and all applicable deliberate breaks against a stable, identified final tree. Count missing-pattern/setup failures separately from behavioural mutation failures. Carry the documented baseline-only smoke failures and Tides branch-scope exception with evidence, rather than describing every suite as unqualified green. Do not change the tested checkout during background runs.

Return the final candidate commit, packet, manifest and evidence for GPT release review before Chad's exact-commit merge/deploy approval. Real phone, Safari, screen reader and verified hardware-renderer checks remain unperformed; do not relabel them as completed.

Suggested owner line:

> Go for the Moon Diviner release candidate: Sources, REGISTER, served-file manifest, narrow Animals pins and final validation under the reviewed preview and GPT's notes. Return the exact final commit and evidence for GPT review. No merge or deployment.
