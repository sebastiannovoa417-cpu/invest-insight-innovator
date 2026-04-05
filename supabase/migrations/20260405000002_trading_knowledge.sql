-- Curated trading knowledge base for AI educational responses

CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  trust_tier TEXT NOT NULL CHECK (trust_tier IN ('A', 'B', 'C')),
  topic TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read knowledge_sources"
  ON public.knowledge_sources
  FOR SELECT
  USING (true);

CREATE TABLE public.trading_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('swing_principles', 'risk_management', 'order_mechanics', 'broker_workflows', 'app_help')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  broker TEXT,
  platform TEXT,
  source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read trading_knowledge"
  ON public.trading_knowledge
  FOR SELECT
  USING (true);

CREATE TABLE public.knowledge_citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_id UUID NOT NULL REFERENCES public.trading_knowledge(id) ON DELETE CASCADE,
  citation_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  excerpt_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read knowledge_citations"
  ON public.knowledge_citations
  FOR SELECT
  USING (true);

CREATE TABLE public.broker_order_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker TEXT NOT NULL,
  platform TEXT NOT NULL,
  instrument TEXT NOT NULL,
  order_types_supported TEXT[] NOT NULL DEFAULT '{}'::text[],
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.broker_order_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read broker_order_workflows"
  ON public.broker_order_workflows
  FOR SELECT
  USING (true);

CREATE INDEX idx_trading_knowledge_category ON public.trading_knowledge(category);
CREATE INDEX idx_trading_knowledge_tags ON public.trading_knowledge USING GIN(tags);
CREATE INDEX idx_trading_knowledge_broker_platform ON public.trading_knowledge(broker, platform);
CREATE INDEX idx_broker_order_workflows_broker_platform ON public.broker_order_workflows(broker, platform);

-- Keep updated_at fresh on edits.
CREATE TRIGGER update_trading_knowledge_updated_at
  BEFORE UPDATE ON public.trading_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_order_workflows_updated_at
  BEFORE UPDATE ON public.broker_order_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed source registry
INSERT INTO public.knowledge_sources (publisher, url, trust_tier, topic, last_reviewed_at)
VALUES
  ('SEC Investor.gov', 'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders', 'A', 'order_mechanics', now()),
  ('SEC Investor.gov', 'https://www.investor.gov/introduction-investing/investing-basics/what-risk', 'A', 'risk_management', now()),
  ('FINRA', 'https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets', 'A', 'order_mechanics', now()),
  ('Fidelity Learning Center', 'https://www.fidelity.com/learning-center/trading-investing/trading/swing-trading', 'B', 'swing_principles', now()),
  ('Fidelity Trading FAQ', 'https://www.fidelity.com/trading/faqs-placing-orders', 'B', 'broker_workflows', now()),
  ('Fidelity Trading FAQ', 'https://www.fidelity.com/trading/faqs-order-types', 'B', 'order_mechanics', now()),
  ('Robinhood Support', 'https://robinhood.com/us/en/support/articles/order-types/', 'B', 'broker_workflows', now()),
  ('Interactive Brokers', 'https://www.interactivebrokers.com/en/trading/ordertypes.php', 'B', 'broker_workflows', now()),
  ('Webull Help Center', 'https://www.webull.com/help', 'B', 'broker_workflows', now()),
  ('Moomoo Support Center', 'https://www.moomoo.com/us/support', 'B', 'broker_workflows', now()),
  ('QuantStart', 'https://www.quantstart.com/articles/Successful-Backtesting-of-Algorithmic-Trading-Strategies-Part-I/', 'B', 'risk_management', now());

-- Seed trading principles and mechanics
INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'swing_principles', 'Swing Candidate Selection',
       'Focus on liquid stocks/ETFs that move in clear channels. Build a watchlist and learn each symbol\'s behavior before trading it.',
       ARRAY['swing','liquidity','watchlist','channels'], id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/learning-center/trading-investing/trading/swing-trading';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'swing_principles', 'Entry and Exit Discipline',
       'For swing setups, define entries near support or after confirmation, place protective stops near entry, and plan profit-taking ahead of time.',
       ARRAY['entry','exit','discipline','stop-loss'], id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/learning-center/trading-investing/trading/swing-trading';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'risk_management', 'All Investments Carry Risk',
       'Assess business, volatility, inflation, interest-rate, and liquidity risks before sizing positions. Higher uncertainty requires tighter risk controls.',
       ARRAY['risk','volatility','liquidity','position-sizing'], id
FROM public.knowledge_sources
WHERE url = 'https://www.investor.gov/introduction-investing/investing-basics/what-risk';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'order_mechanics', 'Market vs Limit vs Stop',
       'Market orders prioritize execution, not price. Limit orders prioritize price, not execution certainty. Stop orders trigger into market orders at the stop price.',
       ARRAY['market-order','limit-order','stop-order'], id
FROM public.knowledge_sources
WHERE url = 'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'order_mechanics', 'Stop Order Risk in Volatile Markets',
       'A stop order does not guarantee execution at the stop price in fast markets. Use stop-limit when price control is more important than immediate execution.',
       ARRAY['stop-order','stop-limit','volatility','execution'], id
FROM public.knowledge_sources
WHERE url = 'https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT 'risk_management', 'Backtests Are an Upper Bound',
       'Backtests can be inflated by optimization, look-ahead, and survivorship biases. Use conservative assumptions and treat historical results as optimistic.',
       ARRAY['backtest','overfitting','look-ahead','survivorship'], id
FROM public.knowledge_sources
WHERE url = 'https://www.quantstart.com/articles/Successful-Backtesting-of-Algorithmic-Trading-Strategies-Part-I/';

