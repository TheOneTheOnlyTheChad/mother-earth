# Human relatives — proposal rev 1 review

24 November 2026 · Independent GPT review for Chad

**Outcome: direction accepted; targeted proposal revisions needed before a build proposal. No source or date is cleared for the catalogue. Nothing is authorised for implementation or release.** The bounded source check can proceed on Chad's separate go while these design points are corrected.

Reviewed proposal and source-leads file at repository commit 4bd6962, retrieved directly from TheOneTheOnlyTheChad/mother-earth. The leads correctly disclose their preliminary nature. GPT made limited primary-paper spot checks to assess semantics, not the commissioned full source/status audit.

## 1. Answers to proposal §9

| Question | Ruling |
| --- | --- |
| 1. Is dated evidence at a place the right unit? | **Yes.** Make the plotted unit a specific dated find/deposit and its attributed group, not the group itself. Group cards can collect several such claims, but each plotted item needs its own specimen/context, site and source. Strengthen the lane sentence as below. |
| 2. Join the group's oldest and youngest plotted claims? | **No for this first slice. Plot claims separately.** A connector fills an undated gap and mixes locations/date types. A label saying dated evidence does not undo that visual inference. A source-supported bracket for one dated context can still be a range; it must not become a group-lifespan or occupation-duration bar. |
| 3. Is the full-text/licence rule too strict? | **Keep passage-level verification and status checks; separate those from access and reuse conditions.** Accept verified full text at the publisher or a legitimate repository/archive, with version identity recorded. Do not approve abstract-only numerical leads for this slice. An open licence by itself does not establish scientific support, and no licence seen does not prove no open version exists. Chad may choose an open-licence-only intake policy, but that is a project decision, not an evidentiary law or a requirement inherited merely because the Big Five used such sources. |
| 4. Name unplotted groups under the lane? | Prefer a short coverage limitation and an optional coverage/review list, not a peer row of apparently missing species. Say not yet reviewed for this page or access not established, with the relevant site/claim. Do not call a group less established, absent from the past, or unplottable because this first search did not reach a paper. |
| 5. Is schema 4 straightforward? | A schema bump is a reasonable route, but the existing drawing shapes alone do not settle the data model. The build proposal must define claim-level identity, contextual association, uncertain bounds, date reference systems, taxonomy attribution and safe plot conversion before the renderer/validator can be approved. See section 3. |

Suggested lane text:

> Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact.

This also avoids implying that a specimen was continuously present throughout its dating-uncertainty interval.

## 2. Required revisions to this proposal

### A. Make the claim the plotted unit

Resolve the conflict between section 2's dated piece of evidence and section 3.1's group-wide joining bar. Keep a group entry as an organisational container if useful; give each fossil/site claim its own stable id, label and independent geometry. No connecting line or filled span between different claims/sites.

Correct the leads' both-ends framing. For example, the Denisovan rib's layer bracket also has two numerical ends for one contextual dating claim; it is not merely one endpoint of a species range. None of the proposed finds establishes a species lifespan.

Use source-attributed group names and neutral specimen/site titles. Avoid newly asserting earliest/latest from a preliminary search: Omo I, Ethiopia is a bounded claim; earliest Homo sapiens in eastern Africa is a broader, time-sensitive comparative claim requiring its own support.

### B. Treat Omo I as an uncertain age constraint, not an exact fossil age

The primary paper links an overlying tuff to a dated eruption and uses that to constrain the older fossil. Its reported central date and uncertainty are not a direct symmetric date for Omo I.

Preserve the measured event, its uncertainty/confidence convention, the stratigraphic relationship and the inequality separately. Do not plot Omo I as a point at 233 ka, a fossil-age interval of 211–255 ka, or a hard minimum with all uncertainty silently discarded. The source check and build proposal must choose and explain the bound rendering. An arrow denotes an age constraint, not evidence that a group occupied all earlier time.

Similarly, for a layer-associated rib or dated deposit, distinguish what was actually dated from the age inferred for the fossil and record the association's basis.

### C. Repair source-status and access language

The leads say the fetching tool returned a model-generated summary rather than page bytes. That is useful discovery material, but it does not by itself substantiate the claim that Vidal's entire paper was read passage by passage. Mark that read as reported/provisional until the source check preserves the actual passage and version/locator inspected.

Replace categorical not open where the evidence was only licence not seen or an abstract-only record. An image-credit licence in a news article is not the paper's licence. Record access location, article version, licence statement, permitted intended material, status/update checks and limitations as separate fields.

A publisher browser challenge is not an automatic source failure. A legitimate archived full text may establish the passage; publisher/status records can be checked separately. Do not bypass challenges or infer status from a search result's failure to mention a correction.

The Vidal supplementary correction's exact date and impact remain for the source check. Do not render an ambiguous 2/4 date, imply corrected publication means retraction, or imply a duplicated-table correction changed a plotted age without checking what changed.

