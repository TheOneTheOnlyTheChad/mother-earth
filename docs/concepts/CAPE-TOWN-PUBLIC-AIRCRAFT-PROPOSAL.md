# Proposal: a public "Aircraft seen by our Cape Town receiver" toggle

19 Nov 2026 16:37 UTC (clock reading) · rev 1 · for GPT review · **documents only.** Nothing here is built, installed, enabled, deployed or spent. Each later step needs Chad's own go or Approve line.

**Chad, 19 Nov (his own message, carrying GPT's brief):** a docs-only proposal for a public globe toggle, off by default; positions, altitude and direction, no aircraft identifiers, no public tracks or history; compare direct Pi-to-hub delivery with the Mac collector before recommending either; assess a 30 to 60 second cadence with explicit observation ages and withdrawal of expired positions; protect the receiver's location throughout the public payload and explain the remaining inference risk; return architecture, privacy and rights assessment, costs and an implementation plan. Animals stays parked. The saved balloon replay stays private. **Not authorised:** outbound feed activation, spending, Pi changes, collector deployment, hub deployment, public merge.

**Where this starts from:** the private preview on `cape-town-station-rc` `8012a0f` (GPT pass, 19 Nov) reads the Pi's own readsb JSON on the home network through a helper on the Mac. Its classification rule (what is an aircraft) is accepted and is reused here unchanged. Nothing from that preview can be merged to make a public layer: the public page has no route to the Pi.

## 1. What the visitor gets
- One switch on World View and in the Layers panel: **"Aircraft seen by our Cape Town receiver — show on the globe"**, off on load, described by its own evidence line, counted in the Key only while drawn.
- A dot per aircraft at its last reported position, coloured by altitude band, with a heading tick when a direction was sent.
- A card line with the snapshot's age and count, in the site's existing words: "Snapshot of HH:MM:SS UTC (N s ago) · N aircraft with a current position".
- Scope sentence, always shown with the layer: "Aircraft heard by one receiver in the Cape Town area. Terrain, the antenna, an aircraft's height and whether it sends a position decide what appears. An empty sky here is not an empty sky."
- **States:** live; no fresh reading (the last snapshot is too old: nothing drawn); feed off (the hub says so); hub unreachable. Old positions are never left on the globe as if current.
- **Not shown, anywhere:** callsign, registration, ICAO address, squawk, type code; a line joining positions; any earlier snapshot.

## 2. Public payload
Built **at home, before anything leaves the house**, by one pure function (`buildPublic`), so the hub never receives the fields below marked "never sent".

| Field | Published as | Why |
|---|---|---|
| position | lat, lng rounded to 0.01° (about 1.1 km) | the step the OpenSky positions layer already uses |
| altitude | rounded to 100 m; "ground" entries are not published (section 5) | band colour needs no more |
| direction | track rounded to 10°, or absent | a heading tick needs no more |
| observation age | whole seconds at build time, per aircraft | explicit ages (GPT) |
| snapshot time, aircraft count | one each | freshness and the card line |
| order of records | sorted by lat then lng | no stable order from one snapshot to the next |
| **never sent** | ICAO address, callsign, registration, squawk, category, type, speed, vertical rate, signal strength (`rssi`), distance and bearing from the receiver (`r_dst`, `r_dir`), message counts, receiver clock, receiver coordinates (`receiver.json`), hostname, station or feeder identifiers, software versions | identifiers; and everything that states or measures from the centre |

- **Which entries:** only those the accepted rule classifies as aircraft, with a position no older than 60 s. Surface vehicles, obstacles, B3 and "kind not stated" entries are not published, not even as a count (section 5 explains why).
- **MLAT positions are excluded** (type `mlat`). A multilateration position is computed by a network's servers from several receivers, so it is not purely our own observation and would carry that network's terms. None is expected today (only OpenSky is fed); the exclusion makes that a rule.
- **The hub refuses anything else.** `/ingest/station` accepts exactly this schema and rejects a payload carrying any other key, so a faulty uploader cannot leak a field.

## 3. Delivery: Mac collector or Pi direct

| | A. Mac collector reads the Pi and uploads | B. Pi uploads directly |
|---|---|---|
| What changes | `collector-mac.mjs` and `run.sh` on the Mac (a new job beside ships and aircraft counts) | one small script and a timer on the Pi. The Mac is not involved |
| When the layer has data | only while the Mac is awake and at home. Chad does not leave the Mac running when he is out, so the layer would read "no fresh reading" for much of most days | whenever the Pi and the home connection are up |
| Fits the standing rule "public features must not depend on the Mac" | no (ships has a hub fallback; this would have none, because the hub cannot reach the Pi) | yes |
| Cadence | the Mac's tick is once a minute; 30 s needs a second run inside the tick; ships sampling (60 s windows) has priority and would delay it | any; a timer every 30 or 60 s |
| Pi workload | one extra local read a cycle, as the private preview already does | one local file read, one small filter, one HTTPS POST of about 1 to 3 KB a cycle. Expected to be negligible on a Pi 4; **not measured** |
| Risk to OpenSky feeding (the aircraft layers need the receiver Online) | none: the Pi is untouched | low but real: it is a change on the device that feeds OpenSky. Kept apart from the feeder software: reads the JSON only, own unit, CPU and memory limits, no change to readsb or its settings |
| Secret | the existing `INGEST_KEY` already on the Mac | a new key on the Pi. **A separate key that the hub accepts only on `/ingest/station`**, so a lost Pi key cannot write ships or aircraft |
| Survives feeder updates | not affected | **not verified.** The ADSB.im image updates its OS, containers and web UI, optionally every night. Where a custom unit must live to survive that is to be checked on the device before any install |
| Rollback | remove a switch file on the Mac | hub kill switch first (`STATION_ENABLED` removed: uploads refused, layer withdrawn within one poll), so rollback never needs the Pi; then disable the timer at home |
| Home access needed to fix it | no (the Mac is where Chad is) | yes: there is no remote link to the Pi, by design |
| New cost | none | none |

- **Not offered:** the hub pulling from the Pi. It would need the Pi reachable from the internet (a port, a tunnel or a VPN): more exposure, more change on the Pi, and a remote link Chad has not chosen to have.
- **Recommendation: B, Pi direct, as the public design**, because a public switch that is dead whenever the Mac is closed would mostly show "no fresh reading", and because it meets the standing rule. **But not first.** Stage 1 (section 8) changes neither device: it builds and tests `buildPublic` and runs the location study on readings captured privately. The Pi install is one reviewed step, with Chad at home, after GPT has seen the exact script.
- **If Chad prefers no Pi change at all:** A works, and the page would say plainly when it has no fresh reading. The hub route and the page are the same for both, so starting with A and moving to B later costs only the uploader.

## 4. Cadence, ages, withdrawal

| | Proposed | Note |
|---|---|---|
| Upload interval | **60 s to start**; 30 s as a later setting | at 60 s a jet at cruise moves about 13 km between snapshots: dots jump, they do not glide. 30 s halves that and doubles the writes. Both cost nothing extra at present (section 7) |
| Page poll, while the switch is on and the tab is visible | same as the upload interval | no polling while off or hidden, as the other optional layers |
| A position's own age limit | 60 s at build time | as the private preview (`DROP_S`) |
| Snapshot withdrawn by the hub | when older than 3 intervals (180 s at 60 s) | the hub answers "no fresh reading" with the last snapshot time and no records |
| Page stops drawing | at the same limit, on its own clock, whatever the last poll said | as the preview's "expired" state |
| Stored | the newest snapshot only, overwritten. **No dated copy, no history rows** | "no public tracks or history"; see section 6 on re-linking |

The 60 s, 3 intervals and 100 m figures are Claude's starting numbers, not measurements.

## 5. Protecting the receiver's location
**What is already said in public by choice:** that the receiver is in the Cape Town area. The aim is that the payload does not narrow that to a building or a street.

**How one receiver's output gives its position away, in order of strength:**
1. **Direct statements:** receiver coordinates, distance and bearing per aircraft, a marker at the centre. Removed entirely (section 2). The private preview's "our receiver" dot, range rings and "From receiver" column do not exist in the public layer.
2. **The low-altitude edge.** An aircraft low down is only heard nearby and with a clear line of sight. Over days, the lowest altitude heard at each place draws a cone whose tip is the receiver, and terrain shadows (which side of a mountain is dark) sharpen it. This is the strongest indirect signal.
3. **Aircraft and vehicles on the ground.** Hearing them means line of sight to a particular apron or runway.
4. **The outer edge of coverage at cruise height.** Roughly centred on the receiver, but coarse (hundreds of kilometres across).
5. **Outage timing.** Gaps that match a neighbourhood's scheduled power cuts or one provider's faults point at an area.
6. **Other public places.** Whatever OpenSky's own pages show for this receiver, and anything else Chad has published. **Not checked**; a read-only check belongs in stage 1.

**Measures proposed:**
- Nothing on the ground is published: no `ground` entries, no surface vehicles, no counts of them.
- **An altitude floor:** aircraft below it are not published. The floor is the main control and the main trade-off: a low floor shows arrivals and departures at Cape Town International, which is the interesting part, and gives more away; a high floor shows mostly overflights. **Proposed: decide it from the study below, not by guess.**
- Positions at 0.01°, altitude at 100 m, no speed, no signal strength.
- No "heard without a position" count (it measures short-range reception).
- The hub gives no reason for an absence beyond "no fresh reading", and publishes no uptime figure.
- The repository and the page never name the suburb, the building, the antenna height or the receiver's serial (standing rule).

**The study (stage 1, private, no upload):** capture the Pi's readings on the Mac for several days, run `buildPublic` over them at candidate floors (for example 0, 600, 1,500 and 3,000 m), then **attack our own output**: estimate the receiver's position from the published fields alone and report how far the estimate lands from the true position for each floor. The result (a distance per floor, not the coordinates) goes to GPT and Chad. **Proposed gate:** no public release unless the chosen floor leaves an error Chad accepts; the threshold is his decision (D4).

**What remains, stated plainly:**
- The payload cannot be made location-free and still be this layer. Anyone who collects the public snapshots for long enough can estimate where the receiver is. How closely is **unknown until the study is run**; Claude's expectation, unmeasured, is district level at a moderate floor, and closer at a low one.
- The study measures the attack we think of. A better method, or data combined from elsewhere (item 6), could do better than our estimate.
- Outage timing cannot be hidden while the layer is honest about having no fresh reading.

## 6. Privacy and rights
- **Whose data:** signals aircraft broadcast in the clear, received by Chad's own equipment. No provider's API is involved, so no provider licence applies to the positions. OpenSky's API conditions (ticket #837506) govern data **from OpenSky**, not our own reception; **to confirm** by reading OpenSky's feeder terms for any condition on a feeder's own use of its raw data (read-only, stage 1).
- **Aircraft privacy:** leaving out identifiers does not make an aircraft anonymous. Position and time can be matched against any public tracker, and at 30 to 60 s consecutive snapshots can be joined by eye into a track although none is published. The layer therefore reveals nothing the public trackers do not; the reason to omit identifiers is that Mother Earth shows what was observed and is not a tracking service.
- **Flights some networks hide** (state, military, police, medical, owner-requested blocks): with no identifiers the layer cannot tell them apart, so they would appear as dots like any other. Whether that is acceptable is Chad's decision (D6). Filtering them would need the identifiers and a block list at home, which is its own piece of work.
- **South African law:** not assessed. Claude is not a lawyer and has read no South African source on receiving or republishing ADS-B. Publishing positions without identifiers is common practice worldwide; that is an observation, not a clearance.
- **REGISTER:** a new entry ("our own receiver"), filed on Chad's Approve line with the release: what is published, the rounding, the floor, the age limits, no identifiers, newest snapshot only, the stop procedure.
- **Sources page:** a section saying it is our own observation, what limits it, and what is withheld and why.
- **History:** the hub's history collection would not include this layer. Keeping even hourly counts is a separate decision (D7).

## 7. Cost
| Item | Use at 60 s | Use at 30 s | Allowance (read 19 Nov; confirm on Cloudflare's own pages before build) |
|---|---|---|---|
| Worker requests, uploads | about 43,200 a month | about 86,400 | 10 million a month included in Workers Paid, then $0.30 a million |
| R2 writes (one overwrite per upload) | about 43,200 | about 86,400 | 1 million Class A a month free across the account, then $4.50 a million |
| Worker requests and R2 reads, viewers | 60 an hour per open page with the switch on | 120 | reads: 10 million Class B a month free, then $0.36 a million. A short cache in the Worker would cut R2 reads to one per interval whatever the audience |
| Storage | one object of a few kilobytes | same | 10 GB free |
| D1 | none per upload | none | a state-change row only (feed started, stopped, refused) |

- **Expected new cost: $0.** No hardware, no new service, no plan change.
- **Not measured:** the account's current Class A use, which shares the 1 million allowance. To read from the dashboard in stage 1 before choosing 30 s.
- **Chad's time:** one session at home for the Pi install and its check (route B).

## 8. Implementation plan
Each stage ends with a packet for GPT. No stage starts without Chad's go; production steps need his Approve lines.

| Stage | What | Changes a device or production? |
|---|---|---|
| 0 | This proposal, GPT review, Chad's decisions D1 to D8 | no |
| 1 | `buildPublic` (pure, with its suite); private capture on the Mac of the Pi's readings (Chad starts it in Terminal, as he does the preview; files stay on the Mac); the location study; the read-only checks (OpenSky's public pages and feeder terms, how the feeder image keeps custom units, the account's Class A use, Pi load while a test script runs locally with no upload) | no upload, no Pi change, no hub change. The capture is a local script on the Mac |
| 2 | Hub: `/ingest/station` (scoped key, strict schema, newest only, withdrawal, `STATION_ENABLED`), `/snapshot/station`; suites with breaks. Page: `station.js`, switch, card, Key entry, Layers row, Sources section; suites. All on a branch | no |
| 3 | The uploader script for the chosen route, reviewed line by line by GPT before it is installed anywhere | no |
| 4 | Release, in this order, each on its own Approve line: hub deploy (route present, feed refused while `STATION_ENABLED` is unset) → key set → uploader installed (Chad at home) → `STATION_ENABLED=1` → private check of the live hub from the branch page → REGISTER → page merge → served-hash check → GPT smoke | yes, each step |

**Rollback, at any point after stage 4 begins:** remove `STATION_ENABLED` (uploads refused; the hub answers "feed off"; the stored snapshot is deleted by an admin route); revert the page merge; disable the timer at home. The first of these needs neither the Pi nor the Mac.

## 9. Decisions for Chad
| | Decision | Claude's recommendation |
|---|---|---|
| D1 | Route: Pi direct (B) or Mac collector (A) | B, after stage 1; A if no Pi change is wanted |
| D2 | Cadence | 60 s first; 30 s once the write count is read |
| D3 | Rounding: 0.01°, 100 m, 10° | as listed |
| D4 | Altitude floor and the acceptable location error | set both from the stage 1 study |
| D5 | May this layer and the OpenSky positions layer be on together | yes, in different marks; each says what it is |
| D6 | Flights other networks hide appear as unnamed dots | accept for a first release, stated on the Sources page; revisit if it troubles him |
| D7 | Any history (for example hourly counts) | none for now |
| D8 | The wording "Cape Town" in the layer's name | keep: it is the point of the layer and is already public |

## 10. Not verified
- Anything about the Pi beyond what the private preview showed: load, how a custom unit persists, what its `receiver.json` exposes on the home network.
- How well the receiver can be located from the public payload (the study is stage 1).
- What OpenSky's public pages show for this receiver; OpenSky's feeder terms on a feeder's own data.
- Cloudflare's current prices on its own pages; the account's present R2 write count.
- South African law.
- A real phone and a screen reader, for the private preview and for anything built from this.

**Sources read for this proposal (19 Nov 2026):** readsb `README-json.md`; the ADSB.im "Additional options" page (root SSH key entry; automatic updates of OS, containers and web UI); Cloudflare's "How charges accrue" page and secondary summaries of Workers and R2 pricing.
