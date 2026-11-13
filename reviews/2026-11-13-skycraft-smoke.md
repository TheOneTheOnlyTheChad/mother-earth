# skycraft — hub 0.6.12 smoke record (deploy, probe, first full manual run)

13 Nov 2026. Times UTC, from tool output. Each step on Chad's own Approve line. **The schedule is NOT enabled; the page is NOT merged; no REGISTER entry is filed.**

## 1. R2 upload (Chad: "Approve: upload the two skycraft example files to R2 ref/skycraft/ (craft-moon-2026-06-R1, craft-sun-2024-12-R1)")

Bytes from raw.githubusercontent at `a5f483f`, hash-checked in the dashboard tab; `ref/skycraft/` listed empty at 09:58:22.

| Object | PUT | Read back |
|---|---|---|
| `ref/skycraft/craft-moon-2026-06-R1.json` | 200, 09:58:38 | 41,681 B, `e747aa7a58a71a5e2a11253b2d063fcfc80809d8d86291ce6dce8220d1d05ebb` |
| `ref/skycraft/craft-sun-2024-12-R1.json` | 200, 09:58:39 | 26,074 B, `5934263214741a21b11019fa55d326a5b0524274c3104a6a768fca4fd3149500` |

## 2. Deploy and probe (Chad: "Approve: deploy hub 0.6.12 from a5f483f (content only, SKYCRAFT_ENABLED unset) and run /admin/probe/skycraft once")

- Before (10:01:11): live 316,927 B `119cc641…801f` (0.6.11); 20 bindings; no `SKYCRAFT_ENABLED`.
- Content-only PUT 200; Cloudflare `modified_on` **10:01:33**. Read back 347,290 B `c1addd19e7b64d381664e0a05dfc3550c629ff5180946d3b547ccba6054c0106` (= `a5f483f`). 20 bindings; gate absent. Hub reports 0.6.12.
- Routes at 10:01:54: both catalogue files 200, exact, `public, max-age=86400, immutable`; unknown revision 404; `/snapshot/skycraft/meta` 200 with `current: null`; Dust meta, Sky catalogue, `/status`, health answering; probe without the key 403.
- **Probe at 10:02:10 — exactly one upstream request:** HTTP 200 from Horizons (Parker data sheet only, `MAKE_EPHEM='NO'`), 2,272 ms, 3,887 B, API version 1.2 (expected 1.2), data sheet "Revised: Nov 03, 2026". Stored nothing, published nothing (meta still `current: null`; no `skycraft` row in D1).
- **Established: the Worker reaches the Horizons API.** Not established: that the upstream received the User-Agent (`user_agent_set` is the header the hub set).
- First scheduled run on 0.6.12: usgs 10:05:07 `ok`; health 8 of 8 at 10:06:28.

## 3. Full manual run (Chad: "keep it as is that is perfect" on the User-Agent; "Approve: run /admin/run/skycraft once")

Fired 10:10:38; the admin route answered 200 at 10:10:50 (`skycraft:ran`, wall 12,445 ms — the reply itself is not the evidence; the records below are).

**D1 row 9430:** `skycraft`, started 10:10:38.616, finished 10:10:49.670, `ok`, http 200, records 193, bytes 65,655, note "published 20261113T101042Z-c88f5c381b7e6fef; sheet revised Nov 03, 2026; segments spp_pred_20260930_20270217_od268_v001; 0 of 193 samples withheld; lro study stored 41 epochs".

**Parker (published):**
- Pointer: current `20261113T101042Z-c88f5c381b7e6fef`, retrieved 10:10:42.205, covers 2026-11-12T00:00:00Z → 2026-11-20T00:00:00Z hourly, 0 withheld; no previous; no last_attempt.
- Snapshot served 200, 8,862 B, sha256 matches the pointer (`c88f5c38…8274`), `immutable`. 193 samples.
- Solution, from the same response as the vectors: target "Parker Solar Probe (spacecraft) (-96) {source: psp_merged}"; data sheet revised Nov 03, 2026; statement "Fit to post-launch tracking data through 2026-Sep-29. Reference planning trajectory for subsequent times."; every sample in `spp_pred_20260930_20270217_od268_v001`; none inside the tracking fit.
- Position at 2026-11-13 00:00 UTC: (79,796,845, −22,826,080, −15,315,318) km, 84,398,610 km from the Sun's centre. Identical (to the rounding) to the vector read by hand in the browser pane at 06:55 UTC the same day.
- Raw answer kept: `skycraft/raw/20261113T101042Z-parker.json`, 65,655 B, `e0d901f2…6047`.

