-- MOTHER EARTH — D1 schema, Phase 1 step 1
-- Paste the whole file into the D1 console and run it once.

-- Every collector run (one row per layer per run). Also the audit trail for §10.2.
CREATE TABLE IF NOT EXISTS collector_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layer TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  status TEXT NOT NULL,          -- ok | degraded | down | skipped
  http_status INTEGER,
  records INTEGER,
  bytes INTEGER,
  note TEXT
);
CREATE INDEX IF NOT EXISTS collector_runs_layer ON collector_runs (layer, id);

-- OpenSky credit budget per UTC day (§4.3). Costs are measured from X-Rate-Limit-Remaining, not assumed.
CREATE TABLE IF NOT EXISTS opensky_spend (
  day TEXT PRIMARY KEY,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_remaining INTEGER,
  world_cost INTEGER,
  bbox_cost INTEGER,
  last_bbox_at TEXT,
  world_pulls INTEGER NOT NULL DEFAULT 0,
  bbox_pulls INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

-- Kp index, one row per 3-hour value (written by the SWPC collector when a new time_tag appears).
CREATE TABLE IF NOT EXISTS kp_index (
  time_tag TEXT PRIMARY KEY,
  kp REAL NOT NULL,
  retrieved_at TEXT NOT NULL
);

-- Hourly cell aggregates, derived from R2 cell files by the hourly batch (§4.2). Re-derivable.
-- Zeros are NOT rows: see layer_hourly.adequate_cells.
CREATE TABLE IF NOT EXISTS cell_hourly (
  layer TEXT NOT NULL,
  cell_id TEXT NOT NULL,           -- "<row>_<col>" on a 4° grid; row = floor((lat+90)/4), col = floor((lng+180)/4)
  hour_utc TEXT NOT NULL,          -- "YYYY-MM-DDTHH"
  count REAL NOT NULL,             -- opensky: mean unique aircraft per 5-min snapshot; usgs: M2.5+ events; firms: detections
  count_max REAL,                  -- opensky: max over the hour's snapshots; usgs: M4.5+ events; firms: same as count
  coverage TEXT NOT NULL,          -- adequate | partial | unknown
  observed_fraction REAL NOT NULL, -- share of the hour's expected snapshots that were ok
  extra TEXT,                      -- JSON, layer-specific
  updated_at TEXT NOT NULL,
  PRIMARY KEY (layer, cell_id, hour_utc)
);
CREATE INDEX IF NOT EXISTS cell_hourly_hour ON cell_hourly (layer, hour_utc);

-- Per layer per hour: how well the hour was observed and which cells count as adequate.
-- An adequate cell with no cell_hourly row for that hour is a true zero (§3.1, §4.2).
CREATE TABLE IF NOT EXISTS layer_hourly (
  layer TEXT NOT NULL,
  hour_utc TEXT NOT NULL,
  snapshots_expected INTEGER NOT NULL,
  snapshots_ok INTEGER NOT NULL,
  source_status TEXT NOT NULL,     -- ok | degraded | down | absent (ships: no collector sample in the hour; the source was not asked)
  adequate_cells TEXT NOT NULL,    -- JSON array of cell_ids, or 'none' / 'all'
  note TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (layer, hour_utc)
);

-- Receipt history: cells that have ever produced an observation for a layer.
-- Phase-1 proxy for receiver coverage (spec §3.2 / §12 Q1).
CREATE TABLE IF NOT EXISTS cell_receipts (
  layer TEXT NOT NULL,
  cell_id TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  PRIMARY KEY (layer, cell_id)
);

-- One row per hourly batch run, with its result summary.
CREATE TABLE IF NOT EXISTS batch_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hour_utc TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  result TEXT
);

-- Added 30 Oct 2026 (collector 0.1.2): daily Mauna Loa CO2, one row per day (written by the hourly job when a new date appears).
CREATE TABLE IF NOT EXISTS co2_daily (
  date TEXT PRIMARY KEY,
  ppm REAL NOT NULL,
  retrieved_at TEXT NOT NULL
);

