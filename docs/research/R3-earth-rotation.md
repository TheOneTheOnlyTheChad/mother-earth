# R3 — Earth rotation and polar motion (USNO / IERS) — first research gate

**Gate:** first gate only (sample, format, flags, timing, terms, plain-language meaning, presentation assessment). **Research only** — no collector, schedule, deploy, page change, purchase or third-party contact. Written 6 Nov 2026 (thread 18) for Chad's review.
**PARKED 6 Nov 2026 (Chad, after GPT confirmed rev 2) — first-gate research handover accepted.** Any next research gate needs Chad's separate go; no implementation, collector, schedule, deployment, page change or third-party contact.
**Status (rev 2, 6 Nov 2026): numerical feasibility verified; reuse/access checks unresolved.** This is not integration clearance.
**Rev 4 (8 Nov 2026): terms/access review §9 complete (E1–E5 read by GPT on Chad's behalf); public distribution supported, commercial reuse unresolved (not prohibited); research-only REGISTER draft for review, NOT filed; still parked for building.**
**Open questions retained:** consecutive-release revisions · publication timing · Bulletin B column updates · publisher-checksum verification · IERS terms · extended history · polar-motion axis conventions · error-field meaning · independent reproduction of the Bulletin B comparison (details §8).
**Independent check:** GPT independently checked the preserved sample — 34,028 bytes, matching full sha256, 181 records of 187 characters, 89 supplied LOD values and 92 LOD blanks, 25 rows with Bulletin B values and 156 without, the genuine predicted dY zero, and the rapid-value ranges in §6. **GPT has not independently reproduced the Bulletin B comparison figures in §4** — those are Claude's only.
**Rev 2 corrections (GPT review, adopted):** mixed flags separated from missing quantities (§3); the 15 Oct 2026 method change described as a processing change from those releases, not an observation-date break (§4, §7); "rapid estimate" instead of "measured" (§3, §6, §7); freshness assessed per quantity (§3a); error-field meaning left unresolved (§2, §3); terms/access kept unresolved (§5).
**Labels used below:** **Verified** = checked by Claude against the retrieved bytes or a primary page, with the check named · **Interpretation** = Claude's reading, open to challenge · **Open** = not yet checked.

---

## 1. Sample retrieved

| | |
|---|---|
| Product | `finals2000A.daily` — USNO Rapid Service/Prediction Centre (RS/PC), IAU 2000A nutation |
| Source actually used | **IERS data-centre copy:** `https://datacenter.iers.org/products/eop/rapid/daily/finals2000A.daily` (also served byte-identical at `…/data/latestVersion/finals.daily.iau2000.txt`, re-checked 11:36 UTC) |
| Why not USNO | `maia.usno.navy.mil` did not load in the browser pane (navigation "denied or failed" after the site was approved, ~11:05 UTC); a cross-origin fetch failed; both shells were refused at the egress proxy (403). Bulletin A itself lists the IERS data centre as an official alternative distribution point (§5). |
| Retrieved | 2026-11-06 **11:09:10.748Z** (request) – 11:09:11.262Z (body), browser pane, `cache:'no-store'` |
| HTTP | 200 · `Last-Modified: Thu, 05 Nov 2026 17:06:07 GMT` · `Content-Length: 34028` |
| Size | **34,028 bytes**; 181 records, one trailing newline; ASCII only |
| sha256 | **`292f54f7fb3aa103ed411b5dc836a74717278104a21c2f5cd0062914c18aaa98`** (in page via `crypto.subtle`; re-verified in the cloud workspace and on the Mac after a chunked, per-chunk-hashed transfer) |
| Kept at | Mac: `~/Documents/Mother Earth/research/R3/2026-11-06/finals2000A.daily` + `PROVENANCE.md`. **Not committed to the repo.** |
| Not checked | USNO publishes `checksums.sha512` for these files; not fetched (same USNO block), so the sample is not checked against a publisher checksum. |

**This is the 5 Nov release** (Last-Modified 17:06 UTC on 5 Nov). The 6 Nov release had not appeared at retrieval time (§4).

## 2. Format — fixed-width, verified against `readme.finals2000A`

**Verified** (script over all 181 records; columns are 1-based, inclusive, exactly as in the readme):

| Cols | Field | Unit / format |
|---|---|---|
| 1–6 | year (2-digit), month, day | add 2000 for MJD ≥ 51544, 1900 for MJD ≤ 51543 |
| 8–15 | MJD | F8.2, **UTC**, 0 h; all values whole days (fraction .00 on every row) |
| **17** | **polar-motion flag** I / P | |
| 19–27 · 28–36 | Bull. A PM-x · its error | arcseconds |
| 38–46 · 47–55 | Bull. A PM-y · its error | arcseconds |
| **58** | **UT1−UTC flag** I / P | |
| 59–68 · 69–78 | Bull. A UT1−UTC · its error | seconds of time |
| 80–86 · 87–93 | Bull. A LOD · its error | **milliseconds** of time — readme: "NOT ALWAYS FILLED" |
| **96** | **nutation flag** I / P | |
| 98–106 · 107–115 | Bull. A dX · error | **milliarcseconds** (wrt IAU2000A, free core nutation not removed) |
| 117–125 · 126–134 | Bull. A dY · error | milliarcseconds |
| 135–144 · 145–154 | Bull. **B** PM-x · PM-y | arcseconds |
| 155–165 | Bull. **B** UT1−UTC | seconds |
| 166–175 · 176–185 | Bull. **B** dX · dY | milliarcseconds |

- **Every record is 187 characters** (the readme stops at col 185; cols 186–187 are two spaces on all rows). Every separator column the readme marks blank is blank on all rows.
- **Units differ between fields of the same file** (arcsec vs mas; seconds vs ms). Each field must carry its own unit; nothing may be converted silently.
- Calendar date and MJD agree on all 181 rows; consecutive days, no gaps: **8 Aug 2026 (MJD 61260) → 4 Feb 2027 (MJD 61440)** = 90 days of rapid values + 91 days of predictions.
- **Blanks are blanks.** Parsed per field by position; an all-space field = absent (null), never 0. **One genuine zero** exists: predicted dY = `0.000` on 12 Jan 2027 — a real value, kept as 0. (Thread-14 rule: `+''` is 0; this file would be corrupted by it — 92 LOD fields and 156 Bulletin B rows are blank.)
- **Error fields are present for every Bulletin A value that is present**, and absent where the value is absent. Bulletin B columns carry **no** error fields in this file. **What the supplied error values represent is unresolved** (formal error, smoothed estimate, or something else; at what confidence) — they must not be presented as confidence intervals until verified.

### Blanks found (verified)
| Field | Blank rows | Where |
|---|---:|---|
| LOD + LOD error | 92 | **5 Nov 2026 onward** — the newest rapid row and every prediction row. LOD is never predicted in this file. |
| dX, dY + errors (and the nutation **flag itself**) | 10 | 26 Jan – 4 Feb 2027 — nutation predictions stop 10 days before polar motion / UT1 predictions do. |
| All five Bulletin B fields | 156 | **2 Sep 2026 onward** — B values are present only for 8 Aug – 1 Sep (25 rows). |
| Polar motion, UT1−UTC + errors | 0 | — |

## 3. Flags — per quantity, never per row (verified)

The three flags change at **different dates in the same file**, so a row cannot be classified from one flag:

| Quantity | `I` (rapid-service value) | `P` (prediction) | no flag |
|---|---|---|---|
| Polar motion (col 17) | 8 Aug – **5 Nov 2026** (90) | 6 Nov 2026 – 4 Feb 2027 (91) | — |
| UT1−UTC (col 58) | 8 Aug – **5 Nov 2026** (90) | 6 Nov 2026 – 4 Feb 2027 (91) | — |
| Nutation dX/dY (col 96) | 8 Aug – **27 Oct 2026** (81) | **28 Oct 2026** – 25 Jan 2027 (90) | 26 Jan – 4 Feb 2027 (10) |

- **9 rows carry both `I` and `P` flags:** 28 Oct – 5 Nov 2026 (polar motion and UT1−UTC `I`, nutation `P`).
- **Separately, 10 rows have a quantity missing:** 26 Jan – 4 Feb 2027 carry predicted polar motion and UT1−UTC (`P`) but **no nutation at all** (values, errors and flag blank). These are absent values, not a flag mix.
- **`I` does not mean final.** The readme calls it "IERS (I)"; the product metadata (IERS data centre, ISO 19115 record for this file) describes the values as **"quick-look daily estimates"** combining "the most recently available observed and modeled data (including VLBI 24-hour and intensive, GPS, and AAM)", with systematic corrections and **slight smoothing**. *Interpretation:* `I` = **rapid estimate** — an observation-informed combined estimate, preliminary; `P` = **prediction**; **final solutions** are a third thing (§4) and live in the Bulletin B columns. None of the three is described here as a direct measurement.
- **The newest `I` row is the release day itself** (5 Nov in the 5 Nov release). Its errors are slightly larger (PM 40–41 µas vs 26 µas a few weeks earlier) and its LOD is blank. *Interpretation:* the release-day value is an estimate at the leading edge, not a completed day.
- **The supplied error values grow with prediction lead time** (verified from the error columns): PM-x 0.6 mas on day 1 → 7.9 mas at day 91; UT1−UTC 25 µs → 8.6 ms. Bulletin A states its own accuracy expressions for predictions (§4). What the error values represent is unresolved (§2).

## 3a. Freshness — per quantity, not per file (verified in the sample)

| Quantity | Latest rapid estimate (`I`) | Predictions to | Note |
|---|---|---|---|
| Polar motion x, y | 5 Nov 2026 (release day) | 4 Feb 2027 | release-day value is a leading-edge estimate |
| UT1−UTC | 5 Nov 2026 (release day) | 4 Feb 2027 | same |
| LOD | **4 Nov 2026** | — (never predicted here) | blank from 5 Nov |
| Nutation dX, dY | **27 Oct 2026** | 25 Jan 2027 | predicted from 28 Oct |
| Bulletin B (final) columns | **1 Sep 2026** | — | lag the latest Bulletin B (§4) |

- **Neither the file's `Last-Modified` nor the newest `I` row establishes freshness for every field.** Each quantity carries its own latest date, and any later reading would have to state it per quantity.

## 4. Preliminary, predicted and final — and timing

**Three tiers, kept apart:**
1. **Rapid estimates (Bulletin A, `I`)** — daily, observation-informed combined estimates (quick-look).
2. **Predictions (Bulletin A, `P`)** — 90 days forward (nutation shorter).
3. **Final solutions (Bulletin B / IERS C04)** — monthly, from the IERS Earth Orientation Centre (Paris Observatory), not USNO.

**Verified, Bulletin B timing:** the latest Bulletin B on the IERS data centre is **No. 465, dated 2 Nov 2026**: final values **2 Sep – 1 Oct 2026** plus a "Preliminary extension" **2 Oct – 1 Nov**; its header says it is the upgraded C04 solution consistent with ITRF 2020 and gives units in mas and ms. **The 5 Nov daily file's Bulletin B columns stop at 1 Sep** — i.e. it had not yet taken in No. 465's finals, three days after that bulletin's date. *Interpretation:* B columns lag the latest Bulletin B; their update day is **Open**.

**Rapid vs final size (sample against Bulletin B 465) — Claude's figures only; not independently reproduced:**
| Dates | n | max \|rapid − B\| PM-x | PM-y | UT1−UTC |
|---|---:|---:|---:|---:|
| 2 Sep – 1 Oct (B "final") | 30 | 0.085 mas | 0.103 mas | 0.072 ms |
| 2 Oct – 1 Nov (B "preliminary extension") | 31 | 0.122 mas | 0.105 mas | 0.047 ms |

*Interpretation, careful:* these are differences **between two series** (USNO rapid vs the C04-based Bulletin B), not proof of how much a given daily value was revised. They are small next to the day-to-day change (PM moves ~1 mas per day here). They exceed the supplied error values (~0.03–0.04 mas), but since what those error values represent is unresolved (§2), no conclusion is drawn from that.

**Revisions of the daily file itself — Open.** One retrieval cannot show whether yesterday's `I` values change in today's release. That needs ≥ 2 consecutive daily releases compared row by row (a second retrieval after ~18:00 UTC today would be the first data point).

**Processing change from the 15 Oct 2026 releases (verified, Bulletin A Vol. XXXIX No. 045, 5 Nov 2026):** starting with the weekly Bulletin A products published on **15 Oct 2026**, the RS/PC computes its products with a **new algorithm** (Kalman smoother + weighted cubic spline, improved AAM pre-processing). USNO expects better 0–7-day UT1−UTC predictions, and says values may show **slight changes compared with previously published values up to one year back, expected < 0.05 mas (PM) and < 20 µs (UT1−UTC)**.
- This is a change in **processing, from those releases onward** — not an established discontinuity at the **observation date** 15 Oct 2026. Values for earlier observation dates may differ between releases made before and after the change.
- Consequence for any later work: **preserve release/version provenance** with every value (which release it came from, retrieved when). **Do not automatically split a time-series baseline at the 15 Oct observation date.**

**Publication timing — sources disagree, one data point:**
- USNO daily page: daily files "scheduled for release daily between **17:30 and 18:00 UTC**".
- USNO `ser7/readme`: daily files updated "normally about **17:05 UTC**"; weekly files Thursdays.
- USNO products page: "by 18:00 UTC" daily and "20:00 UTC Thursdays" for Bulletin A (in the CDDIS context).
- **Observed:** IERS mirror `Last-Modified` **17:06:07 UTC** (5 Nov) for the daily file; Bulletin A 17:20:54 UTC (5 Nov, a Thursday). One day only — **not a measured publication delay.** File modification time says when the file changed, not how fresh each quantity is (§3a).

## 5. Reuse and automated access — **unresolved; not integration clearance**

**Explicit (verified on the page named):**
- USNO daily products page and Bulletin A (5 Nov): **"Distribution Statement A. Approved for public release: distribution unlimited."**
- Bulletin A: the **primary source** is `maia.usno.navy.mil`; products are **also available** from NASA CDDIS and the **IERS Central Bureau (`datacenter.iers.org/eop.php`)**; questions to `eopcp@us.navy.mil` (no contact made).
- IERS data-centre metadata for this file: **fees "free of charge"**, update frequency "daily", originator USNO.
- *Reading:* the public-release wording is **positive evidence** for reuse. "Free of charge" concerns cost; it **does not settle** redistribution, derived-product publication or automated-access questions.
- USNO `ser7/readme`: the daily files are "[Recommended for highest accuracy real-time applications]".

**Not found (Open):**
- No licence text, **no citation requirement**, no automated-access policy, request limit or User-Agent rule found on the USNO pages read (daily, products, FAQ, `ser7/readme`, `readme.finals2000A`).
- **IERS terms:** the data centre links "Legal and Privacy" to `iers.org/…/Imprint/imprint_node.html`; my fetch tools could not open it (outside the session allowlist). **Not read.** Whether the IERS copy carries terms of its own is therefore unresolved.

**Assumptions, labelled as such (not permissions):**
- That the USNO files, as U.S. Government work, carry no U.S. copyright — **an assumption**, not a statement found on the pages.
- That polite automated access (one small daily fetch, after release, honouring `Last-Modified`) is acceptable — **an assumption**; no policy found either way.
- *Project practice (recommended, not required by any source found):* attribute "IERS Rapid Service/Prediction Centre, U.S. Naval Observatory (IERS Bulletin A)" and, for finals, "IERS Earth Orientation Centre (Bulletin B / C04)"; record the source URL actually used and its retrieval time.

## 6. What the quantities mean (plain language)

Keep these three apart — different things, different units, different sign conventions.

**Length-of-day deviation (LOD), milliseconds.** The **estimated** deviation of the length of day from the nominal **86,400 SI seconds**, at the reported epoch (0 h UTC of the row's date): positive = longer, negative = shorter. It is a rapid estimate from combined observations and modelling — **not a stopwatch measurement of a completed calendar day**. In the sample (rapid estimates): from **−0.39 ms (9 Aug 2026)** to a high of **+1.71 ms (24 Oct)**; latest available **+1.29 ms (4 Nov)**. LOD is never predicted in this file.
*Verified consistency:* LOD agrees with the day-to-day change of UT1−UTC (centred difference, sign reversed) to within **0.076 ms** on all 88 comparable days — the two fields tell the same story, as they should.

**Polar motion (x, y), arcseconds.** Earth's rotation axis wanders relative to the crust. x and y give where the axis pierces the crust, measured from the IERS reference pole; x toward the Greenwich meridian, y toward 90° W (*from standard IERS convention; Open: confirm against the IERS Conventions text*). 0.001″ ≈ **3.1 cm** on the ground at the pole (arithmetic: 1 mas × Earth radius). Rapid estimates: x **0.133–0.224″**, y **0.318–0.360″** — the pole moved **a few metres** over the 90 days. It is **not** the magnetic pole and **not** a tilt of Earth relative to the Sun.

**UT1−UTC, seconds.** UT1 is time kept by Earth's actual rotation; UTC is atomic time with leap seconds. Their difference here: **+0.0117 s (11 Aug) → −0.0596 s (5 Nov)**, predicted −0.145 s by 4 Feb 2027. It drifts because rotation is uneven; leap seconds (when announced) keep it within ±0.9 s. Bulletin A (5 Nov): **no leap second at the end of December 2026**; TAI−UTC = 37 s since 1 Jan 2017; DUT1 broadcast = −0.1 s from 29 Oct 2026. A leap second would make UT1−UTC **jump by 1 s** — a step that is not a physical change. *Interpretation:* LOD is the day-by-day rate; UT1−UTC is the accumulated result plus leap-second bookkeeping.

(dX, dY — celestial pole offsets in mas — are a correction to the precession/nutation model. Not proposed for display; kept in any record for completeness.)

## 7. Presentation assessment (research directions, not UI designs)

| Question | Honest as | Limits |
|---|---|---|
| *How did the estimated day length differ?* | A **global index reading** (like Kp/CO₂): latest rapid-estimate LOD in ms with its own date — **≥ 1 day behind** polar motion/UT1 (§3a) — plus a 90-day time series. | Label as **rapid estimate**, not "measured"; rapid ≠ final. No predictions exist for LOD. Error values shown only once their meaning is verified. |
| *How has the rotation pole moved?* | A **time-series path** (x vs y) of rapid estimates, predictions drawn distinctly. | Real excursion is metres; **any drawing on the globe needs an explicitly stated exaggeration** (order 10⁵–10⁶ to be visible at globe scale) or must stay in a separate x–y panel in true units. Not a per-cell value, not a place. |
| *How does rotation-based time differ from UTC?* | A **global index reading** in seconds (or ms) + time series, flag and date per value. | Predictions are model output (label **Projected/Computed** per project rules, not Observed); leap seconds must be shown as steps. |

- **Global readings only** — none of these is an Earth-cell quantity; no cell values, no links to other layers.
- **Uncertain / not yet supported:** the daily revision pattern (§4), the Bulletin B column update day, IERS terms (§5), and any "how unusual" comparison — no baseline chosen; Bulletin B / C04 would be the source's own long series, and the 15 Oct 2026 processing change means values for the same observation date can differ by release — keep release provenance; do not split a baseline at that observation date by default.

## 8. Future work — each needs a separate go from Chad
No further fetching or investigation was done in the rev-2 correction pass.
1. **Revisions:** compare ≥ 3 consecutive daily releases row by row (which `I` values change, by how much, how far back).
2. **Publication time:** record `Last-Modified` for several days (USNO says 17:05, 17:30–18:00 and "by 18:00").
3. **Bulletin B columns:** on which day the daily file absorbs a new Bulletin B.
4. **USNO direct:** retry `maia.usno.navy.mil` (other route) and check the sample against `checksums.sha512`.
5. **IERS terms:** read the IERS imprint / legal page.
6. **Extended file** (`finals2000A.daily.extended`, USNO, since 2 Jan 1973, 1 year of predictions) — **not assessed**. Only noted: the IERS weekly `finals.all.iau2000.txt` is 3,776,544 B, 20,089 lines, 2 Jan 1973 → padded rows to 1 Jan 2028 with blank value fields (Last-Modified 5 Nov 17:20:53 UTC, sha256 `4c2308a3a782…`). Payload and processing cost unmeasured.
7. Confirm the x/y axis directions against the IERS Conventions text.
8. **Error-field interpretation:** what each supplied error value represents, before any is shown.
9. Independent reproduction of the Bulletin B comparison figures (§4).

## 9. Terms and access review (rev 4, 8 Nov 2026; Chad's go: bounded, read-only, R3 only) — for GPT
**Scope:** only the recorded terms/access questions: §5 "Not found" (USNO licence, citation, automated-access policy; IERS terms) and §8 item 5. **No data fetched or sampled, no provider contact, no route selection, no implementation, resources, schedules, deploy or page change.** R6, GIBS and other gates not started. **Terms clarification alone does not clear R3 for building**; the technical items in §8 (revisions, timing, Bulletin B columns, checksums, extended file, axis conventions, error fields, reproduction) and all accepted technical findings are unchanged.
**Rev 4 (8 Nov 2026):** the bounded extraction is complete. E1–E5 were independently inspected by GPT on Chad's behalf (GPT is the reader; Chad did not personally inspect them). A6's IAG-terms claim is **withdrawn** (§9.2). Interpretation and unanswered questions revised (§9.4–9.5); research-only REGISTER draft for review (§9.6).
**Evidence status labels:** *Claude (6 Nov)* = read in the rev-1 pass (§5) · *Claude (fetch summary)* = read 8 Nov with Claude's web-fetch tool, which returns a summary with quotations · *GPT (read, 8 Nov)* = GPT independently inspected the page on Chad's behalf.

### 9.1 Distributions in play (no route selected)
| Route | Operator | Evidence |
|---|---|---|
| `maia.usno.navy.mil` | USNO, IERS Rapid Service/Prediction Centre (RS/PC) | Bulletin A names it the primary source (Claude, 6 Nov); the IERS metadata's `dataSetURI` points to `https://maia.usno.navy.mil/ser7/finals2000A.daily` (E4, GPT) |
| `datacenter.iers.org` | IERS data centre. BKG is the responsible federal authority for the **IERS website** (E2, GPT); the data centre's **server-hosting arrangement is not established** | Bulletin A lists it as an alternative (Claude, 6 Nov); the rev-1 sample came from it |
| NASA CDDIS | NASA (ESDIS) | Bulletin A lists it as an alternative (Claude, 6 Nov) |
- *Interpretation:* the IERS and CDDIS copies are **distribution routes** for a USNO product. A mirror does not automatically establish a different underlying data licence. Product rights, website/service conditions and the route are kept separate below.

### 9.2 Evidence, separated by question
**A. Product rights and reuse / commercial terms**
| # | Statement | Page | Applies to | Status |
|---|---|---|---|---|
| A1 | "Distribution Statement A. Approved for public release: distribution unlimited." | USNO `maia` site, incl. [daily products](https://maia.usno.navy.mil/products/daily.htm); Bulletin A (5 Nov 2026) | USNO products as marked | Claude (6 Nov) · **GPT (read, 8 Nov, E3)** |
| A2 | fees "free of charge"; `dataSetURI` `https://maia.usno.navy.mil/ser7/finals2000A.daily`; metadata `dateStamp` 2026-11-07; **no** `resourceConstraints`, `MD_LegalConstraints`, `useLimitation`, `accessConstraints`, `useConstraints` or `otherConstraints` elements | [IERS XML metadata](https://datacenter.iers.org/products/eop/rapid/daily/metadata/finals2000A.daily.me.xml) | The IERS copy. Cost only; **absent constraint elements do not establish unrestricted reuse** | Claude (6 Nov, fees) · **GPT (read, 8 Nov, E4)** |
| A3 | NASA-mission data CC0 unless marked; "Non-NASA data available through the ESDIS project is subject to the license arrangements of the sponsoring organization." | [NASA Earthdata Data Use and Citation Guidance](https://www.earthdata.nasa.gov/earth-observation-data/data-use-policy) | The CDDIS route; *Interpretation:* defers to USNO, CC0 not applicable | Claude (fetch summary) |
| A4 | "…considered public information and may be distributed or copied unless otherwise specified" | [USNO AA notice](https://aa.usno.navy.mil/about/PrivacyNotice), [navy.mil privacy policy](https://www.navy.mil/Privacy-Policy/) | **Those sites only.** Not imported to `maia` (no `maia` notice exists, E3) | Claude (fetch summary); context only |
| ~~A6~~ | ~~IERS footer links to IAG terms~~ — **withdrawn (rev 4):** the IAG/GGOS news article's own footer was misattributed to IERS. The current IERS footer links to its own legal notice (E2). | — | — | Withdrawn |

**B. Website / service conditions**
| # | Finding | Page | Status |
|---|---|---|---|
| B1 | The data-centre homepage's "Legal and Privacy" link points to `https://www.iers.org/IERS/EN/Service/Imprint/imprint_node.html`, which **returns 404**. The EOP page offers downloads and product metadata. No reuse licence, citation requirement or numerical download limit on the inspected index pages. | [datacenter.iers.org](https://datacenter.iers.org/), [eop.php](https://datacenter.iers.org/eop.php) | GPT (read, 8 Nov, E1) |
| B2 | Current IERS legal notice (reached from the current IERS homepage footer): **BKG is the responsible federal authority**; liability and privacy information. **No data-reuse licence, commercial-use grant, citation condition or numerical access limit.** Verifies BKG's responsibility for the website only; the website copyright footer is **not** evidence that linked data products belong to BKG. | [iers.org legal notice](https://www.iers.org/iers/en/service/imprint) | GPT (read, 8 Nov, E2) |
| B3 | `maia`: no separate privacy/security/reuse-notice link on the homepage, daily-products, products or FAQ pages. | [maia](https://maia.usno.navy.mil/) | GPT (read, 8 Nov, E3) |

**C. Attribution**
- No citation requirement found on USNO (Claude, 6 Nov; GPT E3, E5) or IERS pages (GPT E1, E2), nor in the IERS metadata (E4).
- NASA ESDIS (A3) strongly urges citing data, for the CDDIS route.

**D. Automated-access guidance**
- USNO products and FAQ pages document downloads, alternative distribution and **publisher-checksum links**; **no scripted-download rule** (GPT, E5).
- USNO `ser7/readme`: daily files "[Recommended for highest accuracy real-time applications]" (Claude, 6 Nov). **Intended real-time use does not establish a particular polling allowance** (GPT).

**E. Numerical limits**
- **No numerical rate, cadence or load limit found** in the pages inspected: USNO `maia` homepage, daily, products, FAQ, `ser7/readme`, `readme.finals2000A`; IERS data-centre homepage and EOP page, IERS legal notice, IERS XML metadata; NASA Earthdata guidance (6–8 Nov 2026). **Not evidence of unlimited access.**

### 9.3 Extraction record (E1–E5)
Completed 8 Nov 2026 by GPT on Chad's behalf (findings in §9.2: E1 → B1; E2 → B2, A6 withdrawn; E3 → A1, B3; E4 → A2; E5 → D). The E4 metadata inspection is not a new numerical sample or a revision comparison.

### 9.4 Interpretation (open to challenge)
- **Public distribution is positively supported** (A1, on `maia` itself).
- **Commercial reuse is not yet established** by this evidence. **That is not a finding that reuse is prohibited.** No page states a licence, commercial-use grant or prohibition for the product.
- **U.S.-government-work reasoning:** that the USNO files carry no U.S. copyright because they are works of the U.S. Government is an **inference requiring assessment**. No page read states it; A4's notices cover other sites and are not imported.
- **Routes:** the IERS copy's metadata adds cost and provenance (`dataSetURI` to `maia`) but no constraints; the IERS legal notice governs the website, not demonstrably the products. CDDIS defers to USNO. *Interpretation:* the product's rights follow USNO under every route found; no route-specific licence was found.
- **Attribution:** no binding requirement found; project practice (§5) stands.

### 9.4a Provider enquiry (recorded 8 Nov 2026)
- **Sent by Chad, 8 Nov 2026**, to `eopcp@us.navy.mil` (the contact Bulletin A gives): asking about commercial reuse; storage, reformatting and redistribution; the IERS mirror; attribution; and one automated download per day. **Reply pending.**
- **No permission is inferred from sending the email or from silence.** The reuse position stays UNRESOLVED (§9.4, §9.6). No follow-up contact or further R3 work without Chad's go.

### 9.5 Unanswered questions
1. The **commercial-reuse position** for the USNO product (A1 supports public distribution; no grant, licence or prohibition found).
2. Assessment of the **U.S.-government-work inference** (who assesses, against what source).
3. The data centre's **server-hosting arrangement** (not established by E2).
4. Any **polling allowance**: none stated; any later proposal states its own cadence; not unlimited.

### 9.6 Proposed REGISTER entry — research-only DRAFT for review (NOT filed)
```
## USNO / IERS — Earth orientation parameters, finals2000A.daily (IERS Rapid Service/Prediction Centre, USNO) — research only, not on the page
- **Read:** 6 Nov 2026 by Claude (USNO daily, products, FAQ, ser7/readme, readme.finals2000A; IERS data-centre metadata; Bulletin A); 8 Nov 2026 by GPT on Chad's behalf (E1 IERS data centre + EOP page; E2 IERS legal notice; E3 USNO maia homepage + daily products; E4 IERS XML metadata; E5 USNO products + FAQ); 8 Nov 2026 by Claude (NASA Earthdata guidance). Research record: docs/research/R3-earth-rotation.md §5, §9.
- **Product marking (verbatim, USNO maia + Bulletin A):** "Distribution Statement A. Approved for public release: distribution unlimited."
- **IERS copy (metadata, dateStamp 2026-11-07):** fees "free of charge"; dataSetURI https://maia.usno.navy.mil/ser7/finals2000A.daily; no constraint elements (absence ≠ unrestricted reuse).
- **Website conditions:** IERS legal notice (BKG responsible for the website; liability/privacy; no data licence, citation condition or limit) — website only, not product rights. Data-centre "Legal and Privacy" link 404. USNO maia: no separate site notice.
- **CDDIS route:** non-NASA data follow the sponsoring organisation's terms (NASA Earthdata guidance); NASA CC0 not applicable.
- **Attribution:** no requirement found. Project practice: credit "IERS Rapid Service/Prediction Centre, U.S. Naval Observatory (IERS Bulletin A)"; record the URL used and retrieval time.
- **Automated use:** downloads, alternative distribution and publisher checksums documented; daily files recommended for real-time applications. No scripted-download rule and no numerical rate/cadence/load limit found in the pages inspected (6–8 Nov 2026) — not unlimited; any proposal states its own cadence.
- **Coverage statement:** none filed (R3 technical gates open).
- **Status:** ⛔ research only; not cleared for building.
- **Provider enquiry:** sent by Chad to eopcp@us.navy.mil, 8 Nov 2026; reply pending; no permission inferred from the email or from silence.
- **Commercial use:** UNRESOLVED — public distribution is supported (Distribution Statement A); no licence, commercial-use grant or prohibition found. The U.S.-government-work reasoning is an inference requiring assessment. Not a finding that reuse is prohibited.
```

## Sources
- Terms pass, 8 Nov 2026 (Claude fetch summaries): [NASA Earthdata Data Use and Citation Guidance](https://www.earthdata.nasa.gov/earth-observation-data/data-use-policy) · [USNO AA privacy/security notice](https://aa.usno.navy.mil/about/PrivacyNotice) · [navy.mil privacy policy](https://www.navy.mil/Privacy-Policy/) · ~~IAG/GGOS post on the IERS relaunch~~ (withdrawn as evidence, rev 4)
- Read by GPT on Chad's behalf, 8 Nov 2026: [IERS data centre](https://datacenter.iers.org/) · [EOP page](https://datacenter.iers.org/eop.php) · [IERS legal notice](https://www.iers.org/iers/en/service/imprint) · [maia](https://maia.usno.navy.mil/) · [IERS XML metadata](https://datacenter.iers.org/products/eop/rapid/daily/metadata/finals2000A.daily.me.xml) · [USNO products](https://maia.usno.navy.mil/products/eo-products) · [USNO FAQ](https://maia.usno.navy.mil/information/eo-faq)
- [USNO daily products](https://maia.usno.navy.mil/products/daily.htm) · [readme.finals2000A](https://maia.usno.navy.mil/ser7/readme.finals2000A) · [ser7/readme](https://maia.usno.navy.mil/ser7/readme) · [USNO products](https://maia.usno.navy.mil/products/eo-products) · [USNO FAQ](https://maia.usno.navy.mil/information/eo-faq) — read via WebFetch, 6 Nov 2026
- IERS data centre (browser pane, 6 Nov 2026 ~11:09–11:36 UTC): [finals2000A.daily](https://datacenter.iers.org/products/eop/rapid/daily/finals2000A.daily) · [file metadata](https://datacenter.iers.org/products/eop/rapid/daily/metadata/finals2000A.daily.me.xml) · [Bulletin A, 5 Nov 2026](https://datacenter.iers.org/data/latestVersion/bulletinA.txt) · [Bulletin B 465](https://datacenter.iers.org/data/latestVersion/bulletinB.txt) · [EOP index](https://datacenter.iers.org/eop.php)
