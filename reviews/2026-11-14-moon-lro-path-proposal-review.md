# Review: Dated LRO path on the Moon globe — proposal rev 1 (GPT)

Written 14 Nov 2026 15:58 UTC (clock reading) by Claude. Docs only: nothing was built or changed.
Proposal: `docs/concepts/MOON-LRO-DATED-PATH-PROPOSAL.md` rev 1. Copied unchanged from
`~/Documents/ChatGPT/Mother Earth/drafts/` (7,616 B, sha256 `f27ed580…0f1f`).
Checked against the Mac project folder (in sync with `main` 77db4f6): `craft.js`, `moonglobe.js`,
`phase1/skycraft/BUILD.json`, `build_examples.py`, `craft-moon-2026-06-R1.json`, `phase1/moon-globe.test.cjs`,
and `MOON-SUN-GLOBES-PROPOSAL.md` §3.1.

**Verdict: sound and buildable. Five points (R1–R5) to settle before a branch go; none is a redesign.**

## Facts confirmed against the code and data
- R1 catalogue: 1,441 states, 10 June 00:00 – 11 June 00:00 UTC, 60 s step, default 10 June 12:00; target −85,
  centre 301, frame 1, SPK type 13, segment 88 of 92 (words 894101–904203). The raw segment is pinned in the
  repo (80,824 B, sha256 `7fb04d7e…93f9`), so the unrounded states can be re-read. The catalogue itself holds
  positions rounded to 0.001 km.
- Diagram window: `window_samples: 120` either side, clipped at the ends (`craft.js` line 133). Matches.
- `?t=` rules, Previous/Next and "Position unavailable for this time." already exist in `craft.js`. Matches.
- Radius 1,737.4 km. Altitude across the day: 64.9 to 115.1 km (R1 summary).
- The texture convention test exists (`moon-globe.test.cjs` §D: 0° at the centre, east to the right, with
  mirror and flip breaks). Its landmarks are Tsiolkovskiy, Mare Orientale, Mare Moscoviense, Mare Crisium,
  Mare Imbrium, and Tycho against Mare Nubium. **Copernicus is not among them** (see R4).
- The page serves R1 itself (`hub: false`), so a same-origin static catalogue follows the existing pattern.
  Hub-first applies to feeds; this is a finished, archived day, so no collector is needed. Agreed.

## Points to settle

**R1. The cross-check moved away from what was agreed.** Globes proposal rev 2 §3.1 required the transform to
pass "a Horizons Moon-fixed request". Rev 1 replaces that with our own evaluation of DE440's lunar libration
angles plus NAIF's fixed PA → ME offset. That second evaluator is independent *code*, but it uses the *same
data and constants* as SPICE. It catches convention and implementation errors. It cannot catch a wrong kernel
or frame choice that both paths share.
*Proposal:* keep the libration-series check, and add one external comparison: at least the five listed
instants, against a Horizons result that gives LRO's sub-point on the Moon. Horizons must name the lunar frame
it used in its own output, and we record that. If Horizons can't produce that in a form we can verify, the
packet says so. Chad then decides whether the libration-series check alone is enough. This was the rev 2
condition, so dropping it is his call, not ours.

