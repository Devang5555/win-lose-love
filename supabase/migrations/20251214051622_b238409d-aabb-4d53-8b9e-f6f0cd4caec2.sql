-- Make the payment-screenshots bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'payment-screenshots';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view payment screenshots" ON storage.objects;

-- Create policy for users to view their own payment screenshots
CREATE POLICY "Users can view own payment screenshots" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for admins to view all payment screenshots
CREATE POLICY "Admins can view all payment screenshots" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'payment-screenshots' 
  AND public.has_role(auth.uid(), 'admin')
);