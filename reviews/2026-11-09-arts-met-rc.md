# Arts (the Met) — branch candidate `arts-met-rc`, for GPT's independent implementation review (9 Nov 2026)

**Authority (Chad, 9 Nov 2026, verbatim):** "Approve: Arts scoped feature per the Arts release proposal rev 2.1 — D1 authorise the fixed Met snapshot card only (one bounded exception; no domain selection, prototype or Phase A otherwise); D2–D8 as recommended; build arts-met-rc on a branch only — no merge, R2 write, hub deploy or page change."

**What was done:** the candidate was built on branch `arts-met-rc` only. **Not done:** no merge, no R2 write, no hub deploy, no page change on main. Production is unchanged (hub 0.6.1, page `ad4002b` assets `?v=202611151000`). Proposal: `docs/research/P0-ARTS-RELEASE-PROPOSAL.md` rev 2.1 (`bfe3e99`, accepted by GPT).

## 1. The generated file (to be uploaded later, on its own Approve line)
| | |
|---|---|
| Path on the branch | `phase1/arts/met-R1-e394878.json` (+ `phase1/arts/BUILD.json`) |
| R2 key (not written) | `ref/arts/met-R1-e394878.json` |
| `published_file_generated_at` | **2026-11-09T04:47:20Z** |
| **`file_sha256`** (complete file) | **`221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644`** · 127,887 B |
| **`records_sha256`** (= `snapshot_id`) | `067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2` · 122,227 B (= rev 2.1 §4.2; records embedded last, byte-identical) |
| gzip (Python 3.13.18, level 9, mtime 0) | 10,031 B — not the served transfer size |
| Input | `final-view-objects.json` sha256 `d682cb96…88bc5` (checked by the script) |

**Reproduce:** `python3 -I phase1/arts/build_arts_snapshot.py . <out> --generated-at 2026-11-09T04:47:20Z` → byte-identical (checked with `cmp`). The script stops without writing if anything disagrees with the accepted evidence: the input hash, the projection bytes/hash, 479/25 and the per-country counts, the 11 labels and their kinds, the four departments, a certain created_at wording on every record, the link pattern, the fixed field list, and the sensitivity wording.

**One regeneration before review (disclosed).** The first generated file (04:26:52Z, `cb5f74b1…f428`) was superseded before any upload. The visual check (screenshots) showed list headings built from *every* country text in a record, so CHN read "China / Iran" (object 454616: "Excavated in|Made in" / "Iran|China"). Headings now take, per ISO code, the Met's most frequent country text **paired with a certain place-of-making wording** among that country's objects (`counts.heading_text` + `heading_rule`). Every object still shows its own full Met wording and country verbatim. The records and their hash are unchanged; only the envelope changed, so `file_sha256` changed and was re-pinned.

## 2. Files on the branch
| File | Change |
|---|---|
| `phase1/arts/build_arts_snapshot.py` | generator (§1) |
| `phase1/arts/met-R1-e394878.json`, `BUILD.json` | the generated file and its hashes |
| `phase1/worker.js` | **0.6.2**: `ARTS` pin (file + records hashes, 479, 25), `artsSnapshot()`, route `GET /snapshot/arts` (before the generic snapshot route; `arts` **not** added to `LAYERS`); root lists `catalogues.arts`. No cron, job, D1, history or health change. |
| `arts.js` (new page file) | the card's logic, separate from `app.js` |
| `index.html` | card at the end of Optional layers; footer credit (D7); `arts.js` script; `?v=202611161000` |
| `sources.html` | `#arts` section; Sources table row; tiers row "catalogued"; `?v=202611161000` |
| `style.css` | "Catalogued" label (dotted outline + colour), list styles, `[hidden]` rule |
| `phase1/arts-hub.test.mjs`, `phase1/arts-ui.test.cjs` | new suites with breaks |
| `phase1/arts/shots.cjs`, `reviews/evidence/2026-11-09-arts-met-rc/*.png` | review screenshots (not a test) |

