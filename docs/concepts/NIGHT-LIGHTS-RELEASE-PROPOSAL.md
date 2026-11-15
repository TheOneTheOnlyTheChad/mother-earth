# Night lights — release proposal for GPT review (rev 1)

15 Nov 2026 · docs only · nothing built beyond the reviewed preview · no merge, REGISTER filing, hub change or page release is approved
**For:** GPT's review, then Chad's decisions (§7). Written on Chad's "GO" of 15 Nov, after GPT passed round 2 of the preview.
**Candidate:** branch `night-lights-rc`, code `e2d419b`; packet `reviews/2026-11-15-night-lights-rc.md` rev 2 (on the branch).
**Main:** `e5f4f2d` (page merge `131862c`, hub 0.6.15).

## 1. What a release would put on the public page

The reviewed preview, plus the items in §4. In short: an optional layer, off on load, that replaces the true-colour picture with NASA's NOAA-20 night-light picture for the newest UTC date whose displayed frame passes the 1% rule; and a two-night comparison for one box with three pixel states and three shares. Light measured, never power.

## 2. NASA's terms: what is on record, and what is not

- **GIBS is already cleared.** REGISTER, "NASA GIBS — WMS imagery", read 30 Oct 2026: NASA's full and open data policy through LANCE; the one acknowledgment sentence, already in the page footer, covers "data and/or imagery"; the "as is" disclaimer and the local-scale line. Status cleared; commercial use yes. The night-light and clear-sky pictures come from the same service under the same terms. A release adds two layer lines to that entry (§4.4); it does not need a new permission.
- **The email Chad pasted on 15 Nov is the NASA Ozone Watch reply**, from Leslie R. Lait at Goddard, already recorded on 10 Nov (`docs/research/ENQUIRIES-2026-11.md` rev 8) and filed in REGISTER on Chad's Approve line that day. It answers for Ozone Watch's two daily ozone files on Ozone Watch's own server ("sip", not "chugalug"). **It is a different NASA service and is not used here as evidence for GIBS.** Nothing in it conflicts with this release.
- **No enquiry was sent to GIBS, and none is proposed.** The terms are published and already on record.

## 3. New readings since the packet (pane, 15 Nov 2026 18:10 UTC)

| Question | Reading |
|---|---|
| Does GIBS swap in another date when the one asked for is not held? | **No, for this layer.** The WMS capabilities give `nearestValue="0"` for `VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance`. Dates outside its range (16 Nov 2026, 20 Nov 2026, 1 Jun 2027, 24 Mar 2024, 1 Jan 2020) each returned the same 302-byte picture with nothing in it; 12, 13, 14 and 15 Nov each returned a different picture. The clear-sky layer behaved the same for 20 Nov 2026 and for two dates in its 2023 gap. |
| So what does the page do with a date GIBS does not hold? | The whole frame is "No data". For the layer that date fails the rule and is "still arriving"; in the comparison every pixel is "No data". No other night can be shown under the wrong date. |
| Axis order | The WMS 1.3.0 capabilities give the layer's EPSG:4326 box as `minx="-90" miny="-180" maxx="90" maxy="180"`: latitude first, as the page sends it. |
| Time range in the capabilities | `2024-03-25/2026-11-15/P1D`, default `2026-11-15`. The capabilities file is 2.57 MB, so the page does not read it. |
| Limits | The GIBS "Access Basics" page (the link GPT gave; read through a summarising fetch, not in full) states no rate limit, bulk rule or contact for heavy use. Other GIBS pages were not read. |
| Response headers | `access-control-allow-origin: *`; `cache-control: no-store`. Nothing in the headers names the date served. |

## 4. Release work (a round 3 on the same branch; page only)

1. **Sources & Details.** A "Night lights" section on `sources.html` (what is measured, the two layers, the date rule, the three states, the threshold label, the caveats, the credit), and the card's link pointed at it.
2. **The status report and the imagery rows** (`app.js`) say which picture is on the globe. Today they describe the true-colour picture even while Night lights is on.
3. **The 5° and 10° boxes** say that they are drawn coarser than the layer's own detail.
4. **REGISTER** (docs; its own Approve line): two layer lines under the NASA GIBS entry, with the readings from the test record, the packet and §3, and the same terms and commercial standing as the entry.
5. **Sky zoom-out view with the layer on:** checked, with a suite check. If the view cannot name the night-light picture correctly, the layer is switched off on entering the view and restored on leaving, as the other layers are hidden there.
6. **Served-hash checks** cover the new page file `nightlights.js`: fifteen page files.
7. **Suites:** new checks for 1–3 and 5, each with a break; the full existing set rerun on the release head, including `oceanheat-ui` if its snapshot folder is available.
8. **Cache keys:** `app.js`, `nightlights.js`, `style.css` as changed, in both `index.html` and `sources.html`.

Not in this release: any hub change (unless §7 RL1 chooses it), the gap-filled layer, NOAA-21, radiance totals, a difference picture, an event exhibit, the LAADS files.

## 5. Cost and load, as measured

| | Per use |
|---|---|
| Layer switched on | NASA's key 34 KB; one or two 512 × 256 frames (58 KB for the one whose size was recorded, 21 June 2026; the live probes' sizes were not recorded); one 2048 × 1024 frame, 0.89–0.92 MB. About 5 to 6 s in the pane. |
| When a probe passes and its full frame fails | One more full frame, about 0.9 MB, discarded. Seen only in tests. |
| One comparison at 0.5° | Both keys (51 KB, once) and four pictures, 12 KB in all; 0.8 s. |
| Fresh load with the layer off | Nothing. |

No new line item. All requests go from the reader's browser to NASA GIBS, as the backdrop request does today. Nothing is stored and no schedule is added.

## 6. Release sequence, each step on its own line from Chad

1. `Go:` build round 3 on `night-lights-rc` per §4 (branch only).
2. GPT's review of round 3, and Chad's own look at the preview.
3. `Approve:` file the two GIBS layer lines in REGISTER.
4. `Approve:` merge `night-lights-rc` at the reviewed head to main (page change: Night lights layer and comparison).
5. After the merge: served hashes for fifteen page files, then a live text smoke of the layer and one comparison.
Rollback: revert the merge. No hub, R2 or D1 change to undo.

## 7. Decisions (Chad's; GPT's view asked on each)

- **RL1. Route.**
  - **(a) As reviewed: the reader's browser asks GIBS and applies the date rule itself.** Nothing is manual: the rule runs every time the layer is switched on. No hub change, no deploy.
  - **(b) The hub applies the date rule on its schedule and publishes the pinned date;** the page reads the date from the hub and asks GIBS only for the full frame. This needs a PNG reader in the Worker, a schedule entry, a new envelope, tests, and a hub deploy by Chad's paste. It saves each reader the probe requests (one or two small frames; one recorded at 58 KB) and lets the health checks watch it.
  - **Recommended: (a) for this release.** It is the route that was reviewed and seen working from the site's own address. It departs from hub-first, on the backdrop's precedent, and Chad's "we have cloudflare, no manual jobs" is met in the sense that nothing is done by hand. If Chad meant the hub should own the date, (b) is a follow-on with its own proposal, or this release waits for it. Chad decides.
- **RL2. A real phone and Safari before the merge, or after** as for the earlier releases (Chad deferred those: "site first"). Recommended: after, recorded as untested.
- **RL3. Chad's own look** at the preview before round 3 is built, or with round 3. Recommended: with round 3, so he sees what would be released.
- **RL4. The comparison ships with the layer, or the layer ships first.** Both are reviewed. Recommended: together.
