-- Add phone format validation constraints
-- Using a trigger approach since CHECK constraints must be immutable

-- Create validation function for phone numbers
CREATE OR REPLACE FUNCTION public.validate_phone_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strip non-digits and validate length (10-15 digits, optionally starting with +)
  IF NEW.phone IS NOT NULL AND NOT (NEW.phone ~ '^\+?[0-9]{10,15}$') THEN
    RAISE EXCEPTION 'Invalid phone number format. Must be 10-15 digits, optionally starting with +';
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to bookings table
DROP TRIGGER IF EXISTS validate_phone_bookings ON public.bookings;
CREATE TRIGGER validate_phone_bookings
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_format();

-- Add trigger to interested_users table  
DROP TRIGGER IF EXISTS validate_phone_interested_users ON public.interested_users;
CREATE TRIGGER validate_phone_interested_users
  BEFORE INSERT OR UPDATE ON public.interested_users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_format();