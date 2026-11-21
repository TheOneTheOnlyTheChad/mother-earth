# GPT post-release smoke and release-tree review: Animals MVP (as relayed by Chad, 21 Nov 2026): PASS for the bounded live functional smoke

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. A post-release review: not authorisation of the merge, not a sensitivity clearance, not a claim that every release criterion passed. Chad's covering message relayed GPT's summary and its three suggested tidy-ups; none of them is Chad's go.

---

Animals MVP — post-release independent smoke and release-tree review
21 November 2026. GPT → Chad and Claude.

VERDICT: PASS for the bounded live functional smoke described below. No release-blocking regression found in these checks.

This is a post-release review, not retrospective authorisation of the merge, a fresh sensitivity clearance or a claim that every release criterion passed.

Release reported and corroborated by local STATUS:
- Merge cff33b4 at 17:18:08 UTC / 19:18:08 SAST on 21 November 2026.
- Chad supplied separate REGISTER and page-merge approval lines.
- Live functional checks around 17:23–17:28 UTC, plus public REGISTER read afterwards.

Release candidate supplied:
- animals-release-rc 24ca038ad342d40f5170218c94e11e8026a680b5
- Code/data a46eebc; tests 17b4898.
- Mac export: /Users/chadobie/Documents/Mother Earth/_review/animals-release-rc-24ca038

INDEPENDENT RELEASE-TREE CHECKS

Read the release packet, new Animals Sources section and all seven proposed REGISTER entries.

- 24/24 local file hashes listed in the packet match.
- All six display data files are byte-identical to the previously reviewed Stage 4 r2 combined tree: zebra, shark, whale, albatross, census and corridor.
- All six catalogue-to-manifest hashes checked and match. Three catalogues are pinned correctly in their four page scripts.
- Compared four page scripts against 4aa5c00: changes are catalogue SHA256 pins only. animals-globe.js unchanged.
- Manifest structural differences are limited to sensitivity/archive-release wording and card notes; no data/geometry/rule fields changed.
- Sources carries the archive scope, precision/time caveats, linkability/replay accessibility warning, NOAA report listing, separate land-map source, Low omission and the qualified Medium label.
- The seven REGISTER entries were independently found on public main via the raw REGISTER page, including the seven expected data/source hash prefixes and final seven headings. These are filed; do not label them unfiled or request the same approval again.

Claude's 29/29 live byte-match report remains his. GPT could not repeat an external byte-fetch from the execution environment because of DNS failure. The 24/24 check above is of the local release export, not a claim of independent 29/29 served verification.

No full automated release suite was rerun here; Claude's supplied suite/break records remain attributed to him.

INDEPENDENT LIVE CHROME SMOKE

Live page:
https://theonetheonlythechad.github.io/mother-earth/animals.html

Own Chrome session/tabs only.

- On initial settled load: all four journeys and corridor off; census verified with 22 colony cards; no rendered “Private preview” text.
- Zebra: loads 13,045 fixes; replay starts 25 Oct 2007; ArrowRight advances the slider/time to the next recorded fix.
- Shark: loads 755 fixes; replay starts 9 May 2012; zebra switches off.
- False killer whale: loads 661 fixes; replay starts 23 Oct 2013 and states its displayed end 12 Feb 2014; shark switches off.
- Albatross: loads 981 displayed fixes; begins in the withheld span with explicit no-marker wording and the next displayed fix named; whale switches off.
- Corridor: draws on the live globe with neutral Medium label, source-attributed High definition, beside-globe discrepancy explanation and Low-omission notice. Go-to moves to the corridor while albatross remains selected. Switching corridor off leaves the bird and replay active.
- Census: Lamberts Bay detail opens with a 41-row table and counted/missing/model-marker explanations. Escape returns focus to its card.
- 390×844 desktop-Chrome viewport: zero horizontal overflow; corridor switch-on reveals the globe and keeps focus on cor-tgl. Settled globe y 8.04–428.04; nesting explanation y 585.82–653.01 and Low-omission notice y 656.01–706.40 within the viewport. Supporting legend text continues below. This is responsive-browser evidence, not a real-phone test.
- Navigation: Earth now opens from Animals; front-page header contains the Animals link; following it returns to Animals with all switches off.
- Live Sources: #animals exists, names all six modules plus land map, carries Low omission and known performance/device limits.
- No console errors returned by the final Animals page's inspected error-log read. This is bounded to the inspected tab/page, not a historical or comprehensive console audit.

All task tabs closed and temporary viewport reset. No server/process stopped, repository changed, hub deployed or storage touched.

NON-BLOCKING RECORD/UI FOLLOW-UPS

1. Sources has the new section but its top “Sections” list has no #animals shortcut. Add one in a later ordinary page change.

2. /Users/chadobie/Documents/Mother Earth/REGISTER.md is an older local copy without the seven entries. Public main contains them. Sync it when next maintaining the Mac records; do not infer missing public entries from that local file.

3. The release packet's old “not before 21:00 UTC” merge instruction is historical and superseded by STATUS's correction. STATUS records the 17:18 UTC merge outside the protected page windows. No new timing hold is inferred.

4. Chad reports an exact albatross tagging-site coordinate in a review file on the public animals-expansion-proposal branch. Recommend removing that unnecessary coordinate from the current public review text. This smoke did not open or copy it. Editing a current file would not remove old Git versions or guarantee non-discoverability; do not silently force-push/rewrite history. No edit or history rewrite was authorised or performed here.

5. Project copies of STATUS/HANDOVER were reported stale; this review did not update them.

KNOWN LIMITATIONS CARRIED FORWARD

Chad accepted the release with:
- The instrumented 500 ms main-task criterion NOT MET.
- Close-view corridor motion about 20 fps.
- The unexplained extreme test-machine following-load observation.

The measurement instrumentation caveat from the Stage 4 r2 review remains. This smoke did not remeasure performance or establish the slow-load cause.

Real phone, Safari and screen reader remain untested. Responsive Chrome checks do not close them.

Snyder K3(b) stays not done under the previously accepted independent projection-evidence substitution. Missing mobile-pass/key-drawn-ui fixtures remain not run.

Tag identifiers are linkable, source publicity is not a no-risk finding, and omitting Low is not sensitivity protection. Chad's recorded release decisions remain his.

Hub 0.6.21 remains the Earth from Space thread's reported state. GPT did not independently audit the hub in this smoke and did not touch its branch, callers, claims, observations or folders.

Rollback remains a separate decision; no rollback is recommended from the checks above.