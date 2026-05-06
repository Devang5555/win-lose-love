-- Phase 3: Wallet rules, referral safety, coupons (non-destructive)

-- 1. Coupons system
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'flat', -- 'flat' | 'percent'
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  min_order_amount numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  usage_per_user integer DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  user_id uuid NOT NULL,
  booking_id uuid,
  discount_applied numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins manage redemptions" ON public.coupon_redemptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add coupon fields to bookings (nullable, additive)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;

-- 3. Wallet rules: enforce ₹300 cap, ₹5000 min order, frozen check
CREATE OR REPLACE FUNCTION public.apply_wallet_to_booking(p_user_id uuid, p_booking_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance numeric;
  v_is_frozen boolean;
  v_total_amount numeric;
  v_capped numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Booking minimum ₹5000
  SELECT total_amount INTO v_total_amount FROM bookings WHERE id = p_booking_id;
  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_total_amount < 5000 THEN
    RAISE EXCEPTION 'Wallet credits can only be used on bookings above ₹5000';
  END IF;

  SELECT id, balance, is_frozen INTO v_wallet_id, v_balance, v_is_frozen
  FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN false;
  END IF;
  IF v_is_frozen THEN
    RAISE EXCEPTION 'Wallet is frozen';
  END IF;

  -- Cap at ₹300 per booking
  v_capped := LEAST(p_amount, 300, v_balance);
  IF v_capped <= 0 THEN
    RETURN false;
  END IF;

  UPDATE wallets SET balance = balance - v_capped,
                     total_spent = total_spent + v_capped,
                     updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, p_user_id, -v_capped, 'booking_debit', 'Applied to booking (max ₹300)', p_booking_id::text);

  UPDATE bookings SET wallet_discount = v_capped WHERE id = p_booking_id;

  RETURN true;
END;
$$;

-- 4. Referral safety: prevent self-referral, duplicate rewards, require confirmed booking
CREATE OR REPLACE FUNCTION public.credit_referral_reward(p_referrer_code text, p_referred_user_id uuid, p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_wallet_id uuid;
  v_reward numeric := 250;
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
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;

  -- No self-referrals
  IF v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  -- One reward per referred user (lifetime)
  SELECT EXISTS(SELECT 1 FROM referral_earnings WHERE referred_user_id = p_referred_user_id) INTO v_already;
  IF v_already THEN
    RETURN false;
  END IF;

  -- Booking must belong to referred user and be confirmed
  SELECT booking_status, user_id INTO v_booking_status, v_booking_user FROM bookings WHERE id = p_booking_id;
  IF v_booking_user IS DISTINCT FROM p_referred_user_id THEN
    RETURN false;
  END IF;
  IF v_booking_status NOT IN ('confirmed','completed') THEN
    -- mark pending; will be credited later
    INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
    VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'pending');
    RETURN false;
  END IF;

  INSERT INTO wallets (user_id) VALUES (v_referrer_id) ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets SET balance = balance + v_reward, total_earned = total_earned + v_reward, updated_at = now()
  WHERE user_id = v_referrer_id
  RETURNING id INTO v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id, expires_at)
  VALUES (v_wallet_id, v_referrer_id, v_reward, 'referral_credit',
          'Referral reward for friend''s booking', p_booking_id::text,
          now() + interval '6 months');

  INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
  VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'credited');

  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = upper(trim(p_referrer_code));

  RETURN true;
END;
$$;

-- 5. Add 6-month expiry to signup bonus going forward
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_wallet_id uuid;
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

  LOOP
    v_code := 'GB' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE user_id = p_user_id AND type = 'signup_bonus') THEN
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    UPDATE wallets SET balance = balance + 300, total_earned = total_earned + 300, updated_at = now()
    WHERE user_id = p_user_id;
    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, expires_at)
    VALUES (v_wallet_id, p_user_id, 300, 'signup_bonus', 'Welcome bonus - ₹300 travel credit',
            now() + interval '6 months');
  END IF;

  RETURN v_code;
END;
$$;

-- 6. Apply coupon RPC
CREATE OR REPLACE FUNCTION public.apply_coupon_to_booking(p_user_id uuid, p_booking_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon record;
  v_total numeric;
  v_uses integer;
  v_discount numeric;
  v_code text := upper(trim(p_code));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT * INTO v_coupon FROM coupons WHERE code = v_code AND is_active = true;
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired coupon');
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has expired');
  END IF;
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not yet active');
  END IF;
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon usage limit reached');
  END IF;

  SELECT count(*) INTO v_uses FROM coupon_redemptions
   WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  IF v_coupon.usage_per_user IS NOT NULL AND v_uses >= v_coupon.usage_per_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this coupon');
  END IF;

  SELECT total_amount INTO v_total FROM bookings WHERE id = p_booking_id AND user_id = p_user_id;
  IF v_total IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;
  IF v_total < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Minimum order ₹' || v_coupon.min_order_amount::text || ' required');
  END IF;

  IF v_coupon.discount_type = 'percent' THEN
    v_discount := round(v_total * v_coupon.discount_value / 100.0);
    IF v_coupon.max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount);
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  v_discount := LEAST(v_discount, v_total);

  UPDATE bookings SET coupon_code = v_code, coupon_discount = v_discount WHERE id = p_booking_id;
  INSERT INTO coupon_redemptions (coupon_id, user_id, booking_id, discount_applied)
  VALUES (v_coupon.id, p_user_id, p_booking_id, v_discount);
  UPDATE coupons SET used_count = used_count + 1, updated_at = now() WHERE id = v_coupon.id;

  RETURN jsonb_build_object('success', true, 'discount', v_discount, 'code', v_code);
END;
$$;

-- 7. Promote pending referral earnings whenever a booking becomes confirmed
CREATE OR REPLACE FUNCTION public.process_pending_referrals_for_booking(p_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
  v_count integer := 0;
  v_wallet_id uuid;
  v_status text;
BEGIN
  SELECT booking_status INTO v_status FROM bookings WHERE id = p_booking_id;
  IF v_status NOT IN ('confirmed','completed') THEN RETURN 0; END IF;

  FOR rec IN
    SELECT * FROM referral_earnings
     WHERE booking_id = p_booking_id AND status = 'pending'
  LOOP
    INSERT INTO wallets (user_id) VALUES (rec.referrer_user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE wallets SET balance = balance + rec.amount, total_earned = total_earned + rec.amount, updated_at = now()
     WHERE user_id = rec.referrer_user_id RETURNING id INTO v_wallet_id;
    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id, expires_at)
    VALUES (v_wallet_id, rec.referrer_user_id, rec.amount, 'referral_credit',
            'Referral reward (booking confirmed)', p_booking_id::text, now() + interval '6 months');
    UPDATE referral_earnings SET status = 'credited' WHERE id = rec.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;