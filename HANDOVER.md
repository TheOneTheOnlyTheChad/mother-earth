# Mother Earth — handover (updated 5 Nov 2026, thread 14; thread-13 sections below still stand)

Read `START-HERE.md` (§2 constitution · §4 deploy · §5a testing, incl. the new clean-session method), then this file, then `STATUS.md` (newest first). Not a fresh sandbox.

**Access (Chad, 4 Nov):** "you have full access — GitHub (push), Cloudflare, Space-Track, my Mac's Mother Earth folder and ~/mother-earth, browser pane. I enter secrets myself; you never create accounts. Tell me up front whenever my screen must be on the app." **Every deploy, schedule change and push to main that changes the public page needs his explicit go.** Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. State at the end of thread 13 (4 Nov ~15:20 UTC) — LIVE
- **Page:** main `b04a930` (+ docs `5460030`+), assets `?v=202611071000`. New this thread: **mobile pass** (public ~15:15 UTC, Chad's go "you can go"):
  - Phones ≤ 720 px: legend behind **Key · N layers** (44 px, aria-expanded, Enter/Space/Escape). N = layers actually drawn (loading, failed or switched-off layers never count; day/night once; each orbital category once, when drawn).
  - Persistent strip while drawn: "Dated samples · 2011–2024" · "Day/night · computed · HH:MM:SS UTC" · "Orbital · computed · enlarged, not to scale". Imagery chip one line "Imagery DD Mon · not live"; the full sentence with year opens at the top of the Key.
  - Key and inspector close each other; both stop above the Readings sheet (inspector bound was a pre-existing 37 px overlap of the Readings button).
  - Landscape phones (780–932 px) and desktop unchanged (tablet layout, full legend).
- **Hub 0.4.0** unchanged (`7ef3747`), `PLASTIC_ENABLED=1`, plastic daily. Ships Mac primary + cloud fallback, unchanged. Retention unchanged.
- **REGISTER (Oceaneye/NCEI):** v2.2 claim withdrawn (GPT); methods are "documented in older NCEI accession metadata (v1.1, 26 Jan 2023, 802 efforts); live availability and applicability to later additions unconfirmed". NCEI pages all 503 on 4 Nov. SEANOE 94022 = 86630's file (net 0.6×0.15 m, 0.33 mm mesh confirmed).
- Plastic badge **LOADED** confirmed live; GPT settled it.
- Leftover merged remote branches (`mobile-pass`, `nsidc-page`, `plastic-rc`, `plastic-loaded`): proxy refuses deletes — Chad can delete when convenient.

## 1. Next (Chad's calls first)
0. **Thread 14 (5 Nov):** desktop overflow fixed and public (`3a2fcb2`, `?v=202611081000`) — see STATUS. New small item: **orbital-browser 103/2 on main** (stale/beyond-GEO vs reference for payload-alone and debris-alone; likely time-dependent fixture) — investigate the test, not the page.
1. **Real-phone check** of the mobile pass (Galaxy) — only emulation so far (GPT checked the public site in a browser on 5 Nov). Watch: plastic takes > 20 s to load on the live hub, so the Key count and strip appear late.
2. ~~Desktop 1280 px 8 px horizontal overflow~~ — **fixed 5 Nov** (it was fonts-dependent; real bug at 1,101–1,186 px).
3. **NCEI recheck** when ncei.noaa.gov answers (accession 0276422; does any later revision document the 343 post-2021 rows / size classes?). Research only; any schedule needs Chad's go.
4. Plastic follow-ups stay research only: Law 2010 reference candidate; 72-h hypothetical drift (OpenDrift/PlasticParcels, Python, not the Worker); AOMI / ADIS later (AOMI asks to be contacted before publication).
5. Open decisions unchanged: attribution placement (REGISTER top note); sea-ice history table; GFW human-readable source page.
6. Backlog unchanged: aircraft (OpenSky feeder), FIRMS CPU attribution, CO₂ truncated-200 guard, physical long-sleep test, probe endpoints removal, Possible futures (research only). Small-phone density: with all three orbital categories on, a 360 px globe is very busy (pre-existing, not this pass).

## 2. Learned in thread 13
| | |
|---|---|
| Disc coverage measure | **camera-based** radius R = (H/2)/tan(25°)/sqrt((1+alt)²−1), alt from `ME.cameraAt()`; measure the persist strip by its visible children, not its transparent container. **Supersedes the earlier 0.45×min(w,h) estimates** (they were too generous). |
| Coverage results | everything on, Readings open: 360×640 20.6 % (reported, text kept at 10.5 px; 0.4 % with sheet down) · 360×780 8.5 % · 390×844 5.4 % · 430×932 2.3 %; at load 0 %. Before: 58–70 %. |
| Clean RC session | fresh pane tab on a plain-text github.io file (`app.js?clean-rcN`) so no page scripts ever run; fetch RC files from raw.githubusercontent at the commit, check sha256, swap in blob URLs + `<base href>`, `document.write`. Overwriting a live page left old timers painting (false "off" badge, duplicate-Three.js warning). |
| Pane hidden | orbital build waits on requestAnimationFrame → stalls when the pane is hidden. Ask Chad for the pane before orbital or screenshot checks. |
| main worktree | `main` is checked out in `/home/claude/me-main`; merge/push main from there (`git checkout main` in the clone fails). |
| github.io from the container | blocked (403); verify deployed files' sha256 from the pane with `fetch(...,{cache:'no-store'})` + `crypto.subtle.digest`. `gh api …/pages/builds` is also refused through the proxy. |
| Comments in index.html | a `//` comment on a line joined with code swallowed a `}` and broke the page — parse-check index.html scripts after edits. |
| Tests in the container | GIBS must be fulfilled with a PNG (pngjs) or day/night refuses to draw; wait for orbital `aria-busy` to clear between clicks. |

## 3. Where things are
| | |
|---|---|
| Mobile tests | `node phase1/mobile-pass.test.cjs` (130; `MODE=before` for measurements against main; `SHOTS=<dir>` saves screenshots). Needs 8899 server + /home/claude/spike + fixtures |
| Comparison shots | sent to Chad in thread 13 (cmp-360/390/390b/land, live-360-all, live-360-key, live-844-inspector) |
| Plastic research | `reviews/2026-11-04-ocean-plastic-export.md`, `reviews/2026-11-04-plastic-experience-proposal.md` |
| Plastic tests | `node phase1/plastic-hub.test.mjs` (11) · `node phase1/plastic-ui.test.cjs` (29) |
| Test setup, new container | `/home/claude/spike`: `npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5` (fontsource = real webfonts for desktop-overflow; Google Fonts is blocked in the container, so any width measurement without them is the fallback case); `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; server via Bash `run_in_background` |
