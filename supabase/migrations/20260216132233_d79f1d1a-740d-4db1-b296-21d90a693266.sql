
CREATE OR REPLACE FUNCTION public.confirm_booking_after_payment(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
    v_batch_id uuid;
    v_num_travelers integer;
    v_available integer;
begin
    -- Get booking info
    select batch_id, num_travelers
    into v_batch_id, v_num_travelers
    from bookings
    where id = p_booking_id
    for update;

    if v_batch_id is null then
        raise exception 'Booking not found or batch missing';
    end if;

    -- Lock batch row
    select available_seats
    into v_available
    from batches
    where id = v_batch_id
    for update;

    if v_available is null or v_available < v_num_travelers then
        raise exception 'Not enough seats available';
    end if;

    -- Deduct seats
    update batches
    set available_seats = available_seats - v_num_travelers,
        seats_booked = seats_booked + v_num_travelers,
        updated_at = now()
    where id = v_batch_id;

    -- Confirm booking with pending_advance status for admin verification
    update bookings
    set booking_status = 'confirmed',
        payment_status = 'pending_advance',
        updated_at = now()
    where id = p_booking_id;

end;
$function$;
