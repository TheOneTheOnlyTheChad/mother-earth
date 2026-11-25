# Timeline R4 — independent live smoke test

25 Nov 2026 · GPT · read-only · approximately 03:13–03:19 UTC (05:13–05:19 SAST)

**PASS for the scoped live smoke. No rollback recommended.** This is a functional release check, not a full regression or accessibility audit. No file, account, setting or deployment was changed.

## Basis and identities

Read the synced `reviews/2026-11-25-timeline-r4-close-out.md`, final combined-tree §10 of `reviews/2026-11-24-timeline-r4-release-candidate.md`, and the source-check record including its rev 1.3 selected-result table. The recorded page merge is `49d91bc`, released 25 Nov 00:03:59 UTC; the hub is recorded as 0.6.25. This smoke did not reread Cloudflare's deployed code or account settings.

Live page: https://theonetheonlythechad.github.io/mother-earth/timeline.html

Independent HTTPS downloads returned 200 and matched all three approved page-file hashes:

| File | Bytes | SHA256 |
|---|---:|---|
| timeline.html | 73,210 | `95ad7f82dd32f286ade090fb735bbd7134125e06d7a44ac85a257ef75e9b27dd` |
| timeline.js?v=202612250900 | 76,861 | `10ac42f49edecca40e74db871e3f094969db486e6aaa7f654978b5bbcc45ceec` |
| style.css?v=202612250900 | 87,531 | `a386302f4206c47efb4ce41401c268df40942e2cf9ddeef295f0b6a6bb899d71` |

**Catalogue verification distinction:** the shell's direct request to the R4 hub route returned HTTP 403. I therefore did not obtain an independent shell byte count/hash of that response. The live browser successfully drew the explorer from the hub. The independently hash-matched script only enables that explorer after hashing the response and matching the page's pin. This corroborates the expected R4 hash `74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca` through the actual page's validation path. The 48,134-byte count is the approved/recorded identity, not a fresh shell measurement in this smoke. No local catalogue substitution or browser request interception was used.

## Requested checks

| Check | Independent observation |
|---|---|
| Revision line and changes | Exact R4/date wording present. “What changed” navigated to `#changes`. The R4 record matches the released text below. |
| Whole Earth and Complex life | Compact finds lane, no drawn find rows at those scales, four find links and the recent-view button. Checked at desktop and 390 px. No sideways overflow. |
| Last 400,000 years | Four separate rows, correct captions and marks. At 390 px, every row ran from x=17 to x=373; document width and scroll width were both 390. Tick-label boxes for 400, 200 and 0 stayed within those bounds. Screenshot inspection showed the four shapes and visible focus. |
| Every find opens / Back | Opened each of Dinaledi, Omo I, Xiahe 2 and La Ferrassie. Each Back returned to the same 400,000-year window and focused its own mark. |
| Older / Newer / Close | Newer traversed Dinaledi → Omo I → La Ferrassie → Xiahe 2. Older returned to La Ferrassie. Close dismissed the panel and returned focus to its mark. |
| Entry meanings | Checked the live entries against the selected results and the accepted qualifications, as detailed below. |
| Wheel | Three native browser automation scroll inputs produced successive spans of 299,905, 224,857 and 168,589 years from 400,000. Escape then another scroll left the window unchanged. Re-enabling wheel zoom, moving focus to the toolbar, and scrolling over the explorer also left it unchanged. No physical wheel was used. |
| Keyboard focus | Tab showed the orange 2 px outline on a toolbar button, a find mark and an entry-navigation control. Enter opened La Ferrassie at phone width. This samples the controls; it is not an exhaustive keyboard/accessibility audit. |
| Regression | Five extinction marks appeared in Complex life. The end-Cretaceous story opened and its NASA image loaded visibly from the R4 asset folder. Pliny opened by title click, keyboard and direct permalink, retaining “year unstated”. Header tabs were present; Earth now opened through its header link and rendered its page and globe canvas. No extra layers were activated. |
| Console | No captured error-level console messages on the Timeline test tab, the fresh Pliny tab, or the narrow Earth now load check. |

**Released change record, verified word for word:**

> Opened the Humans and human relatives lane with four dated finds. Each mark is the date or age limit one source gives for one find or deposit. It is not a record of how long a group lived.

## Entry wording

- Dinaledi: the deposit bracket remains 335,000–236,000 years, not the lifespan of Homo naledi.
- Omo I: older than a layer dated 233,000 ± 22,000 years, 2σ. The uncertainty belongs to the eruption, and the older limit is unknown.
- Xiahe 2: layer 3's 48,000–32,000-year range as reported and applied by Xia et al.; the rib is not directly dated and the earlier layer study is disclosed as unread.
- La Ferrassie: the fragment's direct date is 41,700–40,800 calibrated years before 1950, 95.4%. The later child's model is 44,900–39,900 years at 95% credibility, in context only. Its applicability depends on an assignment the later paper says has not been demonstrated. No endpoints were mixed and the model is not presented as the fragment's plotted date.

These are checks of the released wording against the reviewed source record, not a new literature review.

## Scope left open

Used the in-app browser at the 1280-pixel desktop viewport and a temporary 390 × 844 viewport. The viewport override was reset. Native automation scroll input is stronger than dispatching a JavaScript WheelEvent, but does **not** establish physical mouse-wheel or trackpad behaviour.

**None of these five open categories was closed:** a real phone, Safari, a screen reader, true 200% browser zoom, a physical wheel. Live image-failure/no-image states were not forced. No broad hub-health, collector, performance or cross-browser test was undertaken.

Two over-batched selector-driven regression attempts did not leave a settled Pliny panel; the subsequent fresh-tab permalink, keyboard and native title-click checks did. No script error accompanied those attempts. They are not counted as additional passing actions or as a reproduced product defect.

## Message for the Timeline thread

GPT's scoped live smoke is **PASS; no rollback recommended**. File this report unchanged and record its actual limits. The reviewed three page hashes match the served files; browser catalogue validation succeeded, while the separate shell catalogue request was refused. The R4 finds, navigation, wheel-release behaviour, narrow layout and requested regressions worked. Complete the documentation close-out without starting further feature work. Real-device/accessibility and physical-wheel checks remain open; Earth from Space Stage D is unchanged by this result.
