# Moon item 6 follow-up (LEND) — readout-rounding fix: candidate for GPT review

28 Nov 2026 · Claude · **branch `moon-lend-rounding` only: not merged, not deployed; no hub, data, colour or withholding change.**

**Chad's go (28 Nov 2026, his message, relaying GPT):** "Go: prepare a narrow LEND readout-rounding fix on a new branch. Round stored integer hundredths half away from zero before formatting, for both percentages and error estimates. Test positive/negative ties, zero and neighbouring values, and compare all displayed cells. Keep data, colours and withholding unchanged. Return the exact candidate for GPT review; no merge or deployment."

**Background:** the LEND release record (`reviews/2026-11-28-moon-lend-release.md`, observation) found that `(v / 100).toFixed(1)` rounded stored hundredths ties down. In 530 shown cells the estimate read 0.1 low, and in 456 cells the percentage read 0.1 nearer zero. GPT independently confirmed both counts.

## 0. The candidate

| | |
|---|---|
| **Candidate commit (frozen, validated)** | **`f0c76251964ec2b01f73f1016cfae723a1874839`** (`f0c7625`; the records commit after it adds this packet only) |
| Payload (`RD_MAIN`) | `065b8b5`: `moonsci.js`, `moon.html` (key), `moon-lend-ui.test.cjs`, `served_manifest.mjs`, new manifest |
| Base (`RD_PARENT`) | main `542b689` (the LEND release records) |
| Animals pins | `f0c7625`: parent `065b8b5`, this suite only |
| Served manifest | `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json`: 55 files, sha256 `943d243b…20b1`. These are the same 55 paths as the LEND manifest, which is kept as its record. Only `moon.html` and `moonsci.js` differ; nothing is added or removed. |

| Served file at `f0c7625` | Bytes | sha256 |
|---|---|---|
| `moon.html` | 27,526 | `dec99b9f…9908` (one line: `moonsci.js?v=202612272000` → `202612280400`) |
| `moonsci.js` | 40,270 | `33999c4f…0c38` |

**Unchanged and checked:**
- **Data file:** `assets/moon/lend/lend-alds-2011-2016-R1.bin`, still `9f185cc3…`; `build_lend.py --check` gives CHECK OK.
- **Other files:** `moonsci.css`, `sources.html` and `REGISTER.md` are untouched (Animals 13ae).
- **Colours and states:** the colour ramp, drawing, withholding and states are unchanged. The `moonsci.js` diff touches only the two formatters, a comment and the test-aid object (§1).

## 1. The change (`moonsci.js`, 7 lines; diff in the Mac folder)

```js
const tenths = v => (Math.floor((Math.abs(v) + 5) / 10));   // |v| in tenths, half away from zero
const one = t => Math.floor(t / 10) + '.' + (t % 10);       // tenths -> "a.b"
const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + one(tenths(v)) + '%';
const pp = v => one(tenths(v)) + ' pp';
```

- **Integer arithmetic throughout.** The stored values are integers; there is no floating-point division and no `toFixed`.
- **The sign is kept as released:** it is the stored value's sign. So ±0.04% reads "+0.0%" or "−0.0%", exactly as before, and a stored 0 reads "0.0%". This is a deliberate no-change, raised for GPT's view in §4.
- **Test aid:** `window.MoonLend.fmt = { pct, pp }`.
- **Cache key:** `moonsci.js?v=202612280400`.

## 2. Tests (`moon-lend-ui` section R, six new checks)

- **R tie table, percentages:** 0, ±4, ±5, ±6, ±14, ±15, 16, 34, ±35, 36, ±84, ±85, ±95, 249, −245, 1005 (hundredths) give the expected literal strings. For example 5 → "+0.1%", −15 → "−0.2%", 35 → "+0.4%", −85 → "−0.9%", 95 → "+1.0%".
- **R tie table, estimates:** 0, 4, 5, 14, 15, 34, 35, 36, 44, 45, 50, 95, 105. For example 35 → "0.4 pp", 45 → "0.5 pp", 95 → "1.0 pp".
- **R oracle check:** the test's own oracle (quotient and remainder, written differently from the page) agrees with every literal.
- **R all displayed cells:** the page's readout text for all **11,656** shown cells, parsed, equals the oracle applied to each stored value read from the served file. Mismatches: 0.
- **R scope:** the released text differed in exactly **530** estimates and **456** percentages, each by exactly 0.1. This matches the release observation and GPT's counts.
- **R other states:** missing, withheld and outside readouts still carry no percentage or estimate.
- **Independent cross-check (outside the suite, `decimal_crosscheck.txt`):** Python `Decimal` with `ROUND_HALF_UP` against the formatter copied from `moonsci.js`, for all 11,656 shown cells: 0 mismatches.
- **New breaks:**
  - `tofixed` puts the released formatter back: 3 R checks fail (positive/negative ties, estimate ties, all cells).
  - `nohalfaway` rounds ties down (+4 in place of +5): the same 3 fail.

## 3. Animals narrow pin maintenance (`f0c7625`, this suite only, parent `065b8b5`)

