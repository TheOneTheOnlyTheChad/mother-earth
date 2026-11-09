# Arts (the Met) — proposal to put the cleared scope on the live site (rev 2.1, 9 Nov 2026)

**Status: proposal only, for Chad's decisions.** Rev 2 applies GPT's review of rev 1 (9 Nov; GPT supports the direction; no accepted gate restarted). Arts remains **unselected**. Nothing here starts a prototype, Phase A, implementation, branch, R2 write, deploy or page change. Built from accepted evidence (`P0-CHECKPOINT.md`, `P0-arts-planet-recovery.md`, `P0-RECOMMENDATION-DRAFT.md` rev 3, `REGISTER.md` Met entry, `docs/research/p0-recovery/arts/`). The only new figures are local measurements of the existing object file (§4.2).

**Rev 2.1 (GPT's review of rev 2; docs-only amendment):** records integrity separated from whole-file integrity (§4.1, §7, §8); accessibility checks described as what they verify (§7); compressed size labelled with its tool and GPT's differing figure recorded (§4.2); every expanded object visibly carries the sensitivity warning (§4.2, §7). GPT supports rev 2 as the basis for a branch-only build subject to these fixes.

**Rev 2 changes (GPT):** sampling stages described accurately (§1, card wording); source date kept apart from processing dates (§1.1); the approval boundary made explicit (D1, D2); performance and cost claims corrected, with the exact projection and its hash (§4); a fixed-snapshot serving contract (§4.1); keyboard and screen-reader checks (§7); rollback made dependency-aware (§8); alternatives described neutrally (§2).

## 1. What is already cleared (accepted 7 Nov 2026, Chad after GPT) — unchanged
- **Scope:** a metadata-only view of the Met's catalogued places of making (`created_at`), mapped to present-day countries. **Media excluded.**
- **Rights:** collection data CC0 1.0; commercial use yes; attribution not required (the README asks users to consider citing). REGISTER filed 7 Nov from Chad's paste.
- **Counts:** **479 distinct objects across 25 present-day countries**, meeting ≥ 300 / ≥ 20.
- **Clearance is research-gate clearance, not release readiness**, and not independent verification of every object. Existing sensitivity acceptance stands.

### 1.1 Dates (kept separate)
| What | Date | Record |
|---|---|---|
| Source CSV pinned | **2 Nov 2026**, Met Open Access commit `e394878`, LFS sha256 `7adc37e4…d0fe` | `arts/SOURCE.md` |
| Sample R1 drawn | 7 Nov 2026 (committed 12:19:57 UTC, `bf617f2`) | `met-recovery-sample-R1.json` |
| Classification v2 | 7 Nov 2026 (committed 12:47:52 UTC, `fd29415`) | `met-R1-assignments-v2.json` |
| Final filtered view (479) | 7 Nov 2026 (first committed 12:53:56 UTC `d39ba56`, last revised 12:57:09 UTC `fff52a0`) | `final-view-objects.json`, sha256 `d682cb96…88bc5` |
| Clearance accepted | 7 Nov 2026 (Chad, after GPT) | `P0-CHECKPOINT.md` |
| Published file | **not yet generated**; its generation time is recorded when it is built | — |

The page says "source CSV of 2 Nov 2026" for the catalogue and gives the processing date separately. It never implies the derived view was produced on 2 Nov.

### 1.2 Sampling stages
1. `MetObjects.csv` at `e394878`: 503,073 records.
2. Typed-geography subset (a Geography Type segment that maps to a relationship, plus a non-empty Country): **59,137 records across five departments** (Egyptian Art, Islamic Art, The American Wing, Medieval Art, The Cloisters).
3. Seeded random sample R1: **2,000 records** (`random.seed(20261107)`, `random.sample`).
4. Filtered `created_at` view (v2 rules; certain, aligned, ISO-resolved; superseded wording and "Country of Origin" excluded): **479 objects**, drawn from **four** of those departments (American Wing 326, Islamic Art 72, Medieval Art 43, Cloisters 38).

### 1.3 Limitations that travel with every use (all accepted; none may be dropped or softened)
| Area | Limitation |
|---|---|
| **Representativeness** | The 479 are what remains of a seeded 2,000-record sample. They do not represent the Met's whole collection or the world's art. Arts of Africa, Oceania and the Americas is an **excluded department, not an absence of those regions**. |
| **Concentration** | USA 239 (49.9%), France 47, UK 30, China 28, Iran 26, Germany 25, Egypt 19. Thin tail: 8 countries with one object (CAN, CZE, ECU, IRQ, JPN, MAR, PAK, UKR); 12 with ≤ 3. |
| **Geography meaning** | The Met's catalogued place of making, **mapped to present-day countries**: a location reference only, **not historical nationality**. "Country of Origin" is its own relationship, **outside** the view. Superseded wording never places an object. Source wording kept verbatim (e.g. "Made in", "Excavated in\|Minted in"). |
| **Verification** | Random page check: **0 / 27** reached pages disagree (95% interval for the error rate **0–12.5%**). **23 pages not reached: unverified, not passes.** The Met's catalogue, not independent historical verification; the Met says cataloguing is ongoing. |
| **Sensitivity** | Every object: **"sensitivity not fully assessed"**. None manually assessed; **11 tentative labels** (sacred/ritual 9, funerary 3, Indigenous source community 2; human remains 0) from keyword screens + 3 page findings; **unlabelled ≠ not sensitive** (the Yup'ik mask 717572 was found only by page check). Chad's decision, confined to this scope: **included with honest context**; not a claim about ownership legitimacy; source restrictions preserved. |
| **Source changes** | The Met's CSV is updated weekly; every figure is tied to `e394878`. |

## 2. Presentation
The page has **no geocoder and no country boundaries** (index.html search help). A country-level record has no inherent point on a globe.

| Option | What it is | New dependencies | Precision |
|---|---|---|---|
| **A (recommended)** | One **optional card, off on load**, in the Optional layers group. Switched on, it loads the snapshot and shows a **list by present-day country** (25 rows with counts); each row expands to its objects: object name, culture, department, the Met's wording + country verbatim, tentative labels where present, "sensitivity not fully assessed", and a link to the Met's object page. **Nothing drawn on the globe**, so "Key · N layers" does not count it. | none | no location implied |
| B | A plus one globe marker per country at a reference point | a reference-point dataset with its own provenance, REGISTER entry and review | a marker reads as a place; a "country reference point, not where the object was made" label mitigates but does not remove that |
| C | Country polygons shaded by count | a boundary dataset with explicit provenance and a stated handling of disputed boundaries; REGISTER entry | depends on the dataset's boundary choices, which must be disclosed |

B and C are not prohibited; each would be a separate later decision with its own source review. **No boundary work is requested.**

**Card wording (draft):**
- Value: "479 objects · 25 present-day countries".
- Caveat, always visible: "479 objects retained from a seeded 2,000-record sample of 59,137 Met records with typed geography. This filtered view draws from four departments; it does not represent the Met's whole collection or the world's art. The Met's catalogued place of making, mapped to present-day countries — not historical nationality. Sensitivity not fully assessed."
- Dates line: "Source: Met Open Access CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026."
- Details: the full §1.3 table, the concentration line, the 23 unverified pages.

**Evidence label (recommendation):** "Catalogued" — a record of what an institution states, dated. The page's labels are Observed / Computed; a catalogue record is neither. "Projected" stays reserved.

**Shared keys:** the Met's object ID per object; ISO 3166-1 alpha-3 per country. Wikidata IDs (the shared-key direction) are not looked up; adding them is separate work.

## 3. Fixed snapshot vs updating data
| | Fixed snapshot (recommended) | Updating (weekly CSV) |
|---|---|---|
| What is shown | exactly the 479 accepted objects, pinned to `e394878` | a re-run of the classification on each new CSV |
| Clearance | **covered by the accepted evidence** | **not covered**: each update changes the set the page check, counts and labels rest on |
| Work | one derived file, no job | a hub job on a 340 MB CSV (CPU/memory unmeasured), re-classification, change validation, monitoring |
| Cost | see §4.3 | unmeasured |

**Recommendation: fixed snapshot for the initial release.** Updating would be a separate later proposal.

## 4. Data, serving and cost
**Hosting (recommendation H1, constitution-consistent — "the hub is the product; the page is a client"):** the published file is stored once in R2 at `ref/arts/met-R1-e394878.json` and served by the hub at `GET /snapshot/arts`. H2, a static file beside the page on GitHub Pages, would need Chad's explicit exception to the constitution.

### 4.1 Serving contract (fixed snapshot)
- **Two hashes, two jobs:**
  - **`records_sha256`** = sha256 of the records bytes (§4.2 projection) = `067211d9…16cb2` (reproduced independently by GPT). It identifies *which 479 records* are published and is carried inside the file as `snapshot_id`.
  - **`file_sha256`** = sha256 of the **complete generated file** (envelope + provenance + dates + limitations + records), exactly as uploaded. It is known only once the file is generated at build time, is pinned then, and is what the hub validates and what the R2 upload approval names.
- **Body (`application/json`):** `{ kind: "catalogue_snapshot", layer: "arts", snapshot_id: "<records_sha256>", source: { name: "The Metropolitan Museum of Art Open Access", file: "MetObjects.csv", commit: "e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea", lfs_sha256: "7adc37e4…d0fe", source_date: "2026-11-02" }, view: { prepared: "2026-11-07", rules: "v2 created_at", final_view_sha256: "d682cb96…88bc5" }, published_file_generated_at: "<UTC at build>", sample: { population: 59137, sample_size: 2000, seed: 20261107, retained: 479, departments_retained: 4 }, counts: { objects: 479, countries: 25, by_country: [...] }, limitations: [ ...§1.3 as text ], record_fields: [...§4.2], records: [...] }`.
- **Integrity (hub, authoritative):** the hub holds the expected **`file_sha256`** and **`records_sha256`** as constants in its code. On each request it reads the stored object, checks the sha256 of **the complete stored bytes** against `file_sha256`, parses it, and checks `snapshot_id === records_sha256` (CPU for ≈125 KB to be measured). Any mismatch, a missing object or unparseable JSON → **HTTP 503** `{ kind: "catalogue_snapshot", layer: "arts", status: "unavailable", reason: "<missing|integrity|invalid>" }`, never a partial or empty list.
- **Consistency (page):** the page checks `snapshot_id` equals the expected `records_sha256` constant, `counts.objects === records.length` (479) and the per-country sums before rendering, else shows "unavailable — <reason>". The page does not re-hash: JavaScript and Python serialise non-ASCII text differently, so byte-level integrity stays with the hub.
- **Headers:** `ETag: "<file_sha256>"`; `Cache-Control` as the other `/snapshot/*` responses (to be read from `worker.js` at build).
- **Outside live-collector machinery:** no cron, no collector, no `collector_runs` rows, no freshness grade (`stale_after_s` absent), no `/status` collection or `/health/*` checks, no history archiving. The page labels it by its source and preparation dates, **never by retrieval or serving time**: fetching it again never makes the catalogue appear newer.

### 4.2 Published-field projection (reproducible)
Records = for each object of `final-view-objects.json` in file order, the keys `object_id, object_name, culture, department, met_wording, met_country, countries, tentative_labels, link` in that order; `json.dumps(list, separators=(',',':'))` (Python 3.13 defaults, ASCII escaping), UTF-8.
- **Measured locally, 9 Nov 2026:** records bytes **122,227 B**, sha256 **`067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2`** — both reproduced independently by GPT, as was the object file's sha256 `d682cb96…88bc5`.
- **Compressed size depends on the tool:** Claude's figure **7,207 B** = Python 3.13.18 `gzip.compress(…, compresslevel=9, mtime=0)` in the workspace container; GPT's figure **7,159 B** with its own tool. The uncompressed bytes match. Neither is the served transfer size.
- The envelope adds a few KB. **Actual served transfer size is not measured**; it depends on the hub's response compression and is measured at the live RC check.
- Every object also carries "sensitivity not fully assessed" and the unlabelled note; in the published file these are stated once in `limitations` and applied to every record by the page, rather than repeated 479 times. **GPT accepts this provided every expanded object visibly carries the warning** (checked in §7).

### 4.3 Performance and cost (corrected)
- **Off on load = no Arts snapshot fetch.** Page code and markup still change (card, list renderer, Sources section), so cold-load bytes and timing **will change**, by an amount to be measured. The 7 Nov baseline (1,500,912 B) is historical (pre-NOAA-21) and is not the comparison for this release; a fresh before/after measurement is part of §7.
- **R2:** one object (~125 KB) plus reads when viewers switch the card on. R2 has its own billing allowances, separate from Workers Paid; **whether this stays inside them is not established here** and is checked against Cloudflare's R2 pricing and the account's billing view before the R2 upload is approved. Expected small, not assumed free.
- **Workers:** one extra route; request and CPU usage measured after release.

## 5. Decisions (Chad) — compact list
| # | Decision | Recommendation (GPT supports; not yet decided) |
|---|---|---|
| **D1** | **Authorise a scoped public Arts feature:** the fixed Met snapshot card described here, and nothing wider. It is a public Arts feature even though domain selection stays separate. The standing decision (no prototype, no Phase A, no domain selection without a separate decision) **remains in force for everything else**; this authorises one bounded exception for this card only. | authorise, with that wording |
| **D2** | Accept the §1.3 limitations as **disclosed, not resolved**. Release readiness is established separately by the §7 engineering checks; disclosure alone does not establish it. Extra evidence work (e.g. the 23 unreached pages, a manual pass of the 11 labelled objects) would be new bounded work with its own go. | accept; no extra evidence work for release 1 |
| **D3** | Evidence label "Catalogued" | yes |
| **D4** | Presentation A / B / C | A |
| **D5** | Fixed snapshot / updating | fixed snapshot |
| **D6** | Hosting H1 (hub) / H2 (static, constitution exception) | H1 |
| **D7** | Credit line (not required): "Collection data: The Metropolitan Museum of Art Open Access (CC0), source CSV of 2 Nov 2026 (commit e394878)", in the footer credits and Sources | include |
| **D8** | Links to the Met's object pages (the Met's site shows images there; nothing loads on ours) | keep |

## 6. Implementation steps (only after D1–D8 and the build go; listed, not started)
1. Branch `arts-met-rc` from main.
2. Script derives the published file from `final-view-objects.json` (§4.2 projection + §4.1 envelope); re-running gives identical record bytes and the same `snapshot_id`. The complete file is generated **once**; its generation time and `file_sha256` are recorded and pinned in the hub code and the R2 approval line (a later regeneration would carry a new time and so a new `file_sha256`, and would need re-pinning).
3. Hub: `arts` route per §4.1; `COLLECTOR_VERSION` bump; no cron or collector change.
4. Page: card, accessible country list, per-object rows, Sources `#arts`, "Catalogued" label, credit line; `?v=` bump.
5. Tests per §7, each with a break that bites.
6. GPT review of the branch.
7. Production, in the order of §8, each step on its own Approve line.
8. REGISTER Met entry status → "on the page (fixed snapshot)" at release.

## 7. Release checks (engineering; required in addition to the disclosed limitations)
**Data:** 479 objects, 25 countries, per-country counts = `final-view-results.json`; record bytes sha = `067211d9…16cb2`; every record has verbatim Met wording + country, department, link; the 11 tentative labels present and named as tentative; no object placed through "Country of Origin" or superseded wording; no field implies a coordinate.
**Hub:** `/snapshot/arts` returns the stored file byte-for-byte (sha256 = `file_sha256`) with `ETag` = `file_sha256`; the parsed `snapshot_id` = `records_sha256`; a missing object, an unparseable object, a whole-file hash mismatch (e.g. one byte changed in a limitation or a date, records untouched) and a records mismatch each give 503 with the right reason (tested against a fake R2); no `collector_runs`, `/status` collection, health or history entries for `arts`; all existing hub suites pass; health 8/8 unchanged after deploy.
**Page:** off on load (no `/snapshot/arts` request until switched on); on → loads once, list renders, counts match; off → cleared; 503 or failed fetch → "unavailable — <reason>", never a zero or an empty list; integrity mismatch refused; **no request to any Met image host**; dates shown as source + preparation, never retrieval; every §1.3 limitation reachable from the card; no wording that a country without objects has no art; **every expanded object row visibly shows "sensitivity not fully assessed"** (and its tentative labels where present).
**Accessibility:** every country row is a `button` with an accessible name, and `aria-expanded` flips on expand/collapse; `aria-controls` points at its object list; Enter and Space toggle; Tab order follows the list; focus stays on the row after toggling. These are checked in the **accessibility tree** (Playwright, container), which verifies **names, roles, expanded states and relationships — not what a screen reader actually announces**. Actual announcement stays **unverified** unless tested with a screen reader; the VoiceOver check on the iPhone remains **optional**, Chad's choice.
**Layout:** desktop-overflow, mobile-pass and all existing UI suites pass; no page overflow at 360/390/1280 in the pane.
**Measurements:** cold-load before/after (fresh profile, same method as 7 Nov) and actual served transfer size of `/snapshot/arts`.
**Actual phone (iPhone Safari, Chad; no Galaxy):** card toggles on/off by touch; list scrolls and expands without page overflow; caveat lines readable without zoom; a Met link opens and returns; nothing on the globe changes. Can share a sitting with the outstanding Phase 0 iPhone runs. Pane checks supplement, never replace, it.
**Cost:** Worker requests/CPU and R2 operations for `arts` read from the dashboard 24 h after release.

## 8. Production order, rollback and approval wording
**Release order:** R2 upload → hub deploy → live RC check against the deployed hub → page release. The page goes last so it never points at a route or file that isn't there.

| Step | Approve line (sent only when that step is reached) |
|---|---|
| R2 object | `Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 <file_sha256>) to R2` |
| Hub | `Approve: deploy hub <version> from <commit> (content only)` |
| Page | `Approve: push arts-met-rc to main (page change: Met catalogue sample card)` |

**Rollback is dependency-aware:**
- **Page first, alone:** reverting the page merge is independent; the hub route and R2 object can stay.
- **Hub route or R2 object while the card is still published:** the card shows "unavailable — <reason>" (§4.1), never stale or partial data. So remove them only after the page revert, or accept that unavailable state for the interval.
- **Hub rollback target:** the version live **immediately before** the Arts deploy, read and pinned (version + sha256) at release time, not assumed to be 0.6.1.
- Each rollback step has its own Approve line.

**Next approval — exact bounded wording (send only if you accept the recommendations):**
`Approve: Arts scoped feature per the Arts release proposal rev 2.1 — D1 authorise the fixed Met snapshot card only (one bounded exception; no domain selection, prototype or Phase A otherwise); D2–D8 as recommended; build arts-met-rc on a branch only — no merge, R2 write, hub deploy or page change.`
To change any decision, name it in the line (e.g. "D6 H2").

## 9. Unchanged
Arts unselected beyond what D1 would authorise. Life stopped. GIBS bench closed, no shadow record. Aircraft reopened only for bounded terms/access and feeder clarification. The inspiration list stays separate from the research backlog. All accepted reviews and approvals stand.
