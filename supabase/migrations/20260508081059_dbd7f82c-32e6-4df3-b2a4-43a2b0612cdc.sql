
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS marketing_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid;

CREATE OR REPLACE FUNCTION public.link_referral_on_signup(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_referrer uuid;
  v_existing text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(v_code) = 0 THEN RETURN false; END IF;

  SELECT referred_by_code INTO v_existing FROM profiles WHERE id = v_user;
  IF v_existing IS NOT NULL AND length(v_existing) > 0 THEN
    RETURN false; -- already linked, no overwrite
  END IF;

  SELECT user_id INTO v_referrer FROM referral_codes WHERE code = v_code;
  IF v_referrer IS NULL OR v_referrer = v_user THEN
    RETURN false;
  END IF;

  UPDATE profiles
     SET referred_by_code = v_code,
         referred_by_user_id = v_referrer,
         updated_at = now()
   WHERE id = v_user;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_batch_seats(p_batch_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booked integer;
  v_size integer;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT COALESCE(SUM(num_travelers), 0)
    INTO v_booked
    FROM bookings
   WHERE batch_id = p_batch_id
     AND booking_status IN ('confirmed', 'completed')
     AND COALESCE(is_deleted, false) = false;

  SELECT batch_size INTO v_size FROM batches WHERE id = p_batch_id;
  IF v_size IS NULL THEN RAISE EXCEPTION 'Batch not found'; END IF;

  UPDATE batches
     SET seats_booked = v_booked,
         available_seats = GREATEST(0, v_size - v_booked),
         updated_at = now()
   WHERE id = p_batch_id;

  PERFORM create_audit_log(
    auth.uid(), 'recalculate_batch_seats', 'batch', p_batch_id::text,
    jsonb_build_object('seats_booked', v_booked)
  );

  RETURN v_booked;
END;
$$;