-- 0.2.0 (1 Nov 2026): GFW integrated alerts, one row per cell per completed query (the phase-3 baseline for forest)
CREATE TABLE IF NOT EXISTS forest_daily (
  cell_id TEXT NOT NULL,
  date TEXT NOT NULL,          -- UTC day the query ran
  since TEXT NOT NULL,         -- window start used in the query (date >= since)
  nominal INTEGER NOT NULL,
  high INTEGER NOT NULL,
  highest INTEGER NOT NULL,
  version TEXT,                -- GFW dataset version answered (vYYYYMMDD)
  retrieved_at TEXT NOT NULL,
  PRIMARY KEY (cell_id, date)
);

-- ---------------------------------------------------------------- History (collector 0.5.0) — proposal rev 2
-- Written only when the Worker variable HISTORY_ENABLED=1. Every row carries run_ref (<layer>@<retrieved_at>) and the
-- collector version. Created by hand in the D1 console (Chad's go) before HISTORY_ENABLED is set.

-- Distinct versions of small published layers and the plastic dataset. A new row only when the source DATA or our
-- PROCESSING/CHECK results changed; a repeat retrieval of the same content only updates last_* and retrievals.
CREATE TABLE IF NOT EXISTS archive_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layer TEXT NOT NULL,
  data_hash TEXT NOT NULL,          -- sha256 of the source's data part (layer-specific; see versionParts in worker.js)
  proc_hash TEXT NOT NULL,          -- sha256 of our processing/check results (volatile fields stripped)
  change TEXT NOT NULL,             -- first | data | processing | data+processing
  r2_key TEXT NOT NULL,             -- archive/versions/<layer>/...json.gz (the full envelope as published)
  bytes INTEGER NOT NULL,
  first_retrieved_at TEXT NOT NULL,
  last_retrieved_at TEXT NOT NULL,
  retrievals INTEGER NOT NULL,      -- how many retrievals returned exactly this content
  first_run_ref TEXT NOT NULL,
  last_run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS archive_versions_layer ON archive_versions (layer, id);

-- Daily checkpoints of large layers: the last snapshot published for a UTC day, labelled with its actual cutoff.
-- Intermediate versions of that day are not kept. Made from the retained snapshots/ object with the latest full retrieved_at
-- on that day (2-day storage rule). Due days are derived, never stored as mutable state (history_activity minus markers and
-- gaps); every run retries them. This row is written LAST and is the only completion marker.
CREATE TABLE IF NOT EXISTS archive_checkpoints (
  layer TEXT NOT NULL,
  day TEXT NOT NULL,                -- UTC day of the snapshot's retrieved_at
  cutoff TEXT NOT NULL,             -- that snapshot's retrieved_at
  r2_key TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  records INTEGER NOT NULL,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  source_key TEXT,                  -- the retained snapshots/ object the checkpoint was made from
  PRIMARY KEY (layer, day)
);

-- Earthquakes: every distinct USGS revision we received (append-only; a new row only when USGS `updated` changes).
CREATE TABLE IF NOT EXISTS quake_revisions (
  usgs_id TEXT NOT NULL,
  source_updated TEXT NOT NULL,     -- USGS properties.updated
  received_at TEXT NOT NULL,        -- retrieved_at of the run that first received this revision
  observed_at TEXT NOT NULL,        -- USGS origin time
  lat REAL NOT NULL, lng REAL NOT NULL, depth_km REAL, mag REAL, mag_type TEXT, place TEXT, status TEXT,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  PRIMARY KEY (usgs_id, source_updated)
);

-- Fires per 4° cell per UTC day, from the LAST snapshot published for that day (FIRMS day_range=1). Detections FIRMS
-- processes for that day after our last pull of it are not included; `cutoff` says when that pull was.
CREATE TABLE IF NOT EXISTS fires_daily (
  cell_id TEXT NOT NULL,
  day TEXT NOT NULL,
  detections INTEGER NOT NULL,
  frp_sum_mw REAL,                  -- sum over ONLY the detections that carry a valid FRP (frp_n of them); null when none do (never 0); a reported 0 stays 0
  frp_max_mw REAL,                  -- null when no detection carried a value (never 0)
  frp_n INTEGER NOT NULL,
  day_n INTEGER NOT NULL,
  night_n INTEGER NOT NULL,
  cutoff TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  PRIMARY KEY (cell_id, day)
);

-- Drifting buoys: a SAMPLED track — the latest fix per buoy as returned by each hourly OSMC query. Identical
-- buoy + fix time + values repeats are ignored; a correction (same buoy + fix time, different position or SST) is a new row.
CREATE TABLE IF NOT EXISTS drifter_fixes (
  buoy_id TEXT NOT NULL,
  fix_time TEXT NOT NULL,
  lat REAL NOT NULL, lng REAL NOT NULL,
  sst_key TEXT NOT NULL,            -- SST as text, 'na' when not provided (so a missing value de-duplicates)
  sst_c REAL,
  first_received_at TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  PRIMARY KEY (buoy_id, fix_time, lat, lng, sst_key)
);

-- Sea ice: each distinct value per hemisphere per data date (a revised value is a new row).
CREATE TABLE IF NOT EXISTS seaice_daily (
  hemisphere TEXT NOT NULL,
  data_date TEXT NOT NULL,
  extent_mkm2 REAL NOT NULL,
  clim_average_mkm2 REAL,           -- NSIDC 1981–2010 average for that day of year (theirs)
  first_received_at TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  PRIMARY KEY (hemisphere, data_date, extent_mkm2)
);

-- Orbital: the population in OUR catalogue query (Space-Track GP: not decayed, epoch within 10 days) per published
-- element file. Changes can come from filtering, classification or element freshness, not only launches and reentries.
CREATE TABLE IF NOT EXISTS orbital_population (
  elements_sha256 TEXT PRIMARY KEY,
  first_retrieved_at TEXT NOT NULL,
  rows INTEGER NOT NULL,
  counts_json TEXT NOT NULL,
  query TEXT NOT NULL,
  filter TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  collector_version TEXT NOT NULL
);

-- "History ran for this layer on this UTC day" — one idempotent row per layer per day (rev 5). With archive_checkpoints
-- (done) and archive_gaps (cannot be done) it defines the due days; no mutable pointer exists to roll back.
CREATE TABLE IF NOT EXISTS history_activity (
  layer TEXT NOT NULL,
  day TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  PRIMARY KEY (layer, day)
);
-- A day whose checkpoint cannot be completed, with the reason (e.g. retained snapshots expired). Never invented data.
CREATE TABLE IF NOT EXISTS archive_gaps (
  layer TEXT NOT NULL,
  day TEXT NOT NULL,
  reason TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  PRIMARY KEY (layer, day)
);
-- What a daily checkpoint's input covered (0.5.2, after the 5 Nov FIRMS guard finding). Separate from archive_checkpoints so the
-- original checkpoint is never rewritten. Derived from collector_runs (never pruned) and the checkpoint's own records.
-- assessed_with_checkpoint = 1: written in the same step as the checkpoint; 0: assessed later (e.g. 5 Nov), with assessed_at.
CREATE TABLE IF NOT EXISTS archive_checkpoint_coverage (
  layer TEXT NOT NULL,
  day TEXT NOT NULL,
  cutoff TEXT NOT NULL,                 -- the checkpoint input's retrieval time (= archive_checkpoints.cutoff)
  last_observation_at TEXT,             -- latest observation time inside that input (a different quantity from the cutoff)
  input_age_at_day_end_s INTEGER NOT NULL,   -- end of the UTC day minus the cutoff
  failed_runs_after_cutoff INTEGER NOT NULL, -- runs of this layer later on the same day that did not publish
  failure_first_at TEXT,
  failure_last_at TEXT,
  failure_reasons TEXT,                 -- distinct reasons, shortened (JSON array)
  input_status TEXT NOT NULL,           -- 'current' | 'stale'
  assessed_at TEXT NOT NULL,
  assessed_with_checkpoint INTEGER NOT NULL,
  collector_version TEXT NOT NULL,
  PRIMARY KEY (layer, day)
);
-- Indexes so the hub's history report reads first/last values without scanning (MIN/MAX on an index).
CREATE INDEX IF NOT EXISTS quake_revisions_received ON quake_revisions (received_at);
CREATE INDEX IF NOT EXISTS fires_daily_day ON fires_daily (day);
CREATE INDEX IF NOT EXISTS drifter_fixes_received ON drifter_fixes (first_received_at);
CREATE INDEX IF NOT EXISTS seaice_daily_received ON seaice_daily (first_received_at);
CREATE INDEX IF NOT EXISTS orbital_population_retrieved ON orbital_population (first_retrieved_at);
CREATE INDEX IF NOT EXISTS archive_versions_layer_first ON archive_versions (layer, first_retrieved_at);
CREATE INDEX IF NOT EXISTS archive_versions_layer_last ON archive_versions (layer, last_retrieved_at);
