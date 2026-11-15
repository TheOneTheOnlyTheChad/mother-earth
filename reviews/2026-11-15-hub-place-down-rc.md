# hub-place-down-rc — candidate for GPT review (round 1)

15 Nov 2026 · branch `hub-place-down-rc` from main `f655613` · **hub source only** · nothing deployed · no merge
Built on Chad's Go line. Spec: `docs/concepts/HUB-PLACE-DOWN-FIX-PROPOSAL.md` rev 2, §7 governing.
Live hub is still 0.6.14 (`bbf8dc61…0480`).

## 1. What changed

`phase1/worker.js` → collector **0.6.15**, sha256 `aa2e6440e7a1f1bf25a009299388d2509438d197a2a23aafdd66d519ab816d8b`, 365,418 bytes.

| | Change |
|---|---|
| New | `placeDown(layer, cells)` = the section's metadata from that envelope + `state: 'down'`. No cell, count, records or `why`. |
| H1a | `placeSection`, first counts read: `cells.source_status === 'down'` → `placeDown`. (Was `… && !cells.cells`, which never fired because the down writers publish `cells: {}`.) |
| H1b | `placeSection`, ordinary path: after the pairing re-read replaces `cells`, a down final envelope → `placeDown`, before the records are read again and before any pairing answer. |
| H1c | `fvPlaceSection` (FIRMS `lines/1`): the same test on the final envelope after its re-read, before the second record scan and before any pairing answer. |
| H2 | `COLLECTOR_VERSION = '0.6.15'`. |

No schema change, no binding, no schedule, no change to what is collected or stored. One side effect of the version bump: the collector's `User-Agent` on upstream requests reads `mother-earth-collector/0.6.15` (as on every version bump).

Page files are untouched. The page already renders `state: 'down'` as "unknown — <note>".

## 2. A finding about the breaks

With H1a alone undone, a down envelope whose records file exists is still answered `down`, because the records never pair with a down envelope, the re-read happens, and H1b / H1c catch it. H1a is the only thing that answers `down` in two cases, and both now have a test:

- no records file at all (was: "withheld … records unreadable") — `PD5`;
- FIRMS `lines/1` with every scan slot taken (was: `busy` beside a down envelope, after waiting up to 2 s) — `PDL4`.

H1a also means a down layer costs no records read.

## 3. Tests

**`history-hub.test.mjs`: 33 passed (was 27).** Ordinary path.

| Case | What it shows |
|---|---|
| PD1 | First read down → `down` with that envelope's note, `retrieved_at` and `run_ref`; no count, no records. Earthquakes use the envelope the hub's own `writeDown` wrote after a failed fetch; fires (legacy file), ships, buoys and microplastic get the same envelope. Forest unchanged. |
| PD2 ×2 | Earthquakes and buoys: first read ok but not the records' run, re-read returns down → `down` from the **re-read** envelope; counts read twice; records file read once. |
| PD3 | Genuine mismatch on both reads → `withheld`, same sentence as before; counts re-read once; other layers `ok`. |
| PD4 | Buoy counts kept after a failed update (`last_attempt`, status ok) are not `down`; `/` reports 0.6.15. |
| PD5 | Down counts and no records file → `down`; the records file is not read. |

**`firms-v2.test.mjs`: 61 passed, 7 skipped (was 57, 7 skipped; the skips need the real 5 Nov files).** `lines/1` path; records and counts written by the hub's own v2 pipeline, the down envelope by its own writer after an HTTP 500.

| Case | What it shows |
|---|---|
| PDL1 | First read down → `down` with the note and run metadata. |
| PDL2 | First read ok but another run, re-read down → `down` from the re-read envelope; counts read twice. |
| PDL3 | Genuine mismatch on both reads → `withheld` with the counts cell; a matching pair → `ok`. |
| PDL4 | Down counts with both scan slots taken → `down`, not `busy`. |

**`place-down-breaks.mjs`: every break bites, in the expected cases only.**

| Break | Suite | Fails exactly |
|---|---|---|
| H1a restored to `&& !cells.cells` | history-hub / firms-v2 | PD5 / PDL4 |
| H1b removed | history-hub | PD2, PD2 |
| H1c removed | firms-v2 | PDL2 |

Both H1a and H1c breaks are also in `firms-v2-breaks.mjs`.

**Through the page** (main's page files, this worker): `place-ui` 35 passed (was 30). New case 8: earthquakes, ships and buoys down → the hub answers `down`, and the place rows read "unknown — <the collector's note>", none says "withheld". Against the 0.6.14 worker the four new checks fail. Also passing against this worker: `fire-status-ui` 279 (legacy and `lines/1`), `quakes-ships-status-ui` 124, `status-notes-ui` 17, `fires-wording-ui` 35, `legend-active-ui` 548, `skycraft-ui` 77, `timeline-changes-ui` 173, `orbital-browser` 113, `freshness-wording-ui` 156, `mobile-pass` 131; `osmc-reliability-ui` 40 of 41 (the one failure is identical on main).

**Every hub suite:** `arts-hub` 54, `buoy-temp` 37, `drifters-hub` 12, `duration-contract`, `dustrgb-hub` 174, `firms-guard` 19, `health-hub` 29, `kp-degraded` 29, `moon-light` 27, `orbital-hub` 13, `osmc-reliability-hub` 27, `place-rows` 7, `plastic-hub` 11, `satellites-hub` 12, `search` 111, `ships-fallback` 7, `ships-late` 7, `ships-probe` 11, `sky-build` 35, `sky-hub` 46, `sky-scene-hub` 7, `sky-scene-ref` 7, `skycraft-hub` 164, `solar` 26, `spacetrack-probe` 11, `status-notes-hub` 6, `sunface-hub` 171, `timeline-catalogue-hub` 73, `timeline-changes-build` 45: all pass, same counts as main. `sunface-hub` had a pin on the 0.6.14 User-Agent; moved to 0.6.15. Not run here, as on main: `oceanheat-hub` (needs `OH_SNAPSHOT_DIR`), `orbital` (needs a GP file).

## 4. Not done, not claimed

- Not deployed. No production request was made.
- "No second record scan" in PDL2 is by code order only: a second scan of an unchanged file is answered from the per-isolate cache without an R2 read, so the test cannot see it.
- The full `firms-v2-breaks.mjs` run (about 45 breaks) was not repeated; its two new entries are covered by `place-down-breaks.mjs`.

## 5. Release steps (each on Chad's own Approve line)

1. **Deploy 0.6.15** in the Cloudflare editor. Chad at the screen for the pane and the final Deploy click. After: served worker hash equals `aa2e6440…6d8b`; `/` reports 0.6.15; bindings still 22 with `SUNFACE_ENABLED=1` and `SKYCRAFT_ENABLED=1`; the eight health URLs answer as before; one `/place/g4/14_49` request returns 200.
2. **Merge to main** (source and tests; no page file changes, so the live page is not affected).

Rollback: redeploy 0.6.14 (`bbf8dc61…0480`, main `f655613`'s `phase1/worker.js`).
