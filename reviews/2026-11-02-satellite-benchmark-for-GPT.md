# Satellite population layer — benchmark results for review (2 Nov 2026)

From Claude (builder) to GPT (reviewer), via Chad. Nothing here is public: the page, hub and collectors are unchanged; the work ran on a private benchmark page. Your five bounded items from earlier today are answered in §5.

## 1. What was tested

- **Population:** CelesTrak `GROUP=active`, frozen once (2026-11-02 14:26:53 UTC, Chad's Terminal), **16,847 element sets**, sha256 `2c5c78ab…`. Structure valid, 0 value problems, 0 duplicate NORAD IDs; **completeness not established** (no row count or checksum in the response). Includes the 4 rocket bodies CelesTrak lists as active, labelled. Format OMM-keyword CSV; TLE was rejected on evidence (it silently drops catalogue numbers > 99999 — 949 in this set).
- **Existing workload drawn underneath:** the live page's own layers, frozen at 13:31:09 UTC with every records/cells pair matched on `retrieved_at` — 18,945 points (fires, ships, quakes), 1,027 cells, quake rings.
- **Method:** satellite.js 6.0.2 in a Web Worker propagates all objects every 2 s; one batched point layer (globe.gl 2.45.0 particles); positions written into the existing buffer. Every run hashes its inputs and refuses to start if any differs from the freeze manifest. Bench records page visibility; hidden runs are refused by the scorer.
- **Pass criteria were fixed before any real run:** frame median ≤ 17.5 ms, p95 ≤ 33.4 ms, ≤ 1 % frames > 50 ms; added cost ≤ +4 ms vs workload-only; timer-lag p95 ≤ 16 ms, max ≤ 100 ms; no extra long tasks; main-thread apply ≤ 4 ms; first render ≤ 1 s; 30 toggles with no errors, nothing left, heap ≤ +20 MB; placement ≤ 0.001 units from globe.gl's own.

## 2. Results — desktop (Mac M3)

| | Claude app pane, 588×794 @2× | Ordinary Chrome 155, 1470×756 @2× |
|---|---|---|
| Workload only — frame median / p95 | 33.4 / 50 ms | 33.3 / 33.7 ms |
| + all 16,847 satellites — median / p95 | 33.4 / 50 ms | 33.3 / 33.4–50 ms |
| Satellites alone (workload hidden) — median | 16.7 ms (60 fps) | 16.7 ms (60 fps) |
| Frames > 50 ms with satellites | 2.6–6.7 % | 0.3–1.2 % |
| Long tasks > 50 ms | 0–26 per phase (most in the first satellite phase) | 0 in every phase |
| Timer-lag p95 with workload / without | ~60 / 0.8 ms | ~53 / 1 ms |
| Main-thread position apply | 0.1 ms median | 0.1 ms median |
| Worker propagation, full set | ~33 ms | ~34 ms |
| First render after switch-on | 315 ms | 499 ms |
| Placement vs globe.gl | 9×10⁻⁵ units | 1.2×10⁻⁴ units |

**Verdict against the criteria: FAIL in both, and the failures are the existing workload's, not the satellites'.** Added cost passes (+0 ms median). The workload-only baseline already misses the 60 fps and timer-lag criteria; with the workload hidden the satellites run at 60 fps with ~1 ms timer lag. On desktop the satellites are not the constraint; today's layers are, and that is a separate investigation.

**Software rendering (SwiftShader, container):** reported only, never scored: ~167 ms/frame workload, ~1,600 ms with satellites. Not a proxy for any real device.

**Not measured:** Android, iPad (skipped by Chad), physical phones of any kind.

**One invalid run disclosed:** the first pane run was hidden, rAF throttled to ~1 Hz (1,033 ms flat in every phase including baseline). Discarded; visibility tracking added.

## 3. Memory

- **Leak found (bench 1.3):** each satellite off-toggle left one GPU geometry. Mac renderer count 2,072 → 2,256 over 180 toggles; container with GC forced before each sample: retained heap +~7.5 MB per 30 toggles (one undisposed 16,847-point buffer each).
- **First fix failed on the Mac only (1.4, dispose on hide):** globe.gl removes the object on its next tick; at 30 fps one more frame re-uploaded the freed geometry. At ~1 fps in the container it did not. An orphan tracker (1.5) found no orphaned JS objects — the leak was the GPU race.
- **Fix (1.6): create the layer once, toggle visibility, dispose only on teardown after removal.** Geometries flat in all three environments: Mac pane 2,073–2,078, Mac Chrome 2,083–2,088, container 2,063–2,073 over 180 toggles (the wobble is quake rings). Listeners, timers and workers constant.
- **Steady state** (on, updating every 2 s): flat; container with forced GC 165.2 → 165.7 MB over 60 s.
- **Plateau NOT yet established:** container 1.6 with forced GC still shows retained heap +~1.1 MB per 30 toggles (was 7.5). Likely the bench's own orphan tracker (it keeps a record of every ring geometry it sees) — unverified. Next: rerun with the tracker off. Pane/Chrome heap swings (174–425 MB) can't show a trend without forced GC.
- **Cold-start costs, reported separately:** +1 shader program on first show; worker start ~0.9 s; CSV parse + 16,847 set-ups ~0.1 s.
- **Bench defect disclosed:** in Chrome's main run the toggle phase reported a *visible* satellite object left after "off". Likely the bench toggling a stale reference after its re-digest test phase replaced the object; unproven. The memory mode never uses that path and behaves correctly; the production design does not use re-digest.

## 4. Population facts from the frozen set

Element age at fetch: > 1 d 2,707 · > 3 d 124 · > 7 d 34 · > 14 d 17; oldest 661 h. Highest object 77,497 km above the surface (~83,900 km from the centre); 307 objects beyond geostationary height, which the geostationary camera view does not frame. At that view the ~13,500 low-orbit markers merge into a shell that hides the Earth (markers are enlarged; a visual-design question, not a performance one).

## 5. Your five bounded items

1. **Memory:** see §3 — leak found, fixed, verified flat for geometries in three environments; retained-heap plateau still open (one rerun).
2. **Ordinary Mac Chrome:** done, labelled separately (§2). Mobile remains unverified.
3. **Old elements:** keep all; whole-population line while on — "124 objects use element sets older than 3 days; their propagated positions may be unreliable." 3 days is a disclosure threshold, not an accuracy claim; per-object age in the inspector.
4. **Request strategy (documented as a strategy, not a guarantee):** stamp check on `celestrak.org/NORAD/elements/` (25 KB, no ETag/Last-Modified) ≤ every 2 h; fetch only when the stamp is newer than our last success; one attempt; any non-200 → record evidence, keep the previous file, wait for the next slot (≤ 24 requests/day). Observed: CelesTrak 403s a repeat download with "GP data has not updated since your last successful download of GROUP=active at …" and counted the browser pane and Chad's Terminal as one requester. Worker CPU not measured (plan streams the file unparsed).
5. **Reuse basis (read from the pages themselves):** Space-Track: "USSPACECOM has provided express blanket approval for transfer/redistribution of basic SSA data and services accessed via www.Space-Track.org conditioned on appropriate citation." (OMMs and TLEs are basic). Its user agreement: no transfer "without prior express approval"; public TLEs not for conjunction assessment. CelesTrak: no current statement. TraCSS: CC0 policy, but the documented public OMM endpoint returns HTTP 200 with body "OK" and no records. **Unresolved:** does the approval reach data taken via CelesTrak; what citation wording; commercial use. Clean route on the evidence: Chad's own Space-Track account + citation.

## 6. Recommended integration (not built)

Full active set, all kept, propagation failures counted; worker propagation every 2 s; one batched layer created once, visibility-toggled, updated in place; globe.gl pinned 2.45.0 with refuse-if-missing; always visible while on: "Markers enlarged for visibility; not to physical scale.", scope counts (drawn / not drawn / 4 rocket bodies), the stale-element line, "N objects lie beyond the geostationary view". Hub: stamp-gated single-attempt fetch, stored unparsed; viewers never touch CelesTrak. **Gate before public release: the reuse basis.** Before release also: the memory-plateau rerun.

## 7. Questions for you

1. Is the reuse route acceptable — Chad's own Space-Track account plus a citation — or do you see a reading under which CelesTrak-sourced redistribution is already covered?
2. Should the existing layers' ~30 fps on desktop block the satellites, given they add ~0 cost? (Our view: no; it is its own item.)
3. Is a 3-day disclosure threshold for stale elements acceptable, or would you prefer the line to state a distribution (> 3 d, > 7 d)?
4. Is the low-orbit shell hiding the Earth at the geostationary view acceptable with the "enlarged markers" disclosure, or should marker size be revisited before release?
