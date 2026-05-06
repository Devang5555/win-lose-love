-- Backfill NULL available_seats and harden confirmation RPC
UPDATE public.batches
   SET available_seats = GREATEST(0, batch_size - COALESCE(seats_booked, 0))
 WHERE available_seats IS NULL;

CREATE OR REPLACE FUNCTION public.confirm_booking_after_payment(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_batch_id uuid;
    v_num_travelers integer;
    v_available integer;
    v_batch_size integer;
    v_seats_booked integer;
    v_booking_status text;
    v_owner_id uuid;
BEGIN
    SELECT batch_id, num_travelers, booking_status, user_id
    INTO v_batch_id, v_num_travelers, v_booking_status, v_owner_id
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    IF v_owner_id IS DISTINCT FROM auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;

    IF v_booking_status = 'expired' THEN
        RAISE EXCEPTION 'This booking has expired and cannot be confirmed';
    END IF;
    IF v_booking_status = 'confirmed' THEN
        -- Already confirmed, no-op (idempotent)
        RETURN;
    END IF;
    IF v_batch_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found or batch missing';
    END IF;

    SELECT available_seats, batch_size, seats_booked
    INTO v_available, v_batch_size, v_seats_booked
    FROM batches
    WHERE id = v_batch_id
    FOR UPDATE;

    -- Fallback: derive from batch_size - seats_booked when available_seats is null
    IF v_available IS NULL THEN
      v_available := GREATEST(0, COALESCE(v_batch_size, 0) - COALESCE(v_seats_booked, 0));
    END IF;

    IF v_available < v_num_travelers THEN
        RAISE EXCEPTION 'Not enough seats available (only % left)', v_available;
    END IF;

    UPDATE batches
    SET available_seats = v_available - v_num_travelers,
        seats_booked = COALESCE(seats_booked, 0) + v_num_travelers,
        updated_at = now()
    WHERE id = v_batch_id;

    UPDATE bookings
    SET booking_status = 'confirmed',
        payment_status = 'pending_advance',
        updated_at = now()
    WHERE id = p_booking_id;
END;
$function$;