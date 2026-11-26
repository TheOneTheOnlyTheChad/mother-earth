# Moon temperature (Diviner) — release record (26 Nov 2026)

**Released:** merge `0622e80` on `main` (14:50:35 UTC commit time, pushed 14:51:04 UTC by clock reading) of `moon-diviner-ui` at `310ca1e`. Page only. No hub, R2, D1, collector or schedule change.

## Approval and review
- **Chad's own line (26 Nov 2026):** "Approve: release Moon temperature from `moon-diviner-ui` at `310ca1e` to main, page only; no hub deployment. Verify the live site against GPT's reviewed 44-file manifest and record the live layer check, then complete this item's release cleanup and update the full Moon checklist."
- **GPT's release review:** PASS for release content at `310ca1e`, page only. Filed unchanged as `reviews/2026-11-26-moon-diviner-release-rc-gpt-review.md` (from the Mac's `ChatGPT/Mother Earth/MOON-DIVINER-RELEASE-RC-REVIEW-2026-11-26.md`, sha256 `43e75389…b8f3`).

## Merge
- `main` had moved by one docs-only commit since the candidate's merge of fresh main: `7b31adf` (checklist rev 9, STATUS, HANDOVER, and the rev 2 recheck, which was already on the branch byte for byte).
- The merge was clean. **`0622e80` differs from `310ca1e` only in `HANDOVER.md`, `STATUS.md` and `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`.** No served or executable byte changed after GPT's review, so nothing went back for re-review (GPT's release-execution step 1).
- `node phase1/moonsci/served_manifest.mjs --check` on the merged tree: 44 files (35 root page files + 9 assets) match.

## Served verification (browser pane, live site)
- **Manifest:** GPT's reviewed `reviews/evidence/2026-11-26-moon-diviner-manifest.json`, taken from `310ca1e` (sha256 `7bf9576a…2f78`, equal to the hash in GPT's review). It was not regenerated after the merge.
- **Method (per GPT's step 3):** the expected list was built from that reviewed manifest file itself, not from the helper's working tree. Each of the 44 paths was fetched from `https://theonetheonlythechad.github.io/mother-earth/` with `cache: 'no-store'` and a cache-busting query; its byte length and sha256 were compared. The check ran in the page and its result was read back (one call cannot wait for 44 fetches).
- **Result:** 44 checked, **44 match**, 0 differ, at **2026-11-26T15:01:09.134Z**.
- The Pages build itself could not be read (the GitHub Pages API is not reachable from the workspace). The live `moon.html` carried `moonsci.js?v=202612261400` and the `sources.html#moontemp` link at 14:58:07 UTC; the hash check above is the evidence.

## Live layer check (browser pane, `moon.html`, 15:02:32 UTC)
Driven through the page's own buttons and radios, on a fresh load. Two runs, one per starting lighting choice.

| Step | Run A: "Lit as now" off before entry | Run B: "Lit as now" on before entry |
|---|---|---|
| Temperature on (noon) | active `temp-noon` in 1,235 ms (first load of the file); Lit off | active `temp-noon` in 102 ms (cached); Lit off |
| Centre read, noon | 394.5 K (121.4 °C), mean of 2 bins, range 0 K, cell centred 0.25°S 0.25°E | same |
| Midnight | active `temp-mid` in 111 ms | 101 ms |
| Centre read, midnight | 101.6 K (−171.6 °C), mean of 4 bins, range 1 K | same |
| Height | active `height` in 103 ms; Lit off | 101 ms; Lit off |
| Height off (leave science mode) | active none, nothing pending, saved state cleared; **Lit stays off**; temperature legend hidden | active none; **Lit restored on**; legend hidden |

- **Readout values checked independently:** the served gzip, decoded in the workspace, gives row 180, column 0: noon 394.5 K, n 2, range 0; midnight 101.6 K, n 4, range 1. They equal the page's readouts.
- The mode radios were enabled while the layer was on. The page's "Details" link to `sources.html#moontemp` is present. The Earth view was not open before entry and did not open (saved `earth: false`). No console errors.
- **A first attempt stopped on the checker's own mistake:** in its second run, the midnight radio chosen in the first run was still selected, so the layer correctly opened at midnight while the script waited for noon. The page was reloaded and both runs repeated with the radio set to noon before each entry (the table above).
- **Look:** one screenshot of the noon map at the pane's width. It showed the viridis map with thin dark streaks: the no-data cells (orbit-track gaps, 1.43% of shown noon cells, global report §6.4), drawn in the reviewed no-data style.
- Functional check only. It measures neither rendering cost nor performance.

## Not verified
A real phone, Safari, a screen reader and a verified hardware renderer, as stated in the release packet and GPT's review.

## Carried to a later documentation update (GPT's note)
Sources' "switching it off brings sunlight back" is shorthand. The code and tests restore the prior lighting choice, including an initially off one (run A above). Wording only; it does not change the released code.

## Rollback
`git revert -m 1 0622e80` (page only), on Chad's own Approve line.