- **New constants:** `RD_MAIN` `065b8b5`, `RD_PARENT` `542b689`, `RD_FILES` (the 5 literal paths), and `RD_KEY` (the `moonsci.js` key, with the old key put back when set aside).
- **13e moon.html (LEND rounding):** the served `moon.html` must equal `RD_MAIN`'s, with the new key once and the old key absent. With the old key put back, the existing LEND check must hold exactly (`= LE_MAIN`'s file), and the chain behind it is unchanged.
- **13ae:** `RD_PARENT..RD_MAIN` changes exactly `RD_FILES`, and not `sources.html`, `moonsci.css`, the LEND data file, REGISTER or the hub. **13af:** the pin commit is the first to touch the suite after `RD_MAIN`, its parent is `RD_MAIN`, and it changes only this suite.
- **Tamper breaks:** new `rd-moon-key-old` (the LEND release's key put back). `le-moon-key-old` now edits LEND's own `moonsci.css` key, because its `moonsci.js` key is no longer served; it is still expected at 13e moon.html (LEND).
- **Disclosed:** my first pin draft typed `RD_PARENT`'s full hash from memory and got it wrong. 13ae then failed closed ("NOT RUN … cannot be read from Git") instead of passing. I corrected it to `542b68969010354fbfd71bc1bc6e3456c161cd7a` from `git rev-parse` before the commit.

## 4. For GPT's view (not changed)

**The sign at zero tenths.** A stored value between −0.04% and +0.04% (not 0) reads "−0.0%" or "+0.0%", carrying the stored sign, as released. Alternatives would be to drop the sign whenever the rounded tenths are 0, or to keep it as now. I kept the released behaviour so this fix changes only the rounding. Tell me if you want it changed.

## 5. Final validation (frozen worktree `f0c7625`, served by `python3 -m http.server 8899` from that tree; the RC runner with exit codes captured)

Run 02:15:36–04:04:51 UTC (04:15–06:05 SAST), in three parts because **the cloud environment restarted twice**. The first restart cut the `le-moon-key-old` tamper run; it was rerun whole and its partial log is kept as `animals-brk-le-moon-key-old.interrupted.log`. The second came after `timeline-ui` had completed (594/0). The remaining suites ran from `chunk.sh`, which uses the same `step()`. Resume points are marked in `summary.txt`. Every result below comes from a completed run.

| Check | Result |
|---|---|
| `build_lend.py --check` | CHECK OK (144,160 B, `9f185cc3…`; 11,656 / 987 / 317 / 1,440): data unchanged |
| `test_build_lend.py` / `break_build_lend.py` | 436/0; 9 of 9 mutants caught |
| `served_manifest.mjs --check` | 55 files match this tree |
| **`moon-lend-ui`** | **89/0** (83 + six R checks) |
| LEND breaks | **19 of 19 caught**, each `exit=1` with its pattern applied: the 17 from the release plus **`tofixed` 3** and **`nohalfaway` 3** |
| **`animals-tab-ui`** | **311/0** (308 + 13e moon.html (LEND rounding), 13ae, 13af) |
| Animals tamper breaks | `rd-moon-key-old` at 13e moon.html (LEND rounding); `le-moon-key-old` and `le-moon-legend-edited` at 13e moon.html (LEND); `le-sources-edited` at 13e sources.html (LEND); `cr-moon-panel-edited` at 13e moon.html (CRaTER); `moon-page-edited` at 13e moon.html: all caught |
| Moon, Sky, craft, Sun | moon-globe 67, moon-lit 138, moon-lro-path 68, moon-light 27, moon-height-ui 110, moon-diviner-ui 178, moon-lroc-ui 78, moon-crater-ui 51, skycraft-ui 77, sky-moon-texture-ui 197, sun-globe 103: all 0 failed |
| Shared-page suites | timeline-ui 594, tides-nav 2,882, timeline-changes-build 49, backdrop-layer 27, dustrgb-ui 67, nature-context-ui 78, quakes-ships-status-ui 124, ships-retain-ui 42, soil-ui 47, fire-status-ui 279, freshness-wording-ui 156, optional-layers-status-ui 230, night-lights-ui 152: all 0 failed |

**Exceptions, run on the candidate and on main `542b689` (04:05–04:09 UTC, same port, exit codes captured):**

| Suite | Candidate | Main `542b689` | |
|---|---|---|---|
| timeline-mixed-assets | 16 pass, 2 fail (exit 1) | same (exit 1) | assertion lines identical |
| kept-ui | 18/3 | 18/3 | identical |
| ux-round1 | 33/1 | 33/1 | identical |
| osmc-reliability-ui | crashes at `git show 0386058` | same | identical; an incomplete test (missing fixture history), not a pass |
| smoke-fixes | fire-record failures and wait timeout | same | identical apart from worktree paths; an open baseline exception |
| tides-ui | 59/1, T1a branch scope | 60/0 (exit 0) | by design |

## 6. Not verified

Real phone, Safari, a screen reader and a verified hardware renderer, as before. The formatter is pure string arithmetic, checked in headless Chrome and Node.

## 7. Evidence (Mac `~/Documents/Mother Earth/_review/moon-lend-rounding/`, with SHA256SUMS)

- `run.sh`, `resume.sh` and `chunk.sh`, `summary.txt`, every log (including the interrupted one), the main-comparison logs (`base/`) and `decimal_crosscheck.txt`.
- `moonsci.js` and `moon.html` at `f0c7625`, the diff from `542b689`, and the manifest.

## 8. For GPT

- Candidate **`f0c7625`**; payload `065b8b5`; manifest `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json` (55 files, `943d243b…`).
- After a PASS, release needs Chad's own Approve line naming `f0c7625`. The live check must take its expected list from that manifest file.
