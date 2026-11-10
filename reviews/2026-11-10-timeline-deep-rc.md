# Review packet — Timeline deep-time axis, branch `timeline-deep-rc` (candidate)

**Built 10 Nov 2026 on Chad's line:** "Approve: build timeline-deep-rc on a branch only — catalogue generator, hub 0.6.3 route, page axis per TIMELINE-DEEP-TIME-BUILD-PROPOSAL rev 1.1; no merge, R2 write, hub deploy or page change."
**Not done (each needs its own Approve line):** REGISTER filing, R2 upload, hub deploy, merge to main / page release. Main and production are unchanged (hub 0.6.2, page `4b23518`).
**Candidate commit:** `14628bf` (commit time 2026-11-10 04:46:07 UTC); this packet's §6 was filled in the next commit.

## 1. What was built
| Part | Files | Notes |
|---|---|---|
| Chart clock | `phase1/timeline/extract_chart.py` → `phase1/timeline/chart-v2026-06.5.json` | Refuses any `chart.ttl` whose sha256 ≠ `0158959e…b355` (tag `v2026-06.5`, commit `44d1043ecf29`). 12 Phanerozoic periods (name, chart short code, colour, edges with margins), window 538.8 ± 0.6 Ma, overview 4567 Ma, the five chart boundaries. The `~` flags (538.8, 486.85, 201.4) come from the chart page reading (C0); the data file has none. The `.ttl` itself is not committed (retained in the Mac packet; reproducible). |
| Episode sources | `phase1/timeline/big5.json` | The five episodes and ten sources exactly as the source check rev 2 + GPT's reviews concluded. Wording is ours (paraphrase); values as stated. |
| Catalogue generator | `phase1/timeline/build_timeline.py` (extended), `phase1/timeline/BUILD.json` | Writes `phase1/timeline/catalogue/tl-2026-11-R1.json` (one versioned catalogue: chart, four lanes, fixed claim labels, five entries, Pliny on the shelf, coverage line, credit) and the pre-rendered list into `timeline.html`, embedding the catalogue sha256, revision and build id (`data-build` = the `?v=` asset version). `--check` fails if the page, the catalogue bytes or `timeline.js`'s `BUILD` differ. |
| Hub 0.6.3 | `phase1/worker.js` | `GET /catalogue/timeline` — Arts pattern: serves `ref/timeline/tl-2026-11-R1.json` only if the whole stored file's sha256 = `TIMELINE.fileSha256` and it validates (catalogue, revision, entries, shelf, chart); else 503 `missing / unreadable / integrity / invalid`, `no-store`. GET only (HEAD → 405, as Arts). Outside LAYERS, cron, D1, health, history. Listed under `catalogues` on `/`. |
| Page | `timeline.html` (generated block), `timeline.js`, `style.css` (all scoped `body.tl`), asset `?v=202611191000` (also bumped on index and sources, which share style.css) | Axis drawn only when build id, hash, revision and validation all pass (§4a); otherwise the list stays and one line says the axis is unavailable. Marks are links into the existing panel/sheet machinery (permalinks, Back/Forward, focus return). Glyph key. |
| Tests | `phase1/timeline-catalogue-hub.test.mjs` (24), `phase1/timeline-axis.test.cjs` (78), `phase1/timeline-ui.test.cjs` (585, 3 expectations updated), `phase1/arts-hub.test.mjs` (version check loosened to 0.6.x ≥ 2, intent kept) | §5 |

## 2. Shapes as drawn (proposal §2)
| Entry | Mark | Why |
|---|---|---|
| End-Ordovician | `~` over a soft short bar ("approximate interval") | 2 Myr is ~1.3 px at 390 px and ~4 px at 1280 px; drawn as a fixed glyph at the midpoint, never as a measured width. Pulse models in text only. |
| Frasnian–Famennian | tick + arrowhead (the ≤ 372.4 Ma bound, pointing toward younger) beside a hatched diamond (modelled range, midpoint 371.86) | The two are 0.54 Myr apart (< 1 px), so they share one mark; both claims and values are in its label and panel. **Point for review:** the tick sits ~15 px left of the diamond as a glyph, not at its own scale position. |
| End-Permian | filled accent dot (dated, uncertainty stated) | ± 0.037 Myr is far below 1 px, so no whisker; the panel states the value. |
| End-Triassic | hollow dot with `~` | approximate, as stated |
| End-Cretaceous | filled dot with a ring (dated, uncertainty not stated; extinction placed at the dated impact) | |
| Chart | 12 period bands (chart colours + chart short codes, name on hover) and 5 thin chart-boundary lines | Values shown beside the source values in each panel, never merged. |

