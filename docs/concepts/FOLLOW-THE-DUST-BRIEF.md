# Follow the Dust — brief (Chad's spec v1, filed verbatim 12 Nov 2026)

Spec written by Chad with GPT; brought to Claude 12 Nov 2026. Filed unchanged below the line.

---

MOTHER EARTH — FOLLOW THE DUST
Feature spec v1 · Proposed · $0/month in new recurring cost

Purpose
Let a reader see what happens when wind carries material from land out to sea. Follow the Dust is a collection of dated satellite observations, each with a place, an image and a short explanation of what the source identifies.

1. First release — Orange River, 25 September 2019

Event title: West Coast dust storm · 25 September 2019.
Observation: 12:25 UTC / 14:25 South African time · Suomi NPP / VIIRS.
Source: https://science.nasa.gov/earth/earth-observatory/dust-storm-in-southern-africa-145659/

Give the event a stable, shareable link from the globe. Opening it brings the globe to the Orange River mouth and the nearby Atlantic, and opens an image panel. The globe locates the event. The satellite image is where the reader follows the visible plumes. Closing the event returns the reader to the previous globe view and control.

Show the image without our annotations first. “Explain what I’m seeing” reveals two numbered callouts: the Orange River as a geographic reference, and one visible offshore plume NASA identifies as dust. Add a third only if it clearly identifies a second plume and helps the reader understand the event. Use matching text below the image so the explanation works without relying on colour or pointer position.

Keep the observation date, time, instrument, credit and NASA source link visible. Credit Lauren Dauphin / NASA Earth Observatory and retain NASA’s supplied data credit. Confirm reuse terms for the exact asset and record any resizing or cropping. The image and a short text explanation must remain available when the globe cannot render, with a direct source link if the image fails.

2. Evidence and imagery

Start with the NASA Earth Observatory image. Before building, return a small source packet with the exact image, provenance, reuse terms and a marked-up draft of the proposed callouts. Verify the map location separately. The Orange River marker is a geographic reference and should carry no claim about where the dust originated.

Use image-relative annotation positions in the panel. Paint imagery onto the globe only when the exact observation and its georeferencing are verified and the projected coastlines line up at the opening zoom. A matching date and instrument in Worldview are leads. The published image panel is the complete first-release design.

Describe the shapes and extent visible at the time of the pass and attribute the dust identification to NASA. A single image does not establish ground-level concentration, the full route or what happened between passes. Cloud, obscured areas and gaps in coverage are unknown. Avoid arrows or animation that imply a measured trajectory.

3. Build once, add events as data

Use one viewer with a small static event manifest. Each event carries a stable ID, title, map location and opening view, plus an ordered list of observations. Each observation carries its own date or timestamp at the precision the source supports, instrument, pinned image, credit, source link, caption and annotations. Start with one event and one observation. Add later events through the manifest and image assets.

Load the image only when the event opens. Test a compressed copy that keeps the plumes legible on a phone. Keep the original source link available. Use static hosting for the first collection, with zero new recurring cost. Keep the proof of concept off production and bring it back for review and a separate release approval.

4. What counts as finished

First release: a reader opening the event cold can tell where it happened, when it was observed, and which part of the image NASA identifies as dust. They understand they are seeing one pass. Verify on desktop and a real phone that the plume is easy to see, annotations stay aligned as the image resizes, keyboard navigation works, and the source is easy to find. Verify the fallback and that the normal globe load makes no event-image request.

First collection: add Namibia (11 July 2023) and the Saharan Atlantic plume (18 June 2020), subject to the same source review. Both should work through the existing viewer by adding records and assets. Provide a simple event list and verify that every direct event link still works. This is the finish line for the first collection.

Later, add a before/during/after comparison when an individual event has separately dated, comparable frames. Show the time and source on each frame and make gaps clear. A live dust layer is a separate decision.

Next step for Claude: return the Orange River source packet, the proposed globe entry point, and a short implementation plan for the first release. Source and design review only at this stage.