# The Sky on Two Clocks — build proposal rev 1 (docs only, for GPT's review)

Written 10 Nov 2026, 08:16 UTC (clock reading at start). From Chad's spec of 10 Nov 2026 ("The Sky on Two Clocks"). **Nothing researched beyond reading the repo, nothing exported, built, filed, uploaded or deployed.** Implementation and every production action need their own approvals. The opening-page / Met placement audit stays on its own track and is not touched here. The differential-rotation idea is a separate follow-on (§10).

**Question the card answers:** how far away are the Moon and the Sun, and how does that change depending on the timescale?

## 0. Evidence status of this document (read first)

- **No source in §6 has been read for this proposal.** On 10 Nov 08:10–08:15 UTC the workspace shell could not reach `ssd.jpl.nasa.gov` (HTTP 000 through the proxy) and Claude's fetch tool refused all six source-lead URLs (allowlist). Every number below that is not computed from another number here is **general knowledge, unverified**, marked **[GK]**, and is checked in the source pass (§6.3) before any build.
- The Horizons parameters in §3 are written from Claude's knowledge of the Horizons API. **Each is marked "verify on first export"**; the first export's own header is the evidence, not this text.
- Fetch summaries are leads, not evidence (lesson, 8 Nov). Operative wording is filed only from a direct extraction (the browser pane, text only, or GPT on Chad's behalf, labelled as such).

## 1. What the visitor sees

One compact card, **"The Sky on Two Clocks"**, with two views: **Now** (default) and **Deep Time**. It draws nothing on the globe. The globe stays visible on desktop and phone (§8 check 4).

### 1.1 Now
Two rows, Moon then Sun. Each row:
- **Distance** in kilometres from Earth's centre to the body's centre (geometric, centre to centre; §3).
- **Sample time** in UTC: `00:00 UTC, 10 Nov 2026`.
- **Direction label** when supported (§4).
- **A small distance chart** with today's sample marked, its own visible scale and units, and a text equivalent beneath it (§1.3).

**Moon row:** about 35 days of the distance cycle (today −17 d … today +17 d). Line under the row, Chad's wording: "The Moon can be getting closer today even though its average orbit is growing over time."

**Sun row:** about one year (today −182 d … today +182 d). The closest and farthest **daily samples in the displayed window** are marked and labelled "closest sample" / "farthest sample" — sampled extrema, not the instants of perihelion and aphelion. One line: Earth's distance from the Sun varies from roughly 147 to 152 million km over a year because its orbit is elliptical [GK; checked against the APOD lead and against the bundle's own extrema].

Both today markers use the **same UTC date**. Parts of either chart after today are labelled **"calculated ahead"**. Days with no sample are drawn as gaps, never joined.

**Panel attribution:** "Calculated orbital distances · NASA/JPL Horizons". Short explanation: "Horizons calculates these distances. Mother Earth shows a dated daily sample from an export, refreshed by hand." Evidence label: **Computed** (existing `ev comp` style), so nothing reads as an observation.

### 1.2 Deep Time
| Evidence label | What changes | Why it matters |
|---|---|---|
| **Measured lunar recession** | The Moon's average orbit grows by about 3.8 cm per year today, measured by lunar laser ranging [GK; source: GSFC secular-acceleration page]. Tides transfer angular momentum from Earth's spin to the Moon's orbit. | Earth's rotation slows and days lengthen. Hundreds of millions of years from now the Moon is expected to look too small to cover the Sun fully, ending total solar eclipses (broad timescale, attributed to the source; no date given). |
| **Estimated widening from solar mass loss** | Earth's orbit widens by roughly a centimetre per year at today's solar mass-loss rate (traced in §6.2). The Sun loses mass as it radiates energy and through the solar wind. | Negligible for climate on human timescales. Over geological time the Sun's slow brightening matters far more: Earth can receive more energy even as its orbit widens. |

