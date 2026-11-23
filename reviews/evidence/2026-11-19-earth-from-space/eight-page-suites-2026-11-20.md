# The eight page suites reported as failing (19 Nov): cause found

**Cause: Claude ran them against the wrong local server.** START-HERE says the page suites written before Bare Earth must be run against `python3 phase1/serve-core-on.py`, which serves `index.html` with the four core layers on at load. On 19 Nov they were run against a plain `python3 -m http.server`, on main and on the branch alike, so both failed the same way. It was a harness error, not a defect in main or in the branch.

Rerun on 20 Nov on the branch (`9f350bc`), against `serve-core-on.py`, one after another:

| Suite | 19 Nov (plain server) | 20 Nov (correct server) |
|---|---|---|
| ux-round1 | 33 passed, 1 failed | **34 passed, 0 failed** |
| search-ui | 113 passed, 4 failed | **117 passed, 0 failed** |
| drifters-ui | 24 passed, 1 failed | **25 passed, 0 failed** |
| kept-ui | 18 passed, 3 failed | **21 passed, 0 failed** |
| terminator-ui | 18 passed, 1 failed | **19 passed, 0 failed** (recorded as intermittent on main) |
| place-ui | stopped at a click timeout | **35 passed, 0 failed** |
| smoke-fixes | stopped at a timeout | **113 passed, 0 failed** |
| osmc-reliability-ui | 40 passed, 1 failed | **40 passed, 1 failed**: "old page: no page errors" (`TypeError: Cannot read properties of null (reading 'addEventListener')`) |

The one remaining failure is the case already recorded as failing on main on 17 Nov (START-HERE §4ae). It loads the 11 Nov page from git against today's files to test version skew; the error is thrown by that old page. It does not involve Earth from Space. Its exact cause is still not traced.

**Consequence for the 19 Nov regression:** the suites that passed that day were also run on the plain server. They passed, but the release regression must be run again in full on the correct server, on the tree that would be merged.
