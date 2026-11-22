# Animals: regional satellite picture under the East Walker corridor. Short build proposal

22 Nov 2026 · **rev 1.1** · docs only · branch `animals-satellite-proposal`. **GPT PASSED rev 1 at proposal level for a conditional option A branch build** (`reviews/2026-11-22-animals-satellite-proposal-gpt-review.md`, relayed by Chad), no further proposal round. Rev 1.1 carries GPT's clarifications (§7) and corrects two wordings (§2 items 4 and 6). Chad's decisions S-D1 to S-D5 and his build go are still his.

Authority: Chad's choice of 22 Nov ("my next choice would be satellite for sure") and his own line of 22 Nov, "Go: satellite picture proof and a short build proposal, docs and branch only, no merge." This is option C-D4 A of `docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md` (rev 2.2, passed by GPT at proposal level). **§4.3, §6.2 and §7 of that proposal stay the governing text.** This note only adds what the proof found and what the build needs decided. No build, merge or release is authorised by it.

Proof record: `reviews/2026-11-22-animals-satellite-proof.md`. Read it first.

## 1. Where the proof leaves option A

The regional request returns the layer at the asked size, and the picture sits on the globe under the polygons with no fault seen on a plain globe. Two things are still open: the look against the whole-globe satellite backdrop (GIBS was returning an error for that request during the proof), and the drawing cost on the Mac. **Recommendation: go on with A on a branch, with those two checks as the first build steps and B kept as the fallback if either fails.**

## 2. What the build would add (nothing else changes)

