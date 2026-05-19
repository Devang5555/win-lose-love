-- Non-destructive: add add-ons support to trips (catalog) and bookings (selected)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS addons_total integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.trips.addons IS 'Reusable add-on catalog: [{id, name, price, max_qty, description}]';
COMMENT ON COLUMN public.bookings.addons IS 'Selected add-ons on this booking: [{id, name, price, qty}]';
COMMENT ON COLUMN public.bookings.addons_total IS 'Sum of addon.price * qty at time of booking (₹)';