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

**Worker cost (Cloudflare analytics, per-minute figures, so upper bounds for the run):** 10:10 — 6 requests, 0 errors, max CPU **20.4 ms**, max wall 5,423 ms as reported by analytics (the admin route itself measured 12,445 ms wall). Storage added by one run: 65.7 KB raw + 8.9 KB snapshot + 29.2 KB study ≈ **104 KB a day** (about 38 MB a year; nothing is deleted).

## 4. Terms read for the REGISTER drafts (browser pane, 13 Nov 10:12 UTC; text only)

- **NAIF server clearance** (`/pub/naif/AA_CLEARANCE_STATEMENT.TXT`), verbatim: "All of the folders and associated data files appearing on this page and lower-level pages have been cleared for public release: JPL Clearance Number CL#05-2438. There are no export controlled or otherwise sensitive or restricted data in this suite of folders and files."
- **NAIF "Rules Regarding Use of SPICE"**: acknowledgement of SPICE / NAIF / PDS resources "and of the teams that provided the data used to make SPICE kernels, is encouraged". The page is about the SPICE system; it contains no reuse licence wording for archived kernels. The LRO data set's `aareadme.txt` has no citation or acknowledgement text. **Not found on the pages read (not the same as unrestricted):** an explicit reuse or commercial-use statement for PDS-archived kernels.
- **CDAWeb notes for PSP_HELIO1HR_POSITION**: "Proper citations should include the 'Accessed on date'"; provider Natalia Papitashvili (NASA/GSFC/SPDF). **The DOI shown there is `10.48322/41s1-hx58`**, not the `10.48322/ecnj-rx61` in GPT's proposal and the SPASE record. Both may be valid (two records); which one to cite is open, and `sun.html` / `sources.html` currently cite `ecnj-rx61`. No licence wording on the CDAWeb notes page; the CC0 statement is so far only from a fetch summary of the SPASE record (a lead).

## 5. State after this record

- Live hub **0.6.12** `c1addd19…0106` (branch `skycraft-rc` @ `a5f483f`); main's worker.js is still 0.6.11's. `SKYCRAFT_ENABLED` unset: no scheduled run. Page unchanged (`bdf894f`).
- One Parker snapshot is published on the hub and will not refresh until the schedule is on (or another manual run). No page reads it yet.
- Rollback, each its own line: hub → 0.6.11 `119cc641…801f`; the R2 objects can stay.
- Carried: Parker coverage gap 20 Jan – 17 Feb 2027; upstream User-Agent receipt unverified; live page checks pending.
