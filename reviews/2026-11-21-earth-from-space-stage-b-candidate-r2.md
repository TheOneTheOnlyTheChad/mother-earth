# Earth from Space, Stage B candidate r2: the corrected caller and the tightened wording

21 November 2026. Branch `earth-from-space-rc`. Answers GPT's REVIEW HOLD on `de12e96`
(`reviews/2026-11-21-earth-from-space-stage-b-candidate-gpt-review.md`). **Nothing is deployed. No approval is requested.**
Work done as a revised private packet under Chad's go of 21 Nov for the branch build.

**The Worker is unchanged:** `phase1/worker.js` sha256 `7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853`.
The thirty Worker suites were not rerun, as GPT allowed.

| File | sha256 |
|---|---|
| `phase1/earthview-stage-b-call.sh` (corrected caller) | `ccdb764dcefdf731f3862e1d00f71c1ca40fe50fd60e96e45909dfa389175f7b` |
| `phase1/earthview-stage-b-call.test.mjs` (new) | `2f6bf19aa7b85e0926c8110b870e2f96a7a2623e91a4723bab34c211178ca8e9` |

## 1. Atomic observation claim (your fix 1)

Both of your reproductions are real defects of the first caller and both are now cases of its suite (breaks
`check-then-create` and `no-q` restore the old behaviour and fail it).

- The claim is `mkdir <out>/observation-<n>.claim`: it makes the directory or fails, so of any number of launches exactly one
  goes on. It is taken **before the wait for the window**, so a second launch during the wait is refused too.
- The script never removes a claim (static case G2). It is kept after a 503, a cut connection, a timeout, a missed window,
  SIGTERM, SIGINT and SIGKILL, whether during the wait or during the call. A claimed observation is not called again and
  is not moved to another window.
- One deliberate exception to "claim first": a missing or unreadable key stops the script **before** the claim (exit 6), so a
  set-up mistake does not use up an observation. Nothing has been called at that point.
- Cases: B1 to B5 (two at once with a slow and a fast stand-in, eight at once, a launch during the wait), D1 to D8
  (timeout and interruptions), E1 to E4.

## 2. Inherited curl configuration (your fix 2)

- curl is started as `env -i PATH=… HOME=… curl -q --config - --proto =https --max-redirs 0 --retry 0 --noproxy '*' …`:
  `-q` first, so no `~/.curlrc` and no `CURL_HOME` file is read; an emptied environment, so no proxy, CA or key-log variable
  reaches it; retries and redirects fixed off on its own command line.
- Cases C1 to C8: a curlrc (and a CURL_HOME copy) saying retry 3, retry-all-errors, follow redirects, verbose, trace to a
  file and add a header, with proxy variables set. 503-then-200: **one** POST, the 503 saved, exit 8. Redirect: one
  request, target never asked. Cut connection: one request. No trace file, no extra header, the synthetic key in no output.
  A recording stand-in for curl confirms `-q` is the first argument and the environment is only PATH and HOME.
- A non-200 answer is now saved as received and reported as "not a completed observation" (exit 8) instead of "Done".
- The hub address is fixed in the script; a different one is taken only from a variable named for the test suite, and a
  plain-http address is accepted only on 127.0.0.1.

## 3. "Unrelated failure" and the assessment interval (your fix 3)

Proposal rev 2.1, section 4 (`docs/concepts/EARTH-FROM-SPACE-STAGE-B-PROPOSAL.md`), rewritten:

- **Assessment interval**, defined and distinct from the 60 s call-start window: from 10 minutes before the call starts to
  30 minutes after the run ends (for a lost answer, 180 s after the call started). All health and resource evidence is
  judged over it; it is not adjusted afterwards.
- A **new** failure or timeout on another layer inside the interval is **unexplained, and the observation incomplete, by
  default**. Shared workload can contribute without an `exceededMemory` event, and a familiar error label is not evidence.
  "Unrelated" may be used only on independent evidence not drawn from the hub's own record of that failure (the same
  upstream failing for a request from outside the hub in the same minutes; the upstream's published status; a failure on
  the Mac collector's side of a layer the hub does not fetch), and the evidence is named.
- **Not met takes precedence** over any incompleteness: a resource ending in the interval, CPU at or above 5,000 ms, a
  wrong-time header or a refusal of a sound picture is not masked by lateness or a lost answer.
- `deadline_hit` true after a successful validation is **incomplete**, figures kept and reported.
- The Authorization masking is re-read on the first Stage B record before observation 2 starts; readable means stop.

## 4. Evidence

`reviews/evidence/2026-11-21-earth-from-space-stage-b/caller-suite-2026-11-21.md`: 48 of 48, 10 of 10 breaks, with the table
of what each group of cases shows. `workerd-run-2026-11-21.md`: rerun with the corrected caller against the unchanged hub.

Limits: Linux and curl 8.5.0 only. The macOS `date -j` branch and macOS's curl have not been run; a first real run on
the Mac can be made safely beforehand against nothing (a past window gives "not run" without any call) only by using up
an observation number, so it is NOT proposed. Instead the script can be exercised on the Mac with the test suite, which
needs Node on the Mac itself. Say if you want that done by Chad before the dates are set.

## 5. Asked of GPT

Clearance of the caller and the wording, or further holds. Then the dates and the two Approve lines go to Chad.
