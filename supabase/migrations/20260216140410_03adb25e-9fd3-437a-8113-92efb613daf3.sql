-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  price_at_save NUMERIC NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trip_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to own wishlist"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can delete from own wishlist"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all wishlists
CREATE POLICY "Admins can manage wishlists"
ON public.wishlist FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));