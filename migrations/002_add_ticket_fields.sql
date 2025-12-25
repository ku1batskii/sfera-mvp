-- Migration: add ticket fields to events table (SQLite)
ALTER TABLE events ADD COLUMN ticket_price REAL DEFAULT 0;
ALTER TABLE events ADD COLUMN available_tickets INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN sold_tickets INTEGER DEFAULT 0;
