-- Extended knowledge base for SwingPulse AI:
-- Individual signal explanations, options basics, extended-hours trading,
-- capital-gains tax rules, wash-sale rule, and support/resistance.
-- Sources are authoritative public-domain financial education sites.

-- ── New knowledge sources ─────────────────────────────────────────────────────

INSERT INTO public.knowledge_sources (publisher, url, trust_tier, topic, last_reviewed_at)
VALUES
  ('Charles Schwab Learning Center', 'https://www.schwab.com/learn/story/basic-call-and-put-options-strategies', 'B', 'swing_principles', now()),
  ('Charles Schwab Learning Center', 'https://www.schwab.com/learn/story/primer-on-wash-sales', 'B', 'risk_management', now()),
  ('Charles Schwab Learning Center', 'https://www.schwab.com/stocks/extended-hours-trading', 'B', 'order_mechanics', now()),
  ('Fidelity Learning Center', 'https://www.fidelity.com/learning-center/trading-investing/what-is-short-term-capital-gains-tax', 'B', 'risk_management', now()),
  ('Fidelity Viewpoints', 'https://www.fidelity.com/viewpoints/active-investor/extended-hours-trading', 'B', 'order_mechanics', now()),
  ('Fidelity Learning Center', 'https://www.fidelity.com/learning-center/personal-finance/wash-sales-rules-tax', 'B', 'risk_management', now()),
  ('FINRA Investor Insights', 'https://www.finra.org/investors/insights/extended-hours-trading', 'A', 'order_mechanics', now()),
  ('IRS Topic 409', 'https://www.irs.gov/taxtopics/tc409', 'A', 'risk_management', now()),
  ('Investopedia', 'https://www.investopedia.com/terms/p/price-action.asp', 'B', 'swing_principles', now()),
  ('Investopedia', 'https://www.investopedia.com/terms/s/supportlevel.asp', 'B', 'swing_principles', now()),
  ('Investopedia', 'https://www.investopedia.com/terms/g/goldenCross.asp', 'B', 'swing_principles', now());

-- ── Individual signal explanations (app_help) ─────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: sma200 — Price Above 200-Day SMA',
  'The sma200 signal passes when the stock''s closing price is above its 200-day Simple Moving Average. The 200-day SMA is the most-watched long-term trend filter on Wall Street. A stock trading above its 200-SMA is considered in a long-term uptrend and is preferred for LONG setups. Below the 200-SMA signals a long-term downtrend, favoring SHORT or no-trade.',
  ARRAY['sma200','200-day','moving-average','trend','long-term','signal']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: sma50 — Price Above 50-Day SMA',
  'The sma50 signal passes when the stock''s closing price is above its 50-day Simple Moving Average. The 50-SMA tracks medium-term trend. When a stock is above both the 50-SMA and 200-SMA simultaneously, the setup is in full bullish alignment. A "Golden Cross" (50-SMA crossing above the 200-SMA) is a particularly strong historical bullish confirmation signal.',
  ARRAY['sma50','50-day','moving-average','golden-cross','trend','medium-term','signal']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: rsiMomentum — RSI Above 50',
  'The rsiMomentum signal passes when the 14-period RSI is above 50. RSI above 50 indicates that recent gains are outpacing recent losses — the stock has positive momentum. For LONG setups, rsiMomentum above 50 confirms buyers are in control. For SHORT setups in SwingPulse, this signal is inverted: it passes when RSI is below 50 (bearish momentum). An RSI of 50 is the neutral dividing line.',
  ARRAY['rsi','rsimomentum','momentum','50','bullish','bearish','signal']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: volume — Above-Average Volume',
  'The volume signal passes when the stock''s current daily volume is above 1.5× its 20-day average daily volume. This indicates elevated institutional participation — institutions (hedge funds, mutual funds) move large amounts of capital and their buying/selling shows up as unusually high volume. Volume above 1.5× validates that a price move has backing and is not just thin-air noise.',
  ARRAY['volume','volume-ratio','institutional','1.5x','signal','participation']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: priceAction — Bullish/Bearish Price Structure',
  'The priceAction signal passes when the stock is forming a favorable price structure. For LONG setups: the stock is making higher highs and higher lows (uptrend structure), recently broke above a prior resistance level, or is holding a key support zone. For SHORT setups: lower highs and lower lows (downtrend), or a breakdown below support. Price action is the raw evidence that a trend is genuinely in play beyond just moving averages.',
  ARRAY['price-action','support','resistance','higher-highs','lower-lows','breakout','signal']
);

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Signal: earningsSetup — Favorable Earnings Context',
  'The earningsSetup signal passes when the stock has a favorable earnings-driven catalyst context: typically when the most recent earnings report was a beat (EPS above consensus) AND the stock is trending in the direction of the beat (up for a beat, down for a miss). Unlike earningsWarning (which flags upcoming earnings as a risk), earningsSetup is about using past earnings results as a directional tailwind. A passing earningsSetup is a positive signal, not a risk flag.',
  ARRAY['earnings-setup','earnings','eps','beat','catalyst','signal']
);

