#!/usr/bin/env python3
"""
SwingPulse 25 — Live data pump
Fetches OHLCV from Yahoo Finance, computes RSI/SMA/ATR/MACD/Volume in pure
pandas, scores all 25 tickers, then POSTs the complete payload to the
Supabase sync-ingest Edge Function.

Usage:
    python pipeline/fetch_and_score.py

Required env vars (set in .env or GitHub Actions secrets):
    SUPABASE_SYNC_URL   — Edge Function URL
    SYNC_API_KEY        — must match SYNC_API_KEY secret in Supabase
"""

import os
import uuid
import logging
import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime as dt, timezone

import numpy as np
import pandas as pd
import requests
import yfinance as yf
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, before_sleep_log

from universe import UNIVERSE, TICKER_NAMES

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

SYNC_URL = os.environ["SUPABASE_SYNC_URL"]
PRICES_URL = os.environ.get("SUPABASE_PRICES_URL", "")  # optional — skip if not set
ALERTS_URL = os.environ.get("SUPABASE_ALERTS_URL", "")  # optional — skip if not set
SYNC_API_KEY = os.environ["SYNC_API_KEY"]
UNIVERSE_NAME = "SwingPulse 25 — v1.0"


# ── Indicator helpers ─────────────────────────────────────────────────────────


def rsi(close: pd.Series, period: int = 14) -> float:
    """Wilder RSI via EWM (alpha = 1/period)."""
    delta = close.diff(1).dropna()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    if float(avg_loss.iloc[-1]) == 0:
        return 100.0
    rs = avg_gain / avg_loss.replace(0, np.nan)
    value = float((100 - 100 / (1 + rs)).iloc[-1])
    return round(value, 2) if not np.isnan(value) else 50.0


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> float:
    """Average True Range via EWM span."""
    prev_c = close.shift(1)
    tr = pd.concat(
        [
            high - low,
            (high - prev_c).abs(),
            (low - prev_c).abs(),
        ],
        axis=1,
    ).max(axis=1)
    value = float(tr.ewm(span=period, adjust=False).mean().iloc[-1])
    return round(value, 4) if not np.isnan(value) else 0.01


def macd(close: pd.Series) -> tuple[float, float]:
    """Returns (macd_line, signal_line)."""
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    return float(macd_line.iloc[-1]), float(signal_line.iloc[-1])


def sma(series: pd.Series, period: int) -> float:
    """Safe rolling SMA — falls back to expanding mean if series is short."""
    if len(series) >= period:
        return float(series.rolling(period).mean().iloc[-1])
    return float(series.mean())


# ── Earnings helper ───────────────────────────────────────────────────────────


def get_earnings_info(ticker: str) -> tuple[str | None, bool]:
    """Fetches next earnings date via yfinance .calendar.

    Returns:
        (earnings_date_iso, earnings_warning)
        earnings_date_iso: "YYYY-MM-DD" string or None if unavailable.
        earnings_warning:  True if earnings fall within the next 14 days.
    """
    try:
        cal = yf.Ticker(ticker).calendar
        if cal is None:
            return None, False
        # yfinance returns a dict-like; 'Earnings Date' is a list of dates
        earn_dates = cal.get("Earnings Date") if isinstance(cal, dict) else None
        if not earn_dates:
            return None, False
        next_date = earn_dates[0]
        if hasattr(next_date, "date"):
            next_date = next_date.date()
        today = datetime.date.today()
        if next_date < today:
            return None, False  # past date — ignore
        iso = next_date.isoformat()
        warning = (next_date - today).days <= 14
        return iso, warning
    except Exception as exc:
        logger.debug("Earnings fetch failed for %s: %s", ticker, exc)
        return None, False


# ── News sentiment ────────────────────────────────────────────────────────────

# Keyword-based sentiment classifier — fast, zero-latency, no API cost.
# Runs on the headline text before any LLM call is available.
_BULLISH_WORDS = frozenset([
    "beat", "beats", "record", "surge", "rally", "upgrade", "buy", "outperform",
    "strong", "growth", "profit", "revenue", "raised", "guidance", "bullish",
    "breakthrough", "milestone", "acquisition", "dividend", "buyback", "partnership",
    "upside", "exceeds", "above", "positive", "expansion", "launch", "wins",
])
_BEARISH_WORDS = frozenset([
    "miss", "misses", "decline", "fall", "drop", "downgrade", "sell", "underperform",
    "weak", "loss", "layoff", "layoffs", "cut", "lower", "below", "warning",
    "concern", "concerns", "recall", "lawsuit", "fraud", "investigation", "halt",
    "bankruptcy", "default", "bearish", "downside", "negative", "disappoints",
])


