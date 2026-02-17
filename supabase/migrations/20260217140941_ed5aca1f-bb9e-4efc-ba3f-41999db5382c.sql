
-- Add invoice columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS invoice_generated_at timestamptz;

-- Create booking_notifications table for reminder tracking
CREATE TABLE IF NOT EXISTS public.booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL,
  channel text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications" ON public.booking_notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add GST config to internal_config
INSERT INTO public.internal_config (key, value) VALUES 
  ('company_gst_number', ''),
  ('company_name', 'GoBhraman'),
  ('company_address', 'India'),
  ('company_pan', '')
ON CONFLICT (key) DO NOTHING;

-- Create invoices storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for invoices - admins can manage
CREATE POLICY "Admins can manage invoices" ON storage.objects
FOR ALL USING (bucket_id = 'invoices' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'invoices' AND has_role(auth.uid(), 'admin'::app_role));

-- Users can view own invoices
CREATE POLICY "Users can view own invoices" ON storage.objects
FOR SELECT USING (
  bucket_id = 'invoices' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
