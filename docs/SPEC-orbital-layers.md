# Orbital layers — spec draft (3 Nov 2026, thread 7; Chad + GPT + Claude)

Status: **draft for the next thread. Nothing built.** The live Satellites toggle (CelesTrak "active" group) stays exactly as it is until this replaces or sits beside it — Chad decides which.

## Purpose
Let people see what is in orbit beyond the working satellites: switch the active ones off and see what is still up there. Show, don't tell — counts, labels and disclosures only; no adjectives.

## Scope line (public, verbatim)
"Publicly catalogued objects with usable orbital elements." Never "everything in orbit".

## Sources and what each supplies

| Need | Source | Rule (published) | Notes |
|---|---|---|---|
| Elements for every on-orbit public object | **Space-Track GP**, Chad's account | ≤ 1 request/hour at an off-peak minute (10–20 min either side of :00/:30); < 30/min, < 300/h overall | Space-Track's own recommended filter: `decay_date null-val` + `epoch > now-10` (objects not decayed, elements under 10 days old). GP already carries `OBJECT_TYPE`. |
| Object type | GP `OBJECT_TYPE` (PAYLOAD · ROCKET BODY · DEBRIS · UNKNOWN/TBA) | as above | Used first, for every count. |
| Operational status of payloads | **CelesTrak SATCAT** `OPS_STATUS_CODE`, joined by NORAD catalogue number | CelesTrak usage policy (≤ one download per update) | Space-Track's published SATCAT schema has **no operational-status field** (GPT check, 3 Nov). CelesTrak codes measured 2 Nov: `+` operational, `P` partially, `B` backup, `S` spare, `X` extended mission, `-` non-operational, `D` decayed, `?` unknown. |
| Reuse basis | Space-Track blanket approval for basic SSA data **accessed via Space-Track**, conditioned on citation | — | Covers GP + SATCAT from Chad's account. CelesTrak status data: same open question as today (recorded, not a licence). |

## Classes (computed in the hub; every object lands in exactly one)
1. **Active satellites** — `OBJECT_TYPE = PAYLOAD` and CelesTrak status in {`+`,`P`,`B`,`S`,`X`}.
2. **Inactive satellites** — `PAYLOAD` and status `-`.
3. **Rocket bodies** — `ROCKET BODY`, **by type first** (so the 4 rocket bodies in CelesTrak's active group are rocket bodies here, whatever their status).
4. **Debris** — `DEBRIS`.
5. **Unknown** — `UNKNOWN`/`TBA` type, payloads with no CelesTrak match, or status `?`. **Counted and listed separately; never folded into another class.** Whether it gets drawn (own toggle, or not drawn) is an open decision (below).

## UI
Three **independent** toggles, all **off on a fresh load**, no requests while off, each touching only its own layer (same rule and tests as Satellites/Aircraft):
- **Active satellites**
- **Inactive satellites & rocket bodies** — one toggle, but the two are kept separate in the data and their **counts are shown separately**
- **Orbital debris**

While any is on, always visible: scope line; counts drawn / omitted (omitted = unusable elements or propagation failure) per class; unknowns count; stale-element line (> 3 days at the pass time); beyond-GEO count; "Positions computed from published orbital elements — not observed"; "Markers enlarged for visibility; not to physical scale."; the size floor ("objects too small to track — roughly under 10 cm in low orbit — are not in any catalogue; ESA estimates far more of them, which cannot be plotted"; figure and citation to be taken from ESA's current Space Environment Report, not from memory).

## Hub (same storage rule as satellites)
- One GP fetch per slot (≤ 1/h; we'd use ≤ every 2 h unless shown necessary), stamp/epoch-gated if Space-Track exposes a cheap change signal; one SATCAT fetch per day after 17:00 UTC; CelesTrak SATCAT status per its rules.
- Validate → publish one current file per input with matching metadata → delete the previous; failures keep the last good set with original times; no temp files.
- Classification done in the hub, published as a small per-object class column (or class index) alongside the elements, so the page never joins catalogues itself.
- Credentials: Chad's Space-Track login as Worker secrets (he pastes). **Unmeasured: whether the Worker can reach space-track.org** (CelesTrak gave the Worker a 522 at 05:08 UTC 3 Nov; OpenSky did on 30 Oct). Fallback: the Mac fetches and posts, like ships.

## Page
Reuses the satellites design unchanged: one batched particle layer per toggle created once, positions written in place, visibility toggled, worker propagation every 2 s only while something is on and the tab is visible. One worker can serve all classes.

## Measurements before anything is built (in order)
1. **One bounded Space-Track GP query** (pane, Chad logged in, at an off-peak minute) with Space-Track's recommended filter, limited to the fields needed for counting → **actual counts by `OBJECT_TYPE`**, total rows, bytes, element ages. Recorded in STATUS before any decision.
2. Join a CelesTrak SATCAT status snapshot by NORAD ID → counts per class, including unknowns and unmatched.
3. **Benchmark the combined view at the real payload** (bench 1.6.1 design; the 16,848 run cost ~0 frame time on the Mac, 30–40k unmeasured) — before shipping, as a bounded run with criteria written first.
4. Worker reachability to space-track.org (one request inside the rules).

## Open decisions (Chad)
- Does the new **Active satellites** toggle replace today's Satellites toggle (CelesTrak active group), or do both coexist for a while?
- **Unknown** class: own toggle, drawn with debris but counted apart, or counted only?
- Element-age filter: Space-Track's 10-day epoch filter vs keeping everything with elements and disclosing age (as today).
- Cadence: hourly allowed; every 2 h proposed.
