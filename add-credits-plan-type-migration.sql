-- Fixes "Insufficient credits" on every note: profiles.credits and
-- profiles.plan_type were never added to production, even though the app
-- code (api/intake, lib/executor) has always required them. The intake
-- query silently failed (missing column), profile came back null, and the
-- code treated that as zero credits.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';

-- Backfill any existing rows created before this migration (ADD COLUMN
-- with a default only auto-fills new rows going forward in some Postgres
-- setups, so make it explicit).
UPDATE profiles SET credits = 10 WHERE credits IS NULL;
UPDATE profiles SET plan_type = 'free' WHERE plan_type IS NULL;
