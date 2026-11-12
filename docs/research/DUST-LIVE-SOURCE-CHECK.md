# Live dust — EUMETSAT Dust RGB source check (rev 1, 12 Nov 2026)

**For:** GPT and Chad. Source check only: nothing built, no layer added, no account created, no enquiry sent.
**Why:** Chad stopped the historical Follow the Dust release on 12 Nov ("this isn't live feed … we want live feeds"). GPT agreed (relayed by Chad) and named EUMETSAT's Meteosat Dust RGB as the candidate. Dust comes back onto the globe only if a usable near-real-time satellite source is verified.
**Status of the historical candidate:** branch `dust-rc` stays **unmerged** (last commit `4e0ffb5`, a work-in-progress save; its last test run was interrupted). Release checks cancelled. The Orange River source work is kept for reference (`docs/research/FOLLOW-THE-DUST-SOURCE-CHECK.md` rev 2).

Evidence tags: **[pane]** = read by Claude in the browser pane on `view.eumetsat.int`, pane clock in the same call. **[fetch]** = Claude's fetch tool, which returns a model summary, not page bytes (a lead, not a quotation). **[unopened]** = found, not opened (PDF; the project's text-only rule).

## 1. Bottom line
- **Technically it fits:** the feed is real, fresh (20–25 minutes old when read), covers southern Africa, is already georeferenced for the globe, and can be read by a browser directly at no cost to us.
- **Terms are NOT established, and this is the blocker.** EUMETSAT's own pages say satellite data are governed by its Data Policy, are not Creative Commons, and that imagery fresher than set delays has been licensed. The policy itself is a PDF, unopened. Whether a public site may display EUMETView's near-real-time Dust RGB is unanswered.
- **Recommendation:** do not build until the terms question is answered (§5 gives three ways). If it cannot be answered in our favour, Dust stays off the globe.

## 2. What the service offers [pane, WMS GetCapabilities, 16:35:28 UTC 12 Nov 2026]
Endpoint `https://view.eumetsat.int/geoserver/ows` (WMS 1.3.0; capabilities 282,021 characters). Service-level fields: `AccessConstraints` "none", `Fees` "none". **These two fields are service metadata, not a licence.**

| Layer | Title | Time range and step | Latest frame at 16:35:28 | Extent |
|---|---|---|---|---|
| `mtg_fd:rgb_dust` | Dust RGB - MTG-I - 0 degree | 2024-10-22 → now, every **10 min** | 16:10 (25 min old) | 70°S–70°N, 70°W–70°E |
| `msg_fes:rgb_dust` | Dust RGB - MSG - 0 degree | 2020-09-01 → now, every **15 min** | 16:15 (20 min old) | 77°S–77°N, 77°W–77°E |
| `msg_iodc:rgb_dust` | Dust RGB - MSG - Indian Ocean | 2020-08-01 → now, every 15 min | 16:15 | 77°S–77°N, 35.5°W–118.5°E |
| `mumi:wideareacoverage_rgb_dust` | Geo Ring Dust RGB - Multimission | 2021-06-03 → now, every **3 h** | 15:00 (1 h 35 min old) | global |

- **One reading only.** Freshness was read once; how late frames usually arrive, and how often they are missing, is not measured.
- **Southern Africa is inside both 0-degree discs** (the Orange River mouth is at 28.6°S, 16.5°E). It is toward the disc's southern part, so pixels are larger there than at the equator; resolution there not measured.
- **The "Geo Ring" layer is global** every 3 hours. Its abstract is empty; "Multimission" implies other agencies' satellites are included, so **third-party terms may apply to it**. Not established.
- EUMETSAT's own description (verbatim, `mtg_fd:rgb_dust`): "The Dust product is an RGB (Red, Green, Blue) composite based on infrared channels. It is designed to monitor the evolution of dust storms during both day and night. However equally useful for the discrimination of cloud types (e.g. cloud phase or thin Cirrus detection) and detection of low-level moisture."

