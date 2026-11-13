# Moon and Sun spacecraft — Claude's review of GPT's proposal rev 1

Written 13 Nov 2026 06:56 UTC (clock reading). Docs only. Nothing built, fetched in bulk, registered or deployed.
Proposal: `docs/concepts/MOON-AND-SUN-SPACECRAFT-PROPOSAL.md` (GPT, relayed by Chad 13 Nov).

## 1. Bottom line

The page design is sound and fits the Sky pattern (pinned, hashed, dated catalogue; "Calculated position" label; geometry withheld when a file is bad). One thing should be decided before anything else:

**Both proposed snapshots are historical (June 2026, December 2024), so every visitor arriving from Sky lands on "Position unavailable for this time".** On 12 Nov Chad stopped Follow the Dust for this reason ("we want live feeds"; "unless we can find a live feed we are making a mistake adding static images"). A source that covers today exists and is already in REGISTER: NASA/JPL Horizons.

## 2. What I checked (13 Nov, 06:50–06:56 UTC, browser pane on ssd.jpl.nasa.gov unless stated)

| Check | Result |
|---|---|
| Horizons LRO (-85) data sheet, revised 7 Oct 2026 | Trajectory table: reconstructed 2009-Jun-18 → 2026-Jun-15 00:01 TDB (from PDS); "Concatenated predict updates" 2026-Jun-15 → 2026-Oct-07; prediction file `558day_20261007_01` 2026-Oct-07 → 2028-Apr-16. Text: preliminary "tag-up" solutions begin 2026-Jun-15, prediction after 2026-Oct-06. |
| Horizons Parker (-96) data sheet, revised 3 Nov 2026 | "Fit to post-launch tracking data through 2026-Sep-29. Reference planning trajectory for subsequent times." Segment table runs to 2030-Jan-01; current segment `spp_pred_20260930_20270217_od268_v001` (2026-Sep-30 → 2027-Feb-17). |
| One VECTORS row each for 2026-11-13 00:00 UTC | LRO, Moon-centred: returned; centre distance about 1,811 km (about 73 km above a 1,737.4 km Moon; my arithmetic). Parker, Sun-centred: returned; about 84.4 million km (about 0.56 au; my arithmetic). Sanity only; raw bytes not archived. |
| SPASE record for PSP_HELIO1HR_POSITION (Claude's web-fetch summary — a lead, not an extraction) | Matches the proposal: DOI 10.48322/ecnj-rx61; 2018-08-13 → 2025-08-30; hourly; RAD_AU plus HGI latitude/longitude; no reconstructed/predicted statement. Also: CC0 1.0, and a requested acknowledgement (N.E. Papitashvili, the data providers and CDAWeb, with an "Accessed on" date) that the proposal does not carry. |
| LRO PDS label `lrorg_2026074_2026166_v01.lbl` | **Not read by me** (the fetch tool returned no text). Consistent with Horizons' "reconstructed … 2026-Jun-15" line, but the label's own wording rests on GPT's reading. |

So the provider classification the proposal wants is available from Horizons for both spacecraft, including for today.

## 3. Options for D1 (Chad's decision)

- **A. As proposed:** historical definitive snapshots only. Strongest evidence grade. Sky link always lands on "unavailable".
- **B. Today from Horizons:** a pinned dated catalogue that covers the current date, as the Sky pair already does (one manual export per refresh; the page never calls Horizons). The Sky link lands on a real position, labelled with Horizons' own classification.
- **C. Both:** today's position (B) as the default, the dated definitive example (A) as "View a covered example" and as the direct-link default.

My read: **B or C for Parker is straightforward** (heliocentric path; the current segment is a tracking-based prediction to Feb 2027; refresh with the Sky pair by 2027-06-01 would need an earlier date).

**LRO is the hard one, and it is unmeasured.** Today's LRO position comes from a prediction issued on 7 Oct. LRO circles the Moon about every two hours, and where it is along that orbit is the part predictions lose first. Before showing "LRO now", measure it: compare a past predict against the later reconstructed trajectory for the same times, and report the along-orbit difference by prediction age. Three honest outcomes: (i) the error is small enough to show a marker; (ii) show the orbit path for today and withhold the marker ("orbit predicted; position along it not reliable at this age"); (iii) keep LRO fresh with a small daily hub fetch like Dust RGB. Outcome (iii) is a collector and needs the Horizons access conditions re-read for scheduled use (REGISTER records: one request at a time, application User-Agent, cache and reuse, API not embedded in a website).

## 4. Smaller points on the proposal

1. **Return to Sky is the largest piece of work, not the pages.** `skyscene.js` has no browser-history handling today (no pushState/replaceState/popstate; open state lives in memory). Saving stop, free-orbit camera and target against a history entry, restoring after reload and across a UTC rollover is a new history model on the globe page. The Timeline history model took several review rounds. Suggest release 1: plain links out; Back and "Back to Earth" return to the globe page and reopen Sky at the stop the visitor left (no free-camera restore). Full state restore as a follow-on. (D2.)
2. **Rendering is unspecified.** The globe page gets three.js through globe.gl. The new pages need either their own three.js load or a simpler drawn view. Decide before build; it sets page weight and the test approach.
3. **Tabs and file count.** Header tabs are Earth now · Timeline today. Say whether Moon and Sun appear there or are reached only from Sky. Served-hash checks grow from eleven files to at least thirteen plus the two data files.
4. **REGISTER before release:** new entries for the SPDF/CDAWeb Parker product (CC0, acknowledgement wording) and the LRO PDS kernel under option A or C; a scope extension of the Horizons entry (spacecraft, Moon- and Sun-centred vectors) under B or C. Each on Chad's line.
5. **LRO kernel handling (A or C):** needs SPICE in the workspace and the kernel file plus leap-second kernel; NAIF may be reachable only from the pane, and the kernel may be large (size not checked). Likely Chad downloads it, as with the NOAA files.
6. **Solar radius:** 695,700 km is already in REGISTER from the Horizons Sun data sheet ("Solar radius (IAU2015)"). Reuse that citation.
7. **Agreed as written:** closest-approach wording (NASA's figure attributed; hourly closest sample labelled separately), one scene time, breaks at missing samples, text fallback, the three-point numerical checks, no new Worker route under option A.

## 5. Decisions

- **D1:** A, B or C (section 3). If B or C: approve the LRO prediction-age measurement first (read-only, research).
- **D2:** return behaviour for release 1: simple reopen-at-stop, or the full state restore as proposed.
- **D3:** rendering approach and whether Moon/Sun get header tabs.

No build, REGISTER filing or production step is approved.

## 6. Decisions and the LRO prediction-age measurement, step 1 (added 13 Nov 2026 07:02 UTC, clock reading)

**Chad, 13 Nov:** "Go: LRO prediction-age measurement (read-only research), and D1 C / D2 reopen at stop / D3 2D view via Sky as GPT recommends". Also: **no manual exports as the design — the hub (Cloudflare) connects to the API first; manual is the fallback.** This replaces "manual, pinned exports" for release 1.

**GPT's corrections accepted:** Parker's point for today is on Horizons' "reference planning trajectory" (after the 29 Sep fit), and is labelled so; the named Parker segment ends 17 Feb 2027; the LRO radius check says nothing about along-orbit position.

**Step 1 result: the predictions as issued are not published where I looked, so the retrospective measurement cannot be run.**

| Read (browser pane, naif.jpl.nasa.gov, 13 Nov ~07:1x UTC) | Result |
|---|---|
| `/pub/naif/LRO/kernels/aareadme.txt` | "Most operational SPICE data for LRO are produced by and reside at the LRO Mission Operations Center at the Goddard Space Flight Center (GSFC). These data are not made available to NAIF and, therefore, are not present on the NAIF server." The folder holds ck, fk, ik only. |
| PDS archive `lrosp_1000/data/spk/` | Only merged definitive files (`lrorg_*`) and `de421`. No predicted files in the listing read (first 80 links) and none described in the data-set catalogue (reconstructed and planetary SPKs only; web search result, a lead). |
| Label `lrorg_2026074_2026166_v01.lbl` (now read directly) | PRODUCER_ID "FDF/GSFC"; PRODUCT_VERSION_TYPE ACTUAL; START 2026-03-15T00:00:00; STOP 2026-06-15T00:00:00; PRODUCT_CREATION_TIME 2026-09-03T13:42:31; "Merged SPICE SPK file containing Regular Definitive LRO Spacecraft trajectory." Matches the proposal. |
| `/pub/naif/LRO/misc/` | No trajectory predictions (clock, frame and LROC delivery archives; not opened). |

**Published context (web search results, leads, not extractions):** Goddard Flight Dynamics papers (2014–2015) give the LRO requirement as predicted accuracy under 800 m over an **84-hour** span, and say maneuvers were then needed every two to four weeks. A 37-day-old prediction is far outside that span. No published figure for error at that age was found.

**Consequence (GPT's rule):** the "LRO now" marker is unvalidated and is not shown.

**A measurement that can be run, going forward, and that fits hub-first collection:** a daily hub read of Horizons for LRO records (a) the data sheet's revision date and trajectory table, and (b) the predicted positions for the next days. **Corrected 13 Nov after GPT's review:** a newer Horizons solution for the same instants shows only how much the solution changed. Prediction error needs a *definitive* reference at those instants: the PDS definitive SPK, or a later Horizons result whose provenance explicitly says reconstructed. The stored record supplies the frozen forecasts and shows how often Horizons refreshes LRO. Design: `docs/concepts/MOON-AND-SUN-BUILD-PROPOSAL.md` §6. Not started; needs a proposal, a Worker reachability check for the Horizons API, and a re-read of the JPL API rules for a once-daily scheduled request.

**Proposed shape for the build proposal (rev 2, not written yet):** Parker today from a hub-collected Horizons read, labelled with Horizons' classification, plus the December 2024 encounter example. LRO: the definitive June 2026 example; for today, no marker; a predicted orbit path only if its shape and orientation pass their own check (GPT). 2D view, entry from Sky, reopen at the originating stop.
