# Animals journey context: build brief (stage C1, zebra first)

25 Nov 2026 03:48 UTC (clock reading) · rev 1 · Animals thread · for GPT, then Chad's go · **brief only: nothing is built**

Based on `ANIMALS-JOURNEY-CONTEXT-EVIDENCE.md` rev 1. The design follows the proposal as corrected by GPT's review and Chad's decisions of 25 Nov.

## 1. Stages

- **C1a, zebra.** Fires (MODIS SP) and tree-cover loss (Hansen v1.13) for cells `17_50` and `17_51` over the retained-fix interval, as one pinned context file and one block on the zebra card. Private preview on a branch, then GPT's candidate review, then Chad's lines.
- **C1b, East Walker.** The same for cell `32_15` and data years 2017–2024, only after C1a and Chad's go for the corridor budget (585 FIRMS requests, about 708 MB of tiles).

## 2. Files

| File | What | Committed? |
|---|---|---|
| `phase1/animals/journey_context_firms_fetch.py` | Download step: the pilot script grown to the full extraction under §4 of the evidence record (same key handling, ceiling and stop rules). Run by Chad in Terminal | yes (no key) |
| private Mac `research/animals-journey-context/…` | Raw FIRMS CSVs, Hansen tiles, the fetch manifest (sha256 of every response and tile) | **no** |
| `phase1/animals/build_journey_context.py` | **Offline** builder: reads the private cache by hash, writes the context file. `--check` rebuilds and compares; it makes **no provider call** and changes no pin | yes |
| `assets/animals/zebra-botswana-Z3866-context-R1.json` | Aggregates only: region (cells, bounds, area), interval, fire counts (total, per month with part-months named, coverage state, gap days, rows excluded by type, duplicates dropped, `version` values), loss (years, threshold, approximate area, land, water and no-data areas, method), source provenance (product, version or collection, request window, retrieval date, fetch-manifest sha256) | yes |
| Animals page script | Loads the context file only when the zebra card opens, verifies its sha256 against a pin, writes the block | yes |

## 3. The block (zebra)

> **Historical regional land context**
> **Recorded journey:** 25 October 2007 to 22 October 2008 (UTC).
> **Area used for this context:** two 4° grid cells, 20–28° E, 18–22° S, about 371,700 km². This is far larger than the area the zebra used.
> **Fire detections (NASA FIRMS, MODIS):** `n` detections from 25 Oct 2007 08:01 to 22 Oct 2008 23:00 UTC in that area. A detection marks a satellite pixel with an active fire; it is not a count of fires, and cloud hides some. [Coverage line: "No days with missing MODIS data are listed for this period" / the named gap days / "Incomplete: …"]
> **Mapped tree-cover loss (Hansen/UMD/Google/USGS/NASA, v1.13):** about `x` ha in the calendar years 2007 and 2008 (these years extend beyond the recorded journey), where tree cover in 2000 was at least 30 %. A relative indicator, not a measured total; years before 2011 use an older method.
> These are regional observations. They do not show where the zebra went, what it encountered or how it was affected.

## 4. Tests (new suite `animals-context-ui` and builder tests; existing suites unchanged)

GPT's cases, each with a deliberate break:
- endpoint minutes (a detection one minute before the first fix is excluded, one at the last fix's minute is included);
- part-month labels at both ends;
- calendar-year mismatch wording sits next to the loss value;
- a detection on a shared cell edge is counted once, and one outside the union not at all;
- a duplicated row across two responses counts once;
- an unknown gap list gives "coverage unknown", never "no gaps";
- a failed request gives "incomplete", never a total;
- a valid zero ("no detections in the record") differs from no data;
- no-data area is reported and never counts as zero loss;
- a changed source file, version or tile hash fails `--check`;
- a wrong context-file pin is refused by the page;
- the closing sentence and every period label are present.

Meaning and states are tested, not a blanket word ban: the required disclaimer itself contains "affected", which such a ban would reject.

Regression on fresh main with every pin as it is: `BASE_MAIN`, `TL_MAIN` (Timeline R4), `NC_MAIN`/`NC_PARENT`, hub alignment and all Animals guarantees. No pin moves to hide a failure. No hub change, schedule, account or provider message.

## 5. Order from here

1. Chad runs the FIRMS pilot (one command; evidence §4).
2. Claude adds the measured results to the evidence record (rev 1.1) and sets the zebra extraction's final budget.
3. GPT reviews the evidence and this brief.
4. Chad's go for C1a: the zebra extraction run by Chad, the tile download by Chad, then the build on a branch.
5. Candidate, GPT, Chad's lines. C1b only after that, on its own go.
