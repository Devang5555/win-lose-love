
-- Experiences table
CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text,
  description text,
  location text NOT NULL DEFAULT 'Pune',
  duration text NOT NULL,
  time_info text,
  price integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'activity',
  images text[] DEFAULT '{}'::text[],
  inclusions text[] DEFAULT '{}'::text[],
  exclusions text[] DEFAULT '{}'::text[],
  safety_info text[] DEFAULT '{}'::text[],
  tags text[] DEFAULT '{}'::text[],
  highlights text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  booking_live boolean DEFAULT false,
  capacity integer DEFAULT 30,
  contact_phone text DEFAULT '+91-9415026522',
  contact_email text DEFAULT 'bhramanbyua@gmail.com',
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active experiences"
  ON public.experiences FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage experiences"
  ON public.experiences FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Experience slots table
CREATE TABLE public.experience_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id text NOT NULL REFERENCES public.experiences(experience_id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  start_time text,
  end_time text,
  seat_limit integer NOT NULL DEFAULT 30,
  seats_booked integer NOT NULL DEFAULT 0,
  available_seats integer,
  price_override integer,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.experience_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slots"
  ON public.experience_slots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage slots"
  ON public.experience_slots FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experience_slots_updated_at
  BEFORE UPDATE ON public.experience_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
