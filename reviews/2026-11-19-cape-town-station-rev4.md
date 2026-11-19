# Review packet: cape-town-station-rc rev 4 (private preview)

19 Nov 2026 15:55 UTC (clock reading) · for GPT · branch `cape-town-station-rc` · code commit `3c660aa` (the packet is the next commit) · previous reviewed head `d540c5d` (packet `reviews/2026-11-17-cape-town-station-a1.md` rev 3)

**Scope (Chad, 19 Nov, his own message):** revise the private preview in three ways after GPT's home-network test (live aircraft, three ranges, zero-position, stale and down simulations, and the saved balloon replay all worked; OpenSky Online, 98 msg/s at 15:36 UTC on 19 Nov, as GPT reported). **Not authorised and not done:** Pi settings, outbound feeds, hardware purchases, public release, merge, deployment. Nothing here leaves the Mac; the page still reads only the receiver's own JSON through the local helper.

## 1. Non-aircraft emitters are separated from aircraft (`preview.html`)

**Evidence used, and only this:** the two fields the receiver's software documents for the purpose.
- `type` (readsb `README-json.md`): `adsb_icao_nt` is "messages from an ADS-B equipped 'non-transponder' emitter e.g. a ground vehicle, using a 24-bit ICAO address". The ground vehicle is the document's example, not a definition.
- `category` (same document: "emitter category to identify particular aircraft or vehicle classes (values A0 - D7)"; the values are DO-260B 2.2.3.2.5.2): A1 to A7 and B1 to B7 are things that fly; C1 and C2 are surface vehicles (emergency, service); C3 to C5 are point, cluster and line obstacles; A0, B0, C0, D0 are "no information"; B5, C6, C7 and D1 to D7 are reserved.

**Rule (`classify`), in order:**

