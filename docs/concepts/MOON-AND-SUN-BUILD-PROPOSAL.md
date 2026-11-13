# Moon and Sun spacecraft — build proposal rev 2 (hub-first)

Written 13 Nov 2026 07:06 UTC (clock reading). **Docs only. For GPT's review, then Chad's decision. Nothing here is built, deployed, registered or scheduled.**

Follows GPT's proposal rev 1 (`docs/concepts/MOON-AND-SUN-SPACECRAFT-PROPOSAL.md`), Claude's review and Chad's decisions (`reviews/2026-11-13-moon-sun-proposal-review.md` §1–§6), and GPT's review of §6 (relayed by Chad 13 Nov).

## 1. Decided (Chad, 13 Nov)

- **D1 = C.** Today's position where it can be shown honestly, plus a dated definitive example. Different rules per mission.
- **D2.** Browser Back and "Back to Earth" reopen Sky at the originating stop. Full camera restore later.
- **D3.** Lightweight 2D pages, reached from Sky and by shareable link. Header tabs unchanged.
- **Hub first.** The hub (Cloudflare Worker) collects from the provider's API on a schedule. Manual export is the fallback, not the design.
- **LRO marker for today: off** (unvalidated; archived predictions are not published). GPT: today's LRO *path* is also withheld until it passes its own shape and orientation check in the chosen projection.

## 2. What release 1 shows

| Page | Arriving from Sky (today 00:00 UTC) | Direct visit, or "View a dated example" |
|---|---|---|
| **sun.html · Parker Solar Probe** | Marker and path segment from the hub's stored Horizons snapshot, when it covers that exact time. Label: **Predicted position · NASA/JPL Horizons · [UTC]**, with Horizons' own words for the segment ("reference planning trajectory" after the 29 Sep 2026 fit). Details show the retrieval time and the source solution name and dates. | 22–27 Dec 2024 encounter (hourly), as in rev 1. NASA's closest-approach figure attributed to NASA; the closest hourly sample labelled separately. |
| **moon.html · Lunar Reconnaissance Orbiter** | "No validated position for this time." No marker, no path. One sentence on why: predictions for a two-hour lunar orbit lose their place along the orbit, and this one has not been checked. Offer the dated example. | 10–11 June 2026 (30 s samples) from the definitive PDS kernel `lrorg_2026074_2026166_v01.bsp` (label read 13 Nov: FDF/GSFC, ACTUAL, "Regular Definitive"). Label: **Calculated position · NASA/GSFC FDF definitive trajectory · [UTC]**. |

Common to both, from rev 1 and unchanged: one scene time drives marker, segment and label together; lines break at missing samples; the mission list and source details stay usable with no geometry; a missing or invalid data file leaves the page readable; any enlargement or distance compression is stated beside the view; the viewing direction of the 2D projection is named, with a near/far treatment.

## 3. Open question for GPT and Chad: which source for Parker's dated example

Rev 1 uses the SPDF hourly product (CC0; its record does not classify rows). Horizons also covers December 2024 and classifies it (`spp_nom_20180812_20251001_v041_RO8`, inside the tracking fit).

- **P-a (rev 1):** SPDF hourly for the example, Horizons for today. Two sources, two REGISTER entries, an independent cross-check for free.
- **P-b:** Horizons for both; SPDF used only as the independent check at the three named hours. One source and one frame on the page, finer cadence available, provider classification on both.

Claude leans **P-b**. Either way the three-hour comparison in rev 1 is kept.

## 4. Hub design

Pattern: Dust RGB (pointer + previous pair, conditional writes, gate variable, last good kept).

- **Gate:** `SKYCRAFT_ENABLED=1` (absent = no request at all).
- **Schedule:** once a day on the existing hourly trigger, at a fixed UTC hour. No new cron.
- **Requests, serialized (never parallel, scheduled and manual runs share one lock):**
  1. Parker data sheet (`OBJ_DATA='YES'&MAKE_EPHEM='NO'`): revision date and trajectory table.
  2. Parker Sun-centred vectors, hourly, for a window around today (proposed: yesterday 00:00 through +7 days), so Sky's 00:00 UTC stamp is covered across several days even if refreshes fail.
  3. LRO data sheet (study and cadence record only).
  4. LRO Moon-centred vectors at the study epochs (§6). Not published.
