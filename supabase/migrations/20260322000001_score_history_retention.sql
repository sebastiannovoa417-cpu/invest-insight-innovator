-- Enforce 30-day rolling retention for score_history via an AFTER INSERT trigger.
-- Each new insert for a ticker automatically prunes rows older than 30 days for
-- that ticker, keeping the table bounded without a separate cron job.

CREATE OR REPLACE FUNCTION public.prune_score_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.score_history
  WHERE ticker = NEW.ticker
    AND recorded_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prune_score_history
AFTER INSERT ON public.score_history
FOR EACH ROW EXECUTE FUNCTION public.prune_score_history();
