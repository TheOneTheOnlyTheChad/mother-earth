# Moon LROC detailed site (item 4) — release record (27 Nov 2026)

**Released:** merge `8e7d262` on `main` (02:41:27 UTC commit time, pushed 02:41:37 UTC by clock reading) of `moon-lroc-ui` at `40e0f86`. Page only. No hub, R2, D1, collector, Cloudflare or schedule change.

## Approval and review
- **Chad's own line (27 Nov 2026):** "Approve: release Moon LROC detailed site from moon-lroc-ui at 40e0f86 to main, page only; no hub deployment."
- The same words first arrived inside GPT's relayed review as a suggested owner line. They were not acted on until Chad sent the line himself.
- **GPT's release review:** PASS for release approval at `40e0f86`. Filed unchanged as `reviews/2026-11-27-moon-lroc-release-rc-gpt-review.md` (from the Mac's `ChatGPT/Mother Earth/MOON-LROC-RELEASE-RC-REVIEW-2026-11-27.md`, sha256 `21bad1d5…f3b5`; main `6fa1fb1`).

## Merge
- Main had moved since the candidate's merge of fresh main `d73a639` by three docs-only commits: `56ada0e` and `d5ecebd` (RC records and their time correction) and `6fa1fb1` (GPT's release review).
- The merge was clean. **`8e7d262` differs from `40e0f86` only in `HANDOVER.md`, `STATUS.md`, `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` and the filed review.** No served or executable byte changed after GPT's review (GPT's release step 1).
- `node phase1/moonsci/served_manifest.mjs --check` on the merged tree: 50 files (37 root page files + 13 assets) match.

## Served verification (browser pane, live site)
- **Manifest:** the reviewed `reviews/evidence/2026-11-26-moon-lroc-manifest.json`, taken from `40e0f86`. Its sha256 is `cdd304f5…5fe1`, equal to the hash in GPT's review. It was not regenerated.
- **Method:** `served_manifest.mjs --pane` builds its list from the working tree, so it was **not** used. The page script was generated directly from the reviewed file: 50 `[path, bytes, sha256]` entries, checked before running.
  - Each path was fetched from `https://theonetheonlythechad.github.io/mother-earth/` with `cache: 'no-store'` and a cache-busting query.
  - Status, byte length and sha256 were compared.
- **Publication:** the live `moon.html` still lacked `mg-lroc-ctl` at 02:42:11 UTC and had it at 02:43:32 UTC. The Pages build API is not reachable from the workspace; the hash check below is the evidence.
- **Result:** 50 checked, **50 match**, 0 differ, at **2026-11-27T02:44:57.984Z**.

## Live functional check (browser pane, `moon.html?live-check=1`, 02:45:11–02:46:44 UTC)
Fresh load; the globe started normally. Driven through the page's own button, radios and checkbox. Each step below is a separate observation.

| Step | Observed |
|---|---|
| Toggle placement | `#mg-lroc` is outside `#mg-ctl` |
| Open | Area picture shown; camera turned from (0°, 0°) to 0.67416°N, 23.47314°E (altitude unchanged, 2.6); locator `placed`, one turn, no pending wait; locator line shown; no-data overlay present |
| Ring | One `.mgl-ring`, visible, centred inside the globe (02:45:41 UTC); screenshot taken |
| Site view | Site picture shown, 1,024 × 1,024 |
| Optional pointer | Off by default; it appears only in the site view. Ticked: shown, anchored at 50.01% / 50.04% of the site picture, on the Lunar Module (zoomed screenshot). Unticked: hidden |
| Close | Panel and locator line hidden; ring removed; picture released (`src` removed); `aria-pressed` false; focus on the toggle; **camera left where it was**, as decided (D4) |

**Checker's own events (disclosed):**
- **The ring at first appeared missing.** The pane tab was behind another tab, so the page received no animation frames (0 in 1.5 s), and the globe library draws its HTML layer on a frame. The page's state already said "placed, visible". With the tab in front, 30 frames ran and the ring was there.
- **First pointer attempt:** it was tried in the area view, where the pointer is hidden by design, and the shape check assumed a non-zero box (the pointer is a 0 × 0 anchor drawn by pseudo-elements). It was repeated in the site view and measured by its anchor position (above).

**Not reproduced live:** the globe-failure path. The pane cannot block the globe library on the live site. It is covered by the J tests and by GPT's independent fallback check.

Functional check only. It measures neither rendering cost nor performance.

## Not verified
A real phone, Safari, a screen reader and a verified hardware renderer, as stated in the release packet and GPT's review.

## Rollback
`git revert -m 1 8e7d262` (page only), on Chad's own Approve line.
