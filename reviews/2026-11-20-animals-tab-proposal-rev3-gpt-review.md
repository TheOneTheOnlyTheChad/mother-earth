# GPT review: Animals tab and bird proposal rev 3 (as relayed by Chad, 20 Nov 2026)

Filed as received. GPT's text, not Claude's. Outcome: PASS at design/proposal level with implementation and test clarifications. Not Chad's build go; no merge or deployment clearance. Chad's own summary to Claude: rev 3 passes at proposal level with a few test clarifications recorded; GPT recommends animal switches clearly labelled "one at a time", a dated satellite backdrop with a plain-globe fallback if imagery fails, and two reviewed stages (move the existing three journeys first, then add the bird); the bird's data rules remain passed; no further proposal round is needed for the clarifications.

---

Mother Earth — Animals page / bird proposal rev 3: GPT review

20 November 2026 · animals-expansion-proposal · bf50e4a36d29fe11d4b298ba6e50360f0d5d71d0

PASS at design/proposal level with the implementation/test clarifications below. The proposed Animals page matches Chad's requested separation from the busy Earth now page. No further full proposal round is needed solely to record these clarifications. Chad's branch-build go is still required; no merge or deployment clearance.

Read the complete proposal and verified SHA-256 dd0618ac4807863d4bc8d41401caaa65541cab0d2998122c2cc79aa4f5249a26. Inspected the available parked page's imagery and replay integration. Consulted W3C APG switch and radio patterns. This is not a running-page or candidate review.

1. Controls: accept the requested switches

A mutually exclusive selection is naturally expressible as radios plus None. However, the requested on/off interaction includes switching the active journey off directly. I accept labelled switches for this design, with the exclusivity made clear.

Use a labelled group with visible “Animal journeys — one at a time” guidance associated with the controls. Keep each switch's accessible label stable; change state text separately. Tab reaches each switch; Space and Enter operate the button-based control. Preserve focus on the activated control, including while loads complete or fail. Do not assign radiogroup semantics or radio arrow-key behaviour to switch controls.

Define loading as the requested active selection: B checked while loading, A immediately unchecked and cancelled. Choose the deterministic failure policy return B to off and keep the error/Retry on its card. Retry selects B through the same exclusive loading path, cancelling any other current selection. Never restore A automatically after B fails.

Announce the user transition and meaningful completion/failure without duplicate speech or per-frame updates.

Primary references:

https://www.w3.org/WAI/ARIA/apg/patterns/switch/

https://www.w3.org/WAI/ARIA/apg/patterns/radio/
The choice to accept exclusive switches here is my design judgement, not an assertion that W3C prescribes exclusive switch groups.

2. Backdrop: recommend A, with a working fallback

Use the same pinned imagery selection/date logic as Earth now through a small shared or isolated imagery component. Do not load the full Earth now application and its collectors merely to obtain its texture.

The inspected parked implementation uses dated NASA GIBS VIIRS imagery selected from a UTC date offset, not a guaranteed live or complete picture. Prefer:

Backdrop: NASA satellite imagery for [date], not the journey dates.

Keep the existing caveat about dark/missing areas. On request failure, use a plain globe/coastline fallback, state “satellite backdrop unavailable” and keep valid journeys usable. Never leave the failed texture's date label implying that imagery is displayed. Land/coastline context helps orientation, but neither backdrop supplies precise historical ground conditions.

This also avoids making animal replay availability depend on imagery availability.

3. Build order: two reviewed stages

Recommend:

Move the three existing journeys to the Animals page, add the exclusive controls and restore Earth now. Stage 1 candidate to GPT.

Add the bird and its already agreed data/withholding/accuracy changes on the same branch. Stage 2 candidate to GPT.

A passed stage remains a private candidate. Preserve a named commit for each stage so comparisons remain reviewable. Do not retire the parked source branch merely because the new build has started.

4. T1–T18: retain them with these corrections

T2 and T15 — network contract. “Nothing fetched beyond the page itself” contradicts libraries, imagery and the existing cards' catalogue/manifest reads. Allow the explicit page assets and metadata required to render cards. Request no journey coordinate payload before its switch is enabled. List allowed library/imagery origins separately; no live-layer hub requests. An imagery request is not necessarily the only outside request if the pinned renderer comes from a CDN.

T4 and T18 with Part B — loaded is not the same as marker-visible. At Stage 2, the bird successfully opens inside its leading withheld span: its switch is on, replay bar visible, marker and accuracy hidden, omission message shown. Do not make T4 demand a marker immediately. T18 preserves old journeys' observable fix/gap behaviour; it does not preserve Earth-now-specific scaffolding.

T8 — failure scope. A bad individual manifest/display file is local to that journey; another verified journey must remain usable. A bad shared catalogue is global to all entries relying on it: no journey can be trusted from that catalogue. Keep all cards readable with an appropriate global integrity error, and permit recovery after a valid retry. Do not bypass the catalogue check to satisfy “on that card only.”

T6 — races. Interpret “only C ever drawn” as no obsolete response drawing after its request was superseded. A legitimately completed A before B was clicked is not a failure. Include on/off while loading, A→B→A, Retry while another animal is selected, and switch-off before a late response. Check every object type, playback timer and stale camera callback, not just the marker.

T13 — Earth now comparison. Pin the exact main commit used for the merge as the comparison baseline. List relevant entry files and shared dependencies; avoid an ambiguous moving “today's main.” Explicitly check shared CSS/helpers for effects on Earth now and the other pages. Catalogue/data assets intentionally remain in the project for Animals; they are not Earth-now integration.

Lifecycle and fallback. T14 covers pagehide/pageshow including back-forward cache: return all off, abort pending work and stop replay. Add hidden-tab playback pause and resize/orientation behaviour. T17 should include failed renderer/library load and lost graphics context, as well as initial no-WebGL. Preserve cards, source facts and the selected-state explanation when globe rendering fails.

T16 — layout. On narrow screens, controls/cards below the globe can have zero overlay. State the actual desktop/mobile overlap target in the Stage 1 packet rather than relying on an unspecified “agreed share.” Verify the page scroll reaches switches and that controls remain usable when the canvas changes size. Respect reduced motion; no auto-play or needless continuous camera motion on entry.

5. Part B impact

The bird's timestamp, spatial filter, source pins, accuracy, join and withheld-period rules stay passed; no new source audit is needed.

Beyond B13/B15, update cross-references and the loaded/hidden state expectation above. Require the new fields as already specified in §11a; keep old journey files/manifests byte-identical. Stage 1's unchanged-builders claim applies to the move; Stage 2 explicitly changes the GPS builder as proposed.

No live background layers should suggest dates synchronized to the animal. Existing links now target the animal's switch on Animals without activating it. The old private index hash can simply be retired as proposed.

Recommended decisions and handoff

Recommend A-D1 A (dated imagery with fallback), A-D2 two reviewed stages, and retain D1 A, D2 A, D3 yes, D4 yes for the bird.

Record these test clarifications, then Chad can authorise Stage 1 or both stages with review between them. Neither my pass nor his earlier docs-only instruction is the build go.

Penguin and corridor proposals remain separate next tasks. Noncommercial-only sources remain undecided. Three expansion enquiries SENT, no reply reported; NOAA/ATAP unchanged. Earth from Space probe untouched.