Scale comparison beneath both, Chad's wording: "Over a year, Earth's distance from the Sun changes by about five million kilometres. Solar mass loss would widen Earth's orbit by roughly one metre over a century at today's rate."

Not included (spec): a running centimetre counter; a date for the last total solar eclipse.

**Wording rule (constitution):** `Projected` is reserved for a future Possible futures view. The eclipse statement is the **source's expectation, attributed**, not a projection of ours, and carries no `Projected` label. "Calculated ahead" on the charts means the ephemeris computed by Horizons for future dates.

### 1.3 Text equivalent (no hover, no colour needed)
Under each chart, always visible:
- Moon: "Shown: 24 Oct – 27 Nov 2026 · today 384,211 km · range in window 362,… – 405,… km · scale 360,000–410,000 km". (Digits illustrative.)
- Sun: "Shown: … · today 148.2 million km · closest sample 147.1 million km on 3 Jan 2027 · farthest sample 152.1 million km on 4 Jul 2027 · scale 147–153 million km". (Digits illustrative.)
- Missing days named: "No sample for 2 days in this window (gaps)."

## 2. Placement — decision S2 (Chad)

The page has **no "Sky" section today**. "Sky" appears only in orbital wording and the inspiration list. Options:
- **(a) recommended:** the new card sits directly after the Orbital objects card in the right column's Optional layers group, under a small "Sky" sub-heading that covers both. Orbital markup unchanged; one heading added.
- (b) a new "Sky" group of its own in the right column, Orbital moved into it (moves a live card: wider layout change).
- (c) Sources & Details only, no card.

Any layout change to the opening page is checked against the separate opening-page audit before release; this proposal doesn't settle that audit.

**Loading:** the card opens collapsed ("The Sky on Two Clocks — open"), like Arts; the data loads only when opened. Inside, **Now** is the default view.

## 3. Horizons export recipe (pinned; verify on first export)

**Route:** the Horizons API, `https://ssd.jpl.nasa.gov/api/horizons.api`, `format=text`, one request at a time, User-Agent `MotherEarth/<version> (https://github.com/TheOneTheOnlyTheChad/mother-earth)` (no personal email). Run **by hand** through the browser pane (the workspace shell cannot reach it). Two requests per refresh (Moon, Sun). The page never calls Horizons: the SSD fair-use policy says the APIs may not be embedded in a website (REGISTER, CNEOS entry), and this design never does.

| Parameter | Moon | Sun | Why |
|---|---|---|---|
| `COMMAND` | `'301'` | `'10'` | target IDs |
| `CENTER` | `'500@399'` | `'500@399'` | Earth's geocentre |
| `EPHEM_TYPE` | `'VECTORS'` | same | state vectors |
| `VEC_TABLE` | `'3'` | same | adds LT, RG (range), RR (range rate) |
| `VEC_CORR` | `'NONE'` | same | **geometric**: no light-time or aberration correction |
| `OUT_UNITS` | `'KM-S'` | same | km and km/s |
| `REF_PLANE` / `REF_SYSTEM` | `'FRAME'` / `'ICRF'` | same | recorded; range and range rate do not depend on them |
| `CSV_FORMAT` | `'YES'` | same | parseable |
| `OBJ_DATA` | `'NO'` | same | |
| `START_TIME` / `STOP_TIME` | `'2026-06-01'` / `'2028-01-01'` | same | coverage §5 |
| `STEP_SIZE` | `'1 d'` | same | daily |
| `TIME_TYPE` | `'UT'` | same | see time scale below |

**Not used:** OBSERVER tables (quantity 20 "delta/deldot" is light-time corrected, not geometric).

