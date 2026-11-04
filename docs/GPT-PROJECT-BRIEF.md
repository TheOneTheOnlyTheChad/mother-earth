# Mother Earth — brief for the GPT project (reviewer)

Written 3 Nov 2026 (Claude, thread 8) from the project's own records. Two parts: **A** is short enough to paste as the GPT project's custom instructions; **B** is the full brief, to upload as a project file. Update B's §9 "Checkpoint" from `STATUS.md` whenever Chad hands over; everything else changes rarely.

---

## A. Custom instructions (paste this)

You are the reviewer on Mother Earth, an open globe of live observations of the planet, owned by Chad. Claude (Anthropic) writes and deploys all code; you do not. Your job is to check reasoning, evidence and release readiness, and to say plainly when something is wrong — Chad wants to be shown wrong when the facts support it, and he relays your replies to Claude.

How to review:
- Separate three things in every answer: what a source or platform **explicitly requires** (quote or link it), what **remains uncertain**, and what you **recommend as project practice**. Never present a cautious recommendation as mandatory.
- Distinguish measured from assumed. Ask for the measurement when a claim rests on an assumption; treat one sample as one sample.
- Keep fixture tests, offline tests, scheduled-run verification and live-browser checks distinct. A test counts only if it was shown to fail on a deliberate break.
- Hold the constitution and standing rules in file B. Flag any wording that implies a cause, invents a zero, presents computed data as observed, or overstates completeness.
- Decisions on shipping, spending and provider permissions are Chad's. Give a clear recommendation and the trade-off, then leave the call to him.
- Never ask for, repeat or store credentials or keys.
- Be brief and direct. Bottom line first.

---

## B. Full brief

### 1. What it is
Mother Earth is one browser globe showing the latest available observations of the planet from open feeds, each with its provenance, time, place and an honest coverage grade. The promise, verbatim and on the page:

> "See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."

Chad sees it as the first page of something broader — a way for people to see real things and bridge between fields themselves — and wants it to outlast all of us. Right now it is an MVP: get the feeds in, running and tested, keep cost and retention low, then gather data, then users.

### 2. Constitution (agreed 1 Nov 2026 — outlasts any layer)
- **Live data, real things.** Only observations with provenance, time, place and coverage grade. What is modelled or computed says so.
- **We force no view.** The site shows; it does not tell. No politics, no drama, no editorial, no fear framing.
- **Bias is chucked.** A source found to carry bias, an agenda, or that cannot be checked is removed outright, with reason and date recorded.
- **A bridge carries its evidence grade.** Nothing implies a cause without saying so.
- **Shared keys for things.** Stable public identifiers (Wikidata preferred) on records that name a thing.
- **The hub is the product; the page is a client.** History stays private; paid features (later) are hub endpoints.
- **Code is AGPL-3.0** (earlier commits MIT).
- **Every source's commercial standing is in the register** before it goes live (yes / with attribution / needs agreement / unknown).

### 3. Roles
- **Chad** — owner. Decides what ships, what is spent, provider permissions, and which reviewer feedback to adopt. Enters all secrets himself; Claude never creates accounts or types passwords.
- **Claude** — sole code writer and deployer; measures on the real platform; keeps STATUS/START-HERE/HANDOVER current; judges reviewer feedback rather than accepting it blindly.
- **GPT (you)** — reviewer. Pulled in by Chad when something deserves a three-way look: problem statements, test results, release readiness, source terms. Not every decision comes to you.
- Gemini has reviewed earlier rounds; may be pulled in again.

### 4. Links
- Live globe: https://theonetheonlythechad.github.io/mother-earth/ (GitHub Pages; **pushing `main` publishes it** — unreleased page work lives on branches)
- Repo: https://github.com/TheOneTheOnlyTheChad/mother-earth (`STATUS.md` newest-first, `START-HERE.md`, `REGISTER.md`, `docs/SPEC-v0.3.md`, `docs/SPEC-orbital-layers.md`, `reviews/`)
- Hub (Cloudflare Worker): https://mother-earth.chadoberholzer.workers.dev — public `/status`, `/snapshot/<layer>`, `/cells/<layer>`, `/elements/satellites`, `/elements/orbital`
- Branches: everything released is on `main`. Unreleased: `aircraft-rc` (aircraft, not public, pre-orbital base), `bench-orbital` (benchmark evidence). `ux-round-1` merged 4 Nov.

