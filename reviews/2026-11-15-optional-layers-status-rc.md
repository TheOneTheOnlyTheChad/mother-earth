# optional-layers-status-rc — candidate for GPT review (round 2)

15 Nov 2026 · branch `optional-layers-status-rc` from main `f655613` · **page only** · no merge · hub untouched (0.6.14)
Built on Chad's Go line. Spec: `docs/concepts/OPTIONAL-LAYERS-WITHHELD-LINE-PROPOSAL.md` rev 2, §5 governing.

## 1. What changed

| File | Change |
|---|---|
| `index.html` | `cardCount` now covers all five record layers. `showCount(k, v)` sets the card's number and `cardCount[k]` together, so the withheld line is gated on what the card renders. Buoys down: "no buoy data from the latest run". Microplastic down: "no microplastic data from the latest run". The mismatch sentence takes its run times from `ME.runTimes`. Cache key `app.js?v=202612021100`. |
| `app.js` | New `ME.runTimes(recordsIso, countsIso)`. |
| `sources.html` | Cache key only. |
| `phase1/optional-layers-status-ui.test.cjs` | New suite, 219 checks, 8 breaks. |
| `phase1/osmc-reliability-ui.test.cjs` | Three expectations moved to the new rule (§4). |

`style.css` unchanged. sha256: `index.html` `ec13b4f7…dc4e`, `app.js` `b89d9114…2c24`, `sources.html` `91f50b06…4b82`, `style.css` `ae472be2…b465`.

## 2. Rules as built

- **P1.** The "Records withheld … counts shown alone" line shows only when the card shows a number. For buoys the number is withheld for three reasons: freshness unknown, a down run, or a kept run (`last_attempt`) whose records are unusable. The gate reads the rendered value, so all three hide the line.
- **P2.** Down run: the description says there is no data from the latest run. No snapshot at all: "no snapshot from the hub", unchanged.
- **P3.** `ME.runTimes`: same UTC day → "records 10:50 UTC, counts 10:55 UTC" (unchanged). Different UTC days → "records 10 Nov 10:50 UTC, counts 14 Nov 10:50 UTC". Different years → "records 31 Dec 2026 23:50 UTC, counts 1 Jan 2027 00:10 UTC". Unreadable run time → "unknown", and the other time then carries its full date. All five record layers use it.

## 3. Two things that differ from the letter of rev 2 — for GPT's decision

1. **Capital and full stop.** Rev 2 quotes "No buoy data from the latest run." The card's description lines are lower-case with no full stop ("no snapshot from the hub", ships' "no sample from the latest run", "buoy positions not shown"). Built to match those: `no buoy data from the latest run`, `no microplastic data from the latest run`. One-line change if the sentence form is wanted.
2. **Stricter than `ME.stamp`.** `Date.parse('2026-02-31T10:50:00Z')` is accepted by the browser and silently becomes 3 March. `ME.runTimes` also requires the time to read back as the same UTC day, so 31 February reads "unknown". Found by the suite's first run. `ME.stamp` itself is unchanged (it prints the raw text, so it never shows 3 March); tightening it is out of this branch's scope.

## 4. Existing expectations that changed

`osmc-reliability-ui` 3a, 3b and 8 asserted that the withheld line is shown beside a buoy card that shows a dash (records unreadable or mismatched after a failed update; old-hub down envelope). That is the state this branch removes, and 3b is GPT's named case. They now assert: dash, line hidden and empty, records still withheld (`usable === false`, nothing drawn); case 8 also asserts the new down description.

## 5. Tests

`optional-layers-status-ui`: **219 passed, 0 failed.** Real page; fixtures shaped as the hub publishes them.

| Group | Cases |
|---|---|
| `ME.runTimes` directly | 12 input pairs incl. month end, year end, midnight, `null`, `{}`, a number, `''`, 31 February |
| Buoys | down · stale mismatched · mismatch with count · **kept run, counts inside limit, records from another run** (freshness asserted not unknown) · kept run paired (degraded) · no snapshot · valid zero mismatched · three days apart · matched |
| Microplastic | down · stale mismatched · mismatch with count · no snapshot · one day apart at the same clock time · matched |
| All five layers | earthquakes, fires, ships three days apart with the count and line both visible · earthquakes across a year · unreadable record time (earthquakes, buoys) · same day |
| Other | switch-off clears the line · cache key equal on both pages and newer than `202612021000` |

Breaks, each fails:

