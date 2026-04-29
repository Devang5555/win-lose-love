-- Non-destructive: add itinerary_data and policies JSONB columns to trips
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS itinerary_data jsonb,
  ADD COLUMN IF NOT EXISTS policies jsonb;

COMMENT ON COLUMN public.trips.itinerary_data IS 'Admin-editable day-wise itinerary. Shape: { overview?: [{label,value}], itinerary: [{day,title,stay?,items:[]}], staySummary?: [], distanceSummary?: [], hotels?: [{city, hotels:[]}], places?: [{name,desc,img}], travelNotes?: [{text}], bestTime?: string }';
COMMENT ON COLUMN public.trips.policies IS 'Admin-editable trip policies. Shape: { items: string[] }';