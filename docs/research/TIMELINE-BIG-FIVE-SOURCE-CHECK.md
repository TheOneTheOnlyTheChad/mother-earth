# Timeline — Big Five source check (record: IDs, hashes, dispositions only)

Run 10 Nov 2026 on Chad's go ("D1–D4 and D6 as written, D5 show all four lanes, D7 3 h incl. write-up, text only. Go: Big Five source check per §11a."). Protocol `bf-v1` fixed 03:27:47Z (sha256 `9a6c30f4…181f`), run closed 03:39:11Z: **11 min 24 s of the 3 h cap.** Packet on the Mac: `research/timeline-big-five/2026-11-10-claude/` (`report/REPORT.md` sha256 `a9640fda…2c82`; `.hashes` lists all six files). Excerpts and quotations stay in the packet; nothing from the sources is copied here beyond identifiers.

| ID | Disposition | Shape the evidence supports | Source (identifier · licence) |
|---|---|---|---|
| C0 | PASS | boundary markers | ICS chart, data tag `2026-06.5`, `chart.ttl` sha256 `0158959e…b355`; CC BY 4.0 (page + repo LICENSE) |
| E1 end-Ordovician | PASS | approximate interval; pulse model attributed as text (pulses not numerically dated) | doi:10.1093/nsr/nwad319 · PMC10799725 · CC BY 4.0 |
| E2 Late Devonian (Frasnian–Famennian) | PASS (F–F event only) | one-sided bound + modelled interval (assumptions stated) | doi:10.1038/s41598-018-27847-7 · PMC6014997 · CC BY 4.0 |
| E3 end-Permian | PASS, 2 flags (secondary statement of a CC BY-NC-ND result; licence version unstated) | approximate point | doi:10.1126/sciadv.aef5669 · PMC13715695 (citing doi:10.1073/pnas.2509247122) |
| E4 end-Triassic | PASS | approximate point (other sources' approximations differ) | doi:10.1126/sciadv.abb6704 · PMC11206537 · CC BY 4.0 |
| E5 end-Cretaceous | PASS | point, uncertainty not stated; cause = separate contested claim | doi:10.1017/ext.2023.13 · PMC11895728 · CC BY 4.0 |

**Carry into the build proposal:** pulse rendering tested with a fixture (no numerically dated pulses found); chart-vs-source differences shown, not reconciled; uncertainty meaning carried or "not stated"; E3 resolved (read the publisher reuse page or switch source); E5 cause shown only as attributed claims; E2 scoped to the F–F event; **publisher landing pages read before release** (status here = Crossref update notices only, 0 for each). Proposed REGISTER entries (chart + articles) are **not filed**.
