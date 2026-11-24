# Request to the Animals owner — a narrow `NC_MAIN` exception in `animals-tab-ui` for the Nature context page commit

**24 Nov 2026 (10:19 UTC clock reading). From the Nature context thread. Docs only.** This asks the owner of `phase1/animals-tab-ui.test.cjs` (the Animals thread) to write and bring to review a test-maintenance candidate. The Nature context thread does not edit that suite, `BASE_MAIN`, `TL_MAIN` or any other Animals comparison. Nothing here authorises a merge, a publication push or a hub change.

## 1. The reviewed page commit H

- **H = `90eb52203c23b26a7fe00382f30cf3453b00a583`** on branch `nature-context-rc`. Its parent chain runs back to main `6bebff18ffb0886719a3587a9199d9c158b39f50`.
- GPT passed these bytes: `reviews/2026-11-24-nature-context-rc-r2-gpt-recheck.md` (sha256 `76feaf54c583708fc6e40fda39b46778ec5b05d9c33c6a76d1443eaed8ee9785`), after a HOLD (`reviews/2026-11-24-nature-context-rc-gpt-review.md`) and rev 2.
- Packet: `reviews/2026-11-24-nature-context-rc-r2.md` on the branch.

| Production page file | at `6bebff1` (= main now) | at H |
|---|---|---|
| `app.js` | `2bb226b51344c8a9…` | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `index.html` | `52ba007feffaaeaf…` | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` |
| `sources.html` | `f4a9254d2ba9b3ce…` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |

Main has not changed any of these three files, or any other non-documentation file, since `6bebff1` (checked at `b349a99`).

**`git diff --name-only 6bebff1 H`, by kind:**
- production page files: `app.js`, `index.html`, `sources.html`;
- tests: `phase1/nature-context-ui.test.cjs` (new), `phase1/place-rows.test.mjs`, `phase1/place-ui.test.cjs`;
- records: `reviews/2026-11-24-nature-context-*.md`, `reviews/evidence/2026-11-24-nature-context-rc/*`.

No `style.css`, `phase1/worker.js`, `timeline.*`, `animals*`, `moon.html`, `sun.html` or other page file.

**Today on H, `animals-tab-ui` reports 277 passed, 3 failed: 13b (`index.html`), 13c (`["app.js"]`) and 13e (`sources.html`).** This is expected, and it is not a passing suite.

## 2. What is asked (GPT's rev 2 review §2 and recheck §4)

1. Add a pin **`NC_MAIN = 90eb52203c23b26a7fe00382f30cf3453b00a583`**. It is the immutable reviewed page commit, never a branch tip or the maintenance commit itself. It follows `TL_MAIN`'s rule: only a Nature context release moves it, in the commit that records the release.
2. **13c:** take `app.js` out of the `same` list. Give it its own check: byte-identical to `app.js` at `NC_MAIN`. The other files in `same` stay on `BASE_MAIN`.
3. **13b and 13e, form (ii) as GPT prefers:** `index.html` and `sources.html` byte-identical to the file at `NC_MAIN`, **plus** the existing Animals guarantees checked on their own, not inherited from the pin:
   - the Animals tab link and the Animals menu link, each exactly once, and the header guarantee, on both pages;
   - on Sources: the Animals section, its shortcut in the Sections list, all six source identifiers, the Low-use-class sentence, and no "private preview".
4. **Scope check:** `git diff --name-only <parent of H's first commit> H` (that is, `6bebff1..H`) lists no production page file other than the three above. Use an explicit allowed list, with the test and record paths listed separately. Pin inequality alone is not enough.
5. **Negative checks:**
   - an unreviewed edit to any newly pinned file fails;
   - removing an Animals link or a required Sources element fails through the independent guarantee, even when a proposed baseline also lacks it;
   - a missing `NC_MAIN` commit fails closed, as the existing missing-baseline behaviour does.
6. **Unchanged:** `BASE_MAIN`, `TL_MAIN`, 13a, 13d (stylesheet), 13f–13i (Timeline), moon.html and sun.html in 13e, every other comparison.

## 3. After that

The owner's maintenance candidate is reviewed by GPT. Then, for a release, Chad's go and:
- a merge on fresh main, keeping H in history (a merge, not a rebase, so `NC_MAIN` stays reachable);
- the dated REGISTER correction (proposal rev 2 §3.3) in the release commit;
- `nature-context-ui`, the affected suites and `animals-tab-ui` rerun on the merged tree before the push;
- Chad's own Approve line, then the push, served hashes and a live read.

If the page bytes change again before then, H changes, and the difference is reviewed before the pin is chosen.
