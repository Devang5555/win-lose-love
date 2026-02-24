
-- Drop the overly permissive public lookup policy
DROP POLICY IF EXISTS "Anyone can look up referral codes" ON public.referral_codes;

-- Create a restricted policy: only authenticated users can look up codes (needed for referral validation)
CREATE POLICY "Authenticated users can look up referral codes"
ON public.referral_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);
