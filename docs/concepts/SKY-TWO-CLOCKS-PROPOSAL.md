# The Sky on Two Clocks — build proposal rev 2 (docs only, for GPT's focused recheck)

Rev 1 written 10 Nov 2026 08:16 UTC (clock reading). **Rev 2 written 10 Nov 2026 08:23 UTC (clock reading)** after GPT's review of rev 1 (Mac copy, sha256 `7112dfbf41c9…`; relayed by Chad). From Chad's spec of 10 Nov 2026 ("The Sky on Two Clocks"). **Nothing researched beyond reading the repo, nothing exported, built, filed, uploaded or deployed.** Implementation and every production action need their own approvals. The opening-page / Met placement audit stays on its own track. The differential-rotation idea is a separate follow-on (§10).

**Question the card answers:** how far away are the Moon and the Sun, and how does that change depending on the timescale?

## Rev 2 changes (GPT's review of rev 1)
| # | GPT's point | Where |
|---|---|---|
| 1 | UTC is an export **requirement**, not an assumption; prefer individually converted TDB epochs via `TLIST`; fixed offset only with its residual error, a leap-second check over the whole window and an agreed tolerance; API reference added to H1; User-Agent reconciled with the browser route | §3, §6.1 |
| 2 | Reproducible export record; 2028-01-01 endpoint trimmed; bundle hash pinned outside the bundle | §3.3, §5 |
| 3 | S3 selects one direction method per dataset; missing value ≠ method switch; Details copy generated from the method; compare stored values before rounding; check 2 fixture is **after apogee**, not perigee | §4, §8 |
| 4 | Calendar arithmetic confirmed (579 days; full Sun window 30 Nov 2026 – 2 Jul 2027); partial-window state before 30 Nov; outside coverage ≠ missing inside; rollover **by the next tick**, plus on card open and on return to the page | §5, §7, §8 |
| 5 | Solar trace arithmetic confirmed (0.91 cm/yr, 0.91 m/century); one consistent chain needed; establish fitted solar GM change vs mass-loss estimate | §6.2 |
| 6 | Hub recommendation sound; per-refresh cost of 3 production steps vs 1 stated; T3 compatibility contract carried over; two-revision fixture; Pages-origin check | §5a, §8 |
| 7 | Eclipse sentence kept without `Projected`; attribution placed on the sentence itself | §1.2 |
| — | Every acceptance check now names a concrete break | §8 |

## 0. Evidence status of this document (read first)
- **No source in §6 has been read.** On 10 Nov 08:10–08:15 UTC the workspace shell could not reach `ssd.jpl.nasa.gov` (HTTP 000 through the proxy) and Claude's fetch tool refused all six source-lead URLs (allowlist). Every number not computed from another number here is **general knowledge, unverified**, marked **[GK]**, and is checked in the source pass (§6.3) before any build.
- The Horizons parameters in §3 are a **candidate** recipe from Claude's knowledge. The first export's header and the Horizons documentation together are the evidence; nothing in §3 is treated as established until then.
- GPT's review covered the Mac copy only; the GitHub commit and the JPL/NASA sources remain unverified by GPT.
- Fetch summaries are leads, not evidence. Operative wording is filed only from a direct extraction (the browser pane, text only, or GPT on Chad's behalf, labelled as such).

## 1. What the visitor sees
One compact card, **"The Sky on Two Clocks"**, with two views: **Now** (default) and **Deep Time**. It draws nothing on the globe. The globe stays visible on desktop and phone (§8 check 4).

### 1.1 Now
Two rows, Moon then Sun. Each row:
- **Distance** in kilometres from Earth's centre to the body's centre (geometric, centre to centre; §3).
- **Sample time** in UTC: `00:00 UTC, 10 Nov 2026`.
- **Direction label** when supported (§4).
- **A small distance chart** with today's sample marked, its own visible scale and units, and a text equivalent beneath it (§1.3).

**Moon row:** about 35 days of the distance cycle (today −17 d … today +17 d). Line under the row, Chad's wording: "The Moon can be getting closer today even though its average orbit is growing over time."

**Sun row:** about one year (today −182 d … today +182 d). The closest and farthest **daily samples in the displayed window** are marked and labelled "closest sample" / "farthest sample" — sampled extrema, not the instants of perihelion and aphelion. One line: Earth's distance from the Sun varies from roughly 147 to 152 million km over a year because its orbit is elliptical [GK; checked against D1 and against the bundle's own extrema].

