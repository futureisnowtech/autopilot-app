-- =============================================================
-- AUTOPILOT: GOOGLE OATH CALENDAR SYNC MIGRATION
-- Run this ONCE in the Supabase SQL Editor
-- =============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
