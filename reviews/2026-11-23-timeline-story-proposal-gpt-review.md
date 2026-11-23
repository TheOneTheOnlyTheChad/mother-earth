Timeline — one developed event, proposal rev 1 review

23 November 2026 · GPT for Chad and Claude

Verdict: sound direction; revise the bounded points below before research/build decisions. Docs-only review; no build, source enquiry, asset publication or hub operation authorised. Proposal read directly from the Mac: SHA256 3fc5a33b1a219295bf9f4e7f9fbafcc685c310e1ab1bc4b0c98ecc68b53fc9f7. No candidate scientific source or image is cleared by this review.

Answers to section 13

voice: ours is acceptable for a neutral description of what this entry presents. It is not a lower standard of scientific evidence. Distinguish an editorial description of the entry from an evidence-backed scientific paraphrase: the latter needs claim support regardless of voice. Do not require a source/locator on a purely structural description such as “This entry compares two timing claims”; that is verified against the entry itself. Prefer a short opening that describes the evidence rather than filling it with commentary about the page. All substantive factual assertions still require passage-level review.

“None found” belongs in the search record, normally not the story. An unsuccessful bounded search is not evidence that no disagreement exists. Retain queries, channels, dates, limits, inaccessible candidates and truncation. If the scope of a search is useful to disclose, put a carefully qualified account in the methods: “No additional relevant differing interpretation was identified in the sources searched on [date]”, with a link to that scope. Do not use a reassuring “no differing published view” badge or infer consensus. Include relevant, credible disagreement that materially changes the entry, not every contrary result returned by a search.

Read the selected item’s credit line and the article’s actual rights statement, following the applicable licence link. An article-wide CC BY statement can cover its original figures unless an exception/third-party credit changes that. No need to reread an identical generic publisher page for every figure: retain one dated policy/licence record per applicable version and point each figure to it. Missing or ambiguous coverage stays unresolved; no automatic provider enquiry. Distinguish the publisher, author and actual figure creator. Both existing candidate articles have publishers of their own; do not apply another publisher’s policy to them. This review checked Creative Commons guidance and one Springer Nature figure policy for the principle, not rights in an actual selected asset.

The preview is sufficient with isolation and fidelity checks added. See below: deterministic localhost-only helper, exact scoped address substitution, real validator/mismatch tests, image transfer checks and a documented final production comparison. It need not prove R2/CORS before we can judge the treatment.

Section 4 — schema 3

Accept sentence-level support links, stable claim IDs, image provenance and a new immutable revision. The validator checks structure and references; reviewers check meaning. Replace promises that it can “refuse a caption that asserts something unsupported” with: it rejects missing/unresolved support IDs and missing required evidence fields; a frozen sentence/caption-to-passage matrix is reviewed for actual entailment. A valid ID pointing at an unrelated claim is a meaningful review fixture, not something a generic schema can reliably detect. Likewise, a mechanical name check cannot certify correct attribution.

Give opening sentences stable IDs too, so change records can identify wording changes. Claim IDs are unique and immutable; preserve old -c0 etc. anchor IDs, never renumber/reuse them after deletion or reordering. Resolve support IDs explicitly within an entry or by a documented qualified ID; reject duplicates, dangling/circular references where applicable and malformed types.

Support reference material cleanly: a figure’s subject/caption may need an institutional collection record or chart reference, not always a journal passage. Specify evidence kinds and locators that make sense for each. Do not attach arbitrary scientific claims to attribution-only credit text just to satisfy validation.

Separate interpretive prose from quotation. cause_as_stated should normally be an attributed paraphrase; “in the source’s words” must not imply copying paragraphs. A cause is not established merely because an author is named. Record the actual evidence, scope and limitations. A two-source disagreement must keep each account’s support separately.

Image metadata must identify the served rendition hash, bytes, dimensions, media type and modification, plus original-file provenance in SOURCE.json. If there are two renditions, model both rather than saying “one file” with a hidden second. No absolute paths, traversal or arbitrary external image URLs in the public file field. Text renders as text, not trusted HTML.

reconstruction can exist as a future schema value, but this slice should refuse it under the agreed content policy, even if labelled. The current acceptance case “reconstruction not labelled” is too weak for a no-reconstruction slice.

Review/status or substantive disagreement affecting the opening is visible beside that opening. The four other entries may share layout, but collapse behaviour must preserve navigability and deep links to specific claims/changes. With JavaScript off, all claims remain reachable in native disclosures or expanded text.

Keep publisher status-check dates distinct from entry-wide review and release date. Moving this entry’s evidence-review date requires the intended whole-entry review, not only writing its opening. Replace “Causes are not shown” explicitly if causes are now shown; preserve it as historical wording in the change record, not contradictory current context.

Sections 5 and 6 — source and image checks

The proposed passage-first record is appropriate. Use the existing two papers as starting points, not the full search boundary or a promise of a small refresh. When a review cites earlier work for a key date/cause, inspect the original if accessible; if not, label the secondary basis and limitation rather than claiming an independent primary measurement. No forced date replacement: a better-supported source choice/date change needs its own explicit diff and review.

Name the actual channels, queries and date coverage in advance. A bounded search should include relevant later synthesis/research and correction status, not only a query designed to find an opposing view. Search “none found” and “could not inspect” are different outcomes. Age, dating method, reported losses, geographic coverage and proposed mechanisms remain separate claims; figures that merely depict a model are labelled as model outputs, not observations.

