# Animals: small tidy-up. Branch packet for GPT

22 Nov 2026 · branch `animals-tidy-rc`, cut from main at `6d79d5e` · by Claude · **branch only; nothing merged.**

Authority: Chad's own message of 22 Nov: "The tidy-ups can be a separate small branch: remove the stale comments and add the wheel-zoom regression check. The live smoke confirmed zoom worked, but didn't establish automated coverage." A merge needs his own Approve line.

## What changed

1. **Stale words removed, comments only.** "PRIVATE PREVIEW." taken out of the header comments of `animals.js`, `animals-globe.js`, `animals-journey.js` and `animals-census.js`, and `/* Animals page (private preview) */` in `style.css` now reads `/* Animals page */`. One line each. No code, selector or rule changed (`git diff` shows five one-line comment edits). `animals-corridor.js` lost the same words in the satellite picture release.
2. **Wheel-zoom regression check:** section 12 of `phase1/animals-corridor-ui.test.cjs`, four checks, real wheel events over the globe with the corridor shown.
   - 12a wheel out: the view moves away and stays over the same place; the page does not scroll; the areas stay shown; the wheel counts as the visitor's own move (the "View moved to the corridor." line goes); the scale shown afterwards is right for the new view (its stated length within 3% of the surface distance between the globe points under its two ends, measured by the suite itself, as in 5a). **Strengthened after GPT's review of `7d58f68`:** before, 12a only checked that the scale was visible and non-empty.
   - 12b wheel in: the view comes closer and stays above the surface; the page does not scroll.
   - 12c "Go to the corridor area" after a wheel zoom returns the record's view exactly.
   - 12d no page error.
   - Two deliberate breaks, each CAUGHT at 12a when run alone: `wheel-not-a-move` (the page stops treating the controls' start as a move) and `wheel-stale-scale` (the scale is left as it was instead of being worked out again when the move ends).

## Deliberately not changed

- **Version stamps in `animals.html`.** The four scripts and the stylesheet differ from main only in a comment, so a reader with a cached copy runs identical code. Bumping the stamps would change `animals.html` for no behaviour. Say if you would rather they were bumped.
- **`phase1/animals/build_argos_journey.py`** still says "PRIVATE PREVIEW" in its docstring. The builder's hash is recorded in the journey manifests, so touching it means rebuilding and re-pinning two journeys from their source files for a comment. Left alone.
- No wheel check was added to the tab or census suites: the wheel behaviour lives in the globe controls and the corridor's own listeners, and the corridor suite is where the camera is already checked.

## Runs (Claude, workspace, software renderer, on this branch)

On `7d58f68`: corridor suite 102 of 102 (98 before, 4 new); tab suite 277 of 277 (section 13 against main at `0e62083`); census suite 71 of 71. After 12a was strengthened (test file only; no served file changed): section 12 4 of 4, both breaks caught, and the corridor suite again in full (result in the commit that carries this line). The other 51 breaks were not rerun: no served file they edit has changed apart from the comment lines.

**GPT's review of `7d58f68` (relayed by Chad): no merge-blocking finding; the five comment edits and the unchanged `animals.html` verified; no version-stamp bump needed; the one correction (12a's scale claim) is the change above. GPT did not rerun the browser suites.** Filed: `reviews/2026-11-22-animals-assessment-and-tidy-gpt-review.md`.

## Limits

A wheel check on the software renderer says the events are wired and the camera responds. It says nothing about feel, speed or trackpad pinch on a real machine.
