
-- Add soft delete columns to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Update the existing SELECT RLS policies to filter soft-deleted for regular users
-- Drop and recreate the user-facing SELECT policy
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
USING (
  ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  AND (is_deleted = false OR has_role(auth.uid(), 'admin'::app_role))
);
