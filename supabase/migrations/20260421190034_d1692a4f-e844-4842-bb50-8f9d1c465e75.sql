-- 1. Fix leads INSERT policy: replace WITH CHECK (true) with scoped check
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  WITH CHECK (
    (user_id IS NULL) OR (auth.uid() = user_id)
  );

-- 2. Add admin-only policy to internal_config
CREATE POLICY "Admins can manage internal config"
  ON public.internal_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove overly permissive referral_codes lookup policy
DROP POLICY IF EXISTS "Authenticated users can look up referral codes" ON public.referral_codes;