Accept the preferred image subjects, per-item provenance, third-party check and legitimate no-image outcome. A photograph of one boundary exposure illustrates that exposure; it does not independently demonstrate global loss or causal attribution. A modern crater-region view is not an image of the ancient event. Preserve scientific labels, scales and colour legends; no decorative crop that removes context. Record alt text against the same reviewed caption evidence. Public-domain assertions need item-specific basis, not “agency” as a blanket licence.

Section 8 — recommendations for Chad

Decision

Recommendation

S1 causes

Yes to a sourced, reviewed explanation, attributed as appropriate. Do not force all evidence into “authors state” phrasing or present every competing mechanism at equal weight. Material uncertainty stays visible.

S2 reconstructions

None in this slice. A later proposal can consider them separately.

S3 public assets

Yes where the selected licence permits repository redistribution; provenance and applicable asset licences stay separate from the AGPL code licence. No blanket asset approval.

L1 public domain/CC0/CC BY

Preferred, after item-specific scope, creator, attribution and other applicable rights are checked.

L2 CC BY-SA

Case by case, with the exact licence/version, modifications and intended composition explained before Chad chooses the asset. Do not claim SA necessarily covers the whole site or never extends beyond an image in every composition.

L3 NC/ND

Reasonable to skip both for this slice as a simple selection policy. Correct the legal explanation: ND restricts sharing adaptations; technical modifications do not automatically create one. Do not claim every resize or crop is forbidden, or that NC is automatically incompatible with Chad’s current personal non-commercial purpose.

L4 permission-needed image

Skip for this slice. No enquiry needed merely to finish a prototype.

S4 time cap

Three hours total across source check, image check and write-up is a reasonable new proposed cap for Chad to choose. The earlier Big Five cap does not automatically authorise this research. Unfinished evidence stays open; reduce scope or return for a decision rather than rush it.

Creative Commons BY-ND 4.0 section 2(a)(4) expressly allows necessary technical modifications without creating Adapted Material. Whether a particular creative modification is an adaptation depends on what is done and applicable law. This correction does not require choosing an ND asset.

Section 9 — local preview

Accept using the actual generator, catalogue validator and pinned bytes against a loopback helper. Add:

Helper bound to 127.0.0.1 only; serve a defined scratch root, reject traversal, expose no write/admin endpoints, and make no live Worker/R2 calls. No credentials. Explicitly list requests allowed for the preview.

The HUB substitution is an exact single expected match; fail if zero/multiple matches. Record hashes of committed code and served transformed code, and a minimal diff showing the preview-only HUB change. Preview build identity, schema, revision, fallback and hash refusal still operate normally.

The rehearsal banner and scratch content never enter production assets. A rehearsal revision must never be uploaded/pinned under an ordinary release ID. Unpublished does not mean private if draft assets are committed to a public branch; store only rights-cleared material there. Keep candidate downloads in the authorised research location until selected.

Test no-image, failed-image and rejected/mismatched catalogue states. Confirm the helper is not bypassing validation or silently substituting catalogue/image bytes.

Do not claim native loading="lazy" alone ensures zero image requests before selection. Pre-rendered hidden images can still fetch depending on layout/browser. Define a measured first-open mechanism, with complete no-JS access. Responsive srcset/resize, cache eviction or retry may fetch another rendition; define the target as one selected rendition on first open in the tested state, no pan/zoom-triggered fetches, and document exceptions. Cap total rendition bytes and retain an understandable image-failure treatment.

Fixed aspect ratio must not distort or silently crop scientific imagery; preserve native ratio or use containment. Test layout shift and story/claim/Back/focus restoration with groups collapsed and image arrival/failure.

Section 10 — hub route

Preparing and judging the local preview is independent of the hub release choice. Coordinate before preparing/deploying the live Worker patch, not before useful proposal/research/preview work.

H2 is workable with the hub owner’s agreement: use the then-current deployed Worker bytes and configuration as baseline, compare the tiny additive pin/version diff, preserve all prior revision pins and Earth from Space gates/windows, run relevant Worker regressions and record rollback. If the hub changes again, reconcile and recheck the final patch; do not simply deploy today’s 0.6.22 later. H1 is equally valid if its owner carries the change; H3 is an optional wait, not a technical dependency on main being tidy.

For the same-origin image assets, specify release staging: assets must be available before any reader-facing page referencing them becomes current, with a deliberate candidate/live verification step. Preserve old catalogue/page pairs. Page rollback precedes any safe hub rollback, and retaining additive pins may be safer than rolling back unrelated hub work. Final build brief must state how the immutable release ID/date, asset paths and final served hashes replace the rehearsal values. No need to decide every deploy click in this concept review.

Next

Revise these bounded points, then ask Chad to choose section 8 and authorise the capped source/image research. The frozen evidence snapshot comes back for review before a branch build. No new science or image is approved now, and the Stage 1 release is not reopened.

Primary policy references checked for this review

Creative Commons BY-ND 4.0 legal code, especially section 2(a)(4): https://creativecommons.org/licenses/by-nd/4.0/legalcode

Creative Commons FAQ, adaptations, collections and format changes: https://creativecommons.org/faq/

Springer Nature, “Use of an open access figure or table”: https://support.springernature.com/en/support/solutions/articles/6000217050-use-of-an-open-access-figure-or-table

These support licence-handling principles only. The actual image and its own publisher/collection terms still need selection and review.