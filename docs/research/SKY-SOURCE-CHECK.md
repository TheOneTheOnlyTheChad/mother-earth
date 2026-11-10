# Sky on Two Clocks — source pass + first Horizons export (research record, rev 2)

**Run:** 10 Nov 2026 (times are LOG entries, Mac clock; request times in `export/REQUESTS.md`, pane clock), 08:28:54Z (protocol fixed) → 08:43:20Z (last log entry), Mac clock. Research only, text only. Authority: Chad, "Approve: Sky source pass + first Horizons export (research only, text only, per SKY-TWO-CLOCKS-PROPOSAL rev 2 §6.3) …".
**Packet (Mac, not in the repo):** `~/Documents/Mother Earth/research/sky-two-clocks/2026-11-10-claude/` — `PROTOCOL.md` (sha256 `0a4e2443…9dc5`, fixed before any request), append-only `LOG.md`, `sources/` (page text or verbatim excerpts with page hashes), `export/` (raw responses unedited, request files, `REQUESTS.md`, `check_export.py` + `.out.json`), `.hashes-pass` (29 files).
**Reader:** Claude, in the Claude desktop browser pane. Chad granted pane site access during the run: hpiers.obspm.fr, science.nasa.gov, nasa.gov, eclipse.gsfc.nasa.gov, eclipse2017.nasa.gov. No login, no PDF, no image saved, no form submitted. The "I Accept the Terms Above" control on ssd-api.jpl.nasa.gov was **not** clicked; no request needed it.
**Nothing filed, built, uploaded or deployed.** The REGISTER wording in §5 is a draft.

