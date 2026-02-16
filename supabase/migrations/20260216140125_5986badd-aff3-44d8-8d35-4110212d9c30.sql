-- Prevent confirmation of expired bookings by adding a check in the RPC
CREATE OR REPLACE FUNCTION public.confirm_booking_after_payment(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_batch_id uuid;
    v_num_travelers integer;
    v_available integer;
    v_booking_status text;
begin
    select batch_id, num_travelers, booking_status
    into v_batch_id, v_num_travelers, v_booking_status
    from bookings
    where id = p_booking_id
    for update;

    -- Block expired bookings from being confirmed
    if v_booking_status = 'expired' then
        raise exception 'This booking has expired and cannot be confirmed';
    end if;

    if v_batch_id is null then
        raise exception 'Booking not found or batch missing';
    end if;

    select available_seats
    into v_available
    from batches
    where id = v_batch_id
    for update;

    if v_available is null or v_available < v_num_travelers then
        raise exception 'Not enough seats available';
    end if;

    update batches
    set available_seats = available_seats - v_num_travelers,
        seats_booked = seats_booked + v_num_travelers,
        updated_at = now()
    where id = v_batch_id;

    update bookings
    set booking_status = 'confirmed',
        payment_status = 'pending_advance',
        updated_at = now()
    where id = p_booking_id;
end;
$function$;