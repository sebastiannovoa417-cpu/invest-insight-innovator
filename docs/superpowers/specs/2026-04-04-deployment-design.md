# SwingPulse Deployment Design

**Date:** 2026-04-04  
**Status:** Approved

## Problem

Three GitHub Actions workflows existed with overlapping responsibilities:
- `deploy.yml` — correct GitHub Pages deploy (build → upload → deploy)
- `static.yml` — incorrect; uploaded entire repo root instead of `dist/`
- `webpack.yml` — redundant CI build with no lint or test steps

Additionally: pipeline ran every 30 min (wanted 15), no push-to-main trigger on pipeline, no automated Edge Function deployment, Supabase Realtime not configured.

## Solution

Replace the three conflicting workflows with two clean ones. Update the pipeline workflow. Add Realtime config. Write a one-time secrets setup guide.

## Workflow Architecture

### deploy.yml (push to main + workflow_dispatch)

```
quality (lint + test)
    ├─→ deploy-pages (needs: quality)   — React build → GitHub Pages
    └─→ deploy-functions (needs: quality) — supabase functions deploy (all 4)
```

### ci.yml (pull_request to main)

```
quality (lint + test only, no deploy)
```

### data_sync.yml (push to main + schedule every 15 min weekdays)

```
sync — pip install → python pipeline/fetch_and_score.py → open issue on failure
```

## Secrets Required

### GitHub Actions Secrets (repo Settings → Secrets → Actions)

| Secret | Used by | Description |
|--------|---------|-------------|
| `VITE_SUPABASE_URL` | deploy.yml build | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | deploy.yml build | Supabase anon key |
| `SUPABASE_ACCESS_TOKEN` | deploy.yml functions | Personal access token for Supabase CLI |
| `SUPABASE_PROJECT_ID` | deploy.yml functions | Project ref (e.g. cbvuewxjacuqyxkpwoum) |
| `SUPABASE_SYNC_URL` | data_sync.yml | sync-ingest endpoint URL |
| `SYNC_API_KEY` | data_sync.yml | Shared API key for pipeline → Edge Functions |
| `SUPABASE_ALERTS_URL` | data_sync.yml | check-alerts endpoint URL (optional) |
| `SUPABASE_PRICES_URL` | data_sync.yml | sync-prices endpoint URL (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | data_sync.yml | Service role key for RLS bypass |

### Supabase Secrets (set via CLI)

| Secret | Used by | Description |
|--------|---------|-------------|
| `ANTHROPIC_API_KEY` | ai-brief, ai-analysis | Claude Haiku 4.5 + Sonnet 4.6 |
| `SYNC_API_KEY` | sync-ingest, check-alerts | Must match GitHub secret value |

## Realtime Config

`supabase/config.toml` gets a Realtime block that enables broadcasting on the `script_runs` table.
The existing `useRunWatcher()` hook subscribes to this channel and invalidates all TanStack Query caches on INSERT.

## Files Changed

See implementation plan: `docs/superpowers/plans/2026-04-04-deployment-setup.md`