**LRO study capture (stored; nothing published or served):**
- `skycraft/study/lro/20261113T101047Z-raw.json` 20,125 B and `-index.json` 9,087 B; retrieved 10:10:47.128 (after Parker's answer; one request at a time).
- 41 epochs; 40 forward; the D 00:00 sample has signed lead −36,647 s (not a forward forecast); the four 37-day instants are 2026-12-20 12:00, 12:30, 13:00, 13:30 UTC.
- Data sheet revised Oct 07, 2026; target source tag `LRO_merged`; every epoch in `558day_20261007_01`.
- `/snapshot/skycraft/study` → 404.

**Lock:** `skycraft/lock.json` = `{"released":true,"at":"2026-11-13T10:10:49.851Z"}`.

**Worker cost** (corrected 13 Nov per GPT): the admin route's own measured elapsed time for this run was **12,445 ms**. Cloudflare analytics for the minute 10:10 (6 requests, 0 errors) show a per-minute maximum CPU of **20.4 ms** — a per-minute analytics maximum, so an upper bound for this run, not its measured CPU. The same view shows a maximum wall time of 5,423 ms; its relationship to this invocation is not verified. Storage added by one run: 65.7 KB raw + 8.9 KB snapshot + 29.2 KB study ≈ **104 KB a day** (about 38 MB a year; nothing is deleted).

## 4. Terms read for the REGISTER drafts (browser pane, 13 Nov 10:12 UTC; text only)

- **NAIF server clearance** (`/pub/naif/AA_CLEARANCE_STATEMENT.TXT`), verbatim: "All of the folders and associated data files appearing on this page and lower-level pages have been cleared for public release: JPL Clearance Number CL#05-2438. There are no export controlled or otherwise sensitive or restricted data in this suite of folders and files."
- **NAIF "Rules Regarding Use of SPICE"**: acknowledgement of SPICE / NAIF / PDS resources "and of the teams that provided the data used to make SPICE kernels, is encouraged". The page is about the SPICE system; it contains no reuse licence wording for archived kernels. The LRO data set's `aareadme.txt` has no citation or acknowledgement text. **Not found on the pages read (not the same as unrestricted):** an explicit reuse or commercial-use statement for PDS-archived kernels.
- **CDAWeb notes for PSP_HELIO1HR_POSITION**: "Proper citations should include the 'Accessed on date'"; provider Natalia Papitashvili (NASA/GSFC/SPDF). **The DOI shown there is `10.48322/41s1-hx58`**, not the `10.48322/ecnj-rx61` in GPT's proposal and the SPASE record. Both may be valid (two records); which one to cite is open, and `sun.html` / `sources.html` currently cite `ecnj-rx61`. No licence wording on the CDAWeb notes page; the CC0 statement is so far only from a fetch summary of the SPASE record (a lead).

## 5. State after this record

- Live hub **0.6.12** `c1addd19…0106` (branch `skycraft-rc` @ `a5f483f`); main's worker.js is still 0.6.11's. `SKYCRAFT_ENABLED` unset: no scheduled run. Page unchanged (`bdf894f`).
- One Parker snapshot is published on the hub and will not refresh until the schedule is on (or another manual run). No page reads it yet.
- Rollback, each its own line: hub → 0.6.11 `119cc641…801f`; the R2 objects can stay.
- Carried: Parker coverage gap 20 Jan – 17 Feb 2027; upstream User-Agent receipt unverified; live page checks pending.

## 6. Schedule enabled (Chad: "Approve: set SKYCRAFT_ENABLED=1", after GPT passed this smoke record)

- Settings page loaded fresh after the code deploy; form filled by Claude (Key `SKYCRAFT_ENABLED`, Value `1`, Production, not a secret); **Chad clicked "Add 1 variable and deploy"**.
- Cloudflare deployment created **10:31:26 UTC** (source: dash). Read back at 10:32:16: `SKYCRAFT_ENABLED` plain text "1"; 21 bindings; script still 347,290 B `c1addd19…0106`; hub reports 0.6.12.
- First scheduled run: the 05:07 UTC hourly tick on 14 Nov (07:07 SAST).
- Rollback (own Approve line): remove `SKYCRAFT_ENABLED` (stops the schedule; stored snapshots stay).

## 7. GPT's rulings on §4 (relayed by Chad 13 Nov; GPT's extraction, not read by Claude)

- **Parker SPDF citation:** keep `10.48322/ecnj-rx61` in `sun.html`, `sources.html` and REGISTER. GPT reports that the SPASE record assigns it to the hourly `PSP_HELIO1HR_POSITION` product, identifies `10.48322/41s1-hx58` as the deprecated daily product, lists CC0 1.0, and requests credit to Natalia E. Papitashvili, the data providers and CDAWeb with the access date. Recorded as a cross-product check.
- **LRO PDS citation:** GPT reports that NASA's Open Data record for `LRO-L-SPICE-6-V1.0` points to U.S. Government Works in its licence field; cite that dataset-level metadata and the PDS DOI `10.17189/1520116`, alongside the exact kernel and producer; record NAIF's clearance statement separately as evidence of public release.

## 8. Live candidate check from the Pages origin (13 Nov, 10:44–10:46 UTC; branch files at `7d3e4f0`, hash-checked, injected into a clean github.io tab)

- **Sun page with the Sky time** (`?t=2026-11-13T00:00:00Z`): three requests, all to the hub (the dated example, `/snapshot/skycraft/meta`, the snapshot it names); no request to Horizons. Shown: "Predicted position — 13 Nov 2026, 00:00 UTC."; 84,398,610 km from the centre; "Reference planning trajectory", Horizons' sentence, segment `spp_pred_20260930_20270217_od268_v001`, "Data sheet revised Nov 03, 2026"; "Read by the hub 13 Nov 2026, 10:10 UTC"; the Sun's 1.7× enlargement disclosed; one unbroken path; no horizontal overflow (588 px pane). Cross-origin read from the Pages origin works.
- **Moon page, direct visit:** one request (the dated example); "Historical snapshot — 10 Jun 2026, 12:00 UTC."; 1,821 km from the centre, 84 km above the nominal surface; "Definitive trajectory" with the provider's words; no overflow.
- **Not covered by this check:** the Sky links and the return (the live site has no `moon.html` / `sun.html` to navigate to until the merge; covered by the page suite); a real phone, Safari, a screen reader.
- GPT (relayed by Chad): `1920026` passes review for the page release; two REGISTER corrections applied at `7d3e4f0`.
