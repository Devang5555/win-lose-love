
-- Fix create_audit_log: enforce caller can only create logs for themselves (or admin)
CREATE OR REPLACE FUNCTION public.create_audit_log(p_user_id uuid, p_action_type text, p_entity_type text, p_entity_id text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  -- Validate caller: must be the user or an admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied: cannot create audit log for another user';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$function$;

-- Fix cancel_booking_with_seat_release: verify caller owns booking or is admin
CREATE OR REPLACE FUNCTION public.cancel_booking_with_seat_release(p_booking_id uuid, p_reason text, p_refund_amount numeric DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_status text;
  v_batch_id uuid;
  v_num_travelers integer;
  v_trip_id text;
  v_owner_id uuid;
BEGIN
  SELECT booking_status, batch_id, num_travelers, trip_id, user_id
  INTO v_booking_status, v_batch_id, v_num_travelers, v_trip_id, v_owner_id
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking_status IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Permission check: caller must own booking or be admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_owner_id IS DISTINCT FROM auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_booking_status = 'expired' THEN
    RAISE EXCEPTION 'Cannot cancel expired bookings';
  END IF;
  IF v_booking_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  IF v_booking_status = 'confirmed' AND v_batch_id IS NOT NULL THEN
    UPDATE batches
    SET available_seats = available_seats + v_num_travelers,
        seats_booked = GREATEST(0, seats_booked - v_num_travelers),
        updated_at = now()
    WHERE id = v_batch_id;
  END IF;

  UPDATE bookings
  SET booking_status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;

  IF p_refund_amount > 0 THEN
    INSERT INTO refunds (booking_id, amount, refund_status, reason)
    VALUES (p_booking_id, p_refund_amount, 'pending', p_reason);
  END IF;

  PERFORM create_audit_log(
    auth.uid(),
    'cancel_booking',
    'booking',
    p_booking_id::text,
    jsonb_build_object('reason', p_reason, 'refund_amount', p_refund_amount, 'trip_id', v_trip_id, 'travelers', v_num_travelers, 'previous_status', v_booking_status)
  );
END;
$function$;

-- Fix confirm_booking_after_payment: verify caller owns booking or is admin
CREATE OR REPLACE FUNCTION public.confirm_booking_after_payment(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_batch_id uuid;
    v_num_travelers integer;
    v_available integer;
    v_booking_status text;
    v_owner_id uuid;
BEGIN
    SELECT batch_id, num_travelers, booking_status, user_id
    INTO v_batch_id, v_num_travelers, v_booking_status, v_owner_id
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    -- Permission check
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    IF v_owner_id IS DISTINCT FROM auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;

    IF v_booking_status = 'expired' THEN
        RAISE EXCEPTION 'This booking has expired and cannot be confirmed';
    END IF;

    IF v_batch_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found or batch missing';
    END IF;

    SELECT available_seats
    INTO v_available
    FROM batches
    WHERE id = v_batch_id
    FOR UPDATE;

    IF v_available IS NULL OR v_available < v_num_travelers THEN
        RAISE EXCEPTION 'Not enough seats available';
    END IF;

    UPDATE batches
    SET available_seats = available_seats - v_num_travelers,
        seats_booked = seats_booked + v_num_travelers,
        updated_at = now()
    WHERE id = v_batch_id;

    UPDATE bookings
    SET booking_status = 'confirmed',
        payment_status = 'pending_advance',
        updated_at = now()
    WHERE id = p_booking_id;
END;
$function$;

-- Fix credit_referral_reward: only callable by the referred user or admin
CREATE OR REPLACE FUNCTION public.credit_referral_reward(p_referrer_code text, p_referred_user_id uuid, p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  v_wallet_id uuid;
  v_reward numeric := 250;
BEGIN
  -- Permission check: caller must be the referred user or admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_referred_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = p_referrer_code;
  IF v_referrer_id IS NULL OR v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  INSERT INTO wallets (user_id) VALUES (v_referrer_id) ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets SET balance = balance + v_reward, total_earned = total_earned + v_reward, updated_at = now()
  WHERE user_id = v_referrer_id
  RETURNING id INTO v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, v_referrer_id, v_reward, 'referral_credit', 'Referral reward for friend''s booking', p_booking_id::text);

  INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
  VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'credited');

  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = p_referrer_code;

  RETURN true;
END;
$function$;

-- Fix generate_referral_code: only callable for self or admin
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  -- Permission check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_code := 'GB' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  RETURN v_code;
END;
$function$;
