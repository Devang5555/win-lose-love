-- 1. AUDIT LOGS: remove direct user INSERT; only SECURITY DEFINER RPC (create_audit_log) may write
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

-- 2. BOOKINGS: prevent non-admin users from escalating sensitive fields / statuses
CREATE OR REPLACE FUNCTION public.enforce_booking_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only restrict direct client updates (authenticated/anon roles).
  -- SECURITY DEFINER RPCs run as the table owner and are exempt.
  IF current_user IN ('authenticated', 'anon')
     AND NOT has_role(auth.uid(), 'admin'::app_role) THEN

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.coupon_discount IS DISTINCT FROM OLD.coupon_discount
       OR NEW.wallet_discount IS DISTINCT FROM OLD.wallet_discount
       OR NEW.coupon_code IS DISTINCT FROM OLD.coupon_code
       OR NEW.verified_by_admin_id IS DISTINCT FROM OLD.verified_by_admin_id
       OR NEW.is_deleted IS DISTINCT FROM OLD.is_deleted
       OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       OR NEW.remaining_payment_verified_at IS DISTINCT FROM OLD.remaining_payment_verified_at
    THEN
      RAISE EXCEPTION 'Not allowed to modify protected booking fields';
    END IF;

    IF NEW.booking_status IS DISTINCT FROM OLD.booking_status
       AND NEW.booking_status NOT IN ('pending', 'initiated', 'cancelled') THEN
      RAISE EXCEPTION 'Not allowed to set booking_status to %', NEW.booking_status;
    END IF;

    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
       AND NEW.payment_status NOT IN ('pending', 'pending_advance', 'balance_pending') THEN
      RAISE EXCEPTION 'Not allowed to set payment_status to %', NEW.payment_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_booking_update_guard_trg ON public.bookings;
CREATE TRIGGER enforce_booking_update_guard_trg
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_update_guard();

-- 3. REVIEWS: restrict direct reads to owners (admins covered by separate policy);
-- public display uses the sanitized public_reviews view.
DROP POLICY IF EXISTS "Authenticated users can view visible reviews" ON public.reviews;
CREATE POLICY "Users can view own reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);