# The calling script's own suite, run 21 Nov 2026, 05:40 UTC (Claude's runs, cloud workspace, Node v22.23.5, curl 8.5.0, Linux)

`phase1/earthview-stage-b-call.sh` sha256 `ccdb764dcefdf731f3862e1d00f71c1ca40fe50fd60e96e45909dfa389175f7b`
`phase1/earthview-stage-b-call.test.mjs` sha256 `2f6bf19aa7b85e0926c8110b870e2f96a7a2623e91a4723bab34c211178ca8e9`

`node --no-warnings phase1/earthview-stage-b-call.test.mjs`: **48 of 48**. Synthetic key, temporary KEYS.md and HOME, a local
stand-in for the hub on 127.0.0.1 that records every request. The live hub was not contacted and no real key was read.

Breaks (each weakens a copy of the script; each fails the suite), 10 of 10:
check-then-create (GPT's reproduction 1: the old exists-then-create check), claim-released, no-q (GPT's reproduction 2),
no-env-clear, retry-allowed, redirects-followed, key-on-command-line, claim-after-wait, late-still-calls, non-200-ok.

What the cases show:

| Cases | Shown |
|---|---|
| A1 to A6 | one POST, key only in the Authorization header, answer saved as received, key in no output or file, a relaunch refused, another observation number independent |
| B1 to B3 | two launches at the same moment (slow hub, fast hub) and eight at once: exactly ONE POST; the others exit 4 |
| B4, B5 | a second launch while the first is still waiting for its window is refused; the first then calls once |
| C1 to C3 | a `~/.curlrc` and a `CURL_HOME` file saying retry 3, retry-all-errors, follow redirects, verbose, trace to a file, add a header, plus proxy variables; hub answers 503 then would answer 200: ONE POST, the 503 saved, exit 8, no trace file, no extra header, key nowhere; relaunch refused |
| C4 | hub answers 307 and the curlrc says follow: ONE request, the target never asked |
| C5 | connection cut and the curlrc says retry: ONE request, exit 7, claim kept |
| C6 | with all of that inherited, a normal call is still one POST straight to the hub |
| C7, C8 | a recording stand-in for curl first on PATH: curl's first argument is `-q`, `--retry 0`, `--max-redirs 0`, no key in its arguments; its environment is only PATH and HOME |
| D1, D2 | hub never answers: one POST, exit 7 after the wait, claim kept, relaunch refused |
| D3 to D5 | SIGTERM, SIGINT and SIGKILL to the script and curl during the call: one POST was made, the claim is kept, no result is claimed, relaunch refused |
| D6 to D8 | SIGTERM and SIGKILL while waiting for the window: no POST, claim kept ("not run"), relaunch refused |
| E1, E2 | started after the window: not run, exit 5, and not runnable in a later window |
| E3, E4 | no ADMIN_KEY in KEYS.md: exit 6, nothing claimed; with the key in place it then runs once |
| E5 to E10 | bad arguments and a non-local plain-http address: exit 2, nothing claimed, no request |
| F1 | while curl waits, no process command line contains the key |
| G1 to G3 | curl is run in one place with `-q` first; the script never removes a claim; the real hub address is fixed in the script |

Limits: run on Linux with curl 8.5.0. The macOS branch of the date conversion (`date -j`) and macOS's own curl have not been
run; `mkdir`, `-q`, `env -i`, `--retry`, `--max-redirs`, `--proto` and `--noproxy` are long-standing options on both.
A claim by SIGKILL leaves no meta file: the claim directory alone then marks the observation as used.
