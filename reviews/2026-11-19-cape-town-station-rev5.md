# Review packet: cape-town-station-rc rev 5 (private preview)

19 Nov 2026 16:09 UTC (clock reading) · for GPT · branch `cape-town-station-rc` · code commit `fc92037` (the packet is the next commit) · follows rev 4 (`8f1927c`, packet `reviews/2026-11-19-cape-town-station-rev4.md`)

**GPT's review of rev 4 (relayed by Chad, 19 Nov):** balloon wind and Mac label repairs accepted; aircraft classification returned for two corrections. GPT's own checks: the six packet hashes matched; the real `adsb_icao_nt` entries (DUB14N, TXLU 3, TXLU 2, TXLU 1, DUB14P) all carry category C0 and appeared as kind not stated; grounded airliners stayed in; no wind figure at the top on either part of the flight; 47 withheld readings, 28 s either side; the three map labels readable and clear of the path on the Mac; OpenSky Online, 85 msg/s, 16:02 UTC. GPT did not rerun the 67 and 43 browser suites.

**Scope of rev 5:** the two corrections, in `preview.html` and its suite only. **`balloon.html` and `balloon.test.cjs` are byte-identical to rev 4** (hashes below). Not authorised and not done: Pi settings, outbound feeds, hardware, public release, merge, deployment.

## 1. B3 is an other emitter; B5 is out of the explanation
- Category **B3** is listed under "Other emitters heard" as "Parachutist or skydiver" with evidence "category B3", on any message type or none. It is not counted, plotted or listed as an aircraft.
- **B2** (lighter-than-air) stays an aircraft, as accepted.
- The explanation on the page now reads: "A1 to A7, B1, B2, B4, B6 and B7 are aircraft …", names B3 with the surface vehicles and obstacles, and lists B5 with the reserved values. "B1 to B7" is gone (the suite checks it stays gone).
- B5 was already treated as not usable by the code; that is unchanged.

## 2. The catch-all is replaced by an explicit list
With no usable category, an entry is an aircraft **only** when its message type is on this list:

| Type | Why it is on the list |
|---|---|
| `adsb_icao` | readsb: "messages from a Mode S or ADS-B transponder, using a 24-bit ICAO address" |
| `adsb_other` | readsb: "messages from an ADS-B transponder using a non-ICAO address" |
| `mode_s` | readsb: "ModeS data from the planes transponder (no position transmitted)". This keeps Mode S aircraft, which never send a category |
| `mlat` | **Claude's inclusion, not readsb's words.** readsb says only "MLAT, position calculated arrival time differences using multiple receivers". It is listed because the method works on transponder signals |
| `adsc` | **Claude's inclusion, not readsb's words.** readsb says only "ADS-C (received by monitoring satellite downlinks)". It is listed because ADS-C is reported by aircraft avionics |

Everything else without a usable category is **kind not stated**, kept out of the aircraft count and plot, and listed with its evidence:

| Entry | Label shown | Evidence shown |
|---|---|---|
| type `adsb_icao_nt` | "a non-transponder ADS-B sender (vehicle or aircraft)" | "type adsb_icao_nt; category C0 (no information)" |
| types `adsr_icao`, `adsr_other`, `tisb_icao`, `tisb_other`, `tisb_trackfile`, `other` | "this message type does not say what sent it" | "type tisb_icao; no category sent" |
| a type readsb does not document | "the message type is not one readsb documents" | "type <value> (not a documented value); …" |
| no type, or a type that is not text | "the entry carries no message type" | "no message type sent; …" |

- **If GPT wants the list to be readsb's wording only**, `mlat` and `adsc` come off by deleting two names from `AIR_TYPES`. On this receiver `mlat` entries can only appear if a multilateration client feeds results back; none was configured by this work.
- **Left off on purpose:** the rebroadcast (`adsr_*`) and traffic-service (`tisb_*`) types, whose targets readsb's text does not limit to aircraft, and `other`, which readsb documents as "quality / source is unknown".
- A usable A or B category still makes an aircraft whatever the type, including no type.
- The ground flag, altitude and speed still decide nothing.

## 3. Tests
`NODE_PATH=/opt/npm-tools/node_modules node preview.test.cjs`: **74 of 74** (rev 4: 67). `balloon.test.cjs`: 43 of 43, rerun, files unchanged.

- **New and changed cases:** the mixed feed gains a B3 parachutist, an entry with no type and no category, and a type `other` entry (16 entries: 9 aircraft, 7 of them on type alone; 3 not aircraft by category; 4 kind not stated; seven rows in the other-emitters table). `classify` tables: the five listed types; Mode S with no category, in the air and on the ground; no type, non-text type, undocumented type, `other`, `adsr_icao`, `tisb_icao`, `tisb_trackfile`; B3 on three types; B2; B5 on three types; A1 with no type; the exact label and evidence text for four cases; the explanation's wording.
- **Fixture change, stated plainly:** the suite's base fake feed used to carry no `type` at all, and the old catch-all counted it as aircraft. Each base entry now states a type, as the real feed does (`adsb_icao`, `mode_s`, `mlat`, `adsb_other`). The 50 original cases are otherwise unchanged and pass. Without this the base feed would, correctly, be all "kind not stated".
- **Control:** the `d540c5d` page on the same mixed feed plots 12 "aircraft" (new page: 6).
- **Not verified here:** the live receiver (GPT's home-network check); real phone; screen reader.

## 4. For GPT
Same command as rev 4, from the new folder: `cd ~/Documents/"Mother Earth"/_review/cape-town-station-rev5 && BALLOON_DIR=~/mother-earth/cape-town/balloon node preview.mjs`. On the live feed: the five C0 entries should still read kind not stated; check that no real aircraft has moved there (any entry whose type is not one of the five listed and that sends no usable category would).

## 5. Files
| File | sha256 |
|---|---|
| `preview.html` | `ffd87343feef7c89…8fa1` |
| `balloon.html` | `55051d980c48c89b…76b6` |
| `preview.mjs` | `68723f1d2d88a8b3…ab1d` |
| `fetch-flight.mjs` | `93f3f080a940a886…d567` |
| `preview.test.cjs` | `bf5330244783d262…d73b` |
| `balloon.test.cjs` | `14dfeb708bea051a…fe59` |

Source for the type and category wording: readsb `README-json.md` (github.com/wiedehopf/readsb, dev branch), read 19 Nov 2026.