def classify_sentiment(title: str) -> str:
    """Classify headline sentiment as bullish, bearish, or neutral using keywords."""
    words = set(title.lower().replace(",", " ").replace(".", " ").split())
    bull_hits = len(words & _BULLISH_WORDS)
    bear_hits = len(words & _BEARISH_WORDS)
    if bull_hits > bear_hits:
        return "bullish"
    if bear_hits > bull_hits:
        return "bearish"
    return "neutral"


# ── News helper ───────────────────────────────────────────────────────────────


def get_news(ticker: str, max_items: int = 5) -> list[dict]:
    """Fetches latest news headlines from yfinance with keyword sentiment scoring.

    Returns a list of NewsItem-compatible dicts with keys:
        title, date, source, summary, url, sentiment
    """
    try:
        raw_news = yf.Ticker(ticker).news or []
        items = []
        for article in raw_news[:max_items]:
            content = (
                article.get("content", {})
                if isinstance(article.get("content"), dict)
                else {}
            )
            title = content.get("title") or article.get("title", "")
            url = (
                content.get("canonicalUrl", {}).get("url")
                or content.get("clickThroughUrl", {}).get("url")
                or article.get("link", "")
                or article.get("url", "")
            )
            source = content.get("provider", {}).get("displayName") or article.get(
                "publisher", ""
            )
            pub_time = article.get("providerPublishTime") or content.get("pubDate", "")
            if pub_time:
                try:
                    pub_dt = dt.fromtimestamp(int(pub_time), tz=timezone.utc)
                    date_str = pub_dt.strftime("%b %d")
                except (TypeError, ValueError, OSError):
                    date_str = str(pub_time)[:10]
            else:
                date_str = ""

            if not title:
                continue
            items.append(
                {
                    "title": title,
                    "date": date_str,
                    "source": source or None,
                    "summary": None,
                    "url": url or None,
                    "sentiment": classify_sentiment(title),
                }
            )
        return items
    except Exception as exc:
        logger.debug("News fetch failed for %s: %s", ticker, exc)
        return []


# ── Short interest helper ─────────────────────────────────────────────────────


def get_short_interest(ticker: str) -> float | None:
    """Fetch short interest as % of float from yfinance.

    Returns a percentage float (e.g. 15.3 for 15.3%) or None if unavailable.
    """
    try:
        info = yf.Ticker(ticker).info
        val = info.get("shortPercentOfFloat")
        if val is None:
            return None
        return round(float(val) * 100, 2)  # convert 0.153 → 15.3%
    except Exception as exc:
        logger.debug("Short interest fetch failed for %s: %s", ticker, exc)
        return None


# ── Scoring ───────────────────────────────────────────────────────────────────


