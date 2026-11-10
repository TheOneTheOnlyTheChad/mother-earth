# timeline-revs-rc — versioned Timeline catalogue route (candidate, branch only)

## Rev 2 (10 Nov 2026) — routing fix after GPT's review of `c98cb24`
**GPT:** core design passed; all ten manifest hashes matched; GPT's own fixture (R2 current) confirmed legacy = R1, each versioned route its own bytes and ETag, swapped object → 503 integrity, unknown ids → 404 no-store with zero reads, and the page requests its own revision with the hash check and fallback intact. **One fix before deploy:** the shared path parser drops empty segments, so `/catalogue/timeline//` and `/catalogue/timeline//tl-2026-11-R1` returned 200 and read R2, which breaks the "malformed → 404 without a read" promise. Keep the single trailing slash `/catalogue/timeline/` as the R1 alias (0.6.3 behaviour).
**Applied (`1d31df6`, worker + hub test only; page files and catalogue unchanged):**
- `timelineRoute` now matches the raw `url.pathname`, not the parsed segments:
  - exactly `/catalogue/timeline` or `/catalogue/timeline/` → R1;
  - exactly `/catalogue/timeline/<one non-empty segment>` → that pin;
  - anything else → 404 `unknown revision`, no-store, no R2 read.
- Tests (hub 66/66, was 57):
  - 8 loose-separator paths → 404 with zero reads: `/catalogue/timeline//`, `//tl-2026-11-R1`, `/tl-2026-11-R1/`, `///`, a leading `//catalogue/timeline`, `/catalogue//timeline`, `/catalogue//timeline/tl-2026-11-R1` and `/tl-2026-11-R1//`;
  - the single trailing slash → R1 with exactly one read.
  - **New break `loose-separators`** (routes on the parsed segments again) → 8 fail.
- **Full regression on `1d31df6` (tree clean):** everything passes (hub 66, axis 96, timeline-ui 585, orbital-browser 113, the rest as rev 1); **16 breaks each fail** (hub: no-hash 2, serve-on-missing 2, no-validate 1, legacy-follows-current 1, serve-unknown-as-current 24, no-per-revision-hash 2, loose-separators 8; axis: as rev 1 incl. fetch-unversioned 2; timeline-ui axis-79 2).
- **Replacement hash:** `phase1/worker.js` (0.6.4) **`7d46edf36e6f8c8d03293ad862e4d8b8b49fa48e72ca4aa5cf29f7945c0a7987`**, 279,110 B. All page files and the catalogue are byte-identical to rev 1 (§3).
- Test sources are now in the Mac review copy (`phase1/timeline-catalogue-hub.test.mjs` `0e407bd8…`, `timeline-axis.test.cjs` `dbc93fde…`, `timeline-ui.test.cjs` `ac7f0e42…`).
- **Deploy line becomes:** `Approve: deploy hub 0.6.4 from 1d31df6 (content only)`.

**Rev 1 record below (its §3 worker hash and §4 deploy commit are superseded by rev 2).**


**Built 10 Nov 2026 on Chad's line:** "Approve: build timeline-revs-rc on a branch only — hub 0.6.4 versioned catalogue route + page fetches its own revision, per TIMELINE-CATALOGUE-REVISIONS-PROPOSAL rev 1.1; no merge, R2 write, hub deploy or page change."
**Not done (each needs its own Approve line):** hub deploy, merge to main / page release. **No R2 write is needed:** the catalogue file is unchanged. Main and production are unchanged (hub 0.6.3, page `57d07c2`).
**Candidate:** branch `timeline-revs-rc` @ `4310d54` (code `25cf2eb` + a test-only expected-URL fix).

## 1. What changed (8 files, +136 −32)
**Hub `phase1/worker.js` → 0.6.4**
- `TIMELINE_REVISIONS`: a frozen table of frozen pins (key, revision, fileSha256, bytes). One entry today, `tl-2026-11-R1`, with the same values as 0.6.3.
- `TIMELINE_LEGACY = 'tl-2026-11-R1'`: the unversioned `/catalogue/timeline` serves this permanently, never "current".
- `TIMELINE_CURRENT = 'tl-2026-11-R1'`: discovery metadata only; no route reads it.
- `TIMELINE` is kept as the legacy pin (the 0.6.3 name).
- `timelinePin(rev)` is an own-property exact-key lookup, so `__proto__`, `toString` and the like resolve to null.
- `timelineRoute(env, parts)`:
  - two segments → legacy pin;
  - three segments → decode the id → pin, or **404 `{status:'unknown revision'}`, no-store, no R2 read**;
  - more segments → 404.
  - `timelineCatalogue` is unchanged: whole-file sha256 against the requested pin, `catalogue_revision` = the pin's revision, else **503** missing / unreadable / integrity / invalid.
- Root `/`:
  - `catalogues.timeline` = `{ path: '/catalogue/timeline', kind, revision: 'tl-2026-11-R1' (= the legacy response), current, versioned_path: '/catalogue/timeline/<revision>', revisions: [...] }`;
  - `/catalogue/timeline/<revision>` is added to `endpoints`.
- Header comment and immutability rule in the code.

**Page**
- `timeline.js` fetches `HUB + '/catalogue/timeline/' + encodeURIComponent(wrap.dataset.catalogueRev || '')`.
- Asset `?v=` / BUILD `202611211000` → `202611221000` (index, sources, timeline.html, timeline.js); `timeline.html` regenerated (`data-build`).
- The catalogue file and its pin are byte-identical to the live release.

