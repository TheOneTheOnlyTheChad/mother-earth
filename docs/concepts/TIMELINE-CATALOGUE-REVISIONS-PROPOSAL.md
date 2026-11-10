# Timeline — serving more than one catalogue revision (proposal rev 1.1, 10 Nov 2026)

**Status:** rev 1.1 folds in GPT's review of rev 1 (10 Nov, relayed by Chad: versioned route and the 404/503 split accepted; four points below applied). Ready for Chad's branch-build go. Nothing built. Backlog §T3 (versioned releases), brought forward by Chad on 10 Nov ("fix that now before we handover so we are tidy").

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
- **`/catalogue/timeline`** (unversioned, the legacy URL) stays and is **pinned to `tl-2026-11-R1` permanently** (`TIMELINE_LEGACY`), not to the current revision. Today's live page keeps working through and after the deploy, and keeps working when R2 and later revisions become current. *(rev 1.1, GPT: rev 1 had the legacy URL follow `current`, which would have recreated the original bug.)*
- `TIMELINE_CURRENT` is **discovery metadata only** and may advance to R2 and beyond; no route serves "current" implicitly. Versioned pages always fetch their own revision.
- Root `/` lists `catalogues.timeline` = `{ path: '/catalogue/timeline', revision: 'tl-2026-11-R1', current, versioned_path: '/catalogue/timeline/<revision>', revisions: [...] }`. The existing `path` and `revision` fields keep describing the **same legacy response** (R1).
- **Published revisions are immutable** *(rev 1.1)*: once a revision ID has been published, its pin (key, sha256, bytes) and its R2 object never change. Changed catalogue bytes always get a **new revision ID and a new object key**. Old pins and objects are retained so older pages can still fetch the bytes they expect; removing one is a separate Approve line, and only once no released page expects it.

**Page (same catalogue, no R2 change)**
- `timeline.js` fetches `HUB + '/catalogue/timeline/' + encodeURIComponent(wrap.dataset.catalogueRev)`, so each page asks for the revision it was built with. The page already carries `data-catalogue-rev`.
- Everything else is unchanged: no-store, 10 s timeout, sha256 equality, build check, guarded validation, list usable on any failure.
- Asset `?v=` and BUILD bump (new review-round id). The catalogue file (`096ae648…0fbe`) is unchanged, so **no R2 write**.

**Release rule after this (T3):** publish a new revision = new ID + new key, add its pin to the table (old pins untouched), optionally advance `TIMELINE_CURRENT` → R2 upload → hub deploy → page release. A page and its catalogue are still a matched pair by hash; older pages keep getting their own revision, and the legacy URL keeps returning R1.

## 3. Tests (branch)
- Hub: **the test that catches the original bug** *(rev 1.1)*: a fixture table with R1 and R2 and **R2 marked current** → the legacy URL still returns R1's exact bytes, `/catalogue/timeline/tl-2026-11-R1` returns R1's exact bytes, `/catalogue/timeline/<R2>` returns R2's exact bytes, and the root's `path`/`revision` describe R1 while `current` names R2. Also: versioned R1 served byte-exact on the real table; legacy = R1; unknown revision 404 with no R2 read; `..`, encoded slashes, empty and over-long ids → 404; mismatched `catalogue_revision` inside a hash-matching file → 503 invalid; two-revision table with a fixture R2 serves each by its own pin. Breaks: legacy-follows-current, serve-unknown-as-current, no-per-revision-hash.
- Page: the fetch URL carries the page's revision; existing 93 axis checks and UI suites unchanged; break: fetch-unversioned.
- Full regression suite as for rev 3.

## 4. Order, approvals, rollback
1. Chad's go to build on a branch (`timeline-revs-rc`) → GPT review of the candidate (hashes pinned).
2. `Approve: deploy hub 0.6.4 from <commit> (content only)` — no visible change; the live page keeps using the unversioned path.
3. Live RC from the Pages origin: **both live R1 routes** (legacy `/catalogue/timeline` and `/catalogue/timeline/tl-2026-11-R1`) return the exact R1 bytes with CORS, before the page is merged.
4. `Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)`.
- **Rollback (qualified, rev 1.1):** reverting the page first restores the legacy URL for fresh loads. But tabs already open, or cached, on the new page use the versioned URL; if the Worker is then rolled back to 0.6.3 (which has no versioned route), those tabs lose the axis and fall back to the list (tested failure path). A rollback that keeps the axis for **both** page generations needs a Worker that still serves both routes, i.e. stay on 0.6.4 (or a later 0.6.x) and revert only the page. Hub rollback to 0.6.3 `94a6b2b2…af93` remains available, with that cost.

## 5. Cost and scope
- R2: unchanged (same reads; unknown revisions read nothing).
- Effort: small. Worker change about 30 lines; page change one line plus the build bump; tests.
- Not in scope: discovery inbox (T1), evidence review (T2), changelog (T4), cadence (T5), the "extinction horizon" wording (waits for the first real R2 revision).
