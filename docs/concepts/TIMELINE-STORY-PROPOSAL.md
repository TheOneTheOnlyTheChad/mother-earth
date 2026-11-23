# Timeline — one developed event: the end-Cretaceous story (image, readable opening, detail)

**Rev 1, 23 Nov 2026 10:40 UTC (clock reading). Docs only.** Written by Claude (Timeline feature thread) on Chad's own line of 23 Nov: "Go: write the docs-only proposal for one developed end-Cretaceous event, incorporating GPT's points. Include proposed source and image checks, the local preview approach and any licence decisions. No build or release yet." GPT's points are the four it gave Chad the same day (relayed by Chad): a visual identity for each event, a readable opening before the detail, context between the extinctions, then human relatives; and its recommendation to develop one event first. **Nothing here is researched, built, stored or approved. No source or image has been opened for this proposal.** Every later step needs Chad's own go; anything live needs his own Approve line.

This is the first slice of stage 2 in `docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md` rev 2.1. Stage 1 (the explorer) is live since merge `03aff0a`.

## 1. What the reader gets
Opening the end-Cretaceous story shows, in this order:
1. **One image** of something that exists and was photographed or measured, with a caption that says what it is, where, who made it and under what licence.
2. **An opening of three to five sentences**: what the evidence shows and when, in plain words.
3. **The detail**, as today's groups, closed by default: what was dated, the chart reference, what is debated or not shown, review and changes.
4. **Citations** one short link beside each sentence or claim; the full citation opens on request. A correction, retraction or disagreement is never behind a closed control.

With no image available the story is complete and laid out for that case: no empty frame, no placeholder picture.

## 2. Scope
**In:** the end-Cretaceous entry only; schema 3 as far as this entry needs it; the image pipeline; the story layout for all entries (the other four keep their present content and get no image and no opening until their own slice); a local preview.
**Out, each a later slice with its own proposal:** openings and images for the other four; context entries on the "Earth systems and life" lane; human relatives; review-due and overdue states; older chart bands; the ICS release comparison; the keeping-current mechanism.

