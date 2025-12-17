-- Create batches table for trip batch management
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  batch_size INTEGER NOT NULL DEFAULT 20,
  seats_booked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Public can view active batches
CREATE POLICY "Anyone can view active batches"
ON public.batches
FOR SELECT
USING (status = 'active');

-- Admins can manage batches
CREATE POLICY "Admins can manage batches"
ON public.batches
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create payments table for payment tracking
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'advance',
  amount NUMERIC NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view own payments
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Users can create payments for own bookings
CREATE POLICY "Users can create payments"
ON public.payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payments
CREATE POLICY "Admins can update payments"
ON public.payments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add batch_id and payment tracking columns to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id),
ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 2000,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_advance';

-- Create trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default batches for Malvan Escape
INSERT INTO public.batches (trip_id, batch_name, start_date, end_date, batch_size, status)
VALUES 
  ('malvan-bhraman-001', 'January Batch 2025', '2025-01-15', '2025-01-17', 25, 'active'),
  ('malvan-bhraman-001', 'February Batch 2025', '2025-02-14', '2025-02-16', 25, 'active'),
  ('malvan-bhraman-001', 'March Batch 2025', '2025-03-21', '2025-03-23', 25, 'active');