
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and super_admins can view audit logs
CREATE POLICY "Admin roles can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Authenticated users can insert their own audit logs
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper: check if user has ANY of specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Helper: get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(role), '{}')
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Audit log insertion function
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$;

-- Update cancel_booking to include audit logging
CREATE OR REPLACE FUNCTION public.cancel_booking_with_seat_release(
  p_booking_id uuid,
  p_reason text,
  p_refund_amount numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking_status text;
  v_batch_id uuid;
  v_num_travelers integer;
  v_trip_id text;
BEGIN
  SELECT booking_status, batch_id, num_travelers, trip_id
  INTO v_booking_status, v_batch_id, v_num_travelers, v_trip_id
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking_status IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_booking_status = 'expired' THEN
    RAISE EXCEPTION 'Cannot cancel expired bookings';
  END IF;
  IF v_booking_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  IF v_booking_status = 'confirmed' AND v_batch_id IS NOT NULL THEN
    UPDATE batches
    SET available_seats = available_seats + v_num_travelers,
        seats_booked = GREATEST(0, seats_booked - v_num_travelers),
        updated_at = now()
    WHERE id = v_batch_id;
  END IF;

  UPDATE bookings
  SET booking_status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;

  IF p_refund_amount > 0 THEN
    INSERT INTO refunds (booking_id, amount, refund_status, reason)
    VALUES (p_booking_id, p_refund_amount, 'pending', p_reason);
  END IF;

  -- Audit log
  PERFORM create_audit_log(
    auth.uid(),
    'cancel_booking',
    'booking',
    p_booking_id::text,
    jsonb_build_object('reason', p_reason, 'refund_amount', p_refund_amount, 'trip_id', v_trip_id, 'travelers', v_num_travelers, 'previous_status', v_booking_status)
  );
END;
$$;

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
