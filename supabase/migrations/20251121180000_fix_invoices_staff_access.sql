-- Fix invoices RLS to allow staff to view all invoices
-- Preview branch uses user_roles table with app_role enum
-- First add missing enum values, then create policies

BEGIN;

-- Add missing role values to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cfi';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'founder';

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
CREATE POLICY "Staff can view all invoices"  
ON public.invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('staff'::app_role, 'admin'::app_role, 'ops'::app_role, 'founder'::app_role)
  )
);

-- 3. Staff can update invoices (for managing billing)
CREATE POLICY "Staff can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('staff'::app_role, 'admin'::app_role, 'ops'::app_role, 'founder'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('staff'::app_role, 'admin'::app_role, 'ops'::app_role, 'founder'::app_role)
  )
);

-- 4. Staff and CFIs can create invoices
CREATE POLICY "Staff can create invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('staff'::app_role, 'admin'::app_role, 'ops'::app_role, 'founder'::app_role, 'cfi'::app_role)
  )
);

-- 5. Admins can delete invoices
CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin'::app_role, 'founder'::app_role)
  )
);

COMMIT;
