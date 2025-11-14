-- Migration: Add founder role to all RLS policies
-- This ensures founder has superuser access to all tables
-- Run this script in Supabase SQL Editor

-- ============================================
-- USER PROFILES
-- ============================================

-- Drop and recreate policy to include founder
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins and staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- AIRCRAFT
-- ============================================

DROP POLICY IF EXISTS "Owners can view own aircraft" ON public.aircraft;
CREATE POLICY "Owners can view own aircraft" ON public.aircraft
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can insert aircraft" ON public.aircraft;
CREATE POLICY "Admins can insert aircraft" ON public.aircraft
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can update any aircraft" ON public.aircraft;
CREATE POLICY "Admins can update any aircraft" ON public.aircraft
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can delete aircraft" ON public.aircraft;
CREATE POLICY "Admins can delete aircraft" ON public.aircraft
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- MEMBERSHIPS
-- ============================================

DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
CREATE POLICY "Users can view own memberships" ON public.memberships
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- MAINTENANCE
-- ============================================

DROP POLICY IF EXISTS "Aircraft owners can view maintenance" ON public.maintenance;
CREATE POLICY "Aircraft owners can view maintenance" ON public.maintenance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can insert maintenance" ON public.maintenance;
CREATE POLICY "Admins can insert maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can update maintenance" ON public.maintenance;
CREATE POLICY "Admins can update maintenance" ON public.maintenance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can delete maintenance" ON public.maintenance;
CREATE POLICY "Admins can delete maintenance" ON public.maintenance
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- CONSUMABLE EVENTS
-- ============================================

DROP POLICY IF EXISTS "Aircraft owners can view consumable events" ON public.consumable_events;
CREATE POLICY "Aircraft owners can view consumable events" ON public.consumable_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can insert consumable events" ON public.consumable_events;
CREATE POLICY "Admins can insert consumable events" ON public.consumable_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can update consumable events" ON public.consumable_events;
CREATE POLICY "Admins can update consumable events" ON public.consumable_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can delete consumable events" ON public.consumable_events;
CREATE POLICY "Admins can delete consumable events" ON public.consumable_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- SERVICE REQUESTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can update service requests" ON public.service_requests;
CREATE POLICY "Admins can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can delete service requests" ON public.service_requests;
CREATE POLICY "Admins can delete service requests" ON public.service_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- SERVICE TASKS
-- ============================================

DROP POLICY IF EXISTS "Aircraft owners can view service tasks" ON public.service_tasks;
CREATE POLICY "Aircraft owners can view service tasks" ON public.service_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can insert service tasks" ON public.service_tasks;
CREATE POLICY "Admins can insert service tasks" ON public.service_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can update service tasks" ON public.service_tasks;
CREATE POLICY "Admins can update service tasks" ON public.service_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can delete service tasks" ON public.service_tasks;
CREATE POLICY "Admins can delete service tasks" ON public.service_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- INVOICES
-- ============================================

DROP POLICY IF EXISTS "Owners can view own invoices" ON public.invoices;
CREATE POLICY "Owners can view own invoices" ON public.invoices
  FOR SELECT USING (
    owner_id = auth.uid() OR
    created_by_cfi_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

DROP POLICY IF EXISTS "CFIs can insert instruction invoices" ON public.invoices;
CREATE POLICY "CFIs can insert instruction invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    category = 'instruction' AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
CREATE POLICY "Admins can manage all invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- INVOICE LINES
-- ============================================

DROP POLICY IF EXISTS "Users can view invoice lines for accessible invoices" ON public.invoice_lines;
CREATE POLICY "Users can view invoice lines for accessible invoices" ON public.invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id AND (
        owner_id = auth.uid() OR 
        created_by_cfi_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
      )
    )
  );

DROP POLICY IF EXISTS "CFIs and admins can insert invoice lines" ON public.invoice_lines;
CREATE POLICY "CFIs and admins can insert invoice lines" ON public.invoice_lines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can manage all invoice lines" ON public.invoice_lines;
CREATE POLICY "Admins can manage all invoice lines" ON public.invoice_lines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Update create_instruction_invoice to recognize founder
CREATE OR REPLACE FUNCTION public.create_instruction_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,
  p_description TEXT,
  p_hours DECIMAL,
  p_rate_cents INTEGER,
  p_cfi_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_role TEXT;
  v_aircraft_owner_id UUID;
BEGIN
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the CFI ID matches the authenticated user (or user is admin/founder)
  IF p_cfi_id != auth.uid() THEN
    -- Check if user is admin or founder
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'CFI ID must match authenticated user';
    END IF;
  END IF;
  
  -- Verify user has CFI, admin, or founder role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('cfi', 'admin', 'founder') THEN
    RAISE EXCEPTION 'Only CFIs, admins, and founders can create instruction invoices';
  END IF;
  
  -- Verify aircraft exists and belongs to owner
  SELECT owner_id INTO v_aircraft_owner_id
  FROM public.aircraft
  WHERE id = p_aircraft_id;
  
  IF v_aircraft_owner_id IS NULL THEN
    RAISE EXCEPTION 'Aircraft not found';
  END IF;
  
  IF v_aircraft_owner_id != p_owner_id THEN
    RAISE EXCEPTION 'Aircraft does not belong to the specified owner';
  END IF;
  
  -- Verify owner exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'Owner not found';
  END IF;
  
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Insert invoice
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id
  ) VALUES (
    p_owner_id,
    p_aircraft_id,
    v_invoice_number,
    0, -- Will be updated by finalize_invoice
    'draft',
    'instruction',
    p_cfi_id
  ) RETURNING id INTO v_invoice_id;
  
  -- Insert invoice line
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    p_description,
    p_hours,
    p_rate_cents
  );
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update finalize_invoice to recognize founder
CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_cents INTEGER;
  v_cfi_id UUID;
  v_is_admin_or_founder BOOLEAN;
BEGIN
  -- Check authorization: only CFI who created it, admin, or founder can finalize
  SELECT created_by_cfi_id INTO v_cfi_id
  FROM public.invoices
  WHERE id = p_invoice_id AND category = 'instruction';
  
  IF v_cfi_id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found or not an instruction invoice';
  END IF;
  
  -- Check if user is admin or founder
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'founder')
  ) INTO v_is_admin_or_founder;
  
  -- Verify authorization: CFI who created it, admin, or founder
  IF v_cfi_id != auth.uid() AND NOT v_is_admin_or_founder THEN
    RAISE EXCEPTION 'Not authorized to finalize this invoice';
  END IF;
  
  -- Calculate total from invoice lines
  SELECT COALESCE(SUM(quantity * unit_cents), 0)
  INTO v_total_cents
  FROM public.invoice_lines
  WHERE invoice_id = p_invoice_id;
  
  -- Update invoice
  UPDATE public.invoices
  SET 
    amount = v_total_cents / 100.0,
    status = 'finalized',
    updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all policies that should now include founder
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'aircraft', 'memberships', 'maintenance', 
                    'consumable_events', 'service_requests', 'service_tasks', 
                    'invoices', 'invoice_lines')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added founder role to all RLS policies!';
  RAISE NOTICE 'Founder now has superuser access to all tables.';
END $$;