Both today markers use the **same UTC date**. Parts of either chart after today are labelled **"calculated ahead"**. Days missing inside coverage are drawn as gaps, never joined. Parts of a window **outside the bundle's coverage** are labelled "outside the calculated range" and shaded differently from in-coverage gaps (§7).

**Panel attribution:** "Calculated orbital distances · NASA/JPL Horizons". Short explanation: "Horizons calculates these distances. Mother Earth shows a dated daily sample from an export, refreshed by hand." Evidence label: **Computed** (existing `ev comp` style).

### 1.2 Deep Time
| Evidence label | What changes | Why it matters |
|---|---|---|
| **Measured lunar recession** | The Moon's average orbit grows by about 3.8 cm per year today, measured by lunar laser ranging [GK; L1]. Tides transfer angular momentum from Earth's spin to the Moon's orbit. | Earth's rotation slows and days lengthen. *Source's expectation, attributed in the same sentence:* "NASA's eclipse pages expect that, hundreds of millions of years from now, the Moon will look too small to cover the Sun fully, ending total solar eclipses." (broad timescale; no date) |
| **Estimated widening from solar mass loss** | Earth's orbit widens by roughly a centimetre per year at today's solar mass-loss rate (traced in §6.2). The Sun loses mass as it radiates energy and through the solar wind. | Negligible for climate on human timescales. Over geological time the Sun's slow brightening matters far more: Earth can receive more energy even as its orbit widens [GK; M2]. |

So the **Measured** label covers the rate only; the future-eclipse sentence reads as the source's conclusion. Exact public wording follows the L2 extraction.

Scale comparison beneath both, Chad's wording: "Over a year, Earth's distance from the Sun changes by about five million kilometres. Solar mass loss would widen Earth's orbit by roughly one metre over a century at today's rate."

Not included (spec): a running centimetre counter; a date for the last total solar eclipse.

**Wording rule (constitution):** `Projected` is reserved for a future Possible futures view and is not used here. "Calculated ahead" on the charts means the ephemeris Horizons computed for future dates.

### 1.3 Text equivalent (no hover, no colour needed)
Under each chart, always visible (digits illustrative):
- Moon: "Shown: 24 Oct – 27 Nov 2026 · today 384,211 km · range in window 362,… – 405,… km · scale 360,000–410,000 km".
- Sun: "Shown: … · today 148.2 million km · closest sample 147.1 million km on 3 Jan 2027 · farthest sample 152.1 million km on 4 Jul 2027 · scale 147–153 million km".
- Missing days named: "No sample for 2 days in this window (gaps)." Outside coverage named: "Calculated range ends 31 Dec 2027."

## 2. Placement — decision S2 (Chad)
The page has **no "Sky" section today**. Options:
- **(a) recommended:** the new card sits directly after the Orbital objects card in the right column's Optional layers group, under a small "Sky" sub-heading covering both. Orbital markup unchanged; one heading added.
- (b) a new "Sky" group with Orbital moved into it (moves a live card).
- (c) Sources & Details only, no card.

Any layout change to the opening page is checked against the separate opening-page audit before release.

**Loading:** the card opens collapsed, like Arts; data loads only when opened. Inside, **Now** is the default view.

## 3. Horizons export contract

### 3.1 Candidate request (all values to be confirmed by the first export)
**Route:** the Horizons API (`https://ssd.jpl.nasa.gov/api/horizons.api`, `format=text`), one request at a time, run **by hand** in a browser-pane tab, because the workspace shell cannot reach it. The page never calls Horizons: the SSD API fair-use terms say the APIs may not be embedded in a website (REGISTER, CNEOS entry).

**User-Agent (reconciled):** a browser `fetch` cannot set `User-Agent` (forbidden header). The request goes out with the pane browser's own User-Agent, which is recorded verbatim in the export log. No custom User-Agent is claimed. If the source pass shows SSD expects an identifying agent for manual browser use, the alternative is the Mac Terminal with `curl -A "MotherEarth/<v> (https://github.com/TheOneTheOnlyTheChad/mother-earth)"` (no personal email), decided at the gate.

