
-- Fix 1: Make payment-screenshots bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-screenshots';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view payment screenshots" ON storage.objects;

-- Drop and recreate restricted view policy
DROP POLICY IF EXISTS "Users can view own payment screenshots" ON storage.objects;
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   public.has_role(auth.uid(), 'admin'::app_role))
);

-- Fix 2: Secure the increment_seats_booked function with auth check
CREATE OR REPLACE FUNCTION public.increment_seats_booked(batch_id_param uuid, seats_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  UPDATE batches
  SET seats_booked = seats_booked + seats_count,
      updated_at = now()
  WHERE id = batch_id_param;
END;
$$;
