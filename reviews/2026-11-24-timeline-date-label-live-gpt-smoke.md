# Timeline date label W1 — independent live smoke

24 November 2026 · approximately 06:30–06:32 UTC (08:30–08:32 SAST)

**Outcome: PASS for the requested bounded desktop smoke. No rollback recommended.**

Release identified by Chad/Claude as merge 7c94f89, live since 06:14 UTC. GPT tested the live page independently in the in-app desktop browser at **1280 × 720**, using actual page controls and browser Back/Forward. This was not a replay of Claude's suite.

Page: https://theonetheonlythechad.github.io/mother-earth/timeline.html

## Results

| Requested check | Independent observation |
| --- | --- |
| Exact date label | **Pass:** Revision tl-2026-11-R3, released 24 Nov 2026 · What changed |
| What changed link | **Pass:** clicking navigated to #changes. The changes section began 64 px from the top, below the fixed header ending at 56 px. Browser Back returned to the unfragmented page. |
| Explorer | **Pass:** the default view drew five marks, with the fallback hidden. Initial view: 538.8–0 Ma. |
| End-Cretaceous story/image | **Pass:** opened from its explorer mark; heading received focus, the story panel opened and the NASA/JPL image loaded visibly. The image's complete flag was true and its intrinsic dimensions were nonzero. Current source was the released R3 PIA03379-fig1-1024.jpg under the site's assets/timeline/ path. |
| Back/Forward | **Pass:** after opening the story, one Zoom in set the view to 404.1–134.7 Ma. Back closed the story and restored the landing 538.8–0 view. Forward reopened the story/image and restored 404.1–134.7 without re-centering on its off-window mark. |
| Console | **Pass:** captured browser logs contained no errors or warnings at the initial inspection or after the full interaction sequence. |
| Visible layout | **Pass within this smoke:** label, explorer and story looked consistent with the reviewed page. No unexpected visual change or horizontal overflow was observed, including with the story open. |

A strict accessible-name lookup for the zoom button did not resolve through the browser tool. Inspecting the actual control showed its data-act=in attribute; clicking that observed control worked normally. This was a locator issue, not a page failure.

## Served-byte verification

Separately retrieved the live HTML and the exact script/stylesheet URLs observed in the browser DOM, with Cache-Control: no-cache. All answered HTTP 200 and match the accepted release identities:

| File | Bytes | SHA256 |
| --- | ---: | --- |
| timeline.html | 49,998 | 9fa7b4e62dc30a01af6d41808d98a288475389c082ad80fabadf30a356c8f5e9 |
| timeline.js?v=202612250500 | 60,015 | 55043697559b60d7470261afd88a790d0f07f1599c69165ee697788322d77524 |
| style.css?v=202612250500 | 83,189 | 6b6115b2eaeef6d2e882dee888372d10e660fa48bb9ae267dea83688eff12956 |

The byte verification used independent HTTP reads, not a hash of the browser's script-modified DOM. Script and stylesheet remain unchanged from the reviewed R3 release.

## Scope

This closes the requested independent W1 live smoke. It is a focused functional/visual check, not a full regression, performance measurement or verification of every page region or cache combination. The reported merge identity was not independently re-audited through Git ancestry in this smoke.

Real phone, Safari, screen reader, true 200% zoom and the separately recorded live no-image/image-failure checks remain open. No-image and failure fixtures were not re-tested here; their previously accepted bounded suite coverage stands. No production setting, source, catalogue, account or data was changed. Only temporary browser navigation/view state changed. Earth from Space Stage D remains uncleared.

