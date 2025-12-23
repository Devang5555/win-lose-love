-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots', 
  'payment-screenshots', 
  false,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Storage policies for payment-screenshots bucket
-- Users can upload their own screenshots
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own screenshots
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all screenshots
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-screenshots' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage all screenshots
CREATE POLICY "Admins can manage payment screenshots"
ON storage.objects FOR ALL
USING (
  bucket_id = 'payment-screenshots' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add screenshot columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS advance_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS remaining_screenshot_url TEXT;

-- Update payment_status to support new states
-- The new states will be: pending_advance, advance_verified, balance_pending, balance_verified, fully_paid
-- We'll just use the existing text column and update the values in code