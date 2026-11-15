# Mother Earth · "Lit as now" on the Moon globe

**Rev 2.1 · 15 November 2026 · passed GPT's docs review · docs only**

Rev 2.1 adds §10: GPT's acceptance clarifications for the branch (no design change).

Rev 2 applies GPT's review of rev 1 (relayed by Chad, 15 Nov): device clock only; near-flat shading with a narrow edge; a distant camera for the Earth view; like-for-like Horizons comparison; new both-on wording. Changes are listed in §9.

Add an off-by-default **Lit as now** control to the Moon globe on `moon.html`. When on, the globe is lit from the direction of the Sun at the current UTC minute, and the readout says where the Sun and the Earth stand over the Moon and how much of the Earth-facing disc is lit. This is the addendum that `MOON-SUN-GLOBES-PROPOSAL.md` §3.1 requires before lighting is added. Nothing is built until Chad's own go. Live LRO positions are not part of this.

## 1. What a visitor sees

- The globe still opens **evenly lit on the near side**, exactly as today. A new button, **Lit as now**, sits with the globe controls (off by default; `aria-pressed`).
- On: the globe is shaded from the calculated sub-solar direction, fixed to the Moon's surface, so turning the globe shows day, night and the line between them where they are at this minute.
  - **Day side near-flat** (the map at even brightness, as today), **night side at a faint floor**, and a **narrow transition centred on the calculated day–night line** (proposed half-width 1°; the real Sun's disc already blurs the line by about ±0.27°).
  - The night floor is labelled: "Night side shown faintly as a display aid; this is not earthshine."
  - The day/night decision is a mask computed from the sub-solar direction alone, so it can be tested without reference to how bright the map is at any spot.
- A second button, **As seen from Earth now**, turns the view to the calculated sub-Earth point and switches to a **distant view** (see "Earth view camera" below), so the disc on screen shows the phase and libration as from the Earth's centre. Words beside it: "from the Earth's centre, Moon's north up — not how it is tilted in your sky." Any other view button, drag or zoom returns to the ordinary close camera.
- Readout, updated in place (same focus rules as the LRO readout):
  - **Sunlight calculated for 15 Nov 2026 03:20 UTC · device clock**
  - Sun overhead at [lat] [lon] · Earth overhead at [lat] [lon]
  - [nn.n]% of the Earth-facing disc is lit
  - "Calculated, not observed. A smooth sphere: no crater shadows, no earthshine, no eclipses. The position of the day–night line is the calculated thing. Moon orientation and Sun and Earth positions: JPL DE440 via NAIF."
- Evidence label: `Computed` (`.ev.comp`), never `Observed`.

### Two clocks, kept apart

The dated LRO path keeps its own heading and time ("Dated LRO example · 10–11 June 2026 UTC … [selected minute]"). The lighting has its own line and time ("Sunlight calculated for … UTC · device clock"). Each time sits next to its own control: the selected LRO minute with the LRO readout, the lighting minute with the lighting readout. While both are displayed, one extra line shows: **"Lighting uses the current UTC minute. The LRO path is a dated example from 10–11 June 2026."** Neither control changes the other. Lighting the globe for the LRO example's own minute is a possible later change and is out of scope here.

## 2. Sources and calculation

Reuse the frame already verified for the LRO path: **`MOON_ME_DE440_ME421`** (NAIF `moon_de440_250416.tf`, `moon_pa_de440_200625.bpc`, `naif0012.tls`, SpiceyPy 8.0.0 / CSPICE N0067; the texture's Mean Earth, east-positive convention was confirmed by GPT last round).

| Quantity | Source and definition |
| --- | --- |
| Sun direction | JPL DE440 positions. Direction from the Moon's centre to the Sun, in the Moon-fixed frame, as the light arriving at the Moon at time t (SPICE `spkpos('SUN', t, frame, 'LT+S', 'MOON')`). |
| Earth direction | JPL DE440. Direction from the Moon's centre to the Earth's centre, same frame, geometric at t. |
| Sub-solar / sub-Earth point | Planetocentric latitude and east longitude of those two directions on the 1,737.4 km sphere. |
| Lit fraction | (1 + cos i) / 2, with i the angle between the two directions. Geocentric, sphere, point Sun. |
| Day–night line | The great circle 90° from the sub-solar point. Not stored; it follows from the light. |

The convention difference between "light arriving" and purely geometric is about 0.006° for the Sun and 0.0002° for the Earth; both are stated in the packet and neither is visible.

### Where the page gets the numbers (decision D1)

| Route | How | For | Against |
| --- | --- | --- | --- |
| **B. Fixed catalogue (recommended for the first release)** | The existing offline generator writes sub-solar and sub-Earth points every 6 hours, **1 Jun 2026 to 1 Jan 2028 UTC** (2,317 samples, about 75 KB), as a pinned same-origin file `assets/moon/moon-light-2026-06-R1.json`. The page interpolates the two unit vectors between samples. | Page only. One release step. The page shows values from the already-reviewed pipeline. Fails independently of the hub. | Coverage ends 1 Jan 2028 (same end as the Sky catalogue). Renewal is a rebuild. |
| A. Formula in the page | IAU rotation model for the Moon plus truncated Sun and Moon series, checked against the SPICE reference over a date range (the Earth page's day/night line works this way). | Never expires. No file. | A second, different rotation model in the page; more code and a wider check to review. |
| C. Hub, daily from Horizons | One more Horizons request in the existing daily skycraft job (Moon, quantities 10, 14, 15, a few days ahead). | Rolling coverage; hub-first. | Hub deploy and schedule approvals; lighting then depends on the hub and on Horizons each day. |

B is the smallest step that reuses the verified rotation directly. A or C is then the renewal path, chosen well before 2028 and recorded as an open item on release. The start date of 1 June 2026 is deliberate: the build must reproduce the already-reviewed June rotation inside the new range.

### Earth view camera

In the ordinary view the camera sits 3.2 Moon radii from the centre on desktop (3.6 on a phone). From that close it sees less than half the sphere, and the lit share of the disc on screen is not the phase. Calculated for this proposal (GPT's figure reproduced): a 75% phase covers **84.1%** of the rendered disc at 3.2 radii and 83.0% at 3.6; a 25% phase covers 15.9%. At 100 radii the same phases render as 75.3% and 24.7%.

So the Earth view uses the same camera moved to **at least 100 Moon radii with the field of view narrowed** so the Moon keeps its size in the box (an "equivalent distant view"; expected error about 0.3 percentage points). The branch must show this works with the globe library's controls and clipping planes. **If it does not pass the phase test in §3, the button is deferred and the lighting toggle ships alone** (D4).

The "% lit" figure in the readout is always the geocentric calculated value, in either camera.

### Time and cadence

- **Clock:** the device's clock, shown to the minute in UTC and labelled "device clock". No comparison with hub times (a hub timestamp says when a file was produced, not what the time is).
- **Cadence:** recalculated on each UTC minute boundary and at once when the tab becomes visible. The sub-solar point moves about 0.0085° a minute. No network request after the catalogue is loaded.
- **Clock jumps:** recompute from the new minute. If the new time is inside coverage the lighting simply follows it (a correction to a valid time is recoverable); if it is outside, the evenly lit fallback applies until a valid time returns.
- **Pinned inputs:** the exact DE440 position inputs and orientation byte ranges are hashed and listed in `BUILD-moonlight.json`, and the build confirms they cover every catalogue sample from the first to the last.
- **Kernel inputs** come through the browser pane as hashed byte ranges of the full JPL files, as in the last thread (START-HERE §4z).

## 3. Evidence before release

| Check | Proposed acceptance |
| --- | --- |
| Rebuild | Regenerated bytes equal the shipped file; inputs and hashes in `BUILD-moonlight.json`. June 2026 rotation matrices equal those in `checks/moonfixed-checks.json`. |
| Independent calculation | Our own DE440 evaluator (ASCII coefficients, own Chebyshev and rotation code, extended from librations to the Sun, Earth and Moon), using the **same conventions** as the catalogue, against SPICE at every catalogue sample. Compared as the **angle between unit vectors**, before and after the catalogue's rounding: within **0.0001°**. |
| Horizons, sub-points | Moon (301) from the Earth's centre (`500@399`), observer quantities 14 and 15, at no fewer than 40 instants spread over the range including new, full and both quarters. These are apparent quantities tied to the Earth observer's time; the catalogue uses sunlight arriving at the Moon and a geometric Earth direction. So the check first recomputes our values **in Horizons' conventions** (its light time and aberration, modelled as last thread) and compares like with like: proposed gate **0.001°**. The residual against the catalogue's own conventions is reported **separately** and explained by the timing difference, not judged against the gate. Request, returned frame line and raw responses archived. |
| Horizons, lit fraction | Quantity 10 at the same instants, like for like first: proposed gate **0.01 percentage points**; catalogue-convention residual reported separately. |
| NASA SVS hourly table | `mooninfo_2026.json` (SVS 5587: hourly phase, sub-solar and sub-Earth longitude and latitude for 2026), Nov–Dec 2026 hours. **Cited, test-only corroboration, never shipped.** SVS's stated ephemeris (GPT reports DE421) and conventions are recorded from its documentation; offsets are reported as found, with no gate and no tuning. |
| Interpolation | The page's own JavaScript, run in the test, against SPICE truth at **every sample and the midpoint of every six-hour interval** across the whole range, as unit-vector angles after rounding: worst error reported, limit **0.01°**. |
| Day/night mask | Tested independently of texture brightness: the mask value is read for points 2° on the sunward side of the calculated line (must be day) and 2° beyond it (must be night), at eight positions around the line, including across the texture seam and near a pole, for at least three dated instants. The transition is centred on the line (mask at half value within 0.1° of it). Break: sub-solar direction moved by 5° must fail. |
| Rendered globe | The same points sampled from the rendered picture agree with the mask (day pixels at map brightness, night pixels at the floor). |
| Earth view | View centre equals the sub-Earth point. Share of rendered disc pixels that the mask marks as day is within **2 percentage points** of the calculated lit fraction at a crescent, a quarter and a gibbous date. The same measurement in the ordinary close camera is recorded to show why the distant view is needed. If the gate fails, the button is deferred. |
| Clocks and labels | With both displayed, the two times are present, each beside its own control, and the both-on line is shown; changing the LRO minute never changes the lighting time, and a minute tick never changes the LRO time. Focus is kept through ticks. Minute-boundary recalculation, tab return, and a clock jump to a valid time, to an out-of-range time and back are each exercised. |
| Fallbacks (below) | Each one forced in a test, each with a break. |

Figures are agreement with named references over the stated range, not a claim of absolute accuracy.

## 4. If the calculation is unavailable

The globe returns to (or stays) **evenly lit**, the button reads "Lit as now unavailable" with one plain reason, and everything else keeps working. Light is applied only after a valid direction exists; there is no half-lit state.

- Catalogue fails to load, fails its hash or is not in the expected form.
- The current time is outside the catalogue's range ("our sunlight table ends on 1 Jan 2028").
- The device clock gives no valid time. (A jump to another valid, covered time is not a failure; the lighting follows it.)
- A computed value is not finite or not a unit direction.
- On leaving the tab for longer than a tick, the first act on return is a recalculation before anything is shown as "now".

## 5. Not in this change

Crater shadows and relief; earthshine; lunar eclipses (the Earth's shadow is not modelled — the readout says so); the view from a visitor's own location; lighting at the LRO example's time; live LRO; any hub change.

## 6. Release steps (each on Chad's own line)

1. Go: build `moon-lit-rc` on a branch (page only, no merge).
2. GPT review of the candidate and packet.
3. REGISTER: one new entry (the sunlight catalogue); the NAIF, DE440 and Horizons entries already exist and are extended if the Horizons quantities differ. SVS table: entry only if GPT judges a test-only reference needs one.
4. Approve: merge to main. Rollback: revert the merge.

## 7. Decisions for Chad

- **D1** Route: B (fixed catalogue to 1 Jan 2028) as recommended, or A, or C.
- **D2** Off by default (recommended), keeping the opening view as it is.
- **D3** Night side: faint floor, labelled as a display aid (recommended), or fully dark.
- **D4** Include **As seen from Earth now** if the distant view passes the phase test; otherwise defer the button and ship the lighting toggle alone (recommended), or leave the button out from the start.

GPT's recommendation on rev 1 (relayed): D1 B · D2 off · D3 faint floor · D4 conditional, as above. The decisions remain Chad's.

## 8. For GPT's re-check

1. Is 100 radii with a narrowed field of view an acceptable "equivalent distant view", or should the gate demand a true orthographic camera?
2. Transition half-width of 1°, and mask sampling at ±2°: acceptable?
3. Anything in §9 not applied as you meant it.

## 9. Changes from rev 1

- Clock: device clock only, labelled; the 10-minute hub comparison is removed; minute-boundary cadence; jumps to a valid time are recoverable.
- Shading: near-flat day side, labelled night floor, narrow transition centred on the calculated line; the mask is tested apart from texture brightness.
- Earth view: distant camera, with the measured reason (75% phase renders as 84.1% of the disc at the present desktop camera); 2-point gate kept; button deferred if it fails.
- Checks: unit-vector angles, after rounding; every interval midpoint; Horizons compared like for like with the catalogue-convention residual reported separately; SVS as cited test-only corroboration.
- Both-on wording replaced with GPT's; each time stays beside its own control.
- Pinned inputs and whole-range coverage stated; renewal before 1 Jan 2028 recorded on release.

## 10. Acceptance clarifications for the branch (GPT, relayed by Chad, 15 Nov)

GPT passed rev 2 at docs review and accepted the 100-radii narrowed-field camera, the ±1° transition and the ±2° probes. These are added to the §3 checks:

**Earth view camera**
- Read the actual camera distance after the controls settle and again after a resize; confirm the disc keeps its intended size.
- While Earth view is active, it stays centred on the current sub-Earth point as the clock ticks.
- On exit or fallback, the ordinary camera settings are restored so drag and zoom work on the first input.

**Mask and rendered checks**
- Add mask probes at ±0.5° and ±1° to verify the transition's width and its edges (the ±2° and midpoint probes alone could pass with a wrong width).
- Rendered check: compare the same visible surface points against an evenly lit capture at the same camera pose.
- Phase percentage: count disc pixels on the day side of the mask's 50% contour, so the night floor and map brightness have no effect on the count.

**June rotation**
- Compare the June rotation matrices at the exact archived SPK epochs recorded in `checks/moonfixed-checks.json`. The six-hour lighting grid and those archived epochs are separate inputs.

## Source references

- [NAIF lunar frames and orientation](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/23_lunar-earth_pck-fk.pdf) · [JPL DE440 files](https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/) · [SPICE `spkpos`](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkpos_c.html)
- [JPL Horizons manual: observer quantities 10, 14, 15](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [NASA SVS Moon Phase and Libration, 2026](https://svs.gsfc.nasa.gov/5587/) (hourly table `mooninfo_2026.json`)
- `docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md` §3.1 · `docs/concepts/MOON-LRO-DATED-PATH-PROPOSAL.md` rev 2 · `reviews/2026-11-14-moon-lro-path-rc.md`
