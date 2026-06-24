-- Fix: wrap handle_new_user trigger in exception handlers so that
-- missing tables (migrations not yet applied) do NOT fail the auth.users INSERT.
-- This lets Supabase Auth work even before all custom tables are created.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create users row (extends auth.users)
  BEGIN
    INSERT INTO users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: users insert failed: %', SQLERRM;
  END;

  -- Create profile row
  BEGIN
    INSERT INTO profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Student'))
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed: %', SQLERRM;
  END;

  -- Create default settings row
  BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_settings insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
