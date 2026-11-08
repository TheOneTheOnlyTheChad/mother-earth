# R2 fireballs — terms and access review (rev 2, 8 Nov 2026, research only) — for GPT

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

## 3. Unanswered questions
1. Whether A1 is meant to cover the API's fireball data (S1) — interpretation only.
2. Whether any statement covers the lightcurve files (S2) beyond public release.
3. Authorship of the underlying sensor reports.
4. Polling: explicit operational conditions exist; no numerical limit found; not unlimited.

## 4. Proposed REGISTER entry — research-only DRAFT for review (NOT filed)
```
## NASA/JPL CNEOS — reported fireballs: catalogue (Fireball API v1.2) and lightcurve files — research only, not on the page
- **Read:** 5 Nov 2026 (GPT; Claude re-read the SSD FAQ) and 8 Nov 2026 by GPT on Chad's behalf: SSD FAQ #a05; Caltech/JPL Privacy Policies and Important Notices; CNEOS fireballs and lightcurve pages; SSD API documentation (fair-use policy). 8 Nov 2026 by Claude (fetch summaries): CNEOS introduction, JPL Image Use Policy, data.gov record. Research record: docs/research/R2-terms-access.md (rev 2); RESEARCH-BACKLOG §R2.
- **SSD data statement (verbatim, SSD FAQ #a05):** "No permissions are needed. The data provided on this site are considered public domain." The answer also disclaims NASA/Caltech/JPL endorsement, recommends citing SSD with retrieval date, page title and URL, and asks that modifications be identified.
- **General JPL notice:** documents may be protected and reproduction may require permission (Caltech/JPL Important Notices; Caltech manages JPL). Recorded alongside, not substituted for the SSD statement.
- **Scope (interpretation, labelled):** the FAQ does not name the sampled routes. S1 (catalogue via ssd-api fireball.api): plausibly covered, as SSD/CNEOS API data linked to the catalogue — interpretation. S2 (lightcurve files on cneos.jpl.nasa.gov): separately hosted; "provided for public release"; no separate reuse statement; coverage not established.
- **Provider statements on the data:** government-sensor data supplied to CNEOS for public release; not independently verified or reanalysed; may be revised; caution in use.
- **Access conditions (S1, operational, not a licence):** one request at a time; only reasonably necessary requests; cache and reuse where practical; application-specific User-Agent with product, version and contact; back off on errors; the APIs may not be embedded in a website (NASA CORS policy) — not a prohibition on publishing downloaded data; JPL may throttle or block. No numerical limit found (8 Nov 2026) — not unlimited.
- **Attribution:** provider-stated (SSD FAQ): cite SSD with retrieval date, page title and URL; identify modifications; no implied endorsement. Project choice: credit NASA/JPL CNEOS and the underlying U.S. Government sensor reports.
- **Coverage statement:** none filed (R2 identity and validation gates open).
- **Status:** ⛔ research only; not cleared for building.
- **Commercial use:** S1 — public-domain statement for SSD site data; application to the API's fireball data is an interpretation pending review (not an explicit grant for that route). S2 — UNRESOLVED (public release only; no applicable statement established). Neither is a finding of prohibition.
```

## Sources
Read by GPT on Chad's behalf, 8 Nov 2026: [SSD FAQ #a05](https://ssd.jpl.nasa.gov/faq.html#a05) · [Caltech/JPL Privacy Policies and Important Notices](https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices/) · [CNEOS fireballs](https://cneos.jpl.nasa.gov/fireballs/) · [CNEOS lightcurves](https://cneos.jpl.nasa.gov/fireballs/lc/) · [SSD API documentation](https://ssd-api.jpl.nasa.gov/doc/)
Read by Claude (fetch summaries), 8 Nov 2026: [SSD/CNEOS API About](https://ssd-api.jpl.nasa.gov/about) · [CNEOS introduction](https://cneos.jpl.nasa.gov/fireballs/intro.html) · [JPL Image Use Policy](https://jpl.nasa.gov/jpl-image-use-policy) · [data.gov record](https://catalog.data.gov/dataset/fireball-and-bolide-reports)