### 5. Architecture (as built)
- **Page:** static `index.html` + `sources.html` + shared `app.js`/`style.css` on GitHub Pages, globe.gl 2.45.0 pinned. Reads only the hub; never calls a data source (imagery tiles excepted, dated). Polls `latest` snapshots.
- **Hub:** one Cloudflare Worker (collector **0.3.5**), **Workers Paid** ($5/month, enabled 3 Nov 2026). Cron triggers: `*/5` (quakes), `*/15` (fires; ships cloud fallback check), `11,41` (forest; orbital rides :41 in odd UTC hours), `7 * * * *` (hourly: Kp, CO₂, sea ice, drifting buoys, D1 aggregation). The CelesTrak satellites job is stopped (`SATELLITES_ENABLED=0`).
- **Storage:** **R2** holds `latest/` snapshots (what the page reads), small `state/` files per collector, and 48-hour history prefixes (`raw/`, `snapshots/`, `cells/`) under lifecycle rules. **D1** holds `collector_runs` (feeds `/status`) and hourly aggregates (the phase-3 baseline). **No KV.**
- **External collectors:** ships come from Chad's Mac (launchd, ~every 30 min while awake) and post to the hub's authenticated `/ingest`; when no Mac sample has arrived for 40 min the hub samples aisstream itself (cloud fallback, hears ~half the vessels; the card says so). Aircraft collection, if released, would also run off-Cloudflare (Cloudflare egress gets HTTP 522 from OpenSky). **Rule:** public features must not depend on the Mac or a browser being open; the Mac is acceptable only where no alternative exists, and that dependency is disclosed.
- **Storage rule:** one current validated snapshot per replaceable feed — validate, publish new with matching metadata, then delete the previous. On any failure, keep serving the last good snapshot with its original timestamps. No temp files left behind. **History is now collected deliberately** (Chad, 3 Nov): D1 aggregates kept with no end date set; raw files 2 days; what is kept is published on Sources & Details `#kept`. Retention and spend changes are Chad's call.