**Rev 2 (10 Nov 2026, after GPT's review of rev 1):** GPT matched this record's sha256, verified the frozen protocol and all 29 packet hashes, reproduced `check_export.out.json` and independently parsed all seven raw responses (Mac copy; the GitHub commit, live Wayback replay and publisher full text were outside GPT's independent check). Exports pass for research use. Corrections applied: (1) CSV isolation attributed to the full-window pairs #3 vs #5 (GET) and #2 vs #7 (File API); #4 changed two variables; format change and File API diagnostics recorded as deviations from the frozen recipe; (2) UTC: Horizons' `UT~` flag from 2027-02-04 and the unresolved leap-second decision from 2027-07-01 kept as separate facts; the "~2 ms" timing claim withdrawn; (3) API version pins: 1.2 (GET text parser) and 1.0 (File API cross-check), separately; (4) widening wording "Estimated from changes in Mercury's orbit consistent with solar mass loss"; 0.92 cm/yr labelled Mother Earth's estimate; (5) card keeps "hundreds of millions of years", the attributed ~650 Myr goes to Sources; (6) REGISTER draft records the operator-triggered browser requests and default User-Agent. Frozen packet unchanged; corrections note at `rev2/CORRECTIONS-rev2.md` in the packet.

## 1. Results at a glance
| Item | Result |
|---|---|
| Horizons export | **Accepted.** Moon and Sun, 579 daily samples each at 00:00:00 UTC, 2026-06-01 … 2027-12-31, geometric, Earth body centre, DE441, km and km/s, RG and RR present. Independently cross-checked (§3.4). |
| Recipe change needed | `CSV_FORMAT='NO'` (vector columns absent with CSV in these requests — observed, §3.2). Route 2 (`TIME_TYPE='UT'`) accepted; route 1 used as the independent check. Both changes are **deviations from the frozen recipe**. |
| UTC caveat | Two separate facts (§3.3): Horizons flags rows from **2027-02-04** as `UT~`; and **2027-07-01** is the first sample date affected by the not-yet-announced end-June 2027 leap-second decision (Bulletin C 72 establishes the offset through 2027-06-30). |
| Annual Sun range | Sampled extrema 147,104,596 km (2027-01-03) and 152,100,460 km (2027-07-05): **5.0 million km**. Matches D1 (147 / 152 million km). |
| Lunar recession | 3.8 cm/yr by lunar laser ranging — L1 (Dickey et al. 1994) and L2. |
| End of total solar eclipses | L2 (archived): "about 650 million years", an estimate attributed to Lou Mayo's archived NASA article, with no underlying citation. Card keeps "hundreds of millions of years"; the attributed figure goes in Sources with the archive link and capture date. |
| Solar mass loss | The 1.5 cm/yr in M1 is the **earlier theoretical prediction**. M1b fitted a **change in the Sun's GM**, −(6.13 ± 1.47) × 10⁻¹⁴ /yr, consistent with mass loss. **Mother Earth's estimate** from it: ≈ 0.92 cm/yr (0.70–1.14) at 1 AU, ≈ 0.9 m per century (§4). |
| Brightening | M2 supports "increasing amounts of energy … from the aging, expanding Sun" over billions of years; no rate. |
| Reuse | SSD FAQ: data "considered public domain", citation recommended, no endorsement, modifications identified. Visualization apps are steered to local alternatives over repeated network calls — a bundled, hand-refreshed export fits (§5). |

## 2. Sources read
| ID | Source (URL) | Logged (Mac clock) | Page hash | Operative finding |
|---|---|---|---|---|
| H1a | Horizons manual, ssd.jpl.nasa.gov/horizons/manual.html (lastModified 2026-11-05) | 08:29:38Z | `f0afac1e…5cfe8` | Vector tables accept TDB, TT or UT. "After 1962, UT means UTC". Future leap seconds unknown; "the closest known leap-second correction is used over future time-spans". TT and TDB differ by at most 0.002 s. Aberration NONE = geometric; table 3 = state + LT + range + range-rate. |
| H1b | Horizons API doc, ssd-api.jpl.nasa.gov/doc/horizons.html, "Version: 1.3 (2025 June)" | 08:30:01Z | `8b486cd5…89306` | `TIME_TYPE`: vector tables TDB or UT. `TLIST` up to 10,000 times; URL length may limit. Check the output's API version against the doc. |
| H1c | Horizons batch instructions, ssd.jpl.nasa.gov/ftp/ssd/horizons_batch.txt | 08:39:25Z | `49df264d…c208` | Input lines "should be less than 80 characters"; TLIST may span lines. |
| H1d | Horizons File API doc, "Version: 1.0 (2021 July)" | 08:39:25Z | `55cb1548…6d4f` | POST input file; syntax per batch instructions. |
| H2a | SSD FAQ, ssd.jpl.nasa.gov/faq.html | 08:30:23Z | `0b65b1a9…0936` | "No permissions are needed. The data provided on this site are considered public domain." Citation form; no endorsement; identify modifications. Visualization apps should consider local alternatives first. The page's Fair Use link is malformed (`https://https//ssd-api…`). |
| H2b | SSD API Fair Use Policy, ssd-api.jpl.nasa.gov | 08:30:41Z | `bfd027df…4944` | One request at a time; only necessary requests; cache and reuse; automated apps send an application User-Agent; no embedding in websites; formats may change; best effort. |
| H3 | IERS Bulletin C 72 (Paris, 06 July 2026), hpiers.obspm.fr/iers/bul/bulc/bulletinc.dat | 08:31:22Z | `310e172e…52f0` (saved whole) | No leap second at end Dec 2026; UTC−TAI = −37 s from 2017-01-01 until further notice. |
| D1 | APOD 2025 Jan 4 "Welcome to Perihelion" (Nemiroff & Bonnell), science.nasa.gov | 08:33:31Z | `ed2fcda3…0949` | Elliptical orbit; perihelion ~147 million km, aphelion ~152 million km. Image © Peter Ward, not used. |
| M2 | NASA Science, life-and-death ch. 5 | 08:33:31Z | `c0dae05e…ace4` | "the increasing amounts of energy Earth will receive from the aging, expanding Sun" over the next couple of billion years. No rate, no mass loss. |
| M1 | NASA, "NASA Team Studies Middle-aged Sun by Tracking Motion of Mercury" (2018-01-18) | 08:33:31Z | `dd929f21…2d39` | 1.5 cm/yr per AU = the **earlier theoretical** prediction (0.1% of the Sun's mass over 10 billion years); "The new value is slightly lower". |
| M1b | Genova et al. 2018, Nat Commun 9, 289, doi:10.1038/s41467-017-02558-1 (publisher page, version of record 18 Jan 2018, CC BY 4.0, no notices found) | 08:33:31Z | `0ac2827b…3a5d` | GM_sun-dot/GM_sun = (−6.13 ± 1.47) × 10⁻¹⁴, "consistent with the expected solar mass loss"; eq. (3) GṀ/GM = Ġ/G + Ṁ/M; \|Ġ\|/G < 4 × 10⁻¹⁴ /yr; expected total mass loss −(0.9–1.1) × 10⁻¹³ M_sun/yr. No orbit-widening figure stated. |
| L1 | NASA GSFC "Secular Acceleration of the Moon", eclipse.gsfc.nasa.gov/LEcat5/secular.html (Last Updated 2009 Jan 29) | 08:34:42Z | `14e1e873…69b2` (saved whole) | LLR: mean distance increasing by 3.8 cm/yr (Dickey et al. 1994); day lengthening ~2.3 ms per century; the page describes **energy** transfer and a torque, not angular momentum. |
| L2 | "The Very Last Solar Eclipse!" (Lou Mayo), eclipse2017.nasa.gov — **live URL now redirects** to science.nasa.gov/eclipses/; read from Wayback capture 20250104071831 (Memento 2025-01-04 07:18:31 GMT) | 08:35:55Z | `6ee7e6a3…12b7` (replay text) | 3.8 cm/yr by laser ranging; "in about 650 million years … no more total solar eclipses" (uncited). Its mechanism paragraph conflates energy and angular momentum — not to be used for wording. |

## 3. Horizons export

### 3.1 Requests (7, one at a time; full table in `export/REQUESTS.md`)
| # | What | Outcome |
|---|---|---|
| 1 | Moon, route 1 (TLIST of my TDB epochs on one line, CSV) | Failed: 80/579 epochs; no vector columns |
| 2 | Moon, route 1, one epoch per line (CSV) | Failed: 579/579 epochs exact; no vector columns |
| 3 | Moon, route 2 (`TIME_TYPE='UT'`, START/STOP/STEP, CSV) | Failed: 579 rows at 00:00 UT; no vector columns |
| 4 | Diagnostic: route 2, 2 days, CSV off | Vector data present; rows labelled UTC |
| **5** | **Moon export**, route 2, CSV off | **Accepted** — 174,433 B, `26d8c2b5…54bb` |
| **6** | **Sun export**, route 2, CSV off | **Accepted** — 174,433 B, `ce2aaea5…3341` |
| 7 | Moon cross-check, route 1, one epoch per line, CSV off | 579/579 TDB epochs = requested; agrees with #5 (§3.4) |

User-Agent: the pane browser's own (recorded); a fetch cannot set it. The Mac shell, which could send the project agent, was refused at its proxy (403). This is a manual, one-off export, so the "automated connections" User-Agent clause does not obviously apply; recorded for GPT.

### 3.2 Header facts (both accepted exports; parsed by `check_export.py`)
Target "Moon (301) {source: DE441}" / "Sun (10) {source: DE441}"; Center "Earth (399) {source: DE441}", site "BODY CENTER"; Output type "GEOMETRIC cartesian states"; format "3 (position, velocity, LT, range, range-rate)"; units "KM-S"; frame "ICRF"; start/stop "A.D. 2026-Jun-01 00:00:00.0000 UT" / "A.D. 2027-Dec-31 00:00:00.0000 UT"; step "1440 minutes"; EOP file "eop.261109.p270204", coverage "DATA-BASED 1962-JAN-20 TO 2026-NOV-09. PREDICTS-> 2027-FEB-03"; first line "API VERSION: 1.2".

**CSV finding (observed for these requests, not documented):** requests #1–3 returned epoch rows without vector values. The full-window pairs isolate CSV mode: **#3 vs #5** on the GET route (identical except `CSV_FORMAT`) and **#2 vs #7** on the File API route (identical input apart from `CSV_FORMAT`). #4 returned both days with `RG` and `RR` but changed two variables (CSV and date span), so it was a pointer, not the isolating test. The labelled text format has named `RG=` / `RR=` fields.

**Deviations from the frozen recipe (protocol `0a4e2443…`):** `CSV_FORMAT='NO'` instead of `'YES'`; the File API line-length correction (one epoch per line) between #1 and #2; diagnostic request #4; route 2 accepted after route 1 failed, with route 1 kept as the cross-check (#7).

**API version:** GET responses say 1.2; the API document says 1.3 (change log: 1.3 "Update to mention TIME_TYPE setting"). File API responses say 1.0, matching its own document. Pins: **1.2** for the tested GET text parser and **1.0** for the File API cross-check, kept separate. The generator rejects any other version and validates header, epochs and row fields even when the pin matches.

### 3.3 Time scale
- Every retained row is at `00:00:00.0000` on its date, dates continuous 2026-06-01 … 2027-12-31, 579 per body, no 2028 row.
- Rows to **2027-02-03 are labelled `UTC`** (248); rows from **2027-02-04 are labelled `UT~`** (331). The response footer: conversion to UTC "has not been determined for UTC times after the next July or January 1st. Therefore, the last known leap-second is used as a constant over future intervals, a condition noted here as "UT~"."
- **Two separate facts, both kept:** (a) Horizons flags `UT~` from **2027-02-04** (the end of its EOP prediction); the raw flags are preserved per row. (b) IERS Bulletin C 72 establishes UTC−TAI = −37 s through **2027-06-30**; **2027-07-01** is the first sample date affected by the unresolved end-June 2027 leap-second decision (a leap second would shift those samples by 1 s, up to ~0.1 km for the Moon [GK rate]).
- Before any refresh: check Bulletin C 73 (due ~Jan 2027); if the offset changes, regenerate the affected epochs.

### 3.4 Epoch check across the whole export (GPT's request)
Route 1 (#7) requested my own 579 UTC→TDB epochs (IERS 37 s + 32.184 s + the short TDB−TT periodic term [GK]). Horizons echoed all 579 requested epochs exactly, and its range matched route 2's at the same dates to **max 0.166 m, mean 0.048 m**, range rate to 5.5 × 10⁻¹⁰ km/s. This verifies agreement between the two routes **under the shared leap-second assumption**. A range residual alone does not establish a timing bound near a turning point, so no timing figure is claimed (rev 1's "within ~2 ms" is withdrawn). No TLIST split was needed (one request carried all 579).

### 3.5 Values (for the build; not public yet)
- Moon: 356,779 km (2026-12-24) … 406,570 km (2027-01-07). RR = 0 on no day.
- Sun: 147,104,596 km (2027-01-03) … 152,100,460 km (2027-07-05) — the sampled extrema within the coverage.
- **Real check-2 fixtures:** 9 Moon days have RR < 0 while today's distance exceeds yesterday's (after apogee), e.g. 2026-07-26, 2026-10-17, 2026-11-14.

## 4. Solar mass-loss chain (rev 2 §6.2)
1. **Input quantity:** a fitted change in the Sun's gravitational parameter, GṀ/GM = −(6.13 ± 1.47) × 10⁻¹⁴ /yr (M1b abstract), which the authors find "consistent with the expected solar mass loss". By their eq. (3) it is Ġ/G + Ṁ/M; they bound \|Ġ\|/G < 4 × 10⁻¹⁴ /yr. So it is a measured GM change, attributed to mass loss by consistency, not a direct mass measurement.
2. **Relation (ours, not stated in M1b or M1):** for slow change, a·GM is conserved, so ȧ/a = −(GṀ/GM) [GK, standard]. Using GM directly means no assumption that G is constant.
3. **Numbers:** 1 AU × 6.13 × 10⁻¹⁴ = **0.92 cm/yr** (0.70–1.14 across ±1.47) → **0.92 m per century**. The paper's expected mass loss −(0.9–1.1) × 10⁻¹³ gives 1.35–1.65 cm/yr: that is M1's "1.5 centimeters, per year per AU", the earlier theoretical figure.
4. **Public wording supported:** "roughly a centimetre a year" and "roughly a metre over a century", as order-of-magnitude statements at today's rate. The 0.92 cm/yr is **Mother Earth's estimate** from the fitted rate, using a·GM ≈ constant in the slow-change, two-body approximation. Card wording (GPT): **"Estimated from changes in Mercury's orbit consistent with solar mass loss."** Not "measured", which could make Earth's widening sound directly measured.

## 5. REGISTER wording — FILED 10 Nov 2026 (Chad's Approve line), text as below

> **NASA/JPL Horizons (Solar System Dynamics) — Moon and Sun geocentric range and range rate, daily — research only, not on the page**
> - **Read:** 10 Nov 2026 by Claude in the browser pane: SSD FAQ (publish-permission entry), SSD API Fair Use Policy, Horizons manual, Horizons API doc v1.3, File API doc v1.0, batch instructions. Research record: docs/research/SKY-SOURCE-CHECK.md (rev 1); packet on the Mac.
> - **SSD data statement (verbatim, SSD FAQ):** "No permissions are needed. The data provided on this site are considered public domain." Also: no NASA/Caltech/JPL endorsement implied; recommended citation "NASA/JPL Solar System Dynamics. Data retrieved on (Downloaded Year, Month, Date). (Title of the Page). https://ssd.jpl.nasa.gov"; modifications to be made clear.
> - **Scope (interpretation, labelled):** the FAQ speaks of "data provided on this site"; Horizons output via ssd.jpl.nasa.gov/api is taken to be covered. Not separately confirmed.
> - **Access conditions (operational, not a licence):** one request at a time; only necessary requests; cache and reuse; automated connections send an application User-Agent with contact; the APIs may not be embedded in a website; formats can change (check the API version field); best effort. The FAQ steers visualization apps to local alternatives over repeated network calls. Our use: one manual export per refresh, bundled as a static dataset; the page never calls Horizons.
> - **Request method (research pass, 10 Nov 2026):** operator-triggered browser requests from the Claude desktop browser pane, sent with the pane's default User-Agent (recorded). This describes what happened; it does not claim JPL confirmed an exception. Future refreshes settle the request method before any scripted API call; the policy calls for an application-specific User-Agent with contact details for automated connections.
> - **Attribution (our display):** "Calculated orbital distances · NASA/JPL Horizons", with the SSD citation (retrieval date, page title, URL) in Sources, and our modifications stated (daily 00:00 UTC samples selected; values rounded for display).
> - **Commercial use:** the public-domain statement contains no use restriction; that it covers commercial redistribution is a reading of "public domain", not an explicit grant. Not a finding of prohibition.

Other sources are used for facts with attribution only (no text reproduced on the page): D1 (APOD text; image excluded), L1, L2 (archived), M1, M2, and M1b (CC BY 4.0 — credit, licence link, DOI). They need a Sources-page credit, not a REGISTER data entry, unless GPT advises otherwise.

## 6. Consequences for the proposal (for rev 3, not yet applied)
1. §3.1: `CSV_FORMAT='NO'`; parse labelled `RG=` / `RR=`; pin API 1.2 (GET text) and 1.0 (File API) separately; reject other versions; validate header, epochs and row fields even when the pin matches.
2. §3.2: route 2 (`TIME_TYPE='UT'`) established by H1a/H1b **and** the per-row `UTC` / `UT~` labels; route 1 kept as the cross-check at each refresh (agreement under the shared leap-second assumption, no timing bound claimed). The 80-character line limit noted for any File API use.
3. §3.3: keep the raw `UTC`/`UT~` flag per row in the bundle; Details wording distinguishes the Horizons flag (from 4 Feb 2027) from the July uncertainty (from 1 Jul 2027); Bulletin C 73 check before refresh.
4. §3.1: request method — operator-triggered pane requests with the default User-Agent, recorded; settle the method before any scripted call.
5. §1.2: mechanism wording follows L1 (tides slow Earth's spin; days lengthen by about 2.3 ms per century), not "angular momentum"; card keeps "hundreds of millions of years"; the ~650 Myr estimate attributed in Sources.
6. §1.2 widening: "Estimated from changes in Mercury's orbit consistent with solar mass loss" (§4).
7. §8 check 2: use the real after-apogee days (§3.5) as fixtures.
8. S3 (direction method): RR is present and geometric in the export, so range-rate mode is available.

## 7. Limits
- Text only; Claude read every source. GPT checked the packet (Mac copy) in its rev 1 review, not the live pages.
- L2's live page no longer exists; the archived copy is from 4 Jan 2025.
- M1b read on the publisher page; supplementary material not read.
- The TDB−TT term in my route-1 epochs is a short approximation [GK]; its effect is bounded by the 0.166 m agreement.
- Horizons values are calculated (DE441), not observations; the card says so.
