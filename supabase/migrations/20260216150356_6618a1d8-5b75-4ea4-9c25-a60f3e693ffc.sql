
-- Add cancellation fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Create refunds table
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  refund_status text NOT NULL DEFAULT 'pending',
  reason text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Admin can manage refunds
CREATE POLICY "Admins can manage refunds"
  ON public.refunds
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own refunds (via booking)
CREATE POLICY "Users can view own refunds"
  ON public.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = refunds.booking_id AND b.user_id = auth.uid()
    )
  );

-- Create safe cancellation function
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
BEGIN
  -- Lock booking row
  SELECT booking_status, batch_id, num_travelers
  INTO v_booking_status, v_batch_id, v_num_travelers
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

  -- Release seats if booking was confirmed and has a batch
  IF v_booking_status = 'confirmed' AND v_batch_id IS NOT NULL THEN
    UPDATE batches
    SET available_seats = available_seats + v_num_travelers,
        seats_booked = GREATEST(0, seats_booked - v_num_travelers),
        updated_at = now()
    WHERE id = v_batch_id;
  END IF;

  -- Update booking status
  UPDATE bookings
  SET booking_status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;

  -- Create refund record if amount > 0
  IF p_refund_amount > 0 THEN
    INSERT INTO refunds (booking_id, amount, refund_status, reason)
    VALUES (p_booking_id, p_refund_amount, 'pending', p_reason);
  END IF;
END;
$$;
