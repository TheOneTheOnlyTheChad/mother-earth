# MOTHER EARTH — Phase 1, step 1: deploy the collector

*30 Oct 2026. Dashboard only, no terminal. Budget: about 45 minutes of clicking, in five sittings if you like. Stop at any checkpoint.*

What you are deploying: one Cloudflare Worker (`phase1/worker.js`) that

- every 5 min pulls USGS quakes, NOAA Kp and the OpenSky world picture,
- every minute decides whether a budgeted southern-Africa OpenSky pull is affordable (and lengthens its own cadence past 80 % of the daily credits),
- every 15 min pulls the FIRMS 24-hour fire detections,
- every hour at :07 aggregates the previous hour into D1,
- serves `/snapshot/<layer>`, `/cells/<layer>` and `/status` for the page in step 2.

Everything lands in R2 as timestamped snapshots (the asset) plus a small per-snapshot *cells* file carrying count and coverage for every 4° cell.

Layers in this step: `usgs`, `swpc`, `opensky`, `opensky-bbox`, `firms`.

---

## 0. Before you start — two things to check

**a) Cron triggers.** The Free plan allows **5 cron triggers per account**, and this Worker needs 4. In the Cloudflare dashboard open **Workers & Pages**, click each existing Worker → **Settings** → **Triggers**, and count any Cron Triggers already there. If you have more than 1, tell me and we shorten the list (the per-minute bbox tick is the first to drop).

**b) The CPU question (read this; it decides a $5 line item).** Cloudflare's own limits page (checked 30 Oct 2026, page dated 29 Oct 2026): Free plan = **10 ms CPU per invocation**, cron included. Paid plan ($5/month) = **30 s**. In my sandbox the FIRMS world file (≈10 MB, ≈120 000 rows) costs ≈250 ms of CPU to parse and store, OpenSky world ≈37 ms, USGS and SWPC under 1 ms. Cloudflare's machines are faster than my sandbox, but not 25× faster. So:

- quakes and Kp will run on Free,
- OpenSky world is borderline,
- FIRMS world will not run on Free.

The guide below deploys on **Free first and measures on Cloudflare's hardware** (§5). Then you decide between: Workers Paid at $5/month (the first named non-zero line item; everything else stays free), or staying Free with FIRMS cut to a regional box and OpenSky kept only if it passes. Nothing in the code changes either way except one plain variable.

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

---

## 1. Create the R2 bucket  (≈3 min)

1. Dashboard → left menu **R2 Object Storage** (under *Storage & Databases* in newer layouts).
2. If R2 asks you to **enable R2 / add a payment method**, do it — R2's free allowance (10 GB, 1M writes/month, 10M reads/month) needs a card on file but is not charged below the allowance. Our writes: ≈ (288×4 + 96×5 + 700) ≈ 2 300/day ≈ 70k/month. Fine.
3. **Create bucket** → name: `mother-earth` → Location: *Automatic* → **Create bucket**.
4. Leave it private (no public access, no custom domain). The Worker reads it through a binding.

**Checkpoint:** the bucket shows in the list, empty.

---

## 2. Create the D1 database and load the schema  (≈5 min)

1. Left menu **D1 SQL Database** → **Create database** → name: `mother-earth` → location *Automatic* → **Create**.
2. Open the database → tab **Console**.
3. Open `phase1/schema.sql` on your Mac, select all, copy, paste into the console box → **Execute**.
4. You should see 7 tables under the **Tables** tab: `collector_runs`, `opensky_spend`, `kp_index`, `cell_hourly`, `layer_hourly`, `cell_receipts`, `batch_runs`.

