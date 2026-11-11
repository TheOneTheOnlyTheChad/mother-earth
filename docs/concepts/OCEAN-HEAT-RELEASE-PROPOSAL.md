# Ocean Heat — release proposal (hub-served snapshot), rev 1

**For:** GPT's review, then Chad's lines. Docs only.
**Builds on:** OCEAN-HEAT-PROPOSAL rev 4.2 (O3: "the follow-on serves it from the hub as a pinned fixed catalogue (the Arts / Sky pattern)") and the preview packet `reviews/2026-11-10-ocean-heat-rc.md` on branch `ocean-heat-rc` (§9 rev 2, §10 timing run).
**Approved so far:** the preview build (branch only). Not approved: any build for this proposal, R2 write, hub deploy, REGISTER filing or page change.

## 0. Where the preview stands (11 Nov 2026)

- **GPT:** rev 2 clears the preview findings; keep the lighter checker; the render-path changes and their tests are accepted.
- **Render-performance gate.** GPT recommends changing the merge criterion to a **regression gate**: no repeatable slowdown against the page's own layer-off baseline, on both paths. The original absolute targets (median ≤ 33 ms, p95 ≤ 50 ms, tap ≤ 200 ms) are kept as targets for the globe's own performance work.
  - The §10 run (Chad's Chrome, M3) clears that gate for the tested setup. The live page misses the absolute targets with no Ocean Heat at all.
  - P2 was forced on a desktop viewport; phone performance is unverified.
  - **Adopting the changed criterion is Chad's call** (D1 below).
- **Data host:** Chad chose the hub (11 Nov). This proposal is that path.
- **Remaining release check (GPT):** the final page must fetch the pinned snapshot **through the hub**, after the separately approved route and upload. The preview's first-enable times used raw.githubusercontent and do not measure that path.

## 1. What changes

| Part | Change |
|---|---|
| R2 | Four objects under `ref/oceanheat/oh-2026-11-09-R1/`: `manifest.json` (4,585 B), `mask.bin.z` (137,652 B), `v025.bin.z` (1,081,272 B), `v050.bin.z` (323,176 B). The exact bytes from the branch, hashes as in packet §1. |
| Hub 0.6.7 | One new versioned, read-only route, `GET /catalogue/oceanheat/<revision>/<file>`, outside LAYERS, cron, D1, `/status` collection, `/health` and history (the Sky / Timeline rule). Discovery line in `/` metadata. |
| Page | `oceanheat.js`: `OH.BASE` → `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/`. Nothing else in the layer changes: the page still pins the manifest sha256, and the manifest still pins each binary. |
| Repo | `data/ocean-heat/` **leaves the release branch** (it stays in the preview history). The generator, fixtures and expected taps stay under `phase1/`. |

## 2. The route

- **Pin table** (`OCEANHEAT_REVISIONS`), frozen; one entry per revision, one row per file: R2 key, sha256, bytes, content type (`application/json` for the manifest, `application/octet-stream` for the three `.bin.z`).
- **Matching** on the raw pathname: exactly `/catalogue/oceanheat/<revision>/<file>`, with both segments in the pin table. Anything else is **404 with no R2 read**: a bare or partial path, an extra segment, a trailing slash, an encoded slash, an unknown revision or file.
- **Serving:**
  - read the object;
  - check its byte length and sha256 against the pin;
  - serve the bytes unchanged, with `ETag: "<sha256>"`, `Access-Control-Expose-Headers: ETag` and the hub's CORS.
- **Failures:** 503 `{status: 'unavailable', reason}`, with reason `missing`, `unreadable`, `integrity` or `size`, and `Cache-Control: no-store`.
- **Caching:** proposed `public, max-age=86400, immutable`. Revisions are immutable and the page re-checks every hash, so a stale cache cannot change what is drawn. Sky uses `max-age=60`; GPT to choose (Q1).
- **Cost:** a cold first-enable on P1 = 3 R2 reads and 1.22 MB out, plus hashing about 1.2 MB in the Worker. That is within the free tiers already in use, so the run rate stays $0/month (to confirm against the R2 billing note `reviews/2026-11-09-arts-r2-billing-check.md` in the build).

## 3. Tests (each with a break that must fail it)

- **Worker** (mock R2, through the real `fetch` export, as `sky-hub.test.mjs` does):
  - each of the four real files → 200 with exact bytes, sha, type and headers;
  - routing: unknown revision, unknown file, bare, partial, extra segment, trailing slash and `%2F` → 404 with zero R2 reads;
  - failures: wrong bytes → 503 `integrity`; truncated → 503 `size`; missing → 503 `missing`;
  - **Breaks:** `no-hash-check`, `loose-route` (prefix match), `wrong-type`.
- **Browser suite:** `phase1/oceanheat-ui.test.cjs` (101), with the hub routed to the four real files at the new path:
  - the request assertions name the hub URLs;
  - a hub 503 shows "Ocean heat unavailable — … Nothing is drawn.";
  - the existing 13 breaks are rerun.
- **Regression:** the page suites as in packet §5.

## 4. Live release candidate (after the upload and the deploy)

From the Pages origin in a clean tab: the branch page files blob-injected by commit, hash-checked, **with no `BASE` rewrite**, so the page fetches through the live hub.
- Before the toggle: zero requests to `/catalogue/oceanheat/`.
- Desktop (P1): exactly manifest + mask + v025; P2 (`forcePhone`): exactly manifest + mask + v050. Every response hash checked against the pins.
- 12/12 taps; first-enable time through the hub recorded.
- A layer-off vs layer-on timing pair in foreground Chrome, the regression gate re-read on the release candidate.
- The served-hash check on merge covers ten page files (`oceanheat.js` added) plus the four hub responses.

## 5. Before public release (outside the code)

- **REGISTER filing (C6)** on Chad's line: the three statements, the OSTIA distinction, GPT's withdrawal of the hold, the credit and the methods-article DOI.
- **NOAA STAR disclaimer:** still to read (record rev 2.1 lists it as open). Text only, in the pane.
- **md5 sidecars:** open. Chad pastes the two `.md5` lines, or the check is dropped by decision (the sha256 pins already fix the bytes we use).

## 6. Decisions

- **D1 (Chad):** adopt the regression gate as the merge criterion for render performance (GPT recommends; packet §10). The absolute targets stay as targets for the globe's performance work, starting with the 782 coverage-cell polygons.
- **D2 (Chad):** `data/ocean-heat/` leaves the release branch (default), or stays in the repo unused.
- **Q1 (GPT):** cache lifetime for the four files.
- **Q2 (GPT):** anything the route must check beyond length and sha256 (for example, refusing a manifest whose `revision` differs from the path; the page already refuses it).

## 7. Steps (each its own approval)

1. GPT reviews this proposal.
2. Chad: D1, D2; `Go:` STAR disclaimer read (text only); REGISTER filing line.
3. `Approve: build ocean-heat-release on a branch only — hub 0.6.7 Ocean Heat route + page BASE per OCEAN-HEAT-RELEASE-PROPOSAL rev 1; no merge, R2, hub or page change.`
4. GPT review of the build packet.
5. `Approve: upload the four ref/oceanheat/oh-2026-11-09-R1/ objects to R2 (exact bytes, hashes as pinned)`
6. `Approve: deploy hub 0.6.7 (content only: Ocean Heat route)`
7. Live release candidate from the Pages origin through the hub (§4).
8. `Approve: merge ocean-heat-release to main (page change: Ocean Heat layer)`

**Not approved:** steps 2–8.