1. **The request**, exactly §6.2: same endpoint, layer constant and date constant as `animals-globe.js`; box 37.8, −119.8, 38.8, −118.6 read from the manifest; 960 by 800 JPEG; 20 s fetch limit, 5 s decode limit; an answer that is not an image of exactly 960 by 800 is invalid (this covers GIBS's HTTP 200 error pages, seen in the proof); three requests at most per page load; "Try the regional picture again"; never a request on pan, zoom, resize or frame.
2. **Where it lives: a mesh owned by `animals-corridor.js`**, not a library layer. Built as in the proof: a grid over the box with every corner from the globe's own `getCoords`, an unlit material, `raycast` switched off, added beside the globe mesh, placed below Medium. The library's layers (polygons, paths, labels) are not touched, so `built()`, `watch()` and `done()` keep counting what they count now. `clearOwned()` removes and disposes the mesh and its texture with everything else.
3. **The picture is not part of "shown".** The card's completion stays what it is today (both classes built and a frame drawn). The picture has its own line with four states: loading, shown with its date, unavailable, no further attempts. A geometry failure removes the picture; a picture failure leaves the corridor shown. Tests hold the picture from inside the page the way section 10 of the corridor suite holds High.
4. **Wording**, §4.3's sentence, with the source grid stated from the proof: "Regional backdrop: NASA satellite imagery for [date]. It may contain cloud or gaps. It is not from the study's years and shows nothing about the animals or their habitat then." plus one line of fact, in GPT's wording: "GIBS image grid about 250 m per pixel, enlarged for display." The method note says grid spacing is not instrument detail or positional accuracy. No instrument-band figure goes on the page unless the product documentation is opened and read first.
5. **The ripple**, expected and listed so nothing is missed: the manifest gains the box (rebuild; the list that pins the manifest; `CATALOG_SHA256` in the page script; the version stamps in `animals.html`; the tests that pin them).
6. **REGISTER.** The GIBS entry covers the whole-globe backdrop and the two Night lights layers. It does not mention a regional request. A short added line under the same entry (same layer, same terms, same credit; one automatic 960 by 800 attempt on the first switch-on, a successful picture kept in memory and reused, further attempts only through the explicit retry, three attempts at most per page load including aborted ones, none on pan, zoom, resize or frame) would be drafted for GPT and filed only on Chad's own Approve line.

## 3. Decisions for Chad (after GPT's review)

| | Question | Options | Recommended |
|---|---|---|---|
| S-D1 | Request size | A: 960 by 800 as passed in §6.2 (the source grid enlarged about 1.76 times). B: about 546 by 455, the source grid itself (smaller download, the browser does the enlarging). | A. It is what GPT passed, and the card states the source grid either way. |
| S-D2 | Lines and labels over bright cloud | A: leave as is. B: give the corridor's lines and labels a thin dark edge while the picture is shown. | B. On the rule's date in the proof they were hard to read. |
| S-D3 | Wording for pass edges | A: keep "cloud or gaps". B: "cloud, gaps or visible edges between satellite passes". | B. A straight edge was in the 12 Nov picture. |
| S-D4 | The picture's hard rectangular edge | A: leave it; the box is honest about where the picture ends. B: fade the outer few percent into the globe. | A. A fade suggests coverage that was not requested. |
| S-D5 | A switch to turn the picture off | A: none; the picture follows the corridor. B: a small "Hide the regional picture" control. | A for this build. Add B only if the cloud days prove annoying. |

## 4. To prove first in the build (stop and report if either fails; B stays)

1. With GIBS answering the whole-globe request: the regional picture against the satellite backdrop, at the corridor view and pulled back, desktop and 390 px. No flicker where the two meet.
2. Drawing cost on the Mac with Chad at it, from a served review copy, with `reviews/evidence/2026-11-21-animals-corridor-cost/mac-confirm.js`: corridor switch-on with and without the picture, against the same 500 ms and 1,500 ms limits.

## 5. Not in this build

No state line, road, town or place name. No second date, no date picker, no cloud judgement, no stored picture, no hub work. No change to the journeys, the census or the whole-globe backdrop. Phone, Safari and screen reader stay parked as Chad left them.

## 6. Order from here

GPT reviews this note and the proof record. Chad decides S-D1 to S-D5 and gives or withholds a branch build go. Branch build with §4 first. GPT's candidate review. Chad's own Approve lines for the REGISTER line and for any merge.

## 7. GPT's clarifications, carried into the build (rev 1.1)

GPT's recommendations on the decisions: S-D1 A, S-D2 B, S-D3 B, S-D4 A, S-D5 A. They are recommendations, not Chad's choices.

1. **Both first checks stay, and B stays the fallback.** An upstream error leaves the backdrop check unperformed; it is not a pass and not proof of a drawing fault. No change of layer or date and no extra retries to get a preferred answer. The first check also covers the picture's edges and inside, rotation or mirroring, displacement against the labelled grid, a bright-cloud and a clear example, at desktop and 390 px. The 390 px check is a browser-width check; the parked real-phone, Safari, screen-reader and hand testing stay parked.
2. **Off disposes the GPU objects (mesh, material, texture) and keeps valid image data in memory** so a later switch-on needs no request. Pending work is aborted or invalidated; a late or stale completion draws nothing and releases what it made. The request count is not reset by a toggle.
3. **The picture never delays or redefines corridor completion.** If the picture finishes first it waits until valid corridor geometry is shown. Its own "shown" needs attachment and a rendered frame, not a decode. Geometry failure, off or a lost graphics context removes or invalidates the picture; a picture failure leaves the polygons usable. Camera, page scroll and whole-globe status keep their owners.
4. **Performance report, existing budgets:** switch-on from verified geometry in memory to the frame with both classes drawn (longest task at most 500 ms, first draw at most 1,500 ms), with and without the picture; the five-second orbit median and worst figures of corridor proposal §6.5, corridor alone and with a journey; image decode and texture attachment measured where they land; a cached picture on re-enable. The S-D2 edge, if chosen, is shown at both widths with its cost, without rebuilding the library's polygon data when the picture arrives.
5. **Georeference:** the by-eye lake check is not independent georeferencing. Keep the existing NAD83(NSRS2007) disclosure and the statement that no absolute offset is established. Check the mesh's corners and texture orientation against the fixed box. No accuracy claim.
6. **Tests:** HTTP 200 with an XML or error body, wrong type or size, fetch and decode timeouts, picture held against geometry held in both orders, off/on and retry races, cap exhaustion, context loss, cached re-enable and its disposal. The combined journey, census and corridor regressions and the required breaks stay. The picture mesh has raycasting off and must not change `built()` counts or the scale bar's raycasts.
7. **Pins and boundaries:** rebuild and re-pin the manifest, list and script chain for the box; corridor geometry and all journey and census assets unchanged; any shared-module change declared one by one with the combined-page checks. The REGISTER line stays a draft for GPT, then Chad's own filing line.

