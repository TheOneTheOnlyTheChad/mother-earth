# Test A — bounded open-access search: PROPOSAL (rev 1, 9 Nov 2026)

**Status: proposal only. Nothing searched.** Chad's brief (9 Nov): before Test B, a small open-access pass on the **same five finds and 31 list-row assertions**. Search by exact DOI or title for lawful copies; where the cited paper does not address a claim, look for a source that names the exact specimen or group, labelled as a **separate evidence lead**. The search needs Chad's separate go.

**Baseline:** Test A rev 2 (accepted) and the access retry rev 2 (`research/timeline-test-a*/2026-11-09-claude/` on the Mac). Neither is edited.

**Principles carried over:**
- **Wikipedia stays a finder only.**
- **Evidence is matched to the exact claim.** For Omo, 233 ± 22 kyr dates an eruption; the minimum age for the fossil is the authors' inference from the overlying ash. For Jebel Irhoud, a dating paper tells us what was measured on the flint or a tooth; a classification claim about **Irhoud 1–5** needs a source that discusses that group.

## 1. What is searched (two lists, fixed before any request)
**A. Lawful copies of the sources already identified (exact DOI or exact title):**

| Key | Source | Find | Current readable text |
|---|---|---|---|
| A1 | McDougall et al. 2005, *Nature*, 10.1038/nature03258 | Omo | abstract |
| A2 | Richter et al. 2017, *Nature*, 10.1038/nature22335 | Jebel Irhoud | abstract |
| A3 | Magori & Day 1983, *J. Hum. Evol.*, 10.1016/S0047-2484(83)80130-4 | LH 18 | title |
| A4 | Jaeger 1975, *After the Australopithecines*, 10.1515/9783110878837.399 | Salé | none |
| A5 | Debénath, Reynal & Texier 1982, *CR Acad. Sci.* (no DOI known) | Salé | none |
| A6 | Bräuer 2012 (review), 10.1007/978-94-007-2929-2_15 — **kept separate** | Salé (attribution) | abstract |

Vidal et al. 2022 is already full text and is not searched.

**B. Exact-claim evidence leads**, only for claims the cited paper does not address or that have no source. Each lead must **name the exact specimen or group** in the claim:

| Claim(s) | Why a lead is needed | Lead must name |
|---|---|---|
| JI-F1, JI-F4, JI-F5a/b | Richter 2017's abstract treats new remains and Irhoud 3, not the 1–5 group | "Irhoud 1" … "Irhoud 5" (or the group as one) |
| JI-F3 | the list's "315±32" matches no result stated as written | the Jebel Irhoud hominin fossils' age, with the value as stated |
| LH18-F2, F3, F5a/b | only the title is readable | "LH 18" / "Laetoli Hominid 18" / "Ngaloba" |
| SALE (all six) | no primary text reached; the age cell is unreferenced | "Salé" cranium / hominid |
| EH06 (all six) | the row gives no reference; no article | "EH 06" (or the Eyasi specimen designation as printed) |
| OMO-F5b | discoverer not stated in the sources read | "Omo I" with the discoverer |

## 2. Where it searches (lawful, no-account routes only) [recommendation]
| Route | Use | Note |
|---|---|---|
| **OpenAlex API** (no key) | exact DOI/title → OA locations: repository, version (submitted / accepted / published), licence, landing URL | primary finder for list A |
| **Europe PMC** | exact DOI/title; **full-text search of the open-access subset** for exact specimen names (list B) | already used; text XML |
| **Internet Archive Scholar** (scholar.archive.org) | exact title/DOI for archived OA copies | lawful archive |
| **HAL** (French national OA repository) API | A4, A5 (French institutions and journals) | likely relevant to Moroccan/French work [general knowledge, unverified] |
| **University/institutional repositories and author pages** | only when OpenAlex or a search result points to them | no blind crawling |
| **Crossref** | identity only (as before) | — |

**Excluded:**
- shadow libraries (Sci-Hub, LibGen, Anna's Archive);
- sites that need a login to read: ResearchGate, Academia.edu (a copy there is recorded as "found, login-gated" if a finder lists it, and not opened);
- **CORE** and **Unpaywall**. CORE's API needs a registered key (an account). Unpaywall requires an email address in every request, and we put no personal email in requests. Each is Chad's option (**O2**).

## 3. Rules (unchanged from Test A unless stated)
- **Text only:** direct text/XML or unrendered HTML; **no PDF** (H8b no); no images.
  - **Expect many lawful copies to be PDFs only.** Those are recorded as "**found — PDF only → outside bound (text route unavailable)**", with version and route, and not opened.
  - Whether to allow unrendered PDF ingestion for this pass is a **separate decision for Chad (H8b)**. This proposal does not change it.
- **Lawful copy only:**
  - the version and the host's own statement are recorded (publisher OA, repository accepted manuscript, author archive, preprint);
  - a copy whose lawfulness the host does not state is recorded as **"lawfulness not established"** and not used for coding.
- **Version recorded for every copy:** published version / accepted manuscript / submitted preprint / other. **Coding uses only the version read, labelled.** An accepted manuscript can differ from the published text.
- **Evidence leads (list B) are separate:**
  - a lead is **not** the row's cited source, so it never changes the row's rev 2 disposition directly;
  - it gets its own field: "**lead: states / does not state / not checked**" for the exact claim, with lineage recorded (dependent / unknown);
  - an F4 classification in a lead is that lead's attributed claim.
- **Coding changes only where new text is read.** Tallies are kept beside Test A rev 2 and the retry. Short quotes under 15 words, in the Mac folder only.
- One request at a time; the pane for all reads; site approvals by Chad as they come; no purchase; no bypass.

## 4. Bounds [recommendation]
- **Cap 90 min** total, including the write-up.
- **List A:** ≤ 4 routes per source, in the §2 order.
- **List B:** ≤ 3 queries per claim group and **≤ 3 leads recorded per claim**.
- Stop at the cap and report what is unfinished.
- **No new finds, claims or frame.** Test B not started.

## 5. Deliverable
| Field | Per copy or lead |
|---|---|
| identity | DOI/title, authors, year |
| version found | published / accepted / submitted / other / unknown |
| route and host | repository or index, URL type (landing / text / PDF) |
| lawfulness as observed | host statement, licence |
| usable text under current rules | **yes** (text/HTML read) · **PDF only** · **login-gated** · **not found** |
| claim(s) it could help resolve | unit IDs, with the specific gap it addresses |
| outcome | disposition change (list A, text read) or lead field (list B) |

**Outcomes reported separately:**
- **found** (any lawful copy);
- **usable** (text under current rules);
- **resolving** (changed a disposition, or a lead that states the exact claim).

## 6. Decisions for Chad
| | Decision | Recommendation |
|---|---|---|
| O1 | Routes | OpenAlex, Europe PMC (incl. OA full-text search), Internet Archive Scholar, HAL; repositories/author pages only via those |
| O2 | CORE (needs an account key) and Unpaywall (needs an email in requests) | **exclude** for this pass; revisit only if O1 finds little |
| O3 | Cap | 90 min |
| O4 | Leads | ≤ 3 per claim, exact specimen/group named, coded separately |
| O5 | PDFs | stay excluded (H8b no); a PDF-only copy is recorded, not opened. Any change is a separate decision |

*This proposal authorises nothing beyond its own writing.*
