# Timeline — Big Five source check (record: IDs, hashes, dispositions only)

**Rev 2 (10 Nov 2026, after GPT's review): the blanket PASS is withdrawn; the rev 2 table below supersedes the original one** (kept underneath for the record). Packet `rev2/` (REPORT-rev2.md sha256 `f44c8c70…aed4`; `.rev2-hashes`); originals unchanged.

| ID | Rev 2 disposition | Shape | Source (identifier · licence) · status |
|---|---|---|---|
| C0 | PASS — release reconciled, bytes retained | boundary markers; Phanerozoic 538.8 ± 0.6 Ma, Earth 4567 Ma | ICS chart, GitHub tag `v2026-06.5` = commit `44d1043ecf29`; `chart.ttl` sha256 `0158959e…b355` retained on the Mac · CC BY 4.0 |
| E1 end-Ordovician | TIMING CANDIDATE — publisher page blocked (bot challenge) | approximate interval; pulse model as attributed text; pulses only in a fixture | doi:10.1093/nsr/nwad319 · CC BY 4.0 · Crossref 0 notices, Europe PMC no corrections |
| E2 Frasnian–Famennian extinction (Late Devonian) | PASS as boundary-age evidence | one-sided bound + modelled interval; extinction duration unset; Hangenberg out of scope | doi:10.1038/s41598-018-27847-7 · CC BY 4.0 · publisher page read, no notices |
| E3 end-Permian | PASS — **source switched** | onset 251.941 ± 0.037 Ma; newer estimates shown as differing context | doi:10.1038/s41467-017-00083-9 (Burgess, Muirhead, Bowring 2017) · CC BY 4.0 · publisher page read, no notices. Herz 2026's ~251.906 Ma not traced in Dai 2025's readable text |
| E4 end-Triassic | TIMING CANDIDATE — publisher page blocked (bot challenge) | approximate point; other approximations differ | doi:10.1126/sciadv.abb6704 · CC BY 4.0 · Crossref 0 notices, Europe PMC no corrections |
| E5 end-Cretaceous | PASS with labelled placement | impact age 66.02 Ma; extinction placed at it, labelled "tied to the dated impact" (synchrony: doi:10.1126/sciadv.ado5478); causes off this slice | doi:10.1017/ext.2023.13 · CC BY 4.0 · publisher page read, no notices |

**GPT's review of rev 2 (10 Nov, relayed by Chad):** all five rev 2 hashes matched, original log prefix intact, retained chart matched and contains both window bounds. **GPT opened the science.org pages for E4 (He 2020) and O'Connor 2024: no correction, retraction or expression-of-concern notice in the article text GPT inspected.** E4 → timing confirmed for the build. **E1 stays provisional and off the release axis** until the Oxford page is read. Build proposal may proceed with E1 conditional.

**Open (superseded in part above):** E1 and E4 publisher pages (Chad or GPT to read; the pane got a Cloudflare challenge and did not bypass it); full-text XML not retained (Mac shell refused at Europe PMC/NCBI/Crossref; passages + hashes kept). REGISTER entries proposed, not filed.

## Original record (superseded by rev 2)

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
