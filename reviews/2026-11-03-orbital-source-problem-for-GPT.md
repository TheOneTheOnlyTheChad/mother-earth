# Mother Earth — problem statement for GPT: where the hub gets orbital data (3 Nov 2026)

Live site: https://theonetheonlythechad.github.io/mother-earth/ · hub (Cloudflare Worker, Free plan): https://mother-earth.chadoberholzer.workers.dev · repo: github.com/TheOneTheOnlyTheChad/mother-earth (`phase1/worker.js`, hub 0.2.3)

## 1. The problem in one paragraph
The public **Satellites** toggle shows CelesTrak's "active" group (16,848 objects), propagated in the browser from one element file the hub fetches and stores. **The hub cannot refresh that file on schedule: all three scheduled CelesTrak fetches today failed with HTTP 522** (Cloudflare could not complete the connection to celestrak.org). The file now serving is from 04:12 UTC and goes stale ~06:12 UTC on 4 Nov. Separately, the planned **orbital layers** (active / inactive + rocket bodies / debris, replacing the Satellites toggle) need Space-Track GP data **plus** CelesTrak SATCAT operational status. Space-Track was proven reachable from the Worker this morning; CelesTrak is not reliably reachable. The question is how the hub should source orbital data so the public layer refreshes without depending on Chad's Mac or a browser being open.

## 2. Measured facts (3 Nov 2026, UTC)

**CelesTrak from the Worker**
| Time | What | Result |
|---|---|---|
| 04:12:13 | manual run (`/admin/run/satellites`) | stamp page 200 → data 200 → 16,848 rows, 2,490,850 B published |
| 05:08:10 | scheduled (odd hours, `:07` cron) | stamp page **522**, no data request |
| 07:08:01 | scheduled | stamp page **522** |
| 09:08:07 | scheduled | stamp page **522** |
- Policy kept: one attempt per slot, no retries. Failure path worked every time: last good file kept serving with its original times; meta sha = served sha.
- OpenSky also gave the Worker 522 (30 Oct). Cause of the 522s **not established**: CelesTrak refusing some Cloudflare egress, timing of the cron minute, or a transient — the one success was a manual run, the failures are all cron-fired.

**Space-Track from the Worker** (hub 0.2.3, one-shot admin probe, no schedule, nothing stored)
- 08:10:30: login rejected — the two secret values had been entered in each other's rows (operator error, fixed). No GP request made.
- **09:10:53: OK.** Login 200 (1.4 s, session cookie) → **one GP request**, Space-Track's documented query `class/gp/decay_date/null-val/epoch/>now-10/…/format/csv` → 200 in 3.1 s, `application/csv`, no Content-Length, **18,846,588 B, 32,512 objects**, full OMM field list incl. `OBJECT_TYPE` → logout 200. Wall 4.9 s. Worker CPU for this run not yet read.
- Earlier (pane, 06:13 and 07:13): page-script `fetch` got empty HTTP 200 bodies; an address-bar request worked (07:31). Explained now: browser-script quirk, not the account.

**Orbital counts (from the 07:31 Space-Track sample + CelesTrak SATCAT 1 Nov)**
32,517 objects: payload 18,954 · rocket body 2,205 · debris 10,124 · unknown 1,234. Payload status match against CelesTrak SATCAT 99.98 %. Classes: active 16,204 · inactive payloads 1,385 · rocket bodies 2,205 · debris 10,124 · counted-not-drawn 2,599 (unknown type, blank status, no match). Combined view benchmarked at the display's 60 Hz cap on the Mac with and without (one dataset, one machine).

## 3. Constraints (what the sources and the project require)
- **Space-Track (published):** GP at most once per hour, at a minute 10–20 either side of :00/:30; < 30 req/min, < 300/h; SATCAT once a day after 17:00 UTC; own account only; redistribution of basic SSA data accessed via Space-Track has a blanket approval **conditioned on citation**.
- **Space-Track SATCAT has no operational-status field.** Active vs inactive comes from **CelesTrak SATCAT** (`OPS_STATUS_CODE`) — i.e. the orbital layers still need CelesTrak, once a day.
- **CelesTrak (published):** ≤ one download per update, data checked ~every 2 h, stop on non-200. Nothing published on redistribution or commercial use (recorded as uncertain, not as a grant).
- **Project:** $0/month (Workers Free: 10 ms CPU soft limit, 128 MB memory); one current validated snapshot per feed, publish-then-delete, failures keep the last good set with original times; public features must not depend on the Mac or the browser pane; observed vs computed kept distinct; missing status never becomes "inactive"; every deploy and public change needs Chad's go.

## 4. Options we see
**A. Space-Track for elements via the hub (2-hour cadence), CelesTrak SATCAT for status once a day.** The orbital job as specced. Elements become reliable; the status map is the remaining CelesTrak dependency, but it changes slowly — if a daily SATCAT fetch fails, keep the last good status map with its date (and say so on the page) rather than reclassify anything.
  - Open: Worker CPU/memory for 18.8 MB per run (parse + classify + write). Could be cut by asking Space-Track for only the fields propagation and classification need (predicates), est. ~4–6 MB — not measured.
  - Open: where the daily SATCAT status comes from if the Worker keeps getting 522 from CelesTrak (Mac fetch-and-post once a day is acceptable for a slow-changing input? or the hub only?).
**B. Keep CelesTrak for today's Satellites toggle, fetched by the Mac and posted to the hub** (like ships). Fixes today's staleness quickly; violates "public features must not depend on the Mac" unless treated as a stop-gap.
**C. Keep watching CelesTrak cron slots** (or move the cron minute) and investigate the 522 first. Cheap; may never resolve; the layer goes stale meanwhile.
**D. Interim: re-source today's Satellites toggle from Space-Track** (filter to payloads + CelesTrak-active list) before the full orbital page ships. Still needs the status join.

## 5. Questions for you
1. Do you agree option A is the right shape, with today's Satellites toggle left as is (and allowed to go stale with its times shown) until the orbital view replaces it — or should staleness be fixed sooner (B or D)?
2. For the daily CelesTrak SATCAT status: is a Mac fetch-and-post acceptable for a once-a-day, slow-changing classification input, given the rule that public features must not depend on the Mac? If not, what would you do?
3. Is trimming the GP request to the needed fields the right first lever on Worker CPU/memory, before considering Workers Paid ($5/mo)? Anything else to measure before building?
4. Is there anything about the 522 pattern (cron-fired failures, one manual success) worth testing before we stop relying on CelesTrak from the Worker?
5. Reuse: with elements from Space-Track (blanket approval + citation) and status from CelesTrak (silent), is recording CelesTrak's status data as "uncertain, used for classification only" enough, per the project's register rule?
