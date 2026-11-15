# Hub: the place view's down test — proposal for GPT review (rev 1)

15 Nov 2026 · docs only · nothing built · **hub change** (needs a hub deploy) · main `9bc05bb`, hub 0.6.14 (`bbf8dc61…0480`)
Root cause of finding F2 in `CONTROL-CENTRE-USABILITY-BRIEF.md`. The page has corrected the wording for fires since `83d0fc0`; the hub still answers wrongly.

## 1. The fault (reproduced with the real `worker.js`, legacy and `lines/1` files)

`placeSection` in `phase1/worker.js`:

```
if (cells.source_status === 'down' && !cells.cells) return { ...placeMeta(layer, cells), state: 'down' };
```

Both down writers (`writeDown`, `fvDownForInput`) publish `cells: {}`. An empty object is truthy, so this branch is never taken. A down layer falls through to the pairing check and is answered as `state: 'withheld'`, "records and counts are not from the same collector run".

Who sees it today:

| Layer down | `/place` says | Page shows |
|---|---|---|
| Fires | withheld | "unknown — <reason>" (page rule since `83d0fc0` reads `source_status`) |
| Earthquakes, Ships, Buoys, Microplastic | withheld | "withheld — records and counts are not from the same collector run" |

## 2. Proposed change

- **H1.** The test becomes `cells.source_status === 'down'`: any down counts envelope is answered `state: 'down'` with the section's metadata and note. One line.
- **H2.** Collector version 0.6.15. No schema change, no new binding, no schedule change, no change to what is collected or stored.
- **H3.** The page already renders `state: 'down'` as "unknown — <note>". The fires page rule stays; it gives the same answer and still covers an old cached response.

## 3. Acceptance checks

| | Check |
|---|---|
| Hub tests | New cases in `history-hub.test.mjs`: for each record layer, a down counts envelope with a last good records file gives `state: 'down'`, the note and no records. A genuine run mismatch still gives `withheld`. Forest and the buoy fallback (`last_attempt`) are unchanged. Break: restore `&& !cells.cells`, the new cases must fail. |
| Through the page | `fire-status-ui` (legacy and `lines/1`), `quakes-ships-status-ui`, `place-ui`, `osmc-reliability-ui` pass against the changed worker; an added case shows Ships down as "unknown — …" in the place row. |
| Whole worker | Every existing hub suite passes (`firms-v2`, `health-hub`, `history-hub`, `drifters-hub`, `plastic-hub`, `dustrgb-hub`, `oceanheat-hub`, `orbital-hub`, `arts-hub`, `osmc-reliability-hub`, `satellites-hub`, `kp-degraded`, `place-rows`, `duration-contract`, `firms-guard`). |
| Deploy | Worker hash after deploy equals the built file's sha256; `/` reports 0.6.15; the eight UptimeRobot health URLs answer as before; one `/place` request for a known cell returns 200. |

## 4. Release steps (each on Chad's own Approve line)

1. Hub 0.6.15 deploy (Cloudflare editor; **Chad at the screen** for the pane and the final deploy click).
2. Merge the branch to main (source only; no page file changes).

Rollback: redeploy 0.6.14 (`bbf8dc61…0480`).

## 5. Decisions

- **H-D1.** Do it now, or leave it: the only visible effect today is the place row for a down Earthquakes, Ships, Buoys or Microplastic layer. Ships has been down 8 times since 8 Nov.
- **H-D2.** Alternative with no deploy: extend the page rule from fires to all record layers (page only). The hub would still answer "withheld" to anything else that reads `/place`.

## 6. Out of scope

Any other hub behaviour, Sun picture cleanup, schedules, storage.
