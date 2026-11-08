# R2 fireballs — terms and access review (rev 1, 8 Nov 2026, research only) — for GPT

**Chad's go (8 Nov 2026):** bounded, read-only terms/access review of R2 only. **No data sampled or fetched, no provider contact, no route selection, no implementation, schedules, resources, deployment or page change.** R2's identity and validation gates (`R2-revision-matching.md`, rev 3) stay open; R4's filed entry, R3 (reply pending) and R6 (accepted unresolved draft, unfiled) are unchanged.

**Starting point:** R2's accepted first gate (`RESEARCH-BACKLOG.md` §R2 A, C.5, D) and the revision-matching proposal rev 3. **Products and routes already sampled (5 Nov):**
| # | Product | Route | Sampled by |
|---|---|---|---|
| S1 | Fireball catalogue, API v1.2 (`vel-comp=true`) | `ssd-api.jpl.nasa.gov/fireball.api` | GPT (5 Nov 11:33 UTC); re-checked by Claude |
| S2 | Lightcurve index `lc_files.json` + one report `2023.172.193912.txt` | `cneos.jpl.nasa.gov/fireballs/lc/` | Claude (5 Nov) |
| — | Internet Archive capture of the 2024 lightcurve index | `web.archive.org` | Evidence only (revision research), **not a route** |

**Evidence status labels:** *Claude (fetch summary, 8 Nov)* = read with Claude's web-fetch tool, which returns a summary with quotations, provisional until extracted · *Accepted 5 Nov* = R2 first-gate wording · *Pending extraction* = Claude's tool refused or could not resolve the page; **GPT may extract it on Chad's behalf**. Nothing here is labelled as a page Chad personally read.

## 1. Evidence, separated by question

