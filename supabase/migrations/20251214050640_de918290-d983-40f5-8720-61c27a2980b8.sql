-- Create interested_users table for storing leads
CREATE TABLE public.interested_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  trip_name TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'interested',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interested_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create interest entries"
ON public.interested_users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all interested users"
ON public.interested_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update interested users"
ON public.interested_users
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own interest entries"
ON public.interested_users
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_interested_users_updated_at
BEFORE UPDATE ON public.interested_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();