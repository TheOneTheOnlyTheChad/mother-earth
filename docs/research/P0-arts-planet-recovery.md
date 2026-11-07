# Phase 0 — Arts and Planet evidence-recovery pass (for GPT review)

7 Nov 2026, 12:16:28–~12:35 UTC. One bounded session under GPT's go (cap 2 h; used ~20 min of working time). Life stays stopped; aircraft parked. No Mac-shell use, no media fetching, no provider contact, no page or hub change. Browser pane used only 12:20–12:22 UTC, well clear of the FIRMS reservation (8 Nov 02:40–03:00 SAST).

## Review update — 7 Nov 2026, after GPT's review (existing evidence only; nothing new collected or measured)

**Status after review**
- **Life:** stopped. BLOCKED for the accepted marker scope; rights separately inconclusive.
- **Arts:** INCONCLUSIVE. Data rights accepted as **cleared** (CC0; REGISTER filed). Media excluded. GPT did not rerun the artefacts.
- **Planet:** a **partial** baseline.

**Correction.** The earlier line "what stops Arts clearing overall are decisions, not research" was wrong, and is withdrawn. Sensitive-material handling needs **both** an agreed rule **and** enough validation that the retained subset follows it. A keyword screen does not establish complete detection; the Met's own policies are unexamined, and excavation provenance is unresolved.

### Recommended first view (GPT's scope recommendation; not a selection of Arts, not approval to build): `created_at` only, source uncertainty preserved
These are **distinct-object counts** from the existing R1 sample (`met-recovery-sample-R1.json`, sha256 `c4046fd3…3762`). Object lists are saved in `created-at-view-object-ids-R1.json`; no figure is derived by subtracting relationship totals.

| Step | Distinct objects |
|---|---|
| Any `created_at` assignment | 630 |
| Certain + aligned + ISO-resolved `created_at` | 492 |
| − sensitivity-flagged | 488 |
| − country reached **only** through a superseded wording ("Formerly considered made in") | **485** |

- The last row is a **validation finding**: the rules treated "Formerly considered made in" as a certain `created_at`. Three objects (204280, 204292, 204302) entered the view only as "made in Peru", whereas the Met's current wording is "Probably made in Ecuador". They are now excluded, and the rule list gains superseded wording (formerly, previously, once thought, traditionally). Object 204304 stays: it is "Made in Ecuador".
- Excluded before sensitivity: 138 `created_at` objects (69 unresolved country name, 69 hedged).
- **Result: 485 objects, 25 present-day countries; USA 240 (49.5%).** Then France 46, UK 30, China 28, Iran 26, Egypt 23, Germany 23, Türkiye 13, Spain 12, Mexico 8, Italy 7, India 6, Austria 4, Syria 3, Afghanistan 3, Netherlands 3, Uzbekistan 2, and one each for Pakistan, Ukraine, Czechia, Iraq, Japan, Morocco, Canada and Ecuador. No object has more than one `created_at` country.
- Numbers against the criterion: ≥ 300 objects ✓, ≥ 20 places ✓. **Not cleared**: concentration is high (USA half), the long tail is thin (8 countries have 1 object), and the validation below is outstanding.
- Departments: American Wing 326 · Islamic Art 81 · Medieval 41 · Cloisters 37. Egyptian Art drops out entirely; its places are almost all "From". 11 objects also carry other relationships, which stay labelled and outside this view.
- Wordings behind the view: "Made in" 469 · "Country of Origin" 12 · "Minted in" 9, plus a few multi-segment records whose `created_at` segment is certain.
  - **"Country of Origin" (12) is not yet validated** as meaning place of making.
- Precision: 265 / 485 also name a city and 47 a state or region. The view is country-level only.
- How the countries were matched: ISO 3166-1 direct 431, ISO 3166-2 country-type subdivision 30 (England etc.), ISO rename alias 13 (Türkiye), Met "present-day" wording 11.

