-- Add DELETE and UPDATE policies for invoices and invoice_lines

DO $$ 
BEGIN
  -- INVOICES Policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    
    -- Allow CFIs to delete their own pending/draft invoices
    DROP POLICY IF EXISTS "CFIs can delete own draft invoices" ON public.invoices;
    CREATE POLICY "CFIs can delete own draft invoices" ON public.invoices
      FOR DELETE USING (
        (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
        AND (status IN ('draft', 'pending', 'finalized')) -- Allow deleting finalized invoices too if needed, or just draft/pending
      );

    -- Allow CFIs to update their own invoices
    DROP POLICY IF EXISTS "CFIs can update own invoices" ON public.invoices;
    CREATE POLICY "CFIs can update own invoices" ON public.invoices
      FOR UPDATE USING (
        (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
      )
      WITH CHECK (
        (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
      );
      
  END IF;

  -- INVOICE_LINES Policies (Cascade delete is handled by FK usually, but RLS might block it if not careful)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_lines') THEN
    
    -- Allow CFIs to delete invoice lines if they can update the invoice
    DROP POLICY IF EXISTS "CFIs can delete invoice lines" ON public.invoice_lines;
    CREATE POLICY "CFIs can delete invoice lines" ON public.invoice_lines
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.invoices 
          WHERE id = invoice_id 
          AND (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
        )
      );

    -- Allow CFIs to update invoice lines
    DROP POLICY IF EXISTS "CFIs can update invoice lines" ON public.invoice_lines;
    CREATE POLICY "CFIs can update invoice lines" ON public.invoice_lines
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.invoices 
          WHERE id = invoice_id 
          AND (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.invoices 
          WHERE id = invoice_id 
          AND (created_by_cfi_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
        )
      );

  END IF;

END $$;















