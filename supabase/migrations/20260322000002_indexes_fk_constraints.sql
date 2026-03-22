-- Performance indexes, missing foreign key, and uniqueness constraints.

-- 1. Index on script_runs(ran_at DESC) — useLastRun() orders by this column
CREATE INDEX IF NOT EXISTS idx_script_runs_ran_at
  ON public.script_runs (ran_at DESC);

-- 2. Unique constraint on script_runs(run_id) — prevents duplicate run log entries
ALTER TABLE public.script_runs
  ADD CONSTRAINT uq_script_runs_run_id UNIQUE (run_id);

-- 3. Index on watchlist(user_id) — every watchlist query filters by user_id
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id
  ON public.watchlist (user_id);

-- 4. Foreign key: score_history.ticker → stocks.ticker
--    Cascades deletes so removing a stock cleans up its history automatically.
ALTER TABLE public.score_history
  ADD CONSTRAINT fk_score_history_ticker
  FOREIGN KEY (ticker) REFERENCES public.stocks (ticker)
  ON DELETE CASCADE;