### `associated_with` ("From")
A potentially valid relationship, kept and explicitly labelled. It is **outside the recommended first view**, not rejected.

### Presenting historical geography
- The country is a **present-day location reference**, not a nationality or a historical polity. For example, a 13th-century object "Made in Iran" is placed in present-day Iran; that says nothing about the maker's nationality or the state of the time.
- Any view would show the Met's **verbatim** wording (Geography Type, Country, City as given, e.g. "Byzantine Egypt", "present-day Uzbekistan") beside the ISO country, with the match rule used.
- Hedged, attributed and superseded wordings stay visible as such.
- Unresolved names (e.g. "Byzantine Egypt", "Nubia (Sudan)", "X or Y") are kept as source text and never mapped.

### Representation limit (prominent)
- Typed geography exists in **five departments only** (Egyptian, Islamic, American Wing, Medieval, Cloisters); the `created_at` view draws on four of them.
- **"Arts of Africa, Oceania and the Americas" is an excluded department.** Its records carry Country without a Geography Type, so they fall outside any typed view.
- That is **not** evidence that Africa, Oceania or the Americas are absent from the view. Records placed in those regions do appear through other departments (e.g. USA, Mexico, Canada, Ecuador, Morocco, Egypt).

### Planet (restated)
**Partial baseline.** The three documented runs are a **warm / mixed-cache reference for a 588 px Mac pane** (phone layout).

They do **not** establish:
- desktop-width behaviour;
- actual iPhone behaviour (a phone-width Mac layout is no substitute);
- a demonstrated cold load;
- total initial transfer (13 opaque resources stay unmeasured, kept distinct from measured transfer);
- direct interactivity (long-task and frame figures are proxies only).

Production headers will **not** be changed to complete a measurement.

### Backdrop (separate, unconfirmed coverage concern)
- The GIBS NOAA-20 true-colour backdrop shows growing swath gaps (30°S–30°N black: 0.2% on 4 Nov → 13.1% on 5 Nov → 25.6% on 6 Nov). NOAA-21 is near-complete on 6 Nov; Suomi NPP has ceased.
- **Cause not established. No backdrop change authorised.** Recorded in REGISTER (GIBS entry) and R11 (FIRMS 6 Nov arrived late, not lost).

### Smallest proposed follow-ups (NOT started; each needs Chad's decision)
**Arts validation (on the existing R1 sample and pinned file; no new sample):**
1. **Relationship check.** Manually review a seeded random 50 of the 485 view objects against their public Met object pages (Link Resource): does the page's place wording match the CSV and the assigned `created_at` country? Also check all 12 "Country of Origin" objects. Report the error rate with an interval.
2. **Rule-list check.** List every distinct Geography Type segment in the typed subset (not just R1) and classify each as created / found / associated / attributed / superseded / hedged, so rare wordings like "Formerly considered" are handled by rule, not by luck. Desk work on the pinned file.
3. **Sensitive-material check.** Read the Met's published policies on human remains and cultural property (desk). Then review the 485 view objects for sensitive material by hand, not keywords: a full pass is feasible at this size. Record exclusions and unresolved cases, without inferring ownership legitimacy.
4. **Rule.** Chad agrees the sensitive-material rule. The check in step 3 then shows the retained subset follows it.