## 3. Implementation notes for review (choices made inside the proposal, or small additions)
1. **503 reasons:** `missing | unreadable | integrity | invalid`. **`unreadable` is an addition** to rev 2.1's three: an R2 read that throws is not "missing".
2. **Hub order:** read → sha256 of the complete bytes vs `fileSha256` → strict UTF-8 parse → kind/layer/records/counts shape → `snapshot_id` vs `recordsSha256` → counts vs pin. Any failure → 503 `{status:'unavailable', reason}`, `Cache-Control: no-store`, never records.
3. **Success headers:** `ETag: "<file_sha256>"`, `Cache-Control: public, max-age=60` (as the other `/snapshot/*`), CORS, `Access-Control-Expose-Headers: ETag`.
4. **Page consistency (no re-hash):** `snapshot_id` = pinned records hash; 479 records; `counts` 479/25; `by_country` matches the records and sums to 479. Reasons shown: "the hub reports <reason>", "the hub answered <status>", "snapshot mismatch", "count mismatch", "invalid", "the hub could not be reached".
5. **Card placement and wording:** last item of Optional layers; label **Catalogued**; caveat = GPT's sample sentence + "not historical nationality" + "Sensitivity not fully assessed"; dates line "Source: Met Open Access CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026"; "What this is and is not" holds every file limitation verbatim (tested). The status line never shows a fetch time.
6. **Per-object rows:** name · culture · department; "The Met: <wording> — <country>" verbatim (the Met's `|` kept); tentative labels; **"Sensitivity not fully assessed"** on every row (+ "no screen hit; this does NOT mean not sensitive" on unlabelled rows); link "Met object page <id> ↗" (`target=_blank rel=noopener`). Links use the Met's `http://` URLs exactly as in the data.
7. **One scrolling surface:** no inner scrollbar on the list (the page's standing rule); the column / phone sheet scrolls.
8. **Bug found and fixed during the build:** `.arts-objs{display:flex}` overrode the `hidden` attribute, so collapsed lists were still drawn. The Tab-order test caught it. Fix: `.arts-list[hidden],.arts-objs[hidden]{display:none}`. Visibility tests now check rendering (`offsetParent`, height), not just the property, and a `css-hidden` break proves they bite.
9. **Served-hash checks at release** must now include **`arts.js`** (START-HERE §5a lists four page files).
10. **Exposure after a merge:** once on main, `phase1/arts/met-R1-e394878.json` is also reachable as a static file on GitHub Pages (the repo root is published). The page never reads it there. CC0 data; noted for completeness.

## 4. Tests (container, Node 22.23.4, Playwright 1.63.0 Chromium + SwiftShader, globe.gl 2.45.0)
**New suites**
- `node --no-warnings phase1/arts-hub.test.mjs` → **54 passed, 0 failed**. Covers: file = BUILD hash; records embedded byte-identically; 479/25 and the per-country counts = `final-view-results.json`; 11 labels; departments; fixed fields; certain created_at wording; links; dates kept separate; no freshness fields; sample stages; every limitation; sensitivity; credit; label; headings. Serving: 200 byte for byte, ETag, cache, CORS, no D1 touched. 503 cases: missing; R2 throws; **one byte changed in a limitation with records untouched**; a date changed; truncated; unparseable; wrong kind; `snapshot_id` ≠ pin; count ≠ pin; bad UTF-8. Outside the machinery: `/cells/arts` 404; `/health/runs/arts` not 200; not in `LAYERS`; no D1 or R2 writes in the Arts code; no cron or job; root shows 0.6.2 and the catalogue.
  - **Breaks (each must fail):** `BREAK=records-only` (whole-file check removed) → **3 fail**; `no-records-check` → **1 fail**; `serve-on-fail` → **1 fail**.
- `node phase1/arts-ui.test.cjs` → see §4a for the final run. At 1280 and 390 px: off on load (no request; list not rendered); card wording, label, dates and credit; every limitation reachable; on → one request, 25 rows, counts = file, sum 479; headings = `heading_text`, left-aligned; Key count unchanged; nothing expanded until asked. **Accessibility tree** (role, name, `expanded`, `aria-controls`): Enter expands, Space collapses, focus stays, Tab to the next row. Every expanded object visibly shows the sensitivity warning; Met wording + link on every row; all 479 expanded with 11 labelled; the unlabelled note only on unlabelled rows; the Yup'ik mask present with its label; no page overflow with every list open; no inner scrollbar; **no request to any Met host or image**; off → cleared, no further request; no page errors. Faults: hub 503 integrity/missing, plain 500, `snapshot_id` mismatch, a short record list, a by_country sum mismatch, non-JSON, network abort → "unavailable — <reason>", no list, no count. Switching off while loading stays off. Markup in a record is shown as text.
  - **Breaks (each must fail):** `no-consistency`, `eager` (loads on page open), `no-warning`, `no-aria`, `show-retrieval` (fetch time in the status), `css-hidden` — counts in §4a.

**Regression (all `phase1/*.test.*`, run on the branch before the heading fix; page-facing suites re-run after it, §4a):** every suite exits 0: arts-hub 52 (54 after the heading tests were added), drifters-hub 12, duration-contract pass, firms-guard 19, firms-v2 57 (+7 skipped, need `OLD_WORKER`), health-hub 29, history-hub 27, kp-degraded 29, orbital-hub 13, orbital-ui 38, place-rows 7, plastic-hub 11, satellites-hub 12, search.realdata 50, search 111, ships-fallback 7, ships-late 7, ships-probe 11, solar 26, spacetrack-probe 11, arts-ui 86, backdrop-layer 27, desktop-overflow 112, drifters-ui 25, kept-ui 21, mobile-pass 131, orbital-browser 113, place-ui 30, plastic-ui 29, search-ui 104, smoke-fixes 52, terminator-behaviour pass, terminator-ui pass, ux-round1 34. `orbital.test.mjs` needs a live GP CSV argument and was not run (same on main).

### 4a. Re-run after the heading fix (final; generated file `221bb1ca…9644`)
- `arts-hub` **54 passed, 0 failed**; breaks: records-only **3 fail**, no-records-check **1 fail**, serve-on-fail **1 fail**.
- `arts-ui` **90 passed, 0 failed** (adds: headings = `heading_text`, no borrowed segment, left-aligned); breaks: no-consistency **6 fail**, eager **10 fail**, no-warning **4 fail**, no-aria **6 fail**, show-retrieval **2 fail**, css-hidden **8 fail**.
- Page-facing regressions re-run: mobile-pass 131/0, desktop-overflow 112/0, ux-round1 34/0, smoke-fixes 52/0, kept-ui 21/0.
- Screenshots retaken (`arts-off-*.png`, `arts-on-IRN-open-*.png`, 1280 and 390 px, DPR 2).

## 5. Measurements and what is NOT verified
- **Local only:** `artsSnapshot` CPU in Node 22 on the generated file: median 0.59 ms, p95 0.86 ms, max 1.39 ms (200 runs). **Cloudflare Worker CPU is not measured** (needs the deploy).
- **Page bytes (raw files, not transfer):** `arts.js` 5,759 B new; `index.html` 106,770 → 110,497 B; `sources.html` 38,920 → 43,378 B; `style.css` 26,619 → 28,489 B (final branch files). `app.js` unchanged, but its `?v=` is bumped, so returning visitors re-download it. **Cold-load before/after is not measured** (fresh-profile method, Chad).
- **Not verified:** served transfer size of `/snapshot/arts`; R2 billing allowances (to be checked before the upload approval); behaviour on the deployed hub (live RC check); **actual iPhone Safari** (Chad); **what a screen reader announces** (accessibility-tree checks only; VoiceOver optional); the fonts in the screenshots are the container fallbacks (Google Fonts blocked).
- **Rollback note:** a 200 from `/snapshot/arts` may be cached for up to 60 s (`max-age=60`), so after removing the R2 object a browser can show the card for up to a minute before it reads "unavailable". Release order (R2 → hub → RC check → page) and rollback order (page first) stand.

## 6. Next steps (each on its own Approve line, only when reached; none sent yet)
1. GPT's independent implementation review of this branch.
2. Check R2 allowances, then: `Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644) to R2`
3. Pin the live hub version + sha256 as the rollback target, then: `Approve: deploy hub 0.6.2 from <commit> (content only)`
4. Live RC check against the deployed hub (clean pane tab, served hashes incl. `arts.js`).
5. `Approve: push arts-met-rc to main (page change: Met catalogue sample card)` → served-hash check, live read, cold-load before/after, iPhone check, REGISTER Met status → "on the page (fixed snapshot)".

## 7. File hashes on the branch (sha256, for the served-hash checks at release)
| File | sha256 |
|---|---|
| `phase1/worker.js` (hub 0.6.2) | `4b5b6aa3c953afbce197586b8007a54da5191d83f4b317b28a48b4b1661a003f` |
| `phase1/arts/met-R1-e394878.json` | `221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644` |
| `arts.js` | `58773cef35e6e947960100cedd59c8bff349a16333a89f3c4ae7abda5595928d` |
| `index.html` | `e30b04f7ee5aa53589074bb77bd143c7d647813f249672683802bd9f77b2f0e0` |
| `sources.html` | `33074c2d17d3625166753e2630132fe10f99b156c10a0fb1b8dd0319ea95984d` |
| `style.css` | `6a54e0b17cbd7b42df8d6e105f65a743c0c1edfd90b9d4aa1de123095aafe963` |
| `app.js` | unchanged from main |
