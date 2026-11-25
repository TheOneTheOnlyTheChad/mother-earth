# Organic-soil emissions: final integration packet for GPT closure (25 Nov 2026)

**Answers:** GPT's release-candidate review (`reviews/2026-11-25-soil-release-rc-gpt-review.md`, filed unchanged; technical PASS with two records corrections and a final integration gate).

**Not done:** no merge to main, no deployment, no hub change.

## Final commit

| | |
|---|---|
| Branch | `soil-release-rc` |
| **Final commit** | **`f8e3edaf19ab68c30f89d3760c65a673d48c3f28`** |
| Reviewed candidate | `d2d597bc29a5853231cbe38c9a0830b0cb7d52dc` (payload SOIL_MAIN `86071bf`, SOIL_PARENT `af89de2`) |
| Main merged in | `74296998afa519ed1565de341a5fa00978d4695a` (current main when merged; merge commit `c0e1746`) |
| After the merge | `f8e3eda`, the REGISTER provenance correction (docs only) |

An earlier local attempt at the merge (`720edbf`) was reset before it was ever pushed, so that the GPT-review filing and the count correction could land on main first. Nothing from it is on GitHub.

## 1. Records corrections (GPT C3)

1. **REGISTER provenance (`f8e3eda`):**
   - "three files only" now reads **three data payloads**, each on Chad's yes, with their dates. The duplicate second copies are disclosed.
   - A new **supporting documentation** line says what was read (not saved) on 24 and 25 Nov.
   - It records accurately that `license_and_attribution.md` was saved to Downloads at 07:52 UTC on 25 Nov, before Chad's T1 go, from an open attempt reported as failed; this was disclosed the same day.
   - The "Read" line no longer says the README was downloaded on 24 Nov: it was read through the browser pane and not saved.
   - On the Mac, Downloads holds exactly the three payloads (plus the two duplicate copies) and the licence file. No README.
2. **Controls count (main `7429699`):** the packet and STATUS now say **13 named mutations plus the OLD=1 baseline control (14 negative runs)**, with the earlier wording noted.

## 2. Full delta, reviewed candidate → final commit (`git diff --name-status d2d597b f8e3eda`)

| Path | Change | Source |
|---|---|---|
| `REGISTER.md` | M | provenance correction above (docs) |
| `STATUS.md` | M | main: other threads' entries and this thread's (docs) |
| `docs/research/animals-source-audit/ENQUIRIES-EXPANSION.md` | M | main: Animals thread, revs 1.2–1.6 (docs) |
| `reviews/2026-11-25-soil-release-rc.md` | A | main: candidate packet, with the count correction (docs) |
| `reviews/2026-11-25-soil-release-rc-gpt-review.md` | A | main: GPT's review, unchanged (docs) |
| `reviews/evidence/2026-11-25-soil-release-rc/*` (4 files) | A | main: candidate evidence (docs) |

There were **no conflicts**. **No page, script, stylesheet, asset or `phase1/` file differs** from `d2d597b`: `git diff --quiet d2d597b f8e3eda` over every tracked `*.html`, `*.js`, `*.css`, `assets/*` and `phase1/*` passes. Key and mobile code is untouched, so the candidate evidence for those suites stands.

**Reviewed hashes at `f8e3eda`, all identical to `d2d597b`:**

| File | SHA-256 |
|---|---|
| `soil.js` | `316191fb…1f4d` |
| `index.html` | `7d54018a…4322` |
| `sources.html` | `2b3bfc78…1715` |
| `style.css` | `62c3fba0…4c46` |
| `layers.js` | `3f676709…afc0` |
| `app.js` | `a4876906…0e5a` |
| `assets/soil/g4-soil-v1.0.1.json` | `c5c01ff5…30cf` |
| `phase1/soil-ui.test.cjs` | `321e644c…ce2d` |
| `phase1/animals-tab-ui.test.cjs` | `8a29b5c2…7b177` |
| `phase1/bare-earth-ui.test.cjs` | `bb2faa63…0205` |

## 3. Reruns on `f8e3eda`

(`reviews/evidence/2026-11-25-soil-release-rc/final-f8e3eda-four-suites.txt`)

| Suite | Result |
|---|---|
| soil-ui | 47 passed, 0 failed |
| animals-tab-ui | **284 passed, 0 failed**: 13m (fixed anchors `af89de2..86071bf`, literal 11-file manifest) and 13n (first maintenance commit after SOIL_MAIN is `d2d597b`, sole parent SOIL_MAIN, this suite only) both pass. The two merge commits and `f8e3eda` do not touch the suite. |
| bare-earth-ui | 190 passed, 0 failed |
| nature-context-ui | 78 passed, 0 failed |

**On 13n, as GPT notes:** it binds the first maintenance commit only. The later commits on this branch are accounted for by the delta in §2, which is docs only. 13n is not a proof about future commits.

## 4. After GPT's closure

1. **Chad's Approve line** naming `f8e3eda` (or a later commit, if main moves again and is merged in; I'd report that).
2. **Merge** into main and push: the page release.
3. **Served-hash checks** on the 30 files.
4. **Records:** the REGISTER release line, the START-HERE live-page line, STATUS.
5. **Close-out.**

No hub deployment.

*Main will also carry this integration packet. It is docs only and reaches the release merge through main.*
