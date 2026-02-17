
-- Add expiry columns to wallet_transactions
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_expired boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT NULL;

-- Add wallet_frozen to wallets
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frozen_by uuid DEFAULT NULL;

-- Create fraud_flags table
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  flagged_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_by uuid DEFAULT NULL,
  resolved_at timestamp with time zone DEFAULT NULL,
  status text NOT NULL DEFAULT 'open',
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

-- Only admin/super_admin/finance_manager can manage fraud flags
CREATE POLICY "Staff can manage fraud flags"
  ON public.fraud_flags
  FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]));

-- Create freeze/unfreeze wallet function
CREATE OR REPLACE FUNCTION public.toggle_wallet_freeze(p_user_id uuid, p_freeze boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Only super_admin can unfreeze, admin/finance_manager can freeze
  IF p_freeze = false AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super_admin can unfreeze wallets';
  END IF;
  
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE wallets
  SET is_frozen = p_freeze,
      frozen_at = CASE WHEN p_freeze THEN now() ELSE NULL END,
      frozen_by = CASE WHEN p_freeze THEN auth.uid() ELSE NULL END,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Audit log
  PERFORM create_audit_log(
    auth.uid(),
    CASE WHEN p_freeze THEN 'wallet_frozen' ELSE 'wallet_unfrozen' END,
    'wallet',
    p_user_id::text,
    jsonb_build_object('target_user', p_user_id)
  );

  RETURN true;
END;
$$;

-- Create manual wallet credit/debit function
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(
  p_target_user_id uuid,
  p_amount numeric,
  p_type text,
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance numeric;
  v_delta numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Ensure wallet exists
  INSERT INTO wallets (user_id) VALUES (p_target_user_id) ON CONFLICT (user_id) DO NOTHING;
  
  SELECT id, balance INTO v_wallet_id, v_balance FROM wallets WHERE user_id = p_target_user_id FOR UPDATE;

  -- Check frozen
  IF (SELECT is_frozen FROM wallets WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'Wallet is frozen';
  END IF;

  IF p_type = 'manual_credit' THEN
    v_delta := p_amount;
    UPDATE wallets SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now()
    WHERE user_id = p_target_user_id;
  ELSIF p_type = 'manual_debit' THEN
    -- Prevent negative balance unless super_admin
    IF v_balance < p_amount AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
      RAISE EXCEPTION 'Insufficient balance. Only super_admin can overdraw.';
    END IF;
    v_delta := -p_amount;
    UPDATE wallets SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now()
    WHERE user_id = p_target_user_id;
  ELSIF p_type = 'admin_adjustment' THEN
    -- Large adjustments only by super_admin
    v_delta := p_amount - v_balance;
    IF abs(v_delta) > 5000 AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
      RAISE EXCEPTION 'Adjustments > ₹5000 require super_admin';
    END IF;
    IF v_delta > 0 THEN
      UPDATE wallets SET balance = p_amount, total_earned = total_earned + v_delta, updated_at = now()
      WHERE user_id = p_target_user_id;
    ELSE
      UPDATE wallets SET balance = p_amount, total_spent = total_spent + abs(v_delta), updated_at = now()
      WHERE user_id = p_target_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid type: %', p_type;
  END IF;

  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reason, created_by, expires_at)
  VALUES (v_wallet_id, p_target_user_id, v_delta, p_type, p_notes, p_reason, auth.uid(), p_expires_at);

  -- Audit log
  PERFORM create_audit_log(
    auth.uid(),
    'wallet_' || replace(p_type, 'manual_', ''),
    'wallet',
    p_target_user_id::text,
    jsonb_build_object('amount', p_amount, 'type', p_type, 'reason', p_reason, 'delta', v_delta)
  );

  -- Fraud check: >3 manual credits in 24h
  IF p_type = 'manual_credit' THEN
    IF (SELECT count(*) FROM wallet_transactions 
        WHERE user_id = p_target_user_id AND type = 'manual_credit' 
        AND created_at > now() - interval '24 hours') > 3 THEN
      INSERT INTO fraud_flags (user_id, reason)
      VALUES (p_target_user_id, 'More than 3 manual credits in 24 hours')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Fraud check: balance > 10000 without bookings
  IF (SELECT balance FROM wallets WHERE user_id = p_target_user_id) > 10000 THEN
    IF NOT EXISTS (SELECT 1 FROM bookings WHERE user_id = p_target_user_id AND booking_status = 'confirmed') THEN
      INSERT INTO fraud_flags (user_id, reason)
      VALUES (p_target_user_id, 'Wallet balance exceeds ₹10,000 without confirmed bookings')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Expire wallet credits function (for cron)
CREATE OR REPLACE FUNCTION public.expire_wallet_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  rec record;
BEGIN
  FOR rec IN
    SELECT wt.id, wt.wallet_id, wt.user_id, wt.amount
    FROM wallet_transactions wt
    WHERE wt.expires_at IS NOT NULL
      AND wt.expires_at < now()
      AND wt.is_expired = false
      AND wt.amount > 0
  LOOP
    -- Mark as expired
    UPDATE wallet_transactions SET is_expired = true, expired_at = now() WHERE id = rec.id;
    
    -- Deduct from wallet
    UPDATE wallets SET balance = GREATEST(0, balance - rec.amount), updated_at = now()
    WHERE id = rec.wallet_id;
    
    -- Log expiry transaction
    INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reason)
    VALUES (rec.wallet_id, rec.user_id, -rec.amount, 'credit_expired', 'Auto-expired credit', 'Credit expired');

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
