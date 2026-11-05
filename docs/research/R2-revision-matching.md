# R2 fireballs — recognising a corrected event (proposal, rev 2, research only)

5 Nov 2026 · Claude · rev 2 after GPT's review. **Research and documentation only: no matching code, collector, schedule, storage, page change, deployment or third-party contact.**

**Attribution.** The archived-index counts, historical pairings and worked examples below are **Claude's results; GPT has reviewed the reasoning but has not independently reproduced them.** The catalogue checks and the velocity arithmetic in R2 §C.1–C.2 are confirmed by both.

**Evidence and scripts:** `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/` — the README there gives every file's URL, retrieval time and sha256. Counts here come from `revision_check.py` (→ `revision-comparison-2024-vs-2026.csv`), `revision_followup.py` and `spacing_check.py`, run with Python 3 standard library from that folder.

**The question:** on a later fetch, how could Mother Earth tell a new event, a corrected event, an unchanged re-fetch and a record that is no longer listed — without silently creating a duplicate or merging two different events? **Plausible matches must stay distinguishable from accepted event identities.**

## 1. Identity evidence in the inspected sources

**No stable identifier was found in the inspected sources:** the Fireball API v1.2 documentation and responses; CNEOS's Introduction, Lightcurves and Operational Notes pages; the lightcurve index; one lightcurve `.txt` header.

| Candidate identity evidence | Where | Assessment |
|---|---|---|
| Stable event ID, revision number, first-published or last-changed time | — | None found in the sources above. |
| Peak-brightness time | catalogue `date`; index `peak_date` | The only available join key, and it is itself revised (§2.2). **An exact match establishes a current join, not identity** (§4.3). |
| Lightcurve file name `YYYY.DOY.hhmmss` | index `filename`, `filename_txt` | Not stable: the naming scheme changed (2024 `bolide.…pdf`; now no prefix), and the time inside it has moved ahead of and behind the catalogue's (§2.3). Evidence of a report time, not an identifier. |
| Report header | `.txt` (one read) | Time to the whole second, location to 0.1°. Only one header read; its relation to the catalogue is unverified. |
| Location, energy, altitude, velocity | catalogue | Supporting evidence only. All are revised (§2.2); 186 of 1,074 events have no location. |
| `impact-e` | catalogue | **Not independent of `energy`**: CNEOS's Introduction gives it as an empirical function of radiated energy. Never counted as a second piece of evidence. |

## 2. Evidence of changes — lightcurve index only

### 2.1 Scope (carried through every conclusion below)
The Internet Archive holds **one** capture of CNEOS's **lightcurve index** (`lc_files.json`, captured 12 Jun 2024, original Last-Modified 1 Apr 2024). Its columns are taken from the catalogue, so it shows what the catalogue said **for events that had a lightcurve report listed in the index** at that time. Compared with today's index.

