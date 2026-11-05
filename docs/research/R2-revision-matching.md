# R2 fireballs — recognising a corrected event (proposal, research only)

5 Nov 2026 · Claude · **research only: no matching code, collector, schedule, storage or deployment.** Evidence and scripts: `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/` (README there gives URLs, retrieval times, sha256). Results below are **Claude's, not yet independently reproduced**, except where marked.

**The question:** on a later fetch, how does Mother Earth tell a new event, a corrected event, an unchanged re-fetch and a record that is no longer listed — without silently creating a duplicate or merging two different events?

## 1. What the sources give us to identify an event

| Candidate identity evidence | Where | Verdict |
|---|---|---|
| Stable event ID | Fireball API v1.2, CNEOS Introduction, Lightcurves, Operational Notes pages | **None documented.** No ID, revision number, first-published time or last-changed time in any response or page read. |
| Peak-brightness time | catalogue `date`; index `peak_date` | **The only join key, and it is itself revised** (§2.2). A current join, not a permanent identifier. |
| Lightcurve file name `YYYY.DOY.hhmmss` | index `filename`, `filename_txt` | **Not stable.** The naming scheme changed (2024: `bolide.YYYY.DOY.hhmmss.pdf`; now no prefix), and the time inside it has moved in both directions relative to the catalogue (§2.3). Evidence of *a* report time, not an ID. |
| Report header | `.txt` header (one read) | Time to the whole second plus location to 0.1°. Gives a second, independent-looking timestamp — but it has the same precision problem and only one header has been read. |
| Location, energy, altitude, velocity | catalogue | Supporting evidence only. All of them are revised too (§2.2), and 186 of 1,074 events have no location at all. |
| `impact-e` | catalogue | **Not independent of `energy`:** CNEOS's Introduction gives it as an empirical function of radiated energy. A change in one implies the other; never count them as two pieces of evidence. |

## 2. Evidence of real corrections

### 2.1 Source of the evidence, and its limits
The Internet Archive holds **one** copy of CNEOS's lightcurve index (`lc_files.json`), captured 12 Jun 2024 (original Last-Modified 1 Apr 2024). Its columns come from the catalogue, so it is a partial record of what the catalogue said at that time. Compared with today's index (`revision_check.py`).

