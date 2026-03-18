

# SwingPulse — Evolved FitPro OS Dashboard

## Overview
Rebuild the FitPro OS single-file HTML app as a modern React application with Supabase backend, evolved design (Inter + JetBrains Mono, design brief color palette), and three new features: watchlist, historical score tracking, and position tracker.

## Phase 1: Foundation & Design System

### Dark Theme Setup
- Update CSS variables to match the design brief: background `#0B0E14`, surface `#161B22`, primary accent `#38BDF8`, long `#22C55E`, short `#F43F5E`, text `#F8FAFC`, muted `#94A3B8`
- Import **Inter** (UI) and **JetBrains Mono** (data/prices) from Google Fonts
- Subtle scanline overlay preserved as a nod to the original

### Core Layout
- **Sync Bar** (top) — Logo, Regime Pill (BULLISH/BEARISH/NEUTRAL with score), SPY price vs SMA200, VIX, SPY RSI, Data Freshness indicator, Refresh button
- **Main Content** — Top Pick card, filter controls, stock table, stats bar
- **Status Bar** (bottom) — Connection status, last run info, version/universe label

## Phase 2: Supabase Backend

### Database Tables
- `stocks` — ticker, trade_type, bull_score, bear_score, price, rsi, volume_spike, signals (jsonb), swing entry/stop/target data, news (jsonb), earnings fields, updated_at
- `regime` — status, spy_price, sma_200, sma_50, spy_rsi, vix, ratio, regime_score
- `script_runs` — run_id, timestamp, stock_count, regime, universe tag
- `score_history` — ticker, run_id, bull_score, bear_score, timestamp (for sparklines)
- `watchlist` — user_id, ticker, created_at
- `positions` — user_id, ticker, entry_price, shares, direction (long/short), entry_date, stop_loss, target, status (open/closed), exit_price, exit_date

### Auth
- Simple email auth so watchlists and positions are per-user
- RLS policies on watchlist and positions tables

### Data Sync
- Edge function to receive data from your existing Python fetch-and-score script (POST endpoint that writes to stocks, regime, script_runs, and score_history tables)
- This replaces Firebase writes — your Python script just needs to POST to a new URL

## Phase 3: Dashboard Components

### Top Pick Card
- Highlights the highest-scoring regime-aligned stock
- Score ring (SVG donut), extra pills (regime aligned, 52W distance, earnings warning, entry price), signal chips

### Stock Table
- All existing columns: checkbox, ticker, type (with CT and conflict badges), dual score bars (bull ▲ / bear ▼), price, RSI tag, volume spike, signal dots, updated time
- ⭐ **Watchlist star** on each row — click to pin/unpin
- **Mini sparkline** in the score column showing score trend over last 10 runs (from score_history)
- Watchlisted stocks always sort to top with a subtle highlight

### Detail Panel
- Slide-in sidebar (instead of inline expand) when clicking a stock
- 8-point checklist with pass/fail/warn indicators
- Swing trade setup grid (entry ATR, entry structure, best entry, stop, target, R:R, ATR)
- Recent news section
- **Position entry form** — Quick "Open Position" button with entry price pre-filled from swing entry

### Filter Controls
- Type segmented buttons (ALL/LONG/SHORT)
- Score threshold (ANY/3+/5+/7+)
- Search by ticker
- Sort dropdown
- Ticker count

### Stats Bar
- 6 stat cards: Long Setups, Short Setups, Score 6+, Avg Directional Score, Conflicts, SPY/SMA200 ratio

## Phase 4: New Features

### Watchlist
- Star icon on each table row to toggle watchlist
- Watchlisted tickers pin to top of the table with a subtle left border accent
- Persisted per-user in Supabase

### Historical Score Tracking
- Each script run saves scores to `score_history`
- Mini sparkline (last 10 data points) rendered inline in the score column
- Tooltip on hover showing exact scores and dates
- Helps identify momentum — is a stock's signal strengthening or weakening?

### Position Tracker
- "Open Position" button in the detail panel pre-fills entry from swing setup
- Positions page/tab showing all open and closed trades
- Each position shows: ticker, direction, entry, current price, P&L ($ and %), stop distance, target distance
- Color-coded P&L: green if profitable, red if losing
- "Close Position" button to log exit price and date
- Simple trade journal with win/loss stats

## Phase 5: Polish

### Motion & UX
- Snappy filter transitions (no fade-in delays)
- Subtle pulse animation on table rows during data refresh
- Keyboard shortcuts: `/` to search, `Escape` to close detail panel
- Q1 2026 Selection label showing when next universe update is due

### Responsive
- Works on tablet and desktop
- Collapsed controls on smaller screens

