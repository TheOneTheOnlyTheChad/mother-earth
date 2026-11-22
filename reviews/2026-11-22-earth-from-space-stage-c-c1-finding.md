# Earth from Space Stage C: stopped after C1. Caller script defect on macOS bash 3.2; caller r2 for GPT (22 Nov 2026)

Written 22 Nov 2026 07:47 UTC (clock reading). **Stage C is stopped after step C1. C2 was not run. Nothing on the hub was changed by C1
(a read-only status call). Hub 0.6.22 stays deployed with `EARTHVIEW_ENABLED` unset; `earthview/` is empty.** GPT
recommended stopping (relayed by Chad); this is the focused package it asked for.

## 1. What happened

Chad's Stage C line was sent (window 08:21 to 08:24 UTC). Section 0 reads were clean
(`reviews/evidence/2026-11-22-earth-from-space-stage-c/section-0-reads.md`). Chad ran, in Terminal on the Mac, from the
reviewed copy (`earthview-admin.sh` sha256 `2072653464c830ea5f0b2ad3d76a9d28c378896ccd4dcd95b3db27dd6ab5407b`):

    bash earthview-admin.sh C1 status

Terminal output, as he pasted it:

    earthview-admin.sh: command substitution: line 106: syntax error near unexpected token `newline'
    earthview-admin.sh: command substitution: line 106: ` case "$URLPATH" in *\?*'
    Done: HTTP 200. Saved /Users/chadobie/Documents/Mother Earth/_review/earth-from-space-stage-c/results/C1.1.json
    Tell Claude that step C1 has run.

## 2. What C1 showed (evidence kept as saved, not overwritten)

- `C1.1.json` (343 bytes, sha256 `577f6bcd062451bd709d718baa4f4b749f7b0c85e00006b1912d0f9ecabc1b3f`): pointer missing,
  list missing, 0 objects, no hold, guards "storage is not set up: no pointer and no list". As the runbook requires.
- `C1.1.meta.txt` (294 bytes, sha256 `f32a439e29e9d9a37c3df7f0c5eebe069fd8faac426067e5997aab7a68699535`): called
  07:35:02Z, answered 07:35:03Z, curl exit 0, HTTP 200. **Its request line is malformed:**
  `request: GET https://mother-earth.chadoberholzer.workers.dev/admin/earthview/status echo ?/admin/earthview/status;; esac )`
- Cloudflare's invocation record (telemetry query from the dashboard tab, read 07:35:39Z): one admin request,
  2026-11-22T07:35:03.914Z, `GET https://mother-earth.chadoberholzer.workers.dev/admin/earthview/status`, response 200,
  outcome ok, CPU 4 ms, wall 1,372 ms, user agent curl/8.7.1, **`authorization` shown as `********`, no key and no
  query string in the URL.** (The record's client address is Chad's and is not written here.)
- Copies of the two files: `reviews/evidence/2026-11-22-earth-from-space-stage-c/results-as-saved/`. The originals stay
  in the Mac results folder. No claim exists (C1 is read-only).

## 3. The defect

Line 106 of the reviewed script built the note's request line with a `case` inside `$( )`. bash 3.2 (the macOS
`/bin/bash`) cannot parse a `case` pattern's `)` inside `$( )`; bash 4 and later can. On the Mac every step would
print the two diagnostic lines and write a malformed request line. **The request sent to the hub is built separately
(`"$HUB$URLPATH"` on the curl line) and was correct**, as Cloudflare's record shows.

**Why the native run of the suite (80 of 80) did not catch it:** no check read the note's request line, and the suite
folds the script's standard error into text that no check examined for diagnostics. The pass was true and did not cover
this. The same construct appears in the suite's `key-in-url` break text, where it is part of a deliberately broken copy.

A scan of the script for other constructs bash 3.2 lacks (case inside `$( )`, associative arrays, `mapfile`,
case-changing expansions, `&>>`, `|&`, `[[ =~ ]]`, `printf %()T`) found only line 106. A scan is not a proof.

## 4. The fix (caller only; `phase1/worker.js` unchanged, sha256 `17798a44…a080`)

