# Animals satellite picture: GPT review of the proof and build proposal rev 1 (relayed by Chad, 22 Nov 2026)

GPT text as Chad relayed it, filed unchanged below. It is GPT's review, not Chad's decision or go.

---

Animals — satellite proof and build proposal rev 1 review
22 November 2026. Supplied branch animals-satellite-proposal, commit 85f023d. Docs only.

Verdict: PASS at proposal level for a conditional option A branch build, subject to Chad's own build go and decisions. The proof supports proceeding; it is not a complete placement, performance, candidate or release pass. Keep option B (existing lines and scale only) as the fallback. No new proposal round is needed for the clarifications below if incorporated faithfully.

Reviewed Mac read/01-PROOF.txt, read/02-PROPOSAL-rev1.txt, governing read/03-CORRIDOR-PROPOSAL-rev2.2.txt sections 4.3/6.1–6.5/7 and related acceptance criteria, and both supplied evidence screenshots. Also read the current local globe/corridor ownership and completion code to assess integration. No browser injection, NASA picture request, source rebuild, implementation, merge or production action performed in this review. Measurements and service failures in the proof are Claude's reported observations; GPT independently inspected the screenshots, not the experiment itself.
Proof judgement and build gates
The supplied clear-day screenshot shows useful geographic texture under the two published classes. The cloudy-date screenshot supports the contrast concern. Both show the hard rectangular footprint. The visible diagonal brightness change on the clear-day screenshot must be disclosed as a possible mosaic/pass edge, distinct from a mesh-placement fault.

Sufficient to try A on a branch, with these first build gates preserved:
1. Against a successfully loaded whole-globe satellite backdrop, inspect the regional footprint at the corridor view and pulled back, at desktop and 390 px. Check regional edges and interior, no flicker/depth fighting, no rotation/mirroring or visible displacement against the labelled grid; include bright cloud and a clear example. The coarse and regional images need not have identical colour/detail. A hard rectangular coverage boundary and a documented source mosaic edge are not automatically rendering failures.
2. From a served review copy on Chad's Mac, report switch-on/drawing cost with and without the regional picture using the governing definitions: verified geometry in memory to the actual frame with both classes drawn; longest task <=500 ms and first draw <=1,500 ms. Also retain section 6.5's five-second orbit median/worst figures, corridor alone and alongside a journey. Measure image decode/texture attachment when it arrives separately so a fast geometry completion cannot hide a later stall. Include a cached picture on re-enable.
An upstream failure means a check remains unperformed, not a passed placement test and not proof of a renderer defect. Stop/report and leave B live; do not change layer/date or grow retries to obtain a preferred answer. A failed gate invokes the stated B fallback/report. No release of A before the relevant candidate evidence is reviewed.

The 390 px browser layout check remains in scope. It does not require reopening Chad's parked real-phone, Safari, screen-reader or hand-testing work.

By-eye lake recognition is not independent georeferencing or a measured alignment tolerance. Preserve the existing NAD83(NSRS2007)-to-reference-globe disclosure and lack of an established absolute offset. Validate the mesh's box corners/texture orientation against the fixed request box; no new survey-accuracy claim is warranted.
S-D1 to S-D5 recommendations
Decision	Recommendation	Reason and condition
S-D1 request size	A — 960 x 800	Retain the bounded request already specified and demonstrated. It enlarges the grid and adds no underlying detail. No second-size experiment is needed for this build.
S-D2 contrast	B — thin dark edge/halo	Keep labelled grid lines and labels legible on cloud and darker terrain, without obscuring the classes. Demonstrate the actual result at the two widths and report any extra drawing cost. Do not rebuild the library's polygon data merely to change contrast when the image arrives.
S-D3 wording	B — mention satellite-pass edges	Use “It may contain cloud, gaps or visible edges between satellite passes.” Preserve the date/study-years/animals disclaimer. Cloud is not an unavailable response.
S-D4 footprint	A — hard rectangular edge	An explicit bounded image footprint is acceptable here. A fade could be an ordinary visual treatment, not necessarily a false coverage claim; it is unnecessary scope for this build.
S-D5 hide control	A — follows the corridor	Keep the proposed control count for this build. Separate image status and retry remain; an image failure must never remove usable polygons. Reconsider an independent hide/show control later if normal use shows a need.


These are GPT recommendations, not Chad's recorded choices.
Clarifications to carry into the build and packet
Request cap and reuse. Proposal section 2 item 6 currently says “one 960 by 800 request per corridor switch-on.” Correct the REGISTER draft and release wording: one automatic attempt on the first switch-on, successful bytes/decoded image cached in memory and reused, subsequent requests only through the explicit retry, at most three total attempts per page load including aborted requests. No pan/zoom/resize/frame requests. The governing section 6.2 already specifies this and takes precedence.

Cache versus disposal. Off removes/disposes corridor-owned GPU mesh, material and texture, aborts/invalidate pending work, and draws nothing on late completion. Retain a valid CPU-side cache sufficient to reconstruct the image without another request. Do not close the only ImageBitmap/revoke the only usable source on off and then refetch to recover it. Dispose transient resources from stale completions. Keep request counting outside a per-toggle reset.

Independent readiness, with no orphan picture. Geometry completion remains the reviewed built-fill/built-outline plus subsequent-renderer-frame condition; imagery must not delay or redefine it. Picture fetch/decode may run in parallel, but a picture that finishes first is kept pending until valid corridor geometry is actually shown. Its own “shown” status requires attachment and a rendered frame, not just successful decode. A geometry failure/off/context loss removes or invalidates the picture; image failure leaves geometry usable. Keep camera, page-scroll and whole-globe status ownership unchanged.

Describe the grid accurately. Prefer “GIBS image grid about 250 m per pixel, enlarged for display.” Add in the method note that grid spacing is not effective instrument detail or positional accuracy. NASA's official GIBS documentation independently confirms the EPSG:4326 250m matrix has nine levels and finest spacing 0.002197265625 degrees/pixel. That corresponds to roughly 546 x 455 grid samples across the requested box, enlarged about 1.76 times for 960 x 800. East-west metres per pixel vary with latitude. The proof's instrument-band statements were only read as search extracts; open the appropriate product documentation before promoting those into established technical claims, or omit them from the shipped copy.

Official reference read by GPT:
https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/ (Tiled Access Resolutions).

Preserve failure and race coverage. Explicit tests for HTTP 200 XML/error bodies, wrong MIME/dimensions, fetch/decode timeouts, held image versus held geometry in both orders, off/on and retry races, cap exhaustion and context loss. Include cache re-enable and its resource disposal. Preserve the combined journey/census/corridor regressions and required breaks; unchanged journey source is not proof of unchanged behaviour. The custom image mesh must have raycasting disabled and must not contaminate polygon built() counts or scale raycasts.

Pins and source boundaries. Rebuild/re-pin the manifest/list/script chain for the box; preserve the actual corridor geometry and all journey/census assets. Any shared-module changes must be individually declared with the required combined-page checks. REGISTER addition remains a draft for GPT then Chad's own filing line; same-source reuse is not permission to skip documenting the changed request pattern.
Next step
Claude may incorporate these bounded clarifications in the build packet without another proposal loop. Chad chooses S-D1–S-D5 and gives a branch-only build go if desired. Then the two checks first, option B fallback/report on failure, candidate review by GPT, separate REGISTER and merge approvals. Nothing in this review authorises main, the live page, the hub or a production setting change.