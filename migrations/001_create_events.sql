-- Migration: create events table (SQLite)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  city TEXT,
  lat REAL,
  lon REAL,
  category TEXT,
  title TEXT,
  description TEXT,
  timestamp TEXT,
  created_at TEXT
);