-- ── volumeSpike explanation ───────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'Volume Spike vs Volume Ratio',
  'SwingPulse tracks two separate volume measures. Volume Ratio is the continuous ratio of today''s volume to the 20-day average (e.g. 2.3× average). Volume Spike is a boolean true/false flag that fires when the volume ratio exceeds a higher threshold (typically 3×+ average) AND the price moved meaningfully in the direction of the trade. A volume spike is the stronger signal of the two and is highlighted in the detail panel with a special icon.',
  ARRAY['volume-spike','volume-ratio','boolean','institutional','threshold','detail-panel']
);

-- ── SMA crossover signals ─────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'swing_principles',
  'Golden Cross and Death Cross',
  'A Golden Cross occurs when the 50-day SMA crosses above the 200-day SMA — a historically bullish long-term signal. A Death Cross is the opposite: the 50-SMA crosses below the 200-SMA, historically bearish. Both are lagging signals (they happen after the trend has begun) but are widely watched by institutions. In SwingPulse, both the sma50 and sma200 signals passing simultaneously on a LONG setup indicates full bullish SMA alignment.',
  ARRAY['golden-cross','death-cross','sma50','sma200','crossover','long-term','signal'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investopedia.com/terms/g/goldenCross.asp';

-- ── Price action, support, resistance ─────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'swing_principles',
  'Price Action Trading',
  'Price action trading uses only raw price movements — candlestick patterns, swing highs/lows, and key levels — without relying on lagging indicators. Key patterns: Hammer (bullish reversal at support), Shooting Star (bearish reversal at resistance), Engulfing candles (momentum shift), Pin Bars (rejection wicks). Best entries occur when price action patterns appear at confluence zones where multiple signals agree — e.g., a support level + bullish engulfing + above-average volume.',
  ARRAY['price-action','candlestick','hammer','engulfing','pin-bar','pattern','confluence'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investopedia.com/terms/p/price-action.asp';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'swing_principles',
  'Support and Resistance Levels',
  'Support is a price level where buying demand has historically prevented further decline. Resistance is a level where selling pressure has historically capped advances. When price breaks above resistance, that level often becomes new support ("role reversal"). When price breaks below support, it can become new resistance. SwingPulse''s priceAction signal uses support/resistance structure to assess whether the setup is technically sound.',
  ARRAY['support','resistance','breakout','breakdown','role-reversal','price-level','structure'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.investopedia.com/terms/s/supportlevel.asp';

-- ── Options basics ────────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'order_mechanics',
  'Options Basics: Call and Put Contracts',
  'A call option gives the buyer the right (not obligation) to buy a stock at a set strike price before expiry — use calls when you expect the price to rise. A put option gives the right to sell at the strike price before expiry — use puts when you expect the price to fall. One contract controls 100 shares. The buyer''s max loss is the premium paid. Sellers face larger potential losses, especially on uncovered calls. Options are more complex than stocks and require separate broker approval.',
  ARRAY['options','call','put','strike','premium','contract','expiry','put-call'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.schwab.com/learn/story/basic-call-and-put-options-strategies';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'order_mechanics',
  'Options for Stock Traders: Call Plays and Put Plays',
  'When SwingPulse identifies a high-conviction LONG setup, traders sometimes use call options instead of shares for higher leverage. A "call play" is buying calls on a bullish setup; a "put play" is buying puts on a bearish/SHORT setup. Key concepts: "in the money" (ITM) = intrinsic value exists; "out of the money" (OTM) = pure time value, expires worthless if the move doesn''t happen. Options expiry is critical — always ensure enough time for the trade thesis to play out (at least 30–60 DTE is common for swing setups).',
  ARRAY['call-plays','put-plays','options','dte','in-the-money','out-of-the-money','swing','leverage'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.schwab.com/learn/story/basic-call-and-put-options-strategies';

-- ── Extended hours trading ────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'order_mechanics',
  'Extended-Hours Trading: Risks and Rules',
  'US stock markets trade 9:30 AM–4:00 PM ET (regular hours). Pre-market runs 4:00 AM–9:30 AM ET; after-hours runs 4:00 PM–8:00 PM ET. Extended-hours trades execute via ECNs (Electronic Communication Networks) using limit orders only — market orders are generally not permitted. Risks: lower liquidity, wider bid-ask spreads, higher volatility, and potential price gaps versus the regular session. SwingPulse setups are scored using regular-hours data; do not use extended-hours prices as entry reference.',
  ARRAY['extended-hours','pre-market','after-hours','ecn','limit-order','liquidity','spread','session'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.finra.org/investors/insights/extended-hours-trading';

-- ── Tax considerations ────────────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'risk_management',
  'Capital Gains Tax: Short-Term vs Long-Term',
  'Short-term capital gains (stocks held 1 year or less) are taxed as ordinary income — your regular federal bracket rate (10%–37% in 2024). Long-term capital gains (held more than 1 year) are taxed at lower rates: 0%, 15%, or 20% depending on your income. Swing trading typically creates short-term gains and losses since hold times are days to weeks. Report gains/losses on Form 8949 and Schedule D. Losses can offset gains; up to $3,000 of net losses per year can offset ordinary income, with the remainder carried forward.',
  ARRAY['capital-gains','short-term','long-term','tax','ordinary-income','form-8949','schedule-d','holding-period'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.irs.gov/taxtopics/tc409';

INSERT INTO public.trading_knowledge (category, title, content, tags, source_id)
SELECT
  'risk_management',
  'Wash Sale Rule: Avoiding Disallowed Losses',
  'The IRS wash sale rule disallows a capital loss if you buy the same or a substantially identical security within 30 days before or after selling it at a loss (a 61-day window total). The disallowed loss is not gone — it is added to the cost basis of the replacement shares, deferring the loss to a future sale. To harvest a loss cleanly, wait at least 31 days before repurchasing. Cryptocurrency is not currently subject to wash sale rules. Active swing traders must track this carefully to avoid surprise disallowances at tax time.',
  ARRAY['wash-sale','capital-loss','irs','30-days','cost-basis','tax-loss-harvesting','deferred'],
  id
FROM public.knowledge_sources
WHERE url = 'https://www.fidelity.com/learning-center/personal-finance/wash-sales-rules-tax';

-- ── App-help: WatchlistPanel ───────────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'WatchlistPanel: Tracking Stocks of Interest',
  'The WatchlistPanel lets authenticated users bookmark tickers from the universe for quick monitoring. Click the star icon on any stock row to add it to your watchlist. The Watchlist tab in the app shows only watchlisted tickers, letting you focus on your short list without the full universe. Watchlist data is stored per-user via Supabase RLS and persists across sessions. To remove a ticker, click the star again to toggle it off.',
  ARRAY['watchlist','star','bookmark','monitor','tickers','panel']
);

-- ── App-help: SyncBar and pipeline timing ─────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'When Does SwingPulse Update Data?',
  'SwingPulse data is refreshed by the Python pipeline running on a configurable GitHub Actions cron schedule (default: once daily after market close). The SyncBar at the top of the app shows the timestamp of the last successful run. When a new run completes, Supabase Realtime sends a notification and all UI queries automatically refetch — you will see the data refresh live without reloading the page. If the SyncBar shows a stale timestamp, the pipeline may not have run yet today.',
  ARRAY['sync','pipeline','cron','refresh','realtime','timestamp','syncbar','schedule']
);

-- ── App-help: Universe of tickers ────────────────────────────────────────────

INSERT INTO public.trading_knowledge (category, title, content, tags)
VALUES (
  'app_help',
  'The SwingPulse Ticker Universe',
  'SwingPulse monitors a curated universe of 25 liquid US-listed tickers: NVDA, TSLA, AAPL, MSFT, META, AMZN, GOOGL, NFLX, AMD, INTC, SOFI, MARA, COIN, PLTR, ARM, NIO, RIVN, SMCI, HOOD, SHOP, SNOW, UBER, LYFT, QQQ, SPY. These are high-activity large- and mid-cap names that typically have strong swing-trading characteristics (liquidity, volatility, volume). To change the universe, edit pipeline/universe.py and re-run the pipeline.',
  ARRAY['universe','tickers','nvda','tsla','aapl','msft','qqq','spy','25','pipeline']
);

-- ── Citing new knowledge entries ─────────────────────────────────────────────
-- Link citations to all knowledge entries that have a source_id set above.
INSERT INTO public.knowledge_citations (knowledge_id, citation_label, source_url, excerpt_summary)
SELECT tk.id, ks.publisher, ks.url, left(tk.content, 220)
FROM public.trading_knowledge tk
JOIN public.knowledge_sources ks ON ks.id = tk.source_id
WHERE tk.created_at >= now() - interval '1 minute'
  AND tk.source_id IS NOT NULL;
