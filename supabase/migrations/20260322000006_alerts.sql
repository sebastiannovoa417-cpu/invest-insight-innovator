-- User-scoped price alert rules.
-- status transitions: active → triggered (stays triggered until manually reset via UI).
-- The check-alerts Edge Function evaluates active alerts on every pipeline run.
CREATE TABLE
    IF NOT EXISTS public.alerts (
        id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
        ticker TEXT NOT NULL,
        condition TEXT NOT NULL CHECK (
            condition IN (
                'bull_score_gte',
                'bear_score_gte',
                'rsi_above',
                'rsi_below',
                'price_above',
                'price_below'
            )
        ),
        threshold NUMERIC NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered')),
        triggered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts (user_id);

-- Partial index: fast scan of only active alerts during pipeline check
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts (ticker)
WHERE
    status = 'active';

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own alerts" ON public.alerts FOR ALL TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);