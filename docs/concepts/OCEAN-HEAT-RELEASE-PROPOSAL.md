# Ocean Heat — release proposal (hub-served snapshot), rev 2

**For:** the approval lines in §7. Docs only.
**Builds on:**
- OCEAN-HEAT-PROPOSAL rev 4.2, O3: "the follow-on serves it from the hub as a pinned fixed catalogue (the Arts / Sky pattern)";
- the preview packet `reviews/2026-11-10-ocean-heat-rc.md` on branch `ocean-heat-rc` (§9 rev 2, §10 timing run and GPT's verdict).

**Decided (Chad, 11 Nov 2026):** D1, D2, Q1 and Q2, recorded in §6.
**Not approved:** the branch build, the R2 upload, the hub deploy, the REGISTER filing and the page merge. Each is its own line (§7).

## Rev 2 changes (Chad's decisions)

| # | Decision | Where |
|---|---|---|
| D1 | Regression gate adopted for this release; absolute targets kept for the globe performance work | §0, §6 |
| D2 | Hub serving; `data/ocean-heat/` removed from the release branch; both suites take an explicit local path to the four pinned files, hash-check them at setup, and run with the branch copy removed | §1, §3, §6 |
| Q1 | Verified 200s: `Cache-Control: public, max-age=86400, immutable`. The page's pinned fetches drop `cache: 'no-cache'`. 404 and 503 stay `no-store`. Any byte change gets a new revision URL and new pins | §1, §2, §6 |
| Q2 | Worker checks length and SHA-256. A build-time check matches the manifest's revision to the route and its file entries to the Worker pins. Page revision and hash checks stay. `.bin.z` served as `application/octet-stream` with no `Content-Encoding`. Worker tests add the `unreadable` 503 | §2, §3, §6 |
| — | Final Pages-origin check uses the candidate page's actual `BASE` against the deployed hub | §4 |

## 0. Where the preview stands (11 Nov 2026)

- **GPT:** rev 2 clears the preview findings; keep the lighter checker; the render-path changes and their tests are accepted.
- **Render-performance gate (D1, adopted):** Ocean Heat must show **no repeatable slowdown against the layer-off baseline**.
  - The §10 run (Chad's Chrome, Apple M3) satisfies this for the tested setup, with P1 and forced P2.
  - **Physical phone performance is still unverified.**
  - The original absolute targets (median ≤ 33 ms, p95 ≤ 50 ms, tap ≤ 200 ms) stay as targets for the globe performance work. The first diagnostic lead is the coverage-cell polygons.
- **Data host:** the hub (D2).
- **Remaining release check:** the final page fetches the pinned snapshot **through the deployed hub** (§4). The preview's first-enable times used raw.githubusercontent and do not measure that path.

## 1. What changes

| Part | Change |
|---|---|
| R2 | Four objects under `ref/oceanheat/oh-2026-11-09-R1/`. Exact bytes and hashes as in packet §1. |
| Hub 0.6.7 | One new versioned, read-only route (§2), outside LAYERS, cron, D1, `/status` collection, `/health` and history (the Sky / Timeline rule). Discovery line in `/` metadata. |
| Page `oceanheat.js` | `OH.BASE` → `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/`. **`cache: 'no-cache'` removed** from the pinned fetches (Q1), so the browser can reuse a fresh response. Unchanged: the page still pins the manifest's sha256 and refuses a wrong revision or date; the manifest still pins each binary. |
| Repo | **`data/ocean-heat/` removed from the release branch** (D2). It stays in the `ocean-heat-rc` history. The generator, fixtures and expected taps stay under `phase1/`. |

The four files:

| R2 key (`ref/oceanheat/oh-2026-11-09-R1/…`) | Bytes | sha256 | Content-Type |
|---|---|---|---|
| `manifest.json` | 4,585 | `dcc3467428e38e76966508d10078d322b8d724ed784de3266ae0b62354f5af1b` | `application/json` |
| `mask.bin.z` | 137,652 | `349fc0237d35443864ce58bebc221d19672440d14604e24a86df595ced10bb9c` | `application/octet-stream` |
| `v025.bin.z` | 1,081,272 | `3e66d63c816b01c561a038f757fdc5628ec1be96857232f8ed62b8dac2be1ae0` | `application/octet-stream` |
| `v050.bin.z` | 323,176 | `be418c11f7f7903c11bdd7e33454502fa95c5a58a564d606f8f4fdfbcc00c725` | `application/octet-stream` |

## 2. The route

- **Pin table** `OCEANHEAT_REVISIONS`, frozen: one entry per revision, one row per file (R2 key, sha256, bytes, content type as above).
- **Matching** on the raw pathname: exactly `/catalogue/oceanheat/<revision>/<file>`, with both segments in the pin table. Anything else is **404 with no R2 read**: a bare or partial path, an extra segment, a trailing slash, an encoded slash, an unknown revision or file.
- **Serving (Q2):**
  - read the object;
  - check its **byte length** and **SHA-256** against the pin;
  - serve the bytes unchanged, with:
    - the pinned `Content-Type`; `.bin.z` as `application/octet-stream` **with no `Content-Encoding`** (they are zlib streams the page inflates itself; a `Content-Encoding` would make the browser inflate first and the page's hash fail);
    - `Cache-Control: public, max-age=86400, immutable` (Q1, verified 200s only);
    - `ETag: "<sha256>"`, `Access-Control-Expose-Headers: ETag`, and the hub's CORS.
- **Failures:** 503 `{status: 'unavailable', reason}`, with reason `missing`, `unreadable`, `size` or `integrity`. **404 and 503 both carry `Cache-Control: no-store`.**
- **Immutability:** a revision's bytes never change. Any change gets a new revision id, a new R2 prefix and new pins in both the hub and the page.
- **Build-time consistency check (Q2)**, a script run in the build and in CI-style tests. It reads the four local files and asserts:
  - the manifest's `revision` equals the route's revision id;
  - each manifest file entry's sha256 and byte count equals the Worker pin for that file;
  - the manifest's own sha256 equals both the Worker pin and the page's `OH.MANIFEST_SHA256`.

  The Worker itself stays a length-and-hash check; it does not parse the manifest.
- **Cost:** a cold first-enable on P1 is 3 R2 reads, 1.22 MB out and hashing about 1.2 MB in the Worker; repeat visits within 24 h are served from the browser cache. This stays inside the free tiers already in use, so the run rate is $0/month (confirmed against `reviews/2026-11-09-arts-r2-billing-check.md` in the build).

## 3. Tests (each with a break that must fail it)

- **Snapshot source for both suites (D2):** an explicit local path, `OH_SNAPSHOT_DIR`.
  - The suites refuse to start if it is unset, if a file is missing, or if any of the four sha256 values or byte counts differs from the pins.
  - They run **with the release branch's `data/ocean-heat/` absent**, and the test run asserts that absence.
  - The source copy is the Mac packet's `snapshot-oh-2026-11-09-R1/` (identical bytes, packet §3).
- **Worker** (mock R2, through the real `fetch` export, as `sky-hub.test.mjs` does):
  - each of the four real files → 200 with:
    - exact bytes and sha256;
    - the pinned `Content-Type`;
    - **no `Content-Encoding`**;
    - `Cache-Control: public, max-age=86400, immutable`;
    - `ETag`, exposed headers and CORS;
  - **routing → 404 with `no-store` and zero R2 reads:** unknown revision, unknown file, bare, partial, extra segment, trailing slash, `%2F`;
  - **failures → 503 with `no-store`:**
    - wrong bytes of the right length → `integrity`;
    - truncated → `size`;
    - missing object → `missing`;
    - **`R2.get` or `arrayBuffer()` throws → `unreadable`;**
  - **Breaks:** `no-hash-check`, `no-size-check`, `loose-route` (prefix match), `wrong-type`, `content-encoding` (header added), `cache-on-error` (503 cacheable).
- **Build-time consistency check:** passes on the real files.
  - **Breaks:** `manifest-revision` (route id changed), `pin-mismatch` (one Worker pin altered), `page-pin-mismatch` (`OH.MANIFEST_SHA256` altered).
- **Browser suite** `phase1/oceanheat-ui.test.cjs` (101), serving the four files from `OH_SNAPSHOT_DIR` at the hub path:
  - the request assertions name the hub URLs;
  - a second enable after switch-off is answered from the browser cache (no new network fetch), now that `no-cache` is gone;
  - a hub 503 shows "Ocean heat unavailable — … Nothing is drawn.";
  - the 13 existing breaks are rerun, and `no-cache-kept` is added (the old fetch option restored → the cache check fails).
- **Regression:** the page suites as in packet §5.

## 4. Live release candidate (after the upload and the deploy)

From the Pages origin in a clean tab. The branch page files are blob-injected by commit and hash-checked, **using the candidate page's actual `BASE`** (no rewrite), so every fetch goes to the deployed hub.
- **Before the toggle:** zero requests to `/catalogue/oceanheat/`.
- **Exact requests, each response's sha256 checked against the pins:**
  - desktop (P1): manifest + mask + v025;
  - P2 (`forcePhone`): manifest + mask + v050.
- **Response headers:** `Content-Type`, no `Content-Encoding`, `Cache-Control`, `ETag`.
- **Taps:** the expected readings at all 12 points on P1 (0.25°) and P2 (0.5°), compared with `expected-taps.json`.
- **First-enable timing through the hub** for both paths: cold, then a repeat enable.
- **Regression gate on the release candidate:** a layer-off vs layer-on pair in foreground Chrome.
- **On merge:** the served-hash check covers ten page files (`oceanheat.js` added) plus the four hub responses.

## 5. Before public release (outside the code)

- **REGISTER filing (C6)** on Chad's line: the three statements, the OSTIA distinction, GPT's withdrawal of the hold, the credit and the methods-article DOI.
- **NOAA STAR disclaimer:** still to read (record rev 2.1 lists it as open). Text only, in the pane.
- **md5 sidecars:** open. Chad pastes the two `.md5` lines, or drops the check by decision (the sha256 pins already fix the bytes we use).

## 6. Decisions (Chad, 11 Nov 2026)

- **D1 — adopted: regression gate for this release.** No repeatable slowdown against the layer-off baseline. The §10 run satisfies it for the tested Chrome setup, with P1 and forced P2. Physical phone performance unverified. The absolute targets stay for the globe performance work, with the coverage-cell polygons as the first diagnostic lead.
- **D2 — hub serving; `data/ocean-heat/` removed from the release branch.** Both suites take an explicit local path to the four pinned files, verify their hashes at setup, and run with the branch copy removed.
- **Q1 — 24-hour caching of verified 200s:**
  - `Cache-Control: public, max-age=86400, immutable`;
  - `cache: 'no-cache'` removed from the pinned fetches;
  - `no-store` on 404 and 503;
  - any byte change gets a new revision URL and new pins.
- **Q2 — the checks:**
  - the Worker checks length and SHA-256;
  - a build-time check matches the manifest's revision to the route and its file entries to the Worker pins;
  - the page keeps its revision and hash checks;
  - `.bin.z` files are served as `application/octet-stream` with no `Content-Encoding`;
  - the Worker tests include the `unreadable` 503.

## 7. Approval lines (each its own; none given yet)

1. `Go: read the NOAA STAR disclaimer for Ocean Heat — text only via the pane, no download.`
2. `Approve: file the Ocean Heat REGISTER entry (C6) as recorded in OCEAN-HEAT-PROPOSAL §9a.`
3. `Approve: build ocean-heat-release on a branch only — hub 0.6.7 Ocean Heat route, page BASE and cache changes per OCEAN-HEAT-RELEASE-PROPOSAL rev 2; data/ocean-heat removed from the branch; no merge, R2, hub or page change.`
4. GPT reviews the build packet and a hash-checked `_review/ocean-heat-release/` copy.
5. `Approve: upload the four ref/oceanheat/oh-2026-11-09-R1/ objects to R2 (exact bytes, hashes as pinned in OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §1).`
6. `Approve: deploy hub 0.6.7 from <commit> (content only: Ocean Heat route).`
7. Live release candidate from the Pages origin through the deployed hub (§4), then GPT's check of its record.
8. `Approve: merge ocean-heat-release to main (page change: Ocean Heat layer).`

Steps 1–3 can be given in any order. Step 3 does not depend on 1 or 2, but step 8 needs both done.
