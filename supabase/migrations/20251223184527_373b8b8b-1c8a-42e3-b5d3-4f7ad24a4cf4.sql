-- Add UPDATE policy for users to update their own bookings (for remaining payment uploads)
CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);