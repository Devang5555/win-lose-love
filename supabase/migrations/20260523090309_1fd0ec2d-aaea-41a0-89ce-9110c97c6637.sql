
-- 1) Coupons: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2) Reviews: restrict direct table reads to authenticated users
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view visible reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (is_visible = true);

-- 3) Public, sanitized view for reviews (no user_id / booking_id)
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true) AS
SELECT
  r.id,
  r.rating,
  r.review_text,
  r.trip_id,
  r.created_at,
  COALESCE(split_part(p.full_name, ' ', 1), 'Traveler') AS reviewer_name
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE r.is_visible = true;

GRANT SELECT ON public.public_reviews TO anon, authenticated;
