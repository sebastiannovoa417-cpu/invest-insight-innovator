-- Add per-ticker metadata columns to support enriched AI chatbot responses
-- and the new category-driven 25-ticker universe (penny, high-div, mod-div).

ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS dividend_yield NUMERIC,
  ADD COLUMN IF NOT EXISTS sector         TEXT,
  ADD COLUMN IF NOT EXISTS industry       TEXT,
  ADD COLUMN IF NOT EXISTS category       TEXT,
  ADD COLUMN IF NOT EXISTS forward_pe     NUMERIC,
  ADD COLUMN IF NOT EXISTS market_cap     BIGINT;

COMMENT ON COLUMN stocks.category IS 'penny | high-div | mod-div';
