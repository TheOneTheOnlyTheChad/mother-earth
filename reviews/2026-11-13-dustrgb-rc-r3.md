# dustrgb-rc round 3 — fixes after GPT's review of round 2 (`2980ded`)

**Branch only. Nothing merged, uploaded or deployed. No REGISTER entry filed. The 0.6.11 deploy is on hold** (Chad, 13 Nov). Live unchanged: hub 0.6.10 `784939f8…a0da`, page `12ff4ff`. Lockdown parked.

Earlier packets: `reviews/2026-11-12-dustrgb-rc.md`, `reviews/2026-11-13-dustrgb-rc-r2.md`. This one lists only what changed since round 2. Times are UTC; SAST = UTC + 2.

## 1. GPT's findings and what changed

### Finding 1 (high) — first-run initialisation could erase a published pointer

**Reproduced.** `dustPtr()` wrote an empty pointer unconditionally when it found none. Two runs reading a missing pointer; the first paused before that write; the second publishing; the first resuming → pointer back to `frame: null`.

**Fix.** `dustPtr()` no longer writes anything. It returns the pointer and its etag, or an empty body and `etag: null`. `dustUpdate()` is now the only place a pointer is written, and every write is conditional:

- pointer existed at the read → `onlyIf: { etagMatches: etag }`;
- no pointer at the read → `onlyIf: { etagDoesNotMatch: '*' }` (create-only).

Both forms are the ones `fvProbeR2` already checks on the production bucket for FIRMS (`createAbsent`, `createPresent`, `casStale`, `casCurrent`), and the create-only form is what the FIRMS writer uses (`worker.js` lines 664 and 1517). A refused write returns `null`; the run reads again and decides again.

**Correction to the round-2 packet:** it said the conditional write "has not touched real R2". The same two R2 conditions were already verified on the production bucket for FIRMS; what has not run on real R2 is *this job's* use of them.

### Finding 2 (high) — cleanup could delete a file that had just become current

