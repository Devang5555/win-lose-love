
-- Step 1: Only extend the enum (must be committed before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
