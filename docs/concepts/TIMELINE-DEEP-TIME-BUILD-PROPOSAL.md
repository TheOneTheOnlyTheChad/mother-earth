# Timeline — deep-time axis, first release: BUILD PROPOSAL (rev 1)

**Rev 1, 10 Nov 2026 (docs only).** Nothing is built, uploaded, deployed or filed. Every step in §10 needs its own Approve line.

**Built on:** the concept `TIMELINE-DEEP-TIME-PROPOSAL.md` (rev 1.3, Chad's decisions D1–D7: hub catalogue ends the T1 exception; Big Five first; four lanes shown; no percentage-loss figures; cosmos later; source check done) and the source check `docs/research/TIMELINE-BIG-FIVE-SOURCE-CHECK.md` (rev 2, after GPT's two reviews).

## 0. Inputs carried forward (GPT, 10 Nov)
| Entry | What the release may show | Source |
|---|---|---|
| Chart | period bands and boundary markers; window 538.8 ± 0.6 Ma → 0; overview 4567 Ma → 0 | ICS chart, tag `v2026-06.5` = `44d1043ecf29`, `chart.ttl` sha256 `0158959e…b355` (CC BY 4.0) |
| E2 Frasnian–Famennian extinction (Late Devonian) | **boundary-age evidence**: boundary no older than 372.4 Ma; modelled 371.93–371.78 Ma with its assumptions; extinction duration **unset**; Hangenberg out of scope | Percival et al. 2018 (CC BY 4.0) |
| E3 end-Permian | **estimated extinction onset 251.941 ± 0.037 Ma**; Dai 2025's revised boundary age and Herz 2026's untraced secondary estimate kept **separate** as context | Burgess, Muirhead, Bowring 2017 (CC BY 4.0) |
| E4 end-Triassic | approximate ~201.5 Ma for the horizon; other approximations differ | He et al. 2020 (CC BY 4.0) |
| E5 end-Cretaceous | **impact age 66.02 Ma**; extinction placement **tied to it** through the cited synchrony evidence; causes off this slice | Wilf et al. 2023; O'Connor et al. 2024 (both CC BY 4.0) |
| E1 end-Ordovician | **provisional — off the release axis** until the Oxford publisher page is checked; ~445–443 Ma interval and the attributed pulse models are ready to go on once it is | Harper 2024 (CC BY 4.0) |
| Pliny | stays on the "Dates without a year" shelf; link `#e-pliny-ep-6-16` stable | as live |

Publisher pages checked: Percival, Burgess 2017, Wilf (Claude); He, O'Connor (GPT). Open: Harper (security challenge to both).

## 1. What visitors get in this release
- **Overview strip:** Earth's whole span, 4567 Ma → today, as one thin bar with a marked window. Labelled **"Overview"**.
- **Explorable window:** 538.8 Ma → today (the Phanerozoic), labelled **"This release: the last 538.8 million years"**, with the chart's period bands across the top.
- **Four lanes** (D5):
  - **Mass extinctions** (active): E2, E3, E4, E5 — plus E1 only if its check completes before the branch build (decision B1).
  - **Earth systems and life · No entries yet**
  - **Human relatives · No entries yet**
  - **Human history · No dated entries on the axis yet**
- **Coverage note** (one line, always visible): "This release shows four of the five largest mass extinctions [or "the five", per B1], placed on the ICS chart. Empty stretches are not periods where nothing happened. Lanes fill as their evidence is checked."
- **Pliny shelf** unchanged below the axis.
- **Opening an episode:** the existing panel (desktop) / sheet (phone), Back closes, focus returns to the mark.

### 1a. Wireframes
Phone (390 × 844):
```
[ Earth now | Timeline ]                         header (94 px, as live)
Overview  4567 ───────────────────[■]── 0 Ma
This release: the last 538.8 million years
| band | band | band | … |   period bands (chart short codes on phone, names on focus/tap)
Mass extinctions   ·    ◇         ●       ~●        ▲
                        F–F      P–T     T–J       K–Pg
Earth systems and life · No entries yet          ┐
Human relatives · No entries yet                 ├ ≤ 96 px together
Human history · No dated entries on the axis yet ┘
538.8 Ma ─────────────────────────────── 0
Coverage note …
Dates without a year — Pliny card (as live)
```
Desktop (1280): the same, lanes full width; period names written out; the panel opens on the right.

