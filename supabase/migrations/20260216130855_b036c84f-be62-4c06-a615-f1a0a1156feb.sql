
-- 1) Create destinations table
CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  hero_image text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destinations"
  ON public.destinations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage destinations"
  ON public.destinations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Modify trips table (id, is_active, highlights/inclusions/exclusions text[] already exist — skip those)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id),
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS base_price numeric,
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS overview text;

-- 3) Modify batches table (id, start_date, end_date already exist — skip those)
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS available_seats integer,
  ADD COLUMN IF NOT EXISTS price_override numeric;

-- 4) Create indexes (IF NOT EXISTS not supported for indexes, use idempotent approach)
CREATE INDEX IF NOT EXISTS idx_trips_destination_id ON public.trips(destination_id);
CREATE INDEX IF NOT EXISTS idx_batches_trip_id ON public.batches(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
