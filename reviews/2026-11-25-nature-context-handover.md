# Nature context: handover at thread close, 25 Nov 2026 (next thread: "Soil 2")

Paste the block below into a new thread in the Mother Earth project.

```
HANDOVER: Soil 2 (Mother Earth project). Continues the Nature context thread. State at 25 Nov 2026, 14:50 SAST (12:50 UTC clock reading).

WHO AND HOW
- Chad owns Mother Earth (his personal control centre, not for the public) and approves. Claude implements and deploys.
  GPT reviews independently. Its reviews are in the Mac folder /Users/chadobie/Documents/ChatGPT/Mother Earth/ and are
  filed UNCHANGED in the repo's reviews/ folder.
- Messages for GPT give repo paths plus a commit, not pasted content. Talk to Chad in SAST ("bro" is fine), concisely, no apologies.
- YOU HAVE FULL ACCESS AND CHAD'S EXPLICIT, STANDING PERMISSION to change, copy, replace, update, save, commit, push, deploy and
  delete anything in GitHub, Cloudflare and the rest. Don't ask him again for access he has already given, and don't hand steps
  back to him. You have the browser extension (Claude in Chrome) and the built-in browser pane. GitHub and Cloudflare are logged in
  there, with tabs left open. You have the Mac shell (a Linux VM on his MacBook, folders mounted under ~/mnt) and the cloud
  workspace. If a folder or sign-in is missing, ask and he grants it.
- What still needs Chad's OWN words, never GPT's text relayed: an "Approve: ..." line for anything going live (a page release
  to main, a hub deploy), and a "go" for new downloads or new work. Docs-only commits go straight to main.
- Standing rules:
  - Repo TheOneTheOnlyTheChad/mother-earth is public: no phone, email or precise address in it; research stays text only (no PDFs).
  - Never force-push.
  - STATUS and HANDOVER times come from a real clock (or are labelled "commit time").
  - Mac sync is preserve-first.
  - Close-out (START-HERE section 9): Mac _review/ moved into _to_delete/; merged branches deleted; Mac synced; handover note.
  - Dated and modelled datasets are allowed (standing decision, 24 Nov 2026). Label models as models, state period and version,
    check for new versions before freezing, keep the last-checked date visible, keep earlier versions.
  - Read methods in full text before finalising an assessment; summarising fetches are discovery only.

READ FIRST (repo main, Project copies under claude/)
1. START-HERE.md: the top "Live page = merge 01c789c" line, and section 9.
2. STATUS.md: the 25 Nov entries, newest first. "Organic-soil emissions LIVE ... and the Nature context close-out" holds the list below.
3. HANDOVER.md: "NATURE CONTEXT, NEXT THREAD STARTS HERE (25 Nov 12:50 UTC)".
4. docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md (GPT's original spec) and docs/concepts/NATURE-CONTEXT-SOIL-PROPOSAL.md (rev 3, cleaned).
5. docs/research/soil-c1/: soil_build.py (the 1 km to 4-degree builder), soil_reference.py (the page's contract),
   soil_controls.py, the assessment notes and SOIL-C1-TABLES-CHECK-2026-11-25.md.
6. The REGISTER entry "WRI Land & Carbon Lab et al. — Global organic soil disturbance ... v1.0.1".

WHERE THINGS STAND
- LIVE: "Organic-soil emissions (modelled)", page only, merge 01c789c (25 Nov 14:46 SAST), on Chad's Approve line.
  All 30 served files were hash-verified (29 root .html/.js/.css plus assets/soil/g4-soil-v1.0.1.json).
  - What it is: an optional, off-by-default globe layer (drained OR burned, never added; 2021-2024 yearly average; t CO2e per
    year per whole 4-degree cell; fixed decade classes on one ochre ramp), plus a row in "Everything here", a stacked inspector
    and a Sources section.
  - Data: Glen et al. 2026 model outputs v1.0.1, Zenodo 22137130, CC BY 4.0. Table: 790 records, sha256 c5c01ff5...30cf.
    New page file soil.js. app.js unchanged.
- Hub: 0.6.25, unchanged by this work.
- Earlier the same day: the forest wording fix (Nature context Workstream A) went live 24 Nov, main 782da28.
- The Animals thread delivered journey context C1a (zebra).
- Tests (cloud workspace):
  - Run with NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules and python3 -m http.server 8899 in the repo
    root, plus OH_SNAPSHOT_DIR for oceanheat-ui.
  - Fixtures, if missing: build /home/claude/fixtures/orbital.csv with node phase1/orbital-fixture.build.mjs; the ocean-heat
    snapshot is on the Mac at research/ocean-heat/2026-11-10-claude/oh-snapshot-R1.zip.
  - phase1/soil-ui.test.cjs: 47 checks (OLD=1 and 13 named BREAKs must fail).
  - Animals suite: holds index.html, sources.html, layers.js and the Bare Earth suite to SOIL_MAIN 86071bf (13b, 13c, 13e),
    with 13m (literal 11-file manifest af89de2..86071bf) and 13n. NC_MAIN 90eb522 keeps 13j and 13k. Any future soil change to
    those files needs the same narrow, reviewed pin maintenance: no blind moves, and BASE_MAIN and TL_MAIN do not move.
  - Nine page suites fail on main exactly as before (drifters, kept, osmc-reliability, place, search, smoke-fixes, terminator,
    timeline-mixed-assets, ux-round1). They are unrelated and recorded.
- Environment limits:
  - The workspace git proxy refuses branch deletes (403): delete merged branches on the GitHub branches page in the pane.
  - The workspace cannot reach github.io or zenodo.org: use the browser pane (served-hash checks by fetch plus crypto.subtle
    in a github.io tab; Zenodo API pages).
- Not verified: real phone, Safari, screen reader.
- Branches left (unmerged, other owners): animals-assessment-rc, cape-town-public-proposal, cape-town-station-rc,
  earth-from-space-fixtures-rc, earth-from-space-rc, earth-from-space-stage-d-docs-r2, widths-preview-rc. Don't delete them.
- Soil maintenance due: check Zenodo record 22137130 for a new version MONTHLY (first due about 25 Dec 2026) while the
  publishers' open 30 m release is pending, then quarterly, and on any erratum. Keep 1.0.1 and review any new version before
  replacing it.

FIRST THING TO DO: once oriented, bring Chad this list of what is still open from the spec, and ask him which to take on.
Nothing on it is approved yet; each needs his go.

STILL OPEN FROM THE NATURE CONTEXT SPEC (soil first)
1. MORE SOIL:
   - The spec names soil carbon STOCK and STOCK CHANGE beside the emissions we shipped. Each needs its own assessment, with
     stock, change and emissions kept distinct (depth, period, units). Candidates: the WRI mineral-soil stock-change data
     (ESSD 2026, doi 10.5194/essd-18-989-2026) and SoilGrids.
   - Possible additions to the live layer: a period switch, a per-km2 (intensity) view, and the publishers' open 30 m release
     once it appears.
2. The hub's forest "quantity" string still says "published". The page already prints the corrected wording. Fix it in the next
   reviewed hub release, coordinated with the Earth from Space owner, on its own Approve line.
3. Global integrated disturbance alerts (gfw_integrated_dist_alerts: daily, 10 m, global, four systems including DIST-ALERT).
   A docs-only assessment of extending forest context beyond the tropics. Parked by Chad 24 Nov.
4. GNW fire alerts against FIRMS: an overlap and lineage assessment before any second fire feed (spec section 5).
5. Alert completeness: date fields, late confidence changes, lookback (spec section 5). The page states its aggregate limits;
   event-level handling would need its own design.
6. Journey context beyond the zebra (Workstream C): owned by the Animals thread.
7. Reading only: Horizon, and EarthRanger/SMART as a reference. WRI webinar 3 Dec 2026, 16:00-17:00 SAST (no registration made).
```
