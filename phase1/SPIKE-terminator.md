# Render spike — day/night overlay (2 Nov 2026, thread 5)

Run before writing the feature, to choose the render channel on evidence rather than assumption.
Everything below was measured against the **real globe.gl 2.45.0**, served from `node_modules` because the
container cannot reach unpkg, driven by Playwright with Chromium's software renderer (SwiftShader).
Scripts: `/home/claude/spike/spike{1..6}.cjs` (scratch, not committed — the findings are here).

## What was asked

> A separate render channel is preferred if straightforward, but don't add substantial complexity solely to
> enforce that distinction. The chosen method must preserve point visibility, coverage outlines, picking and
> search/inspector behaviour. Test poles and the date line whichever rendering method wins. A texture does not
> automatically eliminate those cases. Record render resolution and measured performance.

## Findings

| # | Question | Measured answer |
|---|---|---|
| 1 | Is `THREE` global from the UMD bundle? | **No.** `typeof window.THREE === 'undefined'`, and class names are minified (`Scene` reports as `Fi`). Constructors must be harvested from live objects via `.constructor`. |
| 2 | Can they be harvested at page load? | **No — timing-dependent.** At inline-script time the globe mesh does not exist yet and `SphereGeometry` is unreachable. Harvested *after* the globe is built, `Sphere`, `Mesh`, `Material` and `Texture` are all available. → harvest **lazily, when the overlay is first enabled**, and fail honestly if anything is missing. |
| 3 | Is `Texture` reachable? | Only once the globe has an image: it comes from `globeMaterial().map.constructor`. With no `globeImageUrl` it is absent, and a material built with `map: null` renders an **opaque white sphere** that hides everything. The feature therefore refuses to enable rather than half-render. |
| 4 | `customLayerData` vs `scene.add` | **`customLayerData` threw 22 uncaught `TypeError: Cannot convert undefined or null to object` across 25 on/off toggles.** Adding our own mesh to the globe mesh's parent threw **none** across 30 toggles. → **own mesh wins**, and it is also the simpler code. |
| 5 | Globe radius and safe altitude | `getGlobeRadius() === 100`. Our records sit at altitude 0.002–0.026 (r 100.2–102.6) and coverage polygons at 0.006 (r 100.6). The shading sphere is placed at **altitude 0.0005 (r 100.05)** — above the globe surface, below everything we draw. |
| 6 | Does it obscure records? | **No.** Measured before/after at minimum (0.002) and maximum (0.026) altitude, inside and outside the shaded half: `204,0,0 → 204,0,0`, `0,204,0 → 0,204,0`, `204,204,0 → 204,204,0`. Exact colours preserved. |
| 7 | Does it intercept picking? | **No**, with `mesh.raycast = () => {}`. Clicking a coverage cell lying under the shading still fired `onPolygonClick` and returned the cell. |
| 8 | **UV alignment** | **This was the trap.** globe.gl orients its globe mesh at **`rotation.y = −π/2`**. A fresh `SphereGeometry` does not inherit it, and the shading landed **90° out** — plausible-looking and entirely wrong. Fixed by copying the globe mesh's rotation *and* its geometry's angular parameters (`phiStart`, `phiLength`, `thetaStart`, `thetaLength`). After the fix: canvas x=0 maps to lng −180, west dark, east light, transition at lng 0. |
| 9 | Poles | Correct. With everything north of 70 °N shaded and the camera over the pole: luminance **25 at 88 °N** (dark) against **152 at 45 °N** (light). |
| 10 | Date line | **No seam.** A 20° band each side of ±180, camera on 180: luminance drop **89** at −175, −168, +168, +175 and **0** at ±150, ±120. |
| 11 | In-place texture update | Redrawing the canvas and setting `map.needsUpdate = true` re-renders: flipping the shaded half moved every west probe to light and the east probes to dark. |
| 12 | Leaks | Without disposal, **10 rebuilds leaked 10 geometries**. With `scene.remove` + `geometry.dispose()` + `material.map.dispose()` + `material.dispose()`, 30 toggles returned renderer memory to baseline (geometries 0 → 0, scene children 30 → 30). |
| 13 | Paint cost | Per-pixel alpha written by a naive JS loop: **2.97 / 14.27 / 49.55 ms** at 512×256 / 1024×512 / 2048×1024. A canvas **path** fill is **0.06–0.21 ms**. The shipped code is per-pixel but hoists `cos(lng − subsolar)` per column and the latitude terms per row, leaving no trigonometry in the inner loop; measured **~11 ms at 1024×512 on the software renderer**, once per minute. |

