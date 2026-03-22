# SwingPulse — AI-Powered Swing Trading Dashboard

A real-time swing trading signal scanner and analysis platform. It fetches daily OHLCV data for a 25-ticker universe, scores each setup using 8 technical signals, and surfaces the best trade ideas through an interactive React dashboard backed by Supabase.

---

## Features

- **Signal Scanner** — 8-point checklist (SMA 200/50, RSI, MACD, Volume, Price Action, Trend, Earnings) scored for both LONG and SHORT setups
- **Market Regime** — Classifies SPY as BULLISH / NEUTRAL / BEARISH using 6 conditions; regime-aligned setups are highlighted
- **AI Market Brief** — Claude-powered briefing summarising top setups and risk factors
- **AI Trade Chat** — Ask questions about any stock or the overall market via Claude
- **Risk Calculator** — Position sizing by account % risk and ATR-based stops (built into DetailPanel)
- **Backtester** — Replay 5 strategies on real price history with equity curve, drawdown profile, Monte Carlo simulation, and buy-and-hold comparison
- **Watchlist** — Per-user watchlist stored in Supabase with RLS
- **Positions** — Track open/closed trades with realized P&L
- **Alerts** — Price-level alerts evaluated on each pipeline run
- **Score History** — 90-day rolling sparkline trend per ticker

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Data fetching | TanStack Query v5 |
| Backend / DB | Supabase (PostgreSQL + RLS + Realtime) |
| AI | Anthropic Claude (Haiku 4.5 via Edge Functions) |
| Data pipeline | Python 3.11 + yfinance + pandas |
| Deployment | GitHub Pages + Supabase Edge Functions |
| CI/CD | GitHub Actions (deploy + 30-min data sync cron) |

---

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/invest-insight-innovator.git
cd invest-insight-innovator
bun install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Run the development server

```bash
bun run dev
```

Opens at `http://localhost:8080`.

---

## Data Pipeline

The Python pipeline (`pipeline/fetch_and_score.py`) runs every 30 minutes via GitHub Actions. It:

1. Downloads 1 year of daily OHLCV for all 25 tickers + SPY + VIX via `yfinance`
2. Computes RSI, SMA 50/200, ATR, MACD, Volume ratio
3. Scores each ticker (bull score 0-8, bear score 0-8)
4. Classifies news headline sentiment (bullish / bearish / neutral) using keyword scoring
5. Fetches short interest (`shortPercentOfFloat`) from yfinance
6. POSTs the payload to the `sync-ingest` Edge Function

### Run the pipeline locally

```bash
cd pipeline
cp .env.example .env
# Fill in SUPABASE_SYNC_URL and SYNC_API_KEY
pip install -r requirements.txt
python fetch_and_score.py
```

---

## Supabase Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `sync-ingest` | Receives scored stock data from pipeline | API key (`x-api-key`) |
| `sync-prices` | Receives OHLCV history for backtesting | API key |
| `check-alerts` | Evaluates active user alerts | API key |
| `ai-brief` | Generates AI market briefing via Claude | Supabase JWT |
| `ai-analysis` | Per-stock AI commentary via Claude | Supabase JWT |

### Required Edge Function secrets (set in Supabase Dashboard → Settings → Edge Functions)

```
ANTHROPIC_API_KEY
SYNC_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## GitHub Actions Secrets

| Secret | Used by | Description |
|--------|---------|-------------|
| `SUPABASE_ACCESS_TOKEN` | `deploy.yml` | Deploys Edge Functions |
| `SUPABASE_PROJECT_REF` | `deploy.yml` | Project identifier |
| `SUPABASE_SYNC_URL` | `data_sync.yml` | Pipeline endpoint URL |
| `SYNC_API_KEY` | `data_sync.yml` | Must match Edge Function secret |
| `SUPABASE_PRICES_URL` | `data_sync.yml` | Optional: enables price history upload |
| `SUPABASE_ALERTS_URL` | `data_sync.yml` | Optional: enables alert evaluation |

---

## Ticker Universe

25 tickers across momentum, value, and speculative categories:

`PLUG NIO SOFI MARA VALE F AAL SNAP NOK XPEV LMT CIEN FIX MPC MU AMAT NVDA META TSLA AMZN MSFT AAPL GE FDX GOOGL`

Edit `pipeline/universe.py` to change the universe.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search box |
| `Esc` | Close detail panel |

---

## Backtesting

The backtest engine replays signals on real OHLCV data stored in the `price_history` table. Features:

- **5 strategies**: MACD+EMA Cross, RSI Mean Reversion, Breakout+Volume, Trend Follow SMA200, Dual Momentum
- **Configurable**: lookback window, stop %, take profit %, position size, capital
- **Monte Carlo simulation**: shuffles trade sequence 500x to show the p5-p95 confidence range
- **Buy-and-Hold comparison**: shows strategy alpha vs simply holding the stock

> Price history is populated by the pipeline when `SUPABASE_PRICES_URL` is configured.

---

## Known Limitations

- Free yfinance data: 15-min delayed, no tick data, news with no guaranteed ordering
- Short interest data from yfinance may be stale (updated weekly by exchanges)
- News sentiment uses keyword matching — not a trained NLP model
- Supabase Realtime is not suitable for sub-second trading updates; suitable for 100-500ms dashboard refreshes