| Parameter | Moon | Sun | Purpose |
|---|---|---|---|
| `COMMAND` | `'301'` | `'10'` | target |
| `CENTER` | `'500@399'` | `'500@399'` | Earth geocentre |
| `EPHEM_TYPE` | `'VECTORS'` | same | state vectors |
| `VEC_TABLE` | `'3'` | same | adds LT, RG (range), RR (range rate) |
| `VEC_CORR` | `'NONE'` | same | **geometric** |
| `OUT_UNITS` | `'KM-S'` | same | km, km/s |
| `REF_SYSTEM` / `REF_PLANE` | `'ICRF'` / `'FRAME'` | same | recorded; RG and RR do not depend on them |
| `CSV_FORMAT` | `'YES'` | same | parseable |
| `OBJ_DATA` | `'NO'` | same | |
| epochs | §3.2 | §3.2 | 579 daily epochs, 2026-06-01 … 2027-12-31 at 00:00 UTC |

**Not used:** OBSERVER tables (quantity 20 delta/deldot is light-time corrected, not geometric).

The first export must confirm, from its header and the documentation together: target, centre (Earth geocentre, not a topocentric site), correction = geometric, units, the exact RG and RR column names, and the **output time scale**.

### 3.2 UTC is a requirement
Each retained sample must be at **00:00:00 UTC** on its date. Routes, in order of preference:
1. **`TLIST` of individually converted TDB epochs (preferred).** For each date, convert 00:00:00 UTC → TDB with a stated, cited method (UTC→TAI with the leap-second table; TAI→TT +32.184 s; TT→TDB with the standard periodic term), and request those 579 epochs explicitly. The conversion code, its leap-second table source and its outputs are kept with the export. **Open check:** Horizons' limit on the number of `TLIST` epochs per request; if below 579, the window is split into consecutive requests, each recorded.
2. **`TIME_TYPE='UT'`**, only if the vector endpoint accepts it **and** the documentation and the response header together establish that the epochs are UTC for these modern dates. Not assumed from the parameter being accepted.
3. **Fixed offset** (daily `STEP_SIZE` starting at 2026-06-01 00:01:09.184 TDB): an approximation. Used only if: (a) no leap second occurs anywhere in 2026-06-01 … 2027-12-31, verified against the IERS leap-second record at export time; (b) the residual is stated — TDB−TT periodic term, up to ~1.7 ms [GK], giving under ~0.2 m in Moon distance at ~0.1 km/s [GK]; (c) GPT and Chad agree that tolerance before the samples are called midnight UTC.

Why it matters: the Moon's range rate reaches about 0.1 km/s [GK], so a silent 69 s offset would move its distance by up to ~7 km.

### 3.3 What each export records (reproducibility)
Per body, in the research packet and summarised in the bundle's `provenance`:
- full request URL and every parameter; the request method (pane `fetch` or Terminal `curl`) and User-Agent sent;
- retrieval time from the Mac or workspace clock;
- the raw response, unedited, and its sha256;
- the exact column header line; the API version line; target and centre names and the **ephemeris sources as reported** (e.g. DE number), where reported;
- for each retained row: the original epoch string as returned, its UTC date, and the conversion route (§3.2) that produced it;
- first and last retained epoch and the row count.

**Endpoint rule:** the window is 2026-06-01 … 2027-12-31 inclusive (579 epochs). If any request returns a 2028-01-01 row (inclusive `STOP_TIME`), that row is **trimmed** and the trim is logged. The generator fails if the retained count ≠ 579 per body unless missing dates are listed explicitly.

**Bundle hash:** the bundle carries the raw exports' hashes. **Its own sha256 lives outside it**: in `phase1/sky/BUILD.json` (generator manifest), the page's pin and, under S1(a), the Worker's pin.

## 4. Direction labels — one method per dataset (decision S3)
S3 chooses the method for the whole dataset; the bundle records it (`direction_method: "range_rate" | "day_over_day"`) and the Details copy is **generated from that field**.

**Range-rate mode (recommended):**
- RR < 0 → "Getting closer at sample time"; RR > 0 → "Getting farther at sample time"; RR = 0 as stored → "Neither closer nor farther at sample time".
- RR missing for today → **no label**. The page never falls back to day-over-day in this mode.
- Details: "Direction from Horizons' range rate at 00:00 UTC."

**Day-over-day mode:**
- today < yesterday → "Closer than yesterday"; > → "Farther than yesterday"; equal → "Same distance as yesterday".
- Previous UTC day missing → **no label**.
- Comparison uses the **stored values**, before display rounding.
- Details: "Direction compared with the previous day's 00:00 UTC sample."

