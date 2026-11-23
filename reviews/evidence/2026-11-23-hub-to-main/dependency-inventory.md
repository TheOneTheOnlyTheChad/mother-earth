# Hub-to-main candidate: which browser suites depend on the hub file (counted on base main `fb30ee9`, 23 Nov 2026)

Search, on the base and again on the candidate: every `phase1/*.cjs` suite and every helper under `phase1/` for
`worker.js`, `worker.mjs`, `loadWorker`, the three hub-loading helpers, and the prebuilt-fixture folder
`/home/claude/fixtures`. 45 browser suites on the base; 16 match.

| Suite | How it depends on `phase1/worker.js` | Run in the pair? |
|---|---|---|
| `fire-status-ui` | imports it and answers the page's requests with it; also reads its source text | yes |
| `fires-wording-ui` | reads its source text and matches the hub's notes against the page | yes |
| `legend-active-ui` | imports it | yes |
| `oceanheat-ui` | copies it to a temporary module and imports it | yes |
| `place-ui` | imports it; `/place` is answered by its own `fetch()` | yes |
| `quakes-ships-status-ui` | matches patterns against its source text | yes |
| `ships-retain-ui` | imports it; also loads an older hub from git `155af90` | yes |
| `status-notes-ui` | loads it as the candidate, and git `143f531` as the control; uses the orbital fixture | yes |
| `timeline-changes-ui` | loads it as the new hub, and git `95ffad0` as the old hub | yes |
| `osmc-reliability-ui` | through `phase1/osmc-reliability-fixture-hub.mjs`, which runs it behind a local port | yes |
| `skycraft-ui` | through `phase1/skycraft-fixture.mjs`, which runs the hub job once | yes |
| `key-drawn-ui` | no mention; reads the orbital fixture, which `phase1/orbital-fixture.build.mjs` builds with the hub's own `orbBuild` | yes |
| `mobile-pass` | the same orbital fixture | yes |
| `orbital-browser` | the same orbital fixture, passed as a folder | yes (run alone: it is load-sensitive) |
| `animals-tab-ui` | byte-comparison guard, check 13c: the hub file against a pinned main (`0e62083`) | yes |
| `wind-ui` | a comment only; no load, no helper, no fixture | **no** |

**15 run, 1 excluded with its reason.** Rev 2 of the plan counted 13 consumers and 1 guard; the recount adds
`orbital-browser`, which rev 2 had set aside as "comment only" without following its prebuilt fixture.

**Generated inputs.** The orbital fixture was rebuilt in each tree by that tree's own
`phase1/orbital-fixture.build.mjs` before its suites ran. Both builds printed the same object counts, the same
byte count (5,433,426) and the same hash prefix (`94513bef7a0d`): the hub's `orbBuild` gives the same file at
0.6.19 and 0.6.24. The Ocean Heat snapshot comes from git `db5eedd` and does not involve the hub file.

**Helpers under `phase1/` that load the hub file and are not suites** (none is run by this work, and none is in
the manifest except as already on main): `aircraft-mac-regression.sh`, `bench-firms-memory/*`,
`firms-v2-breaks.mjs`, `health-breaks.mjs`, `ocean-heat/check_release_pins.mjs`, `orbital-fixture.build.mjs`,
`osmc-reliability-fixture-hub.mjs`, `place-down-breaks.mjs`, `recovery-firms-2026-11-05/recover.mjs`,
`skycraft-fixture.mjs`, `status-notes-breaks.mjs`.

**Not run for this candidate, and why:** the other 29 browser suites. They load no hub code, no hub-built fixture
and no file the candidate changes; the candidate changes no page file, script, stylesheet or asset
(`check-manifest.mjs`).
