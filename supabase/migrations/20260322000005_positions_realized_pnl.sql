-- Add realized_pnl column to positions for immutable closed-trade records.
-- Computed and stored at close time so reporting queries don't need to
-- re-derive P&L from entry/exit prices.
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC;
