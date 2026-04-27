-- 1. Add auto_duplicate column
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS auto_duplicate boolean NOT NULL DEFAULT true;

-- 2. Function to duplicate batches that are full or expired
CREATE OR REPLACE FUNCTION public.auto_duplicate_batches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
  v_has_future boolean;
  v_new_start date;
  v_new_end date;
  v_count integer := 0;
BEGIN
  FOR rec IN
    SELECT b.id, b.trip_id, b.batch_name, b.start_date, b.end_date,
           b.batch_size, b.price_override, b.auto_shift
    FROM public.batches b
    WHERE b.auto_duplicate = true
      AND b.status = 'active'
      AND (
        b.seats_booked >= b.batch_size
        OR b.start_date < CURRENT_DATE
      )
  LOOP
    -- Only ONE future batch per trip — skip if any future active batch already exists
    SELECT EXISTS (
      SELECT 1 FROM public.batches
      WHERE trip_id = rec.trip_id
        AND status = 'active'
        AND start_date >= CURRENT_DATE
    ) INTO v_has_future;

    IF v_has_future THEN
      CONTINUE;
    END IF;

    v_new_start := GREATEST(rec.start_date + 7, CURRENT_DATE + 1);
    v_new_end := CASE
      WHEN rec.end_date IS NOT NULL
      THEN v_new_start + (rec.end_date - rec.start_date)
      ELSE NULL
    END;

    INSERT INTO public.batches (
      trip_id, batch_name, start_date, end_date,
      batch_size, seats_booked, available_seats,
      price_override, status, auto_shift, auto_duplicate
    ) VALUES (
      rec.trip_id,
      rec.batch_name || ' (Next)',
      v_new_start,
      v_new_end,
      rec.batch_size,
      0,
      rec.batch_size,
      rec.price_override,
      'active',
      COALESCE(rec.auto_shift, true),
      true
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;