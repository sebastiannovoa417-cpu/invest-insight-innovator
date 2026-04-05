-- Expand the SwingPulse knowledge base with app-specific, vocabulary, and
-- additional educational entries so the AI can answer domain questions accurately.

-- ── App-specific knowledge (app_help) ────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'How SwingPulse Scoring Works',
  'SwingPulse assigns a bull score (0–8) and a bear score (0–8) to every ticker. Each score counts how many of 8 independent technical signals are passing. The eight signals are: sma200, sma50, rsiMomentum, volume, macd, priceAction, trendStrength, and earningsSetup. A ticker is rated LONG when its bull score exceeds its bear score, and SHORT otherwise. Higher scores indicate stronger conviction; scores ≥ 6 are considered high-conviction setups.',
  ARRAY['score','bull-score','bear-score','signals','long','short','conviction']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Understanding Regime Status',
  'The market regime (BULLISH / NEUTRAL / BEARISH) is calculated from SPY data by the Python pipeline, not the browser. BULLISH means SPY is above its 200-day SMA with at least 5 of 6 macro conditions passing. BEARISH means SPY is below its 200-day SMA. NEUTRAL is any mixed state. The regime score (0–6) counts passing conditions: SPY > SMA200, SPY > SMA50, SPY RSI > 50, VIX < 20, SPY MACD bullish, SPY price above prior-week high. Use the regime to filter trade direction: prefer LONGs in BULLISH, SHORTs in BEARISH.',
  ARRAY['regime','bullish','bearish','neutral','regime-score','spy','sma200','vix']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'What ATR Means in SwingPulse',
  'ATR (Average True Range) is the average daily price range (high minus low) over the last 14 days, expressed in dollars. In SwingPulse, ATR is used to set stop-loss and target levels: the stop is typically 1× ATR below entry for a LONG (above for SHORT), and the target is typically 2× ATR from entry. This gives a default risk-reward ratio of 2:1. A higher ATR means wider stops and targets, reflecting a more volatile stock.',
  ARRAY['atr','average-true-range','stop-loss','target','volatility','risk-reward']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Risk-Reward Ratio (R:R)',
  'Risk-reward ratio (R:R) = (target − entry) ÷ (entry − stop). SwingPulse displays this per ticker. A ratio of 2.0 means you risk $1 to make $2. Prefer setups with R:R ≥ 2.0. If R:R is below 1.5, the trade has poor structure — the stop is too wide or the target is too close.',
  ARRAY['risk-reward','r:r','rr','target','stop-loss','entry','position-sizing']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Volume Ratio Interpretation',
  'Volume ratio = today''s volume ÷ 20-day average daily volume. A ratio above 1.5× signals above-average institutional participation and validates the move. The volume signal (one of the 8 scored signals) passes when volume ratio is above 1.5×. Ratios below 1.0 mean below-average participation — be cautious about entries on thin volume.',
  ARRAY['volume','volume-ratio','institutional','signal','participation']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'RSI Mean Reversion in SwingPulse',
  'RSI (Relative Strength Index, 14-period) measures momentum on a 0–100 scale. For LONG setups, rsiMomentum passes when RSI > 50 (bullish momentum). Readings below 30 indicate oversold conditions that can precede a bounce. Readings above 70 indicate overbought conditions — for LONGs, this is extended and may warrant waiting for a pullback before entry.',
  ARRAY['rsi','momentum','oversold','overbought','mean-reversion','signal']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Earnings Warning and Avoidance',
  'earningsWarning is true when a company''s earnings date is within 7 calendar days. SwingPulse flags these tickers with a ⚠ symbol in the table. Avoid initiating new swing positions within 7 days of earnings because the binary outcome (gap up or gap down) can blow through your stop. Existing positions should be sized conservatively or exited before the event.',
  ARRAY['earnings','earnings-warning','risk','avoidance','gap']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Distance from 52-Week Extreme',
  'distance52w shows how far the current price is from the 52-week high (for LONG candidates) or 52-week low (for SHORT candidates), expressed as a percentage. A LONG stock trading near its 52-week high (distance close to 0%) is in breakout territory — strength. A stock far below its 52-week high (e.g. −40%) may be in a downtrend — additional confirmation signals are required.',
  ARRAY['52-week','distance','high','low','breakout','trend']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Short Interest and Squeeze Risk',
  'shortInterest is the percentage of the stock''s float that is currently sold short. Values above 15% are considered elevated and indicate squeeze risk: if the stock rises, short sellers are forced to buy to cover, amplifying the move. SwingPulse includes short interest in the detail panel for context. High short interest can magnify both LONG gains and SHORT losses.',
  ARRAY['short-interest','squeeze','float','risk','short-sell']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'How to Read the Detail Panel',
  'Click any row in the stock table to open the Detail Panel. It shows: full signal breakdown (which of the 8 signals are passing), entry/stop/target levels, ATR, RSI, volume ratio, short interest, recent news headlines with sentiment, and a score history sparkline. Use the AI briefing button to get a Claude-powered trade commentary for that specific setup.',
  ARRAY['detail-panel','signals','entry','news','sparkline','ai-briefing','panel']
);

