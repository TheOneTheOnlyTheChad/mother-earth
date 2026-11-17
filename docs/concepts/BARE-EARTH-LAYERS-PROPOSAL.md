# Bare Earth first: every map layer a switch — proposal

**Rev 2, 17 Nov 2026 16:47 UTC (clock reading). Proposal only: no code, no branch. Rev 1 was reviewed by GPT (relayed by Chad, 17 Nov); Chad answered question 1. §0 records the decisions and governs where it differs from the text below.**

## 0. Decisions after rev 1
- **Truly bare at load (Chad, 17 Nov, his own words):** "you land at mother earth naked as she stands and then you start turning on all the different layers, she is striking as she is and then layer by layer you switch things on and off start discovering all these things". The first look is the Earth; the layers come after. No layer is on by default, not even earthquakes. (Answers question 1.)
- **First view (GPT):** keep the dated Earth imagery and the reading cards; show "Choose layers to explore" with a visible **Layers** button, on phones too. Bare must read as an intended starting point, not as a page that failed to load. This replaces the wording in P4.
- **Remembered choices (GPT: yes, if Chad wants returning visitors to resume their view; Chad has not yet said):** the rule would be **first visit starts bare, later visits restore the choices**. Only recognised layer ids are saved; unavailable storage is handled (the page starts bare); "Switch everything off" saves the empty selection; a short note beside the controls: "Layer choices are saved in this browser". This sharpens P5. **Open: Chad's yes or no.**
- **Place view and search (GPT):** opening a place shows the available observations and respects the current map switches (it does not switch layers on). Selecting a specific search result switches its layer on and focuses the result, with visible feedback such as "Ships switched on." This settles §6.3.
- **Stage order (GPT): B → A → C,** then consider D. One kind of switch first, then the bare default, then remembering. This replaces §5's order.
- **Full-globe sheets (GPT): no blanket rule.** Wind over ocean heat may be a useful pair; opaque imagery can hide another layer. Which pairs conflict is decided from previews, pair by pair. Aircraft counts and positions stay exclusive (Chad). P6 and stage D are deferred.
- **Still open:** Chad on remembered choices; the phone design for the Layers button (§6.5); the count of browser suites that assume the core layers are drawn (§6.2); `localStorage` wording on Sources (GPT's "note beside the controls" may be enough).

## 1. What Chad asked (17 Nov 2026, looking at the aircraft preview)
"should we not turn every single tab/feature into a toggle because its starting to look messy, so basically you see earth as it stands bare and then you start toggling things"

The screenshot behind it: aircraft count blocks, aircraft dots, the coverage grid, fire and ship points all drawn at once over the same region.

## 2. The page today (read from `index.html` and `app.js` on main, 17 Nov)
- **On at load, drawn on the globe:** earthquakes, fire detections, ships, forest alerts (`const on = { usgs: true, firms: true, ships: true, forest: true, … }`), each with its coverage cells. Their cards are already tap-to-toggle (`card toggle`).
- **Off at load, each with its own switch:** drifting buoys, microplastic, day/night, ocean heat, Dust RGB, wind by height, aircraft counts, night lights, orbital objects, the Sky card, the Met catalogue card.
- **Never on the globe:** Kp, CO₂, sea ice (index cards).
- **Three different controls do the same job:** tap-a-card (the four core layers, buoys, microplastic), a labelled switch (`ovl-tgl`, the newer layers), and class toggles (orbital).
- Nothing a visitor switches on is remembered: a reload returns to the four core layers.

## 3. Proposal
**P1. Bare Earth at load.** No data layer is drawn until it is switched on. The dated satellite picture and its label ("Imagery: … not live") stay: that is the Earth.

**P2. The numbers stay.** Every reading card keeps showing its count, state and time whether or not its layer is drawn (39 earthquakes, 20,064 fire detections, …). "See what was observed … and what remains unknown" is still met by the cards on first view; the map becomes the visitor's choice. Fetching is unchanged in this proposal (the core counts are still read every five minutes), so nothing about freshness or status wording changes.

**P3. One kind of switch.** Every layer that draws on the globe gets the same labelled switch (the `ovl-tgl` control: a real `role="switch"`, keyboard-operable, with its state word), in one list grouped by the evidence labels already on the page:
- *Observed:* earthquakes · fire detections · ships · forest alerts · drifting buoys · microplastic · aircraft (counts or positions) · night lights · Dust RGB
- *Analysed / modelled:* ocean heat · wind by height
- *Computed:* day/night · orbital objects · the Sky view
Each switch keeps its own card text below it, as now. Tap-a-card goes away for the six layers that use it.

**P4. A first-view line.** With nothing on, one line over the globe: "No layers are switched on. Choose what to show." linking to the list; the key reads "Key · no layers". It disappears when anything is on.

**P5. Remembered choices.** The set of switched-on layers is kept in the browser (`localStorage`, wrapped in try/catch; nothing is sent anywhere). A reload restores it. A "Switch everything off" button returns to bare Earth. If storage is unavailable the page simply starts bare each time.

**P6. Full-globe sheets one at a time (optional).** Ocean heat, Dust RGB, wind, night lights and aircraft counts each cover the globe with a sheet. Drawn together they hide one another. Proposal: switching one on switches the others in that group off, as aircraft counts and positions now do on `aircraft-dots-rc`. Points and cells (quakes, fires, ships, buoys, aircraft positions) can still be combined freely.

## 4. What does not change
The hub, every data file, collection schedules, evidence labels, status and freshness wording, Sources, and the Timeline, Moon and Sun pages. No layer is added or removed.

## 5. Stages (each its own branch, review and Approve line)
- **A. Default off + first-view line + key wording.** Small in the page; large in the tests (below).
- **B. One list, one switch.**
- **C. Remembered choices and "Switch everything off".**
- **D. Sheets one at a time,** if P6 is accepted.

## 6. Risks and unknowns (not yet measured or checked)
1. **The first view shows less.** A new visitor sees a globe with nothing on it. The cards carry the numbers, but on a phone the cards are below the globe in the Readings sheet. Whether the first-view line is enough has not been tried on anyone.
2. **Tests.** Most of the 38 browser page suites load the page and expect the four core layers to be drawn (legend, key count, cell performance, place view, search). Stage A will change many expectations. The number has not been counted; it sets the size of stage A.
3. **Place view and search** open records from layers that may now be off. Rule needed: opening a place or a search result for a layer switches that layer on (and says so), or lists it without drawing.
4. **Performance** should improve at load (fewer objects drawn); not measured.
5. **Phone layout:** where the list sits (in the Readings sheet, or its own "Layers" button beside "Key"). Not designed.
6. **Shared links:** a link cannot yet carry which layers are on. Out of scope here; say if it should be in.

## 7. Questions
**For Chad**
1. Truly bare at load, or one layer on (say earthquakes) so the globe is never empty for a first visitor?
2. Remember choices in the browser (P5): yes or no?
3. Sheets one at a time (P6): yes or no?

**For GPT**
4. Does bare-at-load sit within the page's promise if the cards keep their numbers (P2), or does the first view need more?
5. Is `localStorage` for layer choices acceptable as described, and is there anything to state on Sources about it?
6. Rule for place view and search when a layer is off (§6.3): which behaviour?
7. Stage order: is A → B → C → D right, or should B come first so the tests are rewritten once?
