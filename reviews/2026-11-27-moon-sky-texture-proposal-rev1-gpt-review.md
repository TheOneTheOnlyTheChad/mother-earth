# Mother Earth — Sky Moon texture proposal rev 1 review

27 November 2026 · GPT independent review for Chad and Claude

**PASS at proposal stage, with the implementation notes below.** Chad may choose D1–D6 and authorize a page-only branch preview. No further proposal round is required if these notes are incorporated. This is not build authorization, release approval or permission to merge to main.

Reviewed: `moon-sky-texture-docs` at reported head `71311fb`, proposal `docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md` rev 1, supplied Mac review copy `_review/moon-sky-texture-rev1/`. No page build exists yet.

## Evidence and judgment

All 14 supplied files match SHA256SUMS. I read the proposal, orientation and size scripts, outputs, existing skyscene.js and moonlight.js, and inspected the illustrated comparison. The estimates are correctly distinguished from a textured page render.

I independently recomputed the TRIAD construction in Python stdlib from the project's actual scene and Moon-light files for all 579 scene dates. Every date hits an exact six-hour table sample. Maximum Moon-to-Earth mapping residual is approximately 6.4e-15 degrees; maximum fitted Sun-direction residual is 0.006017 degrees. The smallest cross-product norm is 0.019959, so no supported daily sample is singular. This verifies the fit and paired inputs; it does not independently reproduce the astronomy-engine reference model.

The supplied reference output reports median rotation disagreement 0.0038 degrees, 95th percentile 0.0268 and maximum 0.2882. Its three altered comparisons show strong sensitivity to mirrored longitude, a swapped pair and a missing reference spin. These are assessment diagnostics, not yet production mutation tests or asserted pass/fail checks.

The recorded 15 size measurements give stop-B diameters of 2.58–10.34 CSS px. That supports the rounded “about 3–10” description for the measured widths/dates at the Earth-and-Moon stop. Free orbit and other dates have not been exhaustively measured. At the Sun stop it is smaller. The illustration makes the limited benefit clear: mottling and visual consistency, not identifiable terrain.

Proceeding is reasonable if Chad wants that consistency. Closing 10a as not pursued would also be evidence-based; data feasibility is not a blocker. Do not enlarge the Moon or alter framing merely to make the texture more visible under this item.

## Recommended decisions

| Decision | GPT recommendation |
|---|---|
| D1 | Proceed with a bounded preview if Chad wants the modest appearance improvement; acknowledge its small visual impact. |
| D2 | Use the proposed calculated orientation. Treat it as an approximate two-direction reconstruction, not exact truth. |
| D3 | Keep evenly lit, no phase. This preserves the existing display convention; phased bodies would be a separate design change. |
| D4 | Use the map without an extra brightness adjustment, with correct texture colour space. Quantify the rendered difference in the preview. |
| D5 | Reuse unchanged moonlight.js. An extra script tag is acceptable; the two asset fetches remain entry-only. |
| D6 | Dispose the texture and decoded image resources on exit. HTTP cache may still avoid a network transfer on re-entry. |

## Notes to carry into the branch build

1. **Bound the entire optional load.** The 10-second limit must settle the request through byte reading, hash validation, JSON validation, image decoding and texture preparation, not merely abort fetch. Use an entry-generation token and a final commit gate. Back, scene-entry failure, unavailable date and replacement entry must invalidate old work. Dispose late-created textures, close ImageBitmaps and revoke object URLs as applicable. Cancel sibling downloads on failure. Test slow decode/preparation as well as slow network, failure after the other asset succeeds, and Back/re-entry races. The view must open independently of optional map completion.

2. **Keep date and orientation atomic.** Apply the orientation for the actual current scene row when committing a late texture. On rollover, use the same update as body positions. A texture that finishes for an older date must not attach an older orientation. Guard finite inputs, a sufficiently nonzero cross product, a finite orthonormal proper rotation and missing samples; use the existing grey fallback on failure. No arbitrary pole/roll fallback.

3. **Qualify the wording.** Use “calculated orientation” or “approximate calculated orientation”, not “true orientation” or “turned as the Moon was” without qualification. The two direction pairs have different apparent/geometric conventions, and the fit aligns Earth exactly while fitting the Sun plane rather than both directions exactly. Reference agreement is not accuracy. Say “at the Earth-and-Moon stop, about 3–10 CSS pixels across in the measured examples”; do not imply that range at every stop. “Not how it is lit at that instant” fits the selected historical scene time better than “today”.

4. **Measure rendered brightness, not byte averages.** A JPEG/sRGB channel average and the emissive colour multiplier operate in different colour spaces. The proposed 154/186 multiplier does not establish preservation of rendered mean brightness. With D4(a), no new multiplier is needed, but the “20% brighter” figure remains an offline image estimate until actual page crops verify the result. Copying a texture's colourSpace is a design choice to check against a known correct rendered reference, not proof by itself. Do not require exact visual equality with the differently lit Tides scene.

5. **Make validation reproducible and behavioural.** Record the astronomy-engine version and module/package hash or lock entry; replace the environment-specific absolute import path with a supplied/resolvable dependency path. Add numerical assertions that exit nonzero when tolerances fail. The assessment's no-spin break changes the reference, so do not count it as fault detection in the implementation; test a missing production rotation instead. Keep the planned on-texture landmarks and shifted/mirrored controls, and use real rendered crops at actual viewing sizes. Document close-camera tests as test-only views.

6. **Resource measurements must match their scope.** Confirm mipmaps/minification, actual upload/preparation timing, frame draw counts and repeated entry/exit resource behaviour. A texture.dispose call alone does not prove memory is released if retained material/image references remain. Distinguish GPU allocation estimates, CPU decoded image storage, browser cache and measured script heap. Include scene failure and no-position entry in cleanup checks.

The existing test plan, plus these targeted cases, is sufficient for a preview. No need to start a new broad smoke run during this docs-only assessment. Release-stage Sources, REGISTER, narrow Animals pins and the new reviewed manifest remain required. A normal build/release go can authorize these related documentation edits; they need not each become a separate permission round.

## Remaining boundaries

I have not run the headless page-size suite or astronomy-engine reference comparison independently, and have not measured a textured implementation, phone, Safari, screen reader or hardware renderer. The independent checks above use local source bytes and algebra. No new external data, build, merge or deployment was performed.

The session's rejection of Claude's docs-only push is an access/approval matter separate from scientific or design review. Chad can authorize merging that named docs-only branch if desired; this review does not issue that owner instruction. Other Moon items and Sun/Parker sequencing remain unchanged.

Suggested owner line, only if Chad accepts all six recommendations:

> Accept D1–D6 as recommended. Go for a page-only branch preview of Moon item 10a under proposal rev 1 with GPT's review notes. Preserve existing framing and controls, return the exact candidate and evidence for GPT review; no merge or deployment.