Limits, kept explicit:
- It covers only events that had a lightcurve report: **853 events**, newest 21 Aug 2022. Today's catalogue has 939 events up to that date — revisions to the other ~86 are invisible here.
- One before/after pair; intermediate revisions, and revisions to events after Aug 2022, are not seen.
- No archived **API** response was checked (the Archive's capture index returned 503 on 5 Nov — retry before concluding none exist).
- **Pairing a 2024 row with a 2026 row at a different time is my inference** (nearest time, mutual, one-to-one), not something the source states.

### 2.2 What changed between the 2024 copy and today

| Outcome for the 853 rows of 2024 | Rows |
|---|---:|
| Same peak time, every column identical | **503** |
| Same peak time, one or more columns changed | **217** — impact energy 206; location 8 (incl. lat/lon/hemisphere); location + energy 3 |
| Peak time changed (paired by nearest time) | **133** — by 1 s (114), 2 s (9), 3 s (5), 4 s (2), 6, 7, 9 s (one each). Of these, 67 also changed impact energy, 2 changed location |
| No candidate within 1 h | **0** |
| The 2024 time still present in today's catalogue | **0** of the 133 — CNEOS replaced, it did not duplicate |
| Today's index rows (≤ 21 Aug 2022) with no 2024 counterpart | **64** — reports released later, for events from 1996–2022 |

Largest corrections observed: a longitude hemisphere flip (≈ 1,128 km), a latitude change of 5.1° (≈ 567 km), impact energy changes of up to ×4.5 (0.15 → 0.68 kt) and ÷3.4 (0.48 → 0.14 kt).

### 2.3 Report names lead (and sometimes trail) the catalogue
In the 2024 copy, **132** file names already carried a different time from the row's own `peak_date`. For **127 of the 133** events whose catalogue time later changed, the 2024 file name already held the time the catalogue uses today — the reports were ahead of the catalogue, as CNEOS warns. But it runs both ways: 2010-04-17's file was named `…022159` in 2024 while the catalogue said 02:21:58 then and now; today the file is renamed `…022158`. So neither the file name nor the catalogue time is the authority; both are evidence.

## 3. Worked examples (all real except where marked)

| # | Case | 2024 copy | Today | What a matcher should conclude |
|---|---|---|---|---|
| A | **Time correction, large** — 15 Feb 2013 (54.8° N 61.1° E) | 03:20:33 · 440 kt · file `bolide.2013.046.032026` | 03:20:26 · 441 kt · file `2013.046.032026` | Same event, time corrected by −7 s. Supported by: identical location and altitude, the 2024 file name already carrying 03:20:26, mutual-nearest pairing, old time gone. **Correction, high support.** |
| B | **Three times for one event** — 25 Jul 2018 (76.9° N 69.0° W) | index 21:55:26 · file 21:55:24 · 2.1 kt | 21:55:23 · file 21:55:23 · 1.4 kt (impact energy revised) | Same event; the source gave three different times across two years. Pair by mutual nearest time + identical location. **Correction, high support** — but proves a 1 s window is too narrow. |
| C | **Location correction at the same time** — 28 Nov 2014 11:47:18 | 45.8° S **172.7° W** | 46.1° S **172.7° E** | Same event (time, altitude 26.1 km, energy 1.7 kt unchanged), moved ≈ 1,128 km across the date line. A location-based matcher would have called it a different event. **Correction — flag for review** (large move). |
| D | **Large latitude change** — 8 Apr 2015 04:06:31 | 25.5° S 51.5° E · 0.49 kt | 20.4° S 51.5° E · 0.57 kt | Same time, ≈ 567 km move, energy revised. **Correction — review.** |
| E | **Energy-only correction** — 22 May 1997 08:30:15 (no location) | 0.15 kt | 0.68 kt | Same time, no other evidence. **Correction by time alone** — low support; record it, never as a new event. |
| F | **No-location time shift** — 6 Aug 1995 | 04:38:09 · 0.18 kt · file `…043808` | 04:38:08 · 0.18 kt | Only time + energy to go on (5 such cases). Pairing rests on the 1 s gap, unchanged energy and the 2024 file name. **Probable correction — review.** |
| G | **Two real events 8 min apart, no locations** — 23 Mar 2011 04:16:32 and 04:24:46 | both present | both present, energies 2.85 and 3.49 (×10¹⁰ J) | The closest pair of distinct events in the catalogue (494 s). **Must never be merged** for being close. Shows the safe ceiling of any time window. |
| H | **Nearby distinct event** — 19 Apr 2018 13:39:38 → 13:39:39; another event at 14:02:27, 8,202 km away | — | — | The only shift with a second candidate within 1 h. Mutual-nearest picks 13:39:39; the other is 23 min and a hemisphere away. **Correction; the second candidate is ruled out by distance, not time alone.** |
| I | **Hypothetical — not observed:** an event present in one fetch and absent in the next with no nearby replacement | — | — | Record **"not in latest response"**, keep the record, re-check on later fetches. **Never delete; never assume it was withdrawn** — it may be a fetch fault, a filter, or a real retraction, and the source does not say which. |
| J | **Hypothetical — not observed:** one old event replaced by two new ones within seconds (split), or two old by one (merge) | — | — | **Always review.** No automatic merge or split. Not seen in the 2024→2026 data (0 many-to-one targets). |

## 4. Proposed classification on each new fetch (for discussion — no code)
Compare the new response with the **last retained response** (not with whatever is shown on the page).

1. **Unchanged re-fetch** — identical response hash. Record the retrieval time only.
2. **Unchanged event** — same peak time, every field identical.
3. **Corrected in place** — same peak time, some fields differ. Keep the earlier values as a prior version; never overwrite silently. **Review** if location moves more than a stated distance (C, D) or the hemisphere flips.
4. **Probable time correction** — an old time vanished **and** a new time appeared, **mutual nearest**, **one-to-one**, within a short window, with no conflicting location. Observed shifts were ≤ 9 s; distinct events have never been closer than 494 s. A window of the order of tens of seconds would cover every observed correction with a wide margin — **a proposal derived from one comparison, not a validated threshold.** Supporting evidence, recorded with the pairing: same location (where both have one), same altitude, report file name carrying the new time. **Review** when: no location on either side (F), more than one candidate (H), energy changes by more than a stated factor, or location also moved.
5. **New to the catalogue** — a time with no vanished partner. Not necessarily a new occurrence: CNEOS adds historical events (64 back-filled reports in this comparison). Label it by peak time, not as "just happened".
6. **Not in latest response** — an old time with no partner. Keep, flag, re-check (I). Never deleted on absence.
7. **Anything many-to-one, one-to-many, or chained** (B's three times across fetches) — **review**, never automatic.

Mother Earth would then need **its own internal identifier** per event (ours, labelled as ours), carrying the chain of source peak times it has been seen under, each with retrieval time and how the link was made (exact, probable correction, reviewed). That is a design note, not an approval to build.

## 5. Inherently ambiguous — needs a person
- Time shifts with **no location** on either side (5 in this comparison; 186 catalogue events have no location).
- Large **location** corrections at the same time (C, D) — the match is by time; distance alone would split them.
- Two candidates within the window, or a split/merge (H, J).
- Report vs catalogue **conflicts** (B; 2010-04-17): which value to show is not decidable from the data — show the catalogue's, record the conflict.
- **Absence**: no way, from the data alone, to tell a withdrawn event from a transient omission.
- Why times shift by exactly 1 s so often (114 of 133) — reprocessing or rounding are plausible; **unverified.**

## 6. What this does not establish
- **No permanent identifier exists in the data.** Exact timestamp matches in today's files establish a current join only.
- The pairings in §2.2 are inferred, mutual-nearest, and have not been confirmed by the source.
- Behaviour of catalogue-only events (no lightcurve) and of events after Aug 2022 is unobserved.
- Only CNEOS could confirm how corrections are made; **no contact without Chad's go.**
