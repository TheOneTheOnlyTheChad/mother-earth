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