Near a turning point the two methods can disagree. Example: just **after apogee**, RR < 0 while today's 00:00 distance can still exceed yesterday's (the maximum fell between the two samples). Check 2 uses this case.

## 5. Coverage, bundle and refresh
- **Coverage:** 2026-06-01 → 2027-12-31 inclusive, **579 daily samples per body** (GPT confirmed the count).
- **Windows:** the centred Sun window (±182 d) is complete from **30 Nov 2026 to 2 Jul 2027**, given complete data (GPT confirmed). Before 30 Nov or after 2 Jul the Sun chart is **partial**, shown explicitly with the "outside the calculated range" state (§1.1). The Moon window (±17 d) is complete from 2026-06-18 to 2027-12-14.
- **Expiry:** today's sample is unavailable after 2027-12-31.
- **Refresh by 2027-06-01** (about a month before the Sun window turns partial). New window, new revision ID, procedure §5.1.
- **File:** `sky/<rev>.json` (e.g. `sky-2026-11-R1`) with per body `{date, range_km, range_rate_kms}`, `direction_method`, `coverage {start, end}`, and `provenance` (§3.3 summary + raw export hashes). Size estimate ~50 KB raw [estimate; measured at build]. Values stored as exported; display rounds (Moon to 1 km; Sun to 0.1 million km in the row, 1,000 km in Details).
- **Generator:** `phase1/sky/build_sky.py` (raw exports → bundle; `--check`; `--generated-at` pins bytes; validates every §3.1 header fact and fails on a wrong target, centre, correction, units or time scale). Raw exports in the Mac research packet; hashes in the repo.

### 5a. Where the bundle is served — decision S1 (Chad)
The spec says static site assets, manual refresh, no new Worker, no paid API, no polling. The constitution says the hub is the product.
- **(a) recommended (GPT: sound):** fixed catalogue on the **existing** hub, Arts/Timeline pattern — R2 `ref/sky/<rev>.json`, route `/catalogue/sky/<rev>`. No new Worker, cron, D1 or polling; one R2 Class B read per card open that reaches the hub. **Cost of the choice:** each refresh is **three** separately approved production steps (R2 upload, hub deploy with the new pin, page release) instead of one. **T3 compatibility contract carried over:** the page fetches its own immutable revision; older revision objects and their pins remain; malformed or unknown IDs → 404 with **zero** R2 reads; a known revision whose stored bytes are missing or fail the hash → 503, fail closed.
- (b) page-bundled static asset, sha pinned in `sky.js`; each refresh is one page release. A bounded, dated exception to "the hub is the product", recorded in START-HERE §2 if chosen.

Either way, Now depends on the file; Deep Time is static text in the page and never waits for it.

### 5.1 Manual refresh procedure
1. In a pane tab (or Terminal per §3.1), run the requests of §3 for the new window; save raw text, request record and retrieval time to the Mac packet.
2. Run `build_sky.py`; `--check`; new revision ID; record hashes in `BUILD.json`.
3. Run `sky-build` and `sky-ui` tests against the new file.
4. Release per S1 (a: R2 upload → hub deploy → page release; b: page release), each on its own Approve line.

The refresh is rehearsed once end to end on a short test window before the first release (§8 check 5).

## 6. Source evidence

### 6.1 Sources to read (text only, before build)
| ID | Source | What it must support |
|---|---|---|
| H1 | Horizons manual **and** Horizons API reference | VECTORS tables, `VEC_CORR` meanings, RG/RR definitions, time scales, `TIME_TYPE` for vectors, `TLIST` syntax and limits, `STOP_TIME` inclusivity, units, target/centre syntax |
| H2 | SSD FAQ #a05 + SSD API fair-use page | reuse of Horizons output (applicability of the SSD public-domain statement to Horizons is an **interpretation** until checked); expectations for manual requests |
| H3 | IERS leap-second record (Bulletin C) | leap seconds in the window (needed for §3.2 routes 1 and 3) |
| D1 | APOD 4 Jan 2025, "Welcome to Perihelion" | 147–152 million km annual range, elliptical orbit |
| L1 | GSFC "Secular acceleration of the Moon" | 3.8 cm/yr, lunar laser ranging, tidal angular-momentum transfer, day lengthening |
| L2 | eclipse2017 "What's the very last solar eclipse" | broad timescale for the end of total solar eclipses |
| M1 | NASA, "NASA team studies middle-aged Sun by tracking motion of Mercury" + the paper it reports (publisher landing page) | mass-loss figure and what it is (§6.2) |
| M2 | NASA exoplanets "Life and death" ch. 5 | long-term brightening |

