# Buoy water temperature — release-candidate packet (`buoy-temp-rc`)

**Approval:** Chad, 10 Nov 2026: "Approve: build buoy-temp-rc on a branch only — drifter dots coloured by water temperature per BUOY-TEMPERATURE-PROPOSAL rev 2; no merge or page change."
**Candidate:** branch `buoy-temp-rc` @ **`61d0504`** (code; rev 2, grey changed after the live RC). First build `4064de1`. This packet is committed after it.
**Scope:** page only. No hub, D1, R2, cron or new request. The public page is unchanged (main is untouched).

## 1. What changed

| File | Change | sha256 at `4064de1` |
|---|---|---|
| `app.js` | `ME.SST_BREAKS`, `ME.SST_COLOURS`, `ME.SST_NONE`, `ME.sstClass`, `ME.sstColour`, `ME.sstLabel`, `ME.sstKeyHtml`, `ME.sstSwatchHtml`: one source of truth | `161b53cc2086b5cc…` |
| `index.html` | Drifter `col` = `ME.sstColour(sst_c)` (was fixed `#ffd86b`); card key `#sstkey-drifters` (shown only while on); main key `#leg-drifters` uses an 8-colour swatch + "coloured by water temperature (see card)"; `?v=202611261000` | `c1797d721ed84618…` |
| `sources.html` | Drifters SST paragraph: classes, grey = Temperature unavailable (none reported or range-withheld), fix times vary, not compared with normal, GPT's range-check sentence; `?v=` bump | `e469e0f58d03c85c…` |
| `phase1/buoy-temp.test.mjs` | New unit suite (37) | — |
| `phase1/buoy-temp-ui.test.cjs` | New browser suite (33) | — |

`style.css`, `arts.js`, `sky.js`, `skyscene.js`, `timeline.html` and `timeline.js` are unchanged. Served-hash checks stay at nine page files.

## 2. Palette (B1), chosen by measurement

- Candidates scored (desk, CIELAB ΔE, colorspacious; deuteranomaly and tritanomaly simulated):
  - plasma 0.18–0.98;
  - viridis 0.25–1.0;
  - magma 0.35–0.98;
  - cividis 0.3–1.0;
  - a custom violet ramp.
- **Rejected:**
  - plasma and magma: their oranges and reds sit at ΔE 3.9–9.9 from the fire (`#ff9b2e`) and earthquake (`#ff5a3c`) dots, which also appear at sea;
  - cividis: grey-like, ΔE 11.8 to grey;
  - custom violet: adjacent classes at ΔE 7.3, and ΔE 4.2 to the plastic markers under deuteranomaly.
- **Chosen: viridis 0.25–1.0.**
  - `#3b528b #2e6e8e #24878e #1fa187 #3aba76 #73d056 #b8de29 #fde725`
  - L* 36 → 91, strictly ordered;
  - min ΔE 22.9 to dark ocean (`#10233a`);
  - nearest other ocean-dot colour: vessels, ΔE 18.7;
  - no warm hue, so nothing reads as Ocean Heat's "warmer than usual" orange.
- **Grey, first build `#54545a`:** the grey that maximised the minimum ΔE to every class across normal vision, deuteranomaly and tritanomaly (min 15.7; ΔE 24.6 to the desk dark-ocean colour).
- **Grey, rev 2 `#b0b0b8`, chosen on the real globe.** In the live RC, `#54545a` nearly vanished on night-side and dark ocean: globe.gl shades each 3D dot darker than its declared colour, so the desk ΔE overstated it.
  - Four greys were compared on the same real buoys through the page's own render path: `#54545a`, `#808088`, `#a4a4ac`, `#b0b0b8`.
  - `#b0b0b8` read clearly on night-side ocean, over cloud, and in Arctic polar night.
  - Desk figures for `#b0b0b8`:
    - min ΔE 12.7 to every class under all three vision types;
    - 14.8 to the plastic markers (deuteranomaly; 15.6 normal);
    - 26.2 to vessels, 40.7 to earthquakes;
    - 68.9 to near-black night ocean;
    - its weakest backdrops are mid-grey cloud (14.5) and white cloud (18.1).
- **Coldest class `#3b528b`:** the faintest class. In the live RC it was readable on grey cloud (Southern Ocean) and in Arctic polar night. Kept. The fallback, if GPT or Chad finds it too faint, is to start viridis at 0.35.

## 3. Tests

