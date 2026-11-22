# Animals: regional satellite picture under the corridor. Proof record (proposal §7, item 1)

22 Nov 2026 · docs only · branch `animals-satellite-proposal` · written by Claude ("Animals satellite picture" thread).

Authority: Chad's own line of 22 Nov, "Go: satellite picture proof and a short build proposal, docs and branch only, no merge." Nothing on the live site, the hub or main's page files was changed. The proof ran in one tab of Chad's Chrome on his Mac (Chrome 157, device pixel ratio 2), on the live Animals page, with a throwaway script typed into that tab only. The tab is closed. Every figure below was measured or read by Claude in that tab unless it says otherwise. Times are UTC, from the page's clock.

## 1. Verdict against the three parts of item 1

| Part | Result |
|---|---|
| The request of §6.2 returns this layer | **MET for the regional request.** 06:41 UTC: HTTP 200, `image/jpeg`, 36,651 bytes, decoded 960 by 800, fetch 682 ms, decode 33 ms, sha256 `4eff0fa5…79fa`, date 2026-11-20 (the page's rule). The same request for the NOAA-20 layer returned a different picture (sha256 `f71c6939…72f1`; mean absolute difference 20.4 of 255 per channel), so the layer name is honoured. |
| Native resolution | **READ.** GIBS's WMTS capabilities (5,328,104 bytes, read 06:42 UTC) list this layer in the tile matrix set named `250m`: 9 levels, the finest 320 by 160 tiles of 512 pixels, which is **0.002197265625° a pixel** (about 244 m north to south; about 192 m east to west at 38.3° N, computed). The 960 by 800 request asks for 0.00125° a pixel, so it is the source grid enlarged about 1.76 times; the box at the source grid is about 546 by 455 pixels. The instrument is coarser than the grid: NASA's pages, read only as search-result extracts, give VIIRS image bands as 375 m at nadir and the true-colour mix as one image band with two moderate (750 m) bands. That page was not opened in full. |
| Lies on the globe without a seam or visible offset against the lines | **MET for placement, by eye, on a plain globe. NOT TESTED against the whole-globe satellite backdrop** (see §2). The picture was laid on the live Animals globe as a mesh of this proof's own (24 by 20 cells, 960 triangles, each corner from the library's own `getCoords`, 0.00002 globe radii up, under Medium at 0.00004), with the corridor on. No gap, flicker or overlap fault was seen at the corridor view (altitude 0.02) or pulled back (0.035). The quarter-degree lines, labels, scale bar and both classes drew on top. Three lakes sit where I expect them from general knowledge (one near 38.0° N 119.0° W, one near 38.7° N 118.7° W, a small one near 38.7° N 119.5° W), on both dates used. **That is a by-eye check against no reference dataset.** Screenshots: `reviews/evidence/2026-11-22-animals-satellite-proof/`. |

**So the proof does not fail, and it is not complete.** A stays possible; B is still what is live.

## 2. What was found that the proposal did not expect

1. **GIBS was answering the whole-globe request with an error during the proof.** The live page's own backdrop request (2,048 by 1,024, date 2026-11-20) returned HTTP 200 with `text/xml`, 962 bytes: a WMS ServiceException, "Failed to draw layer … Unable to download block 0, 0 … HTTP status code: 500". Three of three tries failed (06:41 page load, 06:43, 06:44), and one try for 2026-11-12 failed the same way. The live Animals page therefore showed "Satellite backdrop unavailable. Plain globe with a coastline outline" in this tab, as designed. Earth now uses the same request; it was not opened. Cause on NASA's side not established. **This is why the seam against the satellite backdrop could not be tested.**
2. **The regional request is not immune.** In a quick loop of eight regional requests (dates 12 to 19 Nov), four did not give a decodable picture at first; all four did when asked again one at a time a minute later. Which error they returned was not captured. The page must treat HTTP 200 with a non-image body as a failure, as the proposal's "exact size or invalid" already does.
3. **On the rule's date the box was almost all cloud** (mean brightness 216 of 255). The pale lines and labels are hard to read over white cloud. On 12 Nov (mean 90, clear) the terrain, snow and lakes read well.
4. **The picture has an edge inside it on 12 Nov:** a straight diagonal line where two satellite passes meet, with a brightness step. It comes from the source's daily mosaic. The wording "may contain cloud or gaps" does not cover it.
5. **The picture is a hard-edged rectangle** against the plain globe, and at the corridor's fixed view its lower edge runs past the bottom of the globe's frame on a 1,470 px wide window.

## 3. Not done, not claimed

- No seam check against the whole-globe satellite backdrop (GIBS error above). To be repeated when GIBS answers.
- No drawing cost. One extra mesh of 960 triangles and one 960 by 800 texture; the renderer reported 30 draw calls with it on. No timing was taken: Chad was not at the Mac, and `mac-confirm.js` needs a served review copy.
- No phone width, no 390 px check, no Safari.
- No georeference check against a reference dataset.
- The request count to GIBS in this proof, all from one tab: between 15 and 22 picture requests of 960 by 800 (one loop stopped on an error before its count was read), 4 whole-globe requests (one was the page's own) and one capabilities file. Nothing was stored outside the two screenshots.
- The regional pictures' sha256, for the record: 2026-11-20 `4eff0fa5e27a585d9902fbc7cc207d6324712b872ee116f26273049f729d79fa`; 2026-11-12 `5841fb5ef4945d6c257e80bbef000b49029a9cf34e6dab4995eacca353a87bbb`. GIBS may reprocess a day, so a later request need not match.