-- ── Core swing principles ─────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'swing_principles',
  'MACD Signal Confirmation',
  'MACD (Moving Average Convergence Divergence) compares a 12-period EMA to a 26-period EMA and plots a signal line (9-period EMA of MACD). The macd signal in SwingPulse passes when the MACD line is above its signal line. A bullish MACD crossover (MACD crossing above signal from below) is a stronger entry trigger. MACD divergence — where price makes new highs but MACD makes lower highs — is a warning sign.',
  ARRAY['macd','ema','signal','crossover','divergence','momentum'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/learning-center/trading-investing/trading/swing-trading';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'swing_principles',
  'Trend Strength via ADX',
  'The trendStrength signal passes when the Average Directional Index (ADX) is above 20, indicating a trending (vs choppy) market. In trending markets, momentum strategies perform better; in choppy markets (ADX < 20), mean-reversion setups are preferred. SwingPulse scores higher for stocks with ADX > 20 because trends provide directional clarity.',
  ARRAY['adx','trend-strength','trend','choppy','momentum','mean-reversion'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/learning-center/trading-investing/trading/swing-trading';

-- ── Risk management ───────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'risk_management',
  'Position Sizing Formula',
  'Risk per trade = account size × risk percent (commonly 1–2%). Position size = risk per trade ÷ (entry price − stop price). Example: $10,000 account, 1% risk = $100 risk budget. If entry is $50 and stop is $48 (a $2 stop), position size = $100 ÷ $2 = 50 shares. Never size a position based on the dollar amount you want to own — always size from the stop distance.',
  ARRAY['position-sizing','risk','account','stop-loss','formula','shares'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investor.gov/introduction-investing/investing-basics/what-risk';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'risk_management',
  'Managing Open Positions',
  'Once in a trade: (1) Do not move your stop further from entry to avoid a loss — only move stops in your favor (trailing stop). (2) Take partial profits at 1× risk (1R) to reduce exposure. (3) Let the remainder run to the full target. (4) Exit if price action deteriorates (closes below a key moving average) before the target is hit.',
  ARRAY['position-management','stop-loss','trailing-stop','partial-profit','exit'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investor.gov/introduction-investing/investing-basics/what-risk';

-- ── Order mechanics ───────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'order_mechanics',
  'Trailing Stop Orders',
  'A trailing stop moves with the price in your favor but does not move against you. For a LONG, a 5% trailing stop placed at $100 will trigger a sell if the price drops 5% from its peak. If the stock reaches $120, the stop rises to $114. Trailing stops let you lock in profits while staying in a trend. They are available on Robinhood, Fidelity, IBKR, Webull, and Moomoo.',
  ARRAY['trailing-stop','stop-loss','order-type','profit','trend'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'order_mechanics',
  'Limit vs Stop-Limit Orders',
  'A limit order executes at your specified price or better — but only if the market reaches that price. A stop-limit order combines a stop trigger with a limit: when the stop is hit, a limit order is placed at your limit price. Stop-limits do not guarantee a fill in fast-moving markets if the price gaps past your limit. Use stop-limits when price control matters more than fill certainty.',
  ARRAY['limit-order','stop-limit','order-type','fill','execution','gap'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders';

-- ── BacktestPanel ─────────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'BacktestPanel: Available Strategies',
  'The BacktestPanel lets you run historical simulations on any ticker. Five built-in strategies are available: (1) MACD + EMA Cross — enters on bullish MACD crossover above 20-EMA, exits on bearish cross; (2) RSI Mean Reversion — buys oversold dips (RSI < 30) and sells at RSI 60+; (3) Breakout + Volume — enters on a price breakout above a 20-day high with volume ratio > 1.5×; (4) Trend Follow SMA200 — holds LONG when price is above 200-day SMA and sells below; (5) Dual Momentum — combines price and relative strength momentum signals. Select a strategy from the dropdown, then click Run Backtest.',
  ARRAY['backtest','strategy','macd','rsi','breakout','sma200','momentum','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'BacktestPanel: Walk-Forward Mode',
  'Walk-forward mode splits the historical window into an in-sample training period and out-of-sample test segments. The strategy is optimised on the training window and then immediately applied — without re-fitting — to the next test segment. This process repeats across the full history. It prevents over-fitting and gives a more realistic estimate of live performance. Enable it with the "Walk-Forward" toggle in the BacktestPanel.',
  ARRAY['walk-forward','backtest','overfitting','in-sample','out-of-sample','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'BacktestPanel: Monte Carlo Simulation',
  'Monte Carlo mode runs the strategy thousands of times with randomly shuffled trade sequences to estimate the distribution of outcomes. The result shows median return, 5th-percentile (worst-case) return, and 95th-percentile (best-case) return. A strategy that looks profitable on an average run but has a very wide 5th–95th spread is risky. Use Monte Carlo to gauge drawdown risk before committing capital.',
  ARRAY['monte-carlo','backtest','simulation','drawdown','risk','distribution','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'BacktestPanel: Stale-Data Warning',
  'If the price history used by the backtest is older than 24 hours, the BacktestPanel shows a stale-data warning banner. This means the pipeline has not run recently and results may not reflect the current market structure. Trigger a manual pipeline run via the Sync button in the status bar, or wait for the scheduled cron to refresh the data before relying on backtest output.',
  ARRAY['backtest','stale-data','pipeline','sync','warning','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'BacktestPanel: Regime Filter',
  'The BacktestPanel''s regime filter restricts trades to periods when the market regime matches a selected state (BULLISH, NEUTRAL, BEARISH, or ALL). Enabling this filter, for example selecting BULLISH, means the strategy only takes LONG trades when SPY''s regime was BULLISH at the time. This is useful for testing whether a strategy degrades in adverse macro conditions.',
  ARRAY['backtest','regime','filter','bullish','bearish','macro','panel']
);

-- ── AlertsPanel ───────────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'AlertsPanel: Creating and Managing Alerts',
  'The AlertsPanel lets authenticated users create price and score alerts for any ticker in the universe. Six alert conditions are supported: bull_score_gte (fire when bull score ≥ N), bear_score_gte (fire when bear score ≥ N), rsi_above (fire when RSI crosses above a threshold), rsi_below (fire when RSI crosses below a threshold), price_above (fire when price crosses above a level), price_below (fire when price crosses below a level). Alerts are checked by the check-alerts Edge Function on each pipeline run. Triggered alerts are marked in the panel with a timestamp.',
  ARRAY['alerts','alert','bull-score','bear-score','rsi','price','condition','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'AlertsPanel: Score-Based Alerts',
  'bull_score_gte and bear_score_gte alerts fire when a ticker''s score reaches or exceeds your threshold after a pipeline run. For example, setting bull_score_gte = 6 on AAPL will notify you when AAPL''s bull score is 6 or higher — indicating a high-conviction LONG setup. Use score alerts instead of watching the table manually; they fire automatically after each data refresh.',
  ARRAY['alerts','bull-score','bear-score','conviction','threshold','panel']
);

-- ── PositionsPanel ────────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'PositionsPanel: Tracking Open and Closed Positions',
  'The PositionsPanel lets authenticated users log and track swing trade positions. Add a position by entering the ticker, direction (LONG/SHORT), entry price, number of shares, and optional stop-loss and target. The panel calculates unrealized P&L using the latest price from the universe, and realized P&L when you close a position. Win rate and average R:R are shown in the panel summary. Positions are stored per-user via Supabase RLS, so they are private to your account.',
  ARRAY['positions','position','pnl','profit','loss','win-rate','tracking','panel']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'PositionsPanel: Closing a Position and Realized P&L',
  'To close a position in the PositionsPanel, click the Close button on any open row and enter your exit price. The realized P&L is calculated as (exit − entry) × shares for LONG, or (entry − exit) × shares for SHORT. Closed positions stay visible in the panel history with their realized P&L and the date closed. The win rate in the summary counts trades where realized P&L > 0.',
  ARRAY['positions','close','realized-pnl','exit','win-rate','history','panel']
);

-- ── FilterControls ────────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'FilterControls: Direction and Score Filters',
  'The FilterControls bar above the stock table lets you narrow visible tickers. Direction filter: ALL shows every ticker; LONG shows only LONG-rated setups (bullScore > bearScore); SHORT shows only SHORT-rated setups. Score filters: 3+, 5+, or 7+ hides tickers whose relevant score (bull for LONG, bear for SHORT) falls below the threshold — use 7+ to see only the highest-conviction setups.',
  ARRAY['filter','direction','long','short','score','conviction','threshold','controls']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'FilterControls: Sort Options',
  'The sort dropdown in FilterControls orders the stock table by different metrics: Score (default, highest first), RSI (ascending — shows most oversold first), Volume Ratio (descending — highest relative volume first), R:R (risk-reward ratio, highest first), and Price (ascending or descending). Combining a LONG filter with Sort by Volume Ratio quickly surfaces high-conviction LONG setups with unusual institutional activity.',
  ARRAY['sort','filter','rsi','volume-ratio','risk-reward','price','controls','table']
);
