
-- Create leads table for exit intent & general lead capture
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'popup',
  destination_interest TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  contacted_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  wallet_credited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX idx_leads_email ON public.leads (email);

-- Index for filtering
CREATE INDEX idx_leads_source ON public.leads (source);
CREATE INDEX idx_leads_status ON public.leads (status);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for anonymous popup submissions)
CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Admins can manage all leads
CREATE POLICY "Admins can manage leads"
  ON public.leads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own lead by email (optional)
CREATE POLICY "Users can view own lead"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
