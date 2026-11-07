# Phase 0 — Arts gate (the Met) and Planet baseline, for GPT review

7 Nov 2026. Compiled by Claude from evidence already collected in the earlier Phase 0 thread ("FIRMS memory v2 handover", 7 Nov ~08:25–10:40 UTC). **No new research or measurement was run for this document.**

Where the evidence was not preserved, it is marked **MISSING**. The raw outputs (the downloaded CSV, the result JSON and the per-run timing objects) lived in that thread's cloud workspace, which is not reachable from this session. What survives is that thread's handover summary and the code it ran, both readable in the thread transcript.

Authority: Chad's "Go: Phase 0" (7 Nov). Research only. Life is closed (`P0-life-gbif.md`: BLOCKED for the scoped marker proof of concept; rights inconclusive). Aircraft stays parked.

---

## A. Arts gate — the Metropolitan Museum of Art Open Access

### Candidate and bounded scope
- **The Art Institute of Chicago was not assessed.** Its API (api.artic.edu) answered the browser pane with a Cloudflare "you have been blocked" security page. No attempt was made to get around it. Recorded as "access blocked, not assessed".
- **Candidate assessed:** The Met Open Access, `MetObjects.csv` from github.com/metmuseum/openaccess (Git LFS, media.githubusercontent.com). 503,073 rows, etag `7adc37e4…`. Downloaded in the earlier thread's workspace.
  - MISSING: the file's sha256 and byte size; the full etag; the download time.
- **Sample A:** random 2,000 rows from the whole collection, Python `random` with seed 20261107.
- **Sample B:** random 2,000 rows from the 59,924 records with a typed place relationship (Geography Type populated).
  - MISSING: confirmation that sample B used the same seed (the code shows `random.sample(typed, 2000)` after seeding, but the seed line is not visible in the surviving transcript).
- Effort: well within the ~4 h cap (exact time not recorded).