## 2. Tests (container, local server; hub and third-party hosts fulfilled or blocked)
**`timeline-catalogue-hub` 57/57** (was 27); additions:
- Real table: one revision; legacy = current = R1; pins frozen; `/catalogue/timeline/tl-2026-11-R1` serves exact bytes with the same headers; a trailing slash = legacy; known revision with the object missing → 503 (not 404).
- **16 unknown/malformed ids → 404, no-store, zero R2 reads:**
  - wrong id or case;
  - encoded slash;
  - `..%2F..`;
  - encoded `../ref/…json`;
  - a bad percent-escape;
  - `%20`;
  - `__proto__`, `constructor`, `toString`, `hasOwnProperty`;
  - 600 chars;
  - an extra segment;
  - `.json` suffix;
  - an encoded object key.
- `%2E%2E` as a whole segment is normalised away by the URL parser before routing (lands on the hub index; no revision lookup, no R2 read).
- **Fixture (the original bug): a second worker copy with R1 + a fixture R2, R2 marked current:**
  - the legacy URL still returns R1's exact bytes;
  - `/…/tl-2026-11-R1` → R1 exact;
  - `/…/<R2>` → R2 exact with its own ETag;
  - unknown → 404 with no read;
  - root `path`/`revision` = R1 while `current` = R2 and both are listed;
  - R2's key holding R1's bytes → 503 integrity.

**`timeline-axis` 96/96** (was 93): new §F — the real page makes exactly one catalogue request, to `/catalogue/timeline/tl-2026-11-R1`, and draws; a page built for another revision requests that revision.

**`timeline-ui` 585/585:** its request allowlist now expects the versioned URL (the two failures on `25cf2eb` were that expectation; fixed in `4310d54`).

**Full regression on `25cf2eb` (tree clean):**
- every other suite passes: arts-hub 54, health 29, history 27, firms-guard 19, firms-v2 57 (+7 skipped), kp 29, drifters 12, orbital-hub 13, plastic 11, satellites 12, search 111, search.realdata 50, ships 7 + 7, solar 26, place-rows 7, duration ok, arts-ui 90, backdrop 27, desktop-overflow 112, drifters-ui 25, kept-ui 21, mobile-pass 131, place-ui 30, plastic-ui 29, search-ui 104, smoke-fixes 52, ux-round1 34, terminator 47 + 19, orbital-ui 38;
- orbital-browser 113 (rerun with its own arguments).

**Breaks (each fails its suite):**
| Suite | Break | Checks failed |
|---|---|---|
| hub | no-hash | 2 |
| hub | serve-on-missing | 2 |
| hub | no-validate | 1 |
| hub | **legacy-follows-current** | 1 (the fixture legacy check) |
| hub | **serve-unknown-as-current** | 16 |
| hub | **no-per-revision-hash** | 2 |
| axis | no-hash-check | 2 |
| axis | no-build-check | 1 |
| axis | no-validate | 8 |
| axis | focusable-empties | 4 |
| axis | no-timeout | 1 |
| axis | no-guard | 3 |
| axis | hover-only-periods | 6 |
| axis | **fetch-unversioned** | 2 |
| timeline-ui | axis-79 | 2 |

## 3. Hashes (candidate `4310d54`)
| File | sha256 | bytes |
|---|---|---|
| index.html | `fc8f1fa209d8e49384649dd753c4d3b7a039ced9af340ffc1d976cd26113214d` | 110,786 |
| sources.html | `c63f89041d74b51c6b0c8f0b1f6ce55700086f6adc8ff75f0f07620bcf72be27` | 43,647 |
| timeline.html | `d7c37d5f30574c98190650272b249e482f59a1202493b9edc5a8d65c47ebf3d5` | 25,460 |
| app.js (unchanged) | `e3f4a38541132b289663945f74612db80e12d35f906a0ecc778d7a39b8391680` | 81,781 |
| arts.js (unchanged) | `58773cef35e6e947960100cedd59c8bff349a16333a89f3c4ae7abda5595928d` | 5,759 |
| timeline.js | `ae87c6a1f2ef8b5a350ce98e21e2db817a1e9d060868e02fe7ef6638664eec7b` | 23,734 |
| style.css (unchanged) | `30bc06b371239660b9d046d51b351c668d7c6c8951ea6dc7cfc4123d42fa2f80` | 40,215 |
| phase1/worker.js (0.6.4) | `a4cd5c91181e391592bb34d3ebcfaa872e616c69c5aa5bd6568921e717b9eca0` | 278,637 |
| catalogue tl-2026-11-R1.json (unchanged, = R2 object) | `096ae648479b744f458cdf5d042667c6a6262114ee63252cf132c41f99050fbe` | 15,656 |

## 4. Next (each on its own Approve line)
1. GPT's review of this candidate.
2. `Approve: deploy hub 0.6.4 from 4310d54 (content only)`. No visible change: the live page keeps using the legacy URL, which stays R1. Pin the live 0.6.3 worker (`94a6b2b2…af93`) first.
3. Live RC from the Pages origin: **both** R1 routes (legacy and `/catalogue/timeline/tl-2026-11-R1`) return the exact R1 bytes with CORS; the branch page draws from the versioned URL.
4. `Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)`.
- **Rollback:** page first (revert → legacy URL for fresh loads). Tabs already on the new page keep their axis only while the hub serves the versioned route, so prefer staying on 0.6.4 and reverting only the page. Hub rollback to 0.6.3 is possible; those tabs then fall back to the list.
