-- AI learning foundation: user-controlled telemetry and feedback loop

-- 1) Per-user AI learning preferences (opt-in controls)
CREATE TABLE public.ai_learning_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_learning BOOLEAN NOT NULL DEFAULT false,
  allow_chat_storage BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_learning_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI learning preferences"
  ON public.ai_learning_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own AI learning preferences"
  ON public.ai_learning_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI learning preferences"
  ON public.ai_learning_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Chat event telemetry (question + response metadata)
CREATE TABLE public.ai_chat_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT,
  answer_hash TEXT NOT NULL,
  answer_preview TEXT,
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI chat events"
  ON public.ai_chat_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI chat events"
  ON public.ai_chat_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_chat_events_user_created
  ON public.ai_chat_events(user_id, created_at DESC);

-- 3) Explicit feedback attached to a chat event
CREATE TABLE public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.ai_chat_events(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  actionable BOOLEAN,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI feedback"
  ON public.ai_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI feedback"
  ON public.ai_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI feedback"
  ON public.ai_feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_feedback_user_created
  ON public.ai_feedback(user_id, created_at DESC);

-- 4) Attribution fields on positions to connect trades to AI events
ALTER TABLE public.positions
  ADD COLUMN opened_from_ai BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_event_id UUID REFERENCES public.ai_chat_events(id) ON DELETE SET NULL,
  ADD COLUMN ai_confidence_snapshot NUMERIC;
