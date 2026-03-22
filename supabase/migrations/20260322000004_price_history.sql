-- Daily OHLCV price history for backtesting.
-- Populated by the Python pipeline each run (INSERT ... ON CONFLICT DO NOTHING).
-- Public read-only; writes only via sync-prices Edge Function (service role).

CREATE TABLE IF NOT EXISTS public.price_history (
  id         UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker     TEXT    NOT NULL,
  date       DATE    NOT NULL,
  open       NUMERIC NOT NULL,
  high       NUMERIC NOT NULL,
  low        NUMERIC NOT NULL,
  close      NUMERIC NOT NULL,
  volume     BIGINT,
  CONSTRAINT uq_price_history_ticker_date UNIQUE (ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_price_history_ticker_date
  ON public.price_history (ticker, date DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price_history"
  ON public.price_history
  FOR SELECT
  USING (true);