def score_ticker(ticker: str, df: pd.DataFrame) -> dict:
    """
    Compute all signals, scores, and entry parameters for one ticker.

    Returns a dict matching the stocks table schema / sync-ingest payload contract.
    """
    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    vol = df["Volume"]

    price = float(close.iloc[-1])
    sma200 = sma(close, 200)
    sma50 = sma(close, 50)
    rsi_val = rsi(close)
    atr_val = atr(high, low, close)
    macd_l, macd_s = macd(close)

    # Volume ratio vs 20-day avg
    vol_ma20 = (
        float(vol.rolling(20).mean().iloc[-1]) if len(vol) >= 20 else float(vol.mean())
    )
    vol_ratio = round(float(vol.iloc[-1]) / vol_ma20, 2) if vol_ma20 > 0 else 1.0
    volume_spike = vol_ratio > 2.0

    # 20-day high/low using bars excluding today (structural reference)
    window = df.iloc[-21:-1] if len(df) >= 21 else df.iloc[:-1]
    high_20 = float(window["High"].max()) if not window.empty else price
    low_20 = float(window["Low"].min()) if not window.empty else price

    # 52-week metrics
    yr_window = df.iloc[-252:] if len(df) >= 252 else df
    yr_high = float(yr_window["High"].max())
    yr_low = float(yr_window["Low"].min())
    yr_range = yr_high - yr_low
    distance_52w = (
        round((price - yr_low) / yr_range * 100 - 50, 1) if yr_range > 0 else 0.0
    )

    # ── Earnings signal ──────────────────────────────────────────────────────
    earnings_date, earnings_warning = get_earnings_info(ticker)
    # Earnings setup: true if there's an earnings date 2–14 days out (upcoming
    # catalyst window — not too close to avoid gap risk, not too far to be stale)
    earnings_setup = False
    if earnings_date:
        try:
            earn_dt = datetime.date.fromisoformat(earnings_date)
            days_to_earn = (earn_dt - datetime.date.today()).days
            earnings_setup = 2 <= days_to_earn <= 14
        except (ValueError, TypeError):
            pass

    # ── Signal checklist ────────────────────────────────────────────────────
    long_signals = {
        "sma200": price > sma200,
        "sma50": price > sma50,
        "rsiMomentum": rsi_val > 55,
        "volume": vol_ratio > 1.5,
        "macd": macd_l > macd_s,
        "priceAction": price > high_20,  # breakout above 20d structure
        "trendStrength": sma50 > sma200,
        "earningsSetup": earnings_setup,
    }
    short_signals = {
        "sma200": price < sma200,
        "sma50": price < sma50,
        "rsiMomentum": rsi_val < 45,
        "volume": vol_ratio > 1.5,  # high vol confirms either direction
        "macd": macd_l < macd_s,
        "priceAction": price < low_20,  # breakdown below 20d structure
        "trendStrength": sma50 < sma200,
        "earningsSetup": earnings_setup,
    }

    bull_score = sum(long_signals.values())
    bear_score = sum(short_signals.values())
    trade_type = "LONG" if bull_score >= bear_score else "SHORT"
    is_long = trade_type == "LONG"
    signals = long_signals if is_long else short_signals

    # ── Entry / Stop / Target (ATR multiples) ───────────────────────────────
    # 0.5× ATR cushion for entry, 2× stop, 4× target → fixed 2.0 R:R
    best_entry = round(price, 4)
    entry_atr = round(price - 0.5 * atr_val if is_long else price + 0.5 * atr_val, 4)
    entry_structure = round(low_20 if is_long else high_20, 4)
    stop_loss = round(price - 2.0 * atr_val if is_long else price + 2.0 * atr_val, 4)
    target = round(price + 4.0 * atr_val if is_long else price - 4.0 * atr_val, 4)
    risk = abs(best_entry - stop_loss)
    reward = abs(target - best_entry)
    risk_reward = round(reward / risk, 2) if risk > 0 else 2.0

    conflict_trend = (sma50 < sma200) if is_long else (sma50 > sma200)

    # ── Live news ────────────────────────────────────────────────────────────
    news = get_news(ticker)

    # ── Short interest ────────────────────────────────────────────────────────
    short_interest = get_short_interest(ticker)

    return {
        "ticker": ticker,
        "name": TICKER_NAMES.get(ticker, ticker),
        "trade_type": trade_type,
        "bull_score": bull_score,
        "bear_score": bear_score,
        "price": round(price, 4),
        "rsi": rsi_val,
        "volume_ratio": vol_ratio,
        "volume_spike": bool(volume_spike),
        "signals": {k: bool(v) for k, v in signals.items()},
        "entry_atr": entry_atr,
        "entry_structure": entry_structure,
        "best_entry": best_entry,
        "stop_loss": stop_loss,
        "target": target,
        "risk_reward": risk_reward,
        "atr": round(atr_val, 4),
        "distance_52w": distance_52w,
        "conflict_trend": bool(conflict_trend),
        "short_interest": short_interest,
        "news": news,
        "earnings_date": earnings_date,
        "earnings_warning": bool(earnings_warning),
    }


# ── Regime ────────────────────────────────────────────────────────────────────


