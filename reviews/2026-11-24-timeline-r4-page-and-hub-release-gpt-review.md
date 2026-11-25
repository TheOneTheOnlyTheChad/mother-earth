# Timeline R4 page and hub 0.6.25 — independent release review

24 Nov 2026 · GPT · reviewer for Chad

## Verdicts

**Page candidate: PASS** at `9b83b5c`, tested tree `f464fa8`, page commit H `643bb9a7e9c63045dec3eac87837212f05841a3f`.

**Hub candidate: PASS** at `0235545`, code `e03b001` plus `dd4a390`.

These are technical review passes. No upload, deploy, merge, production setting change or release approval was performed. Chad's separate approval lines remain required. Earth from Space Stage D remains uncleared.

Both candidates are based on main `72ea123`. My fresh fetch during review found main at `0b1993e`; its only difference from that base is `STATUS.md`. This does not replace the execution-time fresh-main and live-hub preflight.

## Identities independently checked

| Item | Bytes | SHA256 |
|---|---:|---|
| R4 catalogue | 48,134 | `74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca` |
| timeline.html | 73,210 | `95ad7f82dd32f286ade090fb735bbd7134125e06d7a44ac85a257ef75e9b27dd` |
| timeline.js | 76,861 | `10ac42f49edecca40e74db871e3f094969db486e6aaa7f654978b5bbcc45ceec` |
| style.css | 87,531 | `a386302f4206c47efb4ce41401c268df40942e2cf9ddeef295f0b6a6bb899d71` |
| Hub 0.6.25 worker.js | 551,780 | `d54323183ebd49acb1818b2cb68dc31a56e95c6ddc2fc8635303311837e9e24d` |

The page and hub evidence manifests verified: 94 and 111 entries respectively, with no mismatch. Nature's `app.js`, `index.html` and `sources.html` match the base byte for byte. Animals changes only `TL_MAIN` to H; `BASE_MAIN`, `NC_MAIN` and its parent stay unchanged.

## Page packet §9 — answers separately

**1. Both late fixes are accepted in this candidate.** The numeric tolerance is limited to the rounding error of the stored window ends. It does not turn a 50,000-year view into a materially different scale. I independently zoomed the actual R4 page at deep time down to a displayed 50,001-year span, saw Zoom in disabled, and reloaded: the same window survived. The one-year display difference is an honest consequence of rounding.

The stacking fix is scoped to the Timeline finds lane. I independently opened the whole-Earth extinction cluster, checked that both entry links and “Zoom to these” were topmost at their centres, and clicked the button successfully. The missed overlap in the earlier rehearsal is a real review gap, now corrected; the earlier pass should not be rewritten as having covered it.

**2. The seven suite migrations are accepted, with the stated coverage boundary.** They update release identity, release history, populated lanes, source fixtures and navigation expectations for R4. They do not silently discard the former R3 evidence. The new Animals pin is narrow and points to the reviewed page commit.

The travel suite now tests the candidate script and stylesheet on a generated schema-3/R3 page. Its unchanged expectations protect backward compatibility; its 209 checks must not be described as a full R4 travel run. The R4 page is covered by the other release suites, while the dedicated finds suite exercises the schema-4 rehearsal whose claims match the release. Together with the targeted actual-R4 browser checks in this review, that disclosed boundary is acceptable for this release. No further migration of the whole travel matrix is a release condition. Keep its schema-3 scope visible in records and future maintenance.

**3. Final wording is accepted.** The change record describes four dated finds rather than group lifespans. The coverage statement distinguishes unreviewed finds and unverified full text from absence. The lane warns that temporal overlap does not establish shared place or contact.

**4. The freeze record is sufficient for this release.** It identifies the catalogue, selected result per find, notation and numerical interpretation, source locators, Omo correction, La Ferrassie qualification, rights basis and source-status checks. The quarterly and pre-revision notice checks are recorded. These source decisions carry forward the accepted source review; I did not repeat a new full-paper review today.

The four accepted finds remain bounded: deposit/layer brackets for Dinaledi and Xiahe 2, an older-than limit tied to the dated eruption for Omo I, and the directly dated La Ferrassie fragment. The later model for the child is qualified context, not the fragment's plotted date. Author enquiries and excluded finds do not block these four.

**5. No additional technical hold before the approval sequence.** The final combined tree and execution preflight still have to be prepared and checked as below. The candidate's date remains a release constraint.

## Hub packet §8 — answers separately