**Planet (measurement only; no production change):**
5. **Desktop width.** One run set with the pane widened to ≥ 1,101 px (desktop layout), same method, three runs. Needs Chad at the screen.
6. **Cold load.** Demonstrated by clearing the pane's site data for the page's hosts (Chad, in the app's settings, if available) or by a fresh browser profile, then showing transferSize > 0 on every visible resource. Otherwise it stays pending.
7. **iPhone.** Three loads with Chad on the phone (Safari): time to globe visible and to first drag response, by screen recording. Stays pending until Chad is available.
8. Direct interactivity and opaque sizes stay unmeasured unless a no-production-change method is found.

---

## Durable evidence locations (repo `main`, mirrored to the project docs)
| What | Where | sha256 |
|---|---|---|
| Met source pin (commit, LFS oid, size, retrieval, verification) | `docs/research/p0-recovery/arts/SOURCE.md` | — |
| Arts script | `docs/research/p0-recovery/arts/arts_recovery.py` | in git |
| Arts sample R1 (2,000 records, metadata only, CC0) | `docs/research/p0-recovery/arts/met-recovery-sample-R1.json` | `c4046fd3…3762` |
| Arts results R1 | `docs/research/p0-recovery/arts/met-recovery-results-R1.json` | `6304a848…5e88` |
| Met REGISTER entry (pending Chad's paste) | `REGISTER.md`, last entry | — |
| Planet runs (conditions, method, three runs) | `docs/research/p0-recovery/planet/runs-2026-11-07.json` | `bb7ad487…b4bc` |
| Not committed | `MetObjects.csv` (340 MB). Re-fetch from the pinned URL and check the hash. | `7adc37e4…d0fe` |

---

## A. Arts (the Met)

### Recovery
- **Original files:** not recoverable. The earlier thread's workspace (scratchpad `…0c2286f7…`) no longer exists. Its transcript keeps the code of the calls but not their outputs.
- **Source version: recovered exactly.** The Met repo's LFS object for `MetObjects.csv` at commit `e394878` (2 Nov 2026, still HEAD on 7 Nov) has sha256 `7adc37e4…`. That is the "etag 7adc37e4…" recorded for the lost samples, so **the lost samples and this recovery used the same file.**
- **New recovery evidence, not a reproduction.** One replacement sample R1 was drawn: 2,000 records from an explicitly defined typed-place subset, `random.seed(20261107)` then `random.sample`. The two original samples were not repeated.
- **Earlier deviation recorded:** the 7 Nov gate drew two samples (A: whole collection; B: typed subset) where the plan named one. **Overlap between A, B and R1 cannot be established**: no record IDs from A or B survive, and R1's subset definition differs (59,137 vs B's 59,924).

### Subset and classification (all in `arts_recovery.py`)
**Typed-place subset:** Geography Type has at least one segment that maps to a relationship, AND Country is non-empty. This gives 59,137 of 503,073 records (60,353 have any Geography Type).

**Relationships**, assigned per pipe segment:
- `created_at`: made, manufactured, minted, printed, carved, "Country of Origin", …
- `found_at`: excavated, found
- `associated_with`: From, Original from, Object place, …
- **`attributed_to` is its own relationship and is always uncertain.** It is never folded into `created_at`. (The earlier sample B folded it in.)
- Probably / possibly / said to be / perhaps / likely → **uncertain**.

**Pipe alignment** (GPT: don't assign the first type to every place). A country is attached to a relationship only when:
- (a) the Geography Type and Country fields have the same number of `|` segments (paired by position); or
- (b) every Country segment is the same country.

Otherwise the record is "misaligned" and its countries carry no relationship. In the whole file 2,612 records have pipes, and field segment counts often disagree. In R1, 1,956 records were aligned, 44 single-country and 0 misaligned.

**Reference:** ISO 3166-1, via pycountry 26.2.16. Documented rules, applied in order:
- hedged names ("probably Iran") are stripped to match but marked uncertain;
- "X or Y" / "X and Y" → **unresolved**;
- "present-day X" → X (the Met's own modern-equivalent wording);
- "Turkey" → TUR (ISO's 2022 rename to Türkiye);
- ISO 3166-2 country-type subdivisions (England) → their country (GBR);
- anything else → **unresolved**, never guessed. Examples: Byzantine Egypt 54, Nubia (Sudan) 4, South Netherlands 3, Scandinavia 1.

City geocoding was not attempted.

### Results (R1, n = 2,000)
- Relationship assignments: associated_with 1,021 · created_at 646 · attributed_to 241 · found_at 159 · unknown 1. Certain 1,699 · uncertain 369.
- Country matching (2,068 assignments):
  - ISO 3166-1 1,859
  - Met "present-day" 18
  - ISO 3166-2 subdivision 52
  - ISO rename alias 40
  - unresolved name 74
  - unresolved multiple 25
- **Departments:** typed geography exists in essentially five Met departments. Egyptian 28,135 · Islamic 15,182 · American Wing 11,442 · Medieval 3,171 · Cloisters 1,207 in the subset; Musical Instruments 56, other 9.
  - **Arts of Africa, Oceania and the Americas** has a Country on 12,126 records but no Geography Type, so it is **entirely outside** any typed view. The same applies to Musical Instruments (4,579).
- **Proposed country view** (one view, as asked): certain and aligned assignments only, ISO-resolved, sensitivity-flagged records excluded. Breakdown of the 2,000:
  - 389 had no certain resolvable assignment: 294 hedged or attributed only, 95 with an unresolved name.
  - 157 flagged for sensitivity were excluded.
  - **1,454 records, 27 countries; Egypt 57.2%** (USA 250, Iran 153, France 46, UK 30, China 28, Germany 23, Spain 13, Türkiye 13, Iraq 11).
  - By relationship: associated_with 818 · created_at 488 · found_at 158. By department: Egyptian 794 · American Wing 341 · Islamic 241 · Medieval 41 · Cloisters 37.
- **Same view, created_at / found_at only** (drops the weaker "From"): **641 records, 27 countries; top country USA 37.4%** (USA 240, Iran 153, France 46, Egypt 36, UK 30). Egypt's dominance comes almost entirely from "From" records.
- The 338 records with an uncertain but resolvable country are kept in the sample, labelled, and outside the view.

### Sensitive material (within the proposed subset)
The screen is a keyword search over Object Name / Title / Medium / Classification / Tags. It produces **candidates for review, not findings**. 159 records were flagged (157 in the view's input); all but 6 are Egyptian Art.
- **Human remains (8 flagged):**
  - 1 is human material: a mud-ball amulet with human hair (Object ID 573711).
  - 5 are linen or mummy wrappings from human burials.
  - 2 are false hits: an ox skull, and an animal-mummy box figurine.
- **Funerary (144):** tomb relief fragments (e.g. tomb of Meketre), shabtis, sarcophagus fragments, cones.
- **Sacred / ritual (9):** shrine inlays, reliquary plaques, a portable altar, ritual-equipment models.

**Handling proposed:** exclude all flagged records from a proof of concept until a review rule is agreed. Human material and burial wrappings stay excluded; funerary and sacred objects are **unresolved**.
- No ownership or legitimacy is inferred from the Met holding these objects, or from credit lines (many Egyptian records are 1910s–1920s Rogers Fund / expedition acquisitions; that is recorded, not judged).
- found_at records (158 in the view) are all Islamic Art excavation records; excavation context is noted as a provenance question, unresolved.
- **Not covered:** the Met's own published policy on human remains or cultural property (not looked up in this pass). The keyword screen will also miss items whose sensitivity is not in their text. Indigenous material from Africa, Oceania and the Americas is absent from the typed subset, so it is not assessed here; that absence is itself a representational limitation.

### Rights (official evidence)
- Policy page (https://www.metmuseum.org/policies/image-resources, no date shown): collection data CC0; usable for any purpose, including commercial, without permission. Images are separate (CC0 only for public-domain works), and they are not in the dataset.
- Repo README + LICENSE at the pinned commit: the Met has waived all copyright and related rights under CC0 1.0 for unrestricted commercial and non-commercial use; it asks users to *consider* attribution.
- GPT verified the same two sources.
- **REGISTER:** Chad pasted the policy page on 7 Nov 2026 and the two operative sentences are filed verbatim (✅). The page also says the CSV is updated weekly, so any use pins a commit and hash.
- Media: excluded. Metadata only; nothing fetched.

### Arts requirement table (after recovery)
| Requirement | State |
|---|---|
| Reuse rights | **Cleared** (data). CC0, commercial use, no permission needed. Operative sentences pasted by Chad and filed verbatim in REGISTER.md, 7 Nov 2026. GPT verified the same sources. |
| Media | **Excluded** (metadata-only proof of concept) |
| Geography, country view | **Meets the numbers with uncertainty retained.** Certain/aligned/ISO-validated: 1,454 records, 27 countries, Egypt 57%. Created/found only: 641 records, 27 countries, USA 37%. GPT/Chad to choose which relationship set the view uses. |
| Geography, marker view | Not assessed (no geocoding this pass) |
| Sensitive material | **Unresolved.** Candidates flagged and excluded (159 / 2,000); no agreed review rule; Met policy not consulted; screen recall unknown |
| Access, caching, retention | **Met** for a pinned static file under CC0 |
| Identifiers | Met Object ID 100%; Met-supplied Wikidata URL 1,080 / 2,000 (54%), unverified; public domain flag 1,320 / 2,000 |
| Representation | Typed geography covers five departments only; Africa, Oceania and the Americas are absent from any typed view |

---

## B. Planet baseline (replacement measurements)

### Recovery
- **Originals:** not recoverable. The per-run objects from 7 Nov ~08:25–08:30 UTC were never saved outside that workspace; only the summary survives. The new measurements below are **dated replacements**. They are not comparable to the originals without care: same pane and page, but the viewport of the originals is unknown.

### Conditions (from the runs themselves)
- **Page:** main, assets `?v=202611131000`, globe.gl 2.45.0 (unpkg). **Hub 0.6.0** (read at the end of each run).
- **Browser:** Claude desktop app 4.23118.0 built-in pane, Chromium 152.0.7977.167; macOS 26.5.2, arm (Apple silicon); 8 logical cores.
- **Viewport 588 × 834, DPR 2.** This is below the page's 720 px breakpoint, so **all three runs rendered the phone layout**, not the desktop layout.
- **Pane visible** (Chad brought it forward); the Claude window was not focused.
- **Network:** home connection, no throttling. The browser's own estimate (3g, rtt 300–400 ms, 0.35 Mbps) is Chromium's coarse NetInfo value, **not a measurement**. Observed hub requests took ~0.25–0.7 s each.
- **Cache:** persistent pane profile, which can't be cleared from here.

### Method
Each run: navigate to `?baseline=recN`; wait until 12 s after navigation start; then read:
- Navigation / Resource / Paint timing;
- buffered `largest-contentful-paint` and `longtask` entries;
- 120 animation-frame intervals;
- the hub version.

Resource state is classified as:
- **network:** transferSize > 0;
- **cache:** transfer 0 and decoded > 0;
- **opaque:** cross-origin without Timing-Allow-Origin, where the browser hides size and cache state.

**No size estimates are made.**

### Results
| | rec1 12:21:03 UTC | rec2 12:21:36 | rec3 12:22:03 |
|---|---|---|---|
| Cache situation | first load this session | reload | reload |
| HTML received | 468 ms | 506 ms | 87 ms |
| First (contentful) paint | 960 ms | 640 ms | 176 ms |
| LCP | 960 ms | 640 ms | 176 ms |
| Hub requests (11, sequential) | 969 → 8,041 ms | 592 → 4,696 ms | 148 → 3,776 ms |
| GIBS backdrop done | 4,441 ms | 2,958 ms | 2,610 ms |
| Long tasks (after FCP) | 10 (8) | 5 (5) | 5 (5) |
| Blocking time after FCP (Σ long-task time > 50 ms) | 1,088 ms | 1,167 ms | 1,147 ms |
| Last long task ends | 8,874 ms | 5,524 ms | 4,608 ms |
| Frame interval, median / p95 / max | 34.9 / 35.7 / 36.2 ms | 35.4 / 36.3 / 37.6 | 35.6 / 36.3 / 37.4 |
| Resources: network / cache / opaque | 3 / 1 / 13 | 1 / 7 / 13 | 1 / 7 / 13 |
| Measured transfer (visible resources only) | 68,683 B | 34,298 B | 34,298 B |

**Measured vs not measured:**
- **Measured transfer** is only what the browser exposes: HTML 34,298 B; style.css 7,271 B and app.js 27,114 B in rec1 (cache afterwards); fonts.
- **Not measured:** the 13 opaque resources (globe.gl, the GIBS image and all 11 hub responses). Their sizes and cache state are hidden, because the hub and those hosts send no Timing-Allow-Origin. A hub header would fix that, but it is a hub change and not done.
- The original ~1.6 MB / 6.7 MB figure was partly estimated by refetching. It is **not** reproduced here.

**Paint vs frames vs interactivity:**
- Paint is first/contentful/largest paint.
- Frames are the animation interval of the idle running globe: ≈ 35 ms, ≈ 28 fps, at 588 px and DPR 2.
- **Interactivity was not measured directly** (no input was simulated). The long-task data are a proxy only: the main thread has about 1.1 s of blocking work after first paint, and its last long task ends at 4.6–8.9 s, roughly with the last hub layer.

**Cold load: NOT demonstrated.**
- rec1 was the first load of this page URL in the session, but it was not cold: Google Fonts CSS came from cache, and globe.gl (opaque) took 52 ms, consistent with a cache hit.
- The pane's cache can't be cleared from here.
- A demonstrated cold load needs a fresh browser profile, or Chad clearing site data, with proof from transferSize on every visible resource.

### Planet: what stands
- **Preliminary, desktop-pane, warm-cache, phone-layout-at-588-px observations,** three consistent runs.
- **Pending:**
  - a desktop-width run (≥ 1,101 px; needs the pane widened or a different window);
  - a demonstrated cold load;
  - iPhone runs (Chad);
  - real input latency;
  - opaque resource sizes (would need Timing-Allow-Origin, a hub/host change).

---

## Deviations (this pass)
- Original Arts and Planet outputs unrecoverable; replacements are labelled as new evidence.
- Arts R1 uses a new subset definition (59,137) and new rules (attributed kept separate; pipe alignment). It is not comparable record-for-record with the lost sample B.
- The Planet runs rendered the phone layout because of the pane's width. The originals' viewport is unknown.
- Earlier (carried): two Arts samples where one was planned; earlier Mac-shell use (Life); none in this pass.

## Remaining gaps
- ~~Chad's REGISTER paste (Met)~~ filed 7 Nov.
- An agreed sensitive-material review rule; the Met's own human-remains / cultural-property policy (not consulted); keyword-screen recall.
- Choice of relationship set for the country view ("From" in or out).
- Representation gap: no typed geography outside five departments.
- Planet: desktop-width run, demonstrated cold load, iPhone, input latency, opaque sizes.

## Recommendation
- **Arts: INCONCLUSIVE, but narrowed.** Rights are documented, and a validated, uncertainty-preserving country view meets the numbers. That holds most cleanly for created/found only: 641 records, 27 countries, no country above 38%.
  - Rights are now cleared (REGISTER filed 7 Nov). *(Superseded by the review update at the top: what remains is an agreed sensitive-material rule **and** validation that the retained subset follows it, plus validation of the retained place relationships.)*
  - The representation gap (five departments) should be stated with any view, not hidden.
- **Planet:** usable only as a preliminary desktop-pane reference. Phase A's iPhone checks still have no baseline.
- Neither recovery nor a cleared gate selects Arts or authorises a prototype. That stays with Chad.