- **`node phase1/buoy-temp.test.mjs` — 37 passed.**
  - Expectations are written out by hand: exactly 0 → class 1 (not grey); 4.99 / 5.00 … 29.99 / 30.00; negative → class 0; `null` / `undefined` / `''` / `NaN` / `Infinity` / `true` → grey.
  - Lightness order computed independently.
  - The key contains all eight colours in order plus the grey and a text equivalent; the main swatch has no old yellow.
  - **Breaks:**
    - `null-zero` → 2 fail;
    - `edge` (`>` for `>=`) → 7 fail;
    - `grey-class` → 1 fail;
    - `no-none` → 1 fail.
- **`node phase1/buoy-temp-ui.test.cjs` — 33 passed** (real globe.gl 2.45.0, SwiftShader, hub routed to fixtures, backdrop = uniform dark ocean `#10233a`).
  - Each of 11 fixture buoys is handed to the renderer in its hand-written expected colour, including 0, −1.2, 4.99, 5.00, 29.99, 30.00 and null.
  - Keys are hidden while off and shown with real size while on; GPT's wording is present.
  - The inspector is unchanged (Observed, fix time, missing SST "not provided").
  - **Rendered pixels at projected dot positions:** cold dot blue-dominant, warm dot yellow, unavailable dot grey (low saturation), all three distinct from the surrounding ocean.
  - Buoys and day/night on together: all keys shown, colours unchanged.
  - Off clears everything.
  - Phone 390 × 844: the key renders and fits, no horizontal scroll.
  - **Breaks:**
    - `fixed-yellow` → 15 fail;
    - `key-always` → 2 fail;
    - `null-zero` → 3 fail.
- **Regression on the branch, all passing:**

  | Suite | Result |
  |---|---|
  | drifters-ui | 25 |
  | ux-round1 | 34 |
  | desktop-overflow | 112 |
  | mobile-pass | 131 |
  | place-ui | 30 |
  | search-ui | 104 |
  | kept-ui | 21 |
  | smoke-fixes | 52 |
  | terminator-ui | 19 |
  | plastic-ui | 29 |
  | drifters-hub | 12 |

  The Worker module loads.
- **Emulation only:** desktop and 390 × 844 in headless Chromium on the host GPU. No physical phone.

## 4. Live RC (Pages origin, live hub, real backdrop)

- **16:56:45Z — injection.** The branch page files were fetched by commit from raw.githubusercontent and blob-injected into a clean github.io tab. All six page files hash-exact (index `ccf6da37`, app `4e175947`; style, arts, sky, skyscene equal to live).
- **16:57:13Z — first read:** the drifters layer read **unknown, records withheld**.
  - Cause (D1 `collector_runs`, read-only): the **16:07 drifters run failed upstream, OSMC HTTP 522**. The hub served counts from the failed 16:08 write and records from the last good run (15:08); the page's pairing rule withheld the mismatched records.
  - This is **existing live behaviour, not the branch**: the public site showed the same state for that hour. The RC is repeated after the next run (see below).

- **17:08:45Z — repeat at `4064de1`**, after the 17:07 run succeeded (1,303 buoys, D1).
  - Pair usable (cells and records both 17:08:09Z); state current.
  - **All 1,303 buoys drawn**; colour ≠ `ME.sstColour(sst_c)` for 0 of them.
  - Classes: below 0: 6; 0–5: 35; 5–10: 86; 10–15: 104; 15–20: 231; 20–25: 357; 25–30: 400; ≥ 30: 38; unavailable: 46.
  - Visual on the real backdrop with day/night on: coloured dots read on dark ocean and cloud; **the grey nearly vanished on night-side ocean** → rev 2 (§2).
- **17:17:13Z — repeat at `61d0504`** (rev 2). All six page files hash-exact (index `c1797d72`, app `161b53cc`; style, arts, sky, skyscene equal to live).
  - Zero drifter requests before switch-on; exactly `/cells/drifters` + `/snapshot/drifters` after.
  - 1,303 drawn, 0 colour mismatches, 46 grey `#b0b0b8`.
  - The card key reads GPT's wording; the main key reads "drifting buoy · coloured by water temperature (see card)".
  - Screenshots looked at: night-side ocean and cloud (mid-Atlantic, 26° N), Arctic polar night (77° N): grey and all classes visible, coldest faintest.
- The public page was untouched throughout (injection into a clean tab only).

## 5. Open for GPT

1. **The card's own accent** (the pip and the count) still uses the old drifter yellow `--drift`. GPT asked only that the main map key stop implying one buoy colour. Should the card accent change too? (It is the card's identity colour, like every other card's.)
2. **Coldest class contrast** on the real backdrop (§2, §4).
3. **Observation, outside this branch:** one failed upstream hour (OSMC 522) blanks the buoy layer ("unknown, records withheld") until the next good run, although the last good pair is still on the hub. Recorded only; any change would be its own proposal.
