# Mother Earth — Sky zoom-out Moon picture release review

27 November 2026 · GPT independent review for Chad and Claude

**PASS for Chad's release approval: `moon-sky-texture-ui` at `1280c0d`.** No blocking finding remains. This verdict does not itself authorize merge or deployment.

## Candidate and independent checks

Claude identifies the frozen tested tree as `4c8aecd` and final head `1280c0d` as that tree plus packet/records only. Payload baseline SK_MAIN is `bc0afd0`. Main `018102c` is reported as an ancestor and the docs branch `45cc94d` as contained. Confirm these relationships again before release if main has moved.

I reviewed the supplied Mac copy `_review/moon-sky-texture-release-rc/`, code and RC diff, Sources and REGISTER, manifest, Animals maintenance and test evidence. This verifies supplied contents; remote Git ancestry and the docs-only final-head delta are supported by Claude's records rather than a fresh independent GitHub history read.

- All **33** review-file checksum entries match.
- All **51** served-file manifest entries match the candidate files, with unchanged files read from the project mirror.
- Against the reviewed LROC manifest: **one added** path, `assets/moon/moon-light-2026-06-R1.json`; **three changed** paths, `index.html`, `skyscene.js`, `sources.html`; **none removed**.
- The release candidate's skyscene.js is byte-identical to the passed R1 preview. Its index.html is also unchanged from the reviewed preview. The eight independently reproduced R1 failure cases and their passing recheck therefore remain applicable.

**Reviewed manifest:** `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json`

**SHA-256:** `15e96c5201faa1e2ed3b94c3ee1ad4cb90c09ad41f50e0ee865ebd984a03de8a`

Scope: page only. No hub, Worker, collector, R2 or new science-data acquisition step.

## Release additions

Sources accurately distinguishes the evenly lit appearance map from current/historical illumination, describes an approximate calculated orientation and reports reference agreement rather than accuracy. The small size is limited to the measured Earth-and-Moon-stop examples, and the far-side and grey fallback explanations are appropriate. The optional asset requests are documented separately from the required scene request.

Both REGISTER extensions remain within Chad's release-candidate authorization: reuse of the unchanged NASA picture in Sky, and the unchanged Moon-light table for orientation only, never lighting. They record the shared URL/pins, entry-only loading, fit and limits without claiming new observations.

Animals maintenance pins the changed page files to the reviewed payload while preserving the previous baseline chain and the unchanged moonlight.js check. All six tampering controls are caught at the intended check. The first shallow-history run is not counted as a passing result; its full-history rerun on the same frozen tree is retained and passes 300/0.

## Validation assessment

I inspected the supplied logs rather than independently rerunning the full browser suites. The final-tree evidence includes texture 197/0, Sky 351/0, 79/0 and 77/0, Animals 300/0, night lights 152/0, Tides navigation 2,882/0, overflow 286/0 and Moon temperature 178/0. The earlier feature mutation evidence remains applicable to the unchanged page code.

The smoke-fixes candidate and main-control logs have the same ten fire-cell assertion failures and the same harness timeout at line 109 (11 FAIL lines including the harness failure), with no completed suite summary. This is an **unresolved baseline exception**, not a passing suite and not evidence of a new Sky texture regression. The time-of-day explanation is a hypothesis only. Keep the exception recorded; it does not block this bounded release.

The broader Moon suites need not be repeated for unchanged Moon-tab code. The existing mobile preview result is historical evidence, not a new release-candidate run. Real phone, Safari, screen reader and hardware renderer remain unverified. GPU allocation is estimated; heap and image-code brightness figures retain their earlier limited scope.

## Owner approval and release follow-through

Suggested line for Chad to send himself:

> Approve: release the Sky zoom-out Moon picture from moon-sky-texture-ui at 1280c0d to main, page only; no hub deployment.

After approval:

1. Recheck main and ensure the merged served bytes remain the reviewed bytes. If main moved, assess that change instead of assuming a fast-forward is still possible.
2. Check **all 51 live served paths against the reviewed manifest above** after Pages publishes. Build the expected list directly from that file and record its hash; never rebaseline from production or a later working tree.
3. Important implementation detail: the supplied helper's `--pane` branch still embeds its locally computed `files` array rather than reading the stored manifest. Either construct the live check directly from the reviewed JSON, as Claude did for LROC, or verify the embedded list exactly equals that reviewed JSON. A comment or packet promise alone does not change the helper's behaviour.
4. Perform one bounded live check: open Sky zoom-out, confirm the texture is placed and the explanation is correct, use the Earth-and-Moon stop, and return with Back. Record this separately from hash verification and performance claims. Do not infer failure solely from a background tab receiving no frames.
5. Update release records, checklist, STATUS, HANDOVER and relevant entry pointers; sync preserve-first. After successful release verification, remove only the completed `moon-sky-texture-ui` and contained `moon-sky-texture-docs` branches and archive their review copies. Leave other workstreams' branches alone.

Item **10a closes after release verification**. Continue the remaining Moon checklist items individually; Sun/Parker still waits for Moon close-out. No broad smoke run or queued feature is implied by this approval recommendation.
