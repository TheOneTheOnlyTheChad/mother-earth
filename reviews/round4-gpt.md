Bro, **the hub design still holds, but this review found real implementation gaps—not just future risks.** The biggest corrections are the ships timestamps, the assumption that ships need residential hardware, and the traffic calculation.

I inspected the public page, `/status`, `/cells/ships`, `/cells/usgs`, `/snapshot/co2`, and the repository’s current Worker, Mac collector, schema, status and register. **The globe could not render in my browser because WebGL was disabled**, so visual verification is incomplete; the page source and endpoint checks below are direct observations. `SPEC-v0.3.md` was absent from the public repository tree, so spec compliance cannot be fully audited.

**1. Ships: acceptable sampling, but fix the metadata and reconsider hosting**

A 60-second sample every 30 minutes is honest **if the sampling interval and timestamps are visible beside the count**.

Suggested wording:

> **3,838 vessel identities received during a 60-second AIS sample ending 08:35 UTC. Sampled approximately every 30 minutes while the collector is available. Receiver coverage incomplete; current positions unknown between samples.**

Use “latest received position per MMSI in this sample.” That precisely describes what you retain.

The listening duty cycle is **60/1,800 = 3.33%**, or about **3.27%** using the reported 58.8 seconds. Your three-hour stale threshold is a display policy; it doesn’t make a three-hour-old position current. Show age immediately, then suppress or clearly mark historical points at the threshold.