### D. Keep the first slice fossil/context-only

Adopt the proposed H4 lean: keep the regional disappearance model out of this first slice. It is a distinct inference, not a dated specimen. The Neanderthal paper includes both archaeological and directly dated fossil datasets; it must not be reduced to a generic fossil endpoint. A separately verified individual fossil date from that or another paper could be a candidate, without importing the disappearance model.

Protein-based identification of a fossil can be described as its attribution method; it is not the same thing as plotting genetic divergence/interbreeding dates. Keep those separate.

No required count of entries. Present only claims that pass; do not pad a three-to-five target or interpret missing claims as missing populations.

## 3. Minimum requirements for the later build proposal

- **Identity and attribution:** specimen/collection id where available, site, source's group identification and any disputed/qualified assignment. Group and site Wikidata links supplement provenance; they do not establish the fossil identification or resolve taxonomic disputes. No invented genus/species identity for a lineage label.
- **Date semantics:** original quoted notation, units, uncertainty/confidence level, date method, directly dated material, association and what the number constrains. Keep measurement uncertainty distinct from a depositional interval or occupation duration.
- **Reference system:** preserve whether the source uses calibrated BP, radiocarbon BP, ka/Ma or another stated convention. Define the common plotting reference and conversion/rounding; do not silently treat all before-present systems as the device's current year. Preserve original source precision and explain any approximation.
- **Visibility:** a bound with an unknown end must not determine the zoom-to-fit span by inventing that end. Specify clipping/open-end behaviour, small-scale clusters, several claims for one group, duplicate/overlapping contexts, minimum target sizes and selection/history identity.
- **Zoom:** choose a narrower minimum window only after measuring the candidate geometry. No number is approved by this review. Test bounds, precision/rounding, degenerate windows, presets, saved older view states and old-page/new-script combinations.
- **Compatibility:** update generator and page validators together; fail safely on unsupported schema/claim semantics; retain immutable older catalogues/routes. A new revision still requires the established upload/readback → reviewed hub pin → page order. Coordinate Animals TL_MAIN through a stable reviewed page commit, not a self-referential merge hash.

These are bounded requirements for this slice, not a demand to build a general hominin database, ancestry graph or map.

## 4. Recommendations on Chad's H1–H5

- **H1:** yes, with claim-level plotting and no group-wide joining bars.
- **H2:** passage/status verification yes; allow verified archive versions. If Chad specifically wants open-licence-only intake, retain that as an explicit conservative project choice.
- **H3:** recommend including Homo sapiens as our own species, under a lane name such as Humans and human relatives. Fossil evidence should not be placed on Human history merely because it is our species. No dated fossil claim establishes who was alive everywhere at that time.
- **H4:** keep modelled disappearance out of the first fossil-only slice.
- **H5:** a three-hour cap including write-up is reasonable. Stop with a clear partial audit when time or access is exhausted. Do not leave an unanswered permission/access request treated as granted.

These are recommendations for Chad, not his recorded decisions. His instruction to bring this proposal ahead of the Big Five refresh supersedes the earlier order; the refresh remains queued.

## 5. Limited primary-source checks

These checks inform the design only. They do not clear source status, all supplements, licence scope or date revisions through November 2026.

- Vidal et al., DOI 10.1038/s41586-021-04275-8: the PMC article's abstract/main describe the overlying-tuff relationship and the resulting minimum-age constraint. This supports keeping the eruption measurement and fossil-age constraint separate. https://pmc.ncbi.nlm.nih.gov/articles/PMC8791829/
- Xia et al., DOI 10.1038/s41586-024-07612-9: the archived primary abstract identifies the rib in layer 3 and separately states its proteomic attribution. This supports separate context/date and identification fields. https://pmc.ncbi.nlm.nih.gov/articles/PMC11291277/
- Djakovic et al., DOI 10.1038/s41598-022-19162-z: the primary abstract/methods distinguish modelled archaeological occurrences and directly dated Neanderthal remains. A regional model is not interchangeable with a dated find. https://pmc.ncbi.nlm.nih.gov/articles/PMC9561710/

Direct publisher opens failed with challenge/redirect pages in this review. The archive provided primary text; subsequent Vidal lookups also encountered a challenge. No access challenge was bypassed and no source-status clearance is claimed.

## Input identities

| File | Bytes | SHA256 |
| --- | ---: | --- |
| Proposal rev 1 | 11,291 | 97c3254d44493092405b646979397921fd8345242b0d6cdecfbf9dad9a382873 |
| Leads, first pass | 8,540 | 790ba415865d16877fe4f84025add5f4e2061238143bc2da0c0c1532ff07d844 |

Nothing was built, no REGISTER entry filed, no account operated and no production state changed. Keep the next step with the Timeline thread: targeted rev 2 plus the bounded source-check plan, on Chad's decisions. Earth from Space and the parked Animals permissions work remain separate.

