# Timeline — one developed event: the end-Cretaceous story (image, readable opening, detail)

**Rev 2, 23 Nov 2026 10:57 UTC (clock reading). Docs only.** GPT reviewed rev 1 from the Mac copy (sha256 `3fc5a33b…fc9f7`; relayed by Chad; filed unchanged as `reviews/2026-11-23-timeline-story-proposal-gpt-review.md`). Verdict: sound direction; revise bounded points before research or build decisions; nothing authorised; no source or image cleared. Its answers and corrections are applied below and marked (GPT). **Relayed GPT text is not Chad's approval: the decisions in §8 and the go for the capped research are still Chad's to give.** Nothing is researched, built, stored or approved, and no source or image was opened for this proposal.

**Rev 1, 23 Nov 2026 10:19 UTC.** Written by Claude (Timeline feature thread) on Chad's own line: "Go: write the docs-only proposal for one developed end-Cretaceous event, incorporating GPT's points. Include proposed source and image checks, the local preview approach and any licence decisions. No build or release yet."

This is the first slice of stage 2 in `docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md` rev 2.1. Stage 1 (the explorer) is live since merge `03aff0a` and is not reopened.

## 1. What the reader gets
Opening the end-Cretaceous story shows, in this order:
1. **One image** of something that exists and was photographed or measured, at its own proportions, with a caption that says what it is, where, who made it and under what licence.
2. **An opening of three to five sentences** that describes what the evidence shows and when. It is about the evidence, not about the page (GPT).
3. **Anything that qualifies the opening, beside it:** a material uncertainty, a substantive disagreement, a correction or a status notice on a source the opening rests on is shown next to the opening, never only inside a closed group (GPT).
4. **The detail**, as today's groups: what was dated, the chart reference, context, review and changes.
5. **Citations:** one short link beside each sentence or claim; the full citation opens on request.

With no image available the story is complete and laid out for that case.

## 2. Scope
**In:** the end-Cretaceous entry only; schema 3 as far as this entry needs it; the image pipeline; the story layout for all entries (the other four keep their present content, with no image and no opening until their own slice); a local preview.
**Out, each a later slice with its own proposal:** openings and images for the other four; context entries on the "Earth systems and life" lane; human relatives; review-due and overdue states; older chart bands; the ICS release comparison; the keeping-current mechanism; reconstructions.

