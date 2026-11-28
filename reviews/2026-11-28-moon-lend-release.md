# Moon item 6 (LEND) — release record

28 Nov 2026 · Claude · page only; no hub, R2 or collector change; no north or other acquisition.

**Chad's Approve line (his message, 28 Nov):** "Approve: release the Moon south-polar LEND record from moon-lend-ui at 5ed9d70 to main, page only; no hub deployment or north acquisition."

**GPT:** release review PASS on candidate `5ed9d7041445aa557e326f5c8f583957526bc641`. Filed unchanged as `reviews/2026-11-28-moon-lend-release-rc-gpt-review.md` (sha256 `232e9859…d493`, equal to the Mac copy).

## Merge

- **Main recheck before the merge (01:44 UTC):** `origin/main` was `90c457e`, my docs-only records commit. Since the candidate's main base `b67358d` it changed only `HANDOVER.md`, `STATUS.md` and the checklist, none of them served. Served code had not moved.
- **Merge:** `25993bf` merges `5ed9d70` into `90c457e`, commit time 01:44:38 UTC, pushed 01:44:49 UTC. The merged tree differs from `5ed9d70` only in those three record files.
- **Before pushing:**
  - the manifest at the merged tree has sha256 `4764f405a45fb8584c0dbafdd569b4575db6b9fa35337018609c7b79c7416861`, equal to the reviewed hash;
  - all 55 listed files match that tree;
  - `served_manifest.mjs --check` reports 55 match.
- **Records-only merge:** `a46d218` merges the branch head `7f851cc`, which adds only the release-candidate packet and the preview-packet erratum. No served file changed.
- **Rollback:** `git revert -m 1 25993bf`.

## Served verification (01:47:03 UTC, browser pane, `cache: 'no-store'`)

- **Publish:** GitHub Pages ("pages build and deployment") for `25993bf` completed successfully at 01:45:43 UTC.
- **Method:** every path was fetched from `https://theonetheonlythechad.github.io/mother-earth/` and compared on HTTP status, byte length and sha256.
- **Expected list:** taken directly from the reviewed manifest file `reviews/evidence/2026-11-27-moon-lend-manifest.json` at `25993bf`, after checking its sha256 equals the reviewed `4764f405…`. It was not regenerated from a later tree.
- **Result:** **55 of 55 match**; no mismatches.

## Live check (01:47–01:48 UTC, browser pane; one bounded run in the active foreground tab)

This is a bounded functional check. It is not a performance test and not a full regression test.

