
-- Fix 1: Restrict interested_users SELECT to admins only
-- First drop any existing public SELECT policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interested_users' AND policyname = 'Anyone can view interested users') THEN
    DROP POLICY "Anyone can view interested users" ON public.interested_users;
  END IF;
END $$;

-- Create admin-only SELECT policy
CREATE POLICY "Only admins can view interested users"
ON public.interested_users
FOR SELECT
USING (
  has_any_role(auth.uid(), ARRAY['admin', 'super_admin', 'operations_manager']::app_role[])
);

-- Fix 2: Verify fraud_flags has no public SELECT - add explicit admin-only policy if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fraud_flags' AND cmd = 'r') THEN
    EXECUTE 'CREATE POLICY "Only authorized staff can view fraud flags" ON public.fraud_flags FOR SELECT USING (has_any_role(auth.uid(), ARRAY[''admin'', ''super_admin'', ''finance_manager'']::app_role[]))';
  END IF;
END $$;
