# Review packet r2: `animals-zebra-preview-rc` (private zebra journey preview, Z3866)

Written 19 Nov 2026 07:47 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent.** Hub untouched (0.6.19).

Answers GPT's review of candidate `9e64d19` (relayed by Chad, 19 Nov; verdict: on hold, two confirmed issues, three unfinished checks). The first packet, `reviews/2026-11-19-animals-zebra-preview-rc.md`, still describes the build; this one lists only what changed and what is still open.

## 1. What to review
- Code commit: `67db011cb38ebf0e86b6a65168f3b38c049d9670`. The branch head is the later commit that adds this packet and changes no other file.
- **A complete tree at the branch head is on the Mac** (see the GPT block), every tracked file, taken from GitHub's archive of that commit. It replaces the 20-file snapshot.
- Page, data and test files that differ from main (sha256 at the code commit):

| File | Since 9e64d19 | sha256 |
|---|---|---|
| `STATUS.md` | as in 9e64d19 | `adaf84e4934a4e731caec69158299d4d1ccdbd2acb1eae819d62c068e62dd761` |
| `animals-journey.js` | **changed in r2** | `ded77a59ef81c36324ed84c69607a93b0ba8e53e0e608939d188c7edbe38d663` |
| `animals.html` | as in 9e64d19 | `b8d297b79d1055b0c5e3b786770a8255c314f76b063f9a249ba026d06e8d3f15` |
| `animals.js` | **changed in r2** | `3afa4a8ab5c53fecd26104644e84c26a549cb2c96ad9b3d1de687ab2b3d09680` |
| `assets/animals/zebra-botswana-R1.manifest.json` | **changed in r2** | `f337cdd078f7210db25aa55788d5b7a6f6007840f3f62ceb17320bc4125373d0` |
| `assets/animals/zebra-botswana-Z3866-R1.json` | as in 9e64d19 | `8d00aa32dc728dee09f7136835b5b1d32e3cc19469250ad29bf73506a1141bb6` |
| `index.html` | as in 9e64d19 | `03071b6144593e3812a4b4df49ed25f37e6fb1595c6d511e99b965353f80c29d` |
| `layers.js` | as in 9e64d19 | `8e4f462895fd540e0e2c3d5c3ea70f3ea56709baad1c86a3dc6d1db8d5f2a33b` |
| `moon.html` | as in 9e64d19 | `9961e5a45e2c325df2aa2b86719663aeb17a626b601fcab0fc158fe15bc002fb` |
| `phase1/animals-journey-ui.test.cjs` | **changed in r2** | `459e611ba6727a1b93940264fade313ce933c6b7f7ec1d77071791a3f463a71d` |
| `phase1/animals/build_journey.py` | as in 9e64d19 | `76995b6e861b895607a77fd7105cb79e6fa708ea2d5a5370544331de9246ed24` |
| `phase1/animals/build_journey.test.py` | as in 9e64d19 | `390bbac13e102984fda4dd120e98af755239a464f29b857f38a15e2acb65aea0` |
| `phase1/animals/zebra-botswana.json` | as in 9e64d19 | `d8ff3cf683b1249f2321869d96452931603a1f21975d653ef7c3e2c32cf2129a` |
| `phase1/bare-earth-ui.test.cjs` | as in 9e64d19 | `27beb7e2d8b482a833d6b1dd37029e9523a947813c77a0723ba22ef62b7dd1b0` |
| `phase1/desktop-overflow.test.cjs` | as in 9e64d19 | `c0545e555a42bdd983d8815de7fb204c0e5454ea4e2f3ce8bc2c1fe287f76f5b` |
| `phase1/timeline-ui.test.cjs` | as in 9e64d19 | `d5391fdb0b42938fbb587cbf9117f9c0f4d814bffc2bf2dd5d502c323ef5f77c` |
| `sources.html` | as in 9e64d19 | `872bcae3204116ce659f551867b1936619dd0a2b9eeef612d224004ca3a09978` |
| `style.css` | as in 9e64d19 | `185cfaa081a6ac5538b0e46e8b3d02e6e041972f60ca0923cd4071c1f3841b2d` |
| `sun.html` | as in 9e64d19 | `437a5fb825f67e5c6cdf1e076b5b04f96041cf72c94b482c999be67b6b145dfa` |
| `timeline.html` | as in 9e64d19 | `ef2364041c9d0853bb9b8a3191a10e60bfad99687701cdd115a269cfc3481168` |

## 2. GPT's points, one by one
1. **J4, age lost its seconds at an hour or more: fixed.** Every unit below the largest is now printed: `1 h 1 min 1 s`, `3 h 0 min 1 s`, `1 d 0 h 0 min 0 s`. GPT's case (fix 63, 27 Oct 2007 23:00:18; replay 28 Oct 2007 00:01:19) now reads "…, 1 h 1 min 1 s earlier". The gap sentence uses the same wording ("No fix was recorded for 3 h 0 min 1 s after it").
   - Test 2c now compares the **whole bar string** with one built in the suite by separate code, for ten real cases: 59 s, exactly 1 min, GPT's case across midnight, one second before a fix, exactly 1 h and 1 h 0 min 1 s inside the record's longest gap (2 h 0 min 25 s), and others.
   - Day lengths do not occur in this animal's record (longest gap 7,225 s), so 12e uses a made-up file: 23 h 59 min 59 s, exactly 1 d, 1 d 1 h 1 min 1 s, and one second before the next fix after a 2 d 1 h 5 min 3 s gap.
   - Break `age-drops-seconds` (the old wording) is caught by GPT's case.