**1. The production diff is exactly the version, additive R4 pin and discovery-current marker.** I independently reversed those three changes and recovered the recorded deployed 0.6.24 bytes exactly: 551,400 bytes, SHA256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`. No route, collector, scheduler or health implementation changed. The legacy unversioned Timeline route remains R1. The version's expected reporting/User-Agent changes are intentional consequences, not new collection behaviour.

**2. The order is accepted:** catalogue upload and exact read-back; approved hub deploy and account/served read-back; hub landing with the deployed record; then the page release. R1–R3 must continue to return their exact bytes. An uploaded catalogue is not permission to deploy the hub, and a deployed hub is not permission to publish the page.

**3. The Timeline thread may own this bounded hub release.** Chad explicitly chose to finish Timeline end to end. Main must remain aligned with the actual deployed hub, and the existing deploy rule still applies. Do not involve a second implementation thread or let Space tests change the hub concurrently.

## Independent verification and limits

I fetched the candidate Git objects, extracted separate scratch trees and reproduced:

| Check | Independent result |
|---|---:|
| timeline-finds-build | 80 passed, 0 failed |
| timeline-story-build | 99 passed, 0 failed |
| timeline-changes-build | 49 passed, 0 failed |
| timeline-catalogue-hub on hub candidate | 75 passed, 0 failed |
| hub-alignment on hub candidate | 6 passed, 0 failed; explicitly candidate, not deployed |
| Seven catalogue-hub deliberate breaks | All seven exited failing, with actual failed assertions |

The finds build independently confirmed fresh release generation, R3 reproduction from frozen sources, R3 preservation, release/rehearsal claim equality, selected-result controls and clock independence.

I also used my in-app browser against the actual committed R4 HTML, CSS and catalogue. The only script substitution was the hub constant, pointing to an isolated localhost server; the local server supplied the exact R4 JSON. No Worker, R2 or public-page change was made. I checked the late fixes above, the 400,000-year view, four find rows, and Omo I opening at a 390 × 844 viewport. Back returned to the same 400,000-year view and restored the Omo link's focus; Forward reopened its entry. No captured browser console errors were reported. The viewport override was reset and my server stopped.

I did not independently rerun Claude's full browser matrix, Animals/Nature suites or all historical break runners. Their reported results remain Claude's evidence. In particular, the older generic health and FIRMS break runners have incomplete catches on baseline and candidate alike; this review does not close those maintenance gaps. The unchanged Worker implementation and independently reproduced pin tests make them nonblocking for this bounded pin release. Keep them recorded, rather than calling every historical break caught.

Real phone, Safari, screen reader, true 200% zoom and physical wheel/trackpad coverage remain open. A 390-pixel browser viewport does not close a real-device check. I did not independently reread the Cloudflare account's current deployment/settings during this review; that remains an execution preflight.

## Concrete next steps for Claude and Chad

1. File this review unchanged, then state the reviewed catalogue bytes final and provide the exact upload approval line. Keep the catalogue date **25 Nov 2026** unless Chad chooses a rebuild before upload. Do not infer his date decision from this pass. For UTC-dated release records, 25 Nov starts at **02:00 SAST**.
2. After Chad's upload line, upload only the identified object and read back its exact size/hash. Do not overwrite a previously released object with different bytes.
3. Before requesting the hub approval line, finish the fresh-main/live-hub preflight and prepare the concrete final deploy commit. Confirm the account still runs the expected base and preserve bindings, four crons and Earthview manual/no-window settings. Any production-code difference beyond the reviewed diff returns to review. Deploy only on Chad's hub line, then verify exact code and catalogue responses and land the deployed record.
4. Prepare the page's final combined tree on fresh main, preserving the landed deployed hub, Nature files and NC pin. Run the release-critical checks and affected suites on that tree **before requesting Chad's page approval**. If only reviewed bytes and document merges remain, a new broad design review is unnecessary; disclose changed hashes or failures. Publish on the agreed catalogue day, then check served hashes, find navigation, the existing story/image and browser errors.
5. Close out after live verification: record actual merge/deploy identities and any remaining device limits, sync preserve-first, and remove only the completed Timeline branches after confirming their work is retained. No cleanup of other owners' branches is authorised by this review.

Chad's standing policy also remains explicit: dated, modelled products may be used when clearly labelled with their period/version and method, reviewed on their own merits and periodically checked for updates. Record this in Claude's retained project memory. It is not permission to describe modelled historical values as live observations, nor blanket clearance for the soil feature.
