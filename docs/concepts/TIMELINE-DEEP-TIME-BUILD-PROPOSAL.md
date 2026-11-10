# Timeline — deep-time axis, first release: BUILD PROPOSAL (rev 1)

**Rev 1.1, 10 Nov 2026 (docs only), after GPT's review of rev 1** (relayed by Chad): mismatch/failure cases widened (§4a); E2 glyphs corrected (§2); claim types separated in the schema (§3); direct-link behaviour pinned (§4b); E1 publisher check **completed** (Chad read the Oxford page; no notice) — so the release carries **five** episodes, with GPT's four-episode freeze rule kept as the fallback (B1). GPT found B2–B6 sound (short codes checked against the retained ICS file). Nothing is built, uploaded, deployed or filed. Every step in §10 needs its own Approve line.

**Built on:** the concept `TIMELINE-DEEP-TIME-PROPOSAL.md` (rev 1.3, Chad's decisions D1–D7: hub catalogue ends the T1 exception; Big Five first; four lanes shown; no percentage-loss figures; cosmos later; source check done) and the source check `docs/research/TIMELINE-BIG-FIVE-SOURCE-CHECK.md` (rev 2, after GPT's two reviews).

## 0. Inputs carried forward (GPT, 10 Nov)
| Entry | What the release may show | Source |
|---|---|---|
| Chart | period bands and boundary markers; window 538.8 ± 0.6 Ma → 0; overview 4567 Ma → 0 | ICS chart, tag `v2026-06.5` = `44d1043ecf29`, `chart.ttl` sha256 `0158959e…b355` (CC BY 4.0) |
| E2 Frasnian–Famennian extinction (Late Devonian) | **boundary-age evidence**: boundary no older than 372.4 Ma; modelled 371.93–371.78 Ma with its assumptions; extinction duration **unset**; Hangenberg out of scope | Percival et al. 2018 (CC BY 4.0) |
| E3 end-Permian | **estimated extinction onset 251.941 ± 0.037 Ma**; Dai 2025's revised boundary age and Herz 2026's untraced secondary estimate kept **separate** as context | Burgess, Muirhead, Bowring 2017 (CC BY 4.0) |
| E4 end-Triassic | approximate ~201.5 Ma for the horizon; other approximations differ | He et al. 2020 (CC BY 4.0) |
| E5 end-Cretaceous | **impact age 66.02 Ma**; extinction placement **tied to it** through the cited synchrony evidence; causes off this slice | Wilf et al. 2023; O'Connor et al. 2024 (both CC BY 4.0) |
| E1 end-Ordovician | ~445–443 Ma approximate interval; the source's three models (two pulses / single phase / earlier Katian phase) as attributed text; pulses fixture-only | Harper 2024 (CC BY 4.0). **Publisher page checked 10 Nov** (Chad's paste of the Oxford page, sha256 `fab9abba…0bbb`: no correction/retraction/EoC text; CC BY 4.0) |
| Pliny | stays on the "Dates without a year" shelf; link `#e-pliny-ep-6-16` stable | as live |

Publisher pages checked: Percival, Burgess 2017, Wilf (Claude); He, O'Connor (GPT); Harper (Chad, in his own browser; paste checked by Claude). None open.

