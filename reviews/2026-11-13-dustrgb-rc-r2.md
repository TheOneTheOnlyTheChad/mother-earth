# dustrgb-rc round 2 — fixes after GPT's review of `7e6f236`

**Branch only. Nothing merged, uploaded or deployed. No REGISTER entry filed. The 0.6.11 deploy is on hold** (Chad, 13 Nov). Live unchanged: hub 0.6.10 `784939f8…a0da`, page `12ff4ff`. Lockdown parked.

First packet: `reviews/2026-11-12-dustrgb-rc.md` (still accurate for everything not listed here). Times are UTC; SAST = UTC + 2.

## 1. GPT's findings and what changed

### Finding 1 (high) — frame URLs could change underneath readers

**Reproduced as described.** Keys and URLs named only the time, so the same time arriving with different bytes overwrote a file the pointer still referenced.

| Change | Detail |
|---|---|
| Pair id names the content | `id = <time>-<first 16 hex of SHA-256(picture sha : mask sha)>`, e.g. `20261112T1650Z-f6b0fdad21177596`. R2 keys and public URLs both use it. A different picture or mask for the same time is a different id, key and URL. |
| Never overwrite | Before writing, the job reads the key. Identical bytes already there → reused, no write. Different bytes there → the run fails "… stored copy differs" and leaves the file alone. |
| Older times skipped | If the advertised time is the same as **or older than** the held frame: no image request, nothing written, logged ok ("unchanged" / "not newer"). |
| Pointer writes are conditional | Every pointer write (publication and failure record) is read–change–write with R2 `put(..., { onlyIf: { etagMatches } })`; a refused write returns `null` and the job re-reads and decides again. A run that finds the same or a later time already published logs "superseded" and publishes nothing. The pointer is created empty first if absent, so there is always an etag to condition on. |
| Cleanup cannot race | Cleanup re-reads the pointer, keeps the pairs it names **now**, and deletes other files only once they are over 2 hours old. An overlapping run's fresh files are never deleted. The listing is read page by page. |
| Previous pair self-sufficient | `previous` now carries its box and times, so a page can draw it without the current frame. |

R2 behaviour relied on, read on Cloudflare's "Workers API reference" page (opened by Chad in the browser pane, 13 Nov): "In the event that a precondition specified in options fails, put() returns null, and the object will not be stored"; "R2 writes are strongly consistent". The page does not say how to condition on "object does not exist", which is why the empty pointer is created first. **This has been exercised against the suite's fake R2 only**, not real R2.

### Finding 2 (high) — a corrupt image could replace the good pair

Both of GPT's options are in, because neither alone closes it.

