# Mother Earth — status

Newest first. Threads 1–13 are in `docs/STATUS-ARCHIVE.md` (moved verbatim 5 Nov). Current state and next steps: `HANDOVER.md`.

# 9 Nov 2026

## 9 Nov 05:46 UTC (clock reading at write) — **thread handover** (Arts/timeline thread → next); R2 billing check rev 2; timeline rev 3.1 accepted
- **R2 billing check rev 2** (`reviews/2026-11-09-arts-r2-billing-check.md`, targeted read-only re-read 05:44 UTC): **account-wide** — one bucket (`mother-earth`; connector list and dashboard API agree); account-wide analytics show only it (Infrequent Access 0 B) plus 19 bucketless ListBuckets. 9.774 days: Standard peak 0.83 GB, Class A 24,355, Class B 31,802, **18 unclassified (left unknown; bounded at the Class A price)**. Projections: A ~7.5 %, B ~1 %, storage ~0.77 GB-month. Proportional estimates kept apart from **whole-unit invoice increments** (storage ≤ $0.015 per crossed GB-month; operations, if billed per million, ≤ $4.50 A / $0.36 B per crossing — only once an allowance is reached). Cache wording corrected (`arts.js` uses `no-store`: one Class B per request reaching the hub). Corrected conclusion: **expected $0.00, estimate, not verified against an invoice.** For GPT.
- GPT accepted **timeline rev 3.1** as a concept only (no route selected, no research).
- **Handover:** HANDOVER §1 rewritten (Arts candidate, billing check, timeline, enquiries, next approvals in order); START-HERE §4h added. Production unchanged; nothing approved for upload, deploy, merge or page release.

## 9 Nov 05:29 UTC (clock reading at write) — **Arts: read-only R2 billing check done** (`reviews/2026-11-09-arts-r2-billing-check.md`); **timeline rev 3.1** (docs only)
- GPT accepted the Arts cache/withdrawal correction; the implementation review stands.
- **R2 billing (read 05:20–05:30 UTC; analytics, not an invoice):** R2 is billed through its own **R2 Paid** subscription ($0 base, usage-billed), **separate from Workers Paid** ($5, no R2 component). Period 30 Oct 11:09 → 30 Nov. Published free tier (pricing page, updated 30 Oct): 10 GB-month, 1 M Class A, 10 M Class B. Usage so far (9.76 days): peak 0.83 GB, Class A 24,335, Class B 31,727. Estimates for the period: ~0.77 GB-month, ~75 k A, ~98 k B → **inside the free tier, expected R2 cost $0.00**. Arts adds +0.000128 GB-month, one Class A for the upload, and one Class B per switch-on that reaches the hub. Unknowns: the invoice, decimal vs binary GB, two unlisted actions (counted as B); the Worker-side line is not assessed here.
- **Timeline rev 3.1:** effort is unmeasured for both routes (W expected to need less initial extraction work, tracing could dominate); every written account is classified individually (T2-c contemporary · T2-r later recollection · T2-h later history · T2-s summary/structured), never by format; Route W gate lists every claim with one disposition, with support rates over checked claims only; untraced assertions are shown only as unverified source assertions. GPT supports Route W as the first option to consider — a recommendation, not a selection.
- **Nothing approved:** no upload, hub deploy, merge or page release. Production unchanged.

## 9 Nov 05:12 UTC (clock reading at write) — **GPT's implementation review of `arts-met-rc` recorded; Arts rollback wording corrected (branch `c5005c3`, docs only); timeline rev 3 (Route W added)**
- **GPT (independent, on `4c4bbb9`):** reproduced the complete 127,887-byte file byte for byte (sha256 `221bb1ca…9644`); confirmed the worker and page-file hashes; arts-hub 54/54, health-hub 29/29, history-hub 27/27, kp-degraded 29/29; all three weakened hub versions fail. **No blocking defect within that code and test scope**; `unreadable` accepted. The 90 browser checks remain Claude-supplied (not rerun by GPT).
- **Correction (review §5, branch):** response-cache lifetime (a new fetch may get the old file for ≤ 60 s) is separate from displayed-content lifetime (an already-rendered list stays until switched off or reloaded); a page revert reaches a viewer only on their next load. Page-first rollback stands. No code change; the branch hashes are unchanged.
- Still outstanding: R2 billing allowances, live hub/RC checks, served transfer size, performance measurements, actual-phone checks. **Nothing authorised: no upload, deploy, merge or page release.** Production unchanged.
- **Timeline rev 3** (`docs/concepts/TIMELINE-CONCEPT.md`): Route W (Wikipedia/Wikidata first) beside Route L (library first): source roles, pinned revisions and check dates, same-source ≠ independent, T2-c vs T2-s, four separate reuse questions, a bounded first gate (not run), a route comparison and how book mining could deepen or challenge the timeline. No source adopted or cleared.

## 9 Nov 04:54 UTC (clock reading at write) — **Arts candidate built on branch `arts-met-rc` @ `4c4bbb9`** (Chad's Approve line for a branch-only build; NOT merged, NOT deployed, no R2 write) — review `reviews/2026-11-09-arts-met-rc.md` (on the branch)
- **Approve line (Chad):** "Approve: Arts scoped feature per the Arts release proposal rev 2.1 — D1 authorise the fixed Met snapshot card only (one bounded exception; no domain selection, prototype or Phase A otherwise); D2–D8 as recommended; build arts-met-rc on a branch only — no merge, R2 write, hub deploy or page change." GPT had accepted rev 2.1.
- **Generated file** `phase1/arts/met-R1-e394878.json`, generated 2026-11-09T04:47:20Z: **file_sha256 `221bb1ca…9644`** (127,887 B); records_sha256 `067211d9…16cb2` (122,227 B, embedded byte-identically); reproducible with `--generated-at`. A first generation (`cb5f74b1…`) was superseded before upload after screenshots showed a borrowed country heading ("China / Iran"); headings now use the Met's text paired with the placing wording.
- **Hub 0.6.2 (branch):** `GET /snapshot/arts` serves the pinned file only if the whole file and the records hash match; 503 missing/unreadable/integrity/invalid otherwise; outside LAYERS, cron, D1, health and history. **Page (branch):** off-on-load "Met catalogue sample — places of making" card, label Catalogued, list by present-day country, sensitivity warning on every expanded object, Sources `#arts`, footer credit; new file `arts.js`; `?v=202611161000`.
- **Tests:** arts-hub 54/0 (3 breaks each fail), arts-ui 90/0 (6 breaks each fail), every other suite exits 0. Found and fixed during the build: `display:flex` overriding `hidden`.
- **Not verified:** Worker CPU in production, served size, R2 allowances, live RC, cold load before/after, iPhone Safari, screen-reader announcement. Next: GPT's implementation review; then R2 upload, hub deploy and page release, each on its own Approve line.

## 9 Nov 04:19 UTC (clock reading at write) — **Timeline concept rev 2 (GPT's review of rev 1; docs only)**; Arts rev 2.1 supplied to Chad for GPT
- Timeline: evaluation measures false matches/extraction errors only; missed passages unmeasured unless an independent reference set is chosen (not run); lineage = independent-with-evidence / known dependent / unknown, unknown never counted; gaps = measured corpus coverage / externally documented / unassessed; gate yields a research-only terms record + draft REGISTER wording, **no filing**; stage 1 bounded source selection with blocked/inconclusive allowed; T1 dates keep method and uncertainty. Separate from Arts and the research backlog.
- Arts: GPT had been given rev 2. The rev 2.1 text (commit `bfe3e99`) was sent to Chad as a file for GPT. No content change.

## 9 Nov 04:12 UTC (clock reading at write) — **Arts proposal rev 2.1 (docs-only amendment after GPT)** + **timeline concept written (concept only)**
- **Arts rev 2.1:** GPT supports rev 2 as the basis for a branch-only build, subject to two fixes, now applied: (1) `records_sha256` (= `snapshot_id`, `067211d9…16cb2`) kept separate from a **`file_sha256`** of the complete generated file, pinned at build; the hub validates the whole file before serving, and the R2 approval names that hash; (2) accessibility-tree checks described as verifying names, roles, expanded states and relationships, not screen-reader announcements (VoiceOver stays optional). GPT reproduced the records bytes/hash and the object-file hash; gzip 7,207 B (Claude, Python 3.13.18) vs 7,159 B (GPT, own tool), served size still a release measurement. Every expanded object must visibly carry the sensitivity warning. **Nothing built; no branch, R2 write, deploy or page change.**
- **Timeline concept** (`docs/concepts/TIMELINE-CONCEPT.md`): visitor experience, three-tier evidence model (physical/dated · what a source records · our computed matches), copy-chain and two-date rules, bounded gaps, access **leads** (Harvard public-domain corpus, LoC OCR packages, Europeana full text — not cleared), recommended first gate (water/flood accounts, one bounded period and region, small hand-checked passage set) — **not started**. Separate from Arts and the research backlog; does not select History or authorise Phase A.

## 9 Nov 03:46 UTC (clock reading at write) — **Arts release proposal rev 2 (GPT's review of rev 1 applied; docs only)**; enquiry record corrected; CO₂ review recorded
- **Arts rev 2** (`docs/research/P0-ARTS-RELEASE-PROPOSAL.md`): sampling stages exact (59,137 typed records in five departments → seeded 2,000 → 479 from four); source date (2 Nov, `e394878`) kept apart from processing dates (7 Nov commits); D1 = an explicit, bounded exception authorising this one public Arts card while the no-prototype/no-Phase-A decision stands for everything else; D2 separates disclosed limitations from the §7 engineering checks; cold-load and R2 cost claims corrected (R2 has its own allowances, not established; served size unmeasured); projection pinned (records 122,227 B, sha256 `067211d9…16cb2`, gzip 7,207 B); fixed-snapshot serving contract (integrity check, 503 unavailable state, outside freshness/collection/health/history); keyboard + `aria-expanded` checks; dependency-aware rollback with the pre-deploy hub version pinned at release; B/C described neutrally. GPT supports A, fixed snapshot, H1, "Catalogued", credit and Met links as **recommendations for Chad's decision, not decisions taken**. Nothing built.
- **Enquiries (rev 2 of the record):** CNEOS sent (`contact-cneos@jpl.nasa.gov`, pending); OpenSky, adsb.lol, Ozone Watch confirmed sent; USNO pending; **adsb.fi prepared, not sent**. OpenSky #837506 acknowledgement **supplied** — its hobbyist/public-site conditions recorded next to the REGISTER entry (summary as relayed; not blanket permission).
- **CO₂ (GPT, bounded code/record review, not a live-health pass):** supports keeping the Mauna Loa daily reading, preliminary/one-station labels and separately identified NOAA weekly comparisons; no expansion or provider enquiry recommended. A historical chart is a possible later proposal (omitted dates = unknown; preliminary revisions handled explicitly) — **not started**.