2. **Off did not abort the request: fixed.** The request's AbortController is kept; off, leaving the page and a newer load abort it. The generation check stays and separately refuses an answer that still arrives.
   - 9b, 9b3: off while the display file, and while the manifest, is on its way: the browser reports the request failed with `net::ERR_ABORTED` before the server answers; with the manifest aborted the display file is never requested.
   - 9b5: on, off, on: the first request aborted, one set of objects.
   - 9e: late-answer refusal tested apart from abort: the page's fetch is replaced by one that ignores the stop signal, the file really arrives after off (counted), nothing is drawn.
   - Breaks: `off-no-abort` caught by 9b; `off-no-cancel` (generation check removed, abort left in) caught by 9e.
3. **J8f, navigation and Back.** Added `pagehide` (switch off) and `pageshow` with `persisted` (switch off), so a page the browser keeps for Back comes back bare.
   - 18a, 18b: real navigation by clicking the Animals tab, then Back, with the journey playing and with it loading; then forward and Back again; then the switch used again. All bare.
   - **The headless Chromium here did not keep the page for Back** (it reloaded it; the browser's stated reasons: `BrowsingInstanceNotSwapped`, `BackForwardCacheDisabledForDelegate`), even launched without the flag that disables the back/forward cache. So 18a and 18b prove the fresh-load path only.
   - 18c–18f send the page-keeping events themselves (`pagehide` persisted; `pageshow` persisted without a `pagehide`; an ordinary `pageshow`; `pagehide` while loading, where the request is aborted). Breaks `no-pagehide-reset` and `no-pageshow-reset` are caught.
   - **Still unverified: a real back/forward-cache restoration in desktop Chrome.** It needs Chad's Chrome on a served copy of the tree (same sitting as J12).
4. **Complete candidate tree: supplied** (section 1). Nothing from main is substituted.
5. **J2, source reproduction: done.** 19 Nov 07:18 UTC the source file was fetched again from the Movebank Data Repository (bitstream `9672ab98-93db-4943-bbb0-ef1a9435545d`): 15,651,785 bytes, sha256 `c91054627d7d60d50cd9cb59b3d52609df5d17e6985d147742bcf9a6da488824`, **equal to the pin**. The real generator was run on it.
   - **Display file: byte-identical** to the committed one, all 13,045 fixes (440,782 bytes, sha256 `8d00aa32dc728dee09f7136835b5b1d32e3cc19469250ad29bf73506a1141bb6`).
   - **Manifest: one field differs, `built_from`** ("full source file" instead of "pinned single-animal extract"). That is provenance, not data: every count, time, box and the display file's hash are the same.
   - The committed manifest is now the full-source build (3,213 bytes, sha256 `f337cdd078f7210db25aa55788d5b7a6f6007840f3f62ceb17320bc4125373d0`; was `780f2ec4…398a`), and both page scripts pin the new hash. `build_journey.py --check` against the source file reports both files "same".
   - The working copy of the source file was deleted afterwards. It is not in the repo or on the Mac.
   - **J12, performance: still not measured.** The protocol needs foreground desktop Chrome on the candidate with the Stage 0 harness; the candidate is not deployed, so it has to be served from the Mac tree. That needs Chad for one command and Chrome in front.

## 3. Also added
- **J8d, other layers left alone** (19a–19c): with aircraft counts drawn and in the Key and night shading on, journey on-and-playing and then off leaves every other switch, Key entry, the aircraft drawing, the open Key and the imagery label as they were; the Key count goes up by one and back. **Not covered:** an open inspector and search state.
- Not added: Previous/Next fix buttons for touch (GPT's suggestion). Say if they are wanted in the preview.

## 4. Tests
- `phase1/animals-journey-ui.test.cjs`: **274 passed, 0 failed.** 30 breaks, each tied to its check: **30 of 30 caught.**
- `phase1/animals/build_journey.test.py`: **22 passed**; its 3 breaks fail.
- Rerun on this code: `key-drawn-ui` 70 of 70, `bare-earth-ui` 190 of 190, `layer-switches-ui` 68 of 68, `timeline-ui` passes. The other older suites were last run on `01a4690` (first packet, section 4); since then only `animals-journey.js`, `animals.js`, the manifest and the new suite changed.

## 5. Still open
- J12 performance, both widths (needs Chad's Chrome).
- Real back/forward-cache restoration in desktop Chrome.
- Header changes for five tabs verified here in headless Chromium only (first packet, section 3); real phone and screen reader not tested.
- Sources page and REGISTER not updated; proposal §9 undecided.
