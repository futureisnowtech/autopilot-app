-- =============================================================
-- AUTOPILOT: STRIPE & CREDIT TRANSACTIONS MIGRATION SCRIPT
-- Run this in the Supabase SQL Editor
-- All statements are idempotent (safe to re-run)
-- =============================================================

-- 1. Add Stripe fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- 2. Create credit transactions log table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- positive for credits added, negative for credits spent
  description TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index for transaction queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- 3. Atomic Credit Deduction Stored Procedure (RPC)
-- Returns the caller's remaining credit balance on success (-1 sentinel for
-- unlimited plans, which never decrement), or NULL if the deduction failed
-- (insufficient credits or unknown user). Callers that only care about
-- success/failure can check `IS NOT NULL`; callers that want to react to a
-- low balance (e.g. upsell nudges) can use the returned count directly.
CREATE OR REPLACE FUNCTION deduct_credit(
  p_user_id UUID,
  p_amount INT DEFAULT 1,
  p_description TEXT DEFAULT 'AI DO Task Execution'
)
RETURNS INT AS $$
DECLARE
  v_plan TEXT;
  v_current_credits INT;
  v_remaining INT;
BEGIN
  SELECT plan_type, credits INTO v_plan, v_current_credits
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Unlimited plans bypass credit deduction
  IF v_plan IN ('pro', 'god-mode', 'scale') THEN
    INSERT INTO credit_transactions (user_id, amount, description)
    VALUES (p_user_id, 0, p_description || ' (God Mode - Unlimited)');
    RETURN -1;
  END IF;

  -- Check if user has sufficient credits
  IF v_current_credits < p_amount THEN
    RETURN NULL;
  END IF;

  -- Atomic update
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_remaining;

  IF FOUND THEN
    INSERT INTO credit_transactions (user_id, amount, description)
    VALUES (p_user_id, -p_amount, p_description);
    RETURN v_remaining;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic Add Credits Stored Procedure (RPC)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INT,
  p_description TEXT DEFAULT 'Credit Top-Up',
  p_session_id TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_new_credits INT;
BEGIN
  -- Prevent duplicate additions for same Stripe checkout session
  IF p_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM credit_transactions WHERE stripe_session_id = p_session_id
  ) THEN
    SELECT credits INTO v_new_credits FROM profiles WHERE id = p_user_id;
    RETURN v_new_credits;
  END IF;

  UPDATE profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  INSERT INTO credit_transactions (user_id, amount, description, stripe_session_id)
  VALUES (p_user_id, p_amount, p_description, p_session_id)
  ON CONFLICT (stripe_session_id) DO NOTHING;

  RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
