
-- 1. Updated referral code generator: name-based + 3-digit suffix, ₹101 signup bonus, 180d expiry
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code text;
  v_exists boolean;
  v_wallet_id uuid;
  v_name text;
  v_base text;
  v_attempts int := 0;
BEGIN
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

  -- Build base from full_name (first word, alpha only, upper, max 6 chars)
  SELECT full_name INTO v_name FROM profiles WHERE id = p_user_id;
  v_base := upper(regexp_replace(COALESCE(split_part(v_name, ' ', 1), ''), '[^A-Za-z]', '', 'g'));
  IF length(v_base) < 3 THEN
    v_base := 'GB' || upper(substr(md5(p_user_id::text), 1, 3));
  END IF;
  v_base := substr(v_base, 1, 6);

  LOOP
    v_code := v_base || lpad((floor(random() * 900) + 100)::int::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_attempts := v_attempts + 1;
    IF v_attempts > 25 THEN
      v_code := v_base || upper(substr(md5(random()::text), 1, 4));
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE user_id = p_user_id AND type = 'signup_bonus') THEN
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    UPDATE wallets SET balance = balance + 101, total_earned = total_earned + 101, updated_at = now()
    WHERE user_id = p_user_id;
    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, expires_at)
    VALUES (v_wallet_id, p_user_id, 101, 'signup_bonus', 'Welcome bonus — ₹101 travel credit',
            now() + interval '180 days');
  END IF;

  RETURN v_code;
END;
$function$;

-- 2. Wallet usage: trips only, min ₹3499, max ₹300
CREATE OR REPLACE FUNCTION public.apply_wallet_to_booking(p_user_id uuid, p_booking_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id uuid;
  v_balance numeric;
  v_is_frozen boolean;
  v_total_amount numeric;
  v_trip_id text;
  v_is_experience boolean;
  v_capped numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT total_amount, trip_id INTO v_total_amount, v_trip_id FROM bookings WHERE id = p_booking_id;
  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT EXISTS(SELECT 1 FROM experiences WHERE experience_id = v_trip_id) INTO v_is_experience;
  IF v_is_experience THEN
    RAISE EXCEPTION 'Travel credits are valid on Trips only, not Experiences';
  END IF;

  IF v_total_amount < 3499 THEN
    RAISE EXCEPTION 'Travel credits can only be used on bookings above ₹3499';
  END IF;

  SELECT id, balance, is_frozen INTO v_wallet_id, v_balance, v_is_frozen
  FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN RETURN false; END IF;
  IF v_is_frozen THEN RAISE EXCEPTION 'Wallet is frozen'; END IF;

  v_capped := LEAST(p_amount, 300, v_balance);
  IF v_capped <= 0 THEN RETURN false; END IF;

  UPDATE wallets SET balance = balance - v_capped,
                     total_spent = total_spent + v_capped,
                     updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, p_user_id, -v_capped, 'booking_debit', 'Applied to booking (max ₹300)', p_booking_id::text);

  UPDATE bookings SET wallet_discount = v_capped WHERE id = p_booking_id;
  RETURN true;
END;
$function$;

-- 3. Helper: dynamic referral reward amount from booking value (trips only)
CREATE OR REPLACE FUNCTION public.calculate_referral_reward(p_booking_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric;
  v_trip_id text;
  v_is_experience boolean;
BEGIN
  SELECT total_amount, trip_id INTO v_total, v_trip_id FROM bookings WHERE id = p_booking_id;
  IF v_total IS NULL THEN RETURN 0; END IF;
  SELECT EXISTS(SELECT 1 FROM experiences WHERE experience_id = v_trip_id) INTO v_is_experience;
  IF v_is_experience THEN RETURN 0; END IF;
  IF v_total >= 12000 THEN RETURN 150;
  ELSIF v_total >= 7000 THEN RETURN 100;
  ELSIF v_total >= 3499 THEN RETURN 50;
  ELSE RETURN 0;
  END IF;
END;
$function$;

-- 4. Updated referral reward crediting: dynamic, trips only, only on confirmed booking
CREATE OR REPLACE FUNCTION public.credit_referral_reward(p_referrer_code text, p_referred_user_id uuid, p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  v_wallet_id uuid;
  v_reward numeric;
  v_booking_status text;
  v_booking_user uuid;
  v_already boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_referred_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = upper(trim(p_referrer_code));
  IF v_referrer_id IS NULL OR v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  SELECT EXISTS(SELECT 1 FROM referral_earnings WHERE referred_user_id = p_referred_user_id AND status = 'credited') INTO v_already;
  IF v_already THEN RETURN false; END IF;

  SELECT booking_status, user_id INTO v_booking_status, v_booking_user FROM bookings WHERE id = p_booking_id;
  IF v_booking_user IS DISTINCT FROM p_referred_user_id THEN RETURN false; END IF;

  v_reward := calculate_referral_reward(p_booking_id);
  IF v_reward <= 0 THEN RETURN false; END IF;

  IF v_booking_status NOT IN ('confirmed','completed') THEN
    INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
    VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'pending')
    ON CONFLICT DO NOTHING;
    RETURN false;
  END IF;

  INSERT INTO wallets (user_id) VALUES (v_referrer_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE wallets SET balance = balance + v_reward, total_earned = total_earned + v_reward, updated_at = now()
  WHERE user_id = v_referrer_id RETURNING id INTO v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id, expires_at)
  VALUES (v_wallet_id, v_referrer_id, v_reward, 'referral_credit',
          'Referral reward — friend''s trip booking confirmed', p_booking_id::text,
          now() + interval '180 days');

  INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
  VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'credited');

  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = upper(trim(p_referrer_code));
  RETURN true;
END;
$function$;

-- 5. Process pending referrals: dynamic reward + 180-day expiry
CREATE OR REPLACE FUNCTION public.process_pending_referrals_for_booking(p_booking_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  v_count integer := 0;
  v_wallet_id uuid;
  v_status text;
  v_reward numeric;
BEGIN
  SELECT booking_status INTO v_status FROM bookings WHERE id = p_booking_id;
  IF v_status NOT IN ('confirmed','completed') THEN RETURN 0; END IF;

  v_reward := calculate_referral_reward(p_booking_id);
  IF v_reward <= 0 THEN RETURN 0; END IF;

  FOR rec IN
    SELECT * FROM referral_earnings
     WHERE booking_id = p_booking_id AND status = 'pending'
  LOOP
    INSERT INTO wallets (user_id) VALUES (rec.referrer_user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE wallets SET balance = balance + v_reward, total_earned = total_earned + v_reward, updated_at = now()
     WHERE user_id = rec.referrer_user_id RETURNING id INTO v_wallet_id;
    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id, expires_at)
    VALUES (v_wallet_id, rec.referrer_user_id, v_reward, 'referral_credit',
            'Referral reward (booking confirmed)', p_booking_id::text, now() + interval '180 days');
    UPDATE referral_earnings SET status = 'credited', amount = v_reward WHERE id = rec.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$;
