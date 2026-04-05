# SwingPulse — Deployment Guide

One-time setup for deploying SwingPulse to GitHub Pages with Supabase Edge Functions and a Python data pipeline.

---

## Prerequisites

- GitHub repo with GitHub Pages enabled (Settings → Pages → Source: **GitHub Actions**)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally: `brew install supabase/tap/supabase`
- A Supabase project created at [supabase.com](https://supabase.com)

---

## 1. GitHub Actions Secrets

Go to **repo Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value | Where to find it |
|--------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon/public key) | Supabase dashboard → Project Settings → API |
| `SUPABASE_ACCESS_TOKEN` | Personal access token | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | `cbvuewxjacuqyxkpwoum` | Supabase dashboard → Project Settings → General |
| `SUPABASE_SYNC_URL` | `https://<project-ref>.supabase.co/functions/v1/sync-ingest` | Construct from project ref |
| `SYNC_API_KEY` | Random 32+ char string | Generate: `openssl rand -hex 32` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role key) | Supabase dashboard → Project Settings → API |
| `SUPABASE_PRICES_URL` | `https://<project-ref>.supabase.co/functions/v1/sync-prices` | Optional — omit to skip price history |
| `SUPABASE_ALERTS_URL` | `https://<project-ref>.supabase.co/functions/v1/check-alerts` | Optional — omit to skip alert checks |

---

## 2. Supabase Secrets (Edge Function Environment Variables)

Run once with the Supabase CLI:

```bash
# Anthropic API key — used by ai-brief (Haiku) and ai-analysis (Sonnet)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref cbvuewxjacuqyxkpwoum

# Shared API key — must match the SYNC_API_KEY GitHub secret above
supabase secrets set SYNC_API_KEY=<same-value-as-github-secret> --project-ref cbvuewxjacuqyxkpwoum
```

Verify:
```bash
supabase secrets list --project-ref cbvuewxjacuqyxkpwoum
```

---

## 3. First Deploy

Push to `main` or manually trigger the `Deploy` workflow:

```
GitHub → Actions → Deploy → Run workflow
```

The workflow runs three jobs:
1. **Lint & Test** — must pass before anything deploys
2. **Deploy → GitHub Pages** — builds React app, uploads to Pages
3. **Deploy → Supabase Edge Functions** — deploys all 5 functions via Supabase CLI

---

## 4. Verify

| Check | Where to look |
|-------|---------------|
| Frontend live | `https://<your-username>.github.io/invest-insight-innovator/` |
| Mock data works | Open the URL above — app loads with demo data even without Supabase connected |
| Edge Functions deployed | Supabase dashboard → Edge Functions → check `deployed_at` timestamps |
| Pipeline running | GitHub → Actions → SwingPulse Data Sync → latest run |
| Realtime working | Open app, wait for a pipeline run — data refreshes automatically |

---

## 5. Ongoing Operations

**Every push to main:**
- Runs lint + test
- Deploys updated React app to GitHub Pages
- Deploys updated Edge Functions to Supabase
- Triggers the Python data pipeline immediately

**Every 15 minutes (weekdays, 9AM–5:30PM ET):**
- Python pipeline fetches fresh OHLCV data from yfinance
- Scores all 25 tickers and POSTs to Supabase
- `script_runs` table gets a new row → Realtime broadcasts → UI auto-refreshes

**If the pipeline fails:**
- A GitHub issue is automatically opened with a link to the failed run
- Close the issue once the pipeline is healthy again

---

## 6. Local Development

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
bun run dev   # http://localhost:8080
```

The app works fully without Supabase — mock data is returned automatically when the connection fails.
