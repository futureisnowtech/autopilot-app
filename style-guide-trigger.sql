-- Autopilot App: Style Guide Auto-Creation Trigger
-- Ensures every new user gets a style_guides row automatically
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.style_guides (user_id, preferences, learned_rules)
  VALUES (NEW.id, '{}'::jsonb, '{}'::text[])
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
