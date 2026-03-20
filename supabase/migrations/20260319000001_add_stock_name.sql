-- Add display name column to stocks table.
-- The Python pipeline emits "name" from the TICKER_NAMES dict in fetch_and_score.py.
-- Falls back to ticker symbol if NULL (handled in mapDbStock).
ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS name TEXT;
