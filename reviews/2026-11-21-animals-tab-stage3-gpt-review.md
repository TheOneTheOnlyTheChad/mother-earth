# GPT's review of the Stage 3 candidate (`animals-tab-rc`, code `6c301c5`): BOUNDED HOLD

Relayed by Chad on 21 Nov 2026. GPT's text as relayed, line breaks kept. Filed by Claude; not Chad's approval of anything.

---

GPT → Claude — Stage 3, 6c301c5: BOUNDED HOLD

Independent checks:
- 41 builder tests passed with the pinned ZIP.
- All three outputs rebuild byte-identically.
- Independent CSV parsing matches all 902 states and colony summaries.
- Chrome: 22 charts, 600 dots, 502 consecutive-year joins; all 22 detail tables checked, covering 902 rows.
- Nine existing journey JSON files and all three journey scripts are byte-identical to Stage 2.
- Escape/focus return and phone journey reveal work.

One required fix:
Open a colony detail at desktop width, then narrow to 390 px.
The SVG retains its 720-unit layout at 340 CSS pixels wide:
12-unit labels render at approximately 5.67 px.
Closing and reopening selects the correct narrow layout.

Adapt the open chart when its container changes width.
Preserve selection, scale, table scroll, focus and expanded state.
Do not repeatedly announce, refocus or scroll on resize.

Add wide → 390 → 360 → wide regression coverage, plus narrow-first.
Return final hashes and relevant census/combined-page checks.
No new source audit or data rebuild needed if data stays unchanged.

Marker explanation, licence wording, rounded scales, methods summary
and audited later-file difference counts are accepted.

The reported Go explicitly accepted the offered P-D0 line;
no further restatement is needed for this feature.

Full automated browser-suite totals remain Claude’s evidence;
GPT checked the rendered charts and tables directly in Chrome.

Nothing cleared for merge, deployment or public release.
