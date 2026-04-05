# SwingPulse Deployment Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up full automated deployment so one push to main deploys the React app to GitHub Pages and all 4 Supabase Edge Functions, while the Python pipeline runs every 15 min and on every push to main.

**Architecture:** Replace three conflicting/redundant GitHub Actions workflows with two clean ones (`deploy.yml` with 3 jobs, `ci.yml` for PRs). Update the data pipeline schedule from 30 min to 15 min and add a push-to-main trigger. Add Supabase Realtime config for `script_runs` so the UI auto-refreshes. Write a one-time secrets setup guide.

**Tech Stack:** GitHub Actions, Bun, Vite, Supabase CLI, Deno Edge Functions, Python 3.11

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Delete | `.github/workflows/static.yml` | Conflicting Pages workflow (uploads entire repo) |
| Delete | `.github/workflows/webpack.yml` | Redundant CI build with no lint/test |
| Replace | `.github/workflows/deploy.yml` | 3-job pipeline: quality → deploy-pages + deploy-functions |
| Create | `.github/workflows/ci.yml` | PR-only lint + test |
| Modify | `.github/workflows/data_sync.yml` | Schedule 30→15 min, add push trigger |
| Modify | `supabase/config.toml` | Append Realtime block for script_runs |
| Create | `DEPLOYMENT.md` | One-time secrets setup guide |
| Create | `docs/superpowers/specs/2026-04-04-deployment-design.md` | Approved design doc |

---

## Task 0: Write Design Doc

**Files:**
- Create: `docs/superpowers/specs/2026-04-04-deployment-design.md`

- [ ] **Step 1: Create the design doc**

Create `docs/superpowers/specs/2026-04-04-deployment-design.md` with:

```markdown
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
```

- [ ] **Step 2: Commit design doc**

```bash
git add docs/superpowers/specs/2026-04-04-deployment-design.md docs/superpowers/plans/2026-04-04-deployment-setup.md
git commit -m "docs: add deployment design spec and implementation plan"
```

---

## Task 1: Delete Conflicting Workflows

**Files:**
- Delete: `.github/workflows/static.yml`
- Delete: `.github/workflows/webpack.yml`

- [ ] **Step 1: Delete the files**

```bash
rm .github/workflows/static.yml .github/workflows/webpack.yml
```

- [ ] **Step 2: Verify deletion**

```bash
ls .github/workflows/
```

Expected output: only `deploy.yml` and `data_sync.yml` remain (ci.yml doesn't exist yet).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: remove conflicting static.yml and redundant webpack.yml workflows"
```

---

## Task 2: Rewrite deploy.yml

**Files:**
- Replace: `.github/workflows/deploy.yml`

- [ ] **Step 1: Overwrite deploy.yml with the new 3-job workflow**

Write `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  quality:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.x"

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test

  deploy-pages:
    name: Deploy → GitHub Pages
    needs: quality
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.x"

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  deploy-functions:
    name: Deploy → Supabase Edge Functions
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

- [ ] **Step 2: Verify YAML is valid**

```bash
cat .github/workflows/deploy.yml
```

Confirm it prints without errors and the 3 jobs (`quality`, `deploy-pages`, `deploy-functions`) are visible.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: rewrite deploy.yml — 3-job pipeline (quality → pages + functions in parallel)"
```

---

## Task 3: Create ci.yml

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create ci.yml**

Write `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.x"

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add ci.yml for PR quality checks (lint + test, no deploy)"
```

---

## Task 4: Update data_sync.yml

**Files:**
- Modify: `.github/workflows/data_sync.yml` (lines 3–8 only — the `on:` block)

- [ ] **Step 1: Replace the `on:` block**

In `.github/workflows/data_sync.yml`, replace the current `on:` block (lines 3–8):

```yaml
on:
  # Runs every 30 minutes during US market hours (Mon–Fri, ~9AM–5:30PM ET / 13:00–21:30 UTC)
  schedule:
    - cron: "*/30 13-21 * * 1-5"
  # Allow manual trigger from the Actions tab
  workflow_dispatch:
```

With:

```yaml
on:
  push:
    branches: [main]
  # Runs every 15 minutes during US market hours (Mon–Fri, ~9AM–5:30PM ET / 13:00–21:30 UTC)
  schedule:
    - cron: "*/15 13-21 * * 1-5"
  # Allow manual trigger from the Actions tab
  workflow_dispatch:
```

Everything else in the file stays exactly the same.

- [ ] **Step 2: Verify the change**

```bash
head -12 .github/workflows/data_sync.yml
```

Expected output:
```
name: SwingPulse Data Sync

on:
  push:
    branches: [main]
  # Runs every 15 minutes during US market hours (Mon–Fri, ~9AM–5:30PM ET / 13:00–21:30 UTC)
  schedule:
    - cron: "*/15 13-21 * * 1-5"
  # Allow manual trigger from the Actions tab
  workflow_dispatch:
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/data_sync.yml
git commit -m "ci: pipeline schedule 30→15 min, add push-to-main trigger"
```

---

## Task 5: Add Realtime Config to supabase/config.toml

**Files:**
- Modify: `supabase/config.toml`

Current file content (6 lines):
```toml
project_id = "cbvuewxjacuqyxkpwoum"

[functions.sync-ingest]
verify_jwt = false

[functions.sync-prices]
verify_jwt = false

[functions.ai-analysis]
verify_jwt = true

[functions.ai-brief]
verify_jwt = true

[functions.check-alerts]
verify_jwt = false
```

- [ ] **Step 1: Append Realtime block to supabase/config.toml**

Append to the end of `supabase/config.toml`:

```toml

[realtime]
enabled = true

[[realtime.tables]]
schema = "public"
table = "script_runs"
filter = ""
```

- [ ] **Step 2: Verify**

```bash
cat supabase/config.toml
```

Expected: original content plus the 6-line Realtime block at the bottom.

- [ ] **Step 3: Commit**

```bash
git add supabase/config.toml
git commit -m "feat: enable Supabase Realtime on script_runs table"
```

---

## Task 6: Create DEPLOYMENT.md

**Files:**
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Create DEPLOYMENT.md**

Write `DEPLOYMENT.md`:

```markdown
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
3. **Deploy → Supabase Edge Functions** — deploys all 4 functions via Supabase CLI

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
```

- [ ] **Step 2: Commit**

```bash
git add DEPLOYMENT.md
git commit -m "docs: add DEPLOYMENT.md — one-time secrets setup and operations guide"
```

---

## Verification Checklist

After all tasks are committed, verify the end state:

- [ ] `git status` is clean (no untracked or modified files)
- [ ] `.github/workflows/` contains exactly: `ci.yml`, `deploy.yml`, `data_sync.yml`
- [ ] `deploy.yml` has 3 jobs: `quality`, `deploy-pages`, `deploy-functions`
- [ ] `ci.yml` triggers only on `pull_request` to `main`
- [ ] `data_sync.yml` has both `push: branches: [main]` and `cron: "*/15 13-21 * * 1-5"`
- [ ] `supabase/config.toml` ends with the `[realtime]` block
- [ ] `DEPLOYMENT.md` exists in repo root
- [ ] Push to main → Actions shows `Deploy` workflow with 3 jobs running
- [ ] Pages URL loads app (mock data visible without Supabase secrets)
- [ ] Supabase dashboard → Edge Functions shows 4 functions with fresh `deployed_at`
