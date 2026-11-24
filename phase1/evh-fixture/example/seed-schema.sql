CREATE TABLE IF NOT EXISTS collector_runs ( id INTEGER PRIMARY KEY AUTOINCREMENT, layer TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT NOT NULL, status TEXT NOT NULL, http_status INTEGER, records INTEGER, bytes INTEGER, note TEXT );
CREATE INDEX IF NOT EXISTS collector_runs_layer ON collector_runs (layer, id);
CREATE INDEX IF NOT EXISTS collector_runs_layer_finished ON collector_runs (layer, finished_at);