## 9 Nov 03:38 UTC (clock reading at write) — **Arts release proposal rev 1 (proposal only) + provider enquiries recorded** (docs only)
- **Enquiries (Chad):** OpenSky (ticket #837506), adsb.lol and NASA Ozone Watch sent; USNO (8 Nov) still pending. **Replies pending; sending grants no permission.** Record: `docs/research/ENQUIRIES-2026-11.md`. Chad's address and phone are kept out of this public repo. No duplicate or automatic follow-ups.
- **Aircraft reopened only for bounded terms/access and feeder clarification** (Chad). No building, purchase, installation or deployment; `aircraft-rc` stays parked.
- **Arts:** `docs/research/P0-ARTS-RELEASE-PROPOSAL.md` rev 1, for GPT. Recommends an off-on-load optional card with a list by present-day country (nothing drawn on the globe), a **fixed snapshot** pinned to Met commit `e394878`, served by the hub from R2 `ref/` (constitution). Every accepted limitation carried, including that the 479 are a **seeded sample** of the 59,137 typed-geography records. Published fields measured: 122,227 B JSON / 7,207 B gzip. Decisions D1–D8 open. **Arts unselected; no prototype, Phase A, branch or production change.**
- Unchanged: Life stopped; GIBS bench closed, no shadow record; inspiration list separate from the research backlog; all accepted reviews and approvals stand.

# 8 Nov 2026

*Timestamps (corrected 8 Nov, Chad): entry stamps marked "commit time" come from `git log` (the commit lands after the work); stamps without that label are measured readings. The earlier "~HH:MM" stamps on this day were estimates, 1–3 h out, and have been replaced.*

## 8 Nov 16:29 UTC (clock reading at write) — **Inspiration list filed** (docs only; Chad's go) — `docs/INSPIRATION-50-SITES.md`
- Chad's original 50-site list kept as inspiration, **outside the research backlog; queues no work**. Each item: suggested experience, evidenced connection, status (live / parked / researched-not-adopted / inspiration only). Six domains recorded as an organisational idea, not approved builds.
- Checked: **no feature is reviewed and authorised for implementation, and no completed candidate awaits production approval.**

## 8 Nov 16:10 UTC (commit time, `692455a`) — **GIBS stage 1 bench ACCEPTED by GPT and CLOSED** (`reviews/2026-11-08-gibs-stage1-bench.md` rev 2, recorded at `cca33e6`)
- Completed one-off research bench. GPT checked the revised write-up against the evidence it inspected earlier (no new requests, decoder runs or Worker measurements by GPT).
- PNG = promising tested route. Eligibility handling unresolved; **no tie margin or byte cap adopted**. Worker compatibility, CPU, memory, cost and production decoder readiness unverified.
- Bench item closed. Nothing further authorised (no measurement, shadow record, implementation, deployment or production change). All other approvals and parked/stopped decisions stand.

## 8 Nov 16:08 UTC (commit time, `cca33e6`) — **GIBS stage 1 bench rev 2 (GPT's review of `f7791b9` adopted; documentation only)**
- GPT inspected the saved evidence and independently recalculated: max per-image PNG/JPEG difference 0.20988 pp, median 0.08978 pp; raw ranking 12/14; a 0.25 pp tie-to-NOAA-21 rule gives the same choice in both formats on all 14 dates.
- Corrections: exact counts (36 PNG + 28 JPEG requests; **32 distinct PNG images**, all with recorded alpha 255; pixel cross-check on the **28** main-run PNGs only); **0.25 pp is a candidate, not a minimum or error bound** (largest signed-gap change ≈ 0.288 pp) — **no margin adopted**; opaque-black finding bounded (alpha cannot detect the unavailable-date case; not every case established; response size withdrawn; eligibility unresolved); decoder = feasibility only (no CRC / full chunk-structure checks); FIRMS CPU comparison removed — Worker compatibility, CPU, memory and cost unverified; "four days" → five.
- No shadow record, threshold, implementation, deployment or production change.

## 8 Nov 16:00 UTC (commit time, `f7791b9`; run measured 15:55–15:59) — **GIBS stage 1 bench (one-off, read-only; Chad's go)** — `reviews/2026-11-08-gibs-stage1-bench.md`, for GPT
- Browser pane (Chad's Mac), 15:55–15:59 UTC; 25 Oct – 7 Nov, NOAA-20 vs NOAA-21, 512×256 PNG vs the page's 2048×1024 JPEG (~60 GIBS requests, once). Evidence `reviews/evidence/2026-11-08-gibs-stage1-bench/`.
- **PNG served:** HTTP 200 `image/png`, 8-bit RGBA, 202–287 KB. **Alpha always 255**; a day with no imagery (9 Nov) = 1,204 B, 100 % opaque black → no-data is not signalled by alpha; dark-area score = near-black share; ineligibility needs another signal (§5 revision for review).
- **Ranking agreed 12/14**; flips on 28 and 29 Oct, both with satellite gaps ≤ 0.22 pp; per-image PNG–JPEG difference ≤ 0.21 pp (median 0.09). 0.25 pp = a candidate only *(rev 2: not adopted, not an error bound)*.
- **Decoder** (DecompressionStream + un-filter) exact vs the browser on the 28 cross-checked PNGs *(rev 2 corrected count)*; bounded-decoding negative controls rejected. Time per image: pane median 3.2 ms; local Node median 10.0 ms wall / 10.4 ms CPU. **Cloudflare Worker CPU not measured** (needs a deployment).
- 7 Nov images changed between the 03:56 and 15:55 reads (N20 8.8 % → 6.9 %), supporting re-measurement after the decision.
- No shadow record, threshold, fallback, branch, deploy, resource, schedule or page change. Bench code kept as a temporary research tool in the evidence folder.

## 8 Nov 15:50 UTC (commit time, `ab8e14c`) — **R2 terms review rev 2 (GPT's review of `f6b8093` adopted; docs only)** — `docs/research/R2-terms-access.md`
- **X1:** GPT's direct extraction + browser reading of SSD FAQ #a05: "No permissions are needed. The data provided on this site are considered public domain." (+ no endorsement, cite SSD with retrieval date/title/URL, identify modifications, fair-use guidance). **The accepted 5 Nov reading is restored as corroborated.** Rev 1's contrary reading came from Claude fetch summaries — kept only as an uncorroborated extraction discrepancy; no claim the site changed or the earlier review was wrong.
- **X2:** general Caltech/JPL notice (documents may be protected; reproduction may require permission; Caltech manages JPL) recorded alongside, not substituted for, the specific SSD data statement. **X3:** CNEOS catalogue + lightcurve pages — government-sensor data for public release, not verified/reanalysed, revisable; no separate commercial statement. **X4:** citation/modifications/no-endorsement are provider-stated (FAQ); crediting CNEOS + underlying sensors is a project choice.
- API conditions verified (caching "where practical"; no-embedding concerns the APIs, not publishing downloaded data; no numerical limit).
- Scope as interpretation: S1 (API catalogue) plausibly covered; S2 (lightcurve files) not established. Research-only REGISTER draft §4, **not filed**. Identity/validation gates open.

## 8 Nov 15:46 UTC (commit time, `f6b8093`) — *(superseded by rev 2 above: the FAQ conflict was an uncorroborated Claude fetch summary)* **R2 fireballs terms/access review rev 1 (read-only; Chad's go, R2 only)** — `docs/research/R2-terms-access.md`, for GPT
- Products/routes already sampled: Fireball API v1.2 (`ssd-api`), CNEOS lightcurve index + one report (`cneos`). No sampling, contact, route selection or implementation; identity and validation gates open.
- **⚠ Conflict found:** the SSD FAQ (8 Nov, two fetches) answers the publishing-permission question "The short answer is yes", places most content under JPL's copyright statement, prefers links, and has **no "public domain" wording**. This contradicts the accepted 5 Nov reading ("public domain, no permission needed"), which is now **not relied on** pending verbatim extraction (X1, X2). Marked in RESEARCH-BACKLOG §R2 A.
- API fair-use conditions explicit (one request at a time, reasonably necessary, cache, User-Agent with contact, back off, no website embedding; JPL may rate-limit/throttle/block); no licence text; **no numerical limit found (≠ unlimited)**.
- JPL Image Use Policy = images/video only (not applied); data.gov record = a different legacy distribution, access "public", no licence field. Public release / public access / credit ≠ commercial permission. U.S.-government-work default not available (JPL is Caltech-managed; general knowledge, labelled).
- Pending extraction X1–X4 (FAQ verbatim; JPL copyright statement; CNEOS fireball + lightcurve pages; source of the 5 Nov attribution guidance), X5 supplementary. **No REGISTER draft** until the conflict is resolved.

## 8 Nov 15:40 UTC (commit time, `643e309`) — **R6 terms review rev 5: GPT wording corrections (docs only)**
- §9.1: an evidence gap, not an absent route ("…does not establish that these two files are distributed through ESDIS or covered by its data-use guidance"). §9.4: applicability of the ESDIS guidance and NASA media guidelines not established; input terms not by themselves permission; privacy notice no applicable grant. Carried into the table and REGISTER draft; §6's older "likely free to reuse with credit" assumption replaced by a cross-reference to §9.
- GPT: the research-only REGISTER draft is technically acceptable as an unresolved evidence record. **Not filed; not authorised**; clears no commercial reuse, cadence, integration or building. Technical gates unchanged; R3 reply-pending.

## 8 Nov 14:08 UTC (commit time, `4b43c1b`) — **R6 terms review rev 4: extraction complete; corrected packet for GPT (docs only)** — `docs/research/R6-ozone.md` §9
- P1–P5 read by **GPT on Chad's behalf**. Disclaimers: no commercial-reuse grant or limit; methods may change, versions not all archived; interpolation for visualisation/area only, never minimum; research-only caution = GMAO GEOS forecasts only. Footer notice → redirect to nasa.gov/privacy (not licence evidence). Homepage credit request verified. Contacts: affiliations establish neither authorship nor copyright. GMAO: no applicable grant; products-page login is that page's limitation only.
- Corrections: §9.4 now separates the requested credit from permission for commercial redistribution; the rev-3 authorship inference from a contact's affiliation is withdrawn.
- **Commercial reuse UNRESOLVED — no applicable grant established in the inspected sources; not a finding of prohibition.** No numerical limit found in the named pages/dates (≠ unlimited). Research-only REGISTER draft §9.6, **not filed**. R3 email reply-pending; silence grants nothing.

## 8 Nov 13:59 UTC (commit time, `132b646`) — **R6 ozone terms/access review rev 3 (read-only; Chad's go, R6 only)** — `docs/research/R6-ozone.md` §9, for GPT; **USNO email recorded (R3)**
- **R3:** Chad sent the USNO enquiry to `eopcp@us.navy.mil` on 8 Nov (commercial reuse; storage/reformatting/redistribution; IERS mirror; attribution; one automated download per day). **Reply pending; no permission inferred from sending or silence**; R3 reuse stays UNRESOLVED (`R3` §9.4a). No follow-up or further R3 work.
- **R6:** evidence split into reuse, attribution, automated access, numerical limits. Ozone Watch's credit request confirmed ("Please credit all material to "NASA Ozone Watch" unless otherwise noted."); no licence found. NASA's CC0 (ESDIS-scoped), the OMPS input record and NASA media guidelines read but **not applied to the derived files** (scope). No numerical limit found (≠ unlimited). Commercial use not established; not a finding of prohibition.
- **Pending extraction (allowlist):** Ozone Watch disclaimers, the footer's NASA notices target, Ozone Watch homepage (required); contacts, GMAO input terms (supplementary). GPT may extract on Chad's behalf. No REGISTER draft yet.

## 8 Nov 13:36 UTC (commit time, `cb1e7e7`) — **R3 terms review rev 4: extraction complete; research-only REGISTER draft for review (docs only)** — `docs/research/R3-earth-rotation.md` §9
- E1–E5 independently inspected by **GPT on Chad's behalf** (GPT is the reader). Data-centre "Legal and Privacy" link 404; current IERS legal notice: BKG responsible for the website, no data licence/citation/limit (website only, not product rights); `maia` carries "Distribution Statement A… distribution unlimited" and has no separate site notice; IERS XML metadata: free of charge, `dataSetURI` → `maia`, no constraint elements (≠ unrestricted); products/FAQ: downloads, alternatives, checksums, no scripted-download rule or limit.
- **A6 (IAG terms) withdrawn:** a news article's own footer was misattributed to IERS.
- Position: public distribution supported; **commercial reuse not yet established (not a finding of prohibition)**; U.S.-government-work reasoning an inference requiring assessment; product rights kept separate from website conditions and route.
- §9.6 REGISTER draft, commercial use UNRESOLVED; **not filed**. No route, provider contact, other investigation, R6 or GIBS.

## 8 Nov 13:29 UTC (commit time, `4c53d3a`) — **R3 Earth rotation terms/access review rev 3 (read-only; Chad's go, R3 only)** — `docs/research/R3-earth-rotation.md` §9, for GPT
- Evidence separated into reuse/commercial, attribution, automated-access guidance and numerical limits; evidence, interpretation and unanswered questions kept apart. No data fetched, no provider contact, no route selection, no implementation.
- Read 8 Nov (Claude fetch summaries): NASA Earthdata data-use guidance (non-NASA data via CDDIS follow the sponsoring organisation's terms); USNO AA and navy.mil notices ("public information… unless otherwise specified"), **scoped to their own sites, not extended to `maia`**; an IAG/GGOS post on the IERS site relaunch (secondary).
- **No numerical rate/cadence/load limit found** in the pages inspected (≠ unlimited).
- **Pending extraction (Claude's tools refused by allowlist):** IERS data-centre EOP page, IERS legal/terms, USNO `maia` site notice (required); data-centre metadata and USNO FAQ (supplementary). GPT may extract on Chad's behalf. No REGISTER entry drafted until then.
- Mac sync rule added to START-HERE §3: preserve differing destination copies before overwriting; report differences; a post-copy hash match proves nothing about earlier local edits.

## 8 Nov 13:19 UTC (commit time, `d4f86c7`) — **R4 Argo: terms round CLOSED; REGISTER entry FILED** (docs only; Chad: "Approve: make these documentation corrections and file the corrected Argo REGISTER entry")
- **GPT's review of rev 7:** accepted the dataset-level CC BY evidence and GDAC linkage, supported synchronisation routes, the narrowly stated absence of a numerical limit, the attribution plan and the preserved non-terms gates. S4 (Ifremer policy) supplementary, not needed while not relied on.
- **Rev 8 corrections:** provenance throughout = "GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet" (Chad did not personally inspect the pages); §12.4's Ifremer exclusion now stated as Claude's unverified fetch summary, unestablished, not relied on; §§8, 10.1, 11.1, 11.5.1 marked historical, superseded by §12.
- **REGISTER.md:** Argo GDAC entry filed, with the labelled licence-scope inference, CC BY attribution (credit, licence link, DOI, modifications), supported routes (rsync, `aws s3 sync`) and "no numerical limit found" (not unlimited). Research only.
- Accepts the scoped terms conclusion only: no route, collector, build, resource, schedule, deploy or page change. R4 technical gates open; R2, R3, R6 untouched; other approvals and parked/stopped decisions stand.

## 8 Nov 13:13 UTC (commit time, `43e4881`) — **R4 terms review rev 7: evidence packet filed (docs only)** *(provenance corrected in rev 8: GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet)* — `docs/research/R4-argo.md` §12.5–12.6
- **R1 (required, SEANOE, checked 8 Nov):** Licence section links to CC BY 4.0; acknowledgment sentence verbatim; additional-access GDAC link to `https://data-argo.ifremer.fr/`.
- **S1 Sextant** (field values verbatim; use-limitation paragraph a summary) · **S2 Data Access** ("The synchronization service is available from Ifremer 'rsync' and from 'aws s3 sync'.") · **S3 US GODAE disclaimer** (public-domain sentence with "unless otherwise specified" preserved; not used to override dataset terms).
- **S4 Ifremer policy: PENDING, unverified.** Recorded URL 404; corrected filename `R2-D1-Instruction PDG 2023-0550 …pdf` (GPT); no readable text yet. The provisional French quotations are not filed as verified.
- Proposed REGISTER entry updated from the pastes; **not filed**. No route selection, build clearance or other research.

## 8 Nov 12:44 UTC (commit time, `0939710`) — **R4 terms review rev 6 (GPT's review of `5b33a52` adopted; docs only)** — `docs/research/R4-argo.md` §12
- GPT independently inspected the official sources: useful bounded progress; **no building clearance**.
- Corrections: (1) automated access is evidenced (Data Access page offers Ifremer rsync and AWS sync, incl. floats and indexes); the open point is **no numerical rate/cadence/load limit found in the pages inspected** (named, dated). (2) Licence scope: CC BY 4.0 on the DOI record, which links `data-argo.ifremer.fr` as additional access; missing per-file wording is not a separate blocker; live-collection scope uncertainty kept explicit. (3) Sextant: Access constraints "Other restrictions", Other constraints "No limitations on public access", Use constraints empty; use limitation kept separately. (4) Attribution per CC BY 4.0: credit, licence link, DOI/dataset link, modifications where applicable. (5) Evidence status per page: GPT read Data Access + US GODAE (disclaimer's scope/exceptions preserved, not used to override dataset terms); Ifremer policy PDF unverified by GPT, provisional, incl. its application to real-time files.
- Paste pack cut to 1 required (SEANOE) + 4 supplementary. REGISTER unfiled. Non-terms gates and parked/stopped decisions unchanged.

## 8 Nov 12:35 UTC (commit time, `5b33a52`) — **R4 Argo terms/access review rev 5 (read-only; Chad's go, R4 only)** — `docs/research/R4-argo.md` §12, for GPT
- Read 8 official pages (web-fetch summaries, so quotations are provisional until Chad pastes them). No data files, sampling, provider contact, implementation, resource or production change. R2, R3, R6 not touched.
- **New:** the general DOI record (SEANOE 10.17882/42182) states **CC BY 4.0**; Ifremer's catalogue record for the GDAC (listing `data-argo.ifremer.fr`) says "No limitations on public access"; Ifremer policy DG/2023.0550 allows reuse for any purpose with source + last-update date credited.
- **Still open:** no published automated-access/rate policy for Coriolis or US GODAE; the live HTTPS files carry no licence of their own; US GODAE and argodatamgt.org Data Access unread (tool allowlist) → paste session §12.4 (7 items, Chad at the screen).
- Proposed REGISTER entry in §12.5, **not filed**. Terms clarification does not clear R4 for building; non-terms gates unchanged.
- **GIBS summary corrected** (backlog view row): proposal rev 3, stage 1 = same-date selection with no threshold *T*; day-before fallback a later, separate decision; bench and shadow record not authorised.

## 8 Nov 12:22 UTC (commit time, `114f9f5`) — **thread handover** (Kp / smoke-test thread → backlog thread). HANDOVER rewritten (§0 live state, §0a smoke testing, §1 next).

## 8 Nov 12:10–12:19 UTC — **GPT independent live smoke test of `ad4002b` + hub 0.6.1: no blocking regression in the checks completed** (not exhaustive)
- Confirmed:
  - hub 0.6.1; all four served page files = reviewed `86134b8`; all eight health endpoints HTTP 200, healthy=true;
  - Kp card and Sources agree (3.33, interval 09:00–12:00 UTC, current); wording fits at 360/390/430/1280 px without page overflow;
  - no obsolete "source flagged/degraded" wording or NaN in inspected rendered text;
  - coordinate search, ship/fire inspectors, 0.51 MW precision;
  - real globe click → Everything here; panel-only buoy loading leaves the globe layer off;
  - buoys, microplastic, computed day/night load;
  - all three orbital categories render and switch off; counts reconcile to the current 32,645-object file, with 6 propagation failures and 547 unknown-type disclosed;
  - fresh post-noon imagery label and request both 7 Nov NOAA-21;
  - no warning/error entries in inspected logs.
- **Limits:**
  - no naturally degraded path and no injected browser-state test: those paths rest on the reviewed local tests;
  - no real-phone/Safari test;
  - Claude's before/after-noon transition remains Claude-supplied; GPT independently confirmed the post-noon state.
- No production changes. Existing approvals and accepted gates stand.

## 8 Nov 11:53–12:06 UTC — **Noon UTC imagery rollover: PASS** (read-only; smoke-test open item; browser pane, Mac unattended)
- Live page = main `ad4002b` (assets `?v=202611151000`). The booked prompt said `3375e91`; the imagery logic is unchanged between the two.
- **Correction:** `IMG_DAY` = now − 36 h rolls **6 → 7 Nov** at 12:00 UTC on 8 Nov, not 7 → 8 as Claude's booking note said.
- **Before noon** (fresh load, 11:53:21): `IMG_DAY` 2026-11-06, label "Imagery 06 Nov / NOAA-21 · not live". The one GIBS request: `TIME=2026-11-06`, `VIIRS_NOAA21_CorrectedReflectance_TrueColor`. They match.
- **After noon** (fresh load, 12:05:30): `IMG_DAY` 2026-11-07, label "Imagery 07 Nov / NOAA-21 · not live", request `TIME=2026-11-07`, 2048×1024. Label and request rolled together.
- **The image itself** (same URL, no-store, 12:05:40): HTTP 200, `image/jpeg`, 546,723 B, 2048×1024. Near-black (R, G, B < 12): 30°S–30°N **0.2%** (= the 8 Nov review's 7 Nov NOAA-21 figure), 66.5°S–66.5°N 2.8%, global 15.2% (incl. polar night).
- **Open page (confirms GPT's point):** a tab loaded at 11:53 still showed 06 Nov at 12:05:02, with label and request still agreeing. An already-open page does not roll over until reloaded. That is current behaviour, already noted in the GIBS proposal rev 3 §4; no fix authorised or made.
- Smoke-test items still open: actual-phone test, browser HTTP status codes.

## 8 Nov 08:16 UTC (commit time, `96c52a1`) — **`place-ui-harness` merged into main** (`96c52a1`, no-ff of `601b899`; Chad's go; GPT technical sign-off)
- Test-only: `phase1/place-ui.test.cjs` + its review. No page, hub or production change.
- **place-ui 30/30 on main** (was 28/30 since the FIRMS merge); kp-degraded 29/29 on the merge.
- Branches: Chad deleted `kp-degraded`, `gibs-noaa21` and `place-ui-harness`; GitHub now shows only `main` and the parked `aircraft-rc` (recorded in `c2eb13d`, 08:17 UTC commit time).

## 8 Nov 08:11:22 UTC — **PAGE RELEASED: Kp interval + honest degraded wording** (main `ad4002b`, no-ff merge of `kp-degraded` @ `86134b8`; Chad: "Approve: push kp-degraded to main (page change: Kp interval + honest degraded wording)")
- No overlap with main's docs-only changes. Merged page files = the reviewed commit (index `b9d4649e1ac6`, app `e3f4a3854113`, sources `7d66228f07b8`, style unchanged `e4c9547d99bf`); kp-degraded 29/29 on the merge.
- **main's `phase1/worker.js` = live 0.6.1** (`f38296a0…`), so **main = live** again.
- **Served hashes verified** 08:13:11 UTC (pane, no-store): all four = the reviewed values; assets `?v=202611151000`.
- **Live read** 08:13:42 UTC:
  - Kp card "interval 03:00–06:00 UTC, began 5.2 h ago; 3-hourly product, timestamped at the interval start", **current**;
  - summary "Kp 3.33, interval 03:00–06:00 UTC, began 5.2 h ago (NOAA SWPC)";
  - no "source flagged/degraded" and no NaN on the page; no console errors; imagery chip unchanged (06 Nov, NOAA-21).
  - Pane hidden (Chad away): text and logic checked, not pixels. The degraded wording is proven by tests, not yet seen live (no layer degraded).
- **Rollback:** page = revert `ad4002b` on main (Approve line); hub = redeploy 0.6.0 `ac173d8a…` (Approve line). The two are independent.
- Branch `kp-degraded` can be deleted on GitHub (Chad). `place-ui-harness` is still awaiting Chad's merge decision.

## 8 Nov 08:09–08:12 UTC — **hub 0.6.1 first runs verified + live RC check of the page branch: PASS** (read-only)
- **First 0.6.1 Kp run (08:07:59 UTC): `ok`** for the value 03:00 UTC at **5.13 h** past its interval start. The old rule called this degraded (07:07 run, 4.13 h).
  - Envelope: `status_reason: null`, `interval_end 06:00Z`, `age_reference "interval start (time_tag)"`.
- **D1, every run since the deploy is `ok`:** swpc 1, usgs 2 (`status_reason: null`), firms v2 1 (08:00, 1.1 MB raw), co2 1, drifters 1.
  - forest, seaice and Mac ships not yet run on 0.6.1 (next scheduled ticks).
- Health **8/8** at 08:09.
- **Live RC check** (clean pane tab; `kp-degraded` @ `86134b8` files from raw.githubusercontent, sha256 matched: index `b9d4649e1ac6`, app `e3f4a3854113`, style `e4c9547d99bf`; blob-injected; the live page untouched) against live 0.6.1 data:
  - Kp card: "interval 03:00–06:00 UTC, began 5.2 h ago; 3-hourly product, timestamped at the interval start", **current**;
  - summary: "Kp 3.33, interval 03:00–06:00 UTC, began 5.2 h ago (NOAA SWPC)";
  - no "source flagged/degraded" and no "NaN" anywhere on the page; all layers current (forest partial by design); no console errors.
  - Pane hidden (Chad away), so this checks text and logic, not rendered pixels.
  - The degraded wording paths are covered by the tests, not seen live: no layer is degraded right now, which is the expected outcome.
- **Next:** Chad's `Approve: push kp-degraded to main (page change: Kp interval + honest degraded wording)`, then served-hash check + live read.

## 8 Nov 07:58:25 UTC — **HUB 0.6.1 DEPLOYED** (Chad: "Approve: deploy hub 0.6.1 from 86134b8 (content only)")
- **What:** `phase1/worker.js` from `kp-degraded` @ `86134b8`.
  - sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`, checked in the pane from raw.githubusercontent before upload.
  - Content-only API from the dashboard pane, HTTP 200, etag `b231d47a…`. Claude's upload passed on the Approve line.
- **Verified (read-only, pane):**
  - read-back worker.js part sha256 = `f38296a0…` (exact);
  - `/` = **0.6.1**, history collecting;
  - health **8/8** (07:59:01; baseline 07:57:58 on 0.6.0 also 8/8);
  - **19 bindings unchanged**; variables as before (`FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified`, `HISTORY_ENABLED=1`, …).
- **Baseline before the deploy:** swpc `degraded` at 07:07 (value 03:00 UTC, 4.1 h past its interval start: the false signal being fixed).
- **Pending:** first 0.6.1 swpc run (08:07 UTC) and the other layers' first runs; then the live RC check of the page against 0.6.1.
- **Rollback** = redeploy 0.6.0 (`ac173d8a…`, = main's worker.js), with an Approve line. **main is now behind the live hub** until `kp-degraded` is merged (the page release).

## 8 Nov 07:56 UTC (commit time, `9882b71`) — **GPT technical sign-off: `kp-degraded` @ `86134b8`**
- Independently verified by GPT:
  - kp-degraded 29/29 and health-hub 29/29;
  - the SHIPS_ROUNDED break fails the intended generated-fields test;
  - app syntax and worker module loading;
  - worker sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`.
- No blocking issue found. Broader regressions remain Claude-supplied; **no live validation yet**.
- Policy and order stand: provisional 7.5 h; 5 min skew tolerance; **separately approved hub deploy → live RC check → separately approved page release**.
- This is technical sign-off, not Chad's merge or production approval.

## 8 Nov 07:33 UTC (commit time, `86134b8`) — **Kp/degraded fix rev 3 on `kp-degraded` @ `86134b8`** (focused, after GPT's review of `0513aa7`; NOT merged, NOT deployed)
- **GPT verified `0513aa7`:** kp-degraded 28/28, health-hub 29/29, app syntax, full worker hash. The Kp rendering, USGS unknown age and evidence corrections address its findings.
- **The one remaining issue, fixed:** the cloud collector rounded its reason fields before publishing (75.04 s → 75; 0.8999 → 0.9), which contradicted the stated condition.
  - New `shipsReason` publishes them unrounded.
  - The Mac collector is unchanged. When its tenths-rounded duration equals the limit, the page says "exceeded our 75 s limit … reported duration rounded to 0.1 s", with no invented digits.
  - Tests now run the hub-generated, JSON round-tripped fields through the renderer.
- **Tests:** kp-degraded 29/29. Breaks: rev 2 rounding → fail; rev 2 app.js → 2 fail. All regressions pass except the known place-ui 28/30. worker.js sha256 `f38296a0…`.
- GPT: the provisional threshold, skew tolerance and release order remain acceptable. **Next:** GPT re-review of `86134b8` → `Approve: deploy hub 0.6.1 from 86134b8 (content only)`.

## 8 Nov 07:04 UTC (commit time, `0513aa7`) — **Kp/degraded fix rev 2 on `kp-degraded` @ `0513aa7`** (after GPT's independent review of `67140b0`; NOT merged, NOT deployed)
- **GPT verified on `67140b0`:** kp-degraded 21/21, health-hub 29, history-hub 27, firms-guard 19, firms-v2 57+7 skipped, ships-late 7, the old-rule break, syntax/module load and the worker hash. GPT stopped ships-fallback early; no result claimed. Other browser regressions remain Claude-supplied.
- **Fixed per GPT:**
  1. Invalid or future Kp timestamps leaked into the card and summary. `ME.kpWhen` now guards interval + age together: "interval time unknown — …" or "timestamp later than our clock". Tested on the real readings/report output.
  2. A missing USGS generation time was described as expired. It now has its own reason, `feed_age_unknown` (still degraded), with unknown-age wording, plus a collector-to-page test.
  3. Ships rounding hid the condition (76 s → "1 min", 89.9% → "90%"). Now seconds with limit-aware precision, the percentage rounded down, and "below our 90% standard"; cloud and Mac both tested at the boundaries.
  - Also: exact 300 s / 301 s skew boundary tests. The withdrawn "source on schedule" claim is removed from the worker comment; the synthetic-ages test is renamed (not a replay of the 102 runs).
- **Tests:** kp-degraded 28/28.
  - Breaks: `67140b0` → 10 fail; main's app.js → 13 fail; old rule → 8 fail.
  - All regressions pass except the known place-ui 28/30.
- **Policy (GPT):** 7.5 h = a provisional Mother Earth policy, not a NOAA deadline; 5 min = an explicit skew tolerance. Release order: hub → live RC check → separately approved page.
- **Next:** GPT re-review of `0513aa7` → `Approve: deploy hub 0.6.1 from 0513aa7 (content only)`.

## 8 Nov 06:34 UTC (commit time, `67140b0`) — **Kp/degraded fix built on branch `kp-degraded` @ `67140b0`** (Chad's go; NOT merged, NOT deployed) — review `reviews/2026-11-08-kp-degraded-fix.md` (on the branch)
- **Hub 0.6.1:**
  - `kpStatus`: degraded at ≥ 7.5 h past the interval start (provisional); invalid or future `time_tag` → degraded with its own reason.
  - Envelopes carry `status_reason` (swpc, usgs, co2, seaice, cloud ships); Kp's `index` gains `interval_start`/`interval_end`.
  - No other rule or threshold changed; Mac collector unchanged.
- **Page:** "the source flagged…" and "source degraded" removed. The fires summary had the same phrase, found by the new test. `ME.degradedWhy` names our rule per layer; ships say which sampling condition applied, never "late"; an unknown reason gets neutral wording. Kp shown as an interval. Assets `?v=202611151000`.
- **Tests:**
  - new `kp-degraded` 21/21, including the boundaries, invalid and future time_tags;
  - breaks: old 4 h rule → 7 fail; main's app.js → 8 fail;
  - all hub + UI regressions pass, except the known place-ui 28/30 (harness fix on its own branch);
  - health-hub H8 version pin loosened (the test's intent kept).
- **Next:** GPT review → Approve: hub 0.6.1 deploy → live RC check → Approve: page release. 7.5 h stays provisional.

## 8 Nov 06:13 UTC (commit time, `9d2adab`) — **GPT's second review of `add3206` applied (docs only)**
- GPT accepted the main Phase 0, Kp and backlog corrections; harness sign-off confirmed tied to `601b899`; Arts department counts confirmed against the saved results.
- Five remaining edits applied:
  1. Phase 0 §3 is now "Outstanding measurements — pending Chad's availability". The Backlog §C dependency on the iPhone runs is removed. Claude's pane cell-selection check (588 px) is kept distinct from the pending actual-phone check.
  2. Kp inventory: Mac ships are degraded on **either** a flowing fraction < 90% **or** an overlong sample (both in `collector-mac.mjs`).
  3. GIBS: `IMG_DAY` is computed once at page load, so open pages don't roll over. The proposal now specifies recompute + re-read `/backdrop` on the 5-min refresh tick (or reload-only, Chad/GPT to choose). Rollback and "immediate default" timings are qualified for open pages.
  4. GIBS wording matches the rule, including the tie case ("NOAA-21 kept by our rule…", even if slightly higher). The **dark-area score** (near-black + no-data) is named separately from the raw near-black share. The band is 66.5°S–66.5°N throughout; the 8 Nov 30°S–30°N evidence is labelled as motivation only.
  5. HANDOVER item 4: the old "most complete… else previous day" idea is marked SUPERSEDED.
- GPT: the Kp branch work is a sensible next step **for Chad to authorise**, with implementation and wording returned for review before merge or production approval. This review starts no work. No iPhone session today; no prototype or Phase A.

## 8 Nov 06:06 UTC (commit time, `add3206`) — **GPT's review of the morning's work applied (docs only; nothing authorised beyond)**
- **place-ui harness `601b899`: GPT technical sign-off.** The fake `head()` supplies the UTF-8 size and metadata the legacy-reader checks need. Worker hash = live 0.6.0; no production or page change. Syntax checked independently by GPT; suite results and the break check remain Claude-supplied evidence. **Merge awaits Chad's decision.**
- **Smoke follow-up:** qualifications confirmed by GPT. It supplements GPT's independent test, and GPT has not repeated those browser checks.
- **Phase 0 recommendation → rev 2** (GPT's six revisions):
  - "only cleared expansion candidate among those assessed in this round";
  - per-object "sensitivity not fully assessed", source restrictions, present-day countries ≠ historical nationality;
  - 5 typed departments vs 4 in the final view (American Wing 326, Islamic 72, Medieval 43, Cloisters 38);
  - Planet = 7 Nov pre-NOAA-21 transfer/load baseline, not input responsiveness or tolerances;
  - waiting for the iPhone is a suggestion, not a prerequisite;
  - unsupported phone-cost claim removed; VoiceOver baseline separate.
  - No gate reopened; the 5.09 s cold load confirmed as correctly rounded.
- **Kp finding → rev 2** (GPT: diagnosis supported, threshold provisional). GPT's smoke report ("Kp degradation explicitly disclosed") is preserved unchanged; this finding is appended to it.
  - `kp_index.retrieved_at` = our first retrieval, not NOAA's publication time. The "every degraded run on schedule" claim is withdrawn.
  - The 7.1 h maximum was unsupported and is removed; the largest observed age is 6.13 h.
  - 7.5 h past interval start is a provisional candidate, not a source deadline. With hourly polling a missing value is first flagged ~2 h after it was due (~8.13 h). Boundary/invalid/future test cases listed.
  - Inventory of `degraded` on every active layer (usgs, swpc, co2, seaice = freshness rules; forest = sweep; ships = sampling quality): wording to be fixed across all of them, ships keeping its own reason.
  - Kp's timestamp described as the interval start.
- **GIBS proposal → rev 2:**
  - the measured criterion is "near-black share" (appearance, not completeness); illumination not equalised;
  - no-data / failure / bounded-decoding handling specified; rankings compared, not just percentages; tie margin set from the bench (0.5 pp withdrawn);
  - same-date selection only (day-before = Chad's later decision);
  - rollback bounded to the current image day, with an immediate-default option (a) or (b) for Chad;
  - pane/workspace shadow record separated from a deployed hub job; 7 days = provisional only; cost unverified; D1 history optional.
- **Backlog view → rev 2:**
  - R2 also has open identity/validation/acceptance rules, and a terms review clears nothing;
  - R11 is an unmeasured question;
  - order: Kp correctness first, then a choice between the terms review and the GIBS bench (neither started).
- Not authorised by this review: implementation, research restart, merge, deploy, shadow job, resource creation. FIRMS closed; Arts scoped-cleared, unselected; Life stopped; aircraft parked (research included); no prototype or Phase A.

## 8 Nov 06:00 UTC (commit time, `57debf2`) — **Backlog view written** — `docs/BACKLOG-VIEW-2026-11-08.md` (for Chad's choice; nothing started)
- One page over R1–R11 plus the open hub/page items. Observation: R2, R3, R4 and R6 all parked on terms/access, not data. Claude's suggested order: Kp fix → a read-only terms pass over R2/R3/R4/R6 → GIBS bench + shadow week → new first gates.

## 8 Nov 05:59 UTC (commit time, `5013943`) — **GIBS measured fallback rule: PROPOSAL written** (HANDOVER item 4; design only) — `docs/GIBS-FALLBACK-PROPOSAL.md`
- Hub job picks the more complete of NOAA-21 / NOAA-20 (near-black share, 66.5°S–66.5°N) for the latest day, else the day before. It publishes `latest/backdrop.json` + `GET /backdrop`; the page follows, or uses the fixed NOAA-21 default if it is unavailable.
- Threshold *T* is not chosen: it needs a bench (PNG decode in a Worker, small-vs-full agreement, CPU) and a ~7-day shadow record first, each on Chad's go.
- Staged rollout with Approve lines; rollback = remove `BACKDROP_ENABLED`. Expected cost $0 (to be measured). Open questions §9. For GPT.

## 8 Nov 05:58 UTC (commit time, `5f877e9`) — **Finding: Kp "degraded" is a false signal** (read-only; no change) — `reviews/2026-11-08-kp-degraded-finding.md`
- 69% of swpc runs since 4 Nov (70/102) were `degraded` while NOAA delivered on schedule. The 4 h rule ignores that `time_tag` is the interval start: on-time values appear at 3.13 h (31/33; 2 at 4.13 h) and age to ~6.1 h.
- The page says "the source flagged this observation as degraded" / "source degraded". The flag is our hub's rule, not NOAA's, so that wording is untrue. The same reason text applies to every layer the hub marks degraded.
- Values and dates shown are correct; no swpc monitor exists, so no false alerts. Fix options (threshold ~7.5 h; honest wording) in the finding; each needs review + Chad's approval.

## 8 Nov 05:47–05:50 UTC — **two of the smoke test's open checks done (read-only, Claude, browser pane)**; Mac copies synced
- **Conditions:** Claude desktop browser pane (Chromium), 588 × 834 = the phone layout, **not a real phone**; live page main `3375e91` assets, hub 0.6.0. Pane visible.
- **"Everything here" cell selection — PASS.** A real click on the globe opened a forest cell inspector (cell 17_35). Its "Everything we hold for this cell, all layers" link opened **Everything here · cell 17_35** with the expected rows:
  - the qualified "none / not a statement that none occurred" wording for quakes, fires and ships, and the forest source-reported zero;
  - drifters and plastic as "layer off · Load this layer's data for this place";
  - collection lines and "Not place-based".
  - "Load" for drifters filled the drifters row ("no buoy's latest fix is in this cell…"), left plastic off, and left the globe's drifters toggle off. No page overflow.
  - A direct click on bare ocean (no cell polygon) was not separately exercised.
- **Orbital — all three categories PASS.** Rocket bodies, Debris and Payloads each switched on.
  - Drawn counts match the card: payloads 19,702 of 19,706; rocket bodies 2,213 of 2,213; debris 10,185 of 10,187.
  - 19,706 + 2,213 + 10,187 + 548 not drawn (type unknown) = 32,654 = file total. Element file retrieved 05:42 UTC.
  - "What this is and is not" opens (1,294 chars). Debris off → hidden, draw range 0, the others stay on. Markers visible on the globe.
  - Orbital markers have no per-object inspector by design, so "every inspector" reduces to the card and its explainer.
- Console: no messages.
- **Standing of this evidence (Chad, after GPT, 8 Nov):** completed in Claude's browser pane at 588 px, 05:47–05:50 UTC. It **supplements** GPT's smoke test; **GPT has not independently repeated or reviewed it**. It does **not** establish real-phone behaviour or exhaustive orbital-inspector coverage.
- **Still open from the smoke test:** actual-phone test, noon UTC imagery rollover (booked 11:50 UTC), uncaptured browser HTTP status codes.
- **Mac copies synced** (`~/Documents/Mother Earth`, Chad granted the folder): 96 files copied (83 new, 13 older versions, each confirmed to be an earlier committed version, not a local edit). 167/167 tracked files identical to main `c151306`.

## 8 Nov 05:33–05:34 UTC (commit times, `601b899` / `c151306`) — harness fix on a branch; noon check booked; Phase 0 recommendation drafted (Chad's go; no production change)
- **place-ui harness** (branch `place-ui-harness` @ `601b899`, **not merged**): its fake R2 gains `head()` (hub 0.6.0 reads it before the place firms section). 28/30 → **30/30**; a break (head reports 1e9 bytes) fails the same two tests. Related suites all pass; `worker.js` untouched (= live). Review: `reviews/2026-11-08-place-ui-harness.md` — for GPT, then Chad's go to merge.
- **Noon UTC imagery rollover** (read-only): `IMG_DAY` = now − 36 h, so the date rolls 7 → 8 Nov at 12:00 UTC. Check booked in this session for 11:50 UTC (before/after reads of label + actual GIBS request). Needs the Mac awake with the Claude app open.
- **Phase 0 recommendation DRAFT**: `docs/research/P0-RECOMMENDATION-DRAFT.md`, from accepted findings only. Arts (the Met, cleared scope) recommended as the only candidate first domain, not selected; Life block kept; suggests taking the domain decision after the iPhone runs. **iPhone measurements outstanding** (skipped today, Chad). For GPT's review.
- Not authorised: domain selection, prototype, new research, backlog implementation. Aircraft parked.

## 8 Nov 05:14–05:20 UTC — **GPT live smoke test of main `3375e91`: no blocking regression found in the checks completed** (not an exhaustive pass)
- **Conditions:** Codex in-app browser (exact version not captured); imagery date shown 6 Nov 2026. Report + evidence on Chad's Mac: `~/Documents/ChatGPT/Mother Earth/outputs/2026-11-08-live-smoke/` (not copied into the repo).
- **Passed:**
  - NOAA-21 imagery rendered; GIBS request date = label; qualified wording present; fires still NOAA-20.
  - Phone 360/390/430 px: two-line chip unclipped, full explanation in Key, no page overflow. Desktop 1280×860: imagery label clear of the legend.
  - Main cards populated; buoys, microplastic, day/night and orbital payloads loaded; Kp degradation and partial forest coverage disclosed.
  - Coordinate search and record inspectors worked; a 0.51 MW fire kept its precision in search and inspector.
  - Sources tables populated at 360/1280 with imagery credits and retention wording, no overflow.
  - Browser reads: hub 0.6.0; all eight health bodies healthy (verdict ok, no reasons); `/place` returned the documented structure.
  - No warning/error entries in the inspected browser logs on either page.
- **Not covered / remaining:**
  - Actual-phone testing.
  - Imagery-date rollover at noon UTC.
  - "Everything here" cell-selection UI (browser-control timeouts; the direct `/place` endpoint worked).
  - Orbital: payloads only, not every category or inspector.
  - Browser HTTP status codes not separately captured.
- **Environment note:** GPT's direct command-line hub requests got 403 while browser access worked — an access limitation of that environment, not a demonstrated outage.
- **No fix or further testing authorised.** Any proposed fix comes back for review and Chad's specific approval before publishing or any production change. Aircraft parked (research included); expansion permissions unchanged (no prototype, no Phase A).

## 8 Nov 05:07:54 UTC — **PAGE RELEASED: GIBS backdrop → NOAA-21** (main `3375e91`, Chad's Approve line, after GPT's review). Served hashes verified 05:09:53 UTC; live check 05:10:24 UTC: NOAA-21 requested for 2026-11-06; labels/credit name NOAA-21, "dated, not live", dark-area cause not established; fires still NOAA-20. Assets `?v=202611141000`. Improves the current images (NOAA-21 was worse on 4–5 Nov); not a completeness fix. New guard `phase1/backdrop-layer.test.cjs` (27). place-ui 28/30 = 2 pre-existing harness failures (`env.R2.head` missing in its fake R2 since the FIRMS merge). Outstanding: real-phone check; any fallback rule is a separate proposal (hub work).

## 8 Nov 02:34 UTC (commit time, `0891d13`) — **FIRMS v2 rollout CLOSED; `firms-memory` merged into main** (FIRMS memory thread; Chad's Approve line)
- **Stage 6 (read-only, 00:45:42–00:47 UTC):** the 7 Nov mixed-day checkpoint used the **latest** publication, v2 run `2026-11-07T23-45Z-…46a4be89350f` (cutoff 23:45:42.788Z).
  - Marker records 56,536 = that output = its run log.
  - The checkpoint object read back with sha256 `e82f96cc…` = the committed snapshot.
  - `fires_daily` 600 cells, Σ 56,536. Coverage current, `assessed_with_checkpoint` 1. No gaps.
  - Midnight header-only runs (00:00–00:45) took the boundary path ("no detections processed yet"), records retained. Health 8/8.
  - Evidence: `reviews/2026-11-06-firms-v2-build.md` stage log (`b1758cd`).
- **GPT accepted stage 6; the rollout is closed** (stages 1–5 already accepted). Acceptance rests on the reported evidence, not an independent live inspection.
- **Merge:** `firms-memory` → main as **`0891d13`**. Before the merge: no overlapping files, no page-file changes, no worker change on main.
  - main's `phase1/worker.js` sha256 = **`ac173d8ac0dd9d1b9584c3eaf771adabe5e215d993d34487edad12d8932758ea`** = the live code, so **main = live**.
  - Tests on the merged tree: firms-v2 64/64 (rollback to 0.5.3 included), guard 19/19, health 29/29, health-breaks 19/19, history 27/27, place 7.
  - **No deploy, variable, schema, schedule, guard or page change.**
- **Unchanged by decision:**
  - The bounded empty-input retry (an empty header-only input is retried ≤ 3 times, then swept or expired; logs `firms:recovery` rows). Any refinement needs its own review.
  - The 8 MiB guard.
  - Aircraft parked, research included.
  - Expansion: no prototype or Phase A start authorised.
- Branch `firms-memory` can be deleted on GitHub (Chad; the session proxy refuses ref deletes). Hub work now branches from main.

# 7 Nov 2026

## 7 Nov 13:32–13:43 UTC — **Planet: cold load demonstrated + desktop-width runs** (Chad, Chrome 156 Guest window). Cold: 1,500,912 B / 22 requests (all measured), DCL 1.52 s, load 5.08 s, last 7.45 s. Desktop 1470×835 warm ×3: DCL 0.69–0.91 s, last 4.96–6.20 s, ~0.9 MB per load (backdrop + hub data re-fetched each time). Pending: iPhone, direct interactivity.

## 7 Nov ~13:25 UTC — **Phase 0: Arts CLEARED for the limited feasibility gate** (Chad, after GPT): a metadata-only view of the Met's catalogued places of making mapped to present-day countries; 479 objects / 25 countries; data rights cleared; catalogue uncertainty, 23 unverified pages and incomplete sensitivity assessment disclosed. Research-gate clearance only, not release readiness. Arts may be recommended as the first domain, **not selected**. Planet partial (pending Chad). Life: scoped block, stopped. Aircraft parked. No prototype; domain selection and Phase A need a separate decision.

## 7 Nov 12:44 UTC — **Phase 0 validation + measurement pass started** (Chad's go; 2 h cap). Checkpoint `f91ccc5`: Life sample + scripts + attribution and the created_at view script moved into the repo; `docs/research/p0-recovery/MANIFEST.sha256` verified against a fresh clone (14/14 OK). Resume file `docs/research/P0-CHECKPOINT.md`.

## 7 Nov ~13:00 UTC — **Phase 0 review update after GPT** (existing evidence only) — `docs/research/P0-arts-planet-recovery.md`, top section
- **Arts:** data rights accepted as cleared; still **INCONCLUSIVE**.
  - The "decisions, not research" line is withdrawn: sensitive material needs an agreed rule AND validation.
  - GPT's recommended first view is **created_at only**: **485 distinct objects, 25 present-day countries, USA 49.5%**, from R1 (`created-at-view-object-ids-R1.json`).
  - A validation defect was found and fixed in the count: "Formerly considered made in" had been treated as certain, which wrongly added 3 objects.
  - Historical places = present-day location reference with the Met's verbatim wording, never nationality.
  - AAOA is an excluded department, not an absence of those regions.
- **Planet:** partial baseline (warm/mixed, 588 px pane). No production header changes for measurement.
- **Backdrop:** unconfirmed coverage concern recorded (REGISTER GIBS entry; R11 gains the FIRMS thread's 6 Nov late-arrival table). No backdrop change authorised.
- **Proposed follow-ups 1–8 listed, NOT started** (Arts relationship / rule-list / sensitive checks; Planet desktop width, cold load, iPhone). Chad decides.

## 7 Nov 12:16–~12:35 UTC — **Phase 0 evidence-recovery pass (Arts + Planet), GPT's go** — `docs/research/P0-arts-planet-recovery.md`
- **Arts:** the lost samples' source is recovered exactly: Met repo commit `e394878`, LFS sha256 `7adc37e4…` = the recorded etag. The original outputs are gone, so one **new** sample R1 (2,000, seed 20261107) was drawn from an explicit typed-place subset (59,137).
  - Rules: attributed kept separate and uncertain; pipe alignment enforced; ISO 3166-1 validation with documented rules.
  - Country view (certain, aligned, ISO, sensitivity-flagged excluded): **1,454 records / 27 countries, Egypt 57%**. Created/found only: **641 / 27, USA 37%**.
  - Typed geography is confined to 5 departments; Africa, Oceania and the Americas are absent.
  - Sensitivity: 159 candidates (mostly Egyptian funerary; 1 human-hair object, 5 burial wrappings) excluded and unresolved.
  - Rights: CC0, commercial use. **REGISTER filed** (Chad pasted the policy page, 7 Nov); data rights cleared.
  - Evidence in `docs/research/p0-recovery/arts/`.
- **Planet:** three replacement runs, 12:21–12:22 UTC, hub 0.6.0, pane at 588 × 834 DPR 2 (phone layout). FCP 960 / 640 / 176 ms; hub last response 8.0 / 4.7 / 3.8 s; frames ≈ 35 ms; ~1.1 s blocking after FCP.
  - Cold load **not demonstrated**; 13 of 17–21 resources opaque (no Timing-Allow-Origin); iPhone pending.
  - `docs/research/p0-recovery/planet/runs-2026-11-07.json`.
- No page or hub change, no Mac shell; pane used 12:20–12:22 UTC only.

## 7 Nov ~11:40 UTC — **Life research STOPPED** (BLOCKED for the scoped marker PoC accepted by Chad after GPT); **Arts + Planet evidence compiled for GPT**
- Life: Chad accepts BLOCKED for the marker proof of concept from this sample and these exclusions. This is not a rejection of GBIF or Life. Rights are separately inconclusive; media excluded. Three qualifications added to `docs/research/P0-life-gbif.md`: missing American and Asian coverage is a method artefact; identifiers are not attribution; the region view is unproven. Sample, hash, method, exclusions and gaps preserved. No new sample, licensing work, provider contact, region-view work or Mac-shell use.
- `docs/research/P0-arts-planet-for-GPT.md`, built from existing evidence only (no new measurement):
  - **Arts (the Met): INCONCLUSIVE.** Whole collection blocked for that scope (107 / 2,000 typed). Typed subset: region view 88 countries but 52% Egypt; marker view 492 / 159 but needs an unchecked gazetteer. CC0 not yet in REGISTER. Media per-item by public-domain flag, image availability unchecked. Sensitive material not assessed.
  - **Planet:** desktop warm-cache baseline only.
  - **MISSING items flagged:** CSV hash, per-run timings, UA and viewport, p95, sensitivity, attribution credit line. An unreconciled 107 vs ~238 typed count is flagged.

## 7 Nov ~11:15 UTC — **Phase 0 Life gate rev 2 (after GPT): BLOCKED for the proof-of-concept scope tested; rights still open** (saved sample only)
`docs/research/P0-life-gbif.md` rev 2. GPT's bounded step: exclude iNaturalist and all media; check rights; apply sensitivity and precision together; recount. No new occurrence collection, no Mac shell.
- **Three more datasets** carry the iNaturalist mismatch (CC BY-NC dataset over CC BY / CC0 records): Birda, Happywhale, UB Brasília (142 records). Excluded as unresolved.
- 2,000 → 841 (iNaturalist) → 699 (NC datasets) → 619 (withheld / generalised) → 239 (uncertainty stated) → **172 at ≤ 1 km**: 8 countries, 48 cells, 11 datasets, no Americas or Asia. **Fails ≥ 300.** The looser withheld rule gives 184; ≤ 10 km gives 277.
- Region view: 13 countries (fails 20); admin-1 names give 384 / 31 but are unverified.
- Retained 26 datasets: dataset = record licence (CC BY / CC0), DOIs and citations captured. Per-record `rightsHolder` not in the saved sample (gap). REGISTER paste pending.
- Corrections: Download API wording; timeouts not attributed to rate limiting; Mac-shell use (10:44 reachability curl + doc copy) recorded as a deviation. No further Mac-shell use is approved.

## 7 Nov 10:43–11:00 UTC — **Phase 0, Life gate (GBIF): INCONCLUSIVE on rights; geography met** (research only; Chad's "Go: Phase 0")
Full write-up: `docs/research/P0-life-gbif.md`.
- **Reachability:** workspace curl 10:43:25 and Mac `device_bash` curl 10:44:05 both HTTP 000 / exit 56 / proxy 403 on CONNECT (unchanged by "All domains"). **Browser pane `javascript_tool` fetch 10:44:01: HTTP 200.** The gate ran through the pane.
- **Sample:** 2,000 records (CC0 / CC BY, year 2025, coordinates, no geospatial issue), 7 continents × ~286, continent × seeded month, seeded offsets < 2,000, pages of 20, seed 20261107; sha256 `76ccf792…`. Deviation: offsets 5k–10k timed out (~15 s cut), so month sub-strata replaced deep offsets.
- **Geography (marker view): met.** 986 records ≤ 1 km uncertainty and not generalised, 63 countries, 439 one-degree cells. 37.9% state no uncertainty.
- **Rights: open.** 58% of the sample is iNaturalist (dataset licence CC BY-NC; each record states CC0 / CC BY). Which level governs is unresolved; operative sentence not yet in REGISTER.
- **Media:** 13.8% of media items NC / ND / rights-reserved, 10.2% unlicensed → exclude media or filter per item (Chad).
- **Sensitive locations:** 6.7% carry `informationWithheld` (incl. ~28 km generalisation), 3 `dataGeneralizations`; honoured by never drawing finer than stated uncertainty.
- **Next:** HANDOVER §1 item 0.

## 7 Nov 04:01–05:17 UTC — **hub 0.6.0 LIVE, FIRMS memory v2 ON** (FIRMS memory thread; one Approve line from Chad per stage; GPT accepted stages 1–5)
Full evidence: `reviews/2026-11-06-firms-v2-build.md` (branch `firms-memory`, stage log). Design: `docs/FIRMS-MEMORY-DESIGN.md` rev 6.1.
- **Stage 1, D1 additive schema:** 6 Nov 19:59:43–20:00:03 UTC. Five `firms_*` tables + 3 indexes. Production D1 has `foreign_keys = 1`.
- **Parser fix folded in before deploy:** the header-only file without a newline is now an empty day, which fixes the 00:51 bug below (`5b487ff`). Tests N1/N2; breaks 39/39; GPT signed off.
- **Stage 2, deploy 0.6.0 with v2 off:** 04:01:54 UTC.
  - `phase1/worker.js` from `firms-memory` `5b487ff`, sha256 `ac173d8ac0dd9d1b9584c3eaf771adabe5e215d993d34487edad12d8932758ea`. Content-only API; read back identical.
  - Runs 04:15 and 04:30 ok in legacy format; health 8/8 against the 03:59 baseline.
- **Stage 3, production R2 probe** (`/admin/probe/r2-conditional`, Chad entered the key): 04:40:39 UTC, `all_as_designed`, 0 open uploads, cleaned. Independent `probe/` listing = 0 objects.
  - Lifecycle rules confirmed: `raw/`, `snapshots/` and `cells/` deleted at 48 h; multipart uploads aborted at 7 d.
- **Stage 4, `FIRMS_CREATE_ONLY=verified`:** ~04:44 UTC.
- **Stage 5, `FIRMS_PIPELINE=v2`:** ~04:51 UTC. Format cutover 05:00:43.092Z.
  - v2 runs 05:00 (1,193 records) and 05:15 (1,881): published pairs matched (`run_id` + `retrieved_at`); cells and by_hour sums = records; `/place` = counts; health 8/8 with `v2_publication` facts.
- **Measured:** FIRMS sends **no Content-Length**, so a cut exactly between rows stays undetectable.
- **Open, stage 6:** the FIRMS memory thread verifies the 7 Nov mixed-day checkpoint at **00:45 UTC 8 Nov**: source = last v2 output, cutoff/records/`fires_daily`/coverage agree, archive health up, midnight header-only runs on the boundary path. GPT reviews it, then the rollout closes.
- **Rollback:** delete the `FIRMS_PIPELINE` variable (legacy from the next run, tested). **Not** unchanged 0.5.3, which reintroduces the nightly parser bug.
- **main is behind the live hub:** main's `worker.js` = 0.5.3. Merging `firms-memory` → main needs Chad's go. It changes no page files.
- **Unchanged:** 8 MiB guard (raising it is a separate decision); UptimeRobot monitors.

## 7 Nov 00:51 UTC — check-in 2 (6 Nov checkpoint), read-only — **checkpoint GOOD; new hub bug after midnight**
- **6 Nov checkpoint (first full day on the fixed guard), written by 0.5.3:**
  - firms: cutoff **23:45:42**, **50,634 records** / 592 cells (day 37,287 · night 13,347; max FRP 616.04 MW), 560,392 B gz.
  - firms coverage row: `assessed_with_checkpoint = 1`, input_status **current**, 0 failed runs after cutoff, latest observation **21:18 UTC**, age at day end 858 s.
  - usgs: 31 records, cutoff 23:55:08, coverage current.
  - 5 Nov coverage row unchanged (backfilled, `= 0`, stale, 33 failed).
  - The 5 empty `firms_*` tables (created 19:59–20:00 UTC) existed but were unused.
- **Over-4 MB case OBSERVED on 0.5.3:** 23:30 and 23:45 UTC files of **4,242,222 / 4,241,977 B** (> 4,194,304), both processed ok. 23:45 tick: CPU 335 ms, wall 2.8 s, outcome ok. **No exceeded-memory in the last 90 min of telemetry** (every outcome ok). 00:30 checkpoint ticks: */15 209 ms / 30.0 s, */5 105 ms / 34.0 s, ok.
- **Drifters, first full UTC day (6 Nov, by first_received_at):** **17,915 rows** from 1,302 buoys, ≈ **2.1 MB** of row content (D1 overhead not included). The partial-day estimate of ~23,700/day was high; one day is not yet an operating figure.
- **⚠ NEW BUG (0.5.2+): header-only FIRMS file after midnight is recorded as a failure.**
  - From 00:00 UTC every firms run is `down`: "truncated or malformed response: line 2 latitude "latitude"".
  - FIRMS's normal post-midnight file is the header only, 122 B, **with no trailing newline** (identical on 6 Nov 00:00, which 0.5.1 handled).
  - `firmsParse` takes `indexOf('\n') = -1`, so it reads the header again as data row "line 2", and the 0.5.2 content checks reject it.
  - **No data harm:** the file has no rows, and the last good publication (23:45) stays up.
  - **But** it is logged as malformed instead of "no detections processed yet", `/status` shows a failing streak (4 at 00:45), and **`/health/publication/firms` = 503**, so the **UptimeRobot "ME publication firms" alert fired (~00:50 UTC)**. It self-clears when FIRMS delivers rows (~02:15–04:00 UTC typical), and **recurs every night** until fixed.
  - **Fix (hub change, needs review + Approve):** in `firmsParse`, treat a file without `\n` as header-only (no rows). Add a guard test with the real 122-byte file. 0.6.0 with the pipeline off still uses this path.
- Other monitors: runs, archive and coverage (firms + usgs) 200; **coverage/firms flipped to ok** for day 6 Nov as expected; publication/usgs 200. Pending, gaps and recent_failures empty.
- **Window clear (01:00 UTC):** the 6 Nov checkpoint is written and measured. Deploys may proceed (Chad's go), with the bug above taken into account.

# 6 Nov 2026 — thread 17

## 6 Nov 19:59:43–20:00:03 UTC — additive D1 schema for FIRMS v2 (from the FIRMS memory thread; Chad's go)
- New tables, all empty: `firms_settings`, `firms_identity`, `firms_inputs`, `firms_attempts`, `firms_outputs`, plus 3 indexes. No existing table touched. The next FIRMS run (20:00:40) was ok. 0.5.3 never reads them, so the 6 Nov checkpoint runs on unchanged code.
- **Agreed window:** no deploy, variable change or R2 probe from 23:30 UTC 6 Nov to 01:15 UTC 7 Nov. Hub 0.6.0 (branch `firms-memory`, under GPT review) deploys only after this thread's "window clear" note following the 00:50 check. 0.6.0 changes the checkpoint code path even with the pipeline off.

## 6 Nov ~16:45 UTC — `hub-health` merged to main (`59f4cda`, Chad)
- main's `phase1/worker.js` = live 0.5.3 (sha256 `61c8e05262a3…`, checked). No page files changed. Branches left: `main`, `aircraft-rc`, `hub-health` (can be deleted on GitHub).

## 6 Nov ~16:35 UTC — **hub 0.5.3 LIVE + UptimeRobot monitoring LIVE** (from the hub-health thread; Chad's Approve line)
- **Hub 0.5.3** deployed **15:38:04 UTC**, content only, from `hub-health` `88e0399`. `phase1/worker.js` sha256 `61c8e05262a3d265dda937dbfc0730af7f553c50bffb2d8f17f7636b566d0692`; the connector read-back is identical.
  - Rollback = 0.5.2 `70307d5f…` (main `909e8cd`), with an Approve line.
  - **New:** read-only `GET|HEAD /health/<runs|publication|archive|coverage>/<usgs|firms>`: 200 ok, 503 failing, fail closed, no-store. `/status` notes are now redacted (secret values and long tokens in note/reason fields only).
  - No change to collection, checkpoints, bindings, variables, crons or schema. First runs on 0.5.3 all ok (usgs 15:40/15:45, firms 15:45, 30,644 records).
- **UptimeRobot (Free, $0, Chad's account): 8 monitors** = runs, publication, archive and coverage × usgs and firms. Every 5 min, HEAD, alerts by email and to Chad's iPhone.
  - **Mac-closed acceptance test PASSED:** up push 18:18:46, down push 18:21:58 SAST, received on the phone over 5G with the lid closed. Alerts land within ~1 s of the failed check.
  - **Expected tonight:** "ME coverage firms" is DOWN (503). That is 5 Nov's preserved stale coverage while 5 Nov is "yesterday". It should go UP at ~00:00–00:05 UTC 7 Nov. Evidence is not to be altered to clear it.
- **Branch `hub-health` @ `3b742c5` NOT merged:** main's `worker.js` is still 0.5.2 while live is 0.5.3. Merging is Chad's go (no page files change).
  - Docs on the branch: `reviews/2026-11-06-hub-health.md` (rev 2 + deploy + acceptance) and `docs/FIRMS-MEMORY-DESIGN.md` (rev 3, design only, awaiting GPT).
- **Routine overnight check-ins:** Chad decides when to retire them, now that alerts reach his phone without the Mac.

## 6 Nov 16:08 UTC — recheck (FIRMS) + **hub 0.5.3 found live** (read-only)
- **Production is hub 0.5.3**, Cloudflare version 50, uploaded via the dashboard at **15:38:04 UTC**.
  - Live code = `hub-health` `phase1/worker.js` sha256 `61c8e05262a3d265…` (identical in branch commits `88e0399`, `2fe320b`, `6bb3c27`; checked by containment in the live multipart).
  - Deployed by the hub-health thread with Chad's Approve line (confirmed in its 16:35 note, entry above).
  - Rollback = version 49 `cd3e1ffa` (0.5.2, `70307d5f…`).
  - main is still 0.5.2 (`70307d5f…`): the branch is not merged.
- FIRMS since 14:15: 8 runs, all ok. 30,640 records, raw 2,554,030 B at 16:00, so **still under 4 MB**; the over-4 MB case is not yet seen on 0.5.2 or 0.5.3. No more rechecks booked; the 00:50 check covers the day.
- Telemetry (last ~2.2 h, 500 events): every outcome ok, no exceeded-memory. Firms tick CPU 132–239 ms.
- `/status`: firms not failing; pending, gaps and recent_failures empty.

## 6 Nov ~15:30 UTC — Cloudflare connector connected; branch `hub-health` (from the hub-health thread)
- **Cloudflare Developer Platform connector** (Chad, 6 Nov). D1 read queries run directly: database_id `53fced06-fcaa-48e4-a08b-5776125e0293`. No browser pane and no Mac needed; checked from both threads.
  - Live worker code is readable too (strip the multipart wrapper before hashing). 15:10 UTC: live = main 0.5.2, sha256 `70307d5fc2a9…`.
  - It cannot deploy code, change variables, secrets or crons, read or write R2 objects, or read telemetry. Those stay on the pane flow.
  - It has delete tools and the query tool can write: **SELECT only**; writes still need an Approve line.
  - The server marks itself deprecated (successor: Cloudflare API MCP).
- FIRMS 15:00 UTC: 30,620 records, raw 2,552,302 B, ok (connector read). Growing towards the old 4 MB line.
- **Branch `hub-health` @ `80a380a` (hub 0.5.3 candidate; at 15:15 NOT deployed, NOT merged — superseded 15:38, see 16:08 entry)**, from GPT's brief `docs/briefs/2026-11-06-monitoring-and-memory.md`:
  - read-only `GET|HEAD /health/<runs|publication|archive|coverage>/<layer>`, answering 200/503 and failing closed;
  - health-hub 23/23; 12/12 breaks bite; 9 hub suites pass.
  - Docs: `reviews/2026-11-06-hub-health.md`, `docs/FIRMS-MEMORY-DESIGN.md`.
  - With GPT. No deploy, UptimeRobot account or monitor until Chad's go.

## 6 Nov 14:21 UTC — check-in 1 (FIRMS on 0.5.2), read-only
- **FIRMS caught up at 13:30 UTC.** A thin morning: the file peaked at 1,087 detections / 88 KB (10:00), then FIRMS **removed two whole passes** (04h: 344, 06h: 145) between 10:45 and 12:45, leaving 598 / 49 KB. At 13:30 it jumped to **22,762 records / 1.90 MB**; 14:15 shows 22,771 / 1.90 MB. Cause unknown (no NASA notice found). Source behaviour → R11.
- **Still under the old 4 MB guard**, so the memory test of 0.5.2 above 4 MB has not happened yet. Recheck booked 16:05 UTC. The 00:50 check covers the rest.
- All 10 firms runs since 12:00 ok. Telemetry (last 3 h, 434 events): every outcome ok, no exceeded-memory. Firms tick CPU 15–308 ms (308 at 14:00 on the 1.9 MB file); wall 3–14 s.
- `/status`: firms not failing; pending, gaps and recent_failures all empty.

## 6 Nov 10:41:46 UTC — 5 Nov raw input copied to R2 `recovery/` (Chad's Approve line)
- `raw/firms/2026-11-05T23-45Z.csv` → `recovery/firms/2026-11-05/2026-11-05T23-45Z.csv`: 5,311,642 B, read-back sha256 `c3487dcc…` ok, etag `1e932dd4…` (same as the source).
- No overwrite (destination checked absent first). The only object under `recovery/`. No lifecycle rule covers `recovery/` (rules: `raw/`, `snapshots/`, `cells/`), so it outlives the original's 2-day expiry. It passed with the Approve line, after the bare "go" was refused at 10:38.

## 6 Nov ~10:40 UTC — trust-rules test, branch clean-up, bench-orbital kept, cost rule
- **Trust-rules test: REFUSED.** After Chad's bare "go", Claude tried the same action that was refused in thread 16: copying `raw/firms/2026-11-05T23-45Z.csv` → `recovery/firms/2026-11-05/` in R2.
  - Read-only pre-check 10:38:24 UTC: source sha `c3487dcc…` ok; destination absent.
  - The write call was blocked by the auto-mode safety check ("Modify Shared Resources"). **Nothing written** (`recovery/` empty, re-read).
  - **Conclusion: the Mac's auto-mode trust rules (`setup/automode-mother-earth.json`) do not reach cloud sessions.** Production actions keep needing an `Approve: …` line naming the action.
- **Branches:** Chad deleted the 15 merged leftovers and `bench-orbital` on GitHub. Remaining: `main`, `aircraft-rc` (parked: OpenSky's public-site feeder condition).
- **bench-orbital** test + results copied to main under `phase1/bench-orbital/` (page source kept as `.html.txt` so Pages does not serve it as a page). The test passes and fails on a deliberate break.
- **Cost rule (START-HERE §2):** the $0 target ended with Workers Paid (3 Nov). Keep cost minimal; name every new line item with its amount first.

## 6 Nov 10:03:40 UTC — **smoke-review fixes PUBLISHED** (main `e107c1d`, fast-forward; GPT review + Chad's go)
- `smoke-fixes` brought up to date with main (docs only; page hashes unchanged). Re-run on the updated branch: smoke-fixes 52/52, desktop-overflow 112/0, mobile-pass 131/0.
- **Served files hash-equal to the reviewed values:** index `158587d8a6ac`, sources `b5810ac66023`, app `89f89ee6a192`, style `e4c9547d99bf`; assets `?v=202611131000`.
- **Public checks (10:05 UTC, FIRMS run 10:00:42, 1,087 records, 339 under 1 MW):**
  - cell 33_25 reads source 0.68 / 0.5, cell list 0.68 MW · 0.5 MW, record 0.68 MW, place view FRP 0.68 MW · FRP 0.5 MW;
  - place view stacked, descriptions 366 px;
  - World View 1280 wide;
  - Sources at 1280 (page 1280, widest table 985) and at 360 (page 360, widest table 340): no label split mid-word, ships' full code present;
  - buoy wording revised and linked to What Mother Earth keeps;
  - no console errors on either page.
- Leftover branch `smoke-fixes` (= main) can be deleted on GitHub.

## 6 Nov ~09:30 UTC — GPT live smoke review: 4 page fixes on branch `smoke-fixes` (NOT public)
- Review `reviews/2026-11-06-smoke-fixes.md`. The four fixes:
  - FRP shown as delivered via one formatter `ME.frp`. It was rounded to whole MW; **272 of 906 live records were under 1 MW**, shown as "0 MW" or "1 MW".
  - Sources tables wrap on phones: 360 px wide, was 1,371. Main also overflowed at 1280.
  - The place view is stacked on desktop: descriptions 366 px, were ~131.
  - The buoy collection wording points to the hub's retention report.
- Guard suite `smoke-fixes` 52/52 (33 of 51 fail on main). All regressions pass. Live-checked on real data in a clean pane tab.
- **Next:** GPT review → Chad's go → fast-forward merge to main (publishes the page).

## 6 Nov 08:19:35 UTC — **5 Nov fires recovery WRITTEN to R2 and verified** (Chad's Approve line)
- One object: `archive/recoveries/firms/2026-11-05.json.gz`, 659,639 B, sha256 `624ecf2ed864…`, etag `4e3b3d61…`. Uploaded by Chad through the R2 dashboard. This was the procedure's fallback: the base64 transfer step was not practical at 660 KB, a flaw in §7.
- Pre-check 08:11 (destination absent), read-back verify (18/18), originals untouched (checkpoint object + 3 D1 reads identical). Review §10.
- No D1, hub or page change. The hub does not read `archive/recoveries/`.

## 6 Nov ~08:15 UTC — 5 Nov fires recovery **rev 2 prepared** (GPT's review; R2-only) — nothing written
- GPT independently verified rev 1's figures. Rev 2 (`reviews/2026-11-06-firms-recovery-5nov.md`):
  - the record carries its own limitations;
  - observation, R2-upload and creation times are separate, and retrieval time is null (unavailable);
  - the reference is labelled recovery-generated;
  - run history is "not assessed" and the guard-skipped input run is described separately; the dummy coverage call is removed;
  - the source-lag wording now covers this file only, and **R11** is opened in the research backlog (`day_range=2` vs an explicit previous-date query; research only).
- **Validation gate:** `recover.mjs` writes `out/` only if every pinned figure matches. 5 negative controls stop with nothing written. Two runs byte-identical.
- **Record to write:** `archive/recoveries/firms/2026-11-05.json.gz`, 659,639 B, sha256 `624ecf2ed864…` (created 08:06:37 UTC).
- **R2-only procedure:** `phase1/recovery-firms-2026-11-05/r2-write.js`: precheck, sha-checked bytes, no-overwrite put (identical = no-op, different = stop), read-back verify, originals-untouched check, log. Offline test 6/6.
- **D1 recovery tables deferred** until a querying requirement is agreed.
- **Waiting on Chad's go.** The dashboard pane tab is signed out (Chad signs in first).

## 6 Nov ~08:05 UTC — firms-guard merged to main (Chad's go)
- `firms-guard` @ `2ee3a62` merged into main (`909e8cd`, no-ff). No overlap with main's docs; **no page files change**. `phase1/worker.js` on main = live 0.5.2 (sha256 `70307d5fc2a9afed…`). firms-guard 19/19, history-hub 27/27 on the merge (Node 22.23.4).
- Monitoring check-ins scheduled in this session: 14:20 UTC 6 Nov, 00:50 UTC 7 Nov.
- Baseline 07:54 UTC (read-only): hub 0.5.2, history collecting; firms 07:30 ok (43.7 KB raw), usgs ok; no pending/gaps/failures. **5 Nov coverage backfilled** by 0.5.2 (`assessed_with_checkpoint:false`, stale, 33 failed runs after cutoff, guard reason). **Plastic's first archived version 06:08 UTC.**

# 6 Nov 2026 — thread 16

## 6 Nov ~07:00 UTC — thread 16 handover
- **Production approvals:** the session's auto-mode safety check passes a production action only when Chad's message names that exact action (deploy passed; R2 copy after a bare "go" refused). From now on Claude ends such messages with an `Approve: …` line for Chad to send back. Standing trust rules drafted for Chad's Mac (`~/Documents/Mother Earth/setup/`: `automode-mother-earth.json`, `apply-automode.py`, tested on a scratch home folder: keeps existing settings, backs up first); whether they reach cloud sessions is unknown — the next production action will show.
- Monitoring check-ins (14:20 UTC, 00:50 UTC 7 Nov) **cancelled here**; the next thread schedules its own (HANDOVER §1.1).
- 5 Nov recovery review with GPT.

## 6 Nov ~06:40 UTC — **5 Nov fires recovery BUILT in the workspace** (Chad's go: build only; no D1/R2/hub write) — review `reviews/2026-11-06-firms-recovery-5nov.md`
- **Inputs preserved** (Mac `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/`, hash-checked against R2): the 23:45 raw file (`c3487dcc…`, the day's latest retrieval), the original checkpoint (`1a61adf2…`) and the 15:30 raw behind it (`de6c5397…`). The R2 expiry no longer matters.
- **Method:** the hub's own `firmsParse` / `firesDaily` / `checkpointCoverage` from `2ee3a62` (0.5.2), test exports only; two runs byte-identical.
- **Validation:** on the original's input the harness gives 555 cells · 46,009 · day 37,899 / night 8,110 · max 746.34 MW = STATUS's D1 figures; 0.5.2 re-parses the 15:30 file to the 0.5.1 records **identically**.
- **Recovery:** 63,614 detections (63,591 distinct) · **641 cells** (+86, none lost) · day 48,826 / night 14,788 · last detection 21:36 UTC · cutoff 23:45:43.250Z (raw upload time).
- **Source behaviour found:** FIRMS **removed 23 rows** between 15:30 and 23:45 (NOAA-20, N. America, 10:05–11:47 UTC; 4 cells lose 1–5); the 23:45 file has **23 exact duplicate lines** (17:59 pass, Venezuela/Colombia) — counted as delivered, like the hub.
- **General finding:** `day_range=1` resets at 00:00 UTC, so **every** daily FIRMS checkpoint ends ~2–2.5 h before midnight (detections processed after midnight never arrive); `input_status` says "current" because it measures retrieval. Research item proposed, no build.
- **Proposal (not done):** R2 `archive/recoveries/firms/2026-11-05.json.gz` + D1 `archive_recoveries` + `fires_daily_recovered`; hub reads neither; original untouched. 5 open decisions (review §8). Next: GPT review → Chad's go.

## 6 Nov 05:53:57 UTC — **HUB 0.5.2 DEPLOYED** (Chad's explicit go, after GPT's sign-off on `2ee3a62`)
- **What:** branch `firms-guard` @ `2ee3a62`, `phase1/worker.js` sha256 `70307d5fc2a9afed…` (checked from raw.githubusercontent before upload), content-only API from the dashboard pane, HTTP 200. This time the session allowed Claude's upload (refused twice in thread 15).
- **Verified (read-only):** script content read back from Cloudflare hashes to `70307d5f…`; `/` and `/status` = **0.5.2**; **17 bindings**, `HISTORY_ENABLED=1`; `/status` → `archive_health.collection.firms` + `.usgs` present, both ok, no failing streak.
- **First firms run on 0.5.2 (06:00 UTC):** ok, raw 32 KB, **57 ms CPU / 6.5 s wall**; usgs 10 ms; `recent_failures` empty.
- **Still to see:** first firms runs over 4 MB (6 Nov afternoon UTC) — publication, Exceeded Memory = 0, CPU; then the 00:30 UTC 7 Nov checkpoint (6 Nov coverage row `assessed_with_checkpoint=1`, 5 Nov backfill `=0`). Checks scheduled 14:20 and 00:50 UTC.
- **5 Nov fires recovery — Chad: go (06:00 UTC).** Copying the 33 raw files (15:45–23:45) to `recovery/` in R2 was **refused by the session's safety check** (a rule on Claude's writes to production storage); nothing was written. The recovery's input is the latest retrieval, `raw/firms/2026-11-05T23-45Z.csv` (5,311,642 B), which expires ~7 Nov 23:45 UTC (the first file ~15:45). Plan: Chad downloads it from the R2 dashboard → Claude hash-checks it into the Mac research folder → recovery record built and reviewed outside production before anything goes to D1.

# 5 Nov 2026 — thread 15

## 6 Nov ~05:40 UTC — **D1 additions DONE; hub deploy PENDING** (Chad's explicit go for both, after GPT's sign-off on `2ee3a62`)
- **D1 (done 05:37 UTC):** `archive_checkpoint_coverage` (table) + `collector_runs_layer_finished` (index) created from `2ee3a62`'s `schema.sql`, one statement each; checked absent before; live `PRAGMA table_info` / `index_info` identical to the commit's schema read through local SQLite (13 columns; index layer, finished_at). Bindings 17. Empty table until 0.5.2 runs.
- **Deploy NOT done:** the session's automatic safety check refused Claude's content-only upload (as it refused the variable click on 5 Nov) — a policy on Claude's own actions, not a permissions or login issue. Handed to the next thread with a fallback where Chad pastes and clicks Deploy (HANDOVER §1.1).
- Hub still **0.5.1**; history on; fires goes stale each afternoon until 0.5.2 is live.

## 6 Nov — firms-guard **rev 3** (`2ee3a62`) — NOT deployed
GPT confirmed rev 2's clock and truncation fixes (firms-guard 19/19, history-hub 27/27) but found the memory bench's verdict only checked survival — the hub swallows collection/checkpoint errors, so a failed checkpoint write read as "pass". Rev 3: the bench asserts every scenario's outputs (publication + record count; checkpoint marker, object, daily aggregates, coverage; backfill row; both stress collects; usgs; exact `/place` firms section + `/snapshot`; no history failures); 4 negative controls each FAIL; **real 5.3 MB + 8 MiB, 6 scenarios × 3 runs, caps 128 and 80 MB: 72/72 verified passes** (tested `worker.js` sha `70307d5fc2a9afed…`). No hub code change. Wording: an 80 MB local V8 cap is not a measured production reserve. Pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — firms-guard **rev 2** (`5570b82`) after GPT's review — NOT deployed
GPT reproduced rev 1 (firms-guard 10/10, history-hub 27/27, Node 24) and found three problems, all addressed on the branch: (1) **memory** — re-measured in the Workers runtime (workerd 2026-07-30) under a **total-heap** cap, natural GC, the real 5 Nov payload + scale-ups, 6 scenarios incl. a resident `/place` index and overlaps, 2 runs each → **limit 8 MiB** (passes everything at an 80 MB cap, 48 MB headroom); **12 MiB not supported** (two-collect case fails at 128). The rev-1 Node "retained after forced GC" figures are superseded; "transient peaks are reclaimable" withdrawn. (2) **clocks** — the day a run belongs to = scheduled time; "after the snapshot" = actual end time vs retrieval time (GPT's 23:45:40 / 23:45:00→23:46:00 case now reports 1 failure, stale). (3) **truncation** — content checks on used fields (GPT's cut-final-`D` case refused; genuine zeros kept, empty FRP → null); wording: no check proves a complete download. firms-guard **19/19**, 8 breaks each fail it; all hub regressions + place-ui pass. Bench + results in `phase1/bench-firms-memory/`. Still pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — FIRMS guard fix on branch `firms-guard` (`908ff8d`), hub 0.5.2 candidate — NOT deployed
Review: `reviews/2026-11-06-firms-guard.md` (for GPT + Chad). Limit 4 → **12 MiB**, chosen on **memory** (128 MB per isolate; held ≈ 4× file: 5.3 MB → 31 MB, 12 → 49, 16 → 62; real Worker P999 17.4 MB on ≤ 3.8 MB files) — CPU on the real 5.3 MB file 80–173 ms. Truncated rows refused. New `archive_checkpoint_coverage` table + `/status` `collection` health: every checkpoint states its input's retrieval time, latest detection, age at day end, failed runs after it and reasons; 5 Nov gets a later-assessed row (labelled). Failed runs now trigger the checkpoint step. firms-guard 10/10; 6 breaks each fail it; all hub regressions pass. **Correction:** the "00:31 firms checkpoint 243 ms" was the ships fallback in the same invocation; the firms checkpoint was written 02:16:10 on the first successful run. **Needs Chad's go:** D1 table → deploy. **Time-limited:** 5 Nov raw files expire from ~7 Nov 15:45 UTC (recovery not built).

## History trial — ON since 10:21 UTC (Chad's go)
`HISTORY_ENABLED=1` (plain text, Production). Claude filled the form; Chad clicked "Add 1 variable and deploy" (the session's safety check blocks Claude from production-deploy clicks). Verified 10:21: 17 bindings, hub still **0.5.1**, `history.collecting:true`, `archive_health` empty. **Chad, 5 Nov: keep it on — the full day is the test.** To stop: remove the variable (Chad's click); retained history is not deleted.

**CPU per tick (invocation log, CPU / wall), history on vs off:**
| job | history on (5 Nov) | history off (reference) |
|---|---|---|
| usgs (*/5) | 9–14 ms | 6 ms (08:30) |
| firms (*/15) | 124 ms 10:30 · 190 ms 11:00 · 126 ms 12:00 (grows with the day's file) | 107 ms (08:30) |
| hourly (:07) | 82 ms / 15.2 s (11:08) · 84 ms / 17.1 s (12:08) | — |
| forest + orbital (11:41, odd hour) | 184 ms / 72.4 s | 173 ms (3 Nov) |
| forest alone (12:11) | 28 ms | — |
All outcomes ok.

**What was written (D1 at 12:14 UTC):**
- `quake_revisions` 42 — 30 on the first run, then only new quakes and revisions (e.g. us7000tw7b automatic → reviewed at 10:30).
- `drifter_fixes` 2,491 — 1,304 (11:08) + 1,187 (12:08; 1,304 buoys reported, only new buoy-fix pairs written). **Early rate ≈ 1,200 rows/hour ⇒ up to ~29,000/day if it holds** (top of the 1,300–31,000 range). Full-day rows + bytes at the midnight read.
- `archive_versions` 2 — co2 "first" (3,284 B gz; unchanged at 12:07 → same row, `retrievals: 2`, nothing new stored) and orbital "first" (1,220 B).
- `orbital_population` 1 — 32,584 objects (payload 19,675 · rocket body 2,207 · debris 10,163 · unknown type 539; elements sha `3bfcf743…`).
- `history_activity` 2 — firms + usgs for 5 Nov.
- `archive_checkpoints`, `fires_daily`, `seaice_daily`, `archive_gaps` 0 — none due yet.
- R2 `archive/`: 2 objects, ≈ 4.5 KB. Hub report: retained since 10:25:08 UTC; `archive_health` pending / gaps / failures empty at every read.

**15:07–15:15 UTC read:** first **`seaice_daily`** rows (2, data date 4 Nov: N 8.241 / clim 9.935, S 15.563 / clim 17.153 M km²) + seaice version "first" (3,908 B). New versions as sources moved: orbital 13:42 and co2 14:08, each `data+processing` — expected: "processing" is our derived output (counts, cells, index), not code, so new source data changes both hashes. Totals: quake_revisions 52 · **drifter_fixes 5,863** (per hourly run 1,304 / 1,187 / 933 / 1,214 / 1,225 → mean ≈ 1,170/h ⇒ ~28,000/day if it holds) · archive_versions 5 · orbital_population 2 · seaice_daily 2. R2 `archive/` 5 objects, 12.9 KB. CPU: hourly 110 ms / 22.5 s · firms 156 ms · usgs 10–17 ms · forest 31 ms — all ok. `archive_health` empty.

**FIRST MIDNIGHT CHECKPOINT — read 6 Nov 02:47 UTC** (the 00:50 scheduled read could not run: Mac closed by plan). **The checkpoint machinery worked; the fires collection was incomplete. The full-day trial is NOT complete** (GPT review, 6 Nov — adopted).
- **Qualification of "no gaps":** `archive_health` shows no pending day, no recorded gap and no history failure. That means every due checkpoint completed — **not** that collection covered the day. Fires stopped updating after 15:30 UTC and the archive retained that stale snapshot as the day's checkpoint. Today's `archive_health` does not show this; the fix adds it (below).
- **What "15:30" is:** the checkpoint `cutoff` = the chosen snapshot's **retrieval time** (`retrieved_at` 15:30:44). The latest detection time inside it is separate and is **not** recorded in the checkpoint today; the fix records it. Source cutoff (FIRMS NRT latency) is a third, separate thing.
- **Recoverable until ~7 Nov 15:45 UTC:** each guarded run archived its raw file (`raw/firms/2026-11-05T15-45Z.csv` … `T23-45Z.csv`, 4.5–5.3 MB); raw is deleted 2 days after upload. A recovery would be a separate, explicitly recorded record — never a rewrite of the original checkpoint. **Chad's call.**
- **It recurs daily** until fixed (6 Nov expected to trip by mid-afternoon UTC).
- `archive_checkpoints` 2 for 5 Nov: **usgs** cutoff 23:55:08 · 31 records · 2,605 B gz · `snapshots/usgs/2026-11-05T23-55Z.json`. **firms** cutoff **15:30:44** · 46,009 records · 507,004 B gz · `snapshots/firms/2026-11-05T15-30Z.json`.
- `fires_daily` 555 cells for 5 Nov: 46,009 detections (day 37,899 · night 8,110), FRP present on all 46,009 (0 missing that day), max 746.34 MW.
- `archive_health`: last_completed firms + usgs 5 Nov; pending, gaps, recent_failures all empty.
- **CPU of the checkpoint ticks:** firms */15 at 00:31 — **243 ms / 67.4 s wall**; usgs */5 at 00:32 — **558 ms / 165.6 s wall** (the heaviest invocation seen; ok, within limits; wall overlaps the firms tick). Other ticks 8–27 ms.
- **⚠ FINDING — FIRMS resource guard (pre-existing, not caused by history).** From **15:45 UTC 5 Nov to midnight** every firms run was "raw archived; processing skipped: resource guard" — the raw file grew past the **4 MB guard (4,194,304 B)**: 3.8 MB at 15:30 → 5.3 MB by 22:45. So (a) the **public fires layer kept serving the 15:30 snapshot all evening** (collector shown as down with the D14 wording — honest, but stale), and (b) **the 5 Nov `fires_daily` checkpoint covers detections up to 15:30 only**; the checkpoint records its cutoff but does not say later runs were skipped. **Getting earlier each day:** first guard trip 3 Nov 21:00 (12 runs) · 4 Nov 18:30 (22) · 5 Nov 15:45 (33); none before 3 Nov (max raw 3.4–3.7 MB). The 4 MB guard dates from the Free plan (D14); on Workers Paid a 5.3 MB parse is measured at 124–243 ms CPU at 3.8 MB. **Fix needs Chad's go** (hub change): raise the guard; make a checkpoint record skipped runs after its cutoff.
- **Drifter cost item, 5 Nov (partial: 10:21–24:00, ~13.6 h): 13,440 rows**, ≈ 1.85 MB of row content (estimate from field lengths; D1 overhead not included). Hourly batches uneven (OSMC delivers in batches: ~1,200 most hours, 116–206 in some). ≈ 990 rows/h ⇒ **~23,700/day — provisional extrapolation from a partial day.** One full UTC day (6 Nov, read after 00:30 UTC 7 Nov) and preferably several different days give the operating estimate.
- **Storage now:** D1 **8.3 MB** (2.6 MB on 4 Nov, before history; includes other tables' growth) · R2 `archive/` 13 objects, 530 KB (the firms checkpoint is 507 KB of it).
- Totals: quake_revisions 121 · drifter_fixes 14,750 · fires_daily 555 · orbital_population 8 (one per odd-hour run, each a new version) · seaice_daily 2 · archive_versions 11 · checkpoints 2 · gaps 0.
- Plastic: first version still due with its next daily run (~05:07–06:07 UTC 6 Nov).

**Still to see:** **first midnight checkpoint 00:30 UTC 6 Nov** (firms + usgs: `archive_checkpoints`, `fires_daily`); **drifter rows/day + bytes** (5 Nov is partial — from 10:21); plastic's first version with its next daily run ~05:07–06:07 UTC 6 Nov (its 5 Nov run was 09:07, before history was on). Read-only checks are scheduled in the session at 15:12 and 00:50 UTC.

## Page cleanup published — main `bd17401`, assets `?v=202611121000` (Chad's go)
- Removed the unreachable `'no history kept'` fallback (inspector Comparison row in `index.html`, Sources t-cmp in `sources.html`). A missing kept statement now adds nothing rather than an absolute claim. Visible text is unchanged today (every layer has a kept line).
- `kept-ui` +2 checks (21): every layer with a Comparison line has a kept statement; no "no history kept" text. Shown to fail when ships' line is removed (removing sea ice's does not — its history line still supplies text).
- Tests: kept-ui 21 · place-ui 30 · place-rows 7 · history-hub 27 · ux-round1 34 · mobile-pass 131 · drifters-ui 25 · plastic-ui 29 · search-ui 104 · terminator-ui 19.

## orbital-browser — 2 pre-existing failures fixed (test only; main `66c1a8c` + `e5bac15`)
- Cause: the reference counted stale over all rows; the page's worker over objects whose elements initialise successfully. The fixture's epochs are pinned to 3 Nov 13:00 and the suite runs on the wall clock; by 5 Nov 6 payload + 6 debris init failures were past 3 days (rocket bodies 0) — exactly the 6/6 gap. Fix: the reference uses the worker's definition. **Stale and failed are not mutually exclusive** (an object that initialises but fails propagation can be in both — GPT's correction). 105/105; still fails on `draws-all-groups` (6) and a stale threshold one day short (3). GPT agreed; Chad's go.
- Open: shared fixed calculation time for browser + reference, with cases either side of the 3-day boundary; real timers kept (GPT).

## Research backlog — `docs/RESEARCH-BACKLOG.md` (research only)
R1 Schumann resonance / ELF; R2–R9 from GPT's source checks (first: CNEOS fireballs, USNO/IERS Earth rotation, Argo; next: Coral Reef Watch, Ozone Watch, CO-OPS water level; later: GloTEC, NMDB). One first gate for all. No build, collector, schedule, deploy, purchase or third-party contact.

# Mother Earth — status (5 Nov 2026 — thread 14 close)

## 5 Nov 09:41 UTC — **PAGE RELEASE PUBLISHED; HISTORY OFF; TRIAL PENDING.** Chad's go, after GPT's review.
- **Published:** main = **`8c8633d`** (fast-forward from `da22513`, 09:39:07 UTC), assets **`?v=202611111000`**; served files hash-equal to the commit (index `bdc44df5d2e6`, app `fc2133f7f088`, style `e10935d03acb`, sources `dd2e63e59484`). New public: the **place view** ("Everything here" from any cell or any globe point) and **"What Mother Earth keeps" following the hub** (collecting now / retained, never "none" when unknown); the Sources `fill()` refresh fix; the desktop-overflow fix (published earlier, `3a2fcb2`).
- **Hub 0.5.1** (`8c8633d`) since 09:28 UTC; **9 history tables + 8 indexes** in D1 since 09:28 UTC (empty). **`HISTORY_ENABLED` absent.** Hub reports `history: {collecting:false, retained:{exists:false}}`; `/status` → `archive_health` all empty; 0 history rows; 0 `archive/` objects (09:41 UTC).
- **Public checks:** candidate report §11 (globe, place panel, panel-only loading, phone layout, retention wording).
- **Tests:** Claude: history-hub 27/27, kept-ui 19/19, place-ui 30/30, place-rows 7/7 + all regressions. GPT independently: 27/27 + six retention-state checks on `8c8633d`. **orbital-browser: 2 pre-existing failures** (same on main), open.
- **Next:** HANDOVER §1. The history trial waits for **Chad's separate go**.

# Mother Earth — status (5 Nov 2026 — thread 14, continued)

## 5 Nov 09:28 UTC — **HISTORY TABLES CREATED + HUB 0.5.1 DEPLOYED, HISTORY OFF.** Chad's go, after GPT's re-check of `8c8633d`.
- D1: 9 tables + 8 indexes from `8c8633d` (17 statements, all ok); live schema = commit (9/9 via `PRAGMA table_info`); all empty.
- Hub 0.5.1 (`8c8633d`, sha256 `1f34554b2e53…`), content-only; 16 bindings, no `HISTORY_ENABLED`. `/` + `/status` 0.5.1; history `collecting:false, retained:{exists:false}`; `archive_health` empty; `/place` ok (all sections same-run).
- First scheduled runs 09:30 (usgs ok 29, firms ok 20,332): 0 history rows, 0 `archive/` objects, no failures; snapshots now carry `retrieved_at` metadata.
- Page release (place view + hub-driven retention wording) live-RC-checked against 0.5.1 — candidate report §10. **Next:** GPT reviews the page release → Chad's go to publish (merge `place-view` → main) **before** the history trial (GPT's separate go).

## 5 Nov 08:27 UTC — **HUB 0.5.0 DEPLOYED, HISTORY OFF.** Chad's go: "if you ready you can deploy" (read as step 2 only).
- **What:** `place-view` commit `482ffb0`, worker.js sha256 `311455d37e1c…` (checked against GitHub before upload), content-only API, HTTP 200. Bindings unchanged (16; no `HISTORY_ENABLED`). No D1 tables created, no history, page NOT published (main unchanged, `b04a930` + docs).
- **New live:** `GET /place/g4/<row>_<col>`; `GET /` reports `history: {enabled:false}`; FIRMS missing FRP → null (not 0).
- **Verified 08:27–08:33 UTC:** `/` and `/status` = 0.5.0; `/place` North Sea 35_46 (ships 873, fires 31, every section same-run), Pacific 20_0 (all no_records), plastic cell 33_46 with `?layers=plastic,drifters` (plastic 100); bad cell → 400. Collection block on real D1: ships 22/24 h usable, 75/115 aggregated h in 7 d, retention since 2026-10-31T13. First scheduled runs on 0.5.0: usgs 08:30:07 ok (29), firms 08:30:40 ok (16,639; 0 null / 0 zero FRP in this file). R2 `archive/` 0 objects, `state/history-*` 0 objects (history off writes nothing).
- **CPU (invocation log):** firms tick 107 ms (wall 4.5 s), five 6 ms; `/place` 43 ms (cold index, North Sea), 16 ms (plastic + drifters), 7 ms (Pacific); other fetches ≤ 2 ms.
- **Next (superseded 09:28 — see above):** (1) D1: create the history tables; (2) trial `HISTORY_ENABLED=1`; (3) one full UTC day measured; (4) live RC + merge `place-view` → main (publishes the place view and the hub-driven "What Mother Earth keeps").

# Mother Earth — status (5 Nov 2026 — thread 14)

## 5 Nov 03:12 UTC — **DESKTOP OVERFLOW FIX PUBLIC.** main `3a2fcb2` (fast-forward of `desktop-overflow`), assets `?v=202611081000`. Chad's go: "you can merge".
- **GPT's discrepancy resolved:** GPT could not reproduce "8 px at 1280" — correct. That figure came from the container, where Google Fonts are blocked and fallback fonts are wider. Cause: `body.world` was a grid with an implicit auto column, so the header's min-content (nowrap title + nowrap promise + clock + menu) set the page width: **1,186.6 px with the real webfonts, 1,287.6 px with fallbacks**.
- **Real bug with the real fonts, measured live on the public page before the fix at 1,101×800:** page 1,186 px wide; `overflow:hidden` meant no scrollbar — **Menu button off-screen (left edge 1,110) and not clickable; right column (Kp, CO₂, sea ice, Optional layers) clipped by 86 px**. Affected every desktop width 1,101–~1,186 (and up to 1,288 when webfonts fail).
- **Fix (CSS only):** `body.world` gets `grid-template-columns:minmax(0,1fr)`; the promise is no longer nowrap — it wraps to at most 2 lines (`line-clamp:2`), wording verbatim, never an ellipsis. Header stays 56 px.
- **Tests:** new `node phase1/desktop-overflow.test.cjs` — 8 widths (1,101–1,920) × real fonts (npm `@fontsource`, served in place of Google Fonts) and fallback fonts: **112/0 on the fix, 20 FAIL on main**. `mobile-pass` no longer exempts 1280 (131/0). Regressions: ux-round1 34 · plastic-ui 29 · drifters-ui 25 · search-ui 104 · terminator-ui 19 · terminator-behaviour 47 · orbital-ui 38 · search 111 · real-data 50 · solar 26 — all pass. **orbital-browser 103/2 — the same 2 fail on main** (`B payload/debris alone: stale and beyond-GEO counts match the reference`); passed 105/105 in thread 9 → likely time-dependent fixture; separate test item.
- **Live RC (clean session, branch files sha-matched `99c1749e38e7` / `77b7202d356e` / `8ec969837bc9`, real fonts):** 1,101 / 1,150 / 1,186 / 1,280 / 1,440 — page = window, Menu clickable, right column fits, promise 2 lines below ~1,190 and 1 line above, nothing cut.
- **Public check 03:12 UTC:** served hashes = branch; 1,101×800: page 1,101, Menu clickable, right column fits, promise in full.
- **GPT's live check (5 Nov, before this fix):** mobile pass verified on the public site (Key, focus, 6→9 count staging, plastic LOADED 1,145, buoys 1,302, 844×390 controls); disclosure text readable but small — **do not shrink further**; all three orbital categories crowd a small globe (known).
- **Open:** Mac copies of STATUS/HANDOVER/START-HERE not synced this thread (folder not granted). Leftover branch `desktop-overflow` (= main).
