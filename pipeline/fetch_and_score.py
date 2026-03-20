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
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import requests
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

SYNC_URL = os.environ["SUPABASE_SYNC_URL"]
SYNC_API_KEY = os.environ["SYNC_API_KEY"]

UNIVERSE: list[str] = [
    # Under $10
    "PLUG",
    "NIO",
    "SOFI",
    "MARA",
    "VALE",
    "F",
    "AAL",
    "SNAP",
    "NOK",
    "XPEV",
    # Swing Trade Leaders 2026
    "LMT",
    "CIEN",
    "FIX",
    "MPC",
    "MU",
    "AMAT",
    "NVDA",
    "META",
    "TSLA",
    "AMZN",
    "MSFT",
    "AAPL",
    "GE",
    "FDX",
    "GOOGL",
]
UNIVERSE_NAME = "SwingPulse 25 — v1.0"


# ── Indicator helpers ─────────────────────────────────────────────────────────


def rsi(close: pd.Series, period: int = 14) -> float:
    """Wilder RSI via EWM (alpha = 1/period)."""
    delta = close.diff(1).dropna()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
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

    # ── Signal checklist ────────────────────────────────────────────────────
    long_signals = {
        "sma200": price > sma200,
        "sma50": price > sma50,
        "rsiMomentum": rsi_val > 55,
        "volume": vol_ratio > 1.5,
        "macd": macd_l > macd_s,
        "priceAction": price > high_20,  # breakout above 20d structure
        "trendStrength": sma50 > sma200,
        "earningsSetup": False,  # no free real-time earnings calendar
    }
    short_signals = {
        "sma200": price < sma200,
        "sma50": price < sma50,
        "rsiMomentum": rsi_val < 45,
        "volume": vol_ratio > 1.5,  # high vol confirms either direction
        "macd": macd_l < macd_s,
        "priceAction": price < low_20,  # breakdown below 20d structure
        "trendStrength": sma50 < sma200,
        "earningsSetup": False,
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

    return {
        "ticker": ticker,
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
        "news": [],  # enrichment step to be added separately
        "earnings_date": None,
        "earnings_warning": False,
    }


# ── Regime ────────────────────────────────────────────────────────────────────


def compute_regime(spy_df: pd.DataFrame, vix_price: float) -> dict:
    """Derive market regime status and score from SPY OHLCV + VIX."""
    close = spy_df["Close"]
    high = spy_df["High"]
    low = spy_df["Low"]

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


# ── Main ──────────────────────────────────────────────────────────────────────


def main() -> None:
    run_id = (
        f"swingpulse-"
        f"{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}-"
        f"{uuid.uuid4().hex[:6]}"
    )
    logger.info("=" * 60)
    logger.info(f"Run ID : {run_id}")
    logger.info(f"Tickers: {len(UNIVERSE)} ({UNIVERSE_NAME})")
    logger.info("=" * 60)

    # ── Download ─────────────────────────────────────────────────────────────
    download_list = UNIVERSE + ["SPY", "^VIX"]
    logger.info(f"Downloading 1y daily OHLCV for {len(download_list)} symbols…")

    raw: pd.DataFrame = yf.download(
        tickers=download_list,
        period="1y",  # enough history for SMA200
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=True,
        group_by="column",  # default: outer=field, inner=ticker
    )

    def get_df(ticker: str) -> pd.DataFrame:
        """Extract single-ticker OHLCV from the bulk MultiIndex download."""
        try:
            df = raw.xs(ticker, level=1, axis=1).dropna(how="all").copy()
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
        logger.error("SPY data unavailable — aborting run")
        raise RuntimeError("SPY data unavailable")

    regime = compute_regime(spy_df, vix_price)
    logger.info(
        f"Regime : {regime['status']} | "
        f"SPY={regime['spy_price']} | SMA200={regime['sma_200']} | "
        f"RSI={regime['spy_rsi']} | Score={regime['regime_score']}"
    )

    # ── Score all tickers ────────────────────────────────────────────────────
    stocks_payload: list[dict] = []
    skipped: list[str] = []

    for ticker in UNIVERSE:
        df = get_df(ticker)
        if df.empty or len(df) < 30:
            logger.warning(f"{ticker:6s}: insufficient data — skipping")
            skipped.append(ticker)
            continue
        try:
            scored = score_ticker(ticker, df)
            stocks_payload.append(scored)
            logger.info(
                f"{ticker:6s}: {scored['trade_type']:5s} | "
                f"bull={scored['bull_score']} bear={scored['bear_score']} | "
                f"${scored['price']:.2f}  RSI={scored['rsi']}"
            )
        except Exception as exc:
            logger.error(f"{ticker:6s}: scoring failed — {exc}", exc_info=True)
            skipped.append(ticker)

    logger.info(
        f"Scored {len(stocks_payload)}/{len(UNIVERSE)} tickers"
        + (f" | Skipped: {skipped}" if skipped else "")
    )

    if not stocks_payload:
        logger.error("No stocks scored — aborting POST")
        raise RuntimeError("No stocks scored")

    # ── POST to Supabase Edge Function ───────────────────────────────────────
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
    resp = requests.post(SYNC_URL, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()

    result = resp.json()
    logger.info(f"Sync complete → {result}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
