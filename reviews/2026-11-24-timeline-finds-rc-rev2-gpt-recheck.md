# Timeline finds — rehearsal rev 2 recheck

24 November 2026 · GPT independent reviewer · head `17b6f26`, page H2 `624545e`, tested tree `5cb9f1f`.

**All targeted points from the previous rehearsal review are closed. The revised layout, result-consistency design and La Ferrassie wording are accepted for the rehearsal. One confirmed wheel/focus defect should be fixed before a release candidate. It also occurs with the released script, so it is a pre-existing defect exposed by this work, not a new findings-data regression.** No upload, freeze, pin, merge or release is cleared here.

## 1. Independent verification

Retrieved exact public head `17b6f26` into a temporary review tree. All **90 evidence-manifest entries verify** without missing files or mismatches. Read the revision packet, source/check changes, validator and rendering/event code, new checks, and supplied phone/focus screenshots.

Independent results:

- **`timeline-finds-build`: 74 passed, 0 failed.** Reproduced the 48,118-byte rehearsal catalogue, SHA256 `0afd1910ba01ee30e3e03513032f8f252578466bc4da2e734bdd3fab658bdf9b`. Its tests include the two distant clocks, reduced find counts and the revised source/result refusals.
- **Original mixed-endpoint reproduction:** valid control builds; changing only the younger end to 40.827 ka in both stored fields now exits 1, naming the notation/value disagreement.
- **Actual page validator function:** valid generated catalogue returns null; the same mutation returns `find f-la-ferrassie-bone: source notation and stored values disagree`. This direct function execution used minimal note/attribution DOM stubs, not a browser validation run.
- **Independent local browser check:** opened the actual preview helper in the in-app browser, inspected the compact lane, used its 400 ka button, opened the revised fragment entry, and checked Back/Forward restoration. Reproduced the wheel issue and compared it with the released R3 script in a second local preview.

The preview helper rewrites the hub URL to its local fixture route and labels the catalogue unpublished. Its served script therefore has the documented preview-specific hash; this is not a production-byte or live-hub smoke test. Both local servers started for this review were stopped afterwards.

The full 252-check browser suite, complete break matrix, clock comparisons in Chromium, threshold-crossing matrix and 26 focus crops remain Claude's supplied evidence. GPT did not independently rerun that complete matrix or use a real phone, Safari, a screen reader or true 200% zoom.

## 2. Previous review points — closed

**Compact lane:** accepted. The independently opened landing view shows the explanation, recent-view button and separate find links rather than displaced/clipped glyphs. The recent button brings up the separate rows. At exactly 2 Ma the specification retains rows; the provided threshold tests cover that boundary. Permanent entry ids and non-JavaScript content remain available. Fixing the wheel issue below must preserve the new focus and history behaviour.

**Ticks/focus:** the supplied phone screenshots show complete end labels, with tick coordinates preserved. The short calibrated glyph has a visibly distinct outlined target in its focus crop. Accept these revisions within the stated screenshot/computed-style evidence; no real-device or screen-reader clearance is implied.

**Result identity:** the original gap is closed. The generator ties a result id and exact notation to the public evidence record, while generator and page check structured numbers against notation and rendered claim wording. The browser checks internal consistency and id syntax; it does not independently fetch or authenticate the Markdown evidence record. The reviewed generator, exact catalogue hash and source review complete that boundary. Neither side can establish that the evidence record itself faithfully represents the paper. That limitation is honestly stated and acceptable.

**Clock and reduced find count:** the build suite independently passes the 1990/2090 byte-identity tests and the three-/one-find controls. The browser clocks, geometry and reduced-count behaviour are additionally covered by Claude's tests. Four remains a maximum-row choice, not a scientific quota.

**La Ferrassie:** revised wording accepted for the rehearsal and suitable to carry into the later freeze review. It dates the fragment, keeps assignment to the child qualified, distinguishes the child's modelled interval from the direct fragment date, and no longer assigns the three-individual overlap interval to LF8. The new source attribution records who actually checked the passages. This does not reopen the full-text dependency already closed by GPT; it also does not substitute for the final release source/status/locator record. E4 remains optional and unsent.

## 3. Wheel issue — independently reproduced on both scripts

