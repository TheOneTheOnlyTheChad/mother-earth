# Hub 0.6.22: storage and source calls per run, counted (22 Nov 2026)

`node reviews/evidence/2026-11-22-earth-from-space-0.6.22/operation-counts.mjs`, 2026-11-22T06:13:19Z clock reading, Claude's workspace. The real `phase1/worker.js` against a recording bucket; EUMETView replaced by fixtures. Class A and Class B are Cloudflare R2's operation classes (writes and lists; reads). The inventory guard lists the pictures prefix on every run, so reads and lists grow with the number of pictures held when the prefix needs more than one page (1,000 keys); at about 146 pictures it is one page.

| Call | Result | Requests to the source | Class B: reads | Class A: writes and lists | Deletes (free) | Run-log rows |
|---|---|---|---|---|---|---|
| status (dry, empty storage) | status | 0 | 5 (get 5, head 0) | 2 (put 0, list 2) | 0 | 0 |
| hold | held | 0 | 5 (get 5, head 0) | 3 (put 1, list 2) | 0 | 0 |
| recover dry run | recover | 0 | 5 (get 5, head 0) | 2 (put 0, list 2) | 0 | 0 |
| recover apply (first start) | recovered | 0 | 11 (get 9, head 2) | 7 (put 3, list 4) | 0 | 0 |
| release apply | released | 0 | 8 (get 6, head 2) | 3 (put 0, list 3) | 1 | 0 |
| manual run: first published frame | earthview:published 2026-11-19T11:00:00Z | 3 | 14 (get 11, head 3) | 7 (put 6, list 1) | 0 | 1 |
| run: nothing newer | earthview:nothing newer 2026-11-19T11:00:00Z | 1 | 8 (get 5, head 3) | 2 (put 1, list 1) | 0 | 1 |
| run: second published frame | earthview:published 2026-11-19T11:10:00Z | 3 | 14 (get 11, head 3) | 7 (put 6, list 1) | 0 | 1 |
| run: third published frame (steady state without a deletion) | earthview:published 2026-11-19T11:20:00Z | 3 | 14 (get 11, head 3) | 7 (put 6, list 1) | 0 | 1 |
| status (three pictures held) | status | 0 | 10 (get 8, head 2) | 3 (put 0, list 3) | 0 | 0 |
| run refused by the gate | earthview:not run (EARTHVIEW_ENABLED unset) | 0 | 0 (get 0, head 0) | 0 (put 0, list 0) | 0 | 0 |
