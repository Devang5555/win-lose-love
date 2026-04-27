-- Add auto_shift flag and a SECURITY DEFINER function that shifts past, empty,
-- auto-shift-enabled batches forward by 7 days until the start_date is in the future.

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS auto_shift boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.auto_shift_empty_batches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_new_start date;
  v_new_end date;
  v_weeks integer;
  v_count integer := 0;
BEGIN
  FOR rec IN
    SELECT id, start_date, end_date
    FROM public.batches
    WHERE auto_shift = true
      AND status = 'active'
      AND seats_booked = 0
      AND start_date < CURRENT_DATE
  LOOP
    -- Number of full weeks needed to push start_date strictly into the future
    v_weeks := CEIL((CURRENT_DATE - rec.start_date)::numeric / 7)::integer;
    IF v_weeks < 1 THEN v_weeks := 1; END IF;

    v_new_start := rec.start_date + (v_weeks * 7);
    v_new_end := rec.end_date + (v_weeks * 7);

    UPDATE public.batches
    SET start_date = v_new_start,
        end_date = v_new_end,
        updated_at = now()
    WHERE id = rec.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Allow anyone (including anon visitors) to trigger the shift on page load.
-- The function only mutates batches that have zero bookings, so it is safe.
GRANT EXECUTE ON FUNCTION public.auto_shift_empty_batches() TO anon, authenticated;