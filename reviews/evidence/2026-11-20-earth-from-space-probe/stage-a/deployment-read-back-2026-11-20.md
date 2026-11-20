# Stage A: Worker created, and read back before the start (20 Nov 2026)

On Chad's own Approve line of 20 Nov (option 1 of `reviews/2026-11-20-earth-from-space-stage-a-approval-package.md`).

## Read back from Cloudflare at 10:45:00 UTC, before the 13:00 UTC start
| Item | As deployed | Approved |
|---|---|---|
| Script | `mother-earth-evprobe`, one module | same |
| Code sha256 (read from the deployed script) | `a84cf8548ff86bb44a82860c2e63636f27148f8594d2ccc317201ca132488343` | same |
| Start in the file | `2026-11-20T13:00:00Z` | same |
| Bindings | none | none |
| `workers.dev` address | off | off |
| Version (preview) addresses | off | off |
| Routes, custom domains | none | none |
| Cron triggers | one: `*/10 * * * *` (created 10:44:50 UTC) | same |
| CPU limit | 10,000 ms | same |
| Workers Logs | on, sampling 1, invocation logs on, persisted | on |
| Tail consumers, Logpush | none, off | none |
| Compatibility flags | none | none |
| **Compatibility date** | **2026-10-01** | **2026-10-30** (see below) |

## Two departures from the Approve line, each put to Chad first and accepted by him
1. **A Hello World first.** Cloudflare's dashboard creates a Worker only by deploying its own Hello World code on a public `workers.dev` address. Chad chose "Dashboard, brief Hello World". The Worker was created about 10:33 UTC; the address and the preview address were switched off about two minutes later. During that time the page answered "Hello World!" (the dashboard's own preview requested it twice). No cron trigger existed; no request went to EUMETSAT.
2. **Compatibility date 2026-10-01, not 2026-10-30.** The dashboard offers only dates on which runtime behaviour changed: 2026-10-01, then 2026-11-17. No change falls between them, so 2026-10-01 selects the same behaviour as the hub's 2026-10-30. Chad asked which was best and agreed to use it.

## How the file got there
Claude's keystrokes could not paste into the dashboard's editor (a separate frame). Claude placed the approved file on the Mac's clipboard from the commit's raw file (hash checked in the page); **Chad pasted it**; Claude deployed and then read the deployed code back and hashed it. The hash was read twice more, after each settings change: unchanged.

## Order
Created (Hello World) → addresses off → CPU limit → approved code pasted and deployed → hash checked → compatibility date → cron trigger added last → full read-back. The trigger was added only after the code hash matched.

Ticks before 13:00 UTC make no request (from 12:00 they log one `not started` line each).