### 6. Layers
| Layer | Source | Status |
|---|---|---|
| Earthquakes | USGS | live |
| Fires | NASA FIRMS VIIRS (today UTC so far) | live |
| Kp (index) | NOAA SWPC | live |
| CO₂ (index) | NOAA GML Mauna Loa | live |
| Sea ice (index) | NSIDC Sea Ice Index | live — hub still carries NSIDC's older citation; required 2025 form in REGISTER; fix pending Chad's go |
| Ships | aisstream.io via Chad's Mac (cloud fallback) | live, sampled ~30 min |
| Forest disturbance | Global Forest Watch integrated alerts (CC BY 4.0) | live |
| Drifting buoys | NOAA OSMC ERDDAP (WMO GTS, CC0) | live since 3 Nov, hourly, ~1,300 buoys, Optional layers group, off on load |
| Day/night | computed (no source) | live, Optional layers group, off on load |
| Orbital (Payloads · Rocket bodies · Debris) | Space-Track GP (Chad's account) | live since 3 Nov 14:49 UTC, Optional layers group, each off on load; payload status deliberately left mixed |
| Satellites (CelesTrak) | — | **retired** 3 Nov: replaced by Orbital; job stopped |
| Aircraft | OpenSky | built on `aircraft-rc`, not public — Chad is checking OpenSky's wording (only record: ticket #837506 — hobbyist use within credits; a public site must also feed; no cloud whitelisting) |

### 7. Orbital decisions (3 Nov 2026)
- **Elements:** Space-Track GP via the hub, trimmed with the documented `predicates/` operator to 18 columns; two-hourly; ≤ 1 GP request/hour at an off-peak minute (10–20 min either side of :00/:30); one attempt per slot, no retries.
- **Type vs status:** object type comes from Space-Track. Payload operational status (active/inactive) would come from CelesTrak SATCAT, which has **no published reuse statement** — whether to use it, and whether to ask CelesTrak, is Chad's decision and is **pending**. Until then the toggles are **Payloads · Rocket bodies · Debris**; unknown object types are counted, not drawn. With status: **Active · Inactive & rocket bodies · Debris**, inactive and rocket-body counts kept separate; blank or unmatched status stays unknown, never "inactive".
- **Disclosures always visible:** completeness unverified (Space-Track returns no row count for CSV, so a file cut cleanly between rows above the floors would pass); positions computed, not observed; markers not to scale; element file's retrieval time; counted-not-drawn total.
- **Reuse:** Space-Track's published blanket approval covers basic SSA data accessed via Space-Track, conditioned on citation.

### 8. Standing rules
- Measure, don't assume; write the number down with the date and say how it was measured. Bound every test.
- Report agreement with a named reference over a stated range, not absolute accuracy.
- Keep observation time, retrieval time and last refresh attempt distinct. No invented zeros: missing is "not provided"; an empty response is "unknown", never zero.
- Observations, models and computed context stay visibly different on the page.
- Every Cloudflare deploy, every schedule switched on, and every push to `main` that changes the public page needs Chad's explicit go.
- Independent optional layers: each has its own toggle, off on a fresh load, no requests while off, touching only its own layer.
- A test suite must be shown to fail on a deliberate break before its green result counts — on the branch build itself, not only on the old layout. A break must be confirmed to take effect (a `hidden` attribute is overridden by `.ovl{display:flex}`).
- Screenshots are labelled with the commit they were taken from.
- Cost: Workers Paid is accepted; avoid material new load without naming the trigger. R2 and D1 are within free allowances (as of 3 Nov). A spending cap is not configured/verified.

### 9. Checkpoint — 4 Nov 2026, ~05:55 UTC, end of thread 11 (replace from STATUS at each handover)
- **Live: UX round 1** (main `ab8abb8`, assets `?v=202611050900`, Pages deploy 05:53 UTC, smoke-tested on the public site). Spec of record: Chad's `UX-ROUND-1-SPEC.md` (GPT's draft, revised with Claude's eight review points). Globe clear on desktop; credits moved below the globe with the full current text kept visible; legend coverage key folds away; Observed/Computed text labels on every card (forest: "satellite-derived alerts — interpreted by the source, not ground-verified"; indices qualified; orbital "calculated from published orbital elements"; nothing labelled Projected); one Optional layers group (drifters, day/night, orbital), independent switches, all off on load, no group toggle; Explore = search + jump buttons only; inspector source links per layer (opened and checked); long inspector method text behind a disclosure; "What Mother Earth keeps" on Sources & Details (read from D1 + R2 rules 4 Nov; "no end date set" for aggregates; raw 2 days; drifters/orbital/sea ice current file only; none shown yet).
- **Live-site bugs found and fixed in this round:** phone layout hid the credits (LANCE acknowledgment) entirely; 360 px header overflowed by 31 px; switching drifters off showed "Records withheld: off"; Sources said day/night was "the only computed thing".
- **Evidence:** 10 suites, 559 checks green on the merged build. New `ux-round1.test.cjs` (34) fails 24 on main's layout; drifters off-warning check fails on main. Deliberate breaks on the branch: switch listener removed → terminator-ui 3 FAIL + terminator-behaviour 8 FAIL; relocated block hidden → terminator-ui aborts (switch not clickable); off-as-withheld → drifters-ui FAIL.
- **REGISTER:** NSIDC use condition + required 2025 citation filed (read 4 Nov). Gap: the hub carries the older citation (fix = one-line hub change, Chad's go). NSIDC dataset now on a "Basic" level of service (watch). Attribution placement recorded as an open question with each source's stated requirement.
- **Chad's direction (4 Nov):** Mother Earth is page one of a broader bridge across fields (sciences, news, art…), built on data not opinion. A later **Possible futures** view: published model projections under stated scenarios, each with its own supported horizon — never extrapolated to fill a 50/100-year control; "projections", not forecasts. Truth not doom: show damage and repair where data exists, never netted without a method. Stay light: collection is deliberate; any working window is chosen for a defined use.
- **GPT's live review (4 Nov):** no new blocking issue; UX round 1 closed. Mobile overlay work retained for a later pass. GPT did not rerun the suites or recheck mobile.
- **Next:** (1) NSIDC citation update in the hub — pending Chad's go; (2) ocean plastic research (one measured surface-water export first; buoy drift stays separate from any modelled transport); (3) mobile pass later.

### 10. Open items outside the next list
- FIRMS CPU attribution; CO₂ truncated-200 guard; physical long-sleep test of the Mac collector; Android phone as collector; aircraft (Cloudflare 522 + OpenSky feeder requirement; other open ADS-B networks untested); submarine cables (CC BY-SA decision first).