- **Released files loaded:** the page was reloaded and loaded `moonsci.js?v=202612272000` and `moonsci.css?v=202612271700`.
- **Off by default:** the toggle shows `aria-pressed="false"`, the legend is hidden, the coordinator is idle (`active` null), and there was no request for the LEND file.
- **Open:** I switched "Lit as now" on first, then opened the map. The coordinator reached `lend` with one commit, and the lighting was saved as "on" and shown evenly lit while the map is on. The legend is visible and opens with the archived-field wording. There was one request, for `lend-alds-2011-2016-R1.bin?v=1`.
- **South pole and centre:** both buttons are visible and work. Centre readout after "south pole": 85.00°S, 0.00°E, −0.2% ± 0.3 pp, 129 archived cells in the 60 km disc, cell centred 85.25°S, 0.25°E, exposure 503 s.
- **Readouts by state** (from the page's own text, for cells read from the served file):
  - **Shown:** the cell at 88.75°S, 84.25°E (stored −0.84% and ±0.35 pp, 531 cells) reads −0.8% ± 0.3 pp. See the observation below.
  - **Not in the archive:** 89.75°S, 0.25°E: "nothing is filled in from neighbouring cells".
  - **Withheld by the error rule:** 89.25°S, 30.25°E: estimate above 0.5 pp, flagged "near the archive's missing cells around the pole".
  - **Withheld at the edge:** 80.75°S, 0.25°E: the disc runs past the product's 80°S edge.
  - **Outside coverage:** 79.9°S: "covers 80–90°S; north of 80°S the usual picture is shown".
- **Switching layers:** LEND → height left LEND hidden and unpressed, with the saved lighting kept. Height → LEND re-entered with no second LEND request (still one; this claim is for the LEND file only). LEND → off left the coordinator idle and restored the prior lighting: "Lit as now" is on again (`aria-pressed="true"`). The legend, readout and buttons are hidden again.
- **Details:** the link `sources.html#moonlend` reached the section "Moon neutron record — LEND on LRO, south of 80°S, 2011–2016 average…" at the top of the view, and the shortcut is present.

### Observation for GPT and Chad: readout rounding at exact ties (not changed)

- **What the page does:** it formats the stored hundredths with `(v / 100).toFixed(1)`. In binary floating point, a stored value such as 0.35 sits a hair below 0.35, so it rounds down. The builder, by contrast, rounds half away from zero.
- **How often:** across the 11,656 shown cells, measured on the served file,
  - **530** cells show the ± 0.1 lower than half-away rounding of the stored value would give (0.35 shows as 0.3); none shows higher;
  - **456** cells show the percentage 0.1 nearer zero.
- **Against the contract:** this fits the frozen wording ("readout rounded to 0.1", proposal §10), which sets no rule for ties. But at exact ties it understates the shown estimate by 0.05 pp.
- **The colour map is unaffected:** it uses the stored hundredths.
- **What was done:** I did not change released code. The proposed fix is to round the integer hundredths half away from zero before formatting, with tests at the ties. It needs its own review and Chad's go.

## Records

- REGISTER entry marked live, with the merge, the served check and rollback.
- Checklist rev 33: item 6 done, plus the §11 limits.
- STATUS and HANDOVER updated.
- Review logs: both Mac review folders (`_review/moon-lend-ui/`, 57 files; `_review/moon-lend-rc/`, 84 files), each checked against its SHA256SUMS, are kept as `reviews/evidence/2026-11-28-moon-lend-review-logs.tgz` (1,142,555 B, sha256 `7a1fe72f0f911db24fb5550f0b5c501cf9ea7e332c56f42df7cb07f555c88ffc`; 143 files). It holds logs, code copies and six screenshots: no PDFs and no secrets.

## Qualified exceptions (GPT's release review)

- **osmc-reliability-ui** stops at the unavailable historical commit `0386058` on both the candidate and main. That makes it an **incomplete test caused by missing fixture history**. It is not evidence that the OSMC behaviour was tested or passed.
- **smoke-fixes** is an open baseline exception, not a passed smoke test. It shows the same fire-record failures and wait timeout on both the candidate and main.
- **timeline-mixed-assets** reports 16 pass, 2 fail on both; the expected element counts differ because the Moon and Sources content changed.
- **kept-ui and ux-round1:** the failure lines match main.
- **tides-ui T1a** is the branch-scope check: main passes it.

## Not verified (item 11)

Real phone, Safari, a screen reader, hardware rendering and device performance. The live check ran in the browser pane only. GPT's release review added no live-browser claim.

## Close-out

- **Branch `moon-lend-ui`:** fully contained in main (head `7f851cc` merged in `a46d218`). It is deleted from the GitHub branches page in the browser pane after this record is pushed; the deletion is recorded in STATUS.
- **Local worktrees** for this workstream are removed.
- **Raw inputs kept and rechecked at close-out:** `_source-data/moon-lro-science-lend/` on the Mac. `lend_rdr_alds_20111211.dat` (`e6b1c2d5…31ef`) and `lend-docs-labels-2026-11-27.json` (`7283e751…34ab`) match `docs/research/moon-lend/checkpoints.jsonl` by sha256, and the Mac's checkpoints file equals the repo's (`7520b760…`).
- **No next item started.** LAMP (7) and Mini-RF (8) wait for Chad to name the next item.
