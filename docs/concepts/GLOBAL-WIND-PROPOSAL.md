# Global Wind by Height — proposal for GPT review (rev 2)

16 Nov 2026 · docs only · nothing built · no branch, hub deploy, schedule, R2 write, REGISTER filing or page change is approved
**Rev 2:** GPT's review of rev 1 (relayed by Chad, 16 Nov) is in §11. **Where §11 differs from §1–§10, §11 governs.**
**For:** GPT's review, then Chad's decisions (§9). Written on Chad's "go" (16 Nov).
**Brief:** `docs/concepts/GLOBAL-WIND-BRIEF.md` (the spec Chad brought, filed as received). This proposal keeps the brief's experience and changes the route in six places (§2).
**Main:** `cf20e3e` (page merge `9e9769c`, hub 0.6.15).
**What Claude read today and what it did not:** §3 marks each source fact. Nothing was downloaded or decoded. No NOAA host was contacted from the hub.

## 1. What it is

- **An optional globe layer, "Wind", off on load.** Three heights from one NOAA GFS run: near ground (10 m above the model's surface), jet-stream height (250 hPa), stratosphere (10 hPa). Global from the first release.
- **It is modelled, and says so.** Chad accepted a plainly modelled layer on the globe on 16 Nov ("i am happy with 2"). The layer's own line reads "Modelled wind · NOAA GFS · Valid at <date and time UTC>" whenever it is drawn.
- **It passes Chad's 15 Nov rule:** NOAA publishes a new run four times a day.
- **Hub-first.** The hub fetches, decodes, checks and publishes; browsers read only Mother Earth. No Mac job, no manual step.

## 2. Where this proposal differs from the brief

| | Brief | Proposal | Why |
|---|---|---|---|
| D1 | Decode with ecCodes or wgrib2 | A small decoder inside the hub Worker for these six messages; wgrib2 or ecCodes only as the reference the tests compare against | Neither program runs in a Cloudflare Worker. Chad's rule: hub-first, no manual jobs, nothing public depends on his Mac. |
| D2 | Start with the 1° product | Start with the 0.25° product, averaged or sampled to the 1° display grid in the hub | NOAA's notice of 16 Apr 2026 proposes removing the 1° files, their index files and the 1° NOMADS filter with GFS v17 (§3). Building on a file NOAA has said it means to remove would have to be redone. |
| D3 | Stale from 12 h | Set the line after measuring arrival times (§6); expect about 15 h | Files arrive hours after the run's named time and runs are 6 h apart, so a healthy field may already be near 10 h old before the next arrives (arrival time not measured; §3). |
| D4 | Particles or static arrows | Colour field and static arrows in the first release; moving particles tried only in the private preview | Particles are the largest build and frame-rate risk on this globe (B2b, 11 Nov). |
| D5 | Phone check in acceptance | Desktop Chrome only; phone, Safari, screen reader deferred | Chad, 16 Nov: desktop first, phone after the features are done. Reduced-motion and keyboard checks stay. |
| D6 | "Stale", "Unavailable" | The page's existing state words and reasons (`ME.freshness`: adequate, partial, unknown, each with a stated why) | One vocabulary across the page (freshness-wording, 15 Nov). |

## 3. Source facts

| Fact | Status |
|---|---|
| NOAA proposes to remove, with GFS v17, the 0.5° and 1° pressure GRIB2 files, their `.idx` files and the matching NOMADS filters; the 0.25° pressure files are not listed and are described as remaining | **Read 16 Nov** (WebFetch summary of NWS Public Information Statement 26-30, dated 16 Apr 2026; comment deadline 16 May 2026; no v17 date given). The PDF itself was not read line by line. |
| GFS pressure GRIB files use complex packing | **Read 16 Nov** in NWS notices found by search (2014 and 2017). The exact packing template of today's six messages is **not read**; §6 reads it. |
| The 10 m, 250 hPa and 10 hPa U and V messages exist in the f000 file | Brief's claim (inventory checked by GPT). Claude did not open the inventory. |
| Open-data mirrors hold the same files with `.idx` files and accept byte-range requests | **Not read today.** Addresses of the AWS, Google and Azure mirrors were seen in a third-party library's documentation only. |
| Files arrive about 3.5 h after the run's named time | **From Claude's memory, not measured.** The only listings seen today were for a different product (GDAS). |
| Size of one 0.25° wind message: a few hundred KB | **One 2020 example** in third-party documentation (about 287 KB). Not measured. |
| Reuse terms | **Not read.** REGISTER already holds NWS public-domain wording for SWPC; whether it covers GFS output and the mirrors is a REGISTER task before any release (§8). |
| A Cloudflare Worker can reach the chosen host | **Not tested.** OpenSky refused the hub's addresses on 30 Oct; nothing is assumed here. |

## 4. Route

1. **Find the run.** A scheduled hub job looks for the newest run's `f000` index file. No fixed clock time is assumed.
2. **Fetch six messages by byte range** from the index: U and V at 10 m above ground, 250 mb, 10 mb. Open-data mirror first, NOAA's own server as fallback; one host per revision. At most a handful of requests per run.
3. **Decode in the hub.** Check each message is present once; cycle, valid time, grid, units, scan order and component orientation agree across all six; missing values kept as missing.
4. **Make three 1° grids** (360 × 181). Components are reduced first; speed and direction are computed after. Encoding as the brief: two signed 16-bit values per cell, 0.1 m/s, a reserved missing code; 260,640 bytes a level.
5. **Publish as one revision.** Grids written to R2 first, then the manifest (schema version, revision, cycle, valid time, source and display resolution, retrieval and publication times, lengths, hashes). A late or failed import never replaces a newer revision. Current and previous revision kept; older ones removed by the job.
6. **Page.** No wind request while the layer is off. On switch-on: manifest, then the selected level. A level switch keeps camera, selected point and revision. Late responses for a superseded choice are dropped (the Night lights lesson: wording is written from the field actually drawn).

## 5. On the page

- **Labels and levels** as the brief's table; the inspector gives the pressure level and an approximate height.
- **One fixed km/h colour scale across the three levels, non-linear**, chosen from real runs in the preview. Published beside the layer.
- **Inspector:** "From west (270°), 35 km/h", level, valid time. Under 1 km/h: "calm", no bearing. Missing: "No model value here." At the exact poles: speed only.
- **Wording rules.** "Modelled" on every surface that names the layer. Never "measured", "observed" or "current wind". The source panel states that observations inform the model and that global coverage is not a measurement everywhere. Arrows show direction in one frozen run; nothing implies a forecast or the path of an air parcel.
- **If a level fails to load,** the previous level stays under its own label and the failed level is named.
- **Age rules** run while the page is open and when the tab returns. Retrieval and publication times never extend freshness.

## 6. First gate: one real run (research only, needs Chad's go)

Read-only, in Claude's workspace or the browser pane. No hub change.
1. Fetch the newest run's 0.25° `f000` index and the six messages by byte range from one mirror. Record sizes, request count, the packing template of each message, grid and scan order.
2. Decode with a reference tool and with a candidate JavaScript decoder; compare every value.
3. Record the arrival time of that run's file and of the previous three runs (listing times).
4. Check at independently chosen points in both hemispheres, across the date line and at both poles: an eastward vector reads "from west"; a northward vector reads "from south".
5. Report decoder time and memory against a Worker's limits. Stop and report if neither NOAA route gives six clean messages.

## 7. Acceptance for a later private preview

The brief's §5, with D5 applied, plus:
- Hub job proved unattended through a missed run and a failed run before any release.
- Field, legend, card and inspector name the same revision and level, sampled while switching quickly on a slowed connection.
- Frame time with the layer on, measured against the 11 Nov globe numbers.
- Zero wind requests before switch-on.
- Suites: decoder against the reference for a recorded run; a page suite with breaks, in the style of `night-lights-ui`.

## 8. Before any release

REGISTER entry for NOAA GFS (terms read from NOAA's own pages, attribution wording, commercial standing, the mirror's own terms if a mirror is used); Sources & Details section; hub deploy, schedule, R2 writes and page merge each on Chad's own Approve line. Cost: no new line item expected on the existing Cloudflare plan; the preview measures requests, CPU and storage (about 0.8 MB a revision, two kept).

## 9. Decisions (Chad's; GPT's view asked on each)

- **W1.** Decode in the hub (D1). Recommended.
- **W2.** Start from 0.25°, not 1° (D2). Recommended, subject to the first gate's sizes and decoder time.
- **W3.** Stale line set from measured arrival times (D3). Recommended.
- **W4.** First release: colour and static arrows; particles preview-only (D4). Recommended.
- **W5.** Desktop only for now (D5). Chad's standing rule.
- **W6.** Existing state words (D6). Recommended.
- **W7.** Go for the first gate (§6), research only.

## 10. Out of scope

Forecast playback, gusts, seasonal comparison, public history, finer zoom, the place view, any second model.

## 11. GPT review of rev 1 (relayed by Chad, 16 Nov) — rev 2

GPT: rev 1 is ready for the bounded research gate, with three clarifications. GPT states it verified the notices, the 0.25° inventory and the Worker limits, and did not fetch or decode a live run. Claude has not re-read those three.

### 11.1 The in-Worker decoder is a candidate, not a commitment (W1)

- The gate tests a narrow decoder against the actual six messages, with ecCodes or wgrib2 as the reference.
- The decoder **refuses** any packing, scan order or missing-value form it does not support. It never guesses.
- Fetch time, decode CPU and peak memory are measured separately.
- Limits GPT cites from Cloudflare's documentation: 128 MB of memory; 30 seconds of CPU for Paid scheduled runs more often than hourly. A benchmark in Claude's workspace shows only whether the approach is promising. Whether the hub can reach the host, and its real headroom, need a later read-only Worker check, which is not part of this gate.

### 11.2 Source (W2): agreed; the v17 date

- GPT agrees: 0.25° source, 1° display.
- **v17 timing.** GPT: an October notice puts the planned v17 transition in late 2027. **Claude could not open it** (the fetch was refused, 16 Nov). What Claude saw by search: the April notice PNS 26-29 proposed v17 for October 2026, and an updated PNS 26-29 was published around 28 Oct 2026. The date stays "late 2027, per GPT" until a NOAA page is read. It does not change D2.
- GPT: NOAA's 0.25° `f000` inventory lists both wind components in m/s at all three levels. The gate still reads the actual messages.

### 11.3 Freshness (W3): measure; no expected number

- **The "about 15 h" in D3 is withdrawn.** No stale line is proposed yet.
- Age is measured from **valid time**. The brief's **24-hour hide limit** stands as the provisional cap.
- The gate's four listing times are a first sample only. It records what each timestamp represents, and keeps it apart from the time all six fields can actually be retrieved.
- Before the line is chosen: complete-run availability across all four UTC runs over several days, with polling and processing delay included. That is a later measurement, with its own go.

### 11.4 Display (W4–W6): agreed, with two points

- Agreed: fixed-scale colour and static arrows first; particles in the private preview only; desktop first, with keyboard and reduced-motion checks; the page's existing status wording and visual conventions.
- **Wind needs its own age calculation.** `ME.freshness()` measures from `retrieved_at`; wind's age runs from valid time. D6 is corrected to that extent.
- **A retained old field carries an explicit "Stale" label or reason,** so age is never read as coverage.

### 11.5 The first gate, as sharpened by GPT (replaces §6)

One recent complete run, one host per attempt, six fields, three exported grids. Research only, read-only, no hub change.

1. **Fetch.** Pin the run, the index and the object's identity. Each range request must return `206` with the expected `Content-Range` and length. If the mirror fails, the NOAA 0.25° filter is a separate attempt. All six fields in the result come from one host.
2. **Decode.** Compare every native-grid value and the missing mask with the reference, with a stated tolerance for decoder rounding. Record the packing template, scan order, and whether components are Earth-relative or grid-relative. Feed one truncated or unsupported input and show it is refused.
3. **Exported grids.** Choose and document one 1° reduction method. Check real vectors in both hemispheres, at the date line and near both poles. Use made-up eastward and northward vectors to check arrow direction and the inspector's "from" bearing. At an exact pole, check the speed-only rule. Report bytes per level, decode CPU and peak memory.
4. **Arrival sample.** Listing times for that run and the previous three, labelled as 11.3 requires.

**The result answers one question:** whether the decoder goes forward to a private preview.

### 11.6 Decisions, as they now stand (all Chad's)

- **W1** decoder in the hub: tested as a candidate in the gate; decided after it.
- **W2** 0.25° source, 1° display: GPT agrees.
- **W3** stale line: not set; measured later. 24-hour hide limit provisional.
- **W4–W6:** GPT agrees, with 11.4.
- **W7** the gate (11.5): GPT recommends go, research only. **Needs Chad's own go.**