### A. Reuse / commercial terms
| # | Statement | Page | Applies to | Status |
|---|---|---|---|---|
| A1 | **⚠ Conflicts with the accepted 5 Nov reading.** To "I'd like to publish information from your site on my site. Do I need permission?": **"The short answer is yes."** At the very least JPL would like to know what information is used and how; it prefers a direct link, especially for numerical parameters that may be updated frequently; **"Most of the content on our site is covered under JPL's copyright statement"** (linked); use does not imply endorsement. **No "public domain" wording on the page** (asked twice; both fetches agree). | [SSD FAQ](https://ssd.jpl.nasa.gov/faq.html) | `ssd.jpl.nasa.gov` content as worded; **whether it governs the API's data (S1) is not stated** | Claude (fetch summary, 8 Nov, two fetches) — **pending extraction (X1)** |
| A2 | Accepted 5 Nov: "SSD FAQ: data on that site public domain, no permission needed" (as GPT read it; Claude re-read the FAQ 5 Nov). | RESEARCH-BACKLOG §R2 A | — | **Contradicted by A1; not relied on** until X1 resolves which reading is correct (or whether the page changed). |
| A3 | Lightcurve page (accepted 5 Nov): data come from U.S. Government sensors, are **provided for public release**, are not verified or reanalysed by CNEOS, and are revised when updates arrive. No CNEOS-specific reuse statement found then. | [CNEOS lightcurves](https://cneos.jpl.nasa.gov/fireballs/lc/) | S2 | Accepted 5 Nov · re-check pending (X3) |
| A4 | CNEOS introduction: "chronological data summary of fireball and bolide events provided by U.S. Government sensors". **No reuse, licence, copyright, credit or commercial-use statement.** Footer links: Privacy → `https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices`; Image Policy → `https://www.jpl.nasa.gov/jpl-image-use-policy`. Manager: Steve Chesley. | [CNEOS intro](https://cneos.jpl.nasa.gov/fireballs/intro.html) | CNEOS fireball pages | Claude (fetch summary, 8 Nov) |
| A5 | JPL Image Use Policy: **images and video** on JPL public sites "may be used for any purpose without prior permission", subject to special cases (identifiable people; third-party material with commercial-use restrictions); no endorsement by Caltech, JPL or NASA; logos need written approval; credit "Courtesy NASA/JPL-Caltech". **No statement about data or website text.** (`jpl.nasa.gov/copyrights.php` redirects here.) | [JPL Image Use Policy](https://jpl.nasa.gov/jpl-image-use-policy) | **Images and video only; not applied to S1/S2** | Claude (fetch summary, 8 Nov) |
| A6 | data.gov record "Fireball And Bolide Reports": publisher data.nasa.gov; `accessLevel` "public"; **no licence field**; first published 2015-04-07, updated 2025-05-29; distributions are legacy `data.nasa.gov/docs/legacy/…` files. | [catalog.data.gov](https://catalog.data.gov/dataset/fireball-and-bolide-reports) | A **different distribution** (legacy copy), not S1/S2. "Public" access level is not a licence | Claude (fetch summary, 8 Nov) |

### B. Attribution
- **A1:** no credit line; asks to know the use and prefers a link; no implied endorsement.
- **A5:** "Courtesy NASA/JPL-Caltech" — **for images and video**; not established for data.
- **Accepted 5 Nov guidance** (RESEARCH-BACKLOG §R2 A): attribute NASA/JPL CNEOS and the underlying U.S. Government sensor reports, record retrieval dates, identify transformations, imply no endorsement. **The page that states this was not named in the 5 Nov record — pending re-identification (X4).**

### C. Automated-access guidance (explicit, S1 route)
From the [SSD API Fair Use Policy](https://ssd-api.jpl.nasa.gov/doc/) (Claude, fetch summary, 8 Nov; consistent with the accepted 5 Nov reading):
- "You agree to limit requests to those reasonably necessary for your application or use case."
- "Automated processes must not make unnecessarily frequent, repetitive, or redundant requests."
- "You agree to submit only one API request at a time (no simultaneous requests)."
- Cache and reuse results "rather than repeatedly requesting unchanged or predictably changing data".
- Automated connections must send "a valid, application-specific User-Agent request header" with "correct product name, version, and contact information".
- "You may not embed these APIs in your website (per NASA CORS policy)."
- Handle errors, rate limits and unavailability "by backing off or reducing request rates rather than repeatedly retrying failed requests".
- "JPL may rate-limit, throttle, or block access that places an unreasonable load on the service"; best-effort service; formats can change without notice; check the response `version`; no guarantee any API stays available.
- **No licence, copyright, credit or commercial-use text** on that page.
- S2 (lightcurve files on `cneos.jpl.nasa.gov`): **no automated-access guidance found**; the API conditions are not extended to it.

### D. Numerical limits
- **No numerical rate, cadence or load limit found** in the pages inspected on 8 Nov 2026: SSD API documentation (fair-use policy), SSD API About, SSD FAQ, CNEOS introduction, JPL Image Use Policy, data.gov record. The policy states JPL **may** rate-limit, throttle or block unreasonable load — a stated enforcement right without a number. **Not evidence of unlimited access.**

## 2. Pending extraction (GPT may extract on Chad's behalf)
Required:
- **X1. SSD FAQ** <https://ssd.jpl.nasa.gov/faq.html>: the full permission Q&A verbatim, and whether "public domain" appears anywhere — to resolve the conflict between A1 (8 Nov) and A2 (accepted 5 Nov). If the page changed, record that.
- **X2. The JPL copyright statement the FAQ links** ("toward the bottom of that page"; probably the Caltech/JPL privacy policies and important notices page, `https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices`, which Claude's tool refused): holder, what may be used without permission, data vs text vs images, commercial use, endorsement, credit.
- **X3. CNEOS fireball and lightcurve pages** <https://cneos.jpl.nasa.gov/fireballs/>, <https://cneos.jpl.nasa.gov/fireballs/lc/>: the public-release sentence(s) verbatim and any reuse or credit text.
- **X4. Source of the 5 Nov attribution guidance** (§1 B): which page states it, verbatim.
Supplementary:
- **X5. data.nasa.gov landing page** for "Fireball And Bolide Reports": any licence or rights field (different distribution; context only).

## 3. Interpretation (open to challenge)
- **Public availability, distribution and credit are not commercial-reuse permission.** A3's "provided for public release", A6's "public" access level, and the API's public service each support public access/distribution only.
- **A1 is potentially restrictive** if confirmed: it says publishing from the SSD site needs permission and places most content under JPL's copyright statement. Until X1–X2, **the 5 Nov "public domain, no permission needed" reading (A2) is not relied on**, and no conclusion either way is drawn on S1's reuse.
- **U.S.-government-work inference is not available here as a default.** *General knowledge, not from the inspected pages:* JPL is a NASA federally funded research and development centre managed by Caltech, so JPL-produced content is not automatically a U.S. Government work; A1's reference to "JPL's copyright statement" points the same way. The **underlying sensor reports** are described as U.S. Government sensor data provided for public release (A3, A4); how that bears on JPL's catalogue and lightcurve products is unestablished.
- **Routes and products kept separate:** the API fair-use conditions (C) are explicit operational rules for S1; they are not a licence. A5 covers images and video only; A6 is a different, legacy distribution.

## 4. Unanswered questions
1. What the SSD FAQ actually says today and on 5 Nov (A1 vs A2), and what JPL's copyright statement says about data (X1, X2).
2. Whether any statement covers the **API data** (S1) and the **lightcurve files** (S2) specifically.
3. Commercial reuse of S1 and S2: **unresolved** — not a finding of permission or prohibition.
4. Polling: explicit conditions exist (one at a time, cache, User-Agent, back off, no embedding); no numerical limit found; not unlimited.

## 5. REGISTER draft — not prepared
Not warranted yet: the operative reuse statement (A1 vs A2) is in conflict and must be extracted verbatim first. A research-only draft follows once X1–X4 are in and GPT has reviewed this pack.

## Sources (read 8 Nov 2026 by Claude, fetch summaries)
[SSD API documentation / fair-use policy](https://ssd-api.jpl.nasa.gov/doc/) · [SSD/CNEOS API About](https://ssd-api.jpl.nasa.gov/about) · [SSD FAQ](https://ssd.jpl.nasa.gov/faq.html) · [CNEOS fireball introduction](https://cneos.jpl.nasa.gov/fireballs/intro.html) · [JPL Image Use Policy](https://jpl.nasa.gov/jpl-image-use-policy) · [data.gov: Fireball And Bolide Reports](https://catalog.data.gov/dataset/fireball-and-bolide-reports)
