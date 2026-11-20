# Live hub settings, read 20 Nov 2026 about 09:00 UTC

Read only, from the Cloudflare dashboard's Settings page for the Worker `mother-earth` (production), in the browser pane, Chad signed in. Nothing was changed.

| Setting | As shown |
|---|---|
| Compatibility date | 2026-10-30 |
| Compatibility flags | none listed |
| Placement | Default |
| Cron triggers | every 5 minutes; every 15 minutes; at 7 minutes past the hour; at 11 and 41 minutes past the hour |
| CPU Time Limit (ms) | the label was present; no value was legible in the page text |

`phase1/wrangler.toml` in the repo is a reference file and says 2026-10-01 and other cron lines; the dashboard is what is deployed. The probe's
configuration uses the dashboard's compatibility date and no flags.
