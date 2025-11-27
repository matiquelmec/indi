-- =================================================================
-- FIX: Sync Auth Users to Public Users Table
-- Execute this in your Supabase SQL Editor
-- =================================================================

-- 1. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. (Optional) Fix existing Demo user if needed
-- This attempts to insert the auth user into public users if they exist in auth but not public
-- Note: This requires running as a superuser or having permissions on auth.users which might not be available in SQL Editor
-- So we rely on the trigger for NEW users. 

-- If you have issues with the existing demo user, please delete 'demo@indi.com' 
-- from the Authentication > Users panel in Supabase and try logging in again.