## 3. Access test [pane, WMS GetMap, 16:35:44 UTC]
Request: EPSG:4326, bbox 40°S–15°S, 0°–35°E, 700 × 500 JPEG, latest frame, no key, no sign-in.

| Layer | HTTP | Bytes | Time | `Access-Control-Allow-Origin` | Blank pixels |
|---|---|---|---|---|---|
| `mtg_fd:rgb_dust` | 200 | 56,246 | 1.8 s | `*` | 0 % |
| `msg_fes:rgb_dust` | 200 | 57,345 | 1.2 s | `*` | 0 % |
| `mumi:wideareacoverage_rgb_dust` | 200 | 50,193 | 2.6 s | `*` | 0 % |
| same, whole globe 2048 × 1024 | 200 | 372,325 | — | — | — |

- **A browser on any site can read it** (`*`), exactly as the page reads NASA GIBS for its backdrop. No hub, storage or scheduled job would be needed: **$0 in new cost** on that route.
- Response header `cache-control: max-age=604800, must-revalidate`.
- **Not checked:** rate limits, a usage policy for the WMS, whether automated or embedded use is allowed, availability over time. Neither shell can reach the host (proxy refusal); only the pane did.
- **Looked at:** the regional frame and the global frame both drew complete images. Whether dust was present on 12 Nov was not assessed.

## 4. What it shows, honestly labelled
- It is **false-colour infrared imagery, not a dust measurement**. Dust is one of several things it makes visible; cloud, moisture and bare desert also colour it. On the globe it would have to be labelled "Dust RGB imagery (EUMETSAT)", evidence tag Observed, with a short key and the frame time.
- It cannot give concentration or height, and thin dust under cloud is not seen.
- It would sit as an optional layer, off on load, like Ocean heat. Design is a later step and not proposed here.

## 5. Terms: what is known, what is not
**Known (weak evidence):**
- EUMETSAT website Terms of Use [fetch]: satellite data are governed by EUMETSAT's Data Policy; "Satellite data and products are not released under Creative Commons licence."; credit form "©EUMETSAT [year]".
- EUMETSAT news item of 15 January 2019 [fetch]: "Hourly EUMETSAT imagery data will no longer be subject to licensing." and "full-resolution imagery at 15 minutes intervals will become available free of charge, three hours after sensing."
- Licence documents titled "Licence for EUMETSAT Recommended Meteosat Data with a latency of less than 1 hour" exist on the User Portal [unopened]. **Their existence suggests that data fresher than one hour is licensed for at least some users.** What they cover is not read.

**Not known:**
- The current Data Policy (January 2026 PDF) [unopened].
- Whether EUMETView images (pictures, not data) fall under those latency rules at all.
- Whether a public website may embed or display them, at what freshness, and with what credit.
- Anything about the MTG layer specifically (the 2019 item predates MTG) or the multimission ring.
- EUMETSAT's User Portal licensing page would not load in the pane or in Chrome (stuck on "Loading"), so no HTML version of the rules was read.

**Three ways to settle it (Chad's choice; none started):**
1. **Lift the text-only rule for one document:** Claude (or GPT) opens the January 2026 Data Policy PDF and reads the Meteosat and imagery clauses.
2. **Ask EUMETSAT:** a short enquiry to their user help desk, sent by Chad as with the other providers. Sending grants nothing.
3. **Design inside the clearly free tier, if (1) confirms it:** e.g. show only the on-the-hour frame, or only frames at least three hours old. That is "today's dust", not "this minute's".

## 6. If the terms clear, the first technical questions
- Which layer: MTG (10 min, newest satellite), MSG (15 min, the one the 2019 statement is about), or the global ring (3 h).
- Measured freshness and gaps over a day or more.
- Resolution over southern Africa; whether a 2048 × 1024 world image is sharp enough or regional tiles are needed.
- How it sits over or beside the true-colour backdrop, and the key.