## 3. What the entry holds today (catalogue `tl-2026-11-R2`, read by Claude)
- Impact age 66.02 Ma, uncertainty not stated in the passage (Wilf et al. 2023, Introduction).
- Extinction placed at the dated impact; the source says high-precision dating established synchrony (O'Connor et al. 2024, Introduction).
- Context: "Causes are not shown in this release."
- ICS chart boundary 66.00 Ma, shown beside the source value.
So an opening needs new claims. The two cited sources may already carry some of them; nothing is assumed until the passages are read.

## 4. Data: schema 3 (only what this slice needs)
- **`opening`** on an entry: an ordered list of sentences. Each is `{ text, supports: [claim ids], voice }`, where `voice` is `source` (the source states it, attributed in the sentence) or `ours` (our own plain description of what the entry shows, such as "this entry gives two timing claims"). **The generator refuses a sentence with no supporting claim, a supporting claim with no source and locator, and a `source` sentence that does not name whose statement it is.**
- **Stable claim ids.** Claims are addressed by position today (`-c0`, `-c1`). New claims would shift them. Each claim gets its own id; the existing element ids are kept for the existing claims.
- **New claim types**, each with a fixed label like the present ones. Proposed: `cause_as_stated` (a cause, in the source's words and attributed), `disagreement` (two or more sources or readings that differ, each with its own citation, never averaged), `evidence_described` (what a rock layer, specimen or site is, as its source describes it). Final names in the build brief.
- **`image`** on an entry: `file, sha256, bytes, pixels, kind (photograph | measured_image | reconstruction), alt, caption, supports [claim ids for what the caption asserts], creator, credit, licence, licence_url, source_page, retrieved_utc, modifications`. The generator checks the file's hash and size and refuses an image whose caption asserts something no claim supports.
- **Change records:** a new kind for "account and image added", with the earlier wording kept ("Causes are not shown in this release" stays visible in What changed).
- **Dates:** a new `release_date`; `evidence_reviewed` for this entry moves only if this slice is an entry-wide review, which it is intended to be.
- The page and catalogue move together as always: `timeline.js` validates schema 3 and refuses anything else.

## 5. The source check for the opening (proposed; research step, own go)
It follows START-HERE §4t: private inbox item → evidence record → frozen review snapshot → GPT reviews the snapshot → Chad's branch-build line naming the snapshot's sha256.
1. **Candidate sentences first, as questions.** What happened and when; how the timing is known; what the sources state as cause; what is debated; what this entry does not show. A sentence is written only after its passage is found.
2. **Read the two cited sources again at passage level** (publisher HTML, no PDF) for statements on cause, on what was lost, and on disagreement. Record locator and exact scope.
3. **Follow each to its origin where it matters.** Both cited passages lean on earlier dating work. The primary dating papers are identified from the reference lists and read if open; a primary date with a stated uncertainty would be a **date change**, recorded with old and new values as §4t requires, not slipped in as wording.
4. **Disagreement is looked for, not waited for.** A bounded search for a published view that differs on cause or timing: named queries, at most 20 candidates per channel, truncation stated. What is found is recorded as a `disagreement` claim or as "none found in this bounded search", never as consensus.
5. **Status of every source used:** publisher landing page read on the day, Crossref update records read, both recorded with their limits.
6. **Rights for text:** our own wording, attributed. No quotation over a few words; the licence of each source recorded.
7. **Cap:** 3 hours including the write-up, text only (the cap Chad set for the Big Five check). What is unfinished at the cap is listed as open.
**Pass rule:** every opening sentence has a passage; every cause is attributed; any disagreement found is in the entry; no sentence says more than its passage.

## 6. The image check (proposed; research step, same go)
**Where to look, in this order.** (a) Figures in the two sources already cited, both recorded as CC BY 4.0: a figure of a specimen, section or site, if the figure's own credit line does not name a third party. (b) Public agency collections whose pages state the image is in the public domain or openly licensed. (c) Museum and university collections with an open licence stated on the item's page. (d) Wikimedia Commons, as a finding aid and, where the file's own licence allows, a source. **Preferred subjects:** the boundary layer in rock at a named locality; a named specimen from just below or above it; a measured image of the crater region.
**For each candidate, one row in the evidence record:**
1. what it shows, **as its source says** (locality, formation, specimen or dataset id, holding institution), not our reading of the picture;
2. creator and date; the item's own page address;
3. the licence, read on that page, the operative sentence copied with the date (REGISTER discipline: a licence reading is filed as whose reading it is);
4. third-party content inside it (a figure reusing someone else's photograph; a museum label; a person);
5. the original file's address, bytes, pixels and sha256, and whether we serve it unchanged or resized (a resize is a stated modification);
6. the caption we would write, and the claim that supports each thing it asserts;
7. a stable public identifier for the place, specimen or dataset where one exists (Wikidata preferred; none guessed);
8. `kind`: photograph, measured image, or reconstruction.
**Refused outright:** anything with no stated licence; non-commercial-only and no-derivatives licences (§8 L3); stock or generic catastrophe pictures; an image whose subject cannot be tied to the event by a source.
**Outcome may be "no image passes".** Then the story ships without one and the record says what was looked at.

## 7. Layout and behaviour
- **Story panel:** image at the top at a fixed aspect ratio with its size set in the markup (no jump when it loads); caption directly under it, credit and licence in the caption, not in a tooltip. Then the title and date line, the opening at reading size, then the detail groups as closed expanders using the page's existing expander pattern. "Review and changes" stays open if the entry has a correction or a change in the current release.
- **Explorer:** the mark for an entry with an image is unchanged. No thumbnails on the axis in this slice (they would compete with the marks for the same space; a later decision).
- **Without JavaScript and in List mode:** image, caption, opening and every claim are in the generated page, in the same order.
- **Requests:** the image is fetched from our own Pages origin when the story is first opened (lazy), and never on pan or zoom. The stage 1 check "no request on selection" becomes "no request to any other origin; at most one image request, from our origin, on first open".
- **Size:** one file, at most 200 KB, with a second smaller rendition for narrow screens if the original allows; the measured transfer is reported.
- **Accessibility:** alt text says what the image shows in one sentence; the caption carries the provenance; reading order image → caption → heading is tested with headings and landmarks, and reported as tested in Chromium only.

## 8. Decisions for Chad
- **S1 Causes.** May the opening state a cause, as the source's attributed statement, with any disagreement found shown beside it? *Recommended: yes.* The Constitution's rule is that nothing implies a cause without saying so; an attributed statement with its evidence says so. The alternative is an opening that stops at timing.
- **S2 Reconstructions.** *Recommended: none in this slice.* The Constitution: nothing is shown that was not observed, and what is modelled says so. A photograph or a measured image only. If a later slice wants a reconstruction it would carry `kind: reconstruction`, the word "Reconstruction" in the caption's first position, and its own decision.
- **S3 Where images live.** *Recommended: in the public repository under `assets/timeline/`, each with a `SOURCE.json`, as the Moon texture is.* That makes every image a public redistribution, so the licence must allow it.
- **L1 Public domain, CC0, CC BY:** accept. Attribution in the caption and on the Sources page; REGISTER entry before release.
- **L2 CC BY-SA (share-alike):** *recommended: accept case by case, served unchanged or with the change stated and the same licence shown.* Share-alike binds the image and versions of it; whether it reaches further is a legal question this proposal does not answer. If Chad prefers a clean line, the alternative is "no share-alike", which will rule out much of Wikimedia Commons.
- **L3 Non-commercial-only and no-derivatives:** *recommended: refuse.* No-derivatives forbids a resize or crop; non-commercial-only would have to be re-decided if the project's standing ever changes, and every source's commercial standing is recorded in REGISTER.
- **L4 An image that needs permission** (a museum that asks to be contacted): that is a provider message, so it is Chad's to send, once, with no follow-up. *Recommended: skip such images in this slice.*
- **S4 Cap** for the source and image check: 3 hours including write-up. *Suggested.*

## 9. Local preview: judging it before any hub step
The page draws the explorer only from a catalogue whose sha256 equals the one written into the page, fetched from the hub. A new catalogue is not on the hub until an R2 upload and a deploy, and those are release steps. So the preview stands in for the hub locally:
- **A rehearsal revision**, id `tl-2026-11-T1` (T = rehearsal, never published, the Sky card's convention), built by the real generator from draft sources into a scratch folder with `--src` and `--page`. Nothing generated for the rehearsal is committed.
- **A small helper**, `phase1/timeline/preview.mjs`: serves the scratch tree on `127.0.0.1`, answers the catalogue route with the rehearsal bytes, and serves `timeline.js` with one line changed in the served copy only (the hub address points at the helper). The file on disk is untouched.
- Chad or GPT open `http://127.0.0.1:8897/timeline.html`. Claude does the same in the browser pane.
- **What the preview proves:** the real generator, the real page files, the real sha256 check, the story as it will look. **What it does not:** the Worker's pin check, the R2 object, cross-origin headers, the Pages origin. Those are checked on the release route as in §4t (live candidate from the Pages origin).
- A banner in the preview page says "Rehearsal `tl-2026-11-T1`: not published", so a screenshot cannot be mistaken for the live page.

## 10. The release route, when Chad likes the preview (not asked for now)
Because catalogue bytes change: a new revision id (`tl-2026-11-R3` or the month then current), R2 upload of the catalogue, a Worker pin, a hub deploy, the page merge with its images, served-hash and live checks. Each live step on its own Approve line.
**The hub is the constraint.** The live hub is 0.6.22, deployed from another thread's branch (`earth-from-space-rc`); `phase1/worker.js` on main says 0.6.19 and must never be deployed. The Timeline change to the Worker is small and additive (one entry in `TIMELINE_REVISIONS`, `TIMELINE_CURRENT`, the version), and the earlier revisions stay served. Three routes, to be agreed with the Earth from Space thread before any build that needs it:
- **H1** that thread carries the pin in its next hub version;
- **H2** this thread prepares the pin on top of that thread's live file, checked byte for byte against the deployed script, and the change is merged back into that branch;
- **H3** wait until that thread's hub is on main.
*Claude leans H2 with that thread's agreement, or H3 if its release is near.* Nothing in §9 depends on this.

## 11. Order of work
1. This proposal → GPT → Chad's decisions (§8). *Docs only.*
2. Source and image check for the end-Cretaceous entry (§5, §6), capped. *Research, own go.* Evidence record and frozen snapshot → GPT.
3. Branch build: schema 3, generator, page, suites, the preview helper; rehearsal revision only. *Own go, naming the snapshot.* Claude's pane pass before review.
4. Chad and GPT judge the preview.
5. Release route (§10). *Approve lines.*
6. Apply the treatment to the next entry, or start the context slice: Chad's choice then.

## 12. Acceptance for the branch build (step 3)
- the generator refuses, each shown by a fixture: an opening sentence with no supporting claim; a cause not attributed; an image whose hash, size or licence field is missing or wrong; a caption that asserts something unsupported; a `reconstruction` not labelled as one;
- the story without an image, with one, and with a failed image load (caption and story intact, no broken-image frame);
- no layout shift when the image arrives; no request to any other origin; at most one image request, on first open;
- JavaScript off: same content, same order; List mode complete;
- the other four entries unchanged in content, byte for byte in their claims;
- stage 1 suites pass; schema 2 catalogues are refused by the new page and schema 3 by the old one (mixed builds fail safe, as now);
- widths 360 to 1280, 200 % zoom, text spacing, reduced motion; reported as Chromium in the workspace plus Claude's pane pass, nothing more.

## 13. Questions for GPT
1. `voice: ours` sentences: acceptable in an opening if each only describes what the entry itself shows, or should the opening be source statements only?
2. Is "none found in this bounded search" an acceptable recorded outcome for the disagreement search, shown to the reader as "No differing published view was found in our search of <date>", or should nothing be said when nothing is found?
3. Figures from a CC BY article: is the figure's own credit line plus the article licence enough, or do you want the publisher's licence page read for each figure?
4. Anything in §9 you would need from the preview that it does not give.
