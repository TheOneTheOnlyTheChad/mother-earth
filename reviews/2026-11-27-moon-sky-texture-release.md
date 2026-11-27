# Moon item 10a released: the Moon's picture on the Sky zoom-out Moon

27 Nov 2026 · Claude · release record · **page only; no hub deployment** · item 10a **closed**.

**Chad's line:** "Approve: release the Sky zoom-out Moon picture from `moon-sky-texture-ui` at `1280c0d` to main, page only; no hub deployment."
**GPT:** release review PASS (`reviews/2026-11-27-moon-sky-texture-release-rc-gpt-review.md`, filed unchanged, sha256 `617e53ec…36b5`).

## Release

- **Before:** main `018102c`, unchanged since the thread began, rechecked on GitHub before the push. It was an ancestor of `1280c0d`, so the release was a fast-forward.
- **Push:** main `018102c..1280c0d`, at 09:31:52 UTC (clock reading just after the push). It includes the docs branch's commits (`45cc94d`, contained), so the proposal, its evidence and GPT's proposal review are on main.
- **Tested tree:** `4c8aecd`. `1280c0d` adds only records: `HANDOVER.md`, `STATUS.md`, `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` and `reviews/2026-11-27-moon-sky-texture-release-rc.md`.

## Served verification (09:33:15 UTC, browser pane, `cache: 'no-store'`)

- **Result: 51 of 51 match, 0 differ.**
- **Method:** every path was fetched from `https://theonetheonlythechad.github.io/mother-earth/` and compared on status, byte length and sha256.
- **The expected list was built directly from the reviewed manifest file**, `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json`, sha256 `15e96c52…de8a`. Its sha256 was checked equal at `1280c0d` before use. It was not built from the helper's `--pane` output, which embeds a list computed from the tree (GPT's note 3).

## Live check (09:33 UTC, browser pane, live hub; one bounded run)

- **Before entry:** `index.html` loads `moonlight.js?v=202612071100` and `skyscene.js?v=202612271000`. Neither the map nor the table had been requested.
- **On "Zoom out to the Moon and Sun":**
  - the view opened and framed;
  - the map and the table were requested once each;
  - the picture was placed: status `ok`, emissive map on, emissive white, orientation date 2026-11-27 (the scene date), object URL released;
  - inputs were ready in 236 ms and the upload took 15.2 ms (this machine's browser pane: measurements of one run, not performance claims).
- **Stop B:** the Moon's projected radius is 2.81 CSS px. The "How this is drawn" paragraph reads as reviewed (source, appearance only, evenly lit, approximate calculated orientation, a few pixels across).
- **Back:** the view closed; the material is grey again (`0x9a9a9a`, no map); no texture, ready data or URL is kept; status `idle`.
- **Not checked live:** the failure paths (covered by the suite), phone, Safari, screen reader and a hardware renderer.

## Recorded exception (carried from the release candidate)

`smoke-fixes` stops at its harness wait (line 109) with the same 11 FAIL lines on unchanged main `018102c` and on the candidate. It is an **unresolved baseline exception**, not a passing suite. The cause is not established; a time-of-day dependence of its fire fixture is a hypothesis only.

## Close-out

- **Checklist:** rev 22 — 10a closed.
- **Records:** STATUS and HANDOVER updated.
- **Branches:** `moon-sky-texture-ui` and `moon-sky-texture-docs` deleted after verification (fully contained in main).
- **Mac review copies:** moved to `_to_delete/`.
- **Remaining Moon items, one at a time:** 5 CRaTER, 6 LEND, 7 LAMP, 8 Mini-RF; 9 only inside an item it serves; 12a–c options for Chad to classify; 11 carried. Sun/Parker waits for the Moon close-out.