- **Index only**: 853 events, newest 21 Aug 2022. Today's catalogue has 939 events up to that date; changes to events missing from the 2024 index are not observed. Nothing here describes the catalogue as a whole.
- One before/after pair: intermediate changes and anything after Aug 2022 are not observed.
- No archived **API** response was examined (the Archive's capture index returned 503 on 5 Nov; to retry).
- **Pairing a 2024 row with a 2026 row at a different time is an inference** (mutual nearest time, one-to-one) — supporting evidence, not proof (§4).

### 2.2 What differs between the 2024 index and today's index

| Outcome for the 853 rows of the 2024 index | Rows |
|---|---:|
| Same peak time, every compared column identical | **503** |
| Same peak time, one or more columns differ | **217** — impact energy 206; location 8; location + impact energy 3 |
| No row at the same time; a **candidate** at a nearby time (mutual nearest, one-to-one) | **133** — offsets 1 s (114), 2 s (9), 3 s (5), 4 s (2), 6, 7, 9 s (one each); 67 also differ in impact energy, 2 in location |
| No candidate within 1 h | **0** |
| The 2024 time present in today's catalogue, among the 133 | **0** — **consistent with replacement among these inferred pairs**; not a finding about how CNEOS handles records generally |
| Today's index rows (≤ 21 Aug 2022) with no 2024 counterpart | **64** — **newly listed lightcurve reports** for events from 1996–2022. Whether those events were also new to the *catalogue* is not observable from the index. |

Largest differences at the same time: a longitude hemisphere flip (≈ 1,128 km) and a 5.1° latitude change (≈ 567 km). Impact-energy differences up to ×4.5 (0.15 → 0.68 kt) and ÷3.4 (0.48 → 0.14 kt).

### 2.3 Report file names vs catalogue times (index only)
In the 2024 index, **132** file names carried a different time from that row's `peak_date`. For **127 of the 133** candidate pairs, the 2024 file name already held the time today's index uses — consistent with CNEOS's warning that reports can be ahead of the catalogue. The relation also runs the other way: 2010-04-17's file was `…022159` in 2024 while the index said 02:21:58 then and now; today's file is `…022158`. Neither the file name nor the catalogue time is treated as authoritative; both are evidence.

### 2.4 Event spacing (today's catalogue)
The closest two catalogue events are **494 s** apart (2011-03-23, both unlocated); 4 consecutive pairs fall within 1 h. **This does not establish a safe matching window**: future or unreported events could be closer, and these are only the events CNEOS lists.

## 3. Step one on every fetch — validate before classifying

A successful HTTP response is not enough. **A response judged invalid or potentially incomplete must not produce any addition, correction or absence conclusion**; the last valid response stays current.

| Check | Verified fault (response rejected) | Anomaly (held for review; no event conclusions until reviewed) |
|---|---|---|
| API version | `signature.version` ≠ the version the rules were written for (1.2) | — |
| Required fields | `date`, `energy`, `impact-e` missing from `fields`; the requested `vx/vy/vz` missing | an extra or unexpected field (e.g. `vel` disappearing or new fields appearing) |
| Row structure | a row whose length ≠ `fields` length; a non-string, non-null value; a malformed date | — |
| Reported vs received count | `count` ≠ number of rows | a total count that falls compared with the last valid response |
| Duplicate timestamps | — | two or more rows with the same `date` (none in any inspected file) |
| Query scope | parameters differ from the comparison basis (e.g. `vel-comp`, date or `limit` filters) | — |
| Range | — | the earliest or latest date moves unexpectedly; many old records absent at once |
| Transport | non-200; body not JSON; truncated body | — |

The 5 Nov response passes every check: version 1.2, 12 fields, 1,074 rows reported and received, every row 12 values, no duplicate timestamps.

## 4. Proposed classification (for discussion — no code)
Compared with the **last valid retained response**, never with what the page shows.

### 4.1 Response level
1. **Unchanged bytes** — identical response hash. Record the retrieval time only.
2. **Same parsed records, different representation** — hashes differ but the parsed records are identical after canonicalisation. **No event revision is inferred.** Real examples of representation-only variation: the API's field order differs from its documented sample; in today's lightcurve index the key order differs **between rows of the same file**.
3. **Records differ** → continue to 4.2.

**Comparison rules** (canonicalisation must not erase meaning): records keyed by `fields` names, not positions; row order ignored; **values compared as the source's strings** — `"6.30"` ≠ `"6.3"` is recorded as a precision change, never silently equalised; `null` ≠ `"0"` ≠ `"0.0"` treated with the same care; whitespace inside values not trimmed without recording it.

### 4.2 Record level
| Class | Condition | Outcome |
|---|---|---|
| **A. Unchanged at an existing timestamp** | same `date`, all values identical | current join confirmed; no new version |
| **B. Candidate correction at an existing timestamp** | same `date`, some values differ | **retain both versions**; record which fields changed. Exact time is a strong join, **not guaranteed identity**. Review if location moves more than a stated distance, the hemisphere flips, or energy changes beyond a stated factor |
| **C. Time-shift candidate** | an old time absent **and** a new time present, mutual nearest, one-to-one, within an experimental window | **review candidate**. Both source records kept separately; histories not combined until the relationship is accepted |
| **D. Newly listed** | a time with no prior record and no absent partner | dated by **occurrence** (peak time), never presented as just happening; "newly listed in the source response retrieved on [date]" |
| **E. Not present in the latest response** | an old time with no partner, in a valid response | record kept; shown as **"not present in the source response retrieved on [date]"**, never as still listed by CNEOS; absence alone does not establish withdrawal |
| **F. Structural ambiguity** | many-to-one, one-to-many, chained shifts, two candidates in the window | **review**; no automatic split or merge |

### 4.3 Identity is a decision, not a match
- Mother Earth would hold **its own internal event identifier** (ours, labelled as ours). Each source record keeps its own peak time, values and retrieval time.
- A link between two source records is a **recorded decision**: the evidence (time offset, location, altitude, report file name), who or what proposed it, who accepted it, when, and the remaining uncertainty. Until accepted, both records stay separate.
- **Duplicate timestamps within one response** (none observed): rows sharing a `date` are never collapsed and never joined by time alone; they are held for review and can only be told apart by their other values.
- **Window:** observed offsets were ≤ 9 s. Any proposed window is **experimental**, derived from this one index-only comparison, and only nominates review candidates; it never establishes identity.

### 4.4 Values shown (a presentation proposal, not a finding)
For a future display, catalogue values could remain the displayed values, with any conflicting report value retained separately and attributed ("lightcurve report, file …, retrieved …"). That is a presentation choice, not a finding that the catalogue is always scientifically preferable.

## 5. Worked examples (index only; real except where marked)

| # | Case | 2024 index | Today's index / catalogue | Classification under §4 |
|---|---|---|---|---|
| A | 15 Feb 2013, 54.8° N 61.1° E | 03:20:33 · 440 kt · file `bolide.2013.046.032026` | 03:20:26 · 441 kt · file `2013.046.032026` | **C — time-shift candidate**, strong supporting evidence (−7 s; identical location and altitude; 2024 file name already 03:20:26; mutual nearest; old time absent today). Held for review; not merged automatically. |
| B | 25 Jul 2018, 76.9° N 69.0° W | 21:55:26 · file 21:55:24 · 2.1 kt | 21:55:23 · file 21:55:23 · 1.4 kt | **C — review candidate**: three different times across the index and file names; identical location. Shows how one-second matching would fail. |
| C | 28 Nov 2014 11:47:18 | 45.8° S **172.7° W** | 46.1° S **172.7° E** | **B — candidate correction at an existing timestamp**, flagged: ≈ 1,128 km hemisphere flip, altitude and energy unchanged. A location-based matcher would have separated them. |
| D | 8 Apr 2015 04:06:31 | 25.5° S 51.5° E · 0.49 kt | 20.4° S 51.5° E · 0.57 kt | **B — flagged**: ≈ 567 km move plus an energy change. |
| E | 22 May 1997 08:30:15, no location | 0.15 kt | 0.68 kt | **B — candidate correction at an existing timestamp.** Only the time links them; the ×4.5 change is beyond any plausible review factor. Not a definite correction. |
| F | 6 Aug 1995, no location | 04:38:09 · 0.18 kt · file `…043808` | 04:38:08 · 0.18 kt | **C — review candidate** on time, unchanged energy and the 2024 file name alone (5 such unlocated cases). |
| G | 23 Mar 2011 04:16:32 and 04:24:46, both unlocated | both listed | both listed | Two catalogue events 494 s apart. **Never merged for being close.** Illustrates why the window cannot be a safety bound. |
| H | 19 Apr 2018 13:39:38 → 13:39:39; another event at 14:02:27, 8,202 km away | — | — | **C**; the second event is ruled out by location, not by time. Without locations this would be **F**. |
| I | 64 index rows with no 2024 counterpart (e.g. 1996-03-30, 2000-02-17) | absent | listed | **D for the index** — newly listed lightcurve reports, dated by occurrence. Whether they were new to the catalogue is unknown. |
| J | **Hypothetical — not observed:** a record absent from a later valid response, no candidate | — | — | **E**: kept, labelled "not present in the source response retrieved on [date]". |
| K | **Hypothetical — not observed:** a response reporting `count` 1,074 but delivering 1,050 rows | — | — | **Rejected at validation (§3)**: no absence conclusions for the 24 missing rows. |
| L | **Hypothetical — not observed:** two rows with the same `date` | — | — | Held for review (§4.3); never collapsed. |
| M | **Hypothetical — not observed:** one old record replaced by two within seconds | — | — | **F — review**; no automatic split or merge. |

## 6. Inherently ambiguous — needs review
- Time-shift candidates without location on either side (5 in this comparison; 186 catalogue events lack location).
- Large location changes at an existing timestamp (C, D).
- More than one candidate; splits, merges, chains (B, H, M).
- Report vs catalogue conflicts (B; 2010-04-17) — kept explicit and attributed.
- Absence: withdrawal and transient omission look the same in the data.
- Why so many offsets are exactly 1 s (114 of 133) — reprocessing or rounding are plausible; **unverified.**

## 7. What this does not establish
- No stable identifier was found **in the inspected sources**; it is not claimed that none exists.
- An exact timestamp match is a current join, not identity.
- The 133 pairings are inferred, unaccepted and not confirmed by the source.
- Everything in §2 and §5 is about the **lightcurve index**; catalogue-only events and events after Aug 2022 are unobserved.
- The 494 s minimum separation is not a safe window.
- Only CNEOS could confirm how corrections are made; **no contact without Chad's go.**
