-- Allow public (unauthenticated) users to submit interest while keeping data non-readable to the public.
-- Existing policy only allows authenticated users where auth.uid() = user_id.

DROP POLICY IF EXISTS "Users can submit interest" ON public.interested_users;

CREATE POLICY "Anyone can submit interest"
ON public.interested_users
FOR INSERT
WITH CHECK (
  user_id IS NULL
  OR auth.uid() = user_id
);