Each gets: URL, retrieval time, who read it, the operative sentence (short), notice/correction status, and licence/credit wording.

### 6.2 Solar mass-loss trace — one consistent chain (to be confirmed against M1 and its paper)
Arithmetic (GPT confirmed): at 1 AU, 6.1 × 10⁻¹⁴ /yr × 1.496 × 10¹¹ m = **0.91 cm/yr**, **0.91 m per century**.

What must be established, in this order, before any public number:
1. **The input quantity.** Is the figure a **fitted change in the Sun's GM** (from Mercury ranging), or an estimate **attributed specifically to mass loss**? A GM change could in principle include a change in G; the paper's own treatment decides what the input may be called.
2. **The relation used.** For slow, isotropic mass loss, a·M is conserved, so ȧ/a = −Ṁ/M [GK]. Record whether the article and paper use this relation or another.
3. **The article's own figure.** If M1 states ~1.5 cm/yr per AU, that implies an input near 1.0 × 10⁻¹³ /yr, not 6.1 × 10⁻¹⁴. Both are on the centimetre scale, which **does not by itself reconcile them**. The record states which input, from which source, supports the public wording.
4. **Public wording.** "Roughly a centimetre per year" and "roughly one metre over a century" are kept only if the chosen chain supports them at that precision; otherwise GPT and Chad decide new wording. Still labelled an order-of-magnitude estimate at today's rate.

### 6.3 Gate
Source pass (pane, text only, protocol fixed and hashed before any request, ~1 h cap incl. write-up, append-only log) + first Horizons export as specified in §3 (research only; raw files kept on the Mac). Output: `docs/research/SKY-SOURCE-CHECK.md` and draft REGISTER wording for Horizons (**not filed**). Needs Chad's go (S5); filing needs its own Approve line.

## 7. Date rules (page)
- **Today** = the UTC date of the viewer's clock (`new Date().toISOString().slice(0,10)`), never the local date.
- **When it is recomputed:** on card open; on every 5-min refresh tick; and on `visibilitychange` back to visible. So a page open across 00:00 UTC rolls to the new date **by the next tick**, or at once when the card is opened or the tab returns. Not at the exact second of midnight.
- A row's today value is the sample whose `date` equals today, exactly. Never the nearest, never interpolated.
- **Today outside coverage** (before start or after end): row shows "Today's distance unavailable — outside the calculated range (ends 31 Dec 2027)", plus "Last available: … at 00:00 UTC, …" when an earlier sample exists.
- **Today missing inside coverage:** "Today's distance unavailable — no sample for this date", plus last available at or before today.
- In both cases: no today marker, no direction label; the chart still draws whatever samples fall in its window.
- **File fails to load, fails its hash or fails schema validation:** Now shows "Distances unavailable — the calculated data could not be loaded"; Deep Time unaffected.
- **Viewer's clock wrong:** not detectable; stated in Details ("today is taken from your device's clock, in UTC").

## 8. Acceptance checks — each with a break that must fail it
Suites: `phase1/sky-ui.test.cjs` (Playwright, local server, fixture bundles, fake clock incl. the no-argument `Date` constructor, browser `timezoneId`) and `phase1/sky-build.test.mjs` (generator). Each `BREAK=` variant is run and must fail its check.

