# Earthquakes and Ships: the withheld line and a false zero — proposal for GPT review (rev 2)

15 Nov 2026 · docs only · nothing built · page only · main `42a56d1` (page merge `d13466a`, hub 0.6.14)
Third item from `docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md`. In the fire-status packet this was "read, not reproduced". It is now reproduced, and one new fault turned up.

## 1. What main does (reproduced 15 Nov 07:57 UTC, real page, fixture hub)

| State | Card | "Records withheld" line |
|---|---|---|
| Earthquakes down, last good records | unknown · "–" · "collector reported down: …" | **"…different collector run… — counts shown alone"** |
| Earthquakes stale, mismatched records | unknown · "–" · "last snapshot is over 15 min old" | **same line** |
| Earthquakes mismatch, valid count | current · "1" | line shown (correct) |
| **Ships down, last good records** | unknown · **"Last sample: 0"** | **same line** |
| Ships stale, mismatched records | unknown · "Last sample: 2" | **same line** |
| Ships stale, matched records | unknown · "Last sample: 2" | hidden (correct) |
| Ships mismatch, valid count | current · "2" | line shown (correct) |

- **Q1.** Earthquakes: "counts shown alone" beside a dash, as fires did before `83d0fc0`.
- **S1 (new). Ships down shows "Last sample: 0".** A down run publishes `cells: {}`, and the card totals that envelope as the last sample. The last sample was not zero; the down run holds no sample. D1 shows **8 down ships runs since 8 Nov** ("ingested down: Error: websocket error…"; last 13 Nov 17:15 UTC), each through `writeDown`, so this has been on the live card.
- **S2.** Ships stale with mismatched records: "counts shown alone" beside "Last sample: 2", which is not a current count.
- Earthquakes had no down run in that week (2,114 ok).

## 2. Proposed rules

- **W1. Earthquakes:** the line shows only while the card shows a count, gated on the value the card rendered (the fires rule, `cardCount`).
- **W2. Ships:** the line shows only while the card shows a **current** count. "Last sample: N" under an unknown badge is not one, so the card's own reason stands alone.
- **W3. Ships down:** a down envelope carries no sample, so the card shows "–" with no "Last sample" label. The stale case keeps "Last sample: N" because that envelope is the last sample.
- A hidden line is emptied, as for fires.

Files: `index.html` (W1, W2) and `app.js` (W3, in `ME.readings`), so the `app.js` cache key is bumped on `index.html` and `sources.html`. The summary report already says "ships: unknown — …; last sample N vessels…" from the same value, so W3 also removes "last sample 0 vessels" there.

## 3. Acceptance checks

| Rule | Check |
|---|---|
| W1 | Earthquakes down and stale-mismatch: line hidden and empty; "counts shown alone" nowhere on the visible page. Mismatch with a valid count: line shown beside a number. Break: remove the gate, the down case must fail. |
| W2 | Ships stale-mismatch: "Last sample: 2", line hidden. Ships mismatch with a current count: line shown. Break as W1. |
| W3 | Ships down with a last good records file: count "–", no "Last sample" label, no "0"; the report has no "last sample 0". Ships stale matched: still "Last sample: 2". Break: restore the old total, the down case must fail. |
| Transition | One session: ships current → down → current; the count, label and line follow each refresh. |
| Regression | `fire-status-ui`, `legend-active-ui`, `mobile-pass`, `search-ui`, `place-ui`, `status-notes-ui` still pass; cache key identical on both pages. |

## 4. Decisions

- **W-D1.** Ships down: "–" (recommended), or keep showing the previous good sample's count as "Last sample"? The page does not hold that count once the down envelope replaces it, so keeping it would need a stored value.
- **W-D2.** Apply the same line gate to drifting buoys and microplastic now, or leave optional layers for later (recommended: later; not reproduced).

## 5. Out of scope

The hub's place-view fix, freshness badges, layout, the place row for earthquakes and ships, any hub change.

## 6. GPT review of rev 1 (relayed by Chad, 15 Nov 08:08 UTC) — rev 2

GPT: sound, with clarifications; build this first, then freshness wording as a separate page-only change. Where this section differs from §2–§4, this section governs.

- **W-D1.** Ships down shows "–". The down envelope carries no sample. **The sample description line is suppressed too**, since it reads fields the down envelope lacks. "Last sample: N" stays for a stale real sample, **including a genuine zero**.
- **W-D2.** Buoys and microplastic wait for a separate pass. The Earthquakes and Ships withheld line is gated on the displayed reading's `value !== null`. That keeps the explanation beside a valid zero and beside a displayed degraded count. A stale Ships fallback shows `lastSample`, not `value`, so it does not trigger the line.
- **Added acceptance check: a genuine zero-vessel sample.** It shows "0" while usable and "Last sample: 0" once stale. A down run shows "–" with no sample claim on the card or in the report.

**Status:** not built. Awaits Chad's own go line.
