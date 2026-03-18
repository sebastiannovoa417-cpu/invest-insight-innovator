
-- REGIME TABLE
CREATE TABLE public.regime (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  spy_price NUMERIC NOT NULL,
  sma_200 NUMERIC NOT NULL,
  sma_50 NUMERIC NOT NULL,
  spy_rsi NUMERIC NOT NULL,
  vix NUMERIC NOT NULL,
  ratio NUMERIC NOT NULL,
  regime_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.regime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read regime" ON public.regime FOR SELECT USING (true);

-- STOCKS TABLE
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('LONG', 'SHORT')),
  bull_score INTEGER NOT NULL DEFAULT 0,
  bear_score INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL,
  rsi NUMERIC,
  volume_ratio NUMERIC,
  volume_spike BOOLEAN NOT NULL DEFAULT false,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  entry_atr NUMERIC,
  entry_structure NUMERIC,
  best_entry NUMERIC,
  stop_loss NUMERIC,
  target NUMERIC,
  risk_reward NUMERIC,
  atr NUMERIC,
  distance_52w NUMERIC,
  conflict_trend BOOLEAN NOT NULL DEFAULT false,
  news JSONB NOT NULL DEFAULT '[]'::jsonb,
  earnings_date TEXT,
  earnings_warning BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stocks" ON public.stocks FOR SELECT USING (true);

-- SCRIPT_RUNS TABLE
CREATE TABLE public.script_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id TEXT NOT NULL,
  ran_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stock_count INTEGER NOT NULL DEFAULT 0,
  regime TEXT,
  universe TEXT
);
ALTER TABLE public.script_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read script_runs" ON public.script_runs FOR SELECT USING (true);

-- SCORE_HISTORY TABLE
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  run_id TEXT NOT NULL,
  bull_score INTEGER NOT NULL DEFAULT 0,
  bear_score INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read score_history" ON public.score_history FOR SELECT USING (true);
CREATE INDEX idx_score_history_ticker ON public.score_history (ticker, recorded_at DESC);

-- WATCHLIST TABLE
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- POSITIONS TABLE
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price NUMERIC NOT NULL,
  shares NUMERIC NOT NULL DEFAULT 1,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stop_loss NUMERIC,
  target NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  exit_price NUMERIC,
  exit_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own positions" ON public.positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.positions FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
