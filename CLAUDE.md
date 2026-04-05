# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Dev server on http://localhost:8080
bun run build        # Production build (sets basename to /invest-insight-innovator/)
bun run lint         # ESLint
bun run test         # Run all Vitest tests once
bun run test:watch   # Vitest in watch mode

# Run a single test file
npx vitest run src/test/use-lifecycle.test.ts

# Python pipeline (from /pipeline)
pip install -r requirements.txt
python fetch_and_score.py
```

## Architecture

**SwingPulse** is a single-page React app backed by Supabase. There is no BFF — the frontend reads directly from Supabase tables via RLS, and a Python cron pipeline writes scored stock data.

### Data flow

```
Python pipeline (fetch_and_score.py, every 30 min via GitHub Actions)
  → yfinance  →  RSI / SMA / MACD / ATR scoring
  → POST to Supabase Edge Function (sync-ingest)
  → inserts into: stocks, regime, score_history, script_runs

Supabase Realtime (script_runs INSERT)
  → useRunWatcher() invalidates all TanStack Query caches
  → UI refetches stocks, regime, lastRun, scoreHistory
```

### Key layers

| Layer | Location | Notes |
|---|---|---|
| Types & mappers | `src/lib/types.ts` | All Supabase→app transforms live here |
| Data hooks | `src/hooks/use-data.ts` | Every table has one `useQuery` / `useMutation` export; always falls back to mock data on error |
| Lifecycle pattern | `src/hooks/use-lifecycle.ts` + `src/components/QueryGuard.tsx` | Normalises TanStack Query's `status`/`fetchStatus` pairs into `idle | loading | refreshing | success | error`; use `QueryGuard` instead of manual `isLoading` checks |
| Auth | `src/hooks/use-auth.tsx` | Supabase Auth context; watchlist/positions queries are `enabled: !!user` |
| Edge Functions | `supabase/functions/` | Deno-based; `ai-brief` and `ai-analysis` call Claude Haiku 4.5; `sync-ingest` and `check-alerts` use `x-api-key` header auth |
| Pipeline universe | `pipeline/universe.py` | Edit here to change the 25-ticker set |

### Path alias

`@/` maps to `src/`. Use it everywhere — no relative `../` chains.

### Mock data fallback

All `useQuery` functions in `use-data.ts` catch errors and return data from `src/lib/mock-data.ts`. The app is fully functional without a live Supabase connection.

### Supabase tables

`stocks`, `regime`, `script_runs`, `score_history` — written by pipeline  
`watchlist`, `positions`, `alerts` — owned per-user via RLS

### Scoring

Bull score and bear score are both 0–8 (8 independent signals each). `tradeType` ("LONG"/"SHORT") reflects the higher score. Regime (`BULLISH`/`NEUTRAL`/`BEARISH`) is derived from 6 SPY conditions in the pipeline, not calculated client-side.

## Testing

Tests live in `src/test/`. Uses Vitest + `@testing-library/react` + jsdom. Setup file: `src/test/setup.ts`. Test utility hooks with `renderHook`; test pure functions directly.
