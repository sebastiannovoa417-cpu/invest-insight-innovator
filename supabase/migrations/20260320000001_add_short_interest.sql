-- Migration: add short_interest column to stocks table
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE public.stocks
  ADD COLUMN IF NOT EXISTS short_interest NUMERIC;

COMMENT ON COLUMN public.stocks.short_interest IS
  'Short sell ratio as a percentage (0–100), sourced from moomoo/FutuOpenD. NULL until local enrichment script runs.';
