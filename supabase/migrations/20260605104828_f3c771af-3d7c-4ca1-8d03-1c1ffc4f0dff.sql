-- referral_codes: only generate_referral_code RPC may create codes
DROP POLICY IF EXISTS "Users can insert own referral code" ON public.referral_codes;

-- wallets: only SECURITY DEFINER RPCs (signup/referral/admin flows) may create wallets
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;