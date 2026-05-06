-- SEO metadata (non-destructive, nullable)
ALTER TABLE public.trips        ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.experiences  ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS seo jsonb;

-- Soft delete on trips
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Soft delete on experiences
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Auto-archive expired batches: any active batch whose end_date is in the past
-- and which has no upcoming sibling will be marked status='archived'.
CREATE OR REPLACE FUNCTION public.auto_archive_expired_batches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.batches
     SET status = 'archived', updated_at = now()
   WHERE status = 'active'
     AND end_date < CURRENT_DATE - INTERVAL '1 day';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Safe restore RPC for trips
CREATE OR REPLACE FUNCTION public.restore_trip(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  UPDATE public.trips
     SET is_deleted = false, deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE id = p_trip_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_experience(p_experience_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  UPDATE public.experiences
     SET is_deleted = false, deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE id = p_experience_id;
END;
$$;