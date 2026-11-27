# Mother Earth — CRaTER release candidate review

27 November 2026 · GPT independent review for Chad and Claude

**PASS for Chad's release approval of tested candidate `6ed18c3` on `moon-crater-ui`.** No blocking finding remains. This verdict does not authorize merge or deployment.

Reported branch head is `cffec00`, containing the subsequent packet/time-correction records. The candidate explicitly submitted for approval is **`6ed18c3`**, not an unspecified moving branch head. Payload CR_MAIN is `4927a02`; fresh main `67a615c` was merged in `b5f46f3`. Latest reported main is `05dc479`, with docs-only records after the merge base. Reconcile current main at release; do not assume it still equals that base or that the release is a fast-forward.

## Independent file verification

Reviewed the Mac copy `_review/moon-crater-release-rc/`, its branch overlay, packet, changed paths, validation and baseline logs, manifest, Sources, REGISTER, chart diff and pin maintenance. Remote Git ancestry and the head's records-only delta are supplied by Claude's evidence rather than independently attested from GitHub history.

- All **76** review-file checksum entries match.
- All **54** served-file entries match the candidate overlay and unchanged project mirror files.
- Compared with the reviewed Sky Moon manifest: **three additions**, `mooncrater.js`, `mooncrater.css`, `assets/moon/crater/crater-good-2026-06-10-R1.json`; **two changes**, `moon.html`, `sources.html`; **none removed**.
- The production builder, data asset and chart CSS are byte-identical to the passed preview. The chart JS differs only in its validation-bound comment. moon.html adds the two expected Details links after the preview. The previous data-rebuild and all-1,441-slider-times independent checks therefore remain applicable.
- Removing the single CRaTER section and shortcut from Sources reproduces the earlier Sources page exactly. REGISTER preserves its earlier content and appends the CRaTER entry.

**Reviewed live-verification manifest:** `reviews/evidence/2026-11-27-moon-crater-manifest.json`

**SHA-256:** `85cca2ad13d5ae8aab6582dfa1677d3089f0a8c68198020561999b05d839cbaf`

## Release additions and scientific boundaries

Sources supplies the full approximate one-standard-deviation Poisson counting-benchmark qualification, conditional assumptions, non-total-uncertainty explanation and exclusions, with a Details link from the panel. UTC-record-time grouping, nominal exposure, no live-time correction, withholding, the extra 11 June bin, instrument counts rather than dose/flux/surface values, and the unexplained rise are preserved.

The time comparison is labelled as a working hypothesis and applies no correction. The chart remains a time-bin selection linked to the existing trajectory; it draws no new spacecraft position or particle footprint. The chosen count bound is now correctly described as a validation policy rather than a physical property of the counter.

The narrow Animals update retains the prior baseline chain, pins the new page/Sources changes, and checks payload scope and suite-only maintenance. All four supplied tamper controls are caught. The Diviner Sources-shortcut maintenance accommodates the new shortcut without changing the temperature section's scientific requirements.

Nonblocking records clarification for close-out: REGISTER's new bundle identifier repeats the Readme's `urn:nasa:pds:lro.crater`, whereas the retained authoritative bundle XML's logical_identifier is **`urn:nasa:pds:lro-crater`** (hyphen). The collection identifier and DOI are already correct. Use the XML identifier when updating the release records; this does not require changing served files or the reviewed manifest.

## Validation evidence and exceptions

I inspected the supplied logs and mutation evidence rather than independently rerunning the complete suite set:

- CRaTER UI **51/0**, builder **28/0**, Animals **304/0**.
- All **11** CRaTER break logs contain an applied pattern and behavioural failures; all four Animals tamper controls are caught.
- Listed Moon, craft, Sun and Sources-dependent checks pass on frozen `6ed18c3`.
- The corrected OSMC candidate/main comparison logs—not its earlier shallow-history crash—both fail the same old-page error check. Kept and UX failure lines likewise match their main controls. Timeline mixed assets shows the same 205 Animals layout differences at both widths and 16/2 result on main and candidate. These are baseline exceptions, not passing tests.
- The Tides T1a scope exception is branch-specific and not a product failure.
- Night lights' isolated rerun passes 152/0 on candidate, with 152/0 main control; the earlier loading timeout remains disclosed.
- Smoke-fixes was **not run** for this candidate; it remains a previously documented unresolved baseline failure. No cause is claimed and no fresh passing result is implied.

The Project checklist synchronization is reported complete at rev 27. Real phone, Safari, screen reader and hardware renderer remain unverified. No chart performance measurement was supplied, and none is required to turn the SVG design fact into a performance claim.

## Owner line and release follow-through

Suggested line for Chad himself:

> Approve: release the CRaTER event-count chart from moon-crater-ui at 6ed18c3 to main, page only; no hub deployment.

Claude should merge that exact reviewed candidate, preserving current main's records. Subsequent packet/review/close-out documentation can be landed as records-only changes with served bytes held to the manifest. Do not silently substitute a later feature payload for the named candidate.

After Pages publishes:

1. Verify **54/54 live paths against the reviewed manifest above**, with the expected list taken directly from that JSON, not regenerated from a later working tree or production. Retain the manifest hash with the result.
2. Perform a bounded live check: off by default/no chart request; opening loads the one file; default 12:00 selects group 72; the final slider time selects the labelled extra 11 June group; Details reaches the new section; close/reopen works and the dated drawing/path remain usable. Separate this from served-hash and performance claims.
3. Mark REGISTER live, record release/verification commits and times, close checklist item 5, update STATUS/HANDOVER and Project, sync preserve-first and archive the review copy. Delete only this completed Moon branch after successful verification. Keep raw sources and provenance.

This release closes item 5 only after live verification. Remaining Moon items, classification options and deferred device checks stay recorded. Sun/Parker still waits for Moon spec close-out. No hub, collector or new acquisition is part of this release.