- **Per JPL's API rules as recorded in REGISTER** (re-read before the preflight; §8): application-specific User-Agent with contact; one request at a time; only necessary requests; cache and reuse; back off on failure (no retry inside a run; the next daily run is the retry); check the API version field and refuse an unexpected one.
- **Validation before publishing:** JSON envelope and API version; `$$SOE/$$EOE` block present; every returned epoch equals a requested epoch; finite numbers; centre and frame lines as requested; Parker centre distance inside a sanity band; the data sheet's trajectory table parsed, and the segment covering each epoch named. Anything else → no publish, last good stays.
- **Stored (R2):** raw responses with retrieval time and sha256 (kept: they are the study's evidence and the provenance of what is shown); a validated snapshot JSON; a pointer written conditionally (create-only or etag match), as Dust RGB.
- **Served:** `GET /snapshot/skycraft/meta` (pointer) and `GET /snapshot/skycraft/<id>` (immutable, hash-checked). The browser reads only the hub; it never calls Horizons.
- **Failed refresh:** the page keeps the last valid snapshot and uses it **only for timestamps it actually covers**. Outside them: "Position unavailable for this time".
- **Dated examples** are fixed, pinned, hashed files served like the Sky catalogue (`/catalogue/skycraft/<revision>`); prepared once, never refreshed.
- **D1:** one `collector_runs` row per run (existing table). No schema change.

## 5. Page design

- New page files: `moon.html`, `sun.html`, `craft.js` (shared), styles scoped under `body.craft` in `style.css`. Served-hash checks go from eleven files to fourteen.
- **2D view:** an SVG drawing of the body-centred path projected onto a named plane (proposal: Parker — looking down on the Sun's equator, HGI; LRO — a fixed J2000 view chosen so the polar orbit reads as an ellipse, direction stated). Near side drawn solid over the body, far side dashed behind it. No three.js on these pages.
- **Time in the URL:** `?t=<UTC ISO>`; selecting a sample rewrites it (replace, not push) so a shared link reproduces the view.
- **Sky side (`index.html`, `skyscene.js`):** ordinary links "Explore the Moon" / "Explore the Sun" in the zoom bar, shown when that body is shown, carrying the scene's displayed time. On click, the stop (Earth / + Moon / + Sun) is saved against the current history entry (`history.replaceState`); on return (Back, or "Back to Earth" which calls `history.back()` when the visitor came from Sky), the globe page reopens Sky at that stop and focuses the Explore link. From free orbit: reopen at the stop of the body followed. Direct or new-tab visits get a plain link to the globe. Sky's own close control is unchanged.

## 6. LRO forward study (runs beside the feature; publishes nothing)

**What it measures (GPT's correction):** prediction error = a frozen forecast compared with a *definitive* trajectory at the same instants, Moon-centred, same frame. Reference: the PDS definitive SPK when it reaches those dates (the archive arrives in quarterly files, months later — the June file was created 3 Sep), or a later Horizons result only if its data sheet explicitly places those instants in "Reconstructed trajectory". Two predictions compared with each other measure solution change, reported separately and never called error.

**Daily capture:** for target epochs at leads of 0, 1, 3, 7, 14, 21, 30, 37, 45 and 60 days from capture, each lead sampled at four instants 30 minutes apart (LRO's period is about two hours, so the four span the orbit's phases). 40 epochs in one TLIST request. Fixed UTC instants, so successive days' targets overlap exactly.

**Kept per capture:** raw response, retrieval time, data-sheet revision date, trajectory table (solution names and spans), target epochs. Two ages tracked separately: forecast lead (capture → target) and solution age at the target (solution issue → target). Repeated pulls of one solution establish refresh cadence; **strength of the result is counted in distinct solution vintages**, not in pulls.

**Set before any comparison:** the display tolerance. Proposed: along-orbit error under 2° of orbit (about 60 km, about 40 s of motion) for a marker; orbit-plane orientation within 1° and radius within 10 km for a path. GPT and Chad to agree or change before data is compared.

**Reported:** along-track, radial and cross-track error by lead and by solution age; maneuver periods marked where a record identifies them (none found published so far; say so if still none).

**Honest timing:** the first definitive reference for epochs captured now arrives around the first quarter of 2027. Until then the study yields refresh cadence and solution-change figures only. The marker stays off throughout.

## 7. REGISTER (each on Chad's own line, before release)

- Horizons entry: extend scope to spacecraft (-96, -85), Sun- and Moon-centred vectors, **scheduled hub request** (replacing "one manual export per refresh" for this use), with the User-Agent actually sent.
- LRO PDS SPICE data set (definitive kernel, dated example).
- SPDF/CDAWeb Parker hourly product (CC0; requested acknowledgement) — as the example source under P-a, or as a cited cross-check under P-b.
- NASA encounter report (closest-approach figure) as a cited statement.

## 8. Order of work and approvals

1. GPT reviews this rev; Chad decides §3 (P-a / P-b) and §6 tolerance.
2. Re-read JPL's API documentation and fair-use rules for a once-daily scheduled request (text only, pane). Stop if anything forbids it.
3. Branch build `skycraft-rc`: hub job behind the gate, routes, pages, suites with breaks. No merge, no deploy.
4. Prepare the two dated examples (LRO kernel via SPICE; Parker per §3), with rev 1's three-point numerical checks recorded.
5. GPT reviews the candidate.
6. **Preflight (GPT):** deploy the hub with the gate unset and run **one** manual request from the real Worker with the application User-Agent — the only test that settles reachability. `Approve: deploy hub <version> … (gate unset) and run /admin/run/skycraft once`.
7. `Approve: set SKYCRAFT_ENABLED=1`; first scheduled run read in D1.
8. REGISTER lines; live candidate check from the Pages origin; `Approve: push skycraft-rc to main (page change: …)`; served hashes; live read.

**Not proposed:** a Workers Playground probe. It is not the real Worker path (the Dust thread's Playground probes disagreed with production), so step 6 is the reachability test.

## 9. Cost

No new line item expected: one daily invocation share, four small requests, raw responses of a few KB a day in R2. Worker CPU measured at the preflight and reported before the schedule is enabled.

## 10. Not in release 1

LRO marker or path for today; Solar Orbiter; other missions; header tabs for Moon/Sun; full Sky camera restore; lunar surface orientation or lighting (plain disc only).
