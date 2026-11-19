# Animals — deep audit of one deployment: false killer whale, tag ptt 98364

19 Nov 2026 · rev 1.1 (after GPT's review of rev 1; changes listed in §9) · read-only. Nothing built, no provider contacted, nothing spent.

**Chad's line (19 Nov):** "Go: deep audit of one false killer whale deployment (ptt 98364), read-only".

**Result: the best-documented candidate so far. Whether the source's own quality flags can carry a display rule is not yet established:** that depends on reading ATN's quality-control documentation, showing it applies to how this file was processed, and recomputing gaps and speeds after the proposed filtering. Every row but one is an Argos location; no row is a modelled position. In this file the roll-up flag removes the worst rows; a PASS is not a guarantee of an accurate, continuous path. Error estimates exist for only 6% of rows. Its public treatment still needs a recorded sensitivity decision and a study-specific gap rule.

## 1. Which identity was read
- **The source netCDF**, `atn_98364_false-killer-whale_trajectory_20131023-20140223.nc`, from the ATN production staging folder named on IOOS's archiving page. 319,596 bytes; sha256 `9896550e…d3f6`; MD5 `8a029ef46a09b62ab30422e200717813`, **equal to the staging folder's own `md5.txt` entry** for this file.
- Not read: the OBIS extraction (373 occurrences, a subset) and the ERDDAP table for this deployment. NCEI accession `0303525` is named by OBIS as the full source; NCEI itself was not reached, so that this file is byte-identical to NCEI's copy is **not** verified.
- **How:** fetched in the browser pane on 19 Nov 2026 02:25 UTC, moved to Claude's cloud workspace as a working copy, decoded there with the netCDF library, and deleted at the end of the audit. It is not in the repository or on the Mac. Evidence: `fkw-98364-evidence-2026-11-19.json` (values and counts; no contact details).

## 2. Identity, dates, rights
| | |
|---|---|
| Title | "False killer whale (Pseudorca crassidens) location data from a satellite telemetry tag (ptt id 98364) deployed in the North Pacific Ocean from 2013-10-23 to 2014-02-23, deployment id 573c6646d76c5c52816a4b92" |
| Project (file) | "Odontocete Tagging in the Main Hawaiian Islands, 2007-2025" |
| Animal | id `HIPc626`, adult, sex "not specified"; taxon *Pseudorca crassidens* |
| Tag | Wildlife Computers SPOT5; source "Service Argos"; file made by the ATN data centre from the tag vendor's data service (history: created 21 May 2022; file dated 5 Mar 2025) |
| Rows | 824 |
| Times | 22 Oct 2013 23:16:00 UTC to 22 Feb 2014 15:28:47 UTC, stored as seconds since 1990-01-01 UTC |
| Extent | 17.3°N to 25.3°N, 157.4°W to 135.3°W |
| Licence in the file | free use and redistribution; not for legal use; asks that ATN or the stated citation be acknowledged in publications and representations of the data; says contact with the authors is strongly encouraged |
| Licence on the records | CC0 1.0 on the data.gov record and on the OBIS record for this deployment (read 19 Nov 02:14 UTC) |
| Citation in the file | Baird et al. (2025), the title above, "[Dataset]. US Integrated Ocean Observing System (IOOS) Animal Telemetry Network (ATN)." |

- One inconsistency in the file: the attribute `deployment_start_datetime` reads 23 Oct 2013 07:16 UTC, and the first row (the tagging position) is timed 22 Oct 2013 23:16 UTC, eight hours earlier. That row is the one the source's time test fails. Which is right is not stated.

## 3. Position types (actual values)
| `type` value | Rows | What it is |
|---|---|---|
| Argos | 823 | Argos Doppler locations |
| User | 1 | the first row: the position entered for the tagging, with no location class |

- **No row is a modelled position.** The text "argos / modeled" found earlier is the value of a descriptive attribute (`location_type`) on the `instrument_location` variable, which describes the tag family. It is not a per-row value.
- `instrument` is "SPOT" on every row. The historical model fields (`gpe_msd`, `gpe_u`) are empty on every row.

## 4. Quality fields: what is populated
**Argos location class** (823 Argos rows): 3: 17 · 2: 115 · 1: 233 · 0: 156 · A: 152 · B: 149 · Z: 1. The file states each class's meaning in words (for example class 3 as estimated error under 250 m with four or more messages); the full text is in the evidence file.

**The source's quality flags** (values 1 PASS, 2 NOT_EVALUATED, 3 SUSPECT, 4 FAIL, 9 MISSING; fill value 241, never used):

| Flag | PASS | SUSPECT | FAIL | Not evaluated |
|---|---|---|---|---|
| Time test | 823 | 0 | 1 | 0 |
| Location test | 824 | 0 | 0 | 0 |
| Speed test | 694 | 16 | 113 | 1 |
| Roll-up | 694 | 16 | 114 | 0 |

- The file does not state the speed test's limits. They must be read from ATN's quality-control documentation before we rely on the flag.
- Two rows carry the comment "Lon > 4 deviations from mean".

**Error estimates:**

| Field | Populated rows | Fill (−9999) |
|---|---|---|
| Error radius | 49 (median 1,025 m; 239 m to 37.8 km) | 775 |
| Error ellipse (semi-major, semi-minor, orientation) | 48 | 776 |
| Offset, offset orientation, message count | 0 | 824 |

- Error estimates exist for 6% of rows, all in classes 3, 2, 1 and 0. For the other 94% the class is the only accuracy information.
- `z` (depth) is 0 on every row and the file says it is synthetic. It is not an observation.

## 5. Implausible steps and gaps
| Rows kept | Rows | Rows sharing a time | Steps over 10 km/h | over 20 | over 50 | Fastest step |
|---|---|---|---|---|---|---|
| All | 824 | 57 | 218 | 97 | 40 | 1,148 km/h |
| Roll-up PASS | 694 | 0 | 153 | 32 | 0 | 49.9 km/h |
| PASS or SUSPECT | 710 | 0 | 166 | 46 | 0 | 49.9 km/h |
| Argos classes 3, 2, 1 only | 365 | 25 | 50 | 15 | 6 | 225 km/h |

- **The source's roll-up flag does more than the Argos class does:** it removes every step over 50 km/h and every duplicate time, and keeps 694 rows. Filtering by class alone keeps fewer rows and leaves worse steps.
- **These speeds are between neighbouring rows that are kept, which is not what the source's test measured.** The source's speed test was run on the rows as they stood before any were removed; once failed rows are dropped, each kept row has a new neighbour, so the steps above are a different quantity from the one the flag was set on. A rule proposal must state which it uses and recompute after filtering.
- Steps over 10 km/h remain after the flag. Whether those are real travel or position error at short intervals is not decided here.
- Time between consecutive rows (all rows): median 1.3 h, one in ten over 6.5 h, longest 125.5 h. 22 gaps over 24 hours, 7 over 72 hours.

## 6. Sensitivity considerations (for a recorded decision; none taken here)
- An adult false killer whale tagged off the island of Hawaiʻi, tracked for four months in 2013–2014, already public under CC0 with the animal's catalogue id.
- Small, island-associated populations of this species are the subject of the tagging project. Their conservation and legal status were not looked up; the recorded decision should.
- The file encourages contact with the authors. Under CC0 it is optional and is Chad's decision.

## 7. Update status
- A completed deployment, 12 years old. The project name runs to 2025, which suggests later deployments exist; a published file does not show whether the project continues, and no update schedule is established.

## 8. What this audit supports
- **Supports:** opening a quality-rule proposal for this one deployment, and a study card with the file's citation.
- **Before that proposal can rest on the source's flags:** read ATN's quality-control documentation and pin the version read; establish that it applies to this file's processing history (file created 21 May 2022, dated 5 Mar 2025); confirm the speed-test limits from it; recompute gaps and speeds after the proposed filtering.
- **Does not support yet:** auditing or drawing the other 26 deployments by assumption (each file's values need the same read); any public display; any "regularly updated" claim.
- **Next, if Chad wants it:** read and pin ATN's quality-control documentation; then a quality-rule proposal for this deployment. The other 26 deployments are not covered by this audit: each needs the same read of its own file.

## 9. Changes in rev 1.1 (GPT's review, relayed by Chad 19 Nov)
- The result line no longer says the track is "usable with the source's own quality flags"; it is conditional on the documentation, its applicability and a recomputation.
- §5 explains kept-neighbour speeds against the source's original test, and says PASS is not a guarantee of an accurate continuous path.
- §8 separates what the audit supports from what must be done first, and drops the suggestion of running the other 26 files as a next step by default.
- GPT reports that ATN publishes generic speed thresholds (8 m/s suspect, 10 m/s fail). **Not read or verified here**; it is the first thing to check against this file.
