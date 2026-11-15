# Mother Earth · "Lit as now" on the Moon globe

**Rev 1 · 14 November 2026 · proposal for GPT review · docs only**

Add an off-by-default **Lit as now** control to the Moon globe on `moon.html`. When on, the globe is lit from the direction of the Sun at the current UTC minute, and the readout says where the Sun and the Earth stand over the Moon and how much of the Earth-facing disc is lit. This is the addendum that `MOON-SUN-GLOBES-PROPOSAL.md` §3.1 requires before lighting is added. Nothing is built until Chad's own go. Live LRO positions are not part of this.

## 1. What a visitor sees

- The globe still opens **evenly lit on the near side**, exactly as today. A new button, **Lit as now**, sits with the globe controls (off by default; `aria-pressed`).
- On: one directional light is placed at the calculated sub-solar direction, fixed to the Moon's surface, so turning the globe shows day, night and the line between them where they are at this minute. The night side keeps a faint floor of light so the map stays readable (decision D3).
- A second button, **As seen from Earth now**, turns the view to the calculated sub-Earth point, so the globe shows the phase and libration as seen from the Earth's centre. Words beside it: "from the Earth's centre, Moon's north up — not how it is tilted in your sky."
- Readout, updated in place (same focus rules as the LRO readout):
  - **Sunlight calculated for 14 Nov 2026 19:02 UTC (now)**
  - Sun overhead at [lat] [lon] · Earth overhead at [lat] [lon]
  - [nn.n]% of the Earth-facing disc is lit
  - "Calculated, not observed. A smooth sphere: no crater shadows, no earthshine, no eclipses. The shading is illustrative; the position of the day–night line is the calculated thing. Moon orientation and Sun and Earth positions: JPL DE440 via NAIF."
- Evidence label: `Computed` (`.ev.comp`), never `Observed`.

### Two clocks, kept apart

The dated LRO path keeps its own heading and time ("Dated LRO example · 10–11 June 2026 UTC … [selected minute]"). The lighting has its own line and time ("Sunlight calculated for … UTC (now)"). When both are on, one extra line appears: **"The sunlight is for now. The LRO path is from June 2026. They are different times."** Neither control changes the other. Lighting the globe for the LRO example's own minute is a possible later change and is out of scope here.

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

### Time and cadence

- **Clock:** the device's clock, shown to the minute in UTC. If the page already holds a hub time from another read, the two are compared; if they differ by more than 10 minutes the globe stays evenly lit and says so (Q2 for GPT).
- **Cadence:** recalculated every 60 seconds and on return to the tab. The sub-solar point moves about 0.0085° a minute. No network request after the catalogue is loaded.
- **Kernel inputs** come through the browser pane as hashed byte ranges of the full JPL files, as in the last thread (START-HERE §4z).

## 3. Evidence before release

| Check | Proposed acceptance |
| --- | --- |
| Rebuild | Regenerated bytes equal the shipped file; inputs and hashes in `BUILD-moonlight.json`. June 2026 rotation matrices equal those in `checks/moonfixed-checks.json`. |
| Independent calculation | Our own DE440 evaluator (ASCII coefficients, own Chebyshev and rotation code, extended from librations to the Sun, Earth and Moon) against SPICE at every catalogue sample: both sub-points within **0.0001°**. |
| Horizons, sub-points | Moon (301) from the Earth's centre (`500@399`), observer quantities 14 and 15, at no fewer than 40 instants spread over the range including new, full and both quarters. Horizons' own light-time and aberration conventions are modelled in the comparison, as last thread. Within **0.001°**. Raw responses archived. |
| Horizons, lit fraction | Quantity 10 at the same instants, within **0.01 percentage points**. |
| NASA SVS hourly table | `mooninfo_2026.json` (SVS 5587: hourly phase, sub-solar and sub-Earth longitude and latitude for 2026), Nov–Dec 2026 hours. Corroboration only: the table's frame and conventions must be established from SVS's documentation first; the tolerance is set then and any offset reported, not tuned away. |
| Interpolation | Page arithmetic (the same JavaScript, run in the test) against hourly SPICE truth across the whole range: worst error reported, limit **0.01°**. |
| Rendered day–night line | On the rendered globe, for at least three dated instants: sample points 5° on the sunward side of the calculated line are lit and points 5° beyond it are at the night floor, at eight positions around the line, including across the texture seam and near a pole. Break: light moved by 10° must fail. |
| "As seen from Earth now" | View centre equals the sub-Earth point; lit fraction of rendered disc pixels within 2 percentage points of the calculated value at a crescent, a quarter and a gibbous date. |
| Clocks and labels | With both overlays on, the two times are present, different and correctly attributed; changing the LRO minute never changes the sunlight time, and a minute tick never changes the LRO time. Focus is kept through ticks. |
| Fallbacks (below) | Each one forced in a test, each with a break. |

Figures are agreement with named references over the stated range, not a claim of absolute accuracy.

## 4. If the calculation is unavailable

The globe returns to (or stays) **evenly lit**, the button reads "Lit as now unavailable" with one plain reason, and everything else keeps working. Light is applied only after a valid direction exists; there is no half-lit state.

- Catalogue fails to load, fails its hash or is not in the expected form.
- The current time is outside the catalogue's range ("our sunlight table ends on 1 Jan 2028").
- The clock check fails, or the clock jumps backwards.
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
- **D3** Night side: faint floor so the map stays readable (recommended, labelled as not earthshine), or fully dark.
- **D4** Include **As seen from Earth now** in this release (recommended), or leave it out.

## 8. Questions for GPT

1. Are the tolerances in §3 right for what the page claims, and is the SVS table worth including as corroboration?
2. Clock: is "device clock, refused if it disagrees with a hub time by more than 10 minutes" the right rule, or should the device clock simply be shown?
3. Shading: stock diffuse shading darkens toward the line more than the real Moon does. Is the "illustrative shading" sentence enough, or should the lit side be near-flat with a narrow edge?
4. Is the both-on sentence in §1 clear enough to keep the two times apart?

## Source references

- [NAIF lunar frames and orientation](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/23_lunar-earth_pck-fk.pdf) · [JPL DE440 files](https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/) · [SPICE `spkpos`](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkpos_c.html)
- [JPL Horizons manual: observer quantities 10, 14, 15](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [NASA SVS Moon Phase and Libration, 2026](https://svs.gsfc.nasa.gov/5587/) (hourly table `mooninfo_2026.json`)
- `docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md` §3.1 · `docs/concepts/MOON-LRO-DATED-PATH-PROPOSAL.md` rev 2 · `reviews/2026-11-14-moon-lro-path-rc.md`
