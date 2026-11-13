# Dust RGB — hub smoke test on production (13 Nov 2026)

Chad: "Approve: deploy hub 0.6.11 from c667c07 (content only, DUSTRGB_ENABLED unset) and run /admin/run/dustrgb once". Done exactly that; nothing else. **Schedule not enabled (`DUSTRGB_ENABLED` does not exist). Page not merged. No REGISTER entry.** Times UTC; SAST = UTC + 2.

## 1. Deploy

| | |
|---|---|
| Before | 0.6.10, 293,617 B, `784939f814335f47d3d5e0d118c6dbc2d6b0f181157a39b55ce1d0c080b6a0da`; 19 bindings; no DUST variable |
| Source | `raw.githubusercontent.com/…/c667c07/phase1/worker.js`, 316,927 B, sha256 `119cc641ccbe700e77d6a84ded00424bd2e7a52f81a59eedb5c102132131801f` (checked in the tab before upload) |
| Upload | content-only PUT 03:58:57, HTTP 200, success; Cloudflare `modified_on` **03:59:00.638** |
| Read-back | 316,927 B, same sha256; bindings 19; no DUST variable |
| Hub | `/` reports 0.6.11; `/status` 200; `/snapshot/dustrgb/meta` → `frame: null` (and reading it created nothing) |
| Other collectors after the deploy (D1, 03:59–04:20) | co2, drifters, swpc (04:07 hourly), firms ×2, forest, usgs ×5: all `ok`. The 04:07 hourly job ran on 0.6.11 with Dust not scheduled. |

Rollback: 0.6.10 `784939f8…a0da`.

## 2. The one manual run

Fired 04:19:46.854 from a hub-origin pane tab. Reply after 18.6 s: HTTP 200 `{"job":"dustrgb","result":"dustrgb:ran","wall_ms":18466}` — not taken as evidence.

**Evidence:**

| | |
|---|---|
| D1 `collector_runs` id 9289 | `ok`, 200, records 1, bytes 738,310, 04:19:47.087 → 04:20:05.347, note "frame 2026-11-13T03:50:00Z as 20261113T0350Z-d0cb4223ccfa72f1; served-time header present (picture), present (mask)" |
| Pointer | frame id `20261113T0350Z-d0cb4223ccfa72f1`, requested 03:50:00Z, fetched 04:20:04.498Z, `previous: null`, `last_attempt: null`, checked "mask decoded in full; picture structure only (not decoded)" |
| Picture URL | 200, `image/jpeg`, `public, max-age=86400, immutable`, 672,431 B = pointer, sha256 `12c1406e…1a5e` = pointer, decodes 2048 × 2048 in the browser |
| Mask URL | 200, `image/png`, 65,879 B = pointer, sha256 `cf7891da…1a1d` = pointer, decodes 160 × 160; hub's own decode: 22,273 opaque, 3,327 transparent, 0 partial |
| Time-only address `/snapshot/dustrgb/20261113T0350Z/picture.jpg` | 404 |

The advertised frame was 30 minutes old when fetched.

## 3. Something we did not expect: the served-time header reached the Worker

`warning_header_present: true` on both files, and the pointer records `served_time: 2026-11-13T03:50:00Z`, source "server Warning header", equal to the requested time. GPT's Playground probes on 12 Nov found that header absent in all four modes; the production Worker's request (with the hub's User-Agent and `cf: { cacheTtl: 0 }`) received it. One run only — I do not know whether it will always arrive.

Consequence on the page, as designed in rev 5: when the hub has a served time the label reads **"Frame: 13 Nov, 03:50 UTC (31 min ago)"**, not "Frame requested". That is what the candidate showed against the live hub. Whether "Frame:" is the label we want now that the header has been seen once is a decision for Chad and GPT; nothing was changed.

## 4. CPU and plan

- Plan read from the account's subscriptions: **Workers Paid** ($5 monthly, state Paid); also R2 Paid.
- Cloudflare analytics (`workersInvocationsAdaptive`, per minute): minute 04:19 holds the run (max wall time 18,469 ms, matching the job's 18,466). **Maximum CPU of any invocation in that minute: 41.3 ms.** The figure is a per-minute maximum over 17 requests, so it is an upper bound for the Dust run, not an exact reading. Limit on this plan: 30 s.
- For scale, the 04:07 hourly invocation without Dust: maximum CPU 66.6 ms, wall 32.3 s.
- Not yet seen: Dust inside the hourly job (first scheduled run after the variable is set).

## 5. The real frame on the globe

Candidate page files from `c667c07` (eight files, each sha-checked) loaded in a clean pane tab against the live hub; nothing written to the live site.

- Layer off: no Dust request. On: exactly pointer, picture, mask. State "current", one mesh.
- Seen by Claude in the pane: the frame sits on the Africa-facing side inside its footprint; with the layer made transparent and opaque in turn at the same camera position, the Sahara and Arabian peninsula (pale in the night-time Dust RGB) and the Red Sea fall where the backdrop has them. **That is my reading of two screenshots, not a measurement; Chad's eyes decide alignment, the 0.82 opacity and legibility (D5).** At 0.82 the backdrop's coastlines are largely hidden under the picture.

## 6. Still pending, each on its own line from Chad

1. Set `DUSTRGB_ENABLED=1` (Chad's click) → first scheduled run 06:07 or 18:07 UTC, then read D1, the pointer and the hourly invocation's CPU.
2. REGISTER entry for EUMETSAT.
3. Page merge to main.

Open: the label question in §3; the partly-damaged-picture limit; storage grows about 1.5 MB a day (no cleanup); `terminator-ui` intermittent on main.