## 2. How each shape is drawn (§11b)
| Shape | Axis mark | List / panel wording |
|---|---|---|
| Measured point ± uncertainty (E3) | solid dot; whisker for the stated uncertainty, drawn only if ≥ 1 px (at 390 px, 1 px ≈ 1.5 Myr, so E3's ± 0.037 Myr is not drawn and the panel says so) | "251.941 ± 0.037 Ma (onset; uncertainty as stated by the source)" |
| Approximate point (E4) | hollow dot, "~" in the label | "~201.5 Ma (approximate, as stated); other sources give ~201.3 and ~201" |
| Point, uncertainty not stated (E5) | solid dot, no whisker | "Impact 66.02 Ma (uncertainty not stated by the source); extinction placed at the impact — synchrony per O'Connor et al. 2024" |
| One-sided bound (E2) | open-ended bar from 372.4 Ma toward the present, fading out, **never closed** | "Boundary no older than 372.4 Ma" |
| Modelled interval (E2) | hatched bar 371.93–371.78 Ma (drawn as one mark at phone scale), labelled "modelled" | "Modelled boundary age 371.93–371.78 Ma, assuming …" (the source's three assumptions) |
| Approximate interval (E1, when admitted) | soft-edged bar, "~" | "~445–443 Ma; the source describes three models: two pulses, a single phase, or an additional earlier phase" |
| Pulses | **fixture only** in this release (no numerically dated pulses found) | — |
| Partial date (Pliny) | never on the axis | shelf, as live |
| Chart boundary | thin line in the band row | "ICS boundary 251.902 ± 0.024 Ma (chart v2026-06)", shown **beside** the source's value, never merged |

Rules: no time position is shifted for room (overlaps cluster into a count marker that opens a list); uncertainty (whisker) and duration (bar) never share a style; an unknown bound stays open; the uncertainty's meaning is carried ("2σ", "as stated", or "not stated").

## 3. Catalogue file (one versioned JSON, the single source for the axis and the no-JS list)
```
{
  "catalogue": "timeline", "catalogue_revision": "tl-2026-11-R1", "generated_at": "<pinned>",
  "chart": { "name": "ICS International Chronostratigraphic Chart", "tag": "v2026-06.5", "commit": "44d1043ecf29…",
             "file_sha256": "0158959e…b355", "licence": "CC BY 4.0", "citation": "<as on the chart page>",
             "window": {"from_ma": 538.8, "pm": 0.6}, "overview": {"from_ma": 4567},
             "periods": [ {"name": "Cambrian", "code": "<chart ccgmShortCode>", "from_ma": …, "to_ma": …, "pm": …}, … ] },
  "lanes": [ {"id": "earth-life", "label": "Earth systems and life"}, {"id": "extinctions", …}, {"id": "relatives", …}, {"id": "history", …} ],
  "entries": [ {
    "id": "e-big5-end-permian", "lane": "extinctions", "title": "End-Permian mass extinction", "axis": true,
    "claims": [ { "kind": "timing", "what": "onset of the mass extinction",
                  "when": {"type": "measured_age", "value": 251.941, "units": "Ma", "uncertainty": 0.037, "uncertainty_meaning": "as stated", "approximate": false},
                  "source": {"citation": "Burgess, Muirhead, Bowring (2017) Nat Commun 8: 164", "doi": "10.1038/s41467-017-00083-9", "licence": "CC BY 4.0",
                             "locator": "section 'A relative timing framework' (Europe PMC XML paragraph 8)", "status": "no notices (publisher page, 10 Nov 2026)", "checked": "2026-11-10"} },
                { "kind": "chart_boundary", "boundary": "Permian–Triassic", "when": {"type": "boundary_age", "value": 251.902, "pm": 0.024, "units": "Ma"} },
                { "kind": "context", "text": "Newer estimates differ: …", "source": {…} } ],
    "revisions": [] }, … ],
  "shelf": [ { "id": "e-pliny-ep-6-16", "lane": "history", "when": {"type": "partial_date", …}, … } ]
}
```
- Generated by `phase1/timeline/build_timeline.py` (extended) from per-entry source files in `phase1/timeline/` plus the retained chart file; `--generated-at` pins the bytes; `--check` verifies `timeline.html` matches.
- **Wording from sources is paraphrased** with citation; any quoted wording is short and attributed (CC BY: credit, licence link, changes indicated — the page says values are reformatted).
- Each change bumps `catalogue_revision` and appends to the entry's `revisions` (previous value, what changed, why, source revision).

## 4. Hub and page (Arts pattern; ends the T1 exception)
- **Route** `GET /catalogue/timeline` (hub **0.6.3**): serves `ref/timeline/<revision>.json` from R2 only if the whole stored file's sha256 equals the pinned `TIMELINE.fileSha256`; else **503 unavailable**. Outside LAYERS, cron, D1, health and history. `Cache-Control: public, max-age=60`, ETag = file hash. Listed under `catalogues` on `GET /`.
- **Previous catalogues are never deleted** from R2 (`ref/` has no lifecycle rule); rollback = re-pin.
- **Page:** `timeline.html` carries the pre-rendered list (no-JS) and `data-catalogue-sha` for the same revision. `timeline.js` fetches the catalogue (no-store), checks the hash, and draws the axis only on a match.
- **START-HERE §2** T1 line is replaced at release by "Timeline entries are served by the hub catalogue route".

### 4a. Version mismatch and failure (tested)
| Situation | Visitor sees |
|---|---|
| New page + new hub | axis + list |
| Old page (Pliny-only) + new hub | the old page, unchanged (it never fetches) |
| New page + old hub (0.6.2: route 404) | list only + "The timeline axis is unavailable right now; every entry, date and source is listed below." |
| New page + hub serving a different revision (deploy/rollback window) | the same list-only message; **dates from two revisions are never mixed** |
| Hub down / 503 | the same list-only message |
Release order makes the "new page + old hub" case impossible in normal operation (hub first); rollback goes page first, so it is also avoided.

## 5. Tests (all with break checks)
- **timeline-catalogue (hub):** exact bytes served; wrong hash / missing / unreadable / invalid → 503; route outside LAYERS/cron/health/history; `/` lists it. Breaks: serve-on-mismatch, records-only hash, missing-503.
- **timeline-ui (extended from the 584-check suite):** every shape in §2 renders distinctly (fixtures include a pulses entry, an approximate interval, a one-sided bound, a no-uncertainty point); Pliny never on the axis; chart vs source values both visible in the panel; keyboard reaches every mark; **empty lanes add zero Tab stops and use ≤ 96 CSS px together at 390 × 844 at default text size**, wrapping without clipping at 200 % text; no horizontal overflow at 360/390/430/1280; no-JS list carries every entry, date and source; mismatch, 404 and 503 all fall back to the list; Back/Forward/focus as today.
- **Reruns:** desktop-overflow, mobile-pass, all 35 regression suites.

## 6. Sources and REGISTER (before release)
- **E1:** the Oxford publisher page read (Chad in his own browser, or GPT) → admitted to the axis; otherwise E1 stays out and the coverage note says four of five (B1).
- **File REGISTER entries** (Chad's line): ICS chart (CC BY 4.0, tag v2026-06.5, citation as on the chart page); Percival 2018, Burgess 2017, He 2020, Wilf 2023, O'Connor 2024, and Harper 2024 if admitted (each CC BY 4.0).
- **Credits on the page:** chart citation + "CC BY 4.0"; each entry's citation in its panel and in the list; "values reformatted by Mother Earth".

## 7. Cost (R2 read 10 Nov 2026, 04:08:55 UTC; analytics, not an invoice)
- Billing period 30 Oct 11:09:40 → 30 Nov 00:00 UTC (R2 Paid, $0 base), 10.708 days elapsed.
- Usage so far: storage daily peak max 0.877 GB (decimal; mean of daily peaks 0.692 GB); **Class A 26,777** (PutObject 25,425, ListObjects 1,299, others 53); **Class B 38,550** (GetObject 34,388, HeadObject 4,007, others 155); unclassified 18; free 85.
- Linear projection to period end: Class A ~76,400 (**~7.6 %** of 1 M, counting the 18 unknown as A); Class B ~110,000 (**~1.1 %** of 10 M); storage well under 10 GB-month.
- This release adds: one PutObject per catalogue revision (Class A), one GetObject per timeline page load that reaches the hub (Class B), and a catalogue file of a few tens of KB (to be measured at build).
- **Expected R2 increment $0.00 — an estimate, conditional on total account usage staying inside the allowances.** Above an allowance, each crossed million is billed whole ($4.50 A / $0.36 B).

## 8. What this release does not include
Cosmos view; the Earth-systems, relatives and history lanes' entries; percentage-loss figures; causes; numerically placed pulses; the Hangenberg event; any change to the globe page.

## 9. Rollback
Page first: revert the page merge (the old Pliny-only page needs no hub route). Then, if wanted, redeploy hub 0.6.2 (`4b5b6aa3…`). The R2 catalogue object stays (no public effect without the route). Each its own Approve line.

## 10. Steps and Approve lines
1. GPT reviews this proposal → Chad's B-decisions (§11).
2. `Approve: build timeline-deep-rc on a branch only — catalogue generator, hub 0.6.3 route, page axis per TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1; no merge, R2 write, hub deploy or page change.`
3. GPT reviews the candidate (smoke test from a hash-checked `_review/` copy, as before).
4. `Approve: file the timeline REGISTER entries (ICS chart + the episode sources)`.
5. `Approve: upload ref/timeline/<revision>.json (file sha256 …) to R2` → `Approve: deploy hub 0.6.3 from <commit> (content only)` → live RC check → `Approve: push timeline-deep-rc to main (page change: deep-time axis, T1 exception ends)`.

## 11. Decisions for Chad
- **B1** E1: admit to the axis only if the Oxford page is read before the branch build; otherwise ship four of five with the note. *Recommended.*
- **B2** Period labels on phone: the chart's own short codes (`skos:notation`, e.g. "S" for Silurian, "T" for Triassic) with the full name on focus/tap. *Recommended* (names don't fit at 390 px).
- **B3** Catalogue fetch `no-store` (as Arts) for strict revision consistency. *Recommended;* cost negligible (§7).
- **B4** Hub version 0.6.3 and route name `/catalogue/timeline`. *Recommended.*
- **B5** Pliny moves into the catalogue's `shelf` (rendered as today). *Recommended* — one source of truth.
- **B6** Branch name `timeline-deep-rc`. *Recommended.*
