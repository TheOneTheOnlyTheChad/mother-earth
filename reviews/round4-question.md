# Mother Earth — review round 4 (31 Oct 2026): live site, next layers, cost cliff, OpenSky reading

You are reviewing a live, open, $0/month project. Be specific and critical; cite the rule or number you rely on. Tell us where we are wrong.

## What exists (look at it)
- Public page: https://theonetheonlythechad.github.io/mother-earth/  (GitHub Pages; reads published snapshots only, never collects)
- Hub: https://mother-earth.chadoberholzer.workers.dev  — try `/`, `/status`, `/cells/ships`, `/cells/usgs`, `/snapshot/co2`
- Source: https://github.com/TheOneTheOnlyTheChad/mother-earth  (spec = SPEC-v0.3.md; decisions D1–D14 in STATUS.md; source terms in REGISTER.md)
- Promise on the page, verbatim: "See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."

Architecture: one Cloudflare Worker (free plan) runs cron collectors for USGS quakes, NOAA SWPC Kp, NASA FIRMS fires, NOAA GML CO₂, NSIDC sea ice; writes §5 envelopes to R2 (`latest/*` overwritten, `snapshots/*` and `cells/*` kept per run) and hourly aggregates to D1 (SQLite). External collectors (today: a MacBook at home) POST envelopes to an authenticated `/ingest/<layer>` (decision D11). Ships (aisstream.io AIS, Class A+B, world bbox, 60 s window) went live this morning that way: 3,943 messages → 3,838 vessels, 175 four-degree cells, 424 KB, socket up 58.8/60 s, compression on. Every cell carries a coverage grade (adequate / partial / unknown) with an evidence string; the status sentence is generated from a template that cannot emit a cause. Comparisons: none of ours yet (baselines accumulate from 30 Oct 2026); the only comparisons shown are source-provided (NOAA's CO₂ 1 y/10 y, NSIDC's 1981–2010 climatology) and labelled as theirs.

## Problem 1 — a stream fed from a laptop
aisstream requires a server-side socket ("Direct browser connections are not permitted"); the Worker cannot hold one on the free plan (cron invocations get 10 ms CPU; a Durable Object holding a socket is billed by wall-clock). So the socket lives on a home machine: the Mac now (60 s job every 30 min while awake, via launchd), a Raspberry Pi later (always on). When the Mac is closed the layer goes "unknown" after `stale_after_s` = 3 h — by design, not a bug.
- Is a 60 s window every 30 min an honest "latest observed" for ships? What would you label it as on the page?
- We measured ~1 message per vessel per 60 s on a world bbox (3,943 msgs / 3,838 vessels) — far below AIS report rates. Server-side thinning? Does it matter for "latest position per vessel"?
- Anything cheaper or more durable than the Pi for an always-on residential collector at $0/month?

## Problem 2 — data piling up
R2 bucket measured today: 277.6 MB after ~36 h, 2.9k class-A ops. Growth ≈ 180 MB/day (raw FIRMS CSVs every 15 min are the bulk; ships adds ~22 MB/day at 30-min cadence). Free tier: 10 GB storage, 1M class-A ops/month. Decision D12 says raw is kept 48 h, aggregates (D1 hourly cell rows) kept for phase-3 baselines.
- Proposed: R2 object-lifecycle rules (free, no code) deleting `raw/`, `snapshots/`, `cells/` after 2 days; `latest/*` untouched. Objections? Anything we'd regret not keeping for baselines that the hourly D1 aggregate doesn't hold?

## Problem 3 — when does this start costing money? (our numbers; check them)
Free-tier limits as we understand them: Workers 100k requests/day and 10 ms CPU per invocation; R2 10 GB, 1M class-A and 10M class-B ops/month; D1 5 GB, 100k row-writes/day, 5M row-reads/day; GitHub Pages ~100 GB/month soft bandwidth. Current use: Workers requests ≈ cron (≈ 320/day) + viewers (≈ 8 hub requests per page load, the FIRMS snapshot alone ~1–2 MB); D1 writes ≈ 40–70k/day (D8 — the closest to a limit); FIRMS parse measured 15 ms CPU at 1.3 MB (soft limit 10 ms; 4 MB guard in place).
- Which limit do we hit first, at what number of daily page views?
- First paid line items we expect: Workers Paid $5/mo (CPU/D1), R2 over 10 GB ($0.015/GB-month), a Pi (~R2,500–4,000 once) — anything we're missing? Owner can absorb a small monthly cost; he wants to know the trigger, not the price.

## Problem 4 — next layers (owner's list), honestly sourced
The rule: a layer is observed, daily-or-better, open, and labelled by tier (observation / analysis / model). Owner wants: (a) plastic in the oceans, (b) deforestation per day, (c) solar farms, including a Chinese panel-washing/dust event he recalls, (d) mining.
Our first read: (b) GLAD / RADD deforestation alerts via Global Forest Watch are observation-tier and near-daily — strongest candidate; (a) no daily observation feed exists for ocean plastic (modelled drift fields, annual surveys) → would have to be a model-tier layer or an index; (c) and (d) are static footprints (Global Energy Monitor solar tracker, mining polygons) — show as static context, not live.
- Correct us: name the best open, re-usable daily feed for each, with its licence sentence, or say plainly that none exists.
- Which of these four would you add first, and how should the page label it so the promise stays true?

## Problem 5 — OpenSky reading
OpenSky's reply (30 Oct): hobbyist use within credits is fine (no written confirmation); a public-facing website must additionally be a feeder; cloud servers won't be whitelisted; may change without notice. The page is on a public URL. Our reading: aircraft cannot be shown on the public page until a home ADS-B feeder runs; but the Mac (residential IP) may pull OpenSky for private use (data collected, not displayed). Do you read it the same way? Is a private, unlisted copy of the page showing aircraft a reasonable interim, or is that sophistry?

## What we want back
Numbered answers per problem; where you disagree with a decision (D1–D14 in STATUS.md) say which and why; flag anything on the live page that over-claims.
