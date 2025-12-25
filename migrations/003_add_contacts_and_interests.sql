-- Migration: Add contacts table and interests/tags to events

-- Create contacts table for Telegram contacts database
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    interests TEXT, -- JSON array of interest tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add interests column to events table
ALTER TABLE events ADD COLUMN interests TEXT; -- JSON array of interest tags

-- Create index for faster contact lookups
CREATE INDEX IF NOT EXISTS idx_contacts_telegram_id ON contacts(telegram_id);

-- Create index for event interests
CREATE INDEX IF NOT EXISTS idx_events_interests ON events(interests);