## 1. What visitors get in this release
- **Overview strip:** Earth's whole span, 4567 Ma → today, as one thin bar with a marked window. Labelled **"Overview"**.
- **Explorable window:** 538.8 Ma → today (the Phanerozoic), labelled **"This release: the last 538.8 million years"**, with the chart's period bands across the top.
- **Four lanes** (D5):
  - **Mass extinctions** (active): E1–E5 (B1: E1's check is complete).
  - **Earth systems and life · No entries yet**
  - **Human relatives · No entries yet**
  - **Human history · No dated entries on the axis yet**
- **Coverage note** (one line, always visible): "This release shows the conventional Big Five mass extinctions, placed on the ICS chart. Empty stretches are not periods where nothing happened. Lanes fill as their evidence is checked." (Fallback if E1 were withdrawn before build: "four of the conventional Big Five", with E1 excluded from both the catalogue and the pre-rendered list.)
- **Pliny shelf** unchanged below the axis.
- **Opening an episode:** the existing panel (desktop) / sheet (phone), Back closes, focus returns to the mark.

### 1a. Wireframes
Phone (390 × 844):
```
[ Earth now | Timeline ]                         header (94 px, as live)
Overview  4567 ───────────────────[■]── 0 Ma
This release: the last 538.8 million years
| band | band | band | … |   period bands (chart short codes on phone, names on focus/tap)
Mass extinctions  ~▬    ◆|◁       ●       ○~        ●
                  O–S    F–F      P–T     T–J       K–Pg
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
| One-sided bound (E2) | **directional marker at the bound** (a short tick at 372.4 Ma with an arrowhead pointing toward younger ages) — not a bar, so it cannot read as an event continuing through time | "Boundary no older than 372.4 Ma" |
| Modelled boundary-age range (E2) | a **distinct "modelled range" glyph (◆) at the midpoint** 371.86 Ma: 0.15 Myr is ~0.1 CSS px at this scale. True endpoints are drawn only when a zoom makes the range ≥ 4 CSS px wide (no zoom in this release, so always the glyph) | accessible label and panel: "Modelled boundary-age range 371.93–371.78 Ma (Percival et al. 2018), assuming the cited age model is correct, the section is stratigraphically complete, and constant sedimentation between the Kellwasser horizons" |
| Approximate interval (E1) | soft-edged bar, "~" | "~445–443 Ma; the source describes three models: two pulses, a single phase, or an additional earlier phase" |
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
    "claims": [ { "kind": "timing", "claim_type": "extinction_onset_estimate", "what": "estimated onset of the mass extinction",
                  "when": {"type": "measured_age", "value": 251.941, "units": "Ma", "uncertainty": 0.037, "uncertainty_meaning": "as stated", "approximate": false},
                  "source": {"citation": "Burgess, Muirhead, Bowring (2017) Nat Commun 8: 164", "doi": "10.1038/s41467-017-00083-9", "licence": "CC BY 4.0",
                             "locator": "section 'A relative timing framework' (Europe PMC XML paragraph 8)", "status": "no notices (publisher page, 10 Nov 2026)", "checked": "2026-11-10"} },
                { "kind": "chart_boundary", "boundary": "Permian–Triassic", "when": {"type": "boundary_age", "value": 251.902, "pm": 0.024, "units": "Ma"} },
                { "kind": "context", "text": "Newer estimates differ: …", "source": {…} } ],
    "revisions": [] }, … ],
  "shelf": [ { "id": "e-pliny-ep-6-16", "lane": "history", "when": {"type": "partial_date", …}, … } ]
}
```
- **Claim types are separate fields with their own fixed labels**, so the renderer and the no-JS list can never merge them:
  | `claim_type` | Used for | Label shown |
  |---|---|---|
  | `extinction_interval_approx` | E1 | "Approximate extinction interval" |
  | `boundary_age_bound` | E2 (≤ 372.4 Ma) | "Boundary age: no older than" |
  | `boundary_age_range_modelled` | E2 (371.93–371.78 Ma) | "Modelled boundary-age range" |
  | `extinction_onset_estimate` | E3 | "Estimated extinction onset" |
  | `extinction_horizon_approx` | E4 | "Approximate age of the extinction horizon" |
  | `dated_event_age` | E5 impact | "Impact age" |
  | `extinction_placement_tied` | E5 | "Extinction placed at the dated impact (synchrony evidence cited)" |
  | `chart_boundary` | all | "ICS chart boundary (v2026-06)" |
  | `context` | E3 (Dai, Herz), E4 (other approximations), E1 (models) | "Context" |
- Generated by `phase1/timeline/build_timeline.py` (extended) from per-entry source files in `phase1/timeline/` plus the retained chart file; `--generated-at` pins the bytes; `--check` verifies `timeline.html` matches.
- **Wording from sources is paraphrased** with citation; any quoted wording is short and attributed (CC BY: credit, licence link, changes indicated — the page says values are reformatted).
- Each change bumps `catalogue_revision` and appends to the entry's `revisions` (previous value, what changed, why, source revision).

## 4. Hub and page (Arts pattern; ends the T1 exception)
- **Route** `GET /catalogue/timeline` (hub **0.6.3**): serves `ref/timeline/<revision>.json` from R2 only if the whole stored file's sha256 equals the pinned `TIMELINE.fileSha256`; else **503 unavailable**. Outside LAYERS, cron, D1, health and history. `Cache-Control: public, max-age=60`, ETag = file hash. Listed under `catalogues` on `GET /`.
- **Previous catalogues are never deleted** from R2 (`ref/` has no lifecycle rule); rollback = re-pin.
- **Page:** `timeline.html` carries the pre-rendered list (no-JS) and `data-catalogue-sha` for the same revision. `timeline.js` fetches the catalogue (no-store), checks the hash, and draws the axis only on a match.
- **START-HERE §2** T1 line is replaced at release by "Timeline entries are served by the hub catalogue route".

### 4a. Version mismatch and failure (tested)
In every failure case **the pre-rendered list stays fully usable and the axis is not drawn**; the page shows one line: "The timeline axis is unavailable right now; every entry, date and source is listed below." Dates from two revisions are never mixed.
| Situation | Visitor sees |
|---|---|
| New page + new hub, hash matches, catalogue validates | axis + list |
| Old page (Pliny-only), incl. an **already-open tab or a cached page**, + new hub | the old page, unchanged (it never fetches) |
| New page (incl. an already-open tab or cached copy) + old hub (0.6.2: route 404) — possible during **rollback** | list only |
| New page + hub serving a **different revision** (rollout/rollback window, open tab, edge cache ≤ 60 s) | list only |
| **HTML and JavaScript from different builds** (cached `timeline.js` with new HTML or the reverse) | list only — both carry a `build_id`; the script draws nothing unless its own `build_id` equals the page's `data-build` |
| Request **times out** (AbortController, 10 s) or network/CORS error | list only |
| Hash matches but the catalogue **cannot be parsed or fails validation** (schema, claim types, lanes, chart pin) | list only |
| Hub down / 503 | list only |
The release order (hub before page; rollback page before hub) **reduces version skew**; it does not remove it for open tabs and caches, which is why every case above is handled on the page. **Tested from the GitHub Pages origin against the Worker**, including the CORS headers (live RC check), not only from a local server.

### 4b. Direct links
- Each episode has a stable permalink (`#e-big5-end-ordovician`, `…-frasnian-famennian`, `…-end-permian`, `…-end-triassic`, `…-end-cretaceous`); Pliny keeps `#e-pliny-ep-6-16`.
- **The permalink always reaches pre-rendered evidence**: on load it scrolls to and focuses that entry in the list (works with no JavaScript, while the catalogue loads, and when the axis is unavailable).
- Once the axis is drawn and validated, the same link opens the episode's panel/sheet; if the mark is in a cluster, the cluster opens with that entry focused.
- Back closes the panel and returns focus to the mark (or the cluster, or the list entry when the axis is unavailable); a direct-link Back goes to the real previous page, as today.
- Tested: direct open (axis ready / loading / unavailable / clustered), Back, Forward, focus return.

## 5. Tests (all with break checks)
- **timeline-catalogue (hub):** exact bytes served; wrong hash / missing / unreadable / invalid → 503; route outside LAYERS/cron/health/history; `/` lists it. Breaks: serve-on-mismatch, records-only hash, missing-503.
- **timeline-ui (extended from the 584-check suite):** every row of §4a (incl. build_id mismatch, timeout, parse/validation failure) and every case in §4b; every shape in §2 renders distinctly; claim-type labels never merged (fixtures include a pulses entry, an approximate interval, a one-sided bound, a no-uncertainty point); Pliny never on the axis; chart vs source values both visible in the panel; keyboard reaches every mark; **empty lanes add zero Tab stops and use ≤ 96 CSS px together at 390 × 844 at default text size**, wrapping without clipping at 200 % text; no horizontal overflow at 360/390/430/1280; no-JS list carries every entry, date and source; mismatch, 404 and 503 all fall back to the list; Back/Forward/focus as today.
- **Reruns:** desktop-overflow, mobile-pass, all 35 regression suites.

## 6. Sources and REGISTER (before release)
- **E1:** Oxford publisher page checked 10 Nov (Chad) → admitted (B1). If any source gains a notice before release, that entry is withdrawn from the catalogue and list, and the catalogue revision bumps.
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
- **B1** E1: **admitted** — its publisher check completed 10 Nov. Fallback rule kept: an episode whose check is not complete at branch build is excluded from both catalogue and list, and the note says "four of the conventional Big Five" (GPT). *Recommended.*
- **B2** Period labels on phone: the chart's own short codes (`skos:notation`, e.g. "S" for Silurian, "T" for Triassic) with the full name on focus/tap. *Recommended* (names don't fit at 390 px).
- **B3** Catalogue fetch `no-store` (as Arts) for strict revision consistency. *Recommended;* cost negligible (§7).
- **B4** Hub version 0.6.3 and route name `/catalogue/timeline`. *Recommended.*
- **B5** Pliny moves into the catalogue's `shelf` (rendered as today). *Recommended* — one source of truth.
- **B6** Branch name `timeline-deep-rc`. *Recommended.*
