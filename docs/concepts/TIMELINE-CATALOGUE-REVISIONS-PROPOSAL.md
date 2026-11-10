# Timeline — serving more than one catalogue revision (proposal rev 1, 10 Nov 2026)

**Status:** proposal for GPT's review; nothing built. Backlog §T3 (versioned releases), brought forward by Chad on 10 Nov ("fix that now before we handover so we are tidy").

## 1. The gap
- Hub 0.6.3 pins **one** revision (`TIMELINE`, `tl-2026-11-R1`) and serves it at `/catalogue/timeline`.
- The live page (main `57d07c2`) fetches that **unversioned** path and draws only if the bytes hash to its own pinned sha256.
- When revision R2 is published, the unversioned path will serve R2. A page that still expects R1 (an open tab, a cached HTML file, a rollback of the page alone) then gets a hash mismatch and hides the axis. The list stays usable (tested), but the axis goes dark for that reader.
- Rolling the page back without also rolling the hub back would hit the same mismatch. Today the two must move together.

## 2. Proposed design (small; no new data)
**Hub 0.6.4**
- Replace the single pin with a table of pins: `TIMELINE_REVISIONS = { 'tl-2026-11-R1': { key, fileSha256, bytes } }` and `TIMELINE_CURRENT = 'tl-2026-11-R1'`. Same values as today.
- New route **`/catalogue/timeline/<revision>`** serves that revision under exactly today's rules (whole-file sha256 against its own pin, `catalogue_revision` must equal the requested id, else 503 `missing | unreadable | integrity | invalid`).
- Unknown revision → **404** `{status:'unknown revision'}`, no R2 read. The id is matched only as an exact key in the table (no pattern-built R2 keys, so no path tricks).
- **`/catalogue/timeline`** (unversioned) stays, serving `TIMELINE_CURRENT`, so today's live page keeps working unchanged through and after the deploy.
- Root `/` lists `catalogues.timeline` = `{ path, current, revisions: [...] }`.
- Old revisions stay in the table and in R2 (`ref/` has no lifecycle rule). Removing one is a separate Approve line.

**Page (same catalogue, no R2 change)**
- `timeline.js` fetches `HUB + '/catalogue/timeline/' + encodeURIComponent(wrap.dataset.catalogueRev)`, so each page asks for the revision it was built with. The page already carries `data-catalogue-rev`.
- Everything else is unchanged: no-store, 10 s timeout, sha256 equality, build check, guarded validation, list usable on any failure.
- Asset `?v=` and BUILD bump (new review-round id). The catalogue file (`096ae648…0fbe`) is unchanged, so **no R2 write**.

**Release rule after this (T3):** publish a new revision = add its pin to the table (old pins stay) → R2 upload → hub deploy → page release. A page and its catalogue are still a matched pair by hash; older pages keep getting their own revision.

## 3. Tests (branch)
- Hub: versioned R1 served byte-exact; unversioned = current; unknown revision 404 with no R2 read; `..`, encoded slashes, empty and over-long ids → 404; mismatched `catalogue_revision` inside a hash-matching file → 503 invalid; two-revision table with a fixture R2 serves each by its own pin. Breaks: serve-unknown-as-current, no-per-revision-hash.
- Page: the fetch URL carries the page's revision; existing 93 axis checks and UI suites unchanged; break: fetch-unversioned.
- Full regression suite as for rev 3.

## 4. Order, approvals, rollback
1. Chad's go to build on a branch (`timeline-revs-rc`) → GPT review of the candidate (hashes pinned).
2. `Approve: deploy hub 0.6.4 from <commit> (content only)` — no visible change; the live page keeps using the unversioned path.
3. Live RC from the Pages origin (versioned route + CORS).
4. `Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)`.
- Rollback: page first (revert; the old page uses the unversioned path, which still works) → hub 0.6.3 `94a6b2b2…af93`. Each step can be reverted independently, which is the point.

## 5. Cost and scope
- R2: unchanged (same reads; unknown revisions read nothing).
- Effort: small. Worker change about 30 lines; page change one line plus the build bump; tests.
- Not in scope: discovery inbox (T1), evidence review (T2), changelog (T4), cadence (T5), the "extinction horizon" wording (waits for the first real R2 revision).
