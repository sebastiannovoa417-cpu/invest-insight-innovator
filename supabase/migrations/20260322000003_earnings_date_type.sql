-- Change earnings_date from TEXT to DATE for proper type validation.
-- The Python pipeline already emits ISO "YYYY-MM-DD" strings (or NULL),
-- so the USING cast is safe for all existing rows.
ALTER TABLE public.stocks
  ALTER COLUMN earnings_date TYPE DATE
  USING CASE
    WHEN earnings_date IS NULL OR earnings_date = '' THEN NULL
    ELSE earnings_date::date
  END;