**Reproduced as described** (a reused orphan older than two hours, published after cleanup's single pointer read).

**Fix: deletion is removed from this candidate**, as GPT suggested. `dustClean` and `CLEAN_AFTER_MS` are gone; the job never calls `R2.delete`. Every stored pair stays.

- Cost: about 0.75 MB per publication (real pair on 13 Nov: 668,903 + 65,763 B), two a day ≈ 1.5 MB a day, about 0.5 GB a year.
- The route still serves only the current and previous pairs, so older files are stored but not reachable.
- A later cleanup would need its own proposal. One rule that looks provable, **not built or tested here**: a pair whose time is older than the current frame's can never be published again (publication requires a strictly newer time, enforced by the conditional write), so files with an older time that the pointer does not name are safe to delete. For GPT to judge when it comes up.

### Finding 3 (medium) — mask size check came after decompression; download limits applied after reading

- **Inflation is bounded.** `dustInflate(parts, expect)` reads the decompressed stream in pieces and cancels it the moment output passes the size the header promises (`h × (stride + 1)`). GPT's case rebuilt in the suite: 16,316 B expanding to 16 MiB is abandoned with well under 1 MiB read.
- **Pixel count checked before inflating.** `pngAlpha(u8, maxPixels)` refuses an image with more pixels than the caller allows; the job passes exactly 160 × 160.
- **Download limits are enforced while reading.** `dustBody(r, max)` refuses a declared `Content-Length` over the limit without reading, and cancels an undeclared body as soon as it passes the limit (4 MiB picture, 512 KiB mask). A body that breaks off part-way is "… request failed".

**Worker CPU — not measured, and it gates the schedule.** I cannot measure Worker CPU from here. Desktop figures only, for scale (Mac browser, warm, average of 20, real pair of 13 Nov 01:40 UTC): SHA-256 of the picture 0.33 ms; mask checksum walk 0.81 ms; mask inflate 2.07 ms; unfilter and count 0.23 ms; picture segment walk < 0.01 ms. The job hashes the picture three times and the mask three times. **These are wall times on a desktop, not Worker CPU, and they do not establish that the job fits a 10 ms Free-plan cron allowance** — the hourly invocation also carries every other collector. I do not know which plan the Worker is on.

Proposed order at deploy time, so the measurement comes before the schedule:

1. Deploy 0.6.11 with `DUSTRGB_ENABLED` **unset** (the scheduled job then makes no request).
2. One manual run: `/admin/run/dustrgb`.
3. Read that invocation's CPU time in the Cloudflare dashboard; read `/snapshot/dustrgb/meta` and both file URLs.
4. Only if the CPU figure is acceptable for the plan: set `DUSTRGB_ENABLED=1`.

### Page — body read failing after the response began

**Reproduced:** `r.arrayBuffer()` rejecting threw a plain error, which the fallback did not treat as a file failure, so a first-time visitor saw nothing. It is now a retryable file failure: the previous pair is shown with the note, and the newest pair is tried again on the next refresh (it is not marked unusable). "Frame requested" kept.

## 2. Tests

### `phase1/dustrgb-hub.test.mjs` — 174 passed, 0 failed (round 2: 156). Standard library only.

| Group | What is checked |
|---|---|
| I | **GPT's exact interleaving**: both runs read a missing pointer; one is paused just before its first pointer write (a failure record); the other publishes; the first resumes → the published frame survives and the attempt is added on top. Same start with two publications of the same time → one published, one superseded. Paused run holding an older time → newer frame stays. Reading a missing pointer writes nothing. |
| J | An orphan older than two hours is reused and published while another run finishes → every pair the pointer names is readable. The orphan becoming current during another run → still stored and served. |
| K | `dustInflate` on 16 MiB of expansion; exact / one byte short / not zlib. `pngAlpha` on the rebuilt expanding PNG and on an over-large image. Through the job: expanding mask → "mask does not decode". Picture and mask that keep coming with no declared length → reading stops just past the limit. Picture declaring 64 MiB → refused from the header. Body breaking off part-way → "picture request failed". |
| D (changed) | After four publications and 30 days of age, all eight files are still stored. |
| GLOBAL | Across the whole suite: every pointer write was conditional (none unconditional); the job never called delete. |

Breaks — all 26 fail. Removed with the cleanup code: `keep-all`, `clean-young`. New: `create-unconditional deletes inflate-unbounded download-unbounded pixels-unchecked`. `no-cas` rewritten for the new write.

### `phase1/dustrgb-ui.test.cjs` — 67 passed, 0 failed (round 2: 63); all 20 breaks fail

New in group N: newest picture's body breaks off after a 200 `image/jpeg` response began → previous pair shown with the note; the next refresh tries the newest pair again; once the body arrives whole the newest pair replaces the fallback and the notes go; body breaks off with no previous pair → nothing drawn, plain reason. New break: `body-uncaught`.

## 3. Still not shown

1. **No real hub run**; this job's conditional writes have not run on real R2 (the R2 conditions themselves are verified in production for FIRMS).
2. **Worker CPU not measured** (§1, finding 3). Plan unknown to me.
3. **No real frame on the real globe.**
4. A **partly damaged picture** passes the hub and Chromium draws it without error (round-2 packet §1).
5. **Storage grows** by about 1.5 MB a day until a cleanup is designed.
6. iPhone / Safari / VoiceOver.
7. `terminator-ui` is intermittent on **main** as well (§4). Cause not found.

## 4. Regression and fingerprints

Full run 03:18:19–03:43:33 UTC, 13 Nov, on the final files: 59 suite files, 4 skipped as always, **54 passed, 1 failed**. The eight files below were byte-identical before and after the run (`sha256sum -c`).

**The one failure: `terminator-ui`, "rendered shading matches the computed day/night across the visible disc"** (round 1 it was the date-line check; round 2 it passed). This time I measured it instead of rerunning it until it passed:

| Files served | Runs | Failed |
|---|---|---|
| branch `dustrgb-rc` (round-3 files) | 20 | 8 |
| **main `cf8119c`** (no Dust code at all) | 22 | 7 |

Every failure captured was the same shape: 103 probes agree, 1 disagrees, a sunlit probe at 30°S, 20°E or 30°E whose brightness changed between the two screenshots (e.g. `{"lat":-30,"lng":20,"lit":true,"base":222,"drop":51}`). **It fails at about the same rate on main, so it is not caused by this candidate**; the Dust layer is off in that suite and makes no request. I have not found the cause. The suite takes its two screenshots a fixed 600 ms apart on a software renderer; that is where I would look. It passed 3 of 3 on 12 Nov and fails about 1 in 3 today on the same main files, which I cannot explain. It should be its own item; nothing was changed in that suite.

| File | Bytes | SHA-256 |
|---|---|---|
| `phase1/worker.js` (0.6.11) | 316,927 | `119cc641ccbe700e77d6a84ded00424bd2e7a52f81a59eedb5c102132131801f` |
| `dustrgb.js` | 15,063 | `6dbed9e52433d44a2c0cc9a5922c9d4db3b3201f098fbbe13ee28595ace49ff9` |
| `index.html` (unchanged since round 1) | | `da296ca23eba191f991cd97fc347c489fabe08989a5e410eba55daa60b0668d9` |
| `sources.html` (unchanged since round 2) | | `8ab333d9044dfeff96721befe3f269bf0524e3d55d89dd611de80aa799c79fd2` |
| `style.css` (unchanged) | | `4b1e2e184d929ece0b9c49d7c6682a504bdbba4eda7f12c3dc54a80dc7254aa7` |
| `timeline.html` (unchanged) | | `0ab9f666f4cc3a3e0e4daf6f58603b7f63f0c81f0d6ece8f53b9b82d8b8c7df6` |
| `phase1/dustrgb-hub.test.mjs` | | `43ca55fcce769b3cb2e074864da74f28cc868354f6dd5f5d8eeb3ba6964072bb` |
| `phase1/dustrgb-ui.test.cjs` | | `5143d3b78e9b01baf065920e659aca3a3bb9d16163ab588a0dc343091494bc5d` |
