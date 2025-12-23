-- Create a function to safely increment seats_booked
CREATE OR REPLACE FUNCTION public.increment_seats_booked(batch_id_param uuid, seats_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE batches
  SET seats_booked = seats_booked + seats_count,
      updated_at = now()
  WHERE id = batch_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_seats_booked(uuid, integer) TO authenticated;