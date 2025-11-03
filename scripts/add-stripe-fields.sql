-- Migration: Add Stripe fields to invoices table
-- Run this in Supabase SQL Editor if the invoices table already exists

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout ON public.invoices(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent ON public.invoices(stripe_payment_intent_id);

