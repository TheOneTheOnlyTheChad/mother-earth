Timeline story branch — code, departures and four-state preview review

23 November 2026 · GPT for Chad and Claude · branch review, not release clearance

The observed preview works and the scientific text matches snapshot 2. Accept the schema pin, direct passage support and open detail groups for this first slice. One agreed UX requirement remains unmet: citation numbers do not open their citations. Resolve that bounded item, reconcile the review-copy version, and complete the remaining candidate checks before calling the review closed. No hub operation or merge is cleared.

Review identity and limits

The request names commits 98d88f9, d65855f, 040b029 and build record rev 3. The supplied Mac read/BUILD-RECORD.txt and reviews/2026-11-23-timeline-story-rc.md both still begin rev 2; the read index lists only the first two commits. I therefore reviewed the actual files and running preview identified below, not an independently established copy of rev 3/commit 040b029. Sync the current packet and state whether that last commit changes code or only records. This is a provenance gap, not evidence that the observed preview is defective.

Local file

Independently computed SHA256

timeline.js (58,956 B)

be6df15e671517625188825d893bf6283be8025b8e127987bff5b7169dcd79d2

style.css (82,729 B)

08af2c1e7886c0c28a67a325191fe40294cd2e9afe90e4b90f663de9d22f1ec9

phase1/timeline/build_timeline.py

b4ade6d0a80e0ca21ff2434478ae1f4d4f10803ea68aaf7feac558f01a60d584

phase1/timeline/preview.mjs

161c5a62b148e60346e075e7c5daf6aabb04af02006462d20bd390366da26f44

Read generator, page validation/hydration, helper, rehearsal data/change/provenance records and relevant build/UI tests. This was a focused review, not a fresh scientific literature review or a full re-audit of the previously reviewed explorer.

Rulings on the nine departures

#

Ruling

1 — page schema pin

Accept the approach. A page generated for schema 3 should require schema 3, while the released page/catalogue pair can continue to use schema 2. This is a cleaner compatibility contract than making every page use schema 3 immediately. Keep the hash, revision and schema checks independent; moving a test hash must not conceal a missing schema check. The two mixed-schema fixtures are relevant. As a robustness improvement, distinguish an absent legacy attribute from an explicitly unsupported/malformed schema value; the current ternary maps every value except 3 to 2. Do not claim general negotiation of future schemas.

2 — support may point at a claim or evidence item

Accept this explicit schema adjustment. Same-entry, stable, unique passage/collection-record IDs are legitimate support targets and avoid fabricating extra displayed claims. The generator's allowed target set excludes opening sentences, so this is not an unrestricted recursive support graph. The actual passage-to-sentence matrix remains the semantic proof; a valid but unrelated ID is correctly a human-review fixture. Keep target types and entry scope documented.

3 — groups left open

Accept for this first slice. Reachability, uncertainty visibility and unchanged older entries take precedence over adding disclosure mechanics now. Do not describe the candidate as having implemented collapsed detail groups. Any later collapse should preserve direct claim/change navigation, focus and no-JavaScript access. The current open treatment is long, but that is a presentation tradeoff, not a scientific defect.

4 — citation marks are inert

Not equivalent to the agreed one-action citation links. The native source disclosure works, but a reader cannot activate a particular sentence's number to reach its citation. The single-entry fragment rule is not a technical reason to omit this: use a keyboard-accessible button that opens the disclosure and focuses/scrolls to that source without adding a history entry or changing the shareable entry fragment. Restore that interaction, or obtain Chad's explicit acceptance of grouped-only citation access as a deviation. I recommend the small interaction fix. No wholesale history rewrite is requested.

5 — extra reader-facing words

Accept the source-disclosure label, NASA policy link text, abstract-only notice, added-account entry line and internal claim labels. The public change record accurately identifies the added account/image and retirement of the old line; retaining earlier sources does not deny adding new ones. Prefer the more precise “the earlier entry presented timing claims without a cause account” over “the entry gave dates only”, but this is editorial polish, not a new science hold. For image failure, I recommend “The image could not be loaded. Its caption and the account remain available.” This states interface availability without implying that the image description is independent of the source image as evidence. These short structural wordings do not need scientific citations.

6 — citations and licence wording

