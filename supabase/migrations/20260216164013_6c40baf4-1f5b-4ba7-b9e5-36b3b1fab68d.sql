
-- Create payment_reminders table for tracking sent reminders
CREATE TABLE public.payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'whatsapp',
  sent_by uuid NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and finance can manage reminders"
  ON public.payment_reminders FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'finance_manager'::app_role]));

CREATE INDEX idx_payment_reminders_booking ON public.payment_reminders(booking_id);