**Time scale (the risk this recipe has to settle).** Vector tables are natively in TDB. Two routes, decided by the first export's header:
1. **Preferred:** `TIME_TYPE='UT'` is accepted and the header states UT. The rows are then 00:00 UT directly. Record the exact header line.
2. **Fallback:** if vectors stay TDB, request the instants that equal 00:00 UTC with `TLIST`, each TDB = UTC + 69.184 s (TT−TAI 32.184 s + TAI−UTC 37 s, valid while no new leap second is announced; TDB−TT ≤ ~2 ms ignored and stated) [GK; verify against the Horizons manual's time-scale section]. A daily `STEP_SIZE` from `2026-06-01 00:01:09.184 TDB` gives the same instants and is simpler; either is recorded.

Why it matters: the Moon's range rate reaches about 0.1 km/s [GK], so a silent 69 s offset moves its distance by up to ~7 km. The spec asks for the 00:00 UTC timestamp, so the conversion is documented, not assumed.

**What is recorded with each export (in the dataset and the research packet):** request URL with all parameters; retrieval time from the Mac or workspace clock; the response header lines naming target, centre, time scale, corrections, units and ephemeris version (e.g. the DE number); the raw text's sha256; the generated bundle's sha256.

## 4. Direction labels

The recommended method is **range rate** (column RR, geometric, same sample instant), because it describes the body at the sample time:
- RR < 0 → "Getting closer at sample time"
- RR > 0 → "Getting farther at sample time"
- RR = 0 at the stored precision → "Neither closer nor farther at sample time"
- RR missing for today → no label.

Fallback if RR is unavailable or not geometric: compare today's distance with the previous UTC day's: "Closer than yesterday" / "Farther than yesterday"; equal → "Same distance as yesterday at this precision"; previous day missing → no label. The method in use is written in the card's Details ("Direction from Horizons' range rate at 00:00 UTC").

Near the Moon's perigee and apogee the two methods can disagree for a day; check 2 uses exactly that case.

## 5. Data coverage, bundle and refresh

- **Coverage:** 2026-06-01 → 2027-12-31, daily, 579 samples per body. With launch assumed around late Nov or Dec 2026, both chart windows are full from 2026-11-30 to 2027-07-02; after that the Sun window's future end runs into the coverage end and shows a labelled gap; **today's sample expires after 2027-12-31.**
- **Refresh rule:** manual, before 2027-06-01 (keeps full windows), with a new coverage window and a new revision ID. Procedure in §5.1.
- **File:** one JSON, `sky/horizons-<rev>.json` (e.g. `hz-2026-11-R1`), holding per body `{date, range_km, range_rate_kms}` plus a `provenance` block (§3 record) and `coverage {start, end}`. Size estimate ~50 KB raw [estimate; measured at build]. Values stored as exported; display rounds (Moon to 1 km, Sun to 0.1 million km in the row and 1,000 km in Details).
- **Generator:** `phase1/sky/build_sky.py` turns the two raw text exports into the JSON, with `--check` mode and `--generated-at` to pin bytes (Arts/Timeline pattern). Raw exports go in the Mac research packet; hashes in the repo.

### 5a. Where the bundle is served — decision S1 (Chad)
The spec says static site assets, manual refresh, no new Worker, no paid API, no polling. The constitution says the hub is the product and the page a client, and the Timeline's page-only exception was ended on 10 Nov.
- **(a) recommended:** fixed catalogue on the **existing** hub, same as Arts and the Timeline: R2 `ref/sky/<rev>.json`, hub route `/catalogue/sky/<rev>` serving only if the file's sha256 matches the Worker pin. No new Worker, no cron, no D1, no polling; one R2 Class B read per card open that reaches the hub; refresh = new revision (R2 upload + hub pin + page release, each its own Approve line).
- (b) page-bundled static asset under the repo root, sha pinned in `sky.js`; a refresh is a page release only. Bounded, dated exception to "the hub is the product", recorded in START-HERE §2 if chosen.

Either way Now works only while the file loads and covers today; Deep Time is static text in the page and never waits for it.

### 5.1 Manual refresh procedure
1. In a pane tab, run the two requests of §3 with the new window; save raw text + retrieval time to the Mac packet.
2. Run `build_sky.py`; `--check`; new revision ID; record hashes.
3. Run the sky test suite against the new file.
4. Release per S1 (a: R2 upload → hub deploy with new pin → page release; b: page release), each on its own Approve line.

## 6. Source evidence

### 6.1 Sources to read (text only, before build)
| ID | Source | What it must support |
|---|---|---|
| H1 | Horizons manual | VECTORS tables, `VEC_CORR` meanings, RG/RR definitions, time scales and `TIME_TYPE`, units, target/centre syntax |
| H2 | SSD FAQ #a05 + SSD API fair-use page | reuse of Horizons output (applicability of the SSD public-domain statement to Horizons is an **interpretation** until checked) |
| D1 | APOD 4 Jan 2025, "Welcome to Perihelion" | 147–152 million km annual range, elliptical orbit |
| L1 | GSFC "Secular acceleration of the Moon" | 3.8 cm/yr, lunar laser ranging, tidal angular-momentum transfer, day lengthening |
| L2 | eclipse2017 "What's the very last solar eclipse" | broad timescale for the end of total solar eclipses |
| M1 | NASA, "NASA team studies middle-aged Sun by tracking motion of Mercury" | mass-loss rate; stated orbital widening; the study it reports |
| M2 | NASA exoplanets "Life and death" ch. 5 | long-term brightening |

Each gets: URL, retrieval time, who read it, the operative sentence (short), notice/correction status, and licence/credit wording. Publisher landing page read for any paper cited (lesson from EGU21-16222).

### 6.2 Solar mass-loss trace (to be confirmed against M1)
- **Rate [GK]:** M1 reports Genova et al. 2018 (MESSENGER radio tracking of Mercury), Sun's GM decreasing at about 6.1 × 10⁻¹⁴ per year.
- **Physics [GK]:** for slow (adiabatic) mass loss, a·M stays constant, so ȧ/a = −Ṁ/M.
- **Implied widening:** 1 AU × 6.1 × 10⁻¹⁴ /yr = 1.496 × 10¹¹ m × 6.1 × 10⁻¹⁴ ≈ **0.9 cm per year** → **≈ 0.9 m per century** at today's rate. Order of magnitude only.
- **Known check:** Claude recalls the M1 article stating a larger expansion figure (around 1.5 cm per year per AU) [GK, uncertain]. If M1 says that, the record shows both, and the card keeps "roughly a centimetre per year" and "roughly one metre per century" only if both are compatible with them at order of magnitude; otherwise GPT and Chad decide the wording. No number is chosen to match the spec.

### 6.3 Gate
Source pass (pane, text only, protocol fixed before any request, ~1 h cap incl. write-up, append-only log) + first Horizons export (research only; raw files kept on the Mac). Output: a research record `docs/research/SKY-SOURCE-CHECK.md` and draft REGISTER wording for Horizons (**not filed**). Each needs Chad's go; filing needs its own Approve line.

## 7. Date rules (page)

- **Today** = the UTC date of the viewer's clock (`new Date().toISOString().slice(0,10)`), never local date. Recomputed on the page's existing 5-min refresh tick, so a card open across 00:00 UTC rolls to the new date (lesson: `IMG_DAY` didn't).
- A row's today value is the sample whose `date` equals today, exactly. Never the nearest, never interpolated.
- **No sample for today:** the row shows "Today's distance unavailable", then separately "Last available: 384,… km at 00:00 UTC, 31 Dec 2027" if an earlier sample exists; no today marker; no direction label; chart still drawn for whatever samples fall in the window.
- **File fails to load / fails its hash / fails validation:** Now shows "Distances unavailable — the calculated data could not be loaded"; Deep Time unaffected.
- **Viewer's clock wrong:** not detectable; stated in Details ("today is taken from your device's clock, in UTC").

## 8. Acceptance checks (spec checks 1–5, made testable)

New suite `phase1/sky-ui.test.cjs` (Playwright, local server, fixture bundles, fake clock incl. the no-argument `Date` constructor) and `phase1/sky-build.test.mjs` (generator). Every check gets a `BREAK=` variant that must fail.

1. **Normal day + UTC rollover.** Clock 2027-01-03T23:59:30Z then 2027-01-04T00:00:30Z, in browser timezones `Pacific/Kiritimati` (UTC+14), `Africa/Johannesburg`, `America/Los_Angeles`: both rows switch date together at 00:00 UTC; timestamp, values and markers agree with the fixture; chart scales differ (Moon ~10⁵ km, Sun ~10⁸ km); marked solar extrema equal the min/max of the displayed samples. Break: local date instead of UTC.
2. **Lunar turning point.** Fixture where RR < 0 but today > yesterday (just after perigee): label = the method in use (RR → "Getting closer at sample time"). With RR removed: "Farther than yesterday". Neutral case RR = 0 and equal days. Missing previous day (day-over-day method) → no label.
3. **Missing day and expiry.** Moon missing today, Sun present: only the Moon row says unavailable, shows its last available date separately, no marker, gap in its chart; Sun row normal. Clock after coverage end: both rows unavailable, last available shown. Asset 404, bad JSON, hash mismatch: Now unavailable message; Deep Time opens and reads fully. No neighbouring day ever appears as today (assert on rendered text and marker x-position). Break: nearest-day fallback.
4. **Phone and keyboard.** At 390 × 844 with the Readings sheet open and the card expanded in each view: no horizontal overflow; globe overlay coverage measured with the existing camera-based method stays within the mobile-pass target (≤ 8%); Now/Deep Time switch reachable by Tab, works with Enter/Space and touch, `aria-selected`/`aria-controls` set; text equivalents present in the accessibility tree; nothing essential behind hover. Rerun desktop-overflow and mobile-pass. Screen-reader announcements are not verified by these checks (stated, as before).
5. **Evidence and operations.** The file's `provenance` matches §3 and the raw export header; generator `--check` passes; the refresh procedure is run once end to end on a test window; the §6.2 trace is in the research record; public copy uses three distinct labels — Computed (distance), Measured (recession), Estimated (widening) — tested by text.

Plus the usual: served-hash checks cover the new page file (`sky.js`) once released; a live RC in a clean pane tab before any page release.

## 9. Decisions for Chad (after GPT)
- **S1** where the bundle is served: (a) hub fixed catalogue (recommended) or (b) page-bundled exception.
- **S2** placement: (a) after Orbital with a "Sky" sub-heading (recommended), (b) a Sky group with Orbital moved, (c) Sources only.
- **S3** direction method: range rate (recommended) or day-over-day.
- **S4** coverage 2026-06-01 → 2027-12-31 and refresh-by date 2027-06-01.
- **S5** go for the source pass + first Horizons export (§6.3), research only.

Approve lines, in order (wording settled after S1):
1. `Approve: Sky source pass + first Horizons export (research only, text only, per SKY-TWO-CLOCKS-PROPOSAL rev N §6.3)`
2. `Approve: file the Horizons REGISTER entry (…)`
3. `Approve: build sky-rc on a branch only — no merge, R2 write, hub deploy or page change`
4. (S1a) `Approve: upload ref/sky/<rev>.json (sha256 …) to R2` → `Approve: deploy hub 0.6.5 from <sha> (content only)`
5. `Approve: merge sky-rc to main (page change: Sky on Two Clocks card)`

## 10. Separate follow-on (not in this card)
**The Sun doesn't spin as one piece:** two markers start at the same solar longitude, different latitudes; the equatorial one pulls ahead. Labelled as an illustration of differential rotation. Its own proposal, its own source pass (NASA heliophysics lead), after this card.

## 11. Not approved
Source reading, Horizons export, REGISTER filing, branch build, R2 write, hub deploy, page change. The opening-page / Met placement audit is untouched.