### Geographic usability
**Typed relationship mapping** (from the Met's `Geography Type` field):
- "Made in" → `created_at`
- "Found/Excavated" → `found_at`
- "From" → `associated_with`
- Hedged wordings ("possibly", "probably", "said to be", "attributed") are counted separately.
- The Met's `Country` field means created *or* found, so a country with no geography type cannot be given a typed relationship.

**Precision classes:** settlement (City), region (state, county or region fields), country, none.
- MISSING: the exact field-to-precision mapping as run. The surviving code calls a `prec()` function whose body was not captured.

| Scope | Result |
|---|---|
| Sample A (whole collection) | Only **107 / 2,000** records have a typed place relationship. **Fails** the geography criterion for a whole-collection proof of concept. |
| Sample B, relationships | 871 `created_at` · 144 `found_at` · 985 `associated_with`; **369 hedged** |
| Sample B, region view (country) | 2,000 records across **88 countries**. Meets ≥ 300 / ≥ 20, **but 52% are Egypt**. |
| Sample B, marker view (created or found, with a city) | **492 records across 159 places.** Meets the numbers, **but the Met gives city names, not coordinates.** Placing them needs a place-name lookup source (gazetteer), which has not been checked. **Inconclusive.** |

MISSING: the precision mix for sample B (counts per class); the hedged share within the 492 marker records; the list of top countries other than Egypt.

### Rights: data and media
- **Data:** the Met's image-resources policy page was read in the earlier thread. It states the Open Access data is CC0 and commercial use is allowed.
  - **Not cleared:** the operative sentence is not yet in REGISTER.md (Chad pastes).
  - MISSING: the exact sentence and the page URL and version as read.
- **Media:** the policy says images of works the Met considers public domain are CC0. Images of works not in the public domain are not released under Open Access.
  - In sample B, **1,324 / 2,000 are flagged `Is Public Domain`**, so media rights can be decided per item from that flag.
  - MISSING: whether each public-domain record actually has an image (`primaryImage`, which is in the API, not the CSV), and whether image use was checked against the API terms.
  - Media is not yet included or excluded for the proof of concept. This is the same decision Chad faced for Life.

### Sensitivity handling
- **Not assessed (MISSING).** Nothing was measured on culturally sensitive or restricted material (human remains, sacred objects, items under repatriation claims), or on provenance and collection history.
- Change 4 rates Arts' bias-rule exposure **higher** than Life's for exactly this reason (collection histories, attribution).
- No field-level count of how often the Met marks such material was recorded.

### Attribution
- CC0 requires no attribution.
- MISSING: whether the Met requests a credit line (a recommended credit, not a licence condition) and its wording.
- Records carry the Met Object ID (100%) and `Object Wikidata URL` on **1,040 / 2,000 (52%)** in sample B. The Wikidata link is the Met's own and was not verified against Wikidata.

### Access and storage
- Bulk access: the static CSV from GitHub (Git LFS), so no API calls are needed for the sample.
- The collection API's terms and rate limit were searched in the earlier thread. MISSING: the recorded result. A rate figure was looked for but is not in the surviving summary, so it is unverified.
- Storage: CC0 places no conditions on copying or storage. The repository's own terms for the LFS file were not recorded (MISSING).

### Limitations
- **Unreconciled figure:** 59,924 / 503,073 = 11.9% of the collection is recorded as typed, so a random 2,000 should hold about 238 typed records, not 107 (5.4%). The two counts probably use different definitions: "Geography Type populated" for the 59,924, and "maps to a typed relationship with a place value" for the 107. The definitions as run were not preserved, so this can't be settled from the surviving evidence. It does not change sample A's verdict (both fall far short of 300 per 2,000), but the figures as recorded don't agree.
- Sample B is drawn only from records with typed places, so it says nothing about the 88% of the collection without one (59,924 / 503,073 = 11.9% typed).
- The region view is dominated by Egypt (52%), which reflects the Met's holdings. A region view built from it would be one cluster plus a scatter.
- The marker view depends on an unchecked gazetteer. City names are ambiguous and some are historical.
- Dates: all 2,000 have an Object Begin Date. How dates are hedged (circa, ranges, dynasties) was not measured.

### Arts gate outcome (as recorded): **INCONCLUSIVE**
| Requirement | State |
|---|---|
| Reuse rights | **Inconclusive** (CC0 stated; REGISTER paste pending; exact sentence not preserved) |
| Media rights | **Open** (public-domain flag gives a per-item route; image availability unchecked; include-or-exclude undecided) |
| Geography | Whole collection: **blocked for that scope** (107 / 2,000). Typed subset: region view meets the numbers but is Egypt-dominated; marker view **inconclusive** (no coordinates; gazetteer unchecked) |
| Access, caching, retention | **Likely met** for a static CSV; API terms unrecorded |
| Sensitive material | **Not assessed** |
| Identifiers | Object ID 100%; Met-supplied Wikidata link 52% (unverified) |

---

## B. Planet baseline

### Conditions
- **Page:** https://theonetheonlythechad.github.io/mother-earth/ (main, assets `?v=202611131000`).
- **Hub:** 0.6.0 (live since 04:01:54 UTC, FIRMS v2 on since ~04:51 UTC).
- **Time:** 7 Nov, about 08:25–08:30 UTC. MISSING: exact timestamps per run.
- **Device and browser:** Chad's Mac, the Claude desktop app's built-in browser pane (Chromium-based).
  - MISSING: the user-agent string, viewport and devicePixelRatio (all captured in the run objects but not preserved), Mac model and OS version.
- **Pane visibility:** hidden for the byte measurement; **brought to the front by Chad for the timing runs** (a hidden pane doesn't render).
- **Network:** Chad's home connection, unthrottled. MISSING: connection type and speed. No throttling profile was used.
- **Cache:** the pane's profile is persistent and globe.gl was already cached before run 1 (its transferSize showed a cache hit). **A truly cold load could not be forced.** Runs 2 and 3 were warm reloads.

### Method
- **Bytes:** after an 8 s settle, Navigation and Resource Timing entries were read (transfer, encoded and decoded sizes per resource). Cross-origin resources that don't expose sizes (no Timing-Allow-Origin) were re-fetched with `cache: 'no-store'` to read the decoded size. A gzip size was then estimated in the page with `CompressionStream`.
  - So **the 1.6 MB "compressed" total is part measured, part estimated.** MISSING: the per-resource split between measured and estimated.
- **Timing:** three loads (`?baseline=run1`, `run2`, `run3`), each read 9 s after navigation:
  - DOMContentLoaded and first-contentful-paint
  - when globe.gl and app.js finished loading
  - first hub fetch start, last hub response end
  - when the GIBS backdrop finished loading
- **Responsiveness (run 3 only):** 60 `requestAnimationFrame` intervals of the running globe; median and p95.
  - This is not input latency: no touch or drag was simulated.

### Results
**Initial transfer:** about **1.6 MB compressed / 6.7 MB decoded**. Largest items:
- globe.gl ≈ 0.5 MB
- ships snapshot ≈ 0.14 MB
- fires snapshot ≈ 0.13 MB
- NASA GIBS backdrop image ≈ 0.5 MB on top

| Run | Cache state | First paint | Hub fetches | Frame time |
|---|---|---|---|---|
| 1 | globe.gl cached, first page load in session | 2.5 s | 2.5 s → 8.4 s | — |
| 2 | warm reload | ≈ 0.2 s | last layer ≈ 4 s | — |
| 3 | warm reload | ≈ 0.2 s | last layer ≈ 4 s | median ≈ 32 ms (≈ 30 fps) |

MISSING:
- the exact per-run DCL, FCP, globe.gl and app.js end, first hub fetch, last hub end and GIBS end;
- the separate values for runs 2 and 3 (recorded only as "about");
- run 3's p95 frame time;
- canvas size.

### Not measured
- **iPhone baseline (not measured).** It needs Chad at the phone; the earlier thread offered a 2-minute manual check that didn't happen.
- **Truly cold desktop load (not measured).**
- **Throttled or mobile network (not measured).**
- **Input latency (not measured).** Frame time is the only responsiveness figure.

### What the baseline can and can't support
- It can serve as a **desktop, warm-cache reference** for "within an agreed margin of the Planet baseline" checks, as long as later checks use the same pane, method and conditions.
- It **can't** stand in for the phone or a first-time visitor. The Change 4 / Phase A checks that name the iPhone ("first switch into a domain", "VoiceOver pass") have no baseline yet.

---

## C. Asked of GPT
1. Is the Arts outcome (INCONCLUSIVE) right on this evidence? Do the MISSING items change it, or only its confidence?
2. Is the Planet baseline usable as recorded (desktop, warm), given the missing per-run values?
3. With Life BLOCKED for its scoped marker proof of concept (rights separately inconclusive), what can Phase 0 recommend? Note that neither gate has cleared.