| Break | Failed |
|---|---|
| `no-gate` (main's gate) | 14 |
| `freshness-gate` (gate on freshness, not the rendered count) | 2, the kept-run case |
| `old-wording` | 2 |
| `no-dates` | 27 |
| `no-year` | 13 |
| `no-validate` | 17 |
| `lenient-day` | 2 |
| `stale-key` | 1 |

Regression (same kit as the last four releases): `freshness-wording-ui` 156, `quakes-ships-status-ui` 124, `fire-status-ui` 279, `legend-active-ui` 548, `fires-wording-ui` 35, `mobile-pass` 131, `drifters-ui` 25, `plastic-ui` 29, `place-ui` 30, `search-ui` 104, `kept-ui` 21, `buoy-temp-ui` 33, `desktop-overflow` 258, `cell-perf-ui` 43, `ux-round1` 34, `status-notes-ui` 17, `terminator-ui` 19, `dustrgb-ui` 67, `backdrop-layer` 27, `orbital-browser` 113, `arts-ui` 90, `sky-ui` 79: all pass. `osmc-reliability-ui` 40 of 41 after §4. Two failures identical on main: `osmc-reliability-ui` "old page: no page errors", `smoke-fixes` "Sources 360: no page-level horizontal overflow".

## 6. Not done, not claimed

- Not seen on production: none of these states is live right now. Not tested on a phone, Safari, a screen reader or a real GPU.
- The Find note at `index.html` "found in the HH:MM run; the page now shows the HH:MM run" still prints times only. It was not in the proposal; named here.
- `ME.hhmm` and `ME.when` still throw on non-string input (carried from the freshness packet).

## 7. Release steps (on Chad's own Approve line)

Merge to main → verify served hashes of `index.html`, `app.js`, `sources.html` → live text smoke with buoys and microplastic switched on. Rollback: revert the merge.

## 8. Round 2 (GPT's review of `1a659db`, relayed by Chad)

GPT: card changes pass; both §3 decisions accepted; the three changed buoy expectations match. **Hold for one fix:** `ME.runTimes` invented a time for two incomplete inputs. `2026-11-15` displayed as 00:00 UTC, and `2026-11-15T10:50:00` displayed as 08:50 UTC on a Johannesburg clock.

**Fix, scoped to `ME.runTimes` (`app.js` only).** A run time is formatted only if it states its own date, time and zone: `ME.RUN_TIME` = `YYYY-MM-DDTHH:MM[:SS[.fff]]` followed by `Z` or `±HH:MM`, hours 00–23, on a real calendar day (`ME.validDate`). Anything else reads "unknown". A time with an offset is shown converted to UTC. The round 1 read-back test is replaced by the calendar check, so 31 February still reads "unknown".

No other file changed. The cache key stays `202612021100`; it has never been released.

**Suite: 230 passed, 0 failed** (was 219). Every page in the suite now runs on a Johannesburg clock (`timezoneId`), and one check asserts that. Added:

| Records time | Result |
|---|---|
| `2026-11-15` | unknown |
| `2026-11-15T10:50:00` (no zone) | unknown |
| `2026-11-15T10:50` as the counts time | unknown |
| `2026-11-15 10:50:00Z` (space) | unknown |
| `2026-11-15T24:00:00Z` | unknown |
| `2026-02-31T10:50:00+02:00` | unknown |
| `2026-11-15T10:50Z` | 10:50 UTC |
| `2026-11-15T10:50:00+02:00` | 08:50 UTC |
| `2026-11-16T01:30:00+02:00` | 23:30 UTC, same UTC day as the counts, so no date |
| `2026-11-15T23:30:00-02:00` | 16 Nov 01:30 UTC, with dates on both |

Breaks, each fails: new `no-zone` (round 1's rule) 6 · `no-validate` 23 · `lenient-day` 3 · `no-gate` 14 · `freshness-gate` 2 · `old-wording` 2 · `no-dates` 34 · `no-year` 19 · `stale-key` 1.

Regression after the fix (the suites that load `app.js` on the World View): `freshness-wording-ui` 156, `quakes-ships-status-ui` 124, `fire-status-ui` 279, `legend-active-ui` 548, `drifters-ui` 25, `plastic-ui` 29, `buoy-temp-ui` 33, `mobile-pass` 131, `status-notes-ui` 17, `search-ui` 104, `place-ui` 30 pass; `osmc-reliability-ui` 40 of 41 (the one failure is identical on main). The other suites in §5 were not rerun for this one-function change.

sha256: `index.html` `ec13b4f7…dc4e` (unchanged), `app.js` `12ad3fed…b3d4`, `sources.html` `91f50b06…4b82` (unchanged).

Not claimed: the 230 checks are browser checks in Chrome; nothing was seen on production.