def compute_regime(spy_df: pd.DataFrame, vix_price: float) -> dict:
    """Derive market regime status and score from SPY OHLCV + VIX."""
    close = spy_df["Close"]

    spy_price = float(close.iloc[-1])
    sma200 = sma(close, 200)
    sma50 = sma(close, 50)
    spy_rsi = rsi(close)
    ratio = round(spy_price / sma200, 4) if sma200 > 0 else 1.0

    bullish_conditions = [
        spy_price > sma200,
        spy_price > sma50,
        spy_rsi > 50,
        sma50 > sma200,
        vix_price < 20,
        ratio > 1.0,
    ]
    regime_score = int(sum(bullish_conditions))

    if spy_price > sma200 and spy_rsi > 50:
        status = "BULLISH"
    elif spy_price < sma200:
        status = "BEARISH"
    else:
        status = "NEUTRAL"

    return {
        "status": status,
        "spy_price": round(spy_price, 2),
        "sma_200": round(sma200, 2),
        "sma_50": round(sma50, 2),
        "spy_rsi": spy_rsi,
        "vix": round(vix_price, 2),
        "ratio": ratio,
        "regime_score": regime_score,
    }


# ── Supabase POST with retry ───────────────────────────────────────────────────


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=5, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def post_to_supabase(payload: dict, headers: dict) -> dict:
    """POST payload to Supabase Edge Function with exponential-backoff retry.

    Retries up to 3 times (5s → 15s → 30s) on any network or server error.
    Raises on final failure.
    """
    resp = requests.post(SYNC_URL, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=5, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def post_prices_to_supabase(prices_payload: list[dict], headers: dict) -> dict:
    """POST OHLCV price history to sync-prices Edge Function with retry."""
    resp = requests.post(
        PRICES_URL,
        json={"prices": prices_payload},
        headers=headers,
        timeout=120,  # larger timeout — potentially 25 × 252 rows ≈ 6300 rows
    )
    resp.raise_for_status()
    return resp.json()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=5, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def post_alerts_check(stocks_payload: list[dict], headers: dict) -> dict:
    """POST scored stocks to check-alerts Edge Function (best-effort)."""
    resp = requests.post(
        ALERTS_URL,
        json={"stocks": stocks_payload},
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def build_price_payload(raw: "pd.DataFrame", get_df_fn) -> list[dict]:
    """Builds the flat list of OHLCV dicts for the sync-prices endpoint.

    Iterates through the UNIVERSE, extracts the full 252-day history for each
    ticker, and returns rows suitable for price_history table insertion.
    """
    rows: list[dict] = []
    for ticker in UNIVERSE:
        df = get_df_fn(ticker)
        if df.empty:
            continue
        yr_df = df.iloc[-252:] if len(df) >= 252 else df
        for date_idx, row in yr_df.iterrows():
            rows.append(
                {
                    "ticker": ticker,
                    "date": date_idx.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 4),
                    "high": round(float(row["High"]), 4),
                    "low": round(float(row["Low"]), 4),
                    "close": round(float(row["Close"]), 4),
                    "volume": (
                        int(row["Volume"]) if not pd.isna(row["Volume"]) else None
                    ),
                }
            )
    return rows


# ── Main ──────────────────────────────────────────────────────────────────────


def main() -> None:
    run_id = (
        f"swingpulse-"
        f"{dt.now(timezone.utc).strftime('%Y%m%d-%H%M')}-"
        f"{uuid.uuid4().hex[:6]}"
    )
    logger.info("=" * 60)
    logger.info(f"Run ID : {run_id}")
    logger.info(f"Tickers: {len(UNIVERSE)} ({UNIVERSE_NAME})")
    logger.info("=" * 60)

    # ── Download ─────────────────────────────────────────────────────────────
    download_list = UNIVERSE + ["SPY", "^VIX"]
    logger.info(f"Downloading 1y daily OHLCV for {len(download_list)} symbols…")

    raw: pd.DataFrame | None = yf.download(
        tickers=download_list,
        period="1y",  # enough history for SMA200
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=True,
        group_by="column",  # default: outer=field, inner=ticker
    )

    if raw is None or raw.empty:
        raise RuntimeError("yf.download returned no data — aborting run")

    def get_df(ticker: str) -> pd.DataFrame:
        """Extract single-ticker OHLCV from the bulk MultiIndex download."""
        try:
            result = raw.xs(ticker, level=1, axis=1).dropna(how="all")
            df = pd.DataFrame(result).copy()
            df.index = pd.to_datetime(df.index)
            return df.sort_index()
        except (KeyError, TypeError):
            return pd.DataFrame()

    # ── VIX ──────────────────────────────────────────────────────────────────
    vix_df = get_df("^VIX")
    vix_price = float(vix_df["Close"].iloc[-1]) if not vix_df.empty else 20.0
    logger.info(f"VIX: {vix_price:.2f}")

    # ── SPY / Regime ─────────────────────────────────────────────────────────
    spy_df = get_df("SPY")
    if spy_df.empty or len(spy_df) < 20:
        logger.warning(
            "SPY data unavailable — using NEUTRAL regime fallback. "
            "Ticker scoring will continue."
        )
        regime = {
            "status": "NEUTRAL",
            "spy_price": 0.0,
            "sma_200": 0.0,
            "sma_50": 0.0,
            "spy_rsi": 50.0,
            "vix": vix_price,
            "ratio": 1.0,
            "regime_score": 0,
        }
    else:
        regime = compute_regime(spy_df, vix_price)
    logger.info(
        f"Regime : {regime['status']} | "
        f"SPY={regime['spy_price']} | SMA200={regime['sma_200']} | "
        f"RSI={regime['spy_rsi']} | Score={regime['regime_score']}"
    )

    # ── Score all tickers in parallel ────────────────────────────────────────
    ticker_dfs = {t: get_df(t) for t in UNIVERSE}
    stocks_payload: list[dict] = []
    skipped: list[str] = []

    def process_ticker(ticker: str) -> dict | None:
        df = ticker_dfs[ticker]
        if df.empty or len(df) < 30:
            logger.warning(f"{ticker:6s}: insufficient data — skipping")
            return None
        try:
            scored = score_ticker(ticker, df)
            logger.info(
                f"{ticker:6s}: {scored['trade_type']:5s} | "
                f"bull={scored['bull_score']} bear={scored['bear_score']} | "
                f"${scored['price']:.2f}  RSI={scored['rsi']} | "
                f"earn={scored['earnings_date'] or '—'}  news={len(scored['news'])}"
            )
            return scored
        except Exception as exc:
            logger.error(f"{ticker:6s}: scoring failed — {exc}", exc_info=True)
            return None

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(process_ticker, t): t for t in UNIVERSE}
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                stocks_payload.append(result)
            else:
                skipped.append(futures[future])

    # Restore deterministic ordering for consistent run-over-run diffs
    order = {t: i for i, t in enumerate(UNIVERSE)}
    stocks_payload.sort(key=lambda s: order.get(s["ticker"], 999))

    logger.info(
        f"Scored {len(stocks_payload)}/{len(UNIVERSE)} tickers"
        + (f" | Skipped: {skipped}" if skipped else "")
    )

    if not stocks_payload:
        logger.error("No stocks scored — aborting POST")
        raise RuntimeError("No stocks scored")

    # ── POST to Supabase Edge Function (with retry) ───────────────────────────
    payload = {
        "run_id": run_id,
        "universe": UNIVERSE_NAME,
        "regime": regime,
        "stocks": stocks_payload,
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": SYNC_API_KEY,
    }

    logger.info(f"POSTing payload ({len(stocks_payload)} stocks) to Supabase…")
    result = post_to_supabase(payload, headers)
    logger.info(f"Sync complete → {result}")

    # ── Upload price history (best-effort — skip if PRICES_URL not configured) ─
    if PRICES_URL:
        logger.info("Building price history payload…")
        prices_payload = build_price_payload(raw, get_df)
        logger.info(f"POSTing {len(prices_payload)} OHLCV rows to sync-prices…")
        try:
            prices_result = post_prices_to_supabase(prices_payload, headers)
            logger.info(f"Price history sync complete → {prices_result}")
        except Exception as exc:
            # Non-fatal — scoring sync already succeeded; log and continue
            logger.error(f"Price history upload failed (non-fatal): {exc}")
    else:
        logger.info("SUPABASE_PRICES_URL not set — skipping price history upload")

    # ── Check alerts (best-effort — skip if ALERTS_URL not configured) ───────
    if ALERTS_URL:
        logger.info(f"Checking alerts for {len(stocks_payload)} scored stocks…")
        try:
            alerts_result = post_alerts_check(stocks_payload, headers)
            logger.info(f"Alert check complete → {alerts_result}")
        except Exception as exc:
            logger.error(f"Alert check failed (non-fatal): {exc}")
    else:
        logger.info("SUPABASE_ALERTS_URL not set — skipping alert check")

    logger.info("=" * 60)


if __name__ == "__main__":
    main()
