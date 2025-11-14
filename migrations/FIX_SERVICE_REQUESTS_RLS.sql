-- Fix service_requests RLS policies
-- This fixes the 500 error on /api/service-requests

-- ============================================
-- STEP 1: Drop existing policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can view all service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can delete service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can insert service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert service requests" ON public.service_requests;

-- ============================================
-- STEP 2: Create non-recursive policies
-- ============================================

-- Users can view their own service requests
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (user_id = auth.uid());

-- Staff can view ALL service requests (for staff dashboard)
CREATE POLICY "Staff can view all service requests" ON public.service_requests
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

-- Users can create service requests
CREATE POLICY "Users can insert service requests" ON public.service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can create service requests for any user
CREATE POLICY "Staff can insert any service requests" ON public.service_requests
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

-- Staff can update service requests
CREATE POLICY "Staff can update service requests" ON public.service_requests
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

-- Only admins and founders can delete
CREATE POLICY "Admins can delete service requests" ON public.service_requests
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- ============================================
-- STEP 3: Verify
-- ============================================

SELECT 
  '✅ Service Requests RLS Policies Fixed!' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'service_requests'
ORDER BY policyname;

-- ============================================
-- NOTE
-- ============================================
-- After running this, the /api/service-requests endpoint should work for staff users

