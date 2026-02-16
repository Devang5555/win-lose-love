
-- Fix apply_wallet_to_booking: add authorization check
CREATE OR REPLACE FUNCTION public.apply_wallet_to_booking(p_user_id uuid, p_booking_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id uuid;
  v_balance numeric;
BEGIN
  -- Permission check: caller must own the wallet or be admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_wallet_id IS NULL OR v_balance < p_amount OR p_amount <= 0 THEN
    RETURN false;
  END IF;

  UPDATE wallets SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, p_user_id, -p_amount, 'booking_debit', 'Applied to booking', p_booking_id::text);

  UPDATE bookings SET wallet_discount = p_amount WHERE id = p_booking_id;

  RETURN true;
END;
$function$;
