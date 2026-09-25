-- SQLite MVP schema for verified advisory snapshots.
CREATE TABLE IF NOT EXISTS mandi_price_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commodity TEXT NOT NULL,
  state TEXT NOT NULL,
  market TEXT NOT NULL,
  modal_price_inr_per_quintal REAL,
  observed_at TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS msp_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commodity TEXT NOT NULL,
  msp_inr_per_quintal REAL,
  season TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  source_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mandi_lookup ON mandi_price_snapshots (commodity, state, market, observed_at);