### Candidate reproduction

Local rev-2 rehearsal using committed script SHA256 `67c38ca668c03a99ffaa6572bb8ce2d96c12d4f8113be7c3ad92daea8dd71c5c`, with the helper's local hub-URL substitution:

1. Use **Show the last 400,000 years**.
2. Focus the explorer and press Enter to enable wheel zoom.
3. Tab onto Omo I's link while keeping focus inside the explorer.
4. Scroll once over it: displayed span changes **400,000 → 416,324 years**. The hint immediately returns to the disabled-wheel instruction even though focus is restored to Omo I.
5. Scroll again: the span remains **416,324 years**.

This reproduces the reported one-step stop with genuine browser input, not a manually dispatched synthetic wheel event.

### Released-script comparison

Ran the released R3 script, SHA256 `55043697559b60d7470261afd88a790d0f07f1599c69165ee697788322d77524`, through the existing local preview helper. Its preview catalogue is labelled T1 and its hub route is local; no live page or account was used.

With the Frasnian–Famennian mark focused and wheel zoom enabled, the first step changes the span **538.8 → 560.8 Ma**, switches the hint off, and restores focus to the mark. The second step makes no further change. Thus the defect predates this rehearsal.

### Likely cause and bounded fix

Code inspection points to the interaction between `render()` replacing the focused mark's DOM and the explorer's `focusout` handler. A removal can momentarily send focus outside the explorer; the handler calls `setWheel(false)`, and restoring the replacement link does not restore wheel mode. This is a source-based explanation consistent with the observed behaviour; this review did not instrument the focus-event sequence.

**Fix before the RC on the same rehearsal branch.** Preserve wheel activation across a controlled internal redraw/focus transfer, while keeping intentional Escape, Tab/click outside and actual loss of explorer focus able to release it. Do not broadly disable the focusout safeguard or leave the page trapping the wheel.

Regression coverage should include:

- At least three consecutive wheel steps with a find focused, both directions, within the same lane form.
- Several steps crossing 2 Ma and back, retaining the same find and the intended wheel state.
- A released extinction mark, so the common redraw path is protected too.
- Escape, Tab outside and click outside still release wheel mode; ordinary page scrolling works afterwards.
- Back/Forward and focus visibility still behave as accepted.

The current W tests cross the threshold in a single step. They check where focus lands but miss that wheel mode was switched off during that step. Extend them to check the next input and displayed wheel state. A deliberate break restoring the current redraw/release behaviour must fail a named check.

## 4. What remains before an RC

After the bounded wheel correction and targeted recheck, the RC can be prepared on Chad's go. It still needs final claim/source/result identities and locators, dated source status, final change-record wording/count, catalogue revision/date/bytes, REGISTER entries, the release-only Animals `TL_MAIN` adjustment and reviewed publication order. Keep the original catalogue revisions/routes unchanged.

Reconcile with fresh main, including the separately coordinated Nature context/`NC_MAIN` release. The trial Animals run with `TL_MAIN=H2` demonstrates compatibility on that rehearsal tree; it neither moves the pin nor proves compatibility with a later combined main. Do not advance `BASE_MAIN` or silently overwrite another thread's accepted changes.

No new broad proposal round is required for the wheel correction. Return its exact commit, focused tests, a break restoring the defect and the affected older interaction-suite results. This is not a request for deployment or further scientific claims.

## 5. Reviewed identities

| File | SHA256 |
|---|---|
| `timeline.html` | `c97da485d3cb31361864893d12b391c674d1d5d2e6cd19cd9d0a442021820ae3` |
| `timeline.js` | `67c38ca668c03a99ffaa6572bb8ce2d96c12d4f8113be7c3ad92daea8dd71c5c` |
| `style.css` | `31d1f22d50ef1d243556f3e26381f10e5bce8de22a47e00f624711a47d6eae5c` |
| `phase1/timeline/build_timeline.py` | `7d025eaea978147230c6eaa51ee3971b0afd6b40e743442f43b6ee86db34c643` |
| Source check rev 1.3 | `407bd83f164a081626a186cc6f4c10b93e3a7743b9ec3145090f9d80d68a0610` |

No project repository code, public branch, live page, hub, catalogue pin or external message was changed by GPT.
