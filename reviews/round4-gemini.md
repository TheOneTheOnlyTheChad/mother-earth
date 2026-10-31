Review round 4 audit for *Mother Earth*. Operating strictly from the specification, decisions (D1–D14), and measured constraints. Here are the specific, unvarnished answers to your five problems.

---

### Problem 1 — A stream fed from a laptop

* **Is a 60 s window every 30 min an honest "latest observed" for ships? What would you label it as on the page?**
* *Honesty check:* No, it is not an honest continuous "latest observed" stream if the window only fires for 60 seconds every 30 minutes. That leaves a 29-minute gap where positions are drifting blind while the badge claims current status.
* *The Label:* It must be explicitly labelled as a **"Periodic Sample (30 min cadence)"** rather than real-time telemetry, or the coverage grade must drop to `partial`/`unknown` dynamically based on the age of the ingestion batch. If a vessel moved 10 nautical miles in that 29-minute dark window, treating the 60-second snapshot as "latest" violates the integrity principle.


* **Low message volume (~1 message per vessel per 60 s on a world bbox):**
* This is normal for a global bounding box on free AIS aggregators due to two factors: **server-side spatial thinning/throttling** by the provider to manage bandwidth, and the fact that Class A/B transponders broadcast position reports dynamically based on speed and course alterations (ranging from every 2 seconds at high speed to every 3 minutes at anchor). For global overview tracking, it is plenty for position plotting, but it means voyage metrics will have gaps.


* **Cheaper/more durable than a Pi for a $0/month residential collector:**
* **An old Android phone or TV box (running Termux)** powered via USB. Almost everyone has an old smartphone in a drawer. It draws less than 3W, has built-in battery backup (survives power blips that kill a Pi's SD card), runs a persistent background script via Termux job scheduler or wake locks, and costs $0 out-of-pocket.



---

### Problem 2 — Data piling up

* **Proposed R2 object-lifecycle rules deleting `raw/`, `snapshots/`, `cells/` after 2 days; keeping `latest/*`. Objections?**
* *No operational objections to the deletion rule.* It protects you from crossing the 10 GB free tier cliff.
* *What you will regret:* Deleting historical `snapshots/` entirely will block you from ever building **historical comparisons or diff layers** later. If D1 only retains hourly scalar aggregates (e.g., cell row counts or sums), you lose the spatial vector distributions needed to render past map states (e.g., "show me FIRMS fire spread compared to 7 days ago"). If D1 aggregates store enough spatial index data to rebuild the vector grids, you won't miss the raw files. If they don't, you lose longitudinal analysis forever.



---

### Problem 3 — When does this start costing money?

* **Which limit do you hit first?**
* **D1 Row-Writes / Storage or Workers CPU Time.**
* *The Math:* Writing 40k–70k rows/day to D1 puts you dangerously close to the D1 free tier ceiling of 100k row-writes/day. Adding high-frequency layers like ships (updating 175 cells every 30 min) will push write volume straight through the 100k ceiling. Furthermore, parsing large JSON/CSV payloads (like FIRMS or complex AIS arrays) on the Worker will routinely breach the **10 ms CPU time limit** per invocation under load.


* **First paid line items expected:**
* **Workers Paid ($5/mo base)** to clear the CPU wall-clock/invocation constraints and expand D1 write quotas.
* **R2 overage** ($0.015/GB-month) only triggers if you violate your 2-day deletion rule.
* *(Missing from list)*: **D1 storage/row overages** once historical aggregation deepens.



---

### Problem 4 — Next layers, honestly sourced

* **Evaluating the owner's list:**
* **(b) Deforestation (Global Forest Watch / GLAD-RADD alerts):** *Strongest candidate.* Observation-tier, near-daily pixel alerts, open data. License is open for non-commercial research/public transparency use under GFW terms.
* **(a) Ocean Plastic:** *Reject for live layer.* No daily observation feed exists. Surface macro-plastic drift models are model-tier and run on weekly/monthly lag. Labelling it "observed" would violate the page promise.
* **(c) & (d) Solar Farms & Mining Footprints:** *Static context only.* Global Energy Monitor tracks these as static polygons. They belong as base vector map layers, not dynamic data feeds, because they do not change daily.


* **Which to add first & how to label:**
* Add **Deforestation Alerts (GLAD)** first.
* *Label requirement:* Must be explicitly tagged as **"Observation (Derived Satellite Index)"** with a data-lag note (e.g., 48–72 hour processing delay from satellite capture to grid issuance) to preserve the integrity of "living in the now."



---

### Problem 5 — OpenSky reading

* **Is pulling OpenSky data via a residential IP for unlisted private use "sophistry"?**
* **Yes, it is sophistry.** OpenSky’s terms of use explicitly restrict data access to non-profit research/education and **expressly prohibit operational use in any live product, service, or automated system** without a written commercial or institutional license, regardless of non-profit status.
* Running it via a residential IP to feed a "private unlisted copy" of a public monitoring dashboard is still using the data for an un-exempted operational service workflow. If the pipeline feeds a system intended to become public, or bypasses cloud-server blocks to circumvent their access policy, it breaches their terms.
* *Verdict:* Drop OpenSky from the public project entirely until an official feeder is running and contributing back data directly to their collection network, matching their quid-pro-quo ethos. Do not run covert residential scraping loops.