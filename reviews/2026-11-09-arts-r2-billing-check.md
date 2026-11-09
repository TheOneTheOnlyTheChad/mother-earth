# Arts — read-only R2 billing check before the upload approval (9 Nov 2026)

**Scope:** read only. Published R2 pricing, the account's subscriptions, the bucket's metadata and this billing period's R2 usage. Nothing written, uploaded, deployed, merged or released. Read 9 Nov 2026, 05:20–05:30 UTC, by Claude (pricing page via web fetch; account and usage through the Cloudflare dashboard session in the browser pane: `GET /subscriptions` and the dashboard GraphQL analytics API; bucket via the Cloudflare connector).

## 1. Applicable allowances (published)
Cloudflare R2 pricing page, https://developers.cloudflare.com/r2/pricing/ ("Last updated Oct 30, 2026"; read via web fetch, so the quotations are as returned by that tool):
| | Free each month | Price beyond |
|---|---|---|
| Standard storage | 10 GB-month | $0.015 / GB-month |
| Class A operations | 1 million | $4.50 / million |
| Class B operations | 10 million | $0.36 / million |
| Egress | free | — |
- "A GB-month is calculated by averaging the *peak* storage per day over a billing period (30 days)." "Cloudflare rounds up your usage to the next billing unit."
- The free tier applies to **Standard** storage only (not Infrequent Access).
- Class A includes `PutObject`, `ListObjects`, `ListBuckets`, `PutBucket`, `ListMultipartUploads`, `PutBucketLifecycleConfiguration` (and others). Class B includes `GetObject`, `HeadObject`, `HeadBucket`, `GetBucketCors`, `GetBucketLifecycleConfiguration` (and others). Free: `DeleteObject`, `DeleteBucket`, `AbortMultipartUpload`.
- **The page does not say R2 is included in Workers Paid.** It says the bucket allowance "applies regardless of your Workers plan".
- Not stated on the page: whether a "GB" here is decimal or binary (both shown below); the class of `GetBucketSippyConfiguration` and `GetBucketNotificationConfiguration` (counted as Class B below, the more expensive assumption for reads).

## 2. The account (read 9 Nov 2026)
- **Subscriptions** (`GET /accounts/<acct>/subscriptions`), all monthly, current period **30 Oct 2026 11:09:40 UTC → 30 Nov 2026 00:00 UTC**:
  - **R2 Paid** — base price **$0**, usage-billed components for R2 storage and Class A/B operations (plus Infrequent Access, data catalog and R2 SQL components, unused here). **A separate subscription from Workers Paid.**
  - **Workers Paid** — $5/month (its components are Workers, KV, D1, Durable Objects, etc.; **no R2 component**).
  - Images Stream Basic — $0 (unused by the project).
- **Bucket** `mother-earth` (connector): storage class **Standard**, location WEUR, jurisdiction default, created 30 Oct 2026.

## 3. Current usage this billing period (R2 analytics, 30 Oct 11:09 → 9 Nov 05:27 UTC = 9.76 days)
**Not from an invoice:** the figures come from the dashboard's R2 analytics. Cloudflare's billing may differ in timing and rounding.

**Storage (daily peak, payload + metadata):** 0.26 GB on 30 Oct (first day), rising to 0.83 GB (decimal; 0.77 GiB) on 8–9 Nov; 2,604 objects.
- GB-month so far in the period: **0.25** (decimal) / 0.23 (binary).
- **Estimate** for the whole period, with the remaining days at today's peak: **0.77 GB-month** (decimal) / 0.72 (binary) → billed as **1 GB-month** after rounding up. **Free tier: 10.** History retention grows storage slowly; even several times today's size stays inside the free tier.

**Operations so far** (by action, bucket `mother-earth`):
| Class | Count so far | Estimate for 30 days (linear) | Free | Share of free (estimate) |
|---|---|---|---|---|
| A (PutObject 23,162; ListObjects 1,130; ListMultipartUploads 23; ListBuckets 16; PutBucketLifecycleConfiguration 3; PutBucket 1) | **24,335** | ~74,800 | 1,000,000 | ~7.5 % |
| B (GetObject 28,726; HeadObject 2,832; HeadBucket 121; GetBucketLifecycleConfiguration 27; GetBucketCors 3; + 18 unlisted counted as B) | **31,727** | ~97,500 | 10,000,000 | ~1.0 % |
| Free (DeleteObject) | 72 | — | — | — |

**So, as estimated, the project's current R2 usage sits inside the free allowances**, and the R2 cost for this period is expected to be **$0.00**. This is an estimate from analytics, not an invoice; the invoice figure is unknown until the period closes.

## 4. Expected increment from the Arts file
| Item | Amount | Cost at current usage (estimate) | Cost if the free tier were already used up |
|---|---|---|---|
| Storage | 127,887 B = 0.000128 GB → +0.000128 GB-month | $0.00 (inside the 10 GB-month; still billed as 1 GB-month after rounding) | ~$0.000002 / month |
| Upload procedure (once) | 1 PutObject (A) + ~2 reads for the absence pre-check and read-back (B) | $0.00 | < $0.00001 |
| Viewer reads | **1 GetObject (Class B) per `/snapshot/arts` request that reaches the hub.** The hub reads R2 on every request; `max-age=60` only lets the same browser reuse a response for 60 s, so it does not reduce reads across viewers | $0.00 while total Class B stays under 10 M/month (headroom ~9.9 M at the current rate) | $0.36 per million switch-ons |

**Bottom line (estimate):** no new R2 cost line is expected. The file adds about 0.00128 % of the storage allowance, and reads would need roughly 9.9 million switch-ons a month, on top of today's traffic, before Class B is charged. **Not a guarantee:** the allowances and prices are as published on 30 Oct 2026 and can change; the usage is from analytics, not an invoice.

## 5. Unknowns and what this check does not cover
- The invoice for this period (not read; analytics only).
- Whether "GB" is decimal or binary (both shown; it changes nothing here).
- The class of two bucket-configuration actions (18 requests; counted as B).
- **Worker side, not R2:** each `/snapshot/arts` request is also a Worker request with some CPU (0.6 ms median locally; production unmeasured). Workers Paid allowances were **not** re-read in this check, so that line is unassessed here.
- Actual future traffic to the card (unknown; the estimates assume today's rate for everything else).

## 6. Status
This completes the read-only R2 billing check the proposal requires before the upload approval. **Nothing is approved:** the upload, hub deployment, merge and page release each remain separate later approvals. When Chad chooses, the upload line is:
`Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644) to R2`