-- Broker workflow notes
INSERT INTO public.trading_knowledge (category, title, content, tags, broker, platform, source_id)
SELECT 'broker_workflows', 'Robinhood Equity Order Flow',
       'In app: open stock detail, tap Trade, choose Buy/Sell, then choose order type (market/limit/stop/stop-limit/trailing stop) and submit with the selected time-in-force.',
       ARRAY['broker','workflow','order-entry'], 'Robinhood', 'Mobile/Web', id
FROM public.knowledge_sources
WHERE url = 'https://robinhood.com/us/en/support/articles/order-types/';

INSERT INTO public.trading_knowledge (category, title, content, tags, broker, platform, source_id)
SELECT 'broker_workflows', 'Fidelity Order Placement Checklist',
       'Confirm order type, quantity, time-in-force, and session (regular vs extended hours). Preview and verify confirmation before submission.',
       ARRAY['broker','workflow','preview','extended-hours'], 'Fidelity', 'Web/Mobile', id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/trading/faqs-placing-orders';

INSERT INTO public.trading_knowledge (category, title, content, tags, broker, platform, source_id)
SELECT 'broker_workflows', 'IBKR Order Type Selection',
       'IBKR supports many order types (market, limit, stop, stop-limit, trailing, bracket). Select order type according to speed vs price-control tradeoff.',
       ARRAY['broker','workflow','ibkr','order-types'], 'Interactive Brokers', 'TWS/Desktop/Mobile', id
FROM public.knowledge_sources
WHERE url = 'https://www.interactivebrokers.com/en/trading/ordertypes.php';

INSERT INTO public.trading_knowledge (category, title, content, tags, broker, platform, source_id)
SELECT 'broker_workflows', 'Webull Workflow Stub',
       'Use the Help Center flow to navigate account/trading FAQs and verify supported order behavior on your current platform before placing advanced conditional orders.',
       ARRAY['broker','workflow','webull'], 'Webull', 'Web/Mobile', id
FROM public.knowledge_sources
WHERE url = 'https://www.webull.com/help';

INSERT INTO public.trading_knowledge (category, title, content, tags, broker, platform, source_id)
SELECT 'broker_workflows', 'Moomoo Workflow Stub',
       'Review the support category for Trading Ability and specifically confirm order placement steps, trading hours, and fee schedule before submitting orders.',
       ARRAY['broker','workflow','moomoo'], 'Moomoo', 'Web/Mobile', id
FROM public.knowledge_sources
WHERE url = 'https://www.moomoo.com/us/support';

-- Seed broker workflow table (structured steps)
INSERT INTO public.broker_order_workflows (broker, platform, instrument, order_types_supported, steps_json, source_id)
SELECT 'Robinhood', 'Mobile/Web', 'US Stocks/ETFs',
       ARRAY['market','limit','stop','stop-limit','trailing-stop'],
       '["Open stock detail page","Tap Trade","Select Buy or Sell","Choose order type","Review time-in-force","Submit order"]'::jsonb,
       id
FROM public.knowledge_sources
WHERE url = 'https://robinhood.com/us/en/support/articles/order-types/';

INSERT INTO public.broker_order_workflows (broker, platform, instrument, order_types_supported, steps_json, source_id)
SELECT 'Fidelity', 'Web/Mobile', 'US Stocks/ETFs',
       ARRAY['market','limit','stop','trailing-stop','conditional'],
       '["Open trade ticket","Select symbol and side","Choose order type and quantity","Set session/time-in-force","Preview order","Confirm and submit"]'::jsonb,
       id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/trading/faqs-placing-orders';

INSERT INTO public.broker_order_workflows (broker, platform, instrument, order_types_supported, steps_json, source_id)
SELECT 'Interactive Brokers', 'TWS/Desktop/Mobile', 'US Stocks/ETFs',
       ARRAY['market','limit','stop','stop-limit','trailing','bracket'],
       '["Open order ticket","Select routing/order type","Configure quantity and limits/stops","Set duration (DAY/GTC/etc)","Transmit and monitor fills"]'::jsonb,
       id
FROM public.knowledge_sources
WHERE url = 'https://www.interactivebrokers.com/en/trading/ordertypes.php';

INSERT INTO public.broker_order_workflows (broker, platform, instrument, order_types_supported, steps_json, source_id)
SELECT 'Webull', 'Web/Mobile', 'US Stocks/ETFs',
       ARRAY['market','limit','stop','stop-limit','trailing-stop'],
       '["Open symbol page","Select Trade","Choose side and order type","Review disclosures and fees","Submit and confirm status"]'::jsonb,
       id
FROM public.knowledge_sources
WHERE url = 'https://www.webull.com/help';

INSERT INTO public.broker_order_workflows (broker, platform, instrument, order_types_supported, steps_json, source_id)
SELECT 'Moomoo', 'Web/Mobile', 'US Stocks/ETFs',
       ARRAY['market','limit','stop','stop-limit'],
       '["Open symbol/order ticket","Choose Buy or Sell","Select order type and time-in-force","Review trading hours and fees","Submit order"]'::jsonb,
       id
FROM public.knowledge_sources
WHERE url = 'https://www.moomoo.com/us/support';

-- Link citations to seeded knowledge
INSERT INTO public.knowledge_citations (knowledge_id, citation_label, source_url, excerpt_summary)
SELECT tk.id, ks.publisher, ks.url, left(tk.content, 220)
FROM public.trading_knowledge tk
JOIN public.knowledge_sources ks ON ks.id = tk.source_id;