Free D1 allowance: 5 GB, 5M row reads/day, **100k row writes/day**. Our estimate: ≈ 40–70k writes/day once FIRMS and OpenSky are both running (the spec's 15k was optimistic; §6 below). The hourly batch only writes rows that changed, which is what keeps it under.

**Checkpoint:** 7 tables listed.

---

## 3. Create the Worker and paste the code  (≈5 min)

1. Left menu **Workers & Pages** → **Create** → **Create Worker** (or *Start with Hello World*).
2. Name: `mother-earth` → **Deploy** (this deploys the hello-world placeholder; fine).
3. Click **Edit code**. Delete everything in the editor. Open `phase1/worker.js` on your Mac, select all, copy, paste. **Deploy** (top right).
4. Note the Worker URL — it looks like `https://mother-earth.<your-subdomain>.workers.dev`. Open it in a browser tab: you should see a small JSON with `"name": "Mother Earth collector"`. (If you get an error instead, the paste was incomplete — the file is 600 lines and ends with `};`.)

**Checkpoint:** the Worker URL answers with JSON.

---

## 4. Bind storage, add secrets, add cron triggers  (≈10 min)

Open the Worker → **Settings**.

### 4a. Bindings
Under **Bindings** → **Add** (or *Add binding*):
- Type **R2 bucket** → Variable name: `R2` → Bucket: `mother-earth` → Save/Deploy.
- Type **D1 database** → Variable name: `DB` → Database: `mother-earth` → Save/Deploy.

The variable names must be exactly `R2` and `DB` (capitals).

### 4b. Secrets and variables
Under **Variables and Secrets** → **Add**:

| Type | Name | Value |
|---|---|---|
| Secret | `OPENSKY_CLIENT_ID` | from opensky-network.org → your account → **API Client** → *Create new client* (the client ID, not your username) |
| Secret | `OPENSKY_CLIENT_SECRET` | the secret shown once when you create that client |
| Secret | `FIRMS_MAP_KEY` | your NASA FIRMS map key (32 hex characters) |
| Secret | `ADMIN_KEY` | any long random string you invent, e.g. 3 words and a number; it lets you trigger runs by hand (§5) |
| Text (plain) | `OPENSKY_BBOX` | `-35.5,15,-21,34` (southern Africa; optional — this is the default) |

Click **Deploy** after adding them. Secrets can't be read back later, so keep the values in `KEYS.md` in the project folder (never in the repo).

### 4c. Cron Triggers
Under **Triggers** (sometimes **Trigger Events**) → **Cron Triggers** → **Add**. Add these four, exactly:

| Cron | What it runs |
|---|---|
| `*/5 * * * *` | USGS + SWPC + OpenSky world |
| `* * * * *` | OpenSky bbox tick (budget-gated; skips minutes divisible by 5) |
| `*/15 * * * *` | FIRMS |
| `7 * * * *` | hourly aggregation into D1 |

The Worker recognises the job by the cron string, so the strings must match exactly (no extra spaces).

### 4d. Logs (so we can measure)
Under **Observability** (or **Logs**) → enable **Workers Logs**. Free allowance is 200k log events/day; we produce ≈ 2 000.

**Checkpoint:** Settings shows 2 bindings, 4 secrets, 1 variable, 4 cron triggers, logs on.

---

## 5. First runs and the measurements  (≈10 min, then wait an hour)

### 5a. Fire the collectors by hand
In a browser, open (replace `<URL>` with your Worker URL and `<KEY>` with your `ADMIN_KEY`):

1. `<URL>/admin/run/five?key=<KEY>` — runs USGS + SWPC + OpenSky world. Expect JSON like `{"job":"five","result":"five-minute collectors ran","wall_ms":…}`.
2. `<URL>/admin/run/firms?key=<KEY>` — runs FIRMS. This is the heavy one.
3. `<URL>/status` — shows the last run per layer. Look at `status` per layer:
   - `ok` — good.
   - `down` with note `no OpenSky secrets set` / `no FIRMS key set` — a secret is missing or misnamed.
   - `down` with note `token http 401…` — OpenSky client ID/secret wrong.
   - `down` with note `http 401/403` on firms — FIRMS key wrong.
4. `<URL>/snapshot/usgs` — the full quake snapshot. `<URL>/cells/opensky` — the small cells file.

### 5b. Read the CPU time (the decision point from §0b)
Worker → **Metrics** (or **Observability → Metrics**). Find **CPU time** (shown as percentiles, p50/p99/max) and **Errors**. Then Worker → **Logs** → look for the admin-run invocations.

Record three numbers for me, from the Metrics page after the two manual runs:
- max CPU time (ms),
- error count,
- whether the FIRMS run logged `firms ran` or an error like *Worker exceeded CPU time limit* / *Error 1102*.

Also from `/status`, copy `note` for the `opensky` row (it contains `remaining=` and `world_cost=`) and the `firms` row (`raw_bytes=`).

What the outcomes mean:

| You see | Meaning | Next |
|---|---|---|
| all `ok`, max CPU < 10 ms | Free plan carries everything | nothing to buy; carry on |
| firms errors / CPU limit, opensky `ok` | expected case | choose: Paid $5/mo, **or** stay Free and add a plain variable `FIRMS_REGION` = `-20,-35,55,38` (Africa, as west,south,east,north) so fires are regional and labelled so in every snapshot |
| opensky also fails on CPU | Free can only carry quakes + Kp | Paid $5/mo is the honest route for Phase 1's three layers |

I will not assume the answer; the number from Cloudflare's own Metrics page decides it.

### 5c. Let the crons run for an hour, then check
- `/status` → `opensky_spend_today`: `world_cost` should read 4, `bbox_cost` 3 (measured from the `X-Rate-Limit-Remaining` header), `credits_used` climbing at ≈ (4 × 12 + 3 × ~25) ≈ 120/hour → ≈ 2 900/day, under the 80 % soft line (3 200). If `bbox_cost` reads 4, the box is bigger than OpenSky's 400 sq-degree step and the tick will self-limit to ≈ every 3 min. Either is fine; it's measured.
- D1 → **Console** → run `SELECT * FROM batch_runs ORDER BY id DESC LIMIT 3;` — after the first :07 there should be a row whose `result` names opensky/usgs/firms with `changed` counts.
- `SELECT layer, hour_utc, snapshots_ok, source_status FROM layer_hourly;` — one row per layer per hour.
- `SELECT COUNT(*) FROM cell_hourly;` — growing.
- R2 → bucket → folders `snapshots/`, `cells/`, `latest/`, `latest-cells/`, `raw/firms/`, `state/`.

**Checkpoint:** one hourly batch row; `/status` shows all layers `ok` (or the specific down reasons from 5b). Send me the three numbers and the two notes.

---

## 6. What changed from SPEC v0.3 (to be written up as the v0.4 diff)

| # | Change | Why |
|---|---|---|
| D1 | One Worker, not one per layer | Packaging only. One paste, one set of bindings. Same code path per layer. |
| D2 | Hourly aggregation at :07, not nightly 02:00 | A nightly run would parse ≈700 R2 files inside one invocation's CPU budget. Hourly reads ≈15. Aggregates identical; raw stays re-derivable. |
| D3 | Snapshot records are rows + a declared field list | Same §5 model; ≈3× cheaper to produce and send. |
| D4 | OpenSky hourly quantity = mean (and max) of "unique aircraft per cell per 5-min snapshot" | That is the per-interval quantity §5 names, bucketed. Not occupancy. |
| D5 | USGS cells carry `count` (M2.5+) and `count_m45` (M4.5+) | USGS documents global completeness at M4.5, not M2.5. M4.5+ is the quantity that can ever be graded adequate. |
| D6 | Zeros are not rows | 4 050 cells × 3 layers × 24 h = 290k rows/day > the 100k D1 budget. `layer_hourly.adequate_cells` records which cells were adequately observed; an adequate cell with no `cell_hourly` row is a true zero. This *is* the coverage record §4.2 relies on. |
| D7 | CPU, not subrequests, is the binding free-tier constraint | Measured: FIRMS ≈250 ms, OpenSky ≈37 ms, in-sandbox. Decision deferred to Cloudflare's own Metrics (§5b). |
| D8 | D1 write budget estimate revised to ≈40–70k/day | Spec's 15k assumed far fewer active cells. Still under 100k because only changed rows are written. Confirm from D1's metrics after day one (spec §9.5). |
| D9 | Receipt history is the phase-1 proxy for OpenSky receiver coverage | Spec §12 Q1 left this open. A cell is `adequate` only after it has produced at least one observation in an ok snapshot *and* the hour was ≥90 % observed. Until then `partial`. |
| D10 | USGS and FIRMS cells are `partial` in phase 1, never `adequate` | USGS: no M2.5 completeness map wired. FIRMS: no pass schedule wired; cloud invisible. The evidence strings say exactly this. Comparisons (phase 3+) will not run on them until those are wired. |

Nothing here lets the display say more than was observed; D10 makes it say less.

---

## 7. Register — what step 1 lets you date

After §5 succeeds you can date these checks in the spec's §2 table:

| Layer | Endpoint | Access | Sample |
|---|---|---|---|
| USGS | ✓ (sample in R2 `snapshots/usgs/`) | n/a | ✓ |
| SWPC | ✓ | n/a | ✓ |
| OpenSky | ✓ | ✓ (OAuth2 client works) | ✓ |
| FIRMS | ✓ | ✓ | ✓ if parse ran; raw-only if CPU-limited |

**Terms** and **Coverage** still need you to read the five licence pages and quote the clause with URL and date (spec §2, §8). Those pages:
- USGS: https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits
- NOAA SWPC: https://www.swpc.noaa.gov/content/disclaimer (and https://www.weather.gov/disclaimer)
- NASA GIBS: https://nasa-gibs.github.io/gibs-api-docs/ (section on usage/attribution)
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/ (footer → *Data policy*; and https://www.earthdata.nasa.gov/engage/open-data-services-software-policies)
- OpenSky: https://opensky-network.org/about/terms-of-use

I can't open those from the sandbox (host allowlist) — that's why they're your step.

---

## 8. Step 2 preview

Once §5 is green: the page. `index.html` is rewritten to read `/cells/*` first (small, fast) and `/snapshot/*` second, draws activity and hatching from the cells file, runs the three freshness checks client-side from `retrieved_at`, `observed_at` and `coverage`, generates the status sentence, and shows the read-only Choices panel listing every value in this Worker's header. Then repo + Pages.
