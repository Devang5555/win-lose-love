
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'trip',
  ADD COLUMN IF NOT EXISTS event_time text,
  ADD COLUMN IF NOT EXISTS short_duration text,
  ADD COLUMN IF NOT EXISTS experience_category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS safety_info text[] DEFAULT '{}'::text[];
