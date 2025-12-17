-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can create interest entries" ON public.interested_users;

-- Create a new policy that enforces user_id = auth.uid()
CREATE POLICY "Users can create interest entries"
ON public.interested_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());