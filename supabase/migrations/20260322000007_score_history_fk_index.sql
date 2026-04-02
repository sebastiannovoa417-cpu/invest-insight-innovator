-- Add FK from score_history.run_id → script_runs.run_id with cascade delete.
-- Also adds an index to support queries filtered by run_id.

ALTER TABLE public.score_history
  ADD CONSTRAINT fk_score_history_run_id
  FOREIGN KEY (run_id) REFERENCES public.script_runs (run_id)
  ON DELETE CASCADE;

CREATE INDEX idx_score_history_run_id ON public.score_history (run_id);