**Hub**
- **Mask: decoded in full before publication.** Every chunk checksum verified, image data inflated (zlib's checksum included), every row unfiltered, every pixel's alpha read. Then a footprint rule: at least one opaque pixel, opaque centre, all four corners clear. New failure reasons: "mask does not decode", "mask is not a footprint".
- **Picture: structure only — stated, not hidden.** A Worker has no image decoder and JPEG carries no checksum. The check now walks every segment and requires quantisation tables, a frame header with the right size, a scan header and the end marker (it previously stopped at the frame header). The pointer records `checked: "mask decoded in full; picture structure only (not decoded)"`.
- **Fixtures are real images.** `hub-picture.jpg` (real 2048 × 2048 JPEG, 69,487 B) and `hub-mask.png` (real 160 × 160 RGBA PNG, 15,076 B, written by the suite's own encoder using all five row filters). The page suite decodes both in Chromium. The old synthetic "success" picture is now a failure case and is rejected.

**Page**
- If the newest pair cannot be used on a first load (missing, wrong fingerprint, or not decodable) and the hub still names a previous pair under 24 h old, the page shows the **previous pair under its own time**, with "The latest frame could not be shown; this is the previous one." An unusable pair is not downloaded again.

**What remains open, plainly:** a picture whose structure is intact but whose compressed data is partly damaged passes the hub, and Chromium decodes it without error into a partly wrong image (checked: 6 KB of a real JPEG's scan overwritten → decoded, no error). Nothing in this candidate detects that. A picture whose scan is wholly ruined passes the hub and is refused by the browser → the fallback applies. The hub suite records the first case as a named "KNOWN LIMIT" check so it cannot be forgotten. Closing it would need a full JPEG decode in the Worker (CPU cost not measured) or a decoded-and-re-encoded source; not attempted here.

### Finding 3 (medium) — capabilities request unbounded; parser unscoped; batch waiting on Dust

- The frame-list request has a 30-second limit; a timeout is the failure "frame list request failed".
- `dustLatest()` reads only the dust layer's own element: from its `<Name>` to the next layer boundary. **Reproduced GPT's case** (dust layer with no time, sibling with one) → now `null`. A layer whose name merely starts with `rgb_dust` is not accepted. Attribute order no longer matters.
- Dust now runs **after** `hourlyBatch`, last in the hourly job. Nothing else waits on it.

### Page and packet notes

- Label is now **"Frame requested: 12 Nov, 18:00 UTC (5 h ago)"**.
- **Correction to the first packet:** it said the page re-reads the pointer every 30 minutes. The script's interval is, and was, **10 minutes** (`REFRESH_MS`). The script is unchanged; the packet was wrong.
- Sources text updated to say what is and is not checked, and that the previous pair can be shown.

## 2. Tests

### `phase1/dustrgb-hub.test.mjs` — 156 passed, 0 failed (was 101). Standard library only.

New groups:

| Group | What is checked |
|---|---|
| G | GPT's reproduction: A, B, then A again with different picture bytes and a failing mask write → no image request, nothing written, pointer byte-identical, **both pairs answer 200 with their original bytes**. Newer frame with mask write failing, and with picture write failing → both published pairs still readable. Same time with different bytes → different id; earlier orphan untouched. Different bytes already at the pair's key → fails, not overwritten. Identical bytes already there → reused. |
| H | Two overlapping runs for the same time → one publication, one "superseded". Slower run holding an older time cannot move the pointer back. Pointer changed between read and write → conditional write refused once, run re-reads and publishes on top. The other run's cleanup does not delete this run's fresh files. A failure record cannot overwrite a publication made in between. |
| E (added) | Frame list timing out; list request carries a 30 s limit; picture with no scan; header-only picture; mask with damaged data; mask with a bad chunk checksum; mask opaque everywhere; mask transparent everywhere. Every failing case now also asserts the retained pair is still readable. |
| helpers | Scoped parser (sibling-only, between siblings, look-alike name, attribute order, through the job). `pngAlpha` on RGBA, grey+alpha and palette masks, with and without row filters, and six refusals. `jpegCheck` on real files. |
| A (added) | Order: the hourly batch's record is written before the first EUMETSAT request. |
| KNOWN LIMIT | Picture with intact structure and ruined data is published; the good pair stays readable as `previous`. |

Breaks — all 23 fail: the 12 from round 1 (rewritten where the code moved) plus `time-keys refetch-older overwrite no-cas clean-young no-decode no-footprint jpeg-sof-only unscoped no-list-timeout dust-first`.

### `phase1/dustrgb-ui.test.cjs` — 63 passed, 0 failed (was 53)

New group N: newest picture has the right fingerprint but does not decode → previous pair shown under its own time, note shown, texture is the previous pair's; unusable pair not re-downloaded; a good newer frame replaces the fallback and the note goes; newest pair missing (404) or tampered → fallback; previous older than 24 h → not used, not fetched; both unusable → nothing drawn; the hub suite's two success fixtures decode in Chromium. Fixture ids now have the hub's real shape. All age labels updated to "(N h ago)".

Breaks — all 19 fail: the 14 from round 1 (three rewritten where the code moved) plus `no-fallback fallback-silent fallback-old refetch-bad old-wording`.

### Full regression

See §5.

## 3. Check against the real service (02:03 UTC / 04:03 SAST, 13 Nov, browser pane; not the Worker)

The hub's `dustLatest`, `jpegCheck`, `pngInfo` and `pngAlpha`, copied verbatim, on live responses at the hub's exact URLs. Nothing saved to disk.

| | Result |
|---|---|
| Capabilities | HTTP 200; **14 layers and 13 time dimensions in the document**; the scoped parser read the dust layer's own: `2026-11-13T01:40:00Z` |
| Picture | HTTP 200, `image/jpeg`, 668,903 B, 2048 × 2048, **progressive** (frame type C2), 2 quantisation tables, 2 Huffman tables, scan present, end marker present → accepted; 7.1 s |
| Mask | HTTP 200, 65,763 B, RGBA 8-bit; decoded by `pngAlpha` in 25 ms: 22,270 opaque, 3,330 transparent, 0 partial; centre opaque; four corners clear → accepted |
| Cross-check | The browser's own PNG decoder gives the same counts: 22,270 / 3,330 / 0 |

Overnight log in the same tab (background evidence): 79 rows from 16:54 UTC 12 Nov to 01:58 UTC 13 Nov; largest gap 7 minutes; no failed list or map request; 56 distinct latest frames; advertised frame 18–30 minutes old when read. Still running.

## 4. Still not shown

1. **No real hub run**, and the conditional pointer write has not touched real R2. Both are deploy-time checks.
2. **No real frame on the real globe** (alignment against coastlines, opacity, legibility over southern Africa).
3. The **partly damaged picture** limit in §1.
4. Mask decode cost in a Worker is not measured (25 ms in a desktop browser for the real mask). If the Worker's CPU allowance is tight this is the place to look.
5. iPhone / Safari / VoiceOver.
6. `terminator-ui` date-line failure from round 1: still unexplained; see §5 for whether it recurred.

## 5. Regression and fingerprints

Full run 02:21:52–02:48:18 UTC, 13 Nov, on the final files: 59 suite files, 4 skipped as always (live-network probes), **55 passed, 0 failed**. `terminator-ui` passed (19/19); its round-1 failure did not recur and is still unexplained. The eight files below were byte-identical before and after the run (`sha256sum -c`).

| File | Bytes | SHA-256 |
|---|---|---|
| `phase1/worker.js` (0.6.11) | 315,632 | `b0ccb0533ec76afe43a727a334372a4d249c458ba21b859f15cfcb075b6c030b` |
| `dustrgb.js` | 14,886 | `40f6aa2de3fe3dbaec604c480886ce276df6c101b49d909d8b982f5808b2e15c` |
| `index.html` (unchanged since round 1) | | `da296ca23eba191f991cd97fc347c489fabe08989a5e410eba55daa60b0668d9` |
| `sources.html` | | `8ab333d9044dfeff96721befe3f269bf0524e3d55d89dd611de80aa799c79fd2` |
| `style.css` (unchanged) | | `4b1e2e184d929ece0b9c49d7c6682a504bdbba4eda7f12c3dc54a80dc7254aa7` |
| `timeline.html` (unchanged) | | `0ab9f666f4cc3a3e0e4daf6f58603b7f63f0c81f0d6ece8f53b9b82d8b8c7df6` |
| `phase1/dustrgb-hub.test.mjs` | | `69a479b20158d691e8a8caf55503b0640251133033a453873257ae0d0c8abe2a` |
| `phase1/dustrgb-ui.test.cjs` | | `a1e3f6330ab55f3b0de83a742ef2f60862eee4413744770a8514edd1e7a7313e` |

The first packet's fingerprints for `worker.js`, `dustrgb.js` and `sources.html` are superseded by these.

## 6. What would follow, each on its own line from Chad (unchanged)

1. Deploy hub 0.6.11 (content only) and set `DUSTRGB_ENABLED=1`; then one manual run, a read of `/snapshot/dustrgb/meta`, and both file URLs.
2. REGISTER entry for EUMETSAT.
3. Merge the page to main.
