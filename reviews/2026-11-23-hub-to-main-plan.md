# Bringing main level with the deployed hub: plan rev 2 (23 Nov 2026, 17:57 UTC clock reading)

**Rev 2** answers GPT's review of rev 1 (`reviews/2026-11-23-hub-to-main-plan-gpt-review.md`, as relayed by Chad).
Section 10 maps each point. Rev 1 is this file at commit `2864104`.

**Docs only. Nothing is merged or landed. No landing and no further deletion is authorised.** For GPT, then Chad's
own Approve line. Every count below was made on main `3e9d5a3` and is **provisional**: it is recounted on fresh
main after the Timeline page merge of 24 Nov, before any candidate is built.

## 0. In short

- **Selective copy, not a merge.** `earth-from-space-rc` also carries the unreleased Earth from Space tab and
  page; merging it would publish them (Stage E; Stage D is not cleared).
- **One commit on main, built from an exact file manifest.** No whole directory is imported. No page file.
  Nothing is deployed: the hub already runs this file.
- **Two things found while tightening it:** an Animals suite check that will fail after the landing by its own
  design (section 5), and a sentence in the test pictures' source note that the landing makes untrue (section 3).

## 1. Sources, exactly

| What | Branch and commit |
|---|---|
| The hub file, its suites, their fixtures, the records | `earth-from-space-rc` at `e9242a4` |
| Two records that exist nowhere else | `earth-from-space-proposal` at `7e3ea60` |
| Where the branch left main | `7cc18c8` (21 Nov) |
| Target | fresh main after the Timeline merge; its commit is recorded when the candidate is built |
| Live hub | 0.6.24, sha256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`, 551,400 bytes (read back 17:18:57 UTC) |

If `earth-from-space-rc` moves before the candidate is built, the new commit is named and the manifest rebuilt.

## 2. The manifest

**`reviews/evidence/2026-11-23-hub-to-main/manifest-provisional.txt`: 181 paths, each with sha256, size and its
state against main.** About 6.3 MB in all, of which 3.8 MB is the eleven test-picture files.

| State against main (provisional) | Paths | What happens |
|---|---|---|
| New on main | 111 (+ the 2 from the proposal branch) | added |
| Already on main, byte for byte the same | 60 | nothing; listed so the count is honest |
| Hub files main has not touched since `7cc18c8` | 6: `phase1/worker.js`, and the `health-hub`, `history-hub`, `sunface-hub`, `wind-hub`, `timeline-catalogue-hub` test files | replaced by the branch's |
| Records that differ on both sides | 2 | decided one by one, below |

By area: 22 files directly under `phase1/`, 11 under `phase1/earthview-fixtures/`, 4 under `docs/`, 41 under
`reviews/`, 101 under `reviews/evidence/`, plus the 2.

**The two records that differ:**
- `reviews/2026-11-22-earth-from-space-register-draft.md`: main's copy is the later one (its heading says the entry
  was filed). **Main's is kept; the branch's is not imported.**
- `reviews/2026-11-22-earth-from-space-stage-c-runbook.md`: the branch's copy is main's plus the five-line note of
  23 Nov. **The branch's is taken.**

**How the commit is held to the manifest.** A script builds the commit path by path from the manifest and then
checks: every changed path is in the manifest; every manifest path has the manifest's hash; no path outside
`phase1/`, `docs/` and `reviews/` changed; none of the page files changed. Any miss fails the build.

**After the Timeline merge** `phase1/timeline-catalogue-hub.test.mjs` will have changed on main too (their one
assertion). The branch's copy is their own fuller patch and contains that assertion; it is taken, and the
difference from main's is shown line by line in the record. `phase1/timeline/catalogue/tl-2026-11-R3.json` is
checked to be the same bytes on both sides and is not in the manifest.

**Left on the branch** (unchanged from rev 1): `space.html`, `space.js`; the branch's edits to the eight shared
page files; `earthview-ui.test.cjs`, `earthview-preview.mjs`, `earthview-static-preview.mjs`; the branch's edits
to `header-tabs`, `desktop-overflow` and `timeline-ui` suites; `phase1/alarmtest/worker.js`.

## 3. Publication review of the records and test files

Everything in the manifest is already public in the repository, on the branch. **Landing on main also makes each
file fetchable from the website by its address, if the site serves the repository's root as the page releases by
merge imply. That is confirmed in the candidate by fetching one existing `phase1/` file from the site.**

**Scanned, 23 Nov, every text file in the manifest** (the 11 pictures excepted), for mail addresses, phone
numbers, network addresses, the Cloudflare account id, keys in addresses or headers, and personal names in paths:

| Found | Where | Reading |
|---|---|---|
| The hub's public address (it contains Chad's account name) | 19 files: two scripts, one suite, 16 records of calls | already in 80 files on main. Nothing new |
| The Mac's user folder name in a path (`/Users/…/Documents/Mother Earth/…`) | 3 records: two of GPT's reviews and the C1 finding | already in 9 files on main. Nothing new in kind. **Chad's call whether to leave it** (section 9, H3) |
| `127.0.0.1` | 50 mentions | the local test stand-in |
| `?key=ADMIN_KEY`, `?key=k-test`, `Bearer <ADMIN_KEY>` and the like | 13 mentions | placeholders and made-up test keys. **No real key** |
| The header name `cf-connecting-ip` | 2 mentions | the name only, in a list of header names. No address |
| Mail addresses, phone numbers, other network addresses, the account id | none | |

**Limits of that scan, said plainly:** it is a pattern search, not a reading of 181 files. It cannot tell a real
key from a hash if one were pasted without a label. The call records under
`reviews/evidence/2026-11-22-earth-from-space-stage-c/results-as-saved/` were made by a script built never to print
the key, and the C1 step checked the key was masked; that is the basis for them, not this scan.

**The test pictures.** Eleven files, 3.8 MB: three real EUMETSAT GeoColour frames (JPEG and PNG), three derived
smaller copies and the script that made them, and `SOURCE.md` with the request, frame times, sizes, hashes, licence
(CC BY 4.0) and credit. **Their note says "the site does not serve them". After the landing that is no longer
true** if the site serves the repository root: they become fetchable by address, with their credit and licence in
the note beside them. **The note is corrected in the landing commit** (one sentence), and that edit is in the
manifest.

## 4. Proof that main's hub file is the deployed file

Unchanged from rev 1: three readings in the same hour, all sha256 `db4f9cdf…1aa5` and 551,400 bytes (the code
Cloudflare runs, read through the dashboard tab; the file at the candidate commit; the file GitHub serves from
main after the landing), and an empty `git diff earth-from-space-rc main -- phase1/worker.js`. Served-hash check
of every page file before and after: identical.

## 5. The browser suites

**Named list, provisional (main `3e9d5a3`). 14 files mention `worker.js`, as GPT found. They are not 14 consumers:**

| Kind | Suites | Count |
|---|---|---|
| Loads or reads the current `phase1/worker.js` when it runs | `fire-status-ui`, `fires-wording-ui`, `legend-active-ui`, `oceanheat-ui`, `place-ui`, `quakes-ships-status-ui`, `ships-retain-ui`, `status-notes-ui`, `timeline-changes-ui` | 9 |
| Runs it through a helper | `osmc-reliability-ui` (`osmc-reliability-fixture-hub.mjs`), `skycraft-ui` (`skycraft-fixture.mjs`) | 2 |
| Does not mention it, but uses a helper that does | `key-drawn-ui`, `mobile-pass` (`orbital-fixture.build.mjs`; `status-notes-ui` uses it too) | 2 |
| Byte-comparison guard | `animals-tab-ui`, check 13c | 1 |
| Mentions it in a comment only | `orbital-browser` (its fixture is built beforehand, outside the suite), `wind-ui` | 2, **not run for this** |

**To run: the 13 consumers and the guard.** Two of the nine (`fires-wording-ui`, `quakes-ships-status-ui`) match
patterns against the hub's source text, so they are the likeliest to notice a changed line.

**The Animals guard will fail after the landing, by design.** Check 13c of `animals-tab-ui` requires
`phase1/worker.js` to be byte for byte the file at a pinned earlier main commit. Once main holds 0.6.24 it cannot
pass. **This is a change to another thread's suite and is not made silently.** Options, for Chad and GPT:

| | What | Effect |
|---|---|---|
| **G-a (proposed)** | In the landing commit, take `phase1/worker.js` out of that check's list, with a dated comment saying why, and add it to the manifest | The guard keeps protecting the page scripts it lists; the hub is covered by section 4's proof instead |
| G-b | Leave it; record 13c as an expected failure | A suite on main that fails every time, which hides the next real failure |
| G-c | Move the suite's pinned commit forward | Changes what all of 13a to 13e compare against; the Animals thread's decision, not this one's |

**Whether 13c already fails on main today** (the list also names `timeline.js`, which the Timeline release changed)
is not known: the baseline run shows it.

**Matched baseline.** The same 14 suites are run twice on the same machine in the same sitting: on fresh main
before the commit, and on the candidate. Results side by side, suite by suite, with pass and fail counts and the
name of anything that differs. **They cannot run in Claude's workspace** (43 of 45 browser suites stopped there
today on any tree). They are run on the Mac: Chad starts one prepared command in Terminal that runs both passes
and saves both logs, or GPT runs them. **Until both logs exist this item is open, and the line is not asked for.**

**Recount at step 1,** on fresh post-Timeline main: every `.cjs` suite and every helper it loads, searched for
`worker.js`, `worker.mjs`, `loadWorker` and the helpers above; the list is rewritten from that search.

## 6. Steps

1. After the Timeline page merge of 24 Nov: fresh pull of main. Recount (section 5), rebuild the manifest, check
   the Timeline merge touched nothing in it beyond the one test file. Report any conflict to the Timeline thread.
2. Branch `hub-to-main` from that main; the commit built from the manifest by the script of section 2.
3. Workspace checks: the script's own checks; the 47 non-browser suites with the count that could not run.
4. The Mac run of section 5, baseline and candidate.
5. Candidate record and review copy to GPT: source commits, the manifest, the full 0.6.19 to 0.6.24 diff of the hub
   file, the suite results, the publication scan rerun on the final manifest.
6. On Chad's own line: main fast-forwarded to the commit. Nothing deployed.
7. Read back (section 4). HANDOVER and START-HERE updated: the old warning out, the rule of section 7 in.
8. Then, each on its own word: `earth-from-space-proposal` and `hub-to-main` deleted; main merged into
   `earth-from-space-rc` as branch work.

**If the hub is deployed again before step 6,** the candidate is rebuilt from the new deployed file and rechecked.

## 7. The rule that replaces "never deploy from main"

A hub deploy happens only when **all** of these hold and are recorded:

1. **A named candidate.** Branch, commit, `phase1/worker.js` sha256 and byte count. GPT reviewed that exact commit.
2. **Chad's own Approve line** quoting that commit and hash, and saying what is and is not changed besides code.
3. **Built from main.** The candidate branch was cut from main at a recorded commit, and **main's `worker.js` has
   not changed since** (checked again at deploy time). If it has, the candidate is rebuilt.
4. **Live has not drifted.** Immediately before the upload, the deployed code is read back and equals the file the
   candidate was built on; reversing the candidate's diff gives that file byte for byte. Necessary, not sufficient.
5. **Settings and data compatibility stated in the packet:** bindings by name and type, variables, crons, the
   compatibility date, the D1 schema, and the form of any stored object the new code reads or writes. Anything that
   must change is its own approved step, with its order relative to the code.
6. **Rollback written before the deploy:** the previous file and its hash; the conditions that trigger a rollback;
   what a code rollback does not undo (settings, stored data); who does it.
7. **Post-deploy verification, listed beforehand and then recorded:** code hash, bindings, variables, crons;
   the health addresses; the first scheduled runs; the change's own live checks. What was not read is said.
8. **Main follows at once.** The deployed commit is fast-forwarded onto main under the same line, and main's file
   is read back equal to the deployed one. Main is never left behind the hub again.
9. **Not inside an Earth from Space trial window,** from its start change to its closeout.

Until the landing of section 6, the old rule stands: nobody deploys a `worker.js` built from main.

## 8. Branches

| Branch | State |
|---|---|
| `earth-from-space-0.6.24-rc` | **deleted 23 Nov 17:53 UTC on Chad's own word** ("you delete what needs to be you have my permission"), before this review arrived; it was fully contained in `earth-from-space-rc`; read back gone |
| `earth-from-space-proposal` | kept. Deleted only after the landing has put its two files on main, and on Chad's word |
| `hub-to-main` | does not exist yet |
| `earth-from-space-rc` | kept until Stage E |

## 9. Decisions for Chad

| # | Question | Claude proposes |
|---|---|---|
| H1 | The Animals guard: G-a, G-b or G-c (section 5)? | G-a |
| H2 | Who runs the 14 browser suites on the Mac: you, with one prepared command, or GPT? | Whichever of you is at the Mac; about one sitting |
| H3 | The Mac user folder name in three more records: leave as on main's nine, or have it replaced with `~` in the copies that land? | Leave. Replacing it would make the landed records differ from the reviewed ones |

## 10. GPT's points and where they went

| Point | Where |
|---|---|
| Q1: record exact source commits and imported paths | Section 1; the manifest (section 2) |
| Q2: exact file manifest, no whole directories | Section 2: 181 paths with hashes; the commit is built from it and checked against it |
| Q2: fixtures with provenance and hashes | Section 3, last paragraph; hashes in the manifest and in `SOURCE.md` |
| Q2: review the record files for publication | Section 3: the scan, its findings and its limits |
| Q2: test-only files reachable through the repository or Pages | Section 3: stated; the fixtures' note corrected; confirmed by a fetch in the candidate |
| Q3: affected suites, not all 45; helper loads and guards | Section 5: named list by kind |
| Q3: recount on fresh post-Timeline main | Section 5, last paragraph; step 1 |
| Q3: 14 mentions are not 14 consumers; the Animals guard | Section 5: 13 consumers (two found only through a helper), 1 guard, 2 comment-only; the guard's options |
| Q3: matched baseline results | Section 5: same machine, same sitting, before and after; open until both logs exist |
| Q4: strengthen the replacement rule | Section 7 |
| No landing or deletion authorised | Top of this file; section 8 records the one deletion made earlier on Chad's own word |

## 11. Not checked while writing this

- GPT's full saved review: only the relayed text was read.
- Whether the site serves files under `phase1/` and `reviews/` by address. Confirmed in the candidate.
- Whether the three helper-using suites exercise the hub's code paths that changed. The run shows it.
- The deployed hub was last read at 17:18:57 UTC.
