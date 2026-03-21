-- Adds name and short_interest columns to stocks table.
-- These columns were added directly in the Supabase Dashboard after the initial
-- migration and are already present in the live DB. This migration brings the
-- tracked schema in sync so a fresh deployment gets the full schema.

ALTER TABLE public.stocks
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS short_interest NUMERIC;