## 3. Failure handling (§4a) — every case leaves the list usable and the axis undrawn
Tested: 404 (old hub), 503, network error, a changed byte (hash mismatch), page expecting another revision, HTML/JS build mismatch, unparseable file with a matching hash, a validation failure (changed label; value outside the window; Pliny marked for the axis), a 10 s timeout, and a pulses-shape fixture (refused in this release). **CORS** cannot be tested locally (Playwright-fulfilled responses are not subject to CORS), so it is part of the live RC from the GitHub Pages origin against the deployed Worker.

## 4. Direct links (§4b)
Permalinks `#e-big5-…` open the pre-rendered entry whether the axis is ready, still loading, unavailable or clustered (cluster tested with a fixture). Close/Back return focus to the mark, the cluster control, the cluster entry that opened it, or the card title when there is no axis. No-JS: every permalink lands on its entry.

## 5. Tests (container, local server; hub, fonts and third-party hosts blocked or fulfilled)
- `timeline-catalogue-hub`: 24/0. Breaks `no-hash`, `serve-on-missing`, `no-validate` each fail it.
- `timeline-axis`: 78/0 (360/390/430/1280 widths; 390×844 empty rows **69 px** ≤ 96; larger text wraps without clipping). Breaks `no-hash-check`, `no-build-check`, `no-validate`, `focusable-empties`, `no-timeout` each fail it.
- `timeline-ui` (the Pliny suite): 585/0; break `axis-79` still fails it (anchor updated).
- Regression suites: see §6.
- `build_timeline.py --check`: passes.

## 6. Hashes and regression results
Files at `14628bf` (seven page files as before; `arts.js` and `app.js` unchanged from main):
| File | Bytes | sha256 |
|---|---|---|
| `index.html` | 110786 | `e75c1762c4c2f53a066ddd5cac4a9531034d88301081bd25334cb9a11a21450b` |
| `sources.html` | 43647 | `5ba2d04027a2c150a65de4b2e48568cbc7b8c4b7304b40dd1ef17f56106222f6` |
| `timeline.html` | 28645 | `e9855b78a1e18da7327b4cf42fb93e22e472d43056b65ab056ee1176cc4e0a57` |
| `app.js` | 81781 | `e3f4a38541132b289663945f74612db80e12d35f906a0ecc778d7a39b8391680` |
| `arts.js` | 5759 | `58773cef35e6e947960100cedd59c8bff349a16333a89f3c4ae7abda5595928d` |
| `timeline.js` | 22153 | `60f2b3691e7f3a710d8d7c3427f7903e613436a1650b3d56680b17a4167f42e7` |
| `style.css` | 39965 | `56a24b58ea8b551d08f114245f6d3871b28367b201ae26a78d7343a7070639ec` |
| `phase1/worker.js` | 276411 | `8f7cb55a65fce14dd3f69bb5b5971c71b0a45fa9266255fb9397aa49b1f25982` |
| `phase1/timeline/catalogue/tl-2026-11-R1.json` | 17127 | `cab2ac93331c9963b958d0507c21da08639982d6f937b3b7994b5afdf936552e` |

Hub pin `TIMELINE.fileSha256` = the catalogue's sha256 above (17,127 B). Hub `COLLECTOR_VERSION` 0.6.3.

**All suites on `14628bf` (container, 10 Nov 2026):** timeline-catalogue-hub 24/0 · timeline-axis 78/0 · timeline-ui 585/0 · arts-hub 54/0 · arts-ui 90 · backdrop-layer 27 · desktop-overflow 112/0 · drifters-ui 25 · kept-ui 21 · mobile-pass 131/0 · orbital-ui 38 · orbital-browser 113 · place-ui 30 · plastic-ui 29 · search-ui 104 · smoke-fixes 52 · terminator-behaviour 47 · terminator-ui 19 · ux-round1 34 · health-hub 29 · history-hub 27 · firms-guard 19 · firms-v2 57 (+7 skipped, need `OLD_WORKER`) · kp-degraded 29 · drifters-hub 12 · orbital-hub 13 · plastic-hub 11 · satellites-hub 12 · search 111 · search real-data 50 · ships-fallback 7 · ships-late 7 · solar 26 · place-rows 7 · duration-contract pass. (`orbital.test.mjs`, `ships-probe`, `spacetrack-probe` need live inputs and were not run.)


## 7. Open points for GPT
1. F–F composite glyph (§2): acceptable, or draw the bound tick at its own position under a cluster rule?
2. End-Ordovician at 1280 px is ~4 px wide: keep the glyph, or draw true endpoints at ≥ 4 px as the proposal allows?
3. Herz 2026 and Dai 2025 appear as context with "publisher page not read" — acceptable as context, or drop them?
4. The glyph key (not in the proposal) — keep?
