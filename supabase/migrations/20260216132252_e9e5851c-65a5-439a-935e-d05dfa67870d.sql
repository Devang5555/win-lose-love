
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
begin
    select batch_id, num_travelers
    into v_batch_id, v_num_travelers
    from bookings
    where id = p_booking_id
    for update;

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

CREATE OR REPLACE FUNCTION public.create_booking_atomic(p_user_id uuid, p_trip_id text, p_batch_id uuid, p_travelers integer, p_total_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_available integer;
    v_booking_id uuid;
begin
    select available_seats
    into v_available
    from batches
    where id = p_batch_id
    for update;

    if v_available is null then
        raise exception 'Batch not found';
    end if;

    if v_available < p_travelers then
        raise exception 'Not enough seats available';
    end if;

    update batches
    set available_seats = available_seats - p_travelers
    where id = p_batch_id;

    insert into bookings (
        id, user_id, trip_id, num_travelers, total_amount,
        booking_status, payment_status, created_at
    )
    values (
        gen_random_uuid(), p_user_id, p_trip_id, p_travelers, p_total_amount,
        'new', 'pending', now()
    )
    returning id into v_booking_id;

    return v_booking_id;
end;
$function$;
