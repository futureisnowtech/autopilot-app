-- Autopilot App: Multi-Provider Calendar Migration
-- Run this in your Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_provider TEXT DEFAULT 'google';

-- calendar_provider values:
--   'google'  → Google Calendar via service account (push)
--   'apple'   → Apple Calendar via iCal feed subscription (read)
--   'outlook' → Outlook Calendar via iCal feed subscription (read)