One line of `phase1/earthview-admin.sh`:

    -note() { { echo "step: $STEP"; echo "command: $CMD"; echo "request: $METHOD $HUB${URLPATH%%\?*}$( case "$URLPATH" in *\?*) echo "?${URLPATH#*\?}";; esac )"; cat; } > "$META"; }
    +note() { { echo "step: $STEP"; echo "command: $CMD"; printf 'request: %s %s%s\n' "$METHOD" "$HUB" "$URLPATH"; cat; } > "$META"; }

| File | sha256 before | sha256 now |
|---|---|---|
| `phase1/earthview-admin.sh` | `2072653464c830ea5f0b2ad3d76a9d28c378896ccd4dcd95b3db27dd6ab5407b` | `ee08092ecdd61f1937ef65e283c9b196d00c47a38740bd671525a4a108adaa31` |
| `phase1/earthview-admin.test.mjs` | `d6d95179ebd2da992f1081b53080e46ebc1ac9aefef6e9d20f3c5fde21cb7c1b` | `5f9398ef2b8e7953c05859c21093cee86b9859b17d47e30d7ba6a0a22a686378` |

## 5. Tests added (suite section G) and breaks

- **G1** (9 commands): the note's request line is exactly `request: <METHOD> <hub><path and query>`, including
  `?apply=1` and `?apply=1&plan=<id>`, and appears once.
- **G2** (9): a successful call writes nothing to standard error, and no shell diagnostic appears in its output or note.
- **G3** (9): the note holds exactly its nine fields in order (step, command, request, called_at, answered_at,
  curl_exit, http_status, answer_file, curl_message) and nothing else.
- **G4**: a refused call (409) keeps an exact request line and every field. **G5**: an interrupted call's note keeps
  step, command, the exact request line and the INTERRUPTED result.
- The suite now prints the version of the `bash` it started.

Linux (bash 5.2.21, node v22), Claude's workspace, 22 Nov 07:47 UTC: **109 passed, 0 failed**. Breaks:

| Break | Linux bash 5.2 |
|---|---|
| the 18 earlier breaks | each fails the suite (1 to 21 failures) |
| `note-request-wrong` (drops the query from the note) | 6 failed |
| `note-field-dropped` (drops `curl_exit`) | 10 failed |
| `stderr-noise` (prints a diagnostic on success) | 9 failed |
| `note-case-in-substitution` (**restores the old line 106**) | **0 failed: bash 5 parses it. Not caught here, by nature.** |

`note-case-in-substitution` is the real negative control and can only fail under a bash that cannot parse the old
line. It must be run natively on macOS; until Chad's output exists it is **not shown**. bash 3.2 could not be obtained
in the workspace (its source hosts are not reachable from it), so the defect has not been reproduced by Claude.

## 6. Asked of GPT

The one-line diff; section G and the four new breaks; and, once Chad has run them, the native macOS results (suite, and
`note-case-in-substitution` failing). Then Chad's continuation line with a fresh window. The Worker pass stands.

## 7. For the continuation (not requested here)

C1's evidence stays. `status` is read-only, so a fresh status read under the fixed script is saved as `C1.2` beside
`C1.1`; nothing is cleared or overwritten. The Stage C line of 22 Nov named the window 08:21 to 08:24 UTC, which is
not used; a new line and window are needed.

## 8. Native macOS results for caller r2 (added 22 Nov 2026 07:56 UTC, clock reading)

Chad ran the suite and the four new breaks in an ordinary Terminal on the Mac, from
`_review/earth-from-space-0.6.22-caller-r2/`, one paste, output kept unchanged:
`reviews/evidence/2026-11-22-earth-from-space-stage-c/NATIVE-CALLER-RUN-r2.txt` (22,038 bytes, sha256
`eca68d81b3bd9e2d6b9d7f30b7377b0a0352865a225ee1fdb26e792ac673adb3`, Mac modification time 2026-11-22T07:55:46Z).
Every run reports `shell used for the script: GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)`.

| Run | Native macOS, bash 3.2.57 | Linux, bash 5.2.21 |
|---|---|---|
| suite, fixed script | **109 passed, 0 failed** | 109 passed, 0 failed |
| `note-case-in-substitution` (the old line 106 restored) | **89 passed, 20 failed**: G1 and G2 for all nine commands, G4, G5 | 109 passed, 0 failed (bash 5 parses it) |
| `note-request-wrong` | 103 passed, 6 failed | same |
| `note-field-dropped` | 99 passed, 10 failed | same |
| `stderr-noise` | 100 passed, 9 failed | same |

Versions and hashes printed by the same paste: macOS 26.5.2 (25F84); bash 3.2.57; curl 8.7.1; node v24.14.1;
`phase1/earthview-admin.sh` `ee08092ecdd61f1937ef65e283c9b196d00c47a38740bd671525a4a108adaa31`;
`phase1/earthview-admin.test.mjs` `5f9398ef2b8e7953c05859c21093cee86b9859b17d47e30d7ba6a0a22a686378` (both equal to
the branch at `11c0bc1`).

So the defect is reproduced natively by the negative control, and the fixed script passes the new checks on the shell
that failed. **Not run natively:** the 18 earlier breaks. Claude did not watch the run; the evidence is the retained
output and Chad's word. Nothing was called on the hub.
