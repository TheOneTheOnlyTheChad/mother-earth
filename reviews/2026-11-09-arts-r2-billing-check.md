# Arts — read-only R2 billing check before the upload approval (rev 2, 9 Nov 2026)

**Rev 2 (GPT's review of rev 1; targeted read-only check 05:44 UTC + documentation correction):** (1) account-wide usage established (§3a); (2) proportional estimates separated from possible invoice increments under billing-unit rounding (§4); (3) the 18 unclassified operations left unknown and bounded at the Class A price (§1, §3); (4) cache wording corrected: `arts.js` fetches with `cache: 'no-store'`, so no browser-cache saving is assumed (§4). GPT independently confirmed the published Standard allowances and rates and reproduced the rev 1 operation totals and 30-day projections; the subscription and dashboard readings remain Claude-supplied evidence.

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
- Not stated on the page: whether a "GB" here is decimal or binary (both shown below); the billing unit for operations (prices are quoted per million; whether a crossing is billed as a whole million is not stated in what was read); the class of `GetBucketSippyConfiguration` and `GetBucketNotificationConfiguration` (**classification unknown**; bounded below at the Class A price, the more expensive one).

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
| B (GetObject 28,726; HeadObject 2,832; HeadBucket 121; GetBucketLifecycleConfiguration 27; GetBucketCors 3) | **31,709** | ~97,500 | 10,000,000 | ~1.0 % |
| Unclassified (GetBucketSippyConfiguration 3; GetBucketNotificationConfiguration 15) — class unknown | **18** | ~55 | — | if all were Class A: +~0.006 % of the A allowance |
| Free (DeleteObject) | 72 | — | — | — |

**So, as estimated, the project's current R2 usage sits inside the free allowances**, and the R2 cost for this period is expected to be **$0.00**. This is an estimate from analytics, not an invoice; the invoice figure is unknown until the period closes.

## 3a. Account-wide (targeted re-read, 9 Nov 05:44 UTC)
- **Buckets on the account: one, `mother-earth`** — the Cloudflare connector's bucket list (count 1) and the dashboard's `GET /r2/buckets` agree.
- **Account-wide analytics** (GraphQL with no bucket filter, grouped by bucket and storage class): storage appears only for `mother-earth` (Standard; the Infrequent Access row is 0 bytes, 0 objects); operations appear only for `mother-earth`, plus `ListBuckets` (19), which belongs to no bucket.
- Account-wide figures at 05:44 UTC (9.774 days): **Standard storage peak 0.83 GB; Class A 24,355; Class B 31,802; unclassified 18; free (DeleteObject) 74.** Projected for 30 days (linear estimate): Class A ~74,750 (~74,810 if the 18 unclassified were all Class A = **7.48 %** of 1 M); Class B ~97,600 (**0.98 %** of 10 M); storage ~0.77 GB-month.
- **Limitation:** these are analytics, not billing records. Shared account allowances are assumed to apply account-wide as the pricing page describes; no other R2 product (Infrequent Access, data catalog, R2 SQL) shows usage. Remaining headroom is therefore **estimated from account-wide analytics, not verified against an invoice**.

## 4. Expected increment from the Arts file
**Proportional usage** (what the file adds to the meters):
| Item | Amount added |
|---|---|
| Storage | 127,887 B = 0.000128 GB → +0.000128 GB-month (~0.0013 % of the 10 GB-month allowance) |
| Upload procedure (once) | 1 PutObject (Class A) + ~2 reads for the absence pre-check and read-back (Class B) |
| Viewer reads | **1 GetObject (Class B) per `/snapshot/arts` request that reaches the hub.** `arts.js` fetches with `cache: 'no-store'`, so no browser-cache saving is assumed; every switch-on that reaches the hub is one Class B read |

**Possible invoice increments** (kept separate from the proportional figures above). The pricing page says usage is rounded up to the next billing unit (its example: 1.1 GB-month is billed as 2). So an increment is not the proportional cost; it can be a whole unit, and only if the usage crosses a boundary above the free allowance:
| Meter | At today's account-wide usage (estimate) | If usage were at or past the free allowance |
|---|---|---|
| Storage | inside the 10 GB-month allowance (~0.77 projected) → **$0.00** | the file could move the rounded total across a whole-unit boundary → at most **+1 GB-month = $0.015** for that period |
| Class A (the upload's 1 PutObject) | ~7.5 % of the allowance → **$0.00** | if that one operation crossed a billing-unit boundary, up to one whole unit; **if the unit is a million (not stated), up to $4.50** |
| Class B (reads) | ~1 % of the allowance → **$0.00**; ~9.9 M further reads a month before the allowance is reached | each boundary crossed adds up to one whole unit; **if the unit is a million, up to $0.36 per crossing** |

**Corrected conclusion (estimate, not a guarantee):** at the account's current usage, the Arts upload and its reads are expected to add **$0.00** to the R2 invoice. Every meter is far from its allowance (storage ~8 %, Class A ~7.5 %, Class B ~1 %, projected), and the file's own increment is negligible against each. A non-zero increment would require the account to reach a free allowance from other usage first; it would then be bounded by whole units, as above, not by the tiny proportional figures. The allowances and prices are as published on 30 Oct 2026 and can change.

## 5. Unknowns and what this check does not cover
- The invoice for this period (not read; analytics only).
- Whether "GB" is decimal or binary (both shown; it changes nothing here).
- The billing unit for operations (prices are per million; whole-unit billing at a crossing is assumed only as a bound).
- The class of two bucket-configuration actions (18 requests; left unknown, bounded at the Class A price; too few to change the conclusion).
- **Worker side, not R2:** each `/snapshot/arts` request is also a Worker request with some CPU (0.6 ms median locally; production unmeasured). Workers Paid allowances were **not** re-read in this check, so that line is unassessed here.
- Actual future traffic to the card (unknown; the estimates assume today's rate for everything else).

## 6. Status
This completes the read-only R2 billing check the proposal requires before the upload approval. **Nothing is approved:** the upload, hub deployment, merge and page release each remain separate later approvals. When Chad chooses, the upload line is:
`Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644) to R2`
