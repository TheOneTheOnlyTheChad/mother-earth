# R2 fireballs — terms and access review (rev 3, 10 Nov 2026, research only; rev 2 of 8 Nov kept below)

**Rev 3 (10 Nov 2026, Chad's go, docs only): CNEOS replied** (Shantanu P. Naidu, JPL; Gmail-displayed 9 Nov, 10:43 PM): "You are free to use the data for this purpose with the citation." API cadence preference: under 1 request every 10 minutes; the fireball database changes around once a month. **Still open pending the follow-up:** explicit commercial-use confirmation, lightcurve reuse scope (S2), automated lightcurve retrieval guidance. §3, §4 and the provider-enquiry section updated; the REGISTER draft stays NOT filed pending GPT's review and Chad's separate approval. Record: `ENQUIRIES-2026-11.md` rev 8.
**Rev 3.1 (10 Nov 2026, GPT's editorial points, relayed by Chad):** GPT accepted rev 3 and ENQUIRIES rev 8 as provider evidence records. Heading and REGISTER draft cross-reference now say rev 3; S1's applicability stays labelled a contextual reading. Explicit commercial-use confirmation, lightcurve reuse scope and automated lightcurve retrieval guidance stay open. Draft **NOT filed**.

**ACCEPTED by GPT (rev 2) as bounded research-only evidence** (recorded 9 Nov 2026, relayed by Chad). **The draft REGISTER entry stays unfiled**; filing needs Chad's separate authorisation. Identity and validation gates stay open. Nothing built, fetched or contacted.

**Chad's go (8 Nov 2026):** bounded, read-only terms/access review of R2 only. **No data sampled or fetched, no provider contact, no route selection, no implementation, schedules, resources, deployment or page change.** R2's identity and validation gates (`R2-revision-matching.md`, rev 3) stay open; R4's filed entry, R3 (reply pending) and R6 (accepted unresolved draft, unfiled) are unchanged.

**Rev 2 (GPT's review of rev 1 at `f6b8093`, adopted):** X1–X4 verified by **GPT on Chad's behalf** (web extraction and browser, 8 Nov). The accepted 5 Nov FAQ reading is **restored as corroborated**; rev 1's contrary reading is kept only as an uncorroborated extraction discrepancy (§1.5). The pack now separates: (A) the explicit SSD public-domain statement, (B) its applicability to the two sampled routes, (C) operational access conditions, (D) project attribution choices.

**Products and routes already sampled (5 Nov):**
| # | Product | Route | Sampled by |
|---|---|---|---|
| S1 | Fireball catalogue, API v1.2 (`vel-comp=true`) | `ssd-api.jpl.nasa.gov/fireball.api` | GPT (5 Nov 11:33 UTC); re-checked by Claude |
| S2 | Lightcurve index `lc_files.json` + one report `2023.172.193912.txt` | `cneos.jpl.nasa.gov/fireballs/lc/` | Claude (5 Nov) |
| — | Internet Archive capture of the 2024 lightcurve index | `web.archive.org` | Evidence only (revision research), **not a route** |

**Evidence status labels:** *GPT (read, 8 Nov)* = GPT inspected the page on Chad's behalf · *Claude (fetch summary, 8 Nov)* = Claude's web-fetch tool, which returns a summary with quotations · *Accepted 5 Nov* = R2 first-gate wording. Nothing here is labelled as a page Chad personally read.

## 1. Evidence

### 1.1 (A) The explicit SSD public-domain statement
| # | Statement | Page | Status |
|---|---|---|---|
| A1 | Opening of the FAQ answer: **"No permissions are needed. The data provided on this site are considered public domain."** The answer then disclaims NASA/Caltech/JPL endorsement, recommends citing SSD with retrieval date, page title and URL, says modifications should be identified, and refers readers to fair-use guidance. It contains no permission-required answer and no link to a copyright statement within that answer. | [SSD FAQ #a05](https://ssd.jpl.nasa.gov/faq.html#a05) | **GPT (read, 8 Nov; web extraction + browser)** · Accepted 5 Nov (GPT; Claude re-read) — **corroborated** |
| A2 | General JPL notice, copyright section: documents may be protected and reproduction may require permission. The notice also states **Caltech's management of JPL**. | [Caltech/JPL Privacy Policies and Important Notices](https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices/) | GPT (read, 8 Nov) |
- **Both are recorded; neither substitutes for the other.** A2 is a general site-wide notice; A1 is the more specific statement about the data on the SSD site.
- A2 sources Caltech's management of JPL (replacing rev 1's "general knowledge" label). It **does not establish the authorship of every underlying sensor report.**

### 1.2 (B) Scope evidence for the two sampled routes
| # | Finding | Page | Status |
|---|---|---|---|
| B1 | Catalogue page and lightcurve page: data from **government sensors supplied to CNEOS for public release**; not independently verified or reanalysed; may be revised; caution in use. **No separate commercial-use statement** on either page. | [CNEOS fireballs](https://cneos.jpl.nasa.gov/fireballs/) · [CNEOS lightcurves](https://cneos.jpl.nasa.gov/fireballs/lc/) | GPT (read, 8 Nov) · Accepted 5 Nov (lightcurves) |
| B2 | The API documentation and the CNEOS pages **link the catalogue to the API** (relevant scope evidence). | SSD API docs; CNEOS pages | GPT (read, 8 Nov) |
| B3 | CNEOS introduction: "chronological data summary of fireball and bolide events provided by U.S. Government sensors"; footer links the JPL notice (A2) and the JPL Image Use Policy. | [CNEOS intro](https://cneos.jpl.nasa.gov/fireballs/intro.html) | Claude (fetch summary, 8 Nov) |
- **The FAQ (A1) does not explicitly name either sampled route** (`ssd-api…/fireball.api`, `cneos…/lc/`). Any conclusion about its reach is interpretation (§2).

### 1.3 (C) Operational access conditions (S1 route; not a licence)
[SSD API documentation, Fair Use Policy](https://ssd-api.jpl.nasa.gov/doc/) — **GPT (read, 8 Nov)** confirms Claude's summary as substantially correct:
- limit requests to those reasonably necessary; automated processes must not make unnecessarily frequent, repetitive or redundant requests;
- **one API request at a time** (no simultaneous requests);
- **cache and reuse results where practical**, rather than repeatedly requesting unchanged or predictably changing data;
- automated connections send an application-specific User-Agent with product name, version and contact information;
- handle errors, rate limits and unavailability by backing off, not repeated retries;
- **the APIs may not be embedded in a website** (per NASA CORS policy). *This concerns the APIs; it is not a prohibition on publishing data downloaded from them;*
- JPL may rate-limit, throttle or block unreasonable load; best-effort service; formats may change without notice; check the response `version`.
- **No numerical rate limit** on that page. S2 (lightcurve files): no automated-access guidance found; the API conditions are not extended to it.

### 1.4 (D) Attribution — provider statements vs project choices
- **Provider-stated (A1, SSD FAQ):** recommended citation of SSD with **retrieval date, page title and URL**; **identify modifications**; **no implied endorsement** by NASA, Caltech or JPL.
- **Project choice (not found as a provider requirement):** credit **NASA/JPL CNEOS and the underlying U.S. Government sensor reports**. Sensible attribution based on the product's provenance (B1, B3); GPT did not find that complete formulation stated by the provider.
- Not applied: the JPL Image Use Policy's "Courtesy NASA/JPL-Caltech" (images and video only).

### 1.5 Extraction discrepancy (recorded, uncorroborated)
- Rev 1 reported, from **two Claude fetch summaries on 8 Nov**, that the FAQ answered "The short answer is yes", referred to "JPL's copyright statement" and contained no "public domain" wording. **GPT's direct extraction and browser reading on the same day show the opposite (A1).** The fetch summaries are **uncorroborated** and are not relied on.
- This record does **not** claim that the website changed, nor that the 5 Nov review was wrong.

### 1.6 Context, not applied
- [JPL Image Use Policy](https://jpl.nasa.gov/jpl-image-use-policy): images and video only (Claude, fetch summary).
- [data.gov, Fireball And Bolide Reports](https://catalog.data.gov/dataset/fireball-and-bolide-reports): a different, legacy data.nasa.gov distribution; access level "public"; no licence field (Claude, fetch summary).

### 1.7 Numerical limits
- **No numerical rate, cadence or load limit found** in the pages inspected on 8 Nov 2026 (SSD API documentation and About; SSD FAQ; CNEOS fireball, lightcurve and introduction pages; JPL notice). JPL reserves the right to throttle or block. **Not evidence of unlimited access.**

## 2. Interpretation (open to challenge)
- **S1, catalogue via the API — interpretation:** the explicit statement covers "the data provided on this site" (`ssd.jpl.nasa.gov`). The API is the SSD/CNEOS API service, and the catalogue is linked to it (B2). On that reading, A1 plausibly covers the API's fireball data. **The FAQ does not name the API or its host**, so this remains an interpretation, not an explicit grant for S1.
- **S2, lightcurve files on `cneos.jpl.nasa.gov` — interpretation:** separately hosted; the pages state public release (B1) but give no separate reuse or commercial statement. Whether A1 reaches them is **not established**.
- **General notice vs specific statement:** A2 (documents may be protected; reproduction may require permission) is general; A1 is specific to the SSD site's data. *Interpretation:* where A1 applies, it is the operative statement for that data; A2 is not overridden for other content.
- **Underlying sensor reports:** described as government-sensor data supplied for public release; their authorship is not established by A2 or B1.
- **Public release, public access level and credit requests are not, by themselves, commercial-reuse permission.** The commercial position rests on A1's public-domain statement and its scope.

## 3. Unanswered questions (updated rev 3, after the CNEOS reply)
1. Whether A1 covers the API's fireball data (S1): the reply says "You are free to use the data for this purpose with the citation." "This purpose" is the enquiry's stated use (storing, reformatting, public redistribution via a website and shared API). The reply does not name a route; S1 was the API catalogue the cadence sentence addresses, so the reply most plausibly includes S1 — **contextual reading**. **Commercial use is not confirmed explicitly** (the enquiry asked "non-commercial or commercial"). **Open pending the follow-up.**
2. Lightcurve files (S2): **not addressed. Open pending the follow-up.**
3. Authorship of the underlying sensor reports: not addressed.
4. Polling: S1 — **stated preference of fewer than one API request every 10 minutes**, with the catalogue changing roughly monthly, beside the published fair-use conditions. S2 — **no guidance; open pending the follow-up.**

## 4. Proposed REGISTER entry — research-only DRAFT for review (NOT filed)
```
## NASA/JPL CNEOS — reported fireballs: catalogue (Fireball API v1.2) and lightcurve files — research only, not on the page
- **Read:** 5 Nov 2026 (GPT; Claude re-read the SSD FAQ) and 8 Nov 2026 by GPT on Chad's behalf: SSD FAQ #a05; Caltech/JPL Privacy Policies and Important Notices; CNEOS fireballs and lightcurve pages; SSD API documentation (fair-use policy). 8 Nov 2026 by Claude (fetch summaries): CNEOS introduction, JPL Image Use Policy, data.gov record. Research record: docs/research/R2-terms-access.md (rev 3); ENQUIRIES-2026-11.md rev 8; RESEARCH-BACKLOG §R2.
- **SSD data statement (verbatim, SSD FAQ #a05):** "No permissions are needed. The data provided on this site are considered public domain." The answer also disclaims NASA/Caltech/JPL endorsement, recommends citing SSD with retrieval date, page title and URL, and asks that modifications be identified.
- **General JPL notice:** documents may be protected and reproduction may require permission (Caltech/JPL Important Notices; Caltech manages JPL). Recorded alongside, not substituted for the SSD statement.
- **Scope (interpretation, labelled):** the FAQ does not name the sampled routes. S1 (catalogue via ssd-api fireball.api): plausibly covered, as SSD/CNEOS API data linked to the catalogue — interpretation. S2 (lightcurve files on cneos.jpl.nasa.gov): separately hosted; "provided for public release"; no separate reuse statement; coverage not established.
- **Provider statements on the data:** government-sensor data supplied to CNEOS for public release; not independently verified or reanalysed; may be revised; caution in use.
- **Access conditions (S1, operational, not a licence):** one request at a time; only reasonably necessary requests; cache and reuse where practical; application-specific User-Agent with product, version and contact; back off on errors; the APIs may not be embedded in a website (NASA CORS policy) — not a prohibition on publishing downloaded data; JPL may throttle or block. No numerical limit found (8 Nov 2026) — not unlimited.
- **Attribution:** provider-stated (SSD FAQ): cite SSD with retrieval date, page title and URL; identify modifications; no implied endorsement. Project choice: credit NASA/JPL CNEOS and the underlying U.S. Government sensor reports.
- **Provider reply (Shantanu P. Naidu, JPL; Gmail-displayed 9 Nov 2026, 10:43 PM; read by Claude from text and a screenshot Chad supplied 10 Nov 2026), to Chad's 8 Nov enquiry on storing, reformatting and publicly redistributing the numerical data through a website and shared API:** "You are free to use the data for this purpose with the citation." API cadence: "we would prefer that you keep the requests under 1 every 10 minutes"; the fireball database changes around once a month. Record: docs/research/ENQUIRIES-2026-11.md rev 8.
- **Coverage statement:** none filed (R2 identity and validation gates open).
- **Status:** ⛔ research only; not cleared for building.
- **Commercial use:** S1 — public-domain statement for SSD site data, and the provider's reply permits use "for this purpose with the citation"; that either applies to the API's fireball data is a contextual reading (neither names the route); explicit commercial-use confirmation OPEN pending follow-up. S2 — UNRESOLVED (lightcurve scope not addressed by the reply). Neither is a finding of prohibition.
- **Access (S1, provider preference):** fewer than one API request every 10 minutes; catalogue changes roughly monthly. S2 retrieval guidance: none (open).
```

## Sources
Read by GPT on Chad's behalf, 8 Nov 2026: [SSD FAQ #a05](https://ssd.jpl.nasa.gov/faq.html#a05) · [Caltech/JPL Privacy Policies and Important Notices](https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices/) · [CNEOS fireballs](https://cneos.jpl.nasa.gov/fireballs/) · [CNEOS lightcurves](https://cneos.jpl.nasa.gov/fireballs/lc/) · [SSD API documentation](https://ssd-api.jpl.nasa.gov/doc/)
Read by Claude (fetch summaries), 8 Nov 2026: [SSD/CNEOS API About](https://ssd-api.jpl.nasa.gov/about) · [CNEOS introduction](https://cneos.jpl.nasa.gov/fireballs/intro.html) · [JPL Image Use Policy](https://jpl.nasa.gov/jpl-image-use-policy) · [data.gov record](https://catalog.data.gov/dataset/fireball-and-bolide-reports)

## Provider enquiry (confirmed sent by Chad, 9 Nov 2026)
- Chad emailed CNEOS at `contact-cneos@jpl.nasa.gov` (quoted header: Sunday 8 Nov 2026, 7:39 PM, as displayed).
- **Reply (rev 3):** Shantanu P. Naidu, JPL, Gmail-displayed 9 Nov, 10:43 PM (no timezone assigned). Verbatim: "You are free to use the data for this purpose with the citation." / "For API query cadence, we would prefer that you keep the requests under 1 every 10 minutes. As guidance, the fireball database changes around once a month, so it doesn't make sense to query it too frequently."
- **Recorded:** permission "for this purpose with the citation", preserved alongside the exact sent enquiry (`ENQUIRIES-2026-11.md` rev 8); "the citation" most plausibly means the citation the enquiry described (SSD/CNEOS with retrieval date, page title and URL) — contextual reading. API cadence = a **stated preference**, fewer than one request every 10 minutes.
- **Open pending the follow-up:** explicit commercial-use confirmation; lightcurve reuse scope; automated lightcurve retrieval guidance. Any follow-up is Chad's decision.
