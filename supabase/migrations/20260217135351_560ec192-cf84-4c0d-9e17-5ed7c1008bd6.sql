
-- Update generate_referral_code to also credit ₹300 signup bonus
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
  v_already_has_code boolean;
BEGIN
  -- Permission check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Check if user already has a referral code
  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique code
  LOOP
    v_code := 'GB' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);

  -- Create wallet if not exists
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Credit ₹300 signup bonus (only if no signup_bonus transaction exists)
  IF NOT EXISTS (
    SELECT 1 FROM wallet_transactions WHERE user_id = p_user_id AND type = 'signup_bonus'
  ) THEN
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;

    UPDATE wallets 
    SET balance = balance + 300, 
        total_earned = total_earned + 300, 
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description)
    VALUES (v_wallet_id, p_user_id, 300, 'signup_bonus', 'Welcome bonus - ₹300 travel credit');
  END IF;

  RETURN v_code;
END;
$function$;
