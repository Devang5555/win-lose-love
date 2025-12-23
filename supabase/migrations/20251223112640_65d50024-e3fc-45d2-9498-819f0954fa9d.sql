-- Add remaining payment tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS remaining_payment_status text DEFAULT 'pending' CHECK (remaining_payment_status IN ('pending', 'uploaded', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS remaining_payment_uploaded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS remaining_payment_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by_admin_id uuid,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing bookings that have remaining_screenshot_url to set status to 'uploaded'
UPDATE public.bookings 
SET remaining_payment_status = 'uploaded'
WHERE remaining_screenshot_url IS NOT NULL AND remaining_payment_status = 'pending';

-- Update bookings that are fully_paid to set remaining_payment_status to 'verified'
UPDATE public.bookings 
SET remaining_payment_status = 'verified'
WHERE payment_status = 'fully_paid' AND remaining_payment_status = 'pending';