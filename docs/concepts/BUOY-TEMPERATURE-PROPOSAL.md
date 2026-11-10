# Buoy water temperature — colour the drifting buoys by what they measure (proposal rev 2, docs only)

**For:** Chad's go to build on a branch (B3). GPT reviewed rev 1 (relayed by Chad, 10 Nov): it can proceed to the branch-build decision with the copy and legend changes made in rev 2.
**Asked by:** Chad, 10 Nov 2026 ("that would be cool, very cool actually").
**Written:** 10 Nov 2026 (docs only; nothing built). **Rev 2:** GPT's legend and copy changes, the main map key, grey = "Temperature unavailable", palette chosen on the actual globe, and the boundary tests.
**Approved so far:** nothing. No branch, page change or release is approved.

## 1. What and why

Each drifting buoy already reports a **sea surface temperature measured in the water**. We already collect it every hour, keep it in history, and show it in the inspector when a buoy is tapped [code]. On the globe, though, every buoy is the same yellow dot (`col: '#ffd86b'`).

This proposal colours each buoy by its reported water temperature. It is the **live, observed** counterpart to Ocean Heat:
- **Ocean Heat** = a NOAA analysis, global, daily, temperature *and* the difference from the 1991–2020 normal.
- **Buoys** = direct measurements at scattered points, hourly, temperature **only**. A buoy carries no normal, so nothing here says "warmer or colder than usual".

**What we hold (D1 read, 10 Nov 16:29 UTC, last 24 h):**
- 1,303 buoys, of which **1,259 reported a temperature**;
- 14,413 fixes;
- range −1.55 to 35.94 °C;
- latest fix 14:15 UTC.

## 2. What the data path already guarantees [code: `phase1/worker.js`]

- **Source:** NOAA OSMC ERDDAP `OSMC_flattened`, GTS reports, CC0 (REGISTER).
- **Units:** the hub refuses the run unless the CSV's units line reads `Deg C` (`DRIFT.units`).
- **Range guard:** `sst` outside −3…40 °C is set to `null` (counted as `sst_out_of_range`). An empty value or `NaN` is also `null`. A missing temperature never becomes zero.
- **Timing:** one row per buoy, each buoy's own latest fix within 24 h, so different buoys report at different times. The card already says so.
- **No hub change is needed:** `sst_c` is already in the drifters envelope and the page already reads it.
- **No further quality control is ours.** Sensor depth and quality flags are not in the fields we read [not checked]. Sources will say: **"Mother Earth applies a range check. It performs no further quality checks on the reported temperature."**
- **Fix age:** the 24-hour query is the collection window. A fix being viewed from a cached snapshot can be older than 24 hours, so no copy claims "within 24 h"; the fix time stays in the inspector.

## 3. What the visitor sees

- The **Drifting buoys** toggle is unchanged (off on load, own card).
- When on, each dot's colour is its reported water temperature, on a **sequential** scale. It is deliberately not the blue–orange diverging scale Ocean Heat uses, so an absolute temperature can't be mistaken for an anomaly when both layers are on:

  | Class | Water temperature (°C) |
  |---|---|
  | 1 | < 0 |
  | 2 | 0 ≤ t < 5 |
  | 3 | 5 ≤ t < 10 |
  | 4 | 10 ≤ t < 15 |
  | 5 | 15 ≤ t < 20 |
  | 6 | 20 ≤ t < 25 |
  | 7 | 25 ≤ t < 30 |
  | 8 | ≥ 30 |
  | — | **Temperature unavailable**: a neutral grey dot, never a class colour. This covers both "none reported" and "rejected by the hub's range check". |

  - The palette is sequential with ordered lightness, checked for colour-vision deficiency.
  - **Chosen on the actual globe at map size**, with day/night shading on (and Ocean Heat, once that exists on a branch), so the darkest dots don't vanish.
  - Grey is checked to be distinct from every class.
- **A small legend in the drifters card:** **"Water temperature at each buoy's latest reported fix (°C). Fix times vary."**, plus "Not compared with normal". Grey = **"Temperature unavailable"**.
- **The main map key (`#leg-drifters`)** today shows one fixed yellow dot for "drifting buoy (latest fix)". It changes to a small gradient swatch: "drifting buoy · coloured by water temperature (see card)". It must not imply one fixed buoy colour.
- **Inspector:** unchanged ("Sea-surface temperature 18.42 °C", with the fix time). The "Observed" evidence line stays.
- **Accessibility:** colour is not the only channel. The value is in the inspector, and the legend has a text equivalent.

## 4. Scope, build and tests

- **Page-only change.** `pointColor` for drifters is derived from `sst_c` through one pure function `ME.sstClass(t)`, plus the legend in the card and the Sources wording.
  - No hub, D1, R2 or cron change; no new request.
  - $0.
- **Tests** (existing pattern: `app.js` in Node + a browser suite):
  - **exactly 0 °C is class 2, never grey**;
  - `null` → grey;
  - a negative value → class 1;
  - both sides of every boundary (e.g. 4.99 / 5.00, 29.99 / 30.00);
  - the legend and main-key swatch appear only while the layer is on;
  - card and main key checked together with the ocean layers on (drifters + day/night now; Ocean Heat too if it exists on a branch by then);
  - toggling off restores nothing stale;
  - render check: real fixture buoys get their expected colours.
- **Breaks** (each must fail):
  - `null` treated as 0 (painted as class 2);
  - off-by-one at a class edge;
  - legend shown with the layer off.
- **Release pattern:**
  1. branch `buoy-temp-rc`;
  2. GPT preview from `_review/`;
  3. Pages-origin RC against the live hub;
  4. `Approve: merge buoy-temp-rc to main (page change: buoy dots coloured by water temperature)`;
  5. served-hash check (nine page files; no new file).

## 5. Out of scope (later, each its own proposal)

- Comparing a buoy's reading with NOAA's normal at that spot. That would be a computed comparison of ours, labelled as ours.
- Buoy temperature history views.
- Moored buoys or Argo (R4, parked).

## 6. Decisions for Chad (after GPT)

- **B1:** eight classes kept (GPT agrees); sequential palette picked on the globe.
- **B2:** GPT's wording (fix time, "Temperature unavailable", range-check sentence).
- **B3:** go to build on a branch.