The message ratio **does not establish server-side thinning**. AISStream documents filtering, vessel activity, upstream interruptions, latency and slow-consumer drops as influences, and provides no durable replay or delivery guarantee. Compression avoids one documented dropping mechanism; it doesn’t establish completeness. [AIS Stream](https://www.aisstream.io/documentation?utm_source=chatgpt.com)

It matters even for latest positions: missing messages can omit vessels or leave older positions. It doesn’t invalidate “latest position **received by us**.”

Three concrete bugs in `phase1/collector-mac.mjs`:

- **Missing/invalid source time becomes `nowIso()` and is published as `observed_at`.** Preserve unknown source time and record receipt time separately. This currently allows the display to claim more than the source supplied.
- **`socket_up_s` ends at `lastMsgAt`, not socket closure/sample end.** A connected but quiet socket looks disconnected. Measure connection duration separately from message activity.
- **`vessels.set()` always replaces the previous position.** That retains the last arrival, which may have an older source timestamp. Define whether “latest” means arrival order or source time and implement that rule.

The live endpoint also copies `observed_fraction: 0.98013` into every populated cell. That number measures neither geographic coverage nor observation of each vessel. Rename it to a collector-level field such as `connection_fraction_of_sample`.

**The hosting assumption is wrong:** Durable Objects are available on Workers Free with **13,000 GB-s/day** included duration. One allocated 128 MB object running all day is approximately **10,800 GB-s/day** using 0.125 GB. Outgoing sockets cannot hibernate, but wall-clock metering alone does **not** make this paid-only. [Cloudflare Durable Objects docs](https://developers.cloudflare.com/durable-objects/platform/pricing/?utm_source=chatgpt.com)

**Test a Free Durable Object for the existing sampling schedule before buying hardware for ships.** Verify source access, compression support, CPU, reconnects and request accounting. Continuous collection needs a separate budget: extrapolating your sample rate gives about **5.7 million messages/day**, potentially exceeding the DO request allowance even with its documented 20:1 WebSocket billing ratio. That extrapolation is a test hypothesis, not measured continuous usage.

Residential access remains necessary for your demonstrated OpenSky situation; it has not been established as necessary for AISStream.

**2. Retention: approve lifecycle rules, with explicit losses**

**Adopt D12 through lifecycle rules** for `raw/`, `snapshots/` and `cells/`, leaving **both `latest/` and `latest-cells/` untouched**.

At 180 MB/day, two days is approximately **360 MB** of retained history. Allow operational slack: Cloudflare says deletion typically happens within 24 hours after expiration, rather than exactly at hour 48. [Cloudflare R2 docs](https://developers.cloudflare.com/r2/buckets/object-lifecycles/?utm_source=chatgpt.com)

But hourly aggregates do not preserve everything:

| Lost after deletion | Consequence |
|---|---|
| Original records and source revisions | Historical counts cannot be independently reconstructed. |
| Per-vessel observations | Cannot later calculate tracks or different sampling statistics. |
| Detection attributes | Cannot retrospectively change confidence/FRP filters. |
| Individual sample times and interruptions | Cannot reconstruct a matched sampling comparison from counts alone. |

**There is currently no ships hourly aggregation in `hourlyBatch()`.** It calls OpenSky, USGS and FIRMS aggregation. Deleting ships snapshots therefore removes their historical observations without a corresponding ships baseline.

Before expiry, retain small durable metadata: snapshot ID/hash, source and processor versions, exact window, sampling schedule, successful samples, coverage evidence and aggregation version. A hash identifies deleted evidence; it does not make it reproducible.

Two existing aggregation issues also need resolving before calling D1 a dependable baseline:

- `upsertChanged()` updates/inserts present cells but doesn’t remove rows when a source revision removes the last event from a cell/hour. Old counts can survive a correction.
- Backfilled USGS event hours receive the currently processed hour’s `okRuns / 12`. That is not those historical hours’ sampling coverage.

Keep the short retention, but explicitly accept **“limited replay and reprocessing after expiry.”**

**3. Cost cliff: CPU first; traffic is sessions and refreshes, not just page views**

**You already exceed the nominal CPU allowance at zero viewers.** A measured 15 ms FIRMS parse exceeds Free’s 10 ms limit. Cloudflare permits occasional overruns but can terminate consistently excessive execution. The 4 MB guard does not protect a 1.3 MB input that already exceeds the budget. [developers.cloudflare.com](https://developers.cloudflare.com/workers/platform/limits/?utm_source=chatgpt.com)

There are two corrections to the request estimate:

- `index.html` currently requests **six cells endpoints plus three snapshots = nine requests per refresh**.
- It repeats that cycle **every five minutes**, with `cache: 'no-store'`.

The repository’s reference cron configuration lists four schedules totalling **1,848 invocations/day**, not 320. This includes a minute OpenSky job; `/status` confirms OpenSky attempts are still occurring despite the source being parked. Verify deployed configuration, then disable those failed jobs.

Using 1,848 as background invocations, the approximate remaining request budget is **98,152/day**:

| Viewer behaviour | Approximate ceiling before 100k/day |
|---|---:|
| One nine-request cycle per visit | **10,906 visits/day** |
| Six cycles during a session | **1,817 sessions/day** |
| Twelve cycles during a session | **909 sessions/day** |
| Continuously open pages, 288 cycles/day | **37 equivalent concurrent pages** |

These exclude retries, bots, preflights, admin calls and other traffic. Recalculate with measured deployed background usage.

Other limits:

| Resource | Assessment |
|---|---|
| D1 writes | **40–70k/day is independent of viewers** for the snapshot-reading page. Verify billed rows, including index maintenance and deletes. |
| D1 storage | Missing limit: **500 MB per Free database**, despite 5 GB account-wide. |
| D1 reads | Published snapshot reads use R2, not D1. `/status` does query D1; repeated scans of growing run history deserve measurement. |
| R2 Class A | 2.9k in 36 hours extrapolates to roughly **58k/month**—well below 1M at that rate. |
| R2 Class B | At nine R2 reads/cycle, 10M/month is roughly **37k cycles/day**, before collector reads. Workers requests likely constrain this design earlier. |
| GitHub bandwidth | Applies to bytes served by GitHub Pages, **not** FIRMS JSON served by your Worker or imagery served by NASA. |

Cloudflare confirms D1’s billed index writes and per-database limit; GitHub confirms the 100 GB/month soft Pages limit. [Cloudflare D1 docs](https://04ce0f9a.previews.developers.cloudflare.com/d1/platform/pricing/?utm_source=chatgpt.com)

Your expected paid items are reasonable, with qualifications:

- **Workers Paid: $5/month minimum**, with usage beyond included allowances possible.
- **R2:** storage and Class A/B overages are separate; Standard storage is $0.015/GB-month above allowance, with free egress.
- **Hardware:** complete basket plus electricity; not yet priced.

R2’s 10 GB allowance is **GB-month**, so crossing 10 GB momentarily is not itself the full billing calculation. [Cloudflare R2 docs](https://developers.cloudflare.com/r2/pricing/?utm_source=chatgpt.com)

My trigger recommendation: **resolve FIRMS headroom now; review D1 at 80k measured billed writes/day; review viewer request usage at 70k/day.** Those last two are operating thresholds I recommend, not provider limits.

**4. Next layers: forest disturbance first, with revised naming**

The rule needs one clarification: **a product updated daily does not observe every location daily.** Also, “observed” products can contain substantial algorithmic interpretation. State the processing method consistently across layers.

| Requested layer | Best defensible candidate | Cadence and reuse | Honest label |
|---|---|---|---|
| Ocean plastic | No suitable open global daily observation feed verified | ESA has demonstrated satellite detection of litter accumulations, with limited plastic-detection capability; this isn’t a daily global plastic census. | Defer; consider a separately labelled survey or model later. |
| Deforestation | **GFW/GNW integrated disturbance alerts**, or a narrower GLAD/RADD implementation | Current integrated product includes **GLAD-L, GLAD-S2, RADD and DIST-ALERT**. Dataset metadata lists CC BY 4.0. Daily updates do not imply daily observation everywhere. | **Satellite-derived vegetation disturbance alerts**, with confidence and detection date. |
| Solar farms | **Global Solar Power Tracker** | Periodic facility inventory, not daily operation or generation. CC BY 4.0 generally; **TZ-ID records have CC BY-NC 4.0 terms**. | **Solar facility inventory — release date; reported status/capacity.** |
| Mining | **Maus et al. global mining polygons, Version 2** | Static mapped footprint dataset; **CC BY-SA 4.0**. Covers 44,929 polygons, not current daily activity. | **Mapped surface-mining footprints — dataset vintage.** |

Sources support the plastic limitation, updated integrated-alert composition and licences. [esa.int](https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Monitoring_marine_litter_from_space_is_now_a_reality?utm_source=chatgpt.com)

The explicit RADD licence sentence is:

> “The data is licensed under a Creative Commons Attribution 4.0 International License”

Its publisher also describes forest-baseline limitations and possible false detections. [WUR](https://www.wur.nl/en/research/products-services/radd-forest-disturbance-alert?utm_source=chatgpt.com)

**Add forest disturbance first.** But don’t label it “deforestation per day.” Detection date is not necessarily the date clearing happened; vegetation disturbance can include causes other than permanent forest conversion. GLAD explicitly advises against using its alert system for area estimates. [GLAD](https://www.glad.geog.umd.edu/dataset/glad-forest-alerts?utm_source=chatgpt.com)

Suggested tile:

> **Vegetation disturbance alerts · satellite-derived · latest published detections · confidence shown · observation opportunities vary**

If you restrict to forests, record the forest mask and its vintage. Don’t simply add alert pixel counts from overlapping systems.

The recalled Chinese panel-washing/dust incident remains unidentified. A facility inventory cannot substantiate it or show current panel cleanliness.

**5. OpenSky: agree, but “unlisted” is still public**

Your reading matches the email supplied:

- Private hobby collection/use within credits: permitted under the stated conditions.
- Public website: additionally requires feeding.
- Cloud whitelisting: unavailable.

**An unlisted URL without access control is public-facing.** A local page on your Mac, or a genuinely authenticated private deployment with protected data endpoints, is a reasonable private interim.

Importantly, the Worker’s public `LAYERS` list already includes `opensky` and `opensky-bbox`. **If private collection publishes aircraft data through those unauthenticated endpoints, hiding the aircraft toggle doesn’t keep the data private.** Use separate private storage/access paths.

Preserve Ticket 837506 and its conditions as dated guidance. The reply doesn’t specify the same uptime threshold as the separate feeder credit boost; don’t silently equate those two rules.

**Specific page and decision corrections**

These should precede the next layer:

- **D11 is only partly implemented.** Ingest uses one shared key, derives identity from caller-supplied `User-Agent`, and has no explicit idempotent snapshot ID or protection against older uploads replacing newer `latest` data. Minute-based filenames can collide. Implement the previously agreed contract.
- **Publication is not one coherent snapshot.** `/cells/*` and `/snapshot/*` are fetched separately from independently overwritten objects. Require matching snapshot IDs; a failed records fetch currently leaves old points available alongside newer counts.
- **Unknown earthquake points disappear, but rings do not:** `ringsData()` checks the toggle, not freshness. Stale rings can continue.
- **“Observed throughout the window” overstates adequacy.** Continuous collection isn’t complete source coverage; your aggregation code also permits adequacy at 90% sampling.
- **“Count is a floor” is too strong generally.** False detections, identity problems and source revisions prevent a guaranteed lower bound on the real phenomenon. Prefer **“records observed; incomplete coverage.”**
- **CO₂ comparison needs its own date visible.** The inspected snapshot’s daily value is 29 October, while the comparison week starts **18 October**.
- **WebGL failure strands everything at “LOADING”.** Catch globe initialization failure and continue loading text/index tiles, with a clear globe-unavailable message.
- **Escape source-supplied text before `innerHTML`.** Vessel names currently reach inspector HTML directly.
- **REGISTER overstates AISStream clearance.** Its proxy guidance supports serving clients, but “free API” and no located licence page do not establish unrestricted archival/redistribution rights. Record the actual evidence and unresolved scope.

**Keep D1’s hub choice, D10’s partial coverage, D12’s short retention and D14’s precise failure status. Amend D7/D8 with measured usage, complete D11, and fix the observation metadata before expanding the globe.**