| Feed says | Treated as | Counted and plotted as aircraft? |
|---|---|---|
| category C1 or C2, any type | surface vehicle (the category's own name is shown) | No. Listed under "Other emitters heard" |
| category C3, C4 or C5, any type | obstacle | No. Listed there |
| category A1 to A7, B1 to B4, B6, B7, any type (including `adsb_icao_nt`) | aircraft, on its category | Yes |
| no usable category (none sent, "no information", reserved, not a known value, not text) and type `adsb_icao_nt` | **kind not stated**: "a non-transponder ADS-B sender (vehicle or aircraft)" | No. Listed there, with the evidence |
| no usable category and any other type, or no type | aircraft, **on message type alone** | Yes, and the count line says how many |

- **Grounded aircraft are preserved.** `alt_baro: "ground"` never changes the class: an airliner taxiing with category A3, or a transponder entry with no category on the ground, is still drawn (grey) and listed as an aircraft.
- **Nothing is inferred** from altitude, speed or the ground flag. A moving, high `adsb_icao_nt` entry with no category stays "kind not stated".
- **What the page shows now:** the title, the plot, the aircraft table and "heard without a usable position" count aircraft only. A second table, "Other emitters heard (not counted or drawn as aircraft)", gives each other entry, what it is, the exact evidence ("category C2"; "type adsb_icao_nt; no category sent"), distance and position age. One line states the split: entries in the reading, counted as aircraft (and how many on type alone), not aircraft by category, kind not stated. A note explains the rule in plain words.
- **Choices that are Claude's and open to challenge:** (a) the "kind not stated" group is kept out of the aircraft count and off the plot instead of being drawn with a different mark; (b) B2 (lighter-than-air) and B3 (parachutist) are counted with the aircraft, as "things that fly"; (c) an entry with no category on an ordinary type is counted as an aircraft, stated as such, because Mode S entries never carry a category.
- **Not verified:** the classification against the live receiver's real `adsb_icao_nt` entries. The workspace cannot reach the Pi; what categories those entries carry is for GPT's home-network check (section 5).

## 2. Balloon wind is withheld across the top (`balloon.html`)
- `wind(F, i)` returns `{ none: 'transition' }` whenever its window (up to 30 s either side, never across a gap) holds a reading before the highest point received **and** one after it. A window that ends exactly at the top, all on one side, still gives an estimate.
- **Readout:** "no estimate here: the window around this reading runs across the highest point received, where the balloon stopped rising and began to fall". **Wind note:** the estimate assumes the balloon is drifting steadily with the air around it; at the top the balloon bursts and the sonde changes from rising to falling fast, so a straight line across that change would not be a wind.
- "Too few frames" keeps its own wording (`{ none: 'short' }`).
- **On the saved flight 55126368** (run on the Mac against the file there, positions only; nothing copied into the repo): 47 of 2,829 readings are withheld, from 28 s before the top to 28 s after; 2,782 keep an estimate; none is short.
- **Limit:** "the top" is the highest reading received. If the true burst fell inside a gap, the gap rule, not this one, is what stops the window.

## 3. Map labels keep clear of the path (`balloon.html`)
- `place()` tries a box on eight sides of each marker at six distances (14 to 114 px) and scores it by the number of drawn path pieces crossing it, leaving the map, covering another label, another marker, the scale bar or the north arrow. Lowest score wins; nearest on a tie; a label moved 20 px or more gets a dashed leader line. The same flight always gives the same placement; the slider does not move labels.
- The three labels are now on two lines each (shorter boxes).
- **On the saved flight:** all three labels sit 14 px from their markers with no path piece crossing them and no overlap (page's own boxes and an independent sampled check agree).
- **Limits:** box sizes are estimates from the fixed-width font (6.7 px a character); the suite checks they are not smaller than the text Chromium drew, on Linux fonts only. When the path fills the map no clear spot exists and some overlap remains (tested, stated). The slider's own dot can pass over a label.

## 4. Tests
Run from `station/cape-town/`: `NODE_PATH=/opt/npm-tools/node_modules node preview.test.cjs` and `… node balloon.test.cjs`. Both use the real `preview.mjs` and pages, with a fake receiver or a synthetic flight; no network.

| Suite | Before | Now | New cases |
|---|---|---|---|
| `preview.test.cjs` | 50 | **67 of 67** | 17: mixed feed (service vehicle, obstacle on an ordinary type, two unstated non-transponder entries, a glider on the non-transponder type, a grounded airliner) at 320 km, 40 km and `sim=zero`; six `classify` tables; one control |
| `balloon.test.cjs` | 24 | **43 of 43** | 19: withheld at the top on both parts of the flight, 28 s and 30 s before it, a whole-flight check against an independently written rule (29 readings at 2 s cadence), the note; label boxes the browser drew against the path, each other and the map; seven `place` and `crosses` cases; one control |

- **Controls (the old code must fail):** the reviewed pages at `d540c5d` are served from git beside the new ones on the same inputs. Old aircraft page: "9 aircraft plotted", vehicles and obstacle among them (new: 6). Old balloon page: path points lie under the labels and a wind figure is shown at the top.
- **All 74 earlier cases pass unchanged.** The existing fake feed carries no type or category, so every entry in it is an aircraft on type alone, as before.
- **Other suites:** not run. No file outside `station/cape-town/` and this packet changed (`git diff --stat d540c5d`), and the station pages share no code with the site's pages.
- **Not tested:** the live receiver; macOS fonts; a real phone; a screen reader.

## 5. For GPT on the home network
1. Start the revised helper from the review copy, pointing it at the saved flight: `cd ~/Documents/"Mother Earth"/_review/cape-town-station-rev4 && BALLOON_DIR=~/mother-earth/cape-town/balloon node preview.mjs` (Chad, one Terminal command). The runtime copy in `~/mother-earth/cape-town/` is untouched and still the 17 Nov version.
2. Aircraft page: read the count line and the "Other emitters heard" table against the raw feed (`http://adsb-feeder.local:8080/data/aircraft.json`). For each `adsb_icao_nt` entry, note its `category`. Is any real aircraft landing in "kind not stated", or any vehicle among the aircraft on type alone?
3. Balloon page: slide to the top on both parts of the flight (no wind figure, with the reason); look at the three map labels on a Mac screen.
4. OpenSky dashboard still Online afterwards. Pi settings are not touched by any of this.

## 6. Files
| File | sha256 |
|---|---|
| `preview.html` | `5e53246daa53c2cb…1a7c` |
| `balloon.html` | `55051d980c48c89b…76b6` |
| `preview.mjs` | `68723f1d2d88a8b3…ab1d` |
| `fetch-flight.mjs` | `93f3f080a940a886…d567` |
| `preview.test.cjs` | `04105376bb8e67b2…c34a` |
| `balloon.test.cjs` | `14dfeb708bea051a…fe59` |

Sources read for section 1 (19 Nov): readsb `README-json.md` (github.com/wiedehopf/readsb); the DO-260B emitter category list as published by ADS-B Exchange.
