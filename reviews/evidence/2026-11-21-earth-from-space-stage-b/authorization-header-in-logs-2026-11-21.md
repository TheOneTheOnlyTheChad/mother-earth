# What the hub's invocation records keep of the Authorization header

Read-only, 05:01 UTC 21 Nov 2026, Cloudflare Workers Logs query in Chad's signed-in dashboard pane, Worker `mother-earth`, the
last hour's `fetch` invocation records (98 to 100 records). Values were not printed: only header names, lengths and a
letter/digit mask were returned from the page.

- Each record has `$workers.event.request` with `cf`, `headers`, `method`, `url`, and `$metadata.requestId`, `rayId`, `traceId`.
- Header names present across the records: accept, accept-encoding, accept-language, **authorization**, cache-control,
  cf-connecting-ip, cf-ipcountry, cf-ray, cf-visitor, connection, content-length, content-type, host, referer,
  sec-fetch-mode, user-agent, x-forwarded-proto, x-real-ip.
- `authorization` was present on 2 records, both `POST /ingest…` (the Mac collector). In both the stored value is exactly
  eight asterisks, `********`. No readable key.
- No record in the hour had a query string in its URL.

So on this account the invocation record masks the `Authorization` header's value. This is an observation of two records,
not a documented guarantee: Cloudflare's Workers Logs pages searched the same day do not state the rule. It is to be read
again on the first Stage B record before anything else is concluded from it.

The hub's setting `redact_query_string` is false, which is why the new route refuses any query string.
