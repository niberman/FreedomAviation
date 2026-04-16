-- =============================================================================
-- INVOICE BATCHES
-- =============================================================================
-- Groups multiple unpaid invoices into a single payment link + email. Original
-- invoices remain intact; a batch is a pointer that aggregates totals and
-- carries one Stripe checkout session. On payment, every invoice in the batch
-- is marked paid via the webhook handler.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'cancelled')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_batches_owner ON public.invoice_batches(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoice_batches_status ON public.invoice_batches(status);
CREATE INDEX IF NOT EXISTS idx_invoice_batches_session ON public.invoice_batches(stripe_checkout_session_id);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.invoice_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_batch_id ON public.invoices(batch_id);

-- RLS
ALTER TABLE public.invoice_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own batches" ON public.invoice_batches;
CREATE POLICY "Owners can view own batches"
ON public.invoice_batches
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all batches" ON public.invoice_batches;
CREATE POLICY "Staff can view all batches"
ON public.invoice_batches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder', 'cfi')
  )
);

DROP POLICY IF EXISTS "Staff can manage batches" ON public.invoice_batches;
CREATE POLICY "Staff can manage batches"
ON public.invoice_batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder', 'cfi')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'ops', 'founder', 'cfi')
  )
);
