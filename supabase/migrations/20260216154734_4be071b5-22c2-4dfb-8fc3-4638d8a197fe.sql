
-- WhatsApp consent tracking
CREATE TABLE public.whatsapp_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  opted_in boolean NOT NULL DEFAULT true,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  opted_out_at timestamptz,
  source text NOT NULL DEFAULT 'booking', -- booking, profile, manual
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);

ALTER TABLE public.whatsapp_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.whatsapp_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON public.whatsapp_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents" ON public.whatsapp_consents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all consents" ON public.whatsapp_consents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Broadcast messages created by admin
CREATE TABLE public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  message_template text NOT NULL,
  audience_type text NOT NULL DEFAULT 'all', -- all, destination, upcoming_trips
  audience_filter jsonb DEFAULT '{}'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft, sending, sent, failed
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcasts" ON public.broadcast_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Individual message delivery logs
CREATE TABLE public.whatsapp_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid REFERENCES public.broadcast_messages(id),
  recipient_phone text NOT NULL,
  recipient_user_id uuid,
  message_type text NOT NULL DEFAULT 'broadcast', -- broadcast, reminder, confirmation
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed
  error_message text,
  whatsapp_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage message logs" ON public.whatsapp_message_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add whatsapp_optin to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS whatsapp_optin boolean DEFAULT false;

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_consents_updated_at
  BEFORE UPDATE ON public.whatsapp_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broadcast_messages_updated_at
  BEFORE UPDATE ON public.broadcast_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