Accept the DOI-identifiable citations and disclosure of abstract-only readings. Missing volume/pages do not invalidate Schulte's identification, and can be completed from a recorded bibliographic source. “No open licence stated on the page read” properly states a limited observation, rather than alleging no licence exists. Do not expand that into a permission conclusion about copying the papers or figures.

7 — unchanged asset-version key

Accept for the isolated, no-store rehearsal. Before release, bump and verify the final page/script/style references and build identity together. Do not merge this preview on an assumption that a later release step already happened.

8 — earlier source and entry review dates retained

Accept retaining historical checks and not automatically advancing the whole-entry review date. The new story review is a distinct scope. Prefer a visible scoped note recording the added account/image review on 23 November, alongside the existing whole-entry date, rather than implying no new review happened. That must not silently rewrite the older timing claims or pretend every source was newly status-checked.

9 — production asset copy/comparison not built

Accept as deferred release work, not complete release readiness. A release needs deterministic asset packaging, final revision/path/hash substitutions, a served-file comparison, asset availability before referencing pages, and coordination against the then-live hub. The helper's rehearsal copy step is not that production pipeline.

Independently observed preview

Used Chad's running helper at http://127.0.0.1:8787/, Chrome extension, at desktop size and a 390×844 browser viewport. This is not a real phone, Safari or screen-reader test.

With image: opened the end-Cretaceous story from the axis. The real annotated map displayed, with readable trough and cenote labels at 390 px. Caption, rights links and opening were present. Opened the native source disclosure and observed numbered source records and abstract-only notices. All detail groups were accessible.

Phone change navigation: the entry's “account and image added” link closed the sheet and focused the public change record. Back restored the story and focused its change link; Forward returned to the change record and its focus target.

No image: story opened with no figure and its opening intact.

Image fails: the image was withdrawn, the failure line appeared, and caption/account remained accessible.

Catalogue refused: the axis-unavailable message appeared, while the entry and story remained readable as fallback content.

Reset the temporary viewport override afterwards. I did not independently measure image request counts, layout shift, every pan/zoom path, resize-driven rendition changes, slow loading, no-JavaScript operation, 200% browser zoom, text spacing or reduced motion. The workspace suite's claims for those it covers remain Claude's results. The requested accessibility checks not yet covered remain candidate work; my phone-width view does not replace them.

The image and caption currently occupy most of the first phone screen before the opening begins. This is acceptable as a first evidence-led treatment; further visual polish can consider caption presentation without removing the measurement/rendering qualifications or hiding material uncertainty.

Independent local verification

Both real image files verified, not merely accepted from Claude's measurements:

800 rendition: 81,202 B, 8886a64a79c60e6b382c1aed2a417b18f97d439f8892a13105a79140af99351e.

1024 rendition: 144,324 B, a1ab53fc7f6227e2176da674cfc943b2cae3a5e97209e7050e2d7cef390bb770.

Total 225,526 B, below the agreed 300,000 B aggregate cap.

python3 phase1/timeline/build_timeline.py --check: passes, with released R2 hash 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356.

node --check timeline.js: passes.

timeline-changes-build: 45 passed, 0 failed.

The new timeline-story-build run did not complete. Its initial generator/build, literal snapshot comparisons, actual image-byte checks, other-entry preservation and initial refusal fixtures passed. It then stopped at the over-budget-image fixture because native Python lacks Pillow (PIL). This is an environment dependency, not a demonstrated candidate assertion failure. I did not install packages or edit the suite to skip it. Do not report an independent 88/88 result from this run.

Did not rerun the Playwright UI suites or their breaks. The provided workspace results are evidence from Claude, not independent native repetitions.

Focused follow-through

Reconcile the rev 3 / 040b029 packet with the actual Mac code hashes above; identify any substantive delta for review.

Resolve point 4's citation interaction, with keyboard and Back/Forward tests and no added history entry for source disclosure. Keep the tested snapshot prose unchanged.

Carry the accepted scope/departures and small wording clarifications into the record. Complete the stated accessibility checks and candidate test evidence in an environment with its declared dependencies.

Return the bounded changes and current packet. Keep production packaging, REGISTER and the then-live hub route as later release work. Nothing in this review authorises a hub change or release.