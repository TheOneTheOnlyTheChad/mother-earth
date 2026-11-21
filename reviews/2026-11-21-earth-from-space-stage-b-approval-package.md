# Earth from Space, Stage B: approval package for Chad

21 November 2026. GPT passed candidate r2 (`reviews/2026-11-21-earth-from-space-stage-b-candidate-r2-gpt-review.md`).
**Nothing is deployed and nothing is approved until Chad sends a line below himself.** Two separate actions, two lines.

## What is reviewed and fixed

| | |
|---|---|
| Hub file | `phase1/worker.js` at `earth-from-space-rc` `559f2e4`, sha256 `7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853`, 532,762 bytes, version 0.6.21 |
| Calling script | `phase1/earthview-stage-b-call.sh` at `559f2e4`, sha256 `ccdb764dcefdf731f3862e1d00f71c1ca40fe50fd60e96e45909dfa389175f7b` |
| Rules | `docs/concepts/EARTH-FROM-SPACE-STAGE-B-PROPOSAL.md` rev 2.1, section 4 |

## Read before the lines, 05:56 UTC 21 Nov (read-only, dashboard pane)

- Live hub code: `worker.js`, 426,559 bytes, sha256 `eb5b1de9e1fa693a0b65af0852ce4ef21b0e6e6ff306747baa2f2abe2eb4c4fa`, version 0.6.19. This equals `phase1/worker.js` on main, which is the rollback file.
- No `EARTHVIEW_ENABLED` variable exists on the hub. Compatibility date 2026-10-30, no flags. Four cron triggers. 24 bindings.
- Storage bucket `mother-earth`: **no object under `earthview/`**.

## Line 1: deploy

What happens: Claude opens the Cloudflare editor and the raw file and checks the raw file's hash. **Chad copies the raw
file, pastes it over the editor's code and clicks Deploy** (about ten minutes at the screen). Claude then reads back: the
deployed code's sha256, the version at `/`, bindings and crons unchanged, no `EARTHVIEW_ENABLED`, every existing layer
still updating, the public Earth from Space route answering "unavailable", and no object under `earthview/`.
**If any `earthview/` object is found, or the hash differs: stop and report; nothing is deleted or initialised.**
No variable, binding, cron or setting is changed. For visitors: no intended visible page change.
Rollback, on its own line if ever needed: redeploy 0.6.19 (main's `phase1/worker.js`, sha256 `eb5b1de9…c4fa`).

```
Approve: deploy hub 0.6.21 from earth-from-space-rc 559f2e4, phase1/worker.js sha256 7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853, code only, EARTHVIEW_ENABLED left unset, no variable, binding, cron or setting changed; read back the deployed hash and settings; stop and report if any earthview/ object exists in storage
```

## Line 2: the three observations

Order quiet, busy, quiet. Windows bound the **start** of each call. One call each, 3 requests to EUMETSAT at most per call,
9 in all, nothing stored. A failed, late, lost or missed observation is **not replaced**. Before observation 2 is started,
Claude reads the first observation's invocation record: if the key is stored readable there, the rest stop.

Option A, today:

| | Window start (UTC) | SAST | Length | Kind |
|---|---|---|---|---|
| 1 | 2026-11-21T12:21:30Z | Sat 14:21:30 | 60 s | quiet |
| 2 | 2026-11-21T16:07:40Z | Sat 18:07:40 | 30 s | busy: the heavy hourly job starts at 16:07:59 UTC |
| 3 | 2026-11-21T20:21:30Z | Sat 22:21:30 | 60 s | quiet |

```
Approve: three Stage B observations on hub 0.6.21 by POST /admin/probe/earthview, each started by me with phase1/earthview-stage-b-call.sh sha256 ccdb764dcefdf731f3862e1d00f71c1ca40fe50fd60e96e45909dfa389175f7b: observation 1 window start 2026-11-21T12:21:30Z 60 s, observation 2 window start 2026-11-21T16:07:40Z 30 s, observation 3 window start 2026-11-21T20:21:30Z 60 s; at most 3 requests to EUMETSAT each and 9 in total; nothing stored; no retry and no replacement of a failed, late or missed attempt; stop before observation 2 if the first record shows the key readable
```

Option B, tomorrow (the same times on Sunday 22 Nov):

```
Approve: three Stage B observations on hub 0.6.21 by POST /admin/probe/earthview, each started by me with phase1/earthview-stage-b-call.sh sha256 ccdb764dcefdf731f3862e1d00f71c1ca40fe50fd60e96e45909dfa389175f7b: observation 1 window start 2026-11-22T12:21:30Z 60 s, observation 2 window start 2026-11-22T16:07:40Z 30 s, observation 3 window start 2026-11-22T20:21:30Z 60 s; at most 3 requests to EUMETSAT each and 9 in total; nothing stored; no retry and no replacement of a failed, late or missed attempt; stop before observation 2 if the first record shows the key readable
```

Line 2 is used only after the deploy of line 1 has been read back clean. If the deploy is not read back clean at least
30 minutes before the first window, the observations are not started and a new line with new dates is needed.

## What Chad does for the observations

In Terminal, from the reviewed copy. Each command can be started early: it waits for its window, calls once and exits.
The Mac must stay awake (`caffeinate` running) and the Terminal window open.

```
cd ~/Documents/"Mother Earth"/_review/earth-from-space-stage-b-candidate-r2/phase1
./earthview-stage-b-call.sh 1 2026-11-21T12:21:30Z 60
```
Then, only after Claude says the first record is in order:
```
./earthview-stage-b-call.sh 2 2026-11-21T16:07:40Z 30
./earthview-stage-b-call.sh 3 2026-11-21T20:21:30Z 60
```
(2 and 3 each in its own Terminal tab, since each waits.) For option B the dates read 2026-11-22.

Rules for these commands, from GPT's pass: one results folder (the default,
`~/Documents/Mother Earth/_review/earth-from-space-stage-b/results`); never delete a `.claim` folder; set no
`STAGE_B_TEST_…` variable; a number is used once started, even if it fails or is cancelled.

## What Claude does around them

Health reads before and after each observation over its assessment interval (10 minutes before the call to 30 minutes
after the run ends), the invocation record of each call, the overlap read, and the result by the rules of proposal
rev 2.1 section 4, returned to GPT and Chad. Needs the browser pane signed in to Cloudflare at those times.