## Decisions taken from this

- **Channel:** our own `Mesh` added to the globe mesh's own parent `Group`. Separate from `polygonsData`,
  `pointsData` and `ringsData`, so computed geometry can never enter the observation render path or the
  cells/records pairing invariant — and it is the *simpler* option, not a complexity tax.
- **Orientation:** copy the globe mesh's rotation and sphere parameters. Never assume UV alignment.
- **Altitude 0.0005**, `depthWrite: false`, `renderOrder: -1`, `raycast` disabled.
- **Resolution 1024×512**, alpha 0.40, per-pixel geometric test (no special case at an equinox, a pole or the
  date line, unlike solving for the boundary latitude).
- **Lazy constructor harvest at enable time**, refusing to enable if anything is missing.
- **Explicit disposal on every disable.**

## What this spike does NOT establish

- Performance on real GPU hardware. Every figure above comes from SwiftShader, a software rasteriser; treat
  them as pessimistic for render cost and representative for the CPU-bound canvas work.
- Behaviour on a physical phone. The 390 px checks are emulated.
- That globe.gl will keep `rotation.y = −π/2` in a future version. The code copies whatever the globe mesh
  reports rather than hard-coding the value, so an upstream change is followed rather than broken — but the
  assertion that the rendered shading matches `ME.sunlit` (in `phase1/terminator-ui.test.cjs`) is what would
  actually catch a regression.

---

## Dependency on globe.gl internals (recorded deliberately)

The overlay needs three.js constructors (`SphereGeometry`, `Mesh`, a material, `Texture`) and globe.gl's UMD
bundle exposes **no global `THREE`**, with class names minified. The only route is to read them off objects
globe.gl has already built — `mesh.constructor`, `geometry.constructor`, `globeMaterial().map.constructor`.

**This is reliance on another library's internals and is treated as such:**

- **The version is pinned.** The page loads `globe.gl@2.45.0`; both automated suites assert that the pinned
  copy they serve is the same version the page requests, and fail if they ever diverge.
- **Orientation is read, not assumed.** The code copies the globe mesh's `rotation` and its geometry's
  angular parameters instead of hard-coding the `-π/2` the spike measured, so an upstream change is
  followed rather than silently mis-rendered.
- **Harvest happens lazily, at first enable** — the globe mesh does not exist at script time.
- **Failure is refusal, not degradation.** If any constructor is missing the overlay does not switch on: the
  toggle resets to unchecked, a plain-language explanation appears, no legend line is shown, and the globe,
  its records, picking and search are untouched. A material built with `map: null` would otherwise render an
  **opaque white sphere hiding the entire globe**, which is precisely why this path refuses.
- `phase1/terminator-behaviour.test.cjs` exercises that failure path directly by stripping the globe
  material's map before the page builds, and asserts the globe survives intact.

**What would catch an upstream regression:** the acceptance suite asserts that the *rendered* shading agrees
with `ME.sunlit` at probes across the visible disc, at a pole and across the date line. A change in how
globe.gl orients or UV-maps its sphere would show up there as disagreement, not as a silent 90° error.

## Three different limits, kept apart

| Limit | Size | What it is |
|---|---|---|
| Solar position vs astronomy-engine | ≤ **0.0124°** | the arithmetic only (`phase1/solar.test.mjs`) |
| Texture quantisation at 1024 × 512 | ~**0.35°** | one pixel of the equirectangular canvas |
| Staleness between one-minute repaints | up to **0.25°** | Earth's rotation between recomputes |

The **drawn** boundary can therefore sit ~**0.6°** from the instantaneous geometric one — about fifty times
the arithmetic's own error. Reference agreement is not a statement about what is on screen, and neither is a
statement about observed sunrise, which is a further ~0.83° away.