**R2. Pin the kernel names now, not "the corresponding".** Name the frame kernel, the binary PCK, the leap
seconds kernel (needed for any UTC entry point; the build uses TDB epochs, so record why it is or isn't loaded)
and the SPICE toolkit and its version (the container route is `spiceypy` from PyPI). At build time each file is
confirmed against the NAIF listing and its hash recorded in `BUILD.json`. Expected: `moon_de440_220930.tf`
(defines `MOON_ME_DE440_ME421`) and `moon_pa_de440_200625.bpc`. These are to be confirmed from NAIF, not
assumed.

**R3. Densification isn't needed. Say so with the number.** One minute at about 1.6 km/s is about 96 km of
chord. At 1,802 km from the centre (the lowest point of the day), the chord's sag is about 96² / (8 × 1,802) ≈
0.64 km, against a lowest altitude of 64.9 km. The straight line between samples stays far above the sphere.
Recommend: no densification, native samples only, and this arithmetic written into the packet. The test keeps
an assertion that no chord dips below the sphere.

**R4. The 1° texture gate needs a defined method and the real landmark list.**
- Replace Copernicus with the landmarks already pinned in the test (they come from the Gazetteer and were read
  13 Nov), or add Copernicus with its Gazetteer feature number.
- The existing test checks the *image file*. The new check must test the *rendered globe*: put a marker at each
  landmark's latitude and longitude using the path's own conversion, draw it, and confirm the screen point
  matches where globe.gl draws that texture pixel. One way: hide the marker and sample the rendered colour at
  its screen point, against the texture pixel at the same latitude and longitude.
- Keep the mirror and 180° breaks.
- Scale: the map is about 0.18° per pixel (2048 px wide), and the PA → ME difference is a few hundredths of a
  degree. So the 1° gate decides visual correctness, and the 0.001° gate is numerical only. The proposal already
  says this; keep it in the packet.

**R5. Don't let the line read as a ground track.** Globes rev 2 kept LRO off the globe partly because "a ring
over recognisable terrain would imply a ground track". At 65–115 km the path is only 0.04–0.07 Moon radii up.
From the default framing it will look as if it sits on the surface. The proposal's explanation sentence
covers this. Also recommend:
- the readout shows the selected sample's altitude in km;
- the test confirms the path is drawn at altitude, not draped on the surface.

The look itself (line weight, whether to add a faint ground-track twin) is a design choice for the
candidate's screenshots. It isn't settled here.

## Smaller notes
- "Planetocentric" latitude is correct for the Moon's sphere. The test's comment calls the Gazetteer values
  "planetographic"; for the Moon the two are the same. Correct the comment when the file is touched.
- J2000 vs ICRF: SPICE handles the frame bias (about 0.02″). It is far below every gate. No action.
- REGISTER: the new catalogue needs an entry, and so do the NAIF kernels / DE440 coefficients used to make it.
  Each is filed before the page release, on its own line, as before.
- The Moon-fixed rotation built here can be reused for "Lit as now". That still needs its own addendum
  (globes rev 2 §3.1). Nothing in this proposal turns it on.
- Release steps as proposed: branch build on Chad's go; GPT reviews the packet; the merge goes on its own
  Approve line. No hub, R2 or D1 change. Rollback is a page revert.

## Questions for Chad (D-items)
- **D1:** keep the Horizons external check (R1 above, Claude recommends), or accept the libration-series check
  alone?
- **D2:** ready for "Go: build moon-lro-path-rc on a branch per MOON-LRO-DATED-PATH-PROPOSAL rev 1 + this
  review (page only; no merge)" — or should GPT fold R1–R5 into a rev 2 first?

## Addendum — rev 2 checked (14 Nov 2026, 16:03 UTC clock reading)
Rev 2 (10,552 B) folds in R1–R5. Rev 1 is kept at `superseded/MOON-LRO-DATED-PATH-PROPOSAL-rev1.md` (Mac).
- R1: closed. Both checks are kept. The Horizons check: target 301 seen from `500@-85`, quantity 14, five
  epochs, the header must identify `MOON_ME`, ceiling 0.01°, and a blocker goes back to Chad before release.
  0.01° (36″) comfortably covers the small offset between the DE421-aligned and DE440 mean-Earth frames.
  Light time Moon → LRO is about 6 ms: negligible.
- R2: closed. `moon_de440_250416.tf` (newer than the one I named), `moon_pa_de440_200625.bpc`, `naif0012.tls`,
  SpiceyPy 8.0.0 / N0067. Each is confirmed and hashed at build time.
- R3: closed. Native samples only. The rendered chords are tested in the Moon-fixed frame.
- R4: closed. The actual fixture list, and a rendered-globe fiducial check with sign-flip and 180° breaks.
- R5: closed. Altitude in the readout, rendered radii asserted, a limb capture.
- **Ready for a branch build.** Nothing further from Claude before the go.