## 3. What the entry holds today (catalogue `tl-2026-11-R2`, read by Claude)
- Impact age 66.02 Ma, uncertainty not stated in the passage (Wilf et al. 2023, Introduction).
- Extinction placed at the dated impact; the source says high-precision dating established synchrony (O'Connor et al. 2024, Introduction).
- Context: "Causes are not shown in this release."
- ICS chart boundary 66.00 Ma, shown beside the source value.
An opening needs new claims. The two cited papers are **starting points, not the boundary of the search and not a promise that the refresh is small** (GPT).

## 4. Data: schema 3 (only what this slice needs)
**What a validator can and cannot do (GPT).** The generator and the page check structure: ids exist, are unique, resolve, and required fields are present and well-formed. **They cannot tell whether a passage actually supports a sentence.** That is a reviewer's job, done on a frozen sentence-to-passage and caption-to-evidence matrix (§5). A valid id pointing at an unrelated claim is a review fixture, not something the schema detects, and no name check certifies an attribution.

- **Ids.** Every claim and every opening sentence gets a stable id: unique within the entry, immutable, never reused or renumbered after a deletion or reordering. The existing element ids (`-c0`, `-c1`, …) are kept for the existing claims. Support references are resolved inside the entry; the generator rejects duplicates, dangling references and malformed types.
- **`opening`**: an ordered list of `{ id, text, kind, supports }`.
  - `kind: evidence`: a statement about the world. It must list supporting claim ids, whatever voice it is written in.
  - `kind: structural`: a neutral description of what this entry presents ("This entry gives two timing claims and the chart boundary"). It carries no source; it is verified against the entry itself, by the generator where countable and by review otherwise (GPT). Kept to a minimum.
- **Claim types, each with a fixed label.** Proposed additions: `cause_account` (a cause as a source gives it: an **attributed paraphrase**, never a copied paragraph, with the evidence it rests on, its scope and its limits recorded; naming an author does not establish a cause), `disagreement` (accounts that differ, **each side with its own support**, never merged), `evidence_described` (what a rock layer, specimen or site is, as its record describes it). Age, dating method, reported losses, geographic coverage and proposed mechanism stay separate claims (GPT).
- **Evidence kinds.** A claim's support is typed: `passage` (work + locator), `collection_record` (institution + record id), `chart_reference`, `dataset`. An image's subject may rest on a collection record and not on a journal passage. A credit line is attribution only and is never used as the support for a scientific claim (GPT).
- **`image`**: `kind` (photograph | measured_image; `reconstruction` is a defined value that **this slice's generator refuses even when labelled**), `alt`, `caption`, `supports`, `creator`, `credit`, `licence`, `licence_url`, `source_page`, and **`renditions`: a list, each `{ file, sha256, bytes, pixels, media_type, modification }`**. If two sizes are served, both are listed. `file` is a plain name under `assets/timeline/<revision>/`: no absolute path, no `..`, no external address. The original file's address, hash, size and retrieval time are in `SOURCE.json` beside it. All text is rendered as text, never as HTML.
- **Dates kept apart (GPT):** a source's publisher status-check date; the entry-wide `evidence_reviewed` date, which moves only if the whole entry is reviewed, not because an opening was written; the release date.
- **Change record:** a new kind for "account and image added". "Causes are not shown in this release" is **removed from the entry's current context if causes are shown** and kept as the earlier wording in What changed.
- The page and catalogue move together: `timeline.js` validates schema 3 and refuses anything else; the released page refuses schema 3.

## 5. The source check for the opening (proposed; research step, needs Chad's go)
Route as START-HERE §4t: private inbox item → evidence record → frozen review snapshot → GPT reviews the snapshot → Chad's branch-build line naming the snapshot's sha256.
1. **The search plan is written and frozen before the first request:** the channels by name, the exact queries, the date coverage, the cap per channel. It covers later synthesis and research and correction status, not only a query built to find an opposing view (GPT).
2. **Candidate sentences as questions first.** What happened and when; how the timing is known; what is given as cause and on what evidence; what is materially uncertain or disputed; what this entry does not show. A sentence is written only after its passage is found.
3. **The two cited papers again, at passage level** (publisher HTML, no PDF).
4. **Origins.** Where a review cites earlier work for a key date or cause, the original is read if it can be. If it cannot, the claim is labelled as resting on the secondary source, with that limit stated; it is not presented as an independent primary measurement. **No date is replaced as a side effect:** a better-supported date or source is its own diff, old and new side by side, with its own review (GPT).
5. **Disagreement.** Relevant, credible disagreement that materially changes the entry is included, each side with its own support. Not every contrary result is, and competing mechanisms are not presented at equal weight unless the evidence read supports that (GPT).
6. **Outcomes are recorded as what they are:** found and read; found and could not be inspected; not found in this search. The last two are different and neither is "no disagreement exists". **"None found" stays in the search record with its queries, channels, dates, limits and truncation. It is not shown in the story.** If a scope statement is ever useful to a reader it goes in the methods, worded as "No additional relevant differing interpretation was identified in the sources searched on <date>", linked to that scope. No reassurance badge, no inferred consensus (GPT).
7. **Status of every source used:** publisher landing page read on the day; Crossref update records read; both with their limits.
8. **The matrix:** each opening sentence and each caption assertion against its passage or record, with locator, exact scope, and what the passage does not say. This is the frozen file GPT reviews for entailment.
9. **Text rights:** our own wording; quotation of a few words at most.
**Pass rule:** every `evidence` sentence has a reviewed passage; every cause is attributed with its basis and limits; material uncertainty and disagreement found are in the entry and visible beside the opening; no sentence says more than its passage.

## 6. The image check (proposed; same go, same cap)
**Where to look, in this order.** (a) Figures in the sources used. (b) Institutional and agency collections. (c) Museum and university collections with an open licence stated on the item's own page. (d) Wikimedia Commons, as a finding aid and, where the file's own licence allows, a source. Candidate downloads stay in the private research folder on the Mac until one is selected; nothing unselected goes into the public repository, on any branch (GPT).
**Preferred subjects:** the boundary layer in rock at a named locality; a named specimen from just below or above it; a measured image of the crater region.
**What an image can and cannot carry (GPT).** A photograph of one boundary exposure illustrates that exposure. It does not show global loss or a cause, and the caption will not say it does. A present-day view of the crater region is not a picture of the event. A figure that depicts a model is labelled as model output. Scientific labels, scale bars and colour legends are kept; no crop that removes context.
**For each candidate, one row in the evidence record:**
1. what it shows, **as its source or collection record says** (locality, formation, specimen or dataset id, holding institution);
2. publisher, author and the **actual creator of the figure or photograph**, kept distinct; date; the item's own page address;
3. rights: **the item's own credit line, and the article's or collection's actual rights statement, following its licence link.** An article-wide CC BY statement can cover its own figures unless a credit line or exception says otherwise. One dated licence record per publisher policy version is kept and each figure points to it; each figure is still inspected for an exception. Each publisher's own policy is used for its own article. Missing or unclear coverage stays unresolved; no enquiry is sent (GPT);
4. a public-domain claim needs a basis stated for that item, not "it is from an agency" (GPT);
5. third-party content inside it;
6. the original file's address, bytes, pixels, sha256; each rendition we would serve and how it differs;
7. the caption and the alt text, each assertion in them against its evidence (in the §5 matrix);
8. a stable public identifier for the place, specimen or dataset where one exists (Wikidata preferred; none guessed);
9. `kind`.
**Not selected in this slice:** anything with no stated licence; non-commercial-only and no-derivatives licences (§8 L3); reconstructions; stock or generic catastrophe pictures; an image whose subject cannot be tied to the event by a source; anything needing a permission request.
**"No image passes" is a valid outcome.** The story then ships without one and the record says what was looked at.

## 7. Layout and behaviour
- **Story panel:** image at its **native proportions**, contained, never stretched and never cropped to a fixed frame (GPT); its box is reserved from the rendition's recorded pixel size so nothing moves when it arrives. Caption under it with credit and licence in the caption. Then the title and date line, the opening at reading size with any qualifying notice beside it, then the detail groups.
- **Detail groups** close by default **only where that keeps everything reachable:** a deep link to a claim or a change record opens its group and lands on it; Back, Forward and focus return work with groups closed, with the image present, late or failed (GPT). "Review and changes" is open when the entry has a correction or a change in the current release.
- **JavaScript off:** image, caption, opening and every claim are in the generated page, in order, in native disclosure elements or expanded text (GPT).
- **Image loading is defined by measurement, not by an attribute (GPT).** A pre-rendered hidden image can be fetched by the browser whatever `loading="lazy"` says. The build brief will state the mechanism and the test will measure it. Target, in the tested states: no image request before a story is first opened; one selected rendition on first open; none caused by pan or zoom. Known exceptions are written down (a resize that selects the other rendition; a retry after failure; cache eviction). Without JavaScript the image is an ordinary image in the page and loads as the browser decides.
- **Bytes:** a cap on the total of all renditions for an entry (proposed 300 KB), measured and reported.
- **Failure:** if the image does not load, the caption and story stand, with a plain line that the image could not be loaded; no broken-image frame.
- **Explorer:** marks unchanged; no thumbnails on the axis in this slice.

## 8. Decisions for Chad (GPT's recommendation beside each; none is decided)
- **S1 Causes.** May the story give a sourced, reviewed explanation of cause? *Claude and GPT: yes.* Attributed where attribution is what the evidence supports; not every sentence forced into "the authors state"; competing mechanisms not given equal weight by default; material uncertainty visible beside the opening.
- **S2 Reconstructions.** *Claude and GPT: none in this slice.* A later proposal can take them up.
- **S3 Where images live.** *Claude and GPT: the public repository under `assets/timeline/`, only where the selected item's licence permits redistribution.* Each asset's licence and provenance are recorded per asset and are separate from the code's AGPL licence. No blanket approval of any collection.
- **L1 Public domain, CC0, CC BY:** *preferred*, after the item's scope, creator, attribution and any other rights are checked.
- **L2 CC BY-SA:** *case by case.* Before Chad chooses such an image he is given the exact licence and version, what we would change, and how it would sit on the page. This proposal makes no claim about how far share-alike reaches in a given composition.
- **L3 Non-commercial-only and no-derivatives:** *skip both in this slice, as a simple selection rule.* **Correction to rev 1 (GPT):** rev 1 said no-derivatives forbids a resize or crop and that non-commercial-only conflicts with the project. Neither is right as stated. CC BY-ND 4.0 section 2(a)(4) allows technical modifications needed to use the material without that making an adaptation; whether a creative change is an adaptation depends on the change and the law. Non-commercial-only is not automatically incompatible with a personal, non-commercial project. The recommendation to skip them stands on simplicity, not on those claims.
- **L4 An image that needs permission:** *skip in this slice.* No enquiry is needed to finish a prototype.
- **S4 Cap:** *three hours in total across the source check, the image check and the write-up.* It is a new cap for Chad to choose; the Big Five cap does not carry over. What is unfinished at the cap stays open: the scope is cut or the question comes back to Chad. Nothing is rushed to fit.

## 9. Local preview: judging it before any hub step
The page draws the explorer only from a catalogue whose sha256 equals the one written into the page. The preview keeps that check and replaces only where the catalogue is fetched from.
- **Rehearsal revision** `tl-2026-11-T1` (T = rehearsal), built by the real generator from draft sources into a scratch folder. **A rehearsal revision is never uploaded or pinned, and never under an ordinary release id.** Nothing generated for it is committed.
- **Helper `phase1/timeline/preview.mjs`** (GPT's conditions): binds to `127.0.0.1` only; serves one defined scratch root and rejects any path that leaves it; GET only, no write or admin route; no credentials; **makes no request to the live Worker, R2 or any other host**; the requests a preview page may make are listed in its header and anything else is refused and logged.
- **The one substitution:** the hub address constant in the served copy of `timeline.js`. It must match **exactly once**; zero or several matches stop the helper. The helper prints the sha256 of the committed file and of the served copy, and the one-line diff. Build identity, schema and revision checks, the hash refusal and the list fallback all run unchanged.
- **Checks that the helper is not flattering the page:** a catalogue with one byte changed is refused by the page; a page built for another revision is refused; an image whose bytes differ from its recorded hash fails the generator; the helper serves the files on disk byte for byte (hashes compared), with no substitution of catalogue or image bytes.
- **States shown in the preview:** with the image; with no image; image failing to load; catalogue refused.
- **A banner** on the preview page: "Rehearsal `tl-2026-11-T1`: not published". The banner and all scratch content exist only in the scratch folder and cannot reach production assets.
- **Public does not mean private (GPT):** a branch is public. Only rights-cleared material is committed to it. Draft text is public once pushed.
- **What the preview proves:** the real generator, validator and page; the story as it will look. **What it does not:** the Worker's pin check, the R2 object, cross-origin headers, the Pages origin. Those are checked on the release route.
- **Before a release, a production comparison:** a written list of every value that differs between rehearsal and release (revision id, release date, asset paths, hashes, the banner, the hub address) and a check that nothing else does.

## 10. The release route, when Chad likes the preview (not asked for now)
A new catalogue revision id, an R2 upload, a Worker pin, a hub deploy, the page merge with its assets, served-hash and live checks; each live step on its own Approve line.
- **Hub coordination is needed before the live Worker patch is prepared or deployed, not before research or the preview (GPT).** The live hub is 0.6.22 from `earth-from-space-rc`; `phase1/worker.js` on main says 0.6.19 and is never deployed.
- **H1** that thread carries the pin in its next version. **H2** this thread prepares the pin on **the Worker bytes and configuration actually deployed at that time**, as a small additive diff (one table entry, `TIMELINE_CURRENT`, the version), keeping every earlier revision pin and every Earth from Space gate and window, with the Worker regressions rerun and a rollback recorded; **if the hub changes again before the deploy, the patch is rebuilt on the new bytes and rechecked.** **H3** wait for that thread's hub to reach main: an option, not a dependency. H1 and H2 both need the hub owner's agreement.
- **Order for assets (GPT):** the image files must be served and verified before any reader-facing page that refers to them becomes current. Earlier catalogue and page pairs keep working. A page rollback comes before any hub rollback, and leaving an additive pin in place may be safer than rolling back unrelated hub work.
- The build brief will state how the release id, date, asset paths and served hashes replace the rehearsal values.

## 11. Order of work
1. This proposal → GPT (done for rev 1) → Chad's decisions in §8. *Docs only.*
2. The capped source and image check (§5, §6). *Research; Chad's own go.* Evidence record, matrix, frozen snapshot → GPT.
3. Branch build: schema 3, generator, page, suites, preview helper; rehearsal revision only. *Chad's go, naming the snapshot.* Claude's own real-browser pass before review.
4. Chad and GPT judge the preview.
5. Release route (§10). *Approve lines.*
6. Next entry or the context slice: Chad's choice then.

## 12. Acceptance for the branch build (step 3)
- **generator and page refuse, each by fixture:** a duplicate, dangling or malformed id; an `evidence` sentence with no support; a claim with no evidence record; an image with a missing or wrong hash, size, media type or licence field; a `file` with a path or an external address; **any `reconstruction`, labelled or not**; markup in a text field rendered as text;
- **review fixture, not a validator test:** a sentence whose support id is valid but points at an unrelated claim. It passes the generator and must be caught by the matrix review; recorded as such;
- the story with an image, without one, with a failed load, with a late load: no layout movement, focus and Back/Forward intact, deep links to a claim and to a change record land correctly with groups closed;
- image requests **measured**: none before first open, one rendition on first open, none on pan or zoom, in the stated test states; none to any other origin; total rendition bytes under the cap;
- JavaScript off: same content, same order, everything reachable;
- the other four entries' claims byte for byte unchanged; their layout change limited to what §7 states;
- stage 1 suites pass; mixed builds fail safe (schema 2 with the new page, schema 3 with the released page);
- the preview helper's own checks in §9, including the exactly-once substitution and the refusal of other hosts;
- widths 360 to 1280, 200 % zoom, text spacing, reduced motion; reported as workspace Chromium plus Claude's pane pass, nothing more.

## 13. GPT's answers to rev 1's questions (recorded)
1. Our own voice is acceptable for a neutral description of what the entry presents and needs no source; any statement about the world needs claim support whatever its voice. Applied in §4.
2. "None found" belongs in the search record, normally not in the story. Applied in §5.6.
3. Read the item's credit line and the article's actual rights statement, following the licence link; one dated record per policy version, each figure checked for exceptions. Applied in §6.
4. The preview is sufficient with isolation and fidelity checks added. Applied in §9.