| Check | What passes | Break(s) that must fail it |
|---|---|---|
| **1. UTC date, rollover, charts** | In `Pacific/Kiritimati`, `Africa/Johannesburg` and `America/Los_Angeles`: at 2027-01-03T23:59:30Z both rows show 3 Jan; after the clock passes 00:00Z, both show 4 Jan **by the next tick**, immediately on card open, and immediately on `visibilitychange`. Timestamp, values and markers agree with the fixture. Moon and Sun scales are independent. Marked solar extrema = min/max of the **displayed** samples. | `local-date` (select the local date). `extrema-full-bundle` (compute extrema over the whole bundle, with a fixture whose bundle-wide extreme lies outside the window). `no-recompute` (no recompute on open or visibility). |
| **2. Direction** | Apogee fixture (RR < 0, today > yesterday): RR mode → "Getting closer at sample time"; day-over-day mode → "Farther than yesterday". RR = 0 and equal-days neutral cases. RR mode with today's RR missing → no label. Day-over-day mode with the previous day missing → no label. Details text matches the mode. | `diff-in-rr-mode` (use the daily difference in RR mode; the apogee fixture gives the wrong label). `rr-fallback` (fall back to day-over-day when RR is missing in RR mode). `rounded-compare` (compare displayed values). |
| **3. Missing day, coverage, load failures** | Moon missing today, Sun present: only the Moon row is unavailable, shows its last available date, no marker, gap. Before-coverage and after-coverage clocks show the outside-range wording, distinct from missing-inside. Asset 404 and hash mismatch → Now unavailable, Deep Time fully readable. Malformed data with a **matching test hash** reaches the schema check and fails it. No neighbouring day ever shown as today (rendered text and marker x-position). | `nearest-sample` (substitute the nearest sample, past **and** future neighbour). `skip-schema` (accept malformed data once the hash matches). `merge-gap-states` (outside coverage rendered as a missing day). |
| **4. Phone and keyboard** | At 390 × 844, Readings sheet open, card expanded in **Now and in Deep Time**: no horizontal overflow; globe overlay coverage, measured with the existing camera-based method, within the mobile-pass target (≤ 8%) in each view. Switch reachable by Tab, works with Enter/Space and touch, `aria-selected`/`aria-controls` correct. Text equivalents present in the accessibility tree. Desktop-overflow and mobile-pass rerun. (Screen-reader announcements are not verified, stated as before.) | `no-key-activation` (disable Enter/Space). `hide-text-equivalent` (`aria-hidden` on the text equivalent). |
| **5. Evidence and operations** | Generator accepts the real exports and rejects bad headers; bundle `provenance` matches §3.3; the refresh is rehearsed end to end on a short test window, and that rehearsal's log is kept as reviewable evidence; the §6.2 chain is in the research record; public labels Computed / Measured / Estimated present and distinct. | `wrong-centre` and `wrong-timescale` (fixture header altered; the generator must reject it). `label-swap` (change a public evidence label; the UI check must fail). |
| **S1(a) only: hub route** | Two-revision fixture (R1 + R2, R2 current): each page build fetches its own revision; R1 still served; unknown or malformed IDs → 404 with zero R2 reads; a known revision with missing or altered bytes → 503. Before release: a live check from the **GitHub Pages origin** (CORS, response type `cors`, sha exact). | `serve-unknown-as-current`, `no-per-revision-hash`, `read-on-malformed` (one R2 read on a malformed ID must fail the test). |

Plus, at release: served-hash checks cover the new page file (`sky.js`), and a live RC runs in a clean pane tab first.

## 9. Decisions for Chad (after GPT's recheck)
- **S1** where the bundle is served: (a) existing hub, fixed catalogue (recommended; 3 approved steps per refresh) or (b) page-bundled exception (1 step per refresh).
- **S2** placement: (a) after Orbital with a "Sky" sub-heading (recommended), (b) a Sky group with Orbital moved, (c) Sources only.
- **S3** direction method for the dataset: range rate (recommended) or day-over-day.
- **S4** coverage 2026-06-01 → 2027-12-31 and refresh by 2027-06-01.
- **S5** go for the source pass + first Horizons export (§6.3), research only.

Approve lines, in order (wording settled after S1):
1. `Approve: Sky source pass + first Horizons export (research only, text only, per SKY-TWO-CLOCKS-PROPOSAL rev N §6.3)`
2. `Approve: file the Horizons REGISTER entry (…)`
3. `Approve: build sky-rc on a branch only — no merge, R2 write, hub deploy or page change`
4. (S1a) `Approve: upload ref/sky/<rev>.json (sha256 …) to R2` → `Approve: deploy hub 0.6.5 from <sha> (content only)`
5. `Approve: merge sky-rc to main (page change: Sky on Two Clocks card)`

## 10. Separate follow-on (not in this card)
**The Sun doesn't spin as one piece:** two markers start at the same solar longitude, different latitudes; the equatorial one pulls ahead. Labelled as an illustration of differential rotation. Its own proposal and source pass, after this card.

## 11. Not approved
Source reading, Horizons export, REGISTER filing, branch build, R2 write, hub deploy, page change. The opening-page / Met placement audit is untouched.
