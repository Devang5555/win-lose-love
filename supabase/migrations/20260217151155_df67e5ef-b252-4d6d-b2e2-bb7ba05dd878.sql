ALTER TABLE public.wallet_transactions DROP CONSTRAINT wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type = ANY (ARRAY[
  'referral_credit', 'booking_debit', 'admin_credit', 'admin_debit', 
  'signup_bonus', 'manual_credit', 'manual_debit', 'admin_adjustment', 'credit_expired'
]));