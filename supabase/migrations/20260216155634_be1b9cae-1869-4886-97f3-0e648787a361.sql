
-- Wallets table: one per user
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage wallets" ON public.wallets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can look up referral codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Wallet transactions table (audit trail)
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('referral_credit', 'booking_debit', 'admin_credit', 'admin_debit', 'signup_bonus')),
  description text,
  reference_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Referral earnings table (tracks who referred whom)
CREATE TABLE public.referral_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id),
  amount numeric NOT NULL DEFAULT 250,
  status text NOT NULL DEFAULT 'credited' CHECK (status IN ('pending', 'credited')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral earnings" ON public.referral_earnings FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "Admins can manage referral earnings" ON public.referral_earnings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add referral_code_used to bookings
ALTER TABLE public.bookings ADD COLUMN referral_code_used text;
ALTER TABLE public.bookings ADD COLUMN wallet_discount numeric DEFAULT 0;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  -- Check if user already has a code
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
  
  -- Ensure wallet exists
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  RETURN v_code;
END;
$$;

-- Function to credit referral reward
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
BEGIN
  -- Find referrer
  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = p_referrer_code;
  IF v_referrer_id IS NULL OR v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  -- Ensure wallet exists
  INSERT INTO wallets (user_id) VALUES (v_referrer_id) ON CONFLICT (user_id) DO NOTHING;

  -- Credit wallet
  UPDATE wallets SET balance = balance + v_reward, total_earned = total_earned + v_reward, updated_at = now()
  WHERE user_id = v_referrer_id
  RETURNING id INTO v_wallet_id;

  -- Record transaction
  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, v_referrer_id, v_reward, 'referral_credit', 'Referral reward for friend''s booking', p_booking_id::text);

  -- Record referral earning
  INSERT INTO referral_earnings (referrer_user_id, referred_user_id, booking_id, amount, status)
  VALUES (v_referrer_id, p_referred_user_id, p_booking_id, v_reward, 'credited');

  -- Increment uses count
  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE code = p_referrer_code;

  RETURN true;
END;
$$;

-- Function to apply wallet credit to booking
CREATE OR REPLACE FUNCTION public.apply_wallet_to_booking(p_user_id uuid, p_booking_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance numeric;
BEGIN
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
$$;

-- Trigger for updated_at on wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
