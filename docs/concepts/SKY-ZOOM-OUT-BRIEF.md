# Sky zoom-out view (Earth → Moon → Sun) — brief for the next proposal

**Status (10 Nov 11:12 UTC):** proposal rev 1 written — `SKY-ZOOM-OUT-PROPOSAL.md` (for GPT). Originally: brief only, captured 10 Nov 2026 at the end of the Sky on Two Clocks thread. Nothing has been researched, built or approved. The next step is a **docs-only proposal** for GPT's review. Each later step (source pass, build, deploy, page release) gets its own approval.

## 1. GPT's brief (relayed by Chad, 10 Nov 2026, verbatim)
> The next Sky feature is a zoom-out view of Earth, the Moon and the Sun. I want to pull back from the existing Earth globe, see the Moon come into view, then pull back farther and see the Sun too. Give me a clear way back to the Earth view.
> Start with a docs-only proposal. Use the Earth-centred X/Y/Z vectors already in the raw Horizons exports and keep the scene on the same dated sample as Two Clocks. Check how to align those vectors with the globe's orientation at that timestamp. Show the real distances in the labels. If we enlarge the bodies or compress the spacing to keep the scene readable, label that clearly and preserve their calculated directions. The zoom experience should work with pinch on mobile as well as desktop controls.

Chad, earlier in the thread, before this brief: "shouldnt we have a view of the moon the sun when we zoom out". He agreed it is phase two and belongs in a new thread.

## 2. What already exists (facts from this thread)
- **Raw exports:** `phase1/sky/raw/hz-moon-ut-20261110.txt` and `hz-sun-ut-20261110.txt`.
  - Contents: Horizons VECTORS, table 3, **X Y Z (km), VX VY VZ (km/s), LT, RG, RR**.
  - Settings: centre 500@399 (Earth body centre), **ICRF**, GEOMETRIC (no light-time or aberration correction), daily at 00:00 UTC, 2026-06-01 → 2027-12-31, DE441.
  - The generator checks the headers. The cross-check covers the Moon range only.
- **Catalogue `sky-2026-11-R1`** keeps only `[date, range_km, range_rate_kms, time_flag]`; it has **no vectors**.
  - Vectors on the page therefore need a **new catalogue revision** (new id, new R2 key; old pins stay, per the T3 contract) or a separate scene file. That is a proposal decision.
  - Size is a consideration: R1 is 71,925 B, served at 26,819 B with zstd.
- **"Same dated sample as Two Clocks":** the card's "today" is the UTC date on the device clock, matched exactly, at 00:00 UTC. A missing date or a date outside coverage shows as unavailable, never as a neighbouring day.
- **Globe:** globe.gl (three.js) with an Earth-fixed lat/lng texture. The page already computes a day/night terminator and subsolar point (`solar.test.mjs`, `terminator-*.test.cjs`).
  - The Horizons Sun direction can be checked against that existing subsolar computation as an independent alignment check.
- **Two Clocks text** says "Nothing is drawn on the globe". The zoom-out view changes that, so Sources and the card wording need revising with it.

## 3. Questions the proposal must answer (none answered yet)
1. **Frame alignment:** ICRF (inertial) → the globe's Earth-fixed orientation at the sample instant (00:00 UTC).
   - Needed: Earth rotation angle / sidereal time from UT1 (UTC is within 0.9 s of it), plus precession–nutation, or an argued bound on ignoring them. The size of these terms must be **sourced** (IERS conventions / SOFA or the Horizons documentation), not stated from memory.
   - Also needed: how globe.gl's axes map to three.js's, and a test that a known direction lands in the right place. Candidates: the Sun over the subsolar point at 00:00 UTC, and the Moon's sublunar point against an independent source.
2. **Scale:** true scale is unreadable (Moon ≈ 60 Earth radii, Sun ≈ 23,000 Earth radii [GK, to be confirmed from the exports]).
   - Options: true scale with markers; compressed spacing (log or piecewise); enlarged bodies.
   - Whatever is chosen: label it on screen, keep the **calculated directions exact**, and show **real distances** in the labels from the same sample.
3. **Zoom experience:**
   - Continuous pull-back (Earth → Moon in view → Sun in view), or snap stops.
   - Desktop: wheel and buttons. Mobile: pinch. Keyboard. Reduced motion.
   - A clear **"Back to Earth"** control. What happens to the globe layers and Readings sheet while zoomed out.
4. **Which date the scene shows:** today's UTC sample only, or one that follows the Two Clocks card. What the scene shows when today has no sample.
5. **What is drawn:**
   - Moon and Sun as plain spheres or markers (no imagery unless a source is filed in REGISTER).
   - Optionally the Moon's phase from the geometry (a further claim; would need its own check).
   - Sun brightness and glare on the globe.
6. **Data path:** a new catalogue revision with vectors versus a separate file. The integrity rules carry over: page pin, hub pin, schema before render.
7. **Performance and accessibility:** frame rate on phones, a text equivalent of the scene, the 390 × 844 overlay limits, and no horizontal overflow.
8. **Tests and breaks:** the same standard as Two Clocks. Each acceptance check names a concrete break that must fail.

## 4. Lessons from Two Clocks to carry in
- Run a **refresh rehearsal** on a short window early. It found a real generator limit (no UT~ rows), now fixed by option (b).
- Label measured versus calculated versus estimated values separately on the card.
- Every timestamp in a log is a real clock reading.
- GPT smoke-tests from a hash-checked `_review/` copy.
