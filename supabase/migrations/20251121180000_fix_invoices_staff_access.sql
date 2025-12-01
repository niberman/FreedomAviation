-- Fix invoices RLS to allow staff to view all invoices
-- Preview branch uses user_roles table with app_role enum
-- First add missing enum values, then create policies

BEGIN;

-- Add missing role values to app_role enum (if type exists)
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cfi';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'founder';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Owners can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "owner can select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Owners can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "CFIs can insert instruction invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can create invoices" ON public.invoices;

-- Create new policies

-- 1. Owners can view their own invoices
CREATE POLICY "Owners can view own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- 2. Staff can view ALL invoices (CRITICAL FIX!)
-- Uses user_roles table to check if user has staff/admin/ops/founder role
-- Fallback to user_profiles if user_roles does not exist
CREATE POLICY "Staff can view all invoices"  
ON public.invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder')
  )
);

-- 3. Staff can update invoices (for managing billing)
CREATE POLICY "Staff can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder')
  )
);

-- 4. Staff and CFIs can create invoices
CREATE POLICY "Staff can create invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder', 'cfi')
  )
);

-- 5. Admins can delete invoices
CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'founder')
  )
);

COMMIT;
